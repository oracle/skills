---
templateId: metric-card.report-avatar-badge
componentType: templateComponent
imports:
  - metric-card.common
  - metric-card.report-minimal
version: 1.0
description: Report-mode Metric Card with compiler-backed nested Avatar and Badge attributes.
---

# Purpose

Add an Avatar, a Badge, or both to source-backed Metric Card rows without substituting the standalone Avatar or Badge region contracts.

# Output Template

```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/metricCard
    componentAppearance {
        display: report
    }
    settings {
        title: &{{settings.titleColumn}}.
        metric: &{{settings.metricColumn}}.
    }
    plugin-avatar {
        displayAvatar: true
        type: initials
        initials: {{avatar.initialsColumn}}
        position: inline
        alignment: center
        shape: rounded
        size: medium
        style: subtle
    }
    plugin-badge {
        displayBadge: true
        label: {{badge.label}}
        value: {{badge.valueColumn}}
        state: {{badge.stateColumn}}
        icon: {{badge.icon}}
        displayLabel: true
        style: subtle
        shape: rounded
        size: medium
    }
    column {{avatar.initialsColumn}} (
        layout {
            sequence: {{avatar.initialsColumnSequence}}
        }
        source {
            databaseColumn: {{avatar.initialsColumn}}
            dataType: varchar2
        }
    )
    column {{badge.valueColumn}} (
        layout {
            sequence: {{badge.valueColumnSequence}}
        }
        source {
            databaseColumn: {{badge.valueColumn}}
            dataType: {{badge.valueColumnDataType}}
        }
    )
    column {{badge.stateColumn}} (
        layout {
            sequence: {{badge.stateColumnSequence}}
        }
        source {
            databaseColumn: {{badge.stateColumn}}
            dataType: varchar2
        }
    )
)
```

# Conditional Rendering Rules

- Emit `plugin-avatar` only when avatar content is requested. Set `displayAvatar: true`, select exactly one `type`, and emit only its matching payload: `icon`, `initials`, or `image`.
- `plugin-avatar.initials` is a bare projected `varchar2` alias. It is not an `&COLUMN.` rendered-text substitution.
- Avatar image payloads use the compiler-backed media object. BLOB mode maps a `blob` payload, `varchar2` filename and MIME type columns, and a date/timestamp last-updated column. URL modes use application-managed file paths only.
- Use `alignment` only for `position: inline`. Omit it for `position: top`.
- Use `style: subtle` only for icon or initials avatars. Omit Avatar style for image avatars.
- Emit `plugin-badge` only when badge content is requested. Set `displayBadge: true` and always emit both `label` and `value`.
- A source-backed badge label, badge value, and badge state use bare projected aliases. Source-backed labels are `varchar2`; static labels contain no HTML or event attributes. Omit `state` and its child column when no semantic state is requested.
- Badge state data is `varchar2` and is restricted to lowercase `danger`, `warning`, `success`, or `info` by the source contract introduced for Badge support.
- Avatar and Badge icons use the build-pinned Font APEX catalogue and the shared icon validation introduced by their standalone component implementations. Metric Card Avatar icons may use a proven `&COLUMN.` substitution; Badge icons remain static.
- Omit optional visual properties instead of emitting empty values. Use only the exact Metric Card values documented in `metric-card._template_options.md`.
- Add one explicit child column for every additional source projection, including image payload and link-context columns.

# Validation Checklist

- Avatar visibility, type, payload, position, alignment, shape, size, and style satisfy the Metric Card compiler profile.
- Initials, Badge value, and optional Badge state resolve to explicitly declared child columns with compatible data types.
- Badge label and value are present; optional state values use the Badge allowlist.
- Source-backed selector attributes use bare aliases rather than `&COLUMN.` substitutions.
- No standalone Avatar/Badge settings or duplicated template-option inventories are mixed into the Metric Card groups.
