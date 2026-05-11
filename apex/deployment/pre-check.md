# APEX Deployment Pre-Check

Before generating import SQL or deployment steps, identify:

- Source and target workspace names and workspace IDs.
- Source and target application IDs and whether the target ID must be preserved or remapped.
- Parsing schema mapping and whether schemas already exist.
- Target APEX version and managed-service restrictions.
- Authentication scheme, authorization schemes, build options, substitution strings, application settings, static files, supporting objects, web credentials, and REST Data Sources.
- Whether the import will replace an existing application, install supporting objects, overwrite shared components, or run post-install code.

## Version And Package Checks


For APEX 24.2 installation or upgrade pre-checks, also identify:

- Database version and whether the target is CDB/PDB.
- Exact PDB where APEX is or will be installed.
- Existing APEX version, if any.
- ORDS version and deployment mode.
- Whether APEX static files are served by ORDS local images, web server images, or Oracle CDN.
- Backup and rollback plan.
- Maintenance window and affected applications/workspaces.

As of May 11, 2026, Oracle's APEX downloads page states that APEX 24.2 is supported through Oracle Support Services on Oracle Database 19.3 or higher with a valid Oracle Database Technical Support agreement. Still verify the current installation guide before acting, because managed services, patch levels, and support policies can change.

For fully managed Autonomous Database or APEX Application Development Service, do not plan a manual APEX installation unless Oracle documentation for that service explicitly allows it. For self-managed environments, follow the APEX installation guide for the exact target version.

Before installation or upgrade, confirm:

- A tested database/PDB backup or restore point exists.
- Static files and image prefix handling are planned before the maintenance window.
- ORDS can be stopped, reloaded, or placed behind maintenance according to local policy.

Before relying on an APEX API signature, check the current official Oracle APEX documentation landing page and then use the docs for the target installed version:

```text
https://apex.oracle.com/en/learn/documentation/
```

If the target version is unknown, use the newest official Oracle APEX documentation as the default reference and keep SQL version-tolerant.

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
