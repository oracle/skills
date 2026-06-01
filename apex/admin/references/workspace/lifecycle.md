# APEX Workspace Lifecycle

Use this topic for workspace inventory, pre-flight checks, create workspace, and verification.

## Pre-Flight Questions

- APEX version, because package signatures differ across APEX releases.
- Run the supported-version gate in `references/workspace/version-notes.md`. If the installed APEX version is unsupported, stop before workspace inventory, create, schema mapping, user changes, or application handoff.
- Check the instance feature-configuration parameter `WORKSPACE_PROVISION_DEMO_OBJECTS` before workspace creation and confirm whether demonstration applications/database objects should be created. For clean customer, production, CI, or migration workspaces, recommend `N` unless the user explicitly asks for demo/training objects.
- Target workspace name and whether a deterministic workspace ID is required.
- Workspace description or administrative notes that should be recorded during provisioning.
- Primary parsing schema and any additional schemas.
- Always ask whether the workspace should use a new database user/schema or an existing database user/schema before creating the workspace. Do not infer this from the requested workspace name.
- If a new database user/schema is requested, route generic user creation and grants through the relevant DB skills before calling `APEX_INSTANCE_ADMIN.ADD_WORKSPACE`.
- If an existing database user/schema is requested, verify it with `references/workspace/schema-mapping.md` before workspace creation.
- Whether the first user should be an APEX workspace administrator, developer, or end user.
- For bulk provisioning, ask for the workspace naming method, workspace count, quota, Resource Manager consumer group, automatic-purge setting, demo-object policy, email-address input when relevant, and confirmation policy before any create loop.
- Authentication model for the development environment.
- Confirm parsing-schema candidates with `references/workspace/schema-mapping.md`; do not suggest ORDS schemas, `PDB_ADMIN`, Oracle-maintained accounts, APEX platform schemas, or DBA/runtime service accounts as parsing schemas.
- If the user wants to reuse an existing parsing schema, verify required privileges first. If privileges are missing or excessive, ask whether the user wants the DB privilege changes handled through `db/security/privilege-management.md`; continue only when the privileges are correct or the user approves adjustment.
- Whether this is Oracle Cloud or Autonomous Database, where some instance administration options may be restricted.

## Administration Services Operation Coverage

Use this section to map Oracle APEX 26.1 Administration Services workspace-creation operations to this skill. Keep APEX administration here and route generic database administration to the selected DB skill.

Provisioning method settings:

- Manual: Instance administrators create workspaces and notify workspace administrators. Use this skill for the APEX workspace decision and verification steps.
- Request: users request workspaces, administrators approve requests, email verification creates the workspace, and status moves from accepted to approved. Before advising this path, confirm APEX email configuration and notification-address requirements.
- Automatic: similar to Request, but requests are approved without administrator review. Call out the governance risk and any disabled-provisioning message requirement before recommending it.
- Oracle Cloud or managed-service restrictions may remove or alter these Administration Services options. Ask for the environment type and route service-specific administration to the cloud/service path when local instance settings are unavailable.

Manual Create Workspace Wizard coverage:

- Identify Workspace: collect unique workspace name, optional positive workspace ID greater than 100000 when deterministic ID is required, and description.
- Identify Schema, existing schema: select an existing application-owned schema, inspect suggested additional privileges, and use `references/workspace/schema-mapping.md` before mapping it. Route grants or privilege remediation to `db/security/privilege-management.md`.
- Identify Schema, new schema: collect intended schema name and quota, but route database-user creation, password handling, tablespace, datafile, quota, and grants to the DB skill before the APEX workspace API step.
- Identify Administrator: use `references/workspace/users-and-auth.md` for the initial workspace administrator and password-handling guardrails.
- Confirm selections: summarize workspace name, workspace ID policy, schema model, additional schemas, quota/storage implications, initial administrator, environment type, and DB-skill handoffs before creating.

Feature Configuration side effects:

- The Administration Services setting `Create demonstration objects in new workspaces` maps to `APEX_INSTANCE_ADMIN` parameter `WORKSPACE_PROVISION_DEMO_OBJECTS`. In APEX 26.1, `Y` creates demonstration applications and database objects in new workspaces; `N` prevents that side effect.
- Treat this as an instance-level setting, not as a per-workspace option. Before workspace creation, show the current value and ask for the desired policy.
- If the current value conflicts with the user's desired policy, stop before creating the workspace. Ask whether the user wants to change the instance setting, change it in the Administration Services UI, or proceed with the documented side effect. Do not call `APEX_INSTANCE_ADMIN.SET_PARAMETER` without explicit confirmation.
- If the setting is changed only for one provisioning run, record the previous value and ask whether to restore it after workspace verification.

Runtime-environment SQLcl path:

- Oracle's runtime-environment documentation shows `SYS AS SYSDBA`, `ALTER SESSION SET CURRENT_SCHEMA = APEX_<version>`, and `APEX_INSTANCE_ADMIN.ADD_WORKSPACE`.
- Do not run this path as a routine MCP APEX admin operation. MCP-backed workspace creation in this skill uses the confirmed APEX admin identity from `apex/admin/SKILL.md`.
- If the user explicitly needs the documented `SYS AS SYSDBA` runtime-installation path, classify it as privileged DB/admin work, ask before switching to the relevant DB skill, and use that DB skill's required connection/user. This skill may still provide APEX workspace parameters and post-create verification.

Creating multiple workspaces:

- Cover the three Administration Services naming modes: system-generated workspace names, static prefix with sequential integer suffix, and email-domain workspace names with suffixes for duplicates.
- Collect all wizard inputs before generating a plan: workspace count or email-address source, demo-object policy, space quota, Resource Manager consumer group, automatic-purge eligibility, and description.
- Treat bulk creation as destructive-enough to require a preview and explicit confirmation of the exact naming pattern, count, schema model, quota, and administrator/contact policy.
- Do not use internal APEX repository tables for bulk creation. Use supported APEX APIs only when signatures are verified for the installed version, or instruct the user to use the Administration Services wizard when no supported API shape is available.

Oracle-Managed Files and storage:

- When creating a workspace with a new schema, a new tablespace and data file may be created for that schema. If Oracle-Managed Files is enabled, data-file placement follows `DB_CREATE_FILE_DEST`; otherwise placement follows the database's tablespace/data-file conventions.
- Keep this as a storage-governance input in the APEX plan. Route `DB_CREATE_FILE_DEST`, datafile placement, tablespace creation, and filesystem/storage remediation to the DB skill with its required connection/user.

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

Then check the demo-object provisioning setting:

```sql
SELECT APEX_INSTANCE_ADMIN.GET_PARAMETER('WORKSPACE_PROVISION_DEMO_OBJECTS') AS workspace_provision_demo_objects
FROM dual;
```

For clean customer, production, CI, or migration workspaces, stop if the value is `Y` unless the user explicitly confirms that demonstration applications and database objects are desired for this workspace creation.

Only after explicit confirmation to change the instance setting:

```sql
BEGIN
    APEX_INSTANCE_ADMIN.SET_PARAMETER(
        p_parameter => 'WORKSPACE_PROVISION_DEMO_OBJECTS',
        p_value     => :demo_objects_yn);
END;
/
```

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

Before MCP-backed application materialization, validation, or import continues, show the verified connection identity and continue only after the user confirms it is the intended APEX admin identity. Do not reuse the workspace-provisioning connection silently, and do not switch to a generic deployment user inside this APEX admin skill.

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

After this handoff, use the selected DB skill's required connection/user for user creation, grants, quotas, tablespaces, and privilege remediation. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.
