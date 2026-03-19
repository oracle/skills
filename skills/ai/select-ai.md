# Select AI in Oracle AI Database

## Overview

Select AI adds natural-language interfaces on top of Oracle Database and Autonomous Database. Oracle documents it as covering NL2SQL, SQL explanation, prompt inspection, feedback-driven SQL refinement, retrieval augmented generation (RAG), synthetic data generation, and agent workflows.

This file is the entry point for the Select AI skill set. Start here when the question is broad, then load the narrower skill that matches the task.

---

## Documentation Map

| Topic | Oracle documentation |
|---|---|
| Concepts, supported platforms, and workflow | Oracle Database Select AI User's Guide, **About Select AI** |
| Capability coverage by release | Oracle Database Select AI Capability Matrix |
| Prompt actions and `SELECT AI` keyword | Autonomous Database documentation, **Use AI Keyword to Enter Prompts** |
| Action and feedback examples | Autonomous Database documentation, **Examples of Using Select AI** |
| AI profiles and attributes | Autonomous Database documentation, **DBMS_CLOUD_AI Package** |
| Metadata controls and object-list modes | SQL Developer Web documentation, **Create AI Profile** |
| Agent workflows | Oracle Database Select AI User's Guide, **Select AI Agent** |

---

## Start Here When

- you need a broad orientation to Select AI before reading implementation details
- you are not yet sure whether the task is mainly about profiles, actions, metadata, feedback, RAG, or agents
- you want the right next skill instead of reading every Select AI file

If you already know the exact task, go straight to `skills/ai/SKILLS.md` or use the routing table below.

---

## Minimal Workflow

Oracle's current Select AI documentation fits this mental model:

1. Create and enable an AI profile.
2. Choose an action such as `showsql`, `runsql`, `chat`, `showprompt`, `feedback`, or `agent`.
3. Control prompt augmentation with `object_list`, comments, constraints, annotations, or RAG sources.
4. Add feedback, synthetic data generation, or agent teams only when the workflow requires them.

Minimal documented entry points:

```sql
BEGIN
  DBMS_CLOUD_AI.SET_PROFILE(profile_name => 'OPENAI');
END;
/

SELECT AI showsql how many customers exist;

SELECT DBMS_CLOUD_AI.GENERATE(prompt       => 'how many customers exist',
                              profile_name => 'OPENAI',
                              action       => 'showsql')
FROM dual;
```

Use `DBMS_CLOUD_AI.GENERATE` when `SELECT AI` is not supported in the client surface.

---

## Routing by Task

| Task | Read next |
|------|-----------|
| improve overall Select AI NL2SQL accuracy | `select-ai-accuracy.md` |
| design and audit Select AI annotations | `select-ai-annotations.md` |
| configure providers, credentials, models, or session activation | `select-ai-profiles.md` |
| shape prompts, inspect prompt augmentation, or decide between `showsql`, `explainsql`, and `showprompt` | `select-ai-prompts.md` |
| choose between `showsql`, `runsql`, `showprompt`, `chat`, `translate`, `summarize`, or `agent` | `select-ai-actions.md` |
| improve SQL generation with `object_list`, comments, annotations, or constraints | `select-ai-metadata.md` |
| refine generated SQL with `feedback` or `DBMS_CLOUD_AI.FEEDBACK` | `select-ai-feedback.md` |
| use Select AI with vector-store-backed RAG | `select-ai-rag.md` |
| generate synthetic data | `select-ai-synthetic-data.md` |
| build teams, agents, tasks, or tools with `DBMS_CLOUD_AI_AGENT` | `select-ai-agent.md` |

For the full task index across the AI category, read `skills/ai/SKILLS.md`.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle Database 19c (generic):** Select AI is not part of the generic 19c baseline.
- **Autonomous AI Database 19c / Oracle AI Database 19.30:** Core profile and action workflows are documented, but newer features such as `feedback`, agent workflows, synthetic data generation, `annotations`, and automated object-list mode are not part of the generic 19c baseline.
- **Oracle AI Database 23.26.1 / 26ai docs:** Current documentation includes the broadest Select AI surface, including `feedback`, RAG integration, agent workflows, synthetic data generation, `annotations`, and automated object selection.

---

## Sources

- [Oracle Database Select AI User's Guide - About Select AI](https://docs.oracle.com/en/database/oracle/oracle-database/26/selai/select-ai-about.html)
- [Oracle Database Select AI Capability Matrix](https://docs.oracle.com/en/database/oracle/oracle-database/26/saicm/index.html)
- [Autonomous Database documentation - Use AI Keyword to Enter Prompts](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-keyword-prompts.html)
- [Autonomous Database documentation - Examples of Using Select AI](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-examples.html)
- [Autonomous Database documentation - DBMS_CLOUD_AI Package](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/dbms-cloud-ai-package.html)
- [SQL Developer Web documentation - Create AI Profile](https://docs.oracle.com/en/database/oracle/sql-developer-web/sdwad/create-ai-profile.html)
