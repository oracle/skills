---
templateId: workspace-components.credentials.credentials-for-open-ai.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Credentials For Open Ai Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
webCredential credentials-for-open-ai (
    name: Credentials for open ai
    type: httpHeader
    authentication {
        credentialName: Authorization
    }
)
```
