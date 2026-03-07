# Schema Migrations for Oracle DB

## Overview

Schema migrations are the mechanism by which database structure evolves alongside application code. In a CI/CD pipeline, every DDL change — table creation, column additions, index definitions, constraint changes — must be tracked, versioned, and deployable in a repeatable, auditable way. Ad hoc DDL executed directly against production databases is one of the leading causes of environment drift, deployment failures, and outages.

Oracle's character set, data type richness, and procedural extensions (PL/SQL, sequences, triggers, packages) introduce migration-specific challenges that MySQL-centric tools paper over. This guide covers Liquibase and Flyway configured specifically for Oracle, migration strategies, and the DDL lifecycle in modern CI/CD pipelines.

---

## Liquibase with Oracle

### Core Concepts

Liquibase tracks migrations through a **changelog** — a master file that references individual **changesets**. Each changeset is identified by an `id` + `author` + `file` triple, recorded in the `DATABASECHANGELOG` table that Liquibase creates on first run. A `DATABASECHANGELOGLOCK` table prevents concurrent runs.

```
DATABASECHANGELOG
  ID           VARCHAR2(255)
  AUTHOR       VARCHAR2(255)
  FILENAME     VARCHAR2(255)
  DATEEXECUTED TIMESTAMP
  ORDEREXECUTED NUMBER
  EXECTYPE     VARCHAR2(10)   -- EXECUTED, FAILED, SKIPPED, RERAN, MARK_RAN
  MD5SUM       VARCHAR2(35)
  DESCRIPTION  VARCHAR2(255)
  COMMENTS     VARCHAR2(255)
  TAG          VARCHAR2(255)
  LIQUIBASE    VARCHAR2(20)
  CONTEXTS     VARCHAR2(255)
  LABELS       VARCHAR2(255)
  DEPLOYMENT_ID VARCHAR2(10)
```

### Project Structure

A well-organized Liquibase project separates concerns by object type:

```
db/
  liquibase.properties
  changelog-root.xml
  changes/
    001-initial-schema.xml
    002-add-customer-status.xml
    003-orders-partitioning.xml
  procedures/
    pkg_orders_body.sql
    pkg_orders_spec.sql
  seeds/
    001-reference-data.xml
```

### liquibase.properties (Oracle)

```properties
# liquibase.properties
url=jdbc:oracle:thin:@//dbhost:1521/ORCLPDB1
username=APP_OWNER
password=${DB_PASSWORD}
driver=oracle.jdbc.OracleDriver
changeLogFile=db/changelog-root.xml
logLevel=INFO
defaultSchemaName=APP_OWNER
liquibaseCatalogName=APP_OWNER
```

For Oracle Wallets (recommended for CI/CD):

```properties
url=jdbc:oracle:thin:@mydb_high?TNS_ADMIN=/opt/wallet
username=${DB_USER}
password=${DB_PASSWORD}
```

### Changeset Anatomy

```xml
<!-- db/changelog-root.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

  <include file="changes/001-initial-schema.xml" relativeToChangelogFile="true"/>
  <include file="changes/002-add-customer-status.xml" relativeToChangelogFile="true"/>
  <include file="changes/003-orders-partitioning.xml" relativeToChangelogFile="true"/>

</databaseChangeLog>
```

```xml
<!-- db/changes/002-add-customer-status.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

  <changeSet id="002" author="jane.smith" labels="customer,status" context="!test">
    <comment>Add STATUS column to CUSTOMERS with lookup table</comment>

    <!-- Oracle-specific: use NUMBER(1) not BOOLEAN -->
    <addColumn tableName="CUSTOMERS">
      <column name="STATUS_CODE" type="VARCHAR2(10)" defaultValue="ACTIVE">
        <constraints nullable="false"/>
      </column>
    </addColumn>

    <addColumn tableName="CUSTOMERS">
      <column name="CREATED_AT" type="TIMESTAMP" defaultValueComputed="SYSTIMESTAMP">
        <constraints nullable="false"/>
      </column>
    </addColumn>

    <createTable tableName="CUSTOMER_STATUS_CODES">
      <column name="CODE"        type="VARCHAR2(10)"><constraints primaryKey="true" nullable="false"/></column>
      <column name="DESCRIPTION" type="VARCHAR2(100)"><constraints nullable="false"/></column>
      <column name="IS_ACTIVE"   type="NUMBER(1,0)" defaultValueNumeric="1"><constraints nullable="false"/></column>
    </createTable>

    <insert tableName="CUSTOMER_STATUS_CODES">
      <column name="CODE"        value="ACTIVE"/>
      <column name="DESCRIPTION" value="Active customer"/>
      <column name="IS_ACTIVE"   valueNumeric="1"/>
    </insert>

    <insert tableName="CUSTOMER_STATUS_CODES">
      <column name="CODE"        value="SUSPENDED"/>
      <column name="DESCRIPTION" value="Account suspended"/>
      <column name="IS_ACTIVE"   valueNumeric="1"/>
    </insert>

    <addForeignKeyConstraint
        baseTableName="CUSTOMERS"
        baseColumnNames="STATUS_CODE"
        referencedTableName="CUSTOMER_STATUS_CODES"
        referencedColumnNames="CODE"
        constraintName="FK_CUST_STATUS"/>

    <rollback>
      <dropForeignKeyConstraint baseTableName="CUSTOMERS" constraintName="FK_CUST_STATUS"/>
      <dropColumn tableName="CUSTOMERS" columnName="STATUS_CODE"/>
      <dropColumn tableName="CUSTOMERS" columnName="CREATED_AT"/>
      <dropTable tableName="CUSTOMER_STATUS_CODES"/>
    </rollback>
  </changeSet>

</databaseChangeLog>
```

