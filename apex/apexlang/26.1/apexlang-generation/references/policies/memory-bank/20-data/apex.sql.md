# SQL Best Practices

## Purpose
Guidelines for generating clean, consistent, and maintainable SQL queries within Oracle APEX or any AI tooling-generated code.

SQL snippets containing `{{...}}` are `metavariable_template` examples. Bind every variable from schema evidence before emitting SQL; do not copy unbound variables into generated artifacts.

## Rules
0. **Valid SQL**
  - Always check the data dictionary when writing SQL queries and ensure that the table/view name and corresponding columns actually exist

1. **Table Aliases**
   - Always assign an alias to every table.
   - Reference all columns using their alias (`s.{{source.pk}}`, `l.{{lookup.valueColumn}}`).
   - Applies even when the query contains a single table.

2. **Formatting**
  -  Never use SQL hints
   - Use **leading commas** in the SELECT clause:
     ```sql
     SELECT s.{{source.pk}}
          , s.{{source.displayColumn}}
          , s.{{source.amountColumn}}
     FROM {{source.table}} s
     ```
   - Place **each column on its own line** for readability.

3. **Join Style**
   - Always use **ANSI SQL JOIN syntax** (`INNER JOIN`, `LEFT JOIN`, etc.).
   - Avoid old-style comma joins or implicit joins in the WHERE clause.

4. **Column Validation**
   - Confirm every column name using the **data dictionary**.
   - Do **not** assume column names in joined tables — validate before use.
   - Ensure that each column has a unique name; use the foreign key reference when able to

5. **Pagination and Row Limits**
   - All report queries (Classic, IR, IG) must support pagination. Avoid unbounded datasets.
   - Defaults are region-specific: Classic Report -> `rowRangesXToYNoPagination`; Interactive Report -> `rowRangesXToY`; Interactive Grid -> `scroll`.
   - Provide explicit ORDER BY for deterministic pagination. Never rely on implicit ordering.
   - Use sensible caps for `maxRowsToProcess` and page size; defaults must not be excessive.

### Pagination Type Catalog (Authoritative)
- Classic Report `pagination.type` values:
  - `externalPaginationButtons` — External pagination controls.
  - `nextAndPreviousLinks` — Next/previous controls.
  - `rowRangesXToYNoPagination` — **Default**. Shows row range (X to Y).
  - `rowRangesXToYOfZNoPagination` — Shows row range and total count (X to Y of Z).
  - `rowRangesXToYOfZWithPagination` — Row ranges with pagination controls.
  - `setPaginationLinks` — Pagination links.
  - `setPaginationSearchEngine` — Search-engine style pagination.
  - `setPaginationSelectList` — Pagination select list.
  - Omit `pagination.type` to represent no explicit value (`null`).
- Classic/IR `pagination.displayPosition` values (only when `pagination.type` is present):
  - `bottomLeft`
  - `bottomRight`
  - `topLeft`
  - `topRight`
  - `topAndBottomLeft`
  - `topAndBottomRight`
- Interactive Report `pagination.type` values:
  - `rowRangesXToY` — **Default**.
  - `rowRangesXToYOfZ`
  - Omit `pagination.type` to represent `null`.
- Interactive Grid `pagination` values:
  - `type`: `scroll` (**Default**) or `page`
  - `showTotalCount`: boolean (`true`/`false`)
  - `displayPosition` is not supported.

> When a prompt specifies a pagination experience, select the closest matching region-specific catalog entry and document the choice in generated output. Otherwise, keep the region default.

6. **Bind Variables and Filtering**
   - Always use bind variables for user inputs and state (e.g., `:Pxx_ITEM`).
   - Do not concatenate user input into SQL; avoid SQL injection vectors.
   - Push complex filters into views where possible; UI should orchestrate, not own logic.
   - Every non-form bind variable must map to an existing or planned page item on the same page or a documented target page.
   - Optional filter predicates must use null-safe form, for example `(:P10_STATUS is null or o.status = :P10_STATUS)`.
   - When comparing a page item bind against a NUMBER column in non-form SQL, use explicit numeric typing such as `to_number(:P10_CUSTOMER_ID)`.
   - For columns ending with `_static_id`, normalize value comparisons in `WHERE` predicates using LOWER:
     - Compliant:
       ```sql
       WHERE lower(r.role_static_id) = lower(:P10_ROLE_ID)
       ```
       ```sql
       WHERE lower(r.role_static_id) in ('claim_adjuster', 'claim_supervisor')
       ```
     - Non-compliant:
       ```sql
       WHERE r.role_static_id = :P10_ROLE_ID
       ```
       ```sql
       WHERE r.role_static_id = 'CLAIM_SUPERVISOR'
       ```

