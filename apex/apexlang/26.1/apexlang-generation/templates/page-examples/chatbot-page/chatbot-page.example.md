---
templateId: page-examples.chatbot-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Chatbot Page Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
page 1 (
    name: Home
    alias: HOME
    title: APEX AI
    appearance {
        pageTemplate: @/standard
        templateOptions: #DEFAULT#
    }
    navigation {
        cursorFocus: doNotFocusCursor
    }
    security {
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }

    region apex-ai (
        name: APEX AI
        type: staticContent
        layout {
            sequence: 10
            slot: REGION_POSITION_01
        }
        appearance {
            template: @/hero
            templateOptions: #DEFAULT#
        }
        image {
            fileUrl: #APP_FILES#icons/app-icon-512.png
        }
    )

    button ai-chatbot (
        buttonName: AI_CHATBOT
        label: Ai Chatbot
        layout {
            sequence: 10
            region: @apex-ai
            slot: BODY
        }
        appearance {
            buttonTemplate: @/text-with-icon
            templateOptions: [
                #DEFAULT#
                t-Button--iconLeft
            ]
            icon: fa-chatbot
        }
        behavior {
            action: definedByDynamicAction
        }
    )

    dynamicAction new (
        name: New
        execution {
            sequence: 10
        }
        when {
            event: click
            selectionType: button
            button: @ai-chatbot
        }

        action native-open-ai-assistant (
            action: showAiAssistant
            genAI {
                agent: @home
            }
            execution {
                sequence: 10
                event: @new
                fireOnInit: false
            }
        )

    )

)
```
