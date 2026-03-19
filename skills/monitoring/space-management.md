# Space Management

## Overview

Space management is one of the most critical and ongoing DBA responsibilities. Running out of tablespace space is one of the most common causes of application outages—yet it is almost entirely preventable with proper monitoring and proactive management. Beyond preventing full tablespaces, effective space management involves reclaiming wasted space from deleted rows, understanding how Oracle's high water mark works, managing temporary space, and handling the unique space characteristics of LOB columns.

This guide covers the key views, queries, tools, and techniques for monitoring and managing space in an Oracle database.

---

## Core Space Monitoring Views

### DBA_TABLESPACE_USAGE_METRICS

The most important view for tablespace monitoring. It aggregates free and used space across all datafiles for each tablespace, including autoextend potential.

```sql
-- Comprehensive tablespace usage report
SELECT m.tablespace_name,
       ROUND(m.tablespace_size    * t.block_size / 1073741824, 2) AS total_gb,
       ROUND(m.used_space         * t.block_size / 1073741824, 2) AS used_gb,
       ROUND(m.free_space         * t.block_size / 1073741824, 2) AS free_gb,
       ROUND(m.used_percent, 1)                                    AS used_pct,
       t.contents,
       t.extent_management,
       t.segment_space_management
FROM   dba_tablespace_usage_metrics m
JOIN   dba_tablespaces              t ON m.tablespace_name = t.tablespace_name
ORDER BY m.used_percent DESC;
```

```sql
-- Find tablespaces above 80% used (alert threshold)
SELECT tablespace_name,
       ROUND(used_percent, 1) AS used_pct,
       ROUND(free_space * 8192 / 1073741824, 2) AS free_gb
FROM   dba_tablespace_usage_metrics
WHERE  used_percent > 80
ORDER BY used_percent DESC;
```

### DBA_DATA_FILES and DBA_FREE_SPACE

For more detailed analysis at the datafile level:

```sql
-- Datafile-level space report with autoextend information
SELECT df.tablespace_name,
       df.file_name,
       ROUND(df.bytes       / 1073741824, 2) AS file_size_gb,
       ROUND(df.maxbytes    / 1073741824, 2) AS max_size_gb,
       df.autoextensible,
       ROUND(NVL(fs.free_bytes, 0) / 1073741824, 2) AS free_gb,
       ROUND((df.bytes - NVL(fs.free_bytes, 0)) / df.bytes * 100, 1) AS used_pct
FROM   dba_data_files df
LEFT JOIN (
    SELECT file_id, SUM(bytes) AS free_bytes
    FROM   dba_free_space
    GROUP BY file_id
) fs ON df.file_id = fs.file_id
ORDER BY used_pct DESC;
```

### Monitoring with DBA_SEGMENTS

For understanding which objects are consuming the most space:

```sql
-- Top 30 segments by size
SELECT owner,
       segment_name,
       segment_type,
       tablespace_name,
       ROUND(bytes / 1073741824, 3) AS size_gb,
       extents
FROM   dba_segments
WHERE  owner NOT IN ('SYS','SYSTEM','DBSNMP','SYSMAN','OUTLN','XDB')
ORDER BY bytes DESC
FETCH FIRST 30 ROWS ONLY;
```

```sql
-- Space consumed by segment type
SELECT segment_type,
       COUNT(*)                           AS object_count,
       ROUND(SUM(bytes)/1073741824, 2)    AS total_gb
FROM   dba_segments
WHERE  owner NOT IN ('SYS','SYSTEM','DBSNMP','SYSMAN')
GROUP BY segment_type
ORDER BY total_gb DESC;
```

```sql
-- Largest tables with row count and average row size
SELECT s.owner,
       s.segment_name,
       ROUND(s.bytes / 1048576, 1)   AS alloc_mb,
       t.num_rows,
       t.avg_row_len,
       ROUND(t.num_rows * t.avg_row_len / 1048576, 1) AS data_mb,
       ROUND((s.bytes - t.num_rows * t.avg_row_len) / 1048576, 1) AS waste_mb
FROM   dba_segments s
JOIN   dba_tables   t ON s.owner = t.owner AND s.segment_name = t.table_name
WHERE  s.segment_type = 'TABLE'
  AND  s.owner NOT IN ('SYS','SYSTEM','DBSNMP','SYSMAN')
  AND  t.num_rows > 0
ORDER BY waste_mb DESC NULLS LAST
FETCH FIRST 30 ROWS ONLY;
```

