# Migrating SQL Server to Oracle

## Overview

Microsoft SQL Server and Oracle are the two most commonly deployed enterprise relational databases, and migrations between them are among the most frequent in the industry. Despite both being mature ACID-compliant RDBMS engines with broad SQL standard support, they differ dramatically in procedural language (T-SQL vs PL/SQL), transaction management, DDL behavior, data type naming, and administrative concepts. This guide covers all major translation requirements for a SQL Server to Oracle migration.

Microsoft provides the **AWS Schema Conversion Tool (SCT)** and Oracle provides **SQL Developer Migration Workbench** to automate much of this work. Note: "SSMA for Oracle" (Microsoft's product) migrates FROM Oracle TO SQL Server — the reverse direction. For SQL Server to Oracle, use AWS SCT or SQL Developer Migration Workbench. This guide covers what those tools handle automatically and what requires manual intervention.

---

## T-SQL to PL/SQL Conversion

### Batch Structure

```sql
-- T-SQL: GO separates batches
CREATE TABLE departments (dept_id INT, dept_name VARCHAR(100));
GO
INSERT INTO departments VALUES (1, 'Engineering');
GO

-- Oracle: forward slash (/) ends PL/SQL blocks; DDL is standalone
CREATE TABLE departments (dept_id NUMBER(10), dept_name VARCHAR2(100));
/
INSERT INTO departments VALUES (1, 'Engineering');
COMMIT;
/
```

### Variable Declaration and Assignment

```sql
-- T-SQL
DECLARE @employee_count INT = 0;
DECLARE @dept_name NVARCHAR(100);
SET @employee_count = 10;
SELECT @dept_name = dept_name FROM departments WHERE dept_id = 1;

-- Oracle PL/SQL
DECLARE
    v_employee_count NUMBER(10) := 0;
    v_dept_name VARCHAR2(100);
BEGIN
    v_employee_count := 10;
    SELECT dept_name INTO v_dept_name FROM departments WHERE dept_id = 1;
END;
/
```

### IF / BEGIN-END → IF / THEN / END IF

```sql
-- T-SQL
IF @salary > 100000
BEGIN
    UPDATE employees SET bonus = salary * 0.15 WHERE emp_id = @emp_id;
    PRINT 'High-earner bonus applied';
END
ELSE IF @salary > 50000
BEGIN
    UPDATE employees SET bonus = salary * 0.10 WHERE emp_id = @emp_id;
END
ELSE
BEGIN
    UPDATE employees SET bonus = salary * 0.05 WHERE emp_id = @emp_id;
END;

-- Oracle PL/SQL
IF v_salary > 100000 THEN
    UPDATE employees SET bonus = salary * 0.15 WHERE emp_id = v_emp_id;
    DBMS_OUTPUT.PUT_LINE('High-earner bonus applied');
ELSIF v_salary > 50000 THEN
    UPDATE employees SET bonus = salary * 0.10 WHERE emp_id = v_emp_id;
ELSE
    UPDATE employees SET bonus = salary * 0.05 WHERE emp_id = v_emp_id;
END IF;
```

### TRY-CATCH → EXCEPTION

```sql
-- T-SQL
BEGIN TRY
    INSERT INTO accounts (account_id, balance) VALUES (1001, 500.00);
    UPDATE accounts SET balance = balance - 200 WHERE account_id = 1001;
    COMMIT;
END TRY
BEGIN CATCH
    ROLLBACK;
    PRINT 'Error: ' + ERROR_MESSAGE();
    RAISERROR(ERROR_MESSAGE(), 16, 1);
END CATCH;

-- Oracle PL/SQL
BEGIN
    INSERT INTO accounts (account_id, balance) VALUES (1001, 500.00);
    UPDATE accounts SET balance = balance - 200 WHERE account_id = 1001;
    COMMIT;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Duplicate account ID');
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
        RAISE;
END;
/
```

### PRINT → DBMS_OUTPUT.PUT_LINE

```sql
-- T-SQL
PRINT 'Processing record: ' + CAST(@id AS VARCHAR(10));

-- Oracle PL/SQL
DBMS_OUTPUT.PUT_LINE('Processing record: ' || TO_CHAR(v_id));

-- Enable output in SQL*Plus or SQL Developer:
SET SERVEROUTPUT ON SIZE UNLIMITED;
```

### WHILE Loop

```sql
-- T-SQL
DECLARE @i INT = 1;
WHILE @i <= 10
BEGIN
    INSERT INTO audit_log (seq_num) VALUES (@i);
    SET @i = @i + 1;
END;

-- Oracle PL/SQL
DECLARE
    v_i NUMBER := 1;
BEGIN
    WHILE v_i <= 10 LOOP
        INSERT INTO audit_log (seq_num) VALUES (v_i);
        v_i := v_i + 1;
    END LOOP;
END;
/
```

### Stored Procedure Structure

```sql
-- T-SQL stored procedure
CREATE PROCEDURE usp_get_customer_orders
    @customer_id   INT,
    @start_date    DATE,
    @order_count   INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT order_id, order_date, total_amount
    FROM orders
    WHERE customer_id = @customer_id
      AND order_date >= @start_date;

    SELECT @order_count = COUNT(*)
    FROM orders
    WHERE customer_id = @customer_id
      AND order_date >= @start_date;
END;
GO

-- Oracle PL/SQL procedure
-- Note: Oracle procedures return result sets via SYS_REFCURSOR
CREATE OR REPLACE PROCEDURE usp_get_customer_orders(
    p_customer_id IN  NUMBER,
    p_start_date  IN  DATE,
    p_order_count OUT NUMBER,
    p_result      OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_result FOR
        SELECT order_id, order_date, total_amount
        FROM orders
        WHERE customer_id = p_customer_id
          AND order_date >= p_start_date;

    SELECT COUNT(*) INTO p_order_count
    FROM orders
    WHERE customer_id = p_customer_id
      AND order_date >= p_start_date;
END usp_get_customer_orders;
/
```

---

## Identity Columns

### SQL Server IDENTITY → Oracle

```sql
-- T-SQL
CREATE TABLE products (
    product_id   INT          IDENTITY(1,1) PRIMARY KEY,
    product_name NVARCHAR(200) NOT NULL,
    price        DECIMAL(10,2)
);

-- Oracle 12c+ (identity column — preferred)
CREATE TABLE products (
    product_id   NUMBER       GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
    product_name VARCHAR2(200 CHAR) NOT NULL,
    price        NUMBER(10,2)
);

-- Oracle — sequence-based (for explicit control or pre-12c)
CREATE SEQUENCE products_seq START WITH 1 INCREMENT BY 1 CACHE 20;
CREATE TABLE products (
    product_id   NUMBER       DEFAULT products_seq.NEXTVAL PRIMARY KEY,
    product_name VARCHAR2(200 CHAR) NOT NULL,
    price        NUMBER(10,2)
);
```

### Retrieving the Last Generated ID

```sql
-- T-SQL
INSERT INTO products (product_name, price) VALUES ('Widget A', 9.99);
SELECT SCOPE_IDENTITY() AS new_id;
-- Or:
SELECT @@IDENTITY;

-- Oracle (PL/SQL with RETURNING INTO)
DECLARE
    v_new_id products.product_id%TYPE;
BEGIN
    INSERT INTO products (product_name, price) VALUES ('Widget A', 9.99)
    RETURNING product_id INTO v_new_id;
    DBMS_OUTPUT.PUT_LINE('New product ID: ' || v_new_id);
END;
/
```

---

## TOP N → FETCH FIRST

```sql
-- T-SQL
SELECT TOP 10 * FROM products ORDER BY price DESC;
SELECT TOP 10 PERCENT * FROM products ORDER BY price DESC;

-- Oracle 12c+
SELECT * FROM products ORDER BY price DESC FETCH FIRST 10 ROWS ONLY;

-- No direct equivalent for TOP PERCENT; calculate the count first or use:
SELECT * FROM (
    SELECT p.*, NTILE(10) OVER (ORDER BY price DESC) AS pct_group
    FROM products p
)
WHERE pct_group = 1;  -- top 10% approx
```

---

## Data Type Mapping

### String Types

| SQL Server | Oracle | Notes |
|---|---|---|
| `CHAR(n)` | `CHAR(n)` | SQL Server stores up to 8,000 bytes; Oracle 2,000 bytes |
| `VARCHAR(n)` | `VARCHAR2(n)` | SQL Server max 8,000 bytes; Oracle 4,000 (32,767 extended) |
| `VARCHAR(MAX)` | `CLOB` | Up to 2 GB in SQL Server; Oracle CLOB up to 128 TB |
| `NCHAR(n)` | `NCHAR(n)` | Unicode fixed-length |
| `NVARCHAR(n)` | `NVARCHAR2(n)` | Unicode variable-length |
| `NVARCHAR(MAX)` | `NCLOB` | Unicode LOB |
| `TEXT` (deprecated) | `CLOB` | |
| `NTEXT` (deprecated) | `NCLOB` | |
| `XML` | `XMLTYPE` | Oracle's native XML type |

**NVARCHAR and character sets:**
If Oracle's database character set is AL32UTF8, then `VARCHAR2` already handles all Unicode characters. `NVARCHAR2` is redundant in this case. In AL32UTF8 databases, prefer `VARCHAR2` for all character data.

```sql
-- SQL Server (multi-byte Unicode with NVARCHAR)
CREATE TABLE messages (
    message_id   INT          IDENTITY PRIMARY KEY,
    content      NVARCHAR(MAX)
);

-- Oracle (AL32UTF8 database — VARCHAR2 handles all Unicode)
CREATE TABLE messages (
    message_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content    CLOB
);
```

### Numeric Types

| SQL Server | Oracle | Notes |
|---|---|---|
| `TINYINT` | `NUMBER(3)` | 0–255 |
| `SMALLINT` | `NUMBER(5)` | −32,768–32,767 |
| `INT` | `NUMBER(10)` | |
| `BIGINT` | `NUMBER(19)` | |
| `DECIMAL(p,s)` / `NUMERIC(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `MONEY` | `NUMBER(19,4)` | SQL Server 8-byte money type |
| `SMALLMONEY` | `NUMBER(10,4)` | |
| `FLOAT(n)` | `BINARY_FLOAT` or `BINARY_DOUBLE` | |
| `REAL` | `BINARY_FLOAT` | IEEE 754 32-bit |
| `BIT` | `NUMBER(1)` with CHECK (0,1) | Boolean bit type |

### Date and Time Types

SQL Server's date/time handling is richer and more granular than Oracle's. This is one of the most complex areas of translation.

| SQL Server | Oracle | Notes |
|---|---|---|
| `DATE` | `DATE` | Oracle DATE includes time; SS DATE is date-only |
| `TIME(n)` | No equivalent | Store as `VARCHAR2(12)` or `NUMBER` (fractional seconds since midnight) |
| `DATETIME` | `DATE` or `TIMESTAMP` | SQL Server precision: 1/300th second |
| `DATETIME2(n)` | `TIMESTAMP(n)` | Up to 7 decimal places in SS; Oracle supports 9 |
| `SMALLDATETIME` | `DATE` | 1-minute precision |
| `DATETIMEOFFSET(n)` | `TIMESTAMP(n) WITH TIME ZONE` | Time zone offset stored |

**GETDATE() and related functions:**

```sql
-- SQL Server
SELECT GETDATE();            -- current datetime
SELECT GETUTCDATE();         -- UTC datetime
SELECT SYSDATETIMEOFFSET(); -- datetime with TZ offset
SELECT YEAR(GETDATE());
SELECT MONTH(GETDATE());
SELECT DAY(GETDATE());
SELECT DATEPART(weekday, GETDATE());
SELECT DATEADD(month, 3, GETDATE());
SELECT DATEDIFF(day, '2024-01-01', GETDATE());
SELECT FORMAT(GETDATE(), 'yyyy-MM-dd');

-- Oracle
SELECT SYSDATE FROM DUAL;
SELECT SYS_EXTRACT_UTC(SYSTIMESTAMP) FROM DUAL;
SELECT SYSTIMESTAMP FROM DUAL;
SELECT EXTRACT(YEAR FROM SYSDATE) FROM DUAL;
SELECT EXTRACT(MONTH FROM SYSDATE) FROM DUAL;
SELECT EXTRACT(DAY FROM SYSDATE) FROM DUAL;
SELECT TO_NUMBER(TO_CHAR(SYSDATE, 'D')) FROM DUAL;
SELECT ADD_MONTHS(SYSDATE, 3) FROM DUAL;
SELECT TRUNC(SYSDATE) - DATE '2024-01-01' FROM DUAL;
SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD') FROM DUAL;
```

### Other Types

| SQL Server | Oracle | Notes |
|---|---|---|
| `UNIQUEIDENTIFIER` | `RAW(16)` or `VARCHAR2(36)` | Use `SYS_GUID()` to generate in Oracle |
| `BINARY(n)` | `RAW(n)` | Fixed-length binary |
| `VARBINARY(n)` | `RAW(n)` | Variable-length; max 2,000 bytes in Oracle |
| `VARBINARY(MAX)` | `BLOB` | |
| `IMAGE` (deprecated) | `BLOB` | |
| `ROWVERSION` / `TIMESTAMP` | No equivalent | Used for optimistic concurrency; use Oracle `ORA_ROWSCN` or add a `VERSION_NUM` column |
| `SQL_VARIANT` | No equivalent | Redesign to use typed columns |
| `HIERARCHYID` | No equivalent | Use Oracle's nested set or adjacency list pattern |
| `GEOGRAPHY` / `GEOMETRY` | `SDO_GEOMETRY` | Oracle Spatial |
| `JSON` (SS 2016+ stored as NVARCHAR) | `JSON` (21c+) or `CLOB IS JSON` | |

---

## Linked Servers → Database Links

SQL Server uses Linked Servers to query remote databases. Oracle uses Database Links.

```sql
-- SQL Server: query via linked server
SELECT * FROM [LinkedServer].[RemoteDB].[dbo].[orders];
INSERT INTO [LinkedServer].[RemoteDB].[dbo].[archive_orders]
SELECT * FROM orders WHERE order_date < '2020-01-01';

-- Oracle: create and use a database link
CREATE DATABASE LINK remote_db_link
    CONNECT TO remote_user IDENTIFIED BY password
    USING 'remote_tns_alias';

-- Query via database link
SELECT * FROM orders@remote_db_link;
INSERT INTO archive_orders@remote_db_link
SELECT * FROM orders WHERE order_date < DATE '2020-01-01';
```

---

## AWS SCT for SQL Server → Oracle — Step-by-Step Usage

AWS Schema Conversion Tool (SCT) automates schema conversion for SQL Server to Oracle migrations and can assess migration complexity.

> ⚠️ Note: "SSMA for Oracle" (Microsoft's product) migrates FROM Oracle TO SQL Server — the reverse direction. For SQL Server to Oracle, use **AWS SCT** or **SQL Developer Migration Workbench**.

### AWS SCT Workflow (SQL Server → Oracle)

1. **Install AWS SCT** from the AWS download page. SCT runs as a standalone desktop application.

2. **Create a migration project:**
   - File → New Project
   - Select source: SQL Server; target: Oracle
   - Provide SQL Server and Oracle connection details

3. **Run the Assessment Report:**
   - View → Assessment Report
   - Review conversion categories: Auto-Converted, Requires Attention, Cannot Convert

4. **Convert Schema:**
   - Select database objects in the left pane
   - Right-click → Convert Schema
   - Review and resolve warnings in the Output and Error List panes

5. **Manual fixups before synchronization:**
   - SCT generates conversion notes for objects it cannot convert automatically
   - Common manual items: dynamic SQL, cross-database references, full-text search, CLR objects

6. **Apply to Oracle target:**
   - Right-click converted schema → Apply to Database

7. **Migrate data:**
   - Use SQL*Loader or Oracle Data Pump for bulk data transfer (SCT does not perform data migration)

8. **Test and validate:**
   - Run row count reconciliation queries
   - Execute application regression tests

### What AWS SCT Converts Automatically

- Table definitions (most data types)
- Indexes and constraints
- Views
- Simple stored procedures and functions
- Basic T-SQL control flow

### What AWS SCT Cannot Convert (Manual Work Required)

- Dynamic SQL with complex string manipulation
- CLR (Common Language Runtime) objects
- Full-text search indexes → Oracle Text
- SQL Server Agent jobs → Oracle Scheduler
- Linked server queries → Database links
- `OPENROWSET` / `OPENQUERY`
- `FOR XML` clauses → Oracle XMLGEN equivalents
- `PIVOT` / `UNPIVOT` — convert to conditional aggregation
- `MERGE` statement differences (both support MERGE but syntax differs)

---

## Datetime Handling Differences

### CONVERT with Style Codes

```sql
-- SQL Server CONVERT style codes
SELECT CONVERT(VARCHAR(10), GETDATE(), 101);  -- MM/DD/YYYY
SELECT CONVERT(VARCHAR(10), GETDATE(), 103);  -- DD/MM/YYYY
SELECT CONVERT(VARCHAR(10), GETDATE(), 112);  -- YYYYMMDD
SELECT CONVERT(DATETIME, '2024-01-15', 120);

-- Oracle TO_CHAR / TO_DATE equivalents
SELECT TO_CHAR(SYSDATE, 'MM/DD/YYYY') FROM DUAL;
SELECT TO_CHAR(SYSDATE, 'DD/MM/YYYY') FROM DUAL;
SELECT TO_CHAR(SYSDATE, 'YYYYMMDD') FROM DUAL;
SELECT TO_DATE('2024-01-15', 'YYYY-MM-DD') FROM DUAL;
```

### String Functions on Dates

```sql
-- SQL Server
SELECT CAST('2024-01-15' AS DATE);
SELECT CAST(GETDATE() AS VARCHAR(20));

-- Oracle
SELECT TO_DATE('2024-01-15', 'YYYY-MM-DD') FROM DUAL;
SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') FROM DUAL;
```

---

## Best Practices

1. **Start with the AWS SCT assessment report.** Before writing any migration scripts, run AWS SCT's assessment to get a conversion complexity score by object category. This sets realistic expectations.

2. **Normalize NVARCHAR to VARCHAR2 in AL32UTF8 databases.** Unicode support is built into AL32UTF8 without using the national character set types.

3. **Review all SET options in T-SQL code.** SQL Server stored procedures frequently use `SET NOCOUNT ON`, `SET XACT_ABORT ON`, and similar options. Oracle PL/SQL does not use these; review each for the Oracle equivalent or remove.

4. **Handle tempdb usage.** SQL Server code heavily uses temporary tables (`#temp`, `##global_temp`) and table variables (`@TableVar`). Oracle equivalents are global temporary tables (GTTs) or PL/SQL collections. GTTs require `CREATE GLOBAL TEMPORARY TABLE` DDL up front.

```sql
-- SQL Server temp table
CREATE TABLE #staging (id INT, value VARCHAR(100));

-- Oracle Global Temporary Table
CREATE GLOBAL TEMPORARY TABLE staging (
    id    NUMBER,
    value VARCHAR2(100)
)
ON COMMIT DELETE ROWS;  -- or ON COMMIT PRESERVE ROWS
```

5. **Test collation-sensitive comparisons.** SQL Server has configurable case/accent sensitivity per database or column. Oracle comparisons are always case-sensitive and accent-sensitive by default. Use `NLS_SORT` and `NLS_COMP` parameters for locale-aware sorting.

6. **Replace NOLOCK hints.** `WITH (NOLOCK)` is a common SQL Server hint for dirty reads. Oracle uses multi-version concurrency control (MVCC) and never requires dirty reads — remove all NOLOCK hints and queries will still be non-blocking.

---

## Common Migration Pitfalls

**Pitfall 1 — NULL + empty string behavior:**
```sql
-- SQL Server: NULL + '' = NULL, but '' is distinct from NULL
-- Oracle 21c and earlier: '' IS NULL (empty string stored as NULL)
-- Review columns where empty string is used as a meaningful value
```

**Pitfall 2 — Transaction isolation:**
SQL Server defaults to READ COMMITTED with locking. Oracle defaults to READ COMMITTED with MVCC (no read locks). Applications written to work around SQL Server blocking with NOLOCK hints may behave differently under Oracle's MVCC — test thoroughly.

**Pitfall 3 — Implicit transactions:**
SQL Server in default mode uses implicit transactions for DML only when `IMPLICIT_TRANSACTIONS` is ON. Oracle always requires an explicit `COMMIT` or `ROLLBACK`. Application code that relies on SQL Server autocommit behavior needs review.

**Pitfall 4 — MERGE statement differences:**
Both SQL Server and Oracle support `MERGE`, but the syntax differs. SQL Server MERGE requires a semicolon terminator and `MATCHED`/`NOT MATCHED` clauses with slightly different structure. Review all MERGE statements individually.

**Pitfall 5 — Schemas vs Databases:**
In SQL Server, a database contains schemas, and you can JOIN across databases (e.g., `MyDB.dbo.MyTable`). In Oracle, a schema IS a user, and cross-schema references use `schema.table` syntax. Three-part names (`db.schema.table`) do not exist in Oracle — cross-database access requires database links.

**Pitfall 6 — CASE sensitivity in string comparisons:**
SQL Server with `SQL_Latin1_General_CP1_CI_AS` (the default) is case-insensitive. Oracle is always case-sensitive. Queries that rely on case-insensitive matching need `UPPER(col)` wrappers and corresponding function-based indexes.

---

## Sources

- [Oracle Database 19c PL/SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/)
- [Oracle Database 19c SQL Language Reference — PL/SQL vs T-SQL reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
- [Oracle SQL Developer Migration documentation](https://docs.oracle.com/en/database/oracle/sql-developer/23.1/rptug/migration-workbench.html)
- [AWS Schema Conversion Tool — SQL Server to Oracle](https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/CHAP_Source.SQLServer.html)
