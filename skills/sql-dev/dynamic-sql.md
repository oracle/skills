# Dynamic SQL in Oracle

## Overview

Dynamic SQL refers to SQL statements that are constructed and executed at runtime rather than compiled at parse time. It is necessary when the SQL structure itself (table names, column names, number of bind variables, or entire clauses) cannot be known until execution. Oracle provides two mechanisms: `EXECUTE IMMEDIATE` for most use cases, and `DBMS_SQL` for advanced scenarios requiring truly dynamic bind variable counts or cursor sharing across procedure boundaries.

Dynamic SQL introduces risks — primarily SQL injection and performance overhead from hard parsing — that must be managed deliberately. This guide covers how to use both mechanisms safely and efficiently.

---

## When to Use Dynamic SQL

Use dynamic SQL when static SQL cannot express what you need:

- The table name or column name is determined at runtime
- The number or names of bind variables change between executions
- DDL must be executed from PL/SQL (DDL cannot appear in static PL/SQL)
- The WHERE clause is built conditionally based on which filter parameters are provided
- You need to execute a SQL string passed in as a parameter

Do **not** use dynamic SQL:
- When static SQL can do the same job (it will always be faster and safer)
- To work around privilege issues by running SQL under a different schema
- When the "dynamic" part is actually a small, known set of values (use CASE instead)

---

## EXECUTE IMMEDIATE

`EXECUTE IMMEDIATE` is the preferred dynamic SQL mechanism for the vast majority of cases. It parses and executes a string in a single step.

### Basic Syntax

```plsql
-- DML or DDL (no bind variables needed for DDL)
EXECUTE IMMEDIATE 'CREATE TABLE temp_results (id NUMBER, result VARCHAR2(200))';

-- DML with bind variables (USING clause)
EXECUTE IMMEDIATE 'UPDATE employees SET salary = :1 WHERE employee_id = :2'
  USING p_new_salary, p_employee_id;

-- Query returning a single row (INTO clause)
EXECUTE IMMEDIATE 'SELECT last_name FROM employees WHERE employee_id = :1'
  INTO  v_last_name
  USING p_employee_id;

-- Query returning multiple rows (OPEN ... FOR syntax)
OPEN v_ref_cursor FOR
  'SELECT employee_id, last_name FROM employees WHERE department_id = :1'
  USING p_dept_id;
```

### DDL from PL/SQL

Static PL/SQL cannot execute DDL. `EXECUTE IMMEDIATE` is the standard workaround:

```plsql
CREATE OR REPLACE PROCEDURE create_staging_table (
  p_table_suffix IN VARCHAR2
) AS
  v_table_name VARCHAR2(128);
BEGIN
  -- Validate the suffix — never concatenate unvalidated input into DDL
  v_table_name := 'STAGING_' || DBMS_ASSERT.SIMPLE_SQL_NAME(p_table_suffix);

  EXECUTE IMMEDIATE
    'CREATE TABLE ' || v_table_name || ' ('
    || '  id          NUMBER GENERATED ALWAYS AS IDENTITY,'
    || '  load_date   DATE DEFAULT SYSDATE,'
    || '  payload     VARCHAR2(4000)'
    || ')';

  DBMS_OUTPUT.PUT_LINE('Created table: ' || v_table_name);
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -955 THEN  -- ORA-00955: name is already used
      DBMS_OUTPUT.PUT_LINE('Table already exists: ' || v_table_name);
    ELSE
      RAISE;
    END IF;
END;
/
```

### SELECT INTO with EXECUTE IMMEDIATE

