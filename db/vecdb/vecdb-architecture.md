# Oracle VecDB Architecture

## Overview

Oracle VecDB manages fixed schema vector tables, records, models, indexes, and asynchronous
jobs in Oracle AI Database. It supports building applications for
semantic search, RAG, recommendations,and durable agent memory.
VecDB requires Oracle AI Database 26ai+ at database
version `23.26.3` or later; it is not supported on Oracle Database 19c.

## Access paths

Use the application interface that matches the caller. The routes expose the
same core VecDB operations, but parameter names, payload casing, and response
shapes can differ by surface.

```text
Python application -> oracle-vecdb SDK -> ORDS VecDB REST API -> DBMS_VECTOR_DATABASE
HTTP/non-Python client ----------------> ORDS VecDB REST API -> DBMS_VECTOR_DATABASE
SQL or PL/SQL client ---------------------------------------> DBMS_VECTOR_DATABASE
```

- Use the Python SDK for Python applications. Install it with
  `python -m pip install oracle-vecdb`. Configure it with an ORDS `rest_url`.
- Use direct REST for an explicit HTTP, curl, OpenAPI-style, or non-Python
  integration. Its endpoint is
  `https://<host>:<port>/ords/<schema>/_/db-api/stable/vecdb/`.
- Use the `DBMS_VECTOR_DATABASE` package for SQL or PL/SQL work through an
  existing database connection.

The SDK and REST routes require ORDS `26.2.2` or later.
A direct DBMS_VECTOR_DATABASE package call does not require ORDS.
Keep endpoint and authentication configuration outside source code;
use placeholders in examples and keep TLS verification enabled.

## Source contract

Before producing implementation code, read `vecdb-api-reference.md`, then the
exact current reference topics it names for the selected operation and client
surface. Verify parameters, defaults, nested objects, casing, and response
fields from those sources. Do not translate Python arguments to REST fields or
PL/SQL parameters by guesswork.

## Object model and workflow

A vector table contains records with an ID, metadata, and either a supplied
dense vector or an embedding generated from a configured metadata field.
Choose one workflow before creating the table:

- **Integrated embedding:** load a database embedding model, configure
  `embed_metadata_jsonpath`, then write source text in record metadata.
- **Bring your own vectors:** generate embeddings outside the database and
  write compatible `dense_vector` values with the metadata.

Start with read-only discovery of the database summary, models, tables, and the
relevant table. Then create or use a vector table, load or upsert records,
query with text, a vector, or an existing record ID, and optionally rerank the
retrieved candidates. Automatic indexing is the default; tune or manage an
index only when the workload requires it.

Ask for explicit confirmation before deleting or dropping resources, loading
or dropping models, starting bulk loads, or creating, rebuilding, or dropping
indexes. Do not provision infrastructure or include endpoints, credentials,
object-storage URLs, or customer data in committed material.

## Capability routing

| Need                                                 | Read                     |
| ---------------------------------------------------- | ------------------------ |
| Any code, payload, or parameter question            | `vecdb-api-reference.md` |
| Embedding and reranking model discovery or lifecycle | `vecdb-models.md`        |
| Vector table design, records, and bulk ingestion     | `vecdb-vector-tables.md` |
| Similarity search, metadata filters, and reranking   | `vecdb-search.md`        |
| Index strategy, build state, and jobs                | `vecdb-indexes.md`       |

## Oracle Version Notes (19c vs 26ai)

Oracle Database 19c does not support VecDB. Use Oracle AI Database 26ai+ at
database version `23.26.3` or later. SDK and REST access require ORDS `26.2.2`
or later; direct `DBMS_VECTOR_DATABASE` calls do not require ORDS.

## Sources

- Oracle VecDB Python SDK API reference, including architecture and workflows:
  https://docs.oracle.com/en/cloud/paas/autonomous-vector-database/vcapi/
- Oracle Vector Database REST API reference:
  https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.2/orrst
- Oracle DBMS_VECTOR_DATABASE PL/SQL API reference:
  https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/
