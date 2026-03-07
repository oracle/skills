# Explain Plan — Execution Plan Analysis

## Overview

An execution plan describes the sequence of operations Oracle uses to satisfy a SQL statement. The optimizer evaluates multiple candidate plans and chooses the one with the lowest estimated cost. Understanding how to generate, read, and interpret execution plans is the most fundamental Oracle performance tuning skill.

Plans can be captured in several ways:
- **EXPLAIN PLAN** — estimates the plan without executing the query
- **DBMS_XPLAN.DISPLAY_CURSOR** — retrieves the actual plan from a recently executed statement
- **DBMS_XPLAN.DISPLAY_AWR** — retrieves a historical plan stored in AWR
- **AUTOTRACE** — combines EXPLAIN PLAN with actual execution statistics in SQL*Plus

---

## EXPLAIN PLAN

`EXPLAIN PLAN FOR` parses the SQL and writes the estimated plan to the `PLAN_TABLE` (a session-level temporary table created automatically). It does **not** execute the query.

```sql
-- Basic usage
EXPLAIN PLAN FOR
SELECT e.last_name, d.department_name
FROM   employees e
JOIN   departments d ON e.department_id = d.department_id
WHERE  e.salary > 10000;

-- Display the result
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY());
```

### Using a Statement ID (for Multiple Plans)

```sql
EXPLAIN PLAN SET STATEMENT_ID = 'MY_QUERY' FOR
SELECT * FROM orders WHERE status = 'PENDING';

SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY(
    table_name   => 'PLAN_TABLE',
    statement_id => 'MY_QUERY',
    format       => 'TYPICAL'
  )
);
```

### EXPLAIN PLAN Limitation

`EXPLAIN PLAN` uses bind variable peeking rules differently than runtime. It may show a different plan than what actually runs, especially when:
- Bind variables are used (estimated plan substitutes defaults)
- Adaptive plans are involved
- Statistics are stale

**Always prefer `DISPLAY_CURSOR` when you need the plan that actually ran.**

---

## DBMS_XPLAN.DISPLAY_CURSOR

Retrieves the actual plan from the shared pool for a recently executed statement. This is the most reliable method to see what Oracle actually chose.

```sql
-- Display plan for the most recently executed statement in your session
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR());

-- Display plan for a specific SQL_ID (last child cursor)
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id        => 'abc123xyz789',
    cursor_child_no => NULL,   -- NULL = most recent child
    format        => 'TYPICAL'
  )
);

-- Find the SQL_ID of a recent query
SELECT sql_id, plan_hash_value, sql_text
FROM   v$sql
WHERE  sql_text LIKE '%orders%'
  AND  sql_text NOT LIKE '%v$sql%'
ORDER  BY last_active_time DESC
FETCH  FIRST 10 ROWS ONLY;
```

### Format Options

| Format String | What It Shows |
|---|---|
| `'BASIC'` | Operation and object only |
| `'TYPICAL'` | Standard output (default) — operations, cost, rows, bytes |
| `'ALL'` | Full details including predicate information, column projections |
| `'ADVANCED'` | ALL plus outline, binding, remote SQL |
| `'+IOSTATS LAST'` | Adds actual row counts from the last execution |
| `'+MEMSTATS'` | Memory usage for sort/hash operations |
| `'+ROWSTATS LAST'` | Row source statistics (requires `STATISTICS_LEVEL=ALL` or hint) |

```sql
-- Most useful format for debugging: plan + actual row counts
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id  => 'abc123xyz789',
    format  => 'TYPICAL +IOSTATS LAST +PEEKED_BINDS'
  )
);
```

### Enable Row Source Statistics Collection

To get actual row counts per operation (the most valuable diagnostic data), you need statistics collection enabled:

```sql
-- Option 1: Session-level (use this when you control the session)
ALTER SESSION SET STATISTICS_LEVEL = ALL;
-- Run your query...
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(FORMAT => 'ALLSTATS LAST'));

-- Option 2: Query-level hint (no ALTER SESSION needed)
SELECT /*+ GATHER_PLAN_STATISTICS */
       e.last_name, e.salary
FROM   employees e
WHERE  e.department_id = 60;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(FORMAT => 'ALLSTATS LAST'));
```

