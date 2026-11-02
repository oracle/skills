---
templateId: timeline.permutations
componentType: region
version: 1.0
description: Regression fixture covering supported Timeline settings and conditional attribute branches.
---

# Purpose

This is a syntax and contract fixture, not a page layout to copy verbatim. Each region deliberately selects one valid avatar branch; do not combine `icon`, `image`, and `initials` in a single Timeline region. The initials branch requires a projected varchar2 value containing only the first-name and last-name initials (for example, `YB`), not the full display name.

The image and initials branches use `SYS.DUAL` only to project deterministic fixture values. `object_evidence_source: user_asserted` records the previously confirmed target-environment validation of this system object. This fixture evidence does not replace a fresh target-build `apex validate` for release completion.

```apexlang
region timeline_icon_avatar (
    name: Timeline icon avatar
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
        displayAvatar: true
        displayBadge: true
    }
    plugin-avatar {
        type: icon
        icon: fa-user
        description: Assignee
        shape: circular
    }
    plugin-badge {
        label: Status
        value: STATUS
        state: STATUS
        icon: fa-flag
        displayLabel: true
        style: outline
        shape: circular
    }
    advanced {
        htmlDomId: timeline-icon-avatar
    }
    column ASSIGNED_TO_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: ASSIGNED_TO_NAME
            dataType: varchar2
        }
    )
    column START_DATE (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: START_DATE
            dataType: date
        }
    )
    column TASK_NAME (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: TASK_NAME
            dataType: varchar2
        }
    )
    column WORK_MODE (
        layout {
            sequence: 40
        }
        source {
            databaseColumn: WORK_MODE
            dataType: varchar2
        }
    )
    column STATUS (
        layout {
            sequence: 50
        }
        source {
            databaseColumn: STATUS
            dataType: varchar2
        }
    )
)

region timeline_image_avatar (
    name: Timeline image avatar
    type: themeTemplateComponent/timeline
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            select 'Ada Lovelace' as assigned_to_name,
                   date '2026-08-28' as start_date,
                   'Review Timeline fixture' as task_name,
                   'On Track' as status,
                   :APP_FILES || 'icons/app-icon-512.png' as avatar_url
              from sys.dual
            ```
    }
    layout {
        sequence: 20
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
        display: partial
    }
    settings {
        userName: ASSIGNED_TO_NAME
        date: START_DATE
        title: TASK_NAME
        displayAvatar: true
        displayBadge: true
    }
    plugin-avatar {
        type: image
        image: {
            type: urlColumn
            urlColumn: AVATAR_URL
        }
        shape: rounded
    }
    plugin-badge {
        label: Status
        value: STATUS
        style: subtle
        shape: rounded
    }
    column ASSIGNED_TO_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: ASSIGNED_TO_NAME
            dataType: varchar2
        }
    )
    column AVATAR_URL (
        layout {
            sequence: 15
        }
        source {
            databaseColumn: AVATAR_URL
            dataType: varchar2
        }
    )
    column START_DATE (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: START_DATE
            dataType: date
        }
    )
    column TASK_NAME (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: TASK_NAME
            dataType: varchar2
        }
    )
    column STATUS (
        layout {
            sequence: 50
        }
        source {
            databaseColumn: STATUS
            dataType: varchar2
        }
    )
)

region timeline_initials_avatar (
    name: Timeline initials avatar
    type: themeTemplateComponent/timeline
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            select 'Ada Lovelace' as assigned_to_name,
                   date '2026-08-28' as start_date,
                   'Review Timeline fixture' as task_name,
                   'On Track' as status,
                   'AL' as assigned_to_initials
              from sys.dual
            ```
    }
    layout {
        sequence: 30
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
        displayAvatar: true
        displayBadge: true
    }
    plugin-avatar {
        type: initials
        initials: ASSIGNED_TO_INITIALS
        shape: square
    }
    plugin-badge {
        label: Status
        value: STATUS
        shape: square
    }
    column ASSIGNED_TO_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: ASSIGNED_TO_NAME
            dataType: varchar2
        }
    )
    column ASSIGNED_TO_INITIALS (
        layout {
            sequence: 15
        }
        source {
            databaseColumn: ASSIGNED_TO_INITIALS
            dataType: varchar2
        }
    )
    column START_DATE (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: START_DATE
            dataType: date
        }
    )
    column TASK_NAME (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: TASK_NAME
            dataType: varchar2
        }
    )
    column STATUS (
        layout {
            sequence: 50
        }
        source {
            databaseColumn: STATUS
            dataType: varchar2
        }
    )
)

region timeline_no_shape_avatar (
    name: Timeline no-shape avatar
    type: themeTemplateComponent/timeline
    source {
        location: sampleData
        sampleData: tasks
    }
    layout {
        sequence: 40
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
        display: partial
    }
    settings {
        userName: ASSIGNED_TO_NAME
        date: START_DATE
        title: TASK_NAME
        displayAvatar: true
    }
    plugin-avatar {
        type: icon
        icon: fa-user
        description: Assignee
        shape: noShape
    }
    column ASSIGNED_TO_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: ASSIGNED_TO_NAME
            dataType: varchar2
        }
    )
    column START_DATE (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: START_DATE
            dataType: date
        }
    )
    column TASK_NAME (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: TASK_NAME
            dataType: varchar2
        }
    )
)

region timeline_core_only (
    name: Timeline core only
    type: themeTemplateComponent/timeline
    source {
        location: sampleData
        sampleData: tasks
    }
    layout {
        sequence: 50
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
        display: partial
    }
    settings {
        userName: ASSIGNED_TO_NAME
        date: START_DATE
        title: TASK_NAME
    }
)
```

# Coverage Rules

- Root settings: required `userName`, `date`, and `title`; optional `description`, `displayAvatar`, and `displayBadge`.
- Avatar branches: `icon`, `image`, and `initials`; `shape` values `circular`, `noShape`, `rounded`, and `square`. For `type: image`, project a dedicated varchar2 URL column from `:APP_FILES` or `:APEX_FILES` plus a static relative path and map that column to `plugin-avatar.image.urlColumn`; do not repurpose an email or other non-URL field. For `type: initials`, project a varchar2 initials column containing the first character of the first and last name, then map that column to `plugin-avatar.initials`; never map the full `settings.userName` column directly.
- Badge values: required `label` and `value` when enabled; optional `state`, `icon`, `displayLabel`, `style: outline | subtle`, and `shape: circular | rounded | square`.
- Region variants: `componentAppearance.display: report | partial`; optional `advanced.htmlDomId`.
- `timeline_core_only` proves the valid omission path for optional root settings and both optional plugin blocks.
- Do not emit root appearance, grouping, pagination `type`/`showTotalCount`, or message properties: the APEXlang compiler rejects them for Timeline.
