# ORDS Security: Hardening, CORS, Rate Limiting, and Defense-in-Depth

## Overview

Securing ORDS involves multiple layers: enforcing HTTPS transport, configuring CORS policies for browser clients, protecting endpoints with OAuth2 privileges, preventing SQL injection through correct bind variable usage, managing database credentials securely, and monitoring for suspicious activity. ORDS exposes Oracle Database functionality over HTTP, making it a critical security boundary — a misconfiguration can expose sensitive data or allow unauthorized data modification.

This guide covers ORDS-specific security controls, complementing Oracle Database security features (VPD, Vault, Audit).

---

## Enforcing HTTPS

Never expose ORDS over plain HTTP in any non-development environment. Configure ORDS to refuse or redirect HTTP requests.

### Force HTTPS in ORDS Configuration

```shell
# Require HTTPS for all requests
ords --config /opt/oracle/ords/config config set security.forceHTTPS true
```

When `security.forceHTTPS = true`, ORDS:
- Redirects HTTP requests to HTTPS (301)
- Adds `Strict-Transport-Security` header to responses

### HTTPS with ORDS Standalone (Production Certificate)

Using a certificate from Let's Encrypt or a commercial CA:

```shell
# Convert PEM certificate to PKCS12 for Java keystore
openssl pkcs12 -export \
  -in /etc/ssl/certs/api.example.com.crt \
  -inkey /etc/ssl/private/api.example.com.key \
  -certfile /etc/ssl/certs/chain.crt \
  -out /opt/oracle/ords/config/ords/standalone/api.p12 \
  -name ords-ssl \
  -passout pass:changeit

# Configure ORDS to use it
ords --config /opt/oracle/ords/config config set standalone.https.port 443
ords --config /opt/oracle/ords/config config set standalone.https.cert \
  /opt/oracle/ords/config/ords/standalone/api.p12
ords --config /opt/oracle/ords/config config set \
  standalone.https.cert.secret changeit
```

### TLS Minimum Version and Cipher Suites

Disable obsolete TLS versions by setting JVM options:

```shell
# /etc/systemd/system/ords.service
[Service]
Environment="JAVA_OPTS=-Djdk.tls.disabledAlgorithms=SSLv3,TLSv1,TLSv1.1,RC4,DES,MD5withRSA,DH keySize<2048"
```

Or in Nginx (recommended reverse proxy approach):

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
add_header Strict-Transport-Security "max-age=63072000" always;
```

---

## CORS Configuration

CORS (Cross-Origin Resource Sharing) controls which browser origins are allowed to call your ORDS endpoints. Misconfigured CORS (e.g., wildcard `*` on authenticated endpoints) is a common vulnerability.

### Configure CORS in ORDS

CORS settings are configured via the ORDS CLI:

```shell
# Allow specific origins
ords --config /opt/oracle/ords/config config set security.requestValidationFunction ords_util.authorize_plsql_gateway

# Set allowed origins (comma-separated, no wildcards for authenticated endpoints)
ords --config /opt/oracle/ords/config config set security.allowedCORSOrigins \
  "https://app.example.com,https://admin.example.com"
```

Set all CORS parameters via the ORDS CLI:

```shell
ords --config /opt/oracle/ords/config config set \
  security.allowedCORSOrigins "https://app.example.com,https://admin.example.com"
ords --config /opt/oracle/ords/config config set \
  security.allowedCORSHeaders "Authorization,Content-Type,X-Requested-With"
ords --config /opt/oracle/ords/config config set \
  security.allowedCORSMethods "GET,POST,PUT,DELETE,OPTIONS"
ords --config /opt/oracle/ords/config config set security.maxAge 3600
```

### CORS Best Practices

```shell
# WRONG: Wildcard on an authenticated API — allows any origin to send credentials
ords config set security.allowedCORSOrigins "*"

# CORRECT: Explicit trusted origins only
ords config set security.allowedCORSOrigins "https://myapp.example.com"

