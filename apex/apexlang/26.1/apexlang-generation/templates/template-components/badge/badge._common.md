---
templateId: region.badge.common
componentType: region
version: 1.0
description: Shared contract for standalone report-mode Badge template-component regions.
---

# Purpose

Document generation of a data-backed Badge region emitted as `themeTemplateComponent/badge`.

# Scope

In scope: report-mode Badge regions, verified data sources, Badge attributes, the optional `link` action, region/column authorization, security, and governance.

Out of scope: custom Badge template-component authoring and attaching Badge as a partial component inside another component.

# Generation Rules (MANDATORY)

1. Emit `type: themeTemplateComponent/badge` and `componentAppearance.display: report`.
2. Use any compiler-supported data-backed report source and preserve its exact `source.location` and `source.type` contract. The 26.1 matrix is `localDatabase` or `restEnabledSql` with `tableView`, `sqlQuery`, `functionBody`, or `propertyGraph`; plus `restSource`, `jsonDualityView`, `jsonSource`, and `sampleData`, whose locations select their source shape without `source.type`. Prefer a direct table/view source for a simple verified object, `sqlQuery` for joins or computed values, and an authoritative external-source contract when data is external.
3. Require authoritative evidence for every referenced object and column before generating object-specific source code.
4. Map `settings.label` and `settings.value`; both are required by the Badge template metadata.
5. Keep `settings.label` static and concise because Badge label metadata uses raw rendering. Do not bind a source column, substitution token, or other runtime input into the label.
6. Map the `sessionStateValue` settings `value` and `state` with bare source-column aliases such as `BADGE_VALUE` and `BADGE_STATE`. Do not wrap those aliases in `&COLUMN_NAME.` substitution syntax; APEX can resolve the substitution during import and then render the resolved text as a quoted column reference.
7. Emit one explicit child `column (...)` for every delivered source projection. Each source-backed child column uses `source.type: databaseColumn`, `source.databaseColumn`, and an exact compiler-supported `source.dataType`.
8. Treat `settings.state` as explicit user intent. When the user does not request a semantic state, omit `settings.state`, the state projection, and the state child column so the native Badge renders its normal state. When the user does request a state, use any compiler-supported source whose projected state column guarantees exact lowercase `danger`, `warning`, `success`, or `info`. For `sqlQuery`, require every branch and an explicit `ELSE` to return an allowlisted value. For table/view, REST, remote, or other sources, require authoritative upstream enum/constraint evidence; local lint verifies the mapping and `varchar2` datatype but cannot infer arbitrary runtime row values.
9. Emit `icon`, `displayLabel`, `style`, `shape`, and `size` only when required. Before assigning any Badge icon, load and consult the pinned Font APEX 26.1 catalogue; the icon must contain exactly one catalogue icon, with at most one optional `fa` base class and unique optional catalogue-listed modifiers. Never use a column mapping, substitution, unresolved template value, or concatenated class fragment.
10. Badge supports at most one action in the `link` position. Every emitted action must include a numeric `layout.sequence`, which the live compiler requires for region actions. Badge has no action templates. Do not invent button/menu templates or additional positions.
11. Use a reviewed structured `behavior.target` for Badge navigation. The local Badge policy rejects `targetUrl` because the repository has no application-specific destination allowlist; do not weaken this by passing an external destination through a column or substitution.
12. Do not emit Badge `linkAttributes`. Custom attributes and inline event handlers are rejected; implement behavior through the reviewed structured action target.
13. Apply `security.authorizationScheme` to the Badge region when visibility requires a verified authorization scheme. A link target must independently enforce the same or stricter authorization; hiding the Badge is not access control.
14. Keep output escaping enabled by default. Never generate HTML markup in SQL for the Badge value, label, state, or icon.
15. Use the native region template and options for composition. Do not invent CSS classes to reproduce Badge structure or state styling.
16. Keep deterministic ordering in top-level `orderBy {}` for multi-row Badge regions; do not place `ORDER BY` inside `source.sqlQuery`.

