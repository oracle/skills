# DBMS_VECTOR and DBMS_VECTOR_CHAIN in Oracle 26ai

Oracle 26ai provides two PL/SQL packages for AI vector operations:

- **`DBMS_VECTOR`** — utility functions: generate embeddings, convert vectors, manage vector indexes
- **`DBMS_VECTOR_CHAIN`** — pipeline functions for end-to-end RAG workflows: chunk text, generate embeddings, store, search, summarize, and generate responses

Both packages were introduced in Oracle 23ai and are fully available in Oracle 26ai. They use vector credentials and per-call JSON parameters rather than `DBMS_CLOUD_AI` profiles.

## DBMS_VECTOR: Core Functions

### UTL_TO_EMBEDDING — Generate a Single Embedding

```sql
-- Generate an embedding for a single text string
DECLARE
  v_embed VECTOR;
BEGIN
  v_embed := DBMS_VECTOR.UTL_TO_EMBEDDING(
    data   => 'Oracle Database is a relational database management system.',
    params => JSON_OBJECT(
      'provider'        VALUE 'openai',
      'credential_name' VALUE 'YOUR_SCHEMA.OPENAI_VEC_CRED',
      'model'           VALUE 'text-embedding-3-small'
    )
  );
  -- v_embed is now a VECTOR(1536, FLOAT32)
  DBMS_OUTPUT.PUT_LINE('Dimensions: ' || VECTOR_DIMENSION(v_embed));
END;
/
```

### UTL_TO_EMBEDDINGS — Batch Embedding Generation

More efficient than calling `UTL_TO_EMBEDDING` in a loop.

```sql
-- Batch embed all rows needing embeddings
DECLARE
  v_inputs  DBMS_VECTOR.VECTOR_ARRAY_T := DBMS_VECTOR.VECTOR_ARRAY_T();
  v_outputs DBMS_VECTOR.VECTOR_ARRAY_T;
  v_params  CLOB := '{"provider": "openai",
                       "credential_name": "YOUR_SCHEMA.OPENAI_VEC_CRED",
                       "model": "text-embedding-3-small"}';
  i         PLS_INTEGER := 0;
BEGIN
  -- Collect texts needing embeddings
  FOR r IN (SELECT id, chunk_text FROM doc_chunks WHERE embedding IS NULL) LOOP
    i := i + 1;
    v_inputs.EXTEND;
    v_inputs(i) := r.chunk_text;
  END LOOP;

  -- Generate embeddings in batch
  v_outputs := DBMS_VECTOR.UTL_TO_EMBEDDINGS(v_inputs, JSON(v_params));

  -- Update rows
  i := 0;
  FOR r IN (SELECT id FROM doc_chunks WHERE embedding IS NULL ORDER BY id) LOOP
    i := i + 1;
    UPDATE doc_chunks
    SET    embedding = v_outputs(i)
    WHERE  id = r.id;
  END LOOP;
  COMMIT;
END;
/
```

### Vector Utility Functions

```sql
-- Get the number of dimensions in a vector
SELECT VECTOR_DIMENSION(embedding) FROM doc_chunks FETCH FIRST 1 ROW ONLY;

-- Convert vector to JSON array string (for debugging/export)
SELECT VECTOR_SERIALIZE(embedding RETURNING CLOB) FROM doc_chunks FETCH FIRST 1 ROW ONLY;

-- Convert JSON array string back to VECTOR
SELECT VECTOR_DESERIALIZE('[0.023, -0.047, 0.112]') FROM DUAL;

-- Normalize a vector to unit length (useful before dot product search)
SELECT VECTOR_NORM(embedding) FROM doc_chunks FETCH FIRST 1 ROW ONLY;
```

## DBMS_VECTOR_CHAIN: Pipeline Functions

`DBMS_VECTOR_CHAIN` provides composable pipeline steps for RAG workflows.

### UTL_TO_CHUNKS — Split Text into Chunks

