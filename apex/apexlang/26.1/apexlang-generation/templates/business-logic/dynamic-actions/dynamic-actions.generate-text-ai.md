---
templateId: dynamic-actions.generate-text-ai
componentType: dynamicAction
version: 1.0
imports:
  - dynamic-actions._common
description: Generate text with AI using a Generative AI service or AI Agent, then route the generated response to an item or browser JavaScript.
---

# Purpose

Call a configured Generative AI service or AI Agent from a dynamic action, using either the system prompt alone, a page item value, or a JavaScript expression as input. Capture the generated text in a page item or process it with browser JavaScript. Use `genAI.service` with `genAI.systemPrompt` for direct prompt calls; use `genAI.agent` for advanced RAG or agent-backed generation.

---

# Output Template - Prompt Input, Item Response
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: {{when.event}}
        selectionType: button
        button: @{{when.button}}
    }
    action {{action.name}} (
        action: generateTextWithAi
        genAI {
            service: @{{genAI.service}}
            systemPrompt:
                ```
                {{genAI.systemPrompt}}
                ```
            itemsToSubmit: {{genAI.itemsToSubmit}}
        }
        inputValue {
            type: onlySystemPrompt
        }
        useResponse {
            item: {{useResponse.item}}
        }
        execution {
            sequence: {{action.execution.sequence}}
            fireOnInit: false
        }
    )
)
```

# Output Template - Item Input, JavaScript Response
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: {{when.event}}
        selectionType: button
        button: @{{when.button}}
    }
    action {{action.name}} (
        action: generateTextWithAi
        genAI {
            service: @{{genAI.service}}
            systemPrompt:
                ```
                {{genAI.systemPrompt}}
                ```
            itemsToSubmit: {{genAI.itemsToSubmit}}
        }
        inputValue {
            item: {{inputValue.item}}
        }
        useResponse {
            type: jsCode
            jsCode:
                ```javascript-browser
                const response = this.data.response;
                {{useResponse.jsCode}}
                ```
        }
        execution {
            sequence: {{action.execution.sequence}}
            fireOnInit: false
        }
    )
)
```