### Oracle-Specific Data Types in Liquibase

Liquibase's generic types do not map cleanly to Oracle. Always use Oracle-native types explicitly:

| Generic Liquibase | Oracle Reality | Use Instead |
|---|---|---|
| `BOOLEAN` | Does not exist in Oracle | `NUMBER(1,0)` with CHECK (col IN (0,1)) |
| `BIGINT` | Maps to `NUMBER(19,0)` | `NUMBER(18,0)` or `NUMBER(19,0)` explicitly |
| `DATETIME` | Maps to `DATE` (loses sub-second) | `TIMESTAMP` or `TIMESTAMP WITH TIME ZONE` |
| `TEXT` | Maps to `CLOB` | `VARCHAR2(4000)` or `CLOB` depending on need |
| `INT` | Maps to `NUMBER(10,0)` | `NUMBER(10,0)` explicitly |

```xml
<!-- Prefer explicit Oracle types -->
<column name="PRICE"      type="NUMBER(12,4)"/>
<column name="CREATED_AT" type="TIMESTAMP WITH LOCAL TIME ZONE"/>
<column name="NOTES"      type="CLOB"/>
<column name="IS_ENABLED" type="NUMBER(1,0)"/>
```

### Sequences and Triggers with Liquibase

Pre-Oracle 12c, identity columns did not exist. Even post-12c, many codebases use sequence+trigger patterns.

```xml
<!-- Oracle 12c+ identity column -->
<changeSet id="010" author="dev">
  <createTable tableName="ORDERS">
    <column name="ORDER_ID" type="NUMBER(18,0)" autoIncrement="true"
            generationType="ALWAYS">
      <constraints primaryKey="true" nullable="false"/>
    </column>
    <column name="ORDER_DATE" type="DATE"/>
  </createTable>
</changeSet>

<!-- Pre-12c: explicit sequence + trigger -->
<changeSet id="010b" author="dev" dbms="oracle">
  <createSequence sequenceName="SEQ_ORDERS"
                  startValue="1"
                  incrementBy="1"
                  minValue="1"
                  maxValue="9999999999999999999"
                  cycle="false"
                  ordered="false"
                  cacheSize="20"/>

  <!-- Use sqlFile for complex PL/SQL -->
  <sqlFile path="triggers/trg_orders_bi.sql"
           relativeToChangelogFile="false"
           splitStatements="false"
           endDelimiter="/"
           stripComments="false"/>

  <rollback>
    <sql>DROP TRIGGER TRG_ORDERS_BI</sql>
    <dropSequence sequenceName="SEQ_ORDERS"/>
  </rollback>
</changeSet>
```

```sql
-- triggers/trg_orders_bi.sql
CREATE OR REPLACE TRIGGER TRG_ORDERS_BI
BEFORE INSERT ON ORDERS
FOR EACH ROW
WHEN (NEW.ORDER_ID IS NULL)
BEGIN
  :NEW.ORDER_ID := SEQ_ORDERS.NEXTVAL;
END;
/
```

### Running Liquibase

