---
templateId: region.calendar.custom-navigation
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar with custom navigation controls and disabled built-in nav.
---

# Purpose

Illustrate calendars that remove built-in navigation in favor of custom buttons
and JavaScript API calls.

---

# Applicability

- Calendar navigation buttons disabled; external buttons trigger `next/prev`
  and `gotoDate` through JavaScript.
- Requires dynamic actions or page-level JS to interact with the calendar.

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

# Supporting JavaScript Pattern

Include helper functions (page-level `functionAndGlobalVarDeclaration`) to
format dates and interact with the calendar widget:

```javascript-browser
function formatYYYYMMDD(pDate) {
  var date = pDate || new Date(), separator = "-";
  return ("0000" + date.getFullYear()).substr(-4) + separator +
         ("00" + (date.getMonth() + 1)).substr(-2) + separator +
         ("00" + date.getDate()).substr(-2);
}
```

Dynamic actions on custom buttons call:
- `apex.region("{{htmlDomId}}").widget().data("fullCalendar").next();`
- `apex.region("{{htmlDomId}}").widget().data("fullCalendar").prev();`
- `apex.region("{{htmlDomId}}").widget().data("fullCalendar").gotoDate(dateString);`

---

# Guardrails

- Keep built-in calendar navigation disabled via page template options or by
  hiding the toolbar (ensure UT classes align with design).
- Document custom navigation buttons and associated dynamic actions.
- Validate date input format (YYYY-MM-DD) before calling `gotoDate`.
