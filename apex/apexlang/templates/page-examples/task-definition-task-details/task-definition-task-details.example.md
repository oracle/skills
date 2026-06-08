---
templateId: page-examples.task-definition-task-details.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Task Definition Task Details Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
/*
Ensure this page has been linked in corresponding task definition created under shared-components/task-definitions
Rules to avoid APEXlang compile errors:
- Do not hardcode APEXLANG$ actionTemplate IDs unless they exist in the target app.
- If an actionTemplate is not available, do not emit template/label/behavior/appearance on the action; instead use a supported menu action block.
- For task completion emails, do not add sendEmail processes on this page; prefer task definition actions onEvent: complete with APEX_MAIL or native APEX APIs.
 - Do not add custom processes or new page items beyond the predefined template. If extra logic or data is required, implement it in the task definition action or backend package instead.
*/
page 10 (
    name: Task Details
    title: Task Details
    alias:TASK-DETAILS
    appearance {
        pageMode: modalDialog
        dialogTemplate: @/drawer
        templateOptions: [
            #DEFAULT#
            js-dialog-class-t-Drawer--pullOutEnd
        ]
    }
    dialog {
        resizable: false
    }
    javaScript {
        functionAndGlobalVarDeclaration:
            ```javascript-browser
            apex.jQuery(() => {
                apex.jQuery("a.taskActionMenu").each((index, item) => {
                    const element = apex.jQuery(item);
                    const actionName = decodeURI(element.attr("href")).match(/\$([^?]+)/)[1];
                    const actionLabel = element.text();
                    apex.actions.add({
                        name: actionName,
                        label: actionLabel,
                        action: (event, element, args) => {
                            if (args.do === "submit") {
                                apex.page.submit(actionName.toUpperCase());
                            }
                            else if (args.do === "openRegion") {
                                apex.theme.openRegion(actionName.toUpperCase());
                            }
                        }
                    });
                });
            });
            ```
    }
    security {
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }
    advanced {
        enableDuplicatePageSubmissions: false
    }

    region add-comment (
        name: Add Comment
        type: staticContent
        layout {
            sequence: 100
            parentRegion: @comments
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_add_comment )
                ```
        }
        settings {
            outputAs: text
        }
    )

    region buttons (
        name: Buttons
        type: staticContent
        layout {
            sequence: 80
            slot: REGION_POSITION_03
        }
        appearance {
            template: @/buttons-container
            templateOptions: [
                #DEFAULT#
                t-ButtonRegion--stickToBottom
                t-ButtonRegion--slimPadding
                margin-bottom-none
            ]
        }
        advanced {
            regionDisplaySelector: true
        }
        settings {
            outputAs: text
        }
    )

    region cancel-task (
        name: Cancel Task
        type: staticContent
        source {
            htmlCode:
                ```html
                <p>Do you really want to cancel this task?</p>
                <p>This will mark the task as no longer needed.</p>
                ```
        }
        layout {
            sequence: 80
            parentRegion: @subject
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        advanced {
            htmlDomId: CANCEL
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_cancel )
                ```
        }
    )

    region comments (
        name: Comments
        type: themeTemplateComponent/comments
        source {
            location: localDatabase
            type: sqlQuery
            sqlQuery:
                ```sql
                select apex_string.get_initials(created_by) as user_initials,
                       'u-color-'||ora_hash(created_by,45)  as user_css_class,
                       created_by                           as user_name,
                       text                                 as comment_text,
                       created_on                           as comment_date
                  from apex_task_comments
                 where nvl(:P10_ALL_COMMENTS, 'N') = 'N'
                       and task_id = :P10_TASK_ID
                    or nvl(:P10_ALL_COMMENTS, 'N') = 'Y'
                       and task_id in (
                                select task_id
                                  from apex_tasks
                               connect by prior previous_task_id = task_id
                                 start with task_id = :P10_TASK_ID )
                 order by created_on desc
                ```
            pageItemsToSubmit: [
                P10_TASK_ID
                P10_ALL_COMMENTS
            ]
        }
        layout {
            sequence: 60
            slot: BODY
        }
        appearance {
            template: @/collapsible
            templateOptions: [
                #DEFAULT#
                js-useLocalStorage
                t-Region--scrollBody
            ]
            renderComponents: belowContent
        }
        accessibility {
            landmarkType: region
        }
        componentAppearance {
            display: report
        }
        settings {
            commentText: COMMENT_TEXT
            userName: USER_NAME
            date: COMMENT_DATE
            style: chatSpeechBubbles
            applyThemeColors: false
        }
        plugin-avatar {
            avatarType: initials
            avatarInitials: USER_INITIALS
            avatarDescription: &USER_NAME.
            avatarShape: circular
            avatarSize: medium
            avatarCssClasses: &USER_CSS_CLASS.
        }
        messages {
            whenNoDataFound: No Comments
            noDataFoundIcon: fa-comments-o fa-lg
        }

        column COMMENT_DATE (
            layout {
                sequence: 50
            }
            source {
                databaseColumn: COMMENT_DATE
                dataType: date
            }
            accessibility {
                valueIdentifiesRow: true
            }
            appearance {
                formatMask: SINCE
            }
        )

        column COMMENT_TEXT (
            layout {
                sequence: 40
            }
            source {
                databaseColumn: COMMENT_TEXT
                dataType: varchar2
            }
        )

        column USER_CSS_CLASS (
            layout {
                sequence: 20
            }
            source {
                databaseColumn: USER_CSS_CLASS
                dataType: varchar2
            }
        )

        column USER_INITIALS (
            layout {
                sequence: 10
            }
            source {
                databaseColumn: USER_INITIALS
                dataType: varchar2
            }
        )

        column USER_NAME (
            layout {
                sequence: 30
            }
            source {
                databaseColumn: USER_NAME
                dataType: varchar2
            }
            accessibility {
                valueIdentifiesRow: true
            }
        )

    )

    region delegate (
        name: Delegate
        type: staticContent
        layout {
            sequence: 10
            parentRegion: @subject
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        advanced {
            htmlDomId: DELEGATE
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_delegate )
                ```
        }
        settings {
            outputAs: text
        }
    )

    region details (
        name: Details
        type: themeTemplateComponent/contentRow
        source {
            location: localDatabase
            type: sqlQuery
            sqlQuery:
                ```sql
                select param_static_id,
                       param_label,
                       param_value,
                       is_updatable,
                       is_required
                  from apex_task_parameters
                 where task_id = :P10_TASK_ID
                   and is_visible = 'Y'
                 order by param_label;
                ```
            pageItemsToSubmit: P10_TASK_ID
        }
        layout {
            sequence: 40
            slot: BODY
        }
        appearance {
            template: @/standard
            templateOptions: [
                #DEFAULT#
                t-Region--noPadding
                t-Region--scrollBody
            ]
        }
        accessibility {
            landmarkType: region
        }
        serverSideCondition {
            type: rowsReturned
            sqlQuery:
                ```sql
                select null
                  from apex_task_parameters
                 where task_id = :P10_TASK_ID
                ```
        }
        componentAppearance {
            display: report
        }
        settings {
            overline: &PARAM_LABEL.
            title: &PARAM_VALUE.
        }
        plugin-appearance {
            applyThemeColors: false
        }

        column IS_REQUIRED (
            layout {
                sequence: 50
            }
            source {
                databaseColumn: IS_REQUIRED
                dataType: varchar2
            }
        )

        column IS_UPDATABLE (
            layout {
                sequence: 40
            }
            source {
                databaseColumn: IS_UPDATABLE
                dataType: varchar2
            }
        )

        column PARAM_LABEL (
            layout {
                sequence: 20
            }
            source {
                databaseColumn: PARAM_LABEL
                dataType: varchar2
            }
            accessibility {
                valueIdentifiesRow: true
            }
        )

        column PARAM_STATIC_ID (
            layout {
                sequence: 10
            }
            source {
                databaseColumn: PARAM_STATIC_ID
                dataType: varchar2
                primaryKey: true
            }
        )

        column PARAM_VALUE (
            layout {
                sequence: 30
            }
            source {
                databaseColumn: PARAM_VALUE
                dataType: varchar2
            }
        )

        action parameter-actions (
            position: primaryActions
            template: menu
            label: Actions
            layout {
                sequence: 10
            }
            appearance {
                displayType: icon
                icon: fa-ellipsis-v
            }

            menu edit-parameter (
                label: Edit
                layout {
                    sequence: 10
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #
                    linkAttributes: "class="parameter" data-id="&PARAM_STATIC_ID!ATTR." data-label="&PARAM_LABEL!ATTR." data-value="&PARAM_VALUE!ATTR." data-required="&IS_REQUIRED!ATTR." aria-haspopup="dialog""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression: :IS_UPDATABLE = 'Y' and :P10_CAN_UPDATE_PARAMS = 'Y'
                }
            )
        )

    )

    region developer-information (
        name: Developer Information
        type: staticContent
        source {
            htmlCode:
                ```html
                <p>This page shows detailed information for the human task whose ID is passed
                in to the <strong>Pnn_TASK_ID</strong> page item and is used as boilerplate for you to
                start building your Task Detail page that your user will use to perform the
                task. APEX has generated this page for you containing all of the task
                services available for Human Tasks. These includes services like:</p>

                <ul>
                    <li>task claiming, release and delegation</li>
                    <li>task due dates, expiration, renewal</li>
                    <li>requesting and providing more information from the originator</li>
                    <li>task commenting</li>
                    <li>task history</li>
                    <li>saving task progress and submitting a complete task</li>
                </ul>

                <p>You can delete this region and any task service regions or buttons that
                are not required for your application. Then add one or more regions that
                implement the task that the user needs to perform as part of your
                application. You can do this by adding forms, reports, cards or other APEX
                region types inside this page - just like you would on a normal page.</p>

                <p>You will need to make sure that the Page Processing includes processes to
                update your data into the database. These should be executed on the
                <strong>Save</strong> and <strong>Complete</strong> buttons. The
                <strong>Automatic Row Processing</strong> process should occur
                <strong>before Human Task - Manage</strong> process executes.</p>
                ```
        }
        layout {
            sequence: 50
            slot: BODY
        }
        appearance {
            template: @/alert
            templateOptions: [
                #DEFAULT#
                t-Alert--horizontal
                t-Alert--defaultIcons
                t-Alert--info
            ]
        }
        serverSideCondition {
            type: expression
            plsqlExpression: :APP_BUILDER_SESSION is not null
        }
    )

    region due (
        name: Due
        type: staticContent
        layout {
            sequence: 30
            parentRegion: @subject
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        advanced {
            htmlDomId: SET_DUE_DATE
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_set_due_date )
                ```
        }
        settings {
            outputAs: text
        }
    )

    region edit-parameter (
        name: Edit Parameter
        type: staticContent
        layout {
            sequence: 90
            parentRegion: @details
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        serverSideCondition {
            type: expression
            plsqlExpression: :P10_CAN_UPDATE_PARAMS = 'Y'
        }
        settings {
            outputAs: text
        }
    )

    region history (
        name: History
        type: themeTemplateComponent/comments
        source {
            location: localDatabase
            type: sqlQuery
            sqlQuery:
                ```sql
                select display_msg,
                       event_creator,
                       event_timestamp
                  from table ( apex_human_task.get_task_history (
                                   p_task_id     => :P10_TASK_ID,
                                   p_include_all => :P10_ALL_HISTORY ) )
                 order by event_timestamp desc
                ```
            pageItemsToSubmit: [
                P10_TASK_ID
                P10_ALL_HISTORY
            ]
        }
        layout {
            sequence: 70
            slot: BODY
        }
        appearance {
            template: @/collapsible
            templateOptions: [
                #DEFAULT#
                js-useLocalStorage
                is-collapsed
                t-Region--scrollBody
            ]
            renderComponents: belowContent
        }
        accessibility {
            landmarkType: region
        }
        componentAppearance {
            display: report
        }
        settings {
            commentText: DISPLAY_MSG
            userName: EVENT_CREATOR
            date: EVENT_TIMESTAMP
            displayAvatar: false
            applyThemeColors: false
        }

        column DISPLAY_MSG (
            layout {
                sequence: 10
            }
            source {
                databaseColumn: DISPLAY_MSG
                dataType: varchar2
            }
        )

        column EVENT_CREATOR (
            layout {
                sequence: 20
            }
            source {
                databaseColumn: EVENT_CREATOR
                dataType: varchar2
            }
            accessibility {
                valueIdentifiesRow: true
            }
        )

        column EVENT_TIMESTAMP (
            layout {
                sequence: 30
            }
            source {
                databaseColumn: EVENT_TIMESTAMP
                dataType: date
            }
            accessibility {
                valueIdentifiesRow: true
            }
            appearance {
                formatMask: SINCE
            }
        )

    )

    region invite-participant (
        name: Invite Participant
        type: staticContent
        layout {
            sequence: 60
            parentRegion: @subject
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        advanced {
            htmlDomId: ADD_OWNER
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_add_owner )
                ```
        }
        settings {
            outputAs: text
        }
    )

    region priority (
        name: Priority
        type: staticContent
        layout {
            sequence: 20
            parentRegion: @subject
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        advanced {
            htmlDomId: SET_PRIORITY
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_set_priority )
                ```
        }
        settings {
            outputAs: text
        }
    )

    region remove-participant (
        name: Remove Participant
        type: staticContent
        layout {
            sequence: 70
            parentRegion: @subject
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        advanced {
            htmlDomId: REMOVE_OWNER
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_remove_owner )
                ```
        }
        settings {
            outputAs: text
        }
    )

    region request-information (
        name: Request Information
        type: staticContent
        layout {
            sequence: 40
            parentRegion: @subject
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        advanced {
            htmlDomId: REQUEST_INFO
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_request_info )
                ```
        }
        settings {
            outputAs: text
        }
    )

    region subject (
        name: Subject
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
                                   p_context => 'SINGLE_TASK',
                                   p_task_id => :P10_TASK_ID ) );
                ```
        }
        layout {
            sequence: 30
            slot: BODY
        }
        appearance {
            template: @/standard
            templateOptions: [
                #DEFAULT#
                t-Region--noPadding
                t-Region--hideHeader js-addHiddenHeadingRoleDesc
                t-Region--noUI
                t-Region--scrollBody
            ]
        }
        accessibility {
            landmarkType: region
        }
        componentAppearance {
            display: partial
        }
        settings {
            title: &SUBJECT.
            description:
                ```html
                <strong>&TASK_DEF_NAME!HTML.</strong>
                {if INITIATOR/}
                    <span role="separator" aria-label="&middot;"> &middot; </span>
                    &{APEX.TASK.INITIATED_BY_USER_SINCE 0=&INITIATOR!HTML. 1=&CREATED_AGO.}.
                {endif/}
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
            size: medium
            columnWidth: auto
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

        action actions (
            position: primaryActions
            template: menu
            label: Actions
            layout {
                sequence: 20
            }
            appearance {
                displayType: icon
                icon: fa-ellipsis-v
            }

            menu cancel-task (
                label: Cancel Task
                layout {
                    sequence: 90
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$cancel?do=openRegion
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_cancel )
                        ```
                }
            )

            menu change-due-date (
                label: Change Due Date
                layout {
                    sequence: 50
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$set_due_date?do=openRegion
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_set_due_date )
                        ```
                }
            )

            menu change-priority (
                label: Change Priority
                layout {
                    sequence: 40
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$set_priority?do=openRegion
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_set_priority )
                        ```
                }
            )

            menu delegate (
                label: Delegate
                layout {
                    sequence: 30
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$delegate?do=openRegion
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_delegate )
                        ```
                }
            )

            menu invite-participant (
                label: Invite Participant
                layout {
                    sequence: 70
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$add_owner?do=openRegion
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_add_owner )
                        ```
                }
            )

            menu release (
                label: Release
                layout {
                    sequence: 20
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$release?do=submit
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_release )
                        ```
                }
            )

            menu remove-participant (
                label: Remove Participant
                layout {
                    sequence: 80
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$remove_owner?do=openRegion
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_remove_owner )
                        ```
                }
            )

            menu renew-task (
                label: Renew Task
                layout {
                    sequence: 10
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$renew?do=submit
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_renew )
                        ```
                }
            )

            menu request-information (
                label: Request Information
                layout {
                    sequence: 60
                }
                behavior {
                    type: redirectUrl
                    targetUrl: #action$request_info?do=openRegion
                    linkAttributes: "class="taskActionMenu""
                }
                serverSideCondition {
                    type: expression
                    plsqlExpression:
                        ```plsql
                        apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_request_info )
                        ```
                }
            )

        )

    )

    region submit-information (
        name: Submit Information
        type: staticContent
        layout {
            sequence: 50
            parentRegion: @subject
            slot: SUB_REGIONS
        }
        appearance {
            template: @/inline-popup
            templateOptions: [
                #DEFAULT#
                js-dialog-autoheight
                js-dialog-nosize
            ]
        }
        accessibility {
            landmarkType: form
        }
        advanced {
            htmlDomId: SUBMIT_INFO
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_submit_info )
                ```
        }
        settings {
            outputAs: text
        }
    )

    pageItem P10_ALL_COMMENTS (
        type: checkbox
        label {
            label: Include comments from expired tasks
            alignment: left
        }
        settings {
            useDefaults: false
            checkedValue: Y
            uncheckedValue: N
        }
        layout {
            sequence: 20
            region: @comments
            slot: regionBody
            alignment: left
            labelColumnSpan: 0
        }
        appearance {
            template: @/optional
            templateOptions: #DEFAULT#
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        source {
            type: static
            staticValue: N
        }
        serverSideCondition {
            type: rowsReturned
            sqlQuery:
                ```sql
                select task_id
                  from apex_tasks
                 where task_id = :P10_TASK_ID
                   and previous_task_id is not null
                ```
        }
    )

    pageItem P10_ALL_HISTORY (
        type: checkbox
        label {
            label: Include history from expired tasks
            alignment: left
        }
        settings {
            useDefaults: false
            checkedValue: Y
            uncheckedValue: N
        }
        layout {
            sequence: 10
            region: @history
            slot: regionBody
            alignment: left
            labelColumnSpan: 0
        }
        appearance {
            template: @/optional
            templateOptions: #DEFAULT#
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        source {
            type: static
            staticValue: N
        }
        serverSideCondition {
            type: rowsReturned
            sqlQuery:
                ```sql
                select task_id
                  from apex_tasks
                 where task_id = :P10_TASK_ID
                   and previous_task_id is not null
                ```
        }
    )

    pageItem P10_CAN_UPDATE_PARAMS (
        type: hidden
        layout {
            sequence: 20
            slot: BODY
        }
        sessionState {
            storage: request
        }
        security {
            sessionStateProtection: checksumRequiredSessionLevel
            encryptSessionState: false
        }
    )

    pageItem P10_COMMENT_TEXT (
        type: textarea
        label {
            label: Comment
            alignment: left
        }
        settings {
            autoHeight: true
        }
        layout {
            sequence: 10
            region: @add-comment
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: [
                #DEFAULT#
                t-Form-fieldContainer--stretchInputs
            ]
            width: 30
            height: 7
        }
        validation {
            valueRequired: true
            maxLength: 2000
        }
        sessionState {
            storage: request
        }
    )

    pageItem P10_IS_REQUIRED (
        type: hidden
        settings {
            valueProtected: false
        }
        layout {
            sequence: 50
            region: @edit-parameter
            slot: regionBody
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        sessionState {
            storage: request
        }
        security {
            encryptSessionState: false
        }
    )

    pageItem P10_NEW_DUE_DATE (
        type: datePicker
        label {
            label: New Due Date
            alignment: left
        }
        settings {
            showTime: true
            displayAs: inline
        }
        layout {
            sequence: 10
            region: @due
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            formatMask: YYYY-MM-DD HH24:MI
            width: 30
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        source {
            type: sqlQuerySingleValue
            sqlQuery:
                ```sql
                select to_char(due_on, 'YYYY-MM-DD HH24:MI')
                  from apex_tasks
                 where task_id = :P10_TASK_ID
                ```
            used: always
        }
        sessionState {
            storage: request
        }
        security {
            sessionStateProtection: checksumRequiredSessionLevel
        }
    )

    pageItem P10_NEW_OWNER (
        type: selectList
        label {
            label: New Owner
            alignment: left
        }
        lov {
            type: sqlQuery
            sqlQuery:
                ```sql
                select disp,
                       val
                  from table (
                           apex_human_task.get_task_delegates (
                               p_task_id => :P10_TASK_ID ) )
                ```
            displayExtraValues: false
            displayNullValue: false
        }
        layout {
            sequence: 10
            region: @delegate
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            height: 1
        }
        validation {
            valueRequired: true
        }
    )

    pageItem P10_NEW_POTENTIAL_OWNER (
        type: textField
        label {
            label: New Potential Owner
            alignment: left
        }
        layout {
            sequence: 10
            region: @invite-participant
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/required-floating
            templateOptions: #DEFAULT#
            width: 30
        }
        validation {
            valueRequired: true
            maxLength: 100
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        sessionState {
            storage: request
        }
    )

    pageItem P10_NEW_PRIORITY (
        type: radioGroup
        label {
            label: New Priority
            alignment: left
        }
        lov {
            type: sharedComponent
            lov: @unified-task-list-lov-priority
            displayExtraValues: false
            displayNullValue: false
        }
        layout {
            sequence: 10
            region: @priority
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
        }
        source {
            type: sqlQuerySingleValue
            sqlQuery:
                ```sql
                select priority
                  from apex_tasks
                 where task_id = :P10_TASK_ID
                ```
        }
    )

    pageItem P10_NEW_VALUE (
        type: textarea
        label {
            label: New Value
            alignment: left
        }
        layout {
            sequence: 40
            region: @edit-parameter
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/required-floating
            templateOptions: #DEFAULT#
            width: 30
            height: 3
        }
        validation {
            valueRequired: true
            maxLength: 4000
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        sessionState {
            storage: request
        }
    )

    pageItem P10_PARAM_LABEL (
        type: displayOnly
        label {
            label: Parameter
            alignment: left
        }
        settings {
            sendOnPageSubmit: false
        }
        layout {
            sequence: 20
            region: @edit-parameter
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        sessionState {
            storage: request
        }
        security {
            encryptSessionState: false
        }
    )

    pageItem P10_PARAM_STATIC_ID (
        type: hidden
        settings {
            valueProtected: false
        }
        layout {
            sequence: 10
            region: @edit-parameter
            slot: regionBody
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        sessionState {
            storage: request
        }
        security {
            encryptSessionState: false
        }
    )

    pageItem P10_PARAM_VALUE (
        type: displayOnly
        label {
            label: Current Value
            alignment: left
        }
        settings {
            sendOnPageSubmit: false
        }
        layout {
            sequence: 30
            region: @edit-parameter
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        sessionState {
            storage: request
        }
        security {
            encryptSessionState: false
        }
    )

    pageItem P10_POTENTIAL_OWNER (
        type: selectList
        label {
            label: Potential Owner
            alignment: left
        }
        lov {
            type: sqlQuery
            sqlQuery:
                ```sql
                select disp,
                       val
                  from table (
                           apex_human_task.get_task_delegates (
                               p_task_id => :P10_TASK_ID ) )
                ```
            displayExtraValues: false
            displayNullValue: false
        }
        layout {
            sequence: 10
            region: @remove-participant
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            height: 1
        }
        validation {
            valueRequired: true
        }
    )

    pageItem P10_REQUEST_INFO_TEXT (
        type: textarea
        label {
            label: Message
            alignment: left
        }
        settings {
            autoHeight: true
        }
        layout {
            sequence: 10
            region: @request-information
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            width: 30
            height: 7
        }
        validation {
            valueRequired: true
            maxLength: 4000
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        sessionState {
            storage: request
        }
    )

    pageItem P10_SUBMIT_INFO_TEXT (
        type: textarea
        label {
            label: Message
            alignment: left
        }
        settings {
            autoHeight: true
        }
        layout {
            sequence: 10
            region: @submit-information
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            width: 30
            height: 7
        }
        validation {
            valueRequired: true
            maxLength: 4000
        }
        advanced {
            warnOnUnsavedChanges: ignore
        }
        sessionState {
            storage: request
        }
    )

    pageItem P10_TASK_ID (
        type: hidden
        layout {
            sequence: 10
            slot: BODY
        }
        sessionState {
            storage: request
        }
        security {
            sessionStateProtection: checksumRequiredSessionLevel
            encryptSessionState: false
        }
    )

    button add-comment (
        buttonName: ADD_COMMENT
        label: Add Comment
        layout {
            sequence: 20
            region: @add-comment
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button cancel (
        buttonName: CANCEL
        label: Cancel
        layout {
            sequence: 10
            region: @buttons
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-dialog-cancel (
            action: cancelDialog
            execution {
                sequence: 10
            }
        )

    )

    button cancel-task (
        buttonName: CANCEL_TASK
        label: Cancel Task
        layout {
            sequence: 20
            region: @cancel-task
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
            cssClasses: u-danger
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button claim (
        buttonName: CLAIM
        label: Claim Task
        layout {
            sequence: 10
            region: @buttons
            slot: CREATE
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_claim )
                ```
        }
    )

    button close-add-comment (
        buttonName: CLOSE_ADD_COMMENT
        label: Close
        layout {
            sequence: 10
            region: @add-comment
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @add-comment
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-cancel-task (
        buttonName: CLOSE_CANCEL_TASK
        label: Close
        layout {
            sequence: 10
            region: @cancel-task
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @cancel-task
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-delegate (
        buttonName: CLOSE_DELEGATE
        label: Close
        layout {
            sequence: 10
            region: @delegate
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @delegate
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-invite-participant (
        buttonName: CLOSE_INVITE_PARTICIPANT
        label: Close
        layout {
            sequence: 10
            region: @invite-participant
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @invite-participant
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-remove-participant (
        buttonName: CLOSE_REMOVE_PARTICIPANT
        label: Close
        layout {
            sequence: 10
            region: @remove-participant
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @remove-participant
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-request-information (
        buttonName: CLOSE_REQUEST_INFORMATION
        label: Close
        layout {
            sequence: 10
            region: @request-information
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @request-information
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-set-due (
        buttonName: CLOSE_SET_DUE
        label: Close
        layout {
            sequence: 10
            region: @due
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @due
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-set-priority (
        buttonName: CLOSE_SET_PRIORITY
        label: Close
        layout {
            sequence: 10
            region: @priority
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @priority
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-submit-information (
        buttonName: CLOSE_SUBMIT_INFORMATION
        label: Close
        layout {
            sequence: 10
            region: @submit-information
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @submit-information
            }
            execution {
                sequence: 10
            }
        )

    )

    button close-update-parameter (
        buttonName: CLOSE_UPDATE_PARAMETER
        label: Close
        layout {
            sequence: 10
            region: @edit-parameter
            slot: CLOSE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }

        triggerAction native-close-region (
            action: closeRegion
            affectedElements {
                selectionType: region
                region: @edit-parameter
            }
            execution {
                sequence: 10
            }
        )

    )

    button complete (
        buttonName: COMPLETE
        label: Complete
        layout {
            sequence: 40
            region: @buttons
            slot: CREATE
        }
        appearance {
            buttonTemplate: @/text-with-icon
            hot: true
            templateOptions: [
                #DEFAULT#
                t-Button--success
                t-Button--iconLeft
            ]
            icon: fa-box-arrow-out-east
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_complete )
                ```
        }
    )

    button delegate (
        buttonName: DELEGATE
        label: Delegate
        layout {
            sequence: 20
            region: @delegate
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button invite-participant (
        buttonName: INVITE_PARTICIPANT
        label: Invite Participant
        layout {
            sequence: 20
            region: @invite-participant
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button open-dialog-add-comment (
        buttonName: OPEN_DIALOG_ADD_COMMENT
        label: Add Comment
        layout {
            sequence: 10
            region: @comments
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }
        advanced {
            htmlDomId: OPEN_DIALOG_ADD_COMMENT
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                not apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_submit_info )
                and apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_add_comment )
                ```
        }

        triggerAction native-open-region (
            action: openRegion
            affectedElements {
                selectionType: region
                region: @add-comment
            }
            execution {
                sequence: 10
            }
        )

    )

    button open-dialog-submit-information (
        buttonName: OPEN_DIALOG_SUBMIT_INFORMATION
        label: Submit Information
        layout {
            sequence: 20
            region: @comments
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            action: triggerAction
            executeValidations: false
        }
        advanced {
            htmlDomId: OPEN_DIALOG_SUBMIT_INFORMATION
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_submit_info )
                ```
        }

        triggerAction native-open-region (
            action: openRegion
            affectedElements {
                selectionType: region
                region: @submit-information
            }
            execution {
                sequence: 10
            }
        )

    )

    button remove-participant (
        buttonName: REMOVE_PARTICIPANT
        label: Remove Participant
        layout {
            sequence: 20
            region: @remove-participant
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button request-information (
        buttonName: REQUEST_INFORMATION
        label: Request Information
        layout {
            sequence: 20
            region: @request-information
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button save (
        buttonName: SAVE
        label: Save
        layout {
            sequence: 30
            region: @buttons
            slot: CREATE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: [
                #DEFAULT#
                t-Button--link
            ]
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
        serverSideCondition {
            type: expression
            plsqlExpression:
                ```plsql
                apex_human_task.is_allowed (
                    p_task_id   => :P10_TASK_ID,
                    p_operation => apex_human_task.c_task_op_complete )
                ```
        }
    )

    button set-due (
        buttonName: SET_DUE
        label: Change Due Date
        layout {
            sequence: 20
            region: @due
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button set-priority (
        buttonName: SET_PRIORITY
        label: Change Priority
        layout {
            sequence: 20
            region: @priority
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button submit-information (
        buttonName: SUBMIT_INFORMATION
        label: Submit Information
        layout {
            sequence: 20
            region: @submit-information
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    button update-parameter (
        buttonName: UPDATE_PARAMETER
        label: Apply Changes
        layout {
            sequence: 20
            region: @edit-parameter
            slot: EDIT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
        }
    )

    dynamicAction disable-enable-update-button (
        name: Disable/Enable Update Button
        execution {
            sequence: 10
        }
        when {
            event: keyup
            selectionType: items
            items: P10_NEW_VALUE
        }
        clientSideCondition {
            type: javascriptExpression
            javaScriptExpression: apex.items.P10_NEW_VALUE.value != apex.items.P10_PARAM_VALUE.value
        }

        action native-disable (
            action: disable
            affectedElements {
                selectionType: button
                button: @update-parameter
            }
            execution {
                sequence: 20
                event: @disable-enable-update-button
                fireWhenEventResultIs: false
                fireOnInit: false
            }
        )

        action native-enable (
            action: enable
            affectedElements {
                selectionType: button
                button: @update-parameter
            }
            execution {
                sequence: 10
                event: @disable-enable-update-button
                fireOnInit: false
            }
        )

    )

    dynamicAction edit-parameter (
        name: Edit Parameter
        execution {
            sequence: 10
            eventScope: dynamic
            staticContainer: body
        }
        when {
            event: click
            selectionType: jQuerySelector
            jquerySelector: a.parameter
        }

        action native-disable (
            action: disable
            affectedElements {
                selectionType: button
                button: @update-parameter
            }
            execution {
                sequence: 20
                event: @edit-parameter
                fireOnInit: false
            }
        )

        action native-open-region (
            action: openRegion
            affectedElements {
                selectionType: region
                region: @edit-parameter
            }
            execution {
                sequence: 10
                event: @edit-parameter
                fireOnInit: false
            }
        )

        action native-set-focus (
            action: setFocus
            affectedElements {
                selectionType: items
                items: P10_NEW_VALUE
            }
            execution {
                sequence: 70
                event: @edit-parameter
                fireOnInit: false
            }
        )

        action native-set-value (
            action: setValue
            settings {
                type: javaScriptExpression
                javaScriptExpression: apex.jQuery(this.triggeringElement).attr("data-id")
                suppressChangeEvent: true
            }
            affectedElements {
                selectionType: items
                items: P10_PARAM_STATIC_ID
            }
            execution {
                sequence: 30
                event: @edit-parameter
                fireOnInit: false
            }
        )

        action native-set-value-2 (
            action: setValue
            settings {
                type: javaScriptExpression
                javaScriptExpression: apex.jQuery(this.triggeringElement).attr("data-label")
                suppressChangeEvent: true
            }
            affectedElements {
                selectionType: items
                items: P10_PARAM_LABEL
            }
            execution {
                sequence: 40
                event: @edit-parameter
                fireOnInit: false
            }
        )

        action native-set-value-3 (
            action: setValue
            settings {
                type: javaScriptExpression
                javaScriptExpression: apex.jQuery(this.triggeringElement).attr("data-value")
                suppressChangeEvent: true
            }
            affectedElements {
                selectionType: items
                items: [
                    P10_PARAM_VALUE
                    P10_NEW_VALUE
                ]
            }
            execution {
                sequence: 50
                event: @edit-parameter
                fireOnInit: false
            }
        )

        action native-set-value-4 (
            action: setValue
            settings {
                type: javaScriptExpression
                javaScriptExpression: apex.jQuery(this.triggeringElement).attr("data-required")
                suppressChangeEvent: true
            }
            affectedElements {
                selectionType: items
                items: P10_IS_REQUIRED
            }
            execution {
                sequence: 60
                event: @edit-parameter
                fireOnInit: false
            }
        )

    )

    dynamicAction refresh-comments (
        name: Refresh - Comments
        execution {
            sequence: 10
        }
        when {
            selectionType: items
            items: P10_ALL_COMMENTS
        }

        action native-refresh (
            action: refresh
            affectedElements {
                selectionType: region
                region: @comments
            }
            execution {
                sequence: 10
                event: @refresh-comments
                fireOnInit: false
            }
        )

    )

    dynamicAction refresh-history (
        name: Refresh - History
        execution {
            sequence: 20
        }
        when {
            selectionType: items
            items: P10_ALL_HISTORY
        }

        action native-refresh (
            action: refresh
            affectedElements {
                selectionType: region
                region: @history
            }
            execution {
                sequence: 10
                event: @refresh-history
                fireOnInit: false
            }
        )

    )

    computation p10-can-update-params (
        itemName: P10_CAN_UPDATE_PARAMS
        execution {
            sequence: 10
            point: beforeHeader
        }
        computation {
            type: expression
            plsqlExpression:
                ```plsql
                case
                    when apex_human_task.is_allowed (
                            p_task_id   => :P10_TASK_ID,
                            p_operation => apex_human_task.c_task_op_set_params )
                    then 'Y'
                    else 'N'
                end
                ```
        }
    )

    process add-comment (
        name: Add Comment
        type: humanTaskManage
        action {
            type: comment
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            commentText: &P10_COMMENT_TEXT.
        }
        execution {
            sequence: 150
        }
        successMessage {
            successMessage: Comment added
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488820278710083957
        }
        serverSideCondition {
            whenButtonPressed: @add-comment
        }
    )

    process cancel-task (
        name: Cancel Task
        type: humanTaskManage
        action {
            type: cancel
        }
        humanTask {
            taskIdItem: P10_TASK_ID
        }
        execution {
            sequence: 130
        }
        successMessage {
            successMessage: Task canceled
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488819449448083957
        }
        serverSideCondition {
            whenButtonPressed: @cancel-task
        }
    )

    process change-due-date (
        name: Change Due Date
        type: humanTaskManage
        action {
            type: setDueDate
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            dueDateItem: P10_NEW_DUE_DATE
        }
        execution {
            sequence: 80
        }
        successMessage {
            successMessage: Task due date updated
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488817414085083956
        }
        serverSideCondition {
            whenButtonPressed: @set-due
        }
    )

    process change-priority (
        name: Change Priority
        type: humanTaskManage
        action {
            type: setPriority
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            priorityItem: P10_NEW_PRIORITY
        }
        execution {
            sequence: 70
        }
        successMessage {
            successMessage: Task priority changed
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488817026008083955
        }
        serverSideCondition {
            whenButtonPressed: @set-priority
        }
    )

    process claim (
        name: Claim
        type: humanTaskManage
        action {
            type: claim
        }
        humanTask {
            taskIdItem: P10_TASK_ID
        }
        execution {
            sequence: 20
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488815406566083955
        }
        serverSideCondition {
            whenButtonPressed: @claim
        }
    )

    process close-dialog (
        name: Close Dialog
        type: closeDialog
        execution {
            sequence: 160
        }
        advanced {
            executionMappingIdentifier: 137488820619912083957
        }
        serverSideCondition {
            type: requestIsNotContainedInValue
            value: CLAIM,SET_PRIORITY,SET_DUE,INVITE_PARTICIPANT,REMOVE_PARTICIPANT,RENEW,UPDATE_PARAMETER,SAVE,ADD_COMMENT
        }
    )

    process complete (
        name: Complete
        type: humanTaskManage
        action {
            type: completeWithoutOutcome
        }
        humanTask {
            taskIdItem: P10_TASK_ID
        }
        execution {
            sequence: 30
        }
        successMessage {
            successMessage: Task completed
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488815813727083955
        }
        serverSideCondition {
            whenButtonPressed: @complete
        }
    )

    process delegate (
        name: Delegate
        type: humanTaskManage
        action {
            type: delegate
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            toUserItem: P10_NEW_OWNER
        }
        execution {
            sequence: 60
        }
        successMessage {
            successMessage: Task delegated to &P10_NEW_OWNER!HTML.
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488816677408083955
        }
        serverSideCondition {
            whenButtonPressed: @delegate
        }
    )

    process invite-participant (
        name: Invite Participant
        type: humanTaskManage
        action {
            type: inviteParticipant
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            toUserItem: P10_NEW_POTENTIAL_OWNER
        }
        execution {
            sequence: 110
        }
        successMessage {
            successMessage: Participant &P10_NEW_POTENTIAL_OWNER!HTML. added to task as potential owner
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488818696910083956
        }
        serverSideCondition {
            whenButtonPressed: @invite-participant
        }
    )

    process release (
        name: Release
        type: humanTaskManage
        action {
            type: release
        }
        humanTask {
            taskIdItem: P10_TASK_ID
        }
        execution {
            sequence: 50
        }
        successMessage {
            successMessage: Task released - can now be claimed by others
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488816269813083955
        }
        serverSideCondition {
            type: request=Value
            value: RELEASE
        }
    )

    process remove-participant (
        name: Remove Participant
        type: humanTaskManage
        action {
            type: removeParticipant
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            toUserItem: P10_POTENTIAL_OWNER
        }
        execution {
            sequence: 120
        }
        successMessage {
            successMessage: Participant &P10_POTENTIAL_OWNER!HTML. removed from task.
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488819077408083956
        }
        serverSideCondition {
            whenButtonPressed: @remove-participant
        }
    )

    process renew-task (
        name: Renew Task
        type: humanTaskManage
        action {
            type: renew
        }
        humanTask {
            taskIdItem: P10_TASK_ID
        }
        renew {
            renewedTaskIdItem: P10_TASK_ID
        }
        execution {
            sequence: 10
        }
        successMessage {
            successMessage: Task renewed
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488815016884083954
        }
        serverSideCondition {
            type: request=Value
            value: RENEW
        }
    )

    process request-information (
        name: Request Information
        type: humanTaskManage
        action {
            type: requestInfo
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            commentText: &P10_REQUEST_INFO_TEXT.
        }
        execution {
            sequence: 90
        }
        successMessage {
            successMessage: Information requested
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488817891151083956
        }
        serverSideCondition {
            whenButtonPressed: @request-information
        }
    )

    process submit-information (
        name: Submit Information
        type: humanTaskManage
        action {
            type: submitInfo
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            commentText: &P10_SUBMIT_INFO_TEXT.
        }
        execution {
            sequence: 100
        }
        successMessage {
            successMessage: Information submitted
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488818292009083956
        }
        serverSideCondition {
            whenButtonPressed: @submit-information
        }
    )

    process update-parameter (
        name: Update Parameter
        type: humanTaskManage
        action {
            type: updateParam
        }
        humanTask {
            taskIdItem: P10_TASK_ID
            paramItem: P10_PARAM_STATIC_ID
            newValueItem: P10_NEW_VALUE
        }
        execution {
            sequence: 140
        }
        successMessage {
            successMessage: Parameter updated
        }
        error {
            errorMessage: #SQLERRM_TEXT#
        }
        advanced {
            executionMappingIdentifier: 137488819848544083957
        }
        serverSideCondition {
            whenButtonPressed: @update-parameter
        }
    )

    branch (
        name: Reload Dialog
        execution {
            sequence: 10
        }
        behavior {
            target: f?p=&APP_ID.:&APP_PAGE_ID.:&APP_SESSION.::&DEBUG.::P10_TASK_ID:&P10_TASK_ID.&success_msg=#SUCCESS_MSG#
        }
    )

)
/*
  Rules to avoid APEXlang compile errors:
  - Ensure unified task list LOVs are present in shared-components/lovs.apx:
    unified-task-list-lov-priority and related unified-task-list lovs.
  - Do not hardcode APEXLANG$ actionTemplate IDs unless they exist in the target app.
    Prefer default action templates unless the target app explicitly supports a custom template.
  - Use only allowed data type values (for example varchar2, number, date). Avoid string/char.
  - Hidden items without formRegion should omit source { dataType } and include layout.slot.
*/
```
