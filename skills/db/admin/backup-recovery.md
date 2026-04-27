# Oracle RMAN Backup and Recovery

## Overview

Recovery Manager (RMAN) is Oracle's primary tool for database backup, restore, and recovery operations. It provides block-level backup integrity checking, compression, encryption, incremental backups, and tight integration with the Oracle database engine. RMAN eliminates the need for manual backup scripting and ensures consistent backups even for an open database.

Understanding backup and recovery is the single most critical skill for any Oracle DBA. A database that cannot be recovered is a database that cannot be trusted.

---

## RMAN Architecture

### Core Components

**RMAN Executable**
The `rman` binary that connects to the target database and optionally a recovery catalog. It interprets RMAN commands, communicates with the target database server processes, and manages backup metadata.

**Target Database**
The database being backed up or recovered. RMAN connects using a dedicated server process and reads backup metadata from the control file or recovery catalog.

**Recovery Catalog**
An optional but recommended separate Oracle schema that stores RMAN metadata (backup history, datafile information, archived log history). Without a catalog, metadata is stored only in the target's control file. A catalog enables cross-database reporting, stored scripts, and longer retention of backup history than the control file alone.

**Media Management Layer (MML)**
An optional third-party interface (e.g., Oracle Secure Backup, Veritas NetBackup, Commvault) that allows RMAN to write backups directly to tape libraries. RMAN communicates with the MML via the SBT (System Backup to Tape) channel type.

**Channels**
Channels are server processes that perform the actual I/O. Each channel maps to one backup stream. RMAN supports automatic channels (configured via `CONFIGURE`) or manually allocated channels within a `RUN` block.

```
RMAN Architecture:
┌─────────────┐       ┌──────────────────────┐
│  RMAN Client│──────▶│  Target Database      │
│  (rman exe) │       │  (server process)     │
└─────────────┘       │  reads: control file  │
        │             └──────────────────────┘
        │                        │
        ▼                        ▼
┌──────────────────┐    ┌─────────────────────┐
│ Recovery Catalog │    │   Backup Pieces /    │
│ (separate DB)    │    │   Image Copies on    │
│ RMAN schema      │    │   Disk or Tape       │
└──────────────────┘    └─────────────────────┘
```

---

## Backup Sets vs Image Copies

### Backup Sets

A backup set is RMAN's proprietary backup format. It consists of one or more **backup pieces** (physical files). RMAN reads used blocks from datafiles and packs them into backup pieces, skipping unused blocks by default. This makes backup sets smaller than image copies.

- Supports compression (BASIC, LOW, MEDIUM, HIGH via `AS COMPRESSED BACKUPSET`)
- Supports encryption
- Supports incremental backups natively
- Required for tape (SBT) backups
- Cannot be used directly by Oracle without RMAN restore; must be restored before use

```sql
-- Create a full backup set of the database
BACKUP DATABASE;

-- Create a compressed backup set
BACKUP AS COMPRESSED BACKUPSET DATABASE;

-- Backup a specific tablespace as a backup set
BACKUP TABLESPACE users;
```

### Image Copies

An image copy is a bit-for-bit copy of a datafile, archived log, or control file — identical in format to the original. It can be used directly by Oracle (e.g., placed in the correct location and recovered without a restore step).

- Faster recovery: no restore step needed, just switch and recover
- Larger on disk: copies all blocks including unused ones
- Can be incrementally updated with `RECOVER COPY` (rolling forward an image copy with incremental backups)
- Cannot be written to tape via SBT without conversion

```sql
-- Create image copies of all datafiles
BACKUP AS COPY DATABASE;

-- Create an image copy of a specific datafile
BACKUP AS COPY DATAFILE '/oradata/users01.dbf';
```

### Backup Sets vs Image Copies: When to Use Each

| Factor | Backup Set | Image Copy |
|---|---|---|
| Disk space | Smaller (skips empty blocks) | Larger (full copy) |
| Backup time | Slower (compression overhead possible) | Faster |
| Recovery time | Slower (restore + recover) | Faster (switch + recover) |
| Tape support | Yes | No (directly) |
| Incrementally updatable | Yes (incremental backups) | Yes (RECOVER COPY) |
| Direct use without RMAN | No | Yes |

