# Data Modeling for Oracle Database

## Overview

Data modeling is the process of defining how data is organized, stored, and related within a database. It operates across three abstraction levels: **conceptual** (business concepts), **logical** (platform-independent relational structure), and **physical** (Oracle-specific DDL with storage parameters). This guide covers logical and physical modeling techniques, data warehouse schema patterns, Operational Data Store design, and Oracle-specific physical model considerations including storage clauses, compression, and partitioning.

---

## 1. Modeling Levels

### Conceptual Model

The conceptual model captures business entities and their high-level relationships without any technical detail. It is tool-agnostic and intended for communication with business stakeholders.

- Entities: Customer, Order, Product
- Relationships: Customer places Order, Order contains Product
- No data types, no keys, no constraints

### Logical Model

The logical model is platform-independent but technically complete. It defines:

- All entities as tables with column names and data types (generic: STRING, INTEGER, DECIMAL)
- Primary keys, foreign keys, and candidate keys
- Normalization applied (typically to 3NF for OLTP, denormalized for OLAP)
- Constraints and business rules (referential integrity, NOT NULL)

### Physical Model

The physical model is Oracle-specific DDL. It adds:

- Oracle data types (`VARCHAR2`, `NUMBER`, `DATE`, `TIMESTAMP`, `CLOB`, `BLOB`)
- Storage clauses (`TABLESPACE`, `STORAGE`, `PCTFREE`, `PCTUSED`)
- Partitioning strategy
- Index definitions
- Compression settings
- Parallel query hints

---

## 2. OLTP Logical Modeling

Online Transaction Processing (OLTP) systems prioritize **write performance**, **data integrity**, and **concurrency**. The logical model for OLTP follows normalization rules closely (3NF minimum).

### Key Characteristics

- High insert/update/delete volume
- Small, targeted queries (single-row or narrow range lookups)
- Many short transactions with high concurrency
- Row-level locking is critical
- Normalized to minimize redundancy and lock contention

### Sample OLTP Schema

```sql
-- Normalized OLTP schema for an e-commerce system

CREATE TABLE CUSTOMERS (
    customer_id   NUMBER         GENERATED ALWAYS AS IDENTITY,
    email         VARCHAR2(255)  NOT NULL,
    first_name    VARCHAR2(100)  NOT NULL,
    last_name     VARCHAR2(100)  NOT NULL,
    created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_customers      PRIMARY KEY (customer_id),
    CONSTRAINT uq_customers_email UNIQUE (email)
)
TABLESPACE users_data
PCTFREE 10;

CREATE TABLE ORDERS (
    order_id      NUMBER         GENERATED ALWAYS AS IDENTITY,
    customer_id   NUMBER         NOT NULL,
    order_date    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    status        VARCHAR2(20)   DEFAULT 'PENDING' NOT NULL,
    total_amount  NUMBER(14,2),
    CONSTRAINT pk_orders         PRIMARY KEY (order_id),
    CONSTRAINT fk_orders_cust    FOREIGN KEY (customer_id) REFERENCES CUSTOMERS (customer_id),
    CONSTRAINT ck_order_status   CHECK (status IN ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'))
)
TABLESPACE users_data
PCTFREE 15;  -- higher PCTFREE for rows likely to grow via updates

CREATE INDEX IX_ORDERS_CUSTOMER_ID ON ORDERS (customer_id) TABLESPACE users_idx;
CREATE INDEX IX_ORDERS_ORDER_DATE  ON ORDERS (order_date)  TABLESPACE users_idx;
```

---

## 3. Data Warehouse Dimensional Modeling

Data warehouses prioritize **read performance** for analytical queries over large data volumes. **Dimensional modeling** (Ralph Kimball methodology) structures data into **fact tables** and **dimension tables**.

### Fact Tables

Fact tables store measurable business events (sales, transactions, events). They contain:

- Foreign keys to dimension tables
- Numeric measures (quantity, amount, duration)
- Degenerate dimensions (order number stored in the fact, not a separate dimension)
- Typically very large (hundreds of millions to billions of rows)

### Dimension Tables

Dimension tables store descriptive context for facts. They contain:

- A surrogate primary key (not the natural/business key)
- Descriptive attributes (names, categories, hierarchies)
- Typically much smaller than fact tables
- Updated infrequently (Slowly Changing Dimensions)

