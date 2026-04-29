# SQL Injection Avoidance in Oracle

## Overview

SQL injection is a code injection technique in which an attacker inserts malicious SQL fragments into a query by manipulating user-supplied input. In Oracle environments, injection can occur in both static application code and dynamic PL/SQL. The consequences range from unauthorized data access and data manipulation to privilege escalation and full database compromise.

Oracle provides a layered set of defenses: bind variables (the single most important protection), the `DBMS_ASSERT` package for whitelist validation, careful dynamic SQL construction, and application-level input validation. This guide covers each layer with concrete examples of vulnerable versus safe patterns.

---

## The Root Cause: String Concatenation

SQL injection becomes possible when user-supplied values are concatenated directly into a SQL string rather than passed as bind variables. Oracle then parses the resulting string as SQL, making it impossible to distinguish intended structure from injected input.

### Vulnerable Pattern

```plsql
-- DANGEROUS: user input is concatenated directly into the query string
CREATE OR REPLACE PROCEDURE get_employee_unsafe (
  p_name IN VARCHAR2
) AS
  v_sql VARCHAR2(500);
  v_result employees%ROWTYPE;
BEGIN
  -- If p_name = ' OR 1=1 --', this returns ALL rows
  -- If p_name = 'Smith'' UNION SELECT username,password,null,null FROM dba_users--'
  -- this leaks the DBA user table
  v_sql := 'SELECT * FROM employees WHERE last_name = ''' || p_name || '''';
  EXECUTE IMMEDIATE v_sql INTO v_result;
END;
/
```

When an attacker passes `' OR '1'='1`, the resulting SQL becomes:
```sql
SELECT * FROM employees WHERE last_name = '' OR '1'='1'
```
This returns every row in the table.

When an attacker passes `' UNION SELECT username, password, NULL, NULL FROM dba_users--`, the resulting SQL leaks DBA credentials.

---

## Bind Variables: The Primary Defense

Bind variables (also called bind parameters or parameterized queries) separate the SQL structure from its data values. The query is parsed once with placeholders; actual values are substituted at execution time. The database engine never re-parses the statement with injected content — the injected string is treated as a literal data value, not SQL syntax.

### Safe Static SQL with Bind Variables

```plsql
-- SAFE: bind variable prevents injection; also improves performance via plan reuse
CREATE OR REPLACE PROCEDURE get_employee_safe (
  p_name IN VARCHAR2
) AS
  v_result employees%ROWTYPE;
BEGIN
  SELECT *
  INTO   v_result
  FROM   employees
  WHERE  last_name = p_name;   -- p_name is a bind variable here

  DBMS_OUTPUT.PUT_LINE(v_result.first_name || ' ' || v_result.last_name);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('No employee found.');
  WHEN TOO_MANY_ROWS THEN
    DBMS_OUTPUT.PUT_LINE('Multiple employees found.');
END;
/
```

### Safe Dynamic SQL with Bind Variables via EXECUTE IMMEDIATE

```plsql
-- SAFE: EXECUTE IMMEDIATE with USING clause binds data separately from SQL structure
CREATE OR REPLACE PROCEDURE get_employee_dynamic_safe (
  p_name IN VARCHAR2
) AS
  v_sql       VARCHAR2(500);
  v_first     employees.first_name%TYPE;
  v_last      employees.last_name%TYPE;
BEGIN
  v_sql := 'SELECT first_name, last_name FROM employees WHERE last_name = :1';
  EXECUTE IMMEDIATE v_sql INTO v_first, v_last USING p_name;

  DBMS_OUTPUT.PUT_LINE(v_first || ' ' || v_last);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('No employee found.');
END;
/
```

### Multiple Bind Variables

```plsql
CREATE OR REPLACE PROCEDURE search_employees (
  p_dept_id  IN employees.department_id%TYPE,
  p_min_sal  IN employees.salary%TYPE,
  p_max_sal  IN employees.salary%TYPE
) AS
  TYPE emp_cursor IS REF CURSOR;
  v_cur    emp_cursor;
  v_sql    VARCHAR2(500);
  v_emp    employees%ROWTYPE;
BEGIN
  v_sql := 'SELECT * FROM employees '
        || 'WHERE department_id = :dept '
        || 'AND   salary BETWEEN :min_sal AND :max_sal '
        || 'ORDER BY last_name';

  OPEN v_cur FOR v_sql USING p_dept_id, p_min_sal, p_max_sal;
  LOOP
    FETCH v_cur INTO v_emp;
    EXIT WHEN v_cur%NOTFOUND;
    DBMS_OUTPUT.PUT_LINE(v_emp.last_name || ': ' || v_emp.salary);
  END LOOP;
  CLOSE v_cur;
END;
/
```

