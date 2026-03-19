# RMAN Basics: Commands, Configuration, and Operations

## Overview

RMAN (Recovery Manager) is Oracle's built-in backup and recovery tool. Unlike operating-system-level file copies, RMAN understands Oracle's internal block structure, can validate blocks for corruption, skip unused space, perform incremental backups, and integrate with Oracle's media management layer for tape.

This guide covers the day-to-day RMAN commands a DBA needs to operate, configure, and report on backups. For deeper coverage of architecture, retention policies, and recovery scenarios, see `backup-recovery.md`.

---

## Connecting to RMAN

RMAN connects as a privileged user to the target database. It can optionally connect to a recovery catalog (a separate Oracle schema storing backup metadata).

```bash
# Connect to target database using OS authentication (local only)
rman target /

# Connect to target with password
rman target sys/<password>

# Connect to target with Easy Connect
rman target sys/<password>@hostname:1521/service_name

# Connect to target + recovery catalog
rman target sys/<password>@proddb catalog rman_owner/<password>@catdb

# Connect to target + auxiliary (for duplicate/TSPITR)
rman target sys/<password>@proddb auxiliary sys/<password>@auxdb

# Start RMAN and connect interactively
rman
RMAN> CONNECT TARGET sys/<password>@proddb;
RMAN> CONNECT CATALOG rman_owner/<password>@catdb;
```

### Checking Connection Status

```sql
RMAN> SHOW ALL;       -- show all persistent configuration settings
RMAN> LIST BACKUP;    -- verify catalog/control file is accessible
```

---

## Channel Configuration

Channels are server processes that perform backup and restore I/O. They can be configured persistently (stored in the control file or catalog) or allocated manually within a `RUN` block for a single session.

### Automatic Channel Configuration (Persistent)

```sql
-- Configure one disk channel (default)
CONFIGURE CHANNEL DEVICE TYPE DISK FORMAT '/backup/rman/%d_%U';

-- Configure two parallel disk channels
CONFIGURE DEVICE TYPE DISK PARALLELISM 2;

-- Configure channel for tape via SBT
CONFIGURE CHANNEL DEVICE TYPE SBT
  PARMS 'SBT_LIBRARY=/opt/netbackup/lib/libobk.so,
         ENV=(NB_ORA_SERV=nbmaster,NB_ORA_POLICY=oracle_policy)';

-- Set default backup type
CONFIGURE DEFAULT DEVICE TYPE TO DISK;
CONFIGURE DEFAULT DEVICE TYPE TO SBT;

-- Clear a setting back to default
CONFIGURE CHANNEL DEVICE TYPE DISK CLEAR;
CONFIGURE DEVICE TYPE DISK PARALLELISM 1 BACKUP TYPE TO BACKUPSET;
```

### Manual Channel Allocation (Within a RUN block)

Manual allocation overrides automatic channels for that `RUN` block only:

```sql
RUN {
  ALLOCATE CHANNEL c1 DEVICE TYPE DISK FORMAT '/backup/rman/ch1_%U';
  ALLOCATE CHANNEL c2 DEVICE TYPE DISK FORMAT '/backup/rman/ch2_%U';
  BACKUP INCREMENTAL LEVEL 0 DATABASE;
  RELEASE CHANNEL c1;
  RELEASE CHANNEL c2;
}
```

---

## BACKUP Command

The `BACKUP` command creates backup sets or image copies of the database, tablespaces, datafiles, archived logs, control files, and SPFILEs.

### Database Backups

```sql
-- Full database backup (backup set, to configured channel)
BACKUP DATABASE;

-- Full database + archived logs (delete archived logs after backup)
BACKUP DATABASE PLUS ARCHIVELOG DELETE INPUT;

-- Compressed backup set
BACKUP AS COMPRESSED BACKUPSET DATABASE;

-- Image copy of database
BACKUP AS COPY DATABASE;

-- Incremental level 0 (baseline)
BACKUP INCREMENTAL LEVEL 0 DATABASE;

-- Incremental level 1 (differential — changes since last level 0 or 1)
BACKUP INCREMENTAL LEVEL 1 DATABASE;

-- Incremental level 1 cumulative (changes since last level 0 only)
BACKUP INCREMENTAL LEVEL 1 CUMULATIVE DATABASE;
```

