# PL/SQL Dynamic SQL

## Overview

Dynamic SQL constructs and executes SQL statements at runtime rather than compile time. It is powerful but carries risks: SQL injection, hard parsing overhead, and reduced compiler error detection. This guide covers when dynamic SQL is justified, both execution approaches (`EXECUTE IMMEDIATE` and `DBMS_SQL`), injection prevention, and performance considerations.

---

## When Dynamic SQL Is Justified vs Avoidable

### Avoidable — Use Static SQL Instead

```sql
-- AVOID: dynamic WHERE clause when conditions are always known
-- (poor man's dynamic SQL)
PROCEDURE get_employees(p_dept_id IN NUMBER) IS
  l_sql VARCHAR2(500);
  l_cur SYS_REFCURSOR;
BEGIN
  l_sql := 'SELECT * FROM employees WHERE department_id = ' || p_dept_id;
  OPEN l_cur FOR l_sql;  -- no bind variable!
  -- ...
END;

-- BETTER: static SQL with bind variable
PROCEDURE get_employees(p_dept_id IN NUMBER) IS
BEGIN
  FOR emp IN (SELECT * FROM employees WHERE department_id = p_dept_id) LOOP
    -- ...
  END LOOP;
END;
```

### Justified Use Cases

| Scenario | Why Dynamic SQL Is Required |
|---|---|
| DDL execution (CREATE, ALTER, DROP) | DDL cannot be written as static PL/SQL |
| Table/column name as parameter | Structural SQL elements cannot be bind variables |
| Schema name determined at runtime | Object resolution needs runtime schema name |
| Conditional column inclusion in SELECT | Column list changes based on input |
| Building SQL from metadata | Query structure unknown at compile time |
| TRUNCATE TABLE | DDL, cannot be static |
| Invoker needs to run arbitrary SQL | Generic reporting or query tools |

---

## EXECUTE IMMEDIATE

`EXECUTE IMMEDIATE` is the primary dynamic SQL facility. It handles DDL, DML, and single-row queries.

### DDL Execution

```sql
-- DDL cannot be embedded in static PL/SQL
-- Must use EXECUTE IMMEDIATE
PROCEDURE create_archive_table(p_year IN NUMBER) IS
  l_table_name VARCHAR2(50);
BEGIN
  -- Validate before use (injection prevention)
  IF p_year NOT BETWEEN 2000 AND 2099 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Invalid year: ' || p_year);
  END IF;

  l_table_name := 'ORDERS_ARCHIVE_' || p_year;  -- year is numeric, safe

  EXECUTE IMMEDIATE
    'CREATE TABLE ' || l_table_name || ' AS SELECT * FROM orders WHERE 1=0';

  DBMS_OUTPUT.PUT_LINE('Created: ' || l_table_name);
END create_archive_table;
/

-- TRUNCATE: DDL only, no bind variables possible (none needed for TRUNCATE)
PROCEDURE truncate_staging(p_table_name IN VARCHAR2) IS
  l_safe_name VARCHAR2(128);
BEGIN
  l_safe_name := DBMS_ASSERT.SIMPLE_SQL_NAME(p_table_name);  -- validate!
  EXECUTE IMMEDIATE 'TRUNCATE TABLE ' || l_safe_name;
END truncate_staging;
/
```

### DML with Bind Variables

```sql
-- Single bind variable
PROCEDURE deactivate_old_sessions(p_days IN NUMBER) IS
BEGIN
  EXECUTE IMMEDIATE
    'DELETE FROM user_sessions WHERE last_activity < SYSDATE - :1'
    USING p_days;  -- bind variable, no injection risk

  DBMS_OUTPUT.PUT_LINE('Deleted: ' || SQL%ROWCOUNT);
END deactivate_old_sessions;
/

-- Named bind variables (more readable for multiple binds)
PROCEDURE update_employee_salary(
  p_employee_id IN NUMBER,
  p_new_salary  IN NUMBER,
  p_reason      IN VARCHAR2
) IS
BEGIN
  EXECUTE IMMEDIATE
    'UPDATE employees
     SET    salary = :new_sal,
            updated_at = SYSDATE,
            update_reason = :reason
     WHERE  employee_id = :emp_id'
    USING p_new_salary, p_reason, p_employee_id;
    -- Named binds in USING must match order of first occurrence

  IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Employee not found: ' || p_employee_id);
  END IF;
END update_employee_salary;
/
```

