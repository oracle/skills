# ORDS Authentication and Authorization

## Overview

ORDS provides a complete OAuth2-based security model for protecting REST endpoints. Access control is defined through **privileges** (which endpoints are protected) and **OAuth2 clients** (which applications/users can access them). ORDS supports OAuth2 client credentials flow (machine-to-machine), authorization code flow (user-facing web applications), and implicit flow. Additionally, ORDS supports external identity providers via schema-level or pool-level JWT profiles, enabling integration with Oracle Identity Cloud Service (IDCS), Azure AD, Okta, and other OIDC-compatible providers.

Current ORDS releases use `ORDS_SECURITY` and `ORDS_SECURITY_ADMIN` for OAuth client lifecycle management. The older `OAUTH` and `OAUTH_ADMIN` packages are deprecated and should not be used in new examples.

---

## Core Security Concepts

### Privileges

A **privilege** is a named access control gate attached to one or more URL patterns (REST modules or specific templates). Any request to a protected URL must present a valid OAuth2 Bearer token with the required privilege scope.

### Roles

**Roles** are optional labels that can be assigned to privileges. A client or user must hold the required role to receive the privilege. Roles provide a second layer of authorization on top of the OAuth2 scope check.

### OAuth Clients

An **OAuth client** represents an application (or user account) that wants to call protected REST APIs. Clients are issued a client ID and client secret, which they exchange for access tokens at the token endpoint.

---

## Defining Privileges

```sql
-- Define a privilege that protects employee data endpoints
DECLARE
  l_roles    owa.vc_arr;
  l_patterns owa.vc_arr;
  l_modules  owa.vc_arr;
BEGIN
  ORDS.DEFINE_PRIVILEGE(
    p_privilege_name => 'hr.employees.read',
    p_roles          => l_roles,               -- Empty array = no role restriction
    p_patterns       => l_patterns,
    p_modules        => l_modules,
    p_label          => 'HR Employee Read',
    p_description    => 'Read access to HR employee data',
    p_comments       => NULL
  );

  ORDS.SET_MODULE_PRIVILEGE(
    p_module_name    => 'hr.employees',
    p_privilege_name => 'hr.employees.read'
  );

  COMMIT;
END;
/
```

### Privilege with Required Roles

```sql
DECLARE
  l_roles    owa.vc_arr;
  l_patterns owa.vc_arr;
  l_modules  owa.vc_arr;
BEGIN
  -- Define roles first
  ORDS.CREATE_ROLE(p_role_name => 'HR_MANAGER');
  ORDS.CREATE_ROLE(p_role_name => 'HR_ADMIN');

  -- Define privilege requiring HR_MANAGER or HR_ADMIN role
  -- p_roles is an owa.vc_arr
  l_roles(1) := 'HR_MANAGER';
  l_roles(2) := 'HR_ADMIN';

  ORDS.DEFINE_PRIVILEGE(
    p_privilege_name => 'hr.employees.write',
    p_roles          => l_roles,
    p_patterns       => l_patterns,
    p_modules        => l_modules,
    p_label          => 'HR Employee Write',
    p_description    => 'Create, update, and delete HR employee records'
  );

  ORDS.SET_MODULE_PRIVILEGE(
    p_module_name    => 'hr.employees',
    p_privilege_name => 'hr.employees.write'
  );

  COMMIT;
END;
/
```

### Attaching a Privilege to a Module

```sql
BEGIN
  -- Protect all endpoints in the hr.employees module
  ORDS.SET_MODULE_PRIVILEGE(
    p_module_name    => 'hr.employees',
    p_privilege_name => 'hr.employees.read'
  );
  COMMIT;
END;
/
```

To protect only selected URL patterns instead of an entire module, use `ORDS.DEFINE_PRIVILEGE` with the `p_patterns` array.

---

## OAuth2 Client Credentials Flow (Machine-to-Machine)

This flow is used for server-to-server API calls where there is no interactive user. A backend service uses its client ID and secret to obtain an access token.

### Step 1: Create an OAuth Client

```sql
DECLARE
  l_client ords_types.t_client_credentials;
BEGIN
  l_client := ORDS_SECURITY.REGISTER_CLIENT(
    p_name            => 'reporting-service',
    p_grant_type      => 'client_credentials',
    p_description     => 'Automated reporting service for HR data',
    p_support_email   => 'https://api.example.com/support',
    p_privilege_names => 'hr.employees.read'
  );

  l_client.client_key.name := 'reporting-service';
  l_client := ORDS_SECURITY.ROTATE_CLIENT_SECRET(
    p_client_key      => l_client.client_key,
    p_revoke_existing => TRUE
  );

  DBMS_OUTPUT.PUT_LINE('client_id=' || l_client.client_key.client_id);
  DBMS_OUTPUT.PUT_LINE('client_secret=' || l_client.client_secret.secret);
  COMMIT;
END;
/
```

