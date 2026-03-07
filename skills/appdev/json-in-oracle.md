# JSON in Oracle Database

## Overview

Oracle has evolved from treating JSON as a string stored in VARCHAR2 or CLOB columns (12c) to providing a dedicated native JSON data type with deep query integration, indexing, and schema enforcement (21c+). In Oracle 23c, JSON Relational Duality Views represent a paradigm shift — allowing the same data to be accessed and modified as both JSON documents and relational rows simultaneously.

This guide covers the full spectrum: storage options, the complete SQL/JSON function set, indexing strategies, and the modern JSON Duality View architecture.

---

## JSON Storage Options

### Pre-21c: VARCHAR2 / CLOB with IS JSON Constraint

```sql
-- VARCHAR2 for small JSON documents (≤32767 bytes)
CREATE TABLE product_catalog (
    product_id   NUMBER PRIMARY KEY,
    product_name VARCHAR2(200) NOT NULL,
    attributes   VARCHAR2(4000)
        CONSTRAINT chk_attributes_json CHECK (attributes IS JSON)
);

-- CLOB for large documents
CREATE TABLE event_log (
    event_id     NUMBER PRIMARY KEY,
    event_data   CLOB
        CONSTRAINT chk_event_json CHECK (event_data IS JSON)
);

-- LAX vs STRICT JSON validation
-- LAX (default): allows duplicate keys, trailing commas, unquoted keys
-- STRICT: enforces strict JSON syntax
CREATE TABLE strict_json_table (
    id   NUMBER PRIMARY KEY,
    data CLOB CONSTRAINT chk_strict CHECK (data IS JSON STRICT)
);
```

### 21c+: Native JSON Data Type

The native `JSON` type stores JSON in a compact binary OSON (Oracle Serialized Object Notation) format. Benefits over CLOB/VARCHAR2:
- No need to parse JSON on every access
- Smaller storage footprint
- Faster query execution
- Automatic structural validation

```sql
-- Native JSON type (21c+)
CREATE TABLE orders (
    order_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id  NUMBER NOT NULL,
    order_data   JSON NOT NULL,
    created_at   TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Insert JSON document
INSERT INTO orders (customer_id, order_data)
VALUES (42, JSON('{"status": "pending",
                   "items": [
                     {"sku": "WGT-001", "qty": 2, "price": 29.99},
                     {"sku": "GAD-007", "qty": 1, "price": 149.99}
                   ],
                   "shipping": {"method": "express", "address": "123 Main St"}}'));

-- Or insert as a string — Oracle parses and stores as binary JSON
INSERT INTO orders (customer_id, order_data)
VALUES (43, '{"status": "shipped", "items": [{"sku": "WGT-002", "qty": 3, "price": 19.99}]}');
```

---

## Dot Notation Access (Simplified SQL/JSON)

Oracle's dot notation provides a concise, readable way to navigate JSON paths. It works on both VARCHAR2/CLOB columns (with IS JSON constraint) and native JSON columns.

```sql
-- Simple dot notation
SELECT o.order_data.status,
       o.order_data.shipping.method,
       o.order_data.shipping.address
FROM   orders o
WHERE  o.order_data.status = 'pending';

-- Array element access (zero-based index)
SELECT o.order_data.items[0].sku    AS first_item_sku,
       o.order_data.items[0].price  AS first_item_price
FROM   orders o;

-- Dot notation returns VARCHAR2 by default; use type suffix for numbers
SELECT o.order_data.items[0].price.numberOnly() AS price_number
FROM   orders o;
```

---

## JSON_VALUE: Extract Scalar Values

`JSON_VALUE` extracts a single scalar value from a JSON document. It returns `NULL` by default if the path does not exist or if the value is not scalar.

```sql
-- Basic JSON_VALUE
SELECT JSON_VALUE(order_data, '$.status')             AS status,
       JSON_VALUE(order_data, '$.shipping.method')    AS ship_method,
       JSON_VALUE(order_data, '$.items[0].sku')       AS first_sku
FROM   orders;

-- With RETURNING clause for type conversion
SELECT JSON_VALUE(order_data, '$.items[0].price' RETURNING NUMBER(10,2)) AS price,
       JSON_VALUE(order_data, '$.created_ts'     RETURNING TIMESTAMP)    AS ts
FROM   orders;

-- Error handling clauses
SELECT JSON_VALUE(order_data, '$.missing_field'
           DEFAULT 'N/A' ON EMPTY      -- when path not found
           NULL ON ERROR)              -- on malformed JSON or wrong type
AS   safe_value
FROM orders;

-- NULL ON EMPTY | ERROR ON EMPTY | DEFAULT value ON EMPTY
-- NULL ON ERROR | ERROR ON ERROR | DEFAULT value ON ERROR

-- In WHERE clause
SELECT order_id, customer_id
FROM   orders
WHERE  JSON_VALUE(order_data, '$.status') = 'pending'
  AND  JSON_VALUE(order_data, '$.shipping.method' RETURNING VARCHAR2) = 'express';
```

