---
templateId: region.calendar.client-events
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar augmented with client-only events and persistence controls.
---

# Purpose

Document patterns where client-side JavaScript injects temporary events and
optional server-side persistence.

---

# Applicability

- Calendar remains standard while buttons/dynamic actions manipulate FullCalendar
  directly.
- Hidden or visible items capture event metadata (title, start, end, type).
- Button clicks either inject events client-side or persist to database.

---

# Output Template – Calendar Block

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
    additionalCalendarViews: navigation
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

# Client-Side Event Injection Pattern

1. Button click (`SHOW_IN_CALENDAR`) → Execute JavaScript code:
   - Retrieve calendar: `apex.region("{{htmlDomId}}").widget().data("fullCalendar")`.
   - Fetch existing event by ID or add new event with properties from page items
     (`Pxx_TITLE`, `Pxx_STARTDATE`, `Pxx_ENDDATE`).
   - Use `calendar.addEvent` or `event.setProp` / `event.setDates` for updates.

2. Optional date-select dynamic action updates form items using
   `region/calendar/apexcalendardateselect` event and `this.data.newStartDate` /
   `this.data.newEndDate`.

3. Persistence button (`SAVE_IN_DATABASE`) executes server-side code or
   `invokeApi` to insert event rows, then refreshes the calendar.

---

# Guardrails

- Keep client-side event IDs deterministic (e.g., `javascript-event-id`) to
  reuse existing events instead of duplicating.
- Validate user input before adding events; ensure date pickers enforce format
  masks and show time when necessary.
- Prefer `invokeApi` for persistence; if using `executeServerSideCode`, include
  required items in `itemsToSubmit`.
