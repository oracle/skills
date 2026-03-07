# Oracle DBMS_SCHEDULER

## Overview

`DBMS_SCHEDULER` is Oracle's enterprise job scheduling framework, introduced in Oracle 10g to replace the older `DBMS_JOB` package. It provides a rich feature set for scheduling PL/SQL code, stored procedures, executables, and scripts — either on a time-based calendar expression, in response to external events, or as part of dependency chains.

Key advantages over `DBMS_JOB`:
- Named, visible objects (queryable from `DBA_SCHEDULER_*` views)
- Calendar-based recurrence expressions (cron-like but more powerful)
- Job classes for resource management and logging control
- Windows and window groups for maintenance-period scheduling
- Job chains for workflow orchestration with dependencies
- Event-based triggering (queue events, file arrival, custom events)
- External jobs running OS executables
- Built-in email/alert notification framework

---

## Core Object Hierarchy

```
SCHEDULES         — reusable recurrence definitions
JOB CLASSES       — group jobs for resource/logging policy
WINDOWS           — time windows that activate resource plans
WINDOW GROUPS     — collections of windows
PROGRAMS          — reusable action definitions (what to run)
JOBS              — the scheduled unit; references a program + schedule
CHAINS            — dependency graphs of job steps
```

---

## Schedules

A **schedule** defines *when* something runs. It can be referenced by multiple jobs, avoiding repetition.

```sql
-- Simple daily schedule at 2:00 AM
BEGIN
    DBMS_SCHEDULER.CREATE_SCHEDULE(
        schedule_name   => 'DAILY_2AM',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=DAILY;BYHOUR=2;BYMINUTE=0;BYSECOND=0',
        end_date        => NULL,                 -- NULL = run forever
        comments        => 'Runs every day at 02:00 server time'
    );
END;
/

-- Weekday business hours — every 15 minutes, Mon-Fri, 8 AM to 6 PM
BEGIN
    DBMS_SCHEDULER.CREATE_SCHEDULE(
        schedule_name   => 'WEEKDAY_BUSINESS_HOURS_15MIN',
        repeat_interval => 'FREQ=MINUTELY;INTERVAL=15;BYDAY=MON,TUE,WED,THU,FRI;BYHOUR=8,9,10,11,12,13,14,15,16,17',
        comments        => 'Every 15 minutes on weekdays during business hours'
    );
END;
/

-- Last day of every month
BEGIN
    DBMS_SCHEDULER.CREATE_SCHEDULE(
        schedule_name   => 'MONTHLY_LAST_DAY',
        repeat_interval => 'FREQ=MONTHLY;BYMONTHDAY=-1;BYHOUR=23;BYMINUTE=0;BYSECOND=0',
        comments        => 'Last day of month at 23:00'
    );
END;
/

-- Every quarter (1st of Jan, Apr, Jul, Oct)
BEGIN
    DBMS_SCHEDULER.CREATE_SCHEDULE(
        schedule_name   => 'QUARTERLY',
        repeat_interval => 'FREQ=YEARLY;BYMONTH=1,4,7,10;BYMONTHDAY=1;BYHOUR=6;BYMINUTE=0;BYSECOND=0',
        comments        => 'Quarterly on the 1st at 06:00'
    );
END;
/
```

### Calendar Expression Quick Reference

| Expression | Meaning |
|---|---|
| `FREQ=SECONDLY;INTERVAL=30` | Every 30 seconds |
| `FREQ=MINUTELY;INTERVAL=5` | Every 5 minutes |
| `FREQ=HOURLY` | Every hour |
| `FREQ=DAILY;BYHOUR=0` | Daily at midnight |
| `FREQ=WEEKLY;BYDAY=MON` | Every Monday |
| `FREQ=MONTHLY;BYMONTHDAY=1` | 1st of every month |
| `FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=31` | December 31 every year |
| `FREQ=DAILY;BYDAY=MON,TUE,WED,THU,FRI` | Every weekday |

---

## Programs

A **program** encapsulates the action to be executed. Defining programs separately from jobs allows reuse.