---

## JSON_QUERY: Extract JSON Fragments

`JSON_QUERY` returns a JSON object or array (not a scalar). Use it when the target value is itself a JSON structure.

```sql
-- Extract the entire shipping object
SELECT JSON_QUERY(order_data, '$.shipping')       AS shipping_json,
       JSON_QUERY(order_data, '$.items')          AS items_array,
       JSON_QUERY(order_data, '$.items[0]')       AS first_item
FROM   orders;

-- WITH WRAPPER: wrap result in array brackets
-- Needed when path returns multiple items
SELECT JSON_QUERY(order_data, '$.items[*].sku' WITH ARRAY WRAPPER) AS all_skus
FROM   orders;

-- WITH CONDITIONAL WRAPPER: wrap only if result is not already an array
SELECT JSON_QUERY(order_data, '$.shipping' WITH CONDITIONAL WRAPPER) AS shipping
FROM   orders;

-- Pretty printing
SELECT JSON_QUERY(order_data, '$' RETURNING VARCHAR2(4000) PRETTY) AS pretty_json
FROM   orders WHERE order_id = 1;
```

---

## JSON_EXISTS: Test Path Existence

`JSON_EXISTS` returns TRUE/FALSE (used in WHERE clauses) to test whether a path exists or matches a condition.

```sql
-- Test for path existence
SELECT order_id FROM orders
WHERE  JSON_EXISTS(order_data, '$.shipping.tracking_number');

-- Test with filter condition (JSON_EXISTS predicate)
SELECT order_id FROM orders
WHERE  JSON_EXISTS(order_data, '$.items[*]?(@.price > 100)');

-- Multiple conditions
SELECT order_id FROM orders
WHERE  JSON_EXISTS(order_data, '$.items[*]?(@.sku == "WGT-001" && @.qty >= 2)');

-- Check for null values
SELECT order_id FROM orders
WHERE  JSON_EXISTS(order_data, '$.status?(@ != null)');
```

---

## JSON_TABLE: Shred JSON into Relational Rows

`JSON_TABLE` is the most powerful JSON function — it converts a JSON document (or array) into a virtual relational table that can be joined, filtered, and aggregated.

```sql
-- Expand order items into individual rows
SELECT o.order_id, o.customer_id, jt.sku, jt.qty, jt.price,
       jt.qty * jt.price AS line_total
FROM   orders o,
       JSON_TABLE(o.order_data, '$.items[*]'
           COLUMNS (
               sku    VARCHAR2(20)    PATH '$.sku',
               qty    NUMBER          PATH '$.qty',
               price  NUMBER(10,2)    PATH '$.price'
           )
       ) jt;

-- Nested JSON_TABLE for hierarchical data
SELECT o.order_id, jt.method, jt.street, jt.city
FROM   orders o,
       JSON_TABLE(o.order_data, '$'
           COLUMNS (
               method  VARCHAR2(20)  PATH '$.shipping.method',
               NESTED PATH '$.shipping.address[*]' COLUMNS (
                   street  VARCHAR2(100)  PATH '$.street',
                   city    VARCHAR2(50)   PATH '$.city',
                   zip     VARCHAR2(10)   PATH '$.zip'
               )
           )
       ) jt;

-- JSON_TABLE with error handling
SELECT customer_id, jt.item_sku, jt.item_price
FROM   orders,
       JSON_TABLE(order_data, '$.items[*]'
           ERROR ON ERROR  -- raise error on malformed JSON
           COLUMNS (
               item_sku    VARCHAR2(20)   PATH '$.sku'   NULL ON ERROR,
               item_price  NUMBER(10,2)   PATH '$.price' DEFAULT 0 ON ERROR
           )
       ) jt;

-- Aggregate over shredded items
SELECT o.order_id,
       COUNT(jt.sku)       AS item_count,
       SUM(jt.qty * jt.price) AS order_total
FROM   orders o,
       JSON_TABLE(o.order_data, '$.items[*]'
           COLUMNS (
               sku    VARCHAR2(20)  PATH '$.sku',
               qty    NUMBER        PATH '$.qty',
               price  NUMBER(10,2)  PATH '$.price'
           )
       ) jt
GROUP  BY o.order_id;
```

---

## JSON Modification Functions

