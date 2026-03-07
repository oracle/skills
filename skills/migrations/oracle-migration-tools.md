# Oracle Migration Tools Reference

## Overview

Migrating a database to Oracle is almost never a purely manual effort. A suite of tools exists to automate schema conversion, data migration, assessment, and ongoing replication. This guide covers the most important tools in the Oracle migration ecosystem: Oracle SQL Developer Migration Workbench, AWS Schema Conversion Tool (SCT), SSMA for Oracle, ora2pg, Oracle Zero Downtime Migration (ZDM), and a capability comparison matrix.

Understanding which tool to use — and for which phase — is as important as knowing the tool itself. Most migrations require at least two tools: one for schema conversion and one for data movement.

---

## Oracle SQL Developer Migration Workbench

Oracle SQL Developer includes a built-in Migration Workbench that supports migrations from MySQL, SQL Server, Sybase ASE, DB2, Access, and generic JDBC-connected databases.

### Step-by-Step: SQL Server to Oracle Migration

#### Step 1 — Set Up a Migration Repository

The Migration Workbench requires a dedicated Oracle schema to store migration metadata.

```sql
-- Create a dedicated migration repository schema
CREATE USER migration_repo IDENTIFIED BY "repo_password"
    DEFAULT TABLESPACE users QUOTA UNLIMITED ON users;
GRANT CONNECT, RESOURCE TO migration_repo;
GRANT CREATE VIEW TO migration_repo;
GRANT CREATE MATERIALIZED VIEW TO migration_repo;
```

In SQL Developer: **Tools → Migration → Create Migration Repository** — point it at the migration_repo schema.

#### Step 2 — Create Source Database Connection

- File → New Connection → Select "SQL Server" as connection type
- Provide JDBC URL, credentials, and test connectivity
- Tip: You need the SQL Server JDBC driver (jtds or Microsoft JDBC) in SQL Developer's classpath

#### Step 3 — Capture the Source Database

1. In the Migration Workbench (Tools → Migration), start a new migration project
2. Right-click the source connection → **Capture SQL Server Database**
3. Select the databases/schemas to capture
4. SQL Developer reads all DDL, constraints, views, stored procedures, and data

#### Step 4 — Convert

1. Right-click the captured source objects → **Convert to Oracle**
2. SQL Developer generates Oracle DDL for all captured objects
3. Review the **Migration Log** for errors and warnings:
   - Green: converted automatically
   - Yellow: converted with caveats
   - Red: could not convert — requires manual intervention

#### Step 5 — Inspect and Edit Generated DDL

Navigate the converted objects in the Migration Projects tree. Click each object to see the generated Oracle DDL. Edit directly in SQL Developer for objects flagged with warnings.

Common manual corrections:
- Stored procedures with dynamic SQL
- T-SQL-specific system functions
- Identity column seed/increment values
- Collation-specific comparisons

#### Step 6 — Create Target Oracle Connection

- Add a connection to your target Oracle database
- Ensure the target user/schema has CREATE TABLE, CREATE PROCEDURE, CREATE INDEX, etc. privileges

#### Step 7 — Migrate the Schema

1. Right-click the converted schema → **Migrate Schema to Oracle**
2. SQL Developer executes all DDL against the Oracle target
3. Review errors in the output window

#### Step 8 — Migrate Data

1. Right-click the migration project → **Migrate Data**
2. SQL Developer streams rows from SQL Server to Oracle via JDBC
3. Monitor progress in the Migration Data panel

#### Step 9 — Validate

SQL Developer provides a basic row count comparison after migration. For thorough validation, see `migration-data-validation.md`.

### What SQL Developer Migration Workbench Handles Well

- Table definitions with most data types
- Indexes and constraints (primary key, unique, foreign key, check)
- Views (with syntax conversion)
- Sequences and identity columns
- Simple stored procedures and functions
- Triggers (with partial conversion)

### Limitations

- Cannot handle CLR objects (SQL Server)
- Limited support for dynamic SQL in procedures
- Does not handle full-text indexes
- Performance for large data migrations (millions of rows) is slower than SQL*Loader direct path
- No incremental/CDC capability for low-downtime migrations

---

## AWS Schema Conversion Tool (SCT) — Oracle Target

AWS SCT was primarily designed for AWS-target migrations (RDS, Aurora, Redshift), but it also supports Oracle as both a source and a target. It provides a sophisticated rule engine for procedure conversion.

### Supported Sources for Oracle Target

