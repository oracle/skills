# Component Registry — Buttons

| Keyword/Synonym | Template/Skill | Notes |
|-----------------|----------------|-------|
| button | `templates/buttons/buttons._index.md` | Generic button dispatcher |
| translation button | `references/domains/page-components/buttons/workflow-button-batch.md` | Clarify runtime language switching vs localization; runtime switch defaults to submit button plus guarded page process |
| primary button | `templates/buttons/buttons.appearance-icon.md` | Primary action styling; emits `hot: true` |
| delete button | `templates/buttons/buttons.submit.md` + `templates/buttons/buttons.confirmation.md` | Delete confirmation |
| menu button | `templates/buttons/buttons.menu.md` | Menu entries and nested options |
| remove button component | `references/domains/page-components/buttons/workflow-button-batch.md` | Hard-delete button component with dependency checks (single or batch) |
| button actions batch | `references/domains/page-components/buttons/workflow-button-batch.md` | Apply/remove actions and component removals (single or batch) |
| dynamic action refresh | `templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md` | For button-triggered refresh |

When business logic (invokeApi, SSC, validations) is required, coordinate with `references/domains/README.md` and `references/domains/README.md`.
