# Alert Log Analysis

## Overview

The Oracle alert log is the primary diagnostic record of a database instance. It captures startup and shutdown events, administrative operations, structural changes, and—critically—errors that occur during normal operation. Every Oracle DBA must be comfortable navigating, reading, and monitoring the alert log as a first step in any troubleshooting workflow.

Understanding the alert log means understanding where it lives in the Automatic Diagnostic Repository (ADR), what the difference is between XML and text formats, how to interpret common ORA- errors, and how to automate monitoring so problems surface before users report them.

---

## ADR and Alert Log Location

### The Automatic Diagnostic Repository (ADR)

Introduced in Oracle 11g, the **Automatic Diagnostic Repository (ADR)** is a unified file-based repository that stores diagnostic data for all Oracle products. Each database instance maintains its own ADR home under a root directory controlled by the `DIAGNOSTIC_DEST` initialization parameter.

```sql
-- Find your ADR base and home
SELECT name, value
FROM   v$diag_info
ORDER BY name;
```

Key rows returned:

| Name | Description |
|------|-------------|
| `ADR Base` | Root of the ADR tree (usually `$ORACLE_BASE`) |
| `ADR Home` | Full path to this instance's ADR home |
| `Diag Alert` | Directory containing the XML alert log |
| `Diag Trace` | Directory containing trace files and the text alert log |

### Alert Log File Formats

Oracle maintains the alert log in **two formats simultaneously**:

1. **XML format** — Located in `$ADR_HOME/alert/`. File is named `log.xml`. This is the authoritative format used by `adrci` and Enterprise Manager. It includes structured metadata, timestamps, and incident cross-references.

2. **Text format** — Located in `$ADR_HOME/trace/`. File is named `alert_<SID>.log`. This is the human-readable format most DBAs use directly. It is generated alongside the XML format and contains the same information in a simpler layout.

```sql
-- Find the exact path to the text alert log
SELECT value
FROM   v$diag_info
WHERE  name = 'Diag Trace';
-- Append /alert_<SID>.log to get the full file path
```

```sql
-- Find the exact path to the XML alert log
SELECT value
FROM   v$diag_info
WHERE  name = 'Diag Alert';
-- The XML log is log.xml in this directory
```

### Legacy Location (Pre-11g)

Before ADR, the alert log was written to `$ORACLE_BASE/admin/<DB_NAME>/bdump/alert_<SID>.log` or the directory specified by `BACKGROUND_DUMP_DEST`. If you encounter older databases, check that parameter:

```sql
SELECT name, value
FROM   v$parameter
WHERE  name = 'background_dump_dest';
```

---

## XML vs. Text Format

### Text Format

The text alert log is straightforward to read with any text editor or Unix command-line tools. Entries look like:

```
Thu Mar 06 14:23:15 2026
ORA-01555 caused by SQL statement below (Query Duration=0 sec, SCN: 0x0003.abcd1234):
SELECT * FROM sales WHERE sale_date > :1
```

**Pros:** Human-readable, easy to grep, parseable with shell scripts.
**Cons:** No structured metadata, harder to query programmatically, no direct cross-references to trace files.

### XML Format

The XML alert log wraps each entry in structured elements:

```xml
<msg time='2026-03-06T14:23:15.123+00:00' org_id='oracle' comp_id='rdbms'
     msg_id='12345' type='INCIDENT_ERROR' group='generic,orcl'
     level='1' host_id='myserver' host_addr='192.168.1.10' pid='23456'>
  <txt>ORA-00600: internal error code, arguments: [kcbz_check_objd_typ_3], ...</txt>
</msg>
```

**Pros:** Queryable via `adrci`, supports filtering by time range and message type, cross-linked to incident IDs.
**Cons:** Verbose, not practical to read directly.

### Querying the XML Alert Log from SQL

Oracle exposes the XML alert log through an external table accessible via the `V$DIAG_ALERT_EXT` view:

```sql
-- Last 50 alert log entries from SQL (no file access needed)
SELECT originating_timestamp,
       message_text
FROM   v$diag_alert_ext
ORDER BY originating_timestamp DESC
FETCH FIRST 50 ROWS ONLY;
```

```sql
-- Find all ORA- errors in the last 24 hours
SELECT originating_timestamp,
       message_text
FROM   v$diag_alert_ext
WHERE  originating_timestamp > SYSTIMESTAMP - INTERVAL '24' HOUR
AND    message_text LIKE 'ORA-%'
ORDER BY originating_timestamp DESC;
```

