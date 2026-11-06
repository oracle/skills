---
templateId: ai-agents.ai-tools.execute-code-client-js.md
componentType: aiAgents
version: 1.0
description: AI Tool used to execute JavaScript code
imports:
  - ai-agents.at-tools.parameters.md
---

# Purpose

Standard AI Agent contract for action-oriented tools that execute client-side JavaScript.

This tool is intended for browser-side interactions or validations that should run on demand.

---

# Generation Rules (MANDATORY)

1. Replace the `{{parameters}}` section with a list of concrete parameters from `ai-agents.at-tools.parameters.md`.
2. Keep JavaScript concise and deterministic.
3. Use `settings.jsCode` for executable logic and keep the implementation focused on a single client-side responsibility.
4. For `executionPoint: augmentSystemPrompt`, render `settings.jsCode` inline as a scalar value and do not use a fenced JavaScript block.
5. For `executionPoint: augmentSystemPrompt`, omit the top-level `description:` property unless runtime metadata proves it is accepted for that execution point.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| name | yes | string | Static ID of the AI tool; lower case, no spaces, use `-`. |
| tool.name | yes | string | Friendly execution name; lower case, no spaces, use `_`. |
| description.description | no | string | Description of the tool; recommended because this acts as the prompt for the tool
| notification.message | no | string | Optional notification displayed once the tool has completed |
| notification.type | no | string | Notification type: `info`, `generic`, or `success` |
| executionPoint | yes | enum | Use `onDemand` for interactive browser-side actions. Use `augmentSystemPrompt` for lightweight context captured on every prompt, such as browser timezone. |
| settings.jsCode | yes | string | JavaScript code executed by the tool on the client. Render inline for `augmentSystemPrompt`; render fenced for `onDemand`. |

---

# Conditional Rendering Rules

- Only render `notification {}` if there is a value.
- For `augmentSystemPrompt`, do not render `description`, `notification`, or `parameter` blocks.
- All other sections should always be rendered.

---

# Output Template — AI Tool

## On Demand
```
    tool {{name}} (
        name: {{tool.name}}
        type: executeClientsideCode
        executionPoint: onDemand
        description:
            ```
            {{description}}
            ```
        {{notificationBlock}}
        settings {
            jsCode:
                ```javascript-browser
                {{settings.jsCode}}
                ```
        }
        {{parameters}}

    )
```

## Augment System Prompt
```
    tool {{name}} (
        name: {{tool.name}}
        type: executeClientsideCode
        executionPoint: augmentSystemPrompt
        settings {
            jsCode: {{settings.jsCode}};
        }

    )
```

---
