# Migrating Teradata to Oracle

## Overview

Teradata is a purpose-built analytical data warehouse optimized for massively parallel processing (MPP) of large analytical workloads. Oracle Database, particularly Oracle Autonomous Data Warehouse (ADW) and Oracle Exadata, serves as the primary migration target. Both are enterprise-grade platforms, but they differ substantially in SQL dialect, architectural model, data loading tools, and analytical capabilities.

This guide covers Teradata-specific SQL syntax (including BTEQ and SEL shorthand), multiset vs set table semantics, data type mapping, the QUALIFY clause, Teradata-specific aggregates, and migrating from Teradata's TPT (Teradata Parallel Transporter) to Oracle SQL*Loader or Data Pump.

---

## Teradata SQL Dialect

### SEL Shorthand and BTEQ Commands

Teradata uses `SEL` as shorthand for `SELECT`, and BTEQ (Basic Teradata Query) adds scripting commands with `.` prefix:

```sql
-- Teradata BTEQ session
.LOGON myhost/myuser,mypassword;
.SET WIDTH 200;
.SET TITLEDASHES OFF;

SEL * FROM customers WHERE cust_id = 12345;
SEL COUNT(*) FROM orders;

-- Insert using SEL
INSERT INTO archive_orders SEL * FROM orders WHERE order_date < '2020-01-01' (DATE);

.LOGOFF;
.QUIT;
```

```sql
-- Oracle SQL*Plus equivalent
CONNECT myuser/mypassword@myhost:1521/MYDB
SET LINESIZE 200
SET UNDERLINE OFF

SELECT * FROM customers WHERE cust_id = 12345;
SELECT COUNT(*) FROM orders;

-- Insert using subquery
INSERT INTO archive_orders SELECT * FROM orders WHERE order_date < DATE '2020-01-01';

EXIT;
```

### BTEQ → SQL*Plus/SQLcl Command Mapping

| BTEQ Command | SQL*Plus/SQLcl Equivalent |
|---|---|
| `.LOGON host/user,pass` | `CONNECT user/pass@host` |
| `.LOGOFF` | `DISCONNECT` |
| `.QUIT` | `EXIT` |
| `.SET WIDTH n` | `SET LINESIZE n` |
| `.SET MAXERROR n` | `WHENEVER SQLERROR EXIT` |
| `.EXPORT FILE=out.txt` | `SPOOL out.txt` |
| `.EXPORT RESET` | `SPOOL OFF` |
| `.IF ERRORCODE <> 0 THEN .QUIT 12` | `WHENEVER SQLERROR EXIT 12` |
| `.SYSTEM cmd` | `HOST cmd` or `!cmd` |
| `.REMARK text` | `-- text` or `REM text` |
| `SHOW TABLE tbl` | `DESC tbl` |

### Teradata SELECT Syntax Variations

```sql
-- Teradata: column alias without AS (optional AS)
SEL
    cust_id               (INTEGER),     -- explicit type cast in output
    first_name (CHAR(50)) customer,      -- format and alias
    last_name             ln,            -- positional alias
    order_date (FORMAT 'YYYY-MM-DD')     -- output format
FROM customers;

-- Oracle equivalent
SELECT
    CAST(cust_id AS NUMBER(10))  AS cust_id,
    RPAD(first_name, 50)         AS customer,
    last_name                    AS ln,
    TO_CHAR(order_date, 'YYYY-MM-DD') AS order_date
FROM customers;
```

---

## Multiset vs Set Tables

This is one of the most important Teradata concepts to understand before migrating.

### Teradata Table Semantics

In Teradata:
- **SET table** (the default in older TD): duplicate rows are silently rejected at insert time based on the Primary Index (PI) or unique constraints. No error, no insert.
- **MULTISET table**: allows duplicate rows (standard SQL behavior).

```sql
-- Teradata SET table (default): duplicates are silently discarded
CREATE SET TABLE customers, NO FALLBACK (
    cust_id     INTEGER     NOT NULL,
    cust_name   VARCHAR(100)
)
PRIMARY INDEX (cust_id);

-- Teradata MULTISET table: allows duplicates
CREATE MULTISET TABLE fact_events, NO FALLBACK (
    event_id    BIGINT,
    event_type  VARCHAR(50),
    event_date  DATE
)
PRIMARY INDEX (event_id);
```

### Oracle Equivalent

