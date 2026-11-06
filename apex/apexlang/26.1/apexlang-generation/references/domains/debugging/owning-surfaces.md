# Owning Surfaces

Use this map to keep changes in the correct layer and to verify in the closest existing coverage.

| Owning layer | Change here | Verify there |
|---|---|---|
| Property model | `apex_install_pe_data.sql`, `wwv_meta_meta_data*`, `internal_utilities/dev/sql/pe_data_checks.sql` | Re-run metadata export or checks first, then the smallest metadata-related test that covers the changed rule. |
| APEXlang architecture or writer | `wwv_flow_apx*`, `gen_api_pkg.plb`, export semantics | Re-run the smallest reproducer that shows null, default, or ordering drift, then confirm the re-export stabilizes. |
| Import path | `wwv_flow_imp*`, especially `wwv_flow_imp.import_begin` for version parsing and import-time coercion | Re-run `apex test run test_app_import`, then the smallest direct validate or import reproducer. |
| Upgrade path | `wwv_flow_upgrade*` only when persisted legacy rows must be normalized in storage | Re-run the legacy-row upgrade scenario plus the import or export check that proved the defect. |
| Builder import UI | `images/apex_ui/js/f4000_apexlang_import.js` | Reproduce the Builder-side transport behavior and confirm the backend import path is either healthy or now surfaces the correct message. |
| Runtime APEX execution log | App page process, validation, computation, dynamic action Ajax callback, report SQL, plugin, PL/SQL package, REST call, or runtime layer named by the selected `APEX_DEBUG_MESSAGES.PAGE_VIEW_ID` log | Re-query the same `PAGE_VIEW_ID` for diagnosis, apply the smallest owner-specific fix, then reproduce with debug enabled and confirm the new run no longer emits the error. |
| Runtime UI or UX behavior | Shared components, page `.apx` composition, templates, or runtime widget/rendering layer depending on snapshot evidence | Re-run the same runtime page with Chrome DevTools MCP and confirm the visible state, selected item, focus target, or region presence is corrected. |

## Change Here, Verify There
- Property-model changes should verify in metadata checks before import tests.
- Import-package changes should verify in import tests before broader round-trip checks.
- Writer changes should verify with the smallest drift reproducer, not just a generic import pass.
- Upgrade changes should prove persisted-data repair, not merely transient import coercion.
- Builder UI changes should verify the transport symptom and the surfaced backend error shape.
- Runtime APEX execution-log fixes should verify against a new reproduced request, not only the old debug rows.
- Runtime UI fixes should verify the exact user-visible page state, not just a successful import or compile.

## Nearest Existing Coverage
- `apex test run test_app_import`: nearest automated coverage for import begin, version gating, and import-time coercion.
- `apex test run test_gendev_bp_to_apexlang`: nearest automated coverage for generation-to-APEXlang metadata emission paths.
- `apex test run codeEditor`: nearest automated coverage for Builder-adjacent code editor and import UI flows.
- `internal_utilities/dev/sql/pe_data_checks.sql`: nearest targeted check for property-model and display-group conflicts.
- Chrome DevTools MCP text snapshots: nearest runtime verification for navigation state, visible composition, focus behavior, and post-import UI drift.
- `APEX_DEBUG_MESSAGES` full log by `PAGE_VIEW_ID`: nearest live evidence for page-process, Ajax, SQL, PL/SQL, and plugin runtime errors.

## Ownership Boundaries
- If a fix changes how legacy input is accepted during import, start in import code, not upgrade code.
- If a fix changes what metadata is legal, keep property-model declarations, metadata validation, and emitters aligned.
- If the failure only appears after export, do not start in Builder.
- If a live APEX error has a debug log, do not diagnose from the standalone error text before reading the full `PAGE_VIEW_ID` log.
- If the failure appears only in the running app after validate/import succeed, start with runtime verification evidence before assigning ownership.