---

## DBMS_XPLAN.DISPLAY_AWR

Retrieves historical plans stored in AWR. Useful when a plan was used in the past but is no longer in the shared pool.

> Note: In Oracle Database 23c and later, `DISPLAY_AWR` is deprecated. The replacement is `DBMS_XPLAN.DISPLAY_WORKLOAD_REPOSITORY`, which has the same intent but a slightly different signature (`dbid` is the last parameter and the parameter is named `dbid` not `db_id`). `DISPLAY_AWR` continues to function for backward compatibility but new code should prefer `DISPLAY_WORKLOAD_REPOSITORY`.

```sql
-- All plans for a SQL_ID from AWR (use DISPLAY_WORKLOAD_REPOSITORY in 23c+)
SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_AWR(
    sql_id          => 'abc123xyz789',
    plan_hash_value => NULL,  -- NULL shows all plans
    db_id           => NULL,  -- NULL = current database
    format          => 'TYPICAL'
  )
);

-- List all plan hashes for a SQL from AWR
SELECT sql_id,
       plan_hash_value,
       MIN(begin_interval_time) AS first_seen,
       MAX(end_interval_time)   AS last_seen,
       SUM(executions_delta)    AS total_executions,
       ROUND(SUM(elapsed_time_delta) / NULLIF(SUM(executions_delta),0) / 1e6, 3) AS avg_elapsed_sec
FROM   dba_hist_sqlstat s
JOIN   dba_hist_snapshot sn USING (snap_id, dbid, instance_number)
WHERE  sql_id = 'abc123xyz789'
GROUP  BY sql_id, plan_hash_value
ORDER  BY first_seen;
```

---

## Reading the Plan Output

A typical plan looks like this:

```
Plan hash value: 1234567890

----------------------------------------------------------------------------------
| Id  | Operation                    | Name         | Rows  | Bytes | Cost (%CPU)|
----------------------------------------------------------------------------------
|   0 | SELECT STATEMENT             |              |   500 |  25K  |   142   (2)|
|   1 |  HASH JOIN                   |              |   500 |  25K  |   142   (2)|
|   2 |   TABLE ACCESS FULL          | DEPARTMENTS  |    27 |   432 |     3   (0)|
|*  3 |   TABLE ACCESS BY INDEX ROWID| EMPLOYEES    |   500 |  17K  |   139   (1)|
|*  4 |    INDEX RANGE SCAN          | EMP_DEPT_IX  |   503 |       |     2   (0)|
----------------------------------------------------------------------------------

Predicate Information (identified by operation id):
---------------------------------------------------
   3 - filter("E"."SALARY">10000)
   4 - access("E"."DEPARTMENT_ID"="D"."DEPARTMENT_ID")
```

### Understanding Each Column

| Column | Meaning |
|---|---|
| `Id` | Step number. Asterisk (*) means predicates are applied at this step |
| `Operation` | The algorithm Oracle uses (TABLE ACCESS FULL, INDEX RANGE SCAN, HASH JOIN, etc.) |
| `Name` | Object name (table or index) involved |
| `Rows` | Optimizer's estimated row count (cardinality) |
| `Bytes` | Estimated data volume (rows × avg row size) |
| `Cost` | Optimizer cost (relative; based on I/O + CPU model) |
| `(%CPU)` | Percentage of cost attributable to CPU |
| `Time` | Estimated wall-clock time (rough estimate only) |

### Reading with Actual Rows (ALLSTATS format)

```
| Id  | Operation            | Name    | Starts | E-Rows | A-Rows |   A-Time   | Buffers |
|   0 | SELECT STATEMENT     |         |      1 |        |     50 |00:00:02.14 |   84321 |
|*  1 |  TABLE ACCESS FULL   | ORDERS  |      1 |  500K  |     50 |00:00:02.14 |   84321 |
```

