# APEX AI Token Monitoring

Use this reference when the user asks about APEX Generative AI token usage, token limits, remaining tokens, AI service utilization, AI service history, or token consumption per workspace, application, service, or provider.

Official sources:

```text
https://docs.oracle.com/en/database/oracle/apex/26.1/htmrn/new-features.html
https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/creating-generative-ai-service-objects.html
https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/viewing-generative-ai-service-utilization.html
https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/viewing-generative-ai-service-history.html
https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/configuring-ai-attributes-for-an-application.html
https://docs.oracle.com/en/database/oracle/apex/26.1/aeapi/APEX_AI.GET_AVAILABLE_TOKENS-Function.html
https://docs.oracle.com/en/database/oracle/apex/26.1/aeapi/APEX_AI.Data-Types.html
```

APEX 26.1 supports Generative AI token usage limits at instance, workspace, AI service, and vector provider level. Token enforcement depends on whether the AI provider returns token usage information.

## Scope

Keep this work in the APEX admin skill when the task is:

- Inventory APEX AI services and which apps/components use them.
- Review workspace, service, provider, or app AI token limits.
- Check remaining tokens through supported APEX APIs.
- Correlate APEX app/service usage with APEX activity, debug, or web service logs.
- Identify whether per-application token consumption is directly available in the installed APEX version.

Route out of this skill when the task is:

- Provider billing, OCI tenancy billing, model pricing, or external quota management.
- Generic database performance, waits, SQL tuning, ORDS pool behavior, or network analysis.
- Application code changes for custom instrumentation beyond a recommendation.

## Identity Gate

Live MCP-backed checks require the confirmed APEX admin identity from `apex/admin/SKILL.md`. Do not query APEX AI metadata, activity logs, debug logs, or APEX APIs under `SYS`, `SYSTEM`, `SYSDBA`, app parsing schemas, workspace users, ORDS/APEX runtime users, generic deployment users, or unknown accounts.

Static review of APEX exports does not require database access. Announce that boundary before file-only analysis.

## First Questions

Ask only what is needed:

- Which workspace and application IDs or aliases should be reviewed?
- Is the goal remaining tokens, consumed tokens, utilization by app, or limit governance?
- Is the time window needed for usage/history analysis?
- Are AI services shared across apps, or should each app have its own service for clean accounting?

## Discovery

Before assuming view, column, or API availability, inspect the installed APEX version and dictionary.

```sql
SELECT version_no
FROM apex_release;
```

```sql
SELECT view_name,
       comments
FROM apex_dictionary
WHERE UPPER(view_name) LIKE '%AI%'
   OR UPPER(view_name) LIKE '%GEN%'
   OR UPPER(view_name) LIKE '%WEBSERVICE%LOG%'
ORDER BY view_name;
```

```sql
SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE UPPER(table_name) LIKE 'APEX%AI%'
   OR UPPER(table_name) LIKE 'APEX%GEN%AI%'
   OR table_name IN (
          'APEX_APPLICATIONS',
          'APEX_WEBSERVICE_LOG')
ORDER BY table_name,
         column_id;
```

Check public APEX AI API availability before generating API calls.

```sql
SELECT owner,
       package_name,
       object_name,
       argument_name,
       position,
       data_type,
       in_out
FROM all_arguments
WHERE package_name = 'APEX_AI'
  AND object_name IN (
          'GET_AVAILABLE_TOKENS',
          'GENERATE',
          'CHAT')
ORDER BY owner,
         package_name,
         object_name,
         sequence;
```

Do not call internal `WWV_FLOW_%` packages or query internal APEX repository tables as the default path. If the only token-consumption API found is internal or undocumented, state that it is unsupported for this skill and ask whether the user wants a separate, explicitly risk-accepted investigation.

## Remaining Tokens

Use the public `APEX_AI.GET_AVAILABLE_TOKENS` API when available.

Prefer an explicit AI service static ID for MCP/SQLcl checks because there may be no current APEX application runtime context:

```sql
SELECT apex_ai.get_available_tokens(
           p_service_static_id => :service_static_id
       ) AS available_tokens
FROM dual;
```

Without `p_service_static_id`, the function uses the default AI service of the current application context. Do not assume that context exists in a standalone SQLcl or MCP database session.

## Consumed Tokens Per Application

Per-application consumed-token reporting is version- and provider-dependent.

Use this decision order:

1. Prefer documented APEX UI reports such as Generative AI Service Utilization and Generative AI Service History when they provide the needed app, service, time-window, and token columns.
2. Use public `APEX_*` views only after `APEX_DICTIONARY` and `ALL_TAB_COLUMNS` prove that application identifiers and token columns exist in the installed version.
3. If a public procedure or function is discovered for token consumption, inspect its arguments first and use only documented or public APEX APIs.
4. If no public app-level token counter exists, report app-level consumption as unavailable from APEX admin metadata and recommend either service-level accounting or application-side instrumentation.

For any discovered public view with `APPLICATION_ID` plus token columns such as `INPUT_TOKENS`, `OUTPUT_TOKENS`, or `TOTAL_TOKENS`, aggregate only after confirming the exact table and column names:

```sql
-- Shape only. Replace view and column names only after dictionary discovery.
SELECT application_id,
       service_static_id,
       SUM(input_tokens) AS input_tokens,
       SUM(output_tokens) AS output_tokens,
       SUM(total_tokens) AS total_tokens,
       MIN(request_timestamp) AS first_seen,
       MAX(request_timestamp) AS last_seen
FROM <confirmed_public_apex_ai_usage_view>
WHERE request_timestamp >= :from_timestamp
  AND request_timestamp <  :to_timestamp
GROUP BY application_id,
         service_static_id
ORDER BY total_tokens DESC;
```

Do not present service-level totals as per-app totals when multiple applications share the same AI service and the usage evidence does not include `APPLICATION_ID`.

## Application-Side Instrumentation

If APEX admin metadata cannot prove per-app consumption, use APEX application instrumentation as the reliable path. `APEX_AI` response data types expose token fields such as input, output, and total tokens when the provider returns them.

Recommend a small application-owned log table or package wrapper around AI calls that records:

- Application ID and page ID.
- AI service static ID.
- User/session/request context when appropriate.
- Input, output, and total token counts returned by `APEX_AI`.
- Provider/model and timestamp.

Keep implementation details in the APEX application or DB skill as appropriate; this monitoring reference may recommend the pattern but should not own broad application-code changes.

## Interpretation

- Remaining tokens answer "how much quota is left"; they do not prove historical app-level consumption.
- Service utilization answers "where this service is used"; it may not prove exact consumed tokens per app.
- Provider billing can differ from APEX token counters. Treat provider-side invoices and pricing as external evidence.
- Token limits and counters are only meaningful when the provider reports token usage.
- Shared AI services reduce accounting clarity. Use dedicated services or instrumentation when per-app chargeback is required.

## Review Output

Summaries should include:

- Workspace and app scope.
- AI services and whether they are shared.
- Limit level reviewed: instance, workspace, service, vector provider, or application default service.
- Remaining tokens when available.
- Consumed tokens per app only when proven by public APEX metadata or instrumentation.
- Evidence gaps and whether provider token reporting is supported.

## Security Review

- Do not print prompts, completions, embeddings, item values, authorization headers, API keys, OAuth tokens, or credential values unless explicitly required and approved.
- Treat AI prompts and outputs as sensitive application data.
- Do not expose model endpoints, tenancy URLs, or credential static IDs beyond what the user needs.
- Keep provider billing and pricing evidence separate from APEX admin metadata.
