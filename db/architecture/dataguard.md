# Oracle Data Guard

## Overview

Oracle Data Guard is Oracle's high availability, disaster recovery, and data protection solution. It maintains one or more synchronized copies of a production database (the **primary**) called **standby databases**. If the primary becomes unavailable, a standby can be activated to take over, minimizing downtime and data loss.

Data Guard is a native feature of Oracle Database **Enterprise Edition**. Standard Edition is not supported. A primary can ship redo directly to up to 30 standby databases; with cascading, configurations can scale beyond 30 total standbys.

The two core services are:
- **Redo Transport Services** — automates transfer of redo data from primary to standby destinations; detects and resolves archive log gaps automatically.
- **Apply Services** — automatically applies received redo on the standby to maintain synchronization.

---

## 1. Standby Database Types

### Physical Standby

A block-for-block identical copy of the primary database. Redo Apply (Media Recovery via the MRP0 process) keeps it synchronized.

- Supports all data types and object types without restriction.
- Can be opened read-only while redo apply is active (requires Active Data Guard license for real-time query).
- Physical corruptions on the primary are **not** propagated to the standby.
- Supports RMAN backup offloading and rolling patch application.
- Most efficient apply method — bypasses SQL layer entirely.

### Logical Standby

Maintained via **SQL Apply** (LogMiner-based): redo is transformed into SQL statements and executed on an open read-write database.

- Open for read-write during apply; SQL Apply-maintained tables are protected from user DML by logical standby guard rules.
- Can carry additional indexes, partitioning, and materialized views not on the primary.
- Enables rolling database software upgrades using the `DBMS_ROLLING` package.
- Logical standby support has datatype and object restrictions. Starting with Oracle Database 12.2, newer types/features (for example long identifiers) are supported for logical replication by using `DBMS_ROLLING` or Oracle GoldenGate, not generic SQL Apply in all cases.

### Snapshot Standby

A physical standby temporarily converted to read-write for testing or development.

- Receives and archives redo from the primary but does **not** apply it.
- Local writes are discarded when converting back; Flashback Database is used internally.
- Cannot cascade to other standby databases.

```sql
-- Convert physical standby to snapshot standby
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
STARTUP MOUNT;
ALTER DATABASE CONVERT TO SNAPSHOT STANDBY;
ALTER DATABASE OPEN READ WRITE;

-- Convert back to physical standby
ALTER DATABASE CONVERT TO PHYSICAL STANDBY;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;
```

Via Broker:
```
DGMGRL> CONVERT DATABASE 'standby_db' TO SNAPSHOT STANDBY;
DGMGRL> CONVERT DATABASE 'standby_db' TO PHYSICAL STANDBY;
```

### Far Sync Instance

A lightweight remote instance (control file only — no datafiles) that accepts redo from the primary and forwards it to terminal standbys.

- Enables zero data loss at geographically distant standbys without direct synchronous transmission over a long-distance link.
- Cannot be opened; cannot run redo apply; cannot become primary.
- Requires Active Data Guard Far Sync license.

```
DGMGRL> ADD FAR_SYNC farsync_inst AS CONNECT IDENTIFIER IS farsync_tns;
DGMGRL> EDIT DATABASE primary_db SET PROPERTY
          RedoRoutes='(LOCAL : farsync_inst SYNC)(farsync_inst : standby_db ASYNC)';
DGMGRL> ENABLE FAR_SYNC farsync_inst;
```

---

## 2. Protection Modes

Protection modes control the trade-off between data protection and primary database performance.

### Maximum Performance (Default)

- Transactions commit as soon as redo is written to the online redo log.
- Redo transport to standby is **ASYNC** (no commit wait).
- Potential data loss equal to the transport lag.
- `LOG_ARCHIVE_DEST_n` must use: `ASYNC NOAFFIRM`

```sql
ALTER DATABASE SET STANDBY DATABASE TO MAXIMIZE PERFORMANCE;
```

### Maximum Availability

- Transactions commit after redo is received at the standby and acknowledged.
- Uses **SYNC** transport.
- If all synchronized standbys become unreachable, automatically falls back to Maximum Performance (primary stays up).
- Two sub-variants:
  - `SYNC AFFIRM` — waits for redo written to disk on standby (maximum durability)
  - `SYNC NOAFFIRM` (FastSync) — waits only for redo received in standby memory (better performance; small risk on simultaneous power failures at both sites)
