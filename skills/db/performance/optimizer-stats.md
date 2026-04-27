# Optimizer Statistics — Collection, Management, and Tuning

## Overview

The Oracle Cost-Based Optimizer (CBO) relies entirely on statistics to estimate the cost of different execution plans. Accurate statistics allow the optimizer to choose efficient plans; stale or absent statistics lead to bad cardinality estimates, wrong join orders, and poor plan choices.

Statistics include:
- **Table statistics:** row count, block count, average row length
- **Column statistics:** number of distinct values (NDV), nulls count, low/high value, histograms
- **Index statistics:** clustering factor, leaf blocks, index height
- **System statistics:** CPU speed, I/O throughput (multiblock read cost, single-block read cost)

The primary tool for managing statistics is the `DBMS_STATS` package.

---

## Gathering Statistics with DBMS_STATS

### Gather Table Statistics

```sql
-- Basic gather with auto-sample size (recommended default)
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS(
    ownname   => 'HR',
    tabname   => 'EMPLOYEES',
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,  -- Oracle determines sample
    method_opt       => 'FOR ALL COLUMNS SIZE AUTO',   -- auto histograms
    cascade          => TRUE,                          -- also gather index stats
    no_invalidate    => FALSE                          -- invalidate cursors immediately
  );
END;
/
```

### Gather Schema Statistics

```sql
-- Gather all tables in a schema
BEGIN
  DBMS_STATS.GATHER_SCHEMA_STATS(
    ownname          => 'HR',
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
    method_opt       => 'FOR ALL COLUMNS SIZE AUTO',
    cascade          => TRUE,
    degree           => 4,          -- parallel degree for large schemas
    options          => 'GATHER'    -- GATHER, GATHER STALE, GATHER EMPTY, or LIST STALE
  );
END;
/
```

### Gather Database Statistics

```sql
-- Gather all schemas (DBA privilege required)
BEGIN
  DBMS_STATS.GATHER_DATABASE_STATS(
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
    method_opt       => 'FOR ALL COLUMNS SIZE AUTO',
    cascade          => TRUE,
    options          => 'GATHER STALE'  -- only objects with stale stats
  );
END;
/
```

### Gather Index Statistics

```sql
-- Gather stats on a specific index
BEGIN
  DBMS_STATS.GATHER_INDEX_STATS(
    ownname  => 'HR',
    indname  => 'EMP_SALARY_IX',
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE
  );
END;
/
```

---

## Viewing Current Statistics

```sql
-- Table-level statistics
SELECT table_name,
       num_rows,
       blocks,
       avg_row_len,
       last_analyzed,
       stale_stats
FROM   dba_tab_statistics
WHERE  owner = 'HR'
ORDER  BY table_name;

-- Column-level statistics
SELECT column_name,
       num_distinct,
       num_nulls,
       density,
       low_value,
       high_value,
       histogram,
       num_buckets,
       last_analyzed
FROM   dba_tab_col_statistics
WHERE  owner      = 'HR'
  AND  table_name = 'ORDERS';

-- Index statistics
SELECT index_name,
       clustering_factor,
       num_rows,
       leaf_blocks,
       blevel,           -- index height (depth)
       last_analyzed
FROM   dba_ind_statistics
WHERE  owner      = 'HR'
  AND  table_name = 'ORDERS';
```

### Clustering Factor

The clustering factor measures how well a table's row order matches the index order. A low value (close to number of blocks) is ideal. A high value (close to number of rows) means the index will cause many random I/Os.

```sql
-- High clustering factor indicates poor row order relative to index
-- If clustering_factor >> blocks, consider reordering table (CREATE TABLE AS SELECT ... ORDER BY indexed_col)
-- or using an IOT (Index Organized Table)
SELECT i.index_name,
       i.clustering_factor,
       t.blocks,
       t.num_rows,
       ROUND(i.clustering_factor / NULLIF(t.blocks, 0), 1) AS cf_to_blocks_ratio
FROM   dba_indexes i
JOIN   dba_tables  t ON i.owner = t.owner AND i.table_name = t.table_name
WHERE  i.owner = 'HR'
  AND  i.table_name = 'ORDERS'
ORDER  BY i.clustering_factor DESC;
```

---