# For truly public read-only APIs, wildcard is acceptable
# but protect all write operations with OAuth2 regardless
ords config set security.allowedCORSOrigins "*"
```

When `security.forceHTTPS = true`, CORS allows HTTPS origins only. Mixed HTTP/HTTPS origins are rejected.

---

## Privilege-Protected vs Public Handlers

Every ORDS REST handler is either public (no authentication required) or protected (Bearer token required).

### Public Handler (no privilege attached)

```sql
-- This endpoint is accessible without authentication
BEGIN
  ORDS.DEFINE_HANDLER(
    p_module_name => 'public.api',
    p_pattern     => 'status/',
    p_method      => 'GET',
    p_source_type => ORDS.source_type_collection_item,
    p_source      => 'SELECT ''OK'' AS status, SYSDATE AS timestamp FROM DUAL'
  );
  COMMIT;
END;
/
```

### Protected Handler (privilege required)

```sql
DECLARE
  l_roles    owa.vc_arr;
  l_patterns owa.vc_arr;
  l_modules  owa.vc_arr;
BEGIN
  -- Define the privilege
  ORDS.CREATE_ROLE(p_role_name => 'HR_API_USER');
  l_roles(1) := 'HR_API_USER';

  ORDS.DEFINE_PRIVILEGE(
    p_privilege_name => 'hr.employees.read',
    p_roles          => l_roles,
    p_patterns       => l_patterns,
    p_modules        => l_modules,
    p_label          => 'Read HR Employee Data',
    p_description    => 'Required for accessing HR employee endpoints'
  );

  -- Protect the module
  ORDS.SET_MODULE_PRIVILEGE(
    p_module_name    => 'hr.employees',
    p_privilege_name => 'hr.employees.read'
  );
  COMMIT;
END;
/
```

Any request to `hr.employees` module without a valid token returns:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="hr"

{
  "code": "Unauthorized",
  "message": "Unauthorized"
}
```

### Checking Current User in Handler

```sql
-- :current_user contains the authenticated username (NULL if unauthenticated)
WHERE employee_id = :id
AND   owner_username = :current_user  -- Row-level access control
```

---

## SQL Injection Prevention

ORDS's primary defense against SQL injection is **bind parameters**. ORDS never concatenates user-supplied values into SQL strings — all request parameters are bound as variables.

### Correct: Bind Parameters

```sql
-- SAFE: employee_id is a bind variable
SELECT * FROM employees WHERE employee_id = :id

-- SAFE: VARCHAR2 bind variable
SELECT * FROM employees WHERE last_name = :last_name

-- SAFE: Used in PL/SQL
UPDATE employees SET salary = :salary WHERE employee_id = :id
```

### Wrong: Dynamic SQL Concatenation

Never do this in ORDS handlers:

```sql
-- DANGEROUS: :last_name injected into dynamic SQL
EXECUTE IMMEDIATE 'SELECT * FROM employees WHERE last_name = ''' || :last_name || '''';

-- DANGEROUS: Building WHERE clause dynamically without bind variables
l_sql := 'SELECT * FROM employees WHERE ' || :filter_column || ' = ' || :filter_value;
EXECUTE IMMEDIATE l_sql;
```

### Safe Dynamic SQL with DBMS_SQL

If dynamic SQL is genuinely required:

```sql
DECLARE
  l_cursor   INTEGER;
  l_col_name VARCHAR2(30);
  l_val      VARCHAR2(100);
  l_result   SYS_REFCURSOR;
BEGIN
  -- Validate column name against allowlist (critical!)
  IF :column_name NOT IN ('department_id', 'job_id', 'manager_id') THEN
    RAISE_APPLICATION_ERROR(-20001, 'Invalid filter column');
  END IF;

  l_col_name := :column_name;  -- Safe after allowlist check
  l_val      := :value;

  -- Use bind variable in dynamic SQL
  OPEN l_result FOR
    'SELECT * FROM employees WHERE ' || l_col_name || ' = :val'
    USING l_val;

  DBMS_SQL.RETURN_RESULT(l_result);
END;
```

### Column/Table Name Allowlisting

Column and table names cannot be parameterized as bind variables. Validate against a strict allowlist:

```sql
FUNCTION validate_column_name(p_col IN VARCHAR2) RETURN VARCHAR2 AS
  l_allowed DBMS_UTILITY.LNAME_ARRAY;
BEGIN
  -- Define allowed columns explicitly
  IF p_col NOT IN (
    'employee_id', 'department_id', 'job_id',
    'hire_date', 'salary', 'manager_id'
  ) THEN
    RAISE_APPLICATION_ERROR(-20001, 'Column not allowed for filtering: ' || p_col);
  END IF;
  RETURN DBMS_ASSERT.SIMPLE_SQL_NAME(p_col);  -- Additional validation
END;
```

