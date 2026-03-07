# Oracle Database Links

## Overview

A **database link** (dblink) is a named connection descriptor stored in a local Oracle database that enables SQL statements to reference objects in a remote database as if they were local. A database link stores the connection information (host, port, service name) and — depending on the link type — the remote credentials used to establish the session.

Database links are a built-in Oracle feature that predates most distributed database technology, and they remain a pragmatic solution for cross-database queries, distributed DML, and replication scenarios within an Oracle estate.

**When database links are appropriate:**
- Ad-hoc queries across two Oracle databases in the same trusted network
- Scheduled batch jobs that consolidate data from multiple Oracle sources
- Replication and synchronization between Oracle databases (often via materialized views)
- Migration scenarios where data must be read from an old database during cut-over

**When database links are NOT appropriate:**
- High-frequency OLTP queries — the network round-trip overhead compounds quickly
- Cross-database joins on large tables — data transfer volume is uncontrolled
- Connections to non-Oracle databases directly (use heterogeneous services / generic connectivity instead)
- Situations requiring strong security isolation — dblinks carry implicit trust

---

## Types of Database Links

### Fixed User Link

The link always connects to the remote database as a specific, hardcoded user. Regardless of who executes a query through the link, they use the remote credentials stored in the link.

```sql
CREATE DATABASE LINK sales_db_link
CONNECT TO remote_user IDENTIFIED BY "remote_password"
USING 'SALESDB';   -- TNS service name or connect string
```

### Connected User Link

The link connects to the remote database as the **same user** who is currently logged in to the local database. The remote database must have a matching account.

```sql
CREATE DATABASE LINK hr_db_link
CONNECT TO CURRENT_USER
USING 'HRDB';
```

Connected user links are more secure than fixed user links because they do not embed credentials in the database and because each local user operates with their own remote privileges.

### Shared Database Link

A **shared link** reuses a single remote database session across multiple local sessions. This reduces connection overhead on the remote database at the cost of slightly more complex connection management.

```sql
CREATE SHARED DATABASE LINK shared_dw_link
CONNECT TO dw_query_user IDENTIFIED BY "dw_password"
USING 'DWDB';
```

### Public vs Private Links

By default, a database link is **private** — accessible only to the user who created it. A **public** link is accessible to any database user.

```sql
-- Private link (owned by current user only)
CREATE DATABASE LINK my_private_link
CONNECT TO remote_user IDENTIFIED BY "password"
USING 'REMOTEDB';

-- Public link (accessible by all database users)
CREATE PUBLIC DATABASE LINK corp_shared_link
CONNECT TO reporting_user IDENTIFIED BY "rpt_password"
USING 'REPORTDB';
-- Requires CREATE PUBLIC DATABASE LINK privilege
```

---

## TNS Connection Options

The `USING` clause accepts either a TNS alias (resolved via `tnsnames.ora` or LDAP) or an inline Easy Connect string:

```sql
-- Easy Connect string (no tnsnames.ora entry required)
CREATE DATABASE LINK remote_via_ezconnect
CONNECT TO app_user IDENTIFIED BY "password"
USING '//db-host.company.com:1521/ORCL';

-- Full inline descriptor (TNS descriptor syntax)
CREATE DATABASE LINK remote_full_descriptor
CONNECT TO app_user IDENTIFIED BY "password"
USING '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=db-host.company.com)(PORT=1521))
        (CONNECT_DATA=(SERVICE_NAME=ORCL)))';

-- TNS alias from tnsnames.ora
CREATE DATABASE LINK remote_via_tns
CONNECT TO app_user IDENTIFIED BY "password"
USING 'PROD_DB';
```

---

## Using Database Links in Queries

Once created, reference a remote object by appending `@<link_name>` to the object name:

### SELECT Across a Database Link

```sql
-- Select from a remote table
SELECT employee_id, last_name, salary
FROM   employees@hr_db_link
WHERE  department_id = 90;

-- Join local and remote tables
SELECT l.order_id,
       l.order_date,
       r.customer_name,
       r.email
FROM   orders         l
JOIN   customers@crm_db_link r ON r.customer_id = l.customer_id
WHERE  l.order_date > SYSDATE - 30;

-- Use a synonym to hide the link name from application code
CREATE SYNONYM remote_customers FOR customers@crm_db_link;

SELECT * FROM remote_customers WHERE country_code = 'US';
```

### DML Across a Database Link

Oracle supports INSERT, UPDATE, DELETE, and MERGE on remote tables through database links:

```sql
-- Insert into a remote table
INSERT INTO archive_orders@archive_db_link (order_id, order_date, amount)
SELECT order_id, order_date, amount
FROM   orders_local
WHERE  order_date < ADD_MONTHS(SYSDATE, -24);

-- Update a remote record
UPDATE customer_flags@crm_db_link
SET    is_active = 0
WHERE  last_order_date < ADD_MONTHS(SYSDATE, -12);

-- MERGE across a database link
MERGE INTO product_catalog@dw_db_link target
USING (SELECT product_id, product_name, unit_price FROM products_local) src
ON    (target.product_id = src.product_id)
WHEN MATCHED THEN
    UPDATE SET target.unit_price = src.unit_price
WHEN NOT MATCHED THEN
    INSERT (product_id, product_name, unit_price)
    VALUES (src.product_id, src.product_name, src.unit_price);

COMMIT;
```

