# Oracle Partitioning Strategy

## Overview

Oracle Table Partitioning divides large tables and indexes into smaller, independently manageable segments called **partitions**. Each partition is a separate physical segment but is accessed transparently through the table name. Partitioning delivers three primary benefits:

1. **Partition Pruning**: The optimizer eliminates irrelevant partitions from query plans, dramatically reducing I/O.
2. **Partition-wise Operations**: Parallel operations (joins, aggregations) can be divided along partition boundaries.
3. **Partition Maintenance**: Archive, purge, or move individual partitions as atomic DDL operations — far faster than row-level deletes.

Partitioning requires the **Oracle Partitioning option** (Enterprise Edition). Verify availability:

```sql
SELECT value FROM v$option WHERE parameter = 'Partitioning';
```

---

## 1. Range Partitioning

**Range partitioning** assigns rows to partitions based on a column value falling within a specified range. It is the most common partitioning type and is ideal for time-series data (dates, timestamps, sequential IDs).

### Syntax

```sql
CREATE TABLE SALES (
    sale_id       NUMBER         NOT NULL,
    sale_date     DATE           NOT NULL,
    customer_id   NUMBER         NOT NULL,
    product_id    NUMBER         NOT NULL,
    amount        NUMBER(14,2)   NOT NULL,
    CONSTRAINT pk_sales PRIMARY KEY (sale_id, sale_date)  -- PK must include partition key
)
TABLESPACE sales_data
COMPRESS FOR QUERY HIGH
PARTITION BY RANGE (sale_date) (
    PARTITION p_2022_q1 VALUES LESS THAN (DATE '2022-04-01') TABLESPACE sales_2022,
    PARTITION p_2022_q2 VALUES LESS THAN (DATE '2022-07-01') TABLESPACE sales_2022,
    PARTITION p_2022_q3 VALUES LESS THAN (DATE '2022-10-01') TABLESPACE sales_2022,
    PARTITION p_2022_q4 VALUES LESS THAN (DATE '2023-01-01') TABLESPACE sales_2022,
    PARTITION p_2023_q1 VALUES LESS THAN (DATE '2023-04-01') TABLESPACE sales_2023,
    PARTITION p_future  VALUES LESS THAN (MAXVALUE)          TABLESPACE sales_data
);
```

### Interval Partitioning (Range Extension)

Oracle 11g+ supports **interval partitioning**, which automatically creates new partitions as data is inserted beyond existing boundaries — eliminating the need to manually add partitions.

```sql
CREATE TABLE ORDERS (
    order_id    NUMBER        NOT NULL,
    order_date  DATE          NOT NULL,
    customer_id NUMBER        NOT NULL,
    total       NUMBER(14,2)  NOT NULL,
    CONSTRAINT pk_orders PRIMARY KEY (order_id, order_date)
)
TABLESPACE orders_data
PARTITION BY RANGE (order_date)
INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))  -- auto-create one partition per month
(
    -- At least one partition must be defined manually as the seed
    PARTITION p_before_2023 VALUES LESS THAN (DATE '2023-01-01')
        TABLESPACE orders_archive
);
```

For interval partitions, specify the tablespace via `SET STORE IN`:

```sql
CREATE TABLE LOG_EVENTS (
    event_id    NUMBER     NOT NULL,
    event_time  TIMESTAMP  NOT NULL,
    severity    VARCHAR2(10),
    message     VARCHAR2(4000)
)
PARTITION BY RANGE (event_time)
INTERVAL (INTERVAL '1' DAY)
STORE IN (log_ts_1, log_ts_2, log_ts_3)  -- round-robin across tablespaces
(
    PARTITION p_before_start VALUES LESS THAN (TIMESTAMP '2023-01-01 00:00:00')
);
```

### Range Partition Pruning Example

```sql
-- This query prunes to p_2022_q1 and p_2022_q2 only
SELECT sale_id, amount
FROM   SALES
WHERE  sale_date BETWEEN DATE '2022-01-01' AND DATE '2022-06-30';

-- Verify pruning in execution plan
EXPLAIN PLAN FOR
SELECT sale_id, amount FROM SALES
WHERE  sale_date BETWEEN DATE '2022-01-01' AND DATE '2022-06-30';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(NULL, NULL, 'PARTITION'));
-- Look for "Pstart" and "Pstop" columns in the plan output
```