---

## Common ORA- Errors in the Alert Log

### Critical Errors (Require Immediate Action)

**ORA-00600: internal error code**
The most serious Oracle error. It indicates an internal inconsistency that Oracle detected. Always file a Support Request with the full arguments list and the associated trace file.
- Arguments are in square brackets: `ORA-00600: [kcbz_check_objd_typ_3], [0], [1], ...`
- Each argument combination maps to a specific bug or problem
- Look for the trace file in `$ADR_HOME/trace/` with matching process ID and timestamp

**ORA-07445: exception encountered**
Similar to ORA-00600 but triggered by an operating system exception (segfault, signal). Also requires a Support Request.

**ORA-01578 / ORA-01110: data block corruption**
Indicates a corrupt data block. Immediately check for hardware issues and run RMAN `VALIDATE DATABASE`.

```sql
-- Check for known corrupt blocks
SELECT file#, block#, blocks, corruption_type
FROM   v$database_block_corruption;
```

**ORA-04031: unable to allocate shared memory**
The Shared Pool or another SGA component is exhausted. Indicates memory pressure or possible memory leak.

```sql
-- Diagnose shared pool pressure
SELECT pool, name, bytes/1024/1024 AS mb
FROM   v$sgastat
WHERE  pool = 'shared pool'
ORDER BY bytes DESC
FETCH FIRST 20 ROWS ONLY;
```

**ORA-00257: archiver error**
The archiver process (ARCn) cannot write archive logs. Check disk space on the archive log destination.

```sql
-- Check archive log destinations
SELECT dest_id, status, target, archiver, error
FROM   v$archive_dest
WHERE  status != 'INACTIVE';
```

### Warning-Level Errors (Investigate Promptly)

**ORA-01555: snapshot too old**
Undo data was overwritten before a long-running query could finish reading it. Usually caused by undersized undo tablespace or very long transactions.

```sql
-- Check undo retention and tablespace size
SELECT tablespace_name, retention
FROM   dba_tablespaces
WHERE  contents = 'UNDO';

SELECT a.tablespace_name,
       ROUND(a.bytes/1024/1024, 1) AS alloc_mb,
       ROUND(b.bytes/1024/1024, 1) AS used_mb
FROM   dba_tablespaces a
JOIN   (SELECT tablespace_name, SUM(bytes) bytes
        FROM   dba_segments GROUP BY tablespace_name) b
  ON   a.tablespace_name = b.tablespace_name
WHERE  a.contents = 'UNDO';
```

**ORA-01652: unable to extend temp segment**
The temp tablespace is full. Indicates a large sort or hash operation, or a temp space leak from a killed session.

**ORA-00060: deadlock detected**
Two sessions are waiting on each other's locks. Oracle resolves it by killing one statement. The trace file contains the deadlock graph—always examine it.

**ORA-03113 / ORA-03114: end-of-file on communication channel**
Client lost connection to the server. Usually indicates a crashed server process; look for matching trace files.

**ORA-12514 / ORA-12541: TNS errors**
Listener-related issues. Check `listener.log` and run `lsnrctl status`.

### Informational Messages (Baseline Awareness)

- `Thread 1 advanced to log sequence` — Redo log switch; monitor frequency
- `Completed checkpoint up to RBA` — Checkpoint completed; normal
- `Starting ORACLE instance` / `Shutting down instance` — Instance lifecycle events
- `ALTER TABLESPACE ... ADD DATAFILE` — Administrative DDL recorded
- `ORA-00942: table or view does not exist` in alert log — Usually a startup script issue

---

## Patterns to Watch For

### Redo Log Switch Frequency

Frequent log switches (more than once every 15-20 minutes) indicate the redo logs are undersized, leading to performance overhead and increased I/O:

```sql
-- Log switch frequency by hour over the last 7 days
SELECT TRUNC(first_time, 'HH24') AS switch_hour,
       COUNT(*)                  AS switches
FROM   v$log_history
WHERE  first_time > SYSDATE - 7
GROUP BY TRUNC(first_time, 'HH24')
ORDER BY switch_hour;
```

### Checkpoint Not Complete

