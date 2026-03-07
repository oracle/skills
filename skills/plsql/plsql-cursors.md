# PL/SQL Cursors

## Overview

A cursor is a handle to the context area that Oracle creates to process a SQL statement. Every SQL statement executed in a session uses a cursor. PL/SQL provides implicit cursors (automatically managed), explicit cursors (developer-controlled), and cursor variables (REF CURSORs, for passing result sets). Understanding cursor lifecycle, attributes, and safe patterns prevents resource leaks and incorrect result handling.

---

## Implicit Cursor Attributes

Oracle automatically creates an implicit cursor for every SQL statement that is not part of an explicit cursor. After the statement executes, four attributes describe the outcome. The implicit cursor is accessible via `SQL%` prefix.

| Attribute | Type | Description |
|---|---|---|
| `SQL%FOUND` | BOOLEAN | TRUE if the last SQL affected at least one row |
| `SQL%NOTFOUND` | BOOLEAN | TRUE if the last SQL affected zero rows |
| `SQL%ROWCOUNT` | INTEGER | Number of rows processed by last SQL |
| `SQL%ISOPEN` | BOOLEAN | Always FALSE for implicit cursors (Oracle closes them immediately) |

```sql
PROCEDURE update_employee_salary(
  p_employee_id IN employees.employee_id%TYPE,
  p_new_salary  IN employees.salary%TYPE
) IS
BEGIN
  UPDATE employees
  SET    salary = p_new_salary
  WHERE  employee_id = p_employee_id;

  IF SQL%NOTFOUND THEN
    RAISE_APPLICATION_ERROR(-20001, 'Employee not found: ' || p_employee_id);
  END IF;

  DBMS_OUTPUT.PUT_LINE('Updated ' || SQL%ROWCOUNT || ' row(s)');
  COMMIT;
END update_employee_salary;
/

PROCEDURE deactivate_old_sessions IS
BEGIN
  DELETE FROM user_sessions
  WHERE  last_activity < SYSDATE - 30;

  DBMS_OUTPUT.PUT_LINE('Deleted ' || SQL%ROWCOUNT || ' expired sessions');

  IF SQL%FOUND THEN
    COMMIT;
  END IF;
END deactivate_old_sessions;
/
```

**Important**: `SQL%` attributes reflect only the most recently executed SQL statement. Calling any other SQL statement — including inside exception handlers — overwrites them. Capture the value immediately after the DML.

```sql
-- WRONG: SQL%ROWCOUNT is overwritten by the INSERT in the exception handler
UPDATE employees SET salary = salary * 1.1 WHERE department_id = 10;
DECLARE
  l_updated NUMBER := SQL%ROWCOUNT;  -- CORRECT: capture immediately
BEGIN
  INSERT INTO salary_audit (changed_rows) VALUES (l_updated);
  -- SQL%ROWCOUNT here would reflect the INSERT, not the UPDATE
END;
```

---

## Explicit Cursor Lifecycle

An explicit cursor is declared, opened, fetched from, and closed. Each step is distinct and developer-controlled.

```sql
DECLARE
  -- 1. DECLARE: define query (not yet executed)
  CURSOR c_high_earners IS
    SELECT employee_id, last_name, salary
    FROM   employees
    WHERE  salary > 100000
    ORDER BY salary DESC;

  -- Matching record type
  l_emp c_high_earners%ROWTYPE;
BEGIN
  -- 2. OPEN: executes query, positions cursor before first row
  OPEN c_high_earners;

  -- 3. FETCH: retrieves next row into variables
  LOOP
    FETCH c_high_earners INTO l_emp;
    EXIT WHEN c_high_earners%NOTFOUND;  -- exit when no more rows

    DBMS_OUTPUT.PUT_LINE(l_emp.last_name || ': $' || l_emp.salary);
  END LOOP;

  -- 4. CLOSE: releases cursor resources
  CLOSE c_high_earners;
EXCEPTION
  WHEN OTHERS THEN
    -- Always close cursor on error to prevent resource leak
    IF c_high_earners%ISOPEN THEN
      CLOSE c_high_earners;
    END IF;
    RAISE;
END;
/
```

### Explicit Cursor Attributes

| Attribute | Description |
|---|---|
| `cursor%ISOPEN` | TRUE if the cursor is currently open |
| `cursor%FOUND` | TRUE if last FETCH returned a row |
| `cursor%NOTFOUND` | TRUE if last FETCH returned no row (end of results) |
| `cursor%ROWCOUNT` | Number of rows fetched so far from this cursor |

