# Health Monitor and Database Advisors

## Overview

Oracle's Health Monitor is a framework built into the database kernel that provides automated, on-demand, or scheduled diagnostic checks against the database's structural integrity. It is the proactive counterpart to reactive alert log monitoring—instead of waiting for errors to appear, Health Monitor actively interrogates the database internals to surface problems before they cause data loss or downtime.

The Health Monitor is accessed through the `DBMS_HM` PL/SQL package and its results are stored in the ADR. Closely related are Oracle's advisory framework components—the SQL Tuning Advisor, Segment Advisor, and Memory Advisor—which provide actionable recommendations for performance and space management rather than structural integrity.

---

## Health Monitor Architecture

### Components

- **Health Monitor Checks (Runners):** Pre-built diagnostic routines, each targeting a specific layer of the database stack.
- **Findings:** The output of each check run—structured records describing what was found (healthy, failed, or advisory).
- **Recommendations:** Actions Oracle suggests based on findings (repair scripts, SQL, RMAN commands).
- **DBMS_HM:** The PL/SQL API for running checks and retrieving results.
- **ADR Integration:** All findings and recommendations are stored in the ADR and accessible via `V$HM_*` views and `adrci`.

### V$ Views for Health Monitor

| View | Description |
|------|-------------|
| `V$HM_CHECK` | All available health checks and their current status |
| `V$HM_CHECK_PARAM` | Parameters each check accepts |
| `V$HM_RUN` | Historical check runs with start/end times and status |
| `V$HM_FINDING` | Findings produced by each check run |
| `V$HM_RECOMMENDATION` | Recommendations based on findings |
| `V$HM_INFO` | Additional informational details about findings |

---

## Built-in Health Checks

### Complete List with Descriptions

```sql
-- View all available health checks
SELECT name,
       description,
       internal_check,
       offline_capable
FROM   v$hm_check
ORDER BY name;
```

#### DB Structure Integrity Check

Validates the consistency of the database's control file, datafile headers, and redo log headers. Checks that all files listed in the control file exist, are accessible, and have consistent SCNs.

- **Use when:** After a crash, after restoring from backup, suspecting control file corruption
- **Offline capable:** Yes (can run in mount mode)
- **Run time:** Fast (seconds to minutes)

#### Data Block Integrity Check

Scans data blocks for logical corruption (bad checksums, invalid block types, mismatched object IDs). Does not check every block by default—targeted at blocks already identified as suspect.

- **Use when:** After an ORA-01578 (corrupt block), after storage failures
- **Offline capable:** No (requires open database)
- **Run time:** Varies by scope

#### Redo Integrity Check

Validates the redo log files and archived redo logs for completeness and readability. Identifies gaps or unreadable redo that would prevent recovery.

- **Use when:** Before or after media recovery, investigating redo-related ORA- errors
- **Offline capable:** Yes

#### Undo Segment Integrity Check

Verifies that all undo segments referenced in the system are accessible and consistent. Detects undo corruption that could cause ORA-01578 or ORA-00600 errors related to transaction rollback.

- **Use when:** After unexpected shutdowns, investigating ORA-01555 or rollback errors
- **Offline capable:** No

#### Transaction Integrity Check

Examines a specific transaction to verify its undo records are complete and consistent. Useful when a specific transaction is suspected to be corrupt.

- **Use when:** Targeted investigation of a specific transaction ID
- **Parameters:** Requires `TXN_ID` parameter
- **Offline capable:** No

#### Dictionary Integrity Check

Validates the internal consistency of the Oracle data dictionary—the master catalog of all database objects. A corrupt dictionary can cause cascading failures across all database operations.

- **Use when:** After applying patches, after failed DDL operations, after ORA-00600 errors involving dict_ arguments
- **Offline capable:** No
- **Run time:** Can be slow on large databases

---

## Running Health Checks

### Basic Syntax

```sql
-- Minimum required: check name and run name
BEGIN
    DBMS_HM.run_check(
        check_name => 'DB Structure Integrity Check',
        run_name   => 'MY_STRUCT_CHECK_20260306'
    );
END;
/
```

### Running All Key Checks

