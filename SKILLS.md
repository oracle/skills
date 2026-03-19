# Oracle DB Skills

**Repository:** https://github.com/krisrice/oracle-db-skills
**Version:** 1.0.0

126 Oracle Database reference guides for AI agents. Each file is a standalone skill covering one topic with examples, best practices, and common mistakes.

**Install:** `npx skills add krisrice/oracle-db-skills`

---

| Path | Category | Description |
|------|----------|-------------|
| `skills/design/erd-design.md` | design | Entity relationship design, normalization (1NF–5NF), Oracle naming conventions, reserved words |
| `skills/design/data-modeling.md` | design | Logical vs physical modeling, star/snowflake schemas, ODS, SCD types |
| `skills/design/partitioning-strategy.md` | design | Range, list, hash, composite partitioning, partition pruning, local vs global indexes |
| `skills/design/tablespace-design.md` | design | Sizing, bigfile vs smallfile, ASSM vs MSSM, production layout patterns |
| `skills/sql-dev/sql-tuning.md` | sql-dev | Execution plans, optimizer hints, SQL profiles, plan baselines |
| `skills/sql-dev/sql-injection-avoidance.md` | sql-dev | Bind variables, DBMS_ASSERT, safe dynamic SQL patterns |
| `skills/sql-dev/pl-sql-best-practices.md` | sql-dev | BULK COLLECT/FORALL, exception handling, cursor management, package structure |
| `skills/sql-dev/sql-patterns.md` | sql-dev | Window functions, CTEs, CONNECT BY, PIVOT/UNPIVOT, MERGE, MODEL clause |
| `skills/sql-dev/dynamic-sql.md` | sql-dev | EXECUTE IMMEDIATE, DBMS_SQL, parse-once/execute-many, injection prevention |
| `skills/performance/awr-reports.md` | performance | Generating and reading AWR reports, key sections, baselines, bottleneck identification |
| `skills/performance/ash-analysis.md` | performance | Active Session History, real-time vs historical analysis, ASH report generation |
| `skills/performance/explain-plan.md` | performance | DBMS_XPLAN, reading execution plans, autotrace, identifying bad plans |
| `skills/performance/index-strategy.md` | performance | B-tree, bitmap, function-based, composite, invisible indexes; rebuild vs coalesce |
| `skills/performance/optimizer-stats.md` | performance | DBMS_STATS, histograms, extended statistics, pending stats, incremental stats |
| `skills/performance/wait-events.md` | performance | Common wait events, diagnosis queries, remediation for each event type |
| `skills/performance/memory-tuning.md` | performance | SGA components, PGA management, AMM vs ASMM, advisory views |
| `skills/appdev/connection-pooling.md` | appdev | UCP, DRCP, pool sizing, connection validation, JDBC/Python/Node.js examples |
| `skills/appdev/transaction-management.md` | appdev | ACID properties, savepoints, autonomous transactions, distributed transactions |
| `skills/appdev/locking-concurrency.md` | appdev | MVCC, SELECT FOR UPDATE, NOWAIT/SKIP LOCKED, deadlock avoidance |
| `skills/appdev/sequences-identity.md` | appdev | Sequence caching, identity columns, UUID alternatives, gap behavior |
| `skills/appdev/json-in-oracle.md` | appdev | Native JSON type, JSON_VALUE/QUERY/TABLE, JSON Duality Views (23c) |
| `skills/appdev/xml-in-oracle.md` | appdev | XMLType storage, XQuery, XMLTable, XML indexes, XMLDB repository |
| `skills/appdev/spatial-data.md` | appdev | SDO_GEOMETRY, spatial indexes, SDO_RELATE, coordinate systems |
| `skills/appdev/oracle-text.md` | appdev | CONTEXT/CTXCAT indexes, CONTAINS, fuzzy/stemming, HIGHLIGHT/SNIPPET |
| `skills/appdev/sql-property-graph.md` | appdev | SQL Property Graph DDL, GRAPH_TABLE operator, MATCH patterns, quantified paths (23ai+) |
| `skills/appdev/python-oracledb.md` | appdev | python-oracledb driver, thin/thick mode, bind variables, pooling, async |
| `skills/appdev/java-oracle-jdbc.md` | appdev | JDBC thin driver, UCP, PreparedStatement, batch, Spring Boot |
| `skills/appdev/nodejs-oracledb.md` | appdev | node-oracledb driver, async/await, pools, result sets, LOBs |
| `skills/appdev/dotnet-oracle.md` | appdev | ODP.NET managed driver, EF Core, array binding, OracleParameter |
| `skills/appdev/golang-oracle.md` | appdev | godror driver, database/sql interface, named binds, REF CURSORs |
| `skills/security/privilege-management.md` | security | Least privilege, roles, DBMS_PRIVILEGE_CAPTURE, avoiding PUBLIC grants |
| `skills/security/row-level-security.md` | security | VPD/FGAC, DBMS_RLS, application contexts, all policy types |
| `skills/security/data-masking.md` | security | Oracle Data Redaction (DBMS_REDACT), full/partial/regexp/random redaction |
| `skills/security/auditing.md` | security | Unified Auditing, CREATE AUDIT POLICY, fine-grained auditing (DBMS_FGA) |
| `skills/security/encryption.md` | security | TDE, Oracle Wallet setup, tablespace/column encryption, key rotation |
| `skills/security/network-security.md` | security | SSL/TLS, sqlnet.ora encryption, ACLs for network packages, listener hardening |
| `skills/admin/backup-recovery.md` | admin | RMAN architecture, backup sets vs image copies, incremental backups, recovery scenarios |
| `skills/admin/dataguard.md` | admin | Physical/logical standby, Data Guard Broker, switchover vs failover, Active Data Guard |
| `skills/admin/rman-basics.md` | admin | Common RMAN commands, channel config, compression, encryption, reporting |
| `skills/admin/undo-management.md` | admin | Undo sizing, UNDO_RETENTION, ORA-01555 causes and prevention, Undo Advisor |
| `skills/admin/redo-log-management.md` | admin | Log sizing, archivelog mode, multiplexing, switch frequency monitoring |
| `skills/admin/user-management.md` | admin | CREATE USER, profiles, password policies, proxy authentication, CDB/PDB users |
| `skills/monitoring/alert-log-analysis.md` | monitoring | Alert log location, critical ORA- errors, automated monitoring patterns |
| `skills/monitoring/adrci-usage.md` | monitoring | ADR repository, adrci commands, IPS packaging, incident correlation |
| `skills/monitoring/health-monitor.md` | monitoring | DBMS_HM health checks, SQL Tuning Advisor, Segment Advisor, Memory Advisor |
| `skills/monitoring/space-management.md` | monitoring | Tablespace monitoring, HWM, SHRINK SPACE vs MOVE, LOB space, temp space |
| `skills/monitoring/top-sql-queries.md` | monitoring | V$SQL/V$SQLAREA, top SQL by resource, AWR top SQL, V$SQL_MONITOR |
| `skills/architecture/rac-concepts.md` | architecture | Cache Fusion, GCS/GES, services, node affinity, RAC wait events, TAF/FCF |
| `skills/architecture/multitenant.md` | architecture | CDB/PDB architecture, cloning, plugging/unplugging, resource management, Application Containers |
| `skills/architecture/oracle-cloud-oci.md` | architecture | ATP, ADW, Base Database Service, ExaCS, connection methods, Free Tier |
| `skills/architecture/exadata-features.md` | architecture | Smart Scan, Storage Indexes, HCC compression, IORM, offload monitoring |
| `skills/architecture/inmemory-column-store.md` | architecture | IMCS architecture, populating objects, Join Groups, In-Memory Aggregation, AIM |
| `skills/devops/schema-migrations.md` | devops | Liquibase and Flyway with Oracle, versioned vs repeatable migrations, CI/CD pipelines |
| `skills/devops/online-operations.md` | devops | DBMS_REDEFINITION, online index rebuild/creation, ALTER TABLE ONLINE |
| `skills/devops/edition-based-redefinition.md` | devops | EBR for zero-downtime deployments, editioning views, crossedition triggers |
| `skills/devops/database-testing.md` | devops | utPLSQL framework, assertions, mocking, code coverage, GitHub Actions integration |
| `skills/devops/version-control-sql.md` | devops | DBMS_METADATA DDL extraction, git structure, drift detection, idempotent grants |
| `skills/migrations/migrate-postgres-to-oracle.md` | migrations | Data type mapping, SQL dialect differences, SERIAL→identity, psql vs sqlplus |
| `skills/migrations/migrate-mysql-to-oracle.md` | migrations | AUTO_INCREMENT, LIMIT→FETCH, stored proc conversion, mysqldump to Oracle |
| `skills/migrations/migrate-redshift-to-oracle.md` | migrations | MPP vs Oracle, distribution/sort keys, COPY command, WLM→Resource Manager |
| `skills/migrations/migrate-sqlserver-to-oracle.md` | migrations | T-SQL→PL/SQL, TRY/CATCH→EXCEPTION, linked servers→DBLinks, SSMA guide |
| `skills/migrations/migrate-db2-to-oracle.md` | migrations | DB2 SQL dialect, REORG→MOVE, RUNSTATS→DBMS_STATS, LOCATE vs INSTR |
| `skills/migrations/migrate-sqlite-to-oracle.md` | migrations | Type affinity, AUTOINCREMENT, pragmas, scaling from embedded to enterprise |
| `skills/migrations/migrate-mongodb-to-oracle.md` | migrations | Document→relational, JSON Duality Views, aggregation pipeline→SQL |
| `skills/migrations/migrate-snowflake-to-oracle.md` | migrations | VARIANT/OBJECT→JSON, QUALIFY→window functions, Time Travel→Flashback |
| `skills/migrations/migrate-teradata-to-oracle.md` | migrations | BTEQ→SQL*Plus, multiset tables, QUALIFY, TPT→SQL*Loader |
| `skills/migrations/migrate-sybase-to-oracle.md` | migrations | Chained/unchained transactions, RAISERROR→RAISE_APPLICATION_ERROR, BCP→SQL*Loader |
| `skills/migrations/oracle-migration-tools.md` | migrations | SQL Developer Migration Workbench, AWS SCT, ora2pg, Oracle ZDM, GoldenGate |
| `skills/migrations/migration-assessment.md` | migrations | Pre-migration checklist, complexity scoring, risk matrix, effort estimation |
| `skills/migrations/migration-data-validation.md` | migrations | Row counts, ORA_HASH fingerprinting, reconciliation reports, drift detection |
| `skills/migrations/migration-cutover-strategy.md` | migrations | Cutover phases, parallel run, go/no-go criteria, rollback plan, stakeholder comms |
| `skills/plsql/plsql-package-design.md` | plsql | Spec vs body, public/private APIs, initialization blocks, ACCESSIBLE BY, overloading |
| `skills/plsql/plsql-error-handling.md` | plsql | Exception hierarchy, PRAGMA EXCEPTION_INIT, FORMAT_ERROR_BACKTRACE, autonomous logging |
| `skills/plsql/plsql-performance.md` | plsql | Context switches, BULK COLLECT/FORALL, pipelined functions, RESULT_CACHE, PRAGMA UDF |
| `skills/plsql/plsql-collections.md` | plsql | Associative arrays, nested tables, varrays, collection methods, TABLE() in SQL |
| `skills/plsql/plsql-cursors.md` | plsql | Implicit/explicit cursors, cursor FOR loops, REF CURSORs, SYS_REFCURSOR, leak prevention |
| `skills/plsql/plsql-security.md` | plsql | AUTHID DEFINER vs CURRENT_USER, injection vectors, DBMS_ASSERT, secure coding checklist |
| `skills/plsql/plsql-debugging.md` | plsql | DBMS_OUTPUT, DBMS_APPLICATION_INFO, SQL Developer debugger, PLSQL_WARNINGS, DBMS_TRACE |
| `skills/plsql/plsql-patterns.md` | plsql | TAPI pattern, autonomous transaction logging, pipelined functions, object types |
| `skills/plsql/plsql-compiler-options.md` | plsql | PLSQL_OPTIMIZE_LEVEL, native vs interpreted, conditional compilation, PLSQL_CCFLAGS |
| `skills/plsql/plsql-code-quality.md` | plsql | Naming conventions, Trivadis guidelines, anti-patterns, review checklist, PL/SQL Cop |
| `skills/features/advanced-queuing.md` | features | AQ/Transactional Event Queues, DBMS_AQ/DBMS_AQADM, propagation, JMS, TEQ (21c) |
| `skills/features/dbms-scheduler.md` | features | Jobs, schedules, chains, event-based scheduling, windows, monitoring |
| `skills/features/virtual-columns.md` | features | GENERATED ALWAYS AS, indexing virtual columns, partition keys, limitations |
| `skills/features/materialized-views.md` | features | COMPLETE/FAST/FORCE refresh, ON COMMIT, MV logs, query rewrite |
| `skills/features/database-links.md` | features | Fixed/connected/shared links, distributed DML, two-phase commit, security risks |
| `skills/features/oracle-apex.md` | features | APEX architecture, authentication, ORDS integration, REST APIs, CI/CD deployment |
| `skills/frameworks/sqlalchemy-oracle.md` | frameworks | SQLAlchemy ORM/Core Oracle dialect, engine, models, sequences, bulk ops |
| `skills/frameworks/django-oracle.md` | frameworks | Django ORM Oracle backend, settings, migrations, empty-string/NULL quirks |
| `skills/frameworks/pandas-oracle.md` | frameworks | read_sql, to_sql, chunked reads, bulk load, dtype mapping |
| `skills/frameworks/spring-data-jpa-oracle.md` | frameworks | Spring Data JPA + Hibernate Oracle dialect, @SequenceGenerator, native queries |
| `skills/frameworks/mybatis-oracle.md` | frameworks | MyBatis mapper XML, #{} binds, dynamic SQL, CALLABLE, sequences |
| `skills/frameworks/typeorm-oracle.md` | frameworks | TypeORM entities, QueryBuilder, migrations, NestJS integration |
| `skills/frameworks/sequelize-oracle.md` | frameworks | Sequelize model definition, field mapping, sequence hooks, transactions |
| `skills/frameworks/dapper-oracle.md` | frameworks | Dapper Query<T>, DynamicParameters, OUT params, multi-mapping |
| `skills/frameworks/gorm-oracle.md` | frameworks | GORM models, BeforeCreate sequence hook, scopes, transactions |
| `skills/sqlcl/sqlcl-basics.md` | sqlcl | Installation, connecting (TNS/Easy Connect/wallet), key differences from SQL*Plus |
| `skills/sqlcl/sqlcl-scripting.md` | sqlcl | JavaScript engine (Nashorn/GraalVM), script command, Java interop, automation examples |
| `skills/sqlcl/sqlcl-liquibase.md` | sqlcl | Built-in Liquibase, lb generate-schema, lb update/rollback, CI/CD integration |
| `skills/sqlcl/sqlcl-formatting.md` | sqlcl | SET SQLFORMAT modes (CSV, JSON, XML, INSERT, LOADER), COLUMN, SPOOL |
| `skills/sqlcl/sqlcl-ddl-generation.md` | sqlcl | DDL command, suppressing storage clauses, full schema extraction, version control |
| `skills/sqlcl/sqlcl-data-loading.md` | sqlcl | LOAD command for CSV/JSON, column mapping, date formats, error handling |
| `skills/sqlcl/sqlcl-cicd.md` | sqlcl | Headless/non-interactive mode, exit codes, wallet connections, GitHub Actions/GitLab CI |
| `skills/sqlcl/sqlcl-mcp-server.md` | sqlcl | MCP server setup, connecting Claude/AI assistants to Oracle, available tools, security |
| `skills/ords/ords-architecture.md` | ords | Deployment models (Jetty/Tomcat/WebLogic/OCI), request routing, module hierarchy |
| `skills/ords/ords-installation.md` | ords | Installing ORDS, `ords config set`, wallet-based credential storage, mTLS for ATP/ADW |
| `skills/ords/ords-auto-rest.md` | ords | ORDS.ENABLE_SCHEMA/OBJECT, endpoint patterns, JSON filter syntax, pagination |
| `skills/ords/ords-rest-api-design.md` | ords | DEFINE_MODULE/TEMPLATE/HANDLER, source types, implicit bind parameters, CRUD examples |
| `skills/ords/ords-authentication.md` | ords | OAuth2 client credentials and auth code flows, JWT validation, role mapping |
| `skills/ords/ords-pl-sql-gateway.md` | ords | Calling PL/SQL from REST, REF CURSORs, APEX_JSON, error handling, CLOB/BLOB |
| `skills/ords/ords-file-upload-download.md` | ords | BLOB upload/download, multipart form data, Content-Type/Content-Disposition |
| `skills/ords/ords-metadata-catalog.md` | ords | OpenAPI 3.0 generation, Swagger UI/Postman integration, metadata views |
| `skills/ords/ords-security.md` | ords | HTTPS enforcement, CORS via `ords config set`, wallet-based secrets, request validation |
| `skills/ords/ords-monitoring.md` | ords | Log configuration, request logging, connection pool monitoring, error diagnosis |
| `skills/features/vector-search.md` | features | VECTOR data type, HNSW/IVF indexes, VECTOR_DISTANCE(), similarity search, RAG patterns |
| `skills/features/select-ai.md` | features | SELECT AI natural language to SQL, AI profiles, RUNSQL/SHOWSQL/NARRATE/CHAT actions |
| `skills/features/dbms-vector.md` | features | DBMS_VECTOR and DBMS_VECTOR_CHAIN packages, embedding generation, RAG pipelines |
| `skills/features/ai-profiles.md` | features | AI provider profile configuration: OpenAI, Cohere, Azure, OCI GenAI, Anthropic |
| `skills/agent/safe-dml-patterns.md` | agent | Always-WHERE guards, dry run via SAVEPOINT, count before delete, bulk DML safety |
| `skills/agent/destructive-op-guards.md` | agent | Pre-flight checks before DROP/TRUNCATE: dependencies, locks, DDL snapshot, recycle bin |
| `skills/agent/idempotency-patterns.md` | agent | MERGE over INSERT, CREATE OR REPLACE, existence checks, retry-safe migration patterns |
| `skills/agent/nl-to-sql-patterns.md` | agent | NL phrasings mapped to Oracle SQL: aggregation, date ranges, schema introspection |
| `skills/agent/schema-discovery.md` | agent | Agent startup queries: ALL_TABLES, ALL_TAB_COLUMNS, ALL_CONSTRAINTS, privileges |
| `skills/agent/intent-disambiguation.md` | agent | When to ask for clarification vs. proceed; safe defaults; disambiguation templates |
| `skills/agent/client-identification.md` | agent | DBMS_APPLICATION_INFO, CLIENT_IDENTIFIER, tracing agent queries in ASH/AWR |
| `skills/agent/ora-error-catalog.md` | agent | Top 25 ORA- errors: root cause and corrective SQL action for agent self-correction |
