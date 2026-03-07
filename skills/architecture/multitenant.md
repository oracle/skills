# Oracle Multitenant Architecture: CDB and PDB Management

## Overview

Oracle Multitenant, introduced in Oracle 12c, is an architectural paradigm that consolidates multiple databases into a single database engine while preserving their isolation. A **Container Database (CDB)** is the outer shell — one Oracle instance, one set of background processes, one shared SGA. Inside it live **Pluggable Databases (PDBs)**, each appearing to applications as a fully independent Oracle database.

The multitenant architecture solves three historical problems with Oracle consolidation:
1. **Resource waste**: Running 50 separate single-tenant databases means 50 SGAs, 50 sets of background processes, and 50 sets of datafiles even when databases are small.
2. **Patching complexity**: In non-CDB, each database requires its own patching lifecycle. In CDB, patching the CDB patches all PDBs simultaneously.
3. **Provisioning speed**: Cloning a PDB from a template takes seconds rather than hours.

---

## 1. CDB Structure and Components

### Root Container (CDB$ROOT)

The root container is the administrative hub of the CDB. It contains:
- Oracle-supplied metadata (catalog, procedures, packages)
- Common users (prefixed `C##` by default) and common roles
- The common undo tablespace (in 12.2+ with shared undo mode)
- System and sysaux tablespaces for the CDB itself

The root container is **not** a user data container. Never create application schemas in CDB$ROOT.

### PDB$SEED

PDB$SEED is a read-only template PDB. When you create a new PDB with `CREATE PLUGGABLE DATABASE ... FROM`, it is cloned from PDB$SEED by default (unless you specify a different source). PDB$SEED cannot be opened in read/write mode or modified.

### User PDBs

User PDBs are the tenant containers where application data lives. Each PDB has:
- Its own system tablespace (containing local data dictionary extensions)
- Its own SYSAUX tablespace
- Its own USERS (default) tablespace
- Its own TEMP tablespace
- Its own undo tablespace (in local undo mode, recommended)

### CDB Architecture Query

```sql
-- View all containers and their status
SELECT con_id, name, open_mode, restricted, con_uid
FROM   v$pdbs
ORDER  BY con_id;

-- See which container you are currently connected to
SELECT sys_context('USERENV', 'CON_NAME') AS current_container,
       sys_context('USERENV', 'CON_ID')   AS container_id
FROM   dual;

-- Switch to a PDB (from CDB root, DBA privilege required)
ALTER SESSION SET CONTAINER = pdb_name;

-- Switch back to CDB root
ALTER SESSION SET CONTAINER = CDB$ROOT;
```

---

## 2. Creating and Managing PDBs

### Creating a PDB from Seed

```sql
-- Simplest form: create from PDB$SEED with default settings
CREATE PLUGGABLE DATABASE pdb_app1
    ADMIN USER pdb_admin IDENTIFIED BY "SecurePass#1"
    ROLES = (DBA)
    DEFAULT TABLESPACE users
        DATAFILE '/oradata/MYDB/pdb_app1/users01.dbf'
            SIZE 500M AUTOEXTEND ON NEXT 100M MAXSIZE 10G
    PATH_PREFIX = '/oradata/MYDB/pdb_app1/'
    FILE_NAME_CONVERT = ('/oradata/MYDB/pdbseed/', '/oradata/MYDB/pdb_app1/');

-- Open the new PDB
ALTER PLUGGABLE DATABASE pdb_app1 OPEN;

-- Make it auto-open on CDB startup
ALTER PLUGGABLE DATABASE pdb_app1 SAVE STATE;
```

### Creating a PDB with Storage Limits

```sql
CREATE PLUGGABLE DATABASE pdb_reporting
    ADMIN USER pdb_admin IDENTIFIED BY "ReportPass#2"
    STORAGE (MAXSIZE 50G MAXSHARED_TEMP_SIZE 5G)
    DEFAULT TABLESPACE app_data
        DATAFILE '/oradata/MYDB/pdb_reporting/app_data01.dbf'
            SIZE 1G AUTOEXTEND ON
    FILE_NAME_CONVERT = ('/oradata/MYDB/pdbseed/',
                         '/oradata/MYDB/pdb_reporting/');

ALTER PLUGGABLE DATABASE pdb_reporting OPEN;
ALTER PLUGGABLE DATABASE pdb_reporting SAVE STATE;
```

### Opening and Closing PDBs

