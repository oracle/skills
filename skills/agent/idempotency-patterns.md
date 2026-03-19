# Idempotency Patterns for Agent-Generated SQL

An idempotent operation produces the same result whether it is run once or multiple times. Agents must generate idempotent SQL because they may retry on failure, be called multiple times by orchestration systems, or encounter partial failures mid-execution.

## MERGE Instead of INSERT (Upsert Pattern)

The most important idempotency pattern. Replace `INSERT` with `MERGE` wherever a row might already exist.

```sql
-- NON-IDEMPOTENT — fails or duplicates on retry
INSERT INTO config (key, value, updated_at)
VALUES ('max_connections', '100', SYSTIMESTAMP);

-- IDEMPOTENT — safe to run multiple times
MERGE INTO config t
USING (SELECT 'max_connections' AS key,
              '100'             AS value,
              SYSTIMESTAMP      AS updated_at
       FROM DUAL) s
ON (t.key = s.key)
WHEN MATCHED THEN
  UPDATE SET t.value      = s.value,
             t.updated_at = s.updated_at
WHEN NOT MATCHED THEN
  INSERT (key, value, updated_at)
  VALUES (s.key, s.value, s.updated_at);
```

## CREATE TABLE IF NOT EXISTS Equivalent

Oracle does not have `CREATE TABLE IF NOT EXISTS`. Use exception handling or a data dictionary check.

```sql
-- Pattern 1: Check ALL_TABLES first (agent-friendly)
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   all_tables
  WHERE  owner      = :schema
    AND  table_name = 'MY_TABLE';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE '
      CREATE TABLE my_table (
        id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name  VARCHAR2(255) NOT NULL,
        created_at DATE DEFAULT SYSDATE
      )
    ';
  END IF;
END;
/

-- Pattern 2: Exception-based (more concise)
BEGIN
  EXECUTE IMMEDIATE 'CREATE TABLE my_table (id NUMBER PRIMARY KEY, name VARCHAR2(255))';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL;  -- ORA-00955: name already used
    ELSE RAISE;
    END IF;
END;
/
```

## CREATE OR REPLACE for Code Objects

Always use `CREATE OR REPLACE` for views, procedures, functions, packages, and triggers.

```sql
-- Idempotent view definition
CREATE OR REPLACE VIEW active_employees AS
SELECT employee_id, first_name, last_name, department_id, salary
FROM   employees
WHERE  hire_date IS NOT NULL;

-- Idempotent stored procedure
CREATE OR REPLACE PROCEDURE update_employee_salary (
  p_emp_id IN NUMBER,
  p_raise  IN NUMBER
) AS
BEGIN
  UPDATE employees SET salary = salary * (1 + p_raise / 100)
  WHERE  employee_id = p_emp_id;
END;
/

-- Idempotent package spec
CREATE OR REPLACE PACKAGE employee_pkg AS
  PROCEDURE hire(p_name VARCHAR2, p_dept_id NUMBER);
  FUNCTION  get_salary(p_emp_id NUMBER) RETURN NUMBER;
END employee_pkg;
/
```

## ADD COLUMN with Existence Check

```sql
-- Idempotent column addition
-- Identifiers must be validated with DBMS_ASSERT before interpolation into dynamic SQL
DECLARE
  v_count   NUMBER;
  v_schema  VARCHAR2(128) := DBMS_ASSERT.SCHEMA_NAME(:schema);
  v_table   VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:table_name);
  v_column  VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:column_name);
  -- :column_definition is a type expression (e.g. VARCHAR2(20) DEFAULT 'X')
  -- It cannot be validated by DBMS_ASSERT; validate via an allowlist in calling code
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   all_tab_columns
  WHERE  owner       = v_schema
    AND  table_name  = v_table
    AND  column_name = v_column;

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE ' || v_schema || '.' || v_table ||
                      ' ADD ' || v_column || ' ' || :column_definition;
  END IF;
END;
/
```

## CREATE INDEX with Existence Check

```sql
-- Idempotent index creation
DECLARE
  v_count   NUMBER;
  v_schema  VARCHAR2(128) := DBMS_ASSERT.SCHEMA_NAME(:schema);
  v_table   VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:table_name);
  v_index   VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:index_name);
  -- :columns is a comma-separated column list; each name must be validated individually
  -- For a single column:
  v_col1    VARCHAR2(128) := DBMS_ASSERT.SIMPLE_SQL_NAME(:column1);
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   all_indexes
  WHERE  owner      = v_schema
    AND  index_name = v_index;

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX ' || v_index ||
                      ' ON ' || v_schema || '.' || v_table ||
                      '(' || v_col1 || ')';
  END IF;
END;
/
```

