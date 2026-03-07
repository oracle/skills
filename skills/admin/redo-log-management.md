# Oracle Redo Log Management

## Overview

The redo log is Oracle's write-ahead log. Every change made to the database — INSERT, UPDATE, DELETE, DDL, even internal operations — is first recorded as a redo entry in the online redo log buffer, then flushed to disk into the **online redo log files** by the Log Writer (LGWR) process. This ensures durability: if the database crashes, redo can replay all committed changes from the last checkpoint forward.

Understanding and correctly sizing the redo log infrastructure is critical to database performance and availability. Poorly sized redo logs cause excessive log switches, checkpoint pressure, and can degrade throughput significantly.

---

## Online Redo Log Groups and Members

### Groups

Oracle's online redo log consists of **groups**, each of which contains one or more **members** (physical files). At any point in time, LGWR is writing to exactly one group — the **current** group. When a log switch occurs, LGWR moves to the next group.

- A database requires a minimum of 2 groups to operate
- Production databases should have at least 3 groups to give LGWR room to cycle while archiving catches up
- Groups are identified by a group number (1, 2, 3, ...)

### Members (Multiplexing)

Each group can contain multiple member files — physical copies of the same redo data on different disks. All members in a group contain identical redo data. If one member is lost (disk failure), the group remains functional using the surviving members.

- Minimum 1 member per group; 2–3 members recommended for production
- Members should reside on different physical disks or storage controllers for redundancy
- All members must be the same size within a group

```
Online Redo Log Structure:
┌─────────────────────────────────────────┐
│ Group 1: /disk1/redo01a.log             │  ← CURRENT (LGWR writing here)
│          /disk2/redo01b.log  (mirror)   │
├─────────────────────────────────────────┤
│ Group 2: /disk1/redo02a.log             │  ← ACTIVE (needed for crash recovery)
│          /disk2/redo02b.log  (mirror)   │
├─────────────────────────────────────────┤
│ Group 3: /disk1/redo03a.log             │  ← INACTIVE (available for LGWR)
│          /disk2/redo03b.log  (mirror)   │
└─────────────────────────────────────────┘
```

### Viewing Current Redo Log Configuration

```sql
-- View all groups and their status
SELECT group#, members, bytes/1048576 size_mb, status, archived
FROM v$log
ORDER BY group#;

-- View all members and their paths
SELECT l.group#, l.sequence#, l.status,
       lf.member, lf.status member_status
FROM v$log l
JOIN v$logfile lf ON l.group# = lf.group#
ORDER BY l.group#, lf.member;

-- Group status values:
-- CURRENT   = LGWR is currently writing to this group
-- ACTIVE    = needed for instance recovery (not yet checkpointed away from)
-- INACTIVE  = not needed for recovery; available for reuse
-- UNUSED    = never been written to
-- CLEARING  = being re-created (ALTER DATABASE CLEAR LOGFILE in progress)
```

---

## Adding, Dropping, and Resizing Redo Logs

### Adding New Groups and Members

```sql
-- Add a new group with two members (multiplexed)
ALTER DATABASE ADD LOGFILE GROUP 4
  ('/disk1/redo04a.log', '/disk2/redo04b.log') SIZE 500M;

-- Add a member to an existing group (multiplexing an existing group)
ALTER DATABASE ADD LOGFILE MEMBER
  '/disk2/redo01b.log' TO GROUP 1;

-- Add a member to all groups at once (loop in a script)
ALTER DATABASE ADD LOGFILE MEMBER '/disk2/redo01b.log' TO GROUP 1;
ALTER DATABASE ADD LOGFILE MEMBER '/disk2/redo02b.log' TO GROUP 2;
ALTER DATABASE ADD LOGFILE MEMBER '/disk2/redo03b.log' TO GROUP 3;
```

### Dropping Groups and Members

You can only drop a group that is INACTIVE (not CURRENT or ACTIVE). You cannot drop a group if it would leave fewer than 2 groups.

```sql
-- Drop a redo log group
ALTER DATABASE DROP LOGFILE GROUP 4;

-- Drop a specific member (file is not deleted from OS automatically in older versions)
ALTER DATABASE DROP LOGFILE MEMBER '/disk2/redo01b.log';

-- After dropping, remove the OS file manually if needed
-- (host OS command, not SQL)
```

### Resizing Redo Logs

Oracle does not support `ALTER DATABASE RESIZE LOGFILE`. To resize, add new groups at the correct size, let the old groups cycle to INACTIVE, then drop them.

