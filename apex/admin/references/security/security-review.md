# APEX Security Review

Use this checklist after substantial APEX workspace or application-support changes.

- APEX admin identity: every live MCP-backed APEX admin step used the confirmed APEX admin identity, not `SYS`, `SYSDBA`, a parsing schema, workspace user, ORDS/APEX runtime account, generic deployment user, or unknown account. If `SYSTEM` was used, the exact uppercase `YES` confirmation, scope, targets, and risk summary were recorded before work continued.
- Protocol file: every substantive live APEX admin workflow, state-changing workflow, customer-evidence analysis, and debugging workflow created or updated a local protocol file outside the skill tree.
- DB handoff identity: every generic DB/security step used the selected DB skill's required connection/user rather than silently reusing the APEX admin connection.
- Privileges: parsing schemas, workspace users, database-login users, and automation accounts have only the required rights.
- Role boundaries: workspace administrator, developer, end user, parsing schema, runtime account, and DBA/admin roles are not mixed.
- Secrets: no real passwords, web credentials, OAuth secrets, SMTP credentials, wallet passwords, or API tokens appear in scripts, exports, logs, examples, or chat output.
- Data exposure: activity logs, debug logs, request values, Team Development files, static files, exports, and audit columns do not expose unnecessary sensitive data.
- Auditability: workspace creation/removal, user creation, schema mapping changes, imports/exports, grants, role changes, and credential changes are traceable.
- Version and cloud limits: APEX package signatures, APEX view columns, Autonomous Database limits, and managed-service restrictions are checked before use.
- Destructive actions: affected objects are listed, protected accounts are blocked, and explicit confirmations are required.
- DB skill usage: generic security, performance, ORDS, SQLcl, masking, encryption, VPD/RLS, or auditing work is routed to the relevant `db/...` skill and announced with a visible `DB skill in use:` message.
