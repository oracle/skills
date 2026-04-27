# Wait Events — Diagnosis and Remediation

## Overview

Oracle's wait event infrastructure is the foundation of performance diagnosis. Every time a session cannot proceed and must pause for a resource, it records a wait event with the event name, parameters, and duration. These events are tracked in real-time (`V$SESSION_WAIT`, `V$SESSION`) and aggregated historically (`V$SYSTEM_EVENT`, AWR, ASH).

Wait events are categorized into **wait classes**:

| Wait Class | Description |
|---|---|
| `User I/O` | Waiting for physical I/O (table/index reads) |
| `System I/O` | Background process I/O (DBWR, ARCH) |
| `Commit` | Waiting for redo log writes after commit |
| `Concurrency` | Internal database resource contention |
| `Configuration` | Misconfigured parameters causing waits |
| `Network` | SQL*Net communication waits |
| `Administrative` | DBA operations (ALTER TABLE, rebuild) |
| `Application` | Application-level locks and waits |
| `Cluster` | RAC inter-instance communication |
| `Other` | Miscellaneous |
| `Idle` | Session is idle (exclude from analysis) |

---

## Core Wait Event Views

### V$SESSION_WAIT — Current Waits

```sql
-- See what every active session is currently waiting on
SELECT sw.sid,
       s.serial#,
       s.username,
       s.program,
       sw.event,
       sw.wait_class,
       sw.seconds_in_wait,
       sw.state,
       sw.p1text, sw.p1,
       sw.p2text, sw.p2,
       sw.p3text, sw.p3
FROM   v$session_wait sw
JOIN   v$session s ON sw.sid = s.sid
WHERE  sw.wait_class != 'Idle'
ORDER  BY sw.seconds_in_wait DESC;
```

### V$SESSION — Combined Session + Wait Info

```sql
-- Comprehensive active session view
SELECT s.sid,
       s.serial#,
       s.username,
       s.status,
       s.sql_id,
       s.event,
       s.wait_class,
       s.seconds_in_wait,
       s.blocking_session,
       s.module,
       s.action,
       s.program,
       s.machine
FROM   v$session s
WHERE  s.status    = 'ACTIVE'
  AND  s.wait_class != 'Idle'
  AND  s.type       = 'USER'
ORDER  BY s.seconds_in_wait DESC;
```

### V$SYSTEM_EVENT — Cumulative System-Wide Waits

```sql
-- Top wait events since instance startup (or last stats reset)
SELECT event,
       wait_class,
       total_waits,
       total_timeouts,
       time_waited_micro / 1e6              AS time_waited_sec,
       ROUND(average_wait * 10, 3)          AS avg_wait_ms,  -- AVERAGE_WAIT is in centiseconds (hundredths of a second); × 10 converts to ms
       ROUND(time_waited_micro / 1e6 /
             NULLIF(total_waits, 0) * 1000, 3) AS avg_wait_ms_v2
FROM   v$system_event
WHERE  wait_class != 'Idle'
ORDER  BY time_waited_micro DESC
FETCH  FIRST 20 ROWS ONLY;
```

### V$EVENT_HISTOGRAM — Wait Distribution

```sql
-- See the distribution of wait durations for a specific event
SELECT event,
       wait_time_milli,
       wait_count,
       ROUND(100 * wait_count / SUM(wait_count) OVER (PARTITION BY event), 2) AS pct
FROM   v$event_histogram
WHERE  event = 'db file sequential read'
ORDER  BY wait_time_milli;
```

---

## db file sequential read

### What It Is

Single-block physical I/O. The session is waiting for exactly one database block to be read from disk into the buffer cache. This is the standard wait for:

- Index range scans fetching rows (each rowid = one block fetch)
- Full table scan of a very small table (few blocks)
- Undo segment reads

