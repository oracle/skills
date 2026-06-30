---
templateId: region.calendar.faceted-search
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar filtered by faceted search region.
---

# Purpose

Pattern for calendars filtered via a faceted search region.

---

# Applicability

- Calendar + faceted search pairing where `filteredRegion` references the
  calendar.
- Uses color-coded events and optional navigation views.

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
      order by end_date
      ```
  }

  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
    startNewRow: false
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
    multipleLineEvents: false
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

# Faceted Search Companion

```apexlang
region {{facetRegionId}} (
  name: {{facetName}}
  type: facetedSearch
  source {
    filteredRegion: @{{regionStaticId}}
  }
  layout {
    sequence: {{facetSequence}}
    slot: BODY
    columnSpan: 3
  }
  appearance {
    template: @/standard
    templateOptions: [
      #DEFAULT#
      t-Region--scrollBody
    ]
  }
  settings {
    compactNosThreshold: 10000
    showCurrentFacets: true
    showTotalRowCount: true
  }

  facet {{projectFacetStaticId}} (
    type: checkboxGroup
    label {
      label: Project
      showLabelForCurrentFacet: false
    }
    lov {
      type: sharedComponent
      lov: @APEX$2593618860880292124
    }
    layout {
      sequence: 20
    }
    listEntries {
      maxDisplayedEntries: 5
    }
    actionsMenu {
      filter: false
    }
    advanced {
      collapsible: true
    }
    source {
      databaseColumn: PROJECT
    }
  )

  facet {{searchFacetStaticId}} (
    type: search
    label {
      label: Search
    }
    layout {
      sequence: 10
    }
  )
)
```

---

# Guardrails

- Keep `filteredRegion` pointing to the calendar static ID so the faceted search
  triggers refreshes automatically.
- Configure `pageItemsToSubmit` on the calendar only if additional items are
  referenced; faceted search handles binding internally.
- Validate that facet LOVs reference shared components and limit displayed
  entries for usability.
