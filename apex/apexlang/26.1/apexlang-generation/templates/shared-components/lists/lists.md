---
templateId: lists
componentType: lists
version: 1.0
imports:
  - list-entries.md
---

# Purpose

The list component is used to define a named APEX list (for example, Navigation Menu or Navigation Bar). It is composed of two parts: the list itself and one or more list entries.

---

# Generation Rules (MANDATORY)

1. Create the name and displayName
2. All updates should be made to the lists.apx file found under an application's /shared-components directory

---

# Variable Contract

## Required Variables

- name
  - Type: text
  - The list name; all lowercase, no spaces

- displayName
    - Friendly name for the list

- {{listEntries}}
    - This will be a list of entries that make up the list
    - rules defined in list-entries.md

---

# Conditional Rendering Rules

None

---

# Output Template
```
list {{name}} (
    name: {{displayName}}

{{listEntries}}

)
```
