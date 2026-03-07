# Oracle Network Security

## Overview

The network is the attack surface between your Oracle database and every application, user, and service that connects to it. Securing Oracle's network layer means ensuring that:

1. Connections are **authenticated** — only legitimate clients can connect
2. Data in transit is **encrypted** — traffic cannot be intercepted and read
3. Access is **restricted** — only authorized hosts can reach the listener
4. The listener itself is **hardened** — it cannot be exploited to bypass database authentication

Oracle's network security stack involves the Oracle Listener, Oracle Net Services (formerly SQL*Net), `sqlnet.ora` configuration, the Oracle Wallet, and Access Control Lists (ACLs) for outbound network calls made from within the database.

---

## The Oracle Listener

The listener is the gateway to the database. It accepts incoming connection requests and hands them off to Oracle server processes. A misconfigured listener is one of the most common Oracle security vulnerabilities.

### listener.ora — Secure Configuration

```ini
# /opt/oracle/network/admin/listener.ora

# Bind only to specific interfaces — never listen on 0.0.0.0 in production
LISTENER =
  (DESCRIPTION_LIST =
    (DESCRIPTION =
      (ADDRESS = (PROTOCOL = TCPS)
                 (HOST = db-server-hostname)
                 (PORT = 2484))       # TCPS (TLS) port
      (ADDRESS = (PROTOCOL = TCP)
                 (HOST = 10.0.1.50)   # Internal IP only
                 (PORT = 1521))
    )
  )

# Disable dynamic service registration (prevents external manipulation)
# All services must be statically registered below
SECURE_REGISTER_LISTENER = (TCPS, IPC)

# Disable external procedure execution via listener (security hardening)
# Remove or comment out EXTPROC if not used
# (PROGRAM = extproc) lines should be absent from production

# Restrict listener admin operations to local connections only
ADMIN_RESTRICTIONS_LISTENER = ON
# This prevents remote LSNRCTL commands from setting log files or tracing
# which could be used to overwrite files on the server

# Static service registration (more secure than dynamic)
SID_LIST_LISTENER =
  (SID_LIST =
    (SID_DESC =
      (GLOBAL_DBNAME = ORCL)
      (ORACLE_HOME = /opt/oracle/product/19c/dbhome_1)
      (SID_NAME = ORCL)
    )
  )
```

### Listener Password (Legacy — Use ADMIN_RESTRICTIONS Instead)

```bash
# In Oracle 10g+, ADMIN_RESTRICTIONS_LISTENER = ON is preferred over a listener password
# If you must set a listener password (older environments):
lsnrctl
LSNRCTL> change_password
Old password: <enter blank>
New password: <enter new password>
Confirm password: <re-enter new password>
LSNRCTL> save_config
LSNRCTL> exit
```

### Checking Listener Status and Security

```bash
# List services (should not expose too much information)
lsnrctl status

# Check listener version (minimize version exposure in responses)
# In listener.ora, set:
# SECURE_CONTROL_LISTENER = (TCPS, IPC)

# View who is connected to the listener
lsnrctl services

# Check for unauthorized dynamic service registrations
lsnrctl show dynamic_registration
# OUTPUT should be OFF or only show known services
```

---

## SSL/TLS Configuration for Oracle

Configuring SSL/TLS for Oracle connections requires the Oracle Wallet to store the server certificate, and requires `sqlnet.ora` to be updated on both server and client sides.

### Server-Side TLS Configuration

#### Setting Up the Oracle Wallet with a Certificate

```bash
# Step 1: Create the wallet
orapki wallet create -wallet /opt/oracle/wallet/tls -auto_login
# OR for password-protected:
orapki wallet create -wallet /opt/oracle/wallet/tls -pwd WalletP@ss!

# Step 2: Generate a certificate signing request (CSR)
orapki wallet add -wallet /opt/oracle/wallet/tls \
  -dn "CN=db-server.corp.example.com,OU=Database,O=Example Corp,C=US" \
  -keysize 2048 \
  -sign_alg sha256 \
  -pwd WalletP@ss!

# Step 3: Export the CSR for signing by your CA
orapki wallet export -wallet /opt/oracle/wallet/tls \
  -dn "CN=db-server.corp.example.com,OU=Database,O=Example Corp,C=US" \
  -request /tmp/db-server.csr \
  -pwd WalletP@ss!

# Step 4: Import the signed certificate from your CA
orapki wallet add -wallet /opt/oracle/wallet/tls \
  -trusted_cert -cert /tmp/ca-cert.pem -pwd WalletP@ss!

orapki wallet add -wallet /opt/oracle/wallet/tls \
  -user_cert -cert /tmp/db-server-signed.pem -pwd WalletP@ss!

# Step 5: Verify wallet contents
orapki wallet display -wallet /opt/oracle/wallet/tls -pwd WalletP@ss!
```

