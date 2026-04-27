# ORDS AutoREST: Automatic REST Enablement for Tables, Views, and Procedures

## Overview

AutoREST is ORDS's zero-code approach to exposing Oracle Database objects as REST endpoints. With a single PL/SQL call, ORDS automatically generates a full set of CRUD endpoints for a table or view, including collection GET (with filtering, pagination, ordering), individual item GET, POST, PUT, and DELETE. AutoREST is ideal for rapid prototyping, internal tooling, and situations where standard CRUD over tables is sufficient. For complex business logic, custom REST APIs (`ORDS.DEFINE_MODULE`) are more appropriate.

---

## Enabling AutoREST on a Schema

Before any individual objects can be AutoREST-enabled, the schema itself must be REST-enabled. This registers the schema with ORDS and creates the URL alias.

```sql
-- Connect as the schema owner or a DBA
BEGIN
  ORDS.ENABLE_SCHEMA(
    p_enabled             => TRUE,
    p_schema              => 'HR',          -- DB username (case-insensitive)
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'hr',          -- URL alias: /ords/hr/
    p_auto_rest_auth       => FALSE         -- FALSE = public by default
  );
  COMMIT;
END;
/
```

Parameters:
- `p_url_mapping_pattern`: The path segment in the URL. `hr` → `/ords/hr/`.
- `p_auto_rest_auth`: When TRUE, all AutoREST endpoints require authentication by default. When FALSE, they are public unless a privilege is explicitly attached.

To disable a schema:

```sql
BEGIN
  ORDS.ENABLE_SCHEMA(
    p_enabled  => FALSE,
    p_schema   => 'HR'
  );
  COMMIT;
END;
/
```

---

## Enabling AutoREST on Individual Objects

### Tables and Views

```sql
-- Enable AutoREST on the EMPLOYEES table
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled        => TRUE,
    p_schema         => 'HR',
    p_object         => 'EMPLOYEES',
    p_object_type    => 'TABLE',           -- or 'VIEW'
    p_object_alias   => 'employees',       -- URL path segment
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/
```

After this call, ORDS immediately serves the following endpoints (assuming schema alias `hr`):

```
GET    /ords/hr/employees/          → Return collection (paginated)
GET    /ords/hr/employees/{id}      → Return single item by primary key
POST   /ords/hr/employees/          → Insert a new row
PUT    /ords/hr/employees/{id}      → Full update (replace) of a row
DELETE /ords/hr/employees/{id}      → Delete a row
```

The `{id}` in item URLs maps to the table's primary key column(s). For composite keys, ORDS encodes them in the URL.

### Views

AutoREST on views provides GET (collection and item) endpoints. POST/PUT/DELETE work only if the view is updatable or has INSTEAD OF triggers.

```sql
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled        => TRUE,
    p_schema         => 'HR',
    p_object         => 'EMP_DETAILS_VIEW',
    p_object_type    => 'VIEW',
    p_object_alias   => 'emp-details',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/
```

### Procedures and Functions

AutoREST can expose PL/SQL procedures and functions as REST endpoints:

```sql
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled        => TRUE,
    p_schema         => 'HR',
    p_object         => 'GET_EMPLOYEE_DETAILS',
    p_object_type    => 'PROCEDURE',
    p_object_alias   => 'get-emp-details',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/
```

This creates a POST endpoint at `/ords/hr/get-emp-details/` that passes the JSON body as procedure parameters.

---

## Generated Endpoint URL Patterns

For a table `HR.EMPLOYEES` with alias `employees` under schema alias `hr`:

| Operation | HTTP Method | URL | Description |
|---|---|---|---|
| List all | GET | `/ords/hr/employees/` | Paginated collection |
| Get one | GET | `/ords/hr/employees/101` | Single row by PK |
| Insert | POST | `/ords/hr/employees/` | Create new row |
| Update | PUT | `/ords/hr/employees/101` | Replace existing row |
| Delete | DELETE | `/ords/hr/employees/101` | Delete row |
| Metadata | GET | `/ords/hr/metadata-catalog/employees/` | OpenAPI for this object |

---

## Sample HTTP Requests and Responses

### GET Collection

```http
GET /ords/hr/employees/ HTTP/1.1
Host: myserver.example.com
Accept: application/json
```