---

## High Water Mark Concepts

### What the High Water Mark Is

The **high water mark (HWM)** is an internal marker within a segment that tracks the highest block ever used by that segment. Oracle's full table scans read up to the HWM regardless of how much data currently sits below it—this means a table that once had 10 million rows but had all rows deleted will still scan the same number of blocks as when it was full.

There are two types of HWM:

- **High HWM:** The absolute highest block ever formatted and potentially used. Full table scans read to this point.
- **Low HWM (ASSM only):** The point below which all blocks are guaranteed to be formatted. Space below Low HWM is used first for new inserts.

### Impact of HWM on Performance

```
Full scan reads blocks 1 → HWM, regardless of actual data
│
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░
│ [data blocks] [empty blocks above HWM marker]
│
│ After mass delete: same full scan cost, mostly reading empty blocks
```

### Checking HWM and Reclaimable Space

```sql
-- Tables where allocated blocks significantly exceed what data needs
-- (high potential for HWM reclamation)
SELECT t.owner,
       t.table_name,
       t.num_rows,
       s.blocks             AS allocated_blocks,
       t.blocks             AS hwm_blocks,         -- blocks up to HWM
       t.empty_blocks,                              -- blocks above HWM
       ROUND(s.bytes/1048576, 1) AS alloc_mb,
       CASE WHEN t.num_rows > 0
            THEN ROUND(t.num_rows * t.avg_row_len / 8192)
            ELSE 0
       END AS estimated_needed_blocks
FROM   dba_tables   t
JOIN   dba_segments s ON t.owner = s.owner AND t.table_name = s.segment_name
WHERE  s.segment_type = 'TABLE'
  AND  t.owner NOT IN ('SYS','SYSTEM','DBSNMP','SYSMAN')
  AND  t.num_rows IS NOT NULL
  AND  s.blocks > 500
ORDER BY (t.blocks - CASE WHEN t.num_rows > 0
                           THEN ROUND(t.num_rows * t.avg_row_len / 8192)
                           ELSE 0
                      END) DESC NULLS LAST
FETCH FIRST 30 ROWS ONLY;
```

**Note:** `DBA_TABLES.BLOCKS` and `NUM_ROWS` require up-to-date statistics. Run `DBMS_STATS.gather_table_stats` first for accuracy.

---

## Reclaiming Space

### SHRINK SPACE (Online, Non-Destructive)

`ALTER TABLE ... SHRINK SPACE` compacts the table data by moving rows below the HWM, then resets the HWM. It works online (DML can continue) and requires the tablespace to use Automatic Segment Space Management (ASSM).

```sql
-- Prerequisites: tablespace must use ASSM, table must have row movement enabled
-- Step 1: Enable row movement
ALTER TABLE sales ENABLE ROW MOVEMENT;

-- Step 2: Compact the data (moves rows, does NOT yet reset HWM)
ALTER TABLE sales SHRINK SPACE COMPACT;
-- Use COMPACT during business hours: it defragments but does not release space yet

-- Step 3: Reset the HWM and release space (brief exclusive lock)
ALTER TABLE sales SHRINK SPACE;
-- The full SHRINK (without COMPACT) does both steps in one operation

-- Cascade: also shrink all dependent indexes
ALTER TABLE sales SHRINK SPACE CASCADE;
```

```sql
-- After shrinking, rebuild (or shrink) affected indexes
-- Shrink approach:
ALTER INDEX sales_idx SHRINK SPACE;

-- Or rebuild (offline, but more thorough):
ALTER INDEX sales_idx REBUILD ONLINE;
```

**When to use SHRINK:**
- Table is in an ASSM tablespace
- Online operation is required (no maintenance window)
- Table has had significant deletes or updates (not initial load)

**When NOT to use SHRINK:**
- Table has IOT (Index-Organized Table) structure
- Tablespace uses dictionary-managed extents (legacy)
- Table has functional-based indexes on columns that are changed by row movement

