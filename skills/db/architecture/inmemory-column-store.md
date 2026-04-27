# Oracle In-Memory Column Store

## Overview

The Oracle Database In-Memory (DBIM) option, introduced in Oracle 12c Release 1 (12.1.0.2), adds a columnar memory store alongside the traditional row-format buffer cache. It is not a replacement for the row store — Oracle maintains both formats simultaneously and uses whichever is more efficient for a given operation. OLTP DML continues to operate against the row store; analytic queries that scan large portions of a table read from the columnar In-Memory store.

The primary benefit is analytic query acceleration: columnar storage, vectorized SIMD (Single Instruction Multiple Data) CPU instructions, and in-memory compression combine to accelerate full-scan analytic queries by 10x–100x compared to reading the same data from disk in row format.

DBIM is an Oracle Database option — it requires a separate license unless you are using Oracle Exadata (where it is included) or Oracle Autonomous Database (where it is included and managed automatically).

---

## 1. Architecture Overview

### Dual-Format Storage

Oracle maintains two representations of data for In-Memory populated objects:

| Format | Location | Used For |
|---|---|---|
| Row format | Buffer cache / disk | DML (INSERT, UPDATE, DELETE), PK/index lookups, small result sets |
| Columnar format | In-Memory Column Store (IMCS) | Full-scan analytic queries, aggregations, range predicates |

The IMCS is a separate memory pool allocated from the SGA. It is configured with the `INMEMORY_SIZE` initialization parameter and exists independently of `DB_CACHE_SIZE`.

### In-Memory Compression Units (IMCUs)

The IMCS stores data in **IMCUs (In-Memory Compression Units)**. Each IMCU:

- Contains a contiguous range of rows from one column segment
- Holds approximately 512,000 rows by default (adjustable)
- Stores one column per IMCU partition (columnar layout)
- Maintains a **min/max index** for each column within the IMCU (analogous to Exadata Storage Indexes)
- Is compressed using one of the In-Memory compression formats

### In-Memory Worker Processes

Populating objects into the IMCS is performed by background worker processes (`Wnnn`). These processes read segments from disk (or buffer cache) and populate the IMCS asynchronously. The number of worker processes is controlled by `INMEMORY_MAX_POPULATE_SERVERS`.

---

## 2. Configuring the In-Memory Column Store

### Enabling DBIM

```sql
-- Set the IMCS size (minimum 100 MB; meaningful from 1 GB+)
-- Requires database restart if not already set
ALTER SYSTEM SET INMEMORY_SIZE = 16G SCOPE = SPFILE;

-- In 12.1, this requires a restart. In 12.2+, it can be increased dynamically
-- (but cannot be decreased without a restart)
ALTER SYSTEM SET INMEMORY_SIZE = 24G;  -- increase only, no restart needed in 12.2+

-- Verify IMCS is active
SELECT name, value
FROM   v$parameter
WHERE  name IN ('inmemory_size', 'inmemory_max_populate_servers',
                'inmemory_query', 'inmemory_force')
ORDER  BY name;

-- Check IMCS memory area
SELECT pool, alloc_bytes / 1024 / 1024 / 1024 AS alloc_gb,
       used_bytes  / 1024 / 1024 / 1024 AS used_gb,
       populate_status
FROM   v$inmemory_area;
```

### In-Memory Initialization Parameters

| Parameter | Default | Description |
|---|---|---|
| `INMEMORY_SIZE` | 0 (disabled) | Size of the IMCS; set to enable In-Memory |
| `INMEMORY_MAX_POPULATE_SERVERS` | CPU count / 2 | Max background populate workers |
| `INMEMORY_QUERY` | ENABLE | ENABLE / DISABLE In-Memory query at instance level |
| `INMEMORY_FORCE` | DEFAULT | Force all tables into IMCS (PMEM, OFF, DEFAULT) |
| `INMEMORY_VIRTUAL_COLUMNS` | MANUAL | AUTO: also populate virtual columns; MANUAL: user-specified |
| `INMEMORY_CLAUSE_DEFAULT` | empty | Default INMEMORY attributes for all new objects |
| `INMEMORY_DEEP_VECTORIZATION` | TRUE | Enable advanced SIMD vectorization |
| `HEAT_MAP` | OFF | Required for Automatic Data Optimization (ADO) with INMEMORY |

