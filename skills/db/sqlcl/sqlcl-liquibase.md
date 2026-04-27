# SQLcl Built-in Liquibase

## Overview

SQLcl ships with Liquibase built in. No separate Liquibase installation, Java classpath configuration, or Oracle JDBC driver setup is required — SQLcl already has the Oracle driver and Liquibase bundled and integrated. The `lb` command (also accessible as `liquibase`) is available at the SQLcl prompt and from the command line.

SQLcl's Liquibase integration is purpose-built for Oracle and includes Oracle-specific extensions that the standalone Liquibase CLI does not have out of the box, most notably the ability to **generate changelogs from an existing Oracle schema** — capturing tables, views, packages, triggers, sequences, indexes, synonyms, and other object types directly from the database catalog.

This makes SQLcl Liquibase ideal for:
- Capturing a baseline of an existing database schema into version control
- Tracking incremental schema changes over time
- Deploying changes across environments (dev → test → prod)
- Integrating database changes into CI/CD pipelines

---

## Key Concepts

### Changelog

A changelog is a file (XML, YAML, JSON, or SQL) that contains an ordered list of **changesets**. Liquibase tracks which changesets have been applied to a database in a tracking table called `DATABASECHANGELOG`.

### Changeset

A changeset is an atomic unit of change identified by a unique combination of `id`, `author`, and `filename`. Once applied, a changeset is not re-applied (unless explicitly rolled back). Changesets can contain DDL, DML, or stored procedure definitions.

### DATABASECHANGELOG Table

Liquibase creates this table automatically in the schema where changes are applied. It records:
- `ID` — The changeset ID
- `AUTHOR` — The changeset author
- `FILENAME` — The changelog file path
- `DATEEXECUTED` — When the change was applied
- `MD5SUM` — Checksum of the changeset content
- `EXECTYPE` — EXECUTED, FAILED, RERAN, etc.

### DATABASECHANGELOGLOCK Table

A companion lock table that prevents concurrent Liquibase operations from conflicting.

---

## Generating Changelogs from Existing Schema

This is SQLcl's most powerful Liquibase feature — the ability to reverse-engineer an existing Oracle schema into a Liquibase changelog.

### Generate Full Schema Changelog

```sql
-- Connect to the target schema first
CONNECT hr/hr@localhost:1521/FREEPDB1

-- Generate changelog for entire schema
lb generate-schema -split
```

The `-split` flag creates one file per object (recommended for version control). Without `-split`, all DDL is placed in a single file.

The output directory structure when using `-split`:

```
controller.xml          (master changelog referencing all sub-files)
table/
  employees.xml
  departments.xml
  ...
view/
  emp_details_view.xml
  ...
procedure/
  add_job_history.xml
  ...
index/
  ...
sequence/
  ...
trigger/
  ...
```

### Generate Changelog for Specific Object Types

```sql
-- Only tables
lb generate-schema -object-type table

-- Only tables and views
lb generate-schema -object-type table -object-type view

-- Only specific object types (comma-separated not supported; use multiple flags)
```

### Generate Changelog for a Single Object

```sql
-- Generate changelog for a specific table
lb generate-object -object-type table -object-name EMPLOYEES

-- Generate changelog for a view
lb generate-object -object-type view -object-name EMP_DETAILS_VIEW

-- Generate changelog for a package
lb generate-object -object-type package -object-name MY_PKG

-- Specify output file name
lb generate-object -object-type table -object-name EMPLOYEES -file employees_changelog.xml
```

### Output Formats

Current SQLcl documentation shows XML as the default output for schema generation, with SQL output available through the `-sql` flag:

```sql
-- Default XML changelog output
lb generate-schema

-- Generate SQL output
lb generate-schema -sql
```

---

## Applying Changes with `lb update`

### Apply All Pending Changesets

```sql
lb update -changelog-file controller.xml
```

Liquibase reads the changelog, checks `DATABASECHANGELOG` to find which changesets have already been applied, and runs only the new ones.

### Preview Changes (updateSQL)

Before applying, generate the SQL that would be executed without running it:

```sql
lb update-sql -changelog-file controller.xml
```

This outputs the SQL to the screen. Redirect to a file with SPOOL:

```sql
SPOOL /tmp/pending_changes.sql
lb update-sql -changelog-file controller.xml
SPOOL OFF
```

### Apply Up to a Tag

```sql
-- Tag the current state first
lb tag -tag v1.2.0

-- Later, update only up to a specific tag
lb update -changelog-file controller.xml -tag v1.2.0
```

### Apply a Specific Number of Changesets

```sql
lb update-count -count 3 -changelog-file controller.xml
```

---

## Rolling Back Changes

### Rollback to a Tag

```sql
lb rollback -tag v1.1.0 -changelog-file controller.xml
```

