# ORDS Monitoring, Performance Tuning, and Troubleshooting

## Overview

Effective ORDS operations require visibility into request patterns, connection pool health, slow queries, and error rates. ORDS provides log files, status endpoints, and database views for monitoring. This guide covers log file interpretation, connection pool monitoring, performance tuning parameters, diagnosing common error patterns, and setting up health checks for load balancers and uptime monitors.

---

## ORDS Log File Locations and Configuration

### Log Directory

By default, ORDS writes logs to a `logs/` directory inside the ORDS config directory:

```
/opt/oracle/ords/config/
└── logs/
    ├── ords/
    │   ├── ords_log_2024-01-15.log     # Main application log
    │   ├── ords_log_2024-01-15.log.1   # Rolled-over log
    │   └── ...
    └── ...
```

Configure a custom log path:

```shell
ords --config /opt/oracle/ords/config config set log.dir /var/log/ords
```

Or specify at startup:

```shell
ords --config /opt/oracle/ords/config serve \
  --log-folder /var/log/ords
```

### Log Levels

ORDS uses Java Logging (JUL) with configurable levels:

```shell
# Set global log level
ords --config /opt/oracle/ords/config config set log.level INFO

# Available levels: FINEST, FINER, FINE, CONFIG, INFO, WARNING, SEVERE
# FINE = debug level, shows individual SQL executions
# INFO = normal operations
# WARNING = recoverable errors
# SEVERE = critical errors
```

For production: `INFO` level. For troubleshooting: `FINE` or `FINER`.

---

## Enabling Request Logging

Request logging records each HTTP request with URL, method, status code, response time, and client info.

```shell
# Configure external error path via the ORDS CLI
ords --config /opt/oracle/ords/config config set error.externalPath /var/log/ords/errors
```

Configure request logging via the ORDS CLI:

```shell
# Enable access/request log
ords --config /opt/oracle/ords/config config set log.logging.requestlog true

# Log format (combined = Apache combined log format)
ords --config /opt/oracle/ords/config config set log.logging.requestlog.format combined

# Log requests slower than 5000ms as "slow"
ords --config /opt/oracle/ords/config config set log.logging.requestlog.slow 5000
```

### Sample Request Log Entry

```
2024-01-15 14:23:05.123 [INFO] [worker-5] oracle.dbtools.http.ords.RequestLog
  method=GET path=/ords/hr/v1/employees/ status=200
  elapsed=145ms rows=25 pool=default user=reporting-svc
  remote=10.0.1.42 userAgent=MyApp/1.0
```

Fields:
- `elapsed`: Total handler execution time in milliseconds
- `rows`: Number of result rows returned
- `pool`: Connection pool name used
- `user`: Authenticated username (or `oracle` for public requests)

---

## Interpreting the ORDS Log

### Startup Messages

```
2024-01-15 09:00:01.001 INFO  Starting Oracle REST Data Services version 24.1.0
2024-01-15 09:00:01.145 INFO  Configuration directory: /opt/oracle/ords/config
2024-01-15 09:00:02.300 INFO  Pool: default - initialized, 5 connections
2024-01-15 09:00:02.410 INFO  Listening on port 8080 (HTTP)
2024-01-15 09:00:02.412 INFO  Listening on port 8443 (HTTPS)
```

### Connection Pool Messages

```
# Pool growing (normal under load)
2024-01-15 14:25:01.000 INFO  Pool: default - growing pool, connections=8/30

# Pool exhausted (warning: all connections in use)
2024-01-15 14:25:30.000 WARNING Pool: default - pool exhausted, waiting for connection
  waitTime=2341ms maxWait=60000ms

# Connection validation failure (DB unreachable or connection stale)
2024-01-15 14:30:00.000 WARNING Pool: default - connection validation failed
  ORA-03114: not connected to ORACLE
```

### Authentication Errors

```
# Invalid or expired token
2024-01-15 15:00:01.000 INFO  Authentication failed: invalid_token
  path=/ords/hr/v1/employees/ realm=hr

# Missing token on protected endpoint
2024-01-15 15:00:02.000 INFO  Authorization required: hr.employees.read
  path=/ords/hr/v1/employees/ client=10.0.1.42
```

### SQL Execution Errors

```
# ORA-00942: table or view does not exist
2024-01-15 16:00:01.000 SEVERE SQL execution failed
  path=/ords/hr/v1/employees/ method=GET pool=default
  ORA-00942: table or view does not exist

# ORA-01403: no data found (from collection_item)
2024-01-15 16:00:05.000 INFO  Resource not found
  path=/ords/hr/v1/employees/999 → HTTP 404
```

---

## Slow Request Logs

