# ORDS Metadata Catalog and OpenAPI Documentation

## Overview

ORDS automatically generates an OpenAPI 3.0 specification document for every REST module and AutoREST-enabled object. This machine-readable API description powers interactive documentation tools like Swagger UI and Oracle Database Actions, enables client SDK generation, and provides a self-describing API catalog for consumers. Understanding how to access, customize, and leverage this metadata is essential for building APIs that are both functional and well-documented.

---

## Auto-Generated OpenAPI Endpoints

ORDS exposes metadata at several URL paths:

### Schema-Level Metadata Catalog

Returns an OpenAPI 3.0 document covering all published modules in the schema:

```
GET /ords/{schema_alias}/metadata-catalog/
```

Example:

```http
GET /ords/hr/metadata-catalog/ HTTP/1.1
Host: myserver.example.com
Accept: application/json
```

Response: Full OpenAPI 3.0 JSON document covering all published REST modules and AutoREST objects in the HR schema.

### Module-Level OpenAPI Document

Returns the OpenAPI 3.0 document for a single module:

```
GET /ords/{schema_alias}/metadata-catalog/{module_name}/
```

Example:

```http
GET /ords/hr/metadata-catalog/hr.employees/ HTTP/1.1
```

### AutoREST Object Metadata

Returns the OpenAPI document for an individual AutoREST-enabled object:

```
GET /ords/{schema_alias}/metadata-catalog/{object_alias}/
```

Example:

```http
GET /ords/hr/metadata-catalog/employees/ HTTP/1.1
```

### OpenAPI JSON Format (forced)

```
GET /ords/{schema_alias}/metadata-catalog/?format=json
GET /ords/{schema_alias}/open-api-catalog/
```

---

## Sample OpenAPI 3.0 Output

For a simple GET /employees handler, ORDS generates:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "HR REST API",
    "description": "Employee management API",
    "version": "1.0.0",
    "contact": {
      "name": "HR Platform Team"
    }
  },
  "servers": [
    {
      "url": "https://myserver.example.com/ords/hr/v1"
    }
  ],
  "paths": {
    "/employees/": {
      "get": {
        "summary": "List employees",
        "description": "Returns a paginated list of employees with optional filtering",
        "operationId": "getEmployees",
        "parameters": [
          {
            "name": "offset",
            "in": "query",
            "schema": { "type": "integer", "default": 0 }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 25 }
          },
          {
            "name": "q",
            "in": "query",
            "description": "JSON filter query",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EmployeeCollection"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create new employee",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/Employee" }
            }
          }
        },
        "responses": {
          "201": { "description": "Employee created" }
        }
      }
    },
    "/employees/{id}": {
      "get": {
        "summary": "Get employee by ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": { "description": "Employee found" },
          "404": { "description": "Employee not found" }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Employee": {
        "type": "object",
        "properties": {
          "employee_id": { "type": "integer" },
          "first_name":  { "type": "string" },
          "last_name":   { "type": "string" },
          "email":       { "type": "string" },
          "salary":      { "type": "number" }
        }
      }
    },
    "securitySchemes": {
      "OAuth2": {
        "type": "oauth2",
        "flows": {
          "clientCredentials": {
            "tokenUrl": "https://myserver.example.com/ords/hr/oauth/token",
            "scopes": {
              "hr.employees.read": "Read employee data"
            }
          }
        }
      }
    }
  }
}
```

---

## Customizing API Metadata via Comments

ORDS uses the `p_comments` parameter in `DEFINE_MODULE`, `DEFINE_TEMPLATE`, and `DEFINE_HANDLER` to populate the OpenAPI `description` and `summary` fields.

### Module-Level Description

```sql
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name => 'hr.employees',
    p_base_path   => '/v1/',
    p_status      => 'PUBLISHED',
    p_comments    => 'HR Employee Management API v1. Provides CRUD operations for employee records. Authentication required for write operations.'
  );
END;
/
```

### Template Comments (Maps to path description)

```sql
BEGIN
  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'hr.employees',
    p_pattern     => 'employees/',
    p_comments    => 'Employee collection resource. Supports filtering via q parameter, pagination via limit/offset, and ordering via orderby parameter.'
  );
