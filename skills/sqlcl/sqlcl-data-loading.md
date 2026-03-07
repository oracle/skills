# SQLcl Data Loading

## Overview

SQLcl includes a built-in `LOAD` command that enables direct ingestion of CSV and JSON data into Oracle tables without requiring SQL*Loader, external tables, or any additional tools. The `LOAD` command is designed for interactive and scripted data imports, developer workflows, and moderate-volume data loading scenarios.

The `LOAD` command is best suited for:
- Loading reference/seed data during development or testing
- Importing CSV exports from spreadsheets or other databases
- Ingesting JSON documents into Oracle tables (including JSON columns)
- Quick data fixes and one-time imports in a DevOps context
- Automated data loading as part of CI/CD pipelines

For very high-volume production loads (hundreds of millions of rows), SQL*Loader's direct-path load mode or Oracle Data Pump remain the appropriate tools. The `LOAD` command is a general-purpose, high-convenience tool for the majority of development and operational data loading needs.

---

## Basic LOAD Command Syntax

```sql
LOAD [options] table_name file_path
```

Or the more explicit form:

```sql
LOAD DATA INFILE 'file.csv' INTO TABLE my_table [options]
```

The simplest form, using defaults:

```sql
-- Load a CSV file where the first row contains column headers matching table column names
LOAD employees_import /tmp/employees.csv
```

SQLcl will:
1. Open the file
2. Read the first row as column names
3. Match column names to the target table's columns (case-insensitive)
4. Insert each subsequent row
5. Commit at the end

---

## LOAD Options

Options are specified as keyword arguments after the table name and file path:

```sql
LOAD table_name file_path [option value] [option value] ...
```

### Key Options

| Option | Values | Description |
|---|---|---|
| `SKIP` | integer | Skip N rows from the top of the file (in addition to the header row) |
| `HEADER` | ON / OFF | Whether the first row contains column headers (default ON) |
| `COLUMNS` | column list | Explicit column mapping when headers are absent or differ |
| `DELIMITER` | character | Field delimiter character (default comma) |
| `ENCLOSURE` | character | Quote character for enclosed fields (default double-quote) |
| `BATCHSIZE` | integer | Number of rows per commit batch (default 50) |
| `DATEFORMAT` | format string | Oracle date format mask for date columns |
| `TIMESTAMPFORMAT` | format string | Oracle timestamp format mask |
| `NULLIF` | string | Treat this string value as NULL (e.g., `NULLIF 'N/A'`) |
| `ERRORS` | integer | Maximum number of errors before aborting (default 50) |
| `ERROR_LOG` | file path | Write rejected rows to this file |
| `TRUNCATE` | ON / OFF | Truncate the table before loading |
| `REPLACE` | ON / OFF | Delete all rows before loading |
| `APPEND` | ON / OFF | Append to existing rows (default behavior) |

---

## CSV Loading Examples

### Basic Load with Header Row

File: `/tmp/departments.csv`
```
DEPARTMENT_ID,DEPARTMENT_NAME,MANAGER_ID,LOCATION_ID
10,Administration,200,1700
20,Marketing,201,1800
30,Purchasing,114,1700
```

```sql
LOAD departments /tmp/departments.csv
```

### Load with No Header Row (Explicit Column Mapping)

File: `/tmp/jobs_noheader.csv`
```
AD_PRES,President,20000,40000
AD_VP,Administration Vice President,15000,30000
```

```sql
LOAD jobs /tmp/jobs_noheader.csv HEADER OFF COLUMNS JOB_ID,JOB_TITLE,MIN_SALARY,MAX_SALARY
```

### Custom Delimiter

Pipe-delimited file:
```
100|Steven|King|SKING|515.123.4567|17-JUN-03|AD_PRES|24000|||(null)|90
```

```sql
LOAD employees /tmp/employees_pipe.csv DELIMITER |
```

### Semicolon-delimited with NULLIF

```sql
LOAD employees /tmp/employees_semi.csv DELIMITER ; NULLIF "(null)"
```

### Date Format Specification

