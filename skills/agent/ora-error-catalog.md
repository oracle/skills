# ORA- Error Catalog for Agent Self-Correction

When an agent receives an Oracle error, it should be able to diagnose the root cause and take corrective action without requiring human escalation. This catalog covers the 25 most common ORA- errors agents encounter, with root cause and corrective action for each.

## Quick Reference Table

| ORA- Code | Error Message | Most Likely Cause | Agent Action |
|---|---|---|---|
| ORA-00001 | unique constraint violated | Duplicate key on INSERT | Use MERGE; check existing row |
| ORA-00054 | resource busy, NOWAIT specified | Object locked by another session | Wait and retry; use SKIP LOCKED |
| ORA-00060 | deadlock detected while waiting for resource | Two sessions waiting on each other's locks | Catch DEADLOCK_DETECTED, rollback, retry |
| ORA-00257 | archiver error, connect internal only until freed | Archive log destination disk full | Alert DBA; verify backups; free archive log space |
| ORA-00904 | invalid identifier | Column/alias name wrong | Check ALL_TAB_COLUMNS |
| ORA-00907 | missing right parenthesis | SQL syntax error | Fix parenthesis balance |
| ORA-00936 | missing expression | Incomplete SQL | Check for trailing comma, missing column |
| ORA-00942 | table or view does not exist | Wrong name or no SELECT privilege | Check ALL_TABLES; check privileges |
| ORA-00955 | name already used | Object with that name exists | Use CREATE OR REPLACE; check first |
| ORA-01400 | cannot insert NULL | NOT NULL column missing value | Check ALL_TAB_COLUMNS for nullable |
| ORA-01403 | no data found | SELECT INTO returned 0 rows | Add exception handler; use COUNT first |
| ORA-01422 | exact fetch returns more rows | SELECT INTO returned > 1 row | Use cursor or aggregate |
| ORA-01436 | CONNECT BY loop in user data | Cycle in hierarchical query data | Add NOCYCLE; use CONNECT_BY_ISCYCLE |
| ORA-01438 | value larger than specified precision | NUMBER too large for column type | Check column precision/scale |
| ORA-01555 | snapshot too old | Long-running query, insufficient undo | Reduce query duration; increase UNDO_RETENTION |
| ORA-01722 | invalid number | Implicit string-to-number conversion | Use TO_NUMBER with format mask |
| ORA-01843 | not a valid month | Invalid date string format | Use TO_DATE with explicit format mask |
| ORA-02291 | integrity constraint (parent key not found) | FK insert with no parent row | Insert parent row first |
| ORA-02292 | integrity constraint (child record found) | DELETE parent with child rows | Delete children first or use CASCADE |
| ORA-04021 | timeout occurred while waiting to lock object | DDL lock timeout waiting for object | Retry after activity clears; tune DDL_LOCK_TIMEOUT |
| ORA-04031 | unable to allocate shared memory | Shared pool exhausted | Flush pool; check SHARED_POOL_SIZE |
| ORA-04043 | object does not exist | Wrong object name in DDL/DBMS_METADATA | Check ALL_OBJECTS |
| ORA-04098 | trigger is invalid and failed re-validation | Trigger body has compilation errors | Recompile trigger; check USER_ERRORS |
| ORA-06502 | PL/SQL: numeric or value error | Variable too small for value | Increase variable size |
| ORA-06512 | at line N | PL/SQL backtrace line indicator | Look at the line N for root cause |
| ORA-06550 | line N, column N: PL/SQL compilation error | PL/SQL syntax error in dynamic SQL | Check USER_ERRORS; fix PL/SQL block |
| ORA-08103 | object no longer exists | Object dropped/modified mid-query | Retry; confirm object still exists |
| ORA-12154 | TNS could not resolve connect identifier | Bad TNS alias or tnsnames.ora | Check connection string |
| ORA-12541 | no listener | Listener not running or wrong port | Check listener status |
| ORA-12899 | value too large for column | String exceeds column's defined length | Check ALL_TAB_COLUMNS; truncate or fix source |
| ORA-28000 | account locked | Too many failed logins | Unlock: ALTER USER ... ACCOUNT UNLOCK |
| ORA-28001 | password expired | Password past expiry | Reset: ALTER USER ... IDENTIFIED BY |
| ORA-01031 | insufficient privileges | Missing privilege for operation | Check session_privs; request grant |

---

## Detailed Entries

