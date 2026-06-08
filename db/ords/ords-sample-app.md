# ORDS Concert Sample App Bootstrap

## Overview

Help configure, migrate, and validate the ORDS Concert sample app while preserving this required order:

1. Configure Oracle IAM / OCI IAM and ORDS JWT validation first.
2. Configure OCI Database API Gateway / OCS second, using `metadataSource:CLOUD`.
3. Use Auth0 automation last, only as the legacy baseline or migration fallback.

Default assumption for this skill: ORDS is external (OCI Database API Gateway / OCS or standalone ORDS config) and is **not installed in the target database**. In this mode, configure JWT validation at the **pool level** and do not require `ORDS_METADATA` in the database.

Produce reviewable plans, commands, configuration guidance, file-edit instructions, and validation steps. Do not invent tenant-specific values, secrets, OCIDs, URLs, domains, schemas, scopes, or customer-specific decisions.

## Operating Rules

- Use only repository files and user-provided context as the source of truth. Do not use web searches, connected tools, external data, or guessed tenant values.
- Inspect existing repo files before proposing or applying edits. If a target file or path is missing, report it and continue with the available artifacts.
- Ask only for missing values that block the next step. Otherwise, use explicit placeholders such as `<COMPARTMENT_OCID>` and mark them as missing.
- Prefer reviewable commands over hidden automation. Separate explanation from commands and state what each command changes.
- Use repo-relative paths for files and scripts.
- Always include validation steps. Include negative validation whenever authentication or authorization is involved.
- Never commit secrets, print tokens in documentation, expose client secrets in browser code, or store real credentials in sample files.
- Apply least privilege where possible. Validate issuer, audience, JWKS URL, token expiration, scopes, and ORDS privilege mappings.
- Keep Auth0 content limited to original setup reproduction, legacy automation, or comparison during migration to Oracle IAM.
- When ORDS is not installed in the target database, do not require or generate database-side ORDS package calls for JWT profile setup. Configure JWT validation in the ORDS pool (`POOL` mode) through OCS or ORDS pool configuration.
- If `ORDS_METADATA` and ORDS PL/SQL metadata definitions are unavailable, mark cloud metadata conversion from PL/SQL as `not applicable` for that environment and continue with pool-level JWT + IAM/OIDC validation.

## Modes

| Mode | Use for | Primary output |
| --- | --- | --- |
| `ocs-runtime-config` | Configuring ORDS through OCI Database API Gateway / OCS and starting ORDS from a configuration OCID. | OCI/ORDS setup plan, commands, runtime validation, and troubleshooting. |
| `cloud-metadata-migration` | Converting ORDS PL/SQL metadata definitions into OCS cloud metadata artifacts when those metadata sources exist. | `ords_config_service/apispec.json` and `ords_config_service/oci_requests.sh`, or a documented N/A decision when source metadata is unavailable. |
| `oci-iam-target` | Configuring Oracle IAM / OCI IAM as the target OIDC identity provider. | IAM app settings, `.env` values, Remix auth edits, and OIDC validation. |
| `ords-authorization` | Mapping JWT claims and scopes to ORDS protected resources. | Scope-to-privilege mapping, positive checks, and negative checks. |
| `auth0-baseline` | Reproducing or validating the original Auth0 setup. | Auth0 Management API commands and baseline validation. |
| `validate-bootstrap` | Validating identity, JWT, ORDS authorization, OCS configuration, API specs, and app behavior. | End-to-end checklist with expected results and failures. |

## Required Bootstrap Sequence

1. Run `oci-iam-target` and `ords-authorization`, using pool-level JWT profile for external ORDS.
2. Run `ocs-runtime-config` and `cloud-metadata-migration` with `metadataSource:CLOUD`.
3. Run `auth0-baseline` only as a legacy fallback or migration comparison.
4. Run `validate-bootstrap`, including app startup with `npm run dev`.

## Required Inputs

Track provided and missing values in responses.

| Area | Inputs |
| --- | --- |
| Common | Local app URL, ORDS base URL, schema, ORDS pool, SBAC authorization model, environment. |
| OCS runtime | OCI region, compartment/config/Database Tools connection OCIDs, pool key/name, OCI auth/profile, startup command. |
| Cloud migration | Source `.sql` ORDS PL/SQL definitions, target `apispec.json`, target `oci_requests.sh`, pool key, display name, auto API object list, enabled schema/object names. |
| Oracle IAM target | OIDC client ID/secret, authorization/token/userinfo/JWKS endpoints, issuer, audience, scopes, callback/logout URLs. |
| ORDS authorization | Protected paths, scopes, JWT profile mode (`POOL` for external ORDS), privileges, scope-based claim mapping. |
| Auth0 baseline | Domain, Management API client ID/secret, API identifier, callback/logout URLs, scopes, test user/admin. |

