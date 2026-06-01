# APEX Error Handling And Logging

Use this reference for collecting, categorizing, and prioritizing APEX errors from `APEX_DEBUG_MESSAGES`, `APEX_ERROR_LOG`, and APEX activity logs.

Version check: use `ALL_OBJECTS` and `ALL_TAB_COLUMNS` before assuming APEX debug, activity, or error-log view availability.

## Error Log Pre-Check

```sql
SELECT owner,
       object_name,
       object_type
FROM all_objects
WHERE object_name IN (
          'APEX_WORKSPACE_ACTIVITY_LOG',
          'APEX_ACTIVITY_LOG',
          'APEX_DEBUG_MESSAGES',
          'APEX_ERROR_LOG')
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
          'APEX_DEBUG_MESSAGES',
          'APEX_ERROR_LOG')
ORDER BY table_name,
         column_id;
```

If `APEX_ERROR_LOG` is missing, use `APEX_WORKSPACE_ACTIVITY_LOG`, `APEX_DEBUG_MESSAGES`, App Builder error reports, ORDS/web-server logs, and application-specific error tables. Do not query internal APEX repository tables as a workaround.

## Collection And Priority

```sql
SELECT workspace,
       application_id,
       application_name,
       page_id,
       page_name,
       error_on_component_type,
       error_on_component_name,
       COUNT(*) AS error_events,
       COUNT(DISTINCT apex_session_id) AS affected_sessions,
       COUNT(DISTINCT apex_user) AS affected_users,
       MIN(view_date) AS first_seen,
       MAX(view_date) AS last_seen,
       SUBSTR(MIN(error_message), 1, 300) AS sample_error
FROM apex_workspace_activity_log
WHERE view_date >= SYSDATE - 1
  AND error_message IS NOT NULL
GROUP BY workspace,
         application_id,
         application_name,
         page_id,
         page_name,
         error_on_component_type,
         error_on_component_name
ORDER BY error_events DESC,
         affected_sessions DESC,
         last_seen DESC;
```

Classify errors as authentication/authorization, validation/business rule, SQL/PLSQL, ORDS/REST/integration, timeout/performance, or internal/unhandled. Prioritize by production impact, affected users/sessions, recency, security risk, data-loss risk, and critical workflow impact.

## Debug Correlation

```sql
SELECT message_timestamp,
       application_id,
       page_id,
       session_id,
       debug_page_view_id,
       message_level,
       message_type,
       component_type,
       component_name,
       SUBSTR(message, 1, 300) AS message_sample
FROM apex_debug_messages
WHERE message_timestamp >= :apex_start_time
  AND message_timestamp <  :apex_end_time
  AND (:application_id IS NULL OR application_id = :application_id)
  AND (:debug_page_view_id IS NULL OR debug_page_view_id = :debug_page_view_id)
ORDER BY message_timestamp;
```

Prefer `DEBUG_PAGE_VIEW_ID`, `APEX_SESSION_ID`, ECID, application/page/component, and timestamp window. Avoid verbose production debug unless scoped and temporary.

## Quick Fix Patterns

- Missing grant, synonym, or invalid object: confirm parsing schema and least-privilege object grants.
- Bad bind or item conversion: align APEX item type, format mask, NLS assumptions, and database column type.
- Unhandled process exception: log correlation metadata and return a safe user-facing message.
- Auth/authz misconfiguration: review authorization scheme placement, public pages, and session state protection.
- REST credential/token expiry: rotate via APEX Web Credentials; never print credential values or bearer tokens.
- Timeout from slow SQL or remote call: narrow APEX page/component/time window first.

## DB Skill Usage

DB skill in use: `db/security/auditing.md` for generic database audit trails. DB skill in use: `db/performance/awr-reports.md` and `db/performance/ash-analysis.md` for AWR/ASH correlation. DB skill in use: `db/monitoring/alert-log-analysis.md` for database alert log, trace, and ADR investigation. The APEX monitoring skill is being used for APEX debug/error context and incident time-window selection.

After a DB-skill handoff, use the selected DB skill's required connection/user. Do not reuse the APEX admin connection for live AWR, ASH, `V$`, `DBA_HIST`, alert-log, trace, ADR, audit-policy, or grant investigation unless the DB skill explicitly accepts that identity.

AWR and ASH require Diagnostics Pack in production.
