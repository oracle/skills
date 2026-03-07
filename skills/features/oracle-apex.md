# Oracle APEX (Application Express)

## Overview

**Oracle APEX** (Application Express) is a low-code development platform built directly into the Oracle database. It enables developers to build web applications, REST APIs, and data-driven dashboards using browser-based tooling, without requiring a separate application server. APEX applications run inside the database engine (or through Oracle REST Data Services), query Oracle tables directly, and are deployed and version-controlled as exportable metadata.

APEX is included at no additional cost with Oracle Database (Standard Edition 2 and Enterprise Edition). As of APEX 23.x and 24.x, it supports modern JavaScript frameworks integration, native JSON and REST services, native Low Code App Builder tooling, and Autonomous Database deployment via the Oracle Cloud.

**Key strengths:**
- Ultra-fast development cycles for data-centric internal tools and dashboards
- Zero additional licensing cost on Oracle Database
- Declarative page design with extensive built-in UI components
- Deep SQL/PLSQL integration — expressions, validations, and processes all use SQL/PLSQL inline
- Built-in authentication (LDAP, SSO, OAuth2, custom), authorization, and audit logging

---

## APEX Architecture

### Runtime Execution Paths

**Classic APEX with `mod_plsql` (legacy)**
HTTP requests are routed through Oracle HTTP Server (OHS) with `mod_plsql` to the database, where APEX's PL/SQL engine generates the HTML response. This architecture is still supported but is no longer the recommended path.

**APEX with Oracle REST Data Services (ORDS)**
The modern and recommended deployment. ORDS is a Java-based middleware layer (deployable as a standalone service or in Apache Tomcat, GlassFish, or Kubernetes) that handles HTTP/S connections, routes APEX page requests to the database, and serves ORDS REST endpoints. ORDS replaces `mod_plsql` and is required for APEX 22+.

```
Browser
  |
  v
ORDS (Jetty / Tomcat / Container)
  |  -- APEX page requests -- HTTP over Oracle Net
  v
Oracle Database
  |-- APEX Engine (PL/SQL packages in APEX_xxxxxx schema)
  |-- Application schemas (APPSCHEMA, HRSCHEMA, etc.)
  |-- APEX metadata (application definitions, pages, items)
```

**APEX on Autonomous Database (Oracle Cloud)**
ORDS and APEX are pre-installed and pre-configured. No installation is needed; access is via `https://<your-adb-name>.adb.<region>.oraclecloudapps.com/ords/apex`.

### Key Database Schemas

| Schema | Purpose |
|---|---|
| `APEX_xxxxxx` | Core APEX PL/SQL engine packages and metadata (version-specific, e.g., `APEX_230200`) |
| `APEX_PUBLIC_USER` | Low-privilege account used by ORDS to connect to the database for APEX page requests |
| `FLOWS_FILES` | Stores uploaded files for APEX applications (older versions; replaced by APEX_APPLICATION_FILES in newer releases) |
| `ORDS_METADATA` | ORDS REST endpoint definitions |
| `ORDS_PUBLIC_USER` | Low-privilege account used by ORDS for REST endpoint execution |

---

## Workspaces and Applications

### Workspaces

A **workspace** is the top-level organizational unit in APEX. It acts as a namespace that:
- Contains one or more applications
- Is associated with one or more database schemas (the schemas the applications can query)
- Has its own set of developers and administrators
- Has its own storage quota

```sql
-- Create a workspace via the internal APEX admin API
-- (Run as SYS or an account with the APEX_ADMINISTRATOR_ROLE)
BEGIN
    APEX_INSTANCE_ADMIN.ADD_WORKSPACE(
        p_workspace_id   => NULL,          -- auto-generated
        p_workspace      => 'MYWORKSPACE',
        p_primary_schema => 'APPSCHEMA'    -- primary schema associated with this workspace
    );
END;
/

-- Associate additional schemas with the workspace
BEGIN
    APEX_INSTANCE_ADMIN.ADD_SCHEMA(
        p_workspace => 'MYWORKSPACE',
        p_schema    => 'HRSCHEMA'
    );
END;
/
```

### Applications

An **application** is a collection of pages, shared components (navigation menus, list of values, authorization schemes, etc.), and metadata. Applications live inside a workspace and run against the schemas associated with that workspace.

Applications are exported as a single SQL script (the **application export**), which can be imported on another APEX instance. This is the standard mechanism for version control and deployment.

