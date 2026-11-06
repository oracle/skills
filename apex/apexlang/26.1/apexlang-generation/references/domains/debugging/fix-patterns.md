# Fix Patterns

Apply the fix pattern that matches the failure bucket. Do not spread one defect across multiple layers unless the contract truly spans them.

## Import Version-Gate Failure
- Put version-gated import fixes on the legacy import path.
- Fix parsing, coercion, and compatibility handling in `wwv_flow_imp*` before considering upgrade logic.
- Verify with `apex test run test_app_import` and the smallest direct import reproducer.

## APX Syntax Or File-Shape Failure
- Fix the emitted or edited `.apx` shape first.
- Do not patch import packages to accept malformed shape unless the format is intentionally supported.
- Re-run the smallest local validator before any broader import test.

## Compiler Metadata Or Property-Model Failure
- Keep dependency, requiredness, default, and display-group changes aligned across `apex_install_pe_data.sql`, `wwv_meta_meta_data*`, Builder emitters, and import or export paths.
- If metadata rules change, confirm `pe_data_checks.sql` passes before touching broader flows.
- Treat MMD and property-model contracts as the source of truth for allowed structure.

## Import Canonicalization Or Upgrade Failure
- Use import canonicalization when transient legacy input should normalize during import.
- Use upgrade logic only when persisted legacy rows must be repaired after storage.
- Confirm the chosen layer removes re-export churn without moving drift into the writer.

## Export Or Writer Round-Trip Drift
- Preserve canonical defaults, omission semantics, and explicit-null semantics.
- Fix missing, null, default, or ordering drift in the writer and export surfaces, not in unrelated metadata files.
- Re-check with the smallest import-plus-export reproducer until the diff stabilizes.

## Plugin, Display-Group, Or Identifier Conflict
- Clean up plugin JSON or related metadata while preserving `compute_attributes` parity.
- Fix identifier and static-id issues in a way that preserves deterministic ID handling.
- Re-run metadata checks first, then the smallest owning test.

## Builder Transport Or Auth Issue
- Only patch Builder JavaScript when the failure is fetch, auth, ORDS, JWT, or UI transport.
- If Builder merely exposes a backend import error, fix the backend owner and keep the UI change limited to better surfacing when needed.

## Runtime Session Or Workspace Routing Issue
- Reproduce from a real PATH SQLcl session after capability probing before changing the DSL.
- Add a run-scoped `-workspaceid` only after SQLcl explicitly reports multiple-workspace ambiguity, and resolve that workspace id automatically for the active `db_connection_name` before rerunning.
- Keep the fix in the runtime contract or invocation path; do not mutate the APEXlang artifact to compensate for workspace selection.

## Runtime Session Or Wrapper Artifact
- Treat the real PATH SQLcl session as the source of truth when it disagrees with a bridge or wrapper path.
- Fix the execution path, session handling, or evidence collection first; do not patch the DSL to satisfy a false negative from the wrapper path.
- Re-check with the same artifact and connection in a real SQLcl session before declaring the issue fixed.

## Runtime APEX Execution-Log Failure
- Start from the `APEX_DEBUG_MESSAGES.PAGE_VIEW_ID` full execution log, not from the isolated error message.
- If multiple page views match, ask for `PAGE_VIEW_ID` / debug id or `SESSION_ID` before picking an owner.
- If the existing log is sparse, ask for a Full trace reproduction before editing.
- Fix only the owner indicated by the full log: page process, validation, computation, dynamic action Ajax callback, report SQL, plugin, PL/SQL package, REST integration, or runtime configuration.
- Reproduce the failing flow with debug enabled after the fix and confirm the new `PAGE_VIEW_ID` log no longer contains the error.

## Runtime UI Or UX Verification Failure
- Confirm the defect in the running app with Chrome DevTools MCP before changing code or metadata.
- Fix the owning layer that the snapshot evidence points to: shared components, page composition, templates, or runtime rendering.
- Re-run the same runtime page and interaction path after the fix; do not accept validate/import success alone as proof.

## Cross-Layer Alignment Rules
- Do not change only one surface when the contract spans metadata declarations, Builder emitters, and import or export behavior.
- Do not use upgrade logic as a shortcut for import-path compatibility.
- Do not use writer normalization to hide a missing import canonicalization step.
- Do not patch Builder transport or import code to compensate for a runtime UI state issue that is already visible in snapshot evidence.
- Do not patch from a live APEX error message alone when `APEX_DEBUG_MESSAGES` can provide the full execution log.
