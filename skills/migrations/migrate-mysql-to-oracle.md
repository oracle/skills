# Migrating MySQL to Oracle

## Overview

MySQL and Oracle share a common lineage through Oracle Corporation's ownership, but the two engines are architecturally and syntactically very different. MySQL's permissive type coercion, backtick identifiers, `AUTO_INCREMENT` columns, and simplified stored procedure syntax all require deliberate translation. This guide covers every significant divergence you will encounter during a MySQL-to-Oracle migration, including data type mapping, SQL dialect differences, stored procedure conversion, and data extraction strategies.

---

## Data Type Mapping

### Integer and Auto-Increment Types

MySQL's `AUTO_INCREMENT` is a per-column property that automatically assigns incrementing integers. Oracle provides two mechanisms: identity columns (12c+) and sequences.

| MySQL | Oracle | Notes |
|---|---|---|
| `TINYINT` | `NUMBER(3)` | Range −128 to 127 |
| `SMALLINT` | `NUMBER(5)` | Range −32,768 to 32,767 |
| `MEDIUMINT` | `NUMBER(7)` | MySQL-specific; no Oracle equivalent |
| `INT` / `INTEGER` | `NUMBER(10)` | |
| `BIGINT` | `NUMBER(19)` | |
| `TINYINT(1)` | `NUMBER(1)` | MySQL convention for BOOLEAN |
| `INT AUTO_INCREMENT` | `NUMBER GENERATED ALWAYS AS IDENTITY` | See detailed example below |
| `BIGINT AUTO_INCREMENT` | `NUMBER(19) GENERATED ALWAYS AS IDENTITY` | |

**AUTO_INCREMENT → Identity Column:**

```sql
-- MySQL
CREATE TABLE customers (
    customer_id INT          AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- Oracle (12c+, identity column)
CREATE TABLE customers (
    customer_id NUMBER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email       VARCHAR2(255) NOT NULL,
    created_at  TIMESTAMP    DEFAULT SYSTIMESTAMP,
    CONSTRAINT uq_customers_email UNIQUE (email)
);
```

**AUTO_INCREMENT → Sequence + Trigger (pre-12c or for explicit control):**

```sql
-- Oracle sequence
CREATE SEQUENCE customers_seq
    START WITH 1
    INCREMENT BY 1
    CACHE 20
    NOCYCLE;

CREATE TABLE customers (
    customer_id NUMBER        DEFAULT customers_seq.NEXTVAL PRIMARY KEY,
    email       VARCHAR2(255) NOT NULL,
    created_at  TIMESTAMP     DEFAULT SYSTIMESTAMP
);
```

### String Types

| MySQL | Oracle | Notes |
|---|---|---|
| `CHAR(n)` | `CHAR(n)` | Direct equivalent |
| `VARCHAR(n)` | `VARCHAR2(n)` | Max 65,535 bytes in MySQL; 4000 / 32767 in Oracle |
| `TINYTEXT` | `VARCHAR2(255)` | Max 255 bytes |
| `TEXT` | `VARCHAR2(4000)` or `CLOB` | Max 65,535 bytes in MySQL |
| `MEDIUMTEXT` | `CLOB` | Max 16 MB |
| `LONGTEXT` | `CLOB` | Max 4 GB |
| `TINYBLOB` | `RAW(255)` | Max 255 bytes |
| `BLOB` | `BLOB` | Binary large object |
| `MEDIUMBLOB` | `BLOB` | Max 16 MB |
| `LONGBLOB` | `BLOB` | Max 4 GB |
| `ENUM('a','b','c')` | `VARCHAR2(n)` + CHECK constraint | See example below |
| `SET('a','b','c')` | `VARCHAR2(n)` or junction table | Multi-value MySQL type; denormalize or normalize |

**ENUM → CHECK constraint:**

```sql
-- MySQL
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    status   ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending'
);

-- Oracle
CREATE TABLE orders (
    order_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status   VARCHAR2(20) DEFAULT 'pending' NOT NULL,
    CONSTRAINT chk_orders_status
        CHECK (status IN ('pending','processing','shipped','delivered','cancelled'))
);
```