### Step 2: Retrieve the Client ID

```sql
-- View the generated client_id
SELECT client_id
FROM   user_ords_clients
WHERE  name = 'reporting-service';
```

Save the `client_secret` returned by `ROTATE_CLIENT_SECRET` immediately. It may not be queryable later unless you explicitly store it.

### Step 3: Grant Privileges to the Client

```sql
BEGIN
  ORDS_SECURITY.GRANT_CLIENT_ROLE(
    p_client_name => 'reporting-service',
    p_role_name   => 'HR_ADMIN'   -- if the privilege requires this role
  );
  COMMIT;
END;
/
```

### Step 4: Obtain an Access Token

```http
POST /ords/hr/oauth/token HTTP/1.1
Host: myserver.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(client_id:client_secret)>

grant_type=client_credentials
```

Or equivalently with curl:

```shell
curl -s -X POST \
  https://myserver.example.com/ords/hr/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "<client_id>:<client_secret>" \
  -d "grant_type=client_credentials"
```

Response:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Step 5: Call the Protected Endpoint

```http
GET /ords/hr/v1/employees/ HTTP/1.1
Host: myserver.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## OAuth2 Authorization Code Flow (User-Facing Applications)

Used when a human user must authenticate and explicitly authorize the application to access their data on their behalf.

### Step 1: Create an Authorization Code Client

```sql
DECLARE
  l_client ords_types.t_client_credentials;
BEGIN
  l_client := ORDS_SECURITY.REGISTER_CLIENT(
    p_name            => 'hr-portal',
    p_grant_type      => 'authorization_code',
    p_redirect_uri    => 'https://hrportal.example.com/callback',
    p_support_email   => 'https://hrportal.example.com/support',
    p_privilege_names => 'hr.employees.read,hr.employees.write',
    p_description     => 'HR Self-Service Portal'
  );
  COMMIT;
END;
/
```

Generate or rotate the client secret before exchanging the authorization code for tokens.

### Step 2: Authorization Code Flow

**Step 2a: Redirect user to ORDS authorization endpoint**

```
https://myserver.example.com/ords/hr/oauth/auth
  ?response_type=code
  &client_id=<client_id>
  &redirect_uri=https://hrportal.example.com/callback
  &state=random_csrf_state_value
  &scope=hr.employees.read
```

**Step 2b: User authenticates** (via ORDS First Party Authentication or an external IdP)

**Step 2c: ORDS redirects to `redirect_uri` with authorization code**

```
https://hrportal.example.com/callback?code=AUTH_CODE_HERE&state=random_csrf_state_value
```

**Step 2d: Exchange authorization code for access token**

```http
POST /ords/hr/oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(client_id:client_secret)>

grant_type=authorization_code
&code=AUTH_CODE_HERE
&redirect_uri=https://hrportal.example.com/callback
```

Response includes `access_token` and `refresh_token`.

---

## Managing OAuth Clients and Tokens

```sql
-- List all OAuth clients
SELECT client_id, name, grant_type, redirect_uri, status
FROM   user_ords_clients;

-- List client role assignments
SELECT client_name, role_name
FROM   user_ords_client_roles
ORDER  BY client_name, role_name;

-- Rotate the client secret and revoke the existing one
DECLARE
  l_client ords_types.t_client_credentials;
BEGIN
  l_client.client_key.name := 'reporting-service';
  l_client := ORDS_SECURITY.ROTATE_CLIENT_SECRET(
    p_client_key      => l_client.client_key,
    p_revoke_existing => TRUE
  );
  COMMIT;
  DBMS_OUTPUT.PUT_LINE('New client secret: ' || l_client.client_secret.secret);
END;
/

-- Delete a client
BEGIN
  ORDS_SECURITY.DELETE_CLIENT(p_name => 'reporting-service');
  COMMIT;