### MOVE (Offline, More Thorough)

`ALTER TABLE ... MOVE` physically relocates the entire table to a new segment (either same or different tablespace), resetting the HWM completely and defragmenting storage.

```sql
-- Move table to same tablespace (resets HWM and defragments)
ALTER TABLE sales MOVE;

-- Move table to a different tablespace
ALTER TABLE sales MOVE TABLESPACE data_ts;

-- Move online (Oracle 12.2+)
ALTER TABLE sales MOVE ONLINE;

-- After MOVE, rebuild all indexes (they become UNUSABLE)
-- Find and rebuild unusable indexes
SELECT 'ALTER INDEX ' || owner || '.' || index_name || ' REBUILD;' AS rebuild_stmt
FROM   dba_indexes
WHERE  table_owner = 'SCOTT'
  AND  table_name  = 'SALES'
  AND  status      = 'UNUSABLE';
```

**When to use MOVE:**
- Maximum space reclamation needed
- Can tolerate a maintenance window (unless using ONLINE option)
- Moving data between tablespaces (e.g., from slow disk to fast SSD)
- Table has MSSM (Manual Segment Space Management) tablespace

### Comparing SHRINK vs MOVE

| Feature | SHRINK SPACE | MOVE |
|---------|-------------|------|
| Online? | Yes | Only with ONLINE clause (12.2+) |
| Indexes invalidated? | No | Yes (must rebuild) |
| ASSM required? | Yes | No |
| Row movement required? | Yes (must enable) | No |
| Reclamation completeness | Very good | Complete |
| Space returned to tablespace | Yes | Yes |

---

## Segment Advisor for Space Reclamation

Oracle's Segment Advisor analyzes segments and recommends those worth shrinking. See also `health-monitor.md` for running the advisor.

```sql
-- Quick check using advisor results already in the repository
SELECT f.task_id,
       o.owner,
       o.object_name,
       o.object_type,
       f.message,
       f.more_info
FROM   dba_advisor_findings   f
JOIN   dba_advisor_objects    o ON f.task_id = o.task_id AND f.object_id = o.object_id
JOIN   dba_advisor_tasks      t ON f.task_id = t.task_id
WHERE  t.advisor_name = 'Segment Advisor'
  AND  t.status       = 'COMPLETED'
  AND  o.owner NOT IN ('SYS','SYSTEM')
ORDER BY f.task_id DESC, o.owner, o.object_name;
```

```sql
-- Auto-generate SHRINK statements from Segment Advisor recommendations
SELECT 'ALTER TABLE ' || o.owner || '.' || o.object_name ||
       ' ENABLE ROW MOVEMENT;' || CHR(10) ||
       'ALTER TABLE ' || o.owner || '.' || o.object_name ||
       ' SHRINK SPACE CASCADE;'   AS shrink_stmt
FROM   dba_advisor_findings   f
JOIN   dba_advisor_objects    o ON f.task_id = o.task_id AND f.object_id = o.object_id
JOIN   dba_advisor_tasks      t ON f.task_id = t.task_id
WHERE  t.advisor_name  = 'Segment Advisor'
  AND  t.status        = 'COMPLETED'
  AND  o.object_type   = 'TABLE'
  AND  o.owner NOT IN ('SYS','SYSTEM')
ORDER BY o.owner, o.object_name;
```

---

## LOB Space Management

LOBs (Large Objects—BLOB, CLOB, NCLOB, BFILE) have their own storage mechanics that differ fundamentally from ordinary table rows.

### LOB Storage Mechanics

- **Inline storage:** Small LOBs (< 4000 bytes for CLOB/NCLOB, < 2000 bytes for BLOB) may be stored inline within the table row.
- **Out-of-line storage:** Larger LOBs are stored in a dedicated LOB segment, with the table row holding a pointer (locator).
- **SecureFiles vs BasicFiles:** SecureFiles (introduced in 11g) is the modern LOB storage format. It supports deduplication, compression, and encryption. BasicFiles is the legacy format.
- **LOB Index:** Each out-of-line LOB column has an associated LOB index segment.

