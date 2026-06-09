# CIDR Sizing Guidance for OCI Functions

When creating new subnets for OCI Functions, account for projected scale.

Reference heuristic from OCI Functions docs:

`required_ips ~= 3 * subnet_count + total_concurrency_memory_gb / 14`

Where:
- `subnet_count`: number of subnets attached to the application
- `total_concurrency_memory_gb`: total memory provisioned by concurrent executions

Operational rule in this skill:
- Prompt for expected concurrency and memory whenever a new subnet is about to be created, even if the VCN already exists.
- Warn when the selected subnet CIDR is likely too small.
- Treat the result as OCI sizing guidance rather than a hard pass/fail rule.
- Continue only after explicit user confirmation.

## Sources

- [CIDR Blocks and OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscidrblocks.htm)
