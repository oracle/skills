---
name: apex
description: Oracle APEX skills for Oracle APEX application development.
---

# APEXLang Skills

This domain contains Oracle APEX skills for Oracle APEX application development.

## How to Use This Domain

1. Start with [APEXLang version router](apexlang-router/SKILL.md) and route to the matching APEX version.
2. Read only the specific file or category you need.

## Skill Directory Structure

```text
apex/
├── SKILL.md
├── apexlang-router/
├── apexlang-compile/                           # shared; no release suffix
├── apexlang-deploy/                            # shared; no release suffix
├── apexlang-MAJOR-MINOR-inventory/             # one per supported release
└── apexlang-MAJOR-MINOR-example-applications/  # when matching assets exist
```

In the tree, `MAJOR-MINOR` is a placeholder for the APEX release numbers joined by a hyphen; APEX 26.1 uses `apexlang-26-1-inventory`. The router selects release-specific skills, while compile and deploy have no version suffix and are shared across releases.

## Key Starting Points

- `apex/apexlang-router/SKILL.md`
- `apex/apexlang-compile/SKILL.md`
- `apex/apexlang-deploy/SKILL.md`
- `apex/apexlang-26-1-inventory/SKILL.md`
- `apex/apexlang-26-1-example-applications/SKILL.md`
- `apex/apexlang-26-2-inventory/SKILL.md`
- `apex/apexlang-26-2-example-applications/SKILL.md`