# Migrating Amazon Redshift to Oracle

## Overview

Amazon Redshift is a columnar, massively parallel processing (MPP) data warehouse based on a fork of PostgreSQL 8.0. Oracle Database is a traditional row-oriented RDBMS with optional in-memory columnar processing via the In-Memory Column Store (IMCS). The migration from Redshift to Oracle involves not just syntax translation but a fundamental shift in architecture: from distribution-key-based parallelism to shared-memory or RAC-based scale-out, and from a columnar storage model to a row-based heap with optional column store overlays.

This guide covers architectural differences, SQL dialect translation, data type mapping, COPY command alternatives, and workload management equivalents.

---

## Architectural Differences

### Redshift MPP vs Oracle Architecture

Redshift is a shared-nothing MPP cluster. Every table is physically distributed across compute nodes based on a distribution key or a round-robin/ALL strategy. Queries are compiled and executed in parallel across all nodes, with each node processing its local data slice.

Oracle does not have a direct equivalent to Redshift's distribution model. Oracle's parallelism is:
- **Parallel Query (PQ):** Within a single instance, multiple parallel execution servers scan and process different rowid ranges of the same table.
- **Oracle RAC:** Multiple database instances sharing the same storage, with global cache coordination.
- **Oracle In-Memory Column Store:** An optional column-formatted memory area that accelerates analytical queries, most closely analogous to Redshift's columnar format.

| Redshift Concept | Oracle Equivalent | Notes |
|---|---|---|
| Distribution key | Partition key (roughly) | Oracle partitioning by a high-cardinality column achieves similar local-data access patterns |
| Distribution style ALL | No equivalent | Redshift ALL replicates small tables to every node; Oracle handles this via buffer cache |
| Distribution style EVEN | No equivalent | Redshift round-robin; Oracle relies on parallel query with full table scans |
| Sort key (compound) | Index or partition | B-tree indexes, partitioning, and IMCS sorted segments |
| Sort key (interleaved) | No equivalent | Interleaved sort keys are Redshift-specific; use Oracle bitmap indexes or column store |
| Columnar storage | Oracle In-Memory Column Store | Optional, RAM-based; does not change on-disk format |
| MPP node-level data | Oracle parallel query servers | Different execution model but similar query fan-out |

### Schema Design Implications

When moving from Redshift's columnar store:

1. **Row-based storage is the Oracle default.** Queries that scan millions of rows and aggregate them rely on Oracle's optimizer to use indexes, partitioning, and parallel query. Add partitioning to large fact tables.

2. **Enable Oracle IMCS for analytical workloads.** Designate frequently scanned analytical tables to the in-memory column store:

```sql
-- Enable In-Memory Column Store (requires SGA configuration)
ALTER SYSTEM SET INMEMORY_SIZE = 10G SCOPE=SPFILE;
-- Restart required

-- Mark a table for in-memory columnar storage
ALTER TABLE fact_sales INMEMORY
    MEMCOMPRESS FOR QUERY HIGH
    PRIORITY HIGH;

-- Mark specific columns only
ALTER TABLE fact_sales INMEMORY
    MEMCOMPRESS FOR QUERY HIGH (sale_amount, sale_date, product_id);
```

3. **Use range or range-interval partitioning** on date columns for large fact tables — this mirrors Redshift's compound sort key on dates for range-scan efficiency:

```sql
CREATE TABLE fact_sales (
    sale_id      NUMBER,
    sale_date    DATE NOT NULL,
    product_id   NUMBER,
    customer_id  NUMBER,
    sale_amount  NUMBER(15,2),
    region_code  VARCHAR2(10)
)
PARTITION BY RANGE (sale_date)
INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))
(
    PARTITION p_initial VALUES LESS THAN (DATE '2020-01-01')
);
```

---

## Data Type Mapping

