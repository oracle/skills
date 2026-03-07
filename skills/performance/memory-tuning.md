# Memory Tuning — SGA, PGA, and Oracle Memory Management

## Overview

Oracle database memory is divided into two primary structures:

- **SGA (System Global Area):** Shared memory used by all sessions and background processes. Includes the buffer cache, shared pool, large pool, Java pool, streams pool, and redo log buffer.
- **PGA (Program Global Area):** Per-session private memory. Used for sort areas, hash join areas, bitmap operations, and session state.

Memory sizing is one of the highest-leverage tuning activities — get it right and many other problems disappear. Get it wrong and you face excessive I/O, hard parsing, and spills to temp.

Oracle offers three memory management modes:
- **Manual Memory Management:** DBA manually sets each SGA component and PGA sort area parameters.
- **ASMM (Automatic Shared Memory Management):** DBA sets `SGA_TARGET`; Oracle distributes memory among SGA components automatically.
- **AMM (Automatic Memory Management):** DBA sets `MEMORY_TARGET`; Oracle manages both SGA and PGA automatically.

---

## SGA Components

### Buffer Cache

The buffer cache holds copies of data blocks read from disk. It is typically the largest SGA component and the most performance-sensitive.

```sql
-- Current buffer cache size
SELECT component,
       current_size / 1024 / 1024  AS current_mb,
       min_size / 1024 / 1024      AS min_mb,
       last_oper_type
FROM   v$sga_dynamic_components
WHERE  component = 'DEFAULT buffer cache';

-- Buffer cache hit ratio (cumulative since startup)
SELECT ROUND(
         (1 - (phyrds.value / (dbgets.value + congets.value))) * 100, 2
       ) AS buffer_hit_pct
FROM   v$sysstat phyrds,
       v$sysstat dbgets,
       v$sysstat congets
WHERE  phyrds.name  = 'physical reads'
  AND  dbgets.name  = 'db block gets'
  AND  congets.name = 'consistent gets';

-- How much would increasing the buffer cache reduce physical reads?
SELECT size_for_estimate          AS cache_size_mb,
       size_factor,
       estd_physical_reads,
       estd_physical_read_factor,
       ROUND((1 - estd_physical_read_factor) * 100, 1) AS pct_reduction
FROM   v$db_cache_advice
WHERE  name       = 'DEFAULT'
  AND  block_size = (SELECT TO_NUMBER(value) FROM v$parameter WHERE name = 'db_block_size')
ORDER  BY size_for_estimate;
```

**Target:** Buffer cache hit ratio > 95% for OLTP workloads. But always look at absolute physical reads — a 99% hit ratio with 10 million physical reads per minute is still a lot of I/O.

### Keep and Recycle Pools

Separate buffer pools for specific access patterns:

```sql
-- Keep pool: for small, frequently accessed tables (never evict)
-- Example: PIN a small reference table into the KEEP pool
ALTER TABLE country_codes STORAGE (BUFFER_POOL KEEP);

-- Recycle pool: for large, infrequently accessed objects (evict fast)
ALTER TABLE archive_log STORAGE (BUFFER_POOL RECYCLE);

-- Size the pools
ALTER SYSTEM SET DB_KEEP_CACHE_SIZE   = 64M;
ALTER SYSTEM SET DB_RECYCLE_CACHE_SIZE = 32M;
```

### Shared Pool

The shared pool holds:
- **Library Cache:** Parsed SQL, PL/SQL code, execution plans
- **Dictionary Cache (Row Cache):** Cached data dictionary metadata
- **Result Cache (12c+):** Cached query result sets

```sql
-- Shared pool size
SELECT component, current_size / 1024 / 1024 AS mb
FROM   v$sga_dynamic_components
WHERE  component IN ('shared pool', 'large pool', 'java pool', 'streams pool');

-- Library cache health
SELECT namespace,
       gets,
       gethits,
       ROUND(gethitratio * 100, 2)  AS get_hit_pct,
       pins,
       pinhits,
       ROUND(pinhitratio * 100, 2)  AS pin_hit_pct,
       reloads,
       invalidations
FROM   v$librarycache
ORDER  BY gets DESC
FETCH  FIRST 10 ROWS ONLY;
-- Pin hit ratio and get hit ratio should both be > 99%

-- Dictionary cache (row cache) miss rates
SELECT parameter,
       gets,
       getmisses,
       ROUND(getmisses / NULLIF(gets, 0) * 100, 2) AS miss_pct
FROM   v$rowcache
WHERE  gets > 0
ORDER  BY getmisses DESC
FETCH  FIRST 15 ROWS ONLY;
-- Miss rate should be < 2% for established workloads

-- Shared pool free memory
SELECT name, bytes / 1024 / 1024 AS mb
FROM   v$sgastat
WHERE  pool = 'shared pool'
  AND  name = 'free memory';
-- If near zero, shared pool may be undersized or heavily fragmented
```

