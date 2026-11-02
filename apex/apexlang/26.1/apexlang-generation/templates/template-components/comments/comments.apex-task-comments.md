---
templateId: comments.apex-task-comments
componentType: region
version: 1.0
description: SQL-backed Comments example using the user-confirmed APEX_TASK_COMMENTS source.
object_evidence_source: user_asserted
---

# Output Template

```apexlang
region comments (
    name: Comments
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
        style: basic
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

Use this source only with the confirmed `APEX_TASK_COMMENTS` object and columns. Add a nested Avatar only through one compiler-supported branch from `comments.permutations.md`. Grouping is unsupported. Add an action only at `actions`, `avatarLink`, or `userNameLink` using the compiler-proven action shape from the Comments workflow.