7. **Views/Packages for Business Logic**
  - Heavy transformations/joins must live in secure views or packaged functions.
  - The UI should select from those views; this also simplifies RLS and caching.
  - Inline SQL size gate: if a SQL body exceeds 4000 raw characters, do not emit it directly in page DSL.
  - Extract oversized SQL into a secure view and have the APEX artifact reference that view.
  - Preserve only page-local predicates/order-by in the page artifact when still needed and still below the inline size limit.
  - If a safe view definition cannot be derived from verified metadata, stop with Missing Inputs rather than inventing view DDL.
  - Chart-focused documentation templates may inline lightweight CTEs to simulate data permutations (for example, stacking, dual-axis samples). Each CTE must document its purpose with a comment and keep datasets bounded and deterministic.

8. **SELECT List and Performance Hygiene**
   - No `SELECT *`. Project only required columns.
   - Avoid scalar subqueries in SELECT for high-volume lists; prefer joins or pre-computed columns in views.
   - Use appropriate indexes for facet/search/filter columns; ensure selectivity.
  - For report SQL (Classic/IR/IG), return raw values only; do not assemble HTML markup in SQL for UI presentation.
  - For markup placement and rendering syntax, follow `references/policies/memory-bank/30-pages/apex.report-column-rendering.md`.
  - `SQL_PLSQL_LOB_COMPARISON_KEY_FORBIDDEN_001`: raw LOB expressions (`BLOB`, `CLOB`, `NCLOB`, `BFILE`) must not be used as comparison keys in generated SQL or PL/SQL-owned SQL.
  - Oracle/APEX failure signature:
    ```text
    ORA-20999: Failed to parse SQL query! ORA-06550: line ..., column ...: ORA-22848: cannot use BLOB type as comparison key
    ```
  - Do not put raw LOB expressions in `GROUP BY`, `ORDER BY`, `SELECT DISTINCT`, set operations, analytic `PARTITION BY`/`ORDER BY`, equi-joins, or `WHERE`/`HAVING` comparison predicates.
  - LOB projection/display/storage/pass-through remains allowed where the runtime component supports it; the ban is only on comparison-key use.
  - For LOB-adjacent sort, group, filter, rank, join, or distinct intent, use deterministic scalar metadata: owning row primary key, foreign key, filename, MIME type, charset, last-updated timestamp, explicitly modeled checksum/hash, or `dbms_lob.getlength(<lob_expr>)` when the intent is file size.
  - If aggregate or ranked output must also display a LOB, aggregate/rank in a scalar inner query first, then join back to the base row to project the LOB in the outer query.

9. **Caching and Lazy Loading (Region-Level)**
   - Prefer lazy loading for below-the-fold or auxiliary regions.
   - Cache stable reference/LOV data; use Shared Components and APEX caching where appropriate.

10. **Downloads and Export**
   - CSV/Excel/PDF exports must be restricted by authorization scheme.
   - Enable only formats required by the business case. PDF requires a configured printing server.

11. **NLS and Format Masks**
  - Apply date/number/currency format masks consistently and respect session/user NLS.
  - Chart permutations should showcase supported axis `value.format` enums (`decimal`, `currency`, `percent`, `date*`, `datetime*`, `time*`) and avoid unsupported tokens.
  - Do not embed locale-specific strings in SQL; use Text Messages for translatable content.

12. **Security and RLS**
   - Enforce Row Level Security via secure views/VPD when needed; never rely on UI-only predicates.
   - Validate all item-driven filters server-side even if client-side validation exists.

13. **APEXlang Region SQL Compatibility**
  - Use `Type: Table` or `Type: View` for simple single-object report, cards, and content-row sources; use SQL only for joins, aggregation, computed columns, BLOB projection, contextual info, map/calendar sources, or bind predicates.
  - Do not emit a Data Source `Name` when the source type is SQL; table/view sources must name a verified schema object.
  - SQL for Content Row, Metric Card, Interactive Report, Map, and Calendar regions must not contain `ORDER BY`; move ordering to the region data-source attribute when supported.
  - For SQL-backed template component regions, always use top-level `orderBy {}`. Use `type: staticValue` with `orderByClause` by default, and reserve `type: item` for a same-page item that controls the ORDER BY clause.
  - Chart region SQL may include `ORDER BY` when needed for label/value presentation and must project exactly one label expression plus one numeric value expression per series.
  - Contextual Info Classic Reports must use SQL that returns one effective row for the current context.

