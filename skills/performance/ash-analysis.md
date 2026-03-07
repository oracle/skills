# ASH Analysis — Active Session History

## Overview

Active Session History (ASH) is Oracle's in-memory, sampled session activity repository. Every second, Oracle samples all sessions that are active (not idle) and records a row per active session into a circular in-memory buffer (`V$ACTIVE_SESSION_HISTORY`). The ASH data flushed to disk is stored in `DBA_HIST_ACTIVE_SESS_HISTORY` and retained as part of AWR.

ASH fills the critical gap between AWR (snapshot-level, coarse-grained) and real-time V$ views (current moment only). It enables retrospective, second-by-second analysis without requiring continuous monitoring.

**Licensing Note:** ASH is part of the Oracle Diagnostics Pack and requires a separate license beyond the base database license.

---

## Key Concepts

### Sampling Mechanics

- Oracle samples all active (non-idle) sessions **once per second**
- Each sample row captures: session ID, SQL ID, wait event, object accessed, user, module, action, plan hash value, blocking session, and more
- The in-memory buffer holds approximately **1 hour** of data (older data is flushed to disk)
- The disk-based `DBA_HIST_ACTIVE_SESS_HISTORY` retains a **1-in-10 subsample** of ASH data (every 10th second) for long-term retention

### AAS (Average Active Sessions)

The primary metric derived from ASH. Count the number of ASH rows in a time window and divide by the number of seconds:

```
AAS = COUNT(ash_rows) / seconds_in_window
```

AAS above your CPU count means the database is over-saturated. AAS broken down by wait class or event reveals where time is being spent.

### Session States

Each ASH row has a `SESSION_STATE`:
- `ON CPU` — the session was consuming CPU at sample time
- `WAITING` — the session was waiting on a specific event

The `WAIT_CLASS` and `EVENT` columns further classify waiting sessions.

---

## Core Views

### V$ACTIVE_SESSION_HISTORY (In-Memory, Real-Time)

Approximately the last hour of sampled data. Every row is a sample.

```sql
-- Schema preview
DESC v$active_session_history
```

Key columns:

| Column | Description |
|---|---|
| `SAMPLE_TIME` | Timestamp of the sample (1-second resolution) |
| `SESSION_ID` | SID of the sampled session |
| `SESSION_SERIAL#` | Serial number to uniquely identify session |
| `USER_ID` | Numeric user ID |
| `SQL_ID` | SQL being executed at sample time |
| `SQL_PLAN_HASH_VALUE` | Plan being used |
| `SESSION_STATE` | `ON CPU` or `WAITING` |
| `WAIT_CLASS` | Category of wait event |
| `EVENT` | Specific wait event name |
| `CURRENT_OBJ#` | Object being accessed |
| `CURRENT_FILE#` | Datafile number |
| `CURRENT_BLOCK#` | Block number (for I/O waits) |
| `BLOCKING_SESSION` | SID of the blocker (for lock waits) |
| `MODULE` | Application module name |
| `ACTION` | Application action name |
| `PROGRAM` | Client program name |
| `MACHINE` | Client machine name |
| `PGA_ALLOCATED` | PGA memory at sample time |
| `TEMP_SPACE_ALLOCATED` | Temp space at sample time |

### DBA_HIST_ACTIVE_SESS_HISTORY (Disk-Based, Historical)

Same structure as `V$ACTIVE_SESSION_HISTORY` but with additional columns (`SNAP_ID`, `DBID`, `INSTANCE_NUMBER`) and a 10x reduction in sampling frequency.

---

## Real-Time ASH Analysis

### Current Activity Snapshot

```sql
-- What is happening right now (last 5 minutes)
SELECT event,
       COUNT(*) AS samples,
       ROUND(COUNT(*) / (5*60), 2) AS avg_active_sessions,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct_total
FROM   v$active_session_history
WHERE  sample_time > SYSDATE - 5/1440
  AND  session_type = 'FOREGROUND'
GROUP  BY event
ORDER  BY samples DESC;
```

### Top SQL by ASH (Last 30 Minutes)

```sql
SELECT ash.sql_id,
       COUNT(*)                                    AS samples,
       ROUND(COUNT(*) / (30*60), 2)               AS aas,
       SUBSTR(st.sql_text, 1, 80)                 AS sql_text
FROM   v$active_session_history ash
LEFT   JOIN v$sql st ON ash.sql_id = st.sql_id
WHERE  ash.sample_time > SYSDATE - 30/1440
  AND  ash.session_type = 'FOREGROUND'
GROUP  BY ash.sql_id, SUBSTR(st.sql_text, 1, 80)
ORDER  BY samples DESC
FETCH  FIRST 15 ROWS ONLY;
```

