# APEX Deployment Security Review

Use this checklist after substantial APEX deployment or promotion work.

- Scope: APEX export/import, `APEX_APPLICATION_INSTALL`, App Builder settings, workspace/application mapping, and APEX metadata stayed in this skill; generic SQLcl, schema migration, privilege, encryption, auditing, network, ORDS, or CI/CD work was routed to `db/...`.
- DB usage messages: every generic DB step has a visible `DB skill in use:` message naming the relevant DB skill path.
- Privileges: deployment accounts, parsing schemas, workspace administrators, developers, database-login users, ORDS/APEX runtime accounts, and DBA/admin accounts remain separate and least-privilege.
- Secrets: no real passwords, tokens, OAuth secrets, SMTP credentials, wallet passwords, web credential values, or secret-bearing URLs appear in exports, scripts, examples, logs, or chat output.
- Data exposure: static files, supporting objects, substitution strings, REST Data Sources, debug logs, and exports do not expose unnecessary payloads, BLOBs, CLOBs, credentials, or sensitive metadata.
- Version/cloud restrictions: APEX version, install package signatures, managed-service restrictions, and available metadata views were checked before version-specific SQL or import steps.
- Destructive actions: replace imports, supporting objects, credential changes, app deletion, schema mapping changes, and production imports list affected objects and require explicit confirmation.
- Auditability: export source, import target, application ID, workspace, parsing schema, build options, release artifact, and operator are traceable.
