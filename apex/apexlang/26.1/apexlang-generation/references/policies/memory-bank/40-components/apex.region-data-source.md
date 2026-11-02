# APEX Region Data Sources

## Purpose
Defines reusable APEXlang region data-source contracts for table/view/SQL ownership, schema hints, ordering, and display semantics.

## Data Source Semantics
- Use `Table` or `View` for simple single-object report, cards, and content-row regions; use `SQL` only for joins, aggregation, computed columns, contextual info, bind predicates, BLOB projection, map/calendar shaping, or explicit SQL behavior.
- SQL data sources must not emit a data-source object name; table and view data sources must name a verified schema object.
- A region heading is UI identity only and must not be interpreted as the data source name.
- Every data-backed region with row-level navigation or BLOB lookup must have deterministic primary keys from schema metadata.
- For table/view `Order By`, every sort token must be a real source column that also exists in the region columns block; expressions belong in SQL-backed sources only when the region supports SQL ordering.

## Schema UI Hints
- Treat schema comments and metadata tokens such as `apex:display`, `apex:filter`, `apex:lov`, `apex:link`, `apex:badge`, `apex:image`, `apex:hidden`, and `apex:format` as UI hints when they are present and unambiguous.
- Schema UI hints never override verified datatype, PK/FK, security, or component-template constraints.
- If multiple hints conflict, prefer the stricter/safest native component behavior and record the ambiguity instead of inventing a hybrid control.
- Use hints to refine render role, label, visibility, LOV/display choice, and format mask; do not use them to invent missing schema columns or unsupported attributes.

## Format Masks and Display Semantics
- Emit schema-driven date, timestamp, number, percent, and currency format masks when datatype and business meaning are clear.
- Do not use format masks to coerce incompatible datatypes; fix source projection or item type instead.
- Metric cards require numeric display semantics; apply compact KPI masks only to numeric metric values.
- Interactive Report context/comments should mirror important executable display settings such as format masks, display labels, read-only behavior, authorization, and LOV context when those settings are emitted.

Tags: apexlang, region, data-source, table, view, sql, schema-hint, format-mask, order-by