```plsql
CREATE OR REPLACE PROCEDURE get_column_value (
  p_table_name  IN  VARCHAR2,
  p_column_name IN  VARCHAR2,
  p_id          IN  NUMBER,
  p_value       OUT VARCHAR2
) AS
  v_sql         VARCHAR2(500);
  v_safe_table  VARCHAR2(128);
  v_safe_col    VARCHAR2(128);
BEGIN
  -- Validate identifiers before building SQL structure
  v_safe_table := DBMS_ASSERT.SQL_OBJECT_NAME(p_table_name);
  v_safe_col   := DBMS_ASSERT.SIMPLE_SQL_NAME(p_column_name);

  v_sql := 'SELECT TO_CHAR(' || v_safe_col
        || ') FROM ' || v_safe_table
        || ' WHERE id = :id_val';

  EXECUTE IMMEDIATE v_sql INTO p_value USING p_id;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_value := NULL;
END;
/
```

### Ref Cursors with EXECUTE IMMEDIATE

Ref cursors (SYS_REFCURSOR) allow you to return a dynamic result set to the caller. This is the standard pattern for passing dynamic query results to a calling application or another PL/SQL block.

```plsql
CREATE OR REPLACE PROCEDURE search_employees (
  p_dept_id   IN  NUMBER   DEFAULT NULL,
  p_min_sal   IN  NUMBER   DEFAULT NULL,
  p_job_id    IN  VARCHAR2 DEFAULT NULL,
  p_cursor    OUT SYS_REFCURSOR
) AS
  v_sql       CLOB;
  v_where     VARCHAR2(1000) := ' WHERE 1=1';
BEGIN
  -- Build the WHERE clause conditionally
  -- Each data value is a named bind variable — never concatenated
  IF p_dept_id IS NOT NULL THEN
    v_where := v_where || ' AND department_id = :dept_id';
  END IF;
  IF p_min_sal IS NOT NULL THEN
    v_where := v_where || ' AND salary >= :min_sal';
  END IF;
  IF p_job_id IS NOT NULL THEN
    v_where := v_where || ' AND job_id = :job_id';
  END IF;

  v_sql := 'SELECT employee_id, last_name, salary, department_id, job_id'
        || ' FROM employees'
        || v_where
        || ' ORDER BY last_name';

  -- USING clause must match all bind variables in the WHERE clause
  -- This requires knowing which were added — use a helper or DBMS_SQL for fully dynamic binds
  IF p_dept_id IS NOT NULL AND p_min_sal IS NOT NULL AND p_job_id IS NOT NULL THEN
    OPEN p_cursor FOR v_sql USING p_dept_id, p_min_sal, p_job_id;
  ELSIF p_dept_id IS NOT NULL AND p_min_sal IS NOT NULL THEN
    OPEN p_cursor FOR v_sql USING p_dept_id, p_min_sal;
  ELSIF p_dept_id IS NOT NULL AND p_job_id IS NOT NULL THEN
    OPEN p_cursor FOR v_sql USING p_dept_id, p_job_id;
  ELSIF p_min_sal IS NOT NULL AND p_job_id IS NOT NULL THEN
    OPEN p_cursor FOR v_sql USING p_min_sal, p_job_id;
  ELSIF p_dept_id IS NOT NULL THEN
    OPEN p_cursor FOR v_sql USING p_dept_id;
  ELSIF p_min_sal IS NOT NULL THEN
    OPEN p_cursor FOR v_sql USING p_min_sal;
  ELSIF p_job_id IS NOT NULL THEN
    OPEN p_cursor FOR v_sql USING p_job_id;
  ELSE
    OPEN p_cursor FOR v_sql;
  END IF;

  -- Note: the branching above becomes unwieldy for many optional parameters.
  -- Use DBMS_SQL (see below) when the number of bind variables is truly dynamic.
END;
/
```

---

## DBMS_SQL

`DBMS_SQL` is the lower-level API for dynamic SQL. It requires more code but supports:

- A dynamic number of bind variables (no branching required)
- Fetching into a dynamic number of columns
- Reusing a parsed cursor across multiple executions (reducing parse overhead)
- Converting a `DBMS_SQL` cursor to a `REF CURSOR` and vice versa

### DBMS_SQL Processing Steps

