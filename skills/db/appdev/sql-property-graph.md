# SQL Property Graphs in Oracle Database

## Overview

Oracle SQL Property Graph lets you model and query graph data — vertices (nodes) and edges (relationships) — directly on top of existing relational tables, views, materialized views, or external tables. No data is copied; the graph definition stores only metadata, and queries operate against current table data.

The core components are:
- **`CREATE PROPERTY GRAPH`** — defines which tables are vertices and edges, their keys, labels, and properties
- **`GRAPH_TABLE` operator** — queries the graph using a pattern-matching syntax (`MATCH`) inside regular SQL `SELECT` statements

This guide covers SQL Property Graph only. For PGX (in-memory graph analytics using PGQL), see the Oracle Graph Server documentation.

> Note: SQL Property Graph (`CREATE PROPERTY GRAPH`, `GRAPH_TABLE`) requires Oracle Database 23ai (23c) or later. It is not available in Oracle 19c.

---

## Underlying Table Setup

A property graph is built on top of ordinary database objects (tables, views, materialized views, external tables, and supported synonyms). In practice, keys should uniquely identify vertices and edges; in `ENFORCED MODE`, Oracle validates this strictly via key/constraint rules.

```sql
-- Vertex table: one row = one person vertex
CREATE TABLE persons (
    person_id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR2(100) NOT NULL,
    birthdate  DATE,
    height     FLOAT DEFAULT ON NULL 0,
    hr_data    JSON
);

-- Vertex table: one row = one university vertex
CREATE TABLE university (
    id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  VARCHAR2(100)
);

-- Edge table: person_a is friends with person_b
CREATE TABLE friends (
    friendship_id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_a       NUMBER REFERENCES persons(person_id),
    person_b       NUMBER REFERENCES persons(person_id),
    meeting_date   DATE
);

-- Edge table: person is a student of a university
CREATE TABLE student_of (
    s_id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    s_person_id  NUMBER REFERENCES persons(person_id),
    s_univ_id    NUMBER REFERENCES university(id),
    subject      VARCHAR2(100)
);
```

---

## Creating a Property Graph

```sql
CREATE [OR REPLACE] PROPERTY GRAPH <graph_name>
  VERTEX TABLES (
    <table_name> [AS <alias>] [KEY (<columns>)]
      [LABEL <label_name> [PROPERTIES <property_spec>]]
      ...
  )
  EDGE TABLES (
    <table_name> [AS <alias>] [KEY (<columns>)]
      SOURCE KEY (<col>) REFERENCES <vertex_table>(<col>)
      DESTINATION KEY (<col>) REFERENCES <vertex_table>(<col>)
      [LABEL <label_name> [PROPERTIES <property_spec>]]
      ...
  )
  [OPTIONS (<option_spec>)];
```

### Complete Example

```sql
CREATE OR REPLACE PROPERTY GRAPH students_graph
  VERTEX TABLES (
    -- KEY inferred from PRIMARY KEY constraint when one exists
    persons KEY (person_id)
      LABEL person
        PROPERTIES (person_id, name, birthdate AS dob)
      LABEL person_ht
        PROPERTIES (height),
    university KEY (id)
      -- No explicit LABEL: defaults to label named "university" with all columns
  )
  EDGE TABLES (
    friends
      KEY (friendship_id)
      SOURCE      KEY (person_a) REFERENCES persons(person_id)
      DESTINATION KEY (person_b) REFERENCES persons(person_id)
      PROPERTIES (friendship_id, meeting_date),
    student_of
      KEY (s_id)
      SOURCE      KEY (s_person_id) REFERENCES persons(person_id)
      DESTINATION KEY (s_univ_id)   REFERENCES university(id)
      PROPERTIES (subject)
  );
```

### Key Auto-Inference Rules

The graph engine automatically infers keys from constraints:

| Situation | Behavior |
|-----------|----------|
| Single `PRIMARY KEY` | Used automatically as the element key |
| Both `PRIMARY KEY` and `UNIQUE` | `PRIMARY KEY` takes precedence |
| Inferred from `UNIQUE` | Columns must also be `NOT NULL` |
| No unique constraint | `KEY (...)` must be declared explicitly |
| Single `FOREIGN KEY` on edge table | SOURCE/DESTINATION keys inferred automatically |
| Multiple `FOREIGN KEY` constraints | Must declare `SOURCE KEY` and `DESTINATION KEY` explicitly |

---

## PROPERTIES Clause Options

```sql
-- Expose all columns as properties (default when no label/properties clause given)
PROPERTIES ARE ALL COLUMNS

-- Expose all columns except specified ones
PROPERTIES ARE ALL COLUMNS EXCEPT (internal_col, audit_col)

-- Expose specific columns
PROPERTIES (person_id, name, birthdate)

-- Rename a column as a property
PROPERTIES (person_id, birthdate AS dob)

-- Expose a column expression as a property
PROPERTIES (height * 100 AS height_cm)

-- Expose no properties
NO PROPERTIES
```

**Supported property types:** All Oracle built-in types including `VARCHAR2`, `NUMBER`, `DATE`, `TIMESTAMP`, `CLOB`, `BLOB`, `JSON`, virtual columns, and SQL/XML value expressions returning a supported type.

**Not supported directly as properties:** `XMLType` columns, `SDO_GEOMETRY` built-in functions, `ANYTYPE`, user-defined object types, pseudocolumns. Use a view as a workaround.

---

## OPTIONS Clause

```sql
-- Enforced: key and foreign key constraints validated at graph creation time
OPTIONS (ENFORCED MODE)

-- Trusted (default): no constraint validation; incorrect data causes incorrect results
OPTIONS (TRUSTED MODE)

-- Allow properties with same name but different types across labels
OPTIONS (ALLOW MIXED PROPERTY TYPES)

-- Reject mixed types across labels (default)
OPTIONS (DISALLOW MIXED PROPERTY TYPES)

-- Combine options
OPTIONS (ENFORCED MODE, ALLOW MIXED PROPERTY TYPES)
```

`ENFORCED MODE` guarantees unique `VERTEX_ID`/`EDGE_ID` values and errors early if constraints are missing. It is **not supported** when graph element tables are views.

---

## Querying with GRAPH_TABLE

`GRAPH_TABLE` is a table operator used in the `FROM` clause of any SQL `SELECT`. It returns a relational result set from a graph pattern match.

```sql
SELECT <columns>
FROM GRAPH_TABLE (
    <graph_name>
  MATCH
    <path_pattern> [, <path_pattern>, ...]
  [WHERE <condition>]
  [ONE ROW PER MATCH | ONE ROW PER VERTEX (v) | ONE ROW PER STEP (v1, e, v2)]
  COLUMNS (<output_columns>)
);
```

### Basic Path Query

```sql
-- Find all direct friendships
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person) -[e IS friends]-> (b IS person)
  COLUMNS (
    a.name         AS person_a,
    b.name         AS person_b,
    e.meeting_date AS met_on
  )
);
```

### Edge Direction Patterns

| Pattern | Meaning |
|---------|---------|
| `(a) -[e]-> (b)` | Directed: a to b |
| `(a) <-[e]- (b)` | Directed: b to a |
| `(a) -[e]- (b)` or `(a) <-[e]-> (b)` | Undirected (either direction) |
| `(a) -> (b)` | Directed, anonymous edge |
| `(a) - (b)` | Undirected, anonymous edge |

### Label Expressions

```sql
-- Single label
(a IS person)

-- Label disjunction (any of)
(a IS person|university)

-- Anonymous vertex (any label)
(a)

-- Anonymous edge (any label)
-[]-

-- Edge with label disjunction
-[e IS friends|student_of]->
```

### Inline WHERE Filter on Elements

```sql
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH
    (a IS person WHERE a.name = 'John')
    -[e IS student_of WHERE e.subject = 'Computer Science']->
    (b IS university)
  COLUMNS (a.name AS student, b.name AS university, e.subject)
);
```

### WHERE Clause on Full Match

```sql
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person) -[e IS friends]-> (b IS person)
  WHERE a.birthdate > DATE '1990-01-01'
    AND b.name != a.name
  COLUMNS (a.name AS from_person, b.name AS to_person, e.meeting_date)
);
```

