# APEX Workspace Schema Mapping

Use this topic for parsing schema mappings, additional schemas, workspace export/import preparation, and deployment handoff.

MCP-backed APEX schema-mapping reads and `APEX_INSTANCE_ADMIN.ADD_SCHEMA` calls must use the confirmed APEX admin identity from `apex/admin/SKILL.md`. If schema privilege inspection, grants, quotas, user creation, or tablespace changes require broader database privileges, stop and route that portion to the DB skill with that skill's required connection/user.

## Parsing Schema Guardrails

Only suggest application-owned schemas as APEX parsing schemas. Do not suggest platform, runtime, DBA, or service accounts, even if they technically exist and have `CREATE SESSION`.

Never suggest these accounts or account families as primary or additional parsing schemas:

- `PDB_ADMIN`
- `ADMIN`
- `SYS`, `SYSTEM`, `DBSNMP`, `OUTLN`, `GSMADMIN_INTERNAL`
- Oracle-maintained accounts where `ORACLE_MAINTAINED = 'Y'`
- APEX platform schemas such as `APEX_%`, `FLOWS_%`, `APEX_PUBLIC_USER`, `APEX_LISTENER`, `APEX_REST_PUBLIC_USER`
- ORDS schemas such as `ORDS_METADATA`, `ORDS_PUBLIC_USER`, and any `ORDS_%` service/runtime schema
- Runtime or shared service accounts used by ORDS, connection pools, monitoring, CI/CD, or automation
- Personal developer accounts in production

Prefer schemas created specifically for the application or workspace, for example `SALES_APP`, `SALES_REF`, or `HR_PORTAL_APP`.

## Find Candidate Schemas

Use this as a conservative starting point when the user asks which schemas can be mapped. Review the result with the user before creating or changing mappings.

```sql
SELECT username,
       account_status,
       authentication_type,
       default_tablespace,
       created
FROM dba_users
WHERE oracle_maintained = 'N'
  AND account_status NOT LIKE 'LOCKED%'
  AND username NOT IN (
      'ADMIN',
      'PDB_ADMIN',
      'APEX_PUBLIC_USER',
      'APEX_LISTENER',
      'APEX_REST_PUBLIC_USER',
      'ORDS_METADATA',
      'ORDS_PUBLIC_USER'
  )
  AND username NOT LIKE 'APEX\_%' ESCAPE '\\'
  AND username NOT LIKE 'FLOWS\_%' ESCAPE '\\'
  AND username NOT LIKE 'ORDS\_%' ESCAPE '\\'
ORDER BY username;
```

On environments where `DBA_USERS.ORACLE_MAINTAINED` is not visible, use `ALL_USERS` only as a fallback and apply the same name-based exclusions. When in doubt, ask whether the schema is application-owned before mapping it.

## Existing Schema Privilege Check

When the user wants to reuse an existing schema as a primary or additional parsing schema, check its account status, quotas, and current system privileges before mapping it. Do not assume an existing user is suitable just because it exists.

```sql
SELECT username,
       account_status,
       authentication_type,
       default_tablespace,
       temporary_tablespace,
       oracle_maintained
FROM dba_users
WHERE username = UPPER(:schema_name);
```

```sql
SELECT privilege
FROM dba_sys_privs
WHERE grantee = UPPER(:schema_name)
ORDER BY privilege;
```

```sql
SELECT tablespace_name,
       bytes,
       max_bytes
FROM dba_ts_quotas
WHERE username = UPPER(:schema_name)
ORDER BY tablespace_name;
```

Evaluate the result against the application need. Typical APEX application parsing schemas may need narrowly scoped object-creation privileges such as `CREATE TABLE`, `CREATE VIEW`, `CREATE SEQUENCE`, `CREATE PROCEDURE`, `CREATE TRIGGER`, `CREATE TYPE`, and quota on the application tablespace. The standard APEX-managed grant path is `APEX_INSTANCE_ADMIN.ADD_SCHEMA(..., p_grant_apex_privileges => TRUE)`, which applies privileges from `APEX_GRANTS_FOR_NEW_USERS_ROLE` in releases that support it. That role may include database-version-specific privileges such as `CREATE MLE` and `EXECUTE DYNAMIC MLE`. Schemas should not receive broad administrative grants such as `DBA`, `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`, `CREATE ANY TABLE`, `GRANT ANY ROLE`, or `GRANT ANY PRIVILEGE` for ordinary workspace creation.

If required privileges are missing or existing privileges are too broad, stop before mapping the schema and ask:

```text
The existing schema <SCHEMA_NAME> does not match the expected privilege profile for this APEX workspace. Do you want me to route the privilege adjustment through db/security/privilege-management.md before continuing?
```

If privileges are correct, continue with the workspace creation or schema mapping. Do not generate GRANT or REVOKE statements from this APEX skill; route generic database privilege changes to `db/security/privilege-management.md`.

## APEX-Managed Schema Grants