## INSERT with Duplicate Key Handling

```sql
-- Pattern 1: IGNORE_ROW_ON_DUPKEY_INDEX hint
INSERT /*+ IGNORE_ROW_ON_DUPKEY_INDEX(t, t_pk) */
INTO   lookup_values t (code, description)
VALUES (:code, :description);

-- Pattern 2: Exception handler
BEGIN
  INSERT INTO lookup_values (code, description)
  VALUES (:code, :description);
EXCEPTION
  WHEN DUP_VAL_ON_INDEX THEN NULL;  -- already exists, skip
END;
/
```

## Idempotent Schema Migration Template

When agents run schema migrations, wrap every step in existence checks.

```sql
-- Migration: Add status column to orders table (idempotent)
DECLARE
  v_col_exists  NUMBER;
  v_idx_exists  NUMBER;
BEGIN
  -- Add column if not exists
  SELECT COUNT(*) INTO v_col_exists
  FROM   all_tab_columns
  WHERE  owner = 'MYAPP' AND table_name = 'ORDERS' AND column_name = 'STATUS';

  IF v_col_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE myapp.orders ADD status VARCHAR2(20) DEFAULT ''PENDING''';
  END IF;

  -- Add index if not exists
  SELECT COUNT(*) INTO v_idx_exists
  FROM   all_indexes
  WHERE  owner = 'MYAPP' AND index_name = 'ORDERS_STATUS_IDX';

  IF v_idx_exists = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX myapp.orders_status_idx ON myapp.orders(status)';
  END IF;
END;
/
```

## Sequence / Identity Idempotency

Sequences are always unique; identity columns are inherently idempotent for inserts (new ID each time). The risk is generating orphaned records on retry.

```sql
-- Use MERGE to prevent duplicate logical records even when using sequences
MERGE INTO products p
USING (SELECT :sku AS sku, :name AS name FROM DUAL) s
ON    (p.sku = s.sku)
WHEN NOT MATCHED THEN
  INSERT (product_id, sku, name)
  VALUES (product_seq.NEXTVAL, s.sku, s.name);
-- Natural key (sku) prevents duplicates; sequence gives unique PK
```

## Idempotent Trigger Creation

Oracle supports `CREATE OR REPLACE TRIGGER` from 11g onwards, making trigger creation idempotent without additional guards.

```sql
-- Pattern 1: CREATE OR REPLACE works for triggers too (from 11g+)
CREATE OR REPLACE TRIGGER employees_audit_trg
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW
BEGIN
  -- trigger body
  INSERT INTO audit_log (action, table_name, row_id, changed_at)
  VALUES (
    CASE WHEN INSERTING THEN 'I' WHEN UPDATING THEN 'U' ELSE 'D' END,
    'EMPLOYEES',
    :OLD.employee_id,
    SYSTIMESTAMP
  );
END;
/

-- Check trigger status after creation
SELECT trigger_name, status
FROM   all_triggers
WHERE  owner = :schema AND trigger_name = 'EMPLOYEES_AUDIT_TRG';

-- Recompile if INVALID
ALTER TRIGGER employees_audit_trg COMPILE;
```

## Grant/Revoke Asymmetry

`GRANT` is idempotent — Oracle silently ignores a grant that already exists. `REVOKE` is not — it raises `ORA-01927` if the privilege was never granted. Wrap `REVOKE` in an exception handler or check before executing.

```sql
-- GRANT is idempotent — safe to run multiple times
GRANT SELECT ON employees TO reporting_role;

-- REVOKE is NOT idempotent — fails with ORA-01927 if not granted
-- Wrap in exception handler for idempotent revoke:
BEGIN
  EXECUTE IMMEDIATE 'REVOKE SELECT ON employees FROM reporting_role';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -1927 THEN NULL;  -- ORA-01927: cannot REVOKE privileges you did not grant
    ELSE RAISE;
    END IF;
END;
/

-- Or check before revoking:
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   all_tab_privs
  WHERE  owner      = 'HR'
    AND  table_name = 'EMPLOYEES'
    AND  grantee    = 'REPORTING_ROLE'
    AND  privilege  = 'SELECT';

  IF v_count > 0 THEN
    EXECUTE IMMEDIATE 'REVOKE SELECT ON hr.employees FROM reporting_role';
  END IF;
END;
/
```

## Idempotent Synonym Creation

`CREATE OR REPLACE SYNONYM` is idempotent. When that form is unavailable (e.g., inside a conditional block that must not replace an existing synonym), use an existence check.

