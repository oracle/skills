# ORDS REST API Design: Modules, Templates, Handlers, and Full API Construction

## Overview

While AutoREST provides zero-code endpoints for tables and views, custom REST API design using `ORDS.DEFINE_MODULE`, `ORDS.DEFINE_TEMPLATE`, and `ORDS.DEFINE_HANDLER` gives full control over URL structure, SQL/PL/SQL logic, input validation, output shaping, and HTTP semantics. This is the approach for production APIs with complex business logic, multi-table operations, computed responses, or custom authentication/authorization behavior.

---

## The Three-Level API Hierarchy

```
ORDS.DEFINE_MODULE     → API namespace and base URL path
  └── ORDS.DEFINE_TEMPLATE  → URL pattern (with optional URI params)
        └── ORDS.DEFINE_HANDLER  → HTTP method + SQL or PL/SQL source
```

All three definitions are stored in ORDS_METADATA and associated with a specific schema.

---

## ORDS.DEFINE_MODULE

Creates a REST module — the top-level grouping for a set of related endpoints.

```sql
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name    => 'hr.api',          -- Internal name (unique per schema)
    p_base_path      => '/v1/',            -- Base URL path segment
    p_items_per_page => 25,               -- Default pagination limit
    p_status         => 'PUBLISHED',       -- PUBLISHED or NOT_PUBLISHED
    p_comments       => 'HR REST API v1'  -- Appears in OpenAPI doc
  );
  COMMIT;
END;
/
```

The module base URL becomes: `/ords/hr/v1/`

Parameters:
- `p_module_name`: Must be unique within the schema. Use a clear naming convention like `{domain}.{version}`.
- `p_base_path`: Leading slash required. Trailing slash optional but conventional.
- `p_items_per_page`: Default rows per page for paginated queries.
- `p_status`: `NOT_PUBLISHED` hides the module from clients while you develop.

---

## ORDS.DEFINE_TEMPLATE

Creates a URL pattern within a module. Templates support URI parameters using `:param` syntax.

```sql
BEGIN
  -- Static template: /ords/hr/v1/employees/
  ORDS.DEFINE_TEMPLATE(
    p_module_name    => 'hr.api',
    p_pattern        => 'employees/',
    p_priority       => 0,
    p_etag_type      => 'HASH',           -- ETag for caching: HASH, QUERY, NONE
    p_etag_query     => NULL,
    p_comments       => 'Employee collection endpoint'
  );

  -- Parameterized template: /ords/hr/v1/employees/101
  ORDS.DEFINE_TEMPLATE(
    p_module_name    => 'hr.api',
    p_pattern        => 'employees/:id',
    p_priority       => 0,
    p_comments       => 'Single employee endpoint'
  );

  -- Nested resource: /ords/hr/v1/departments/10/employees/
  ORDS.DEFINE_TEMPLATE(
    p_module_name    => 'hr.api',
    p_pattern        => 'departments/:dept_id/employees/',
    p_priority       => 0,
    p_comments       => 'Employees in a department'
  );

  COMMIT;
END;
/
```

URI parameters (`:id`, `:dept_id`) are automatically bound as named bind variables in the handler SQL/PL/SQL.

---

## ORDS.DEFINE_HANDLER

Creates the HTTP method handler for a template. Each handler has a source type and a source (SQL or PL/SQL).

```sql
ORDS.DEFINE_HANDLER(
  p_module_name    => 'hr.api',
  p_pattern        => 'employees/',
  p_method         => 'GET',             -- HTTP method: GET POST PUT DELETE
  p_source_type    => ORDS.source_type_collection_feed,  -- See source types below
  p_items_per_page => 25,
  p_mimes_allowed  => NULL,              -- Accepted Content-Types (for POST/PUT)
  p_comments       => 'List employees with optional filtering',
  p_source         => '
    SELECT employee_id, first_name, last_name,
           email, hire_date, job_id, salary, department_id
    FROM   employees
    ORDER  BY employee_id
  '
);
```

---

## Handler Source Types

The `p_source_type` parameter controls how ORDS interprets and serializes the handler output.

| Source Type Constant | Description |
|---|---|
| `ORDS.source_type_collection_feed` | SQL SELECT returning a paginated JSON collection (`items`, `hasMore`, `links`) |
| `ORDS.source_type_collection_item` | SQL SELECT returning a single row as a JSON object |
| `ORDS.source_type_media` | SQL returning BLOB/CLOB for binary/text responses (files, images) |
| `ORDS.source_type_plsql` | PL/SQL block |
| `ORDS.source_type_query` | Alias for `collection_feed` |
| `ORDS.source_type_query_one_row` | Alias for `collection_item` |
| `ORDS.source_type_feed` | SQL or PL/SQL returning Atom feed output |
| `ORDS.source_type_csv_query` | SQL SELECT serialized as CSV |

