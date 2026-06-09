# Application Creation

Use this reference when creating an OCI Functions application fails.

## Common Documented Failure

- A failed application create with a service-limit style message often means the tenancy or compartment already reached the OCI Functions application count limit.

## Read-Only Checks

- List existing applications in the target compartment.
- Check current Functions limits and availability for the target region.
- Confirm the create request is going to the intended compartment and region.
- Capture the exact service message. If it does not read like a limit or capacity message, keep IAM or compartment mis-targeting in play.

## Diagnosis Rules

- If the error mentions maximum applications, limit exceeded, or no remaining capacity for application creation, treat limits as the primary cause.
- If the create request is valid but the wrong compartment is targeted, fix the compartment selection before discussing service limits.
- If the error is generic auth or not-found text, or the compartment and region are mismatched, treat IAM or targeting as a co-equal branch rather than forcing a limit diagnosis.
- If the user needs only one more application and many old apps exist, cleanup may be smaller than requesting a limit increase.

## Safe Remediation Ideas

- Reuse an existing application when appropriate.
- Delete unused applications only after the user confirms they are not needed.
- Request a service limit increase when the application count is legitimately too low for the workload.
- If evidence points to IAM or targeting, correct compartment selection or permissions before discussing cleanup or limit increases.

## Sources

- [Creating Applications](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscreatingapps.htm)
- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
