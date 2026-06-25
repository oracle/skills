# Interactive Report And Grid Tuning

Use this reference for APEX Interactive Report and Interactive Grid performance: filtering, sorting, pagination, downloads, report settings, SQL IDs, and AWR correlation.

Version check: use `APEX_DICTIONARY` and `ALL_TAB_COLUMNS` before assuming Interactive Report or Interactive Grid metadata view availability.

Use APEX Diff as a convenience helper to compare IR/IG metadata views and
standard APEX monitoring surfaces across releases before choosing metadata or
performance queries, including current releases such as APEX 26.1 when they are
listed there. Verify the installed target locally with `APEX_DICTIONARY`,
`ALL_OBJECTS`, and `ALL_TAB_COLUMNS`:

```text
https://apexadb.oracle.com/ords/r/apexdiff/apex_diff/home
```

## Region Metadata Pre-Check

```sql
SELECT owner,
       object_name,
       object_type
FROM all_objects
WHERE object_name IN (
          'APEX_APPLICATION_PAGE_REGIONS',
          'APEX_APPLICATION_PAGE_IR',
          'APEX_APPLICATION_PAGE_IR_COL',
          'APEX_APPL_PAGE_IGS',
          'APEX_APPL_PAGE_IG_COLUMNS',
          'APEX_WORKSPACE_ACTIVITY_LOG',
          'APEX_DEBUG_MESSAGES')
ORDER BY object_name,
         owner;
```

```sql
SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name IN (
          'APEX_APPLICATION_PAGE_REGIONS',
          'APEX_APPLICATION_PAGE_IR',
          'APEX_APPLICATION_PAGE_IR_COL',
          'APEX_APPL_PAGE_IGS',
          'APEX_APPL_PAGE_IG_COLUMNS')
ORDER BY table_name,
         column_id;
```

## Runtime Symptoms

Use activity logs to identify whether the pain is initial render, filtering, sorting, pagination, aggregation, save, or download.

Red flags:

- Filtering is slow only for wildcard, case-insensitive, or contains searches.
- Pagination is slow because the region query must sort or count a large rowset before returning the next page.
- Download is slow because it bypasses small-page pagination and exports a much larger result set.
- User-saved reports add expensive filters, control breaks, aggregates, highlights, or computations.

## APEX-Specific Checks

- Avoid unnecessary columns in IR/IG source SQL. Wide projections increase sort, download, network, and browser cost.
- Keep bind variable types aligned with table column types. APEX item values are strings; avoid implicit conversions.
- Prefer server-side filters with bind variables over concatenating item values into dynamic SQL.
- Limit download scope and require deliberate user action for large exports.
- For IG pages with DML, validate that any new index does not make saves unacceptably slow.

## DB Skill Usage

DB skill in use: `db/sql-dev/sql-tuning.md` for generic SQL tuning. DB skill in use: `db/performance/index-strategy.md` for index design. DB skill in use: `db/monitoring/top-sql-queries.md` for SQL IDs and `DBA_HIST_SQLSTAT`. DB skill in use: `db/performance/awr-reports.md` for AWR interpretation. The APEX monitoring skill is being used for IR/IG behavior, report settings, request patterns, and APEX page context.

After a DB-skill handoff, use the selected DB skill's required connection/user, such as a diagnostics/performance account for AWR, ASH, `DBA_HIST`, `V$`, SQL Monitor, or execution-plan evidence and a schema/object owner or scoped tuning identity when the DB tuning skill requires object-level inspection. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.

AWR, ASH, and `DBA_HIST_SQLSTAT` require Diagnostics Pack in production.