String literals also work: `'collection/feed'`, `'collection/item'`, `'plsql/block'`, `'query'`, `'feed'`, `'csv/query'`

---

## Complete CRUD API Example

Below is a complete, working example of a REST API for the EMPLOYEES table.

```sql
-- ============================================================
-- Step 1: Enable the schema (if not already done)
-- ============================================================
BEGIN
  ORDS.ENABLE_SCHEMA(
    p_enabled             => TRUE,
    p_schema              => 'HR',
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'hr',
    p_auto_rest_auth       => FALSE
  );
END;
/

-- ============================================================
-- Step 2: Define the module
-- ============================================================
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name    => 'hr.employees',
    p_base_path      => '/v1/',
    p_items_per_page => 25,
    p_status         => 'PUBLISHED',
    p_comments       => 'Employee management API'
  );
END;
/

-- ============================================================
-- Step 3: Define templates
-- ============================================================
BEGIN
  -- Collection template
  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'hr.employees',
    p_pattern     => 'employees/',
    p_comments    => 'Employee collection'
  );

  -- Item template
  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'hr.employees',
    p_pattern     => 'employees/:id',
    p_comments    => 'Single employee'
  );
END;
/

-- ============================================================
-- Step 4: Define handlers
-- ============================================================
BEGIN

  -- GET collection
  ORDS.DEFINE_HANDLER(
    p_module_name    => 'hr.employees',
    p_pattern        => 'employees/',
    p_method         => 'GET',
    p_source_type    => ORDS.source_type_collection_feed,
    p_items_per_page => 25,
    p_comments       => 'List employees',
    p_source         => q'[
      SELECT e.employee_id,
             e.first_name,
             e.last_name,
             e.email,
             e.hire_date,
             e.job_id,
             e.salary,
             e.department_id,
             d.department_name
      FROM   employees e
      JOIN   departments d ON d.department_id = e.department_id
      WHERE  (:dept_id IS NULL OR e.department_id = :dept_id)
      ORDER  BY e.last_name, e.first_name
    ]'
  );

  -- GET single item
  ORDS.DEFINE_HANDLER(
    p_module_name    => 'hr.employees',
    p_pattern        => 'employees/:id',
    p_method         => 'GET',
    p_source_type    => ORDS.source_type_collection_item,
    p_comments       => 'Get employee by ID',
    p_source         => q'[
      SELECT e.employee_id,
             e.first_name,
             e.last_name,
             e.email,
             e.phone_number,
             e.hire_date,
             e.job_id,
             e.salary,
             e.commission_pct,
             e.department_id,
             d.department_name,
             e.manager_id
      FROM   employees e
      JOIN   departments d ON d.department_id = e.department_id
      WHERE  e.employee_id = :id
    ]'
  );

  -- POST: Insert new employee
  ORDS.DEFINE_HANDLER(
    p_module_name    => 'hr.employees',
    p_pattern        => 'employees/',
    p_method         => 'POST',
    p_source_type    => ORDS.source_type_plsql,
    p_mimes_allowed  => 'application/json',
    p_comments       => 'Create new employee',
    p_source         => q'[
      DECLARE
        l_emp_id employees.employee_id%TYPE;
      BEGIN
        INSERT INTO employees (
          employee_id, first_name, last_name, email,
          phone_number, hire_date, job_id, salary,
          commission_pct, department_id, manager_id
        ) VALUES (
          employees_seq.NEXTVAL,
          :first_name, :last_name, :email,
          :phone_number,
          NVL(TO_DATE(:hire_date, 'YYYY-MM-DD'), SYSDATE),
          :job_id, :salary, :commission_pct,
          :department_id, :manager_id
        )
        RETURNING employee_id INTO l_emp_id;

        :status_code      := 201;
        :forward_location := './employees/' || l_emp_id;
      END;
    ]'
  );

  -- PUT: Full update of employee
  ORDS.DEFINE_HANDLER(
    p_module_name    => 'hr.employees',
    p_pattern        => 'employees/:id',
    p_method         => 'PUT',
    p_source_type    => ORDS.source_type_plsql,
    p_mimes_allowed  => 'application/json',
    p_comments       => 'Update employee',
    p_source         => q'[
      BEGIN
        UPDATE employees
        SET    first_name    = :first_name,
               last_name     = :last_name,
               email         = :email,
               phone_number  = :phone_number,
               job_id        = :job_id,
               salary        = :salary,
               commission_pct = :commission_pct,
               department_id = :department_id,
               manager_id    = :manager_id
        WHERE  employee_id = :id;

        IF SQL%ROWCOUNT = 0 THEN
          :status_code := 404;
        ELSE
          :status_code := 200;
        END IF;
      END;
    ]'
  );

  -- DELETE: Remove employee
  ORDS.DEFINE_HANDLER(
    p_module_name    => 'hr.employees',
    p_pattern        => 'employees/:id',
    p_method         => 'DELETE',
    p_source_type    => ORDS.source_type_plsql,
    p_comments       => 'Delete employee',
    p_source         => q'[
      BEGIN
        DELETE FROM employees WHERE employee_id = :id;

        IF SQL%ROWCOUNT = 0 THEN
          :status_code := 404;
        ELSE
          :status_code := 200;
        END IF;
      END;
    ]'
  );

END;
/

COMMIT;
```

