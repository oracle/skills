---
name: admin
description: Oracle APEX administration workflows for workspace lifecycle, provisioning, users, schema mapping, deployment, monitoring, security guardrails, and source-backed operational checks. Use when Codex needs APEX admin guidance, APEX workspace operations, APEX deployment/import review, APEX runtime monitoring, or APEX-specific safety handling.
---

# Oracle APEX Admin

Use this skill for APEX administration. Load only the routed reference needed for the request, then add a second reference only when the workflow crosses that boundary.

## Structure

```text
admin/
├── SKILL.md
├── references/
│   ├── deployment/
│   ├── monitoring/
│   ├── security/
│   └── workspace/
├── tools/
│   ├── apex-export-risk-scan.mjs
│   └── workspace-admin-plan.mjs
```

## Token Use

- Load one routed reference first; add another only when the user request spans categories.
- Use `rg` or section search for exact checks instead of reading whole reference directories.
- Load `references/security/safety-messages.md` only when an exact user-facing safety message is needed.
- For SQL examples, prefer the smallest relevant snippet from the reference file.
- Use `tools/` only for generic APEX-admin analysis or planning. Tools must not contain customer-specific paths, customer exports, SQLcl automation, ORDS tuning, or database administration logic.
- Customer cases may inform generic skill improvements, but never add customer names, customer paths, export filenames, application names, domains, users, line references, findings, or incident details to skill files, tools, tests, references, examples, or committed docs.

## Analysis Output Handling

- Before starting any static or file-only review that does not need database access, explicitly tell the user that no database connection or live MCP database access will be used. Keep it short, for example: "I can analyze this export statically; no database access is needed for this step."
- If a static review later needs live APEX evidence, stop before connecting and apply the APEX Admin Identity Gate. If it needs generic DB evidence, stop before handoff and ask whether to switch to the relevant DB skill.
- Before substantive analysis of customer-specific performance, runtime, deployment, or incident evidence, ask once whether the user has more relevant customer evidence for the same case, such as APEX Activity Log/Page Performance, APEX Debug, HAR/Network, AWR/ASH, SQL Monitor, ORDS logs, deployment logs, or another APEX export. Treat this as an intake question, not a requirement: if the user declines or no more files are available, proceed with the available evidence, finish the analysis, and state the evidence limits.
- When the user provides customer-specific files or evidence and asks for analysis, ask before substantive analysis whether the result should be chat-only or saved as an external artifact. If saved, require a user-confirmed output directory or exact file path before continuing.
- Do not write customer-specific analysis output into this skill, the repository, `tools/`, `references/`, examples, tests, or committed documentation unless the user explicitly asks for a generic, sanitized skill improvement instead.
- Do not create customer-specific output folders such as `apex/admin/<customer_name>`. Customer reports, logs, generated checklists, and derived artifacts must go to a user-confirmed external path outside the skill tree.
- If the user gives a source file path but no output path, do not infer that the result belongs beside the source. Ask for the output directory or exact file path first.
- When the user gives a directory, create or update only the requested result file inside that directory. When the user gives a file path, use that exact file path after confirming overwrite if the file already exists.
- Keep customer identifiers, application names, source paths, export filenames, line references, and findings only in the confirmed external output artifact and chat summary; never copy them into skill files.

## Routing

- Workspace lifecycle/provisioning/listing/removal: `references/workspace/lifecycle.md`, `references/workspace/resource-governance.md`, `references/workspace/users-and-auth.md`, `references/workspace/schema-mapping.md`, `references/workspace/removal.md`, `references/workspace/version-notes.md`, `references/workspace/security-review.md`
- Security/auth/session/export safety: `references/security/guardrails.md`, `references/security/safety-messages.md`, `references/security/audit-columns.md`, `references/security/security-review.md`
- Monitoring/runtime diagnosis/MCP availability: start broad APEX performance cases with `references/monitoring/apex-performance-evidence.md`; then route to `references/monitoring/workspace-monitor-activity.md`, `references/monitoring/activity-log.md`, `references/monitoring/error-handling.md`, `references/monitoring/user-journey-replay.md`, `references/monitoring/background-jobs.md`, `references/monitoring/rest-data-sources.md`, `references/monitoring/page-performance.md`, `references/monitoring/export-runtime-risk-review.md`, `references/monitoring/ir-ig-tuning.md`, `references/monitoring/awr-wait-correlation.md`, `references/monitoring/mcp-availability.md`, `references/monitoring/security-review.md`
- Deployment/export/import/patching/instance-administrator bootstrap: `references/deployment/pre-check.md`, `references/deployment/export-review.md`, `references/deployment/import-promotion.md`, `references/deployment/deployment-identity.md`, `references/deployment/instance-admin-bootstrap.md`, `references/deployment/post-deploy-validation.md`, `references/deployment/patching.md`, `references/deployment/security-review.md`
- New APEX application generation: announce the skill handoff, then route the application-generation work to `apex/apexlang/SKILL.md`. Keep `admin/` loaded only for workspace, deployment identity, connection safety, import/promotion, monitoring, and post-deploy validation context.

