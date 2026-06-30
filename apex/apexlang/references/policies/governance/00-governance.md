> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# AI Tooling Core Rule: Governance and Loading Order

## Purpose
- Make `references/policies/governance/` the single policy anchor for precedence, loading order, and non-negotiable constraints.
- Keep behavior deterministic, minimal, and aligned with repository routing.
- Don't guess.  Ever.  Look at your skills for all reference.

## Source of truth
- Rule content lives in `references/policies/memory-bank/`.
- Domain entrypoints live in `skills/*/SKILL.md`.
- Domain assets and registries live under `skills/*/assets` and `skills/*/references`.

## Security defaults
- Generated business applications default to authenticated access. Use bare `mustNotBePublicUser` on every non-login, non-Page 0 page unless requirements justify a stricter existing authorization scheme; custom authorization schemes are referenced with `@<static-id>` such as `@administration-rights`.
- Page 0 (`p00000-global-page.apx`) is the Global Page artifact and must remain the canonical minimal skeleton unless explicitly populated with components intended for every page. Do not add normal page-level security, authorization, authentication, page-access-protection, or autocomplete properties to Page 0.
- The login page is the only expected public page. Any other public page must include security-review rationale and validation output.
- Application security defaults must include Session State Protection, `maxSessionIdleTime: 3600`, and `maxSessionLength: 28800`.
- Hidden and ID-style page items default to `checksumRequiredSessionLevel`; unrestricted hidden items require same-page dynamic-action ownership and comments rationale.
- Report/grid output remains escaped by default; reviewed HTML formatting must live in declarative column formatting with escaped substitutions.
- Secure-cookie emission must be proven against the active APEXlang runtime before any DSL attribute is hard-coded.
- Do not use Perl one-liners for automated rewrites of APEXlang `@...` aliases such as `@mustNotBePublicUser`; Perl interpolates unescaped `@name` as an array. Use Python/Node tooling for these rewrites, or explicitly escape `@` in manual Perl commands.

## Load Order and Precedence
1. Always respect numeric prefixes.
2. Memory-bank precedence is enforced by its partitioning:
   - `00-guard/`
   - `10-global/`
   - `20-data/`
   - `30-pages/`
   - `40-components/`
3. Keep active context small by using `assets/rules-mapping.json`.

## Startup routine
1. Load `references/policies/memory-bank/00-guard/ai.guard.md`.
2. Load this file.
3. Load `references/policies/context-overview.md`.
4. Load `assets/rules-mapping.json`.
5. For DB-backed work, resolve the prerequisite metadata source before routing further:
   - read `assets/workspace-intelligence.json` and apply the schema-dictionary selection rules for offline metadata reasoning
   - scan saved SQLcl connections before any user prompt about DB mode or connection knowledge
   - use discovered saved connections as candidates, not as automatic approval for live DB work
   - ask the user to choose only when multiple eligible schema dictionaries or multiple saved connections exist
   - if live-connection selection still remains unresolved and live DB context is required, ask for `db_connection_name` and the corresponding APEX workspace name
   - treat `offline` as explicit user intent, not as the default first prompt
   - before drafting object-specific SQL or DB-object references, resolve `object_evidence_source` for each referenced object as `schema_doc`, `live_db`, `user_asserted`, or `unresolved`
   - if any required object remains unresolved, stop with `Missing Inputs` instead of substituting sample or inferred object names
6. Accept free-form input by default, normalize what is explicit, and ask only one clarification round for critical blockers.
7. Select the minimal relevant rule files and load them in precedence order.

