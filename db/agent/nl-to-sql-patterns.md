# Natural Language to SQL Mapping Patterns

When users or AI agents describe what they want in natural language, the intent must be translated to Oracle SQL. This skill provides common NL phrasings, their SQL equivalents, and disambiguation notes for ambiguous cases.

## Performance and Diagnostics Questions

| Natural Language | Oracle SQL Pattern |
|---|---|
| "Show me the slowest queries" | `SELECT sql_text, elapsed_time/1e6 elapsed_sec FROM v$sql ORDER BY elapsed_time DESC FETCH FIRST 20 ROWS ONLY` |
| "What queries are running right now?" | `SELECT sql_text, status, seconds_in_wait FROM v$session s JOIN v$sql q ON s.sql_id = q.sql_id WHERE s.status = 'ACTIVE'` |
| "Which queries use the most CPU?" | `ORDER BY cpu_time DESC` on `v$sql` |
| "Top SQL by buffer gets (logical reads)" | `ORDER BY buffer_gets DESC` on `v$sql` |
| "What's waiting in the database?" | `SELECT event, count(*) FROM v$session WHERE wait_class != 'Idle' GROUP BY event ORDER BY 2 DESC` |

## Finding Data Patterns

| Natural Language | Oracle SQL Pattern |
|---|---|
| "Find duplicate records" | `SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1` |
| "Find records with no match in another table" | `SELECT * FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.id = a.id)` — or LEFT JOIN WHERE b.id IS NULL |
| "Most recent N records" | `ORDER BY created_date DESC FETCH FIRST :n ROWS ONLY` |
| "Records from the last 7 days" | `WHERE created_date >= SYSDATE - 7` |
| "Records from the last 30 days" | `WHERE created_date >= SYSDATE - 30` |
| "Records created this month" | `WHERE TRUNC(created_date, 'MM') = TRUNC(SYSDATE, 'MM')` |
| "Records created this year" | `WHERE TRUNC(created_date, 'YEAR') = TRUNC(SYSDATE, 'YEAR')` |
| "Top N by some metric" | `RANK() OVER (ORDER BY metric DESC)` or `FETCH FIRST N ROWS ONLY` |
| "Top N per group" | `RANK() OVER (PARTITION BY group_col ORDER BY metric DESC)` with outer `WHERE rnk <= N` |

## Aggregation and Counting

| Natural Language | Oracle SQL Pattern |
|---|---|
| "Count by category" | `SELECT category, COUNT(*) FROM t GROUP BY category ORDER BY COUNT(*) DESC` |
| "Sum / total by group" | `SELECT group_col, SUM(amount) FROM t GROUP BY group_col` |
| "Average per group" | `SELECT group_col, AVG(value) FROM t GROUP BY group_col` |
| "Running total" | `SUM(amount) OVER (ORDER BY date_col ROWS UNBOUNDED PRECEDING)` |
| "Percentage of total" | `amount / SUM(amount) OVER () * 100` |
| "Month-over-month change" | `LAG(amount) OVER (ORDER BY month)` with subtraction |

## Schema Introspection

| Natural Language | Oracle SQL Pattern |
|---|---|
| "Show all tables in a schema" | `SELECT table_name FROM all_tables WHERE owner = :schema ORDER BY table_name` |
| "What columns does this table have?" | `SELECT column_name, data_type, nullable FROM all_tab_columns WHERE owner = :schema AND table_name = :tbl ORDER BY column_id` |
| "Which indexes exist on this table?" | `SELECT index_name, uniqueness FROM all_indexes WHERE owner = :schema AND table_name = :tbl` |
| "Who has access to this table?" | `SELECT grantee, privilege, grantable FROM all_tab_privs WHERE owner = :schema AND table_name = :tbl` |
| "Show the table definition (DDL)" | `SELECT DBMS_METADATA.GET_DDL('TABLE', :tbl, :schema) FROM DUAL` |
| "What are the primary keys?" | `SELECT cols.column_name FROM all_constraints c JOIN all_cons_columns cols ON c.constraint_name = cols.constraint_name WHERE c.owner = :schema AND c.table_name = :tbl AND c.constraint_type = 'P'` |
| "Tables with no rows" | `SELECT table_name, num_rows FROM all_tables WHERE owner = :schema AND num_rows = 0` |

