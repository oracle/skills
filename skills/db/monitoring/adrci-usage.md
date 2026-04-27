# ADRCI Usage

## Overview

`adrci` (Automatic Diagnostic Repository Command Interpreter) is Oracle's command-line interface for managing the Automatic Diagnostic Repository (ADR). It was introduced in Oracle 11g as the standard tool for searching diagnostic data, managing incidents, packaging diagnostic information for Oracle Support, and purging stale diagnostic content.

Every DBA should be proficient with `adrci` because it provides structured, filterable access to the alert log, trace files, incidents, and problems—capabilities that are impossible or impractical with plain file system tools like `grep` or `tail`. It is especially critical when preparing diagnostic packages for Oracle Support (IPS packages) and when correlating multiple related incidents.

---

## ADR Repository Structure

The ADR is a file-based repository organized in a predictable directory hierarchy. Understanding this structure helps when navigating the file system directly or when interpreting `adrci` output.

```
$ADR_BASE/
└── diag/
    └── rdbms/                          ← Product type
        └── <db_name>/                  ← DB unique name (lowercase)
            └── <instance_name>/        ← Instance name (ADR Home)
                ├── alert/              ← XML alert log (log.xml)
                ├── trace/              ← Trace files + text alert log
                ├── incident/           ← Per-incident directories
                │   └── incdir_<id>/    ← Trace files for one incident
                ├── incpkg/             ← IPS package staging area
                ├── cdump/              ← Core dump files
                ├── hm/                 ← Health Monitor results
                ├── sweep/              ← Sweep (automated action) results
                └── metadata/           ← ADR internal metadata (SQLite DB)
```

### Finding Your ADR Home

```sql
-- From SQL*Plus or any SQL client
SELECT name, value
FROM   v$diag_info
ORDER BY name;
```

Key rows:

| `ADR Base` | Root of the ADR (`$ORACLE_BASE` or `DIAGNOSTIC_DEST`) |
|---|---|
| `ADR Home` | Full path for this instance |
| `Diag Alert` | XML alert log directory |
| `Diag Trace` | Trace file directory (also has text alert log) |
| `Diag Incident` | Incident directory |

### Multiple ADR Homes

A single server may have multiple ADR homes—one per Oracle product instance (database instances, listeners, ASM, etc.). `adrci` can work with all of them simultaneously:

```bash
# List all ADR homes on this server
adrci> SHOW HOMES

# Example output:
# ADR Homes:
# diag/rdbms/orcl/orcl
# diag/rdbms/testdb/testdb
# diag/tnslsnr/myserver/listener
# diag/clients/user_oracle/host_1234567890_11
```

---

## Starting adrci

```bash
# Start interactively (uses ORACLE_BASE environment variable for ADR base)
adrci

# Start and execute a single command non-interactively
adrci exec="SHOW ALERT -TAIL 50"

# Execute multiple commands non-interactively (semicolon-separated)
adrci exec="SET HOMEPATH diag/rdbms/orcl/orcl; SHOW ALERT -TAIL 50"

# Run adrci commands from a script file
adrci script=/path/to/adrci_commands.sql
```

---

## Core adrci Command Reference

### Navigation and Configuration

```bash
# Show all available ADR homes
SHOW HOMES

# Set working ADR home (single)
SET HOMEPATH diag/rdbms/orcl/orcl

# Set multiple homes (for cross-instance queries)
SET HOMEPATH diag/rdbms/orcl/orcl diag/rdbms/testdb/testdb

# Show current home setting
SHOW HOMEPATH

# Show ADR base path
SHOW BASE

# Get help on any command
HELP
HELP SHOW INCIDENT
HELP IPS
```

### Viewing the Alert Log

