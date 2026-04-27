# Top SQL Queries and SQL Monitoring

## Overview

Identifying and tuning the most resource-intensive SQL statements is one of the highest-leverage activities a DBA can perform. A single poorly-written query can consume 90% of the CPU on a busy system, and addressing it can deliver performance improvements that affect every user. Oracle provides multiple views and tools for finding these queries—from the real-time `V$SQL` and `V$SQLAREA` views to the historical Automatic Workload Repository (AWR) tables like `DBA_HIST_SQLSTAT`.

This guide covers the key views for finding top SQL by various resource dimensions, AWR-based historical analysis, and the real-time SQL monitoring feature (`V$SQL_MONITOR`) that provides execution-level visibility into long-running queries.

---

## Key Views: V$SQL and V$SQLAREA

### V$SQL vs V$SQLAREA

| View | Granularity | Use Case |
|------|-------------|----------|
| `V$SQL` | One row per child cursor (per execution context) | Detailed analysis including bind variable peeking, session-specific stats |
| `V$SQLAREA` | One row per parent cursor (aggregates child cursors) | Summary statistics across all executions of the same SQL text |

In practice, start with `V$SQLAREA` for top-N queries by total resource consumption, then drill into `V$SQL` for specific execution plans and bind variable details.

### Essential Columns

```sql
-- Explore available columns (subset of the most important)
SELECT column_name, comments
FROM   dict_columns
WHERE  table_name = 'V$SQLAREA'
  AND  column_name IN (
       'SQL_ID','SQL_TEXT','PARSING_SCHEMA_NAME',
       'EXECUTIONS','ELAPSED_TIME','CPU_TIME',
       'BUFFER_GETS','DISK_READS','ROWS_PROCESSED',
       'SORTS','FETCHES','LOADS','INVALIDATIONS',
       'SHARABLE_MEM','PERSISTENT_MEM','RUNTIME_MEM',
       'FIRST_LOAD_TIME','LAST_ACTIVE_TIME',
       'PARSING_USER_ID','CHILD_NUMBER','PLAN_HASH_VALUE'
       );
```

Key column descriptions:

| Column | Unit | Description |
|--------|------|-------------|
| `SQL_ID` | — | Unique SQL identifier (14-character hash) |
| `EXECUTIONS` | count | Number of times this cursor was executed |
| `ELAPSED_TIME` | microseconds | Total wall-clock time across all executions |
| `CPU_TIME` | microseconds | Total CPU time across all executions |
| `BUFFER_GETS` | blocks | Total logical reads (memory reads) |
| `DISK_READS` | blocks | Total physical reads from disk |
| `ROWS_PROCESSED` | rows | Total rows returned/processed |
| `SORTS` | count | Total sorts performed |
| `SHARABLE_MEM` | bytes | Memory used for this cursor in shared pool |
| `LAST_ACTIVE_TIME` | date | Last time this cursor was active |
| `PLAN_HASH_VALUE` | number | Hash of the current execution plan |

---

## Finding Top SQL by Resource Dimension

### Top SQL by CPU Time

CPU-heavy queries are often those performing full table scans, excessive sorting, or processing large result sets without appropriate filtering.

```sql
-- Top 20 SQL by total CPU time (all executions combined)
SELECT sql_id,
       ROUND(cpu_time / 1e6, 1)              AS total_cpu_sec,
       ROUND(cpu_time / NULLIF(executions, 0) / 1e6, 3) AS avg_cpu_sec,
       executions,
       ROUND(elapsed_time / 1e6, 1)          AS total_elapsed_sec,
       buffer_gets,
       disk_reads,
       parsing_schema_name,
       SUBSTR(sql_text, 1, 80)               AS sql_preview
FROM   v$sqlarea
WHERE  executions > 0
ORDER BY cpu_time DESC
FETCH FIRST 20 ROWS ONLY;
```

### Top SQL by Elapsed Time

Elapsed time captures wall-clock time including waits (I/O, locking, network). High elapsed time with low CPU time indicates wait-bound SQL.