## Stale Stats Detection

Oracle marks statistics as STALE when more than 10% of rows have been modified since the last gather.

```sql
-- List tables with stale or no statistics
SELECT owner,
       table_name,
       num_rows,
       last_analyzed,
       stale_stats,
       stattype_locked
FROM   dba_tab_statistics
WHERE  owner        = 'HR'
  AND  (stale_stats = 'YES' OR last_analyzed IS NULL)
ORDER  BY last_analyzed NULLS FIRST;

-- Check DML modification counts for staleness assessment
SELECT table_owner,
       table_name,
       inserts,
       updates,
       deletes,
       timestamp,
       ROUND((inserts + updates + deletes) / NULLIF(num_rows, 0) * 100, 2) AS pct_modified
FROM   dba_tab_modifications m
JOIN   dba_tables t ON m.table_owner = t.owner AND m.table_name = t.table_name
WHERE  table_owner = 'HR'
ORDER  BY pct_modified DESC;

-- Note: DBA_TAB_MODIFICATIONS is lazily flushed from memory; force flush:
EXEC DBMS_STATS.FLUSH_DATABASE_MONITORING_INFO;
```

---

## Histograms

Histograms capture data distribution for columns with skewed values. Without histograms, the optimizer assumes uniform distribution, which leads to bad estimates for skewed columns.

### When to Use Histograms

- Column has **data skew** (some values appear much more frequently than others)
- Column is used in `WHERE` predicates
- Column has low-to-medium cardinality with uneven distribution

**Examples:** status codes (90% 'COMPLETED', 5% 'PENDING', 5% 'FAILED'), US state codes, product categories.

### Histogram Types

| Type | When Used | Description |
|---|---|---|
| `NONE` | No histogram | Uniform distribution assumed |
| `FREQUENCY` | NDV <= 254 | One bucket per distinct value; exact frequencies |
| `TOP-FREQUENCY` | NDV > 254 but 254 values cover > threshold% | Stores most frequent values |
| `HEIGHT-BALANCED` | Legacy (pre-12c) | Endpoint values for equal-height buckets |
| `HYBRID` | NDV > 254 (12c+) | Combines frequency and height-balanced |

```sql
-- Gather stats with histogram on specific columns
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS(
    ownname   => 'HR',
    tabname   => 'ORDERS',
    method_opt => 'FOR COLUMNS SIZE 254 STATUS, REGION SIZE AUTO'
    -- SIZE 254: create frequency histogram with up to 254 buckets
    -- SIZE AUTO: Oracle decides whether histogram is needed
    -- SIZE SKEWONLY: histogram only if data is skewed
  );
END;
/

-- View histogram data
SELECT endpoint_number,
       endpoint_value,
       endpoint_actual_value
FROM   dba_histograms
WHERE  owner       = 'HR'
  AND  table_name  = 'ORDERS'
  AND  column_name = 'STATUS'
ORDER  BY endpoint_number;

-- Check which columns have histograms
SELECT column_name,
       histogram,
       num_buckets
FROM   dba_tab_col_statistics
WHERE  owner      = 'HR'
  AND  table_name = 'ORDERS'
  AND  histogram  != 'NONE';
```

### When NOT to Use Histograms

- Column values are truly uniform (no skew) — histogram adds overhead without benefit
- Column is never used in a `WHERE` predicate
- Column is always accessed with bind variables AND you rely on bind variable peeking (histograms interact badly with bind peeking in some cases; consider `CURSOR_SHARING` behavior)

---

## Extended Statistics

Extended statistics allow the optimizer to account for **correlated columns** or **expressions** in predicates. Without them, the optimizer multiplies individual column selectivities, which underestimates or overestimates row counts when columns are correlated.

### Column Group Statistics (Correlated Columns)