File with ISO dates:
```
EMPLOYEE_ID,FIRST_NAME,LAST_NAME,HIRE_DATE
200,Jennifer,Whalen,1987-09-17
201,Michael,Hartstein,1996-02-17
```

```sql
LOAD employees /tmp/employees_isodate.csv DATEFORMAT YYYY-MM-DD
```

Common date format patterns:

```sql
-- ISO date
DATEFORMAT YYYY-MM-DD

-- US format
DATEFORMAT MM/DD/YYYY

-- Oracle default (requires careful match)
DATEFORMAT DD-MON-RR

-- With time
DATEFORMAT YYYY-MM-DD HH24:MI:SS
TIMESTAMPFORMAT YYYY-MM-DD HH24:MI:SS.FF
```

### Batch Size and Commit Frequency

```sql
-- Commit every 1000 rows (good for large files)
LOAD big_table /tmp/bigdata.csv BATCHSIZE 1000
```

### Truncate Before Load

```sql
-- Clear table first, then load
LOAD departments /tmp/departments.csv TRUNCATE ON
```

### Skip Rows

```sql
-- Skip the first 5 rows (e.g., file has comment rows before headers)
LOAD departments /tmp/departments.csv SKIP 5
```

### Error Logging

```sql
-- Allow up to 100 errors and log rejected rows
LOAD employees /tmp/employees.csv ERRORS 100 ERROR_LOG /tmp/load_errors.csv
```

The error log file records:
- The rejected row content
- The error message for each failure

---

## JSON Loading

SQLcl `LOAD` also handles JSON input. The JSON file should contain an array of objects:

```json
[
  {"EMPLOYEE_ID": 300, "FIRST_NAME": "Alice", "LAST_NAME": "Johnson", "SALARY": 55000},
  {"EMPLOYEE_ID": 301, "FIRST_NAME": "Bob",   "LAST_NAME": "Williams","SALARY": 62000}
]
```

```sql
LOAD employees /tmp/new_employees.json
```

SQLcl detects JSON format automatically based on the file extension (`.json`). Field names in the JSON objects are matched to column names case-insensitively.

### Loading JSON into a JSON Column

For tables with Oracle JSON columns (Oracle 21c+ native JSON type or `CLOB` with `IS JSON` constraint):

```sql
-- Table with a JSON column
CREATE TABLE product_docs (
    id     NUMBER PRIMARY KEY,
    doc    JSON
);

-- The LOAD command can populate JSON column values directly
-- Include the JSON content as a string value in the CSV
```

For complex JSON-to-relational loading scenarios, consider using `INSERT ... SELECT` with `JSON_VALUE` and `JSON_TABLE` instead of `LOAD`.

---

## Full Example: End-to-End CSV Import Workflow

### Step 1: Prepare the Target Table

```sql
CREATE TABLE staging_employees (
    employee_id   NUMBER(6),
    first_name    VARCHAR2(20),
    last_name     VARCHAR2(25),
    email         VARCHAR2(25),
    hire_date     DATE,
    job_id        VARCHAR2(10),
    salary        NUMBER(8,2),
    department_id NUMBER(4)
);
```

### Step 2: Verify the CSV Structure

```sql
-- Preview what LOAD will do without actually loading
-- (SQLcl does not have a dry-run flag, so test with a small file subset)
LOAD staging_employees /tmp/employees_sample.csv
```

### Step 3: Load the Full File

```sql
LOAD staging_employees /tmp/employees_full.csv
  BATCHSIZE 500
  DATEFORMAT YYYY-MM-DD
  ERRORS 50
  ERROR_LOG /tmp/emp_load_errors.csv
  TRUNCATE ON
```

### Step 4: Verify and Validate

```sql
-- Check row counts
SELECT COUNT(*) FROM staging_employees;

-- Check for NULLs in critical columns
SELECT COUNT(*) FROM staging_employees WHERE last_name IS NULL OR email IS NULL;

-- Review the error log
-- (If errors occurred, review /tmp/emp_load_errors.csv)
```

### Step 5: Promote to Production Table

