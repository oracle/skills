# AI Vector Search in Oracle AI Database

## Overview

Oracle AI Vector Search is designed for AI workloads and lets you query data based on semantics rather than keywords. Oracle documents one of the main benefits as combining semantic search on unstructured data with relational search on business data in one system.

The feature set starts with the built-in `VECTOR` data type and extends to similarity operators, distance functions, exact and approximate search, hybrid search, and vector indexes such as IVF and HNSW.

---

## Documentation Map

| Topic | Oracle documentation |
|---|---|
| Core concepts and workflow | Oracle AI Vector Search User's Guide, **Overview of Oracle AI Vector Search** |
| `VECTOR` column definitions | Oracle AI Vector Search User's Guide, **Create Tables Using the VECTOR Data Type** |
| Distance functions and shorthand operators | Oracle AI Vector Search User's Guide, **VECTOR_DISTANCE** |
| Similarity and hybrid search | Oracle AI Vector Search User's Guide, **Query Data With Similarity and Hybrid Searches** |
| Vector index guidance | Oracle AI Vector Search User's Guide, **Guidelines for Using Vector Indexes** |
| IVF index syntax | Oracle AI Vector Search User's Guide, **Inverted File Flat CREATE INDEX** |
| SQL reference | Oracle AI Database SQL Language Reference, **CREATE VECTOR INDEX** |

---

## Start with the `VECTOR` Data Type

Oracle introduces `VECTOR` as a built-in data type for storing embeddings alongside business data.

```sql
CREATE TABLE my_vectors (id NUMBER, embedding VECTOR);
```

When you omit dimensions and format, Oracle allows vectors of different dimensions and different formats in the same column. Oracle also warns that vectors from different embedding models are not comparable for similarity search.

When you know the shape of the embeddings up front, define the column more tightly:

```sql
CREATE TABLE my_vectors (id NUMBER, embedding VECTOR(768, INT8)) ;
```

The documented dimension element formats are:

- `INT8`
- `FLOAT32`
- `FLOAT64`
- `BINARY`

Oracle also documents `DENSE` and `SPARSE` storage forms:

```sql
VECTOR(number_of_dimensions, dimension_element_format, SPARSE)
```

Important restrictions from the `VECTOR` data type documentation:

- IVF vector indexes cannot be created on `SPARSE` vectors.
- A `VECTOR` column cannot be part of a primary key, foreign key, unique constraint, check constraint, or partitioning key.
- Non-vector indexes such as B-tree, bitmap, text, and spatial indexes cannot be created on a `VECTOR` column.

---

## Use the Distance Functions Deliberately

Oracle documents `VECTOR_DISTANCE(expr1, expr2, metric)` as the general distance function. The default metric is `COSINE`.

Supported metrics documented on the `VECTOR_DISTANCE` page include:

- `COSINE`
- `DOT`
- `EUCLIDEAN`
- `EUCLIDEAN_SQUARED`
- `MANHATTAN`
- `HAMMING`
- `JACCARD`

Oracle also documents shorthand operators:

```sql
expr1 <-> expr2
```

`<->` is equivalent to `L2_DISTANCE(expr1, expr2)` or `VECTOR_DISTANCE(expr1, expr2, EUCLIDEAN)`.

```sql
expr1 <=> expr2
```

`<=>` is equivalent to `COSINE_DISTANCE(expr1, expr2)` or `VECTOR_DISTANCE(expr1, expr2, COSINE)`.

```sql
expr1 <#> expr2
```

`<#>` is equivalent to `-1*INNER_PRODUCT(expr1, expr2)` or `VECTOR_DISTANCE(expr1, expr2, DOT)`.

Oracle explicitly documents that `JACCARD` requires `BINARY` vectors.

---

## Understand Exact Search, Approximate Search, and Hybrid Search

Oracle separates vector search into:

- exact similarity search
- approximate similarity search using vector indexes
- hybrid search

The user guide describes hybrid search as combining keyword and vector search to produce more relevant results. This is the main reason not to treat vector search as a wholesale replacement for Oracle Text, SQL predicates, or metadata filters.

For approximate search, Oracle documents two primary vector index families:

- IVF: `ORGANIZATION NEIGHBOR PARTITIONS`
- HNSW: `ORGANIZATION INMEMORY NEIGHBOR GRAPH`

Oracle's SQL reference describes vector indexes as the mechanism that speeds up vector searches, trading accuracy for performance when using approximate search.

---

## Create Vector Indexes with the Right Shape and Metric

Oracle documents the minimum information needed for a vector index as one `VECTOR` column plus an index type.

IVF example from the user guide:

```sql
CREATE VECTOR INDEX galaxies_ivf_idx ON galaxies (embedding)
ORGANIZATION NEIGHBOR PARTITIONS
DISTANCE COSINE
WITH TARGET ACCURACY 95;
```

Oracle documents these IVF parameters:

- `DISTANCE`
- `WITH TARGET ACCURACY`
- `TYPE IVF`
- `NEIGHBOR PARTITIONS`
- `SAMPLES_PER_PARTITION`
- `MIN_VECTORS_PER_PARTITION`

The index guidelines also document HNSW as the other primary index type:

- `ORGANIZATION INMEMORY NEIGHBOR GRAPH`

Oracle states that if no distance metric is specified for a vector index, `COSINE` is used by default.

---

## Best Practices

- Define a fixed dimension and format when the embedding model is stable. Oracle allows flexible columns, but also documents that vectors from different models are not comparable for similarity search.
- Choose the distance metric intentionally and keep it consistent between the query and the vector index.
- Use hybrid search when the workload needs both semantic relevance and keyword or relational filtering.
- Use `APPROX` or `APPROXIMATE` when you expect the optimizer to consider a vector index for approximate similarity search.
- Check Oracle's documented index restrictions before choosing IVF or HNSW. IVF cannot index `SPARSE` vectors.
- Inspect dictionary views such as `USER_INDEXES`, `ALL_INDEXES`, and `DBA_INDEXES` for `INDEX_TYPE = 'VECTOR'` and the vector `INDEX_SUBTYPE`.

---

## Common Mistakes

### Mistake 1: Mixing Embedding Models in One Searchable Column

Oracle explicitly warns that vectors from different embedding models provide different semantic landscapes and are not comparable for similarity search. A flexible `VECTOR` column is useful for experimentation, but not for a production search set that needs consistent ranking.

### Mistake 2: Expecting IVF to Work on `SPARSE` Vectors

Oracle documents this as an explicit restriction. If sparse vectors are part of the design, do not plan on IVF as the index path.

### Mistake 3: Using a Different Metric in the Query and the Index

Oracle's vector index guidance says the distance function in the SQL statement must match the distance function used by the vector index for the optimizer to use that index.

### Mistake 4: Assuming a Vector Index Can Be Built on Any Table Shape

Oracle documents several unsupported targets for vector indexes, including external tables, IOTs, global temporary tables, materialized views, immutable tables, and function-based vector indexes.

### Mistake 5: Forgetting That HNSW Is an In-Memory Neighbor Graph

Oracle documents HNSW as an in-memory neighbor graph index. Size and memory planning matter, especially when deciding between HNSW and IVF.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle Database 19c:** Oracle AI Vector Search and the `VECTOR` data type are not available.
- **Oracle Database 23ai:** Oracle introduces the `VECTOR` data type and Oracle AI Vector Search. Oracle documents that the `COMPATIBLE` initialization parameter must be set to `23.4.0` or higher to use the `VECTOR` data type and related features.
- **Oracle AI Database 26ai:** Oracle documents additional vector capabilities such as sparse vectors, included columns with HNSW indexes, and expanded AI Vector Search functionality. Check the 26ai feature pages for release-specific behavior before depending on newer options.

---

## Sources

- [Oracle AI Vector Search User's Guide - Overview of Oracle AI Vector Search](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/overview-ai-vector-search.html)
- [Oracle AI Vector Search User's Guide - Create Tables Using the VECTOR Data Type](https://docs.oracle.com/en/database/oracle/oracle-database/26/vecse/create-tables-using-vector-data-type.html)
- [Oracle AI Vector Search User's Guide - Query Data With Similarity and Hybrid Searches](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/query-data-similarity-and-hybrid-searches.html)
- [Oracle AI Vector Search User's Guide - Guidelines for Using Vector Indexes](https://docs.oracle.com/en/database/oracle/oracle-database/26/vecse/guidelines-using-vector-indexes.html)
- [Oracle AI Vector Search User's Guide - Inverted File Flat CREATE INDEX](https://docs.oracle.com/en/database/oracle/oracle-database/26/vecse/inverted-file-flat-index-creation-syntax-and-parameters.html)
- [Oracle AI Vector Search User's Guide - VECTOR_DISTANCE](https://docs.oracle.com/en/database/oracle/oracle-database/26/vecse/vector_distance.html)
- [Oracle AI Database SQL Language Reference - CREATE VECTOR INDEX](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/create-vector-index.html)
- [Oracle AI Database 26ai New Features Guide - Vector Data Type](https://docs.oracle.com/en/database/oracle/oracle-database/26/nfcoa/vector-data-type.html)
