# Oracle Virtual Columns

## Overview

A **virtual column** is a column whose value is not physically stored on disk. Instead, it is defined as a deterministic expression that Oracle evaluates on the fly whenever the column is referenced — either in a query, an index, a constraint, or a partition key.

Virtual columns were introduced in Oracle 11g Release 1 and provide a way to expose derived data as first-class column citizens without the storage overhead, the maintenance burden of triggers, or the query complexity of inline expressions.

**When virtual columns are useful:**
- Exposing a frequently used computed expression as a named column
- Creating an index on a complex expression without writing a function-based index
- Using a computed value as a partitioning key
- Enforcing business rules via check constraints on derived values
- Providing stable interfaces for views and applications when underlying logic changes

---

## Defining Virtual Columns

### Basic Syntax

```sql
column_name [data_type] [GENERATED ALWAYS] AS (expression) [VIRTUAL]
```

- `GENERATED ALWAYS AS (expression)` is mandatory syntax.
- The `VIRTUAL` keyword is optional but recommended for clarity.
- The data type is optional; Oracle infers it from the expression. Explicit types must be compatible with the expression result.

### Simple Virtual Column

```sql
CREATE TABLE employees (
    employee_id   NUMBER(6)     NOT NULL,
    first_name    VARCHAR2(50)  NOT NULL,
    last_name     VARCHAR2(50)  NOT NULL,
    salary        NUMBER(10,2)  NOT NULL,
    commission_pct NUMBER(3,2),

    -- Fully-qualified name for display; no stored data
    full_name     VARCHAR2(101) GENERATED ALWAYS AS (first_name || ' ' || last_name) VIRTUAL,

    -- Annual salary including commission
    annual_comp   NUMBER        GENERATED ALWAYS AS (
        salary * 12 * NVL(1 + commission_pct, 1)
    ) VIRTUAL,

    CONSTRAINT pk_employees PRIMARY KEY (employee_id)
);
```

### Adding a Virtual Column to an Existing Table

```sql
ALTER TABLE employees
ADD (
    salary_band VARCHAR2(10) GENERATED ALWAYS AS (
        CASE
            WHEN salary < 30000  THEN 'LOW'
            WHEN salary < 80000  THEN 'MEDIUM'
            WHEN salary < 150000 THEN 'HIGH'
            ELSE                      'EXECUTIVE'
        END
    ) VIRTUAL
);
```

### Querying Virtual Columns

Virtual columns are indistinguishable from regular columns in queries:

```sql
SELECT employee_id, full_name, salary, annual_comp, salary_band
FROM   employees
WHERE  salary_band = 'HIGH'
ORDER  BY annual_comp DESC;
```

Oracle evaluates the expression inline — it does not store the result. The `annual_comp` predicate is evaluated per row during the scan.

---

## Function-Based Virtual Columns

Virtual columns can call **deterministic** PL/SQL functions:

```sql
CREATE OR REPLACE FUNCTION fiscal_year(p_date IN DATE)
RETURN NUMBER DETERMINISTIC AS
BEGIN
    -- Fiscal year starts April 1
    RETURN CASE
        WHEN EXTRACT(MONTH FROM p_date) >= 4
        THEN EXTRACT(YEAR FROM p_date)
        ELSE EXTRACT(YEAR FROM p_date) - 1
    END;
END fiscal_year;
/

CREATE TABLE sales_orders (
    order_id       NUMBER         NOT NULL,
    order_date     DATE           NOT NULL,
    customer_id    NUMBER         NOT NULL,
    total_amount   NUMBER(12,2)   NOT NULL,

    -- Virtual column using a deterministic function
    fiscal_yr      NUMBER         GENERATED ALWAYS AS (fiscal_year(order_date)) VIRTUAL,

    -- Built-in function: truncate to month for time-series grouping
    order_month    DATE           GENERATED ALWAYS AS (TRUNC(order_date, 'MM')) VIRTUAL,

    CONSTRAINT pk_sales_orders PRIMARY KEY (order_id)
);
```

**The function MUST be declared `DETERMINISTIC`.** If a non-deterministic function is used as a virtual column expression, Oracle will raise an error or produce unreliable results when the column is indexed.

---

## Indexing Virtual Columns

One of the most important use cases: create a B-tree index directly on a virtual column. This is equivalent to a function-based index but with better usability.

```sql
-- Index on a virtual column for salary band queries
CREATE INDEX idx_emp_salary_band ON employees (salary_band);

-- Composite index: fiscal year + customer for reporting queries
CREATE INDEX idx_orders_fiscal_cust ON sales_orders (fiscal_yr, customer_id);

-- Query that uses the virtual column index (optimizer can use the index)
SELECT customer_id, COUNT(*), SUM(total_amount)
FROM   sales_orders
WHERE  fiscal_yr = 2025
GROUP  BY customer_id;
```

