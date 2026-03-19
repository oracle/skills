# Destructive Operation Guards for Agents

DROP, TRUNCATE, and unguarded DELETE are irreversible or hard to reverse. Before an agent executes any of these, it should run pre-flight checks to confirm the operation is safe, intentional, and recoverable.

## Pre-Flight Checks Before DROP TABLE

```sql
-- 1. Confirm the table exists and get row count
SELECT table_name, num_rows, last_analyzed
FROM   all_tables
WHERE  owner = :schema
  AND  table_name = :table_name;

-- 2. Check for dependent objects (views, triggers, procedures, synonyms)
SELECT object_type, object_name, owner
FROM   all_dependencies
WHERE  referenced_owner = :schema
  AND  referenced_name  = :table_name
ORDER  BY object_type, object_name;

-- 3. Check for child foreign key constraints
SELECT c.owner, c.table_name, c.constraint_name,
       c.constraint_type, c.status
FROM   all_constraints c
WHERE  c.r_owner = :schema
  AND  c.r_constraint_name IN (
    SELECT constraint_name FROM all_constraints
    WHERE  owner = :schema
      AND  table_name = :table_name
      AND  constraint_type = 'P'
  );

-- 4. Check for active locks on the table
SELECT s.sid, s.serial#, s.username, s.status,
       l.type, l.lmode
FROM   v$lock l
JOIN   v$session s ON l.sid = s.sid
WHERE  l.id1 = (
  SELECT object_id FROM all_objects
  WHERE  owner = :schema
    AND  object_name = :table_name
    AND  object_type = 'TABLE'
);
```

### Snapshot DDL Before Dropping

```sql
-- Save the DDL so you can recreate if needed
SELECT DBMS_METADATA.GET_DDL('TABLE', :table_name, :schema)
FROM   DUAL;

-- Also capture dependent object DDL
SELECT DBMS_METADATA.GET_DDL(object_type, object_name, owner)
FROM   all_objects
WHERE  object_name IN (
  SELECT object_name FROM all_dependencies
  WHERE  referenced_owner = :schema
    AND  referenced_name  = :table_name
)
AND object_type IN ('VIEW', 'TRIGGER', 'INDEX');
```

### DROP with Safety Net (Recycle Bin)

```sql
-- Default DROP — goes to recycle bin (recoverable)
DROP TABLE employees;

-- Verify it's in the recycle bin
SELECT object_name, original_name, type, droptime
FROM   user_recyclebin
WHERE  original_name = 'EMPLOYEES';

-- Recover from recycle bin
FLASHBACK TABLE employees TO BEFORE DROP;

-- Permanent drop (bypasses recycle bin) — agents should NEVER use this without explicit user confirmation
DROP TABLE employees PURGE;
```

## Pre-Flight Checks Before TRUNCATE

TRUNCATE is DDL — it cannot be rolled back and bypasses the recycle bin.

```sql
-- 1. Count rows first
SELECT COUNT(*) AS row_count FROM schema.table_name;

-- 2. Check for enabled triggers that fire on DELETE (TRUNCATE bypasses row triggers)
SELECT trigger_name, trigger_type, triggering_event, status
FROM   all_triggers
WHERE  owner = :schema
  AND  table_name = :table_name
  AND  status = 'ENABLED';

-- 3. Check for materialized view logs (TRUNCATE breaks fast refresh)
SELECT log_owner, log_table, master
FROM   all_mview_logs
WHERE  log_owner = :schema
  AND  master    = :table_name;
```

**Agent rule**: Never generate TRUNCATE without explicit user confirmation showing the row count and confirming irreversibility. Prefer DELETE with a SAVEPOINT if rollback capability is needed.

## Pre-Flight Checks Before DELETE Without WHERE

