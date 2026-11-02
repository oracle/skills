---
templateId: region.calendar.weekly-conference
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Weekly conference calendar with color-coded sessions.
---

# Purpose

Reference pattern for conference-style weekly calendars rendering timed sessions
with color-coded tracks using the shared calendar contract in this folder.

---

# Applicability

- Week/day/list navigation with time slots.
- No per-user filtering; show all active sessions.
- Highlights `cssClass` usage for UT calendar color classes.

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
      where status = 'ACTIVE'
      ```
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

  advanced {
    htmlDomId: {{htmlDomId}}
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

# Required Variables

- `layout.sequence` / `layout.slot` / `htmlDomId` to match page layout.

---

# Guardrails

- Keep `where status = 'ACTIVE'` (or equivalent) consistent with business rules;
  expose toggles via `pageItemsToSubmit` when users can show inactive sessions.
- Retain UT-approved calendar classes (begin with `apex-cal-`).
- Extend `additionalCalendarViews` only with documented values.
