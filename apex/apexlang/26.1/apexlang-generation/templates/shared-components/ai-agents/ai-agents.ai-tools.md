---
templateId: ai-agents.ai-tools
componentType: aiAgents
version: 1.0
description: Canonical contract and guardrails for AI Agent tools
---

# Purpose

Standard AI Agent tools contract; required as a parent container for all AI tools.

This document lists the available AI tools and describes the function of each one.


| Tool | Filename | Description |
|------|----------|-------------|
| Retrieve Data via SQL | `ai-agents.ai-tools.retrieve-data-sql.md` | Retrieves data from the database as CSV output
| Augment System Prompt | `ai-agents.ai-tools.augment-system-prompt.md` | Retrieves data from the database and used that to augment the system prompt
| Execute Server-Side PL/SQL | `ai-agents.ai-tools.execute-code-server-plsql.md` | Executes server-side PL/SQL to update or validate application data
| Execute Server-Side JavaScript | `ai-agents.ai-tools.execute-code-server-js.md` | Executes server-side JavaScript in the database using MLE
| Execute Client-Side JavaScript | `ai-agents.ai-tools.execute-code-client-js.md` | Executes client-side JavaScript in the browser for on-demand interactions or validations




## Rules

1. Tools that use PL/SQL can refer to parameters using the `:PARAMETER_NAME` syntax.
2. Keep tool static IDs (`tool <id>`) lower case with `-` separators when needed.
3. Keep tool execution names (`name:`) lower case with `_` separators when needed.
4. Use `ai-agents.at-tools.parameters.md` for parameter blocks instead of inventing custom parameter shapes.
5. Use only documented blocks and attributes so generated output stays aligned with the shared-component template rules.
6. Augment System Prompt tools use inline scalar settings syntax:
   - Retrieve Data: `dataDescription: ...` and `sqlQuery: select ...;`
   - Execute Client-Side Code: `jsCode: return ...;`
   - Do not emit fenced code blocks, top-level `description`, notifications, or parameters for Augment System Prompt tools.