```sql
-- If agent receives instruction to "delete all rows" or "clear the table":
-- Table name is an identifier — use DBMS_ASSERT before interpolating into dynamic SQL

DECLARE
  v_table VARCHAR2(128) := DBMS_ASSERT.SQL_OBJECT_NAME(:schema || '.' || :table_name);
  v_count NUMBER;
BEGIN
  -- Step 1: Count rows
  EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM ' || v_table INTO v_count;
  DBMS_OUTPUT.PUT_LINE(v_count || ' rows will be deleted. Confirm before proceeding.');

  -- Step 2: DELETE is rollback-safe within the transaction; TRUNCATE is not
  -- Even for "delete all", use an explicit WHERE to produce intentional, auditable SQL
  EXECUTE IMMEDIATE 'DELETE FROM ' || v_table || ' WHERE 1=1';
  COMMIT;
END;
/
```

## Checking for Active Sessions Before Object Operations

```sql
-- Are there sessions currently using this table?
SELECT s.sid, s.serial#, s.username, s.program,
       s.last_call_et AS seconds_active
FROM   v$session s
WHERE  s.status = 'ACTIVE'
  AND  EXISTS (
    SELECT 1 FROM v$open_cursor oc
    WHERE  oc.sid = s.sid
      AND  UPPER(oc.sql_text) LIKE '%' || :table_name || '%'
  );
```

## Checking for Index Dependencies

```sql
-- Indexes on the table (will be dropped automatically with the table)
SELECT index_name, index_type, uniqueness, status
FROM   all_indexes
WHERE  owner = :schema
  AND  table_name = :table_name;

-- Function-based index expressions
SELECT index_name, column_expression
FROM   all_ind_expressions
WHERE  index_owner = :schema
  AND  table_name  = :table_name;
```

## Checking for DB Links Referencing the Object

Before dropping a table, check if remote databases reference it via DB links. Oracle cannot query remote databases for this automatically, but agents should check for local synonyms that expose the table remotely and check ALL_DB_LINKS for awareness.

```sql
-- Check local synonyms pointing to this table (may be accessed remotely)
SELECT synonym_name, table_owner, table_name, db_link
FROM   all_synonyms
WHERE  table_owner = :schema
  AND  table_name  = :table_name;

-- Check all DB links in the schema (so you know what remote DBs are connected)
SELECT db_link, username, host, created
FROM   all_db_links
WHERE  owner = :schema
ORDER  BY db_link;
```

Note: Oracle cannot automatically detect if a remote database queries this table via DB link. Alert the user that cross-database impacts cannot be automatically checked.

## Checking for Grants on the Object

If a table has been granted to other users/roles, dropping it revokes those grants automatically, which may break other users' access.

```sql
-- Check all grants on the object
SELECT grantee, privilege, grantable, hierarchy
FROM   all_tab_privs
WHERE  owner      = :schema
  AND  table_name = :table_name
ORDER  BY grantee, privilege;
```

Agent rule: if any grants exist, list them in the pre-flight report. The user should know which users/roles will lose access.

## Checking for Synonyms Pointing to the Object

```sql
-- Public and private synonyms pointing to this table
SELECT owner, synonym_name, table_owner, table_name
FROM   all_synonyms
WHERE  table_owner = :schema
  AND  table_name  = :table_name
ORDER  BY owner, synonym_name;
```

Synonyms become broken (INVALID) after the table is dropped. These are not automatically removed.

## Checking for Scheduler Jobs Referencing the Object

Jobs that query or DML the table will fail at next run if the table is dropped.

```sql
-- Jobs in the schema (check job_action for table references)
SELECT job_name, job_type, job_action, enabled, state, last_run_duration
FROM   all_scheduler_jobs
WHERE  owner = :schema
ORDER  BY job_name;

-- Search job actions for the table name (case-insensitive text search)
SELECT job_name, job_action
FROM   all_scheduler_jobs
WHERE  owner      = :schema
  AND  UPPER(job_action) LIKE '%' || UPPER(:table_name) || '%';
```