```json
{
  "items": [
    {
      "employee_id": 100,
      "first_name": "Steven",
      "last_name": "King",
      "email": "SKING",
      "hire_date": "1987-06-17T00:00:00Z",
      "salary": 24000,
      "links": [
        {
          "rel": "self",
          "href": "https://myserver.example.com/ords/hr/employees/100"
        }
      ]
    },
    {
      "employee_id": 101,
      "first_name": "Neena",
      "last_name": "Yang",
      "email": "NYANG",
      "hire_date": "1989-09-21T00:00:00Z",
      "salary": 17000,
      "links": [...]
    }
  ],
  "hasMore": true,
  "limit": 25,
  "offset": 0,
  "count": 25,
  "links": [
    { "rel": "self",  "href": "https://myserver.example.com/ords/hr/employees/" },
    { "rel": "first", "href": "https://myserver.example.com/ords/hr/employees/?offset=0&limit=25" },
    { "rel": "next",  "href": "https://myserver.example.com/ords/hr/employees/?offset=25&limit=25" }
  ]
}
```

### GET Single Item

```http
GET /ords/hr/employees/101 HTTP/1.1
Host: myserver.example.com
```

```json
{
  "employee_id": 101,
  "first_name": "Neena",
  "last_name": "Yang",
  "salary": 17000,
  "department_id": 90,
  "links": [
    { "rel": "self", "href": "https://myserver.example.com/ords/hr/employees/101" },
    { "rel": "edit", "href": "https://myserver.example.com/ords/hr/employees/101" },
    { "rel": "delete", "href": "https://myserver.example.com/ords/hr/employees/101" },
    { "rel": "collection", "href": "https://myserver.example.com/ords/hr/employees/" }
  ]
}
```

### POST (Insert)

```http
POST /ords/hr/employees/ HTTP/1.1
Host: myserver.example.com
Content-Type: application/json

{
  "employee_id": 210,
  "first_name": "Alice",
  "last_name": "Chen",
  "email": "ACHEN",
  "hire_date": "2024-01-15T00:00:00Z",
  "job_id": "IT_PROG",
  "salary": 9000,
  "department_id": 60
}
```

```http
HTTP/1.1 201 Created
Location: https://myserver.example.com/ords/hr/employees/210
Content-Type: application/json

{
  "employee_id": 210,
  "first_name": "Alice",
  ...
}
```

### PUT (Update)

```http
PUT /ords/hr/employees/210 HTTP/1.1
Content-Type: application/json

{
  "salary": 9500
}
```

### DELETE

```http
DELETE /ords/hr/employees/210 HTTP/1.1
```

```http
HTTP/1.1 200 OK
```

---

## Filtering with the `q` Parameter (JSON Filter Syntax)

AutoREST supports a powerful JSON-based query syntax via the `q` query parameter.

### Basic Equality

```http
GET /ords/hr/employees/?q={"department_id":90}
```

URL-encoded:

```
/ords/hr/employees/?q=%7B%22department_id%22%3A90%7D
```

### Comparison Operators

```json
// Greater than
{"salary": {"$gt": 10000}}

// Less than or equal
{"salary": {"$lte": 15000}}

// Not equal
{"job_id": {"$ne": "IT_PROG"}}

// Range (between 10000 and 20000)
{"salary": {"$between": [10000, 20000]}}
```

### String Matching

```json
// LIKE pattern (% wildcard)
{"last_name": {"$like": "K%"}}

// Case-insensitive LIKE
{"last_name": {"$ilike": "k%"}}

// IN list
{"department_id": {"$in": [60, 90, 110]}}
```

### Logical Operators

```json
// AND (default when multiple keys)
{"department_id": 60, "salary": {"$gt": 5000}}

// Explicit AND
{"$and": [{"department_id": 60}, {"salary": {"$gt": 5000}}]}

// OR
{"$or": [{"department_id": 60}, {"department_id": 90}]}

// NOT
{"$not": {"job_id": "AD_PRES"}}
```

### Example: Complex Filter

```http
GET /ords/hr/employees/?q={"$and":[{"department_id":{"$in":[60,90]}},{"salary":{"$gt":8000}}]}&orderby=salary%20DESC&limit=10
```

---

## Pagination

AutoREST uses offset-based pagination with `limit` and `offset` query parameters.

```http
# Page 1: first 10 records
GET /ords/hr/employees/?limit=10&offset=0

# Page 2: next 10 records
GET /ords/hr/employees/?limit=10&offset=10

# Page 3
GET /ords/hr/employees/?limit=10&offset=20
```

The response always includes:
- `"hasMore"`: `true` if more records exist beyond the current page
- `"count"`: number of items in the current response
- `"limit"`: the limit applied
- `"offset"`: the offset applied
- `"links"`: `self`, `first`, `next` (if hasMore), `prev` (if offset > 0)

Maximum limit: ORDS defaults to 10,000 rows maximum per request. Override in ORDS config if needed.

### Pagination Example Response Fragment