#### sqlnet.ora — Server Side

```ini
# /opt/oracle/network/admin/sqlnet.ora (server)

# Enable SSL/TLS
SSL_VERSION = 1.2          # Minimum TLS 1.2; set to 1.3 if all clients support it
                            # Never use SSLv3, TLSv1.0, or TLSv1.1
SSL_CLIENT_AUTHENTICATION = FALSE  # Set to TRUE for mutual TLS (client certificates)

# Restrict cipher suites to strong ciphers only
SSL_CIPHER_SUITES = (TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
                     TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
                     TLS_RSA_WITH_AES_256_CBC_SHA256)

# Wallet location for TLS certificate
WALLET_LOCATION =
  (SOURCE =
    (METHOD = FILE)
    (METHOD_DATA =
      (DIRECTORY = /opt/oracle/wallet/tls)))

# TDE wallet (separate from TLS wallet — can be different locations)
ENCRYPTION_WALLET_LOCATION =
  (SOURCE =
    (METHOD = FILE)
    (METHOD_DATA =
      (DIRECTORY = /opt/oracle/wallet/tde)))
```

#### listener.ora — TLS Port

```ini
LISTENER =
  (DESCRIPTION_LIST =
    (DESCRIPTION =
      (ADDRESS = (PROTOCOL = TCPS)(HOST = db-server.corp.example.com)(PORT = 2484))
    )
  )

SSL_CLIENT_AUTHENTICATION = FALSE

WALLET_LOCATION =
  (SOURCE =
    (METHOD = FILE)
    (METHOD_DATA =
      (DIRECTORY = /opt/oracle/wallet/tls)))
```

---

## Oracle Net Encryption (Native Encryption)

Oracle Advanced Security also provides native **network data encryption** through `sqlnet.ora` without requiring certificates or a wallet. This is simpler to deploy than TLS but provides less assurance (no server identity verification).

```ini
# /opt/oracle/network/admin/sqlnet.ora

# Native network encryption — encrypts data in transit using Oracle's built-in mechanism
# Does NOT use SSL certificates; uses challenge-response auth for key exchange

# REQUIRED: both sides must encrypt
# REQUESTED: prefer encryption; accept unencrypted if client doesn't support it
# ACCEPTED: accept encrypted connections; don't require it
# REJECTED: refuse encrypted connections

SQLNET.ENCRYPTION_SERVER = REQUIRED      # Force all server connections to be encrypted
SQLNET.ENCRYPTION_CLIENT = REQUIRED      # Force all client connections to be encrypted

# Specify preferred algorithms (strong algorithms first)
SQLNET.ENCRYPTION_TYPES_SERVER = (AES256, AES192, AES128)
SQLNET.ENCRYPTION_TYPES_CLIENT = (AES256, AES192, AES128)

# Cryptographic checksumming (data integrity — detect tampering)
SQLNET.CRYPTO_CHECKSUM_SERVER = REQUIRED
SQLNET.CRYPTO_CHECKSUM_CLIENT = REQUIRED
SQLNET.CRYPTO_CHECKSUM_TYPES_SERVER = (SHA256)
SQLNET.CRYPTO_CHECKSUM_TYPES_CLIENT = (SHA256)

# Deprecated — do not include 3DES, DES, RC4
# Bad: SQLNET.ENCRYPTION_TYPES_SERVER = (3DES168, DES, RC4_256)
```

---

## Oracle Connection Descriptor (tnsnames.ora) — Client-Side TLS

