# Locking and Concurrency in Oracle Database

## Overview

Oracle's concurrency model is fundamentally different from many other databases. Its Multi-Version Concurrency Control (MVCC) implementation means that **readers never block writers and writers never block readers**. This eliminates a huge class of contention problems that plague other databases, but Oracle still uses locks for write-write conflicts and explicit locking scenarios.

Understanding Oracle's locking architecture is essential for writing applications that scale under concurrent load without deadlocks or excessive contention.

---

## Multi-Version Concurrency Control (MVCC)

### How MVCC Works in Oracle

When a row is modified, Oracle does not overwrite the old data in place. Instead:

1. The new row version is written to the data block
2. The old row version is stored in the **undo tablespace** (rollback segments)
3. Readers needing the old version reconstruct it from undo data on demand

This creates a "time-travel" capability: every read sees a **consistent snapshot** of the database at the query's start SCN (System Change Number), regardless of concurrent writers.

```sql
-- Check current SCN
SELECT current_scn FROM v$database;

-- Query data as it existed at a specific SCN (Flashback Query)
SELECT * FROM orders AS OF SCN 12345678;

-- Query as of a timestamp
SELECT * FROM orders AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '5' MINUTE);
```

### Read Consistency Guarantees

| Scenario | Oracle Behavior |
|---|---|
| Reader vs. Writer (same rows) | No blocking; reader sees pre-change data via undo |
| Writer vs. Reader (same rows) | No blocking; writer proceeds, reader uses undo |
| Writer vs. Writer (same row) | Writer 2 blocks until Writer 1 commits or rolls back |
| Long-running read (undo recycled) | `ORA-01555: snapshot too old` |

### ORA-01555: Snapshot Too Old

This error occurs when Oracle cannot reconstruct an old row version because the undo data has been overwritten (undo retention exceeded). Prevention strategies:

```sql
-- Check current undo retention setting
SHOW PARAMETER undo_retention;

-- Increase undo retention (seconds)
ALTER SYSTEM SET UNDO_RETENTION = 3600;  -- 1 hour

-- Check undo advisor recommendation
SELECT d.undoblks, d.maxquerylen, d.tuned_undoretention
FROM   v$undostat d
WHERE  rownum <= 1;

-- Enable undo retention guarantee (prevents undo from being overwritten)
ALTER TABLESPACE undotbs1 RETENTION GUARANTEE;
```

---

## Row-Level Locking

Oracle acquires row-level locks automatically on any row that is `INSERT`ed, `UPDATE`d, or `DELETE`d. These locks are:

- **Exclusive (X mode)**: held by the modifying session
- **Released only at COMMIT or ROLLBACK**
- Stored in the data block itself (no lock table), making them essentially free regardless of how many rows are locked

```sql
-- View current row locks
SELECT o.object_name, l.session_id, l.locked_mode,
       s.username, s.status, s.sql_id
FROM   v$locked_object l
JOIN   dba_objects o ON l.object_id = o.object_id
JOIN   v$session s ON l.session_id = s.sid
ORDER  BY o.object_name;
```

### Lock Modes

| Mode Code | Name | Description |
|---|---|---|
| 0 | None | |
| 1 | Null (N) | Sub-shared; almost no restriction |
| 2 | Row Share (SS) | SELECT FOR UPDATE, or DML in progress |
| 3 | Row Exclusive (SX) | DML in progress on table |
| 4 | Share (S) | `LOCK TABLE ... IN SHARE MODE` |
| 5 | Share Row Exclusive (SSX) | |
| 6 | Exclusive (X) | `LOCK TABLE ... IN EXCLUSIVE MODE`, DDL |

---

## SELECT FOR UPDATE

`SELECT FOR UPDATE` locks selected rows immediately, before any DML is performed. This is the primary mechanism for **pessimistic locking** — reserving rows for update before you have determined the new values.

### Basic Syntax

```sql
-- Lock all selected rows; wait indefinitely for any already-locked rows
SELECT account_id, balance
FROM   accounts
WHERE  account_id IN (1001, 2001)
FOR UPDATE;

-- Lock and process
DECLARE
    v_balance accounts.balance%TYPE;
BEGIN
    SELECT balance INTO v_balance
    FROM   accounts
    WHERE  account_id = 1001
    FOR UPDATE;  -- row is now locked exclusively

    IF v_balance >= 500 THEN
        UPDATE accounts SET balance = balance - 500 WHERE account_id = 1001;
        UPDATE accounts SET balance = balance + 500 WHERE account_id = 2001;
        COMMIT;
    ELSE
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Insufficient funds');
    END IF;
END;
```