```json
{
  "items": [...],
  "hasMore": true,
  "limit": 25,
  "offset": 0,
  "count": 25,
  "links": [
    { "rel": "self",  "href": "/ords/hr/employees/?limit=25&offset=0" },
    { "rel": "first", "href": "/ords/hr/employees/?limit=25&offset=0" },
    { "rel": "next",  "href": "/ords/hr/employees/?limit=25&offset=25" }
  ]
}
```

---

## Ordering

Use the `orderby` query parameter to control sort order.

```http
# Single column ascending
GET /ords/hr/employees/?orderby=last_name

# Single column descending
GET /ords/hr/employees/?orderby=salary%20DESC

# Multiple columns
GET /ords/hr/employees/?orderby=department_id%20ASC,salary%20DESC
```

---

## Controlling Exposed Columns

By default, AutoREST exposes ALL columns of the table/view. To restrict columns, there are two options:

### Option 1: Expose a View Instead of the Table

Create a view with only the desired columns and AutoREST-enable the view:

```sql
CREATE VIEW hr.employees_public AS
  SELECT employee_id, first_name, last_name, email,
         hire_date, job_id, department_id
  FROM hr.employees;
-- salary, commission_pct etc. not included

BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled     => TRUE,
    p_schema      => 'HR',
    p_object      => 'EMPLOYEES_PUBLIC',
    p_object_type => 'VIEW',
    p_object_alias => 'employees'
  );
  COMMIT;
END;
/
```

### Option 2: Custom REST Handler (Preferred for Fine Control)

Use `ORDS.DEFINE_HANDLER` with an explicit SELECT list (see `ords-rest-api-design.md`).

---

## AutoREST for Object Tables

AutoREST supports object tables (Oracle object-relational types). The JSON representation follows the nested object structure. Deeply nested or complex types may require custom handlers for clean JSON output.

---

## Checking AutoREST Status

```sql
-- View all AutoREST-enabled objects in the current schema
SELECT object_name, object_type, object_alias, auto_rest_auth
FROM user_ords_enabled_objects
ORDER BY object_name;

-- View all REST-enabled schemas (DBA view)
SELECT schema, url_mapping_pattern, auto_rest_auth
FROM dba_ords_enabled_schemas;
```

---

## Best Practices

- **Use schema aliases that differ from schema names**: Decouples your public URL from internal DB usernames. If the schema is renamed, the URL stays stable.
- **Enable `p_auto_rest_auth => TRUE`** for any non-public data: Forces authentication on all AutoREST endpoints for the object. Add an ORDS privilege to grant specific access.
- **Prefer views over direct table exposure**: Views let you control columns, apply row-level filters, join data, and rename columns for cleaner APIs — all without any REST-specific code.
- **Use AutoREST for internal tooling and prototyping**: For production APIs with custom business logic, validation, or complex transformations, define explicit REST handlers.
- **Test filter queries in SQL first**: The `q` parameter translates to SQL WHERE clauses. Test the equivalent SQL in your IDE to verify results before implementing in client code.
- **Set sensible `limit` defaults in client code**: ORDS defaults to 25 items per page. Always handle pagination in clients — never assume all records fit in one response.

## Common Mistakes

- **Forgetting to commit after `ORDS.ENABLE_OBJECT`**: The ORDS metadata tables are standard DB tables. If you don't commit, the change is rolled back and the endpoint won't appear.
- **Enabling AutoREST on the table directly when only read access is needed**: This creates POST/PUT/DELETE endpoints that could be exploited. Either use a view (which is typically not updatable), attach privileges, or set `p_auto_rest_auth => TRUE`.
- **URL-encoding issues with the `q` parameter**: JSON in query strings must be URL-encoded. Curly braces, quotes, and colons are special characters. Always URL-encode the `q` value in client code.
- **Assuming `{id}` always matches the column name**: The URL segment maps to the primary key, not a column named `id`. If the PK column is `employee_id`, the correct URL is `/employees/101`, not `/employees/?employee_id=101`.
- **Exposing tables with sensitive columns (passwords, PII) via AutoREST**: All columns are exposed by default. Audit your table structure before enabling AutoREST on any table containing sensitive data.
- **Not accounting for NULL primary keys**: Rows with NULL primary keys cannot be addressed by item URLs. Ensure your tables have `NOT NULL` primary key constraints.

---

## Sources

- [ORDS Developer's Guide — AutoREST](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/developing-oracle-rest-data-services-applications.html)
- [Oracle REST Data Services PL/SQL API Reference — ORDS.ENABLE_OBJECT](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orrst/index.html)
- [ORDS REST API Collection Query Syntax (q parameter)](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/implicit-parameters.html)
