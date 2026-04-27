# AI Profiles and Provider Configuration in Oracle 26ai

AI profiles connect Oracle Database to external LLM providers for `DBMS_CLOUD_AI` and SELECT AI workflows.

This guide targets the Oracle 26ai AI profile APIs and provider attributes. `DBMS_VECTOR` and `DBMS_VECTOR_CHAIN` use the same providers, but they do not use `DBMS_CLOUD_AI` profiles directly; they use vector credentials and per-call JSON parameters.

## Architecture Overview

```
SELECT AI / DBMS_CLOUD_AI
    ↓
AI Profile (provider + credential + model + objects)
    ↓
DBMS_CLOUD Credential (API key, stored encrypted)
    ↓
External LLM Provider

DBMS_VECTOR / DBMS_VECTOR_CHAIN
    ↓
Vector credential + per-call JSON params
    ↓
External embedding / generation provider
```

## Step 1: Create Provider Credentials

Credentials store API keys encrypted in the Oracle credential store.

```sql
-- OpenAI
BEGIN
  DBMS_CLOUD.CREATE_CREDENTIAL(
    credential_name => 'OPENAI_CRED',
    username        => 'OPENAI',
    password        => 'sk-proj-...'  -- your OpenAI API key
  );
END;
/

-- Cohere
BEGIN
  DBMS_CLOUD.CREATE_CREDENTIAL(
    credential_name => 'COHERE_CRED',
    username        => 'COHERE',
    password        => 'co-...'  -- your Cohere API key
  );
END;
/

-- Azure OpenAI
BEGIN
  DBMS_CLOUD.CREATE_CREDENTIAL(
    credential_name => 'AZURE_CRED',
    username        => 'AZURE_OPENAI',
    password        => '...'  -- your Azure OpenAI key
  );
END;
/

-- Anthropic
BEGIN
  DBMS_CLOUD.CREATE_CREDENTIAL(
    credential_name => 'ANTHROPIC_CRED',
    username        => 'ANTHROPIC',
    password        => 'sk-ant-...'  -- your Anthropic API key
  );
END;
/
```

### OCI Generative AI on OCI

When the database is configured for OCI resource principal access, use the reserved credential name `OCI$RESOURCE_PRINCIPAL` in the profile. You do not create that credential with `DBMS_CLOUD.CREATE_CREDENTIAL`.

## Step 2: Create an AI Profile

### OpenAI Profile

```sql
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'OPENAI_PROFILE',
    attributes   => '{
      "provider":         "openai",
      "credential_name":  "OPENAI_CRED",
      "object_list":      [{"owner": "HR",    "name": "EMPLOYEES"},
                           {"owner": "HR",    "name": "DEPARTMENTS"},
                           {"owner": "SALES", "name": "ORDERS"}],
      "model":            "gpt-4o",
      "temperature":      0,
      "max_tokens":       2048,
      "comments":         true
    }'
  );
END;
/
```

### Cohere Profile

```sql
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'COHERE_PROFILE',
    attributes   => '{
      "provider":         "cohere",
      "credential_name":  "COHERE_CRED",
      "object_list":      [{"owner": "SALES"}],
      "model":            "command-r-plus",
      "temperature":      0
    }'
  );
END;
/
```

### Azure OpenAI Profile

```sql
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'AZURE_PROFILE',
    attributes   => '{
      "provider":         "azure",
      "credential_name":  "AZURE_CRED",
      "azure_resource_name": "my-azure-resource",
      "azure_deployment_name": "gpt-4o-deployment",
      "object_list":      [{"owner": "FINANCE"}],
      "model":            "gpt-4o",
      "temperature":      0
    }'
  );
END;
/
```

### OCI Generative AI Profile

```sql
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'OCI_GENAI_PROFILE',
    attributes   => '{
      "provider":         "oci",
      "credential_name":  "OCI$RESOURCE_PRINCIPAL",
      "region":           "us-chicago-1",
      "object_list":      [{"owner": "MYAPP"}],
      "model":            "cohere.command-r-plus",
      "oci_apiformat":    "COHERE"
    }'
  );
END;
/
```