### Calling Remote Procedures

```sql
-- Execute a stored procedure on the remote database
BEGIN
    archive_pkg.purge_old_records@archive_db_link(p_cutoff_date => ADD_MONTHS(SYSDATE, -36));
END;
/
```

---

## Two-Phase Commit (Distributed Transactions)

When a single Oracle transaction modifies data on **multiple databases** via database links, Oracle uses **two-phase commit (2PC)** to ensure atomicity across all sites.

### How 2PC Works in Oracle

1. **Prepare phase:** The local database (coordinator) asks each remote database (participant) whether it is ready to commit.
2. **Commit phase:** If all participants report ready, the coordinator instructs everyone to commit. If any participant reports not ready (or times out), all sites roll back.

The coordinator records the 2PC decision in `DBA_2PC_PENDING` before the final commit or rollback so that the transaction can be resolved manually if a participant becomes unreachable.

```sql
-- Distributed transaction touching two databases
BEGIN
    -- Local insert
    INSERT INTO local_orders (order_id, amount) VALUES (9001, 1500.00);

    -- Remote insert (triggers 2PC coordination)
    INSERT INTO order_archive@archive_db_link (order_id, amount) VALUES (9001, 1500.00);

    COMMIT;  -- Oracle negotiates 2PC automatically
END;
/
```

### Monitoring and Resolving In-Doubt Transactions

```sql
-- View in-doubt distributed transactions
SELECT local_tran_id, global_tran_id, state, mixed, host, db_user, advice
FROM   dba_2pc_pending;

-- Manually force commit of an in-doubt transaction (use only when instructed)
-- This is only safe when you have confirmed the remote side committed
COMMIT FORCE '10.13.3.10.1';  -- use the local_tran_id from DBA_2PC_PENDING

-- Manually force rollback
ROLLBACK FORCE '10.13.3.10.1';

-- Clean up after resolution
DELETE FROM dba_2pc_pending WHERE local_tran_id = '10.13.3.10.1';
EXEC DBMS_TRANSACTION.PURGE_LOST_DB_ENTRY('10.13.3.10.1');
```

**Important:** Never manually force-commit or force-rollback a distributed transaction without first confirming the state of the remote participant. Forcing the wrong outcome creates data inconsistencies that are hard to detect and correct.

---

## Performance Implications

### The Remote-First Execution Problem

Oracle's optimizer evaluates distributed queries based on local statistics. It often underestimates remote table sizes because remote statistics are not always current. This can result in the optimizer fetching large result sets across the network instead of applying filters remotely.

```sql
-- PROBLEMATIC: Oracle may push the join to the remote side, fetching all of
-- 'orders' (potentially millions of rows) across the network
SELECT o.order_id, c.customer_name
FROM   orders          o
JOIN   customers@remote_db c ON c.customer_id = o.customer_id
WHERE  o.order_date > SYSDATE - 7;

-- BETTER: Force the filtering to happen locally first, then join to remote
SELECT o.order_id, c.customer_name
FROM   (SELECT order_id, customer_id FROM orders WHERE order_date > SYSDATE - 7) o
JOIN   customers@remote_db c ON c.customer_id = o.customer_id;
```

### The `DRIVING_SITE` Hint

The `DRIVING_SITE` hint instructs Oracle to execute the join at the specified database location, reducing data movement:

```sql
-- Execute the query at the remote site (remote data is large; local filter is selective)
SELECT /*+ DRIVING_SITE(c) */
       o.order_id, c.customer_name
FROM   orders          o
JOIN   customers@remote_db c ON c.customer_id = o.customer_id
WHERE  c.country_code = 'US';
```

### Using DB Links with Materialized Views for Performance

Instead of live queries through a database link, consider pulling data via an MV:

```sql
-- Create a local MV that refreshes from the remote database daily
CREATE MATERIALIZED VIEW mv_remote_customers
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT customer_id, customer_name, country_code, email
FROM   customers@crm_db_link;

-- Schedule refresh via DBMS_SCHEDULER
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name        => 'REFRESH_REMOTE_CUSTOMERS_MV',
        job_type        => 'PLSQL_BLOCK',
        job_action      => 'BEGIN DBMS_MVIEW.REFRESH(''MV_REMOTE_CUSTOMERS'', ''C''); END;',
        repeat_interval => 'FREQ=DAILY;BYHOUR=3;BYMINUTE=0;BYSECOND=0',
        enabled         => TRUE
    );
END;
/
```

---

## Managing Database Links