```sql
-- Problem: Two correlated columns (MAKE, MODEL) are filtered together
-- SELECT * FROM cars WHERE make = 'TOYOTA' AND model = 'CAMRY'
-- Without extended stats: selectivity = P(make=TOYOTA) * P(model=CAMRY) [incorrect]
-- With extended stats: optimizer uses joint distribution [correct]

-- Create column group extended statistics
DECLARE
  l_cg_name VARCHAR2(30);
BEGIN
  l_cg_name := DBMS_STATS.CREATE_EXTENDED_STATS(
    ownname    => 'SALES',
    tabname    => 'CARS',
    extension  => '(MAKE, MODEL)'
  );
  DBMS_OUTPUT.PUT_LINE('Created: ' || l_cg_name);
END;
/

-- Gather stats (must re-gather after creating extended stats)
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS(
    ownname   => 'SALES',
    tabname   => 'CARS',
    method_opt => 'FOR ALL COLUMNS SIZE AUTO FOR COLUMNS (MAKE, MODEL) SIZE AUTO'
  );
END;
/

-- View extended statistics
SELECT extension_name, extension
FROM   dba_stat_extensions
WHERE  owner      = 'SALES'
  AND  table_name = 'CARS';
```

### Expression Statistics (Virtual Column Stats)

```sql
-- Optimizer can also have stats on expressions
-- Useful when a function-based index exists

-- Create expression extended stats
DECLARE
  l_cg_name VARCHAR2(30);
BEGIN
  l_cg_name := DBMS_STATS.CREATE_EXTENDED_STATS(
    ownname   => 'HR',
    tabname   => 'EMPLOYEES',
    extension => '(UPPER(LAST_NAME))'
  );
END;
/
```

---

## Locking Statistics

Lock statistics to prevent automatic or manual regathering from overwriting known-good statistics for specific objects. This is useful for staging and test data fixtures or when a specific plan must be preserved.

```sql
-- Lock stats on a table (prevents any regathering)
BEGIN
  DBMS_STATS.LOCK_TABLE_STATS(
    ownname  => 'HR',
    tabname  => 'REFERENCE_DATA'
  );
END;
/

-- Lock all stats in a schema
BEGIN
  DBMS_STATS.LOCK_SCHEMA_STATS(ownname => 'HR');
END;
/

-- Unlock (restore to normal gathering)
BEGIN
  DBMS_STATS.UNLOCK_TABLE_STATS(
    ownname  => 'HR',
    tabname  => 'REFERENCE_DATA'
  );
END;
/

-- View locked stats
SELECT table_name, stattype_locked
FROM   dba_tab_statistics
WHERE  owner         = 'HR'
  AND  stattype_locked IS NOT NULL;
```

---

## Import and Export Statistics

Exporting statistics allows you to:
- Copy production stats to a test/dev environment for realistic testing
- Save known-good stats before a regather (rollback capability)
- Transfer stats between database versions

```sql
-- Create a stats staging table
BEGIN
  DBMS_STATS.CREATE_STAT_TABLE(
    ownname   => 'HR',
    stattab   => 'SAVED_STATS'
  );
END;
/

-- Export stats for a table into the staging table
BEGIN
  DBMS_STATS.EXPORT_TABLE_STATS(
    ownname  => 'HR',
    tabname  => 'ORDERS',
    stattab  => 'SAVED_STATS',
    statid   => 'PRE_UPGRADE_STATS'  -- label for this export
  );
END;
/

-- Export entire schema
BEGIN
  DBMS_STATS.EXPORT_SCHEMA_STATS(
    ownname  => 'HR',
    stattab  => 'SAVED_STATS',
    statid   => 'SCHEMA_BACKUP_20260306'
  );
END;
/

-- Import stats back (rollback to previous stats)
BEGIN
  DBMS_STATS.IMPORT_TABLE_STATS(
    ownname  => 'HR',
    tabname  => 'ORDERS',
    stattab  => 'SAVED_STATS',
    statid   => 'PRE_UPGRADE_STATS',
    no_invalidate => FALSE
  );
END;
/

-- View pending stats (12c+: stats can be set to pending, tested, then published)
SELECT table_name, last_analyzed
FROM   dba_tab_pending_stats
WHERE  owner = 'HR';

-- Publish pending stats
BEGIN
  DBMS_STATS.PUBLISH_PENDING_STATS(ownname => 'HR', tabname => 'ORDERS');
END;
/
```

---

## Automatic Statistics Collection

Oracle's automatic maintenance jobs (Autotask) gather statistics on stale and missing objects during maintenance windows.

