---
templateId: region.calendar.report-synchronized
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar synchronized with companion report via dynamic actions.
---

# Purpose

Document calendars paired with reports that share filters and refresh behavior.
Keep the synchronized refresh behavior aligned with the shared calendar and
report patterns documented in this template space.

---

# Applicability

- Calendar region plus companion classic report filtered by calendar view.
- Dynamic actions capture view change events to update report bind items.
- Hidden items store calendar start/end to drive report query.

---

# Output Template – Calendar Block

```apexlang
region {{calendarRegionId}} (
  name: {{calendarName}}
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
         case status
              when 'Open'    then 'apex-cal-green'
              when 'Pending' then 'apex-cal-yellow'
              when 'Closed'  then 'apex-cal-red'
              when 'On-Hold' then 'apex-cal-black'
         end as css_class
      from eba_demo_cal_projects
      where (nvl(:{{filterItem}}, '0') = '0' or project = :{{filterItem}})
      order by end_date
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
      t-Region--hideHeader js-addHiddenHeadingRoleDesc
      t-Region--scrollBody
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
    additionalCalendarViews: navigation
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

# Companion Report Notes

- Classic report uses identical SQL and shares `cssClass` to render inline badges.
- Hidden items (`Pxx_CAL_START_DATE`, `Pxx_CAL_END_DATE`) store the calendar view
  window.

---

# Dynamic Action Pattern

Event: `region/calendar/apexcalendarviewchange` on the calendar.

Actions:
1. `setValue` → assign `this.data.startDate` to hidden start item.
2. `setValue` → assign `this.data.endDate` to hidden end item.
3. `refresh` → refresh companion report region.

Optional page load DA seeds hidden items using `apex.region("{{htmlDomId}}")` and
refreshes the report to sync initial state.

---

# Guardrails

- Ensure both calendar and report share the same filter items and SQL ordering.
- Hidden items must be `valueProtected: false` when manipulated via dynamic
  actions.
- Document the `formatYYYYMMDDhhmmss` helper used to populate hidden items on
  page load.