### ORA-00001: Unique Constraint Violated

```
ORA-00001: unique constraint (SCHEMA.CONSTRAINT_NAME) violated
```

**Root cause**: INSERT attempted to create a duplicate value in a unique or primary key column.

**Corrective action**:
```sql
-- Find the constraint and which columns it covers
SELECT c.constraint_name, c.constraint_type,
       cc.column_name
FROM   all_constraints c
JOIN   all_cons_columns cc ON c.owner = cc.owner AND c.constraint_name = cc.constraint_name
WHERE  c.owner = :schema AND c.constraint_name = :constraint_name;

-- Check if the row already exists
-- Table and column names are identifiers, not bind values; use DBMS_ASSERT before interpolating
DECLARE
  v_table VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:table);
  v_col   VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:key_column);
  v_cnt   NUMBER;
BEGIN
  EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM ' || v_table || ' WHERE ' || v_col || ' = :val'
    INTO v_cnt USING :key_value;
  DBMS_OUTPUT.PUT_LINE(v_cnt || ' row(s) found');
END;
/

-- Fix: use MERGE instead of INSERT
MERGE INTO t USING (SELECT :key AS id, :val AS val FROM DUAL) s
ON (t.id = s.id)
WHEN MATCHED    THEN UPDATE SET t.val = s.val
WHEN NOT MATCHED THEN INSERT (id, val) VALUES (s.id, s.val);
```

---

### ORA-00054: Resource Busy

```
ORA-00054: resource busy and acquire with NOWAIT specified or timeout expired
```

**Root cause**: DDL or `SELECT FOR UPDATE NOWAIT` attempted to lock an object already locked by another session.

**Corrective action**:
```sql
-- Find who holds the lock
SELECT s.sid, s.serial#, s.username, s.status,
       s.module, s.action, o.object_name
FROM   v$lock l
JOIN   v$session s ON l.sid = s.sid
JOIN   dba_objects o ON l.id1 = o.object_id
WHERE  l.type = 'TM' AND l.lmode > 0;

-- Options:
-- 1. Wait: retry after a delay
-- 2. Use SKIP LOCKED for DML queues
SELECT * FROM queue_table WHERE status = 'PENDING'
FOR UPDATE SKIP LOCKED FETCH FIRST 10 ROWS ONLY;
-- 3. If urgent and lock is stale, escalate to DBA to kill session
```

---

### ORA-00060: Deadlock Detected

```
ORA-00060: deadlock detected while waiting for resource
```

**Root cause**: Two sessions are each waiting for a lock held by the other, creating a circular dependency. Oracle automatically detects the deadlock, rolls back one of the statements (not the entire transaction), and raises ORA-00060 in that session.

**Corrective action**:
```sql
-- 1. Find the deadlock trace file from the alert log
--    Oracle writes a deadlock graph to a trace file in the ADR trace directory.
SELECT value FROM v$diag_info WHERE name = 'Diag Trace';
-- Then look for the most recent ora_*.trc file containing "DEADLOCK DETECTED"

-- 2. Identify sessions and objects involved (current deadlocks)
SELECT w.sid AS waiting_sid, h.sid AS holding_sid,
       o.object_name, o.object_type
FROM   v$lock w
JOIN   v$lock h ON w.id1 = h.id1 AND w.id2 = h.id2
JOIN   dba_objects o ON w.id1 = o.object_id
WHERE  w.block = 0 AND h.block = 1;

-- 3. Application pattern: catch, rollback the statement, then retry
DECLARE
  DEADLOCK_DETECTED EXCEPTION;
  PRAGMA EXCEPTION_INIT(DEADLOCK_DETECTED, -60);
  v_retries NUMBER := 0;
BEGIN
  LOOP
    BEGIN
      -- DML that may deadlock
      UPDATE orders SET status = 'PROCESSING' WHERE order_id = :order_id;
      COMMIT;
      EXIT;  -- success
    EXCEPTION
      WHEN DEADLOCK_DETECTED THEN
        ROLLBACK;
        v_retries := v_retries + 1;
        IF v_retries >= 3 THEN
          RAISE;  -- escalate after max retries
        END IF;
        DBMS_SESSION.SLEEP(0.1 * v_retries);  -- brief back-off
    END;
  END LOOP;
END;
/

-- 4. Long-term fix: ensure all sessions acquire locks in the same order
--    (e.g., always update PARENT before CHILD, never the reverse)
```