---

## Secrets Management for DB Credentials

### ORDS Wallet-Based Secret Storage (Default Mechanism)

All passwords in ORDS are stored in an **Oracle Wallet** (credential store) in the `credentials/` directory of the ORDS config. Passwords never appear in any configuration file. Use `ords config secret set` to set or rotate any credential:

```shell
# Set the DB password — stored in Oracle Wallet only
ords --config /opt/oracle/ords/config config secret set db.password \
  --password-stdin <<< "MySecurePassword123!"

# Rotate a password — re-run with the new value
ords --config /opt/oracle/ords/config config secret set db.password \
  --password-stdin <<< "NewSecurePassword456!"

# Verify the wallet is present (passwords are not readable from config files)
ls /opt/oracle/ords/config/credentials/
```

Protect the `credentials/` directory with OS-level permissions (`chmod 700`) and include it in backup procedures alongside the rest of the config directory.

### OCI Vault Integration

For cloud deployments, retrieve secrets from OCI Vault at startup and pipe directly into the wallet — no intermediate file needed:

```shell
OCI_SECRET=$(oci secrets secret-bundle get \
  --secret-id ocid1.vaultsecret.oc1... \
  --query 'data."secret-bundle-content".content' \
  --raw-output | base64 --decode)

ords --config /opt/oracle/ords/config config secret set db.password \
  --password-stdin <<< "$OCI_SECRET"
```

---

## IP Allowlisting

ORDS does not natively support IP allowlisting. Implement at the network layer:

### Using Linux `iptables`

```shell
# Allow only specific IP ranges to reach ORDS port
iptables -A INPUT -p tcp --dport 8443 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 8443 -j DROP
```

### Using Nginx as Reverse Proxy

```nginx
location /ords/ {
    # Allow corporate network
    allow 10.0.0.0/8;
    allow 192.168.1.0/24;
    # Allow specific partner IPs
    allow 203.0.113.45;
    # Deny everything else
    deny all;

    proxy_pass http://localhost:8080/ords/;
}
```

### ORDS Request Validation Function

ORDS supports a PL/SQL request validation function for custom access control logic including IP checking:

```sql
CREATE OR REPLACE FUNCTION hr.ords_request_validator(
  p_method        IN VARCHAR2,
  p_path          IN VARCHAR2,
  p_content_type  IN VARCHAR2,
  p_payload       IN BLOB,
  p_env           IN OWA.vc_arr,
  p_val           IN OWA.vc_arr
) RETURN BOOLEAN AS
  l_remote_addr VARCHAR2(50);
BEGIN
  -- Get client IP from OWA environment
  FOR i IN 1..p_env.COUNT LOOP
    IF UPPER(p_env(i)) = 'REMOTE_ADDR' THEN
      l_remote_addr := p_val(i);
    END IF;
  END LOOP;

  -- Block known bad IPs
  IF l_remote_addr IN (
    SELECT ip_address FROM security.blocked_ips WHERE active = 'Y'
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
/
```

Configure in ORDS:

```shell
ords --config /opt/oracle/ords/config config set \
  security.requestValidationFunction hr.ords_request_validator
```

---

## Rate Limiting

ORDS does not include built-in rate limiting. Implement at the reverse proxy or API gateway layer.

### Nginx Rate Limiting

```nginx
# Define rate limit zone: 100 requests/minute per IP
limit_req_zone $binary_remote_addr zone=ords_limit:10m rate=100r/m;

server {
    location /ords/ {
        limit_req zone=ords_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://localhost:8080/ords/;
    }
}
```

### API Gateway Rate Limiting (OCI)

For OCI deployments, use OCI API Gateway in front of ORDS:
- Configure usage plans with request limits per client
- Apply per-client rate limits based on API keys or OAuth tokens
- Log and alert on throttled requests

---

## Oracle Database Vault Integration

Oracle Database Vault (DBV) restricts access to sensitive schemas even from privileged accounts. Combined with ORDS, DBV prevents the ORDS connection account from accessing data it shouldn't, even if ORDS is compromised.

