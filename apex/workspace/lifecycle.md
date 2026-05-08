# APEX Workspace Lifecycle

Use this topic for workspace inventory, pre-flight checks, create workspace, and verification.

## Pre-Flight Questions

- APEX version, because package signatures differ across APEX releases.
- Target workspace name and whether a deterministic workspace ID is required.
- Primary parsing schema and any additional schemas.
- Whether database schemas already exist or must be created.
- Whether the first user should be an APEX workspace administrator, developer, or end user.
- Authentication model for the development environment.
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

Run instance-level workspace APIs as `SYS`, `SYSTEM`, or a user granted `APEX_ADMINISTRATOR_ROLE`. Do not grant broad DBA privileges just to automate workspace creation.

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

DB skill in use: `db/security/privilege-management.md` for generic schema/user privilege design. The APEX workspace skill is being used for workspace and parsing-schema context.