```sql
-- JSON_MERGEPATCH: merge/update a JSON document (RFC 7396)
UPDATE orders
SET    order_data = JSON_MERGEPATCH(order_data,
           '{"status": "shipped", "shipped_at": "2025-01-15T10:30:00Z"}')
WHERE  order_id = 1;

-- JSON_TRANSFORM (21c+): more powerful surgical updates
UPDATE orders
SET    order_data = JSON_TRANSFORM(order_data,
           SET    '$.status'      = 'delivered',
           SET    '$.delivered_at' = SYSTIMESTAMP FORMAT JSON,
           APPEND '$.tags'        = 'completed'
       )
WHERE  order_id = 1;

-- Remove a key
UPDATE orders
SET    order_data = JSON_TRANSFORM(order_data,
           REMOVE '$.temp_processing_notes')
WHERE  order_id = 1;
```

---

## JSON Indexes

Proper indexing of JSON data is critical for performance. Oracle provides several options.

### Functional Index on JSON_VALUE

```sql
-- Index on a specific JSON scalar path (most selective, most efficient)
CREATE INDEX idx_order_status
    ON orders (JSON_VALUE(order_data, '$.status' RETURNING VARCHAR2(20)));

CREATE INDEX idx_order_ship_method
    ON orders (JSON_VALUE(order_data, '$.shipping.method' RETURNING VARCHAR2(20)));

-- These indexes are used automatically by the optimizer
SELECT order_id FROM orders
WHERE  JSON_VALUE(order_data, '$.status' RETURNING VARCHAR2(20)) = 'pending';
-- Or with dot notation
SELECT order_id FROM orders WHERE order_data.status = 'pending';
```

### JSON Search Index (Oracle Text Full-Text)

For flexible, multi-path searching across the entire JSON document:

```sql
-- Creates a full-text index over all JSON content
CREATE SEARCH INDEX idx_order_json_search ON orders (order_data)
    FOR JSON;

-- Use with JSON_EXISTS
SELECT order_id FROM orders
WHERE  JSON_EXISTS(order_data, '$.items[*]?(@.sku == "WGT-001")');

-- Synchronize the search index (if not SYNC ON COMMIT)
EXEC CTX_DDL.SYNC_INDEX('idx_order_json_search');
```

### Composite JSON + Relational Index

```sql
-- Compound index for common query pattern
CREATE INDEX idx_cust_status ON orders (
    customer_id,
    JSON_VALUE(order_data, '$.status' RETURNING VARCHAR2(20))
);

-- Covers: WHERE customer_id = ? AND order_data.status = ?
```

---

## JSON Duality Views (23c)

JSON Relational Duality Views are one of Oracle 23c's flagship features. They expose relational table data as JSON documents that can be fully queried and modified through either a JSON or SQL interface. This eliminates the impedance mismatch between application objects and database rows.

### Creating a Duality View

```sql
-- Underlying relational tables
CREATE TABLE customers_23 (
    customer_id  NUMBER PRIMARY KEY,
    name         VARCHAR2(100),
    email        VARCHAR2(200)
);

CREATE TABLE orders_23 (
    order_id     NUMBER PRIMARY KEY,
    customer_id  NUMBER REFERENCES customers_23(customer_id),
    status       VARCHAR2(20),
    total_amount NUMBER(12,2)
);

CREATE TABLE order_items_23 (
    item_id     NUMBER PRIMARY KEY,
    order_id    NUMBER REFERENCES orders_23(order_id),
    sku         VARCHAR2(50),
    quantity    NUMBER,
    unit_price  NUMBER(10,2)
);

-- JSON Duality View: one JSON document per customer with nested orders
CREATE OR REPLACE JSON RELATIONAL DUALITY VIEW customer_orders_dv AS
    SELECT JSON {
        'customerId'  : c.customer_id,
        'name'        : c.name,
        'email'       : c.email,
        'orders'      : [
            SELECT JSON {
                'orderId'     : o.order_id,
                'status'      : o.status,
                'totalAmount' : o.total_amount,
                'items'       : [
                    SELECT JSON {
                        'sku'       : i.sku,
                        'quantity'  : i.quantity,
                        'unitPrice' : i.unit_price
                    }
                    FROM order_items_23 i WITH (INSERT UPDATE DELETE)
                    WHERE i.order_id = o.order_id
                ]
            }
            FROM orders_23 o WITH (INSERT UPDATE DELETE)
            WHERE o.customer_id = c.customer_id
        ]
    }
    FROM customers_23 c WITH (INSERT UPDATE DELETE);

-- Query the duality view as JSON
SELECT * FROM customer_orders_dv WHERE json_value(data, '$.customerId') = 42;

-- Insert through the duality view (automatically inserts into all tables)
INSERT INTO customer_orders_dv VALUES (
    '{"customerId": 100,
      "name": "Acme Corp",
      "email": "acme@example.com",
      "orders": [
        {"orderId": 5001, "status": "pending", "totalAmount": 599.98,
         "items": [{"sku": "WGT-001", "quantity": 2, "unitPrice": 299.99}]}
      ]}'
);
-- This inserts into customers_23, orders_23, AND order_items_23 atomically
```

