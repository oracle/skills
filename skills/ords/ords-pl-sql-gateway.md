# ORDS PL/SQL Gateway: Calling Stored Procedures and Returning Custom Results

## Overview

The ORDS PL/SQL Gateway connects HTTP requests directly to Oracle PL/SQL stored procedures, packages, and anonymous blocks. It replaces the older Oracle HTTP Server (OHS) `mod_plsql` gateway that was previously used with Oracle Application Server. For ORDS REST APIs, the `plsql/block` source type allows full use of Oracle's PL/SQL capabilities: calling packages, executing complex business logic, returning custom JSON, handling errors with appropriate HTTP status codes, and streaming CLOB/BLOB content.

Understanding when to use each source type — and how to properly handle parameters, result sets, and errors — is essential for building robust PL/SQL-backed REST services.

---

## Handler Source Types for PL/SQL

ORDS supports several source types that determine how the handler's SQL/PL/SQL is executed and how results are serialized.

| Source Type | Constant | Description |
|---|---|---|
| `plsql/block` | `ORDS.source_type_plsql` | Anonymous PL/SQL block; manual result handling |
| `query` / `collection/feed` | `ORDS.source_type_collection_feed` | SQL SELECT returning paginated JSON collection |
| `query/one_row` / `collection/item` | `ORDS.source_type_collection_item` | SQL SELECT returning single JSON object |
| `dml` | `ORDS.source_type_dml` | SQL INSERT/UPDATE/DELETE with implicit commit |
| `query/resultset` | N/A (use plsql) | Use implicit results from PL/SQL |

---

## Calling Stored Procedures from REST Handlers

### Simple Procedure Call

A stored procedure in the HR schema:

```sql
CREATE OR REPLACE PROCEDURE hr.give_raise(
  p_employee_id IN  employees.employee_id%TYPE,
  p_percentage  IN  NUMBER,
  p_new_salary  OUT employees.salary%TYPE,
  p_message     OUT VARCHAR2
) AS
  l_current_salary employees.salary%TYPE;
BEGIN
  SELECT salary INTO l_current_salary
  FROM   employees
  WHERE  employee_id = p_employee_id
  FOR UPDATE;

  UPDATE employees
  SET    salary = salary * (1 + p_percentage / 100)
  WHERE  employee_id = p_employee_id
  RETURNING salary INTO p_new_salary;

  p_message := 'Raise applied successfully';
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_new_salary := NULL;
    p_message    := 'Employee not found';
    RAISE_APPLICATION_ERROR(-20001, 'Employee ' || p_employee_id || ' not found');
END;
/
```

ORDS REST handler calling this procedure:

```sql
BEGIN
  ORDS.DEFINE_HANDLER(
    p_module_name => 'hr.api',
    p_pattern     => 'employees/:id/raise',
    p_method      => 'POST',
    p_source_type => ORDS.source_type_plsql,
    p_source      => q'[
      DECLARE
        l_new_salary  employees.salary%TYPE;
        l_message     VARCHAR2(500);
      BEGIN
        hr.give_raise(
          p_employee_id => :id,            -- URI parameter
          p_percentage  => :percentage,    -- JSON body parameter
          p_new_salary  => l_new_salary,
          p_message     => l_message
        );

        -- Build JSON response manually
        HTP.P('{"employee_id":' || :id ||
              ',"new_salary":' || l_new_salary ||
              ',"message":"' || l_message || '"}');
        :status_code := 200;
      END;
    ]'
  );
  COMMIT;
END;
/
```

---

## IN/OUT Parameter Binding

### IN Parameters from the Request

ORDS binds parameters from three sources — URI template, query string, and JSON body — all as named bind variables:

```
URL: POST /ords/hr/v1/employees/101/raise
Body: {"percentage": 10}

Available binds:
  :id          → "101" (from URI template :id)
  :percentage  → 10    (from JSON body field "percentage")
```

All bind variables arrive as VARCHAR2 regardless of source. Cast them explicitly:

```sql
l_percentage := TO_NUMBER(:percentage);
l_emp_id     := TO_NUMBER(:id);
l_hire_date  := TO_DATE(:hire_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
```

### OUT Parameters via Implicit Parameters

ORDS does not automatically serialize PL/SQL OUT parameters. Use these approaches:

1. **Assign to `:status_code`** and `:forward_location` for redirect responses.
2. **Use `HTP.P` / `HTP.PRN`** to write raw response content.
3. **Use `APEX_JSON`** for structured JSON output.
4. **Use `DBMS_OUTPUT`** (not recommended; requires special config).

---

## Returning Result Sets via Implicit Results

