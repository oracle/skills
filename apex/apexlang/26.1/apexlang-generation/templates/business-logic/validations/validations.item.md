---
templateId: validations.item
componentType: validation
version: 1.0
imports:
  - validations._common
description: Item-level validation catalog.
---

# Purpose

Use for declarative validations targeting either page items or interactive grid columns.

---

# Output Template – Minimal
```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        editableRegion: @{{validation.editableRegion}}
        type: {{validation.type}}
        item: {{validation.item}}
        column: {{validation.column}}
        value: {{validation.value}}
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedItem: @{{error.associatedItem}}
        associatedColumn: {{error.associatedColumn}}
    }
)
```

---

# Conditional Rendering Rules

- Supply `value` for comparisons (`item=value`, `item!=value`, etc.).
- Supply `list` for list membership conditions (`itemIsInColonDelimitedList`, `itemIsNotInColonDelimitedList`).
- Remove `value` for types that only require the item (e.g., `itemIsNotNull`, `itemIsAValidDate`).
- When `editableRegion` is present, use the `columnIs...` declarative family and render `column` instead of `item`.
- When `editableRegion` is present, the `error` block must use `associatedColumn` instead of `associatedItem`.
- `itemIsAValidDate` requires `item` and must not include `value`.
- `columnIsAValidDate` and `columnIsAValidTimestamp` require `editableRegion` plus `column` and must not include `value`.
- Use `serverSideCondition` to limit validation to specific buttons when necessary.

---

# Explicit Type Examples

## Item Only
- `itemIsNotNull`
- `itemIsNotNullOrZero`
- `itemIsNotZero`
- `itemIsNumeric`
- `itemIsAlphanumeric`
- `itemContainsNoSpaces`
- `itemIsAValidDate`
- `itemIsAValidTimestamp`

```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        type: itemIsNotNullOrZero
        item: {{validation.item}}
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedItem: @{{error.associatedItem}}
    }
)
```

## Interactive Grid Column Only
- `columnIsNotNull`
- `columnIsNotNullOrZero`
- `columnIsNotZero`
- `columnIsNumeric`
- `columnIsAlphanumeric`
- `columnContainsNoSpaces`
- `columnIsAValidDate`
- `columnIsAValidTimestamp`

```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        editableRegion: @{{validation.editableRegion}}
        type: columnIsNotNull
        column: {{validation.column}}
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedColumn: {{error.associatedColumn}}
    }
)
```

## Item + Value
- `item=Value`
- `item!=Value`
- `itemIsContainedInValue`
- `itemIsNotContainedInValue`
- `itemContainsAtLeastOneOfCharsInValue`
- `itemContainsOnlyCharsInValue`
- `itemContainsNoneOfCharsInValue`

```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        type: item!=Value
        item: {{validation.item}}
        value: {{validation.value}}
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedItem: @{{error.associatedItem}}
    }
)
```

## Item + Regexp
- `itemMatchesRegexp`

```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        type: itemMatchesRegexp
        item: {{validation.item}}
        regexp: {{validation.regexp}}
    }
    error {
        errorMessage: {{error.errorMessage}}
        associatedItem: @{{error.associatedItem}}
    }
)
```

## Interactive Grid Example
```
validation {{validationStaticId}} (
    name: {{validationName}}
    execution {
        sequence: {{execution.sequence}}
    }
    validation {
        editableRegion: @task-row-editor
        type: columnIsNotNull
        column: TASK_TYPE
    }
    error {
        errorMessage: Task type must have some value
        associatedColumn: TASK_TYPE
    }
)
```
