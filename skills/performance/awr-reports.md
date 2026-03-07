# AWR Reports — Automatic Workload Repository

## Overview

The Automatic Workload Repository (AWR) is Oracle's built-in performance data collection and analysis framework. It automatically captures snapshots of performance statistics at regular intervals (default: every 60 minutes) and stores them in the SYSAUX tablespace. AWR data is the foundation for diagnosing performance problems, understanding workload trends, and validating the impact of tuning changes.

AWR reports compare two snapshots and summarize the activity between them. They are the first tool most DBAs reach for when investigating a performance incident.

**Licensing Note:** AWR is part of the Oracle Diagnostics Pack. It requires a license in addition to the base database license. Verify your license before using AWR in production.

---

## Key Concepts

### Snapshots

A snapshot is a point-in-time capture of all cumulative statistics from V$ views (db block gets, parse counts, wait event totals, etc.). The AWR report computes deltas between two snapshots to show activity during the interval.

- Default retention: 8 days
- Default interval: 60 minutes
- Stored in: `SYSAUX` tablespace under the `SYS` schema (WRM$ and WRH$ tables)

### DB Time

**DB Time** is the single most important metric in an AWR report. It represents the total elapsed time spent by all foreground sessions executing database calls (including wait time). It does NOT include idle wait time.

```
DB Time = CPU Time + Non-Idle Wait Time
```

If DB Time per second exceeds the number of CPUs, you have a capacity or efficiency problem.

### Elapsed Time

The wall-clock duration of the snapshot interval. Dividing DB Time by Elapsed Time gives the average number of active sessions (AAS):

```
AAS = DB Time (seconds) / Elapsed Time (seconds)
```

An AAS near or above your CPU count often signals saturation.

---

## Snapshot Management with DBMS_WORKLOAD_REPOSITORY

### Create a Manual Snapshot

```sql
-- Create a snapshot immediately (useful before/after a change)
EXEC DBMS_WORKLOAD_REPOSITORY.CREATE_SNAPSHOT();

-- Verify it was created
SELECT snap_id, begin_interval_time, end_interval_time
FROM   dba_hist_snapshot
ORDER  BY snap_id DESC
FETCH  FIRST 5 ROWS ONLY;
```

### Modify AWR Settings

```sql
-- Change interval to 30 minutes, retain 14 days
BEGIN
  DBMS_WORKLOAD_REPOSITORY.MODIFY_SNAPSHOT_SETTINGS(
    retention => 14 * 24 * 60,  -- minutes
    interval  => 30             -- minutes
  );
END;
/

-- Check current settings
SELECT snap_interval, retention
FROM   dba_hist_wr_control;
```

### Drop Snapshots

```sql
-- Drop snapshots in a range to reclaim SYSAUX space
BEGIN
  DBMS_WORKLOAD_REPOSITORY.DROP_SNAPSHOT_RANGE(
    low_snap_id  => 100,
    high_snap_id => 150
  );
END;
/
```

### Find Snapshot IDs for a Time Window

```sql
SELECT snap_id,
       TO_CHAR(begin_interval_time, 'YYYY-MM-DD HH24:MI') AS begin_time,
       TO_CHAR(end_interval_time,   'YYYY-MM-DD HH24:MI') AS end_time
FROM   dba_hist_snapshot
WHERE  begin_interval_time >= SYSDATE - 1
ORDER  BY snap_id;
```

---

## Generating AWR Reports

### Text Report (SQL*Plus)

```sql
-- Interactive: prompts for snap IDs and instance
@$ORACLE_HOME/rdbms/admin/awrrpt.sql

-- Non-interactive using the PL/SQL function directly
SELECT output
FROM   TABLE(
         DBMS_WORKLOAD_REPOSITORY.AWR_REPORT_TEXT(
           l_dbid      => (SELECT dbid FROM v$database),
           l_inst_num  => 1,
           l_bid       => 200,   -- begin snap ID
           l_eid       => 201    -- end snap ID
         )
       );
```

### HTML Report (preferred for readability)

```sql
SELECT output
FROM   TABLE(
         DBMS_WORKLOAD_REPOSITORY.AWR_REPORT_HTML(
           l_dbid      => (SELECT dbid FROM v$database),
           l_inst_num  => 1,
           l_bid       => 200,
           l_eid       => 201
         )
       );
```

### RAC Global AWR Report

```sql
@$ORACLE_HOME/rdbms/admin/awrgrpt.sql
```

### Compare Period Report (baseline vs. current)

```sql
@$ORACLE_HOME/rdbms/admin/awrddrpt.sql
```

---

## Reading Key Sections

### 1. Report Header

Confirms the database version, instance name, host, CPUs, and the snapshot window. Always verify these match your target environment before drawing conclusions.

