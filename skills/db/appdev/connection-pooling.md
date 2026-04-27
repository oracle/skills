# Connection Pooling in Oracle Database

## Overview

Connection pooling is one of the most critical performance techniques in Oracle application development. Establishing a database connection is expensive — it involves network round-trips, authentication, session state initialization, and memory allocation on both client and server. Connection pooling amortizes this cost by maintaining a set of pre-established connections that applications can borrow, use, and return.

Oracle provides two primary pooling architectures:

- **Universal Connection Pool (UCP)** — Oracle's client-side Java pool for JDBC applications
- **Database Resident Connection Pooling (DRCP)** — a server-side pool managed inside the database, ideal for thousands of short-lived connections from stateless application servers

---

## Universal Connection Pool (UCP)

UCP is Oracle's client-side connection pool for JDBC. It is a pure-Java library that maintains a pool of physical database connections inside the application process.

### Key Pool Parameters

| Parameter | Description | Typical Value |
|---|---|---|
| `initialPoolSize` | Connections created at pool startup | 5–10 |
| `minPoolSize` | Minimum connections maintained | 5 |
| `maxPoolSize` | Hard ceiling on connections | 20–100 |
| `connectionWaitTimeout` | Seconds to wait for a free connection | 30 |
| `inactiveConnectionTimeout` | Seconds before idle connections are closed | 300 |
| `validateConnectionOnBorrow` | Run validation query on each borrow | true (dev), false (prod with `isValid`) |
| `abandonedConnectionTimeout` | Reclaim connections held longer than N seconds | 120–600 |
| `timeToLiveConnectionTimeout` | Maximum age of a connection | 3600 |

### JDBC / UCP Example

```java
import oracle.ucp.jdbc.PoolDataSourceFactory;
import oracle.ucp.jdbc.PoolDataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class UCPExample {

    private static PoolDataSource pool;

    static {
        try {
            pool = PoolDataSourceFactory.getPoolDataSource();
            pool.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
            pool.setURL("jdbc:oracle:thin:@//db-host:1521/MYSERVICE");
            pool.setUser("app_user");
            pool.setPassword("secret");

            // Pool sizing
            pool.setInitialPoolSize(10);
            pool.setMinPoolSize(5);
            pool.setMaxPoolSize(50);

            // Timeouts (in seconds)
            pool.setConnectionWaitTimeout(30);
            pool.setInactiveConnectionTimeout(300);
            pool.setAbandonedConnectionTimeout(120);
            pool.setTimeToLiveConnectionTimeout(3600);

            // Validation
            pool.setValidateConnectionOnBorrow(false); // use isValid() instead

        } catch (Exception e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    public static void queryExample(int customerId) throws Exception {
        // Always use try-with-resources to guarantee return to pool
        try (Connection conn = pool.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                 "SELECT customer_name, email FROM customers WHERE customer_id = ?")) {

            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    System.out.println(rs.getString("customer_name"));
                }
            }
        } // connection automatically returned to pool here
    }
}
```

### UCP with Easy Connect Plus

Oracle 19c+ supports **Easy Connect Plus** syntax, which embeds pool and timeout parameters directly in the connect string:

```
jdbc:oracle:thin:@//db-host:1521/MYSERVICE?oracle.jdbc.ReadTimeout=60000&oracle.net.CONNECT_TIMEOUT=10000
```

For TNS alias resolution with wallets (e.g., Autonomous Database):

```java
pool.setURL("jdbc:oracle:thin:@mydb_high?TNS_ADMIN=/path/to/wallet");
```

---

## Database Resident Connection Pooling (DRCP)

DRCP moves the pool into the database server itself. A **Connection Broker** process manages a pool of server processes (called **pooled servers**). When an application connects, it borrows a pooled server, executes work, and releases it back — without destroying the server-side process.

### When to Use DRCP

- Thousands of short-lived, stateless connections (e.g., PHP, Python scripts)
- Mid-tier servers that cannot maintain long-lived JDBC pools
- Situations where reducing database server memory is critical
- Combined with client-side pools for best-of-both-worlds

### Enabling DRCP

```sql
-- Start the connection pool (run as SYSDBA)
EXECUTE DBMS_CONNECTION_POOL.START_POOL();

-- Configure pool parameters
EXECUTE DBMS_CONNECTION_POOL.CONFIGURE_POOL(
    pool_name         => 'SYS_DEFAULT_CONNECTION_POOL',
    minsize           => 4,
    maxsize           => 40,
    incrsize          => 2,
    session_cached_cursors => 20,
    inactivity_timeout => 300,
    max_think_time    => 120,
    max_use_session   => 500000,
    max_lifetime_session => 86400
);

-- Check pool status
SELECT connection_pool, status, minsize, maxsize, num_open_servers,
       num_busy_servers, num_waiting_requests
FROM   v$cpool_stats;
```