Oracle tables allow duplicates by default (equivalent to MULTISET). To enforce uniqueness, add a PRIMARY KEY or UNIQUE constraint.

```sql
-- Oracle equivalent of SET table (unique enforcement via constraint)
CREATE TABLE customers (
    cust_id   NUMBER(10)   NOT NULL,
    cust_name VARCHAR2(100),
    CONSTRAINT pk_customers PRIMARY KEY (cust_id)
);

-- Oracle equivalent of MULTISET table (no uniqueness enforcement)
CREATE TABLE fact_events (
    event_id   NUMBER(19),
    event_type VARCHAR2(50),
    event_date DATE
);
-- Note: no primary key means duplicates are allowed
```

**Critical migration issue:** If your Teradata SET tables have been relying on silent duplicate rejection as a data cleansing mechanism, that behavior will NOT exist in Oracle. Data that "just worked" in Teradata (duplicates silently dropped) will cause ORA-00001 (unique constraint violated) errors in Oracle if you add primary key constraints. Profile your data for duplicates before applying constraints.

---

## Data Type Mapping

### Numeric Types

| Teradata | Oracle | Notes |
|---|---|---|
| `BYTEINT` | `NUMBER(3)` | −128 to 127 |
| `SMALLINT` | `NUMBER(5)` | |
| `INTEGER` / `INT` | `NUMBER(10)` | |
| `BIGINT` | `NUMBER(19)` | |
| `DECIMAL(p,s)` / `DEC(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `NUMERIC(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `FLOAT` / `REAL` | `BINARY_FLOAT` | IEEE 754 |
| `DOUBLE PRECISION` | `BINARY_DOUBLE` | |
| `NUMBER(n)` | `NUMBER(n)` | |
| `BYTEINT` | `NUMBER(3)` | Teradata-specific 1-byte integer |

### String Types

| Teradata | Oracle | Notes |
|---|---|---|
| `CHAR(n)` | `CHAR(n)` | Teradata max 64,000 bytes; Oracle max 2,000 |
| `VARCHAR(n)` / `CHAR VARYING(n)` | `VARCHAR2(n)` | Teradata max 64,000; Oracle max 4,000/32,767 |
| `LONG VARCHAR` | `CLOB` | Deprecated in Teradata; max ~64K |
| `CLOB(n)` | `CLOB` | Character large object |
| `BYTE(n)` | `RAW(n)` | Fixed-length binary |
| `VARBYTE(n)` | `RAW(n)` | Variable-length binary |
| `BLOB(n)` | `BLOB` | Binary large object |

### Date / Time Types

| Teradata | Oracle | Notes |
|---|---|---|
| `DATE` | `DATE` | Teradata DATE is date-only; Oracle DATE includes time |
| `TIME(n)` | No equivalent | Store as `VARCHAR2(15)` or seconds |
| `TIMESTAMP(n)` | `TIMESTAMP(n)` | |
| `TIME WITH TIME ZONE` | `TIMESTAMP WITH TIME ZONE` | |
| `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP WITH TIME ZONE` | |

**Teradata DATE storage:** Teradata stores dates internally as integers in format (year-1900)*10000 + month*100 + day. Oracle stores dates as 7-byte internal format. This internal difference is transparent when using SQL, but matters for binary-level bulk data transfers.

```sql
-- Teradata: DATE arithmetic
SEL CURRENT_DATE + 30;             -- add 30 days
SEL CURRENT_DATE - CAST(7 AS INTEGER);

-- Oracle
SELECT SYSDATE + 30 FROM DUAL;
SELECT SYSDATE - 7 FROM DUAL;
```

### Special Teradata Types

| Teradata | Oracle | Notes |
|---|---|---|
| `INTERVAL YEAR` | `INTERVAL YEAR TO MONTH` | |
| `INTERVAL YEAR TO MONTH` | `INTERVAL YEAR TO MONTH` | |
| `INTERVAL DAY` | `INTERVAL DAY TO SECOND` | |
| `INTERVAL DAY TO SECOND` | `INTERVAL DAY TO SECOND` | |
| `PERIOD(DATE)` | Two DATE columns (start/end) | Teradata temporal period type; no Oracle equivalent |
| `PERIOD(TIMESTAMP)` | Two TIMESTAMP columns | |
| `JSON` | `JSON` (21c+) or `CLOB IS JSON` | |
| `ST_GEOMETRY` | `SDO_GEOMETRY` | Oracle Spatial |
| `XML` | `XMLTYPE` | |

---

## QUALIFY Clause → Subquery with Window Function

Teradata's `QUALIFY` is a filtering clause that applies to window function results, similar to `HAVING` for aggregates. No other major RDBMS supports `QUALIFY` natively (Snowflake does as well, but Oracle does not).

```sql
-- Teradata: keep only the top-ranked row per customer
SEL
    cust_id,
    order_id,
    order_date,
    total_amount
FROM orders
QUALIFY RANK() OVER (PARTITION BY cust_id ORDER BY order_date DESC) = 1;

-- Teradata: filter on row number for pagination
SEL * FROM products
QUALIFY ROW_NUMBER() OVER (ORDER BY price DESC) BETWEEN 11 AND 20;

-- Oracle equivalent: subquery or CTE
SELECT cust_id, order_id, order_date, total_amount
FROM (
    SELECT cust_id, order_id, order_date, total_amount,
           RANK() OVER (PARTITION BY cust_id ORDER BY order_date DESC) AS rnk
    FROM orders
)
WHERE rnk = 1;

-- Oracle pagination with CTE
WITH ranked AS (
    SELECT product_id, product_name, price,
           ROW_NUMBER() OVER (ORDER BY price DESC) AS rn
    FROM products
)
SELECT product_id, product_name, price
FROM ranked
WHERE rn BETWEEN 11 AND 20;
```

---

## Teradata-Specific Aggregates and Functions

### String Aggregation

```sql
-- Teradata: XML-based string aggregation (common workaround)
SELECT cust_id,
       TRIM(TRAILING ',' FROM
            XMLAGG(XMLELEMENT(NAME x, TRIM(product_name) || ',')
                   ORDER BY product_name).EXTRACT('//text()').GETCLOBVAL()
       ) AS products
FROM order_items
GROUP BY cust_id;

-- Oracle: LISTAGG (much cleaner)
SELECT cust_id,
       LISTAGG(product_name, ',') WITHIN GROUP (ORDER BY product_name) AS products
FROM order_items
GROUP BY cust_id;
```

### Statistical Functions

| Teradata Function | Oracle Equivalent |
|---|---|
| `PERCENTILE_CONT(p) WITHIN GROUP (ORDER BY col)` | `PERCENTILE_CONT(p) WITHIN GROUP (ORDER BY col)` — same |
| `PERCENTILE_DISC(p) WITHIN GROUP (ORDER BY col)` | `PERCENTILE_DISC(p) WITHIN GROUP (ORDER BY col)` — same |
| `REGR_SLOPE(y, x)` | `REGR_SLOPE(y, x)` — same |
| `REGR_INTERCEPT(y, x)` | `REGR_INTERCEPT(y, x)` — same |
| `CORR(y, x)` | `CORR(y, x)` — same |
| `STDDEV_SAMP(n)` | `STDDEV(n)` |
| `STDDEV_POP(n)` | `STDDEV_POP(n)` — same |
| `VAR_SAMP(n)` | `VARIANCE(n)` |
| `VAR_POP(n)` | `VAR_POP(n)` — same |
| `KURTOSIS(n)` | No built-in; use statistical package |
| `SKEWNESS(n)` | No built-in |

### Common Teradata Functions

| Teradata Function | Oracle Equivalent |
|---|---|
| `OREPLACE(s, old, new)` | `REPLACE(s, old, new)` |
| `OTRANSLATE(s, from, to)` | `TRANSLATE(s, from, to)` |
| `INDEX(s, sub)` | `INSTR(s, sub)` |
| `SUBSTRING(s FROM pos FOR len)` | `SUBSTR(s, pos, len)` |
| `CHARACTERS(s)` / `CHAR_LENGTH(s)` | `LENGTH(s)` |
| `BYTES(expr)` | `LENGTHB(expr)` |
| `TRIM(BOTH 'x' FROM s)` | `TRIM('x' FROM s)` |
| `ZEROIFNULL(n)` | `NVL(n, 0)` |
| `NULLIFZERO(n)` | `NULLIF(n, 0)` |
| `COALESCE(a, b, c)` | `COALESCE(a, b, c)` — same |
| `CASE` | `CASE` — same |
| `DECODE(...)` (TD 13.10+) | `DECODE(...)` — same |
| `HASHBUCKET(col)` | No equivalent (Teradata internal hash routing) |
| `HASHROW(col)` | `ORA_HASH(col)` (approximate) |
| `TD_NORMALIZE_OVERLAP` | No equivalent; use temporal SQL manually |
| `WEEKS_IN_YEAR(d)` | `CASE WHEN TO_CHAR(DATE '9999-12-28', 'IW') = '53' THEN 53 ELSE 52 END` |
| `DAY_OF_WEEK(d)` | `TO_NUMBER(TO_CHAR(d, 'D'))` |
| `MONTH_OF_YEAR(d)` | `EXTRACT(MONTH FROM d)` |

---

## Teradata Temporal Tables → Oracle Temporal Queries

Teradata has built-in support for temporal (bi-temporal) tables with `PERIOD` type columns and temporal DML. Oracle does not have a native bi-temporal SQL extension, but you can implement the same patterns manually.

```sql
-- Teradata temporal table
CREATE TABLE employee_salary (
    emp_id     INTEGER,
    salary     DECIMAL(10,2),
    valid_time PERIOD(DATE) NOT NULL AS VALIDTIME,
    trans_time PERIOD(TIMESTAMP(6) WITH TIME ZONE) NOT NULL AS TRANSACTIONTIME
)
PRIMARY INDEX (emp_id);

-- Oracle equivalent using explicit period columns
CREATE TABLE employee_salary (
    emp_id          NUMBER(10)    NOT NULL,
    salary          NUMBER(10,2)  NOT NULL,
    valid_from      DATE          NOT NULL,
    valid_to        DATE          DEFAULT DATE '9999-12-31' NOT NULL,
    transaction_from TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    transaction_to   TIMESTAMP WITH TIME ZONE DEFAULT TIMESTAMP '9999-12-31 00:00:00 UTC' NOT NULL,
    CONSTRAINT pk_emp_salary PRIMARY KEY (emp_id, valid_from, transaction_from)
);

-- Query current valid state
SELECT emp_id, salary
FROM employee_salary
WHERE valid_from <= TRUNC(SYSDATE) AND valid_to > TRUNC(SYSDATE)
  AND transaction_from <= SYSTIMESTAMP AND transaction_to > SYSTIMESTAMP;
```

---

## TPT (Teradata Parallel Transporter) → Oracle SQL*Loader / Data Pump

### Teradata TPT Export

```bash
# TPT export script (tbuild)
# File: export_orders.tpt
DEFINE JOB export_orders_job
DESCRIPTION 'Export orders to CSV'
(
    DEFINE OPERATOR export_oper
    TYPE EXPORT
    SCHEMA *
    ATTRIBUTES
    (
        VARCHAR DirectoryPath    = '/data/export',
        VARCHAR FileWritingRule  = 'Truncate',
        VARCHAR Format           = 'DELIMITED',
        VARCHAR OpenQuoteMark    = '"',
        VARCHAR CloseQuoteMark   = '"',
        VARCHAR TextDelimiter    = ','
    );

    DEFINE SCHEMA orders_schema
    (
        order_id     INTEGER,
        customer_id  INTEGER,
        order_date   DATE,
        total_amount DECIMAL(10,2)
    );

    STEP export_step
    (
        APPLY TO OPERATOR (export_oper)
        SELECT * FROM orders;
    );
);
```

```bash
tbuild -f export_orders.tpt
```

### Oracle SQL*Loader Import

After exporting from Teradata to CSV:

```
-- SQL*Loader control file: orders.ctl
OPTIONS (DIRECT=TRUE, PARALLEL=TRUE, ROWS=10000)
LOAD DATA
INFILE '/data/export/orders*.dat'
APPEND
INTO TABLE orders
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
TRAILING NULLCOLS
(
    order_id,
    customer_id,
    order_date    DATE "YYYY-MM-DD",
    total_amount
)
```

```bash
sqlldr userid=myuser/mypass@mydb control=orders.ctl log=orders.log
```

### Oracle Data Pump for Large Migrations

For Oracle-to-Oracle movements (where a staging Oracle database is used):

```bash
# Export from staging Oracle
expdp myuser/mypass@staging \
  DUMPFILE=orders_%U.dmp \
  LOGFILE=expdp_orders.log \
  TABLES=ORDERS \
  PARALLEL=4

# Import to target Oracle
impdp myuser/mypass@target \
  DUMPFILE=orders_%U.dmp \
  LOGFILE=impdp_orders.log \
  TABLE_EXISTS_ACTION=APPEND \
  PARALLEL=4
```

---

## Teradata FastLoad / MultiLoad → Oracle Equivalents

| Teradata Utility | Oracle Equivalent | Use Case |
|---|---|---|
| FastLoad | SQL*Loader DIRECT=TRUE | Bulk empty table load |
| MultiLoad | SQL*Loader with APPEND | Bulk DML on existing tables |
| FastExport | External tables + SQL | Fast data export |
| BTEQ | SQL*Plus / SQLcl | Interactive querying and scripting |
| TPT | SQL*Loader + shell scripting | Parallel ETL |
| Teradata JDBC/ODBC | Oracle JDBC/ODBC | Application connectivity |

---

## Best Practices

1. **Profile PI (Primary Index) usage.** Teradata's Primary Index determines data distribution across AMPs. When migrating to Oracle, the PI column is often a good candidate for partitioning or the primary key. Understand how queries filter and join on the PI to inform Oracle index strategy.

2. **Handle MULTISET table duplicates before migrating.** Check for duplicate rows in MULTISET tables:
   ```sql
   -- Teradata: find duplicate rows in a MULTISET table
   SEL order_id, COUNT(*) cnt FROM fact_orders GROUP BY order_id HAVING cnt > 1;
   ```
   Decide whether to deduplicate, keep all rows, or add a surrogate key.

3. **Rewrite QUALIFY to subqueries systematically.** Use a find-replace-aware tool or regex to locate all QUALIFY usages and convert them to equivalent subquery or CTE patterns. This is mechanical work but must be done for every occurrence.

4. **Review Teradata macro objects.** Teradata macros are parameterized SQL templates stored in the database. They translate most naturally to Oracle stored procedures.

5. **Map Teradata UDFs to Oracle.** Teradata User-Defined Functions (UDFs) written in C may require rewriting in PL/SQL or Java (Oracle Java stored procedures). Identify all UDF dependencies before migration.

6. **Plan for Teradata views referencing derived tables.** Teradata allows complex derived table views. Oracle supports these but may require materialized views for performance where Teradata's optimizer handled them more efficiently.

---

## Common Migration Pitfalls

**Pitfall 1 — SET table silent duplicate rejection:**
As covered above, this is the most common silent data issue. Set table semantics disappear in Oracle and must be replaced with explicit constraints. Audit data for duplicates first.

**Pitfall 2 — BYTEINT type:**
Oracle has no 1-byte integer type. Use NUMBER(3) or NUMBER(5). Applications doing bitwise operations on BYTEINT values need review.

**Pitfall 3 — Teradata NULL comparison:**
Teradata follows ANSI SQL for NULL comparisons (NULL = NULL is unknown). Oracle does the same — this is compatible. But Teradata's `SEL` permitting some non-standard comparisons may produce different results.

**Pitfall 4 — ANSI mode vs Teradata mode:**
Teradata sessions can run in ANSI mode or Teradata mode. In Teradata mode, SET tables, implicit type conversions, and transaction handling differ. If sessions are using Teradata mode, be aware that some behaviors may not match Oracle's ANSI-compliant behavior.

**Pitfall 5 — Teradata COMPRESS keyword on columns:**
Teradata column-level compression stores NULL values and most-frequent values more efficiently. This is an internal storage optimization invisible to SQL. In Oracle, use table-level compression instead:
```sql
-- Teradata: COMPRESS column value
salary DECIMAL(10,2) COMPRESS (0.00, NULL)

-- Oracle: use table-level compression
CREATE TABLE employees (...) COMPRESS FOR OLTP;
```

**Pitfall 6 — BTEQ error handling:**
BTEQ error handling via `.IF ERRORCODE <> 0 THEN .QUIT n` does not translate to SQL*Plus or SQLcl directly. Use `WHENEVER SQLERROR EXIT n ROLLBACK` and `WHENEVER OSERROR EXIT n` in SQL*Plus for equivalent behavior.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference — Data Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database 19c SQL Language Reference — CREATE TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database 19c SQL Language Reference — Analytic Functions (QUALIFY equivalent patterns)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Analytic-Functions.html)
- [Oracle Database 19c SQL Language Reference — LISTAGG](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/LISTAGG.html)
- [Oracle Database 19c Utilities — SQL*Loader](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader.html)
- [Oracle Database 19c Utilities — Data Pump Export (expdp)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-data-pump-export-utility.html)
- [Oracle SQL Developer Migration Workbench](https://docs.oracle.com/en/database/oracle/sql-developer/23.1/rptug/migration-workbench.html)
