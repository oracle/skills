# APEXlang Skill for Oracle APEX

This package is the public Oracle APEXlang skill for Oracle APEX generation work. Consume it like an Oracle skills domain: install or load the domain folder, then start from its root entrypoint.

Start with SKILL.md. It is the main root entry for routing, local context discovery, generation policy, validation behavior, and import approval rules.

## Requirements

- Oracle APEX with APEXlang support, using the latest available 26.1 build.
- SQLcl for real APEXlang validation and import workflows, version 26.1.2 or newer.
- Java 17 or Java 21 for current SQLcl.
- A saved SQLcl connection or a manually supplied `db_connection_name` for Live DB validation, import, and runtime diagnostics. New-app materialization also requires the exact destination APEX workspace name.
- A local Oracle APEX app directory or enough authoritative context for the skill to help create one.

You can read the guidance and draft APEXlang artifacts without SQLcl. Any workflow that validates against Oracle APEX or imports into a workspace requires SQLcl and a resolved `db_connection_name`. The active runtime resolves workspace identity; only ambiguity or new-app materialization requires an explicit workspace choice.

New workspaces do not need a pre-existing `artifacts/` directory. Runtime outputs are created lazily under `APEXLANG_OUTPUT_ROOT` only when a command writes logs, reports, or export backups. Existing `apex-exports/` folders are backup/export material and are ignored for app resolution and generation unless the user explicitly asks to inspect an export backup.

## Use with Oracle DB Skills

Generic Oracle Database, PL/SQL, SQLcl, and utPLSQL guidance is owned by Oracle upstream DB skills at `https://github.com/oracle/skills/tree/main/db`. This package does not replace or duplicate those domains. It bundles only the APEXlang-specific SQLcl runtime adapter needed for app context discovery, APEXlang validation, explicit import, and runtime diagnostics.

## Package Map

| Path | Purpose |
| --- | --- |
| `SKILL.md` | Main root entry and routing contract |
| `assets/` | Routing, workspace-intelligence, metadata, and compiler catalogs |
| `references/` | Workflow, domain, policy, and runtime support guidance |
| `templates/` | APEXlang examples and templates |
| `tools/` | Packaged command entrypoints |
| `runtime/` | Runtime helpers used by packaged commands |

## Prompt Examples by Task

Good prompts name the app, page, component, data evidence, desired behavior, and whether live validation is allowed. For Live DB work, provide `db_connection_name` only when saved-connection discovery cannot resolve one.

### Whole app from beginning to end

```text
Create a new service operations app from my table metadata for APEX workspace SERVICE_OPS_DEV. Include a home page, ticket dashboard, ticket report, ticket edit form, navigation, breadcrumbs, and default security. Check the APEXlang code before any import.
```

### Generate a page

```text
Create a dashboard page for order operations with KPI cards, a monthly revenue chart, and an interactive report. Use existing schema evidence and ask before guessing missing columns.
```

### Page-specific change

```text
On the customer detail page, add a right-side activity summary region, move the Save and Cancel buttons into the page header, and keep existing navigation intact.
```

### Generate a component

```text
Add a shared LOV for active account managers using verified table and column names, then use it on the owner item in the customer form.
```

### Batch changes

```text
Across all editable form pages, add concise help text to required items and add a validation message where users commonly submit incomplete data.
```

### Localization and shared components

```text
Localize and translate my APEX application to Spanish using text messages, create or update the messages artifact, and rewire visible pages accordingly.
```

### Validation and debugging

```text
Check the APEXlang code for my app using db_connection_name apex_dev. If validation reports workspace ambiguity, resolve the workspace from that session. If validation fails, explain the owning layer and suggest the smallest fix.
```

## Basic Workflow

1. Load `SKILL.md`.
2. Resolve the app path and data context; discover a saved SQLcl connection before requesting `db_connection_name` for Live DB work.
3. Generate APEXlang artifacts.
4. Check APEXlang code.
5. Import only after explicit approval.

## Key Packaged Entrypoints

- `SKILL.md` is the north-star routing entrypoint.
- `references/workflows/apex-generation.md` is the broad orchestration workflow.
- `references/workflows/apexlang/prompt-contracts.md` is the shared prompt-contract layer for staged generation and review.
- `references/ops/sqlcl.md` covers the packaged SQLcl runtime adapter.
- `references/policies/compiler-prop-map.md` explains the compiler-backed property policy.
- `tools/query-valid-props.mjs` is the packaged compiler-truth query tool.
- `tools/compiler-truth-audit.mjs` records compiler-truth evidence for generated or revised APEXlang artifacts.
- `tools/apexctl.mjs runtime validate` is the live-validator-first check-only gate. It emits `validation-report.json`, `validation-transcript.log`, `problems.json`, and `component-contracts/<build>.json`.

## Notes

- This README is for Oracle APEXlang skill consumers.
- Do not treat this README as the router. `SKILL.md` owns routing and safety behavior.
- The skill must not invent database objects. Provide table metadata, a data model, a live connection, or exact object details when a request depends on schema facts.
- Live DB workflows require a resolved `db_connection_name`; explicit workspace input is needed only for new-app materialization or runtime-reported ambiguity.
- `artifacts/` is output only, not startup context. `apex-exports/` is backup/export material, not generated source.
