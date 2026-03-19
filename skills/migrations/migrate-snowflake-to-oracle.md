# Migrating Snowflake to Oracle

## Overview

Snowflake is a cloud-native data platform with a unique architecture: separated storage and compute, virtual warehouses for on-demand processing, and a SQL dialect that blends PostgreSQL-style syntax with Snowflake-specific extensions. Oracle is a traditional shared-disk RDBMS that can be deployed on-premises, in the cloud (Oracle Cloud Infrastructure), or as Oracle Autonomous Database. Migrating from Snowflake to Oracle typically involves analytical workloads moving to Oracle Autonomous Data Warehouse (ADW) or on-premises Oracle Data Warehouse configurations.

Key differences include Snowflake's semi-structured data types (VARIANT, OBJECT, ARRAY), Snowflake's time travel feature (vs Oracle Flashback), virtual warehouse sizing (vs Oracle resource management), and SQL dialect differences.

---

## Snowflake Architecture → Oracle Architecture

### Organization / Account / Database / Schema / Table

```
Snowflake hierarchy:            Oracle hierarchy:
Organization                    (Cloud Account or Data Center)
└── Account                     └── Oracle Instance / CDB
    └── Database                    └── PDB (Pluggable Database)
        └── Schema                      └── Schema (= User)
            └── Table/View                  └── Table/View
```

**Key translation decisions:**

| Snowflake Object | Oracle Equivalent | Notes |
|---|---|---|
| Snowflake account | Oracle instance or CDB | One-to-one mapping at the highest level |
| Snowflake database | Oracle PDB or schema | Use a PDB per logical database if using CDB |
| Snowflake schema | Oracle schema (= user) | Create one Oracle user per Snowflake schema |
| Virtual warehouse | Oracle resource plan / parallel settings | Not a direct equivalent — see Resource Manager section |
| Stage (internal/external) | Oracle directory + external tables | |
| Snowpipe | Oracle GoldenGate / Oracle Data Integrator | Continuous loading pipelines |
| Task / Stream | Oracle Scheduler + materialized view logs | For incremental processing |
| Time Travel | Oracle Flashback | See Flashback section |

### Virtual Warehouse → Oracle Parallelism

Snowflake virtual warehouses are compute clusters sized by T-shirt sizes (X-Small through 6X-Large). Oracle parallelism is configured via:

```sql
-- Set parallel degree for a table (analogous to a larger warehouse)
ALTER TABLE fact_sales PARALLEL (DEGREE 16);

-- Enable parallel DML for a session (for bulk operations)
ALTER SESSION ENABLE PARALLEL DML;

-- Resource Manager plan for multi-user workload isolation
-- (analogous to Snowflake multi-cluster warehouses)
-- See oracle-migration-tools.md for full DBMS_RESOURCE_MANAGER example
```

---

## Data Type Mapping

### Standard Types

| Snowflake | Oracle | Notes |
|---|---|---|
| `NUMBER(p,s)` / `DECIMAL(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `INT` / `INTEGER` | `NUMBER(38,0)` | Snowflake INTEGER = NUMBER(38,0) |
| `BIGINT` | `NUMBER(19)` | |
| `SMALLINT` | `NUMBER(5)` | |
| `TINYINT` | `NUMBER(3)` | |
| `FLOAT` / `FLOAT4` / `FLOAT8` | `BINARY_DOUBLE` | |
| `DOUBLE` / `DOUBLE PRECISION` | `BINARY_DOUBLE` | |
| `REAL` | `BINARY_FLOAT` | |
| `VARCHAR(n)` | `VARCHAR2(n)` | Snowflake max 16,777,216; Oracle max 4,000 (32,767 extended) |
| `CHAR(n)` | `CHAR(n)` | |
| `STRING` | `VARCHAR2(4000)` or `CLOB` | Snowflake alias for VARCHAR |
| `TEXT` | `CLOB` | |
| `BOOLEAN` | `NUMBER(1)` with CHECK or Oracle 23c BOOLEAN | |
| `DATE` | `DATE` | Snowflake DATE is date-only; Oracle DATE includes time |
| `TIME(n)` | `VARCHAR2(15)` or store as seconds | Oracle has no TIME type |
| `TIMESTAMP_NTZ(n)` | `TIMESTAMP(n)` | No timezone |
| `TIMESTAMP_LTZ(n)` | `TIMESTAMP(n) WITH LOCAL TIME ZONE` | Local timezone |
| `TIMESTAMP_TZ(n)` | `TIMESTAMP(n) WITH TIME ZONE` | With explicit timezone offset |
| `BINARY` / `VARBINARY` | `RAW(n)` or `BLOB` | |

### Semi-Structured Types: VARIANT, OBJECT, ARRAY → Oracle JSON

This is the most significant type translation challenge when migrating from Snowflake.

| Snowflake | Oracle | Notes |
|---|---|---|
| `VARIANT` | `JSON` (21c+) or `CLOB IS JSON` | Universal semi-structured type |
| `OBJECT` | `JSON` with object at root | JSON object |
| `ARRAY` | `JSON` with array at root | JSON array |

```sql
-- Snowflake: storing semi-structured event data
CREATE TABLE events (
    event_id    NUMBER,
    event_ts    TIMESTAMP_TZ,
    payload     VARIANT    -- can hold any JSON structure
);