### Tablespace and Datafile Backups

```sql
-- Backup specific tablespace
BACKUP TABLESPACE users, example;

-- Backup specific datafile (by path or number)
BACKUP DATAFILE '/oradata/users01.dbf';
BACKUP DATAFILE 5;

-- Backup multiple datafiles
BACKUP DATAFILE 4, 5, 6;
```

### Archived Log Backups

```sql
-- Backup all archived logs
BACKUP ARCHIVELOG ALL;

-- Backup archived logs and delete after backup
BACKUP ARCHIVELOG ALL DELETE INPUT;

-- Backup archived logs in a specific range
BACKUP ARCHIVELOG FROM SEQUENCE 500 UNTIL SEQUENCE 600 THREAD 1;

-- Backup archived logs from last 24 hours
BACKUP ARCHIVELOG FROM TIME 'SYSDATE-1';
```

### Control File and SPFILE

```sql
-- Backup current control file
BACKUP CURRENT CONTROLFILE;

-- Backup SPFILE
BACKUP SPFILE;

-- Backup control file to a specific location
BACKUP CURRENT CONTROLFILE TO '/backup/control_file.bak';

-- Enable automatic control file backup after every backup
CONFIGURE CONTROLFILE AUTOBACKUP ON;
CONFIGURE CONTROLFILE AUTOBACKUP FORMAT FOR DEVICE TYPE DISK TO '/backup/cf_%F';
```

### Backup with Tags

Tags allow logical naming of backup sets for easier identification during restore:

```sql
BACKUP DATABASE TAG 'full_before_upgrade';
BACKUP INCREMENTAL LEVEL 0 DATABASE TAG 'weekly_baseline';
```

---

## RESTORE Command

`RESTORE` copies backup pieces or image copies back to their original (or alternate) locations. It does not apply redo — that is done by `RECOVER`.

```sql
-- Restore full database (database must be mounted, not open)
STARTUP MOUNT;
RESTORE DATABASE;

-- Restore a specific tablespace
RESTORE TABLESPACE users;

-- Restore a specific datafile
RESTORE DATAFILE '/oradata/users01.dbf';
RESTORE DATAFILE 5;

-- Restore control file from autobackup
STARTUP NOMOUNT;
RESTORE CONTROLFILE FROM AUTOBACKUP;

-- Restore control file from a specific backup piece
RESTORE CONTROLFILE FROM '/backup/rman/cf_c-12345-20251201-00';

-- Restore to a different location (useful for testing or relocation)
RUN {
  SET NEWNAME FOR DATAFILE '/oradata/users01.dbf'
    TO '/oradata_new/users01.dbf';
  RESTORE DATABASE;
  SWITCH DATAFILE ALL;
}

-- Preview what would be used (does not actually restore)
RESTORE DATABASE PREVIEW;
RESTORE DATABASE PREVIEW SUMMARY;
```

---

## RECOVER Command

`RECOVER` applies archived redo logs and incremental backups to bring restored datafiles to a consistent state.

```sql
-- Recover database after full restore (applies all archived logs through current SCN)
RECOVER DATABASE;

-- For incomplete recovery, set the target first so RESTORE and RECOVER use the same endpoint
RUN {
  SET UNTIL TIME "TO_DATE('2025-12-01 14:30','YYYY-MM-DD HH24:MI')";
  RESTORE DATABASE;
  RECOVER DATABASE;
}

RUN {
  SET UNTIL SCN 9876543;
  RESTORE DATABASE;
  RECOVER DATABASE;
}

RUN {
  SET UNTIL SEQUENCE 1200 THREAD 1;
  RESTORE DATABASE;
  RECOVER DATABASE;
}

-- Recover a single tablespace
RECOVER TABLESPACE users;

-- Recover a single datafile
RECOVER DATAFILE '/oradata/users01.dbf';

-- Open database after complete recovery
ALTER DATABASE OPEN;

-- Open database after incomplete recovery (required)
ALTER DATABASE OPEN RESETLOGS;
```

---

## CROSSCHECK Command

