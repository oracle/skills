# Transaction Management in Oracle Database

## Overview

A transaction is a logical unit of work that consists of one or more SQL statements. Oracle's transaction model is one of the most robust in the relational database world, providing full ACID guarantees while enabling high concurrency through its multi-version concurrency control (MVCC) implementation.

Understanding how Oracle manages transactions is essential for writing correct, performant applications. Subtle mistakes — uncommitted transactions held too long, improper use of savepoints, or misunderstanding autonomous transactions — are among the most common sources of data corruption, lock contention, and deadlocks.

---

## ACID Properties in Oracle

### Atomicity

Every statement in a transaction either fully succeeds or fully fails. If a statement fails mid-execution (e.g., a unique constraint violation), Oracle automatically rolls back that single statement's changes via **statement-level rollback** — the transaction itself remains open with prior changes intact.

```sql
-- Statement-level rollback demonstration
INSERT INTO orders (order_id, customer_id) VALUES (1, 101);  -- succeeds
INSERT INTO orders (order_id, customer_id) VALUES (1, 102);  -- fails: duplicate PK
-- At this point, the first INSERT is still pending (transaction still open)
-- The second INSERT was rolled back automatically
COMMIT;  -- only the first INSERT is committed
```

### Consistency

Oracle enforces all integrity constraints at transaction commit time (by default). You can defer constraint checking within a transaction:

```sql
-- Defer constraint checking until commit
ALTER TABLE child_table
    MODIFY CONSTRAINT fk_parent DEFERRABLE INITIALLY DEFERRED;

-- Within a session, you can enable deferred checking
SET CONSTRAINTS ALL DEFERRED;

-- Now you can insert child before parent within the same transaction
INSERT INTO child_table (id, parent_id) VALUES (1, 999);
INSERT INTO parent_table (id) VALUES (999);
COMMIT;  -- constraints checked here; if parent doesn't exist, rollback
```

### Isolation