---

### ORA-00257: Archiver Error — Archive Log Destination Full

```
ORA-00257: archiver error. Connect internal only, until freed.
```

**Root cause**: The archive log destination (local disk or FRA) is full. Oracle cannot write new archive logs, so all non-SYSDBA connections are blocked to prevent data loss.

**Corrective action**:
```sql
-- 1. Check archive log destination usage
SELECT dest_name, status, target, archiver, dest_id,
       space_limit/1024/1024    AS limit_mb,
       space_used/1024/1024     AS used_mb
FROM   v$archive_dest WHERE target = 'PRIMARY' AND status != 'INACTIVE';

-- 2. Check Fast Recovery Area (FRA) usage
SELECT name,
       space_limit/1024/1024          AS limit_mb,
       space_used/1024/1024           AS used_mb,
       ROUND(space_used/space_limit*100,1) AS pct_used
FROM   v$recovery_file_dest;

-- 3. Check which archive logs exist and their backup status
SELECT sequence#, name, archived, backed_up, first_time, next_time
FROM   v$archived_log
WHERE  standby_dest = 'NO'
ORDER  BY sequence# DESC
FETCH FIRST 20 ROWS ONLY;

-- 4. Agent protocol — DO NOT delete archive logs autonomously.
--    Archive logs are the only way to recover data between backups.
--    Deleting them without confirming backup completion causes permanent data loss.
--
--    Correct escalation steps:
--    a) Alert the DBA immediately with the output of the queries above.
--    b) DBA verifies that recent archive logs are included in a successful RMAN backup.
--    c) DBA runs RMAN to crosscheck and delete obsolete logs:
--
--       RMAN> CROSSCHECK ARCHIVELOG ALL;
--       RMAN> DELETE NOPROMPT OBSOLETE;
--       RMAN> DELETE NOPROMPT ARCHIVELOG ALL COMPLETED BEFORE 'SYSDATE-1'
--                 BACKED UP 1 TIMES TO DEVICE TYPE DISK;
--
--    d) If FRA is the destination, adding space or enlarging DB_RECOVERY_FILE_DEST_SIZE
--       is also an option (requires DBA):
ALTER SYSTEM SET db_recovery_file_dest_size = 50G;
```

---

### ORA-00942: Table or View Does Not Exist

```
ORA-00942: table or view does not exist
```

**Root cause**: Wrong table name, wrong schema prefix, or the current user lacks SELECT privilege.

**Corrective action**:
```sql
-- 1. Check if the table exists
SELECT owner, table_name FROM all_tables
WHERE  table_name = :table_name;

-- 2. Check privileges
SELECT * FROM all_tab_privs
WHERE  table_name = :table_name
  AND  grantee IN (SELECT username FROM user_users
                   UNION SELECT granted_role FROM session_roles);

-- 3. Check synonyms
SELECT synonym_name, table_owner, table_name
FROM   all_synonyms WHERE synonym_name = :table_name;
```

---

### ORA-01403: No Data Found

```
ORA-01403: no data found
```

**Root cause**: `SELECT INTO` returned zero rows.

**Corrective action**:
```sql
-- Add EXCEPTION handler
BEGIN
  SELECT salary INTO v_salary FROM employees WHERE employee_id = :id;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    v_salary := NULL;  -- or raise meaningful error
END;

-- Or check first
SELECT COUNT(*) INTO v_count FROM employees WHERE employee_id = :id;
IF v_count > 0 THEN
  SELECT salary INTO v_salary FROM employees WHERE employee_id = :id;
END IF;
```

---

### ORA-01722: Invalid Number

```
ORA-01722: invalid number
```

**Root cause**: Oracle tried to convert a string to a number and the string is not numeric. Often from VARCHAR2 columns compared to numbers.

**Corrective action**:
```sql
-- Find non-numeric values
SELECT col FROM t WHERE REGEXP_LIKE(col, '[^0-9.]');

-- Safe conversion
SELECT TO_NUMBER(col DEFAULT NULL ON CONVERSION ERROR) FROM t;

-- Always use explicit format masks
SELECT TO_NUMBER('1,234.56', '9,999.99') FROM DUAL;
```

---

### ORA-01843: Not a Valid Month

```
ORA-01843: not a valid month
```

**Root cause**: Date string format does not match the NLS_DATE_FORMAT or the supplied format mask.

