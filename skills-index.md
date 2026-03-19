# Oracle DB Skills Index

**Repository:** https://github.com/krisrice/oracle-db-skills
**Version:** 1.0.0

A tracking file for skills.md topics to create for working with Oracle DB.

## Status Legend
- [ ] Not started
- [x] Complete

---

## Database Design & Modeling
- [x] `erd-design.md` — Entity relationship design, normalization, naming conventions
- [x] `data-modeling.md` — Logical vs physical modeling, star/snowflake schemas
- [x] `partitioning-strategy.md` — Range, list, hash, composite partitioning
- [x] `tablespace-design.md` — Sizing, storage layout, bigfile vs smallfile

## SQL Development
- [x] `sql-tuning.md` — Execution plans, hints, optimizer statistics
- [x] `sql-injection-avoidance.md` — Bind variables, dynamic SQL safety, DBMS_ASSERT
- [x] `pl-sql-best-practices.md` — Bulk operations, exception handling, cursor management
- [x] `sql-patterns.md` — Window functions, CTEs, CONNECT BY, MODEL clause
- [x] `dynamic-sql.md` — EXECUTE IMMEDIATE, DBMS_SQL, safe patterns

## Performance & Tuning
- [x] `awr-reports.md` — Reading AWR, key metrics, Top SQL, wait events
- [x] `ash-analysis.md` — Active Session History, real-time tuning
- [x] `explain-plan.md` — Reading execution plans, DBMS_XPLAN, autotrace
- [x] `index-strategy.md` — B-tree, bitmap, function-based, invisible indexes
- [x] `optimizer-stats.md` — DBMS_STATS, histograms, extended statistics
- [x] `wait-events.md` — Common wait events, diagnosis, remediation
- [x] `memory-tuning.md` — SGA, PGA, buffer cache, shared pool sizing

## Application Development
- [x] `connection-pooling.md` — UCP, DRCP, connection best practices
- [x] `transaction-management.md` — Commit frequency, savepoints, autonomous transactions
- [x] `locking-concurrency.md` — Row locks, deadlocks, NOWAIT/SKIP LOCKED
- [x] `sequences-identity.md` — Sequence caching, identity columns, UUID alternatives
- [x] `json-in-oracle.md` — JSON data type, JSON_TABLE, dot notation, indexes
- [x] `xml-in-oracle.md` — XMLType, XQuery, XML indexes
- [x] `spatial-data.md` — SDO_GEOMETRY, spatial indexes, query patterns
- [x] `oracle-text.md` — Full-text search, CONTEXT indexes, CONTAINS queries
- [x] `sql-property-graph.md` — SQL Property Graph DDL, GRAPH_TABLE, MATCH patterns, quantified paths (23ai+)
- [x] `python-oracledb.md` — python-oracledb driver, thin/thick mode, bind variables, pooling, async
- [x] `java-oracle-jdbc.md` — JDBC thin driver, UCP, PreparedStatement, batch, Spring Boot
- [x] `nodejs-oracledb.md` — node-oracledb driver, async/await, pools, result sets, LOBs
- [x] `dotnet-oracle.md` — ODP.NET managed driver, EF Core, array binding, OracleParameter
- [x] `golang-oracle.md` — godror driver, database/sql interface, named binds, REF CURSORs

## Security
- [x] `privilege-management.md` — Least privilege, roles, system vs object privileges
- [x] `row-level-security.md` — VPD/FGAC, RLS policies, application contexts
- [x] `data-masking.md` — Oracle Data Masking, redaction policies
- [x] `auditing.md` — Unified auditing, fine-grained auditing, audit policies
- [x] `encryption.md` — TDE, column encryption, wallet management
- [x] `network-security.md` — SSL/TLS, ACLs for network access

## Administration
- [x] `backup-recovery.md` — RMAN strategy, backup sets, recovery scenarios
- [x] `dataguard.md` — Standby setup, switchover, failover, lag monitoring
- [x] `rman-basics.md` — Common RMAN commands, incremental backups, catalog
- [x] `undo-management.md` — Undo retention, ORA-01555 avoidance, sizing
- [x] `redo-log-management.md` — Log sizing, archivelog mode, log switches
- [x] `user-management.md` — Creating users, profiles, password policies

## Monitoring & Diagnostics
- [x] `alert-log-analysis.md` — Common errors, patterns, ORA- error reference
- [x] `adrci-usage.md` — ADR repository, incident investigation
- [x] `health-monitor.md` — DB health checks, DBMS_HM, advisors
- [x] `space-management.md` — Segment advisor, reclaiming space, HWM
- [x] `top-sql-queries.md` — Finding expensive SQL, V$ views for diagnostics

## Architecture & Infrastructure
- [x] `rac-concepts.md` — Real Application Clusters, interconnect, services
- [x] `multitenant.md` — CDB/PDB architecture, pluggable databases, cloning
- [x] `oracle-cloud-oci.md` — ATP, ADW, Exadata Cloud, cloud-specific features
- [x] `exadata-features.md` — Smart Scan, Storage Indexes, Hybrid Columnar Compression
- [x] `inmemory-column-store.md` — In-Memory option, population, analytics queries

