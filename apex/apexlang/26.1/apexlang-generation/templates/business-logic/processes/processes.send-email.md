---
templateId: processes.send-email
componentType: process
version: 1.0
imports:
  - processes._common
description: Declarative email process using APEX Mail infrastructure.
---

# Purpose

Send transactional emails by referencing shared templates defined in `shared-components/email-templates.example.md`.

---

# Generation Rules (MANDATORY)

1. Create or update the referenced email template in `shared-components/email-templates.example.md` before generating any `sendEMail` process.
2. `emailTemplate.emailTemplate` MUST reference an existing email template static ID from `shared-components/email-templates.example.md`.
3. Triggered or invoked email flows MUST use the `emailTemplate` block; inline `emailContent` is not a valid output path.
4. Preserve the template reference exactly as defined in `email-templates.apx`; do not guess, transform, or normalize the static ID.
5. Prefer native APEX email delivery for all outbound email features: generate shared templates in `shared-components/email-templates.example.md` and send them with native `sendEMail` processes or actions.
6. Use PL/SQL only to prepare or derive placeholder values when needed; do not generate handcrafted HTML email bodies in PL/SQL for standard transactional emails.
7. Do not use `APEX_MAIL.SEND` as the default implementation path when a native `sendEMail` process or action can satisfy the requirement. Use `APEX_MAIL.SEND` only when the user explicitly requests a non-native fallback or when a documented native limitation blocks the feature.
8. When placeholder values depend on user-entered page items or values generated during submit, populate those placeholders in an `afterSubmit` process, not in `beforeHeader`.
9. If the email depends on values created by form processing, run the placeholder-preparation process in `afterSubmit` after the create/update process and before the native `sendEMail` process.
10. Reserve `beforeHeader` execution for reset/default logic only; do not use `beforeHeader` to prepare transactional email placeholder values derived from the current submit.

---

# Output Template – Full
```
process {{processStaticId}} (
    name: {{name}}
    type: sendEMail
    emailHeader {
        to: {{emailHeader.to}}
        cc: {{emailHeader.cc}}
        bcc: {{emailHeader.bcc}}
    }
    emailTemplate {
        emailTemplate: @{{emailTemplate.emailTemplate}}
        placeholderValues: {{emailTemplate.placeholderValues}}
    }
    emailDispatchMode {
        sendImmediately: {{emailDispatchMode.sendImmediately}}
    }
    execution {
        sequence: {{execution.sequence}}
    }
    successMessage {
        successMessage: {{successMessage.successMessage}}
    }
    error {
        errorMessage: {{error.errorMessage}}
    }
    serverSideCondition {
        whenButtonPressed: @{{serverSideCondition.button}}
    }
)
```

---

# Conditional Rendering Rules

- `emailTemplate` is required for triggered email flows; do not emit `emailContent`.
- Omit `cc` and `bcc` when not provided.
- Validate attachment queries when using `emailAttachments` (omit when unnecessary).
- Omit `emailDispatchMode`, `successMessage`, `error`, and `serverSideCondition` when not needed.
- Use `serverSideCondition` to gate sending to specific buttons if needed.
