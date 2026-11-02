---
templateId: dynamic-actions.show-ai-assistant
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Show AI Assistant using an AI agent reference.
---

# Purpose

Open AI Assistant from a button click, with an optional inline rendering variant when explicitly requested.

---

# Output Template – Click Variant
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: {{when.event}}
        selectionType: {{when.selectionType}}
        button: {{when.button}}
    }
    action {{action.name}} (
        action: showAiAssistant
        genAI {
            agent: {{genAI.agent}}
        }
        execution {
            sequence: {{action.execution.sequence}}
            event: {{action.execution.event}}
            fireOnInit: {{action.execution.fireOnInit}}
        }
    )
)
```

# Output Template – Inline Variant
```
dynamicAction {{inline.dynamicActionStaticId}} (
    name: {{inline.name}}
    execution {
        sequence: {{inline.execution.sequence}}
    }
    when {
        event: {{inline.when.event}}
    }
    action {{inline.action.name}} (
        action: showAiAssistant
        genAI {
            agent: {{inline.genAI.agent}}
        }
        appearance {
            displayAs: {{inline.appearance.displayAs}}
            containerSelector: {{inline.appearance.containerSelector}}
        }
        execution {
            sequence: {{inline.action.execution.sequence}}
            event: {{inline.action.execution.event}}
            fireOnInit: {{inline.action.execution.fireOnInit}}
        }
    )
)
```

---

# Settings Contract

- Required:
  - `genAI.agent`
- Optional:
  - `appearance.displayAs`
  - `appearance.containerSelector`
  - `action.execution.fireOnInit`
- Forbidden:
  - `genAi.config`
  - button-level `triggerAction` for this pattern

---

# Conditional Rendering Rules

- Use `genAI { agent: @AGENT }` and reference an existing AI agent alias; do not invent agent names.
- Resolve chatbot agent artifacts from `/shared-components/ai-agents/`.
- Keep the inline variant only when a matching container exists (for example, a region with `advanced.htmlDomId: chat`).
- Use the click variant as the default implementation for assistant launch buttons.

---

# Event & Execution Semantics

- Keep click launchers on `behavior.action: definedByDynamicAction`.
- Keep `fireOnInit: false` by default for click launchers; only enable initialization execution when explicitly requested.
- For inline rendering, set `appearance.displayAs: inline` and provide a matching `appearance.containerSelector`.

---

# Validation Checklist

- `genAI.agent` points to an existing agent alias.
- The referenced chatbot agent artifact lives under `/shared-components/ai-agents/`.
- `when.button` references the launcher button when the event is `click`.
- `fireOnInit` is explicitly set when initialization behavior matters.
- Remove the `appearance {}` block from click-only variants.
