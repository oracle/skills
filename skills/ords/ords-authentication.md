# ORDS Authentication and Authorization

## Overview

ORDS provides a complete OAuth2-based security model for protecting REST endpoints. Access control is defined through **privileges** (which endpoints are protected) and **OAuth2 clients** (which applications/users can access them). ORDS supports OAuth2 client credentials flow (machine-to-machine), authorization code flow (user-facing web applications), and implicit flow. Additionally, ORDS supports external identity providers via JWT profile configuration, enabling integration with Oracle Identity Cloud Service (IDCS), Azure AD, Okta, and other OIDC-compatible providers.

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
BEGIN
  ORDS.DEFINE_PRIVILEGE(
    p_privilege_name => 'hr.employees.read',
    p_roles          => NULL,                  -- No role restriction (any authenticated client)
    p_label          => 'HR Employee Read',
    p_description    => 'Read access to HR employee data',
    p_comments       => NULL
  );
  COMMIT;
END;
/
```

### Privilege with Required Roles

```sql
DECLARE
  l_roles owa.vc_arr;
BEGIN
  -- Define roles first
  ORDS.CREATE_ROLE(p_role_name => 'HR_MANAGER');
  ORDS.CREATE_ROLE(p_role_name => 'HR_ADMIN');

  -- Define privilege requiring HR_MANAGER or HR_ADMIN role
  -- p_roles is owa.vc_arr (not ORDS_TYPES.T_ORDS_STR_LIST)
  l_roles(1) := 'HR_MANAGER';
  l_roles(2) := 'HR_ADMIN';

  ORDS.DEFINE_PRIVILEGE(
    p_privilege_name => 'hr.employees.write',
    p_roles          => l_roles,
    p_label          => 'HR Employee Write',
    p_description    => 'Create, update, and delete HR employee records'
  );
  COMMIT;
END;
/
```

### Attaching a Privilege to Module Patterns

```sql
BEGIN
  -- Protect all endpoints in the hr.employees module
  ORDS.PRIVILEGE_MAP_MODULE(
    p_privilege_name => 'hr.employees.read',
    p_module_name    => 'hr.employees'
  );
  COMMIT;
END;
/
```

### Attaching a Privilege to a Specific URL Pattern

```sql
BEGIN
  -- Protect only write operations on the employees resource
  ORDS.CREATE_ROLE('hr.employees.write');

  -- Associate privilege with a URL pattern
  ORDS.DEFINE_PRIVILEGE(
    p_privilege_name  => 'hr.employees.write',
    p_roles           => ORDS_TYPES.T_ORDS_STR_LIST('HR_ADMIN'),
    p_label           => 'Employee Write',
    p_description     => 'Modify employee records',
    p_module_name     => 'hr.employees',   -- Scope to module
    p_pattern         => 'employees/'
  );
  COMMIT;
END;
/
```

---

## OAuth2 Client Credentials Flow (Machine-to-Machine)

This flow is used for server-to-server API calls where there is no interactive user. A backend service uses its client ID and secret to obtain an access token.

### Step 1: Create an OAuth Client

```sql
BEGIN
  OAUTH.CREATE_CLIENT(
    p_name            => 'reporting-service',
    p_grant_type      => 'client_credentials',
    p_owner           => 'Data Platform Team',
    p_description     => 'Automated reporting service for HR data',
    p_support_email   => 'dataplatform@example.com',
    p_privilege_names => 'hr.employees.read'   -- Comma-separated privilege names
  );
  COMMIT;
END;
/
```

### Step 2: Retrieve the Client ID and Secret

```sql
-- View the generated client_id and client_secret
SELECT client_id, client_secret
FROM user_ords_clients
WHERE name = 'reporting-service';
```

Store the `client_secret` securely — it is only visible immediately after creation (or until next reset).

### Step 3: Grant Privileges to the Client

```sql
BEGIN
  OAUTH.GRANT_CLIENT_ROLE(
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
BEGIN
  OAUTH.CREATE_CLIENT(
    p_name              => 'hr-portal',
    p_grant_type        => 'authorization_code',
    p_redirect_uri      => 'https://hrportal.example.com/callback',
    p_support_email     => 'portal-admin@example.com',
    p_privilege_names   => 'hr.employees.read,hr.employees.write',
    p_owner             => 'HR Portal Team',
    p_description       => 'HR Self-Service Portal'
  );
  COMMIT;
END;
/
```

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
FROM user_ords_clients;

-- List tokens issued (admin view)
SELECT c.name, t.token_type, t.expires_in
FROM user_ords_tokens t
JOIN user_ords_clients c ON c.client_id = t.client_id;

-- Revoke a client (disable all its tokens)
BEGIN
  OAUTH.UPDATE_CLIENT(
    p_name   => 'reporting-service',
    p_status => 'REVOKED'
  );
  COMMIT;
END;
/

-- Delete a client
BEGIN
  OAUTH.DELETE_CLIENT(p_name => 'reporting-service');
  COMMIT;
END;
/

-- Reset client secret
BEGIN
  OAUTH.RESET_CLIENT_SECRET(p_name => 'reporting-service');
  COMMIT;
END;
/

-- Get new secret after reset
SELECT client_secret FROM user_ords_clients WHERE name = 'reporting-service';
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

ORDS can validate JWTs issued by external identity providers (Oracle IDCS, Azure AD, Okta, Keycloak, etc.) without requiring the token to be issued by ORDS itself.

### Configure JWT Verification in ORDS

```shell
# Set the trusted issuer and JWKS URI
ords --config /opt/oracle/ords/config config set \
  security.jwt.allowedAge 3600

# Add a JWT profile
ords --config /opt/oracle/ords/config config secret --global \
  jwt.verifier.1.issuer "https://login.microsoftonline.com/{tenant-id}/v2.0"

ords --config /opt/oracle/ords/config config secret --global \
  jwt.verifier.1.jwksUri "https://login.microsoftonline.com/{tenant-id}/discovery/v2.0/keys"

ords --config /opt/oracle/ords/config config secret --global \
  jwt.verifier.1.audience "api://my-ords-api"
```

Once configured, clients send JWTs from Azure AD as Bearer tokens and ORDS validates them:

```http
GET /ords/hr/v1/employees/ HTTP/1.1
Authorization: Bearer <Azure AD JWT>
```

### Mapping JWT Claims to ORDS Roles

Configure ORDS to map JWT claims (e.g., `groups` or `roles` claims) to ORDS roles:

```shell
ords --config /opt/oracle/ords/config config set --global jwt.claimRole roles
```

When ORDS sees a JWT with `"roles": ["HR_ADMIN"]`, it maps this to the `HR_ADMIN` ORDS role, granting access to privileges requiring that role.

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
- **Rotate client secrets regularly**: Treat client secrets like passwords. Rotate them on schedule and after any potential exposure. Use `OAUTH.RESET_CLIENT_SECRET`.
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

- [ORDS Developer's Guide — Securing Oracle REST Data Services](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/about-oracle-rest-data-services.html)
- [Oracle REST Data Services PL/SQL API Reference — OAUTH and ORDS Packages](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orrst/index.html)
- [ORDS OAuth2 Client Credentials Flow](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/rest-enabled-sql-service.html)
