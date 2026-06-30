# APEXlang Domain References

Canonical packaged entrypoint for APEXlang domain guidance.

## Domain Index

| Domain | Support Folder |
|--------|----------------|
| Page Components | `references/domains/page-components/` |
| Business Logic | `references/domains/business-logic/` |
| Shared Components | `references/domains/shared-components/` |
| Template Components | `references/domains/template-components/` |
| Universal Attribute Configuration | `references/domains/universal-attr-config/` |
| Debugging | `references/domains/debugging/` |

## Page Components

**Parent Entry:** `SKILL.md`

### Purpose
- Provide a single domain entrypoint for page composition work that spans multiple component subskills.
- Route requests to the minimal subskill set while keeping component domains modular.

### Nested Reference Packages
- `references/domains/page-components/page-patterns.md`
- `references/domains/page-components/regions.md`
- `references/domains/page-components/page-items.md`
- `references/domains/page-components/buttons.md`
- `references/domains/page-components/screenshot-to-layout.md`
- `references/domains/README.md`

### Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `assets/rules-mapping.json`
- `references/policies/memory-bank/40-components/apex.region-contracts.md` plus its specialized region files for cross-region legality, data-source semantics, BLOB/media handling, contextual info, filter namespaces, and region interaction constraints.
- Domain rules under `references/policies/memory-bank/10-global`, `20-data`, `30-pages`, and `40-components` based on routed subskills.

### Operational References
- Template/workflow catalogs in each subskill under `skills/*/references/**`.
- Canonical route selection and synonyms from `assets/apex-generation/components.registry.json`.

### Execution Agents
- Shared SQLcl and runtime gates come from `references/ops/sqlcl-agents/` and `references/ops/runtime-gates/`.
- Import-ready runs must include `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` before completion.
- The internal generate/review/fix loop remains owned by `references/workflows/apex-generation/agents/`.

### Loading Guidance
- Single-domain request: load the matching nested reference package directly from the root APEXlang router.
- Screenshot-driven page drafting: load `references/domains/page-components/screenshot-to-layout.md` before broader page-pattern or region packages.
- Multi-domain page request: start here, split scope by component area, and load each slice from the correct nested reference package.
- If policy prose and workflow prose conflict, policy files in references/policies/memory-bank/governance win.

## Business Logic

**Parent Entries:** `references/domains/README.md` (domain), `SKILL.md` (router)

### Purpose
- Configure declarative business logic: validations, item computations, dynamic actions, and invokeApi batch processes.
- Centralize template usage for validations/computations/dynamic actions.

### Partitioned Workflow Layout
- `references/domains/business-logic/computations/workflow-computations-batch.md`
- `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions.md`
- `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-batch.md`
- `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-plsql-batch.md`
- `references/domains/business-logic/processes/workflow-page-processes-batch.md`
- `references/domains/business-logic/validations/` (reserved for future validation workflow partitions)

### When to Trigger
- The user requests validation rules, computation setup, or complex dynamic actions that coordinate with page items and regions.

### Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/memory-bank/20-data/apex.logic.md`
- `references/policies/memory-bank/20-data/apex.sql.md`
- `references/policies/memory-bank/20-data/apex.schema-modeling.md` (when validation references schema constraints)
- `references/policies/governance/00-governance.md`

### Operational References
- `references/domains/business-logic/templates.md`
- `references/domains/business-logic/computations/workflow-computations-batch.md`
- `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions.md`
- `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-batch.md`
- `references/domains/business-logic/dynamic-actions/workflow-dynamic-actions-plsql-batch.md`
- `references/domains/business-logic/processes/workflow-page-processes-batch.md`

### Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md` when DB context is required.
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` for import-ready completion checks.
- The internal generate/review/fix loop remains under `references/workflows/apex-generation/agents/`.

### Agent Flow
- Invoke `references/ops/sqlcl-agents/00-connection-gate.md` if server-side validation or invokeApi conversions require DB context.
- Coordinate the internal generate -> review -> fix loop via Apex Developer master agents.
- For import-ready runs, execute `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` before completion.

### Outputs
- Validation definitions in page/shared component APEXlang files.
- Computation entries with correct type (expression vs sqlQuery) and guardrails.
- Dynamic actions referencing canonical templates documented in this skill.

### Parallel Skill Contract
- Emit `claims` for each logic mutation (DA/process/computation/validation).
- Emit `required_inputs` and `assumptions` for missing identifiers or signatures.
- Emit `source_paths` for every workflow/template/rule file referenced.
- Contradictions with region/page/shared-component skills must halt as `Missing Inputs`.

Use this package as the hub for business-rule configuration within APEX pages.

## Shared Components

**Parent Entry:** `SKILL.md`

### Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `assets/rules-mapping.json`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/20-data/apex.logic.md`
- `references/policies/memory-bank/20-data/apex.sql.md`