---

## Connecting APEX to Schemas

APEX applications run queries in the context of the **parsing schema** — the database schema whose privileges are used to resolve object references in the application's SQL and PL/SQL.

```sql
-- View or change an application's parsing schema
-- (Done via App Builder UI: Shared Components > Application Properties > Parsing Schema)
-- Or programmatically:
BEGIN
    -- Use APEX_APPLICATION_ADMIN package in newer versions
    -- In App Builder: Application > Edit Application Properties > Database Schema
    NULL;
END;
/

-- Best practice: create a dedicated application schema with only necessary privileges
CREATE USER appschema IDENTIFIED BY "SecurePassword123!"
    DEFAULT TABLESPACE users
    TEMPORARY TABLESPACE temp
    QUOTA 500M ON users;

GRANT CREATE SESSION TO appschema;
GRANT CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE PROCEDURE TO appschema;
GRANT CREATE PUBLIC SYNONYM TO appschema;  -- only if needed

-- Grant the APEX builder user's schema access (workspace association handles this)
-- APEX_PUBLIC_USER needs EXECUTE on APEX engine packages (handled by APEX installer)
```

---

## APEX Page Types and Components

### Core Page Component Hierarchy

```
Application
  |- Shared Components
  |   |- Authentication Schemes
  |   |- Authorization Schemes
  |   |- Application Items (global variables)
  |   |- List of Values (LOVs)
  |   |- Navigation Menu
  |- Page 1 (Login)
  |- Page 2 (Home Dashboard)
  |   |- Regions (containers for content)
  |   |   |- Classic Report Region (SQL query output)
  |   |   |- Interactive Report Region (filterable, downloadable)
  |   |   |- Form Region (DML form bound to a table)
  |   |   |- Chart Region (declarative charts)
  |   |- Page Items (form fields, hidden values)
  |   |- Page Processes (PL/SQL logic: INSERT, UPDATE, API calls)
  |   |- Page Validations (client or server-side checks)
  |   |- Dynamic Actions (JavaScript event handlers, server-side AJAX)
  |- Page N ...
```

### Referencing Session State in SQL

APEX stores user input and application variables in **session state**, accessible in SQL via bind variables:

```sql
-- In a report region SQL query, reference a page item
SELECT order_id, order_date, customer_id, total_amount
FROM   orders
WHERE  customer_id = :P2_CUSTOMER_ID           -- page item on page 2
  AND  order_date  >= NVL(:P2_FROM_DATE, DATE '2000-01-01')
  AND  order_date  <= NVL(:P2_TO_DATE,   SYSDATE)
  AND  status      = NVL(:P2_STATUS, status);  -- NULL means 'show all'

-- In a PL/SQL process
BEGIN
    UPDATE orders
    SET    status = 'SHIPPED',
           shipped_date = SYSDATE
    WHERE  order_id = :P5_ORDER_ID;

    -- Set another page item in session state
    APEX_UTIL.SET_SESSION_STATE('P5_STATUS_MSG', 'Order ' || :P5_ORDER_ID || ' marked as shipped.');
END;
```

---

## Built-In Authentication Schemes

APEX provides a pluggable authentication framework. You configure an **authentication scheme** per application.

| Scheme | Description |
|---|---|
| Application Express Account | APEX workspace user accounts; good for internal tools |
| Oracle Database Account | Validates against a real database username/password |
| LDAP Directory | Authenticates against an LDAP/Active Directory server |
| HTTP Header Variable | Trusts a pre-authenticated header (e.g., from a reverse proxy or SSO agent) |
| Oracle Access Manager (OAM) | Integrates with Oracle SSO / OAM federation |
| OpenID Connect | Modern OAuth2/OIDC integration (Google, Azure AD, Okta, etc.) |
| SAML 2.0 | Enterprise SSO via SAML identity providers |
| Custom / PL/SQL | Full control — implement any authentication logic in PL/SQL |

### Custom PL/SQL Authentication

```sql
CREATE OR REPLACE FUNCTION custom_auth(
    p_username IN VARCHAR2,
    p_password IN VARCHAR2
) RETURN BOOLEAN AS
    v_count NUMBER;
    v_hash  VARCHAR2(256);
BEGIN
    -- Compute password hash (use a proper hashing function in production)
    v_hash := STANDARD_HASH(p_password || 'SALT', 'SHA256');

    SELECT COUNT(*)
    INTO   v_count
    FROM   app_users
    WHERE  UPPER(username)   = UPPER(p_username)
      AND  password_hash     = v_hash
      AND  account_locked    = 'N'
      AND  account_expires   > SYSDATE;

    RETURN v_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END custom_auth;
/
-- Then in App Builder:
-- Authentication Scheme > Scheme Type: Custom
-- Authentication Function Name: custom_auth
```