END;
/
```

### Handler Comments (Maps to operation summary/description)

```sql
BEGIN
  ORDS.DEFINE_HANDLER(
    p_module_name => 'hr.employees',
    p_pattern     => 'employees/',
    p_method      => 'GET',
    p_source_type => ORDS.source_type_collection_feed,
    p_comments    => 'Returns a paginated list of employees. Filter by department using ?dept_id=N. Supports ordering by any column.',
    p_source      => 'SELECT * FROM employees'
  );
END;
/
```

---

## Documenting Parameters with ORDS.DEFINE_PARAMETER

For custom-defined REST modules, ORDS allows explicit parameter documentation that enriches the OpenAPI output.

```sql
BEGIN
  -- Document the dept_id query parameter
  ORDS.DEFINE_PARAMETER(
    p_module_name        => 'hr.employees',
    p_pattern            => 'employees/',
    p_method             => 'GET',
    p_name               => 'dept_id',
    p_bind_variable_name => 'dept_id',
    p_source_type        => 'URI',      -- Query-string and path params are URI sourced
    p_param_type         => 'INT',      -- Informs OpenAPI type
    p_access_method      => 'IN',
    p_comments           => 'Filter employees by department ID'
  );

  -- Document the id path parameter
  ORDS.DEFINE_PARAMETER(
    p_module_name        => 'hr.employees',
    p_pattern            => 'employees/:id',
    p_method             => 'GET',
    p_name               => 'id',
    p_bind_variable_name => 'id',
    p_source_type        => 'URI',
    p_param_type         => 'INT',
    p_access_method      => 'IN',
    p_comments           => 'Unique employee identifier'
  );

  COMMIT;
