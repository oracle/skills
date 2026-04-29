# Migrating PostgreSQL to Oracle

## Overview

PostgreSQL and Oracle are both mature, ACID-compliant relational databases with rich SQL support, but they diverge significantly in syntax, data types, procedural language, and ecosystem tooling. This guide covers every major translation challenge you will encounter when moving a PostgreSQL workload to Oracle Database, including type mapping, SQL dialect differences, function equivalents, and the mechanics of extracting data from PostgreSQL and loading it into Oracle.

---

## Data Type Mapping

### Numeric Types

| PostgreSQL | Oracle | Notes |
|---|---|---|
| `SMALLINT` | `NUMBER(5)` or `SMALLINT` | Oracle supports ANSI SMALLINT |
| `INTEGER` / `INT` | `NUMBER(10)` or `INTEGER` | Oracle INTEGER = NUMBER(38) |
| `BIGINT` | `NUMBER(19)` | Exact fit |
| `SERIAL` | `NUMBER` + `SEQUENCE` or `GENERATED AS IDENTITY` | See section below |
| `BIGSERIAL` | `NUMBER(19)` + `SEQUENCE` | Same pattern |
| `NUMERIC(p,s)` / `DECIMAL(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `REAL` | `BINARY_FLOAT` | IEEE 754 single precision |
| `DOUBLE PRECISION` | `BINARY_DOUBLE` | IEEE 754 double precision |
| `MONEY` | `NUMBER(19,4)` | No direct Oracle type; store as NUMBER |

### SERIAL → Sequence / Identity Column

PostgreSQL `SERIAL` is shorthand for a sequence-backed integer. Oracle offers two approaches:

**PostgreSQL source:**
```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Oracle — using a sequence (pre-12c compatible):**
```sql
CREATE SEQUENCE orders_seq
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

CREATE TABLE orders (
    order_id    NUMBER(10)   DEFAULT orders_seq.NEXTVAL PRIMARY KEY,
    customer_id NUMBER(10)   NOT NULL,
    created_at  TIMESTAMP    DEFAULT SYSTIMESTAMP
);
```

**Oracle — using GENERATED AS IDENTITY (12c+, preferred):**
```sql
CREATE TABLE orders (
    order_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id NUMBER(10)  NOT NULL,
    created_at  TIMESTAMP   DEFAULT SYSTIMESTAMP
);
```

The IDENTITY column approach is cleaner and avoids managing separate sequence objects, but the sequence approach gives you more control over caching and cycling behavior.

### Character / Text Types

| PostgreSQL | Oracle | Notes |
|---|---|---|
| `CHAR(n)` | `CHAR(n)` | Direct equivalent; Oracle pads with spaces |
| `VARCHAR(n)` | `VARCHAR2(n)` | Use VARCHAR2, not VARCHAR (Oracle reserves VARCHAR for future changes) |
| `TEXT` | `VARCHAR2(4000)` or `CLOB` | See discussion below |
| `NAME` (system type) | `VARCHAR2(128)` | Internal PG type, usually maps to identifier length |

**TEXT → VARCHAR2 vs CLOB decision:**
- If the column realistically holds fewer than 4000 characters, use `VARCHAR2(4000)`.
- If the column can exceed 4000 characters (descriptions, notes, full documents), use `CLOB`.
- Oracle 12c+ allows `VARCHAR2(32767)` when `MAX_STRING_SIZE=EXTENDED`, which covers most TEXT use cases without the complexity of CLOB.

```sql
-- PostgreSQL
CREATE TABLE articles (
    id      SERIAL PRIMARY KEY,
    title   VARCHAR(255),
    body    TEXT,
    summary TEXT
);

-- Oracle (12c+ with MAX_STRING_SIZE=EXTENDED)
CREATE TABLE articles (
    id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title   VARCHAR2(255),
    body    CLOB,
    summary VARCHAR2(4000)
);
```

### Boolean → NUMBER(1)

