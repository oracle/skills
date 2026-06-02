# APEX Workspace Version Notes

APEX version is usually more important than Oracle Database version for these APIs. The same database release can host different supported APEX versions, and APEX package signatures can change independently of database release cadence.

Before citing API signatures or version-specific behavior, use official Oracle APEX documentation. Start with APEX 26.1:

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

## Supported Version Gate

Run this gate before any MCP-backed APEX admin workflow. Continue only when the
active connection has passed the APEX Admin Identity Gate in `apex/admin/SKILL.md`
and the installed APEX version is in the supported list. As of May 2026, this
skill supports APEX `26.1`, `24.2`, `24.1`, and `23.2`.

```sql
SELECT version_no,
       CASE
           WHEN REGEXP_LIKE(version_no, '^(26\.1|24\.2|24\.1|23\.2)(\.|$)')
           THEN 'SUPPORTED'
           ELSE 'UNSUPPORTED'
       END AS apex_admin_skill_support
FROM apex_release;
```

If `APEX_ADMIN_SKILL_SUPPORT` is `UNSUPPORTED`, stop before generating SQL,
PL/SQL, monitoring queries, deployment steps, workspace changes, or import
instructions.

Use this message:

```text
Unsupported APEX version detected: <VERSION_NO>. The APEX admin skill supports only currently supported APEX releases: 26.1, 24.2, 24.1, and 23.2 as of May 2026. I will stop before generating APEX admin SQL or change steps for this environment.
```

Use these checks before generating version-sensitive SQL. `APEX_INSTANCE_ADMIN` may be a synonym for the real APEX package, so resolve it before checking arguments:

```sql
SELECT version_no
FROM apex_release;

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
       a.argument_name,
       a.position,
       a.data_type,
       a.defaulted
FROM apex_instance_admin_target t
JOIN all_arguments a
  ON a.owner = t.owner
 AND a.package_name = t.package_name
WHERE a.object_name IN ('ADD_WORKSPACE', 'ADD_SCHEMA')
ORDER BY a.owner,
         a.package_name,
         a.object_name,
         a.position;
```

Use `ALL_TAB_COLUMNS`, `ALL_ARGUMENTS`, `APEX_DICTIONARY`, and supported APEX version views before relying on a column or package parameter.

## APEX Diff Helper

APEX Diff can be used as a convenience helper when comparing APEX Dictionary
views and public PL/SQL APIs across APEX releases, including current releases
such as APEX 26.1 when they are listed there:

```text
https://apexadb.oracle.com/ords/r/apexdiff/apex_diff/home
```

Use it to identify likely standard-view, standard-call, or package-signature
changes before writing monitoring, performance, deployment, or workspace SQL.
Then verify the installed target instance with `APEX_RELEASE`,
`APEX_DICTIONARY`, `ALL_TAB_COLUMNS`, and `ALL_ARGUMENTS`. Do not treat APEX
Diff output as a substitute for local metadata checks or official Oracle APEX
documentation.

For Oracle Database 19c through 26ai, keep workspace provisioning scripts portable by detecting APEX package signatures and by avoiding database-version assumptions unless the task depends on database-specific features such as MLE, Resource Manager setup, or schema privilege syntax.

DB skill in use: `db/architecture/oracle-cloud-oci.md` or the relevant `db/admin/*` skill only when the question moves into generic database or cloud administration. The APEX workspace skill is being used for APEX version and package signature context.

After a DB-skill handoff, use the selected DB skill's required connection/user. Do not reuse the APEX admin connection for generic database or cloud administration unless that DB skill explicitly accepts it.