### Authorization Schemes

```sql
-- PL/SQL authorization scheme: user must have a specific role
-- In App Builder: Shared Components > Authorization Schemes > Create
-- Type: PL/SQL Function Returning Boolean
-- Expression:
BEGIN
    RETURN APEX_UTIL.HAS_APPLICATION_ROLE(
        p_application_id => :APP_ID,
        p_role_static_id => 'ADMIN'
    );
END;
```

---

## Oracle REST Data Services (ORDS)

ORDS serves two functions in an APEX context: it is the APEX runtime host, and it is a full REST API development platform.

### Installing and Configuring ORDS

```bash
# Install ORDS against a pluggable database (ORDS 22+ CLI syntax)
ords --config /opt/oracle/ords/config install \
  --admin-user SYS \
  --db-hostname db-host.company.com \
  --db-port 1521 \
  --db-servicename MYDB \
  --feature-db-api true \
  --feature-apex-rest true

# Start ORDS as a standalone server (for development)
ords --config /opt/oracle/ords/config serve \
  --port 8080 \
  --secure-port 8443
```

### Enabling ORDS and APEX for a Schema

```sql
-- Enable ORDS REST services for a schema (run as the schema owner or with DBA)
BEGIN
    ORDS.ENABLE_SCHEMA(
        p_enabled             => TRUE,
        p_schema              => 'APPSCHEMA',
        p_url_mapping_type    => 'BASE_PATH',
        p_url_mapping_pattern => 'appschema',
        p_auto_rest_auth      => FALSE   -- TRUE requires authentication for all REST endpoints
    );
    COMMIT;
END;
/
```

### Defining REST Endpoints

```sql
-- Define a REST module and endpoint using ORDS PL/SQL API
BEGIN
    ORDS.DEFINE_MODULE(
        p_module_name    => 'orders.api',
        p_base_path      => '/orders/',
        p_items_per_page => 25,
        p_status         => 'PUBLISHED',
        p_comments       => 'Orders API'
    );

    -- GET /ords/appschema/orders/list — paginated list of orders
    ORDS.DEFINE_TEMPLATE(
        p_module_name    => 'orders.api',
        p_pattern        => 'list'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name    => 'orders.api',
        p_pattern        => 'list',
        p_method         => 'GET',
        p_source_type    => ORDS.source_type_collection_feed,
        p_source         => 'SELECT order_id, customer_id, order_date, total_amount, status
                             FROM   orders
                             WHERE  (:status IS NULL OR status = :status)
                             ORDER  BY order_date DESC',
        p_items_per_page => 50,
        p_comments       => 'List orders with optional status filter'
    );

    -- GET /ords/appschema/orders/:id — single order by ID
    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'orders.api',
        p_pattern     => ':id'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'orders.api',
        p_pattern     => ':id',
        p_method      => 'GET',
        p_source_type => ORDS.source_type_collection_item,
        p_source      => 'SELECT * FROM orders WHERE order_id = :id'
    );

    -- POST /ords/appschema/orders/create — create a new order
    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'orders.api',
        p_pattern     => 'create'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'orders.api',
        p_pattern     => 'create',
        p_method      => 'POST',
        p_source_type => ORDS.source_type_plsql,
        p_source      => '
            DECLARE
                v_id NUMBER;
            BEGIN
                INSERT INTO orders (customer_id, order_date, total_amount, status)
                VALUES (:customer_id, SYSDATE, :total_amount, ''NEW'')
                RETURNING order_id INTO v_id;
                :status_code := 201;
                :forward_location := ''/orders/'' || v_id;
            END;'
    );

    COMMIT;
END;
/
```

### Auto-REST on a Table

