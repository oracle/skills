# Index Strategy — Oracle Index Types and Usage

## Overview

Indexes are Oracle's primary mechanism for efficiently locating rows without scanning entire tables. Choosing the right index type, structure, and column order is critical for query performance. Poor index strategy leads to either excessive full table scans (too few indexes) or degraded DML performance and wasted storage (too many or wrong indexes).

This guide covers B-tree indexes, bitmap indexes, function-based indexes, composite index design, invisible indexes, monitoring, and maintenance.

---

## B-Tree Indexes

B-tree (Balanced Tree) is the default and most versatile index type. It stores indexed values in sorted order within a balanced tree structure, allowing O(log n) lookups.

### When to Use

- High-cardinality columns (many distinct values): primary keys, unique identifiers, timestamps
- Columns frequently used in `WHERE` clauses with equality or range predicates
- Foreign key columns (prevents full table lock during parent DELETE)
- Columns in `ORDER BY` or `GROUP BY` that benefit from pre-sorted access

### When NOT to Use

- Very low cardinality columns (e.g., Y/N flag, gender) — use bitmap instead
- Columns almost always accessed as part of a full table scan
- Columns with heavy DML where the index overhead exceeds the query benefit

```sql
-- Simple B-tree index
CREATE INDEX emp_salary_ix ON employees (salary);

-- Unique B-tree index (enforces uniqueness and enables UNIQUE SCAN)
CREATE UNIQUE INDEX emp_email_uk ON employees (email);

-- Verify index was created
SELECT index_name, index_type, uniqueness, status
FROM   user_indexes
WHERE  table_name = 'EMPLOYEES';

-- See indexed columns
SELECT index_name, column_position, column_name, descend
FROM   user_ind_columns
WHERE  table_name = 'EMPLOYEES'
ORDER  BY index_name, column_position;
```

---

## Bitmap Indexes

Bitmap indexes store one bit per row for each distinct value. They are extremely compact for low-cardinality columns and highly efficient for ad-hoc analytical queries with multiple predicates.

### When to Use

- Columns with very **low cardinality** (2–100 distinct values): status codes, regions, Boolean flags
- **Data warehouse** or reporting environments with heavy `SELECT` and infrequent `INSERT/UPDATE/DELETE`
- Queries combining multiple low-cardinality filters (`AND`/`OR`) — Oracle can combine bitmaps with bitwise operations

### When to Avoid

- **OLTP environments** — bitmap indexes lock entire bitmaps during DML, causing severe contention
- High-cardinality columns — wasteful; B-tree is better
- Heavily updated columns — each DML locks bitmaps for all rows with the same value

```sql
-- Bitmap index on a low-cardinality status column
CREATE BITMAP INDEX orders_status_bix ON orders (status);

-- Bitmap indexes shine for multi-column filter queries
-- Oracle combines bitmaps with bitwise AND/OR before table access
SELECT COUNT(*) FROM sales
WHERE  region  = 'WEST'
  AND  quarter = 'Q1'
  AND  channel = 'ONLINE';
-- With bitmap indexes on region, quarter, channel:
-- 3 bitmap scans → bitmap AND → COUNT (may not even need table access)

-- Check for bitmap indexes
SELECT index_name, index_type
FROM   user_indexes
WHERE  table_name = 'SALES'
  AND  index_type = 'BITMAP';
```

### Bitmap vs B-Tree Comparison

| Characteristic | B-Tree | Bitmap |
|---|---|---|
| Best cardinality | High | Low (< 100 distinct) |
| DML performance | Moderate overhead per row | Heavy contention; row-level lock escalates |
| Storage | Per-value entries | Very compact for low cardinality |
| Combined predicates | Separate index lookups | Bitwise operations; very efficient |
| Best workload | OLTP + OLAP | Data warehouse / read-heavy OLAP |
| NULL storage | Not stored (allows IS NULL to miss index) | NULL has its own bitmap |

---

## Function-Based Indexes (FBI)

A function-based index pre-computes a function or expression and indexes the result. This allows index access when a function is applied to an indexed column — which would otherwise suppress index use.

