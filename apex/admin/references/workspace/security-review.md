# APEX Workspace Security Review

Use this checklist after substantial workspace provisioning, import/export, schema mapping, resource governance, or removal work.

- Scope: the workflow stayed APEX-specific; generic privilege, auditing, security, SQL tuning, ASH/AWR, SQLcl, ORDS, or resource diagnosis was routed to the relevant `db/...` skill with a visible `DB skill in use:` message.
- Licensed diagnostics: AWR and ASH usage called out Diagnostics Pack requirements before historical database-performance views were used.
- Privileges: parsing schemas, workspace administrators, developers, database-login users, ORDS/APEX runtime accounts, and DBA/admin accounts are separate and least-privilege.
- Broad grants: no ordinary APEX provisioning grants `DBA`, `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`, `CREATE ANY TABLE`, `GRANT ANY ROLE`, or `GRANT ANY PRIVILEGE`.
- Supported interfaces: workspace changes use supported APEX APIs and views, not direct writes to internal APEX repository tables.
- Version and cloud limits: APEX package signatures, view columns, Autonomous Database limits, and managed-service restrictions were checked before version-specific SQL or PL/SQL.
- Secrets and exports: workspace exports, scripts, logs, and examples do not expose real passwords, tokens, SMTP credentials, wallet passwords, web credentials, or secret-bearing URLs.
- Destructive actions: affected workspaces, schemas, APEX users, database users, and tablespaces are listed; protected accounts are blocked; explicit confirmation is required.
- Data exposure: logs, Team Development files, exports, and session context avoid unnecessary payload columns, BLOBs, CLOBs, request values, and sensitive metadata.