---

## 3. Populating Objects into the IMCS

### Table-Level INMEMORY Clause

```sql
-- Enable INMEMORY on a table with default settings (MEMCOMPRESS FOR QUERY LOW)
ALTER TABLE sales INMEMORY;

-- Enable with a specific compression level
ALTER TABLE sales INMEMORY MEMCOMPRESS FOR QUERY HIGH;

-- Enable for analytic workloads (highest compression, acceptable query overhead)
ALTER TABLE sales INMEMORY MEMCOMPRESS FOR CAPACITY HIGH;

-- Priority controls when the object is populated relative to other objects
-- CRITICAL > HIGH > MEDIUM > LOW > NONE (NONE = populate on first access only)
ALTER TABLE sales INMEMORY
    MEMCOMPRESS FOR QUERY LOW
    PRIORITY HIGH;

-- Disable In-Memory for a specific table
ALTER TABLE sales NO INMEMORY;
```

### In-Memory Compression Levels

| MEMCOMPRESS Level | Compression Method | Typical Ratio | CPU Cost |
|---|---|---|---|
| `FOR DML` | No compression | 1x | None |
| `FOR QUERY LOW` | LZ4 (fast decompress) | 2x–4x | Very low |
| `FOR QUERY HIGH` | ZLIB (fast decompress) | 4x–8x | Low |
| `FOR CAPACITY LOW` | ZLIB (higher compression) | 8x–15x | Medium |
| `FOR CAPACITY HIGH` | BZIP2-equivalent | 15x–25x | Higher |

`FOR QUERY LOW` is the most common production choice: meaningful compression with near-zero decompression overhead during scans.

### Selective Column Population

Not all columns need to be in the IMCS. Excluding frequently-updated columns or rarely-queried columns reduces IMCS footprint.

```sql
-- Include only specific columns in the IMCS
ALTER TABLE sales
    INMEMORY MEMCOMPRESS FOR QUERY LOW
    (sale_date, region_id, product_id, amount, quantity)
    NO INMEMORY (customer_comments, audit_timestamp, last_updated_by);

-- Verify column-level INMEMORY settings
SELECT table_name, column_name, inmemory_compression
FROM   v$im_column_level
WHERE  table_name = 'SALES'
ORDER  BY column_name;
```

### Partition-Level INMEMORY

For very large partitioned tables, populate only the "hot" partitions into the IMCS.

```sql
-- Apply INMEMORY to the current and previous month's partitions only
ALTER TABLE sales MODIFY PARTITION sales_202502 INMEMORY PRIORITY HIGH;
ALTER TABLE sales MODIFY PARTITION sales_202503 INMEMORY PRIORITY CRITICAL;

-- Exclude older partitions from IMCS to conserve memory
ALTER TABLE sales MODIFY PARTITION sales_2024q1 NO INMEMORY;
ALTER TABLE sales MODIFY PARTITION sales_2024q2 NO INMEMORY;
ALTER TABLE sales MODIFY PARTITION sales_2024q3 NO INMEMORY;
ALTER TABLE sales MODIFY PARTITION sales_2024q4 NO INMEMORY;

-- Check partition-level In-Memory status
SELECT table_name, partition_name, inmemory,
       inmemory_priority, inmemory_compression
FROM   dba_tab_partitions
WHERE  table_name = 'SALES'
ORDER  BY partition_position DESC
FETCH  FIRST 10 ROWS ONLY;
```

### Forcing Immediate Population

By default, objects with `PRIORITY NONE` are populated only on first access. Objects with other priorities are populated by background workers after DB startup. To populate immediately:

```sql
-- Force immediate population of a table (blocks until complete)
EXEC DBMS_INMEMORY.POPULATE(schema_name => 'SCOTT', table_name => 'SALES');

-- Force immediate population of a specific partition
EXEC DBMS_INMEMORY.POPULATE(
    schema_name    => 'SCOTT',
    table_name     => 'SALES',
    subobject_name => 'SALES_202503'
);

-- Repopulate (useful after bulk DML that caused stale segments)
EXEC DBMS_INMEMORY.REPOPULATE(schema_name => 'SCOTT', table_name => 'SALES', force => FALSE);
```

---

## 4. Monitoring V$IM_SEGMENTS

`V$IM_SEGMENTS` is the primary monitoring view for the In-Memory Column Store.

```sql
-- View all currently populated segments
SELECT owner,
       segment_name,
       partition_name,
       segment_type,
       populate_status,
       bytes         / 1024 / 1024 AS disk_mb,
       inmemory_size / 1024 / 1024 AS imcs_mb,
       bytes_not_populated / 1024 / 1024 AS not_populated_mb,
       ROUND(inmemory_size / NULLIF(bytes, 0) * 100, 1) AS imcs_to_disk_pct
FROM   v$im_segments
ORDER  BY inmemory_size DESC;

-- Check population status
-- STARTED: populate worker has begun
-- COMPLETED: fully populated
-- FAILED: an error occurred during population
-- OUT OF MEMORY: IMCS is full
SELECT owner, segment_name, partition_name, populate_status
FROM   v$im_segments
WHERE  populate_status != 'COMPLETED'
ORDER  BY owner, segment_name;

-- IMCS usage summary
SELECT COUNT(*)                              AS populated_segments,
       SUM(bytes)         / 1024 / 1024 / 1024 AS total_disk_gb,
       SUM(inmemory_size) / 1024 / 1024 / 1024 AS total_imcs_gb,
       SUM(bytes_not_populated) / 1024 / 1024   AS not_populated_mb
FROM   v$im_segments;

-- Objects marked INMEMORY but not yet in the store
SELECT owner, segment_name, partition_name, priority
FROM   v$im_segments_detail
WHERE  populate_status = 'NOT POPULATED'
  AND  priority != 'NONE'
ORDER  BY priority DESC, owner, segment_name;
```

### IMCS Eviction and Repopulation

The IMCS uses an LRU-like eviction policy when it fills up. Lower-priority objects are evicted to make room for higher-priority ones.

```sql
-- Monitor IMCS pressure
SELECT pool,
       alloc_bytes / 1024 / 1024 / 1024 AS alloc_gb,
       used_bytes  / 1024 / 1024 / 1024 AS used_gb,
       ROUND(used_bytes / NULLIF(alloc_bytes, 0) * 100, 1) AS pct_used
FROM   v$inmemory_area;

-- Check for evictions
SELECT name, value
FROM   v$sysstat
WHERE  name IN (
    'IM populate segments requested',
    'IM populate segments completed',
    'IM repopulate (trickle) total',
    'IM repopulate (trickle) failed',
    'IM segments evicted',
    'IM scans'
)
ORDER  BY name;
```

---

## 5. Analytic Query Acceleration

The In-Memory Column Store dramatically accelerates queries with these patterns:

### Full-Scan Aggregations

```sql
-- This query directly benefits from IMCS columnar scanning
-- Oracle reads only the needed columns (region_id, sale_date, amount)
-- in vectorized SIMD instructions across contiguous memory
SELECT region_id,
       TRUNC(sale_date, 'MONTH') AS sale_month,
       COUNT(*)                  AS num_sales,
       SUM(amount)               AS total_amount,
       AVG(amount)               AS avg_amount,
       MAX(amount)               AS max_amount
FROM   sales
WHERE  sale_date >= DATE '2025-01-01'
GROUP  BY region_id, TRUNC(sale_date, 'MONTH')
ORDER  BY sale_month, region_id;

-- Verify the query used IMCS via execution plan
EXPLAIN PLAN FOR
SELECT region_id, SUM(amount) FROM sales GROUP BY region_id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Look for: TABLE ACCESS INMEMORY FULL
-- Also look for: VECTOR GROUP BY (In-Memory Aggregation)
```

