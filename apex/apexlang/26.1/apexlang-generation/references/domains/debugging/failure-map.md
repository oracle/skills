# APEXlang Debugging Failure Map

Use this matrix after capturing the exact symptom. The goal is to identify the owning layer before opening unrelated code.

| Symptom or error text | Bucket | Owning layer | First confirming check |
|---|---|---|---|
| `created for APEX X, current version is Y` | `import version-gate failure` | `wwv_flow_imp*` version validation | Reproduce with the smallest import path and inspect version-gate handling in `wwv_flow_imp*` before touching upgrade logic. |
| Invalid compiler version or runtime version format | `import version-gate failure` | `wwv_flow_imp.import_begin` plus `test_app_import` coverage | Run `apex test run test_app_import` and inspect version parsing at import begin. |
| Widespread `REFERENCE_NOT_FOUND` errors for page templates, region templates, template components, labels, lists, or theme defaults such as `@/standard`, `@/title-bar`, `@/breadcrumb`, `@/text`, or `@/side-navigation-menu` | `theme default/reference drift` | The app's `shared-components/themes/**/theme.apx` contract and its base-theme mapping | Inspect the target app `theme.apx` first, check for a missing Universal Theme `baseTheme` binding or a stale `version` field, confirm the theme uses the current base-theme property/value contract, then re-check whether the missing references are downstream symptoms. |
| Unexpected property validation, metadata dependency failure, requiredness conflict, or default conflict | `compiler metadata or property-model failure` | `apex_install_pe_data.sql`, `wwv_meta_meta_data*`, `pe_data_checks.sql` | Export metadata and run `internal_utilities/dev/sql/pe_data_checks.sql` before changing writer or Builder code. |
| APEXlang compile errors such as `INVALID_PROPERTY`, `MINIMUM_COMPONENTS_ERROR`, or `MISSING_REQUIRED_PROPERTY` | `compiler metadata or property-model failure` | The `.apx` artifact shape plus component metadata requiredness | Reproduce with direct `apex validate -input` or `apex import -input`, map the property/component to the template or generator that emitted it, then patch the source rule before retrying. |
| Display-group conflict, child-component naming conflict, or property-model object-name conflict | `plugin/display-group/identifier conflict` | `pe_data_checks.sql` and the property-model layer | Run the targeted metadata checks and verify the conflicting display-group or child-component registration. |
| Explicit nulls disappear, defaults churn, or omitted fields reappear after export | `export/writer round-trip drift` | `wwv_flow_apx*`, `gen_api_pkg.plb`, export semantics | Diff the smallest reproducer and check writer handling for null, default, and omission semantics. |
| Import succeeds but re-export produces large churn | `import canonicalization/upgrade failure` or `export/writer round-trip drift` | `wwv_flow_imp*` / `wwv_flow_upgrade*` first, writer second | Confirm whether import canonicalization normalized the legacy shape fully before changing the writer. |
| Builder import screen shows ORDS, JWT, fetch, or auth failure | `Builder transport/auth issue` | `images/apex_ui/js/f4000_apexlang_import.js` | Verify whether the failure is transport-only or whether the underlying import call is failing with a real import error. |
| `Multiple workspaces available, use the workspaceId or the workspace option.` | `runtime session/workspace routing issue` | Real SQLcl runtime contract and workspace selection for the active run | Reproduce from a real PATH SQLcl session after capability probing before touching DSL or import logic. |
| Bridge, MCP, or wrapper execution reports a failure, but the equivalent real PATH SQLcl session succeeds | `runtime session/wrapper artifact` | Runtime execution path, not the APEXlang artifact | Reproduce with the same app path and connection using a real PATH SQLcl session. |
| A running APEX app reports an APEX/ORA error and the error text can be found in `APEX_DEBUG_MESSAGES` | `runtime APEX execution-log failure` | The app component, PL/SQL surface, plugin, SQL query, Ajax callback, or APEX runtime layer identified by the `PAGE_VIEW_ID` execution log | Search `APEX_DEBUG_MESSAGES.MESSAGE` for the stable error text, resolve `PAGE_VIEW_ID`, then fetch the full log for that page view. |
| The same APEX/ORA error appears in multiple `APEX_DEBUG_MESSAGES` page views | `runtime APEX execution-log failure` | Unknown until the failed run is narrowed | Ask for `PAGE_VIEW_ID` / debug id, `SESSION_ID`, application id, page id, user, or approximate timestamp before diagnosing. |
| `APEX_DEBUG_MESSAGES` contains the error row but no useful preceding process, SQL, PL/SQL, Ajax, or call-stack context | `runtime APEX execution-log failure` | Unknown until a higher-debug reproduction exists | Ask the user to reproduce with APEX debug level set to Full trace and provide the new `PAGE_VIEW_ID` / debug id or `SESSION_ID`. |
| Parser or file-shape failure on `.apx` input before import semantics apply | `APX syntax or file-shape failure` | The `.apx` artifact shape and local validators | Run the smallest local validator and inspect file shape before touching import packages. |
| Validate/import succeeds but runtime navigation, current-state, focus, or visible page structure is wrong | `runtime UI/UX verification failure` | Shared components, page composition, templates, or runtime rendering depending on the snapshot evidence | Run the Chrome DevTools MCP verification loop first and map the observed runtime state before touching Builder transport or import code. |

## Owner Selection Rules
- Prefer `import version-gate failure` when the message is about runtime version, compiler version, or import begin.
- Prefer `theme default/reference drift` when many pages or shared components suddenly lose template references that should be provided by the active Universal Theme defaults.
- Prefer `compiler metadata or property-model failure` when the message names a property, default, dependency, display group, or child-component rule.
- Prefer `export/writer round-trip drift` when import works but the serialized output is unstable.
- Prefer `import canonicalization/upgrade failure` when successful import still leaves legacy shape drift that should have been normalized during import.
- Prefer `Builder transport/auth issue` only for fetch, ORDS, JWT, auth, or UI transport symptoms.
- Prefer `runtime session/workspace routing issue` when the SQLcl runtime path blocks on workspace ambiguity before compile or import semantics.
- Prefer `runtime session/wrapper artifact` when the real SQLcl session and a bridge path disagree for the same artifact and connection.
- Prefer `runtime APEX execution-log failure` when a live running app emits an APEX/ORA error and `APEX_DEBUG_MESSAGES` can correlate it to a `PAGE_VIEW_ID`.
- Prefer `runtime UI/UX verification failure` when the defect remains only in the running app after validate/import are already green.

## Anti-Patterns
- Do not jump to Builder JavaScript because the first visible symptom appeared in Builder.
- Do not patch upgrade logic for a problem that happens only during import of transient input.
- Do not patch writer ordering or omission rules before ruling out missing import canonicalization.
- Do not treat a runtime UI symptom as an import failure when the app metadata already validates and imports cleanly.