### Top SQL by Wait Class (Last Hour)

```sql
SELECT sql_id,
       wait_class,
       COUNT(*)                              AS samples,
       ROUND(COUNT(*) / 3600, 2)            AS aas
FROM   v$active_session_history
WHERE  sample_time > SYSDATE - 1/24
  AND  session_type = 'FOREGROUND'
  AND  wait_class != 'Idle'
GROUP  BY sql_id, wait_class
ORDER  BY samples DESC
FETCH  FIRST 20 ROWS ONLY;
```

### Active Session Trend (Per-Minute Breakdown)

```sql
-- AAS per minute for the last hour — spot the spike
SELECT TRUNC(sample_time, 'MI')           AS sample_minute,
       COUNT(*)                           AS samples,
       ROUND(COUNT(*) / 60, 2)           AS aas,
       SUM(CASE WHEN session_state = 'ON CPU' THEN 1 ELSE 0 END) AS cpu_samples,
       SUM(CASE WHEN session_state = 'WAITING' THEN 1 ELSE 0 END) AS wait_samples
FROM   v$active_session_history
WHERE  sample_time > SYSDATE - 1/24
  AND  session_type = 'FOREGROUND'
GROUP  BY TRUNC(sample_time, 'MI')
ORDER  BY sample_minute;
```

### Blocking Session Analysis

```sql
-- Find blocking chains from ASH
SELECT sample_time,
       session_id,
       blocking_session,
       event,
       sql_id,
       seconds_in_wait
FROM   v$active_session_history
WHERE  blocking_session IS NOT NULL
  AND  sample_time > SYSDATE - 30/1440
ORDER  BY sample_time DESC, seconds_in_wait DESC;
```

### Per-Session Activity

```sql
-- What was a specific session doing over the last hour?
SELECT sample_time,
       sql_id,
       session_state,
       event,
       wait_class,
       seconds_in_wait
FROM   v$active_session_history
WHERE  session_id     = :p_sid
  AND  session_serial# = :p_serial
  AND  sample_time > SYSDATE - 1/24
ORDER  BY sample_time;
```

---

## Historical ASH Analysis

For events older than ~1 hour, query `DBA_HIST_ACTIVE_SESS_HISTORY`. Remember that this view has 1/10th the resolution.

### Top Wait Events During a Past Incident

```sql
-- Analyze an incident window: e.g., 2:00 AM to 3:00 AM yesterday
SELECT event,
       wait_class,
       COUNT(*)                              AS samples,
       ROUND(COUNT(*) * 10 / 3600, 2)       AS approx_aas  -- multiply by 10 for 1-in-10 sample
FROM   dba_hist_active_sess_history
WHERE  sample_time BETWEEN
         TO_TIMESTAMP('2026-03-05 02:00:00', 'YYYY-MM-DD HH24:MI:SS')
         AND
         TO_TIMESTAMP('2026-03-05 03:00:00', 'YYYY-MM-DD HH24:MI:SS')
  AND  session_type = 'FOREGROUND'
  AND  wait_class  != 'Idle'
GROUP  BY event, wait_class
ORDER  BY samples DESC;
```

### Historical Top SQL

```sql
SELECT ash.sql_id,
       COUNT(*) * 10                                   AS approx_seconds,  -- adjust for 1-in-10
       ROUND(COUNT(*) * 10 / 3600, 2)                 AS aas,
       SUBSTR(sql.sql_text, 1, 100)                   AS sql_text
FROM   dba_hist_active_sess_history ash
JOIN   dba_hist_sqltext sql USING (sql_id, dbid)
WHERE  ash.sample_time BETWEEN
         TO_TIMESTAMP('2026-03-05 02:00:00', 'YYYY-MM-DD HH24:MI:SS')
         AND
         TO_TIMESTAMP('2026-03-05 03:00:00', 'YYYY-MM-DD HH24:MI:SS')
  AND  ash.session_type = 'FOREGROUND'
GROUP  BY ash.sql_id, SUBSTR(sql.sql_text, 1, 100)
ORDER  BY approx_seconds DESC
FETCH  FIRST 20 ROWS ONLY;
```

### Per-Object Hot Spot Analysis

```sql
-- Which objects (tables/indexes) were causing the most I/O waits?
SELECT o.owner,
       o.object_name,
       o.object_type,
       COUNT(*)           AS wait_samples
FROM   dba_hist_active_sess_history ash
JOIN   dba_objects o ON o.object_id = ash.current_obj#
WHERE  ash.sample_time > SYSDATE - 1
  AND  ash.wait_class = 'User I/O'
  AND  ash.current_obj# > 0
GROUP  BY o.owner, o.object_name, o.object_type
ORDER  BY wait_samples DESC
FETCH  FIRST 15 ROWS ONLY;
```