`CROSSCHECK` verifies that backup pieces and image copies recorded in the RMAN repository actually exist at their expected locations. It marks them `EXPIRED` if they are missing.

```sql
-- Crosscheck all backup pieces on disk
CROSSCHECK BACKUP;

-- Crosscheck all image copies
CROSSCHECK COPY;

-- Crosscheck archived logs
CROSSCHECK ARCHIVELOG ALL;

-- Crosscheck a specific backup set
CROSSCHECK BACKUPSET 45;

-- Crosscheck all backups on a specific device type
CROSSCHECK BACKUP DEVICE TYPE SBT;
```

---

## DELETE Command

`DELETE` removes backup pieces or image copies from the media and from the RMAN repository.

```sql
-- Delete all expired backups (those marked EXPIRED by crosscheck)
DELETE EXPIRED BACKUP;

-- Delete obsolete backups (per retention policy)
DELETE OBSOLETE;

-- Delete obsolete backups for a specific device type
DELETE OBSOLETE DEVICE TYPE DISK;

-- Delete all archived logs already backed up
DELETE ARCHIVELOG ALL BACKED UP 1 TIMES TO DEVICE TYPE DISK;

-- Delete a specific backup set
DELETE BACKUPSET 45;

-- Delete archived logs older than 7 days
DELETE ARCHIVELOG UNTIL TIME 'SYSDATE-7';

-- Preview what DELETE OBSOLETE would remove (no actual deletion)
DELETE NOPROMPT OBSOLETE;
-- or use REPORT OBSOLETE first:
REPORT OBSOLETE;
```

---

## Reporting Commands

### LIST Command

`LIST` shows information about backups and copies stored in the repository.

```sql
-- List all backups
LIST BACKUP;

-- Summary of all backups
LIST BACKUP SUMMARY;

-- List backups of database
LIST BACKUP OF DATABASE;

-- List backups of a specific tablespace
LIST BACKUP OF TABLESPACE users;

-- List image copies
LIST COPY;
LIST COPY OF DATABASE;
LIST COPY OF DATAFILE 5;

-- List archived log backups
LIST BACKUP OF ARCHIVELOG ALL;

-- List backups completed in the last 2 days
LIST BACKUP COMPLETED AFTER 'SYSDATE-2';

-- List backups by tag
LIST BACKUP TAG 'full_before_upgrade';

-- List backups that can be used for a specific recovery time
LIST BACKUP RECOVERABLE;
```

### REPORT Command

`REPORT` provides higher-level analysis than LIST.

```sql
-- Report database schema (datafiles, sizes, backups)
REPORT SCHEMA;

-- Report files that need backup (not backed up in last N days)
REPORT NEED BACKUP DAYS 7;

-- Report files that are not recoverable (insufficient backups)
REPORT UNRECOVERABLE;

-- Report obsolete backups
REPORT OBSOLETE;

-- Report obsolete with specific retention
REPORT OBSOLETE REDUNDANCY 2;
REPORT OBSOLETE RECOVERY WINDOW OF 7 DAYS;
```

### SHOW Command

`SHOW` displays RMAN persistent configuration:

```sql
-- Show all configuration settings
SHOW ALL;

-- Show specific settings
SHOW RETENTION POLICY;
SHOW DEFAULT DEVICE TYPE;
SHOW CHANNEL;
SHOW CONTROLFILE AUTOBACKUP;
SHOW COMPRESSION ALGORITHM;
SHOW ENCRYPTION FOR DATABASE;
```

---

## Compression

RMAN supports multiple compression algorithms. Higher compression saves more space but uses more CPU.

```sql
-- Configure compression level persistently
CONFIGURE COMPRESSION ALGORITHM 'BASIC';    -- available without additional license
CONFIGURE COMPRESSION ALGORITHM 'LOW';      -- Oracle Advanced Compression required
CONFIGURE COMPRESSION ALGORITHM 'MEDIUM';   -- Oracle Advanced Compression required
CONFIGURE COMPRESSION ALGORITHM 'HIGH';     -- Oracle Advanced Compression required

-- Use compression for a single backup
BACKUP AS COMPRESSED BACKUPSET DATABASE;

-- Check compression ratio of recent backups
SELECT input_bytes_display, output_bytes_display, compression_ratio
FROM v$backup_set_details
ORDER BY completion_time DESC
FETCH FIRST 5 ROWS ONLY;
```