### Shared Pool Fragmentation

Over time, many small allocations and deallocations can fragment the shared pool, leading to `ORA-04031: unable to allocate N bytes of shared memory` errors even when total free memory exists.

```sql
-- Look for allocation failures
SELECT name, value
FROM   v$sysstat
WHERE  name LIKE '%shared pool%';

-- Shared pool reserved area stats (V$SHARED_POOL_RESERVED)
-- Key columns: FREE_SPACE, USED_SPACE, REQUEST_FAILURES, LAST_FAILURE_SIZE
-- (V$SHARED_POOL_RESERVED does NOT have CHUNK_SIZE or CHUNK_TYPE columns)
SELECT free_space,
       avg_free_size,
       free_count,
       used_space,
       avg_used_size,
       used_count,
       request_failures,
       last_failure_size
FROM   v$shared_pool_reserved;

-- Pin objects in shared pool to prevent eviction and reduce fragmentation
-- (for frequently used PL/SQL packages)
BEGIN
  DBMS_SHARED_POOL.KEEP('HR.ORDER_PROCESSING', 'P');  -- P = Package
  DBMS_SHARED_POOL.KEEP('SYS.STANDARD', 'P');
END;
/

-- View pinned objects
SELECT owner, name, type, kept
FROM   v$db_object_cache
WHERE  kept = 'YES';
```

### Large Pool

The large pool is a separate memory pool for specific large allocations that would otherwise crowd the shared pool:

- RMAN backup/restore operations
- Parallel query message buffers
- Shared server (`UGA` memory for connection pooling)
- Oracle XA transaction management

```sql
-- Check large pool usage
SELECT name, bytes / 1024 / 1024 AS mb
FROM   v$sgastat
WHERE  pool = 'large pool'
ORDER  BY bytes DESC;

-- Set large pool size
ALTER SYSTEM SET LARGE_POOL_SIZE = 256M;
```

**Rule of thumb:** Size large pool based on expected RMAN parallelism × channel buffer sizes + parallel query slave count × message buffer size.

### Redo Log Buffer

The redo log buffer is a circular buffer in the SGA that holds redo records before they are written to the online redo log files by LGWR.

```sql
-- Redo log buffer size
SELECT name, bytes / 1024 AS kb
FROM   v$sgainfo
WHERE  name = 'Redo Buffers';

-- Redo buffer contention
SELECT name, value
FROM   v$sysstat
WHERE  name IN ('redo log space requests',
                'redo log space wait time',
                'redo buffer allocation retries');
-- 'redo log space requests' > 0 may indicate redo buffer is too small

-- Current redo parameter
SELECT name, value FROM v$parameter WHERE name = 'log_buffer';
```

**Sizing guidance:** Default is typically adequate (3-15 MB). Increase if `redo log space requests > 0` or redo buffer hit ratio is low. Large values (> 64MB) rarely help more.

---

## PGA Memory Management

The PGA is per-session private memory. Key consumers:

- **Sort Area:** `ORDER BY`, `GROUP BY`, `DISTINCT`, index creation
- **Hash Area:** Hash joins, hash aggregation
- **Bitmap Area:** Bitmap merge operations
- **Session State:** Cursor state, bind variables, execution context

### Automatic PGA Management (Recommended)

