# VecDB Indexes and Jobs

VecDB manages indexes by default. Use this reference only when the user
intentionally needs manual index configuration, delayed indexing, tuning,
rebuild/drop work, or asynchronous job inspection. VecDB requires Oracle AI
Database 26ai+ at database version `23.26.3` or later.

First inspect the vector table, its index state, and existing jobs. Prefer
automatic/default indexing unless there is a stated need to override it. Index
creation, rebuild, drop, and bulk-load follow-up can be costly or long-running:
explain the impact and ask for explicit confirmation before acting.

Use the current client equivalent for index management. The Python SDK provides
`create_index()`, `describe_index()`, `list_index_jobs()`,
`describe_index_job()`, `get_index_job_log()`, `rebuild_index()`, and
`drop_index()`; REST uses `/vecdb/vector-indexes/`; PL/SQL uses
`DBMS_VECTOR_DATABASE.CREATE_INDEX`, `INDEX_BUILD_STATUS`, `REBUILD_INDEX`,
and `DROP_INDEX`. Do not treat job submission as completion; re-read status and
diagnose the log when necessary. Never rebuild or drop an index that may be
shared without explicit user intent and ownership.

Before supplying `index_params`, read the matching row in
`vecdb-api-reference.md` and `Shared Parameter Objects`. Verify the automatic
index policy, vector versus metadata settings, `organization`,
`distance_metric`, advanced IVF/HNSW parameters, and `index_type` for a rebuild
or drop. Do not tune an index by copying options from another vector database.

## Oracle Version Notes (19c vs 26ai)

Oracle Database 19c does not support VecDB index management. Use Oracle AI
Database 26ai+ at database version `23.26.3` or later. SDK and REST access
require ORDS `26.2.2` or later.

## Sources

- Oracle VecDB Python SDK API reference, including architecture and workflows:
  https://docs.oracle.com/en/cloud/paas/autonomous-vector-database/vcapi/
- Oracle Vector Database REST API reference:
  https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.2/orrst
- Oracle DBMS_VECTOR_DATABASE PL/SQL API reference:
  https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/