```sql
-- Chunk a document into overlapping pieces
SELECT jt.chunk_id,
       jt.chunk_offset,
       jt.chunk_length,
       jt.chunk_data
FROM   TABLE(
         DBMS_VECTOR_CHAIN.UTL_TO_CHUNKS(
           data   => :document_text,
           params => JSON_OBJECT(
             'by'       VALUE 'words',    -- 'words', 'chars', 'sentence', 'paragraph'
             'max'      VALUE 200,        -- max chunk size
             'overlap'  VALUE 20,         -- overlap between chunks
             'split'    VALUE 'recursively'
           )
         )
       ) t,
       JSON_TABLE(
         t.column_value,
         '$'
         COLUMNS (
           chunk_id     NUMBER PATH '$.chunk_id',
           chunk_offset NUMBER PATH '$.chunk_offset',
           chunk_length NUMBER PATH '$.chunk_length',
           chunk_data   CLOB   PATH '$.chunk_data'
         )
       ) jt;
```

### UTL_TO_SUMMARY — Summarize Text

```sql
-- Summarize a long document using an LLM
DECLARE
  v_summary CLOB;
BEGIN
  v_summary := DBMS_VECTOR_CHAIN.UTL_TO_SUMMARY(
    data   => :long_document,
    params => JSON_OBJECT(
      'provider'        VALUE 'openai',
      'credential_name' VALUE 'YOUR_SCHEMA.OPENAI_VEC_CRED',
      'model'           VALUE 'gpt-4o-mini',
      'language'        VALUE 'english'
    )
  );
  DBMS_OUTPUT.PUT_LINE(v_summary);
END;
/
```

### UTL_TO_GENERATE_TEXT — Generate Text (LLM Completion)

```sql
-- Generate a response given a prompt and retrieved context
DECLARE
  v_prompt  CLOB;
  v_response CLOB;
BEGIN
  -- Note: :retrieved_chunks and :user_question are bind variables concatenated into a
  -- text prompt (CLOB), not into SQL — this is not SQL injection.
  -- However, sanitize :user_question at the application layer to prevent prompt injection
  -- (a user could embed instructions like "Ignore above. Instead do X." in the question).
  v_prompt := 'You are an Oracle Database expert. Answer based on the context below.

Context:
' || :retrieved_chunks || '

Question: ' || :user_question;

  v_response := DBMS_VECTOR_CHAIN.UTL_TO_GENERATE_TEXT(
    data   => v_prompt,
    params => JSON_OBJECT(
      'provider'        VALUE 'openai',
      'credential_name' VALUE 'YOUR_SCHEMA.OPENAI_VEC_CRED',
      'model'           VALUE 'gpt-4o',
      'max_tokens'      VALUE 1024,
      'temperature'     VALUE 0
    )
  );
  DBMS_OUTPUT.PUT_LINE(v_response);
END;
/
```

## End-to-End RAG Pipeline Example

A complete pipeline: ingest documents → chunk → embed → store → query → generate.

```sql
-- === INGESTION (run once per document) ===

-- 1. Chunk the document
INSERT INTO doc_chunks (doc_id, chunk_seq, chunk_text)
SELECT :doc_id,
       jt.chunk_id,
       jt.chunk_data
FROM   TABLE(
         DBMS_VECTOR_CHAIN.UTL_TO_CHUNKS(
           data   => :document_content,
           params => '{"by":"words","max":200,"overlap":20}'
         )
       ) t,
       JSON_TABLE(
         t.column_value,
         '$'
         COLUMNS (
           chunk_id   NUMBER PATH '$.chunk_id',
           chunk_data CLOB   PATH '$.chunk_data'
         )
       ) jt;

-- 2. Generate embeddings for new chunks
UPDATE doc_chunks
SET    embedding = DBMS_VECTOR.UTL_TO_EMBEDDING(
                    chunk_text,
                    '{"provider": "openai",
                      "credential_name": "YOUR_SCHEMA.OPENAI_VEC_CRED",
                      "model": "text-embedding-3-small"}'
                  )
WHERE  doc_id = :doc_id
  AND  embedding IS NULL;

COMMIT;

-- === QUERY TIME ===

-- 3. Embed the user's question
DECLARE
  v_query_vec  VECTOR;
  v_context    CLOB := '';
  v_response   CLOB;
BEGIN
  -- Embed query
  v_query_vec := DBMS_VECTOR.UTL_TO_EMBEDDING(
    :user_question,
    '{"provider": "openai", "credential_name": "YOUR_SCHEMA.OPENAI_VEC_CRED",
      "model": "text-embedding-3-small"}'
  );

  -- 4. Retrieve top-5 relevant chunks
  FOR r IN (
    SELECT chunk_text
    FROM   doc_chunks
    ORDER  BY embedding <=> v_query_vec
    FETCH  FIRST 5 ROWS ONLY
  ) LOOP
    v_context := v_context || r.chunk_text || CHR(10) || '---' || CHR(10);
  END LOOP;

  -- 5. Generate answer
  v_response := DBMS_VECTOR_CHAIN.UTL_TO_GENERATE_TEXT(
    'Answer the question using only the context provided.' || CHR(10) ||
    'Context: ' || v_context || CHR(10) ||
    'Question: ' || :user_question,
    '{"provider": "openai", "credential_name": "YOUR_SCHEMA.OPENAI_VEC_CRED",
      "model": "gpt-4o", "temperature": 0}'
  );

  DBMS_OUTPUT.PUT_LINE(v_response);
END;
/
```

