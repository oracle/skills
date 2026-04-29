# Client Identification and Agent Traceability in Oracle

When an AI agent executes SQL against Oracle, those queries appear in V$SESSION, V$SQL, ASH, and AWR just like any other workload. Without identification, agent queries are indistinguishable from application queries — making debugging, auditing, and performance diagnosis difficult.

Set client identification at session start so every query the agent runs is traceable.

## DBMS_APPLICATION_INFO

The primary package for identifying who is running what.

```sql
-- Set at the start of every agent session
BEGIN
  DBMS_APPLICATION_INFO.SET_MODULE(
    module_name => 'claude-agent',   -- max 48 chars; identifies the agent system
    action_name => 'session-start'   -- max 32 chars; identifies the current task
  );
  DBMS_APPLICATION_INFO.SET_CLIENT_INFO(
    client_info => 'task-id:abc123'  -- max 64 chars; free-form context
  );
END;
/
```

### Updating Action as the Agent Progresses

```sql
-- Update action as the agent moves through a workflow
BEGIN
  DBMS_APPLICATION_INFO.SET_ACTION('schema-discovery');
END;
/

-- ... run schema discovery queries ...

BEGIN
  DBMS_APPLICATION_INFO.SET_ACTION('generating-report');
END;
/

-- ... run report queries ...

BEGIN
  DBMS_APPLICATION_INFO.SET_ACTION('idle');
END;
/
```

### Tracking Long Operations

```sql
-- For operations that take more than a few seconds, report progress
BEGIN
  DBMS_APPLICATION_INFO.SET_SESSION_LONGOPS(
    rindex      => DBMS_APPLICATION_INFO.SET_SESSION_LONGOPS_NOHINT,
    slno        => :slno,
    op_name     => 'Agent bulk embed',
    target_desc => 'doc_chunks',
    sofar       => :rows_processed,
    totalwork   => :total_rows,
    units       => 'rows'
  );
END;
/
-- Visible in V$SESSION_LONGOPS
```

## DBMS_SESSION.SET_IDENTIFIER

Sets the `CLIENT_IDENTIFIER` — visible in V$SESSION and included in audit records.

```sql
BEGIN
  DBMS_SESSION.SET_IDENTIFIER('agent-user:klrice|task:rag-ingest|session:s42');
END;
/

-- Clear when done
BEGIN
  DBMS_SESSION.SET_IDENTIFIER('');
END;
/
```

## Verifying Identification in V$SESSION

```sql
-- Check that identification was set correctly
SELECT sid,
       serial#,
       username,
       module,
       action,
       client_info,
       client_identifier,
       status,
       last_call_et AS seconds_since_last_call
FROM   v$session
WHERE  module = 'claude-agent'
ORDER  BY last_call_et;
```

## Finding Agent Queries in ASH

```sql
-- Active session history for all agent queries in the last hour
SELECT sample_time,
       sql_id,
       event,
       wait_class,
       module,
       action,
       client_id
FROM   v$active_session_history
WHERE  module = 'claude-agent'
  AND  sample_time >= SYSDATE - 1/24  -- last hour
ORDER  BY sample_time DESC;
```

## Finding Agent Queries in V$SQL

```sql
-- Top SQL by elapsed time from the agent module
SELECT sql_text,
       executions,
       elapsed_time / 1e6 AS elapsed_sec,
       cpu_time / 1e6     AS cpu_sec,
       buffer_gets,
       module,
       action
FROM   v$sql
WHERE  module = 'claude-agent'
ORDER  BY elapsed_time DESC
FETCH  FIRST 20 ROWS ONLY;
```

## Auditing Agent Activity

```sql
-- Create an audit policy targeting the agent's client identifier
CREATE AUDIT POLICY agent_dml_audit
  ACTIONS INSERT, UPDATE, DELETE
  WHEN 'SYS_CONTEXT(''USERENV'',''CLIENT_IDENTIFIER'') LIKE ''agent-%'''
  EVALUATE PER SESSION;

AUDIT POLICY agent_dml_audit;

-- Query the unified audit trail for agent activity
SELECT event_timestamp,
       dbusername,
       action_name,
       object_schema,
       object_name,
       sql_text,
       client_identifier
FROM   unified_audit_trail
WHERE  client_identifier LIKE 'agent-%'
ORDER  BY event_timestamp DESC;
```

