# Live Browser Debugging

Use this reference when the user has an APEX application or App Builder session open in a browser-capable tool and wants the agent to reproduce, observe, or narrow an APEX issue interactively.

This is browser/UI-assisted APEX debugging. It does not replace the APEX Admin Identity Gate for MCP/SQL, and it does not own generic database, ORDS, SQL tuning, or APEX application artifact changes.

## Boundary

This reference owns:

- Reproducing an issue in an already authenticated APEX browser session.
- Inspecting visible page behavior, screenshots, DOM state, browser console output, and network request metadata when the browser tool exposes them.
- Distinguishing page load, submit, AJAX, REST, static asset, and client-side JavaScript symptoms.
- Capturing correlation facts that can later be matched with APEX Activity Log, Page Performance, Debug, or Error evidence.

This reference does not own:

- APEX Debug/Trace policy, retention, or SQL-backed report queries. Use `../monitoring/workspace-monitor-activity.md`, `../monitoring/activity-log.md`, `../monitoring/page-performance.md`, and `../monitoring/error-handling.md`.
- Session Replay or SQL-backed journey reconstruction. Use `../monitoring/user-journey-replay.md`.
- Static export risk review. Use `../monitoring/export-runtime-risk-review.md`.
- MCP/database availability decisions. Use `../monitoring/mcp-availability.md`.
- AWR, ASH, SQL Monitor, wait events, execution plans, ORDS pool diagnostics, users, grants, quotas, tablespaces, or schema changes. Route to the relevant DB/ORDS skill.
- Generating or materially changing APEX application artifacts. Route to `apex/apexlang/SKILL.md`.

## Browser Tool Capability Contract

Any browser-guided tool may use this workflow when it can inspect at least one of:

- the current APEX page visually through screenshots or viewport state;
- clickable UI state and navigation path;
- browser console messages;
- network request metadata such as URL path, method, status, timing, request type, and response size.

If the tool cannot access console or network details, limit findings to visible behavior and ask the user for exported browser evidence such as a redacted HAR or screenshot. If the tool cannot attach to the authenticated session, ask the user to sign in manually or provide static evidence; do not ask for credentials in chat.

## Browser Session User

Pure browser inspection does not require a database user. The user signs in to APEX manually in the browser, and the agent uses only the already authenticated browser session. Do not ask for APEX passwords, cookies, session IDs, bearer tokens, or browser profile secrets in chat.

Use the least privileged browser identity that can reproduce or inspect the issue:

- affected-user reproduction: use the same APEX end user or a comparable test user;
- Developer Toolbar or App Builder inspection: use an authorized APEX developer or workspace administrator;
- Monitor Activity, Debug, or Trace controls in the UI: use a browser user with the required workspace or instance administration rights;
- MCP/SQL correlation after browser triage: use the normal APEX Admin Identity Gate from `apex/admin/SKILL.md`; the browser login does not authorize MCP database access.

For browser-guided tools such as Codex, the user can start with:

```text
Use the APEX admin live browser debugging workflow. I am already signed in to APEX in this browser. This is a <dev/test/production> environment. Reproduce the issue on application <APP_ID>, page <PAGE_ID>. You may inspect visible UI, screenshots, browser console, and network metadata. Do not submit state-changing actions without asking me first. Do not use database access for this step.
```

If Debug or Trace is needed, ask for explicit confirmation and route the policy decision to `../monitoring/workspace-monitor-activity.md`.

## Protocol File

Before browser-guided debugging starts, load `protocol-file.md` and create or update the local operation protocol file. Use a browser-specific timestamped name such as `apex-browser-debug-protocol-YYYYMMDD-HHMMSS.md` when the user provides a directory.

## Start Flow

1. Confirm whether the browser session is a development, test, or production environment.
2. Confirm the target workspace or application, page, user journey, symptom, and approximate time window.
3. Ask for the local protocol output directory or exact file path if none was provided.
4. State that browser inspection alone does not require database access.
5. Create or update the protocol file with the initial scope before reproducing the issue.
6. Reproduce the issue with the smallest safe click path.
7. Capture only non-secret correlation facts: application ID or alias, page ID or title, visible error text, request timestamp with timezone, action name, AJAX or submit path, HTTP status, duration, and whether the behavior is reproducible.
8. If the browser evidence points to APEX runtime logs, load the relevant APEX monitoring reference. If it points to DB/ORDS evidence, stop and ask before handoff.

