---
templateId: lovs.dynamic.table
componentType: lovs
version: 1.0
---

# Purpose

The table LOV component defines a List of Values sourced from a database table. It is used when LOV values come from table columns instead of static entries.

---

# Generation Rules (MANDATORY)

1. Create the lov id and display name.
2. Set `source.tableName`.
3. Set `columnMapping.return` and `columnMapping.display`.
4. All updates should be made to the lovs.apx file found under an application's /shared-components directory.

---

# Variable Contract

## Required Variables

- lov
  - Type: text
  - The lov id; all lowercase, no spaces

- lov.name
    - Friendly name for the LOV
    - Must be in all UPPER_CASE with no spaces

- source.tableName
    - Source table or view for LOV values

- columnMapping.return
    - Column returned by the LOV

- columnMapping.display
    - Column displayed to users

## Optional Variables

- source.whereClause
    - SQL where clause block used to filter LOV rows

- columnMapping.defaultSort
    - Column used for default sorting

- columnMapping.sortDirection
    - Order in which ito sort
    - Valid values:
        - `no value` - this is used in place of ascNullsLast
        - ascNullsFirst
        - descNullsLast
        - descNullsFirst

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

- If `source.whereClause` is not provided, omit the entire `whereClause` block.
- If `columnMapping.defaultSort` is not provided, omit `defaultSort` and `sortDirection`
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
        tableName: {{source.tableName}}
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
        tableName: {{source.tableName}}
        whereClause:
            ```sql
            {{source.whereClause}}
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
