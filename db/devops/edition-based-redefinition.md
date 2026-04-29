# Edition-Based Redefinition (EBR) in Oracle DB

## Overview

Edition-Based Redefinition (EBR) is Oracle's mechanism for deploying application changes to a live database without any downtime — including changes to PL/SQL code, views, and synonyms. It allows multiple versions of these objects to coexist simultaneously in the database, each within its own named **edition**. Database sessions are associated with a specific edition, so old application instances and new application instances can run concurrently against the same database, each seeing their own version of the code.

EBR was introduced in Oracle 11g Release 2 and is the canonical Oracle approach to hot-rollover (blue/green or rolling) deployments at the database tier. It is significantly more capable than simply replacing packages — it handles the entire application schema version lifecycle including backward-compatible view evolution and cross-edition data synchronization.

---

## Core Concepts

### Editions

An edition is a named, schema-independent container for editionable objects. Editions form a tree rooted at the default edition (`ORA$BASE`). Child editions inherit all objects from their parent edition; changes made in a child edition override the parent's version for sessions running in that edition.

```
ORA$BASE (root edition)
  └── V1 (initial production)
        └── V2 (in-flight deployment)
              └── V3 (next deployment)
```

```sql
-- List all editions in the database
SELECT EDITION_NAME, PARENT_EDITION_NAME, USABLE
FROM   DBA_EDITIONS
ORDER BY EDITION_NAME;

-- Current edition of the session
SELECT SYS_CONTEXT('USERENV', 'CURRENT_EDITION_NAME') FROM DUAL;

-- Default edition for the database
SELECT PROPERTY_VALUE FROM DATABASE_PROPERTIES
WHERE  PROPERTY_NAME = 'DEFAULT_EDITION';
```

### Editionable Object Types

Not all database objects are editionable. Only the following object types can have edition-specific versions:

| Editionable | Not Editionable |
|---|---|
| PROCEDURE | TABLE |
| FUNCTION | INDEX |
| PACKAGE (spec + body) | SEQUENCE |
| TRIGGER | MATERIALIZED VIEW |
| TYPE (spec + body) | GRANT |
| VIEW | DATABASE LINK |
| SYNONYM | |
| LIBRARY | |
| SQL Translation Profile | |

Tables, indexes, and sequences are shared across all editions. This is fundamental to the design: EBR manages code versioning, not data versioning.

### Enabling Editions on a Schema

```sql
-- Editions must be enabled for each schema that will use EBR
-- Requires ALTER USER privilege
ALTER USER app_owner ENABLE EDITIONS;

-- Verify
SELECT USERNAME, EDITIONS_ENABLED
FROM   DBA_USERS
WHERE  USERNAME = 'APP_OWNER';
```

### Creating and Using Editions

```sql
-- Create a new edition (requires CREATE EDITION system privilege)
CREATE EDITION v2 AS CHILD OF v1;

-- Set the database default edition (new sessions use this edition)
ALTER DATABASE DEFAULT EDITION = v2;

-- Set the edition for a specific session
ALTER SESSION SET EDITION = v2;

-- Grant USE on an edition to a user
GRANT USE ON EDITION v2 TO app_user;
```

---

## Editioning Views

Because tables are not editionable, EBR introduces the **editioning view** as the boundary between code (editionable) and data (non-editionable). Application code never queries a base table directly; it queries an editioning view. During a deployment, the editioning view can be redefined in the new edition to expose a different column layout while the base table contains data for both the old and new schema.

### Creating an Editioning View

```sql
-- The base table contains all columns for current and transitional state
CREATE TABLE CUSTOMERS_T (
    CUSTOMER_ID    NUMBER(18,0)     NOT NULL,
    -- Old columns (present in V1)
    FULL_NAME      VARCHAR2(200),
    -- New columns (added for V2 deployment)
    FIRST_NAME     VARCHAR2(100),
    LAST_NAME      VARCHAR2(100),
    EMAIL          VARCHAR2(320)    NOT NULL,
    STATUS_CODE    VARCHAR2(10)     DEFAULT 'ACTIVE' NOT NULL,
    CREATED_AT     TIMESTAMP        DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT PK_CUSTOMERS_T PRIMARY KEY (CUSTOMER_ID)
);

-- V1 editioning view: exposes the old column layout
-- (Run while connected to V1 edition)
CREATE OR REPLACE EDITIONING VIEW CUSTOMERS AS
SELECT
    CUSTOMER_ID,
    FULL_NAME,
    EMAIL,
    STATUS_CODE,
    CREATED_AT
FROM CUSTOMERS_T;
```

