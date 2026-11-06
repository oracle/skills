---
templateId: region.calendar.common
componentType: region
version: 1.0
imports:
  - references/policies/memory-bank/30-pages/apex.calendar.md
description: Shared contract and guardrails for calendar regions.
---

# Purpose

Document mandatory attributes, variable contracts, and reusable guardrails for
Oracle APEX calendar regions. Use this file and the sibling calendar scenario
templates in this folder as the canonical calendar pattern source.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/30-pages/apex.calendar.md` and this `_common` file before
   generating or editing calendar regions.
2. Mirror attribute names and structure from the calendar template; do not
   invent new settings keys or template options.
3. Ensure SQL column aliases align with `settings.*` attributes (for example
   `displayColumn`, `startDateColumn`, `endDateColumn`, `pkColumn`,
   `cssClass`).
4. Submit page items referenced in SQL (`pageItemsToSubmit`) and wire dynamic
   actions to refresh or synchronize calendars.
5. Prefer `performance.lazyLoading: true` when calendars render below the fold
   or source heavy datasets.
6. Every calendar must supply `pkColumn`, and that alias must resolve to the
   source table primary key column selected by the SQL.
7. Emit `settings.createLink` and `settings.viewEditLink` as structured objects
   with required `page` and optional `items`. For `createLink`, ask whether the
   target should be an existing form page or a new same-table modal form page.
   For `viewEditLink`, ask whether the target should be an existing report page
   or a new report page, and ask for report type every time a new report page
   is requested. Never infer target page numbers, report types, or target item
   names from existing pages, SQL aliases, or conventions; ask once and stop
   with `Missing Inputs` if the user has not provided them. For calendar create
   flows, `createLink.items` may pass the selected start timestamp with
   `&APEX$NEW_START_DATE.` when the target form should open prefilled from the
   selected calendar slot. Keep that create-link mapping distinct from drag/drop
   persistence, which uses bind variables such as `:APEX$NEW_START_DATE` and
   `:APEX$NEW_END_DATE` inside `dragAndDropPlsqlCode`.
8. When enabling drag and drop, supply `pkColumn` and persistence logic that
   always updates the start timestamp using `:APEX$PK_VALUE` and
   `:APEX$NEW_START_DATE`. Update the end timestamp with `:APEX$NEW_END_DATE`
   only when the calendar/source contract also defines `endDateColumn`. Use
   `invokeApi` unless a packaged API is unavailable.
9. For supplemental formatting (icons, color classes) sanitize values with
   `APEX_ESCAPE` helpers and disable escaping (`escapeSpecialChars: false`) only
   when HTML fragments are intentional and safe.
10. Keep whitespace-joined UT combinations such as
   `t-Region--hideHeader js-addHiddenHeadingRoleDesc` as one atomic
   `templateOptions` entry; do not split combined values into separate lines.
11. Follow the schema-safe calendar subset only. If a template example mentions
   an undocumented calendar setting that is not allowed by
   compiler-truth-backed runtime guidance, treat the example as defective and omit that
   setting.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Identifier used after the `region` keyword. |
| name | yes | string | Builder display name. |
| type | yes | enum | Always `calendar`. |
| source.location | yes | enum | Typically `localDatabase`. |
| source.type | yes | enum | Usually `sqlQuery`; maintain template parity. |
| source.sqlQuery | conditional | sql | Required when sourcing via SQL; aliases must match `settings`. |
| source.pageItemsToSubmit | optional | array | Items that filter SQL; list all required bind variables. |
| layout.sequence | yes | number | Region order in its slot. |
| layout.slot | yes | enum | E.g., `BODY`, `REGION_POSITION_01`. |
| layout.column/columnSpan | optional | number | For multi-column layouts. |
| appearance.template | yes | string | Use the theme’s approved calendar template. |
| appearance.templateOptions | optional | array | Keep to documented accepted values only. `#DEFAULT#` stays standalone and documented composites stay atomic. |
| advanced.htmlDomId | optional | string | Provide when referenced by JS or dynamic actions. |
| advanced.regionDisplaySelector | optional | boolean | Enable for tabbed layouts. |
| security.authorizationScheme | optional | string | Authorization gating. |
| security.escapeSpecialChars | optional | boolean | Set `false` only when returning sanitized HTML. |
| readOnly.type | optional | enum | Use `always` for read-only calendars. |
| serverSideCondition.* | optional | condition | Gate visibility via item/request checks. |
| settings.displayColumn | yes | column alias | Event label column. |
| settings.startDateColumn | yes | column alias | Start date/time column. |
| settings.endDateColumn | conditional | column alias | Optional end date/time column; include when the calendar source tracks event end times. |
| settings.allDayEventColumn | conditional | column alias | Use when representing all-day events. |
| settings.pkColumn | yes | column alias | Required for every calendar; map it to the source table primary key column. |
| settings.timeFormat | optional | enum | `12Hour` or `24Hour`; pair with user toggles. |
| settings.additionalCalendarViews | optional | array/enum | Values: `list`, `navigation`. Use only for supplemental list/navigation controls (e.g., `[list, navigation]`). |
| settings.createLink | optional | object | Preferred shape: `{ page: <number>, items?: { <target_item>: <substitution_value> } }`. `page` is required when emitted. Existing-form vs new-form resolution is user intent and must be asked explicitly. Calendar create flows may map the selected start timestamp with `&APEX$NEW_START_DATE.` when the target page needs date/time prefill. Treat that token as a create-link contract value, separate from drag/drop bind variables. |
| settings.viewEditLink | optional | object | Preferred shape: `{ page: <number>, items?: { <target_item>: <substitution_value> } }`. `page` is required when emitted. Existing-report vs new-report resolution, report type, and PK filter contract are user intent and must be asked explicitly. |
| settings.maxEventsDay | optional | number | Daily cap; use to keep timelines legible. |
| settings.cssClass | optional | column alias | Apply UT calendar color classes per event. |
| settings.supplementalInfo | optional | substitution | Tooltip or grid info via `&ALIAS.` tokens. |
| settings.dragAndDrop | optional | boolean | Enables drag/drop when true. |
| settings.dragAndDropPlsqlCode | conditional | plsql | Persist drag/drop changes; always update the start date, and update the end date only when the calendar defines `endDateColumn`. Wrap in ```plsql```. |
| settings.showWeekend | optional | boolean | Hide weekend columns for schedule-builder patterns. |
| settings.firstHour | optional | number | Initial visible hour for time grids. |
| settings.visibleDaysOfWeek | optional | array | Restrict which weekdays render. |
| performance.lazyLoading | optional | boolean | Default to true for performance. |
| componentAdvanced.initJavaScriptFunction | optional | javascript | FullCalendar customization; wrap in ```javascript-browser```. |

