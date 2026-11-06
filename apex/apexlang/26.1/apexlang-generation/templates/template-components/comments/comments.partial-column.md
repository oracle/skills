---
templateId: comments.partial-column
componentType: column
version: 1.0
description: Partial Comments template component used as an Interactive Report column.
---

# Purpose

Render one Comments entity per Interactive Report row. The column is the partial Comments context; it does not emit the region-only report blocks or `settings.style`.

# Output Template

```apexlang
region comments_ir_column (
    name: Comments Interactive Report Column
    type: interactiveReport
    source {
        location: sampleData
        sampleData: tasks
    }
    layout {
        sequence: 10
        slot: body
    }
    appearance {
        template: @/interactive-report
        templateOptions: #DEFAULT#
    }
    column ASSIGNED_TO_NAME (
        type: plainText
        heading {
            heading: Author
        }
        layout {
            sequence: 10
        }
        source {
            dataType: STRING
        }
    )
    column TASK_NAME (
        type: plainText
        heading {
            heading: Comment
        }
        layout {
            sequence: 20
        }
        source {
            dataType: STRING
        }
    )
    column COMMENTS (
        type: themeTemplateComponent/comments
        heading {
            heading: Comments
        }
        layout {
            sequence: 30
        }
        source {
            dataType: STRING
        }
        settings {
            userName: ASSIGNED_TO_NAME
            commentText: TASK_NAME
        }
        action comments-column-action (
            position: actions
            label: Open comment
            layout {
                sequence: 40
            }
            behavior {
                target: {
                    page: 1
                }
            }
        )
        action comments-column-avatar-link (
            position: avatarLink
            layout {
                sequence: 50
            }
            behavior {
                target: {
                    page: 1
                }
            }
        )
        action comments-column-user-link (
            position: userNameLink
            layout {
                sequence: 60
            }
            behavior {
                target: {
                    page: 1
                }
            }
        )
    )
)
```

# Conditional Rendering Rules

- Keep `type: themeTemplateComponent/comments` on the `column COMMENTS` block.
- Include `heading`, `layout.sequence`, `source.dataType`, and `settings.userName` / `settings.commentText` on the Comments column.
- Actions may be attached to the column at `actions`, `avatarLink`, or `userNameLink`; use `layout.sequence` and structured `behavior.target`.
- Declare every mapped value as a sibling Interactive Report column and keep its source datatype compatible with the mapping.
- Treat the column as partial: omit `settings.style`, `componentAppearance`, `rowSelection`, pagination, performance, entity-title, messages, and advanced blocks.
- Add `settings.date` only when a sibling date or timestamp column is projected. Avatar settings use the same display toggle and nested payload contract as a partial Comments region.

# Validation Checklist

- The enclosing Interactive Report source projects all mapped sibling columns.
- The Comments column does not use `source.databaseColumn`, `source.sqlExpression`, or a report-only setting.
- No guessed grouping or nested Badge structure is emitted.
