# APEX Instance Debug API

Use this reference when an APEX instance administrator needs the documented `APEX_INSTANCE_DEBUG` API for instance-level debug enablement checks, recent debug page views, activity log output, or messages for a known page view ID.

Official source: Oracle APEX 26.1 API Reference, `APEX_INSTANCE_DEBUG`:

```text
https://docs.oracle.com/en/database/oracle/apex/26.1/aeapi/APEX_INSTANCE_DEBUG.html
```

This reference is for supported APEX debug APIs only. It does not replace browser reproduction, Workspace Monitor Activity, SQL-backed view discovery, or DB/ORDS diagnostics.

## API Surface

`APEX_INSTANCE_DEBUG` exposes these documented APIs:

- `APEX_INSTANCE_DEBUG.ENABLE`
- `APEX_INSTANCE_DEBUG.DISABLE`
- `APEX_INSTANCE_DEBUG.IS_ENABLED`
- `APEX_INSTANCE_DEBUG.LIST_ACTIVITY`
- `APEX_INSTANCE_DEBUG.LIST_MESSAGES`
- `APEX_INSTANCE_DEBUG.LIST_PAGE_VIEWS`

Use `ENABLE` and `DISABLE` as state-changing instance debug operations. Use `IS_ENABLED`, `LIST_ACTIVITY`, `LIST_MESSAGES`, and `LIST_PAGE_VIEWS` for narrow debug status and evidence collection.

## Guardrails

- Apply the APEX Admin Identity Gate from `apex/admin/SKILL.md` before using this API through MCP or SQLcl.
- Create or update the local protocol file from `../debugging/protocol-file.md` before enabling debug, disabling debug, or collecting customer-specific debug evidence.
- Do not enable instance debug broadly in production. Require explicit user confirmation, target workspace/application/page/user/session when known, and a short time window.
- Always check whether instance debug is already enabled before changing it.
- After investigation, recommend or perform `APEX_INSTANCE_DEBUG.DISABLE` only after the user confirms the state-changing action unless the same approved workflow explicitly includes cleanup.
- Treat all output as sensitive. Debug and activity output may contain user names, IP addresses, URLs, component names, SQL, bind values, item values, error text, or operational metadata.
- Prefer metadata and focused excerpts. Do not paste full debug dumps into chat.

## Status Check

Use this before enabling or disabling instance debug:

```sql
BEGIN
    IF apex_instance_debug.is_enabled THEN
        dbms_output.put_line('APEX instance debug is enabled.');
    ELSE
        dbms_output.put_line('APEX instance debug is disabled.');
    END IF;
END;
/
```

## Enable Or Disable

Enable instance debug only after the scope and confirmation are recorded in the protocol file:

```sql
BEGIN
    apex_instance_debug.enable;
    COMMIT;
END;
/
```

Disable instance debug after the investigation or during cleanup:

```sql
BEGIN
    IF apex_instance_debug.is_enabled THEN
        apex_instance_debug.disable;
        COMMIT;
    END IF;
END;
/
```

## List Recent Activity

Use `LIST_ACTIVITY` for recent activity log entries when a narrow filter is available:

```sql
BEGIN
    apex_instance_debug.list_activity(
        p_from_date      => :from_date,
        p_to_date        => :to_date,
        p_app_id         => :application_id,
        p_page_id        => :page_id,
        p_workspace_name => :workspace_name,
        p_session_id     => :session_id,
        p_user           => :apex_user,
        p_error          => :error_like,
        p_debug          => :max_debug_level);
END;
/
```

Keep filters as specific as the case allows. Use `p_error => '%'` only when the user is investigating errors and the time window is narrow.

## List Debug Page Views

Use `LIST_PAGE_VIEWS` to find recent debug-enabled page views, optionally for a known APEX session:

```sql
BEGIN
    apex_instance_debug.list_page_views(
        p_session_id => :session_id,
        p_max_rows   => 30,
        p_show_d2    => FALSE);
END;
/
```

Keep `p_max_rows` small by default. Increase it only when the user confirms the broader evidence need.

## List Messages For A Page View

Use `LIST_MESSAGES` only after a relevant page view ID is known:

```sql
BEGIN
    apex_instance_debug.list_messages(
        p_page_view_id => :page_view_id);
END;
/
```

Summarize the result and quote only the smallest necessary excerpt. Do not include full SQL text, bind values, item values, cookies, tokens, request bodies, or secret-bearing URLs unless the user explicitly confirms the need and the output remains local.

## Routing

- Browser reproduction, console, and network metadata: `../debugging/live-browser-debugging.md`.
- Workspace Monitor Activity, Active Sessions, Debug/Trace UI controls: `workspace-monitor-activity.md`.
- SQL-backed error/debug correlation with supported public views: `error-handling.md`.
- Page and request timing analysis: `page-performance.md` and `activity-log.md`.
- AWR, ASH, SQL Monitor, wait events, execution plans, ORDS pool diagnostics, or infrastructure traces: route to the DB/ORDS skill.

## Output

Record the following in the protocol file:

- API used and whether it was read-only or state-changing;
- identity gate result;
- workspace, application, page, user, session, and time window;
- debug state before and after the workflow when checked;
- page view IDs and correlation IDs;
- redaction decisions;
- DB/ORDS/APEXlang handoffs.