```bash
# Show entire alert log (use with caution on large logs)
SHOW ALERT

# Show last N lines (equivalent to tail -n)
SHOW ALERT -TAIL 100

# Show last N lines and continue watching (tail -f equivalent)
SHOW ALERT -TAIL 50 -F

# Filter alert log by predicate (WHERE clause syntax)
SHOW ALERT -P "MESSAGE_TEXT LIKE '%ORA-%'"

# Filter by time range
SHOW ALERT -P "ORIGINATING_TIMESTAMP > TIMESTAMP '2026-03-06 08:00:00'"

# Combine predicates
SHOW ALERT -P "ORIGINATING_TIMESTAMP > TIMESTAMP '2026-03-06 00:00:00' AND MESSAGE_TEXT LIKE '%ORA-00600%'"

# Output to terminal (default behaviour when no pager is set)
SHOW ALERT -TERM

# Specify an alert file outside ADR
SHOW ALERT -FILE /path/to/alert_file
```

The predicate language in `adrci` uses column names from the underlying XML schema. Key columns for `SHOW ALERT` filtering:

| Column | Description |
|--------|-------------|
| `ORIGINATING_TIMESTAMP` | When the message was generated |
| `MESSAGE_TEXT` | The actual log message |
| `MESSAGE_TYPE` | Numeric message type (1=Unknown, 2=Incident, 3=Error, 4=Warning, 5=Notification, 6=Trace) |
| `COMPONENT_ID` | Oracle component that generated the message |

### Working with Incidents

An **incident** is a single occurrence of a critical error. Each incident gets a unique ID and its own subdirectory under `$ADR_HOME/incident/incdir_<id>/` containing all diagnostic data related to that error.

A **problem** is a group of incidents sharing the same root cause, identified by a **problem key** (a string like `ORA 600 [kcbz_check_objd_typ_3]`).

```bash
# List all incidents (most recent first)
SHOW INCIDENT

# List incidents with full details
SHOW INCIDENT -MODE DETAIL

# Show a specific incident
SHOW INCIDENT -P "INCIDENT_ID=12345"

# Show incidents in a time range
SHOW INCIDENT -P "CREATE_TIME > TIMESTAMP '2026-03-06 00:00:00'"

# Show incidents by problem key
SHOW INCIDENT -P "PROBLEM_KEY LIKE '%ORA-00600%'"

# Show all problems (grouped incidents)
SHOW PROBLEM

# Show problems with full detail
SHOW PROBLEM -MODE DETAIL

# Show a specific problem
SHOW PROBLEM -P "PROBLEM_ID=3"
```

Sample `SHOW INCIDENT` output:
```
ADR Home = /u01/app/oracle/diag/rdbms/orcl/orcl:
*************************************************************************
                                                    INCIDENT_ID PROBLEM_KEY                 CREATE_TIME
                                                    ----------- --------------------------- ----------------------------------------
                                                          12345 ORA 600 [kcbz_check_objd_t] 2026-03-06 14:23:15.000000 +00:00
                                                          12344 ORA 7445 [sigsegv]          2026-03-05 09:11:02.000000 +00:00
2 rows fetched
```

### Viewing Trace Files

```bash
# List trace files associated with an incident
SHOW TRACEFILE -I 12345

# List all trace files in the ADR home
SHOW TRACEFILE

# List trace files matching a pattern
SHOW TRACEFILE "%ora_12345%"

# View a specific trace file
SHOW TRACE /u01/app/oracle/diag/rdbms/orcl/orcl/incident/incdir_12345/orcl_ora_12345.trc

# View last N lines of a trace file
SHOW TRACE /path/to/file.trc -TAIL 100
```

---

## IPS: Incident Packaging System

The **Incident Packaging System (IPS)** automates the collection and packaging of all diagnostic data related to one or more incidents into a ZIP file suitable for uploading to Oracle Support. This is the correct way to gather diagnostic data—it ensures all related files (trace files, alert log excerpts, system state dumps, SQL plan baselines, etc.) are included.

### Creating an IPS Package