1. `OPEN_CURSOR` — obtain a cursor handle
2. `PARSE` — parse the SQL string
3. `BIND_VARIABLE` / `BIND_ARRAY` — bind values
4. `DEFINE_COLUMN` — register output columns (for SELECT)
5. `EXECUTE` — execute the statement
6. `FETCH_ROWS` — fetch rows (for SELECT)
7. `COLUMN_VALUE` — retrieve column values after fetch
8. `CLOSE_CURSOR` — release resources

### Example: Dynamic INSERT with Variable Bind Count

```plsql
CREATE OR REPLACE PROCEDURE dynamic_insert (
  p_table_name  IN VARCHAR2,
  p_col_names   IN SYS.ODCIVARCHAR2LIST,  -- e.g., SYS.ODCIVARCHAR2LIST('name','salary')
  p_col_values  IN SYS.ODCIVARCHAR2LIST   -- all values as strings; cast as needed
) AS
  v_cursor   INTEGER;
  v_sql      CLOB;
  v_cols     VARCHAR2(4000) := '';
  v_binds    VARCHAR2(4000) := '';
  v_rows     INTEGER;
  v_table    VARCHAR2(128);
BEGIN
  -- Validate table name
  v_table := DBMS_ASSERT.SQL_OBJECT_NAME(p_table_name);

  -- Build column list and bind placeholder list
  FOR i IN 1..p_col_names.COUNT LOOP
    v_cols  := v_cols  || DBMS_ASSERT.SIMPLE_SQL_NAME(p_col_names(i));
    v_binds := v_binds || ':b' || i;
    IF i < p_col_names.COUNT THEN
      v_cols  := v_cols  || ', ';
      v_binds := v_binds || ', ';
    END IF;
  END LOOP;

  v_sql := 'INSERT INTO ' || v_table || ' (' || v_cols || ') VALUES (' || v_binds || ')';

  -- Parse and bind
  v_cursor := DBMS_SQL.OPEN_CURSOR;
  BEGIN
    DBMS_SQL.PARSE(v_cursor, v_sql, DBMS_SQL.NATIVE);

    FOR i IN 1..p_col_values.COUNT LOOP
      DBMS_SQL.BIND_VARIABLE(v_cursor, ':b' || i, p_col_values(i));
    END LOOP;

    v_rows := DBMS_SQL.EXECUTE(v_cursor);
    DBMS_OUTPUT.PUT_LINE('Inserted ' || v_rows || ' row(s).');

    DBMS_SQL.CLOSE_CURSOR(v_cursor);
  EXCEPTION
    WHEN OTHERS THEN
      IF DBMS_SQL.IS_OPEN(v_cursor) THEN
        DBMS_SQL.CLOSE_CURSOR(v_cursor);
      END IF;
      RAISE;
  END;
END;
/
```

### Example: Dynamic SELECT with Unknown Column Count

```plsql
CREATE OR REPLACE PROCEDURE dump_query_results (
  p_sql IN VARCHAR2
) AS
  v_cursor    INTEGER;
  v_col_cnt   INTEGER;
  v_desc_tab  DBMS_SQL.DESC_TAB;
  v_val       VARCHAR2(4000);
  v_row_cnt   INTEGER;
  v_line      VARCHAR2(32767);
BEGIN
  v_cursor := DBMS_SQL.OPEN_CURSOR;
  BEGIN
    DBMS_SQL.PARSE(v_cursor, p_sql, DBMS_SQL.NATIVE);
    DBMS_SQL.DESCRIBE_COLUMNS(v_cursor, v_col_cnt, v_desc_tab);

    -- Register all columns for output
    FOR i IN 1..v_col_cnt LOOP
      DBMS_SQL.DEFINE_COLUMN(v_cursor, i, v_val, 4000);
    END LOOP;

    v_row_cnt := DBMS_SQL.EXECUTE(v_cursor);

    -- Print header
    v_line := '';
    FOR i IN 1..v_col_cnt LOOP
      v_line := v_line || RPAD(v_desc_tab(i).col_name, 20);
    END LOOP;
    DBMS_OUTPUT.PUT_LINE(v_line);
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 20 * v_col_cnt, '-'));

    -- Fetch and print rows
    LOOP
      EXIT WHEN DBMS_SQL.FETCH_ROWS(v_cursor) = 0;
      v_line := '';
      FOR i IN 1..v_col_cnt LOOP
        DBMS_SQL.COLUMN_VALUE(v_cursor, i, v_val);
        v_line := v_line || RPAD(NVL(v_val, 'NULL'), 20);
      END LOOP;
      DBMS_OUTPUT.PUT_LINE(v_line);
    END LOOP;

    DBMS_SQL.CLOSE_CURSOR(v_cursor);
  EXCEPTION
    WHEN OTHERS THEN
      IF DBMS_SQL.IS_OPEN(v_cursor) THEN DBMS_SQL.CLOSE_CURSOR(v_cursor); END IF;
      RAISE;
  END;
END;
/
```

