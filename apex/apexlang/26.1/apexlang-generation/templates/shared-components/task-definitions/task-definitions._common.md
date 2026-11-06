---
templateId: shared-components.task-definitions.common
componentType: shared-component
version: 1.0
description: Canonical contract for Human Task definitions (approval and action types).
---

# Purpose
Define human task shared components with explicit outcomes, participant resolution, completion actions, and details-page linking.

# Required Inputs
- task definition static ID and name
- task type (`approval` or `action`)
- details page target page and task-id item mapping
- participant resolution query

# Guardrails
- Do not hardcode usernames.
- Completion handling belongs in task actions.
- Keep details-page linkage aligned with task-details page template family.
- Treat successful APEX import behavior and proven imported task-definition artifacts in the active target app as higher authority than stale markdown examples.
- Prefer the structured `advanced { detailsPage: { ... } }` object form used throughout this task-definition family. Do not default to a string `f?p=...` `detailsPage` value for new task definitions.
- For ordinary approver/owner resolution, start with a minimal `participant ( value { ... } )` block. Add participant `type:` overrides only when the workflow explicitly needs special roles such as `businessAdministrator`.
- Keep new task definitions minimal first: `name`, top-level `type`, `task { subject ... }`, optional `source { ... }`, `advanced { detailsPage: { ... } }`, and one or more `participant` blocks. Add `deadline`, `parameter`, and `action` blocks only when requirements call for them.

# Proven Shape

Use this baseline shape for new task definitions unless a proven imported example requires more:

```apexlang
taskDefinition TASK_NAME (
    name: Task Name
    type: approval
    task {
        subject: Task Subject
    }
    advanced {
        detailsPage: {
            page: 10
            items: {
                P10_TASK_ID: &TASK_ID.
            }
            clearCache: 10
            action: resetPagination
        }
    }

    participant (
        value {
            type: expression
            plsqlExpression: some_package.get_participant(:APEX$TASK_PK)
        }
    )
)
```

# Debugging Notes

- If import succeeds but worksheet lint still raises `ORA-40441: JSON syntax error` on line 1 for a standalone `taskDefinition` file, treat the import-success path as authoritative and compare against imported task-definition artifacts in the active target app before changing the artifact.
- If a new task definition fails import, compare it directly against:
  - imported task-definition artifacts that already work in the same target app
  - the structured `detailsPage` object form and minimal `participant` patterns shown in this family
