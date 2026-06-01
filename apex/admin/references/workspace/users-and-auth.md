# APEX Workspace Users And Authentication

Use this topic for initial workspace administrators, developers, end users, and `Database Username` builder-login environments.

If the user asks for an APEX Instance Administrator, APEX Administration Services administrator, or an admin user for the `INTERNAL` workspace, stop using this topic and route to `references/deployment/instance-admin-bootstrap.md`. That bootstrap path uses `apxchpwd.sql`; it is not a normal workspace-scoped `APEX_UTIL.CREATE_USER` operation.

Use `APEX_WORKSPACE_APEX_USERS` when you need supported workspace-user metadata for administrators, developers, and end users. Check column availability first on older or managed APEX environments.

MCP-backed workspace-user reads or changes must use the confirmed APEX admin identity from `apex/admin/SKILL.md`. Do not create, unlock, reset, or inspect APEX workspace users under `SYS`, `SYSTEM`, `SYSDBA`, parsing schemas, workspace users, ORDS/APEX runtime accounts, generic deployment users, or unknown accounts.

## Temporary Password Policy

If the user provides an approved secret-handling method, use that.

If the user wants the agent to create a newly created APEX workspace user through MCP-backed automation, do not ask the user to send the password in chat. First confirm the environment, username, email, role, and secret-handling path.

For demo or test workflows only, the user may explicitly approve the temporary fallback password `Welcome!123`. Always set `p_change_password_on_first_use => 'Y'`.

Before using the fallback, require this confirmation:

```text
I will create APEX user <USER_NAME> in workspace <WORKSPACE_NAME> with the temporary demo/test password Welcome!123 and force password change on first login. Confirm this is a non-production demo/test environment and reply exactly: YES, use the temporary demo password.
```

After creating a user with the fallback password, tell the user:

```text
APEX user <USER_NAME> was created with the temporary demo/test password Welcome!123 and must change it on first login.
```

Do not use the fallback password silently. Do not use it for production, shared non-test environments, or customer environments.

## Create Initial Workspace Admin

Set the workspace security group ID before creating workspace-scoped users outside an APEX session.

```sql
DECLARE
    l_workspace_id NUMBER;
BEGIN
    l_workspace_id := APEX_UTIL.FIND_SECURITY_GROUP_ID(:workspace_name);
    APEX_UTIL.SET_SECURITY_GROUP_ID(l_workspace_id);

    APEX_UTIL.CREATE_USER(
        p_user_name                    => :apex_user_name,
        p_email_address                => :email_address,
        p_web_password                 => :temporary_password,
        p_developer_privs              => 'ADMIN:CREATE:DATA_LOADER:EDIT:HELP:MONITOR:SQL',
        p_change_password_on_first_use => 'Y');

    COMMIT;
END;
/
```

Do not include real production passwords in skills, examples, logs, scripts, or chat output.

## Database-Username Builder Login

If the APEX sign-in page says `Database Username`, a matching database user may be required in addition to the APEX workspace user. Keep the security contexts separate:

- Workspace Admin
- Developer
- End User
- Parsing Schema
- Database Login User
- ORDS/APEX Runtime Accounts
- DBA/Admin Accounts

DB skill in use: `db/admin/user-management.md` and `db/security/privilege-management.md` for generic database user creation and privilege management. The APEX workspace skill is being used for APEX login-model and workspace-user context.

After this handoff, use the selected DB skill's required connection/user for database-login user creation, grants, password policy, quotas, and privilege remediation. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.

Do not grant `DBA`, `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`, `CREATE ANY TABLE`, `GRANT ANY ROLE`, or `GRANT ANY PRIVILEGE` for ordinary APEX workspace users.
