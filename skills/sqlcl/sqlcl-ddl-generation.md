# SQLcl DDL Generation

## Overview

SQLcl provides a built-in `DDL` command that generates the `CREATE` statement for any database object in the current schema (or a specified schema). It is a streamlined interface to Oracle's `DBMS_METADATA` package, but with sane defaults that strip storage clauses, physical attributes, and other environment-specific noise that makes raw `DBMS_METADATA` output difficult to use across environments.

The `DDL` command is invaluable for:
- Capturing object definitions for version control
- Comparing object definitions between environments
- Generating migration scripts from an existing database
- Documenting schema structure
- Quickly inspecting the full definition of a table, package, or trigger without querying multiple catalog views

---

## Basic DDL Command Syntax

```sql
DDL object_name
DDL object_name object_type
DDL object_name object_type schema_name
```

### Examples

```sql
-- Table DDL (auto-detects object type)
DDL employees

-- Explicit object type
DDL employees TABLE

-- Object in another schema
DDL hr.employees TABLE
DDL employees TABLE hr

-- View DDL
DDL emp_details_view VIEW

-- Package spec and body
DDL my_package PACKAGE
DDL my_package PACKAGE BODY

-- Procedure
DDL update_salary PROCEDURE

-- Function
DDL get_employee_count FUNCTION

-- Trigger
DDL salary_audit_trg TRIGGER

-- Sequence
DDL employee_seq SEQUENCE

-- Index
DDL emp_name_idx INDEX

-- Synonym
DDL emp SYNONYM

-- Database link
DDL remote_db DATABASE LINK

-- Type
DDL address_type TYPE
DDL address_type TYPE BODY

-- Materialized view
DDL emp_salary_mv MATERIALIZED VIEW
```

---

## DDL Output Options

By default, the `DDL` command produces clean, portable DDL with minimal storage and physical attribute clauses. You can modify its behavior with the following options.

### SHOW Options

The `DDL` command output is primarily controlled through `SET DDL` session-level settings (see below). This guide intentionally uses the session-level commands because they are the documented, version-stable way to control storage, segment attributes, tablespace clauses, and schema qualification.

The recommended approach for controlling DDL output is via session settings:

```sql
-- Turn off storage/segment/tablespace for all DDL in this session
SET DDL STORAGE OFF
SET DDL SEGMENT_ATTRIBUTES OFF
SET DDL TABLESPACE OFF

-- Then simply run:
DDL employees
```

### Configuring DDL Behavior Globally

SQLcl provides `SET DDL` options that control DDL output for the entire session:

```sql
-- Show all current DDL settings
SET DDL

-- Turn off storage clause in all DDL output
SET DDL STORAGE OFF

-- Turn off segment creation clause
SET DDL SEGMENT_ATTRIBUTES OFF

-- Turn off tablespace clause
SET DDL TABLESPACE OFF

-- Turn off partition details
SET DDL PARTITION OFF

-- Suppress schema prefix on all generated DDL
SET DDL REF_CONSTRAINTS ON   -- Include referential constraints (default ON)
SET DDL CONSTRAINTS ON        -- Include constraints (default ON)
SET DDL PRETTY ON             -- Pretty-print the output (default ON)

-- Useful combination for cross-environment portability
SET DDL STORAGE OFF
SET DDL SEGMENT_ATTRIBUTES OFF
SET DDL TABLESPACE OFF
```

To see all available `SET DDL` settings:

```sql
HELP SET DDL
```

---

## Generating DDL for Individual Object Types

### Tables

```sql
DDL employees

-- With constraints shown, storage suppressed
SET DDL STORAGE OFF
SET DDL SEGMENT_ATTRIBUTES OFF
DDL employees TABLE
```

Sample output:

```sql
  CREATE TABLE "HR"."EMPLOYEES"
   (    "EMPLOYEE_ID" NUMBER(6,0),
        "FIRST_NAME" VARCHAR2(20),
        "LAST_NAME" VARCHAR2(25) CONSTRAINT "EMP_LAST_NAME_NN" NOT NULL ENABLE,
        "EMAIL" VARCHAR2(25) CONSTRAINT "EMP_EMAIL_NN" NOT NULL ENABLE,
        "PHONE_NUMBER" VARCHAR2(20),
        "HIRE_DATE" DATE CONSTRAINT "EMP_HIRE_DATE_NN" NOT NULL ENABLE,
        "JOB_ID" VARCHAR2(10) CONSTRAINT "EMP_JOB_NN" NOT NULL ENABLE,
        "SALARY" NUMBER(8,2),
        "COMMISSION_PCT" NUMBER(2,2),
        "MANAGER_ID" NUMBER(6,0),
        "DEPARTMENT_ID" NUMBER(4,0),
         CONSTRAINT "EMP_SALARY_MIN" CHECK (salary > 0) ENABLE,
         CONSTRAINT "EMP_EMAIL_UK" UNIQUE ("EMAIL") ENABLE,
         CONSTRAINT "EMP_EMP_ID_PK" PRIMARY KEY ("EMPLOYEE_ID") ENABLE,
         CONSTRAINT "EMP_DEPT_FK" FOREIGN KEY ("DEPARTMENT_ID")
          REFERENCES "HR"."DEPARTMENTS" ("DEPARTMENT_ID") ENABLE,
         CONSTRAINT "EMP_JOB_FK" FOREIGN KEY ("JOB_ID")
          REFERENCES "HR"."JOBS" ("JOB_ID") ENABLE,
         CONSTRAINT "EMP_MANAGER_FK" FOREIGN KEY ("MANAGER_ID")
          REFERENCES "HR"."EMPLOYEES" ("EMPLOYEE_ID") ENABLE
   ) ;
```

### Views

```sql
DDL emp_details_view VIEW
```

Output will include the full `CREATE OR REPLACE VIEW` statement with the query body.

### Packages

Package spec and body are separate objects in Oracle:

```sql
-- Package specification
DDL my_package PACKAGE

-- Package body
DDL my_package PACKAGE BODY
```

Always capture both. The spec defines the public interface; the body contains the implementation.

### Triggers

```sql
DDL employees_audit_trg TRIGGER
```

Triggers are associated with their parent table. The DDL output includes `CREATE OR REPLACE TRIGGER ... ON table_name`.

### Sequences

```sql
DDL employee_seq SEQUENCE
```

Note: The generated DDL uses the current `LAST_NUMBER` from the sequence. For version control purposes, you typically want to normalize the `START WITH` value to a baseline (e.g., 1 or the next expected value) rather than the live sequence value.

### Indexes

```sql
DDL emp_name_idx INDEX
```

Indexes that support constraints (primary key, unique) are typically included automatically when you generate table DDL. Use explicit index DDL for standalone functional or composite indexes.

---

## Exporting Full Schema DDL

### Using DDL in a Loop (SQL*Plus Style)

Generate DDL for all tables and spool to a file:

```sql
SET SQLFORMAT DEFAULT
SET FEEDBACK OFF
SET HEADING OFF
SET ECHO OFF
SET PAGESIZE 0
SET LONG 1000000
SET LINESIZE 32767
SET DDL STORAGE OFF
SET DDL SEGMENT_ATTRIBUTES OFF
SET DDL TABLESPACE OFF

SPOOL /tmp/schema_tables.sql

SELECT 'DDL ' || object_name || ' TABLE;' || CHR(10)
FROM user_objects
WHERE object_type = 'TABLE'
  AND object_name NOT LIKE 'SYS_%'
ORDER BY object_name;
```

However, a more practical approach uses a wrapper script:

```sql
-- gen_schema_ddl.sql
SET SQLFORMAT DEFAULT
SET FEEDBACK OFF
SET HEADING OFF
SET PAGESIZE 0
SET LONG 1000000
SET LINESIZE 32767
SET DDL STORAGE OFF
SET DDL SEGMENT_ATTRIBUTES OFF
SET DDL TABLESPACE OFF

SPOOL /tmp/full_schema.sql

-- Tables
SELECT DBMS_METADATA.GET_DDL('TABLE', object_name) || ';'
FROM user_objects
WHERE object_type = 'TABLE'
ORDER BY object_name;

-- Views
SELECT DBMS_METADATA.GET_DDL('VIEW', object_name) || ';'
FROM user_objects
WHERE object_type = 'VIEW'
ORDER BY object_name;

-- Sequences
SELECT DBMS_METADATA.GET_DDL('SEQUENCE', object_name) || ';'
FROM user_objects
WHERE object_type = 'SEQUENCE'
ORDER BY object_name;

-- Procedures
SELECT DBMS_METADATA.GET_DDL('PROCEDURE', object_name) || ';'
FROM user_objects
WHERE object_type = 'PROCEDURE'
ORDER BY object_name;

-- Functions
SELECT DBMS_METADATA.GET_DDL('FUNCTION', object_name) || ';'
FROM user_objects
WHERE object_type = 'FUNCTION'
ORDER BY object_name;

-- Package specs
SELECT DBMS_METADATA.GET_DDL('PACKAGE', object_name) || ';'
FROM user_objects
WHERE object_type = 'PACKAGE'
ORDER BY object_name;

-- Package bodies
SELECT DBMS_METADATA.GET_DDL('PACKAGE_BODY', object_name) || ';'
FROM user_objects
WHERE object_type = 'PACKAGE BODY'
ORDER BY object_name;

-- Triggers
SELECT DBMS_METADATA.GET_DDL('TRIGGER', object_name) || ';'
FROM user_objects
WHERE object_type = 'TRIGGER'
ORDER BY object_name;

SPOOL OFF
```

### Using SQLcl DDL Command with JavaScript for Per-Object Files

For version-control-friendly DDL extraction, generate one file per object:

```javascript
// extract_ddl.js — run with: script /path/to/extract_ddl.js

var FileWriter     = Java.type("java.io.FileWriter");
var BufferedWriter = Java.type("java.io.BufferedWriter");
var File           = Java.type("java.io.File");

var outputDir = "/tmp/schema_ddl";
new File(outputDir).mkdirs();

// Configure DDL options
util.execute("BEGIN DBMS_METADATA.SET_TRANSFORM_PARAM(DBMS_METADATA.SESSION_TRANSFORM,'STORAGE',FALSE); END;");
util.execute("BEGIN DBMS_METADATA.SET_TRANSFORM_PARAM(DBMS_METADATA.SESSION_TRANSFORM,'SEGMENT_ATTRIBUTES',FALSE); END;");

var types = [
    ["TABLE",        "table"],
    ["VIEW",         "view"],
    ["SEQUENCE",     "sequence"],
    ["PROCEDURE",    "procedure"],
    ["FUNCTION",     "function"],
    ["PACKAGE",      "package"],
    ["PACKAGE BODY", "package_body"],
    ["TRIGGER",      "trigger"],
    ["INDEX",        "index"]
];

for (var t = 0; t < types.length; t++) {
    var objType  = types[t][0];
    var dirName  = types[t][1];
    var metaType = objType.replace(" ", "_");

    var dir = new File(outputDir + "/" + dirName);
    dir.mkdirs();

    var objects = util.executeReturnListofList(
        "SELECT object_name FROM user_objects WHERE object_type = '" + objType + "' ORDER BY object_name"
    );

    for (var i = 1; i < objects.length; i++) {
        var objName = objects[i][0];
        try {
            var ddlRows = util.executeReturnListofList(
                "SELECT DBMS_METADATA.GET_DDL('" + metaType + "', '" + objName + "') FROM DUAL"
            );
            if (ddlRows.length > 1 && ddlRows[1][0]) {
                var fileName = outputDir + "/" + dirName + "/" + objName.toLowerCase() + ".sql";
                var bw = new BufferedWriter(new FileWriter(fileName));
                bw.write(ddlRows[1][0]);
                bw.write("\n/\n");
                bw.close();
            }
        } catch (e) {
            print("WARN: Could not get DDL for " + objType + " " + objName + ": " + e.message);
        }
    }
    print("Extracted " + (objects.length - 1) + " " + objType + " objects");
}

print("DDL extraction complete: " + outputDir);
```