## Response Contract

Use these headings for skill responses and scope each section to the detected mode:

1. Detected Scenario
2. Assumptions
3. Required Inputs, with provided/missing status
4. Files to Create or Update
5. Commands, in execution order
6. Validation, with positive and negative checks
7. Expected Results
8. Troubleshooting
9. Security Notes
10. Next Recommended Action

Relevant files may include `.env.example`, Remix auth files, Remix route files, constants, profile model files, `ords_config_service/apispec.json`, and `ords_config_service/oci_requests.sh`.

## Command and File-Edit Standards

- Explain what each command changes before or immediately after the command block.
- Keep generated commands rerunnable when possible.
- Use fenced code blocks with language labels.
- Keep secrets as environment variables or placeholders, never literal values.
- Do not write tenant-specific values into examples.
- For file edits, name the repo-relative path and describe the intended change before showing code.

---

# OCI Database API Gateway / OCS Runtime Configuration

Run this second, after Oracle IAM target setup and ORDS authorization mapping.

This runtime flow assumes ORDS is external to the database. Do not require `ORDS_METADATA` in the target schema/database for JWT profile configuration.

## Start Conditions

1. Create an OCI Base Database instance for the sample app workload.
2. Confirm database connectivity details: `host`, `port`, and `service_name`.
3. Confirm admin or schema credentials are available.
4. Confirm ORDS is not installed on this database.
5. If ORDS is already installed, use a different Base Database with no ORDS installation for this flow.

## Setup Path

1. Create a compartment.
2. Create a VCN/subnet and required ingress, such as TCP `1521` and `8088`.
3. Provision the Base Database for the sample app.
4. Prepare ORDS runtime host access.
5. Verify Java 17 or later.
6. Create the Database Tools connection.
7. Create the Database API Gateway config with cloud metadata.
8. Create pools mapped to Database Tools connections.
9. Start ORDS with the configuration OCID.

Database lifecycle admin user creation belongs in database setup and validation, not in this OCS runtime flow.


## ORDS Runtime and OCI Resource Commands

Install ORDS on the runtime host when needed:

```bash
sudo yum install ords
```

Create a dynamic group for the instance:

```text
All {instance.id = '<INSTANCE_OCID>'}
```

Use the least-privilege policy your environment supports. If using the sample broad bootstrap policy, call it out as temporary and narrow it before production:

```text
Allow dynamic-group <DYNAMIC_GROUP_NAME> to manage all-resources in compartment id <COMPARTMENT_OCID>
```

Create a Database Tools connection using the schema credentials created by the migration script. Use connection string format `<host>:<port>/<service_name>`.

```bash
oci dbtools connection create-oracle-database \
  --compartment-id <COMPARTMENT_OCID> \
  --display-name ORDS_SAMPLE_APP_CONN \
  --user-name <DB_USER> \
  --user-password-secret-id <VAULT_SECRET_OCID> \
  --connection-string "<HOST>:<PORT>/<SERVICE_NAME>"
```

Create a Database API Gateway config. Use cloud metadata for config-service-managed `apiSpecs` and `autoApiSpecs`.

```bash
oci dbtools database-api-gateway-config create-database-api-gateway-config-default \
  --compartment-id <COMPARTMENT_OCID> \
  --display-name ords-sample-app-config \
  --metadata-source CLOUD
```

Retrieve and export the config OCID:

```bash
export CONFIG_OCID="<CONFIG_OCID>"
oci dbtools database-api-gateway-config get \
  --database-api-gateway-config-id "$CONFIG_OCID"
```

Update global settings:

```bash
oci dbtools-runtime database-api-gateway-config-global update default \
  --database-api-gateway-config-id "$CONFIG_OCID" \
  --global-key SETTINGS \
  --pool-route PATH \
  --http-port 8088 \
  --https-port 0 
```

Create pools mapped to Database Tools connections:

```bash
oci dbtools-runtime database-api-gateway-config-pool create default \
  --database-api-gateway-config-id "$CONFIG_OCID" \
  --display-name ords_sample_app_pool \
  --pool-route-value base_db \
  --database-tools-connection-id <DBTOOLS_CONNECTION_OCID> \
  --min-pool-size 1 \
  --initial-pool-size 1 \
  --max-pool-size 10 \
  --rest-enabled-sql-status ENABLED \
  --jwt-profile-jwk-url "<JWT_PROFILE_JWK_URL>" \
  --jwt-profile-issuer "<JWT_PROFILE_ISSUER>" \
  --jwt-profile-audience "<JWT_PROFILE_AUDIENCE>"
```

Start ORDS with the configuration OCID:

```bash
./ords serve --ocid "$CONFIG_OCID"
```

If not running on OCI Compute and using a local OCI profile instead:

```bash
./ords --java-options "-Doci.profile=DEFAULT" serve --ocid "$CONFIG_OCID"
```