```sql
-- Without FBI: index on LAST_NAME is NOT used
SELECT * FROM employees WHERE UPPER(last_name) = 'SMITH';

-- Create FBI on the expression
CREATE INDEX emp_upper_lname_fix ON employees (UPPER(last_name));

-- Now Oracle can use the index
SELECT * FROM employees WHERE UPPER(last_name) = 'SMITH';

-- FBI for case-insensitive email lookup
CREATE INDEX emp_lower_email_fix ON employees (LOWER(email));
SELECT * FROM employees WHERE LOWER(email) = 'john.doe@example.com';

-- FBI for date truncation (report queries that filter on date portion)
CREATE INDEX orders_order_date_trunc ON orders (TRUNC(order_date));
SELECT * FROM orders WHERE TRUNC(order_date) = DATE '2026-03-01';

-- FBI for expression combining columns
CREATE INDEX emp_annual_sal_ix ON employees (salary * 12);
SELECT * FROM employees WHERE salary * 12 > 120000;
```

### Important Notes

- The function must be **deterministic** (same input always produces same output)
- User-defined functions used in FBIs must be declared `DETERMINISTIC`
- `QUERY_REWRITE_ENABLED` must be set to `TRUE` (default) for Oracle to use FBIs

```sql
-- Verify QUERY_REWRITE_ENABLED
SELECT name, value FROM v$parameter WHERE name = 'query_rewrite_enabled';
```

---

## Composite (Multi-Column) Indexes

A composite index covers two or more columns. Column order is critical and must match query access patterns.

### Column Order Rules

**Rule 1: The leading column must be present in the query predicate** for the index to be used for access (range or equality scan). A query that skips the leading column can only use an Index Skip Scan, which is only efficient when the leading column has very low cardinality.

**Rule 2: Columns used in equality predicates should come first, then range predicates.**

```sql
-- Index on (DEPT_ID, SALARY)
CREATE INDEX emp_dept_sal_ix ON employees (department_id, salary);

-- Uses the index (leading column in predicate)
SELECT * FROM employees WHERE department_id = 50 AND salary > 5000;
-- Access: INDEX RANGE SCAN on department_id=50, filter salary>5000

-- Uses the index (leading column only)
SELECT * FROM employees WHERE department_id = 50;
-- Access: INDEX RANGE SCAN

-- Does NOT use the index efficiently (leading column absent)
SELECT * FROM employees WHERE salary > 5000;
-- Access: INDEX SKIP SCAN or TABLE ACCESS FULL (depends on cardinality)

-- Column order matters for range predicates:
-- Index (DEPT_ID, HIRE_DATE) — good for: WHERE dept=X AND hire_date BETWEEN...
-- Index (HIRE_DATE, DEPT_ID) — good for: WHERE hire_date=X AND dept=Y
--   but cannot efficiently range-scan HIRE_DATE if DEPT_ID is not equality
```

### When Composite Beats Two Separate Indexes

- Query filters on both columns → single index range scan vs two separate scans + bitmap merge
- Index covers all needed columns → **index-only scan** (no table access)
- `ORDER BY` or `GROUP BY` can use the index order

### Covering Index (Index-Only Scan)

```sql
-- Without covering index: index scan + table row fetch (two I/Os per row)
-- With covering index: index scan only (one I/O per row)

-- Query: SELECT last_name, salary FROM employees WHERE department_id = 60
-- Covering index includes all selected + filtered columns:
CREATE INDEX emp_dept_cover_ix ON employees (department_id, last_name, salary);

-- Verify with EXPLAIN PLAN — look for "INDEX FAST FULL SCAN" or no TABLE ACCESS step
EXPLAIN PLAN FOR
SELECT last_name, salary FROM employees WHERE department_id = 60;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY());
```

---

## Invisible Indexes

An invisible index is maintained by DML but **ignored by the optimizer** by default. This allows safe testing of a new index without impacting production queries, or safe deprecation before dropping.

```sql
-- Create an invisible index
CREATE INDEX emp_job_id_ix ON employees (job_id) INVISIBLE;

-- Make an existing index invisible
ALTER INDEX emp_job_id_ix INVISIBLE;

-- Test whether it helps: enable invisible index use for your session only
ALTER SESSION SET OPTIMIZER_USE_INVISIBLE_INDEXES = TRUE;

-- Test your query
EXPLAIN PLAN FOR SELECT * FROM employees WHERE job_id = 'IT_PROG';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY());

-- If the index helps, make it visible to all
ALTER INDEX emp_job_id_ix VISIBLE;

-- View invisible indexes
SELECT index_name, visibility, status
FROM   user_indexes
WHERE  table_name = 'EMPLOYEES';
```