---

## 2. List Partitioning

**List partitioning** assigns rows to partitions based on discrete, enumerated column values. It is ideal for categorical data such as region, status, country code, or business unit.

### Syntax

```sql
CREATE TABLE CUSTOMERS (
    customer_id   NUMBER         NOT NULL,
    region        VARCHAR2(20)   NOT NULL,  -- partition key
    full_name     VARCHAR2(200)  NOT NULL,
    email         VARCHAR2(255)  NOT NULL,
    CONSTRAINT pk_customers PRIMARY KEY (customer_id, region)
)
PARTITION BY LIST (region) (
    PARTITION p_north_america VALUES ('US', 'CA', 'MX'),
    PARTITION p_europe         VALUES ('GB', 'DE', 'FR', 'IT', 'ES', 'NL'),
    PARTITION p_apac           VALUES ('AU', 'JP', 'SG', 'IN', 'CN', 'KR'),
    PARTITION p_latam          VALUES ('BR', 'AR', 'CL', 'CO'),
    PARTITION p_other          VALUES (DEFAULT)  -- catch-all (11g+: DEFAULT keyword)
);
```

**Note:** Without a `DEFAULT` partition in Oracle 11g+, inserting an unmapped value raises `ORA-14400: inserted partition key does not map to any partition`. Always include a `DEFAULT` or `MAXVALUE` catch-all.

### Automatic List Partitioning (Oracle 12c R2+)

```sql
CREATE TABLE TRANSACTIONS (
    txn_id       NUMBER       NOT NULL,
    payment_type VARCHAR2(30) NOT NULL,
    amount       NUMBER(14,2) NOT NULL
)
PARTITION BY LIST (payment_type) AUTOMATIC  -- new partitions created on-the-fly
(
    PARTITION p_credit_card VALUES ('VISA', 'MASTERCARD', 'AMEX')
);
-- First insert of 'PAYPAL' automatically creates partition p_sys_p_xxx
```

---

## 3. Hash Partitioning

**Hash partitioning** distributes rows evenly across a fixed number of partitions using an Oracle-internal hash function applied to the partition key. It does **not** support partition pruning by value range or list — it is used purely for **I/O distribution** and **parallel join performance**.

### When to Use Hash Partitioning

- No natural range or category boundary exists
- The goal is even I/O distribution across storage devices
- Enabling **partition-wise joins** (when joining two hash-partitioned tables on the same key with the same number of partitions)
- Reducing hot-block contention on high-concurrency insert tables

### Syntax

```sql
-- Power-of-2 partition counts are common, but not required
CREATE TABLE SESSION_EVENTS (
    event_id     NUMBER        NOT NULL,
    session_id   VARCHAR2(64)  NOT NULL,  -- hash key: evenly distributed
    event_type   VARCHAR2(50)  NOT NULL,
    event_time   TIMESTAMP     NOT NULL,
    payload      CLOB,
    CONSTRAINT pk_session_events PRIMARY KEY (event_id)
)
PARTITION BY HASH (session_id)
PARTITIONS 16
STORE IN (hash_ts_1, hash_ts_2, hash_ts_3, hash_ts_4);  -- 16 partitions distributed across 4 tablespaces
```

### Partition-Wise Join (Hash Partitioning Benefit)

```sql
-- Both tables hash-partitioned on the same key with same partition count
CREATE TABLE ORDERS_H (
    order_id    NUMBER NOT NULL,
    customer_id NUMBER NOT NULL  -- hash partition key
)
PARTITION BY HASH (customer_id) PARTITIONS 32;

CREATE TABLE ORDER_ITEMS_H (
    item_id     NUMBER NOT NULL,
    order_id    NUMBER NOT NULL,
    customer_id NUMBER NOT NULL  -- same hash partition key
)
PARTITION BY HASH (customer_id) PARTITIONS 32;

-- Oracle can perform full partition-wise join: each partition pair joined independently
SELECT /*+ PQ_DISTRIBUTE(i PARTITION NONE) */ o.order_id, i.item_id
FROM   ORDERS_H o
JOIN   ORDER_ITEMS_H i ON o.customer_id = i.customer_id AND o.order_id = i.order_id;
```