```sql
-- Find LOB segments and their sizes
SELECT l.owner,
       l.table_name,
       l.column_name,
       l.segment_name,
       l.tablespace_name,
       l.securefile,
       ROUND(s.bytes / 1073741824, 3) AS lob_gb
FROM   dba_lobs     l
JOIN   dba_segments s ON l.owner = s.owner AND l.segment_name = s.segment_name
WHERE  l.owner NOT IN ('SYS','SYSTEM','DBSNMP')
ORDER BY s.bytes DESC
FETCH FIRST 30 ROWS ONLY;
```

### LOB Space Issues and Reclamation

LOBs have a separate HWM and do not benefit from table `SHRINK` operations. Reclaiming LOB space requires different techniques:

```sql
-- Check LOB segment space vs actual data
SELECT l.owner,
       l.table_name,
       l.column_name,
       ROUND(s.bytes / 1048576, 1) AS alloc_mb,
       -- Estimate actual LOB data size from statistics
       ROUND(NVL(t.num_rows, 0) *
             (SELECT AVG(DBMS_LOB.getlength(lob_col))
              FROM   some_table) / 1048576, 1) AS est_data_mb
FROM   dba_lobs     l
JOIN   dba_segments s ON l.owner = s.owner AND l.segment_name = s.segment_name
JOIN   dba_tables   t ON l.owner = t.owner AND l.table_name = t.table_name;
```

**Reclaiming LOB space:**

```sql
-- For SecureFiles: enable shrink (online)
ALTER TABLE documents MODIFY LOB (document_content) (SHRINK SPACE);

-- For BasicFiles: must use MOVE
ALTER TABLE documents MOVE LOB (document_content) STORE AS (TABLESPACE lob_ts);

-- Alternatively, for full reclamation: disable/enable storage clause
-- (This creates a new LOB segment and copies data)
ALTER TABLE documents MODIFY (document_content CLOB
    STORE AS SECUREFILE (
        TABLESPACE lob_ts
        ENABLE STORAGE IN ROW
        CHUNK 8192
        COMPRESS HIGH
    )
);
```

### LOB Retention and Undo

LOBs (especially BasicFiles) do not use the standard undo tablespace—they have their own undo mechanism within the LOB segment. This means:

```sql
-- Check LOB retention setting
SELECT l.owner,
       l.table_name,
       l.column_name,
       l.securefile,
       l.retention_type,
       l.retention_value
FROM   dba_lobs l
WHERE  l.owner NOT IN ('SYS','SYSTEM')
ORDER BY l.owner, l.table_name;
```

For BasicFiles LOBs, the `RETENTION` clause controls how long old LOB versions are retained. Excessive retention can cause LOB segments to grow unexpectedly.

---

## Temp Space Monitoring

Temporary tablespace is used for sort operations, hash joins, global temporary tables, and parallel query operations. Unlike permanent tablespace, it is recycled after each operation—but it can become "stuck" if sessions are killed or internal errors occur.

### Current Temp Usage

```sql
-- Current temp space usage by session
SELECT s.sid,
       s.serial#,
       s.username,
       s.program,
       s.status,
       ROUND(t.blocks * t.block_size / 1048576, 1) AS temp_mb,
       t.tablespace
FROM   v$sort_usage  t
JOIN   v$session     s ON t.session_addr = s.saddr
ORDER BY t.blocks DESC;
```

```sql
-- Total temp space used vs allocated
SELECT tablespace_name,
       ROUND(total_blocks    * 8192 / 1073741824, 2) AS total_gb,
       ROUND(used_blocks     * 8192 / 1073741824, 2) AS used_gb,
       ROUND(free_blocks     * 8192 / 1073741824, 2) AS free_gb,
       ROUND(used_blocks * 100.0 / NULLIF(total_blocks, 0), 1) AS used_pct
FROM   v$temp_space_header
ORDER BY tablespace_name;
```

```sql
-- Which operations are using the most temp space right now
SELECT s.sid,
       s.username,
       s.sql_id,
       ROUND(SUM(t.blocks * t.block_size) / 1048576, 1) AS temp_mb,
       MAX(t.sql_id) AS current_sql_id
FROM   v$tempseg_usage t
JOIN   v$session       s ON t.session_addr = s.saddr
GROUP BY s.sid, s.username, s.sql_id
ORDER BY temp_mb DESC;
```