END;
/
```

---

## Token Endpoint and Discovery

ORDS exposes standard OAuth2 endpoints per REST-enabled schema:

| Endpoint | URL |
|---|---|
| Token endpoint | `/ords/{schema}/oauth/token` |
| Authorization endpoint | `/ords/{schema}/oauth/auth` |
| Discovery (OpenID Connect) | `/ords/{schema}/.well-known/openid-configuration` |
| JWKS (public keys) | `/ords/{schema}/oauth/keys` |

```shell
# Discover OAuth2 config
curl https://myserver.example.com/ords/hr/.well-known/openid-configuration
```

---

## JWT Profile Configuration for External Identity Providers

ORDS can validate JWTs issued by external identity providers (Oracle IDCS, Azure AD, Okta, Keycloak, etc.) without requiring the token to be issued by ORDS itself. In current ORDS releases, the JWT profile feature can be configured in one of two mutually exclusive modes:

| Mode | Where it is defined | Scope |
|---|---|---|
| `SCHEMA` (default) | Inside a REST-enabled schema via PL/SQL | One JWT profile per schema |
| `POOL` | In the ORDS pool configuration | One shared JWT profile for all schemas in the pool |

If `security.jwt.profile.mode` is set to `POOL`, ORDS ignores any schema-level JWT profiles for that pool.

### Schema-Level JWT Profile (Default)

Use a schema-level JWT profile when a specific REST-enabled schema needs its own issuer, audience, or JWK definition. A schema-level JWT profile can be either scope-based or role-based.

#### Schema-Level Scope-Based JWT Profile

```sql
BEGIN
  ORDS_SECURITY.CREATE_JWT_PROFILE(
    p_issuer       => 'https://login.microsoftonline.com/{tenant-id}/v2.0',
    p_audience     => 'api://my-ords-api',
    p_jwk_url      => 'https://login.microsoftonline.com/{tenant-id}/discovery/v2.0/keys',
    p_description  => 'Azure AD JWT profile for HR REST APIs',
    p_allowed_skew => 30,
    p_allowed_age  => 3600
  );

  COMMIT;
END;
/
```

In a schema-level scope-based JWT profile, the access token must provide a `scope` or `scp` claim containing the ORDS privilege names protecting the resource.

#### Schema-Level Role-Based JWT Profile (RBAC)

Use `p_role_claim_name` when the token carries ORDS roles instead of ORDS privilege scopes.

```sql
BEGIN
  ORDS_SECURITY.DELETE_JWT_PROFILE;

  ORDS_SECURITY.CREATE_JWT_PROFILE(
    p_issuer          => 'https://login.microsoftonline.com/{tenant-id}/v2.0',
    p_audience        => 'api://my-ords-api',
    p_jwk_url         => 'https://login.microsoftonline.com/{tenant-id}/discovery/v2.0/keys',
    p_role_claim_name => '/roles',
    p_description     => 'Azure AD schema-level JWT profile RBAC for HR REST APIs',
    p_allowed_skew    => 30,
    p_allowed_age     => 3600
  );

  COMMIT;
END;
/
```

In a schema-level role-based JWT profile, the claim at `p_role_claim_name` must resolve to a JSON array of ORDS role names.

Only one JWT profile can exist per schema. To replace it, delete the existing profile and recreate it. If you need to manage the JWT profile for a different REST-enabled schema, use `ORDS_SECURITY_ADMIN.CREATE_JWT_PROFILE` and `ORDS_SECURITY_ADMIN.DELETE_JWT_PROFILE` with `p_schema`.

### Pool-Level JWT Profile

Use a pool-level JWT profile when every REST-enabled schema in the pool should trust the same issuer and audience. A pool-level JWT profile can also be either scope-based or role-based.

#### Pool-Level Scope-Based JWT Profile

```shell
# Configure a shared scope-based JWT profile for the target pool
ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.mode POOL

ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.issuer "https://login.microsoftonline.com/{tenant-id}/v2.0"

ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.jwk.url "https://login.microsoftonline.com/{tenant-id}/discovery/v2.0/keys"

ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.audience "api://my-ords-api"
```

In a pool-level scope-based JWT profile, do not set `security.jwt.profile.role.claim.name`. The access token must provide a `scope` or `scp` claim containing the ORDS privilege names protecting the resource.

#### Pool-Level Role-Based JWT Profile (RBAC)

```shell
# Configure a shared role-based JWT profile for the target pool
ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.mode POOL

ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.issuer "https://login.microsoftonline.com/{tenant-id}/v2.0"

ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.jwk.url "https://login.microsoftonline.com/{tenant-id}/discovery/v2.0/keys"

ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.audience "api://my-ords-api"

ords --config /opt/oracle/ords/config config --db-pool default set \
  security.jwt.profile.role.claim.name /roles
