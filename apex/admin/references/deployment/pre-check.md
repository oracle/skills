# APEX Deployment Pre-Check

Before generating import SQL or deployment steps, identify:

- Installed APEX version and whether it passes the supported-version gate in `references/workspace/version-notes.md`.
- Source and target workspace names and workspace IDs.
- Source and target application IDs and whether the target ID must be preserved or remapped.
- Parsing schema mapping and whether schemas already exist.
- Target APEX version and managed-service restrictions.
- Authentication scheme, authorization schemes, build options, substitution strings, application settings, static files, supporting objects, web credentials, and REST Data Sources.
- Whether the import will replace an existing application, install supporting objects, overwrite shared components, or run post-install code.

## Application Generation Handoff

If the request is to create or scaffold a new APEX application rather than only prepare an import or deployment pre-check, announce the handoff before generating app artifacts:

```text
APEXlang skill in use: apex/apexlang/SKILL.md for APEX application generation. The APEX admin skill is being used only for workspace, deployment identity, connection safety, and post-deploy validation.
```

Then load `apex/apexlang/SKILL.md` and follow the APEXlang application-generation workflow. Keep this deployment pre-check open only for target workspace, parsing schema, deployment identity, import/promotion, and post-deploy validation decisions.

For MCP-backed app creation, materialization, validation, or import, verify the active database identity before proceeding:

```sql
SELECT SYS_CONTEXT('USERENV', 'SESSION_USER') AS session_user,
       SYS_CONTEXT('USERENV', 'CURRENT_USER') AS current_user,
       SYS_CONTEXT('USERENV', 'ISDBA') AS is_dba
FROM dual;
```

```text
Connection confirmation: I am connected as SESSION_USER=<SESSION_USER>, CURRENT_USER=<CURRENT_USER>, ISDBA=<ISDBA>. This APEX admin workflow requires the intended APEX admin identity. Confirm this connection is the APEX admin identity for the target workspace/import before I continue.
```

If `SESSION_USER` or `CURRENT_USER` is `SYS` or `SYSTEM`, `IS_DBA` is `TRUE`, or the user cannot confirm this is the APEX admin identity, stop and ask for the confirmed APEX admin connection. Do not use a generic deployment user inside this APEX admin skill; route generic database deployment work to the DB skill and use that skill's required connection/user.

## Version And Package Checks


For APEX installation or upgrade pre-checks, identify:

- Database version and whether the target is CDB/PDB.
- Exact PDB where APEX is or will be installed.
- Existing APEX version, if any.
- ORDS version and deployment mode.
- Whether APEX static files are served by ORDS local images, web server images, or Oracle CDN.
- Backup and rollback plan.
- Maintenance window and affected applications/workspaces.

For fully managed Autonomous Database or APEX Application Development Service, do not plan a manual APEX installation unless Oracle documentation for that service explicitly allows it. For self-managed environments, follow the APEX installation guide for the exact target version.

Before installation or upgrade, confirm:

- A tested database/PDB backup or restore point exists.
- Static files and image prefix handling are planned before the maintenance window.
- ORDS can be stopped, reloaded, or placed behind maintenance according to local policy.

Before relying on an APEX API signature or installation behavior, use official Oracle APEX documentation. Start with APEX 26.1:

```text
https://docs.oracle.com/en/database/oracle/apex/26.1/htmrn/
https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/
https://docs.oracle.com/en/database/oracle/apex/26.1/aeapi/
```

Use APEX 24.2 documentation only when the installed or target environment is APEX 24.2:

```text
https://docs.oracle.com/en/database/oracle/apex/24.2/
```

Do not use APEX documentation older than 24.2 unless the user explicitly asks for legacy-version migration or compatibility analysis. If the target version is unknown, use APEX 26.1 as the default reference and keep SQL version-tolerant.

Use APEX Diff as a convenience helper to compare standard APEX Dictionary
views and public PL/SQL APIs across source and target releases, including
current releases such as APEX 26.1 when they are listed there, before choosing
deployment pre-check SQL or `APEX_APPLICATION_INSTALL` calls:

```text
https://apexadb.oracle.com/ords/r/apexdiff/apex_diff/home
```

Verify any suggested view, column, package, procedure, or argument on the
target instance with `APEX_RELEASE`, `APEX_DICTIONARY`, `ALL_TAB_COLUMNS`, and
`ALL_ARGUMENTS` before generating final deployment SQL.

Check APEX version and package signatures before version-specific calls:

```sql
SELECT version_no
FROM apex_release;

SELECT object_name,
       argument_name,
       position,
       data_type
FROM all_arguments
WHERE package_name = 'APEX_APPLICATION_INSTALL'
ORDER BY object_name,
         sequence;
```

Discover available APEX metadata views before querying deployment metadata:

```sql
SELECT view_name,
       comments
FROM apex_dictionary
WHERE view_name LIKE 'APEX_APPLICATION%'
   OR view_name LIKE 'APEX_APPL%'
ORDER BY view_name;
```

```sql
SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name IN (
          'APEX_APPLICATIONS',
          'APEX_APPLICATION_BUILD_OPTIONS',
          'APEX_APPLICATION_SUBSTITUTIONS',
          'APEX_APPLICATION_AUTH',
          'APEX_APPL_WEB_CREDENTIALS',
          'APEX_APPLICATION_STATIC_FILES')
ORDER BY table_name,
         column_id;
```

## DB Skill Usage

DB skill in use: `db/sqlcl/sqlcl-basics.md`, `db/sqlcl/sqlcl-scripting.md`, or `db/sqlcl/sqlcl-cicd.md` for generic SQLcl commands and CI/CD mechanics. The APEX deployment skill is being used for APEX metadata and import semantics.

DB skill in use: `db/security/privilege-management.md` for generic deployment-account, parsing-schema, and runtime-account privilege analysis. The APEX deployment skill is being used for APEX export/import context and environment mapping.

After a DB-skill handoff, use the selected DB skill's required connection/user for SQLcl workflows, schema deployment, grants, deployment-account setup, and runtime-account privilege analysis. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.