```sql
-- Enable automatic REST endpoints for a table (GET, POST, PUT, DELETE)
BEGIN
    ORDS.ENABLE_OBJECT(
        p_enabled         => TRUE,
        p_schema          => 'APPSCHEMA',
        p_object          => 'ORDERS',
        p_object_type     => 'TABLE',
        p_object_alias    => 'orders',
        p_auto_rest_auth  => FALSE
    );
    COMMIT;
END;
/
-- Endpoints become available at:
-- GET    /ords/appschema/orders/        (collection)
-- GET    /ords/appschema/orders/{id}    (single item)
-- POST   /ords/appschema/orders/        (insert)
-- PUT    /ords/appschema/orders/{id}    (update)
-- DELETE /ords/appschema/orders/{id}    (delete)
```

---

## APEX and JSON / REST Integration

### Consuming External REST APIs from APEX

APEX can call external REST services directly from page processes or PL/SQL using `APEX_WEB_SERVICE`:

```sql
-- Call an external REST API and parse the JSON response
DECLARE
    v_response CLOB;
    v_json     JSON_OBJECT_T;
    v_name     VARCHAR2(100);
BEGIN
    -- Make HTTP GET request
    v_response := APEX_WEB_SERVICE.MAKE_REST_REQUEST(
        p_url         => 'https://api.example.com/customers/' || :P5_CUSTOMER_ID,
        p_http_method => 'GET',
        p_credential_static_id => 'EXAMPLE_API_CRED'  -- stored in APEX > Web Credentials
    );

    -- Parse JSON response
    v_json := JSON_OBJECT_T.PARSE(v_response);
    v_name := v_json.get_string('customer_name');

    APEX_UTIL.SET_SESSION_STATE('P5_CUSTOMER_NAME', v_name);
EXCEPTION
    WHEN OTHERS THEN
        APEX_ERROR.ADD_ERROR(
            p_message => 'Failed to fetch customer data: ' || SQLERRM,
            p_display_location => APEX_ERROR.C_INLINE_IN_NOTIFICATION
        );
END;
```

### Using JSON in Reports

```sql
-- Interactive report showing JSON data from a column
SELECT order_id,
       order_date,
       JSON_VALUE(order_metadata, '$.shipping.carrier')   AS carrier,
       JSON_VALUE(order_metadata, '$.shipping.tracking')  AS tracking_number,
       JSON_QUERY(order_metadata, '$.items' WITH WRAPPER) AS items_json
FROM   orders
WHERE  order_metadata IS NOT NULL;
```

---

## Deploying APEX Applications

### Export and Import

APEX applications are exported from App Builder as SQL files and imported on the target instance:

```sql
-- Export via APEX command-line tool (APEXExport)
-- java oracle.apex.APEXExport -db host:port:service -user APEX_USER -password pwd -applicationid 100

-- Import via SQL*Plus or SQLcl
-- sqlplus appschema/password@target_db @f100.sql

-- Import via APEX Admin UI: App Builder > Import > Upload the .sql file
```

### Supporting Objects

Applications can define **supporting objects** — DDL scripts (CREATE TABLE, CREATE SEQUENCE, etc.) that are executed automatically when the application is installed on a new database. This makes an APEX application fully self-contained for deployment.

Managed in: App Builder > Application > Supporting Objects > Installation Scripts.

### SQLcl for Scripted Deployment

```bash
# Export all APEX apps in a workspace using SQLcl
sql ADMIN/password@//db-host:1521/ORCL
SQL> apex export -workspaceid 1234567890

# Import an application
sql APEX_USER/password@//db-host:1521/ORCL
SQL> @/path/to/f100.sql
```

### APEX Version Management in CI/CD

```yaml
# Example GitHub Actions step for APEX deployment
- name: Deploy APEX Application
  run: |
    echo "CONNECT APEX_DEPLOY/\${{ secrets.APEX_DEPLOY_PWD }}@//\$HOST:1521/\$SERVICE" > deploy.sql
    echo "@apex_apps/f${APP_ID}.sql" >> deploy.sql
    java -jar sqlcl/lib/sqlcl.jar /nolog @deploy.sql
```

---

## Best Practices