- SQL Server → Oracle
- MySQL → Oracle
- PostgreSQL → Oracle
- Teradata → Oracle
- SAP ASE (Sybase) → Oracle

### Using AWS SCT for Oracle

1. **Install SCT** from the AWS download page. SCT runs as a standalone desktop application.

2. **Create a new project:**
   - File → New Project
   - Select source database type and target "Oracle"

3. **Connect to source and target databases**

4. **Run the Assessment Report:**
   - View → Assessment Report
   - SCT categorizes each object: automatically converted, converted with warnings, action required
   - Each category has a percentage coverage estimate

5. **Review the conversion dashboard:**
   - The dashboard shows a "conversion complexity" score
   - Objects requiring manual action are highlighted with explanations

6. **Convert the schema:**
   - Right-click source objects → Convert Schema
   - Review the converted Oracle DDL in the right panel

7. **Handle action items:**
   - SCT provides specific "to-do" items with Oracle documentation links
   - For each action item, edit the generated code or accept SCT's suggestion

8. **Apply to Oracle target:**
   - Right-click converted schema → Apply to Database

### SCT Extension Pack

For SQL Server migrations, SCT provides an Extension Pack that creates Oracle implementations of SQL Server system functions:

```sql
-- SCT installs an extension schema with Oracle equivalents of:
-- CHARINDEX → aws_sqlserver_ext.charindex(...)
-- LEFT       → aws_sqlserver_ext.left(...)
-- FORMAT     → aws_sqlserver_ext.format(...)
```

This allows converted code to call these functions without rewriting every occurrence. However, long-term you should replace extension pack calls with native Oracle equivalents.

### AWS SCT Strengths

- Excellent SQL Server to Oracle conversion quality
- Handles complex T-SQL patterns
- Extension pack for unmappable functions
- Good assessment metrics for effort estimation
- Free to use

### AWS SCT Limitations

- Requires AWS account setup even for non-AWS migrations
- Some complex stored procedures still require manual work
- UI can be slow for very large schemas
- Does not perform data migration (use AWS DMS or SQL*Loader separately)

---

## SSMA (SQL Server Migration Assistant) for Oracle

Microsoft's SSMA is designed to migrate SQL Server schemas and data to Oracle. It is free and available from the Microsoft Download Center.

Note: SSMA for Oracle migrates FROM Oracle TO SQL Server. For the reverse direction (SQL Server to Oracle), use SSMA for SQL Server which has an Oracle target option, or use AWS SCT.

The SSMA family includes:
- SSMA for Oracle (Oracle → SQL Server)
- SSMA for MySQL (MySQL → SQL Server/Azure SQL)
- SSMA for Sybase (Sybase → SQL Server)
- SSMA for Access (Access → SQL Server)

For SQL Server → Oracle migration specifically, AWS SCT or SQL Developer Migration Workbench are more appropriate.

### What SSMA Converts (Oracle to SQL Server direction)

- Tables, views, sequences, synonyms
- Stored procedures, functions, packages, triggers
- PL/SQL to T-SQL translation
- ROWNUM to TOP/ROW_NUMBER()
- DECODE to CASE
- Oracle date/time functions to SQL Server equivalents

---

## ora2pg — PostgreSQL/MySQL to Oracle

ora2pg is an open-source Perl tool that converts PostgreSQL or MySQL schemas and data to Oracle format. Despite the name, it supports both PostgreSQL AND MySQL as sources.

### Installation

```bash
# Install Perl dependencies
cpan DBD::Pg     # for PostgreSQL source
cpan DBD::mysql  # for MySQL source

# Install ora2pg
cpan Ora2Pg

# Or via distribution package
apt-get install ora2pg  # Debian/Ubuntu
yum install ora2pg      # RHEL/CentOS (via EPEL)
```

### Configuration File (ora2pg.conf)

```ini
# Source database type
TYPE            POSTGRES   # or MYSQL

# PostgreSQL source connection
PG_DSN          dbi:Pg:database=mydb;host=localhost;port=5432
PG_USER         myuser
PG_PWD          mypassword

# Oracle target connection
ORACLE_DSN      dbi:Oracle:host=orahost;sid=ORCL;port=1521
ORACLE_USER     orauser
ORACLE_PWD      orapassword

# Output settings
SCHEMA          myschema        # Source schema to migrate
FILE_PER_TABLE  1              # One output file per table
OUTPUT_DIR      /tmp/ora2pg_output/
NLS_LANG        AMERICAN_AMERICA.AL32UTF8

# Data type mapping overrides
DATA_TYPE       TEXT:CLOB,BYTEA:BLOB,BOOL:NUMBER(1)

# Objects to export
EXPORT_TYPE     TABLE,SEQUENCE,INDEX,CONSTRAINT,VIEW,PROCEDURE,FUNCTION,TRIGGER
```

