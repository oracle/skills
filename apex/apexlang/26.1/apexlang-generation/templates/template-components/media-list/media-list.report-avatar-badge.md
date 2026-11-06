---
templateId: region.media-list.report-avatar-badge
componentType: region
version: 1.0
imports:
  - media-list._common.md
description: Media List report with optional Avatar and Badge composition.
---

# Purpose

Add native Avatar and/or Badge content without changing the base report source, ordering, appearance, or compiler-resolved column contract.

# Output Template

```apexlang
settings {
    title: {{titleColumn}}
    {{descriptionProperty}}
    {{displayAvatarProperty}}
    {{displayBadgeProperty}}
}

{{#if displayAvatar}}
plugin-avatar {
    type: {{avatar.type}}
    {{avatarPayload}}
    {{avatarDescriptionProperty}}
    shape: {{avatar.shape}}
    {{avatarSizeProperty}}
}
{{/if}}

{{#if displayBadge}}
plugin-badge {
    label: {{badge.label}}
    value: {{badge.valueColumn}}
    {{badgeStateProperty}}
    {{badgeIconProperty}}
    {{badgeDisplayLabelProperty}}
    {{badgeStyleProperty}}
    {{badgeShapeProperty}}
    {{badgeSizeProperty}}
}
{{/if}}
```

# Avatar Variants

- Initials: `type: initials` plus bare projected `initials: {{avatarInitialsColumn}}`.
- Icon: `type: icon` plus one static allowlisted `icon: {{fontApexIcon}}`.
- Image: `type: image` plus `image: { type: urlColumn urlColumn: {{avatarUrlColumn}} }`, where the projected URL is built only from `:APP_FILES` or `:APEX_FILES` and a static relative path.
- Emit exactly one payload. Meaningful Avatars require a human-readable description; dynamic descriptions use `&{{avatarDescriptionColumn}}.` plus evidence in region comments. Decorative Avatars omit the description and use `AVATAR_PURPOSE_DECORATIVE`.

# Badge Variants

- Keep `label` concise, static, plain text, and meaningful because its metadata is raw-rendered.
- Map `value` with a bare projected alias. Supported value datatypes are `varchar2`, `number`, `date`, `intervalYearToMonth`, and `intervalDayToSecond`.
- Omit state by default. When explicitly requested, map a `varchar2` alias proven to return only `danger`, `warning`, `success`, or `info`.
- Use `displayLabel: true` when the surrounding title/description does not already explain the Badge value. Color must never be the only state cue.
- Icons are static Font APEX values; dynamic icon class strings are not supported.

# Conditional Rendering Rules

- `settings.displayAvatar: true` and `plugin-avatar` are emitted together or both omitted.
- `settings.displayBadge: true` and `plugin-badge` are emitted together or both omitted.
- Add one compiler-resolved Media List column for every Avatar/Badge mapping. Auxiliary Avatar URL/description and Badge state fields remain source mappings consumed only by their plugin properties.
- Emit `plugin-avatar.size` or `plugin-badge.size` only when the selected curated Media List policy exposes that nested property and accepts the selected value; otherwise omit it.
- Load and apply the shared Avatar and Badge owner contracts; do not copy their named child-column shape.

# Validation Checklist

- Toggle and plugin blocks are consistent.
- Avatar type/payload, description, URL, and icon values satisfy the shared Avatar rules.
- Badge label, value datatype, optional state, icon, and display semantics satisfy the shared Badge rules.
- Every nested mapping resolves to a projected Media List column in the active compiler-selected shape.