### Verifying In-Memory Access in Execution Plans

```sql
-- Session-level: confirm IMCS was used
ALTER SESSION SET STATISTICS_LEVEL = ALL;

SELECT region_id, SUM(amount) FROM sales GROUP BY region_id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(FORMAT => 'ALLSTATS LAST'));
-- Key indicators in plan:
-- Operation "TABLE ACCESS INMEMORY FULL" = IMCS scan
-- Operation "VECTOR GROUP BY"            = In-Memory aggregation
-- "In-Memory Scan" note at bottom

-- Force or disable IMCS at session level for testing
ALTER SESSION SET INMEMORY_QUERY = ENABLE;   -- use IMCS (default)
ALTER SESSION SET INMEMORY_QUERY = DISABLE;  -- bypass IMCS (test baseline)
```

### IMCS Join Acceleration

The In-Memory Column Store also accelerates hash joins by enabling Bloom filter creation and application inside the IMCS. This is the **In-Memory Join Group** feature (12.2+).

```sql
-- Join groups pre-compute hash values for join columns, enabling
-- join predicate evaluation inside the IMCS without materializing rows

-- Create a join group on a frequently-joined column pair
CREATE INMEMORY JOIN GROUP jg_sales_products
    (sales(product_id), products(product_id));

-- Verify join groups
SELECT join_group_name, table_name, column_name
FROM   dba_joingroups
ORDER  BY join_group_name, table_name;

-- Queries joining on product_id now benefit from IMCS-level join processing
SELECT p.product_name,
       SUM(s.amount) AS total_revenue
FROM   sales s
JOIN   products p ON s.product_id = p.product_id
WHERE  s.sale_date >= DATE '2025-01-01'
GROUP  BY p.product_name
ORDER  BY total_revenue DESC;
```

---

## 6. In-Memory Aggregation (Vector Group By)

In-Memory Aggregation (IMA) is a 12c+ feature that transforms GROUP BY operations to execute as SIMD vector operations across IMCU data. Instead of processing rows one at a time, Oracle accumulates aggregates across the entire IMCU using vectorized CPU instructions.

### How Vector Group By Works

1. IMCS scan produces a stream of column vectors from IMCUs
2. For each IMCU, Oracle applies the GROUP BY in a vectorized pass, producing partial aggregates per IMCU
3. Final aggregation merges the partial results from all IMCUs

This is orders of magnitude faster than traditional hash aggregation on row data because:
- No row reconstruction (only needed columns are read)
- SIMD: one CPU instruction processes 8+ values simultaneously
- Cache-friendly: sequential memory access pattern

```sql
-- Verify Vector Group By is being used
SELECT operation, options, object_name, cardinality, bytes, cost
FROM   plan_table
WHERE  operation IN ('VECTOR GROUP BY', 'HASH GROUP BY', 'TABLE ACCESS')
ORDER  BY id;

-- Enable/disable In-Memory Aggregation
ALTER SESSION SET "_inmemory_vector_aggregation" = TRUE;  -- default

-- Force Vector Group By hint
SELECT /*+ VECTOR_TRANSFORM */
       sale_year, region_id, SUM(amount)
FROM   (SELECT EXTRACT(YEAR FROM sale_date) AS sale_year,
               region_id, amount
        FROM   sales)
GROUP  BY sale_year, region_id;
```

---

## 7. IMCS Sizing and Capacity Planning

### Estimating IMCS Requirements

