# Oracle Text: Full-Text Search

## Overview

Oracle Text (formerly ConText and interMedia Text) is Oracle's full-text search engine, built into the database kernel. Unlike application-level search libraries (Lucene, Elasticsearch), Oracle Text indexes live inside the database alongside the data, enabling full-text search to participate in SQL joins, transactions, and access control with no external infrastructure.

Oracle Text is ideal for:
- Document repositories and content management systems
- Product catalog searches (fuzzy, stemming, thematic)
- Regulatory document search (contracts, filings, correspondence)
- Knowledge bases and FAQ systems
- Any table with free-text VARCHAR2, CLOB, or XMLType columns

---

## Index Types

Oracle Text provides four primary index types. Choosing the right one is the most important decision.

| Index Type | Best For | Notes |
|---|---|---|
| `CONTEXT` | Large documents, full-text CLOB/XMLType | Most powerful; batch or scheduled sync |
| `CTXCAT` | Short text, catalog/e-commerce, ranked results | Supports complex query expressions; real-time |
| `CTXRULE` | Routing/categorizing incoming documents | `MATCHES` operator; documents classified against query rules |
| `CTXXPATH` | XPath queries on XMLType | Optimizes XMLType XPath predicates |

---

## CONTEXT Index: Full Document Search

### Creating a CONTEXT Index

```sql
-- Minimal CONTEXT index (all defaults)
CREATE INDEX idx_article_text
    ON articles (content)
    INDEXTYPE IS CTXSYS.CONTEXT;

-- CONTEXT index with explicit preferences
CREATE INDEX idx_product_desc
    ON products (description)
    INDEXTYPE IS CTXSYS.CONTEXT
    PARAMETERS ('
        LEXER           my_lexer
        WORDLIST        my_wordlist
        STOPLIST        ctxsys.default_stoplist
        MEMORY          128M
        SYNC (ON COMMIT)
    ');

-- Multi-column index: index multiple text columns as one
-- First, create a user datastore that concatenates columns
BEGIN
    CTX_DDL.CREATE_PREFERENCE('product_store', 'MULTI_COLUMN_DATASTORE');
    CTX_DDL.SET_ATTRIBUTE('product_store', 'COLUMNS', 'title, description, tags');
END;
/

CREATE INDEX idx_product_fulltext
    ON products (title)  -- first column; others specified in datastore
    INDEXTYPE IS CTXSYS.CONTEXT
    PARAMETERS ('DATASTORE product_store SYNC (ON COMMIT)');
```

### Index Synchronization Modes

CONTEXT indexes are not updated in real-time by default. New/modified rows must be synchronized into the index.

```sql
-- SYNC ON COMMIT: automatic sync after every commit (12c+; has overhead)
PARAMETERS ('SYNC (ON COMMIT)')

-- SYNC EVERY n seconds: background sync on a schedule
PARAMETERS ('SYNC (EVERY "SYSDATE + 1/24")')  -- sync every hour

-- Manual sync (most common for batch systems)
EXEC CTX_DDL.SYNC_INDEX('idx_article_text');
-- With memory allocation
EXEC CTX_DDL.SYNC_INDEX('idx_article_text', '128M');

-- Optimize the index (merge fragmented doc lists, remove deleted doc entries)
EXEC CTX_DDL.OPTIMIZE_INDEX('idx_article_text', 'FAST');     -- quick defrag
EXEC CTX_DDL.OPTIMIZE_INDEX('idx_article_text', 'FULL');     -- full merge (slow but thorough)
EXEC CTX_DDL.OPTIMIZE_INDEX('idx_article_text', 'TOKEN', maxtime => 300);  -- 5 min max

-- Check pending documents not yet indexed
SELECT COUNT(*) FROM ctx_pending WHERE idx_name = 'IDX_ARTICLE_TEXT';
```

---

## CTXCAT Index: Catalog Search

CTXCAT is designed for catalog-style searches (short text, combo text+structured filters). Unlike CONTEXT, it updates automatically with DML (no manual sync).