---

## DBMS_ASSERT: Whitelist Validation for Dynamic Structure

Bind variables protect data values but cannot protect dynamic SQL structure elements: table names, column names, schema names, and SQL keywords. These must be validated against a whitelist. Oracle's `DBMS_ASSERT` package provides built-in validators.

### DBMS_ASSERT Functions

| Function | What it validates |
|---|---|
| `DBMS_ASSERT.SQL_OBJECT_NAME(str)` | String is a valid, existing schema object name |
| `DBMS_ASSERT.SIMPLE_SQL_NAME(str)` | String matches the pattern of a simple SQL identifier (no quotes, spaces, or special chars) |
| `DBMS_ASSERT.QUALIFIED_SQL_NAME(str)` | String is a valid qualified name (e.g., `schema.table`) |
| `DBMS_ASSERT.SCHEMA_NAME(str)` | String is an existing schema name |
| `DBMS_ASSERT.ENQUOTE_NAME(str)` | Returns the string as a properly quoted identifier |
| `DBMS_ASSERT.ENQUOTE_LITERAL(str)` | Returns the string as a properly quoted SQL string literal (escapes single quotes) |
| `DBMS_ASSERT.NOOP(str)` | Returns the string unchanged — used as a documentation marker only, no validation |

Validation functions raise specific errors on failure: `SCHEMA_NAME` raises `ORA-44001`, `SQL_OBJECT_NAME` raises `ORA-44002`, `SIMPLE_SQL_NAME` raises `ORA-44003`, and `QUALIFIED_SQL_NAME` raises `ORA-44004`.

### Dynamic Table Name — Vulnerable vs. Safe

```plsql
-- DANGEROUS: an attacker can pass 'employees WHERE 1=1 UNION SELECT ...'
CREATE OR REPLACE PROCEDURE count_rows_unsafe (
  p_table_name IN VARCHAR2
) AS
  v_count NUMBER;
BEGIN
  EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM ' || p_table_name
    INTO v_count;
  DBMS_OUTPUT.PUT_LINE('Count: ' || v_count);
END;
/

-- SAFE: DBMS_ASSERT.SQL_OBJECT_NAME raises an error if the table doesn't exist
-- and rejects any string containing SQL syntax characters
CREATE OR REPLACE PROCEDURE count_rows_safe (
  p_table_name IN VARCHAR2
) AS
  v_count      NUMBER;
  v_safe_name  VARCHAR2(128);
BEGIN
  v_safe_name := DBMS_ASSERT.SQL_OBJECT_NAME(p_table_name);
  EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM ' || v_safe_name
    INTO v_count;
  DBMS_OUTPUT.PUT_LINE('Count: ' || v_count);
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE IN (-44001, -44002, -44003, -44004) THEN
      RAISE_APPLICATION_ERROR(-20001, 'Invalid table name provided.');
    ELSE
      RAISE;
    END IF;
END;
/
```

### Dynamic Column Name with SIMPLE_SQL_NAME

```plsql
-- SAFE: validates that the column name is a simple identifier
CREATE OR REPLACE PROCEDURE get_column_value (
  p_table_name  IN VARCHAR2,
  p_column_name IN VARCHAR2,
  p_row_id      IN NUMBER
) AS
  v_sql         VARCHAR2(500);
  v_value       VARCHAR2(4000);
  v_safe_table  VARCHAR2(128);
  v_safe_col    VARCHAR2(128);
BEGIN
  v_safe_table := DBMS_ASSERT.SQL_OBJECT_NAME(p_table_name);
  v_safe_col   := DBMS_ASSERT.SIMPLE_SQL_NAME(p_column_name);

  v_sql := 'SELECT TO_CHAR(' || v_safe_col || ') FROM ' || v_safe_table
        || ' WHERE id = :1';

  EXECUTE IMMEDIATE v_sql INTO v_value USING p_row_id;
  DBMS_OUTPUT.PUT_LINE(v_value);
END;
/
```

### ENQUOTE_LITERAL for String Values in Dynamic SQL

When you genuinely cannot use a bind variable (e.g., inside a DDL statement), use `DBMS_ASSERT.ENQUOTE_LITERAL` to safely quote a string value:

```plsql
-- Properly escapes embedded single quotes and wraps in quotes
DECLARE
  v_input    VARCHAR2(100) := 'O''Brien';   -- contains a single quote
  v_safe_lit VARCHAR2(200);
  v_sql      VARCHAR2(500);
BEGIN
  v_safe_lit := DBMS_ASSERT.ENQUOTE_LITERAL(v_input);
  -- v_safe_lit is now: 'O''Brien'  (properly escaped)

  v_sql := 'INSERT INTO audit_log(name) VALUES(' || v_safe_lit || ')';
  EXECUTE IMMEDIATE v_sql;
END;
/
```

