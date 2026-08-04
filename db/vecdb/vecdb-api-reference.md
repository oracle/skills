# VecDB API Reference Map

## Required source check

Before writing Python, REST, or PL/SQL code, read `vecdb-architecture.md`, the
relevant capability file, and the named current reference topics in the table
below. Verify every method or subprogram signature, required and optional
parameter, nested parameter object, request-field casing, response field, and
version-sensitive behavior. Do not infer a parameter from another client
surface. If the current reference cannot be read, state that the contract
cannot be confirmed instead of inventing code.

Python SDK arguments use snake_case. REST request fields use camelCase. PL/SQL
package functions use their documented signatures and JSON/CLOB contract. These
forms are related, but are not interchangeable.

## Reference routing

| Task | Read these Python SDK reference topics | REST / PL/SQL lookup | Verify before coding |
| --- | --- | --- | --- |
| Connect a client | `Configuration` | REST endpoint/authentication; direct package connection | `rest_url`, authentication choices, custom CA, TLS, and retries |
| Discover a deployment | `describe_vector_database`, `list_models`, `list_vector_tables`, `describe_vector_table` | `/vecdb/summary`, models/tables resources; `SUMMARY`, `LIST_*`, `DESCRIBE_*` | Return shape and the exact target name |
| Load or manage a model | `list_models`, `load_model`, `describe_model`, `drop_model` | `/vecdb/models/`; `LIST_MODELS`, `LOAD_MODEL`, `DESCRIBE_MODEL`, `DROP_MODEL` | `model_name`, `url`, `model_params.credential`, reranker metadata, and dependencies |
| Create or change a table | `create_vector_table`, `update_vector_table_annotation`, `describe_vector_table` and `Shared Parameter Objects` | `/vecdb/vector-tables/`; `CREATE_VECTOR_TABLE`, `UPDATE_VECTOR_TABLE_ANNOTATION` | `table_params`, `embed_params`, `index_params`, replacement-not-merge annotation behavior |
| Write, list, or delete records | `upsert_vectors`, `list_vectors`, `delete_vectors` | Vector-table upsert/list/delete resources; `UPSERT_VECTORS`, `LIST_VECTORS`, `DELETE_VECTORS` | ID policy, `dense_vector`, metadata, pagination, and delete IDs |
| Bulk load records | `load_vectors`, `list_vector_load_jobs`, `describe_vector_load_job`, `get_vector_load_job_log` | `/vecdb/load` and `/vecdb/load/jobs/`; `LOAD_VECTORS` | CSV headers/quoting, object-storage URL, credential, job state, and whether automatic table creation is intended |
| Search or rerank | `query`, `rerank`, and `Shared Parameter Objects` | Query and rerank resources; `SEARCH`, `RERANK` | Exactly one query mode, filters, `advanced_options`, response items, reranker candidate mapping, and surface-specific output selection |
| Create, tune, or rebuild an index | `create_index`, `describe_index`, job references, `rebuild_index`, `drop_index`, and `Shared Parameter Objects` | `/vecdb/vector-indexes/`; `CREATE_INDEX`, `INDEX_BUILD_STATUS`, `REBUILD_INDEX`, `DROP_INDEX` | Auto-index policy, vector/metadata parameters, IVF versus HNSW settings, rebuild scope, and job completion |

## Sources

- Oracle VecDB Python SDK API reference: https://docs.oracle.com/en/cloud/paas/autonomous-vector-database/vcapi/
- Oracle Vector Database REST API reference: https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.2/orrst
- Oracle DBMS_VECTOR_DATABASE PL/SQL API reference: https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/