## Prompt Interpretation

- Treat "APEX instance admin", "APEX instance administrator", "APEX internal admin", "admin for INTERNAL", "INTERNAL workspace admin", and "APEX Administration Services admin" as requests for an APEX Instance Administrator unless the user explicitly says they mean a database account or role grant.
- For those prompts, load `references/deployment/instance-admin-bootstrap.md` first. Do not ask whether the user means a database account with `APEX_ADMINISTRATOR_ROLE`; that role is for routine instance-level APEX API automation, not the initial APEX Administration Services administrator bootstrap.
- If the user later clarifies "an APEX internal/admin user for the INTERNAL workspace", switch immediately to the `apxchpwd.sql` bootstrap path. Do not block on an active `SYS` or `SYSTEM` connection, and do not request a saved non-SYS/SYSTEM SQLcl MCP connection for the password-setting step.
- Ask only for details needed to tailor the runbook: self-managed/container versus managed service, target PDB/service name, APEX installation directory containing `apxchpwd.sql`, username, and email. Never ask for the password in chat. If the environment is Autonomous AI Database or Oracle APEX AI Application Generator Service (APEX Service), do not provide `apxchpwd.sql` run commands; route to the service-specific administration/reset path instead.
- Before giving final privileged bootstrap commands or saying the user can proceed, summarize the interpreted intent and all non-secret target details, then require explicit user confirmation. Do not proceed from inferred values, remembered context, or partial confirmation.

## Skill Handoff

When a user asks to create, scaffold, generate, or materially change an APEX application rather than only create or administer a workspace, stop before generating the application and emit this handoff message:

```text
APEXlang skill in use: apex/apexlang/SKILL.md for APEX application generation. The APEX admin skill is being used only for workspace, deployment identity, connection safety, and post-deploy validation.
```

Before MCP-backed application creation, import, or materialization continues, apply the APEX Admin Identity Gate below. Do not continue only because the user accepts the currently connected database user; the user must confirm that the connection is the intended APEX admin identity.

## APEX Admin Identity Gate

All live MCP-backed work owned by this skill must run only under a confirmed APEX admin identity. Static file review of APEX exports, AWR/ASH reports, HAR files, CSV extracts, and logs does not require a database connection.

Accepted APEX admin identities:

- A dedicated non-`SYS`/`SYSTEM` database account granted `APEX_ADMINISTRATOR_ROLE` for instance-level APEX administration.
- On Autonomous Database or APEX Service only, the service `ADMIN` account when the user explicitly confirms that it is the environment's APEX administration identity and the work remains APEX-admin-scoped.

Before any live APEX query, APEX API call, import, workspace operation, monitoring-query, debug-log query, or version check through MCP, verify and show the active identity:

```sql
SELECT SYS_CONTEXT('USERENV','SESSION_USER') AS session_user,
       SYS_CONTEXT('USERENV','CURRENT_USER') AS current_user,
       SYS_CONTEXT('USERENV','ISDBA') AS is_dba
FROM dual;
```

If permissions allow, also verify `APEX_ADMINISTRATOR_ROLE` through `SESSION_ROLES` or `USER_ROLE_PRIVS`.

Stop the APEX admin workflow when the active identity is `SYS`, `SYSTEM`, `ISDBA = TRUE`, an app parsing schema, a workspace developer/end-user, an ORDS/APEX runtime account, a generic deployment user, or unknown. Ask for the confirmed APEX admin connection before continuing. This applies to read-only APEX evidence gathering as well as change operations.

The APEX Instance Administrator bootstrap path in `references/deployment/instance-admin-bootstrap.md` is the only documented exception, because Oracle's `apxchpwd.sql` flow can require `SYS AS SYSDBA`. That exception is not a routine MCP APEX admin session and must not be used for workspace creation, imports, monitoring, or APEX API automation.

## Supported Version Gate

