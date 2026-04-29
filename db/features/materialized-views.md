# Oracle Materialized Views

## Overview

A **materialized view (MV)** is a database object that stores the result of a query physically on disk and optionally refreshes that result as the underlying base tables change. Unlike a regular view — which re-executes its query every time it is referenced — a materialized view is a snapshot of query results that can be read with no recomputation cost.

Materialized views serve two broad purposes in Oracle:

1. **Query rewrite** — The optimizer transparently rewrites a user query to read from a fast, pre-aggregated MV instead of expensive base tables, without any application code change.
2. **Data replication** — Pushing a summarized or filtered copy of data to a different schema, database, or reporting tier for independent consumption.

Materialized views were introduced in Oracle 8i as a replacement for the older snapshot mechanism and have been continuously enhanced through 26ai.

---

## Core Concepts

### Refresh Modes

| Mode | Description | Use Case |
|---|---|---|
| `COMPLETE` | Truncates and re-populates the MV by re-executing the full query | Any query; least restrictions; slowest for large data sets |
| `FAST` | Applies only changes since the last refresh using MV logs | Large base tables with small incremental change |
| `FORCE` | Uses FAST if possible, falls back to COMPLETE | General default; good when FAST eligibility is uncertain |
| `NEVER` | MV is never refreshed automatically; must be refreshed manually | Static snapshots, data migration, staging |

### Refresh Timing

| Timing | Description |
|---|---|
| `ON COMMIT` | MV is refreshed automatically when a DML transaction on the base table(s) commits |
| `ON DEMAND` | MV is refreshed only when explicitly triggered via `DBMS_MVIEW.REFRESH` |
| `ON STATEMENT` | 12c+: Refresh triggers immediately after each DML statement, before commit |
| `START WITH ... NEXT ...` | Legacy syntax for scheduled refresh; prefer `DBMS_SCHEDULER` jobs in modern setups |

### Materialized View Logs

A **materialized view log (MV log)** is a change-capture table maintained on the base table. Every INSERT, UPDATE, and DELETE on the base table is recorded in the log. A FAST refresh reads the log instead of re-scanning the entire base table, then clears consumed entries.

---

## Creating Materialized View Logs

Before creating a FAST-refreshable MV, create a log on every base table referenced:

```sql
-- Basic MV log: captures all DML changes, including new values
CREATE MATERIALIZED VIEW LOG ON sales
WITH ROWID, SEQUENCE
    (sale_date, product_id, region_id, amount, qty)
INCLUDING NEW VALUES;

-- MV log on dimension table
CREATE MATERIALIZED VIEW LOG ON products
WITH ROWID, SEQUENCE (product_id, category_id, unit_price)
INCLUDING NEW VALUES;

CREATE MATERIALIZED VIEW LOG ON regions
WITH ROWID, SEQUENCE (region_id, region_name, country_code)
INCLUDING NEW VALUES;
```

**Key `WITH` options:**

| Option | Required for |
|---|---|
| `ROWID` | FAST refresh of non-aggregate (join) MVs |
| `PRIMARY KEY` | FAST refresh when MV uses primary key joins |
| `SEQUENCE` | FAST refresh of aggregate MVs (ORDER updates correctly) |
| `INCLUDING NEW VALUES` | FAST refresh of aggregate MVs with `SUM`, `COUNT`, etc. |

---

## Creating Materialized Views

### COMPLETE Refresh — Simple Aggregate

```sql
CREATE MATERIALIZED VIEW mv_monthly_sales_summary
BUILD IMMEDIATE           -- populate immediately on creation; BUILD DEFERRED populates later
REFRESH COMPLETE
ON DEMAND
AS
SELECT  TRUNC(s.sale_date, 'MM')  AS sale_month,
        p.category_id,
        r.region_name,
        COUNT(*)                   AS num_sales,
        SUM(s.amount)              AS total_revenue,
        SUM(s.qty)                 AS total_qty
FROM    sales    s
JOIN    products p ON p.product_id = s.product_id
JOIN    regions  r ON r.region_id  = s.region_id
GROUP   BY TRUNC(s.sale_date, 'MM'), p.category_id, r.region_name;
```

### FAST Refresh — Aggregate MV

FAST refresh on aggregate MVs requires the following in the MV query:
- `COUNT(*)` must be present
- For `SUM(col)`, `COUNT(col)` must also be present
- All dimensions must have MV logs with `SEQUENCE` and `INCLUDING NEW VALUES`