### Converting Between DBMS_SQL and REF CURSOR

Oracle allows converting a `DBMS_SQL` cursor to a `SYS_REFCURSOR` after binding and executing, which is useful for returning results to a calling application:

```plsql
CREATE OR REPLACE FUNCTION flexible_query (
  p_table_name IN VARCHAR2,
  p_where_cols IN SYS.ODCIVARCHAR2LIST,  -- column names for WHERE conditions
  p_where_vals IN SYS.ODCIVARCHAR2LIST   -- corresponding values
) RETURN SYS_REFCURSOR AS
  v_cursor    INTEGER;
  v_ref_cur   SYS_REFCURSOR;
  v_sql       CLOB;
  v_where     VARCHAR2(4000) := '';
  v_dummy     INTEGER;
BEGIN
  -- Build WHERE clause with validated column names and bind placeholders
  FOR i IN 1..p_where_cols.COUNT LOOP
    IF i > 1 THEN v_where := v_where || ' AND '; END IF;
    v_where := v_where || DBMS_ASSERT.SIMPLE_SQL_NAME(p_where_cols(i)) || ' = :b' || i;
  END LOOP;

  v_sql := 'SELECT * FROM ' || DBMS_ASSERT.SQL_OBJECT_NAME(p_table_name);
  IF v_where IS NOT NULL THEN
    v_sql := v_sql || ' WHERE ' || v_where;
  END IF;

  -- Parse and bind via DBMS_SQL
  v_cursor := DBMS_SQL.OPEN_CURSOR;
  DBMS_SQL.PARSE(v_cursor, v_sql, DBMS_SQL.NATIVE);

  FOR i IN 1..p_where_vals.COUNT LOOP
    DBMS_SQL.BIND_VARIABLE(v_cursor, ':b' || i, p_where_vals(i));
  END LOOP;

  v_dummy := DBMS_SQL.EXECUTE(v_cursor);

  -- Convert DBMS_SQL cursor to REF CURSOR for return to caller
  v_ref_cur := DBMS_SQL.TO_REFCURSOR(v_cursor);
  -- Note: after TO_REFCURSOR, do NOT call CLOSE_CURSOR on v_cursor
  -- The ref cursor now owns the cursor resource

  RETURN v_ref_cur;

EXCEPTION
  WHEN OTHERS THEN
    IF DBMS_SQL.IS_OPEN(v_cursor) THEN DBMS_SQL.CLOSE_CURSOR(v_cursor); END IF;
    RAISE;
END;
/
```

---

## Choosing Between EXECUTE IMMEDIATE and DBMS_SQL

| Criterion | EXECUTE IMMEDIATE | DBMS_SQL |
|---|---|---|
| Code simplicity | Simpler | More verbose |
| Fixed number of bind variables | Yes | Yes |
| Dynamic number of bind variables | No (requires branching) | Yes |
| Dynamic number of output columns | No | Yes |
| Reuse parsed cursor | No (re-parses each call) | Yes |
| Convert to/from REF CURSOR | No | Yes (`TO_REFCURSOR`, `TO_CURSOR_NUMBER`) |
| DDL execution | Yes | Yes |
| Performance (single execution) | Similar | Similar |
| Performance (repeated execution) | Slightly better (less code) | Better (cursor reuse) |

