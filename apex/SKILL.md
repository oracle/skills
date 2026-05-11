---
name: apex
description: Oracle APEX skills for workspace administration, application development, deployment, and source-backed APEX operational workflows.
---

# Oracle APEX Skills

This domain contains Oracle APEX skills for workspace administration, application development, deployment, and operational workflows.

## How to Use This Domain

1. Start with the routing table below.
2. Read only the specific file or category you need.
3. Keep APEX skills APEX-specific. Before adding or expanding an APEX skill, check whether the generic database topic is already covered under `db/`.
4. When an APEX workflow calls for a generic database skill, explicitly tell the user that a DB skill is now being used and name the relevant `db/...` path.

## Important Safety Rules

- Keep APEX skills focused on APEX workspaces, applications, App Builder, runtime behavior, session state, APEX activity/debug logs, APEX users, Team Development, supported `APEX_*` views, and APEX APIs such as `APEX_UTIL`, `APEX_INSTANCE_ADMIN`, and `APEX_APPLICATION_INSTALL`.
- Do not duplicate generic database guidance in APEX skills. Privilege management, auditing, encryption, network security, data masking, VPD/RLS, AWR, ASH, wait events, SQL tuning, SQLcl basics, and ORDS fundamentals belong in `db/`.
- When using a generic DB skill from an APEX workflow, announce it with the path, for example: `DB skill in use: db/security/auditing.md for generic database auditing. The APEX skill is being used for APEX-specific audit context.`
- Use least privilege for parsing schemas, workspace users, database-login users, and automation accounts. Do not recommend broad grants such as `DBA`, `SYSDBA`, `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`, `CREATE ANY TABLE`, `GRANT ANY ROLE`, `GRANT ANY PRIVILEGE`, or `WITH ADMIN OPTION` unless the user explicitly asks for privileged administration and the risk is called out.
- Keep APEX security contexts separate: workspace administrator, developer, end user, parsing schema, database-login user, ORDS/APEX runtime account, and DBA/admin account are different roles.
- Do not treat APEX parsing schemas as personal interactive logins in production. Keep their technical use narrow and document when an account should be locked or non-interactive.
- Prefer supported APEX APIs and views. Do not write directly to internal APEX repository tables.
- Treat APEX versions and managed environments as variable. Before relying on a view column or package parameter, inspect availability with `ALL_TAB_COLUMNS`, `ALL_ARGUMENTS`, `DESC`, or a supported APEX version view.
- Protect destructive actions with explicit object listings, fresh exact English confirmation prompts, protected-account checks, and no assumptions from remembered context. Workspace-related database users may be dropped only when the user explicitly asks to remove the workspace and its listed related database users/components and confirms that this is their own will.
- Before APEX workflows that use MCP database access, run the APEX MCP availability guard. If MCP reports `Transport closed` or an unavailable tool channel, stop the APEX workflow and do not continue from stale database state.
- Never include real secrets in skills, examples, logs, exports, or chat output. This includes passwords, OAuth secrets, SMTP credentials, wallet passwords, API tokens, and web credentials.
- Treat APEX activity logs, debug logs, error messages, request values, Team Development files, exports, and session context as potentially sensitive. Avoid selecting unnecessary payload columns, BLOBs, CLOBs, or secret-bearing values.
- Do not treat APEX session state, hidden items, read-only items, or client-side checks as a security boundary. Use server-side authorization, validations, and database privileges.
- For tenant isolation or sensitive row access, APEX authorization can help the UI, but critical data isolation belongs in the database. Hand off implementation details to `db/security/row-level-security.md`.
- For masking, redaction, encryption, network ACLs, TLS/listener security, and unified auditing, document the APEX-specific risk or context, then hand off to the relevant `db/security/*` skill.
- APEX exports may contain application logic, URLs, authorization schemes, build options, static files, credential references, defaults, and other sensitive metadata. Review before committing or sharing.
- For APEX-owned application tables, include a safe audit-column pattern when appropriate: `created_at`, `created_by`, `updated_at`, and `updated_by`.
- Audit-column triggers should use the APEX user context with a database-user fallback, not only `USER`, because `USER` is usually the parsing schema in APEX runtime sessions.
- Audit-column triggers are application metadata, not a replacement for tamper-resistant database auditing. For database auditing, announce and use `db/security/auditing.md`.
- Do not audit passwords, tokens, large payloads, or sensitive free text by default. For hot tables, bulk loads, or ETL, consider trigger cost and hand off database-generic alternatives to the relevant DB skill.
- Mark licensed features and production constraints, especially AWR/ASH/Diagnostics Pack and database security options whose licensing depends on deployment.
- End substantial APEX skill additions with a security review covering privileges, secrets, auditability, data exposure, version/cloud restrictions, and destructive actions.

