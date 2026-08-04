# VecDB Vector Tables and Data

Use this reference for vector-table definition, annotations, inline data,
listing, deletion, and bulk-load jobs. Start with `list_vector_tables()` and
`describe_vector_table(name="<existing-table>")`. VecDB requires Oracle
AI Database 26ai+ at database version `23.26.3` or later.

## Table choices

Use integrated embeddings only after `list_models()` confirms a suitable loaded
model; configure the documented embedding parameters and upsert metadata that
contains the chosen text field. Use bring-your-own vectors only when the
application already supplies vectors with the correct dimensions. Use neutral,
clearly owned names such as `demo_documents` for examples.

Before creating or changing a table, read the matching row in
`vecdb-api-reference.md`, including `Shared Parameter Objects`. Verify
`table_params.auto_generate_id`, `embed_params.model`,
`embed_params.embed_metadata_jsonpath`, and any nested `index_params` rather
than inferring their names or defaults.

Use the current client equivalent for table and record operations. Python SDK
operations are `create_vector_table()`, `list_vector_tables()`,
`describe_vector_table()`, `update_vector_table_annotation()`,
`drop_vector_table()`, `upsert_vectors()`, `list_vectors()`, and
`delete_vectors()`; REST uses `/vecdb/vector-tables/`; PL/SQL uses the matching
`DBMS_VECTOR_DATABASE` package functions. For bring-your-own vectors, records
use `dense_vector`; for integrated embedding tables, put the configured source
text in `metadata` and omit `dense_vector`. Inspect the table before changing
it. Ask for explicit confirmation before delete or drop, and never clean up a
table the workflow does not own.

## Ingestion and jobs

Use small inline upserts for representative demo data. For a large staged
dataset, first ensure the target vector table already exists, then use the
documented bulk-load operation with a CSV file that is already available at an
approved object-storage URL. This is not a local-file loader.

`load_vectors()` does not create a new table. This
skill deliberately requires the table to be inspected or created.
Large `upsert_vectors()` payloads can be automatically batched, but the
database JSON object size limit still applies; use object-storage loading for
large datasets.
Use only the user's existing object-storage location and credential
configuration when required; do not provision storage or create credentials.
Inspect the load job after submission. The Python SDK provides
`list_vector_load_jobs()`, `describe_vector_load_job()`, and
`get_vector_load_job_log()`; REST exposes `/vecdb/load/jobs/`. Bulk load is
costly or long-running: ask for confirmation before starting it. Do not include
real storage URLs, credentials, or customer data in examples.

## Oracle Version Notes (19c vs 26ai)

Oracle Database 19c does not support VecDB tables or ingestion. Use Oracle AI
Database 26ai+ at database version `23.26.3` or later. SDK and REST access
require ORDS `26.2.2` or later.

## Sources

- Oracle VecDB Python SDK API reference, including architecture and workflows:
  https://docs.oracle.com/en/cloud/paas/autonomous-vector-database/vcapi/
- Oracle Vector Database REST API reference:
  https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.2/orrst
- Oracle DBMS_VECTOR_DATABASE PL/SQL API reference:
  https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/