```sql
-- Estimate IMCS size for a table before enabling INMEMORY
-- This executes a simulation to project the in-memory size
SELECT
    table_name,
    SUM(bytes) / 1024 / 1024 AS on_disk_mb,
    -- Rule of thumb: IMCS size = disk_size * compression_ratio
    -- FOR QUERY LOW: ~0.3-0.5x disk size (compression + column orientation)
    ROUND(SUM(bytes) / 1024 / 1024 * 0.4, 0) AS estimated_imcs_mb_low,
    ROUND(SUM(bytes) / 1024 / 1024 * 0.2, 0) AS estimated_imcs_mb_high
FROM   dba_segments
WHERE  owner = 'SCOTT'
  AND  segment_name IN ('SALES', 'ORDERS', 'PRODUCTS')
GROUP  BY table_name;

-- After actual population, measure actual IMCS footprint
-- (DBMS_INMEMORY_ADMIN does not have IMCS_BEGIN/IMCS_END procedures;
--  use POPULATE_WAIT or enable INMEMORY on objects and monitor V$IM_SEGMENTS)
SELECT SUM(inmemory_size) / 1024 / 1024 / 1024 AS total_imcs_gb
FROM   v$im_segments;

-- Check how much IMCS has been consumed vs. allocated
SELECT pool,
       alloc_bytes / 1024 / 1024 / 1024 AS alloc_gb,
       used_bytes  / 1024 / 1024 / 1024 AS used_gb
FROM   v$inmemory_area;
```

### IMCS Sizing Guidelines

| Scenario | Sizing Recommendation |
|---|---|
| All analytic tables in IMCS | Sum of (table_disk_size * compression_factor) + 20% overhead |
| Hot partitions only | Size for current + previous period partitions only |
| Mixed OLTP + analytics | 25–50% of active analytic data set; use priority to manage eviction |
| Autonomous Database (ATP) | Oracle manages IMCS automatically; no user action needed |

### Automatic In-Memory (AIM) in 19c+

Oracle 19c introduced Automatic In-Memory (AIM), which uses the Database Heat Map to automatically populate and evict objects from the IMCS based on actual access patterns.

```sql
-- Enable Heat Map (prerequisite for AIM)
ALTER SYSTEM SET HEAT_MAP = ON SCOPE = BOTH;

-- Enable Automatic In-Memory management
ALTER SYSTEM SET INMEMORY_AUTOMATIC_LEVEL = MEDIUM SCOPE = BOTH;
-- Levels: OFF (manual), LOW (only explicit INMEMORY objects managed),
--         MEDIUM (AIM populates/evicts based on heat)

-- Check AIM activity
SELECT *
FROM   dba_inmemory_aimtasks
FETCH  FIRST 20 ROWS ONLY;

-- Check Heat Map data
SELECT object_name, owner, track_time,
       full_scan, lookup_scan, n_full_scans
FROM   v$heat_map_segment
ORDER  BY full_scan DESC
FETCH  FIRST 20 ROWS ONLY;
```

---

## 8. Best Practices

- **Start with the most frequently scanned, most column-selective tables.** The IMCS yields the greatest benefit for wide tables (many columns) where queries access only a subset of columns. A narrow table (5 columns) with full-row access gains little.
- **Use `PRIORITY CRITICAL` for tables critical to SLA.** During database startup, populate workers fill IMCS in priority order. CRITICAL objects are populated first, ensuring they are ready before user load arrives.
- **Combine with partitioning for large tables.** Partition by time and keep only the "hot" partitions (current month, last 3 months) in the IMCS. This keeps IMCS footprint predictable and avoids eviction pressure.
- **Do not enable INMEMORY on tables with heavy UPDATE activity.** The IMCS is eventually consistent with the row store via IMCU journaling. Very high DML rates cause the IMCU journal to fill up, triggering repopulation and consuming populate workers. Use IMCS for tables with low-to-moderate DML.
- **Use join groups proactively.** If the same two tables are joined in >50% of analytic queries, a join group pre-computes hash values, enabling IMCS-level join processing without extracting and transferring rows to DB server buffers.
- **Monitor `bytes_not_populated` in `V$IM_SEGMENTS`.** A non-zero value means the IMCS ran out of room and could not fully populate a segment. This means queries against unpopulated extents fall back to disk reads. Either increase `INMEMORY_SIZE` or reduce the set of in-memory objects.