PostgreSQL has a native BOOLEAN type. Oracle does not. The standard Oracle convention is:

```sql
-- PostgreSQL
CREATE TABLE feature_flags (
    flag_name VARCHAR(100) PRIMARY KEY,
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);

-- Oracle
CREATE TABLE feature_flags (
    flag_name VARCHAR2(100) PRIMARY KEY,
    is_active NUMBER(1,0) DEFAULT 0 NOT NULL,
    CONSTRAINT chk_is_active CHECK (is_active IN (0, 1))
);
```

Add a CHECK constraint to enforce 0/1 semantics. Application code must translate `true`/`false` to `1`/`0`. If using Oracle 23ai or later (including 26ai), the native BOOLEAN type is available and can be used directly.

### Binary Types

| PostgreSQL | Oracle | Notes |
|---|---|---|
| `BYTEA` | `BLOB` | Store arbitrary binary data |
| `BIT(n)` | `RAW(n)` | For fixed-length bit strings |
| `BIT VARYING(n)` | `RAW(n)` | Variable-length raw |

```sql
-- PostgreSQL
CREATE TABLE file_attachments (
    id        SERIAL PRIMARY KEY,
    filename  VARCHAR(255),
    content   BYTEA
);

-- Oracle
CREATE TABLE file_attachments (
    id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    filename  VARCHAR2(255),
    content   BLOB
);
```

### Date and Time Types

| PostgreSQL | Oracle | Notes |
|---|---|---|
| `DATE` | `DATE` | Oracle DATE includes time; PG DATE is date-only |
| `TIME` | No direct equivalent | Use `VARCHAR2(8)` or store seconds-since-midnight as `NUMBER` |
| `TIMESTAMP` | `TIMESTAMP` | Both include fractional seconds |
| `TIMESTAMPTZ` | `TIMESTAMP WITH TIME ZONE` | Direct equivalent |
| `INTERVAL` | `INTERVAL DAY TO SECOND` / `INTERVAL YEAR TO MONTH` | Oracle splits intervals into two types |

**Critical difference:** Oracle's `DATE` type stores both date AND time (to the second). PostgreSQL's `DATE` is date-only. When mapping PostgreSQL `DATE` columns that genuinely store only dates, use Oracle `DATE` but be aware that Oracle will store midnight (00:00:00) as the time component.

### Other Types

| PostgreSQL | Oracle | Notes |
|---|---|---|
| `UUID` | `RAW(16)` or `VARCHAR2(36)` | Use RAW(16) for efficiency; VARCHAR2(36) for readability |
| `JSON` / `JSONB` | `JSON` (21c+) or `CLOB` with IS JSON constraint | See JSON section |
| `ARRAY` | No direct equivalent | Normalize to child table or use nested table collection |
| `HSTORE` | `JSON` or key-value child table | |
| `INET` / `CIDR` | `VARCHAR2(45)` | Store as string; add application logic for IP operations |
| `ENUM` | `VARCHAR2(n)` + CHECK constraint | Or use a lookup table |

---

## SQL Dialect Differences

### ILIKE → UPPER + LIKE

PostgreSQL's case-insensitive LIKE:

```sql
-- PostgreSQL
SELECT * FROM customers WHERE last_name ILIKE '%smith%';

-- Oracle
SELECT * FROM customers WHERE UPPER(last_name) LIKE UPPER('%smith%');
-- Or more commonly:
SELECT * FROM customers WHERE UPPER(last_name) LIKE '%SMITH%';
```

For repeated use, create a function-based index to support the pattern efficiently:

```sql
CREATE INDEX idx_customers_upper_last_name
    ON customers (UPPER(last_name));
```

### LIMIT / OFFSET → FETCH FIRST / OFFSET