The message `checkpoint not complete` in the alert log means Oracle cannot reuse a redo log group because the checkpoint has not finished writing dirty buffers to disk. This causes the log writer to wait, stalling all DML:

```
Thread 1 cannot allocate new log, sequence 9823
Checkpoint not complete
  Current log# 3 seq# 9823 mem# 0: /u01/oradata/orcl/redo03.log
```

Remediation: Add more redo log groups, increase redo log file size, or tune checkpoint frequency (`FAST_START_MTTR_TARGET`).

### ORA-00600 / ORA-07445 Frequency

Any occurrence should be investigated. Repeated occurrences of the same error code arguments point to a specific bug—search My Oracle Support (MOS) for the argument signature.

### Growing Trace File Directory

```sql
-- Check ADR incident count
SELECT COUNT(*) FROM v$diag_incident;

-- Incidents by problem key (groups similar errors)
SELECT problem_key, COUNT(*) AS incident_count
FROM   v$diag_incident
GROUP BY problem_key
ORDER BY incident_count DESC;
```

---

## Finding Errors with adrci

`adrci` (ADR Command Interpreter) is the command-line tool for working with ADR content, including the alert log. See the companion `adrci-usage.md` guide for full details.

Quick reference for alert log work:

```bash
# Launch adrci
adrci

# Set the ADR home (if multiple homes exist)
adrci> SET HOMEPATH diag/rdbms/orcl/orcl

# Show last 20 lines of the alert log (text equivalent)
adrci> SHOW ALERT -TAIL 20

# Show alert log with errors only
adrci> SHOW ALERT -P "MESSAGE_TEXT LIKE '%ORA-%'"

# Show alert log for a time window
adrci> SHOW ALERT -P "ORIGINATING_TIMESTAMP > TIMESTAMP '2026-03-06 00:00:00'"

# Show all problems (grouped incidents)
adrci> SHOW PROBLEM

# Show incidents
adrci> SHOW INCIDENT
```

---

## Automating Alert Log Monitoring

### Shell Script Approach

A common and effective pattern is to track the last-read position of the text alert log and scan only new content on each execution:

```bash
#!/bin/bash
# monitor_alert.sh — Scan Oracle alert log for new ORA- errors
# Run via cron every 5-10 minutes

ORACLE_SID=orcl
ALERT_LOG="/u01/app/oracle/diag/rdbms/orcl/orcl/trace/alert_${ORACLE_SID}.log"
STATE_FILE="/tmp/alert_log_offset_${ORACLE_SID}"
EMAIL="dba@example.com"

# Get current file size
CURRENT_SIZE=$(wc -c < "$ALERT_LOG")

# Read last offset (default 0)
LAST_OFFSET=0
[ -f "$STATE_FILE" ] && LAST_OFFSET=$(cat "$STATE_FILE")

# Only process if file has grown
if [ "$CURRENT_SIZE" -gt "$LAST_OFFSET" ]; then
    # Extract new content and search for errors
    NEW_ERRORS=$(tail -c +$((LAST_OFFSET + 1)) "$ALERT_LOG" | \
                 grep -E "ORA-[0-9]+" | \
                 grep -v "ORA-00000")

    if [ -n "$NEW_ERRORS" ]; then
        echo "$NEW_ERRORS" | mail -s "Oracle Alert: $ORACLE_SID errors detected" "$EMAIL"
    fi

    # Update offset
    echo "$CURRENT_SIZE" > "$STATE_FILE"
fi
```

Add to crontab:
```
*/5 * * * * /opt/scripts/monitor_alert.sh
```

### SQL-Based Monitoring (Cloud Control / Custom)

Using `V$DIAG_ALERT_EXT`, you can build a SQL-based monitoring query that any scheduler (DBMS_SCHEDULER, Enterprise Manager, Grafana with JDBC) can execute:

```sql
-- Errors in the last monitoring window (parameterize as needed)
SELECT originating_timestamp AS error_time,
       message_text
FROM   v$diag_alert_ext
WHERE  originating_timestamp > SYSTIMESTAMP - INTERVAL '10' MINUTE
AND    (message_text LIKE 'ORA-%'
        OR message_text LIKE '%error%'
        OR message_text LIKE '%checkpoint not complete%')
ORDER BY originating_timestamp;
```

### DBMS_SCHEDULER-Based Approach

