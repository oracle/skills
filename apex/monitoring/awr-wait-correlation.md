# APEX Cross-Check With AWR Wait Events

Use this reference only after APEX activity has identified the workspace, application, page, and time window.

## Scope

APEX activity chooses the incident window. Generic AWR, ASH, and wait-event interpretation belongs to DB performance skills.

DB skill in use: `db/performance/wait-events.md`, `db/performance/ash-analysis.md`, or `db/performance/awr-reports.md` for generic database wait-event, ASH, and AWR interpretation. The APEX monitoring skill is being used for choosing the APEX time window and correlating it with database symptoms.

## Historical Wait Cross-Check

```sql
WITH snaps AS (
    SELECT snap_id,
           dbid,
           instance_number,
           begin_interval_time,
           end_interval_time
    FROM dba_hist_snapshot
    WHERE begin_interval_time >= SYSTIMESTAMP - INTERVAL '1' DAY
),
waits AS (
    SELECT s.begin_interval_time,
           s.end_interval_time,
           e.instance_number,
           e.wait_class,
           e.event_name,
           e.total_waits,
           e.time_waited_micro
             - LAG(e.time_waited_micro) OVER (
                   PARTITION BY e.dbid, e.instance_number, e.event_id
                   ORDER BY e.snap_id) AS waited_micro_delta
    FROM dba_hist_system_event e
    JOIN snaps s
      ON s.snap_id = e.snap_id
     AND s.dbid = e.dbid
     AND s.instance_number = e.instance_number
    WHERE e.wait_class <> 'Idle'
)
SELECT begin_interval_time,
       end_interval_time,
       instance_number,
       wait_class,
       event_name,
       ROUND(waited_micro_delta / 1000000, 2) AS waited_seconds
FROM waits
WHERE waited_micro_delta > 0
ORDER BY begin_interval_time DESC,
         waited_seconds DESC
FETCH FIRST 50 ROWS ONLY;
```

## Guardrails

- AWR and ASH require Diagnostics Pack in production.
- Database waits during an APEX window are correlation evidence, not proof of a page or region root cause.
- Confirm with SQL ID, ECID, module/action, client identifier, APEX debug, Page Performance reports, or application instrumentation.