### DRCP Connection String

Append `:POOLED` to the service name in the connect descriptor:

```
# tnsnames.ora
MYAPP_DRCP =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = db-host)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = POOLED)
      (SERVICE_NAME = MYSERVICE)
    )
  )
```

Or inline with Easy Connect:

```
db-host:1521/MYSERVICE:POOLED
```

### Python (python-oracledb) with DRCP

```python
import oracledb

# Thin mode (no Oracle Client needed) - python-oracledb native pool
pool = oracledb.create_pool(
    user="app_user",
    password="secret",
    dsn="db-host:1521/MYSERVICE",
    min=2,
    max=10,
    increment=1,
    ping_interval=60,       # validate connections every 60s
    timeout=300,            # close idle connections after 5 min
    getmode=oracledb.POOL_GETMODE_WAIT,
    wait_timeout=5000       # ms to wait for a connection
)

def fetch_customer(customer_id: int) -> dict:
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT customer_name, email FROM customers WHERE customer_id = :id",
                id=customer_id
            )
            row = cur.fetchone()
            return {"name": row[0], "email": row[1]} if row else {}

# DRCP: just change the dsn
pool_drcp = oracledb.create_pool(
    user="app_user",
    password="secret",
    dsn="db-host:1521/MYSERVICE:POOLED",  # :POOLED suffix enables DRCP
    min=1,
    max=5,
    increment=1
)
```

### Node.js (node-oracledb) Pool

```javascript
const oracledb = require('oracledb');

async function initPool() {
    await oracledb.createPool({
        user: 'app_user',
        password: 'secret',
        connectString: 'db-host:1521/MYSERVICE',
        poolMin: 4,
        poolMax: 20,
        poolIncrement: 2,
        poolTimeout: 60,        // idle connection eviction after 60s
        poolPingInterval: 60,   // validate borrowed connections every 60s
        stmtCacheSize: 30       // prepared statement cache per connection
    });
}

async function queryExample(customerId) {
    let conn;
    try {
        conn = await oracledb.getConnection();  // borrows from default pool
        const result = await conn.execute(
            `SELECT customer_name, email
             FROM   customers
             WHERE  customer_id = :id`,
            { id: customerId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally {
        if (conn) await conn.close();  // returns to pool, not destroyed
    }
}
```

---

## Connection String Formats

### Easy Connect (simplest)

```
host[:port][/service_name][:server_type][/instance_name]
```

Examples:
```
db-host/ORCL
db-host:1521/MYSERVICE
db-host:1521/MYSERVICE:POOLED
scan-host:1521/MYSERVICE
```

### Easy Connect Plus (19c+, with parameters)

```
(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=db-host)(PORT=1521))
  (CONNECT_DATA=(SERVICE_NAME=MYSERVICE))
  (CONNECT_TIMEOUT=10)(RETRY_COUNT=3)(RETRY_DELAY=3))
```

Or as a URL-style string:

```
db-host:1521/MYSERVICE?connect_timeout=10&retry_count=3
```

### TNS Names Entry

```
# $ORACLE_HOME/network/admin/tnsnames.ora
MYSERVICE =
  (DESCRIPTION =
    (ADDRESS_LIST =
      (ADDRESS = (PROTOCOL = TCP)(HOST = primary-host)(PORT = 1521))
      (ADDRESS = (PROTOCOL = TCP)(HOST = standby-host)(PORT = 1521))
    )
    (CONNECT_DATA =
      (SERVICE_NAME = MYSERVICE)
      (SERVER = DEDICATED)
    )
    (LOAD_BALANCE = YES)
    (FAILOVER = YES)
  )
```

### JDBC Thin URL

```
jdbc:oracle:thin:@//host:port/service
jdbc:oracle:thin:@host:port:SID
jdbc:oracle:thin:@(DESCRIPTION=...)
jdbc:oracle:thin:@tns_alias?TNS_ADMIN=/path/to/tns
```

---

## Pool Sizing Guidelines

Getting pool size wrong is the single most common cause of poor application scalability.

### Little's Law Applied to Database Pools

```
Optimal Pool Size ≈ (Throughput × Average Query Duration)
```

For example: 200 requests/sec, average query takes 50ms:
```
Pool Size = 200 * 0.050 = 10 connections
```

### Practical Rules of Thumb

