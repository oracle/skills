# Schema Discovery Queries for Agents

Before an agent generates SQL or makes schema changes, it should introspect the database to understand what exists. This skill provides the recommended query sequence for agent startup and schema exploration.

## Agent Startup Sequence

Run these queries at the start of any session to understand the context:

```sql
-- 1. Who am I and what database am I connected to?
SELECT SYS_CONTEXT('USERENV', 'SESSION_USER')   AS current_user,
       SYS_CONTEXT('USERENV', 'DB_NAME')         AS db_name,
       SYS_CONTEXT('USERENV', 'CON_NAME')        AS container_name,
       SYS_CONTEXT('USERENV', 'CDB_NAME')        AS cdb_name,
       SYS_CONTEXT('USERENV', 'SERVER_HOST')     AS host
FROM   DUAL;

-- 2. What version of Oracle am I running?
SELECT banner FROM v$version WHERE banner LIKE 'Oracle%';
-- Or more structured:
SELECT version, version_full FROM v$instance;

-- 3. Am I in a CDB or a PDB?
SELECT cdb FROM v$database;
SELECT name, open_mode, con_id FROM v$pdbs;  -- only works if DBA or connected to CDB root
```

## Discovering Schemas and Tables

```sql
-- All schemas (users) in the database
SELECT username, account_status, created, default_tablespace
FROM   dba_users
WHERE  account_status = 'OPEN'
  AND  username NOT IN ('SYS','SYSTEM','OUTLN','DBSNMP','APPQOSSYS',
                        'AUDSYS','CTXSYS','DVSYS','GSMADMIN_INTERNAL',
                        'LBACSYS','MDSYS','OJVMSYS','OLAPSYS','ORDDATA',
                        'ORDSYS','WMSYS','XDB')
ORDER  BY username;

-- All tables visible to the current user
SELECT owner, table_name, num_rows, last_analyzed
FROM   all_tables
WHERE  owner NOT IN ('SYS','SYSTEM','MDSYS','CTXSYS','ORDDATA','ORDSYS','XDB')
ORDER  BY owner, table_name;

-- Tables in a specific schema
SELECT table_name, num_rows, last_analyzed,
       row_movement, partitioned, iot_type
FROM   all_tables
WHERE  owner = :schema
ORDER  BY table_name;
```

## Discovering Columns

```sql
-- All columns for a table with types, nullability, defaults
SELECT column_id,
       column_name,
       data_type ||
         CASE WHEN data_type IN ('VARCHAR2','NVARCHAR2','CHAR')
              THEN '(' || data_length || ')'
              WHEN data_type = 'NUMBER' AND data_precision IS NOT NULL
              THEN '(' || data_precision ||
                   CASE WHEN data_scale > 0 THEN ',' || data_scale END || ')'
              ELSE NULL END AS full_type,
       nullable,
       data_default,
       virtual_column
FROM   all_tab_columns
WHERE  owner      = :schema
  AND  table_name = :table_name
ORDER  BY column_id;
```

## Discovering Constraints

```sql
-- Primary keys
SELECT c.constraint_name, cc.column_name, cc.position
FROM   all_constraints c
JOIN   all_cons_columns cc
  ON   c.owner = cc.owner AND c.constraint_name = cc.constraint_name
WHERE  c.owner      = :schema
  AND  c.table_name = :table_name
  AND  c.constraint_type = 'P'
ORDER  BY cc.position;

-- Foreign keys (with referenced table)
SELECT c.constraint_name,
       cc.column_name,
       c.r_owner AS ref_owner,
       rc.table_name AS ref_table,
       rcc.column_name AS ref_column,
       c.delete_rule,
       c.status
FROM   all_constraints c
JOIN   all_cons_columns cc  ON c.owner = cc.owner AND c.constraint_name = cc.constraint_name
JOIN   all_constraints rc   ON c.r_owner = rc.owner AND c.r_constraint_name = rc.constraint_name
JOIN   all_cons_columns rcc ON rc.owner = rcc.owner AND rc.constraint_name = rcc.constraint_name
WHERE  c.owner      = :schema
  AND  c.table_name = :table_name
  AND  c.constraint_type = 'R'
ORDER  BY c.constraint_name, cc.position;

-- Unique constraints and check constraints
SELECT constraint_name, constraint_type, search_condition, status
FROM   all_constraints
WHERE  owner      = :schema
  AND  table_name = :table_name
  AND  constraint_type IN ('U', 'C')
ORDER  BY constraint_type, constraint_name;
```

