---
templateId: region.calendar.weekly-time-format-toggle
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Weekly calendar variants gated by time-format toggle.
---

# Purpose

Document dual calendar pattern switching between 12-hour and 24-hour time
formats based on a select list.

---

# Applicability

- Two calendar regions with identical SQL but different `timeFormat` settings.
- Server-side conditions control which region renders.
- Supports toggling between 12-hour and 24-hour formatting.

---

# Output Template – Snippet

```apexlang
region {{regionStaticId_12}} (
  name: {{name}} (12h)
  type: calendar
  source { ... same SQL ... }
  layout { sequence: {{seq12}} slot: BODY }
  appearance { template: @/standard templateOptions: [#DEFAULT# t-Region--noPadding t-Region--hideHeader js-addHiddenHeadingRoleDesc t-Region--hiddenOverflow] }
  serverSideCondition {
    type: item=value
    item: {{formatItem}}
    value: 12
  }
  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    timeFormat: 12Hour
    additionalCalendarViews: [list navigation]
    cssClass: CSS_CLASS
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.displayEventTime = true;
      }
      ```
  }
)

region {{regionStaticId_24}} (
  name: {{name}} (24h)
  type: calendar
  source { ... same SQL ... }
  layout { sequence: {{seq24}} slot: BODY }
  appearance { template: @/standard templateOptions: [#DEFAULT# t-Region--noPadding t-Region--hideHeader js-addHiddenHeadingRoleDesc t-Region--hiddenOverflow] }
  serverSideCondition {
    type: item=value
    item: {{formatItem}}
    value: 24
  }
  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    timeFormat: 24Hour
    additionalCalendarViews: [list navigation]
    cssClass: CSS_CLASS
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.displayEventTime = true;
      }
      ```
  }
)
```

---

# Required Variables

- `formatItem`: Select list controlling time format (e.g., `P35_SHOW_TIME_FORMAT`).
- `showInactiveItem`: Optional switch submitted in SQL; include in both regions’
  `pageItemsToSubmit` blocks.
- `regionStaticId_12`, `regionStaticId_24`: Static IDs for each calendar.
- `seq12`, `seq24`: Layout sequences to preserve rendering order.

---

# Guardrails

- Keep SQL identical between both regions to avoid divergent data.
- Document dynamic actions tying the select list to refresh behavior (page
  redirect or region refresh depending on use case).
- Ensure `pageActionOnSelection` is set (e.g., `redirectSetValue`) for the time
  format item if replicating the sample behavior.