Before any MCP-backed APEX admin workflow, check the installed APEX version from `APEX_RELEASE`. Continue only for APEX releases supported by this skill: `26.1`, `24.2`, `24.1`, and `23.2` as of May 2026. If the detected version is not supported, emit the unsupported-version safety message and stop before generating SQL, PL/SQL, deployment steps, monitoring queries, or workspace changes.

Use `references/workspace/version-notes.md` for the exact gate query and version-sensitive follow-up checks.

## Tools

- Static APEX export risk scan:

```bash
node apex/admin/tools/apex-export-risk-scan.mjs --export <apex-export.sql> --format markdown
```

- Workspace admin checklist and supported APEX snippets:

```bash
node apex/admin/tools/workspace-admin-plan.mjs --action inventory --workspace <workspace-name>
```

The tools are optional accelerators. They do not replace reading the routed reference, and they must not execute ORDS, SQLcl, or generic database administration work.

## Scope

Keep this skill APEX-admin-specific. Before adding or expanding guidance, check whether the generic database topic is already covered under `db/`.

Use this skill for APEX workspaces, application administration metadata, App Builder admin behavior, runtime behavior, session state, APEX activity/debug logs, APEX users, Team Development, supported `APEX_*` views, and APEX APIs such as `APEX_UTIL`, `APEX_INSTANCE_ADMIN`, and `APEX_APPLICATION_INSTALL`. Do not use this skill to generate new APEX application artifacts; hand that work to `apex/apexlang`.

This skill owns only the APEX side of the work. It may identify APEX evidence that explains runtime symptoms, but it must not tune ORDS pools, run SQLcl workflows, design database indexes, interpret generic wait events, or perform database administration as part of this skill.

Do not duplicate generic database guidance. Privilege management, auditing, encryption, network security, data masking, VPD/RLS, AWR, ASH, wait events, SQL tuning, SQLcl basics, and ORDS fundamentals are outside the APEX admin skill scope. Mention them only as external handoff topics when APEX evidence points beyond APEX.

When using a generic DB skill, announce it with `DB skill in use: db/...`, for example:

```text
DB skill in use: db/performance/wait-events.md for the generic wait-event analysis. The APEX admin skill is being used for APEX activity-log correlation.
```

If the user attaches or references an AWR report, ASH extract, SQL Monitor report, execution plan, wait-event output, `V$`/`DBA_HIST` evidence, or ORDS pool/runtime diagnostics during APEX monitoring work, stop before interpreting that evidence. Ask whether to switch to the relevant DB skill, and continue only after the user confirms. After handoff, follow the selected DB skill's identity and connection requirements: use a diagnostics/performance account for AWR, ASH, `DBA_HIST`, `V$`, SQL Monitor, and execution-plan evidence; a DB admin or privilege-management identity for users, grants, quotas, and schemas; and an ORDS/runtime administration identity for ORDS pool or gateway diagnostics. Do not silently reuse the APEX admin connection for DB-skill work unless the DB skill's own rules explicitly accept that identity.

## Safety

