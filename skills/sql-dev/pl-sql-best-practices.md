# PL/SQL Best Practices

## Overview

PL/SQL is Oracle's procedural extension to SQL. It runs inside the database server, minimizing network round trips and enabling tight integration with Oracle's SQL engine. However, poorly written PL/SQL can be orders of magnitude slower than well-written PL/SQL. The most impactful techniques are bulk processing (eliminating row-by-row context switches), proper exception handling, disciplined cursor management, and structured package design.

This guide covers the patterns that have the greatest practical impact on performance, maintainability, and reliability.

---

## Context Switches and Why They Matter

The most important concept in PL/SQL performance is the **context switch**: every time PL/SQL calls the SQL engine to execute a single SQL statement, there is overhead for the transition between the PL/SQL virtual machine (PVM) and the SQL engine. When this happens once per row in a loop — the infamous "row-by-row" or "slow-by-slow" pattern — the overhead accumulates rapidly.

```plsql
-- SLOW: context switch on every iteration
FOR rec IN (SELECT employee_id, salary FROM employees WHERE department_id = 50) LOOP
  UPDATE employees
  SET    salary = rec.salary * 1.1
  WHERE  employee_id = rec.employee_id;   -- one SQL call per row
END LOOP;
```

The fix is to push work into the SQL engine, either as a set-based SQL statement or via bulk operations.

---

## BULK COLLECT and FORALL

### BULK COLLECT

`BULK COLLECT` fetches multiple rows into a collection in a single SQL call, eliminating the per-row context switch on the fetch side.

```plsql
DECLARE
  TYPE emp_id_list   IS TABLE OF employees.employee_id%TYPE;
  TYPE salary_list   IS TABLE OF employees.salary%TYPE;

  v_emp_ids  emp_id_list;
  v_salaries salary_list;
BEGIN
  -- Single SQL call fetches all matching rows
  SELECT employee_id, salary
  BULK COLLECT INTO v_emp_ids, v_salaries
  FROM   employees
  WHERE  department_id = 50;

  DBMS_OUTPUT.PUT_LINE('Fetched: ' || v_emp_ids.COUNT || ' employees');
END;
/
```

### Limiting Bulk Collect with LIMIT (Memory Management)

For very large result sets, fetching everything at once can exhaust PGA memory. Use `LIMIT` with a cursor loop to process in batches:

```plsql
DECLARE
  CURSOR emp_cur IS
    SELECT employee_id, salary
    FROM   employees
    WHERE  hire_date < DATE '2015-01-01';

  TYPE emp_rec_list IS TABLE OF emp_cur%ROWTYPE;
  v_batch   emp_rec_list;
  c_limit   CONSTANT PLS_INTEGER := 1000;
  v_total   PLS_INTEGER := 0;
BEGIN
  OPEN emp_cur;
  LOOP
    FETCH emp_cur BULK COLLECT INTO v_batch LIMIT c_limit;
    EXIT WHEN v_batch.COUNT = 0;

    -- Process each batch
    FOR i IN 1..v_batch.COUNT LOOP
      -- business logic here
      NULL;
    END LOOP;

    v_total := v_total + v_batch.COUNT;
    COMMIT;  -- commit each batch to avoid large undo segments
  END LOOP;
  CLOSE emp_cur;

  DBMS_OUTPUT.PUT_LINE('Processed: ' || v_total || ' rows');
END;
/
```

### FORALL

`FORALL` executes a DML statement once for each element in a collection, but sends all DML as a single batch to the SQL engine — a single context switch for the entire operation.

```plsql
DECLARE
  TYPE emp_id_list  IS TABLE OF employees.employee_id%TYPE;
  TYPE salary_list  IS TABLE OF employees.salary%TYPE;

  v_emp_ids   emp_id_list;
  v_new_sals  salary_list;
BEGIN
  -- Fetch the data
  SELECT employee_id, salary * 1.1
  BULK COLLECT INTO v_emp_ids, v_new_sals
  FROM   employees
  WHERE  department_id = 50;

  -- Apply the updates in bulk — one context switch for all rows
  FORALL i IN 1..v_emp_ids.COUNT
    UPDATE employees
    SET    salary = v_new_sals(i)
    WHERE  employee_id = v_emp_ids(i);

  DBMS_OUTPUT.PUT_LINE('Updated: ' || SQL%ROWCOUNT || ' rows');
  COMMIT;
END;
/
```

### FORALL with SAVE EXCEPTIONS

By default, `FORALL` stops on the first DML error. `SAVE EXCEPTIONS` continues processing and collects all errors for review:

```plsql
DECLARE
  TYPE id_list IS TABLE OF NUMBER;
  v_ids       id_list := id_list(101, 999999, 102, 103);  -- 999999 doesn't exist
  e_dml_errors EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_dml_errors, -24381);
BEGIN
  FORALL i IN 1..v_ids.COUNT SAVE EXCEPTIONS
    DELETE FROM employees WHERE employee_id = v_ids(i);

EXCEPTION
  WHEN e_dml_errors THEN
    FOR j IN 1..SQL%BULK_EXCEPTIONS.COUNT LOOP
      DBMS_OUTPUT.PUT_LINE(
        'Error at index ' || SQL%BULK_EXCEPTIONS(j).ERROR_INDEX
        || ': ' || SQLERRM(-SQL%BULK_EXCEPTIONS(j).ERROR_CODE)
      );
    END LOOP;
END;
/
```

---

## Exception Handling Patterns

### Always Name Your Exceptions

```plsql
DECLARE
  e_invalid_salary  EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_invalid_salary, -20001);  -- links ORA-20001 to the name

  e_emp_not_found   EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_emp_not_found, -20002);
BEGIN
  NULL;
END;
/
```

### The Standard Exception Block Pattern

```plsql
CREATE OR REPLACE PROCEDURE update_salary (
  p_employee_id IN  employees.employee_id%TYPE,
  p_new_salary  IN  employees.salary%TYPE,
  p_updated_by  IN  VARCHAR2 DEFAULT SYS_CONTEXT('USERENV','SESSION_USER')
) AS
  v_old_salary  employees.salary%TYPE;
BEGIN
  -- Input validation
  IF p_new_salary <= 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Salary must be positive.');
  END IF;

  -- Get current value for audit
  SELECT salary INTO v_old_salary
  FROM   employees
  WHERE  employee_id = p_employee_id
  FOR UPDATE NOWAIT;  -- lock immediately or raise error

  -- Apply change
  UPDATE employees
  SET    salary = p_new_salary,
         last_updated = SYSDATE
  WHERE  employee_id = p_employee_id;

  -- Audit trail
  INSERT INTO salary_audit(employee_id, old_salary, new_salary, changed_by, changed_on)
  VALUES (p_employee_id, v_old_salary, p_new_salary, p_updated_by, SYSTIMESTAMP);

  COMMIT;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20002,
      'Employee ' || p_employee_id || ' not found.');
  WHEN LOCK_TIMEOUT THEN
    RAISE_APPLICATION_ERROR(-20003,
      'Record is locked by another user. Try again.');
  WHEN OTHERS THEN
    ROLLBACK;
    -- Log the unexpected error before re-raising
    INSERT INTO error_log(proc_name, error_code, error_msg, logged_on)
    VALUES ('update_salary', SQLCODE, SQLERRM, SYSTIMESTAMP);
    COMMIT;  -- commit the log entry even though business transaction rolled back
    RAISE;   -- re-raise the original error to the caller
END;
/
```

### Never Swallow Exceptions Silently

```plsql
-- BAD: hides all errors; impossible to diagnose production issues
EXCEPTION
  WHEN OTHERS THEN
    NULL;

-- BAD: catches OTHERS but only logs to DBMS_OUTPUT (lost in production)
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);

-- GOOD: log to a table, then re-raise or raise_application_error
EXCEPTION
  WHEN OTHERS THEN
    log_error(p_context => 'update_salary', p_sqlcode => SQLCODE, p_sqlerrm => SQLERRM);
    RAISE;
```

### Using DBMS_UTILITY.FORMAT_ERROR_BACKTRACE

`SQLERRM` only reports the error message. `FORMAT_ERROR_BACKTRACE` returns the full call stack showing exactly which line raised the error — invaluable for debugging nested procedure calls.

```plsql
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_log(proc_name, error_code, error_msg, backtrace, logged_on)
    VALUES (
      'my_procedure',
      SQLCODE,
      SQLERRM,
      DBMS_UTILITY.FORMAT_ERROR_BACKTRACE,  -- shows line numbers
      SYSTIMESTAMP
    );
    COMMIT;
    RAISE;
END;
/
```

---

## Cursor Management

### Implicit vs. Explicit Cursors