```sql
-- Create a CTXCAT index (no sync needed)
CREATE INDEX idx_product_cat
    ON products (product_name)
    INDEXTYPE IS CTXSYS.CTXCAT;

-- CTXCAT with sub-indexes for structured attributes
BEGIN
    CTX_DDL.CREATE_INDEX_SET('product_idx_set');
    CTX_DDL.ADD_INDEX('product_idx_set', 'price');        -- NUMBER
    CTX_DDL.ADD_INDEX('product_idx_set', 'category_id');  -- NUMBER
    CTX_DDL.ADD_INDEX('product_idx_set', 'brand');        -- VARCHAR2
END;
/

CREATE INDEX idx_product_ctxcat
    ON products (product_name)
    INDEXTYPE IS CTXSYS.CTXCAT
    PARAMETERS ('INDEX SET product_idx_set');
```

---

## The CONTAINS Operator

`CONTAINS` is the primary search operator for CONTEXT indexes. It returns a relevance score (0–100, where 100 is most relevant).

```sql
-- Basic keyword search (single word)
SELECT product_id, product_name
FROM   products
WHERE  CONTAINS(description, 'widget') > 0;

-- Multiple words (implicit AND)
SELECT product_id, product_name
FROM   products
WHERE  CONTAINS(description, 'industrial widget') > 0;

-- Relevance score in SELECT
SELECT product_id, product_name,
       SCORE(1) AS relevance  -- SCORE() must use same label as CONTAINS label
FROM   products
WHERE  CONTAINS(description, 'industrial widget', 1) > 0
ORDER  BY relevance DESC;

-- CATSEARCH for CTXCAT indexes
SELECT product_id, product_name
FROM   products
WHERE  CATSEARCH(product_name, 'widget', 'category_id = 5 AND price < 100') > 0;
```

---

## Query Operators

Oracle Text supports a rich query language within the CONTAINS operator string.

### Boolean Operators

```sql
-- AND: both terms must appear
WHERE CONTAINS(text_col, 'oracle AND database') > 0;

-- OR: either term
WHERE CONTAINS(text_col, 'oracle OR mysql') > 0;

-- NOT: exclude documents with term (NOT requires at least one positive term)
WHERE CONTAINS(text_col, 'database NOT oracle') > 0;

-- Shorthand: & = AND, | = OR, ~ = NOT
WHERE CONTAINS(text_col, 'oracle & database ~ mysql') > 0;

-- Precedence: NOT > AND > OR (use parentheses for clarity)
WHERE CONTAINS(text_col, '(oracle | postgres) & (performance ~ slow)') > 0;
```

### Phrase Search

```sql
-- Exact phrase (words must appear adjacent in this order)
WHERE CONTAINS(description, '{high performance widget}') > 0;

-- Near: terms within N words of each other
WHERE CONTAINS(description, 'oracle NEAR database') > 0;
WHERE CONTAINS(description, 'oracle NEAR((database,performance), 5)') > 0;
-- Within 5 words
```

### Fuzzy Search

Fuzzy search finds words that are similar (based on edit distance), useful for misspellings.

```sql
-- Fuzzy match for "widget" (finds "wigdet", "widgit", etc.)
WHERE CONTAINS(description, 'fuzzy(widget)') > 0;

-- Fuzzy with score threshold and expansion limit
WHERE CONTAINS(description, 'fuzzy(widget, 60, 100, weight)') > 0;
-- 60 = minimum similarity score, 100 = max expansions

-- Combined fuzzy and exact
WHERE CONTAINS(description, 'fuzzy(widgit) & premium') > 0;
```

### Stemming Search

Stemming finds morphological variants of a word (e.g., searching "run" also finds "running", "ran", "runs").

```sql
-- Stem operator: finds all morphological forms
WHERE CONTAINS(description, 'stem(install)') > 0;
-- Finds: install, installed, installing, installation, installs

WHERE CONTAINS(description, 'stem(connect)') > 0;
-- Finds: connect, connected, connecting, connection, connections

-- Explicit: match only exact word (no stemming)
WHERE CONTAINS(description, 'exact(install)') > 0;
```

