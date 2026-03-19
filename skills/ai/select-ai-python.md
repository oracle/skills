# Select AI for Python in Oracle AI Database

## Overview

Select AI for Python is Oracle's `select_ai` client library for using Select AI capabilities from Python. Oracle documents it as a Python surface over `DBMS_CLOUD_AI`, with support for profiles, conversations, vector indexes, synthetic data generation, feedback, and agent workflows.

Use this file when the question is specifically about using Select AI from Python, or when you need to choose between these Python implementation paths:

- the `select_ai` object model
- Python code that sends `SELECT AI ...` SQL to the database
- Python code that calls `DBMS_CLOUD_AI` or `DBMS_CLOUD_AI_AGENT`

For generic driver topics such as connection pooling, binds, LOBs, and low-level SQL execution, read `skills/appdev/python-oracledb.md`.

---

## Documentation Map

| Topic | Oracle documentation |
|---|---|
| Select AI for Python overview, supported platforms, classes | Oracle Database Select AI User's Guide, **Select AI for Python** |
| Python installation, connection, profile, action, async, vector-index examples | Oracle documentation, **Select AI for Python** |
| Python agent classes | Autonomous Database documentation, **Select AI Agent for Python** |
| Privilege and HTTP-access helper APIs | Oracle documentation, **Select AI for Python** |

---

## Choose the Python Entry Point

| If you need to... | Prefer | Read next |
|---|---|---|
| use a Python object model for profiles, conversations, vector indexes, or async workflows | `select_ai` | this file, then `select-ai-profiles.md` |
| issue one-off Select AI prompts from Python code that already executes SQL | `SELECT AI ...` through your existing driver path | `select-ai-actions.md` and `skills/appdev/python-oracledb.md` |
| invoke package-level Select AI or agent APIs from Python | `DBMS_CLOUD_AI` / `DBMS_CLOUD_AI_AGENT` through your existing driver path | `select-ai-actions.md`, `select-ai-profiles.md`, `select-ai-agent.md`, and `skills/appdev/python-oracledb.md` |
| use Python agent, vector-index, or async helper classes | `select_ai` | this file, then `select-ai-agent.md` or `select-ai-rag.md` |

The important distinction is that `select_ai` is a Python client library with its own classes, while `SELECT AI` and `DBMS_CLOUD_AI` remain database-side SQL and PL/SQL entry points.

---

## What the `select_ai` Library Adds

Oracle documents these Python-specific capabilities:

- synchronous and asynchronous connection helpers
- `Profile` and `ProfileAttributes`
- `Conversation` and `ConversationAttributes`
- `VectorIndex` and `VectorIndexAttributes`
- synthetic-data helpers
- privilege and HTTP-access helper functions
- `select_ai.agent` classes for tools, tasks, agents, and teams

Use `select_ai` when you want a Python-native object model instead of constructing every interaction as raw SQL or PL/SQL text.

---

## Install and Connect

Oracle documents installation from PyPI:

```bash
python3 -m pip install select_ai --upgrade --user
```

Oracle also documents that `select_ai` installs `python-oracledb` and `pandas` as dependencies.

Minimal synchronous connection:

```python
import select_ai

user = "<your_db_user>"
password = "<your_db_password>"
dsn = "<your_db_dsn>"

select_ai.connect(user=user, password=password, dsn=dsn)
```

Minimal asynchronous connection:

```python
import select_ai

user = "<your_db_user>"
password = "<your_db_password>"
dsn = "<your_db_dsn>"

await select_ai.async_connect(user=user, password=password, dsn=dsn)
```

Oracle documents that wallet and proxy-related parameters such as `wallet_location`, `wallet_password`, `https_proxy`, and `https_proxy_port` can also be passed to `connect()` and `async_connect()`.

---

## Profile-Centered Workflow

Oracle's Python documentation uses a profile object as the main workflow surface.

Documented profile creation pattern:

```python
import select_ai

provider = select_ai.OCIGenAIProvider(
    region="us-chicago-1", oci_apiformat="GENERIC"
)
profile_attributes = select_ai.ProfileAttributes(
    credential_name="my_oci_ai_profile_key",
    object_list=[{"owner": "SH"}],
    provider=provider,
)
profile = select_ai.Profile(
    profile_name="oci_ai_profile",
    attributes=profile_attributes,
    description="MY OCI AI Profile",
    replace=True,
)
```

This surface maps directly to the profile concepts covered in `select-ai-profiles.md`. Use this Python API when the application wants Python objects; use the database-side package procedures when the application prefers explicit SQL or PL/SQL calls.

---

## Prompt Actions from Python

Oracle documents profile methods that mirror the Select AI action families:

- `run_sql()`
- `show_sql()`
- `explain_sql()`
- `narrate()`
- `chat()`
- `show_prompt()`
- `summarize()`
- `translate()`
- feedback methods such as `add_positive_feedback()` and `add_negative_feedback()`