| Redshift | Oracle | Notes |
|---|---|---|
| `SMALLINT` | `NUMBER(5)` | |
| `INTEGER` / `INT` | `NUMBER(10)` | |
| `BIGINT` | `NUMBER(19)` | |
| `DECIMAL(p,s)` / `NUMERIC(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `REAL` | `BINARY_FLOAT` | 32-bit IEEE 754 |
| `DOUBLE PRECISION` | `BINARY_DOUBLE` | 64-bit IEEE 754 |
| `BOOLEAN` | `NUMBER(1)` with CHECK (0,1) | Oracle 23ai/26ai has native BOOLEAN |
| `CHAR(n)` | `CHAR(n)` | |
| `VARCHAR(n)` / `CHARACTER VARYING(n)` | `VARCHAR2(n)` | Redshift max 65,535; Oracle max 4000 (32767 extended) |
| `TEXT` (aliased) | `CLOB` | |
| `DATE` | `DATE` | Oracle DATE includes time; Redshift DATE is date-only |
| `TIMESTAMP` | `TIMESTAMP` | |
| `TIMESTAMPTZ` / `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP WITH TIME ZONE` | |
| `TIMEZONEOID` | N/A | Internal type |
| `GEOMETRY` | `SDO_GEOMETRY` | Requires Oracle Spatial |
| `HLLSKETCH` | No equivalent | HyperLogLog sketch; recompute using `APPROX_COUNT_DISTINCT` |
| `SUPER` | `JSON` (21c+) or `CLOB IS JSON` | Redshift's semi-structured type |
| `VARBYTE` | `RAW(n)` or `BLOB` | Variable-length binary |

---

## Redshift SQL Quirks → Oracle Equivalents

### NVL2 and ISNULL

```sql
-- Redshift (NVL2 is also available in Oracle — same syntax)
SELECT NVL2(phone, 'Has phone', 'No phone') FROM customers;

-- ISNULL is Redshift/SQL Server syntax — not available in Oracle
SELECT ISNULL(phone, 'N/A') FROM customers;      -- Redshift

-- Oracle equivalent
SELECT NVL(phone, 'N/A') FROM customers;
SELECT COALESCE(phone, 'N/A') FROM customers;
```

### ILIKE (Case-Insensitive LIKE)

```sql
-- Redshift
SELECT * FROM products WHERE name ILIKE '%widget%';

-- Oracle
SELECT * FROM products WHERE UPPER(name) LIKE UPPER('%widget%');
SELECT * FROM products WHERE UPPER(name) LIKE '%WIDGET%';
```

### LIMIT / OFFSET

```sql
-- Redshift
SELECT * FROM fact_sales ORDER BY sale_date DESC LIMIT 100 OFFSET 200;

-- Oracle 12c+
SELECT * FROM fact_sales ORDER BY sale_date DESC
OFFSET 200 ROWS FETCH NEXT 100 ROWS ONLY;
```

### DATEADD and DATEDIFF

```sql
-- Redshift
SELECT DATEADD(day, 30, order_date) AS due_date FROM orders;
SELECT DATEDIFF(day, start_date, end_date) AS days_elapsed FROM projects;

-- Oracle
SELECT order_date + 30 AS due_date FROM orders;
SELECT end_date - start_date AS days_elapsed FROM projects;
-- For DATEADD with months/years:
SELECT ADD_MONTHS(order_date, 1) FROM orders;
```

### GETDATE() and Other Datetime Functions

```sql
-- Redshift
SELECT GETDATE();
SELECT SYSDATE;           -- also available
SELECT CURRENT_TIMESTAMP;

-- Oracle
SELECT SYSDATE FROM DUAL;          -- no fractional seconds
SELECT SYSTIMESTAMP FROM DUAL;     -- with fractional seconds and TZ offset
SELECT CURRENT_TIMESTAMP FROM DUAL; -- session time zone
```

### CONVERT and CAST

```sql
-- Redshift
SELECT CONVERT(VARCHAR, sale_date, 112);   -- SQL Server-style CONVERT
SELECT CAST(sale_amount AS VARCHAR(20));

