# APEX Security Safety Messages

Use these message patterns when a user request crosses an APEX safety boundary.

```text
DB skill in use: db/security/privilege-management.md for generic privilege analysis. The APEX skill is being used only for APEX workspace and parsing-schema context.
```

```text
APEXlang skill in use: apex/apexlang/SKILL.md for APEX application generation. The APEX admin skill is being used only for workspace, deployment identity, connection safety, and post-deploy validation.
```

```text
Connection confirmation: I am connected as SESSION_USER=<SESSION_USER>, CURRENT_USER=<CURRENT_USER>, ISDBA=<ISDBA>. This APEX admin workflow requires the intended APEX admin identity. Confirm this connection is the APEX admin identity for the target workspace/import before I continue.
```

```text
DB skill handoff: this evidence or action belongs to <DB_SKILL_PATH>. I will use that DB skill's required connection/user for the DB work and keep the APEX admin identity only for APEX workspace, application, page, session, request, and time-window context.
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
Recovery check: this APEX provisioning workflow was interrupted. I will inventory the planned workspace, schema mappings, APEX users, database users, application tables, and APEX applications one by one, then ask whether you want to roll back only the listed artifacts.
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
Unsupported APEX version detected: <VERSION_NO>. The APEX admin skill supports only currently supported APEX releases: 26.1, 24.2, and 24.1 as of June 2026. I will stop before generating APEX admin SQL or change steps for this environment.
```

```text
APEX MCP availability check failed: the MCP transport is closed, so I cannot safely verify or change APEX state from here. I will pause the APEX workflow until the MCP tool channel is available again.
```

Emit these messages before continuing when the request involves APEX application generation handoff, MCP-backed application create/import connection confirmation, DB-skill handoff, unsupported APEX versions, broad grants, direct internal repository writes, destructive changes, interrupted provisioning recovery, sensitive logs/exports, session-state security assumptions, audit triggers, version-sensitive APEX views, or unavailable MCP-backed database access.