### Verifying Index Usage on Virtual Columns

```sql
EXPLAIN PLAN FOR
    SELECT employee_id, full_name
    FROM   employees
    WHERE  salary_band = 'EXECUTIVE';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Should show: INDEX RANGE SCAN on IDX_EMP_SALARY_BAND
```

---

## Virtual Columns as Partition Keys

Virtual columns are particularly powerful as **partition keys**, enabling you to partition on a derived value without denormalizing data.

```sql
-- Partition a large transaction table by fiscal year
CREATE TABLE financial_transactions (
    txn_id        NUMBER         NOT NULL,
    txn_date      DATE           NOT NULL,
    account_id    NUMBER         NOT NULL,
    amount        NUMBER(15,2)   NOT NULL,
    txn_type      VARCHAR2(20),

    -- Virtual column used as the partition key
    txn_fiscal_yr NUMBER         GENERATED ALWAYS AS (fiscal_year(txn_date)) VIRTUAL
)
PARTITION BY RANGE (txn_fiscal_yr) (
    PARTITION p_fy2022 VALUES LESS THAN (2023),
    PARTITION p_fy2023 VALUES LESS THAN (2024),
    PARTITION p_fy2024 VALUES LESS THAN (2025),
    PARTITION p_fy2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN (MAXVALUE)
);
```

With this design:
- A query `WHERE txn_date BETWEEN DATE '2024-04-01' AND DATE '2025-03-31'` triggers partition pruning if the optimizer can resolve `fiscal_year(txn_date)` to a range.
- More commonly, query on `txn_fiscal_yr = 2024` directly for reliable partition pruning.

```sql
-- Direct partition pruning via virtual column
SELECT SUM(amount)
FROM   financial_transactions
WHERE  txn_fiscal_yr = 2024
  AND  txn_type = 'DEBIT';
```

---

## Virtual Columns with Check Constraints

```sql
CREATE TABLE orders (
    order_id       NUMBER PRIMARY KEY,
    order_date     DATE NOT NULL,
    ship_date      DATE,
    order_amount   NUMBER(12,2) NOT NULL,
    discount_pct   NUMBER(4,2) DEFAULT 0,

    -- Virtual column
    net_amount     NUMBER GENERATED ALWAYS AS (order_amount * (1 - discount_pct/100)) VIRTUAL,

    -- Check constraint on the virtual column
    CONSTRAINT chk_net_positive CHECK (net_amount > 0),
    CONSTRAINT chk_ship_after_order CHECK (ship_date IS NULL OR ship_date >= order_date)
);
```

---

## Viewing Virtual Column Metadata

```sql
-- List virtual columns in a table
SELECT column_name,
       data_type,
       data_length,
       nullable,
       virtual_column,
       data_default          -- stores the expression
FROM   user_tab_columns
WHERE  table_name    = 'EMPLOYEES'
  AND  virtual_column = 'YES';

-- Expression details for virtual columns
SELECT column_name, data_default
FROM   user_tab_cols
WHERE  table_name     = 'EMPLOYEES'
  AND  virtual_column  = 'YES';

-- Check if any indexes are on virtual columns
SELECT ic.index_name, ic.column_name, tc.virtual_column
FROM   user_ind_columns ic
JOIN   user_tab_cols    tc ON tc.table_name  = ic.table_name
                           AND tc.column_name = ic.column_name
WHERE  ic.table_name    = 'EMPLOYEES'
  AND  tc.virtual_column = 'YES';
```

---

## Limitations and Gotchas

### What Expressions Are Allowed

Virtual column expressions **must** be:
- Deterministic (same inputs always produce the same output)
- Self-contained within the row (can only reference columns of the same row)
- Using built-in SQL functions or deterministic PL/SQL functions
- Not referencing other virtual columns in the same table (Oracle 11g/12c; relaxed in later releases — verify your version)
- Not containing subqueries, aggregate functions, or `ROWNUM`/`ROWID`/`LEVEL`

### Storage and DML Behavior

```sql
-- You CANNOT insert into or update a virtual column
-- This will raise ORA-54013
INSERT INTO employees (employee_id, first_name, last_name, salary, full_name)
VALUES (1001, 'Jane', 'Smith', 75000, 'Jane Smith');  -- ERROR

-- Correct: omit virtual columns from INSERT
INSERT INTO employees (employee_id, first_name, last_name, salary)
VALUES (1001, 'Jane', 'Smith', 75000);

-- You CAN reference virtual columns in SELECT and WHERE
SELECT * FROM employees WHERE full_name = 'Jane Smith';
```