- Use least privilege for parsing schemas, workspace users, database-login users, and automation accounts. Do not recommend broad grants such as `DBA`, `SYSDBA`, `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`, `CREATE ANY TABLE`, `GRANT ANY ROLE`, `GRANT ANY PRIVILEGE`, or `WITH ADMIN OPTION` unless the user explicitly asks for privileged administration and the risk is called out.
- Do not connect MCP or routine automation as `SYS`, `SYSTEM`, `SYSDBA`, parsing schemas, workspace developers, end users, ORDS/APEX runtime accounts, or generic deployment users for APEX admin work. Use only a confirmed APEX admin identity as defined in the APEX Admin Identity Gate.
- If the user asks to create, reset, unlock, or bootstrap an APEX Instance Administrator for APEX Administration Services or the `INTERNAL` workspace, route to `references/deployment/instance-admin-bootstrap.md`. Do not treat this as a normal workspace user created with `APEX_UTIL.CREATE_USER`, and do not ask for a least-privilege `APEX_ADMINISTRATOR_ROLE` connection as the primary path. First confirm whether the environment is self-managed/container/co-managed Cloud or a fully managed service. For new self-managed/container/co-managed Cloud installations, the supported path is running `apxchpwd.sql` from the APEX installation directory as `SYS AS SYSDBA` in the database where APEX is installed. For Autonomous AI Database or Oracle APEX AI Application Generator Service (APEX Service), do not provide local script steps; direct the user to the service-specific administration/reset path.
- Do not run `apxchpwd.sql` through `sql_run`, and do not put the Instance Administrator password in chat, SQL, scripts, or logged MCP tool calls. Give the user a terminal/SQLcl command sequence with placeholders and tell them to enter the password only at the script prompt.
- For APEX Instance Administrator bootstrap, always require an explicit confirmation of the action, environment type, target PDB/service, APEX installation directory, username, and email before giving final run commands or instructing the user to execute them.
- Before MCP-backed APEX admin work, apply the APEX Admin Identity Gate. If the identity is not a confirmed APEX admin identity, stop and ask for the correct APEX admin connection.
- If the workflow needs generic database administration or diagnostics such as database users/schemas, grants, quotas, tablespaces, ORDS configuration, AWR, ASH, `V$SESSION`, `V$SQL`, wait events, or system-level diagnostics, stop the APEX admin workflow, announce the DB skill handoff, and ask for the connection/user required by that DB skill. Do not silently reuse the APEX admin connection for DB-skill work.
- Before MCP-backed APEX admin work, check `APEX_RELEASE.VERSION_NO` against the supported-version gate. If the version is unsupported, stop and do not generate version-sensitive SQL or change steps.
- Before MCP-backed APEX application creation, scaffold materialization, or import/promotion work, show the verified `SESSION_USER`, `CURRENT_USER`, and `ISDBA` values and continue only after the user confirms that the identity is the intended APEX admin identity.
- Keep APEX security contexts separate: workspace administrator, developer, end user, parsing schema, database-login user, ORDS/APEX runtime account, and DBA/admin account are different roles.
- Do not treat APEX parsing schemas as personal interactive logins in production.
- Prefer supported APEX APIs and views. Do not write directly to internal APEX repository tables.
- Treat versions and managed environments as variable. Inspect availability with `APEX_RELEASE`, `APEX_DICTIONARY`, `ALL_TAB_COLUMNS`, `ALL_ARGUMENTS`, or `DESC` before relying on version-specific columns or package signatures.
- Protect destructive actions with object listings, fresh exact English confirmation prompts, protected-account checks, and no remembered-context assumptions. Workspace-related database users may be dropped only when the user explicitly asks to remove the workspace and its listed related database users/components and confirms that this is their own will. Load `references/workspace/removal.md`.
- After interrupted APEX provisioning, reconnect, inventory each planned artifact individually, and ask whether to roll back only the listed artifacts before retrying or continuing. Load `references/monitoring/mcp-availability.md` and `references/workspace/lifecycle.md`.
- Before APEX workflows that use MCP database access, run the APEX MCP availability guard. If MCP reports `Transport closed` or an unavailable tool channel, stop and do not continue from stale database state.
- Never include real secrets in skills, examples, logs, exports, or chat output.
- Treat APEX activity logs, debug logs, error messages, request values, Team Development files, exports, and session context as potentially sensitive.
- Do not treat APEX session state, hidden items, read-only items, or client-side checks as a security boundary.
- For tenant isolation or sensitive row access, APEX authorization can help the UI, but critical data isolation belongs in the database. Hand off implementation details to `db/security/row-level-security.md`.
- APEX exports may contain application logic, URLs, authorization schemes, build options, static files, credential references, defaults, and other sensitive metadata.
- For APEX-owned application tables, include safe audit columns when appropriate: `created_at`, `created_by`, `updated_at`, `updated_by`. Audit-column triggers should use APEX user context with a database-user fallback, not only `USER`; for database auditing, announce and use `db/security/auditing.md`.
- Mark licensed features and production constraints, especially AWR/ASH/Diagnostics Pack and database security options whose licensing depends on deployment.
- End substantial APEX admin skill additions with a security review covering privileges, secrets, auditability, data exposure, version/cloud restrictions, and destructive actions.

## Documentation

Use official Oracle APEX documentation only.

Primary APEX 26.1 entry points:

```text
https://docs.oracle.com/en/database/oracle/apex/26.1/htmrn/
https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/
https://docs.oracle.com/en/database/oracle/apex/26.1/aeapi/
```

Secondary supported entry point when the installed or target environment is APEX 24.2:

```text
https://docs.oracle.com/en/database/oracle/apex/24.2/
```

Do not use APEX documentation older than 24.2 unless the user explicitly asks for legacy-version migration or compatibility analysis. If legacy documentation is needed, label it as legacy and keep the current 26.1 entry point visible.