---

## Storing vs. Querying JSON: Design Considerations

### When to Store JSON

- **Variable structure**: attributes differ per product category, event type, or customer segment
- **Schemaless extension**: allow adding fields without schema migrations
- **Document-oriented data**: configuration objects, API payloads, serialized objects
- **Nested/array data**: line items, tags, audit trails with natural JSON structure

### When to Normalize Instead

- **Frequently queried scalar fields**: if you always query `$.status`, store it as a column
- **Referential integrity needed**: foreign keys require relational columns
- **Aggregation and reporting**: GROUP BY, SUM, AVG on relational columns is faster and clearer
- **Index selectivity**: B-tree indexes on `NUMBER` columns vastly outperform JSON path indexes

### Hybrid Approach (Most Common)

```sql
-- Store frequently-queried fields as relational columns
-- Store variable/extensible attributes as JSON
CREATE TABLE products (
    product_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku           VARCHAR2(50)  NOT NULL UNIQUE,
    product_name  VARCHAR2(200) NOT NULL,
    category_id   NUMBER        NOT NULL,  -- relational FK
    price         NUMBER(10,2)  NOT NULL,  -- indexed, aggregated
    status        VARCHAR2(20)  DEFAULT 'ACTIVE',  -- frequently filtered
    attributes    JSON,          -- variable: color, size, material, etc.
    created_at    TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Relational indexes on hot columns
CREATE INDEX idx_products_category ON products(category_id, status, price);

-- Functional index on common JSON attribute
CREATE INDEX idx_products_color
    ON products (JSON_VALUE(attributes, '$.color' RETURNING VARCHAR2(50)));
```

---

## Best Practices

- **Use native JSON type (21c+)** for new schemas. The binary OSON format is significantly faster than CLOB-based storage.
- **Add IS JSON constraints** on VARCHAR2/CLOB columns in pre-21c databases to validate at insert time.
- **Create functional indexes on frequently-queried JSON paths** rather than full-text search indexes for single-path queries.
- **Use JSON_TABLE in FROM clause** rather than JSON_VALUE in SELECT for array expansion — it's set-based and optimizable.
- **Store scalar values that appear in WHERE clauses as relational columns** with standard indexes. JSON path queries, even with indexes, cannot match the efficiency of a B-tree on a typed column.
- **Use JSON_MERGEPATCH for document updates** rather than fetching, parsing, modifying, and re-inserting in application code.
- **Enable `VALIDATE` on JSON Duality Views** to enforce schemas on the JSON side.

---

## Common Mistakes

### Mistake 1: Using VARCHAR2 for Large JSON

VARCHAR2 is limited to 32,767 bytes in PL/SQL and 4,000 bytes in SQL (unless `MAX_STRING_SIZE=EXTENDED`). Use CLOB or native JSON for documents that could exceed this.

### Mistake 2: No Index on Queried JSON Paths

```sql
-- This is a full table scan on every row's JSON
SELECT * FROM orders WHERE JSON_VALUE(order_data, '$.status') = 'pending';

-- Fix: add a functional index
CREATE INDEX idx_order_status ON orders(JSON_VALUE(order_data, '$.status' RETURNING VARCHAR2(20)));
```

### Mistake 3: Parsing JSON in Application Code When SQL/JSON Functions Suffice

Do not fetch the entire JSON document to application code, parse it, extract one field, and return. Use `JSON_VALUE` in the SQL query.

### Mistake 4: Using JSON_QUERY When JSON_VALUE Is Appropriate

`JSON_QUERY` returns a JSON string, even for scalars. For scalar extraction, always use `JSON_VALUE` to get a typed Oracle value.

### Mistake 5: Forgetting Type Conversions in JSON_VALUE

`JSON_VALUE` returns VARCHAR2 by default. Without `RETURNING NUMBER`, numeric comparisons and arithmetic will be wrong or throw implicit conversion errors.

```sql
-- WRONG: comparing string to number
WHERE JSON_VALUE(order_data, '$.total') > 100  -- string comparison!

-- RIGHT
WHERE JSON_VALUE(order_data, '$.total' RETURNING NUMBER) > 100
```

---

## Sources

- [Oracle Database 19c JSON Developer's Guide (ADJSN)](https://docs.oracle.com/en/database/oracle/oracle-database/19/adjsn/)
- [Oracle Database 19c SQL Language Reference — JSON Functions](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
- [Oracle Database 21c — JSON Data Type](https://docs.oracle.com/en/database/oracle/oracle-database/21/adjsn/)
- [Oracle Database 23c — JSON Relational Duality Views](https://docs.oracle.com/en/database/oracle/oracle-database/23/jsnvu/)
