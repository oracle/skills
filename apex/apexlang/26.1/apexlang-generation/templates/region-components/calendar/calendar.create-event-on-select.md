---
templateId: region.calendar.create-event-on-select
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar that creates new events from empty date selections.
---

# Purpose

Pattern for calendars that create events when a user selects an empty time
range while staying within the shared calendar contract in this folder.

---

# Applicability

- Calendar without `createLink`; uses dynamic action on `apexcalendardateselect`.
- Stores start/end timestamps in hidden items and executes server-side code.
- Provides optional toggle to include inactive sessions.

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
    viewEditLink: {
      page: 301
      items: {
        P301_ID: &ID.
      }
    }
    cssClass: CSS_CLASS
  }

  performance {
    lazyLoading: true
  }
)
```

---

# Dynamic Action Pattern

1. Event: `region/calendar/apexcalendardateselect` targeting the calendar.
2. Actions (sequence):
   - `setValue` → store `this.data.newStartDate` in hidden start item.
   - `setValue` → store `this.data.newEndDate` in hidden end item.
   - `executeServerSideCode` / `invokeApi` → insert new event using the stored
     timestamps.
   - `refresh` → refresh the calendar region.

Hidden items (`valueProtected: false`) hold start/end timestamps. Ensure items
are included in `itemsToSubmit` for server-side code.

---

# Guardrails

- Prefer packaged APIs (`invokeApi`) for event creation; the sample uses
  `executeServerSideCode` as an illustrative fallback.
- Document default titles or require a quick form to gather user-provided
  values before insert.
- Refresh the calendar after inserts to avoid stale views.