- `Starts` — how many times this operation was initiated
- `E-Rows` — estimated rows (what the optimizer predicted)
- `A-Rows` — actual rows returned
- `A-Time` — cumulative elapsed time up to and including this step
- `Buffers` — logical I/O (buffer gets) for this step

**The most important diagnostic:** Compare `E-Rows` vs `A-Rows`. Large discrepancies (10x or more) indicate bad cardinality estimates, which cause poor plan choices.

### Plan Tree Reading Order

Plans are read **inside-out** (most indented first) and **bottom-up** within a branch:

```
|   0 | SELECT STATEMENT    |          -- last: combine results
|   1 |  SORT ORDER BY      |          -- step 4: sort
|   2 |   HASH JOIN         |          -- step 3: join
|   3 |    INDEX RANGE SCAN | IDX_A    -- step 1: probe index
|   4 |    TABLE ACCESS FULL| TABLE_B  -- step 2: scan table
```

---

## Common Plan Operations and What They Mean

### Access Paths

| Operation | Description | Good When |
|---|---|---|
| `TABLE ACCESS FULL` | Reads all blocks of table | Few rows returned relative to table, or majority of table needed |
| `TABLE ACCESS BY INDEX ROWID` | Fetches row by rowid after index lookup | Selective predicate with good index |
| `INDEX UNIQUE SCAN` | Single index entry lookup | Primary key or unique constraint lookup |
| `INDEX RANGE SCAN` | Scans a range of index entries | Range predicate or low-cardinality equality |
| `INDEX FAST FULL SCAN` | Reads all index blocks like a FTS | Index covers all needed columns; avoids table access |
| `INDEX SKIP SCAN` | Skips leading column of composite index | Low cardinality leading column |

### Join Methods

| Operation | Description | Good When |
|---|---|---|
| `NESTED LOOPS` | For each outer row, probe inner | Outer is small; inner has selective index |
| `HASH JOIN` | Build hash table from smaller side, probe with larger | Larger datasets; no useful index |
| `MERGE JOIN` | Sort both inputs, merge-join | Both inputs pre-sorted; equality join |
| `NESTED LOOPS ANTI` / `SEMI` | Anti/semi join optimization | NOT IN / EXISTS subqueries |

---

## AUTOTRACE in SQL*Plus

AUTOTRACE provides plan + execution statistics after running a query.

```sql
-- Setup (one-time per user, DBA required)
-- Grant access to the plan table and autotrace role
GRANT SELECT ON v_$session TO your_user;
GRANT SELECT ON v_$sql_plan TO your_user;
-- Or simply:
GRANT PLUSTRACE TO your_user;

-- Enable autotrace
SET AUTOTRACE ON            -- show results + plan + stats
SET AUTOTRACE TRACEONLY     -- suppress results, show plan + stats
SET AUTOTRACE TRACEONLY EXPLAIN -- plan only (no execution)
SET AUTOTRACE TRACEONLY STATISTICS -- stats only (executes)
SET AUTOTRACE OFF           -- disable

-- Example session
SET AUTOTRACE TRACEONLY
SELECT * FROM employees WHERE department_id = 60;
```

Autotrace output includes:

```
Statistics
----------------------------------------------------------
         45  recursive calls
          0  db block gets
        182  consistent gets          <-- logical reads
          3  physical reads           <-- disk reads
          0  redo size
       1423  bytes sent via SQL*Net
        608  bytes received via SQL*Net
          3  SQL*Net roundtrips
          1  sorts (memory)
          0  sorts (disk)
          6  rows processed
```

**Key autotrace statistics:**

- `consistent gets` — logical reads (buffer cache lookups)
- `physical reads` — actual disk reads
- `sorts (disk)` — exceeded PGA sort area; spilled to temp
- `recursive calls` — internal SQL (dictionary lookups, triggers); high value is a concern

---

## Identifying Bad Plans

### Symptom 1: Cardinality Mismatch

```sql
-- After running with GATHER_PLAN_STATISTICS:
-- E-Rows = 5, A-Rows = 500,000
-- Optimizer chose NESTED LOOPS thinking 5 rows
-- Fix: gather accurate stats, consider extended stats, SQL hints
```

### Symptom 2: Wrong Join Order