### Single-Row Queries with EXECUTE IMMEDIATE

```sql
-- SELECT INTO via EXECUTE IMMEDIATE
DECLARE
  l_salary employees.salary%TYPE;
  l_name   employees.last_name%TYPE;
BEGIN
  EXECUTE IMMEDIATE
    'SELECT salary, last_name FROM employees WHERE employee_id = :1'
    INTO l_salary, l_name
    USING 100;

  DBMS_OUTPUT.PUT_LINE(l_name || ': ' || l_salary);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('Not found');
  WHEN TOO_MANY_ROWS THEN
    DBMS_OUTPUT.PUT_LINE('Multiple rows returned');
END;
/
```

### OUT Bind Variables (for DML RETURNING)

```sql
DECLARE
  l_new_id    NUMBER;
  l_created   DATE;
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

---

## Multi-Row Queries with SYS_REFCURSOR

For dynamic queries returning multiple rows, open a `SYS_REFCURSOR` with `EXECUTE IMMEDIATE` via `OPEN ... FOR`.

```sql
-- Dynamic multi-row query
PROCEDURE report_by_status(
  p_status IN VARCHAR2,
  p_cursor OUT SYS_REFCURSOR
) IS
BEGIN
  -- p_status bound safely as a bind variable
  OPEN p_cursor FOR
    'SELECT order_id, customer_id, total_amount, created_at
     FROM   orders
     WHERE  status = :1
     ORDER BY created_at DESC'
    USING p_status;
  -- Caller fetches from p_cursor and must close it
END report_by_status;
/

-- Dynamic query with optional filter (build SQL carefully)
PROCEDURE get_orders_filtered(
  p_status    IN VARCHAR2  DEFAULT NULL,
  p_from_date IN DATE      DEFAULT NULL,
  p_to_date   IN DATE      DEFAULT NULL,
  p_cursor    OUT SYS_REFCURSOR
) IS
  l_sql    VARCHAR2(2000) := 'SELECT * FROM orders WHERE 1=1';
  l_status VARCHAR2(20);
  l_from   DATE;
  l_to     DATE;
BEGIN
  -- Build SQL with conditions; track which binds are active
  IF p_status IS NOT NULL THEN
    l_sql    := l_sql || ' AND status = :status';
    l_status := p_status;  -- will be bound below
  END IF;

  IF p_from_date IS NOT NULL THEN
    l_sql   := l_sql || ' AND created_at >= :from_date';
    l_from  := p_from_date;
  END IF;

  IF p_to_date IS NOT NULL THEN
    l_sql  := l_sql || ' AND created_at <= :to_date';
    l_to   := p_to_date;
  END IF;

  l_sql := l_sql || ' ORDER BY created_at DESC';

  -- Open cursor: USING clause must match the bind variables added above
  -- This is fragile — consider DBMS_SQL for variable bind counts
  IF p_status IS NOT NULL AND p_from_date IS NOT NULL AND p_to_date IS NOT NULL THEN
    OPEN p_cursor FOR l_sql USING l_status, l_from, l_to;
  ELSIF p_status IS NOT NULL AND p_from_date IS NOT NULL THEN
    OPEN p_cursor FOR l_sql USING l_status, l_from;
  ELSIF p_status IS NOT NULL THEN
    OPEN p_cursor FOR l_sql USING l_status;
  ELSE
    OPEN p_cursor FOR l_sql;
  END IF;
END get_orders_filtered;
/
```

The combinatorial USING clause problem above is exactly when `DBMS_SQL` is the better choice.

---

## DBMS_SQL for Variable Bind Counts and Unknown Column Structures

`DBMS_SQL` is the lower-level dynamic SQL API. It is more verbose but handles scenarios that `EXECUTE IMMEDIATE` cannot:
1. Number of bind variables not known at compile time
2. Number/types of SELECT columns not known at compile time
3. Parse-once/execute-many for performance

### Variable Bind Counts (Solves the Combinatorial Problem)

```sql
CREATE OR REPLACE PROCEDURE get_orders_flexible(
  p_filters IN SYS.ODCIVARCHAR2LIST,  -- list of 'column=value' strings
  p_cursor  OUT SYS_REFCURSOR
) IS
  l_sql      VARCHAR2(4000) := 'SELECT * FROM orders WHERE 1=1';
  l_cur      INTEGER;
  l_rc       INTEGER;