## Selection constraints and token discipline
- Prefer rule files over inference.
- Load only the minimum relevant files.
- Do not reject a request only because it is fragmentary, badly phrased, or unstructured.
- Prefer one short simple-English clarification round over broad discovery when critical routing or safety inputs are missing.
- For app-scoped APEX work, limit application inspection to the resolved target app under `applications/<target-app>/`.
- `applications/<target-app>/` is the standard repo convention, not a license to guess. If `applications/` is missing, empty, or does not identify the requested app, ask for the exact app directory or a bounded scan root and stop with `Missing Inputs` until resolved. Nonstandard app paths are allowed only after explicit user confirmation.
- Treat `artifacts/` as optional output only. Never require it to exist before generation starts, never scan `artifacts/**` for app candidates, schema metadata, examples, or pattern sources, and create output subdirectories only when a workflow writes logs, reports, or backups.
- Treat any `apex-exports` path segment as backup/export material only. Ignore those trees during app resolution, metadata discovery, bounded scans, and generation unless the user explicitly asks to inspect an export backup.
- Use `templates/**` as the only pattern-selection source for APEXlang generation. Do not use `applications/**` as an example corpus, scaffold source, or DSL-shape reference.
- Reads from the resolved target app are integration-only: concrete wiring facts such as existing shared-component ids, page targets, aliases, list entries, breadcrumb entries, and output paths.
- Do not use runtime logs as syntax truth.
- For APEX build-refresh work, classify the change first:
  - broad DSL drift only when packaged metadata or direct compiler validation proves added, removed, or renamed APEXlang-facing syntax
  - narrow metadata delta when the packaged build changes defaults, accepted values, or component-local import behavior without broader DSL drift
- Keep build-pinned facts in canonical docs and active templates only; do not leave upgrade guidance stranded in one-off audit notes.
- Do not change unrelated component families solely because the packaged build version changed.

## Database policy
- Use `references/policies/memory-bank/20-data/db.connection.md` for connection details.
- Use `assets/workspace-intelligence.json` as the authoritative machine-readable registry for offline schema dictionaries.
- For DB-backed work, require resolved `prereq_source` first:
  - `schema_doc`
  - `saved_connection`
  - `user_prompt`
  - `unresolved`
- Record `connection_source` separately for connection discovery:
  - `saved_connection`
  - `user_prompt`
  - `unresolved`
- Resolve `db_mode` after deterministic metadata and saved-connection discovery, with `offline` remaining explicit.
- Do not perform live DB work if `db_connection_name` is missing or ambiguous.
- For object-specific SQL or DB-object references, require resolved `object_evidence_source`:
  - `schema_doc`
  - `live_db`
  - `user_asserted`
  - `unresolved`
- Do not generate or preserve object-specific SQL when `object_evidence_source` is `unresolved`.
- Do not treat templates, memory-bank examples, compiler metadata labels, or prior guessed code as proof that a schema object exists.
- DB object creation/update enforcement remains canonical in `references/policies/memory-bank/00-guard/ai.guard.md`.

## Completion policy
- Completion/runtime-import rules are canonical in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Governance references only:
  - `RUNTIME_GATE_COMPLETION_REQUIRED_001`
  - `ONLINE_IMPORT_CONDITIONAL_001`

## Artifact logging policy
- When a run edits files under `references/policies/**` or `skills/**`, append an entry to root `CHANGE_MEMORY.md`.
- If `CHANGE_MEMORY.md` does not exist, create it first.
- Keep `CHANGE_MEMORY.md` append-only.
- Each entry must include:
  - a timestamp
  - the files updated
  - a content summary describing what was changed in each file
  - the reason for each change

## Templates and attributes policy
- For page-scoped work, choose the matching family under `templates/page-examples/**` first, then load the narrower supporting family under `templates/**` as needed.
- Load the relevant templates under `templates/**` before drafting regions, page items, buttons, or shared components.
- Packaged compiler metadata and direct compiler validation are authoritative for actual APEXlang syntax, component/property validity, and build-pinned conditional rules.
- Every generated or revised `.apx` artifact must have a passing compiler-truth audit report before publish, live validate, or import eligibility. The audit is executed through `node tools/apexctl.mjs apexlang compiler-truth audit --app-path <resolved_app_path> --verify-component-attributes`.
- `assets/component-attributes.json` is the repo's compiler-provenanced curated safe subset for covered components and generation/lint guidance; if it disagrees with the packaged compiler metadata or direct compiler validation, the compiler wins.
- Repository templates and examples are generation guidance only; they can drift and must not be treated as exact syntax truth when the compiler-backed sources disagree.
- An exact-match canonical template may be reused as a drafting shortcut only when the component family/variant, parent context, nesting shape, and conditional mode already match and the change is limited to safe instance substitutions such as names, labels, ids, aliases, and SQL text.
- If the template is not an exact match, or if a change introduces a new property, nested block, enum token, slot, template option, or layout attribute, query compiler-backed truth before generating code.
- Never invent attribute/value pairs.

