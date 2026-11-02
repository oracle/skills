---
templateId: page-examples.interactive-grid.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Interactive Grid Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
/*
  Region Component Template: Interactive Grid (Comprehensive)
  Purpose
  - Reusable, fully documented template for an Interactive Grid region with editable columns, toolbar, downloads, pagination, and auto row processing.
  - Mirrors patterns shown in templates/page-examples/interactive-grid/interactive-grid.example.md.
  - Aligns with memory-bank governance:
    - APEXlang-only; use colons for single key/value pairs.
    - Do not invent UT classes; keep templateOptions: #DEFAULT# unless approved styling is provided.
    - Avoid fabricating template identifiers; where theme-dependent IDs exist, use canonical names or placeholders (@/...).
    - SQL examples are enclosed in triple backticks.

  Acceptance and usage notes
  - Ensure your SQL returns a primary key column (primaryKey: true) for proper IG DML operations.
  - Query-backed Interactive Grids must emit `source.type: sqlQuery`.
  - Use `source.orderByClause` only for table-backed grids, and only when every sort key is declared as an Interactive Grid column in the same region; hidden columns are valid.
  - For query-backed grids, keep ordering inside `sqlQuery`; do not emit `source.orderByClause`.
  - Configure edit.allowedOperations per your requirements; use auto row processing for simple CRUD.
  - Use `edit.allowedRowOperationsColumn` only when the request/spec explicitly identifies a control column from the region source. In this v1 contract, `U` means the row is editable for update and any other value keeps the row read only.
  - Adjust toolbar controls and download formats as needed.
*/

