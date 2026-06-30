---
templateId: page-examples.task-definition-initiated-tasks-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Task Definition Initiated Tasks Page Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
page 8 (
    name: My Tasks
    alias: INITIATED-TASKS
    title: My Tasks
    appearance {
        pageTemplate: @/standard
        templateOptions: #DEFAULT#
    }
    security {
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }

    region breadcrumb (
        name: Breadcrumb
        type: breadcrumb
        source {
            breadcrumb: @breadcrumb
        }
        layout {
            sequence: 20
            slot: REGION_POSITION_01
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

    region initiated-by-me-smart-filters (
        name: Initiated by Me - Smart Filters
        type: smartFilters
        source {
            filteredRegion: @initiated-by-me-report
        }
        layout {
            sequence: 10
            parentRegion: @breadcrumb
            slot: SMART_FILTERS
        }
        appearance {
            template: @/blank-with-attributes-no-grid
            templateOptions: #DEFAULT#
        }
        filter P8_APPLICATION (
            type: checkboxGroup
            label {
                label: Application
            }
            lov {
                type: distinctValues
            }
            layout {
                sequence: 80
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: DETAILS_APP_NAME
            }
        )

        filter P8_CATEGORY (
            type: checkboxGroup
            label {
                label: Category
            }
            lov {
                type: distinctValues
            }
            layout {
                sequence: 40
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: TASK_DEF_NAME
            }
        )

        filter P8_DUE (
            type: range
            label {
                label: Due
            }
            settings {
                selectMultiple: true
            }
            lov {
                type: sharedComponent
                lov: @unified-task-list-lov-due
            }
            layout {
                sequence: 20
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: DUE_IN_HOURS
                dataType: number
            }
        )

        filter P8_INITIATED (
            type: range
            label {
                label: Initiated
            }
            settings {
                selectMultiple: true
            }
            lov {
                type: sharedComponent
                lov: @unified-task-list-lov-initiated
            }
            layout {
                sequence: 100
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: CREATED_AGO_HOURS
                dataType: number
            }
        )

        filter P8_INITIATOR (
            type: checkboxGroup
            label {
                label: Initiator
            }
            lov {
                type: distinctValues
            }
            layout {
                sequence: 90
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: INITIATOR
            }
        )

        filter P8_OUTCOME (
            type: checkboxGroup
            label {
                label: Outcome
            }
            lov {
                type: distinctValues
            }
            layout {
                sequence: 70
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: OUTCOME
            }
        )

        filter P8_OWNER (
            type: checkboxGroup
            label {
                label: Owner
            }
            lov {
                type: distinctValues
            }
            layout {
                sequence: 110
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: ACTUAL_OWNER
            }
        )

        filter P8_PRIORITY (
            type: checkboxGroup
            label {
                label: Priority
            }
            lov {
                type: sharedComponent
                lov: @unified-task-list-lov-priority
            }
            layout {
                sequence: 50
            }
            listEntries {
                sortByTopCounts: false
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: PRIORITY
                dataType: number
            }
        )

        filter P8_SEARCH (
            type: search
            label {
                label: Search
            }
            layout {
                sequence: 10
            }
        )

        filter P8_STATE (
            type: checkboxGroup
            label {
                label: State
            }
            lov {
                type: sharedComponent
                lov: @unified-task-list-lov-state
            }
            layout {
                sequence: 60
            }
            listEntries {
                sortByTopCounts: false
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: STATE_CODE
            }
        )

        filter P8_TYPE (
            type: checkboxGroup
            label {
                label: Type
            }
            lov {
                type: sharedComponent
                lov: @unified-task-list-lov-type
            }
            layout {
                sequence: 30
            }
            suggestions {
                type: dynamic
            }
            source {
                databaseColumn: TASK_TYPE
            }
        )

    )

    region initiated-by-me-report (
        name: Initiated by Me - Report
        type: themeTemplateComponent/contentRow
        source {
            location: localDatabase
            type: sqlQuery
            sqlQuery:
                ```sql
                select task_id,
                       task_type,
                       task_def_name,
                       details_app_name,
                       details_link_target,
                       subject,
                       initiator,
                       actual_owner,
                       priority,
                       due_on,
                       due_in,
                       due_in_hours,
                       due_code,
                       state_code,
                       is_completed,
                       outcome,
                       created_on,
                       created_ago,
                       created_ago_hours,
                       last_updated_on,
                       badge_text,
                       badge_state
                  from table ( apex_human_task.get_tasks (
                                   p_context            => 'INITIATED_BY_ME',
                                   p_show_expired_tasks => :P8_SHOW_EXPIRED
                                   --, p_application_id => :APP_ID
                                   ) )
                ```
            pageItemsToSubmit: P8_SHOW_EXPIRED
            optimizerHint: APEX$USE_NO_GROUPING_SETS
        }
        orderBy {
            type: item
            item:
                ```
                {
                    "orderBys": [
                        {
                            "key": "CREATED_ON",
                            "expr": "created_on desc"
                        },
                        {
                            "key": "DUE_ON",
                            "expr": "priority asc, due_on asc nulls last"
                        }
                    ],
                    "itemName": "P8_SORT_BY"
                }
                ```
        }
        layout {
            sequence: 20
            slot: BODY
        }
        appearance {
            template: @/cards-container
            templateOptions: #DEFAULT#
        }
        accessibility {
            landmarkType: main
        }
        componentAppearance {
            display: report
        }
        settings {
            title: &SUBJECT.
            description:
                ```html
                <strong>&TASK_DEF_NAME!HTML.</strong>
                {if ACTUAL_OWNER/}
                    <span role="separator" aria-label="&middot;"> &middot; </span>
                    &{APEX.TASK.ASSIGNED_TO_USER 0=&ACTUAL_OWNER!HTML.}.
                {endif/}
                {if !IS_COMPLETED/}
                    {case DUE_CODE/}
                        {when OVERDUE/}
                            <span role="separator" aria-label="&middot;"> &middot; </span>
                            <strong class="u-danger-text">&{APEX.TASK.DUE_SINCE 0=&DUE_IN.}.</strong>
                        {when NEXT_HOUR/}
                            <span role="separator" aria-label="&middot;"> &middot; </span>
                            <strong class="u-danger-text">&{APEX.TASK.DUE_SINCE 0=&DUE_IN.}.</strong>
                        {when NEXT_24_HOURS/}
                            <span role="separator" aria-label="&middot;"> &middot; </span>
                            <span class="u-danger-text">&{APEX.TASK.DUE_SINCE 0=&DUE_IN.}.</span>
                        {otherwise/}
                            {if DUE_IN/}
                                <span role="separator" aria-label="&middot;"> &middot; </span>
                                &{APEX.TASK.DUE_SINCE 0=&DUE_IN.}.
                            {endif/}
                    {endcase/}
                {endif/}
                {if !IS_COMPLETED/}
                    <span role="separator" aria-label="&middot;"> &middot; </span>
                    {case PRIORITY/}
                        {when 1/}
                            <strong class="u-danger-text">&{APEX.TASK.PRIORITY.1.DESCRIPTION}.</strong>
                        {when 2/}
                            <span class="u-danger-text">&{APEX.TASK.PRIORITY.2.DESCRIPTION}.</span>
                        {when 3/}
                            &{APEX.TASK.PRIORITY.3.DESCRIPTION}.
                        {when 4/}
                            &{APEX.TASK.PRIORITY.4.DESCRIPTION}.
                        {when 5/}
                            &{APEX.TASK.PRIORITY.5.DESCRIPTION}.
                    {endcase/}
                {endif/}
                {if OUTCOME/}
                    <span role="separator" aria-label="&middot;"> &middot; </span>
                    &OUTCOME.
                {endif/}

                ```
            displayBadge: true
        }
        plugin-badge {
            label: State
            value: BADGE_TEXT
            state: BADGE_STATE
        }
        plugin-appearance {
            applyThemeColors: false
        }
        pagination {
            type: scroll
        }
        entityTitle {
            singular: task
            plural: tasks
        }
        messages {
            whenNoDataFound: No Tasks
            noDataFoundIcon: fa-clipboard-check-alt fa-lg
        }

        column ACTUAL_OWNER (
            layout {
                sequence: 80
            }
            source {
                databaseColumn: ACTUAL_OWNER
                dataType: varchar2
            }
        )

        column BADGE_STATE (
            layout {
                sequence: 220
            }
            source {
                databaseColumn: BADGE_STATE
                dataType: varchar2
            }
        )

        column BADGE_TEXT (
            layout {
                sequence: 210
            }
            source {
                databaseColumn: BADGE_TEXT
                dataType: varchar2
            }
        )

        column CREATED_AGO (
            layout {
                sequence: 180
            }
            source {
                databaseColumn: CREATED_AGO
                dataType: varchar2
            }
        )

        column CREATED_AGO_HOURS (
            layout {
                sequence: 190
            }
            source {
                databaseColumn: CREATED_AGO_HOURS
                dataType: number
            }
        )

        column CREATED_ON (
            layout {
                sequence: 170
            }
            source {
                databaseColumn: CREATED_ON
                dataType: timestampWithTimeZone
            }
            appearance {
                formatMask: SINCE
            }
        )

        column DETAILS_APP_NAME (
            layout {
                sequence: 40
            }
            source {
                databaseColumn: DETAILS_APP_NAME
                dataType: varchar2
            }
        )

        column DETAILS_LINK_TARGET (
            layout {
                sequence: 50
            }
            source {
                databaseColumn: DETAILS_LINK_TARGET
                dataType: varchar2
            }
        )

        column DUE_CODE (
            layout {
                sequence: 130
            }
            source {
                databaseColumn: DUE_CODE
                dataType: varchar2
            }
        )

        column DUE_IN (
            layout {
                sequence: 110
            }
            source {
                databaseColumn: DUE_IN
                dataType: varchar2
            }
        )

        column DUE_IN_HOURS (
            layout {
                sequence: 120
            }
            source {
                databaseColumn: DUE_IN_HOURS
                dataType: varchar2
            }
        )

        column DUE_ON (
            layout {
                sequence: 100
            }
            source {
                databaseColumn: DUE_ON
                dataType: timestampWithTimeZone
            }
            appearance {
                formatMask: SINCE
            }
        )

        column INITIATOR (
            layout {
                sequence: 70
            }
            source {
                databaseColumn: INITIATOR
                dataType: varchar2
            }
        )

        column IS_COMPLETED (
            layout {
                sequence: 150
            }
            source {
                databaseColumn: IS_COMPLETED
                dataType: varchar2
            }
        )

        column LAST_UPDATED_ON (
            layout {
                sequence: 200
            }
            source {
                databaseColumn: LAST_UPDATED_ON
                dataType: timestampWithTimeZone
            }
            appearance {
                formatMask: SINCE
            }
        )

        column OUTCOME (
            layout {
                sequence: 160
            }
            source {
                databaseColumn: OUTCOME
                dataType: varchar2
            }
        )

        column PRIORITY (
            layout {
                sequence: 90
            }
            source {
                databaseColumn: PRIORITY
                dataType: number
            }
        )

        column STATE_CODE (
            layout {
                sequence: 140
            }
            source {
                databaseColumn: STATE_CODE
                dataType: varchar2
            }
        )

        column SUBJECT (
            layout {
                sequence: 60
            }
            source {
                databaseColumn: SUBJECT
                dataType: varchar2
            }
            accessibility {
                valueIdentifiesRow: true
            }
        )

        column TASK_DEF_NAME (
            layout {
                sequence: 30
            }
            source {
                databaseColumn: TASK_DEF_NAME
                dataType: varchar2
            }
        )

        column TASK_ID (
            layout {
                sequence: 10
            }
            source {
                databaseColumn: TASK_ID
                dataType: number
                primaryKey: true
            }
        )

        column TASK_TYPE (
            layout {
                sequence: 20
            }
            source {
                databaseColumn: TASK_TYPE
                dataType: varchar2
            }
        )

        action action (
            position: titleLink
            layout {
                sequence: 10
            }
            behavior {
                type: redirectUrl
                targetUrl: &DETAILS_LINK_TARGET.
            }
        )

    )

    pageItem P8_SHOW_EXPIRED (
        type: checkbox
        label {
            label: Show expired tasks
            alignment: left
        }
        settings {
            useDefaults: false
            checkedValue: Y
            uncheckedValue: N
        }
        layout {
            sequence: 20
            region: @initiated-by-me-report
            slot: ORDER_BY_ITEM
            alignment: left
        }
        appearance {
            template: @/optional
            templateOptions: #DEFAULT#
            cssClasses: u-nowrap
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        source {
            type: static
            staticValue: N
        }
        sessionState {
            storage: user
        }
    )

    pageItem P8_SORT_BY (
        type: selectList
        label {
            label: Sort by
            alignment: left
        }
        lov {
            type: staticValues
            staticValues: STATIC2:Create Date;CREATED_ON,Due Date;DUE_ON
            displayExtraValues: false
            displayNullValue: false
        }
        layout {
            sequence: 10
            region: @initiated-by-me-report
            slot: ORDER_BY_ITEM
            alignment: left
        }
        appearance {
            template: @/hidden
            templateOptions: #DEFAULT#
            height: 1
        }
        source {
            type: staticValue
            staticValue: DUE_ON
        }
    )

    pageItem P8_TASK_ID (
        type: hidden
        settings {
            valueProtected: false
        }
        layout {
            sequence: 10
            slot: BODY
        }
        sessionState {
            storage: request
        }
        security {
            encryptSessionState: false
        }
    )

    dynamicAction refresh-initiated-by-me-report (
        name: Refresh - Initiated by Me - Report
        execution {
            sequence: 20
        }
        when {
            event: apexafterclosecanceldialog
            selectionType: region
            region: @initiated-by-me-report
        }

        action native-refresh (
            action: refresh
            affectedElements {
                selectionType: region
                region: @initiated-by-me-report
            }
            execution {
                sequence: 10
                event: @refresh-initiated-by-me-report
                fireOnInit: false
            }
        )

        action native-refresh-2 (
            action: refresh
            affectedElements {
                selectionType: region
                region: @initiated-by-me-smart-filters
            }
            execution {
                sequence: 20
                event: @refresh-initiated-by-me-report
                fireOnInit: false
            }
        )

    )

    dynamicAction refresh-initiated-by-me-report-2 (
        name: Refresh - Initiated by Me - Report
        execution {
            sequence: 30
        }
        when {
            selectionType: items
            items: P8_SHOW_EXPIRED
        }

        action native-refresh (
            action: refresh
            affectedElements {
                selectionType: region
                region: @initiated-by-me-report
            }
            execution {
                sequence: 10
                event: @refresh-initiated-by-me-report-2
                fireOnInit: false
            }
        )

        action native-refresh-2 (
            action: refresh
            affectedElements {
                selectionType: region
                region: @initiated-by-me-smart-filters
            }
            execution {
                sequence: 20
                event: @refresh-initiated-by-me-report-2
                fireOnInit: false
            }
        )

    )

)
/*
  Rules to avoid APEXlang compile errors:
  - Ensure unified task list LOVs are present in shared-components/lovs.apx:
    unified-task-list-lov-due, unified-task-list-lov-initiated, unified-task-list-lov-priority,
    unified-task-list-lov-state, unified-task-list-lov-type.
  - Do not hardcode APEXLANG$ actionTemplate IDs unless they exist in the target app.
    Prefer default action templates unless the target app explicitly supports a custom template.
*/
```
