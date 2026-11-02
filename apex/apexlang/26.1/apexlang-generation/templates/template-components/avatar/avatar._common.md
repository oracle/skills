---
templateId: region.avatar.common
componentType: region
version: 1.0
description: Shared contract for standalone Avatar report regions.
---

# Purpose

Document the compiler-backed standalone Avatar region emitted as `themeTemplateComponent/avatar`.

# Generation Rules (MANDATORY)

1. Use `type: themeTemplateComponent/avatar`.
2. Emit `componentAppearance { display: report }`.
3. Emit an `appearance {}` block and default to `@/standard` unless an owning page contract proves another region template.
4. For SQL-backed Avatar regions, keep `source.sqlQuery` unordered and emit deterministic sorting in top-level `orderBy {}`.
5. Use `settings {}` for standalone Avatar attributes. Do not wrap standalone settings in `plugin-avatar {}`.
6. Set exactly one Avatar type: `initials`, `icon`, or `image`.
7. Emit only the payload property activated by the selected type: `initials`, `icon`, or `image`.
8. For `settings.initials`, emit the direct uppercase source-column identifier such as `AVATAR_INITIALS`; this `sessionStateValue` property selects a column and must not use `&COLUMN_NAME.` substitution syntax.
9. For initials, bind a declared `varchar2` source column; the Avatar export does not support non-character initials values. Free-text properties such as `settings.description` may use `&COLUMN_NAME.` substitution syntax.
10. For icons, use exactly one icon from the canonical build-pinned `assets/indexes/font-apex-icon-index.json` plus only optional listed modifiers. Validate literals directly. For column-backed icons, project approved literals or an explicit `case` mapping whose every output satisfies the same contract; raw/unverified icon columns, multiple icons, and arbitrary classes are forbidden.
11. The canonical image scenario in this pack uses `image.type: urlColumn` and a projected character URL column. In SQL, build every rendered value with the canonical bind form `:APP_FILES || 'relative/path'` or `:APEX_FILES || 'relative/path'`. Reject template and substitution tokens inside SQL literals, `AUTHENTICATED_URL_PREFIX`, BLOB endpoints, path traversal, raw URL columns, `javascript:`, `data:`, protocol-relative, and absolute external URLs.
12. Emit one explicitly named `column <COLUMN_STATIC_ID> (...)` child for every delivered source projection.
13. Every child column must define a unique uppercase snake_case declaration name, `layout.sequence`, `source.databaseColumn`, and `source.dataType`; the live compiler rejects lowercase or hyphenated external identifiers.
14. Do not emit generic-column `columnName` or `show` properties on standalone Avatar child columns; use its template-component column contract instead.
15. Use only shape, size, spacing, and type values listed in `avatar._template_options.md`.
16. Require `settings.description` for every meaningful initials, icon, or image Avatar. It must be nonempty human-readable text or an `&UPPERCASE_COLUMN.` substitution backed by a declared `varchar2` source column whose meaning is verified from schema documentation, live metadata, or an explicit user assertion. For dynamic sources, persist the provenance as exactly one of `AVATAR_DESCRIPTION_EVIDENCE_SOURCE=schema_doc`, `AVATAR_DESCRIPTION_EVIDENCE_SOURCE=live_db`, or `AVATAR_DESCRIPTION_EVIDENCE_SOURCE=user_asserted`.
17. Omit `settings.description` only when the Avatar is explicitly decorative and emit the exact region comment marker `AVATAR_PURPOSE_DECORATIVE`. Universal Theme 42 build `26.1.0+3102` renders description-less non-image Avatars with `aria-hidden="true"` and image Avatars with `alt=""`.
18. Emit `cssClasses` only for an explicit styling requirement. Values must be static; custom classes must use the `avatar-` prefix; visibility-changing classes are forbidden. Add `AVATAR_CSS_RATIONALE=<reason>` to region comments. Framework utility classes also require the exact comment marker `AVATAR_FRAMEWORK_UTILITIES_EXPLICIT_REQUEST`.
19. Prefer shape, size, spacing, templates, and template options over custom or framework CSS. Do not invent CSS to solve layout or composition.
20. When the owning page or application contract restricts Avatar visibility, emit `security.authorizationScheme` as `mustNotBePublicUser` or an `@alias` that resolves to a declared shared authorization scheme in the validation set.
21. Do not invent authorization schemes or treat visual hiding as access control.
22. The Avatar theme export declares no action templates; do not emit an action-template scenario from the separate `link` action position.
23. Do not emit BLOB image, grouping, link-action, or partial-mode structures from this contract.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Stable region identifier. |
| name | yes | string | Region name. |
| source.sqlQuery | yes for SQL mode | SQL | Must use verified database-object evidence when it references DB objects. |
| orderBy.orderByClause | yes for SQL mode | string | Deterministic clause body without the `ORDER BY` keyword. |
| layout.sequence | yes | number | Stable page-region sequence. |
| settingsBlock | yes | block | Exact settings block from one selected Avatar scenario. |
| settings.type | yes | enum | `initials`, `icon`, or `image`. |
| settings.initials | conditional | source-column identifier | Required only when `settings.type: initials`; direct uppercase identifier without `&` or trailing `.`. |
| settings.icon | conditional | string/substitution | Required only when `settings.type: icon`. |
| settings.image | conditional | object | Required only when `settings.type: image`. |
| settings.description | conditional | string/substitution | Required for meaningful Avatars; nonempty human-readable text or a declared `varchar2` description-column substitution. Omit only for an explicitly decorative Avatar. |
| settings.shape | optional | enum | Accepted Avatar shape token. |
| settings.size | optional | enum | Accepted Avatar size token. |
| settings.spacing | optional | enum | Report-level spacing token. |
| settings.cssClasses | optional | string | Static, documented, component-scoped classes only; never dynamic or visibility-changing. |
| commentsBlock | conditional | block | Required for decorative intent, dynamic-description evidence, and whenever `cssClasses` is emitted; carries exact governance markers, evidence provenance, and CSS rationale. |
| securityBlock | conditional | block | Required when the owning contract restricts access; omit only for intentionally unrestricted Avatar data. |
| security.authorizationScheme | conditional | shared-component reference | Exact existing authorization scheme; never inferred. |
| column.name | yes | identifier | Unique uppercase snake_case child declaration name that supplies `identification.name`. |
| column.layout.sequence | yes | number | Stable column sequence. |
| column.source.databaseColumn | yes | string | Exact projected source alias. |
| column.source.dataType | yes | enum | Compiler-supported source datatype such as `varchar2` or `number`. |
| columns | yes | list | One explicit child column for every delivered source projection. |