## DevOps & CI/CD
- [x] `schema-migrations.md` — Liquibase, Flyway, online redefinition
- [x] `online-operations.md` — DBMS_REDEFINITION, online index rebuild, edition-based redefinition
- [x] `edition-based-redefinition.md` — EBR for zero-downtime deployments
- [x] `database-testing.md` — utPLSQL, test data management, TDD for PL/SQL
- [x] `version-control-sql.md` — Source controlling schema objects, DDL extraction

## Migrations to Oracle
- [x] `migrate-postgres-to-oracle.md` — Data type mapping, SQL dialect differences, sequence/serial conversion, psql vs sqlplus
- [x] `migrate-mysql-to-oracle.md` — AUTO_INCREMENT, data types, stored proc syntax, LIMIT/OFFSET to ROWNUM/FETCH
- [x] `migrate-redshift-to-oracle.md` — Distribution/sort keys, Redshift SQL quirks, COPY command equivalents, columnar to row-based considerations
- [x] `migrate-sqlserver-to-oracle.md` — T-SQL to PL/SQL, identity columns, TOP to FETCH, linked servers to DBLinks
- [x] `migrate-db2-to-oracle.md` — DB2 SQL dialect, REORG equivalents, package concepts
- [x] `migrate-sqlite-to-oracle.md` — Type affinity mapping, lightweight to enterprise patterns
- [x] `migrate-mongodb-to-oracle.md` — Document model to relational/JSON duality, aggregation pipeline to SQL
- [x] `migrate-snowflake-to-oracle.md` — Warehouse/schema mapping, Snowflake SQL dialect, semi-structured data
- [x] `migrate-teradata-to-oracle.md` — Teradata SQL dialect, BTEQ scripts, multiset tables, partitioning differences
- [x] `migrate-sybase-to-oracle.md` — ASE to Oracle type mapping, Sybase stored proc conversion
- [x] `oracle-migration-tools.md` — SQL Developer Migration Workbench, AWS SCT, SSMA, ora2pg tool guide
- [x] `migration-assessment.md` — Pre-migration assessment, complexity scoring, risk identification, effort estimation
- [x] `migration-data-validation.md` — Row count checks, hash comparisons, data drift detection, reconciliation scripts
- [x] `migration-cutover-strategy.md` — Cutover planning, parallel run, go/no-go criteria, rollback planning

## PL/SQL Development
- [x] `plsql-package-design.md` — Package architecture, spec vs body, public/private APIs, cohesion, initialization blocks
- [x] `plsql-error-handling.md` — Exception hierarchy, named exceptions, PRAGMA EXCEPTION_INIT, SQLERRM/DBMS_UTILITY.FORMAT_ERROR_BACKTRACE, error logging patterns, re-raising
- [x] `plsql-performance.md` — Context switch minimization, BULK COLLECT/FORALL, pipelined functions, NOCOPY, result cache (RESULT_CACHE), deterministic functions
- [x] `plsql-collections.md` — Associative arrays, nested tables, varrays — declarations, methods (COUNT, FIRST, LAST, NEXT, DELETE), bulk operations, TABLE() function
- [x] `plsql-cursors.md` — Implicit vs explicit cursors, cursor FOR loops, parameterized cursors, REF CURSORs (strong/weak), SYS_REFCURSOR, cursor variables across call boundaries
- [x] `plsql-security.md` — AUTHID CURRENT_USER vs DEFINER rights, SQL injection in PL/SQL, DBMS_ASSERT, secure coding checklist
- [x] `plsql-debugging.md` — DBMS_OUTPUT, DBMS_APPLICATION_INFO, SQL Developer debugger, compile warnings (PLSQL_WARNINGS), runtime errors tracing
- [x] `plsql-patterns.md` — Row pipelining, autonomous transactions for logging, table API (TAPI) pattern, object types in PL/SQL, PL/SQL records
- [x] `plsql-compiler-options.md` — PLSQL_OPTIMIZE_LEVEL, PLSQL_CODE_TYPE (native vs interpreted), conditional compilation ($$PLSQL_LINE, $IF), edition-based compilation
- [x] `plsql-code-quality.md` — Naming conventions, code review checklist, avoiding anti-patterns (WHEN OTHERS NULL, hardcoded literals, magic numbers), static analysis with PL/SQL Cop / Trivadis guidelines