-- Oracle 21c+ equivalent
CREATE TABLE events (
    event_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_ts    TIMESTAMP WITH TIME ZONE,
    payload     JSON
);

-- Oracle 12c-20c equivalent
CREATE TABLE events (
    event_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_ts    TIMESTAMP WITH TIME ZONE,
    payload     CLOB,
    CONSTRAINT chk_events_json CHECK (payload IS JSON)
);
```

---

## Snowflake SQL Dialect → Oracle SQL

### Snowflake VARIANT Access → Oracle JSON Functions

Snowflake allows colon `:` and dot `.` notation to navigate VARIANT data:

```sql
-- Snowflake: access nested JSON fields in VARIANT column
SELECT
    event_id,
    payload:user_id::NUMBER AS user_id,
    payload:action::VARCHAR AS action,
    payload:metadata:region::VARCHAR AS region
FROM events;

-- Oracle: equivalent using JSON_VALUE
SELECT
    event_id,
    JSON_VALUE(payload, '$.user_id')  AS user_id,
    JSON_VALUE(payload, '$.action')   AS action,
    JSON_VALUE(payload, '$.metadata.region') AS region
FROM events;

-- Oracle: access array element
-- Snowflake: payload:items[0]:sku::VARCHAR
JSON_VALUE(payload, '$.items[0].sku')
```

### Snowflake FLATTEN → Oracle JSON_TABLE

Snowflake's `FLATTEN` function expands arrays into rows:

```sql
-- Snowflake: flatten array
SELECT
    e.event_id,
    f.value:sku::VARCHAR AS sku,
    f.value:qty::NUMBER  AS qty
FROM events e,
     LATERAL FLATTEN(input => e.payload:items) f;

-- Oracle: equivalent using JSON_TABLE
SELECT
    e.event_id,
    jt.sku,
    jt.qty
FROM events e,
     JSON_TABLE(e.payload, '$.items[*]'
         COLUMNS (
             sku VARCHAR2(100) PATH '$.sku',
             qty NUMBER        PATH '$.qty'
         )
     ) jt;
```

### PARSE_JSON → JSON Literals

```sql
-- Snowflake: parse a JSON string
SELECT PARSE_JSON('{"key": "value"}') AS obj;
INSERT INTO t (data) VALUES (PARSE_JSON('{"a": 1, "b": 2}'));

-- Oracle: JSON values are just strings with IS JSON validation
INSERT INTO t (data) VALUES ('{"a": 1, "b": 2}');
-- For Oracle 21c+ JSON type, the column accepts JSON strings directly
```

### Snowflake OBJECT_CONSTRUCT → JSON_OBJECT

```sql
-- Snowflake: construct JSON object from columns
SELECT OBJECT_CONSTRUCT('name', first_name, 'email', email) AS contact
FROM customers;

-- Oracle 12c+
SELECT JSON_OBJECT('name' VALUE first_name, 'email' VALUE email) AS contact
FROM customers;
```

### Snowflake ARRAY_AGG → JSON_ARRAYAGG

```sql
-- Snowflake: aggregate rows into an array
SELECT customer_id, ARRAY_AGG(product_id) AS products
FROM order_items
GROUP BY customer_id;

-- Oracle 12c+
SELECT customer_id, JSON_ARRAYAGG(product_id) AS products
FROM order_items
GROUP BY customer_id;

-- Oracle: traditional string aggregation
SELECT customer_id, LISTAGG(TO_CHAR(product_id), ',') WITHIN GROUP (ORDER BY product_id)
FROM order_items
GROUP BY customer_id;
```

### QUALIFY → Window Function Subquery

Snowflake supports `QUALIFY` to filter on window function results inline:

```sql
-- Snowflake: keep only the latest order per customer
SELECT customer_id, order_id, order_date
FROM orders
QUALIFY ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) = 1;