```sql
-- V2 editioning view: exposes the new column layout
-- (Run while connected to V2 edition)
ALTER SESSION SET EDITION = v2;

CREATE OR REPLACE EDITIONING VIEW CUSTOMERS AS
SELECT
    CUSTOMER_ID,
    FIRST_NAME,
    LAST_NAME,
    EMAIL,
    STATUS_CODE,
    CREATED_AT
FROM CUSTOMERS_T;
```

Sessions in edition `v1` see the `FULL_NAME` layout. Sessions in edition `v2` see the `FIRST_NAME`, `LAST_NAME` layout. Both query the same physical `CUSTOMERS_T` table.

---

## Crossedition Triggers

Since both editions write to the same base table, a mechanism is needed to keep data consistent across the column layouts. **Crossedition triggers** propagate writes from one edition's column layout to the other.

### Forward Crossedition Trigger

A forward crossedition trigger fires on the old edition and propagates changes to the new columns, so that data written by old-edition sessions is visible to new-edition sessions.

```sql
-- Connect as V1 edition, create the forward trigger
ALTER SESSION SET EDITION = v1;

CREATE OR REPLACE TRIGGER TRG_CUST_FORWARD
BEFORE INSERT OR UPDATE ON CUSTOMERS_T
FOR EACH ROW
FORWARD CROSSEDITION
DISABLE
BEGIN
  -- When old code writes FULL_NAME, split it into FIRST_NAME / LAST_NAME
  IF :NEW.FULL_NAME IS NOT NULL THEN
    :NEW.FIRST_NAME := REGEXP_SUBSTR(:NEW.FULL_NAME, '^\S+');
    :NEW.LAST_NAME  := REGEXP_SUBSTR(:NEW.FULL_NAME, '\S+$');
  END IF;
END;
/

-- Enable the trigger once the V2 deployment is ready to start accepting traffic
ALTER TRIGGER TRG_CUST_FORWARD ENABLE;
```

### Reverse Crossedition Trigger

A reverse crossedition trigger fires on the new edition and propagates changes back to the old columns, keeping old-edition sessions consistent while they are still running.

```sql
-- Connect as V2 edition, create the reverse trigger
ALTER SESSION SET EDITION = v2;

CREATE OR REPLACE TRIGGER TRG_CUST_REVERSE
BEFORE INSERT OR UPDATE ON CUSTOMERS_T
FOR EACH ROW
REVERSE CROSSEDITION
DISABLE
BEGIN
  -- When new code writes FIRST_NAME and LAST_NAME, reconstruct FULL_NAME
  IF :NEW.FIRST_NAME IS NOT NULL OR :NEW.LAST_NAME IS NOT NULL THEN
    :NEW.FULL_NAME := TRIM(:NEW.FIRST_NAME || ' ' || :NEW.LAST_NAME);
  END IF;
END;
/

ALTER TRIGGER TRG_CUST_REVERSE ENABLE;
```

---

## Hot-Rollover Deployment Workflow

The full deployment process for a hot-rollover using EBR follows a well-defined sequence:

### Phase 1: Prepare the New Edition

```sql
-- 1. Create the new edition
CREATE EDITION v2 AS CHILD OF v1;

-- 2. Add new columns to the base table (additive, non-breaking)
ALTER TABLE CUSTOMERS_T ADD (
    FIRST_NAME VARCHAR2(100),
    LAST_NAME  VARCHAR2(100)
);

-- 3. Switch to new edition and deploy new code
ALTER SESSION SET EDITION = v2;

-- 4. Create the new editioning view (V2 layout)
CREATE OR REPLACE EDITIONING VIEW CUSTOMERS AS
SELECT CUSTOMER_ID, FIRST_NAME, LAST_NAME, EMAIL, STATUS_CODE, CREATED_AT
FROM   CUSTOMERS_T;

-- 5. Deploy updated PL/SQL packages in V2 edition
CREATE OR REPLACE PACKAGE PKG_CUSTOMERS AS
  PROCEDURE create_customer(
    p_first_name IN VARCHAR2,
    p_last_name  IN VARCHAR2,
    p_email      IN VARCHAR2
  );
END PKG_CUSTOMERS;
/

CREATE OR REPLACE PACKAGE BODY PKG_CUSTOMERS AS
  PROCEDURE create_customer(
    p_first_name IN VARCHAR2,
    p_last_name  IN VARCHAR2,
    p_email      IN VARCHAR2
  ) IS
  BEGIN
    INSERT INTO CUSTOMERS (CUSTOMER_ID, FIRST_NAME, LAST_NAME, EMAIL)
    VALUES (SEQ_CUSTOMER_ID.NEXTVAL, p_first_name, p_last_name, p_email);
    COMMIT;
  END create_customer;
END PKG_CUSTOMERS;
/
```

