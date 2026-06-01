# APEX REST Data Source Health Check

Use this reference for APEX REST Data Sources, Web Source Modules, REST Source Synchronization, `APEX_WEBSERVICE_LOG`, latency, HTTP status codes, and component impact.

Version check: use `APEX_DICTIONARY` and `ALL_TAB_COLUMNS` before assuming REST Data Source, Web Source, or webservice-log view availability.

## REST Source Inventory

```sql
SELECT view_name,
       comments
FROM apex_dictionary
WHERE view_name LIKE 'APEX%WEB%SRC%'
   OR view_name LIKE 'APEX%REST%SOURCE%'
   OR view_name LIKE 'APEX%WEBSERVICE%LOG%'
ORDER BY view_name;
```

```sql
SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name IN (
          'APEX_APPL_WEB_SRC_MODULES',
          'APEX_APPL_WEB_SRC_OPERATIONS',
          'APEX_APPL_WEB_SRC_PARAMETERS',
          'APEX_WEBSERVICE_LOG',
          'APEX_REST_SOURCE_SYNC_LOG')
ORDER BY table_name,
         column_id;
```

Do not print credentials, authorization headers, API keys, OAuth tokens, or full URLs with secrets.

## Latency And Error Codes

Use `APEX_WEBSERVICE_LOG` when available. Inspect installed columns before selecting status-code or elapsed-time fields.

```sql
SELECT application_id,
       module_id,
       module_name,
       operation_id,
       status_code,
       COUNT(*) AS calls,
       ROUND(AVG(elapsed_time), 3) AS avg_elapsed_seconds,
       MAX(elapsed_time) AS max_elapsed_seconds,
       MIN(request_date) AS first_seen,
       MAX(request_date) AS last_seen
FROM apex_webservice_log
WHERE request_date >= SYSTIMESTAMP - INTERVAL '1' DAY
GROUP BY application_id,
         module_id,
         module_name,
         operation_id,
         status_code
ORDER BY max_elapsed_seconds DESC;
```

Map symptoms back to APEX pages and components with `APEX_WORKSPACE_ACTIVITY_LOG`. Decide whether the issue is global to a remote service or isolated to a component, operation, parameter set, or page request.

## DB Skill Usage

DB skill in use: `db/ords/ords-monitoring.md` for generic ORDS monitoring and request/pool troubleshooting. DB skill in use: `db/performance/ash-analysis.md` and `db/performance/wait-events.md` for `DBA_HIST_ACTIVE_SESS_HISTORY`, `V$ACTIVE_SESSION_HISTORY`, wait-class, and network-wait interpretation. The APEX monitoring skill is being used for REST Data Source metadata, APEX webservice logs, and component impact.

After a DB/ORDS-skill handoff, use the selected skill's required connection/user, such as an ORDS/runtime administration identity for ORDS pool diagnostics or a diagnostics/performance account for ASH, `DBA_HIST`, `V$`, and wait-event evidence. Do not reuse the APEX admin connection unless the DB/ORDS skill explicitly accepts it.

ASH and `DBA_HIST_ACTIVE_SESS_HISTORY` require Diagnostics Pack in production.