**Corrective action**:
```sql
-- Always use explicit format masks — never rely on NLS_DATE_FORMAT
SELECT TO_DATE('2024-03-15', 'YYYY-MM-DD') FROM DUAL;           -- ISO format
SELECT TO_DATE('15-MAR-2024', 'DD-MON-YYYY', 'NLS_DATE_LANGUAGE=AMERICAN') FROM DUAL;

-- Use TIMESTAMP for precision
SELECT TO_TIMESTAMP('2024-03-15 14:30:00', 'YYYY-MM-DD HH24:MI:SS') FROM DUAL;
```

---

### ORA-02291: Parent Key Not Found

```
ORA-02291: integrity constraint (SCHEMA.FK_NAME) violated - parent key not found
```

**Root cause**: INSERT into a child table references a value that does not exist in the parent table.

**Corrective action**:
```sql
-- Find the FK constraint and referenced table
SELECT c.constraint_name, c.table_name AS child_table,
       r.table_name AS parent_table, rcc.column_name AS parent_col
FROM   all_constraints c
JOIN   all_constraints r ON c.r_constraint_name = r.constraint_name
JOIN   all_cons_columns rcc ON r.constraint_name = rcc.constraint_name
WHERE  c.constraint_name = :fk_name;

-- Check the parent table for the missing key
-- Table/column names are identifiers — validate with DBMS_ASSERT, pass value as bind
DECLARE
  v_tbl VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:parent_table);
  v_col VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:pk_column);
BEGIN
  EXECUTE IMMEDIATE 'SELECT * FROM ' || v_tbl || ' WHERE ' || v_col || ' = :val'
    USING :missing_value;
END;
/

-- Fix: insert parent row first, then child
```

---

### ORA-02292: Child Record Found

```
ORA-02292: integrity constraint (SCHEMA.FK_NAME) violated - child record found
```

**Root cause**: DELETE or UPDATE of a parent row that has dependent child rows.

**Corrective action**:
```sql
-- Find child records
-- Table/column names are identifiers — validate with DBMS_ASSERT, pass value as bind
DECLARE
  v_tbl VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:child_table);
  v_col VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:fk_column);
BEGIN
  EXECUTE IMMEDIATE 'SELECT * FROM ' || v_tbl || ' WHERE ' || v_col || ' = :val'
    USING :parent_key_value;
END;
/

-- Options:
-- 1. Delete children first
-- 2. Use ON DELETE CASCADE on the FK (DDL change, requires careful review)
-- 3. Nullify FK instead (if FK allows NULLs and business rules permit)
```

---

### ORA-01436: CONNECT BY Loop in User Data

```
ORA-01436: CONNECT BY loop in user data
```

**Root cause**: A `CONNECT BY` hierarchical query encountered a cycle in the data — a row is its own ancestor, causing an infinite loop. This is a data quality issue (e.g., an employee listed as their own manager, or a circular parent-child reference).

**Corrective action**:
```sql
-- 1. Add NOCYCLE to allow the query to complete despite cycles
SELECT employee_id, manager_id, last_name,
       LEVEL,
       CONNECT_BY_ISCYCLE AS is_cycle
FROM   employees
START  WITH manager_id IS NULL
CONNECT BY NOCYCLE PRIOR employee_id = manager_id;

-- 2. Use CONNECT_BY_ISCYCLE = 1 to find the looping rows
SELECT employee_id, manager_id, last_name
FROM   employees
START  WITH manager_id IS NULL
CONNECT BY NOCYCLE PRIOR employee_id = manager_id
WHERE  CONNECT_BY_ISCYCLE = 1;

-- 3. Investigate the cycle: find rows where a node appears as its own ancestor
SELECT e.employee_id, e.manager_id
FROM   employees e
WHERE  e.manager_id = e.employee_id;  -- direct self-reference

-- Also check indirect cycles with a recursive CTE:
WITH hierarchy (employee_id, manager_id, path, cycle_flag) AS (
  SELECT employee_id, manager_id,
         CAST(employee_id AS VARCHAR2(4000)),
         0 AS cycle_flag
  FROM   employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.employee_id, e.manager_id,
         h.path || ',' || e.employee_id,
         CASE WHEN INSTR(h.path, TO_CHAR(e.employee_id)) > 0 THEN 1 ELSE 0 END
  FROM   employees e
  JOIN   hierarchy h ON e.manager_id = h.employee_id
  WHERE  h.cycle_flag = 0
)
SELECT * FROM hierarchy WHERE cycle_flag = 1;

-- 4. Fix: correct the data so no row references an ancestor as its parent
UPDATE employees SET manager_id = :correct_manager_id
WHERE  employee_id = :looping_employee_id;
COMMIT;
```

