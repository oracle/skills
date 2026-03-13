# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

A library of 128 standalone Oracle Database and OCR container reference guides (skill files) organized by category under `skills/`. Each file covers one topic with explanations, examples, and version-specific notes. There is no build system, test suite, or compilation step — this is a pure Markdown content library.

## Adding or Modifying Skill Files

**Always follow the 4-phase process in [SKILL_GENERATION_PROMPT.md](SKILL_GENERATION_PROMPT.md):**

1. **Research first** — fetch official Oracle docs before writing any content. Preferred sources: docs.oracle.com → Oracle GitHub → thatjeffsmith.com (SQLcl) → Oracle LiveLabs.
2. **Verify** — confirm minimum version requirements, exact flag/parameter names, and documented limitations. List every URL fetched.
3. **Write** — include only content found in the fetched docs. Add `## Oracle Version Notes (19c vs 26ai)` when version differences are relevant. Flag uncertain claims with `> ⚠️ Unverified: [what is uncertain] — check official docs before use.`
4. **Self-review** — for every code block, confirm the exact syntax appears in official docs. Remove anything invented or inferred.

End every skill file with a `## Sources` section listing the official doc URLs used.

## Skill File Structure

Each skill file must include:
- `## Overview` — intro and scope
- Main topic sections with explanations and examples
- `## Oracle Version Notes (19c vs 26ai)` — when version differences exist (19c is the baseline)
- `## Sources` — official Oracle doc links only

## Discovery & Routing Files

These files must stay in sync when skills are added or renamed:

| File | Purpose |
|------|---------|
| [SKILLS.md](SKILLS.md) | Flat index of all skills (path, category, description) |
| [AGENTS.md](AGENTS.md) | Category routing table for AI agents |
| [SKILL.md](SKILL.md) | Root metadata for skills.sh CLI discovery |
| [skills-index.md](skills-index.md) | Completion tracking checklist |

When adding a new skill file, update all four of these files.

## Category Routing

| Topic | Directory |
|-------|-----------|
| Backup, recovery, RMAN, redo/undo, users | `skills/admin/` |
| JDBC, connection pooling, JSON, XML, spatial, full-text, transactions, property graphs | `skills/appdev/` |
| RAC, CDB/PDB, Exadata, In-Memory, OCI, ATP/ADW, Data Guard | `skills/architecture/` |
| ERD, data modeling, partitioning, tablespaces | `skills/design/` |
| Liquibase, Flyway, online ops, EBR, utPLSQL, git for SQL | `skills/devops/` |
| Advanced Queuing, DBMS_SCHEDULER, materialized views, DBLinks, APEX | `skills/features/` |
| Migrating from PostgreSQL, MySQL, SQL Server, MongoDB, etc. | `skills/migrations/` |
| Alert log, ADR, adrci, space, top SQL, health checks | `skills/monitoring/` |
| ORDS, REST APIs, OAuth2, AutoREST, PL/SQL gateway | `skills/ords/` |
| AWR, ASH, explain plan, indexes, optimizer stats, wait events, memory | `skills/performance/` |
| Packages, cursors, collections, error handling, unit testing, debugging | `skills/plsql/` |
| Privileges, VPD, TDE, encryption, auditing, network security | `skills/security/` |
| SQL patterns, window functions, CTEs, dynamic SQL, injection | `skills/sql-dev/` |
| SQLcl commands, scripting, Liquibase CLI, MCP server, CI/CD | `skills/sqlcl/` |
| Oracle Container Registry images, container pull commands, tags, and OCR repository selection | `skills/containers/` |

## Key Starting Points

- [skills/sqlcl/sqlcl-mcp-server.md](skills/sqlcl/sqlcl-mcp-server.md) — connecting AI assistants to Oracle via the SQLcl MCP server
- [skills/migrations/migration-assessment.md](skills/migrations/migration-assessment.md) — start here for any migration project
- [skills/performance/explain-plan.md](skills/performance/explain-plan.md) — foundation for SQL performance work
- [skills/plsql/plsql-package-design.md](skills/plsql/plsql-package-design.md) — foundation for PL/SQL architecture
- [skills/devops/schema-migrations.md](skills/devops/schema-migrations.md) — Liquibase/Flyway with Oracle in CI/CD
- [skills/containers/container-selection-matrix.md](skills/containers/container-selection-matrix.md) — quick decision matrix for choosing the right OCR database-category image

## GitHub Ruleset

Branch protection is configured in [.github/rulesets/main.json](.github/rulesets/main.json) (linear history, 1 approval required, no force push). To apply it: `./scripts/apply-github-ruleset.sh <owner> <repo>` — requires `GITHUB_TOKEN` with repo admin permissions.

## Quality Red Flags

A skill file needs re-verification if it contains:
- Environment variable names not found in official docs
- Command flags not shown in product CLI help or docs
- Version numbers stated without a citation
- Configuration keys or JSON properties not shown in official examples
- Any claim about default behaviour not explicitly stated in the docs