## Profile Attributes Reference

| Attribute | Required | Description |
|---|---|---|
| `provider` | Yes | Provider name: `openai`, `cohere`, `azure`, `oci`, `google`, `anthropic`, `huggingface`, `aws`, or `database` |
| `credential_name` | Yes | Name of DBMS_CLOUD credential |
| `object_list` | No (but strongly recommended for SELECT AI) | Tables/views the LLM may reference. Use `[{"owner":"SCHEMA"}]` for all objects in a schema |
| `model` | No | Model name; uses provider default if omitted |
| `temperature` | No | Randomness 0.0–2.0; `0` = deterministic (recommended for SQL generation) |
| `max_tokens` | No | Maximum tokens in LLM response |
| `comments` | No | `true` to include table/column comments as schema context |
| `azure_resource_name` | Azure only | Azure OpenAI resource name |
| `azure_deployment_name` | Azure only | Azure deployment name |
| `region` | OCI only | OCI region such as `us-chicago-1` |
| `provider_endpoint` | Optional | Override the default provider endpoint |
| `oci_apiformat` | OCI only | `COHERE` or `GENERIC` depending on model |

## Managing Profiles

```sql
-- List profile metadata in the current schema
SELECT profile_name, status, description
FROM   user_cloud_ai_profiles;

-- Inspect attributes for one profile
SELECT profile_name, attribute_name, attribute_value
FROM   user_cloud_ai_profile_attributes
WHERE  profile_name = 'OPENAI_PROFILE'
ORDER  BY attribute_name;

-- Set active profile for current session
EXEC DBMS_CLOUD_AI.SET_PROFILE('OPENAI_PROFILE');

-- Check current session profile
SELECT DBMS_CLOUD_AI.GET_PROFILE() FROM DUAL;

-- Update a profile attribute
BEGIN
  DBMS_CLOUD_AI.SET_ATTRIBUTE(
    profile_name    => 'OPENAI_PROFILE',
    attribute_name  => 'temperature',
    attribute_value => '0'
  );
END;
/

-- Disable and re-enable a profile
EXEC DBMS_CLOUD_AI.DISABLE_PROFILE('OPENAI_PROFILE');
EXEC DBMS_CLOUD_AI.ENABLE_PROFILE('OPENAI_PROFILE');

-- Drop a profile
BEGIN
  DBMS_CLOUD_AI.DROP_PROFILE(profile_name => 'OPENAI_PROFILE');
END;
/
```

## Vector Package Credentials and Parameters

`DBMS_VECTOR` and `DBMS_VECTOR_CHAIN` do not use `DBMS_CLOUD_AI` profiles. Create a vector credential, then reference it from the JSON `params` passed to vector package calls.

```sql
-- Create a credential for DBMS_VECTOR / DBMS_VECTOR_CHAIN
BEGIN
  DBMS_VECTOR.CREATE_CREDENTIAL(
    credential_name => 'OPENAI_VEC_CRED',
    params          => JSON_OBJECT(
                         'username' VALUE 'OPENAI',
                         'password' VALUE 'sk-proj-...'
                       )
  );
END;
/

-- Use the vector credential in an embedding call
DECLARE
  v_embed VECTOR;
BEGIN
  v_embed := DBMS_VECTOR.UTL_TO_EMBEDDING(
    data   => :text,
    params => JSON_OBJECT(
      'provider'        VALUE 'openai',
      'credential_name' VALUE USER || '.OPENAI_VEC_CRED',
      'model'           VALUE 'text-embedding-3-small'
    )
  );
END;
/
```

## Testing a Profile After Creation

Verify end-to-end connectivity immediately after creating a profile before relying on it in application code.

```sql
-- Test that a profile is working end-to-end
DECLARE
  v_result CLOB;
BEGIN
  v_result := DBMS_CLOUD_AI.GENERATE(
    prompt       => 'Say the word CONNECTED in capital letters and nothing else.',
    profile_name => :profile_name,
    action       => 'chat'
  );
  IF v_result LIKE '%CONNECTED%' THEN
    DBMS_OUTPUT.PUT_LINE('Profile ' || :profile_name || ' is working.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Unexpected response: ' || v_result);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Profile test failed: ' || SQLERRM);
END;
/
```

