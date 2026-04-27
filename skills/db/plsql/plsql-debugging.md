# PL/SQL Debugging

## Overview

Debugging PL/SQL requires a range of techniques from simple output utilities to full interactive debuggers. Understanding the strengths and limitations of each approach enables faster issue isolation in both development and production environments.

---

## DBMS_OUTPUT

`DBMS_OUTPUT` is the simplest debugging tool — it writes messages to a server-side buffer that is displayed to the client after the PL/SQL block completes.

### Basic Usage

```sql
-- Enable output in SQL*Plus / SQLcl
SET SERVEROUTPUT ON SIZE UNLIMITED

-- Enable in SQL Developer: View > DBMS Output panel > click the green +

BEGIN
  DBMS_OUTPUT.PUT_LINE('Starting process');
  DBMS_OUTPUT.PUT('Partial line ');  -- no newline
  DBMS_OUTPUT.PUT_LINE('continues here');
  DBMS_OUTPUT.NEW_LINE;  -- blank line
  DBMS_OUTPUT.PUT_LINE('Done');
END;
/
```

### Buffer Management

```sql
-- Default buffer is 20,000 bytes in older releases
-- In 10g+, set to UNLIMITED in SQL*Plus
SET SERVEROUTPUT ON SIZE UNLIMITED

-- In PL/SQL: explicitly enable and set buffer size
DBMS_OUTPUT.ENABLE(buffer_size => NULL);  -- NULL = unlimited

-- Flush buffer manually (rarely needed; happens automatically at block end)
DBMS_OUTPUT.GET_LINES(lines_array, numlines);  -- programmatic read
```

### Limitations of DBMS_OUTPUT

| Limitation | Detail |
|---|---|
| Not real-time | Output appears only AFTER the entire block completes |
| Buffer overflow | With bounded size, ORA-20000 if buffer full |
| Not visible in production | Applications don't read DBMS_OUTPUT |
| Alters session state | ENABLE/DISABLE affects buffer availability |
| Multi-session | Only visible in the originating session |
| Not for high-frequency loops | Performance overhead per call |

```sql
-- Pattern: conditional debug output using package flag
CREATE OR REPLACE PACKAGE debug_pkg AS
  g_debug BOOLEAN := FALSE;

  PROCEDURE enable;
  PROCEDURE disable;
  PROCEDURE log(p_msg IN VARCHAR2);
END debug_pkg;
/

CREATE OR REPLACE PACKAGE BODY debug_pkg AS
  PROCEDURE enable  IS BEGIN g_debug := TRUE;  END;
  PROCEDURE disable IS BEGIN g_debug := FALSE; END;

  PROCEDURE log(p_msg IN VARCHAR2) IS
  BEGIN
    IF g_debug THEN
      DBMS_OUTPUT.PUT_LINE(TO_CHAR(SYSTIMESTAMP, 'HH24:MI:SS.FF3') || ' | ' || p_msg);
    END IF;
  END log;
END debug_pkg;
/

-- Usage: enable temporarily, then disable
BEGIN
  debug_pkg.enable;
  process_orders;
  debug_pkg.disable;
END;
/
```

---

## DBMS_APPLICATION_INFO

`DBMS_APPLICATION_INFO` sets the `MODULE`, `ACTION`, and `CLIENT_INFO` fields visible in `V$SESSION`. This is valuable for monitoring long-running operations in production without modifying the business logic significantly.

```sql
CREATE OR REPLACE PROCEDURE process_month_end_close(
  p_period_id IN NUMBER
) IS
  l_count NUMBER := 0;
BEGIN
  -- Set module/action visible in V$SESSION
  DBMS_APPLICATION_INFO.SET_MODULE(
    module_name => 'MONTH_END_CLOSE',
    action_name => 'INITIALIZING'
  );

  DBMS_APPLICATION_INFO.SET_CLIENT_INFO('period_id=' || p_period_id);

  -- Phase 1
  DBMS_APPLICATION_INFO.SET_ACTION('VALIDATE_OPEN_ITEMS');
  validate_open_items(p_period_id);

  -- Phase 2
  DBMS_APPLICATION_INFO.SET_ACTION('POST_JOURNAL_ENTRIES');
  FOR rec IN (SELECT * FROM pending_journals WHERE period_id = p_period_id) LOOP
    post_journal(rec.journal_id);
    l_count := l_count + 1;

    -- Update progress visible in V$SESSION
    DBMS_APPLICATION_INFO.SET_ACTION(
      'POSTING_JOURNALS (' || l_count || ' done)'
    );
  END LOOP;

  -- Phase 3
  DBMS_APPLICATION_INFO.SET_ACTION('GENERATE_REPORTS');
  generate_period_reports(p_period_id);

  -- Clear on completion
  DBMS_APPLICATION_INFO.SET_MODULE(NULL, NULL);

END process_month_end_close;
/

-- Monitor progress from another session (DBA)
SELECT sid, module, action, client_info, last_call_et AS seconds_running
FROM   v$session
WHERE  module = 'MONTH_END_CLOSE';
```

