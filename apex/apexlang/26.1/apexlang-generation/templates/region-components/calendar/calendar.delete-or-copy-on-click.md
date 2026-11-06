---
templateId: region.calendar.delete-or-copy-on-click
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar with event click actions (delete/copy).
---

# Purpose

Capture patterns where clicking an event triggers confirm/delete or copy logic.
Keep the event-select handling aligned with the shared calendar contract and
the dynamic-action patterns documented in this folder.

---

# Applicability

- Calendar listens to `region/calendar/apexcalendareventselect` events.
- Hidden item stores the selected event primary key.
- Dynamic actions perform confirm/delete or copy logic.

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: calendar

  source {
    location: localDatabase
    type: sqlQuery
    sqlQuery:
      ```sql
      select
         id,
         case when speaker is not null then
           title || ' (' || speaker || ')'
           else title
         end as title,
         speaker,
         start_date,
         end_date,
         case
            when status = 'INACTIVE'    then 'apex-cal-gray'
            when session_type = 'BREAK' then 'apex-cal-silver'
            when session_type = 'BUSINESS' then 'apex-cal-orange'
            when session_type = 'GENERAL'  then 'apex-cal-blue'
            when session_type = 'TECHNICAL' then 'apex-cal-green'
            when session_type = 'HANDS_ON'  then 'apex-cal-lime'
         end as css_class
      from eba_demo_cal_sessions
      where status = 'ACTIVE' or :{{showInactiveItem}} = 'Y'
      ```
    pageItemsToSubmit: {{pageItemsToSubmit}}
  }

  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }

  appearance {
    template: @/standard
    templateOptions: [
      #DEFAULT#
      t-Region--noPadding
      t-Region--hideHeader js-addHiddenHeadingRoleDesc
      t-Region--hiddenOverflow
    ]
  }

  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    additionalCalendarViews: [
      list
      navigation
    ]
    cssClass: CSS_CLASS
  }

  performance {
    lazyLoading: true
  }
)
```

---

# Dynamic Action Variants

## Delete on Click
- Event: `region/calendar/apexcalendareventselect` → calendar region.
- Actions:
  1. `setValue` → `this.data.event.id` → hidden PK item.
  2. `confirm` → message “Do you really want to delete…”.
  3. `executeServerSideCode` (or `invokeApi`) → delete row using hidden PK.
  4. `refresh` → refresh calendar region.

## Copy on Click
- Event: `region/calendar/apexcalendareventselect`.
- Actions:
  1. `setValue` → store event ID.
  2. `confirm` → optional.
  3. `executeServerSideCode` / `invokeApi` → insert copy with adjusted fields.
  4. `refresh` → refresh calendar.

---

# Guardrails

- Prefer packaged APIs with `invokeApi`. When using `executeServerSideCode`,
  ensure `itemsToSubmit` includes the hidden PK item and toggles.
- Confirm dialogs should explain the action (delete or copy) and identify the
  target event.
- Maintain consistent color mapping via `cssClass` and sanitize SQL output.