## Recommended Naming Convention

```
MODULE:  '<agent-name>'                  e.g. 'claude-agent', 'my-chatbot'
ACTION:  '<current-task>'                e.g. 'rag-ingest', 'report-gen', 'schema-fix'
CLIENT_INFO: 'key:value|key:value'       e.g. 'user:klrice|request-id:req-42'
CLIENT_IDENTIFIER: '<agent>:<user>:<id>' e.g. 'claude-agent:klrice:session-42'
```

Keep MODULE and ACTION consistent across sessions so AWR/ASH history is queryable by these values.

## Complete Session Initialization Procedure

```sql
-- Call this at the start of every agent session
CREATE OR REPLACE PROCEDURE init_agent_session (
  p_agent_name    IN VARCHAR2,
  p_task          IN VARCHAR2,
  p_user          IN VARCHAR2 DEFAULT NULL,
  p_request_id    IN VARCHAR2 DEFAULT NULL
) AS
BEGIN
  DBMS_APPLICATION_INFO.SET_MODULE(
    module_name => SUBSTR(p_agent_name, 1, 48),
    action_name => SUBSTR(p_task, 1, 32)
  );
  DBMS_APPLICATION_INFO.SET_CLIENT_INFO(
    SUBSTR('user:' || NVL(p_user, 'unknown') ||
           '|req:'  || NVL(p_request_id, SYS_GUID()), 1, 64)
  );
  DBMS_SESSION.SET_IDENTIFIER(
    SUBSTR(p_agent_name || ':' || NVL(p_user, 'unknown') || ':' || NVL(p_request_id, ''), 1, 64)
  );
END;
/

-- Usage at session start
EXEC init_agent_session('claude-agent', 'rag-ingest', 'klrice', 'req-1042');
```

## CLIENT_IDENTIFIER Truncation and Encoding

Oracle silently truncates values that exceed the field length limits. Structure your values so the most identifying information fits within the limit, even after truncation.

| Field | Package | Max Length |
|---|---|---|
| `MODULE` | `DBMS_APPLICATION_INFO.SET_MODULE` | 48 bytes |
| `ACTION` | `DBMS_APPLICATION_INFO.SET_ACTION` | 32 bytes |
| `CLIENT_INFO` | `DBMS_APPLICATION_INFO.SET_CLIENT_INFO` | 64 bytes |
| `CLIENT_IDENTIFIER` | `DBMS_SESSION.SET_IDENTIFIER` | 64 bytes |

Always truncate explicitly before passing values to these calls so truncation is intentional and predictable:

```sql
-- Safe truncation pattern for client identifier
DECLARE
  c_max CONSTANT PLS_INTEGER := 64;
  v_id  VARCHAR2(64) := SUBSTR(:agent_id || ':' || :task_id, 1, c_max);
BEGIN
  DBMS_SESSION.SET_IDENTIFIER(v_id);
END;
/
```

Recommended encoding scheme for `CLIENT_IDENTIFIER`:

```
AGENT_TYPE:AGENT_ID:TASK_ID:STEP
```

Truncated to 64 bytes, with the most important segment (AGENT_TYPE) placed first so it survives truncation. Example: `claude-agent:ra-ingest:task-042:step-3`.

## Connection Pool Identification (UCP / DRCP)

When agents connect through Universal Connection Pool (UCP) or Database Resident Connection Pooling (DRCP), the underlying physical session is shared across multiple logical connections. `CLIENT_IDENTIFIER` and `DBMS_APPLICATION_INFO` values persist on the physical session — they are not automatically reset when a connection is returned to the pool.

Always reset identification at connection checkout and clear it at connection return:

```sql
-- At connection checkout from pool:
BEGIN
  DBMS_APPLICATION_INFO.SET_MODULE(:agent_type, :current_action);
  DBMS_SESSION.SET_IDENTIFIER(:agent_id);
END;
/

-- At connection return to pool (always clear sensitive identifiers):
BEGIN
  DBMS_APPLICATION_INFO.SET_MODULE(NULL, NULL);
  DBMS_SESSION.SET_IDENTIFIER(NULL);
END;
/
```

Failing to clear at return means the next logical connection borrowing that physical session inherits the previous agent's identity — causing misattribution in V$SESSION, ASH, and audit trails.

In Java (JDBC/UCP), use `oracle.jdbc.pool.OracleDataSource` with `setConnectionProperty("oracle.jdbc.clientId", ...)` for pool-level defaults, but also call the PL/SQL above explicitly for full V$SESSION visibility. The JDBC property alone does not populate `MODULE` or `ACTION`.

## MCP Server Auto-Identification

When an agent connects through the Oracle MCP server (Oracle 26ai), the MCP server can automatically populate `MODULE` and `CLIENT_INFO` before the agent's first SQL executes. In this case, the agent should not overwrite `MODULE` or `ACTION` — only set `ACTION` to reflect the current task.

Verify whether the MCP layer has already set identification:

```sql
SELECT module, action, client_info, client_identifier
FROM   v$session
WHERE  sid = SYS_CONTEXT('USERENV', 'SID');
```

If `MODULE` is already set by the MCP server, follow this convention:

```
MODULE           = 'MCP:AgentName'       -- set by MCP server; do not overwrite
ACTION           = 'current task'        -- update as the agent progresses
CLIENT_IDENTIFIER = 'session-uuid'       -- set by MCP server; do not overwrite
```

Only call `DBMS_APPLICATION_INFO.SET_ACTION` to update the current step — leave `MODULE`, `CLIENT_INFO`, and `CLIENT_IDENTIFIER` as set by the MCP layer. This preserves end-to-end traceability from MCP connection through to AWR and audit records.

## Best Practices

- Set MODULE, ACTION, and CLIENT_IDENTIFIER at session start — do it before the first query
- Update ACTION as the agent changes tasks within a session so AWR reports show per-task workload
- Use a consistent MODULE name across all sessions from the same agent — enables AWR top module reports
- Keep MODULE under 48 chars and ACTION under 32 chars (Oracle silently truncates)
- Clear CLIENT_IDENTIFIER at session end so it does not persist to connection pool reuse
- Include a correlation ID (request ID, task ID) in CLIENT_INFO or CLIENT_IDENTIFIER for cross-system tracing

## Common Mistakes

**Not setting any identification** — agent queries appear as anonymous application queries; impossible to distinguish from user queries in AWR/ASH.

**Setting MODULE to the schema/username** — that information is already in V$SESSION. Use MODULE for the agent system name, ACTION for the specific task.

**Setting identification once and forgetting to update ACTION** — long-running agents that change tasks without updating ACTION make ASH analysis useless.

**Exceeding field length limits** — MODULE (48), ACTION (32), CLIENT_INFO (64), CLIENT_IDENTIFIER (64). Excess is silently truncated; structure your values to be meaningful within these limits.

## Oracle Version Notes (19c vs 26ai)

- **19c and later**: DBMS_APPLICATION_INFO and DBMS_SESSION.SET_IDENTIFIER available since Oracle 8i; all patterns in this skill apply from 19c+
- **26ai**: Unified Auditing supports CLIENT_IDENTIFIER in fine-grained audit policies; MCP server can set identification automatically before executing agent-issued SQL

## See Also

- [SQLcl MCP Server](../sqlcl/sqlcl-mcp-server.md) — How AI assistants connect to Oracle; MCP can set client identification automatically
- [ASH Analysis](../performance/ash-analysis.md) — Querying V$ACTIVE_SESSION_HISTORY for session-level workload analysis
- [Auditing](../security/auditing.md) — Oracle Unified Auditing policies and the audit trail

## Sources

- [DBMS_APPLICATION_INFO Package Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_APPLICATION_INFO.html)
- [DBMS_SESSION Package Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SESSION.html)
- [V$SESSION Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SESSION.html)