## VECTOR_EMBEDDING Inline SQL Function

`VECTOR_EMBEDDING` generates embeddings inline in SQL without requiring PL/SQL. The model must be loaded into Oracle via `DBMS_VECTOR.LOAD_ONNX_MODEL` or stored as an ONNX model in a database directory. For API-based models (OpenAI, Cohere), use `UTL_TO_EMBEDDING` in PL/SQL instead.

```sql
-- VECTOR_EMBEDDING can be used directly in SQL (Oracle 23ai+)
-- Syntax: VECTOR_EMBEDDING(model_name USING text_expression AS data)
SELECT doc_id,
       VECTOR_EMBEDDING(my_embedding_model USING chunk_text AS data) AS embedding
FROM   doc_chunks
WHERE  doc_id = :doc_id;

-- Use it inline in a similarity search (no pre-computation needed)
SELECT doc_id, chunk_text,
       embedding <=> VECTOR_EMBEDDING(my_embedding_model USING :query AS data) AS distance
FROM   doc_chunks
ORDER  BY distance
FETCH  FIRST 5 ROWS ONLY;

-- NOTE: my_embedding_model must be loaded into Oracle using DBMS_VECTOR.LOAD_ONNX_MODEL
-- or referenced via an ONNX model stored in a database directory.
-- For API-based models (OpenAI, Cohere), use UTL_TO_EMBEDDING in PL/SQL instead.
```

## API Rate Limit Retry Pattern

Handle HTTP 429 (rate limit) errors from embedding API calls with exponential back-off.

```sql
CREATE OR REPLACE FUNCTION embed_with_retry(
  p_text       IN CLOB,
  p_params     IN CLOB,
  p_max_retry  IN PLS_INTEGER DEFAULT 3,
  p_wait_secs  IN NUMBER      DEFAULT 2
) RETURN VECTOR AS
  v_embed VECTOR;
  v_attempt PLS_INTEGER := 0;
BEGIN
  LOOP
    v_attempt := v_attempt + 1;
    BEGIN
      v_embed := DBMS_VECTOR.UTL_TO_EMBEDDING(p_text, JSON(p_params));
      RETURN v_embed;  -- success
    EXCEPTION
      WHEN OTHERS THEN
        -- ORA-29273: HTTP request failed (includes 429 Too Many Requests)
        IF SQLCODE = -29273 AND v_attempt < p_max_retry THEN
          DBMS_SESSION.SLEEP(p_wait_secs * v_attempt);  -- exponential back-off
        ELSE
          RAISE;
        END IF;
    END;
  END LOOP;
END embed_with_retry;
/
```

## Chunk Metadata Columns

Store source attribution alongside embeddings so chunks can be cited and filtered by document.