### NOWAIT — Fail Immediately If Locked

```sql
-- Raise ORA-00054 immediately if any row is already locked
SELECT product_id, stock_qty
FROM   inventory
WHERE  product_id = 42
FOR UPDATE NOWAIT;

-- Handle in application
DECLARE
    v_qty NUMBER;
BEGIN
    BEGIN
        SELECT stock_qty INTO v_qty FROM inventory WHERE product_id = 42 FOR UPDATE NOWAIT;
    EXCEPTION
        WHEN resource_busy THEN  -- ORA-00054
            RAISE_APPLICATION_ERROR(-20002, 'Product is being updated by another user. Please try again.');
    END;

    IF v_qty > 0 THEN
        UPDATE inventory SET stock_qty = stock_qty - 1 WHERE product_id = 42;
        COMMIT;
    END IF;
END;
```

### WAIT n — Wait Up to N Seconds

```sql
-- Wait up to 5 seconds for the lock; then raise ORA-30006
SELECT order_id, status
FROM   orders
WHERE  order_id = 9999
FOR UPDATE WAIT 5;
```

### SKIP LOCKED — Non-Blocking Queue Processing

`SKIP LOCKED` is extremely useful for implementing work queues. It skips any rows that are already locked rather than waiting, allowing multiple workers to process the queue in parallel without contention.

```sql
-- Worker process: claim the next available pending job
DECLARE
    v_job_id   NUMBER;
    v_payload  VARCHAR2(4000);
BEGIN
    -- Grab one unprocessed job, skipping any locked by other workers
    SELECT job_id, payload INTO v_job_id, v_payload
    FROM   job_queue
    WHERE  status = 'PENDING'
      AND  ROWNUM = 1
    ORDER  BY created_at
    FOR UPDATE SKIP LOCKED;

    -- Mark as in-progress
    UPDATE job_queue SET status = 'PROCESSING', started_at = SYSTIMESTAMP
    WHERE  job_id = v_job_id;

    COMMIT;

    -- Process the job (outside the lock)
    process_job(v_job_id, v_payload);

    -- Mark complete
    UPDATE job_queue SET status = 'DONE', completed_at = SYSTIMESTAMP
    WHERE  job_id = v_job_id;
    COMMIT;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        NULL;  -- No jobs available
END;
```

Multiple instances of this worker can run concurrently without any inter-process coordination — Oracle handles the row-level locking automatically.

---

## Deadlock Detection and Avoidance

A **deadlock** occurs when two or more sessions are each waiting for a lock held by another session in the cycle.

Oracle automatically detects deadlocks using a background cycle-detection algorithm. When detected:
- One session receives `ORA-00060: deadlock detected while waiting for resource`
- Oracle rolls back **only the statement** that received the error (not the entire transaction)
- The rolled-back session must re-execute the statement or roll back the transaction

```sql
-- Deadlock scenario
-- Session 1                           Session 2
UPDATE t SET v=1 WHERE id=1;  -- OK
                                UPDATE t SET v=2 WHERE id=2;  -- OK
UPDATE t SET v=3 WHERE id=2;  -- WAITS
                                UPDATE t SET v=4 WHERE id=1;  -- WAITS -> DEADLOCK
                                -- Session 2 receives ORA-00060
```

### Deadlock Alert Log

Oracle records deadlock traces in the alert log and a trace file:

```bash
# Find deadlock traces
grep -l "deadlock" $ORACLE_BASE/diag/rdbms/*/trace/*.trc | tail -5
```

```sql
-- Check recent deadlocks in unified auditing / alert log
SELECT value FROM v$diag_info WHERE name = 'Default Trace File';
```

### Deadlock Avoidance Strategies

**Strategy 1: Consistent Lock Ordering**

Always acquire locks in the same order across all code paths:

```sql
-- WRONG: different order creates deadlock potential
-- Path A: locks order 1, then order 2
-- Path B: locks order 2, then order 1

-- RIGHT: always lock in ascending order
-- Both paths: lock lower ID first, then higher ID
SELECT * FROM orders WHERE order_id IN (1, 2) ORDER BY order_id FOR UPDATE;
```

**Strategy 2: Lock at the Start of a Transaction**

Acquire all needed locks upfront rather than incrementally:

```sql
-- Lock all rows the transaction will need before doing any computation
SELECT account_id, balance
FROM   accounts
WHERE  account_id IN (:from_acct, :to_acct)
ORDER  BY account_id  -- consistent ordering
FOR UPDATE;
```

