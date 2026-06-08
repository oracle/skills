# Templates

## Purpose
- Define the single active UI composition contract for Oracle APEX page templates, region templates, item templates, template options, and structural layout defaults.
- Own default visual composition decisions that change layout, framing, label treatment, disclosure, spacing, or behavior through native APEX templates and template options.
- Keep active guidance structure-first: solve presentation through template, template-option, slot, grid, and alignment choices before considering any non-structural skinning.

## Scope Boundary
- This file owns structural UI composition defaults expressed through templates, template options, slot placement, layout coordinates, and alignment attributes.
- Use this file to decide default page layout shells, default region templates, default visible item templates, header behavior, framing, density, padding, scroll-body behavior, heading levels, and button-container placement.
- Non-structural skinning is not part of the active APEXlang contract. Do not solve layout, composition, or hierarchy problems with custom CSS classes.
- Context-specific rules may refine these defaults, but they must point back to this file as the canonical owner:
  - `references/policies/memory-bank/40-components/apex.items.md`
  - `references/policies/memory-bank/30-pages/apex.form.md`

## Canonical Ownership
- Template family choice for pages, regions, buttons, and visible items.
- Template-option defaults that affect framing, layout, density, disclosure, heading presence, body behavior, or label presentation.
- Region button position semantics and allowed placements by template.
- Shared interpretation rules for whitespace-joined template-option tokens and other template serialization requirements.
- The composition-first boundary so shared UI defaults remain in one canonical place.

## Default Page Composition
- Use `appearance.pageTemplate: @/standard` for normal non-modal pages unless a page-specific rule or template family requires another shell.
- Use `appearance.pageMode: modalDialog` for modal form/detail workflows that are explicitly modal by contract.
- Place breadcrumbs/title-bar content in the title-bar template region and keep application navigation updates aligned with the page template example being used.
- Breadcrumb/title-bar regions must not expose generic chrome labels such as `Breadcrumb`, `Breadcrumbs`, `Title Bar`, or `Page Header` as visible titles. Use the current breadcrumb entry/page title as the region name, keep `appearance.template: @/title-bar`, and use live-valid template options such as standalone `#DEFAULT#`. Do not emit stale `use-current-breadcrumb-entry` or `t-BreadcrumbRegion--useBreadcrumbTitle`.
- Keep page-level composition decisions consistent with the chosen page example and region templates; do not mix unrelated shells on the same page without an explicit page-pattern rule.

## Default Item Template Choices
- Use `@/optional-floating` as the default visible item template for non-required form-style page items unless a page-specific rule explicitly requires another presentation.
- Use `@/required-floating` for required visible form items.
- Keep `@/optional`, `@/optional-above`, or other non-floating label templates only when the page is intentionally demonstrating alternate label layouts, when a component-specific contract explicitly requires a different template, or when the UX requires a deliberate exception.
- For filter bars, search controls, and other visible query inputs embedded in report-oriented pages, prefer `@/optional-floating` unless the template or page pattern documents a deliberate alternative.
- Hidden items and non-visible control shells continue to use their dedicated hidden or control-specific templates rather than visible floating-label templates.

## Default Region Template Choices
- Use `appearance.template: @/standard` as the default for content-bearing regions unless a family-specific rule explicitly requires another shell.
- Classic Report hard default: every generated Classic Report region must emit these exact default blocks:
  ```apexlang
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
  `appearance` owns the outer region wrapper. `componentAppearance` owns the Classic Report component template required by runtime validation; the 26.1 compiler reports the missing template as property `411`. The default component options stretch the report, use horizontal borders only, and intentionally omit alternating-row tokens such as `t-Report--altRowsDefault` and `t-Report--staticRowColors`.
- Contextual Info Classic Reports are the Classic Report wrapper exception: use `appearance.template: @/contextual-info` with `templateOptions` exactly `#DEFAULT#`, `t-Region--hideHeader js-addHiddenHeadingRoleDesc`, and `t-Region--noUI`, while keeping the same Classic Report `componentAppearance` defaults.
- Keep these families on their own canonical region templates by default:
  - Interactive Report -> `@/interactive-report`
  - Interactive Grid -> family-specific Interactive Grid template
  - Cards -> family-specific Cards template
  - Dashboard KPI Metric Card strips -> `@/blank-with-attributes`
- Metric Card regions may use `@/standard` only when the requested design explicitly needs a titled or landmarked visible region wrapper.
- Keep utility shells on their purpose-built templates rather than forcing `@/standard`, including:
  - breadcrumb or title-bar regions
  - buttons-container regions
  - collapsible helper/explainer regions
  - other structural wrappers whose template choice exists to support page chrome instead of the main content body
