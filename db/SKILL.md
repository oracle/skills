---
name: db
description: Oracle Database skills for administration, SQL and PL/SQL development, performance tuning, security, ORDS, SQLcl, migrations, frameworks, Oracle Container Registry guidance, and agent-safe database workflows.
---

# Oracle Database Skills

This domain contains Oracle Database skills for administration, SQL and PL/SQL development, performance tuning, security, ORDS, SQLcl, migrations, frameworks, OCR container guidance, and agent-safe database workflows.

## How to Use This Domain

1. Start with the routing table below.
2. Read only the specific file or category you need.

## Directory Structure

```text
db/
├── admin/
├── agent/
├── appdev/
├── architecture/
├── containers/
├── design/
├── devops/
├── features/
├── frameworks/
├── migrations/
├── monitoring/
├── ords/
├── performance/
├── plsql/
├── security/
├── sql-dev/
└── sqlcl/
```

## Category Routing

| Topic | Directory |
|-------|-----------|
| Backup, recovery, RMAN, Data Guard, redo/undo logs, users | `db/admin/` |
| Safe DML, destructive operation guards, idempotency, schema discovery, ORA- error handling | `db/agent/` |
| JDBC, pooling, JSON, XML, spatial, Oracle Text, transactions, MLE, language drivers | `db/appdev/` |
| RAC, Multitenant, Exadata, In-Memory, OCI database services, Data Guard architecture | `db/architecture/` |
| OCR database-category container images and pull guidance | `db/containers/` |
| ERD, data modeling, partitioning, tablespaces | `db/design/` |
| Schema migrations, online operations, edition-based redefinition, testing, version control | `db/devops/` |
| AQ, DBMS_SCHEDULER, materialized views, DBLinks, APEX, vector search, SELECT AI | `db/features/` |
| SQLAlchemy, Django, Pandas, Spring JPA, MyBatis, TypeORM, Sequelize, Dapper, GORM | `db/frameworks/` |
| Migrations from PostgreSQL, MySQL, SQL Server, MongoDB, Snowflake, and more | `db/migrations/` |
| Alert log, ADR, health monitor, space management, top SQL | `db/monitoring/` |
| ORDS architecture, installation, REST design, authentication, monitoring | `db/ords/` |
| AWR, ASH, explain plan, indexes, optimizer stats, wait events, memory | `db/performance/` |
| Package design, error handling, performance, collections, cursors, debugging | `db/plsql/` |
| Privileges, VPD, masking, auditing, encryption, network security | `db/security/` |
| SQL tuning, SQL patterns, dynamic SQL, injection avoidance | `db/sql-dev/` |
| SQLcl basics, scripting, Liquibase, formatting, DDL generation, data loading, MCP server, scheduler daemon, AWR, background jobs | `db/sqlcl/` |

## Key Starting Points

- `db/sqlcl/sqlcl-mcp-server.md`
- `db/migrations/migration-assessment.md`
- `db/performance/explain-plan.md`
- `db/plsql/plsql-package-design.md`
- `db/devops/schema-migrations.md`
- `db/agent/schema-discovery.md`
- `db/containers/container-selection-matrix.md`

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Diagnose a slow query | `explain-plan` → `wait-events` → `optimizer-stats` → `awr-reports` |
| Plan a migration | `migration-assessment` → `oracle-migration-tools` → source-specific `migrate-*.md` → `migration-cutover-strategy` |
| Build RAG on Oracle Database | `ai-profiles` → `vector-search` → `dbms-vector` |
| Perform agent-safe schema change | `schema-discovery` → `destructive-op-guards` → `idempotency-patterns` → `schema-migrations` |
| Set up AI-driven database access via MCP | `sqlcl-basics` (save connections) → `security/privilege-management` (least-privilege user) → `sqlcl-mcp-server` (configure + start) |
