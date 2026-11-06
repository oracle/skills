> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# references/policies

## Purpose

`references/policies/` is the repository's shared knowledge and policy area. It contains the rules, templates, reference material, and machine-readable manifests that workflow skills use to decide what to load and how to behave.

If you are navigating the repo manually, this is the best starting point for understanding the repository's guardrails and canonical template inventory.

## What is in this directory

- `governance/`
  - Repo-level governance and precedence documents.
  - Start here when you need the canonical policy layer behind a workflow.
- `references/policies/memory-bank/`
  - The rule partitions used by routing and generation: guardrails, global rules, data rules, page rules, component rules, and styling rules.
  - Also contains machine-readable contracts such as `assets/rules-mapping.json`, `assets/component-policies.json`, and `assets/component-attributes.json`.
- `db/`
  - Offline schema-dictionary markdown files used to avoid unnecessary DB connections during DB-backed planning and generation.
  - `assets/workspace-intelligence.json` is the machine-readable registry the router must inspect before asking for a DB connection.
- `apexlang/`
  - APEXlang reference material and canonical templates.
  - The main subareas are `templates/` and `references/policies/apexlang-dsl-reference.md`.
- `assets/routing-assets-index.json`
  - Routing asset index. Points to routing-related assets; it is not the domain router itself.
- `assets/routing-catalog-main.json`
  - Domain routing catalog. Maps broad user intent to workflow domains before opening full workflow docs.
- `assets/routing-load-policy.json`
  - Routing load policy. Defines document open order and context caps per routing intent.
- `templates/template-family-registry.json`
  - Template family registry. Catalogs APEXlang template families and should not be confused with routing catalogs.

## How to use this directory

- Read `governance/00-governance.md` when you need the canonical governance anchor.
- Read `references/policies/memory-bank/` when you need rule files that shape generation behavior.
- Read `templates/` when you need the canonical template families that workflows should reference.
- Read `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` when it exists and you need compact runtime, validator, import, or audit-log outputs. Do not require `artifacts/` before generation starts.
- Read `the temp-runtime reports directory under `APEXLANG_OUTPUT_ROOT/reports/`` when it exists and you need critiques, change logs, summaries, SQL captures, or other non-log durable artifacts.
- Read `references/policies/compiler-prop-map.md` when you need the compiler-derived APEXlang property query helper for exact syntax validity checks.
- Use `assets/routing-assets-index.json` when onboarding or tooling needs to discover the routing assets.
- Use `assets/routing-catalog-main.json` and `assets/routing-load-policy.json` first for compact routing decisions.
- Use `templates/template-family-registry.json` only for template family discovery after routing has selected APEXlang/template work.

## Important machine-readable assets

- `assets/rules-mapping.json`
  - Keyword-driven selector for minimal rule loading.
- `assets/component-policies.json`
  - Deterministic policy contract used by validation and critique checks.
- `assets/component-attributes.json`
  - Canonical component attribute allowlist/schema.
- `assets/workspace-intelligence.json`
  - Compact registry describing eligible offline schema dictionaries under `workspace schema dictionaries discovered by `node tools/apexctl.mjs workspace probe``.
- `assets/routing-assets-index.json`
  - Routing asset index for routing-aware tooling.
- `assets/routing-catalog-main.json`
  - Domain routing catalog for broad workflow selection.
- `assets/routing-load-policy.json`
  - Routing load policy for load order and document caps.
- `templates/template-family-registry.json`
  - Template family registry for APEXlang template discovery.

## Related ownership notes

- Policy anchor: `references/policies/governance/00-governance.md`
- Router contracts: domain `skills/*/SKILL.md` files
- Router conventions: `references/ops/one-message-router-contract.md`
- Workflow index and orchestration manifest:
  - `references/workflows/apexlang/apexlang-execution-model.md`
  - `assets/orchestration.manifest.json`

## Maintenance

- Keep this README aligned with the actual directory layout.
- Keep this file human-facing; do not turn it into a second copy of governance or router contracts.
- If a new top-level folder or machine-readable contract is added under `references/policies/`, document it here.