## Provider Outage Fallback — Using a Secondary Profile

Use a failover function to try a primary profile and automatically fall back to a secondary profile when the primary provider is unreachable (ORA-20000 / ORA-29273).

```sql
-- Failover function: try primary profile, fall back to secondary
CREATE OR REPLACE FUNCTION ai_generate_with_fallback(
  p_prompt           IN VARCHAR2,
  p_primary_profile  IN VARCHAR2 DEFAULT 'OPENAI_PROFILE',
  p_fallback_profile IN VARCHAR2 DEFAULT 'OCI_PROFILE'
) RETURN CLOB AS
  v_result CLOB;
BEGIN
  v_result := DBMS_CLOUD_AI.GENERATE(
    prompt       => p_prompt,
    profile_name => p_primary_profile,
    action       => 'chat'
  );
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- ORA-20000 / ORA-29273 = provider unreachable
    IF SQLCODE IN (-20000, -29273) THEN
      v_result := DBMS_CLOUD_AI.GENERATE(
        prompt       => p_prompt,
        profile_name => p_fallback_profile,
        action       => 'chat'
      );
      RETURN v_result;
    ELSE
      RAISE;
    END IF;
END;
/
```

## OCI Region-Specific Endpoints

OCI-backed profiles can specify `region` and, when needed, `provider_endpoint`.

```sql
-- OCI GenAI endpoints vary by region; always specify the correct region
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'OCI_FRANKFURT_PROFILE',
    attributes   => '{
      "provider":          "oci",
      "credential_name":   "OCI$RESOURCE_PRINCIPAL",
      "model":             "cohere.command-r-plus",
      "oci_apiformat":     "COHERE",
      "region":            "eu-frankfurt-1",
      "provider_endpoint": "https://inference.generativeai.eu-frankfurt-1.oci.oraclecloud.com"
    }'
  );
END;
/
```

## object_list Scope and Wildcard Syntax

Omit the `name` field in an `object_list` entry to include all objects in a schema. Keep the list scoped to the tables relevant to the use case — large lists (more than 50 tables) slow down NL-to-SQL generation because the model must reason over more schema context.

```sql
-- Include all tables in a schema (wildcard)
-- Use {"owner":"HR"} without a "name" field to include ALL objects in the schema
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
    profile_name => 'HR_AI',
    attributes   => JSON_OBJECT(
      'provider'         VALUE 'openai',
      'credential_name'  VALUE 'OPENAI_CRED',
      'model'            VALUE 'gpt-4o',
      'object_list'      VALUE '[{"owner":"HR"}]'  -- all tables in HR schema
    )
  );
END;
/

-- Include specific tables from multiple schemas
-- object_list with explicit names:
-- '[{"owner":"HR","name":"EMPLOYEES"},{"owner":"SALES","name":"ORDERS"}]'

-- IMPORTANT: Large object_lists (> 50 tables) slow down NL-to-SQL generation
-- because the model must reason over more schema context.
-- Keep the list to the tables relevant to the use case.
```

## Rate Limiting Guidance

API providers enforce rate limits (tokens per minute, requests per minute) — Oracle does not throttle on its side. For high-volume workloads, handle ORA-29273 with HTTP 429 by sleeping between retries. Prefer `UTL_TO_EMBEDDINGS` (batch) over per-row calls to minimize request count.

