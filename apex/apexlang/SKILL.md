---
name: apexlang
description: Public APEXlang router with deterministic local-context discovery and compact machine-readable contracts.
---

# Skill — APEXlang

`SKILL.md` is the north-star source of truth and main routing entry point for packaged APEXlang generation. Read compact JSON assets before broader prose.

## Start Order
1. `assets/routing-catalog-main.json`
2. `assets/routing-load-policy.json`
3. `assets/apexlang/domains-catalog.json`
4. `assets/workspace-intelligence.json`
5. Run `node tools/apexctl.mjs workspace probe` from the packaged skill root.
6. The temp-runtime `context-resolution.json` report under `APEXLANG_OUTPUT_ROOT`, when present

Only the package-root asset names above are valid for the public package. Do not substitute legacy router or load-policy aliases from copied prompts.

## Local Context Contract
- Discovery boundary is the current local AI tooling session directory only.
- Prefer authoritative offline context from metadata definitions, data models, or API contracts.
- Treat `specs/` and `requirements/` as hints and disambiguation only.
- Do not infer schema or API shape from prose, names, or headings.
- Treat `artifacts/` as optional runtime output only. Do not require it before generation starts and do not use it as source context.
- Treat any `apex-exports` path segment as backup/export material only. Ignore it for app resolution, metadata discovery, bounded scans, template/source selection, and generation unless the user explicitly asks for read-only export inspection, migration, or recovery analysis.
- All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.
- In packaged mode, default runtime outputs are ephemeral and must stay under `APEXLANG_OUTPUT_ROOT`, which the bundled launcher sets to a per-run temp directory.
- When app or page scope appears with translation, localization, target-language, `messages.apx`, or `APP_TEXT$` wording, route first to the shared-components translation guidance before generic page/app generation references.
- Plain app/page localization requests must be satisfied by text-message conversion plus `&APP_TEXT$...` consumption rewiring. Do not satisfy them by inserting direct translated literals into component attributes.
- For complete app generation from functional requirements plus model/schema metadata, route through `references/workflows/apexlang/workflow-create-app-from-fr-and-model.md` and complete `references/workflows/apexlang/application-spec.template.md` into project-root `.apexlang/application-spec.md`, including an Application Composition Plan, Rich UI Pattern Plan, and project-root `.apexlang/app-ux-contract.json`, before drafting non-trivial `.apx` artifacts.

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
- Use `problems.json` with `assets/validator-fix-recipes.json` to repair reported live problems, then rerun `runtime validate`.
- For every APEXlang artifact generation, mutation, checking, debugging, or runtime workflow: Default to checking APEXlang code only. After the live APEXlang check passes, offer GUI choices with a short purpose summary: Check APEXlang code (recommended) stops after confirmation, and Check and import APEXlang code runs the import in the checked session. If GUI choices are unavailable, stop after checking the code and report import as a follow-up.
- Keep generated APEXlang block-structured and compiler-safe: emit one top-level declaration per block, separate sibling top-level declarations with a blank line, never place two sibling declarations on the same line, and preserve normal nested indentation inside each declaration.
- Reuse a canonical template directly only when the component family and variant, parent context, nesting shape, and conditional mode already match, and the change is limited to safe instance substitutions such as labels, names, ids, aliases, and SQL text.
- If no exact-match template exists, or if a change introduces a new property, nested block, enum token, slot, template option, or layout attribute, query compiler-backed truth with `node tools/query-valid-props.mjs` before generating code. Every generated or revised `.apx` artifact must pass `node tools/apexctl.mjs apexlang compiler-truth audit --app-path <app-path> --verify-component-attributes` before publish, live validate, or import eligibility. Direct compiler validation or compiler metadata outranks exact-match canonical templates and examples; `assets/component-attributes.json` is fallback/internal validator context only after those stronger sources are exhausted. Treat `assets/component-attributes.json` as a compiler-provenanced curated safe subset and policy layer, not a replacement for the audit. If compiler-backed truth conflicts with a template/example, follow the compiler-valid shape and treat the template/example as defective. If compiler-backed truth cannot be resolved for a non-exact-match structural change, stop with Missing Inputs rather than inventing syntax.
- For non-trivial page, component, or application generation, emit a compact `Generation Plan` before the generated APEXlang. The plan must freeze the target artifact scope, exact template family or variant, ordered region/item/button inventory when applicable, source mode decisions, navigation or target decisions, and compiler-truth evidence references when required.
- Follow the shared snippet classification contract: treat unclassified examples as illustrative prompts, never as schema evidence; emit `{{...}}` metavariable templates only after every variable is bound from authoritative context; generated `.apx` artifacts must not contain unresolved `{{...}}` variables or prompt-only pseudo-identifiers such as `SOURCE_TABLE`, `LOOKUP_TABLE`, `RELATED_TABLE`, `SOURCE_ID`, `LOOKUP_ID`, or `LOOKUP_NAME`.
- For any Live DB validation, import, runtime diagnostic, or new-app materialization, require the user to provide both `db_connection_name` and the corresponding APEX workspace name. Record the workspace name in `db_context.workspace.name`; stop with Missing Inputs if either value is missing or ambiguous.
- When a brand new app run will generate `deployments/default.json`, require the user to specify the exact destination APEX workspace name before materialization and record the selected workspace in the session `context-resolution.json` under `db_context.workspace`. Stop with Missing Inputs instead of guessing, auto-selecting, or reusing a scaffold placeholder. `node tools/apexctl.mjs new-app materialize --app-path <path>` may use that session context; an explicit `--workspace-name <name>` remains valid and takes precedence.
- Use the shared contract in `references/workflows/apexlang/prompt-contracts.md` for instruction hierarchy, tagged prompt sections, rule IDs, intermediate artifacts, and stop conditions.
- Follow the posted rules and workflow first. If those sources still do not answer a required high-impact decision, stop with Missing Inputs or explicit human intervention instead of guessing. Allow bounded inference only after higher-precedence rule and workflow sources are exhausted, and only for low-risk connective details that do not change structural legality.
- Treat an explicit post-check GUI import choice as the only trigger for live import; do not infer it from prompt wording or defaults.
- If GUI choices are unavailable, stop after the check-only path and report import as a follow-up.
- For interactive DB-backed runs, ask whether the user wants `Offline` or `Live DB` first.
- If `Live DB` is chosen, require the user to specify both `db_connection_name` and the corresponding APEX workspace name before live metadata validation, `apex validate`, `apex import`, runtime diagnostics, or new-app materialization.
- Saved SQLcl connection discovery may help the user choose an alias, but do not treat discovery alone as approval to proceed without the matching APEX workspace name.
- Record the APEX workspace name in `db_context.workspace.name`; pass it as `--workspace-name <name>` for packaged commands that accept the flag.
- `Offline` disables live metadata validation, `apex validate`, and `apex import`.

## Stop Conditions
- Stop with Missing Inputs when authoritative structure cannot be proven for DB-backed or API-backed output.
- Stop when same-rank authoritative sources conflict.
- If a packaged command fails, do not widen search outside the current session directory or outside this package. Recover with `workspace probe`, `new-app materialize`, and then app-local edits only.
- Do not reference repo-internal paths outside this package.