```sql
-- Public synonym (requires CREATE PUBLIC SYNONYM privilege)
CREATE OR REPLACE PUBLIC SYNONYM employees FOR hr.employees;

-- Private synonym
CREATE OR REPLACE SYNONYM emp FOR hr.employees;

-- Idempotent synonym creation with existence check (when CREATE OR REPLACE is not available)
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   all_synonyms
  WHERE  owner        = :schema
    AND  synonym_name = 'EMP';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE SYNONYM ' || DBMS_ASSERT.SCHEMA_NAME(:schema) ||
                      '.emp FOR hr.employees';
  END IF;
END;
/
```

## Schema Migrations Tracking Table

For multi-step migrations, record each completed step in a tracking table so retries skip work that already succeeded. This is the same approach used by Liquibase (`DATABASECHANGELOG`) and Flyway (`flyway_schema_history`).

```sql
-- Create the tracking table once (idempotent)
BEGIN
  EXECUTE IMMEDIATE '
    CREATE TABLE schema_migrations (
      migration_id   VARCHAR2(255) NOT NULL PRIMARY KEY,
      applied_at     TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
      applied_by     VARCHAR2(128) DEFAULT SYS_CONTEXT(''USERENV'',''SESSION_USER'') NOT NULL,
      description    VARCHAR2(4000)
    )
  ';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -955 THEN NULL; ELSE RAISE; END IF;
END;
/

-- Check if a migration step has already run
CREATE OR REPLACE FUNCTION migration_applied(p_id IN VARCHAR2) RETURN BOOLEAN AS
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM schema_migrations WHERE migration_id = p_id;
  RETURN v_count > 0;
END;
/

-- Migration step template
DECLARE
  c_id CONSTANT VARCHAR2(255) := '20240315_001_add_status_to_orders';
BEGIN
  IF NOT migration_applied(c_id) THEN
    -- Run the migration step
    EXECUTE IMMEDIATE 'ALTER TABLE orders ADD status VARCHAR2(20) DEFAULT ''PENDING''';
    EXECUTE IMMEDIATE 'CREATE INDEX orders_status_idx ON orders(status)';

    -- Record completion
    INSERT INTO schema_migrations (migration_id, description)
    VALUES (c_id, 'Add status column and index to orders table');
    COMMIT;
  END IF;
END;
/
```

Rolling your own tracking table gives the same idempotency guarantee as Liquibase or Flyway without requiring external tooling.

## Best Practices

- Default to `MERGE` for any INSERT that might be retried
- Default to `CREATE OR REPLACE` for all PL/SQL objects and views
- Always check `ALL_TAB_COLUMNS` before `ALTER TABLE ... ADD COLUMN`
- Always check `ALL_INDEXES` before `CREATE INDEX`
- Track migration state in a schema_migrations table so completed steps are skipped on retry
- Use `EXECUTE IMMEDIATE` with existence checks for DDL inside PL/SQL blocks

## Common Mistakes

**INSERT in a loop without duplicate handling** — if the agent retries the loop after a failure at row 500, rows 1–500 get ORA-00001. Use MERGE or exception handling.

**CREATE TABLE without existence check** — ORA-00955 on retry halts the migration. Always check first.

**Using DELETE + INSERT instead of MERGE** — delete-then-insert is not idempotent if the delete succeeds but the insert fails (row disappears). Use MERGE.

**Relying on SEQUENCE.NEXTVAL in idempotent code** — each retry consumes a sequence number and creates a new ID. Use a natural key in the MERGE ON clause to prevent duplicate logical records.

## Oracle Version Notes (19c vs 26ai)

- **19c and later**: All patterns in this skill are available; MERGE, CREATE OR REPLACE, IGNORE_ROW_ON_DUPKEY_INDEX, existence-check patterns all work from 19c+
- **26ai**: No new idempotency primitives; Liquibase/Flyway integrations (via SQLcl) provide higher-level migration idempotency tracking

## See Also

- [Safe DML Patterns](../agent/safe-dml-patterns.md) — SAVEPOINT, dry run, count before delete
- [Schema Migrations with Liquibase and Flyway](../devops/schema-migrations.md) — Migration framework idempotency tracking
- [PL/SQL Error Handling](../plsql/plsql-error-handling.md) — Exception handling for DUP_VAL_ON_INDEX

## Sources

- [Oracle Database 19c SQL Language Reference — MERGE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/MERGE.html)
- [Oracle Database 19c SQL Language Reference — CREATE OR REPLACE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-VIEW.html)