BEGIN
  -- Dynamically build SQL with named binds
  FOR i IN 1..p_filters.COUNT LOOP
    l_sql := l_sql || ' AND ' || p_filters(i);
    -- IMPORTANT: p_filters must come from a whitelist, not user input directly
  END LOOP;

  l_cur := DBMS_SQL.OPEN_CURSOR;

  DBMS_SQL.PARSE(l_cur, l_sql, DBMS_SQL.NATIVE);

  -- Bind each variable
  FOR i IN 1..p_filters.COUNT LOOP
    DBMS_SQL.BIND_VARIABLE(l_cur, ':val' || i, 'some_value_' || i);
  END LOOP;

  -- Convert to REF CURSOR
  l_rc      := DBMS_SQL.EXECUTE(l_cur);
  p_cursor  := DBMS_SQL.TO_REFCURSOR(l_cur);
  -- Note: after TO_REFCURSOR, DBMS_SQL no longer manages the cursor
  -- The REF CURSOR caller is responsible for CLOSE

EXCEPTION
  WHEN OTHERS THEN
    IF DBMS_SQL.IS_OPEN(l_cur) THEN
      DBMS_SQL.CLOSE_CURSOR(l_cur);
    END IF;
    RAISE;
END get_orders_flexible;
/
```

---

## DBMS_SQL.DESCRIBE_COLUMNS

Used when the column structure of a query result is not known at compile time (generic reporting, metadata-driven tools).

```sql
CREATE OR REPLACE PROCEDURE describe_query_result(p_sql IN VARCHAR2) IS
  l_cursor      INTEGER;
  l_col_count   INTEGER;
  l_col_descs   DBMS_SQL.DESC_TAB;
  l_value       VARCHAR2(4000);
BEGIN
  l_cursor := DBMS_SQL.OPEN_CURSOR;

  DBMS_SQL.PARSE(l_cursor, p_sql, DBMS_SQL.NATIVE);

  -- Describe the columns: get count and metadata
  DBMS_SQL.DESCRIBE_COLUMNS(l_cursor, l_col_count, l_col_descs);

  -- Define each column for fetching (must define before EXECUTE)
  FOR i IN 1..l_col_count LOOP
    -- Define all columns as VARCHAR2 for generic display
    DBMS_SQL.DEFINE_COLUMN(l_cursor, i, l_value, 4000);
    DBMS_OUTPUT.PUT_LINE(
      'Column ' || i || ': ' ||
      l_col_descs(i).col_name || ' (' ||
      CASE l_col_descs(i).col_type
        WHEN 1   THEN 'VARCHAR2'
        WHEN 2   THEN 'NUMBER'
        WHEN 12  THEN 'DATE'
        WHEN 112 THEN 'CLOB'
        ELSE 'OTHER(' || l_col_descs(i).col_type || ')'
      END || ')'
    );
  END LOOP;

  -- Execute and fetch
  DBMS_SQL.EXECUTE(l_cursor);

  WHILE DBMS_SQL.FETCH_ROWS(l_cursor) > 0 LOOP
    FOR i IN 1..l_col_count LOOP
      DBMS_SQL.COLUMN_VALUE(l_cursor, i, l_value);
      DBMS_OUTPUT.PUT(l_col_descs(i).col_name || '=' || l_value || '  ');
    END LOOP;
    DBMS_OUTPUT.NEW_LINE;
  END LOOP;

  DBMS_SQL.CLOSE_CURSOR(l_cursor);
EXCEPTION
  WHEN OTHERS THEN
    IF DBMS_SQL.IS_OPEN(l_cursor) THEN DBMS_SQL.CLOSE_CURSOR(l_cursor); END IF;
    RAISE;
END describe_query_result;
/
```

---

## Parse-Once Execute-Many with DBMS_SQL

When the same parameterized SQL runs many times in a batch, parse once and re-bind/execute for each row.

```sql
CREATE OR REPLACE PROCEDURE load_employees_batch(
  p_employees IN emp_staging_collection_t
) IS
  l_cursor   INTEGER;
  l_rows     INTEGER;

  c_sql CONSTANT VARCHAR2(500) :=
    'INSERT INTO employees (first_name, last_name, email, hire_date, job_id, salary)
     VALUES (:fname, :lname, :email, :hdate, :jobid, :sal)';
