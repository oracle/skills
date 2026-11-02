---
templateId: comments.permutations
componentType: region
version: 1.0
description: Supported Comments settings and nested Avatar permutations using the user-confirmed APEX_TASK_COMMENTS source.
object_evidence_source: user_asserted
---

# Supported Permutations

Use one branch per generated region. These examples include only compiler-proven selection and action structures; grouping remains unsupported.

```apexlang
region comments_basic_report (
    name: Basic Comments
    type: themeTemplateComponent/comments
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            select created_by as user_name,
                   text as comment_text,
                   created_on as comment_date
              from apex_task_comments
             order by created_on desc
            ```
    }
    layout {
        sequence: 10
        slot: body
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    accessibility {
        landmarkType: region
    }
    componentAppearance {
        display: report
    }
    settings {
        userName: USER_NAME
        commentText: COMMENT_TEXT
        date: COMMENT_DATE
        attributes: Posted comment
        commentClass: comment-entry
        displayAvatar: false
        style: basic
        alignment: inbound
        applyThemeColors: true
    }
    performance {
        lazyLoading: false
    }
    pagination {
        type: page
        entitiesPerPage: 15
        showTotalCount: false
    }
    entityTitle {
        singular: Comment
        plural: Comments
    }
    messages {
        whenNoDataFound: No comments found.
    }
    advanced {
        htmlDomId: comments-basic-report
    }
    column USER_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: USER_NAME
            dataType: varchar2
        }
    )
    column COMMENT_TEXT (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: COMMENT_TEXT
            dataType: varchar2
        }
    )
    column COMMENT_DATE (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: COMMENT_DATE
            dataType: date
        }
    )
)

region comments_chat_icon_avatar (
    name: Chat Comments with Icon Avatar
    type: themeTemplateComponent/comments
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            select created_by as user_name,
                   text as comment_text,
                   created_on as comment_date
              from apex_task_comments
             order by created_on desc
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
    accessibility {
        landmarkType: region
    }
    componentAppearance {
        display: report
    }
    settings {
        userName: USER_NAME
        commentText: COMMENT_TEXT
        date: COMMENT_DATE
        displayAvatar: true
        style: chatSpeechBubbles
        alignment: outbound
        applyThemeColors: false
    }
    plugin-avatar {
        type: icon
        icon: fa-user
        description: Comment author
        shape: circular
    }
    column USER_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: USER_NAME
            dataType: varchar2
        }
    )
    column COMMENT_TEXT (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: COMMENT_TEXT
            dataType: varchar2
        }
    )
    column COMMENT_DATE (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: COMMENT_DATE
            dataType: date
        }
    )
)

region comments_image_avatar (
    name: Comments with Image Avatar
    type: themeTemplateComponent/comments
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            select created_by as user_name,
                   text as comment_text,
                   created_on as comment_date,
                   :APP_FILES || 'icons/app-icon-512.png' as avatar_url
              from apex_task_comments
             order by created_on desc
            ```
    }
    layout {
        sequence: 30
        slot: body
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    accessibility {
        landmarkType: region
    }
    componentAppearance {
        display: report
    }
    settings {
        userName: USER_NAME
        commentText: COMMENT_TEXT
        date: COMMENT_DATE
        displayAvatar: true
        style: basic
    }
    plugin-avatar {
        type: image
        image: {
            type: urlColumn
            urlColumn: AVATAR_URL
        }
        description: Comment author image
        shape: rounded
    }
    column USER_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: USER_NAME
            dataType: varchar2
        }
    )
    column COMMENT_TEXT (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: COMMENT_TEXT
            dataType: varchar2
        }
    )
    column COMMENT_DATE (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: COMMENT_DATE
            dataType: date
        }
    )
    column AVATAR_URL (
        layout {
            sequence: 40
        }
        source {
            databaseColumn: AVATAR_URL
            dataType: varchar2
        }
    )
)

region comments_initials_avatar (
    name: Comments with Initials Avatar
    type: themeTemplateComponent/comments
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            select created_by as user_name,
                   text as comment_text,
                   created_on as comment_date,
                   upper(
                       substr(trim(created_by), 1, 1) ||
                       case
                           when instr(trim(created_by), ' ') > 0 then
                               substr(trim(created_by), instr(trim(created_by), ' ', -1) + 1, 1)
                       end
                   ) as avatar_initials
              from apex_task_comments
             order by created_on desc
            ```
    }
    layout {
        sequence: 40
        slot: body
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    accessibility {
        landmarkType: region
    }
    componentAppearance {
        display: report
    }
    settings {
        userName: USER_NAME
        commentText: COMMENT_TEXT
        date: COMMENT_DATE
        displayAvatar: true
        style: chatSpeechBubbles
    }
    plugin-avatar {
        type: initials
        initials: AVATAR_INITIALS
        description: Comment author initials
        shape: noShape
    }
    column USER_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: USER_NAME
            dataType: varchar2
        }
    )
    column COMMENT_TEXT (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: COMMENT_TEXT
            dataType: varchar2
        }
    )
    column COMMENT_DATE (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: COMMENT_DATE
            dataType: date
        }
    )
    column AVATAR_INITIALS (
        layout {
            sequence: 40
        }
        source {
            databaseColumn: AVATAR_INITIALS
            dataType: varchar2
        }
    )
)

region comments_partial_square_avatar (
    name: Partial Comment with Square Avatar
    type: themeTemplateComponent/comments
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            select created_by as user_name,
                   text as comment_text,
                   created_on as comment_date
              from apex_task_comments
             order by created_on desc
             fetch first 1 row only
            ```
    }
    layout {
        sequence: 50
        slot: body
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    accessibility {
        landmarkType: region
    }
    componentAppearance {
        display: partial
    }
    settings {
        userName: USER_NAME
        commentText: COMMENT_TEXT
        date: COMMENT_DATE
        displayAvatar: true
    }
    plugin-avatar {
        type: icon
        icon: fa-user
        description: Comment author
        shape: square
        cssClasses: avatar-comment-author
    }
    column USER_NAME (
        layout {
            sequence: 10
        }
        source {
            databaseColumn: USER_NAME
            dataType: varchar2
        }
    )
    column COMMENT_TEXT (
        layout {
            sequence: 20
        }
        source {
            databaseColumn: COMMENT_TEXT
            dataType: varchar2
        }
    )
    column COMMENT_DATE (
        layout {
            sequence: 30
        }
        source {
            databaseColumn: COMMENT_DATE
            dataType: date
        }
    )
)
```

# Boundaries

- `APEX_TASK_COMMENTS(CREATED_BY, TEXT, CREATED_ON)` is user-asserted evidence for these fixtures.
- The image branch uses an application-managed static-file URL and a declared varchar2 child column.
- The initials branch derives the first and last author-name initials into a dedicated projected column rather than hardcoding a value or mapping `USER_NAME` directly.
- Do not combine the icon, image, and initials payloads in one `plugin-avatar` block.
- Do not add nested Badge or grouping structures from the Universal Theme export. Comments supports the optional nested `plugin-avatar` structure plus compiler-proven `actions`, `avatarLink`, and `userNameLink` actions using a structured `behavior.target`.
- Keep `settings.attributes` free of executable markup, event handlers, URL schemes, and substitutions. Keep `settings.commentClass` to static CSS tokens or a direct declared `varchar2` Comments column.
