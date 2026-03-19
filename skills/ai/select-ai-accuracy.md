# Select AI Accuracy Improvement in Oracle AI Database

## Overview

Oracle documents several concrete ways to improve Select AI SQL generation quality. These include better schema metadata, profile controls, prompt inspection, case-sensitivity controls, and SQL refinement feedback.

Use this file when the question is not about one feature in isolation, but about how to improve Select AI NL2SQL accuracy overall.

---

## Documentation Map

| Topic | Oracle documentation |
|---|---|
| SQL-generation intent, prompt augmentation, and usage guidance | Autonomous Database documentation, **Generate SQL from Natural Language Prompts Using Select AI** |
| `SELECT AI` usage notes | Autonomous Database documentation, **Use AI Keyword to Enter Prompts** |
| Metadata improvements for SQL generation | Autonomous Database release notes, **Interact with metadata to improve Select AI SQL query generation** |
| Practical examples for comments, annotations, constraints, object restrictions, and case sensitivity | Autonomous Database documentation, **Examples of Using Select AI** |
| Metadata controls and object-list modes | SQL Developer Web documentation, **Create AI Profile** |
| Feedback-based refinement | Autonomous Database documentation, **Feedback** |

---

## Start with Metadata, Not Prompt Tricks

Oracle explicitly documents that, for better NL2SQL results, you should:

- use database views or tables with contextual column names
- add column comments explaining stored values
- add annotations to metadata sent to the LLM
- add foreign key and referential constraints so the LLM can generate accurate `JOIN` conditions

Oracle also documents prompt augmentation as schema-metadata augmentation. For SQL generation, Select AI augments the user prompt with schema metadata only, not table contents.

That means Select AI accuracy is primarily a metadata and scope problem before it is a prompt-style problem.

---

## Keep the Object Scope Narrow

Oracle documents `object_list` as the core scoping control for NL2SQL.

Use `object_list` to keep the LLM focused on the relevant tables, views, or graphs instead of exposing a broad schema by default.

Oracle also documents:

- `enforce_object_list`
- `object_list_mode`

The examples show that:

- `enforce_object_list = true` restricts the LLM to the listed objects
- `enforce_object_list = false` allows the LLM to use other tables and views based on prior knowledge

SQL Developer Web documents `Object List Mode` values:

- `None`
- `All`
- `Automated`
- `Selected Tables`

Use these controls when the schema is large or when prompt scope must stay inside a reviewed object boundary.

---

## Add Metadata That Improves SQL Generation

Oracle documents three metadata flags that directly improve generated SQL:

- `"comments":"true"`
- `"annotations":"true"`
- `"constraints":"true"`

Oracle's release notes tie each one to SQL-generation quality:

- comments provide table and column descriptions
- annotations add extra metadata to the LLM prompt
- constraints provide foreign key and referential key information for accurate `JOIN` conditions

Use all three deliberately when the schema is not self-explanatory from object names alone.

---

## Use `showprompt`, `showsql`, and `explainsql` for Inspection

Oracle documents separate actions for:

- `showsql`
- `explainsql`
- `showprompt`
- `runsql`

Use them in this order when accuracy matters:

1. `showprompt` to inspect augmented context
2. `showsql` to inspect the generated SQL
3. `explainsql` when you want a more detailed explanation of the SQL
4. `runsql` only after the generation path looks correct

Oracle also documents that `showprompt` supports NL2SQL and RAG, but not `explainsql`, `narrate`, or synthetic data generation.

---

## Handle Case Sensitivity Explicitly

Oracle documents `case_sensitive_values` as a profile attribute and provides examples showing how it changes generated predicates.

Oracle's examples show:

- with `"case_sensitive_values":"false"`, the generated SQL can normalize values with `UPPER(...)`
- double quotes in the prompt can preserve case-sensitive matching even when the profile is case-insensitive

Use this when query accuracy depends on exact values rather than loose normalization.

---

## Use Feedback for NL2SQL Refinement

Oracle documents `feedback` and `DBMS_CLOUD_AI.FEEDBACK` as ways to improve SQL-generation accuracy for NL2SQL actions.

Oracle explains that feedback:

