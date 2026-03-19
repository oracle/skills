# Intent Disambiguation for Agent SQL Generation

Not every user request is specific enough for an agent to act on safely. This skill defines when agents should ask for clarification before generating or executing SQL, and provides question templates and safe default rules.

## The Core Rule

**Destructive or ambiguous operations require clarification. Read-only and clearly-scoped operations can proceed.**

| Operation Type | Proceed? | Action |
|---|---|---|
| `SELECT` with clear scope | Yes | Generate and run |
| `SELECT` with vague scope ("show me employees") | Clarify | Ask which schema/table/filter |
| `INSERT` of a single, clearly-specified row | Yes | Generate and run |
| `UPDATE` with specific WHERE clause | Yes | Show count first, then run |
| `UPDATE` without WHERE or vague scope | Clarify | Must identify affected rows |
| `DELETE` with specific WHERE clause | Clarify | Show count, get confirmation |
| `DELETE` without WHERE | Must clarify | Never proceed without explicit confirmation |
| `DROP TABLE/INDEX/VIEW` | Must clarify | Always confirm with impact analysis |
| `TRUNCATE` | Must clarify | Always confirm; note it cannot be rolled back |
| Schema introspection | Yes | Always safe |

## Common Ambiguous Patterns and What to Ask

### "Delete old records"

```
User: "Delete old records from the orders table"

Agent should ask:
  1. What schema/owner is the orders table in?
  2. What defines "old"? (order_date before a specific date? last X days?)
  3. Should this be a hard delete (remove rows) or soft delete (set a status flag)?
  4. Should cancelled orders be included, or only completed orders?

Template question:
"To delete old orders safely, I need a few details:
 - Which schema? (e.g., SALES.ORDERS)
 - What date threshold defines 'old'? (e.g., older than 2 years)
 - Hard delete or set a status like ARCHIVED?
 Before deleting, I'll show you a row count so you can confirm the scope."
```

### "Update the status"

```
User: "Update the status to SHIPPED"

Agent should ask:
  1. Which table?
  2. Which rows should be updated? (all pending orders? a specific order ID?)
  3. Any other fields to update at the same time? (e.g., shipped_date = SYSDATE)

Template question:
"Which orders should be updated to SHIPPED? Please provide:
 - A specific order ID, or
 - A filter condition (e.g., all orders with status PROCESSING created before today)"
```

### "Add a user"

```
User: "Add a user named John"

Agent should ask:
  1. Database user or application user (in an app-layer user table)?
  2. If DB user: what password, default tablespace, and roles/privileges?
  3. If app user: which table? what columns?

Template question:
"Should I create a database user (CREATE USER) or insert a record in an application user table?
 If a database user, what roles should they have? (e.g., read-only, developer, DBA)"
```

### "Optimize this query"

```
User: "Optimize this query: SELECT * FROM orders WHERE customer_id = 123"

Agent should ask (or check first):
  1. Is this a one-time execution or recurring? (hint vs index)
  2. Is this a performance emergency (current session slow) or tuning exercise?
  3. Are there existing indexes on customer_id?

Agent can often proceed with: check EXPLAIN PLAN, check existing indexes,
suggest index creation or hint — without asking if scope is read-only.
```

### "Backup the database"

```
User: "Back up the database"

Agent should ask:
  1. Full RMAN backup, or export/Data Pump of specific schemas?
  2. To disk (local) or tape/cloud?
  3. Is this a one-time operation or scheduled job?

This operation requires DBA privileges — confirm the agent has them.
```

### "Show me everything"

```
User: "Show me everything in the HR schema"

Clarify scope:
  - "Everything" = all tables and their row counts? Table DDL? Sample data?
  - Start with a schema summary (object counts by type) and ask what to drill into.
```

### "Create a report"

