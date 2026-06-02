# APEX Export Runtime Risk Review

Use this reference for static APEX export review when the user asks whether an APEX application can create runtime pressure, slow pages, many AJAX requests, or long-running APEX requests.

This is APEX-only. Do not tune ORDS connection pools, SQLcl, database instance settings, indexes, wait events, or execution plans here. If the evidence points there, record a clear external handoff and keep the APEX finding separate.

When the entry point is a customer-specific APEX application export file, including `.sql` or `.apx`, load `apex-performance-evidence.md` first and ask once for additional evidence before running this static export runtime-risk review.

Before running this static export review or the export risk scan tool, tell the user that no database connection or live MCP database access is needed for this step. For customer exports, ask whether the result should stay chat-only or be saved to a user-confirmed external output path outside the skill tree.

If the user provides only an APEX export for performance or runtime analysis, ask once whether they also have runtime evidence such as APEX Activity Log/Page Performance, APEX Debug, HAR/Network, AWR/ASH, SQL Monitor, or ORDS logs for the same case. If the user declines or no more files are available, continue with export-only analysis and state that runtime impact remains unverified without those sources.

Version check: APEX export syntax and component attributes are version-specific. Read the export header first and treat missing attributes as version or component differences, not as proof that the behavior is absent.

## Export Header

Capture only non-secret metadata from the export header:

- APEX export release, for example `p_release`.
- Application ID and application name.
- Export timestamp.
- Application version, for example `p_flow_version`.
- Compatibility mode, for example `p_compatibility_mode`.
- Counts for pages, regions, processes, validations, buttons, Dynamic Actions, plug-ins, and messages.

## Static APEX Risk Signals

Search the export for APEX patterns that can make requests longer or multiply server calls:

```text
apex_collection
APEX_COLLECTION
p_wait_for_result=>'Y'
NATIVE_EXECUTE_PLSQL_CODE
p_ajax_items_to_submit
Dynamic Actions
COMMIT;
EXECUTE IMMEDIATE
DBMS_LOB.CREATETEMPORARY
HTP.P
apex_web_service
APEX_APPLICATION.G_X
SELECT *
```

Interpret these as candidates, not proof. A static export can identify likely APEX hot spots, but runtime evidence is still needed to rank impact.

## APEX-Only Findings

For each candidate, record:

- Page ID and page name.
- Component type: region, process, Dynamic Action, validation, computation, plug-in, or shared component.
- Why it is APEX-relevant: repeated AJAX call, synchronous PL/SQL action, Collection materialization, large report/chart refresh, CLOB/JSON response, explicit commit in Page Processing, or external webservice call from an APEX request.
- User-facing path if visible from names or comments.
- Verification target in APEX: Activity Log, Page Performance, Debug, component settings, or browser Network tab for APEX requests.

## Runtime Verification Inside APEX

Use APEX-native evidence first:

- APEX Activity Log: page, session, request, elapsed time, rows queried, errors, and AJAX/request patterns.
- Page Performance reports: slowest pages, regions, processes, and component timing.
- APEX Debug for a narrow test window and one affected user journey.
- Browser Network tab to count APEX page and AJAX requests and response sizes.

Avoid exporting debug CLOBs, request payloads, item values, uploaded files, or secret-bearing URLs unless the user explicitly confirms the need.

## External Handoff Boundary

When the likely symptom is described as connection pool growth, waits, SQL elapsed time, scheduler pressure, or instance/resource pressure, keep the APEX result in this form:

```text
APEX finding: page/component/request pattern and why it can lengthen or multiply APEX requests.
External handoff: ORDS/database/runtime team should validate pool/session/SQL/wait evidence for the same time window.
```

Do not recommend changing ORDS pool size from this skill. At most, say whether APEX evidence suggests reducing long-running or excessive APEX requests before any external pool tuning is considered.
