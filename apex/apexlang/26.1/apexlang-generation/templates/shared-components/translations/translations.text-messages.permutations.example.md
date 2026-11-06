---
templateId: shared-components.translations.translations.text-messages.permutations.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Translations.Text Messages.Permutations Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
app TEXT_MESSAGE_PERMUTATIONS (
    name: Text Message Translation Permutations
    globalization {
        translationMethod: textMessages
    }
)

textMessage PAGE_42_TITLE (
    message {
        text: "Operations Console"
        language: en
    }
)

textMessage PAGE_42_TITLE (
    message {
        text: "オペレーションコンソール"
        language: ja
    }
)

textMessage REPORT_NO_DATA (
    message {
        text: "No matching work items were found."
        language: en
    }
)

textMessage REPORT_NO_DATA (
    message {
        text: "一致する作業項目は見つかりませんでした。"
        language: ja
    }
)

textMessage SAVE_ACTION (
    message {
        text: "Save changes"
        language: en
        usedInJavaScript: true
    }
)

textMessage SAVE_ACTION (
    message {
        text: "変更を保存"
        language: ja
        usedInJavaScript: true
    }
)

textMessage GREETING_WITH_SUBSTITUTION (
    message {
        text: "Hello %0, you have %1 pending tasks."
        language: en
    }
)

textMessage GREETING_WITH_SUBSTITUTION (
    message {
        text: "こんにちは %0 さん。保留中のタスクが %1 件あります。"
        language: ja
    }
)
```
