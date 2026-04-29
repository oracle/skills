# PL/SQL Error Handling

## Overview

Robust error handling is one of the most critical aspects of PL/SQL development. Oracle provides a structured exception model that, when used correctly, produces reliable, diagnosable, and maintainable code. This guide covers the full exception hierarchy, raising techniques, diagnostic functions, logging patterns, and propagation rules.

---

## Oracle Exception Hierarchy

All Oracle exceptions derive from a common internal structure. There are three categories:

### 1. Predefined Exceptions

Named exceptions for common Oracle errors. No declaration needed — use them directly.

```sql
BEGIN
  SELECT salary INTO l_salary FROM employees WHERE employee_id = p_id;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    -- ORA-01403: no rows returned by SELECT INTO
    DBMS_OUTPUT.PUT_LINE('Employee not found');
  WHEN TOO_MANY_ROWS THEN
    -- ORA-01422: SELECT INTO returned more than one row
    DBMS_OUTPUT.PUT_LINE('Multiple employees matched');
  WHEN VALUE_ERROR THEN
    -- ORA-06502: conversion or size constraint error
    DBMS_OUTPUT.PUT_LINE('Data type or size mismatch');
  WHEN ZERO_DIVIDE THEN
    DBMS_OUTPUT.PUT_LINE('Division by zero');
  WHEN DUP_VAL_ON_INDEX THEN
    -- ORA-00001: unique constraint violation
    DBMS_OUTPUT.PUT_LINE('Duplicate value');
  WHEN CURSOR_ALREADY_OPEN THEN
    DBMS_OUTPUT.PUT_LINE('Cursor is already open');
  WHEN INVALID_CURSOR THEN
    DBMS_OUTPUT.PUT_LINE('Invalid cursor operation');
  WHEN LOGIN_DENIED THEN
    DBMS_OUTPUT.PUT_LINE('Invalid username/password');
  WHEN PROGRAM_ERROR THEN
    DBMS_OUTPUT.PUT_LINE('Internal PL/SQL error');
  WHEN TIMEOUT_ON_RESOURCE THEN
    DBMS_OUTPUT.PUT_LINE('Resource timeout');
END;
/
```

**Common predefined exceptions reference:**

| Exception Name | Oracle Error | Description |
|---|---|---|
| `NO_DATA_FOUND` | ORA-01403 | SELECT INTO returned no rows |
| `TOO_MANY_ROWS` | ORA-01422 | SELECT INTO returned more than one row |
| `DUP_VAL_ON_INDEX` | ORA-00001 | Unique constraint violated |
| `VALUE_ERROR` | ORA-06502 | Conversion or size error |
| `ZERO_DIVIDE` | ORA-01476 | Division by zero |
| `INVALID_NUMBER` | ORA-01722 | Implicit conversion failed |
| `CURSOR_ALREADY_OPEN` | ORA-06511 | Opened an already-open cursor |
| `INVALID_CURSOR` | ORA-01001 | Invalid cursor reference |
| `ROWTYPE_MISMATCH` | ORA-06504 | Cursor variable type mismatch |
| `COLLECTION_IS_NULL` | ORA-06531 | Operation on uninitialized collection |
| `SUBSCRIPT_BEYOND_COUNT` | ORA-06533 | Index beyond collection size |
| `SUBSCRIPT_OUTSIDE_LIMIT` | ORA-06532 | Index outside allowed range |
| `STORAGE_ERROR` | ORA-06500 | Out of memory |
| `TIMEOUT_ON_RESOURCE` | ORA-00051 | Timeout waiting for resource |
| `LOGIN_DENIED` | ORA-01017 | Authentication failure |

### 2. User-Defined Exceptions

Declared in a package spec or procedure/function for business logic errors:

```sql
CREATE OR REPLACE PACKAGE order_exceptions_pkg AS
  e_order_not_found    EXCEPTION;
  e_insufficient_stock EXCEPTION;
  e_order_already_shipped EXCEPTION;
END order_exceptions_pkg;
/

-- Usage in business logic
PROCEDURE ship_order(p_order_id IN NUMBER) IS
  l_status VARCHAR2(20);
  l_stock  NUMBER;
BEGIN
  SELECT status INTO l_status
  FROM   orders WHERE order_id = p_order_id;

  IF l_status = 'SHIPPED' THEN
    RAISE order_exceptions_pkg.e_order_already_shipped;
  END IF;

  -- ... ship the order ...

EXCEPTION
  WHEN order_exceptions_pkg.e_order_already_shipped THEN
    DBMS_OUTPUT.PUT_LINE('Order already shipped');
  WHEN NO_DATA_FOUND THEN
    RAISE order_exceptions_pkg.e_order_not_found;  -- re-raise as business exception
END ship_order;
/
```

### 3. Unnamed (Anonymous) Exceptions with PRAGMA EXCEPTION_INIT

Associate a name with any Oracle error number that lacks a predefined name:

```sql
DECLARE
  -- Assign a name to ORA-02292 (integrity constraint violation - child records exist)
  e_child_records_exist EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_child_records_exist, -2292);

  -- ORA-00054: resource busy and acquire with NOWAIT
  e_resource_busy EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_resource_busy, -54);

BEGIN
  DELETE FROM departments WHERE department_id = 10;

EXCEPTION
  WHEN e_child_records_exist THEN
    DBMS_OUTPUT.PUT_LINE('Cannot delete — child records exist');
  WHEN e_resource_busy THEN
    DBMS_OUTPUT.PUT_LINE('Row is locked by another session');
END;
/
```

**Best practice**: Declare commonly-used PRAGMA exceptions in a shared exceptions package to avoid redeclaring them everywhere.

```sql
CREATE OR REPLACE PACKAGE app_exceptions_pkg AS
  e_child_records_exist EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_child_records_exist, -2292);

  e_resource_busy EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_resource_busy, -54);

  e_deadlock EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_deadlock, -60);

  e_snapshot_too_old EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_snapshot_too_old, -1555);
END app_exceptions_pkg;
/
```

---

## RAISE and RAISE_APPLICATION_ERROR

### RAISE

Re-raises the current exception or raises a declared exception:

```sql
PROCEDURE process_data(p_id IN NUMBER) IS
BEGIN
  validate_data(p_id);
EXCEPTION
  WHEN VALUE_ERROR THEN
    -- Log it, then re-raise the original exception with full stack
    log_error(SQLERRM);
    RAISE;  -- re-raises VALUE_ERROR with original stack intact
END;
```

### RAISE_APPLICATION_ERROR

Raises an application-defined error with a custom message. Error numbers must be in the range `-20000` to `-20999`.

```sql
PROCEDURE validate_age(p_age IN NUMBER) IS
BEGIN
  IF p_age IS NULL THEN
    RAISE_APPLICATION_ERROR(-20001, 'Age cannot be null');
  END IF;
  IF p_age < 0 OR p_age > 150 THEN
    RAISE_APPLICATION_ERROR(-20002, 'Age out of valid range: ' || p_age);
  END IF;
END validate_age;
```

**Third parameter — keep existing error stack:**

```sql
EXCEPTION
  WHEN OTHERS THEN
    -- TRUE = append to existing error stack, FALSE = replace (default)
    RAISE_APPLICATION_ERROR(-20500, 'Unexpected error in process_order', TRUE);
END;
```

When `TRUE` is passed, the original Oracle error is preserved in the stack, making diagnosis easier.

---

## Error Diagnostic Functions

### SQLERRM

Returns the error message for the current or a specific error code:

```sql
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
    -- Output: "ORA-01403: no data found"
    -- SQLERRM without argument = current exception
    -- SQLERRM(-1403) = message for that error code
END;
```

**Limitation**: `SQLERRM` is truncated at 512 bytes. Use `DBMS_UTILITY.FORMAT_ERROR_STACK` for the full message.