### Time-Series Breakdown by Wait Class

```sql
-- Stacked area chart data: activity breakdown per 5-minute bucket
SELECT TRUNC(sample_time, 'HH24') +
         FLOOR(TO_NUMBER(TO_CHAR(sample_time,'MI')) / 5) * 5 / 1440 AS bucket,
       wait_class,
       COUNT(*) * 10 AS approx_seconds
FROM   dba_hist_active_sess_history
WHERE  sample_time > SYSDATE - 7
  AND  session_type = 'FOREGROUND'
  AND  wait_class  != 'Idle'
GROUP  BY TRUNC(sample_time, 'HH24') +
            FLOOR(TO_NUMBER(TO_CHAR(sample_time,'MI')) / 5) * 5 / 1440,
          wait_class
ORDER  BY bucket, wait_class;
```

---

## ASH Report Generation

Oracle provides a built-in report script that produces a formatted ASH analysis report similar in style to AWR:

```sql
-- Interactive script (prompts for time range or snap IDs)
@$ORACLE_HOME/rdbms/admin/ashrpt.sql

-- Programmatic HTML report
SELECT output
FROM   TABLE(
         DBMS_WORKLOAD_REPOSITORY.ASH_REPORT_HTML(
           l_dbid       => (SELECT dbid FROM v$database),
           l_inst_num   => 1,
           l_btime      => TO_DATE('2026-03-05 02:00','YYYY-MM-DD HH24:MI'),
           l_etime      => TO_DATE('2026-03-05 03:00','YYYY-MM-DD HH24:MI')
         )
       );

-- Programmatic text report
SELECT output
FROM   TABLE(
         DBMS_WORKLOAD_REPOSITORY.ASH_REPORT_TEXT(
           l_dbid       => (SELECT dbid FROM v$database),
           l_inst_num   => 1,
           l_btime      => TO_DATE('2026-03-05 02:00','YYYY-MM-DD HH24:MI'),
           l_etime      => TO_DATE('2026-03-05 03:00','YYYY-MM-DD HH24:MI')
         )
       );
```

### ASH Report Key Sections

1. **Top User Events** — events consuming the most sampled time
2. **Top Background Events** — LGWR, DBWR, CKPT activity
3. **Top SQL with Top Events** — SQL ID ranked by sampled time, with associated waits
4. **Top SQL with Top Row Sources** — where in the plan the time was spent
5. **Top Sessions** — which sessions consumed the most time
6. **Top Objects/Files/Latches** — object-level hot spots
7. **Activity Over Time** — time-series view to identify when the problem started/ended

---

## Identifying Session-Level Bottlenecks

### Scenario: "User reports query was slow between 9:00 and 9:15 AM"

```sql
-- Step 1: Confirm activity spike
SELECT TRUNC(sample_time, 'MI') AS minute,
       COUNT(*)                 AS samples
FROM   dba_hist_active_sess_history
WHERE  sample_time BETWEEN
         TO_TIMESTAMP('2026-03-06 09:00:00','YYYY-MM-DD HH24:MI:SS')
         AND
         TO_TIMESTAMP('2026-03-06 09:15:00','YYYY-MM-DD HH24:MI:SS')
  AND  session_type = 'FOREGROUND'
GROUP  BY TRUNC(sample_time, 'MI')
ORDER  BY minute;

-- Step 2: Find the top SQL during the incident
SELECT sql_id, COUNT(*) AS samples
FROM   dba_hist_active_sess_history
WHERE  sample_time BETWEEN
         TO_TIMESTAMP('2026-03-06 09:00:00','YYYY-MM-DD HH24:MI:SS')
         AND
         TO_TIMESTAMP('2026-03-06 09:15:00','YYYY-MM-DD HH24:MI:SS')
  AND  session_type = 'FOREGROUND'
GROUP  BY sql_id
ORDER  BY samples DESC
FETCH  FIRST 10 ROWS ONLY;

-- Step 3: Find the user/session involved
SELECT session_id, user_id, module, action, program, machine,
       COUNT(*) AS samples
FROM   dba_hist_active_sess_history
WHERE  sql_id = :suspect_sql_id
  AND  sample_time BETWEEN
         TO_TIMESTAMP('2026-03-06 09:00:00','YYYY-MM-DD HH24:MI:SS')
         AND
         TO_TIMESTAMP('2026-03-06 09:15:00','YYYY-MM-DD HH24:MI:SS')
GROUP  BY session_id, user_id, module, action, program, machine
ORDER  BY samples DESC;

-- Step 4: Determine what the session was waiting on
SELECT event, COUNT(*) AS samples
FROM   dba_hist_active_sess_history
WHERE  sql_id = :suspect_sql_id
  AND  sample_time BETWEEN
         TO_TIMESTAMP('2026-03-06 09:00:00','YYYY-MM-DD HH24:MI:SS')
         AND
         TO_TIMESTAMP('2026-03-06 09:15:00','YYYY-MM-DD HH24:MI:SS')
GROUP  BY event
ORDER  BY samples DESC;
```

