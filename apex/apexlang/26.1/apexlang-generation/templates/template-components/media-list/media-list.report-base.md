---
templateId: region.media-list.report-base
componentType: region
version: 2.0
imports:
  - media-list._common.md
description: Base standalone Media List report with title, optional description, deterministic ordering, and compiler-resolved report columns.
---

# Purpose

Render a native multi-row Media List without Avatar, Badge, grouping, or interaction.

# Output Template

```apexlang
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/mediaList
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
    orderBy {
        type: staticValue
        orderByClause: {{orderBy.orderByClause}}
    }
    layout {
        {{parentRegionProperty}}
        sequence: {{layout.sequence}}
        slot: {{layout.slot}}
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    componentAppearance {
        display: report
    }
    settings {
        title: {{titleColumn}}
        {{descriptionProperty}}
    }
    {{securityBlock}}
    {{compilerResolvedIdentityColumnBlock}}
    {{compilerResolvedTitleColumnBlock}}
    {{compilerResolvedDescriptionColumnBlock}}
    {{compilerResolvedRemainingColumnBlocks}}
)
```

# Conditional Rendering Rules

- `settings.title` uses the bare projected alias and the matching title column is `varchar2`.
- When description is requested, set `descriptionProperty` to `description: {{descriptionColumn}}` and emit one matching `varchar2` column block.
- Omit the description setting and column together when the report has no description field.
- Keep the identity field source-backed and apply the active contract's identity/visibility property when one exists; it is an ordering/action-context tie-breaker, not a rendered template value.
- Emit `source.type: databaseColumn` when the active target-build column contract marks the property required. A compiler default value does not permit omission by itself; stop only for a genuine grammar-versus-requiredness mismatch.
- Add every remaining source projection once using the same compiler-resolved Media List column shape.
- Keep deterministic ordering stable for duplicate titles by including a verified identity alias as the final tie-breaker.

# Validation Checklist

- Title and optional description aliases are explicitly projected and declared.
- Every projected source field has one matching column using the active target-build declaration and required mappings.
- No Avatar, Badge, grouping, or action block is emitted.
- SQL contains raw data and no `ORDER BY` or presentation HTML.