## User and Security Questions

| Natural Language | Oracle SQL Pattern |
|---|---|
| "What users exist?" | `SELECT username, account_status, created FROM dba_users ORDER BY username` |
| "What roles does this user have?" | `SELECT granted_role FROM dba_role_privs WHERE grantee = :user` |
| "What privileges does this user have?" | `SELECT privilege FROM dba_sys_privs WHERE grantee = :user` |
| "Which users have DBA role?" | `SELECT grantee FROM dba_role_privs WHERE granted_role = 'DBA'` |

## Space and Storage Questions

| Natural Language | Oracle SQL Pattern |
|---|---|
| "How big is this table?" | `SELECT blocks * 8 / 1024 AS size_mb FROM all_tables WHERE owner = :schema AND table_name = :tbl` — or query `dba_segments` |
| "Biggest tables in the database" | `SELECT owner, segment_name, bytes/1024/1024 mb FROM dba_segments WHERE segment_type = 'TABLE' ORDER BY bytes DESC FETCH FIRST 20 ROWS ONLY` |
| "How much free space is in each tablespace?" | `SELECT tablespace_name, SUM(bytes)/1024/1024 AS free_mb FROM dba_free_space GROUP BY tablespace_name` |

## Date and Time Patterns

```sql
-- "Last N days"
WHERE col >= SYSDATE - :n

-- "Between two dates"
WHERE col BETWEEN TO_DATE(:start, 'YYYY-MM-DD') AND TO_DATE(:end, 'YYYY-MM-DD')

-- "This week" (Monday to Sunday)
WHERE col >= TRUNC(SYSDATE, 'IW')
  AND col <  TRUNC(SYSDATE, 'IW') + 7

-- "Last month"
WHERE col >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1)
  AND col <  TRUNC(SYSDATE, 'MM')

-- "Year to date"
WHERE col >= TRUNC(SYSDATE, 'YEAR')
```

## Disambiguation Notes

Some NL phrasings are inherently ambiguous. Always clarify before generating SQL:

| Ambiguous Phrase | What to Ask |
|---|---|
| "Show me employees" | Which schema/table? All columns or specific ones? Active only? |
| "Recent orders" | How recent — today, this week, last 30 days? |
| "Big tables" | Big by row count or by storage size? Threshold? |
| "Slow queries" | Slow by total elapsed time, average elapsed time, or CPU? Top N? |
| "Users with access" | System privileges, object privileges, or role grants? To which object? |
| "Delete old records" | Which table? What defines "old"? Hard delete or soft (status flag)? |

## Locked Objects and Blocking Sessions

"who is locking what", "find blocked sessions", "what's holding a lock", "lock contention"

```sql
-- Find blocking/blocked sessions
SELECT blocker.sid AS blocker_sid,
       blocker.username AS blocker_user,
       blocker.module,
       blocked.sid AS blocked_sid,
       blocked.username AS blocked_user,
       blocked.seconds_in_wait,
       blocked.event,
       obj.object_name
FROM   v$session blocked
JOIN   v$session blocker ON blocked.blocking_session = blocker.sid
LEFT   JOIN v$lock lk    ON lk.sid = blocker.sid AND lk.type = 'TM' AND lk.lmode > 0
LEFT   JOIN dba_objects obj ON obj.object_id = lk.id1
WHERE  blocked.blocking_session IS NOT NULL
ORDER  BY blocked.seconds_in_wait DESC;
```

## Long-Running Queries

"find slow queries", "what queries are running right now", "long running SQL", "queries taking more than N minutes"

