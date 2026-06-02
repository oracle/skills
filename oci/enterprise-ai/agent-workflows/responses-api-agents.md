# Responses API Agents in OCI Generative AI

## Overview

Use the OCI Responses API when the user wants an API-first way to build an enterprise agent with OCI-managed model execution, tools, retrieval, memory, and OpenAI-compatible request patterns.

## User Journey

1. Confirm the agent shape:
   - Simple model call.
   - Multi-turn assistant.
   - Tool-using workflow.
   - Retrieval-grounded workflow.
   - Hosted application or deployment.
2. Use the Responses API for API-first agents that do not need a separately hosted custom runtime.
3. Use hosted agentic applications and deployments when the user needs OCI-managed runtime hosting, container-based deployment, storage, networking, or identity configuration.
4. Select tools only after the task boundaries are clear.
5. Add governance, private access, and memory retention decisions before production.

## API Fit

The OCI Responses API is OpenAI-compatible, but it is still an OCI service:

- The base URL points to an OCI Generative AI regional endpoint.
- Authentication uses OCI Generative AI credentials or IAM-supported flows.
- Requests are processed through OCI Generative AI in OCI regions.
- Tool support is declared through the Responses API request for supported OpenAI-compatible tools.
- OCI Generative AI projects provide the project OCID and lifecycle settings for agent-related API calls.
- The OpenAI SDK can be used against the OCI OpenAI-compatible base URL, but authentication remains OCI API key or IAM based.

Use the documented regional base URL pattern:

```text
https://inference.generativeai.${region}.oci.oraclecloud.com/openai/v1
```

Verify the region, model, and supported tools before generating client code.

## SDK and Authentication Choices

For the fastest prototype, use the official OpenAI SDK with:

- `base_url` set to the OCI regional OpenAI-compatible endpoint.
- `project` set to the OCI Generative AI project OCID.
- An OCI Generative AI API key.

For production or OCI-managed runtimes, prefer OCI IAM-based authentication through the `oci-genai-auth` helpers:

- `OciSessionAuth` for local development with an OCI CLI profile.
- `OciUserPrincipalAuth` for user principal signing.
- `OciInstancePrincipalAuth` for instance-based workloads.
- `OciResourcePrincipalAuth` for OCI-managed services.

When using IAM auth with the OpenAI client, set a placeholder `api_key` and provide the authenticated HTTP client. Do not put API keys, OAuth tokens, or IAM material in prompts, tool descriptions, uploaded files, vector stores, or memory.

## Responses API Contract

Use `/responses` as the primary OpenAI-compatible endpoint for new agentic workloads. The Responses API supports:

- Single-step prompts and multi-step agent workflows.
- Text and image inputs with text outputs.
- Structured outputs.
- Streaming.
- OCI-managed conversation state through the Conversations API.
- Tool declarations in the request for File Search, Code Interpreter, Function Calling, and MCP Calling.
- Foundational APIs for Files, Vector Stores, Containers, and Container Files when the workflow needs direct resource control.

Before generating code, require:

- A supported model in a supported region.
- A project OCID.
- The OCI OpenAI-compatible base URL for the target region.
- An authentication choice: OCI Generative AI API key for testing or OCI IAM-based authentication for production and OCI-managed environments.

Use these endpoint paths when orienting code:

| API | Path | Default Use |
|-----|------|-------------|
| Responses | `/responses` | New agentic workflows |
| Chat Completions | `/chat/completions` | Existing stateless chat code |
| Conversations | `/conversations` | OCI-managed multi-turn state |
| Files | `/files` | Upload reusable workflow files |
| Vector Stores | `/vector_stores` | Manage retrieval indexes |
| Containers | `/containers` and `/containers/{id}/files` | Manage Code Interpreter sandboxes |

## Core Agent Building Blocks

| Need | OCI Building Block |
|------|--------------------|
| Generate or reason over user input | Responses API |
| Multi-turn state | Conversations API |
| Related resource grouping | Projects |
| Persistent or compacted context | Agent memory |
| Search user files or vector stores | File Search |
| Run sandboxed Python-style analysis | Code Interpreter |
| Call local application functions | Function Calling |
| Call remote tool servers | MCP Calling |
| Upload or reuse documents | Files API |
| Manage searchable file indexes | Vector Stores API |
| Manage sandbox execution resources | Containers API and Container Files API |
| Deploy a custom hosted runtime | Generative AI applications and deployments |

## Responses API vs Chat Completions

Prefer the Responses API for new Enterprise AI agents. Use Chat Completions only when the user has existing chat-only code and does not need stateful conversation support, built-in tools, structured outputs, files, vector stores, containers, or hosted-agent extensibility.

Responses API is the better default when the workflow needs:

- Stateful or long-running interactions.
- Multi-step tool use.
- File or vector store integration.
- Event-based streaming.
- JSON schema or structured output enforcement.
- Future growth into hosted agents, MCP tools, memory, or containers.

## Projects, Memory, and Retention

Treat projects as both an API prerequisite and a lifecycle boundary. A project organizes responses, conversations, files, and containers and applies settings such as response retention, conversation retention, long-term memory, and short-term memory compaction.

Ask for explicit choices when memory matters:

- Response and conversation retention duration.
- Whether long-term memory is allowed.
- Whether short-term memory compaction is enabled to reduce context size, latency, and token usage in long conversations.
- Whether project deletion should also delete associated artifacts.

## Implementation Guardrails

- Keep tool contracts narrow and auditable.
- Do not put secrets in prompts, tool descriptions, uploaded files, or memory.
- Prefer server-side retrieval tools for enterprise knowledge rather than pasting large context into prompts.
- Treat memory retention as a policy decision, not a default convenience.
- Separate SQL generation from SQL execution; use SQL Search and database guardrails when structured data is involved.

## Common Mistakes

- Assuming OpenAI-compatible means OpenAI-hosted; it still uses OCI endpoint, authentication, and region controls.
- Building a hosted runtime before an API-first agent proves the workflow.
- Giving an agent broad function or MCP tools without clear authorization boundaries.
- Forgetting that tool support can vary by model and region.
- Treating conversation memory as harmless when it may retain sensitive context.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agents.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/responses-api.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/oci-openai.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/building-agents.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/openai-compatible-api.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/oci-genai-auth.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-api-key.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/chat-completions-api.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/conversations-api.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/files.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/vector-stores.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/containers-api.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/projects.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/memory.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agent-building-blocks.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/get-started-agents.htm