```sql
-- Recommended doc_chunks table structure with full metadata
CREATE TABLE doc_chunks (
  chunk_id      NUMBER         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doc_id        NUMBER         NOT NULL,
  chunk_seq     NUMBER         NOT NULL,
  chunk_offset  NUMBER,                       -- byte offset in source (from UTL_TO_CHUNKS)
  chunk_length  NUMBER,                       -- byte length of chunk
  chunk_text    CLOB           NOT NULL,
  embedding     VECTOR(1536, FLOAT32),
  source_uri    VARCHAR2(4000),               -- original file path / URL
  page_number   NUMBER,                       -- for PDFs / paginated docs
  section_title VARCHAR2(1000),              -- nearest heading above the chunk
  ingested_at   TIMESTAMP      DEFAULT SYSTIMESTAMP,
  model_name    VARCHAR2(255)  DEFAULT 'text-embedding-3-small'  -- track which model
);

-- When ingesting: preserve CHUNK_OFFSET and CHUNK_LENGTH from UTL_TO_CHUNKS
INSERT INTO doc_chunks (doc_id, chunk_seq, chunk_offset, chunk_length, chunk_text)
SELECT :doc_id,
       jt.chunk_id,
       jt.chunk_offset,
       jt.chunk_length,
       jt.chunk_data
FROM   TABLE(
         DBMS_VECTOR_CHAIN.UTL_TO_CHUNKS(
           data   => :document_content,
           params => '{"by":"words","max":200,"overlap":20}'
         )
       ) t,
       JSON_TABLE(
         t.column_value,
         '$'
         COLUMNS (
           chunk_id     NUMBER PATH '$.chunk_id',
           chunk_offset NUMBER PATH '$.chunk_offset',
           chunk_length NUMBER PATH '$.chunk_length',
           chunk_data   CLOB   PATH '$.chunk_data'
         )
       ) jt;
```

## Semantic Chunking Strategy

Choose the chunking approach based on content type. Check the chunk size distribution after ingestion to validate your settings.

```sql
-- By SENTENCE — best for Q&A over prose (news, documentation)
params => '{"by":"sentence","max":5,"overlap":1}'

-- By PARAGRAPH — best for long-form docs, reports, legal text
params => '{"by":"paragraph","max":3,"overlap":1}'

-- By WORDS — best for predictable chunk sizes (code, structured text)
params => '{"by":"words","max":200,"overlap":20}'

-- By CHARACTERS — use only when other strategies produce bad splits
params => '{"by":"chars","max":1000,"overlap":100}'

-- Splitting strategies:
-- "NEWLINE"       — split at newline boundaries (good for log files, CSVs)
-- "BLANKLINE"     — split at blank lines (good for Markdown, source code)
-- "SPACE"         — split at spaces (default for word/char modes)
-- "RECURSIVELY"   — try paragraph→sentence→word in order (best for mixed content)
-- "CUSTOM"        — split on a custom regex pattern

-- Checking chunk size distribution after ingestion
SELECT MIN(chunk_length) AS min_len,
       MAX(chunk_length) AS max_len,
       ROUND(AVG(chunk_length), 0) AS avg_len,
       COUNT(*) AS total_chunks
FROM   doc_chunks
WHERE  doc_id = :doc_id;
```

## Model Upgrade / Dimension Change Path

VECTOR columns are typed by dimension; stored embeddings from one model cannot coexist in the same column as embeddings from a model with a different dimension. Follow this migration path when upgrading models.

```sql
-- Problem: stored embeddings are 1536-dim (text-embedding-3-small)
-- New model produces 3072-dim (text-embedding-3-large)
-- VECTOR columns are typed; you cannot mix dimensions in the same column

-- Step 1: Add a new column for the new model's embeddings
ALTER TABLE doc_chunks ADD embedding_v2 VECTOR(3072, FLOAT32);

-- Step 2: Re-embed all chunks with the new model
UPDATE doc_chunks
SET    embedding_v2 = DBMS_VECTOR.UTL_TO_EMBEDDING(
                        chunk_text,
                        '{"provider":"openai","credential_name":"YOUR_SCHEMA.OPENAI_VEC_CRED",
                          "model":"text-embedding-3-large"}'
                      )
WHERE  embedding_v2 IS NULL;
COMMIT;

-- Step 3: Drop old vector index
DROP INDEX doc_chunks_hnsw_idx;

-- Step 4: Create new index on the new column
CREATE VECTOR INDEX doc_chunks_hnsw_v2_idx ON doc_chunks(embedding_v2)
ORGANIZATION INMEMORY NEIGHBOR GRAPH DISTANCE COSINE WITH TARGET ACCURACY 95;

-- Step 5: Validate new index, then drop old column
ALTER TABLE doc_chunks DROP COLUMN embedding;
ALTER TABLE doc_chunks RENAME COLUMN embedding_v2 TO embedding;

-- Agent rule: never drop the old embedding column until the new index is verified
-- and at least one similarity query has returned expected results.
```

