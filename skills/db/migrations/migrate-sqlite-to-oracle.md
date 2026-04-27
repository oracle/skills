# Migrating SQLite to Oracle

## Overview

SQLite is a serverless, embedded database engine that stores the entire database in a single file. It is designed for simplicity, portability, and low-resource environments — embedded in mobile apps, IoT devices, desktop software, and test environments. Oracle Database is a full enterprise RDBMS with a client-server architecture, complex memory management, and a rich feature set suited for concurrent multi-user workloads at scale.

Migrating from SQLite to Oracle typically represents a step up in scale, concurrency requirements, or operational maturity. The challenges include SQLite's unique type affinity system (rather than strict types), SQLite-specific PRAGMA statements with no Oracle equivalents, and the conceptual shift from a single-file embedded database to a multi-process enterprise server.

---

## SQLite Type Affinity vs Oracle Strict Types

SQLite uses a concept called **type affinity** rather than strict data types. A column's declared type is a hint, not an enforcement. Any column can store any value of any type. Oracle enforces strict typing.

### SQLite Type Affinity Rules

SQLite assigns affinity based on the declared type name:
- Any type containing the word `INT` → INTEGER affinity
- Any type containing `CHAR`, `CLOB`, or `TEXT` → TEXT affinity
- Type `BLOB` or no type → BLOB affinity (stores any type)
- Any type containing `REAL`, `FLOA`, or `DOUB` → REAL affinity
- Everything else → NUMERIC affinity

This means SQLite allows this without error:
```sql
-- SQLite: this actually works (type affinity is a suggestion)
CREATE TABLE demo (
    id   INTEGER PRIMARY KEY,
    val  INTEGER
);
INSERT INTO demo (id, val) VALUES (1, 'not an integer');  -- Stored as TEXT
INSERT INTO demo (id, val) VALUES (2, 3.14);              -- Stored as REAL
```

Oracle would reject these inserts with a type mismatch error.

### Type Mapping Table

| SQLite Declared Type | Oracle Type | Notes |
|---|---|---|
| `INTEGER` | `NUMBER(10)` | SQLite INTEGER is up to 8 bytes; use NUMBER(19) for BIGINT range |
| `INTEGER PRIMARY KEY` | `NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY` | SQLite ROWID alias |
| `REAL` | `BINARY_DOUBLE` | 64-bit IEEE 754 float |
| `TEXT` | `VARCHAR2(4000)` or `CLOB` | Depends on expected length |
| `BLOB` | `BLOB` | Binary data |
| `NUMERIC` | `NUMBER` | Catches anything else |
| `BOOLEAN` | `NUMBER(1)` with CHECK (0,1) | SQLite stores TRUE/FALSE as 1/0 |
| `DATE` | `DATE` | SQLite stores dates as TEXT or INTEGER |
| `DATETIME` | `TIMESTAMP` | SQLite stores as TEXT `YYYY-MM-DD HH:MM:SS` |
| `FLOAT` | `BINARY_FLOAT` or `BINARY_DOUBLE` | |
| `DOUBLE` | `BINARY_DOUBLE` | |
| `VARCHAR(n)` | `VARCHAR2(n)` | SQLite ignores the n; Oracle enforces it |
| `CHAR(n)` | `CHAR(n)` | SQLite ignores n; Oracle enforces it |
| `NCHAR(n)` | `NCHAR(n)` | |
| `DECIMAL(p,s)` | `NUMBER(p,s)` | SQLite stores as float or integer |

### Schema Translation Example

```sql
-- SQLite schema (from .schema command)
CREATE TABLE products (
    product_id   INTEGER  PRIMARY KEY AUTOINCREMENT,
    product_name TEXT     NOT NULL,
    price        REAL     NOT NULL DEFAULT 0.0,
    quantity     INTEGER  DEFAULT 0,
    description  TEXT,
    image_data   BLOB,
    is_active    INTEGER  NOT NULL DEFAULT 1,
    created_at   TEXT     DEFAULT (datetime('now')),
    category_id  INTEGER  REFERENCES categories(category_id)
);

-- Oracle equivalent
CREATE TABLE products (
    product_id   NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_name VARCHAR2(500)  NOT NULL,
    price        NUMBER(15,4)   NOT NULL DEFAULT 0,
    quantity     NUMBER(10)     DEFAULT 0,
    description  CLOB,
    image_data   BLOB,
    is_active    NUMBER(1)      NOT NULL DEFAULT 1,
    created_at   TIMESTAMP      DEFAULT SYSTIMESTAMP,
    category_id  NUMBER(10),
    CONSTRAINT chk_products_is_active CHECK (is_active IN (0,1)),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
```