### Wildcard Search

```sql
-- Right truncation (prefix search)
WHERE CONTAINS(description, 'manag%') > 0;
-- Finds: manage, manager, management, managing

-- Left truncation (suffix search)
WHERE CONTAINS(description, '%tion') > 0;
-- Finds: action, connection, installation...

-- Both sides
WHERE CONTAINS(description, '%connect%') > 0;
-- Finds: reconnect, disconnect, interconnection...
```

### Thematic Search

```sql
-- ABOUT: conceptual/thematic search (requires knowledge base)
WHERE CONTAINS(description, 'about(database performance)') > 0;
-- Finds documents conceptually related to "database performance"
-- even if those exact words don't appear
```

---

## Lexers and Wordlists: Language Configuration

### Creating a Custom Lexer

```sql
-- Basic English lexer
BEGIN
    CTX_DDL.CREATE_PREFERENCE('my_english_lexer', 'BASIC_LEXER');
    CTX_DDL.SET_ATTRIBUTE('my_english_lexer', 'PRINTJOINS', '_-');   -- keep _ and - in tokens
    CTX_DDL.SET_ATTRIBUTE('my_english_lexer', 'MIXED_CASE', 'NO');   -- case-insensitive
    CTX_DDL.SET_ATTRIBUTE('my_english_lexer', 'BASE_LETTER', 'YES'); -- strip accents
END;
/

-- Multi-language lexer
BEGIN
    CTX_DDL.CREATE_PREFERENCE('global_lexer', 'WORLD_LEXER');
END;
/
```

### Custom Wordlist for Fuzzy/Stemming

```sql
BEGIN
    CTX_DDL.CREATE_PREFERENCE('my_wordlist', 'BASIC_WORDLIST');
    CTX_DDL.SET_ATTRIBUTE('my_wordlist', 'FUZZY_MATCH',      'ENGLISH');
    CTX_DDL.SET_ATTRIBUTE('my_wordlist', 'FUZZY_SCORE',      '60');
    CTX_DDL.SET_ATTRIBUTE('my_wordlist', 'FUZZY_NUMRESULTS', '5000');
    CTX_DDL.SET_ATTRIBUTE('my_wordlist', 'STEMMER',          'ENGLISH');
    CTX_DDL.SET_ATTRIBUTE('my_wordlist', 'WILDCARD_MAXTERMS','5000');
END;
/

-- Apply in index creation
CREATE INDEX idx_articles ON articles(content)
    INDEXTYPE IS CTXSYS.CONTEXT
    PARAMETERS ('LEXER my_english_lexer WORDLIST my_wordlist');
```

---

## Multi-Column Indexes

Oracle Text can index multiple columns as a single searchable unit using datastores.

```sql
-- Concatenate multiple columns into one index
BEGIN
    CTX_DDL.DROP_PREFERENCE('product_multistore');
    CTX_DDL.CREATE_PREFERENCE('product_multistore', 'MULTI_COLUMN_DATASTORE');
    CTX_DDL.SET_ATTRIBUTE('product_multistore', 'COLUMNS',
        'product_name, short_description, long_description, keywords, brand_name');
    CTX_DDL.SET_ATTRIBUTE('product_multistore', 'DELIMITER', 'NEWLINE');
END;
/

CREATE INDEX idx_product_search
    ON products (product_name)  -- anchor column (must exist on table)
    INDEXTYPE IS CTXSYS.CONTEXT
    PARAMETERS ('DATASTORE product_multistore SYNC (ON COMMIT)');

-- Search finds matches in ANY of the indexed columns
SELECT product_id, product_name
FROM   products
WHERE  CONTAINS(product_name, 'industrial grade widget') > 0;
```

### URL/File Datastore