---

## 4. Star Schema

The **star schema** is the simplest and most query-efficient dimensional model. The fact table is in the center; dimension tables radiate outward like a star. There is no normalization between dimension tables — all descriptive attributes are collapsed into a single wide dimension table.

```
                 DIM_DATE
                    |
DIM_CUSTOMER -- FACT_SALES -- DIM_PRODUCT
                    |
              DIM_STORE
```

### Star Schema DDL Example

```sql
-- Dimension: Date
CREATE TABLE DIM_DATE (
    date_key        NUMBER(8)    NOT NULL,  -- YYYYMMDD surrogate key
    full_date       DATE         NOT NULL,
    day_of_week     VARCHAR2(10) NOT NULL,
    day_of_month    NUMBER(2)    NOT NULL,
    month_number    NUMBER(2)    NOT NULL,
    month_name      VARCHAR2(10) NOT NULL,
    quarter_number  NUMBER(1)    NOT NULL,
    year_number     NUMBER(4)    NOT NULL,
    is_weekend      CHAR(1)      DEFAULT 'N' NOT NULL,
    is_holiday      CHAR(1)      DEFAULT 'N' NOT NULL,
    CONSTRAINT pk_dim_date PRIMARY KEY (date_key)
)
TABLESPACE dw_data
COMPRESS FOR QUERY HIGH;  -- Hybrid Columnar Compression (HCC) — requires Exadata or Oracle ZFS/ODA storage

-- Dimension: Customer (denormalized — city/state/country collapsed in)
CREATE TABLE DIM_CUSTOMER (
    customer_key    NUMBER       GENERATED ALWAYS AS IDENTITY,
    customer_bk     VARCHAR2(50) NOT NULL,  -- business/natural key
    full_name       VARCHAR2(200) NOT NULL,
    email           VARCHAR2(255),
    city            VARCHAR2(100),
    state_province  VARCHAR2(100),
    country_code    CHAR(2),
    customer_segment VARCHAR2(50),
    effective_from  DATE         NOT NULL,
    effective_to    DATE,
    is_current      CHAR(1)      DEFAULT 'Y' NOT NULL,
    CONSTRAINT pk_dim_customer PRIMARY KEY (customer_key)
)
TABLESPACE dw_data
COMPRESS FOR QUERY HIGH;

-- Dimension: Product (denormalized — category hierarchy collapsed in)
CREATE TABLE DIM_PRODUCT (
    product_key       NUMBER        GENERATED ALWAYS AS IDENTITY,
    product_bk        VARCHAR2(50)  NOT NULL,
    product_name      VARCHAR2(200) NOT NULL,
    product_desc      VARCHAR2(1000),
    subcategory_name  VARCHAR2(100),
    category_name     VARCHAR2(100),
    brand_name        VARCHAR2(100),
    unit_cost         NUMBER(12,2),
    unit_price        NUMBER(12,2),
    is_active         CHAR(1)       DEFAULT 'Y' NOT NULL,
    CONSTRAINT pk_dim_product PRIMARY KEY (product_key)
)
TABLESPACE dw_data
COMPRESS FOR QUERY HIGH;

-- Fact: Sales (central fact table)
CREATE TABLE FACT_SALES (
    sales_id          NUMBER        GENERATED ALWAYS AS IDENTITY,
    date_key          NUMBER(8)     NOT NULL,
    customer_key      NUMBER        NOT NULL,
    product_key       NUMBER        NOT NULL,
    store_key         NUMBER        NOT NULL,
    order_number      VARCHAR2(50),           -- degenerate dimension
    quantity_sold     NUMBER(10)    NOT NULL,
    unit_price        NUMBER(12,2)  NOT NULL,
    unit_cost         NUMBER(12,2)  NOT NULL,
    gross_revenue     NUMBER(14,2)  NOT NULL,
    gross_profit      NUMBER(14,2)  NOT NULL,
    discount_amount   NUMBER(12,2)  DEFAULT 0 NOT NULL,
    CONSTRAINT pk_fact_sales      PRIMARY KEY (sales_id),
    CONSTRAINT fk_fs_date         FOREIGN KEY (date_key)     REFERENCES DIM_DATE     (date_key),
    CONSTRAINT fk_fs_customer     FOREIGN KEY (customer_key) REFERENCES DIM_CUSTOMER (customer_key),
    CONSTRAINT fk_fs_product      FOREIGN KEY (product_key)  REFERENCES DIM_PRODUCT  (product_key),
    CONSTRAINT fk_fs_store        FOREIGN KEY (store_key)    REFERENCES DIM_STORE    (store_key)
)
TABLESPACE dw_data
COMPRESS FOR QUERY HIGH
PARTITION BY RANGE (date_key) (
    PARTITION p_2023 VALUES LESS THAN (20240101),
    PARTITION p_2024 VALUES LESS THAN (20250101),
    PARTITION p_2025 VALUES LESS THAN (20260101),
    PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- Bitmap indexes — extremely efficient for low-cardinality FK columns in DW
CREATE BITMAP INDEX BIX_FS_DATE     ON FACT_SALES (date_key)     LOCAL TABLESPACE dw_idx;
CREATE BITMAP INDEX BIX_FS_CUSTOMER ON FACT_SALES (customer_key) LOCAL TABLESPACE dw_idx;
CREATE BITMAP INDEX BIX_FS_PRODUCT  ON FACT_SALES (product_key)  LOCAL TABLESPACE dw_idx;
```