Oracle 12c+ supports **implicit results** (`DBMS_SQL.RETURN_RESULT`), which allows PL/SQL to return ref cursors that ORDS automatically serializes as a JSON collection.

```sql
CREATE OR REPLACE PROCEDURE hr.get_dept_employees(
  p_dept_id IN departments.department_id%TYPE
) AS
  l_cursor SYS_REFCURSOR;
BEGIN
  OPEN l_cursor FOR
    SELECT employee_id, first_name, last_name, salary
    FROM   employees
    WHERE  department_id = p_dept_id
    ORDER  BY last_name;

  DBMS_SQL.RETURN_RESULT(l_cursor);
END;
/
```

Call it from an ORDS handler (source type must be `plsql/block`):

```sql
BEGIN
  ORDS.DEFINE_HANDLER(
    p_module_name => 'hr.api',
    p_pattern     => 'departments/:dept_id/employees/',
    p_method      => 'GET',
    p_source_type => ORDS.source_type_plsql,
    p_source      => q'[
      BEGIN
        hr.get_dept_employees(p_dept_id => :dept_id);
      END;
    ]'
  );
  COMMIT;
END;
/
```

ORDS detects the implicit result cursor and serializes it as a JSON collection. This is the cleanest way to return result sets from packages without exposing direct SQL.

---

## Returning REF CURSORs

An alternative approach uses a REF CURSOR returned through a bind variable:

```sql
BEGIN
  ORDS.DEFINE_HANDLER(
    p_module_name => 'hr.api',
    p_pattern     => 'employees/by-dept',
    p_method      => 'GET',
    p_source_type => ORDS.source_type_plsql,
    p_source      => q'[
      BEGIN
        OPEN :results FOR
          SELECT employee_id, first_name, last_name, salary
          FROM   employees
          WHERE  department_id = :dept_id;
      END;
    ]'
  );
  COMMIT;
END;
/
```

Note: `:results` is a SYS_REFCURSOR OUT bind variable. ORDS recognizes cursor binds and serializes them automatically.

---

## Using APEX_JSON for Custom JSON Output

When APEX is installed, `APEX_JSON` provides a clean API for generating JSON from PL/SQL:

```sql
DECLARE
  CURSOR c_emps IS
    SELECT e.employee_id, e.first_name, e.last_name,
           e.salary, d.department_name
    FROM   employees e
    JOIN   departments d ON d.department_id = e.department_id
    WHERE  e.department_id = :dept_id;
BEGIN
  APEX_JSON.OPEN_OBJECT;
  APEX_JSON.WRITE('department_id', :dept_id);

  APEX_JSON.OPEN_ARRAY('employees');
  FOR r IN c_emps LOOP
    APEX_JSON.OPEN_OBJECT;
    APEX_JSON.WRITE('employee_id',   r.employee_id);
    APEX_JSON.WRITE('name',          r.first_name || ' ' || r.last_name);
    APEX_JSON.WRITE('salary',        r.salary);
    APEX_JSON.WRITE('department',    r.department_name);
    APEX_JSON.CLOSE_OBJECT;
  END LOOP;
  APEX_JSON.CLOSE_ARRAY;

  APEX_JSON.CLOSE_OBJECT;
END;
```

This produces:

```json
{
  "department_id": "60",
  "employees": [
    {"employee_id": 103, "name": "Alexander Hunold", "salary": 9000, "department": "IT"},
    {"employee_id": 104, "name": "Bruce Ernst", "salary": 6000, "department": "IT"}
  ]
}
```

---

## Using HTP Package for Raw Output

Without APEX, use Oracle's `HTP` (Hypertext Procedures) package for raw HTTP output:

```sql
DECLARE
  l_result CLOB;
BEGIN
  -- Build JSON string
  SELECT JSON_OBJECT(
           'employee_id' VALUE e.employee_id,
           'name'        VALUE e.first_name || ' ' || e.last_name,
           'salary'      VALUE e.salary
           RETURNING CLOB
         )
  INTO l_result
  FROM employees e
  WHERE employee_id = :id;

  -- Write response headers
  OWA_UTIL.MIME_HEADER('application/json', FALSE);
  HTP.P('Cache-Control: no-cache');
  OWA_UTIL.HTTP_HEADER_CLOSE;

  -- Write body
  HTP.PRN(l_result);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    :status_code := 404;
END;
```

---

## Error Handling and HTTP Status Codes

### Using `:status_code`

Set `:status_code` to control the HTTP response status:

```sql
BEGIN
  -- Try the operation
  DELETE FROM employees WHERE employee_id = :id;

  IF SQL%ROWCOUNT = 0 THEN
    :status_code := 404;  -- Not Found
  ELSE
    :status_code := 204;  -- No Content (successful delete, no body)
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    :status_code := 500;
    -- Log error (but don't expose internal details)
    INSERT INTO api_error_log (error_time, error_msg, sql_code)
    VALUES (SYSDATE, SQLERRM, SQLCODE);
    COMMIT;
END;
```

### Raising Application Errors

ORDS translates `RAISE_APPLICATION_ERROR` to HTTP 400 responses:

```sql
BEGIN
  IF :salary IS NULL OR TO_NUMBER(:salary) <= 0 THEN
    RAISE_APPLICATION_ERROR(-20100, 'Salary must be a positive number');
  END IF;

  IF TO_NUMBER(:salary) > 100000 THEN
    RAISE_APPLICATION_ERROR(-20101, 'Salary exceeds maximum allowed value');
  END IF;

  UPDATE employees SET salary = :salary WHERE employee_id = :id;
END;
```

ORDS returns:

```json
{
  "code": "Bad Request",
  "message": "Salary must be a positive number",
  "type": "tag:oracle.com,2020:error/Bad_Request",
  "instance": "tag:oracle.com,2020:ecid/..."
}
```

### Custom Error Response with JSON Body

For more control over error structure, catch exceptions and write custom JSON:

```sql
BEGIN
  UPDATE employees SET salary = :salary WHERE employee_id = :id;

  IF SQL%ROWCOUNT = 0 THEN
    :status_code := 404;
    HTP.PRN('{"error":"NOT_FOUND","message":"Employee ' || :id || ' does not exist"}');
    RETURN;
  END IF;

  :status_code := 200;
EXCEPTION
  WHEN VALUE_ERROR THEN
    :status_code := 400;
    HTP.PRN('{"error":"VALIDATION_ERROR","message":"Invalid salary value: must be numeric"}');
  WHEN OTHERS THEN
    :status_code := 500;
    -- Never expose SQLERRM to clients in production
    HTP.PRN('{"error":"INTERNAL_ERROR","message":"An unexpected error occurred"}');
END;
```

---

## Invoking Packages

Packages are the preferred way to organize PL/SQL REST logic:

```sql
CREATE OR REPLACE PACKAGE hr.employee_api AS
  PROCEDURE get_employee(
    p_id     IN  employees.employee_id%TYPE,
    p_result OUT SYS_REFCURSOR
  );

  PROCEDURE create_employee(
    p_first_name  IN employees.first_name%TYPE,
    p_last_name   IN employees.last_name%TYPE,
    p_email       IN employees.email%TYPE,
    p_salary      IN employees.salary%TYPE,
    p_dept_id     IN employees.department_id%TYPE,
    p_new_id      OUT employees.employee_id%TYPE
  );
END;
/

CREATE OR REPLACE PACKAGE BODY hr.employee_api AS

  PROCEDURE get_employee(
    p_id     IN  employees.employee_id%TYPE,
    p_result OUT SYS_REFCURSOR
  ) AS
  BEGIN
    OPEN p_result FOR
      SELECT * FROM employees WHERE employee_id = p_id;
  END;

  PROCEDURE create_employee(
    p_first_name  IN employees.first_name%TYPE,
    p_last_name   IN employees.last_name%TYPE,
    p_email       IN employees.email%TYPE,
    p_salary      IN employees.salary%TYPE,
    p_dept_id     IN employees.department_id%TYPE,
    p_new_id      OUT employees.employee_id%TYPE
  ) AS
  BEGIN
    INSERT INTO employees (employee_id, first_name, last_name, email, salary, department_id)
    VALUES (employees_seq.NEXTVAL, p_first_name, p_last_name, p_email, p_salary, p_dept_id)
    RETURNING employee_id INTO p_new_id;
  END;

END;
/
```

ORDS handlers calling the package:

```sql
-- GET handler using package
ORDS.DEFINE_HANDLER(
  p_module_name => 'hr.api',
  p_pattern     => 'employees/:id',
  p_method      => 'GET',
  p_source_type => ORDS.source_type_plsql,
  p_source      => q'[
    DECLARE
      l_cursor SYS_REFCURSOR;
    BEGIN
      hr.employee_api.get_employee(
        p_id     => TO_NUMBER(:id),
        p_result => l_cursor
      );
      OPEN :result_cursor FOR SELECT * FROM DUAL; -- placeholder
      -- Implicit result will be used
      DBMS_SQL.RETURN_RESULT(l_cursor);
    END;
  ]'
);

-- POST handler using package
ORDS.DEFINE_HANDLER(
  p_module_name => 'hr.api',
  p_pattern     => 'employees/',
  p_method      => 'POST',
  p_source_type => ORDS.source_type_plsql,
  p_source      => q'[
    DECLARE
      l_new_id employees.employee_id%TYPE;
    BEGIN
      hr.employee_api.create_employee(
        p_first_name => :first_name,
        p_last_name  => :last_name,
        p_email      => :email,
        p_salary     => TO_NUMBER(:salary),
        p_dept_id    => TO_NUMBER(:department_id),
        p_new_id     => l_new_id
      );
      :status_code      := 201;
      :forward_location := 'employees/' || l_new_id;
    END;
  ]'
);
```