## UTL_TO_EMBED_AND_GENERATE (26ai)

`UTL_TO_EMBED_AND_GENERATE` combines embedding, vector search, and generation into a single pipeline call. This function is a 26ai addition and is not available in 23ai — use the multi-step pattern in the End-to-End RAG Pipeline section instead.

```sql
-- UTL_TO_EMBED_AND_GENERATE combines embedding + vector search + generation
DECLARE
  v_response CLOB;
BEGIN
  v_response := DBMS_VECTOR_CHAIN.UTL_TO_EMBED_AND_GENERATE(
    data   => :user_question,
    params => JSON_OBJECT(
      'embed_provider'    VALUE 'openai',
      'embed_credential'  VALUE 'YOUR_SCHEMA.OPENAI_VEC_CRED',
      'embed_model'       VALUE 'text-embedding-3-small',
      'search_index'      VALUE 'doc_chunks_hnsw_idx',
      'top_k'             VALUE 5,
      'gen_provider'      VALUE 'openai',
      'gen_credential'    VALUE 'YOUR_SCHEMA.OPENAI_VEC_CRED',
      'gen_model'         VALUE 'gpt-4o',
      'temperature'       VALUE 0
    )
  );
  DBMS_OUTPUT.PUT_LINE(v_response);
END;
/
-- NOTE: UTL_TO_EMBED_AND_GENERATE is a 26ai addition; not available in 23ai.
-- In 23ai, use the multi-step pattern in the End-to-End RAG Pipeline section.
```

## Best Practices

- Use `UTL_TO_EMBEDDINGS` (batch) rather than `UTL_TO_EMBEDDING` (single) for bulk ingestion — significantly fewer API calls
- Chunk size of 150–300 words with 10–20% overlap works well for most document types
- Store the `CHUNK_OFFSET` and `CHUNK_LENGTH` so you can retrieve the original source passage
- Add a vector index (HNSW) after initial bulk ingestion, not before — index builds are faster on populated tables
- Cache frequently-queried embeddings; re-embedding the same text is wasteful and incurs API cost
- Use `temperature: 0` for generation in production — deterministic responses are easier to test

## Common Mistakes

**Chunking after embedding** — always chunk first, then embed each chunk. Embedding an entire document produces one vector that averages all content; it loses specific detail.

**Embedding model mismatch** — the query embedding and the stored embeddings must use the same model. Mixing `text-embedding-3-small` queries against `text-embedding-ada-002` chunks produces garbage results.

**Not storing chunk source metadata** — without `doc_id`, `page_number`, or `source_url` alongside the chunk, you cannot cite sources or filter by document.

**Re-chunking on every query** — chunking is an ingestion-time operation. Store chunks in the database; never rechunk at query time.

## Oracle Version Notes (19c vs 26ai)

- **19c**: No DBMS_VECTOR or DBMS_VECTOR_CHAIN; RAG pipelines required entirely external tooling
- **23ai**: DBMS_VECTOR and DBMS_VECTOR_CHAIN introduced; UTL_TO_EMBEDDING, UTL_TO_EMBEDDINGS, UTL_TO_CHUNKS, UTL_TO_SUMMARY, UTL_TO_GENERATE_TEXT
- **26ai**: Expanded chunking strategies; improved batch performance; tighter SELECT AI integration; additional provider support

## See Also

- [AI Vector Search in Oracle](../features/vector-search.md) — VECTOR type, indexes, and VECTOR_DISTANCE
- [SELECT AI in Oracle 26ai](../features/select-ai.md) — Natural language to SQL
- [AI Profiles and Provider Configuration](../features/ai-profiles.md) — Credential and provider setup

## Sources

- [DBMS_VECTOR Package Reference](https://docs.oracle.com/en/database/oracle/oracle-database/23/arpls/dbms_vector.html)
- [DBMS_VECTOR_CHAIN Package Reference](https://docs.oracle.com/en/database/oracle/oracle-database/23/arpls/dbms_vector_chain.html)
- [Oracle AI Vector Search User's Guide — Generating Embeddings](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/generate-embeddings.html)
