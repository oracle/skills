# APEX Security Review

Use this checklist after substantial APEX workspace or application-support changes.

- Privileges: parsing schemas, workspace users, database-login users, and automation accounts have only the required rights.
- Role boundaries: workspace administrator, developer, end user, parsing schema, runtime account, and DBA/admin roles are not mixed.
- Secrets: no real passwords, web credentials, OAuth secrets, SMTP credentials, wallet passwords, or API tokens appear in scripts, exports, logs, examples, or chat output.
- Data exposure: activity logs, debug logs, request values, Team Development files, static files, exports, and audit columns do not expose unnecessary sensitive data.
- Auditability: workspace creation/removal, user creation, schema mapping changes, imports/exports, grants, role changes, and credential changes are traceable.
- Version and cloud limits: APEX package signatures, APEX view columns, Autonomous Database limits, and managed-service restrictions are checked before use.
- Destructive actions: affected objects are listed, protected accounts are blocked, and explicit confirmations are required.
- DB skill usage: generic security, performance, ORDS, SQLcl, masking, encryption, VPD/RLS, or auditing work is routed to the relevant `db/...` skill and announced with a visible `DB skill in use:` message.