ORDS logs requests exceeding the slow threshold with additional detail:

```
2024-01-15 14:50:00.000 WARNING Slow request detected
  method=GET path=/ords/hr/v1/reports/annual-summary
  elapsed=12450ms threshold=5000ms pool=default
  sql="SELECT ... FROM orders o JOIN ..."
```

To investigate slow requests:
1. Copy the SQL from the log
2. Run it with `EXPLAIN PLAN` in SQL Developer or SQLcl
3. Look for full table scans, missing indexes, or Cartesian joins
4. Add bind variable values from the URL to reproduce exactly

---

## Connection Pool Monitoring via ORDS Status Endpoint

### ORDS Status and Health Endpoint

```http
GET /ords/_/db-api/stable/database/ HTTP/1.1
Authorization: Bearer <admin-token>
```

Returns:

```json
{
  "items": [
    {
      "poolName": "default",
      "status": "UP",
      "connections": {
        "opened": 12,
        "available": 8,
        "busy": 4,
        "max": 30
      },
      "statistics": {
        "requestsServed": 14523,
        "avgResponseTime": 87
      }
    }
  ]
}
```

### Monitoring Pool via Database Views

```sql
-- Check ORDS connection activity via V$ views (DBA access required)
SELECT s.username, s.status, s.program, s.machine,
       s.sql_id, COUNT(*) AS connection_count
FROM   v$session s
WHERE  s.username = 'ORDS_PUBLIC_USER'
   OR  s.program LIKE '%ORDS%'
GROUP  BY s.username, s.status, s.program, s.machine, s.sql_id
ORDER  BY connection_count DESC;

-- See active SQL from ORDS connections
SELECT s.sid, s.username, s.status,
       sq.sql_text, sq.elapsed_time/1000000 AS elapsed_sec
FROM   v$session s
JOIN   v$sql sq ON sq.sql_id = s.sql_id
WHERE  s.username IN ('ORDS_PUBLIC_USER', 'HR')
AND    s.status = 'ACTIVE'
ORDER  BY elapsed_sec DESC;
```

---

## DBA_ORDS_* Views for Installed Modules

```sql
-- View all REST-enabled schemas
SELECT schema, url_mapping_pattern, auto_rest_auth, enabled
FROM   dba_ords_enabled_schemas
ORDER  BY schema;

-- Count handlers per schema
SELECT s.schema,
       COUNT(DISTINCT m.id) AS module_count,
       COUNT(DISTINCT t.id) AS template_count,
       COUNT(h.id)          AS handler_count
FROM   dba_ords_enabled_schemas s
LEFT JOIN dba_ords_modules   m ON m.schema = s.schema
LEFT JOIN dba_ords_templates t ON t.module_id = m.id
LEFT JOIN dba_ords_handlers  h ON h.template_id = t.id
GROUP  BY s.schema
ORDER  BY s.schema;

-- Find all POST handlers (likely write operations to audit)
SELECT s.schema, m.name AS module, t.uri_template,
       h.method, h.source_type,
       SUBSTR(h.source, 1, 200) AS source_preview
FROM   dba_ords_enabled_schemas s
JOIN   dba_ords_modules         m ON m.schema = s.schema
JOIN   dba_ords_templates       t ON t.module_id = m.id
JOIN   dba_ords_handlers        h ON h.template_id = t.id
WHERE  h.method IN ('POST', 'PUT', 'DELETE')
ORDER  BY s.schema, m.name, t.uri_template;

-- User-scope views (current schema only)
SELECT m.name, t.uri_template, h.method, h.source_type
FROM   user_ords_modules   m
JOIN   user_ords_templates t ON t.module_id = m.id
JOIN   user_ords_handlers  h ON h.template_id = t.id
ORDER  BY m.name, t.uri_template, h.method;

-- Check AutoREST-enabled objects
SELECT object_name, object_type, object_alias,
       auto_rest_auth, enabled
FROM   user_ords_enabled_objects
ORDER  BY object_type, object_name;

-- View OAuth clients and their privileges
SELECT c.name, c.grant_type, c.status,
       cp.privilege_name
FROM   user_ords_clients   c
JOIN   user_ords_client_privileges cp ON cp.client_id = c.client_id
ORDER  BY c.name;
```

---

## Performance Tuning

### Connection Pool Size