---

## Bind Parameters

### URI Parameters

URI parameters from the template pattern (`:id`, `:dept_id`) are automatically available as bind variables in the SQL/PL/SQL source. They are always VARCHAR2.

```sql
-- Template: employees/:id
-- In handler source:
WHERE employee_id = :id
-- :id is bound from the URL segment
```

### Query String Parameters

Query string parameters are also available as bind variables with the same name:

```
GET /ords/hr/v1/employees/?dept_id=60
```

```sql
-- In handler source:
WHERE (:dept_id IS NULL OR department_id = :dept_id)
-- :dept_id is bound from ?dept_id=60
-- If omitted from URL, :dept_id is NULL
```

### Request Body Parameters (JSON)

For POST/PUT handlers with `application/json` body, ORDS automatically parses the JSON body and makes each top-level key available as a named bind variable:

```json
{
  "first_name": "Alice",
  "last_name": "Chen",
  "salary": 9000
}
```

Bind variables `:first_name`, `:last_name`, `:salary` are automatically available in the PL/SQL handler.

---

## Implicit (Reserved) Bind Parameters

ORDS provides special bind variables that don't come from the request payload:

| Bind Variable | Direction | Description |
|---|---|---|
| `:body` | IN | Request body as a BLOB |
| `:body_text` | IN | Request body as a CLOB (text) |
| `:content_type` | IN | Request Content-Type header |
| `:status_code` | OUT | HTTP response status code to return |
| `:forward_location` | OUT | URL to redirect to (sets Location header + 201/303) |
| `:fetch_offset` | IN | Current pagination offset |
| `:fetch_size` | IN | Current pagination limit |
| `:row_offset` | IN | First row number (fetch_offset + 1) |
| `:row_count` | IN | Same as fetch_size |
| `:current_user` | IN | Authenticated username (NULL if unauthenticated) |
| `:page_offset` | IN | Current page number |

```sql
-- Example: Using :status_code and :forward_location
BEGIN
  INSERT INTO orders (order_id, customer_id, amount)
  VALUES (order_seq.NEXTVAL, :customer_id, :amount)
  RETURNING order_id INTO :new_id;

  :status_code      := 201;
  :forward_location := 'orders/' || :new_id;
END;
```

```sql
-- Example: Reading raw request body
DECLARE
  l_json  CLOB := :body_text;
  l_obj   JSON_OBJECT_T;
BEGIN
  l_obj := JSON_OBJECT_T.PARSE(l_json);
  -- Process custom JSON structure
END;
```

---

## Returning JSON Results from PL/SQL Handlers

For `source_type_plsql` handlers, ORDS can serialize implicit result sets and cursor binds. For custom status codes, headers, or manually constructed response bodies, use one of these approaches:

### Approach 1: Use `:forward_location` to Redirect to GET

After a POST insert, redirect to the new resource URL. ORDS follows the redirect internally and returns the GET response body.

```sql
:forward_location := 'employees/' || l_new_id;
:status_code      := 201;
```

### Approach 2: Use `APEX_JSON` (if APEX is installed)

