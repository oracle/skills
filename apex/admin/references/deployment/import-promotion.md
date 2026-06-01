# APEX Import And Promotion

Use `APEX_APPLICATION_INSTALL` when the import needs deterministic workspace, application ID, offset, alias, proxy, image prefix, or schema settings. Keep these calls in the import wrapper, not scattered through application code.

Version check: inspect `ALL_ARGUMENTS` for `APEX_APPLICATION_INSTALL` in the target APEX release before using version-specific procedures or parameters.

If the workflow creates or scaffolds a new APEX application artifact before import, announce the skill handoff and route that generation to APEXlang:

```text
APEXlang skill in use: apex/apexlang/SKILL.md for APEX application generation. The APEX admin skill is being used only for workspace, deployment identity, connection safety, and post-deploy validation.
```

Before MCP-backed import or create-new materialization, verify the connection identity and continue only after the user confirms it is the intended APEX admin identity for the target workspace/import. Block `SYS`, `SYSTEM`, `ISDBA = TRUE`, generic deployment users, parsing schemas, workspace users, ORDS/APEX runtime accounts, and unknown identities. Route generic database deployment work to the DB skill and use that skill's required connection/user.

```sql
BEGIN
    APEX_APPLICATION_INSTALL.SET_WORKSPACE(:target_workspace);
    APEX_APPLICATION_INSTALL.SET_APPLICATION_ID(:target_application_id);
    APEX_APPLICATION_INSTALL.SET_SCHEMA(:target_parsing_schema);
    APEX_APPLICATION_INSTALL.SET_APPLICATION_ALIAS(:target_application_alias);
END;
/
```

Check package arguments in the target APEX version before using less common procedures or parameters. Do not assume every APEX release supports the same install API shape.

## Replace Safety

For replace imports, list the existing target application and workspace before import and require explicit confirmation for production:

```sql
SELECT workspace,
       application_id,
       application_name,
       alias,
       owner,
       last_updated_on
FROM apex_applications
WHERE application_id = :target_application_id
   OR UPPER(alias) = UPPER(:target_application_alias)
ORDER BY workspace,
         application_id;
```

Treat these as destructive or high-risk:

- Replace an existing application in production.
- Run supporting objects that drop or truncate tables.
- Delete or rotate APEX Web Credentials.
- Change authentication or authorization schemes.
- Change parsing schema mapping.
- Remove static files used by deployed pages.
- Import into a different workspace than expected.

Safety stop: list affected workspace, application, parsing schema, authentication scheme, authorization schemes, credentials, and supporting objects. Require explicit confirmation before generating or running replace, delete, or destructive supporting-object steps.

## DB Skill Usage

DB skill in use: `db/devops/schema-migrations.md` and `db/devops/version-control-sql.md` for generic schema migration and release governance. The APEX deployment skill is being used for APEX application artifact promotion and environment mapping.

After this handoff, use the selected DB skill's required connection/user for schema migration, SQLcl project, supporting-object, and database release-governance work. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.
