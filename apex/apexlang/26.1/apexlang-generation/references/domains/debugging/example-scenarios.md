> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Example Scenarios

## 1. Compiler Version Newer Than Runtime
- Symptom: import reports that the artifact was created for a newer APEX version than the current runtime.
- Bucket: `import version-gate failure`
- First checks:
  - reproduce the smallest import path
  - run `apex test run test_app_import`
- Owner: `wwv_flow_imp*` version validation
- Fix pattern: adjust legacy import-path version gating or compatibility handling; do not start in upgrade logic.
- Re-check: smallest direct import reproducer plus `test_app_import`

## 2. Invalid Version Format
- Symptom: import begin rejects compiler or runtime version format.
- Bucket: `import version-gate failure`
- First checks:
  - inspect `wwv_flow_imp.import_begin`
  - run `apex test run test_app_import`
- Owner: import begin parsing
- Fix pattern: repair import-path parsing and coercion for the supported legacy format.
- Re-check: `test_app_import`

## 3. Metadata Display-Group Conflict
- Symptom: metadata validation fails with a display-group or child-component naming conflict.
- Bucket: `plugin/display-group/identifier conflict`
- First checks:
  - `apex util export-metadata`
  - `sql <db_connection_name>`
  - `@internal_utilities/dev/sql/pe_data_checks.sql`
- Owner: property-model metadata surfaces
- Fix pattern: align display-group metadata and related registrations without masking the conflict in writer or Builder layers.
- Re-check: metadata export or check path first, then the nearest metadata-related automated coverage

## 4. Successful Import Followed By Large Re-Export Diff
- Symptom: import succeeds, but exporting the app again creates large churn.
- Bucket: start with `import canonicalization/upgrade failure`, then fall back to `export/writer round-trip drift` if import normalization is complete
- First checks:
  - reproduce the smallest import-plus-export cycle
  - inspect canonicalization in `wwv_flow_imp*` or `wwv_flow_upgrade*`
- Owner: import canonicalization first, writer second
- Fix pattern: complete import normalization if legacy shape should be canonicalized on import; only then patch writer semantics for remaining null, default, or ordering drift.
- Re-check: the same small import-plus-export cycle until the diff stabilizes

## 5. Builder Import Screen Shows ORDS Or JWT Error
- Symptom: Builder import UI shows ORDS, JWT, or auth-style failure even though the metadata itself appears valid.
- Bucket: `Builder transport/auth issue` unless backend import confirms a deeper failure
- First checks:
  - verify whether direct import reproduces a backend error
  - inspect `images/apex_ui/js/f4000_apexlang_import.js`
  - run `apex test run codeEditor` if the issue stays Builder-specific
- Owner: Builder transport layer first, backend import path second only if direct import fails
- Fix pattern: patch Builder JavaScript only for transport, fetch, or auth behavior; otherwise route back to the real backend owner.
- Re-check: reproduce the Builder flow and confirm the surfaced error is now accurate

## 6. Deep Link Opens The Page But Navigation Does Not Expand
- Symptom: a deep link opens a level-3 page, but the side navigation does not expand to the correct level-2 parent or mark the leaf entry current.
- Bucket: `runtime UI/UX verification failure`
- First checks:
  - confirm validate/import already succeeded
  - open the runtime page with Chrome DevTools MCP
  - capture a text snapshot and inspect current-state plus `aria-expanded`
- Owner: shared navigation/list metadata first, runtime rendering second only if the metadata is already correct
- Fix pattern: correct the shared-component hierarchy or current-state rules, then re-check the same deep link in runtime.
- Re-check: re-open the same deep link and confirm the level-2 branch is expanded and the level-3 leaf is selected

## 7. Wrapper Path Fails But Real SQLcl Session Succeeds
- Symptom: an MCP, bridge, or wrapper path reports validate/import failure, but the same app path succeeds in a real PATH SQLcl session for the same saved connection.
- Bucket: `runtime session/wrapper artifact`
- First checks:
  - run `node tools/apexctl.mjs runtime preflight`
  - reproduce with `sql <db_connection_name>`
  - if needed, retry with `sql /nolog` plus `connect <db_connection_name>`
  - compare workspace context and command shape
- Owner: runtime execution path, not the DSL
- Fix pattern: make the runtime contract and evidence collection use the real SQLcl session as the source of truth
- Re-check: rerun the same app path through the real SQLcl path and the corrected wrapper path

## 8. Legacy Page-Level Slot Drift
- Symptom: real SQLcl validate/import reports invalid or deprecated top-level page-region slot values such as `regionBody`, `contentBody`, `REGION_POSITION_01`, or `REGION_POSITION_02` on standard, left-side-column, or login page scaffolds.
- Bucket: `compiler metadata or property-model failure`
- First checks:
  - run `node tools/apexctl.mjs runtime preflight`
  - reproduce the warning in a real PATH SQLcl session using `sql <db_connection_name>` or the documented `/nolog` fallback
  - test runtime-aligned replacements on a temporary app copy with validate-only
- Owner: active APEXlang compiler/property model for the current build, not the wrapper path
- Fix pattern: for top-level page regions, migrate to the validated semantic slot names for the page family (`breadcrumbBar`, `leftColumn`, `body`) and keep region-local item/button slots unchanged unless the live CLI proves they are also invalid.
- Re-check: rerun validate/import on the corrected app copy and confirm the top-level slot warnings are gone in the real SQLcl session

## 9. Widespread Missing Theme References
- Symptom: validation reports many `REFERENCE_NOT_FOUND` errors for `@/standard`, `@/title-bar`, `@/breadcrumb`, `@/text`, `@/login`, `@/side-navigation-menu`, or similar template and default references across many pages at once.
- Bucket: `theme default/reference drift`
- First checks:
  - inspect the target app `shared-components/themes/**/theme.apx` before patching any page
  - if Universal Theme references like `@/standard` and `@/login` are missing broadly, check first whether `baseTheme` is missing and a legacy `version` field is present instead
  - confirm the theme uses the current base-theme property/value contract for the active APEX build
  - compare the app theme against a known-good app exported by the same compiler/runtime build
- Owner: the app theme contract first, downstream page files second only if the theme defaults are already valid
- Fix pattern: repair the theme-level contract first, such as replacing stale theme-version fields with the current base-theme shape and value expected by the active build; a missing Universal Theme `baseTheme` should be treated as the primary suspect before editing any page or shared-component reference. Only then revisit any remaining page-local reference failures.
- Re-check: rerun the local first-pass check and confirm the broad missing-reference set collapses before editing individual pages.
