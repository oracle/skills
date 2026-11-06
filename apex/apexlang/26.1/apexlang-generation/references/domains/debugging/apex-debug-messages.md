# APEX Debug Messages Workflow

Use this workflow when the user gives an Oracle APEX runtime error message and a live DB connection is available.

## Verified View Shape

The `APEX_DEBUG_MESSAGES` public synonym can expose the following columns in the active APEX schema:

| Column | Use |
|---|---|
| `ID` | Debug-message row id. Use it to resolve the owning `PAGE_VIEW_ID` when the user provides a row/debug-message id. |
| `PAGE_VIEW_ID` | Correlation id for one page view or request. Use it to retrieve the complete execution log for the failed process. |
| `MESSAGE_TIMESTAMP` | Message time. Use with `ID` for stable ordering and candidate recency. |
| `ELAPSED_TIME` | Elapsed time since request start. |
| `EXECUTION_TIME` | Execution time for the message step. |
| `MESSAGE` | Debug text and error text. Search this from the supplied error message. |
| `APPLICATION_ID` | Application filter. Ask only when the error text matches multiple apps and the user did not provide an app. |
| `PAGE_ID` | Page filter. Ask only when needed to narrow multiple matches. |
| `WORKFLOW_INSTANCE_ID` | Workflow correlation when present. |
| `SESSION_ID` | APEX session id. Ask for this when the error text has multiple recent instances. |
| `APEX_USER` | Runtime user. Use as a secondary narrowing signal. |
| `MESSAGE_LEVEL` | Debug level. Sparse levels can indicate the request was not reproduced with Full trace. |
| `WORKSPACE_ID` | Workspace filter and evidence field. |
| `CALL_STACK` | Call stack when available. Use it to identify the owner before editing. |

## Query Order

1. Confirm the active connection is the intended live DB connection.
2. Query `APEX_DEBUG_MESSAGES` for the supplied error text and collect candidate `PAGE_VIEW_ID` values.
3. If exactly one recent candidate exists, use that `PAGE_VIEW_ID`.
4. If multiple candidates exist, ask the user for one narrowing value: `PAGE_VIEW_ID` / debug id, `SESSION_ID`, application id, page id, user, or approximate timestamp.
5. If the user supplies `ID`, resolve it to `PAGE_VIEW_ID` before reading the full log.
6. Retrieve the full execution log for the selected `PAGE_VIEW_ID`, ordered by `MESSAGE_TIMESTAMP, ID`.
7. Identify the nearest owner from the log: page process, validation, dynamic action Ajax callback, plugin, authorization, computation, report SQL, PL/SQL package, REST call, or runtime engine.
8. If the log is too sparse to identify the owner, ask the user to reproduce the error with APEX debug level set to Full trace, then rerun the lookup.

## Candidate Search

Use the supplied error message as a literal substring. If the message contains volatile ids, timestamps, or quoted user data, search the stable part first.

```sql
select page_view_id,
       session_id,
       application_id,
       page_id,
       apex_user,
       workspace_id,
       min(message_timestamp) first_seen,
       max(message_timestamp) last_seen,
       count(*) matching_rows,
       max(id) latest_message_id
  from apex_debug_messages
 where instr(upper(message), upper(q'[<stable error text>]')) > 0
 group by page_view_id,
          session_id,
          application_id,
          page_id,
          apex_user,
          workspace_id
 order by last_seen desc
 fetch first 20 rows only;
```

When many rows match, add only user-provided narrowing filters. Do not guess the right request.

```sql
   and session_id = <session_id>
   and application_id = <application_id>
   and page_id = <page_id>
```

## Resolve A Row Id

Use this only when the user provides a debug-message row id rather than a page view id.

```sql
select id,
       page_view_id,
       session_id,
       application_id,
       page_id,
       apex_user,
       message_timestamp,
       message
  from apex_debug_messages
 where id = <debug_message_row_id>;
```

## Full Execution Log

After `PAGE_VIEW_ID` is known, fetch the full log for that request.

```sql
select id,
       message_timestamp,
       elapsed_time,
       execution_time,
       message_level,
       message,
       call_stack
  from apex_debug_messages
 where page_view_id = <page_view_id>
 order by message_timestamp, id;
```

If the log is large, start with the error slice and then widen.

```sql
select id,
       message_timestamp,
       elapsed_time,
       execution_time,
       message_level,
       message,
       call_stack
  from apex_debug_messages
 where page_view_id = <page_view_id>
   and (
        instr(upper(message), upper(q'[<stable error text>]')) > 0
        or call_stack is not null
        or message_level <= 3
       )
 order by message_timestamp, id;
```

## Multiple Matches

If the candidate query returns multiple plausible `PAGE_VIEW_ID` values, stop before diagnosis and ask:

`I found multiple matching APEX debug entries for that error. Please provide the PAGE_VIEW_ID/debug id or SESSION_ID for the failed run, or the approximate time/user so I can narrow it down.`

## Sparse Or Unhelpful Logs

Treat the existing debug log as insufficient when:

- The selected `PAGE_VIEW_ID` has only a few generic rows.
- The error row appears without preceding process, SQL, validation, Ajax, or PL/SQL context.
- `CALL_STACK` is empty and the surrounding messages do not identify the component or package.
- `MESSAGE_LEVEL` values show only coarse messages.

Ask for a Full trace reproduction:

`The existing APEX debug log is too sparse to identify the failing owner. Please reproduce the error with APEX debug level set to Full trace, then share the new PAGE_VIEW_ID/debug id or SESSION_ID and I will pull the full execution log.`

## Diagnosis Rules

- Prefer the full `PAGE_VIEW_ID` execution log over the isolated error message.
- Use `CALL_STACK` and the messages immediately before the error to identify the owner.
- Do not patch APEXlang artifacts, SQL, or PL/SQL until the log points to an owning component or package.
- If the log points to app PL/SQL, route the fix through the PL/SQL workflow.
- If the log points to generated APEX page metadata, route through the relevant APEXlang page, component, or business-logic workflow.
- If the log points to APEX runtime internals with no app-owned preceding operation, report the evidence and avoid speculative edits.

## Response Shape

- Matching `PAGE_VIEW_ID` / session evidence
- Full-log signal used
- Likely failing component or package
- Error cause, if supported by the log
- Smallest fix surface
- Reproduction or re-check command