---

## Incremental Backups (Level 0 and Level 1)

Incremental backups copy only blocks that have changed since a previous backup. RMAN tracks changed blocks using the **Block Change Tracking (BCT)** file, which dramatically speeds up incremental backups by avoiding full datafile scans.

### Level 0

A level 0 incremental backup is the baseline — it copies all used blocks, exactly like a full backup, but it is tagged as an incremental baseline. A subsequent level 1 backup can be taken against it.

```sql
-- Full incremental baseline (Level 0)
BACKUP INCREMENTAL LEVEL 0 DATABASE;
```

### Level 1

A level 1 incremental backup copies only blocks changed since the most recent level 0 or level 1 backup. There are two types:

- **Differential** (default): copies blocks changed since the last level 0 or level 1
- **Cumulative**: copies blocks changed since the last level 0 only

```sql
-- Differential incremental (default) — backs up changes since last level 0 or 1
BACKUP INCREMENTAL LEVEL 1 DATABASE;

-- Cumulative incremental — backs up all changes since last level 0
BACKUP INCREMENTAL LEVEL 1 CUMULATIVE DATABASE;
```

### Typical Weekly Incremental Strategy

```
Sunday:    BACKUP INCREMENTAL LEVEL 0 DATABASE;   -- full baseline
Monday:    BACKUP INCREMENTAL LEVEL 1 DATABASE;   -- Mon changes
Tuesday:   BACKUP INCREMENTAL LEVEL 1 DATABASE;   -- Tue changes
Wednesday: BACKUP INCREMENTAL LEVEL 1 DATABASE;   -- Wed changes
...
Saturday:  BACKUP INCREMENTAL LEVEL 1 DATABASE;   -- Sat changes
```

### Block Change Tracking

Enable BCT to avoid full datafile scan during incremental backups:

```sql
-- Enable block change tracking (requires Enterprise Edition)
ALTER DATABASE ENABLE BLOCK CHANGE TRACKING
  USING FILE '/oradata/bct/change_tracking.bct';

-- Verify
SELECT status, filename FROM v$block_change_tracking;
```

### Incrementally Updated Image Copies (Merge Strategy)

A powerful technique that combines image copies with incremental backups to maintain a "rolling" image copy that is always current to the previous day, allowing very fast recovery.

```sql
-- Day 1: Create level 0 image copy baseline
BACKUP INCREMENTAL LEVEL 0 AS COPY DATABASE;

-- Daily: Roll forward the image copy with yesterday's changes
RECOVER COPY OF DATABASE WITH TAG 'daily_copy'
  UNTIL TIME 'SYSDATE - 1';
BACKUP INCREMENTAL LEVEL 1 FOR RECOVER OF COPY
  WITH TAG 'daily_copy' DATABASE;
```

---

## Backup Retention Policies

RMAN retention policies define how long backups are kept before being considered obsolete.

### Retention by Recovery Window

Keeps enough backups to satisfy recovery to any point within the specified window:

```sql
-- Keep backups needed to recover to any point in the last 7 days
CONFIGURE RETENTION POLICY TO RECOVERY WINDOW OF 7 DAYS;
```

### Retention by Redundancy

Keeps a fixed number of backup copies:

```sql
-- Keep 2 full copies of each datafile
CONFIGURE RETENTION POLICY TO REDUNDANCY 2;
```

### Clearing the Retention Policy

```sql
-- No retention policy (keep everything — not recommended without external management)
CONFIGURE RETENTION POLICY TO NONE;
```

### Deleting Obsolete Backups

After a retention policy is set, obsolete backups can be removed:

```sql
-- List what would be deleted
REPORT OBSOLETE;

-- Delete obsolete backup pieces
DELETE OBSOLETE;

-- Delete all expired backup records (pieces not found in expected location)
CROSSCHECK BACKUP;
DELETE EXPIRED BACKUP;
```

---

## RMAN Catalog Setup

### Why Use a Recovery Catalog