```sql
-- Diagnose: which objects are causing the most sequential reads right now?
-- P1 = file# (absolute file number), P2 = block#, P3 = blocks
-- Join through DBA_EXTENTS to map file#+block# to the owning segment
SELECT o.owner,
       o.object_name,
       o.object_type,
       COUNT(*) AS waits
FROM   v$session_wait sw
JOIN   v$session s ON sw.sid = s.sid
JOIN   dba_extents e ON e.file_id  = sw.p1
                    AND sw.p2 BETWEEN e.block_id AND e.block_id + e.blocks - 1
JOIN   dba_objects o ON o.object_id = e.object_id
WHERE  sw.event = 'db file sequential read'
GROUP  BY o.owner, o.object_name, o.object_type
ORDER  BY waits DESC;

-- From AWR: which objects had the most I/O?
SELECT owner, object_name, object_type,
       physical_reads_total
FROM   dba_hist_seg_stat_obj
WHERE  snap_id BETWEEN 200 AND 201
ORDER  BY physical_reads_total DESC
FETCH  FIRST 20 ROWS ONLY;
```

### Remediation

- **Bad index chosen:** Verify the query plan is using the best index. Stale stats may cause wrong access path.
- **Clustering factor too high:** Table rows are scattered; every index lookup needs a new block fetch. Consider table reorganization or IOT.
- **High IOPS demand:** Add faster storage (SSD/NVMe), increase buffer cache size, or use Exadata Smart Scan.
- **Missing index:** Full row fetches after a different index scan. Create a covering index.

---

## db file scattered read

### What It Is

Multiblock physical I/O. Multiple contiguous blocks are read in one I/O (up to `DB_FILE_MULTIBLOCK_READ_COUNT` blocks). This occurs during:

- Full table scans
- Full index scans (fast full scan)
- Direct path reads (parallel queries, bulk loads)

```sql
-- Check multiblock read count
SELECT name, value FROM v$parameter WHERE name = 'db_file_multiblock_read_count';

-- Identify SQL causing full table scans (from AWR)
SELECT sql_id,
       ROUND(elapsed_time_total / 1e6, 2) AS elapsed_sec,
       disk_reads_total,
       executions_total,
       SUBSTR(sql_text, 1, 80) AS sql_text
FROM   dba_hist_sqlstat
JOIN   dba_hist_sqltext USING (sql_id, dbid)
WHERE  snap_id BETWEEN 200 AND 201
  AND  disk_reads_total > 100000
ORDER  BY disk_reads_total DESC
FETCH  FIRST 10 ROWS ONLY;
```

### Remediation

- **Unnecessary FTS:** Add appropriate indexes for OLTP queries.
- **Intentional FTS (analytics):** Acceptable for large analytical scans; consider parallel query.
- **Caching:** Cache frequently accessed small tables (`ALTER TABLE t CACHE`).
- **Partitioning:** Reduce scan scope with partition pruning.

---

## log file sync

### What It Is

Every time a session issues a `COMMIT`, Oracle must wait for the Log Writer (LGWR) to write the redo buffers to the online redo log files before confirming the commit. `log file sync` is the time the committing session waits for LGWR to acknowledge.

```sql
-- Current log file sync waits
SELECT sid, serial#, event, seconds_in_wait, state
FROM   v$session
WHERE  event = 'log file sync'
ORDER  BY seconds_in_wait DESC;

-- Redo log performance stats
SELECT name, value
FROM   v$sysstat
WHERE  name IN ('redo writes', 'redo write time', 'user commits',
                'redo size', 'redo synch writes', 'redo synch time');

-- Average log file sync time (ms)
SELECT ROUND(sw.time_waited_micro / sw.total_waits / 1000, 2) AS avg_sync_ms
FROM   v$system_event sw
WHERE  event = 'log file sync';
-- > 5ms is a concern; > 20ms is a serious problem
```

### Remediation

- **Slow redo log storage:** Move redo logs to faster storage (dedicated SSD, separate from data files).
- **Too many commits:** Batch commits (commit every N rows instead of every row). Common in ETL and row-by-row loops.
- **Small redo log files:** Frequent log switches keep LGWR busy. Size logs appropriately.
- **Async commit (where durability trade-off is acceptable):**

