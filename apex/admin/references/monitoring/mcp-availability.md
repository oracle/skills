# APEX MCP Availability Guard

Use this topic when an APEX workflow depends on database access through an MCP tool, for example listing workspaces, creating a workspace, checking `APEX_RELEASE`, checking `APEX_PATCHES`, or querying APEX runtime views.

This is an APEX workflow guard, not database-client troubleshooting. Do not provide setup commands, client configuration advice, or connection-store instructions from this topic.

## When To Check

Before any APEX workflow that will run SQL or PL/SQL through MCP:

- Confirm the MCP tool transport is available.
- Confirm a database connection can be established or is already active.
- Confirm the active connection is the intended APEX admin identity before running APEX-owned live checks, including read-only checks.
- If the APEX workflow needs a specific connection name, confirm that connection before generating SQL.

Use the smallest available client-side MCP check. Do not run APEX DDL, APEX administration APIs, generic DB diagnostics, or destructive SQL as a connectivity test.

## Stop Condition

If the MCP tool reports a closed transport, unavailable server, disconnected tool channel, or similar client-side transport failure, stop the APEX workflow. Do not infer database state from stale context, screenshots, previous outputs, or another UI session.

Use this message:

```text
APEX MCP availability check failed: the MCP transport is closed, so I cannot safely verify or change APEX state from here. I will pause the APEX workflow until the MCP tool channel is available again.
```

If the user has APEX open in a browser, make clear that this does not prove the MCP tool channel is available:

```text
Your APEX browser session may still be connected, but this APEX workflow needs the MCP tool channel. Those are separate sessions, and I cannot use browser state as confirmation for database changes.
```

## Recovery Behavior

After the user says MCP is available again:

1. Repeat the MCP availability check.
2. Reconnect or confirm the active database connection is the intended APEX admin identity.
3. Re-read APEX state from the database.
4. If an APEX provisioning workflow may have been interrupted after create steps, inventory each planned artifact individually with `references/workspace/lifecycle.md#provisioning-recovery-after-interruption`.
5. Ask whether the user wants to roll back the listed artifacts before continuing or retrying.
6. Continue only from freshly verified state.

Never continue a workspace create, user create, patch check, or removal workflow from pre-failure assumptions.

## APEX State To Re-Read

Pick the smallest relevant verification query after MCP recovers:

```sql
SELECT version_no,
       CASE
           WHEN REGEXP_LIKE(version_no, '^(26\.1|24\.2|24\.1)(\.|$)')
           THEN 'SUPPORTED'
           ELSE 'UNSUPPORTED'
       END AS apex_admin_skill_support
FROM apex_release;
```

If the recovered `APEX_ADMIN_SKILL_SUPPORT` value is `UNSUPPORTED`, stop the
APEX workflow and use the unsupported-version safety message from
`references/security/safety-messages.md`.

```sql
SELECT workspace_id,
       workspace,
       schemas,
       applications,
       apex_developers,
       apex_workspace_administrators
FROM apex_workspaces
ORDER BY workspace;
```

For user provisioning recovery:

```sql
SELECT workspace_name,
       user_name,
       email,
       is_admin,
       is_application_developer,
       account_locked
FROM apex_workspace_apex_users
WHERE workspace_name = :workspace_name
  AND user_name = :user_name;
```

For interrupted workspace/app provisioning, use the lifecycle recovery checklist to re-read the planned workspace, schema mappings, APEX users, database users, application tables, and APEX applications one by one before asking:

```text
I found the following artifacts from the interrupted APEX provisioning workflow: <ARTIFACT_LIST>. Do you want me to roll back the listed artifacts by removing only these objects?
```

## DB Skill Usage

No DB skill is used for this topic. This topic only decides whether an APEX workflow may continue when MCP-backed database access is unavailable.

## Guardrails

- Do not continue an APEX workflow after `Transport closed` because a previous query succeeded.
- Do not treat a browser APEX session as proof that MCP database access is available.
- Do not re-run a create step without first checking whether the object was committed before the transport failed.
- Do not explain database-client internals when the user only needs an APEX workflow stop/retry decision.
