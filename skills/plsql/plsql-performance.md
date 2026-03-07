# PL/SQL Performance

## Overview

PL/SQL performance optimization centers on minimizing context switches between the PL/SQL engine and SQL engine, processing data in sets rather than row-by-row, and caching results where appropriate. This guide covers the core techniques that produce the largest performance gains in production systems.

---

## Context Switch Cost

Every time PL/SQL sends a SQL statement to the SQL engine (or vice versa), a **context switch** occurs. These switches carry overhead: the engines must handshake, transfer data, and resume. In a loop processing 100,000 rows one at a time, this means 100,000 individual context switches — a primary cause of slow PL/SQL code.

```
PL/SQL Engine                 SQL Engine
     |                              |
     |  -- SELECT (1 row) -->       |
     |  <-- result -------------   |
     |  -- SELECT (1 row) -->       |  x N rows = N context switches
     |  <-- result -------------   |
     ...
```

The goal is to batch work: send one SQL statement that processes many rows, rather than many SQL statements that each process one row.

---

## Row-by-Row vs Set-Based Processing

### Row-by-Row (Slow by Slow)

```sql
-- ANTI-PATTERN: cursor loop with individual DML inside
PROCEDURE apply_10pct_raise IS
  CURSOR c_employees IS
    SELECT employee_id FROM employees WHERE department_id = 10;
BEGIN
  FOR rec IN c_employees LOOP
    -- Each iteration = 1 context switch to SQL engine
    UPDATE employees
    SET    salary = salary * 1.1
    WHERE  employee_id = rec.employee_id;
  END LOOP;
  COMMIT;
END apply_10pct_raise;
-- For 10,000 employees: 10,000 UPDATE context switches
```

### Set-Based (Fast)

```sql
-- PREFERRED: single SQL statement does all the work
PROCEDURE apply_10pct_raise IS
BEGIN
  UPDATE employees
  SET    salary = salary * 1.1
  WHERE  department_id = 10;
  COMMIT;
END apply_10pct_raise;
-- 1 context switch regardless of row count
```

### When PL/SQL Logic Is Required

When you cannot express the transformation in pure SQL (complex calculations, calls to PL/SQL functions per row), use bulk operations.

---

## BULK COLLECT with LIMIT Clause

`BULK COLLECT` fetches multiple rows into a collection in one context switch. The `LIMIT` clause bounds memory usage.

### Without LIMIT (Dangerous for Large Data Sets)

```sql
-- RISKY: fetches ALL rows into memory at once
DECLARE
  TYPE t_emp_tab IS TABLE OF employees%ROWTYPE;
  l_employees t_emp_tab;
BEGIN
  SELECT * BULK COLLECT INTO l_employees FROM employees;
  -- If employees has 5 million rows, this uses gigabytes of PGA
END;
```

### With LIMIT (Production Pattern)

```sql
PROCEDURE process_all_employees IS
  CURSOR c_emp IS
    SELECT employee_id, salary, department_id
    FROM   employees
    WHERE  status = 'ACTIVE';

  TYPE t_emp_tab IS TABLE OF c_emp%ROWTYPE;
  l_employees t_emp_tab;

  c_batch_size CONSTANT PLS_INTEGER := 1000;
BEGIN
  OPEN c_emp;
  LOOP
    -- Fetch up to 1000 rows per iteration = 1 context switch per batch
    FETCH c_emp BULK COLLECT INTO l_employees LIMIT c_batch_size;
    EXIT WHEN l_employees.COUNT = 0;

    -- Process the batch
    FOR i IN 1..l_employees.COUNT LOOP
      -- PL/SQL-only processing (no SQL context switch here)
      IF l_employees(i).salary < 30000 THEN
        l_employees(i).salary := 30000;  -- minimum wage floor
      END IF;
    END LOOP;

    -- Then do bulk DML on the processed batch
    FORALL i IN 1..l_employees.COUNT
      UPDATE employees
      SET    salary = l_employees(i).salary
      WHERE  employee_id = l_employees(i).employee_id;

    COMMIT;  -- commit each batch to manage undo/redo
  END LOOP;
  CLOSE c_emp;
END process_all_employees;
```

**Choosing LIMIT size**: 100–1000 is typical. Too small = many context switches. Too large = excessive PGA memory. Profile for your data volume and available PGA.

---

## FORALL with SAVE EXCEPTIONS

`FORALL` sends the entire collection to the SQL engine in one call, eliminating per-row context switches for DML.

### Basic FORALL