Liquibase reverses all changesets applied after the specified tag. For automatic rollback to work, each changeset must include a `<rollback>` element (for DDL like `ALTER TABLE`, Liquibase can often auto-generate the rollback).

### Rollback a Specific Number of Changesets

```sql
lb rollback-count -count 2 -changelog-file controller.xml
```

### Rollback to a Date

```sql
lb rollback-to-date -date "2025-01-15 00:00:00" -changelog-file controller.xml
```

### Preview Rollback SQL

```sql
lb rollback-sql -tag v1.1.0 -changelog-file controller.xml
```

---

## Changeset Format Examples

### XML Changeset (DDL)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <changeSet id="001" author="jdoe">
        <createTable tableName="PRODUCT">
            <column name="PRODUCT_ID" type="NUMBER(10)">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="PRODUCT_NAME" type="VARCHAR2(100)">
                <constraints nullable="false"/>
            </column>
            <column name="PRICE" type="NUMBER(10,2)"/>
            <column name="CREATED_DATE" type="DATE" defaultValueComputed="SYSDATE"/>
        </createTable>
        <rollback>
            <dropTable tableName="PRODUCT"/>
        </rollback>
    </changeSet>

    <changeSet id="002" author="jdoe">
        <addColumn tableName="PRODUCT">
            <column name="CATEGORY_ID" type="NUMBER(5)"/>
        </addColumn>
        <rollback>
            <dropColumn tableName="PRODUCT" columnName="CATEGORY_ID"/>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

### XML Changeset (PL/SQL)

For stored procedures, packages, and triggers, use `<sql>` with `splitStatements="false"` and the `endDelimiter`:

```xml
<changeSet id="003" author="jdoe" runOnChange="true">
    <sql splitStatements="false" endDelimiter="/">
CREATE OR REPLACE PROCEDURE update_product_price (
    p_product_id IN NUMBER,
    p_new_price  IN NUMBER
) IS
BEGIN
    UPDATE product SET price = p_new_price WHERE product_id = p_product_id;
    COMMIT;
END update_product_price;
/
    </sql>
    <rollback>
        <sql>DROP PROCEDURE update_product_price;</sql>
    </rollback>
</changeSet>
```

### YAML Changeset

```yaml
databaseChangeLog:
  - changeSet:
      id: "001"
      author: jdoe
      changes:
        - createTable:
            tableName: PRODUCT
            columns:
              - column:
                  name: PRODUCT_ID
                  type: NUMBER(10)
                  constraints:
                    primaryKey: true
                    nullable: false
              - column:
                  name: PRODUCT_NAME
                  type: VARCHAR2(100)
                  constraints:
                    nullable: false
      rollback:
        - dropTable:
            tableName: PRODUCT
```

### SQL Format Changeset

```sql
--liquibase formatted sql

--changeset jdoe:001
CREATE TABLE product (
    product_id   NUMBER(10) PRIMARY KEY,
    product_name VARCHAR2(100) NOT NULL,
    price        NUMBER(10,2)
);

--rollback DROP TABLE product;

--changeset jdoe:002
ALTER TABLE product ADD (category_id NUMBER(5));

--rollback ALTER TABLE product DROP COLUMN category_id;
```

### Master Changelog (includes)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <!-- Include sub-changelogs in order -->
    <include file="table/product.xml"/>
    <include file="table/category.xml"/>
    <include file="view/product_catalog_v.xml"/>
    <include file="procedure/update_product_price.xml"/>

</databaseChangeLog>
```

---

## Status and Diff Commands

```sql
-- Show which changesets are pending (not yet applied)
lb status -changelog-file controller.xml

-- Show detailed status
lb status --verbose -changelog-file controller.xml

-- Check for differences between changelog and database
lb diff -changelog-file controller.xml

-- Generate a changelog for the difference between two databases
lb diff-changelog -reference-url jdbc:oracle:thin:hr/hr@prod:1521/PROD -changelog-file diff.xml
```

---

## Tracking and History

```sql
-- View DATABASECHANGELOG content
SELECT id, author, filename, dateexecuted, exectype FROM databasechangelog ORDER BY dateexecuted;

-- Check if a specific changeset was applied
SELECT * FROM databasechangelog WHERE id = '001' AND author = 'jdoe';

-- Mark a changeset as already run (without executing it)
lb changelog-sync -changelog-file controller.xml
```

---

## Integrating with CI/CD

### GitHub Actions Example

```yaml
name: Deploy Database Changes

