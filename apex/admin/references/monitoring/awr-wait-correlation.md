# APEX Cross-Check With AWR Wait Events

Use this reference only after APEX activity has identified the workspace, application, page, and time window.

For broad APEX application performance analysis, load `apex-performance-evidence.md` first to ask for available APEX, browser, AWR/ASH, SQL Monitor, and ORDS evidence and the output path for customer-specific results.

## Scope

APEX activity chooses the incident window. Generic AWR, ASH, and wait-event interpretation belongs to DB performance skills.

If the user attaches or references an AWR report, ASH extract, wait-event output, SQL Monitor report, execution plan, `V$`/`DBA_HIST` output, or ORDS pool/runtime diagnostics, stop before interpreting it and ask whether to switch to the relevant DB skill. Continue only after the user confirms. Use the selected DB skill's required connection/user for any live DB follow-up; do not reuse the APEX admin connection unless the DB skill explicitly accepts it.

Use this handoff only after confirmation:

```text
DB skill in use: db/performance/awr-reports.md, db/performance/ash-analysis.md, or db/performance/wait-events.md for generic database performance interpretation. The APEX monitoring skill is being used for choosing the APEX workspace, application, page, session, request, and time window.
```

After this handoff, use a diagnostics/performance account suitable for AWR, ASH, `DBA_HIST`, `V$`, SQL Monitor, or execution-plan evidence according to the selected DB skill.

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