### Running ora2pg

```bash
# Assess migration complexity
ora2pg -t SHOW_REPORT -c ora2pg.conf --estimate_cost

# Export table DDL
ora2pg -t TABLE -o tables.sql -c ora2pg.conf

# Export data as Oracle INSERT statements
ora2pg -t COPY -o data/ -c ora2pg.conf

# Export sequences
ora2pg -t SEQUENCE -o sequences.sql -c ora2pg.conf

# Export indexes
ora2pg -t INDEX -o indexes.sql -c ora2pg.conf

# Export constraints
ora2pg -t PKEY -o primary_keys.sql -c ora2pg.conf
ora2pg -t FKEY -o foreign_keys.sql -c ora2pg.conf
ora2pg -t CHECK -o check_constraints.sql -c ora2pg.conf

# Export views
ora2pg -t VIEW -o views.sql -c ora2pg.conf

# Export stored procedures
ora2pg -t PROCEDURE -o procedures.sql -c ora2pg.conf

# Export triggers
ora2pg -t TRIGGER -o triggers.sql -c ora2pg.conf

# Full migration assessment
ora2pg -c ora2pg.conf --estimate_cost > assessment_report.txt
```

### Migration Assessment Report

```bash
ora2pg -t SHOW_REPORT -c ora2pg.conf --estimate_cost 2>&1
```

Sample output:
```
-------------------------------------------------------------------------------
Ora2Pg migration level : B-5
-------------------------------------------------------------------------------
Total estimated cost: 226 workday(s)
Migration levels:
  A - Migration that might be run automatically
  B - Migration with code rewrite and a human action is required
  C - Migration that has no equivalent in Oracle
-------------------------------------------------------------------------------
Object type | Number | Invalid | Estimated cost | Comments
-------------------------------------------------------------------------------
TABLE       |    145 |       0 |             29 |
VIEW        |     42 |       3 |             21 |
PROCEDURE   |     67 |      12 |            134 |
FUNCTION    |     23 |       2 |             34 |
TRIGGER     |     18 |       0 |              8 |
-------------------------------------------------------------------------------
```

### ora2pg Strengths

- Excellent PostgreSQL and MySQL support
- Free and open source
- Migration complexity assessment
- Handles large data volumes via COPY format
- Actively maintained

### ora2pg Limitations

- Requires Perl and DBI drivers
- Stored procedure conversion quality varies
- Not GUI-based; command-line only
- PostgreSQL to Oracle is better supported than MySQL to Oracle

---

## Oracle Zero Downtime Migration (ZDM)

Oracle Zero Downtime Migration is Oracle's enterprise tool for migrating Oracle databases to Oracle Cloud Infrastructure (OCI) with minimal or zero downtime. It uses Oracle GoldenGate for continuous replication during the migration cutover window.

### ZDM Architecture

```
Source Oracle DB
     |
     v (initial bulk copy via Data Pump or RMAN)
Target Oracle DB (OCI, Exadata, Autonomous)
     |
     ^ (continuous redo log replication via GoldenGate)
     |
[Cutover point: redirect application connections]
```

### ZDM Migration Phases

1. **VALIDATE** — Check prerequisites: connectivity, version compatibility, space, privileges
2. **SETUP** — Configure GoldenGate, network, target database
3. **INITIALIZE** — Bulk transfer of initial data via Data Pump or RMAN
4. **REPLICATE** — GoldenGate replicates ongoing changes from source to target
5. **MONITOR** — Track replication lag until lag approaches zero
6. **CUTOVER** — Switch application connections to target; stop replication

### ZDM Configuration Example

```bash
# ZDM is installed on a separate ZDM host
# Configuration file: zdmconfig.rsp

MIGRATION_METHOD=ONLINE_PHYSICAL   # or ONLINE_LOGICAL, OFFLINE_PHYSICAL
PLATFORM_TYPE=EXACS                # Target: EXACS, DBCS, AUTONOMOUS_DATABASE
TARGETDATABASEADMINUSERNAME=admin
TARGETDATABASEADMINPASSWORD=<password>
SOURCEDATABASEADMINUSERNAME=sys
SOURCEDATABASEADMINPASSWORD=<password>

# GoldenGate settings (for online migration)
GOLDENGATESOURCEHOME=/u01/app/goldengate
GOLDENGATESOURCEHOSTUSERNAME=oracle
GOLDENGATETARGETHOME=/u01/app/goldengate_tgt

# Data Pump settings (for initial bulk load)
DATAPUMPSETTINGS_JOBMODE=SCHEMA
DATAPUMPSETTINGS_DATAPUMPPARAMETERS_PARALLELISM=4
```