on:
  push:
    branches: [main]
    paths:
      - 'db/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install SQLcl
        run: |
          wget -q https://download.oracle.com/otn_software/java/sqldeveloper/sqlcl-latest.zip
          unzip -q sqlcl-latest.zip -d /opt/sqlcl
          echo "/opt/sqlcl/sqlcl/bin" >> $GITHUB_PATH

      - name: Set up wallet
        run: |
          mkdir -p /tmp/wallet
          echo "${{ secrets.WALLET_ZIP_B64 }}" | base64 -d > /tmp/wallet.zip
          unzip /tmp/wallet.zip -d /tmp/wallet
        env:
          TNS_ADMIN: /tmp/wallet

      - name: Apply Liquibase Changes
        run: |
          cd db
          sql -S "${{ secrets.DB_USER }}/${{ secrets.DB_PASSWORD }}@${{ secrets.DB_SERVICE }}" <<'EOF'
          lb update -changelog-file controller.xml
          exit
          EOF
        env:
          TNS_ADMIN: /tmp/wallet
```

### GitLab CI Example

```yaml
deploy_db:
  stage: deploy
  image: container-registry.oracle.com/database/sqlcl:latest
  script:
    - cd db
    - |
      sql -S "${DB_USER}/${DB_PASSWORD}@${DB_SERVICE}" <<'EOF'
      lb update -changelog-file controller.xml
      exit
      EOF
  only:
    - main
```

### Headless One-liner

```shell
echo "lb update -changelog-file controller.xml\nexit" | sql -S user/pass@service
```

Or with a wrapper script (`deploy.sql`):

```sql
lb update -changelog-file controller.xml
exit
```

```shell
sql -S user/pass@service @deploy.sql
```

---

## Differences from Standalone Liquibase CLI

| Feature | SQLcl `lb` | Standalone Liquibase CLI |
|---|---|---|
| Oracle JDBC driver | Bundled | Must download and configure |
| `generate-schema` command | Built-in | Not available (Pro feature) |
| `generate-object` command | Built-in | Not available |
| Installation | Part of SQLcl | Separate install |
| Oracle Wallet support | Native | Requires manual driver config |
| PL/SQL support | Native Oracle parsing | Standard SQL only without extensions |
| Changelog formats | XML, YAML, JSON, SQL | XML, YAML, JSON, SQL |
| Core Liquibase operations | Full (update, rollback, diff, etc.) | Full |
| Liquibase Pro features | Not included | Available with license |

---

## Best Practices

- Use `-split` when generating schema changelogs. Single-file changelogs become difficult to manage and cause large merge conflicts in version control.
- Use `runOnChange="true"` on changesets for PL/SQL objects (packages, procedures, functions, triggers, views). This allows Liquibase to re-apply the changeset when the source changes without needing a new changeset ID.
- Always include a `<rollback>` element in changesets. Liquibase can auto-generate rollback SQL for simple DDL like `createTable` and `addColumn`, but cannot for arbitrary SQL or PL/SQL.
- Tag the database state before applying changes in production with `lb tag`. This gives you a clean rollback target if something goes wrong.
- Store changelogs in the same repository as application code so database changes are versioned alongside the code that depends on them.
- Never manually modify the `DATABASECHANGELOG` table. Use `lb changelog-sync` to mark changesets as applied without running them (e.g., for objects that were manually created before adopting Liquibase).
- Run `lb status` before `lb update` in CI/CD pipelines to verify the expected number of changesets will be applied. Fail the pipeline if the count is zero when changes are expected.

---

## Common Mistakes and How to Avoid Them

**Mistake: Modifying a changeset that has already been applied**
Liquibase stores a checksum of each changeset. If you modify it, the next run will fail with a checksum mismatch. For changes to PL/SQL objects, use `runOnChange="true"`. For data corrections, create a new changeset.

**Mistake: Using the same changeset ID in different files**
Changeset uniqueness is determined by the combination of `id + author + filename`. Two changesets can share the same `id` if they are in different files, but this causes confusion. Use a consistent ID naming scheme such as sequential numbers or timestamps.

**Mistake: Not running `lb generate-schema` on a clean schema**
If the target schema has manual changes not captured in the changelog, `lb update` will fail on objects that already exist. Run `lb changelog-sync` after the initial baseline generation to mark all existing objects as applied.

**Mistake: Inline PL/SQL without `splitStatements="false"`**
Liquibase splits SQL on semicolons by default. PL/SQL bodies contain semicolons within the code. Always use `splitStatements="false"` for any changeset containing PL/SQL.

**Mistake: Not committing the `DATABASECHANGELOG` to version control**
The `DATABASECHANGELOG` lives in the database, not in version control. Do not try to commit it. What you commit is the changelog files. The database table is Liquibase's runtime state.

---

## Sources

- [Oracle SQLcl 25.2 User's Guide](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/oracle-sqlcl-users-guide.pdf)
- [Using Liquibase with SQLcl — Oracle Docs 25.4](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.4/sqcug/using-liquibase-sqlcl.html)
- [SQLcl Liquibase Automating Deployments — ORACLE-BASE](https://oracle-base.com/articles/misc/sqlcl-automating-your-database-deployments-using-sqlcl-and-liquibase)
- [Oracle SQLcl Releases index](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/index.html)
