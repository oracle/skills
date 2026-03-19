# Select AI Prompt Guidance in Oracle AI Database

## Overview

Oracle documents prompt behavior for Select AI through action usage notes, prompt augmentation rules, and examples for NL2SQL and RAG.

Use this file when you need to decide how to phrase prompts, when to use `showsql` or `showprompt`, how prompt augmentation works, or what Oracle explicitly documents as improving Select AI results.

---

## Documentation Map

| Topic | Oracle documentation |
|---|---|
| `SELECT AI` syntax and usage notes | Autonomous Database documentation, **Use AI Keyword to Enter Prompts** |
| Prompt augmentation data | Oracle Database Select AI User's Guide, **About Select AI** |
| SQL generation scope and intended use | Autonomous Database documentation, **Generate SQL from Natural Language Prompts Using Select AI** |
| Action examples | Autonomous Database documentation, **Examples of Using Select AI** |

---

## Start with the Right Action

Oracle documents different Select AI actions for different prompt outcomes:

- `showsql` displays the SQL statement
- `explainsql` explains the generated SQL in natural language
- `runsql` runs the generated SQL
- `chat` sends the prompt directly to the LLM
- `showprompt` displays the constructed prompt sent to the model

Oracle also documents that Select AI focuses on SQL query generation, while general requests can be submitted with the `chat` action.

Use the action that matches the task before changing prompt wording.

---

## Understand Prompt Augmentation

Oracle documents prompt augmentation as part of Select AI's design.

For SQL generation:

- the database augments the user-specified prompt with schema metadata
- this metadata may include schema definitions, table comments, column comments, and data dictionary content
- the database does not provide table or view contents for SQL generation

For RAG:

- Select AI retrieves vector-store content using semantic similarity search
- the retrieved content becomes part of the augmented prompt

Use this distinction when deciding whether to improve metadata, improve prompt wording, or move the workflow to RAG.

---

## Use `showprompt` to Inspect the Constructed Prompt

Oracle documents `showprompt` as the action that displays the constructed prompt sent to the generative AI model.

Oracle also documents these limits:

- `showprompt` supports NL2SQL and RAG
- `showprompt` does not support synthetic data generation
- `showprompt` does not support `explainsql`
- `showprompt` does not support `narrate`

Use `showprompt` when you need to inspect prompt augmentation rather than only the generated SQL.

---

## Prompt Text Rules Oracle Explicitly Documents

Oracle documents these prompt-usage rules:

- the syntax is `SELECT AI action natural_language_prompt`
- `SELECT AI` works only in `SELECT`
- PL/SQL, DDL, and DML statements cannot be run using the `AI` keyword
- special character rules apply according to Oracle guidelines

Documented example:

```sql
select ai how many customers in SF don''t own their own home
```

When using case-sensitive values, Oracle's examples show that double quotes in the prompt can preserve case-sensitive matching even when `case_sensitive_values` is set to `false`.

Documented example:

```sql
select ai showsql how many people watch "Inception";
```

---

## What Oracle Documents as Improving Results

Oracle explicitly documents these result-improvement measures for NL2SQL:

- use database views or tables with contextual column names
- add column comments explaining stored values
- add annotations to the metadata sent to the LLM
- add foreign key and referential constraints to the metadata for accurate `JOIN` conditions

Oracle's examples also document profile controls that affect prompt interpretation:

- `object_list`
- `enforce_object_list`
- `case_sensitive_values`

Treat prompt wording and metadata design as part of the same workflow.

---

## Restricting Prompt Scope

Oracle documents `enforce_object_list` as a way to restrict table access and instruct the LLM to use only the tables specified in the AI profile.

Oracle's documented example also shows the contrast:

- with `enforce_object_list = true`, the generated SQL is limited to the named objects
- with `enforce_object_list = false`, the LLM can use other tables and views based on prior knowledge

Use this control when prompt scope must stay inside an approved object set.

---

## Hallucination and Review Guidance

Oracle explicitly warns that LLMs are subject to hallucinations and that results are not always correct.

Oracle documents that:

- `SELECT AI` may fail to generate SQL
- `SELECT AI` may generate SQL that cannot be run
- the generated SQL may produce incorrect results

Oracle also notes that, in such cases, Select AI may respond with information to assist in generating valid SQL.

Use `showsql`, `explainsql`, and `showprompt` as inspection tools before treating an answer path as production-ready.

---

## Best Practices

- Use `showsql` when validating NL2SQL prompts.
- Use `showprompt` when you need to inspect augmented prompt content.
- Use `explainsql` when you need a more detailed explanation than `showsql`.
- Use contextual object names, comments, annotations, and constraints because Oracle documents them as improving SQL generation.
- Use quoted values in prompts when the query needs case-sensitive matching.

---

## Common Mistakes

### Mistake 1: Using `chat` for a SQL-generation Problem

Oracle documents Select AI as focused on SQL generation and reserves `chat` for general requests.

### Mistake 2: Changing Prompt Wording Without Inspecting Augmentation

Oracle documents `showprompt` specifically to inspect the constructed prompt.

### Mistake 3: Assuming Prompt Text Alone Controls Result Quality

Oracle documents metadata augmentation, comments, annotations, and constraints as part of SQL-generation quality.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle Database 19c (generic):** Select AI prompt features are not part of the generic 19c baseline.
- **Autonomous AI Database 19c / Oracle AI Database 19.30:** Core `SELECT AI` usage notes and NL2SQL workflows are documented, but newer features such as `showprompt` and `feedback` are not universally available.
- **Oracle AI Database 26ai:** Current documentation includes prompt augmentation for RAG, `showprompt`, metadata enhancements, and updated action guidance.

---

## Sources

- [Autonomous Database documentation - Use AI Keyword to Enter Prompts](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-keyword-prompts.html)
- [Oracle Database Select AI User's Guide - About Select AI](https://docs.oracle.com/en/database/oracle/oracle-database/26/selai/select-ai-about.html)
- [Autonomous Database documentation - Generate SQL from Natural Language Prompts Using Select AI](https://docs.oracle.com/en-us/iaas/autonomous-database/doc/use-select-ai-generate-sql-natural-language-prompts.html)
- [Autonomous Database documentation - Examples of Using Select AI](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-examples.html)