```bash
# Create a package for a specific incident
IPS CREATE PACKAGE INCIDENT 12345

# Create a package for a time window
IPS CREATE PACKAGE TIMEWINDOW '2026-03-06 14:00:00' '2026-03-06 15:00:00'

# Create a package for a problem (all incidents with same root cause)
IPS CREATE PACKAGE PROBLEM 3

# Create a package and immediately generate the ZIP
IPS CREATE PACKAGE INCIDENT 12345 CORRELATE BASIC

# Create with full correlation (includes related incidents from same problem)
IPS CREATE PACKAGE INCIDENT 12345 CORRELATE ALL
```

### Adding and Removing Files from a Package

```bash
# Show current packages
IPS SHOW PACKAGE

# Show contents of a specific package
IPS SHOW PACKAGE PACKAGE 1

# Add a file to the package
IPS ADD FILE /path/to/additional_trace.trc PACKAGE 1

# Add an incident to an existing package
IPS ADD INCIDENT 12346 PACKAGE 1

# Remove a file from a package
IPS REMOVE FILE /path/to/file.trc PACKAGE 1
```

### Generating the ZIP File

```bash
# Generate the ZIP for package 1 in the current directory
IPS GENERATE PACKAGE 1 IN /tmp

# The ZIP is created in the specified directory
# Typical output: /tmp/ORA600_20260306_142315_COM_1.zip
```

### Uploading to Oracle Support

After generating the ZIP:
1. Log in to My Oracle Support (MOS) at `support.oracle.com`
2. Open or create a Service Request
3. Upload the ZIP file to the SR
4. Paste the incident ID and problem key in the SR description

---

## Correlating Incidents

Correlation is the process of identifying related incidents that share the same root cause or occurred in the same time window. `adrci` handles this automatically with IPS or manually with `SHOW INCIDENT` filtering.

```bash
# Show incidents correlated to incident 12345
IPS GET METADATA INCIDENT 12345

# Show all incidents for a problem (same problem key)
SHOW INCIDENT -P "PROBLEM_ID=3"

# Manual correlation: incidents within 30 minutes of a target incident
SHOW INCIDENT -P "CREATE_TIME > TIMESTAMP '2026-03-06 14:00:00' AND CREATE_TIME < TIMESTAMP '2026-03-06 14:30:00'"
```

From SQL, a broader correlation view:

```sql
-- Incidents with their problem keys and timing
SELECT i.incident_id,
       i.create_time,
       p.problem_key,
       i.status
FROM   v$diag_incident i
JOIN   v$diag_problem  p ON i.problem_id = p.problem_id
ORDER BY i.create_time DESC
FETCH FIRST 50 ROWS ONLY;
```

```sql
-- Problems with incident counts (find recurring issues)
SELECT problem_id,
       problem_key,
       last_incident_time,
       COUNT(*) OVER (PARTITION BY problem_id) AS incident_count
FROM   v$diag_problem
ORDER BY last_incident_time DESC;
```

---

## Purging Old Diagnostic Data

ADR data accumulates over time. Oracle has default retention policies, but DBAs should actively manage purging—especially on systems with high incident rates or limited disk space.

### Default Retention Policies

These defaults map to the `LONGP_POLICY` (long-lived content, default 8760 hours = 1 year) and `SHORTP_POLICY` (short-lived content, default 720 hours = 30 days) settings visible in `SHOW CONTROL`.

| Data Type | Default Retention | Policy |
|-----------|------------------|--------|
| Incidents | 1 year (8760 hours) | LONGP_POLICY |
| Alert log (XML) | 1 year (8760 hours) | LONGP_POLICY |
| Trace files | 30 days (720 hours) | SHORTP_POLICY |
| Core dumps | 30 days (720 hours) | SHORTP_POLICY |

> **Note:** Run `SHOW CONTROL` inside `adrci` to see the current values for your environment. Defaults may vary by Oracle version and patch level.