```bash
# Validate migration
zdmcli migrate database -sourcedb ORCL \
    -sourcenode source_host \
    -srcauth zdmauth -srcarg1 user:oracle \
    -targetdatabase cdb_name \
    -targethostid abc123 \
    -tdbtokenarr token_string \
    -rsp /etc/zdm/zdmconfig.rsp \
    -eval   # -eval flag for dry-run validation only
```

### ZDM Strengths

- Oracle-to-Oracle migrations with near-zero downtime
- Built-in GoldenGate integration
- Supports physical (RMAN) and logical (Data Pump) migration methods
- OCI Autonomous Database as target
- Oracle-supported and documented

### ZDM Limitations

- Only migrates Oracle-to-Oracle (not cross-RDBMS)
- Requires OCI as target (not arbitrary Oracle installations)
- GoldenGate licensing required for online migration
- Complex setup for first-time users

---

## Tool Capability Comparison

| Capability | SQL Dev Workbench | AWS SCT | ora2pg | ZDM | GoldenGate |
|---|---|---|---|---|---|
| PostgreSQL → Oracle | Partial | Yes | Excellent | No | No |
| MySQL → Oracle | Yes | Yes | Yes | No | Yes |
| SQL Server → Oracle | Yes | Yes | No | No | Yes |
| Sybase → Oracle | Yes | Yes | No | No | No |
| DB2 → Oracle | Yes | No | No | No | No |
| Teradata → Oracle | No | No | No | No | No |
| Oracle → Oracle | No | No | No | Yes | Yes |
| Schema conversion | Yes | Yes | Yes | No | No |
| Data migration | Yes (slow) | No | Yes | Yes | Yes |
| Assessment report | Basic | Detailed | Detailed | Validation | No |
| Near-zero downtime | No | No | No | Yes | Yes |
| Cost | Free | Free | Free | Included w/OCI | Licensed |
| GUI | Yes | Yes | No (CLI) | CLI | Yes |
| Stored procedure conversion | Good | Excellent | Fair | N/A | N/A |

---

## Choosing the Right Tool Combination

### For SQL Server → Oracle

1. **AWS SCT** for schema conversion (tables, indexes, procedures)
2. **SQL*Loader** or **Oracle Data Pump** for bulk data migration
3. **Oracle GoldenGate** if near-zero downtime is required

### For PostgreSQL → Oracle

1. **ora2pg** for schema conversion and initial data load assessment
2. **SQL*Loader** with CSV export for bulk data
3. **ora2pg** COPY format for direct data migration

### For MySQL → Oracle

1. **SQL Developer Migration Workbench** or **ora2pg** for schema conversion
2. **SQL*Loader** with CSV export for data migration

### For Oracle → Oracle (Cloud Migration)

1. **Oracle ZDM** for the full migration lifecycle
2. **Data Pump** for offline schema/data transfer
3. **GoldenGate** for online continuous replication

### For MongoDB → Oracle

No dedicated tool; use a combination of:
1. **mongoexport** for data extraction
2. Custom Python ETL scripts for transformation
3. **SQL*Loader** for loading into Oracle
4. **Oracle JSON Duality Views** (23c) for document-style access layer

---

## Best Practices for Tool Usage

1. **Always run the assessment first.** Every tool above has an assessment or report mode. Run it before doing any actual migration. The assessment reveals unknown complexity and effort estimates.

2. **Migrate in phases.** Use the tool to migrate a subset of tables first, validate thoroughly, then proceed with the next batch. Never attempt a single-shot full migration of a large schema without phased validation.

3. **Keep generated DDL in version control.** All schema conversion tools generate SQL files. Commit these to Git before applying them to the target database. This creates an audit trail and enables rollback.

4. **Test stored procedure conversion manually.** No tool achieves 100% procedure conversion automatically. Plan for manual review of every converted procedure before deploying to production.

5. **Use PARALLEL and DIRECT PATH options for data loads.** When loading large datasets with SQL*Loader, always use `DIRECT=TRUE` and `PARALLEL=TRUE` for maximum throughput.

6. **Validate after every load.** Run row count and hash-based validation queries after each table migration. See `migration-data-validation.md` for full validation patterns.
