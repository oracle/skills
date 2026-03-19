# Oracle DB Skills — Agent Instructions

**Repository:** https://github.com/krisrice/oracle-db-skills
**Version:** 1.0.0

This repository is a collection of 117 standalone reference guides for Oracle Database. Each file covers one topic with explanations, practical examples, best practices, and common mistakes.

## How to Use This Collection

1. **Find the right skill** — scan `SKILLS.md` at the repo root for a flat index of all skills with descriptions, or use the category routing below.
2. **Load on demand** — read only the specific skill file(s) relevant to the user's task. Do not attempt to load all files at once.
3. **Apply the guidance** — use the content to answer questions, generate code, or review existing work.

## Directory Structure

```
skills/
├── admin/          Database administration (backup, recovery, users, redo/undo)
├── appdev/         Application development (JSON, XML, spatial, text, pooling)
├── architecture/   Infrastructure (RAC, Multitenant, Exadata, In-Memory, OCI)
├── design/         Schema design (ERD, modeling, partitioning, tablespaces)
├── devops/         CI/CD and DevOps (migrations, EBR, testing, version control)
├── features/       Oracle features (AQ, Scheduler, MVs, DBLinks, APEX)
├── migrations/     Migrating from other databases to Oracle
├── monitoring/     Diagnostics (alert log, ADR, health, space, top SQL)
├── ords/           Oracle REST Data Services
├── performance/    Tuning (AWR, ASH, indexes, optimizer, wait events, memory)
├── plsql/          PL/SQL development (packages, cursors, collections, testing)
├── security/       Security (privileges, VPD, TDE, auditing, network)
├── sql-dev/        SQL development (tuning, patterns, dynamic SQL, injection)
├── sqlcl/          SQLcl CLI tool (basics, scripting, Liquibase, MCP server)
└── frameworks/     Language frameworks (SQLAlchemy, Django, Pandas, Spring JPA, MyBatis, TypeORM, Sequelize, Dapper, GORM)
```

## Category Routing

| User asks about… | Load from |
|------------------|-----------|
| Backup, recovery, RMAN, Data Guard, redo/undo logs, users | `skills/admin/` |
| JDBC, connection pooling, JSON, XML, spatial, full-text, transactions, property graphs | `skills/appdev/` |
| RAC, CDB/PDB, Exadata, In-Memory, OCI, ATP/ADW | `skills/architecture/` |
| ERD, data modeling, partitioning, tablespaces | `skills/design/` |
| Liquibase, Flyway, online operations, EBR, utPLSQL, git for SQL | `skills/devops/` |
| Advanced Queuing, DBMS_SCHEDULER, materialized views, DBLinks, APEX | `skills/features/` |
| Vector search, SELECT AI, DBMS_VECTOR, AI profiles, embeddings, RAG | `skills/features/` (vector-search, select-ai, dbms-vector, ai-profiles) |
| Migrating from PostgreSQL, MySQL, SQL Server, MongoDB, etc. | `skills/migrations/` |
| Alert log, ADR, adrci, space, top SQL, health checks | `skills/monitoring/` |
| ORDS, REST APIs, OAuth2, AutoREST, PL/SQL gateway | `skills/ords/` |
| AWR, ASH, explain plan, indexes, optimizer stats, wait events, memory | `skills/performance/` |
| Packages, cursors, collections, error handling, unit testing, debugging | `skills/plsql/` |
| Privileges, VPD, TDE, encryption, auditing, network security | `skills/security/` |
| SQL patterns, window functions, CTEs, dynamic SQL, injection | `skills/sql-dev/` |
| SQLcl commands, scripting, Liquibase CLI, MCP server, CI/CD | `skills/sqlcl/` |
| SQLAlchemy, Django, Pandas, Spring JPA, MyBatis, TypeORM, Sequelize, Dapper, GORM | `skills/frameworks/` |
| Safe DML, idempotency, dry run, destructive operation guards | `skills/agent/` (safe-dml-patterns, destructive-op-guards, idempotency-patterns) |
| Natural language to SQL, schema introspection, clarification, ORA- errors | `skills/agent/` (nl-to-sql-patterns, schema-discovery, intent-disambiguation, ora-error-catalog) |
| Agent traceability, client identification, session context | `skills/agent/client-identification.md` |

## Key Skills to Know

- **`skills/sqlcl/sqlcl-mcp-server.md`** — how to connect AI assistants (including Claude) to Oracle via the SQLcl MCP server
- **`skills/migrations/migration-assessment.md`** — start here for any database migration project
- **`skills/performance/explain-plan.md`** — foundation for all SQL performance work
- **`skills/plsql/plsql-package-design.md`** — foundation for PL/SQL architecture questions
- **`skills/devops/schema-migrations.md`** — Liquibase/Flyway with Oracle in CI/CD pipelines
- **`skills/agent/schema-discovery.md`** — run these queries at the start of every agent session
- **`skills/agent/safe-dml-patterns.md`** — always apply before generating UPDATE/DELETE
- **`skills/features/select-ai.md`** — Oracle's built-in NL-to-SQL (Oracle 26ai)

## Agent Pre-Flight Checklist

Before taking any action on a database, an agent should run:

```sql
-- 1. Confirm identity and context
SELECT SYS_CONTEXT('USERENV','SESSION_USER') AS me,
       SYS_CONTEXT('USERENV','DB_NAME')      AS db,
       SYS_CONTEXT('USERENV','CON_NAME')     AS container
FROM   DUAL;

-- 2. Confirm Oracle version
SELECT banner FROM v$version WHERE banner LIKE 'Oracle%';

-- 3. Set client identification (so queries are traceable)
BEGIN
  DBMS_APPLICATION_INFO.SET_MODULE('claude-agent', 'session-start');
  DBMS_SESSION.SET_IDENTIFIER('claude-agent:' || SYS_CONTEXT('USERENV','SESSION_USER'));
END;
/

-- 4. Check available privileges
SELECT privilege FROM session_privs ORDER BY privilege;
```

See `skills/agent/schema-discovery.md` for the full startup sequence.

## Skill Composition: Multi-Step Tasks

Some tasks require loading multiple skills in sequence:

| Task | Load These Skills (in order) |
|---|---|
| **Diagnose a slow query** | `explain-plan` → `wait-events` → `optimizer-stats` → `awr-reports` |
| **Plan a database migration** | `migration-assessment` → `oracle-migration-tools` → *(source-specific migrate-*.md)* → `migration-cutover-strategy` |
| **Security audit** | `privilege-management` → `auditing` → `row-level-security` → `network-security` |
| **Set up RAG with Oracle** | `ai-profiles` → `vector-search` → `dbms-vector` |
| **Agent-safe schema change** | `schema-discovery` → `destructive-op-guards` → `idempotency-patterns` → `schema-migrations` |
| **Debug PL/SQL issue** | `plsql-error-handling` → `plsql-debugging` → `plsql-compiler-options` |
| **Tune database memory** | `memory-tuning` → `awr-reports` → `wait-events` |

## Agent Output Format Guidance

| Situation | Output Format |
|---|---|
| User asks for data (SELECT query) | Return SQL + results |
| User asks a diagnostic question | Return SQL + plain-English interpretation |
| User asks to modify data (UPDATE/DELETE) | Show affected row count first, wait for confirmation |
| User asks to drop or truncate | Show full impact analysis (dependencies, row count), wait for confirmation |
| User asks architectural/design question | Return prose explanation with code examples |
| User's request is ambiguous | Ask one specific clarifying question (see `intent-disambiguation.md`) |
| Agent encounters an ORA- error | Diagnose using `ora-error-catalog.md`, attempt self-correction |