### Date and Time Types

| MySQL | Oracle | Notes |
|---|---|---|
| `DATE` | `DATE` | Oracle DATE also stores time (midnight if unset) |
| `TIME` | No equivalent | Store as `VARCHAR2(8)` or `NUMBER` (seconds) |
| `DATETIME` | `DATE` or `TIMESTAMP` | Use TIMESTAMP to preserve fractional seconds |
| `TIMESTAMP` | `TIMESTAMP WITH TIME ZONE` | MySQL TIMESTAMP converts to UTC; Oracle stores TZ explicitly |
| `YEAR` | `NUMBER(4)` | MySQL-specific 1-byte year type |

**Key difference:** MySQL `TIMESTAMP` auto-converts to UTC on insert and converts back on select per session time zone. Oracle `TIMESTAMP WITH TIME ZONE` stores the offset literally. Review applications that rely on MySQL's implicit UTC conversion.

```sql
-- MySQL TIMESTAMP with auto-update
CREATE TABLE records (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Oracle equivalent using a trigger
CREATE TABLE records (
    id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_records_updated
BEFORE UPDATE ON records
FOR EACH ROW
BEGIN
    :NEW.updated_at := SYSTIMESTAMP;
END;
/
```

### Numeric Types

| MySQL | Oracle | Notes |
|---|---|---|
| `DECIMAL(p,s)` / `NUMERIC(p,s)` | `NUMBER(p,s)` | Direct equivalent |
| `FLOAT` | `BINARY_FLOAT` | IEEE 754 32-bit |
| `DOUBLE` / `DOUBLE PRECISION` | `BINARY_DOUBLE` | IEEE 754 64-bit |
| `BIT(n)` | `RAW(CEIL(n/8))` | Bit field type |

### JSON and Spatial Types

| MySQL | Oracle | Notes |
|---|---|---|
| `JSON` | `JSON` (21c+) or `CLOB IS JSON` | Oracle 12c: use CLOB with IS JSON constraint |
| `GEOMETRY` | `SDO_GEOMETRY` | Oracle Spatial; requires separate licensing in some editions |
| `POINT`, `LINESTRING`, etc. | `SDO_GEOMETRY` subtypes | |

---

## SQL Dialect Differences

### Backtick Identifiers → Double-Quoted Identifiers

MySQL uses backticks to quote identifiers (especially when they clash with reserved words). Oracle uses double quotes. The safest approach is to rename objects to not require quoting at all.

```sql
-- MySQL (backtick quoting)
SELECT `order`, `desc`, `key` FROM `order_details`;
CREATE TABLE `user` (`group` INT, `select` VARCHAR(100));

-- Oracle (double-quote quoting — avoid if possible)
SELECT "order", "desc", "key" FROM "order_details";

-- Best practice: rename to avoid reserved words
CREATE TABLE user_accounts (user_group NUMBER, selection VARCHAR2(100));
SELECT order_num, description, access_key FROM order_details;
```

**Important:** Oracle double-quoted identifiers become case-sensitive. `"MyTable"` and `mytable` are different objects in Oracle. Prefer unquoted identifiers in Oracle (they fold to uppercase).

### LIMIT → FETCH FIRST

```sql
-- MySQL
SELECT * FROM products ORDER BY price ASC LIMIT 10;
SELECT * FROM products ORDER BY price ASC LIMIT 10 OFFSET 30;

-- Oracle 12c+
SELECT * FROM products ORDER BY price ASC FETCH FIRST 10 ROWS ONLY;
SELECT * FROM products ORDER BY price ASC OFFSET 30 ROWS FETCH NEXT 10 ROWS ONLY;

-- Oracle 11g and earlier
SELECT * FROM (SELECT * FROM products ORDER BY price ASC) WHERE ROWNUM <= 10;
```

### GROUP BY Behavior