```sql
CREATE MATERIALIZED VIEW mv_sales_by_product_region
BUILD IMMEDIATE
REFRESH FAST ON DEMAND
ENABLE QUERY REWRITE
AS
SELECT  s.product_id,
        s.region_id,
        COUNT(*)              AS cnt,         -- required for FAST refresh
        SUM(s.amount)         AS sum_amount,
        COUNT(s.amount)       AS cnt_amount,  -- required for SUM fast refresh
        SUM(s.qty)            AS sum_qty,
        COUNT(s.qty)          AS cnt_qty
FROM    sales s
GROUP   BY s.product_id, s.region_id;
```

### FAST Refresh — Join MV

```sql
CREATE MATERIALIZED VIEW mv_sales_detail
BUILD IMMEDIATE
REFRESH FAST ON DEMAND
ENABLE QUERY REWRITE
AS
SELECT  s.rowid        AS sales_rowid,
        p.rowid        AS products_rowid,
        s.sale_id,
        s.sale_date,
        s.amount,
        p.product_name,
        p.category_id
FROM    sales    s
JOIN    products p ON p.product_id = s.product_id;
```

Join MVs for FAST refresh require both ROWIDs to be selected (Oracle uses them to identify changed rows in the log).

### ON COMMIT Refresh

```sql
CREATE MATERIALIZED VIEW mv_account_balances
BUILD IMMEDIATE
REFRESH FAST ON COMMIT   -- refreshed automatically when any base table transaction commits
ENABLE QUERY REWRITE
AS
SELECT  account_id,
        COUNT(*)         AS num_transactions,
        SUM(amount)      AS current_balance
FROM    transactions
GROUP   BY account_id;
```

**Caution:** `ON COMMIT` refresh runs synchronously within the committing transaction. Complex or slow refreshes will visibly slow down the application's commit latency.

### FORCE Refresh (Recommended Default)

```sql
CREATE MATERIALIZED VIEW mv_regional_totals
BUILD IMMEDIATE
REFRESH FORCE ON DEMAND
ENABLE QUERY REWRITE
AS
SELECT  r.region_name,
        TRUNC(s.sale_date, 'YYYY') AS sale_year,
        SUM(s.amount)              AS annual_revenue
FROM    sales   s
JOIN    regions r ON r.region_id = s.region_id
GROUP   BY r.region_name, TRUNC(s.sale_date, 'YYYY');
```

---

## Query Rewrite

Query rewrite is Oracle's ability to **transparently substitute** a user query referencing base tables with an equivalent query against a materialized view. This requires no application code change — the optimizer handles it.

### Enabling Query Rewrite

```sql
-- At the database level (requires DBA privileges)
ALTER SYSTEM SET query_rewrite_enabled = TRUE;

-- At the session level
ALTER SESSION SET query_rewrite_enabled = TRUE;

-- On the MV itself
ALTER MATERIALIZED VIEW mv_sales_by_product_region ENABLE QUERY REWRITE;

-- Check if MV is eligible for query rewrite
SELECT mview_name, rewrite_enabled, staleness, refresh_mode
FROM   user_mviews;
```

### Verifying Query Rewrite Is Being Used

```sql
-- Run EXPLAIN PLAN to see if the MV is substituted
EXPLAIN PLAN FOR
    SELECT s.product_id, s.region_id, SUM(s.amount)
    FROM   sales s
    GROUP  BY s.product_id, s.region_id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Look for: MAT_VIEW REWRITE ACCESS FULL (MV_SALES_BY_PRODUCT_REGION)
```

### Query Rewrite Integrity Modes

```sql
-- Set globally or per session
ALTER SESSION SET query_rewrite_integrity = ENFORCED;
-- ENFORCED: only rewrites if MV is known to be fresh (most conservative)
-- TRUSTED:  trusts RELY constraints and dimension relationships
-- STALE_TOLERATED: allows rewrite even on stale MVs (least conservative; use with care)
```

For query rewrite to work reliably:
- The MV must have `ENABLE QUERY REWRITE`
- The MV must be "fresh" (or `STALE_TOLERATED` mode is in effect)
- The optimizer must find the MV query equivalent to or a superset of the user query
- `QUERY_REWRITE_ENABLED = TRUE`

---

## Manual Refresh