END;
/
```

---

## Using the OpenAPI Spec with Swagger UI

### Option 1: Swagger UI via ORDS Standalone

ORDS standalone can serve Swagger UI static files from its `doc_root` directory:

```shell
# Download Swagger UI distribution
curl -L https://github.com/swagger-api/swagger-ui/archive/v5.x.x.tar.gz | tar xz
cp -r swagger-ui-5.x.x/dist/* /opt/oracle/ords/config/ords/standalone/doc_root/swagger/
```

Create a redirect page at the ORDS doc root:

```html
<!-- /opt/oracle/ords/config/ords/standalone/doc_root/api-docs/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>HR API Documentation</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" href="/swagger/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/swagger/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/ords/hr/metadata-catalog/",
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>
```

Access at: `https://myserver.example.com/api-docs/`

### Option 2: Oracle Database Actions (Built-in)

If Database Actions (formerly SQL Developer Web) is enabled, it includes a built-in REST Workshop with automatic API documentation at:

```
https://myserver.example.com/ords/sql-developer
```

Navigate to REST → Modules to view, test, and manage REST APIs with an interactive UI.

### Option 3: Postman Import

Export the OpenAPI spec and import directly into Postman:

```shell
# Download the OpenAPI spec
curl -o hr-api.json \
  https://myserver.example.com/ords/hr/metadata-catalog/hr.employees/

# Import via Postman CLI
postman import -f hr-api.json
```

Or in Postman UI: File → Import → select the JSON file. Postman generates a collection with all endpoints, example requests, and documentation.

---

## ORDS Metadata REST Endpoints

Beyond OpenAPI, ORDS exposes its own metadata via REST:

### List All Modules

```http
GET /ords/_/db-api/stable/metadata-catalog/ HTTP/1.1
Authorization: Bearer <admin-token>
```

### Module Details

```http
GET /ords/hr/metadata-catalog/hr.employees/ HTTP/1.1
```

### Check ORDS Status

```http
GET /ords/_/db-api/stable/database/ HTTP/1.1
```

### Enabled Schemas

```sql
-- Via SQL (DBA access required)
SELECT schema, url_mapping_pattern, auto_rest_auth
FROM   dba_ords_enabled_schemas
ORDER  BY schema;

-- Via REST API (if Database API is enabled)
GET /ords/_/db-api/stable/database/pdbs/
```

---

## Querying ORDS Metadata from SQL

ORDS exposes its metadata through data dictionary views:

```sql
-- List all REST-enabled schemas
SELECT schema, url_mapping_pattern, auto_rest_auth
FROM   dba_ords_enabled_schemas;

-- List all modules in the current schema
SELECT name, uri_prefix, status, items_per_page, comments
FROM   user_ords_modules
ORDER  BY name;

-- List all templates for a module
SELECT module_id, uri_template, priority, etag_type
FROM   user_ords_templates
WHERE  module_id = (SELECT id FROM user_ords_modules WHERE name = 'hr.employees');

-- List all handlers with their source
SELECT t.uri_template, h.method, h.source_type, h.source
FROM   user_ords_handlers h
JOIN   user_ords_templates t ON t.id = h.template_id
JOIN   user_ords_modules   m ON m.id = t.module_id
WHERE  m.name = 'hr.employees'
ORDER  BY t.uri_template, h.method;

-- DBA views for cross-schema inspection
SELECT s.schema, m.name, t.uri_template, h.method
FROM   dba_ords_enabled_schemas s
JOIN   dba_ords_modules         m ON m.schema = s.schema
JOIN   dba_ords_templates       t ON t.module_id = m.id
JOIN   dba_ords_handlers        h ON h.template_id = t.id
ORDER  BY s.schema, m.name;
```

---

## Exporting and Importing REST Definitions

### Export via ORDS_EXPORT

```sql
-- Export a single module from the current schema as a rerunnable script
SELECT ORDS_EXPORT.EXPORT_MODULE(
         p_module_name           => 'hr.employees',
         p_include_enable_schema => TRUE,
         p_include_privs         => TRUE,
         p_export_date           => FALSE
       ) AS ddl
FROM   dual;

-- DBA export for an entire schema
SELECT ORDS_EXPORT_ADMIN.EXPORT_SCHEMA(
         p_schema                => 'HR',
         p_include_enable_schema => TRUE,
         p_include_privileges    => TRUE,
         p_include_roles         => TRUE,
         p_include_modules       => TRUE,
         p_include_rest_objects  => TRUE,
         p_export_date           => FALSE
       ) AS ddl
FROM   dual;
```

The exported CLOB contains rerunnable `ORDS.DEFINE_MODULE`, `ORDS.DEFINE_TEMPLATE`, and `ORDS.DEFINE_HANDLER` calls. Use it for:
- Version-controlling REST API definitions
- Migrating from DEV to TEST to PROD environments
- Documenting REST API changes in source control

---

## Best Practices

- **Always provide `p_comments` on all ORDS objects**: Even brief descriptions significantly improve the auto-generated OpenAPI spec quality. Document the expected inputs, outputs, and behavior.
- **Use module versioning in names and paths**: `hr.employees.v1` and `/v1/` makes version changes explicit in both the metadata and the OpenAPI spec.
- **Automate OpenAPI spec download in CI/CD**: Pull the live metadata from ORDS and diff against the committed spec. Alert when the live spec diverges from expectations.
- **Test OpenAPI specs with validators**: Use tools like `openapi-generator validate` or `spectral lint` to catch spec issues before consumers hit them.
- **Keep metadata-catalog endpoints protected for internal APIs**: Public-facing metadata URLs expose your full API structure. Use ORDS privileges to restrict access to `/metadata-catalog/` for sensitive APIs.
- **Use `ORDS.DEFINE_PARAMETER` for all query and path params**: This makes the OpenAPI spec accurate for Postman/Swagger UI users who depend on documented parameters.

## Common Mistakes

- **Assuming metadata-catalog shows unpublished modules**: Only modules with `p_status => 'PUBLISHED'` appear in the metadata catalog. Modules under development set to `NOT_PUBLISHED` are hidden (as intended).
- **Not committing after ORDS.DEFINE_PARAMETER**: Like all ORDS metadata, parameter definitions are in DB tables and require an explicit COMMIT.
- **Editing OpenAPI JSON directly**: The metadata-catalog endpoint is generated dynamically from ORDS_METADATA tables. Edits to the JSON output are discarded on next request. Edit the source definitions instead.
- **Forgetting that metadata-catalog URLs are case-sensitive in module names**: `metadata-catalog/HR.Employees/` and `metadata-catalog/hr.employees/` may return different results. Module names are stored as defined (often lowercase). Be consistent.
- **Using the metadata endpoint as a health check**: The metadata catalog requires DB access. Use `/ords/_/db-api/stable/database/` for health checks instead, as it has a simpler response and lower overhead.

---

## Sources

- [ORDS Developer's Guide — OpenAPI and Metadata Catalog](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/developing-oracle-rest-data-services-applications.html)
- [Oracle REST Data Services PL/SQL API Reference — ORDS.DEFINE_PARAMETER](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orrst/index.html)
- [Oracle REST Data Services PL/SQL API Reference — ORDS_EXPORT and ORDS_EXPORT_ADMIN](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.4/orddg/ORDS-reference.html)