---

## Handling Grants and Synonyms

### Generate Object Grants

```sql
DDL employees OBJECT_GRANT
```

Or via DBMS_METADATA:

```sql
SET LONG 1000000
SET LINESIZE 32767
SET HEADING OFF
SET FEEDBACK OFF

-- All grants on a table
SELECT DBMS_METADATA.GET_DEPENDENT_DDL('OBJECT_GRANT', 'EMPLOYEES') FROM DUAL;

-- All grants in the schema
SELECT DBMS_METADATA.GET_GRANTED_DDL('OBJECT_GRANT', USER) FROM DUAL;
```

### Generate Synonyms

```sql
DDL emp SYNONYM

-- All public synonyms pointing to this schema
SELECT DBMS_METADATA.GET_DDL('PUBLIC_SYNONYM', synonym_name)
FROM all_synonyms
WHERE table_owner = USER
  AND owner = 'PUBLIC';
```

---

## Differences from DBMS_METADATA Direct Use

| Aspect | SQLcl `DDL` command | `DBMS_METADATA.GET_DDL` direct |
|---|---|---|
| Syntax | `DDL tablename` | `SELECT DBMS_METADATA.GET_DDL('TABLE','TABLENAME') FROM DUAL` |
| Storage clauses | Suppressed by default | Included by default |
| Transform configuration | Via `SET DDL` session settings | Via `DBMS_METADATA.SET_TRANSFORM_PARAM` per session |
| Output destination | Screen (or SPOOL) | Returned as CLOB in query result |
| Readability | Formatted by default | Raw, must configure transforms |
| Scripting | Simple, but limited control | Full programmatic control |
| Object type detection | Auto-detects from catalog | Must specify exact type string |

### Configuring DBMS_METADATA Directly for Clean Output

If you use `DBMS_METADATA` in SQL scripts, apply these transforms for clean output:

```sql
BEGIN
    DBMS_METADATA.SET_TRANSFORM_PARAM(
        DBMS_METADATA.SESSION_TRANSFORM, 'STORAGE',            FALSE);
    DBMS_METADATA.SET_TRANSFORM_PARAM(
        DBMS_METADATA.SESSION_TRANSFORM, 'SEGMENT_ATTRIBUTES', FALSE);
    DBMS_METADATA.SET_TRANSFORM_PARAM(
        DBMS_METADATA.SESSION_TRANSFORM, 'TABLESPACE',         FALSE);
    DBMS_METADATA.SET_TRANSFORM_PARAM(
        DBMS_METADATA.SESSION_TRANSFORM, 'SQLTERMINATOR',      TRUE);
    DBMS_METADATA.SET_TRANSFORM_PARAM(
        DBMS_METADATA.SESSION_TRANSFORM, 'PRETTY',             TRUE);
END;
/
```

---

## Version Control Integration

### Directory Structure for Schema DDL

A clean directory structure for Git:

```
db/
  schema/
    tables/
      employees.sql
      departments.sql
      jobs.sql
    views/
      emp_details_view.sql
    packages/
      hr_utils.sql
      hr_utils_body.sql
    procedures/
      add_job_history.sql
    sequences/
      employee_seq.sql
    triggers/
      update_job_history.sql
  grants/
    object_grants.sql
  synonyms/
    public_synonyms.sql
  migrations/
    001_add_salary_history.sql
    002_add_department_budget.sql
```

### Automated Extraction Script

