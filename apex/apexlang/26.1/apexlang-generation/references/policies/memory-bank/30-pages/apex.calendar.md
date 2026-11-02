## Calendar Page Standards

### Purpose
- Ensure calendar pages use consistent layout, calendar region configuration, and navigation hooks.

### Rules (Non-Negotiable)
1. Use `pageTemplate: @/standard` (or documented calendar layout) with `templateOptions: #DEFAULT#`.
2. Calendar region must use `type: calendar`, `appearance.template: @/standard`, and set required calendar attributes using the compiler-safe subset defined by the calendar template and `assets/component-attributes.json`.
3. Every calendar region must emit `settings.pkColumn`, and that value must map to the source table primary key column used by the calendar SQL.
4. Drag and drop may be enabled for calendars with only `startDateColumn` as well as calendars that define both `startDateColumn` and `endDateColumn`; end-date persistence is optional and only applies when an end-date column exists in the calendar contract.
5. Calendar `settings.createLink` and `settings.viewEditLink` should use the structured object form with required `page` and optional `items`.
6. If a user asks for `createLink`, ask whether an existing form page should be used or whether a new same-table modal form page should be created. Do not infer the form target from the current app.
7. If a user asks for `viewEditLink`, ask whether an existing report page should be used or whether a new report page should be created. If a new report page is requested, always ask which report type to create. Do not infer the report target from the current app.
8. Newly created `viewEditLink` report pages must include a page item that holds the calendar primary key and must filter the report SQL by that page item.
9. If the required create-link or view-link clarification is not resolved within the single clarification round, stop with `Missing Inputs`.
10. Use `settings.additionalCalendarViews` only for documented supplemental values `list` and `navigation`; do not restate built-in calendar views such as month, week, or day there.
11. Apply navigation/breadcrumb standards from `apex.page.md`.

### Guidance
- Use `templates/region-components/calendar/calendar._common.md` as the canonical reference for region attributes, calendar SQL aliases, and template options; the page example remains a minimal scaffold.
- Use `settings.displayColumn` for the event-title column mapping.
- Use `settings.pkColumn` for the event primary key mapping, sourced from the underlying table primary key column.
- Use structured object syntax for calendar links. Example: `createLink: { page: 5 }`, `viewEditLink: { page: 4 items: { P4_ID: &CLAIM_ID. } }`.
- Treat page IDs, report types, and target item mappings as user intent, not something to infer from current page numbers, existing form/report pages, or alias names.
- Calendar create links may pass the selected start timestamp with `&APEX$NEW_START_DATE.` in `createLink.items` when the target form needs date/time prefill.
- When `createLink` results in a new page, the target must follow the modal form standards in `apex.form.md` and stay on the same base table/view as the calendar source.
- Keep create-link date-prefill separate from drag/drop persistence: `&APEX$NEW_START_DATE.` is the create-link substitution value, while `:APEX$NEW_START_DATE` / `:APEX$NEW_END_DATE` remain drag/drop bind variables for persistence code.
- When `viewEditLink` results in a new page, the target must be an explicitly chosen Classic Report or Interactive Report page. The page must include a dedicated PK item populated from the calendar link and the report SQL must filter by that item.
- Do not emit `settings.showTime`; the current compiler contract does not accept it.
- When `dragAndDrop: true`, always persist the new start date; update the end date only when the calendar/source also defines `endDateColumn`.
- When `settings.additionalCalendarViews` is emitted, restrict it to `list`, `navigation`, or `[list navigation]`.
- Keep whitespace-joined UT template option values atomic. For example, emit `t-Region--hideHeader js-addHiddenHeadingRoleDesc` as one `templateOptions` entry, not two separate values.
- Keep `#DEFAULT#` separate from any additional template-option token. Never emit concatenated values such as `#DEFAULT#t-Report--stretch` or similar hybrids.
- When older prose/examples disagree with the executable calendar templates or `assets/component-attributes.json`, the executable template plus schema contract win.
- When adding filters or additional regions, follow the applicable component guardrails (e.g., faceted search standards).