### Long Operations Tracking

```sql
-- Register a long operation visible in V$SESSION_LONGOPS
DECLARE
  l_rindex   BINARY_INTEGER;
  l_slno     BINARY_INTEGER;
  l_total    NUMBER := 1000;
  l_sofar    NUMBER := 0;
BEGIN
  l_rindex := DBMS_APPLICATION_INFO.SET_SESSION_LONGOPS_NOHINT;

  FOR i IN 1..l_total LOOP
    -- ... process row i ...
    l_sofar := i;

    IF MOD(i, 100) = 0 THEN  -- update every 100 rows
      DBMS_APPLICATION_INFO.SET_SESSION_LONGOPS(
        rindex      => l_rindex,
        slno        => l_slno,
        op_name     => 'Process Employee Records',
        target      => 0,
        context     => 0,
        sofar       => l_sofar,
        totalwork   => l_total,
        target_desc => 'employees table',
        units       => 'rows'
      );
    END IF;
  END LOOP;
END;
/

-- Monitor from another session
SELECT opname, sofar, totalwork,
       ROUND(sofar/totalwork * 100, 1) AS pct_complete,
       elapsed_seconds
FROM   v$session_longops
WHERE  sofar < totalwork
  AND  opname = 'Process Employee Records';
```

---

## SQL Developer PL/SQL Debugger

SQL Developer provides an interactive debugger with breakpoints, watches, and step execution.

### Setup

1. **Grant debug privilege to your user**:
```sql
-- Required before debugging
GRANT DEBUG CONNECT SESSION TO my_dev_user;
GRANT DEBUG ANY PROCEDURE TO my_dev_user;  -- or specific objects
```

2. **Compile with debug info** (required for line-level debugging):
```sql
-- Compile with debug symbols
ALTER SESSION SET PLSQL_OPTIMIZE_LEVEL = 1;  -- disable optimizer for accurate line tracking

ALTER PROCEDURE my_procedure COMPILE DEBUG;
-- or via SQL Developer: right-click > Compile for Debug
```

### Debugging Steps

```
1. Open the procedure in SQL Developer editor
2. Click in the left margin to set a breakpoint (red dot appears)
3. Right-click the procedure > Run (or click the debug icon)
4. In the Run PL/SQL dialog, set input parameter values
5. Execution pauses at the breakpoint
6. Use the debugger toolbar:
   - Step Into (F7): enter called procedures
   - Step Over (F8): execute current line, stay in current procedure
   - Step Out (Shift+F7): run to end of current procedure, return to caller
   - Resume (F9): continue until next breakpoint
7. Inspect variables in the Data panel
8. Modify variable values during execution to test branches
9. Use Watches to monitor specific expressions continuously
```

### Common Debugger Techniques

```sql
-- Conditional breakpoint: pause only when condition is true
-- (Set in SQL Developer breakpoint properties)
-- Condition example: employee_id = 12345

-- Smart watch: evaluate expression at each pause
-- Example watch expression: l_salary * 1.1

-- Compile all dependent objects with debug info
BEGIN
  FOR obj IN (
    SELECT object_name, object_type
    FROM   user_objects
    WHERE  object_type IN ('PROCEDURE', 'FUNCTION', 'PACKAGE BODY')
  ) LOOP
    EXECUTE IMMEDIATE
      'ALTER ' || obj.object_type || ' ' || obj.object_name || ' COMPILE DEBUG';
  END LOOP;
END;
/
```

---

## Enabling and Reading Compile Warnings

Oracle can emit compile-time warnings about potential issues in PL/SQL code.

### PLSQL_WARNINGS Parameter

```sql
-- Enable all warnings for current session
ALTER SESSION SET PLSQL_WARNINGS = 'ENABLE:ALL';

-- Enable specific categories
ALTER SESSION SET PLSQL_WARNINGS = 'ENABLE:PERFORMANCE, ENABLE:INFORMATIONAL';

-- Enable all, but treat specific warning as error
ALTER SESSION SET PLSQL_WARNINGS = 'ENABLE:ALL, ERROR:06002';

-- Disable specific warning (suppress)
ALTER SESSION SET PLSQL_WARNINGS = 'ENABLE:ALL, DISABLE:07204';

-- Disable all warnings
ALTER SESSION SET PLSQL_WARNINGS = 'DISABLE:ALL';
```

### Warning Categories