## Required `.env` Values for OCS and Database Bootstrap

```env
# ORDS base URL for your Base Database or ORDS instance.
# Replace <VM-PUBLIC-IP>, <VM-PORT>, and <POOL_NAME> with actual values.
# Keep the trailing slash.
BD_ORDS_URL=http://<VM-PUBLIC-IP>:<VM-PORT>/ords/<POOL_NAME>

# Oracle Database connect string used by migrate/seed/drop scripts.
# Examples:
#   host:1521/service_name
#   myadb_high, from tnsnames.ora when TNS_ADMIN is configured
BD_CONNECT_STRING=<HOST>:<PORT>/<SERVICE_NAME>

# Oracle Instant Client directory for Thick mode in node-oracledb.
ORACLE_CLIENT_LIB_DIR=<path>/instantclient_23_26

# Database admin user for schema create/migrate/seed/drop.
BD_ADMIN_USER=BD_admin
BD_ADMIN_PASSWORD=

# Schema that hosts ORDS Concert App objects.
SCHEMA_NAME=ORDS_CONCERT_APP
SCHEMA_PASSWORD=
```


## OCS Runtime Validation

```bash
curl -i http://<COMPUTE_HOST>:8088/ords/base_db/
```

Expected result: the ORDS pool route responds from the OCS-backed configuration.

## OCS Troubleshooting

| Symptom | Check |
| --- | --- |
| `401` or `403` with JWT | Confirm JWK URL reachability, exact issuer/audience match, token expiration, scopes, and clock skew. |
| `404` for path | Confirm pool mapping type is `PATH` and the path segment matches the pool route value. |
| Connection failures | Verify security lists/NSGs, route tables, listener reachability, and Database Tools connection test results. |
| OCI auth failures | Confirm the dynamic group rule matches the instance OCID and the policy applies to the config compartment. |
| Large JSON or shell quoting errors | Use `--from-json file://...` or `jq` to avoid shell quoting mistakes. |

---

# Cloud Metadata Migration

Use only `.sql` ORDS PL/SQL metadata definitions to generate both required artifacts:

- `ords_config_service/apispec.json`
- `ords_config_service/oci_requests.sh`

The shell file must contain only OCI raw-request commands: one `apiSpecs` create request first, followed by one `autoApiSpecs` request per qualifying Auto REST object.

Also apply the Oracle IAM app changes and endpoint normalization when target files exist. If a file/path is missing, report it and continue with available migration artifacts.

If ORDS is not installed in the target database and no ORDS PL/SQL metadata definitions are provided, mark this mode as `not applicable` for that environment. Do not block IAM/OIDC + pool-level JWT setup on missing `ORDS_METADATA`.

## Accepted Migration Input

When source ORDS PL/SQL metadata exists, accept only PL/SQL metadata from these calls:

- `ords.define_module`
- `ords.define_template`
- `ords.define_handler`
- `ords.define_parameter`
- `ords.define_privilege`
- `ords.define_role`
- `ords.define_client`
- `ords.enable_object`
- `ORDS_METADATA.ORDS.ENABLE_OBJECT`

If none of these source definitions are available, report that PL/SQL-source conversion is skipped and continue with runtime validation and authorization checks.

Do not use JavaScript constants, generated JSON, metadata-catalog output, runtime endpoint discovery, Swagger/OpenAPI files, or prior `openapi.json` as migration input.

## Migration Guardrails

- Build `apispec.json` from ORDS source metadata only.
- Keep custom REST and Auto REST artifacts separate.
- Put qualifying Auto REST objects in `autoApiSpecs`, never in OpenAPI `paths`.
- Qualify Auto REST objects only when `p_enabled => TRUE` and `p_auto_rest_auth => TRUE`.
- Preserve `x-dbtools-operation`, `x-dbtools-properties`, `p_source_type`, and `p_source`.
- Fail generation if any operation source is empty.
- Parse `ORDS.DEFINE_HANDLER` with parenthesis-depth and SQL string-literal awareness. Do not stop on `);` inside SQL or PL/SQL text.
- Path template placeholders and `in: path` parameter objects must match exactly, including case.
- Each `{placeholder}` requires one parameter with the identical `name`.
- No extra path parameters are allowed.
- Never invent request bodies, response fields, scopes, roles, secrets, OCIDs, domains, or customer values.

## Compatibility Profile

Use this OpenAPI and DBTools profile:

- OpenAPI version: `3.1.0`
- Collection paths: normalized without trailing slash
- Tags: operation-level tags must use only existing module names from PL/SQL `p_module_name` (for example `concert_app.euser.v1`, `concert_app.authuser.v1`, `concert_app.adminuser.v1`)
- Do not create derived or alias tags such as `euser`, `authuser`, or `adminuser`
- Responses: `200` responses with explicit `application/json` schemas
- Public `euser` endpoints: `security: []`
- Protected `authuser` endpoints: `[{"BEARER":["concert_app_authuser"]}]`
- Protected `adminuser` endpoints: `[{"BEARER":["concert_app_admin"]}]`
- `x-dbtools-properties`: flattened, with integer `itemsPerPage >= 1`
- SQL sources: semantically intact and JSON-safe escaped
- Path-template validation: strict, case-sensitive, no missing or extra path parameters

```

## Output Contract

Every migration run must produce both files:

- `ords_config_service/apispec.json`
- `ords_config_service/oci_requests.sh`

`apispec.json` content must be 2 to 102400 characters. If only qualifying `ords.enable_object` calls exist, `paths` may be empty.

Before submitting `apiSpecs` and `autoApiSpecs`, get the pool key:

```bash
oci dbtools-runtime database-api-gateway-config-pool list \
  --database-api-gateway-config-id "$CONFIG_OCID"
```

## `oci_requests.sh` Pattern

Use one `apiSpecs` create request first:

```bash
CONTENT=$(jq -c . ords_config_service/apispec.json)

oci dbtools-runtime database-api-gateway-config-pool-api-spec create default \
  --database-api-gateway-config-id $CONFIG_OCID \
  --pool-key $POOL_KEY \
  --display-name concert_sample_app_apispec \
  --content "$CONTENT"
```

Then add one `autoApiSpecs` request per qualifying object:

```bash
oci dbtools-runtime database-api-gateway-config-pool-auto-api-spec create default \
  --database-api-gateway-config-id $CONFIG_OCID \
  --pool-key $POOL_KEY\
  --display-name "The SEARCH_VIEW VIEW" \
  --database-object-name SEARCH_VIEW \
  --database-object-type VIEW \
  --description "This is a rest API of SEARCH_VIEW" \
  --alias "search_view" \
  --from-json '{"operations":["READ"]}'
```

## Reference Conversion Example

Input ORDS PL/SQL source:

```sql
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name    => 'music',
    p_base_path      => '/music/',
    p_items_per_page => 25,
    p_status         => 'PUBLISHED'
  );

  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'music',
    p_pattern     => 'artists/:id'
  );

  ORDS.DEFINE_HANDLER(
    p_module_name => 'music',
    p_pattern     => 'artists/:id',
    p_method      => 'GET',
    p_source_type => 'json/collection',
    p_source      => 'select artist_id, name from artists where artist_id = :id'
  );

  ORDS.DEFINE_PARAMETER(
    p_module_name        => 'music',
    p_pattern            => 'artists/:id',
    p_method             => 'GET',
    p_name               => 'id',
    p_bind_variable_name => 'id',
    p_source_type        => 'URI',
    p_param_type         => 'STRING',
    p_access_method      => 'IN'
  );

  DECLARE
    l_modules  OWA.VC_ARR;
    l_patterns OWA.VC_ARR;
  BEGIN
    l_modules(1) := 'music';
    l_patterns(1) := '/music/*';
    ORDS.DEFINE_PRIVILEGE(
      p_privilege_name => 'concert_app_authuser',
      p_patterns       => l_patterns,
      p_modules        => l_modules,
      p_label          => 'concert_app_authuser',
      p_description    => 'Provides access to the user specific endpoints'
    );
  END;

  ORDS.ENABLE_OBJECT(
    p_enabled        => TRUE,
    p_schema         => 'ORDS_CONCERT_APP',
    p_object         => 'SEARCH_ARTIST_VIEW',
    p_object_type    => 'VIEW',
    p_object_alias   => 'search_artist_view',
    p_auto_rest_auth => TRUE
  );

  COMMIT;
END;
/
```

Generated `ords_config_service/apispec.json`; update `<IDENTITY_DOMAIN_URL>` in `tokenUrl` before generation:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Demo API Spec",
    "version": "1.0.0"
  },
  "paths": {
    "/music/artists/{id}": {
      "get": {
        "operationId": "get_music_artists_id",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": true
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "BEARER": ["concert_app_authuser"]
          }
        ],
        "x-dbtools-operation": {
          "moduleName": "music",
          "pattern": "artists/:id",
          "method": "GET",
          "sourceType": "json/collection",
          "source": "select artist_id, name from artists where artist_id = :id",
          "parameters": [
            {
              "name": "id",
              "bindVariable": "id",
              "sourceType": "URI",
              "parameterType": "STRING",
              "accessMethod": "IN",
              "description": ""
            }
          ]
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "BEARER": {
        "type": "oauth2",
        "flows": {
          "clientCredentials": {
            "tokenUrl": "https://<IDENTITY_DOMAIN_URL>:443/oauth2/v1/token",
            "scopes": {
              "concert_app_admin": "Provides access to the concert app admin endpoints",
              "concert_app_authuser": "Provides access to the user specific endpoints",
              "concert_app_euser": "Provides limited access to the concert app endpoints"
            }
          }
        }
      }
    }
  },
  "x-dbtools-properties": {
    "itemsPerPage": 25,
    "published": "PUBLISHED"
  }
}
```