### Viewing and Changing Retention Policies

```bash
# Show current retention policies
SHOW CONTROL

# Change short-term retention to 30 days (in hours: 30 * 24 = 720)
# SHORTP_POLICY covers trace files, core dumps, and packaging info
SET CONTROL (SHORTP_POLICY=720)     -- 30 days in hours (default)

# Change long-term retention to 180 days (in hours: 180 * 24 = 4320)
# LONGP_POLICY covers incident data, incident dumps, and alert logs
SET CONTROL (LONGP_POLICY=4320)     -- 180 days in hours

# Show current ADR home disk usage
SHOW CONTROL
```

> **Note:** `SET CONTROL` values are in **hours**, not minutes. Default `SHORTP_POLICY` = 720 hours (30 days); default `LONGP_POLICY` = 8760 hours (365 days).

### Purging Specific Data

```bash
# Purge all data older than the retention policy (automatic purge)
PURGE

# Purge data older than a specific age (-AGE value is in MINUTES)
PURGE -AGE 10080 -TYPE INCIDENT     -- Incidents older than 10080 minutes (7 days)
PURGE -AGE 43200 -TYPE TRACE        -- Trace files older than 43200 minutes (30 days)

# Purge a specific incident (removes incident directory and its trace files)
PURGE -I 12344

# Purge a range of incidents
PURGE -I 12340 12344
```

### Automated Purging via Script

```bash
#!/bin/bash
# purge_adr.sh — Run weekly via cron to keep ADR lean
# Purge incidents older than 90 days (129600 min), traces older than 30 days (43200 min)

ORACLE_SID=orcl
export ORACLE_SID ORACLE_BASE=/u01/app/oracle

adrci exec="SET HOMEPATH diag/rdbms/orcl/orcl; PURGE -AGE 129600 -TYPE INCIDENT; PURGE -AGE 43200 -TYPE TRACE"
```

---

## Advanced adrci Queries

### Using the HOME Clause with Multiple Instances

```bash
# Query incidents across all ADR homes simultaneously
SET HOMEPATH diag/rdbms/orcl/orcl diag/rdbms/testdb/testdb

# This will search across both homes
SHOW INCIDENT

# Reset to a single home
SET HOMEPATH diag/rdbms/orcl/orcl
```

### Non-Interactive Scripting

```bash
# Run a sequence of adrci commands from a shell script
adrci << 'EOF'
SET HOMEPATH diag/rdbms/orcl/orcl
SHOW ALERT -P "ORIGINATING_TIMESTAMP > TIMESTAMP '2026-03-06 00:00:00' AND MESSAGE_TEXT LIKE '%ORA-%'" -OUT /tmp/todays_errors.txt
SHOW PROBLEM
SHOW INCIDENT -MODE BRIEF
EOF
```

```bash
# Use exec for a single command
adrci exec="SET HOMEPATH diag/rdbms/orcl/orcl; SHOW ALERT -TAIL 50" > /tmp/alert_tail.txt
```

### Extracting Incident Trace File Paths

```sql
-- Get all trace file paths for a given incident from SQL
SELECT trace_filename
FROM   v$diag_trace_file
WHERE  con_id = 0  -- CDB root or non-CDB
ORDER BY change_time DESC;
```

```bash
# In adrci: show trace file for most recent incident
SHOW INCIDENT -MODE DETAIL -P "CREATE_TIME > TIMESTAMP '2026-03-06 00:00:00'"
```

---

## Best Practices

1. **Always use `adrci` to package diagnostics for Oracle Support.** Manually zipping trace files misses metadata, XML alert log excerpts, and correlated data that Oracle Support needs. The IPS workflow ensures completeness.

2. **Set up automatic purging.** Without regular purging, the ADR can consume tens or hundreds of gigabytes on a busy system. Schedule a weekly `PURGE` command and consider lowering retention for trace files if disk is constrained.