## APEX Debug And Developer Toolbar

Use the APEX Developer Toolbar or App Builder only when the user is already authenticated and authorized in that browser session.

Allowed observations:

- page ID, application ID, session information, visible session-state context, and debug links;
- page processing order, Dynamic Actions, validations, computations, processes, and visible component names;
- App Builder error pages or component settings relevant to the current symptom.

Guardrails:

- Do not enable Debug or Trace broadly from this reference. Use `../monitoring/workspace-monitor-activity.md` for Debug/Trace controls and require the narrow app/page/user/session/timebox there.
- Do not paste item values, cookies, authorization headers, credential static IDs, tokens, or full URLs with secrets into chat or artifacts.
- Do not use the Developer Toolbar to edit application definitions from this reference. Route app artifact changes to APEXlang or the appropriate APEX admin deployment workflow.

## Network And Console Review

Classify browser evidence by request type:

- page render: initial document request, redirects, authentication, static asset loading;
- submit: `/wwv_flow.accept`, form submit, validations, page processing;
- AJAX: `/wwv_flow.ajax`, Dynamic Actions, plug-ins, lazy loading, Interactive Report/Grid calls;
- REST or external calls: REST Data Sources, Web Source calls, ORDS endpoints, third-party services;
- client-side issue: JavaScript exception, blocked asset, CORS, mixed content, missing static file, browser cache.

For network review, record only metadata needed for triage: path shape, method, status, timing, initiator or action, response size class, and timestamp. HAR files must be redacted before use: remove cookies, authorization headers, bearer tokens, session IDs, request bodies, and secret-bearing URLs.

For token efficiency, do not paste full network tables, DOM snapshots, screenshots, HAR files, or console dumps into chat. Update the protocol file with the few correlation facts that matter, then load deeper APEX monitoring references only when those facts point to a specific APEX-side next step.

## Correlation Targets

Use browser evidence to identify what to load next:

- visible page latency, AJAX latency, request count, or slow render: `../monitoring/page-performance.md` and `../monitoring/activity-log.md`;
- error message, failed process, unhandled exception, or debug link: `../monitoring/error-handling.md`;
- reproduced multi-step journey or missing navigation step: `../monitoring/user-journey-replay.md`;
- REST, Web Source, or outbound call issue: `../monitoring/rest-data-sources.md`;
- automation, background process, or job symptom: `../monitoring/background-jobs.md`;
- SQL ID, wait event, AWR/ASH, SQL Monitor, ORDS pool, gateway, or infrastructure symptom: DB/ORDS skill handoff.

When correlation uses live APEX SQL or APIs, apply the APEX Admin Identity Gate from `apex/admin/SKILL.md`. A browser session proves only browser authentication; it does not prove MCP database identity or permission to query APEX metadata.

## State-Changing Browser Actions

Ask for explicit confirmation before browser actions that can change state or create external side effects, including:

- submitting forms that create, update, delete, approve, pay, send email, notify, start workflows, or call external systems;
- enabling Debug or Trace;
- changing App Builder settings or application definitions;
- rerunning jobs, automations, REST calls, imports, or deployment actions.

Prefer a non-production environment for destructive or externally visible reproduction. If only production is available, keep the path read-only unless the user explicitly confirms the exact action.

## Output Handling

Keep browser-debug output compact:

- local protocol file path and whether it was updated successfully;
- symptom reproduced or not reproduced;
- environment classification and browser-tool capability used;
- page/app/session/time correlation facts;
- console/network highlights without secrets;
- next APEX reference or DB/ORDS/APEXlang handoff.

Do not store screenshots, HAR files, console dumps, customer paths, request payloads, or exported logs in the skill tree. If the user wants a report, follow the external-output rules in `apex/admin/SKILL.md`.