```sql
-- Refresh a single MV
BEGIN
    DBMS_MVIEW.REFRESH(
        list            => 'APPSCHEMA.MV_MONTHLY_SALES_SUMMARY',
        method          => 'C',   -- C=COMPLETE, F=FAST, ?=FORCE, A=always COMPLETE
        atomic_refresh  => FALSE  -- TRUE keeps MV accessible during refresh (at cost of undo)
    );
END;
/

-- Refresh multiple MVs in dependency order
BEGIN
    DBMS_MVIEW.REFRESH(
        list   => 'MV_SALES_DETAIL,MV_SALES_BY_PRODUCT_REGION,MV_MONTHLY_SALES_SUMMARY',
        method => 'F'
    );
END;
/

-- Refresh all MVs in a schema
BEGIN
    FOR mv IN (SELECT mview_name FROM user_mviews) LOOP
        BEGIN
            DBMS_MVIEW.REFRESH(mv.mview_name, method => 'C');  -- complete refresh
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE('Failed: ' || mv.mview_name || ' — ' || SQLERRM);
        END;
    END LOOP;
END;
/
```

### DBMS_MVIEW.REFRESH_DEPENDENT

Refreshes all MVs that depend on a given base table:

```sql
BEGIN
    DBMS_MVIEW.REFRESH_DEPENDENT(
        list       => 'SALES',         -- base table name
        method     => 'F',
        rollback_seg => NULL
    );
END;
/
```

---

## Scheduling Refresh with DBMS_SCHEDULER

```sql
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name        => 'REFRESH_SALES_MVS_JOB',
        job_type        => 'PLSQL_BLOCK',
        job_action      => '
            BEGIN
                DBMS_MVIEW.REFRESH(
                    list           => ''MV_SALES_BY_PRODUCT_REGION,MV_MONTHLY_SALES_SUMMARY'',
                    method         => ''F'',
                    atomic_refresh => FALSE
                );
            END;',
        repeat_interval => 'FREQ=HOURLY;BYMINUTE=0;BYSECOND=0',
        enabled         => TRUE,
        comments        => 'Hourly FAST refresh of sales materialized views'
    );
END;
/
```

---

## Monitoring Staleness and Freshness

```sql
-- MV freshness and refresh status
SELECT mview_name,
       last_refresh_date,
       last_refresh_type,
       staleness,          -- FRESH, STALE, UNKNOWN, NEEDS_COMPILE
       refresh_mode,
       refresh_method,
       rewrite_enabled
FROM   user_mviews
ORDER  BY mview_name;

-- MV log size and age (how much unprocessed change exists)
SELECT log_owner,
       master             AS base_table,
       log_table,
       log_trigger,
       rowids,
       sequence,
       includes_new_values
FROM   user_mview_logs;

-- Row count in MV log (unprocessed entries)
SELECT COUNT(*) AS pending_changes FROM mlog$_sales;

-- MV refresh history
SELECT mview_name,
       start_time,
        end_time,
       elapsed_time,
       refresh_method,
       complete_stats_update
FROM   dba_mvref_stats
WHERE  mview_name = 'MV_MONTHLY_SALES_SUMMARY'
ORDER  BY start_time DESC
FETCH FIRST 20 ROWS ONLY;

-- Check if MVs are blocking query rewrite due to staleness
SELECT name, freshness
FROM   v$object_usage;
```

---

## Partitioned Materialized Views

MVs can themselves be partitioned, which is important when the MV is large:

```sql
CREATE MATERIALIZED VIEW mv_partitioned_sales
PARTITION BY RANGE (sale_month) (
    PARTITION p_2023 VALUES LESS THAN (DATE '2024-01-01'),
    PARTITION p_2024 VALUES LESS THAN (DATE '2025-01-01'),
    PARTITION p_2025 VALUES LESS THAN (DATE '2026-01-01'),
    PARTITION p_future VALUES LESS THAN (MAXVALUE)
)
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT  TRUNC(sale_date, 'MM') AS sale_month,
        region_id,
        product_id,
        SUM(amount)             AS revenue
FROM    sales
GROUP   BY TRUNC(sale_date, 'MM'), region_id, product_id;
```

When partitioning an MV, a **COMPLETE** refresh can use partition truncation internally (refresh partition-by-partition), which reduces undo generation compared to truncating and repopulating the entire MV.

---

## Best Practices

