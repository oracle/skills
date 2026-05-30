# Workspace Monitor Activity

Use this topic when the user asks about APEX Workspace Administration, Monitor Activity, workspace usage reports, active sessions, developer activity, login attempts, environment, workspace schema reports, web service activity, archived activity, or purged task-file archives.

Official source: Oracle APEX Administration Guide, "Monitoring Activity within a Workspace":

```text
https://docs.oracle.com/en/database/oracle/apex/26.1/aeadm/monitoring-activity-within-a-workspace.html#GUID-2DF3D389-30BA-43A9-AD9A-01F583D1B508
```

## Workspace Monitor Reports

Route these Workspace Administration reports here before choosing deeper SQL, debug, or DB-performance references:

- Page Views: use for page usage, recent traffic, request timing, and navigation-path triage. Include the documented Page Views report variants: Recent Page Views, By View, By User, By Application, By Weighted Page Performance, By Page Performance, By Application and Page, By Page, By User and Page, and By Page and User. Continue to `activity-log.md` or `page-performance.md` for SQL-backed analysis.
- Developer Activity: use for App Builder and developer-change activity. Cover the documented report variants: Application Changes by Developer, By Day, and By Day and Developer. Treat usernames, timestamps, component names, and application names as sensitive operational metadata.
- Active Sessions: use for currently active APEX sessions, session detail, and temporary investigation of Debug or Trace Mode. Session Detail can show session information, session state, application items, collections, browser request details, session application attributes, workspace, authentication, active debug level, and whether trace is enabled. Do not enable broad production debug or trace without a narrow time window and user confirmation.
- Page View Analysis: use for aggregate request trends and slow-page discovery. Cover the documented report variants: Most Viewed Pages, Application Summary, Monthly Calendar, By Day, By Day and Hour, By User, By Application, By Application and Page, By Page, By User and Page, and By Page and User. Continue to `page-performance.md` or `ir-ig-tuning.md` when the issue is component or report performance.
- Environment: use for workspace/application environment context. Include the Environment report and the About Database report. Do not expose internal URLs, hostnames, schemas, proxy details, or version data unnecessarily.
- Login Attempts: use for authentication triage and suspicious-login review. Treat usernames, IP addresses, and failure messages as sensitive; route generic audit policy or identity-provider investigation to the DB/security or external identity skill.
- Application Errors: use for App Builder error report triage. Continue to `error-handling.md` for APEX error-log and debug correlation.
- Workspace Schema Reports: use for mapped schemas, Schema Tablespace Utilization, Database Privileges, and Workspace Schemas. Keep APEX mapping context here; route generic user creation, grants, quotas, tablespaces, and privilege remediation to the DB skill.
- Web Service Activity Log: use for REST Data Source, Web Source, and outbound web service call activity. Continue to `rest-data-sources.md` for APEX webservice-log analysis. Never print credentials, API keys, bearer tokens, or full secret-bearing URLs.
- Archived Activity: use for historical APEX activity retained by the workspace, including Page Views, By View, By User, By Application, By Weighted Page Performance, By Page Performance, By Application and Page, By Page, By User and Page, and By Page and User. Avoid exporting or pasting bulk logs into chat; summarize counts, time windows, applications, pages, and anonymized patterns.
- Archive of Purged Task Files: use for Team Development task-file archive awareness. Do not retrieve file payloads unless the user explicitly asks and the sensitivity is reviewed.

## Debug And Trace Controls

Use Active Sessions when a workspace administrator needs temporary debug or trace inspection for a current session. The documented debug controls include No Debug, Info, App Trace, Full Trace, and APEX Trace.

Guardrails:

- Ask for the exact workspace, application, user, session, page, and time window before recommending debug or trace changes.
- Prefer the lowest useful debug level and the shortest practical duration.
- Treat trace output and debug messages as sensitive; they can reveal item values, SQL, component names, URLs, bind values, or error text.
- After the investigation, recommend turning Debug or Trace Mode back off.

## Identity And Access

Before MCP-backed monitoring queries, verify the active database identity and classify the work as read-only or change:

```sql
SELECT SYS_CONTEXT('USERENV', 'SESSION_USER') AS session_user,
       SYS_CONTEXT('USERENV', 'CURRENT_USER') AS current_user,
       SYS_CONTEXT('USERENV', 'ISDBA') AS is_dba
FROM dual;
```

For read-only report interpretation, do not block solely because the connection is privileged, but warn that a least-privilege APEX admin or read-only evidence account is preferred. Keep the work read-only.

If the user asks to enable Debug, Trace Mode, purge activity, change retention, change schemas, grant privileges, create users, or alter quotas/tablespaces, reclassify the workflow as a change operation and load the relevant APEX admin or DB reference before proceeding.

## Supported View Discovery

APEX dictionary views and columns vary by release and service. Inspect availability before using SQL-backed report queries:

```sql
SELECT view_name,
       comments
FROM apex_dictionary
WHERE view_name IN (
          'APEX_WORKSPACE_ACTIVITY_LOG',
          'APEX_ACTIVITY_LOG',
          'APEX_DEBUG_MESSAGES',
          'APEX_ERROR_LOG',
          'APEX_WEBSERVICE_LOG',
          'APEX_TEAM_DEV_FILES')
ORDER BY view_name;
```

```sql
SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name IN (
          'APEX_WORKSPACE_ACTIVITY_LOG',
          'APEX_ACTIVITY_LOG',
          'APEX_DEBUG_MESSAGES',
          'APEX_ERROR_LOG',
          'APEX_WEBSERVICE_LOG',
          'APEX_TEAM_DEV_FILES')
ORDER BY table_name,
         column_id;
```

## Report-To-Reference Routing

- Page Views, Active Sessions, Page View Analysis, Archived Activity: `activity-log.md`
- Application Errors, Debug, Trace Mode: `error-handling.md`
- Web Service Activity Log: `rest-data-sources.md`
- Page or component latency: `page-performance.md`, `ir-ig-tuning.md`
- Workspace schemas and mappings: `../workspace/schema-mapping.md`
- Database privileges, users, quotas, tablespaces, auditing, or identity-provider investigation: announce the DB skill handoff before generating generic DB steps.

## Security Review

Before sharing results, check:

- No passwords, tokens, API keys, authorization headers, or credential values are shown.
- Usernames, IP addresses, URLs, hostnames, schemas, error text, and request values are limited to what the user needs.
- Debug or trace recommendations are scoped to a narrow user, app, page, and time window.
- Bulk logs are summarized instead of pasted.
- Generic DB remediation is routed to the DB skill with a visible handoff message.