For APEX releases where `APEX_INSTANCE_ADMIN.ADD_SCHEMA` exposes `p_grant_apex_privileges`, use APEX-managed schema privilege grants as the standard for new database users/schemas that will be used as APEX workspace or parsing schemas:

```sql
BEGIN
    APEX_INSTANCE_ADMIN.ADD_SCHEMA(
        p_workspace             => :workspace_name,
        p_schema                => :schema_name,
        p_grant_apex_privileges => TRUE);
END;
/
```

This option grants the standard APEX privileges for a workspace schema, including privileges from `APEX_GRANTS_FOR_NEW_USERS_ROLE` in APEX releases that support that role. It is the APEX-owned equivalent of the Administration Services "Grant APEX Privileges" behavior. Use it unless the user or environment policy explicitly opts out. Do not rely on the package default; installed package specs can default `p_grant_apex_privileges` to `FALSE`, so pass `TRUE` explicitly when standard APEX grants are required.

Before using the parameter, verify the installed APEX package signature. `APEX_INSTANCE_ADMIN` may be a synonym for the real APEX package, such as `WWV_FLOW_INSTANCE_ADMIN`, so resolve the synonym instead of checking only `PACKAGE_NAME = 'APEX_INSTANCE_ADMIN'`:

```sql
WITH apex_instance_admin_target AS (
    SELECT owner,
           object_name AS package_name
    FROM all_objects
    WHERE object_name = 'APEX_INSTANCE_ADMIN'
      AND object_type = 'PACKAGE'
    UNION ALL
    SELECT table_owner AS owner,
           table_name  AS package_name
    FROM all_synonyms
    WHERE synonym_name = 'APEX_INSTANCE_ADMIN'
)
SELECT DISTINCT
       a.owner,
       a.package_name,
       a.object_name,
       a.overload,
       a.sequence,
       a.position,
       a.argument_name,
       a.in_out,
       a.data_type,
       a.defaulted
FROM apex_instance_admin_target t
JOIN all_arguments a
  ON a.owner = t.owner
 AND a.package_name = t.package_name
WHERE a.object_name = 'ADD_SCHEMA'
ORDER BY a.owner,
         a.package_name,
         a.overload,
         a.sequence;
```

If permissions allow, inspect the standard APEX role contents before and after provisioning:

```sql
SELECT privilege
FROM sys.dba_sys_privs
WHERE grantee = 'APEX_GRANTS_FOR_NEW_USERS_ROLE'
ORDER BY privilege;
```

If `p_grant_apex_privileges` is absent, use the older `ADD_SCHEMA` signature and route any missing privilege remediation to `db/security/privilege-management.md`. Do not invent manual grants in this APEX skill. If a schema is already mapped by `ADD_WORKSPACE`, do not blindly call `ADD_SCHEMA` for the same schema; verify the mapping and privileges, then route missing manual remediation to the DB skill when the supported APEX API path is unavailable.

## Add Schema Mapping

Add an existing schema to a workspace with supported APEX APIs.

```sql
BEGIN
    APEX_INSTANCE_ADMIN.ADD_SCHEMA(
        p_workspace             => :workspace_name,
        p_schema                => :schema_name,
        p_grant_apex_privileges => TRUE);
END;
/
```

Check package signatures first:

```sql
WITH apex_instance_admin_target AS (
    SELECT owner,
           object_name AS package_name
    FROM all_objects
    WHERE object_name = 'APEX_INSTANCE_ADMIN'
      AND object_type = 'PACKAGE'
    UNION ALL
    SELECT table_owner AS owner,
           table_name  AS package_name
    FROM all_synonyms
    WHERE synonym_name = 'APEX_INSTANCE_ADMIN'
)
SELECT DISTINCT
       a.owner,
       a.package_name,
       a.argument_name,
       a.position,
       a.data_type,
       a.defaulted
FROM apex_instance_admin_target t
JOIN all_arguments a
  ON a.owner = t.owner
 AND a.package_name = t.package_name
WHERE a.object_name = 'ADD_SCHEMA'
ORDER BY a.owner,
         a.package_name,
         a.position;
```

## Export And Import

For application imports into a target workspace, use the deployment skill for `APEX_APPLICATION_INSTALL`, build options, substitution strings, credential references, and safe import validation.

DB skill in use: `db/devops/schema-migrations.md` for generic schema migration governance. The APEX workspace skill is being used for workspace-to-schema mapping.

DB skill in use: `db/security/privilege-management.md` for generic grants and database object privileges. The APEX workspace skill is being used only to decide which application-owned schemas may be mapped to a workspace.

Use `references/deployment/` for APEX application export/import and environment promotion details.

## Guardrails

- Parsing schemas are not personal interactive logins in production.
- Do not write directly to internal APEX repository tables.
- Keep workspace schema mapping separate from generic object privileges.
- Review APEX exports before sharing; they may contain URLs, authorization schemes, build options, static files, credential references, defaults, and business logic.
