# ORDS Architecture: Components, Request Flow, and Deployment Models

## Overview

Oracle REST Data Services (ORDS) is a Java EE application that acts as a bridge between HTTP clients and Oracle Database. It translates REST API calls into database operations, manages connection pooling, handles authentication and authorization, and returns results as JSON or other formats. ORDS supports a wide range of use cases: AutoREST on tables and views, custom PL/SQL-backed REST APIs, Oracle APEX hosting, Database Actions (SQL Developer Web), and Oracle Graph/Spatial REST interfaces.

Understanding ORDS architecture is essential for designing reliable, scalable REST APIs on Oracle Database — choosing the right deployment model, correctly sizing connection pools, understanding URL routing, and maintaining compatibility across Oracle DB and ORDS versions.

---

## Core Components

### 1. ORDS Application Layer

ORDS is packaged as a WAR (Web Application Archive) file deployed into a Java servlet container. Its internal components include:

- **Request Router**: Parses incoming HTTP requests, matches them against registered URL patterns, and dispatches to the correct handler.
- **Module/Template/Handler Registry**: In-memory representation of all REST modules loaded from the database metadata schema. Refreshed on a configurable interval.
- **Connection Pool Manager**: Manages one or more database connection pools (UCP) per configured database pool.
- **Authentication Filter**: Intercepts protected endpoints, validates Bearer tokens or basic auth credentials, and enforces privilege checks.
- **Result Serializer**: Converts database query results (cursor rows, PL/SQL OUT parameters, BLOBs) to JSON, XML, or binary output.

### 2. ORDS Metadata Schema

ORDS stores all REST API definitions inside the Oracle Database itself, in two key schemas:

**ORDS_METADATA** (installed by ORDS)
- Contains tables defining REST modules, URL templates, handlers, privileges, and OAuth clients.
- Key tables: `ORDS_METADATA.ORDS_MODULES`, `ORDS_METADATA.ORDS_TEMPLATES`, `ORDS_METADATA.ORDS_HANDLERS`, `ORDS_METADATA.ORDS_PRIVILEGES`.
- ORDS reads this schema at startup and on refresh intervals to build its in-memory routing table.

**ORDS_PUBLIC_USER** (database user)
- The low-privilege database user ORDS uses for routing decisions and AutoREST metadata lookups.
- Does NOT execute actual REST handler SQL. The handler SQL runs as the schema owner or as the user mapped by the authentication context.
- Must have `CREATE SESSION` privilege and grants from ORDS_METADATA.

### 3. Database Connection Pools

ORDS uses **Universal Connection Pool (UCP)** — Oracle's JDBC connection pool. Each database pool in the ORDS configuration gets its own UCP instance. Pool parameters control:

- Minimum/maximum pool size
- Connection timeout and validation
- Statement cache size

```shell
# Pool settings are configured via the ORDS CLI — no hand-edited config files
ords config set db.hostname mydb.example.com
ords config set db.port 1521
ords config set db.servicename mypdb.example.com
ords config set db.username ORDS_PUBLIC_USER
# Passwords go into the Oracle Wallet, never into a config file:
ords config secret set db.password --password-stdin <<< "..."
ords config set feature.sdw true
```

### 4. ORDS Schema Objects per REST-Enabled Schema

When a schema is REST-enabled (`ORDS.ENABLE_SCHEMA`), the following metadata is created in ORDS_METADATA:
- A schema record linking the schema's alias to its DB username
- Module, template, and handler records for any explicitly defined REST APIs
- AutoREST metadata for enabled objects (tables, views, procedures)

---

## Request Flow

Understanding the request lifecycle helps with troubleshooting and performance tuning.

```
HTTP Client
    │
    ▼
[Load Balancer / Reverse Proxy] (optional)
    │
    ▼
[ORDS Servlet Container] ─── HTTPS termination (or pass-through)
    │
    ├─ 1. URL Parsing & Routing
    │      Match URL against module/template patterns in memory
    │
    ├─ 2. Authentication Filter
    │      Check if endpoint is protected
    │      Validate OAuth Bearer token OR Basic Auth
    │      Resolve privileges/roles
    │
    ├─ 3. Connection Acquisition
    │      Get a JDBC connection from UCP for the target pool
    │
    ├─ 4. Handler Execution
    │      Execute SQL query / PL/SQL block with bound parameters
    │      Implicit parameters injected (:body, :body_text, etc.)
    │
    ├─ 5. Result Serialization
    │      Cursor rows → JSON array of objects
    │      BLOB → binary stream with Content-Type header
    │      PL/SQL OUT params → JSON object
    │
    └─ 6. Response
           HTTP status, headers, body returned to client
```