- **Never use `SELECT *` in APEX report queries.** APEX Interactive Reports and Grids serialize column order from the query; a table column addition or reorder breaks the saved report layout.
- **Use bind variables for all user input in SQL.** APEX processes bind `P_ITEM` session state values as proper bind variables (`:P1_SEARCH`), preventing SQL injection. Never concatenate page items into SQL strings.
- **Isolate application schema privileges.** The parsing schema should own only application tables and have EXECUTE rights on necessary packages. Never use SYS or SYSTEM as the parsing schema.
- **Use APEX Authorization Schemes to protect every page and component.** Rely on server-side authorization, not client-side hiding alone. A hidden button can be invoked directly if server-side authorization is absent.
- **Set session timeouts appropriately.** APEX session state is stored in the database. Long-lived idle sessions consume tablespace in `APEX_xxxxxx.WWV_FLOW_SESSIONS$`. Set `p_max_session_idle_sec` in the authentication scheme.
- **Export and version-control APEX applications after every significant change.** The application export is the source of truth. Store exports in Git alongside your database schema scripts.
- **Use APEX_DEBUG to diagnose slow pages.** Enable debug mode from the URL (`?p=100:1&debug=YES`) to see query execution times and PL/SQL durations for every page component.

```sql
-- Query APEX debug log for performance analysis
SELECT elapsed_time,
       message_timestamp,
       message
FROM   apex_debug_messages
WHERE  application_id = 100
  AND  page_id        = 5
  AND  session_id     = :APP_SESSION
ORDER  BY message_timestamp
FETCH FIRST 100 ROWS ONLY;
```

---

## Common Mistakes and How to Avoid Them

**Mistake 1: Storing sensitive data in session state items**
APEX session state is stored in the database, but items marked as `Persistent` survive browser sessions and can be inspected by developers with database access. Never store passwords, PII, or tokens in standard page items. Use `APEX_UTIL.SET_SESSION_STATE` with item type `Hidden – Protected` for sensitive transient values, and prefer passing sensitive data through PL/SQL local variables rather than session state when possible.

**Mistake 2: Using shared APEX_PUBLIC_USER credentials without network encryption**
By default, ORDS communicates with the database using APEX_PUBLIC_USER. This connection should use Oracle Net encryption (TLS or AES) in production. Configure `sqlnet.ora` / ORDS connection pool with `javax.net.ssl.*` properties appropriately.

**Mistake 3: Not handling APEX error conditions in PL/SQL processes**
A bare PL/SQL process block with unhandled exceptions shows the raw Oracle error message to the end user. Use `APEX_ERROR.ADD_ERROR` to produce user-friendly messages and always include an `EXCEPTION WHEN OTHERS` block.

```sql
-- Proper error handling in an APEX PL/SQL process
BEGIN
    order_pkg.submit_order(
        p_order_id   => :P5_ORDER_ID,
        p_notes      => :P5_NOTES
    );
EXCEPTION
    WHEN order_pkg.ex_order_locked THEN
        APEX_ERROR.ADD_ERROR(
            p_message          => 'This order is currently being processed by another user.',
            p_display_location => APEX_ERROR.C_INLINE_IN_NOTIFICATION
        );
    WHEN OTHERS THEN
        APEX_ERROR.ADD_ERROR(
            p_message          => 'Unexpected error: ' || SQLERRM,
            p_display_location => APEX_ERROR.C_INLINE_IN_NOTIFICATION
        );
END;
```

**Mistake 4: Deploying APEX to production on the same ORDS instance used for development**
A misbehaving APEX developer can crash or starve the shared ORDS JVM. Use separate ORDS instances for development and production, each with its own connection pool configuration and resource limits.

**Mistake 5: Not setting up proper ORDS connection pool sizing**
ORDS uses a JDBC connection pool. The default pool size is often too small for production workloads or too large for shared development environments. Tune `db.connectionPoolMaxStatements`, `db.pool.maxSize`, and `db.pool.minSize` in the ORDS configuration.

**Mistake 6: Assuming APEX auto-REST is production-ready without authentication**
Auto-REST with `p_auto_rest_auth => FALSE` makes all CRUD operations publicly accessible. In production, always require OAuth2 tokens or custom privilege checks on REST endpoints, and audit REST handler access via ORDS access logging.

---

## Sources

- [Oracle APEX Documentation](https://docs.oracle.com/en/database/oracle/apex/)
- [Oracle APEX Application Builder User's Guide](https://docs.oracle.com/en/database/oracle/apex/24.1/htmdb/index.html)
- [Oracle REST Data Services Installation and Configuration Guide](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/)
- [APEX_INSTANCE_ADMIN Package Reference](https://docs.oracle.com/en/database/oracle/apex/24.1/aeapi/APEX_INSTANCE_ADMIN.html)
- [APEX_WEB_SERVICE Package Reference](https://docs.oracle.com/en/database/oracle/apex/24.1/aeapi/APEX_WEB_SERVICE.html)
