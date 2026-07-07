# APEX Application Table Audit Metadata Review

Use this reference to review whether APEX application tables appear to have simple change metadata. This is application-level audit metadata, not a replacement for tamper-resistant database auditing.

DB skill in use: `db/security/auditing.md` for generic database auditing, Unified Auditing, FGA, compliance audit policies, or tamper-resistant audit design. The APEX security skill is being used for APEX-owned application-table audit-column context.

After this handoff, use the DB auditing skill's required connection/user for audit policies, FGA, Unified Auditing, history tables, Flashback Data Archive, or tamper-resistant audit design. Do not reuse the APEX admin connection unless the DB skill explicitly accepts it.

## Admin Skill Boundary

The APEX admin skill must not create, alter, or drop application tables, audit tables, history tables, triggers, packages, constraints, or APEX internal/runtime tables.

Use this reference only to:

- inventory whether application-owned tables already expose created/updated metadata;
- check whether existing metadata uses an APEX runtime user context instead of only the parsing schema;
- identify gaps that should be handed off to the owning application, APEXlang, or DB skill;
- record the finding in the local protocol or user-confirmed report.

Do not generate DDL from this skill. If the user wants audit columns, triggers, history tables, or application instrumentation added, stop and route the implementation to the owning application/APEXlang or DB skill. Any write to an existing customer-owned table is state-changing and requires explicit user confirmation in the owning skill.

## Review Shape

When reviewing existing customer-owned application tables, look for consistent metadata such as:

- created timestamp;
- created user;
- updated timestamp;
- updated user.

The exact column names and data types are customer/application design choices. Do not impose APEX internal table conventions, `WWV_FLOW_%` conventions, `$` runtime/log table naming, or a specific timestamp datatype from this skill.

When assessing existing triggers or application logic, prefer APEX runtime context for end-user attribution when available, with a database-user fallback. In APEX runtime, `USER` and `SESSION_USER` commonly identify the parsing schema, not the end user.

## Guardrails

- Do not add audit-column triggers, log tables, history tables, or package wrappers from the APEX admin skill.
- Do not create logging tables for skill protocols in an APEX schema, parsing schema, workspace schema, or customer application schema.
- Do not alter existing customer-owned tables from this skill. Writing to existing tables is also state-changing and must be explicitly requested and routed to the owning skill.
- Do not recommend copying passwords, tokens, large payloads, BLOBs, CLOBs, request bodies, item values, or sensitive free text into audit tables by default.
- On hot tables, bulk-load paths, or ETL-heavy workloads, call out row-level trigger cost.
- Consider database-generic alternatives such as compound triggers, history tables, Unified Auditing, or Flashback Data Archive through the relevant DB skill.
- Application change metadata is not a replacement for tamper-resistant database auditing.