## SQLcl
- [x] `sqlcl-basics.md` — Installation, connecting, basic commands, differences from SQL*Plus
- [x] `sqlcl-scripting.md` — JavaScript scripting engine (Nashorn/GraalVM), script command, automating tasks
- [x] `sqlcl-liquibase.md` — Built-in Liquibase integration, lb generate-schema, lb update, changelogs from SQLcl
- [x] `sqlcl-formatting.md` — SET commands, column formatting, output formats (CSV, JSON, XML, INSERT, LOADER), ANSICONSOLE
- [x] `sqlcl-ddl-generation.md` — DDL command, exporting schema objects, options for clean DDL output
- [x] `sqlcl-data-loading.md` — LOAD command for CSV ingestion, format options, error handling
- [x] `sqlcl-cicd.md` — Using SQLcl in CI/CD pipelines, headless/non-interactive mode, exit codes, wallet connections
- [x] `sqlcl-mcp-server.md` — SQLcl MCP server setup, connecting AI assistants to Oracle DB, available tools, security considerations

## ORDS (Oracle REST Data Services)
- [x] `ords-architecture.md` — ORDS deployment models (standalone, Tomcat, WebLogic), connection pools, ORDS schema, request routing
- [x] `ords-installation.md` — Installing and configuring ORDS, pool configuration, wallet setup for ATP/ADW, upgrading
- [x] `ords-auto-rest.md` — AutoREST enabling tables/views, generated endpoint patterns, filtering, pagination, ordering
- [x] `ords-rest-api-design.md` — ORDS.DEFINE_MODULE/TEMPLATE/HANDLER, HTTP methods, bind parameters, implicit/explicit parameters
- [x] `ords-authentication.md` — OAuth2 flows (client credentials, auth code), privilege definitions, role mapping, JWT validation
- [x] `ords-pl-sql-gateway.md` — Calling PL/SQL from REST, OUT parameters, result sets via REF CURSORs, APEX_JSON, error handling
- [x] `ords-file-upload-download.md` — BLOB upload/download endpoints, multipart form data, content-type handling
- [x] `ords-metadata-catalog.md` — OpenAPI/Swagger document generation, metadata endpoint, documenting APIs
- [x] `ords-security.md` — Securing endpoints, HTTPS, CORS configuration, rate limiting, allowed origins, privilege checking
- [x] `ords-monitoring.md` — ORDS logs, request logging, performance tuning, connection pool monitoring, error diagnosis

## Frameworks
- [x] `sqlalchemy-oracle.md` — SQLAlchemy ORM/Core dialect, engine setup, models, sequences, bulk ops
- [x] `django-oracle.md` — Django ORM backend, settings, migrations, Oracle quirks (empty string, ROWNUM)
- [x] `pandas-oracle.md` — read_sql, to_sql, chunked reads, bulk load via executemany, dtype mapping
- [x] `spring-data-jpa-oracle.md` — Hibernate Oracle dialect, @SequenceGenerator, native queries, PL/SQL calls
- [x] `mybatis-oracle.md` — Mapper XML, #{} binds, dynamic SQL, CALLABLE statements, sequences
- [x] `typeorm-oracle.md` — TypeORM entities, QueryBuilder, migrations, NestJS integration
- [x] `sequelize-oracle.md` — Sequelize model definition, field mapping, sequence hooks, raw SQL
- [x] `dapper-oracle.md` — Dapper Query<T>, DynamicParameters, OUT params, multi-mapping
- [x] `gorm-oracle.md` — GORM models, BeforeCreate sequence hook, scopes, transactions

## Oracle-Specific Features
- [x] `advanced-queuing.md` — AQ/TQ messaging, producers/consumers
- [x] `dbms-scheduler.md` — Job scheduling, chains, event-based jobs
- [x] `virtual-columns.md` — Virtual columns, function-based patterns
- [x] `materialized-views.md` — MV refresh strategies, query rewrite
- [x] `database-links.md` — DBLinks, distributed queries, risks
- [x] `oracle-apex.md` — Low-code app dev on Oracle
- [x] `vector-search.md` — VECTOR type, HNSW/IVF indexes, VECTOR_DISTANCE(), RAG patterns (26ai)
- [x] `select-ai.md` — SELECT AI natural language to SQL, AI profiles, actions (26ai)
- [x] `dbms-vector.md` — DBMS_VECTOR and DBMS_VECTOR_CHAIN, embedding pipelines (26ai)
- [x] `ai-profiles.md` — AI provider profile configuration: OpenAI, Cohere, OCI GenAI, Anthropic (26ai)

## Agent & AI Assistant Patterns
- [x] `safe-dml-patterns.md` — Always-WHERE guards, dry run, count before delete, bulk DML safety
- [x] `destructive-op-guards.md` — Pre-flight checks before DROP/TRUNCATE: dependencies, locks, DDL snapshot
- [x] `idempotency-patterns.md` — MERGE over INSERT, CREATE OR REPLACE, retry-safe migration patterns
- [x] `nl-to-sql-patterns.md` — NL phrasings mapped to Oracle SQL constructs
- [x] `schema-discovery.md` — Agent startup queries: tables, columns, constraints, privileges
- [x] `intent-disambiguation.md` — When to ask for clarification; safe defaults; question templates
- [x] `client-identification.md` — DBMS_APPLICATION_INFO, CLIENT_IDENTIFIER for agent traceability
- [x] `ora-error-catalog.md` — Top 25 ORA- errors with root cause and corrective action