```shell
# Preview changes without executing (generates SQL to stdout)
liquibase updateSQL

# Apply pending changesets
liquibase update

# Apply only changesets tagged up to a specific point
liquibase updateToTag v2.3.0

# Tag the current state
liquibase tag v2.3.0

# Roll back to a tag
liquibase rollback v2.3.0

# Roll back a specific count of changesets
liquibase rollbackCount 3

# Check current status
liquibase status --verbose

# Validate changelog syntax
liquibase validate
```

---

## Flyway with Oracle

### Key Differences from Liquibase

Flyway uses a simpler, file-name-driven versioning scheme. Migration files are named `V{version}__{description}.sql` for versioned migrations and `R__{description}.sql` for repeatable migrations. There is no XML DSL — everything is raw SQL or Java callbacks.

```
db/migration/
  V1__initial_schema.sql
  V2__add_customer_status.sql
  V2.1__customer_status_fk.sql
  V3__orders_table.sql
  R__vw_active_customers.sql        -- repeatable
  R__pkg_order_processing.sql       -- repeatable (PL/SQL package)
```

### flyway.toml (Oracle)

```toml
[environments.default]
url = "jdbc:oracle:thin:@//dbhost:1521/ORCLPDB1"
user = "${DB_USER}"
password = "${DB_PASSWORD}"
schemas = ["APP_OWNER"]

[flyway]
locations = ["filesystem:db/migration"]
defaultSchema = "APP_OWNER"
validateOnMigrate = true
outOfOrder = false
# Required for PL/SQL blocks that end with /
sqlMigrationSuffixes = [".sql"]
placeholderReplacement = false
```

### Oracle PL/SQL in Flyway

Flyway's default statement delimiter is `;`. PL/SQL blocks require `/` as the terminator. Configure this per-migration using the special comment annotation:

```sql
-- V4__create_order_package.sql
-- flyway:delimiter=/

CREATE OR REPLACE PACKAGE PKG_ORDERS AS
  PROCEDURE process_order(p_order_id IN NUMBER);
  FUNCTION  get_order_total(p_order_id IN NUMBER) RETURN NUMBER;
END PKG_ORDERS;
/

CREATE OR REPLACE PACKAGE BODY PKG_ORDERS AS

  PROCEDURE process_order(p_order_id IN NUMBER) IS
    v_status VARCHAR2(10);
  BEGIN
    SELECT STATUS_CODE INTO v_status
    FROM   ORDERS
    WHERE  ORDER_ID = p_order_id;

    IF v_status = 'PENDING' THEN
      UPDATE ORDERS
      SET    STATUS_CODE  = 'PROCESSING',
             PROCESSED_AT = SYSTIMESTAMP
      WHERE  ORDER_ID = p_order_id;
    END IF;

    COMMIT;
  END process_order;

  FUNCTION get_order_total(p_order_id IN NUMBER) RETURN NUMBER IS
    v_total NUMBER;
  BEGIN
    SELECT SUM(LINE_TOTAL)
    INTO   v_total
    FROM   ORDER_LINES
    WHERE  ORDER_ID = p_order_id;
    RETURN NVL(v_total, 0);
  END get_order_total;

END PKG_ORDERS;
/
```

### Repeatable Migrations

Repeatable migrations re-run whenever their checksum changes. They are ideal for views, packages, synonyms, and grants — objects you want to fully replace rather than alter incrementally.

```sql
-- R__vw_active_customers.sql
-- This re-runs any time the file content changes

CREATE OR REPLACE VIEW VW_ACTIVE_CUSTOMERS AS
SELECT
    c.CUSTOMER_ID,
    c.FIRST_NAME,
    c.LAST_NAME,
    c.EMAIL,
    c.STATUS_CODE,
    cs.DESCRIPTION  AS STATUS_DESC,
    c.CREATED_AT
FROM
    CUSTOMERS       c
JOIN
    CUSTOMER_STATUS_CODES cs ON cs.CODE = c.STATUS_CODE
WHERE
    c.STATUS_CODE != 'CLOSED';
```

```sql
-- R__pkg_order_processing.sql
-- flyway:delimiter=/

CREATE OR REPLACE PACKAGE BODY PKG_ORDER_PROCESSING AS
  -- Full package body here; re-deployed on any change
END PKG_ORDER_PROCESSING;
/
```

### Running Flyway

```shell
# Check migration status
flyway info

# Apply pending migrations
flyway migrate

# Validate checksums (detects manual edits to applied migrations)
flyway validate

# Repair checksum mismatches (use carefully — only for broken environments)
flyway repair

# Undo last versioned migration (requires Flyway Teams)
flyway undo

# Clean schema (NEVER in production — drops all objects)
flyway clean
```

---

