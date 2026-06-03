# APEX Workspace Resource Governance

Use this workflow when reviewing workspace limits, storage pressure, request ceilings, active session counts, or whether a workspace quota should be adjusted. Keep this topic focused on APEX workspace limits and governance context. For Generative AI token limits, remaining tokens, AI service utilization, or token consumption per application, route to `../monitoring/ai-token-monitoring.md`.

DB skill in use: `db/performance/ash-analysis.md`, `db/performance/awr-reports.md`, `db/performance/wait-events.md`, and `db/monitoring/space-management.md` for generic CPU, I/O, wait-event, AWR/ASH, and tablespace analysis. The APEX workspace skill is being used for workspace quota, schema mapping, file-storage, and Resource Manager context.

After a DB-skill handoff, use the selected DB skill's required connection/user, such as a diagnostics/performance account for AWR, ASH, `DBA_HIST`, `V$`, and wait-event evidence or a storage/DB administration identity for tablespace analysis. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.

## Quota Source Pre-Check

`APEX_WORKSPACE_QUOTAS` may not exist in every APEX release or managed environment. Check available views and columns first.

Version check: use `APEX_DICTIONARY` and `ALL_TAB_COLUMNS` before assuming workspace quota, schema, or Resource Manager metadata columns.

```sql
SELECT owner,
       object_name,
       object_type
FROM all_objects
WHERE object_name IN (
          'APEX_WORKSPACE_QUOTAS',
          'APEX_WORKSPACES',
          'APEX_WORKSPACE_SCHEMAS')
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
          'APEX_WORKSPACE_QUOTAS',
          'APEX_WORKSPACES',
          'APEX_WORKSPACE_SCHEMAS')
ORDER BY table_name,
         column_id;
```

## APEX Governance Checks

Use `APEX_WORKSPACES` and supported quota views to review file storage, session/request ceilings, application counts, and Resource Manager mapping. Columns such as `FILE_STORAGE_MAX` and `RM_CONSUMER_GROUP` are version-dependent; inspect columns first.

Generative AI token limits are separate governance signals. Use `../monitoring/ai-token-monitoring.md` for AI service, workspace, provider, and app-level token questions instead of treating AI tokens as storage, session, or Resource Manager quota.

Do not treat database CPU/I/O pressure as a quota problem without mapped-schema and time-window evidence. Use APEX workspace/application/page context to choose a time window, then use the DB skills for generic resource analysis.

## Recommendations

- Adjust APEX workspace quotas only after identifying whether pressure comes from APEX file storage, parsing-schema segment growth, sessions, requests, or database CPU/I/O.
- Do not increase quotas to hide application design issues such as large file uploads, excessive debug logging, or inefficient report downloads.
- Mark AWR/ASH/Diagnostics Pack constraints before using historical DB performance views.
