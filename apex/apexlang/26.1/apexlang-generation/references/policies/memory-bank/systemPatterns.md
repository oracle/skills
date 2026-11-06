# System Patterns and Architecture

## Purpose
- Provide a reference-only architecture summary for how this repository organizes agentic APEXlang workflows.
- Describe relationships between canon, routing assets, skills, templates, and logs without redefining startup or enforcement rules.

## Canonical Sources
- Startup and task routing:
  - `SKILL.md`
- Hard-stop behavioral guardrails and enforcement IDs:
  - `references/policies/memory-bank/00-guard/ai.guard.md`
- Load order, path canonicalization, and template/schema precedence:
  - `references/policies/governance/00-governance.md`
- Minimal rule selection:
  - `assets/rules-mapping.json`

## Repository Layers
- `references/policies/governance/`
  - Repo-level policy anchor for precedence, path rules, and template/schema authority.
- `references/policies/memory-bank/`
  - Partitioned rule corpus:
    - `00-guard/`
    - `10-global/`
    - `20-data/`
    - `30-pages/`
    - `40-components/`
- `skills/`
  - Direct-entrypoint skills, domain skills, agents, references, and assets.
- `templates/`
  - Canonical exact-match example families and renderer reference docs. Templates are not the primary syntax oracle.
- APEXlang grammar asset
  - Syntax oracle for generated DSL shape.
- Compiler prop-map tools
  - Compiler-backed semantic oracle for property, enum, slot, template-option, and component-variant legality.
- APEXlang structured contracts
  - Compact pattern, IR, and package-layer contracts used before broad Markdown loading.
- `applications/app_###/`
  - Final output root for generated application artifacts.
- `artifacts/`
  - Optional output root for compact runtime reports, transcripts, validation outputs, workflow-specific audit artifacts, and export backups. It is created only when a workflow writes outputs.

## Execution Model
- APEX artifact runs:
  - enter through a direct-entrypoint skill documented in `SKILL.md`
  - resolve prerequisite metadata source through `assets/workspace-intelligence.json` plus `references/ops/sqlcl-agents/00-connection-gate.md`
  - load only the minimal rule set required for the request
  - run one internal generate -> review -> fix loop, then runtime gates when applicable

## Deterministic Routing
- Natural-language routing relies on:
  - `assets/rules.catalog.json`
  - `assets/apex-generation/components.registry.json`
  - `assets/rules-mapping.json`
- Non-trivial routing should produce a compact trace from normalized intent to rule/contract, grammar/compiler evidence, and exact template path only when needed.
- Direct-entrypoint skills that support one-message invocation should expose a `Router Contract` section in `SKILL.md`.
- Secondary reference docs must not redefine router behavior; they should point back to the owning skill.

## Template Contract Model
- Family-level surfaces:
  - `README.md`
  - `<family>._index.md`
  - `<family>._common.md`
- Helper partials such as `_axis._common.md`, `_columns._common.md`, and `_saved-report._common.md` are subcontracts, not family entrypoints.
- Scenario files should assume the family `_index.md` and `_common.md` establish the selection and shared contract context first.
- Template-option inventories and shared contracts must agree on emitted values. The accepted value can be a caller-facing token such as a documented `static_id`, a standalone sentinel like `#DEFAULT#`, or a full documented composite string. Concatenated hybrids such as `#DEFAULT#t-Report--stretch` are contract defects, not alternate spellings.

## Logging Model
- Canonical log root:
  - `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` when logs are written
- Common artifacts:
  - `runtime-run.json`
  - `runtime-run.log`
- Documentation retirements and other non-log durable artifacts may be recorded under `the temp-runtime reports directory under `APEXLANG_OUTPUT_ROOT/reports/`` when a workflow explicitly persists that evidence.

## Maintenance Rules For This File
- Keep this file descriptive, not normative.
- Do not restate startup sequences, gate ownership, or enforcement settings that already belong to `SKILL.md`, `ai.guard.md`, or `00-governance.md`.
- Historical path removals should live in dedicated legacy or revision-history sections elsewhere, not in this architecture summary.