Note: This is a text search over job_action and may have false positives. Always review results.

## Checking for Materialized Views Based on the Table

```sql
-- Materialized views that have the table as a master (fast refresh dependency)
SELECT mview_name, owner, refresh_method, refresh_mode, last_refresh_date
FROM   all_mviews
WHERE  owner = :schema;

-- Check ALL_MVIEW_LOGS (already covered in TRUNCATE section, but also relevant for DROP)
SELECT log_owner, log_table, master
FROM   all_mview_logs
WHERE  log_owner = :schema
  AND  master    = :table_name;

-- Check ALL_DEPENDENCIES for any MV that references this table
SELECT name AS mview_name, owner
FROM   all_dependencies
WHERE  referenced_owner = :schema
  AND  referenced_name  = :table_name
  AND  type             = 'MATERIALIZED VIEW';
```

## Safe DROP Sequence

1. Snapshot DDL (DBMS_METADATA)
2. Check dependent objects (ALL_DEPENDENCIES)
2a. Check grants (ALL_TAB_PRIVS)
2b. Check synonyms (ALL_SYNONYMS)
2c. Check scheduler jobs (ALL_SCHEDULER_JOBS)
3. Check child foreign keys (ALL_CONSTRAINTS)
3a. Check materialized views (ALL_MVIEWS, ALL_MVIEW_LOGS)
4. Check active locks (V$LOCK)
5. Count rows
6. Present findings to user and get confirmation
7. Execute `DROP TABLE ... ` (not PURGE — keep recycle bin)
8. Log the operation

## Best Practices

- Always capture DDL via `DBMS_METADATA.GET_DDL` before any DROP — store it in a log table or output it to the user
- Never use `DROP TABLE ... PURGE` from an agent — always allow recycle bin recovery
- Never use TRUNCATE from an agent — use DELETE within a transaction so it can be rolled back
- Run dependent object checks before DROP — a table with 5 dependent views will invalidate them all silently
- Present row counts, dependent object counts, and lock status to the user before proceeding
- For schema-level operations (`DROP USER ... CASCADE`), always escalate to a human DBA

## Common Mistakes

**Dropping without checking dependencies** — `DROP TABLE` silently invalidates views, materialized views, and synonyms that reference it. Always check `ALL_DEPENDENCIES` first.

**Using TRUNCATE thinking it's "like DELETE"** — TRUNCATE cannot be rolled back, does not fire row-level triggers, and resets the high-water mark. It is a DDL statement, not DML.

**Assuming recycle bin is always enabled** — `RECYCLEBIN = OFF` is a valid instance setting. Check `SHOW PARAMETER RECYCLEBIN` before relying on it.

**Not checking for enabled foreign keys** — if child records exist, `DROP TABLE` with `CASCADE CONSTRAINTS` silently drops the FK; without it, the command fails. Either way, the agent should flag this.

## Oracle Version Notes (19c vs 26ai)

- **19c and later**: All patterns apply; FLASHBACK TABLE, recycle bin, DBMS_METADATA available since 10g
- **26ai**: No new destructive operation primitives; MCP server integration adds a natural human-in-the-loop confirmation layer for agent operations

## See Also

- [Safe DML Patterns](../agent/safe-dml-patterns.md) — Guards for UPDATE, DELETE, INSERT
- [Schema Discovery Queries](../agent/schema-discovery.md) — How to inspect ALL_DEPENDENCIES, ALL_CONSTRAINTS
- [ORA- Error Catalog](../agent/ora-error-catalog.md) — Handling errors from constraint violations

## Sources

- [Oracle Database 19c SQL Language Reference — DROP TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/DROP-TABLE.html)
- [Oracle Database 19c Administrator's Guide — Recycle Bin](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/managing-tables.html#GUID-C5DCB7CF-3DBE-4572-9C55-3D7D03AB3E2E)
- [DBMS_METADATA Package Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_METADATA.html)