```sql
-- DB Structure Integrity
BEGIN
    DBMS_HM.run_check(
        check_name => 'DB Structure Integrity Check',
        run_name   => 'STRUCT_' || TO_CHAR(SYSDATE, 'YYYYMMDD_HH24MISS')
    );
END;
/

-- Data Block Integrity (targeted at a specific file and block)
BEGIN
    DBMS_HM.run_check(
        check_name => 'Data Block Integrity Check',
        run_name   => 'BLOCK_' || TO_CHAR(SYSDATE, 'YYYYMMDD_HH24MISS'),
        input_params => DBMS_HM.get_run_param('FILE_ID', '5')
                     || DBMS_HM.get_run_param('BLOCK_ID', '128')
    );
END;
/

-- Redo Integrity Check
BEGIN
    DBMS_HM.run_check(
        check_name => 'Redo Integrity Check',
        run_name   => 'REDO_' || TO_CHAR(SYSDATE, 'YYYYMMDD_HH24MISS')
    );
END;
/

-- Undo Segment Integrity
BEGIN
    DBMS_HM.run_check(
        check_name => 'Undo Segment Integrity Check',
        run_name   => 'UNDO_' || TO_CHAR(SYSDATE, 'YYYYMMDD_HH24MISS')
    );
END;
/

-- Dictionary Integrity
BEGIN
    DBMS_HM.run_check(
        check_name => 'Dictionary Integrity Check',
        run_name   => 'DICT_' || TO_CHAR(SYSDATE, 'YYYYMMDD_HH24MISS')
    );
END;
/
```

### Passing Parameters

```sql
-- Check parameters available for each check
SELECT c.name AS check_name,
       p.name AS param_name,
       p.description,
       p.default_value
FROM   v$hm_check c
JOIN   v$hm_check_param p ON c.id = p.check_id
ORDER BY c.name, p.name;
```

```sql
-- Transaction integrity check requires a transaction ID
-- First find the transaction ID you want to investigate
SELECT xid, status
FROM   v$transaction;

-- Run with parameter
BEGIN
    DBMS_HM.run_check(
        check_name   => 'Transaction Integrity Check',
        run_name     => 'TXN_CHECK_20260306',
        input_params => DBMS_HM.get_run_param('TXN_ID', '0500.010.000003e8')
    );
END;
/
```

### Monitoring a Running Check

Health checks run asynchronously by default. Poll for completion:

```sql
-- Check run status
-- V$HM_RUN column for the run identifier is NAME (not RUN_NAME)
-- STATUS values: INITIAL, EXECUTING, INTERRUPTED, TIMEDOUT, CANCELLED, COMPLETED, ERROR
-- V$HM_RUN does not have a NUM_FINDINGS column; use NUM_INCIDENT instead
SELECT r.name          AS run_name,
       r.check_name,
       r.status,
       r.start_time,
       r.end_time,
       ROUND((CAST(r.end_time AS DATE) - CAST(r.start_time AS DATE)) * 86400, 1) AS duration_sec,
       r.num_incident
FROM   v$hm_run r
ORDER BY r.start_time DESC
FETCH FIRST 20 ROWS ONLY;
```

---

## Viewing Findings and Recommendations

### Findings

```sql
-- All findings from the most recent runs
SELECT r.name AS run_name,
       r.check_name,
       f.type,           -- FAILURE, WARNING, ADVISORY
       f.status,
       f.description,
       f.repair_sql
FROM   v$hm_run     r
JOIN   v$hm_finding f ON r.run_id = f.run_id
ORDER BY r.start_time DESC, f.type;
```

```sql
-- Only failures and warnings (not just advisory)
SELECT r.name AS run_name,
       r.check_name,
       f.type,
       f.description,
       f.repair_sql
FROM   v$hm_run     r
JOIN   v$hm_finding f ON r.run_id = f.run_id
WHERE  f.type IN ('FAILURE', 'WARNING')
ORDER BY r.start_time DESC;
```

```sql
-- Findings with associated recommendations
SELECT r.name AS run_name,
       f.description AS finding,
       f.type        AS finding_type,
       rec.type      AS recommendation_type,
       rec.description AS recommendation,
       rec.repair_script
FROM   v$hm_run            r
JOIN   v$hm_finding        f   ON r.run_id = f.run_id
JOIN   v$hm_recommendation rec ON f.finding_id = rec.finding_id
ORDER BY r.start_time DESC;
```

### Generating a Report

`DBMS_HM` can generate text, HTML, or XML reports:

```sql
-- Generate report for a specific run
DECLARE
    v_report CLOB;
BEGIN
    v_report := DBMS_HM.get_run_report('MY_STRUCT_CHECK_20260306', 'TEXT');
    -- Write to a file (requires UTL_FILE setup) or display the first chunk
    DBMS_OUTPUT.put_line(DBMS_LOB.SUBSTR(v_report, 32767, 1));
END;
/
```

A more practical approach using `adrci`:

```bash
# In adrci, show Health Monitor findings
adrci> SHOW HM_FINDING

# Show findings for a specific run
adrci> SHOW HM_FINDING -P "RUN_NAME = 'MY_STRUCT_CHECK_20260306'"

# Show recommendations
adrci> SHOW HM_RECOMMENDATION
```

---

## Oracle Advisors

The Oracle advisory framework provides workload-based recommendations distinct from structural Health Monitor checks. The main advisors relevant to monitoring and diagnostics are the SQL Tuning Advisor, Segment Advisor, and Memory Advisor.

### SQL Tuning Advisor

The SQL Tuning Advisor analyzes one or more SQL statements and recommends profile-based tuning, new indexes, statistics collection, or SQL restructuring.

#### Running the SQL Tuning Advisor

```sql
-- Create a tuning task for a specific SQL_ID
DECLARE
    v_task_name VARCHAR2(100);
BEGIN
    v_task_name := DBMS_SQLTUNE.create_tuning_task(
        sql_id      => 'abc123def456g',
        scope       => DBMS_SQLTUNE.scope_comprehensive,
        time_limit  => 300,  -- seconds
        task_name   => 'TUNE_ABC123_20260306',
        description => 'Tune top CPU query from AWR'
    );
    DBMS_OUTPUT.put_line('Task created: ' || v_task_name);
END;
/

-- Execute the task
BEGIN
    DBMS_SQLTUNE.execute_tuning_task(task_name => 'TUNE_ABC123_20260306');
END;
/

-- Check status
SELECT task_name, status, advisor_name
FROM   dba_advisor_tasks
WHERE  task_name = 'TUNE_ABC123_20260306';

-- View the recommendation report
SELECT DBMS_SQLTUNE.report_tuning_task('TUNE_ABC123_20260306') AS report
FROM   dual;
```

#### Tuning Top AWR SQL Automatically

```sql
-- Create a tuning task from a SQL Tuning Set (STS) of top SQL from AWR
DECLARE
    v_task_name VARCHAR2(100);
BEGIN
    -- Create STS from AWR
    DBMS_SQLTUNE.create_sqlset(sqlset_name => 'TOP_AWR_SQL');

    DBMS_SQLTUNE.load_sqlset(
        sqlset_name  => 'TOP_AWR_SQL',
        populate_cursor => DBMS_SQLTUNE.select_workload_repository(
            begin_snap => 100,
            end_snap   => 120,
            basic_filter => 'elapsed_time > 10000000',  -- > 10 seconds
            ranking_measure1 => 'elapsed_time',
            result_limit => 20
        )
    );

    v_task_name := DBMS_SQLTUNE.create_tuning_task(
        sqlset_name => 'TOP_AWR_SQL',
        task_name   => 'TUNE_TOP_20_AWR'
    );
    DBMS_SQLTUNE.execute_tuning_task('TUNE_TOP_20_AWR');
END;
/
```

#### Accepting SQL Profiles

```sql
-- Accept all recommendations from the tuning task
BEGIN
    DBMS_SQLTUNE.accept_sql_profile(
        task_name  => 'TUNE_ABC123_20260306',
        force_match => TRUE  -- apply even if SQL text differs slightly (bind-insensitive)
    );
END;
/
```

### Segment Advisor

The Segment Advisor identifies segments with reclaimable space—tables and indexes that can be shrunk to reclaim blocks above the high water mark.