```sql
-- Currently executing SQL (> 60 seconds)
SELECT s.sid, s.serial#, s.username, s.module,
       s.sql_id, s.seconds_in_wait,
       ROUND(s.last_call_et / 60, 1) AS running_minutes,
       sq.sql_text
FROM   v$session s
JOIN   v$sql sq ON s.sql_id = sq.sql_id AND s.sql_child_number = sq.child_number
WHERE  s.status       = 'ACTIVE'
  AND  s.last_call_et > 60   -- running more than 60 seconds
  AND  s.username     IS NOT NULL
ORDER  BY s.last_call_et DESC;

-- Top SQL from AWR by elapsed time (requires Diagnostics Pack license)
SELECT sql_id,
       ROUND(elapsed_time_delta / 1e6 / executions_delta, 2) AS avg_sec,
       executions_delta AS executions,
       SUBSTR(sql_text, 1, 100) AS sql_preview
FROM   dba_hist_sqlstat s
JOIN   dba_hist_sqltext t USING (sql_id)
WHERE  snap_id IN (
  SELECT snap_id FROM dba_hist_snapshot
  WHERE begin_interval_time > SYSDATE - 1  -- last 24 hours
)
  AND  executions_delta > 0
ORDER  BY elapsed_time_delta DESC
FETCH  FIRST 20 ROWS ONLY;
```

## Kill Session

"kill a session", "disconnect user", "terminate session SID N"

```sql
-- Find the SID and SERIAL# first
SELECT sid, serial#, username, status, module, last_call_et
FROM   v$session
WHERE  username = :username  -- or filter by SID
  AND  status   = 'ACTIVE'
ORDER  BY last_call_et DESC;

-- Kill the session (requires ALTER SYSTEM privilege)
-- IMPORTANT: always confirm with user before killing; this is irreversible
ALTER SYSTEM KILL SESSION ':sid,:serial#' IMMEDIATE;
-- Use IMMEDIATE to force; without it, Oracle waits for the session to yield

-- If kill hangs (OS process still running), escalate to DBA for OS-level kill
-- Check if session is still present after killing:
SELECT COUNT(*) FROM v$session WHERE sid = :sid AND serial# = :serial_num;
```

Agent rule: Never execute ALTER SYSTEM KILL SESSION without explicit user confirmation. Validate both SID and SERIAL# before constructing the command.

## Failed Scheduler Jobs

"find failed jobs", "which scheduler jobs failed", "job errors", "why did job X fail"

```sql
-- Recent job failures
SELECT job_name, log_date, status, error#, additional_info
FROM   all_scheduler_job_log
WHERE  owner   = :schema
  AND  status  = 'FAILED'
  AND  log_date > SYSTIMESTAMP - INTERVAL '7' DAY
ORDER  BY log_date DESC;

-- Detail for a specific job's last run
SELECT j.job_name, j.enabled, j.state,
       j.last_start_date, j.last_run_duration,
       j.failure_count, j.max_failures,
       j.repeat_interval, j.next_run_date
FROM   all_scheduler_jobs j
WHERE  j.owner    = :schema
  AND  j.job_name = :job_name;

-- Full run history for a job
SELECT log_date, status, actual_start_date, run_duration, error#, additional_info
FROM   all_scheduler_job_run_details
WHERE  owner    = :schema
  AND  job_name = :job_name
ORDER  BY log_date DESC
FETCH  FIRST 10 ROWS ONLY;
```

## AWR Top SQL

Requires Diagnostics Pack license. "top SQL by CPU", "what SQL is using the most resources", "worst performing queries historically", "AWR report"

