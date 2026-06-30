# Report Column Rendering Standards

## Purpose
- Define one canonical contract for presentation markup in report columns across Classic Report, Interactive Report, and Interactive Grid.
- Keep SQL/PLSQL data-focused and move UI markup to report-column formatting attributes supported by the active compiler contract.

## Scope
- Applies to:
  - Classic Report columns
  - Interactive Report columns
  - Interactive Grid columns
- Applies when report source is SQL/PLSQL and when column output needs visual emphasis (status badges, highlighted amounts, icons, chips, etc.).

## Report Column Shape Matrix

| Family | Query-position metadata | Column `type` | Heading behavior | Source metadata | Link/navigation shape |
|--------|-------------------------|---------------|------------------|-----------------|-----------------------|
| Classic Report | Emit `reportColumnQueryId` and `derivedColumn`. | Omit for default text; emit `type: link` when the column owns `link {}`. | Visible columns emit `heading`; hidden columns omit `heading`. | Do not emit column `source {}`. | Column-level `link { target, linkText, linkAttributes }`; use `#COLUMN#` for row values. |
| Interactive Report | Do not emit `reportColumnQueryId` or `derivedColumn`. | Emit Interactive Report types such as `plainText` or `hidden`; do not copy Classic `type: link` unless compiler metadata proves it valid. | Every column emits `heading { heading: ... }`, including hidden columns. | Emit `source { dataType: ... }` when provided/required. | Column-level `link { target, linkText, linkAttributes }` when supported; use `#COLUMN#` for row values. |
| Interactive Grid | Do not emit Classic query-position metadata. | Emit grid item types such as `textField`, `numberField`, or `datePicker`; do not emit `type: link`. | Heading is optional and follows grid column metadata. | Emit supported `source` fields such as `databaseColumn`, `dataType`, and `primaryKey`. | Do not copy Classic/IR column-link syntax; grid navigation is compiler-gated and saved-report `displayColumn` metadata is not navigation metadata. |

## Rules (Non-Negotiable)
1. SQL/PLSQL source must remain data-only.
   - Do not emit HTML literals/tags in SQL/PLSQL used for report rendering.
2. For compiler contract `mmdVersion 26.1.053`, emit column markup only inside `columnFormatting.htmlExpression`.
   - Do not emit top-level `column ... htmlExpression: ...`.
3. When using `columnFormatting.htmlExpression`, keep the column as plain text rendering.
   - Do not emit `type: richText` for this pattern.
   - Do not emit `type: plainText` unless explicitly required; plain text is the implicit default.
4. Keep rendering logic declarative and column-scoped; do not push UI rendering into SQL projections.

## Canonical Rendering Shape
```apexlang
column SOME_COL (
  ...
  columnFormatting {
    htmlExpression: <span class="t-Badge">#SOME_COL#</span>
  }
)
```

## Fallback Behavior
- If the requested report type or runtime contract does not support column-level markup rendering:
  - keep SQL data-only,
  - render plain text/non-HTML output,
  - log a critique finding describing unsupported rendering capability,
  - do not emit unsupported attributes.

## Prohibited Patterns
- Top-level `htmlExpression` directly under report `column (...)`.
- `type: richText` on columns that use `columnFormatting.htmlExpression`.
- HTML literals in report SQL/PLSQL source.
- Region-specific ad-hoc rendering attributes not present in the active component contract.

## References
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/memory-bank/20-data/apex.sql.md`
- `assets/component-attributes.json`