```ini
# /opt/oracle/network/admin/tnsnames.ora (client)

ORCL_TLS =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCPS)(HOST = db-server.corp.example.com)(PORT = 2484))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = ORCL)
    )
    (SECURITY =
      (MY_WALLET_DIRECTORY = /opt/oracle/wallet/client)
      (SSL_SERVER_CERT_DN = "CN=db-server.corp.example.com,OU=Database,O=Example Corp,C=US")
      # SSL_SERVER_CERT_DN verifies the server's certificate DN — prevents MITM attacks
    )
  )
```

---

## Access Control Lists (ACLs) for Outbound Network Calls

Oracle PL/SQL packages like `UTL_HTTP`, `UTL_TCP`, `UTL_SMTP`, and `UTL_FILE` allow the database to make outbound network connections. Without ACLs, these packages can be used to exfiltrate data, launch internal network attacks from the database server, or reach internal services.

Since Oracle 11g, outbound connections from these packages require an explicit ACL grant.

### Creating Network ACLs

```sql
-- Grant UTL_HTTP access to a specific host and port
BEGIN
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host    => 'api.payment-gateway.com',
    lower_port => 443,
    upper_port => 443,
    ace     => xs$ace_type(
      privilege_list => xs$name_list('http'),   -- 'http' for HTTP/HTTPS
      principal_name => 'WEBAPP_SVC',           -- Oracle user or role
      principal_type => xs_acl.ptype_db         -- Database user/role
    )
  );
END;
/

-- Grant TCP access for UTL_TCP/UTL_SMTP
BEGIN
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host    => 'smtp.corp.example.com',
    lower_port => 587,
    upper_port => 587,
    ace     => xs$ace_type(
      privilege_list => xs$name_list('connect', 'resolve'),
      principal_name => 'NOTIFICATION_APP',
      principal_type => xs_acl.ptype_db
    )
  );
END;
/

-- Grant DNS resolution only (for host lookups without full network access)
BEGIN
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host    => '*',           -- All hosts for DNS only
    lower_port => NULL,
    upper_port => NULL,
    ace     => xs$ace_type(
      privilege_list => xs$name_list('resolve'),
      principal_name => 'APP_USER',
      principal_type => xs_acl.ptype_db
    )
  );
END;
/

-- Wildcard host (use with caution — limits to a subdomain)
BEGIN
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host    => '*.corp.example.com',  -- Only corp.example.com subdomains
    lower_port => 443,
    upper_port => 443,
    ace     => xs$ace_type(
      privilege_list => xs$name_list('http', 'connect', 'resolve'),
      principal_name => 'INTERNAL_APP',
      principal_type => xs_acl.ptype_db
    )
  );
END;
/
```

### Managing and Querying ACLs

```sql
-- Check all host ACEs (host-based ACL entries)
SELECT host, lower_port, upper_port, ace_order,
       start_date, end_date, grant_option, inverted_principal,
       principal, privilege
FROM dba_host_aces
ORDER BY host, lower_port;

-- Check which users can connect to which hosts
SELECT host, lower_port, upper_port, principal, privilege
FROM dba_host_aces
WHERE principal = 'WEBAPP_SVC'
ORDER BY host, lower_port;

-- Check if a specific user can reach a host
SELECT DBMS_NETWORK_ACL_ADMIN.CHECK_PRIVILEGE_ACLID(
  acl         => (SELECT aclid FROM dba_host_acls WHERE host = 'api.payment-gateway.com'),
  user        => 'WEBAPP_SVC',
  privilege   => 'http'
) AS privilege_granted
FROM dual;

-- Simpler check (returns 1 if granted, null if not)
SELECT DBMS_NETWORK_ACL_ADMIN.CHECK_PRIVILEGE(
  acl       => 'host=api.payment-gateway.com',
  user      => 'WEBAPP_SVC',
  privilege => 'http'
) AS granted
FROM dual;

-- Remove an ACE
BEGIN
  DBMS_NETWORK_ACL_ADMIN.REMOVE_HOST_ACE(
    host    => 'api.payment-gateway.com',
    lower_port => 443,
    upper_port => 443,
    ace     => xs$ace_type(
      privilege_list => xs$name_list('http'),
      principal_name => 'WEBAPP_SVC',
      principal_type => xs_acl.ptype_db
    )
  );
END;
/
```