```sql
-- PL/SQL stored procedure program
BEGIN
    DBMS_SCHEDULER.CREATE_PROGRAM(
        program_name   => 'REFRESH_SUMMARY_TABLES_PROG',
        program_type   => 'STORED_PROCEDURE',
        program_action => 'etl_pkg.refresh_summary_tables',
        number_of_arguments => 0,
        enabled        => TRUE,
        comments       => 'Calls the ETL refresh procedure'
    );
END;
/

-- PL/SQL block program with an argument
BEGIN
    DBMS_SCHEDULER.CREATE_PROGRAM(
        program_name        => 'ARCHIVE_OLD_RECORDS_PROG',
        program_type        => 'PLSQL_BLOCK',
        program_action      => 'BEGIN archive_pkg.run(:threshold_days); END;',
        number_of_arguments => 1,
        enabled             => FALSE  -- enable after defining arguments
    );

    DBMS_SCHEDULER.DEFINE_PROGRAM_ARGUMENT(
        program_name      => 'ARCHIVE_OLD_RECORDS_PROG',
        argument_position => 1,
        argument_name     => 'threshold_days',
        argument_type     => 'NUMBER',
        default_value     => '90'
    );

    DBMS_SCHEDULER.ENABLE(name => 'ARCHIVE_OLD_RECORDS_PROG');
END;
/

-- External executable program (runs an OS script)
BEGIN
    DBMS_SCHEDULER.CREATE_PROGRAM(
        program_name   => 'BACKUP_SCRIPT_PROG',
        program_type   => 'EXECUTABLE',
        program_action => '/opt/oracle/scripts/run_backup.sh',
        enabled        => TRUE
    );
END;
/
```

---

## Jobs

A **job** ties together a program (or inline action) with a schedule (or inline schedule).

### Simple Inline Job

```sql
-- Quickest form: inline action and inline schedule
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name        => 'NIGHTLY_STATS_GATHER',
        job_type        => 'PLSQL_BLOCK',
        job_action      => 'BEGIN DBMS_STATS.GATHER_SCHEMA_STATS(''APPSCHEMA''); END;',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=DAILY;BYHOUR=1;BYMINUTE=0;BYSECOND=0',
        end_date        => NULL,
        enabled         => TRUE,
        auto_drop       => FALSE,  -- keep job definition after it runs
        comments        => 'Gather schema statistics nightly at 1 AM'
    );
END;
/
```

### Job Referencing a Named Program and Schedule

```sql
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name      => 'REFRESH_SUMMARY_JOB',
        program_name  => 'REFRESH_SUMMARY_TABLES_PROG',
        schedule_name => 'DAILY_2AM',
        job_class     => 'BATCH_JOB_CLASS',   -- see Job Classes section
        enabled       => TRUE,
        auto_drop     => FALSE,
        comments      => 'Nightly ETL refresh'
    );
END;
/
```

### One-Time Job

```sql
-- Run once at a specific future time
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name   => 'ONE_TIME_MIGRATION',
        job_type   => 'STORED_PROCEDURE',
        job_action => 'migration_pkg.run_v2_migration',
        start_date => TO_TIMESTAMP_TZ('2026-03-15 03:00:00 -05:00', 'YYYY-MM-DD HH24:MI:SS TZH:TZM'),
        enabled    => TRUE,
        auto_drop  => TRUE   -- remove job definition after it completes
    );
END;
/
```

### Managing Jobs

```sql
-- Enable / disable
EXEC DBMS_SCHEDULER.ENABLE('NIGHTLY_STATS_GATHER');
EXEC DBMS_SCHEDULER.DISABLE('NIGHTLY_STATS_GATHER');

-- Run immediately (ad-hoc execution, does not reset next_run_date)
EXEC DBMS_SCHEDULER.RUN_JOB('NIGHTLY_STATS_GATHER');

-- Stop a running job
EXEC DBMS_SCHEDULER.STOP_JOB('NIGHTLY_STATS_GATHER', force => FALSE);

-- Drop a job
EXEC DBMS_SCHEDULER.DROP_JOB('ONE_TIME_MIGRATION');

-- Set a job attribute after creation
BEGIN
    DBMS_SCHEDULER.SET_ATTRIBUTE(
        name      => 'NIGHTLY_STATS_GATHER',
        attribute => 'max_failures',
        value     => 3   -- disable job after 3 consecutive failures
    );
    DBMS_SCHEDULER.SET_ATTRIBUTE(
        name      => 'NIGHTLY_STATS_GATHER',
        attribute => 'max_run_duration',
        value     => INTERVAL '2' HOUR  -- alert/kill if runs > 2 hours
    );
END;
/
```