-- Oracle: requires a subquery or CTE
SELECT customer_id, order_id, order_date
FROM (
    SELECT customer_id, order_id, order_date,
           ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn
    FROM orders
)
WHERE rn = 1;
```

### Snowflake-Specific Functions

| Snowflake Function | Oracle Equivalent |
|---|---|
| `ZEROIFNULL(n)` | `NVL(n, 0)` |
| `NULLIFZERO(n)` | `NULLIF(n, 0)` |
| `IFF(cond, t, f)` | `CASE WHEN cond THEN t ELSE f END` or `DECODE` |
| `BOOLAND_AGG(col)` | `MIN(CASE WHEN col = TRUE THEN 1 ELSE 0 END) = 1` |
| `BOOLOR_AGG(col)` | `MAX(CASE WHEN col = TRUE THEN 1 ELSE 0 END) = 1` |
| `DIV0(a, b)` | `CASE WHEN b = 0 THEN 0 ELSE a/b END` |
| `SQUARE(n)` | `POWER(n, 2)` |
| `CBRT(n)` | `POWER(n, 1/3)` |
| `HAVERSINE(lat1, lon1, lat2, lon2)` | Custom PL/SQL function using spherical trigonometry |
| `STRTOK(s, delim, n)` | `REGEXP_SUBSTR(s, '[^' \|\| delim \|\| ']+', 1, n)` |
| `EDITDISTANCE(s1, s2)` | `UTL_MATCH.EDIT_DISTANCE(s1, s2)` |
| `SOUNDEX(s)` | `SOUNDEX(s)` — same |
| `JAROWINKLER_SIMILARITY(s1, s2)` | `UTL_MATCH.JARO_WINKLER_SIMILARITY(s1, s2)` |
| `HASH(expr)` | `ORA_HASH(expr)` |
| `UUID_STRING()` | `LOWER(REGEXP_REPLACE(RAWTOHEX(SYS_GUID()), '(.{8})(.{4})(.{4})(.{4})(.{12})', '\1-\2-\3-\4-\5'))` |
| `GENERATOR(rowcount => n)` | `SELECT LEVEL FROM DUAL CONNECT BY LEVEL <= n` |
| `SEQ4()` / `SEQ8()` | `ROWNUM` or `ROW_NUMBER() OVER (ORDER BY 1)` |
| `UNIFORM(min, max, RANDOM())` | `DBMS_RANDOM.VALUE(min, max)` |
| `NORMAL(mean, std, RANDOM())` | Custom PL/SQL using Box-Muller transform |

### String Functions

| Snowflake | Oracle Equivalent |
|---|---|
| `CONCAT_WS(sep, a, b, c)` | `a \|\| sep \|\| b \|\| sep \|\| c` (manual) |
| `SPLIT(s, delim)` | No direct equivalent; use `REGEXP_SUBSTR` in a loop |
| `SPLIT_PART(s, delim, n)` | `REGEXP_SUBSTR(s, '[^' \|\| delim \|\| ']+', 1, n)` |
| `CHARINDEX(sub, s [, start])` | `INSTR(s, sub [, start])` |
| `CONTAINS(s, sub)` | `INSTR(s, sub) > 0` |
| `STARTSWITH(s, prefix)` | `s LIKE prefix \|\| '%'` |
| `ENDSWITH(s, suffix)` | `s LIKE '%' \|\| suffix` |
| `LTRIM(s, chars)` | `LTRIM(s, chars)` — same |
| `RTRIM(s, chars)` | `RTRIM(s, chars)` — same |
| `BASE64_ENCODE(s)` | `UTL_ENCODE.BASE64_ENCODE(UTL_I18N.STRING_TO_RAW(s))` |
| `BASE64_DECODE_STRING(s)` | `UTL_I18N.RAW_TO_CHAR(UTL_ENCODE.BASE64_DECODE(s))` |
| `HEX_ENCODE(s)` | `RAWTOHEX(UTL_I18N.STRING_TO_RAW(s, 'AL32UTF8'))` |
| `TRY_CAST(val AS type)` | `CAST(val AS type)` + exception handling in PL/SQL |
| `TRY_TO_NUMBER(s)` | Use `VALIDATE_CONVERSION(s AS NUMBER)` (Oracle 12.2+) |

---

## Snowflake Time Travel → Oracle Flashback

Snowflake Time Travel allows querying historical data up to 90 days in the past using `AT(TIMESTAMP => ...)` or `BEFORE(STATEMENT => ...)` syntax. Oracle's **Flashback** feature provides equivalent capability.

### Time Travel at a Point in Time

```sql
-- Snowflake: query table as it was at a specific timestamp
SELECT * FROM orders AT(TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP_TZ);

