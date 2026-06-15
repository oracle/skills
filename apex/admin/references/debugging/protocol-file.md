# Operation Protocol File

Use this reference before any substantive live APEX admin workflow, state-changing workflow, customer-evidence analysis, or debugging workflow.

Debugging includes:

- live browser debugging through Codex or another browser-capable tool;
- APEX Debug or Trace;
- Activity Log, Page Performance, Error Log, Debug Messages, or Session Replay review;
- HAR, browser network, browser console, screenshot, or visible UI reproduction;
- any mixed browser plus MCP correlation workflow.

## Location

Create or update a local protocol file outside the skill tree before the workflow starts.

Do not write protocol files into:

- `apex/admin`;
- `references`;
- `tools`;
- tests;
- committed documentation;
- any repository path unless the user explicitly asks for a sanitized, generic skill artifact.

Ask for a user-confirmed output directory or exact Markdown file path. If the user gives a directory, create a timestamped Markdown filename:

- `apex-admin-protocol-YYYYMMDD-HHMMSS.md` for general APEX admin work;
- `apex-debug-protocol-YYYYMMDD-HHMMSS.md` for APEX Debug, Trace, logs, or Session Replay;
- `apex-browser-debug-protocol-YYYYMMDD-HHMMSS.md` for browser-guided debugging.

If no output path is provided, stop and ask for one before continuing.

## Required Content

Record concise, redacted facts:

- local date/time and timezone;
- environment classification: development, test, production, managed service, or unknown;
- requested goal and APEX-admin scope;
- target workspace, application, page, user, session, request, and time window when known;
- active database identity or browser-session identity category;
- confirmation gates, including `SYSTEM` exact uppercase `YES` approval, destructive-action confirmations, Debug/Trace confirmations, and production reproduction confirmations;
- actions taken and whether they were read-only or state-changing;
- observations, error messages, timings, and correlation IDs;
- evidence references such as local file paths, report names, or redacted extract names;
- handoffs to APEXlang, DB, ORDS, or SQLcl skills;
- final status, limitations, and next step.

## Token Efficiency

Use the protocol file as a compact running summary for long investigations:

- append short deltas instead of restating the full case;
- reference evidence by local path, report section, timestamp, request ID, page ID, or SQL label instead of copying full artifacts;
- keep raw APEX exports, AWR/ASH reports, HAR files, debug dumps, screenshots, console dumps, and logs outside chat context unless a small excerpt is required;
- summarize tool and SQL outputs before using them in follow-up reasoning;
- record open questions, confirmed facts, discarded hypotheses, and current next step so the agent does not reload the same references or reprocess the same evidence.

If a later step needs details from a large artifact, search or parse the local file again and bring back only the relevant excerpt.

## Redaction

Never include:

- passwords, cookies, session IDs, bearer tokens, OAuth secrets, API keys, wallet passwords, or authorization headers;
- request bodies, uploaded file contents, item values, secret-bearing full URLs, or unredacted HAR payloads;
- unnecessary personal data, customer secrets, production hostnames, or internal URLs unless explicitly needed and redacted.

Summarize sensitive evidence instead of pasting it. Reference user-confirmed local paths for screenshots, HAR files, console dumps, or exported logs only when needed.

## Updates

Append short updates as work proceeds:

- before enabling Debug or Trace;
- before state-changing browser or MCP actions;
- after each reproduction attempt;
- before and after DB/ORDS/APEXlang handoff;
- when stopping due to missing permissions, unsupported version, unsafe identity, unavailable MCP tools, or missing evidence.

End with a compact summary of what was observed, what was changed if anything, what was not inspected, and where responsibility was handed off.