### 2. Load Profile

Shows per-second and per-transaction rates for key metrics:

| Metric | What it Means |
|---|---|
| DB Time(s) | Average active sessions (divide by elapsed seconds) |
| DB CPU(s) | CPU actually consumed per second |
| Redo size | Write-heavy workload indicator |
| Logical reads | Buffer cache I/O |
| Block changes | DML activity |
| Physical reads | Actual disk I/O |
| Hard parses | Cursor reuse problems |
| Parses | Total parse calls (hard + soft) |
| Logons | Connection churn |

**Hard parse rate above 100/sec** almost always indicates missing bind variables or connection pool issues.

```sql
-- Validate hard parse rates from AWR history
SELECT snap_id,
       hard_parses,
       hard_parses / elapsed_time_delta * 1e6 AS hard_parses_per_sec
FROM (
  SELECT snap_id,
         value                                                   AS hard_parses,
         LAG(value) OVER (ORDER BY snap_id)                     AS prev_val,
         (end_interval_time - begin_interval_time) * 86400      AS elapsed_time_delta
  FROM   dba_hist_sysstat s
  JOIN   dba_hist_snapshot sn USING (snap_id, dbid, instance_number)
  WHERE  stat_name = 'hard parses'
    AND  snap_id BETWEEN 200 AND 220
)
WHERE prev_val IS NOT NULL;
```

### 3. Instance Efficiency Percentages

| Metric | Target | Concern If |
|---|---|---|
| Buffer Cache Hit % | > 95% | < 90% |
| Library Cache Hit % | > 99% | < 95% |
| In-memory Sort % | > 95% | < 90% |
| Soft Parse % | > 95% | < 90% |
| Execute to Parse % | > 50% | Very low value |

**Buffer Nowait %** and **Redo Nowait %** should both be near 100%.

### 4. Top 10 Foreground Wait Events

This section lists the events consuming the most DB Time. Focus on non-idle events:

```
Event                           Waits    Time(s)  Avg wait  % DB time
------------------------------- -------- -------- --------- ---------
db file sequential read         450,321  1,823.4     4.05ms    18.2%
log file sync                    89,234    412.1     4.62ms     4.1%
buffer busy waits                12,456    234.5    18.83ms     2.3%
```

Events to watch:

| Event | Typical Cause |
|---|---|
| `db file sequential read` | Single-block I/O; index scans, row fetch |
| `db file scattered read` | Full table/index scans (multiblock reads) |
| `log file sync` | COMMIT frequency; redo log I/O |
| `buffer busy waits` | Hot blocks; segment header contention |
| `enq: TX - row lock contention` | Row-level locking; application design |
| `library cache: mutex X` | Hard parsing; cursor sharing issues |
| `latch: cache buffers chains` | Hot blocks in buffer cache |

### 5. SQL Statistics

AWR breaks down Top SQL into several sub-sections:

- **SQL ordered by Elapsed Time** — best starting point
- **SQL ordered by CPU Time** — CPU-heavy queries
- **SQL ordered by Gets** — logical I/O heavy
- **SQL ordered by Reads** — physical I/O heavy
- **SQL ordered by Executions** — frequency; even cheap SQL can matter at scale
- **SQL ordered by Parse Calls** — cursor reuse problems

For each SQL entry, note the SQL ID, executions, elapsed time per execution, and the first few lines of the SQL text.

```sql
-- Pull top SQL from AWR history programmatically
SELECT sql_id,
       ROUND(elapsed_time_total / 1e6, 2)          AS total_elapsed_sec,
       executions_total,
       ROUND(elapsed_time_total / NULLIF(executions_total,0) / 1e6, 4) AS avg_elapsed_sec,
       SUBSTR(sql_text, 1, 80)                      AS sql_text
FROM   dba_hist_sqlstat
JOIN   dba_hist_sqltext USING (sql_id, dbid)
WHERE  snap_id BETWEEN 200 AND 201
ORDER  BY elapsed_time_total DESC
FETCH  FIRST 20 ROWS ONLY;
```

### 6. Segments Statistics

Shows which segments are consuming the most I/O and buffer gets. Useful for identifying hot tables and indexes.

### 7. Dictionary Cache and Library Cache

High miss ratios here indicate shared pool pressure.

```sql
-- Current library cache performance
SELECT namespace,
       gets,
       gethits,
       ROUND(gethitratio * 100, 2) AS hit_pct,
       pins,
       pinhits,
       ROUND(pinhitratio * 100, 2) AS pin_hit_pct,
       reloads,
       invalidations
FROM   v$librarycache
ORDER  BY gets DESC;

-- Dictionary cache misses (should be < 2%)
SELECT parameter,
       gets,
       getmisses,
       ROUND(getmisses / NULLIF(gets,0) * 100, 2) AS miss_pct
FROM   v$rowcache
WHERE  gets > 0
ORDER  BY getmisses DESC
FETCH  FIRST 15 ROWS ONLY;
```