3. **Use the `-F` option with `-TAIL` during live troubleshooting.** `SHOW ALERT -TAIL 20 -F` is the `adrci` equivalent of `tail -f` and is more reliable because it reads from the XML format, not a file descriptor that might roll over.

4. **Always note the incident ID when an ORA-00600 or ORA-07445 occurs.** The incident ID links the alert log entry to the trace file directory, simplifying later analysis and IPS packaging.

5. **Use predicates to filter, not post-processing tools like grep.** `adrci` predicates operate on indexed metadata, making them faster and more precise than text-searching the raw log file.

6. **Correlate incidents before packaging.** Use `IPS CREATE PACKAGE INCIDENT <id> CORRELATE ALL` so that related incidents from the same root cause are included in the support package—this often speeds up Oracle Support resolution significantly.

7. **Monitor the ADR disk usage.** Include `$ADR_HOME` in your disk space monitoring. A flood of incidents (e.g., from a recurring ORA-00600) can fill the file system in hours.

---

## Common Mistakes and How to Avoid Them

**Mistake: Running `adrci` without setting the correct home.**
If multiple homes exist and you do not call `SET HOMEPATH`, `adrci` either uses the first found home or queries all of them. Explicitly set the home at the start of every `adrci` session or script.

**Mistake: Manually deleting trace files from the OS.**
Deleting files from `$ADR_HOME/trace/` or `$ADR_HOME/incident/` directly bypasses ADR metadata, leaving orphaned entries that cause `adrci` errors. Always use `PURGE` inside `adrci`.

**Mistake: Creating an IPS package without `CORRELATE ALL`.**
The minimal package (`CORRELATE BASIC` or no correlation) often misses critical trace files from related background processes. Always use `CORRELATE ALL` when the issue is unclear.

**Mistake: Not specifying `IN /path` for `IPS GENERATE`.**
Without a target path, the ZIP file is created in the current directory, which may not have enough space or may be a temporary location that gets cleaned up. Always specify an explicit destination path with sufficient free space.

**Mistake: Assuming `SHOW ALERT` shows real-time data.**
`adrci` reads from the XML alert log, which is updated synchronously with the text log. However, on very high-activity systems, there can be a brief lag. For live monitoring, use `SHOW ALERT -TAIL -F` or poll with a short-interval script.

**Mistake: Forgetting that `PURGE -AGE` uses minutes, not days.**
`PURGE -AGE 30` purges data older than 30 minutes, not 30 days. Convert: 30 days = 43,200 minutes. Always double-check the unit before running purge commands in production.

**Mistake: Confusing `PURGE -AGE` units with `SET CONTROL` units.**
`PURGE -AGE` is in **minutes**; `SET CONTROL (SHORTP_POLICY/LONGP_POLICY)` is in **hours**. These are different units for two different commands.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## See Also

- [Alert Log Analysis](../monitoring/alert-log-analysis.md) — Interpreting alert log entries and ORA- errors

## Sources

- [Oracle Database 19c Administrator's Guide — Managing Diagnostic Data](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/diagnosing-and-resolving-problems.html)
- [Oracle Database 19c Utilities — ADRCI: ADR Command Interpreter](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-adr-command-interpreter-adrci.html)
- [ADRCI SHOW ALERT syntax (12c reference, applies to 19c)](https://docs.oracle.com/database/121/SUTIL/GUID-8D62D6A0-99F4-465C-B088-5CCF259B7D80.htm)
- [ADRCI PURGE syntax](https://docs.oracle.com/database/121/SUTIL/GUID-92DD451B-C3A1-48D7-A147-3296E75572CB.htm)
- [ADRCI SET CONTROL syntax](https://docs.oracle.com/database/121/SUTIL/GUID-68ED8877-1132-45F1-8297-E1CCF8D34D98.htm)
- [Oracle Database 19c Reference — V$DIAG_INFO](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-DIAG_INFO.html)