14. **Canonical SQL Style for APEXlang**
  - Prefer lowercase SQL keywords in generated APEXlang artifacts and keep each major clause on its own line.
  - Use leading commas for select lists and align them consistently.
  - Place each `join` and `on` predicate on separate lines; do not use comma joins.
  - Do not use SQL hints, `select *`, or one-line SQL for generated region sources.
  - Keep expressions Oracle-valid for the target database version; avoid unsupported aliases, non-Oracle functions, and unverified identifiers.

## Pre-Validation Workflow (APEXlang generation)
- Before generating report/form regions, validate candidate SQL against the target schema (e.g., with SQLcl) to catch identifier and join issues early.
- Confirm that bind variables correspond to actual or planned page items (P[page]_...); remove unused binds.
- Prefer testing with minimal row limits and explicit ORDER BY to mirror final pagination behavior.

## Embedding SQL in APEXlang DSL
- In APEXlang, SQL must be provided as a triple-backticked multi-line string placed exactly where the template expects it (e.g., sqlQuery: ```sql ... ```).
- Do not wrap SQL in alternate code-fence syntaxes or YAML-style literals; mirror the template’s format precisely.
- Inline SQL over 4000 raw characters is non-compliant; move it into a secure view before final output.
- Keep business logic out of UI SQL; push heavy transformations to views/packages (see rule 7).

## Identifier Case and Column/LOV Mapping
- When defining explicit columns in content-row/cards templates, the column names must match the SQL SELECT list exactly (typically uppercase).
- For LOV columnMapping, ensure return and display names match the database column case (commonly uppercase) to avoid invalid identifier errors.

## SQLcl Pre-Validation (required for live schema work)
- Use SQLcl directly to validate SQL before emitting final APEXlang DSL when the output depends on real schema objects.
- Resolve `db_connection_name`, open SQLcl, and validate candidate queries against the live schema to catch identifier and join issues early.
- Do not emit final SQL for real schema objects until live validation succeeds.

## Example Seed Templates (Oracle)

- List/report seed data
  ```sql
  WITH seed AS (
    SELECT LEVEL AS id
         , TRUNC(DBMS_RANDOM.VALUE(1000, 9999)) AS amount
         , TO_CHAR(TRUNC(SYSDATE) - TRUNC(DBMS_RANDOM.VALUE(0, 365)), 'YYYY-MM-DD') AS {{source.createdOnColumn}}
         , SUBSTR(DBMS_RANDOM.STRING('U', 8), 1, 8) AS name
         , CASE WHEN DBMS_RANDOM.VALUE < 0.5 THEN 'ACTIVE' ELSE 'INACTIVE' END AS status
    FROM dual
    CONNECT BY LEVEL <= 200
  )
  SELECT s.id
       , s.name
       , s.status
       , s.amount
       , TO_DATE(s.{{source.createdOnColumn}}, 'YYYY-MM-DD') AS {{source.createdOnColumn}}
  FROM seed s
  ORDER BY {{source.createdOnColumn}} DESC, id
  ```

- LOV (display/return)
  ```sql
  WITH cats AS (
    SELECT 1 AS category_id, 'Hardware' AS category_name FROM dual UNION ALL
    SELECT 2, 'Software' FROM dual UNION ALL
    SELECT 3, 'Services' FROM dual
  )
  SELECT c.category_name AS display_value
       , c.category_id   AS return_value
  FROM cats c
  ORDER BY c.category_name
  ```

## Boundary with Processes and PL/SQL API Calls (Non‑Negotiable)
- SQL guidance above governs region sources and query generation.
- When page processes need to call PL/SQL package procedures/functions:
  - MUST: Use process type: invokeApi with invoke { package: PKG_NAME procedureOrFunction: PROC_OR_FUNC }.
  - MUST: Provide parameter blocks per argument with explicit direction (in | out | in out) and value mapping (item or expression with plsqlExpression).
  - MUST NOT: Use executeCode to call packages via plsqlCode (e.g., pkg_api.proc(...)). executeCode is reserved for short anonymous blocks only when no package API exists and must be justified; violations are flagged by critique.
- Dynamic Content regions may use plsqlFunctionBody for rendering HTML/CLOB and remain in scope of SQL/PLSQL best practices, but must not perform DML or manage transactions.

Tags: sql, oracle, sqlcl, mcp, validation, random-data, sample-sql, lov, pagination, read-only