## UI composition policy
- Treat `references/policies/memory-bank/40-components/apex.templates.md` as the single shared owner for template, template-option, and layout-composition defaults.
- Never invent CSS classes to solve structure, spacing, alignment, or framing.
- Prefer native templates, template options, slots, and layout attributes over selector/class-based workarounds.
- Treat `templateOptions` values as build-pinned accepted values, not string-composed values.
- Never concatenate `#DEFAULT#` with another token.
- Emit only exact values proven by the owning template catalog or documented runtime-valid composite token; do not substitute labels, CSS class strings, or inferred aliases.

## Oracle APEX and APEXlang policy
- Oracle APEX only.
- Generate only APEXlang DSL output.
- Use triple backticks only for SQL.
- Follow the APEXlang grammar, packaged compiler metadata, and repository templates in that order for syntax truth.

## Runtime policy
- Direct SQLcl roundtrips are the canonical live runtime path.
- For agent-facing generated-app validation, use `node tools/apexctl.mjs runtime validate --app-path <absolute_app_path> --db-connection-name <db_connection_name> --apex-root <resolved_build_root> [--compiler-oracle-home <compiler_metadata_home>]` as the single public validate-only gate. It may call preflight/roundtrip internally, but generation agents must consume its structured outputs.
- Treat `--apex-root` as the APEX/SQLcl runtime selector only. Use `--compiler-oracle-home` only when overriding compiler-truth metadata discovery; otherwise let compiler truth auto-discover the VS Code SQLcl/APEXlang runtime.
- Runtime validation must emit and preserve `validation-report.json`, `validation-transcript.log`, `problems.json`, and `component-contracts/<build>.json` for the selected target build.
- Live APEX validation from the selected target build is required and authoritative. Missing required runtime inputs or missing live runtime evidence records `LIVE_RUNTIME_VALIDATION_REQUIRED_001` and blocks completion.
- `problems.json` is the compact live-validation repair interface derived from `validation-report.json`. Patch only reported live validation problems, then rerun `runtime validate` until `live_check_status = pass`; warnings are treated as errors when the runtime does.
- Local lint, compiler-truth, and VS Code Problems snapshots remain diagnostics unless live validation cannot run. Broad memory-bank, policy, and template prose must not override live validation or the build contract pack.
- For every APEX artifact workflow, default to checking APEXlang code and run the live APEXlang check through `apex validate -input` when live runtime prerequisites are resolved.
- After the live APEXlang check passes, offer GUI/clickable choices with a short purpose summary using plain language: `Check APEXlang code` (recommended) or `Check and import APEXlang code`; if GUI choices are unavailable, stop after checking the code and report import as a follow-up.
- `apex validate -input` is mandatory for live check completion.
- Existing-app `validate-and-import` runs must resolve and preserve one canonical live numeric application id before import.
- Import-authorized runtime resolution must stay bounded to one intended workspace and produce one terminal outcome: `resolved_existing_app`, `not_found_in_workspace`, `ambiguous_candidates`, or `identity_uncertain`.
- Target-resolution timeout or failure is terminal for import. Do not use live validate success as permission to run direct SQLcl import or bypass the wrapper.
- `update-existing` remains the default import-authorized mode. If the outcome is `not_found_in_workspace`, stop the update path and require an explicit `create-new` confirmation before any import that could create a live app.
- Once that canonical application id is known, use it as the session authority for workspace and import targeting; do not fall back to alias-only targeting.
- If staged deployment metadata does not match the canonical live application id, reconcile the staged deployment app id before import-authorized runtime steps.
- If import output later reports a different application id than the preserved canonical target, block the run and treat the reported target as a duplicate or wrong-target outcome.
- `create-new` imports are allowed only after the bounded resolver returns `not_found_in_workspace`; block create-new for `ambiguous_candidates` and `identity_uncertain`.
- Shared-app `validate-and-import` is CI-owned by default. Local runs stay validate-only unless the run explicitly uses manual override authority after a second GUI confirmation.
- If the post-check GUI choice resolves to import, `apex validate -input` and `apex import -input` must run in the same authenticated SQLcl user session.
- If the session changes between validate and import, STOP and re-run validation before import.

## Enforcement
- `.aiconfig` is the active repo enforcement config.
- When in doubt, stop and ask for clarification.
- If critical ambiguity remains after one clarification round, stop with `Missing Inputs`.