-- Oracle
SELECT TO_CHAR(sale_date, 'YYYYMMDD') FROM DUAL;
SELECT CAST(sale_amount AS VARCHAR2(20)) FROM DUAL;
SELECT TO_CHAR(sale_amount) FROM DUAL;
```

### String Functions

| Redshift | Oracle Equivalent |
|---|---|
| `LISTAGG(col, ',')` | `LISTAGG(col, ',') WITHIN GROUP (ORDER BY col)` — same |
| `NVL(a, b)` | `NVL(a, b)` — same |
| `DECODE(expr, ...)` | `DECODE(expr, ...)` — same |
| `SPLIT_PART(s, delim, n)` | `REGEXP_SUBSTR(s, '[^' \|\| delim \|\| ']+', 1, n)` |
| `STRTOL(s, base)` | No equivalent; use PL/SQL function |
| `TRANSLATE(s, from, to)` | `TRANSLATE(s, from, to)` — same |
| `CHARINDEX(sub, s)` | `INSTR(s, sub)` |
| `LEN(s)` | `LENGTH(s)` |
| `BTRIM(s)` | `TRIM(s)` |

### Window Functions

Redshift supports most standard SQL window functions. Oracle supports all of them with identical or near-identical syntax.

```sql
-- Redshift window function
SELECT
    sale_id,
    sale_date,
    sale_amount,
    SUM(sale_amount) OVER (PARTITION BY region_code ORDER BY sale_date
                           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
    RANK() OVER (PARTITION BY region_code ORDER BY sale_amount DESC) AS rank_in_region
FROM fact_sales;

-- Oracle — identical syntax
SELECT
    sale_id,
    sale_date,
    sale_amount,
    SUM(sale_amount) OVER (PARTITION BY region_code ORDER BY sale_date
                           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
    RANK() OVER (PARTITION BY region_code ORDER BY sale_amount DESC) AS rank_in_region
FROM fact_sales;
```

---

## COPY Command → Oracle External Tables / SQL*Loader

Redshift's `COPY` command loads data from S3 (or other sources) directly into a table with MPP parallelism. Oracle provides two main bulk loading mechanisms.

### Redshift COPY

```sql
-- Redshift: load from S3
COPY fact_sales
FROM 's3://my-bucket/data/fact_sales/'
IAM_ROLE 'arn:aws:iam::123456789012:role/RedshiftRole'
FORMAT AS CSV
IGNOREHEADER 1
DATEFORMAT 'auto'
TIMEFORMAT 'auto'
MAXERROR 100;
```

### Oracle External Tables (read-only, query-based)

External tables let Oracle read files from the OS filesystem as if they were database tables. Ideal for staging loads.

```sql
-- Create directory object pointing to data files
CREATE OR REPLACE DIRECTORY ext_data_dir AS '/opt/oracle/data/staging';
GRANT READ ON DIRECTORY ext_data_dir TO myuser;

-- Create external table definition
CREATE TABLE ext_fact_sales (
    sale_id      NUMBER,
    sale_date    DATE,
    product_id   NUMBER,
    customer_id  NUMBER,
    sale_amount  NUMBER(15,2),
    region_code  VARCHAR2(10)
)
ORGANIZATION EXTERNAL (
    TYPE ORACLE_LOADER
    DEFAULT DIRECTORY ext_data_dir
    ACCESS PARAMETERS (
        RECORDS DELIMITED BY NEWLINE
        SKIP 1
        FIELDS TERMINATED BY ','
        OPTIONALLY ENCLOSED BY '"'
        MISSING FIELD VALUES ARE NULL
        (
            sale_id,
            sale_date    DATE "YYYY-MM-DD",
            product_id,
            customer_id,
            sale_amount,
            region_code
        )
    )
    LOCATION ('fact_sales_*.csv')
)
REJECT LIMIT 100;

-- Load from external table into physical table
INSERT /*+ APPEND */ INTO fact_sales
SELECT * FROM ext_fact_sales;
COMMIT;
```

### Oracle SQL*Loader (direct path load)

```
-- SQL*Loader control file: fact_sales.ctl
OPTIONS (DIRECT=TRUE, PARALLEL=TRUE, ROWS=10000, ERRORS=100)
LOAD DATA
INFILE '/opt/oracle/data/staging/fact_sales_*.csv'
APPEND
INTO TABLE fact_sales
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
TRAILING NULLCOLS
(
    sale_id,
    sale_date    DATE "YYYY-MM-DD",
    product_id,
    customer_id,
    sale_amount,
    region_code
)
```

```bash
sqlldr userid=myuser/mypass@mydb control=fact_sales.ctl log=fact_sales.log
```

---

## Workload Management (WLM) → Oracle Resource Manager

Redshift WLM allocates memory and concurrency slots across query queues. Oracle's equivalent is the Database Resource Manager (DBRM).

### Redshift WLM Concepts

- **Query queues:** Named queues with memory percentage and concurrency slot allocations.
- **Queue assignment:** Based on user group or query group labels.
- **Short query acceleration (SQA):** Automatic prioritization of short-running queries.

### Oracle Resource Manager Equivalent

```sql
-- Create resource manager plan
BEGIN
    DBMS_RESOURCE_MANAGER.CREATE_PENDING_AREA();

    -- Create consumer groups
    DBMS_RESOURCE_MANAGER.CREATE_CONSUMER_GROUP(
        consumer_group => 'ANALYTICS_HIGH',
        comment        => 'High-priority analytics queries'
    );
    DBMS_RESOURCE_MANAGER.CREATE_CONSUMER_GROUP(
        consumer_group => 'ANALYTICS_LOW',
        comment        => 'Low-priority batch analytics'
    );

    -- Create resource plan
    DBMS_RESOURCE_MANAGER.CREATE_PLAN(
        plan    => 'ANALYTICS_PLAN',
        comment => 'Resource plan for analytics workload'
    );

    -- Set plan directives (CPU allocation)
    DBMS_RESOURCE_MANAGER.CREATE_PLAN_DIRECTIVE(
        plan             => 'ANALYTICS_PLAN',
        group_or_subplan => 'ANALYTICS_HIGH',
        comment          => 'High priority — 60% CPU',
        cpu_p1           => 60
    );
    DBMS_RESOURCE_MANAGER.CREATE_PLAN_DIRECTIVE(
        plan             => 'ANALYTICS_PLAN',
        group_or_subplan => 'ANALYTICS_LOW',
        comment          => 'Low priority — 20% CPU',
        cpu_p1           => 20
    );
    DBMS_RESOURCE_MANAGER.CREATE_PLAN_DIRECTIVE(
        plan             => 'ANALYTICS_PLAN',
        group_or_subplan => 'OTHER_GROUPS',
        comment          => 'Remainder',
        cpu_p1           => 20
    );

    DBMS_RESOURCE_MANAGER.VALIDATE_PENDING_AREA();
    DBMS_RESOURCE_MANAGER.SUBMIT_PENDING_AREA();
END;
/

-- Activate the plan
ALTER SYSTEM SET RESOURCE_MANAGER_PLAN = 'ANALYTICS_PLAN';

-- Assign users to consumer groups
EXEC DBMS_RESOURCE_MANAGER_PRIVS.GRANT_SWITCH_CONSUMER_GROUP('analyst_user', 'ANALYTICS_HIGH', FALSE);
BEGIN
    DBMS_RESOURCE_MANAGER.SET_INITIAL_CONSUMER_GROUP('analyst_user', 'ANALYTICS_HIGH');
END;
/
```

---

## Columnar to Row-Based Considerations

When moving analytical workloads from Redshift's columnar storage to Oracle's row-based storage:

### Query Patterns to Review

1. **Wide-table scans selecting few columns:** Redshift excels here because columnar storage only reads needed columns. Oracle full-table scans read entire row blocks. Mitigate with:
   - Oracle In-Memory Column Store (selected tables/columns)
   - Appropriate indexes on filter columns
   - Partition pruning

2. **Aggregate-heavy queries:** Redshift's vectorized columnar aggregation is very fast. Oracle's parallel query engine with IMCS can match this for in-memory data, but disk-based aggregations will be slower.

3. **High-cardinality joins:** Both databases handle joins similarly at the SQL level, but execution plans will differ. Review Oracle explain plans for hash join vs nested loop choices.

### Performance Tuning Checklist for Redshift-to-Oracle

```sql
-- Check if IMCS is being used
SELECT segment_name, bytes, inmemory_size, bytes_not_populated
FROM v$im_segments
WHERE segment_name = 'FACT_SALES';

-- Check parallel query degree
SELECT degree FROM user_tables WHERE table_name = 'FACT_SALES';

-- Enable parallel query on a table
ALTER TABLE fact_sales PARALLEL (DEGREE 8);

-- Gather fresh statistics after load
EXEC DBMS_STATS.GATHER_TABLE_STATS('MYSCHEMA', 'FACT_SALES', CASCADE => TRUE);

-- Check partition pruning in explain plan
EXPLAIN PLAN FOR
SELECT SUM(sale_amount) FROM fact_sales WHERE sale_date >= DATE '2024-01-01';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(FORMAT => 'ALL'));
```

---

## Best Practices

1. **Profile your Redshift queries before migrating.** Export STL_QUERY and STL_SCAN logs to understand which tables are scanned most frequently and with what filter predicates. This drives the Oracle partitioning and IMCS strategy.

2. **Do not over-index.** Redshift uses zone maps (block-level min/max statistics) automatically. Oracle uses B-tree indexes, which require maintenance overhead. Add indexes only where queries actually benefit.

3. **Enable compression on large Oracle tables.** Use Advanced Compression or IMCS compression to reduce storage and I/O:
   ```sql
   ALTER TABLE fact_sales COMPRESS FOR OLTP;  -- or COMPRESS BASIC for read-mostly
   ```

4. **Use Oracle's parallel DML for bulk loads.** Enable parallel DML for the session before large INSERT...SELECT operations:
   ```sql
   ALTER SESSION ENABLE PARALLEL DML;
   INSERT /*+ APPEND PARALLEL(t, 8) */ INTO fact_sales t SELECT ... FROM ext_fact_sales;
   ```

5. **Monitor PGA and SGA sizing.** Redshift manages memory automatically per slice. Oracle requires DBA tuning of SGA (buffer cache, shared pool, IMCS) and PGA (sort area, hash join area). Use Automatic Memory Management (AMM) or Automatic Shared Memory Management (ASMM) as a starting point.

---

## Common Migration Pitfalls

**Pitfall 1 — Assuming Redshift SQL is standard SQL.** Redshift includes many PostgreSQL-derived extensions and AWS-specific functions. Not everything that works in Redshift is valid SQL and some of it will not translate to Oracle.

**Pitfall 2 — Distribution-key assumptions in application code.** Application code that uses distribution keys for routing (rare but possible in advanced ETL) has no Oracle equivalent. Redesign those patterns.

**Pitfall 3 — SUPER type migrations.** Redshift SUPER columns contain JSON-like semi-structured data. Map these to Oracle JSON columns (21c+) or CLOB with IS JSON constraints. PartiQL queries against SUPER need to be rewritten using Oracle's JSON_VALUE, JSON_TABLE, and JSON_QUERY functions.

**Pitfall 4 — Redshift UNLOAD → Oracle external tables.** Redshift UNLOAD exports to S3. Oracle external tables read from the local filesystem or NFS. Download S3 files to a staging server accessible by the Oracle host before loading.

**Pitfall 5 — Redshift late-binding views.** Redshift supports late-binding views that reference tables that do not yet exist at view creation time. Oracle does not; all referenced objects must exist and be accessible when the view is compiled.

**Pitfall 6 — ZEROIFNULL and EMPTYSTRING equivalents:**
```sql
-- Redshift
SELECT ZEROIFNULL(revenue) FROM sales;

-- Oracle
SELECT NVL(revenue, 0) FROM sales;
SELECT COALESCE(revenue, 0) FROM sales;
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference — Data Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database 19c SQL Language Reference — CREATE TABLE (Partitioning)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database 19c VLDB and Partitioning Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/vldbg/)
- [Oracle Database 19c In-Memory Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/inmem/)
- [Oracle Database 19c PL/SQL Packages Reference — DBMS_RESOURCE_MANAGER](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_RESOURCE_MANAGER.html)
- [Oracle Database 19c Utilities — SQL*Loader](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader.html)
- [Oracle Database 19c Administrator's Guide — External Tables](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/managing-tables.html)