```sql
-- Async commit: session doesn't wait for LGWR sync
-- WARNING: In a crash, the last committed transactions may be lost
-- Only appropriate for specific use cases (non-critical staging data)
COMMIT WRITE NOWAIT;
-- or at session level:
ALTER SESSION SET COMMIT_WRITE = 'BATCH,NOWAIT';
```

- **Multiplex redo logs:** For hardware mirror (not Oracle multiplex), reduces single point of failure without adding sync overhead.

---

## buffer busy waits

### What It Is

Multiple sessions are trying to read or modify the same buffer in the buffer cache simultaneously. One session holds the buffer in a state that prevents others from accessing it. Common causes:

- **Hot segment header blocks:** Many concurrent inserts into the same segment cause contention on the segment header (which tracks free space).
- **Hot data blocks:** Frequently accessed blocks that many sessions are reading or updating simultaneously.
- **Right-growing indexes:** Sequential inserts into monotonically increasing indexes (e.g., sequence-based PKs) cause contention on the rightmost leaf block.

```sql
-- Identify the hot block (file# and block# from wait parameters)
SELECT sw.p1 AS file_num,
       sw.p2 AS block_num,
       sw.p3 AS class_num,
       o.owner,
       o.object_name,
       o.object_type,
       COUNT(*) AS waiters
FROM   v$session_wait sw
JOIN   dba_extents e ON e.file_id  = sw.p1
                    AND sw.p2 BETWEEN e.block_id AND e.block_id + e.blocks - 1
JOIN   dba_objects o ON o.object_id = e.object_id
WHERE  sw.event = 'buffer busy waits'
GROUP  BY sw.p1, sw.p2, sw.p3, o.owner, o.object_name, o.object_type
ORDER  BY waiters DESC;
```

### Remediation

- **Segment header contention:** Increase `FREELIST GROUPS` (older style) or use Automatic Segment Space Management (ASSM) with multiple free list groups.
- **Index block contention (right-growing):** Use a **reverse-key index** to distribute inserts across many leaf blocks.

```sql
-- Create reverse key index (reverses byte order of key, distributing inserts)
CREATE INDEX orders_id_rk ON orders (order_id) REVERSE;
-- NOTE: reverse-key indexes cannot be used for range scans, only equality
```

- **Hot data blocks:** Application redesign to reduce concurrent access to the same rows. Partitioning can help.

---

## enqueue waits

### What It Is

Enqueue waits are Oracle's queue-based locks. The wait event name is `enq: XX - description`, where XX is the enqueue type.

| Enqueue | Description | Common Cause |
|---|---|---|
| `TX - row lock contention` | Row-level lock | Two sessions updating the same row |
| `TM - contention` | Table-level lock | DML while DDL is running, or unindexed FK |
| `HW - contention` | High-water mark extension | Many sessions extending the same segment |
| `ST - space transaction` | Space management | Dictionary-managed tablespace contention |
| `CF - contention` | Controlfile contention | Heavy RAC or archive activity |
| `US - contention` | Undo segment | Heavy undo segment usage |

```sql
-- Current enqueue waits
SELECT sw.sid,
       s.username,
       sw.event,
       sw.seconds_in_wait,
       sw.p1raw,    -- lock mode + type encoded in P1
       sw.p2,       -- object ID or transaction slot
       sw.p3,
       s.blocking_session
FROM   v$session_wait sw
JOIN   v$session s ON sw.sid = s.sid
WHERE  sw.event LIKE 'enq:%'
ORDER  BY sw.seconds_in_wait DESC;

-- Find the blocker for TX waits
SELECT s.sid, s.serial#, s.username, s.sql_id, s.program,
       l.type, l.lmode, l.request
FROM   v$lock l
JOIN   v$session s ON l.sid = s.sid
WHERE  l.type IN ('TX', 'TM')
  AND  l.block  = 1   -- 1 = this session is blocking others
ORDER  BY l.type, l.sid;

-- Identify the locked row's table
SELECT do.object_name,
       row_wait_file#,
       row_wait_block#,
       row_wait_row#
FROM   v$session s
JOIN   dba_objects do ON do.object_id = s.row_wait_obj#
WHERE  s.sid = :blocked_sid;
```

