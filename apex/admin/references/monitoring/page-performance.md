# APEX Page Performance Profiler

Use this reference for the slowest APEX pages, regions, Page Performance reports, `APEX_WORKSPACE_PAGE_VIEW_DETAIL`, and `DBA_HIST_SQLSTAT` correlation.

For broad APEX application performance analysis, load `apex-performance-evidence.md` first to ask for available APEX, browser, AWR/ASH, SQL Monitor, and ORDS evidence and the output path for customer-specific results.

Version check: use `APEX_DICTIONARY` and `ALL_TAB_COLUMNS` before assuming page-view detail or activity-log view availability.

Use APEX Diff as a convenience helper to compare page-view, activity-log,
debug-message, and related monitoring views across APEX releases before
choosing standard monitoring calls, including current releases such as APEX
26.1 when they are listed there. Verify the target instance locally with
`APEX_DICTIONARY` and `ALL_TAB_COLUMNS` before generating final SQL:

```text
https://apexadb.oracle.com/ords/r/apexdiff/apex_diff/home
```

## Logging Pre-Check

Page-view detail logging can increase log volume and may capture sensitive context. Enable or increase it only for the affected application, workspace, or test window when possible.

```sql
SELECT owner,
       object_name,
       object_type
FROM all_objects
WHERE object_name IN (
          'APEX_WORKSPACE_ACTIVITY_LOG',
          'APEX_ACTIVITY_LOG',
          'APEX_WORKSPACE_PAGE_VIEWS',
          'APEX_WORKSPACE_PAGE_VIEW_DETAIL',
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
          'APEX_WORKSPACE_ACTIVITY_LOG',
          'APEX_ACTIVITY_LOG',
          'APEX_WORKSPACE_PAGE_VIEWS',
          'APEX_WORKSPACE_PAGE_VIEW_DETAIL',
          'APEX_DEBUG_MESSAGES')
ORDER BY table_name,
         column_id;
```

## Slowest Pages

```sql
SELECT workspace,
       application_id,
       application_name,
       page_id,
       page_name,
       COUNT(*) AS page_events,
       COUNT(DISTINCT apex_session_id) AS apex_sessions,
       ROUND(AVG(elapsed_time), 3) AS avg_elapsed_seconds,
       ROUND(PERCENTILE_CONT(0.95)
             WITHIN GROUP (ORDER BY elapsed_time), 3) AS p95_elapsed_seconds,
       MAX(elapsed_time) AS max_elapsed_seconds,
       MIN(view_date) AS first_seen,
       MAX(view_date) AS last_seen
FROM apex_workspace_activity_log
WHERE view_date >= SYSDATE - 1
GROUP BY workspace,
         application_id,
         application_name,
         page_id,
         page_name
HAVING COUNT(*) >= 10
ORDER BY p95_elapsed_seconds DESC
FETCH FIRST 20 ROWS ONLY;
```

Use APEX Builder Page Performance reports or narrow SQL/CSV extracts of page, region, elapsed time, session, `DEBUG_PAGE_VIEW_ID`, and timestamp metadata. Do not export debug CLOBs, request values, item payloads, or file payloads unless explicitly confirmed.

## DB Skill Usage

If the user provides AWR, ASH, SQL Monitor, execution plans, `DBA_HIST_SQLSTAT`, wait-event output, `V$` output, or ORDS runtime diagnostics, ask before switching to the DB skill. Do not interpret that evidence inside this APEX monitoring reference, and do not reuse the APEX admin connection for live DB-skill work unless the DB skill explicitly accepts it.

Use this handoff only after confirmation:

```text
DB skill in use: db/monitoring/top-sql-queries.md or db/performance/awr-reports.md for generic database performance interpretation. The APEX monitoring skill is being used for page, region, session, request, and time-window context.
```

After this handoff, use the selected DB skill's required connection/user, such as a diagnostics/performance account for `DBA_HIST_SQLSTAT`, AWR, ASH, `V$`, SQL Monitor, or execution-plan evidence.

AWR, ASH, and `DBA_HIST_SQLSTAT` require Diagnostics Pack in production.