```plsql
-- IMPLICIT cursor (single-row SELECT INTO): simplest form
-- Oracle automatically opens, fetches, and closes it
DECLARE
  v_name VARCHAR2(100);
BEGIN
  SELECT last_name INTO v_name FROM employees WHERE employee_id = 100;
  DBMS_OUTPUT.PUT_LINE(v_name);
EXCEPTION
  WHEN NO_DATA_FOUND THEN DBMS_OUTPUT.PUT_LINE('Not found');
  WHEN TOO_MANY_ROWS THEN DBMS_OUTPUT.PUT_LINE('Multiple rows returned');
END;
/

-- EXPLICIT cursor (multi-row): full control over open/fetch/close
DECLARE
  CURSOR dept_cur IS
    SELECT department_id, department_name FROM departments ORDER BY department_name;
  v_rec dept_cur%ROWTYPE;
BEGIN
  OPEN dept_cur;
  LOOP
    FETCH dept_cur INTO v_rec;
    EXIT WHEN dept_cur%NOTFOUND;
    DBMS_OUTPUT.PUT_LINE(v_rec.department_id || ': ' || v_rec.department_name);
  END LOOP;
  CLOSE dept_cur;  -- always close explicitly opened cursors
END;
/
```

### Cursor FOR Loop (Preferred for Simplicity)

The cursor FOR loop opens, fetches, and closes the cursor automatically. Use it when not doing bulk operations.

```plsql
BEGIN
  FOR rec IN (SELECT department_id, department_name FROM departments ORDER BY department_name) LOOP
    DBMS_OUTPUT.PUT_LINE(rec.department_id || ': ' || rec.department_name);
  END LOOP;
  -- cursor is automatically closed here
END;
/
```

### Always Close Explicitly Opened Cursors

```plsql
-- Pattern: use a nested block with exception handling to guarantee cursor closure
DECLARE
  v_cur SYS_REFCURSOR;
BEGIN
  BEGIN
    OPEN v_cur FOR SELECT * FROM employees WHERE department_id = 50;
    -- process...
    CLOSE v_cur;
  EXCEPTION
    WHEN OTHERS THEN
      IF v_cur%ISOPEN THEN
        CLOSE v_cur;
      END IF;
      RAISE;
  END;
END;
/
```

### Parameterized Cursors

```plsql
DECLARE
  CURSOR emp_by_dept(p_dept_id NUMBER) IS
    SELECT employee_id, last_name, salary
    FROM   employees
    WHERE  department_id = p_dept_id
    ORDER BY salary DESC;
BEGIN
  FOR rec IN emp_by_dept(50) LOOP
    DBMS_OUTPUT.PUT_LINE(rec.last_name || ': ' || rec.salary);
  END LOOP;
END;
/
```

---

## Package Structure

Packages are the fundamental unit of organization in PL/SQL. They provide encapsulation, state management, and significant performance benefits (entire package is loaded into shared pool on first use).

### Recommended Package Layout

```plsql
-- SPECIFICATION (public interface — the contract)
CREATE OR REPLACE PACKAGE emp_mgmt AS

  -- Public types
  TYPE emp_salary_rec IS RECORD (
    employee_id  employees.employee_id%TYPE,
    last_name    employees.last_name%TYPE,
    salary       employees.salary%TYPE
  );
  TYPE emp_salary_tab IS TABLE OF emp_salary_rec;

  -- Public constants
  c_max_salary_increase CONSTANT NUMBER := 0.30;  -- 30%

  -- Public procedure/function signatures
  PROCEDURE update_salary (
    p_employee_id IN  employees.employee_id%TYPE,
    p_new_salary  IN  employees.salary%TYPE
  );

  FUNCTION get_department_payroll (
    p_dept_id IN departments.department_id%TYPE
  ) RETURN NUMBER;

  FUNCTION get_high_earners (
    p_threshold IN NUMBER
  ) RETURN emp_salary_tab PIPELINED;

END emp_mgmt;
/

-- BODY (implementation — can change without recompiling dependent objects
--       as long as the spec signature doesn't change)
CREATE OR REPLACE PACKAGE BODY emp_mgmt AS

  -- Private constant (not visible outside the package)
  c_min_salary CONSTANT NUMBER := 2000;

  -- Private helper (not in spec — internal use only)
  PROCEDURE validate_salary (p_salary IN NUMBER) AS
  BEGIN
    IF p_salary < c_min_salary THEN
      RAISE_APPLICATION_ERROR(-20010, 'Salary below minimum: ' || c_min_salary);
    END IF;
    IF p_salary > 999999 THEN
      RAISE_APPLICATION_ERROR(-20011, 'Salary exceeds maximum.');
    END IF;
  END validate_salary;

  PROCEDURE update_salary (
    p_employee_id IN employees.employee_id%TYPE,
    p_new_salary  IN employees.salary%TYPE
  ) AS
  BEGIN
    validate_salary(p_new_salary);
    UPDATE employees SET salary = p_new_salary WHERE employee_id = p_employee_id;
    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20002, 'Employee not found: ' || p_employee_id);
    END IF;
  END update_salary;

  FUNCTION get_department_payroll (
    p_dept_id IN departments.department_id%TYPE
  ) RETURN NUMBER AS
    v_total NUMBER;
  BEGIN
    SELECT NVL(SUM(salary), 0)
    INTO   v_total
    FROM   employees
    WHERE  department_id = p_dept_id;
    RETURN v_total;
  END get_department_payroll;

  -- Pipelined function: returns rows one at a time, enabling streaming
  FUNCTION get_high_earners (
    p_threshold IN NUMBER
  ) RETURN emp_salary_tab PIPELINED AS
  BEGIN
    FOR rec IN (
      SELECT employee_id, last_name, salary
      FROM   employees
      WHERE  salary > p_threshold
      ORDER BY salary DESC
    ) LOOP
      PIPE ROW(emp_salary_rec(rec.employee_id, rec.last_name, rec.salary));
    END LOOP;
  END get_high_earners;

END emp_mgmt;
/
```