```sql
-- Open a single PDB in read/write mode
ALTER PLUGGABLE DATABASE pdb_app1 OPEN READ WRITE;

-- Open all PDBs at once
ALTER PLUGGABLE DATABASE ALL OPEN;

-- Open all PDBs except one
ALTER PLUGGABLE DATABASE ALL EXCEPT pdb_maintenance OPEN;

-- Close a PDB (requires no active sessions by default)
ALTER PLUGGABLE DATABASE pdb_app1 CLOSE IMMEDIATE;

-- Check current open mode of all PDBs
SELECT name, open_mode, restricted
FROM   v$pdbs
ORDER  BY name;
```

---

## 3. Cloning PDBs

Cloning is one of the most powerful PDB operations. A PDB can be cloned locally within the same CDB, remotely from another CDB, or as a hot clone without closing the source.

### Local Clone (same CDB)

```sql
-- Clone pdb_app1 to a new PDB pdb_app1_test
-- Source PDB must be in READ ONLY mode for a cold clone
ALTER PLUGGABLE DATABASE pdb_app1 CLOSE IMMEDIATE;
ALTER PLUGGABLE DATABASE pdb_app1 OPEN READ ONLY;

CREATE PLUGGABLE DATABASE pdb_app1_test
    FROM pdb_app1
    FILE_NAME_CONVERT = ('/oradata/MYDB/pdb_app1/',
                         '/oradata/MYDB/pdb_app1_test/');

-- Reopen the source in read/write
ALTER PLUGGABLE DATABASE pdb_app1 CLOSE IMMEDIATE;
ALTER PLUGGABLE DATABASE pdb_app1 OPEN READ WRITE;

-- Open the clone
ALTER PLUGGABLE DATABASE pdb_app1_test OPEN;
```

### Hot Clone (no source downtime, 12.2+)

```sql
-- Hot clone requires the source to be in LOCAL UNDO mode
-- and Archivelog enabled on the CDB

-- Source stays open read/write during the clone
CREATE PLUGGABLE DATABASE pdb_app1_hotclone
    FROM pdb_app1
    FILE_NAME_CONVERT = ('/oradata/MYDB/pdb_app1/',
                         '/oradata/MYDB/pdb_app1_hotclone/')
    SNAPSHOT COPY;  -- SNAPSHOT COPY uses sparse files (ASM/ACFS) for instant clone
```

### Remote Clone (from another CDB)

```sql
-- Create a database link pointing to the source CDB
CREATE DATABASE LINK source_cdb_link
    CONNECT TO system IDENTIFIED BY "SourcePass#"
    USING 'SOURCE_CDB_TNSALIAS';

-- Clone the remote PDB
CREATE PLUGGABLE DATABASE pdb_migrated
    FROM pdb_source@source_cdb_link
    FILE_NAME_CONVERT = ('/oradata/SOURCECDB/pdb_source/',
                         '/oradata/MYDB/pdb_migrated/');
```

---

## 4. Plugging and Unplugging PDBs

Unplug/plug is the mechanism for migrating a PDB between CDBs or for archiving a PDB.

### Unplugging a PDB

```sql
-- Step 1: Close the PDB
ALTER PLUGGABLE DATABASE pdb_app1 CLOSE IMMEDIATE;

-- Step 2: Unplug to an XML manifest file
ALTER PLUGGABLE DATABASE pdb_app1
    UNPLUG INTO '/tmp/pdb_app1_manifest.xml';

-- Step 3: Drop the PDB from the current CDB (keeping datafiles)
DROP PLUGGABLE DATABASE pdb_app1 KEEP DATAFILES;
```

### Plugging a PDB into a New CDB

```sql
-- Step 1: Verify compatibility before plugging in
-- This check must be run AS SYSDBA in the target CDB
DECLARE
    l_result VARCHAR2(4000);
BEGIN
    l_result := DBMS_PDB.CHECK_PLUG_COMPATIBILITY(
        pdb_descr_file => '/tmp/pdb_app1_manifest.xml',
        pdb_name       => 'pdb_app1'
    );
END;
/

-- Check compatibility results
SELECT name, cause, type, message, status
FROM   PDB_PLUG_IN_VIOLATIONS
WHERE  name = 'PDB_APP1'
  AND  status = 'PENDING';

-- Step 2: Plug in the PDB
CREATE PLUGGABLE DATABASE pdb_app1
    USING '/tmp/pdb_app1_manifest.xml'
    COPY                              -- COPY, NOCOPY, or MOVE
    FILE_NAME_CONVERT = ('/oradata/OLDCDB/pdb_app1/',
                         '/oradata/NEWCDB/pdb_app1/')
    STORAGE UNLIMITED
    TEMPFILE REUSE;

-- Step 3: Open the PDB (may trigger a run of catcon.pl for version mismatches)
ALTER PLUGGABLE DATABASE pdb_app1 OPEN
    UPGRADE;  -- Use UPGRADE if source CDB version was lower
```