```sql
-- Run Segment Advisor on a specific schema
DECLARE
    v_task_name  VARCHAR2(100) := 'SEG_ADV_' || TO_CHAR(SYSDATE, 'YYYYMMDD');
    v_object_id  NUMBER;
BEGIN
    DBMS_ADVISOR.create_task(
        advisor_name => 'Segment Advisor',
        task_name    => v_task_name
    );

    DBMS_ADVISOR.create_object(
        task_name    => v_task_name,
        object_type  => 'SCHEMA',
        attr1        => 'SCOTT',  -- schema name
        object_id    => v_object_id
    );

    DBMS_ADVISOR.set_task_parameter(
        task_name    => v_task_name,
        parameter    => 'RECOMMEND_ALL',
        value        => 'TRUE'
    );

    DBMS_ADVISOR.execute_task(task_name => v_task_name);
END;
/

-- View Segment Advisor findings
SELECT o.owner,
       o.object_name,
       o.object_type,
       f.message,
       TO_NUMBER(f.more_info) AS reclaimable_mb
FROM   dba_advisor_objects      o
JOIN   dba_advisor_findings     f ON o.task_id = f.task_id AND o.object_id = f.object_id
JOIN   dba_advisor_tasks        t ON t.task_id = o.task_id
WHERE  t.advisor_name = 'Segment Advisor'
  AND  t.status       = 'COMPLETED'
ORDER BY TO_NUMBER(f.more_info) DESC NULLS LAST;
```

```sql
-- Quick manual check: segments with potential waste (no advisor needed)
SELECT owner,
       segment_name,
       segment_type,
       ROUND(blocks * 8192 / 1048576, 1)       AS allocated_mb,
       ROUND(num_rows * avg_row_len / 1048576, 1) AS estimated_data_mb,
       ROUND((blocks * 8192 - num_rows * avg_row_len) / 1048576, 1) AS waste_mb
FROM   dba_tables
WHERE  owner NOT IN ('SYS','SYSTEM','DBSNMP','SYSMAN')
  AND  num_rows > 10000
  AND  blocks > 100
ORDER BY waste_mb DESC NULLS LAST
FETCH FIRST 30 ROWS ONLY;
```

### Memory Advisor

The Memory Advisor provides recommendations for SGA and PGA sizing based on current workload.

#### SGA Target Advisor

```sql
-- SGA Size Advice: estimated DB time for different SGA sizes
SELECT sga_size,
       sga_size_factor,
       estd_db_time,
       estd_db_time_factor,
       estd_physical_reads
FROM   v$sga_target_advice
ORDER BY sga_size;
```

```sql
-- Shared Pool Advisor: cache hit ratio at different shared pool sizes
SELECT shared_pool_size_for_estimate AS pool_size_mb,
       shared_pool_size_factor,
       estd_lc_size               AS estd_lib_cache_mb,
       estd_lc_memory_objects,
       estd_lc_time_saved         AS time_saved_sec,
       estd_lc_time_saved_factor
FROM   v$shared_pool_advice
ORDER BY shared_pool_size_for_estimate;
```

```sql
-- Buffer Cache Advisor: physical reads at different cache sizes
SELECT size_for_estimate          AS cache_size_mb,
       size_factor,
       estd_physical_read_factor,
       estd_physical_reads
FROM   v$db_cache_advice
WHERE  block_size = (SELECT value FROM v$parameter WHERE name = 'db_block_size')
AND    advice_status = 'ON'
ORDER BY size_for_estimate;
```

#### PGA Target Advisor

```sql
-- PGA Target Advice: optimal PGA size based on workload
SELECT pga_target_for_estimate  AS pga_target_mb,
       pga_target_factor,
       estd_pga_cache_hit_percentage,
       estd_overalloc_count
FROM   v$pga_target_advice
ORDER BY pga_target_for_estimate;
```

```sql
-- Current PGA usage by component
SELECT name,
       ROUND(value/1024/1024, 1) AS mb
FROM   v$pgastat
WHERE  name IN (
    'total PGA inuse',
    'total PGA allocated',
    'aggregate PGA target parameter',
    'total freeable PGA memory',
    'maximum PGA allocated'
)
ORDER BY name;
```

---

## Automated Health Check Scheduling

### Using DBMS_SCHEDULER