```sql
-- Temp tablespace sizing: look at historical max usage (if AWR available)
SELECT u.snap_id,
       ts.name AS tablespace_name,
       ROUND(u.tablespace_size * dt.block_size / 1073741824, 2) AS total_gb,
       ROUND(u.tablespace_usedsize * dt.block_size / 1073741824, 2) AS used_gb
FROM   dba_hist_tbspc_space_usage u
JOIN   v$tablespace              ts ON u.tablespace_id = ts.ts#
JOIN   dba_tablespaces           dt ON dt.tablespace_name = ts.name
WHERE  dt.contents = 'TEMPORARY'
ORDER BY snap_id DESC
FETCH FIRST 100 ROWS ONLY;
```

### Reclaiming Stuck Temp Space

If temp space is not released after sessions disconnect (a known issue with certain bugs or RAC scenarios):

```sql
-- Find orphaned temp segments (no matching active session)
SELECT t.tablespace, t.blocks, t.sql_id
FROM   v$sort_usage t
WHERE  NOT EXISTS (
    SELECT 1 FROM v$session s WHERE s.saddr = t.session_addr
);
```

```sql
-- If temp is stuck, shrink the temp tablespace (12c+)
ALTER TABLESPACE temp SHRINK SPACE KEEP 1G;

-- Or resize to force reclamation (nuclear option):
ALTER DATABASE TEMPFILE '/u01/oradata/orcl/temp01.dbf' RESIZE 2G;
```

```sql
-- Drop and recreate temp tablespace if severely stuck
-- (ensure no active sessions using temp first)
CREATE TEMPORARY TABLESPACE temp2
TEMPFILE '/u01/oradata/orcl/temp02.dbf' SIZE 4G AUTOEXTEND ON NEXT 512M MAXSIZE 20G;

ALTER DATABASE DEFAULT TEMPORARY TABLESPACE temp2;

DROP TABLESPACE temp INCLUDING CONTENTS AND DATAFILES;

-- Then rename temp2 back if desired
```

---

## Proactive Space Monitoring: Putting It Together

### Daily Space Check Script

```sql
-- Master space monitoring query: run daily or via monitoring tool
WITH ts_usage AS (
    SELECT m.tablespace_name,
           ROUND(m.tablespace_size    * t.block_size / 1073741824, 2) AS total_gb,
           ROUND(m.used_space         * t.block_size / 1073741824, 2) AS used_gb,
           ROUND(m.used_percent, 1) AS used_pct,
           t.contents,
           CASE WHEN EXISTS (
               SELECT 1 FROM dba_data_files d
               WHERE  d.tablespace_name = m.tablespace_name
               AND    d.autoextensible  = 'YES'
           ) THEN 'YES' ELSE 'NO' END AS has_autoextend
    FROM   dba_tablespace_usage_metrics m
    JOIN   dba_tablespaces              t ON m.tablespace_name = t.tablespace_name
)
SELECT tablespace_name,
       total_gb,
       used_gb,
       used_pct,
       contents,
       has_autoextend,
       CASE
           WHEN used_pct >= 95 THEN 'CRITICAL'
           WHEN used_pct >= 85 THEN 'WARNING'
           WHEN used_pct >= 75 THEN 'WATCH'
           ELSE 'OK'
       END AS status
FROM   ts_usage
ORDER BY used_pct DESC;
```

### Tablespace Growth Trending (AWR)

```sql
-- Tablespace growth per week over the last 3 months
SELECT ts.name AS tablespace_name,
       TRUNC(s.begin_interval_time, 'IW')                         AS week_start,
       ROUND(MAX(u.tablespace_usedsize) * dt.block_size / 1073741824, 2) AS max_used_gb,
       ROUND(MIN(u.tablespace_usedsize) * dt.block_size / 1073741824, 2) AS min_used_gb,
       ROUND((MAX(u.tablespace_usedsize) - MIN(u.tablespace_usedsize))
             * dt.block_size / 1073741824, 3)                     AS growth_gb
FROM   dba_hist_tbspc_space_usage  u
JOIN   dba_hist_snapshot            s ON u.snap_id = s.snap_id AND u.dbid = s.dbid
JOIN   v$tablespace                ts ON u.tablespace_id = ts.ts#
JOIN   dba_tablespaces             dt ON dt.tablespace_name = ts.name
WHERE  s.begin_interval_time > SYSDATE - 90
GROUP BY ts.name, dt.block_size, TRUNC(s.begin_interval_time, 'IW')
ORDER BY tablespace_name, week_start;
```