BEGIN
  l_cursor := DBMS_SQL.OPEN_CURSOR;

  -- PARSE ONCE: syntax check and compilation done here only
  DBMS_SQL.PARSE(l_cursor, c_sql, DBMS_SQL.NATIVE);

  -- EXECUTE MANY: re-bind and execute without re-parsing
  FOR i IN 1..p_employees.COUNT LOOP
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':fname', p_employees(i).first_name);
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':lname', p_employees(i).last_name);
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':email', p_employees(i).email);
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':hdate', p_employees(i).hire_date);
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':jobid', p_employees(i).job_id);
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':sal',   p_employees(i).salary);

    l_rows := DBMS_SQL.EXECUTE(l_cursor);
  END LOOP;

  DBMS_SQL.CLOSE_CURSOR(l_cursor);
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    IF DBMS_SQL.IS_OPEN(l_cursor) THEN DBMS_SQL.CLOSE_CURSOR(l_cursor); END IF;
    RAISE;
END load_employees_batch;
/
```

**Note**: For most production batch scenarios, `FORALL` with a collection and static SQL is faster and simpler than the DBMS_SQL parse-once pattern. Use DBMS_SQL parse-once when the SQL structure itself must be dynamic.

---

## Injection Prevention in Dynamic SQL

### The Three Rules

1. **Data values**: Always use bind variables (`:1`, `:name`). Never concatenate.
2. **Object names** (tables, columns, schemas): Validate with `DBMS_ASSERT` before concatenation.
3. **SQL keywords**: Validate against a whitelist; never pass raw user input as SQL keywords.

```sql
CREATE OR REPLACE PROCEDURE safe_dynamic_query(
  p_table_name  IN VARCHAR2,  -- structural: must validate
  p_sort_column IN VARCHAR2,  -- structural: must validate
  p_sort_dir    IN VARCHAR2,  -- keyword: must whitelist
  p_filter_val  IN VARCHAR2,  -- data: use bind variable
  p_cursor      OUT SYS_REFCURSOR
) IS
  l_table  VARCHAR2(128);
  l_col    VARCHAR2(128);
  l_dir    VARCHAR2(4);
  l_sql    VARCHAR2(1000);
BEGIN
  -- Rule 2: validate structural elements with DBMS_ASSERT
  l_table := DBMS_ASSERT.SQL_OBJECT_NAME(p_table_name);  -- must exist
  l_col   := DBMS_ASSERT.SIMPLE_SQL_NAME(p_sort_column);

  -- Rule 3: whitelist SQL keywords
  IF UPPER(p_sort_dir) NOT IN ('ASC', 'DESC') THEN
    RAISE_APPLICATION_ERROR(-20001, 'Invalid sort direction: ' || p_sort_dir);
  END IF;
  l_dir := UPPER(p_sort_dir);

  -- Rule 1: data values use bind variables
  l_sql :=
    'SELECT * FROM ' || l_table ||
    ' WHERE last_name LIKE :filter_val' ||  -- bind variable for data
    ' ORDER BY ' || l_col || ' ' || l_dir;  -- safe: validated above

  OPEN p_cursor FOR l_sql USING p_filter_val || '%';
END safe_dynamic_query;
/
```

### Column Whitelist Pattern

For maximum security, validate against a whitelist of known-safe values:

```sql
FUNCTION is_valid_sort_column(
  p_table  IN VARCHAR2,
  p_column IN VARCHAR2
) RETURN BOOLEAN IS
  l_count PLS_INTEGER;
BEGIN
  -- Check column actually exists in the table
  SELECT COUNT(*) INTO l_count
  FROM   all_tab_columns
  WHERE  owner      = SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')
    AND  table_name = UPPER(p_table)
    AND  column_name = UPPER(p_column);
  RETURN l_count > 0;
END is_valid_sort_column;
/
```

---

## Performance Considerations

### Hard Parse Cost

Every unique SQL string requires a hard parse: syntax check, security check, execution plan generation. Hard parsing is CPU-intensive and requires latches that serialize execution. The shared pool cache stores parsed cursors; reuse is critical for scalability.

```sql
-- BAD: unique SQL per call = hard parse every time
EXECUTE IMMEDIATE 'SELECT * FROM orders WHERE order_id = ' || p_id;
-- Each unique p_id value = different SQL string = different cursor = hard parse