### Invisible Index Use Cases

1. **Testing a new index** without affecting other sessions
2. **Safe decommissioning:** make invisible for a week, confirm no regressions, then drop
3. **Testing index removal:** make current index invisible, run workload, assess impact

---

## Index Monitoring

Oracle can track whether an index has been used (accessed by the optimizer during query execution). This helps identify unused indexes that can be dropped to reduce DML overhead.

### 12c+ (Automatic Monitoring via DBA_INDEX_USAGE)

In Oracle 12c Release 2 and later, index usage is automatically tracked without enabling explicit monitoring.
Statistics are flushed from `V$INDEX_USAGE_INFO` (an instance-level control view) to `DBA_INDEX_USAGE`
approximately every 15 minutes.

```sql
-- Check index usage statistics (12cR2+) — query DBA_INDEX_USAGE, not V$INDEX_USAGE_INFO
-- V$INDEX_USAGE_INFO is a control/status view; DBA_INDEX_USAGE holds the per-index stats
SELECT name            AS index_name,
       total_access_count,
       total_exec_count,
       last_used
FROM   dba_index_usage
WHERE  owner = 'HR'
  AND  name IN (
    SELECT index_name FROM user_indexes WHERE table_name = 'EMPLOYEES'
  );
```

### Pre-12c Monitoring (ALTER INDEX MONITORING USAGE)

```sql
-- Enable monitoring
ALTER INDEX emp_salary_ix MONITORING USAGE;

-- Run workload...

-- Check if used
SELECT index_name, monitoring, used, start_monitoring, end_monitoring
FROM   v$object_usage
WHERE  index_name = 'EMP_SALARY_IX';

-- Disable monitoring
ALTER INDEX emp_salary_ix NOMONITORING USAGE;
```

**Caution:** Pre-12c monitoring only records a TRUE/FALSE used flag, not usage frequency. An index used once in a month appears the same as one used a million times.

---

## Rebuilding vs. Coalescing

Over time, B-tree indexes can develop "clustering factor" issues and deleted/wasted space. Two maintenance options exist:

### COALESCE

Merges leaf blocks within existing branches. Does **not** reduce index height. Minimal I/O overhead. Appropriate for minor fragmentation.

```sql
ALTER INDEX emp_salary_ix COALESCE;
```

### REBUILD

Rebuilds the index from scratch using the table data. Can fix height issues, improve clustering factor, and change storage parameters. More expensive (reads all table data).

```sql
-- Rebuild online (does not block DML)
ALTER INDEX emp_salary_ix REBUILD ONLINE;

-- Rebuild with new tablespace
ALTER INDEX emp_salary_ix REBUILD TABLESPACE idx_tbs ONLINE;

-- Rebuild and compress (for composite indexes with repeated leading values)
ALTER INDEX emp_dept_sal_ix REBUILD COMPRESS 1;
```

### When to Rebuild vs. Coalesce

| Scenario | Recommendation |
|---|---|
| Many deletes caused leaf block waste | Coalesce (fast, online-safe) |
| Index height grown to 4+ levels on small-medium table | Rebuild |
| Clustering factor severely degraded | Rebuild (or reorganize table with move) |
| Moving index to different tablespace | Rebuild |
| Periodic "maintenance" on a healthy index | Neither — unnecessary on healthy indexes |

**Important:** Automatically rebuilding indexes on a schedule (e.g., monthly) is largely unnecessary in modern Oracle versions (10g+). An index with good statistics and normal operation rarely needs rebuilding. Always verify with `ANALYZE INDEX ... VALIDATE STRUCTURE` before deciding.

```sql
-- Analyze index structure to check for damage or extreme fragmentation
ANALYZE INDEX emp_salary_ix VALIDATE STRUCTURE;

-- Query results
SELECT name,
       height,
       blocks,
       lf_rows,     -- leaf rows (actual entries)
       lf_blks,     -- leaf blocks
       del_lf_rows, -- deleted leaf rows
       ROUND(del_lf_rows / NULLIF(lf_rows, 0) * 100, 2) AS pct_deleted
FROM   index_stats;
-- If pct_deleted > 20-30%, rebuilding may be beneficial
```

---

## Index on Foreign Keys