## Discovering Indexes

```sql
-- All indexes on a table with column details
SELECT i.index_name,
       i.index_type,       -- 'VECTOR (HNSW)' or 'VECTOR (IVF)' in 26ai
       i.uniqueness,
       i.status,
       LISTAGG(ic.column_name, ', ')
         WITHIN GROUP (ORDER BY ic.column_position) AS columns
FROM   all_indexes i
JOIN   all_ind_columns ic
  ON   i.owner = ic.index_owner AND i.index_name = ic.index_name
WHERE  i.owner      = :schema
  AND  i.table_name = :table_name
GROUP  BY i.index_name, i.index_type, i.uniqueness, i.status
ORDER  BY i.index_name;

-- 26ai: Vector indexes are in ALL_VECTOR_INDEXES (not ALL_INDEXES)
-- ALL_INDEXES.index_type will show 'VECTOR (HNSW)' or 'VECTOR (IVF)' but
-- List vector indexes owned by the current schema
SELECT index_name,
       index_type,
       index_subtype,
       table_name,
       status
FROM   user_indexes
WHERE  index_type = 'VECTOR'
ORDER  BY index_name;

-- If you have access, inspect runtime vector-index metadata
SELECT index_name,
       num_vectors,
       default_accuracy,
       accuracy_num_neighbors
FROM   v$vector_index
ORDER  BY index_name;
```

## Discovering Views, Procedures, Functions, Packages

```sql
-- Views
SELECT view_name FROM all_views WHERE owner = :schema ORDER BY view_name;

-- View definition
SELECT text FROM all_views WHERE owner = :schema AND view_name = :view;

-- 26ai: JSON Duality Views (introduced 23ai) — special view type surfaced via ALL_DUALITY_VIEWS
SELECT duality_view_name,
       base_table_name,
       root_table_owner
FROM   all_duality_views    -- 26ai
WHERE  owner = :schema
ORDER  BY duality_view_name;

-- Stored procedures, functions, packages
-- 26ai: object_type can include 'MLE MODULE', 'SQL MACRO'
SELECT object_name, object_type, status, last_ddl_time
FROM   all_objects
WHERE  owner       = :schema
  AND  object_type IN ('PROCEDURE','FUNCTION','PACKAGE','PACKAGE BODY','TRIGGER',
                       'MLE MODULE','SQL MACRO')  -- 26ai adds MLE MODULE, SQL MACRO
  AND  status      = 'VALID'
ORDER  BY object_type, object_name;
```

## Discovering Sequences

```sql
SELECT sequence_name, min_value, max_value, increment_by,
       cycle_flag, cache_size, last_number
FROM   all_sequences
WHERE  sequence_owner = :schema
ORDER  BY sequence_name;
```

## Discovering Triggers

```sql
-- All triggers on a table
SELECT trigger_name, trigger_type, triggering_event, status,
       action_type, when_clause
FROM   all_triggers
WHERE  owner      = :schema
  AND  table_name = :table_name
ORDER  BY trigger_name;

-- Trigger body
SELECT trigger_body
FROM   all_triggers
WHERE  owner       = :schema
  AND  trigger_name = :trigger_name;

-- Find invalid triggers that need recompiling
SELECT owner, trigger_name, table_name, status
FROM   all_triggers
WHERE  owner   = :schema
  AND  status  = 'DISABLED';
-- Note: INVALID triggers appear via ALL_OBJECTS with status = 'INVALID'
SELECT object_name AS trigger_name, status, last_ddl_time
FROM   all_objects
WHERE  owner       = :schema
  AND  object_type = 'TRIGGER'
  AND  status      = 'INVALID';
```

## Discovering Synonyms

```sql
-- Private synonyms owned by a schema
SELECT synonym_name, table_owner, table_name, db_link
FROM   all_synonyms
WHERE  owner = :schema
ORDER  BY synonym_name;

-- Public synonyms pointing to a schema's objects
SELECT synonym_name, table_owner, table_name
FROM   all_synonyms
WHERE  owner       = 'PUBLIC'
  AND  table_owner = :schema
ORDER  BY synonym_name;

-- Broken synonyms (target no longer exists)
SELECT s.owner, s.synonym_name, s.table_owner, s.table_name
FROM   all_synonyms s
WHERE  s.owner = :schema
  AND  NOT EXISTS (
    SELECT 1 FROM all_objects o
    WHERE  o.owner       = s.table_owner
      AND  o.object_name = s.table_name
  );
```