- When a prompt does not explicitly ask for a special shell, content regions such as Classic Report, Form, Chart, Calendar, Map, Dynamic Content, Static Content, Help Text, Faceted Search, Search Config, Smart Filter Search, and similar body content regions should emit `appearance.template: @/standard`.

## Grid and Column Layout Rules
- These rules apply to generated application artifacts as well as templates and prompts.
- Page regions use the page-level 12-column grid. Item rows use a separate local 12-column grid inside their parent item container region.
- Never add child item spans to parent region spans. Grid scope resets inside each parent region or lane.
- For equal-width sibling rows across standard regions, template-component regions, visible page items, and buttons, prefer sequence ordering plus `startNewRow: false` on second-and-later siblings. Omit `column` and `columnSpan`.
- Use explicit `column` and `columnSpan` only when the layout is intentionally asymmetric or when the template/example requires precise coordinates.
- For true filter/sidebar shell patterns such as faceted search, prefer page-template semantic slots such as `leftColumn` + `body` before using body-grid coordinates to simulate the shell.
- Do not use `@/left-side-column` or `leftColumn` for master-detail Content Row workbenches; use `@/standard` with a body-grid split instead.
- Use body-grid coordinates for sidebar/main only when the required width ratio or stacking behavior cannot be matched cleanly by the page template shell.
- Treat a first sibling with `columnSpan` only plus later siblings with `column` as a valid anchored asymmetric row pattern; do not classify that recipe as invalid mixed layout.
- Keep recurring outer lanes stable with minimal structural placeholder regions when that preserves layout more cleanly than repeating explicit coordinates row by row.
- Use native alignment attributes for report/grid columns and region/item placement before considering any class-based workaround.
- For faceted-search pages, prefer the page template's left-column slot (`leftColumn`) plus the results body slot (`body`) instead of using `body` `columnSpan` values to mimic a sidebar.