**Recommendation:** Default to `EXECUTE IMMEDIATE`. Switch to `DBMS_SQL` only when:
- The number of bind variables or columns is not known at compile time, and branching would be unmanageable
- You need to reuse a parsed cursor across multiple calls (parse-once, execute-many pattern)
- You need `TO_REFCURSOR` conversion

---

## Avoiding SQL Injection in Dynamic SQL

Dynamic SQL is the primary attack surface for SQL injection in PL/SQL. The rules are:

### Rule 1: Always Use Bind Variables for Data Values

```plsql
-- NEVER concatenate data values into the SQL string
v_sql := 'SELECT * FROM t WHERE name = ''' || p_name || '''';  -- DANGEROUS

-- ALWAYS use bind variables for data values
v_sql := 'SELECT * FROM t WHERE name = :name';
EXECUTE IMMEDIATE v_sql INTO v_result USING p_name;             -- SAFE
```

### Rule 2: Validate All Dynamic Identifiers with DBMS_ASSERT

```plsql
-- Dynamic table/column/schema names CANNOT use bind variables
-- They MUST be validated before concatenation

v_safe_table  := DBMS_ASSERT.SQL_OBJECT_NAME(p_table_name);  -- must exist in DB
v_safe_column := DBMS_ASSERT.SIMPLE_SQL_NAME(p_col_name);    -- simple identifier only
v_safe_schema := DBMS_ASSERT.SCHEMA_NAME(p_schema);          -- must be a valid schema

v_sql := 'SELECT ' || v_safe_column || ' FROM ' || v_safe_schema || '.' || v_safe_table;
```

### Rule 3: Use Explicit Whitelists for Non-Identifier Structure

Anything that isn't an identifier (sort direction, SQL keywords, operator symbols) must be whitelisted explicitly:

```plsql
-- Sort direction whitelist
v_direction := CASE UPPER(p_sort_dir)
                 WHEN 'ASC'  THEN 'ASC'
                 WHEN 'DESC' THEN 'DESC'
                 ELSE RAISE_APPLICATION_ERROR(-20001, 'Invalid sort direction.')
               END;

-- Operator whitelist
v_operator := CASE p_operator
                WHEN '='  THEN '='
                WHEN '>'  THEN '>'
                WHEN '<'  THEN '<'
                WHEN '>=' THEN '>='
                WHEN '<=' THEN '<='
                ELSE NULL
              END;
IF v_operator IS NULL THEN
  RAISE_APPLICATION_ERROR(-20002, 'Invalid operator.');
END IF;
```

### Rule 4: Never Trust Input Source

Internal systems, APIs, and middleware can all be vectors for injection. Validate regardless of where the input originates:

```plsql
-- Even parameters from "trusted" internal APIs should be validated
-- before being incorporated into dynamic SQL structure
```

---

## Performance Considerations

### Hard Parse Cost

Every new SQL string causes a hard parse (parse, optimize, generate plan). Hard parses are expensive and contend on the shared pool latch.

```plsql
-- BAD: unique literal in every execution → hard parse storm
FOR i IN 1..10000 LOOP
  EXECUTE IMMEDIATE 'SELECT count(*) FROM t WHERE id = ' || i INTO v_cnt;
END LOOP;

-- GOOD: reuse the same statement text with bind variables
FOR i IN 1..10000 LOOP
  EXECUTE IMMEDIATE 'SELECT count(*) FROM t WHERE id = :1' INTO v_cnt USING i;
END LOOP;
```

### Cursor Reuse with DBMS_SQL

When executing the same dynamic statement repeatedly (e.g., in a bulk load loop), parse it once with `DBMS_SQL` and execute it N times:

