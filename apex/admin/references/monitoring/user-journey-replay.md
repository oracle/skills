# End-To-End User Journey Replay

Use this reference for reproducing critical APEX paths with Session Replay and `APEX_ACTIVITY_LOG`.

Version check: use `APEX_DICTIONARY` and `ALL_TAB_COLUMNS` before assuming Session Replay, activity-log, debug, or page-view detail availability.

## Replay Pre-Check

Session Replay availability, retention, and exposed metadata vary by APEX release and instance configuration. Use App Builder reports when replay is not exposed through supported SQL views.

```sql
SELECT view_name,
       comments
FROM apex_dictionary
WHERE view_name LIKE '%ACTIVITY%LOG%'
   OR view_name LIKE '%DEBUG%MESSAGE%'
   OR view_name LIKE '%PAGE%VIEW%'
   OR view_name LIKE '%REPLAY%'
ORDER BY view_name;
```

```sql
SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name IN (
          'APEX_ACTIVITY_LOG',
          'APEX_WORKSPACE_ACTIVITY_LOG',
          'APEX_DEBUG_MESSAGES',
          'APEX_WORKSPACE_PAGE_VIEW_DETAIL')
ORDER BY table_name,
         column_id;
```

## Journey Path Reconstruction

```sql
SELECT view_date,
       apex_user,
       apex_session_id,
       application_id,
       application_name,
       page_id,
       page_name,
       page_view_type,
       request_value,
       elapsed_time,
       rows_queried,
       debug_page_view_id,
       ecid,
       CASE WHEN error_message IS NOT NULL THEN 'Y' ELSE 'N' END AS has_error
FROM apex_activity_log
WHERE apex_session_id = :apex_session_id
ORDER BY view_date,
         id;
```

Compare one failed session with one successful baseline from the same application version and similar data shape. Capture correlation metadata only: APEX session, user, page, request, `DEBUG_PAGE_VIEW_ID`, ECID, timestamp window, and timing/error summary.

## Replay Safety

- Do not export Session Replay output unless privacy handling and incident need are confirmed.
- Reproduce destructive, externally visible, payment, email, notification, approval, or workflow actions in non-production first.
- Treat missing steps as evidence: branches, authorization failures, validations, AJAX callbacks, redirects, or expired sessions can remove expected page views.

## DB Skill Usage

DB skill in use: `db/performance/ash-analysis.md`, `db/performance/awr-reports.md`, and `db/performance/wait-events.md` for generic ASH/AWR and wait-event interpretation. The APEX monitoring skill is being used for Session Replay, activity-log path, and journey reproduction context.

After a DB-skill handoff, use the selected DB performance skill's required connection/user, such as a diagnostics/performance account for AWR, ASH, `DBA_HIST`, `V$`, SQL Monitor, or wait-event evidence. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.

AWR and ASH require Diagnostics Pack in production.