## Versioned vs Repeatable Migrations

| Aspect | Versioned (V prefix) | Repeatable (R prefix) |
|---|---|---|
| Execution | Once, in version order | On every checksum change |
| Rollback | Requires explicit undo migration | Simply revert file content |
| Use cases | Table/column DDL, data backfills | Views, packages, synonyms, grants |
| Ordering | Sequential, enforced | Runs after all versioned migrations |
| Collision | Two same-version files = error | Re-runs are idempotent |

### Guidelines

- DDL that modifies existing tables (ALTER TABLE) must be versioned — it cannot be repeated idempotently.
- Views, materialized view definitions, packages, procedures, and functions should be repeatable. This eliminates the common trap of having a `V12__fix_view.sql` that duplicates most of `V8__create_view.sql`.
- Reference data inserts should be versioned or use `MERGE` within repeatable migrations to achieve idempotency.

---

## Managing DDL in CI/CD Pipelines

### Pipeline Design

```yaml
# .github/workflows/db-deploy.yml
name: Database Deploy

on:
  push:
    branches: [main]
    paths:
      - 'db/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate Liquibase Changelog
        run: |
          liquibase \
            --url="${{ secrets.DB_DEV_URL }}" \
            --username="${{ secrets.DB_USER }}" \
            --password="${{ secrets.DB_PASSWORD }}" \
            validate

  deploy-dev:
    needs: validate
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: actions/checkout@v4

      - name: Generate migration SQL (artifact for review)
        run: |
          liquibase \
            --url="${{ secrets.DB_DEV_URL }}" \
            --username="${{ secrets.DB_USER }}" \
            --password="${{ secrets.DB_PASSWORD }}" \
            updateSQL > migration-dev.sql

      - uses: actions/upload-artifact@v4
        with:
          name: migration-sql-dev
          path: migration-dev.sql

      - name: Apply migrations to DEV
        run: |
          liquibase \
            --url="${{ secrets.DB_DEV_URL }}" \
            --username="${{ secrets.DB_USER }}" \
            --password="${{ secrets.DB_PASSWORD }}" \
            update

  deploy-prod:
    needs: deploy-dev
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Apply migrations to PROD
        run: |
          liquibase \
            --url="${{ secrets.DB_PROD_URL }}" \
            --username="${{ secrets.DB_USER }}" \
            --password="${{ secrets.DB_PASSWORD }}" \
            update
```

### Locking and Concurrency

Both Liquibase and Flyway use a lock table to prevent concurrent migration runs. In CI/CD environments with multiple parallel jobs or failed deployments, stale locks are common:

```sql
-- Liquibase: check and release a stale lock
SELECT * FROM DATABASECHANGELOGLOCK;

UPDATE DATABASECHANGELOGLOCK
SET    LOCKED      = 0,
       LOCKGRANTED = NULL,
       LOCKEDBY    = NULL
WHERE  ID = 1;

COMMIT;
```

```shell
# Flyway: release stale lock
flyway repair
```

### Environment-Specific Configuration

Never embed credentials in changelogs. Use environment variables or vault references:

```shell
# Shell pattern using environment variables
export LIQUIBASE_COMMAND_URL="jdbc:oracle:thin:@//${DB_HOST}:${DB_PORT}/${DB_SERVICE}"
export LIQUIBASE_COMMAND_USERNAME="${DB_USER}"
export LIQUIBASE_COMMAND_PASSWORD="${DB_PASSWORD}"
liquibase update
```

---

## Handling Sequences in Migrations

Sequences require special care because their current value is stateful — unlike structural DDL, a sequence's `LAST_NUMBER` cannot simply be rolled back.

```sql
-- Creating a sequence with Oracle best practices
CREATE SEQUENCE SEQ_INVOICE_ID
    START WITH     1
    INCREMENT BY   1
    MINVALUE       1
    MAXVALUE       9999999999999999999
    NOCYCLE
    CACHE          100    -- Cache 100 values in memory; balance performance vs gap size
    NOORDER;              -- ORDER only needed for RAC when strict ordering is required
```

```xml
<!-- Liquibase: sequence creation with rollback -->
<changeSet id="020" author="dev" dbms="oracle">
  <createSequence
      sequenceName="SEQ_INVOICE_ID"
      startValue="1"
      incrementBy="1"
      cacheSize="100"
      cycle="false"
      ordered="false"/>
  <rollback>
    <dropSequence sequenceName="SEQ_INVOICE_ID"/>
  </rollback>
</changeSet>
```

### Resetting Sequences in Non-Production