```sql
-- PostgreSQL
SELECT * FROM products ORDER BY price DESC LIMIT 10 OFFSET 20;

-- Oracle 12c+ (SQL standard syntax)
SELECT * FROM products
ORDER BY price DESC
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;

-- Oracle 11g and earlier (using ROWNUM — requires subquery)
SELECT * FROM (
    SELECT p.*, ROWNUM rn
    FROM (
        SELECT * FROM products ORDER BY price DESC
    ) p
    WHERE ROWNUM <= 30
)
WHERE rn > 20;
```

Always use the 12c+ `FETCH FIRST` syntax for new Oracle code. The `ROWNUM` approach is error-prone because ROWNUM is assigned before ORDER BY is applied.

### Type Casting: :: → CAST()

```sql
-- PostgreSQL
SELECT '2024-01-15'::DATE;
SELECT 3.14::VARCHAR;
SELECT id::TEXT FROM orders;

-- Oracle
SELECT CAST('2024-01-15' AS DATE) FROM DUAL;
SELECT CAST(3.14 AS VARCHAR2(20)) FROM DUAL;
SELECT CAST(id AS VARCHAR2(20)) FROM orders;

-- Oracle also accepts TO_DATE / TO_CHAR / TO_NUMBER for explicit conversions:
SELECT TO_DATE('2024-01-15', 'YYYY-MM-DD') FROM DUAL;
SELECT TO_CHAR(3.14) FROM DUAL;
```

### String Concatenation

```sql
-- PostgreSQL (both work)
SELECT first_name || ' ' || last_name FROM employees;
SELECT CONCAT(first_name, ' ', last_name) FROM employees;

-- Oracle
SELECT first_name || ' ' || last_name FROM employees;
-- CONCAT in Oracle only accepts 2 arguments:
SELECT CONCAT(CONCAT(first_name, ' '), last_name) FROM employees;
```

### NULL Handling

```sql
-- PostgreSQL: NULLIF, COALESCE, IS DISTINCT FROM
SELECT NULLIF(qty, 0) FROM order_lines;
SELECT COALESCE(phone, 'N/A') FROM contacts;
SELECT * FROM t WHERE a IS DISTINCT FROM b;

-- Oracle
SELECT NULLIF(qty, 0) FROM order_lines;       -- same
SELECT COALESCE(phone, 'N/A') FROM contacts;  -- same
SELECT * FROM t WHERE DECODE(a, b, 0, 1) = 1; -- IS DISTINCT FROM equivalent
-- Or using NVL2 / CASE:
SELECT * FROM t WHERE (a <> b OR (a IS NULL AND b IS NOT NULL) OR (a IS NOT NULL AND b IS NULL));
```

### RETURNING Clause

```sql
-- PostgreSQL
INSERT INTO orders (customer_id, total)
VALUES (42, 199.99)
RETURNING order_id, created_at;

-- Oracle (using RETURNING INTO — only in PL/SQL)
DECLARE
    v_order_id orders.order_id%TYPE;
    v_created  orders.created_at%TYPE;
BEGIN
    INSERT INTO orders (customer_id, total)
    VALUES (42, 199.99)
    RETURNING order_id, created_at INTO v_order_id, v_created;
    DBMS_OUTPUT.PUT_LINE('New order ID: ' || v_order_id);
END;
/
```

### Sequences and Sequence Functions

```sql
-- PostgreSQL
SELECT nextval('orders_seq');
SELECT currval('orders_seq');
SELECT setval('orders_seq', 1000);

-- Oracle
SELECT orders_seq.NEXTVAL FROM DUAL;
SELECT orders_seq.CURRVAL FROM DUAL;
-- Reset sequence using RESTART (available in Oracle 18c+, documented in 19c):
ALTER SEQUENCE orders_seq RESTART START WITH 1000;
-- Pre-18c workaround:
ALTER SEQUENCE orders_seq INCREMENT BY (1000 - orders_seq.CURRVAL);
SELECT orders_seq.NEXTVAL FROM DUAL;
ALTER SEQUENCE orders_seq INCREMENT BY 1;
```

---

## PostgreSQL Functions with No Oracle Equivalent — and Workarounds

### String Functions