```sql
-- Check if the current call is hitting rate limits (ORA-29273 with HTTP 429)
-- Implement a delay between batch calls:
BEGIN
  FOR r IN (SELECT chunk_id, chunk_text FROM doc_chunks WHERE embedding IS NULL) LOOP
    BEGIN
      UPDATE doc_chunks
      SET    embedding = DBMS_VECTOR.UTL_TO_EMBEDDING(
                           r.chunk_text,
                           '{"provider":"openai","credential_name":"YOUR_SCHEMA.OPENAI_VEC_CRED",
                             "model":"text-embedding-3-small"}'
                         )
      WHERE  chunk_id = r.chunk_id;
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE = -29273 THEN
          DBMS_SESSION.SLEEP(2);  -- wait 2 seconds on rate limit
          -- Do not commit; retry will happen on next loop iteration
        ELSE RAISE;
        END IF;
    END;
  END LOOP;
  COMMIT;
END;
/
-- Better: use UTL_TO_EMBEDDINGS (batch API call) to minimize request count
```

## Profile Versioning and Rollback

There is no built-in versioning for AI profiles. Use a naming convention (e.g., `MYAPP_AI_V1`, `MYAPP_AI_V2`) and capture current settings before modifying a profile. To roll back, create the old profile under a new name and switch the session profile, or maintain a `_STABLE` profile that only changes after validation.

```sql
-- There is no built-in versioning for AI profiles.
-- Best practice: use a naming convention to track versions
-- e.g., MYAPP_AI_V1, MYAPP_AI_V2

-- Before updating a profile, capture its current settings
SELECT profile_name, status, description
FROM   user_cloud_ai_profiles
WHERE  profile_name = :profile_name;

SELECT attribute_name, attribute_value
FROM   user_cloud_ai_profile_attributes
WHERE  profile_name = :profile_name
ORDER  BY attribute_name;

-- Update the profile (modifies in place)
BEGIN
  DBMS_CLOUD_AI.SET_ATTRIBUTE(
    profile_name    => 'MYAPP_AI',
    attribute_name  => 'temperature',
    attribute_value => '0'
  );
END;
/

-- To rollback: create the old profile under a new name and switch the session profile
-- Or: maintain a MYAPP_AI_STABLE profile that only changes after validation
```

## Security Best Practices

- Store all API keys via `DBMS_CLOUD.CREATE_CREDENTIAL` — never hardcode keys in SQL or PL/SQL
- Grant `EXECUTE ON DBMS_CLOUD` only to users who need to create credentials
- Scope `object_list` to only the tables needed — the LLM sees table/column names and comments, not data
- Rotate API keys via `DBMS_CLOUD.UPDATE_CREDENTIAL` without dropping/recreating the credential
- On OCI, prefer `OCI$RESOURCE_PRINCIPAL` where available to avoid API key management overhead
- For vector package calls, create and rotate credentials with `DBMS_VECTOR.CREATE_CREDENTIAL` or `DBMS_VECTOR_CHAIN.CREATE_CREDENTIAL` rather than assuming a `DBMS_CLOUD_AI` profile applies

## Supported Embedding Models (as of Oracle 26ai)

| Provider | Recommended Embedding Model | Dimensions |
|---|---|---|
| OpenAI | `text-embedding-3-small` | 1536 |
| OpenAI | `text-embedding-3-large` | 3072 |
| Cohere | `embed-english-v3.0` | 1024 |
| OCI GenAI | `cohere.embed-english-v3.0` | 1024 |

## Oracle Version Notes (19c vs 26ai)

- **19c**: No DBMS_CLOUD_AI; external API calls required custom UTL_HTTP code
- **26ai**: This guide targets the current AI profile APIs, including expanded provider support and attribute management through `SET_ATTRIBUTE` and `SET_ATTRIBUTES`

## See Also

- [SELECT AI in Oracle 26ai](../features/select-ai.md) — Using profiles for natural language to SQL
- [DBMS_VECTOR and DBMS_VECTOR_CHAIN](../features/dbms-vector.md) — Using vector credentials and per-call parameters for embedding generation
- [AI Vector Search in Oracle](../features/vector-search.md) — Storing and querying vector embeddings

## Sources

- [DBMS_CLOUD_AI Package Reference](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-package.html)
- [DBMS_CLOUD.CREATE_CREDENTIAL](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-subprograms.html#GUID-748B56B8-6CDB-4C5D-9A84-F590738FB394)
- [Oracle AI Vector Search — Configuring Providers](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/configure-provider.html)