-- Snowflake: query before a specific transaction
SELECT * FROM orders BEFORE(STATEMENT => '8e5d0ca9-005e-44e6-b858-a8f5b37c5726');

-- Oracle Flashback Query: query table as of a past time
SELECT * FROM orders AS OF TIMESTAMP
    TO_TIMESTAMP('2024-01-15 10:00:00', 'YYYY-MM-DD HH24:MI:SS');

-- Oracle Flashback Query: query as of n minutes ago
SELECT * FROM orders AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '30' MINUTE);

-- Oracle Flashback Query: query as of a specific SCN (System Change Number)
SELECT * FROM orders AS OF SCN 5000000;
```

### Undo Data vs Time Travel

```
Snowflake Time Travel:           Oracle Flashback:
- Up to 90 days (Enterprise)     - Controlled by UNDO_RETENTION parameter
- 1 day (Standard)               - Default: 15 minutes; tunable to days/weeks
- Stored in cloud storage        - Stored in UNDO tablespace (or Flashback DB logs)
- Per-account retention          - Per-database/per-table retention
- Queryable via AT/BEFORE        - Queryable via AS OF TIMESTAMP/SCN
```

### Configuring Oracle Flashback Retention

```sql
-- Check current undo retention
SHOW PARAMETER UNDO_RETENTION;

-- Extend undo retention for longer flashback capability (in seconds)
ALTER SYSTEM SET UNDO_RETENTION = 86400;  -- 1 day

-- Enable Flashback Database (requires archivelog mode)
ALTER DATABASE FLASHBACK ON;
ALTER SYSTEM SET DB_FLASHBACK_RETENTION_TARGET = 4320;  -- 3 days in minutes

-- Check guaranteed undo retention on a tablespace
ALTER TABLESPACE undotbs1 RETENTION GUARANTEE;
```

### Flashback Table (Restore to Past State)

```sql
-- Snowflake: clone a table from Time Travel to create a restore point
CREATE TABLE orders_backup CLONE orders AT(TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP_TZ);

-- Oracle: Flashback Table (restore to a past state)
-- Requires row movement to be enabled
ALTER TABLE orders ENABLE ROW MOVEMENT;
FLASHBACK TABLE orders TO TIMESTAMP
    TO_TIMESTAMP('2024-01-15 10:00:00', 'YYYY-MM-DD HH24:MI:SS');
```

---

## Snowflake COPY INTO → Oracle External Tables / Data Pump

### Snowflake COPY INTO (from stage)

```sql
-- Snowflake: load from internal/external stage
COPY INTO orders
FROM @my_s3_stage/data/orders/
FILE_FORMAT = (TYPE = 'PARQUET')
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;
```

### Oracle External Table Equivalent

```sql
-- Create Oracle directory object
CREATE OR REPLACE DIRECTORY stage_dir AS '/opt/oracle/staging';

-- External table for CSV files
CREATE TABLE ext_orders (
    order_id    NUMBER,
    customer_id NUMBER,
    order_date  DATE,
    total       NUMBER(15,2)
)
ORGANIZATION EXTERNAL (
    TYPE ORACLE_LOADER
    DEFAULT DIRECTORY stage_dir
    ACCESS PARAMETERS (
        RECORDS DELIMITED BY NEWLINE
        SKIP 1
        FIELDS TERMINATED BY ','
        OPTIONALLY ENCLOSED BY '"'
        MISSING FIELD VALUES ARE NULL
        (
            order_id,
            customer_id,
            order_date DATE "YYYY-MM-DD",
            total
        )
    )
    LOCATION ('orders_*.csv')
)
REJECT LIMIT UNLIMITED;

-- Load into physical table
INSERT /*+ APPEND PARALLEL(t, 8) */ INTO orders t
SELECT * FROM ext_orders;
COMMIT;
```

---

## Snowflake Streams and Tasks → Oracle Change Data Capture

Snowflake Streams capture DML changes on a table; Tasks are scheduled procedures that process streams.

```
Snowflake Streams:               Oracle Equivalent:
- Change tracking on tables      - Materialized View Logs
- Captures INSERT/UPDATE/DELETE  - LogMiner / GoldenGate
- Consumed by tasks/queries      - Oracle Scheduler for processing
```

### Materialized View Log for Incremental Processing

```sql
-- Create a materialized view log on a source table (tracks changes)
CREATE MATERIALIZED VIEW LOG ON orders
WITH ROWID, SEQUENCE
(order_id, status, total, updated_at)
INCLUDING NEW VALUES;