```sql
-- Step 1: Add new groups at desired size
ALTER DATABASE ADD LOGFILE GROUP 4 ('/oradata/redo04a.log') SIZE 1G;
ALTER DATABASE ADD LOGFILE GROUP 5 ('/oradata/redo05a.log') SIZE 1G;
ALTER DATABASE ADD LOGFILE GROUP 6 ('/oradata/redo06a.log') SIZE 1G;

-- Step 2: Force log switches to cycle through old groups
ALTER SYSTEM SWITCH LOGFILE;   -- repeat until old groups are INACTIVE
ALTER SYSTEM CHECKPOINT;       -- advance checkpoint so ACTIVE becomes INACTIVE

-- Step 3: Drop the old undersized groups
ALTER DATABASE DROP LOGFILE GROUP 1;
ALTER DATABASE DROP LOGFILE GROUP 2;
ALTER DATABASE DROP LOGFILE GROUP 3;

-- Step 4: Verify new configuration
SELECT group#, bytes/1048576 size_mb, status FROM v$log ORDER BY group#;
```

---

## Sizing Redo Logs (Avoiding Frequent Log Switches)

### Why Log Switch Frequency Matters

Every log switch triggers a **checkpoint** (a request for DBWR to write all dirty buffers to disk) and, in ARCHIVELOG mode, causes the ARCn process to archive the log before it can be reused. Frequent log switches:

- Increase I/O pressure from checkpoint activity
- Can stall LGWR if it cycles back to an unarchived group (log switch wait)
- Generate excessive archived logs
- Show up in the alert log and V$SESSION_WAIT as `log file switch` wait events

Oracle recommends log switches no more frequently than every 15–30 minutes under normal load.

### Measuring Current Log Switch Frequency

```sql
-- Log switch frequency per hour (from alert log via V$LOG_HISTORY)
SELECT TO_CHAR(first_time, 'YYYY-MM-DD HH24') hour_bucket,
       COUNT(*) switches
FROM v$log_history
WHERE first_time > SYSDATE - 7
GROUP BY TO_CHAR(first_time, 'YYYY-MM-DD HH24')
ORDER BY 1 DESC
FETCH FIRST 48 ROWS ONLY;

-- Average redo generated per switch (helps size new logs)
SELECT ROUND(AVG(blocks * block_size) / 1048576, 1) avg_mb_per_log
FROM v$archived_log
WHERE first_time > SYSDATE - 7
  AND standby_dest = 'NO';

-- Current log group size vs actual usage
SELECT l.group#, l.bytes/1048576 size_mb,
       l.status,
       lh.blocks * lh.block_size / 1048576 last_used_mb
FROM v$log l
LEFT JOIN v$archived_log lh ON l.sequence# = lh.sequence#
ORDER BY l.group#;
```

### Sizing Recommendation

A common rule of thumb: size redo logs so that a log switch occurs every 15–30 minutes during peak load.

If current logs are 200MB and switches happen every 3 minutes during peak, the peak redo generation rate is approximately 200MB / 3min = 66 MB/min. Target log size for a 20-minute switch: 66 MB/min × 20 min = 1.3 GB.

```sql
-- More precise sizing: check max redo blocks per 10-minute window from UNDOSTAT
-- (UNDOSTAT tracks undo blocks, use V$SYSSTAT for redo)
SELECT statistic#, name, value
FROM v$sysstat
WHERE name IN ('redo size', 'redo entries', 'redo log space requests',
               'redo log space wait time');
```

---

## ARCHIVELOG Mode

### What ARCHIVELOG Mode Does

In **ARCHIVELOG mode**, before Oracle reuses an online redo log group, the ARCn (archiver) process copies it to the **archived log destination**. This archived copy preserves all redo and makes it possible to:
- Recover the database to any point in time (not just the last full backup)
- Perform online (hot) backups with RMAN
- Use Data Guard (standby databases)
- Use Oracle Streams, LogMiner, or GoldenGate

In **NOARCHIVELOG mode**, online redo logs are simply overwritten. Recovery is limited to the most recent full backup — all committed changes since that backup are unrecoverable on media failure. NOARCHIVELOG is acceptable only for development or test databases.

### Checking and Enabling ARCHIVELOG Mode

```sql
-- Check current mode
SELECT log_mode, name FROM v$database;

-- View archiver status
SELECT archiver FROM v$instance;

-- Enable ARCHIVELOG mode
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;

-- Verify
SELECT log_mode FROM v$database;
-- Should return: ARCHIVELOG
```

### Configuring Archive Log Destinations