Generated `ords_config_service/oci_requests.sh`:

```bash
CONTENT=$(jq -c . ords_config_service/apispec.json)

oci dbtools-runtime database-api-gateway-config-pool-api-spec create default \
  --database-api-gateway-config-id $CONFIG_OCID \
  --pool-key $POOL_KEY \
  --display-name concert_sample_app_apispec \
  --content "$CONTENT"

oci dbtools-runtime database-api-gateway-config-pool-auto-api-spec create default \
  --database-api-gateway-config-id $CONFIG_OCID \
  --pool-key $POOL_KEY\
  --display-name "The SEARCH_ARTIST_VIEW VIEW" \
  --database-object-name SEARCH_ARTIST_VIEW \
  --database-object-type VIEW \
  --description "This is a rest API of SEARCH_ARTIST_VIEW" \
  --alias "search_artist_view" \
  --from-json '{"operations":["READ"]}'
```

This reference must satisfy all of these checks:

- `SEARCH_ARTIST_VIEW` is absent from OpenAPI `paths`.
- The Auto API Spec request exists for the enabled and authenticated object.
- `sourceType` and `source` are preserved exactly from source metadata.

## Migration Validation

Validate that:

- JSON is valid.
- Paths, methods, and parameters match ORDS source metadata.
- Auto API objects map correctly.
- No personal machine paths appear in generated commands.
- No source operation is empty.
- No tenant-specific values were invented.

Run an endpoint smoke check after deployment:

```bash
curl http://<COMPUTE_HOST>:8088/ords/<POOL_NAME>/euser/v1/landing_page_global_stats | jq
```

---

# Oracle IAM Target Setup

Run this first. Create or select an OCI IAM Identity Domain and one confidential application named `ords-sample-app`, used as both the Remix OIDC client and the resource definition for ORDS Concert scopes.

For environments where ORDS is not installed in the database, JWT validation must be configured in the ORDS pool (pool-level JWT profile), not as schema-level database metadata.

When creating the OCI IAM domain for this flow, enable:

- `Access signing certificate`
- `Configure client access`

## IAM Service Settings

| Setting | Value |
| --- | --- |
| Access token expiration | `3600` seconds |
| Primary audience | `ords/sample-app/` |
| Supported scopes | `concert_app_authuser`, `concert_app_admin` |

## IAM Client Settings

| Setting | Value |
| --- | --- |
| Client type | `Confidential` |
| Grant type | `Authorization code` |
| Redirect URL | `http://localhost:3000/callback` |
| Optional testing redirects | `https://insomnia.rest`, `https://oauth.pstmn.io/v1/callback` |
| Token issuance policy | `Specific` |
| Allowed resource scopes | `concert_app_authuser`, `concert_app_admin` |

Map `concert_app_authuser` to authenticated-user ORDS privileges and `concert_app_admin` to admin privileges. Keep the client secret server-side only.

## Required `.env` Values for Oracle IAM Mode

```env
# Copyright (c) 2024, Oracle and/or its affiliates.
# All rights reserved.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/

# ORDS base URL for your Base Database or ORDS instance.
# Replace <VM-PUBLIC-IP>, <VM-PORT>, and <POOL_NAME> with actual values.
# Keep the trailing slash.
BD_ORDS_URL=http://<VM-PUBLIC-IP>:<VM-PORT>/ords/<POOL_NAME>

# OCI IAM JWT credentials used by ORDS to validate protected endpoint requests.
JWT_ISSUER=https://identity.oraclecloud.com/
JWT_VERIFICATION_KEY=https://<DOMAIN_URL>:443/admin/v1/SigningCert/jwk
JWT_AUDIENCE=ords/sample-app/

# OCI IAM OIDC application configuration for the sample app.
OIDC_RETURN_TO_URL=http://localhost:3000
OIDC_REDIRECT_URI=http://localhost:3000/callback
OIDC_CLIENT_ID=<CLIENT_ID>
OIDC_CLIENT_SECRET=<CLIENT_SECRET>
OIDC_AUTHORIZATION_ENDPOINT=https://<DOMAIN_URL>:443/oauth2/v1/authorize
OIDC_TOKEN_ENDPOINT=https://<DOMAIN_URL>:443/oauth2/v1/token
OIDC_USERINFO_ENDPOINT=https://<DOMAIN_URL>:443/oauth2/v1/userinfo
OIDC_LOGOUT_ENDPOINT=https://<DOMAIN_URL>:443/oauth2/v1/userlogout
OIDC_AUDIENCE=ords/sample-app/
OIDC_SCOPES=openid,email,profile,ords/sample-app/concert_app_authuser,ords/sample-app/concert_app_admin
```