---

### ORA-01555: Snapshot Too Old

```
ORA-01555: snapshot too old: rollback segment number N with name "..." too small
```

**Root cause**: A long-running query started reading data that was overwritten before the query finished — Oracle cannot reconstruct the consistent read image from undo.

**Corrective action**:
```sql
-- 1. Immediately: retry during low-activity window
-- 2. Short-term: increase UNDO_RETENTION
SHOW PARAMETER undo_retention;
ALTER SYSTEM SET undo_retention = 3600;  -- 1 hour (in seconds)

-- 3. Check undo tablespace size
SELECT tablespace_name, SUM(bytes)/1024/1024 AS mb_free
FROM   dba_free_space WHERE tablespace_name = 'UNDOTBS1' GROUP BY tablespace_name;

-- 4. Restructure the query to run faster (reduce scan time)
```

---

### ORA-01031: Insufficient Privileges

```
ORA-01031: insufficient privileges
```

**Root cause**: The current user lacks a required system privilege or object privilege.

**Corrective action**:
```sql
-- Check current system privileges
SELECT privilege FROM session_privs ORDER BY privilege;

-- Check object privileges
SELECT * FROM all_tab_privs WHERE grantee = USER;

-- Check roles
SELECT granted_role FROM session_roles;

-- What privilege is needed?
-- CREATE TABLE → needs CREATE TABLE or CREATE ANY TABLE
-- SELECT on another schema's table → needs GRANT SELECT or SELECT ANY TABLE
-- Execute DDL in another schema → needs CREATE ANY [object type]
```

---

### ORA-28000 / ORA-28001: Account Locked / Password Expired

```
ORA-28000: the account is locked
ORA-28001: the password has expired
```

**Root cause**: Too many failed login attempts (28000) or password past the profile expiry (28001). Both require DBA intervention.

**Corrective action** (requires DBA):
```sql
-- Unlock account
ALTER USER :username ACCOUNT UNLOCK;

-- Reset expired password
ALTER USER :username IDENTIFIED BY :new_password;

-- Check the profile settings
SELECT profile FROM dba_users WHERE username = :username;
SELECT resource_name, limit FROM dba_profiles
WHERE  profile = :profile_name AND resource_type = 'PASSWORD';
```

---

### ORA-04021: Timeout Waiting to Lock Object

```
ORA-04021: timeout occurred while waiting to lock object
```

**Root cause**: A DDL statement (e.g., `ALTER TABLE`, `CREATE OR REPLACE PROCEDURE`) could not acquire the DDL lock on the object within the allowed timeout. Another session holds a DML or parse lock on the object. This is the DDL equivalent of ORA-00054.

**Corrective action**:
```sql
-- 1. Check who holds locks on the object
SELECT s.sid, s.serial#, s.username, s.status,
       s.module, s.action, s.sql_id,
       l.type, l.lmode, l.request
FROM   v$lock l
JOIN   v$session s ON l.sid = s.sid
JOIN   dba_objects o ON l.id1 = o.object_id
WHERE  o.object_name = :object_name
  AND  o.owner = :owner;

-- 2. Check the current DDL_LOCK_TIMEOUT setting (default is 0 seconds)
SHOW PARAMETER ddl_lock_timeout;

-- 3. Increase DDL_LOCK_TIMEOUT to wait longer before failing
--    (session level — only affects the current session)
ALTER SESSION SET ddl_lock_timeout = 30;  -- wait up to 30 seconds

-- 4. Retry the DDL after setting the timeout:
--    ALTER TABLE ..., CREATE OR REPLACE ..., etc.

-- 5. If a specific session is blocking and it is safe to terminate:
--    Escalate to a DBA to review and optionally kill the blocking session.
--    SELECT sid, serial# FROM v$session WHERE sid = :blocking_sid;
--    ALTER SYSTEM KILL SESSION ':sid,:serial#' IMMEDIATE;  -- DBA action only

-- Note: Unlike ORA-00054, ORA-04021 applies to implicit DDL locks,
-- not explicit SELECT FOR UPDATE locks.
```

---

### ORA-04098: Trigger Invalid and Failed Re-Validation