MySQL (with `sql_mode` not including `ONLY_FULL_GROUP_BY`) allows selecting non-aggregated, non-grouped columns. Oracle enforces strict GROUP BY compliance.

```sql
-- MySQL (permissive mode — this "works" but is undefined behavior)
SELECT dept_id, last_name, COUNT(*) FROM employees GROUP BY dept_id;

-- Oracle — ERROR: ORA-00979: not a GROUP BY expression
-- Must include last_name in GROUP BY or use an aggregate:
SELECT dept_id, MAX(last_name) AS sample_name, COUNT(*) FROM employees GROUP BY dept_id;
```

### IF and IF NOT EXISTS

```sql
-- MySQL DDL with IF EXISTS / IF NOT EXISTS
CREATE TABLE IF NOT EXISTS audit_log (id INT PRIMARY KEY, action VARCHAR(100));
DROP TABLE IF EXISTS temp_staging;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Oracle 23c+ (natively supported)
CREATE TABLE IF NOT EXISTS audit_log (id NUMBER PRIMARY KEY, action VARCHAR2(100));
DROP TABLE IF EXISTS temp_staging;

-- Oracle pre-23c: use PL/SQL exception handling
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE temp_staging';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
```

### String Functions

| MySQL Function | Oracle Equivalent |
|---|---|
| `CONCAT(a, b, c)` | `a \|\| b \|\| c` or `CONCAT(CONCAT(a,b),c)` |
| `CONCAT_WS(',', a, b, c)` | `a \|\| ',' \|\| b \|\| ',' \|\| c` (manual) |
| `GROUP_CONCAT(col SEPARATOR ',')` | `LISTAGG(col, ',') WITHIN GROUP (ORDER BY col)` |
| `SUBSTRING(s, pos, len)` | `SUBSTR(s, pos, len)` |
| `LOCATE(sub, s)` | `INSTR(s, sub)` |
| `INSTR(s, sub)` | `INSTR(s, sub)` — same |
| `LCASE(s)` / `LOWER(s)` | `LOWER(s)` |
| `UCASE(s)` / `UPPER(s)` | `UPPER(s)` |
| `TRIM(s)` | `TRIM(s)` — same |
| `LTRIM(s)` | `LTRIM(s)` — same |
| `RTRIM(s)` | `RTRIM(s)` — same |
| `SPACE(n)` | `RPAD(' ', n)` or `LPAD(' ', n)` |
| `REPEAT(s, n)` | Write a custom PL/SQL function |
| `REVERSE(s)` | No built-in; use a PL/SQL function |
| `FORMAT(n, d)` | `TO_CHAR(n, 'FM999,999,999.00')` |
| `LEFT(s, n)` | `SUBSTR(s, 1, n)` |
| `RIGHT(s, n)` | `SUBSTR(s, -n)` |
| `LENGTH(s)` | `LENGTH(s)` — same |
| `CHAR_LENGTH(s)` | `LENGTH(s)` |
| `ASCII(s)` | `ASCII(s)` — same |
| `CHAR(n)` | `CHR(n)` |

**GROUP_CONCAT example:**

```sql
-- MySQL
SELECT dept_id,
       GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR ', ') AS employees
FROM emp
GROUP BY dept_id;

-- Oracle
SELECT dept_id,
       LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) AS employees
FROM emp
GROUP BY dept_id;
```

### Date Functions

