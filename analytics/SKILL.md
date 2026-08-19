---
name: analytics
description: Use this Oracle Analytics domain skill when creating or editing Oracle Analytics Cloud workbooks, visualizations, calculations, filters, layouts, governed analyses, or when routing an analytics request to a more specific nested skill.
---

# Oracle Analytics Skills

Use this domain for practical, source-backed Oracle Analytics workflows.

## How to Use This Domain

1. Identify the smallest nested skill that owns the requested workflow.
2. Read that skill before generating or changing analytics content.
3. Prefer governed Oracle Analytics metadata and documented product behavior over invented datasource details.

## Directory Structure

```text
analytics/
├── SKILL.md
└── workbook-authoring/
    └── SKILL.md
```

## Category Routing

| Request | Skill |
| --- | --- |
| Create, regenerate, validate, save, or make supported edits to an Oracle Analytics workbook | [workbook-authoring/SKILL.md](workbook-authoring/SKILL.md) |

## Key Starting Points

- Start with [workbook-authoring/SKILL.md](workbook-authoring/SKILL.md) for workbook and visualization authoring.
- Configure Oracle Analytics MCP access when governed datasource discovery or catalog save is required.

## Common Multi-Step Flows

1. Discover the governed datasource and fields.
2. Capture analysis requirements and workbook layout intent.
3. Generate and validate workbook JSON.
4. Save through Oracle Analytics MCP when available, or return the validated local artifact.

## Sources

- <https://docs.oracle.com/en/cloud/paas/analytics-cloud/index.html>
- <https://docs.oracle.com/en/cloud/paas/analytics-cloud/acsdv/access-oracle-analytics-cloud-mcp-server-preview.html>