| PostgreSQL | Oracle Equivalent |
|---|---|
| `STRING_AGG(col, ',')` | `LISTAGG(col, ',') WITHIN GROUP (ORDER BY col)` |
| `ARRAY_AGG(col)` | No direct equivalent; use `LISTAGG` or collect into a nested table |
| `REGEXP_REPLACE(s, pat, repl)` | `REGEXP_REPLACE(s, pat, repl)` — same |
| `REGEXP_MATCHES(s, pat)` | `REGEXP_SUBSTR(s, pat)` — returns first match |
| `SPLIT_PART(s, delim, n)` | `REGEXP_SUBSTR(s, '[^' || delim || ']+', 1, n)` |
| `INITCAP(s)` | `INITCAP(s)` — same |
| `MD5(s)` | `RAWTOHEX(DBMS_CRYPTO.HASH(UTL_I18N.STRING_TO_RAW(s,'AL32UTF8'), DBMS_CRYPTO.HASH_MD5))` |
| `LEFT(s, n)` | `SUBSTR(s, 1, n)` |
| `RIGHT(s, n)` | `SUBSTR(s, -n)` |
| `REPEAT(s, n)` | `RPAD('', n * LENGTH(s), s)` or `LPAD(s, n*LENGTH(s), s)` — use a custom function |
| `LPAD`, `RPAD` | `LPAD`, `RPAD` — same |
| `POSITION(sub IN s)` | `INSTR(s, sub)` |
| `OVERLAY(s PLACING r FROM n FOR m)` | `SUBSTR(s,1,n-1) || r || SUBSTR(s, n+m)` |

**STRING_AGG example:**
```sql
-- PostgreSQL
SELECT dept_id, STRING_AGG(last_name, ', ' ORDER BY last_name) AS employees
FROM emp
GROUP BY dept_id;

-- Oracle
SELECT dept_id, LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) AS employees
FROM emp
GROUP BY dept_id;
```

### Date / Time Functions

| PostgreSQL | Oracle Equivalent |
|---|---|
| `NOW()` | `SYSTIMESTAMP` (with TZ) or `SYSDATE` |
| `CURRENT_TIMESTAMP` | `CURRENT_TIMESTAMP` — same |
| `DATE_TRUNC('month', d)` | `TRUNC(d, 'MM')` |
| `DATE_PART('year', d)` | `EXTRACT(YEAR FROM d)` |
| `AGE(d1, d2)` | `d1 - d2` returns number of days; use MONTHS_BETWEEN for month diff |
| `EXTRACT(epoch FROM d)` | `(d - DATE '1970-01-01') * 86400` |
| `TO_TIMESTAMP(s, fmt)` | `TO_TIMESTAMP(s, fmt)` — same format masks differ slightly |
| `MAKE_DATE(y, m, d)` | `TO_DATE(y || '-' || m || '-' || d, 'YYYY-MM-DD')` |
| `GENERATE_SERIES(start, end, step)` | Use `CONNECT BY LEVEL` or a recursive CTE |

**GENERATE_SERIES equivalent:**
```sql
-- PostgreSQL: generate a date series
SELECT generate_series('2024-01-01'::DATE, '2024-01-31'::DATE, '1 day'::INTERVAL)::DATE AS dt;

-- Oracle
SELECT DATE '2024-01-01' + LEVEL - 1 AS dt
FROM DUAL
CONNECT BY LEVEL <= (DATE '2024-01-31' - DATE '2024-01-01' + 1);
```

### Mathematical / Analytical Functions

| PostgreSQL | Oracle Equivalent |
|---|---|
| `RANDOM()` | `DBMS_RANDOM.VALUE` |
| `TRUNC(n)` | `TRUNC(n)` — same |
| `DIV(a, b)` | `TRUNC(a/b)` |
| `MOD(a, b)` | `MOD(a, b)` — same |
| `CBRT(n)` | `POWER(n, 1/3)` |
| `FACTORIAL(n)` | No built-in; write a PL/SQL function |
| `WIDTH_BUCKET` | `WIDTH_BUCKET` — same (SQL standard) |

