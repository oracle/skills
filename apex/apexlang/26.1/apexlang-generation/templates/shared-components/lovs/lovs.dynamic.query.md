---
templateId: lovs.dynamic.query
componentType: lovs
version: 1.0
---

# Purpose

The query LOV component defines a List of Values sourced from a SQL query. It is used when `source.type` is `sqlQuery`.

---

# Generation Rules (MANDATORY)

1. Create the lov id and display name.
2. Set `source.type` to `sqlQuery`.
3. Provide `source.sqlQuery` with valid SQL that returns display and return columns.
4. Set `columnMapping.return` and `columnMapping.display` to columns selected by the query.
5. All updates should be made to the lovs.apx file found under an application's /shared-components directory.

---

# Variable Contract

## Required Variables

- lov
  - Type: text
  - The lov id; all lowercase, no spaces

- lov.name
  - Friendly name for the LOV
    - Must be in all UPPER_CASE with no spaces

- source.sqlQuery
  - SQL query used to generate LOV rows

- columnMapping.return
  - Column returned by the LOV (must be selected by `source.sqlQuery`)

- columnMapping.display
  - Column displayed to users (must be selected by `source.sqlQuery`)

## Optional Variables

- columnMapping.defaultSort
  - Column used for default sorting

- columnMapping.sortDirection
  - Sort direction for default sort
  - Valid values:
    - ascNullsFirst
    - ascNullsLast
    - descNullsFirst
    - descNullsLast

- columnMapping.group
  - Column used for grouping

- columnMapping.icon
  - Column used for icon metadata

- columnMapping.quickPickRank
  - Column used for quick pick rank

- advanced.oracleTextIndexCol
  - Column used for Oracle Text index lookup

---

# Conditional Rendering Rules

- Always include:
  - `source.type: sqlQuery`
  - `source.sqlQuery`
  - `columnMapping.return`
  - `columnMapping.display`
- If `columnMapping.defaultSort` is not provided, omit `defaultSort` and `sortDirection`.
- If `columnMapping.group` is not provided, omit `group`.
- If `columnMapping.icon` is not provided, omit `icon`.
- If `columnMapping.quickPickRank` is not provided, omit `quickPickRank`.
- If `advanced.oracleTextIndexCol` is not provided, omit the entire `advanced {}` block.

---

# Output Template - Minimal
```
lov {{lov}} (
    name: {{lov.name}}
    source {
        type: sqlQuery
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
    columnMapping {
        return: {{columnMapping.return}}
        display: {{columnMapping.display}}
    }
)
```

---

# Output Template - Full
```
lov {{lov}} (
    name: {{lov.name}}
    source {
        type: sqlQuery
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
    columnMapping {
        return: {{columnMapping.return}}
        display: {{columnMapping.display}}
        defaultSort: {{columnMapping.defaultSort}}
        sortDirection: {{columnMapping.sortDirection}}
        group: {{columnMapping.group}}
        icon: {{columnMapping.icon}}
        quickPickRank: {{columnMapping.quickPickRank}}
    }
    advanced {
        oracleTextIndexCol: {{advanced.oracleTextIndexCol}}
    }
)
```