A common need is resetting sequences after data refreshes in lower environments:

```sql
-- Reset sequence to 1 (Oracle 18c+)
ALTER SEQUENCE SEQ_INVOICE_ID RESTART START WITH 1;

-- Pre-18c workaround: drop and recreate
DECLARE
  v_current NUMBER;
  v_stmt    VARCHAR2(200);
BEGIN
  SELECT LAST_NUMBER INTO v_current
  FROM   USER_SEQUENCES
  WHERE  SEQUENCE_NAME = 'SEQ_INVOICE_ID';

  -- Step down by current value to effectively reset
  v_stmt := 'ALTER SEQUENCE SEQ_INVOICE_ID INCREMENT BY -' || v_current || ' MINVALUE 0';
  EXECUTE IMMEDIATE v_stmt;
  EXECUTE IMMEDIATE 'SELECT SEQ_INVOICE_ID.NEXTVAL FROM DUAL';
  EXECUTE IMMEDIATE 'ALTER SEQUENCE SEQ_INVOICE_ID INCREMENT BY 1 MINVALUE 1';
END;
/
```

---

## Best Practices

- **Never edit an applied versioned migration.** Both tools detect checksum changes. If a deployed migration has a bug, write a new corrective migration. Reserve `flyway repair` or `liquibase changelogSync` only for truly broken environments where the change was already applied manually.
- **Separate DDL owner from application user.** Run migrations as a schema owner (or DBA-equivalent) account. The application runtime user should have only DML privileges. This prevents accidental DDL from application bugs.
- **Keep changesets small and focused.** One logical change per changeset. Large changesets are hard to roll back, hard to diagnose, and block other schema operations with long-held DDL locks.
- **Always write rollback blocks.** Liquibase does not auto-generate rollback SQL for many Oracle DDL operations. Write explicit `<rollback>` blocks even if you never plan to use them — they serve as documentation.
- **Use contexts and labels** to control which changesets run in which environments. Seed data, test fixtures, and performance-heavy backfills should be excluded from production runs.
- **Run `updateSQL` before `update` in production.** The generated SQL file becomes an artifact for DBA review, audit logs, and post-incident analysis.
- **Avoid `flyway clean` on shared environments.** It drops all objects. It should only be used in fully isolated development environments or ephemeral CI containers.

---

## Common Mistakes

**Mistake: Using `BOOLEAN` as a column type.**
Oracle SQL does not have a BOOLEAN type (PL/SQL does, but not SQL DDL). Liquibase silently maps `BOOLEAN` to `NUMBER(1,0)` for Oracle, which is correct, but the intent is unclear to readers. Use `NUMBER(1,0)` explicitly with a CHECK constraint.

```sql
-- Wrong (ambiguous mapping)
<column name="IS_ACTIVE" type="BOOLEAN"/>

-- Right
<column name="IS_ACTIVE" type="NUMBER(1,0)" defaultValueNumeric="1">
  <constraints nullable="false" checkConstraint="IS_ACTIVE IN (0, 1)"/>
</column>
```

**Mistake: Committing `splitStatements=true` with PL/SQL.**
Liquibase splits statements on `;` by default. PL/SQL blocks contain many semicolons. Always set `splitStatements="false"` and use `endDelimiter="/"` for PL/SQL files.

**Mistake: Including `GRANT` statements in versioned migrations.**
Grants applied via versioned migrations are re-applied once and then forgotten. If a user is dropped and recreated, the grant is lost. Use repeatable migrations or a separate grants script that is idempotent.

**Mistake: Not testing rollbacks.**
Rollbacks are only useful if they work. Include rollback testing in CI by applying a migration set, then rolling back, and verifying the schema matches the pre-migration baseline.

**Mistake: Running migrations synchronously with application deployment.**
In high-availability deployments, the application and database versions may be temporarily mismatched. Design migrations to be backward-compatible: add columns as nullable before backfilling, do not drop columns until the old application version is fully retired.

---

## Sources

- [Liquibase Documentation](https://docs.liquibase.com/) — changelog structure, changeset anatomy, Oracle data type mappings, rollback
- [Flyway Documentation](https://documentation.red-gate.com/flyway) — versioned vs. repeatable migrations, flyway.toml, PL/SQL delimiter configuration
- [Oracle Database SQL Language Reference 19c — CREATE SEQUENCE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-SEQUENCE.html) — CACHE, NOORDER, RESTART (18c+)
- [Oracle Database Development Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/adfns/) — Oracle-specific migration considerations