### Remediation for TX - Row Lock Contention

- **Find and kill or wait for the blocking session** (if it is a stale/dead session).
- **Application fix:** Reduce transaction hold time; commit more frequently; avoid user interaction while holding locks.
- **Optimistic locking pattern:** Use `SELECT ... FOR UPDATE NOWAIT` to fail fast rather than waiting.
- **Serialization problem:** If many sessions are updating the same rows, redesign the application to serialize access.

---

## library cache waits

### What It Is

Library cache waits (`library cache: mutex X`, `library cache lock`, `library cache pin`) indicate contention on shared pool cursors. Sessions are competing to:

- Parse or hard-parse the same SQL
- Invalidate cursors (during DDL or stats regather)
- Access cursor metadata

```sql
-- Hard parse rate (should be near zero in healthy OLTP)
SELECT name, value
FROM   v$sysstat
WHERE  name IN ('parse count (hard)', 'parse count (total)',
                'parse count (failures)', 'execute count');

-- Library cache hit statistics
SELECT namespace,
       gets,
       gethits,
       ROUND(gethitratio * 100, 2) AS get_hit_pct,
       pins,
       pinhits,
       ROUND(pinhitratio * 100, 2) AS pin_hit_pct,
       reloads,
       invalidations
FROM   v$librarycache
WHERE  namespace = 'SQL AREA'
ORDER  BY gets DESC;

-- SQL statements NOT using bind variables (literals in predicates)
-- These cause hard parses and library cache contention
SELECT force_matching_signature,
       COUNT(*)               AS distinct_plans,
       COUNT(DISTINCT sql_id) AS sql_count,
       MAX(SUBSTR(sql_text, 1, 100)) AS sample_text
FROM   v$sql
WHERE  parsing_user_id > 0   -- exclude SYS/SYSTEM
GROUP  BY force_matching_signature
HAVING COUNT(*) > 50          -- many variations of same query pattern
ORDER  BY COUNT(*) DESC
FETCH  FIRST 20 ROWS ONLY;
```

### Remediation

- **Use bind variables** in all application SQL. This is the single most effective fix.
- **`CURSOR_SHARING = FORCE`** (emergency workaround): Forces Oracle to replace literals with system-generated bind variables. Can have side effects with histograms and suboptimal plans.

```sql
-- System-level emergency fix (use carefully)
ALTER SYSTEM SET CURSOR_SHARING = FORCE;

-- Better: fix at application level; set back to EXACT after fixing
ALTER SYSTEM SET CURSOR_SHARING = EXACT;
```

- **Increase `SHARED_POOL_SIZE`** if pin/get hit ratios are below 99%.
- **`CURSOR_SPACE_FOR_TIME = TRUE`** (deprecated in 12c) — kept cursors pinned longer, reducing reloads.

---

## Additional Common Wait Events

### free buffer waits

Buffer cache is too small or DBWR cannot write dirty buffers fast enough.

```sql
-- Check buffer cache size vs. recommendation
SELECT size_for_estimate,
       size_factor,
       estd_physical_reads,
       estd_physical_read_factor
FROM   v$db_cache_advice
WHERE  name      = 'DEFAULT'
  AND  block_size = (SELECT value FROM v$parameter WHERE name = 'db_block_size')
ORDER  BY size_for_estimate;
```

**Remediation:** Increase `DB_CACHE_SIZE` or enable AMM/ASMM. Tune DBWR to write dirty buffers faster (add DBWR processes: `DB_WRITER_PROCESSES`).

### direct path read / direct path read temp

Sessions performing parallel full scans or large sorts that bypass the buffer cache.

- `direct path read` during parallel query is normal and expected
- `direct path read temp` means temp space is being used (sort or hash join spilled to disk)

