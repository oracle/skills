# APEX Patch Set Bundle Workflow

Use this topic for Oracle APEX Patch Set Bundle status checks and patch planning. Patch availability is time-sensitive, so verify the latest patch number, patch version, README, and known issues from Oracle before giving exact patch instructions.

Use this for self-managed or co-managed environments. For fully managed Autonomous Database or APEX Application Development Service, Oracle normally applies APEX patch bundles; do not advise manual patching unless the service documentation says patching is customer-managed.

Live MCP-backed APEX patch-status checks in this skill require the confirmed APEX admin identity from `apex/admin/SKILL.md`. Privileged patch execution, database backup/restore, invalid-object repair, and ORDS runtime administration are DB/ORDS-skill work and must use those skills' required connection/user.

## Version And View Availability

Check APEX version first:

```sql
SELECT version_no
FROM apex_release;
```

Check whether `APEX_PATCHES` is available and which columns exist before querying patch rows:

```sql
SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name = 'APEX_PATCHES'
ORDER BY column_id;
```

Then query installed patch rows:

```sql
SELECT patch_number,
       patch_version,
       installed_on
FROM apex_patches
ORDER BY installed_on;
```

If `APEX_PATCHES` returns no rows, that only means no patch rows are recorded in that view for the current APEX installation. It does not prove that the system is unsupported or broken. Compare `APEX_RELEASE.VERSION_NO` with the latest official APEX release and patch bundle information.

## Find The Latest Patch Bundle

Before recommending a patch number:

- Check the Oracle APEX Downloads and Known Issues page.
- Check My Oracle Support for the target APEX release.
- Read the patch README included in the downloaded patch bundle.
- Confirm whether the patch applies to the exact installed APEX base release.

As of May 11, 2026, Oracle's APEX downloads page lists Patch Set Bundle for Oracle APEX 24.2 as patch `37366599`, last updated April 30, 2026, with `PATCH_VERSION` 16. Oracle states that applying it updates the APEX product version to `24.2.16`. Treat this as a dated reference point, not a permanent rule.

## High-Level Patch Flow

Follow the patch README for exact commands. Use this as the operational checklist:

1. Confirm target PDB and installed APEX version.
2. Query `APEX_PATCHES`.
3. Download the matching APEX Patch Set Bundle from My Oracle Support.
4. Read the patch README completely.
5. Back up the database/PDB and export critical APEX applications.
6. Stop ORDS or put APEX behind maintenance if the README or local policy requires it.
7. Unzip the patch on the database host or approved deployment host.
8. After the DB/admin skill handoff, connect to the PDB where APEX is installed with the required administrative privileges, typically `SYS AS SYSDBA` when the README requires it.
9. Run the patch script from the extracted patch directory exactly as documented.
10. Recompile invalid objects.
11. Update APEX static files, or set the image prefix to the matching Oracle CDN path when CDN images are used.
12. Restart or reload ORDS.
13. Verify APEX version, patch rows, invalid objects, App Builder, application runtime, and static resources.

## Post-Patch Verification

```sql
SELECT version_no
FROM apex_release;
```

```sql
SELECT patch_number,
       patch_version,
       installed_on
FROM apex_patches
ORDER BY installed_on;
```

```sql
SELECT owner,
       object_type,
       COUNT(*) AS invalid_objects
FROM dba_objects
WHERE status = 'INVALID'
  AND owner LIKE 'APEX\_%' ESCAPE ''
GROUP BY owner, object_type
ORDER BY owner, object_type;
```

Also verify:

- APEX Administration Services opens.
- At least one workspace can sign in.
- App Builder opens without JavaScript/CSS errors.
- A representative runtime application works.
- Browser developer tools show no missing `/i/` static resources.
- ORDS logs have no new APEX static-resource or pool errors.

## Static Files And CDN

APEX patches can require static file updates. The database APEX version and the served image files must match.

If using local images:

- Copy the patched `images` directory according to the README.
- Confirm ORDS or the web server serves the updated `/i/` path.

If using Oracle CDN:

- Confirm the known-issues/downloads page lists a CDN URL for the exact patched APEX version.
- Set the image prefix only to the matching version path.
- Test App Builder and runtime pages for missing assets.

## Autonomous And Managed Services

For Autonomous Database and APEX Application Development Service:

- Check `APEX_RELEASE` and `APEX_PATCHES`.
- Report the observed version and patch rows.
- Do not instruct the user to manually download and apply a patch bundle unless Oracle service documentation explicitly says that patching is customer-managed.
- If the environment is behind the latest published patch, advise checking the service maintenance schedule or opening an Oracle Support service request.

## DB Skill Usage

DB skill in use: `db/admin/backup-recovery.md` for generic database backup and restore planning. The APEX deployment skill is being used for APEX patch-bundle workflow context.

DB skill in use: `db/ords/ords-monitoring.md` for generic ORDS runtime checks. The APEX deployment skill is being used for APEX static-file and App Builder verification context.

After a DB/ORDS-skill handoff, use the selected skill's required connection/user. Do not reuse the APEX admin connection for backup, restore, patch execution, invalid-object repair, or ORDS diagnostics unless the selected skill explicitly accepts it.

## Guardrails

- Do not treat `APEX_PATCHES` with no rows as proof that the newest patch is missing.
- Do not apply a patch bundle to the wrong APEX base version.
- Do not run patch scripts in `CDB$ROOT` unless the patch README explicitly instructs it.
- Do not forget to update static files or CDN image prefix.
- Do not give a hard-coded latest patch number without checking Oracle first.