### DBMS_UTILITY.FORMAT_ERROR_STACK

Returns the full error message (up to 2000 bytes), including chained errors:

```sql
EXCEPTION
  WHEN OTHERS THEN
    l_error_stack := DBMS_UTILITY.FORMAT_ERROR_STACK;
    -- Returns full error, not truncated at 512 like SQLERRM
END;
```

### DBMS_UTILITY.FORMAT_ERROR_BACKTRACE

**Critical for debugging**: Returns the line number where the exception was originally raised, not just where it was caught.

```sql
PROCEDURE outer_proc IS
BEGIN
  inner_proc;
EXCEPTION
  WHEN OTHERS THEN
    -- Without FORMAT_ERROR_BACKTRACE, you only know the error was caught here
    -- With it, you get the line in inner_proc where it originated
    DBMS_OUTPUT.PUT_LINE('Error stack: ' || DBMS_UTILITY.FORMAT_ERROR_STACK);
    DBMS_OUTPUT.PUT_LINE('Backtrace: '   || DBMS_UTILITY.FORMAT_ERROR_BACKTRACE);
    -- Output example:
    -- Backtrace: ORA-06512: at "MYSCHEMA.INNER_PROC", line 15
    --            ORA-06512: at "MYSCHEMA.OUTER_PROC", line 3
    RAISE;
END outer_proc;
```

### Comparison Table

| Function | Max Length | Shows Line Number | Shows Call Chain | Recommended Use |
|---|---|---|---|---|
| `SQLERRM` | 512 bytes | No | No | Simple logging only |
| `DBMS_UTILITY.FORMAT_ERROR_STACK` | 2000 bytes | No | Yes (chained errors) | Full error message |
| `DBMS_UTILITY.FORMAT_ERROR_BACKTRACE` | Varies | Yes | Yes (full call stack) | Pinpointing source |

**Best practice**: Always capture both `FORMAT_ERROR_STACK` and `FORMAT_ERROR_BACKTRACE` in error logs.

---

## Robust Error Logging with Autonomous Transactions

The challenge: if your main transaction rolls back due to an error, a regular `INSERT INTO error_log` also rolls back. Use `PRAGMA AUTONOMOUS_TRANSACTION` to ensure the log entry survives the rollback.

```sql
CREATE OR REPLACE PACKAGE BODY error_logger_pkg AS

  PROCEDURE log_error(
    p_module    IN VARCHAR2,
    p_procedure IN VARCHAR2,
    p_message   IN VARCHAR2 DEFAULT NULL
  ) IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    l_error_stack    VARCHAR2(4000);
    l_error_backtrace VARCHAR2(4000);
  BEGIN
    l_error_stack    := SUBSTR(DBMS_UTILITY.FORMAT_ERROR_STACK,    1, 4000);
    l_error_backtrace := SUBSTR(DBMS_UTILITY.FORMAT_ERROR_BACKTRACE, 1, 4000);

    INSERT INTO error_log (
      log_id,
      log_timestamp,
      db_user,
      os_user,
      module_name,
      procedure_name,
      error_stack,
      error_backtrace,
      custom_message,
      session_id
    ) VALUES (
      error_log_seq.NEXTVAL,
      SYSTIMESTAMP,
      SYS_CONTEXT('USERENV', 'SESSION_USER'),
      SYS_CONTEXT('USERENV', 'OS_USER'),
      p_module,
      p_procedure,
      l_error_stack,
      l_error_backtrace,
      p_message,
      SYS_CONTEXT('USERENV', 'SESSIONID')
    );
    COMMIT;  -- autonomous transaction commit — does NOT affect main transaction
  EXCEPTION
    WHEN OTHERS THEN
      -- If logging fails, do not propagate — would mask original error
      ROLLBACK;
  END log_error;

END error_logger_pkg;
/

-- Usage pattern
PROCEDURE process_order(p_order_id IN NUMBER) IS
BEGIN
  -- ... business logic ...
EXCEPTION
  WHEN OTHERS THEN
    error_logger_pkg.log_error(
      p_module    => 'ORDER_MGMT',
      p_procedure => 'PROCESS_ORDER',
      p_message   => 'order_id=' || p_order_id
    );
    RAISE;  -- always re-raise after logging
END process_order;
```

