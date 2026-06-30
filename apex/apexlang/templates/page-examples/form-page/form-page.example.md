---
templateId: page-examples.form-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Form Page Example

## Purpose

Snippet class: `metavariable_template`.

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract. Bind every `{{...}}` variable from schema evidence, user input, or compiler-backed truth before emitting APEXlang.

## Example

```apexlang
page 80 (
    name: Form
    alias: FORM
    title: Form
    appearance {
        pageMode: modalDialog
        dialogTemplate: @/drawer
        templateOptions: [
            #DEFAULT#
            js-dialog-class-t-Drawer--pullOutEnd
        ]
    }
    dialog {
        chained: false
    }
    security {
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }
    help {
        helpText: Use this drawer form to create or update one sample record. Complete the required fields, review optional values before saving, and use the action buttons to create, apply changes, or delete the current row.
    }

    region buttons (
        name: Buttons
        type: staticContent
        layout {
            sequence: 20
            slot: REGION_POSITION_03
        }
        appearance {
            template: @/buttons-container
            templateOptions: #DEFAULT#
        }
        settings {
            outputAs: text
        }
    )

    region form (
        name: Form
        type: form
        source {
            location: localDatabase
            tableName: SAMPLE
        }
        layout {
            sequence: 10
            slot: contentBody
        }
        appearance {
            template: @/blank-with-attributes
            templateOptions: #DEFAULT#
        }
        edit {
            enabled: true
        }
    )

    pageItem P80_ID (
        type: hidden
        layout {
            sequence: 10
            region: @form
            slot: regionBody
        }
        source {
            formRegion: @form
            column: ID
            dataType: number
            queryOnly: true
            primaryKey: true
        }
        security {
            sessionStateProtection: checksumRequiredSessionLevel
        }
    )

    pageItem P80_SUCCESS_MESSAGE (
        type: hidden
        layout {
            sequence: 11
            region: @form
            slot: regionBody
        }
    )

    pageItem P80_ITEM_CHECKBOX (
        type: checkboxGroup
        label {
            label: Item Checkbox
            alignment: left
        }
        settings {
            noOfCols: 3
        }
        lov {
            type: staticValues
            staticValues: STATIC:Yes;Y,No;N
            displayExtraValues: false
        }
        layout {
            sequence: 100
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
        }
        source {
            formRegion: @form
            column: ITEM_CHECKBOX
            dataType: varchar2
        }
        help {
            inlineHelpText: Choose one option
            helpText: Select the yes-or-no value that matches the current record. Leave it blank only when the source row has not been classified yet.
        }
    )

    pageItem {{items.lookupItemName}} (
        type: selectList
        label {
            label: Lookup Value
            alignment: left
        }
        lov {
            type: sqlQuery
            sqlQuery:
                ```sql
                select {{lookup.displayColumn}},
                       {{lookup.valueColumn}}
                  from {{lookup.table}}
                 order by {{lookup.displayColumn}}
                ```
            displayNullValue: false
        }
        layout {
            sequence: 110
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
        }
        help {
            helpText: Choose the lookup value used to derive the matching related selections.
        }
    )

    pageItem {{items.relatedRecordsItemName}} (
        type: checkboxGroup
        label {
            label: Related Records
            alignment: left
        }
        settings {
            noOfCols: 1
        }
        lov {
            type: sqlQuery
            sqlQuery:
                ```sql
                select {{related.displayColumn}},
                       {{related.pk}}
                  from {{related.table}}
                 order by {{related.displayColumn}}
                ```
            displayExtraValues: false
        }
        layout {
            sequence: 120
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
        }
        help {
            helpText: Select one or more related records. This item can be populated by a multi-value computation that returns one bound related-row key per checked record.
        }
    )

    computation {{computations.relatedRecordsStaticId}} (
        itemName: {{items.relatedRecordsItemName}}
        execution {
            sequence: 20
            point: afterSubmit
        }
        computation {
            type: sqlQueryMultipleValues
            sqlQuery:
                ```sql
                select {{related.pk}}
                  from {{related.table}}
                 where {{lookup.valueColumn}} = :{{items.lookupItemName}}
                ```
        }
    )

    pageItem P80_ITEM_DATEPICKER (
        type: datePicker
        label {
            label: Item Datepicker
            alignment: left
        }
        layout {
            sequence: 30
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            width: 32
        }
        validation {
            maxLength: 255
        }
        source {
            formRegion: @form
            column: ITEM_DATEPICKER
            dataType: date
        }
        help {
            inlineHelpText: Enter a calendar date
            helpText: Use the date picker to capture the relevant calendar date for this record in the application's default date format.
        }
    )

    pageItem P80_ITEM_DATEPICKER_TZ (
        type: datePicker
        label {
            label: Item Datepicker Tz
            alignment: left
        }
        layout {
            sequence: 40
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            width: 30
        }
        source {
            formRegion: @form
            column: ITEM_DATEPICKER_TZ
            dataType: timestamp
        }
    )

    pageItem P80_ITEM_NUMBER (
        type: numberField
        label {
            label: Item Number
            alignment: left
        }
        layout {
            sequence: 20
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            width: 32
        }
        validation {
            maxLength: 255
        }
        source {
            formRegion: @form
            column: ITEM_NUMBER
            dataType: number
        }
        help {
            inlineHelpText: Enter a numeric value
            helpText: Record the numeric value for this field using digits only. Apply the application's standard number formatting when reviewing the saved record.
        }
    )

    pageItem P80_ITEM_OPTIONAL (
        type: textField
        label {
            label: Item Optional
            alignment: left
        }
        layout {
            sequence: 110
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            width: 32
        }
        validation {
            maxLength: 100
        }
        source {
            formRegion: @form
            column: ITEM_OPTIONAL
            dataType: varchar2
        }
        help {
            inlineHelpText: Optional field
            helpText: Provide a value only when the source record includes additional optional detail that should be stored with the row.
        }
    )

    pageItem P80_ITEM_RADIO_GROUP (
        type: radioGroup
        label {
            label: Item Radio Group
            alignment: left
        }
        lov {
            type: staticValues
            staticValues: STATIC:One;1,Two;2,Three;3
            displayExtraValues: false
            displayNullValue: false
        }
        layout {
            sequence: 90
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
        }
        source {
            formRegion: @form
            column: ITEM_RADIO_GROUP
            dataType: number
        }
    )

    pageItem P80_ITEM_REQUIRED (
        type: textField
        label {
            label: Item Required
            alignment: left
        }
        layout {
            sequence: 120
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/required-floating
            templateOptions: #DEFAULT#
            width: 32
        }
        validation {
            maxLength: 100
        }
        source {
            formRegion: @form
            column: ITEM_REQUIRED
            dataType: varchar2
        }
        help {
            inlineHelpText: Required field
            helpText: Enter the required text value before saving. This field is expected to contain the primary user-facing value for the sample record.
        }
    )

    pageItem P80_ITEM_SELECT_LIST_DYNAMIC (
        type: selectList
        label {
            label: Item Select List Dynamic
            alignment: left
        }
        lov {
            type: sqlQuery
            sqlQuery:
                ```sql
                select
                  'One' as display_value
                 ,2 as return_value
                from
                  dual
                ```
        }
        layout {
            sequence: 80
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            height: 1
        }
        source {
            formRegion: @form
            column: ITEM_SELECT_LIST_DYNAMIC
            dataType: number
        }
    )

    pageItem P80_ITEM_SELECT_LIST_STATIC (
        type: selectList
        label {
            label: Item Select List Static
            alignment: left
        }
        lov {
            type: staticValues
            staticValues: STATIC:One;1,Two;2,Three;3
        }
        layout {
            sequence: 70
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            height: 1
        }
        source {
            formRegion: @form
            column: ITEM_SELECT_LIST_STATIC
            dataType: number
        }
    )

    pageItem P80_ITEM_TEXTAREA (
        type: textarea
        label {
            label: Item Textarea
            alignment: left
        }
        layout {
            sequence: 50
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            width: 60
            height: 4
        }
        validation {
            maxLength: 1000
        }
        source {
            formRegion: @form
            column: ITEM_TEXTAREA
            dataType: varchar2
        }
        help {
            inlineHelpText: Add supporting details
            helpText: Use this larger text area for supporting notes or longer descriptions that help explain the record beyond the short text fields.
        }
    )

    pageItem P80_ITEM_TEXTFIELD (
        type: textField
        label {
            label: Item Textfield
            alignment: left
        }
        layout {
            sequence: 60
            region: @form
            slot: regionBody
            alignment: left
        }
        appearance {
            template: @/optional-floating
            templateOptions: #DEFAULT#
            width: 32
        }
        validation {
            maxLength: 100
        }
        source {
            formRegion: @form
            column: ITEM_TEXTFIELD
            dataType: varchar2
        }
        help {
            inlineHelpText: Enter short text
            helpText: Enter the main short-text value for this field. Keep the wording concise so it displays cleanly in related report pages.
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
            action: definedByDynamicAction
        }
    )

    button create (
        buttonName: CREATE
        label: Create
        layout {
            sequence: 40
            region: @buttons
            slot: NEXT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            warnOnUnsavedChanges: doNotCheck
            databaseAction: insert
        }
        serverSideCondition {
            type: itemIsNull
            item: P80_ID
        }
    )

    button delete (
        buttonName: DELETE
        label: Delete
        layout {
            sequence: 20
            region: @buttons
            slot: DELETE
        }
        appearance {
            buttonTemplate: @/text
            templateOptions: #DEFAULT#
        }
        behavior {
            executeValidations: false
            warnOnUnsavedChanges: doNotCheck
            databaseAction: delete
            requiresConfirmation: true
        }
        confirmation {
            message: &APP_TEXT$DELETE_MSG!RAW.
            style: danger
        }
        serverSideCondition {
            type: itemIsNotNull
            item: P80_ID
        }
    )

    button apply-changes (
        buttonName: APPLY-CHANGES
        label: Apply Changes
        layout {
            sequence: 30
            region: @buttons
            slot: NEXT
        }
        appearance {
            buttonTemplate: @/text
            hot: true
            templateOptions: #DEFAULT#
        }
        behavior {
            warnOnUnsavedChanges: doNotCheck
            databaseAction: update
        }
        serverSideCondition {
            type: itemIsNotNull
            item: P80_ID
        }
    )

    dynamicAction cancel-dialog (
        name: Cancel Dialog
        execution {
            sequence: 10
        }
        when {
            event: click
            selectionType: button
            button: @cancel
        }

        action native-dialog-cancel (
            action: cancelDialog
            execution {
                sequence: 10
                event: @cancel-dialog
                fireOnInit: false
            }
        )

    )

    process close-dialog (
        name: Close Dialog
        type: closeDialog
        execution {
            sequence: 50
        }
        advanced {
            executionMappingIdentifier: 10613752882264475
        }
        serverSideCondition {
            type: requestIsContainedInValue
            value: CREATE,APPLY-CHANGES,DELETE
        }
    )

    process initialize-form-form (
        name: Initialize form Form
        type: formInitialization
        formRegion: @form
        execution {
            sequence: 10
            point: beforeHeader
        }
        advanced {
            executionMappingIdentifier: 10612977607264474
        }
    )

    process set-success-message-form (
        name: Set Success Message
        type: executeCode
        source {
            plsqlCode: 
                ```plsql
                :P80_SUCCESS_MESSAGE :=
                    case :REQUEST
                        when 'CREATE' then 'Form record was created successfully.'
                        when 'APPLY-CHANGES' then 'Form record was updated successfully.'
                        when 'DELETE' then 'Form record was deleted successfully.'
                        else null
                    end;
                ```
        }
        execution {
            sequence: 5
        }
        serverSideCondition {
            type: requestIsContainedInValue
            value: CREATE,APPLY-CHANGES,DELETE
        }
    )

    process process-form-form (
        name: Process form Form
        type: formAutoRowProcessing
        formRegion: @form
        execution {
            sequence: 10
        }
        successMessage {
            successMessage: &P80_SUCCESS_MESSAGE.
        }
        advanced {
            executionMappingIdentifier: 10613325568264475
        }
    )

)
```