# Output Template

```apexlang
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/avatar
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
        sequence: {{layout.sequence}}
        slot: body
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    componentAppearance {
        display: report
    }
    {{securityBlock}}
    {{settingsBlock}}
    {{commentsBlock}}
    column {{column.nameUpperSnakeCase}} (
        layout {
            sequence: {{column.layout.sequence}}
        }
        source {
            databaseColumn: {{column.source.databaseColumn}}
            dataType: {{column.source.dataType}}
        }
    )
    {{columns}}
)
```

# Conditional Rendering Rules

- `settings.type: initials` emits `initials` and omits `icon` and `image`.
- `settings.type: icon` emits `icon` and omits `initials` and `image`.
- `settings.type: image` emits `image: { ... }` and omits `initials` and `icon`.
- Omit optional settings when no authoritative input requires them.
- For a decorative Avatar, omit `settings.description` and emit:
  ```apexlang
  comments {
      comments: AVATAR_PURPOSE_DECORATIVE
  }
  ```
- For a dynamic description source, record the verified provenance with exactly one `AVATAR_DESCRIPTION_EVIDENCE_SOURCE=schema_doc|live_db|user_asserted` entry in region comments. A generic assertion-only marker is not evidence.
- When custom CSS is required, keep the comment scalar semicolon-delimited when it carries multiple markers, for example `AVATAR_CSS_RATIONALE=Distinguishes approved support identities; AVATAR_FRAMEWORK_UTILITIES_EXPLICIT_REQUEST`.
- Include one child column for every source alias, including hidden identity, description, icon, initials, and URL columns.
- Keep uppercase snake_case declaration names unique within the Avatar region. Bind `settings.initials` through its direct projected database-column identifier; use substitutions only for free-text settings that support them.
- Keep the selected payload column datatype compatible with the Avatar attribute: initials, icon, description, and URL-column image values are `varchar2` in this pack.
- Require `description` unless the exact decorative-purpose region comment marker is present; do not emit both.
- When `cssClasses` is present, require static safe classes and the matching comments rationale/approval evidence.
- Emit `security { authorizationScheme: ... }` only with `mustNotBePublicUser` or an `@alias` resolving to an existing shared authorization scheme selected by the owning security contract.
- If restricted access is required but the scheme cannot be resolved, stop with Missing Inputs.

# Validation Checklist

- Region type is exactly `themeTemplateComponent/avatar`.
- Component display is `report`.
- SQL contains no `ORDER BY`; top-level `orderBy` supplies deterministic sorting.
- Exactly one type-specific payload is present.
- Every query projection has an explicitly named `column <COLUMN_STATIC_ID> (...)` child.
- Every column contains a declaration name, `layout.sequence`, `source.databaseColumn`, and `source.dataType`.
- `settings.initials` uses a direct declared `varchar2` source-column identifier, while free-text values such as `settings.description` may use `&COLUMN_NAME.` substitutions.
- Meaningful Avatars have a verified human-readable description; dynamic description sources record their evidence provenance, while decorative Avatars use the exact decorative marker and no description or description column.
- Icon values are exact members of the build-pinned Font APEX index; column-backed values use a statically verified mapping.
- URL-column image expressions are application-managed and reject unsafe or untrusted URL forms.
- `cssClasses` are static, component-scoped, documented, and do not alter visibility.
- Shape, size, spacing, and type tokens exist in `avatar._template_options.md`.
- Restricted Avatar regions reference an existing shared authorization scheme.
- No action template is emitted because the Avatar export defines none.
- No deferred BLOB, grouping, link-action, or partial-mode structure is present.