```

In a pool-level role-based JWT profile, `security.jwt.profile.role.claim.name` must point to a JSON array of ORDS role names.

Once configured, clients send JWTs from Azure AD as Bearer tokens and ORDS validates them:

```http
GET /ords/hr/v1/employees/ HTTP/1.1
Authorization: Bearer <Azure AD JWT>
```

### Mapping JWT Claims to ORDS Roles

JWT-to-ORDS-role mapping is available in both modes. Use a valid JSON pointer to the role claim, such as `/roles` or `/resource_access/account/roles`:

- Schema-level RBAC: set `p_role_claim_name` in `ORDS_SECURITY.CREATE_JWT_PROFILE` or `ORDS_SECURITY_ADMIN.CREATE_JWT_PROFILE`.
- Pool-level RBAC: set `security.jwt.profile.role.claim.name` in the ORDS pool configuration.

When ORDS sees a JWT with `"roles": ["HR_ADMIN"]`, it maps this to the `HR_ADMIN` ORDS role, granting access to privileges requiring that role.

### Authorization Model Summary

| Mode | Scope-Based | Role-Based (RBAC) |
|---|---|---|
| Schema-level | Create the JWT profile without `p_role_claim_name`; the token's `scope` or `scp` claim must contain ORDS privilege names. | Create the JWT profile with `p_role_claim_name`; the pointed claim must contain ORDS role names. |
| Pool-level | Configure the pool JWT profile without `security.jwt.profile.role.claim.name`; the token's `scope` or `scp` claim must contain ORDS privilege names. | Configure the pool JWT profile with `security.jwt.profile.role.claim.name`; the pointed claim must contain ORDS role names. |

---

## Role-Based Access Control Summary

```
JWT/Token ──► ORDS validates token ──► extracts roles/scopes
                                            │
                                   ┌────────▼────────┐
                                   │   ORDS Roles     │
                                   │  HR_MANAGER      │
                                   │  HR_ADMIN        │
                                   └────────┬─────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │      ORDS Privileges        │
                              │  hr.employees.read          │
                              │  hr.employees.write         │
                              └─────────────┬──────────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │    Protected URL Patterns    │
                              │  /v1/employees/             │
                              │  /v1/employees/:id          │
                              └─────────────────────────────┘
```

---

## First-Party Authentication (ORDS Users)

ORDS supports direct user authentication for Database Actions and similar tools. ORDS users map to database accounts.

```sql
-- Create a REST-only ORDS user (Database Actions user)
-- Via Database Actions UI, or programmatically via the DB user itself:

-- Grant a DB user REST access (must be done by schema owner or DBA)
BEGIN
  ORDS.ENABLE_SCHEMA(
    p_enabled             => TRUE,
    p_schema              => 'ALICE',
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'alice',
    p_auto_rest_auth       => TRUE
  );
  COMMIT;
END;
/
```

---

## Best Practices

- **Use client credentials for all service-to-service calls**: Never hardcode DB credentials in client applications. Use OAuth2 client credentials so you can revoke access without changing DB passwords.
- **Set short token expiry for sensitive operations**: Default ORDS token expiry is 1 hour. For high-security contexts, configure shorter expiry and implement refresh token logic.
- **Scope privileges narrowly**: Create separate privileges for read vs. write vs. admin operations. Clients receive only the minimum required privileges.
- **Use external IdP for user-facing applications**: Rather than managing users in ORDS, integrate with your organization's identity provider via JWT profile. This enables SSO and centralizes user lifecycle management.
- **Rotate client secrets regularly**: Treat client secrets like passwords. Rotate them on schedule and after any potential exposure. Use `ORDS_SECURITY.ROTATE_CLIENT_SECRET`.
- **Audit privilege assignments**: Periodically review `user_ords_clients` and `user_ords_client_roles` to ensure no stale or over-privileged clients exist.

## Common Mistakes

- **Calling the token endpoint for the wrong schema**: ORDS token endpoints are schema-scoped (`/ords/{schema}/oauth/token`). Using the wrong schema path returns 404.
- **Forgetting to grant roles to clients**: Creating a client and granting a privilege is not enough if the privilege requires a specific role. Check `user_ords_client_roles`.
- **Sending the client credentials in the request body instead of Authorization header**: The OAuth2 spec allows both, but ORDS requires `Authorization: Basic <base64>` for `client_credentials` grant. Body-based credentials fail with ORDS.
- **Not URL-encoding the Authorization Code redirect URI**: The `redirect_uri` in the authorization code exchange must exactly match the registered URI, including trailing slashes and encoding.
- **Exposing `client_secret` in client-side code**: For browser-based apps (SPAs), use PKCE (if ORDS supports it for your version) or a backend-for-frontend pattern. Never put client secrets in JavaScript.
- **Assuming roles in JWT match ORDS privilege names**: JWT roles are mapped to ORDS roles, and ORDS roles are associated with ORDS privileges. They are distinct levels. Configure the mapping carefully.

---

## Sources

- [ORDS Developer's Guide — Developing Oracle REST Data Services Applications](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.3/orddg/developing-REST-applications.html)
- [ORDS Installation and Configuration Guide — About the Oracle REST Data Services Configuration Files](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.3/ordig/about-REST-configuration-files.html)
- [ORDS_SECURITY PL/SQL Package Reference](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.2/orddg/ords_security-pl-sql-package-reference.html)
- [ORDS_SECURITY_ADMIN PL/SQL Package Reference](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.4/orddg/ords_security_admin-pl-sql-package.html)
- [ORDS OAuth2 Client Credentials Flow](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/rest-enabled-sql-service.html)
