# OCI Functions Local Quickstart Notes

Use this as the operational baseline for local setup and deploy:

1. Ensure local tools are installed (`fn`, `oci`, `docker`, runtime toolchain).
2. Ensure Docker daemon is running.
3. Configure or validate the active Oracle Fn context first.
4. Ensure OCI CLI profile and auth are valid, including `security_token` retry only when needed.
5. Validate Docker auth for the Fn registry and refresh login only if needed.
6. Choose or create the Functions application.
7. When creating an application, collect `1-3` subnet OCIDs and only add shape or NSGs when the user explicitly asks for them.
8. Initialize function (`fn init --runtime <runtime>`).
9. Stop if the target directory already exists, is not empty, and does not contain `func.yaml`.
10. Deploy (`fn -v deploy --app <app-name>`).
11. Run strict preflight before deploy unless explicitly user-approved to bypass.

Fn context values typically include:
- `oracle.compartment-id`
- `oracle.profile`
- `api-url` (`https://functions.<region>.oci.oraclecloud.com`)
- `registry` (`<region-key>.ocir.io/<namespace>/<repo>`)
- `oracle.image-compartment-id` (optional, only when the OCIR repository is in another compartment)

Discovery-first expectation:
- Detect and reuse existing values first.
- Ask only for missing values.
- Confirm every mutating command before execution.
- On discovery auth/permission failures, stop and remediate before create/update actions.
- Treat networking as an advanced opt-in branch rather than part of the default deploy flow.
- Treat registry/subnet regional alignment as a manual check; do not guess the OCIR region key mapping.
- If deploy fails while pushing to OCIR, consider repository auto-create policy and image-compartment settings before retrying.
- This skill is for local macOS/Linux workflows. Windows is manual-only, and Cloud Shell is out of scope for this automation path.

## Sources

- [Functions QuickStart on Local Host](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsquickstartlocalhost.htm)
- [Creating Applications](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscreatingapps.htm)
- [Pushing Images Using the Docker CLI](https://docs.oracle.com/en-us/iaas/Content/Registry/Tasks/registrypushingimagesusingthedockercli.htm)
