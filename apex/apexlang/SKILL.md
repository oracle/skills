---
name: apexlang
description: Versioned Oracle APEXlang skills for generating, compiling, deploying, and authoring Oracle APEX applications. Routes to the APEXlang skill set for APEX 26.1 or APEX 26.2.
---

# APEXlang Skills: Version Router

APEXlang skills are versioned by Oracle APEX release. Route to the version that matches the target application, then load only that version's skills. Do not mix skills or example applications from different versions.

## Supported Versions

| APEX version | Start with | Skills |
| --- | --- | --- |
| 26.1 | `26.1/SKILL.md` | `apexlang-generation`, `apexlang-compile`, `apexlang-deploy`, `apexlang-inventory`, `apexlang-example-applications` |
| 26.2 | `26.2/SKILL.md` | `apexlang-compile`, `apexlang-deploy`, `apexlang-inventory`, `apexlang-example-applications` |

## Choosing a Version

- APEX 26.1: go to `26.1/SKILL.md`.
- APEX 26.2: go to `26.2/SKILL.md`.
- Read the version from `mmdVersion` in the application's `.apex/apexlang.json`, or from the target APEX instance. Match on major.minor: `26.1.x` is 26.1 and `26.2.x` is 26.2.
- If the version is unknown, use 26.1.
- If the application targets a version not listed here, tell the user which versions are supported before proceeding.

## Directory Structure

```text
apexlang/
├── SKILL.md
├── 26.1/
│   ├── SKILL.md
│   ├── apexlang-generation/
│   ├── apexlang-compile/
│   ├── apexlang-deploy/
│   ├── apexlang-inventory/
│   └── apexlang-example-applications/
└── 26.2/
    ├── SKILL.md
    ├── apexlang-compile/
    ├── apexlang-deploy/
    ├── apexlang-inventory/
    └── apexlang-example-applications/
```