### Wallet-Based HTTPS Calls from UTL_HTTP

To make HTTPS calls from UTL_HTTP (verifying the remote certificate), the remote server's CA certificate must be in the Oracle Wallet:

```sql
-- Configure UTL_HTTP to use the wallet for SSL verification
BEGIN
  UTL_HTTP.SET_WALLET('file:/opt/oracle/wallet/outbound', 'WalletP@ss!');
END;
/

-- Make an HTTPS call with certificate verification
DECLARE
  v_req  UTL_HTTP.REQ;
  v_resp UTL_HTTP.RESP;
  v_text VARCHAR2(4000);
BEGIN
  v_req  := UTL_HTTP.BEGIN_REQUEST('https://api.payment-gateway.com/v1/charge',
                                    'POST', 'HTTP/1.1');
  UTL_HTTP.SET_HEADER(v_req, 'Content-Type', 'application/json');
  UTL_HTTP.SET_HEADER(v_req, 'Authorization', 'Bearer ' || v_api_token);
  UTL_HTTP.WRITE_TEXT(v_req, '{"amount": 100}');
  v_resp := UTL_HTTP.GET_RESPONSE(v_req);
  UTL_HTTP.READ_TEXT(v_resp, v_text);
  UTL_HTTP.END_RESPONSE(v_resp);
EXCEPTION
  WHEN OTHERS THEN
    IF v_resp.status_code IS NOT NULL THEN
      UTL_HTTP.END_RESPONSE(v_resp);
    END IF;
    RAISE;
END;
/
```

---

## Firewall and Network Architecture

### Recommended Network Segmentation

```
Internet
    │
  DMZ
    │ (Application Tier)
    ├── Web Server (TCP 80/443)
    │
Firewall (only 1521/2484 from App Tier to DB Tier)
    │
  DB Tier
    ├── Oracle Primary DB (TCP 1521 / TCPS 2484)
    └── Oracle Standby DB (TCP 1521 for Data Guard)
    │
  DBA Access Network (separate VLAN)
    └── Jump Server → Oracle DB (1521/2484 from jump server only)
```

### Firewall Rules for Oracle

```
# Inbound to database server
ALLOW TCP 10.0.2.0/24 → 10.0.3.50:2484   # App tier to DB (TCPS/TLS)
ALLOW TCP 10.0.4.0/24 → 10.0.3.50:2484   # DBA jump hosts to DB
DENY  TCP * → 10.0.3.50:1521             # Block unencrypted port from outside
DENY  TCP * → 10.0.3.50:2484             # Implicit deny all else

# Outbound from database server (restrict UTL_HTTP/UTL_SMTP)
ALLOW TCP 10.0.3.50 → 10.0.5.20:25      # DB to internal SMTP relay only
ALLOW TCP 10.0.3.50 → 10.0.5.30:443     # DB to approved API gateway only
DENY  TCP 10.0.3.50 → *                 # Block all other outbound
```

---

## Oracle Valid Node Checking (IP Allowlisting)

Oracle Net provides a native IP allowlisting feature via the `valid_node_checking` parameter in `sqlnet.ora`:

```ini
# /opt/oracle/network/admin/sqlnet.ora

# Enable valid node checking
TCP.VALIDNODE_CHECKING = YES

# Define which IP addresses are allowed to connect
TCP.INVITED_NODES = (10.0.2.10, 10.0.2.11, 10.0.4.50, 10.0.4.51, 127.0.0.1)

# Define which IP addresses are explicitly blocked (alternative to INVITED_NODES)
# TCP.EXCLUDED_NODES = (192.168.100.0/24, 10.255.0.0/16)

# Note: INVITED_NODES and EXCLUDED_NODES are mutually exclusive;
# use INVITED_NODES for a whitelist approach (more secure)
```

Valid node checking is processed by the listener before the connection reaches the database, making it an efficient first line of defense.

---

## Checking and Testing Network Security Configuration