### Multiple Path Patterns (JOIN Semantics)

```sql
-- Shared variable 'a' acts as a natural join between patterns
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH
    (a IS person WHERE a.name = 'John') -[e1 IS friends]->  (b IS person),
    (a IS person WHERE a.name = 'John') -[e2 IS student_of]-> (c IS university)
  COLUMNS (
    a.name AS student,
    b.name AS friend,
    c.name AS school
  )
);
-- Patterns with no shared variables produce a cross product
```

---

## Variable-Length (Quantified) Path Patterns

Quantifiers match repeated edge hops without spelling out each hop explicitly.

```sql
-- Exactly 2 hops
(a IS person) -[IS friends]->{2} (b IS person)

-- Between 1 and 3 hops
(a IS person) -[IS friends]->{1,3} (b IS person)

-- Up to 4 hops (0 to 4)
(a IS person) -[IS friends]->{,4} (b IS person)
```

### Aggregating Over Variable-Length Paths

```sql
-- Collect all person IDs reachable in 1-3 hops from John
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person WHERE a.name = 'John') -[e IS friends]->{1,3} (b IS person)
  COLUMNS (
    a.name                          AS source,
    LISTAGG(b.person_id, ',')       AS reached_ids,
    COUNT(b.person_id)              AS hop_count
  )
);
```

> Note: SQL graph query limitations (for example, support around path constructs and advanced clauses) can vary by release update. Confirm against your exact version's "Supported Features and Limitations for Querying a SQL Property Graph" page.

---

## ONE ROW PER Clause

Controls granularity of output rows when iterating over matched paths.

```sql
-- Default: one row per complete matched path
ONE ROW PER MATCH

-- One row per vertex traversed in path (iterator variable v)
ONE ROW PER VERTEX (v)

-- One row per edge (step) traversed in path (iterator variables v1, e, v2)
ONE ROW PER STEP (v1, e, v2)

-- Position within the current traversed path
ELEMENT_NUMBER(v)  -- returns sequential position in the current path
```

```sql
-- Emit one row per hop in a variable-length traversal
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person WHERE a.name = 'John') -[e IS friends]->{1,3} (b IS person)
  ONE ROW PER STEP (v1, edge_var, v2)
  COLUMNS (
    ELEMENT_NUMBER(edge_var) AS hop_num,
    v1.name                  AS from_node,
    v2.name                  AS to_node
  )
);
```

---

## Vertex and Edge Identity Functions

```sql
-- VERTEX_ID and EDGE_ID return a JSON object uniquely identifying an element
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person) -[e IS friends]-> (b IS person)
  COLUMNS (
    VERTEX_ID(a) AS a_id,   -- {"GRAPH_OWNER":"GRAPHUSER","GRAPH_NAME":"STUDENTS_GRAPH","ELEM_TABLE":"PERSONS","KEY_VALUE":{"PERSON_ID":1}}
    EDGE_ID(e)   AS e_id,
    VERTEX_ID(b) AS b_id
  )
);

-- Test equality of two element variables
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person) -[]-> (b IS person) -[]-> (c IS person)
  WHERE NOT VERTEX_EQUAL(a, c)   -- exclude cycles back to start
  COLUMNS (a.name, b.name, c.name)
);
```

`VERTEX_ID`/`EDGE_ID` return `NULL` if the variable is not bound. In `TRUSTED MODE`, duplicate identifiers are possible if key columns lack a unique constraint.

---

## Other Predicates and Functions

```sql
-- Label membership test
WHERE n IS LABELED person
WHERE n IS NOT LABELED university

-- Property existence test
WHERE PROPERTY_EXISTS(n, 'birthdate')

-- Edge direction test (useful with undirected edges)
COLUMNS (
  CASE WHEN a IS SOURCE OF e THEN 'outbound' ELSE 'inbound' END AS direction
)

-- Select all properties from a vertex or edge
COLUMNS (a.*, e.*)

-- Count bindings to a variable in quantified patterns
COLUMNS (binding_count(v) AS times_visited)
```