| MySQL Function | Oracle Equivalent |
|---|---|
| `NOW()` | `SYSDATE` (no fractional seconds) or `SYSTIMESTAMP` |
| `CURDATE()` | `TRUNC(SYSDATE)` |
| `CURTIME()` | `TO_CHAR(SYSDATE, 'HH24:MI:SS')` |
| `DATE(dt)` | `TRUNC(dt)` |
| `DATE_FORMAT(d, fmt)` | `TO_CHAR(d, fmt)` — format masks differ |
| `DATE_ADD(d, INTERVAL n DAY)` | `d + n` |
| `DATE_SUB(d, INTERVAL n DAY)` | `d - n` |
| `DATE_ADD(d, INTERVAL n MONTH)` | `ADD_MONTHS(d, n)` |
| `DATEDIFF(d1, d2)` | `TRUNC(d1) - TRUNC(d2)` |
| `TIMESTAMPDIFF(MONTH, d1, d2)` | `MONTHS_BETWEEN(d2, d1)` |
| `YEAR(d)` | `EXTRACT(YEAR FROM d)` |
| `MONTH(d)` | `EXTRACT(MONTH FROM d)` |
| `DAY(d)` | `EXTRACT(DAY FROM d)` |
| `HOUR(d)` | `EXTRACT(HOUR FROM d)` |
| `DAYOFWEEK(d)` | `TO_NUMBER(TO_CHAR(d, 'D'))` |
| `LAST_DAY(d)` | `LAST_DAY(d)` — same |
| `STR_TO_DATE(s, fmt)` | `TO_DATE(s, fmt)` — format masks differ |
| `UNIX_TIMESTAMP(d)` | `(d - DATE '1970-01-01') * 86400` |
| `FROM_UNIXTIME(n)` | `DATE '1970-01-01' + n/86400` |

**Date format mask differences:**

| MySQL | Oracle | Meaning |
|---|---|---|
| `%Y` | `YYYY` | 4-digit year |
| `%m` | `MM` | Month number |
| `%d` | `DD` | Day of month |
| `%H` | `HH24` | Hour (0-23) |
| `%i` | `MI` | Minutes |
| `%s` | `SS` | Seconds |

---

## Stored Procedure Syntax Differences

MySQL and Oracle stored procedure languages are fundamentally different. MySQL's procedural SQL is comparatively simple; Oracle's PL/SQL is richer with exception handling, record types, collections, and packages.

### Basic Procedure Structure

```sql
-- MySQL
DELIMITER $$
CREATE PROCEDURE update_customer_status(
    IN  p_customer_id INT,
    IN  p_status      VARCHAR(20),
    OUT p_rows_updated INT
)
BEGIN
    UPDATE customers
    SET status = p_status
    WHERE customer_id = p_customer_id;

    SET p_rows_updated = ROW_COUNT();
END$$
DELIMITER ;

-- Oracle PL/SQL
CREATE OR REPLACE PROCEDURE update_customer_status(
    p_customer_id IN  NUMBER,
    p_status      IN  VARCHAR2,
    p_rows_updated OUT NUMBER
)
AS
BEGIN
    UPDATE customers
    SET status = p_status
    WHERE customer_id = p_customer_id;

    p_rows_updated := SQL%ROWCOUNT;
END update_customer_status;
/
```

### Variables and Declarations

```sql
-- MySQL
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_name VARCHAR(100);
    SET v_total = 100.00;
    SET v_name = 'Alice';
END

-- Oracle PL/SQL
DECLARE
    v_total NUMBER(10,2) := 0;
    v_name  VARCHAR2(100);
BEGIN
    v_total := 100.00;
    v_name  := 'Alice';
END;
/
```

### Control Flow

```sql
-- MySQL IF-ELSEIF-ELSE
IF v_score >= 90 THEN
    SET v_grade = 'A';
ELSEIF v_score >= 80 THEN
    SET v_grade = 'B';
ELSE
    SET v_grade = 'C';
END IF;

-- Oracle PL/SQL
IF v_score >= 90 THEN
    v_grade := 'A';
ELSIF v_score >= 80 THEN        -- Note: ELSIF not ELSEIF
    v_grade := 'B';
ELSE
    v_grade := 'C';
END IF;
```

```sql
-- MySQL WHILE loop
WHILE v_counter <= 10 DO
    SET v_sum = v_sum + v_counter;
    SET v_counter = v_counter + 1;
END WHILE;

-- Oracle PL/SQL
WHILE v_counter <= 10 LOOP
    v_sum := v_sum + v_counter;
    v_counter := v_counter + 1;
END LOOP;
```