```sql
-- Top 10 SQL by CPU from last AWR snapshot window
SELECT sql_id,
       ROUND(cpu_time_delta / 1e6, 1)    AS cpu_secs,
       ROUND(elapsed_time_delta / 1e6, 1) AS elapsed_secs,
       executions_delta                   AS executions,
       ROUND(buffer_gets_delta / NULLIF(executions_delta, 0), 0) AS gets_per_exec,
       SUBSTR(sql_text, 1, 120)           AS sql_preview
FROM   dba_hist_sqlstat s
JOIN   dba_hist_sqltext t USING (sql_id)
WHERE  snap_id IN (
  SELECT snap_id FROM dba_hist_snapshot
  WHERE  begin_interval_time > SYSDATE - 1
)
  AND  executions_delta > 0
ORDER  BY cpu_time_delta DESC
FETCH  FIRST 10 ROWS ONLY;
-- Note: dba_hist_* views require the Oracle Diagnostics Pack license
```

## Tables Without Primary Keys

"find tables with no primary key", "tables missing PKs", "unkeyed tables"

```sql
SELECT t.table_name, t.num_rows
FROM   all_tables t
WHERE  t.owner = :schema
  AND  NOT EXISTS (
    SELECT 1 FROM all_constraints c
    WHERE  c.owner        = t.owner
      AND  c.table_name   = t.table_name
      AND  c.constraint_type = 'P'
  )
ORDER  BY t.table_name;
```

## Unused Indexes

"find unused indexes", "which indexes are never used", "redundant indexes"

```sql
-- Indexes not used since monitoring was enabled (requires ALTER INDEX ... MONITORING USAGE)
SELECT i.owner, i.index_name, i.table_name, i.index_type,
       u.used, u.monitoring, u.start_monitoring, u.end_monitoring
FROM   v$object_usage u
JOIN   all_indexes i ON u.name = i.index_name AND i.owner = :schema
WHERE  u.used = 'NO'
ORDER  BY i.table_name, i.index_name;

-- Start monitoring an index
ALTER INDEX :index_name MONITORING USAGE;

-- Candidate duplicate/redundant indexes: indexes whose leading columns are a subset of another
SELECT a.index_name        AS redundant_index,
       a.columns           AS redundant_cols,
       b.index_name        AS covering_index,
       b.columns           AS covering_cols
FROM (
  SELECT index_name,
         LISTAGG(column_name, ', ') WITHIN GROUP (ORDER BY column_position) AS columns
  FROM   all_ind_columns WHERE index_owner = :schema
  GROUP  BY index_name
) a
JOIN (
  SELECT index_name,
         LISTAGG(column_name, ', ') WITHIN GROUP (ORDER BY column_position) AS columns
  FROM   all_ind_columns WHERE index_owner = :schema
  GROUP  BY index_name
) b ON b.columns LIKE a.columns || '%'
   AND a.index_name != b.index_name;
```

## Best Practices

- When multiple SQL patterns fit, choose the one that uses an index: `WHERE date_col >= SYSDATE - 30` rather than `WHERE TRUNC(date_col) >= TRUNC(SYSDATE - 30)` (the latter prevents index use)
- Use bind variables (`:param`) instead of literal values whenever possible
- For aggregation queries, always include `ORDER BY` to make results deterministic
- For schema introspection, always use `UPPER()` on user-supplied names — Oracle stores them in uppercase by default

## Oracle Version Notes (19c vs 26ai)

- **19c and later**: All SQL patterns in this skill work from 19c+; `FETCH FIRST` available since 12c
- **26ai**: SELECT AI provides a built-in NL-to-SQL engine (see `select-ai.md`); these manual patterns remain useful for agents that need direct SQL generation without SELECT AI configuration

## See Also

- [SELECT AI in Oracle 26ai](../features/select-ai.md) — Oracle's built-in NL-to-SQL engine
- [Schema Discovery Queries](../agent/schema-discovery.md) — How agents introspect the database before generating SQL
- [Intent Disambiguation](../agent/intent-disambiguation.md) — When to ask for clarification vs. proceed

## Sources

- [Oracle Database 19c SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
- [Oracle Database 19c Reference — V$SQL](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SQL.html)
