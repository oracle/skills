# SQL Patterns in Oracle

## Overview

Oracle SQL includes a rich set of advanced constructs beyond basic SELECT/INSERT/UPDATE/DELETE. Mastering these patterns allows complex analytical, hierarchical, and transformational logic to be expressed entirely in SQL — often with dramatic performance and readability advantages over equivalent PL/SQL procedural code.

This guide covers the most impactful advanced SQL patterns: analytic (window) functions, Common Table Expressions, hierarchical queries, PIVOT/UNPIVOT, the MERGE statement, and the MODEL clause.

---

## Analytic (Window) Functions

Analytic functions compute values across a "window" of rows related to the current row, without collapsing the result set the way GROUP BY does. They are evaluated after the WHERE, GROUP BY, and HAVING clauses but before the final ORDER BY.

**Syntax template:**

```sql
function_name([arguments])
  OVER (
    [PARTITION BY partition_cols]
    [ORDER BY order_cols]
    [ROWS | RANGE BETWEEN frame_start AND frame_end]
  )
```

### ROW_NUMBER, RANK, and DENSE_RANK

```sql
-- ROW_NUMBER: unique sequential number regardless of ties
-- RANK: tied rows get the same number; next rank is skipped (1,2,2,4)
-- DENSE_RANK: tied rows get the same number; no gaps (1,2,2,3)
SELECT
  employee_id,
  last_name,
  department_id,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS row_num,
  RANK()       OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dense_rnk
FROM employees
ORDER BY department_id, salary DESC;
```

**Common pattern: top-N per group**

```sql
-- Top 3 earners per department
SELECT *
FROM (
  SELECT
    employee_id,
    last_name,
    department_id,
    salary,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
  FROM employees
)
WHERE rnk <= 3
ORDER BY department_id, rnk;
```

### LAG and LEAD

`LAG` accesses a value from a preceding row; `LEAD` accesses a value from a following row. Both avoid self-joins.

```sql
-- Compare each employee's salary to the previous hire in their department
SELECT
  employee_id,
  last_name,
  hire_date,
  salary,
  LAG(salary, 1, 0) OVER (PARTITION BY department_id ORDER BY hire_date) AS prev_hire_salary,
  salary - LAG(salary, 1, 0) OVER (PARTITION BY department_id ORDER BY hire_date) AS salary_diff,
  LEAD(hire_date, 1) OVER (PARTITION BY department_id ORDER BY hire_date) AS next_hire_date
FROM employees
ORDER BY department_id, hire_date;
```

### SUM, AVG, COUNT as Analytic Functions (Running Totals)

```sql
-- Running total of salary by department, ordered by hire date
SELECT
  employee_id,
  last_name,
  hire_date,
  salary,
  SUM(salary) OVER (
    PARTITION BY department_id
    ORDER BY hire_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total,
  AVG(salary) OVER (
    PARTITION BY department_id
    ORDER BY hire_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW  -- 3-row moving average
  ) AS moving_avg_3
FROM employees
ORDER BY department_id, hire_date;
```

### NTILE, PERCENT_RANK, CUME_DIST

```sql
-- Quartile grouping and percentile distribution
SELECT
  employee_id,
  last_name,
  salary,
  NTILE(4)       OVER (ORDER BY salary) AS salary_quartile,
  PERCENT_RANK() OVER (ORDER BY salary) AS pct_rank,       -- 0 to 1
  CUME_DIST()    OVER (ORDER BY salary) AS cumulative_dist  -- 0 to 1
FROM employees
ORDER BY salary;
```

### FIRST_VALUE and LAST_VALUE

```sql
-- Show the highest salary in the dept alongside each employee's own salary
SELECT
  employee_id,
  last_name,
  department_id,
  salary,
  FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_max_salary,
  LAST_VALUE(salary)  OVER (
    PARTITION BY department_id ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING  -- required for correct LAST_VALUE
  ) AS dept_min_salary
FROM employees
ORDER BY department_id, salary DESC;
```

Note: `LAST_VALUE` requires `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` to override the default window frame, otherwise it only looks back to the start and up to the current row.

---

## Common Table Expressions (WITH Clause)

