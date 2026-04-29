# Migrating IBM DB2 to Oracle

## Overview

IBM DB2 (now IBM Db2) and Oracle share a long history as enterprise RDBMS platforms. They have more in common than most database pairs: both use ANSI-standard SQL, both support PL/SQL-style procedural extensions (DB2 uses SQL PL), both have mature optimizer technology, and both support advanced features like XML, partitioning, and materialized views. This shared foundation makes DB2-to-Oracle migrations more predictable than migrations from MySQL or SQL Server, but there are still meaningful differences in SQL dialect, data types, administrative concepts, and procedural language.

---

## DB2 SQL Dialect Differences

### SELECT Without FROM

DB2 (like PostgreSQL) allows `SELECT` without `FROM`:

```sql
-- DB2
SELECT CURRENT DATE;
SELECT CURRENT TIMESTAMP;
SELECT 1 + 1;

-- Oracle requires FROM DUAL
SELECT CURRENT_DATE FROM DUAL;
SELECT CURRENT_TIMESTAMP FROM DUAL;
SELECT 1 + 1 FROM DUAL;
```

### CURRENT DATE / CURRENT TIMESTAMP (Compatible)

DB2 and Oracle both support ANSI standard `CURRENT_DATE` and `CURRENT_TIMESTAMP`, though DB2 adds spaces (`CURRENT DATE`) which Oracle does not accept:

```sql
-- DB2 (spaces allowed between CURRENT and the qualifier)
SELECT CURRENT DATE FROM SYSIBM.SYSDUMMY1;
SELECT CURRENT TIMESTAMP FROM SYSIBM.SYSDUMMY1;
SELECT CURRENT TIME FROM SYSIBM.SYSDUMMY1;

-- Oracle
SELECT CURRENT_DATE FROM DUAL;          -- underscore, not space
SELECT CURRENT_TIMESTAMP FROM DUAL;
SELECT TO_CHAR(SYSDATE, 'HH24:MI:SS') FROM DUAL;  -- TIME has no equivalent
```

### SYSIBM.SYSDUMMY1 vs DUAL

DB2 uses `SYSIBM.SYSDUMMY1` (or `SYSIBM.DUAL`) for singleton queries. Oracle uses `DUAL`:

```sql
-- DB2
SELECT 'hello' FROM SYSIBM.SYSDUMMY1;

-- Oracle
SELECT 'hello' FROM DUAL;
```

### FETCH FIRST n ROWS ONLY (Compatible)

This is an area of compatibility — DB2 introduced `FETCH FIRST n ROWS ONLY` before Oracle did, and Oracle adopted the same SQL standard syntax in 12c:

```sql
-- DB2 (original syntax)
SELECT * FROM employees ORDER BY salary DESC FETCH FIRST 10 ROWS ONLY;

-- Oracle 12c+ (same syntax)
SELECT * FROM employees ORDER BY salary DESC FETCH FIRST 10 ROWS ONLY;
-- Also valid in Oracle:
SELECT * FROM employees ORDER BY salary DESC FETCH NEXT 10 ROWS ONLY;
```

### FETCH FIRST with OFFSET

```sql
-- DB2
SELECT * FROM employees ORDER BY emp_id OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;

-- Oracle 12c+ (identical)
SELECT * FROM employees ORDER BY emp_id OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;
```

### WITH UR / CS / RR Isolation Hints

DB2 supports inline isolation level hints. Oracle uses MVCC and has no equivalent hints:

```sql
-- DB2 isolation hints
SELECT * FROM orders WITH UR;   -- Uncommitted Read (dirty read)
SELECT * FROM orders WITH CS;   -- Cursor Stability (default)
SELECT * FROM orders WITH RS;   -- Read Stability
SELECT * FROM orders WITH RR;   -- Repeatable Read

-- Oracle: remove all WITH isolation hints
-- Oracle's MVCC means reads never block and are always consistent
SELECT * FROM orders;
```

### SPECIAL REGISTERS

DB2 special registers map to Oracle equivalents:

| DB2 Special Register | Oracle Equivalent |
|---|---|
| `CURRENT DATE` | `CURRENT_DATE` or `TRUNC(SYSDATE)` |
| `CURRENT TIME` | `TO_CHAR(SYSDATE, 'HH24:MI:SS')` |
| `CURRENT TIMESTAMP` | `CURRENT_TIMESTAMP` or `SYSTIMESTAMP` |
| `CURRENT USER` | `USER` or `SYS_CONTEXT('USERENV', 'SESSION_USER')` |
| `CURRENT SCHEMA` | `SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')` |
| `CURRENT SERVER` | `SYS_CONTEXT('USERENV', 'DB_NAME')` |
| `SESSION_USER` | `USER` |
| `CURRENT TIMEZONE` | `SESSIONTIMEZONE` |

---

## Data Type Mapping

### Numeric Types

| DB2 | Oracle | Notes |
|---|---|---|
| `SMALLINT` | `NUMBER(5)` or `SMALLINT` | |
| `INTEGER` / `INT` | `NUMBER(10)` or `INTEGER` | Oracle INTEGER = NUMBER(38) |
| `BIGINT` | `NUMBER(19)` | |
| `DECIMAL(p,s)` / `DEC(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `NUMERIC(p,s)` / `NUM(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `REAL` | `BINARY_FLOAT` | IEEE 754 32-bit |
| `DOUBLE` / `FLOAT(n)` | `BINARY_DOUBLE` | IEEE 754 64-bit |
| `DECFLOAT(16)` | `BINARY_FLOAT` (approx) | DB2 decimal floating point |
| `DECFLOAT(34)` | `BINARY_DOUBLE` (approx) | |

### String Types

| DB2 | Oracle | Notes |
|---|---|---|
| `CHAR(n)` | `CHAR(n)` | DB2 max 254 bytes; Oracle max 2,000 bytes |
| `VARCHAR(n)` | `VARCHAR2(n)` | DB2 max 32,672 bytes; Oracle max 4,000/32,767 |
| `LONG VARCHAR` | `CLOB` | Deprecated in DB2; use CLOB |
| `CLOB(n)` | `CLOB` | DB2 specifies max size; Oracle CLOB up to 128 TB |
| `DBCLOB(n)` | `NCLOB` | Double-byte CLOB |
| `GRAPHIC(n)` | `NCHAR(n)` | Fixed-length double-byte |
| `VARGRAPHIC(n)` | `NVARCHAR2(n)` | Variable-length double-byte |

### Binary Types

| DB2 | Oracle | Notes |
|---|---|---|
| `BINARY(n)` | `RAW(n)` | Fixed-length binary (DB2 10.5+) |
| `VARBINARY(n)` | `RAW(n)` | Variable-length binary |
| `BLOB(n)` | `BLOB` | Binary large object |
| `FOR BIT DATA` (suffix) | `RAW(n)` or `BLOB` | DB2 modifier for binary character data |

### Date / Time Types

| DB2 | Oracle | Notes |
|---|---|---|
| `DATE` | `DATE` | DB2 DATE is date-only; Oracle DATE includes time |
| `TIME` | No equivalent | Use `VARCHAR2(8)` or `NUMBER` |
| `TIMESTAMP(n)` | `TIMESTAMP(n)` | Both support fractional second precision |
| `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP WITH TIME ZONE` | Compatible |
| `TIMESTAMP WITH LOCAL TIME ZONE` | `TIMESTAMP WITH LOCAL TIME ZONE` | Compatible |

**Critical:** DB2 `DATE` is date-only (no time component). Oracle `DATE` includes time. When mapping DB2 DATE columns:

```sql
-- DB2: this comparison is safe
WHERE order_date = DATE '2024-01-15'

-- Oracle: this may miss rows with non-midnight times
WHERE order_date = DATE '2024-01-15'

-- Oracle: safe equivalent
WHERE TRUNC(order_date) = DATE '2024-01-15'
-- Or if the column truly has no time component:
WHERE order_date >= DATE '2024-01-15' AND order_date < DATE '2024-01-16'
```

### XML and Other Types

| DB2 | Oracle | Notes |
|---|---|---|
| `XML` | `XMLTYPE` | Oracle uses XMLTYPE; full XML/SQL equivalents available |
| `ROWID` | `ROWID` / `UROWID` | Different internal formats |

---

## DB2 Packages vs Oracle Packages

This is one of the most compatible areas between the two databases. Both support named PL/SQL-style packages with specification and body sections.

### DB2 Package Structure

```sql
-- DB2 stored procedure (SQL PL)
CREATE OR REPLACE PROCEDURE calculate_order_total(
    IN  p_order_id   INTEGER,
    OUT p_total      DECIMAL(10,2),
    OUT p_item_count INTEGER
)
LANGUAGE SQL
BEGIN
    SELECT SUM(line_amount), COUNT(*)
    INTO   p_total, p_item_count
    FROM   order_lines
    WHERE  order_id = p_order_id;

    IF p_total IS NULL THEN
        SET p_total = 0;
        SET p_item_count = 0;
    END IF;
END@
```

### Oracle Package Equivalent

```sql
-- Oracle: group related procedures into a package
CREATE OR REPLACE PACKAGE order_pkg AS
    PROCEDURE calculate_order_total(
        p_order_id   IN  NUMBER,
        p_total      OUT NUMBER,
        p_item_count OUT NUMBER
    );
    FUNCTION get_order_status(p_order_id IN NUMBER) RETURN VARCHAR2;
END order_pkg;
/

CREATE OR REPLACE PACKAGE BODY order_pkg AS
    PROCEDURE calculate_order_total(
        p_order_id   IN  NUMBER,
        p_total      OUT NUMBER,
        p_item_count OUT NUMBER
    ) AS
    BEGIN
        SELECT SUM(line_amount), COUNT(*)
        INTO   p_total, p_item_count
        FROM   order_lines
        WHERE  order_id = p_order_id;

        IF p_total IS NULL THEN
            p_total      := 0;
            p_item_count := 0;
        END IF;
    END calculate_order_total;

    FUNCTION get_order_status(p_order_id IN NUMBER) RETURN VARCHAR2 AS
        v_status VARCHAR2(20);
    BEGIN
        SELECT status INTO v_status FROM orders WHERE order_id = p_order_id;
        RETURN v_status;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN RETURN 'NOT FOUND';
    END get_order_status;
END order_pkg;
/
```

### DB2 SQL PL vs Oracle PL/SQL Differences

| Concept | DB2 SQL PL | Oracle PL/SQL |
|---|---|---|
| Assignment | `SET v_count = 10` | `v_count := 10` |
| Conditional | `IF ... THEN ... ELSEIF ... ELSE ... END IF` | `IF ... THEN ... ELSIF ... ELSE ... END IF` |
| Loop | `WHILE ... DO ... END WHILE` | `WHILE ... LOOP ... END LOOP` |
| For loop | `FOR row AS cursor_name CURSOR FOR ... DO ... END FOR` | `FOR rec IN (SELECT ...) LOOP ... END LOOP` |
| Leave loop | `LEAVE label` | `EXIT` |
| Signal error | `SIGNAL SQLSTATE '70001' SET MESSAGE_TEXT = 'error'` | `RAISE_APPLICATION_ERROR(-20001, 'error')` |
| Condition handler | `DECLARE CONTINUE HANDLER FOR NOT FOUND ...` | `EXCEPTION WHEN NO_DATA_FOUND THEN ...` |

```sql
-- DB2: SIGNAL
IF v_balance < 0 THEN
    SIGNAL SQLSTATE '70001' SET MESSAGE_TEXT = 'Balance cannot be negative';
END IF;

-- Oracle equivalent
IF v_balance < 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Balance cannot be negative');
END IF;
```

---

## REORG TABLE → ALTER TABLE MOVE

DB2's `REORG TABLE` reclaims space from deleted rows and reorganizes table data. Oracle's equivalent is `ALTER TABLE ... MOVE` (rebuilds the segment), followed by rebuilding indexes.

```sql
-- DB2: reclaim space and re-cluster
REORG TABLE employees;
REORG TABLE employees INDEX employee_idx;  -- reorg using a specific index clustering

-- Oracle equivalent
ALTER TABLE employees MOVE;
-- After MOVE, all indexes become UNUSABLE — rebuild them:
ALTER INDEX employees_pk REBUILD;
ALTER INDEX employees_dept_idx REBUILD;

-- For online reorganization (no lock):
ALTER TABLE employees MOVE ONLINE;

-- Verify indexes need rebuilding:
SELECT index_name, status FROM user_indexes WHERE table_name = 'EMPLOYEES';

-- Rebuild all unusable indexes on a table:
BEGIN
    FOR idx IN (SELECT index_name FROM user_indexes
                WHERE table_name = 'EMPLOYEES' AND status = 'UNUSABLE') LOOP
        EXECUTE IMMEDIATE 'ALTER INDEX ' || idx.index_name || ' REBUILD';
    END LOOP;
END;
/
```

### RUNSTATS → DBMS_STATS

```sql
-- DB2: collect table statistics
RUNSTATS ON TABLE myschema.employees WITH DISTRIBUTION AND DETAILED INDEXES ALL;

-- Oracle equivalent
EXEC DBMS_STATS.GATHER_TABLE_STATS('MYSCHEMA', 'EMPLOYEES',
    CASCADE        => TRUE,
    METHOD_OPT     => 'FOR ALL COLUMNS SIZE AUTO',
    ESTIMATE_PERCENT => DBMS_STATS.AUTO_SAMPLE_SIZE
);
```

---

## Common DB2 Functions and Oracle Equivalents

### String Functions

| DB2 Function | Oracle Equivalent |
|---|---|
| `SUBSTR(s, pos, len)` | `SUBSTR(s, pos, len)` — same |
| `LENGTH(s)` | `LENGTH(s)` — same |
| `UPPER(s)` | `UPPER(s)` — same |
| `LOWER(s)` | `LOWER(s)` — same |
| `LTRIM(s)` | `LTRIM(s)` — same |
| `RTRIM(s)` | `RTRIM(s)` — same |
| `TRIM(s)` | `TRIM(s)` — same |
| `LPAD(s, n, pad)` | `LPAD(s, n, pad)` — same |
| `RPAD(s, n, pad)` | `RPAD(s, n, pad)` — same |
| `LOCATE(sub, s [, start])` | `INSTR(s, sub [, start])` — argument order differs |
| `POSSTR(s, sub)` | `INSTR(s, sub)` |
| `LEFT(s, n)` | `SUBSTR(s, 1, n)` |
| `RIGHT(s, n)` | `SUBSTR(s, -n)` |
| `REPEAT(s, n)` | Custom PL/SQL function |
| `REPLACE(s, from, to)` | `REPLACE(s, from, to)` — same |
| `TRANSLATE(s, from, to)` | `TRANSLATE(s, from, to)` — same |
| `HEX(n)` | `TO_CHAR(n, 'XXXXXXXX')` |
| `DIGITS(n)` | `LPAD(TO_CHAR(n), precision, '0')` |
| `CHAR(n)` | `TO_CHAR(n)` or `CHR(n)` depending on context |
| `VARCHAR(expr)` | `TO_CHAR(expr)` |
| `STRIP(s)` | `TRIM(s)` |
| `SPACE(n)` | `RPAD(' ', n)` |
| `VALUE(a, b)` | `NVL(a, b)` or `COALESCE(a, b)` |

**Note on LOCATE vs INSTR argument order:**
```sql
-- DB2: LOCATE(search_string, source_string)
SELECT LOCATE('foo', col) FROM t;

-- Oracle: INSTR(source_string, search_string) — reversed!
SELECT INSTR(col, 'foo') FROM t;
```

### Date Functions

| DB2 Function | Oracle Equivalent |
|---|---|
| `YEAR(d)` | `EXTRACT(YEAR FROM d)` |
| `MONTH(d)` | `EXTRACT(MONTH FROM d)` |
| `DAY(d)` | `EXTRACT(DAY FROM d)` |
| `DAYOFWEEK(d)` | `TO_NUMBER(TO_CHAR(d, 'D'))` |
| `DAYOFYEAR(d)` | `d - TRUNC(d, 'YEAR') + 1` |
| `WEEK(d)` | `TO_NUMBER(TO_CHAR(d, 'WW'))` |
| `HOUR(d)` | `EXTRACT(HOUR FROM CAST(d AS TIMESTAMP))` |
| `MINUTE(d)` | `EXTRACT(MINUTE FROM CAST(d AS TIMESTAMP))` |
| `SECOND(d)` | `EXTRACT(SECOND FROM CAST(d AS TIMESTAMP))` |
| `DAYS(d)` | `d - DATE '0001-01-01' + 1` (number of days since year 1) |
| `JULIAN_DAY(d)` | Oracle `TO_NUMBER(TO_CHAR(d, 'J'))` |
| `MIDNIGHT_SECONDS(d)` | `(d - TRUNC(d)) * 86400` |
| `DATE(ts)` | `TRUNC(ts)` |
| `TIME(ts)` | `TO_CHAR(ts, 'HH24:MI:SS')` |
| `TIMESTAMP(d, t)` | `d + TO_DSINTERVAL('0 ' \|\| t)` |
| `MONTHS_BETWEEN(d1, d2)` | `MONTHS_BETWEEN(d1, d2)` — same |
| `ADD_MONTHS(d, n)` | `ADD_MONTHS(d, n)` — same |
| `LAST_DAY(d)` | `LAST_DAY(d)` — same |
| `NEXT_DAY(d, day)` | `NEXT_DAY(d, day)` — same |
| `TIMESTAMPDIFF(unit, ts1, ts2)` | `ts2 - ts1` (days) or `MONTHS_BETWEEN` for months |

### Mathematical Functions

| DB2 Function | Oracle Equivalent |
|---|---|
| `MOD(a, b)` | `MOD(a, b)` — same |
| `ABS(n)` | `ABS(n)` — same |
| `CEILING(n)` / `CEIL(n)` | `CEIL(n)` |
| `FLOOR(n)` | `FLOOR(n)` — same |
| `ROUND(n, d)` | `ROUND(n, d)` — same |
| `TRUNC(n, d)` | `TRUNC(n, d)` — same |
| `SQRT(n)` | `SQRT(n)` — same |
| `POWER(b, e)` | `POWER(b, e)` — same |
| `LN(n)` | `LN(n)` — same |
| `LOG(n)` | `LOG(10, n)` (DB2 LOG is base-10; Oracle LOG takes base as arg) |
| `EXP(n)` | `EXP(n)` — same |
| `RAND()` | `DBMS_RANDOM.VALUE` |
| `SIGN(n)` | `SIGN(n)` — same |

### Aggregate Functions

| DB2 | Oracle | Notes |
|---|---|---|
| `COUNT(*)` | `COUNT(*)` — same | |
| `SUM`, `AVG`, `MIN`, `MAX` | Same | |
| `LISTAGG(col, sep)` | `LISTAGG(col, sep) WITHIN GROUP (ORDER BY col)` | DB2 11.1+ supports LISTAGG; Oracle requires WITHIN GROUP |
| `XMLAGG(XMLELEMENT(NAME v, col))` | `XMLAGG(XMLELEMENT("v", col))` | XML-based string aggregation |
| `GROUPING SETS` | `GROUPING SETS` — same | |
| `ROLLUP` | `ROLLUP` — same | |
| `CUBE` | `CUBE` — same | |

---

## DB2 Bulk Export to Oracle SQL*Loader / Data Pump

IBM Teradata Parallel Transporter (TPT) is specific to Teradata, not DB2 — the section heading was incorrect. For DB2, the primary bulk export tools are:

- `db2move` — exports schema and data in DB2's internal format
- `EXPORT TO` command — exports query results to CSV/IXF/DEL format
- `db2look` — generates DDL

### DB2 Export → Oracle Import Workflow

**Step 1: Export from DB2**

```bash
# Export table to comma-delimited file (DEL format, comma delimiter, double-quote char delimiter)
db2 "EXPORT TO /tmp/customers.del OF DEL MODIFIED BY COLDEL, CHARDEL\" SELECT * FROM customers"

# Export specific columns with timestamp format
db2 "EXPORT TO /tmp/customers.csv OF DEL MODIFIED BY COLDEL, TIMESTAMPFORMAT='YYYY-MM-DD HH:MM:SS' SELECT customer_id, first_name, last_name, email, created_date FROM customers"

# Export DDL using db2look
db2look -d mydb -e -o schema.ddl -a
```

Note: Db2 `EXPORT` modifier syntax can vary by Db2 version and platform. Verify the exact modifier spelling against the IBM Db2 documentation for your version before use.

**Step 2: Translate DDL**

Review the db2look output and apply type mappings from the table above. Key changes:
- `SMALLINT` → `NUMBER(5)`
- `INTEGER` → `NUMBER(10)`
- `BIGINT` → `NUMBER(19)`
- `VARCHAR(n)` → `VARCHAR2(n)`
- `CLOB(n)` → `CLOB`
- `TIMESTAMP` → `TIMESTAMP`
- Remove `COMPRESS YES/NO`
- Remove `PCTFREE`, `GBPCACHE`, and other DB2-specific storage options (replace with Oracle equivalents)
- Replace `GENERATED ALWAYS AS IDENTITY` (compatible in Oracle 12c+)

**Step 3: Load into Oracle**

```sql
-- SQL*Loader control file for DB2 DEL export
OPTIONS (DIRECT=TRUE, ROWS=5000)
LOAD DATA
INFILE '/tmp/customers.csv'
APPEND
INTO TABLE customers
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
TRAILING NULLCOLS
(
    customer_id,
    first_name,
    last_name,
    email,
    created_date TIMESTAMP "YYYY-MM-DD HH24:MI:SS"
)
```

---

## Best Practices

1. **Leverage the DB2-to-Oracle syntax similarity.** DB2 SQL PL and Oracle PL/SQL share many constructs. Focus migration effort on differences (assignment operator, loop syntax, condition handlers) rather than rewriting from scratch.

2. **Use GENERATED AS IDENTITY where possible.** DB2 11.1+ supports `GENERATED ALWAYS AS IDENTITY`, and Oracle 12c+ supports the same syntax. This is a migration-friendly area.

3. **Review DB2 compression settings.** DB2 table compression (ROW COMPRESSION, VALUE COMPRESSION) does not map directly. Oracle provides its own compression options (COMPRESS FOR OLTP, COMPRESS BASIC, etc.). Re-evaluate compression strategy for Oracle.

4. **Plan for DB2 tablespace differences.** DB2 uses DMS/SMS/AUTOMATIC tablespaces. Oracle uses locally managed tablespaces with AUTOEXTEND. Map DB2 buffer pools to Oracle buffer cache configuration (SGA).

5. **Test DB2 LOCATE vs Oracle INSTR argument order** everywhere in application code and stored procedures. This is a common source of subtle bugs.

6. **Audit DB2 TIMESTAMP precision.** DB2 timestamps support up to microseconds (6 decimal places). Oracle TIMESTAMP supports up to 9 decimal places. Data loaded with sub-microsecond precision will be preserved in Oracle.

---

## Common Migration Pitfalls

**Pitfall 1 — DB2 DATE vs Oracle DATE:**
As noted above, DB2 DATE has no time component; Oracle DATE does. Insert/compare logic must account for this.

**Pitfall 2 — DB2 schema vs Oracle schema:**
DB2 schemas are namespaces within a database. Oracle schemas are synonymous with users. Multi-schema DB2 databases map to multiple Oracle users/schemas.

**Pitfall 3 — IDENTITY columns with CYCLE:**
```sql
-- DB2
id INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 CYCLE MAXVALUE 9999)

-- Oracle
id NUMBER GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 CYCLE MAXVALUE 9999)
-- Oracle 12c+ identity columns support CYCLE
```

**Pitfall 4 — DB2 CONCAT function:**
DB2 `CONCAT(a, b)` only takes two arguments. Oracle's `CONCAT` also takes only two arguments. Use `||` for multi-part concatenation in both databases.

**Pitfall 5 — EXCEPTION table name conflict:**
`EXCEPTION` is a reserved word in Oracle PL/SQL. DB2 applications that have a table named `EXCEPTION` will need renaming (use double quotes as a workaround, but rename to avoid long-term issues).

**Pitfall 6 — Isolation level compatibility:**
DB2's `WITH UR` (dirty read) has no Oracle equivalent since Oracle's MVCC prevents dirty reads by design. Remove all isolation hints; queries will be non-blocking by default.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference — Data Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database 19c SQL Language Reference — CREATE TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database 19c PL/SQL Language Reference — PL/SQL Language Fundamentals](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-language-fundamentals.html)
- [Oracle Database 19c Administrator's Guide — Managing Schema Objects (ALTER TABLE MOVE)](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/managing-schema-objects.html)
- [Oracle Database 19c PL/SQL Packages Reference — DBMS_STATS](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_STATS.html)
- [Oracle Database 19c Utilities — SQL*Loader](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader.html)
- [Oracle SQL Developer Migration Workbench](https://docs.oracle.com/en/database/oracle/sql-developer/23.1/rptug/migration-workbench.html)
