---
name: db
description: Oracle Database guidance for SQL, PL/SQL, SQLcl, ORDS, administration, app development, performance, security, migrations, Maximum Availability Architecture (MAA), and agent-safe database workflows. Use when the user asks to write, edit, rewrite, review, format, debug, tune, or explain SQL; create or refactor PL/SQL; use SQLcl, Liquibase, ORDS, JDBC, node-oracledb, Python, Java, .NET, or database frameworks; troubleshoot queries, sessions, locks, waits, indexes, optimizer plans, AWR, ASH, migrations, schemas, users, roles, privileges, backup, recovery, Data Guard, RAC, Exadata, MAA tiers, Oracle Update Advisor, multicloud MAA, multitenant, containers, monitoring, auditing, encryption, VPD, or safe agent database operations.
---

# Oracle Database Skills

This domain contains Oracle Database skills for administration, SQL and PL/SQL development, performance tuning, security, ORDS, SQLcl, migrations, Maximum Availability Architecture, frameworks, OCR container guidance, and agent-safe database workflows.

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
├── backup-recovery/
├── containers/
├── design/
├── devops/
├── features/
├── frameworks/
├── maa/
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
| Data Guard, redo/undo logs, users | `db/admin/` |
| Safe DML, destructive operation guards, idempotency, schema discovery, ORA- error handling | `db/agent/` |
| JDBC, pooling, JSON, XML, spatial, Oracle Text, transactions, MLE, language drivers | `db/appdev/` |
| RAC, Multitenant, Exadata, In-Memory, OCI database services, Data Guard architecture | `db/architecture/` |
| Backup, recovery, RMAN, Autonomous Recovery Service, Cloud Protect | `db/backup-recovery/` |
| OCR database-category container images and pull guidance | `db/containers/` |
| ERD, data modeling, partitioning, tablespaces | `db/design/` |
| Schema migrations, online operations, edition-based redefinition, testing, version control | `db/devops/` |
| AQ, DBMS_SCHEDULER, materialized views, DBLinks, APEX, vector search, SELECT AI | `db/features/` |
| SQLAlchemy, Django, Pandas, Spring JPA, MyBatis, TypeORM, Sequelize, Dapper, GORM | `db/frameworks/` |
| Maximum Availability Architecture, MAA tiers, Data Guard/RAC/Exadata MAA, Oracle Update Advisor, Edition-Based Redefinition, ZDLRA, multicloud MAA, mission-critical availability | `db/maa/` |
| Migrations from PostgreSQL, MySQL, SQL Server, MongoDB, Snowflake, and more | `db/migrations/` |
| Alert log, ADR, health monitor, space management, top SQL | `db/monitoring/` |
| ORDS architecture, installation, REST design, authentication, monitoring, ORDS Concert Sample App | `db/ords/` |
| AWR, ASH, explain plan, indexes, optimizer stats, wait events, memory | `db/performance/` |
| Package design, error handling, performance, collections, cursors, debugging | `db/plsql/` |
| Privileges, VPD, masking, auditing, encryption, network security | `db/security/` |
| SQL tuning, SQL patterns, dynamic SQL, injection avoidance | `db/sql-dev/` |
| SQLcl basics, scripting, Liquibase, formatting, DDL generation, data loading, MCP server, scheduler daemon, AWR, background jobs, schema comparison with DIFF | `db/sqlcl/` |

## Key Starting Points

- `db/sqlcl/sqlcl-mcp-server.md`
- `db/migrations/migration-assessment.md`
- `db/performance/explain-plan.md`
- `db/plsql/plsql-package-design.md`
- `db/appdev/java-oracle-jdbc.md`
- `db/devops/schema-migrations.md`
- `db/agent/schema-discovery.md`
- `db/containers/container-selection-matrix.md`
- `db/maa/maa-overview.md`
- `db/backup-recovery/autonomous-recovery-service.md`
- `db/backup-recovery/cloud-protect.md`

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Diagnose a slow query | `explain-plan` → `wait-events` → `optimizer-stats` → `awr-reports` |
| Plan a migration | `migration-assessment` → `oracle-migration-tools` → source-specific `migrate-*.md` → `migration-cutover-strategy` |
| Build RAG on Oracle Database | `ai-profiles` → `vector-search` → `dbms-vector` |
| Build a Java JDBC service | `java-oracle-jdbc` → `java-oracle-jdbc/dependencies` → `java-oracle-jdbc/connections` → `java-oracle-jdbc/sql` → `java-oracle-jdbc/pooling-production` |
| Perform agent-safe schema change | `schema-discovery` → `destructive-op-guards` → `idempotency-patterns` → `schema-migrations` |
| Set up AI-driven database access via MCP | `sqlcl-basics` (save connections) → `security/privilege-management` (least-privilege user) → `sqlcl-mcp-server` (configure + start) |
| Answer an MAA architecture or availability question | `maa-overview` → `maa-knowledge-sources` → relevant product documentation |
