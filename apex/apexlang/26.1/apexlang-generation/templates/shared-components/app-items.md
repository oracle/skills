---
templateId: app-items
componentType: app-items
version: 1.0
---

# Purpose

The app items component defines application-level or global application items used across pages and shared logic.

---

# Generation Rules (MANDATORY)

1. Create the app item id.
2. Use only supported security attributes from this template.
3. All updates should be made to the app-items.apx file found under an application's /shared-components directory.

---

# Variable Contract

## Required Variables

- appItem
  - Type: text
  - The app item id; uppercase with underscores, no spaces

## Optional Variables

- scope
  - Scope of the app item
  - Valid values:
    - global
  - If omitted, item is application-scoped

- security.sessionStateProtection
  - Session state protection mode
  - Valid values:
    - checksumRequiredAppLevel
    - checksumRequiredSessionLevel
    - checksumRequiredUserLevel
    - unrestricted

- security.escapeSpecialChars
  - Boolean flag for output escaping
  - Use only when explicitly required (for example, unrestricted no-escape variants)

---

# Conditional Rendering Rules

- If `scope` is not provided, omit `scope`.
- If `security.sessionStateProtection` is not provided, omit the entire `security {}` block unless another security attribute is present.
- If `security.escapeSpecialChars` is not provided, omit `escapeSpecialChars`.
- If `security.escapeSpecialChars` is provided, render it inside `security {}`.

---

# Output Template - Minimal
```
appItem {{appItem}} (
)
```

---

# Output Template - Full
```
appItem {{appItem}} (
    scope: {{scope}}
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
        escapeSpecialChars: {{security.escapeSpecialChars}}
    }
)
```
