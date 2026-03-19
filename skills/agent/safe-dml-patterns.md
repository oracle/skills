# Safe DML Patterns for Agents

When an AI agent generates and executes DML (INSERT, UPDATE, DELETE, MERGE), it must apply safety patterns to avoid accidental data loss, runaway operations, or unrecoverable changes. These patterns apply regardless of whether the agent acts autonomously or with human confirmation.

## Always-WHERE Clause Guards

Never generate UPDATE or DELETE without a WHERE clause. Validate before executing.

```sql
-- UNSAFE — agent must never generate this
UPDATE employees SET salary = salary * 1.1;
DELETE FROM audit_log;

-- SAFE — always scope to specific rows
UPDATE employees
SET    salary = salary * 1.1
WHERE  department_id = :dept_id
  AND  job_id = 'SA_REP';

DELETE FROM audit_log
WHERE  log_date < SYSDATE - 365
  AND  archived = 'Y';
```

**Agent rule**: If a user says "update all employees" or "delete old records" without specifying which rows — ask for clarification before generating SQL. See `intent-disambiguation.md`.

## Count Before Delete/Update

Always run a `SELECT COUNT(*)` first to confirm scope.

```sql
-- Step 1: Count affected rows
SELECT COUNT(*) AS rows_to_delete
FROM   audit_log
WHERE  log_date < SYSDATE - 365
  AND  archived = 'Y';

-- Step 2: If count is acceptable, execute
-- (present count to user or check against a threshold)
DELETE FROM audit_log
WHERE  log_date < SYSDATE - 365
  AND  archived = 'Y';

COMMIT;
```

## Dry Run via SAVEPOINT and ROLLBACK

Use SAVEPOINT to simulate a DML operation and inspect results before committing.

```sql
-- Dry run pattern
SAVEPOINT before_update;

UPDATE employees
SET    salary = salary * 1.1
WHERE  department_id = :dept_id;

-- Inspect what changed
SELECT employee_id, first_name, last_name, salary
FROM   employees
WHERE  department_id = :dept_id;
-- Present results to user for confirmation

-- If confirmed: COMMIT
-- If not confirmed: ROLLBACK TO SAVEPOINT before_update
ROLLBACK TO SAVEPOINT before_update;
```

## EXPLAIN PLAN Before Bulk Operations

Before running a DML that could affect millions of rows, check the execution plan.

```sql
-- Check plan for the DELETE predicate before executing
EXPLAIN PLAN FOR
DELETE FROM order_items
WHERE order_id IN (
  SELECT order_id FROM orders WHERE status = 'CANCELLED' AND order_date < SYSDATE - 730
);

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Look for: estimated rows, full table scan vs index scan
-- If FULL TABLE SCAN on a large table — add an index or narrow the predicate
```

## FETCH FIRST / ROWNUM Guards

Cap row counts on DML operations to prevent runaway bulk changes.

```sql
-- Delete in batches — safe for large tables
BEGIN
  LOOP
    DELETE FROM session_log
    WHERE  session_end < SYSDATE - 90
    FETCH  FIRST 10000 ROWS ONLY;
    EXIT WHEN SQL%ROWCOUNT = 0;
    COMMIT;
    -- Optional: DBMS_LOCK.SLEEP(0.1) to reduce redo log pressure
  END LOOP;
END;
/

-- UPDATE with row cap (for staged rollout)
UPDATE products
SET    status = 'ARCHIVED'
WHERE  last_sold_date < SYSDATE - 730
  AND  ROWNUM <= 1000;  -- process 1000 at a time
COMMIT;
```

## Autonomous Transaction Logging Before Destructive Operations

Log intent before executing a destructive operation so there is an audit trail.

```sql
CREATE TABLE agent_dml_log (
  log_id      NUMBER GENERATED ALWAYS AS IDENTITY,
  log_ts      TIMESTAMP DEFAULT SYSTIMESTAMP,
  operation   VARCHAR2(20),
  target_table VARCHAR2(128),
  predicate   VARCHAR2(4000),
  estimated_rows NUMBER,
  executed_by VARCHAR2(128) DEFAULT SYS_CONTEXT('USERENV','SESSION_USER')
);

-- Log before executing
CREATE OR REPLACE PROCEDURE log_agent_dml (
  p_operation    IN VARCHAR2,
  p_table        IN VARCHAR2,
  p_predicate    IN VARCHAR2,
  p_est_rows     IN NUMBER DEFAULT NULL
)
AS PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  INSERT INTO agent_dml_log (operation, target_table, predicate, estimated_rows)
  VALUES (p_operation, p_table, p_predicate, p_est_rows);
  COMMIT;
END;
/
```

