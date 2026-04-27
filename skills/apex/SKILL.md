# Oracle APEX Skills

This file is a sample skeleton for how a domain-level `SKILL.md` can be structured for Oracle APEX content.

Use it as a pattern for future APEX domain navigation, not as a todo list or commitment to a final taxonomy.

## How to Use This Domain

1. Start with the routing table below.
2. Read only the specific file or category you need.
3. Use the sections below as a template for organizing APEX skills as the domain evolves.

## Directory Structure

```text
skills/apex/
├── app-dev/        Example: pages, items, processes, dynamic actions
├── data/           Example: SQL, REST data sources, forms, reports
├── security/       Example: authn, authz, session protection
├── ui/             Example: themes, templates, Redwood, accessibility
├── integration/    Example: REST, webhooks, external services
├── deployment/     Example: export, install, CI/CD, environment promotion
└── admin/          Example: workspaces, instance settings, operations
```

## Category Routing

| Topic | Directory |
|-------|-----------|
| Pages, regions, items, processes, dynamic actions | `skills/apex/app-dev/` |
| SQL queries, forms, reports, REST data sources | `skills/apex/data/` |
| Authentication, authorization, session security | `skills/apex/security/` |
| Themes, templates, Redwood UI, accessibility | `skills/apex/ui/` |
| REST APIs, external services, integration patterns | `skills/apex/integration/` |
| Application export, deployment, promotion, CI/CD | `skills/apex/deployment/` |
| Workspace administration, instance operations, governance | `skills/apex/admin/` |

## Key Starting Points

- Sample section only
- Use this area to link a few high-value entry points once the domain has real content
- Keep APEX guidance focused on practical build and runtime workflows

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Sample feature delivery flow | `app-dev` → `data` → `ui` |
| Build a new APEX application feature | `app-dev` → `data` → `ui` |
| Secure an APEX application | `security` → `app-dev` → `admin` |
| Promote an app across environments | `deployment` → `security` → `admin` |
