# APEXlang Prompt Contracts

Canonical contract for APEXlang agent prompting. Use this file as the shared rule source for the router and the Draft, Critique, and Revision agents.

## Purpose

- Reduce prompt drift by centralizing high-value behavior rules.
- Prefer compact, named contracts over repeated narrative guidance.
- Make prompt-governed behavior easier to enforce in critique, validators, and tests.
- Force a rules-first workflow: use the posted rules and workflows before any inference, and treat inference as a bounded last resort.

## Instruction Hierarchy

1. `references/policies/memory-bank/00-guard/ai.guard.md`
2. `references/policies/governance/00-governance.md`
3. This file
4. Phase-specific workflow prompts
5. Templates and examples

If a lower layer conflicts with a higher layer, follow the higher layer and mark the lower layer as defective.

## Required Tagged Sections

Core agent prompts must use these exact top-level tags when they apply:

- `<authority_rules>`
- `<task_scope>`
- `<allowed_sources>`
- `<exact_match_policy>`
- `<compiler_truth_contract>`
- `<generation_plan_contract>`
- `<output_contract>`
- `<stop_conditions>`

Rules:

- Keep tag names stable across agents.
- Use the same tag names in source and packaged prompts.
- Put reusable shared policy in this file; keep phase prompts focused on phase-specific behavior.

## Required Intermediate Artifacts

### Compiler Truth Evidence

Required when a draft introduces a non-exact-match structural edit.

Each entry must include:

- exact `query-valid-props` command
- checked component or parent scope
- conclusion
- emitted decision

### Generation Plan

Required for non-trivial page, component, or application generation before emitting APEXlang.

Minimum required fields:

- target artifact scope
- exact template family or variant selected
- region, item, and button inventory in output order when applicable
- source mode decisions such as `table/view` vs `sql`
- navigation or target decisions
- compiler-truth evidence references when required

Required response order for non-trivial structural generation:

1. `Compiler Truth Evidence` when required
2. `Generation Plan`
3. generated APEXlang

### Trivial Work Boundary

Trivial APEXlang work is limited to same-property edits on existing artifacts, such as wording-only updates, labels, titles, help text, comments, or replacing an existing documented property value with another value of the same kind.

Work is non-trivial when it adds, removes, or reshapes page, region, item, button, SQL, LOV, validation, process, dynamic-action, navigation, template-option, source-mode, target-mapping, component-family, or behavior structure. New report, form, chart, map, dashboard, shared-component, navigation, or behavior generation is non-trivial even when the prompt calls it simple, basic, starter, lightweight, or quick.

Trivial work may skip a full `Generation Plan` only when it stays on an existing documented property, does not introduce new structure or compiler-truth decisions, and does not alter runtime behavior. If there is doubt, classify the work as non-trivial.

### Application Spec

Required before complete application generation from functional requirements plus model/schema metadata.

The spec must use `references/workflows/apexlang/application-spec.template.md` and include:

- source evidence and conflict status
- full page inventory
- application composition plan
- rich UI pattern plan using native APEX components
- LOVs, validation behavior, modal/report-to-form behavior, and test plan
- missing inputs and generation/runtime blockers
- project-root `.apexlang/app-ux-contract.json` with non-empty `sourceEvidence`, `pageInventory`, `compositionPlan`, `richUiPatternPlan`, `lovPlan`, `behaviorPlan`, and `testPlan`

## Workflow Precedence

Use this precedence order for every generation and revision task:

1. Apply guardrails and governance.
2. Apply the relevant workflow and template family.
3. Use compiler-backed truth and machine-readable contracts.
4. Stop with `Missing Inputs` or request human intervention when the rules and workflow do not answer the need.
5. Only then use bounded inference, and only for low-risk connective details that do not change structural legality.

Do not:

- guess when a rule, workflow, template, or compiler-truth step has not been exhausted
- skip to “best judgment” because a template seems close enough
- invent target pages, target item names, enum values, slots, or block shapes when the workflow cannot prove them
- treat local validator success as permission to infer missing structure

## Generation Boundary

For non-trivial APEXlang output, the `Generation Plan` is a boundary contract, not only a summary. It must identify the supported template family or documented page/design pattern that authorizes each emitted page, region family, item family, button/navigation mode, dynamic-action shape, and non-default template option.