---

## 4. Composite Partitioning

**Composite partitioning** combines two partitioning strategies: a primary strategy (the partition level) and a secondary strategy (the subpartition level). This enables both partition pruning on the top key and even distribution or categorization within each partition.

### Range-Hash Composite

Best for time-series data that also needs even I/O distribution within each time period.

```sql
CREATE TABLE CLICKSTREAM (
    event_id      NUMBER        NOT NULL,
    event_date    DATE          NOT NULL,   -- range partition key
    user_id       NUMBER        NOT NULL,   -- hash subpartition key
    page_url      VARCHAR2(2000),
    event_type    VARCHAR2(50),
    CONSTRAINT pk_clickstream PRIMARY KEY (event_id, event_date)
)
PARTITION BY RANGE (event_date)
SUBPARTITION BY HASH (user_id) SUBPARTITIONS 8
(
    PARTITION p_2023_q1 VALUES LESS THAN (DATE '2023-04-01')
        STORE IN (cs_ts_1, cs_ts_2, cs_ts_3, cs_ts_4),
    PARTITION p_2023_q2 VALUES LESS THAN (DATE '2023-07-01')
        STORE IN (cs_ts_1, cs_ts_2, cs_ts_3, cs_ts_4),
    PARTITION p_2023_q3 VALUES LESS THAN (DATE '2023-10-01'),
    PARTITION p_future  VALUES LESS THAN (MAXVALUE)
);
```

### Range-List Composite

Best for time-series data that also needs region/category segmentation.

```sql
-- Subpartition template: apply consistent subpartition structure to all range partitions
CREATE TABLE REGIONAL_SALES (
    sale_id     NUMBER         NOT NULL,
    sale_date   DATE           NOT NULL,
    region      VARCHAR2(20)   NOT NULL,
    amount      NUMBER(14,2)   NOT NULL,
    CONSTRAINT pk_reg_sales PRIMARY KEY (sale_id, sale_date, region)
)
PARTITION BY RANGE (sale_date)
SUBPARTITION BY LIST (region)
SUBPARTITION TEMPLATE (                          -- template applies to all range partitions
    SUBPARTITION sp_na    VALUES ('US', 'CA', 'MX'),
    SUBPARTITION sp_eu    VALUES ('GB', 'DE', 'FR'),
    SUBPARTITION sp_apac  VALUES ('AU', 'JP', 'SG'),
    SUBPARTITION sp_other VALUES (DEFAULT)
)
(
    PARTITION p_2023 VALUES LESS THAN (DATE '2024-01-01'),
    PARTITION p_2024 VALUES LESS THAN (DATE '2025-01-01'),
    PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- Pruning works on both levels simultaneously
SELECT * FROM REGIONAL_SALES
WHERE  sale_date >= DATE '2023-01-01'
AND    sale_date <  DATE '2024-01-01'
AND    region IN ('US', 'CA');
-- Prunes to p_2023 partition, sp_na subpartition only
```

### List-Hash Composite

Best for categorical top-level segmentation with even distribution within each category.

```sql
CREATE TABLE PRODUCT_INVENTORY (
    inventory_id  NUMBER       NOT NULL,
    warehouse_id  NUMBER       NOT NULL,  -- hash subpartition key
    category      VARCHAR2(50) NOT NULL,  -- list partition key
    product_id    NUMBER       NOT NULL,
    quantity      NUMBER       NOT NULL
)
PARTITION BY LIST (category)
SUBPARTITION BY HASH (warehouse_id) SUBPARTITIONS 4
(
    PARTITION p_electronics VALUES ('PHONES', 'LAPTOPS', 'TABLETS'),
    PARTITION p_clothing     VALUES ('SHIRTS', 'PANTS', 'SHOES'),
    PARTITION p_food         VALUES ('FRESH', 'FROZEN', 'DRY'),
    PARTITION p_other        VALUES (DEFAULT)
);
```

---

## 5. Partition Pruning