```sql
DECLARE
  TYPE t_id_tab  IS TABLE OF employees.employee_id%TYPE;
  TYPE t_sal_tab IS TABLE OF employees.salary%TYPE;

  l_ids     t_id_tab  := t_id_tab(101, 102, 103, 104, 105);
  l_salaries t_sal_tab := t_sal_tab(50000, 55000, 60000, 65000, 70000);
BEGIN
  FORALL i IN 1..l_ids.COUNT
    UPDATE employees
    SET    salary = l_salaries(i)
    WHERE  employee_id = l_ids(i);

  COMMIT;
END;
```

### FORALL with SAVE EXCEPTIONS

Without `SAVE EXCEPTIONS`, the first row that fails causes the entire `FORALL` to stop and roll back. With `SAVE EXCEPTIONS`, failures are collected and processing continues.

```sql
DECLARE
  TYPE t_order_tab IS TABLE OF orders%ROWTYPE;
  l_orders t_order_tab;

  -- Bulk exception type
  e_bulk_errors EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_bulk_errors, -24381);

  l_error_count NUMBER;
BEGIN
  -- Populate collection from staging table
  SELECT * BULK COLLECT INTO l_orders FROM orders_staging;

  BEGIN
    FORALL i IN 1..l_orders.COUNT SAVE EXCEPTIONS
      INSERT INTO orders VALUES l_orders(i);

  EXCEPTION
    WHEN e_bulk_errors THEN
      l_error_count := SQL%BULK_EXCEPTIONS.COUNT;
      DBMS_OUTPUT.PUT_LINE(l_error_count || ' rows failed:');

      FOR i IN 1..l_error_count LOOP
        DBMS_OUTPUT.PUT_LINE(
          '  Row index: ' || SQL%BULK_EXCEPTIONS(i).ERROR_INDEX ||
          '  Error: '     || SQLERRM(-SQL%BULK_EXCEPTIONS(i).ERROR_CODE)
        );

        -- Log or move to error table
        INSERT INTO orders_load_errors (
          order_id, error_code, error_message
        ) VALUES (
          l_orders(SQL%BULK_EXCEPTIONS(i).ERROR_INDEX).order_id,
          SQL%BULK_EXCEPTIONS(i).ERROR_CODE,
          SQLERRM(-SQL%BULK_EXCEPTIONS(i).ERROR_CODE)
        );
      END LOOP;
  END;

  COMMIT;
END;
/
```

`SQL%BULK_EXCEPTIONS` is a pseudo-collection with two fields:
- `ERROR_INDEX`: the collection subscript that failed
- `ERROR_CODE`: the Oracle error number (positive — negate it for `SQLERRM`)

`SQL%BULK_ROWCOUNT(i)` reports how many rows were affected by the i-th statement in a `FORALL`.

---

## Pipelined Table Functions

A pipelined function returns rows one at a time using `PIPE ROW`, allowing the caller to process rows as they are produced — like a Unix pipe. This avoids building the entire result set in memory.

```sql
-- Define a return type
CREATE TYPE t_report_row AS OBJECT (
  department_name VARCHAR2(50),
  employee_count  NUMBER,
  avg_salary      NUMBER
);

CREATE TYPE t_report_tab IS TABLE OF t_report_row;
/

-- Pipelined function
CREATE OR REPLACE FUNCTION get_dept_report
  RETURN t_report_tab PIPELINED
IS
  CURSOR c_depts IS
    SELECT d.department_name,
           COUNT(e.employee_id) AS emp_count,
           AVG(e.salary)        AS avg_sal
    FROM   departments d
    LEFT JOIN employees e ON e.department_id = d.department_id
    GROUP BY d.department_name;
BEGIN
  FOR rec IN c_depts LOOP
    -- PIPE ROW sends one row to the caller immediately
    -- Caller can start processing before the function finishes
    PIPE ROW(t_report_row(rec.department_name, rec.emp_count, rec.avg_sal));
  END LOOP;
  RETURN;  -- RETURN with no value is required for pipelined functions
END get_dept_report;
/

-- Use in SQL as a table source
SELECT * FROM TABLE(get_dept_report()) ORDER BY avg_salary DESC;

-- Or in a JOIN
SELECT r.department_name, r.avg_salary, b.budget
FROM   TABLE(get_dept_report()) r
JOIN   dept_budgets b ON b.department_name = r.department_name;
```

**Benefits**: Low memory footprint for large result sets; consumer can begin processing rows before the function completes; enables parallel queries on the result.

---

## NOCOPY Hint

