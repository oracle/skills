# APEX Security Guardrails

Apply these APEX-specific rules before generating SQL, scripts, or operational steps.

## Role Boundaries

Keep APEX role boundaries clear: workspace administrator, developer, end user, parsing schema, database-login user, ORDS/APEX runtime account, and DBA/admin account are different security contexts.

Run live MCP-backed APEX admin work only under the confirmed APEX admin identity from `apex/admin/SKILL.md`. Do not use `SYS`, `SYSDBA`, parsing schemas, workspace users, ORDS/APEX runtime accounts, generic deployment users, or unknown accounts for routine APEX-owned queries or operations.

`SYSTEM` without `SYSDBA` is allowed for APEX-admin-scoped work only after the exact uppercase `YES` confirmation defined in `apex/admin/SKILL.md`. The confirmation must show the verified identity, target objects, action scope, password-handling path when relevant, and risk summary. This does not authorize generic DB/ORDS/performance work.

Do not treat parsing schemas as personal interactive logins in production. If a parsing schema is only technical, keep it narrow and document whether it should be locked outside deployment windows.

## Least Privilege

Do not grant broad privileges such as `DBA`, `SYSDBA`, `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`, `CREATE ANY TABLE`, `GRANT ANY ROLE`, `GRANT ANY PRIVILEGE`, or `WITH ADMIN OPTION` for ordinary APEX provisioning.

DB skill in use: `db/security/privilege-management.md` for generic database privilege design. The APEX security skill is being used for APEX workspace, parsing-schema, and runtime-account context.

After a DB-skill handoff, use that DB security skill's required connection/user. Do not reuse the APEX admin connection for grants, users, quotas, audit policies, encryption, network ACLs, VPD/RLS, masking, or other generic DB security work unless the DB skill explicitly accepts it.

## Supported Interfaces

Do not write directly to internal APEX repository tables. Use supported APEX APIs and views.

Before querying APEX views or package signatures, inspect version-specific availability through `ALL_TAB_COLUMNS`, `ALL_ARGUMENTS`, `APEX_DICTIONARY`, or `APEX_RELEASE`.

## Session State And Tenant Isolation

APEX session state, hidden items, read-only items, and client-side checks are not a security boundary. Use server-side authorization, validations, and database privileges.

For tenant isolation or sensitive row access, describe the APEX authorization context, then use database-enforced isolation.

DB skill in use: `db/security/row-level-security.md` for VPD/RLS implementation details. The APEX security skill is being used for APEX authorization and UI context.

## Secrets, Logs, And Exports

Do not hard-code secrets in APEX examples, exports, logs, scripts, or chat output. This includes database passwords, web credentials, OAuth secrets, SMTP credentials, wallet passwords, and API tokens.

Treat APEX activity logs, debug logs, error messages, request values, Team Development files, static files, and exports as potentially sensitive. Avoid selecting unnecessary CLOB/BLOB payloads or secret-bearing values during triage.

Review APEX exports before committing or sharing. They may contain application logic, URLs, authorization schemes, build options, static files, credential references, defaults, and sensitive metadata.

DB skill in use: `db/security/encryption.md`, `db/security/network-security.md`, or `db/security/data-masking.md` for generic encryption, TLS, network ACL, redaction, and masking implementation. The APEX security skill is being used for APEX-specific exposure and export/log context.

## Common Mistakes

- Treating APEX session state, hidden items, read-only items, or client-side checks as a security boundary.
- Querying or updating internal APEX repository tables when supported APEX APIs or views should be used.
- Duplicating generic database security guidance in an APEX skill instead of using `db/security/*`.
- Selecting unnecessary debug, request, Team Development, BLOB, CLOB, or export payloads during operational triage.
- Creating schemas or workspace users with broad privileges because the script runs as an administrator.