- Recommended for most mission-critical deployments.

```sql
ALTER DATABASE SET STANDBY DATABASE TO MAXIMIZE AVAILABILITY;
```

### Maximum Protection

- Uses **SYNC AFFIRM**.
- Primary **shuts down** if it cannot write to a synchronized standby (does not fall back).
- Can only be set from Maximum Availability mode with at least one synchronized standby in place.
- Oracle recommends a minimum of two standby databases to avoid a single standby failure shutting down the primary.

```sql
ALTER DATABASE SET STANDBY DATABASE TO MAXIMIZE PROTECTION;
```

```sql
-- Verify current mode
SELECT PROTECTION_MODE, PROTECTION_LEVEL FROM V$DATABASE;
```

---

## 3. Redo Transport

### LOG_ARCHIVE_DEST_n

Configures where redo is archived and shipped. Up to 31 destinations (`LOG_ARCHIVE_DEST_1` through `LOG_ARCHIVE_DEST_31`).

```sql
-- Typical primary → standby transport (ASYNC)
ALTER SYSTEM SET LOG_ARCHIVE_DEST_2 =
  'SERVICE=standby_db ASYNC NOAFFIRM
   DB_UNIQUE_NAME=standby_db
   VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE)
   REOPEN=60'
  SCOPE=BOTH;

ALTER SYSTEM SET LOG_ARCHIVE_DEST_STATE_2 = ENABLE SCOPE=BOTH;

-- Synchronous transport (SYNC AFFIRM — Maximum Availability)
ALTER SYSTEM SET LOG_ARCHIVE_DEST_2 =
  'SERVICE=standby_db SYNC AFFIRM NET_TIMEOUT=30
   DB_UNIQUE_NAME=standby_db
   VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE)'
  SCOPE=BOTH;
```

Key `LOG_ARCHIVE_DEST_n` attributes:

| Attribute | Description |
|---|---|
| `SERVICE=<name>` | Oracle Net service name for remote destination |
| `SYNC` / `ASYNC` | Synchronous or asynchronous transport |
| `AFFIRM` / `NOAFFIRM` | Wait for redo written to disk at standby (`AFFIRM`) or not |
| `NET_TIMEOUT=<secs>` | How long LGWR waits for acknowledgment (SYNC only) |
| `VALID_FOR=(<log_type>,<role>)` | When to send: e.g. `(ONLINE_LOGFILES,PRIMARY_ROLE)` |
| `DB_UNIQUE_NAME=<name>` | Required when `LOG_ARCHIVE_CONFIG` DG_CONFIG list is set |
| `REOPEN=<secs>` | Min seconds between reconnect attempts on failure |
| `COMPRESSION=ENABLE` | Compress redo in transit (requires Advanced Compression license) |
| `DELAY=<minutes>` | Apply delay on standby (default 30 minutes if value omitted) |
| `MANDATORY` | Primary stalls if this destination cannot be archived |
| `ALTERNATE=LOG_ARCHIVE_DEST_n` | Failover destination if this one fails |

### LOG_ARCHIVE_CONFIG

Required when using `DB_UNIQUE_NAME` in `LOG_ARCHIVE_DEST_n`:

```sql
-- Set on every member
ALTER SYSTEM SET LOG_ARCHIVE_CONFIG='DG_CONFIG=(primary_db,standby_db)' SCOPE=BOTH;
```

### Standby Redo Logs

Required for real-time apply and synchronous transport. Size must be at least as large as the largest online redo log. Group count must be at least (primary online redo groups + 1) per thread.

```sql
-- Add standby redo log groups (run on standby)
ALTER DATABASE ADD STANDBY LOGFILE THREAD 1 SIZE 500M;

-- View standby redo logs
SELECT GROUP#, MEMBERS, BYTES/1048576 AS SIZE_MB, STATUS
FROM V$STANDBY_LOG;
```

### Monitoring Redo Transport

```sql
-- Destination status
SELECT DEST_ID, STATUS, TARGET, ARCHIVED_THREAD#, ARCHIVED_SEQ#
FROM V$ARCHIVE_DEST_STATUS
WHERE TARGET = 'STANDBY';

-- Check for archive gaps (run on physical standby)
SELECT THREAD#, LOW_SEQUENCE#, HIGH_SEQUENCE# FROM V$ARCHIVE_GAP;

-- SYNC response time histogram
SELECT * FROM V$REDO_DEST_RESP_HISTOGRAM WHERE DEST_ID = 2;
```