A frequently overlooked index is on the **foreign key column** of a child table. Without it:

- Full table scans occur when navigating from parent to child
- Deleting or updating a parent row causes an **exclusive table-level lock** on the child table in Oracle (until the cascade/validation completes)

```sql
-- Identify unindexed foreign keys
SELECT ac.table_name,
       ac.constraint_name,
       acc.column_name
FROM   all_constraints ac
JOIN   all_cons_columns acc
  ON   ac.constraint_name = acc.constraint_name
  AND  ac.owner           = acc.owner
WHERE  ac.constraint_type = 'R'  -- Referential (FK)
  AND  ac.owner           = 'HR'
  AND  NOT EXISTS (
    SELECT 1
    FROM   all_ind_columns aic
    WHERE  aic.table_name  = ac.table_name
      AND  aic.owner       = ac.owner
      AND  aic.column_name = acc.column_name
      AND  aic.column_position = 1
  );
```

---

## Automatic Indexing (19c+)

Oracle 19c introduced Automatic Indexing, which uses machine learning to continuously analyze the SQL workload, identify candidate indexes, validate them against real queries, and promote or drop them automatically. It is available in Oracle Database 19c Enterprise Edition (with Diagnostics and Tuning packs) and on Autonomous Database.

### How It Works

1. Oracle analyzes SQL statements in the cursor cache for full table scans and index range scan opportunities.
2. Candidate indexes are created **invisibly** (no plan impact yet).
3. Each candidate is validated by re-running relevant SQL with and without the index.
4. Indexes that improve performance are made **visible** (or implemented directly, depending on mode).
5. Indexes that are never used are automatically dropped after the configured retention period.

### Configuration

```sql
-- Check current Auto Indexing configuration
SELECT parameter_name, parameter_value
FROM   dba_auto_index_config;

-- Set the operating mode
-- IMPLEMENT: creates and makes visible automatically (default on Autonomous)
-- REPORT ONLY: creates but keeps invisible; DBA must promote manually
-- OFF: disabled
EXEC DBMS_AUTO_INDEX.CONFIGURE('AUTO_INDEX_MODE', 'IMPLEMENT');

-- Restrict to specific schemas (comma-separated; NULL = all schemas)
EXEC DBMS_AUTO_INDEX.CONFIGURE('AUTO_INDEX_SCHEMA', 'HR, OE', allow => TRUE);

-- Exclude a schema
EXEC DBMS_AUTO_INDEX.CONFIGURE('AUTO_INDEX_SCHEMA', 'SCOTT', allow => FALSE);

-- Set retention period for unused auto indexes (days; default 373)
EXEC DBMS_AUTO_INDEX.CONFIGURE('AUTO_INDEX_RETENTION_FOR_AUTO', '90');

-- Set retention for manually created indexes tracked by auto indexing (days)
EXEC DBMS_AUTO_INDEX.CONFIGURE('AUTO_INDEX_RETENTION_FOR_MANUAL', NULL);

-- Limit tablespace used by auto indexes (MB; NULL = no limit)
EXEC DBMS_AUTO_INDEX.CONFIGURE('AUTO_INDEX_SPACE_BUDGET', '2048');
```

### Monitoring Activity

```sql
-- View recent Auto Indexing task executions
SELECT execution_name,
       execution_start,
       execution_end,
       status,
       new_indexes_found,
       new_indexes_created,
       indexes_dropped
FROM   dba_auto_index_executions
ORDER BY execution_start DESC
FETCH FIRST 10 ROWS ONLY;

-- View index actions taken (created, dropped, made visible, etc.)
SELECT index_name,
       table_owner,
       table_name,
       action,
       status,
       reason,
       creation_date
FROM   dba_auto_index_ind_actions
ORDER BY creation_date DESC;

-- View all auto-created indexes and their current state
SELECT ai.index_name,
       ai.table_owner,
       ai.table_name,
       ai.indexing_status,   -- VALID, UNUSABLE, etc.
       ui.status,
       ui.visibility,
       ui.last_analyzed
FROM   dba_auto_indexes ai
JOIN   dba_indexes ui
  ON   ai.index_name  = ui.index_name
  AND  ai.table_owner = ui.owner;
```

### Generating a Report

