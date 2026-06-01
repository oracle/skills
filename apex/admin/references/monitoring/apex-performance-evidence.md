# APEX Performance Evidence Intake

Use this reference at the start of an APEX application performance analysis, especially when the user provides only one evidence source such as an APEX export or AWR report.

APEX performance issues often span APEX metadata, APEX runtime logs, browser request behavior, database SQL, and sometimes ORDS/runtime infrastructure. Start by collecting enough APEX context before drawing root-cause conclusions from DB-only evidence.

## Ask For Evidence

Ask which files or exports the user can provide and whether the result should be chat-only or saved as an external artifact. Always ask this before substantive analysis, even when the user has already provided one APEX export, AWR report, HAR file, or log and asks to start. Treat it as an intake question, not a gate: if the user declines more files or no more files are available, continue with the available evidence, finish the analysis, and state the evidence limits. If saved, ask for the output directory or exact file path before substantive analysis. Do not store customer-specific analysis under `apex/admin/<customer_name>` or anywhere else in the skill tree.

Do not require all evidence files before beginning; use the available evidence and mark gaps.

Useful APEX-side evidence:

- APEX application export for static component review.
- APEX Activity Log or Page Views export for the affected time window, with workspace, application, page, request type, elapsed time, rows queried, session, user, and error metadata. Avoid item values and payload columns unless explicitly needed.
- Page Performance report or `APEX_WORKSPACE_PAGE_VIEW_DETAIL` extract for slow pages, regions, processes, Dynamic Actions, and `DEBUG_PAGE_VIEW_ID`.
- APEX Debug export for one narrow user journey, page, session, and time window.
- Browser Network HAR or summarized request list for page load/AJAX count, timings, status codes, and response sizes. Redact cookies, authorization headers, tokens, and request bodies.
- Web Service Activity Log for REST Data Sources or outbound service calls.
- Application Error report for error bursts around the incident.

Useful DB/ORDS-side evidence, only after asking for DB-skill handoff when interpretation is needed:

- AWR report for the exact incident window and a comparable healthy baseline window.
- ASH report or ASH extract for sub-hour spikes, top SQL, SQL module/action, session, and wait-event correlation.
- SQL Monitor report or execution plan for named top SQL IDs.
- ORDS logs, pool metrics, or gateway/runtime diagnostics when symptoms mention connection pools, request queues, HTTP errors, or gateway latency.

## Minimal Intake Questions

Use short questions, not a long form:

- What is the affected workspace, application ID, page or user journey, and time window with timezone?
- What symptom is user-visible: slow page load, slow AJAX action, login, export/download, background automation, web service, or intermittent errors?
- Which evidence files are available now: APEX export, Activity/Page Performance extract, Debug, HAR/Network, AWR/ASH, SQL Monitor, ORDS logs?
- Should results stay chat-only, or be written to which external output directory or file path?

## Analysis Order

1. Ask once whether additional customer evidence exists for the same case before substantive analysis, and record whether each relevant source is provided, unavailable, absent, declined, or will be added later. If the user declines additional evidence, continue with the available material.
2. If the first step is static file analysis, tell the user before starting that no database connection or live MCP database access is needed for that step.
3. Establish the APEX time window, workspace, application, page/request, user journey, and symptom.
4. Review APEX evidence first: Activity Log, Page Performance, Debug, Browser Network, Web Service Log, Application Errors, and static export signals.
5. If AWR/ASH/SQL Monitor/ORDS evidence is present, ask before switching to the relevant DB or ORDS skill.
6. Correlate DB findings back to APEX modules, page IDs, `/wwv_flow.ajax`, `/wwv_flow.accept`, application aliases, `APP <id>:<page>`, `CLIENT_IDENTIFIER`, or `DEBUG_PAGE_VIEW_ID` when available.
7. Separate proven findings from candidates. AWR evidence can show expensive SQL or waits, but APEX Activity Log or Debug is needed to map that cost to a user-visible APEX path.

## Connection Boundary

Static file analysis of APEX exports, AWR HTML/TEXT reports, HAR files, CSV extracts, and logs does not require a database connection.

Announce that boundary before running the static analysis. If live evidence becomes necessary afterward, stop and ask for the appropriate APEX admin connection or DB-skill handoff before using any database access.

Live APEX-side evidence gathering through MCP requires the confirmed APEX admin identity from `apex/admin/SKILL.md`: APEX dictionary queries, `APEX_WORKSPACE_ACTIVITY_LOG`, `APEX_DEBUG_MESSAGES`, supported APEX views, APEX debug/error logs, and APEX API checks must not run under `SYS`, `SYSTEM`, `SYSDBA`, parsing schemas, workspace users, ORDS/APEX runtime users, generic deployment users, or unknown accounts.

Ask for an explicit DB-skill handoff and that DB skill's required connection/user when the next step needs live generic database or ORDS evidence, such as `DBA_HIST_ACTIVE_SESS_HISTORY`, `V$SQL`, `DBMS_XPLAN`, object/index/statistics inspection, grants, parameter checks, or ORDS pool/runtime diagnostics. Do not reuse the APEX admin connection for this handoff unless the selected DB skill explicitly accepts it.

## Privacy Guardrails

- Do not request or print passwords, tokens, cookies, authorization headers, wallet secrets, or credential values.
- Prefer metadata exports over payload exports.
- Redact usernames, IP addresses, hostnames, URLs, request values, SQL text, or object names when they are not needed for the user's decision.
- Keep customer-specific paths, file names, line references, application names, SQL IDs, object names, and findings only in the confirmed external analysis artifact and chat summary.
