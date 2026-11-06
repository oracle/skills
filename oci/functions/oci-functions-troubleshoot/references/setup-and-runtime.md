# Setup And Control Plane

Use this reference when the user is blocked before normal OCI Functions operations work.

## High-Value Patterns

- `401 Unauthorized` from Fn CLI usually means the OCI profile, auth material, token, or registry auth does not match the target tenancy or region.
- `404 Not Found` or "Resource is not authorized or not found" can mean the context points at the wrong Functions endpoint, compartment, region, or app/resource name, or that IAM/policy/dynamic-group/network-resource authorization is missing.
- X509, passphrase, and private key parsing failures usually point to a bad key path, wrong passphrase, unsupported key format, or a damaged config entry.
- Docker unauthorized failures usually indicate OCIR auth is missing, stale, or using the wrong username format for the tenancy model.
- Some symptoms that look like platform breakage are caused by an outdated Fn CLI, so client age matters when the behavior conflicts with current documentation.

## Read-Only Checks

- Run `fn inspect context` and verify:
  - `api-url`
  - `oracle.compartment-id`
  - `oracle.profile`
  - `registry`
- Confirm the OCI CLI profile exists and points at the expected region and auth material.
- Compare the failing command's target app or function against the active context.
- If the symptom is `404`, verify the expected app/function names, target compartment, active region, and whether recent IAM, dynamic-group, or network-policy changes align with the failure.
- Check whether Docker is already authenticated to the registry host from the Fn context.

## Likely Cause Mapping

- `401` plus valid resource names: auth or token problem first.
- `404` after a region, context, or app change: wrong endpoint, compartment, or resource name first.
- `404` with the correct region and names, or after policy/network changes: `iam_or_policy` first.
- key or X509 parsing text: local OCI config and key material first.
- Docker push or pull unauthorized text: registry credentials and tenancy username format first.

## Safe Remediation Ideas

- Correct the active Fn context instead of changing the function first.
- Verify or update IAM, dynamic-group, policy, or compartment targeting before changing the endpoint blindly.
- Re-derive the registry host from the working region and tenancy.
- Refresh or replace OCI auth material if the profile is stale.
- Update Fn CLI if the symptom matches a known outdated-client issue.

## Sources

- [Functions QuickStart on Local Host](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsquickstartlocalhost.htm)
- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
- [Pushing Images Using the Docker CLI](https://docs.oracle.com/en-us/iaas/Content/Registry/Tasks/registrypushingimagesusingthedockercli.htm)