CTEs define named subqueries that can be referenced multiple times within the main query. They improve readability and, when marked `MATERIALIZED`, can also improve performance by computing the subquery once.

### Basic CTE

```sql
-- Named subquery computed once, referenced twice
WITH dept_payroll AS (
  SELECT
    department_id,
    SUM(salary)  AS total_salary,
    COUNT(*)     AS headcount,
    AVG(salary)  AS avg_salary
  FROM   employees
  GROUP BY department_id
)
SELECT
  d.department_name,
  dp.total_salary,
  dp.headcount,
  dp.avg_salary,
  dp.total_salary / SUM(dp.total_salary) OVER () AS pct_of_company_payroll
FROM   dept_payroll  dp
JOIN   departments   d ON dp.department_id = d.department_id
ORDER BY dp.total_salary DESC;
```

### Chained CTEs (Multiple WITH Clauses)

```sql
WITH
-- Step 1: compute department stats
dept_stats AS (
  SELECT department_id, AVG(salary) AS avg_sal, MAX(salary) AS max_sal
  FROM   employees
  GROUP BY department_id
),
-- Step 2: identify employees earning above their dept average
above_avg AS (
  SELECT e.employee_id, e.last_name, e.department_id, e.salary,
         ds.avg_sal AS dept_avg
  FROM   employees e
  JOIN   dept_stats ds ON e.department_id = ds.department_id
  WHERE  e.salary > ds.avg_sal
),
-- Step 3: join with departments for final output
final_result AS (
  SELECT aa.last_name, d.department_name, aa.salary, aa.dept_avg,
         ROUND((aa.salary - aa.dept_avg) / aa.dept_avg * 100, 1) AS pct_above_avg
  FROM   above_avg aa
  JOIN   departments d ON aa.department_id = d.department_id
)
SELECT * FROM final_result ORDER BY pct_above_avg DESC;
```

### Recursive CTEs

Oracle supports recursive CTEs (in addition to CONNECT BY) from 11gR2 with the `SEARCH` and `CYCLE` clauses:

```sql
-- Recursive CTE: employee org chart
WITH org_chart (employee_id, manager_id, last_name, lvl, path) AS (
  -- Anchor: top-level employees (no manager)
  SELECT employee_id, manager_id, last_name, 1,
         CAST(last_name AS VARCHAR2(4000)) AS path
  FROM   employees
  WHERE  manager_id IS NULL

  UNION ALL

  -- Recursive step: employees who report to someone already in the result
  SELECT e.employee_id, e.manager_id, e.last_name, oc.lvl + 1,
         oc.path || ' > ' || e.last_name
  FROM   employees e
  JOIN   org_chart  oc ON e.manager_id = oc.employee_id
)
SEARCH DEPTH FIRST BY last_name SET order_seq
CYCLE employee_id SET is_cycle TO '1' DEFAULT '0'
SELECT lvl, LPAD(' ', (lvl-1)*4) || last_name AS org_chart, path
FROM   org_chart
WHERE  is_cycle = '0'
ORDER BY order_seq;
```

### Materialization Hint

```sql
-- Force Oracle to compute the CTE once and materialize the result
-- Prevents the optimizer from inlining it into the main query multiple times
WITH expensive_subquery AS (
  SELECT /*+ MATERIALIZE */ department_id, complex_calculation(salary) AS result
  FROM   employees
)
SELECT * FROM expensive_subquery e1
JOIN   expensive_subquery e2 ON e1.department_id != e2.department_id;
```

---

## Hierarchical Queries (CONNECT BY)

`CONNECT BY` is Oracle's native hierarchical query syntax, predating SQL standard recursive CTEs. It is concise and supported by a rich set of Oracle-specific pseudocolumns and functions.

### Basic Hierarchy Traversal

```sql
-- Employee org chart using CONNECT BY
SELECT
  LEVEL,
  LPAD(' ', (LEVEL-1)*4) || last_name AS org_chart,
  employee_id,
  manager_id,
  SYS_CONNECT_BY_PATH(last_name, ' / ') AS full_path
FROM   employees
START WITH manager_id IS NULL        -- root nodes
CONNECT BY PRIOR employee_id = manager_id  -- parent-child relationship
ORDER SIBLINGS BY last_name;         -- sort within each level
```

