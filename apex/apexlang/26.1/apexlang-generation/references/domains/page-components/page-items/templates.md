# Template References — Page Items

## Authoritative Policies
- `references/policies/governance/00-governance.md`
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/20-data/apex.sql.md`
- `references/policies/memory-bank/20-data/apex.logic.md`
- `references/policies/memory-bank/40-components/apex.templates.md`
- `references/policies/memory-bank/40-components/apex.items.md`

## Operational References
All item templates live under `templates/items/`. Use the entries below to load the minimal template you need:

- `templates/items/text-field/text-field._index.md`
- `templates/items/text-area/text-area._index.md`
- `templates/items/text-autocomplete/text-autocomplete._index.md`
- `templates/items/select-list/select-list._index.md`
- `templates/items/select-one/standard.md`
- `templates/items/select-many/standard.md`
- `templates/items/combobox/combobox._index.md`
- `templates/items/checkbox/checkbox._index.md`
- `templates/items/radio-group/radio-group._index.md`
- `templates/items/switch/switch._index.md`
- `templates/items/star-rating/standard.md`
- `templates/items/shuttle/shuttle._index.md`
- `templates/items/date-picker/date-picker._index.md`
- `templates/items/number-field/number-field._index.md`
- `templates/items/color-picker/standard.md`
- `templates/items/hidden-item/hidden-item._index.md`
- `templates/items/display-only/standard.md`
- `templates/items/file-upload/file-upload._index.md`
- `templates/items/rich-text-editor/rich-text-editor._index.md`

Combine these rule files with the business-logic reference package (`references/domains/README.md`) for validations, computations, and dynamic actions associated with items.

Default visible item-template choices, label presentation, and other template-driven UI composition decisions come from `references/policies/memory-bank/40-components/apex.templates.md`.
