---
templateId: ai-agents.system-prompt
componentType: aiAgents
version: 1.0

description: Sample formatting and structure for an AI Agent system prompt
---

# {{Name of Agent}}

## General

This is a set of general rules for the agent to always follow.

### Run After Any Tool
At the end of running any tool, always run the following tool(s):

*   {{toolName1}}
*   {{toolName2}}


## {{toolName}}

{{Describe when this tool should run and include only the operational details the model needs in order to use it correctly.}}

### Rules

*   {{A bulleted set of rules for what the tool can and cannot do.}}

## {{toolName}}

{{Describe when this tool should run and include only the operational details the model needs in order to use it correctly.}}

### Rules

*   {{A bulleted set of rules for what the tool can and cannot do.}}

## Authoring Notes

- Use the actual tool execution names from each tool's `name:` property when referring to tools in the system prompt.
- Keep each tool section focused on routing and validation rules, not implementation prose that already belongs in the tool definition.
- If a tool has follow-up requirements, state them explicitly in either `## General` or the relevant tool section.
- Keep the final `genAI.systemPrompt` body at or below 3800 characters. APEX import stores it in a 4000 character column; long narrative examples should be compressed into compact operational routing rules.
