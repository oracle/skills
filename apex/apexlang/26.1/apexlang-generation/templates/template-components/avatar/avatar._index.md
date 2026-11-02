---
templateId: region.avatar.index
componentType: region
version: 1.0
imports:
  - avatar._common.md
description: Routing entrypoint for standalone Avatar report regions.
---

# Purpose

Select the narrowest standalone Avatar report scenario.

# Load Order

1. Load `avatar._common.md`.
2. Load exactly one scenario file matching the requested Avatar type.
3. Load `avatar._template_options.md` only when validating settings or enum values.

# Scenario Routing

- Initials: `avatar.report-initials.md`
- Font APEX icon: `avatar.report-icon.md`
- Image from a projected URL column: `avatar.report-image-url-column.md`

# Unsupported Routing

Do not route BLOB images, report grouping, link actions, or partial mode to this pack until their standalone Avatar contracts have dedicated evidence.

# Action Template Decision

The Avatar export contains no action templates, so `Apply Action Templates` is not applicable to the current report scenarios. Do not confuse the separate `link` action position with an action template.

# Authorization Routing

When the owning application or page restricts Avatar visibility, require the exact existing shared authorization scheme and emit it through the common contract. Stop with Missing Inputs rather than guessing a scheme name.

# Security and Accessibility Routing

- Route image URLs through the application-managed URL contract in `avatar.report-image-url-column.md`.
- Route icons through the build-pinned Font APEX allowlist contract in `avatar.report-icon.md`.
- Apply the common meaningful-description/decorative marker and safe `cssClasses` contracts to every scenario.