```sql
-- Schedule DB Structure Integrity Check weekly on Sunday at 2 AM
BEGIN
    DBMS_SCHEDULER.create_job(
        job_name        => 'WEEKLY_HM_STRUCT_CHECK',
        job_type        => 'PLSQL_BLOCK',
        job_action      => q'[
            BEGIN
                DBMS_HM.run_check(
                    check_name => 'DB Structure Integrity Check',
                    run_name   => 'SCHED_STRUCT_' || TO_CHAR(SYSDATE, 'YYYYMMDD')
                );
            END;
        ]',
        start_date      => TRUNC(NEXT_DAY(SYSDATE, 'SUNDAY')) + INTERVAL '2' HOUR,
        repeat_interval => 'FREQ=WEEKLY; BYDAY=SUN; BYHOUR=2; BYMINUTE=0',
        enabled         => TRUE,
        comments        => 'Weekly DB Structure Integrity Health Check'
    );
END;
/
```

### Monitoring Health Check Results After Runs

```sql
-- Alert on any FAILURE findings from recent runs
SELECT r.name AS run_name,
       r.check_name,
       r.start_time,
       f.type,
       f.description,
       f.repair_sql
FROM   v$hm_run     r
JOIN   v$hm_finding f ON r.run_id = f.run_id
WHERE  r.start_time > SYSDATE - 7
  AND  f.type = 'FAILURE'
ORDER BY r.start_time DESC;
```

---

## Best Practices

1. **Run Health Monitor checks proactively after every maintenance window.** Patches, imports, manual datafile operations, and storage maintenance can all introduce subtle corruption. A post-maintenance Health Monitor run catches problems before users find them.

2. **Always run `DB Structure Integrity Check` after storage or hardware changes.** It validates control files, datafile headers, and redo log consistency—the structural foundation everything else depends on.

3. **Schedule weekly runs and alert on FAILURE findings.** Automate via `DBMS_SCHEDULER` and query `V$HM_FINDING` for failures as part of your daily DBA health check script.

4. **Use Segment Advisor before SHRINK or MOVE operations.** It identifies which segments have the most reclaimable space, helping you prioritize maintenance work and estimate impact.

5. **Consult the Buffer Cache and Shared Pool advisors before resizing SGA.** These advisors model the actual workload—they show diminishing returns and help you avoid over-allocating memory that could cause swapping.

6. **Store Health Monitor run names with timestamps.** Consistent naming like `CHECK_TYPE_YYYYMMDD_HH24MISS` makes it easy to query historical runs and detect if check results have changed over time.

7. **Integrate advisor findings into your change management workflow.** SQL Tuning Advisor profiles and SQL Plan Baselines should be tested in non-production before being accepted in production—even though Oracle's recommendations are generally reliable.

---

## Common Mistakes and How to Avoid Them

**Mistake: Running Health Monitor checks during peak hours.**
Checks like Dictionary Integrity can be resource-intensive, acquiring internal locks and performing extensive reads. Schedule them during maintenance windows or low-traffic periods.

**Mistake: Not reviewing recommendations after a check finds failures.**
Finding a failure and not following up on the recommendations is worse than not running the check at all—it creates a false sense of security. Always act on FAILURE findings promptly.

**Mistake: Accepting SQL Tuning Advisor profiles without testing.**
SQL profiles change execution plans. Although the advisor uses comprehensive analysis, always test in a non-production environment first, particularly for complex OLTP queries where plan stability is critical.

**Mistake: Ignoring ADVISORY-type findings.**
`ADVISORY` findings are not failures, but they often indicate early warning signs—segments approaching threshold sizes, dictionary inconsistencies that have not yet caused errors, etc. Review them during weekly DBA checks.

**Mistake: Running Segment Advisor on SYS/SYSTEM schemas.**
These schemas contain internal Oracle objects that should not be shrunk or moved without Oracle Support guidance. Filter them out of Segment Advisor tasks.

**Mistake: Over-relying on Memory Advisor estimates on mixed workload databases.**
The advisors model the current workload. If your database has significant workload variation (e.g., batch at night, OLTP during the day), the advisor snapshot may not represent the workload you actually need to optimize for. Run advisors during representative peak periods.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c Administrator's Guide — Monitoring Database Operations](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/monitoring-database-operations.html)
- [Oracle Database 19c PL/SQL Packages Reference — DBMS_HM](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_HM.html)
- [Oracle Database 19c PL/SQL Packages Reference — DBMS_SQLTUNE](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SQLTUNE.html)
- [Oracle Database 19c Reference — V$HM_CHECK](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-HM_CHECK.html)
- [Oracle Database 19c Reference — V$SGA_TARGET_ADVICE](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SGA_TARGET_ADVICE.html)