Validate exact tenant scope names before production rollout.

ORDS JWT validation requires:

- `JWT_ISSUER` exactly matches token `iss`.
- `JWT_AUDIENCE` exactly matches token `aud`.
- `JWT_VERIFICATION_KEY` is reachable by ORDS.
- Required SBAC scopes are present in the access token.

Pool-level JWT profile requirements for external ORDS:

- JWT profile mode is `POOL`.
- Pool JWT issuer matches `JWT_ISSUER`.
- Pool JWT audience matches `JWT_AUDIENCE`.
- Pool JWT JWK URL matches `JWT_VERIFICATION_KEY`.
- Do not depend on `ORDS_METADATA` presence in the database for JWT validation.

## Database Initialization and App Startup

### Database Lifecycle Admin User

Create a dedicated admin user for sample app database lifecycle operations such as `migrate`, `seed`, and `drop`, plus schema bootstrap.

```sql
-- Run as a privileged account, for example ADMIN or SYSDBA.
CREATE USER BD_admin IDENTIFIED BY "<BD_ADMIN_PASSWORD>";
GRANT CREATE SESSION TO BD_admin;
GRANT CREATE USER, ALTER USER, DROP USER TO BD_admin;
GRANT CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE PROCEDURE, CREATE TRIGGER TO BD_admin;
GRANT CREATE TYPE, CREATE SYNONYM TO BD_admin;
GRANT UNLIMITED TABLESPACE TO BD_admin;
GRANT GRANT ANY PRIVILEGE, GRANT ANY ROLE TO BD_admin;
```

Use `BD_admin` to create the sample app schema, normally `ORDS_CONCERT_APP`, and to run migration, seed, and drop scripts.

Before `npm run dev`, initialize the sample schema and data:

```bash
npm run migrate
npm run seed

# Optional cleanup/reset when needed:
npm run drop
```

Validate app startup:

```bash
npm run dev
```

If the project exposes a direct alias, `npm seed` is equivalent to `npm run seed`.

## node-oracledb Thick Mode Issue

If this error appears in Thin mode:

```text
NJS-116: the database listener/server is requiring Oracle Native Network Encryption and/or Data Integrity checksumming. Thin mode does not support those; use Thick mode.
```

Install Oracle Instant Client and set `ORACLE_CLIENT_LIB_DIR`:

```bash
hdiutil mount instantclient-basic-macos*.dmg
cd /Volumes/instantclient-basic-macos*
./install_ic.sh
cd ~
hdiutil unmount /Volumes/instantclient-basic-macos*
```

Then update `.env`:

```env
ORACLE_CLIENT_LIB_DIR=<path>/instantclient_23_26
```

Common IAM/OIDC issues are wrong endpoints, wrong client credentials, callback URL mismatch, and missing or mismatched scopes.

---

# ORDS Authorization Mapping

Use SBAC by default.

| Token scope | Expected access |
| --- | --- |
| `concert_app_authuser` | User endpoints. |
| `concert_app_admin` | Admin endpoints. |
| Missing scope | Denied for protected endpoints. |
| Wrong audience | Denied. |
| Wrong issuer | Denied. |

Expected JWT shape:

```json
{
  "iss": "<JWT_ISSUER>",
  "aud": "<JWT_AUDIENCE>",
  "exp": 1735689600,
  "scope": "concert_app_authuser"
}
```

Required checks:

- A normal user token can access user endpoints.
- A non-admin user token cannot access admin endpoints.
- An admin token can access admin endpoints.
- A token with missing scope is denied.
- A token with wrong audience is denied.
- A token with wrong issuer is denied.
- Expired tokens are denied.

---

# Auth0 Baseline Setup

Run this last, only for original setup reproduction, legacy automation, or migration comparison. Required values are `AUTH0_DOMAIN`, Management API app `CLIENT_ID` and `CLIENT_SECRET`, `API_IDENTIFIER`, callback/logout URLs, and scopes.

## Rerunnable Auth0 Automation Rules

- `POST /api/v2/resource-servers` may include `identifier`.
- `PATCH /api/v2/resource-servers/{id}` must not include `identifier`.
- A `400 invalid_body` mentioning `identifier` means the PATCH payload included an immutable field.

Create a Machine-to-Machine Management API app with only needed scopes:

- `create:resource_servers`
- `read:resource_servers`
- `update:resource_servers`
- `create:clients`
- `read:clients`
- `update:clients`
- `create:client_grants`
- `read:client_grants`
- `update:client_grants`
- `delete:client_grants`

Export credentials:

```bash
export AUTH0_DOMAIN="your-tenant.us.auth0.com"
export CLIENT_ID="your_management_app_client_id"
export CLIENT_SECRET="your_management_app_client_secret"
```

Obtain the Management API token:

```bash
ACCESS_TOKEN=$(
  curl -s --request POST \
    --url "https://$AUTH0_DOMAIN/oauth/token" \
    --header "content-type: application/json" \
    --data "{
      \"client_id\": \"$CLIENT_ID\",
      \"client_secret\": \"$CLIENT_SECRET\",
      \"audience\": \"https://$AUTH0_DOMAIN/api/v2/\",
      \"grant_type\": \"client_credentials\"
    }" | jq -r '.access_token'
)
```

Create or update the API resource server:

```bash
API_IDENTIFIER="https://concert.sample.app"
API_NAME="ORDS Concert API"

RESOURCE_SCOPES='[
  {"value":"read:general_user_content","description":"Read all of the general user endpoints"},
  {"value":"concert_app_authuser","description":"Provides access to the user specific endpoints"},
  {"value":"concert_app_admin","description":"Provides access to the concert app admin endpoints"}
]'
```

Find the existing resource server by identifier:

```bash
RS_LIST=$(
  curl -s --request GET \
    --url "https://$AUTH0_DOMAIN/api/v2/resource-servers?per_page=100" \
    --header "authorization: Bearer $ACCESS_TOKEN"
)

RS_ID=$(printf '%s' "$RS_LIST" | jq -r --arg idf "$API_IDENTIFIER" '.[] | select(.identifier==$idf) | .id' | head -n1)
```

Create payload, where `identifier` is allowed:

```bash
CREATE_PAYLOAD=$(
  jq -cn --arg name "$API_NAME" --arg identifier "$API_IDENTIFIER" --argjson scopes "$RESOURCE_SCOPES" '{
    name: $name,
    identifier: $identifier,
    signing_alg: "RS256",
    scopes: $scopes,
    subject_type_authorization: {
      user: { policy: "require_client_grant" },
      client: { policy: "deny_all" }
    }
  }'
)
```

Update payload, where `identifier` is not allowed:

```bash
UPDATE_PAYLOAD=$(
  jq -cn --arg name "$API_NAME" --argjson scopes "$RESOURCE_SCOPES" '{
    name: $name,
    signing_alg: "RS256",
    scopes: $scopes,
    subject_type_authorization: {
      user: { policy: "require_client_grant" },
      client: { policy: "deny_all" }
    }
  }'
)

if [ -z "$RS_ID" ]; then
  API_RESPONSE=$(
    curl -s --request POST \
      --url "https://$AUTH0_DOMAIN/api/v2/resource-servers" \
      --header "authorization: Bearer $ACCESS_TOKEN" \
      --header "content-type: application/json" \
      --data "$CREATE_PAYLOAD"
  )
else
  API_RESPONSE=$(
    curl -s --request PATCH \
      --url "https://$AUTH0_DOMAIN/api/v2/resource-servers/$RS_ID" \
      --header "authorization: Bearer $ACCESS_TOKEN" \
      --header "content-type: application/json" \
      --data "$UPDATE_PAYLOAD"
  )
fi

API_ID=$(printf '%s' "$API_RESPONSE" | jq -r '.id')
API_IDENTIFIER=$(printf '%s' "$API_RESPONSE" | jq -r '.identifier')
```

Create the sample Regular Web Application client:

```bash
APP_RESPONSE=$(
  curl --silent --show-error --fail \
    --request POST \
    --url "https://${AUTH0_DOMAIN}/api/v2/clients" \
    --header "authorization: Bearer ${ACCESS_TOKEN}" \
    --header "content-type: application/json" \
    --data '{
      "name": "ORDS Remix JWT Sample",
      "app_type": "regular_web",
      "grant_types": ["authorization_code"],
      "callbacks": ["http://localhost:3000/callback"],
      "allowed_logout_urls": ["http://localhost:3000"],
      "web_origins": ["http://localhost:3000"]
    }'
)

APP_CLIENT_ID=$(printf '%s' "$APP_RESPONSE" | jq -r '.client_id')
APP_CLIENT_SECRET=$(printf '%s' "$APP_RESPONSE" | jq -r '.client_secret')
```

Authorize the app to call the API:

```bash
CLIENT_GRANT_RESPONSE=$(
  curl -s --request POST \
    --url "https://$AUTH0_DOMAIN/api/v2/client-grants" \
    --header "authorization: Bearer $ACCESS_TOKEN" \
    --header "content-type: application/json" \
    --data "{
      \"client_id\": \"$APP_CLIENT_ID\",
      \"audience\": \"$API_IDENTIFIER\",
      \"scope\": [
        \"read:general_user_content\",
        \"concert_app_authuser\",
        \"concert_app_admin\"
      ],
      \"subject_type\": \"user\"
    }"
)
```