---

## Job Classes

Job classes control **resource consumer group membership** and **logging behavior** for a group of jobs.

```sql
BEGIN
    DBMS_SCHEDULER.CREATE_JOB_CLASS(
        job_class_name          => 'BATCH_JOB_CLASS',
        resource_consumer_group => 'BATCH_GROUP',   -- maps to Resource Manager group
        service                 => NULL,             -- run on any instance in RAC
        logging_level           => DBMS_SCHEDULER.LOGGING_FULL,
        log_history             => 30,               -- keep log entries for 30 days
        comments                => 'Long-running batch jobs with full logging'
    );

    DBMS_SCHEDULER.CREATE_JOB_CLASS(
        job_class_name => 'LIGHT_JOB_CLASS',
        logging_level  => DBMS_SCHEDULER.LOGGING_RUNS,  -- log run records only
        log_history    => 7,
        comments       => 'Short, frequent jobs — minimal logging'
    );
END;
/
```

Logging levels:
- `LOGGING_OFF` — no logging
- `LOGGING_FAILED_RUNS` — only log failed runs
- `LOGGING_RUNS` — log every run (start + end)
- `LOGGING_FULL` — log runs plus all operations (create, alter, drop)

---

## Windows

A **window** is a time period during which a specific Resource Manager plan is active. Jobs can be assigned to a window, running only when the window is open.

```sql
-- Maintenance window: weeknights 10 PM to 6 AM
BEGIN
    DBMS_SCHEDULER.CREATE_WINDOW(
        window_name     => 'WEEKNIGHT_MAINTENANCE',
        resource_plan   => 'MAINTENANCE_PLAN',
        repeat_interval => 'FREQ=WEEKLY;BYDAY=MON,TUE,WED,THU,FRI;BYHOUR=22;BYMINUTE=0;BYSECOND=0',
        duration        => INTERVAL '8' HOUR,
        window_priority => LOW,
        comments        => 'Weeknight maintenance window 22:00-06:00'
    );
END;
/

-- Weekend window
BEGIN
    DBMS_SCHEDULER.CREATE_WINDOW(
        window_name     => 'WEEKEND_MAINTENANCE',
        resource_plan   => 'MAINTENANCE_PLAN',
        repeat_interval => 'FREQ=WEEKLY;BYDAY=SAT;BYHOUR=6;BYMINUTE=0;BYSECOND=0',
        duration        => INTERVAL '48' HOUR,
        window_priority => HIGH
    );
END;
/

-- Group windows for convenience
BEGIN
    DBMS_SCHEDULER.CREATE_WINDOW_GROUP(
        group_name => 'ALL_MAINTENANCE_WINDOWS',
        window_list => 'WEEKNIGHT_MAINTENANCE,WEEKEND_MAINTENANCE'
    );
END;
/
```

---

## Job Chains (Dependency Workflows)

Chains allow jobs to run in sequence or parallel with conditional branching based on prior step results. This is Oracle Scheduler's workflow engine.