```plsql
DECLARE
  v_cursor  INTEGER;
  v_sql     VARCHAR2(200) := 'INSERT INTO staging (id, val) VALUES (:1, :2)';
  v_rows    INTEGER;
BEGIN
  v_cursor := DBMS_SQL.OPEN_CURSOR;
  DBMS_SQL.PARSE(v_cursor, v_sql, DBMS_SQL.NATIVE);

  FOR i IN 1..100000 LOOP
    DBMS_SQL.BIND_VARIABLE(v_cursor, ':1', i);
    DBMS_SQL.BIND_VARIABLE(v_cursor, ':2', 'value_' || i);
    v_rows := DBMS_SQL.EXECUTE(v_cursor);  -- no re-parse
  END LOOP;

  DBMS_SQL.CLOSE_CURSOR(v_cursor);
  COMMIT;
END;
/
```

---

## Bulk Operations with Dynamic SQL

`EXECUTE IMMEDIATE` supports `BULK COLLECT` and `FORALL` for dynamic DML:

```plsql
DECLARE
  TYPE id_list IS TABLE OF NUMBER;
  v_ids    id_list;
  v_sql    VARCHAR2(200);
BEGIN
  -- Dynamic bulk query
  v_sql := 'SELECT employee_id FROM employees WHERE department_id = :1';
  EXECUTE IMMEDIATE v_sql BULK COLLECT INTO v_ids USING 50;

  -- Dynamic FORALL
  v_sql := 'UPDATE employees SET salary = salary * 1.1 WHERE employee_id = :1';
  FORALL i IN 1..v_ids.COUNT
    EXECUTE IMMEDIATE v_sql USING v_ids(i);

  COMMIT;
END;
/
```

---

## Best Practices

- **Start with static SQL.** Only introduce dynamic SQL when static SQL genuinely cannot meet the requirement.
- **Bind all data values.** Never concatenate user input or any data value into a SQL string.
- **Validate all structural elements** (table names, column names) with `DBMS_ASSERT` functions or explicit whitelists before concatenation.
- **Always close cursors.** Use `DBMS_SQL.IS_OPEN` checks in exception handlers to prevent cursor leaks.
- **Log the constructed SQL in development/test.** Add a debug logging call to output the final SQL string during development to validate it before going to production.
- **Prefer `EXECUTE IMMEDIATE` for simplicity;** use `DBMS_SQL` only when its additional capabilities are needed.
- **Use `CLOB` for long dynamic SQL.** `VARCHAR2` is limited to 32,767 bytes in PL/SQL. Long queries with many columns or subqueries can exceed this.
- **Avoid DDL in transactional code.** DDL auto-commits; a DDL statement in the middle of a transaction will commit everything before it.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Concatenating string values: `'...WHERE name = ''' \|\| p_name \|\| ''''` | SQL injection vector | Use bind variables: `USING p_name` |
| Using `DBMS_ASSERT.NOOP` thinking it validates | `NOOP` is a no-op — it returns the string unchanged | Use `SQL_OBJECT_NAME` or `SIMPLE_SQL_NAME` |
| Forgetting `DBMS_SQL.CLOSE_CURSOR` in exception path | Cursor leak; eventually hits `ORA-01000` | Check `IS_OPEN` in every exception handler and close |
| Calling `CLOSE_CURSOR` after `TO_REFCURSOR` | `TO_REFCURSOR` transfers ownership; closing the integer handle is an error | After `TO_REFCURSOR`, close only the `SYS_REFCURSOR`, not the integer handle |
| Building SQL strings with VARCHAR2 > 32767 bytes | `PL/SQL: numeric or value error` | Use `CLOB` for the SQL string variable |
| Running DDL inside a loop | Each DDL auto-commits and causes a hard parse | Move DDL outside loops; batch DDL at schema setup time |
| Calling `EXECUTE IMMEDIATE` for every row in a DML loop | One hard parse per iteration (if string changes) or one parse + execute per row | Use `FORALL` with `EXECUTE IMMEDIATE` or DBMS_SQL parse-once/execute-many |
| Not matching USING argument count to bind variable count | `ORA-01008: not all variables bound` | Count placeholders in the SQL string and ensure USING has exactly that many arguments |
| Exposing SQL text in error messages | Reveals schema structure to attackers | Log SQL internally; return a generic error message to callers |