-- Fast refresh materialized view consumes the log
CREATE MATERIALIZED VIEW mv_order_summary
REFRESH FAST ON DEMAND
AS
SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent
FROM orders
GROUP BY customer_id;

-- Scheduled refresh (analogous to a Snowflake Task)
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name        => 'REFRESH_ORDER_SUMMARY',
        job_type        => 'PLSQL_BLOCK',
        job_action      => 'BEGIN DBMS_MVIEW.REFRESH(''MV_ORDER_SUMMARY'', ''F''); END;',
        repeat_interval => 'FREQ=MINUTELY;INTERVAL=5',
        enabled         => TRUE
    );
END;
/
```

---

## Best Practices

1. **Map Snowflake databases to Oracle PDBs or schemas systematically.** Document the hierarchy before migrating to avoid confusion about where objects land.

2. **Re-evaluate VARCHAR size constraints.** Snowflake VARCHAR can be up to 16 MB. Oracle VARCHAR2 is limited to 4,000 bytes (32,767 with extended). Survey actual column lengths and use CLOB for long text:
   ```sql
   -- Snowflake: survey max lengths
   SELECT MAX(LENGTH(description)) FROM products;
   ```

3. **Redesign VARIANT columns explicitly.** Every VARIANT column needs a specific mapping decision: fully normalize, store as JSON, or use Duality View. Make this decision early based on query patterns.

4. **Replace Snowflake's schema-on-read with schema-on-write.** Snowflake VARIANT lets you store arbitrary data and decide schema later. Oracle requires defined schemas upfront. Use the migration as an opportunity to define proper types.

5. **Test Flashback configuration before cutover.** Ensure UNDO_RETENTION and UNDO tablespace size support the flashback window required to match Snowflake's Time Travel guarantees.

6. **Benchmark parallel query configuration.** Snowflake automatically scales compute for large queries. Oracle requires tuning the PARALLEL clause and PGA/SGA sizes. Run representative queries and adjust degree of parallelism accordingly.

---

## Common Migration Pitfalls

**Pitfall 1 — TIMESTAMP_NTZ vs Oracle TIMESTAMP:**
Snowflake TIMESTAMP_NTZ has no timezone. Oracle TIMESTAMP also has no timezone. The mapping is correct — but applications that implicitly assume UTC for TIMESTAMP_NTZ must store the timezone assumption explicitly when migrating.

**Pitfall 2 — BOOLEAN in WHERE clauses:**
```sql
-- Snowflake
WHERE is_active = TRUE
-- Oracle (23ai/26ai BOOLEAN or NUMBER-based)
WHERE is_active = 1   -- for NUMBER(1) mapping
WHERE is_active       -- for Oracle 23ai/26ai native BOOLEAN
```

**Pitfall 3 — Snowflake's permissive type coercion:**
Snowflake silently coerces strings to numbers in arithmetic. Oracle does this in some contexts but raises errors in others. Test all arithmetic expressions.

**Pitfall 4 — Case sensitivity:**
Snowflake is case-insensitive for unquoted identifiers (uppercase by default, just like Oracle). This is one of the more compatible areas — but verify quoted identifier usage in Snowflake code, as those are case-sensitive.

**Pitfall 5 — VARIANT NULL vs SQL NULL:**
In Snowflake, a VARIANT column can contain both SQL NULL (absence of value) and a JSON null literal. Oracle's JSON NULL is distinct from SQL NULL in similar ways. Review null handling in JSON extraction queries.

**Pitfall 6 — Snowflake Iceberg tables:**
If the Snowflake account uses Apache Iceberg tables backed by S3/Azure, the data files (Parquet) can be read directly by Oracle External Tables using Oracle's ORC/Parquet access driver, bypassing Snowflake entirely for the extraction phase.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference — Data Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database 19c SQL Language Reference — JSON_VALUE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/JSON_VALUE.html)
- [Oracle Database 19c SQL Language Reference — JSON_TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/JSON_TABLE.html)
- [Oracle Database 19c JSON Developer's Guide — Overview of Oracle Database Support for JSON](https://docs.oracle.com/en/database/oracle/oracle-database/19/adjsn/json-in-oracle-database.html)
- [Oracle Database 19c Administrator's Guide — Using Oracle Flashback Technology](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/using-oracle-flashback-technology.html)
- [Oracle Database 19c PL/SQL Packages Reference — DBMS_SCHEDULER](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SCHEDULER.html)
- [Oracle Database 19c Utilities — SQL*Loader](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader.html)