---

## Cursor FOR Loop (Preferred Pattern)

The cursor FOR loop is the preferred idiom for iterating all rows. Oracle implicitly opens, fetches, and closes the cursor — eliminating the risk of forgetting to close.

```sql
-- Preferred pattern: cursor FOR loop
-- Oracle handles OPEN, FETCH, EXIT, and CLOSE automatically
PROCEDURE print_department_employees(p_dept_id IN NUMBER) IS
BEGIN
  FOR emp IN (
    SELECT employee_id, last_name, salary
    FROM   employees
    WHERE  department_id = p_dept_id
    ORDER BY last_name
  ) LOOP
    DBMS_OUTPUT.PUT_LINE(emp.last_name || ' - $' || emp.salary);
  END LOOP;
  -- No need to open/close; automatically closed when loop exits normally OR on exception
END print_department_employees;
/

-- With a named cursor (useful when you need cursor attributes)
DECLARE
  CURSOR c_depts IS
    SELECT department_id, department_name FROM departments ORDER BY department_name;
BEGIN
  FOR dept IN c_depts LOOP
    DBMS_OUTPUT.PUT_LINE(
      dept.department_name ||
      ' (row ' || c_depts%ROWCOUNT || ')'
    );
  END LOOP;
END;
/
```

**When to use explicit lifecycle over cursor FOR loop**:
- You need to fetch in batches with `BULK COLLECT ... LIMIT`
- You need `%ISOPEN` checks (e.g., passing cursor to other procedures)
- You need partial iteration (exit before all rows are consumed)

---

## Parameterized Cursors

Cursors can accept parameters, making them reusable with different filter values.

```sql
DECLARE
  -- Parameterized cursor: different behavior per call
  CURSOR c_employees(
    p_dept_id    IN employees.department_id%TYPE,
    p_min_salary IN employees.salary%TYPE DEFAULT 0
  ) IS
    SELECT employee_id, last_name, salary
    FROM   employees
    WHERE  department_id = p_dept_id
      AND  salary >= p_min_salary
    ORDER BY salary DESC;

  l_emp c_employees%ROWTYPE;
BEGIN
  -- First use: all in dept 10
  FOR emp IN c_employees(p_dept_id => 10) LOOP
    DBMS_OUTPUT.PUT_LINE('[Dept 10] ' || emp.last_name);
  END LOOP;

  -- Second use: only high earners in dept 20
  FOR emp IN c_employees(p_dept_id => 20, p_min_salary => 80000) LOOP
    DBMS_OUTPUT.PUT_LINE('[Dept 20 high earner] ' || emp.last_name);
  END LOOP;
END;
/
```

---

## Weak vs Strong REF CURSORs

A `REF CURSOR` is a cursor variable — a pointer to a cursor that can be passed between programs. REF CURSORs enable returning result sets from PL/SQL to client applications or between packages.

### Weak REF CURSOR (SYS_REFCURSOR)

No return type constraint. Can point to any query. `SYS_REFCURSOR` is the built-in weak type.

```sql
-- Function returns a weak REF CURSOR
CREATE OR REPLACE FUNCTION get_employees_ref(
  p_dept_id IN NUMBER
) RETURN SYS_REFCURSOR IS
  l_cursor SYS_REFCURSOR;
BEGIN
  -- Can open to any query
  OPEN l_cursor FOR
    SELECT employee_id, last_name, salary
    FROM   employees
    WHERE  department_id = p_dept_id
    ORDER BY last_name;

  RETURN l_cursor;  -- caller is responsible for closing
END get_employees_ref;
/

-- Caller usage
DECLARE
  l_cursor SYS_REFCURSOR;
  l_id     NUMBER;
  l_name   VARCHAR2(50);
  l_sal    NUMBER;
BEGIN
  l_cursor := get_employees_ref(10);

  LOOP
    FETCH l_cursor INTO l_id, l_name, l_sal;
    EXIT WHEN l_cursor%NOTFOUND;
    DBMS_OUTPUT.PUT_LINE(l_name || ': ' || l_sal);
  END LOOP;

  CLOSE l_cursor;  -- caller must close
END;
/
```

### Strong REF CURSOR

Has a declared return type. Oracle validates that the cursor is opened to a compatible query at compile time.