Generate environment values:

```bash
cat <<EOF
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_LOGOUT_URL=https://$AUTH0_DOMAIN/v2/logout
JWT_ISSUER=https://$AUTH0_DOMAIN/
AUTH0_CLIENT_ID=$APP_CLIENT_ID
AUTH0_CLIENT_SECRET=$APP_CLIENT_SECRET
AUTH0_RETURN_TO_URL=http://localhost:3000
AUTH0_CALLBACK_URL=http://localhost:3000/callback
JWT_AUDIENCE=$API_IDENTIFIER
JWT_VERIFICATION_KEY=https://$AUTH0_DOMAIN/.well-known/jwks.json
EOF
```

Validate baseline startup:

```bash
npm run migrate
npm run seed

# Optional teardown/reset:
npm run drop

npm run dev
```

Common Auth0 issues are immutable `identifier` on PATCH, callback mismatch, and missing scopes in issued tokens.

---

# Validation Workflow

Use this workflow for `validate-bootstrap` or after any setup change.

## Environment Checks

- Required variables are present.
- Blocking placeholders are replaced.
- Secrets are not committed or printed in docs.
- ORDS base URL keeps the expected trailing slash where required by the app.
- `.env` changes are followed by schema/data refresh when needed.

Refresh schema and data after relevant `.env` changes:

```bash
npm run migrate
npm run seed

# Optional teardown/reset:
npm run drop

npm run dev
```

## JWT Checks

Verify:

- `iss`
- `aud`
- `exp`
- `scope`
- JWKS URL reachability
- claim names expected by ORDS

## App Checks

Verify:

- Login starts the OIDC flow.
- Callback route completes successfully.
- Logout redirects correctly.
- Session handling works with large token payloads.
- Protected routes enforce authorization.

## ORDS Positive Checks

- Public endpoint works without a token.
- Protected user endpoint accepts a valid user token.
- Protected admin endpoint accepts a valid admin token.

## ORDS Negative Checks

- Missing token fails.
- Invalid token fails.
- Expired token fails.
- Wrong audience fails.
- Wrong issuer fails.
- Missing scope fails.
- Non-admin user fails against admin endpoints.

## OCS Checks

- Config OCID resolves.
- Pool exists and route value is correct.
- Database Tools connection works.
- ORDS starts with the config OCID.
- Database is reachable.
- API spec is available.
- Auto API specs map to qualifying objects only.

---

# Troubleshooting Reference

| Area | Likely causes |
| --- | --- |
| Login | Wrong callback URL, client ID/secret, authorization endpoint, token endpoint, or route action. |
| JWT | Wrong issuer, audience, JWKS URL, expired token, malformed token, or missing scope. |
| Authorization | User lacks scope, ORDS privilege mapping is wrong, or claim name mismatches. |
| OCS startup | Wrong config OCID/region, missing permissions, Database Tools connection issue, wrong pool key, or ORDS cannot access OCI config. |
| API spec migration | Invalid JSON, incorrect path/method/parameter mapping, missing handler source, schema object not enabled, or Auto API Spec mismatch. |
| Database bootstrap | Wrong connect string, missing Instant Client in Thick mode, insufficient admin grants, or missing schema credentials. |

---

# Style and Maintenance Rules

- Preserve the technical setup logic and required bootstrap order.
- Keep this skill as one markdown file. Do not split it into multiple markdown files.
- Remove duplication when editing, but do not remove required validation, security, or migration constraints.
- Use consistent terms: `Auth0 baseline`, `Oracle IAM target`, `OCI Database API Gateway / OCS`, `ORDS authorization`, and `cloud metadata migration`.
- Use clear headings, tables where helpful, and fenced code blocks for commands/configuration.
- Do not add unrelated project-management sections.
- Do not invent real secrets, OCIDs, domains, customer values, paths, scopes, or roles.
- If the user requests a narrow change, still preserve the required response contract and security warnings in abbreviated form.

## Sources

- [Deploying ORDS with the OCI Database API Gateway Configuration Service](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.1/ordig/configuring-additional-databases.html#GUID-707DE44D-50D3-42CE-8350-FF69E53A6B6C)
- [Configuring Oracle REST Data Services for Multiple Databases](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.1/ordig/configuring-additional-databases.html#GUID-C8D8F633-2777-41C5-BC4E-CC1F222CCDC0)
- [Working with Database API Gateway Configurations](https://docs.oracle.com/en-us/iaas/database-tools/doc/database-api-gateway-configuration.html)
- [How to Secure Oracle Database REST APIs with OCI IAM (IDCS) JSON Web Tokens and Role-Based Access Claims, Part One](https://blogs.oracle.com/database/ords-apis-iam-jwts-role-based-claims-part-one)
- [Auth0 management API](https://auth0.com/docs/api/management/v2)
