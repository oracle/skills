# APEX Workspace Removal

Use this topic for guarded test-workspace removal and cleanup. Treat removal as destructive.

Version check: use `ALL_TAB_COLUMNS` and `ALL_ARGUMENTS` before assuming workspace inventory columns or `APEX_INSTANCE_ADMIN.REMOVE_WORKSPACE` parameters.

MCP-backed workspace inventory and removal must use the confirmed APEX admin identity from `apex/admin/SKILL.md`. Do not remove or inventory APEX workspace objects under `SYS`, `SYSDBA`, parsing schemas, workspace users, ORDS/APEX runtime accounts, generic deployment users, or unknown accounts. `SYSTEM` is allowed only after the exact uppercase `YES` confirmation required by the APEX Admin Identity Gate.

## Safety Rules

Safety stop: list affected workspaces, schemas, APEX users, database users, and tablespaces, then require explicit English confirmation before generating or running delete steps.

Do not use stale context to infer the target. Require the workspace name and a fresh exact English confirmation for the current request.

Protected accounts must never be deleted: Oracle-maintained users, APEX platform users, ORDS users, runtime accounts, DBA/admin accounts, and shared service accounts.

## Confirmation Contract

Before removing a workspace or any workspace-related database user, show the affected-object inventory and require the user to reply with the exact English confirmation phrase in the current conversation. Do not accept `yes`, `y`, screenshots, previous confirmations, branch names, or implied approval.

For workspace metadata removal only, use this prompt:

```text
To remove workspace <WORKSPACE_NAME>, reply with exactly: YES, I confirm that I want to delete this workspace and that this is my own will. This will remove the listed APEX workspace metadata. Database users and tablespaces will not be dropped by this APEX workflow.
```

For workspace removal with related database users/components, use this prompt:

```text
To remove workspace <WORKSPACE_NAME> and the listed related database users/components, reply with exactly: YES, I confirm that I want to delete this workspace and its listed related database users/components and that this is my own will.
```

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

Use `APEX_INSTANCE_ADMIN.REMOVE_WORKSPACE` only after the exact English confirmation for the current removal scope.

Default to workspace metadata removal only. Keep `p_drop_users => 'N'` and `p_drop_tablespaces => 'N'` unless the user explicitly asks to delete the workspace and the listed related database users/components.

```sql
BEGIN
    APEX_INSTANCE_ADMIN.REMOVE_WORKSPACE(
        p_workspace        => :workspace_name,
        p_drop_users       => 'N',
        p_drop_tablespaces => 'N');
END;
/
```

If the user explicitly asks to delete the workspace and the listed related database users/components, and only after the exact English confirmation phrase for that broader scope, `p_drop_users => 'Y'` is allowed.

```sql
BEGIN
    APEX_INSTANCE_ADMIN.REMOVE_WORKSPACE(
        p_workspace        => :workspace_name,
        p_drop_users       => 'Y',
        p_drop_tablespaces => 'N');
END;
/
```

Keep `p_drop_tablespaces => 'N'` unless the user explicitly lists tablespace deletion in the requested scope and confirms that scope with the same English own-will confirmation pattern.

DB skill in use: `db/agent/destructive-op-guards.md` for generic destructive-operation safety patterns. The APEX workspace skill is being used for APEX workspace object inventory and supported removal API context.

If cleanup crosses into generic database users, grants, quotas, tablespaces, or other non-APEX objects, route that portion to the relevant DB skill and use that skill's required connection/user. Do not reuse the APEX admin connection for DB-skill cleanup unless the DB skill explicitly accepts it.
