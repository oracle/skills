---
name: apexlang
description: Public APEXlang router with deterministic local-context discovery and compact machine-readable contracts.
---

# Skill — APEXlang

`SKILL.md` is the router. Resolve compact task context before prose.

## Start Order
For an isolated grammar benchmark with a complete request and exact command,
skip this start order, catalogs, workspace probe, and templates. Run only the
selected lookup; the runner may audit afterward outside generation tokens.

1. `assets/routing-catalog-main.json`
2. `assets/routing-load-policy.json`
3. `assets/rules.catalog.json`
4. `assets/apexlang/domains-catalog.json`
5. `assets/workspace-intelligence.json`
6. Run `node tools/apexctl.mjs workspace probe`.
7. The temp-runtime `context-resolution.json` report under `APEXLANG_OUTPUT_ROOT`, when present

Use these package-root assets; ignore legacy aliases.

## Local Context Contract
- Discovery boundary is the current local AI tooling session directory only.
- Prefer authoritative offline context from metadata definitions, data models, or API contracts.
- Treat `specs/`, `requirements/`, and prose as hints; never infer structure from them.
- Treat `artifacts/` as optional runtime output only. Do not require it before generation starts and do not use it as source context.
- Treat any `apex-exports` path segment as backup/export material only. Ignore it except for explicit export inspection, migration, or recovery.
- All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.
- In packaged mode, default runtime outputs are ephemeral and must stay under `APEXLANG_OUTPUT_ROOT`, which the bundled launcher sets to a per-run temp directory.
- When app or page scope appears with translation, localization, target-language, `messages.apx`, or `APP_TEXT$` wording, route first to the shared-components translation guidance before generic page/app generation references.
- Plain app/page localization requests must be satisfied by text-message conversion plus `&APP_TEXT$...` consumption rewiring. Do not satisfy them by inserting direct translated literals into component attributes.
- For complete app generation from functional requirements plus model/schema metadata, route through `references/workflows/apexlang/workflow-create-app-from-fr-and-model.md` and complete `references/workflows/apexlang/application-spec.template.md` into `.apexlang/application-spec.md`, including an Application Composition Plan, before drafting non-trivial `.apx` artifacts.
- Use resolver projections before Markdown. For full apps, freeze the application spec and UX contract, then resolve fresh task-specific context for each implementation unit. Follow `assets/contracts/package-layers.json`.
- Keep the raw grammar, full guard, component registry, repair catalog, and template tree out of model context; use tool projections.

## App Location Contract
- For app-scoped work, resolve the target APEX app before reading or editing app files.
- Standard apps may live under `applications/<app>/`, but packaged skill work must not assume that directory exists.
- Use `node tools/apexctl.mjs workspace probe` as the first app-resolution step for packaged/public workflow decisions.
- If `applications/` is missing, stop with Missing Inputs and ask for the exact app directory or a bounded directory to scan.
- If `applications/` exists but contains no app yet and authoritative offline context is present, treat that as `create_new_allowed`, ask the user to specify the destination APEX workspace name, record the selection in the session `context-resolution.json` under `db_context.workspace`, use the probe result `suggested_app_path`, and run `node tools/apexctl.mjs new-app materialize --app-path <path>` before app-local edits.
- Treat generation of `deployments/default.json` as blocked until the exact destination APEX workspace name is present in session context or passed explicitly with `--workspace-name`. Do not guess it from the app name, parsing schema, scaffold seed, or any nearby identifier.
- If multiple standard apps or multiple nonstandard app candidates are found, stop with Missing Inputs and ask for the exact app directory.
- If exactly one nonstandard app candidate is found, ask the user to confirm the exact target app before app-scoped reads or edits.
- Do not create an `applications/` directory in the package or silently relocate a nonstandard app.
- For brand new applications, publish only named runtime artifacts into `applications/<app>/`: `.apex/`, `application.apx`, `deployments/`, `page-groups.apx`, `pages/`, `shared-components/`, and `supporting-objects/`.
- Treat `templates/base-app-structure/` root files as template docs and metadata only. `README.md`, `base-app-structure._common.md`, `base-app-structure._index.md`, `base-app-structure.registry.json`, and `base-app-runtime-seed.manifest.json` must stay at the root and must never appear in generated app roots.
- Treat `templates/base-app-structure/scaffold-example/**` as the executable scaffold source. Materialize only manifest-declared runtime entries from `base-app-runtime-seed.manifest.json`.
- The `scaffold-example/` container itself must never appear in a generated app root.
- Do not use external repo examples when `templates/base-app-structure/scaffold-example/**` already provides the scaffold source.