---

## 9. Common Mistakes and How to Avoid Them

### Mistake 1: Not Increasing INMEMORY_SIZE After Adding Objects

Adding `INMEMORY` to many tables without increasing `INMEMORY_SIZE` causes the IMCS to fill up. New objects fail to populate (or existing ones get evicted), and the query workload falls back to disk reads with no warning beyond a `populate_status = 'OUT OF MEMORY'` flag.

```sql
-- Check for OUT OF MEMORY populations
SELECT owner, segment_name, partition_name, populate_status
FROM   v$im_segments
WHERE  populate_status = 'OUT OF MEMORY';

-- Dynamically increase INMEMORY_SIZE if needed (12.2+, increase only)
ALTER SYSTEM SET INMEMORY_SIZE = 32G;
```

### Mistake 2: Enabling INMEMORY Without Enabling Parallel Query

For very large tables, the IMCS scan still benefits from parallel query (`PARALLEL` hint or `PARALLEL` clause on the table). Without parallel query, a serial IMCS scan on a 100 GB table is still a single-threaded operation. Pair IMCS with appropriate DOP.

```sql
-- Set table-level degree of parallelism for In-Memory scans
ALTER TABLE sales PARALLEL 8;

-- Or use hint at query level
SELECT /*+ PARALLEL(s, 8) */
       region_id, SUM(amount)
FROM   sales s
GROUP  BY region_id;
```

### Mistake 3: Assuming IMCS is Updated Synchronously

The IMCS is not updated in real time for every DML operation. Instead, Oracle uses IMCU journaling — DML changes are recorded in a small journal area within the IMCU, and periodic trickle repopulation merges the journal into the IMCU. Queries see the current (committed) data via journal merging, but there is a small window of extra CPU cost for highly concurrent DML tables.

Do not use `SELECT ... AS OF TIMESTAMP` against IMCS objects if you expect exact change tracking — use the row store query path instead.

### Mistake 4: Using CAPACITY Compression for Frequently Queried Tables

`MEMCOMPRESS FOR CAPACITY HIGH` achieves the highest compression ratio but uses a slower decompression algorithm. For tables scanned hundreds of times per hour, the decompression CPU cost becomes significant. Use `FOR QUERY LOW` or `FOR QUERY HIGH` for hot analytical tables.

### Mistake 5: Forgetting to REPOPULATE After Bulk Data Loads

After a large `INSERT /*+ APPEND */` or partition exchange operation, the IMCS copy of that segment is stale. Oracle will trickle-repopulate it in the background, but until repopulation completes, queries against the new data read from disk. For time-sensitive workloads, trigger explicit repopulation immediately after load.

```sql
-- After nightly bulk load completes, repopulate explicitly
EXEC DBMS_INMEMORY.REPOPULATE(
    schema_name    => 'DW_OWNER',
    table_name     => 'FACT_SALES',
    subobject_name => 'SALES_202503'
);

-- Monitor completion
SELECT segment_name, partition_name, populate_status, bytes_not_populated
FROM   v$im_segments
WHERE  segment_name = 'FACT_SALES'
  AND  partition_name = 'SALES_202503';
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database In-Memory Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/inmem/) — IMCS architecture, MEMCOMPRESS levels, population, monitoring
- [DBMS_INMEMORY (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_INMEMORY.html) — POPULATE and REPOPULATE procedures (parameter is `subobject_name`, not `partition_name`)
- [DBMS_INMEMORY_ADMIN (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_INMEMORY_ADMIN.html) — AIM parameters, FastStart, IME_CAPTURE_EXPRESSIONS
- [Oracle Database Reference 19c — V$IM_SEGMENTS](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-IM_SEGMENTS.html) — In-Memory segment monitoring view