```sql
-- Index content from files on the OS (FILE_DATASTORE)
BEGIN
    CTX_DDL.CREATE_PREFERENCE('file_store', 'FILE_DATASTORE');
    CTX_DDL.SET_ATTRIBUTE('file_store', 'PATH', '/data/documents');
END;
/

CREATE TABLE document_index (
    doc_id    NUMBER PRIMARY KEY,
    filename  VARCHAR2(500)  -- column contains file paths
);

CREATE INDEX idx_documents
    ON document_index(filename)
    INDEXTYPE IS CTXSYS.CONTEXT
    PARAMETERS ('DATASTORE file_store');

-- Index content from URLs (URL_DATASTORE)
BEGIN
    CTX_DDL.CREATE_PREFERENCE('url_store', 'URL_DATASTORE');
    CTX_DDL.SET_ATTRIBUTE('url_store', 'TIMEOUT', '30');
    CTX_DDL.SET_ATTRIBUTE('url_store', 'HTTP_PROXY', 'proxy.mycompany.com');
END;
/
```

---

## HIGHLIGHT and SNIPPET Functions

These functions generate context-aware result display, similar to Google's excerpt highlighting.

### CTX_DOC.HIGHLIGHT

```sql
-- Highlight matching terms in a stored document
DECLARE
    v_markup CLOB;
BEGIN
    CTX_DOC.MARKUP(
        index_name => 'IDX_ARTICLE_TEXT',
        textkey    => '42',           -- primary key of the document
        text_query => 'database performance',
        restab     => v_markup,
        starttag   => '<b>',          -- opening highlight tag
        endtag     => '</b>'          -- closing highlight tag
    );
    DBMS_OUTPUT.PUT_LINE(DBMS_LOB.SUBSTR(v_markup, 4000, 1));
END;
```

### CTX_DOC.SNIPPET (Most Useful for Search UIs)

`SNIPPET` extracts the most relevant sections of a document (the "hits in context") as short excerpts with highlighted terms.

```sql
DECLARE
    v_snippet VARCHAR2(4000);
BEGIN
    CTX_DOC.SNIPPET(
        index_name => 'IDX_ARTICLE_TEXT',
        textkey    => TO_CHAR(42),    -- must be VARCHAR2
        text_query => 'database performance',
        restab     => v_snippet,
        starttag   => '<em>',
        endtag     => '</em>',
        separator  => '...',          -- between excerpts
        numsnippets=> 3,              -- number of excerpt fragments
        snippetlen => 200             -- characters per snippet
    );
    DBMS_OUTPUT.PUT_LINE(v_snippet);
END;
```

### Using CTX_DOC in SQL Queries

```sql
-- Generate snippets for search results (inline)
SELECT a.article_id,
       a.title,
       SCORE(1) AS relevance,
       CTX_DOC.SNIPPET_QUERY('IDX_ARTICLE_TEXT',
           ROWID,
           'database performance',
           starttag  => '<b>',
           endtag    => '</b>',
           numsnippets => 2) AS excerpt
FROM   articles a
WHERE  CONTAINS(a.content, 'database performance', 1) > 0
ORDER  BY relevance DESC
FETCH FIRST 10 ROWS ONLY;
```

---

## Index Maintenance: Sync and Optimize

### Sync: Index New/Updated Documents

```sql
-- Manual sync: index pending changes
EXEC CTX_DDL.SYNC_INDEX('IDX_ARTICLE_TEXT');

-- With memory tuning (larger = faster for big batches)
EXEC CTX_DDL.SYNC_INDEX('IDX_ARTICLE_TEXT', '256M');

-- Check pending documents
SELECT COUNT(*) FROM ctx_pending WHERE idx_name = 'IDX_ARTICLE_TEXT';

-- Schedule sync with DBMS_SCHEDULER
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name        => 'SYNC_ARTICLE_INDEX',
        job_type        => 'PLSQL_BLOCK',
        job_action      => 'CTX_DDL.SYNC_INDEX(''IDX_ARTICLE_TEXT'', ''64M'');',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=MINUTELY; INTERVAL=15',  -- every 15 minutes
        enabled         => TRUE
    );
END;
```