# Output Template - JavaScript Input, JavaScript Response
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: {{when.event}}
        selectionType: button
        button: @{{when.button}}
    }
    action {{action.name}} (
        action: generateTextWithAi
        genAI {
            service: @{{genAI.service}}
            systemPrompt:
                ```
                {{genAI.systemPrompt}}
                ```
            itemsToSubmit: {{genAI.itemsToSubmit}}
        }
        inputValue {
            type: jsCode
            javaScriptExpression: {{inputValue.javaScriptExpression}}
        }
        useResponse {
            type: jsCode
            jsCode:
                ```javascript-browser
                const response = this.data.response;
                {{useResponse.jsCode}}
                ```
        }
        execution {
            sequence: {{action.execution.sequence}}
            fireOnInit: false
        }
    )
)
```

# Output Template - AI Agent Input, JavaScript Response
```
dynamicAction {{dynamicActionStaticId}} (
    name: {{name}}
    execution {
        sequence: {{execution.sequence}}
    }
    when {
        event: {{when.event}}
        selectionType: button
        button: @{{when.button}}
    }
    action {{action.name}} (
        action: generateTextWithAi
        genAI {
            agent: @{{genAI.agent}}
            itemsToSubmit: {{genAI.itemsToSubmit}}
        }
        inputValue {
            item: {{inputValue.item}}
        }
        useResponse {
            type: jsCode
            jsCode:
                ```javascript-browser
                const response = this.data.response;
                {{useResponse.jsCode}}
                ```
        }
        execution {
            sequence: {{action.execution.sequence}}
            fireOnInit: false
        }
    )
)
```

---

# Composable GenAI Blocks

Use exactly one of these blocks inside the `generateTextWithAi` action:

```
genAI {
    service: @{{genAI.service}}
    systemPrompt:
        ```
        {{genAI.systemPrompt}}
        ```
    itemsToSubmit: {{genAI.itemsToSubmit}}
}
```

```
genAI {
    agent: @{{genAI.agent}}
    itemsToSubmit: {{genAI.itemsToSubmit}}
}
```

# Composable Input Blocks

Use exactly one of these blocks inside the `generateTextWithAi` action:

```
inputValue {
    type: onlySystemPrompt
}
```

```
inputValue {
    item: {{inputValue.item}}
}
```

```
inputValue {
    type: jsCode
    javaScriptExpression: {{inputValue.javaScriptExpression}}
}
```

# Composable Response Blocks

Use exactly one of these blocks inside the `generateTextWithAi` action:

```
useResponse {
    item: {{useResponse.item}}
}
```

```
useResponse {
    type: jsCode
    jsCode:
        ```javascript-browser
        const response = this.data.response;
        {{useResponse.jsCode}}
        ```
}
```

---

# Settings Contract

- Required:
  - exactly one AI source variant:
    - direct service: `genAI.service` plus `genAI.systemPrompt`
    - AI Agent: `genAI.agent`
  - exactly one `inputValue` variant: `type: onlySystemPrompt`, `item`, or `type: jsCode` with `javaScriptExpression`
  - exactly one `useResponse` variant: `item` or `type: jsCode` with `jsCode`
  - `action.execution.fireOnInit: false` unless initialization execution is explicitly requested
- Optional:
  - `genAI.itemsToSubmit` when the prompt, substitution references, or input item depends on page-item session state
  - non-button trigger fields from `dynamic-actions._common.md` when the dynamic action is not button-driven
- Forbidden:
  - both `genAI.service` and `genAI.agent` in the same action
  - `genAI.systemPrompt` without `genAI.service`
  - multiple `inputValue` variants in the same action
  - both `useResponse.item` and `useResponse.type: jsCode` in the same action
  - action-level `execution.event`

# Conditional Rendering Rules

- Use `genAI { service: @... systemPrompt: ... }` for direct service calls and reference an existing Generative AI service alias; do not invent service names.
- Use `genAI { agent: @... }` for advanced RAG or agent-backed generation and reference an existing AI Agent alias; do not invent agent names.
- Do not combine `genAI.service` and `genAI.agent` in one `generateTextWithAi` action.
- Include `genAI.itemsToSubmit` when the system prompt references page item substitutions such as `&P1_JSON.` or the input value depends on a page item.
- Remove the `genAI.itemsToSubmit` line when no page-item session state is required.
- For system-prompt-only calls, emit `inputValue { type: onlySystemPrompt }`.
- For page-item input calls, emit `inputValue { item: Pn_ITEM }`.
- For JavaScript input calls, emit `inputValue { type: jsCode javaScriptExpression: ... }`.
- For item responses, emit `useResponse { item: Pn_OUTPUT }` without a `type` property.
- For JavaScript responses, emit `useResponse { type: jsCode jsCode: ... }` and read the generated text from `this.data.response`.

# Event & Execution Semantics

- Keep button launchers on `behavior.action: definedByDynamicAction`.
- Keep `fireOnInit: false` by default; use `true` only when the prompt explicitly asks to run the AI call on initialization.
- Sequence prerequisite actions before `generateTextWithAi` when they prepare the input item or JavaScript state.
- Do not emit action-level `execution.event`; the action inherits the parent dynamic action trigger.

# Validation Checklist

- The referenced `genAI.service` exists in workspace Generative AI services when using direct service generation.
- The referenced `genAI.agent` exists in shared AI Agents when using RAG or agent-backed generation.
- Every item referenced in `genAI.systemPrompt`, `inputValue.item`, or JavaScript input is included in `genAI.itemsToSubmit` when session state is required.
- Exactly one input variant and one response variant are emitted.
- `useResponse.item` points to an existing page item when using item output.
- JavaScript response handlers use `this.data.response`.
- `fireOnInit` is explicitly set.