- Stores backup history beyond what fits in the control file's `CONTROL_FILE_RECORD_KEEP_TIME`
- Enables stored RMAN scripts shared across databases
- Supports reporting on backups across multiple target databases
- Required for RMAN virtual private catalog (VPC) for delegated access

### Creating the Catalog

```sql
-- 1. Create a dedicated tablespace in the catalog database
CREATE TABLESPACE rman_cat
  DATAFILE '/oradata/rmancat/rman_cat01.dbf' SIZE 500M AUTOEXTEND ON;

-- 2. Create the catalog owner
CREATE USER rman_owner
  IDENTIFIED BY <password>
  DEFAULT TABLESPACE rman_cat
  QUOTA UNLIMITED ON rman_cat;

GRANT RECOVERY_CATALOG_OWNER TO rman_owner;
```

```bash
# 3. Connect to RMAN and create the catalog schema
rman catalog rman_owner/<password>@catdb
RMAN> CREATE CATALOG;
```

### Registering a Target Database

```bash
rman target sys/<password>@proddb catalog rman_owner/<password>@catdb
RMAN> REGISTER DATABASE;
```

### Resync the Catalog

```sql
-- Synchronize catalog with the target's control file
RESYNC CATALOG;

-- Full resync (more thorough)
RESYNC CATALOG FROM CONTROLFILECOPY '/path/to/ctl_copy';
```

---

## Recovery Scenarios

### Connecting to RMAN

```bash
# Connect to target only (uses control file for metadata)
rman target sys/<password>@proddb

# Connect with recovery catalog
rman target sys/<password>@proddb catalog rman_owner/<password>@catdb

# Connect as SYSDBA with OS authentication (local)
rman target /
```

### Complete Recovery

Complete recovery recovers the database to the current point in time (no data loss). Requires all archived logs from after the backup through the current SCN.

```sql
-- Database is mounted (not open), restore and recover
STARTUP MOUNT;
RESTORE DATABASE;
RECOVER DATABASE;
ALTER DATABASE OPEN;
```

### Incomplete Recovery (Point-in-Time Recovery)

Used when you need to recover to a point before the current time — for example, to undo an accidental table drop or corruption event.

**By SCN:**
```sql
STARTUP MOUNT;
RUN {
  SET UNTIL SCN 5432100;
  RESTORE DATABASE;
  RECOVER DATABASE;
}
ALTER DATABASE OPEN RESETLOGS;
```

**By Time:**
```sql
STARTUP MOUNT;
RUN {
  SET UNTIL TIME "TO_DATE('2025-12-01 14:30:00','YYYY-MM-DD HH24:MI:SS')";
  RESTORE DATABASE;
  RECOVER DATABASE;
}
ALTER DATABASE OPEN RESETLOGS;
```

**By Sequence:**
```sql
STARTUP MOUNT;
RUN {
  SET UNTIL SEQUENCE 1450 THREAD 1;
  RESTORE DATABASE;
  RECOVER DATABASE;
}
ALTER DATABASE OPEN RESETLOGS;
```

Note: `RESETLOGS` is required after incomplete recovery. It resets the log sequence and creates a new incarnation.

### Tablespace Point-in-Time Recovery (TSPITR)

Recovers a single tablespace to a point in the past while the rest of the database continues running. Uses an auxiliary instance automatically.

```sql
-- Recover the USERS tablespace to 2 hours ago
RECOVER TABLESPACE users
  UNTIL TIME 'SYSDATE - 2/24'
  AUXILIARY DESTINATION '/tmp/tspitr_aux';
```

### Datafile Recovery

When a single datafile is lost or corrupted:

```sql
-- Take the datafile offline
ALTER DATABASE DATAFILE '/oradata/users01.dbf' OFFLINE;

-- Restore just the missing datafile
RESTORE DATAFILE '/oradata/users01.dbf';

-- Apply archived logs to bring it current
RECOVER DATAFILE '/oradata/users01.dbf';

-- Bring the datafile back online
ALTER DATABASE DATAFILE '/oradata/users01.dbf' ONLINE;
```

### Control File Recovery