```sql
-- Top 20 SQL by total elapsed time
SELECT sql_id,
       ROUND(elapsed_time / 1e6, 1)               AS total_elapsed_sec,
       ROUND(elapsed_time / NULLIF(executions, 0) / 1e6, 3) AS avg_elapsed_sec,
       executions,
       ROUND(cpu_time    / 1e6, 1)                AS total_cpu_sec,
       ROUND((elapsed_time - cpu_time) / 1e6, 1)  AS total_wait_sec,
       ROUND((elapsed_time - cpu_time) * 100.0
             / NULLIF(elapsed_time, 0), 1)         AS wait_pct,
       parsing_schema_name,
       SUBSTR(sql_text, 1, 80)                     AS sql_preview
FROM   v$sqlarea
WHERE  executions > 0
ORDER BY elapsed_time DESC
FETCH FIRST 20 ROWS ONLY;
```

### Top SQL by Physical I/O (Disk Reads)

High disk reads often indicate missing or unused indexes, full table scans on large tables, or insufficient buffer cache size.

```sql
-- Top 20 SQL by total physical reads
SELECT sql_id,
       disk_reads,
       ROUND(disk_reads / NULLIF(executions, 0), 0) AS avg_disk_reads,
       buffer_gets,
       ROUND(buffer_gets / NULLIF(executions, 0), 0) AS avg_buffer_gets,
       executions,
       ROUND(elapsed_time / 1e6, 1)                  AS total_elapsed_sec,
       parsing_schema_name,
       SUBSTR(sql_text, 1, 80)                        AS sql_preview
FROM   v$sqlarea
WHERE  executions > 0
  AND  disk_reads > 0
ORDER BY disk_reads DESC
FETCH FIRST 20 ROWS ONLY;
```

### Top SQL by Logical Reads (Buffer Gets)

High buffer gets can indicate full scans, inefficient index usage, or queries that scan more data than necessary. This is a good proxy for memory pressure.

```sql
-- Top 20 SQL by total buffer gets (logical I/O)
SELECT sql_id,
       buffer_gets,
       ROUND(buffer_gets / NULLIF(executions, 0), 0) AS avg_buffer_gets,
       ROUND(disk_reads  / NULLIF(buffer_gets,   0) * 100, 1) AS cache_miss_pct,
       executions,
       ROUND(cpu_time / 1e6, 1) AS total_cpu_sec,
       parsing_schema_name,
       SUBSTR(sql_text, 1, 80)  AS sql_preview
FROM   v$sqlarea
WHERE  executions  > 0
  AND  buffer_gets > 0
ORDER BY buffer_gets DESC
FETCH FIRST 20 ROWS ONLY;
```

### High-Frequency vs. High-Impact Queries

Some queries are expensive per execution; others are cheap per execution but run thousands of times. Distinguish between them:

```sql
-- High frequency, low per-execution cost (potential for optimization via result caching, batching)
SELECT sql_id,
       executions,
       ROUND(elapsed_time / NULLIF(executions, 0) / 1000, 2) AS avg_ms,
       ROUND(elapsed_time / 1e6, 1)   AS total_elapsed_sec,
       ROUND(cpu_time     / 1e6, 1)   AS total_cpu_sec,
       SUBSTR(sql_text, 1, 80)        AS sql_preview
FROM   v$sqlarea
WHERE  executions > 1000
ORDER BY executions DESC
FETCH FIRST 20 ROWS ONLY;
```

```sql
-- Multi-dimensional ranking: top SQL by weighted impact score
SELECT sql_id,
       executions,
       ROUND(elapsed_time / 1e6, 1)               AS elapsed_sec,
       ROUND(cpu_time     / 1e6, 1)               AS cpu_sec,
       buffer_gets,
       disk_reads,
       -- Weighted composite score
       ROUND(
           (elapsed_time / NULLIF(MAX(elapsed_time) OVER (), 0) * 40) +
           (cpu_time     / NULLIF(MAX(cpu_time)     OVER (), 0) * 30) +
           (buffer_gets  / NULLIF(MAX(buffer_gets)  OVER (), 0) * 20) +
           (disk_reads   / NULLIF(MAX(disk_reads)   OVER (), 0) * 10)
       , 2) AS impact_score,
       SUBSTR(sql_text, 1, 80) AS sql_preview
FROM   v$sqlarea
WHERE  executions > 0
ORDER BY impact_score DESC
FETCH FIRST 30 ROWS ONLY;
```

### Retrieving the Full SQL Text

