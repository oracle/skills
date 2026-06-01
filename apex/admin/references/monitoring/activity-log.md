# APEX Activity Log Triage

Use this reference for `APEX_WORKSPACE_ACTIVITY_LOG`, `APEX_ACTIVITY_LOG`, usage/load trends, session drilldown, and Team Development file context.

For broad APEX application performance analysis, load `apex-performance-evidence.md` first to ask for available APEX, browser, AWR/ASH, SQL Monitor, and ORDS evidence and the output path for customer-specific results.

## View Pre-Check

APEX view columns vary by release and privilege. Inspect availability before version-specific SQL.

Use APEX Diff as a convenience helper to compare activity-log, Team
Development, and related standard APEX views across releases before choosing
monitoring calls, including current releases such as APEX 26.1 when they are
listed there. Verify the installed target locally with `APEX_DICTIONARY`,
`ALL_OBJECTS`, and `ALL_TAB_COLUMNS`:

```text
https://apexadb.oracle.com/ords/r/apexdiff/apex_diff/home
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
          'APEX_TEAM_DEV_FILES')
ORDER BY table_name,
         column_id;
```

```sql
SELECT owner,
       object_name,
       object_type
FROM all_objects
WHERE object_name IN (
          'APEX_WORKSPACE_ACTIVITY_LOG',
          'APEX_ACTIVITY_LOG',
          'APEX_TEAM_DEV_FILES')
ORDER BY object_name,
         owner;
```

## Usage And Load Trends

Group by workspace and application first, then drill into pages after identifying the noisy application.

```sql
SELECT TRUNC(view_date, 'HH24') AS hour_start,
       workspace,
       application_id,
       application_name,
       COUNT(*) AS page_events,
       COUNT(DISTINCT apex_session_id) AS apex_sessions,
       ROUND(AVG(elapsed_time), 3) AS avg_elapsed_seconds,
       ROUND(PERCENTILE_CONT(0.95)
             WITHIN GROUP (ORDER BY elapsed_time), 3) AS p95_elapsed_seconds,
       MAX(elapsed_time) AS max_elapsed_seconds
FROM apex_workspace_activity_log
WHERE view_date >= SYSDATE - 1
GROUP BY TRUNC(view_date, 'HH24'),
         workspace,
         application_id,
         application_name
ORDER BY hour_start,
         page_events DESC;
```

## Session Drilldown

Use this when a user reports one bad session. Avoid selecting request payloads or sensitive item values by default.

```sql
SELECT view_date,
       workspace,
       apex_user,
       apex_session_id,
       application_id,
       page_id,
       page_name,
       page_view_type,
       request_value,
       elapsed_time,
       rows_queried,
       error_message
FROM apex_workspace_activity_log
WHERE apex_session_id = :apex_session_id
ORDER BY view_date,
         id;
```

Look for latency jumps, AJAX storms, repeated authentication callbacks, missing expected page steps, and component errors.

## Team Development File Context

Use `APEX_TEAM_DEV_FILES` only as optional developer-artifact context. Inspect columns before selecting from it. Do not select file BLOB/CLOB payloads during triage.

## DB Skill Usage

If the user provides AWR, ASH, wait-event output, SQL Monitor, execution plans, `V$`/`DBA_HIST` evidence, or ORDS runtime diagnostics after the APEX workspace, application, page, session, and time window are identified, ask before switching to the DB skill. Do not interpret generic DB evidence inside this APEX activity-log reference, and do not reuse the APEX admin connection for live DB-skill work unless the DB skill explicitly accepts it.

Use this handoff only after confirmation:

```text
DB skill in use: db/performance/wait-events.md, db/performance/ash-analysis.md, or db/performance/awr-reports.md for generic database performance interpretation. The APEX monitoring skill is being used for activity-log context.
```

After this handoff, use the selected DB performance skill's required connection/user, such as a diagnostics/performance account for AWR, ASH, `DBA_HIST`, `V$`, SQL Monitor, or execution-plan evidence.
