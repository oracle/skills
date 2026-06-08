> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Agent: Direct SQLcl Validate Gate

Purpose
- Provide the canonical live-runtime gate for APEXlang artifact workflows.
- Enforce direct SQLcl `apex validate` before any optional import.
- Make live APEX validation from the selected target build the validation source of truth.
- Block completion until the live APEXlang check is proven; import eligibility is proven only after an explicit post-check import choice.

Scope
- Applies to all APEXlang-producing skills that generate or modify application artifacts.
- Excluded: requests that do not enter APEXlang artifact-generation workflows.

Preconditions
- Target artifacts were produced by the internal generate -> review -> fix loop in the transient temp workspace.
- `resolved_app_path` is absolute and points to the application folder being changed.
- `db_connection_name` is resolved for this run.
- The corresponding APEX workspace name is resolved for this run.
- Runtime capability status is resolved for this run.

Runtime contract
- Use direct SQLcl commands only.
- Default to `validate-only` for every APEX artifact workflow through `node tools/apexctl.mjs runtime validate --app-path <absolute_app_path> --db-connection-name <db_connection_name> --apex-root <resolved_build_root> [--compiler-oracle-home <compiler_metadata_home>]`.
- `--apex-root` selects only the APEX/SQLcl runtime used for live validation. Use `--compiler-oracle-home` only when explicitly overriding compiler-truth metadata discovery.
- The validate command must emit `validation-report.json`, `validation-transcript.log`, `problems.json`, and `component-contracts/<build>.json`.
- Require live APEX validation evidence for generated or revised `.apx` artifacts. Missing required runtime inputs or missing live runtime evidence records `LIVE_RUNTIME_VALIDATION_REQUIRED_001` and blocks completion.
- Treat compiler-truth, local lint, and VS Code Problems snapshots as diagnostics after live validation passes.
- After the live APEXlang check passes, offer GUI/clickable choices: `Check APEXlang code` (recommended) or `Check and import APEXlang code`; include a short purpose summary and, if GUI choices are unavailable, stop after checking the code and report import as a follow-up.
- Probe both supported runtime paths and select the live runtime path before validate/import:
  - resolved build-root runtime via `apex sql`
  - PATH SQLcl runtime via `sql -name <db_connection_name>`, then legacy `sql <db_connection_name>`, then `sql /nolog` plus `connect <db_connection_name>`
- `apex validate -input <resolved_app_path>` is mandatory for every live runtime run.
- `validate-and-import` runs for existing apps must resolve and preserve a canonical live numeric application id before any import-authorized continuation.
- If staged deployment metadata does not match that canonical application id, reconcile `resolved_app_path` to the canonical target before import.
- If the post-check GUI choice resolves to import, `apex validate -input <resolved_app_path>` and `apex import -input <resolved_app_path>` must run in the same authenticated SQLcl user session.
- The session must use the same `db_connection_name`, workspace context, and effective SQLcl user.
- If the session changes between validate and import, STOP and re-run validation before import.
- Do not replace the live validate/import path with Python wrapper scripts when direct SQLcl commands are available.
- If SQLcl explicitly reports multiple-workspace ambiguity, resolve the workspace id automatically for the active `db_connection_name` and restart the same real-SQLcl sequence with a run-scoped explicit `-workspaceid`.

Execution
1. Run `node tools/apexctl.mjs runtime validate --app-path <resolved_app_path> --db-connection-name <db_connection_name> --apex-root <resolved_build_root>`, adding `--vscode-problems-path <problems_snapshot_path>` only when a VS Code Problems snapshot already exists and `--compiler-oracle-home <compiler_metadata_home>` only for an explicit compiler metadata override.
2. Persist the emitted compact validation artifacts under the run artifact directory.
3. Review `problems.json`, sorted by file, line, severity, compiler type, and message.
4. Patch only reported problems; local validators are syntax hygiene unless produced from the same target build metadata.
5. Attempt the live APEXlang check at most 3 times in one run.
6. For each failed attempt with real SQLcl/compiler output, route to `references/domains/README.md`, apply the smallest concrete fix, rerun syntax hygiene checks as needed, and rerun `runtime validate`.
7. If SQLcl reports multiple-workspace ambiguity, resolve the workspace id automatically for the active `db_connection_name` and rerun `runtime validate` with the run-scoped explicit `-workspaceid`.
8. After live validate passes, run runtime UI verification for changed pages before any import continuation when the caller requested it. Prefer Chrome DevTools MCP when provided; otherwise use the runtime verifier's inferred page URLs plus HTTP/HTML artifacts.
9. Treat critical runtime verification findings such as login redirects, HTTP failures, APEX/ORA error text, or missing live state needed for the active fix as blocking. Route them through debugging before any import attempt.
10. If a build-root runtime attempt fails before real `apex validate` / `apex import` output because of sandbox-only filesystem/setup errors such as `EPERM`, `ENOENT`, or build-root `workdir/*` write failures, classify the result as an environment blocker, do not consume the 3-attempt validate budget, do not route to the debugging/fix loop, and continue with the real live build-root roundtrip in an execution context that can write the required build-root work files.
11. Record `resolved_app_path` as the canonical validated path after live validate passes.
12. Mark import eligibility only when the validate-only gate succeeds in that session and the post-check GUI choice resolves to import.

Outputs
- direct SQLcl validate success for the resolved app path
- `validation-report.json`
- `validation-transcript.log`
- `problems.json`
- `component-contracts/<build>.json`
- same-session eligibility for direct SQLcl import when the post-check GUI choice resolves to import
- recorded SQLcl capability status for the run
- recorded command outcome in the run report and transcript

Failure handling
- Missing required runtime inputs or live runtime evidence: stop with `LIVE_RUNTIME_VALIDATION_REQUIRED_001`.
- Local validator, compiler-truth, or VS Code Problems findings: record as diagnostics unless live validation cannot run.
- Sandbox-only build-root filesystem/setup blocker before real validate/import output: stop the sandbox attempt, keep the run out of the debugging/fix loop, and continue in a real live build-root execution context without consuming validate-attempt budget.
- Validation failure with a real SQLcl/compiler outcome: route to debugging, then retry from a fresh real SQLcl session until the third failed validate attempt.
- Third failed validate attempt: stop and surface actionable findings plus the owning layer.
- Path mismatch: stop before import.
- Session mismatch: stop and require re-validation.

Notes
- This gate standardizes completion checks; it does not replace domain routing.
- Completion remains blocked until runtime status proves eligibility.