### Optimize: Defragment the Index

Over time, as documents are updated and deleted, the CONTEXT index becomes fragmented. Optimization merges fragmented posting lists.

```sql
-- Fast optimization: quick cleanup pass
EXEC CTX_DDL.OPTIMIZE_INDEX('IDX_ARTICLE_TEXT', 'FAST');

-- Full optimization: complete merge (can take hours on large indexes)
EXEC CTX_DDL.OPTIMIZE_INDEX('IDX_ARTICLE_TEXT', 'FULL');

-- Token-based optimization: spend at most N seconds
EXEC CTX_DDL.OPTIMIZE_INDEX('IDX_ARTICLE_TEXT', 'TOKEN', maxtime => 1800);  -- 30 min

-- Schedule nightly optimization
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name        => 'OPTIMIZE_ARTICLE_INDEX',
        job_type        => 'PLSQL_BLOCK',
        job_action      => 'CTX_DDL.OPTIMIZE_INDEX(''IDX_ARTICLE_TEXT'', ''FAST'');',
        start_date      => TRUNC(SYSTIMESTAMP) + 1 + 2/24,  -- 2 AM next day
        repeat_interval => 'FREQ=DAILY; BYHOUR=2; BYMINUTE=0',
        enabled         => TRUE
    );
END;
```

---

## Monitoring Oracle Text Indexes

```sql
-- Index status and statistics
SELECT idx_name, idx_type, idx_status, idx_language,
       idx_option, idx_docid_count, idx_sync_interval
FROM   ctx_indexes;

-- Index errors during sync (important for troubleshooting)
SELECT * FROM ctx_index_errors
WHERE  err_index_name = 'IDX_ARTICLE_TEXT'
ORDER  BY err_timestamp DESC;

-- Token statistics (useful for analyzing query performance)
SELECT token_text, token_count, token_doc_count
FROM   dr$idx_article_text$i  -- index table: dr$<index_name>$i
WHERE  token_text = 'database'
ORDER  BY token_doc_count DESC;

-- Pending rows to be synced
SELECT * FROM ctx_pending
WHERE  idx_name = 'IDX_ARTICLE_TEXT';

-- User-defined preferences
SELECT pre_name, pre_class, pre_object, pre_attribute, pre_value
FROM   ctx_user_preferences;
```

---

## Section Groups: Structured Text Search

Section groups allow you to search within specific parts of HTML or XML documents.

```sql
-- HTML section group
BEGIN
    CTX_DDL.CREATE_SECTION_GROUP('html_sections', 'HTML_SECTION_GROUP');
    CTX_DDL.ADD_ZONE_SECTION('html_sections', 'title',  'title');  -- HTML <title>
    CTX_DDL.ADD_ZONE_SECTION('html_sections', 'heading','h1');     -- HTML <h1>
    CTX_DDL.ADD_ZONE_SECTION('html_sections', 'para',   'p');      -- HTML <p>
END;
/

CREATE INDEX idx_html_content ON web_pages(html_content)
    INDEXTYPE IS CTXSYS.CONTEXT
    PARAMETERS ('SECTION GROUP html_sections FORMAT HTML');

-- Search within specific HTML sections
SELECT page_id, url
FROM   web_pages
WHERE  CONTAINS(html_content, 'oracle WITHIN title') > 0;
-- Only matches documents where "oracle" appears in a <title> tag

-- XML section group
BEGIN
    CTX_DDL.CREATE_SECTION_GROUP('contract_sections', 'XML_SECTION_GROUP');
    CTX_DDL.ADD_ZONE_SECTION('contract_sections', 'terms',      'Terms');
    CTX_DDL.ADD_ZONE_SECTION('contract_sections', 'definitions','Definitions');
    CTX_DDL.ADD_ZONE_SECTION('contract_sections', 'liability',  'Liability');
END;
/

-- Find contracts mentioning "damages" specifically in the Liability section
SELECT contract_id, contract_number
FROM   contracts
WHERE  CONTAINS(contract_xml_text, 'damages WITHIN liability') > 0;
```

