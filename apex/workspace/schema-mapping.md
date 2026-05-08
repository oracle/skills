# APEX Workspace Schema Mapping

Use this topic for parsing schema mappings, additional schemas, workspace export/import preparation, and deployment handoff.

## Add Schema Mapping

Add an existing schema to a workspace with supported APEX APIs.

```sql
BEGIN
    APEX_INSTANCE_ADMIN.ADD_SCHEMA(
        p_workspace => :workspace_name,
        p_schema    => :schema_name);
END;
/
```

Check package signatures first:

```sql
SELECT argument_name
FROM all_arguments
WHERE package_name = 'APEX_INSTANCE_ADMIN'
  AND object_name = 'ADD_SCHEMA'
ORDER BY sequence;
```

## Export And Import

For application imports into a target workspace, use the deployment skill for `APEX_APPLICATION_INSTALL`, build options, substitution strings, credential references, and safe import validation.

DB skill in use: `db/devops/schema-migrations.md` for generic schema migration governance. The APEX workspace skill is being used for workspace-to-schema mapping.

Use `apex/deployment/` for APEX application export/import and environment promotion details.

## Guardrails

- Parsing schemas are not personal interactive logins in production.
- Do not write directly to internal APEX repository tables.
- Keep workspace schema mapping separate from generic object privileges.
- Review APEX exports before sharing; they may contain URLs, authorization schemes, build options, static files, credential references, defaults, and business logic.
