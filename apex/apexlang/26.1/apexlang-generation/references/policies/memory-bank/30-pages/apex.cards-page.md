# APEX Visual Summary Cards Page

## Purpose

Defines the deterministic page pattern for visual summaries of people, products, statuses, or other entities rendered with one native APEX Cards region. This pattern owns Cards composition only; it does not orchestrate filtering or search.

## Pattern Selection

- Select this pattern for people cards, product cards, status tiles, entity cards, or an explicit native Cards region.
- Use a Metric Card template-component region instead for aggregate KPIs or a normalized metric strip unless the request explicitly requires native Cards.
- Use a report pattern instead when dense comparison, sorting, or tabular scanning is the primary task.
- Do not add Faceted Search, Smart Filters, search items, facets, or filter dynamic actions under this pattern. Route a separate filtering/search request to its owning pattern.

Rule ID: `CARDS_VISUAL_SUMMARY_PATTERN_REQUIRED_001`.

## Source-to-Attribute Plan

Before rendering APEXlang, record one mapping row for every requested Cards role:

| Cards role | Required evidence | Native mapping |
|---|---|---|
| Title | SQL projection alias or REST data-profile column | `title.column`, or `title.htmlExpression` with `advancedFormatting: true` |
| Subtitle | SQL projection alias or REST data-profile column | `subtitle.column` or advanced formatting |
| Body | SQL projection alias or REST data-profile column | `body.column` or advanced formatting |
| Secondary body | SQL projection alias or REST data-profile column | `secondaryBody.column` or advanced formatting |
| Row identity | Proven primary-key or stable REST identity field | `card.primaryKeyColumn1` and optional `primaryKeyColumn2` when the source has a composite identity or BLOB media requires it |
| Icon | Pinned Font APEX token, projected icon-class column, or projected initials | `iconAndBadge` |
| Image | Raw BLOB alias, projected URL alias, or explicit direct URL | `media`, plus `blobAttributes` only for BLOB media |
| Badge | Projected metric or status alias | `iconAndBadge.badgeColumn` with optional label/classes |
| Link | Proven target page and target-item/source-column mapping | Native Cards `action` with declarative `behavior.target` |
| Conditional style | Projected, allowlisted semantic class token | The narrowest compiler-proven `cssClasses` property; never raw user-authored CSS |

- SQL-backed Cards use exactly `location: localDatabase`, `type: sqlQuery`, and a fenced `sqlQuery`; they must not also declare `restSource`. Every mapped alias must be present in the query projection and every referenced object/column must have DB object evidence.
- REST-backed Cards use exactly `location: restSource` plus `restSource: @alias`; they omit SQL `type` and `sqlQuery`. They require an existing REST Data Source plus an authoritative data profile. Map the profile's actual column names; do not infer JSON paths or aliases.
- A requested role with no proven source field is `unresolved`. Omit an optional unresolved role or stop with `Missing Inputs` when it is required by the request.
- Prefer direct `column` mapping with `advancedFormatting: false`. Use `htmlExpression` only for a requested composition that cannot be represented by one native column, set `advancedFormatting: true`, and escape text substitutions with `!HTML`.

Rule ID: `CARDS_SOURCE_MAPPING_REQUIRED_001`.

## Icons, Badges, and Conditional Styles

- Prefer `iconSource: iconClassColumn` for row-dependent icons and `iconSource: initials` for people cards with initials. A fixed icon must come from the pinned Font APEX catalog.
- Prefer `badgeColumn` for row-dependent status or metric text. Keep the badge label concise and omit it when the value is self-explanatory.
- For conditional styling, project only `u-normal`, `u-hot`, `u-info`, `u-success`, `u-warning`, `u-danger`, or `NULL`. Map the proven alias to `card.cssClasses`; do not accept a raw class column. For REST profiles, record the exact finite set in the mapped profile column's `comments.comments` as `authoritative-profile-enum: [...]`; absence of that evidence blocks conditional styling.
- Do not concatenate arbitrary CSS, accept CSS tokens from untrusted end-user input, invent Universal Theme classes, or use HTML badge markup when native badge mapping is sufficient.
- If compiler truth for the active build does not expose a safe property for the requested conditional style, preserve the status as text/badge content and stop before inventing a styling workaround.

## Interactivity