---

## psql vs SQL*Plus

| Feature | psql | SQL*Plus |
|---|---|---|
| Connect | `psql -h host -U user -d db` | `sqlplus user/pass@host:1521/service` |
| Execute file | `\i file.sql` | `@file.sql` |
| List tables | `\dt` | `SELECT table_name FROM user_tables;` |
| Describe table | `\d tablename` | `DESC tablename` |
| Show databases | `\l` | `SELECT name FROM v$database;` |
| Timing | `\timing` | `SET TIMING ON` |
| Output to file | `\o output.txt` | `SPOOL output.txt` |
| Quit | `\q` | `EXIT` or `QUIT` |
| Variable substitution | `:varname` | `&varname` or `&&varname` |
| Null display | `\pset null 'NULL'` | `SET NULL 'NULL'` |
| Row separator | Automatic | `SET PAGESIZE 50` |

### SQL*Plus scripting example:

```sql
-- psql script
\timing
\o /tmp/report.txt
SELECT dept, COUNT(*) FROM emp GROUP BY dept ORDER BY dept;
\o
\q

-- SQL*Plus equivalent
SET TIMING ON
SPOOL /tmp/report.txt
SELECT dept, COUNT(*) FROM emp GROUP BY dept ORDER BY dept;
SPOOL OFF
EXIT
```

---

## pg_dump to Oracle Import Workflow

PostgreSQL does not have a native export format Oracle can read directly. The typical pipeline is:

### Step 1 — Extract from PostgreSQL

```bash
# Export to CSV (most portable)
psql -U myuser -d mydb -c "\COPY mytable TO '/tmp/mytable.csv' WITH CSV HEADER"

# Export all tables via pg_dump in plain SQL for schema reference
pg_dump -U myuser -d mydb --schema-only -f schema.sql

# Export specific tables to CSV using a script
for tbl in customers orders products; do
  psql -U myuser -d mydb -c "\COPY $tbl TO '/tmp/${tbl}.csv' WITH CSV HEADER NULL ''"
done
```

### Step 2 — Create Oracle Schema

Manually translate the `CREATE TABLE` statements from pg_dump output using the type mappings above. Tools like ora2pg can automate this step (see `oracle-migration-tools.md`).

### Step 3 — Load into Oracle with SQL*Loader

```sql
-- SQL*Loader control file: customers.ctl
OPTIONS (SKIP=1, ROWS=1000, DIRECT=TRUE)
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
    created_at DATE "YYYY-MM-DD HH24:MI:SS"
)
```

```bash
sqlldr userid=myuser/mypass@mydb control=customers.ctl log=customers.log
```

### Step 4 — Validate Row Counts

```sql
-- Run on PostgreSQL
SELECT 'customers' AS tbl, COUNT(*) AS cnt FROM customers
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'products', COUNT(*) FROM products;

-- Run on Oracle (compare results)
SELECT 'customers' AS tbl, COUNT(*) AS cnt FROM customers
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'products', COUNT(*) FROM products;
```

### Automated Schema Conversion with SQL Developer Migration Workbench

Oracle SQL Developer Migration Workbench supports PostgreSQL as a source and can automate much of the schema conversion to Oracle. Use it instead of ora2pg when Oracle is the target.

> **ora2pg direction warning:** ora2pg migrates Oracle databases **to PostgreSQL** — it is not a tool for migrating PostgreSQL to Oracle. Do not use ora2pg when Oracle is the migration target. References to using ora2pg for this direction in other guides are incorrect. Use SQL Developer Migration Workbench or AWS SCT for PostgreSQL → Oracle schema conversion.

---

## Best Practices

1. **Audit NULL behavior early.** PostgreSQL treats empty string `''` as non-NULL; Oracle traditionally treats it as NULL (though this changed in 23ai with standard strings mode). Review columns where empty strings are used as sentinel values.