```sql
-- Create a procedure that checks the alert log and logs findings
CREATE OR REPLACE PROCEDURE check_alert_log AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO   v_count
    FROM   v$diag_alert_ext
    WHERE  originating_timestamp > SYSTIMESTAMP - INTERVAL '15' MINUTE
    AND    message_text LIKE 'ORA-0060%';  -- deadlocks

    IF v_count > 0 THEN
        -- Insert into a monitoring table, send APEX notification, etc.
        INSERT INTO dba_alert_log_events (event_time, event_type, event_count)
        VALUES (SYSTIMESTAMP, 'DEADLOCK', v_count);
        COMMIT;
    END IF;
END;
/

-- Schedule to run every 15 minutes
BEGIN
    DBMS_SCHEDULER.create_job(
        job_name        => 'CHECK_ALERT_LOG_JOB',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'CHECK_ALERT_LOG',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=MINUTELY; INTERVAL=15',
        enabled         => TRUE
    );
END;
/
```

### Oracle Enterprise Manager

In OEM / Cloud Control, configure metric thresholds on:
- **Generic Alert Log Error Status** — Alerts when ORA- errors appear
- **Incident** metrics — Alerts when incident count increases
- **Archive Area Used (%)** — Alerts before archive space runs out

---

## Best Practices

1. **Never delete or truncate the alert log directly.** Oracle rotates it automatically if needed. If size is a concern, use `adrci purge` to remove old incidents and the older XML log segments rather than manually removing the text log.

2. **Monitor the alert log continuously in production.** A 5-10 minute polling interval catches problems before users escalate. Aim for near-real-time alerting on critical errors (ORA-00600, ORA-07445, ORA-01578).

3. **Always examine the associated trace file.** When the alert log references a trace file (it usually names it explicitly), examine that file first before searching MOS. The trace file contains the full context, stack trace, and often the root cause.

4. **Correlate with system events.** Alert log timestamps are the starting point—correlate them with OS metrics (CPU, I/O, memory) from the same time window to distinguish Oracle bugs from resource pressure.

5. **Establish a baseline.** Know what "normal" looks like in your alert log. How often do log switches happen? Are there regular checkpoint warnings? A deviation from baseline is often the first sign of trouble.

6. **Use `adrci` for production alerting workflows.** Its filtering capabilities against the XML format are more precise than grep on the text file, especially when correlating incidents with trace files.

7. **Archive alert logs periodically.** For compliance and post-incident analysis, copy the current alert log to an archive location (with a timestamp in the filename) monthly or weekly.

---

## Common Mistakes and How to Avoid Them

**Mistake: Ignoring ORA-00600 or ORA-07445 because the database seems stable.**
These internal errors always indicate something unexpected happened inside Oracle. Even if the database appears healthy afterward, the error may recur under heavier load. Always open a Support Request and capture the trace file.

**Mistake: Grepping only for "ORA-" and missing other critical messages.**
Not all serious alert log entries contain "ORA-". Messages like `checkpoint not complete`, `db_block_checking detected an error`, and `WARNING: Heavy swapping observed` are equally important. Build monitoring patterns that include these strings.

**Mistake: Monitoring the text alert log file on a different server than the DB host.**
If the alert log is on a shared NFS mount and the mount becomes stale, your monitoring silently stops seeing new entries. Always verify the monitoring tool can actually read the file.

**Mistake: Not recording the state of the alert log before and after maintenance.**
Before any maintenance window, note the last line or timestamp in the alert log. Afterward, review everything that was written during the window so you do not miss errors that occurred but did not surface as visible problems.

**Mistake: Treating all ORA-01555 errors as a tuning problem.**
ORA-01555 can also result from application bugs (uncommitted transactions held open), queries running inside scheduled jobs that compete with purging undo, or incorrectly sized undo. Check the full context before just increasing `UNDO_RETENTION`.

**Mistake: Assuming the XML and text alert logs are always in sync.**
In rare cases (system crashes, disk issues), they can diverge. The XML log is the authoritative source; use `adrci` when precision matters.

---

## Sources

- [Oracle Database 19c Administrator's Guide — Diagnosing and Resolving Problems](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/diagnosing-and-resolving-problems.html)
- [Oracle Database 19c Reference — V$DIAG_ALERT_EXT](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-DIAG_ALERT_EXT.html)
- [Oracle Database 19c Reference — V$DIAG_INFO](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-DIAG_INFO.html)