The most impactful tuning parameter. Tune based on:
- DB max sessions: `SELECT value FROM v$parameter WHERE name = 'sessions'`
- Expected concurrent ORDS requests
- DB CPU cores (don't exceed DB CPU * 10 for pool size)

```shell
# Check current pool limits
ords --config /opt/oracle/ords/config config list | grep jdbc

# Recommended starting values for production
ords --config /opt/oracle/ords/config config set jdbc.InitialLimit 10
ords --config /opt/oracle/ords/config config set jdbc.MinLimit 10
ords --config /opt/oracle/ords/config config set jdbc.MaxLimit 50
```

### Statement Cache

Caches parsed cursors per connection. Higher values reduce soft parse overhead for repeated queries.

```shell
ords --config /opt/oracle/ords/config config set jdbc.MaxStatementsLimit 10
# Increase to 20-50 for APIs with many repeated queries
```

### ORDS JVM Memory Tuning

```shell
# /etc/systemd/system/ords.service
[Service]
Environment="JAVA_OPTS=-Xms512m -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

- `-Xms512m`: Initial heap (set to avoid initial GC pauses)
- `-Xmx2g`: Maximum heap (2-4GB typical for busy ORDS instances)
- `-XX:+UseG1GC`: G1 garbage collector (low-pause, good for server apps)

### Request Thread Pool

```shell
# Increase HTTP request threads for high-concurrency (Jetty standalone)
ords --config /opt/oracle/ords/config config set standalone.threadPoolMax 200
```

### Pagination Default

Reduce default page size to lower average response time and DB load:

```shell
# Default is 25 rows; reduce for mobile/API clients
ords --config /opt/oracle/ords/config config set misc.pagination.defaultLimit 10
ords --config /opt/oracle/ords/config config set misc.pagination.maxRows 500
```

---

## Health Check Endpoint

Use ORDS's built-in health endpoint for load balancer health checks:

```http
GET /ords/ HTTP/1.1
Host: myserver.example.com
```

Returns `200 OK` when ORDS is running. Use this as the health check path in:

- AWS ALB: Target group health check path `/ords/`
- OCI Load Balancer: Backend set health checker URL `/ords/`
- Nginx upstream health check: `check interval=3000 rise=2 fall=3 timeout=2000 type=http; check_http_send "GET /ords/ HTTP/1.0\r\n\r\n"; check_http_expect_alive http_2xx;`
- Kubernetes liveness probe:

```yaml
livenessProbe:
  httpGet:
    path: /ords/
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 30
  failureThreshold: 3
```

### DB-Level Health Check

For a deeper health check that validates DB connectivity:

```http
GET /ords/_/db-api/stable/database/ HTTP/1.1
Authorization: Bearer <health-check-token>
```

Returns connection pool status. A 200 response confirms ORDS + DB connectivity.

---

## Common Error Codes and Diagnosis

### HTTP 401 Unauthorized

Cause: Missing, invalid, or expired Bearer token.

```
WWW-Authenticate: Bearer realm="hr",error="invalid_token",
  error_description="The access token expired"
```

Diagnosis:
- Check token expiry: default is 1 hour
- Verify token endpoint URL matches schema: `/ords/{schema}/oauth/token`
- Check client privilege assignment: `SELECT * FROM user_ords_client_privileges`

### HTTP 403 Forbidden

Cause: Valid token but insufficient privilege or role.

Diagnosis:
```sql
-- Check what privileges the client has
SELECT cp.privilege_name, cr.role_name
FROM   user_ords_client_privileges cp
JOIN   user_ords_clients c ON c.client_id = cp.client_id
LEFT JOIN user_ords_client_roles cr ON cr.client_id = c.client_id
WHERE  c.name = 'my-client';

-- Check what roles the privilege requires
SELECT privilege_name, role_name
FROM   user_ords_privilege_roles
WHERE  privilege_name = 'hr.employees.read';
```

### HTTP 404 Not Found

Causes:
1. Schema not REST-enabled
2. Module not published (`status = NOT_PUBLISHED`)
3. URL typo (check schema alias, module path, template pattern)
4. Wrong HTTP method for template

Diagnosis:
```sql
-- Verify schema alias
SELECT schema, url_mapping_pattern, enabled
FROM   dba_ords_enabled_schemas WHERE schema = 'HR';

-- Verify module
SELECT name, uri_prefix, status FROM user_ords_modules;

-- Verify template
SELECT uri_template FROM user_ords_templates t
JOIN user_ords_modules m ON m.id = t.module_id
WHERE m.name = 'hr.employees';
```

### HTTP 500 Internal Server Error

Cause: Unhandled exception in handler SQL/PL/SQL, or DB error.

Diagnosis: Check ORDS log for the full ORA- error:

```
2024-01-15 16:30:00.000 SEVERE Handler error
  path=/ords/hr/v1/employees/ method=POST pool=default
  ORA-00001: unique constraint (HR.UK_EMP_EMAIL) violated
```

Common ORA- errors in ORDS context:

| ORA Error | Cause | Action |
|---|---|---|
| ORA-00942 | Table not found (ORDS_PUBLIC_USER lacks access) | Grant SELECT to ORDS_PUBLIC_USER or the executing schema |
| ORA-01403 | No data found in `collection_item` handler | Expected; returns HTTP 404 automatically |
| ORA-01400 | NOT NULL constraint violation | Validate required fields in handler |
| ORA-00001 | Unique constraint violation | Return HTTP 409 Conflict in exception handler |
| ORA-03114 | Not connected to Oracle | DB down or connection stale; ORDS will reconnect |
| ORA-12514 | TNS listener cannot find service | Wrong service name in pool config |
| ORA-28000 | Account locked (ORDS_PUBLIC_USER) | Unlock the account in DB: `ALTER USER ORDS_PUBLIC_USER ACCOUNT UNLOCK` |

### HTTP 503 Service Unavailable

Cause: Connection pool exhausted; all connections busy.

```
2024-01-15 17:00:00.000 SEVERE Pool exhausted
  pool=default busy=30 max=30 wait=60001ms
```

Actions:
1. Increase `jdbc.MaxLimit` (if DB can handle more connections)
2. Investigate slow queries holding connections
3. Add ORDS instances behind a load balancer
4. Implement query timeout: `ords --config ... config set jdbc.statementTimeout 30`

---

## ORDS Validation Tool

Run ORDS self-diagnostics to check configuration before starting:

```shell
ords --config /opt/oracle/ords/config validate
```

Output:

```
INFO  ORDS validation starting
INFO  Validating pool 'default' connectivity...
INFO  Pool 'default': connected successfully (Oracle Database 19c)
INFO  ORDS schema version: 24.1.0 (matches binary version)
INFO  Validation complete: 0 errors, 0 warnings
```

Common validation failures:
- `Pool 'default': connection failed` — Wrong hostname, port, or credentials
- `ORDS schema version 21.4 does not match binary 24.1` — Run `ords install` to upgrade schema
- `WARNING: feature.sdw enabled but APEX not detected` — Database Actions requires APEX

---

## Best Practices

- **Set up log rotation**: ORDS log files grow continuously. Configure logrotate or use the built-in rotation settings (`log.maxFileSize`, `log.maxBackupIndex`).
- **Centralize logs in production**: Ship ORDS logs to a centralized log management system (ELK Stack, OCI Logging, Splunk). Query for error patterns across multiple ORDS instances.
- **Alert on pool exhaustion**: Pool exhaustion (`503 errors`) indicates capacity problems. Alert when connection wait time exceeds 1 second.
- **Monitor DB connection count alongside ORDS**: View `v$session` counts to correlate ORDS pool utilization with DB session usage.
- **Use the `/ords/` health endpoint, not application endpoints**: Health checks should use the lightweight ORDS root endpoint, not actual REST APIs that execute DB queries.
- **Track slow request trends over time**: A gradual increase in slow requests often precedes complete outages. Set up a dashboard tracking P95/P99 response times.
- **Run `ords validate` after every configuration change**: Catch pool connectivity issues before traffic hits the instance.

## Common Mistakes

- **Not checking ORDS logs when debugging 404s**: Developers often debug 404 errors by checking the URL and schema configuration in the DB, but miss the definitive error message in the ORDS log.
- **Ignoring pool exhaustion warnings**: `WARNING Pool: waiting for connection` is often treated as a normal event. It is a leading indicator of capacity problems requiring immediate attention.
- **Setting `jdbc.MaxLimit` higher than DB `sessions` parameter**: ORDS will successfully open connections up to the DB limit, then connections fail. `jdbc.MaxLimit` should be 20-30% below the DB `sessions` limit.
- **Running with FINE log level in production**: DEBUG/FINE level logging can produce hundreds of MB of log per hour under load, filling disks and impacting performance.
- **Not monitoring for ORA-28000 (account locked)**: If ORDS_PUBLIC_USER exceeds failed login attempts (e.g., due to a password rotation not applied to ORDS), the account locks and all ORDS requests fail with 503.
- **Assuming ORDS health check verifies REST API handlers**: The `/ords/` health check only confirms ORDS is running and can serve HTTP. It does not verify DB connectivity or that REST modules are working. Use `/ords/_/db-api/stable/database/` for full health verification.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [ORDS Developer's Guide — Monitoring and Diagnosing Oracle REST Data Services](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/orddg/about-oracle-rest-data-services.html)
- [ORDS Configuration Settings Reference — Logging and Performance](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/ordig/configuration-settings.html)
- [ORDS CLI Reference — ords validate](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/ordig/ords-command-line-interface.html)
