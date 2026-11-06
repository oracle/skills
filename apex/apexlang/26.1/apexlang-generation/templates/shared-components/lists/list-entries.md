---
templateId: list-entries
componentType: list-entries
version: 1.0
---

# Purpose

The list entries component is embedded inside a list component. It contains one entry per navigation action, page, separator, or utility link.

---

# Generation Rules (MANDATORY)

1. Create the entry id and label
2. All updates should be made to the lists.apx file found under an application's /shared-components directory
3. For navigation-menu entries that emit `isCurrent { type: pages }`, set `entry.isCurrent.pages` to exactly one page number.
4. The single `entry.isCurrent.pages` value must match the entry's direct `link.target.page`.
5. Do not aggregate parent, child, sibling, or related pages into one comma-separated `entry.isCurrent.pages` value when those pages have separate navigation entries.

---

# Variable Contract

## Required Variables

- entry
  - Type: text
  - The entry id; all lowercase, no spaces
  - Used when referencing a parent entry

- entry.label
    - Friendly label shown to users

- entry.layout.sequence
    - Sequence used to order the entry

---

# Conditional Rendering Rules

- entry.icon.imageIconCssClasses
    - If provided, render an `icon {}` block

- entry.layout.parentEntry
    - Parent entry id, referenced as `@entry`
    - If provided, include `parentEntry` in `layout {}`

- entry.isCurrent.type, entry.isCurrent.pages
    - If both are provided, render an `isCurrent {}` block
    - `entry.isCurrent.pages` must be a single page id string for the current entry only
    - Do not emit comma-separated values such as `40,41`

- entry.link.target
    - If provided, render a `link {}` block

- entry.serverSideCondition.type
    - If provided, render a `serverSideCondition {}` block

- entry.userDefinedAttributes
    - If provided, render a `userDefinedAttributes {}` block with numeric keys

---

# Output Template - Minimal
```
    entry {{entry}} (
        label: {{entry.label}}
        layout {
            sequence: {{entry.layout.sequence}}
        }
        link {
            target: {{entry.link.target}}
        }
    )
```

---

# Output Template - Full
```
    entry {{entry}} (
        label: {{entry.label}}
        icon {
            imageIconCssClasses: {{entry.icon.imageIconCssClasses}}
        }
        layout {
            sequence: {{entry.layout.sequence}}
            parentEntry: @{{entry.layout.parentEntry}}
        }
        isCurrent {
            type: {{entry.isCurrent.type}}
            pages: {{entry.isCurrent.pages}}
        }
        link {
            target: {{entry.link.target}}
        }
        serverSideCondition {
            type: {{entry.serverSideCondition.type}}
        }
        userDefinedAttributes {
            1: {{entry.userDefinedAttributes.1}}
            2: {{entry.userDefinedAttributes.2}}
        }
    )
```

---

# Navigation Current-State Guardrails

- For `navigation-menu` entries, `entry.isCurrent.pages` must contain only the page id linked by that entry.
- If page 40 and page 41 each have their own navigation entries, emit:
  - page 40 entry -> `isCurrent { type: pages, pages: 40 }`
  - page 41 entry -> `isCurrent { type: pages, pages: 41 }`
- Do not use a parent entry to mark a child page current through `pages: 40,41` style aggregation.
