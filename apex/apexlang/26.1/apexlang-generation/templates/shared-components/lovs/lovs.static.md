---
templateId: lovs.static
componentType: lovs
version: 1.0
---

# Purpose

The static LOV component defines a list of static values for an Oracle APEX List of Values. It contains one entry per selectable value and is used when `source.location` is `staticValues`.

---

# Generation Rules (MANDATORY)

1. Create the lov id and display name.
2. Set `source.location` to `staticValues`.
3. All updates should be made to the lovs.apx file found under an application's /shared-components directory.

---

# Variable Contract

## Required Variables

- lov
  - Type: text
  - The lov id; all lowercase, no spaces

- lov.name
    - Friendly name for the LOV
    - Must be in all UPPER_CASE with no spaces

- entry
    - Type: text
    - Entry id; all lowercase, no spaces

- entry.sequence
    - Numeric sequence used to order entries

- entry.display
    - Display value shown to users

- entry.return
    - Return value stored/submitted

---

# Conditional Rendering Rules

- `entry` blocks may repeat as needed.
- Sort entries by `entry.sequence` when a specific order is required.

---

# Output Template
```
lov {{lov}} (
    name: {{lov.name}}
    source {
        location: staticValues
    }

    entry {{entry}} (
        sequence: {{entry.sequence}}
        display: {{entry.display}}
        return: {{entry.return}}
    )

)
```
