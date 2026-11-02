---
templateId: ai-agents.common
componentType: aiAgents
version: 1.0
imports:
  - ai-agents.system-prompt.md
  - ai-agents.ai-tools.md

description: Canonical contract and guardrails for AI Agents.
---

# Purpose

Standard AI Agent contract; required as a parent container for all AI tools.

AI agents are containers that include a system prompt and a collection of AI tools. Each AI tool performs one discrete function; details can be found in `ai-agents.ai-tools.md`. The system prompt acts as the rule set that guides when each tool should run.

---

# Generation Rules (MANDATORY)

1. Put business rules for the AI agent in `genAI.systemPrompt`.  Try to avoid using PL/SQL where possible.
2. The format of `genAI.systemPrompt` is defined in `ai-agents.system-prompt.md`; use that as the reference when creating or modifying system prompts.
3. Place new AI Agents in `applications/<app>/shared-components/ai-agents/{{agentName}}.apx`.
4. Add tool definitions in the `{{tools}}` section one tool at a time.
5. Use `ai-agents.ai-tools.md` to determine which tool template fits each requirement.
6. Keep `genAI.systemPrompt` compact. APEX stores the imported prompt in `WWV_FLOW_AI_AGENTS.SYSTEM_PROMPT` with a 4000 character limit; draft to 3800 characters or fewer so indentation/encoding does not push runtime import over the limit.
7. Keep the output deterministic and use only documented blocks and attributes.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| agentName | yes | string | Static ID of the agent and target filename stem; lower case, no spaces, use `-` when separators are needed. |
| agentFriendlyName | yes | string | Friendly execution name rendered in `name:`. |
| genAI.systemPrompt | yes | string | The system prompt that drives the agent; keep <= 3800 characters in generated artifacts and never exceed the APEX 4000 character runtime limit. |
| genAI.welcomeMessage | no | string | Optional welcome message displayed in the chat; should be HTML. |
| responseFormat.jsonSchema | no | string | JSON schema used only when the agent must respond with `jsonObject`. |
| comments.comments | optional | string | Descriptive notes for maintainers. |

---

# Conditional Rendering Rules

- Only render `welcomeMessage` when a value exists.
- Only render `responseFormat {}` when the agent must return JSON.
- Include `comments` when descriptive text exists; omit otherwise.
- All other sections should always be rendered.

---

# Output Template — Full
```
aiAgent {{agentName}} (
    name: {{agentFriendlyName}}
    genAI {
        systemPrompt:
            ```
            {{genAI.systemPrompt}}
            ```
        {{welcomeMessageBlock}}
    }
    {{responseFormatBlock}}
    {{commentsBlock}}

    {{tools}}

)
```

---

# Guardrails Reminder

- If referring to an APEX variable, use the `&ITEM.` syntax in the system prompt.