Oracle implements isolation through **MVCC (Multi-Version Concurrency Control)**. Readers do not block writers; writers do not block readers. Each query sees a consistent snapshot of data as of its start time (or the transaction's start time in serializable mode).

Oracle supports two standard isolation levels:

| Level | Description | Oracle Default? |
|---|---|---|
| `READ COMMITTED` | Each statement sees data committed before the statement began | Yes |
| `SERIALIZABLE` | Transaction sees data as of its start; errors if data changed since then | No (must set explicitly) |

```sql
-- Set serializable isolation for the current transaction
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Or for the session
ALTER SESSION SET ISOLATION_LEVEL = SERIALIZABLE;
```

Note: Oracle does **not** support `READ UNCOMMITTED` (dirty reads). This is by design — MVCC eliminates the need for it.

### Durability

Once `COMMIT` returns successfully, Oracle guarantees the data is written to the redo log on disk. The redo log writer (LGWR) must flush log entries to disk before COMMIT returns.

```sql
-- Force a synchronous redo write (default behavior)
COMMIT WRITE IMMEDIATE WAIT;

-- Asynchronous commit (higher throughput, slightly reduced durability window)
COMMIT WRITE IMMEDIATE NOWAIT;

-- Batch commit (best for bulk loads where some loss is acceptable)
COMMIT WRITE BATCH NOWAIT;
```

---

## Starting, Committing, and Rolling Back

Oracle starts a transaction implicitly with the first DML statement. There is no explicit `BEGIN TRANSACTION` in SQL*Plus or most tools (PL/SQL has `BEGIN ... END` blocks, but that is not a transaction boundary).

```sql
-- Transaction starts implicitly with first DML
INSERT INTO accounts (account_id, balance) VALUES (1001, 5000);
UPDATE accounts SET balance = balance - 500 WHERE account_id = 1001;
UPDATE accounts SET balance = balance + 500 WHERE account_id = 2001;

-- Commit makes changes permanent and releases all locks
COMMIT;

-- Rollback discards all changes since last commit and releases locks
ROLLBACK;
```

### Commit Best Practices

```sql
-- Good: commit after a logical unit of work
BEGIN
    -- Transfer funds atomically
    UPDATE accounts SET balance = balance - p_amount
    WHERE  account_id = p_from_account;

    UPDATE accounts SET balance = balance + p_amount
    WHERE  account_id = p_to_account;

    INSERT INTO transfer_log (from_acct, to_acct, amount, transfer_date)
    VALUES (p_from_account, p_to_account, p_amount, SYSDATE);

    COMMIT;  -- all three changes committed together
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;  -- all three changes discarded
        RAISE;
END;
```

---

## Savepoints

Savepoints allow partial rollbacks within a transaction. A `ROLLBACK TO savepoint_name` undoes all changes made after the savepoint was established, but does **not** end the transaction — prior changes and the savepoint itself remain.

```sql
INSERT INTO orders (order_id, status) VALUES (1001, 'PENDING');
SAVEPOINT after_order;

INSERT INTO order_items (order_id, item_id, qty) VALUES (1001, 'WIDGET', 5);
SAVEPOINT after_first_item;

INSERT INTO order_items (order_id, item_id, qty) VALUES (1001, 'GADGET', 2);
-- Suppose this item is out of stock, remove it but keep the order and first item
ROLLBACK TO after_first_item;

-- Transaction still open; order and first item are still pending
COMMIT;  -- commits order + first item only
```

### Savepoints in PL/SQL Error Handling

```plpgsql
DECLARE
    e_invalid_item EXCEPTION;
BEGIN
    INSERT INTO orders (order_id, customer_id, order_date)
    VALUES (seq_orders.NEXTVAL, 42, SYSDATE);

    SAVEPOINT order_created;

    FOR item IN (SELECT * FROM staging_order_items WHERE session_id = :sid) LOOP
        BEGIN
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (item.order_id, item.product_id, item.quantity,
                    get_current_price(item.product_id));
        EXCEPTION
            WHEN OTHERS THEN
                -- Skip bad items, keep good ones
                ROLLBACK TO order_created;
                log_error('Failed to insert item: ' || item.product_id);
        END;
    END LOOP;

    COMMIT;
END;
```

**Important:** `ROLLBACK TO savepoint` releases row locks acquired after the savepoint, but does NOT release locks acquired before it.

---

## Autonomous Transactions

An **autonomous transaction** is an independent transaction spawned from within a calling transaction. It has its own commit/rollback scope — completely independent of the parent transaction. Changes made by an autonomous transaction are visible to other sessions immediately after its commit, even if the calling transaction has not committed.

Enable with the `PRAGMA AUTONOMOUS_TRANSACTION` compiler directive.

### Primary Use Cases

1. **Error logging** — record errors even when the calling transaction rolls back
2. **Audit trails** — insert audit records that must survive a rollback
3. **Sequence number generation** — in rare cases where gaps must be tracked

```sql
-- Audit/logging procedure using autonomous transaction
CREATE OR REPLACE PROCEDURE log_audit_event (
    p_action   IN VARCHAR2,
    p_table    IN VARCHAR2,
    p_row_id   IN VARCHAR2,
    p_details  IN VARCHAR2
) AS
    PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
    INSERT INTO audit_log (log_id, action, table_name, row_id, details, log_time, logged_by)
    VALUES (seq_audit.NEXTVAL, p_action, p_table, p_row_id, p_details, SYSTIMESTAMP, USER);

    COMMIT;  -- REQUIRED: autonomous transaction must be explicitly committed or rolled back
END log_audit_event;
/

-- Usage: even if the outer transaction rolls back, the audit record persists
BEGIN
    UPDATE sensitive_data SET value = 'changed' WHERE id = 42;
    log_audit_event('UPDATE', 'SENSITIVE_DATA', '42', 'Value changed');
    -- If we rollback here, log_audit_event's INSERT is already committed
    ROLLBACK;  -- sensitive_data change is undone, but audit record remains
END;
```

### Error Logging Table Pattern

```sql
CREATE TABLE error_log (
    log_id    NUMBER GENERATED ALWAYS AS IDENTITY,
    error_msg VARCHAR2(4000),
    error_code NUMBER,
    program   VARCHAR2(100),
    log_time  TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT pk_error_log PRIMARY KEY (log_id)
);

CREATE OR REPLACE PROCEDURE log_error (
    p_msg     IN VARCHAR2,
    p_code    IN NUMBER DEFAULT SQLCODE,
    p_program IN VARCHAR2 DEFAULT $$PLSQL_UNIT
) AS
    PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
    INSERT INTO error_log (error_msg, error_code, program)
    VALUES (SUBSTR(p_msg, 1, 4000), p_code, p_program);
    COMMIT;
END log_error;
```

### Autonomous Transaction Gotchas

```sql
-- WRONG: Autonomous transaction reading uncommitted data from parent
-- Parent inserts a row but hasn't committed
-- Autonomous transaction CANNOT see parent's uncommitted changes
CREATE OR REPLACE PROCEDURE bad_autonomous AS
    PRAGMA AUTONOMOUS_TRANSACTION;
    v_count NUMBER;
BEGIN
    -- This reads the COMMITTED state of the table, not parent's pending inserts
    SELECT COUNT(*) INTO v_count FROM orders WHERE status = 'PENDING';
    COMMIT;
END;
```

---

## Distributed Transactions (XA)

Oracle supports the X/Open XA protocol for distributed transactions spanning multiple databases or resource managers (databases + message queues).

### Two-Phase Commit (2PC)

Oracle acts as either a **coordinator** or a **participant** in 2PC:

```sql
-- Phase 1: Prepare (coordinator asks all participants to prepare)
-- Each participant writes prepared state to its redo log

-- Phase 2: Commit or Rollback (coordinator decision)
-- All participants commit or all rollback

-- Monitoring in-doubt distributed transactions
SELECT local_tran_id, global_tran_id, state, mixed, advice, tran_comment
FROM   dba_2pc_pending;

-- Force commit of an in-doubt transaction (after network recovery)
COMMIT FORCE 'local_tran_id';

-- Force rollback of an in-doubt transaction
ROLLBACK FORCE 'local_tran_id';
```

### Database Links in Transactions

```sql
-- Transactions automatically become distributed when they touch a DB link
UPDATE orders@remote_db SET status = 'SHIPPED' WHERE order_id = :id;
UPDATE local_inventory SET qty = qty - 1 WHERE product_id = :prod;
COMMIT;  -- Oracle automatically performs 2PC with remote_db
```

### JDBC XA Example

```java
import javax.sql.XADataSource;
import javax.transaction.xa.XAResource;
import javax.transaction.xa.Xid;

// XA with JTA transaction manager (e.g., Atomikos, Bitronix, Narayana)
XAConnection xaConn = xaDataSource.getXAConnection("user", "password");
XAResource xaResource = xaConn.getXAResource();

Xid xid = createXid();  // application-defined transaction ID

xaResource.start(xid, XAResource.TMNOFLAGS);
try (Connection conn = xaConn.getConnection()) {
    conn.prepareStatement("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
        .executeUpdate();
}
xaResource.end(xid, XAResource.TMSUCCESS);

int prepareResult = xaResource.prepare(xid);
if (prepareResult == XAResource.XA_OK) {
    xaResource.commit(xid, false);
}
```

---

## Avoiding Long-Running Transactions

Long-running transactions are the most common source of performance problems in Oracle applications. They:

- Hold row locks that block other sessions
- Generate undo data that must be retained until the transaction completes
- Can cause `ORA-01555: snapshot too old` for other long-running queries
- Consume undo tablespace, potentially causing ORA-30036

### Detecting Long-Running Transactions

```sql
-- Find sessions with open transactions
SELECT s.sid, s.serial#, s.username, s.status, s.program,
       t.start_time, t.used_ublk AS undo_blocks_used,
       ROUND((SYSDATE - TO_DATE(t.start_time,'MM/DD/YY HH24:MI:SS')) * 24 * 60, 1)
           AS minutes_open
FROM   v$session s
JOIN   v$transaction t ON s.taddr = t.addr
ORDER  BY minutes_open DESC;

-- Check undo usage
SELECT usn, xacts, rssize/1024/1024 AS mb_used, status
FROM   v$rollstat rs
JOIN   v$rollname rn ON rs.usn = rn.usn
ORDER  BY mb_used DESC;
```

### Batch Processing Pattern — Commit in Batches

```plpgsql
-- WRONG: one commit for millions of rows
BEGIN
    FOR r IN (SELECT id FROM large_table WHERE needs_processing = 'Y') LOOP
        UPDATE large_table SET processed_date = SYSDATE WHERE id = r.id;
    END LOOP;
    COMMIT;  -- holds all locks for the entire loop duration
END;

-- RIGHT: commit every N rows
DECLARE
    v_batch_size CONSTANT PLS_INTEGER := 1000;
    v_count      PLS_INTEGER := 0;
BEGIN
    FOR r IN (SELECT id FROM large_table WHERE needs_processing = 'Y') LOOP
        UPDATE large_table SET processed_date = SYSDATE WHERE id = r.id;
        v_count := v_count + 1;

        IF MOD(v_count, v_batch_size) = 0 THEN
            COMMIT;
        END IF;
    END LOOP;
    COMMIT;  -- final batch
END;
```

### Using FORALL for Bulk DML

```plpgsql
DECLARE
    TYPE id_array IS TABLE OF NUMBER;
    v_ids   id_array;
    CURSOR c_pending IS
        SELECT id FROM large_table WHERE needs_processing = 'Y';
BEGIN
    OPEN c_pending;
    LOOP
        FETCH c_pending BULK COLLECT INTO v_ids LIMIT 5000;
        EXIT WHEN v_ids.COUNT = 0;

        FORALL i IN 1..v_ids.COUNT
            UPDATE large_table
            SET    processed_date = SYSDATE
            WHERE  id = v_ids(i);

        COMMIT;
    END LOOP;
    CLOSE c_pending;
END;
```

---

## Best Practices

- **Keep transactions as short as possible.** Do all computation before the transaction, execute DML, commit immediately.
- **Never wait for user input inside a transaction.** The user might walk away, leaving locks held.
- **Always handle exceptions and call ROLLBACK.** An unhandled exception in application code that disconnects without rollback leaves the transaction open until the session is killed.
- **Use `COMMIT WRITE BATCH NOWAIT` only for bulk loads** where you understand the durability trade-off.
- **Prefer `FORALL` and bulk operations** over row-by-row DML to reduce commit frequency while keeping transactions short.
- **Test with `SERIALIZABLE` isolation** if your application logic depends on consistent reads across multiple statements; do not assume `READ COMMITTED` provides snapshot consistency at the transaction level.
- **Never use `PRAGMA AUTONOMOUS_TRANSACTION` to work around locking issues.** It creates invisible data dependencies that are hard to debug.

---

## Common Mistakes

### Mistake 1: Swallowing Exceptions Without Rollback

```plpgsql
-- WRONG: exception is caught but transaction is not rolled back
BEGIN
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;
    UPDATE accounts SET balance = balance + 500 WHERE id = 2;
EXCEPTION
    WHEN OTHERS THEN
        -- Silent swallow — first UPDATE may be committed elsewhere
        NULL;
END;

-- RIGHT
BEGIN
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;
    UPDATE accounts SET balance = balance + 500 WHERE id = 2;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;  -- re-raise so the caller knows
END;
```

### Mistake 2: DDL in the Middle of a Transaction

In Oracle, any DDL statement (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`) issues an implicit COMMIT before and after it executes. This silently commits any pending DML.

```sql
INSERT INTO temp_data VALUES (1, 'test');  -- DML
CREATE INDEX idx_temp ON temp_data(id);    -- IMPLICIT COMMIT before this!
ROLLBACK;  -- too late; the INSERT was already committed
```

### Mistake 3: Relying on Autocommit in JDBC

JDBC connections have `autoCommit=true` by default. Every single statement is immediately committed. This is almost never what you want for OLTP.

```java
// Disable autocommit immediately after obtaining connection
connection.setAutoCommit(false);
// ... perform DML ...
connection.commit();  // or connection.rollback() in catch block
```

### Mistake 4: Misunderstanding Statement-Level vs. Transaction-Level Rollback

When a DML statement fails with an exception, only that statement is rolled back. The transaction remains open. If you catch the exception and do nothing, the prior statements in the transaction are still uncommitted and their locks are still held.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c Concepts (CNCPT) — Transactions](https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/)
- [Oracle Database 19c Application Developer's Guide (ADFNS)](https://docs.oracle.com/en/database/oracle/oracle-database/19/adfns/)
- [Oracle Database 19c PL/SQL Language Reference — Transaction Processing](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/)