```sql
-- Restore control file from autobackup
STARTUP NOMOUNT;
RESTORE CONTROLFILE FROM AUTOBACKUP;
ALTER DATABASE MOUNT;
RECOVER DATABASE;
ALTER DATABASE OPEN RESETLOGS;
```

---

## Best Practices

- **Enable control file autobackup** — ensures RMAN can recover the control file even without a catalog. Note: autobackup is `ON` by default for databases with `COMPATIBLE` set to 12.2 or higher; verify the setting in older-compatibility databases.
  ```sql
  CONFIGURE CONTROLFILE AUTOBACKUP ON;
  CONFIGURE CONTROLFILE AUTOBACKUP FORMAT FOR DEVICE TYPE DISK TO '/backup/ctl_%F';
  ```

- **Always back up archived logs** — database backups without archived logs cannot be recovered to a consistent state.
  ```sql
  BACKUP DATABASE PLUS ARCHIVELOG DELETE INPUT;
  ```

- **Test your backups regularly** — validate that backup pieces are intact and restorable.
  ```sql
  RESTORE DATABASE VALIDATE;
  RESTORE TABLESPACE users VALIDATE;
  ```

- **Use a recovery catalog** for any production database — the control file alone is insufficient for long-term history.

- **Enable Block Change Tracking** on Enterprise Edition to speed up incremental backups.

- **Store backups off-host** — on-host disk backups are useless if the server is lost. Use NFS, ASM, Object Storage, or tape.

- **Document and test your recovery runbooks** at least annually. A backup strategy that has never been tested is not a strategy.

- **Back up before and after significant changes** (schema migrations, major patches, upgrades).

---

## Common Mistakes and How to Avoid Them

**Backing up to the same disk as the database**
If the disk fails, both the database and backups are lost. Always write backups to a separate storage tier.

**Never testing restores**
Untested backups are assumptions, not guarantees. Schedule quarterly restore tests to a separate server.

**Ignoring RMAN alerts in the alert log**
Failed backup jobs often write errors to the alert log and the RMAN log but do not page anyone. Set up monitoring for RMAN job status via `V$RMAN_STATUS`.

```sql
-- Check recent RMAN job status
SELECT start_time, end_time, status, input_bytes_display, output_bytes_display
FROM v$rman_backup_job_details
ORDER BY start_time DESC
FETCH FIRST 10 ROWS ONLY;
```

**Not backing up the control file and SPFILE separately**
```sql
-- Explicit control file and SPFILE backup
BACKUP CURRENT CONTROLFILE;
BACKUP SPFILE;
```

**Letting archived logs fill the FRA**
```sql
-- Check FRA usage
SELECT name, space_limit/1048576 limit_mb,
       space_used/1048576 used_mb,
       space_reclaimable/1048576 reclaimable_mb
FROM v$recovery_file_dest;

-- Delete archived logs already backed up at least once
DELETE ARCHIVELOG ALL BACKED UP 1 TIMES TO DEVICE TYPE DISK;
```

**Using NOARCHIVELOG mode for anything other than dev/test**
NOARCHIVELOG mode means you can only recover to the last full backup — all transactions after that backup are permanently lost on media failure. Always use ARCHIVELOG mode for production.

```sql
-- Check archivelog mode
SELECT log_mode FROM v$database;

-- Enable archivelog mode
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## See Also

- [RMAN Basics: Commands, Configuration, and Operations](../admin/rman-basics.md) — Day-to-day RMAN command reference

## Sources

- [Oracle Database 19c Backup and Recovery User's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/bradv/)
- [Oracle Database 19c RMAN Reference — BACKUP command](https://docs.oracle.com/en/database/oracle/oracle-database/19/rcmrf/BACKUP.html)
- [Oracle Database 19c RMAN Reference — CONFIGURE command](https://docs.oracle.com/en/database/oracle/oracle-database/19/rcmrf/CONFIGURE.html)
- [Oracle Database 19c Reference — CONTROL_FILE_RECORD_KEEP_TIME](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/CONTROL_FILE_RECORD_KEEP_TIME.html)
