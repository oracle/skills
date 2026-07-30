> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# APEXlang Execution Model

Purpose
- Provide a deterministic index for workflow orchestration with minimal context loading.
- Keep masters and component workflows in `skills/` and keep `workflows/` focused on orchestration manifests + temporary compatibility shims.

Primary masters
- `SKILL.md` (APEXlang app-development routing)
- `external:oracle-db/plsql` (local PL/SQL integration adapter; generic PL/SQL and utPLSQL authority stays with Oracle upstream DB skills)
- `external:oracle-db/schema-modeling` (schema modeling)

Router shortcut mapping (canonical ownership)
- APEX generation -> `SKILL.md`
- local PL/SQL maintenance + testing orchestration -> `external:oracle-db/plsql`
- Schema modeling -> `external:oracle-db/schema-modeling`
- Machine-readable source of truth: `assets/orchestration.manifest.json`

Tier 1 references
- `references/domains/business-logic/computations/workflow-computations-batch.md`
- `references/domains/template-components/workflow-items-templates.md`
- Additional component workflows are referenced under `skills/*/references/workflow-*.md`.

Execution model
1. Router receives one-message prompt, including fragmentary or free-form user input.
2. `SKILL.md` normalizes intent directly according to `references/policies/governance/prompt-normalization.md` and asks only one simple-English clarification round for critical blockers.
3. `SKILL.md` routes to the appropriate app-development subskill.
4. For full generation, use the frozen application spec and UX contract to select each implementation unit. The resolver queries the component registry; the model receives only selected component routes, not the full registry.
5. Resolve a fresh task-specific `context resolve` capsule for each implementation unit; do not retain prior unit capsules.
6. Run generate -> unit-local review -> deterministic repair for that unit. Do not retain prior unit capsules or re-run whole-app validation after every page.
7. After all units are assembled, run one full local integration validation and compiler-truth audit against the temporary working copy before any SQLcl roundtrip.
8. Only after the local first-pass check runs may the workflow perform the live APEXlang check through the selected live runtime path under `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`.
9. If a sandboxed build-root runtime attempt fails before real `apex validate` / `apex import` output because of filesystem/setup errors such as `EPERM`, `ENOENT`, or build-root `workdir/*` write failures, treat that as an environment blocker, not a DSL defect, and escalate immediately to the real live build-root roundtrip.
10. If the runtime/import path fails, each real live retry must feed findings back into the identified unit critique/revision, rerun local integration validation, and then rerun the real SQLcl roundtrip; do not use blind unchanged retries.
11. A run may attempt the live APEXlang check at most 3 times. After the third failed live check attempt, stop and surface the owning layer plus remaining blocker.
12. Default every APEX artifact workflow to check-only before live SQLcl execution; in user-facing responses, label that choice as `Check APEXlang code`. After the live APEXlang check passes, offer GUI/clickable choices labeled `Check APEXlang code` or `Check and import APEXlang code`.
13. If GUI choices are unavailable, stop after checking the code and report import as a follow-up.
14. Completion and publish remain blocked unless the same temporary working-copy path passes the live APEXlang check through SQLcl `apex validate`; import runs only when the post-check GUI choice resolves to `Check and import APEXlang code`.
15. Shared-app `validate-and-import` is CI-owned by default. Local runs should be `validate-only` unless the user explicitly confirms manual override in a second GUI step.
16. For existing-app `validate-and-import` runs, the workflow must resolve and preserve one canonical live numeric application id before import, then keep that id as session authority for the rest of the import-authorized run.
17. For live runs with satisfied prerequisites, the live APEXlang check proceeds after the local first-pass check; import runs only when the post-check GUI choice selected import and the canonical target-id guard still passes.
18. The default live command shape is: run `node tools/apexctl.mjs runtime preflight --db-connection-name <db_connection_name>`, prefer the resolved build-root runtime via `apex sql`, and fall back to `sql <db_connection_name>` or `sql /nolog` plus `connect <db_connection_name>` before `apex validate -input`; run `apex import -input` in that same session only when the post-check GUI choice resolves to import and the preserved canonical application id remains authoritative. Do not add `-workspaceid` unless the active runtime session explicitly reports multiple-workspace ambiguity; if it does, resolve the workspace id automatically and rerun immediately.
21. When bridge or wrapper execution disagrees with the selected real runtime path, treat the selected real runtime path as the source of truth.
22. Working app copies must stay outside the repo in temp storage. Workflow evidence persists under `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` as compact runtime reports and transcripts. Publish into `applications/<target-app>/...` only after the resolved runtime action succeeds.

Hard gates
- Never read `.archive/`.
- Enforce guard precedence from `references/policies/memory-bank/00-guard/`.
- No guessed template attributes, no fabricated inputs.
- Whole-app runs must preserve baseline pages and shared components.
- Online runtime/import-ready runs require a resolved `db_connection_name` plus either a working build-root runtime or a working PATH SQLcl runtime.
- Standard user-facing prompts must avoid sandbox/escalation terminology unless the user explicitly asks for execution-environment details.
