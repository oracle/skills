# Migrating Sybase ASE to Oracle

## Overview

Sybase Adaptive Server Enterprise (ASE), now SAP ASE, shares a common lineage with Microsoft SQL Server — both descended from Sybase's original database engine. As a result, Sybase ASE and SQL Server have very similar Transact-SQL (T-SQL) dialects, procedural language syntax, and architecture. Many of the concepts in the SQL Server migration guide (`migrate-sqlserver-to-oracle.md`) apply to Sybase ASE as well.

This guide focuses on Sybase-specific behaviors and the differences between Sybase T-SQL and Oracle PL/SQL. Key areas include data type mapping, stored procedure conversion (Sybase T-SQL procedures vs Oracle PL/SQL), transaction handling differences (Sybase's chained/unchained modes), BCP (Bulk Copy Program) to SQL*Loader mapping, and Sybase-specific SQL syntax.

---

## Sybase ASE to Oracle Type Mapping

### Numeric Types

| Sybase ASE | Oracle | Notes |
|---|---|---|
| `TINYINT` | `NUMBER(3)` | 0–255 |
| `SMALLINT` | `NUMBER(5)` | −32,768–32,767 |
| `INT` / `INTEGER` | `NUMBER(10)` | |
| `BIGINT` | `NUMBER(19)` | ASE 15.0+ |
| `DECIMAL(p,s)` / `DEC(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `NUMERIC(p,s)` / `NUM(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `FLOAT(n)` | `BINARY_FLOAT` or `BINARY_DOUBLE` | |
| `REAL` | `BINARY_FLOAT` | IEEE 754 32-bit |
| `DOUBLE PRECISION` | `BINARY_DOUBLE` | IEEE 754 64-bit |
| `MONEY` | `NUMBER(19,4)` | 8-byte Sybase money type |
| `SMALLMONEY` | `NUMBER(10,4)` | 4-byte |
| `BIT` | `NUMBER(1)` with CHECK (0,1) | Boolean bit |

### String Types

| Sybase ASE | Oracle | Notes |
|---|---|---|
| `CHAR(n)` | `CHAR(n)` | Sybase max 255 bytes; Oracle max 2,000 |
| `VARCHAR(n)` | `VARCHAR2(n)` | Sybase max 16,383 bytes; Oracle max 4,000/32,767 |
| `NCHAR(n)` | `NCHAR(n)` | Unicode fixed-length |
| `NVARCHAR(n)` | `NVARCHAR2(n)` | Unicode variable-length |
| `TEXT` | `CLOB` | Up to 2 GB in Sybase |
| `UNITEXT` | `NCLOB` | Unicode TEXT (ASE 15.0+) |
| `IMAGE` | `BLOB` | Binary large object |

### Date / Time Types

| Sybase ASE | Oracle | Notes |
|---|---|---|
| `DATETIME` | `TIMESTAMP` | Sybase resolution: 1/300th second |
| `SMALLDATETIME` | `DATE` | Minute precision |
| `DATE` | `DATE` | ASE 12.5.1+; Sybase DATE is date-only; Oracle includes time |
| `TIME` | No equivalent | Use `VARCHAR2(12)` or `NUMBER` |
| `BIGDATETIME` | `TIMESTAMP(6)` | ASE 15.7+; microsecond precision |
| `BIGTIME` | No equivalent | ASE 15.7+; microsecond time |

### Binary and Other Types

| Sybase ASE | Oracle | Notes |
|---|---|---|
| `BINARY(n)` | `RAW(n)` | Fixed-length binary; max 255 bytes in Sybase |
| `VARBINARY(n)` | `RAW(n)` | Variable-length binary |
| `TIMESTAMP` (row version) | No equivalent | Sybase TIMESTAMP is a row version counter, not a datetime; use `ORA_ROWSCN` |
| `UNICHAR(n)` | `NCHAR(n)` | Sybase Unicode fixed |
| `UNIVARCHAR(n)` | `NVARCHAR2(n)` | Sybase Unicode variable |

**Important distinction:** Sybase `TIMESTAMP` is a binary(8) row version number (like SQL Server's ROWVERSION), NOT a date/time type. Applications that use Sybase TIMESTAMP for optimistic concurrency control need to be redesigned in Oracle:

```sql
-- Sybase: row version for optimistic locking
CREATE TABLE products (
    product_id   INT          IDENTITY NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    price        MONEY,
    row_version  TIMESTAMP    NOT NULL  -- auto-updated binary counter
);

-- Oracle: use ORA_ROWSCN or add an explicit version column
CREATE TABLE products (
    product_id   NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_name VARCHAR2(200) NOT NULL,
    price        NUMBER(19,4),
    version_num  NUMBER(10)   DEFAULT 0 NOT NULL  -- application-managed version
);
-- Or use ORA_ROWSCN pseudo-column (system-maintained SCN)
SELECT ORA_ROWSCN, product_id FROM products WHERE product_id = 42;
```

---

## Sybase Stored Procedure Conversion to PL/SQL

### Basic Procedure Structure

```sql
-- Sybase T-SQL stored procedure
CREATE PROCEDURE sp_update_salary
    @emp_id        INT,
    @new_salary    MONEY,
    @rows_affected INT OUTPUT
AS
BEGIN
    UPDATE employees
    SET salary = @new_salary,
        updated_date = GETDATE()
    WHERE emp_id = @emp_id;

    SELECT @rows_affected = @@ROWCOUNT;

    IF @rows_affected = 0
    BEGIN
        RAISERROR 20001 "Employee not found: %1!", @emp_id;
        RETURN -1;
    END;

    RETURN 0;
END;
GO

-- Oracle PL/SQL equivalent
CREATE OR REPLACE PROCEDURE sp_update_salary(
    p_emp_id        IN  NUMBER,
    p_new_salary    IN  NUMBER,
    p_rows_affected OUT NUMBER
)
AS
BEGIN
    UPDATE employees
    SET salary       = p_new_salary,
        updated_date = SYSDATE
    WHERE emp_id = p_emp_id;

    p_rows_affected := SQL%ROWCOUNT;

    IF p_rows_affected = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Employee not found: ' || p_emp_id);
    END IF;
END sp_update_salary;
/
```

### Variable Declaration

```sql
-- Sybase
DECLARE
    @counter    INT,
    @total      MONEY,
    @name       VARCHAR(100);

SELECT @counter = 0, @total = 0.00, @name = '';

-- Oracle PL/SQL
DECLARE
    v_counter  NUMBER(10)    := 0;
    v_total    NUMBER(19,4)  := 0;
    v_name     VARCHAR2(100) := '';
BEGIN
    NULL;
END;
/
```

### Control Flow

```sql
-- Sybase: IF / ELSE
IF @score >= 90
    SELECT 'A' AS grade
ELSE IF @score >= 80
    SELECT 'B' AS grade
ELSE
    SELECT 'C' AS grade;

-- Oracle PL/SQL
IF v_score >= 90 THEN
    v_grade := 'A';
ELSIF v_score >= 80 THEN
    v_grade := 'B';
ELSE
    v_grade := 'C';
END IF;
```

```sql
-- Sybase: WHILE loop with BREAK/CONTINUE
DECLARE @i INT = 1;
WHILE @i <= 100
BEGIN
    IF @i % 2 = 0
    BEGIN
        SET @i = @i + 1;
        CONTINUE;
    END;
    INSERT INTO odd_numbers (num) VALUES (@i);
    IF @i >= 99 BREAK;
    SET @i = @i + 1;
END;

-- Oracle PL/SQL
DECLARE
    v_i NUMBER := 1;
BEGIN
    WHILE v_i <= 100 LOOP
        IF MOD(v_i, 2) = 0 THEN
            v_i := v_i + 1;
            CONTINUE;
        END IF;
        INSERT INTO odd_numbers (num) VALUES (v_i);
        EXIT WHEN v_i >= 99;
        v_i := v_i + 1;
    END LOOP;
END;
/
```

### Error Handling

Sybase T-SQL uses `@@ERROR` (a global variable that must be checked after each statement) and `RAISERROR`. Oracle uses structured exception handling blocks.

```sql
-- Sybase: check @@ERROR after each statement
BEGIN TRANSACTION;

INSERT INTO orders (customer_id, total) VALUES (@cust_id, @total);
IF @@ERROR <> 0
BEGIN
    ROLLBACK TRANSACTION;
    RAISERROR 20100 "Failed to insert order";
    RETURN -1;
END;

UPDATE customer_stats SET order_count = order_count + 1
WHERE customer_id = @cust_id;
IF @@ERROR <> 0
BEGIN
    ROLLBACK TRANSACTION;
    RAISERROR 20101 "Failed to update stats";
    RETURN -1;
END;

COMMIT TRANSACTION;
RETURN 0;

-- Oracle PL/SQL: structured exception handling
BEGIN
    INSERT INTO orders (customer_id, total) VALUES (v_cust_id, v_total);
    UPDATE customer_stats SET order_count = order_count + 1
    WHERE customer_id = v_cust_id;
    COMMIT;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20100, 'Duplicate order detected');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20101, 'Order processing failed: ' || SQLERRM);
END;
/
```

### Temporary Tables

```sql
-- Sybase: local temp table (session-scoped)
CREATE TABLE #staging (
    id    INT IDENTITY,
    value VARCHAR(100)
);
INSERT INTO #staging (value) VALUES ('test');
SELECT * FROM #staging;
DROP TABLE #staging;

-- Sybase: global temp table (accessible across sessions)
CREATE TABLE ##global_staging (id INT, value VARCHAR(100));

-- Oracle: Global Temporary Table (created once, data is session-scoped)
CREATE GLOBAL TEMPORARY TABLE staging (
    id    NUMBER,
    value VARCHAR2(100)
)
ON COMMIT DELETE ROWS;  -- or ON COMMIT PRESERVE ROWS

-- Usage (same as regular table; Oracle GTTs persist across sessions but not their data)
INSERT INTO staging (id, value) VALUES (1, 'test');
SELECT * FROM staging;
-- Data automatically cleared at end of transaction (DELETE ROWS) or session (PRESERVE ROWS)
```

### Cursors

```sql
-- Sybase cursor
DECLARE order_cursor CURSOR FOR
    SELECT order_id, total FROM orders WHERE status = 'pending';

OPEN order_cursor;
FETCH order_cursor INTO @oid, @total;
WHILE @@SQLSTATUS = 0
BEGIN
    -- process @oid, @total
    FETCH order_cursor INTO @oid, @total;
END;
CLOSE order_cursor;
DEALLOCATE CURSOR order_cursor;

-- Oracle PL/SQL cursor (recommended FOR loop approach)
BEGIN
    FOR rec IN (SELECT order_id, total FROM orders WHERE status = 'pending') LOOP
        -- process rec.order_id, rec.total
        NULL;
    END LOOP;
END;
/

-- Oracle explicit cursor (for more control)
DECLARE
    CURSOR order_cur IS
        SELECT order_id, total FROM orders WHERE status = 'pending';
    v_oid   orders.order_id%TYPE;
    v_total orders.total%TYPE;
BEGIN
    OPEN order_cur;
    LOOP
        FETCH order_cur INTO v_oid, v_total;
        EXIT WHEN order_cur%NOTFOUND;
        -- process
    END LOOP;
    CLOSE order_cur;
END;
/
```

---

## Transaction Handling Differences

This is one of the most critical areas of Sybase-to-Oracle migration.

### Sybase Transaction Modes

Sybase ASE operates in two modes:

**Unchained mode (default):** Each DML statement is its own implicit transaction. You must explicitly `BEGIN TRANSACTION` to group statements.

**Chained mode (ANSI-compatible):** Each DML statement begins an implicit transaction that must be explicitly committed or rolled back (similar to Oracle's behavior).

```sql
-- Sybase unchained mode (default): each statement auto-commits
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- ^ This is immediately committed — no explicit COMMIT needed

-- Sybase: explicit transaction grouping
BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT TRANSACTION;
```

### Oracle Transaction Model

Oracle always operates in chained (ANSI) mode. Every DML statement is part of an open transaction until explicitly committed or rolled back. DDL auto-commits.

```sql
-- Oracle: implicit transaction for all DML
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- NOT committed yet — must COMMIT explicitly
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- Rollback if something goes wrong
BEGIN
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/
```

**Migration implication:** Sybase applications running in unchained mode have auto-commit behavior for individual statements. When migrating to Oracle, these applications will find that uncommitted DML is visible within the same session but NOT to other sessions. Application connection management and transaction scoping must be reviewed carefully.

### SAVE TRANSACTION → SAVEPOINT

```sql
-- Sybase
BEGIN TRANSACTION;
INSERT INTO t1 (col) VALUES ('a');
SAVE TRANSACTION sp1;
INSERT INTO t2 (col) VALUES ('b');
-- Something went wrong:
ROLLBACK TRANSACTION sp1;  -- rolls back to savepoint, not full transaction
COMMIT TRANSACTION;

-- Oracle
INSERT INTO t1 (col) VALUES ('a');
SAVEPOINT sp1;
INSERT INTO t2 (col) VALUES ('b');
-- Something went wrong:
ROLLBACK TO SAVEPOINT sp1;
COMMIT;
```

---

## BCP to SQL*Loader

Sybase's Bulk Copy Program (BCP) is the primary tool for bulk data export and import.

### BCP Export from Sybase

```bash
# BCP export — native format (binary, Sybase-specific)
bcp mydb..customers out /data/customers.dat -Smyhost -Umyuser -Pmypass -n

# BCP export — character format (portable, recommended for Oracle migration)
bcp mydb..customers out /data/customers.csv -Smyhost -Umyuser -Pmypass -c -t"," -r"\n"

# BCP export with format file
bcp mydb..customers format nul -Smyhost -Umyuser -Pmypass -c -t"," -f customers.fmt
bcp mydb..customers out /data/customers.dat -Smyhost -Umyuser -Pmypass -f customers.fmt
```

### SQL*Loader Import to Oracle

```
-- SQL*Loader control file: customers.ctl
OPTIONS (DIRECT=TRUE, ROWS=5000, ERRORS=100)
LOAD DATA
INFILE '/data/customers.csv'
APPEND
INTO TABLE customers
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
TRAILING NULLCOLS
(
    customer_id,
    first_name,
    last_name,
    email,
    created_date   DATE "YYYY-MM-DD",
    last_login     TIMESTAMP "YYYY-MM-DD HH24:MI:SS.FF3",
    is_active      "DECODE(:is_active, '1', 1, '0', 0, NULL)"
)
```

```bash
sqlldr userid=myuser/mypass@mydb control=customers.ctl log=customers.log bad=customers.bad
```

---

## Sybase-Specific SQL → Oracle Equivalents

### Global Variables → Context Functions

| Sybase | Oracle Equivalent |
|---|---|
| `@@ROWCOUNT` | `SQL%ROWCOUNT` (in PL/SQL) |
| `@@ERROR` | `SQLCODE` (in PL/SQL exception section) |
| `@@TRANCOUNT` | No direct equivalent |
| `@@IDENTITY` | Use `RETURNING INTO` clause |
| `@@SPID` | `SYS_CONTEXT('USERENV', 'SID')` |
| `@@VERSION` | `SELECT * FROM v$version` |
| `@@SERVERNAME` | `SYS_CONTEXT('USERENV', 'DB_NAME')` |
| `@@DBTS` | `SELECT SYSTIMESTAMP FROM DUAL` |
| `GETDATE()` | `SYSDATE` or `SYSTIMESTAMP` |
| `OBJECT_ID('tablename')` | `SELECT object_id FROM user_objects WHERE object_name = 'TABLENAME'` |

### String Functions

| Sybase Function | Oracle Equivalent |
|---|---|
| `CHARINDEX(sub, s [, start])` | `INSTR(s, sub [, start])` |
| `PATINDEX('%pat%', s)` | `REGEXP_INSTR(s, 'pat')` |
| `LEFT(s, n)` | `SUBSTR(s, 1, n)` |
| `RIGHT(s, n)` | `SUBSTR(s, -n)` |
| `STUFF(s, start, len, replacement)` | `SUBSTR(s,1,start-1) \|\| replacement \|\| SUBSTR(s,start+len)` |
| `SPACE(n)` | `RPAD(' ', n)` |
| `REPLICATE(s, n)` | Custom PL/SQL function or `RPAD(s, n*LENGTH(s), s)` |
| `REVERSE(s)` | Custom PL/SQL function |
| `STR(n, len, dec)` | `TO_CHAR(n, RPAD('9', len-dec-1, '9') \|\| '.' \|\| RPAD('0', dec, '0'))` |
| `ASCII(s)` | `ASCII(s)` — same |
| `CHAR(n)` | `CHR(n)` |
| `SOUNDEX(s)` | `SOUNDEX(s)` — same |
| `DIFFERENCE(s1, s2)` | No equivalent; compare SOUNDEX values |

### Date Functions

| Sybase Function | Oracle Equivalent |
|---|---|
| `GETDATE()` | `SYSDATE` |
| `GETUTCDATE()` | `SYS_EXTRACT_UTC(SYSTIMESTAMP)` |
| `DATEADD(unit, n, d)` | `d + n` (days), `ADD_MONTHS(d, n)` (months), etc. |
| `DATEDIFF(unit, d1, d2)` | `d2 - d1` (days), `MONTHS_BETWEEN(d2, d1)` (months) |
| `DATEPART(unit, d)` | `EXTRACT(unit FROM d)` |
| `DATENAME(unit, d)` | `TO_CHAR(d, 'MONTH')` etc. |
| `DAY(d)` | `EXTRACT(DAY FROM d)` |
| `MONTH(d)` | `EXTRACT(MONTH FROM d)` |
| `YEAR(d)` | `EXTRACT(YEAR FROM d)` |
| `CONVERT(type, d, style)` | `TO_DATE`, `TO_CHAR`, `TO_NUMBER` |

---

## Best Practices

1. **Determine Sybase transaction mode before migrating application code.** Run `SELECT @@TRANCHAINED` in Sybase to see whether applications use chained (1) or unchained (0) mode. If unchained, the application will need explicit transaction management added for Oracle.

2. **Audit all @@ERROR checks.** Sybase code that checks `@@ERROR` after every statement is verbose and fragile. Oracle PL/SQL's exception handling block is cleaner — refactor the error handling during migration rather than replicating the @@ERROR pattern.

3. **Test IDENTITY column migration carefully.** Sybase IDENTITY columns behave like Oracle identity columns but have different starting and step options. Verify that migrated IDENTITY columns start above the maximum existing ID after data migration.

4. **Handle TEXT and IMAGE columns specially.** Sybase TEXT/IMAGE LOBs require special handling in BCP and are stored differently from regular columns. Use the character format BCP export and validate LOB content sizes before importing to Oracle CLOB/BLOB.

5. **Map Sybase rules and defaults.** Sybase has `CREATE RULE` and `CREATE DEFAULT` objects that are bound to columns or user-defined types. These translate to Oracle CHECK constraints and DEFAULT column values respectively.

```sql
-- Sybase rule (separate object)
CREATE RULE salary_rule AS @salary >= 0;
EXEC sp_bindrule 'salary_rule', 'employees.salary';

-- Oracle CHECK constraint (inline)
CREATE TABLE employees (
    emp_id NUMBER PRIMARY KEY,
    salary NUMBER(10,2) CHECK (salary >= 0)
);
```

6. **Review Sybase user-defined datatypes.** Sybase supports user-defined types that combine a base type with rules and defaults. Oracle uses domains (introduced in 23ai, available in 26ai) or just base types with constraints.

```sql
-- Sybase UDT
EXEC sp_addtype 'phone_num', 'varchar(15)', 'NOT NULL';
CREATE RULE phone_rule AS @p LIKE '[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]';
EXEC sp_bindrule phone_rule, phone_num;

-- Oracle: inline constraint
CREATE TABLE contacts (
    phone VARCHAR2(15) NOT NULL
                       CHECK (REGEXP_LIKE(phone, '^\d{3}-\d{3}-\d{4}$'))
);
```

---

## Common Migration Pitfalls

**Pitfall 1 — Sybase unchained auto-commit behavior:**
The most common source of behavioral differences. In Sybase unchained mode, each DML auto-commits. In Oracle, nothing auto-commits. Applications that rely on data being committed immediately after a single UPDATE (e.g., for visibility to other sessions) will see different behavior.

**Pitfall 2 — RAISERROR syntax:**
Sybase RAISERROR uses error number first, then message. Oracle RAISE_APPLICATION_ERROR takes a negative number and a message string. Custom error numbers in Sybase can be any user-defined error number; in Oracle they must be in the range -20000 to -20999.
```sql
-- Sybase
RAISERROR 20001 "Record not found";

-- Oracle
RAISE_APPLICATION_ERROR(-20001, 'Record not found');
```

**Pitfall 3 — TIMESTAMP as row version:**
As noted in the type mapping, Sybase TIMESTAMP is NOT a datetime — it is a binary row version counter. Any Oracle code that treats this column as a date will fail. Redesign the optimistic concurrency pattern.

**Pitfall 4 — Subquery result comparison:**
Sybase allows some non-standard subquery comparisons. Oracle enforces strict subquery semantics. Review all `= (subquery)` patterns to ensure the subquery truly returns exactly one row, or add appropriate handling:
```sql
-- Risky in Sybase (silently returns first row if multiple rows)
WHERE emp_id = (SELECT emp_id FROM employees WHERE dept = 'IT');

-- Oracle: raises ORA-01427 if subquery returns more than one row
-- Fix: use IN instead
WHERE emp_id IN (SELECT emp_id FROM employees WHERE dept = 'IT');
```

**Pitfall 5 — Sybase lock escalation:**
Sybase has page-level locking and row-level locking modes. Oracle uses MVCC and row-level locking exclusively. Applications designed around Sybase's locking behavior (especially those that try to read uncommitted data) need MVCC review.

**Pitfall 6 — NULL handling in aggregates:**
Both Sybase and Oracle ignore NULL in aggregates (COUNT, SUM, etc.) following ANSI SQL. This is compatible, but Sybase's `ISNULL()` function needs to be replaced with Oracle's `NVL()`:
```sql
-- Sybase
SELECT ISNULL(phone, 'N/A') FROM contacts;

-- Oracle
SELECT NVL(phone, 'N/A') FROM contacts;
SELECT COALESCE(phone, 'N/A') FROM contacts;
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c SQL Language Reference — Data Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database 19c SQL Language Reference — CREATE TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database 19c PL/SQL Language Reference — PL/SQL Language Fundamentals](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-language-fundamentals.html)
- [Oracle Database 19c PL/SQL Language Reference — Error Handling (RAISE_APPLICATION_ERROR)](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-error-handling.html)
- [Oracle Database 19c SQL Language Reference — CREATE GLOBAL TEMPORARY TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database 19c Utilities — SQL*Loader](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader.html)
- [AWS Schema Conversion Tool User Guide — SAP ASE to Oracle](https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/CHAP_Welcome.html)