| Category | Code Range | Description |
|---|---|---|
| `SEVERE` | PLW-05xxx | Likely errors (e.g., unreachable code) |
| `PERFORMANCE` | PLW-07xxx | Code likely to cause performance problems |
| `INFORMATIONAL` | PLW-06xxx | Style or design improvement suggestions |

```sql
-- After enabling, recompile to see warnings
ALTER SESSION SET PLSQL_WARNINGS = 'ENABLE:ALL';

CREATE OR REPLACE FUNCTION risky_function(p_val IN NUMBER) RETURN NUMBER IS
  l_result NUMBER;
BEGIN
  IF p_val > 0 THEN
    RETURN p_val * 2;
  ELSE
    RETURN 0;
  END IF;
  l_result := 99;  -- PLW-06002: Unreachable code
  RETURN l_result;
END risky_function;
/
-- Warning: PLW-06002: Unreachable code

-- Read warnings after compilation
SELECT line, position, text, attribute
FROM   user_errors
WHERE  name = 'RISKY_FUNCTION'
  AND  type = 'FUNCTION'
ORDER BY line;
```

### DBMS_WARNING Package (Programmatic Control)

```sql
-- Save and restore warning settings
DECLARE
  l_saved_setting VARCHAR2(100);
BEGIN
  l_saved_setting := DBMS_WARNING.GET_WARNING_SETTING_STRING;
  DBMS_WARNING.SET_WARNING_SETTING_STRING('ENABLE:ALL', 'SESSION');

  -- compile some code...

  DBMS_WARNING.SET_WARNING_SETTING_STRING(l_saved_setting, 'SESSION');
END;
/
```

---

## UTL_FILE for Log Files

`UTL_FILE` writes to server-side OS files — useful for logging in batch jobs where DBMS_OUTPUT is impractical.

```sql
-- First: DBA must create a DIRECTORY object pointing to an OS path
-- CREATE OR REPLACE DIRECTORY app_log_dir AS '/opt/oracle/logs';
-- GRANT READ, WRITE ON DIRECTORY app_log_dir TO my_schema;

CREATE OR REPLACE PROCEDURE write_log(
  p_message IN VARCHAR2
) IS
  l_file    UTL_FILE.FILE_TYPE;
  l_logfile VARCHAR2(50) := 'process_' || TO_CHAR(SYSDATE, 'YYYYMMDD') || '.log';
BEGIN
  l_file := UTL_FILE.FOPEN(
    location     => 'APP_LOG_DIR',  -- DIRECTORY object name (uppercase)
    filename     => l_logfile,
    open_mode    => 'a',             -- 'a' = append, 'w' = write, 'r' = read
    max_linesize => 32767
  );

  UTL_FILE.PUT_LINE(
    l_file,
    TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.FF3') ||
    ' | ' || SYS_CONTEXT('USERENV','SESSION_USER') ||
    ' | ' || p_message
  );

  UTL_FILE.FCLOSE(l_file);

EXCEPTION
  WHEN UTL_FILE.INVALID_DIRECTORY THEN
    RAISE_APPLICATION_ERROR(-20100, 'Invalid log directory: APP_LOG_DIR');
  WHEN UTL_FILE.WRITE_ERROR THEN
    RAISE_APPLICATION_ERROR(-20101, 'Write error to log file');
  WHEN OTHERS THEN
    IF UTL_FILE.IS_OPEN(l_file) THEN
      UTL_FILE.FCLOSE(l_file);
    END IF;
    RAISE;
END write_log;
/
```

---

## Tracing with DBMS_TRACE

`DBMS_TRACE` enables server-side PL/SQL execution tracing. Trace data is written to the `PLSQL_TRACE_EVENTS` and `PLSQL_TRACE_RUNS` tables.

```sql
-- Setup (DBA task, one-time)
-- @?/rdbms/admin/tracetab.sql  -- creates trace tables

-- Grant execute (DBA)
-- GRANT EXECUTE ON DBMS_TRACE TO my_user;

-- Start tracing in your session
DBMS_TRACE.SET_PLSQL_TRACE(DBMS_TRACE.TRACE_ALL_CALLS);
-- Options:
--   TRACE_ALL_CALLS    -- trace every call
--   TRACE_ENABLED_CALLS -- trace only procedures compiled with debug
--   TRACE_ALL_EXCEPTIONS -- trace all exceptions
--   TRACE_ENABLED_EXCEPTIONS -- trace exceptions in debug-compiled units
--   TRACE_ALL_SQL      -- trace SQL statements

-- Run the code you want to trace
BEGIN
  process_orders;
END;
/

-- Stop tracing
DBMS_TRACE.CLEAR_PLSQL_TRACE;

-- Read trace data
SELECT r.runid, r.run_date, r.run_comment,
       e.event_seq, e.event_kind, e.proc_name, e.line#
FROM   plsql_trace_runs  r
JOIN   plsql_trace_events e ON e.runid = r.runid
WHERE  r.run_date > SYSDATE - 1/24  -- last hour
ORDER BY r.runid, e.event_seq;
```