**Note:** Bitmap indexes are ideal for data warehouse FK columns (low cardinality, read-heavy, infrequent DML). Never use bitmap indexes on OLTP tables with high concurrent writes — they cause severe lock contention.

> **Important:** `COMPRESS FOR QUERY HIGH` uses Oracle Hybrid Columnar Compression (HCC). HCC is **not** a general Advanced Compression feature — it requires Exadata, Oracle ZFS Storage Appliance, Oracle Database Appliance (ODA), or another HCC-compatible engineered system. On standard server storage, this clause will not achieve columnar compression. For non-Exadata environments use `ROW STORE COMPRESS ADVANCED` (Advanced Row Compression, requires Advanced Compression option) or `COMPRESS BASIC` (direct-path inserts only, all editions).

---

## 5. Snowflake Schema

The **snowflake schema** normalizes dimension tables, splitting out sub-hierarchies into separate tables. This reduces storage for dimension data but introduces additional joins.

```
DIM_PRODUCT_CATEGORY
        |
  DIM_PRODUCT -- FACT_SALES -- DIM_CUSTOMER -- DIM_GEOGRAPHY
                    |
               DIM_DATE
```

### Snowflake DDL Example

```sql
-- Normalized product dimension hierarchy
CREATE TABLE DIM_PRODUCT_CATEGORY (
    category_key   NUMBER       GENERATED ALWAYS AS IDENTITY,
    category_name  VARCHAR2(100) NOT NULL,
    CONSTRAINT pk_dim_prod_cat PRIMARY KEY (category_key)
);

CREATE TABLE DIM_PRODUCT_SUBCATEGORY (
    subcategory_key   NUMBER       GENERATED ALWAYS AS IDENTITY,
    subcategory_name  VARCHAR2(100) NOT NULL,
    category_key      NUMBER       NOT NULL,
    CONSTRAINT pk_dim_prod_subcat    PRIMARY KEY (subcategory_key),
    CONSTRAINT fk_subcat_category    FOREIGN KEY (category_key)
                                     REFERENCES DIM_PRODUCT_CATEGORY (category_key)
);

CREATE TABLE DIM_PRODUCT (
    product_key       NUMBER        GENERATED ALWAYS AS IDENTITY,
    product_bk        VARCHAR2(50)  NOT NULL,
    product_name      VARCHAR2(200) NOT NULL,
    subcategory_key   NUMBER        NOT NULL,
    unit_price        NUMBER(12,2),
    CONSTRAINT pk_dim_product     PRIMARY KEY (product_key),
    CONSTRAINT fk_prod_subcategory FOREIGN KEY (subcategory_key)
                                   REFERENCES DIM_PRODUCT_SUBCATEGORY (subcategory_key)
);
```

### Star vs Snowflake: When to Use Each

| Criteria | Star Schema | Snowflake Schema |
|---|---|---|
| Query performance | Better (fewer joins) | Slower (more joins) |
| Storage | More (denormalized dimensions) | Less (normalized dimensions) |
| ETL complexity | Simpler | More complex |
| Maintenance | Harder (update in many rows) | Easier (update dimension table) |
| BI tool compatibility | Better (most tools prefer star) | Acceptable |
| Best for | Most DW use cases | Very large dimensions with deep hierarchies |

