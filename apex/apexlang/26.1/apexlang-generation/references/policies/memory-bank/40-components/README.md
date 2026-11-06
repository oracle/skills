# 40-components — Component Rules Index

Purpose
- Central index for component-level APEXlang rules in the Memory Bank.
- Keeps behavior deterministic by documenting allowed attributes, conditional logic, and where to set them.
- References canonical scaffolds in templates/** (do not duplicate them here).

Authoritative sources
- Guard: references/policies/memory-bank/00-guard/ai.guard.md
- Global: references/policies/memory-bank/10-global/apex.global.md
- Templates (positions and options): references/policies/memory-bank/40-components/apex.templates.md
- Canonical component scaffolds: templates/**

Files in this partition
- apex.items.md
  - Scope: Page items (select list, checkbox, radio group, date picker, etc.)
  - Content: Allowed attributes per item type, conditional rules, placement, examples.
  - Templates referenced: templates/items/*
- apex.templates.md
  - Scope: Region templates and button positions per template.
  - Content: Valid button slot names per template (Standard, Interactive Report), common template options, layout guidance.
  - Templates referenced: templates/page-examples/* and related region templates.
- apex.region-contracts.md
  - Scope: Cross-region legality and composition contract index for APEXlang region components.
  - Content: Region type/qualifier/position invariants, selection defaults, and links to specialized region rule files.
  - Templates referenced: templates/region-components/** and templates/template-components/**
- apex.region-data-source.md
  - Scope: Region data-source ownership and display semantics.
  - Content: Table/View/SQL selection, schema UI hints, order-by ownership, and format masks.
- apex.region-media.md
  - Scope: Region media and BLOB behavior.
  - Content: BLOB display, companion storage columns, upload/display constraints, and icon allowlists.
- apex.region-interactions.md
  - Scope: Region links, actions, filters, and context composition.
  - Content: Cards/List/Metric/Chart interaction constraints, filter namespaces, contextual info, parent-child layout, and comments.
- apex.buttons.md
  - Scope: Button component behavior.
  - Content: Attribute catalog (layout, appearance, behavior, confirmation, serverSideCondition, security). References the canonical `serverSideCondition.type` catalog in references/policies/memory-bank/20-data/apex.logic.md for accepted values and syntax examples.
  - Templates referenced: templates/buttons/buttons._common.md, templates/buttons/buttons._index.md, and action-specific files under templates/buttons/buttons.*.md

Loading rules (auto-selection)
- assets/rules-mapping.json maps keywords to these files:
  - "template", "region template", "button template", "universal theme template" → 40-components/apex.templates.md
  - "region contract", "region type", "qualifier" → 40-components/apex.region-contracts.md
  - "data source type", "schema hint", "format mask" → 40-components/apex.region-data-source.md
  - "blob", "display image", "icon allowlist" → 40-components/apex.region-media.md
  - "contextual info", "cards action", "filter namespace" → 40-components/apex.region-interactions.md
  - "item", "select list", "checkbox", "radio group", "date picker", "display only", "lov" → 40-components/apex.items.md
  - "button", "buttons", "button confirmation", "confirmation", "requiresConfirmation", "submit", "redirect" → 40-components/apex.buttons.md

Usage guidelines
- Do not invent attribute/value pairs; copy from templates/** and extend here only with constraints/when-to-emit rules.
- Keep examples minimal; prefer links/path references to templates.
- Use `apex.templates.md` as the single shared owner for composition defaults such as template choice, label treatment, framing, and template-option defaults.
- Heavy logic belongs in DB packages/views per 20-data/* rules; pages orchestrate DML guarded by buttons/processes.

Add a new component rule file
1) Name it apex.<component>.md (e.g., apex.dynamic-actions.md).
2) Document:
   - Attribute catalog with allowed values
   - Conditional logic (when to emit/omit blocks)
   - Placement and cross-template considerations
   - Minimal examples referencing templates/** paths
3) Update assets/rules-mapping.json with match keywords → apply path to the new file.
4) Avoid duplicating full templates; reference canonical templates/** instead.

Cross-references
- Page and region patterns: references/policies/memory-bank/30-pages/*
- Data and logic: references/policies/memory-bank/20-data/*
- Shared composition defaults: references/policies/memory-bank/40-components/apex.templates.md

Notes
- This index is intentionally concise to keep tokens low and to guide readers to the correct authoritative files.