## Safe INSERT with Duplicate Handling

```sql
-- Upsert pattern (safe for retry): use MERGE instead of INSERT
MERGE INTO target_table t
USING (SELECT :id AS id, :name AS name, :value AS val FROM DUAL) s
ON    (t.id = s.id)
WHEN MATCHED THEN
  UPDATE SET t.name = s.name, t.val = s.val
WHEN NOT MATCHED THEN
  INSERT (id, name, val) VALUES (s.id, s.name, s.val);

-- Or: INSERT with exception handling
BEGIN
  INSERT INTO my_table (id, name) VALUES (:id, :name);
EXCEPTION
  WHEN DUP_VAL_ON_INDEX THEN
    UPDATE my_table SET name = :name WHERE id = :id;
END;
/
```

## LOB Column Handling

CLOB, BLOB, and NCLOB columns require special care in agent-generated DML. Loading a full LOB column in a SELECT can transfer gigabytes of data, cause out-of-memory errors, or silently truncate values.

**Check size before reading**

```sql
-- Check LOB size before deciding how to read it
SELECT DBMS_LOB.GETLENGTH(content) AS lob_bytes
FROM   docs
WHERE  id = :doc_id;
-- If lob_bytes > 32767, do NOT select it into a VARCHAR2 variable
```

**Chunked reading with DBMS_LOB.SUBSTR**

```sql
-- Safe: read the first 4000 bytes of a CLOB
SELECT DBMS_LOB.SUBSTR(content, 4000, 1) AS content_preview
FROM   docs
WHERE  id = :doc_id;

-- Read a specific chunk (offset must be a character position, not byte)
SELECT DBMS_LOB.SUBSTR(content, 4000, :offset) AS chunk
FROM   docs
WHERE  id = :doc_id;
```

**Never SELECT a CLOB into VARCHAR2** — implicit conversion silently truncates at 32767 bytes with no error. Use DBMS_LOB.SUBSTR or a LOB locator instead.

**INSERT with LOB locator**

```sql
-- Step 1: insert a placeholder, get back the locator
INSERT INTO docs (id, content) VALUES (:id, EMPTY_CLOB()) RETURNING content INTO :lob_locator;

-- Step 2: write the actual content through the locator
DBMS_LOB.WRITE(:lob_locator, LENGTH(:content), 1, UTL_RAW.CAST_TO_RAW(:content));
COMMIT;
```

**UPDATE of a large CLOB**

```sql
-- Use RETURNING INTO to get the locator, then write through it
UPDATE docs
SET    content = EMPTY_CLOB()
WHERE  id = :doc_id
RETURNING content INTO :lob_locator;

DBMS_LOB.WRITE(:lob_locator, LENGTH(:new_content), 1, UTL_RAW.CAST_TO_RAW(:new_content));
COMMIT;
```

**Agent rule**: When an agent detects a CLOB/BLOB/NCLOB column in a query, warn the user that a full-table SELECT of LOB columns is expensive and can transfer very large amounts of data. Always suggest DBMS_LOB.GETLENGTH for size checks and DBMS_LOB.SUBSTR for previewing content.

## Deferred Constraint Handling

Some constraints are defined as DEFERRABLE, meaning validation is postponed until COMMIT rather than enforced at each DML statement. This is useful for bulk loads but requires explicit constraint management.

**Check if a constraint is deferrable**

```sql
SELECT constraint_name,
       constraint_type,
       deferred,        -- IMMEDIATE or DEFERRED (current session default)
       deferrable       -- DEFERRABLE or NOT DEFERRABLE
FROM   all_constraints
WHERE  table_name  = :table_name
  AND  owner       = :schema_name;
```

**Bulk load pattern with deferred constraints**

