---
name: apex
description: Oracle APEX skills for workspace administration, application development, deployment, monitoring, and source-backed operational workflows.
---

# Oracle APEX Skills

Only the root `apex/SKILL.md` is a skill entry point. Category folders contain topic `.md` files; read only the specific topic needed for the request.

## Token Use

- Load one routed topic first; add a second topic only when the workflow crosses that boundary.
- Use `rg`/section search for exact checks instead of reading whole categories.
- Load `apex/security/safety-messages.md` only when an exact user-facing message is needed.
- For SQL examples, prefer the smallest relevant snippet from the topic file.

## Routing

- Workspace lifecycle/provisioning/listing/removal: `apex/workspace/lifecycle.md`, `apex/workspace/resource-governance.md`, `apex/workspace/users-and-auth.md`, `apex/workspace/schema-mapping.md`, `apex/workspace/removal.md`, `apex/workspace/version-notes.md`, `apex/workspace/security-review.md`
- Security/auth/session/export safety: `apex/security/guardrails.md`, `apex/security/safety-messages.md`, `apex/security/audit-columns.md`, `apex/security/security-review.md`
- Monitoring/runtime diagnosis/MCP availability: `apex/monitoring/activity-log.md`, `apex/monitoring/error-handling.md`, `apex/monitoring/user-journey-replay.md`, `apex/monitoring/background-jobs.md`, `apex/monitoring/rest-data-sources.md`, `apex/monitoring/page-performance.md`, `apex/monitoring/ir-ig-tuning.md`, `apex/monitoring/awr-wait-correlation.md`, `apex/monitoring/mcp-availability.md`, `apex/monitoring/security-review.md`
- Deployment/export/import/patching: `apex/deployment/pre-check.md`, `apex/deployment/export-review.md`, `apex/deployment/import-promotion.md`, `apex/deployment/post-deploy-validation.md`, `apex/deployment/patching.md`, `apex/deployment/security-review.md`

## Scope

Keep APEX skills APEX-specific. Before adding or expanding an APEX skill, check whether the generic database topic is already covered under `db/`.

Use APEX skills for APEX workspaces, applications, App Builder, runtime behavior, session state, APEX activity/debug logs, APEX users, Team Development, supported `APEX_*` views, and APEX APIs such as `APEX_UTIL`, `APEX_INSTANCE_ADMIN`, and `APEX_APPLICATION_INSTALL`.

Do not duplicate generic database guidance in APEX skills. Privilege management, auditing, encryption, network security, data masking, VPD/RLS, AWR, ASH, wait events, SQL tuning, SQLcl basics, and ORDS fundamentals belong in `db/`.

When using a generic DB skill, announce it with `DB skill in use: db/...`, for example:

```text
DB skill in use: db/performance/wait-events.md for the generic wait-event analysis. The APEX skill is being used for APEX activity-log correlation.
```

## Safety

- Use least privilege for parsing schemas, workspace users, database-login users, and automation accounts. Do not recommend broad grants such as `DBA`, `SYSDBA`, `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`, `CREATE ANY TABLE`, `GRANT ANY ROLE`, `GRANT ANY PRIVILEGE`, or `WITH ADMIN OPTION` unless the user explicitly asks for privileged administration and the risk is called out.
- Keep APEX security contexts separate: workspace administrator, developer, end user, parsing schema, database-login user, ORDS/APEX runtime account, and DBA/admin account are different roles.
- Do not treat APEX parsing schemas as personal interactive logins in production.
- Prefer supported APEX APIs and views. Do not write directly to internal APEX repository tables.
- Treat versions and managed environments as variable. Inspect availability with `ALL_TAB_COLUMNS`, `ALL_ARGUMENTS`, `DESC`, `APEX_RELEASE`, or `APEX_DICTIONARY` before relying on version-specific columns or package signatures.
- Protect destructive actions with object listings, fresh exact English confirmation prompts, protected-account checks, and no remembered-context assumptions. Workspace-related database users may be dropped only when the user explicitly asks to remove the workspace and its listed related database users/components and confirms that this is their own will. Load `apex/workspace/removal.md`.
- After interrupted APEX provisioning, reconnect, inventory each planned artifact individually, and ask whether to roll back only the listed artifacts before retrying or continuing. Load `apex/monitoring/mcp-availability.md` and `apex/workspace/lifecycle.md`.
- Before APEX workflows that use MCP database access, run the APEX MCP availability guard. If MCP reports `Transport closed` or an unavailable tool channel, stop and do not continue from stale database state.
- Never include real secrets in skills, examples, logs, exports, or chat output.
- Treat APEX activity logs, debug logs, error messages, request values, Team Development files, exports, and session context as potentially sensitive.
- Do not treat APEX session state, hidden items, read-only items, or client-side checks as a security boundary.
- For tenant isolation or sensitive row access, APEX authorization can help the UI, but critical data isolation belongs in the database. Hand off implementation details to `db/security/row-level-security.md`.
- APEX exports may contain application logic, URLs, authorization schemes, build options, static files, credential references, defaults, and other sensitive metadata.
- For APEX-owned application tables, include safe audit columns when appropriate: `created_at`, `created_by`, `updated_at`, `updated_by`. Audit-column triggers should use APEX user context with a database-user fallback, not only `USER`; for database auditing, announce and use `db/security/auditing.md`.
- Mark licensed features and production constraints, especially AWR/ASH/Diagnostics Pack and database security options whose licensing depends on deployment.
- End substantial APEX skill additions with a security review covering privileges, secrets, auditability, data exposure, version/cloud restrictions, and destructive actions.

## Documentation

Use official Oracle APEX documentation and prefer the newest available documentation unless the user names a specific installed APEX version. Start from:

```text
https://apex.oracle.com/en/learn/documentation/
```

Do not hard-code older APEX documentation URLs unless the guidance is explicitly about that older version.

## Safety Messages

For exact user-facing safety messages, load `apex/security/safety-messages.md`. Use it for broad grants, direct internal repository writes, destructive changes, interrupted provisioning recovery, sensitive logs/exports, session-state assumptions, audit triggers, version-sensitive APEX views, or unavailable MCP-backed database access.

## Validation

Run after changing APEX skills:

```bash
bash apex/test-apex-skills.sh
```
