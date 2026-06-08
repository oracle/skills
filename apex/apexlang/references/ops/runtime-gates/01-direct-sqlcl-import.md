# Agent: Direct SQLcl Import

Purpose
- Provide the import continuation after the live APEXlang check succeeds for APEXlang artifact workflows after the user explicitly chose import in the post-check GUI flow.
- Import validated APEXlang artifacts through direct SQLcl commands.
- Preserve the same-session guarantee between validate and import.

When to invoke
- Any APEXlang artifact workflow that reaches import-ready state after a post-check GUI choice resolves to import.
- Standalone import of previously generated artifacts when the live APEXlang check is also available for the same run.

Preconditions
- `db_connection_name` is resolved.
- The corresponding APEX workspace name is resolved.
- The post-check GUI import choice for the run resolved to import.
- `resolved_app_path` is absolute and points to the transient temp app copy selected for import.
- Runtime capability status confirms validate/import support for the active run.
- The canonical live numeric application id for the existing app is resolved and preserved as session authority.
- If staged deployment metadata originally pointed at a different app id, `resolved_app_path` has already been reconciled to the canonical application id.
- `application_id` is known for optional post-import export.
- The same `resolved_app_path` has already passed SQLcl `apex validate` in the active authenticated SQLcl user session.

Canonical flow
1. Open one authenticated SQLcl user session with `db_connection_name`, trying `sql -name <db_connection_name>` first, then legacy `sql <db_connection_name>`, and falling back to `sql /nolog` plus `connect <db_connection_name>` inside that same session when needed.
2. Prefer the resolved build-root runtime via `apex sql`; otherwise use the PATH SQLcl session.
3. Run `apex validate -input <resolved_app_path>` in that session if a valid same-session runtime status is not already active.
4. If the active runtime session reports multiple-workspace ambiguity, resolve the workspace id automatically for the active `db_connection_name` and restart the same real-SQLcl sequence immediately with an explicit run-scoped `-workspaceid`.
5. Run `apex import -input <resolved_app_path>` in that same session.
6. If import output reports an application id different from the preserved canonical target, stop the run, record the mismatch, and treat the reported target as an accidental duplicate or wrong target.
7. Optionally run `apex export -applicationid <application_id> -exptype APEXLANG -split -dir <absolute_export_dir>` only when the selected runtime path confirms export support.
8. If a build-root runtime attempt fails before real `apex validate` / `apex import` output because of sandbox-only filesystem/setup errors such as `EPERM`, `ENOENT`, or build-root `workdir/*` write failures, classify the result as an environment blocker, do not consume live validate-attempt budget, and continue with the real live build-root roundtrip in an execution context that can write the required build-root work files.

Hard rule
- Validate and import must happen in the same authenticated SQLcl user session.
- If validate and import do not happen in the same session, STOP and re-run validation before import.
- Use direct SQLcl commands for the live path; do not substitute helper Python wrappers for validate/import/export.

Outputs
- SQLcl command transcript and compact runtime report recorded with the run.

Required recorded facts
- validated app path
- imported app path
- `db_connection_name`
- recorded SQLcl capability status
- whether validate and import used the same authenticated SQLcl session

Failure handling
- Validation failure: stop, do not import.
- Sandbox-only build-root filesystem/setup blocker before real validate/import output: stop the sandbox attempt, do not route to the debugging/fix loop, and continue in a real live build-root execution context.
- Import failure: route to `references/domains/README.md`, apply the smallest concrete fix, rerun local validators, and restart from validate in a fresh real SQLcl session.
- Session mismatch: stop and require re-validation.
- Path mismatch: stop before import.