```sql
-- Check the current sqlnet.ora encryption settings as seen by the database
SELECT network_service_banner
FROM v$session_connect_info
WHERE sid = SYS_CONTEXT('USERENV', 'SID');

-- Check encryption status of all current sessions
SELECT s.sid, s.serial#, s.username, s.status,
       c.network_service_banner
FROM v$session s
JOIN v$session_connect_info c ON c.sid = s.sid
WHERE s.username IS NOT NULL
  AND c.network_service_banner LIKE '%Encryption%'
ORDER BY s.username;

-- Find sessions that are NOT encrypted (network_service_banner missing encryption info)
SELECT s.sid, s.serial#, s.username, s.osuser, s.machine, s.program
FROM v$session s
WHERE s.username IS NOT NULL
  AND s.sid NOT IN (
    SELECT c.sid
    FROM v$session_connect_info c
    WHERE c.network_service_banner LIKE '%Encryption service%'
       OR c.network_service_banner LIKE '%AES%'
  )
ORDER BY s.username;

-- Check listener endpoints
SELECT end_point
FROM v$listener_network
ORDER BY end_point;
```

---

## Security Hardening Checklist

```sql
-- 1. Check for PUBLIC grants on dangerous network packages
SELECT grantee, owner, table_name, privilege
FROM dba_tab_privs
WHERE grantee = 'PUBLIC'
  AND table_name IN ('UTL_HTTP', 'UTL_TCP', 'UTL_SMTP', 'UTL_FILE',
                     'UTL_MAIL', 'HTTPURITYPE', 'DBMS_LDAP')
ORDER BY table_name;

-- These should be revoked from PUBLIC and granted only to specific users
REVOKE EXECUTE ON utl_http FROM PUBLIC;
REVOKE EXECUTE ON utl_tcp FROM PUBLIC;
REVOKE EXECUTE ON utl_smtp FROM PUBLIC;

-- 2. Check for EXTPROC (external procedure) registrations
SELECT name, network_name FROM v$service
WHERE name LIKE 'EXTPROC%';
-- Remove EXTPROC from listener if not needed

-- 3. Check if remote OS authentication is disabled (critical security)
SHOW PARAMETER remote_os_authent;
-- Should be FALSE; if TRUE: ALTER SYSTEM SET remote_os_authent = FALSE;

-- 4. Check for externally authenticated accounts (OS-authenticated)
SELECT username, external_name, authentication_type
FROM dba_users
WHERE authentication_type = 'EXTERNAL'
ORDER BY username;

-- 5. Check if REMOTE_LOGIN_PASSWORDFILE allows multiple users (should be EXCLUSIVE or NONE)
SHOW PARAMETER remote_login_passwordfile;
-- EXCLUSIVE = only one SYSDBA per DB (acceptable)
-- SHARED = multiple databases share a password file (risky)
-- NONE = no password file (use OS auth only — acceptable for some configs)

-- 6. Verify O7_DICTIONARY_ACCESSIBILITY is FALSE (prevents non-priv users from seeing SYS objects)
SHOW PARAMETER o7_dictionary_accessibility;
-- Should be FALSE
ALTER SYSTEM SET o7_dictionary_accessibility = FALSE;
```

---

## Best Practices

1. **Always use TCPS (TLS) for database connections**: Unencrypted connections expose credentials (in Oracle Net, passwords travel in a proprietary but potentially reversible format), query data, and session information to network sniffing.

2. **Use TLS 1.2 or 1.3 minimum**: Disable SSL 3.0, TLS 1.0, and TLS 1.1. These have known vulnerabilities (POODLE, BEAST, etc.).

3. **Restrict which hosts can connect via `TCP.VALIDNODE_CHECKING`**: Allowlisting application server IPs at the listener level stops unauthorized scans and connection attempts before they even reach the Oracle authentication layer.

4. **Never expose the listener on the public internet**: The database listener should only be accessible from your application tier servers. Use a connection proxy or pgBouncer-equivalent if external access is needed.

5. **Disable the extproc listener entry unless explicitly needed**: The external procedure listener is a common attack vector that allows OS-level code execution from the database.

6. **Grant `UTL_HTTP`, `UTL_TCP`, and `UTL_SMTP` only to specific users**: These packages can be used to exfiltrate data by making outbound HTTP calls with sensitive data. Tightly control who can use them and to which destinations.

