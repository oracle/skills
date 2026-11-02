---
templateId: workspace-components.generative-ai-services.open-ai.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Open Ai Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
genAIService open-ai (
    name: Open AI
    provider: openai
    endpointUrl {
        url: "https://api.openai.com/v1"
    }
    authentication {
        credentials: @credentials-for-open-ai
    }
    appBuilder {
        usedByAppBuilder: true
        defaultForNewApps: true
    }
    advanced {
        modelName: gpt-4.1
    }
)
```
