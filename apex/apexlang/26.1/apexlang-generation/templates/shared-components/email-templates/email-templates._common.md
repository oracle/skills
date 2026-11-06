---
contractId: email-templates.common
componentType: email-templates
version: 1.0
---

# Purpose

Standardize per-template variable contracts, file-level packaging rules, guardrails, and output structure for shared email templates.

# Generation Rules (MANDATORY)

1. Output only valid apexlang DSL.
2. Do not output markdown.
3. Do not explain the output.
4. Omit optional blocks entirely if their variables are not provided.
5. Preserve placeholder tokens verbatim.
6. Keep HTML and plain text semantics aligned.
7. Template Name should not contain special characters. Only the characters a-Z, 0-9 and spaces are allowed.
8. Emit email templates into the single shared-components artifact named `email-templates.apx`.
9. `email-templates.apx` may contain one or more consecutive top-level `emailTemplate ... )` definitions.
10. Apply this variable contract to each individual `emailTemplate` block in `email-templates.apx`.
11. When any feature triggers or invokes email, create or update the referenced email template in `email-templates.apx` before generating the send-email process or action.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| name | yes | string | DSL identifier used in `emailTemplate {{name}}`; must obey the template-name guard rail and contain only letters, digits, and spaces. |
| displayName | yes | string | Human-readable template name rendered as `name: {{displayName}}`. |
| emailSubject | yes | string | Email subject line; preserve placeholder tokens exactly as provided. |
| htmlFormat.header | no | string | Optional HTML header content rendered before the body. |
| htmlFormat.body | yes | html | Main HTML content rendered in an `html` fenced block; preserve placeholder tokens verbatim and keep semantics aligned with `plainTextFormat.content`. |
| htmlFormat.footer | no | string | Optional HTML footer content rendered after the body. |
| plainTextFormat.content | yes | text | Plain text equivalent rendered in a fenced block; preserve placeholder tokens verbatim and keep semantics aligned with `htmlFormat.body`. |
| advanced.versionNumber | no | number | Optional explicit version metadata; render as `versionNumber` when provided. |

# Conditional Rendering Rules

- Omit `htmlFormat.header` if `htmlFormat.header` is not provided.
- Omit `htmlFormat.footer` if `htmlFormat.footer` is not provided.
- Omit the entire `advanced {}` block if `advanced.versionNumber` is not provided.

# Output Template
```
emailTemplate {{name}} (
    name: {{displayName}}
    emailSubject: {{emailSubject}}
    htmlFormat {
        header: {{htmlFormat.header}}
        body: 
            ```html
            {{htmlFormat.body}}
            ```
        footer: {{htmlFormat.footer}}
    }
    plainTextFormat {
        content: 
            ```html
            {{plainTextFormat.content}}
            ```
    }
    advanced {
        versionNumber: {{advanced.versionNumber}}
    }
)
```

# Mandatory Rendering Rules

- Generate or update the shared-components artifact file named `email-templates.apx`.
- Repeated application of this template produces additional sibling `emailTemplate` definitions in the same `email-templates.apx` file.
- Do not split email templates into per-template `.apx` files.
- Treat this contract as a prerequisite for any triggered or invoked email workflow.
- Generate send-email processes or actions only after the referenced template has been added to `email-templates.apx`.