```sql
-- Set the primary archive log destination
ALTER SYSTEM SET LOG_ARCHIVE_DEST_1 =
  'LOCATION=/oradata/archive VALID_FOR=(ALL_LOGFILES,ALL_ROLES)'
  SCOPE=BOTH;

-- Enable the destination
ALTER SYSTEM SET LOG_ARCHIVE_DEST_STATE_1 = ENABLE SCOPE=BOTH;

-- Use Fast Recovery Area (FRA) as archive destination
ALTER SYSTEM SET DB_RECOVERY_FILE_DEST = '/oradata/fra' SCOPE=BOTH;
ALTER SYSTEM SET DB_RECOVERY_FILE_DEST_SIZE = 100G SCOPE=BOTH;
ALTER SYSTEM SET LOG_ARCHIVE_DEST_1 =
  'LOCATION=USE_DB_RECOVERY_FILE_DEST' SCOPE=BOTH;

-- View current archive destinations
SELECT dest_id, dest_name, status, target, archiver, schedule,
       destination, transmit_mode
FROM v$archive_dest
WHERE status != 'INACTIVE'
ORDER BY dest_id;
```

### Manual Log Switch and Archive

```sql
-- Force a log switch
ALTER SYSTEM SWITCH LOGFILE;

-- Archive all unarchived logs (for manual archiving or testing)
ALTER SYSTEM ARCHIVE LOG ALL;

-- Archive current log
ALTER SYSTEM ARCHIVE LOG CURRENT;
```

---

## Archived Log Management

Archived logs accumulate continuously. Without active management, they will eventually fill the archive destination or Fast Recovery Area, causing the database to hang.

### Monitoring Archived Log Space

```sql
-- Check FRA usage
SELECT name, space_limit/1073741824 limit_gb,
       space_used/1073741824 used_gb,
       space_reclaimable/1073741824 reclaimable_gb,
       ROUND(space_used / space_limit * 100, 1) pct_used
FROM v$recovery_file_dest;

-- Count and size of archived logs on disk
SELECT dest_id, COUNT(*) log_count,
       SUM(blocks * block_size) / 1073741824 total_gb
FROM v$archived_log
WHERE standby_dest = 'NO'
  AND deleted = 'NO'
GROUP BY dest_id;

-- Oldest archived log on disk
SELECT MIN(first_time) oldest_log, MAX(first_time) newest_log
FROM v$archived_log
WHERE standby_dest = 'NO'
  AND deleted = 'NO';
```

### Deleting Archived Logs Safely

Always delete archived logs through RMAN, not via OS commands:

```sql
-- Via RMAN: delete archived logs already backed up at least once
DELETE ARCHIVELOG ALL BACKED UP 1 TIMES TO DEVICE TYPE DISK;

-- Delete archived logs older than 7 days (whether backed up or not — use with caution)
DELETE ARCHIVELOG UNTIL TIME 'SYSDATE-7';

-- Delete all archived logs backed up at least 2 times (very safe)
DELETE ARCHIVELOG ALL BACKED UP 2 TIMES TO DEVICE TYPE DISK;
```

If you accidentally delete archived logs via OS commands (not RMAN):
```sql
-- Crosscheck to find the missing files and mark them EXPIRED
CROSSCHECK ARCHIVELOG ALL;

-- Delete the expired records from the repository
DELETE EXPIRED ARCHIVELOG ALL;
```

---

## Multiplexing Redo Logs

Multiplexing means maintaining multiple copies (members) of each redo log group on different disks. If one member is lost, LGWR continues writing to the remaining members without any database outage.

```sql
-- Add a second member to every existing group (multiplexing)
-- Assumes groups 1-3 exist
ALTER DATABASE ADD LOGFILE MEMBER '/disk2/redo01b.log' TO GROUP 1;
ALTER DATABASE ADD LOGFILE MEMBER '/disk2/redo02b.log' TO GROUP 2;
ALTER DATABASE ADD LOGFILE MEMBER '/disk2/redo03b.log' TO GROUP 3;

-- Verify multiplexing
SELECT l.group#, lf.member, lf.type, lf.status
FROM v$log l JOIN v$logfile lf ON l.group# = lf.group#
ORDER BY l.group#, lf.member;
```

### Recovering from a Missing Redo Log Member

If a member file is lost (e.g., disk failure) but other members of the group remain intact:

```sql
-- The group will show status CURRENT or ACTIVE but one member will show INVALID or STALE
-- Drop the missing member
ALTER DATABASE DROP LOGFILE MEMBER '/disk2/redo01b.log';

-- Re-add a new member (Oracle will create the file)
ALTER DATABASE ADD LOGFILE MEMBER '/disk3/redo01b.log' TO GROUP 1;
-- Note: new member starts INVALID and becomes current on the next log switch
```

### Recovering from a Missing CURRENT Log Group (Media Failure)

This is a more serious scenario. If the CURRENT group is lost:

```sql
-- First, try to clear the log (creates a new empty log, losing unarchived redo)
-- WARNING: This WILL cause data loss — use only when the log truly cannot be recovered
ALTER DATABASE CLEAR UNARCHIVED LOGFILE GROUP 1;

-- After clearing, the database may need recovery from backup
-- Check if all datafiles are consistent
SELECT file#, name, status FROM v$datafile WHERE status != 'ONLINE';
```