7. **Set `ADMIN_RESTRICTIONS_LISTENER = ON`**: This prevents remote `LSNRCTL` commands from reconfiguring the listener (e.g., setting log file paths to overwrite system files).

8. **Rotate SSL certificates before expiry**: Expired certificates cause outages. Set calendar reminders 90 days before expiry for all Oracle wallet certificates.

---

## Common Mistakes and How to Avoid Them

### Mistake 1: Using `SQLNET.ENCRYPTION_SERVER = REQUESTED` Instead of `REQUIRED`

```ini
# BAD: A client that doesn't support encryption can still connect unencrypted
SQLNET.ENCRYPTION_SERVER = REQUESTED

# GOOD: All connections must be encrypted; non-compliant clients are rejected
SQLNET.ENCRYPTION_SERVER = REQUIRED
SQLNET.ENCRYPTION_CLIENT = REQUIRED
```

### Mistake 2: Not Setting SSL_SERVER_CERT_DN in tnsnames.ora

Without `SSL_SERVER_CERT_DN`, clients accept any valid certificate, making man-in-the-middle attacks possible.

```ini
# BAD: No server identity verification
ORCL =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCPS)(HOST = db-server)(PORT = 2484))
    (CONNECT_DATA = (SERVICE_NAME = ORCL)))

# GOOD: Verify the server's certificate DN
ORCL =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCPS)(HOST = db-server)(PORT = 2484))
    (CONNECT_DATA = (SERVICE_NAME = ORCL))
    (SECURITY =
      (SSL_SERVER_CERT_DN = "CN=db-server.corp.com,OU=DB,O=Corp,C=US")))
```

### Mistake 3: Granting Wildcard Host ACL Access

```sql
-- BAD: Allows UTL_HTTP to call any host
BEGIN
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host => '*',  -- Wildcard to ALL hosts
    ace  => xs$ace_type(
      privilege_list => xs$name_list('connect', 'http'),
      principal_name => 'APP_USER',
      principal_type => xs_acl.ptype_db
    )
  );
END;
/

-- GOOD: Restrict to specific known hosts and ports
BEGIN
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host       => 'api.known-vendor.com',
    lower_port => 443,
    upper_port => 443,
    ace        => xs$ace_type(
      privilege_list => xs$name_list('http'),
      principal_name => 'APP_USER',
      principal_type => xs_acl.ptype_db
    )
  );
END;
/
```

---

## Compliance Considerations

### PCI-DSS
- Requirement 2.2: Develop configuration standards for all system components
- Requirement 4.1: Use strong cryptography and security protocols for transmitting cardholder data over open, public networks (TLS 1.2+ required)
- Requirement 6.4: Disable unneeded services and ports
- PCI DSS explicitly bans SSL and early TLS (1.0, 1.1)

### HIPAA
- 45 CFR 164.312(e)(1): Implement technical security measures to guard against unauthorized access to ePHI transmitted over a network
- 45 CFR 164.312(e)(2)(ii): Implement encryption mechanisms to protect ePHI in transit
- TLS 1.2 or higher is required for HIPAA compliance

### SOX
- Requires that data integrity be maintained during transmission
- Network encryption and checksumming (`SQLNET.CRYPTO_CHECKSUM_SERVER = REQUIRED`) together satisfy this

```sql
-- Compliance verification: confirm all sessions to the production database are encrypted
SELECT COUNT(*) AS unencrypted_sessions
FROM v$session s
WHERE s.username IS NOT NULL
  AND s.sid NOT IN (
    SELECT DISTINCT c.sid
    FROM v$session_connect_info c
    WHERE LOWER(c.network_service_banner) LIKE '%aes%'
       OR LOWER(c.network_service_banner) LIKE '%encryption%'
  );
-- This should return 0 in a compliant environment
```

---

## Sources

- [Oracle Database 19c Security Guide (DBSEG)](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/)
- [Oracle Database 19c Net Services Administrator's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/netag/)
- [Oracle Database 19c Net Services Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/netrf/)
- [DBMS_NETWORK_ACL_ADMIN — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_NETWORK_ACL_ADMIN.html)