```shell
#!/bin/bash
# extract_schema.sh — Run from CI/CD or manually to refresh schema snapshots

export TNS_ADMIN=/path/to/wallet
OUTPUT_DIR="./db/schema"

sql -S "${DB_USER}/${DB_PASSWORD}@${DB_SERVICE}" <<EOF
SET DDL STORAGE OFF
SET DDL SEGMENT_ATTRIBUTES OFF
SET DDL TABLESPACE OFF
SET FEEDBACK OFF
SET HEADING OFF
SET PAGESIZE 0
SET LONG 1000000
SET LINESIZE 32767

-- Tables
SPOOL ${OUTPUT_DIR}/all_tables.sql
SELECT DBMS_METADATA.GET_DDL('TABLE', object_name) || CHR(10) || '/' || CHR(10)
FROM user_objects WHERE object_type = 'TABLE' ORDER BY object_name;
SPOOL OFF

-- Views
SPOOL ${OUTPUT_DIR}/all_views.sql
SELECT DBMS_METADATA.GET_DDL('VIEW', object_name) || CHR(10) || '/' || CHR(10)
FROM user_objects WHERE object_type = 'VIEW' ORDER BY object_name;
SPOOL OFF

exit
EOF
```

---

## Best Practices

- Always set `SET DDL STORAGE OFF`, `SET DDL SEGMENT_ATTRIBUTES OFF`, and `SET DDL TABLESPACE OFF` before generating DDL for version control. Schema DDL captured with storage clauses is environment-specific and will not deploy cleanly to other environments.
- Generate package spec and package body as separate files. They are separate Oracle object types and can be deployed independently (the body can change without altering the spec).
- For sequences in version control, normalize the `START WITH` value to 1 or a known baseline. Capturing the live `LAST_NUMBER` creates a sequence that cannot be deployed to a fresh environment predictably.
- Extract DDL periodically (e.g., nightly in CI) and commit the results to a dedicated `schema-snapshot` branch. This provides a searchable, diffable history of schema changes even if developers are not consistently writing migration scripts.
- Use SQLcl's `lb generate-schema` for a more structured approach. If you need the raw DDL files for direct deployment or documentation, the `DDL` command plus SPOOL is simpler.

---

## Common Mistakes and How to Avoid Them

**Mistake: DDL includes storage and physical attribute clauses**
Raw `DBMS_METADATA` and even the `DDL` command with default settings can include `STORAGE`, `PCTFREE`, `TABLESPACE`, and other clauses that vary between environments. Always configure `SET DDL STORAGE OFF` and related options before capturing DDL for version control.

**Mistake: `SET LONG` not set high enough**
The default `LONG` value (80 characters) will silently truncate CLOB output from `DBMS_METADATA`. Set `SET LONG 1000000` before running any DDL extraction that uses `DBMS_METADATA` in a SQL query.

**Mistake: Package body DDL not captured separately**
When scripting `user_objects`, `PACKAGE BODY` has `object_type = 'PACKAGE BODY'` (with a space). Querying for `'PACKAGE'` only captures the spec. Always query both `'PACKAGE'` and `'PACKAGE BODY'` separately.

**Mistake: System-generated constraint names in DDL**
Oracle auto-generates constraint names like `SYS_C00789123` for unnamed constraints. These names differ between environments, causing DDL conflicts on re-deployment. Ensure all constraints in source code are explicitly named before capturing schema DDL.

**Mistake: Capturing DDL for objects with compile errors**
`DBMS_METADATA.GET_DDL` will still return DDL for invalid objects, but deploying invalid PL/SQL DDL will produce objects in `INVALID` status. Run `SELECT object_name, status FROM user_objects WHERE status = 'INVALID'` first and fix all invalid objects before capturing baseline DDL.

---

## Sources

- [Oracle SQLcl 25.2 User's Guide](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/oracle-sqlcl-users-guide.pdf)
- [Configuring Your Generated DDL in SQL Developer and SQLcl — ThatJeffSmith](https://www.thatjeffsmith.com/archive/2016/05/configuring-your-generated-ddl-in-sql-developer-and-sqlcl/)
- [Generating Table DDL in Oracle Database — Oracle Developers Blog](https://blogs.oracle.com/developers/generating-table-ddl-in-oracle-database)
- [Working with Oracle SQLcl (DDL command reference)](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/19.4/sqcug/working-sqlcl.html)
