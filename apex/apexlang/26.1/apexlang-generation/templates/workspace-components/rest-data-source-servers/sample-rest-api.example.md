---
templateId: workspace-components.rest-data-source-servers.sample-rest-api.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Sample Rest Api Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
restDataSourceServer sample-rest-api (
    name: sample-rest-api
    endpointUrl {
        url: "https://xyz.com/"
    }
)
```
