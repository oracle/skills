# Deployment

Use this reference for `fn deploy`, image build and push, and application-config-related failures.

## High-Value Patterns

- Docker or OCIR auth failures during deploy are often registry credential issues, not function code issues.
- `FN_REGISTRY` overrides the registry destination that `fn deploy` would otherwise use from context, so inspect it before trusting the target.
- `triggers:` in `func.yaml` is not supported in current OCI Functions deploy flow and can cause deployment-time failure.
- Missing or incorrect subnet annotations usually come from deploying against the wrong application or from app-level network configuration not matching the function's expected environment.
- Identity-domain or federated OCIR usernames often need the tenancy namespace prefix, for example `tenancy-namespace/oracleidentitycloudservice/<username>`, so a short local username can fail even when the auth token is valid.
- Architecture mismatch symptoms can appear when the built image platform does not align with the Functions application expectation. Record `fn version` first; older clients deserve extra suspicion, and Oracle documents improved architecture handling in Fn CLI `0.6.25+`.

## Read-Only Checks

- Run `fn inspect context` and confirm the active app target.
- Run `fn inspect app <app-name>` and inspect annotations when a subnet or network issue is suspected.
- Read local `func.yaml` and confirm no unsupported deployment fields are present.
- Inspect the effective registry destination, including whether `FN_REGISTRY` is set in the shell.
- Record `fn version` when architecture or stale-client symptoms are plausible.
- Separate local build failure from image push failure from service-side deploy failure.

## Likely Cause Mapping

- push unauthorized or denied: OCIR credentials or username format
- unexpected registry host: `FN_REGISTRY` override or wrong context
- subnet annotation missing: wrong app or incomplete app networking setup
- schema or unsupported key error: invalid `func.yaml`
- image or architecture mismatch text on an older CLI: client-version or local build-target problem
- image or architecture mismatch text on a current CLI: local build target or application expectation mismatch

## Safe Remediation Ideas

- Remove or correct `FN_REGISTRY` when it conflicts with the intended OCI registry.
- Fix the target application or its annotations before rebuilding the function.
- Simplify `func.yaml` to supported keys only.
- Correct the OCIR username shape before regenerating tokens or re-running login.
- Rebuild with the intended platform after confirming the target architecture and client version.

## Sources

- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
- [Issues deploying applications and functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting_topic-Issues-deploying-applications-and-functions.htm)
- [Pushing Images Using the Docker CLI](https://docs.oracle.com/en-us/iaas/Content/Registry/Tasks/registrypushingimagesusingthedockercli.htm)