---

## JSON Properties

JSON columns are fully supported as properties. Use Oracle dot-notation or `JSON_VALUE` to expose nested JSON fields.

```sql
CREATE PROPERTY GRAPH hr_graph
  VERTEX TABLES (
    persons KEY (person_id)
      LABEL person
        PROPERTIES (
          person_id,
          name,
          -- dot-notation with type conversion method
          hr_data.department.string()  AS department,
          -- JSON_VALUE expression
          JSON_VALUE(hr_data, '$.role') AS role
        )
  )
  EDGE TABLES (
    friends
      KEY (friendship_id)
      SOURCE      KEY (person_a) REFERENCES persons(person_id)
      DESTINATION KEY (person_b) REFERENCES persons(person_id)
      PROPERTIES (meeting_date)
  );

-- Query with JSON filter
SELECT *
FROM GRAPH_TABLE (hr_graph
  MATCH (a IS person) -[e IS friends]-> (b IS person)
  WHERE a.department = 'Engineering'
  COLUMNS (a.name, a.role, b.name AS friend)
);
```

**Supported scalar type conversion methods:** `.string()`, `.number()`, `.float()`, `.double()`, `.date()`, `.timestamp()`, `.binary()`

---

## Temporal Queries

```sql
-- Query the graph as it existed at a specific SCN
SELECT *
FROM GRAPH_TABLE (students_graph AS OF SCN 2117789
  MATCH (a IS person) -[e IS friends]-> (b IS person)
  COLUMNS (a.name AS a, b.name AS b, e.meeting_date AS met_on)
);

-- Query as of a specific timestamp
SELECT *
FROM GRAPH_TABLE (students_graph AS OF TIMESTAMP SYSTIMESTAMP - INTERVAL '1' HOUR
  MATCH (a IS person) -[e IS friends]-> (b IS person)
  COLUMNS (a.name AS a, b.name AS b)
);
```

---

## Bind Variables

```sql
-- Bind variable in GRAPH_TABLE WHERE clause
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person) -[e IS friends]-> (b IS person WHERE b.name = :target_name)
  WHERE a.name = :source_name
  COLUMNS (a.name AS person_a, b.name AS person_b, e.meeting_date AS met_on)
);
```

---

## DDL Management

### Drop and Rename

```sql
-- Drop the graph object only; underlying tables are NOT affected
DROP PROPERTY GRAPH students_graph;

-- Rename
RENAME students_graph TO students;
```

### Revalidate After Schema Changes

```sql
-- After adding or dropping a column on an underlying table:
ALTER PROPERTY GRAPH students_graph COMPILE;
```

### Comment

```sql
COMMENT ON PROPERTY GRAPH students_graph IS 'Student social network graph';
```

### Retrieve DDL

```sql
SELECT DBMS_METADATA.GET_DDL('PROPERTY_GRAPH', 'STUDENTS_GRAPH') FROM DUAL;
```

---

## Data Dictionary Views

All views have `USER_`, `ALL_`, and `DBA_` prefixes:

| View | Contents |
|------|----------|
| `USER_PROPERTY_GRAPHS` | Graph definitions |
| `USER_PG_ELEMENTS` | Vertex and edge table entries |
| `USER_PG_EDGE_RELATIONSHIPS` | Source/destination key columns |
| `USER_PG_KEYS` | Key column definitions |
| `USER_PG_LABELS` | Label definitions |
| `USER_PG_LABEL_PROPERTIES` | Label-to-property mapping |
| `USER_PG_PROP_DEFINITIONS` | Column expressions backing properties |
| `USER_PG_ELEMENT_LABELS` | Graph element table to label mapping |
| `USER_PG_COMMENTS` | Graph comments |

---

## Privileges

```sql
-- Grant system privileges
GRANT CREATE PROPERTY GRAPH     TO app_developer;
GRANT CREATE ANY PROPERTY GRAPH TO graph_admin;
GRANT READ ANY PROPERTY GRAPH   TO reporting_user;
GRANT DROP ANY PROPERTY GRAPH   TO graph_admin;

-- Grant object-level read on a specific graph
GRANT SELECT ON PROPERTY GRAPH students_graph TO reporting_user;
-- SELECT and READ are aliases; both allow querying the graph
```