---

## 4. Apply Services

### Redo Apply (Physical Standby)

```sql
-- Start managed recovery (disconnected background process)
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT;

-- Stop managed recovery
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;

-- Remove a delay override
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE NODELAY;
```

> Note: The `USING CURRENT LOGFILE` clause was deprecated in Oracle 12.1 and is no longer required. Real-time apply is enabled automatically when standby redo logs are configured.

### SQL Apply (Logical Standby)

```sql
-- Start SQL Apply (real-time)
ALTER DATABASE START LOGICAL STANDBY APPLY IMMEDIATE;

-- Stop SQL Apply (waits for in-progress transactions to complete)
ALTER DATABASE STOP LOGICAL STANDBY APPLY;
```

### Monitoring Apply Progress

```sql
-- Primary view for process status (replaces deprecated V$MANAGED_STANDBY)
SELECT ROLE, THREAD#, SEQUENCE#, ACTION
FROM V$DATAGUARD_PROCESS;

-- Apply and transport lag (run on standby)
SELECT NAME, VALUE, TIME_COMPUTED, DATUM_TIME
FROM V$DATAGUARD_STATS
WHERE NAME IN ('transport lag', 'apply lag', 'apply finish time');

-- Overall database status
SELECT DATABASE_ROLE, OPEN_MODE, PROTECTION_MODE, SWITCHOVER_STATUS
FROM V$DATABASE;
```

---

## 5. Key Initialization Parameters

| Parameter | Description |
|---|---|
| `DB_NAME` | Same on primary and all standbys |
| `DB_UNIQUE_NAME` | Unique identifier per database; preserved across role transitions |
| `LOG_ARCHIVE_CONFIG` | `DG_CONFIG=(...)` list of all members; required for `DB_UNIQUE_NAME` in dest |
| `LOG_ARCHIVE_DEST_n` | Archive/redo transport destinations (up to 31) |
| `LOG_ARCHIVE_DEST_STATE_n` | `ENABLE`, `DEFER`, or `ALTERNATE` |
| `LOG_ARCHIVE_FORMAT` | Filename format for archived logs |
| `REMOTE_LOGIN_PASSWORDFILE` | `EXCLUSIVE` or `SHARED` — enables redo transport authentication |
| `FAL_SERVER` | Oracle Net alias of the server that resolves redo gaps |
| `DB_FILE_NAME_CONVERT` | Converts primary datafile paths to standby paths |
| `LOG_FILE_NAME_CONVERT` | Converts primary redo log paths to standby paths |
| `STANDBY_FILE_MANAGEMENT` | `AUTO` — creates/deletes standby datafiles automatically |
| `DG_BROKER_START` | `TRUE` — starts the DMON background process |
| `DG_BROKER_CONFIG_FILE1/2` | Locations of broker configuration files |
| `DATA_GUARD_SYNC_LATENCY` | Max seconds to wait for secondary SYNC standbys after first acknowledges |
| `STANDBY_DB_PRESERVE_STATES` | `NONE\|ALL\|SESSION\|BUFFER` — preserve sessions/buffers during role transition (12.2+) |
| `ENABLED_PDBS_ON_STANDBY` | Replicate a subset of PDBs to standby (CDB only) |
| `COMPATIBLE` | Must match on all members; logical standby may have a higher setting |

---

## 6. Data Guard Broker (DGMGRL)

Broker automates and centralizes configuration, monitoring, and role transitions. Using Broker is strongly recommended over manual `LOG_ARCHIVE_DEST_n` management.

### Enabling the Broker

```sql
-- Enable on every managed database instance (primary and all standbys)
ALTER SYSTEM SET DG_BROKER_START = TRUE SCOPE=BOTH;
```

### Creating a Configuration

```
$ dgmgrl

DGMGRL> CONNECT SYS@primary_db;

DGMGRL> CREATE CONFIGURATION 'DRSolution' AS
          PRIMARY DATABASE IS 'primary_db'
          CONNECT IDENTIFIER IS primary_tns;

DGMGRL> ADD DATABASE 'standby_db'
          AS CONNECT IDENTIFIER IS standby_tns
          MAINTAINED AS PHYSICAL;

DGMGRL> ENABLE CONFIGURATION;
```

