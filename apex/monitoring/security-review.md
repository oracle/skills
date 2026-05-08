# APEX Monitoring Security Review

Use this checklist after substantial APEX monitoring, replay, debug, error-log, performance, REST, or background-job work.

- Scope: APEX logs, debug context, Session Replay output, page/runtime context, workspace/application/page IDs, and time windows stayed in this skill; generic AWR, ASH, wait-event, SQL tuning, ORDS, scheduler, auditing, or alert-log analysis was routed to `db/...`.
- DB usage messages: every generic DB step has a visible `DB skill in use:` message naming the relevant DB skill path.
- Sensitive data: activity logs, debug messages, error logs, request values, Team Development files, Session Replay output, and exports avoid unnecessary payload columns, BLOBs, CLOBs, headers, tokens, item values, and secret-bearing URLs.
- Version checks: APEX views and columns were discovered with `APEX_DICTIONARY`, `ALL_OBJECTS`, or `ALL_TAB_COLUMNS` before version-specific SQL was generated.
- Licensed features: AWR, ASH, and Diagnostics Pack usage was called out; non-licensed fallbacks such as live `V$SESSION`, `V$SQL`, ORDS logs, APEX debug, and application instrumentation were considered.
- Security boundaries: APEX session state, hidden items, read-only items, client-side checks, and replay observations were not treated as access control.
- Reproduction safety: journey replay and background-job reruns avoid production side effects such as emails, payments, notifications, approvals, destructive DML, or external calls unless explicitly confirmed.
- Evidence quality: AWR/ASH candidates are treated as correlation evidence, not proof, unless confirmed by SQL ID, ECID, module/action, client identifier, debug page-view ID, or application instrumentation.
