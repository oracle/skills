# Select AI in Autonomous AI Database

## Overview

Select AI generates, runs, and explains SQL from natural language prompts. Oracle also documents Select AI as supporting retrieval augmented generation with vector stores and natural language chat interactions with large language models.

This guide focuses on the current Select AI workflow documented for Autonomous AI Database, including AI profiles, prompt actions, prompt augmentation, and metadata controls that improve SQL generation quality.

---

## Documentation Map

| Topic | Oracle documentation |
|---|---|
| Concepts, usage guidelines, and supported platforms | Autonomous Database documentation, **About Select AI** |
| Feature overview | Autonomous Database documentation, **Use Select AI for Natural Language Interaction with your Database** |
| AI profiles and attributes | Autonomous Database documentation, **DBMS_CLOUD_AI Package** |
| AI profile metadata controls | SQL Developer Web documentation, **Create AI Profile** |
| Recent metadata improvements | Autonomous Database release notes, **Select AI enhancements** |

---

## Start with an AI Profile

Oracle documents Select AI around an AI profile that defines the provider, credentials, model, and the metadata made available for prompt translation.

`DBMS_CLOUD_AI.CREATE_PROFILE` creates a profile:

```sql
DBMS_CLOUD_AI.CREATE_PROFILE
   profile_name        IN  VARCHAR2,
   attributes          IN  CLOB      DEFAULT NULL,
   status              IN  VARCHAR2  DEFAULT NULL,
   description         IN  CLOB      DEFAULT NULL
);
```

`DBMS_CLOUD_AI.SET_PROFILE` enables a profile for the current session:

```sql
DBMS_CLOUD_AI.SET_PROFILE(
    profile_name      IN  VARCHAR2,
);
```

Oracle documents these profile attributes as especially important for SQL generation:

- `provider`
- `credential_name`
- `model`
- `embedding_model`
- `object_list`
- `comments`
- `conversation`

Oracle also documents that object metadata sent for SQL generation can include object names, owners, columns, and comments, and that this metadata is sent to the AI provider over HTTPS. That makes profile scope a governance decision, not just a convenience setting.

---

## Use the Supported Prompt Actions Deliberately

Oracle documents the `DBMS_CLOUD_AI.GENERATE` function for stateless use and `SELECT AI <action>` prompts for interactive use.

```sql
DBMS_CLOUD_AI.GENERATE(
    prompt            IN  CLOB,
    profile_name      IN  VARCHAR2 DEFAULT NULL,
    action            IN  VARCHAR2 DEFAULT NULL,
    attributes        IN  CLOB     DEFAULT NULL,
    params            IN  CLOB
) RETURN CLOB;
```

Oracle documents these actions:

- `runsql`
- `showsql`
- `explainsql`
- `narrate`
- `summarize`
- `translate`
- `chat`

Example from the documentation:

```sql
SELECT DBMS_CLOUD_AI.GENERATE(prompt       => 'how many customers',
                              profile_name => 'OPENAI',
                              action       => 'showsql')
FROM dual;
```

And for chat:

```sql
SELECT DBMS_CLOUD_AI.GENERATE(prompt       => 'what is oracle autonomous database',
                              profile_name => 'OPENAI',
                              action       => 'chat')
FROM dual;
```

---

## Understand Prompt Augmentation

Oracle documents prompt augmentation as a core part of Select AI.

For SQL generation, the database augments the user prompt with database metadata to mitigate hallucinations. For Select AI RAG, Oracle documents that content from the vector store is retrieved with semantic similarity search and added to the augmented prompt sent to the LLM.

This is the key boundary:

- use metadata augmentation for natural language to SQL
- use vector-store augmentation when the answer depends on unstructured content

---

## Use Metadata Controls to Improve SQL Generation

Oracle has expanded the metadata controls available to Select AI profiles. Current documentation and release notes call out:

- `comments`
- `annotations`
- `constraints`

