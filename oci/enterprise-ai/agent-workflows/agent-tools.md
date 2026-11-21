# Enterprise AI Agent Tools

## Overview

Use this file to choose the right tool pattern for OCI Enterprise AI agents. Route by what the agent must do, not by the tool name the user mentions first.

## Tool Selection

| User Need | Recommended Tool Pattern |
|-----------|--------------------------|
| Search uploaded files or vector store content | File Search |
| Analyze data, transform files, or run sandboxed code | Code Interpreter |
| Call application-owned business logic | Function Calling |
| Call a remote tool server from the OCI agent platform | MCP Calling |
| Use provider-hosted X Search or code execution with supported xAI models | xAI-compatible tools through Responses API |
| Generate SQL from natural language over Autonomous Database-backed metadata | SQL Search |
| Query or change data after SQL is generated | Database tooling with explicit authorization and safety checks |

## File Search

Use File Search when the agent should retrieve relevant information from uploaded files or vector store content. Prefer it for document-grounded Q&A, policy assistants, support knowledge, and file collections where retrieval should be managed by the agent platform.

Before using File Search, create a vector store and add files through the Files, Vector Store Files, or Vector Store File Batches APIs. Hybrid search tuning parameters aren't supported directly through the File Search tool, so use the tool when service-managed retrieval is acceptable.

Do not use File Search as a replacement for governed database access when the source of truth is structured Oracle Database data.

## Code Interpreter

Use Code Interpreter when the agent needs sandboxed execution for analysis, calculations, file transformation, or code-aided reasoning. Treat generated files and intermediate outputs as user data and apply the same governance posture as the parent workflow.

The execution environment is an OCI-managed sandbox container. Plan for container memory, file persistence across turns while the container is alive, generated-file retrieval, and cost inputs for container-backed workflows.

Practical constraints to include in designs:

- Supported memory sizes are 1 GB, 4 GB, 16 GB, and 64 GB, with a shared tenancy pool documented by OCI.
- Auto mode is simplest; explicit containers are better when memory size or session control matters.
- Containers expire after 20 minutes of inactivity, and files or in-memory variables in that container are lost after expiration. The documented default shared memory pool is 64 GB per tenancy.
- Network policies and custom skills are not supported by OCI Containers API; do not assume unrestricted internet or shell access.

## Function Calling

Use Function Calling when the application owns the tool execution. Keep function schemas minimal and stable. The model should request a function call; the application should authorize, execute, validate, and return the result.

The model does not execute the function. Your application runs the operation and sends a function output back, using either service-managed state with `previous_response_id` or client-managed conversation state.

## MCP Calling

Use MCP Calling when tools are exposed through a remote MCP server and the OCI agent platform should invoke them directly. This is a better fit than function calling when a tool surface already exists as MCP or when multiple clients should share the same tool server.

Constrain MCP access with `allowed_tools` when only a subset is needed. If the remote MCP server requires authentication, pass only the raw token value in the `authorization` field and require TLS for the server URL. OCI documents Streamable HTTP transport support and notes that SSE is deprecated and unsupported for MCP Calling.

## xAI-Compatible Tools

The current tool table lists X Search (`x_search`) and xAI Code Execution (`code_interpreter`). These use xAI parameters and limits and execute at the provider. The OCI sandbox Code Interpreter uses the same type name but a different execution path; select by model and tool contract. Don't assume Web Search or other OpenAI/xAI tool types are supported merely because the client SDK accepts them. Check `tool-support.htm` and the xAI-specific model/region table, then estimate provider-tool usage separately.

## SQL Search

Use SQL Search for NL2SQL over enterprise structured data when the source data is in Autonomous Database. SQL Search generates SQL; it does not run the query. Query execution should happen separately through approved database tooling and existing permissions.

SQL Search requires a Semantic Store backed by structured data and Database Tools connections. Keep enrichment and query connections separate: enrichment can need broader schema access, while query execution should use lower-privileged access and the end user's authorization path.

NL2SQL is an OCI-native API, not a Responses `tools` type. Call `GenerateSqlFromNl` directly or expose the Database Tools MCP Server through MCP Calling. The August 2026 release adds model selection, scheduled delta enrichment, and background SQL jobs; use `data/rag-and-search.md` for configuration and lifecycle details.

Route follow-on SQL execution, schema discovery, and safe DML behavior to:

- `db/agent/schema-discovery.md`
- `db/agent/safe-dml-patterns.md`
- `db/sqlcl/sqlcl-mcp-server.md`
- `db/features/select-ai.md`

## Tool Safety Checklist

- Define what the tool can do in business terms.
- Require least-privilege credentials for the tool backend.
- Validate tool inputs outside the model.
- Log tool calls with request IDs and user identity where possible.
- Redact or avoid secrets in tool descriptions and outputs.
- Add human approval for destructive or externally visible actions.
- Estimate costs for tool-related storage, retrieval, memory retention, Code Interpreter containers, web search, and agent transactions before production.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/tool-support.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/responses-api.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/get-started-agents.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/code-interpreter.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/containers-api.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/get-started-agents.htm#function-calling
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/mcp.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/nl2sql.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/vector-stores.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agentic-regions.htm
