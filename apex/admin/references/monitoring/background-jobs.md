# APEX Background Job Monitoring

Use this reference for APEX background processing, automations, scheduled work, and `APEX_APPL_JOB_LOG`.

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
          'APEX_APPL_JOB_LOG',
          'APEX_APPL_AUTOMATIONS',
          'APEX_APPLICATIONS')
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
          'APEX_APPL_JOB_LOG',
          'APEX_APPL_AUTOMATIONS',
          'APEX_APPLICATIONS')
ORDER BY table_name,
         column_id;
```

If `APEX_APPL_JOB_LOG` is missing, use APEX Builder automation/task reports, application debug logs, application-specific job tables, and database scheduler views. Do not query internal APEX repository tables as a workaround.

## Recent APEX Job Failures

Adapt column names to the installed view.

```sql
SELECT workspace,
       application_id,
       application_name,
       job_name,
       status,
       started_on,
       finished_on,
       run_duration,
       error_code,
       SUBSTR(error_message, 1, 300) AS sample_error
FROM apex_appl_job_log
WHERE started_on >= SYSTIMESTAMP - INTERVAL '1' DAY
  AND status <> 'SUCCESS'
ORDER BY started_on DESC
FETCH FIRST 50 ROWS ONLY;
```

## Scheduler Mapping

Use APEX job name, application ID, parsing schema, and run timestamp to map APEX symptoms to `DBA_SCHEDULER_JOB_RUN_DETAILS`. Treat this as correlation until confirmed with job action, comments, module/action, or application code.

Do not blindly call `DBMS_SCHEDULER.RUN_JOB`, `STOP_JOB`, `DISABLE`, `ENABLE`, or `DROP_JOB`. Show affected job, state, recent runs, and likely impact first; ask for confirmation before changing job state.

## DB Skill Usage

DB skill in use: `db/features/dbms-scheduler.md` for generic `DBMS_SCHEDULER` job design, attributes, logging levels, `max_failures`, `max_run_duration`, job classes, and operational management. The APEX monitoring skill is being used for APEX application, workspace, automation, and job-log context.

After this handoff, use the DB skill's required connection/user for live `DBMS_SCHEDULER` inspection or job-state changes. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.