```sql
-- Find sessions using temp space
SELECT s.sid, s.username, s.sql_id,
       su.tablespace, su.contents, su.blocks * 8192 / 1024 / 1024 AS mb_used
FROM   v$sort_usage su
JOIN   v$session s ON su.session_addr = s.saddr;
```

**Remediation for temp spills:** Increase `PGA_AGGREGATE_TARGET` (or `SORT_AREA_SIZE` for manual PGA), optimize the SQL to reduce intermediate result sets.

### read by other session

A session is waiting for another session that is already reading the same block from disk. The second session waits rather than issuing a duplicate I/O.

**Diagnosis:** Often points to the same hot block issue as `buffer busy waits`. Look at which block is being waited on.

### latch: cache buffers chains

Hash bucket latch contention in the buffer cache. Caused by extremely hot blocks (same block accessed thousands of times per second).

**Remediation:** Identify the hot block (from wait P1/P2), determine which segment it belongs to, and redesign the access pattern or use partitioning to spread the hot data.

---

## Wait Event Diagnosis Workflow

```sql
-- Step 1: Find top wait events right now
SELECT event, COUNT(*) AS sessions
FROM   v$session
WHERE  wait_class != 'Idle'
  AND  status      = 'ACTIVE'
GROUP  BY event
ORDER  BY sessions DESC;

-- Step 2: Get parameter details for the top event
SELECT sid, event, p1text, p1, p2text, p2, p3text, p3, seconds_in_wait
FROM   v$session_wait
WHERE  event = :top_event
ORDER  BY seconds_in_wait DESC;

-- Step 3: Identify the SQL being run by waiting sessions
SELECT s.sid, s.sql_id, q.sql_text, s.event, s.seconds_in_wait
FROM   v$session s
JOIN   v$sql q ON s.sql_id = q.sql_id
WHERE  s.event     = :top_event
  AND  s.wait_class != 'Idle'
ORDER  BY s.seconds_in_wait DESC;

-- Step 4: Trace the chain (who is blocking whom)
SELECT l.sid,
       s.username,
       l.type,
       l.lmode,
       l.request,
       l.block,
       s.blocking_session,
       s.event
FROM   v$lock l
JOIN   v$session s ON l.sid = s.sid
WHERE  l.request > 0 OR l.block > 0
ORDER  BY l.block DESC, l.sid;
```

---

## Best Practices

- **Never include idle wait events in analysis.** Always filter `wait_class != 'Idle'`.
- **Use time-weighted analysis.** An event with 1 million waits but 1ms total is irrelevant; an event with 100 waits but 100 seconds total is critical.
- **Correlate wait events with SQL.** A wait event tells you the symptom; the SQL_ID tells you the root cause.
- **Check wait event parameters** (`P1`, `P2`, `P3`). Each event documents what these mean — file number, block number, lock mode, etc.
- **Use ASH for retrospective analysis** of wait events that occurred in the past without continuous monitoring.
- **Monitor average wait time trends** over time to detect gradual degradation (storage I/O latency creeping up, etc.).

---

## Common Mistakes

| Mistake | Impact | Fix |
|---|---|---|
| Including idle events in top-event analysis | Masks real waits | Always filter `wait_class != 'Idle'` |
| Treating wait count as primary metric | High count but low time is not the problem | Sort by `time_waited` not `total_waits` |
| Killing blocking sessions without finding root cause | Problem recurs | Find why the blocker was holding the lock |
| Ignoring P1/P2/P3 parameters | Miss object-level diagnosis | Look up parameter meanings in Oracle docs |
| Confusing `db file sequential read` with always-bad | It is normal for index-based OLTP | Check if the access path is correct first |
| Treating `log file sync` only as a storage issue | May be commit frequency issue | Check commits/sec from Load Profile first |

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c Performance Tuning Guide (TGDBA)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgdba/)
- [V$SESSION_WAIT — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SESSION_WAIT.html)
- [V$SYSTEM_EVENT — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SYSTEM_EVENT.html)
- [V$EVENT_HISTOGRAM — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-EVENT_HISTOGRAM.html)
- [V$LOCK — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-LOCK.html)