---

## SQLite Date Storage Patterns

SQLite has no native DATE type. Applications store dates in three ways:
1. **TEXT** in ISO 8601 format: `'2024-01-15 14:30:00'`
2. **INTEGER** as Unix epoch seconds: `1705330200`
3. **REAL** as Julian day numbers: `2460325.1041667`

Each requires a different Oracle loading strategy:

```sql
-- SQLite date stored as TEXT: '2024-01-15 14:30:00'
-- Oracle SQL*Loader mapping:
created_at TIMESTAMP "YYYY-MM-DD HH24:MI:SS"

-- SQLite date stored as INTEGER Unix timestamp
-- Oracle conversion:
SELECT DATE '1970-01-01' + created_at_unix / 86400 AS created_at FROM staging;
-- Or for TIMESTAMP precision:
SELECT TIMESTAMP '1970-01-01 00:00:00' +
       NUMTODSINTERVAL(created_at_unix, 'SECOND') AS created_at
FROM staging;

-- SQLite date stored as Julian day REAL
-- Oracle conversion (Julian day to date):
SELECT TO_DATE('4713-01-01', 'YYYY-MM-DD', 'NLS_CALENDAR=JULIAN') +
       (julian_day - 0.5) AS created_at  -- approximate
FROM staging;
-- Simpler: use Oracle's TO_DATE with Julian format
SELECT TO_DATE(ROUND(julian_day), 'J') AS created_at FROM staging;
```

---

## SQLite Pragmas — No Oracle Equivalent

SQLite uses PRAGMA statements for database configuration and metadata queries. None of these exist in Oracle. Here is what each one does and the Oracle approach.

| SQLite PRAGMA | Purpose | Oracle Approach |
|---|---|---|
| `PRAGMA journal_mode = WAL` | Write-Ahead Logging | Oracle uses redo logs; no user setting needed |
| `PRAGMA foreign_keys = ON` | Enable FK enforcement | Oracle always enforces FKs unless disabled |
| `PRAGMA synchronous = NORMAL` | Disk sync control | Oracle uses `FAST_START_MTTR_TARGET` and `LOG_BUFFER` |
| `PRAGMA cache_size = 10000` | Page cache size | Oracle uses `DB_CACHE_SIZE` (SGA parameter) |
| `PRAGMA page_size = 4096` | DB page size | Oracle uses `DB_BLOCK_SIZE` (set at creation) |
| `PRAGMA auto_vacuum = FULL` | Automatic space reclaim | Oracle uses `ALTER TABLE ... SHRINK SPACE` |
| `PRAGMA integrity_check` | Data integrity check | Oracle `DBMS_REPAIR`, `ANALYZE TABLE ... VALIDATE STRUCTURE` |
| `PRAGMA table_info(tbl)` | Column metadata | `SELECT * FROM user_tab_columns WHERE table_name = 'TBL'` |
| `PRAGMA index_list(tbl)` | List indexes | `SELECT * FROM user_indexes WHERE table_name = 'TBL'` |
| `PRAGMA foreign_key_list(tbl)` | List FK constraints | `SELECT * FROM user_constraints WHERE table_name = 'TBL'` |
| `PRAGMA compile_options` | Build-time options | N/A |
| `PRAGMA database_list` | List attached DBs | `SELECT * FROM v$database` |
| `PRAGMA user_version` | Application schema version | Create your own schema version table |

### Application Schema Versioning

SQLite applications often use `PRAGMA user_version` to track schema migrations. In Oracle, implement a dedicated version table:

```sql
-- Oracle equivalent of PRAGMA user_version
CREATE TABLE schema_version (
    version_number NUMBER(10)  NOT NULL,
    applied_at     TIMESTAMP   DEFAULT SYSTIMESTAMP,
    description    VARCHAR2(500)
);

INSERT INTO schema_version (version_number, description) VALUES (1, 'Initial schema');
COMMIT;

-- Query current version
SELECT MAX(version_number) FROM schema_version;
```

---

## SQLite SQL Dialect → Oracle SQL

### AUTOINCREMENT vs ROWID

SQLite's `INTEGER PRIMARY KEY` is an alias for the internal ROWID. `AUTOINCREMENT` adds a monotonically-increasing guarantee:

```sql
-- SQLite
CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT);
-- vs
CREATE TABLE t (id INTEGER PRIMARY KEY);  -- can reuse deleted row IDs

-- Oracle: always use GENERATED ALWAYS AS IDENTITY for strict increment
CREATE TABLE t (id NUMBER GENERATED ALWAYS AS IDENTITY (ORDER) PRIMARY KEY);
```

### String Functions

| SQLite Function | Oracle Equivalent |
|---|---|
| `LENGTH(s)` | `LENGTH(s)` — same |
| `UPPER(s)` | `UPPER(s)` — same |
| `LOWER(s)` | `LOWER(s)` — same |
| `TRIM(s)` | `TRIM(s)` — same |
| `LTRIM(s)` | `LTRIM(s)` — same |
| `RTRIM(s)` | `RTRIM(s)` — same |
| `SUBSTR(s, pos, len)` | `SUBSTR(s, pos, len)` — same |
| `INSTR(s, sub)` | `INSTR(s, sub)` — same |
| `REPLACE(s, old, new)` | `REPLACE(s, old, new)` — same |
| `PRINTF('%05d', n)` | `TO_CHAR(n, '00000')` |
| `FORMAT(fmt, args)` (SQLite 3.38+) | `TO_CHAR` / `LPAD` / etc. |
| `HEX(blob)` | `RAWTOHEX(blob)` |
| `QUOTE(s)` | No equivalent; use parameterized queries |
| `SOUNDEX(s)` | `SOUNDEX(s)` — available in Oracle |
| `LIKE(pattern, s)` | `s LIKE pattern` (reverse args) |
| `GLOB(pattern, s)` | No equivalent; use `REGEXP_LIKE` with translated pattern |

### Date and Time Functions

```sql
-- SQLite date functions
SELECT DATE('now');
SELECT DATE('now', '+30 days');
SELECT DATETIME('now', 'localtime');
SELECT STRFTIME('%Y-%m', date_col);
SELECT JULIANDAY('now');
SELECT UNIXEPOCH('now');
SELECT UNIXEPOCH(datetime_col);

-- Oracle equivalents
SELECT TRUNC(SYSDATE) FROM DUAL;
SELECT TRUNC(SYSDATE) + 30 FROM DUAL;
SELECT SYSDATE FROM DUAL;  -- already in local time
SELECT TO_CHAR(date_col, 'YYYY-MM') FROM dual;
SELECT TO_NUMBER(TO_CHAR(SYSDATE, 'J')) FROM DUAL;
SELECT (SYSDATE - DATE '1970-01-01') * 86400 FROM DUAL;
SELECT (date_col - DATE '1970-01-01') * 86400 FROM dual;
```

### LIMIT / OFFSET

```sql
-- SQLite
SELECT * FROM products ORDER BY name LIMIT 10;
SELECT * FROM products ORDER BY name LIMIT 10 OFFSET 20;
SELECT * FROM products ORDER BY name LIMIT -1 OFFSET 5;  -- SQLite: -1 means no limit

-- Oracle 12c+
SELECT * FROM products ORDER BY name FETCH FIRST 10 ROWS ONLY;
SELECT * FROM products ORDER BY name OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;
SELECT * FROM products ORDER BY name OFFSET 5 ROWS;  -- no upper limit
```

### UPSERT (INSERT OR REPLACE / ON CONFLICT)

```sql
-- SQLite
INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', 'dark');
INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'dark');
INSERT INTO settings (key, value) VALUES ('theme', 'dark')
    ON CONFLICT(key) DO UPDATE SET value = excluded.value;

-- Oracle (MERGE statement)
MERGE INTO settings tgt
USING (SELECT 'theme' AS key, 'dark' AS value FROM DUAL) src
ON (tgt.key = src.key)
WHEN MATCHED THEN
    UPDATE SET tgt.value = src.value
WHEN NOT MATCHED THEN
    INSERT (key, value) VALUES (src.key, src.value);
```

### Window Functions

SQLite added window function support in version 3.25 (2018). Oracle has had window functions for much longer. The syntax is largely compatible:

```sql
-- SQLite (3.25+)
SELECT name, salary,
       RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank,
       SUM(salary) OVER (ORDER BY hire_date ROWS UNBOUNDED PRECEDING) AS running_salary
FROM employees;

-- Oracle (identical syntax)
SELECT name, salary,
       RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank,
       SUM(salary) OVER (ORDER BY hire_date ROWS UNBOUNDED PRECEDING) AS running_salary
FROM employees;
```

