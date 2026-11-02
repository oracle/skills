---
templateId: ai-agents.ai-tools.retrieve-data-sql.md
componentType: aiAgents
version: 1.0
description: AI Tool used to retrieve data via SQL Query
imports:
  - ai-agents.at-tools.parameters.md
---

# Purpose

Standard AI Agent contract for data-retrieval tools.

This tool will retrieve data based on the results of a SQL query.

---

# Generation Rules (MANDATORY)

1. Replace the `{{parameters}}` section with a list of concrete parameters from `ai-agents.at-tools.parameters.md`.
2. For any structured lookup or filter input that can be named up front, declare one or more explicit `parameter (...)` blocks and bind those parameters inside `settings.sqlQuery`.
3. Do not use `:APEX$AI_LAST_USER_PROMPT` or `:APEX$AI_ALL_USER_PROMPTS` as a surrogate for explicit tool parameters when the tool is expected to accept stable business inputs such as IDs, numbers, codes, names, statuses, types, dates, or other declarative filters.
4. Use `:APEX$AI_LAST_USER_PROMPT` or `:APEX$AI_ALL_USER_PROMPTS` only when the tool genuinely needs free-text reasoning support that cannot be represented cleanly as explicit parameters, such as fallback keyword ranking, semantic hinting, or broad exploratory search approved by the workflow.
5. Keep SQL deterministic and scoped to the tool's purpose.
6. When querying real tables or views, use metadata-verified columns only and align with the database rules in `references/policies/memory-bank/00-guard/ai.guard.md`.
7. Keep the raw body of `settings.sqlQuery` at or below 4000 characters.
8. If the SQL body would exceed 4000 characters:
   - move prompt-independent joins, aggregations, and normalization into secure view(s)
   - keep `settings.sqlQuery` as a short wrapper query over those view(s)
   - if the tool legitimately uses `:APEX$AI_LAST_USER_PROMPT` or `:APEX$AI_ALL_USER_PROMPTS`, keep only the prompt-aware filtering or scoring logic inline
9. If the wrapper still cannot be reduced below 4000 characters, stop with Missing Inputs instead of emitting oversized inline SQL.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| name | yes | string | Static ID of the AI tool; lower case, no spaces, use `-`. |
| tool.name | yes | string | Friendly execution name; lower case, no spaces, use `_`. |
| description.description | no | string | Description of the tool; optional, but strongly recommended as this acts as the prompt for the tool
| notification.message | no | string | Specify an optional notification to be displayed once the tool has completed.
| notification.type | no | string | Specify the type of notification: `info`, `generic` or `success`
| settings.dataDescription | no | string | Enter a brief description of the data that will be sent to the AI service. This description should clearly explain the nature and content of the data being provided, helping the AI to better understand and process the information.
| settings.sqlQuery | yes | string | Specify the SQL query that generates the CSV output as context for the AI service. Keep the raw body at or below 4000 characters. Prefer explicit tool parameters for stable inputs and bind them directly in the SQL. Use the special prompt binds only for approved free-text reasoning scenarios that cannot be modeled cleanly as parameters: **APEX$AI_LAST_USER_PROMPT** contains the most recent user-entered prompt and **APEX$AI_ALL_USER_PROMPTS** contains all user prompts concatenated together. |
| serverSideCondition.type | no | string | Use only supported condition types from `references/policies/memory-bank/20-data/apex.logic.md`. |
| serverSideCondition.list | no | string |
| security.authorizationScheme | no | string | The name of the Authorization Scheme associated with this tool

---

# Conditional Rendering Rules

- Only render `notification {}` if there is a value.
- Only render `settings.dataDescription` if there is a value.
- Only render `serverSideCondition {}` if there is a value.
- Only render `security {}` if there is a value.
- When the tool accepts structured business filters, render explicit `parameter (...)` blocks and bind those parameters in the SQL instead of reading the raw prompt text directly.
- All other sections should always be rendered.

---

# Guardrail Notes

- Treat explicit tool parameters as the default contract for business lookup inputs.
- Do not encode stable business filters by parsing `:APEX$AI_LAST_USER_PROMPT` or `:APEX$AI_ALL_USER_PROMPTS` when those filters can be modeled as parameters.
- If both explicit parameters and prompt binds appear in the same retrieve-data tool, the prompt binds must be justified as secondary free-text assistance rather than the primary input path.

---

# Output Template — AI Tool
```
    tool {{name}} (
        name: {{tool.name}}
        type: retrieveData
        executionPoint: onDemand
        description:
            ```
            {{description}}
            ```
        {{notificationBlock}}
        settings {
            {{dataDescriptionBlock}}
            sqlQuery:
                ```sql
                {{settings.sqlQuery}}
                ```
        }
        {{serverSideConditionBlock}}
        {{securityBlock}}

        {{parameters}}

    )
```

---