---

## Performance and EXPLAIN PLAN

`GRAPH_TABLE` queries are translated internally to SQL, so standard Oracle query tuning applies:

```sql
-- EXPLAIN PLAN works directly on GRAPH_TABLE queries
EXPLAIN PLAN FOR
SELECT *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person) -[e IS friends]-> (b IS person)
  COLUMNS (a.name AS a, b.name AS b)
);
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'ALL'));

-- SQL hints are supported both inside and outside GRAPH_TABLE
SELECT /*+ PARALLEL(4) */  *
FROM GRAPH_TABLE (students_graph
  MATCH (a IS person) -[e IS friends]-> (b IS person)
  COLUMNS (a.name AS a, b.name AS b)
);
```

**Recommendation:** Create indexes on key and frequently filtered columns in the underlying tables. Because `GRAPH_TABLE` translates to SQL joins, standard B-tree indexes on foreign key and primary key columns typically have the most impact.

---

## Using Views as Graph Element Tables

Views can substitute for tables in any position (vertex or edge). This is the standard workaround for source objects that are not directly supported:

| Scenario | Workaround |
|----------|------------|
| `XMLType` columns as properties | Create a view that casts to `VARCHAR2` |
| `SDO_GEOMETRY` functions as properties | Create a view |
| PL/SQL function virtual columns | Create a regular view |
| Hybrid partitioned tables | Create a view |
| Database links | Create a view over the remote table |
| Pseudocolumns as keys or properties | Create a view that materializes them |

```sql
-- Workaround for a PL/SQL function virtual column
CREATE VIEW persons_v AS
SELECT person_id, name, birthdate, compute_age(birthdate) AS age
FROM persons;

CREATE PROPERTY GRAPH age_graph
  VERTEX TABLES (persons_v KEY (person_id) LABEL person PROPERTIES ARE ALL COLUMNS)
  ...;
```

> Note: `ENFORCED MODE` is not supported when using views as graph element tables. Use `TRUSTED MODE` (the default) and ensure uniqueness manually.

---

## Best Practices

- **Build on constrained tables.** Define `PRIMARY KEY` on vertex tables and `FOREIGN KEY` on edge tables; the graph engine auto-infers keys, removing the need for explicit `KEY` declarations and enabling `ENFORCED MODE`.
- **Use `ENFORCED MODE` for new graphs on tables.** It validates constraints at creation time and guarantees unique `VERTEX_ID`/`EDGE_ID` values, which prevents silent data correctness issues.
- **Use `OR REPLACE` when iterating on the graph schema.** Property graph definitions are immutable after creation; `OR REPLACE` is the only way to change them without dropping first, and it preserves previously granted privileges.
- **Call `ALTER PROPERTY GRAPH ... COMPILE` after any schema change** to the underlying tables, otherwise stale metadata may cause query errors.
- **Index key and join columns.** The `GRAPH_TABLE` operator translates to SQL; indexes on `SOURCE KEY`, `DESTINATION KEY`, and vertex `KEY` columns directly improve traversal performance.
- **Prefer inline element-pattern filters** (`(a IS person WHERE a.name = 'John')`) over graph-level `WHERE` for single-element conditions — they help the optimizer push filters closer to the base table scan.
- **Use `TRUSTED MODE` with views** since `ENFORCED MODE` is not available for views; validate uniqueness of key columns in the view output independently.

---

## Common Mistakes

### Mistake 1: Expecting Data to Be Copied

A property graph stores only metadata. It reads from the live underlying tables at query time. Dropping or truncating an underlying table affects all graph queries that use it.

### Mistake 2: Missing KEY on Tables Without Constraints

```sql
-- WRONG: t1 has no PRIMARY KEY or UNIQUE constraint
CREATE TABLE t1 (id NUMBER, name VARCHAR2(10));
CREATE PROPERTY GRAPH g VERTEX TABLES (t1 KEY (id) LABEL t PROPERTIES ARE ALL COLUMNS)
  OPTIONS (ENFORCED MODE);
-- ORA-42434: Columns used to define a graph element table key must be NOT NULL in ENFORCED MODE
```