---

## Dangerous Patterns and Their Safe Replacements

### Pattern 1: Dynamic WHERE clause construction from a list

```plsql
-- DANGEROUS: building IN list from concatenated input
-- Input: '1,2,3' becomes WHERE id IN (1,2,3) -- safe-looking but fragile
-- Input: '1,2) OR (1=1' becomes WHERE id IN (1,2) OR (1=1) -- injection!
v_sql := 'SELECT * FROM orders WHERE customer_id IN (' || p_id_list || ')';

-- SAFE: use a collection and TABLE() operator
CREATE OR REPLACE TYPE number_list AS TABLE OF NUMBER;
/

CREATE OR REPLACE PROCEDURE get_orders_by_ids (
  p_ids IN number_list
) AS
  TYPE order_cur IS REF CURSOR;
  v_cur order_cur;
BEGIN
  OPEN v_cur FOR
    SELECT * FROM orders
    WHERE  customer_id IN (SELECT COLUMN_VALUE FROM TABLE(p_ids));
  -- process cursor...
  CLOSE v_cur;
END;
/
```

### Pattern 2: Dynamic ORDER BY column

```plsql
-- DANGEROUS: ORDER BY from user input
v_sql := 'SELECT * FROM employees ORDER BY ' || p_sort_col;

-- SAFE: whitelist against known column names
CREATE OR REPLACE PROCEDURE get_employees_sorted (
  p_sort_col IN VARCHAR2
) AS
  v_safe_col VARCHAR2(30);
  v_sql      VARCHAR2(500);
BEGIN
  -- Explicit whitelist; reject anything not in the list
  v_safe_col := CASE p_sort_col
                  WHEN 'last_name'   THEN 'last_name'
                  WHEN 'salary'      THEN 'salary'
                  WHEN 'hire_date'   THEN 'hire_date'
                  WHEN 'employee_id' THEN 'employee_id'
                  ELSE NULL
                END;

  IF v_safe_col IS NULL THEN
    RAISE_APPLICATION_ERROR(-20002, 'Invalid sort column: ' || p_sort_col);
  END IF;

  v_sql := 'SELECT * FROM employees ORDER BY ' || v_safe_col;
  EXECUTE IMMEDIATE v_sql;
END;
/
```

### Pattern 3: Login / authentication query

```plsql
-- DANGEROUS: classic login bypass
-- Input username: admin' --
-- Results in: WHERE username = 'admin' --' AND password = '...'
-- The password check is commented out!
v_sql := 'SELECT COUNT(*) FROM users WHERE username = ''' || p_user
      || ''' AND password = ''' || p_pass || '''';

-- SAFE: use bind variables; the injected quote is treated as data
SELECT COUNT(*)
INTO   v_count
FROM   users
WHERE  username = p_user
AND    password = STANDARD_HASH(p_pass, 'SHA256');  -- also: don't store plaintext passwords
```

### Pattern 4: DBMS_SQL with dynamic bind variables (truly dynamic column count)

```plsql
-- SAFE: DBMS_SQL allows dynamic bind variable count at runtime
-- Use when the number of bind variables isn't known until runtime
CREATE OR REPLACE PROCEDURE flexible_search (
  p_conditions IN SYS.ODCIVARCHAR2LIST,  -- array of 'column_name=value' pairs
  p_values     IN SYS.ODCIVARCHAR2LIST
) AS
  v_cursor  INTEGER;
  v_sql     VARCHAR2(4000) := 'SELECT employee_id, last_name FROM employees WHERE 1=1';
  v_rows    INTEGER;
BEGIN
  -- Build WHERE clause with bind placeholders (never concatenate values)
  FOR i IN 1..p_conditions.COUNT LOOP
    -- Validate column name against whitelist before appending
    v_sql := v_sql || ' AND '
          || DBMS_ASSERT.SIMPLE_SQL_NAME(p_conditions(i))
          || ' = :b' || i;
  END LOOP;

  v_cursor := DBMS_SQL.OPEN_CURSOR;
  DBMS_SQL.PARSE(v_cursor, v_sql, DBMS_SQL.NATIVE);

  FOR i IN 1..p_values.COUNT LOOP
    DBMS_SQL.BIND_VARIABLE(v_cursor, ':b' || i, p_values(i));
  END LOOP;

  v_rows := DBMS_SQL.EXECUTE(v_cursor);
  DBMS_SQL.CLOSE_CURSOR(v_cursor);
END;
/
```