**Strategy 3: Use NOWAIT / Short WAIT**

Convert waiting deadlocks into immediately-handled exceptions:

```sql
BEGIN
    SELECT * FROM resource_table WHERE resource_id = :id FOR UPDATE NOWAIT;
    -- ... process ...
    COMMIT;
EXCEPTION
    WHEN resource_busy THEN
        -- Retry after brief delay, or queue the work
        log_retry('Resource busy, retrying...');
        DBMS_SESSION.SLEEP(0.5);
        -- retry logic
END;
```

**Strategy 4: Minimize Transaction Duration**

The longer a transaction holds locks, the more opportunity for deadlocks. Commit frequently for batch operations.

---

## Table Locks

Oracle acquires **table-level locks (TM locks)** in addition to row locks. Table locks prevent conflicting DDL while DML is in progress. They do NOT prevent concurrent DML unless explicitly escalated.

### Explicit Table Locking

```sql
-- Lock entire table to prevent concurrent modifications
-- (blocks other DML; use sparingly)
LOCK TABLE orders IN EXCLUSIVE MODE;
LOCK TABLE orders IN EXCLUSIVE MODE NOWAIT;  -- fail if locked

-- Share mode: prevents DML but allows concurrent readers
LOCK TABLE orders IN SHARE MODE;

-- Row exclusive: default mode acquired automatically during DML
LOCK TABLE orders IN ROW EXCLUSIVE MODE;
```

### When Table Locks Are Needed

Table locks in `EXCLUSIVE MODE` are rarely needed in application code. Primary use cases:
- Bulk load operations where you want to prevent any concurrent DML
- Schema changes when `ONLINE DDL` is not available
- Explicit synchronization for ETL processes

```sql
-- ETL pattern: lock staging table exclusively for safe swap
BEGIN
    LOCK TABLE staging_orders IN EXCLUSIVE MODE NOWAIT;

    -- Merge staging into production
    MERGE INTO production_orders p
    USING staging_orders s ON (p.order_id = s.order_id)
    WHEN MATCHED THEN UPDATE SET p.status = s.status
    WHEN NOT MATCHED THEN INSERT VALUES (s.order_id, s.status, s.created_at);

    DELETE FROM staging_orders;
    COMMIT;
EXCEPTION
    WHEN resource_busy THEN
        RAISE_APPLICATION_ERROR(-20010, 'Staging table is locked; ETL already running?');
END;
```

---

## Lock Monitoring Queries

### Active Locks and Blocked Sessions

```sql
-- Find blocking sessions and what they are blocking
SELECT
    blocker.sid         AS blocking_sid,
    blocker.serial#     AS blocking_serial,
    blocker.username    AS blocking_user,
    blocker.status      AS blocking_status,
    blocker.sql_id      AS blocking_sql_id,
    waiter.sid          AS waiting_sid,
    waiter.username     AS waiting_user,
    waiter.event        AS waiting_event,
    waiter.wait_time_micro / 1e6 AS wait_seconds,
    obj.object_name     AS locked_object,
    obj.object_type
FROM
    v$session blocker
    JOIN v$lock bl ON bl.sid = blocker.sid AND bl.block = 1
    JOIN v$lock wl ON wl.id1 = bl.id1 AND wl.id2 = bl.id2
                   AND wl.request > 0
    JOIN v$session waiter ON waiter.sid = wl.sid
    LEFT JOIN dba_objects obj ON obj.object_id = bl.id1
ORDER BY
    wait_seconds DESC;
```

### Lock Wait Tree (Hierarchical)

```sql
-- Show the full lock wait chain using hierarchical query
SELECT
    LPAD(' ', 2 * (LEVEL - 1)) || sid AS sid,
    username,
    status,
    osuser,
    machine,
    program,
    blocking_session,
    wait_class,
    event,
    seconds_in_wait
FROM
    v$session
WHERE
    status = 'ACTIVE'
    OR blocking_session IS NOT NULL
CONNECT BY PRIOR sid = blocking_session
START WITH blocking_session IS NULL AND status = 'ACTIVE'
ORDER SIBLINGS BY sid;
```

### Identify SQL Being Executed by Blocked Session

```sql
SELECT s.sid, s.blocking_session, s.event,
       sq.sql_text, s.seconds_in_wait
FROM   v$session s
JOIN   v$sql sq ON s.sql_id = sq.sql_id
WHERE  s.blocking_session IS NOT NULL;
```

### Lock History (AWR — requires Diagnostics Pack license)