## Discovering Database Links

```sql
-- DB links accessible to the current user
SELECT db_link, username, host, created
FROM   all_db_links
WHERE  owner = :schema
ORDER  BY db_link;

-- Public DB links
SELECT db_link, username, host, created
FROM   all_db_links
WHERE  owner = 'PUBLIC'
ORDER  BY db_link;

-- Test a DB link (requires privilege)
SELECT * FROM dual@:db_link_name;
-- Note: :db_link_name cannot be a bind variable — use with a known, validated DB link name
```

## Discovering Directories

```sql
-- Oracle directory objects (used for external tables, UTL_FILE, BFILE, Data Pump)
SELECT directory_name, directory_path
FROM   all_directories
ORDER  BY directory_name;

-- Check if current user has read/write on a directory
SELECT privilege
FROM   all_tab_privs
WHERE  table_name = :directory_name
  AND  grantee    IN (SELECT username FROM user_users
                      UNION
                      SELECT granted_role FROM session_roles);
```

## Finding Invalid Objects

```sql
-- All invalid objects in a schema
SELECT object_name, object_type, last_ddl_time
FROM   all_objects
WHERE  owner       = :schema
  AND  status      = 'INVALID'
ORDER  BY object_type, object_name;

-- Recompile all invalid objects in a schema (requires EXECUTE on DBMS_UTILITY)
BEGIN
  DBMS_UTILITY.COMPILE_SCHEMA(schema => :schema, compile_all => FALSE);
END;
/
-- compile_all => FALSE recompiles only INVALID objects
-- After recompile, check remaining invalids:
SELECT COUNT(*) AS still_invalid
FROM   all_objects
WHERE  owner  = :schema
  AND  status = 'INVALID';
```

## Discovering Scheduler Jobs

```sql
-- All jobs in a schema
SELECT job_name, job_type, job_action,
       enabled, state, repeat_interval,
       last_start_date, last_run_duration, next_run_date
FROM   all_scheduler_jobs
WHERE  owner = :schema
ORDER  BY job_name;

-- Recently failed jobs
SELECT job_name, log_date, status, error#, additional_info
FROM   all_scheduler_job_log
WHERE  owner   = :schema
  AND  status  = 'FAILED'
  AND  log_date > SYSTIMESTAMP - INTERVAL '7' DAY
ORDER  BY log_date DESC;

-- Running jobs right now
SELECT job_name, session_id, running_instance, elapsed_time
FROM   all_scheduler_running_jobs
WHERE  owner = :schema;
```

## Discovering Partitioned Tables

```sql
-- Tables that are partitioned
SELECT table_name, partitioning_type, subpartitioning_type,
       partition_count, def_subpartition_count
FROM   all_part_tables
WHERE  owner = :schema
ORDER  BY table_name;

-- Partitions of a specific table with size info
SELECT partition_name, partition_position, high_value,
       num_rows, blocks, last_analyzed
FROM   all_tab_partitions
WHERE  table_owner = :schema
  AND  table_name  = :table_name
ORDER  BY partition_position;

-- Which partition would a given value land in?
-- (Use DBMS_ROWID or query-based; most practical approach is to query with partition pruning)
-- Example: see the partition for a specific date range
SELECT partition_name
FROM   all_tab_partitions
WHERE  table_owner = :schema
  AND  table_name  = :table_name
  AND  UPPER(high_value) > :value_upper_bound
FETCH  FIRST 1 ROW ONLY;
```

## Checking Privileges Before Running Operations

```sql
-- What system privileges do I have?
SELECT privilege FROM session_privs ORDER BY privilege;

-- Can I create tables in this schema?
SELECT COUNT(*) FROM session_privs WHERE privilege = 'CREATE TABLE';

-- Do I have SELECT on this specific table?
SELECT COUNT(*)
FROM   all_tab_privs
WHERE  grantee    IN (SELECT username FROM user_users
                      UNION
                      SELECT granted_role FROM session_roles)
  AND  owner      = :schema
  AND  table_name = :table_name
  AND  privilege  = 'SELECT';
```

## Getting Row Count Estimates