---

## Re-Raising Exceptions

### Simple Re-Raise (RAISE with no argument)

Preserves the original exception type and error code:

```sql
EXCEPTION
  WHEN OTHERS THEN
    log_error(...);
    RAISE;  -- original exception propagates up
```

### Re-Raise as Different Exception

Wraps the original in a new application error while preserving the stack:

```sql
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(
      -20404,
      'Customer not found: id=' || p_customer_id,
      TRUE  -- include original ORA-01403 in the stack
    );
END;
```

### Re-Raise in Nested Blocks

```sql
BEGIN
  BEGIN
    -- Inner block
    risky_operation;
  EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
      -- Handle locally and do NOT re-raise — exception is swallowed here
      handle_duplicate;
  END;
  -- Execution continues here if exception was handled
  next_operation;
EXCEPTION
  WHEN OTHERS THEN
    -- Only catches exceptions NOT handled in the inner block
    log_and_raise;
END;
```

---

## Exception Propagation Rules

1. If an exception is raised and there is **no handler** in the current block, it propagates to the **enclosing block**.
2. If it reaches the **outermost block** with no handler, the exception propagates to the **caller**.
3. If no caller handles it, the exception is returned to the client with an error message.
4. Exception handlers are searched in order — the **first matching** handler wins.
5. `WHEN OTHERS` matches everything and must be the **last** handler in a block.
6. An exception raised **within a handler** propagates immediately to the enclosing block (the current block's handlers are exhausted).

```sql
-- Propagation example
PROCEDURE a IS
BEGIN
  b;  -- if b raises unhandled exception, it propagates here
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    handle_in_a;  -- handles NO_DATA_FOUND from b
END a;

PROCEDURE b IS
BEGIN
  c;  -- if c raises unhandled exception, it propagates here
  -- No handler for NO_DATA_FOUND, so it propagates to a
END b;

PROCEDURE c IS
BEGIN
  SELECT ... INTO ... FROM ...;  -- raises NO_DATA_FOUND
  -- No handler — propagates to b
END c;
```

---

## The Dangers of WHEN OTHERS THEN NULL

This is one of the most dangerous anti-patterns in PL/SQL. It silently swallows all exceptions, making bugs impossible to diagnose.

```sql
-- DANGEROUS: Never do this
EXCEPTION
  WHEN OTHERS THEN
    NULL;  -- exception silently disappears
           -- callers have no idea something failed
           -- data may be inconsistent
           -- impossible to diagnose in production

-- ALSO DANGEROUS: logging but no re-raise
EXCEPTION
  WHEN OTHERS THEN
    log_error(...);  -- logs but then falls through
    -- caller thinks the operation succeeded!

-- CORRECT: Log and re-raise (or raise a new exception)
EXCEPTION
  WHEN OTHERS THEN
    error_logger_pkg.log_error(
      p_module    => 'ORDER_PKG',
      p_procedure => 'PROCESS_ORDER'
    );
    RAISE;  -- let the caller decide what to do
```

**The only legitimate use** of `WHEN OTHERS` without re-raising is when you have a genuine "best effort" operation where failure is truly acceptable and documented, such as in a logging procedure itself.

---

## Exception Handling Best Practices

1. **Always capture `FORMAT_ERROR_BACKTRACE`** in error logs — line numbers are invaluable.
2. **Use autonomous transactions for error logging** so logs survive rollbacks.
3. **Never use `WHEN OTHERS THEN NULL`** — always log and re-raise.
4. **Centralize error logging** in a single package to ensure consistency.
5. **Name exceptions in a shared package** — avoid redeclaring PRAGMA exceptions in every package body.
6. **Handle specific exceptions first** — `WHEN NO_DATA_FOUND` before `WHEN OTHERS`.
7. **Avoid empty exception sections** — if you catch it, handle it meaningfully.
8. **Preserve the original error** when wrapping with `RAISE_APPLICATION_ERROR` by passing `TRUE` as the third argument.
9. **Do not use exceptions for flow control** — exceptions are for unexpected conditions, not regular branching.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| `WHEN OTHERS THEN NULL` | Silently swallows errors | Always log and re-raise |
| Catching exception without re-raising | Caller thinks success | Re-raise or raise new exception |
| Using `SQLERRM` only | Truncated at 512 bytes; no line numbers | Use `FORMAT_ERROR_STACK` + `FORMAT_ERROR_BACKTRACE` |
| Error log INSERT without autonomous transaction | Log rolls back with main transaction | Use `PRAGMA AUTONOMOUS_TRANSACTION` |
| User error numbers outside -20000 to -20999 | May collide with Oracle errors | Use only the -20000 to -20999 range |
| Not passing `TRUE` to `RAISE_APPLICATION_ERROR` when wrapping | Loses original error context | Add `TRUE` as third parameter |
| Exception raised inside handler | Propagates to enclosing block unexpectedly | Wrap handler code in its own nested BEGIN/EXCEPTION/END |

---

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

- **Oracle 12c+**: `UTL_CALL_STACK` package provides a structured API to inspect the call stack, error stack, and backtrace programmatically — more powerful than `DBMS_UTILITY` string functions. Available functions confirmed in 19c docs: `ERROR_DEPTH`, `ERROR_NUMBER`, `ERROR_MSG`, `BACKTRACE_DEPTH`, `BACKTRACE_UNIT`, `BACKTRACE_LINE`, `DYNAMIC_DEPTH`, `SUBPROGRAM`, `OWNER`, `UNIT_LINE`.
- **All versions**: `DBMS_UTILITY.FORMAT_ERROR_BACKTRACE` requires the exception to be currently active (called from within the exception handler, or the backtrace is reset).
- **Oracle 10g+**: `DBMS_UTILITY.FORMAT_ERROR_BACKTRACE` was introduced. Before 10g, line numbers were unavailable without the PL/SQL Debugger.

```sql
-- Oracle 12c+: UTL_CALL_STACK for structured stack inspection
EXCEPTION
  WHEN OTHERS THEN
    FOR i IN 1..UTL_CALL_STACK.ERROR_DEPTH LOOP
      DBMS_OUTPUT.PUT_LINE(
        'Error ' || i || ': ' ||
        UTL_CALL_STACK.ERROR_NUMBER(i) || ' - ' ||
        UTL_CALL_STACK.ERROR_MSG(i)
      );
    END LOOP;
    FOR i IN 1..UTL_CALL_STACK.BACKTRACE_DEPTH LOOP
      DBMS_OUTPUT.PUT_LINE(
        'Backtrace ' || i || ': ' ||
        UTL_CALL_STACK.BACKTRACE_UNIT(i) || ' line ' ||
        UTL_CALL_STACK.BACKTRACE_LINE(i)
      );
    END LOOP;
END;
```

---

## See Also

- [PL/SQL Debugging](../plsql/plsql-debugging.md) — Runtime diagnosis tools: DBMS_OUTPUT, SQL trace, debugger

## Sources

- Oracle Database 19c PL/SQL Language Reference — Exception Handling: https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-error-handling.html
- Oracle Database 19c PL/SQL Language Reference — Predefined Exceptions: https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/predefined-exceptions.html
- Oracle Database 19c PL/SQL Packages Reference — DBMS_UTILITY: https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_UTILITY.html
- Oracle Database 19c PL/SQL Packages Reference — UTL_CALL_STACK: https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/UTL_CALL_STACK.html