```
User: "Create a report on monthly sales"

Could mean:
  - CREATE VIEW that wraps the aggregation query
  - A SELECT query to run on demand and display results
  - INSERT results into a report staging table
  - Generate an HTML/PDF output file
  - Schedule a report job via DBMS_SCHEDULER

Agent should ask:
  1. Should this be saved (as a view or table) or run on demand?
  2. Who will consume it — a person viewing query output, an application, or a scheduled export?

Template question:
"What should the report produce? Options:
 - A saved view I can query whenever needed
 - A one-time query to run now
 - A scheduled job that exports results
 What format and destination do you need?"
```

### "Migrate data"

```
User: "Migrate the customer data"

Could mean:
  - INSERT INTO ... SELECT from another table or schema in the same database
  - Use Data Pump (expdp/impdp) to export and import between environments
  - Use a DB Link to pull data from a remote database
  - Move data between environments (dev → prod)
  - Copy with transformation (cleansing, mapping, type conversion)

Agent should ask:
  1. Where is the source — same schema, different schema, or a different database?
  2. Is transformation required, or is it a straight copy?

Template question:
"Where is the data coming from?
 - Same database, different schema (e.g., DEV.CUSTOMERS → PROD.CUSTOMERS)?
 - A different database (requires DB Link or Data Pump)?
 Should the data be copied as-is or transformed during migration?"
```

### "Fix the performance"

```
User: "Fix the performance of this query"

Could mean:
  - Add an index on a frequently filtered column
  - Gather or update optimizer statistics
  - Rewrite the SQL (eliminate redundant joins, push filters)
  - Change optimizer hints
  - Resize SGA/PGA memory (DBA-level)
  - Partition the table for partition pruning
  - Enable result cache for repeated identical queries

Agent should ask:
  1. What specific query or operation is slow?
  2. Is there an execution plan (EXPLAIN PLAN / DBMS_XPLAN) or AWR/ASH data available?

Agent can often proceed with: check EXPLAIN PLAN, check existing indexes,
suggest an index or rewrite — without asking if the query text is provided.

Template question:
"To diagnose the performance issue, can you share:
 - The SQL text (if not already provided)
 - The execution plan (run: EXPLAIN PLAN FOR <query>; SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);)
 - Approximate row counts for the main tables involved"
```

### "Add logging"

```
User: "Add logging to the orders table"

Could mean:
  - Add DML audit via UNIFIED AUDITING (who changed what, when)
  - Add DBMS_APPLICATION_INFO calls in application code (what the app is doing)
  - Add a trigger to log row-level changes to a history/audit table
  - Add an application-level error logging table
  - Enable Oracle redo-based supplemental logging for GoldenGate/CDC

Agent should ask:
  1. What type of logging is needed: who changed data (audit), what the application
     is doing (application tracing), or capturing errors (error logging)?

Template question:
"What should the logging capture?
 - Who changed data and when (audit trail via UNIFIED AUDITING or a log table)?
 - What the application or agent is doing at each step (application tracing)?
 - Errors and exceptions only (error logging table)?
 The implementation differs significantly for each."
```

## One-Question-at-a-Time Rule

When clarification is needed, ask one focused question per turn. Do not front-load multiple clarifying questions. Choose the single most important unknown first, get the answer, then ask the next question if still needed.

**BAD — too many questions at once:**

```
"Before I proceed, I need to know:
 (1) which schema?
 (2) what rows should be deleted?
 (3) should I use DELETE or TRUNCATE?
 (4) do you need a backup first?"
```

**GOOD — one question at a time:**

```
"Which schema are you working in?"

[User answers: SALES]

"Got it. Which rows should be deleted — all rows, or specific ones based on a condition?"

[User answers: orders older than 2 years]

"Understood. I'll delete rows where order_date < ADD_MONTHS(SYSDATE, -24).
 This affects 4,302 rows. Shall I proceed?"
```

The most important unknown is usually: **what object** → then **which rows** → then **what action**.

## DBA Escalation Pattern

Some operations must be escalated to a human DBA rather than attempted autonomously by an agent. When asked to perform any of the following, the agent should prepare the SQL for review but not execute it.

