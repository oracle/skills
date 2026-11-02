---
templateId: region.calendar.status-tracking
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar exposing view metadata via FullCalendar events.
---

# Purpose

Pattern for calendars that surface the current view, start, and end dates via
dynamic actions responding to FullCalendar view-change events.

---

# Applicability

- Calendar must publish active view metadata to page items.
- Consumers (reports, text fields) display or act on the captured values.
- Requires JavaScript event handling (`region/calendar/apexcalendarviewchange`).

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
         project,
         task_name,
         status,
         assigned_to,
         cost,
         start_date,
         end_date,
         case
            when status = 'Pending' then 'apex-cal-blue'
            when status = 'Open'    then 'apex-cal-green'
            when status = 'Closed'  then 'apex-cal-gray'
            when status = 'On-Hold' then 'apex-cal-orange'
         end as css_class
      from eba_demo_cal_projects
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
    displayColumn: TASK_NAME
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    additionalCalendarViews: [
      list
      navigation
    ]
    viewEditLink: {
      page: 3
      items: {
        P3_ID: &ID.
        P3_LASTVIEW: &APP_PAGE_ID.
      }
    }
    maxEventsDay: 5
    cssClass: CSS_CLASS
  }

  performance {
    lazyLoading: true
  }
)
```

---

# Dynamic Action Pattern

Event: `region/calendar/apexcalendarviewchange` targeting the calendar region.

Actions (in order):

1. `setValue` → assign `this.data.viewType` to a text item (e.g., `P72_VIEW_TYPE`).
2. `setValue` → assign `formatYYYYMMDDhhmmss(this.data.startDate)` to the
   “from” item.
3. `setValue` → assign `formatYYYYMMDDhhmmss(this.data.endDate)` to the “to”
   item.
4. Optional `refresh` → trigger dependent regions (reports/graphs) that rely on
   the captured values.

Provide a helper function (`formatYYYYMMDDhhmmss`) in page-level JavaScript when
format transformations are needed.

---

# Guardrails

- Ensure target items (`Pxx_VIEW_TYPE`, `Pxx_START_DATE`, `Pxx_END_DATE`) are
  configured with appropriate templates (`@/optional`) and format masks.
- For downstream SQL using these items, set `itemsToSubmit` or add region-level
  page-item dependencies so refreshed components receive current session state.
- Document any additional view metrics captured from `this.data` (e.g.,
  `activeStart`, `currentEnd`) to keep code maintainable.