```sql
-- Fast estimate (uses optimizer stats — may be stale)
SELECT num_rows, last_analyzed
FROM   all_tables
WHERE  owner = :schema AND table_name = :table_name;

-- Exact count (slow on large tables — use sparingly)
-- Identifiers cannot be bind variables; use DBMS_ASSERT to validate before interpolating
DECLARE
  v_count NUMBER;
BEGIN
  EXECUTE IMMEDIATE
    'SELECT COUNT(*) FROM '
    || DBMS_ASSERT.SCHEMA_NAME(:schema)      -- raises ORA-44001 if schema doesn't exist
    || '.'
    || DBMS_ASSERT.SIMPLE_SQL_NAME(:table_name)  -- raises ORA-44003 if not a valid identifier
    INTO v_count;
  DBMS_OUTPUT.PUT_LINE(v_count);
END;
/

-- Check if stats are stale
SELECT table_name, num_rows, last_analyzed,
       CASE WHEN last_analyzed < SYSDATE - 7 THEN 'STALE' ELSE 'FRESH' END AS stats_status
FROM   all_tables
WHERE  owner = :schema
ORDER  BY last_analyzed NULLS FIRST;
```

## Full Schema Summary Query

Run this to get a bird's-eye view of a schema before starting work:

```sql
SELECT object_type,
       COUNT(*)     AS object_count,
       SUM(CASE WHEN status = 'VALID'   THEN 1 ELSE 0 END) AS valid,
       SUM(CASE WHEN status = 'INVALID' THEN 1 ELSE 0 END) AS invalid
FROM   all_objects
WHERE  owner = :schema
  AND  object_type NOT IN ('INDEX','INDEX PARTITION','TABLE PARTITION',
                           'TABLE SUBPARTITION','LOB','LOB PARTITION')
GROUP  BY object_type
ORDER  BY object_type;
```

## Oracle 26ai: Additional Object Types

Oracle 26ai (and 23ai) introduce several object types that agents should be aware of when introspecting a schema.

### VECTOR Columns

```sql
-- Find all tables with VECTOR columns in a schema  -- 26ai
SELECT table_name,
       column_name,
       data_type,           -- 'VECTOR'
       data_length          -- dimension count
FROM   all_tab_columns
WHERE  owner     = :schema
  AND  data_type = 'VECTOR'
ORDER  BY table_name, column_id;

-- BOOLEAN columns (native type, introduced 23ai)  -- 26ai
SELECT table_name, column_name
FROM   all_tab_columns
WHERE  owner     = :schema
  AND  data_type = 'BOOLEAN'
ORDER  BY table_name, column_id;
```

### Domains

```sql
-- List all domains in a schema  -- 26ai
SELECT domain_name,
       data_type,
       data_length,
       data_precision,
       nullable,
       num_constraints
FROM   all_domains          -- 26ai
WHERE  owner = :schema
ORDER  BY domain_name;

-- Which columns use a domain?  -- 26ai
SELECT table_name,
       column_name,
       domain_owner,
       domain_name
FROM   all_tab_columns
WHERE  owner       = :schema
  AND  domain_name IS NOT NULL
ORDER  BY table_name, column_id;
```

### SQL Macros

```sql
-- List SQL Macros (table and scalar)  -- 26ai
SELECT object_name,
       object_type,    -- 'SQL MACRO'
       status,
       last_ddl_time
FROM   all_objects
WHERE  owner       = :schema
  AND  object_type = 'SQL MACRO'
ORDER  BY object_name;
```

### MLE (Multilingual Engine) JavaScript Modules

```sql
-- List MLE JavaScript modules  -- 26ai
SELECT module_name,
       language_name,  -- 'JAVASCRIPT'
       status
FROM   all_mle_modules  -- 26ai
WHERE  owner = :schema
ORDER  BY module_name;

-- MLE environments
SELECT env_name, imports
FROM   all_mle_envs     -- 26ai
WHERE  owner = :schema
ORDER  BY env_name;
```

### Property Graphs

```sql
-- List property graphs  -- 26ai (introduced 23ai)
SELECT graph_name, status
FROM   all_property_graphs  -- 26ai
WHERE  owner = :schema
ORDER  BY graph_name;
```

### Annotations (Column and Table Metadata)

```sql
-- Table-level annotations  -- 26ai
SELECT object_name   AS table_name,
       annotation_name,
       annotation_value
FROM   all_annotations
WHERE  owner       = :schema
  AND  object_type = 'TABLE'
ORDER  BY object_name, annotation_name;

-- Column-level annotations  -- 26ai
SELECT object_name   AS table_name,
       column_name,
       annotation_name,
       annotation_value
FROM   all_annotations
WHERE  owner       = :schema
  AND  object_type = 'COLUMN'
ORDER  BY object_name, column_name, annotation_name;
```

