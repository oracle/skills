---
templateId: page-examples.login-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Login Page Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
page 9999 (
    name: Login Page
    alias: LOGIN
    title: Template Application - Log In
    appearance {
        pageTemplate: @/login
        templateOptions: #DEFAULT#
    }
    security {
        authentication: public
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }

    region template-application (
        name: Template Application
        type: staticContent
        layout {
            sequence: 10
            slot: contentBody
        }
        appearance {
            template: @/login
            templateOptions: #DEFAULT#
        }
        image {
            fileUrl: #APP_FILES#icons/app-icon-512.png
        }
    )

    pageItem P9999_PASSWORD (
        type: password
        label {
            label: Password
            alignment: right
        }
        layout {
            sequence: 20
            region: @template-application
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/hidden
            templateOptions: #DEFAULT#
            icon: fa-key
            width: 40
            valuePlaceholder: Password
        }
        validation {
            maxLength: 100
        }
        advanced {
            customAttributes: "autocomplete="current-password""
        }
        sessionState {
            storage: request
        }
    )

    pageItem P9999_REMEMBER (
        type: checkbox
        label {
            label: Remember username
            alignment: right
        }
        layout {
            sequence: 30
            region: @template-application
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/hidden
            templateOptions: #DEFAULT#
        }
        serverSideCondition {
            type: expression
            plsqlExpression: apex_authentication.persistent_cookies_enabled
        }
    )

    pageItem P9999_USERNAME (
        type: textField
        label {
            label: Username
            alignment: right
        }
        layout {
            sequence: 10
            region: @template-application
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/hidden
            templateOptions: #DEFAULT#
            icon: fa-user
            width: 40
            valuePlaceholder: Username
        }
        validation {
            maxLength: 100
        }
        advanced {
            customAttributes: "autocomplete="username""
        }
        sessionState {
            storage: request
        }
    )

    button login (
        buttonName: LOGIN
        label: Sign In
        layout {
            sequence: 40
            region: @template-application
            slot: next
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            warnOnUnsavedChanges: doNotCheck
        }
    )

    process clear-page-s-cache (
        name: Clear Page(s) Cache
        type: clearSessionState
        execution {
            sequence: 30
        }
        advanced {
            executionMappingIdentifier: 10417453103599452
        }
    )

    process get-username-cookie (
        name: Get Username Cookie
        type: executeCode
        source {
            plsqlCode: 
                ```plsql
                :P9999_USERNAME := apex_authentication.get_login_username_cookie;
                :P9999_REMEMBER := case when :P9999_USERNAME is not null then 'Y' end;
                ```
        }
        execution {
            sequence: 10
            point: beforeHeader
        }
        advanced {
            executionMappingIdentifier: 10417085364599452
        }
    )

    process login (
        name: Login
        type: invokeApi
        execution {
            sequence: 20
        }
        advanced {
            executionMappingIdentifier: 10413717512599450
        }

        parameter (
            name: p_username
            value {
                type: item
                item: P9999_USERNAME
            }
            advanced {
                displaySequence: 1
            }
        )

        parameter (
            name: p_password
            value {
                type: item
                item: P9999_PASSWORD
            }
            advanced {
                displaySequence: 2
            }
        )

        parameter (
            name: p_set_persistent_auth
            parameter {
                dataType: boolean
                hasDefault: true
            }
            value {
                type: apiDefault
            }
            advanced {
                displaySequence: 3
            }
        )

    )

    process set-username-cookie (
        name: Set Username Cookie
        type: invokeApi
        execution {
            sequence: 10
        }
        advanced {
            executionMappingIdentifier: 10415655862599452
        }

        parameter (
            name: p_username
            value {
                type: expression
                plsqlExpression: lower( :P9999_USERNAME )
            }
            advanced {
                displaySequence: 1
            }
        )

        parameter (
            name: p_consent
            parameter {
                dataType: boolean
            }
            value {
                type: item
                item: P9999_REMEMBER
            }
            advanced {
                displaySequence: 2
            }
        )

    )

)
```
