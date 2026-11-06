---
templateId: build-options
componentType: build-options
version: 1.0
---

# Purpose

This tempalte is used to create build options.

---

# Generation Rules (MANDATORY)

None

---

# Variable Contract

## Required Variables

- name
    - the name of the build option. This is required and must be unique across all build options.
    - lower case and using - vs. spaces

- displayName
    - the display name of the build option. This is required and is used for display purposes in the UI.
    - use spaces where needed as well as capitalization

---

## Optional Variables

- status.status
    - the status of the build option. When set to include, return `include`; else omit this attribute.
    - Default is to omit this attribute.


- status.defaultOnExport
    - sets the export status to the current value of the build option.
    - default is to omit this attribute; can be either `export` or `import`

- status.onUpgradeKeepStatus
    - `true` if the status of the build option should be kept during upgrade, `false` otherwise. Default is `false`.

- comments.comments
    - comments to be added to the build option. While not required, always try to create meaningful comments.

---

# Conditional Rendering Rules

- If `status.status` is not provided, omit the entire `status.status {}` block.
- If `status.defaultOnExport` is not provided, omit the entire `status.defaultOnExport {}` block.
- If `comments.comments` is not provided, omit the entire `comments {}` block.

---

# Output Template
```
buildOption {{name}}
    name: {{displayName}}
    status {
        status: {{status.status}}
        onUpgradeKeepStatus: {{status.onUpgradeKeepStatus}}
        defaultOnExport: {{status.defaultOnExport}}
    }
    comments {
        comments: {{comments.comments}}
    }
)
```
