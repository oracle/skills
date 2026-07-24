# PGQL Property Graphs in Oracle Database

## Overview

PGQL (Property Graph Query Language) is an SQL-like query language for the property graph data model — vertices (nodes) and edges (relationships), each with zero or more labels and zero or more properties (arbitrary key-value pairs). It lets you "specify high-level graph patterns which are matched against vertices and edges in a graph." PGQL exists in two syntaxes:

- **Custom syntax** — uses `MATCH ... ON graph`, `FROM MATCH`, colon label expressions (`:Label`), developed before SQL:2023 was finalized.
- **SQL Standard syntax** — uses the `GRAPH_TABLE` operator, `IS Label` expressions, conforms to SQL:2023 Part 16 (SQL/PGQ). This is the syntax used by Oracle's `GRAPH_TABLE` operator on SQL Property Graphs — see `sql-property-graph.md` for the DDL side (`CREATE PROPERTY GRAPH`) and the base `GRAPH_TABLE` mechanics.

The two syntaxes are largely equivalent for pattern matching, but some features (cheapest-path search, `OPTIONAL MATCH`, `PREFIX`, graph modification, a few functions) exist only in custom syntax. Always check the unsupported-features list before translating a query from custom to SQL Standard syntax.

### Background

- **Origin:** PGQL is an open-source project maintained by Oracle, with an open-sourced parser, and "has been part of the Oracle Database as a standalone language since Oracle Database 12.2" (2017). Project site: [pgql-lang.org](https://pgql-lang.org/).
- **Design:** PGQL layers graph pattern matching on top of familiar SQL constructs — `SELECT`, `FROM`, `WHERE`, `GROUP BY` (grouping), aggregation (`MIN`, `MAX`, `AVG`, `SUM`, ...), and `ORDER BY` (sorting) — so anyone who knows SQL can read the non-graph parts of a query immediately.
- **Path finding:** beyond fixed-length patterns, PGQL provides "powerful regular expression constructs for graph reachability (transitive closure), shortest path finding and cheapest path finding" using quantifiers (`*`, `+`, `{2,4}`, ...) on repeating path segments.
- **Standardization:** SQL:2023 Part 16 (SQL/PGQ) is standardized as **ISO/IEC 9075-16:2023**. PGQL's SQL Standard syntax tracks it, while the custom syntax predates it and remains available — "giving users the choice to use whichever syntax they prefer" (see Oracle Version Notes below for which syntax each Oracle release exposes).
- **Versioning:** the language continues to evolve independently of any one database release — for example, PGQL 2.1 added the `OPTIONAL MATCH` clause described below (custom syntax only, not yet part of SQL/PGQ).

> **Important — spec vs. Oracle implementation:** The "SQL Standard syntax" described in this guide (and in the PGQL 2.1 spec / SQL:2023 Part 16) is broader than what Oracle AI Database's `GRAPH_TABLE` operator actually implements. Most notably, **Oracle AI Database does not implement the `KEEP` clause or any path-finding mode (`ANY`, `ALL`, `SHORTEST`, `CHEAPEST`)** in `GRAPH_TABLE`, even in Oracle AI Database 26ai (Release 26.3) — see [Oracle AI Database GRAPH_TABLE Implementation Notes](#oracle-ai-database-graph_table-implementation-notes-26ai--release-263) below before relying on any `KEEP`-based translation in an actual Oracle database. The rest of this guide (label expressions, `WHERE`, `COLUMNS`, `ONE ROW PER`, most functions) matches Oracle's implementation.

> Note: This guide covers PGQL query language concepts and the two syntaxes side by side. For PGX (in-memory graph analytics using PGQL custom syntax), see the Oracle Graph Server documentation. For SQL Property Graph DDL and basic `GRAPH_TABLE` usage in Oracle AI Database, see `sql-property-graph.md`.

---

## Quick Reference: Clause Order — Custom Syntax vs. SQL Standard Syntax

**Custom syntax** — the projection (`SELECT`) and graph reference (`ON graph_name`) sit at the top level, with the path mode inline in `MATCH`:

```sql
SELECT <expressions>
FROM MATCH <path_mode>? <graph_pattern> ON graph_name
     <ONE ROW PER ...>?
WHERE <filter>?
ORDER BY ...
```

```sql
-- Example: shortest path, one row per vertex
SELECT v.number AS account_nr, ELEMENT_NUMBER(v) AS elem_nr
FROM MATCH ANY SHORTEST (a1:Account) -[:transaction]->* (a2:Account)
       ON financial_transactions
       ONE ROW PER VERTEX ( v )
WHERE a1.number = 1001 AND a2.number = 8021
ORDER BY ELEMENT_NUMBER(v)
```

**SQL Standard syntax** — the correct clause ordering inside `GRAPH_TABLE` is mandatory:

```sql
SELECT ...
FROM GRAPH_TABLE ( graph_name
  MATCH <graph_pattern>
  KEEP <path_mode>?        -- per SQL:2023 / PGQL 2.1 spec; NOT implemented by Oracle AI Database as of 26ai
  WHERE <filter>?
  <ONE ROW PER ...>?
  COLUMNS ( <expressions> )
)
ORDER BY ...
```

```sql
-- Same query translated to SQL Standard syntax
SELECT account_nr, elem_nr
FROM GRAPH_TABLE (financial_transactions
  MATCH (a1 IS Account) -[IS transaction]->* (a2 IS Account)
  KEEP ANY SHORTEST PATH   -- not valid in Oracle AI Database — omit this line
  WHERE a1.number = 1001 AND a2.number = 8021
  ONE ROW PER VERTEX ( v )
  COLUMNS (v.number AS account_nr, ELEMENT_NUMBER(v) AS elem_nr)
)
ORDER BY elem_nr
```

## Quick Reference: Key Translation Rules

| Custom syntax | SQL Standard syntax |
|---|---|
| `ON graph_name` | First arg of `GRAPH_TABLE(graph_name ...)` |
| `:Label` | `IS Label` (only `IS` allowed in `GRAPH_TABLE`) |
| `MATCH ANY ...` | `MATCH ... KEEP ANY` |
| `MATCH ALL SHORTEST ...` | `MATCH ... KEEP ALL SHORTEST` |
| `WHERE` (top-level) | `WHERE` inside `GRAPH_TABLE` |
| `SELECT` projections | `COLUMNS(...)` inside `GRAPH_TABLE` |
| `ORDER BY` | Stays at outer query level |
| `a = b` (vertex equality) | `VERTEX_EQUAL(a, b)` |
| `COUNT(e)` | `COUNT(EDGE_ID(e))` — consistently throughout |
| `ID(v)` | `VERTEX_ID(v)` or `EDGE_ID(e)` |
| `LABEL(v)` | Not supported in SQL Standard syntax |

---

## Graph Pattern Matching

### Vertex and Edge Patterns

Vertices are written in parentheses, edges as arrows:

```sql
(n IS Person) -[e IS knows]-> (m IS Person)   -- outgoing edge
(n IS Person) <-[e IS knows]- (m IS Person)   -- incoming edge
(n IS Person) -[e IS knows]- (m IS Person)    -- any direction
```

Variable names and label expressions are both optional:
- `()` — anonymous vertex
- `(n)` — named vertex, any label
- `(IS Person)` — anonymous vertex with label
- `(n IS Person)` — named vertex with label
- `->` — anonymous outgoing edge
- `-[e]->` — named edge, any label
- `-[IS transaction]->` — anonymous edge with label

Label disjunction uses `|`: `(n IS Person|Company)`

### Path Modes and KEEP Clause

Path modes control which paths are retained when multiple exist. Per the SQL:2023 standard and the PGQL 2.1 spec, they appear in a `KEEP` clause after `MATCH`.

**Defined by the spec (via `KEEP`):**

| Goal | Custom syntax | SQL Standard `KEEP` |
|---|---|---|
| Any path | `MATCH ANY` | `KEEP ANY` |
| All paths | `MATCH ALL` | `KEEP ALL` |
| Any shortest | `MATCH ANY SHORTEST` | `KEEP ANY SHORTEST PATH` |
| All shortest | `MATCH ALL SHORTEST` | `KEEP ALL SHORTEST` |
| k shortest | `MATCH SHORTEST k PATHS` | `KEEP SHORTEST k PATHS` |

**NOT supported by the SQL Standard / PGQL spec at all:**

| Goal | Custom syntax | SQL Standard |
|---|---|---|
| Any cheapest | `MATCH ANY CHEAPEST` | Not supported |
| k cheapest | `MATCH CHEAPEST k PATHS` | Not supported |

> **Oracle AI Database:** None of the `KEEP`-based path modes above are implemented in Oracle AI Database's `GRAPH_TABLE`, in any release through Oracle AI Database 26ai (26.3). Oracle's own documentation states plainly: *"Variable-length pattern matching goals (such as ANY, ALL, ALL SHORTEST, ANY CHEAPEST, and so on) are not supported."* Every row in the table above — including the ones marked as spec-supported — currently errors in Oracle AI Database. See [Oracle AI Database GRAPH_TABLE Implementation Notes](#oracle-ai-database-graph_table-implementation-notes-26ai--release-263).

### Quantifiers

Quantifiers express the number of repetitions in variable-length paths. The SQL:2023 / PGQL 2.1 spec defines:

| Quantifier | Meaning |
|---|---|
| `*` | Zero or more |
| `+` | One or more |
| `?` | Zero or one |
| `{n}` | Exactly n |
| `{n,}` | At least n |
| `{n,m}` | Between n and m |
| `{,m}` | At most m |

Example: `(a IS Account) -[e IS transaction]->{1,5} (b IS Account)`

> **Oracle AI Database:** only the **bounded** quantifiers `{n}`, `{n,m}`, and `{,m}` are supported ("bounded recursive path pattern queries are supported"). The unbounded forms `*`, `+`, `?`, and `{n,}` are not documented as supported and are tied to the unsupported path-finding goals above — do not rely on them against Oracle AI Database's `GRAPH_TABLE`.

### Variable-Length Path Syntax

Variable-length paths wrap the repeating part in parentheses:

```sql
-- Custom syntax
MATCH (src) (-[e:transaction]->) * (dst)

-- SQL Standard syntax
MATCH (src) (-[e IS transaction]->)* (dst)
```

The `COST` clause (for cheapest paths) is inside the repeating unit, and is custom-syntax only:
```sql
-- Custom syntax only
MATCH ANY CHEAPEST (a) (-[e:transaction]-> COST e.amount)* (b)
```

Oracle AI Database's own examples for bounded variable-length paths use a slightly different repeating-unit shape, with the edge and destination vertex together inside the parentheses:

```sql
-- Oracle AI Database GRAPH_TABLE (bounded quantifier, confirmed in Oracle docs)
SELECT *
FROM GRAPH_TABLE ( g
  MATCH (v1) (-[e]->(v2)){1,2}
  COLUMNS (LISTAGG(v2.id, ',') AS id_list)
)
```

### ONE ROW PER Clauses

Controls how many result rows are produced per matched path.

| Clause | Meaning | Default? |
|---|---|---|
| `ONE ROW PER MATCH` | One row per complete path match | Yes — can be omitted |
| `ONE ROW PER VERTEX (v)` | One row per vertex along the path | No — must be stated |
| `ONE ROW PER STEP (src, e, dst)` | One row per edge along the path | No — must be stated |

In SQL Standard syntax, these appear after `WHERE` and before `COLUMNS`:

```sql
FROM GRAPH_TABLE (my_graph
  MATCH (a IS Account) -[e IS transaction]->* (b IS Account)
  KEEP ANY SHORTEST PATH   -- spec syntax; NOT valid in Oracle AI Database, see note below
  WHERE a.number = 1001 AND b.number = 8021
  ONE ROW PER VERTEX ( v )
  COLUMNS (v.number AS account_nr, ELEMENT_NUMBER(v) AS elem_nr)
)
```

`ONE ROW PER` itself **is** confirmed supported in Oracle AI Database's `GRAPH_TABLE`, including all three variants above — it is only the `KEEP` line in the example that does not apply to Oracle (see the release-update timeline below for when each clause was added).

### Horizontal Aggregation and Group Variables

When using `ONE ROW PER MATCH` with variable-length paths, aggregations over edge or vertex group variables produce one value per path (horizontal aggregation), rather than across rows (vertical aggregation).

```sql
-- Horizontal aggregation: COUNT, SUM, ARRAY_AGG, LISTAGG over path edges
SELECT COUNT(EDGE_ID(e)) AS num_hops,
       SUM(e.amount) AS total_amount,
       ARRAY_AGG(e.amount) AS amounts
FROM GRAPH_TABLE (financial_transactions
  MATCH (a IS Account) -[e IS transaction]->* (b IS Account)
  KEEP ANY SHORTEST PATH   -- spec syntax; drop this line for Oracle AI Database (see note below)
  WHERE a.number = 10039 AND b.number = 2090
  COLUMNS (COUNT(EDGE_ID(e)) AS num_hops,
           SUM(e.amount) AS total_amount,
           ARRAY_AGG(e.amount) AS amounts)
)
```

Aggregate functions themselves (both built-in and user-defined) over path elements are confirmed supported by Oracle AI Database, "in both fixed length and variable length path patterns," usable in `COLUMNS` and in the graph pattern `WHERE` clause — e.g. `WHERE AVG(v2.age) >= 30` inside a variable-length `MATCH`. Oracle also documents `binding_count(element)`, an aggregate that counts the number of bindings to an element variable, usable only in `COLUMNS` or the pattern `WHERE` clause.

### OPTIONAL MATCH (Custom Syntax Only)

`OPTIONAL MATCH` is like a left outer join — if no match is found, the newly declared variables are unbound (NULL). There is no SQL Standard equivalent.

```sql
-- Custom syntax only
SELECT p.name, c.name AS company
FROM MATCH (p:Person),
     OPTIONAL MATCH (p) -[:worksFor]-> (c:Company)
ORDER BY p.name
```

### Disconnected Patterns

Multiple comma-separated path patterns produce a Cartesian product when the patterns are not connected through shared variables:

```sql
-- SQL Standard: disconnected patterns
FROM GRAPH_TABLE(my_graph
  MATCH (n1) -> (m1),
        (n2) -> (m2)   -- disconnected: Cartesian product
  COLUMNS (1 AS dummy)
)
```

### Repeated Variables

In custom syntax, the same variable name in multiple `MATCH` clauses refers to the same vertex. In SQL Standard syntax, use comma-separated patterns inside a single `MATCH`:

```sql
-- Custom: same variable across MATCH clauses
FROM MATCH (p:Person) -[:knows]-> (q:Person) ON g
   , MATCH (p) -[:worksAt]-> (c:Company) ON g

-- SQL Standard: comma-separated patterns in one MATCH
FROM GRAPH_TABLE(g
  MATCH (p IS Person) -[IS knows]-> (q IS Person),
        (p) -[IS worksAt]-> (c IS Company)
  COLUMNS (...)
)
```

---

## Built-in Functions and Predicates

### Vertex and Edge Identity Functions

**`VERTEX_ID(v)` / `EDGE_ID(e)`** — Returns the scalar identifier of a vertex or edge. Use these whenever a scalar key is needed — for example when joining across `GRAPH_TABLE` operators or when using `COUNT(DISTINCT ...)`.

- **SQL Standard:** `VERTEX_ID(v)`, `EDGE_ID(e)` — supported
- **Custom alias:** `ID(element)` — not allowed in SQL Standard syntax

```sql
-- Joining two GRAPH_TABLE operators on a shared vertex
WHERE mid_vid1 = mid_vid2   -- where mid_vid1 = VERTEX_ID(mid) from first GT

-- Counting distinct edges
COUNT(DISTINCT EDGE_ID(e))
```

### Label Functions and Predicates

- **`LABEL(element)`** — Returns the label of a vertex or edge as a string value. Custom syntax only; not allowed in SQL Standard syntax. Alternative: use `IS Label` in the pattern or `IS [NOT] LABELED`.
- **`LABELS(element)`** — Returns the set of labels of a vertex or edge. Custom syntax only; not allowed in SQL Standard syntax.
- **`IS [NOT] LABELED` predicate** — Tests whether a vertex or edge has a specific label. Supported in both syntaxes; confirmed in Oracle AI Database. Oracle's implementation accepts only a **simple label name** — label disjunction (`IS LABELED Person|Company`) is not supported in the predicate. Returns `TRUE`/`FALSE` if the element is bound, `NULL` if the element variable is unbound.

```sql
WHERE n IS LABELED Person
WHERE e IS NOT LABELED transaction
```

- **`PROPERTY_EXISTS(element, property)`** — Tests whether the graph element bound to a variable has a specific property. Confirmed in Oracle AI Database. Returns `TRUE` if the element is bound and at least one of its labels has the property, `FALSE` if bound but the property doesn't exist, `NULL` if the element variable is unbound.

```sql
COLUMNS (n.name, PROPERTY_EXISTS(n, name) AS name_exists)
```

### Path Functions

- **`ELEMENT_NUMBER(element)`** — Returns the position of a vertex or edge along a path. Vertices are numbered with odd numbers (1, 3, 5, ...), edges with even numbers (2, 4, 6, ...). Supported in both syntaxes; confirmed in Oracle AI Database. Can only be used for iterator variables declared in a `ONE ROW PER VERTEX` or `ONE ROW PER STEP` clause.
- **`MATCHNUM(element)`** — Returns a unique per-path identifier, allowing identification of which rows belong to the same path when using `ONE ROW PER VERTEX` or `ONE ROW PER STEP`. Supported in both syntaxes; confirmed in Oracle AI Database, where it's described as returning "a number that uniquely identifies a match in a set of matches." (See the release-update timeline below for when each of the functions above was added.)

### Vertex/Edge Equality and Comparison

- **`VERTEX_EQUAL(v1, v2)` / `EDGE_EQUAL(e1, e2)`** — Tests equality between two vertices or edges.
  - SQL Standard: `VERTEX_EQUAL(v1, v2)`, `EDGE_EQUAL(e1, e2)` — confirmed as a supported predicate in Oracle AI Database, comparing the underlying identifiers; evaluates to `NULL` if either referenced variable is unbound.
  - Custom syntax: `v1 = v2`, `e1 = e2`

  Use `VERTEX_EQUAL` in SQL Standard when translating self-loop conditions like `WHERE a = b` → `WHERE VERTEX_EQUAL(a, b)`.

- **`ALL_DIFFERENT(v1, v2, ..., vN)`** — Specifies that all listed vertices or edges must be distinct. Defined by the PGQL 2.1 spec for both syntaxes; not confirmed in Oracle AI Database's `GRAPH_TABLE` documentation as of Release 26.3 — treat as spec-level only until verified against your release, and prefer explicit `WHERE NOT VERTEX_EQUAL(...)` conditions in Oracle AI Database.

### Source / Destination Predicates

**`IS [NOT] SOURCE OF` / `IS [NOT] DESTINATION OF`** — Tests whether a vertex is the source or destination of an edge. Confirmed in Oracle AI Database, "mainly useful for determining the direction of edges that are matched through any-directed edge patterns" (`<-[]->` or `-[]-`). Evaluates to `NULL` if either referenced variable is unbound.
- SQL Standard: `v IS [NOT] SOURCE OF e`, `v IS [NOT] DESTINATION OF e`
- Custom alias: `is_source_of(e, v)` / `is_destination_of(e, v)` — custom only

### String Functions

| Function | Description | Support |
|---|---|---|
| `LOWER(string)` / `UPPER(string)` | Convert case | Both |
| `SUBSTRING(string, start, length)` | Extract a substring | Both |
| `JAVA_REGEXP_LIKE(string, pattern)` | Java-specific regex matching | Custom only — use `REGEXP_LIKE` or `LIKE` in SQL Standard |

### Numeric Functions

All standard numeric functions are supported in both syntaxes:

| Function | Description | Support |
|---|---|---|
| `ABS(n)` | Absolute value | Both |
| `CEIL(n)` / `CEILING(n)` | Round up | Both |
| `FLOOR(n)` | Round down | Both |
| `ROUND(n)` | Round to nearest | Both |

### Datetime Functions

**`EXTRACT(field FROM datetime)`** — Extracts a date/time field (YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, etc.). Supported in both syntaxes.

### Type Conversion

**`CAST(expression AS type)`** — Converts a value to a different data type. Supported in both syntaxes.

### Conditional Expressions

- `CASE ... WHEN ... THEN ... END` — Standard SQL CASE expression. Supported in both syntaxes.
- `IN` / `NOT IN` predicates — Supported in both syntaxes.

### Aggregation Functions

All standard aggregations work in both syntaxes. When used inside `GRAPH_TABLE` over group variables (variable-length path elements), they perform **horizontal aggregation** (one value per path, not across rows).

| Function | Description | Support |
|---|---|---|
| `COUNT(...)` | Count — use `COUNT(EDGE_ID(e))` for edges | Both |
| `SUM(expr)` | Sum | Both |
| `MIN(expr)` | Minimum | Both |
| `MAX(expr)` | Maximum | Both |
| `AVG(expr)` | Average | Both |
| `LISTAGG(expr, sep)` | Concatenate values | Both |
| `ARRAY_AGG(expr)` | Collect into array | Both |

**Important:** When counting graph objects, always use the scalar ID form — `COUNT(e)` → `COUNT(EDGE_ID(e))`, `COUNT(v)` → `COUNT(VERTEX_ID(v))` (see Rule 7 below for why, and for applying this consistently across a query).

### User-Defined Functions (UDFs)

UDFs can be called in both syntaxes with `function_name(args)`.

**Package name prefix** — In custom syntax, UDFs support an optional package name prefix: `package_name.function_name(args)`. This prefix is **not allowed in SQL Standard syntax**.

```sql
-- Custom syntax: package prefix allowed
SELECT mypackage.myfunction(n.amount) FROM MATCH (n) ON g

-- SQL Standard: no package prefix
SELECT myfunction(n.amount) FROM GRAPH_TABLE(g MATCH (n) COLUMNS(...))
```

---

## Translating Custom Syntax to SQL Standard Syntax

Always check the "Features Not Supported in SQL Standard Syntax" section below BEFORE translating. If the query uses any unsupported feature, it cannot be translated — say so clearly. These rules translate custom PGQL syntax into **spec-conformant** SQL Standard syntax (SQL:2023 / PGQL 2.1); the Oracle-specific caveat on Rule 3 below applies when the translation target is Oracle AI Database.

### Rule 1: Graph Reference

**Custom:** `ON graph_name` after the `MATCH` clause.
**SQL Standard:** Graph name becomes the first argument of `GRAPH_TABLE(...)`.

```sql
-- Custom
FROM MATCH (n:Person) ON financial_transactions

-- SQL Standard
FROM GRAPH_TABLE (financial_transactions
  MATCH (n IS Person)
  COLUMNS (...)
)
```

### Rule 2: Label Expressions

**Custom:** Colon prefix — `:Label` for vertices and edges.
**SQL Standard:** `IS Label`. Only `IS` is permitted inside `GRAPH_TABLE`; colons are not allowed.

```sql
-- Custom
(a:Account) -[:transaction]-> (b:Account)

-- SQL Standard
(a IS Account) -[IS transaction]-> (b IS Account)
```

Label disjunction uses the bar operator in both syntaxes:
- Custom: `:Person|Company`
- SQL Standard: `IS Person|Company`

### Rule 3: Path Mode → KEEP Clause

> **Oracle AI Database caveat:** Rules 3 and 4 describe the mapping defined by the SQL:2023 standard and the PGQL 2.1 spec. Oracle AI Database's `GRAPH_TABLE` does not implement `KEEP` or any path-finding goal, so a query that depends on this rule **cannot actually be translated to a runnable Oracle AI Database query** — it can only be translated to spec-conformant SQL/PGQ for a different engine. Say so explicitly if the target is Oracle AI Database.

**Custom:** Path mode keyword appears before the pattern in `MATCH`.
**SQL Standard:** Extract into a dedicated `KEEP` clause after `MATCH`.

| Custom syntax | SQL Standard KEEP clause |
|---|---|
| `MATCH ANY (...)->*` | `KEEP ANY` |
| `MATCH ALL (...)->*` | `KEEP ALL` |
| `MATCH ANY SHORTEST (...)->*` | `KEEP ANY SHORTEST PATH` |
| `MATCH ALL SHORTEST (...)->*` | `KEEP ALL SHORTEST` |
| `MATCH SHORTEST k PATHS (...)->*` | `KEEP SHORTEST k PATHS` |

Note: `ANY SHORTEST` becomes `ANY SHORTEST PATH` (explicit `PATH` keyword).

### Rule 4: Multiple MATCH Clauses with Different Path Modes

When two `MATCH` clauses have **different** path modes, split into separate `GRAPH_TABLE` operators — one per `MATCH` — each with its own `KEEP` clause. Join the results in the outer query using `VERTEX_ID()` or `EDGE_ID()`.

```sql
-- Custom
SELECT e1_weights, e2_weights
FROM MATCH SHORTEST 3 PATHS (src) (-[e1]->)* (mid) ON my_graph
   , MATCH ANY SHORTEST (mid) (-[e2]->)* (dst) ON my_graph

-- SQL Standard
SELECT e1_weights, e2_weights
FROM
  GRAPH_TABLE(my_graph
    MATCH (src) (-[e1]->)* (mid)
    KEEP SHORTEST 3 PATHS
    COLUMNS (VERTEX_ID(mid) AS mid_vid1,
             LISTAGG(e1.weight, ', ') AS e1_weights)
  ),
  GRAPH_TABLE(my_graph
    MATCH (mid) (-[e2]->)* (dst)
    KEEP ANY SHORTEST PATH
    COLUMNS (VERTEX_ID(mid) AS mid_vid2,
             LISTAGG(e2.weight, ', ') AS e2_weights)
  )
WHERE mid_vid1 = mid_vid2
```

Graph objects (vertices, edges) cannot be passed out of `GRAPH_TABLE`, so the shared vertex `mid` is exposed as a scalar via `VERTEX_ID(mid)` for joining.

### Rule 5: WHERE Clause

**Custom:** `WHERE` at the top level of the query.
**SQL Standard:** `WHERE` moves inside `GRAPH_TABLE`, placed after the `KEEP` clause (if present).

### Rule 6: Vertex and Edge Equality

**Custom:** `a = b` (vertex equality), `e1 = e2` (edge equality).
**SQL Standard:** `VERTEX_EQUAL(a, b)` and `EDGE_EQUAL(e1, e2)`, because vertices and edges are graph objects, not scalar values.

### Rule 7: COUNT Vertices or Edges

`COUNT(e)` must be replaced with `COUNT(EDGE_ID(e))` — consistently across ALL occurrences in the query, including in `WHERE`, `COLUMNS`, and anywhere `DISTINCT` is used. The same applies to vertices: `COUNT(v)` → `COUNT(VERTEX_ID(v))`.

### Rule 8: ONE ROW PER Clause

`ONE ROW PER MATCH` is the default in SQL Standard syntax and can be omitted. Other variants (`ONE ROW PER VERTEX`, `ONE ROW PER STEP`) must be stated explicitly and are placed **after** `WHERE` and **before** `COLUMNS`:

```
MATCH ...
KEEP ...?
WHERE ...?
ONE ROW PER VERTEX ( v )   ← here
COLUMNS (...)
```

### Rule 9: COLUMNS Clause

**Custom:** Top-level `SELECT` defines the projection.
**SQL Standard:** `COLUMNS(...)` inside `GRAPH_TABLE` replaces the projection. All expressions, aggregations, and aliases go here. The outer `SELECT` then references only the alias names exposed by `COLUMNS`.

```sql
-- Custom
SELECT COUNT(e) AS num_hops, SUM(e.amount) AS total
FROM MATCH SHORTEST (a:Account) -[e:transaction]->* (b:Account)
       ON financial_transactions
WHERE a.number = 1 AND b.number = 2

-- SQL Standard
SELECT num_hops, total
FROM GRAPH_TABLE (financial_transactions
  MATCH (a IS Account) -[e IS transaction]->* (b IS Account)
  KEEP ANY SHORTEST PATH   -- spec syntax; not valid in Oracle AI Database
  WHERE a.number = 1 AND b.number = 2
  COLUMNS (COUNT(EDGE_ID(e)) AS num_hops,
           SUM(e.amount) AS total)
)
```

### Rule 10: ORDER BY

`ORDER BY` always remains at the outer query level, referencing aliases defined in `COLUMNS`.

### Rule 11: ONE ROW PER MATCH (default)

Custom syntax uses `ONE ROW PER MATCH` explicitly. In SQL Standard syntax this is the default and is simply omitted.

### Complete Translation Example

```sql
-- Custom syntax
SELECT v.number AS account_nr, ELEMENT_NUMBER(v) AS elem_nr
FROM MATCH ANY (a1:Account) -[:transaction]->* (a2:Account)
       ON financial_transactions
       ONE ROW PER VERTEX ( v )
WHERE a1.number = 1001 AND a2.number = 8021
ORDER BY ELEMENT_NUMBER(v)

-- SQL Standard syntax
SELECT account_nr, elem_nr
FROM GRAPH_TABLE (financial_transactions
  MATCH (a1 IS Account) -[IS transaction]->* (a2 IS Account)
  KEEP ANY   -- spec syntax; Oracle AI Database does not accept this line (see caveat above)
  WHERE a1.number = 1001 AND a2.number = 8021
  ONE ROW PER VERTEX ( v )
  COLUMNS (v.number AS account_nr, ELEMENT_NUMBER(v) AS elem_nr)
)
ORDER BY elem_nr
```

---

## Features Not Supported in SQL Standard Syntax

Always check this section BEFORE attempting a translation. If the query uses any of these features, it cannot be translated to SQL Standard syntax. State this clearly and explain why.

### Path Modes: Cheapest Path (ANY CHEAPEST, COUNTED CHEAPEST)

**Not supported.** Cheapest path finding has not yet been added to the SQL Standard. The spec explicitly notes:

> *"Use PGQL with custom syntax since cheapest path finding support has not yet been added to the SQL Standard."*

This applies to:
- `ANY CHEAPEST` path mode
- `CHEAPEST k PATHS` (counted cheapest) path mode
- The `COST` clause used inside variable-length path patterns

Queries using these must remain in custom syntax.

```sql
-- Custom syntax only — cannot be translated
SELECT COUNT(e) AS num_hops, SUM(e.amount) AS total_amount
FROM MATCH ANY CHEAPEST (a:Account) (-[e:transaction]-> COST e.amount)* (b:Account)
       ON financial_transactions
WHERE a.number = 10039 AND b.number = 2090
```

### OPTIONAL MATCH Clause

**Not supported.** All `OPTIONAL MATCH` examples in the spec are marked "See PGQL with custom syntax." There is no equivalent inside `GRAPH_TABLE`.

```sql
-- Custom syntax only — cannot be translated
SELECT p.name AS person, c.name AS company
FROM MATCH (p:Person),
     OPTIONAL MATCH (p) -[:worksFor]-> (c:Company)
ORDER BY p.name
```

### SELECT * Returning Graph Objects

**Not supported.** SQL Standard syntax does not allow returning entire vertex or edge objects from queries. `SELECT *` in the outer query works only when all projected values are scalars defined in `COLUMNS`.

```sql
-- Custom syntax only — cannot be translated (returns graph objects)
SELECT *
FROM MATCH (n:Person) -> (m) ON my_graph
```

### PREFIX Construct (SELECT v.* PREFIX '...')

**Not supported.** The spec explicitly notes:

> *"Use PGQL with custom syntax since the SQL Standard does not have a PREFIX construct."*

```sql
-- Custom syntax only — cannot be translated
SELECT n.* PREFIX 'n_', e.* PREFIX 'e_', m.* PREFIX 'm_'
FROM MATCH (n:Account) -[e:transaction]-> (m:Account) ON financial_transactions
```

### Graph Modification (INSERT, UPDATE, DELETE)

**Not supported** via `GRAPH_TABLE`. These are read-only query features. Graph modification statements have no `GRAPH_TABLE` equivalent.

### Built-in Functions Not Supported in SQL Standard Syntax

- **`LABEL(element)`** — Not supported. Explicitly stated as not allowed with SQL Standard syntax. Use `IS Label` in the pattern or `IS [NOT] LABELED` predicate instead.

  ```sql
  -- Custom syntax only
  SELECT label(n) AS lbl, COUNT(*) FROM MATCH (n) ON hr GROUP BY lbl

  -- SQL Standard alternative: use label expressions in MATCH pattern
  -- There is no direct equivalent for retrieving the label as a value
  ```

- **`LABELS(element)`** — Not supported. Returns the set of labels of a vertex or edge. Not allowed in SQL Standard syntax for the same reason as `LABEL()`.
- **`JAVA_REGEXP_LIKE`** — Not supported. A Java-specific regular expression function with no SQL Standard equivalent. Use SQL Standard `REGEXP_LIKE` or `LIKE` instead.
- **`ID(element)`** — Not the SQL Standard name. In custom syntax, `ID(v)` retrieves a vertex or edge identifier. In SQL Standard syntax, use `VERTEX_ID(v)` or `EDGE_ID(e)` respectively. `ID()` is a custom syntax alias — always use the explicit `VERTEX_ID()` / `EDGE_ID()` forms in SQL Standard syntax.

### User-Defined Functions: Package Name Prefix

**Not supported.** In custom syntax, UDFs can be called with an optional package name prefix: `package_name.function_name(args)`. The package name prefix is not allowed in SQL Standard syntax.

```sql
-- Custom syntax only
SELECT mypackage.myfunction(n.amount) AS result
FROM MATCH (n:Account) ON my_graph

-- SQL Standard: call function without package prefix
```

### Summary Table

| Feature | Custom syntax | SQL Standard |
|---|---|---|
| `ANY CHEAPEST` path mode | Yes | No |
| `CHEAPEST k PATHS` path mode | Yes | No |
| `COST` clause | Yes | No |
| `OPTIONAL MATCH` | Yes | No |
| `SELECT *` returning graph objects | Yes | No |
| `PREFIX` construct | Yes | No |
| `INSERT` / `UPDATE` / `DELETE` | Yes | No |
| `LABEL(element)` function | Yes | No |
| `LABELS(element)` function | Yes | No |
| `JAVA_REGEXP_LIKE` function | Yes | No |
| `ID(element)` (use `VERTEX_ID`/`EDGE_ID`) | Yes | No |
| UDF package name prefix | Yes | No |

---

## Oracle AI Database GRAPH_TABLE Implementation Notes (26ai / Release 26.3)

Everything above this section describes the **language-level** custom-syntax-vs-SQL-Standard split defined by the PGQL 2.1 spec and SQL:2023 Part 16. Oracle AI Database's `GRAPH_TABLE` operator implements a **subset** of that SQL Standard syntax. As of Oracle AI Database 26ai (Release 26.3), Oracle's own "Supported Features and Limitations When Querying a SQL Property Graph" page and the SQL Property Graph restrictions notes list the following gaps, on top of everything already marked "not supported in SQL Standard syntax" above:

| Feature | In SQL:2023 / PGQL spec | In Oracle AI Database `GRAPH_TABLE` (26ai / 26.3) |
|---|---|---|
| `KEEP` clause / path-finding goals (`ANY`, `ALL`, `ALL SHORTEST`, `SHORTEST k PATHS`, `ANY CHEAPEST`) | Yes (except cheapest) | **No** — "Variable-length pattern matching goals ... are not supported" |
| `COST` / `TOTAL_COST` clauses | No (cheapest-path only, custom syntax) | **No** — explicitly listed as unsupported |
| Path pattern variables (`MATCH p = (n)-[e]->(m)`) | Yes | **No** — explicitly listed as unsupported |
| Inline subqueries / `LATERAL` inline views inside `GRAPH_TABLE` | N/A | **No** — explicitly listed as unsupported |
| SQL Macros | N/A | **No** — explicitly listed as unsupported |
| Unbounded quantifiers (`*`, `+`, `?`, `{n,}`) | Yes | Not documented as supported — only bounded `{n}`, `{n,m}`, `{,m}` are confirmed |

Oracle AI Database's `GRAPH_TABLE`, in turn, **does** confirm support for: single/no/disjunctive/conjunctive label expressions, all edge-direction forms, anonymous vertex/edge variables, bounded recursive (variable-length) path patterns, bind variables in `WHERE`, `VERTEX_ID`/`EDGE_ID`/`VERTEX_EQUAL`/`EDGE_EQUAL`, SQL and JSON expressions and PL/SQL functions inside `WHERE`/`COLUMNS`, graph algorithm functions (GAFs) invoked from `GRAPH_TABLE`, standard SQL case-sensitivity rules for identifiers, SQL hints, and cross-schema graph queries (given privileges).

### Oracle AI Database Release-Update Feature Timeline

| Release Update | Feature added to `GRAPH_TABLE` |
|---|---|
| 23.4 | Initial `GRAPH_TABLE` operator: `MATCH`, `WHERE`, `COLUMNS`, aggregate functions, `SOURCE`/`DESTINATION` predicates, selecting all properties (`a.*`), executing PGQL `SELECT` queries against SQL property graphs |
| 23.6 | `binding_count()` aggregate |
| 23.7 | `ONE ROW PER MATCH` / `VERTEX` / `STEP` clauses, combinable with variable-length path patterns |
| 23.8 | `MATCHNUM` and `ELEMENT_NUMBER` functions |
| 23.9 | `IS LABELED` and `PROPERTY_EXISTS` predicates; path variables for multiple path patterns; `PATH_NAME` function and `IN` path clause (for use with `ONE ROW PER VERTEX`/`STEP`) |
| 23.26.0 | `COMMENT ON PROPERTY GRAPH` |
| 23.26.1 | SQL property graphs can be created from database views |
| 23.26.2 | Graph algorithm functions (`DBMS_OGA`) invocable directly from within `GRAPH_TABLE` |

No release through 26.3 has added `KEEP`, path modes, or `COST`/`TOTAL_COST` support.

---

## Best Practices

- **Check unsupported features before translating.** Read the "Features Not Supported in SQL Standard Syntax" section first — if a query uses cheapest-path search, `OPTIONAL MATCH`, `PREFIX`, graph modification, or `LABEL()`/`LABELS()`, it cannot move to SQL Standard syntax and must stay in custom syntax.
- **Apply `COUNT(e)` → `COUNT(EDGE_ID(e))` consistently** across every occurrence in a query, not just the first one (Rule 7).
- **Use inline `WHERE` on elements when possible** (`(a IS Account WHERE a.number = 1001)`) for filters that apply to a single vertex or edge pattern — this mirrors the SQL Property Graph best practice of pushing filters close to the pattern for the optimizer.
- **Expose shared vertices as `VERTEX_ID()` when splitting `MATCH` clauses** with different path modes into separate `GRAPH_TABLE` operators — graph objects cannot cross a `GRAPH_TABLE` boundary, only their scalar identifiers can.
- **Default to omitting `ONE ROW PER MATCH`** in SQL Standard syntax since it's the implicit default; only state `ONE ROW PER VERTEX` or `ONE ROW PER STEP` explicitly when a different granularity is needed.
- **When the target is Oracle AI Database, never emit `KEEP`, `COST`, or unbounded quantifiers** — none are implemented as of 26ai (26.3); see [Oracle AI Database GRAPH_TABLE Implementation Notes](#oracle-ai-database-graph_table-implementation-notes-26ai--release-263). A query that needs shortest-path or cheapest-path semantics cannot be expressed in `GRAPH_TABLE` today — say so rather than emitting a `KEEP` clause that will error.

---

## Common Mistakes

### Mistake 1: Using `:Label` Syntax Inside GRAPH_TABLE

```sql
-- WRONG: colon syntax is custom-only
MATCH (a:Account) -[:transaction]-> (b:Account)
```

```sql
-- RIGHT: SQL Standard requires IS
MATCH (a IS Account) -[IS transaction]-> (b IS Account)
```

### Mistake 2: Forgetting COST Cannot Be Translated

Translating a cheapest-path query to `GRAPH_TABLE` silently drops correctness — there is no `KEEP` equivalent for `ANY CHEAPEST` or `COST`. Leave these queries in custom syntax rather than approximating with `KEEP ANY SHORTEST PATH`, which is a different algorithm with different results.

### Mistake 3: Expecting SELECT * to Work in SQL Standard Syntax

`SELECT *` over a `GRAPH_TABLE` query only works when every projected value is a scalar defined in `COLUMNS`; it cannot return whole vertex/edge objects the way custom-syntax `MATCH ... ON graph` queries can.

### Mistake 4: Treating Disconnected Patterns as a Join

Comma-separated path patterns with no shared variable produce a Cartesian product, not a join — the same pitfall as in SQL Property Graph (see `sql-property-graph.md`, Mistake 5).

### Mistake 5: Assuming Oracle AI Database Supports KEEP / Path Modes

Rules 3–4 above translate custom-syntax path modes into `KEEP`, which is valid per the spec but **not implemented by Oracle AI Database's `GRAPH_TABLE`** (see the Implementation Notes above):

```sql
-- WRONG in Oracle AI Database — KEEP is not part of Oracle's GRAPH_TABLE grammar
SELECT * FROM GRAPH_TABLE (my_graph
  MATCH (a) -[e]->* (b)
  KEEP ANY SHORTEST PATH
  COLUMNS (COUNT(EDGE_ID(e)) AS hops)
);
```

Such a query must stay in custom PGQL syntax (run through the Graph Server/PGX Java APIs) or use a different in-database approach, e.g. a recursive `WITH` clause or a graph algorithm function.

---

## Tools for Working with PGQL

### SQLcl PGQL Plug-in

A separately-downloaded plug-in that lets SQLcl run PGQL **custom syntax** statements directly from the command line, with optional translation to the equivalent SQL. It is versioned and distributed as part of the Oracle Graph Server and Client Release 20.3+ (latest: 26.3) downloads, but does not require that server to be installed or running — it talks to the database directly.

**Core command:** `pgql auto on` switches the session into PGQL mode — every subsequent `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, and `DROP` is parsed as a PGQL (custom syntax) statement instead of SQL. `pgql auto off` switches back.

```
pgql auto on [schema <schema_name>] [graph <graph_name>]
             [execute | executeonly] [translate | translateonly]
             [parallel <n>] [dynamic_sampling <n>]
```

| Option | Effect | Default |
|---|---|---|
| `schema <name>` | Run queries against graphs owned by this schema | not set |
| `graph <name>` | Run queries against this graph — omit `ON graph_name` from queries | not set |
| `execute` / `executeonly` | Execute PGQL (the latter suppresses the SQL translation output) | execute: on |
| `translate` / `translateonly` | Show the PGQL-to-SQL translation (the latter turns execution off) | translate: off |
| `parallel <n>` | Run/translate with this parallel hint | 0 |
| `dynamic_sampling <n>` | Run/translate with this dynamic sampling level | 6 |

```sql
pgql auto on;

CREATE PROPERTY GRAPH scott_hr
  VERTEX TABLES (
    emp KEY(empno) LABEL Employee PROPERTIES ARE ALL COLUMNS EXCEPT (deptno),
    dept KEY(deptno) LABEL Department PROPERTIES (deptno, dname)
  )
  EDGE TABLES (
    emp AS works_for KEY(empno)
      SOURCE KEY (empno) REFERENCES emp
      DESTINATION KEY (deptno) REFERENCES dept
      NO PROPERTIES
  )
  OPTIONS(PG_PGQL);

SELECT e.ename AS name
FROM MATCH (e:Employee) ON scott_hr
ORDER BY e.ename
LIMIT 4;
```

`pgql auto on graph scott_hr` sets a default graph so queries can drop `ON scott_hr`; `pgql auto on translateonly parallel 2` shows the generated SQL (with a `parallel` hint) instead of running it — useful for inspecting how a custom-syntax query maps to SQL.

### SQL Developer

Oracle SQL Developer has built-in "Support for Property Graph" (User's Guide § 2.27): *"You can use SQL Developer to execute Property Graph Query Language (PGQL) queries directly against property graphs in Oracle Database."* The dedicated PGQL Worksheet was introduced in SQL Developer 22.2. **Recommended version: 26.2 or later.**

- Expand **PG Objects** under the **Property Graph** node in the Connections navigator to browse existing property graph objects.
- Right-click the **Property Graph** node → **Open PGQL Worksheet** for a worksheet with a dedicated Run Query icon that parses input as PGQL custom syntax (no `pgql auto on` needed, unlike SQLcl).
- Create a graph by running a `CREATE PROPERTY GRAPH ... OPTIONS(PG_PGQL)` statement in the worksheet, then refresh **PG Objects** to see it.
- Clicking a graph opens a worksheet pre-filled with a default query: `SELECT id(e), id(v), id(n) FROM MATCH (v)-[e]-(n) ON <graph_name> LIMIT 100`.
- `SELECT`, `INSERT`, and `UPDATE` all run against the graph's vertices and edges, with results in the bottom pane; `DROP` removes the property graph object.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle 19c:** No SQL/PGQ and no `GRAPH_TABLE` operator — SQL Property Graph is a 23ai+ (latest: 26ai / Release 26.3) feature (see `sql-property-graph.md`). Property graph support on 19c uses PGQL **custom syntax** only (`SELECT ... FROM MATCH ... ON graph`); none of the `GRAPH_TABLE`/SQL-Standard-syntax content in this guide applies. Creating and querying a PGQL property graph does **not** require installing the separate Oracle Graph Server and Client — the [SQLcl PGQL plug-in and SQL Developer](#tools-for-working-with-pgql) both work directly against the database.
- **Oracle 23ai (23c):** `GRAPH_TABLE` introduced (Release Update 23.4), with the feature timeline in the table above extending it through Release Update 23.26.2.
- **Oracle AI Database 26ai (26.1–26.3):** Continued iteration on the same `GRAPH_TABLE` foundation, adding full ISO/IEC SQL/PGQ standard support and native graph representation — but the gaps listed in the Implementation Notes above (`KEEP`/path modes, `COST`, etc.) remain as of Release 26.3. Re-check Oracle's "Supported Features and Limitations When Querying a SQL Property Graph" page for your specific release before relying on any construct not confirmed in this guide.

---

## Sources

- [PGQL Project Site](https://pgql-lang.org/)
- [PGQL 2.1 Specification](https://pgql-lang.org/spec/2.1/)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — PGQL Property Graphs](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/pgql-property-graphs.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — SQL Graph Queries](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/sql-graph-queries.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — About Graph Pattern](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/graph-pattern.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — Variable Length Path Patterns](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/variable-length-path-patterns.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — Complex Path Patterns](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/complex-path-patterns.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — Using ONE ROW PER Clause](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/using-one-row-clause-sql-graph-query.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — Vertex and Edge Identifiers](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/vertex-and-edge-identifiers.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — Using the SOURCE and DESTINATION Predicates](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/using-source-and-destination-predicates.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — Using Aggregate Functions in SQL Graph Queries](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/using-aggregate-functions-sql-graph-queries.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — Supported Features and Limitations When Querying a SQL Property Graph](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/supported-feature-and-limitations-when-querying-sql-property-graph.html)
- [Oracle AI Database Graph Developer's Guide, Release 26.3 — Key Property Graph Features in Oracle AI Database 26ai](https://docs.oracle.com/en/database/oracle/property-graph/26.3/spgdg/key-property-graph-features-oracle-ai-database-26ai.html)
- [Oracle AI Database 26 Release Notes — Property Graph Features That Work With Oracle AI Database 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/rnrdm/property-graph-restrictions.html)
- [Oracle SQLcl User's Guide, Release 26.2 — Using the PGQL Plug-in](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/26.2/sqcug/using-pgql-plug-sqlcl.html)
- [Oracle SQL Developer User's Guide, Release 26.2 — § 2.27 Support for Property Graph](https://docs.oracle.com/en/database/oracle/sql-developer/26.2/rptug/sql-developer-concepts-usage.html#GUID-961A3715-5207-4A1C-B406-7DC6F24A6579)