Generated `.apx` artifacts must stay inside the current authoritative sources: guardrails, governance, loaded memory-bank rules, current template documentation, compiler-backed truth, and machine-readable contracts. Requirements may select, combine, or parameterize supported native APEX/APEXlang patterns, but they do not authorize new DSL surface or undocumented component behavior.

Do not invent properties, enum values, block names, target shapes, item mappings, template options, region capabilities, dynamic-action selectors, page patterns, component families, or navigation modes outside the loaded authoritative sources. Unsupported design intent must be recorded as blocked/deferred, simplified to a documented native APEX pattern, or represented by a supported placeholder only when the active workflow explicitly allows placeholders.

## Snippet Classification Contract

All prompt, template, and memory-bank snippets are one of these classes:

- `normative_rule`: guidance that may be followed literally.
- `metavariable_template`: structure-only template content that may be emitted only after every `{{...}}` variable is bound from schema evidence, user input, a template contract, or compiler-backed truth.
- `illustrative_prompt`: natural-language routing example only; never schema evidence and never a source of table, column, page, item, API, or region identifiers.
- `counterexample`: known-bad content that must never be emitted.

Rules:

- Treat unclassified examples and snippets as `illustrative_prompt` unless they are under an `Output Template` heading or an explicit variable contract.
- Do not copy sample or placeholder identifiers from `illustrative_prompt` text into APEXlang, SQL, JSON contracts, or generated `.apx` files.
- Do not emit a `metavariable_template` while any `{{...}}` variable remains unbound.
- Stop with `Missing Inputs` when a required schema, page, item, region, LOV, API, or navigation binding cannot be proven.
- Generated `.apx` artifacts must not contain unresolved `{{...}}` variables or prompt-only pseudo-identifiers such as `SOURCE_TABLE`, `LOOKUP_TABLE`, `RELATED_TABLE`, `SOURCE_ID`, `LOOKUP_ID`, or `LOOKUP_NAME`.

## Validator Feedback Contract

When local validation, live validation, VSCode Problems, `problems.json`, or `validation-report.json` emits rule IDs, feed those findings back into critique and revision using `assets/validator-fix-recipes.json`.

For each reported issue, the critique/revision loop must preserve:

- `rule_id`
- cause
- deterministic fix
- owning guidance or template
- verification result after rerun

If a rule ID has no deterministic recipe and the owning guidance does not prove a fix, keep the run blocked with Required Revisions or Missing Inputs instead of guessing.

## Rule IDs

### DESTINATION_WORKSPACE_NAME_REQUIRED_001

Statement:
- When a run will generate `deployments/default.json` for a brand new app,
  require the user to specify the destination APEX workspace name before
  materialization, record the selected workspace in session
  `context-resolution.json` under `db_context.workspace`, and stop with
  `Missing Inputs` if no exact workspace name is available from session
  context or explicit `--workspace-name`.

Why:
- `deployments/default.json.workspace.name` controls runtime target resolution
  and must not be guessed, copied from the scaffold seed, or inferred from app
  names.

Valid:

```text
Missing Inputs: destination APEX workspace name is required in session context before generating deployments/default.json for a new app.
```

Invalid:

```text
I reused the scaffold workspace name because the user did not mention one.
```

Ownership:
- Router prompt
- Draft prompt
- Package prompt tests

### EXACT_MATCH_TEMPLATE_REQUIRED_001

Statement:
- Reuse a canonical template directly only when the component family and variant, parent context, nesting shape, and conditional mode already match.

Why:
- Exact-match reuse is safe. Near-match inference is a common source of structural drift.

Valid:

```text
Reused the exact `buttons.redirect-this-app.md` shape and substituted only labels, page numbers, and item names.
```

Invalid:

```text
Copied a calendar example into a cards region because both have links and titles.
```

Ownership:
- Draft prompt
- Critique prompt

### COMPILER_TRUTH_EVIDENCE_REQUIRED_001

Statement:
- Non-exact-match structural edits must provide compiler-truth evidence.

Why:
- Local validators and templates are incomplete guardrails.

Valid:

```text
Compiler Truth Evidence
1. Command: node tools/query-valid-props.mjs --component button --group behavior
   Scope: button behavior.target
   Conclusion: same-app redirect target must be `target: { ... }`
   Emitted decision: used declarative target object syntax
```

Invalid:

```text
I checked the templates and the validator passed.
```

Ownership:
- Draft prompt
- Critique prompt
- Package prompt tests

### RULES_FIRST_WORKFLOW_REQUIRED_001

Statement:
- Draft and revision must follow the posted rules and workflow first, and must not guess or infer while those sources still provide an unanswered next step.

Why:
- Most structural drift comes from premature “helpful” inference rather than lack of guidance.

Valid:

```text
The template family does not cover this exact shape, so I queried compiler truth next. The required target item mapping is still unresolved, so I stopped with Missing Inputs.
```

Invalid:

```text
The workflow did not spell out the target page, so I assumed page 4 because that seemed likely.
```

Ownership:
- Draft prompt
- Critique prompt
- Package prompt tests

### HUMAN_INTERVENTION_REQUIRED_001

Statement:
- When rules, workflow, templates, and compiler-backed truth still do not answer a required high-impact decision, stop for Missing Inputs or explicit human intervention instead of inferring.

Why:
- High-impact unresolved decisions should be escalated, not guessed.

Valid:

```text
Missing Inputs: target page and target item names for calendar navigation were not provided and could not be proven from templates or compiler truth.
```

Invalid:

```text
I could not prove the target item names, so I invented `P4_ID` to keep moving.
```

Ownership:
- Draft prompt
- Critique prompt

### APPLICATION_SPEC_REQUIRED_001

Statement:
- Complete app generation from FR/model sources must produce an implementation-ready application spec from `application-spec.template.md` before drafting non-trivial `.apx` artifacts.

Why:
- Rich application generation needs page inventory, composition, shared components, UI pattern choices, data evidence, and tests locked before page-by-page APEXlang drafting starts.

Valid:

```text
I completed the application spec, including the Application Composition Plan and Rich UI Pattern Plan, then generated page artifacts from that spec.
```

Invalid:

```text
I skipped the spec and started drafting pages directly from the requirements.
```

Ownership:
- Draft prompt
- Critique prompt

### GENERATION_PLAN_REQUIRED_001

Statement:
- Non-trivial page, component, and application generation must emit a compact Generation Plan before APEXlang.

Why:
- A frozen plan reduces plan/output drift and accidental re-decisions during emission.

Valid:

```text
Generation Plan
- Scope: page 12 interactive report page
- Template: page-examples/interactive-report-page
- Regions in order: summary -> report -> buttons
- Source mode: report uses localDatabase/sqlQuery
- Navigation: same-app detail link to page 13
```

Invalid:

```text
Draft
page 12 (
...
```

Ownership:
- Draft prompt
- Critique prompt
- Package prompt tests

### GENERATION_PLAN_DRIFT_001

Statement:
- The generated artifact must not drift from the frozen Generation Plan without an explicit plan repair.

Why:
- Equivalent late-stage rewrites create unstable output and inconsistent review behavior.

Valid:

```text
Plan says same-app redirect target to page 16; emitted target points to page 16.
```

Invalid:

```text
Plan selected a classic report, but the draft emitted an interactive report because it seemed nicer.
```

Ownership:
- Critique prompt
- Revision prompt

### DSL_MULTILINE_STRUCTURE_REQUIRED_001

Statement:
- Object-valued properties must emit `name: {` on their own line with nested properties on following lines.

Why:
- Inline compressed object syntax causes parser and import drift.

Valid:

```apx
viewEditLink: {
  page: 16
  items: {
    P16_ORDER_ID: &ORDER_ID.
  }
}
```

Invalid:

```apx
viewEditLink: { page: 16 items: { P16_ORDER_ID: &ORDER_ID. } }
```

Ownership:
- Validator
- Draft prompt
- Critique prompt
- `the source package regression tests`

### DECLARATIVE_BUTTON_TARGET_REQUIRED

Statement:
- `redirectThisApp` buttons must use declarative target object syntax.

Why:
- Same-app redirects using scalar URLs or bare `target { ... }` drift from compiler-backed syntax.