```sql
DECLARE
  l_emp employees%ROWTYPE;
BEGIN
  SELECT * INTO l_emp FROM employees WHERE employee_id = :id;

  APEX_JSON.OPEN_OBJECT;
  APEX_JSON.WRITE('employee_id', l_emp.employee_id);
  APEX_JSON.WRITE('first_name',  l_emp.first_name);
  APEX_JSON.WRITE('last_name',   l_emp.last_name);
  APEX_JSON.WRITE('salary',      l_emp.salary);
  APEX_JSON.CLOSE_OBJECT;
END;
```

### Approach 3: Use `collection_item` or `collection_feed` Source Types

For read operations, always prefer these source types over `plsql/block`. They handle serialization, pagination, and ETag generation automatically.

---

## Pagination in Collection Handlers

For `source_type_collection_feed`, ORDS handles pagination automatically using the SQL query with Oracle row-limiting clauses internally. The `:fetch_offset` and `:fetch_size` bind variables are available for manual pagination in PL/SQL:

```sql
-- Manual pagination using bind variables
SELECT *
FROM (
  SELECT e.*, ROWNUM rn
  FROM employees e
  WHERE ROWNUM <= :fetch_offset + :fetch_size
)
WHERE rn > :fetch_offset
```

For most cases, the `collection_feed` source type handles this automatically — just write a plain SELECT without pagination clauses.

---

## Designing RESTful Endpoints: Complete Pattern Reference

```
Resource collection:    GET    /v1/employees/           List
                        POST   /v1/employees/           Create

Resource item:          GET    /v1/employees/:id        Read
                        PUT    /v1/employees/:id        Replace or update
                        DELETE /v1/employees/:id        Delete

Nested collection:      GET    /v1/depts/:id/employees  List by parent
Sub-action (RPC-style): POST   /v1/employees/:id/promote  Action
Bulk operation:         POST   /v1/employees/bulk-import  Batch

Search endpoint:        GET    /v1/employees/search?q=alice
Aggregation:            GET    /v1/departments/:id/headcount
```

---

## Best Practices

- **Use `q'[...]'` quoting** for handler source strings: Avoids escaping single quotes in SQL/PL/SQL. The `q'[` syntax treats the content as a literal string.
- **Use `collection_feed` and `collection_item` for read-only endpoints**: These source types automatically handle pagination, ETag generation, and JSON serialization far better than `plsql/block`.
- **Check `SQL%ROWCOUNT` in DML handlers**: Always verify the DML affected at least one row and return 404 if not. Silently returning 200 when nothing changed is misleading.
- **Use `NOT_PUBLISHED` status during development**: Prevents partially-built APIs from being accidentally called.
- **Version your modules**: Use `/v1/`, `/v2/` in the base path. When making breaking changes, create a new module rather than modifying an existing one.
- **Set `p_mimes_allowed`** on POST/PUT handlers: Explicitly declare accepted content types to reject requests with wrong Content-Type early.
- **Use bind parameters exclusively — never string concatenation**: `WHERE id = :id` not `WHERE id = '|| l_id ||'`. Bind parameters prevent SQL injection and enable cursor sharing.

## Common Mistakes

- **Forgetting COMMIT after ORDS.DEFINE_***: ORDS metadata is stored in standard tables. Always commit after defining modules, templates, and handlers.
- **Using the same module name in two schemas**: Module names must be unique per schema but can repeat across schemas. Confusing module names across schemas leads to maintenance problems.
- **Redefining a handler without calling `ORDS.DELETE_HANDLER` first**: If a handler already exists and you call `ORDS.DEFINE_HANDLER` again, it overwrites the existing handler silently. This is usually desired but can cause surprises if pattern/method combination is wrong.
- **Not handling NULL bind variables in SQL WHERE clauses**: `WHERE dept_id = :dept_id` returns no rows when `:dept_id` is NULL. Use `WHERE (:dept_id IS NULL OR dept_id = :dept_id)` for optional filtering.
- **Mixing URL template types**: A template pattern `employees/:id/` (with trailing slash) and `employees/:id` (without) are different patterns. Be consistent.
- **Over-using `plsql/block` for SELECT operations**: Many developers use PL/SQL blocks with manual cursor loops for simple queries. Use `collection_feed` instead — it's more efficient and provides automatic pagination.

---

## Sources

- [ORDS Developer's Guide — Creating and Editing REST APIs](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/developing-oracle-rest-data-services-applications.html)
- [Oracle REST Data Services PL/SQL API Reference — ORDS.DEFINE_MODULE](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orrst/index.html)
- [ORDS Implicit Parameters Reference](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/implicit-parameters.html)