---

## Best Practices

1. **Monitor `DBA_TABLESPACE_USAGE_METRICS` daily and alert at 80% used.** Do not wait for 95%—autoextend files may be at their maximum size, and sudden space consumption (bulk loads, runaway processes) can fill a tablespace in minutes.

2. **Understand autoextend limits, not just current usage.** A tablespace at 50% used with a tiny `MAXSIZE` on its datafiles may be closer to running out of space than a tablespace at 85% with large autoextend headroom.

3. **Gather table statistics before analyzing HWM waste.** `DBA_TABLES.NUM_ROWS` and `AVG_ROW_LEN` are only as current as the last `DBMS_STATS` run. Stale statistics lead to incorrect waste calculations.

4. **Use `SHRINK SPACE COMPACT` first during business hours, then `SHRINK SPACE` during low traffic.** The COMPACT phase does the heavy lifting (moving rows) with minimal locking. The final HWM reset phase is brief.

5. **Always rebuild indexes after `MOVE`.** Forgetting this is a common production incident—unusable indexes cause ORA-01502 errors on any DML against the table.

6. **Size temp tablespace for peak, not average.**  Using AWR history (`DBA_HIST_TBSPC_SPACE_USAGE`) to find historical peak temp usage and size accordingly.  Temp space that fills up during month-end reports causes operations to fail.

7. **Avoid `DROP TABLESPACE` as a temp space fix in production.** Always check for active temp sessions first. Dropping a temp tablespace while sessions are using it can cause instance instability.

---

## Common Mistakes and How to Avoid Them

**Mistake: Monitoring total allocated size instead of used size.**
`DBA_DATA_FILES.BYTES` shows allocated file size, which can be far larger than actual data. Use `DBA_TABLESPACE_USAGE_METRICS` or join `DBA_DATA_FILES` with `DBA_FREE_SPACE` for accurate used vs. free figures.

**Mistake: Expecting `DELETE` to free space immediately.**
`DELETE` removes rows logically but does not lower the HWM or release space to the tablespace. Use `TRUNCATE` (which resets the HWM) when appropriate, or `SHRINK/MOVE` after a mass delete.

**Mistake: Shrinking tables without considering row movement impacts.**
`ENABLE ROW MOVEMENT` allows Oracle to change a row's ROWID during shrink. Any application using stored ROWIDs (caching them externally) will break. Verify no application stores physical ROWIDs before enabling row movement.

**Mistake: Not accounting for LOB segments in space projections.**
LOB segments can be several times larger than the parent table segment and grow independently. Always include LOB segments in tablespace growth projections.

**Mistake: Setting `MAXSIZE UNLIMITED` on autoextend datafiles in production.**
Unlimited autoextend datafiles can fill an entire file system, taking down the OS and the database. Always set a `MAXSIZE` that leaves headroom for the OS and other applications. Monitor the file system, not just Oracle.

**Mistake: Ignoring undo tablespace space.**
Undo tablespace behaves differently—Oracle manages retention automatically, but a very long-running transaction can cause the undo tablespace to grow dramatically. Include the undo tablespace in space monitoring and set a reasonable `UNDO_RETENTION`.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database Administrator's Guide 19c — Managing Tablespaces](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/managing-tablespaces.html)
- [Oracle Database 19c Reference — DBA_TABLESPACE_USAGE_METRICS](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_TABLESPACE_USAGE_METRICS.html)
- [Oracle Database 19c Reference — V$SORT_USAGE](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SORT_USAGE.html)
- [Oracle Database 19c SQL Language Reference — ALTER TABLE (SHRINK SPACE)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ALTER-TABLE.html)