```sql
-- Step 1: defer validation for the duration of the transaction
SET CONSTRAINTS ALL DEFERRED;

-- Step 2: perform bulk DML (FK references may be temporarily violated)
INSERT INTO order_items (order_id, product_id, qty)
SELECT order_id, product_id, qty FROM staging_order_items;

INSERT INTO orders (order_id, customer_id, order_date)
SELECT order_id, customer_id, order_date FROM staging_orders;

-- Step 3: validate before committing — raises ORA-02291/ORA-02292 here if violated
SET CONSTRAINTS ALL IMMEDIATE;

-- Step 4: commit only if validation passed
COMMIT;
```

**Error handling for deferred validation**

```sql
BEGIN
  SET CONSTRAINTS ALL DEFERRED;

  -- ... bulk DML ...

  SET CONSTRAINTS ALL IMMEDIATE;  -- violation surfaces here, not at DML time
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    -- ORA-02291: integrity constraint violated - parent key not found
    -- ORA-02292: integrity constraint violated - child record found
    ROLLBACK;
    RAISE;
END;
/
```

**Agent rule**: When deferred validation fails, the error is raised at `SET CONSTRAINTS IMMEDIATE` or at `COMMIT` time — not at the DML statement that caused it. The offending row may not be obvious from the error message alone; query the staging data to find unmatched keys.

## UPDATE RETURNING INTO

`RETURNING INTO` captures values from updated rows in the same round-trip as the DML. Use it for audit logging, LOB locator retrieval, or chaining the result into a subsequent operation — without issuing a separate SELECT.

**Single-row RETURNING**

```sql
-- Capture the new salary and ROWID after update, no extra SELECT needed
DECLARE
  v_new_salary employees.salary%TYPE;
  v_rowid      ROWID;
BEGIN
  UPDATE employees
  SET    salary = salary * 1.1
  WHERE  employee_id = :emp_id
  RETURNING salary, ROWID INTO v_new_salary, v_rowid;

  -- v_rowid can be used in a subsequent operation on the same row
  COMMIT;
END;
/
```

**Bulk RETURNING with FORALL**

```sql
DECLARE
  TYPE id_list    IS TABLE OF employees.employee_id%TYPE;
  TYPE sal_list   IS TABLE OF employees.salary%TYPE;

  v_dept_ids  id_list  := id_list(:d1, :d2, :d3);
  v_emp_ids   id_list;
  v_salaries  sal_list;
BEGIN
  FORALL i IN 1 .. v_dept_ids.COUNT
    UPDATE employees
    SET    salary = salary * 1.1
    WHERE  department_id = v_dept_ids(i)
    RETURNING employee_id, salary BULK COLLECT INTO v_emp_ids, v_salaries;

  -- v_emp_ids and v_salaries now hold all affected rows for audit logging
  FORALL i IN 1 .. v_emp_ids.COUNT
    INSERT INTO salary_audit (employee_id, new_salary, changed_at)
    VALUES (v_emp_ids(i), v_salaries(i), SYSTIMESTAMP);

  COMMIT;
END;
/
```

**Returning ROWID for follow-on operations**

```sql
DECLARE
  v_rowid ROWID;
BEGIN
  UPDATE inventory
  SET    quantity = quantity - :qty
  WHERE  product_id = :pid
    AND  warehouse_id = :wid
  RETURNING ROWID INTO v_rowid;

  -- Use the ROWID to lock and verify the row without a full index scan
  SELECT quantity INTO :new_qty FROM inventory WHERE ROWID = v_rowid;
END;
/
```

## MERGE Edge Cases and Safety

MERGE is powerful but has several non-obvious behaviors that can lead to data corruption or irreversible changes if misused.

**Duplicate source rows cause double updates**

MERGE does not raise `DUP_VAL_ON_INDEX`. If the source dataset contains duplicate keys, Oracle may update the same target row more than once within a single MERGE, producing unpredictable results. Deduplicate the source with `DISTINCT` or aggregation before merging.

```sql
-- UNSAFE: source may have duplicate product_id rows
MERGE INTO products t
USING staging_products s
ON    (t.product_id = s.product_id)
WHEN MATCHED THEN
  UPDATE SET t.price = s.price;

-- SAFE: collapse duplicates in the USING clause first
MERGE INTO products t
USING (
  SELECT product_id,
         MAX(price) AS price   -- or MIN, or LAST_VALUE — choose deterministically
  FROM   staging_products
  GROUP BY product_id
) s
ON    (t.product_id = s.product_id)
WHEN MATCHED THEN
  UPDATE SET t.price = s.price;
```