### Cursor Handling

```sql
-- MySQL cursor
DECLARE cur CURSOR FOR SELECT id, name FROM products WHERE active = 1;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
OPEN cur;
read_loop: LOOP
    FETCH cur INTO v_id, v_name;
    IF done THEN LEAVE read_loop; END IF;
    -- process...
END LOOP;
CLOSE cur;

-- Oracle PL/SQL cursor
DECLARE
    CURSOR cur IS SELECT id, name FROM products WHERE active = 1;
    v_id   products.id%TYPE;
    v_name products.name%TYPE;
BEGIN
    OPEN cur;
    LOOP
        FETCH cur INTO v_id, v_name;
        EXIT WHEN cur%NOTFOUND;
        -- process...
    END LOOP;
    CLOSE cur;
END;
/

-- Oracle: simpler FOR cursor loop (preferred)
BEGIN
    FOR rec IN (SELECT id, name FROM products WHERE active = 1) LOOP
        -- process rec.id, rec.name
        NULL;
    END LOOP;
END;
/
```

### Exception Handling

```sql
-- MySQL exception handling
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;
    RESIGNAL;
END;

-- Oracle PL/SQL
BEGIN
    -- ... DML ...
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Duplicate key violation');
    WHEN NO_DATA_FOUND THEN
        -- handle missing row
        NULL;
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/
```

---

## mysqldump to Oracle Workflow

### Step 1 — Export Data from MySQL

```bash
# Export schema only
mysqldump -u root -p --no-data mydb > schema.sql

# Export data as CSV per table (most portable for Oracle loading)
mysql -u root -p mydb -e "SELECT * FROM customers INTO OUTFILE '/tmp/customers.csv'
    FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'
    LINES TERMINATED BY '\n';"

# Using mysqldump with INSERT statements (usable as reference but requires heavy translation)
mysqldump -u root -p --skip-extended-insert mydb customers > customers_inserts.sql
```

### Step 2 — Translate Schema

Key transformations to automate or perform:
- Replace `\`` with nothing (or `"` where quoting is truly needed)
- Replace `AUTO_INCREMENT` with `GENERATED ALWAYS AS IDENTITY`
- Replace `INT` with `NUMBER(10)`, etc.
- Replace `VARCHAR(n)` with `VARCHAR2(n)`
- Replace `DATETIME` with `TIMESTAMP`
- Remove `ENGINE=InnoDB`, `CHARSET=utf8mb4`, and similar MySQL options
- Replace `TINYINT(1)` with `NUMBER(1)`

The **SQL Developer Migration Workbench** automates much of this schema conversion (see `oracle-migration-tools.md`). Note: ora2pg migrates Oracle to PostgreSQL and is not applicable for MySQL-to-Oracle migrations.

### Step 3 — Load Data with SQL*Loader

```
-- SQL*Loader control file: customers.ctl
OPTIONS (SKIP=0, ROWS=5000, DIRECT=TRUE, ERRORS=100)
LOAD DATA
CHARACTERSET UTF8
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
    status,
    created_at  TIMESTAMP "YYYY-MM-DD HH24:MI:SS"
)
```

```bash
sqlldr userid=myuser/mypass@mydb control=customers.ctl log=customers.log bad=customers.bad
```

### Step 4 — Post-Load Sequences

After loading data, update identity column sequences to start above the maximum loaded value:

```sql
-- If using sequences (pre-12c):
DECLARE
    v_max NUMBER;
BEGIN
    SELECT MAX(customer_id) INTO v_max FROM customers;
    EXECUTE IMMEDIATE 'ALTER SEQUENCE customers_seq RESTART START WITH ' || (v_max + 1);
END;
/

-- If using identity columns (12c+, requires recreating or using ALTER TABLE):
ALTER TABLE customers MODIFY customer_id GENERATED ALWAYS AS IDENTITY (START WITH LIMIT VALUE);
```

---

## Best Practices