```sql
-- View automatic maintenance job status
SELECT client_name, status, consumer_group, mean_job_duration
FROM   dba_autotask_client
WHERE  client_name = 'auto optimizer stats collection';

-- View maintenance windows
SELECT window_name, enabled, duration, repeat_interval
FROM   dba_scheduler_windows
WHERE  enabled = 'TRUE'
ORDER  BY window_name;

-- Disable automatic stats collection (use with caution)
BEGIN
  DBMS_AUTO_TASK_ADMIN.DISABLE(
    client_name  => 'auto optimizer stats collection',
    operation    => NULL,
    window_name  => NULL
  );
END;
/
```

---

## Pending Statistics (Non-Disruptive Testing)

In Oracle 11g+, you can set new statistics to "pending" state, test them without affecting other sessions, then publish or discard.

```sql
-- Set preference: new stats are pending, not published immediately
BEGIN
  DBMS_STATS.SET_TABLE_PREFS(
    ownname  => 'HR',
    tabname  => 'ORDERS',
    pname    => 'PUBLISH',
    pval     => 'FALSE'
  );
END;
/

-- Gather stats (they go to pending, not live)
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS(ownname => 'HR', tabname => 'ORDERS');
END;
/

-- Test using pending stats in your session
ALTER SESSION SET OPTIMIZER_USE_PENDING_STATISTICS = TRUE;

-- Run explain plan or test queries...

-- Publish if satisfied
BEGIN
  DBMS_STATS.PUBLISH_PENDING_STATS(ownname => 'HR', tabname => 'ORDERS');
END;
/

-- Discard pending stats if not satisfied
BEGIN
  DBMS_STATS.DELETE_PENDING_STATS(ownname => 'HR', tabname => 'ORDERS');
END;
/
```

---

## Best Practices

- **Use `AUTO_SAMPLE_SIZE`** — Oracle's incremental statistics algorithm produces accurate stats with minimal overhead in 11g+. Fixed sample sizes (e.g., 10%) are rarely better.
- **Use incremental statistics for partitioned tables** — avoids full re-scan of unchanged partitions.

```sql
BEGIN
  DBMS_STATS.SET_TABLE_PREFS(
    ownname  => 'HR',
    tabname  => 'SALES_PART',
    pname    => 'INCREMENTAL',
    pval     => 'TRUE'
  );
END;
/
```

- **Gather stats after bulk loads before running queries** — a batch that inserts millions of rows makes stats stale immediately.
- **Export stats before major changes** (upgrades, schema changes) so you can restore the previous state if plan regressions occur.
- **Use `METHOD_OPT => 'FOR ALL COLUMNS SIZE AUTO'`** as the default — Oracle decides which columns need histograms based on workload feedback.
- **Check `STALE_STATS` before large batch jobs** — running a 2-hour batch against stale stats is common but avoidable.
- **Lock stats for reference/lookup tables** that rarely change but are used in many joins.

---

## Common Mistakes

| Mistake | Impact | Fix |
|---|---|---|
| Never gathering stats on new tables | Optimizer uses dynamic sampling; may be inaccurate | Gather stats after initial load |
| Using fixed sample size (e.g., 1%) | Inaccurate for skewed data | Use `AUTO_SAMPLE_SIZE` |
| Gathering stats with `NO_INVALIDATE=TRUE` always | Old plans persist with new stats | Set `FALSE` or use the default (deferred invalidation) |
| Forgetting to regather after creating extended stats | Extended stats exist but have no data | Always gather after `CREATE_EXTENDED_STATS` |
| Disabling autostats globally without a replacement | Stats go stale; plan regressions over time | Replace with a custom job; never just disable |
| Not locking stats on small lookup tables | Stats change unpredictably; optimizer changes join order | Lock stats for stable small tables |
| Histograms on columns with bind variables | Bind peeking + histogram can cause plan instability | Use `SIZE 1` (no histogram) or `CURSOR_SHARING=FORCE` carefully |

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Tuning Guide (TGSQL)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/)
- [DBMS_STATS — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_STATS.html)
- [DBMS_AUTO_TASK_ADMIN — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_AUTO_TASK_ADMIN.html)
- [DBA_TAB_STATISTICS — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_TAB_STATISTICS.html)
- [DBA_HISTOGRAMS — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_HISTOGRAMS.html)
