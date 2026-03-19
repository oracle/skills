# Oracle DB Skills

**Repository:** https://github.com/krisrice/oracle-db-skills
**Version:** 1.0.0

Oracle DB Skills is a curated library of 100+ practical, documentation-backed guides for working with Oracle Database, organized by domain: SQL and PL/SQL development, performance tuning, security, administration, monitoring, architecture, DevOps, migrations, SQLcl, ORDS, and Oracle-specific features. Each guide includes actionable examples, best practices, common pitfalls, sources, and explicit Oracle version compatibility notes for 19c and 26ai.

## Version Coverage Standard

- Skills that include version-specific behavior must include a section named `## Oracle Version Notes (19c vs 26ai)`.
- Use Oracle Database 19c as the baseline compatibility target unless stated otherwise.
- Explicitly call out features that require newer releases and provide 19c-compatible alternatives where practical.

## GitHub Ruleset

- Default-branch ruleset definition is stored in `.github/rulesets/main.json`.
- Apply it with:
  - `export GITHUB_TOKEN=<token-with-repo-admin-permission>`
  - `./scripts/apply-github-ruleset.sh krisrice oracle-db-skills`

---

## Categories

| Category | Files | Path |
|----------|-------|------|
| [Database Design & Modeling](#database-design--modeling) | 4 | `skills/design/` |
| [SQL Development](#sql-development) | 5 | `skills/sql-dev/` |
| [Performance & Tuning](#performance--tuning) | 7 | `skills/performance/` |
| [Application Development](#application-development) | 14 | `skills/appdev/` |
| [Security](#security) | 6 | `skills/security/` |
| [Administration](#administration) | 6 | `skills/admin/` |
| [Monitoring & Diagnostics](#monitoring--diagnostics) | 5 | `skills/monitoring/` |
| [Architecture & Infrastructure](#architecture--infrastructure) | 5 | `skills/architecture/` |
| [DevOps & CI/CD](#devops--cicd) | 5 | `skills/devops/` |
| [Migrations to Oracle](#migrations-to-oracle) | 14 | `skills/migrations/` |
| [PL/SQL Development](#plsql-development) | 12 | `skills/plsql/` |
| [Oracle-Specific Features](#oracle-specific-features) | 6 | `skills/features/` |
| [SQLcl](#sqlcl) | 8 | `skills/sqlcl/` |
| [ORDS (Oracle REST Data Services)](#ords-oracle-rest-data-services) | 10 | `skills/ords/` |
| [Frameworks](#frameworks) | 9 | `skills/frameworks/` |

---

## Database Design & Modeling

`skills/design/`

| File | Description |
|------|-------------|
| `erd-design.md` | Entity relationship design, normalization (1NF–5NF), Oracle naming conventions, reserved words |
| `data-modeling.md` | Logical vs physical modeling, star/snowflake schemas, ODS, SCD types |
| `partitioning-strategy.md` | Range, list, hash, composite partitioning, partition pruning, local vs global indexes |
| `tablespace-design.md` | Sizing, bigfile vs smallfile, ASSM vs MSSM, production layout patterns |

---

## SQL Development

`skills/sql-dev/`

| File | Description |
|------|-------------|
| `sql-tuning.md` | Execution plans, optimizer hints, SQL profiles, plan baselines |
| `sql-injection-avoidance.md` | Bind variables, DBMS_ASSERT, safe dynamic SQL patterns |
| `pl-sql-best-practices.md` | BULK COLLECT/FORALL, exception handling, cursor management, package structure |
| `sql-patterns.md` | Window functions, CTEs, CONNECT BY, PIVOT/UNPIVOT, MERGE, MODEL clause |
| `dynamic-sql.md` | EXECUTE IMMEDIATE, DBMS_SQL, parse-once/execute-many, injection prevention |

---

## Performance & Tuning

`skills/performance/`

| File | Description |
|------|-------------|
| `awr-reports.md` | Generating and reading AWR reports, key sections, baselines, bottleneck identification |
| `ash-analysis.md` | Active Session History, real-time vs historical analysis, ASH report generation |
| `explain-plan.md` | DBMS_XPLAN, reading execution plans, autotrace, identifying bad plans |
| `index-strategy.md` | B-tree, bitmap, function-based, composite, invisible indexes; rebuild vs coalesce |
| `optimizer-stats.md` | DBMS_STATS, histograms, extended statistics, pending stats, incremental stats |
| `wait-events.md` | Common wait events, diagnosis queries, remediation for each event type |
| `memory-tuning.md` | SGA components, PGA management, AMM vs ASMM, advisory views |

---

## Application Development

`skills/appdev/`

| File | Description |
|------|-------------|
| `connection-pooling.md` | UCP, DRCP, pool sizing, connection validation, JDBC/Python/Node.js examples |
| `transaction-management.md` | ACID properties, savepoints, autonomous transactions, distributed transactions |
| `locking-concurrency.md` | MVCC, SELECT FOR UPDATE, NOWAIT/SKIP LOCKED, deadlock avoidance |
| `sequences-identity.md` | Sequence caching, identity columns, UUID alternatives, gap behavior |
| `json-in-oracle.md` | Native JSON type, JSON_VALUE/QUERY/TABLE, JSON Duality Views (23c) |
| `xml-in-oracle.md` | XMLType storage, XQuery, XMLTable, XML indexes, XMLDB repository |
| `spatial-data.md` | SDO_GEOMETRY, spatial indexes, SDO_RELATE, coordinate systems |
| `oracle-text.md` | CONTEXT/CTXCAT indexes, CONTAINS, fuzzy/stemming, HIGHLIGHT/SNIPPET |
| `sql-property-graph.md` | SQL Property Graph DDL, GRAPH_TABLE, MATCH patterns, quantified paths (23ai+) |
| `python-oracledb.md` | python-oracledb driver, thin/thick mode, bind variables, pooling, async |
| `java-oracle-jdbc.md` | JDBC thin driver, UCP, PreparedStatement, array binding, Spring Boot |
| `nodejs-oracledb.md` | node-oracledb driver, async/await, pools, result sets, LOBs |
| `dotnet-oracle.md` | ODP.NET managed driver, EF Core, array binding, OracleParameter |
| `golang-oracle.md` | godror driver, database/sql interface, named binds, REF CURSORs |

---

## Security

`skills/security/`

| File | Description |
|------|-------------|
| `privilege-management.md` | Least privilege, roles, DBMS_PRIVILEGE_CAPTURE, avoiding PUBLIC grants |
| `row-level-security.md` | VPD/FGAC, DBMS_RLS, application contexts, all policy types |
| `data-masking.md` | Oracle Data Redaction (DBMS_REDACT), full/partial/regexp/random redaction |
| `auditing.md` | Unified Auditing, CREATE AUDIT POLICY, fine-grained auditing (DBMS_FGA) |
| `encryption.md` | TDE, Oracle Wallet setup, tablespace/column encryption, key rotation |
| `network-security.md` | SSL/TLS, sqlnet.ora encryption, ACLs for network packages, listener hardening |

---

## Administration

`skills/admin/`

| File | Description |
|------|-------------|
| `backup-recovery.md` | RMAN architecture, backup sets vs image copies, incremental backups, recovery scenarios |
| `dataguard.md` | Physical/logical standby, Data Guard Broker, switchover vs failover, Active Data Guard |
| `rman-basics.md` | Common RMAN commands, channel config, compression, encryption, reporting |
| `undo-management.md` | Undo sizing, UNDO_RETENTION, ORA-01555 causes and prevention, Undo Advisor |
| `redo-log-management.md` | Log sizing, archivelog mode, multiplexing, switch frequency monitoring |
| `user-management.md` | CREATE USER, profiles, password policies, proxy authentication, CDB/PDB users |

---

## Monitoring & Diagnostics

`skills/monitoring/`

| File | Description |
|------|-------------|
| `alert-log-analysis.md` | Alert log location, critical ORA- errors, automated monitoring patterns |
| `adrci-usage.md` | ADR repository, adrci commands, IPS packaging, incident correlation |
| `health-monitor.md` | DBMS_HM health checks, SQL Tuning Advisor, Segment Advisor, Memory Advisor |
| `space-management.md` | Tablespace monitoring, HWM, SHRINK SPACE vs MOVE, LOB space, temp space |
| `top-sql-queries.md` | V$SQL/V$SQLAREA, top SQL by resource, AWR top SQL, V$SQL_MONITOR |

---

## Architecture & Infrastructure

`skills/architecture/`

| File | Description |
|------|-------------|
| `rac-concepts.md` | Cache Fusion, GCS/GES, services, node affinity, RAC wait events, TAF/FCF |
| `multitenant.md` | CDB/PDB architecture, cloning, plugging/unplugging, resource management, Application Containers |
| `oracle-cloud-oci.md` | ATP, ADW, Base Database Service, ExaCS, connection methods, Free Tier |
| `exadata-features.md` | Smart Scan, Storage Indexes, HCC compression, IORM, offload monitoring |
| `inmemory-column-store.md` | IMCS architecture, populating objects, Join Groups, In-Memory Aggregation, AIM |

---

## DevOps & CI/CD

`skills/devops/`

| File | Description |
|------|-------------|
| `schema-migrations.md` | Liquibase and Flyway with Oracle, versioned vs repeatable migrations, CI/CD pipelines |
| `online-operations.md` | DBMS_REDEFINITION, online index rebuild/creation, ALTER TABLE ONLINE |
| `edition-based-redefinition.md` | EBR for zero-downtime deployments, editioning views, crossedition triggers |
| `database-testing.md` | utPLSQL framework, assertions, mocking, code coverage, GitHub Actions integration |
| `version-control-sql.md` | DBMS_METADATA DDL extraction, git structure, drift detection, idempotent grants |

---

## Migrations to Oracle

`skills/migrations/`

| File | Description |
|------|-------------|
| `migrate-postgres-to-oracle.md` | Data type mapping, SQL dialect differences, SERIAL→identity, psql vs sqlplus |
| `migrate-mysql-to-oracle.md` | AUTO_INCREMENT, LIMIT→FETCH, stored proc conversion, mysqldump to Oracle |
| `migrate-redshift-to-oracle.md` | MPP vs Oracle, distribution/sort keys, COPY command, WLM→Resource Manager |
| `migrate-sqlserver-to-oracle.md` | T-SQL→PL/SQL, TRY/CATCH→EXCEPTION, linked servers→DBLinks, SSMA guide |
| `migrate-db2-to-oracle.md` | DB2 SQL dialect, REORG→MOVE, RUNSTATS→DBMS_STATS, LOCATE vs INSTR |
| `migrate-sqlite-to-oracle.md` | Type affinity, AUTOINCREMENT, pragmas, scaling from embedded to enterprise |
| `migrate-mongodb-to-oracle.md` | Document→relational, JSON Duality Views, aggregation pipeline→SQL |
| `migrate-snowflake-to-oracle.md` | VARIANT/OBJECT→JSON, QUALIFY→window functions, Time Travel→Flashback |
| `migrate-teradata-to-oracle.md` | BTEQ→SQL*Plus, multiset tables, QUALIFY, TPT→SQL*Loader |
| `migrate-sybase-to-oracle.md` | Chained/unchained transactions, RAISERROR→RAISE_APPLICATION_ERROR, BCP→SQL*Loader |
| `oracle-migration-tools.md` | SQL Developer Migration Workbench, AWS SCT, ora2pg, Oracle ZDM, GoldenGate |
| `migration-assessment.md` | Pre-migration checklist, complexity scoring, risk matrix, effort estimation |
| `migration-data-validation.md` | Row counts, ORA_HASH fingerprinting, reconciliation reports, drift detection |
| `migration-cutover-strategy.md` | Cutover phases, parallel run, go/no-go criteria, rollback plan, stakeholder comms |

---

## PL/SQL Development

`skills/plsql/`

| File | Description |
|------|-------------|
| `plsql-package-design.md` | Spec vs body, public/private APIs, initialization blocks, ACCESSIBLE BY, overloading |
| `plsql-error-handling.md` | Exception hierarchy, PRAGMA EXCEPTION_INIT, FORMAT_ERROR_BACKTRACE, autonomous logging |
| `plsql-performance.md` | Context switches, BULK COLLECT/FORALL, pipelined functions, RESULT_CACHE, PRAGMA UDF |
| `plsql-collections.md` | Associative arrays, nested tables, varrays, collection methods, TABLE() in SQL |
| `plsql-cursors.md` | Implicit/explicit cursors, cursor FOR loops, REF CURSORs, SYS_REFCURSOR, leak prevention |
| `plsql-dynamic-sql.md` | EXECUTE IMMEDIATE, DBMS_SQL, parse-once/execute-many, injection prevention |
| `plsql-security.md` | AUTHID DEFINER vs CURRENT_USER, injection vectors, DBMS_ASSERT, secure coding checklist |
| `plsql-debugging.md` | DBMS_OUTPUT, DBMS_APPLICATION_INFO, SQL Developer debugger, PLSQL_WARNINGS, DBMS_TRACE |
| `plsql-unit-testing.md` | utPLSQL, test packages, assertions, mocking, CI integration, code coverage |
| `plsql-patterns.md` | TAPI pattern, autonomous transaction logging, pipelined functions, object types |
| `plsql-compiler-options.md` | PLSQL_OPTIMIZE_LEVEL, native vs interpreted, conditional compilation, PLSQL_CCFLAGS |
| `plsql-code-quality.md` | Naming conventions, Trivadis guidelines, anti-patterns, review checklist, PL/SQL Cop |

---

## Oracle-Specific Features

`skills/features/`

| File | Description |
|------|-------------|
| `advanced-queuing.md` | AQ/Transactional Event Queues, DBMS_AQ/DBMS_AQADM, propagation, JMS, TEQ (21c) |
| `dbms-scheduler.md` | Jobs, schedules, chains, event-based scheduling, windows, monitoring |
| `virtual-columns.md` | GENERATED ALWAYS AS, indexing virtual columns, partition keys, limitations |
| `materialized-views.md` | COMPLETE/FAST/FORCE refresh, ON COMMIT, MV logs, query rewrite |
| `database-links.md` | Fixed/connected/shared links, distributed DML, two-phase commit, security risks |
| `oracle-apex.md` | APEX architecture, authentication, ORDS integration, REST APIs, CI/CD deployment |

---

## SQLcl

`skills/sqlcl/`

| File | Description |
|------|-------------|
| `sqlcl-basics.md` | Installation, connecting (TNS/Easy Connect/wallet), key differences from SQL*Plus |
| `sqlcl-scripting.md` | JavaScript engine (Nashorn/GraalVM), script command, Java interop, automation examples |
| `sqlcl-liquibase.md` | Built-in Liquibase, lb generate-schema, lb update/rollback, CI/CD integration |
| `sqlcl-formatting.md` | SET SQLFORMAT modes (CSV, JSON, XML, INSERT, LOADER), COLUMN, SPOOL |
| `sqlcl-ddl-generation.md` | DDL command, suppressing storage clauses, full schema extraction, version control |
| `sqlcl-data-loading.md` | LOAD command for CSV/JSON, column mapping, date formats, error handling |
| `sqlcl-cicd.md` | Headless/non-interactive mode, exit codes, wallet connections, GitHub Actions/GitLab CI |
| `sqlcl-mcp-server.md` | MCP server setup, connecting Claude/AI assistants to Oracle, available tools, security |

---

## ORDS (Oracle REST Data Services)

`skills/ords/`

| File | Description |
|------|-------------|
| `ords-architecture.md` | Deployment models (Jetty/Tomcat/WebLogic/OCI), request routing, module hierarchy |
| `ords-installation.md` | Installing ORDS, `ords config set`, wallet-based credential storage, mTLS for ATP/ADW |
| `ords-auto-rest.md` | ORDS.ENABLE_SCHEMA/OBJECT, endpoint patterns, JSON filter syntax, pagination |
| `ords-rest-api-design.md` | DEFINE_MODULE/TEMPLATE/HANDLER, source types, implicit bind parameters, CRUD examples |
| `ords-authentication.md` | OAuth2 client credentials and auth code flows, JWT validation, role mapping |
| `ords-pl-sql-gateway.md` | Calling PL/SQL from REST, REF CURSORs, APEX_JSON, error handling, CLOB/BLOB |
| `ords-file-upload-download.md` | BLOB upload/download, multipart form data, Content-Type/Content-Disposition |
| `ords-metadata-catalog.md` | OpenAPI 3.0 generation, Swagger UI/Postman integration, metadata views |
| `ords-security.md` | HTTPS enforcement, CORS via `ords config set`, wallet-based secrets, request validation |
| `ords-monitoring.md` | Log configuration, request logging, connection pool monitoring, error diagnosis |

---

## Frameworks

`skills/frameworks/`

| File | Description |
|------|-------------|
| `sqlalchemy-oracle.md` | SQLAlchemy ORM/Core Oracle dialect, engine setup, models, sequences, bulk ops |
| `django-oracle.md` | Django ORM Oracle backend, settings, migrations, empty-string/NULL quirks |
| `pandas-oracle.md` | read_sql, to_sql, chunked reads, bulk load via executemany, dtype mapping |
| `spring-data-jpa-oracle.md` | Spring Data JPA + Hibernate Oracle dialect, @SequenceGenerator, native queries, PL/SQL |
| `mybatis-oracle.md` | MyBatis mapper XML, #{} binds, dynamic SQL, CALLABLE statements, sequences |
| `typeorm-oracle.md` | TypeORM entities, QueryBuilder, migrations, NestJS integration |
| `sequelize-oracle.md` | Sequelize model definition, field mapping, sequence hooks, transactions |
| `dapper-oracle.md` | Dapper Query<T>, DynamicParameters, OUT params, multi-mapping |
| `gorm-oracle.md` | GORM models, BeforeCreate sequence hook, scopes, transactions |

---

## Structure

```
oracle-db-skills/
├── README.md
├── skills-index.md          # Full checklist of all files with completion status
└── skills/
    ├── admin/               # Administration
    ├── appdev/              # Application Development
    ├── architecture/        # Architecture & Infrastructure
    ├── design/              # Database Design & Modeling
    ├── devops/              # DevOps & CI/CD
    ├── features/            # Oracle-Specific Features
    ├── migrations/          # Migrations to Oracle
    ├── monitoring/          # Monitoring & Diagnostics
    ├── frameworks/          # Language Frameworks (SQLAlchemy, Django, Spring, etc.)
    ├── ords/                # Oracle REST Data Services
    ├── performance/         # Performance & Tuning
    ├── plsql/               # PL/SQL Development
    ├── security/            # Security
    ├── sql-dev/             # SQL Development
    └── sqlcl/               # SQLcl
```