```sql
-- Merge or insert from staging to production
MERGE INTO employees e
USING staging_employees s
ON (e.employee_id = s.employee_id)
WHEN MATCHED THEN
    UPDATE SET e.salary = s.salary, e.job_id = s.job_id
WHEN NOT MATCHED THEN
    INSERT (employee_id, first_name, last_name, email, hire_date, job_id, salary, department_id)
    VALUES (s.employee_id, s.first_name, s.last_name, s.email, s.hire_date, s.job_id, s.salary, s.department_id);

COMMIT;
```

---

## Comparison: LOAD vs SQL*Loader vs External Tables

| Feature | SQLcl LOAD | SQL*Loader | External Tables |
|---|---|---|---|
| Requires separate tool | No (built-in) | Yes (`sqlldr`) | No (Oracle feature) |
| Setup complexity | Minimal | Control file needed | DDL for ext table needed |
| Performance (large volumes) | Good (conventional path) | Excellent (direct-path option) | Good (parallel capable) |
| Direct-path load | No | Yes | Yes |
| Parallel load | No | Yes (with options) | Yes |
| Character set handling | JVM-based | Configurable | Configurable |
| Date format control | Yes | Yes (fine-grained) | Yes |
| Error logging | Basic | Full BAD/DISCARD files | Via Oracle error logging |
| LOB column support | Limited | Full | Full |
| JSON input | Yes | Limited | Limited |
| In-database scheduling | No | Via OS scheduler | Via DBMS_SCHEDULER |
| Ideal for | Dev/test/CI loads | High-volume production | Ongoing external data access |
| Max practical row count | Millions | Billions | Depends on file system |

---

## Comparing LOAD to External Tables

External tables are better when:
- The source file is large and will be loaded repeatedly
- You need SELECT-based transformation during load
- You want Oracle to manage parallel data access

```sql
-- External table approach (for repeated or parallel access)
CREATE TABLE ext_employees (
    employee_id   NUMBER(6),
    first_name    VARCHAR2(20),
    last_name     VARCHAR2(25),
    hire_date     DATE,
    salary        NUMBER(8,2)
)
ORGANIZATION EXTERNAL (
    TYPE oracle_loader
    DEFAULT DIRECTORY ext_data_dir
    ACCESS PARAMETERS (
        RECORDS DELIMITED BY NEWLINE
        FIELDS TERMINATED BY ','
        OPTIONALLY ENCLOSED BY '"'
        DATE FORMAT DATE MASK "YYYY-MM-DD"
        MISSING FIELD VALUES ARE NULL
        (employee_id, first_name, last_name, hire_date, salary)
    )
    LOCATION ('employees.csv')
)
REJECT LIMIT UNLIMITED;

-- Then load into heap table
INSERT INTO employees SELECT * FROM ext_employees;
COMMIT;
```

SQLcl `LOAD` is simpler and does not require Oracle directory objects or DBA involvement.

---

## Scripting LOAD in a CI/CD Pipeline

### Shell Script with SQLcl LOAD

```shell
#!/bin/bash
# load_reference_data.sh

set -e

export TNS_ADMIN=/path/to/wallet
DATA_DIR="/opt/app/reference-data"

sql -S "${DB_USER}/${DB_PASSWORD}@${DB_SERVICE}" <<EOF
-- Load reference tables
LOAD countries ${DATA_DIR}/countries.csv TRUNCATE ON BATCHSIZE 200
LOAD regions   ${DATA_DIR}/regions.csv   TRUNCATE ON BATCHSIZE 200
LOAD jobs      ${DATA_DIR}/jobs.csv      TRUNCATE ON BATCHSIZE 200

-- Verify
SELECT 'countries' AS tbl, COUNT(*) AS cnt FROM countries
UNION ALL SELECT 'regions', COUNT(*) FROM regions
UNION ALL SELECT 'jobs',    COUNT(*) FROM jobs;

EXIT
EOF

if [ $? -eq 0 ]; then
    echo "Reference data loaded successfully"
else
    echo "ERROR: Data load failed"
    exit 1
fi
```