---

## 5. Resource Management Between PDBs

Oracle Database Resource Manager (DBRM) in a CDB context manages CPU and I/O allocation across all PDBs to prevent one tenant from monopolizing resources.

### CDB Resource Plan

```sql
-- Create the CDB-level resource plan
BEGIN
    DBMS_RESOURCE_MANAGER.CREATE_PENDING_AREA();

    -- Create the CDB plan
    DBMS_RESOURCE_MANAGER.CREATE_CDB_PLAN(
        plan    => 'CDB_PLAN_PROD',
        comment => 'Production CDB resource plan'
    );

    -- Assign shares and limits to individual PDBs
    -- shares: relative CPU weight (higher = more CPU when contention exists)
    -- utilization_limit: absolute CPU cap (% of total CDB CPU)
    DBMS_RESOURCE_MANAGER.CREATE_CDB_PLAN_DIRECTIVE(
        plan                  => 'CDB_PLAN_PROD',
        pluggable_database    => 'PDB_APP1',
        shares                => 4,
        utilization_limit     => 80,
        parallel_server_limit => 60
    );

    DBMS_RESOURCE_MANAGER.CREATE_CDB_PLAN_DIRECTIVE(
        plan                  => 'CDB_PLAN_PROD',
        pluggable_database    => 'PDB_REPORTING',
        shares                => 2,
        utilization_limit     => 40,
        parallel_server_limit => 30
    );

    -- Default directive for all other PDBs
    DBMS_RESOURCE_MANAGER.CREATE_CDB_PLAN_DIRECTIVE(
        plan                  => 'CDB_PLAN_PROD',
        pluggable_database    => 'ORA$DEFAULT_PDB_DIRECTIVE',
        shares                => 1,
        utilization_limit     => 20,
        parallel_server_limit => 10
    );

    DBMS_RESOURCE_MANAGER.VALIDATE_PENDING_AREA();
    DBMS_RESOURCE_MANAGER.SUBMIT_PENDING_AREA();
END;
/

-- Activate the CDB plan
ALTER SYSTEM SET RESOURCE_MANAGER_PLAN = 'CDB_PLAN_PROD' SCOPE = BOTH;
```

### Per-PDB Resource Plans

Within each PDB, you can also define a standard DBRM consumer group plan that applies to sessions inside that PDB only.

```sql
-- Connect to the PDB
ALTER SESSION SET CONTAINER = pdb_app1;

-- Create a PDB-level resource plan inside the PDB
BEGIN
    DBMS_RESOURCE_MANAGER.CREATE_PENDING_AREA();

    DBMS_RESOURCE_MANAGER.CREATE_PLAN('PDB_APP1_PLAN', 'Internal PDB plan');

    DBMS_RESOURCE_MANAGER.CREATE_CONSUMER_GROUP('OLTP_GROUP',   'OLTP users');
    DBMS_RESOURCE_MANAGER.CREATE_CONSUMER_GROUP('REPORT_GROUP', 'Report users');

    DBMS_RESOURCE_MANAGER.CREATE_PLAN_DIRECTIVE(
        plan           => 'PDB_APP1_PLAN',
        group_or_subplan => 'OLTP_GROUP',
        mgmt_p1        => 80
    );

    DBMS_RESOURCE_MANAGER.CREATE_PLAN_DIRECTIVE(
        plan             => 'PDB_APP1_PLAN',
        group_or_subplan => 'REPORT_GROUP',
        mgmt_p2          => 20
    );

    DBMS_RESOURCE_MANAGER.SUBMIT_PENDING_AREA();
END;
/

ALTER SYSTEM SET RESOURCE_MANAGER_PLAN = 'PDB_APP1_PLAN' SCOPE = BOTH;
```

### Memory Isolation per PDB (19c+)

```sql
-- Set SGA and PGA memory limits per PDB (requires 19c Multitenant license)
ALTER PLUGGABLE DATABASE pdb_app1
    SET SGA_TARGET = 8G SGA_MIN_SIZE = 4G;

ALTER PLUGGABLE DATABASE pdb_reporting
    SET SGA_TARGET = 4G;

-- Query memory allocation
SELECT con_id, name,
       sga_target / 1024 / 1024          AS sga_target_mb,
       sga_min_size / 1024 / 1024        AS sga_min_mb
FROM   v$pdbs
ORDER  BY con_id;
```