- Clickable cards use a native Cards action with `type: fullCard`, `layout.sequence`, `behavior.type: redirectThisApp`, and a declarative same-app target. Every source substitution used by the target must be projected by the Cards source.
- Other supported action presentations are `title`, `subtitle`, `media`, and `button`. Only `button` requires a concise `label` and `layout.position: primary | secondary`; non-button actions omit both fields.
- Button actions may use `appearance.displayType: text | icon | textWithIcon`, with `appearance.icon` required for icon presentations, plus `hot` and `cssClasses`. Any action may carry `advanced.staticId` and a compiler-backed `serverSideCondition`.
- `behavior.type: triggerAction` omits `behavior.target` and `behavior.targetUrl` and requires a nested `triggerAction` child with its supported UI action reference. Redirect actions use only their matching target shape.
- If full-card navigation and a decision button compete for the same card, document the intended precedence and evidence-backed conditions in the UX contract. Do not infer mutually exclusive business conditions from the presence of both actions.
- Dynamic refresh must name both the trigger and the Cards region static ID. Use the supported dynamic-action Refresh capability and target only that Cards region.
- When refreshed SQL depends on page items, list those items in `source.pageItemsToSubmit`. Do not rely on stale browser or session state.
- A refresh after a modal create/edit closes is required when the changed row should appear in or disappear from the Cards result set.
- Use Cards-owned `cards.refresh-on-change.md` for item-change refresh and `cards.refresh-after-dialog.md` for dialog-close refresh. Do not modify or synthesize behavior from shared Dynamic Action templates.

## Security

- Cards pages inherit the authenticated-page and session-protection baseline. Add an existing region authorization scheme when the Cards source is more restricted than the page, and authorize target pages/processes independently.
- Prefer native text mappings. Every database or REST value inserted into an advanced HTML expression must use `&COLUMN!HTML.`; never use unescaped `&COLUMN.` for untrusted text.
- Prefer declarative same-app targets. A literal external target must use HTTPS. Reject HTTP, dynamic target substitutions, `javascript:`, `data:`, protocol-relative, credential-bearing, or path-traversal URLs unless a future application-specific allowlist contract proves them.
- SQL-backed media URL columns must be statically proven by literal or `CASE` projection results. REST media URL columns must declare `authoritative-profile-url-prefixes: [...]` in the mapped profile column's `comments.comments`; use `application-static-relative` for a relative-path-only field or list exact HTTPS prefixes.
- REST-backed Cards reference a declared shared REST Data Source, HTTPS REST Data Source Server, and APEX Web Credential. Credentials stay in the shared credential, and `advanced.validForUrls` must include the exact resolved server plus source-path prefix.

Rule ID: `CARDS_SECURITY_REQUIRED_001`.

## Responsive Universal Theme Layout

- Emit `componentAppearance.layout: grid` for the standard responsive layout, `float` when cards should wrap to available width, or `horizontal` when cards should stack. Choose from explicit layout intent.
- Emit `componentAppearance.gridColumns` only with `layout: grid` and an explicit fixed count of `2`, `3`, `4`, or `5`.
- Use `componentAppearance.cssClasses` only for a proven Cards-container class. Do not use custom CSS, row spans, or invented breakpoints to force responsiveness.
- Use `appearance.template: @/cards-container` and exact build-pinned template option values.

## Interaction Boundary

- This pattern may emit a card link/action, a Cards-region refresh dynamic action, and the page items required by that refresh.
- This pattern must not emit Faceted Search, Smart Filters, search fields, facets, filter blocks, results-region orchestration, or filter-specific dynamic actions.
- If the request combines Cards with filtering/search, route to the Faceted Search or Smart Filters page pattern and treat Cards only as that pattern's results region. In an application UX contract, declare that filtering pattern as the page owner rather than leaving `visual-summary-cards` as the sole pattern.
- Routing precedence: generic Cards filtering or `cards search` -> Faceted Search; direct Smart Filter Search wording -> Smart Filter Search; never co-own both.

Rule ID: `CARDS_INTERACTION_BOUNDARY_REQUIRED_001`.

## Verification Checklist

1. The normalized intent selects `visual-summary-cards`, not Dashboard, Metric Card, or Interactive Grid by synonym alone.
2. Source mode is exactly SQL query or REST Data Source and every requested mapping has evidence.
3. Native title/subtitle/body, media, icon, badge, and action blocks are used before HTML fallbacks.
4. Conditional style values are proven to return only the six allowed Universal Theme semantic tokens or `NULL` and are mapped only through `card.cssClasses`.
5. Refresh wiring names the trigger, region static ID, and any page items to submit.
6. Automatic responsive layout is the default; fixed columns are explicit and within `2` through `5`.
7. No filtering/search components are emitted by this pattern.
8. Page, region/action, target, HTML escaping, URL, and REST credential controls match the Cards security boundary.