---

## Identifying Bottlenecks from AWR

### CPU Bound

- DB CPU close to or exceeding DB Time
- High Parse CPU, high execute CPU
- Check for full table scans, missing indexes, inefficient SQL

### I/O Bound

- `db file sequential read` or `db file scattered read` near top of wait events
- High physical reads in Load Profile
- Investigate Top SQL by Reads; consider indexes, storage optimization

### Contention Bound

- `buffer busy waits`, `enq:` waits, latch waits dominate
- Often application design issues (hot sequences, reverse-key index needs)

### Memory Pressure

- High soft parse miss, library cache misses > 1%
- `free buffer waits` appearing in wait events (buffer cache too small)
- High `paged-in` values in OS stats section

### Redo / Commit Overhead

- `log file sync` in top wait events
- High Redo size per second in Load Profile
- Consider async commit, batching commits, or faster storage

---

## AWR Baselines

Baselines preserve snapshot ranges so they are not subject to normal retention purging. They enable period comparison reports.

```sql
-- Create a fixed baseline
BEGIN
  DBMS_WORKLOAD_REPOSITORY.CREATE_BASELINE(
    start_snap_id => 200,
    end_snap_id   => 210,
    baseline_name => 'PRE_PATCH_BASELINE',
    expiration    => 30  -- days; NULL = never expire
  );
END;
/

-- List existing baselines
SELECT baseline_name, start_snap_id, end_snap_id, expiration
FROM   dba_hist_baseline;

-- Drop a baseline
BEGIN
  DBMS_WORKLOAD_REPOSITORY.DROP_BASELINE(
    baseline_name => 'PRE_PATCH_BASELINE',
    cascade       => FALSE  -- TRUE also drops the snapshots
  );
END;
/
```

---

## Best Practices

- **Always take a snapshot before and after any change** (patch, schema change, parameter change) so you can generate a precise before/after report.
- **Use the HTML report** for interactive analysis; the text version is useful for automated parsing.
- **Focus on DB Time contribution**, not absolute wait counts. An event with millions of waits but tiny elapsed time is not your problem.
- **Correlate AWR with OS stats.** CPU utilization, memory paging, and disk I/O from the OS section can confirm or contradict in-database metrics.
- **Increase retention for critical systems** to at least 30 days. Keep baselines for major milestones (before/after upgrades).
- **Do not run AWR snapshots too frequently** (< 15 minutes) on busy systems; it adds overhead to SYSAUX writes.
- **Monitor SYSAUX space.** AWR data grows with retention and snapshot frequency. Query `v$sysaux_occupants` to see AWR's footprint.

```sql
-- Check AWR space usage in SYSAUX
SELECT occupant_name,
       schema_name,
       ROUND(space_usage_kbytes / 1024, 2) AS space_mb
FROM   v$sysaux_occupants
WHERE  occupant_name LIKE 'SM/%'
ORDER  BY space_usage_kbytes DESC;
```

---

## Common Mistakes

| Mistake | Problem | Correction |
|---|---|---|
| Comparing snapshots across DST change | Elapsed time appears wrong | Note timezone transitions; use UTC-based timestamps |
| Analyzing a 1-hour snapshot for a 5-minute spike | Spike is diluted | Capture a targeted manual snapshot; use ASH for sub-minute analysis |
| Ignoring the "per transaction" column | Misses workload characterization changes | Compare both per-second and per-transaction rates |
| Focusing on wait count, not wait time | Misleading conclusions | Always use Time(s) column as primary sort |
| Not checking SQL execution count | A "slow" SQL may run 1 million times cheaply | Multiply avg elapsed × executions for total impact |
| Treating Buffer Cache Hit % as gospel | A 99% hit ratio can still have I/O problems if the workload is huge | Check physical reads per second in absolute terms |
| Using AWR for sub-minute incidents | Insufficient granularity | Use ASH (V$ACTIVE_SESSION_HISTORY) for real-time drilldown |

---

## Sources

- [Oracle Database 19c Performance Tuning Guide (TGDBA)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgdba/)
- [DBMS_WORKLOAD_REPOSITORY — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_WORKLOAD_REPOSITORY.html)
- [DBA_HIST_SNAPSHOT — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_HIST_SNAPSHOT.html)
- [DBA_HIST_WR_CONTROL — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_HIST_WR_CONTROL.html)
- [DBA_HIST_SQLSTAT — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_HIST_SQLSTAT.html)
- [V$LIBRARYCACHE — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-LIBRARYCACHE.html)
- [V$ROWCACHE — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-ROWCACHE.html)
