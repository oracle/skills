---
name: apexlang-26-1
description: APEXlang skills for Oracle APEX 26.1. Generate, compile, deploy, and author APEX 26.1 applications, with the APEX 26.1 component inventory and example applications.
---

# APEXlang Skills for APEX 26.1

Every skill in this directory targets Oracle APEX 26.1. Do not mix them with skills or example applications from another version directory.

## Skills

| Skill | Use it to |
| --- | --- |
| `apexlang-generation/` | Generate or change APEX applications end to end with local context discovery, generation contracts, templates, grammar-backed checks, and gated validation and import (`node tools/apexctl.mjs`). |
| `apexlang-compile/` | Validate an application directory with SQLcl `apex validate` (`scripts/validate-apex-app.sh`). |
| `apexlang-deploy/` | Import an application directory into a database with SQLcl `apex import` (`scripts/deploy-apex-app.sh`). |
| `apexlang-inventory/` | Look up APEX 26.1 components, properties, APEXlang syntax, and application file layout. |
| `apexlang-example-applications/` | Read complete APEX 26.1 example applications as composition references. |

## Choosing a Skill

- **Guided generation or change of an app:** start with `apexlang-generation/SKILL.md`. It has its own check-only validation and an explicit import approval step. Use those instead of calling `apexlang-compile` or `apexlang-deploy` separately.
- **Writing or editing `.apx` files directly:** use `apexlang-inventory` for component syntax and `apexlang-example-applications` for working patterns. Then validate with `apexlang-compile` and import with `apexlang-deploy`.
- **Validating or importing an existing application directory only:** use `apexlang-compile` or `apexlang-deploy`.
