---
templateId: timeline.report-sample-data
componentType: region
version: 1.0
description: Compiler-truth-backed Timeline report example using the built-in tasks sample data.
---

# Purpose

Render Universal Theme Timeline sample tasks in report mode. This exact example is data-source independent because it uses the documented `sampleData: tasks` source; do not copy its column names into SQL-backed generation without object and column evidence.

# Output Template

```apexlang
region tasks_1 (
    name: Tasks
    type: themeTemplateComponent/timeline
    source {
        location: sampleData
        sampleData: tasks
    }
    layout {
        sequence: 10
        slot: regionBody
    }
    appearance {
        template: @/blank-with-attributes-no-grid
        templateOptions: #DEFAULT#
    }
    accessibility {
        landmarkType: region
    }
    componentAppearance {
        display: report
    }
    settings {
        userName: ASSIGNED_TO_NAME
        date: START_DATE
        title: TASK_NAME
        description: WORK_MODE
        displayBadge: true
    }
    plugin-badge {
        label: Status
        value: STATUS
        state: STATUS
    }
    pagination {
        entitiesPerPage: 50
    }

    column ASSIGNED_TO_EMAIL (
        layout {
            sequence: 50
        }
        source {
            databaseColumn: ASSIGNED_TO_EMAIL
            dataType: varchar2
        }
    )
    column ASSIGNED_TO_EMPNO (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: ASSIGNED_TO_EMPNO
            dataType: number
        }
    )
    column ASSIGNED_TO_NAME (
        layout {
            sequence: 40
        }
        source {
            databaseColumn: ASSIGNED_TO_NAME
            dataType: varchar2
        }
    )
    column CALENDAR_COLOR (
        layout {
            sequence: 110
        }
        source {
            databaseColumn: CALENDAR_COLOR
            dataType: varchar2
        }
    )
    column END_DATE (
        layout {
            sequence: 90
        }
        source {
            databaseColumn: END_DATE
            dataType: date
        }
    )
    column HOURS_ALLOCATED (
        layout {
            sequence: 60
        }
        source {
            databaseColumn: HOURS_ALLOCATED
            dataType: number
        }
    )
    column ID (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: ID
            dataType: number
            primaryKey: true
        }
    )
    column START_DATE (
        layout {
            sequence: 80
        }
        source {
            databaseColumn: START_DATE
            dataType: date
        }
    )
    column STATUS (
        layout {
            sequence: 100
        }
        source {
            databaseColumn: STATUS
            dataType: varchar2
        }
    )
    column TASK_NAME (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: TASK_NAME
            dataType: varchar2
        }
    )
    column WORK_MODE (
        layout {
            sequence: 70
        }
        source {
            databaseColumn: WORK_MODE
            dataType: varchar2
        }
    )
)
```

# Conditional Rendering Rules

- Keep `componentAppearance.display: report` for this example.
- `settings.userName`, `settings.date`, and `settings.title` are required Timeline mappings.
- Keep `settings.displayBadge: true` and the `plugin-badge` block together. Omit both when the request does not require badges.
- Load avatar configuration only after the request enables `settings.displayAvatar` and selects a compiler-supported avatar type.
- For a SQL or table source, replace the complete source and column set only after each referenced object and mapping has evidence.

# Validation Checklist

- The region type is exactly `themeTemplateComponent/timeline`.
- The source is exactly `sampleData: tasks` for this sample; it is not a database-object assertion.
- Every report projection has an explicit `column (...)` block and exact data type.
- Do not add an action template; Timeline has link positions but no action templates.
