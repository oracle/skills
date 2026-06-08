> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# AI tooling Guard — Precedence and Conflict Handling

AI tooling must always prefer `.md` files over inferred behavior.
If a prompt conflicts with memory rules, ask for clarification before proceeding.

## Prompt Normalization Gate (NON-NEGOTIABLE)

Scope
- Applies to all repo-routed tasks, regardless of domain.

Rules (Hard Requirements)
- MUST accept free-form user input by default, including shorthand, fragments, noun lists, broken grammar, partial identifiers, and mixed imperative phrases.
- MUST normalize explicit intent and identifiers before asking follow-up questions.
- MUST ask follow-up questions only for critical blockers that affect routing, target scope, safety gates, or emitted artifacts.
- MUST use short simple-English follow-up prompts.
- MUST allow at most one clarification round before either proceeding or stopping.
- MUST NOT require the user to restate the request as a structured payload merely because the original prompt was informal.
- MUST NOT reject or defer a task only because the user wrote tersely, informally, or with rough wording.
- MUST stop with `Missing Inputs` when critical ambiguity remains after one clarification round.

Error Code
- `PROMPT_NORMALIZATION_REQUIRED_001`

## Tooling Rewrite Safety (NON-NEGOTIABLE)

Scope
- Applies to automated or manual repo rewrites of APEXlang DSL values.

Rules (Hard Requirements)
- MUST NOT use Perl one-liners for rewrites that include APEXlang `@...` aliases such as `@mustNotBePublicUser` unless every `@` is explicitly escaped.
- MUST prefer Python or Node rewrite tooling for `@...` alias fixes so values are treated as literal text.
- MUST treat unescaped Perl replacements containing `@alias` as unsafe because Perl interpolates `@name` as an array and can erase the emitted value.

Error Code
- `TOOLING_REWRITE_ALIAS_LITERAL_REQUIRED_001`

## Oracle DB Skills Delegation Boundary (NON-NEGOTIABLE)

Scope
- Applies whenever APEXlang work touches Oracle Database, PL/SQL, SQLcl, or utPLSQL topics.
- Applies to both this source repo and the public `dist/apexlang` skill bundle.

Rules (Hard Requirements)
- MUST treat Oracle upstream DB skills at `https://github.com/oracle/skills/tree/main/db` as the source of truth for generic Oracle Database, PL/SQL, SQLcl, and utPLSQL best practices.
- MUST keep APEXlang ownership limited to APEX artifact safety and APEXlang workflow integration:
  - DB object evidence before APEX artifact generation
  - APEX page process and application process shape
  - inline SQL/PLSQL size gates inside APEX artifacts
  - `invokeApi` versus `executeCode` routing for APEX processes
  - extracted APEX artifact logic package naming
  - SQLcl adapter behavior needed for APEXlang validate/import/export roundtrips
- MUST route standalone or generic Oracle Database, PL/SQL, SQLcl, and utPLSQL authoring, tuning, style, installation, execution, reporting, and testing requests to the upstream DB skills when those skills are installed.
- MUST NOT recreate upstream DB skill guidance inside APEXlang when upstream DB skills are absent.
- MUST continue APEXlang-specific generation and runtime-safety workflows without requiring a locally installed copy of the upstream DB skills.
- MUST stop with `Missing Inputs` or a short `Oracle DB skills required` notice for standalone generic Oracle Database, PL/SQL, SQLcl, or utPLSQL requests when the upstream DB skills are not available.
- MUST NOT bundle generic PL/SQL tutorials, SQLcl tutorials, utPLSQL install/run/reporting guidance, or DB administration guidance in the public APEXlang package.

Error Code
- `ORACLE_DB_SKILLS_DELEGATION_REQUIRED_001`

## Generated Application Security Baseline (NON-NEGOTIABLE)

Scope
- Applies to generated business applications and templates. Intentional reference/demo applications are not hard-fail targets unless the task explicitly asks to migrate them.

Rules (Hard Requirements)
- MUST make Session State Protection explicit for every generated app by emitting `sessionStateProtection { checksumSalt: ... }` at the application root and `pageAccessProtection: argumentsMustHaveChecksum` on every concrete non-Page 0 page.
- MUST keep Page 0 (`p00000-global-page.apx`) on the canonical minimal global-page skeleton unless the user explicitly requests components that render on every page.
- MUST NOT emit `security`, `authorizationScheme`, `authentication`, `pageAccessProtection`, `formAutoComplete`, or page-level session/security properties on Page 0. If any validator or template demands those properties on Page 0, treat the validator/template as defective and fix that source instead of changing Page 0.
- MUST make `mustNotBePublicUser` the default page authorization reference for every non-login, non-Page 0 generated page unless functional requirements select a stricter existing authorization scheme; built-in `mustNotBePublicUser` is emitted bare, while custom schemes use `@<static-id>` such as `@administration-rights`.
- MUST treat the login page as the only default public page. Any other public page requires explicit security-review rationale in comments and MUST be reported in validation findings.
- MUST emit application session defaults `maxSessionIdleTime: 3600` and `maxSessionLength: 28800` for generated business applications.
- MUST apply `sessionStateProtection: checksumRequiredSessionLevel` to hidden items and ID-style page items by default.
- MUST treat hidden items as one of two classes only:
  - protected hidden data: initial-render or submit-time server values only; use `sessionStateProtection: checksumRequiredSessionLevel`
  - client-owned hidden UI state: values intentionally changed after render by dynamic actions, `itemsToReturn`, `setValue`, or initialization JavaScript; use `sessionStateProtection: unrestricted`
- MUST allow unrestricted hidden items only when the item is populated solely by same-page client-side code such as dynamic actions or initialization JavaScript and the item carries an explicit comments rationale.
- MUST NOT keep checksum-based item protection on hidden items whose value is intentionally changed during same-page client-side show processing, Ajax return flows, `itemsToReturn`, `setValue`, or Ajax initialization flows; use `sessionStateProtection: unrestricted` for that client-side-owned hidden state or APEX can raise `ORA-20987` when the browser attempts to save the item without a session checksum.
- MUST describe unrestricted hidden-item ownership in comments using the canonical rationale shape:
  - `Same-page dynamic-action ownership: this hidden item is updated after render via itemsToReturn or setValue and is used only as UI state, so checksum-based SSP would block the intended flow.`
- MUST make validator behavior ownership-aware: if a hidden item is detected in dynamic-action `itemsToReturn` or as a `setValue` target, treat it as post-render client-owned state and require `sessionStateProtection: unrestricted` plus the comments rationale.
- MUST keep report/grid column escaping enabled by default. Do not disable escaping except for reviewed declarative `columnFormatting.htmlExpression` patterns that use escaped substitutions.
- MUST reject arbitrary URLs, `javascript:`, `data:`, inline event handlers, and unallowlisted icon/enum/identifier/format-mask values when parsing blueprint input.
- MUST NOT invent unsupported APEXlang attributes for secure cookies. If secure-cookie DSL support cannot be proven by the live APEXlang check, emit a blocking validation finding instead of generating speculative syntax.

Error Codes
- `SECURITY_BASELINE_REQUIRED_001`
- `PUBLIC_PAGE_REVIEW_REQUIRED_001`
- `HIDDEN_ITEM_SSP_REQUIRED_001`
- `REPORT_ESCAPE_REQUIRED_001`
- `SECURE_COOKIE_DSL_UNVERIFIED_001`

