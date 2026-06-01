# Deployment Identity

Use this topic when deciding which database identity should run an APEX-related deployment. Keep the decision explicit before generating install, import, or promotion steps.

## Identity Types

- **APEX instance admin identity**: A dedicated non-SYS/SYSTEM database account granted `APEX_ADMINISTRATOR_ROLE`. Use for APEX workspace lifecycle, workspace-schema mappings, APEX instance settings, and supported `APEX_INSTANCE_ADMIN` APIs.
- **Deployment or install identity**: A controlled compile-time account used to install or update database objects, grants, supporting objects, Liquibase changesets, or SQLcl Projects artifacts. Prefer least privilege and clear auditability. This may be an app-scoped admin user when the environment supports it.
- **App object owner identity**: The schema that owns application objects. Use when the environment requires app-user deployment or when installation is intentionally scoped to a single schema.
- **Runtime identity**: The schema or database account used by the running application. Keep runtime privileges smaller than compile-time deployment privileges.
- **DBA identity**: A privileged identity such as `SYS`, `SYSTEM`, `ADMIN`, or `SYSDBA`. Use only for explicit database administration, APEX installation/upgrade/patching when Oracle documentation requires it, emergency repair, or grant bootstrapping.

## Decision Guide

All live MCP-backed work that remains in the APEX admin skill must use a confirmed APEX instance admin identity. Do not use `SYS`, `SYSTEM`, `SYSDBA`, app parsing schemas, workspace developers/end users, ORDS/APEX runtime accounts, or generic deployment users as the routine MCP/default connection.

On Autonomous Database or APEX Service, the service `ADMIN` account may be the available administration identity for APEX workspace provisioning or related APEX administration. Treat it as privileged: confirm `SESSION_USER`, `CURRENT_USER`, and `ISDBA`, ask the user whether to continue with that identity, and keep the work strictly APEX-admin-scoped.

For APEX application import metadata and `APEX_APPLICATION_INSTALL` calls handled by this skill, use the confirmed APEX admin identity. Confirm the target application, workspace, parsing schema, and whether the import updates an existing app or creates a new one.

For new APEX application generation, route artifact creation to `apex/apexlang/SKILL.md` after announcing the skill handoff. Use this deployment identity topic only to decide whether the connected database user is appropriate for validation, materialization, import, or post-deploy checks.

Before MCP-backed app creation, materialization, or import, verify `SESSION_USER`, `CURRENT_USER`, and `ISDBA`, show those values to the user, and continue only after the user confirms that the connection is the intended APEX admin identity. Do not continue silently from a previously active connection.

For supporting database objects, SQLcl Projects, Liquibase, grants, cross-schema objects, app schema creation, database users/schemas, quotas, tablespaces, or ORDS configuration, route the database-deployment portion to the SQLcl/DB deployment skill. Ask the user for a separate DB administration connection or scoped provisioning identity required by that DB skill, such as a scoped install user, privilege-management account, `SYSTEM`, `ADMIN`, or another approved DB administration identity. The APEX admin skill may track the APEX import/promotion checklist, but it must not own generic schema deployment mechanics or silently reuse an APEX admin connection for DB-skill work.

For shared databases, prefer app-user deployment or an app-scoped deployment identity so one application's installer cannot affect unrelated schemas. On Oracle Database versions that support schema-scoped administrative privileges, an app-scoped admin/install user may provide a better balance between automation and isolation.

For read-only APEX performance triage, use either static evidence with no live database connection or a confirmed APEX admin identity. If the active connection is privileged but not the confirmed APEX admin identity, stop and ask for the correct APEX admin connection. If the evidence needed is AWR, ASH, `V$SESSION`, `V$SQL`, wait events, ORDS pool configuration, or system-level diagnostics, route that portion to the DB/ORDS/performance skill and use the DB skill's required connection/user.

## Guardrails

- Do not collapse compile-time deployment identity and runtime identity without explaining the security trade-off.
- Do not require app object owners to retain broad DDL privileges at runtime just because deployment is convenient.
- Do not recommend `DBA`, `SYSDBA`, `CREATE ANY TABLE`, `GRANT ANY PRIVILEGE`, or cross-schema `ANY` privileges for routine APEX work unless the user explicitly asks for privileged database deployment and the risk is called out.
- Do not use `SYS` for SQLcl/Liquibase deployment workflows.
- If `SYSTEM` or another privileged DB admin identity is proposed for deployment, classify the task as DB deployment, require explicit scope, keep it out of routine APEX MCP operations, and prefer a custom least-privilege install user where practical. Treat managed-service `ADMIN` as an APEX admin identity only when the user explicitly confirms that role for the APEX-scoped task.
- Record the selected identity model in deployment notes: `apex_instance_admin`, `deployment_install_user`, `app_object_owner`, `runtime_user`, or `dba_admin`.