### Package-Level Variables for Session State

```plsql
CREATE OR REPLACE PACKAGE session_context AS
  -- Package variables persist for the duration of the session
  g_current_user    VARCHAR2(100);
  g_audit_enabled   BOOLEAN := TRUE;

  PROCEDURE initialize (p_user IN VARCHAR2);
  FUNCTION  is_audit_enabled RETURN BOOLEAN;
END session_context;
/

CREATE OR REPLACE PACKAGE BODY session_context AS
  PROCEDURE initialize (p_user IN VARCHAR2) AS
  BEGIN
    g_current_user  := p_user;
    g_audit_enabled := TRUE;
  END initialize;

  FUNCTION is_audit_enabled RETURN BOOLEAN AS
  BEGIN
    RETURN g_audit_enabled;
  END is_audit_enabled;
END session_context;
/
```

**Caution:** Package-level variables are session-specific and not shared across sessions. In a connection pool, a new call on a reused connection may see stale package state from a previous user. Always initialize package state at the start of each logical transaction.

---

## The NOCOPY Hint

By default, PL/SQL passes `IN OUT` and `OUT` parameters by value (a copy is made). For large collections or CLOBs, this copying is expensive. `NOCOPY` instructs the compiler to pass by reference instead.

```plsql
-- Without NOCOPY: large collection is copied on call and on return
CREATE OR REPLACE PROCEDURE process_data_slow (
  p_data IN OUT large_collection_type
) AS
BEGIN
  NULL;
END;
/

-- With NOCOPY: passed by reference, no copy overhead
CREATE OR REPLACE PROCEDURE process_data_fast (
  p_data IN OUT NOCOPY large_collection_type
) AS
BEGIN
  NULL;
END;
/
```

**Trade-off:** With `NOCOPY`, if an exception occurs inside the procedure, changes to the parameter are visible to the caller even after the exception, since there is no copy to discard. Use `NOCOPY` only when the performance gain is worth accepting this behavior — typically for read-only large collections passed to processing routines.

---

## Avoiding Context Switches: SET-Based vs. Row-by-Row

Always prefer a single SQL statement over a procedural loop when the logic can be expressed in SQL:

```plsql
-- SLOW: PL/SQL loop with per-row UPDATE
BEGIN
  FOR rec IN (SELECT employee_id FROM employees WHERE department_id = 50) LOOP
    UPDATE employees
    SET    salary = salary * 1.1
    WHERE  employee_id = rec.employee_id;
  END LOOP;
  COMMIT;
END;
/

-- FAST: single SQL statement — zero context switches
BEGIN
  UPDATE employees
  SET    salary = salary * 1.1
  WHERE  department_id = 50;
  COMMIT;
END;
/

-- FAST (when row-by-row logic is unavoidable): BULK COLLECT + FORALL
DECLARE
  TYPE id_list IS TABLE OF employees.employee_id%TYPE;
  v_ids id_list;
BEGIN
  SELECT employee_id BULK COLLECT INTO v_ids
  FROM   employees WHERE department_id = 50;

  FORALL i IN 1..v_ids.COUNT
    UPDATE employees SET salary = salary * 1.1 WHERE employee_id = v_ids(i);
  COMMIT;
END;
/
```