# Data Source Contract

- Direct table/view: use for a simple verified object with direct Badge mappings; an explicitly requested mapped state column requires authoritative enum/check-constraint evidence.
- `sqlQuery`: use for joins, computed Badge values/states, bind predicates, or aliases needed by the presentation contract; local lint proves literal and `CASE` state results.
- `functionBody`, `propertyGraph`, `restSource`, `jsonDualityView`, `jsonSource`, `sampleData`, and remote variants require an authoritative source contract, verified returned fields, and explicit upstream state-value guarantees when `settings.state` is mapped.
- Project only fields needed for label, value, optional state/icon, link context, deterministic ordering, and row identity.
- A link that passes row context requires a deterministic verified key column.
- Do not generate a source-free Badge region. The separate no-source region error is outside this component workflow.

# Attribute Contract

| Attribute | Required | Accepted value or mapping | Security note |
|---|---:|---|---|
| `settings.label` | yes | Non-empty plain static text only | Metadata renders the label raw; column mappings, substitutions, binds, unresolved template values, HTML, and event attributes are rejected. |
| `settings.value` | yes | Bare source-column alias such as `BADGE_VALUE` | Do not use `&BADGE_VALUE.`; value metadata strips HTML, but SQL must still return raw data rather than markup. |
| `settings.state` | no | Bare source-column alias whose values are restricted to `danger`, `warning`, `success`, or `info`; emit only when the user requests a semantic state | Do not use `&BADGE_STATE.`; treat the returned values as an allowlisted semantic token. |
| `settings.icon` | no | Exactly one pinned Font APEX icon with optional catalog modifiers | Do not accept dynamic values, duplicate base/modifier tokens, multiple icons, or arbitrary class fragments. |
| `settings.displayLabel` | no | boolean | Enable when the label adds meaning not already clear from context. |
| `settings.style` | no | `outline` or `subtle` | Omit to inherit the containing template default. |
| `settings.shape` | no | `circular`, `rounded`, or `square` | Omit to inherit the containing template default. |
| `settings.size` | no | `small`, `medium`, or `large` | Omit to inherit the containing template default. |

# Column Data Types

The child column mapped by `settings.value` must use an APEX 26.1 Badge-supported value datatype: `varchar2`, `number`, `date`, `intervalYearToMonth`, or `intervalDayToSecond`. The child column mapped by `settings.state` must use `varchar2`. Auxiliary projected columns may use any compiler-supported template-component datatype.

# Action Contract

- Omit the action when the Badge is informational.
- When navigation is required, emit at most one `action` with `position: link`.
- Give every action a deterministic numeric `layout.sequence`.
- Same-app targets must resolve to an existing authorized page and pass only verified item mappings.
- Use a structured target. Do not emit `targetUrl` or `linkAttributes` for Badge actions.
- Never treat Badge visibility as proof that the current user can access the target page or underlying row.
- Badge has no action-template inventory; omit `action.template`.

# Patterns

- Status list: static label plus a source-backed value and allowlisted state.
- Count/category list: source-backed value with an optional static label, no action by default.
- Authorized drilldown: source-backed Badge with one `link` action passing a verified row key to an existing authorized page.

# Anti-Patterns

- Static HTML or Classic Report markup that imitates a Badge.
- HTML-generating SQL for colors, labels, icons, or links.
- Arbitrary state values used as CSS classes.
- A dynamic label sourced from untrusted user HTML.
- A Badge link to an unresolved page, guessed item, or unrestricted external URL.
- A Badge action with `linkAttributes`, an inline event handler, or `targetUrl` without an application-specific allowlist.
- Adding a button/menu action template; Badge exposes only the `link` action position.
- Omitting `layout.sequence` from a Badge action; the live compiler requires it.
- Omitting child columns for fields projected by a report-mode source.
- Using region visibility as the only authorization check.