### Common DGMGRL Commands

```
-- Health and status
DGMGRL> SHOW CONFIGURATION;
DGMGRL> SHOW CONFIGURATION LAG VERBOSE;
DGMGRL> SHOW DATABASE VERBOSE 'standby_db';
DGMGRL> SHOW DATABASE 'standby_db' 'ApplyLag';
DGMGRL> SHOW DATABASE 'standby_db' 'TransportLag';

-- Validation
DGMGRL> VALIDATE DATABASE 'standby_db';
DGMGRL> VALIDATE DATABASE STRICT 'standby_db';
DGMGRL> VALIDATE NETWORK CONFIGURATION FOR ALL;

-- Edit properties
DGMGRL> EDIT DATABASE 'standby_db' SET PROPERTY LogXptMode='SYNC';
DGMGRL> EDIT CONFIGURATION SET PROTECTION MODE AS MaxAvailability;

-- Role transitions
DGMGRL> SWITCHOVER TO 'standby_db';
DGMGRL> FAILOVER TO 'standby_db';
DGMGRL> REINSTATE DATABASE 'old_primary_db';

-- Maintenance
DGMGRL> DISABLE CONFIGURATION;
DGMGRL> REMOVE DATABASE 'standby_db';
DGMGRL> EXPORT CONFIGURATION TO '/path/config.dat';
DGMGRL> IMPORT CONFIGURATION FROM '/path/config.dat';
```

---

## 7. Switchover and Failover

### Switchover

A planned, graceful role reversal — both databases remain intact, no data loss. Used for planned maintenance, patching, or testing.

```
-- Verify readiness before switchover
DGMGRL> VALIDATE DATABASE 'standby_db';

-- Perform switchover (Broker manages both sides)
DGMGRL> SWITCHOVER TO 'standby_db';

-- Verify new roles
DGMGRL> SHOW CONFIGURATION;
```

Manual switchover (without Broker):
```sql
-- On primary: verify, then initiate
ALTER DATABASE SWITCHOVER TO standby_db VERIFY;
ALTER DATABASE SWITCHOVER TO standby_db;
ALTER DATABASE OPEN;

-- On new standby (former primary)
STARTUP MOUNT;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;
```

### Failover

An emergency operation when the primary is unavailable and cannot be recovered quickly. May involve data loss unless all redo was received.

```
-- Failover via Broker
DGMGRL> FAILOVER TO 'standby_db';

-- Skip unapplied redo (accepts potential data loss)
DGMGRL> FAILOVER TO 'standby_db' IMMEDIATE;
```

Manual failover (without Broker):
```sql
-- If primary is mountable, flush remaining redo first
ALTER SYSTEM FLUSH REDO TO standby_db;

-- Check for gaps on standby
SELECT THREAD#, LOW_SEQUENCE#, HIGH_SEQUENCE# FROM V$ARCHIVE_GAP;

-- Cancel apply and activate
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
ALTER DATABASE FAILOVER TO standby_db;
-- Last resort (accepts data loss):
ALTER DATABASE ACTIVATE PHYSICAL STANDBY DATABASE;
ALTER DATABASE OPEN;
```

### Reinstating the Old Primary

After failover, Flashback Database is used to roll the old primary back and re-synchronize it as a standby:

```
DGMGRL> REINSTATE DATABASE 'old_primary_db';
```

> Flashback Database must be enabled **before** the failover occurs:
> ```sql
> ALTER DATABASE FLASHBACK ON;
> ```

---

## 8. Fast-Start Failover (FSFO)

FSFO lets an observer process automatically initiate failover when the primary is unavailable, without DBA intervention. Requires Broker.

```
-- Enable FSFO (target must be a synchronized standby)
DGMGRL> ENABLE FAST_START FAILOVER;

-- Start the observer process
DGMGRL> START OBSERVER;

-- Validate the configuration
DGMGRL> VALIDATE FAST_START FAILOVER;

-- Test mode only (no automatic failover)
DGMGRL> ENABLE FAST_START FAILOVER OBSERVE ONLY;
```

Key FSFO requirements:
- Flashback Database must be enabled on both primary and standby.
- Standby redo logs must be configured on both databases.
- Observer must be running; if not: `ORA-16819` is raised.
- Up to 4 observers supported (26ai).