---

## Logging Patterns

### Error Log Table

```sql
CREATE TABLE error_log (
  log_id       NUMBER GENERATED ALWAYS AS IDENTITY,
  log_time     TIMESTAMP DEFAULT SYSTIMESTAMP,
  username     VARCHAR2(128) DEFAULT SYS_CONTEXT('USERENV','SESSION_USER'),
  program      VARCHAR2(256),
  error_code   NUMBER,
  error_msg    VARCHAR2(4000),
  backtrace    CLOB,
  call_stack   CLOB,
  extra_info   VARCHAR2(4000)
);
```

### Logging Package

```plsql
CREATE OR REPLACE PACKAGE app_logger AS
  PROCEDURE log_error (
    p_program    IN VARCHAR2,
    p_extra_info IN VARCHAR2 DEFAULT NULL
  );

  PROCEDURE log_info (
    p_program IN VARCHAR2,
    p_message IN VARCHAR2
  );
END app_logger;
/

CREATE OR REPLACE PACKAGE BODY app_logger AS

  -- Uses an autonomous transaction so the log is committed
  -- even if the calling transaction rolls back
  PROCEDURE log_error (
    p_program    IN VARCHAR2,
    p_extra_info IN VARCHAR2 DEFAULT NULL
  ) AS
    PRAGMA AUTONOMOUS_TRANSACTION;
  BEGIN
    INSERT INTO error_log (program, error_code, error_msg, backtrace, call_stack, extra_info)
    VALUES (
      p_program,
      SQLCODE,
      SQLERRM,
      DBMS_UTILITY.FORMAT_ERROR_BACKTRACE,
      DBMS_UTILITY.FORMAT_CALL_STACK,
      p_extra_info
    );
    COMMIT;
  END log_error;

  PROCEDURE log_info (
    p_program IN VARCHAR2,
    p_message IN VARCHAR2
  ) AS
    PRAGMA AUTONOMOUS_TRANSACTION;
  BEGIN
    INSERT INTO error_log (program, error_code, error_msg)
    VALUES (p_program, 0, p_message);
    COMMIT;
  END log_info;

END app_logger;
/
```

**Usage in exception handlers:**

```plsql
EXCEPTION
  WHEN OTHERS THEN
    app_logger.log_error(
      p_program    => 'emp_mgmt.update_salary',
      p_extra_info => 'employee_id=' || p_employee_id
    );
    RAISE;
END;
```

---

## Best Practices Summary

- **Use BULK COLLECT + FORALL** for any loop that processes more than a few hundred rows.
- **Limit BULK COLLECT** with a batch size (1000–10000) for large tables to control PGA usage.
- **Always re-raise or translate** exceptions — never swallow them silently.
- **Include FORMAT_ERROR_BACKTRACE** in error logs, not just SQLERRM.
- **Close every cursor** you explicitly open, even in exception paths.
- **Organize code in packages** — never deploy standalone procedures or functions in a large system.
- **Keep package specs stable** — changing a spec invalidates all dependent objects; the body can change freely.
- **Use NOCOPY** for large `IN OUT` collection parameters where exceptions are not a concern.
- **Log with autonomous transactions** so log entries survive a rollback.
- **Initialize package-level state** at the start of each request in pooled connection environments.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Row-by-row DML in a loop | Thousands of context switches; very slow | Use a set-based UPDATE/DELETE, or BULK COLLECT + FORALL |
| `WHEN OTHERS THEN NULL` | Silently discards all errors | Always log and re-raise |
| Forgetting to close explicit cursors | Open cursor leak; eventually hits `ORA-01000: maximum open cursors exceeded` | Use cursor FOR loops or close in exception handler |
| `DBMS_OUTPUT.PUT_LINE` for error logging | Output is buffered; lost in production; async jobs never display it | Log to an error table using an autonomous transaction |
| Large `BULK COLLECT` without `LIMIT` | PGA exhaustion on tables with millions of rows | Always use `LIMIT c_limit` in a fetch loop |
| Package state in connection pools | Session variable holds value from previous user's session | Initialize package state at request start via an initialization call |
| Using `PRAGMA AUTONOMOUS_TRANSACTION` for business logic | Hides changes from the calling transaction; makes rollback impossible | Use autonomous transactions only for logging/auditing |

---

## Sources

- [Oracle Database 19c PL/SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/)
- [Oracle Database 19c SQL Tuning Guide (TGSQL)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/)
- [Oracle Database 19c PL/SQL Packages and Types Reference (ARPLS)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/)
