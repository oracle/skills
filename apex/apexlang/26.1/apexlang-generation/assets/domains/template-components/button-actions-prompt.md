# Button Action Batch Workflow

## Summary
- apply: `references/domains/page-components/buttons/workflow-button-batch.md`
- target_type: `button-actions-batch`
- Inputs: action_type, layout defaults, appearance defaults, behavior defaults, target buttons (per page).
- Output: compact run summary under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` when needed, plus button changes staged in the transient temp workspace outside the repo until publish.

## Template Reference
- `templates/buttons/buttons._index.md` — canonical dispatcher.
- `templates/buttons/buttons._common.md` — shared contract and guardrails.
- `templates/buttons/buttons.*.md` — action-specific variants.

## Usage Notes
- Validate slot/region combinations using apex.templates.md.
- Submit buttons still rely on `references/domains/business-logic/processes/workflow-page-processes-batch.md` for invokeApi processes.
- TriggerAction entries must specify nested settings (PL/SQL or download metadata).
- Menu entries should be structured as an array of label/layout/behavior blocks.