# Output Template – Report Mode

```apexlang
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/badge
    layout {
        sequence: {{layout.sequence}}
        slot: body
        startNewLayout: false
        startNewRow: true
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    componentAppearance {
        display: report
    }
{{source.block}}
    settings {
        label: {{settings.label}}
        value: {{settings.valueColumn}}
        {{#if settings.stateColumn}}
        state: {{settings.stateColumn}}
        {{/if}}
        icon: {{settings.icon}}
        displayLabel: {{settings.displayLabel}}
        style: {{settings.style}}
        shape: {{settings.shape}}
        size: {{settings.size}}
    }
    orderBy {
        type: staticValue
        orderByClause: {{orderByClause}}
    }
    security {
        authorizationScheme: {{security.authorizationScheme}}
    }
    column {{column.name}} (
        layout {
            sequence: {{column.layout.sequence}}
        }
        source {
            type: databaseColumn
            databaseColumn: {{column.source.databaseColumn}}
            dataType: {{column.source.dataType}}
            primaryKey: {{column.source.primaryKey}}
        }
    )
    {{columns}}
    {{linkAction}}
)
```

# Conditional Rendering Rules

- Omit optional settings rather than emitting unsupported or empty values.
- Omit `settings.state`, its source projection, and its child column unless the user explicitly requests a semantic state.
- Omit `orderBy` only when the source is guaranteed to return one row and ordering is irrelevant.
- Emit `security.authorizationScheme` only when a verified scheme exists; do not invent an alias.
- Emit the link action only when the destination and row-context mapping are resolved.
- Mark one source column `primaryKey: true` when a row-level link or row identity requires it.

The `{{#if settings.stateColumn}}` block is a conditional template fragment: render its contents only when semantic state is explicitly requested. It keeps the state mapping visible in the contract while omitting the setting when state is unspecified. Project that alias in the source and add its `varchar2` child column through `{{columns}}` when the fragment is rendered.

# Security and Governance

- Keep the page authenticated under the application baseline and use a verified region authorization scheme for narrower visibility.
- Enforce authorization again on the target page and in protected data access; region hiding alone is insufficient.
- Return raw data from SQL. Do not disable escaping or embed HTML to obtain Badge styling.
- Keep labels static because the Badge label renderer is raw according to the template profile.
- Allowlist state and icon tokens. Do not concatenate user-controlled strings into CSS classes or navigation URLs.
- Validate every source object, projected column, target page, target item, and authorization alias before generation.

# Validation Checklist

- Region type is `themeTemplateComponent/badge` and display mode is `report`.
- `settings.label` and `settings.value` are present.
- `settings.label` is trusted static text; it does not contain a source-column or template substitution.
- `settings.value` and optional `settings.state` use bare projected source-column aliases.
- The value column uses only `varchar2`, `number`, `date`, `intervalYearToMonth`, or `intervalDayToSecond`.
- Every projected field has an explicit child column with an exact compiler-supported data type.
- Optional style, shape, and size values come from `badge._template_options.md`.
- When state is requested, the mapped projected column is `varchar2` and its source contract guarantees exact lowercase `danger`, `warning`, `success`, or `info`; SQL literals and `CASE` expressions additionally require an explicit allowlisted `ELSE`.
- When state is not requested, no state setting, state projection, or state child column is emitted.
- Any assigned icon is selected from the pinned Font APEX catalogue and contains exactly one catalogue icon, at most one `fa` base class, and unique catalogue-listed modifiers.
- Badge actions do not contain `targetUrl`, `linkAttributes`, or inline event handlers.
- At most one action is present; it uses `position: link`, defines numeric `layout.sequence`, omits `template`, and has a resolved target.
- Region and target authorization are independently enforced.
- SQL contains raw values rather than HTML and does not contain `ORDER BY`.
- No partial-component attachment or custom Badge template authoring was introduced.