Partition pruning is the optimizer's ability to exclude irrelevant partitions from execution plans. It is the primary performance benefit of partitioning and only works when the partition key is included in the `WHERE` clause with a **static or bind-variable** predicate.

### Pruning Requirements

```sql
-- GOOD: Static literal — compile-time pruning
SELECT * FROM ORDERS WHERE order_date >= DATE '2024-01-01';

-- GOOD: Bind variable — runtime pruning (still efficient)
SELECT * FROM ORDERS WHERE order_date >= :start_date;

-- BAD: Function applied to partition key — disables pruning
SELECT * FROM ORDERS WHERE TRUNC(order_date) >= DATE '2024-01-01';
-- Fix: store a pre-truncated date column, or use: order_date >= DATE '2024-01-01'
--      AND order_date < DATE '2024-01-02'

-- BAD: Implicit type conversion — may disable pruning
SELECT * FROM ORDERS WHERE order_date >= '2024-01-01';  -- string comparison
-- Fix: always use explicit DATE literals or TO_DATE()
```

### Verifying Pruning in Execution Plans

```sql
-- Method 1: DBMS_XPLAN with PARTITION format
EXPLAIN PLAN FOR
SELECT * FROM SALES WHERE sale_date BETWEEN DATE '2024-01-01' AND DATE '2024-03-31';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(NULL, NULL, 'ALL'));
-- Key output: look for "Pstart=1 Pstop=1" (single partition) vs "Pstart=1 Pstop=4"

-- Method 2: V$SQL_PLAN for running queries
SELECT partition_start, partition_stop, partition_id, operation, options
FROM   v$sql_plan
WHERE  sql_id = :sql_id
ORDER  BY id;
```

### Partition Elimination Statistics

```sql
-- Check partition-level statistics for a table
SELECT table_name, partition_name, num_rows, blocks, last_analyzed
FROM   user_tab_partitions
WHERE  table_name = 'SALES'
ORDER  BY partition_position;
```

---

## 6. Local vs Global Indexes

### Local Indexes

A **local index** is partitioned using the same strategy as the underlying table. Each index partition corresponds to exactly one table partition. Local indexes are the preferred choice for partitioned tables.

```sql
-- Local non-unique index
CREATE INDEX IX_SALES_CUSTOMER ON SALES (customer_id)
LOCAL  -- one index partition per table partition
TABLESPACE sales_idx;

-- Local unique index (partition key must be included for uniqueness guarantee)
CREATE UNIQUE INDEX UX_SALES_ORDER_LINE ON SALES (order_id, line_id, sale_date)
LOCAL
TABLESPACE sales_idx;
```

**Local index characteristics:**
- Automatically maintained during partition operations (split, merge, drop, exchange)
- Partition pruning on the table automatically prunes the index too
- `UNUSABLE` state is limited to the affected partition, not the whole index
- Unique local indexes require the partition key to be part of the unique key

### Global Indexes

A **global index** spans all table partitions as a single index structure. It provides uniqueness enforcement independent of partition key.

```sql
-- Global partitioned index (range-partitioned on the index key)
CREATE UNIQUE INDEX UX_ORDERS_ORDER_NUM ON ORDERS (order_number)
GLOBAL
PARTITION BY RANGE (order_number) (
    PARTITION p_low    VALUES LESS THAN (1000000),
    PARTITION p_mid    VALUES LESS THAN (9000000),
    PARTITION p_high   VALUES LESS THAN (MAXVALUE)
)
TABLESPACE orders_idx;

-- Global non-partitioned index (classic single-structure index spanning all partitions)
CREATE INDEX IX_ORDERS_EMAIL ON ORDERS (customer_email)
GLOBAL  -- or simply omit GLOBAL/LOCAL — non-partitioned is the default
TABLESPACE orders_idx;
```

**Global index characteristics:**
- Allows unique constraints on columns that don't include the partition key
- Must be rebuilt (or marked UNUSABLE) after partition maintenance operations unless `UPDATE GLOBAL INDEXES` is specified
- More expensive to maintain during partition DDL