The optimizer joins large to large instead of small to large first. Usually caused by stale or missing statistics.

### Symptom 3: Full Table Scan When Index Expected

```sql
-- Common causes:
-- 1. Function applied to indexed column (defeats index)
SELECT * FROM employees WHERE UPPER(last_name) = 'SMITH';
-- Fix: create function-based index
CREATE INDEX emp_upper_lname ON employees (UPPER(last_name));

-- 2. Implicit data type conversion
SELECT * FROM employees WHERE employee_id = '100';  -- VARCHAR vs NUMBER
-- Fix: match data types

-- 3. Leading wildcard
SELECT * FROM employees WHERE last_name LIKE '%SMITH';
-- Fix: consider Oracle Text or application redesign

-- 4. Optimizer decides FTS is cheaper (small table, or most rows returned)
-- This may actually be correct; verify with actual row counts
```

### Symptom 4: Inefficient Subquery (Not Unnested)

```sql
-- Correlated subquery running once per outer row
SELECT * FROM orders o
WHERE  total > (SELECT AVG(total) FROM orders WHERE customer_id = o.customer_id);
-- Check plan for "FILTER" operation with subquery — often slow
-- Fix: rewrite as JOIN with inline view or use analytic function
SELECT * FROM (
  SELECT o.*, AVG(total) OVER (PARTITION BY customer_id) AS avg_total
  FROM   orders o
)
WHERE  total > avg_total;
```

### Symptom 5: Sort-Merge Join Instead of Hash Join on Large Tables

Usually indicates a missing or outdated system statistics collection.

```sql
-- Manually hint a hash join to test
SELECT /*+ USE_HASH(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;
```

---

## Best Practices

- **Always use `GATHER_PLAN_STATISTICS`** hint or `STATISTICS_LEVEL=ALL` when debugging to see actual vs. estimated rows.
- **Compare `E-Rows` vs `A-Rows` at every step.** The first node where they diverge significantly is where to focus your fix.
- **Use `DISPLAY_CURSOR`, not `EXPLAIN PLAN`** for production SQL debugging. `EXPLAIN PLAN` can lie when bind variables are involved.
- **Check `PEEKED_BINDS` in the format string** to see what bind values Oracle used when compiling the plan.
- **Baseline good plans with SQL Plan Management (SPM)** to prevent plan regression after statistics changes or upgrades.
- **Look at the `Predicate Information` section.** Confirm filters (`filter`) are applied where you expect and access predicates (`access`) match your index structure.

```sql
-- Create a SQL Plan Baseline to lock a good plan
DECLARE
  l_plans PLS_INTEGER;
BEGIN
  l_plans := DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(
    sql_id          => 'abc123xyz789',
    plan_hash_value => 1234567890
  );
  DBMS_OUTPUT.PUT_LINE('Plans loaded: ' || l_plans);
END;
/
```

---

## Common Mistakes

| Mistake | Impact | Correction |
|---|---|---|
| Using EXPLAIN PLAN for bind variable SQL | Plan may differ from runtime | Use `DISPLAY_CURSOR` with `+PEEKED_BINDS` |
| Not checking A-Rows vs E-Rows | Miss cardinality estimate problems | Always use `GATHER_PLAN_STATISTICS` hint |
| Assuming lower cost = faster query | Cost is a relative optimizer model, not wall-clock time | Measure actual elapsed time |
| Adding hints to production code | Brittle; breaks if objects change | Fix statistics, add indexes; use SPM |
| Ignoring Predicate Information | Miss filter vs. access predicate distinction | Always read predicate section |
| Confusing cumulative A-Time | Each row's time includes child rows | A-Time at parent minus children = step time |
| Over-indexing to fix every FTS | May hurt DML, use more space | Verify FTS is actually the bottleneck first |

---

## Sources

- [Oracle Database 19c SQL Tuning Guide (TGSQL)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/)
- [DBMS_XPLAN — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_XPLAN.html)
- [V$SQL — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SQL.html)
- [DBMS_SPM — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SPM.html)
- [PLAN_TABLE — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/PLAN_TABLE.html)