---

## Best Practices

- **Choose `CTXCAT` for short text that updates frequently** (product names, titles, tags). It maintains itself automatically. Use `CONTEXT` for large documents.
- **Schedule `SYNC_INDEX` based on acceptable staleness.** `SYNC ON COMMIT` has overhead; `SYNC EVERY n MINUTES` via the scheduler is usually better.
- **Run `OPTIMIZE_INDEX` regularly** (weekly or nightly for active systems). Fragmented indexes return degraded relevance scores.
- **Use `SCORE()` to rank results** and filter with `CONTAINS > threshold` rather than `> 0` to eliminate marginally relevant results.
- **Index only columns that actually need full-text search.** Oracle Text indexes consume significant storage (often 20–40% of the original data size).
- **Use section groups** for structured documents to enable section-scoped searches rather than whole-document searches.
- **Test fuzzy and stem parameters** with your actual data before going to production. Overly aggressive fuzzy matching returns too many irrelevant results.
- **Use `MULTI_COLUMN_DATASTORE`** instead of creating separate indexes on each column. One index on all text columns is faster to query than `CONTAINS(col1, q) > 0 OR CONTAINS(col2, q) > 0`.

---

## Common Mistakes

### Mistake 1: Querying Immediately After DML (Before Sync)

```sql
INSERT INTO articles (article_id, content) VALUES (999, 'New article about Oracle performance');
COMMIT;

-- WRONG: this may return 0 rows if index has not been synced
SELECT * FROM articles WHERE CONTAINS(content, 'Oracle performance') > 0;

-- RIGHT: ensure sync if real-time search is needed
EXEC CTX_DDL.SYNC_INDEX('IDX_ARTICLES');
SELECT * FROM articles WHERE CONTAINS(content, 'Oracle performance') > 0;
```

### Mistake 2: Using LIKE Instead of CONTAINS

```sql
-- WRONG for full-text: LIKE does a full table scan, ignores Text index
WHERE description LIKE '%high performance widget%'

-- RIGHT: use CONTAINS for indexed full-text search
WHERE CONTAINS(description, '{high performance widget}') > 0
```

### Mistake 3: Forgetting to Optimize After Mass Deletes/Updates

When you delete or update many documents and don't run `OPTIMIZE_INDEX`, the index accumulates stale "garbage" entries. This bloats the index and degrades query performance. After any bulk DML, run `CTX_DDL.OPTIMIZE_INDEX` with `FAST` or `FULL`.

### Mistake 4: Wrong Filter for Binary Document Types

If you index a column that stores Word documents, PDFs, or HTML (as BLOBs), you must set the `FILTER` preference to `INSO_FILTER` or `AUTO_FILTER`. Without this, Oracle Text indexes raw binary content (garbage).

```sql
BEGIN
    CTX_DDL.CREATE_PREFERENCE('auto_filter', 'AUTO_FILTER');
END;
/

CREATE INDEX idx_docs ON documents(content_blob)
    INDEXTYPE IS CTXSYS.CONTEXT
    PARAMETERS ('FILTER auto_filter FORMAT COLUMN format_col');
```

### Mistake 5: Not Using SCORE() for Ranking

```sql
-- Missing relevance ordering
SELECT * FROM articles WHERE CONTAINS(content, 'database', 1) > 0;
-- Returns results in undefined order

-- Always use SCORE() to rank by relevance
SELECT article_id, title, SCORE(1) AS rel
FROM   articles
WHERE  CONTAINS(content, 'database', 1) > 0
ORDER  BY rel DESC;
```

---

## Sources

- [Oracle Text Reference 19c (CCREF)](https://docs.oracle.com/en/database/oracle/oracle-database/19/ccref/)
- [Oracle Text Application Developer's Guide 19c (CCAPP)](https://docs.oracle.com/en/database/oracle/oracle-database/19/ccapp/)
- [Oracle Database 19c SQL Language Reference — CONTAINS](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
