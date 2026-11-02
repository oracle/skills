---
templateId: region.static-content.common
componentType: region
version: 1.1
description: Shared contract for static content regions and navigation fallback output.
---

# Purpose

Standardize the variable contract, guardrails, and template skeleton for static content region scenarios. Also covers the generic `staticContent` region used as the generator fallback for Navigation or otherwise unhandled region families.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/30-pages/apex.page.md` and other relevant section rules before emitting static content regions.
2. Default content-bearing static content regions to `appearance.template: @/standard` and keep `templateOptions` limited to the documented `static_id` values in `static-content._template_options.md`.
3. Add server-side conditions only when necessary; remove unused permutations.
4. When the source family is `Navigation`, call out that the current generator maps it here as a fallback.
5. Keep the shell intentionally minimal for fallback usage; family-specific content belongs in the owning specialized guide when one exists.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Identifier used after the `region` keyword. |
| name | yes | string | Builder display name. |
| type | yes | enum | Always `staticContent`. |
| layout.sequence | yes | number | Region order within the page slot. |
| layout.slot | yes | enum | Slot the region occupies (e.g., `BODY`). |
| layout.parentRegion | conditional | string | Parent region static ID for nested regions. |
| appearance.template | yes | string | Region template reference; default to `@/standard` for normal content regions. |
| appearance.templateOptions | optional | array | Additional modifiers (`#DEFAULT#` default). Keep `#DEFAULT#` standalone, keep documented composites atomic, and use only the accepted values documented in `static-content._template_options.md`. |
| source.htmlCode | conditional | html | Inline content for static regions. Use a `source { htmlCode: ... }` block; do not emit `content { html: ... }`. Use either direct inline HTML on the same line or a fenced ` ```html ` block, not SQL-style `q'...'` quoting. |
| source.sqlQuery | conditional | sql | SQL-driven content where supported. |
| headerAndFooter.* | optional | string | Header/footer text. |
| serverSideCondition.* | optional | condition | Visibility gating. |
| security.authorizationScheme | optional | string | Authorization scheme alias. |

---

# Conditional Rendering Rules

- Remove optional blocks (`source`, `headerAndFooter`, `serverSideCondition`) when not required.
- Include only template options documented for the selected template in `static-content._template_options.md`.
- Use server-side conditions for feature flags or authorization gating.
- For nested layouts, ensure `parentRegion` references existing static content regions.
- When inline markup is required, emit it only as `source.htmlCode`; do not invent a `content` block or an `html` property.
- For multiline `source.htmlCode`, prefer a fenced ` ```html ` block. Do not use SQL-style `q'...'` quoting.

---

# Guardrails

- Keep HTML limited to safe, declarative content; prefer declarative components over raw markup.
- Validate SQL queries for content-driven static regions when applicable.
- Use nested static content regions only when layout requires multiple levels (`parentRegion`).
- Document raw HTML content only when the owning design intentionally uses static markup.
- When this file represents `Navigation`, note that the current generator falls back here instead of emitting a dedicated navigation template.
- Metadata export lookup: search for `staticContent`, `Navigation`, and the fallback region family in the generator.