### Common Table Expressions (CTEs)

Both SQLite (3.8.3+) and Oracle support recursive and non-recursive CTEs with compatible syntax:

```sql
-- SQLite recursive CTE (org hierarchy)
WITH RECURSIVE org_tree AS (
    SELECT emp_id, name, manager_id, 0 AS level
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.emp_id, e.name, e.manager_id, t.level + 1
    FROM employees e
    JOIN org_tree t ON e.manager_id = t.emp_id
)
SELECT * FROM org_tree ORDER BY level, name;

-- Oracle equivalent (CONNECT BY is another option, but CTE works too)
WITH org_tree (emp_id, name, manager_id, level) AS (
    SELECT emp_id, name, manager_id, 0 AS level
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.emp_id, e.name, e.manager_id, t.level + 1
    FROM employees e
    JOIN org_tree t ON e.manager_id = t.emp_id
)
SELECT * FROM org_tree ORDER BY level, name;
```

---

## Data Extraction from SQLite

### Method 1 — SQLite .dump (SQL INSERT format)

```bash
# Export all data as INSERT statements
sqlite3 myapp.db .dump > dump.sql

# Export specific table
sqlite3 myapp.db ".dump products" > products_dump.sql

# Export as CSV
sqlite3 -separator ',' myapp.db "SELECT * FROM products;" > products.csv
# With headers:
sqlite3 -header -csv myapp.db "SELECT * FROM products;" > products.csv
```

The `.dump` output contains SQLite-specific syntax and must be manually translated (CREATE TABLE statements, AUTOINCREMENT, etc.) before loading into Oracle.

### Method 2 — CSV Export and SQL*Loader

```bash
# Export with headers as CSV
sqlite3 -header -csv myapp.db \
  "SELECT product_id, product_name, price, quantity, is_active,
          strftime('%Y-%m-%d %H:%M:%S', created_at) AS created_at
   FROM products;" > products.csv
```

```
-- SQL*Loader control file
OPTIONS (DIRECT=TRUE, SKIP=1)
LOAD DATA
INFILE 'products.csv'
APPEND
INTO TABLE products
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
TRAILING NULLCOLS
(
    product_id,
    product_name,
    price,
    quantity,
    is_active,
    created_at TIMESTAMP "YYYY-MM-DD HH24:MI:SS"
)
```

### Method 3 — Python ETL Script

For databases with complex SQLite-specific data or type coercions, a Python script gives maximum control:

```python
import sqlite3
import oracledb  # python-oracledb (successor to cx_Oracle; install with: pip install oracledb)
from datetime import datetime

# Connect to source
src_conn = sqlite3.connect('myapp.db')
src_conn.row_factory = sqlite3.Row
src_cur = src_conn.cursor()

# Connect to target (thin mode — no Oracle Client libs required)
tgt_conn = oracledb.connect(user='user', password='pass', dsn='localhost:1521/ORCL')
tgt_cur = tgt_conn.cursor()

# Migrate products
src_cur.execute("SELECT * FROM products")
rows = src_cur.fetchall()

insert_sql = """
INSERT INTO products (product_id, product_name, price, quantity,
                      is_active, created_at)
VALUES (:1, :2, :3, :4, :5, TO_TIMESTAMP(:6, 'YYYY-MM-DD HH24:MI:SS'))
"""

batch = []
for row in rows:
    batch.append((
        row['product_id'],
        row['product_name'],
        float(row['price']) if row['price'] else 0.0,
        int(row['quantity']) if row['quantity'] else 0,
        1 if row['is_active'] else 0,
        row['created_at']
    ))

tgt_cur.executemany(insert_sql, batch)
tgt_conn.commit()

src_conn.close()
tgt_conn.close()
print(f"Migrated {len(batch)} products")
```

---

## Scaling Considerations: Embedded to Enterprise

SQLite is optimized for single-writer, embedded use. Moving to Oracle requires rethinking several design assumptions:

### Connection Management

```
SQLite:                          Oracle:
- Single process, zero config    - Client-server, listener required
- File-based locking             - Multi-version concurrency control
- No connection pooling needed   - Use connection pooling (DRCP, UCP, c3p0)
- One writer at a time           - Thousands of concurrent writers
```

### Transaction Boundaries

SQLite in WAL mode allows one writer and multiple readers. Oracle's MVCC allows unlimited concurrent readers and writers. Applications that were designed for SQLite's serialized writes may not correctly handle Oracle's concurrent write scenarios — review all transaction isolation assumptions.

