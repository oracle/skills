# APEX Workspace Version Notes

APEX version is usually more important than Oracle Database version for these APIs. The same database release can host different supported APEX versions, and APEX package signatures can change independently of database release cadence.

Before citing API signatures or version-specific behavior, check the current official Oracle APEX documentation landing page and then use the docs for the target installed version:

```text
https://apex.oracle.com/en/learn/documentation/
```

If the target version is unknown, use the newest official Oracle APEX documentation as the default reference and keep SQL version-tolerant.

Use these checks before generating version-sensitive SQL:

```sql
SELECT version_no
FROM apex_release;

SELECT argument_name
FROM all_arguments
WHERE package_name = 'APEX_INSTANCE_ADMIN'
  AND object_name = 'ADD_WORKSPACE'
ORDER BY sequence;
```

Use `ALL_TAB_COLUMNS`, `ALL_ARGUMENTS`, `APEX_DICTIONARY`, and supported APEX version views before relying on a column or package parameter.

For Oracle Database 19c through 26ai, keep workspace provisioning scripts portable by detecting APEX package signatures and by avoiding database-version assumptions unless the task depends on database-specific features such as MLE, Resource Manager setup, or schema privilege syntax.

DB skill in use: `db/architecture/oracle-cloud-oci.md` or the relevant `db/admin/*` skill only when the question moves into generic database or cloud administration. The APEX workspace skill is being used for APEX version and package signature context.