Valid:

```apx
behavior {
  action: redirectThisApp
  target: {
    page: 6
    clearCache: 6
  }
}
```

Invalid:

```apx
behavior {
  action: redirectThisApp
  target { page: 6 }
}
```

Ownership:
- Validator
- Draft prompt
- `the source package regression tests`

### TEMPLATE_OPTIONS_MULTILINE_REQUIRED_001

Statement:
- Multi-value `templateOptions` arrays must be bracketed and emitted with one accepted value per line.

Why:
- Inline comma-separated arrays are noisy, unstable, and easy to mutate incorrectly.

Valid:

```apx
templateOptions: [
  #DEFAULT#
  t-Report--stretch
]
```

Invalid:

```apx
templateOptions: [#DEFAULT#, t-Report--stretch]
```

Ownership:
- Validator
- Draft prompt

### TEMPLATE_OPTIONS_DEFAULT_ATOMIC_001

Statement:
- `#DEFAULT#` must remain one standalone template option value.

Why:
- Concatenated default tokens are invalid and usually indicate malformed serialization.

Valid:

```apx
templateOptions: #DEFAULT#
```

Invalid:

```apx
templateOptions: #DEFAULT#t-Report--stretch
```

Ownership:
- Validator
- Draft prompt

### CLASSIC_REPORT_DEFAULT_TEMPLATE_REQUIRED_001

Statement:
- Classic Report regions must use the canonical shared `appearance` block and the canonical report-template `componentAppearance` block.
- Canonical Classic Report component options are `#DEFAULT#`, `t-Report--stretch`, and `t-Report--horizontalBorders`; do not emit alternating-row or row-highlight options by default.

Why:
- This is a high-drift area where template and import behavior must stay aligned. Live APEXlang validation on 26.1 maps the Classic Report report template to property `411` and reports missing values as `componentAppearance - template (string)`.

Valid:

```apx
appearance {
  template: @/standard
  templateOptions: #DEFAULT#
}
componentAppearance {
  template: @/standard
  templateOptions: [
    #DEFAULT#
    t-Report--stretch
    t-Report--horizontalBorders
  ]
}
```

Invalid:

```apx
appearance {
  templateOptions: t-Report--stretch
}
```

Ownership:
- Validator
- Draft prompt

### CLASSIC_REPORT_COMPONENT_APPEARANCE_REQUIRED_001

Statement:
- Classic Report regions must emit `componentAppearance.template: @/standard`.

Why:
- The 26.1 compiler requires property `411` for the Classic Report report-template surface and reports the missing property as `componentAppearance - template (string)`.

Valid:

```apx
componentAppearance {
  template: @/standard
  templateOptions: [
    #DEFAULT#
    t-Report--stretch
    t-Report--horizontalBorders
  ]
}
```

Invalid:

```apx
componentAppearance {
  templateOptions: #DEFAULT#
}
```

Ownership:
- Validator
- Draft prompt

### PAGE_ITEM_LAYOUT_LABEL_COL_SPAN_LEGACY_001

Statement:
- `layout.labelColSpan` is a legacy alias and must not be emitted.

Why:
- The canonical property name is `layout.labelColumnSpan`.

Valid:

```apx
layout {
  labelColumnSpan: 3
}
```

Invalid:

```apx
layout {
  labelColSpan: 3
}
```

Ownership:
- Validator
- `the source package regression tests`

## Stop Conditions

- Stop with `Missing Inputs` when the posted rules, workflow, templates, and compiler-backed truth do not answer a required high-impact decision.
- Stop with `Missing Inputs` or explicit human intervention before using inference for high-impact structural decisions.
- Stop with `Missing Inputs` when compiler-backed truth cannot be resolved for a non-exact-match structural edit.
- Stop with `Missing Inputs` when required DB object evidence is unresolved.
- Stop when authoritative same-rank sources conflict and the conflict cannot be resolved from higher-ranked guidance.
- Do not use validator success as a substitute for missing compiler-truth evidence or a missing Generation Plan.
- Use bounded inference only after all higher-precedence rule and workflow sources are exhausted, and only for low-risk connective details that do not change structural legality.
