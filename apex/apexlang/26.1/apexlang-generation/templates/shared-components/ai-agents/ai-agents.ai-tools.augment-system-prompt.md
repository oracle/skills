---
templateId: ai-agents.ai-tools.augment-system-prompt.md
componentType: aiAgents
version: 1.0
description: AI Tool used to retrieve data to augment the system prompt
---

# Purpose

Standard AI Agent contract for data-retrieval tool to augment the system prompt.

This tool will retrieve data based on the results of a SQL query and use that to augment the system prompt.  This is useful for dynamic content that is specific to a user or scenario.

---

# Generation Rules (MANDATORY)

1. Keep SQL deterministic and scoped to the tool's purpose.
2. When querying real tables or views, use metadata-verified columns only and align with the database rules in `references/policies/memory-bank/00-guard/ai.guard.md`.
3. Render Augment System Prompt tool settings as inline scalar properties. Do not wrap `settings.dataDescription`, `settings.sqlQuery`, or client-side `settings.jsCode` in fenced code blocks.
4. Do not emit a top-level `description:` property for Augment System Prompt tools unless runtime metadata proves it is accepted for that execution point; use `settings.dataDescription` for retrieve-data context.
5. Keep `settings.sqlQuery` short enough to fit inline on the property value. Prefer a compact one-line query for Augment System Prompt tools.
6. Keep the raw body of `settings.sqlQuery` at or below 4000 characters.
7. If the SQL body would exceed 4000 characters:
   - move prompt-independent joins, aggregations, and normalization into secure view(s)
   - keep `settings.sqlQuery` as a short wrapper query over those view(s)
   - when the tool uses `:APEX$AI_LAST_USER_PROMPT` or `:APEX$AI_ALL_USER_PROMPTS`, keep only the prompt-aware filtering or scoring logic inline
8. If the prompt-aware wrapper still cannot be reduced below 4000 characters, stop with Missing Inputs instead of emitting oversized inline SQL.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| name | yes | string | Static ID of the AI tool; lower case, no spaces, use `-`. |
| tool.name | yes | string | Friendly execution name; lower case, no spaces, use `_`. |
| settings.dataDescription | no | string | Inline scalar description of the data sent to the AI service. Do not use a fenced block. |
| settings.sqlQuery | yes | string | Inline scalar SQL query ending with `;`. Do not use a fenced block. Keep at or below 4000 characters; if more logic is required, move prompt-independent work into secure view(s) and keep this query as a short wrapper. |
| serverSideCondition.type | no | string | Use only supported condition types from `references/policies/memory-bank/20-data/apex.logic.md`. |
| serverSideCondition.list | no | string |
| security.authorizationScheme | no | string | The name of the Authorization Scheme associated with this tool

---

# Conditional Rendering Rules

- Only render `settings.dataDescription` if there is a value, and render it as `dataDescription: ...` on one line.
- Only render `serverSideCondition {}` if there is a value.
- Only render `security {}` if there is a value.
- Render `settings.sqlQuery` as `sqlQuery: {{settings.sqlQuery}};` without triple backticks.
- All other sections should always be rendered.

---

# Output Template — AI Tool
```
    tool {{name}} (
        name: {{tool.name}}
        type: retrieveData
        executionPoint: augmentSystemPrompt
        settings {
            dataDescription: {{settings.dataDescription}}
            sqlQuery: {{settings.sqlQuery}};
        }
        {{serverSideConditionBlock}}
        {{securityBlock}}
    )
```

---
