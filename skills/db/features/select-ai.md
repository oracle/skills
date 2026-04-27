# Select AI in Oracle 26ai and 19c

Select AI is Oracle's built-in gateway to AI providers and AI models, including privately hosted models for a range of generative and agentic AI use cases. Select AI supports:

- **Natural language to SQL (NL2SQL)** - specific to your database shcema, generate and explain SQL, running and narrating generated queries
- **Retrieval augmented generation (RAG) on 26ai** - automated vector index creation/update and RAG workflow using AI Vector Search
- **Chat** - generate content with simple or complex custom prompts easily from your database for email generation, sentiment analysis, etc
- **Synthetic Data Generation (SDG)** - generate data in database tables to support, e.g., testing/debugging applications and interfaces
- **AI agents** - build interactive and autonomous AI agents that perform tasks and use tools
- **Sumarize text** - generate a summary of long text with choice of output style and processing method
- **Translate text** - using AI provider translation services, translate from one language to another to simplify app-dev and assist in translating LLM results to the desired language 

You can use Select AI in SQL clients with:

- `SELECT AI <action> <prompt>` after setting your AI profile
- `DBMS_CLOUD_AI.GENERATE(...)` for stateless or programmatic use

You can use Select AI Agent in SQL clients with:

- `SELECT AI AGENT <prompt>` after setting your AI agent team
- `DBMS_CLOUD_AI_AGENT.RUN_TEAM`


The SQL command line use of `SELECT AI` is not supported in Database Actions or APEX Service. In those environments, use `DBMS_CLOUD_AI.GENERATE`.

## How Select AI Works for NL2SQL

1. You submit a natural language prompt.
2. Select AI augments the prompt with schema metadata from the active AI profile.
3. Select AI sends the constructed prompt to the configured AI provider.
4. Select AI returns the generated SQL, query results or natural-language summary, or a natural-language explanation depending on the action specified. 

For SQL generation, Oracle sends schema metadata, not table contents. For `narrate`, Select AI can send result data or retrieved content to the LLM unless an administrator disables data access.

## Prerequisites

At minimum, you need:

- A credential for the AI provider
- An AI profile created with `DBMS_CLOUD_AI.CREATE_PROFILE`
- To use a stateful SQL command line, the profile set in the current session with `DBMS_CLOUD_AI.SET_PROFILE`

In most environments, an administrator also needs to grant `EXECUTE` on `DBMS_CLOUD_AI` (and `DBMS_CLOUD_AI_AGENT` if using AI agents) and provide outbound network access to the provider.

```sql
-- 1. Create credentials for the AI provider
BEGIN
  DBMS_CLOUD.CREATE_CREDENTIAL(
    credential_name => 'OPENAI_CRED',
    username        => 'OPENAI',
    password        => 'sk-...'   -- your API key
  );
END;
/

-- 2. Create an AI profile
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'MY_AI_PROFILE',
    attributes   => '{"provider": "openai",
                      "credential_name": "OPENAI_CRED",
                      "object_list": [{"owner": "HR", "name": "EMPLOYEES"},
                                      {"owner": "HR", "name": "DEPARTMENTS"}],
                      "comments": true,
                      "temperature": 0}'
  );
END;
/

-- 3. Set the profile for the current session
EXEC DBMS_CLOUD_AI.SET_PROFILE('MY_AI_PROFILE');
```

## Select AI Syntax

The SQL syntax is:

```sql
SELECT AI action natural_language_prompt
```

`runsql` is the default action, so the action keyword is optional.

```sql
-- RUNSQL: generate SQL and execute it
SELECT AI how many employees are in each department;

-- SHOWSQL: generate SQL but do not execute it
SELECT AI SHOWSQL how many employees were hired last year;

-- EXPLAINSQL: explain the generated SQL in natural language
SELECT AI EXPLAINSQL show the top 10 employees by salary;

-- NARRATE: execute the SQL and summarize the result in natural language
SELECT AI NARRATE what are the total sales by region this quarter;

-- CHAT: send the prompt directly to the LLM
SELECT AI CHAT what is the difference between a fact table and a dimension table;

-- SHOWPROMPT: display the constructed prompt Oracle sends to the model
SELECT AI SHOWPROMPT show the top 10 employees by salary;
```

Oracle AI Database also supports actions:

- `SUMMARIZE` for summarizing text and large files
- `FEEDBACK` for improving future SQL generation based on user feedback (26ai capability)
- `TRANSLATE` for OCI-backed translation
- `AGENT` for Select AI Agent team execution

## Supported AI Providers

| Provider | `provider` Value | Notes |
|---|---|---|
| OpenAI | `openai` | General LLM provider support |
| Cohere | `cohere` | General LLM provider support |
| Azure OpenAI | `azure` | Requires Azure resource and deployment attributes |
| OCI Generative AI | `oci` | Required for `translate`; may also need OCI-specific attributes |
| Google | `google` | Gemini/Vertex-backed provider support |
| Anthropic | `anthropic` | Claude-backed provider support |
| Hugging Face | `huggingface` | 26ai provider option |
| AWS Bedrock | `aws` | General LLM provider support |
| OpenAI-compatible API providers | Specify `provider_endpoint` | General LLM provider support |
| Privately hosted AI models | `x` | 

Model availability varies by provider and Oracle release, so prefer provider examples that do not hard-code a model unless you need a specific one.

See [Manage AI Profiles](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-manage-profiles.html) for more information.

```sql
-- OCI Generative AI example
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'OCI_AI_PROFILE',
    attributes   => '{"provider": "oci",
                      "credential_name": "OCI_CRED",
                      "object_list": [{"owner": "SALES", "name": "ORDERS"}]}'
  );
END;
/
```

## Profile Attributes

The following are a few commonly used attributes

| Attribute | Description | Notes |
|---|---|---|
| `provider` | AI provider name | Required |
| `credential_name` | Name of the `DBMS_CLOUD` credential | Required |
| `object_list` | JSON array of schemas/tables/views allowed for NL2SQL | Optional in 26ai; required in 19c |
| `object_list_mode` | Specifies whether to sends metadata for all objects in object_list or the most relevant objects to the LLM | Optional; values `all` or `automated`; 26ai feature |
| `model` | Provider model name | Optional; exact values vary by provider |
| `max_tokens` | Maximum response tokens | Optional; default is provider/package dependent |
| `temperature` | Randomness for generation | Optional; Lower values are more deterministic |
| `seed` | Enhance reproducible results or results with less variability from the LLM | Optional |
| `comments` | Include table/column comments in prompt metadata | Optional; true/false |
| `constraints` | Enable referential integrity constraints in metadata sent to LLM | Optional; true/false |
| `annotations` | Enable referential integrity constraints in metadata sent to LLM | Optional; true/false; 26 AI feature |
| `conversation` | Enable short-term conversation history | Optional boolean |