```sql
-- Example: Create a DBV realm for the HR schema
EXEC DVSYS.DBMS_MACADM.CREATE_REALM(
  realm_name   => 'HR Protected Realm',
  description  => 'Restricts access to HR sensitive tables',
  enabled      => DVSYS.DBMS_MACUTL.G_YES,
  audit_options => DVSYS.DBMS_MACUTL.G_REALM_AUDIT_FAIL
);

-- Add HR schema objects to realm
EXEC DVSYS.DBMS_MACADM.ADD_OBJECT_TO_REALM(
  realm_name   => 'HR Protected Realm',
  object_owner => 'HR',
  object_name  => 'SALARY_DETAILS',  -- Sensitive table
  object_type  => 'TABLE'
);

-- Authorize only specific users
EXEC DVSYS.DBMS_MACADM.ADD_AUTH_TO_REALM(
  realm_name   => 'HR Protected Realm',
  grantee      => 'HR_COMPENSATION_APP',  -- Application user, NOT ORDS_PUBLIC_USER
  rule_set_name => NULL,
  auth_options => DVSYS.DBMS_MACUTL.G_REALM_AUTH_OWNER
);
```

This ensures ORDS_PUBLIC_USER (and thus the general ORDS connection) cannot access `SALARY_DETAILS`, even if an attacker manipulates ORDS handler SQL.

---

## Security HTTP Headers

Configure ORDS to return security headers:

```shell
# Via Nginx (recommended)
add_header X-Content-Type-Options    "nosniff" always;
add_header X-Frame-Options           "DENY" always;
add_header X-XSS-Protection          "1; mode=block" always;
add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy   "default-src 'self'" always;
add_header Permissions-Policy        "geolocation=(), microphone=()" always;
```

---

## Best Practices

- **Apply the principle of least privilege throughout**: ORDS_PUBLIC_USER needs only `CREATE SESSION`. REST-executing schemas need only the objects they use. No DBA accounts in any connection pool.
- **Enable `p_auto_rest_auth => TRUE` on all AutoREST schemas**: Forces authentication on all AutoREST endpoints by default. Explicitly whitelist public objects rather than defaulting to public.
- **Rotate credentials on schedule**: Client secrets, DB passwords, and SSL certificates should all have defined rotation schedules. Automate rotation using OCI Vault or HashiCorp Vault.
- **Run ORDS behind a WAF (Web Application Firewall)**: OCI WAF or AWS WAF in front of ORDS adds protection against common web attacks (OWASP Top 10) that ORDS itself does not mitigate.
- **Audit all ORDS requests**: Enable request logging and funnel logs to a SIEM. Alert on 401 spikes (credential stuffing), 500 spikes (exploitation attempts), and unusual payload sizes.
- **Keep ORDS patched**: Oracle regularly releases ORDS security patches. Subscribe to Oracle Security Alerts and update promptly.

## Common Mistakes

- **Wildcard CORS on authenticated endpoints**: `*` CORS policy with OAuth2 Bearer tokens negates the token security — any site can make cross-origin requests. Use explicit origin allowlists.
- **Attempting to write passwords into config files**: ORDS stores all credentials in an Oracle Wallet (`credentials/` directory) — passwords never belong in any config file. Use `ords config secret set db.password` to set or rotate them. Attempting to embed a password directly in a config file will not work and may break ORDS startup.
- **Not disabling Database Actions in production (if not needed)**: Database Actions (`feature.sdw=true`) provides a powerful SQL execution interface. Disable it on API-only ORDS instances: `feature.sdw=false`.
- **Using the same OAuth client for all services**: If a shared client is compromised, all services lose access. Use one OAuth client per service/application.
- **Not testing authentication on every endpoint after a schema change**: Adding a new module does not automatically protect it. Verify each new endpoint requires the expected authentication.
- **Ignoring ORA-00942 and ORA-04043 errors in ORDS logs**: These indicate missing objects or privileges — potential indicators of misconfiguration or privilege escalation attempts.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [ORDS Developer's Guide — Securing Oracle REST Data Services](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/about-oracle-rest-data-services.html)
- [ORDS Configuration Settings Reference — Security Settings](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/ordig/configuration-settings.html)
- [Oracle Database Vault Administrator's Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/dvadm/index.html)