/* A) Interactive Grid (standalone) */
region Interactive Grid Example (
  name: Interactive Grid Example
  type: interactiveGrid
  advanced {
    htmlDomId: your_ig_static_id
  }
  source {
    location: localDatabase
    type: sqlQuery
    sqlQuery:
      ```sql
      select
          level as employee_id,
          case trunc(dbms_random.value(1, 11))
              when 1 then 'Alice Johnson'
              when 2 then 'Bob Williams'
              when 3 then 'Charlie Brown'
              when 4 then 'Diana Prince'
              when 5 then 'Eve Davis'
              when 6 then 'Frank White'
              when 7 then 'Grace Lee'
              when 8 then 'Henry Adams'
              when 9 then 'Ivy King'
              when 10 then 'Jack Ryan'
              else 'Maria Garcia'
          end as employee_name,
          case trunc(dbms_random.value(1, 5))
              when 1 then 'IT'
              when 2 then 'HR'
              when 3 then 'Sales'
              when 4 then 'Marketing'
              else 'Finance'
          end as department,
          case trunc(dbms_random.value(1, 6))
              when 1 then 'Manager'
              when 2 then 'Developer'
              when 3 then 'Analyst'
              when 4 then 'Specialist'
              when 5 then 'Coordinator'
              else 'Associate'
          end as job_title,
          case
              when mod(level, 2) = 0 then 'U'
              else 'R'
          end as row_operation_allowed,
          trunc(dbms_random.value(30000, 120000), -3) as salary,
          to_date('2020-01-01', 'yyyy-mm-dd') +
              numtodsinterval(trunc(dbms_random.value(1, 1800)), 'day') as hire_date
        from dual
      connect by level <= 10
      ```
  }

  layout {
    sequence: 10
    slot: BODY
  }

  appearance {
    /* Replace with your theme’s preferred region template if needed */
    template: @Region
    templateOptions: #DEFAULT#
  }

  /* Enable editing and CRUD operations */
  edit {
    enabled: true
    allowedOperations: [
      add
      update
      delete
    ]
    allowedRowOperationsColumn: ROW_OPERATION_ALLOWED
  }

  pagination {
    type: page
    showTotalCount: true
  }

  messages {
    whenNoDataFound: No Data Found
  }

  /* Configure toolbar controls */
  toolbar {
    controls: [
      searchCol
      searchField
      actionsMenu
      resetButton
      saveButton
    ]
  }

  /* Enable downloads (adjust to your needs) */
  download {
    formats: [
      csv
      html
      excel
      pdf
    ]
  }

  /* Optional saved report (Primary) & single row view defaults */
  savedReport PRIMARY (
    visibility: primary
    view {
      default: grid
    }
    singleRowView {
      displayedColumns: true
    }

    /* Column ordering in saved report (example) */
    displayColumn (
      column: @EMPLOYEE_ID
      layout {
        sequence: 1
      }
    )
    displayColumn (
      column: @EMPLOYEE_NAME
      layout {
        sequence: 2
      }
    )
    displayColumn (
      column: @DEPARTMENT
      layout {
        sequence: 3
      }
    )
    displayColumn (
      column: @JOB_TITLE
      layout {
        sequence: 4
      }
    )
    displayColumn (
      column: @ROW_OPERATION_ALLOWED
      layout {
        sequence: 5
      }
    )
    displayColumn (
      column: @SALARY
      layout {
        sequence: 6
      }
    )
    displayColumn (
      column: @HIRE_DATE
      layout {
        sequence: 7
      }
    )
    displayColumn (
      column: @APEX$ROW_ACTION
      layout {
        sequence: 0
      }
    )
  )

  /* Row action and selector columns (non-data) */
  column APEX$ROW_ACTION (
    type: actionsMenu
    layout {
      sequence: 20
    }
  )

  column APEX$ROW_SELECTOR (
    type: rowSelector
    layout {
      sequence: 10
    }
  )

  /* Data columns (map to SQL projection columns) */
  column EMPLOYEE_ID (
    type: hidden
    layout {
      sequence: 30
    }
    source {
      databaseColumn: EMPLOYEE_ID
      dataType: number
      primaryKey: true
    }
    exportPrinting {
      includeInExportPrint: false
    }
    enableUsersTo {
      sort: false
    }
  )

  column ROW_OPERATION_ALLOWED (
    type: hidden
    layout {
      sequence: 35
    }
    source {
      databaseColumn: ROW_OPERATION_ALLOWED
      dataType: varchar2
    }
    comments {
      comments: Hidden control column used by allowedRowOperationsColumn; rows with value U are editable for update, and other values remain read only.
    }
    exportPrinting {
      includeInExportPrint: false
    }
    enableUsersTo {
      sort: false
    }
  )

  column EMPLOYEE_NAME (
    type: textField
    heading {
      heading: Employee Name
    }
    layout {
      sequence: 40
    }
    validation {
      maxLength: 13
    }
    source {
      databaseColumn: EMPLOYEE_NAME
      dataType: varchar2
    }
    comments {
      comments: Summary: Employee full name for grid display and row identification. Display Label: Employee Name. Display in Report: true. Display in Form: true. Format Mask: none. Value Required: true. Read Only: false. Primary Display Column: true. Authorization Scheme: none.
    }
    columnFilter {
      performanceImpactingOperators: [
        contains
        startsWith
        caseInsensitive
        regexp
      ]
    }
  )

  column DEPARTMENT (
    type: textField
    heading {
      heading: Department
    }
    layout {
      sequence: 50
    }
    validation {
      maxLength: 9
    }
    source {
      databaseColumn: DEPARTMENT
      dataType: varchar2
    }
    columnFilter {
      performanceImpactingOperators: [
        contains
        startsWith
        caseInsensitive
        regexp
      ]
    }
  )

  column JOB_TITLE (
    type: textField
    heading {
      heading: Job Title
    }
    layout {
      sequence: 60
    }
    validation {
      maxLength: 11
    }
    source {
      databaseColumn: JOB_TITLE
      dataType: varchar2
    }
    columnFilter {
      performanceImpactingOperators: [
        contains
        startsWith
        caseInsensitive
        regexp
      ]
    }
  )

  column SALARY (
    type: numberField
    heading {
      heading: Salary
      alignment: end
    }
    layout {
      sequence: 70
      columnAlignment: end
    }
    source {
      databaseColumn: SALARY
      dataType: number
    }
    columnFilter {
      lovType: none
    }
  )

  column HIRE_DATE (
    type: datePicker
    heading {
      heading: Hire Date
    }
    layout {
      sequence: 80
    }
    appearance {
      formatMask: DD-MON-YYYY
    }
    source {
      databaseColumn: HIRE_DATE
      dataType: date
    }
  )
)

/* B) Auto Row Processing (IG DML)
   - Attach to the IG region above to handle insert/update/delete automatically.
*/
process INTERACTIVE_GRID_ARP (
  name: Interactive Grid - Save Data
  type: interactiveGridAutoRowProcessing
  editableRegion: @INTERACTIVE_GRID_EXAMPLE
  execution {
    sequence: 10
  }
)

/*
  Notes on adapting to your application
  - Replace the SQL with your table/view; ensure EMPLOYEE_ID (or equivalent) is marked primaryKey: true.
  - Add validations and format masks to columns as needed.
  - Adjust toolbar controls and download formats to suit your UX.
  - Keep templateOptions as #DEFAULT# unless styling rules require documented UT classes.
*/
```