---

## Encryption

RMAN can encrypt backup sets so that backup pieces are unreadable without the correct key. Transparent (keystore-based) encryption of backups to disk requires the **Oracle Advanced Security** option. Password-based encryption does not require Advanced Security.

```sql
-- Configure transparent encryption (uses keystore/wallet — requires Advanced Security)
CONFIGURE ENCRYPTION FOR DATABASE ON;

-- Configure password-only encryption (no keystore required; password must be supplied at restore too)
SET ENCRYPTION ON IDENTIFIED BY <backup_password> ONLY;
BACKUP DATABASE;

-- Configure dual-mode encryption (both keystore and password)
SET ENCRYPTION ON IDENTIFIED BY <backup_password>;
BACKUP DATABASE;

-- Set encryption algorithm (default is AES128; AES256 is stronger)
CONFIGURE ENCRYPTION ALGORITHM 'AES256';

-- Turn off encryption
CONFIGURE ENCRYPTION FOR DATABASE OFF;
```

For transparent (keystore-based) encryption, the Oracle Wallet (TDE keystore) must be open before running backups:

```sql
-- Open the software keystore (correct syntax since Oracle 12c)
ADMINISTER KEY MANAGEMENT SET KEYSTORE OPEN IDENTIFIED BY <wallet_password>;
```

Use `ADMINISTER KEY MANAGEMENT SET KEYSTORE OPEN` for current Oracle releases rather than relying on older wallet-opening syntax.

---

## Parallelism

Parallelism allows multiple channels to work simultaneously, dramatically improving backup and restore throughput.

```sql
-- Configure 4 parallel disk channels
CONFIGURE DEVICE TYPE DISK PARALLELISM 4;

-- Configure 2 parallel SBT channels
CONFIGURE DEVICE TYPE SBT PARALLELISM 2;

-- Manual parallelism for a single operation
RUN {
  ALLOCATE CHANNEL c1 DEVICE TYPE DISK FORMAT '/backup/%U';
  ALLOCATE CHANNEL c2 DEVICE TYPE DISK FORMAT '/backup/%U';
  ALLOCATE CHANNEL c3 DEVICE TYPE DISK FORMAT '/backup/%U';
  ALLOCATE CHANNEL c4 DEVICE TYPE DISK FORMAT '/backup/%U';
  BACKUP DATABASE;
}
```

RMAN distributes datafiles across available channels. Each channel writes to a separate backup piece.

---

## Useful Operational Patterns

### Full Production Backup Script

```sql
RUN {
  CONFIGURE RETENTION POLICY TO RECOVERY WINDOW OF 7 DAYS;
  CONFIGURE CONTROLFILE AUTOBACKUP ON;
  CONFIGURE COMPRESSION ALGORITHM 'BASIC';
  CONFIGURE DEVICE TYPE DISK PARALLELISM 4;
  CONFIGURE CHANNEL DEVICE TYPE DISK FORMAT '/backup/rman/%d_%T_%U';

  BACKUP AS COMPRESSED BACKUPSET
    INCREMENTAL LEVEL 0
    DATABASE
    INCLUDE CURRENT CONTROLFILE
    TAG 'weekly_full';

  BACKUP ARCHIVELOG ALL DELETE INPUT TAG 'archlog_weekly';

  DELETE NOPROMPT OBSOLETE;
}
```

### Validate Backup Integrity Without Restoring

```sql
-- Validate all backup pieces (checks for physical corruption)
RESTORE DATABASE VALIDATE;

-- Validate and check for logical corruption too
RESTORE DATABASE VALIDATE CHECK LOGICAL;

-- Validate specific tablespace
RESTORE TABLESPACE users VALIDATE;

-- Validate a backup set
VALIDATE BACKUPSET 45;
VALIDATE BACKUPSET 45 CHECK LOGICAL;
```

### Checking RMAN Job History

