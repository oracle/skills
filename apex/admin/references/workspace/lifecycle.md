# APEX Workspace Lifecycle

Use this topic for workspace inventory, pre-flight checks, create workspace, and verification.

## Pre-Flight Questions

- APEX version, because package signatures differ across APEX releases.
- Run the supported-version gate in `references/workspace/version-notes.md`. If the installed APEX version is unsupported, stop before workspace inventory, create, schema mapping, user changes, or application handoff.
- Target workspace name and whether a deterministic workspace ID is required.
- Primary parsing schema and any additional schemas.
- Always ask whether the workspace should use a new database user/schema or an existing database user/schema before creating the workspace. Do not infer this from the requested workspace name.
- If a new database user/schema is requested, route generic user creation and grants through the relevant DB skills before calling `APEX_INSTANCE_ADMIN.ADD_WORKSPACE`.
- If an existing database user/schema is requested, verify it with `references/workspace/schema-mapping.md` before workspace creation.
- Whether the first user should be an APEX workspace administrator, developer, or end user.
- Authentication model for the development environment.
- Confirm parsing-schema candidates with `references/workspace/schema-mapping.md`; do not suggest ORDS schemas, `PDB_ADMIN`, Oracle-maintained accounts, APEX platform schemas, or DBA/runtime service accounts as parsing schemas.
- If the user wants to reuse an existing parsing schema, verify required privileges first. If privileges are missing or excessive, ask whether the user wants the DB privilege changes handled through `db/security/privilege-management.md`; continue only when the privileges are correct or the user approves adjustment.
- Whether this is Oracle Cloud or Autonomous Database, where some instance administration options may be restricted.

## List Workspaces

Use `APEX_WORKSPACES` for workspace inventory.

```sql
SELECT workspace_id,
       workspace,
       workspace_display_name,
       path_prefix,
       schemas,
       applications,
       apex_developers,
       apex_workspace_administrators,
       allow_app_building_yn,
       allow_sql_workshop_yn,
       allow_restful_services_yn,
       created_on
FROM apex_workspaces
ORDER BY workspace;
```

If you need a version-safe query, inspect installed columns first:

```sql
SELECT column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name = 'APEX_WORKSPACES'
ORDER BY column_id;
```

## Create A Workspace

Run instance-level workspace APIs with a dedicated non-SYS/SYSTEM database account granted `APEX_ADMINISTRATOR_ROLE`. Do not connect MCP or routine automation as `SYS`, `SYSTEM`, or `SYSDBA` for workspace creation.

Use `SYS`/`SYSTEM` only for explicit APEX installation, upgrade, emergency DBA, or grant-management work. Treat those as privileged database administration tasks and route them to the appropriate database/admin skill. Do not grant broad DBA privileges just to automate workspace creation.

Before creating a workspace through MCP-backed automation, run the identity guard:

```sql
SELECT SYS_CONTEXT('USERENV', 'SESSION_USER') AS session_user,
       SYS_CONTEXT('USERENV', 'CURRENT_USER') AS current_user,
       SYS_CONTEXT('USERENV', 'ISDBA') AS is_dba
FROM dual;
```

If `SESSION_USER` or `CURRENT_USER` is `SYS` or `SYSTEM`, or `IS_DBA` is `TRUE`, stop. Ask for a dedicated non-SYS/SYSTEM APEX admin connection with `APEX_ADMINISTRATOR_ROLE`.

```sql
BEGIN
    APEX_INSTANCE_ADMIN.ADD_WORKSPACE(
        p_workspace_id   => :workspace_id,
        p_workspace      => :workspace_name,
        p_primary_schema => :primary_schema);
END;
/
```

Check `APEX_INSTANCE_ADMIN.ADD_WORKSPACE` arguments with `ALL_ARGUMENTS` before using version-specific parameters.

## Verify

After creation, verify workspace, schema mappings, APEX users, and expected privileges through supported APEX views. Do not query or update internal APEX repository tables directly.

## Application Creation Boundary

Workspace creation and APEX application creation are separate skill boundaries. If the user wants to create a starter application after workspace provisioning, first verify the workspace and schema mapping, then announce the handoff:

```text
APEXlang skill in use: apex/apexlang/SKILL.md for APEX application generation. The APEX admin skill is being used only for workspace, deployment identity, connection safety, and post-deploy validation.
```

Load `apex/apexlang/SKILL.md` for the actual application scaffold or APEXlang artifacts. Keep this workspace lifecycle topic only for workspace inventory, schema mapping, APEX user setup, and post-create verification.

Before MCP-backed application materialization, validation, or import continues, show the verified connection identity and ask whether to continue with that connection user. Do not reuse the workspace-provisioning connection silently.

## Provisioning Recovery After Interruption

If a workspace provisioning workflow is interrupted, aborted, or loses MCP/database connectivity after any create step may have run, do not continue or retry blindly. Reconnect first, then inventory each planned artifact individually before deciding what to do next.

Check only the objects that were part of the current provisioning plan:

```sql
SELECT workspace_id,
       workspace,
       schemas,
       applications,
       apex_developers,
       apex_workspace_administrators
FROM apex_workspaces
WHERE workspace = UPPER(TRIM(:workspace_name));
```

```sql
SELECT workspace_name,
       schema
FROM apex_workspace_schemas
WHERE workspace_name = UPPER(TRIM(:workspace_name))
ORDER BY schema;
```

```sql
SELECT workspace_name,
       user_name,
       email,
       is_admin,
       is_application_developer,
       account_locked
FROM apex_workspace_apex_users
WHERE workspace_name = UPPER(TRIM(:workspace_name))
ORDER BY user_name;
```

```sql
SELECT username,
       account_status,
       oracle_maintained
FROM dba_users
WHERE username IN (
    UPPER(TRIM(:primary_schema)),
    UPPER(TRIM(:database_login_user))
)
ORDER BY username;
```

```sql
SELECT owner,
       object_name,
       object_type,
       status
FROM all_objects
WHERE owner = UPPER(TRIM(:primary_schema))
  AND object_name IN ('EMP')
ORDER BY object_type, object_name;
```

```sql
SELECT workspace,
       application_id,
       application_name,
       alias
FROM apex_applications
WHERE workspace = UPPER(TRIM(:workspace_name))
ORDER BY application_id;
```

Report the recovered inventory in concrete terms: created, missing, or unknown for each planned workspace, schema mapping, APEX user, database user, application table, and APEX application.

Then ask before cleanup:

```text
I found the following artifacts from the interrupted APEX provisioning workflow: <ARTIFACT_LIST>. Do you want me to roll back the listed artifacts by removing only these objects?
```

If the user wants cleanup, route the destructive part through `references/workspace/removal.md` and require its exact English confirmation for the current cleanup scope. If the user wants to continue instead, proceed only from the freshly verified inventory and skip create steps for objects that already exist.

DB skill in use: `db/security/privilege-management.md` for generic schema/user privilege design. The APEX workspace skill is being used for workspace and parsing-schema context.