---

## Handling CLOB and BLOB Responses

For large text or binary responses, use the `media` source type or set appropriate content types:

```sql
-- Handler returning a large text report as plain text
ORDS.DEFINE_HANDLER(
  p_module_name => 'hr.api',
  p_pattern     => 'reports/salary-summary',
  p_method      => 'GET',
  p_source_type => ORDS.source_type_plsql,
  p_source      => q'[
    DECLARE
      l_report CLOB;
    BEGIN
      -- Generate report as CLOB
      l_report := hr.report_pkg.salary_summary_report;

      OWA_UTIL.MIME_HEADER('text/plain', FALSE);
      HTP.P('Content-Disposition: attachment; filename="salary-report.txt"');
      OWA_UTIL.HTTP_HEADER_CLOSE;

      -- Stream CLOB in chunks
      DECLARE
        l_offset  INTEGER := 1;
        l_chunk   VARCHAR2(32767);
        l_length  INTEGER := DBMS_LOB.GETLENGTH(l_report);
      BEGIN
        WHILE l_offset <= l_length LOOP
          l_chunk := DBMS_LOB.SUBSTR(l_report, 32767, l_offset);
          HTP.PRN(l_chunk);
          l_offset := l_offset + 32767;
        END LOOP;
      END;
    END;
  ]'
);
```

---

## Best Practices

- **Put business logic in packages, call them from ORDS handlers**: Handlers should be thin orchestration layers. All business logic belongs in PL/SQL packages that can be tested independently of REST.
- **Always handle exceptions with appropriate HTTP status codes**: Unhandled exceptions result in 500 errors with generic messages. Catch known business exceptions (NO_DATA_FOUND, VALUE_ERROR) and return 404/400 with meaningful messages.
- **Use implicit results instead of REF CURSOR bind variables**: `DBMS_SQL.RETURN_RESULT` is cleaner and does not require a `:results` cursor bind variable in the handler source.
- **Cast bind variable types explicitly**: All bind variables arrive as VARCHAR2. Always cast to the correct type (`TO_NUMBER`, `TO_DATE`, etc.) before use, and handle conversion errors gracefully.
- **Never expose ORA- error messages or stack traces to clients**: These leak schema structure information. Log internally, return a generic message externally.
- **Use `RAISE_APPLICATION_ERROR` with codes in -20000 to -20999**: ORDS maps these to 400 Bad Request. Codes outside this range may produce unexpected HTTP status codes.

## Common Mistakes

- **Using `DBMS_OUTPUT` to return data**: DBMS_OUTPUT buffers are NOT returned in REST responses. Use `HTP.P`, `APEX_JSON`, or implicit results.
- **Forgetting TO_NUMBER for numeric bind variables**: `WHERE employee_id = :id` works due to implicit conversion, but `employee_id = :id` in a calculation will fail if `:id` is VARCHAR2 '101' and the operation expects a number.
- **Not setting `p_mimes_allowed` on POST/PUT handlers**: Without this, ORDS accepts requests with any Content-Type (including `text/plain`). JSON body parsing fails silently for wrong content types.
- **Setting `:status_code` after writing to HTP**: Status codes must be set before any HTP output. Writing headers (implicitly via HTP) before setting status code has no effect.
- **Expecting automatic COMMIT in `plsql/block` handlers**: Unlike `dml` source type, `plsql/block` does NOT auto-commit. Always include an explicit `COMMIT` (or `ROLLBACK` in exception blocks) in DML operations within PL/SQL handlers.
- **Using `DBMS_SQL.RETURN_RESULT` in a non-plsql/block context**: Implicit results only work with `source_type_plsql`. They are ignored by `collection_feed` and `collection_item` source types.

---

## Sources

- [ORDS Developer's Guide — Developing PL/SQL-Based REST Services](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/developing-oracle-rest-data-services-applications.html)
- [Oracle REST Data Services Handler Source Types Reference](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orrst/index.html)
- [ORDS Implicit Parameters Reference (status_code, body, forward_location)](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/implicit-parameters.html)