```sql
-- FSFO status from SQL
SELECT FS_FAILOVER_STATUS, FS_FAILOVER_CURRENT_TARGET,
       FS_FAILOVER_THRESHOLD, FS_FAILOVER_OBSERVER_PRESENT
FROM V$DATABASE;
```

---

## 9. Active Data Guard (Read Offload)

Active Data Guard allows a physical standby to be open **read-only** while simultaneously applying redo. Requires a separate Active Data Guard license.

```sql
-- Open the standby read-only, then start/ensure Redo Apply
ALTER DATABASE OPEN READ ONLY;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT;

-- Confirm the state
SELECT OPEN_MODE, DB_UNIQUE_NAME FROM V$DATABASE;
-- Expect: READ ONLY WITH APPLY
```

Session-level lag tolerance (Active Data Guard):

```sql
-- Reject query if standby lag exceeds 2 seconds
ALTER SESSION SET STANDBY_MAX_DATA_DELAY = 2;

-- Block until all received redo is applied
ALTER SESSION SYNC WITH PRIMARY;
```

---

## 10. Monitoring Views Reference

| View | Description |
|---|---|
| `V$DATABASE` | Role, protection mode, open mode, switchover status, FSFO status |
| `V$DATAGUARD_PROCESS` | All Data Guard background processes with role, thread, sequence, and action |
| `V$DATAGUARD_STATS` | Transport lag, apply lag, apply finish time |
| `V$ARCHIVE_DEST` | Configuration and status of all archive destinations |
| `V$ARCHIVE_DEST_STATUS` | Runtime status including `GAP_STATUS` per destination |
| `V$ARCHIVE_GAP` | Detected archive gaps on physical standby |
| `V$STANDBY_LOG` | Standby redo log groups |
| `V$DATAGUARD_STATUS` | Messages written to the alert log by Data Guard |
| `V$REDO_DEST_RESP_HISTOGRAM` | SYNC transport response time distribution |
| `V$STANDBY_EVENT_HISTOGRAM` | Apply lag histogram |
| `V$FS_FAILOVER_OBSERVERS` | Observer information for FSFO |
| `V$MANAGED_STANDBY` | Deprecated since 12.2 — use `V$DATAGUARD_PROCESS` |

Broker-specific views (26ai):

| View | Description |
|---|---|
| `V$DG_BROKER_CONFIG` | Broker configuration properties |
| `V$DG_BROKER_PROPERTY` | Detailed broker properties (26ai) |
| `V$DG_BROKER_ROLE_CHANGE` | Last 10 recorded role changes (26ai) |
| `V$FAST_START_FAILOVER_CONFIG` | FSFO configuration statistics (26ai) |
| `V$FS_LAG_HISTOGRAM` | Failover lag statistics (26ai) |

---

## 11. Best Practices

- **Use Data Guard Broker (DGMGRL)** for all operations. Manual `LOG_ARCHIVE_DEST_n` management is error-prone and difficult to maintain consistently.
- **Configure Standby Redo Logs** on both primary and standby. They are required for real-time apply and synchronous transport. Size groups identically to the primary online redo logs.
- **Use Maximum Availability** with SYNC transport for OLTP workloads where network round-trip to the standby is acceptable (typically < 5ms).
- **Enable Flashback Database** on the primary before any production use — it is required for reinstatement after failover.
- **Test switchovers regularly** (quarterly minimum). An untested failover procedure is an assumption, not a plan.
- **Monitor lag actively.** A standby with 4 hours of apply lag gives 4 hours of recovery time, not instant failover capability.
- **Back up from the standby** with RMAN to offload backup I/O from the primary.
- **Set `STANDBY_FILE_MANAGEMENT=AUTO`** to avoid manual datafile management when the primary adds new datafiles.

---

## 12. Common Mistakes

**Not configuring Standby Redo Logs**
Without SRLs, real-time apply is not possible and synchronous transport cannot acknowledge. Apply lag increases unnecessarily.

**Incorrect VALID_FOR on LOG_ARCHIVE_DEST_n**
The log type and role must match the sending database's state. Misconfiguration causes redo transport to silently stop.

```sql
-- Correct: ship online logs when acting as primary
ALTER SYSTEM SET LOG_ARCHIVE_DEST_2 =
  'SERVICE=standby_db ASYNC NOAFFIRM
   DB_UNIQUE_NAME=standby_db
   VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE)';
```