```sql
-- Define a strong REF CURSOR type in a package spec
CREATE OR REPLACE PACKAGE employee_pkg AS
  -- Strong type: must return exactly this structure
  TYPE t_employee_cursor IS REF CURSOR RETURN employees%ROWTYPE;

  FUNCTION get_department_employees(
    p_dept_id IN NUMBER
  ) RETURN t_employee_cursor;

END employee_pkg;
/

CREATE OR REPLACE PACKAGE BODY employee_pkg AS

  FUNCTION get_department_employees(
    p_dept_id IN NUMBER
  ) RETURN t_employee_cursor IS
    l_cursor t_employee_cursor;
  BEGIN
    OPEN l_cursor FOR
      SELECT * FROM employees WHERE department_id = p_dept_id;
    -- Oracle verifies at compile time that SELECT * FROM employees
    -- matches the t_employee_cursor return type (employees%ROWTYPE)
    RETURN l_cursor;
  END get_department_employees;

END employee_pkg;
/
```

| | Weak REF CURSOR | Strong REF CURSOR |
|---|---|---|
| Return type | Any | Declared at type definition |
| Compile-time check | No | Yes |
| Flexibility | High | Lower |
| Error detection | Runtime | Compile time |
| `SYS_REFCURSOR` available | Yes (built-in) | No (must declare type) |

---

## Passing Cursor Variables Between Procedures

REF CURSORs can be passed as parameters, enabling one procedure to open a cursor and another to consume it.

```sql
-- Producer: opens cursor and returns via OUT parameter
PROCEDURE open_report_cursor(
  p_start_date IN  DATE,
  p_end_date   IN  DATE,
  p_cursor     OUT SYS_REFCURSOR
) IS
BEGIN
  OPEN p_cursor FOR
    SELECT o.order_id, o.order_date, c.customer_name, o.total_amount
    FROM   orders o
    JOIN   customers c ON c.customer_id = o.customer_id
    WHERE  o.order_date BETWEEN p_start_date AND p_end_date
    ORDER  BY o.order_date;
END open_report_cursor;
/

-- Consumer: processes the cursor
PROCEDURE process_report_cursor(
  p_cursor IN OUT SYS_REFCURSOR
) IS
  l_order_id     NUMBER;
  l_order_date   DATE;
  l_customer     VARCHAR2(100);
  l_total        NUMBER;
BEGIN
  LOOP
    FETCH p_cursor INTO l_order_id, l_order_date, l_customer, l_total;
    EXIT WHEN p_cursor%NOTFOUND;
    -- Process each row...
    DBMS_OUTPUT.PUT_LINE(l_customer || ': $' || l_total);
  END LOOP;
  -- Consumer closes cursor
  CLOSE p_cursor;
END process_report_cursor;
/

-- Orchestrator
DECLARE
  l_cur SYS_REFCURSOR;
BEGIN
  open_report_cursor(SYSDATE - 30, SYSDATE, l_cur);
  process_report_cursor(l_cur);
END;
/
```

---

## Cursor Expressions (CURSOR in SELECT)

A cursor expression embeds a sub-cursor inside a SELECT, enabling hierarchical result sets.

```sql
-- Return departments with a nested cursor of their employees
SELECT
  d.department_name,
  CURSOR(
    SELECT e.last_name, e.salary
    FROM   employees e
    WHERE  e.department_id = d.department_id
    ORDER BY e.salary DESC
  ) AS employee_cursor
FROM departments d;
```

Cursor expressions are primarily used in OCI (C) applications and when passing hierarchical data to JDBC. In PL/SQL, they can be processed with nested REF CURSOR variables.

---

## Avoiding Cursor Leaks

An open cursor that is never closed is a **cursor leak**. With enough leaks, the session exhausts `OPEN_CURSORS` (`ORA-01000: maximum open cursors exceeded`).

### Common Leak Patterns and Fixes

```sql
-- LEAK: exception raised before CLOSE
DECLARE
  CURSOR c IS SELECT * FROM large_table;
  l_row large_table%ROWTYPE;
BEGIN
  OPEN c;
  FETCH c INTO l_row;
  risky_procedure;  -- raises exception!
  CLOSE c;          -- NEVER REACHED
EXCEPTION
  WHEN OTHERS THEN
    -- c is still open — leak!
    RAISE;
END;

-- FIX: check %ISOPEN in exception handler
EXCEPTION
  WHEN OTHERS THEN
    IF c%ISOPEN THEN CLOSE c; END IF;
    RAISE;
END;

-- BEST FIX: use cursor FOR loop (auto-closes on normal exit AND exception)
BEGIN
  FOR row IN (SELECT * FROM large_table) LOOP
    risky_procedure;  -- exception here will still close the cursor
  END LOOP;
END;
```