### AI Profiles

```sql
-- AI profiles visible to the current user  -- 26ai
SELECT profile_name,
       provider,
       status
FROM   user_cloud_ai_profiles  -- 26ai
ORDER  BY profile_name;
```

### Full 26ai Schema Summary

Extend the standard schema summary to include 26ai object types:

```sql
-- 26ai extended schema summary
SELECT object_type,
       COUNT(*)     AS object_count,
       SUM(CASE WHEN status = 'VALID'   THEN 1 ELSE 0 END) AS valid,
       SUM(CASE WHEN status = 'INVALID' THEN 1 ELSE 0 END) AS invalid
FROM   all_objects
WHERE  owner = :schema
  AND  object_type NOT IN ('INDEX','INDEX PARTITION','TABLE PARTITION',
                           'TABLE SUBPARTITION','LOB','LOB PARTITION')
GROUP  BY object_type
ORDER  BY object_type;
-- In 26ai, expect to see: MLE MODULE, SQL MACRO, PROPERTY GRAPH in the results
```

## Best Practices

- Always run the startup sequence at the beginning of a session to confirm the database context
- Use `ALL_*` views (not `DBA_*`) to respect the current user's access level; fall back to `DBA_*` only if the user has DBA privileges
- Cache schema metadata within a session to avoid repeated dictionary queries
- Pass identifier names exactly as they appear in the data dictionary — unquoted identifiers are stored uppercase (`EMPLOYEES`), but quoted identifiers (`"MyTable"`) are stored as-is; never silently apply `UPPER()` to a user-supplied name
- Check `num_rows` and `last_analyzed` before generating queries on large tables — stale stats mislead the optimizer
- Use `ALL_DEPENDENCIES` to understand object relationships before proposing changes
- Check `ALL_OBJECTS` for invalid objects (status = 'INVALID') before generating code that depends on views, procedures, or triggers
- For partitioned tables, always inspect `ALL_TAB_PARTITIONS` to understand data layout before writing range-based queries

## Oracle Version Notes (19c vs 26ai)

- **19c and later**: `ALL_TABLES`, `ALL_TAB_COLUMNS`, `ALL_CONSTRAINTS`, `ALL_INDEXES`, `ALL_OBJECTS`, `ALL_VIEWS`, `ALL_SEQUENCES`, `SESSION_PRIVS` — all available from 19c+
- **23ai (also in 26ai)**:
  - `VECTOR` data type — appears in `ALL_TAB_COLUMNS.data_type`
  - `BOOLEAN` native type — appears in `ALL_TAB_COLUMNS.data_type`
  - `ALL_VECTOR_INDEXES` — vector index metadata (HNSW, IVF, distance metric, accuracy)
  - `ALL_DUALITY_VIEWS` — JSON Relational Duality Views
  - `ALL_PROPERTY_GRAPHS` — SQL Property Graph objects
  - `ALL_DOMAINS` / `ALL_DOMAIN_CONSTRAINTS` — domain type definitions
  - `ALL_ANNOTATIONS` — table and column annotation metadata
  - `SQL MACRO` — new `object_type` value in `ALL_OBJECTS`
- **26ai**:
  - `ALL_MLE_MODULES`, `ALL_MLE_ENVS` — JavaScript (MLE) module and environment discovery
  - `USER_CLOUD_AI_PROFILES` / `DBA_CLOUD_AI_PROFILES` — SELECT AI profile visibility
  - `ALL_INDEXES.index_type` returns `'VECTOR (HNSW)'` or `'VECTOR (IVF)'` for vector indexes
  - `MLE MODULE` — new `object_type` value in `ALL_OBJECTS`

## See Also

- [NL to SQL Mapping Patterns](../agent/nl-to-sql-patterns.md) — Translating user questions to SQL
- [Safe DML Patterns](../agent/safe-dml-patterns.md) — Safety checks before modifying data
- [Destructive Operation Guards](../agent/destructive-op-guards.md) — Checks before DROP/TRUNCATE

## Sources

- [Oracle Database 19c Reference — ALL_TABLES](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/ALL_TABLES.html)
- [Oracle Database 19c Reference — ALL_TAB_COLUMNS](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/ALL_TAB_COLUMNS.html)
- [Oracle Database 19c Reference — ALL_CONSTRAINTS](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/ALL_CONSTRAINTS.html)