### Key CONNECT BY Pseudocolumns and Functions

| Feature | Description |
|---|---|
| `LEVEL` | Depth in the tree (1 = root) |
| `CONNECT_BY_ROOT expr` | Value of `expr` at the root of the current branch |
| `CONNECT_BY_ISLEAF` | 1 if the current row has no children, 0 otherwise |
| `CONNECT_BY_ISCYCLE` | 1 if a cycle was detected (requires `NOCYCLE` keyword) |
| `SYS_CONNECT_BY_PATH(col, delim)` | Path from root to current row |

```sql
-- Find all direct and indirect reports under manager 101
-- Including the top manager's name on every row
SELECT
  LEVEL,
  employee_id,
  last_name,
  CONNECT_BY_ROOT last_name  AS root_manager,
  CONNECT_BY_ISLEAF          AS is_leaf,
  SYS_CONNECT_BY_PATH(last_name, ' > ') AS path
FROM   employees
START WITH employee_id = 101
CONNECT BY PRIOR employee_id = manager_id;
```

### Detecting and Handling Cycles

```sql
-- Data quality check: find circular references in a hierarchy
SELECT employee_id, last_name, manager_id
FROM   employees
WHERE  CONNECT_BY_ISCYCLE = 1
START WITH manager_id IS NULL
CONNECT BY NOCYCLE PRIOR employee_id = manager_id;
```

### Generating Rows with CONNECT BY LEVEL

```sql
-- Generate a date series for a calendar table (no source table needed)
SELECT TRUNC(SYSDATE, 'YEAR') + LEVEL - 1 AS calendar_date
FROM   dual
CONNECT BY LEVEL <= 365;

-- Generate a sequence of numbers
SELECT LEVEL AS n FROM dual CONNECT BY LEVEL <= 10;
```

---

## PIVOT and UNPIVOT

### PIVOT: Rows to Columns

```sql
-- Summarize headcount per department per job category
-- Without PIVOT: requires CASE expressions per column
-- With PIVOT: clean and declarative

SELECT *
FROM (
  SELECT department_id, job_id, salary
  FROM   employees
)
PIVOT (
  SUM(salary)   AS total_sal,
  COUNT(*)      AS headcount
  FOR job_id IN (
    'IT_PROG'  AS it_prog,
    'SA_REP'   AS sales_rep,
    'ST_CLERK' AS stock_clerk,
    'MK_MAN'   AS mkt_mgr
  )
)
ORDER BY department_id;

-- Result columns: DEPARTMENT_ID, IT_PROG_TOTAL_SAL, IT_PROG_HEADCOUNT,
--                 SALES_REP_TOTAL_SAL, SALES_REP_HEADCOUNT, etc.
```

### Dynamic PIVOT (when column list is unknown at compile time)

Dynamic PIVOT requires dynamic SQL since the column list must be specified at parse time:

```plsql
DECLARE
  v_cols  CLOB;
  v_sql   CLOB;
BEGIN
  -- Build the IN list from distinct values
  SELECT LISTAGG('''' || job_id || ''' AS ' || LOWER(REPLACE(job_id,'-','_')), ', ')
         WITHIN GROUP (ORDER BY job_id)
  INTO   v_cols
  FROM  (SELECT DISTINCT job_id FROM employees WHERE department_id IN (50,60,80));

  v_sql := 'SELECT * FROM ('
        || '  SELECT department_id, job_id, salary FROM employees'
        || ') PIVOT (SUM(salary) FOR job_id IN (' || v_cols || '))'
        || ' ORDER BY department_id';

  EXECUTE IMMEDIATE v_sql;  -- in practice, open a ref cursor
END;
/
```

### UNPIVOT: Columns to Rows

```sql
-- Normalize a wide table into a key-value structure
-- Source: quarterly_sales(product_id, q1_sales, q2_sales, q3_sales, q4_sales)
SELECT product_id, quarter, sales_amount
FROM   quarterly_sales
UNPIVOT (
  sales_amount          -- name for the value column
  FOR quarter           -- name for the key column
  IN (
    q1_sales AS 'Q1',
    q2_sales AS 'Q2',
    q3_sales AS 'Q3',
    q4_sales AS 'Q4'
  )
)
ORDER BY product_id, quarter;
```