### REF CURSOR Leak Pattern

```sql
-- LEAK: function returns cursor but caller forgets to close
DECLARE
  l_cur SYS_REFCURSOR;
BEGIN
  l_cur := get_employees_ref(10);
  -- ... process some rows ...
  -- forgot CLOSE l_cur;
END;  -- cursor leaked for duration of session

-- FIX: always close REF CURSORs, including on exception
DECLARE
  l_cur SYS_REFCURSOR;
BEGIN
  l_cur := get_employees_ref(10);
  -- process...
  CLOSE l_cur;
EXCEPTION
  WHEN OTHERS THEN
    IF l_cur%ISOPEN THEN CLOSE l_cur; END IF;
    RAISE;
END;
```

### Monitor Open Cursors

```sql
-- Find sessions with many open cursors
SELECT s.sid, s.username, s.program, COUNT(*) AS open_cursor_count
FROM   v$open_cursor oc
JOIN   v$session     s  ON s.sid = oc.sid
WHERE  oc.cursor_type = 'OPEN'
GROUP BY s.sid, s.username, s.program
ORDER BY open_cursor_count DESC;

-- Session's OPEN_CURSORS limit
SHOW PARAMETER open_cursors;
```

---

## Best Practices

- **Prefer cursor FOR loops** for all simple iterations — they never leak and are syntactically clean.
- **Use `BULK COLLECT ... LIMIT`** when you need bulk processing — do not use a cursor FOR loop when you need bulk efficiency.
- **Use `SYS_REFCURSOR`** (weak) for inter-package result set passing and for returning cursors to applications.
- **Use strong REF CURSORs** when the return structure is fixed and you want compile-time validation.
- **Always close explicit cursors and REF CURSORs** — use `%ISOPEN` check in exception handlers.
- **Capture `SQL%ROWCOUNT` immediately** after the DML statement, before any other SQL runs.
- **Parameterize cursors** rather than creating multiple near-identical cursors.
- **Never check `SQL%ISOPEN`** — it is always FALSE for implicit cursors.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Forgetting CLOSE on error path | Cursor leak → ORA-01000 | Use cursor FOR loop or `%ISOPEN` check in handler |
| Checking `SQL%ROWCOUNT` after another SQL | Returns wrong count | Capture into variable immediately after DML |
| Using `SQL%ISOPEN` | Always FALSE, pointless | Never check this; use `cursor_name%ISOPEN` for explicit cursors |
| Opening an already-open cursor | ORA-06511 | Check `%ISOPEN` before OPEN |
| Consuming a closed cursor | ORA-01001 | Check `%ISOPEN` before FETCH |
| Returning REF CURSOR without caller closing | Cursor leak | Document who owns the close; use consistent convention |
| FETCH after EOF without EXIT | Infinite loop | Always `EXIT WHEN cursor%NOTFOUND` |
| Cursor FOR loop with DML inside | Implicit cursor `SQL%ROWCOUNT` reflects last DML, not cursor fetch count | Use `cursor%ROWCOUNT` for fetch count |

---

## Version Notes

- **All versions**: `SYS_REFCURSOR` is available since Oracle 9i.
- **Oracle 12c+**: Implicit result sets using `DBMS_SQL.RETURN_RESULT` allow stored procedures to return result sets to JDBC/OCI callers without explicit OUT parameters — useful for SQL Server migration compatibility.

```sql
-- Oracle 12c+: Implicit result set (DBMS_SQL.RETURN_RESULT)
CREATE OR REPLACE PROCEDURE get_dept_report(p_dept_id IN NUMBER) AS
  l_cursor SYS_REFCURSOR;
BEGIN
  OPEN l_cursor FOR
    SELECT * FROM employees WHERE department_id = p_dept_id;

  -- Send result set to client without OUT parameter
  DBMS_SQL.RETURN_RESULT(l_cursor);
  -- Oracle closes the cursor automatically after transmission
END get_dept_report;
/
```

---

## Sources

- [Oracle Database PL/SQL Language Reference 19c — Cursors](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/static-sql.html) — implicit cursors, explicit cursors, cursor FOR loops, REF CURSORs
- [DBMS_SQL (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SQL.html) — RETURN_RESULT (12c+), TO_REFCURSOR (11gR2+)
- [Oracle Database Reference 19c — V$OPEN_CURSOR](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-OPEN_CURSOR.html) — monitoring open cursors