- **Start small.** 10–20 connections often outperforms 200. More connections = more context switching on the database server.
- **Max connections across all app instances** should not exceed the database's `PROCESSES` parameter minus system overhead.
- **Monitor `v$cpool_stats` and `v$session`** to detect pool exhaustion.
- For Oracle RAC, account for connections per node; set `maxPoolSize` per instance, not total.

```sql
-- Check current session counts by program/service
SELECT program, service_name, status, COUNT(*) AS session_count
FROM   v$session
WHERE  type = 'USER'
GROUP  BY program, service_name, status
ORDER  BY session_count DESC;

-- Check if DRCP pool is saturated
SELECT num_busy_servers, num_open_servers,
       num_waiting_requests, num_requests
FROM   v$cpool_stats;
```

---

## Connection Validation

Connections in a pool can become stale (network failure, database restart, firewall idle timeout). Validation strategies:

| Strategy | Cost | Reliability |
|---|---|---|
| `isValid()` / ping on borrow | Low (1 round-trip) | High |
| SQL validation query (`SELECT 1 FROM DUAL`) | Low | High |
| Heartbeat thread | Background | Medium |
| No validation | Zero | Low (stale connections possible) |

```java
// Java: test connection before use
try (Connection conn = pool.getConnection()) {
    if (!conn.isValid(5)) {  // 5-second timeout
        // UCP will automatically replace the broken connection
        throw new SQLException("Connection validation failed");
    }
    // proceed with work
}
```

```python
# python-oracledb: ping_interval controls background validation
pool = oracledb.create_pool(
    ...,
    ping_interval=60,  # ping connections idle > 60s before lending
    ping_timeout=5     # fail if ping takes > 5s
)
```

---

## Best Practices

- **Always close/release connections in a finally block or try-with-resources.** A leaked connection is permanently removed from the pool until `abandonedConnectionTimeout` fires.
- **Do not cache Connection objects** across requests. Borrow, use, and return within a single request lifecycle.
- **Set `maxPoolSize` conservatively.** More connections hurt performance after the database's CPU count is saturated.
- **Use services, not SIDs.** Connect to a named service so you can use TAF (Transparent Application Failover) and load balancing.
- **Enable statement caching.** Each connection in the pool can cache prepared statements, eliminating repeated parse calls.
- **Monitor pool metrics.** Alert when `connectionWaitTimeout` exceptions appear — this signals pool exhaustion.
- **Use separate pools for OLTP and batch jobs** to prevent batch workloads from starving interactive queries.
- **In cloud/containerized environments**, set `inactiveConnectionTimeout` shorter than the cloud load balancer's idle timeout (often 4 minutes) to avoid silent connection drops.

---

## Common Mistakes

### Mistake 1: Not Closing Connections

```java
// WRONG — connection is never returned to pool
public void badQuery() throws Exception {
    Connection conn = pool.getConnection();
    // ... do work ...
    // forgot conn.close()!
}

// RIGHT — try-with-resources guarantees return
public void goodQuery() throws Exception {
    try (Connection conn = pool.getConnection()) {
        // ... do work ...
    }
}
```

### Mistake 2: Pool Size Too Large

Setting `maxPoolSize=500` on each of 10 application servers = 5,000 potential connections to the database. Oracle must allocate a server process (or shared server slot) for each. This crushes the database with OS process overhead.

**Fix:** Calculate using Little's Law. Start with `maxPoolSize = number of CPU cores on DB server * 2`.

### Mistake 3: Ignoring `connectionWaitTimeout` Exceptions

When the pool is exhausted, threads wait and eventually throw a timeout exception. Many developers catch and swallow this exception. Instead, expose it as a metric and alert on it.

### Mistake 4: Using DRCP with Stateful Sessions

DRCP resets session state between uses. Do not use DRCP if your application:
- Uses `DBMS_SESSION.SET_CONTEXT` and expects it to persist
- Relies on temporary tables across multiple requests on the same connection
- Uses `ALTER SESSION` settings that must persist

### Mistake 5: Wrong Service vs. SID

Always connect to a **SERVICE_NAME**, not a **SID**. Services support TAF, load balancing, and connection-time failover. SIDs are deprecated for client connections.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c Application Developer's Guide (ADFNS)](https://docs.oracle.com/en/database/oracle/oracle-database/19/adfns/)
- [DBMS_CONNECTION_POOL — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_CONNECTION_POOL.html)
- [V$CPOOL_STATS — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-CPOOL_STATS.html)
- [Universal Connection Pool Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjucp/)
- [python-oracledb Documentation](https://python-oracledb.readthedocs.io/en/latest/)
