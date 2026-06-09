# OCI Functions VCN and Subnet Requirements

Use this reference only when the user explicitly opts into the advanced network branch or when existing OCI networking must be repaired with explicit approval.

Primary references:
- https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscreatingvcn.htm
- https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscidrblocks.htm

Key requirements to enforce in this skill:

- Recommend private-first topology for Functions runtime subnets as a security default, not as a platform requirement.
- Use regional subnet(s) for Functions applications.
- For private subnet routing, create service gateway access to Oracle Services Network and route appropriately.
- For public topology, create internet gateway with `0.0.0.0/0` routing.
- Ensure security list or NSG egress rules required for registry access are in place. Accept broader valid rules when they already allow the required service access.
- Do not silently convert an existing reuse path into network creation. Network changes stay behind the explicit advanced branch.

Topology prompt guidance:
- `private` (recommended): private subnet + service gateway route.
- `public`: public subnet + internet gateway route.
- `mixed`: support both, but use private subnet for Functions app by default.

Creation order:
1. VCN
2. Gateways and route table(s)
3. Subnet(s)
4. Functions application referencing subnet OCID(s)

Operational caveats:
- OCI Functions applications can attach to `1-3` subnets.
- Registry/subnet regional alignment should be checked deliberately when the registry and networking inputs come from different sources.

## Sources

- [Creating the VCN and Subnets to Use with OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscreatingvcn.htm)
- [CIDR Blocks and OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscidrblocks.htm)
- [Creating Applications](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscreatingapps.htm)