---

## 6. Operational Data Store (ODS)

An **Operational Data Store** bridges OLTP source systems and the data warehouse. It provides:

- Near-real-time integrated operational reporting
- A staging/cleansing layer before DW loading
- A single integrated view across multiple source systems

### ODS Design Principles

- **Subject-oriented**: Organized around business subjects, not source systems
- **Integrated**: Data from multiple sources reconciled into a common model
- **Current**: Reflects near-real-time operational state (unlike DW which is historical)
- **Volatile**: ODS data is updated in-place (unlike DW which is append-only)

```sql
-- ODS table with source system tracking and audit columns
CREATE TABLE ODS_CUSTOMER (
    ods_customer_id     NUMBER        GENERATED ALWAYS AS IDENTITY,
    -- Source system tracking
    source_system       VARCHAR2(50)  NOT NULL,  -- 'CRM', 'ERP', 'WEB'
    source_system_id    VARCHAR2(100) NOT NULL,
    -- Business key (unified across source systems)
    customer_email      VARCHAR2(255) NOT NULL,
    -- Integrated attributes
    full_name           VARCHAR2(200),
    phone_number        VARCHAR2(30),
    address_line1       VARCHAR2(255),
    city                VARCHAR2(100),
    country_code        CHAR(2),
    customer_status     VARCHAR2(20),
    -- ODS audit columns
    source_created_at   TIMESTAMP,
    source_updated_at   TIMESTAMP,
    ods_loaded_at       TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    ods_updated_at      TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    ods_checksum        VARCHAR2(64),  -- MD5/SHA of key fields for change detection
    CONSTRAINT pk_ods_customer       PRIMARY KEY (ods_customer_id),
    CONSTRAINT uq_ods_cust_src       UNIQUE (source_system, source_system_id)
)
TABLESPACE ods_data;

-- Index for common ODS lookup patterns
CREATE INDEX IX_ODS_CUST_EMAIL  ON ODS_CUSTOMER (customer_email)  TABLESPACE ods_idx;
CREATE INDEX IX_ODS_CUST_LOADED ON ODS_CUSTOMER (ods_loaded_at)   TABLESPACE ods_idx;
```

---

## 7. Slowly Changing Dimensions (SCD)

SCDs manage changes to dimension data over time. Oracle supports all three common types.

### SCD Type 1 — Overwrite

No history retained. Simplest approach. Used when history is not relevant.

```sql
UPDATE DIM_CUSTOMER
SET    email       = :new_email,
       ods_updated_at = SYSTIMESTAMP
WHERE  customer_bk = :customer_bk
AND    is_current  = 'Y';
```

### SCD Type 2 — Add New Row (Full History)

A new row is inserted for every change. Previous row is closed out.

```sql
-- Close the current record
UPDATE DIM_CUSTOMER
SET    effective_to = TRUNC(SYSDATE) - INTERVAL '1' SECOND,
       is_current   = 'N'
WHERE  customer_bk  = :customer_bk
AND    is_current   = 'Y';

-- Insert the new current record
INSERT INTO DIM_CUSTOMER (
    customer_bk, full_name, email, city, state_province, country_code,
    customer_segment, effective_from, effective_to, is_current
) VALUES (
    :customer_bk, :full_name, :email, :city, :state_province, :country_code,
    :customer_segment, TRUNC(SYSDATE), NULL, 'Y'
);
```

### SCD Type 3 — Previous Value Column

Stores the current and one previous value. Limited history but simple queries.

```sql
ALTER TABLE DIM_CUSTOMER ADD (
    previous_email     VARCHAR2(255),
    email_changed_date DATE
);

UPDATE DIM_CUSTOMER
SET    previous_email     = email,
       email_changed_date = SYSDATE,
       email              = :new_email
WHERE  customer_bk = :customer_bk;
```

---

## 8. Oracle Physical Model Considerations

### Oracle Data Types

Choose data types carefully for storage efficiency and correctness:

```sql
CREATE TABLE PHYSICAL_MODEL_EXAMPLE (
    -- Numeric types
    id              NUMBER(10)          NOT NULL,  -- integers up to 10 digits
    amount          NUMBER(18,4)        NOT NULL,  -- financial: precision + scale
    percentage      NUMBER(5,2)         NOT NULL,  -- 999.99

    -- Character types
    short_code      CHAR(3)             NOT NULL,  -- fixed-length: ISO codes
    description     VARCHAR2(4000)      NOT NULL,  -- variable, up to 4000 bytes
    large_text      CLOB,                          -- > 4000 chars
    json_data       CLOB CHECK (json_data IS JSON),-- JSON validation (12c+)

    -- Date/Time types
    event_date      DATE                NOT NULL,  -- date + time (no TZ)
    created_at      TIMESTAMP(6)        NOT NULL,  -- microsecond precision
    updated_at      TIMESTAMP WITH TIME ZONE,      -- global apps: always store TZ
    duration_days   INTERVAL DAY(3) TO SECOND(0),  -- elapsed time

    -- Binary types
    file_content    BLOB,                          -- binary files
    thumbnail       RAW(2000),                     -- small binary (<= 2000 bytes)

    CONSTRAINT pk_pme PRIMARY KEY (id)
);
```

### Storage Clauses

Oracle storage parameters control physical space allocation within a segment:

```sql
CREATE TABLE ORDERS (
    order_id     NUMBER        NOT NULL,
    order_data   VARCHAR2(500),
    CONSTRAINT pk_orders PRIMARY KEY (order_id)
)
TABLESPACE users_data
PCTFREE   15     -- 15% of each block reserved for row updates (UPDATE growth)
PCTUSED   40     -- block re-eligible for inserts when used% drops below 40 (MSSM only)
INITRANS  4      -- initial transaction slots per block (higher for concurrent DML)
MAXTRANS  255    -- maximum concurrent transactions per block
STORAGE (
    INITIAL     64K    -- initial extent size
    NEXT        64K    -- subsequent extent sizes (locally managed: ignored)
    MINEXTENTS  1      -- minimum number of extents
    MAXEXTENTS  UNLIMITED
    PCTINCREASE 0      -- no geometric growth (locally managed: ignored)
);
```

**PCTFREE tuning guide:**

| Workload | Recommended PCTFREE | Rationale |
|---|---|---|
| Insert-only (append) | 0–5 | Rows never updated; maximize block density |
| Mix of inserts + updates | 10–20 | Reserve space for row growth |
| Heavy updates (row growth) | 25–40 | Prevent row chaining/migration |
| Data warehouse (query only) | 0–5 | Maximize scan density |

### Oracle Compression

Oracle provides multiple compression tiers:

```sql
-- Basic Compression (all editions) — compresses during direct-path inserts only
CREATE TABLE SALES_ARCHIVE (
    sale_id     NUMBER,
    sale_date   DATE,
    amount      NUMBER(14,2)
)
COMPRESS BASIC
TABLESPACE dw_data;

-- Advanced Row Compression (Enterprise) — compresses all DML operations
CREATE TABLE ORDERS (
    order_id    NUMBER,
    customer_id NUMBER,
    order_date  DATE
)
ROW STORE COMPRESS ADVANCED
TABLESPACE users_data;

-- Hybrid Columnar Compression — REQUIRES Exadata, ZFS Storage Appliance, or ODA
-- Not available on standard server/SAN storage; will silently fall back to no compression
CREATE TABLE FACT_SALES (
    date_key    NUMBER(8),
    amount      NUMBER(14,2)
)
COMPRESS FOR QUERY HIGH
TABLESPACE dw_data;

-- In-Memory Compression (12c 12.1.0.2+) — in-memory columnar store
-- MEMCOMPRESS and PRIORITY must be combined in a single INMEMORY clause
ALTER TABLE FACT_SALES
    INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL;
```

### Parallel Query Configuration

For data warehouse tables, configure parallel DML and query:

```sql
-- Enable parallel query on a table (DW fact table example)
ALTER TABLE FACT_SALES PARALLEL 8;

-- Session-level parallel DML
ALTER SESSION ENABLE PARALLEL DML;

-- Hint-based parallel query
SELECT /*+ PARALLEL(f, 8) PARALLEL(d, 4) */
       d.year_number,
       SUM(f.gross_revenue) AS total_revenue
FROM   FACT_SALES    f
JOIN   DIM_DATE      d ON f.date_key = d.date_key
GROUP  BY d.year_number
ORDER  BY d.year_number;
```