### Phase 2: Enable Crossedition Triggers

```sql
-- Enable forward crossedition trigger (in V1) to propagate old writes to new columns
ALTER SESSION SET EDITION = v1;
ALTER TRIGGER TRG_CUST_FORWARD ENABLE;

-- Enable reverse crossedition trigger (in V2) to propagate new writes to old columns
ALTER SESSION SET EDITION = v2;
ALTER TRIGGER TRG_CUST_REVERSE ENABLE;
```

### Phase 3: Backfill Existing Data

```sql
-- Populate new columns for rows that were inserted before the triggers were enabled
ALTER SESSION SET EDITION = v2;

UPDATE CUSTOMERS_T
SET
    FIRST_NAME = REGEXP_SUBSTR(FULL_NAME, '^\S+'),
    LAST_NAME  = REGEXP_SUBSTR(FULL_NAME, '\S+$')
WHERE
    FULL_NAME IS NOT NULL
    AND (FIRST_NAME IS NULL OR LAST_NAME IS NULL);

COMMIT;
```

### Phase 4: Switch Traffic to New Edition

```sql
-- Set V2 as the default edition for new sessions
-- (Existing sessions in V1 continue uninterrupted)
ALTER DATABASE DEFAULT EDITION = v2;
```

At this point, new application instances connect using V2. Old application instances running in V1 continue working. Both sets of instances share the same data, with crossedition triggers keeping both column layouts synchronized.

### Phase 5: Retire the Old Edition

Once all application instances using V1 have been shut down:

```sql
-- Disable crossedition triggers (no longer needed)
ALTER TRIGGER TRG_CUST_FORWARD DISABLE;
ALTER TRIGGER TRG_CUST_REVERSE DISABLE;

-- Optionally drop them
DROP TRIGGER TRG_CUST_FORWARD;
DROP TRIGGER TRG_CUST_REVERSE;

-- Drop the old columns (now that V1 is retired)
ALTER TABLE CUSTOMERS_T DROP COLUMN FULL_NAME;

-- Drop the old edition (cannot drop an edition that has sessions or is the default)
DROP EDITION v1 CASCADE;
-- CASCADE drops all editioned objects that existed only in v1
```

---

## Managing Editions in Practice

### Listing Objects Per Edition

```sql
-- Which edition does each object belong to?
SELECT OBJECT_NAME, OBJECT_TYPE, EDITION_NAME, STATUS
FROM   USER_OBJECTS_AE  -- AE = All Editions
WHERE  OBJECT_TYPE IN ('PACKAGE', 'PACKAGE BODY', 'VIEW', 'PROCEDURE', 'FUNCTION')
ORDER BY OBJECT_NAME, EDITION_NAME;
```

### Comparing Object State Across Editions

```sql
-- Find objects that differ between editions
SELECT a.OBJECT_NAME, a.OBJECT_TYPE,
       a.EDITION_NAME AS EDITION_A,
       b.EDITION_NAME AS EDITION_B,
       a.LAST_DDL_TIME AS MODIFIED_IN_A,
       b.LAST_DDL_TIME AS MODIFIED_IN_B
FROM   USER_OBJECTS_AE a
JOIN   USER_OBJECTS_AE b
  ON   a.OBJECT_NAME = b.OBJECT_NAME
  AND  a.OBJECT_TYPE = b.OBJECT_TYPE
  AND  a.EDITION_NAME != b.EDITION_NAME
WHERE  a.EDITION_NAME = 'V1'
  AND  b.EDITION_NAME = 'V2'
  AND  a.LAST_DDL_TIME != b.LAST_DDL_TIME;
```

### Setting Edition in Connection Strings

```shell
# JDBC connection string with edition
jdbc:oracle:thin:@//host:1521/service?oracle.jdbc.editionName=V2

# SQL*Plus
sqlplus app_user/password@//host:1521/service
ALTER SESSION SET EDITION = v2;

# OCI (Python cx_Oracle / oracledb)
import oracledb
conn = oracledb.connect(
    user="app_user",
    password=password,
    dsn="host:1521/service",
    edition="V2"
)
```

