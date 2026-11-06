# Dynamic Actions Templates

## Purpose
Canonical dynamic action documentation for declarative client behavior and guarded server-side integration patterns.

## Usage
- Load `dynamic-actions._common.md` first to align variable contracts, guardrails, and required inputs.
- Prefer declarative actions and keep API/package invocations aligned with invokeApi-first governance in data/logic rules.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.
- For dialog workflows, choose templates by lifecycle intent:
  - Cancel dialog interaction (client-side): `dynamic-actions.cancel-dialog.md`
  - Submit current page from client event: `dynamic-actions.submit-page.md`
  - Close dialog after server-side submit processing: `dynamic-actions.close-dialog.md` plus `../processes/processes.close-dialog.md`

## Template Catalog
- `dynamic-actions._common.md`
- `dynamic-actions.add-remove-class-item.md`
- `dynamic-actions.add-remove-class.md`
- `dynamic-actions.alert-confirm-cancel.md`
- `dynamic-actions.cancel-dialog.md`
- `dynamic-actions.close-dialog.md`
- `dynamic-actions.delete-with-notification.md`
- `dynamic-actions.enable-disable-items.md`
- `dynamic-actions.execute-server-side-code.md`
- `dynamic-actions.execution-debounce-throttle.md`
- `dynamic-actions.generate-text-ai.md`
- `dynamic-actions.refresh-region-after-api.md`
- `dynamic-actions.refresh-region-after-dialog.md`
- `dynamic-actions.refresh-region-on-change.md`
- `dynamic-actions.set-focus-on-ready.md`
- `dynamic-actions.submit-page.md`
- `dynamic-actions.set-value-javascript-expression.md`
- `dynamic-actions.set-value-plsql-function.md`
- `dynamic-actions.set-value-sql.md`
- `dynamic-actions.set-value-static.md`
- `dynamic-actions.show-error-message.md`
- `dynamic-actions.show-hide-items.md`
- `dynamic-actions.show-ai-assistant.md`
- `dynamic-actions.show-success-message.md`
- `dynamic-actions.view-document-inline.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Revalidate action recommendations when guardrails for invokeApi, conditions, or client behavior policies change.
- New or updated scenario templates (`dynamic-actions.*.md` except `_common`) should include:
  - `# Settings Contract`
  - `# Conditional Rendering Rules`
  - `# Event & Execution Semantics`
  - `# Validation Checklist`

## Router Cheat Sheet
- "Submit the page when item changes/click happens": `dynamic-actions.submit-page.md`
- "Cancel button should close the dialog without submit": `dynamic-actions.cancel-dialog.md`
- "Close dialog only after successful CREATE/SAVE/DELETE": `dynamic-actions.close-dialog.md` + `../processes/processes.close-dialog.md`
- "Refresh parent region after dialog closes": `dynamic-actions.refresh-region-after-dialog.md`
- "Generate text with AI from a service prompt, AI Agent, item, or JavaScript input": `dynamic-actions.generate-text-ai.md`