1. **Run MySQL in strict SQL mode before migrating.** Set `sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'` and fix all errors before starting the Oracle migration. This surfaces GROUP BY and type coercion issues.

2. **Normalize ENUM and SET columns.** Oracle's CHECK constraint equivalent works for ENUM, but SET (multi-valued) columns require a junction table or JSON column. Plan the schema change early.

3. **Audit MySQL zero-dates.** MySQL allows `0000-00-00` as a date value. Oracle's DATE type has no such representation. Replace with NULL or a sentinel date value.

4. **Review ON UPDATE CASCADE.** Oracle supports cascading deletes natively but not cascading updates on primary keys. Applications relying on `ON UPDATE CASCADE` require application-level changes.

5. **Character sets matter.** MySQL's `utf8` is actually 3-byte UTF-8 (no emoji). MySQL's `utf8mb4` is true 4-byte UTF-8. Oracle's `AL32UTF8` is full UTF-8. Set Oracle to `AL32UTF8` to handle all Unicode characters.

6. **Test GROUP_CONCAT / LISTAGG length limits.** `LISTAGG` in Oracle 12c raises an error if the concatenated output exceeds 4000 characters. Use `LISTAGG(...) ON OVERFLOW TRUNCATE` (12.2+) or the `WM_CONCAT` workaround with CLOB.

---

## Common Migration Pitfalls

**Pitfall 1 — MySQL case-insensitive string comparisons:**
MySQL comparisons are case-insensitive by default for `utf8_general_ci` collations. Oracle comparisons are always case-sensitive.
```sql
-- MySQL: these return results even with mixed case
SELECT * FROM users WHERE username = 'ALICE';  -- finds 'alice'

-- Oracle: returns nothing
SELECT * FROM users WHERE username = 'ALICE';  -- only finds 'ALICE'

-- Oracle fix: normalize case on insert, or use UPPER() comparisons
SELECT * FROM users WHERE UPPER(username) = 'ALICE';
```

**Pitfall 2 — Division of integers returns integer in MySQL:**
```sql
-- MySQL: integer division
SELECT 5 / 2;  -- returns 2.5000 (MySQL actually returns decimal)
SELECT 5 DIV 2; -- returns 2 (integer division)

-- Oracle: always returns exact result
SELECT 5 / 2 FROM DUAL;    -- returns 2.5
SELECT TRUNC(5/2) FROM DUAL; -- returns 2
```

**Pitfall 3 — NULL-safe equality:**
```sql
-- MySQL: NULL-safe equality operator
SELECT * FROM t WHERE a <=> b;  -- true when both NULL

-- Oracle equivalent
SELECT * FROM t WHERE (a = b OR (a IS NULL AND b IS NULL));
-- Or: DECODE(a, b, 1, 0) = 1  (DECODE treats NULLs as equal)
```

**Pitfall 4 — Implicit commits from DDL:**
Both MySQL (in default settings) and Oracle commit on DDL, but MySQL also commits any open transaction before a DDL statement. Ensure application transaction management accounts for this.

**Pitfall 5 — MySQL IF() function:**
```sql
-- MySQL
SELECT IF(status = 'active', 'Yes', 'No') FROM customers;

-- Oracle
SELECT CASE WHEN status = 'active' THEN 'Yes' ELSE 'No' END FROM customers;
-- Or using DECODE:
SELECT DECODE(status, 'active', 'Yes', 'No') FROM customers;
```

---

## Sources

- [Oracle Database 19c SQL Language Reference — Data Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database 19c SQL Language Reference — CREATE TABLE (GENERATED AS IDENTITY)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database 19c SQL Language Reference — String Functions (LISTAGG)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/LISTAGG.html)
- [Oracle Database 19c PL/SQL Language Reference — Control Structures](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-control-statements.html)
- [Oracle Database 19c Utilities — SQL*Loader](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-sql-loader.html)
- [Oracle SQL Developer Migration Workbench](https://docs.oracle.com/en/database/oracle/sql-developer/23.1/rptug/migration-workbench.html)