## Directory Structure

Only the root `apex/SKILL.md` is a skill entry point. Category folders contain normal topic `.md` files, following the `db/` domain style.

```text
apex/
├── deployment/
├── monitoring/
├── security/
└── workspace/
```

## Category Routing

| Topic | Directory |
|-------|-----------|
| Create, list, configure, verify, export, import, or remove Oracle APEX workspaces | `apex/workspace/` |
| Runtime monitoring, MCP availability, activity logs, page latency, error trends, session drilldown, Team Development file context | `apex/monitoring/` |
| APEX authentication and authorization context, session-state safety, secrets, exports, safety messages, audit-column triggers | `apex/security/` |
| APEX installation pre-checks, patching, application export/import, environment promotion, `APEX_APPLICATION_INSTALL`, build options, substitutions, and deployment safety | `apex/deployment/` |

## Key Starting Points

- Workspace lifecycle and provisioning: `apex/workspace/lifecycle.md`
- Workspace resource governance: `apex/workspace/resource-governance.md`
- Workspace users and authentication: `apex/workspace/users-and-auth.md`
- Workspace schema mapping: `apex/workspace/schema-mapping.md`
- Workspace removal: `apex/workspace/removal.md`
- Workspace version checks: `apex/workspace/version-notes.md`
- APEX security guardrails: `apex/security/guardrails.md`
- APEX safety messages: `apex/security/safety-messages.md`
- APEX application-table audit columns: `apex/security/audit-columns.md`
- APEX MCP availability guard: `apex/monitoring/mcp-availability.md`
- APEX runtime monitoring: `apex/monitoring/activity-log.md`
- APEX error handling and logging: `apex/monitoring/error-handling.md`
- APEX user journey replay: `apex/monitoring/user-journey-replay.md`
- APEX background jobs: `apex/monitoring/background-jobs.md`
- APEX REST Data Sources: `apex/monitoring/rest-data-sources.md`
- APEX page and report performance: `apex/monitoring/page-performance.md` and `apex/monitoring/ir-ig-tuning.md`
- APEX AWR/wait correlation bridge: `apex/monitoring/awr-wait-correlation.md`
- APEX deployment pre-checks and promotion: `apex/deployment/pre-check.md` and `apex/deployment/import-promotion.md`
- APEX deployment export review and patching: `apex/deployment/export-review.md` and `apex/deployment/patching.md`
- APEX post-deploy validation: `apex/deployment/post-deploy-validation.md`
- Category security reviews: `apex/workspace/security-review.md`, `apex/security/security-review.md`, `apex/monitoring/security-review.md`, and `apex/deployment/security-review.md`

## Validation

Run the APEX skill validation script after changing or adding APEX skills:

```bash
bash apex/test-apex-skills.sh
```

When adding a new APEX skill directory, update this script with routing checks and at least one representative prompt example for that skill.

## Documentation Version Policy

Use official Oracle APEX documentation and prefer the newest available documentation unless the user names a specific installed APEX version. Before adding version-specific API, view, package, or export/import guidance, check the current Oracle APEX documentation landing page:

```text
https://apex.oracle.com/en/learn/documentation/
```