```sql
-- RIGHT: add NOT NULL and UNIQUE before using ENFORCED MODE
ALTER TABLE t1 MODIFY id NOT NULL;
ALTER TABLE t1 ADD CONSTRAINT t1_pk PRIMARY KEY (id);
```

### Mistake 3: Forgetting to Recompile After a Schema Change

```sql
-- After: ALTER TABLE persons ADD email VARCHAR2(200)
-- the property graph metadata is stale; compile it
ALTER PROPERTY GRAPH students_graph COMPILE;
```

### Mistake 4: Using `TIMESTAMP WITH TIME ZONE` as a Key Column

`TIMESTAMP WITH TIME ZONE` is not supported as a key data type. Use `TIMESTAMP` (without timezone) or convert at the view level.

### Mistake 5: Applying a Cross-Product Instead of a Join

Two path patterns with no shared variables produce a cross product, not a join:

```sql
-- This is a CROSS PRODUCT (no shared variable)
MATCH (a IS person), (b IS university)

-- This is a JOIN (shared variable 'a')
MATCH (a IS person) -[IS student_of]-> (c IS university),
      (a IS person) -[IS friends]-> (b IS person)
```

### Mistake 6: Assuming Every SQL Graph Feature Is Available in Every RU

SQL graph query support has evolved across 23ai and 26ai release updates. Check the release-specific "Supported Features and Limitations for Querying a SQL Property Graph" page before relying on advanced clauses.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle 19c:** SQL Property Graph (`CREATE PROPERTY GRAPH`, `GRAPH_TABLE`) is **not available**. Graph processing in 19c requires Oracle Graph Server (PGX) as a separate component using PGQL query language.
- **Oracle 23ai (23c):** First release supporting SQL Property Graph DDL and the `GRAPH_TABLE` operator natively in the database engine. Core features: `CREATE PROPERTY GRAPH`, `DROP`, `ALTER PROPERTY GRAPH COMPILE`, `RENAME`, `GRAPH_TABLE` with `MATCH`, label expressions, quantified paths (`{n}`, `{n,m}`, `{,m}`), `VERTEX_ID`/`EDGE_ID`, `ONE ROW PER` clause.
- **Oracle 26ai (26.1):** Continued iteration on SQL Property Graph. The 26.1 documentation notes that SQL property graphs can be created from database views beginning with Oracle Database Release 23.26.1. Verify RU-specific behavior in the "Key Property Graph Features in Oracle AI Database 26ai" page.
- **ENFORCED MODE with views:** Not supported in any release — use `TRUSTED MODE` when graph element tables are views.
- **`TIMESTAMP WITH TIME ZONE` keys:** Not supported in any release.

---

## Sources

- [Oracle Property Graph Developer's Guide, Release 26.1 — SQL Property Graph](https://docs.oracle.com/en/database/oracle/property-graph/26.1/spgdg/sql-property-graph.html#SPGDG-GUID-B813BA1B-AEA0-4C70-8094-739FFC0E805B)
- [Oracle Property Graph Developer's Guide, Release 26.1 — Creating a SQL Property Graph](https://docs.oracle.com/en/database/oracle/property-graph/26.1/spgdg/creating-sql-property-graph.html)
- [Oracle Property Graph Developer's Guide, Release 26.1 — SQL Graph Queries](https://docs.oracle.com/en/database/oracle/property-graph/26.1/spgdg/sql-graph-queries.html)
- [Oracle Property Graph Developer's Guide, Release 26.1 — Key Property Graph Features in Oracle AI Database 26ai](https://docs.oracle.com/en/database/oracle/property-graph/26.1/spgdg/key-property-graph-features-oracle-ai-database-26ai.html)
- [Oracle Database SQL Language Reference 23ai — CREATE PROPERTY GRAPH](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/create-property-graph.html)
- [Oracle Database SQL Language Reference 23ai — ALTER PROPERTY GRAPH](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/alter-property-graph.html)