| Operation | Reason to Escalate |
|---|---|
| `ALTER SYSTEM KILL SESSION` | Terminates another user's session; risk of data loss or application disruption |
| `ALTER DATABASE` | Instance-level structural changes; can make the database unusable |
| `DROP USER ... CASCADE` | Irreversibly drops all objects owned by that user |
| `CREATE TABLESPACE` / `DROP TABLESPACE` | Affects physical storage allocation; DROP is irreversible |
| `SHUTDOWN` / `STARTUP` | Brings the entire instance down or up |
| Any operation on `SYS` or `SYSTEM` schema | Core data dictionary; corruption can be unrecoverable |
| Modifying `init.ora` / `spfile` parameters that require restart | Misconfiguration can prevent the database from starting |
| Resizing or adding datafiles | Physical storage change; requires DBA knowledge of capacity planning |

For each of these, the agent should respond:

```
"This operation requires DBA access. I can prepare the SQL for a DBA to review
 and execute, but I will not run it autonomously.

 Here is the statement for DBA review:
 [SQL statement]

 Please have a DBA verify and execute this in the appropriate environment."
```

## Safe Default Rules

When in doubt, apply these defaults without asking:

1. **Read before write** — run `SELECT` and `EXPLAIN PLAN` before any DML
2. **Count before delete** — always run `SELECT COUNT(*)` with the same WHERE before `DELETE`
3. **Show before execute** — for any multi-row UPDATE or DELETE, show affected rows first
4. **Explain before run** — for any query that might be slow (large tables, no WHERE), show the plan first
5. **Schema first** — before generating DML for a table, check `ALL_TAB_COLUMNS` to verify column names and types
6. **SAVEPOINT before destructive** — wrap multi-step operations in SAVEPOINT so partial failures can roll back

## Disambiguation Question Templates

```
-- Template 1: Missing table
"Which table should I [operation] in? (e.g., SCHEMA.TABLE_NAME)"

-- Template 2: Missing filter
"Which rows should be affected? Please provide a condition such as:
 - A specific ID (e.g., order_id = 1234)
 - A date range (e.g., created before 2024-01-01)
 - A status value (e.g., status = 'CANCELLED')"

-- Template 3: Scope confirmation
"This will affect [N] rows in [TABLE]. Shall I proceed?
 Preview of first 5 rows: [SELECT ... FETCH FIRST 5 ROWS ONLY results]"

-- Template 4: Destructive operation
"Before [DROP/TRUNCATE], note:
 - This table has [N] rows
 - [M] objects depend on it: [list]
 - [DROP goes to recycle bin / TRUNCATE cannot be rolled back]
 Do you want to proceed?"
```

## What Agents Should Never Do Without Explicit Confirmation

- Execute `DELETE` or `UPDATE` without showing affected row count first
- Execute `DROP TABLE`, `DROP USER`, or `TRUNCATE TABLE` without full impact analysis
- Grant or revoke privileges
- Create new users or schemas
- Modify `init.ora` / `spfile` parameters
- Kill sessions (`ALTER SYSTEM KILL SESSION`)
- Execute `SHUTDOWN` or `STARTUP`

## Best Practices

- When clarifying, be specific about what information you need and why — vague questions frustrate users
- Offer concrete examples in clarification questions ("e.g., order_date < '2022-01-01'")
- After clarification, restate your understanding before executing: "I will delete 847 rows from SALES.ORDERS where order_date < 2022-01-01. Proceeding..."
- For schema introspection requests, always proceed without asking — it's always safe

## Oracle Version Notes (19c vs 26ai)

All patterns in this skill are behavioral/process guidelines independent of Oracle version.

## See Also

- [Safe DML Patterns](../agent/safe-dml-patterns.md) — Technical safety guards for DML operations
- [Destructive Operation Guards](../agent/destructive-op-guards.md) — Pre-flight checks for DROP/TRUNCATE
- [NL to SQL Mapping Patterns](../agent/nl-to-sql-patterns.md) — Mapping clear NL intents to SQL
- [Schema Discovery Queries](../agent/schema-discovery.md) — Introspecting the database before acting
