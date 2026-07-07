# APEX Background Job Monitoring

Use this reference for APEX background processing, automations, scheduled work, `APEX_AUTOMATION_LOG`, `APEX_AUTOMATION_MSG_LOG`, and any installed public APEX scheduler/job views discovered in the target environment.

Version check: use `ALL_OBJECTS` and `ALL_TAB_COLUMNS` before assuming APEX job-log or automation view availability.

Use APEX Diff as a convenience helper to compare background-job, automation,
and public APEX API availability across releases before selecting standard
monitoring calls, including current releases such as APEX 26.1 when they are
listed there. Verify the target instance locally with `APEX_DICTIONARY`,
`ALL_OBJECTS`, `ALL_TAB_COLUMNS`, and `ALL_ARGUMENTS`:

```text
https://apexadb.oracle.com/ords/r/apexdiff/apex_diff/home
```

## Job Log Pre-Check

```sql
SELECT owner,
       object_name,
       object_type
FROM all_objects
WHERE object_name IN (
          'APEX_AUTOMATION_LOG',
          'APEX_AUTOMATION_MSG_LOG',
          'APEX_APPL_AUTOMATIONS',
          'APEX_APPLICATIONS')
   OR object_name LIKE 'APEX%SCHEDULER%JOB%'
ORDER BY object_name,
         owner;
```

```sql
SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name IN (
          'APEX_AUTOMATION_LOG',
          'APEX_AUTOMATION_MSG_LOG',
          'APEX_APPL_AUTOMATIONS',
          'APEX_APPLICATIONS')
   OR table_name LIKE 'APEX%SCHEDULER%JOB%'
ORDER BY table_name,
         column_id;
```

If automation log views are missing, use APEX Builder automation/task reports, application debug logs, application-specific job tables, and database scheduler views. Do not query internal APEX repository tables as a workaround.

## Recent APEX Job Failures

Adapt column names to the installed view.

```sql
SELECT workspace,
       application_id,
       automation_id,
       automation_static_id,
       automation_name,
       is_job,
       status,
       status_code,
       start_timestamp,
       end_timestamp,
       successful_row_count,
       error_row_count
FROM apex_automation_log
WHERE start_timestamp >= SYSTIMESTAMP - INTERVAL '1' DAY
  AND status_code <> 'SUCCESS'
ORDER BY start_timestamp DESC
FETCH FIRST 50 ROWS ONLY;
```

For a specific automation log entry, inspect `APEX_AUTOMATION_MSG_LOG` columns first, then collect only narrow message excerpts for the affected `AUTOMATION_LOG_ID`.

## Scheduler Mapping

Use APEX job name, application ID, parsing schema, and run timestamp to map APEX symptoms to `DBA_SCHEDULER_JOB_RUN_DETAILS`. Treat this as correlation until confirmed with job action, comments, module/action, or application code.

Do not blindly call `DBMS_SCHEDULER.RUN_JOB`, `STOP_JOB`, `DISABLE`, `ENABLE`, or `DROP_JOB`. Show affected job, state, recent runs, and likely impact first; ask for confirmation before changing job state.

## DB Skill Usage

DB skill in use: `db/features/dbms-scheduler.md` for generic `DBMS_SCHEDULER` job design, attributes, logging levels, `max_failures`, `max_run_duration`, job classes, and operational management. The APEX monitoring skill is being used for APEX application, workspace, automation, and job-log context.

After this handoff, use the DB skill's required connection/user for live `DBMS_SCHEDULER` inspection or job-state changes. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.