### File References and LOB Handling

SQLite databases are often used in apps that store file paths (image paths, document paths) rather than file content, because SQLite BLOB performance is limited. Oracle's BLOB and SecureFiles provide much better large object performance, so the migration is a good opportunity to evaluate whether file content should be inlined:

```sql
-- SQLite pattern (file path stored)
CREATE TABLE documents (
    id       INTEGER PRIMARY KEY,
    filename TEXT,
    filepath TEXT   -- '/var/app/uploads/doc123.pdf'
);

-- Oracle option 1: keep file paths (simpler migration)
CREATE TABLE documents (
    id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    filename VARCHAR2(500),
    filepath VARCHAR2(1000)
);

-- Oracle option 2: inline content (better for enterprise)
CREATE TABLE documents (
    id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    filename VARCHAR2(500),
    content  BLOB
) LOB (content) STORE AS SECUREFILE (
    DEDUPLICATE
    COMPRESS HIGH
);
```

---

## Best Practices

1. **Audit SQLite for duck-typed columns.** Before migrating, query each column's actual stored types using SQLite's `typeof()` function to discover what data actually lives in each column:

```sql
-- Find all distinct types stored in the 'val' column of 'data' table
SELECT typeof(val), COUNT(*) FROM data GROUP BY typeof(val);
```

2. **Enforce constraints in Oracle from day one.** SQLite has optional constraint enforcement. Use this migration as an opportunity to add NOT NULL, CHECK, and FK constraints that should have been there all along.

3. **Size VARCHAR2 columns appropriately.** SQLite TEXT is unlimited. Survey actual max lengths before declaring Oracle VARCHAR2 sizes:

```sql
-- SQLite: check max length of each TEXT column
SELECT MAX(LENGTH(product_name)) AS max_len FROM products;
```

4. **Test INSERT OR REPLACE → MERGE conversion.** SQLite's INSERT OR REPLACE semantics differ from Oracle MERGE in important ways: INSERT OR REPLACE with a UNIQUE constraint violation deletes the conflicting row first (losing data in other columns), then inserts. Oracle MERGE updates in place. Verify application behavior.

5. **Replace SQLite aggregate functions.** SQLite has `group_concat()` — replace with Oracle `LISTAGG`.

---

## Common Migration Pitfalls

**Pitfall 1 — SQLite BOOLEAN is actually INTEGER:**
Queries that test `WHERE is_active = TRUE` (SQLite stores this as integer 1) work in SQLite due to type flexibility but will fail in Oracle where `TRUE` has no meaning outside of PL/SQL. Replace with `WHERE is_active = 1`.

**Pitfall 2 — NULL arithmetic:**
Both SQLite and Oracle propagate NULL through arithmetic (NULL + 1 = NULL), but SQLite's `COALESCE` behavior for type coercion may differ from Oracle in edge cases. Test all null-handling paths.

**Pitfall 3 — Case sensitivity in LIKE patterns:**
SQLite `LIKE` is case-insensitive for ASCII characters. Oracle `LIKE` is case-sensitive. Review all LIKE patterns.

**Pitfall 4 — INTEGER PRIMARY KEY without AUTOINCREMENT reuses IDs:**
SQLite's `INTEGER PRIMARY KEY` without `AUTOINCREMENT` will reuse the ID of the maximum deleted row if a new row is inserted and the max ID is less than the deleted max. Oracle's identity column never reuses IDs with `NOCYCLE`.

**Pitfall 5 — GLOB pattern syntax:**
SQLite has a GLOB operator that uses Unix-style wildcards (`*` for any, `?` for one). Oracle has no GLOB; translate to `REGEXP_LIKE` or `LIKE`:
```sql
-- SQLite GLOB
WHERE filename GLOB '*.pdf'

-- Oracle
WHERE filename LIKE '%.pdf'
-- Or with regex for exact match:
WHERE REGEXP_LIKE(filename, '\.pdf$', 'i')
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference — Data Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database 19c SQL Language Reference — CREATE TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database 19c SQL Language Reference — Row Limiting (FETCH FIRST)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html)
- [Oracle Database 19c SQL Language Reference — MERGE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/MERGE.html)
- [Oracle Database 19c Utilities — SQL*Loader](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader.html)
- [python-oracledb documentation](https://python-oracledb.readthedocs.io/en/latest/)