```sql
-- Partition maintenance with global index update
ALTER TABLE ORDERS DROP PARTITION p_2020
UPDATE GLOBAL INDEXES;  -- keeps global indexes valid; slower but avoids rebuilds

-- Or let global indexes go UNUSABLE (default when no index clause is specified) then rebuild
-- NOTE: there is no INVALIDATE GLOBAL INDEXES clause; omitting the clause causes indexes to become UNUSABLE
ALTER TABLE ORDERS DROP PARTITION p_2020;
ALTER INDEX UX_ORDERS_ORDER_NUM REBUILD;
```

### Local vs Global Decision Matrix

| Criterion | Local Index | Global Index |
|---|---|---|
| Partition maintenance impact | Minimal (only affected partition) | Full rebuild required (unless `UPDATE GLOBAL INDEXES`) |
| Partition pruning support | Full pruning on both table and index | Index-level pruning only (if global is partitioned) |
| Unique constraint without partition key | Not possible | Supported |
| Range scan on non-partition key | Less efficient | More efficient |
| Best for | DW fact tables, time-series data | OLTP unique lookups, cross-partition range scans |

---

## 7. Partition Maintenance Operations

```sql
-- Add a new partition to a range-partitioned table
ALTER TABLE SALES ADD PARTITION p_2025_q1
    VALUES LESS THAN (DATE '2025-04-01')
    TABLESPACE sales_2025;

-- Drop an old partition (and its data!) — irreversible
ALTER TABLE SALES DROP PARTITION p_2022_q1
UPDATE GLOBAL INDEXES;

-- Truncate a partition (delete all rows in partition — faster than DELETE)
ALTER TABLE SALES TRUNCATE PARTITION p_2022_q1;

-- Exchange a partition with a staging table (zero-copy ETL)
-- 1. Create staging table with identical structure (no partitioning)
CREATE TABLE SALES_STAGING AS SELECT * FROM SALES WHERE 1=0;

-- 2. Load data into staging table (bulk insert, external table, etc.)
INSERT /*+ APPEND */ INTO SALES_STAGING SELECT ...;
COMMIT;

-- 3. Exchange: swap partition with staging table atomically
ALTER TABLE SALES EXCHANGE PARTITION p_2024_q4
WITH TABLE SALES_STAGING
INCLUDING INDEXES
WITHOUT VALIDATION;  -- skip row validation for performance

-- Split a partition into two
ALTER TABLE SALES SPLIT PARTITION p_future
    AT (DATE '2026-01-01')
    INTO (PARTITION p_2025_q4, PARTITION p_future)
UPDATE GLOBAL INDEXES;

-- Merge two adjacent partitions
ALTER TABLE SALES MERGE PARTITIONS p_2022_q1, p_2022_q2
    INTO PARTITION p_2022_h1
UPDATE GLOBAL INDEXES;
```

---

## 8. When to Use Each Partitioning Type

| Partitioning Type | Best Use Cases | Avoid When |
|---|---|---|
| **Range** | Time-series data, log tables, historical archives; enables rolling window (drop oldest, add newest) | Data has no natural range ordering |
| **Interval (Range extension)** | Same as range but with automatic partition creation; high-volume append tables | You need precise control over partition creation timing |
| **List** | Regional data, status codes, business unit data; values are discrete and enumerable | Too many distinct values; values change frequently |
| **Automatic List** | Same as list but unknown future values; multi-tenant schemas | You need predictable partition names and locations |
| **Hash** | Even I/O distribution; eliminate hot spots; partition-wise joins | You need partition pruning by value; sequential scans by key |
| **Range-Hash** | Time-series data needing even distribution within time windows | Simple time-series without concurrency issues |
| **Range-List** | Time-series data needing regional/categorical segmentation | The list categories are unstable or too numerous |
| **List-Hash** | Categorical data needing even sub-distribution | Simple categorical data without skew |

---

## 9. Best Practices