- **Create MV logs before creating the MV.** Oracle checks log existence at MV creation time when `REFRESH FAST` is specified.
- **Use `BUILD DEFERRED` in production deployments** when the initial population would be disruptive. Schedule a manual refresh during a maintenance window immediately after DDL.
- **Keep `ON COMMIT` refreshes for small, simple MVs only.** The refresh runs inside the user's commit path. For aggregates over millions of rows, use `ON DEMAND` with a short-interval scheduler job instead.
- **Explicitly include `COUNT(*)` and `COUNT(col)` in aggregate MVs** intended for FAST refresh. Oracle's optimizer needs these counts to compute incremental changes correctly.
- **Monitor MV log growth.** If a FAST refresh fails or is delayed, MV logs accumulate indefinitely. A table with a large unprocessed log will exhibit write-amplification overhead for all DML. Alert when log row count exceeds a threshold.
- **Use `atomic_refresh => FALSE`** for large COMPLETE refreshes to avoid massive undo generation. With `atomic_refresh => TRUE` (the default), Oracle keeps the old data accessible during refresh by using undo. For very large MVs, this can fill the undo tablespace.
- **Enable `QUERY REWRITE` only on MVs you intend the optimizer to use.** Enabling it on dozens of MVs forces the optimizer to consider all of them during every query parse, which can increase parse time.
- **Use `EXPLAIN PLAN` to verify rewrites are happening.** Do not assume — confirm with execution plans that your reporting queries are actually hitting MVs.

---

## Common Mistakes and How to Avoid Them

**Mistake 1: FAST refresh silently falls back to COMPLETE with no warning**
If a FAST refresh is attempted but is not possible (e.g., the MV log is missing an option), Oracle either raises an error or falls back to COMPLETE depending on the `method` parameter. Use `FORCE` (`?`) for the method parameter to get silent fallback, but then **monitor `last_refresh_type`** in `USER_MVIEWS` to confirm the expected method is being used.

```sql
-- Audit what refresh type was actually used
SELECT mview_name, last_refresh_type, last_refresh_date
FROM   user_mviews
WHERE  last_refresh_type != 'FAST';   -- unexpected COMPLETE refreshes
```

**Mistake 2: Forgetting `SEQUENCE` and `INCLUDING NEW VALUES` on MV logs for aggregate MVs**
Without `SEQUENCE`, Oracle cannot correctly order UPDATE operations that flip a value from old to new in an aggregate. Without `INCLUDING NEW VALUES`, Oracle cannot compute the delta for SUM/COUNT. Both are required for aggregate FAST refresh.

**Mistake 3: Stale MVs degrading query rewrite silently**
If `query_rewrite_integrity = ENFORCED` (the default), a stale MV is excluded from query rewrite without any error. Queries silently hit base tables and become slow. Set up monitoring alerts on the `staleness` column in `USER_MVIEWS`.

**Mistake 4: Cascading ON COMMIT refresh on large tables**
`ON COMMIT` refresh is synchronous and runs in the committing user's session. On a high-DML table with a complex aggregate MV, every INSERT/UPDATE/DELETE will be noticeably slower. Switch to `ON DEMAND` with a frequent scheduled refresh if latency is acceptable.

**Mistake 5: Not accounting for MV in backup and export strategies**
MV logs are regular tables and are included in Data Pump exports. When restoring or importing, MV logs may contain stale entries pointing to ROWIDs that no longer exist. After a restore, force a `COMPLETE` refresh of all MVs to reset their logs.

**Mistake 6: Altering the base table without adjusting the MV log**
Adding a column to a base table does not automatically add it to the MV log. If a subsequent MV needs that column for FAST refresh, you must drop and recreate the MV log (which clears pending changes) or use `ALTER MATERIALIZED VIEW LOG ADD (new_column)`.

```sql
-- Check which columns are covered by an existing MV log
SELECT column_name, refs_src_rowid, snapshots
FROM   user_mview_log_filter_cols
WHERE  master = 'SALES';
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database Data Warehousing Guide: Basic Materialized Views 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/dwhsg/basic-materialized-views.html)
- [DBMS_MVIEW — Oracle Database PL/SQL Packages and Types Reference 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_MVIEW.html)
- [Oracle Database SQL Language Reference: CREATE MATERIALIZED VIEW 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-MATERIALIZED-VIEW.html)
- [Oracle Database SQL Language Reference: CREATE MATERIALIZED VIEW LOG 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-MATERIALIZED-VIEW-LOG.html)
