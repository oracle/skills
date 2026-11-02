---
templateId: region.media-list.report-grouped
componentType: region
version: 3.0
imports:
  - media-list._common.md
description: Capability-gated native Media List report grouping.
---

# Purpose

Generate native Media List report grouping only when the selected curated component policy exposes a validated report-group structure.

# Capability Gate

- Confirm `plugin-grouping` is an allowed Media List block from `curated-component-policy` in `component-contracts/<build>.json`.
- Resolve the exact required/optional grouping property names from that policy; do not assume `groupTitle`, `title`, `groupIcon`, or `icon` across policy revisions.
- Confirm the selected title property accepts the required dynamic/plain-text mapping and live validation recognizes the emitted block.
- If any condition is unresolved, stop with an unsupported-capability result for the selected target. Do not synthesize grouping with HTML or CSS.

# Output Template

```apexlang
{{policyApprovedGroupingBlock}}
```

# Conditional Rendering Rules

- Use grouping only in report mode after the capability gate passes.
- Dynamic title mappings must reference a projected `varchar2` alias using the exact substitution/property contract selected for the target.
- Put the group-title alias first in deterministic static ordering so equal groups remain contiguous.
- An optional group icon must use the policy's accepted icon property and one static allowlisted Font APEX icon.
- Universal Theme supplies semantic group headings; do not place HTML in SQL or grouping values.

# Validation Checklist

- The curated component policy proves the grouping block and every emitted property.
- Group rows remain contiguous because ordering starts with the grouping alias.
- Group title data is safe plain text and the optional icon is static and allowlisted.
- A target without grouping support produces `MEDIA_LIST_CAPABILITY_UNSUPPORTED_001` rather than compiler-invalid APEXlang.