---

## Reading SQL Trace Files

Enable SQL trace to capture all SQL and PL/SQL execution details including waits and bind values.

```sql
-- Enable trace for current session
ALTER SESSION SET SQL_TRACE = TRUE;
-- or for more detail with waits and binds:
ALTER SESSION SET EVENTS '10046 trace name context forever, level 12';
-- Level 1: basic, 4: bind variables, 8: wait events, 12: binds + waits

-- Run the problematic code
BEGIN
  process_orders;
END;
/

-- Disable trace
ALTER SESSION SET SQL_TRACE = FALSE;
-- or: ALTER SESSION SET EVENTS '10046 trace name context off';

-- Find the trace file location
SELECT value FROM v$diag_info WHERE name = 'Default Trace File';

-- Or find by session info
SELECT s.sid, s.serial#, s.username,
       p.tracefile
FROM   v$session s
JOIN   v$process p ON p.addr = s.paddr
WHERE  s.audsid = SYS_CONTEXT('USERENV', 'SESSIONID');
```

### Processing Trace Files

```bash
# On the database server OS:
# tkprof formats the raw trace file into readable output
tkprof /path/to/trace.trc output.txt explain=myuser/mypass sys=no sort=prsela,exeela,fchela

# Key sections in tkprof output:
# - call count, cpu, elapsed, disk, query, current, rows
# - Rows: actual rows processed
# - Elapsed: wall clock time
# - CPU: CPU time
# - Disk: physical reads
```

---

## Debugging Best Practices

- Use `DBMS_APPLICATION_INFO` in all long-running procedures — it costs almost nothing and makes monitoring easy.
- Structure debug output with timestamps: `TO_CHAR(SYSTIMESTAMP, 'HH24:MI:SS.FF3')`.
- Use a package-level debug flag to enable/disable output without changing business logic.
- Always compile with `DEBUG` during development; compile with normal optimization for production.
- Remove or disable `DBMS_OUTPUT` calls in production code paths — replace with proper logging.
- Use SQL trace (level 12) to diagnose unexpected SQL execution behavior including bind values.
- `UTL_FILE` log files should be in a dedicated directory with controlled permissions.
- Test with `PLSQL_WARNINGS = 'ENABLE:ALL'` regularly to catch unreachable code and performance issues.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Relying on DBMS_OUTPUT in production | Not visible to applications | Use proper logging tables with autonomous transactions |
| Not checking IS_OPEN before FCLOSE | Raises exception if file was never opened | Always `IF UTL_FILE.IS_OPEN(l_file) THEN CLOSE; END IF` |
| Compiling DEBUG for production | Performance overhead, exposes source | Compile normally for production (`ALTER PROCEDURE ... COMPILE`) |
| Not clearing DBMS_APPLICATION_INFO on exit | Module/Action remain set for next user of pooled connection | Always clear in exception handler and normal exit |
| Setting PLSQL_WARNINGS system-wide without testing | Floods compile errors on existing code | Set at session level first, fix warnings, then promote |
| Large debug strings in tight loops | Memory and CPU overhead | Conditionally log only every N iterations |

---

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

- **Oracle 11g+**: `DBMS_APPLICATION_INFO.SET_SESSION_LONGOPS` with better granularity.
- **Oracle 12c+**: Improved SQL Developer debugger with better handling of 12c features.
- **Oracle 18c+**: Cloud-compatible tracing with Automatic Diagnostic Repository (ADR) improvements.
- **All versions**: `DBMS_OUTPUT.ENABLE(NULL)` for unlimited buffer available since 10g.

---

## See Also

- [PL/SQL Error Handling](../plsql/plsql-error-handling.md) — Structured exception handling design and logging patterns

## Sources

- [DBMS_OUTPUT (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_OUTPUT.html) — PUT_LINE, PUT, NEW_LINE, ENABLE
- [DBMS_APPLICATION_INFO (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_APPLICATION_INFO.html) — SET_MODULE, SET_ACTION, SET_SESSION_LONGOPS
- [UTL_FILE (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/UTL_FILE.html) — FOPEN, PUT_LINE, FCLOSE, IS_OPEN, exception types
- [DBMS_TRACE (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_TRACE.html) — SET_PLSQL_TRACE, CLEAR_PLSQL_TRACE, trace constants
- [Oracle Database SQL Trace Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/performing-application-tracing.html) — event 10046, tkprof