```sql
-- Activity report for the last 24 hours (returns CLOB)
SELECT DBMS_AUTO_INDEX.REPORT_ACTIVITY(
  activity_start => SYSDATE - 1,
  activity_end   => SYSDATE,
  type           => 'TEXT',
  section        => 'ALL'
) AS report
FROM dual;
```

### Promoting a REPORT ONLY Index to Visible

When running in `REPORT ONLY` mode, Oracle creates indexes but keeps them invisible. After reviewing the activity report, promote those you want:

```sql
-- Manually make an auto index visible after review
ALTER INDEX hr.sys_ai_abc123 VISIBLE;

-- Or use DBMS_AUTO_INDEX to accept a specific index
-- (marks it as manually accepted, preventing automatic drop)
EXEC DBMS_AUTO_INDEX.CONFIGURE('AUTO_INDEX_MODE', 'IMPLEMENT');
```

### Limitations

- Does not create **bitmap indexes**, **function-based indexes**, **IOT indexes**, or **cluster indexes** — only B-tree.
- Does not index columns on **index-organized tables** or **external tables**.
- Requires **Diagnostics Pack** + **Tuning Pack** licenses (on-premises).
- On Autonomous Database, automatic indexing is configurable with `DBMS_AUTO_INDEX`; `OFF`, `REPORT ONLY`, and `IMPLEMENT` are supported.
- Auto-created indexes are prefixed with `SYS_AI_` and visible in `DBA_AUTO_INDEXES`.

### When to Use vs. Manual Indexing

| Scenario | Recommendation |
|---|---|
| Autonomous Database | Auto Indexing is on by default; supplement with manual indexes for complex cases |
| On-premises with licensed packs, stable schema | Enable in IMPLEMENT mode; review reports weekly |
| On-premises, want control | Use REPORT ONLY; promote candidates after review |
| Rapidly changing schema or workload | Disable; manual indexing gives more predictability |
| Missing index causing an emergency | Create manually — Auto Indexing runs on a schedule (typically hourly) |

---

## Best Practices

- **Index selectively:** Add indexes only when you have evidence (explain plan, ASH, AWR) that they will be used.
- **Monitor for unused indexes** regularly using `V$INDEX_USAGE_INFO` (12cR2+) and drop them if truly unused. Unused indexes waste space and slow DML.
- **Always create FK indexes** on child tables to avoid lock contention and unnecessary full scans.
- **Prefer covering indexes** for high-frequency OLTP queries to eliminate the table row fetch step.
- **Use invisible indexes** to safely test before making changes visible to all sessions.
- **Avoid over-compression** on B-tree indexes; index key compression is beneficial for composite indexes with repeated leading values but has CPU overhead.
- **Rebuild indexes online** (`REBUILD ONLINE`) in production to avoid blocking DML.
- **After a large batch delete**, consider coalescing or rebuilding indexes on heavily affected tables.

---

## Common Mistakes

| Mistake | Impact | Fix |
|---|---|---|
| Creating B-tree on a Y/N flag column | Rarely used; DML overhead for no benefit | Use bitmap index (if DW) or no index (if OLTP) |
| Wrong column order in composite index | Index not used for common queries | Put equality columns first, then range |
| Not indexing FK columns | Lock escalation on parent DML; slow joins | Always index FK columns |
| Using FTS result to conclude "no index needed" | May be an FBI or type mismatch issue | Check predicate info; fix function application |
| Rebuilding all indexes on schedule | Wasted maintenance window; no real benefit | Rebuild only when fragmentation is confirmed |
| Dropping an index without testing | May cause performance regression | Make invisible first; test; then drop |
| Creating duplicate indexes | DML overhead; storage waste | Check existing indexes before creating new ones |

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Tuning Guide (TGSQL)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/)
- [Oracle Database 19c Performance Tuning Guide (TGDBA)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgdba/)
- [USER_INDEXES / DBA_INDEXES — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/USER_INDEXES.html)
- [DBA_INDEX_USAGE — Oracle Database 19c Reference (12cR2+)](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_INDEX_USAGE.html)
- [V$OBJECT_USAGE — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-OBJECT_USAGE.html)
- [DBMS_AUTO_INDEX — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_AUTO_INDEX.html)
- [DBA_AUTO_INDEXES — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_AUTO_INDEXES.html)
- [Automatic Indexing in Oracle Database 19c (Technical Paper)](https://www.oracle.com/technetwork/database/automatic-indexing-19c-wp-5324365.pdf)