See [Select AI Profile Attributes](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/dbms-cloud-ai-package.html#GUID-12D91681-B51C-48E0-93FD-9ABC67B0F375) for more information.

```sql
-- Profile with comments enabled and more deterministic generation
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'PRECISE_PROFILE',
    attributes   => '{"provider": "openai",
                      "credential_name": "OPENAI_CRED",
                      "object_list": [{"owner": "SALES"}],
                      "comments": true,
                      "seed": 12345,
                      "temperature": 0}'
  );
END;
/
```

## Improving Results with Table Comments

Oracle can send table and column comments to the LLM when `comments` is enabled in the profile. Well-commented schemas generally produce better SQL. On 26ai, annotations are also supported using  `annotations` attribute.  

```sql
-- Add descriptive comments so the LLM understands the schema
COMMENT ON TABLE sales.orders IS
  'Customer purchase orders. Each row is one order.';

COMMENT ON COLUMN sales.orders.status IS
  'Order lifecycle status: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED';

COMMENT ON COLUMN sales.orders.total_amount IS
  'Order total in USD including tax and shipping';
```

## Managing Profiles

```sql
-- List profiles in your schema
SELECT profile_name, status, description
FROM   user_cloud_ai_profiles
ORDER  BY profile_name;

-- List attributes for one profile
SELECT profile_name, attribute_name, attribute_value
FROM   user_cloud_ai_profile_attributes
WHERE  profile_name = 'MY_AI_PROFILE'
ORDER  BY attribute_name;

-- Disable a profile
EXEC DBMS_CLOUD_AI.DISABLE_PROFILE('MY_AI_PROFILE');

-- Enable a profile
EXEC DBMS_CLOUD_AI.ENABLE_PROFILE('MY_AI_PROFILE');

-- Clear the active session profile without dropping it
BEGIN
  DBMS_CLOUD_AI.CLEAR_PROFILE;
END;
/

-- Check the active session profile
SELECT DBMS_CLOUD_AI.GET_PROFILE()
FROM   DUAL;

-- Drop a profile
BEGIN
  DBMS_CLOUD_AI.DROP_PROFILE(profile_name => 'MY_AI_PROFILE');
END;
/
```

## Security Considerations

- For `runsql`, `showsql`, and `explainsql`, Oracle sends schema metadata, not table contents, to the LLM.
- Metadata can include object names, column names, data types, and optionally comments and other prompt-enrichment metadata.
- `narrate` for both SQL and RAG as wellas synthetic data generation can send result data or retrieved document content to the LLM.
- An administrator can disable those data-sending features globally with `DBMS_CLOUD_AI.DISABLE_DATA_ACCESS`.
- Generated SQL still runs with the current session user's privileges; VPD and row-level security apply normally.
- `SELECT AI` cannot execute PL/SQL, DDL, or DML.

```sql
-- Administrator-only: disable sending result data and RAG content to the LLM
BEGIN
  DBMS_CLOUD_AI.DISABLE_DATA_ACCESS();
END;
/
```

## Using SELECT AI Programmatically

Use `DBMS_CLOUD_AI.GENERATE` when you want stateless calls, per-call profile overrides, or programmatic use from PL/SQL or an application.

```sql
DECLARE
  v_result CLOB;
BEGIN
  v_result := DBMS_CLOUD_AI.GENERATE(
    prompt       => 'how many employees are in each department',
    profile_name => 'MY_AI_PROFILE',
    action       => 'showsql'
  );

  DBMS_OUTPUT.PUT_LINE(v_result);
END;
/
```

## Ambiguous Table Name Handling

If similar table names exist across schemas, narrow the profile scope with `object_list`.

Use `SET_ATTRIBUTE` for a single attribute or `SET_ATTRIBUTES` for multiple attributes. Do not use `SET_PROFILE` to edit attributes.

```sql
-- Narrow object_list to explicit owner.object combinations
BEGIN
  DBMS_CLOUD_AI.SET_ATTRIBUTE(
    profile_name    => 'MYAPP_AI',
    attribute_name  => 'object_list',
    attribute_value => '[{"owner":"HR","name":"EMPLOYEES"},
                         {"owner":"HR","name":"DEPARTMENTS"},
                         {"owner":"SALES","name":"ORDERS"}]'
  );
END;
/
```

## Session vs Stateless Usage

`SELECT AI` always uses the active session profile. For per-call overrides, use `DBMS_CLOUD_AI.GENERATE(profile_name => ...)`.

```sql
-- Set a default profile for the session
EXEC DBMS_CLOUD_AI.SET_PROFILE('MYAPP_AI');

-- Session-based SELECT AI call
SELECT AI SHOWSQL list the top 10 customers by revenue;

-- Stateless call with an explicit profile override
SELECT DBMS_CLOUD_AI.GENERATE(
         prompt       => 'list the top 10 customers by revenue',
         profile_name => 'FINANCE_AI',
         action       => 'showsql'
       )
FROM   dual;

-- Check the active session profile
SELECT DBMS_CLOUD_AI.GET_PROFILE()
FROM   dual;
```

## History and Observability

Use `V$CLOUD_AI_SQL` for SQL-generation history and the conversation views for conversation-backed prompt history.

```sql
-- Find the SQL_ID for a previously issued Select AI statement
SELECT sql_id
FROM   v$cloud_ai_sql
WHERE  sql_text = 'select ai showsql how many movies are in each genre';

-- Review conversation prompt history in your schema
SELECT conversation_id,
       prompt_action,
       prompt,
       prompt_response,
       created
FROM   user_cloud_ai_conversation_prompts
ORDER  BY created DESC
FETCH  FIRST 20 ROWS ONLY;
```

## Error and Provider Outage Handling

Provider or network failures surface through `DBMS_CLOUD_AI.GENERATE`, commonly as `ORA-20000` or `ORA-29273`. Handle those errors in PL/SQL and fall back to manual review when needed.

```sql
DECLARE
  v_sql CLOB;
BEGIN
  v_sql := DBMS_CLOUD_AI.GENERATE(
    prompt       => 'how many employees are in each department',
    profile_name => 'MY_AI_PROFILE',
    action       => 'showsql'
  );
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE IN (-20000, -29273) THEN
      v_sql := NULL;
      DBMS_OUTPUT.PUT_LINE('Provider call failed; fall back to manual SQL review.');
    ELSE
      RAISE;
    END IF;
END;
/
```

## Views vs Base Tables in object_list

- Select AI works with both views and base tables in `object_list`
- Prefer views in production so you can hide sensitive columns, stabilize naming, and encode common joins or derived metrics
- Views are especially useful when the base schema uses cryptic column names or exposes columns the LLM should never reference

```sql
-- Create a SELECT AI-safe view with only the columns you want exposed
CREATE OR REPLACE VIEW ai_employees AS
SELECT employee_id, job_id, department_id, hire_date, salary
FROM   employees;

-- Include the view in the AI profile instead of the base table
-- "object_list": [{"owner":"HR","name":"AI_EMPLOYEES"}]
```

## Best Practices

- Use `SHOWSQL` first and review the generated SQL before using `RUNSQL` in production workflows.
- Keep the metadata scope small by using a focused `object_list` or schema-level scoping.
- Prefer views with business-friendly names, pre-joined relationships, and precomputed KPIs for common prompts.
- Enable `comments` and/or `annotations` and add meaningful table and column content.
- Use low `temperature` values, typically `0`, for more deterministic SQL generation.
- In Database Actions or APEX Service, use `DBMS_CLOUD_AI.GENERATE` instead of `SELECT AI`.
- Treat `narrate` as a prose output path, not a structured data API.
- For translation, use an OCI profile and configure `target_language`.

## Common Mistakes

**Trying to edit attributes with `SET_PROFILE`** — use `SET_ATTRIBUTE` or `SET_ATTRIBUTES` to change profile metadata such as `object_list`, `temperature`, or `comments`.

**Using a single profile for the whole enterprise schema** — too much metadata increases ambiguity and token pressure. Specify minimal set of objects or use `automated` object_list_mode. 

**Exposing raw base tables instead of views** — this makes it easier for the LLM to choose the wrong columns or expose sensitive fields.

**Using `narrate` when you need structured output** — `narrate` returns prose; use `showsql` or `runsql` when you need SQL or rows.

**Assuming the command line `SELECT AI` works everywhere** — use `DBMS_CLOUD_AI.GENERATE` in Database Actions and APEX Service.

## Oracle Version Notes

- **26ai**: This guide targets the 26ai Select AI feature set, including `showprompt`, feedback, summarize, translate, agent integration, richer observability, and broader provider support
- **Autonomous Database 19c**: Supports Select AI summarization, but not the full 26ai feature set described in this guide

## See Also

- [AI Profiles and Provider Configuration](../features/ai-profiles.md) — Provider-specific profile setup details
- [DBMS_VECTOR and DBMS_VECTOR_CHAIN](../features/dbms-vector.md) — RAG and vector-enabled AI workflows
- [AI Vector Search in Oracle](../features/vector-search.md) — Embeddings and semantic retrieval in Oracle
- [Natural Language to SQL Mapping Patterns](../agent/nl-to-sql-patterns.md) — Manual NL-to-SQL guidance for agent workflows

## Sources

- [Select AI Online Documentation](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai.html)
- [Select AI Agent Online Documentation](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-agent1.html)
- [Oracle AI Database 26ai Select AI User's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/26/selai/oracle-database-select-ai-users-guide.pdf)
- [DBMS_CLOUD_AI Package Reference](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-package.html)
- [DBMS_CLOUD_AI_AGENT Package Reference](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-agent-package.html)
- [DBMS_CLOUD_AI Views](https://docs.oracle.com/en/database/oracle/oracle-database/26/selai/dbms_cloud_ai-views.html)
- [Examples of Using Select AI](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/select-ai-examples.html)
- [Verify, Observe, and Secure your Generative AI usage with Oracle Autonomous AI Database Select AI](https://blogs.oracle.com/machinelearning/verify-observe-and-secure-your-gen-ai-usage-with-adb-select-ai)
- [6 Simple Tips for Better Text-to-SQL Generation using Oracle Autonomous Database Select AI](https://blogs.oracle.com/machinelearning/6-simple-tips-for-better-texttosql-generation-using-oracle-autonomous-database-select-ai)