`V$SQLAREA.SQL_TEXT` is truncated to 1000 characters. Use `V$SQLTEXT` for the full statement:

```sql
-- Get full SQL text for a specific SQL_ID
SELECT piece,
       sql_text
FROM   v$sqltext
WHERE  sql_id    = 'abc123def456g'
ORDER BY piece;
```

```sql
-- Or use V$SQL.SQL_FULLTEXT (CLOB, available in 11g+)
SELECT sql_fulltext
FROM   v$sql
WHERE  sql_id = 'abc123def456g'
  AND  child_number = 0;
```

---

## AWR Top SQL Queries

The Automatic Workload Repository (AWR) captures snapshots of key statistics every hour (by default). This historical data is stored in `DBA_HIST_*` tables and enables trending and comparison across time periods.

**Requires:** Oracle Diagnostics Pack license for production use of AWR data.

### Finding the Snapshot Range

```sql
-- Available AWR snapshots
SELECT snap_id,
       begin_interval_time,
       end_interval_time
FROM   dba_hist_snapshot
ORDER BY snap_id DESC
FETCH FIRST 24 ROWS ONLY;  -- Last 24 snapshots (typically 24 hours)
```

### DBA_HIST_SQLSTAT: Core AWR SQL Statistics

`DBA_HIST_SQLSTAT` stores per-snapshot SQL statistics, linked to `DBA_HIST_SQLTEXT` for the SQL text.

```sql
-- Top SQL by elapsed time between two specific snapshots
SELECT st.sql_id,
       ROUND(SUM(st.elapsed_time_delta) / 1e6, 1)        AS elapsed_sec,
       ROUND(SUM(st.cpu_time_delta)     / 1e6, 1)        AS cpu_sec,
       SUM(st.executions_delta)                           AS executions,
       ROUND(SUM(st.elapsed_time_delta)
             / NULLIF(SUM(st.executions_delta), 0) / 1e6, 3) AS avg_elapsed_sec,
       SUM(st.buffer_gets_delta)                          AS buffer_gets,
       SUM(st.disk_reads_delta)                           AS disk_reads,
       SUBSTR(t.sql_text, 1, 80)                          AS sql_preview
FROM   dba_hist_sqlstat  st
JOIN   dba_hist_sqltext  t  ON st.sql_id = t.sql_id AND st.dbid = t.dbid
WHERE  st.snap_id BETWEEN 100 AND 120   -- substitute your snapshot IDs
  AND  st.dbid = (SELECT dbid FROM v$database)
  AND  st.executions_delta > 0
GROUP BY st.sql_id, t.sql_text
ORDER BY elapsed_sec DESC
FETCH FIRST 20 ROWS ONLY;
```

### AWR Top SQL by CPU for a Date Range

```sql
-- Top CPU SQL in the last 7 days using AWR
SELECT st.sql_id,
       ROUND(SUM(st.cpu_time_delta) / 1e6, 1)           AS total_cpu_sec,
       SUM(st.executions_delta)                           AS executions,
       ROUND(SUM(st.cpu_time_delta)
             / NULLIF(SUM(st.executions_delta), 0) / 1e6, 3) AS avg_cpu_sec,
       ROUND(SUM(st.elapsed_time_delta) / 1e6, 1)        AS total_elapsed_sec,
       SUBSTR(t.sql_text, 1, 80)                          AS sql_preview
FROM   dba_hist_sqlstat  st
JOIN   dba_hist_sqltext  t  ON st.sql_id = t.sql_id AND st.dbid = t.dbid
JOIN   dba_hist_snapshot sn ON st.snap_id = sn.snap_id AND st.dbid = sn.dbid
WHERE  sn.begin_interval_time > SYSDATE - 7
  AND  st.executions_delta > 0
GROUP BY st.sql_id, t.sql_text
ORDER BY total_cpu_sec DESC
FETCH FIRST 20 ROWS ONLY;
```

### Tracking SQL Performance Over Time (Regression Detection)