---

## 6. Common Users and Local Users

User types in a CDB are one of the most confusing aspects of multitenant. Misunderstanding this distinction leads to security and connectivity problems.

### Common Users

Common users are created in CDB$ROOT and exist (with the same identity) in all containers. They are distinguished by the `C##` prefix enforced by Oracle.

```sql
-- Connect to CDB$ROOT as SYSDBA
ALTER SESSION SET CONTAINER = CDB$ROOT;

-- Create a common DBA
CREATE USER c##dba_admin IDENTIFIED BY "AdminPass#1"
    CONTAINER = ALL;

-- Grant a common privilege across all containers
GRANT DBA TO c##dba_admin CONTAINER = ALL;

-- Grant privilege only in one specific container
GRANT READ ANY TABLE TO c##dba_admin CONTAINER = CURRENT;
```

### Local Users

Local users exist in exactly one PDB and cannot see or be seen from other PDBs or CDB$ROOT.

```sql
-- Connect to the target PDB first
ALTER SESSION SET CONTAINER = pdb_app1;

-- Create a local user (no C## prefix required)
CREATE USER app_owner IDENTIFIED BY "AppPass#1";
GRANT CONNECT, RESOURCE TO app_owner;
GRANT UNLIMITED TABLESPACE TO app_owner;
```

### Common Roles and Local Roles

The same distinction applies to roles. Oracle-supplied roles (DBA, SYSDBA, etc.) are common roles. Application-specific roles should be created as local roles within their PDB.

```sql
-- Common role (created in CDB$ROOT, available everywhere)
ALTER SESSION SET CONTAINER = CDB$ROOT;
CREATE ROLE c##common_readonly CONTAINER = ALL;
GRANT SELECT ANY TABLE TO c##common_readonly CONTAINER = ALL;

-- Local role (inside the PDB)
ALTER SESSION SET CONTAINER = pdb_app1;
CREATE ROLE app_readonly;
GRANT SELECT ON app_owner.orders TO app_readonly;
GRANT SELECT ON app_owner.customers TO app_readonly;
```

---

## 7. Application Containers (19c)

Application containers are a second level of containment inside a CDB. An Application Container acts as a root for a set of Application PDBs, allowing application-specific master data (seed data, reference tables, even PL/SQL objects) to be shared across all application PDBs.

```
CDB$ROOT
├── Application Container: APP_MASTER
│   ├── APP_SEED         (read-only template)
│   ├── APP_PDB_TENANT1  (tenant data + inherited app objects)
│   ├── APP_PDB_TENANT2
│   └── APP_PDB_TENANT3
└── PDB_OTHER            (regular PDB, not in app container)
```

### Creating an Application Container

```sql
-- Step 1: Create the Application Container in CDB$ROOT
ALTER SESSION SET CONTAINER = CDB$ROOT;

CREATE PLUGGABLE DATABASE saas_app_root
    AS APPLICATION CONTAINER
    ADMIN USER saas_admin IDENTIFIED BY "SaasAdmin#1"
    FILE_NAME_CONVERT = ('/oradata/MYDB/pdbseed/',
                         '/oradata/MYDB/saas_app_root/');

ALTER PLUGGABLE DATABASE saas_app_root OPEN;

-- Step 2: Connect to the Application Container and install the application
ALTER SESSION SET CONTAINER = saas_app_root;

ALTER PLUGGABLE DATABASE APPLICATION saas_crm BEGIN INSTALL '1.0';

-- Create shared application objects (visible to all app PDBs)
CREATE TABLE app_config (
    config_key   VARCHAR2(100) NOT NULL,
    config_value VARCHAR2(4000),
    CONSTRAINT pk_app_config PRIMARY KEY (config_key)
) SHARING = DATA;   -- DATA sharing: metadata AND rows shared

CREATE TABLE product_catalog (
    product_id   NUMBER NOT NULL,
    product_name VARCHAR2(200) NOT NULL,
    CONSTRAINT pk_product PRIMARY KEY (product_id)
) SHARING = EXTENDED DATA;  -- EXTENDED DATA: shared rows + tenants can add their own

ALTER PLUGGABLE DATABASE APPLICATION saas_crm END INSTALL '1.0';
```

### Table Sharing Options in Application Containers