### SQL Wrapper for Multiple CSV Files

```sql
-- load_all_reference.sql
SET FEEDBACK ON
SET ECHO ON

LOAD countries  /opt/data/countries.csv  TRUNCATE ON
LOAD regions    /opt/data/regions.csv    TRUNCATE ON
LOAD locations  /opt/data/locations.csv  TRUNCATE ON DATEFORMAT YYYY-MM-DD
LOAD departments /opt/data/departments.csv TRUNCATE ON
LOAD jobs       /opt/data/jobs.csv       TRUNCATE ON

-- Verify counts
SELECT table_name, num_rows
FROM user_tables
WHERE table_name IN ('COUNTRIES','REGIONS','LOCATIONS','DEPARTMENTS','JOBS')
ORDER BY table_name;

EXIT
```

```shell
sql -S user/pass@service @load_all_reference.sql
```

---

## Best Practices

- Always load into a **staging table** first rather than directly into production tables. Validate the data in the staging table before merging or inserting into production, so errors can be corrected without affecting live data.
- Set `ERRORS 0` in production load scripts to abort immediately on the first error rather than silently skipping bad rows. Use a non-zero value only when partial loads with rejection logging are acceptable.
- Always specify `DATEFORMAT` explicitly when loading date columns. Do not rely on the session NLS_DATE_FORMAT, which can vary between environments and users.
- Use `BATCHSIZE 500` or `BATCHSIZE 1000` for large files to reduce individual commit sizes and improve recoverability. If the load fails halfway through, you lose at most one batch rather than all progress.
- Test the load against a small representative sample (50–100 rows) before running the full file to catch column mapping errors, date format mismatches, and data type issues early.
- For production reference data loads, check the row count after loading and fail the pipeline if the count differs from an expected value.

---

## Common Mistakes and How to Avoid Them

**Mistake: Column name case mismatch between CSV header and table columns**
SQLcl `LOAD` matches column names case-insensitively. A CSV header `employee_id` will match the Oracle column `EMPLOYEE_ID`. However, be aware that quoted column names in Oracle that are mixed-case (created with double quotes) will not match unless the case is exact.

**Mistake: Loading dates without specifying DATEFORMAT**
Oracle's default date format is locale-dependent. A CSV with `2025-01-15` will fail to load without `DATEFORMAT YYYY-MM-DD`. Always specify the format explicitly.

**Mistake: Silent truncation of numeric values**
If a CSV contains a value like `999999999999` for a `NUMBER(6)` column, the LOAD will generate an error for that row (not truncate the value). Review your ERROR_LOG to catch precision mismatches.

**Mistake: Encoding issues with non-ASCII characters**
SQLcl reads CSV files using the JVM's default file encoding. If your CSV contains UTF-8 characters and the JVM is using a different charset, characters will be corrupted. Set `JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"` before starting SQLcl when loading international data.

**Mistake: Loading into a table with foreign key constraints active**
If the target table has foreign key constraints pointing to tables not yet populated, all rows will be rejected. Either load parent tables first, temporarily disable constraints (`ALTER TABLE ... DISABLE CONSTRAINT`), or use a staging table approach.

**Mistake: Not specifying TRUNCATE or APPEND explicitly for repeated loads**
The default behavior is APPEND. Running a load script twice will create duplicate rows. For idempotent loads (safe to run multiple times), use `TRUNCATE ON` to clear the table first, or use a staging-plus-merge pattern with a unique key.

---

## Sources

- [Loading a File — Oracle SQLcl Docs](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/23.1/sqcug/loading-file.html)
- [Oracle SQLcl 25.2 User's Guide](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/oracle-sqlcl-users-guide.pdf)
- [SQLcl: Unload and Load Table Data — ORACLE-BASE](https://oracle-base.com/articles/misc/sqlcl-unload-and-load-table-data)
- [Loading Data into Oracle with SQLcl — ThatJeffSmith](https://www.thatjeffsmith.com/archive/2020/08/loading-data-into-oracle-with-sqlcl/)
