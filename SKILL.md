---
name: oracle-db-skills
description: 147 Oracle Database and OCR container reference guides covering SQL, PL/SQL, AI Database topics, performance tuning, security, ORDS, SQLcl, container images, migrations, and more. Load individual skill files on demand for expert guidance on any Oracle topic.
---

# Oracle DB Skills

A collection of 147 standalone reference guides for Oracle Database and OCR database-category container images. Each file covers one topic with explanations, practical examples, best practices, and common mistakes.

## How to Use

1. **Find the right skill** using the category routing table below. For AI and containers, prefer the category-specific sub-index when the question is still broad.
2. **Read only the file(s)** relevant to the user's task — do not load all files at once.
3. **Apply the guidance** to answer questions, generate code, or review existing work.

## Category Routing

| User asks about… | Read from |
|------------------|-----------|
| Backup, recovery, RMAN, redo/undo logs, users | `skills/admin/` |
| Select AI, AI Agent, AI Vector Search, vector indexes, semantic search, RAG on Oracle AI Database | `skills/ai/SKILLS.md` |
| JDBC, connection pooling, JSON, XML, spatial, full-text, transactions, property graphs | `skills/appdev/` |
| RAC, CDB/PDB, Exadata, In-Memory, OCI, ATP/ADW, Data Guard | `skills/architecture/` |
| ERD, data modeling, partitioning, tablespaces | `skills/design/` |
| Liquibase, Flyway, online operations, EBR, utPLSQL, git for SQL | `skills/devops/` |
| Advanced Queuing, DBMS_SCHEDULER, materialized views, DBLinks, APEX | `skills/features/` |
| Migrating from PostgreSQL, MySQL, SQL Server, MongoDB, etc. | `skills/migrations/` |
| Alert log, ADR, adrci, space, top SQL, health checks | `skills/monitoring/` |
| ORDS, REST APIs, OAuth2, AutoREST, PL/SQL gateway | `skills/ords/` |
| AWR, ASH, explain plan, indexes, optimizer stats, wait events, memory | `skills/performance/` |
| Packages, cursors, collections, error handling, unit testing, debugging | `skills/plsql/` |
| Privileges, VPD, TDE, encryption, auditing, network security | `skills/security/` |
| SQL patterns, window functions, CTEs, dynamic SQL, injection | `skills/sql-dev/` |
| SQLcl commands, scripting, Liquibase CLI, MCP server, CI/CD | `skills/sqlcl/` |
| Oracle Container Registry images, container pull commands, tags, and OCR repository selection | `skills/containers/SKILLS.md` |

## Skills Directory

```
skills/
├── admin/          Database administration (backup, recovery, users, redo/undo)
├── ai/             AI Database topics (Select AI, AI Agent, AI Vector Search, RAG guidance)
├── appdev/         Application development (JSON, XML, spatial, text, pooling)
├── architecture/   Infrastructure (RAC, Multitenant, Exadata, In-Memory, OCI)
├── containers/     OCR Database-category container repositories
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
└── sqlcl/          SQLcl CLI tool (basics, scripting, Liquibase, MCP server)
```

## Key Starting Points

- **`skills/ai/SKILLS.md`** — task router for the AI category
- **`skills/ai/ai-vector-search.md`** — entry point for Oracle AI Vector Search concepts and routing
- **`skills/ai/select-ai.md`** — entry point for Select AI concepts and routing
- **`skills/sqlcl/sqlcl-mcp-server.md`** — connecting AI assistants to Oracle via the SQLcl MCP server
- **`skills/migrations/migration-assessment.md`** — start here for any database migration project
- **`skills/performance/explain-plan.md`** — foundation for all SQL performance work
- **`skills/plsql/plsql-package-design.md`** — foundation for PL/SQL architecture questions
- **`skills/devops/schema-migrations.md`** — Liquibase/Flyway with Oracle in CI/CD pipelines
- **`skills/containers/container-selection-matrix.md`** — quick decision matrix for choosing the right OCR database-category image