Documented action examples:

```python
import select_ai

profile = select_ai.Profile(profile_name="oci_ai_profile")

df = profile.run_sql(prompt="How many promotions ?")
response = profile.show_sql("How many promotions?")
answer = profile.chat(prompt="What is OCI ?")
```

Oracle documents `run_sql()` as the default action and shows it returning a pandas DataFrame.

Use this Python API when the application wants action methods on a profile object. If your code already uses SQL cursors and you only need the database-side syntax, use the documented `SELECT AI` and `DBMS_CLOUD_AI.GENERATE` paths in `select-ai-actions.md`.

---

## Async Workflows

Oracle documents asynchronous counterparts for connections, profiles, conversations, vector indexes, and agent objects.

Documented async profile example:

```python
import select_ai

await select_ai.async_connect(user=user, password=password, dsn=dsn)
async_profile = await select_ai.AsyncProfile(
    profile_name="async_oci_ai_profile",
)
df = await async_profile.run_sql("How many promotions?")
response = await async_profile.show_sql("How many promotions?")
```

Use the async surface when the application is already structured around `async` and `await`. Current Oracle documentation explicitly notes Python 3.14 support for Select AI for Python.

---

## Vector Index and Agent Routing

Oracle documents Python classes for vector-index and agent workflows:

- `VectorIndex` and `VectorIndexAttributes`
- `select_ai.agent.Tool`
- `select_ai.agent.Task`
- `select_ai.agent.Agent`
- `select_ai.agent.Team`
- async equivalents for both vector-index and agent objects

Use `select_ai` when you want those workflows modeled as Python objects. Then read:

- `select-ai-rag.md` for Select AI RAG and vector-index semantics
- `select-ai-agent.md` for database-side agent architecture, built-in tools, and `DBMS_CLOUD_AI_AGENT`

---

## Privileges and HTTP Access

Oracle documents privilege and HTTP access as separate setup areas.

Python helper APIs include:

- `select_ai.grant_privileges`
- `select_ai.revoke_privileges`
- `select_ai.grant_http_access`
- `select_ai.revoke_http_access`

Oracle also documents updated privilege coverage for `DBMS_CLOUD`, `DBMS_CLOUD_AI`, `DBMS_CLOUD_AI_AGENT`, and `DBMS_CLOUD_PIPELINE`.

Do not treat Python client setup as replacing the underlying database privilege model.

---

## Best Practices

- Choose one primary Python surface per workflow: `select_ai` object methods or explicit SQL/PL/SQL calls.
- Keep driver concerns in `skills/appdev/python-oracledb.md` and Select AI semantics in the `skills/ai/` files.
- Use `show_sql()` or `show_prompt()` during debugging before automating `run_sql()` flows.
- Use the same Select AI profile and metadata guidance from `select-ai-profiles.md`, `select-ai-metadata.md`, and `select-ai-accuracy.md` even when the caller is Python.
- Check platform certification before standardizing on `select_ai` outside Autonomous Database 19c and Autonomous AI Database 26ai.

---

## Common Mistakes

### Mistake 1: Treating `select_ai` as a Replacement for All Python Database Access

`select_ai` is a Select AI client library. It does not replace general SQL, pooling, LOB, or transaction guidance from `python-oracledb`.

### Mistake 2: Sending Python Driver Questions to the Wrong Skill

If the question is about pools, binds, thin versus thick mode, or generic SQL execution, use `skills/appdev/python-oracledb.md` instead of Select AI skills.

### Mistake 3: Treating Database-Side and Python-Side Entry Points as the Same Interface

The underlying capability is Select AI, but the user-facing surfaces differ. `select_ai.Profile.run_sql()` and `SELECT AI ...` are different implementation paths and should be routed differently.

### Mistake 4: Assuming `select_ai` Is Certified Everywhere

Oracle documents certification for Autonomous Database 19c and Autonomous AI Database 26ai, and states that other platforms may work but are not certified.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle Database 19c (generic):** `select_ai` is not a generic 19c baseline feature.
- **Autonomous Database 19c:** Oracle documents Select AI for Python as certified.
- **Autonomous AI Database 26ai:** Oracle documents Select AI for Python as certified. Current 26ai-era documentation includes async, vector-index, feedback, synthetic-data, and agent workflows.
- **Other platforms:** Oracle states that Select AI for Python may work on other platforms, but it is not certified there.

---

## Sources

- [Oracle Database Select AI User's Guide - Select AI for Python](https://docs.oracle.com/en/database/oracle/oracle-database/26/selai/select-ai-python.html)
- [Oracle documentation - Select AI for Python](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/pysai/G41793_03.pdf)
- [Autonomous Database documentation - Select AI Agent for Python](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-agent-python.html)