---

## EXECUTE IMMEDIATE with RETURNING INTO

`EXECUTE IMMEDIATE` supports the `RETURNING INTO` clause for DML statements that return column values from the affected row:

```plsql
DECLARE
  l_new_id   NUMBER;
  l_created  DATE;
BEGIN
  EXECUTE IMMEDIATE
    'INSERT INTO orders (customer_id, status) VALUES (:1, :2)
     RETURNING order_id, created_at INTO :3, :4'
    USING 12345, 'PENDING'
    RETURNING INTO l_new_id, l_created;

  DBMS_OUTPUT.PUT_LINE('Created order: ' || l_new_id || ' at ' || l_created);
END;
/
```

The `RETURNING INTO` bind positions are OUT binds and appear after the `USING` clause, not inside it.

---

## Column Whitelist Pattern Using the Data Dictionary

`DBMS_ASSERT.SIMPLE_SQL_NAME` confirms a string is a legal SQL identifier but does not confirm the column exists in the target table. For maximum security when column names come from user input, validate against the data dictionary:

```plsql
FUNCTION is_valid_column(
  p_table  IN VARCHAR2,
  p_column IN VARCHAR2
) RETURN BOOLEAN IS
  l_count PLS_INTEGER;
BEGIN
  SELECT COUNT(*) INTO l_count
  FROM   all_tab_columns
  WHERE  owner       = SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')
    AND  table_name  = UPPER(p_table)
    AND  column_name = UPPER(p_column);
  RETURN l_count > 0;
END is_valid_column;
/
```

Use this before concatenating a column name into a dynamic ORDER BY, SELECT list, or WHERE clause.

---

## Monitoring Dynamic SQL Performance

### Hard Parse Ratio

Every unique SQL string causes a hard parse. Monitor the ratio of hard parses to total parses; in well-tuned OLTP systems it should be below 1%:

```sql
SELECT name, value
FROM   v$sysstat
WHERE  name IN ('parse count (hard)', 'parse count (total)');
```

### Identifying High-Parse Cursors

Dynamic SQL that produces many unique SQL strings fragments the shared pool. Use this query to identify cursors with a high parse-to-execute ratio, which signals missing bind variables:

```sql
SELECT sql_text,
       executions,
       parse_calls,
       ROUND(parse_calls / NULLIF(executions, 0) * 100, 1) AS parse_pct
FROM   v$sql
WHERE  parsing_schema_name = SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')
  AND  executions > 0
  AND  ROUND(parse_calls / NULLIF(executions, 0) * 100, 1) > 50
ORDER BY executions DESC;
```

---

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.
- **Oracle 8i+**: `EXECUTE IMMEDIATE` and `OPEN cursor FOR dynamic_sql USING` introduced; replaced the older `DBMS_SQL` for most use cases.
- **Oracle 11gR2+**: `DBMS_SQL.TO_REFCURSOR` and `DBMS_SQL.TO_CURSOR_NUMBER` allow conversion between `DBMS_SQL` and `REF CURSOR` types.
- **Oracle 12cR1+**: `DBMS_SQL.RETURN_RESULT` for implicit result sets from stored procedures.
- **Oracle 21c+**: Improved JSON support in dynamic SQL construction patterns.
- **All versions**: `DBMS_ASSERT` available since 10.2 — use consistently for all dynamic identifier validation.

## Sources

- [Oracle Database 19c PL/SQL Language Reference (LNPLS)](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/)
- [DBMS_SQL — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SQL.html)
- [DBMS_ASSERT — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_ASSERT.html)
