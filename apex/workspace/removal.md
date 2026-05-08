# APEX Workspace Removal

Use this topic for guarded test-workspace removal and cleanup. Treat removal as destructive.

Version check: use `ALL_TAB_COLUMNS` and `ALL_ARGUMENTS` before assuming workspace inventory columns or `APEX_INSTANCE_ADMIN.REMOVE_WORKSPACE` parameters.

## Safety Rules

Safety stop: list affected workspaces, schemas, APEX users, database users, and tablespaces, then require explicit confirmation before generating or running delete steps.

Do not use stale context to infer the target. Require the workspace name and confirmation for the current request.

Protected accounts must never be deleted: Oracle-maintained users, APEX platform users, ORDS users, runtime accounts, DBA/admin accounts, and shared service accounts.

## Affected Object Inventory

```sql
SELECT workspace_id,
       workspace,
       workspace_display_name,
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
       is_admin,
       is_application_developer
FROM apex_workspace_apex_users
WHERE workspace_name = UPPER(TRIM(:workspace_name))
ORDER BY user_name;
```

## Removal Guardrail

Use `APEX_INSTANCE_ADMIN.REMOVE_WORKSPACE` only after explicit confirmation. Keep `p_drop_tablespaces => 'N'` unless the user separately confirms that workspace-related tablespaces can be dropped.

```sql
BEGIN
    APEX_INSTANCE_ADMIN.REMOVE_WORKSPACE(
        p_workspace        => :workspace_name,
        p_drop_users       => 'N',
        p_drop_tablespaces => 'N');
END;
/
```

DB skill in use: `db/agent/destructive-op-guards.md` for generic destructive-operation safety patterns. The APEX workspace skill is being used for APEX workspace object inventory and supported removal API context.