**MERGE with DELETE extension**

The `WHEN MATCHED AND ... DELETE` clause deletes the matched row after updating it. This is irreversible once committed; there is no separate "rows deleted" signal.

```sql
-- DELETE extension: deletes rows where the condition is true AFTER the update
MERGE INTO archive_orders t
USING current_orders s
ON    (t.order_id = s.order_id)
WHEN MATCHED THEN
  UPDATE SET t.status = s.status
  DELETE WHERE t.status = 'PURGED';
-- WARNING: rows satisfying the DELETE condition are permanently removed
-- Use a dry-run SELECT to preview which rows will be deleted before executing
```

**MERGE into a view**

MERGE into a view is only supported when the view is key-preserving (each row in the view maps to exactly one row in the underlying base table). Merging into a non-key-preserving view raises `ORA-38106`.

```sql
-- Verify a view is key-preserving before using it as a MERGE target:
SELECT column_name, updatable, insertable, deletable
FROM   all_updatable_columns
WHERE  table_name = :view_name
  AND  owner      = :schema_name;
```

**Counting MERGE results**

`SQL%ROWCOUNT` after a MERGE reflects the total number of rows processed (inserts + updates + deletes combined). There is no built-in way to distinguish counts per operation without adding logging.

```sql
-- To distinguish insert vs update counts, use a logging trigger or
-- a RETURNING clause on the source with a flag column:
MERGE INTO products t
USING (
  SELECT product_id, price, 'N' AS was_matched FROM staging_products
) s
ON    (t.product_id = s.product_id)
WHEN MATCHED THEN
  UPDATE SET t.price = s.price
WHEN NOT MATCHED THEN
  INSERT (product_id, price) VALUES (s.product_id, s.price);

-- SQL%ROWCOUNT = inserts + updates (+ deletes if DELETE extension used)
DBMS_OUTPUT.PUT_LINE('Rows affected: ' || SQL%ROWCOUNT);
```

## Best Practices

- Always generate a `SELECT COUNT(*)` with the same WHERE clause before any DELETE or bulk UPDATE
- Use SAVEPOINT + ROLLBACK for interactive dry runs; always confirm with the user before COMMIT on destructive ops
- Batch large DML operations (10,000 rows per commit) to avoid excessive undo and lock contention
- Log every agent-initiated DML to an audit table before execution
- Never use `TRUNCATE` from an agent — use `DELETE` so it can be rolled back
- Refuse to generate `DELETE FROM <table>` without a WHERE clause; require explicit `DELETE FROM <table> WHERE 1=1` if the user truly wants all rows

## Common Mistakes

**Generating DELETE without WHERE** — even if a user says "clear the table", always confirm and use DELETE with an explicit `WHERE 1=1` so the agent generated an intentional, auditable statement.

**Committing inside a loop without error handling** — if the loop fails midway, partial data is committed. Use a SAVEPOINT before each batch and ROLLBACK TO SAVEPOINT on error.

**Not accounting for cascading deletes** — before deleting from a parent table, check `ALL_CONSTRAINTS` for child foreign keys. An unguarded delete can violate constraints or cascade unexpectedly.

## Oracle Version Notes (19c vs 26ai)

- **19c and later**: All patterns in this skill apply; SAVEPOINT, autonomous transactions, FETCH FIRST are all available in 19c+
- **26ai**: No new DML safety primitives; patterns are the same; agent integration via MCP server adds a natural confirmation layer

## See Also

- [Destructive Operation Guards](../agent/destructive-op-guards.md) — Pre-flight checks before DROP, TRUNCATE
- [Idempotency Patterns](../agent/idempotency-patterns.md) — Making agent-generated SQL retry-safe
- [Intent Disambiguation](../agent/intent-disambiguation.md) — When to ask for clarification before executing
- [ORA- Error Catalog](../agent/ora-error-catalog.md) — How to self-correct on DML errors

## Sources

- [Oracle Database 19c SQL Language Reference — SAVEPOINT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SAVEPOINT.html)
- [Oracle Database 19c PL/SQL Language Reference — Autonomous Transactions](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/autonomous-transactions.html)