`INCLUDE NULLS` / `EXCLUDE NULLS` (default): controls whether rows where the value is NULL are included.

---

## MERGE Statement (Upsert)

`MERGE` combines INSERT and UPDATE (and optionally DELETE) into a single atomic statement. It is efficient for incremental loads and synchronization patterns because it reads the target table only once.

### Basic MERGE (Upsert)

```sql
-- Synchronize a staging table into the employees table
MERGE INTO employees tgt
USING (
  SELECT employee_id, first_name, last_name, salary, department_id, hire_date
  FROM   employees_staging
) src
ON (tgt.employee_id = src.employee_id)
WHEN MATCHED THEN
  UPDATE SET
    tgt.first_name     = src.first_name,
    tgt.last_name      = src.last_name,
    tgt.salary         = src.salary,
    tgt.department_id  = src.department_id
  WHERE tgt.salary != src.salary   -- optional filter: only update if something changed
WHEN NOT MATCHED THEN
  INSERT (employee_id, first_name, last_name, salary, department_id, hire_date)
  VALUES (src.employee_id, src.first_name, src.last_name,
          src.salary, src.department_id, src.hire_date);
```

### MERGE with DELETE

```sql
-- Delete matched rows if they are marked as inactive in the source
MERGE INTO employees tgt
USING employees_staging src
ON (tgt.employee_id = src.employee_id)
WHEN MATCHED THEN
  UPDATE SET tgt.salary = src.salary
  DELETE WHERE src.status = 'TERMINATED'  -- DELETE applies to rows just updated
WHEN NOT MATCHED THEN
  INSERT (employee_id, last_name, salary, hire_date)
  VALUES (src.employee_id, src.last_name, src.salary, src.hire_date);
```

### Conditional MERGE (INSERT-only if not exists)

```sql
-- Insert only if the row doesn't exist — skip updates entirely
MERGE INTO order_lookup tgt
USING (SELECT 101 AS order_id, 'PENDING' AS status FROM dual) src
ON (tgt.order_id = src.order_id)
WHEN NOT MATCHED THEN
  INSERT (order_id, status, created_at)
  VALUES (src.order_id, src.status, SYSDATE);
```

### MERGE Best Practices

- Always include a unique/primary key in the `ON` clause to avoid non-deterministic results.
- Add a `WHERE` clause in `WHEN MATCHED THEN UPDATE` to skip rows where nothing changed — this avoids unnecessary redo generation.
- Be aware that `MERGE` can trigger both `INSERT` and `UPDATE` triggers on the target table.
- If the source contains duplicate `ON` condition matches, Oracle raises `ORA-30926: unable to get a stable set of rows in the source tables`. Deduplicate the source before MERGE.

---

## MODEL Clause

The `MODEL` clause enables spreadsheet-like calculations over a relational result set, allowing cells to be referenced and computed based on other cells using array-style notation. It is powerful for financial modeling, budget allocations, and sequential calculations that are difficult in standard SQL.

### Basic MODEL Syntax

```sql
-- Project future sales based on historical growth rate
SELECT year, region, sales_amount
FROM (
  SELECT 2021 AS year, 'EAST' AS region, 150000 AS sales_amount FROM dual UNION ALL
  SELECT 2022, 'EAST', 165000 FROM dual UNION ALL
  SELECT 2023, 'EAST', 180000 FROM dual UNION ALL
  SELECT 2021, 'WEST', 200000 FROM dual UNION ALL
  SELECT 2022, 'WEST', 220000 FROM dual UNION ALL
  SELECT 2023, 'WEST', 242000 FROM dual
)
MODEL
  PARTITION BY (region)               -- one model grid per region
  DIMENSION BY (year)                 -- row key within the grid
  MEASURES     (sales_amount)         -- values to compute or reference
  RULES (
    -- Forecast years 2024 and 2025 based on 10% growth
    sales_amount[2024] = sales_amount[2023] * 1.10,
    sales_amount[2025] = sales_amount[2024] * 1.10,
    -- Or reference across partitions: can't cross PARTITION BY in standard MODEL
    -- Use REFERENCE MODEL for that
  )
ORDER BY region, year;
```