**Missing DB_UNIQUE_NAME on all members**
All databases must have unique `DB_UNIQUE_NAME` values. They can share the same `DB_NAME`.

```sql
SELECT DB_UNIQUE_NAME, DB_NAME FROM V$DATABASE;
```

**Failing over without checking for gaps**
Always verify gap status before manual failover:
```sql
SELECT * FROM V$ARCHIVE_GAP;
```

**Not enabling Flashback Database before failover**
Without Flashback, reinstating the old primary requires a full rebuild from backup.

**Using deprecated syntax**
The `USING CURRENT LOGFILE` clause (deprecated 12.1) and `V$MANAGED_STANDBY` (deprecated 12.2) still function but should not be used in new scripts. Use `V$DATAGUARD_PROCESS` instead.

---

## 13. Oracle Version Notes (19c vs 26ai)

- **Oracle 19c:** Full Data Guard functionality — physical, logical, and snapshot standbys; Far Sync; all three protection modes; Broker; DGMGRL; FSFO. `V$MANAGED_STANDBY` is the primary process monitoring view (deprecated in 12.2 but still present).
- **Oracle 21c:** Introduced Data Guard for Pluggable Databases (DG PDB) — protect individual PDBs within a CDB without replicating the entire container. PDB-level switchover/failover via Broker only.
- **Oracle 23ai:** `DBMS_ROLLING` available in multitenant environments.
- **Oracle 26ai new features:**
  - **`DBMS_DG` PL/SQL API** — programmatic interface for creating and managing broker configurations; tagging support.
  - **Up to 4 observers** for Fast-Start Failover (previously fewer).
  - **Preferred observer affinity** — affinitize observers to the current primary site.
  - **New FSFO properties:** `FastStartFailoverLagType`, `FastStartFailoverLagGraceTime`.
  - **New DGMGRL commands:** `EDIT ALL MEMBERS SET/RESET PROPERTY/PARAMETER`, tag management (`SET TAG`), `SHOW ALL MEMBERS`, `VALIDATE DATABASE STRICT`, `VALIDATE DGConnectIdentifier`, `PREPARE DATABASE FOR DATA GUARD`.
  - **Configuration and member tagging** for organizational labeling.
  - **Automatic temporary file creation** on standby databases.
  - **SQLcl integration:** DGMGRL commands available via Oracle SQLcl.
  - **New monitoring views:** `V$DG_BROKER_PROPERTY`, `V$DG_BROKER_ROLE_CHANGE`, `V$DG_BROKER_TAG`, `V$FAST_START_FAILOVER_CONFIG`, `V$FS_LAG_HISTOGRAM`.
  - **DG PDB enhancements:** DBCA PDB operations in DG environment; GoldenGate Per-PDB Capture as source PDB; automatic source switching on role transition.
- **`COMPATIBLE` parameter:** Must be identical on all members except logical standbys, which can have a higher setting.
- **`USING CURRENT LOGFILE`:** Deprecated since 12.1 — remove from any scripts.
- **`V$MANAGED_STANDBY`:** Deprecated since 12.2 — replaced by `V$DATAGUARD_PROCESS`.

---

## 14. Sources

- [Oracle Data Guard Concepts and Administration, Release 26.1](https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/index.html)
- [Oracle Data Guard Concepts and Administration 26.1 — Introduction](https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/introduction-to-oracle-data-guard-concepts.html)
- [Oracle Data Guard Concepts and Administration 26.1 — Protection Modes](https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/oracle-data-guard-protection-modes.html)
- [Oracle Data Guard Concepts and Administration 26.1 — Redo Transport Services](https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/oracle-data-guard-redo-transport-services.html)
- [Oracle Data Guard Concepts and Administration 26.1 — Redo Apply Services](https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/oracle-data-guard-redo-apply-services.html)
- [Oracle Data Guard Concepts and Administration 26.1 — Managing Role Transitions](https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/managing-oracle-data-guard-role-transitions.html)
- [Oracle Data Guard Concepts and Administration 26.1 — Creating a Physical Standby](https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/creating-oracle-data-guard-physical-standby.html)
- [Oracle Data Guard Broker, Release 26.1](https://docs.oracle.com/en/database/oracle/oracle-database/26/dgbkr/index.html)
- [Oracle Data Guard Concepts and Administration 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/sbydb/index.html)