```sql
-- Enable automatic PGA management
ALTER SYSTEM SET WORKAREA_SIZE_POLICY = AUTO;     -- default
ALTER SYSTEM SET PGA_AGGREGATE_TARGET = 2G;        -- total target for all sessions

-- 12c+: Hard limit on PGA (prevents runaway queries from crashing the instance)
ALTER SYSTEM SET PGA_AGGREGATE_LIMIT = 4G;
-- Must be >= 2 * PGA_AGGREGATE_TARGET

-- Check current PGA usage vs. target
SELECT name, value
FROM   v$pgastat
WHERE  name IN (
  'aggregate PGA target parameter',
  'aggregate PGA auto target',
  'total PGA inuse',
  'total PGA allocated',
  'maximum PGA allocated',
  'total freeable PGA memory',
  'cache hit percentage',
  'recompute count (total)'
);
-- Cache hit percentage should be > 90% for most workloads
```

### PGA Advisory

```sql
-- How much would increasing PGA reduce temp I/O?
SELECT pga_target_for_estimate / 1024 / 1024   AS pga_target_mb,
       pga_target_factor,
       estd_pga_cache_hit_percentage,
       estd_overalloc_count   -- non-zero means PGA is too small
FROM   v$pga_target_advice
ORDER  BY pga_target_for_estimate;
-- Look for the point where cache_hit_pct plateaus and overalloc_count = 0
```

### PGA Usage per Session

```sql
-- Top PGA consumers
SELECT s.sid,
       s.username,
       s.program,
       s.sql_id,
       p.pga_used_mem / 1024 / 1024     AS pga_used_mb,
       p.pga_alloc_mem / 1024 / 1024    AS pga_alloc_mb,
       p.pga_max_mem / 1024 / 1024      AS pga_max_mb
FROM   v$session s
JOIN   v$process p ON s.paddr = p.addr
WHERE  s.type = 'USER'
ORDER  BY p.pga_used_mem DESC
FETCH  FIRST 10 ROWS ONLY;
```

### Sort Spills to Temp

When the work area for a sort or hash join is too small, Oracle spills to the TEMP tablespace (disk). This dramatically slows operations.

```sql
-- Detect sort spills right now
SELECT s.sid,
       s.username,
       s.sql_id,
       su.blocks * (SELECT TO_NUMBER(value) FROM v$parameter WHERE name = 'db_block_size')
         / 1024 / 1024 AS temp_mb
FROM   v$sort_usage su
JOIN   v$session s ON su.session_addr = s.saddr
ORDER  BY su.blocks DESC;

-- Historical: how many sorts went to disk?
SELECT name, value
FROM   v$sysstat
WHERE  name IN ('sorts (memory)', 'sorts (disk)');
-- 'sorts (disk)' should be a very small fraction of 'sorts (memory)'

-- From AWR:
SELECT snap_id,
       sorts_disk,
       sorts_mem,
       ROUND(sorts_disk * 100.0 / NULLIF(sorts_disk + sorts_mem, 0), 2) AS pct_disk
FROM (
  SELECT snap_id,
         SUM(CASE WHEN stat_name = 'sorts (disk)'   THEN value END) AS sorts_disk,
         SUM(CASE WHEN stat_name = 'sorts (memory)' THEN value END) AS sorts_mem
  FROM   dba_hist_sysstat
  WHERE  stat_name IN ('sorts (disk)', 'sorts (memory)')
    AND  snap_id BETWEEN 200 AND 210
  GROUP  BY snap_id
)
ORDER  BY snap_id;
```

---

## AMM vs. ASMM

### Automatic Memory Management (AMM)

AMM manages both SGA and PGA automatically. Set only `MEMORY_TARGET` and optionally `MEMORY_MAX_TARGET`.

```sql
-- Enable AMM
ALTER SYSTEM SET MEMORY_TARGET     = 8G SCOPE = SPFILE;
ALTER SYSTEM SET MEMORY_MAX_TARGET = 12G SCOPE = SPFILE;
-- When AMM is active, SGA_TARGET and PGA_AGGREGATE_TARGET become sub-limits or are set to 0
-- Requires /dev/shm (tmpfs) on Linux to be large enough

-- Check AMM is active
SELECT name, value
FROM   v$parameter
WHERE  name IN ('memory_target', 'memory_max_target', 'sga_target', 'pga_aggregate_target');
```

**AMM Pros:** Lowest administrative burden; Oracle moves memory between SGA and PGA dynamically based on demand.

**AMM Cons:**
- Not supported with HugePages on Linux (significant performance regression on large instances)
- Less predictable; memory can shift unexpectedly
- Not recommended for most production deployments on Linux with large memory