```sql
-- Compare average elapsed time for a specific SQL across AWR snapshots
-- Useful for detecting plan changes or performance regressions
SELECT sn.snap_id,
       sn.begin_interval_time,
       st.plan_hash_value,
       st.executions_delta,
       ROUND(st.elapsed_time_delta / NULLIF(st.executions_delta, 0) / 1e6, 4) AS avg_elapsed_sec,
       ROUND(st.cpu_time_delta     / NULLIF(st.executions_delta, 0) / 1e6, 4) AS avg_cpu_sec,
       ROUND(st.buffer_gets_delta  / NULLIF(st.executions_delta, 0), 0)       AS avg_buffer_gets
FROM   dba_hist_sqlstat  st
JOIN   dba_hist_snapshot sn ON st.snap_id = sn.snap_id AND st.dbid = sn.dbid
WHERE  st.sql_id = 'abc123def456g'
  AND  sn.begin_interval_time > SYSDATE - 30
  AND  st.executions_delta > 0
ORDER BY sn.snap_id;
```

A sudden increase in `avg_elapsed_sec` combined with a change in `plan_hash_value` indicates a plan change caused the regression.

### AWR SQL Plans

```sql
-- Execution plans stored in AWR for a specific SQL_ID
SELECT plan_hash_value,
       timestamp,
       operation,
       options,
       object_owner,
       object_name,
       cost,
       cardinality,
       bytes
FROM   dba_hist_sql_plan
WHERE  sql_id = 'abc123def456g'
  AND  dbid   = (SELECT dbid FROM v$database)
ORDER BY plan_hash_value, id;
```

```sql
-- Generate formatted execution plan from AWR using DBMS_XPLAN
SELECT *
FROM   TABLE(DBMS_XPLAN.display_awr(
               sql_id         => 'abc123def456g',
               plan_hash_value => NULL,   -- NULL shows all plans
               db_id          => NULL,    -- NULL uses current DB
               format         => 'ALL'
           ));
```

---

## V$SQL_MONITOR: Real-Time SQL Monitoring

SQL Monitoring was introduced in Oracle 11g and provides real-time, per-execution visibility into long-running SQL statements. It automatically activates for any statement that:
- Runs for more than 5 seconds of CPU or I/O time, **or**
- Uses parallel execution, **or**
- Has the `MONITOR` hint applied

**Requires:** Oracle Tuning Pack. In practice, pack access is controlled through `CONTROL_MANAGEMENT_PACK_ACCESS`, where Tuning Pack implies Diagnostics Pack.

### Viewing Active Monitored SQL

```sql
-- Currently executing SQL with monitoring
SELECT sql_id,
       sql_exec_id,
       status,
       username,
       ROUND(elapsed_time / 1e6, 1)    AS elapsed_sec,
       ROUND(cpu_time     / 1e6, 1)    AS cpu_sec,
       ROUND(queuing_time / 1e6, 1)    AS queue_sec,
       buffer_gets,
       disk_reads,
       ROUND(physical_read_bytes  / 1048576, 1) AS phys_read_mb,
       ROUND(physical_write_bytes / 1048576, 1) AS phys_write_mb,
       ROUND(io_interconnect_bytes / 1048576, 1) AS io_ic_mb,
       px_servers_requested,
       px_servers_allocated,
       SUBSTR(sql_text, 1, 80)         AS sql_preview
FROM   v$sql_monitor
WHERE  status = 'EXECUTING'
ORDER BY elapsed_time DESC;
```

```sql
-- Recently completed monitored SQL (last hour)
SELECT sql_id,
       sql_exec_start,
       status,
       username,
       ROUND(elapsed_time / 1e6, 1)    AS elapsed_sec,
       ROUND(cpu_time     / 1e6, 1)    AS cpu_sec,
       buffer_gets,
       disk_reads,
       ROUND(physical_read_bytes  / 1048576, 1) AS phys_read_mb,
       SUBSTR(sql_text, 1, 80)         AS sql_preview
FROM   v$sql_monitor
WHERE  sql_exec_start > SYSDATE - 1/24
  AND  status != 'EXECUTING'
ORDER BY elapsed_time DESC
FETCH FIRST 30 ROWS ONLY;
```

### Plan-Level Monitoring with V$SQL_PLAN_MONITOR

`V$SQL_PLAN_MONITOR` provides statistics at the **execution plan operation level**—showing exactly which step in the plan is consuming the most resources:

```sql
-- Per-operation statistics for a running or recently completed query
SELECT pm.plan_line_id       AS line,
       pm.plan_operation     AS operation,
       pm.plan_options,
       pm.plan_object_name   AS object_name,
       pm.output_rows,
       pm.starts,
       pm.workarea_mem       AS mem_bytes,
       pm.workarea_tempseg   AS temp_bytes,
       ROUND(pm.elapsed_time / 1e6, 3) AS elapsed_sec,
       ROUND(pm.cpu_time     / 1e6, 3) AS cpu_sec,
       pm.physical_read_requests       AS phys_reads,
       pm.physical_write_requests      AS phys_writes
FROM   v$sql_plan_monitor pm
WHERE  pm.sql_id      = 'abc123def456g'
  AND  pm.sql_exec_id = 16777216     -- get from V$SQL_MONITOR
ORDER BY pm.plan_line_id;
```

### Generating the SQL Monitor Report

The most powerful way to view SQL Monitoring data is the HTML or text report, which provides a formatted view of the plan, statistics, and timing:

```sql
-- Generate HTML SQL Monitor report (best for browser viewing)
SELECT DBMS_SQLTUNE.report_sql_monitor(
           sql_id     => 'abc123def456g',
           type       => 'HTML',
           report_level => 'ALL'
       ) AS report
FROM dual;
```

```sql
-- Generate text report (suitable for email or terminal)
SELECT DBMS_SQLTUNE.report_sql_monitor(
           sql_id     => 'abc123def456g',
           type       => 'TEXT',
           report_level => 'ALL'
       ) AS report
FROM dual;
```

```sql
-- Generate report for a specific execution (use sql_exec_id from V$SQL_MONITOR)
SELECT DBMS_SQLTUNE.report_sql_monitor(
           sql_id     => 'abc123def456g',
           sql_exec_id => 16777216,
           type        => 'HTML',
           report_level => 'ALL'
       ) AS report
FROM dual;
```

```sql
-- Generate an active monitoring report (real-time, auto-refreshing in browser)
SELECT DBMS_SQLTUNE.report_sql_monitor(
           sql_id       => 'abc123def456g',
           type         => 'ACTIVE',
           report_level => 'ALL'
       ) AS report
FROM dual;
```

Save the HTML output to a `.html` file and open in a browser for the interactive report that shows:
- Real-time execution progress
- Per-operation statistics with timing bars
- Memory and temp usage per operation
- Parallel execution server distribution
- I/O statistics per operation

---

## Combining V$ and AWR Data: A Practical Workflow

### Step 1: Identify the Worst SQL Right Now

```sql
-- Quick top-5 current offenders
SELECT sql_id,
       ROUND(elapsed_time / 1e6, 1) AS elapsed_sec,
       ROUND(cpu_time     / 1e6, 1) AS cpu_sec,
       buffer_gets,
       disk_reads,
       executions,
       SUBSTR(sql_text, 1, 60)      AS preview
FROM   v$sqlarea
ORDER BY elapsed_time DESC
FETCH FIRST 5 ROWS ONLY;
```

### Step 2: Check If This Is a New Problem or Recurring

```sql
-- How did this SQL perform historically?
SELECT sn.begin_interval_time,
       st.executions_delta,
       ROUND(st.elapsed_time_delta / NULLIF(st.executions_delta, 0) / 1e6, 3) AS avg_elapsed_sec,
       st.plan_hash_value
FROM   dba_hist_sqlstat  st
JOIN   dba_hist_snapshot sn ON st.snap_id = sn.snap_id AND st.dbid = sn.dbid
WHERE  st.sql_id = 'abc123def456g'
  AND  sn.begin_interval_time > SYSDATE - 14
  AND  st.executions_delta > 0
ORDER BY sn.snap_id DESC;
```

### Step 3: View the Current Execution Plan

```sql
-- Current plan from library cache
SELECT *
FROM   TABLE(DBMS_XPLAN.display_cursor(
               sql_id       => 'abc123def456g',
               cursor_child_no => 0,
               format       => 'ALLSTATS LAST'
           ));
```

### Step 4: Generate SQL Monitoring Report

```sql
-- Get the latest sql_exec_id for this SQL
SELECT sql_exec_id, sql_exec_start, elapsed_time/1e6 AS elapsed_sec, status
FROM   v$sql_monitor
WHERE  sql_id = 'abc123def456g'
ORDER BY sql_exec_start DESC
FETCH FIRST 1 ROW ONLY;
```

