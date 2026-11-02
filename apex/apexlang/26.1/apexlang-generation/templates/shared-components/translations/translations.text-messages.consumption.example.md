---
templateId: shared-components.translations.translations.text-messages.consumption.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Translations.Text Messages.Consumption Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
// Template: Consume Text Messages in Components
// Purpose: Replace hard-coded page and component text with shared text-message keys.
// Usage: Copy relevant sections and substitute page numbers, static IDs, item names, and message keys.

page 42 (
    name: &APP_TEXT$MESSAGE_KEY_PAGE_NAME.
    title: &APP_TEXT$MESSAGE_KEY_PAGE_TITLE.

    help {
        helpText: &APP_TEXT$MESSAGE_KEY_PAGE_HELP.
    }

    region REGION_STATIC_ID (
        name: &APP_TEXT$MESSAGE_KEY_REGION_TITLE.
        type: staticContent
        source {
            htmlCode:
                ```html
                <p>&APP_TEXT$MESSAGE_KEY_REGION_BODY.</p>
                <p class="u-muted">&APP_TEXT$MESSAGE_KEY_REGION_FOOTNOTE.</p>
                ```
        }
        help {
            helpText: &APP_TEXT$MESSAGE_KEY_REGION_HELP.
        }
    )

    region ORDERS_REPORT (
        name: &APP_TEXT$MESSAGE_KEY_REPORT_TITLE.
        type: classicReport
        messages {
            whenNoDataFound: &APP_TEXT$MESSAGE_KEY_NO_DATA.
        }
    )
)

pageItem P42_TEXTFIELD (
    type: textField
    label {
        label: &APP_TEXT$MESSAGE_KEY_ITEM_LABEL.
    }
    help {
        helpText: &APP_TEXT$MESSAGE_KEY_ITEM_HELP.
    }
)

button SAVE (
    label: &APP_TEXT$MESSAGE_KEY_BUTTON_LABEL.
    confirmation {
        message: &APP_TEXT$MESSAGE_KEY_BUTTON_CONFIRM.
    }
)
```
