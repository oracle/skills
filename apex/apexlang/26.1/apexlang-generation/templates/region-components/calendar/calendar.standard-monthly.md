---
templateId: region.calendar.standard-monthly
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Standard monthly calendar with project filter.
---

# Purpose

Pattern for monthly calendars backed by SQL with optional project filtering.
Use this scenario as the canonical monthly calendar variant in this folder.

---

# Applicability

- Calendar region with month/week/day/list navigation.
- Filtered by select list (or similar) submitted as bind variable.
- Requires color-coding via `cssClass` and lazy loading.

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
    maxEventsDay: 3
    cssClass: CSS_CLASS
  }

  performance {
    lazyLoading: true
  }

  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.endDateExclusive = false;
      }
      ```
  }
)
```

---

# Required Variables

- `filterItem`: Page item used to filter (e.g., `P31_PROJECTS`).
- `pageItemsToSubmit`: Array-style string (e.g., `[P31_PROJECTS]`).
- `layout.sequence`, `layout.slot`, `htmlDomId` per page layout.

---

# Guardrails

- Ensure the filter item defaults to `'0'` (all projects) or adjust the SQL
  predicate accordingly.
- Maintain the `order by end_date` for predictable rendering.
- When removing lazy loading, document performance justification.
- Keep `cssClass` values aligned with UT-supported calendar classes (`apex-cal-*`).