- MUST: When the user requests specific regions/items/buttons, source the implementation from templates/** (region-components, template-components, etc.) and cite the exact template used.
- MUST: Treat `templates/**` as the only active pattern and scaffold source for APEXlang generation.
- MUST: When generation uses any template under `templates/**`, emit the final DSL from that template's declared output structure exactly.
- MUST: Run and preserve compiler-truth diagnostics for every generated or revised `.apx` artifact before publish, live validate, or import eligibility.
- MUST: Treat compiler-truth diagnostics as component-contract evidence, but do not let them override a live APEX validation pass.
- MUST: Treat live APEX validate output from the selected target build as the primary validation gate for generated applications.
- MUST: Record `LIVE_RUNTIME_VALIDATION_REQUIRED_001` and block completion when required runtime inputs or live APEX validation evidence are missing.
- MUST: Record VS Code Problems snapshots as diagnostics when provided; missing snapshots are `not_provided` and do not block a live pass.
- MUST: Use `problems.json` as the compact review interface for live validation findings. Sort findings by file, line, severity, compiler type, and message.
- MUST: Treat local lint and broad policy/template prose as syntax hygiene or fallback guidance only when they cannot contradict the selected target build.
- MUST NOT: Mark validation complete, publish, or offer import based only on local validators, template prose, memory-bank policy, VS Code Problems snapshots, or terminal transcript inspection when live runtime validation evidence is unresolved.
- MUST: Preserve the template's emitted DSL tokens exactly, including component `type` values, block names, property names, nesting, and variant-specific syntax.
- MUST NOT: infer or normalize emitted DSL from folder names, `templateId`, `canonicalDslType`, headings, registry labels, or prose when they conflict with the template's output structure.
- MUST: If a selected template does not contain an explicit output block, use the nearest concrete emitted example in the same template family; do not invent syntax from metadata alone.
- MUST: Treat conflicts between template metadata/prose and emitted output structure as template defects to be fixed separately; until corrected, generated output must follow the template's emitted structure.
- MUST NOT: Use `applications/**` as an example library, scaffold source, syntax source, pattern corpus, or fallback reference when selecting templates, page patterns, region structures, or DSL shape.
- MUST: Restrict reads of the resolved target app under `applications/<target-app>/` to integration facts only, such as existing artifact paths, shared-component identifiers, page ids, aliases, navigation entries, breadcrumb entries, and other concrete wiring details.
- MUST NOT: Infer layout, composition, naming conventions, DSL blocks, or reusable patterns from the resolved target app. Those decisions must come from `templates/**` plus the loaded memory-bank guidance.
- MUST: Treat `artifacts/` as optional output only. Create it lazily only when a workflow writes logs, reports, validation evidence, or export backups.
- MUST NOT: Read or scan `artifacts/**` as app source, schema evidence, template source, example corpus, or startup context.
- MUST: Treat every `apex-exports` path segment as backup/export material and ignore it for app resolution, metadata discovery, bounded scans, template/source selection, and generation.
- MUST NOT: Use `apex-exports/**` as generated source unless the user explicitly requests read-only export inspection, migration, or recovery analysis.
- MUST: For brand new applications, materialize only named runtime artifacts into `applications/<app>/`: `.apex/`, `application.apx`, `deployments/`, `page-groups.apx`, `pages/`, `shared-components/`, and `supporting-objects/`.
- MUST NOT: Copy the whole `templates/base-app-structure/` directory into a generated app root.
- MUST NOT: Publish template-only root docs or metadata from `base-app-structure/` into `applications/<app>/`, including `README.md`, `base-app-structure._common.md`, `base-app-structure._index.md`, `base-app-structure.registry.json`, and `base-app-runtime-seed.manifest.json`.
- MUST NOT: Publish the `base-app-structure/scaffold-example/` directory itself into `applications/<app>/`.
- MUST: When applying `serverSideCondition {}` to any component, select the `type` from the canonical catalog defined in references/policies/memory-bank/20-data/apex.logic.md and include only the attributes required for that type. Use the embedded examples in that file for syntax; never invent new condition types.
- MUST: Treat user-correctable submit failures as validation problems first, not page-process errors.
- MUST: Before adding `raise_application_error` or other user-facing failure logic to a page process, first try native APEX validations in this order:
  - declarative item validation
  - declarative expression validation
  - SQL validation
  - validation function body only when declarative validation cannot express the rule
- MUST NOT: Raise user-facing “choose/fill/select/enter” submit errors from page processes when the same rule can be enforced by validations before the process runs.
- MUST: Reserve page-process `raise_application_error` for runtime/business failures that validations cannot safely pre-check, such as optimistic-lock conflicts, packaged API business exceptions, or post-validation DML invariants.
- MUST: When moving a rule from process logic to validations, keep the page process update-only or orchestration-only whenever feasible.

Error Code
- `APP_TEMPLATE_ARTIFACT_LEAK_001`

## APEXlang Line Ending Gate (NON-NEGOTIABLE)

Scope
- Applies to every generated or revised `.apx` artifact.

Rules (Hard Requirements)
- MUST write `.apx` artifacts with LF line endings only.
- MUST NOT publish or validate `.apx` files that contain CRLF line endings.
- MUST treat Windows default CRLF conversion as a source-control/tooling defect for `.apx` files and normalize those files to LF before validation or handoff.

Error Code
- `APEXLANG_LF_LINE_ENDINGS_REQUIRED_001`

## Calendar Link Target Resolution Gate (NON-NEGOTIABLE)

Scope
- Applies whenever a calendar region uses or is being asked to use `settings.createLink` or `settings.viewEditLink`.

Rules (Hard Requirements)
- MUST: For calendar `settings.createLink`, ask the user whether there is an existing form page to use or whether a new form page should be created on the same base table/view as the calendar source.
- MUST: If the user chooses an existing form page for `createLink`, require the explicit target page identifier and target item mapping for any values passed from the calendar.
- MUST: If the user chooses a new form page for `createLink`, treat the target as a modal form page on the same base table/view as the calendar source and route to the modal form workflow.
- MUST NOT: Infer a `createLink` form target from page aliases, page titles, naming similarity, or existing app structure.
- MUST: For calendar `settings.viewEditLink`, ask the user whether there is an existing report page to use or whether a new report page should be created.
- MUST: If the user chooses an existing report page for `viewEditLink`, require the explicit target page identifier plus the page item that receives the calendar primary key.
- MUST: If the user chooses a new report page for `viewEditLink`, ask which report type to create every time. Valid choices are Interactive Report and Classic Report.
- MUST NOT: Default the report type for a new `viewEditLink` report page.
- MUST NOT: Infer a `viewEditLink` report target from page aliases, page titles, naming similarity, or existing app structure.
- MUST: For any new report page created for `viewEditLink`, create a dedicated page item to hold the calendar primary key and filter the report SQL with that page item.
- MUST: If the required create-link or view-link choice remains unresolved after the single clarification round, stop with `Missing Inputs`.

Error Code
- `CALENDAR_CREATE_LINK_TARGET_REQUIRED_001`
- `CALENDAR_VIEW_LINK_TARGET_REQUIRED_001`
- `CALENDAR_REPORT_TYPE_REQUIRED_001`
- `CALENDAR_REPORT_PK_FILTER_REQUIRED_001`

## Structure-First UI Composition Gate (NON-NEGOTIABLE)

Scope
- Applies whenever routing or generation changes visual composition for Oracle APEX pages, regions, buttons, reports, or items.

Rules (Hard Requirements)
- MUST treat `references/policies/memory-bank/40-components/apex.templates.md` as the single active owner for page template, region template, item-template, template-option, and default composition decisions.
- MUST solve layout, framing, disclosure, density, label treatment, header behavior, and report alignment through native templates, template options, slots, and layout/alignment attributes first.
- MUST keep page-region grid scope separate from item-grid scope. Child item spans are validated only within their parent item region.
- MUST omit explicit `column` / `columnSpan` for equal-width sibling rows and use `startNewRow: false` on second-and-later siblings.
- MUST NOT invent CSS classes or selector-level styling to solve structural layout problems.
- MUST NOT route active generation through archived skinning packages.

Hard stop
- If a requested visual outcome cannot be achieved through the active template/template-option contract without inventing CSS or changing structure assumptions, stop and ask for clarification rather than improvising class-based styling.

Error Code
- `COMPOSITION_CONTRACT_REQUIRED_001`
- `GRID_SCOPE_REQUIRED_001`
- `CSS_CLASS_INVENTION_FORBIDDEN_001`

## DB Metadata Prerequisite Gate (NON-NEGOTIABLE)

Scope
- Applies to repo DB-backed workflows before APEX artifact generation, PL/SQL maintenance/testing, or schema-modeling validation routing.
- Applies to Oracle APEX build requests that generate or modify application artifacts (for example: applications, pages, regions, items, buttons, logic, or orchestration under `applications/**`).
- Does not apply to specification-only requests that do not enter DB-backed workflows.

Rules (Hard Requirements)
- MUST: Resolve prerequisite metadata source before any DB-backed generation, review, revision, or validation routing.
- MUST: Read `assets/workspace-intelligence.json` and scan saved SQLcl connections before asking the user anything about DB mode or connection knowledge for interactive DB-backed workflows.
- MUST: Before drafting or revising object-specific SQL or any DB-object reference, resolve one machine-readable evidence state for each referenced object:
  - `object_evidence_source: schema_doc`
  - `object_evidence_source: live_db`
  - `object_evidence_source: user_asserted`
  - `object_evidence_source: unresolved`
- MUST: Treat tables, views, packages, functions, procedures, sequences, and referenced columns as DB objects for this gate.
- MUST NOT: Generate, modify, or preserve object-specific SQL when any required referenced object remains `object_evidence_source: unresolved`.
- MUST NOT: Treat templates, memory-bank examples, sample apps, compiler metadata labels, runtime errors, or prior guessed code as proof that a schema object exists.
- MUST: Treat explicit user-provided object names as `object_evidence_source: user_asserted` only for the objects the user actually named.
- MUST: Use this simple-English prompt as the final object-evidence clarification fallback when object-specific SQL is still unresolved after deterministic discovery: `I need schema evidence before writing object-specific SQL. Provide db_connection_name and the corresponding APEX workspace name for live DB confirmation, or provide the exact object names to use.`
- MUST: Treat a schema dictionary as eligible only when:
  - it is registered in `assets/workspace-intelligence.json`
  - the referenced `workspace schema dictionaries discovered by `node tools/apexctl.mjs workspace probe`` file exists
  - its frontmatter declares `status: active`
  - its frontmatter declares `metadata_mode: offline_dictionary`
  - its frontmatter declares `covers_columns: true`
- MUST: If `db_mode: offline` is selected, read `assets/workspace-intelligence.json` before selecting any schema dictionary for offline metadata reasoning.
- MUST: If exactly one eligible schema dictionary exists, auto-select it and continue with `prereq_source: schema_doc`.
- MUST: If multiple eligible schema dictionaries exist, present the choices to the user and require a schema selection before continuing.
- MUST: Use authoritative schema dictionaries as the preferred metadata evidence source when they exist, even if a live DB connection is also resolved.
- MUST: If exactly one saved SQLcl connection alias is discovered, present it as the default candidate, but still require the user to specify or confirm `db_connection_name` and the corresponding APEX workspace name before live DB work.
- MUST NOT: Auto-pick among multiple saved SQLcl connection aliases.
- MUST: If multiple saved SQLcl connection aliases are discovered, present the discovered choices and require a selection before continuing with live DB work.
- MUST: Use this simple-English prompt only as the final live-connection clarification fallback when deterministic discovery still leaves live DB context unresolved: `Provide db_connection_name and the corresponding APEX workspace name for this workflow.`
- MUST: Record one machine-readable prerequisite state before generation:
  - `prereq_source: schema_doc`
  - `prereq_source: saved_connection`
  - `prereq_source: user_prompt`
  - `prereq_source: unresolved`
- MUST: Record one machine-readable connection-resolution state before live runtime work:
  - `connection_source: saved_connection`
  - `connection_source: user_prompt`
  - `connection_source: unresolved`
- MUST: Record one machine-readable DB mode state before any live runtime work:
  - `db_mode: online`
  - `db_mode: offline`
- MUST: Record `selected_schema_name` and `selected_schema_doc_path` when `prereq_source: schema_doc`.
- MUST: Treat `db_mode: online` as valid only when the user provides or confirms `db_connection_name` and the corresponding APEX workspace name.
- MUST: Treat `db_mode: offline` as valid only when the user explicitly chooses offline mode.
- MUST NOT: Ask the user to choose between `offline` and `live DB` before offline-schema discovery and saved-connection discovery have both run.
- MUST: Allow at most one clarification round when deterministic discovery cannot resolve `db_mode`, `db_connection_name`, or the corresponding APEX workspace name.
- MUST: Stop with `Missing Inputs` when prerequisite routing remains unresolved after deterministic discovery, any required schema or connection selection attempt, and the final manual-entry clarification round.
- MUST: Stop with `Missing Inputs` when object-specific SQL still has any `object_evidence_source: unresolved` reference after deterministic discovery and the final object-evidence clarification round.
- MUST: Treat `prereq_source: schema_doc` as sufficient for offline metadata reasoning only.
- MUST: Allow offline mode for planning and offline draft work only.
- MUST NOT: Run live metadata validation, `apex validate`, or `apex import` in offline mode.
- MUST: For APEX runtime work in online mode, require runtime capability probing before any same-session validate/import execution.
- MUST: Probe both supported runtime paths when possible: resolved build-root runtime first, then PATH SQLcl fallback.
- MUST: Ask for an explicit local APEX build path only when the user explicitly wants a local-build diagnostic or override and PATH SQLcl capability probing is not sufficient for the runtime task.
- MUST: Default interactive APEX artifact workflows to checking APEXlang code; run the local first-pass check and the live APEXlang check through `apex validate -input` when `db_connection_name` and the app path are resolved.
- MUST: After the live APEXlang check passes, offer GUI/clickable choices for the next action using plain language: `Check APEXlang code` (recommended) or `Check and import APEXlang code`. Include a short purpose summary and do not ask users to type import intent.
- MUST: If GUI/clickable choices are unavailable, stop after validate-only and report that import can be requested as a separate follow-up.
- MUST: Treat an explicit post-check GUI import choice as the only interactive authority for import; do not infer it from initial prompt wording or public runtime CLI flags.
- MUST: For any existing-app `validate-and-import` run, resolve the intended live application before import and preserve its numeric application id as the canonical session authority.
- MUST: Bound every import-authorized target-resolution run to one intended workspace before deciding whether the run is `update-existing` or `create-new`.
- MUST: Produce exactly one bounded target-resolution outcome for import-authorized work: `resolved_existing_app`, `not_found_in_workspace`, `ambiguous_candidates`, or `identity_uncertain`.
- MUST: Reuse that preserved canonical application id for every later workspace-resolution and import step in the same session.
- MUST NOT: Treat a target-resolution timeout or failure as permission to bypass the wrapper with direct SQLcl import; live validate success is not target-identity evidence.
- MUST NOT: Treat alias similarity alone as proof of target identity after the canonical live application id is known.
- MUST: When staged deployment metadata does not match the preserved canonical live application id, reconcile the staged deployment app id to the canonical target before import.
- MUST: If an import-authorized run later resolves or reports a different application id than the preserved canonical target, block the run, record the mismatch, and treat the reported target as an accidental duplicate or wrong target.
- MUST: Treat `update-existing` as the default import-authorized mode and hard-block the run when the bounded resolver returns `not_found_in_workspace`; create-new requires explicit confirmation.
- MUST NOT: Auto-fall through from `update-existing` to `create-new`.
- MUST: Allow `create-new` imports only when the bounded resolver returns `not_found_in_workspace`.
- MUST NOT: Allow `create-new` imports when the bounded resolver returns `ambiguous_candidates` or `identity_uncertain`.

## Validation Deferral Prevention Gate (NON-NEGOTIABLE)

Scope
- Applies to all Oracle APEX build requests that generate or modify APEX artifacts.
- Applies at every phase of the development workflow: planning, implementation, review, and handoff.
- Applies whenever `db_connection_name` is resolved and a local `resolved_app_path` is available.

Rules (Hard Requirements)
- MUST NOT: Leave live validation as a deferred note, TODO, or optional follow-up step when `db_connection_name` is resolved and `resolved_app_path` is available.
- MUST: Treat the default check-only path plus `apex validate -input` as the mandatory in-workflow step in the canonical sequence: plan → implement → review → local first-pass check → live APEXlang check → offer GUI import choice.
- MUST: Immediately route to checks upon completing implementation and review; import remains a separate post-check GUI choice.
- MUST: Treat the resolved build-root runtime path as the preferred same-session runtime path when available, with PATH SQLcl as the supported fallback.
- MUST: Record SQLcl version for reporting, but MUST NOT treat version alone as proof that runtime commands are available.
- MUST: When build-root runtime is selected, run the roundtrip from the resolved local APEX build directory using `apex sql`.
- MUST: When the local first-pass check already passed and a build-root runtime attempt fails before real `apex validate` / `apex import` output due to sandbox-only filesystem/setup errors (for example `EPERM`, `ENOENT`, or build-root `workdir/*` write failures), treat that result as an execution-environment blocker rather than an app defect.
- MUST: After detecting that sandbox-only build-root blocker, stop sandbox runtime retries for that run and immediately continue with the real live build-root roundtrip in an execution context that can write the required build-root work files.
- MUST NOT: Spend additional sandbox retries, debugging loops, or failure-attempt budget on sandbox-only build-root filesystem/setup errors once the blocker pattern is established.
- MUST: When PATH SQLcl runtime is selected, start the authenticated SQLcl session by trying `sql <db_connection_name>` first and falling back to `sql /nolog` plus `connect <db_connection_name>` when the direct alias entrypoint fails.
- MUST: If the active SQLcl session explicitly reports multiple-workspace ambiguity, automatically resolve the workspace id for the active `db_connection_name` and re-run the same real-SQLcl validate/import path immediately with a run-scoped explicit workspace override.
- MUST NOT: Accept user requests to "mark validation for later" or "skip validation this session" when the live connection and app path are available.
- MUST NOT: Auto-run `apex import` unless the user explicitly chose import through the post-check GUI flow for that run.
- MUST NOT: Treat manual override local imports as strict guarantee runs.
- MUST: Hard-stop and redirect to the mandatory validation workflow if the user attempts to close or defer the workflow without validation completing.

## APEX Artifact Completion Gate (NON-NEGOTIABLE)

Scope
- Applies to all Oracle APEX build requests that execute a live SQLcl roundtrip.

Rules (Hard Requirements)
- MUST NOT: Mark the run complete or present completion wording unless the same `resolved_app_path` passed direct SQLcl `apex validate`.
- MUST: Treat completion as allowed when:
  - the default runtime action is check-only and the live APEXlang check succeeded for that app path
  - the post-check GUI choice resolved to import and live check/import both succeeded for that app path in the same authenticated SQLcl user session
- MUST: Treat validate/import session continuity as part of runtime eligibility only when the resolved runtime action includes import.
- MUST NOT: Treat bridge or wrapper execution as completion evidence when it disagrees with the equivalent real PATH SQLcl session for the same connection and app path.
- MUST: If validate and import do not occur in the same authenticated SQLcl user session for a `validate-and-import` run, completion remains blocked until validation is re-run and import succeeds in that same session.

Enforcement IDs
- `DB_MODE_PROMPT_REQUIRED_001`
- `RUNTIME_GATE_COMPLETION_REQUIRED_001`
- `ONLINE_IMPORT_CONDITIONAL_001`

## APEXlang Vocabulary Compatibility Gate (NON-NEGOTIABLE)

Scope
- Applies to baseline APEXlang artifacts under the resolved app path:
  - `application.apx`
  - `shared-components/themes/**/theme.apx`
  - `shared-components/component-settings.example.md`
  - `shared-components/breadcrumbs.apx`
  - `pages/p00001-*.apx`
  - `pages/p09999-*.apx`

Rules (Hard Requirements)
- MUST: Resolve target DSL version from `<app_path>/.apex/apexlang.json` (`mmdVersion`).
- MUST: Treat `26.1.0+3102` as the supported APEXlang build for generation and validation.
- MUST: Fail when `.apex/apexlang.json` is missing for an existing app being validated.
- MUST: Fail when `mmdVersion` does not resolve exactly to `26.1.0+3102`.
- MUST: For `mmdVersion` `26.1.0+3102`, enforce canonical vocabulary for known legacy aliases.
- MUST: Execute a vocabulary compatibility preflight before the DSL/schema gate.
- MUST: Auto-normalize deterministic aliases and emit a machine-readable compatibility report.
- MUST: Hard-fail when unresolved vocabulary mismatches remain after normalization.
- MUST: Hard-fail when any legacy alias remains in baseline app/shared-component scaffold files after normalization.
- MUST: Hard-fail when mixed legacy and canonical vocabulary appears in the same app.
- MUST NOT: Mark runtime gate pass when vocabulary compatibility preflight fails.

Error Code
- `DSL_VOCAB_CONTRACT_FAILED`

## APEXlang Build Refresh Discipline Gate (NON-NEGOTIABLE)

Scope
- Applies whenever repo docs, templates, validators, or packaged skill outputs are being refreshed for a newer Oracle APEX packaged build.

Rules (Hard Requirements)
- MUST: Verify whether the packaged-build delta is broad DSL drift or a narrow metadata delta before changing source guidance.
- MUST: Treat a build refresh as narrow by default unless packaged metadata proves added, removed, or renamed APEXlang-facing syntax, compiler parameter names, or import API parameter names.
- MUST: Keep build-pinned upgrade facts in canonical docs, templates, validators, or packaged outputs that already own the affected behavior.
- MUST NOT: Leave active upgrade guidance only in a standalone audit or temporary working note.
- MUST NOT: Generalize a component-local metadata delta into unrelated page, region, shared-component, or runtime guidance.
- MUST: When the packaged metadata changes only defaults or conditional values, describe the default behavior as implicit unless explicit emission is required by the DSL contract.

Error Code
- `APEXLANG_BUILD_REFRESH_SCOPE_REQUIRED_001`

## NL2IR Context Source Resolution (NON‑NEGOTIABLE)

Scope
- Applies whenever an Interactive Report has `genAI { naturalLanguageSupport: true }`.

Rules (Hard Requirements)
- MUST: Determine `genAI.reportContext` and each column `genAI.columnContext` **only** by connecting to the target database and reading the table/view + column metadata from the data dictionary for the Interactive Report’s source object.
- MUST: Resolve `genAI.reportContext` with this precedence: table/view annotation `report_context` -> table/view annotation `description` -> table/view comment -> omit.
- MUST: Resolve each column `genAI.columnContext` with this precedence: column annotation `column_context` -> column annotation `ai_context` -> column annotation `description` -> column comment -> omit.
- MUST NOT: Query or inspect the table/view data (rows) to infer NL2IR context (no sampling, profiling, distinct values, min/max, etc.).
- MUST: Scan the annotation dictionary views for the target object/column before concluding that NL2IR context annotations are absent; do not rely on a single-key probe alone.
- MUST: Fetch report-level annotations using Oracle annotation dictionary views such as:
  ```sql
  select annotation_name,
         annotation_value
    from user_annotations_usage
   where object_name = upper(<table_name>)
     and column_name is null
     and annotation_name in ('REPORT_CONTEXT', 'DESCRIPTION')
  ```
- MUST: Fetch column-level annotations using Oracle annotation dictionary views such as:
  ```sql
  select column_name,
         annotation_name,
         annotation_value
    from all_annotations_usage
   where object_name = upper(<table_name>)
     and annotation_owner = upper(<schema>)
     and annotation_name in ('COLUMN_CONTEXT', 'AI_CONTEXT', 'DESCRIPTION')
  ```
- MUST: Fetch the table/view comment using a data dictionary query like:
  ```sql
  select comments
    from user_tab_comments
   where table_name = upper(<table_name>)
  ```
- MUST: Fetch the column comments using a data dictionary query like:
  ```sql
  select column_name,
         comments
    from all_col_comments
   where table_name = upper(<table_name>)
     and owner      = upper(<schema>)
  ```
- MUST: If the target database/schema (or connection) is not known, STOP and ask the user to provide `db_connection_name` required to read annotations/comments.
- MUST NOT: Use table names, column names, headings, or inferred meanings as context.
- MUST: Treat blank/null annotation values as unavailable and continue down the precedence chain.
- MUST: Resolve report-level and column-level context independently; do not synthesize one from the other.
- If the table/view annotations and comment are all missing/null, omit `genAI.reportContext` (do not set a fallback value).
- If the column annotations and comment are all missing/null, omit that column’s `genAI.columnContext` (do not set a fallback value).

## Local Database Source Metadata Gate (NON-NEGOTIABLE)

Scope
- Applies whenever APEX artifacts use `source { location: localDatabase type: sqlQuery }`.
- Includes faceted search, classic report, interactive report, interactive grid, form sources, LOV SQL, and facet `source.databaseColumn`.

Rules (Hard Requirements)
- MUST: If SQL references a real table/view, require metadata evidence from either the selected offline schema dictionary or a live `db_connection_name` before generating final output.
- MUST: Use metadata-verified columns only for SELECT lists, report columns, and facet `databaseColumn` mappings.
- MUST NOT: Invent or infer table/view column names from memory, prior pages, or examples.
- MUST: Validate every referenced column exists in the target object metadata.
- MUST: If object owner is unclear, resolve owner via metadata before drafting.

Hard stop
- If `prereq_source` is unresolved for real DB object references, STOP and resolve the prerequisite metadata source first.
- If `prereq_source = schema_doc` and the selected schema dictionary does not document the referenced object/columns, STOP and return Missing Inputs or ask for live DB context.
- If `prereq_source = saved_connection` or `prereq_source = user_prompt`, and live metadata verification is required, STOP when `db_connection_name` is missing/ambiguous.
- If `db_mode = offline` and no selected schema dictionary can verify the requested object/columns, STOP before final SQL/facet output unless the user explicitly requested offline mock output.
- Do not emit final SQL/facet definitions against unverified columns.

Error Code
- `DB_METADATA_REQUIRED_REPORT_001`

## Object Evidence Gate (NON-NEGOTIABLE)

Scope
- Applies to any request that creates, edits, reviews, or preserves object-specific SQL or DB-object references in APEX artifacts, PL/SQL, schema work, validations, computations, LOVs, or report sources.

Rules (Hard Requirements)
- MUST: Verify each referenced table, view, package, function, procedure, sequence, and referenced column from one of:
  - the selected offline schema dictionary
  - live DB metadata resolved through `db_connection_name`
  - explicit user assertion naming the object
- MUST: Carry `object_evidence_source` as required input to the internal generate/review/fix loop whenever code references real DB objects.
- MUST NOT: Substitute demo/sample object names such as `EMP`, `DEPT`, `EMPLOYEES`, or similar placeholders for unresolved real-schema references in existing-app work.
- MUST NOT: replace one failing guessed object name with another guessed object name after a runtime or validation error.
- MUST: If runtime or validation output shows that a referenced object does not exist and no alternate verified evidence source is available, stop and request schema evidence instead of guessing a replacement.
- MUST: When `object_evidence_source = user_asserted`, preserve that status only for the exact objects asserted by the user; all other referenced objects still require their own evidence state.

Hard stop
- If any required object remains `object_evidence_source: unresolved`, STOP before generating or revising final SQL.
- If a runtime error disproves a guessed object name and no other verified evidence source exists, STOP and return `Missing Inputs`.

Error Code
- `DB_OBJECT_EVIDENCE_REQUIRED_001`

## Report DB Metadata Verification Gate (NON-NEGOTIABLE)

Scope
- Applies to Classic Report and Interactive Report generation when the report source uses `localDatabase` (`source.location: localDatabase`) and SQL/table references real database objects.

Rules (Hard Requirements)
- MUST: Verify source object existence, selected columns, and sort column(s) using either the selected schema dictionary or the provided `db_connection_name` before drafting report SQL.
- MUST: Treat metadata evidence as required input to the internal generate/review/fix loop for report SQL.
- MUST NOT: Assume or invent table names, column names, or `ORDER BY` columns.
- MUST: If requested columns or sort column are not found in metadata, stop and return Missing Inputs with corrective guidance.

Hard stop
- If `prereq_source` is unresolved for Classic/Interactive report tasks against real DB objects, STOP and resolve the prerequisite metadata source first.
- If `prereq_source = schema_doc` and the selected schema dictionary cannot verify the requested report object/columns/sort columns, STOP and return Missing Inputs or ask for live DB context.
- If `prereq_source = saved_connection` or `prereq_source = user_prompt`, and live metadata verification is required, STOP when `db_connection_name` is missing/ambiguous.
- If `db_mode = offline` and no selected schema dictionary can verify the requested report SQL, STOP before verified report SQL draft unless the user explicitly requested offline mock output.
- If metadata cannot be verified from the available connection/context, STOP and return Missing Inputs; do not emit final SQL.

Error Code
- `DB_METADATA_REQUIRED_REPORT_001`

## Pre-Generation DB Verification Gate (NON-NEGOTIABLE)

Scope
- Applies to requests that create or modify APEX artifacts referencing real database objects.
- Includes pages, regions, forms, reports, LOV SQL, and any `localDatabase` SQL source.

Rules (Hard Requirements)
- MUST NOT generate or modify DB-backed APEX artifacts until both conditions are satisfied:
  1) `prereq_source` is explicitly resolved, and
  2) metadata validation confirms source object existence and required columns (including sort/order columns where used) from either the selected schema dictionary or live DB metadata.
- MUST resolve prerequisite metadata source first per `DB_MODE_PROMPT_REQUIRED_001` before build-specific clarifications.
- MUST treat metadata evidence as required input per `DB_METADATA_REQUIRED_REPORT_001` before SQL drafting for DB-backed artifacts.
- MUST NOT infer table/view names or column lists from prompt wording, examples, or prior artifacts.
- MUST return Missing Inputs and halt when connection or metadata validation is unavailable/ambiguous.
- MUST allow `db_mode = offline` only for explicit offline/mock output and never as an inferred fallback.

Hard stop
- If `prereq_source` is unresolved, STOP before draft generation.
- If `prereq_source = schema_doc` and the selected schema dictionary cannot verify the referenced DB objects, STOP before final draft generation unless the user explicitly requests offline mock output.
- If `prereq_source = saved_connection` or `prereq_source = user_prompt`, and the request requires live metadata/runtime work, STOP before draft generation when `db_connection_name` is missing.
- If `db_mode = offline` and the request depends on verified real DB objects not covered by the selected schema dictionary, STOP before final draft generation unless the user explicitly requested offline mock output.
- If live metadata validation is required and missing for referenced DB objects, STOP before draft generation.

Error Code
- `DB_VERIFY_BEFORE_GENERATION_001`

## Report SQL/PLSQL HTML Literal Gate (NON-NEGOTIABLE)

Scope
- Applies to report-generation workflows (Classic Report, Interactive Report, Interactive Grid) when SQL/PLSQL source blocks are generated or revised.
- Includes report `source.sqlQuery` and any related SQL/PLSQL source snippets used for report rendering concerns.

Rules (Hard Requirements)
- MUST NOT embed HTML literals in report SQL/PLSQL source blocks for presentation behavior (for example badges, styled currency, status chips, highlighted values).
- MUST return raw data values/flags from SQL and perform presentation rendering only through the canonical report-column rendering contract in `references/policies/memory-bank/30-pages/apex.report-column-rendering.md`.
- MUST treat SQL/PLSQL output as data, not markup, for report UI rendering.
- MUST hard-fail critique when report SQL/PLSQL contains HTML-tag literals intended for UI rendering.

Hard stop
- If HTML literals are detected in report SQL/PLSQL presentation logic, STOP finalization and emit required revisions per `apex.report-column-rendering.md`.

Error Code
- `REPORT_SQL_HTML_LITERAL_FORBIDDEN_001`

## Static-ID WHERE Comparison Normalization Gate (NON-NEGOTIABLE)

Scope
- Applies to SQL/PLSQL `WHERE` predicates that compare columns ending with `_static_id` to values/binds.
- Applies across report SQL, LOV SQL, authorization SQL/PLSQL, and server-side condition SQL/PLSQL snippets.

Rules (Hard Requirements)
- MUST normalize `_static_id` value comparisons using `LOWER()` in one of these canonical forms:
  - `lower(col_static_id) = lower(<value_or_bind>)`
  - `lower(col_static_id) != lower(<value_or_bind>)`
  - `lower(col_static_id) in ('lowercase','values')`
- MUST NOT emit case-sensitive or mixed-case direct comparisons on `_static_id` columns (for example `col_static_id = 'ROLE_ADMIN'`).
- MUST normalize during revision when legacy artifacts contain non-normalized `_static_id` predicates.
- MUST hard-fail critique when non-normalized `_static_id` predicates remain.

Error Code
- `STATIC_ID_WHERE_LOWER_REQUIRED_001`

## ACL Role Declaration Dependency Gate (NON-NEGOTIABLE)

Scope
- Applies when shared-component authorizations use role membership checks via:
  - SQL/PLSQL predicates against `role_static_id` (for example `apex_appl_acl_user_roles`), or
  - Authorization scheme types `isInRoleOrGroup` / `isNotInRoleOrGroup` with role names.

Rules (Hard Requirements)
- MUST declare application ACL roles in `applications/<app>/shared-components/acl-roles.apx` whenever role-based authorization checks are emitted.
- MUST ensure every role referenced by authorization checks is declared exactly once in the acl-roles artifact (`role <static-id> (...)`).
- MUST use lowercase kebab-case for role static IDs (`[a-z0-9]+(?:-[a-z0-9]+)*`).
- MUST hard-fail critique/validation when:
  - the acl-roles artifact is missing while role-based authorization checks exist,
  - any referenced role is not declared, or
  - any declared/referenced role static ID is not lowercase kebab-case.

Error Code
- `ACL_ROLE_DECLARATION_REQUIRED_001`


## REST Data Source Standards (Non-Negotiable)
Purpose
- Ensure every REST-based region/process/LOV uses APEXlang `restSource` references consistently.
- Prevent guessed aliases and unvalidated dataProfiles.

Scope
These rules apply to any work that:
- Creates or modifies a REST Data Source
- Creates or modifies a REST Data Source Remote Server
- Creates or modifies any page/region/LOV/process whose source is REST (REST Data Source / REST Source)

Hard stop
- If any requirement below cannot be met, STOP and clearly report what is blocked and why (for example: “Cannot perform REST call for discovery/validation in this environment”).

Terminology
- APEX UI “REST Data Source” maps to APEXlang references via `restSource: @<rest-data-source-alias>`.

## REST Source Canonical Reference Rule (NON‑NEGOTIABLE)

Hard requirements
- For page processes with `type: invokeApi`, MUST use `invoke { type: restSource ... }`.
- MUST NOT use `invoke { type: restDataSource ... }` even if the user says “REST Data Source”.
- For any REST-based region/LOV source, `source.location` MUST be `restSource`.
- Regions/processes/LOVs MUST reference the REST Data Source using `restSource` (NOT `restDataSource`).
  - Required (region/LOV):
    - `source { location: restSource restSource: @<rest-data-source-alias> }`
  - Required (process):
    - `invoke { type: restSource restSource: @<rest-data-source-alias> ... }`
  - Prohibited:
    - `source { location: restSource restDataSource: @<...> }`

## REST Data Source Alias Mapping (NON‑NEGOTIABLE)

Purpose
- Prevent ambiguous “REST Data Source name” references from being guessed.
- Ensure `invokeApi` and REST regions always reference the real APEX REST Data Source alias.

Rules (Hard Requirements)
- When the user asks to use a “REST Data Source” named like “abc”, you MUST NOT guess the APEXlang alias.
- You MUST locate the actual REST Data Source shared component under:
  - `applications/<APP_NAME>/shared-components/rest-data-sources/`
- You MUST use the discovered shared component alias as the `restSource` reference.
- If multiple REST Data Sources appear to match the user’s name OR no matching alias is found:
  - STOP and ask the user which REST Data Source alias to use.
  - Do not proceed with placeholders (e.g. `@abc`) or inferred mappings.

## Required folder layout (do not deviate) for Remote Servers of REST Data Source (Non-Negotiable)
Scope
Verify this folder exists (create if missing):
- applications/<APP_NAME>/workspace-components/rest-data-source-servers/
Store Remote Server artifact(s) only in:
- applications/<APP_NAME>/workspace-components/rest-data-source-servers/

## Required folder layout (do not deviate) for REST Data Source (Non-Negotiable)
Verify this folder exists (create if missing):
- applications/<APP_NAME>/shared-components/rest-data-sources/
Store REST Data Source artifact(s) only in:
- applications/<APP_NAME>/shared-components/rest-data-sources/

## Remote Server “single origin” rule for REST Data Source (NON-NEGOTIABLE)
A restDataSourceServer MUST represent exactly one origin:
- scheme + host + optional base path
- DO NOT split the hostname between different attributes (for example, never put part of the hostname in endpointUrl and part in urlPathPrefix).
- If REST Data Sources use different hostnames, you MUST create one Remote Server per hostname and ensure each REST Data Source references the correct Remote Server.

## Templates of REST Data Source, REST Data Source Remote Servers and REST Source as Page/Region Source are examples only (NON-NEGOTIABLE)
The following are reference examples only:
- templates/workspace-components/rest-data-source-servers/
- templates/shared-components/rest-data-sources
- templates/region-components/
- MUST NOT copy these templates “as-is”. They may only be used as guidance after performing discovery and validation (see below).

### REST synchronization attributes in examples are placeholders (NON-NEGOTIABLE)
In `templates/shared-components/rest-data-sources/rest-data-sources._common.md`, the example values for:
- `localTableOwner`
- `localTableName`
- `schedule`
- `httpRequestLimit`
are **reference placeholders only**.

Rules:
- MUST NOT reuse these example values as-is.
- If the user asks to enable REST synchronization or change or update the synchronization `type` and does not specify a schedule, STOP and ask for the schedule requirements before making changes.
- Schedule requirements MUST include: frequency (FREQ), interval, hour (BYHOUR), minute (BYMINUTE), second (BYSECOND).
- If a change touches `restSynchronization` and the user did not specify `schedule` (and optionally `httpRequestLimit`), STOP and ask for the exact values; do not apply template example values.
- Synchronization type mapping (NON-NEGOTIABLE):
  - If the user requests synchronization type `append`, DO NOT emit a `type` attribute in `restSynchronization`.
    - Rationale: `append` is the APEX default and omitting `type` keeps output deterministic.
  - If the user requests synchronization type `replace`, STOP and ask if user wants fullRefreshDelete or fullRefreshTruncate and then use `type: fullRefreshDelete` or `type: fullRefreshTruncate` respectively (not `type: replace`).
  - If the user requests synchronization type `merge`, you MUST emit `type: merge`.
- If REST synchronization is requested:
  - MUST set `localTableOwner` to the user’s requested target schema (or ask if we can use the same schema where app is present else STOP and ask if not provided).
  - MUST set `localTableName` to the user’s requested target table (or STOP and ask if not provided).
  - MUST set `schedule` and `httpRequestLimit` based on explicit user requirements (or STOP and ask if not provided).

## REST Data Source dataProfile requirements (NON-NEGOTIABLE)

Minimum acceptable discovery inputs
To create/update a REST Data Source dataProfile, at least one of the following MUST be available:
- A successful REST execution from this environment, OR
- User-provided OpenAPI/Postman/spec, OR
- User-provided sample response body (for each operation) and required request body examples.

When creating/updating a REST Data Source, you MUST:
- Perform a complete rediscovery for the REST Data Source.
- Enumerate all available operations on the REST Data Source.
- Generate a dataProfile that includes every field/column present in the REST response.
- Include the full hierarchical structure of nested objects/arrays (not flattened or partial unless explicitly required).

POST operation rules
- If there is a POST operation and there is also a GET operation:
  - Generate a request body in JSON format based on the columns/shape retrieved via GET.
- If there is only a POST operation and no GET operation:
  - STOP until the user provides the POST request body (schema or example).

Validation
- Validate the dataProfile by executing the configured operation (or by comparing against a user-provided response body/spec).
- Compare the discovered profile vs the actual response body.

Hard stop on missing validation
- If you cannot make a successful REST call and no acceptable discovery inputs are provided, you MUST:
  - Stop before creating dependent regions/pages/LOVs/processes
  - Explain clearly that discovery/validation could not be completed
  - Do not proceed with “best guesses” or placeholder profiles

## REST Source page/region requirements (NON-NEGOTIABLE)
When creating or modifying any page region whose data source is a REST Data Source:
- You MUST follow the canonical page/region templates under `templates/region-components/` for overall structure. Templates are guidance only; do not copy “as-is”.
- The region MUST follow the REST Source Canonical Reference Rule.
- The `restSource` reference MUST point to a REST Data Source defined under `applications/<APP_NAME>/shared-components/rest-data-sources/`.
- Remote server configuration is defined ONLY inside the REST Data Source shared component (via its `source.remoteServer`), not inside the page region `source` block.
  - Do NOT add `remoteServer` / `remoteServers` attributes under the region `source` block unless a separate, explicit canonical template + rule exists for that structure.
- DO NOT assume response shape, fields, or nesting.
- The region’s columns MUST match the REST Data Source dataProfile.
  - Include all columns from the dataProfile unless the user explicitly restricts columns.
  - Synchronize/refresh columns so the region is consistent with the profile.

Pagination
- Default to pagination type `pageSizeAndFetchOffset` (per `rest-data-sources._common.md`).
- Only change `paginationType` when the user explicitly requests a different mode or when endpoint constraints are explicitly known.

- Always create a navigation menu entry to a new page created unless asked explicitly by user not to.

## REST Source process requirements (NON-NEGOTIABLE)
When creating or modifying any page process whose type is restSource follow the below without fail.
- The process MUST follow the REST Source Canonical Reference Rule.
- In the process, do not use the template provided in `templates/business-logic/processes/processes._common.md` as-is.
- Derive the parameters based on the dataProfile and the operation’s parameter definitions (or STOP if those are not discoverable/validated).

## REST Source Shared Component LOVs (Non-Negotiable)
When asked to create an LOV with source as REST Data Source/REST Source:
- Follow the structure from `lovs.apx` under templates using:
  - `source { location: restSource restSource: @<rest-data-source-alias> }`
- Enforce that LOV display/return columns exist in the REST Data Source dataProfile (or STOP).


# Report Region Link Target Resolution Gate (Non-Negotiable)

Purpose
- Prevent ambiguous or overly indirect navigation patterns in report-like regions and force an explicit link-mode decision before generation.

Scope
- Applies whenever a Classic Report, Interactive Report, or Interactive Grid is asked to create or revise navigation at the region, row, or column level.

Rules (Hard Requirements)
- MUST: Ask the user which link mode is intended every time report-region navigation is created or changed.
  - Valid choices are:
    - redirect to a page in the same application
    - redirect to a page in another application
    - redirect with a URL
- MUST: If the required link-mode choice remains unresolved after the single clarification round, stop with `Missing Inputs`.
- MUST: When the user chooses a page in the same application and the DSL supports a declarative page target, use the declarative target object (`page`, `items`, `clearCache`, and related properties) instead of a URL string.
- MUST NOT: Default same-application report links to `type: url`, `f?p=...`, or SQL-computed `apex_page.get_url(...)` when the component DSL can express the target declaratively.
- MUST: Reserve URL targets for explicit URL redirects and component families that genuinely require a URL/string target.
- MUST: Treat page redirects into another application as a separate explicit mode; do not infer them from a URL-looking string when the user has not chosen the cross-application option.

# Button Same-App Target Resolution Gate (Non-Negotiable)

Purpose
- Keep page button navigation declarative for same-application redirects.

Scope
- Applies whenever a page button uses `behavior.action: redirectThisApp`.

Rules (Hard Requirements)
- MUST: Render `redirectThisApp` targets with the declarative `target { page, items, clearCache, action, request }` object.
- MUST NOT: Render `redirectThisApp` targets as scalar URL strings such as `f?p=...`.
- MUST: Reserve scalar URL strings for explicit URL redirects or cross-application behavior that cannot be expressed as `redirectThisApp`.

Enforcement (Agents & Workflows)
- Draft: ask the link-mode question before drafting Classic Report, Interactive Report, or Interactive Grid navigation.
- Critique: hard-fail same-app report links and `redirectThisApp` buttons that use URL/string targets when declarative page-target syntax is available and the user did not explicitly choose URL mode.
- Revision: normalize same-app report links and `redirectThisApp` buttons to declarative page-target syntax when the target page and item mapping are known.


# Process Type Policy — invokeApi Preferred with Thin Wrapper Exception (Non‑Negotiable)

Purpose
- Keep APEX page process execution declarative and safely routed through APEX artifact orchestration.

Scope
- Applies to all page `process` blocks that call PL/SQL package procedures/functions.
- Application processes `appProcess` follow a separate hard rule: `type: executeCode` only.
- Dynamic Content regions using `plsqlFunctionBody` for rendering are out of scope (allowed), but must not perform DML.
- Does not define generic PL/SQL package design, coding style, tuning, or testing best practices; those belong to the upstream Oracle DB skills.

Rules (Hard Requirements)
- MUST: When a user asks to create a process without explicitly specifying scope, first evaluate whether it should be an application process (`appProcess`). Default to `appProcess` when feasible; use page process only when page-context coupling is required or the user explicitly requests page-level placement.
- MUST: Prefer declarative shapes over PL/SQL when the workflow can be expressed through supported native APEX DSL/process constructs.
- MUST: Prefer `type: invokeApi` for page-process calls to packaged procedures/functions when the page can map inputs and outputs declaratively with reliable runtime behavior.
  - Provide `invoke { package: <PKG_NAME> procedureOrFunction: <PROC_OR_FUNC> }`.
  - Provide one `parameter ( ... )` block per argument with proper `direction` (in | out | in out) and value mapping:
    - value { item: Pn_X } for item-based values
    - value { type: expression plsqlExpression: ... } for expressions when needed
    - Include `parameter { dataType: boolean, hasDefault: true }` where the API signature requires it (see login example).
- MUST: Allow `type: executeCode` for a thin page-level orchestration wrapper when all of the following are true:
  - the business logic remains in a packaged API,
  - the anonymous block is a small named-notation package call only,
  - direct page-item assignment is required for reliable runtime behavior, page-context coupling, or before-header branch gating.
- MUST NOT: Treat the thin-wrapper exception as permission to move business logic back into the page process.
- MUST NOT: Use `type: executeCode` for packaged page-process calls when `invokeApi` can express the same behavior safely and declaratively.
- MUST: For `appProcess`, use `type: executeCode` only.
  - `appProcess` MUST NOT use `type: invokeApi`.
  - If invoking packaged logic from `appProcess`, call the package in `source.plsqlCode` using named notation.
- SHOULD: Keep generated APEX pages as orchestration surfaces; use the upstream DB skills for generic PL/SQL package design guidance.

Exceptions (Narrow)
- If a required API does not exist, `executeCode` may be used temporarily for glue-only logic (no complex business rules).
  - This MUST be justified in comments and will be flagged by critique until replaced by an API.
- If `invokeApi` output mapping is runtime-unsafe for a page-coupled loader or branch-gated flow, a thin wrapper is allowed without being treated as a violation.

Enforcement (Agents & Workflows)
- Agent 2 (Critique): For page processes, flag `executeCode` package calls unless the block is a thin orchestration wrapper that only invokes packaged logic with named notation and directly maps page-context values/items.
  - Outcome: Require conversion to `invokeApi` when the wrapper exception does not apply.
- Agent 2 (Critique): For `appProcess`, hard-fail when `type: invokeApi` appears.
- Agent 3 (Revision): Convert non-compliant `appProcess type: invokeApi` blocks to `type: executeCode` with named-notation PL/SQL package calls in `source.plsqlCode`.
- Master Workflow: Pre‑Agent 0 activates this policy; do not bypass.

Notes
- Dynamic Content `plsqlFunctionBody` remains allowed for HTML rendering only (no DML, no commits).
- This guard supersedes older patterns that encouraged inline `plsqlCode` for packaged calls.
- Documentation/demo templates may retain inline CSS or JavaScript inside page-level attributes only when the behavior being demonstrated cannot be expressed through existing static files or declarative settings; the snippet must precede with a Markdown-style comment explaining its instructional purpose (for example, `/* docs: demonstrates legend icon override */`). Remove unused inline styling rather than migrating it to shared static files when it is not required for the permutation being documented.

# SQL/PLSQL Inline Size and DB Object Connection Gate — Non‑Negotiable

Purpose
- Hard-stop oversized inline SQL/PLSQL in APEX artifacts and enforce explicit DB connection confirmation before any database object creation/update.

Scope
- Applies to all PL/SQL text blocks in APEX artifacts, including:
  - process `source.plsqlCode`
  - dynamic action `executeServerSideCode` PL/SQL bodies
  - validation/computation PL/SQL bodies (`plsqlExpression`, function-body variants)
  - fenced ```plsql``` blocks in generated APEXlang artifacts
- Applies to all SQL text blocks in APEX artifacts, including:
  - region/report/form/LOV `sqlQuery`
  - computation `sqlQuery`
  - fenced ```sql``` blocks in generated APEXlang artifacts
- Applies to any request that creates or updates database objects (for example packages, procedures, functions, tables, views, triggers, types).
- Does not define generic SQL or PL/SQL best practices; it only bounds APEX artifact payloads and DB-object safety for APEXlang workflows.

Rules (Hard Requirements)
- Character-count method is the raw body text inside the SQL/PLSQL block, including whitespace, blank lines, and comments.
- MUST NOT emit inline PL/SQL bodies longer than 4000 characters.
- MUST NOT emit inline SQL bodies longer than 4000 characters.
- If PL/SQL exceeds 4000 characters, MUST extract to a package API (default `app_process_api` unless justified) and reference it through the page-process policy (`type: invokeApi` by default, or a justified thin `executeCode` wrapper; `type: executeCode` for appProcess).
- If SQL exceeds 4000 characters, MUST extract to a secure view and have the page/region/LOV/computation reference that view instead of embedding the full query inline.
- If package/view identity or metadata is missing, MUST return Missing Inputs rather than inventing database object definitions.
- Before creating or updating any database object, MUST resolve prerequisite metadata source first.
- Before live create/update work against a database, MUST resolve `db_mode`.
- If `db_mode = online`, MUST resolve `db_connection_name` before creating or updating any database object.
- MUST NOT generate or apply DB object DDL or DML changes when `db_mode` is unresolved, or when `db_mode = online` and `db_connection_name` is missing or ambiguous.

Enforcement (Agents & Workflows)
- Agent 2 (Critique): hard-fail `PLSQL_INLINE_BLOCK_001` when inline PL/SQL body length > 4000 characters.
- Agent 2 (Critique): hard-fail `SQL_INLINE_BLOCK_001` when inline SQL body length > 4000 characters.
- Agent 2 (Critique): hard-fail `DB_CONN_REQUIRED_001` when DB object creation or update is attempted without `db_connection_name`.
- Agent 3 (Revision): block finals until all findings are resolved.

# Computation Type Guardrail — Non‑Negotiable

Purpose
- Prevent invalid computation bodies by enforcing the correct computation type for SQL vs PL/SQL.

Scope
- Applies to all APEX page/item computations (Before Header, After Submit, and item defaults).

Rules (Hard Requirements)
- MUST: Use `type: expression` only for valid PL/SQL expressions (no `select`).
- MUST: Use `type: sqlQuery` when the body starts with a SQL `select` statement.
- SHOULD: Prefer a single Before Header process when setting multiple items from the same query.
- MUST NOT: Place a SQL query inside `plsqlExpression` or `type: expression`.

Validation Heuristics
- If the body begins with `select`, it is SQL → `type: sqlQuery` or a process.
- If the body contains `from`, it is likely SQL → do not use `type: expression`.

Enforcement (Agents & Workflows)
- Draft: Emit computations with the correct type for the body.
- Critique: Fail if `type: expression` contains `select` or `from`.
- Revision: Convert invalid computations to `type: sqlQuery` or move into a single process.

# APEX Artifact PL/SQL Call Safety — Non‑Negotiable

Purpose
- Keep generated APEX artifact PL/SQL calls explicit when APEXlang must emit PL/SQL text.

Scope
- Applies to PL/SQL text emitted in Oracle APEX artifacts: processes, dynamic actions, validations, page/item computations, and generated APEXlang fenced PL/SQL blocks.
- Applies to APEX_* calls and custom application package calls inside generated APEX artifact PL/SQL text.
- Does not define generic PL/SQL coding standards for standalone packages or SQL Workshop scripts; use upstream DB skills for that guidance.
- Parameterless routines may be called without arguments.
- Overloaded routines must always be called with named notation.

Rules (Hard Requirements)
- MUST: Use named notation `param_name => value` for every argument when a routine has parameters.
- MUST NOT: Use positional arguments.
- MUST NOT: Mix named and positional notation in the same call.
- Applies inside APEX artifact PL/SQL text contexts we generate or revise:
  - `plsqlCode`, `plsqlFunctionBody`, and `plsqlExpression`.
- Note: `invokeApi` process parameter blocks are inherently “named”; this policy governs PL/SQL text calls.

APEX artifact examples
- Correct:
  ```
  APEX_MAIL.SEND(
    p_to   => 'user@example.com',
    p_from => 'no-reply@example.com',
    p_subj => 'Welcome',
    p_body => 'Hello!'
  );
  APEX_JSON.INITIALIZE_CLOB_OUTPUT(p_preserve => true);
  APEX_JSON.WRITE(p_name => 'status', p_value => 'ok');
  APEX_UTIL.SET_SESSION_STATE(p_name => 'P10_FLAG', p_value => 'Y');
  v_cnt := APEX_STRING.SPLIT_COUNT(p_str => :P10_LIST, p_separator => ',');
  app_process_api.save_order(p_order_id => :P10_ORDER_ID, p_status => :P10_STATUS);
  ```
- Incorrect:
  ```
  APEX_MAIL.SEND('user@example.com', 'no-reply@example.com', 'Welcome', 'Hello!');
  APEX_JSON.INITIALIZE_CLOB_OUTPUT(true);
  APEX_UTIL.SET_SESSION_STATE('P10_FLAG', 'Y');
  f(p_x => x, y); -- mixing named and positional (not allowed)
  ```

Enforcement (Agents & Workflows)
- Draft: Generators must emit named notation for every call with arguments in PL/SQL text.
- Critique: Flag any call with arguments lacking `=>` (positional) or mixing `=>` with bare arguments.
- Revision: Do not auto‑convert without a known signature catalog; require explicit rewrites (list offending calls and suggested patterns).

Tags: process, invokeApi, executeCode, package, procedure, function, parameters, critique, revision, named-notation

# PL/SQL Consolidation and Package Naming Guardrail — Non‑Negotiable

Purpose
- Keep extracted APEX artifact logic deterministic and avoid page-scoped package proliferation.

Scope
- Applies only when APEXlang extracts oversized or reusable PL/SQL out of APEX artifacts.
- Does not define generic PL/SQL package architecture; route generic package-design decisions to upstream DB skills.

Rules (Hard Requirements)
- Default single package: app_process_api for all extracted inline PL/SQL across an application scope.
- Disallowed names: any package name tied to page numbers or IDs (e.g., ^p[0-9]+_ or names referencing page IDs).
- Modularization exceptions: Allowed only with explicit justification and review; names must be neutral/domain-oriented, never page-based.
- Critique must hard-fail violations; Revision must block generation until naming is corrected.

Enforcement (Agents & Workflows)
- Routers and masters must load this guard and apply it as a gate. Pre‑Agent 0 records intended package name; Agent 3 verifies naming and emits design with app_process_api by default.
- Acceptance criteria must include “No page-number-based package names” and “Consolidation into single app_process_api unless justified”.

# utPLSQL Boundary for Extracted APEX Artifact Logic

Policy
- APEXlang may identify extracted `app_process_api` procedures as candidates for tests when a workflow extracts APEX artifact logic.
- APEXlang must not define generic utPLSQL authoring, installation, execution, reporting, suite selection, or CI policy.
- Generic utPLSQL rules and execution details belong to the upstream Oracle DB skills.

# Login Process Boundary Guardrail — Non‑Negotiable

For login flows, page-level processes must be restricted to authentication primitives only (`APEX_AUTHENTICATION.LOGIN` and optional `APEX_AUTHENTICATION.SEND_LOGIN_USERNAME_COOKIE`); any other behavior (audit logging, telemetry, routing, notifications, or business logic) is mandatory at application level via `appProcess`, unless the user explicitly asks for page-level placement, and critique/revision must fail and relocate non-compliant logic automatically.