## Runtime Contract
- Use `node tools/apexctl.mjs runtime preflight` from the packaged skill root to evaluate runtime candidates.
- Use `node tools/apexctl.mjs runtime validate --app-path <absolute_app_path> --db-connection-name <db_connection_name> --apex-root <resolved_build_root> [--compiler-oracle-home <compiler_metadata_home>]` as the public check-only gate for generated apps. `--apex-root` selects the APEX/SQLcl runtime; `--compiler-oracle-home` overrides only compiler-truth metadata discovery.
- Live APEX validation is authoritative; missing runtime inputs or live evidence records `LIVE_RUNTIME_VALIDATION_REQUIRED_001` and blocks completion.
- Local lint, compiler-truth, and VS Code Problems snapshots are diagnostics after a live pass; missing snapshots are `not_provided`.
- Resolve `problems.json` with `node tools/apexctl.mjs context repair --problems <path>`, which projects matching `assets/validator-fix-recipes.json` entries; apply them and rerun validation.
- For every APEXlang artifact generation, mutation, checking, debugging, or runtime workflow: Default to checking APEXlang code only. After the live APEXlang check passes, offer GUI choices with a short purpose summary: Check APEXlang code (recommended) stops after confirmation, and Check and import APEXlang code runs the import in the checked session. If GUI choices are unavailable, stop after checking the code and report import as a follow-up.
- Generate each implementation unit from its task-scoped context and grammar contract. Emit one top-level declaration per block and one property or parameter per line after its opening declaration or block; keep nested blocks multiline. Run `node tools/apexctl.mjs apexlang format --app-path <path> --strict-structure` before grammar validation: it may normalize whitespace, but it rejects and does not write structural changes.
- Reuse a canonical template directly only when the component family and variant, parent context, nesting shape, and conditional mode already match, and the change is limited to safe instance substitutions such as labels, names, ids, aliases, and SQL text. Templates are exact-match examples and renderer references, not the primary syntax oracle.
- Use `assets/grammar/apexlang.ebnf` as the APEXlang syntax oracle, but never load it whole. Run one task-scoped grammar contract for selected components and groups, using parent-aware child selectors and instance bindings only when required. Apply its semantic rules, compiler assumptions, exact instance declarations, repository policies, active requirements, forbidden blocks, and activation/omit rules. Then run the same-selection grammar audit and repair failed page-local MUST checks. For choices not resolved by the contract, query compiler-backed truth with `node tools/query-valid-props.mjs` before generating code. Every changed `.apx` must pass compiler-truth audit before live use. Compiler truth outranks templates; if unavailable, stop with Missing Inputs.
- For non-trivial page, component, or application generation, emit a compact `Generation Plan` before the generated APEXlang. The plan must freeze the target artifact scope, selected contract or exact template family/variant, ordered region/item/button inventory when applicable, source mode decisions, navigation or target decisions, source trace, and compiler-truth evidence references when required.
- For non-trivial work, keep a compact source trace: intent -> smallest rule/contract/workflow -> grammar/compiler evidence -> exact template only when needed.
- Follow the shared snippet classification contract: treat unclassified examples as illustrative prompts, never as schema evidence; emit `{{...}}` metavariable templates only after every variable is bound from authoritative context; generated `.apx` artifacts must not contain unresolved `{{...}}` variables or prompt-only pseudo-identifiers such as `SOURCE_TABLE`, `LOOKUP_TABLE`, `RELATED_TABLE`, `SOURCE_ID`, `LOOKUP_ID`, or `LOOKUP_NAME`.
- For Live DB work, inspect saved SQLcl connections first and auto-bind one deterministic connection. Ask the user only to choose among multiple connections or provide `db_connection_name` when none can be resolved. If the active runtime reports workspace ambiguity, resolve its workspace id and rerun with that run-scoped override. Require an exact destination workspace name before new-app materialization.
- When a brand new app run will generate `deployments/default.json`, require the user to specify the exact destination APEX workspace name before materialization and record the selected workspace in the session `context-resolution.json` under `db_context.workspace`. Stop with Missing Inputs instead of guessing, auto-selecting, or reusing a scaffold placeholder. `node tools/apexctl.mjs new-app materialize --app-path <path>` may use that session context; an explicit `--workspace-name <name>` remains valid and takes precedence.
- Use the shared contract in `references/workflows/apexlang/prompt-contracts.md` for instruction hierarchy, tagged prompt sections, rule IDs, intermediate artifacts, and stop conditions.
- Follow the posted rules and workflow first. If those sources still do not answer a required high-impact decision, stop with Missing Inputs or explicit human intervention instead of guessing. Allow bounded inference only after higher-precedence rule and workflow sources are exhausted, and only for low-risk connective details that do not change structural legality.
- Treat an explicit post-check GUI import choice as the only trigger for live import; do not infer it from prompt wording or defaults.
- If GUI choices are unavailable, stop after the check-only path and report import as a follow-up.
- Record the APEX workspace name in `db_context.workspace.name`; pass it as `--workspace-name <name>` for packaged commands that accept the flag.
- `Offline` disables live metadata validation, `apex validate`, and `apex import`.

## Stop Conditions
- Stop with Missing Inputs when authoritative structure cannot be proven for DB-backed or API-backed output.
- Stop when same-rank authoritative sources conflict.
- If a packaged command fails, do not widen search outside the current session directory or outside this package. Recover with `workspace probe`, `new-app materialize`, and then app-local edits only.
- Do not reference repo-internal paths outside this package.