### Operational References
- `references/domains/shared-components/templates.md`
- `references/domains/shared-components/workflow-translations.md`
- `references/domains/shared-components/workflow-translations-batch.md`
- `references/domains/shared-components/reusable-prompts/translations.md`
- `references/policies/governance/prompt-normalization.md`
- `references/domains/universal-attr-config/workflow-page-sequencing.md`
- `references/domains/universal-attr-config/workflow-server-side-conditions-batch.md`

### Template Sources
- Canonical template root: `templates/shared-components/README.md`
- Machine-readable template catalog: `templates/shared-components/shared-components.registry.json`
- Family templates live under `templates/shared-components/**`
- For new applications, only the runtime shared-component seed comes from `templates/base-app-structure/scaffold-example/shared-components/**`. Do not publish template-family docs, metadata, or the `scaffold-example/` directory itself into app roots.

### Template Families
- Navigation and reusable metadata: `lists/`, `breadcrumbs/`, `lovs/`
- Shared security: `authorizations/`, `acl-roles/`, `authentications/`
- App-level runtime configuration: `app-processes/`, `app-computations.md`, `app-items.md`, `build-options.md`, `component-settings/`
- Reusable communication and workflow assets: `translations/`, `email-templates/`, `task-definitions/`
- External-service and assistant assets: `rest-data-sources/`, `ai-agents/`

### Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md`
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`
- The internal generate/review/fix loop remains under `references/workflows/apex-generation/agents/`.
- `references/ops/runtime-gates/01-direct-sqlcl-import.md` for online import runs.

### Purpose
- Manage shared navigation lists, breadcrumbs, LOVs, authorization schemes, ACL roles, and translation assets.
- Ensure shared components remain synchronized with page scaffolding, shared security metadata, and translations policy.

### When to Trigger
- User requests updates to navigation lists, global LOVs, authorization schemes, ACL roles, translation bundles, or SSC batch adjustments impacting shared components.

### Loading Guidance
- Load this package from `SKILL.md` when the request is clearly about shared components, shared LOVs, breadcrumbs, authorization schemes, ACL roles, or localization workflows.
- After this package is selected, treat `templates/shared-components/README.md` as the canonical family catalog before opening family-specific template files.
- Use `templates/shared-components/shared-components.registry.json` only when a compact machine-readable family lookup is needed.
- Load the narrowest family contract that matches the prompt:
  - `translations/` plus the translation workflow docs for text-message localization
  - `lists/` and `breadcrumbs/` for navigation metadata
  - `lovs/` plus `apex.items.md` for shared LOV definitions
  - `authorizations/`, `acl-roles/`, or `authentications/` for shared security metadata
  - the relevant app-level family for processes, computations, build options, component settings, task definitions, AI agents, REST data sources, email templates, or app items
- For `task-definitions/` specifically, prefer imported task-definition artifacts that already work in the active target app as the first syntax reference after loading the family contract.
- For new task definitions, start from the minimal imported shape:
  - top-level `type: approval|action`
  - `task { subject ... }`
  - `advanced { detailsPage: { page, items, clearCache, action: resetPagination } }`
  - one or more `participant` blocks
- Do not default new task definitions to string `detailsPage: f?p=...` syntax when the task-definition family and imported artifacts prove the structured object form.

### Localization Override
- Plain-language app/page localization requests must route to the translation workflows before generic shared-component or page-generation guidance.
- Required outcome for app/page localization:
  - `shared-components/messages.apx`
  - `application.apx` with `globalization { translationMethod: textMessages }`
  - component rewiring to `&APP_TEXT$KEY.`
- Do not satisfy localization by inlining translated literals directly into page titles, region names, labels, help text, breadcrumbs, no-data messages, confirmations, or static HTML.
- Preserve placeholder tokens and HTML markup in translated text.
- If the prompt explicitly asks for a page control such as a `button`, `menu`, or `selector` together with translation/language wording, do not treat it as a pure translation request. Clarify runtime language switching versus localization first.
- If the target language is missing, halt with Missing Inputs.
- If scope is unclear, ask the configured simple-English follow-up instead of inventing scope.
- Accept free-form prompts by default and normalize intent directly according to `references/policies/governance/prompt-normalization.md` before shared-component workflow selection.
- Allow only one clarification round for unresolved critical blockers; then stop with `Missing Inputs`.
- Restrict changes to the shared-component scope explicitly requested by the user.

### Required Inputs
- For navigation/breadcrumb updates: page number, list target, breadcrumb label.
- For shared LOVs: list name, table/columns, display/value pairs.
- For authorizations / ACL roles: scheme name, authorization type, role or group names, and whether the run must emit or update `shared-components/acl-roles.apx`.
- For translations in discovery mode: target language plus app scope (`whole app` or `one page`).
- For translations in explicit mode: translation languages, key-value bundle, output artifact (`shared-components/messages.apx` in the generated application).
- For SSC batches: token name and target component references.

### Covered Workflows
- `references/domains/universal-attr-config/workflow-page-sequencing.md` (navigation/breadcrumb append operations)
- `templates/shared-components/authorizations/*.md` (authorization schemes and role/group checks)
- `references/domains/shared-components/workflow-translations.md`, `references/domains/shared-components/workflow-translations-batch.md` (translations of apps using text messages)
- `references/domains/universal-attr-config/workflow-server-side-conditions-batch.md` (when SSC tokens apply across shared components)
- Shared LOV creation via `references/domains/template-components/workflow-items-templates.md`
- Template-first shared-component maintenance via `templates/shared-components/**` for authentications, app processes, app items, build options, component settings, task definitions, REST data sources, email templates, AI agents, and other shared metadata families without a narrower workflow doc

#### Progressive Prompts
1. “Do shared components being updated require server-side conditions? (Reply ‘none’ to skip.)”
2. Gather `scope`, `identifier`, catalog `type`, and attributes per `20-data/apex.logic.md`.
3. For shared-component family routing:
   - If the request is about navigation metadata, route to `lists/` or `breadcrumbs/`.
   - If the request is about shared security metadata, route to `authorizations/`, `acl-roles/`, or `authentications/`.
   - If the request is about reusable app-level metadata not covered by a dedicated workflow, open the matching family from `templates/shared-components/README.md`.
4. For translations:
   - If the request already says `whole app` or `one page`, use that scope.
   - If the request also explicitly asks for a page control such as a `button`, `menu`, or `selector`, ask whether the user wants runtime language switching or text-message localization before continuing.
   - If the request is ambiguous, ask: “Do you want me to translate the whole app or just one page?”
   - If the user chooses one page, ask: “Which page do you want me to translate?”
   - For plain-language localization asks, default to discovery mode that converts user-facing literals into shared message keys and rewires components to substitutions.
   - Ask for message keys or a translation bundle only when the user explicitly provides or requests bundle-based input.

### Rule Loading
1. `references/policies/memory-bank/00-guard/ai.guard.md`
2. `references/policies/governance/00-governance.md`
3. `assets/rules-mapping.json`
4. Load supporting files as needed:
   - `templates/shared-components/README.md` (canonical shared-component family catalog)
   - `templates/shared-components/shared-components.registry.json` (machine-readable family map when needed)
   - `references/policies/memory-bank/10-global/apex.global.md`
   - `references/policies/memory-bank/20-data/apex.logic.md` (SSC policies)
   - `references/policies/memory-bank/20-data/apex.sql.md` (LOV SQL)
   - `references/policies/memory-bank/40-components/apex.items.md` (LOV definitions)
   - `templates/shared-components/authorizations/*.md` (authorization schemes and ACL role-backed access)
   - `templates/shared-components/acl-roles/*.md` (shared ACL role definitions)
   - `templates/shared-components/authentications/*.md` (authentication definitions)
   - `templates/shared-components/lists/*.md`, `templates/shared-components/breadcrumbs/*.md`, `templates/shared-components/lovs/*.md` (navigation and LOV structures)
   - `templates/shared-components/app-processes/*.md`, `templates/shared-components/app-computations.md`, `templates/shared-components/app-items.md`, `templates/shared-components/build-options.md`, `templates/shared-components/component-settings/*.md` (app-level metadata)
   - `templates/shared-components/translations/*.md`, `templates/shared-components/email-templates/*.md`, `templates/shared-components/task-definitions/*.md` (communication and workflow assets)
   - `templates/shared-components/rest-data-sources/*.md`, `templates/shared-components/ai-agents/*.md` (integration and assistant assets)
   - `references/domains/shared-components/workflow-translations*.md`

### Guardrails
- Navigation updates must link using `f?p=&APP_ID.:&PAGE_ID.:&APP_SESSION.::&DEBUG.:::` with logical sequencing.
- Breadcrumb entries required for non-modal pages when flagged.
- Shared LOV SQL must follow guardrails (triple backticks, no inline SQL in expressions).
- Translation outputs respect bundles and languages list; missing translations recorded as Missing Inputs.
- Plain-language translation requests default to discovery mode: find user-facing literals, convert them to shared text-message keys, rewire targeted components to substitutions, and update globalization support.
- Translation runs must not pass with localized literals left in labels, titles, help text, confirmations, breadcrumbs, or other user-facing component attributes when those values should come from shared text messages.
- Translation runs must stay within APEXlang artifacts and standard workflow logs; do not generate unrelated helper source files unless the user explicitly asks for tooling work.
- SSC batches require valid tokens and target descriptors; do not invent conditions.
- Maintain base shared components seeded from templates for application runs.
- Role-based authorizations must stay aligned with `shared-components/acl-roles.apx`; do not emit `isInRoleOrGroup` or `isNotInRoleOrGroup` references to undeclared roles.

### Agent Pipeline
- Invoke `references/ops/sqlcl-agents/00-connection-gate.md`.
- Run the apexdev internal generate -> review -> fix loop to produce shared component updates.
  - working changes stay in the transient temp workspace outside the repo
  - internal review checks PASS/CONFIDENCE and navigation/translation guardrails
  - publish happens only after the run clears required gates
- For import-ready runs, execute `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`.
- After the live APEXlang check passes, offer the canonical GUI/clickable choice: keep check-only or import next.
- Call `references/ops/runtime-gates/01-direct-sqlcl-import.md` only when the post-check import choice is explicit.

### Outputs & Acceptance
- Updated shared component artifacts under `/shared-components/` (or application scope).
- Updated authorization and ACL role artifacts under `/shared-components/authorizations.apx` and `/shared-components/acl-roles.apx` when shared security metadata is in scope.
- Translation artifact stored at `shared-components/messages.apx` in the target application.
- Critique fails if required nav/breadcrumb entries missing, translation languages unresolved, or localization runs leave direct user-facing literals instead of substitution-backed text messages.
- SSC batch runs should preserve a compact run summary in `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` only when the workflow explicitly needs durable evidence.

### Completion Checklist
1. Working shared-component changes stay in the transient temp workspace until review passes.
2. Internal review records PASS/CONFIDENCE and guardrail results.
3. Final shared components publish only after required gates pass.
4. Runtime gate executes for import-ready runs.
5. The import gate executes only when the explicit post-check choice is `Check and import APEXlang code`.

### Examples
These are `illustrative_prompt` examples. Replace any `{{...}}` variables with verified identifiers before use.

- “Add new Administration category in Navigation Menu and breadcrumb for Page 30.”
- “Create shared LOV {{lov.name}} using {{lookup.table}} (value: {{lookup.valueColumn}}, display: {{lookup.displayColumn}}).”
- “Translate my app to Spanish.”
- “Add another language to this app.”
- “Translate one page into Japanese.”
- “Generate translation bundle for en-US, es-ES using provided keys.”

Use this package whenever shared component maintenance is required within apexdev.

### Parallel Skill Contract
- Emit `claims`, `required_inputs`, `assumptions`, and `source_paths` for each shared-component update.
- Cross-skill conflicts (for example, list entry or LOV key collisions) must be raised as `Missing Inputs` for critique/revision resolution.

## Template Components

**Parent Entry:** `SKILL.md`
 — Template Components

This package mirrors the page-items package in this repository, focusing on template selection, layout slots, and reusable component configuration.

---

### Purpose
- Configure region, button, and item templates with approved attributes.
- Ensure layout slots, template options, and inheritance align with Universal Theme guidance.

### When to Trigger
- The user requests template changes, slot assignments, or layout adjustments.
- Needed before/after region creation when template choices are central to layout.

---

### Required Inputs
- Target templates (region, button, list, page)
- Desired template options or slot usage
- Item types needing template overrides
- LOV sources, format masks when relevant

#### Progressive Prompts
1. “Do any template-driven components require a server-side condition? (Reply ‘none’ to skip.)”
2. If yes, capture `scope` (item, button, region, process, dynamic action) and `identifier`.
3. Request catalog `type` from `20-data/apex.logic.md`; collect required attributes.

---

### Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `assets/rules-mapping.json`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/40-components/apex.templates.md`
- `references/policies/memory-bank/40-components/apex.items.md`
- `references/policies/memory-bank/20-data/apex.sql.md`
- `references/policies/memory-bank/20-data/apex.logic.md`

### Operational References
- `references/domains/template-components/templates.md`
- `references/domains/template-components/workflow-items-templates.md`
- `references/domains/template-components/registry.md`
- `assets/domains/template-components/button-actions-prompt.md`
- `assets/domains/template-components/help-text-prompt.md`

### Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md`
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`
- The internal generate/review/fix loop remains under `references/workflows/apex-generation/agents/`.
- `references/ops/runtime-gates/01-direct-sqlcl-import.md` for online import runs.

---

### Rule Loading
1. `references/policies/memory-bank/00-guard/ai.guard.md`
2. `references/policies/governance/00-governance.md`
3. `assets/rules-mapping.json`
4. Load minimal supporting files:
   - `references/policies/memory-bank/10-global/apex.global.md`
   - `references/policies/memory-bank/40-components/apex.templates.md`
   - `references/policies/memory-bank/40-components/apex.items.md` (for item-specific template mapping)
   - `references/policies/memory-bank/20-data/apex.sql.md` when LOV SQL/format masks arise

Templates must be sourced from `templates/template-components/**`, `business-logic/**`, or `items/**` as applicable.

---

### Agent Pipeline
- Run `references/ops/sqlcl-agents/00-connection-gate.md` first.
- Follow the apexdev internal generate -> review -> fix loop, ensuring template attributes and slot placements comply with rules.
- For import-ready runs, execute `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`.
- After runtime gate pass, call `references/ops/runtime-gates/01-direct-sqlcl-import.md` automatically.

---

### Guardrails
- Never invent attribute/value pairs; use documented options from templates and memory-bank examples.
- Enforce the shared composition policy in `references/policies/memory-bank/40-components/apex.templates.md` when template changes affect layout, framing, or label treatment.
- Validate LOV SQL and format masks via `20-data/apex.sql.md` (no `select` inside `plsqlExpression`).
- Server-side condition catalog adherence required.
- Record Missing Inputs when template options or LOV definitions are unclear.

---

### Outputs & Acceptance
- Template updates reflected in relevant APEXlang files (regions, items, shared components).
- Compact run evidence describes template, slot, and option modifications when the workflow explicitly persists logs.
- Critique ensures each requested change maps to valid template attributes.

---

### Completion Checklist
1. Working template changes stay in the transient temp workspace until review passes.
2. Internal review captures PASS/CONFIDENCE and template compliance.
3. Finals update the generated application path only after required gates pass.
4. Runtime gate executes for import-ready runs.
5. After runtime gate pass, the import gate executes automatically.

---

### Examples
- “Switch page 12 region template to Content Row with Title Bar hidden.”
- “Apply Primary Button template option and add requires confirmation to the Save button.”
- “Configure list template for side navigation with new slot assignments.”

Use this package for any template-driven layout tasks within the apexdev orchestration.

## Universal Attribute Configuration

### Purpose
- Manage universal settings: server-side conditions, client-side conditions, help text, region sequencing, developer comments.
- Provide reusable prompts and guardrails for batch operations across components.

### When to Trigger
- The user requests help text updates, conditional logic (SSC/CSC), region sequencing changes, or other universal attribute adjustments.

### Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `assets/rules-mapping.json`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/20-data/apex.logic.md`
- `references/policies/memory-bank/30-pages/apex.page.md`
- `references/policies/memory-bank/40-components/apex.items.md`

### Operational References
- `references/domains/universal-attr-config/templates.md`
- `references/domains/universal-attr-config/workflow-help-text-batch.md`
- `references/domains/universal-attr-config/workflow-server-side-conditions-batch.md`
- `references/domains/universal-attr-config/workflow-page-sequencing.md`
- `references/domains/universal-attr-config/reusable-prompts/help_text.md`

### Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md` when DB-aware checks are required.
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` for import-ready completion checks.
- The internal generate/review/fix loop remains under `references/workflows/apex-generation/agents/`.
- `references/ops/runtime-gates/01-direct-sqlcl-import.md` for approved import runs.

### Provided References
- `references/domains/universal-attr-config/workflow-help-text-batch.md`
- `references/domains/universal-attr-config/workflow-server-side-conditions-batch.md`
- `references/domains/universal-attr-config/workflow-page-sequencing.md`

### Outputs
- Compact run summaries under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` only when the workflow explicitly needs durable evidence
- SSC batch plans and condition tokens
- Region sequencing notes

Use this package alongside page-patterns, page-items, buttons, and business-logic to coordinate attribute configurations.

## Debugging

### Use When
- A concrete failure or drift symptom has already been observed from local validators, `apex validate -input`, `apex import -input`, round-trip comparison, or Builder import UI that is surfacing an import-related failure.
- A direct SQLcl fallback command returns APEXlang compiler errors such as `INVALID_PROPERTY`, `MINIMUM_COMPONENTS_ERROR`, or `MISSING_REQUIRED_PROPERTY`.
- A concrete runtime UI/UX symptom remains in the running app after validate/import succeeded, such as broken navigation expansion, missing current-state highlighting, incorrect focus behavior, or visible page composition drift.
- The user provides an APEX/ORA runtime error message and a live DB connection is available, so the error can be correlated through `APEX_DEBUG_MESSAGES` to a `PAGE_VIEW_ID` execution log.
- The user needs diagnosis plus fix-pattern guidance, not broad repo exploration.
- The fastest path is to classify the failure and route directly to the owning layer.

### Do Not Use When
- The task is to build new APEX artifacts rather than diagnose a validation or import failure.
- The workflow is still in normal preflight or happy-path runtime execution and no validation, import, or drift symptom exists yet.
- The issue is pure SQLcl connection setup and there is no validation or import symptom yet; start with `references/ops/sqlcl.md`.
- The issue is a true Builder transport or auth problem with no APEXlang import signal; treat that as UI transport, not APEXlang debugging.
- The task is non-structural skinning work; that workflow is archived and outside this active package.

### Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `references/ops/sqlcl.md`
- `references/ops/runtime-gates.md`

### Operational References
- `references/domains/debugging/failure-map.md`
- `references/domains/debugging/checks-and-commands.md`
- `references/domains/debugging/apex-debug-messages.md`
- `references/domains/debugging/runtime-ui-verification.md`
- `references/domains/debugging/owning-surfaces.md`
- `references/domains/debugging/fix-patterns.md`
- `references/domains/debugging/example-scenarios.md`

### Trigger Coverage
- `.apx validation failure`
- `APEXlang import failure`
- `created for APEX`
- `compiler version mismatch`
- `metadata generation failure`
- `MMD failure`
- `display-group conflict`
- `plugin conflict`
- `re-export diff`
- `round-trip drift`
- `Builder import error`
- `ORDS error on import`
- `JWT error on import`
- `navigation did not expand`
- `page is not marked current`
- `runtime UI drift after import`
- `APEX_DEBUG_MESSAGES`
- `page_view_id`
- `debug id`
- `session id`
- `APEX runtime error`
- `ORA error in running app`
- `keyboard focus is wrong`
- `responsive layout regression`

### Triage Order
1. Capture the exact symptom and error text.
2. Classify the failure bucket.
3. Run the minimum confirming checks.
4. Identify the owning layer.
5. Apply the standard fix pattern.
6. Re-run the smallest relevant validation or test.

### Failure Taxonomy
- `Builder transport/auth issue`
- `import version-gate failure`
- `APX syntax or file-shape failure`
- `compiler metadata or property-model failure`
- `import canonicalization/upgrade failure`
- `export/writer round-trip drift`
- `plugin/display-group/identifier conflict`
- `runtime session/workspace routing issue`
- `runtime session/wrapper artifact`
- `runtime APEX execution-log failure`
- `runtime UI/UX verification failure`

### Escalation Rules
- Escalate to Builder JavaScript only when the failure is fetch, auth, ORDS, JWT, or other UI transport behavior.
- Escalate to import packages when the failure is import-time coercion, version gating, or canonicalization during import.
- Escalate to property-model and MMD surfaces when the failure is about metadata defaults, requiredness, dependencies, display groups, or property validation.
- Escalate to writer or export code when the defect is explicit-null handling, default omission, field ordering, or dense-export drift.
- Escalate to upgrade logic only when persisted legacy rows must be repaired in storage, not when the import path alone can coerce legacy input.
- Escalate to shared components, page composition, templates, or runtime rendering only after Chrome DevTools MCP evidence confirms the visible runtime symptom and validate/import are already green.
- Escalate APEX runtime errors from `APEX_DEBUG_MESSAGES` only after the `PAGE_VIEW_ID` execution log points to the owning app component, PL/SQL surface, or runtime layer.

### Working Contract
- Enter this package only after capturing one concrete failure or drift signal.
- Start with the smallest signal-bearing check in `references/domains/debugging/checks-and-commands.md`; do not open broad test suites first.
- For live APEX runtime errors, start with `references/domains/debugging/apex-debug-messages.md`: search the supplied error text in `APEX_DEBUG_MESSAGES`, resolve `PAGE_VIEW_ID`, then read the full execution log for that page view.
- If the error text has multiple matching debug entries, ask for `PAGE_VIEW_ID` / debug id, `SESSION_ID`, application id, page id, user, or approximate timestamp before diagnosing.
- If the selected `PAGE_VIEW_ID` log is sparse or unhelpful, ask the user to reproduce the error with APEX debug level set to Full trace and provide the new `PAGE_VIEW_ID` / debug id or `SESSION_ID`.
- For runtime UI/UX symptoms after successful import, start with the Chrome DevTools MCP verification loop in `references/domains/debugging/runtime-ui-verification.md` before proposing the fix.
- When Chrome DevTools MCP is unavailable or not configured, fall back to the runtime verifier's inferred page URLs, HTTP/HTML artifacts, and runtime-run logs instead of skipping runtime evidence entirely.
- Use `references/domains/debugging/failure-map.md` to map symptom to owner before proposing any fix.
- Use `references/domains/debugging/owning-surfaces.md` to keep the change in the correct layer and verify in the nearest existing coverage.
- Use `references/domains/debugging/fix-patterns.md` for the standard remediation pattern for the chosen bucket.
- Use `references/domains/debugging/example-scenarios.md` when the user needs a concrete walk-through.

### Runtime Integration
- The SQLcl runtime roundtrip now invokes this package the moment a concrete local-validation, workspace-resolution, live-validate, or live-import failure is caught.
- Direct SQLcl fallback is not exempt from this package. If a manual `apex validate -input` or `apex import -input` command emits compiler or import errors, stop normal patching, classify the exact error with `references/domains/debugging/failure-map.md`, and use this debugging workflow before changing artifacts.
- The run summary records the routed branch with `failure_stage`, `debugging_bucket`, `owning_layer`, `confirming_check`, `fix_pattern`, and the repo-local auto-fix fields.
- Repo-local auto-fix is intentionally narrow. The first executable handler removes invalid dynamic-action `execution.event` lines from staged `.apx` files when the local first-pass check proves that exact failure.
- The runtime may re-run the local first-pass check only after a concrete repo-local fix was applied, and never more than 3 debug retries in one run.
- Version-gate and property-model failures are classified to their external owners and stopped with a precise handoff instead of a speculative repo-local patch.
- Sandbox-only build-root setup blockers stay outside this package's fix loop and are surfaced as environment blockers.

### First Response Shape
- Quote the exact symptom.
- Name one failure bucket.
- Name one owning layer.
- List one to three minimum confirming checks.
- State the standard fix pattern to try first.
- State the smallest relevant re-check.
- For runtime UI/UX issues, include the runtime page tested and the snapshot-backed evidence observed.