```sql
-- View RMAN job history from V$ views
SELECT start_time, end_time, status,
       input_bytes_display, output_bytes_display,
       time_taken_display
FROM v$rman_backup_job_details
ORDER BY start_time DESC
FETCH FIRST 20 ROWS ONLY;

-- View current RMAN sessions
SELECT sid, serial#, context, sofar, totalwork,
       round(sofar/totalwork*100,2) pct_done
FROM v$session_longops
WHERE opname LIKE 'RMAN%'
  AND opname NOT LIKE '%aggregate%'
  AND totalwork != 0;
```

---

## Best Practices

- **Always run `CROSSCHECK BACKUP` before `DELETE OBSOLETE`** to ensure expired pieces are removed from the repository before obsolete ones are deleted.

- **Use `BACKUP DATABASE PLUS ARCHIVELOG DELETE INPUT`** as a single command to keep archived logs from accumulating on disk.

- **Set `CONTROLFILE AUTOBACKUP ON`** unconditionally. There is almost no downside.

- **Use tags** on all backup operations to make identification easier when restoring.

- **Schedule `REPORT NEED BACKUP`** as part of a monitoring job to catch datafiles that missed a backup cycle.

- **Limit channel parallelism** based on storage I/O capacity. More channels than the storage can handle causes contention and slower overall throughput.

- **Run `RESTORE DATABASE VALIDATE`** in a maintenance window periodically to verify backup recoverability without actually restoring.

---

## Common Mistakes and How to Avoid Them

**Running RMAN as a non-SYSDBA user**
RMAN requires `SYSDBA` or `SYSBACKUP` privilege on the target. Connecting without these privileges causes cryptic errors.

**Forgetting `DELETE INPUT` when backing up archived logs**
Archived logs accumulate quickly. Always pair archivelog backups with `DELETE INPUT` (backed-up logs) or `DELETE ALL INPUT` (all archived logs regardless of backup status — use with caution).

**Not using `PLUS ARCHIVELOG`**
A database backup without archived logs is not recoverable to a consistent state. Always include archived logs in the backup strategy.

**Misunderstanding `DELETE ARCHIVELOG ALL`**
`DELETE ARCHIVELOG ALL` deletes all archived logs regardless of whether they have been backed up. Use `DELETE ARCHIVELOG ALL BACKED UP 2 TIMES` to safely delete only logs with at least two backup copies.

**Confusing VALIDATE with RESTORE VALIDATE**
- `VALIDATE BACKUPSET` checks the integrity of backup pieces (can RMAN read them?)
- `RESTORE DATABASE VALIDATE` simulates a full restore to verify all needed pieces are present and readable
- Only `RESTORE DATABASE VALIDATE` tells you whether recovery is actually feasible

**Manually deleting backup files without telling RMAN**
If you delete backup pieces using OS commands, RMAN's repository becomes out of sync. Always use `CROSSCHECK BACKUP` + `DELETE EXPIRED BACKUP` to clean up.

**Not adjusting `CONTROL_FILE_RECORD_KEEP_TIME`**
Without a catalog, backup records in the control file can be overwritten. The default is 7 days. Increase it to match your retention policy.
```sql
ALTER SYSTEM SET CONTROL_FILE_RECORD_KEEP_TIME = 31 SCOPE=BOTH;
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## See Also

- [Oracle RMAN Backup and Recovery](../admin/backup-recovery.md) — RMAN architecture, backup strategy, and recovery scenarios

## Sources

- [Oracle Database 19c Backup and Recovery User's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/bradv/)
- [Oracle Database 19c RMAN Reference — BACKUP command](https://docs.oracle.com/en/database/oracle/oracle-database/19/rcmrf/BACKUP.html)
- [Oracle Database 19c RMAN Reference — CONFIGURE command](https://docs.oracle.com/en/database/oracle/oracle-database/19/rcmrf/CONFIGURE.html)
- [Oracle Database 19c RMAN Reference — RESTORE command](https://docs.oracle.com/en/database/oracle/oracle-database/19/rcmrf/RESTORE.html)
- [Oracle Database 19c RMAN Reference — RECOVER command](https://docs.oracle.com/en/database/oracle/oracle-database/19/rcmrf/RECOVER.html)
