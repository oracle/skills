---
templateId: page-examples.faceted-search.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Faceted Search Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
/*
  Page Example: Faceted Search (Standard Left-Column Pattern)
  Purpose
  - Canonical full-page example for a Faceted Search experience using the Theme 42 left-side-column page template.
  - Mirrors the standard repo contract:
    - Breadcrumb in breadcrumbBar
    - Results in body
    - Faceted Search in leftColumn
  - Aligns with memory-bank governance:
    - APEXlang-only; use colons for single key/value pairs.
    - Do not invent UT classes; keep templateOptions minimal and structure-first.
    - Use the canonical default region shell `@/standard` for the results and faceted-search regions unless a documented exception applies.
    - SQL examples are enclosed in triple backticks.

  Acceptance and usage notes
  - filteredRegion on the Faceted Search must reference the target results region.
  - Do not model the sidebar by placing the faceted-search region in BODY with columnSpan values.
*/

page 27 (
  name: Region Faceted Search
  alias: REGION-FACETED-SEARCH
  title: Region Faceted Search
  appearance {
    pageTemplate: @/left-side-column
    templateOptions: #DEFAULT#
  }
  navigation {
    warnOnUnsavedChanges: false
  }
  security {
    authorizationScheme: mustNotBePublicUser
    pageAccessProtection: argumentsMustHaveChecksum
    formAutoComplete: false
  }
  help {
    helpText: Use the faceted search panel to narrow the project task list by search text, status, assignee, or cost range. Review the results region to compare filtered tasks and confirm date and cost details before navigating away.
  }

  region FS_RESULTS (
    name: Project Tasks Results
    type: classicReport
    source {
      location: localDatabase
      type: sqlQuery
      sqlQuery:
        ```sql
        select
            t.id as task_id,
            p.name as project_name,
            t.name as task_name,
            nvl(t.assignee, 'Unassigned') as assignee,
            s.description as status_label,
            t.start_date,
            t.end_date,
            nvl(t.cost, 0) as cost
        from eba_project_tasks t
        join eba_projects p
            on p.id = t.project_id
        left join eba_project_status s
            on s.id = p.status_id
        order by p.name, t.name
        ```
    }
    layout {
      sequence: 20
      slot: body
    }
    appearance {
      template: @/standard
      templateOptions: #DEFAULT#
    }
    componentAppearance {
      template: @/standard
      templateOptions: [
        #DEFAULT#
        t-Report--stretch
        t-Report--horizontalBorders
      ]
    }
    column TASK_ID (
      reportColumnQueryId: 1
      derivedColumn: N
      type: hidden
      layout {
        sequence: 10
      }
    )
    column PROJECT_NAME (
      reportColumnQueryId: 2
      derivedColumn: N
      heading {
        heading: Project
      }
      layout {
        sequence: 20
      }
      comments {
        comments: Summary: Primary project label shown in the faceted-search results and used for quick recognition during filtering. Display Label: Project. Display in Report: true. Display in Form: false. Format Mask: none. Value Required: false. Read Only: true. Primary Display Column: true. Authorization Scheme: none.
      }
    )
    column TASK_NAME (
      reportColumnQueryId: 3
      derivedColumn: N
      heading {
        heading: Task
      }
      layout {
        sequence: 30
      }
    )
    column ASSIGNEE (
      reportColumnQueryId: 4
      derivedColumn: N
      heading {
        heading: Assignee
      }
      layout {
        sequence: 40
      }
    )
    column STATUS_LABEL (
      reportColumnQueryId: 5
      derivedColumn: N
      heading {
        heading: Status
      }
      layout {
        sequence: 50
      }
      comments {
        comments: Summary: Derived project status shown to help users interpret each task row while filtering. Display Label: Status. Display in Report: true. Display in Form: false. Format Mask: none. Value Required: false. Read Only: true. Primary Display Column: false. Authorization Scheme: none.
      }
    )
    column START_DATE (
      reportColumnQueryId: 6
      derivedColumn: N
      heading {
        heading: Start Date
      }
      layout {
        sequence: 60
      }
      appearance {
        formatMask: DD-MON-YYYY
      }
    )
    column END_DATE (
      reportColumnQueryId: 7
      derivedColumn: N
      heading {
        heading: End Date
      }
      layout {
        sequence: 70
      }
      appearance {
        formatMask: DD-MON-YYYY
      }
    )
    column COST (
      reportColumnQueryId: 8
      derivedColumn: N
      heading {
        heading: Cost
        alignment: end
      }
      layout {
        sequence: 80
        columnAlignment: end
      }
      appearance {
        formatMask: FML999G999G999G990
      }
      comments {
        comments: Summary: Numeric task cost displayed in the report and reused by the cost facet for range filtering. Display Label: Cost. Display in Report: true. Display in Form: false. Format Mask: FML999G999G999G990. Value Required: false. Read Only: true. Primary Display Column: false. Authorization Scheme: none.
      }
    )
  )

  region FS_SEARCH (
    name: Search
    type: facetedSearch
    source {
      filteredRegion: @FS_RESULTS
    }
    layout {
      sequence: 10
      slot: leftColumn
    }
    appearance {
      template: @/standard
      templateOptions: #DEFAULT#
    }
    accessibility {
      landmarkLabel: Filters
    }
    settings {
      compactNosThreshold: 10000
      showCurrentFacets: true
      showTotalRowCount: true
    }
    facet FS_SEARCH_TEXT (
      type: search
      label {
        label: Search
      }
      layout {
        sequence: 10
      }
      source {
        dbColumns: PROJECT_NAME,TASK_NAME,ASSIGNEE
      }
    )
    facet FS_STATUS (
      type: checkboxGroup
      label {
        label: Status
      }
      lov {
        type: distinctValues
      }
      layout {
        sequence: 20
      }
      listEntries {
        maxDisplayedEntries: 7
      }
      source {
        databaseColumn: STATUS_LABEL
      }
    )
    facet FS_ASSIGNEE (
      type: checkboxGroup
      label {
        label: Assignee
      }
      lov {
        type: distinctValues
      }
      layout {
        sequence: 30
      }
      listEntries {
        maxDisplayedEntries: 10
        displayFilterInitially: true
      }
      source {
        databaseColumn: ASSIGNEE
      }
    )
    facet FS_COST (
      type: range
      label {
        label: Cost
      }
      layout {
        sequence: 40
      }
      source {
        databaseColumn: COST
        dataType: number
      }
    )
  )

  region FS_BREADCRUMB (
    name: Breadcrumb
    type: breadcrumb
    source {
      breadcrumb: @breadcrumb
    }
    layout {
      sequence: 10
      slot: breadcrumbBar
    }
    appearance {
      template: @/title-bar
      templateOptions: #DEFAULT#
    }
    componentAppearance {
      breadcrumbTemplate: @/breadcrumb
      templateOptions: #DEFAULT#
    }
  )
)
```