```sql
-- Step 1: Create the chain
BEGIN
    DBMS_SCHEDULER.CREATE_CHAIN(
        chain_name => 'ETL_PIPELINE_CHAIN',
        comments   => 'Extract -> Transform -> Load with error notification'
    );
END;
/

-- Step 2: Define chain steps (each step references a program)
BEGIN
    DBMS_SCHEDULER.DEFINE_CHAIN_STEP(
        chain_name   => 'ETL_PIPELINE_CHAIN',
        step_name    => 'EXTRACT',
        program_name => 'EXTRACT_DATA_PROG'
    );

    DBMS_SCHEDULER.DEFINE_CHAIN_STEP(
        chain_name   => 'ETL_PIPELINE_CHAIN',
        step_name    => 'TRANSFORM',
        program_name => 'TRANSFORM_DATA_PROG'
    );

    DBMS_SCHEDULER.DEFINE_CHAIN_STEP(
        chain_name   => 'ETL_PIPELINE_CHAIN',
        step_name    => 'LOAD',
        program_name => 'LOAD_DATA_PROG'
    );

    DBMS_SCHEDULER.DEFINE_CHAIN_STEP(
        chain_name   => 'ETL_PIPELINE_CHAIN',
        step_name    => 'NOTIFY_FAILURE',
        program_name => 'SEND_FAILURE_EMAIL_PROG'
    );
END;
/

-- Step 3: Define rules (transitions between steps)
BEGIN
    -- Start EXTRACT when chain starts
    DBMS_SCHEDULER.DEFINE_CHAIN_RULE(
        chain_name => 'ETL_PIPELINE_CHAIN',
        rule_name  => 'START_EXTRACT',
        condition  => 'TRUE',
        action     => 'START EXTRACT',
        comments   => 'Always start with extraction'
    );

    -- TRANSFORM runs only if EXTRACT succeeded
    DBMS_SCHEDULER.DEFINE_CHAIN_RULE(
        chain_name => 'ETL_PIPELINE_CHAIN',
        rule_name  => 'EXTRACT_SUCCESS',
        condition  => 'EXTRACT COMPLETED SUCCESSFULLY',
        action     => 'START TRANSFORM'
    );

    -- LOAD runs only if TRANSFORM succeeded
    DBMS_SCHEDULER.DEFINE_CHAIN_RULE(
        chain_name => 'ETL_PIPELINE_CHAIN',
        rule_name  => 'TRANSFORM_SUCCESS',
        condition  => 'TRANSFORM COMPLETED SUCCESSFULLY',
        action     => 'START LOAD'
    );

    -- If EXTRACT or TRANSFORM fails, send notification
    DBMS_SCHEDULER.DEFINE_CHAIN_RULE(
        chain_name => 'ETL_PIPELINE_CHAIN',
        rule_name  => 'ANY_FAILURE',
        condition  => 'EXTRACT FAILED OR TRANSFORM FAILED OR LOAD FAILED',
        action     => 'START NOTIFY_FAILURE'
    );

    -- End chain after LOAD success or after notification
    DBMS_SCHEDULER.DEFINE_CHAIN_RULE(
        chain_name => 'ETL_PIPELINE_CHAIN',
        rule_name  => 'END_SUCCESS',
        condition  => 'LOAD COMPLETED SUCCESSFULLY',
        action     => 'END'
    );

    DBMS_SCHEDULER.DEFINE_CHAIN_RULE(
        chain_name => 'ETL_PIPELINE_CHAIN',
        rule_name  => 'END_FAILURE',
        condition  => 'NOTIFY_FAILURE COMPLETED',
        action     => 'END'
    );
END;
/

-- Step 4: Enable the chain
EXEC DBMS_SCHEDULER.ENABLE('ETL_PIPELINE_CHAIN');

-- Step 5: Schedule a job to run the chain
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name      => 'NIGHTLY_ETL_JOB',
        job_type      => 'CHAIN',
        job_action    => 'ETL_PIPELINE_CHAIN',
        schedule_name => 'DAILY_2AM',
        enabled       => TRUE
    );
END;
/
```

---

## Event-Based Scheduling

Jobs can be triggered by Oracle AQ events instead of (or in addition to) time-based schedules.

```sql
-- Create an event queue for job triggers
BEGIN
    DBMS_AQADM.CREATE_QUEUE_TABLE(
        queue_table        => 'scheduler_event_tab',
        queue_payload_type => 'SYS.SCHEDULER$_EVENT_INFO',
        multiple_consumers => TRUE
    );
    DBMS_AQADM.CREATE_QUEUE(
        queue_name  => 'file_arrival_events_q',
        queue_table => 'scheduler_event_tab'
    );
    DBMS_AQADM.START_QUEUE(queue_name => 'file_arrival_events_q');
END;
/

-- Create an event-triggered job
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name           => 'PROCESS_FILE_ON_ARRIVAL',
        program_name       => 'PROCESS_FILE_PROG',
        event_condition    => 'tab.user_data.event_name = ''FILE_ARRIVED''',
        queue_spec         => 'file_arrival_events_q',
        enabled            => TRUE,
        auto_drop          => FALSE
    );
END;
/
```

---

## Logging and Monitoring

