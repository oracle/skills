# Workflow Manifest: apex-generation-agent-suite

## Agent 1 — Draft (`apex-generation-agent-draft`)
- **Source:** `references/workflows/apex-generation/agents/20-agent-draft.md`
- **Purpose:** Generate initial APEXlang artifact using templates and rule corpus.
- **Inputs:** `target_type`, `intent`, `data_contract`, `styling`, `output_path`
- **Outputs:** `Compiler Truth Evidence` when required, `Generation Plan` for non-trivial structural work, then transient temp app updates outside the repo
- **Policies:** invokeApi-first, named notation, minimal rule loading, reuse templates only.

## Agent 2 — Critique (`apex-generation-agent-critique`)
- **Source:** `references/workflows/apex-generation/agents/30-agent-critique.md`
- **Purpose:** Validate draft, enforce governance gates, record findings with citations.
- **Inputs:** Draft path, `target_type`, `data_contract`, `styling`, `output_path`, `app_root`
- **Outputs:** internal review findings plus confidence score; must enforce compiler-truth, Generation Plan, and stop-condition contracts before durable evidence is recorded
- **Policies:** Confidence ≥ 0.95, missing inputs handling, critical page checks.

## Agent 3 — Revision (`apex-generation-agent-revision`)
- **Source:** `references/workflows/apex-generation/agents/40-agent-revision.md`
- **Purpose:** Apply critique findings, ensure governance compliance, produce final artifact.
- **Inputs:** Critique log, draft, structured inputs, target paths.
- **Outputs:** Final artifact (`pages/`, `shared-components/`, etc.) plus compact runtime/report output when the workflow persists durable evidence; preserve or explicitly repair the frozen Generation Plan and compiler-truth evidence
- **Policies:** No scope expansion, deterministic edits, respect invocation loops.

## Post-Agent 4 — Direct SQLcl Validate Gate (`apex-generation-agent-direct-sqlcl-validate-gate`)
- **Source:** `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`
- **Purpose:** Enforce completion checks using the local first-pass check plus direct SQLcl runtime semantics for check-only or import-approved runs.
- **Inputs:** `resolved_app_path`, `db_connection_name`
- **Outputs:** recorded direct SQLcl runtime outcome in run notes or change log
- **Policies:** Hard-block on gate failures; feed failures back into critique/revision retry loop with up to 2 additional live retries after the first failure (3 total live rounds).

## Pre-Agent 0 — Connection Gate (`apex-generation-agent-connection`)
- **Source:** `references/ops/sqlcl-agents/00-connection-gate.md`
- **Purpose:** Resolve database connection requirements before draft execution.
- **Inputs:** `db_connection_name`, execution mode
- **Outputs:** ``APEXLANG_OUTPUT_ROOT/logs/runtime-preflight.json``, gating signal.
- **Policies:** Do not fabricate connections; stop and request `db_connection_name` when live prerequisites are missing.

## Codex Integration Notes
- Skill manifest should map agent IDs to these workflow files for modular execution.
- Ensure agents can be invoked individually if Codex requires custom sequencing (e.g., planner-only runs).
