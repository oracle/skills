---
templateId: ai-agents.ai-tools.execute-code-server-js.md
componentType: aiAgents
version: 1.0
description: AI Tool used to execute server-side JavaScript code
imports:
  - ai-agents.at-tools.parameters.md
---

# Purpose

Standard AI Agent contract for action-oriented tools that execute server-side JavaScript.

This tool is intended for server-side updates or validations that should run on demand.

---

# Generation Rules (MANDATORY)

1. Replace the `{{parameters}}` section with a list of concrete parameters from `ai-agents.at-tools.parameters.md`.
2. Keep JavaScript concise and deterministic.
3. Use `settings.jsCode` for executable logic and keep the implementation focused on a single tool responsibility.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| name | yes | string | Static ID of the AI tool; lower case, no spaces, use `-`. |
| tool.name | yes | string | Friendly execution name; lower case, no spaces, use `_`. |
| description.description | no | string | Description of the tool; recommended because this acts as the prompt for the tool
| notification.message | no | string | Optional notification displayed once the tool has completed |
| notification.type | no | string | Notification type: `info`, `generic`, or `success` |
| settings.jsCode | yes | string | JavaScript code executed by the tool |

---

# Conditional Rendering Rules

- Only render `notification {}` if there is a value.
- All other sections should always be rendered.

---

# Output Template — AI Tool
```
    tool {{name}} (
        name: {{tool.name}}
        type: executeServersideCode
        executionPoint: onDemand
        description:
            ```
            {{description}}
            ```
        {{notificationBlock}}
        settings {
            language: js-mle
            jsCode:
                ```javascript-mle
                {{settings.jsCode}}
                ```
        }

        {{parameters}}

    )
```

---