---

## Input Validation Layers

Defense in depth means applying validation at multiple layers. Bind variables handle data values; these techniques handle everything else.

### Application Tier Validation

- Validate data types before sending to the database (ensure numeric inputs are actually numeric).
- Enforce length limits; a surname field should never accept 4,000 characters.
- Use an allowlist (permitted characters) rather than a blocklist (forbidden characters). Blocklists always miss edge cases.
- Reject null bytes (`chr(0)`), escape sequences, and Unicode normalization tricks.

### PL/SQL Tier Validation

```plsql
-- Utility: validate that input is a positive integer
CREATE OR REPLACE FUNCTION is_positive_integer (p_input IN VARCHAR2)
RETURN BOOLEAN AS
  v_num NUMBER;
BEGIN
  v_num := TO_NUMBER(p_input);
  RETURN v_num = TRUNC(v_num) AND v_num > 0;
EXCEPTION
  WHEN VALUE_ERROR THEN
    RETURN FALSE;
END;
/

-- Utility: strip non-alphanumeric characters (use with caution — prefer whitelisting)
CREATE OR REPLACE FUNCTION sanitize_alphanumeric (p_input IN VARCHAR2)
RETURN VARCHAR2 AS
BEGIN
  RETURN REGEXP_REPLACE(p_input, '[^A-Za-z0-9 _-]', '');
END;
/
```

### Least Privilege at the Database Level

Even if injection occurs, a least-privilege schema limits the blast radius:

```sql
-- Application schema should have only the minimum required privileges
GRANT SELECT, INSERT, UPDATE ON hr.employees TO app_user;
-- Never GRANT DBA or GRANT ANY PRIVILEGE to application accounts

-- Use a dedicated low-privilege schema for application connections
-- Never connect as SYS or SYSTEM from application code
```

---

## Best Practices Summary

- **Always use bind variables** for data values in both static and dynamic SQL. This is the single most effective defense.
- **Validate dynamic identifiers** (table/column names) with `DBMS_ASSERT` functions or explicit whitelists before interpolating into SQL strings.
- **Never build SQL from unvalidated input** of any kind, even from internal sources — insider threat and compromised middleware are real.
- **Apply least privilege** to database accounts used by applications. An account with only `SELECT` on specific tables cannot drop tables even if injected SQL runs.
- **Log and alert on `DBMS_ASSERT` exceptions.** Repeated assertion failures are a strong signal of active probing.
- **Audit sensitive queries** using Fine-Grained Auditing (FGA) so injection attempts leave a trace.
- **Use connection pooling with application-specific schemas**, not DBA-level credentials.

---

## Common Mistakes

| Mistake | Why It's Dangerous | Fix |
|---|---|---|
| Concatenating numeric input directly | Numbers can still carry injection: `1 UNION SELECT...` | Validate type with `TO_NUMBER()`, then use bind variable |
| Trusting escaping/encoding | Encoding tricks (URL encoding, multi-byte characters) can bypass simple escaping | Use bind variables; escaping is not a substitute |
| Using `DBMS_ASSERT.NOOP` thinking it validates | `NOOP` does nothing — it is purely a documentation marker | Use `SIMPLE_SQL_NAME` or `SQL_OBJECT_NAME` |
| Whitelisting only in the UI layer | UI can be bypassed; direct API/DB access skips UI entirely | Always validate at the PL/SQL/database layer |
| Dynamic DDL from user input | `CREATE TABLE`, `DROP TABLE`, `GRANT` in dynamic SQL is very dangerous | Never allow user input to influence DDL structure |
| Storing credentials in source code | Credentials in code become injection entry points if code is exposed | Use Oracle Wallet or secret management tools |

---

## Oracle-Specific Notes

- Oracle's **Fine-Grained Auditing (FGA)** via `DBMS_FGA.ADD_POLICY` can alert when sensitive columns are accessed, providing detection capability alongside prevention.
- **Virtual Private Database (VPD)** adds predicates to queries automatically based on application context, limiting data exposure even if a query is injected.
- Oracle **Label Security** and **Database Vault** provide additional controls for environments with strict data segregation requirements.
- The `CURSOR_SHARING = FORCE` parameter can force bind variable use system-wide at the cost of some optimizer accuracy — it is a last resort, not a substitute for proper bind variable use in application code.
- Oracle **SQL Firewall** (21c+) can whitelist exactly which SQL statements are permitted from each database account, blocking any SQL that doesn't match the learned baseline.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference (SQLRF)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
- [DBMS_ASSERT — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_ASSERT.html)
- [DBMS_SQL — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SQL.html)
- [Oracle Database Security Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/)