- stores approved or corrected SQL for future use
- uses vector search to find similar historical prompts
- sends top matching examples as metadata to the LLM as part of the augmented prompt

Use feedback when the same business phrasing recurs and the generated SQL needs to learn from prior corrections.

Do not use feedback for RAG profiles.

---

## Prompt Guidance That Oracle Explicitly Documents

Oracle documents several prompt-specific rules that affect outcome quality:

- use the correct action instead of using `chat` for SQL-generation problems
- special characters in prompts follow Oracle quoting rules
- `SELECT AI` only works in `SELECT`
- case-sensitive values can be expressed with double quotes

Oracle also explicitly warns that LLMs are subject to hallucinations and results are not always correct.

Treat prompt wording as the last layer in the accuracy stack, after metadata scope and inspection workflow.

---

## Improvement Workflow

The Oracle-documented improvement path can be summarized as:

1. use contextual object and column names
2. restrict scope with `object_list`
3. enable comments, annotations, and constraints as needed
4. inspect prompt augmentation with `showprompt`
5. inspect generated SQL with `showsql` or `explainsql`
6. control case sensitivity when values matter
7. use feedback to refine recurring NL2SQL patterns

This is the most documentation-backed route to better accuracy without relying on undocumented prompt-engineering advice.

---

## Routing to Neighbor Skills

| If the task narrows to... | Read |
|---------------------------|------|
| annotation design and annotation dictionary views | `select-ai-annotations.md` |
| prompt wording, `showprompt`, and prompt augmentation | `select-ai-prompts.md` |
| object scoping, comments, constraints, and `case_sensitive_values` | `select-ai-metadata.md` |
| profile attributes and lifecycle | `select-ai-profiles.md` |
| feedback procedures and operational constraints | `select-ai-feedback.md` |

---

## Best Practices

- Improve metadata before attempting broad prompt-engineering changes.
- Keep `object_list` as narrow as the use case allows.
- Enable comments, annotations, and constraints only for reviewed objects inside the AI profile scope.
- Use inspection actions before trusting `runsql`.
- Use feedback only for recurring NL2SQL correction patterns.

---

## Common Mistakes

### Mistake 1: Treating Accuracy as Only a Prompt-Wording Problem

Oracle documents metadata augmentation, object scoping, comments, annotations, and constraints as core to SQL-generation quality.

### Mistake 2: Letting the LLM See Too Many Objects

Oracle documents `object_list`, `enforce_object_list`, and object-list modes because broad schema scope hurts control and can reduce relevance.

### Mistake 3: Skipping Inspection and Going Straight to `runsql`

Oracle documents `showprompt`, `showsql`, and `explainsql` as separate inspection paths for a reason.

### Mistake 4: Using Feedback for RAG

Oracle documents feedback for NL2SQL refinement, not for RAG grounding.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle Database 19c (generic):** Select AI accuracy features are not part of the generic 19c baseline.
- **Autonomous AI Database 19c / Oracle AI Database 19.30:** Core NL2SQL prompting and some profile controls are documented, but newer enhancements such as annotations, automated object-list mode, and feedback are not universally available.
- **Oracle AI Database 26ai:** Current documentation includes comments, annotations, constraints, `showprompt`, richer metadata controls, and feedback-based SQL refinement.

---

## Sources

- [Autonomous Database documentation - Generate SQL from Natural Language Prompts Using Select AI](https://docs.oracle.com/en-us/iaas/autonomous-database/doc/use-select-ai-generate-sql-natural-language-prompts.html)
- [Autonomous Database documentation - Use AI Keyword to Enter Prompts](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-keyword-prompts.html)
- [Autonomous Database release notes - Interact with metadata to improve Select AI SQL query generation](https://docs.oracle.com/en-us/iaas/releasenotes/autonomous-database-dedicated/adbd-selectai-sqlquerygen.htm)
- [Autonomous Database documentation - Examples of Using Select AI](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-examples.html)
- [SQL Developer Web documentation - Create AI Profile](https://docs.oracle.com/en/database/oracle/sql-developer-web/sdwad/create-ai-profile.html)
- [Autonomous Database documentation - Feedback](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-feedback.html)