---

## 9. Best Practices

- **Separate OLTP and DW schemas** into different tablespaces (and ideally different databases or PDBs) to isolate I/O profiles and backup strategies.
- **Use surrogate keys in dimension tables**, never business/natural keys as dimension primary keys. Natural keys change; surrogate keys never do.
- **Pre-aggregate judiciously.** Oracle materialized views can serve as pre-aggregated summaries that the query optimizer uses automatically (query rewrite).
- **Apply compression to data warehouse tables.** On Exadata (HCC), `COMPRESS FOR QUERY HIGH` achieves 10x or more compression on fact tables. On non-Exadata environments, use `ROW STORE COMPRESS ADVANCED` (Advanced Compression option required) which typically achieves 2:1 to 4:1 ratios for DW bulk loads.
- **Design for ETL patterns.** Include audit columns (`LOAD_DATE`, `SOURCE_SYSTEM`, `BATCH_ID`) in every DW table from day one — retrofitting them is expensive.
- **Avoid triggers on DW fact tables.** High-volume bulk loads with row-level triggers destroy performance. Use ETL logic in the load process instead.
- **Document the grain** of every fact table explicitly — the grain is the most precise level of detail the fact table records (e.g., "one row per order line item per day").

---

## 10. Common Mistakes and How to Avoid Them

### Mistake 1: Using OLTP Schema for Analytical Queries

Running analytical queries against a normalized OLTP schema produces massive join trees and full table scans. Maintain a separate dimensional model (star schema) for analytics.

### Mistake 2: Using Operational Primary Keys as Dimension Surrogate Keys

Business keys (order numbers, product SKUs, customer emails) change over time. Always generate a new surrogate key for dimension tables.

### Mistake 3: Missing SCD Strategy

Failing to decide on SCD type before go-live means historical changes are silently lost. Document and implement SCD type per dimension table before the first data load.

### Mistake 4: Not Partitioning Large Fact Tables

Fact tables exceeding 50–100 million rows without partitioning will suffer full table scans and extremely slow maintenance operations (archiving, deletes, statistics gathering).

```sql
-- Add range partitioning to an existing large table (Oracle 12.2+ online)
ALTER TABLE FACT_SALES MODIFY
    PARTITION BY RANGE (date_key) INTERVAL (10000) (
        PARTITION p_initial VALUES LESS THAN (20200101)
    )
    ONLINE;
```

### Mistake 5: Bitmap Indexes on OLTP Tables

Bitmap indexes lock at the bitmap segment level during DML — a single insert or update to a fact table can block dozens of concurrent transactions. Reserve bitmap indexes exclusively for data warehouse tables that receive bulk loads during maintenance windows.

### Mistake 6: Storing Calculated Fields Without Documentation

Storing pre-calculated values (gross profit, discounts) is sometimes valid for performance, but without documenting the formula, discrepancies between source and derived values are inevitable. Use virtual columns where possible, or document the formula as a column comment.

---

## Sources

- [Oracle Database 23ai Concepts Guide](https://docs.oracle.com/en/database/oracle/oracle-database/23/cncpt/)
- [Oracle Database 23ai SQL Language Reference — CREATE TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/CREATE-TABLE.html)
- [Oracle Database 23ai VLDB and Partitioning Guide](https://docs.oracle.com/en/database/oracle/oracle-database/23/vldbg/)
- [Oracle Advanced Compression FAQ (oracle.com)](https://www.oracle.com/a/ocom/docs/database/advanced-compression-faq.pdf)
- [Oracle Exadata Hybrid Columnar Compression (docs.oracle.com)](https://docs.oracle.com/en/engineered-systems/exadata-database-machine/sagug/exadata-hybrid-columnar-compression.html)
- [Oracle Database 12c R1 — In-Memory Column Store (oracle-base.com)](https://oracle-base.com/articles/12c/in-memory-column-store-12cr1)
- [Oracle Database 19c — Enabling Objects for In-Memory Population](https://docs.oracle.com/en/database/oracle/oracle-database/19/inmem/populating-objects-in-memory.html)
- [Oracle Database 23ai PL/SQL Packages and Types Reference — DBMS_SPACE](https://docs.oracle.com/en/database/oracle/oracle-database/23/arpls/DBMS_SPACE.html)