-- GOOD: bind variable = one cursor, reused every time
EXECUTE IMMEDIATE 'SELECT * FROM orders WHERE order_id = :1' USING p_id;
-- Same SQL string every call = soft parse (cursor reuse)

-- Monitor hard vs soft parse ratio
SELECT name, value
FROM   v$sysstat
WHERE  name IN ('parse count (hard)', 'parse count (total)');
-- Hard / Total should be < 1% for well-tuned OLTP systems
```

### Shared Pool Fragmentation

Dynamic SQL that produces many unique SQL strings fragments the shared pool with single-use cursors. This forces other cursors out, increasing hard parses system-wide.

```sql
-- Monitor cursor reuse efficiency
SELECT sql_text, executions, parse_calls,
       ROUND(parse_calls/NULLIF(executions,0) * 100, 1) AS parse_pct
FROM   v$sql
WHERE  parsing_schema_name = SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')
  AND  executions > 0
  AND  ROUND(parse_calls/NULLIF(executions,0) * 100, 1) > 50
ORDER BY executions DESC;
-- Rows with high parse_pct and many executions = injection or missing binds
```

---

## EXECUTE IMMEDIATE vs DBMS_SQL Decision Guide

| Requirement | EXECUTE IMMEDIATE | DBMS_SQL |
|---|---|---|
| Simple DDL execution | Yes | Yes |
| DML with fixed bind variables | Yes (preferred) | Yes |
| Single-row SELECT | Yes | Yes |
| Multi-row SELECT | OPEN ... FOR | FETCH_ROWS loop |
| Variable number of bind variables | Difficult (combinatorial USING) | Yes (BIND_VARIABLE in loop) |
| Unknown column structure at compile time | No | Yes (DESCRIBE_COLUMNS) |
| Parse-once, execute-many pattern | No | Yes |
| Convert DBMS_SQL cursor to REF CURSOR | N/A | TO_REFCURSOR (11g+) |
| Readability | High | Low |

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Concatenating data values into SQL | SQL injection | Use bind variables |
| No DBMS_ASSERT on table/column names | Injection via structural elements | Validate all identifiers |
| No whitelist for SQL keywords | `ORDER BY CASE WHEN ... DROP TABLE` attacks | Whitelist: `IN ('ASC', 'DESC')` |
| Not closing DBMS_SQL cursor on exception | Resource leak, ORA-01000 | Always `IF IS_OPEN THEN CLOSE END IF` in exception handler |
| Using EXECUTE IMMEDIATE for tight loops | Hard parse per iteration | Use static SQL with bind variables; or FORALL |
| OPEN ... FOR with USING clause count mismatch | ORA-01006: bind variable not found | Count binds carefully; consider DBMS_SQL for variable counts |
| Exposing SQL text in error messages | Reveals schema to attackers | Log internally; return generic message to clients |

---

## Version Notes

- **Oracle 8i+**: `EXECUTE IMMEDIATE` and `OPEN cursor FOR dynamic_sql USING` introduced. Replaced the older `DBMS_SQL` for most use cases.
- **Oracle 11gR2+**: `DBMS_SQL.TO_REFCURSOR` and `DBMS_SQL.TO_CURSOR_NUMBER` allow conversion between DBMS_SQL and REF CURSOR types.
- **Oracle 12cR1+**: `DBMS_SQL.RETURN_RESULT` for implicit result sets from procedures.
- **Oracle 21c+**: Improved JSON support in dynamic SQL construction patterns.
- **All versions**: `DBMS_ASSERT` available since 10.2 — use consistently for all dynamic identifier validation.

---

## Sources

- [Oracle Database PL/SQL Language Reference 19c — Dynamic SQL](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/dynamic-sql.html) — EXECUTE IMMEDIATE, OPEN...FOR, USING clause
- [DBMS_SQL (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SQL.html) — DBMS_SQL package, TO_REFCURSOR, RETURN_RESULT
- [DBMS_ASSERT (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_ASSERT.html) — SQL_OBJECT_NAME, SIMPLE_SQL_NAME for injection prevention