A typical REST handler execution:
1. ORDS receives `GET /ords/hr/employees/101`
2. Router matches this to module `hr`, template `employees/:id`, handler `GET`
3. Authentication check (if privilege attached) validates Bearer token
4. ORDS acquires a DB connection from the `default` UCP pool
5. Executes `SELECT * FROM employees WHERE employee_id = :id` with `:id = 101`
6. Serializes the result row as a JSON object
7. Returns `200 OK` with JSON body

---

## URL Routing and Module/Template/Handler Hierarchy

ORDS REST APIs are organized in a three-level hierarchy:

```
Module (base path)
  └── Template (relative URL pattern)
        └── Handler (HTTP method + SQL/PL/SQL)
```

### Module

A module is the top-level container. It defines a base path and is associated with one schema.

```
Base URL: /ords/{schema_alias}/{module_base_path}/
Example:  /ords/hr/api/v1/
```

### Template

A template defines a URL pattern relative to the module base path. Templates support **URI parameters** using `:param` syntax.

```
Template: employees/
Template: employees/:id
Template: departments/:dept_id/employees
```

### Handler

A handler is the actual SQL or PL/SQL executed for a given HTTP method on a template.

```
GET  employees/        → SELECT query returning collection
GET  employees/:id     → SELECT query returning single row
POST employees/        → INSERT via PL/SQL
PUT  employees/:id     → UPDATE via PL/SQL
DELETE employees/:id   → DELETE via PL/SQL
```

### Full URL Construction

```
https://host:port/ords/{schema_alias}/{module_uri_prefix}/{template_uri}
                   │         │                │                  │
                   │    hr (schema)      api/v1/         employees/:id
                   │
               fixed ORDS prefix
```

Result: `https://host:8443/ords/hr/api/v1/employees/101`

---

## Deployment Models

### 1. Standalone (Jetty) — Development and Production

ORDS ships with an embedded Eclipse Jetty server. No external application server is required.

```shell
# Start ORDS standalone
ords --config /opt/oracle/ords/config serve \
  --port 8080 \
  --secure-port 8443 \
  --certificate-hostname myserver.example.com
```

**Pros**: Simple, low overhead, easy to automate, officially supported for production.
**Cons**: Single JVM process; for very high availability, run multiple instances behind a load balancer.

### 2. Apache Tomcat

Deploy the ORDS WAR file into Tomcat's `webapps/` directory.

```shell
cp /opt/oracle/ords/ords.war $CATALINA_HOME/webapps/ords.war
# Set ORDS config dir via environment variable
export ORDS_CONFIG=/opt/oracle/ords/config
```

Tomcat handles threading, SSL/TLS (via connectors), and JVM management.

**Pros**: Familiar to Java operations teams; integrates with Tomcat monitoring tools.
**Cons**: Requires Tomcat administration expertise; WAR redeployment needed on ORDS upgrades.

### 3. Oracle WebLogic Server

Deploy ORDS WAR into a WebLogic managed server or cluster. Used in enterprise environments already running WebLogic.

**Pros**: Enterprise clustering, WebLogic monitoring, Oracle support bundling.
**Cons**: Significant operational overhead; overkill for most ORDS deployments.

### 4. Oracle Cloud Infrastructure (OCI)

#### ORDS on Autonomous Database (ADB)

ADB (ATP/ADW) includes ORDS pre-installed and pre-configured. There is nothing to install.

- ORDS is accessed via the ADB-specific ORDS URL shown in OCI Console.
- Uses mTLS wallet for internal connections (no manual pool configuration needed).
- ORDS metadata is stored in the same ADB instance.
- Oracle manages ORDS version upgrades.

```
https://<unique-id>.adb.<region>.oraclecloudapps.com/ords/
```

#### ORDS on OCI Compute / Container Instances

