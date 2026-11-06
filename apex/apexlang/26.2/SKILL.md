---
name: apexlang-26-2
description: APEXlang skills for Oracle APEX 26.2. Compile, deploy, and author APEX 26.2 applications, with the APEX 26.2 component inventory and example applications.
---

# APEXlang Skills for APEX 26.2

Every skill in this directory targets Oracle APEX 26.2. Do not mix them with skills or example applications from another version directory.

## Skills

| Skill | Use it to |
| --- | --- |
| `apexlang-compile/` | Validate an application directory with SQLcl `apex validate` (`scripts/validate-apex-app.sh`). |
| `apexlang-deploy/` | Import an application directory into a database with SQLcl `apex import` (`scripts/deploy-apex-app.sh`). |
| `apexlang-inventory/` | Look up APEX 26.2 components, properties, APEXlang syntax, and application file layout. |
| `apexlang-example-applications/` | Read complete APEX 26.2 example applications as composition references. |

## Choosing a Skill

- **Writing or editing `.apx` files:** use `apexlang-inventory` for component syntax and `apexlang-example-applications` for working patterns. Then validate with `apexlang-compile` and import with `apexlang-deploy`.
- **Validating or importing an existing application directory only:** use `apexlang-compile` or `apexlang-deploy`.