### Statistics and Virtual Columns

```sql
-- DBMS_STATS can gather statistics on virtual columns,
-- but the METHOD_OPT default ('FOR ALL COLUMNS') includes them.
-- If the expression is complex, stat gathering may be slower.
-- You can exclude virtual columns explicitly:
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(
        ownname     => 'APPSCHEMA',
        tabname     => 'EMPLOYEES',
        method_opt  => 'FOR ALL REAL COLUMNS SIZE AUTO',  -- skip virtual columns
        cascade     => TRUE
    );
END;
/
```

### Export and Import Considerations

Virtual column expressions are stored as metadata in the data dictionary. When using Data Pump (`expdp`/`impdp`), the expressions are exported in the DDL. However:
- If the expression references a user-defined PL/SQL function, that function must exist in the target schema before importing the table.
- If the function signature changes between export and import, the virtual column may be invalid on import.

### Virtual Columns in External Tables

Virtual columns are **not supported** on external tables or on object-relational tables (tables with `REF` columns in certain configurations). Attempting to add one raises `ORA-30553`.

### Performance Consideration: Expression Evaluation Cost

Virtual columns are re-evaluated every time they are referenced in a query — unless an index covers the column. For a table with millions of rows and a complex PL/SQL function as the expression, a full-table scan referencing the virtual column repeatedly evaluates the function. **Index the virtual column** for any predicate that will be used in a WHERE clause.

---

## Best Practices

- **Declare expressions in `DETERMINISTIC` PL/SQL functions** rather than embedding complex logic inline in the column definition. This improves readability, makes expression changes easier (just recompile the function), and keeps the DDL clean.
- **Index virtual columns used in WHERE clauses and JOIN conditions.** Without an index, Oracle evaluates the expression for every row during a full scan.
- **Name virtual columns clearly** to distinguish them from stored columns. Some teams use a naming suffix like `_V` or `_CALC` (e.g., `ANNUAL_COMP_V`) to signal to developers that the column is not a physical store.
- **Use virtual columns as partition keys** instead of adding redundant denormalized columns. This avoids the risk of the stored column becoming inconsistent with the base data.
- **Test expression changes carefully.** When you alter the expression of a virtual column, any dependent indexes become stale and must be rebuilt. Oracle does not automatically invalidate or rebuild them.
- **Document the business rule behind each virtual column** in the column's comment:

```sql
COMMENT ON COLUMN employees.salary_band IS
    'Derived salary classification: LOW (<30K), MEDIUM (30K-80K), HIGH (80K-150K), EXECUTIVE (150K+). Virtual — not stored.';
```

---

## Common Mistakes and How to Avoid Them

**Mistake 1: Using a non-deterministic function**
Oracle may allow creation in some configurations but produce wrong results when the column is indexed, because the index may not match the runtime value. Always explicitly mark functions `DETERMINISTIC` and verify they truly are (e.g., they do not call `SYSDATE`, `DBMS_RANDOM`, or read from other tables).

**Mistake 2: Expecting DML to populate virtual columns**
Developers unfamiliar with virtual columns sometimes include them in INSERT or UPDATE statements. This raises `ORA-54013: INSERT operation disallowed on virtual columns`. Applications must be coded to omit virtual column names from DML.

**Mistake 3: Altering the underlying function without rebuilding indexes**
If you change `fiscal_year()` to use a different fiscal calendar, the index `idx_orders_fiscal_cust` still contains values computed by the old function. You must `ALTER INDEX ... REBUILD` after any change to a function referenced by a virtual column index.

**Mistake 4: Using virtual column expressions in ORDER BY without an index**
Sorting on an unindexed virtual column forces Oracle to evaluate the expression for every row before sorting. For large tables, this causes expensive full scans + sort operations. Always check execution plans.

**Mistake 5: Referencing the virtual column in the same table's trigger**
`BEFORE INSERT OR UPDATE` triggers fire before the virtual column value is accessible. If your trigger tries to read a virtual column, it may see NULL or stale data. Use the base column expressions directly in trigger logic instead.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database SQL Language Reference: Virtual Columns 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html)
- [Oracle Database Administrator's Guide: Managing Tables — Virtual Columns 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/managing-tables.html)
- [Oracle Database VLDB and Partitioning Guide: Partitioning by Virtual Column](https://docs.oracle.com/en/database/oracle/oracle-database/19/vldbg/partition-virtual-column.html)