### Automatic Shared Memory Management (ASMM)

ASMM manages SGA components automatically. You set `SGA_TARGET` and optionally minimum sizes per component. PGA is managed separately via `PGA_AGGREGATE_TARGET`.

```sql
-- Enable ASMM (recommended for most production Linux deployments)
ALTER SYSTEM SET MEMORY_TARGET  = 0;        -- disable AMM
ALTER SYSTEM SET SGA_TARGET     = 16G;
ALTER SYSTEM SET PGA_AGGREGATE_TARGET = 4G;

-- Optional: set minimum sizes for components (Oracle won't shrink below these)
ALTER SYSTEM SET DB_CACHE_SIZE     = 4G;      -- minimum for buffer cache
ALTER SYSTEM SET SHARED_POOL_SIZE  = 1G;      -- minimum for shared pool
ALTER SYSTEM SET LARGE_POOL_SIZE   = 256M;    -- minimum for large pool

-- SGA advisory (ASMM): how should Oracle distribute within SGA_TARGET?
SELECT component,
       current_size / 1024 / 1024     AS current_mb,
       min_size / 1024 / 1024         AS min_mb,
       oper_count,
       last_oper_type
FROM   v$sga_dynamic_components
ORDER  BY current_size DESC;
```

### SGA_TARGET Advice

```sql
-- Would increasing SGA_TARGET help? (ASMM only)
SELECT sga_size          AS sga_mb,
       sga_size_factor,
       estd_db_time,
       estd_db_time_factor,
       estd_physical_reads
FROM   v$sga_target_advice
ORDER  BY sga_size;
-- Look for the "knee" where doubling SGA produces < 10% more improvement
```

---

## V$SGA Summary Views

```sql
-- High-level SGA summary
SELECT name, bytes / 1024 / 1024 AS mb
FROM   v$sga
ORDER  BY bytes DESC;

-- Detailed SGA components
SELECT pool, name, bytes / 1024 / 1024 AS mb
FROM   v$sgastat
ORDER  BY bytes DESC
FETCH  FIRST 20 ROWS ONLY;

-- SGA info (12c+)
SELECT name, bytes / 1024 / 1024 AS mb, resizeable
FROM   v$sgainfo
ORDER  BY bytes DESC;

-- Maximum SGA and PGA since instance startup
SELECT name, value / 1024 / 1024 AS max_mb
FROM   v$pgastat
WHERE  name = 'maximum PGA allocated';
```

---

## HugePages Configuration (Linux)

On Linux systems, using HugePages (2MB pages instead of 4KB) for the SGA dramatically reduces TLB (Translation Lookaside Buffer) pressure and avoids page swapping.

```sql
-- Find current SGA size to calculate HugePages needed
SELECT SUM(bytes) / 1024 / 1024 AS total_sga_mb
FROM   v$sgainfo
WHERE  name != 'Free SGA Memory Available';
```

```bash
# Linux: calculate required HugePages
# SGA (MB) / 2 = number of 2MB HugePages needed (plus ~10% buffer)
# Set in /etc/sysctl.conf:
# vm.nr_hugepages = <calculated value>

# Verify current HugePages
grep -i huge /proc/meminfo
```

**Important:** When using HugePages, set `USE_LARGE_PAGES = ONLY` in Oracle init parameters. Also, `MEMORY_TARGET` (AMM) **cannot** use HugePages — this is why ASMM is preferred on Linux production systems.

```sql
ALTER SYSTEM SET USE_LARGE_PAGES = ONLY SCOPE = SPFILE;
-- If not enough HugePages, instance startup will fail
-- Use 'TRUE' to fall back to regular pages if HugePages unavailable
```

---

## Memory Tuning Workflow