The SQL Developer Web AI profile flow also documents table metadata controls such as:

- `Object List Mode = All`
- `Object List Mode = Automated`
- `Object List Mode = Selected Tables`
- `Enforce Object List`

Oracle documents these effects:

- `comments` exposes table and column comments to the AI as context
- `constraints` exposes primary and foreign key information to help the LLM reason about joins
- `annotations` exposes extra descriptive metadata attached to objects
- `Automated` object list mode uses vector search on schema metadata so that Select AI can choose a smaller relevant table subset for each prompt

---

## Best Practices

- Keep `object_list` narrow when the use case is bounded. Oracle explicitly warns that object names, column names, and comments are sent to the AI provider.
- Use `showsql` when you want to inspect generated SQL before execution, and use `runsql` only after the profile and metadata are producing the expected SQL.
- Enable `comments`, `constraints`, and `annotations` when business meaning or join paths are not obvious from table and column names alone.
- Use `Object List Mode = Automated` or selected tables when the schema is large and you want to reduce irrelevant metadata in the augmented prompt.
- Use Select AI RAG only when the answer depends on unstructured content and a vector store is available.

---

## Common Mistakes

### Mistake 1: Exposing Too Much Metadata

Oracle documents that object names, owners, columns, and comments are sent to the AI provider for natural language to SQL. Do not include sensitive objects or comments in the AI profile unless they are meant to be exposed.

### Mistake 2: Expecting Accurate Joins Without Relationship Metadata

Oracle's recent Select AI enhancements explicitly add `constraints` so the model can reason about primary and foreign keys. If the schema depends on joins, omitting that metadata reduces the odds of correct SQL generation.

### Mistake 3: Treating `chat` as a Substitute for SQL Inspection

Oracle documents separate actions for `showsql`, `runsql`, `explainsql`, and `chat`. Use the action that matches the task instead of assuming one prompt style is correct for every workflow.

### Mistake 4: Assuming Table Selection Is Always Automatic

Oracle documents separate object-list modes. If you do not configure `object_list` or automated table selection intentionally, the prompt context may be either too broad or too narrow.

### Mistake 5: Ignoring Version-Specific Enhancements

Recent release notes add comments, annotations, constraints, and automated metadata selection improvements. Do not assume an older deployment has the same Select AI behavior as the latest docs.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle AI Database 19c:** Current SQL Developer Web documentation explicitly notes that `Object List Mode` is not available with Oracle AI Database 19c.
- **Current Autonomous AI Database documentation:** Select AI is documented with AI profiles, `DBMS_CLOUD_AI`, `SELECT AI` prompt actions, RAG support, and provider integrations.
- **2025-2026 documented enhancements:** Oracle release notes document newer metadata controls and SQL-generation improvements including `comments`, `annotations`, `constraints`, and automated relevant-table detection.

---

## Sources

- [Autonomous Database documentation - Use Select AI for Natural Language Interaction with your Database](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai.html)
- [Autonomous Database documentation - About Select AI](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/select-ai-about.html)
- [Autonomous Database documentation - DBMS_CLOUD_AI Package](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-package.html)
- [Autonomous Database documentation - Manage AI Profiles](https://docs.oracle.com/en-us/iaas/autonomous-database-shared/doc/select-ai-manage-profiles.html)
- [SQL Developer Web documentation - Create AI Profile](https://docs.oracle.com/en/database/oracle/sql-developer-web/sdwad/create-ai-profile.html)
- [Autonomous Database release notes - Select AI enhancements](https://docs.oracle.com/iaas/releasenotes/autonomous-database-serverless/2025-06-select-ai-enhancements-1.htm)
- [Autonomous Database release notes - Interact with metadata to improve Select AI SQL query generation](https://docs.oracle.com/iaas/releasenotes/autonomous-database-dedicated/adbd-selectai-sqlquerygen.htm)