---

## Use Cases and Limitations

### Ideal Use Cases

- **Rolling deployments** — Deploy new application version to a subset of app servers while old version continues on the remainder, both connected to the same database.
- **PL/SQL-heavy applications** — EBR shines when the database contains significant business logic in packages; the ability to version packages independently is its primary advantage.
- **Complex column renames or type changes** — The editioning view + crossedition trigger pattern handles renames cleanly without application downtime.
- **Automated testing** — Deploy test versions of packages in a dedicated test edition without affecting production sessions.

### Limitations

- **Tables, indexes, and sequences are not editionable.** Structural changes still require careful forward-compatible design (expand/contract).
- **Cannot use EBR for partitioning or storage changes.** Those require DBMS_REDEFINITION or offline DDL.
- **DDL complexity increases significantly.** Every object must be created in the correct edition. Missed edition context during deployments causes objects to land in the wrong edition, which can be difficult to debug.
- **Connection pool management becomes critical.** Connection pools must be configured to specify the correct edition. Pools created without an edition specification default to the database default edition, which may not be the intended edition during a partial rollover.
- **Cannot drop an edition while it has active sessions or objects that exist only in it.** Plan cleanup procedures carefully.
- **Not all Oracle features support editioned objects as dependencies.** For example, materialized views cannot reference editioned views.

---

## Best Practices

- **Model editions as a linear chain, not a tree.** While Oracle supports branching edition trees, linear chains (v1 → v2 → v3) are far easier to reason about and operate.
- **Always set edition context explicitly in deployment scripts.** Never rely on the session default. Begin every deployment script with `ALTER SESSION SET EDITION = target_edition;` and verify with `SELECT SYS_CONTEXT('USERENV', 'CURRENT_EDITION_NAME') FROM DUAL;`.
- **Keep the number of active editions small (2–3 maximum).** Maintaining more than one previous edition exponentially increases the complexity of crossedition triggers and deployment verification.
- **Script edition creation and cleanup as part of the pipeline.** Do not rely on manual DBA steps. Create, deploy, switch, and schedule retirement as automated pipeline stages.
- **Test edition switching in staging with realistic connection pool behavior.** Bugs caused by connection pools using the wrong edition are subtle and reproduce only under load.
- **Document the current edition state in a deployment runbook.** Operators need to know which edition is current, which is retiring, and which is in staging at all times.

---

## Common Mistakes

**Mistake: Creating objects without setting the edition context first.**
If a DBA runs `CREATE OR REPLACE VIEW CUSTOMERS AS ...` without first issuing `ALTER SESSION SET EDITION = v2`, the view is created in the current session edition, which may be the wrong one. Always verify edition context before any DDL in an EBR deployment.

**Mistake: Forgetting that triggers on the base table fire in ALL editions.**
Regular (non-crossedition) triggers on the base table are not editioned at the trigger level — they fire regardless of the session edition. Only crossedition triggers have edition-specific semantics. Audit triggers, logging triggers, and constraint enforcement triggers on base tables will see all DML from all editions.

**Mistake: Dropping columns before retiring all old-edition sessions.**
Dropping the `FULL_NAME` column while V1 sessions are still active will break those sessions immediately. Always verify that no active sessions are using the old edition before performing column drops.

**Mistake: Using editioning views for non-relational data access.**
EBR is designed for relational, SQL-based object models. XML DB, Spatial, and other non-relational feature areas have limited or no EBR support.

**Mistake: Conflating EBR with a general-purpose schema versioning tool.**
EBR manages concurrent code versions. It does not replace schema migration tools like Liquibase or Flyway. The typical production pattern uses both: Flyway/Liquibase for base table DDL changes (additive only, forward-compatible), and EBR for PL/SQL and view versioning during hot rollovers.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database Development Guide 19c — Using Edition-Based Redefinition](https://docs.oracle.com/en/database/oracle/oracle-database/19/adfns/editions.html) — EBR introduced in 11gR2; editionable types (SYNONYM, VIEW, PROCEDURE, FUNCTION, PACKAGE, TRIGGER, TYPE, LIBRARY, SQL Translation Profile); crossedition triggers; editioning views
- [Oracle Database SQL Language Reference 19c — CREATE EDITION](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-EDITION.html) — edition creation and hierarchy
- [Oracle Database Reference 19c — DBA_EDITIONS](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_EDITIONS.html) — edition catalog view