### Scenario: Finding the Root Blocker

```sql
-- Reconstruct a blocking chain from ASH
SELECT LPAD(' ', 2*(LEVEL-1)) || session_id AS session_tree,
       blocking_session,
       event,
       sql_id,
       sample_time
FROM   v$active_session_history
WHERE  sample_time > SYSDATE - 10/1440
START  WITH blocking_session IS NULL
       AND  session_state = 'WAITING'
       AND  wait_class   != 'Idle'
CONNECT BY PRIOR session_id = blocking_session
       AND PRIOR sample_time = sample_time
ORDER  SIBLINGS BY session_id;
```

---

## ASH vs AWR: When to Use Each

| Scenario | Use |
|---|---|
| Incident occurred in the last 60 minutes | `V$ACTIVE_SESSION_HISTORY` |
| Incident occurred up to 8-30 days ago | `DBA_HIST_ACTIVE_SESS_HISTORY` |
| Need second-by-second granularity | `V$ACTIVE_SESSION_HISTORY` |
| Need to understand overall workload trends | AWR report |
| Need to identify exactly which SQL was slow | ASH (SQL_ID per sample) |
| Need to prove a regression across releases | AWR compare-period report |
| Need < 10-second resolution for old data | Not possible; only in-memory ASH has 1s resolution |

---

## Best Practices

- **Annotate incidents with module/action.** When application code sets `DBMS_APPLICATION_INFO.SET_MODULE` and `SET_ACTION`, ASH data becomes vastly more useful for post-incident analysis.
- **Do not purge ASH data unnecessarily.** Since it samples 1-in-10 for disk storage, every row is precious for historical analysis.
- **Always filter `session_type = 'FOREGROUND'`** unless you specifically need background process analysis. Background waits often reflect system housekeeping rather than user-visible performance.
- **Account for the 10x multiplier** when comparing in-memory vs. disk-based ASH. `V$ACTIVE_SESSION_HISTORY` has all samples; `DBA_HIST` has 1/10th.
- **Combine with SQL execution plans.** Once you identify the top SQL_ID from ASH, use `DBMS_XPLAN.DISPLAY_AWR` (or `DISPLAY_WORKLOAD_REPOSITORY` in 23c+) to pull the historical plan.

```sql
-- Pull a historical execution plan for a SQL found in ASH
-- Note: DISPLAY_AWR is deprecated in Oracle 23c+; use DISPLAY_WORKLOAD_REPOSITORY for new code
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_AWR(
    sql_id        => 'abc123xyz',
    plan_hash_value => NULL,  -- NULL = show all plans
    db_id         => NULL,
    format        => 'TYPICAL'
  )
);
```

---

## Common Mistakes

| Mistake | Impact | Fix |
|---|---|---|
| Forgetting `session_type = 'FOREGROUND'` | Background process waits pollute results | Always add the filter |
| Not multiplying by 10 for `DBA_HIST` | AAS appears 10x lower than reality | Multiply count by 10 for disk-based data |
| Querying `DBA_HIST` for the last 5 minutes | Row may not be flushed yet | Use `V$ACTIVE_SESSION_HISTORY` for recent data |
| Treating every ASH sample as 1 second exactly | Sampling jitter exists (GC pauses, heavy load) | Use time-range aggregation, not per-row timing |
| Ignoring `CURRENT_OBJ#` for I/O waits | Miss the hot object | Join to `DBA_OBJECTS` to identify hot segments |
| Confusing `BLOCKING_SESSION` with root cause | Blocker may itself be blocked | Trace the full chain; the root is a session not waiting on another session |

---

## Sources

- [Oracle Database 19c Performance Tuning Guide (TGDBA)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgdba/)
- [V$ACTIVE_SESSION_HISTORY — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-ACTIVE_SESSION_HISTORY.html)
- [DBA_HIST_ACTIVE_SESS_HISTORY — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_HIST_ACTIVE_SESS_HISTORY.html)
- [DBMS_WORKLOAD_REPOSITORY — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_WORKLOAD_REPOSITORY.html)
- [DBMS_XPLAN — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_XPLAN.html)