- **Always include the partition key in primary and unique keys** for local unique indexes. Oracle enforces this requirement.
- **Choose partition granularity based on data volume and pruning patterns.** Monthly partitions for tables receiving ~10M rows/month; quarterly or annual partitions for smaller tables.
- **Use `INTERVAL` partitioning** for any append-only time-series table to eliminate partition maintenance overhead.
- **Gather partition-level statistics.** The optimizer needs current stats per partition for accurate cardinality estimates.
  ```sql
  EXEC DBMS_STATS.GATHER_TABLE_STATS(
      ownname          => 'SCHEMA_OWNER',
      tabname          => 'SALES',
      partname         => 'P_2024_Q4',
      granularity      => 'PARTITION',
      estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE
  );
  ```
- **Use `COMPRESS FOR QUERY HIGH`** on all data warehouse fact table partitions. Apply on a per-partition basis to avoid recompressing historical data.
- **Create local indexes for DW tables; use global indexes sparingly** and only where cross-partition uniqueness or non-partition-key range scans are required.

---

## 10. Common Mistakes and How to Avoid Them

### Mistake 1: Applying Functions to the Partition Key in WHERE Clauses

```sql
-- BAD: TRUNC() defeats partition pruning
SELECT * FROM ORDERS WHERE TRUNC(order_date, 'MM') = DATE '2024-01-01';

-- GOOD: use a range predicate directly on the partition key
SELECT * FROM ORDERS
WHERE  order_date >= DATE '2024-01-01'
AND    order_date <  DATE '2024-02-01';
```

### Mistake 2: Non-Power-of-2 Hash Partition Count

Hash partition counts do not need to be powers of 2. Use a partition count that matches operational needs, expected data volume, and desired parallelism. Power-of-2 counts are a common convention, not a requirement.

```sql
-- Acceptable
PARTITION BY HASH (user_id) PARTITIONS 10;

-- Also acceptable
PARTITION BY HASH (user_id) PARTITIONS 16;
```

### Mistake 3: Forgetting UPDATE GLOBAL INDEXES on Partition DDL

```sql
-- BAD: leaves global indexes UNUSABLE
ALTER TABLE ORDERS DROP PARTITION p_old;

-- GOOD: maintains global index validity
ALTER TABLE ORDERS DROP PARTITION p_old UPDATE GLOBAL INDEXES;
```

### Mistake 4: Partitioning Small Tables

Partitioning tables with fewer than a few million rows adds overhead (partition metadata, statistics gathering complexity) without benefit. Only partition tables where partition pruning will eliminate a meaningful portion of I/O.

### Mistake 5: Not Indexing the Partition Key

Even on a partitioned table, if queries filter by non-partition key columns, you still need indexes on those columns. Partition pruning only helps when the partition key is in the predicate.

### Mistake 6: Choosing the Wrong Partition Key

The partition key must align with the most common query filter. A table partitioned by `LOAD_DATE` but queried by `TRANSACTION_DATE` will never prune. Analyze actual query patterns before choosing the partition key — this decision is difficult to reverse in production.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 23ai VLDB and Partitioning Guide — Partition Concepts](https://docs.oracle.com/en/database/oracle/oracle-database/23/vldbg/partition-concepts.html)
- [Oracle Database 23ai VLDB and Partitioning Guide — Partition Administration](https://docs.oracle.com/en/database/oracle/oracle-database/23/vldbg/)
- [Oracle Database 23ai VLDB and Partitioning Guide — Partition Pruning](https://docs.oracle.com/en/database/oracle/oracle-database/21/vldbg/partition-pruning.html)
- [Oracle Database 12c R2 — Automatic List Partitioning (oracle-base.com)](https://oracle-base.com/articles/12c/automatic-list-partitioning-12cr2)
- [Oracle Database 11g R1 — Interval Partitioning (oracle-base.com)](https://oracle-base.com/articles/11g/partitioning-enhancements-11gr1)
- [Oracle Database 12c R2 — Partitioning Enhancements (oracle-base.com)](https://oracle-base.com/articles/12c/partitioning-enhancements-12cr2)
- [Oracle Database 12c R1 — Asynchronous Global Index Maintenance (oracle-base.com)](https://oracle-base.com/articles/12c/asynchronous-global-index-maintenance-for-drop-and-truncate-partition-12cr1)
- [Oracle Database 23ai SQL Language Reference — ALTER TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/)
- [Oracle Database Partitioning Option licensing](https://www.oracle.com/database/technologies/partitioning.html)