Then generate the HTML report as shown above.

---

## Best Practices

1. **Start with `V$SQLAREA` sorted by elapsed time, not CPU.** Elapsed time captures the full user experience including waits. A query that uses 100 seconds of CPU in 10 minutes of wall clock time is less urgent than one using 10 seconds of CPU while blocking others for 30 minutes.

2. **Always divide by executions to find per-execution cost.** Total elapsed time can be misleading if a query runs a million times. Compare per-execution averages to identify whether optimization should focus on reducing execution count (result caching, better application logic) or reducing per-execution cost (indexing, plan changes).

3. **Use `plan_hash_value` to detect plan changes.** A sudden change in `plan_hash_value` in AWR history almost always corresponds to a performance change. Keep this in mind when investigating regressions.

4. **Keep SQL Monitor reports for major incidents.** HTML SQL Monitor reports are invaluable post-incident artifacts. Save them to a shared location before the monitoring data ages out (default retention is 30 days for completed statements).

5. **Use the `MONITOR` hint to force monitoring for important short-running queries.** By default, SQL Monitoring only activates for long-running queries. For critical short-duration queries (sub-5-second but high-frequency), add `/*+ MONITOR */` during investigation to capture per-operation statistics.

6. **Investigate high `disk_reads/executions` ratios before buffer gets.** Physical I/O is orders of magnitude slower than logical I/O. A query reading 10,000 physical blocks per execution should be the first priority, even if another query reads 1,000,000 buffer blocks from cache.

7. **Use `DBA_HIST_SQLSTAT` for monthly capacity planning.** Trending SQL resource consumption over months helps predict when current hardware will reach saturation and builds the business case for infrastructure changes.

---

## Common Mistakes and How to Avoid Them

**Mistake: Tuning SQL based on V$SQLAREA without checking if it still runs.**
`V$SQLAREA` persists cursor data since the last cursor flush or instance restart. A query with the highest elapsed time may not have run in days. Always check `LAST_ACTIVE_TIME` before investing tuning effort.

**Mistake: Using V$SQL or V$SQLAREA without joining to get the full SQL text.**
`SQL_TEXT` in `V$SQLAREA` is truncated to 1000 characters. You cannot correctly identify or analyze a query without the full text. Always use `V$SQLTEXT` or `V$SQL.SQL_FULLTEXT` when sending queries for tuning.

**Mistake: Ignoring parse activity.**
High `LOADS` or `INVALIDATIONS` counts in `V$SQLAREA` indicate that cursors are being hard-parsed or invalidated repeatedly. This does not show up prominently in elapsed time rankings but causes serious scalability issues. Monitor `LOADS/EXECUTIONS` ratio.

**Mistake: Comparing AWR stats without accounting for different snapshot durations.**
AWR `_delta` values accumulate over the snapshot interval. A snapshot covering 2 hours has twice as many delta values as one covering 1 hour. Normalize by dividing by the interval duration when comparing across snapshots of different lengths.

**Mistake: Forgetting that SQL Monitoring requires licensing.**
`V$SQL_MONITOR` and `DBMS_SQLTUNE.report_sql_monitor` are Tuning Pack features, and Tuning Pack requires Diagnostics Pack to be enabled via `CONTROL_MANAGEMENT_PACK_ACCESS`. In unlicensed environments, use `V$SQL` and `DBMS_XPLAN.display_cursor` instead.

**Mistake: Relying solely on AWR for real-time diagnosis.**
AWR snapshots are typically taken every hour. During a live performance crisis, use `V$SQL`, `V$SESSION`, `V$SESSION_WAIT`, and `V$SQL_MONITOR` for real-time data. AWR is for trend analysis and post-incident review.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Tuning Guide — Identifying High-Load SQL](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/identifying-high-load-sql.html)
- [Oracle Database 19c Reference — V$SQLAREA](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SQLAREA.html)
- [Oracle Database 19c Reference — V$SQL_MONITOR](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SQL_MONITOR.html)
- [Oracle Database 19c Reference — DBA_HIST_SQLSTAT](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_HIST_SQLSTAT.html)
- [Oracle Database 19c PL/SQL Packages Reference — DBMS_SQLTUNE (report_sql_monitor)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SQLTUNE.html)
