---
name: apexlang-compile
description: Provides access to the APEXLang compiler to build and validate an application from a given file tree.
---

Use `scripts/validate-apex-app.sh <app-directory>` to validate an APEX application directory. Requires the environmental variable `SQLCL_BIN` to be set to the absolute path of the SQLcl executable. The helper starts SQLcl with `/nolog` and runs `apex validate` for the supplied directory.
