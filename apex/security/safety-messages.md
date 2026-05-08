# APEX Security Safety Messages

Use these message patterns when a user request crosses an APEX safety boundary.

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
Safety stop: this operation is destructive. I will first list affected workspaces, schemas, APEX users, and database users, then require explicit confirmation before generating or running delete steps.
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

Emit these messages before continuing when the request involves broad grants, direct internal repository writes, destructive changes, sensitive logs/exports, session-state security assumptions, audit triggers, or version-sensitive APEX views.