ORDS can be deployed on OCI Compute VMs or as containers in OCI Container Instances / OKE (Kubernetes). Use Oracle's official ORDS container image from Oracle Container Registry:

```shell
docker pull container-registry.oracle.com/database/ords:latest

docker run -d \
  --name ords \
  -p 8080:8080 \
  -e ORACLE_HOST=mydb.example.com \
  -e ORACLE_PORT=1521 \
  -e ORACLE_SERVICE=mypdb.example.com \
  -v /opt/ords/config:/opt/oracle/ords/config \
  container-registry.oracle.com/database/ords:latest
```

---

## ORDS in Autonomous Database (ADB)

ADB provides a fully managed ORDS deployment. Key differences from self-managed ORDS:

| Feature | Self-Managed ORDS | ADB ORDS |
|---|---|---|
| Installation | Manual | Pre-installed |
| Connection pool | Configured manually | Auto-configured |
| TLS | Manual cert management | Oracle-managed |
| Version upgrades | Manual | Oracle-managed |
| Schema URLs | `/ords/{alias}/` | `/ords/{alias}/` (same) |
| Database Actions | Optional | Included |
| Custom pool params | Full control | Limited via DB params |

In ADB, REST-enable schemas and define REST APIs the same way as in self-managed ORDS — via `ORDS.ENABLE_SCHEMA`, `ORDS.DEFINE_MODULE`, etc. The SQL is identical.

---

## Version Compatibility

ORDS follows a separate release cadence from Oracle Database. General rules:

- ORDS is **forward compatible**: A newer ORDS version works with older database versions.
- ORDS minimum database requirement: Oracle Database 11.2.0.4 (12c recommended).
- ORDS for ADB always runs the latest validated ORDS version.
- ORDS 22.x and later use the `ords` CLI (replacing the older `java -jar ords.war` commands).
- ORDS 23.x introduced enhanced JWT/OAuth2 features and improved OpenAPI 3.0 support.

```
Recommended compatibility matrix:
Oracle DB 19c / 21c / 23ai → ORDS 22.x, 23.x, 24.x (latest recommended)
Oracle DB 12.2              → ORDS 21.x or later
Oracle DB 12.1              → ORDS 19.x or later (limited features)
```

Always check the [ORDS Release Notes](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/) for the specific version matrix before upgrading.

---

## Best Practices

- **Deploy ORDS close to the database**: High latency between ORDS and the DB degrades performance. Use the same data center / VCN.
- **Run multiple ORDS instances behind a load balancer** for production high availability. ORDS is stateless — any instance can serve any request.
- **Use a dedicated ORDS server separate from the DB server**: ORDS under load consumes significant CPU and memory in the JVM.
- **Keep ORDS updated**: Security patches and performance improvements are released frequently. ORDS 22+ supports in-place upgrades with a single command.
- **Tune UCP pool size** based on DB connection limits and expected concurrency. Default pool max (10) is too small for production.
- **Use ORDS_PUBLIC_USER with minimum privileges**: Never use a DBA account as the ORDS connection user.
- **Monitor the ORDS log**: Enable request logging and review slow request logs to identify performance bottlenecks.

## Common Mistakes

- **Using the SYS or SYSTEM account as the ORDS connection pool user**: This is a major security risk. Always use a dedicated, low-privilege user.
- **Forgetting to refresh ORDS after metadata changes**: When REST API definitions are changed directly in ORDS_METADATA tables (e.g., via SQL), ORDS needs to refresh its in-memory cache. Use `ORDS.DEFINE_*` APIs which trigger refresh automatically, or restart ORDS.
- **Conflating schema alias with schema name**: The schema alias in the URL (e.g., `/ords/hr/`) is set when enabling the schema and can differ from the database username. Mismatches cause 404 errors.
- **Assuming ORDS and APEX require the same version**: ORDS and APEX have independent version dependencies. Check APEX release notes for required ORDS minimum version.
- **Not configuring HTTPS**: ORDS defaults to HTTP in standalone mode. Always configure HTTPS for any non-development deployment.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle REST Data Services Documentation](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/)
- [ORDS Developer's Guide — Architecture Overview](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/index.html)
- [ORDS Release Notes](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/)