```sql
-- View database links owned by current user
SELECT db_link, username, host, created
FROM   user_db_links
ORDER  BY db_link;

-- View all database links (DBA view)
SELECT owner, db_link, username, host, created
FROM   dba_db_links
ORDER  BY owner, db_link;

-- Test a database link
SELECT * FROM dual@hr_db_link;
-- Expected result: one row, column X = 'X'

-- Check current session's open database link connections
SELECT db_link
FROM   v$dblink;

-- Close an open database link without disconnecting the session
ALTER SESSION CLOSE DATABASE LINK hr_db_link;

-- Drop a database link
DROP DATABASE LINK hr_db_link;
DROP PUBLIC DATABASE LINK corp_shared_link;
```

---

## Security Risks and Best Practices

### Risks

1. **Credential exposure:** Fixed user links store the remote password in an encrypted but accessible form in `SYS.LINK$`. A DBA with `SELECT ANY DICTIONARY` access can potentially extract link credentials. This is a well-known concern — treat fixed user link credentials as shared secrets with limited lifetime.

2. **Privilege escalation:** A user with access to a database link pointing to a remote DBA account can execute arbitrary DDL on the remote database.

3. **Audit blind spots:** DML executed through a database link is recorded in the remote database's audit trail under the remote link user, not the local initiating user. This breaks end-to-end accountability unless both sides are audited and correlated.

4. **Lateral movement:** A compromised application schema with access to a fixed user dblink becomes a pivot point to a second database.

### Best Practices

- **Prefer connected user links** over fixed user links for user-facing applications. Each local user's identity carries through to the remote database, preserving audit trails and enforcing remote-side row-level security.
- **Create dedicated remote users for database links** with only the minimum privileges required (SELECT on specific tables, not CONNECT RESOURCE or DBA).
- **Rotate fixed user link passwords on a schedule.** Use Oracle Vault or a secrets manager. To change the password, recreate the link:

```sql
-- Recreate a database link to update the password
DROP DATABASE LINK old_link;
CREATE DATABASE LINK old_link
CONNECT TO remote_user IDENTIFIED BY "new_password"
USING 'REMOTEDB';
```

- **Audit database link usage.** Enable fine-grained auditing or Oracle Audit Vault to capture all cross-database operations.

```sql
-- Enable audit for database link operations
AUDIT SELECT TABLE, INSERT TABLE, UPDATE TABLE, DELETE TABLE
BY ACCESS
WHENEVER SUCCESSFUL;
```

- **Never create public database links pointing to privileged remote accounts.** Any database user (including those created by application frameworks, tooling, or attackers) can use a public link.
- **Review `DBA_DB_LINKS` regularly.** Remove links that are no longer used. An unused link pointing to a decommissioned system is a latent security and connectivity risk.
- **Firewall remote database ports** so that only the Oracle listener port is accessible, and only from the specific source database hosts. Database link connections travel through standard Oracle Net, so standard network controls apply.
- **Use Oracle Network Encryption (ASO/TLS)** for database link traffic on untrusted networks. Database link traffic is cleartext by default.

```sql
-- sqlnet.ora on the client (initiating) side
-- Add: SQLNET.ENCRYPTION_CLIENT = REQUIRED
-- SQLNET.ENCRYPTION_TYPES_CLIENT = (AES256)
```

---

## Common Mistakes and How to Avoid Them

**Mistake 1: Using fixed user links pointing to powerful accounts**
Fixed user links pointing to a `DBA` or `CONNECT RESOURCE` account grant anyone who can access the link full control of the remote database. Always create a minimal-privilege remote account for dblink use.

**Mistake 2: Live cross-database joins in OLTP code paths**
Every row retrieved through a database link incurs a network round-trip. A join that scans 100,000 remote rows transfers the entire result set across the network. Audit all production code paths that use `@link_name` and replace hot paths with scheduled MV refreshes or local copies.

**Mistake 3: Ignoring `DBA_2PC_PENDING` entries**
In-doubt transactions left unresolved accumulate in `DBA_2PC_PENDING` and consume resources (locks, rollback segment entries). Build a monitoring alert for non-empty `DBA_2PC_PENDING`. RECO (the Recoverer) process should resolve them automatically when connectivity is restored, but in some cases manual intervention is needed.

**Mistake 4: Creating public database links in multi-tenant environments**
In an Oracle Multitenant (CDB/PDB) environment, a public database link in a PDB is accessible to all users of that PDB. Treat public links with the same caution as granting DBA to public. Prefer private links or application-level connection management.

**Mistake 5: Not testing links after network or firewall changes**
Database link failures surface as `ORA-12170: TNS:Connect timeout` or `ORA-12541: TNS:no listener` errors at query time, not at creation time. After any network change, test all active links with `SELECT * FROM dual@<link_name>`.

**Mistake 6: Storing the link password in application scripts**
Some teams create database links via scripts with hardcoded passwords. These scripts often end up in version control. Use environment variables or Oracle Vault to inject credentials at deployment time, and avoid committing connection scripts with embedded passwords.

---

## Sources

- [Oracle Database Administrator's Guide: Managing Distributed Databases — Database Links 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/managing-a-distributed-database.html)
- [Oracle Database SQL Language Reference: CREATE DATABASE LINK 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-DATABASE-LINK.html)
- [Oracle Database Heterogeneous Connectivity User's Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/heter/index.html)
