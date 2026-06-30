# NLU Routing — Internal Dry‑Run Validation Notes (No Execution)

Objective
- Validate that natural one‑liner inputs are routed deterministically to a structured “Message 2” and that minimal rule loading, templates selection, and “Missing Inputs” handling align with governance.
- Validate that fragmentary or free-form prompts are accepted as first-class input, normalized once, and clarified only when critical blockers remain.
- No actual generation is executed here; this is a step‑by‑step checklist to simulate and verify behavior.
- Inputs containing `{{...}}` are `illustrative_prompt` grammar examples. Substitute verified identifiers during a real run; never treat the variables as schema evidence or final output text.

Prerequisites
- Master workflow consolidated:
-  - SKILL.md plus references/workflows/apex-generation.md (authoritative)
- Component Registry:
-  - assets/apex-generation/components.registry.json
- Rule routing:
  - assets/rules-mapping.json (updated with synonyms for calendar, map, cards, form/report region)
- Skeletons and examples:
-  - references/workflows/apex-generation.md (includes One-liner guidance and “J) Page — IR + Form”)

Validation Process

1) Confirm Master + Registry Presence
- Verify files exist:
-  - references/workflows/apex-generation.md
-  - assets/apex-generation/components.registry.json
- Check the master’s “One‑liner Mode (NLU Router)” section includes:
  - Keyword extraction
  - Component lookup via registry
  - Target_type decision rules
  - Union rule loading + styling conditional
  - Template selection from templates/*
  - Required inputs prompting (“Missing Inputs” policy)
  - Message 2 synthesis

2) Confirm Keyword → Rule Loading Mapping
- Open assets/rules-mapping.json
- Ensure the following keywords appear in match clauses:
  - Page standards: ["calendar", "calendar region", "map", "map region", "new page", "breadcrumb", "page standard", "page naming"]
  - IR: ["interactive report", "report", "ir", "interactive report region", "report region"]
  - Form: ["form", "crud form", "modal form", "form region", "edit page", "insert page"]
  - Dashboard/cards: ["dashboard", "kpi", "summary", "cards", "cards region"]
  - Logic: ["process", "validation", "logic", "dynamic action", "da"]
  - Items/LOV: ["item", "select list", "lov"]
- Expected: Each keyword set maps to the correct 20/30/40 rule files.

3) Manual Simulation — One‑Liner Inputs → Expected Routing
- Use the test cases in references/workflows/apex-generation/nlu/nlu-routing-test-matrix.md and validate:

Free-form prompt checks
- `source ir lookup filter`
  - Expected behavior: route toward interactive report + LOV interpretation, ask only for the minimum missing target details if critical.
- `page report form refresh`
  - Expected behavior: infer mixed page composition intent, normalize to page scope, and ask for only the missing identifiers that block drafting.
- `crud source modal`
  - Expected behavior: route toward form/modal CRUD generation and request PK/column metadata only if not already available from verified context.
- `translate page 12 japanese`
  - Expected behavior: route to shared-components translation flow, preserve simple-English follow-up style, and avoid asking for bundle-shaped input unless explicitly needed.
- `create a button to translate to spanish`
  - Expected behavior: do not route directly to shared-components localization or navigation/menu generation; ask one simple-English clarification to separate runtime language switching from localization.
- `create a button that switches the session language to spanish`
  - Expected behavior: route toward button + page-process behavior, not navigation/menu generation.
- `dashboard category record count`
  - Expected behavior: infer dashboard intent from fragments and request only missing data-source blockers.

A) “Page with an interactive report and a form on {{source.table}}; use Lookup LOV for {{lookup.valueColumn}}; refresh report after submit”
- Expected components: [interactive-report, form, lov-shared, dynamic-action-refresh-report]
- target_type: page
- Rules: page + interactive-report + form + items/sql + logic (+ guard + global)
- Templates: templates/page-examples/interactive-report-page/interactive-report-page._index.md, templates/page-examples/form-page/form-page._index.md, templates/shared-components/lovs/lovs.dynamic.query.md, templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md
- Required inputs to ask/validate:
  - {{source.table}}: table, pk, columns
  - LOV: {{lookup.valueColumn}}->{{lookup.displayColumn}}
  - DA: IR region identifier, trigger = after submit
- Expected Message 2: Structured object with target_type=page, intent summarizing both regions, data_contract populated where provided, styling=none unless specified, output_path default.

B) “Interactive report on {{source.table}} with a {{lookup.valueColumn}} select list filter using Lookup LOV”
- Components: [interactive-report, lov-shared]
- target_type: interactive-report (or page, if desired)
- Rules: page + interactive-report + items/sql (+ guard + global)
- Templates: templates/page-examples/interactive-report-page/interactive-report-page._index.md, templates/shared-components/lovs/lovs.dynamic.query.md
- Required inputs: {{source.table}}, LOV mapping
- Message 2: Matches registry requirements.

C) “Modal CRUD form on {{source.table}}; use Lookup LOV for {{lookup.valueColumn}}”
- Components: [form, lov-shared]
- target_type: form
- Rules: page + form + items/sql (+ guard + global)
- Templates: templates/page-examples/form-page/form-page._index.md + either templates/items/select-list/select-list._index.md (item-level) or templates/shared-components/lovs/lovs.dynamic.query.md (page-level)
- Required inputs: table, pk, columns, LOV mapping.

D) “Create a dashboard with cards summarizing record count by category”
- Components: [dashboard]
- target_type: page (or dashboard)
- Rules: page + dashboard (+ guard + global)
- Templates: templates/page-examples/dashboard-page/dashboard-page._index.md (optionally templates/page-examples/classic-report-page/classic-report-page._index.md)
- Required inputs: aggregation SQL/table.

E) “Add a calendar of {{source.table}} events”
- Components: [calendar]
- target_type: page
- Rules: page (+ guard + global)
- Templates: templates/page-examples/calendar-page/calendar-page._index.md
- Required inputs: date column (e.g., {{source.dateColumn}}).

F) “Create a map for office locations”
- Components: [map]
- target_type: page
- Rules: page (+ guard + global)
- Templates: templates/page-examples/map-page/map-page._index.md
- Required inputs: lat/lng columns or geocode input.

G) Negative: “Add a hexagon grid region with neural shimmer”
- Components: none matched
- Rules: page (+ guard + global)
- Behavior:
  - Draft: fallback static region or request clarification
  - Critique: flags unsupported component
  - Revision: omit unsupported part or record deferral

H) “Add an AI assistant/chatbot to the home page”
- Expected components: [ai-chatbot]
- target_type: page
- Rules: page + buttons + logic (+ guard + global)
- Templates: templates/business-logic/dynamic-actions/dynamic-actions.show-ai-assistant.md
- Required inputs to ask/validate:
  - Target page number/alias and where to place the button (Breadcrumb/Title Bar)
  - AI agent reference: use an existing alias (for example `@home`); do not invent missing agent names
  - Chatbot agent assets resolve from `/shared-components/ai-agents/`
  - Inline embedded rendering is opt-in only; if requested, confirm container selector and presence of `advanced.htmlDomId` (example: `chat`)

4) Composition Load Check
- Template, layout, grid, floating-label, and region-framing prompts should load `40-components/apex.templates.md`.
- Archived styling materials must not be auto-loaded by adjacent wording.
- Negative routing checks that must not trigger any archived styling route:
  - `Build a dashboard with driver performance KPIs`
  - `Create a report with conditional formatting`
  - `Use a color picker item`
  - `Show current theme information`
  - `Add a dark-mode data source`
  - `Make the login process secure`
  - `Use a theme template component`

5) Templates Integrity Check
- For each test, ensure every referenced template exists in:
  - templates/page-examples/*
  - templates/business-logic/*
  - templates/items/*
  - templates/shared-components/*
- If a requested visual (e.g., “cards variant”) lacks a template:
  - Expect a fallback to a supported template.
  - Critique to record limitation; Revision to apply supported subset only.

6) Output Expectations (when executed)
- Working copy: transient temp workspace outside the repo
- Durable runtime evidence: compact report + transcript under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` when needed
- Final: 
  - If it is a page or page-based component, or a shared component, then output will be within {target_root}/pages/... or shared-components/... respectively; else
-  - A whole app final output will be in {target_root} = ### where ### is the next available zero‑padded sequence (e.g., app_001, app_002, …)
- output_path? (defaults per scope)
    - Sequence computation: scan applications/ for existing app_* folders and pick the next integer.
7) Documentation Cross‑refs
-  - SKILL.md plus references/workflows/apex-generation.md (authoritative spec)
-  - assets/apex-generation/components.registry.json (synonyms → components → rules/templates/requirements)
-  - references/workflows/apex-generation.md and references/workflows/apex-generation/nlu/nlu-routing-test-matrix.md

Sign‑off Criteria
- All sample inputs map deterministically to components and rules.
- Fragmentary prompts are accepted without requiring the user to restate them in structured form.
- At most one clarification round is used for unresolved critical blockers.
- No invented attributes/UT classes; missing inputs are requested, not fabricated.
- Only existing templates are referenced; unsupported visuals trigger documented fallbacks.
- Styling rules are conditionally loaded only when styling is provided.
