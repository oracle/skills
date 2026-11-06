---
templateId: dynamic-actions.submit-page
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Submit page from a dynamic action or triggerAction.
---

# Purpose

Submit the current page declaratively from a client event, so normal submit validations and processes run.

---

# Output Template – Minimal

```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        selectionType: items
        items: {{when.items}}
    }

    action {{action.name}} (
        action: submitPage
        execution {
            sequence: {{action.execution.sequence}}
            event: @{{dynamicActionStaticId}}
            fireOnInit: false
        }
    )
)
```

---

# Output Template – Full

```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: {{when.event}}
        selectionType: {{when.selectionType}}
        button: @{{when.button}}
        items: {{when.items}}
        item: {{when.item}}
        region: @{{when.region}}
    }
    clientSideCondition {
        type: {{clientSideCondition.type}}
        item: {{clientSideCondition.item}}
        value: {{clientSideCondition.value}}
    }
    serverSideCondition {
        type: {{serverSideCondition.type}}
        item: {{serverSideCondition.item}}
        {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
    }

    action {{action.name}} (
        action: submitPage
        execution {
            sequence: {{action.execution.sequence}}
            event: @{{dynamicActionStaticId}}
            fireOnInit: false
        }
    )
)
```

---

# Settings Contract

- Required:
  - none for `submitPage` action itself
- Optional:
  - trigger/event selection fields (`when.*`) and conditions
- Forbidden:
  - unrelated settings payloads (`plsqlCode`, `sqlQuery`, `value`, `code`) on the `submitPage` action

---

# Event & Execution Semantics

- `submitPage` should be the final action in the chain when previous actions set state required for submit.
- Keep `fireOnInit: false` to avoid unintended submit at page load.
- Use client-side conditions to prevent noisy/unwanted submit events.

---

# Conditional Rendering Rules

- Remove `button`, `item`, `items`, `region` keys not used by current `when.selectionType`.
- Omit `serverSideCondition` unless server gating is required.
- Set `comparisonAttribute` to `list` for item colon-list membership types; otherwise use `value`.
- For button-driven submit without a dynamic action, use `button.behavior.action: submitPage` template under `templates/buttons/`.

---

# Validation Checklist

- Action is exactly `submitPage`.
- No unsupported `settings` keys are present on the action.
- `execution.event` points to parent DA alias.
- Submit lifecycle is intentional (validations/processes are expected to run).

---

# Source-Aligned Example

Canonical submit-page example in this template family:

```
dynamicAction da-submit-page (
    name: da-submit-page
    execution {
        sequence: 20
    }
    when {
        selectionType: items
        items: P1_SELECT_LIST
    }

    action native-submit-page (
        action: submitPage
        execution {
            sequence: 10
            event: @da-submit-page
            fireOnInit: false
        }
    )
)
```
