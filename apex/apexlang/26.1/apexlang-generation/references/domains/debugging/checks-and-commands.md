> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Checks And Commands

Use the smallest signal-bearing check first. Do not start with the broadest suite.

## APEX Debug Messages Check

Use this when the user provides an APEX/ORA runtime error message and the active task has a live DB connection.

Load `references/domains/debugging/apex-debug-messages.md` for the full query workflow.

Signal-bearing when:
- The error appears in the running APEX app or an Ajax/page-process request.
- The user provides an error message, debug id, `PAGE_VIEW_ID`, or `SESSION_ID`.
- The next useful evidence is the execution log surrounding the failed process.

Low signal when:
- No live DB connection is available.
- The issue is still a local `.apx` compiler or import failure.
- The debug log exists but was captured at a low level and does not include the failing owner.

Minimum checks:
- Search `APEX_DEBUG_MESSAGES.MESSAGE` for the stable part of the error text.
- Use the matching `PAGE_VIEW_ID` to fetch the full execution log ordered by `MESSAGE_TIMESTAMP, ID`.
- If multiple matches exist, ask for `PAGE_VIEW_ID` / debug id or `SESSION_ID` before diagnosing.
- If the selected log is sparse, ask for a new reproduction with debug level set to Full trace.

## Runtime UI Verification

Use this when validate/import already succeeded and the reported defect is visible only in the running app.

Signal-bearing when:
- The symptom is navigation expansion, current-state highlighting, missing visible content, focus behavior, or responsive layout drift.
- The page renders but not in the expected runtime state.

Low signal when:
- The failure is still a direct validate/import/compiler error.
- The issue is Builder auth or transport.

## Canonical Same-Session Runtime Check

Use this when validate/import behavior differs across execution paths or when SQLcl workspace context is suspected.

Note:
- The low-level `runtime roundtrip` command still blocks with `Missing Inputs` unless an import intent is supplied. Agent workflows should inject the check-only intent by default, then offer GUI import choices after the live APEXlang check passes.

```sh
node tools/apexctl.mjs runtime preflight --db-connection-name <db_connection_name>
node tools/apexctl.mjs runtime roundtrip --app-path <absolute_app_path> --db-connection-name <db_connection_name> --import-intent validate-only --execution-mode auto
```

Fallback when you need to force PATH SQLcl:

```sh
node tools/apexctl.mjs runtime roundtrip --app-path <absolute_app_path> --db-connection-name <db_connection_name> --execution-mode path
```

Force the resolved build-root runtime explicitly:

```sh
node tools/apexctl.mjs runtime roundtrip --app-path <absolute_app_path> --db-connection-name <db_connection_name> --execution-mode build-root
```

Signal-bearing when:
- A bridge, MCP, or wrapper path reports a failure that may not reproduce in a real SQLcl session.
- SQLcl reports workspace ambiguity or other session-context differences.

Low signal when:
- Local DSL validators already fail before the live runtime path starts.
- The issue is clearly inside one known SQL owner and does not depend on session context.

Preferred checks:
- Chrome DevTools MCP text snapshot of the runtime page
- DOM or script inspection for `aria-current`, `aria-expanded`, selected classes, focus target, or region presence
- Screenshot only when the text snapshot cannot express the symptom

## Metadata Export Or Check Path

Use this when the symptom suggests metadata defaults, dependencies, display groups, or property-model conflicts.

```sh
apex util export-metadata
```

Signal-bearing when:
- The failure mentions metadata generation, MMD, display groups, child components, requiredness, or unexpected property validation.

Low signal when:
- The failure is pure Builder auth or transport.
- The failure is a syntax error in a specific `.apx` file before metadata interpretation begins.

## Targeted Property-Model Checks

Use this when the symptom suggests property-model or metadata registration conflicts.

```sh
sql <db_connection_name>
@internal_utilities/dev/sql/pe_data_checks.sql
```

Signal-bearing when:
- The failure mentions display-group conflicts, naming conflicts, metadata validation, child-component conflicts, or unexpected property validation.

Low signal when:
- The defect is a re-export diff with no metadata validation error.
- The defect is clearly a version-gate failure at import begin.

## Compile A Specific SQL Surface

Use this after identifying a concrete owning SQL file that must compile cleanly.

```sh
sql <db_connection_name>
@<repo-relative-file>
```

Signal-bearing when:
- You already know the owning SQL file and need to verify the candidate fix compiles in isolation.

Low signal when:
- Ownership is still unknown.
- The defect is UI transport only.

## Smallest Relevant Tests

### Generator To APEXlang Coverage

```sh
apex test run test_gendev_bp_to_apexlang
```

Use when:
- The symptom points to metadata generation or DSL emission shape coming from generation rather than import-only handling.

Do not start here when:
- The failure is clearly import-time version parsing or Builder transport.

### Code Editor Coverage

```sh
apex test run codeEditor
```

Use when:
- The symptom touches Builder import editing surfaces, code-editor mediated flows, or UI-side handling around import inputs.

Do not start here when:
- The error is already reproduced outside Builder with direct import or validation.

### Import Coverage

```sh
apex test run test_app_import
```

Use when:
- The symptom is compiler version mismatch, invalid version format, import begin failure, canonicalization drift, or legacy import coercion behavior.

Do not start here when:
- The defect is a pure metadata registration conflict already proven by `pe_data_checks.sql`.

## Recommended Triage Sequence
1. Quote the exact error text.
2. Pick one bucket from `failure-map.md`.
3. If the symptom is live validate/import behavior, start with the canonical same-session runtime check from the selected real runtime path.
4. Run one smallest confirming check from this file.
5. Escalate to the owning layer only after that check confirms the bucket.
6. Re-run one smallest relevant test after the fix.

## Command Selection Rules
- Prefer `apex util export-metadata` and `pe_data_checks.sql` for metadata and property-model failures.
- Prefer `APEX_DEBUG_MESSAGES` and the selected `PAGE_VIEW_ID` execution log for live APEX runtime errors with an error message.
- Prefer `test_app_import` for version parsing, coercion, and canonicalization during import.
- Prefer `codeEditor` only when the failure remains Builder-specific after ruling out backend import failure.
- Prefer Chrome DevTools MCP text snapshots for runtime UI/UX issues that remain after successful import.
- Prefer direct compile of one SQL file only after the owning surface is already known.
