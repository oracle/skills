# Oracle Fusion Skills

This file is a sample skeleton for how a domain-level `SKILL.md` can be structured for Oracle Fusion content.

Use it as a pattern for future Fusion domain navigation, not as a todo list or commitment to a final taxonomy.

## How to Use This Domain

1. Start with the routing table below.
2. Read only the specific file or category you need.
3. Use the sections below as a template for organizing Fusion skills as the domain evolves.

## Directory Structure

```text
skills/fusion/
├── common/         Example: platform concepts, environments, navigation
├── erp/            Example: financials, procurement, project operations
├── hcm/            Example: core HR, payroll, talent, recruiting
├── scm/            Example: supply chain, manufacturing, inventory
├── cx/             Example: sales, service, marketing workflows
├── platform/       Example: visual builder, app composer, extensions
├── integration/    Example: OIC, REST, SOAP, events, data sync
├── reporting/      Example: OTBI, BI Publisher, analytics
└── security/       Example: roles, data security, environment controls
```

## Category Routing

| Topic | Directory |
|-------|-----------|
| Shared Fusion concepts, environment setup, navigation | `skills/fusion/common/` |
| ERP configuration and workflows | `skills/fusion/erp/` |
| HCM configuration and workflows | `skills/fusion/hcm/` |
| SCM configuration and workflows | `skills/fusion/scm/` |
| CX configuration and workflows | `skills/fusion/cx/` |
| Visual Builder, App Composer, Redwood extensions | `skills/fusion/platform/` |
| Integration patterns, APIs, events, and data movement | `skills/fusion/integration/` |
| OTBI, BI Publisher, dashboards, analytics | `skills/fusion/reporting/` |
| Roles, privileges, data access, environment governance | `skills/fusion/security/` |

## Key Starting Points

- Sample section only
- Use this area to link a few high-value entry points once the domain has real content
- Keep product-family guidance separated unless the workflow is truly shared

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Sample extension flow | `common` → `platform` → `security` |
| Extend a Fusion workflow | `common` → `platform` → `security` |
| Integrate Fusion with external systems | `common` → `integration` → `reporting` |
| Roll out a business configuration safely | `common` → product family (`erp`/`hcm`/`scm`/`cx`) → `security` |