---

## Log Switch Frequency Monitoring

### Alert Log Monitoring

Log switches appear in the alert log with timestamps. Frequent switches (every few minutes) indicate undersized redo logs.

```sql
-- Log switch history by day (useful for capacity planning)
SELECT TRUNC(first_time, 'DD') log_date,
       COUNT(*) daily_switches,
       ROUND(COUNT(*) / 24, 1) switches_per_hour_avg
FROM v$log_history
WHERE first_time > SYSDATE - 30
GROUP BY TRUNC(first_time, 'DD')
ORDER BY 1 DESC;

-- Peak switches in a single hour
SELECT TO_CHAR(first_time, 'YYYY-MM-DD HH24') hour,
       COUNT(*) switches
FROM v$log_history
WHERE first_time > SYSDATE - 7
GROUP BY TO_CHAR(first_time, 'YYYY-MM-DD HH24')
ORDER BY 2 DESC
FETCH FIRST 10 ROWS ONLY;
```

### Log Switch Wait Events

If LGWR cannot switch to the next log group (because it is still ACTIVE — not checkpointed, or still being archived), sessions wait:

```sql
-- Check for log file switch waits
SELECT event, total_waits, time_waited, average_wait
FROM v$system_event
WHERE event LIKE 'log file switch%'
ORDER BY time_waited DESC;

-- Event: "log file switch (checkpoint incomplete)" → need more groups or faster I/O
-- Event: "log file switch (archiving needed)"     → ARCn cannot keep up; check archiver lag
-- Event: "log file switch completion"             → occasional switch overhead (normal in small amounts)

-- Current session waits for context
SELECT s.sid, s.serial#, s.username, s.event, s.state, s.seconds_in_wait
FROM v$session s
WHERE s.event LIKE 'log file switch%'
   OR s.event = 'log file sync';
```

---

## Best Practices

- **Always run in ARCHIVELOG mode** in production. NOARCHIVELOG mode means you cannot perform point-in-time recovery.

- **Multiplex redo logs** on separate physical disks. The cost of an extra copy is minimal compared to the risk of losing the current redo log.

- **Size redo logs for 15–30 minute switches** under peak load. Too small causes frequent switches and performance degradation; too large delays media recovery slightly (must apply more redo per log).

- **Use a Fast Recovery Area (FRA)** for archived log storage. It simplifies management and RMAN can automatically clean up the FRA.

- **Monitor FRA space daily.** A full FRA causes the database to hang, waiting for space. Set an OEM alert on FRA percent used.

- **Never delete archived logs with OS commands.** Always use RMAN to delete archived logs so the repository stays accurate.

- **Add groups before you need them.** At least 3–5 groups gives the archiver time to keep up. Under very high redo generation (data loads, bulk DML), 6+ groups may be needed.

- **Keep LGWR I/O fast.** Redo logs should be on low-latency storage (SSD, dedicated spindles, or ASM with high redundancy). LGWR latency directly impacts commit response time.

---

## Common Mistakes and How to Avoid Them

**Using only 2 redo log groups**
With only 2 groups, if LGWR fills group 1 and ARCn hasn't finished archiving it, LGWR stalls waiting for group 1 to be available. Always use at least 3 groups.

**Leaving redo logs unmirrored**
If the single member of the CURRENT redo log group is lost (disk failure), you have an unrecoverable database unless you accept data loss and use `CLEAR UNARCHIVED LOGFILE`. Always multiplex.

**Redo logs on the same physical disk as datafiles**
Under heavy write loads, redo log I/O competes with datafile I/O. Put redo logs on dedicated disks separate from datafiles and archive logs.

**Forgetting to monitor FRA space**
```sql
-- Add this to your daily monitoring script
SELECT name, space_limit/1073741824 limit_gb,
       space_used/1073741824 used_gb,
       ROUND(space_used/space_limit*100,1) pct_full
FROM v$recovery_file_dest;
```
If FRA hits 100%, the database will hang on next log switch.

**Switching to ARCHIVELOG mode without configuring an archive destination**
If `LOG_ARCHIVE_DEST_1` is not set and there is no FRA, Oracle will archive to a default OS location which may not have adequate space or may not be backed up.

**Dropping a log group while it is ACTIVE**
This fails with ORA-00350. Issue `ALTER SYSTEM CHECKPOINT` first to advance the checkpoint and transition the group to INACTIVE before dropping.

---

## Sources

- [Oracle Database Administrator's Guide 19c — Managing the Redo Log](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/managing-the-redo-log.html)
- [Oracle Database 19c Reference — V$LOG](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-LOG.html)
- [Oracle Database 19c Reference — V$LOGFILE](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-LOGFILE.html)
- [Oracle Database 19c Reference — V$LOG_HISTORY](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-LOG_HISTORY.html)
