# Deployment Identity

Use this topic when deciding which database identity should run an APEX-related deployment. Keep the decision explicit before generating install, import, or promotion steps.

## Identity Types

- **APEX instance admin identity**: A dedicated non-SYS/SYSTEM database account granted `APEX_ADMINISTRATOR_ROLE`. Use for APEX workspace lifecycle, workspace-schema mappings, APEX instance settings, and supported `APEX_INSTANCE_ADMIN` APIs.
- **Deployment or install identity**: A controlled compile-time account used to install or update database objects, grants, supporting objects, Liquibase changesets, or SQLcl Projects artifacts. Prefer least privilege and clear auditability. This may be an app-scoped admin user when the environment supports it.
- **App object owner identity**: The schema that owns application objects. Use when the environment requires app-user deployment or when installation is intentionally scoped to a single schema.
- **Runtime identity**: The schema or database account used by the running application. Keep runtime privileges smaller than compile-time deployment privileges.
- **DBA identity**: A privileged identity such as `SYS`, `SYSTEM`, `ADMIN`, or `SYSDBA`. Use only for explicit database administration, APEX installation/upgrade/patching when Oracle documentation requires it, emergency repair, or grant bootstrapping.

## Decision Guide

For workspace creation, workspace-schema mapping, APEX users, and APEX instance settings, use an APEX instance admin identity. Do not use `SYS`, `SYSTEM`, or `SYSDBA` as the routine MCP/default connection.

On Autonomous Database or APEX Service, the service `ADMIN` account may be the available administration identity for APEX workspace provisioning or related APEX administration. Treat it as privileged: confirm `SESSION_USER`, `CURRENT_USER`, and `ISDBA`, ask the user whether to continue with that identity, and keep the work strictly APEX-admin-scoped.

For APEX application import only, prefer a connection that matches the intended workspace and deployment model. Confirm the target application, workspace, parsing schema, and whether the import updates an existing app or creates a new one.

For new APEX application generation, route artifact creation to `apex/apexlang/SKILL.md` after announcing the skill handoff. Use this deployment identity topic only to decide whether the connected database user is appropriate for validation, materialization, import, or post-deploy checks.

Before MCP-backed app creation, materialization, or import, verify `SESSION_USER`, `CURRENT_USER`, and `ISDBA`, show those values to the user, and ask whether to continue with that connection user. Do not continue silently from a previously active connection.

For supporting database objects, SQLcl Projects, Liquibase, grants, cross-schema objects, app schema creation, database users/schemas, quotas, tablespaces, or ORDS configuration, route the database-deployment portion to the SQLcl/DB deployment skill. Ask the user for a separate DB administration connection such as `SYSTEM`, `ADMIN`, or a scoped account with comparable privileges. The APEX admin skill may track the APEX import/promotion checklist, but it must not own generic schema deployment mechanics or silently reuse an APEX admin connection for DB-skill work.

For shared databases, prefer app-user deployment or an app-scoped deployment identity so one application's installer cannot affect unrelated schemas. On Oracle Database versions that support schema-scoped administrative privileges, an app-scoped admin/install user may provide a better balance between automation and isolation.

For read-only APEX performance triage, a privileged connection is not automatically blocked, but the work must remain read-only and the response should state that a least-privilege read-only/APEX admin account is preferred. If the evidence needed is AWR, ASH, `V$SESSION`, `V$SQL`, wait events, ORDS pool configuration, or system-level diagnostics, route that portion to the DB/ORDS/performance skill.

## Guardrails

- Do not collapse compile-time deployment identity and runtime identity without explaining the security trade-off.
- Do not require app object owners to retain broad DDL privileges at runtime just because deployment is convenient.
- Do not recommend `DBA`, `SYSDBA`, `CREATE ANY TABLE`, `GRANT ANY PRIVILEGE`, or cross-schema `ANY` privileges for routine APEX work unless the user explicitly asks for privileged database deployment and the risk is called out.
- Do not use `SYS` for SQLcl/Liquibase deployment workflows.
- If `SYSTEM`, `ADMIN`, or another privileged admin identity is proposed for deployment, classify the task as DB deployment, require explicit scope, keep it out of routine APEX MCP operations, and prefer a custom least-privilege install user where practical.
- Record the selected identity model in deployment notes: `apex_instance_admin`, `deployment_install_user`, `app_object_owner`, `runtime_user`, or `dba_admin`.