### Key Views

```sql
-- Current job status and next scheduled run
SELECT job_name,
       state,
       enabled,
       run_count,
       failure_count,
       last_start_date,
       last_run_duration,
       next_run_date
FROM   dba_scheduler_jobs
WHERE  owner = 'APPSCHEMA'
ORDER  BY next_run_date;

-- Detailed run history with errors
SELECT job_name,
       log_date,
       status,
       error#        AS error_code,
       actual_start_date,
       run_duration,
       cpu_used
FROM   dba_scheduler_job_run_details
WHERE  owner = 'APPSCHEMA'
  AND  log_date > SYSDATE - 7
ORDER  BY log_date DESC;

-- All scheduler log entries (create, alter, enable, run)
SELECT log_date, owner, job_name, operation, status, additional_info
FROM   dba_scheduler_job_log
WHERE  log_date > SYSDATE - 1
ORDER  BY log_date DESC;

-- Currently running jobs
SELECT job_name, session_id, running_instance, elapsed_time, cpu_used
FROM   dba_scheduler_running_jobs;

-- Chain step history
SELECT job_name, chain_name, step_name, status, start_date, end_date, error_code
FROM   dba_scheduler_job_run_details
WHERE  job_name = 'NIGHTLY_ETL_JOB'
ORDER  BY start_date DESC;

-- Window history
SELECT window_name, actual_start_date, actual_duration, completed
FROM   dba_scheduler_window_log
ORDER  BY actual_start_date DESC;
```

### Purging Old Log Entries

```sql
-- Purge logs older than 30 days for a specific job
BEGIN
    DBMS_SCHEDULER.PURGE_LOG(
        log_history => 30,
        which_log   => 'JOB_AND_WINDOW_LOG',
        job_name    => 'APPSCHEMA.NIGHTLY_STATS_GATHER'
    );
END;
/

-- Global purge for all jobs
BEGIN
    DBMS_SCHEDULER.PURGE_LOG(log_history => 30);
END;
/
```

---

## Error Handling

```sql
-- Set max_failures to auto-disable after repeated failures
BEGIN
    DBMS_SCHEDULER.SET_ATTRIBUTE('NIGHTLY_ETL_JOB', 'max_failures', 3);
END;
/

-- Email notification on job failure using DBMS_SCHEDULER notifications
BEGIN
    DBMS_SCHEDULER.ADD_EVENT_OPERATION(
        rule_set_name => NULL,
        subscription_name => 'JOB_FAILURE_ALERT',
        queue_name    => 'SYS.SCHEDULER$_SCHED_STAT_QUEUE'
    );
END;
/

-- PL/SQL error handling within a job action
CREATE OR REPLACE PROCEDURE safe_etl_job AS
BEGIN
    etl_pkg.run_full_load;
EXCEPTION
    WHEN OTHERS THEN
        -- Log to an application error table
        INSERT INTO etl_job_errors (job_name, error_time, error_msg, error_stack)
        VALUES ('NIGHTLY_ETL', SYSTIMESTAMP, SQLERRM, DBMS_UTILITY.FORMAT_ERROR_STACK);
        COMMIT;
        -- Re-raise so DBMS_SCHEDULER records the failure
        RAISE;
END safe_etl_job;
/
```

---

## External Jobs

External jobs run OS executables under a credential. The Oracle Scheduler Agent (`extjob` / `schagent`) must be running on the target host.

```sql
-- Create a database credential for the OS user
BEGIN
    DBMS_SCHEDULER.CREATE_CREDENTIAL(
        credential_name => 'ORACLE_OS_CRED',
        username        => 'oracle',
        password        => 'os_password_here'
    );
END;
/

-- Create an external job
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name      => 'WEEKLY_EXPORT_JOB',
        job_type      => 'EXECUTABLE',
        job_action    => '/opt/oracle/scripts/weekly_export.sh',
        credential_name => 'ORACLE_OS_CRED',
        destination   => 'LOCAL',   -- or a remote host name registered with DBMS_SCHEDULER
        schedule_name => 'WEEKLY_SUNDAY',
        enabled       => TRUE
    );
END;
/
```

---

## Best Practices