By default, `IN OUT` parameters are passed by value — a copy is made on entry and another on exit. For large collections, this copying is expensive. `NOCOPY` passes by reference instead.

```sql
-- Without NOCOPY: collection is copied twice (in and out)
PROCEDURE sort_employees(p_employees IN OUT emp_collection_t) IS
BEGIN
  -- ... sorting logic ...
END sort_employees;

-- With NOCOPY: reference is passed — no copy overhead
PROCEDURE sort_employees(p_employees IN OUT NOCOPY emp_collection_t) IS
BEGIN
  -- ... sorting logic ...
END sort_employees;
```

### NOCOPY Trade-offs

| Aspect | By Value (default) | NOCOPY (by reference) |
|---|---|---|
| Performance | Slower for large collections | Faster — no copy |
| Isolation | If exception occurs, OUT param reverts | If exception occurs, partial changes may remain |
| Safety | Safer for rollback scenarios | Caller sees partially modified data on error |
| Large collections (>100 elements) | Noticeable overhead | Significant improvement |

**When to use NOCOPY**: Collections with hundreds or thousands of elements where performance is measured to be a bottleneck. Not suitable when partial modification on error would be harmful.

---

## RESULT_CACHE for Functions

`RESULT_CACHE` stores function results by input parameter values. Subsequent calls with the same inputs return cached results without re-executing the function body.

```sql
-- Function result is cached across sessions in the shared pool
CREATE OR REPLACE FUNCTION get_tax_rate(
  p_country_code IN VARCHAR2,
  p_tax_category IN VARCHAR2
) RETURN NUMBER
  RESULT_CACHE RELIES_ON (tax_rates)
IS
  l_rate NUMBER;
BEGIN
  SELECT rate INTO l_rate
  FROM   tax_rates
  WHERE  country_code = p_country_code
    AND  category     = p_tax_category;
  RETURN l_rate;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN 0;
END get_tax_rate;
/
```

`RELIES_ON (tax_rates)` tells Oracle to invalidate cached results when the `tax_rates` table is modified. In Oracle 11gR2+, `RELIES_ON` is optional — Oracle detects dependencies automatically.

### Result Cache Invalidation

The result cache is invalidated automatically when:
- A table listed in `RELIES_ON` is modified (DML + commit)
- The function is recompiled
- `DBMS_RESULT_CACHE.FLUSH` is called manually
- The shared pool is flushed

```sql
-- Manual cache management
EXEC DBMS_RESULT_CACHE.FLUSH;          -- flush everything
EXEC DBMS_RESULT_CACHE.BYPASS(TRUE);   -- disable result cache
EXEC DBMS_RESULT_CACHE.BYPASS(FALSE);  -- re-enable

-- Monitor result cache
SELECT name, status, scan_count, invalidations
FROM   v$result_cache_objects
WHERE  type = 'Result'
ORDER BY scan_count DESC;
```

---

## DETERMINISTIC Functions

`DETERMINISTIC` tells Oracle that for the same input values, the function always returns the same result. This hint allows Oracle to:
1. Cache the function result within a single SQL statement (avoids re-calling for same input)
2. Use the function in function-based indexes

```sql
CREATE OR REPLACE FUNCTION full_name(
  p_first IN VARCHAR2,
  p_last  IN VARCHAR2
) RETURN VARCHAR2 DETERMINISTIC IS
BEGIN
  RETURN p_last || ', ' || p_first;
END full_name;
/

-- Oracle calls this function once per unique (p_first, p_last) pair per query
SELECT full_name(first_name, last_name) FROM employees;

-- Can be used in a function-based index
CREATE INDEX idx_emp_fullname ON employees(full_name(first_name, last_name));
```

**Key difference from RESULT_CACHE**: `DETERMINISTIC` is a hint to the optimizer scoped to a single SQL execution; `RESULT_CACHE` persists results across calls and sessions.

**Warning**: If you mark a function as `DETERMINISTIC` but it depends on external state (sequences, `SYSDATE`, session variables), results will be incorrect. The declaration is not enforced — correctness is the developer's responsibility.

---

## Avoiding Unnecessary Parsing

Hard parsing is expensive: the SQL engine must check syntax, resolve objects, optimize the execution plan, and generate executable code. Soft parsing is much cheaper (reuse a cached cursor). PL/SQL helps by using static SQL that binds at compile time.

