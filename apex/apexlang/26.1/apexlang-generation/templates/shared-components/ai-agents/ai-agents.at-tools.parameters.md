---
templateId: ai-agents.ai-tools.parameters
componentType: aiAgents
version: 1.0
description: Canonical contract and guardrails for AI Tool parameters.
---

# Purpose

Standardize how AI Tool parameters are documented and rendered inside `tool (...)` blocks.

This file provides the shared parameter contract for AI-agent tool templates such as:

- `ai-agents.ai-tools.retrieve-data-sql.md`
- `ai-agents.ai-tools.execute-code-client-js.md`
- `ai-agents.ai-tools.execute-code-server-js.md`
- `ai-agents.ai-tools.execute-code-server-plsql.md`

---

# Generation Rules (MANDATORY)

1. Render parameter definitions only inside an AI Tool block.
2. Each parameter must use the shape `parameter <STATIC_ID> ( ... )`.
3. Parameter static IDs should be uppercase with underscores when emitted from examples in this file.
4. Use `value {}` to define parameter metadata such as `dataType`.
5. Use `validation {}` for parameter validation attributes such as `required` and `allowedValues`.
6. Omit optional attributes when they are not needed.
7. `allowedValues` must be expressed as a JSON-style array literal when present.
8. Use only supported scalar data types shown in this file unless the AI Tool feature set is expanded elsewhere in this template family.
9. When a retrieve-data tool has stable business lookup inputs, define them as explicit parameters here instead of expecting SQL to derive them from `:APEX$AI_LAST_USER_PROMPT` or `:APEX$AI_ALL_USER_PROMPTS`.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| parameter.staticId | yes | string | Parameter identifier rendered after `parameter`; prefer uppercase with underscores in examples. |
| parameter.description | yes | string | Human-readable explanation of the parameter purpose. |
| value.dataType | optional | enum | Include when the parameter type is known. Supported examples in this file: `boolean`, `clob`, `number`, `varchar2`. |
| validation.allowedValues | optional | string | JSON-style array string restricting accepted values, for example `"[\"A\",\"B\"]"`. |
| validation.required | optional | boolean | Defaults to required when omitted; set `false` to make the parameter optional. |

---

# File Structure

Use this file as a parameter snippet library for AI Tool templates.

## Folder Placement

- Canonical path: `templates/shared-components/ai-agents/ai-agents.at-tools.parameters.md`

## Relationship to Other Files

- Imported by AI Tool templates that need reusable parameter examples
- Referenced from:
  - `ai-agents.ai-tools.retrieve-data-sql.md`
  - `ai-agents.ai-tools.execute-code-client-js.md`
  - `ai-agents.ai-tools.execute-code-server-js.md`
  - `ai-agents.ai-tools.execute-code-server-plsql.md`

## Expected Usage

1. Load the parent AI Tool template.
2. Select the parameter patterns needed for the tool being generated.
3. Replace placeholder names and descriptions with concrete tool-specific values.
4. Omit example parameter blocks that are not needed by the target tool.

---

# Conditional Rendering Rules

- Render `value {}` only once per parameter.
- Render `dataType` only when a concrete type is known.
- Render `validation {}` only when validation metadata is needed.
- Render `required: false` only for optional parameters, and place it inside `validation {}`.
- Render `allowedValues` only when the tool input must be constrained to a known set, and place it inside `validation {}` as a JSON-style string.
- Do not emit empty `value {}` or `validation {}` blocks.

---

# Output Template — Parameter

```
        parameter {{parameter.staticId}} (
            description: {{parameter.description}}
            {{valueBlock}}
            {{validationBlock}}
        )
```

---

# Output Examples

## Boolean Parameter

```
        parameter BOOLEAN_FLAG (
            description: Boolean flag example
            value {
                dataType: boolean
            }
        )
```

## CLOB Parameter

```
        parameter LARGE_TEXT (
            description: Large text example
            value {
                dataType: clob
            }
        )
```

## Number Parameter With Allowed Values

```
        parameter STATUS_CODE (
            description: Numeric status example
            value {
                dataType: number
            }
            validation {
                allowedValues: "[1,2,3]"
            }
        )
```

## Varchar2 Parameter With Allowed Values

```
        parameter CATEGORY_CODE (
            description: Text category example
            value {
                dataType: varchar2
            }
            validation {
                allowedValues: "[\"AAA\",\"BBB\",\"CCC\"]"
            }
        )
```

## Optional Parameter

```
        parameter OPTIONAL_NOTE (
            description: Optional text example
            value {
                dataType: varchar2
            }
            validation {
                required: false
            }
        )
```

---

# Guardrails Reminder

- Keep parameter definitions tool-specific when generating final APEXlang.
- Prefer clear business descriptions over generic placeholder text in real tool artifacts.
- Do not invent unsupported parameter attributes outside the documented `value {}` and `validation {}` structures.
- When `allowedValues` is used, emit it only inside `validation {}` and format it as a JSON-style string literal.
- Prefer explicit parameter blocks for IDs, numbers, codes, names, statuses, types, dates, and other structured filters that the agent can collect or infer before tool execution.
- Do not treat the raw AI prompt text as the primary parameter channel when the tool contract can express the inputs declaratively.