- **Name jobs clearly and consistently.** Use a naming convention like `<SCHEMA>_<PURPOSE>_<FREQUENCY>_JOB` (e.g., `HR_PURGE_OLD_LOGS_DAILY_JOB`). Scheduler objects are visible in DBA views — good names pay dividends during incident response.
- **Always set `auto_drop => FALSE`** for recurring jobs. The default `TRUE` drops the job after the first run, which is rarely what you want for scheduled work.
- **Use named schedules and programs** instead of inlining everything in the job. This promotes reuse and makes bulk rescheduling trivial: change the schedule object, and all jobs using it update automatically.
- **Set `max_run_duration`** for jobs with SLA requirements. If a job runs longer than expected, it likely indicates a problem and should alert the team.
- **Use job classes** to assign jobs to appropriate Resource Manager consumer groups. Batch jobs should not compete with OLTP on CPU resources.
- **Test calendar expressions** with `DBMS_SCHEDULER.EVALUATE_CALENDAR_STRING` before creating jobs.

```sql
-- Validate a calendar expression and see the next 5 scheduled times
DECLARE
    next_run TIMESTAMP WITH TIME ZONE := SYSTIMESTAMP;
BEGIN
    FOR i IN 1..5 LOOP
        DBMS_SCHEDULER.EVALUATE_CALENDAR_STRING(
            calendar_string   => 'FREQ=WEEKLY;BYDAY=MON,WED,FRI;BYHOUR=8;BYMINUTE=30',
            start_date        => SYSTIMESTAMP,
            return_date_after => next_run,
            next_run_date     => next_run
        );
        DBMS_OUTPUT.PUT_LINE('Run ' || i || ': ' || TO_CHAR(next_run, 'YYYY-MM-DD HH24:MI:SS TZH:TZM'));
    END LOOP;
END;
/
```

---

## Common Mistakes and How to Avoid Them

**Mistake 1: Using `DBMS_JOB` in new code**
`DBMS_JOB` still works but is a legacy interface with no support for most advanced features. Always use `DBMS_SCHEDULER` in new development. Migrate existing `DBMS_JOB` entries using `DBMS_IJOB.JOB_TO_SCHEDULER_JOB` (internal) or by recreating them manually.

**Mistake 2: Not specifying time zones in `start_date`**
Calendar expressions are evaluated relative to the time zone in `start_date`. If you create a job with a bare `SYSDATE` (no time zone), behavior during daylight saving transitions is undefined. Always use `SYSTIMESTAMP` or a `TIMESTAMP WITH TIME ZONE` literal with an explicit offset.

**Mistake 3: Setting `enabled => TRUE` before fully configuring the job**
If you enable a job whose `start_date` is in the past and whose `repeat_interval` calculates a start in the past, it may fire immediately upon enabling. Create jobs in a disabled state, complete configuration, then explicitly call `DBMS_SCHEDULER.ENABLE`.

**Mistake 4: Forgetting to enable the chain before scheduling it**
A job of type `CHAIN` will fail at runtime if the referenced chain is not enabled. Enable the chain object itself (`DBMS_SCHEDULER.ENABLE('MY_CHAIN')`) separately from enabling the job.

**Mistake 5: Assuming the log is always complete**
The `logging_level` on the job class controls what is recorded. A class with `LOGGING_FAILED_RUNS` will not show successful runs in `DBA_SCHEDULER_JOB_RUN_DETAILS`. If a job appears to never run, check both its `state` column and the logging level of its class.

**Mistake 6: Running privileged operations in jobs owned by application schemas**
Jobs run with the privileges of their owner schema. A job owned by `APPSCHEMA` cannot call `DBMS_STATS.GATHER_DATABASE_STATS` unless `APPSCHEMA` has the `ANALYZE ANY` privilege. Create DBA-owned jobs for operations requiring elevated privileges, or grant only the minimum necessary privilege to the application schema.

---

## Sources

- [DBMS_SCHEDULER — Oracle Database PL/SQL Packages and Types Reference 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SCHEDULER.html)
- [Oracle Database Administrator's Guide: Scheduling Jobs with Oracle Scheduler 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/scheduling-jobs-with-oracle-scheduler.html)
- [Oracle Scheduler Concepts — Oracle Database 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/oracle-scheduler-concepts.html)