```sql
-- Top waiting events for locks over last hour
SELECT event, total_waits, time_waited_micro / 1e6 AS total_wait_secs
FROM   v$system_event
WHERE  wait_class = 'Concurrency'
ORDER  BY time_waited_micro DESC;
```

---

## Optimistic vs. Pessimistic Locking

### Pessimistic Locking (SELECT FOR UPDATE)

Lock the row immediately, before reading the value you'll base your update on. Use when:
- Contention on the row is high
- You cannot afford to retry on conflict
- The "think time" between read and update is very short

### Optimistic Locking

Read the row without locking. Only at update time, verify the row hasn't changed:

```sql
-- Read (no lock)
SELECT order_id, status, last_modified, ORA_ROWSCN AS read_scn
FROM   orders
WHERE  order_id = 1001;
-- Application processes the data, user thinks about it...

-- Update with collision detection using ORA_ROWSCN or version column
UPDATE orders
SET    status = 'APPROVED', last_modified = SYSTIMESTAMP
WHERE  order_id = 1001
  AND  ORA_ROWSCN = :read_scn;  -- fails if row was changed since we read it

IF SQL%ROWCOUNT = 0 THEN
    -- Row was modified by someone else; retry or raise conflict error
    RAISE_APPLICATION_ERROR(-20003, 'Conflict: order was modified. Please reload and retry.');
END IF;
COMMIT;
```

**Using a version column for optimistic locking:**

```sql
-- Table design
CREATE TABLE orders (
    order_id    NUMBER PRIMARY KEY,
    status      VARCHAR2(20),
    version_no  NUMBER DEFAULT 1 NOT NULL  -- incremented on every update
);

-- Update with version check
UPDATE orders
SET    status = :new_status,
       version_no = version_no + 1
WHERE  order_id = :order_id
  AND  version_no = :read_version;  -- must match what was read

IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20004, 'Stale data: please reload.');
END IF;
```

---

## Best Practices

- **Prefer optimistic locking** for low-contention scenarios. Only escalate to `FOR UPDATE` when you genuinely need to guarantee no concurrent modification between read and update.
- **Keep lock duration as short as possible.** Acquire locks immediately before the DML, not at the start of a user interaction.
- **Never hold locks across network round-trips or user input.** A user who goes to lunch while your transaction holds a lock blocks everyone else.
- **Use `SKIP LOCKED` for queue-based workloads** to enable horizontal scaling of workers without a separate queue infrastructure.
- **Order lock acquisitions consistently** to prevent deadlocks.
- **Monitor `v$lock` and `v$session`** in production for blocking chains. Set up alerting when `seconds_in_wait` exceeds a threshold.
- **Avoid `LOCK TABLE IN EXCLUSIVE MODE`** in application code — it is almost always the wrong tool and creates a serialization bottleneck.

---

## Common Mistakes

### Mistake 1: Assuming Reads Are Blocked by Writes

Developers from SQL Server or MySQL backgrounds sometimes add unnecessary `NOLOCK` hints or read-uncommitted isolation. In Oracle, this is never needed — reads are never blocked by writers.

### Mistake 2: Catching ORA-00060 and Ignoring It

When an application catches a deadlock error, it must roll back the statement (Oracle already did the statement rollback, but the transaction is still open with prior changes) and then decide whether to retry or abort the whole transaction.

```plpgsql
-- WRONG: continue as if nothing happened
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -60 THEN NULL; END IF;  -- ignore deadlock!

-- RIGHT: rollback and handle
EXCEPTION WHEN OTHERS THEN
    IF SQLCODE = -60 THEN
        ROLLBACK;
        retry_or_raise();
    ELSE
        ROLLBACK;
        RAISE;
    END IF;
```

### Mistake 3: Using SELECT FOR UPDATE in Read-Only Scenarios

`SELECT FOR UPDATE` acquires exclusive locks. If the application only reads the data (no subsequent DML), those locks block other writers unnecessarily for the duration of the transaction.

### Mistake 4: Escalating to Table Locks Prematurely

Some developers use `LOCK TABLE IN EXCLUSIVE MODE` to "be safe" during batch updates. This serializes all processing, destroying any benefit from parallel execution. Use row-level locking and batch commits instead.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c Concepts (CNCPT) — Data Concurrency and Consistency](https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/)
- [Oracle Database 19c Application Developer's Guide (ADFNS)](https://docs.oracle.com/en/database/oracle/oracle-database/19/adfns/)
- [V$LOCK — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-LOCK.html)
- [V$SESSION — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SESSION.html)