```sql
-- GOOD: PL/SQL static SQL — hard parsed once, reused every call
PROCEDURE get_employee(p_id IN NUMBER) IS
  l_emp employees%ROWTYPE;
BEGIN
  SELECT * INTO l_emp FROM employees WHERE employee_id = p_id;
END;

-- BAD: Dynamic SQL with concatenated literals — new hard parse every time
PROCEDURE get_employee_bad(p_id IN NUMBER) IS
  l_emp employees%ROWTYPE;
  l_sql VARCHAR2(200);
BEGIN
  l_sql := 'SELECT * FROM employees WHERE employee_id = ' || p_id;
  -- ^ different SQL text for each p_id = different cursor = hard parse every time
  EXECUTE IMMEDIATE l_sql INTO l_emp;
END;

-- ACCEPTABLE: Dynamic SQL with bind variables — parses once, reuses cursor
PROCEDURE get_employee_dynamic(p_id IN NUMBER) IS
  l_emp employees%ROWTYPE;
BEGIN
  EXECUTE IMMEDIATE
    'SELECT * FROM employees WHERE employee_id = :1'
    INTO l_emp USING p_id;
  -- Same SQL text every time = one hard parse, then cursor reuse
END;
```

---

## PL/SQL Function Result Cache Invalidation

Understanding when the result cache is invalidated prevents hard-to-diagnose staleness bugs.

```sql
-- Cache is INVALIDATED when:
-- 1. Any DML is committed on a dependency table
UPDATE tax_rates SET rate = 0.08 WHERE country_code = 'US';
COMMIT;  -- <-- cache for get_tax_rate invalidated here

-- 2. Function is recompiled
ALTER FUNCTION get_tax_rate COMPILE;

-- 3. Manual flush
EXECUTE DBMS_RESULT_CACHE.FLUSH;

-- Cache is NOT invalidated by:
-- - DML that is rolled back
-- - SELECT statements on dependency tables
-- - DDL on unrelated tables

-- Monitor for invalidation frequency
SELECT name, invalidations, scan_count
FROM   v$result_cache_objects
WHERE  type = 'Result' AND name LIKE '%GET_TAX_RATE%';
-- High invalidations with high scan_count = good cache use
-- High invalidations with low scan_count = cache provides little benefit
```

---

## Performance Checklist

| Check | Issue | Solution |
|---|---|---|
| Loop with DML inside | Row-by-row = context switches per row | Use `FORALL` with collection |
| `SELECT` inside a loop | N+1 query pattern | Bulk collect, then process |
| No `LIMIT` on `BULK COLLECT` | Unbounded memory usage | Always use `LIMIT 500` or similar |
| `IN OUT` large collection | Copy overhead on entry and exit | Add `NOCOPY` hint |
| Repeated calls with same params | Re-executing identical SQL | Use `RESULT_CACHE` |
| Dynamic SQL with concatenated values | Hard parse per unique value | Use bind variables with `:n` |
| Pipelined result built in full before return | High memory usage, delayed first row | Use `PIPELINED` with `PIPE ROW` |

---

## Version Notes

- **Oracle 11g+**: `RESULT_CACHE` for functions introduced. `RELIES_ON` still required in 11gR1; auto-detected in 11gR2+.
- **Oracle 12c+**: `PRAGMA UDF` (User Defined Function) hint reduces context switch overhead when a PL/SQL function is called from SQL. Apply when you cannot use SQL expressions instead.
- **All versions**: `BULK COLLECT` and `FORALL` are available since Oracle 9i and remain the primary bulk operation tools.

> ⚠️ Unverified: `PRAGMA SUPPRESSES_WARNING_6009` for pipelined functions — this pragma does not appear in Oracle 19c documentation. Check official docs for your specific version before use.

```sql
-- Oracle 12c+: PRAGMA UDF reduces context switch for SQL-called functions
CREATE OR REPLACE FUNCTION calculate_bonus(
  p_salary     IN NUMBER,
  p_percentage IN NUMBER
) RETURN NUMBER IS
  PRAGMA UDF;  -- hint: this function is called from SQL, optimize accordingly
BEGIN
  RETURN ROUND(p_salary * p_percentage / 100, 2);
END calculate_bonus;
/
```

---

## Sources

- Oracle Database 19c PL/SQL Language Reference — Optimization and Tuning: https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-optimization-and-tuning.html
- Oracle Database 19c PL/SQL Packages Reference — DBMS_RESULT_CACHE: https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_RESULT_CACHE.html
- Oracle Database 19c Reference — PLSQL_OPTIMIZE_LEVEL: https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/PLSQL_OPTIMIZE_LEVEL.html
- Oracle Database 19c PL/SQL Language Reference — INLINE Pragma: https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/INLINE-pragma.html
