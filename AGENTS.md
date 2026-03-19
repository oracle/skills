# Oracle DB Skills — Agent Instructions

This repository is a collection of 147 standalone reference guides for Oracle Database and Oracle Container Registry database-category images. Each file covers one topic with explanations, practical examples, best practices, and common mistakes.

## How to Use This Collection

1. **Find the right skill** — scan `SKILLS.md` at the repo root for a flat index of all skills with descriptions, or use the category routing below. For AI and containers, prefer the category-specific sub-index when the question is still broad.
2. **Load on demand** — read only the specific skill file(s) relevant to the user's task. Do not attempt to load all files at once.
3. **Apply the guidance** — use the content to answer questions, generate code, or review existing work.

## Directory Structure

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

## Category Routing

| User asks about… | Load from |
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

## Key Skills to Know

- **`skills/ai/SKILLS.md`** — task router for the AI category
- **`skills/ai/ai-vector-search.md`** — entry point for Oracle AI Vector Search concepts and routing
- **`skills/ai/select-ai.md`** — entry point for Select AI concepts and routing
- **`skills/sqlcl/sqlcl-mcp-server.md`** — how to connect AI assistants (including Claude) to Oracle via the SQLcl MCP server
- **`skills/migrations/migration-assessment.md`** — start here for any database migration project
- **`skills/performance/explain-plan.md`** — foundation for all SQL performance work
- **`skills/plsql/plsql-package-design.md`** — foundation for PL/SQL architecture questions
- **`skills/devops/schema-migrations.md`** — Liquibase/Flyway with Oracle in CI/CD pipelines
- **`skills/containers/container-selection-matrix.md`** — quick decision matrix for choosing the right OCR database-category image

For the complete AI index and task router: `skills/ai/SKILLS.md`

## Common Container Skills (Primary)

- **`skills/containers/adb-free.md`** — Autonomous Database Free container image with ADW/ATP guidance
- **`skills/containers/enterprise.md`** — Oracle AI Database 26ai Enterprise Edition container image
- **`skills/containers/free.md`** — Oracle AI Database 26ai Free container image
- **`skills/containers/instantclient.md`** — Oracle Instant Client image for client tools/libraries
- **`skills/containers/ords.md`** — supported ORDS container image repository
- **`skills/containers/rac.md`** — Oracle RAC container deployment guidance for Podman
- **`skills/containers/sqlcl.md`** — Oracle SQL Command Line (SQLcl) container image repository

For the complete container index (including advanced/niche): `skills/containers/SKILLS.md`