## Template-Driven Mandate
- Region/component requests must load the corresponding templates in `templates/region-components/` or `template-components/` and follow their structure exactly.
- Always start from the most suitable file under templates/* when creating pages, regions, items, or shared components.
- Make only strict, minimal edits required by the task (identifiers, page number, alias, name, regions, tableName, columns, LOV references, labels).
- Do not change, omit, or invent DSL structure or attributes not represented in the template. Follow the block and attribute order as shown in the template.
- Navigation, breadcrumbs, and components must match the templates and project governance guidance.
- Formatting fidelity: Where a template demonstrates a specific literal format (e.g., htmlExpression, sqlQuery with triple backticks), mirror that format exactly. Do not substitute YAML-style literals or alternate encodings.
- SQL-backed template component regions, including `themeTemplateComponent/contentRow`, must put deterministic ordering in top-level `orderBy {}` and must not place `ORDER BY` inside `source.sqlQuery`.
- Default template component ordering to `orderBy { type: staticValue orderByClause: ... }`. Use `type: item` only when the sort is intentionally controlled by an available same-page page item.

## Composition vs Styling
- Treat a choice as composition-owned when it changes structure or interaction through templates, including:
  - Which template is used.
  - Which template options are enabled by default.
  - Whether labels float, sit above, or align left/right when that behavior is template-driven.
  - Whether a header is shown, removed, visually hidden, or assigned a heading level.
  - Whether padding, scroll body behavior, maximize affordances, form density, or stretch behavior are enabled through template options.
  - Where standard buttons live within a region template.
- Treat non-structural skinning as out of active scope when it changes colors, palette, token mapping, or selector-level polish without changing the template contract.
- When a prompt mixes structural and visual language, resolve all layout/composition decisions from this file first and keep the emitted artifact on native template/template-option paths.

## Report/Grid Column Alignment Standard
- Numeric data columns and their headings: right align (layout.columnAlignment: end, heading.alignment: end).
- Textual (VARCHAR) data columns and their headings: left align (layout.columnAlignment: start, heading.alignment: start).
- Apply in all report-like components (Interactive Report, Classic Report, Interactive Grid).
- Prefer native alignment attributes over CSS. Do not invent CSS classes to solve alignment.

## Template Options

Regions have Template Options that can be modified to change the look and feel of the region.  Template Options appear in a section like this:

```
appearance {
            template: @/standard
            templateOptions: [
                #DEFAULT#
                t-Region--removeHeader js-removeLandmark
                t-Region--scrollBody
            ]
        }
```

If a valid-value catalog or template example shows a whitespace-joined UT value such as
`t-Region--hideHeader js-addHiddenHeadingRoleDesc` or
`t-Region--removeHeader js-removeLandmark`, emit that value as one
`templateOptions` array entry. Do not split combined values into multiple lines.

When a `templateOptions` array contains more than one accepted value, emit it as a
bracketed multi-line array with exactly one accepted value per line. Do not use
inline comma-separated arrays such as `templateOptions: [#DEFAULT#, t-Report--stretch]`.

Accepted-value contract:
- Emit only exact accepted values.
- `#DEFAULT#` is a standalone sentinel value only. Never concatenate it with another token.
- For true Theme 42 template-option catalogs, pass the exact accepted emitted value documented by the owning family. Some families document a caller-facing `static_id`, while others document the emitted CSS/composite value for this build. Do not substitute a different form, label text, or group name.
- For presets and documented composite UT values, pass the full documented composite string as one `templateOptions` entry when that exact combined value is the accepted emitted value.
- Do not compose new values by joining `#DEFAULT#` with another token or by converting catalog metadata into inferred output.

Anti-Patterns:
- Invalid: `templateOptions: [#DEFAULT#t-Report--stretch]`
- Invalid: `templateOptions: [t-Region--hideHeader, js-addHiddenHeadingRoleDesc]` when the accepted value is `t-Region--hideHeader js-addHiddenHeadingRoleDesc`
- Invalid: passing `style-a` when the cards catalog says to pass `t-CardsRegion--styleA`
- Invalid: `templateOptions: [#DEFAULT#, t-Report--stretch]`
- Valid:
  ```apexlang
  templateOptions: [
      #DEFAULT#
      t-Report--stretch
  ]
  ```
- Valid:
  ```apexlang
  templateOptions: [
      #DEFAULT#
      t-CardsRegion--styleA
  ]
  ```
- Valid: `templateOptions: [t-Region--hideHeader js-addHiddenHeadingRoleDesc]`

Visible page-item template defaults are also composition-owned. When item templates expose label presentation or other visible framing choices, use this file as the canonical owner and let `references/policies/memory-bank/40-components/apex.items.md` document only the item-specific application of those defaults.

### Common Template Options

These template options are available on common region templates. Use them only when they solve a structural presentation need.

#### Region Body
- `t-Region--noPadding`: remove body padding.
- `js-showMaximizeButton`: show a maximize affordance.
- `t-Region--showIcon`: show the region icon when one is defined.
- `t-Region--hiddenOverflow`: hide body overflow.

#### Region Height
- `i-h240`: set the body height to 240 pixels.
- `i-h320`: set the body height to 320 pixels.
- `i-h480`: set the body height to 480 pixels.
- `i-h640`: set the body height to 640 pixels.

#### Region Items
- `t-Form--slimPadding`: reduce item spacing.
- `t-Form--noPadding`: remove item spacing.
- `t-Form--large`: use large item sizing.
- `t-Form--xlarge`: use extra-large item sizing.
- `t-Form--stretchInputs`: stretch form fields to full width.
- `t-Form--leftLabels`: align labels left.
- `t-Form--rightLabels`: align labels right.

#### Region Layout
- `margin-[location]-[size]`: set structural margins where location is top, bottom, left, or right and size is sm, md, lg, or none.
- `t-Region--removeHeader js-removeLandmark`: emit this combined template option entry when the visible region header and landmark should both be removed.
- `js-headingLevel-[n]`: assign heading level 1-5.

## Template List

1. **Standard**

This is the most common templates.  It includes a border as well as a title.

  ### Button Positions
  The following are button position names and descriptions

  - EDIT: upper right, next to the title
  - COPY: upper right, left of Edit, next to the title
  - PREVIOUS: upper left, below the title
  - NEXT: upper right, below the title
  - SORT_ORDER: upper left, below PREVIOUS
  - REGION_BODY: Before the region content
  - CLOSE: lower left, below region content
  - HELP: lower left, to the right of CLOSE, below region content
  - DELETE: lower right, to the left of CHANGE, below region content
  - CHANGE: lower right, to the left of CREATE, below region content
  - CREATE: lower right, below region content
  - RIGHT_OF_IR_SEARCH_BAR: to the right of an interactive report search bar; only use when region type is Interactive Report

  ### Template Options

   #### Region Title

   - t-Region--removeHeader js-removeLandmark: emit this combined template option entry to remove the visible region header and landmark
   - js-headingLevel-[n]: where n is a number from 1 to 5, this is the "H" level of the heading

   #### Region Color
  - t-Region--accentX: where X is a number from 1 to 15, this sets the accent color of the region header

2. **Interactive Report**

Commonly used with Interactive Reports, this template is fairly common and does not have a title / header.

  ### Button Positions
  The following are button position names and descriptions

  - PREVIOUS: upper left, above the title
  - NEXT: lower left, below the content
  - SORT_ORDER: upper left, above PREVIOUS
  - REGION_BODY: upper left, below PREVIOUS
  - RIGHT_OF_IR_SEARCH_BAR: to the right of an interactive report search bar; only use when region type is Interactive Report