| SHARING Clause | Metadata Shared | Data Shared | Tenant Can Add Rows |
|---|---|---|---|
| `METADATA` | Yes | No | Yes (private rows) |
| `DATA` | Yes | Yes | No |
| `EXTENDED DATA` | Yes | Yes | Yes (private rows visible only to tenant) |
| `NONE` | No | No | N/A (tenant-local table) |

---

## 8. Best Practices

- **Always use Local Undo mode (12.2+).** Shared Undo (the 12.1 default) means all undo for all PDBs is in one undo tablespace, making PDB-level point-in-time recovery much more difficult. Local undo places each PDB's undo in its own undo tablespace.
- **Use `SAVE STATE` for PDBs that should auto-open.** Without `SAVE STATE`, PDBs close when the CDB instance restarts and stay closed until manually opened.
- **Set storage limits on PDBs early.** Without `STORAGE (MAXSIZE ...)`, one runaway PDB can fill all shared disk, impacting all other PDBs.
- **Use a CDB-level resource plan from day one.** Without a resource plan, CPU allocation is first-come-first-served, and a heavy batch PDB can starve OLTP PDBs.
- **Apply patches at the CDB level.** One `opatch apply` patches all PDBs at once. This is a major operational advantage over non-CDB environments.
- **Keep CDB$ROOT clean.** No application data, no application schemas. CDB$ROOT should contain only common administrative objects.
- **Use separate CDBs for different lifecycle stages.** Put DEV PDBs in a DEV CDB and PROD PDBs in a PROD CDB. The CDB-level patch level and parameter settings apply to all contained PDBs.

---

## 9. Common Mistakes and How to Avoid Them

### Mistake 1: Creating Application Schemas in CDB$ROOT

Because CDB$ROOT is open by default and easy to connect to as SYSDBA, developers sometimes create their application tables in the root container. These objects are shared metadata objects — they behave unpredictably and are nearly impossible to clean up.

**Fix:** Enforce a policy that application schemas are only created inside designated PDBs. Use `PDB_LOCKDOWN` profiles to prevent non-administrative connections to CDB$ROOT.

### Mistake 2: Not Using `CONTAINER = ALL` When Granting Common Privileges

A common user granted a privilege with `CONTAINER = CURRENT` (while logged into CDB$ROOT) has that privilege only in CDB$ROOT, not in any PDB. This is a common source of "privilege not granted" errors when the common user connects directly to a PDB.

```sql
-- WRONG: grant only applies to CDB$ROOT
GRANT DBA TO c##dba_admin;

-- CORRECT: grant applies to all current and future containers
GRANT DBA TO c##dba_admin CONTAINER = ALL;
```

### Mistake 3: Forgetting to Set `LOCAL_LISTENER` Inside Each PDB

When PDBs need to register with different listeners (e.g., on different ports for different applications), each PDB must set its own `LOCAL_LISTENER` parameter.

```sql
ALTER SESSION SET CONTAINER = pdb_app1;
ALTER SYSTEM SET LOCAL_LISTENER = '(ADDRESS=(PROTOCOL=TCP)(HOST=myhost)(PORT=1521))' SCOPE = BOTH;
```

### Mistake 4: Using IMPDP/EXPDP Without Specifying the PDB

Data Pump defaults to the CDB root when run from the OS. Always connect through the PDB service or specify the appropriate connection string.

```bash
# WRONG: imports into CDB$ROOT
# impdp system/pwd directory=DATA_PUMP_DIR dumpfile=mydata.dmp

# CORRECT: imports into the specific PDB
# impdp system/pwd@//host:1521/pdb_app1 directory=DATA_PUMP_DIR dumpfile=mydata.dmp
```

### Mistake 5: Cloning a PDB Without Verifying the Compatibility Report

Plugging a PDB from a lower version CDB into a higher version CDB without running `DBMS_PDB.CHECK_PLUG_COMPATIBILITY` and resolving violations results in an incompatible PDB that either fails to open or opens with errors. Always review `PDB_PLUG_IN_VIOLATIONS` before opening a newly plugged PDB.

---

## Sources

- [Oracle Multitenant Administrator's Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/multi/) — CDB/PDB architecture, creating and managing PDBs, cloning, plugging/unplugging, common users, Application Containers
- [DBMS_PDB (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_PDB.html) — CHECK_PLUG_COMPATIBILITY procedure
- [DBMS_RESOURCE_MANAGER (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_RESOURCE_MANAGER.html) — CREATE_CDB_PLAN, CREATE_CDB_PLAN_DIRECTIVE procedures