```sql
-- Step 1: Check current memory configuration
SELECT name, value
FROM   v$parameter
WHERE  name IN ('sga_target', 'sga_max_size', 'pga_aggregate_target',
                'pga_aggregate_limit', 'memory_target', 'db_cache_size',
                'shared_pool_size', 'large_pool_size', 'log_buffer');

-- Step 2: Check for memory pressure indicators
SELECT name, value
FROM   v$sysstat
WHERE  name IN ('free buffer waits',      -- buffer cache too small
                'redo log space requests', -- redo buffer too small
                'sorts (disk)',            -- PGA too small
                'parse count (hard)');    -- shared pool / bind variable issue

-- Step 3: Check advisory views
-- Buffer cache:
SELECT size_for_estimate, estd_physical_reads FROM v$db_cache_advice
WHERE  name = 'DEFAULT' ORDER BY size_for_estimate;
-- Shared pool:
SELECT shared_pool_size_for_estimate, estd_lc_size, estd_lc_memory_objects
FROM   v$shared_pool_advice ORDER BY shared_pool_size_for_estimate;
-- PGA:
SELECT pga_target_for_estimate, estd_pga_cache_hit_percentage FROM v$pga_target_advice
ORDER  BY pga_target_for_estimate;

-- Step 4: Apply changes (ASMM example)
-- If buffer cache advice shows significant read reduction at higher sizes:
ALTER SYSTEM SET SGA_TARGET = 20G;  -- Oracle redistributes
-- If PGA overalloc_count > 0:
ALTER SYSTEM SET PGA_AGGREGATE_TARGET = 6G;
```

---

## Best Practices

- **Prefer ASMM + HugePages on Linux production** over AMM. HugePages provide significant performance benefits for large SGA, but are incompatible with AMM.
- **Set `SGA_MAX_SIZE` >= `SGA_TARGET`** to allow dynamic growth without restart.
- **Pin frequently-used packages in shared pool** with `DBMS_SHARED_POOL.KEEP` to reduce fragmentation and prevent eviction under pressure.
- **Monitor `free buffer waits` and `sorts (disk)`** as early warning signals of memory pressure.
- **Use advisory views** (`V$DB_CACHE_ADVICE`, `V$PGA_TARGET_ADVICE`, `V$SHARED_POOL_ADVICE`) before making memory changes — they show expected impact.
- **Leave OS headroom.** Do not allocate 100% of RAM to Oracle. Reserve at least 10-20% for the OS, file system cache (if not using direct I/O), and other processes.
- **Size large pool** explicitly when using RMAN parallel channels or many parallel query slaves.

```sql
-- Shared pool advice
SELECT shared_pool_size_for_estimate / 1024 / 1024 AS sp_mb,
       estd_lc_size / 1024 / 1024                  AS lc_mb,
       estd_lc_memory_objects,
       estd_lc_time_saved_factor
FROM   v$shared_pool_advice
ORDER  BY shared_pool_size_for_estimate;
-- Diminishing returns visible in estd_lc_time_saved_factor
```

---

## Common Mistakes

| Mistake | Impact | Fix |
|---|---|---|
| Using AMM with HugePages on Linux | HugePages silently not used; TLB thrashing | Use ASMM; disable AMM (`MEMORY_TARGET=0`) |
| Setting `SGA_TARGET` = total RAM | OS starvation; swap usage | Leave 20% of RAM for OS |
| Not setting `PGA_AGGREGATE_LIMIT` (12c+) | Runaway query can exhaust all RAM | Always set limit >= 2x target |
| Undersizing LARGE_POOL for RMAN | RMAN allocates from shared pool; fragmentation | Set large pool based on channel count × buffer size |
| Ignoring `estd_overalloc_count` in PGA advice | Confirms PGA is undersized | Increase PGA until overalloc_count = 0 |
| Pinning everything in shared pool | Evicts needed objects; wastes space | Only pin large, frequently invalidated packages |
| Setting individual SGA component sizes with ASMM enabled | Creates rigid sub-limits; defeats ASMM flexibility | If using ASMM, set only minimum sizes as guards |
| Forgetting to resize `/dev/shm` on Linux after increasing MEMORY_TARGET | ORA-00845 on startup | Increase `/dev/shm` to >= MEMORY_MAX_TARGET |

---

## Sources

- [Oracle Database 19c Performance Tuning Guide (TGDBA)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgdba/)
- [V$SGA — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SGA.html)
- [V$PGASTAT — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-PGASTAT.html)
- [V$DB_CACHE_ADVICE — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-DB_CACHE_ADVICE.html)
- [V$PGA_TARGET_ADVICE — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-PGA_TARGET_ADVICE.html)
- [DBMS_SHARED_POOL — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SHARED_POOL.html)
