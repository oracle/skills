---
templateId: validations.index
component: validation
  - validations.common
version: 1.0
description: Base items and references for validation scenarios.
---

## Purpose
Use as the entry point for validation templates; sets shared page items and references scenario templates.

## Native-First Decision Rules
- For validation prompts, prefer declarative/native validation templates before PL/SQL templates.
- Use `validations.item.md` for required/no-space/simple declarative rules on page items and interactive grid columns, including `itemIsAValidDate` and `columnIsAValidDate`.
- Use `validations.expression.md` for status gates and expression-based checks.
- Use `validations.sql.md` for duplicate/existence checks.
- Use `validations.function-body.md` or `validations.plsql-error.md` only when no native/declarative option can represent the requirement.
- Never model a validation request as a page process.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| (none) | | | This index declares no dynamic variables; see scenario templates. |

## Template
```apexlang
/*
  Validation Templates Index
  Multi-file breakdown to mirror authorization structure.
  Common variables: @/business-logic/validations/validations._common.md
*/

// Base items shared across scenarios
pageItem P1_EMPLOYEE_ID (
    type: textField
)

pageItem P1_NEW (
    type: textField
)

pageItem P1_DISPLAY (
    type: textField
)

pageItem P1_DATE (
    type: datePicker
)

region task-row-editor (
    type: interactiveGrid
)

// Scenario templates
// - @/business-logic/validations/validations.expression.md
// - @/business-logic/validations/validations.function-body.md
// - @/business-logic/validations/validations.item.md
// - @/business-logic/validations/validations.sql.md
// - @/business-logic/validations/validations.plsql-error.md
```