---

# Conditional Rendering Rules

- Provide `endDateColumn` when the calendar source tracks event end times, or use
  `allDayEventColumn` for all-day events. Start-only calendars may omit both.
- Emit calendar links as structured objects. If `createLink` is requested,
  resolve existing-form vs new-form first. If a new form page is chosen, route
  to the modal form workflow and keep the target on the same base table/view as
  the calendar source.
- When `createLink.items` needs the selected start timestamp for a create flow,
  use `&APEX$NEW_START_DATE.`. Keep that substitution separate from drag/drop
  persistence, which uses `:APEX$NEW_START_DATE` / `:APEX$NEW_END_DATE` bind
  variables inside `dragAndDropPlsqlCode`.
- If `viewEditLink` is requested, resolve existing-report vs new-report first.
- If a new report page is chosen, require an explicit report type and create a
  dedicated PK-holding page item that is used in the report SQL filter.
- If the required navigation choice or item mapping is missing, ask once and
  stop with `Missing Inputs` instead of inventing `Pxx_` items or page IDs.
- Include `pageItemsToSubmit` whenever the SQL references page items.
- Pair `dragAndDrop: true` with `pkColumn` and code to persist changes. The
  persistence logic must always update the start-date column and must update
  the end-date column only when the calendar/source contract defines one. Read
  only calendars must omit drag/drop blocks.
- Disable escaping only when the SQL output is sanitized HTML and accessible.
- Remove unused optional blocks (`serverSideCondition`, `readOnly`,
  `componentAdvanced`) to keep DSL minimal.
- Align dynamic actions with event names (`region/calendar/*`) and ensure
  affected regions/items are listed.

---

# Guardrails

- Avoid `select *`; project explicit columns with aliases matching the settings
  block. Include `order by` clauses when deterministic ordering is required.
- Treat legacy string `f?p=` calendar-link examples as defective after this
  contract update; use structured object syntax in new drafts and examples, and
  do not treat example page numbers in shared templates as reusable defaults.
- Sanitize concatenated HTML using `APEX_ESCAPE` utilities and provide visual +
  textual cues for accessibility (icons plus text, tooltips).
- Keep template options limited to UT-documented classes (e.g.,
  `t-Region--noPadding`, `t-Region--scrollBody`). Remove undocumented modifiers.
- Keep composite UT option values intact. For example,
  `t-Region--hideHeader js-addHiddenHeadingRoleDesc` must remain one
  `templateOptions` value.
- Never concatenate `#DEFAULT#` with another template-option value.
- Do not emit undocumented calendar settings such as `showTime` unless the
  schema contract explicitly allows them.
- For calendars paired with reports or faceted search, ensure synchronized
  refresh logic and shared filters are documented in the scenario file.
- When a new report page is created from `viewEditLink`, require a PK item fed
  by the calendar link and a report predicate that filters by that item.
- Use shared LOVs/text messages for item labels and help text. Avoid hard-coded
  strings except in documentation-only variants.

---

# Related Assets

- Template: `templates/region-components/calendar/calendar._common.md`
- Page standards: `references/policies/memory-bank/30-pages/apex.calendar.md`
- Invoke API & dynamic action guardrails: `references/policies/memory-bank/20-data/apex.logic.md`