Then use the matching official Oracle documentation for the target version. If the target version is unknown, say that the latest official docs should be checked first and keep generated SQL version-tolerant with `APEX_RELEASE`, `APEX_DICTIONARY`, `ALL_TAB_COLUMNS`, and `ALL_ARGUMENTS`.

Do not hard-code older APEX documentation URLs in APEX skills unless the guidance is explicitly about that older APEX version. Prefer version-neutral documentation discovery notes in the skill files.

## DB Skill Usage Notices

APEX skills may reference generic database skills for supporting topics such as AWR, ASH, wait events, SQL tuning, security, SQLcl, or ORDS. Do not duplicate those generic topics inside APEX skills. Keep the APEX skill focused on APEX views, APEX APIs, workspace/application context, and APEX runtime behavior, then hand off to the relevant DB skill for the database-generic diagnosis or implementation.

When using a generic DB skill, announce it in the response with the exact `DB skill in use:` label, for example:

```text
DB skill in use: db/performance/wait-events.md for the generic wait-event analysis. The APEX skill is being used for APEX activity-log correlation.
```

## User-Facing Safety Messages

When a user request crosses one of the APEX safety boundaries, do not silently continue. Give a short, explicit message before proceeding, asking for confirmation when needed.

Use these message patterns:

```text
DB skill in use: db/security/privilege-management.md for generic privilege analysis. The APEX skill is being used only for APEX workspace and parsing-schema context.
```

```text
Safety note: this is generic database security guidance, not APEX-specific behavior. I will route the generic part to db/security/auditing.md and keep the APEX skill focused on the APEX action that needs auditability.
```

```text
Safety stop: direct writes to internal APEX repository tables are not supported by this skill. I will use supported APEX APIs or views instead.
```

```text
Safety stop: this would grant a broad administrative privilege. Please confirm the exact purpose, target account, and why a narrower privilege is not sufficient before I generate SQL.
```

```text
Safety stop: this operation is destructive. I will first list affected workspaces, schemas, APEX users, database users, and related components, then require a fresh exact English confirmation before generating or running delete steps. If database users are included, you must confirm that deleting the listed users/components is your own will.
```

```text
Sensitive data warning: APEX logs, debug output, request values, Team Development files, and exports may contain secrets or personal data. I will avoid selecting payload columns unless you explicitly need them.
```

```text
Security warning: APEX session state, hidden items, read-only items, and client-side checks are not security boundaries. I will use server-side authorization, validations, and database privileges for enforcement.
```

```text
Audit note: the trigger pattern records application change metadata only. It is not a replacement for tamper-resistant database auditing; use db/security/auditing.md for that.
```

```text
Version check: this APEX view or package signature can vary by release. I will inspect available columns or arguments before generating version-specific SQL.
```

```text
APEX MCP availability check failed: the MCP transport is closed, so I cannot safely verify or change APEX state from here. I will pause the APEX workflow until the MCP tool channel is available again.
```

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| List APEX workspaces | `workspace` list query -> optional schema/user detail queries |
| Provision an APEX workspace | `workspace` pre-flight checks -> `security` least-privilege review -> database schema preparation -> `APEX_INSTANCE_ADMIN.ADD_WORKSPACE` -> optional workspace admin user -> verification |
| Move a workspace between environments | `security` export review -> `deployment` export/import review -> export workspace metadata -> create or map target schemas -> import workspace/application artifacts -> verify schema mappings and users |
| Promote an APEX application | `deployment` pre-check -> export review -> target workspace/schema mapping -> `APEX_APPLICATION_INSTALL` wrapper -> import -> post-deploy validation |
| Diagnose APEX runtime errors or slow pages | `monitoring` activity-log triage -> optional `DB skill in use: db/performance/*` notice for wait events, ASH, or AWR |
| Add audit columns to APEX application tables | `security` audit-column trigger pattern -> optional `DB skill in use: db/security/auditing.md` notice for database auditing |
