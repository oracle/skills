# Oracle Skills

Oracle Skills is the repository for Oracle-wide skills, organized by domain under `skills/`.

The goal is to provide a single source of truth for practical Oracle skills across products and platforms. Each domain can own its own routing, indexing, and topic structure while still fitting a consistent repository model.

The current deepest content lives in `skills/db/`, with `skills/oci/`, `skills/fusion/`, `skills/apex/`, and `skills/graal/` in place as domain roots for expansion.

## Repository Goals

- Provide Oracle-wide skills in one repository.
- Organize content by domain instead of mixing unrelated Oracle topics together.
- Keep each skill practical, source-backed, and easy to consume on demand.
- Allow each domain to evolve its own taxonomy without breaking repo-wide consistency.

## Repository Layout

```text
skills/
├── db/
│   ├── SKILL.md
│   ├── admin/
│   ├── agent/
│   ├── appdev/
│   ├── architecture/
│   ├── containers/
│   ├── design/
│   ├── devops/
│   ├── features/
│   ├── frameworks/
│   ├── migrations/
│   ├── monitoring/
│   ├── ords/
│   ├── performance/
│   ├── plsql/
│   ├── security/
│   ├── sql-dev/
│   └── sqlcl/
├── fusion/
│   └── SKILL.md
├── apex/
│   └── SKILL.md
├── graal/
│   └── SKILL.md
└── oci/
    └── SKILL.md
```

## Start Here

- `skills/db/SKILL.md` — database domain routing and key entry points
- `SKILL_AUTHORING_GUIDE.md` — best practices for creating or updating skills in this repo

## Domain Model

- `skills/db/` is the active Oracle Database domain and includes database, ORDS, SQLcl, framework, container, and agent workflow skills.
- `skills/oci/` is the root for future Oracle Cloud Infrastructure skills.
- `skills/fusion/` is the root for future Oracle Fusion skills.
- `skills/apex/` is the root for future Oracle APEX skills.
- `skills/graal/` is the root for future Graal and GraalVM-related Oracle skills.

Each domain should own its own `SKILL.md` and any additional indexing files it needs.

## Version Coverage Standard

- Skills that include version-specific behavior must include a section named `## Oracle Version Notes (19c vs 26ai)`.
- Use Oracle Database 19c as the baseline compatibility target unless stated otherwise.
- Explicitly call out features that require newer releases and provide 19c-compatible alternatives where practical.

## GitHub Ruleset

- Default-branch ruleset definition is stored in `.github/rulesets/main.json`.
- Apply it with:
  - `export GITHUB_TOKEN=<token-with-repo-admin-permission>`
  - `./scripts/apply-github-ruleset.sh krisrice oracle-db-skills`