```
ORA-04098: trigger 'SCHEMA.TRIGGER_NAME' is invalid and failed re-validation
```

**Root cause**: A trigger on the table being accessed has compilation errors. Oracle attempted to re-validate (auto-recompile) the trigger at runtime and failed. This often happens after a DDL change to a table, package, or type that the trigger depends on.

**Corrective action**:
```sql
-- 1. Find all invalid triggers and the tables they belong to
SELECT t.owner, t.trigger_name, t.table_name, t.status,
       t.trigger_type, t.triggering_event
FROM   all_triggers t
WHERE  t.status = 'DISABLED'
   OR  t.trigger_name IN (
         SELECT object_name FROM all_objects
         WHERE  object_type = 'TRIGGER' AND status = 'INVALID'
           AND  owner = :schema
       );

-- 2. Get the compilation errors for a specific trigger
SELECT line, position, text AS error_text
FROM   user_errors
WHERE  name = :trigger_name
  AND  type = 'TRIGGER'
ORDER  BY sequence;

-- 3. Recompile the trigger
ALTER TRIGGER :trigger_name COMPILE;
-- For a trigger in another schema (requires ALTER ANY TRIGGER):
-- ALTER TRIGGER schema.trigger_name COMPILE;

-- 4. If the trigger references an invalid object (e.g., a package),
--    recompile the dependency first, then the trigger:
ALTER PACKAGE :package_name COMPILE;
ALTER TRIGGER :trigger_name COMPILE;

-- 5. Verify the trigger is now valid
SELECT status FROM user_objects
WHERE  object_name = :trigger_name AND object_type = 'TRIGGER';
```

---

### ORA-06550: PL/SQL Compilation Error

```
ORA-06550: line N, column N:
PLS-XXXXX: <compilation error message>
ORA-06550: line N, column N:
PL/SQL: Statement ignored
```

**Root cause**: A PL/SQL block passed to `EXECUTE IMMEDIATE` or `DBMS_SQL` contains a syntax or semantic error that Oracle could not compile. The ORA-06550 wrapper is always accompanied by one or more `PLS-` error codes that identify the actual problem. Common causes: misspelled identifier, wrong number of arguments, type mismatch, referencing an object that does not exist.

**Corrective action**:
```sql
-- 1. Read the full error stack — the PLS- codes after ORA-06550 identify the root cause.
--    ORA-06550 is only the wrapper; the PLS-XXXXX message is actionable.

-- 2. Test the dynamic block as a named object to surface errors in USER_ERRORS:
CREATE OR REPLACE PROCEDURE debug_dynamic_block AS
BEGIN
  -- paste the body of your EXECUTE IMMEDIATE string here
  NULL;
END;
/
SHOW ERRORS PROCEDURE debug_dynamic_block;

-- 3. Query USER_ERRORS directly
SELECT line, position, text
FROM   user_errors
WHERE  name = :object_name   -- procedure/function/package/trigger
  AND  type = :object_type
ORDER  BY sequence;

-- 4. Common PLS- codes that accompany ORA-06550:
--    PLS-00201: identifier must be declared          → misspelled name or missing schema prefix
--    PLS-00302: component must be declared           → wrong package subprogram name
--    PLS-00306: wrong number or types of arguments   → signature mismatch
--    PLS-00382: expression is of wrong type          → type mismatch in assignment or call
--    PLS-00103: encountered symbol X                 → syntax error (missing keyword, semicolon, etc.)

-- 5. EXECUTE IMMEDIATE safety pattern: always validate dynamic PL/SQL strings
--    before execution; use bind variables for all data values.
DECLARE
  v_sql VARCHAR2(4000);
BEGIN
  v_sql := 'BEGIN ' || DBMS_ASSERT.SIMPLE_SQL_NAME(:proc_name) || '(:p1, :p2); END;';
  EXECUTE IMMEDIATE v_sql USING :param1, :param2;
END;
/
```

---

### ORA-08103: Object No Longer Exists

```
ORA-08103: object no longer exists
```

**Root cause**: The object (table, index, partition, or LOB segment) being accessed was dropped, truncated with segment reuse, or structurally modified (e.g., partition moved/dropped) while a query or cursor was still open against it. This is distinct from ORA-00942 (which fires at parse time); ORA-08103 fires at execution time mid-query.

