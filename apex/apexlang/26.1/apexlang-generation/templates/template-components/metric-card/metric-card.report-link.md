---
templateId: metric-card.report-link
componentType: templateComponent
imports:
  - metric-card.common
  - metric-card.report-minimal
version: 1.0
description: Report-mode Metric Card with a declarative row link.
---

# Purpose

Add compiler-backed row navigation to each Metric Card.

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
    action open-details (
        position: link
        layout {
            sequence: 10
        }
        behavior {
            type: redirectThisApp
            target: {
                page: {{target.pageId}}
                items: {
                    {{target.itemName}}: &{{target.sourceKeyColumn}}.
                }
            }
        }
        security {
            authorizationScheme: {{action.authorizationScheme}}
        }
    )
)
```

# Conditional Rendering Rules

- Use only `position: link`.
- Omit `template` and `label`; Metric Card exposes no action templates and the link position does not request a label.
- Include the source key in the query and child columns. Mark it as `source.primaryKey: true` when stable row identity is required.
- Omit action security when page authentication is sufficient. Otherwise reference an existing authorization scheme.
- Use a declarative target for same-app navigation. Do not build `f?p=` strings or inline JavaScript URLs.
- Use `redirectOtherApp` with a declarative `target` for a different APEX application.
- Use `redirectUrl` only with a reviewed safe `targetUrl`; omit `target`. Reject dangerous schemes, protocol-relative URLs, control characters, wholly dynamic destinations, and substitutions outside query parameters. Keep the scheme, host, path, and fragment static.
- Optional `linkAttributes` must be static and must not contain inline event handlers, URL-bearing attributes, scriptable CSS, or unsafe URL schemes. A new-window target also requires `rel="noopener"` or `rel="noreferrer"`.
- Use `triggerAction` only when a matching event consumer/dynamic action exists; omit both `target` and `targetUrl`.

# Validation Checklist

- Target page and item mappings are explicit.
- Every `&COLUMN.` action mapping is projected by the source.
- Action has deterministic layout sequence and declarative behavior.
- Any `targetUrl` is reviewed and safe, with substitutions limited to query parameters; any `linkAttributes` are static and contain no inline handlers or URL override.
- Authorization alias, when present, already exists in the target application.