2. **Migrate sequences after data load.** When using sequences, set their START WITH value to be above the maximum existing ID to avoid primary key conflicts.

3. **Test BOOLEAN columns exhaustively.** Application layers that pass Python `True`/`False` or Java `boolean` values may need explicit translation to `1`/`0` for Oracle.

4. **Avoid SELECT without FROM.** PostgreSQL allows `SELECT 1 + 1`. Oracle requires `FROM DUAL`: `SELECT 1 + 1 FROM DUAL`.

5. **Watch for RETURNING clause usage.** PostgreSQL applications that rely on `INSERT ... RETURNING` need to be refactored to use PL/SQL blocks or the Oracle JDBC `RETURN_GENERATED_KEYS` mechanism.

6. **Case sensitivity in identifiers.** PostgreSQL folds unquoted identifiers to lowercase. Oracle folds them to uppercase. Quoted identifiers preserve case in both, but mixing conventions causes hard-to-debug issues. Prefer unquoted identifiers so that Oracle's uppercase folding applies uniformly.

7. **Use VARCHAR2, not VARCHAR.** In Oracle, `VARCHAR` is reserved for future re-definition as the SQL standard character type. Always use `VARCHAR2` to avoid surprises.

8. **Schema privilege model is different.** PostgreSQL separates catalogs, schemas, and roles differently from Oracle. In Oracle, a schema IS a user. Plan your user/schema architecture before migrating.

---

## Common Migration Pitfalls

**Pitfall 1 — DATE with time component:**
Oracle `DATE` stores time; PostgreSQL `DATE` does not. Comparisons like `WHERE created_date = DATE '2024-01-15'` will silently miss rows in Oracle if `created_date` has a non-midnight time component.
```sql
-- Safe Oracle date comparison
WHERE created_date >= DATE '2024-01-15'
  AND created_date < DATE '2024-01-16'
-- Or:
WHERE TRUNC(created_date) = DATE '2024-01-15'
```

**Pitfall 2 — Empty string vs NULL:**
```sql
-- PostgreSQL: these are different
WHERE email = ''     -- finds rows with empty string
WHERE email IS NULL  -- finds rows with NULL

-- Oracle 21c and earlier: '' IS NULL evaluates to TRUE
-- Any INSERT of '' becomes NULL
INSERT INTO t (col) VALUES ('');  -- Oracle stores NULL, not ''
```

**Pitfall 3 — OUTER JOIN syntax:**
PostgreSQL supports the old `(+)` Oracle join syntax but also modern ANSI joins. Ensure all joins use ANSI syntax, as `(+)` has edge cases in Oracle that differ from PostgreSQL behavior.

**Pitfall 4 — Trigger syntax:**
PostgreSQL triggers call a trigger function; Oracle embeds logic in the trigger body. Complete rewrite required.

**Pitfall 5 — Schemas and search_path:**
PostgreSQL uses `search_path` to resolve unqualified object names. Oracle resolves against the current schema. Cross-schema references must use `schema.object` notation.

**Pitfall 6 — Window function FILTER clause:**
```sql
-- PostgreSQL supports FILTER in window functions
SELECT SUM(amount) FILTER (WHERE status = 'paid') OVER (PARTITION BY customer_id)
FROM orders;

-- Oracle: use CASE inside the aggregate
SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)
       OVER (PARTITION BY customer_id)
FROM orders;
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference — Data Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database 19c SQL Language Reference — CREATE TABLE (GENERATED AS IDENTITY)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database 19c SQL Language Reference — Analytic Functions](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Analytic-Functions.html)
- [Oracle Database 19c Utilities — SQL*Loader](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader.html)
- [Oracle SQL Developer Migration Workbench](https://docs.oracle.com/en/database/oracle/sql-developer/23.1/rptug/migration-workbench.html)
- [AWS Schema Conversion Tool User Guide](https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/CHAP_Welcome.html)
