---
templateId: breadcrumbs
componentType: breadcrumbs
version: 1.0
imports:
  - breadcrumb-entries.md
---

# Purpose

The breadcrumb component is used to provide page-level navigation for users.  It is composed of two parts: the breadcrumb itself (as defined in this file) and

---

# Generation Rules (MANDATORY)

1. Create the name and displayName
2. All updates should be made to the breadcrumbs.apx file found under an application's /shared-components directory

---

# Variable Contract

## Required Variables

- name
  - Type: text
  - all lowercase, no spaces - replace with dashses

- displayName
    - Friendly name for the breadcrumb

- {{breadcrumbEntries}}
    - This will be a list of entries that make up the breadcrumb
    - rules defined in breadcrumb-entries.md

---

# Conditional Rendering Rules

None

---

# Output Template
```
breadcrumb {{name}} (
    name: {{displayName}}

{{breadcrumbEntries}}

)

