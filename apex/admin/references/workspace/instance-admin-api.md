# APEX Instance Admin API

Use this reference when an APEX administration workflow should prefer the documented `APEX_INSTANCE_ADMIN` package instead of internal APEX repository tables or ad hoc SQL.

Official source: Oracle APEX 26.1 API Reference, `APEX_INSTANCE_ADMIN`:

```text
https://docs.oracle.com/en/database/oracle/apex/26.1/aeapi/APEX_INSTANCE_ADMIN.html
```

The package manages APEX runtime-environment settings and schema-to-workspace mappings. Oracle documents that it can be executed by `SYS`, `SYSTEM`, and database users granted `APEX_ADMINISTRATOR_ROLE`; this skill still applies the APEX Admin Identity Gate from `apex/admin/SKILL.md` and does not use `SYS` or `SYSDBA` for routine MCP-backed APEX admin work.

## Default Rule

Prefer documented `APEX_INSTANCE_ADMIN` APIs for APEX instance administration tasks that are in scope for this skill. Do not query or update internal APEX repository tables directly.

Before generating executable calls:

1. Verify the installed APEX version and supported-version gate.
2. Verify the active identity with the APEX Admin Identity Gate.
3. Resolve the installed package or synonym and inspect `ALL_ARGUMENTS` before relying on version-sensitive parameters.
4. Load the specific workflow reference for lifecycle, schema mapping, removal, resource governance, or deployment identity.
5. For state-changing calls, create or update the local protocol file and require explicit user confirmation of the exact target and scope.

## Package Signature Check

`APEX_INSTANCE_ADMIN` may be a synonym for the real APEX package. Resolve it before checking procedure arguments:

```sql
WITH apex_instance_admin_target AS (
    SELECT owner,
           object_name AS package_name
    FROM all_objects
    WHERE object_name = 'APEX_INSTANCE_ADMIN'
      AND object_type = 'PACKAGE'
    UNION ALL
    SELECT table_owner AS owner,
           table_name  AS package_name
    FROM all_synonyms
    WHERE synonym_name = 'APEX_INSTANCE_ADMIN'
)
SELECT DISTINCT
       a.owner,
       a.package_name,
       a.object_name,
       a.overload,
       a.sequence,
       a.position,
       a.argument_name,
       a.in_out,
       a.data_type,
       a.defaulted
FROM apex_instance_admin_target t
JOIN all_arguments a
  ON a.owner = t.owner
 AND a.package_name = t.package_name
WHERE a.object_name = UPPER(:procedure_name)
ORDER BY a.owner,
         a.package_name,
         a.overload,
         a.sequence;
```

## Owned APEX Admin APIs

These APIs are in scope when the matching workflow reference is loaded and the identity/confirmation gates pass:

- `ADD_WORKSPACE`: create APEX workspaces. Use `lifecycle.md`.
- `REMOVE_WORKSPACE`: remove APEX workspaces. Use `removal.md`.
- `ADD_SCHEMA`: map schemas to workspaces. Use `schema-mapping.md`; pass `p_grant_apex_privileges => TRUE` when supported and standard APEX grants are required.
- `REMOVE_SCHEMA`: remove schema mappings from workspaces. Use `schema-mapping.md` or `removal.md`.
- `GET_SCHEMAS`: inspect workspace schema mappings. Use `schema-mapping.md`.
- `GET_PARAMETER`: inspect APEX instance parameters. Use `lifecycle.md` or `resource-governance.md`.
- `SET_PARAMETER`: change APEX instance parameters only after explicit confirmation and protocol logging. Use the specific reference for the setting.
- `GET_WORKSPACE_PARAMETER`: inspect workspace-level APEX parameters. Use `resource-governance.md`.
- `SET_WORKSPACE_PARAMETER`: change workspace-level APEX parameters only after explicit confirmation and protocol logging. Use `resource-governance.md`.
- `CREATE_OR_UPDATE_ADMIN_USER`: use only when the request is explicitly for a documented APEX administration user path and the environment policy accepts this API. Do not use it for initial `INTERNAL` Instance Administrator bootstrap; use `../deployment/instance-admin-bootstrap.md`.
- `UNLOCK_USER`: use only for APEX-managed admin/user unlock workflows after confirming the target user and workspace or instance context. Use `users-and-auth.md`.

## Allowed With Extra Care

These APIs can affect broad instance behavior, security posture, logs, or external integrations. Use only with a narrow scope, exact confirmation, and protocol logging:

- `ADD_AUTO_PROV_RESTRICTIONS`, `REMOVE_AUTO_PROV_RESTRICTIONS`: workspace provisioning governance.
- `CREATE_SCHEMA_EXCEPTION`, `REMOVE_SCHEMA_EXCEPTION`, `REMOVE_SCHEMA_EXCEPTIONS`: schema restriction exceptions.
- `RESTRICT_SCHEMA`, `UNRESTRICT_SCHEMA`: instance-level schema availability.
- `ADD_WEB_ENTRY_POINT`, `REMOVE_WEB_ENTRY_POINT`: external entry-point behavior.
- `SET_LOG_SWITCH_INTERVAL`, `TRUNCATE_LOG`: log retention or volume controls.
- `SET_WORKSPACE_CONSUMER_GROUP`: workspace resource governance.
- `RESERVE_WORKSPACE_APP_IDS`, `FREE_WORKSPACE_APP_IDS`: workspace application ID reservation.
- `REMOVE_APPLICATION`: destructive application removal; require export/backup confirmation and route to deployment/removal checks.
- `REMOVE_SAVED_REPORT`, `REMOVE_SAVED_REPORTS`, `REMOVE_SUBSCRIPTION`: user/application metadata cleanup.

## Route Or Avoid By Default

Do not treat every documented API as a default admin automation target:

- `CREATE_CLOUD_CREDENTIAL` and `DROP_CLOUD_CREDENTIAL`: route credential handling to the appropriate secure credential/DB/cloud workflow. Never collect credential secrets in chat or skill files.
- `DB_SIGNATURE` and `IS_DB_SIGNATURE_VALID`: use only when troubleshooting APEX runtime integrity with an explicit Oracle-supported reason; do not use as a general health check.
- `GRANT_EXTENSION_WORKSPACE` and `REVOKE_EXTENSION_WORKSPACE`: use only when the user explicitly asks for extension-workspace governance and the environment supports it.
- `VALIDATE_EMAIL_CONFIG`: allowed for APEX email configuration validation, but do not expose SMTP credentials or secret configuration values.

If an `APEX_INSTANCE_ADMIN` API overlaps with generic database users, grants, quotas, tablespaces, ORDS, AWR/ASH, SQL Monitor, or infrastructure diagnostics, stop and route that portion to the DB/ORDS skill.

## Security Review

Before sharing results or runnable steps, verify:

- The selected API is documented for the installed APEX version.
- The active identity is a confirmed APEX admin identity or the explicit `SYSTEM` exception has passed.
- `SYS` and `SYSDBA` are not used for routine MCP-backed APEX admin work.
- State-changing calls have an exact target list, confirmation, protocol file, and rollback/cleanup note where applicable.
- Customer names, workspace names, schema names, users, URLs, and settings are redacted or minimized in chat.
- Generic DB, ORDS, AWR/ASH, SQL Monitor, grants, quotas, tablespaces, and schema creation were handed off instead of being absorbed into this skill.