### MODEL with Iteration (ITERATE)

```sql
-- Compound interest calculation: iterate until convergence or N times
SELECT period, balance
FROM (SELECT 0 AS period, 10000 AS balance FROM dual)
MODEL
  DIMENSION BY (period)
  MEASURES (balance)
  RULES ITERATE (10) (   -- run 10 iterations
    balance[ITERATION_NUMBER + 1] = ROUND(balance[ITERATION_NUMBER] * 1.05, 2)
  )
ORDER BY period;
```

### MODEL Reference Rules

| Notation | Meaning |
|---|---|
| `col[2024]` | Specific cell where dimension = 2024 |
| `col[CV()]` | Cell in the current row (CV = current value) |
| `col[CV()-1]` | Cell in the previous row |
| `col[ANY]` | Wildcard — matches all cells |
| `col[year BETWEEN 2020 AND 2025]` | Range of cells |

```sql
-- Cumulative sum using MODEL (year-over-year running total)
SELECT year, sales, cumulative_sales
FROM   annual_sales
MODEL
  DIMENSION BY (year)
  MEASURES (sales, 0 AS cumulative_sales)
  RULES (
    cumulative_sales[year > 2019] ORDER BY year =
      cumulative_sales[CV()-1] + sales[CV()]
  )
ORDER BY year;
```

**When to use MODEL vs. analytic functions:** Analytic functions are almost always faster and clearer for standard running totals, rankings, and moving averages. Use `MODEL` when you need true cell-referencing semantics, cross-row assignments, or iterative calculations that cannot be expressed as a window function.

---

## Best Practices

- **Use analytic functions instead of self-joins.** `LAG`/`LEAD` and `FIRST_VALUE`/`LAST_VALUE` replace expensive self-joins for most row-comparison needs.
- **Use CTEs for readability, not necessarily performance.** Oracle's optimizer can inline CTEs. Use `/*+ MATERIALIZE */` or `/*+ INLINE */` to control behavior explicitly when it matters.
- **Prefer `CONNECT BY` for simple hierarchies, recursive CTEs for portability.** `CONNECT BY` is more concise for Oracle-only code; recursive CTEs are SQL standard.
- **Always handle cycles in hierarchical data.** Use `CONNECT BY NOCYCLE` or the `CYCLE` clause in recursive CTEs.
- **MERGE is not always faster than separate INSERT/UPDATE.** For very high-volume loads, a direct-path INSERT followed by a targeted UPDATE is sometimes faster. Measure both.
- **PIVOT column lists must be known at parse time.** Dynamic column lists require dynamic SQL.
- **Use UNPIVOT instead of UNION ALL chains.** `UNPIVOT` is more readable and often faster than multiple `UNION ALL` branches for normalization.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Using `LAST_VALUE` without the full frame clause | Returns wrong value due to default frame ending at current row | Always add `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` |
| Duplicate `ON` key rows in MERGE source | `ORA-30926: unable to get a stable set of rows` | Deduplicate source with `SELECT DISTINCT` or `ROWID` partitioned row filtering |
| Forgetting `SIBLINGS` in `CONNECT BY ORDER BY` | `ORDER BY` without `SIBLINGS` destroys the hierarchy ordering | Use `ORDER SIBLINGS BY` to sort within each level |
| Using `LEVEL` in `WHERE` instead of `START WITH` | Filters on `LEVEL` still traverse the whole tree | Put root conditions in `START WITH` |
| Over-using MODEL clause | Complex, slow, hard to maintain | Use analytic functions or PL/SQL for most problems; MODEL for genuine cell-reference needs |
| CTEs with window functions on large intermediate sets | Materializing a large CTE can be expensive | Analyze the plan; consider pushing predicates or using `INLINE` hint |

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference (SQLRF)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
- [Oracle Database 19c SQL Tuning Guide (TGSQL)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/)
- [Oracle Database 19c Data Warehousing Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/dwhsg/)