**Corrective action**:
```sql
-- 1. Confirm the object still exists
SELECT owner, object_name, object_type, status, last_ddl_time
FROM   all_objects
WHERE  object_name = :object_name
  AND  owner = :owner;

-- 2. Check whether the object was recently dropped (look in recycle bin)
SELECT object_name, original_name, type, droptime
FROM   dba_recyclebin
WHERE  original_name = :object_name
ORDER  BY droptime DESC
FETCH FIRST 5 ROWS ONLY;

-- 3. If a partition was the target, check partition list
SELECT partition_name, partition_position, status, last_analyzed
FROM   all_tab_partitions
WHERE  table_name = :table_name
  AND  table_owner = :owner
ORDER  BY partition_position;

-- 4. If the object exists and status = 'VALID', a concurrent DDL happened mid-query.
--    Simply retry the query — a fresh open cursor will pick up the current state.

-- 5. If persistent: check DDL audit trail or alert log for recent DDL on the object
SELECT * FROM unified_audit_trail
WHERE  object_name = :object_name
  AND  action_name IN ('DROP TABLE','TRUNCATE TABLE','ALTER TABLE','DROP PARTITION')
ORDER  BY event_timestamp DESC
FETCH FIRST 10 ROWS ONLY;
```

---

### ORA-12899: Value Too Large for Column

```
ORA-12899: value too large for column "SCHEMA"."TABLE"."COLUMN" (actual: N, maximum: M)
```

**Root cause**: The data being inserted or updated exceeds the column's declared maximum length. The error message includes the actual byte/char length of the value and the column's maximum. Common when loading data from external systems with different length assumptions, or when a VARCHAR2 column is defined in bytes but the data contains multibyte characters.

**Corrective action**:
```sql
-- 1. Check the column's defined length and byte semantics
SELECT column_name, data_type, data_length, char_length,
       char_used,   -- 'B' = byte semantics, 'C' = char semantics
       nullable
FROM   all_tab_columns
WHERE  table_name  = :table_name
  AND  column_name = :column_name
  AND  owner       = :owner;

-- 2. Measure the actual length of the problem value
SELECT LENGTH(:problem_value)       AS char_len,
       LENGTHB(:problem_value)      AS byte_len
FROM   DUAL;

-- 3a. Fix option — truncate to fit (only if truncation is acceptable)
INSERT INTO t (col) VALUES (SUBSTR(:value, 1, :max_length));

-- 3b. Fix option — convert to a safe representation
INSERT INTO t (col) VALUES (TO_CHAR(:value, 'YYYY-MM-DD'));  -- for date-derived strings

-- 3c. Fix option — increase the column length (DDL change, requires review)
--    Validate the column name before interpolating:
DECLARE
  v_tbl VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:table_name);
  v_col VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:column_name);
BEGIN
  EXECUTE IMMEDIATE
    'ALTER TABLE ' || v_tbl || ' MODIFY ' || v_col || ' VARCHAR2(:new_len CHAR)'
    USING :new_length;
END;
/
-- Note: ALTER TABLE MODIFY to increase a VARCHAR2 length is generally safe online.

-- 3d. Fix option — switch the column to CHAR semantics if multibyte characters are the cause
--    ALTER TABLE t MODIFY col VARCHAR2(N CHAR);
```

---

## Best Practices for Agents

- Always parse the full ORA- error code and constraint name from the error message before acting
- For ORA-00942: introspect `ALL_TABLES` and `ALL_SYNONYMS` before assuming the table is missing
- For ORA-00001 and ORA-02291: check the data first, then modify the SQL — not the other way
- For ORA-01555: do not retry immediately — the issue is persistent until undo is tuned or the query is restructured
- For ORA-28000/28001: escalate to a human DBA — do not attempt to change passwords autonomously

## Oracle Version Notes (19c vs 26ai)

All error codes in this skill apply from Oracle 8i through 26ai. Error messages and behavior are stable across versions.

## See Also

- [Safe DML Patterns](../agent/safe-dml-patterns.md) — Preventing ORA-00001, ORA-02291, ORA-02292
- [Schema Discovery Queries](../agent/schema-discovery.md) — Resolving ORA-00942
- [PL/SQL Error Handling](../plsql/plsql-error-handling.md) — Handling ORA-01403, ORA-01422
- [Undo Management](../admin/undo-management.md) — Resolving ORA-01555

## Sources

- [Oracle Database Error Messages Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/errmg/)
- [Oracle Database 19c Administrator's Guide — Managing Errors](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/)
