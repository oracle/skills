# ExaCC OCI API MCP Server Reference

## Purpose

Use this reference when the user wants to inspect Oracle Exadata Cloud@Customer (ExaCC) through `oracle/mcp oci-api-mcp-server`.

The server is read-only for this skill: use only permitted `list` and `get` operations. The upstream server denylist is authoritative for blocked commands:

<https://github.com/oracle/mcp/blob/main/src/oci-api-mcp-server/oracle/oci_api_mcp_server/denylist>

## Read-Only Server Contract

For a request to create, provision, build, add, update, patch, scale, resize, activate, move, remove, delete, change-compartment, download, generate, validate, or otherwise mutate an ExaCC resource, stop before collecting inputs, calling command help, or invoking MCP. Tell the user exactly:

> The OCI API MCP server does not support this operation as of today.

If the requested operation is in the upstream denylist, also state that it is denied by the MCP server denylist. Do not suggest server configuration, allow lists, command sets, direct OCI CLI, another tool, or a workaround.

## MCP Command Construction

`oracle.oci-api-mcp-server` exposes OCI CLI access through MCP surfaces instead of direct shell commands.

- Use `run_oci_command` only to execute a permitted command.
- Use `get_oci_command_help` only to inspect the exact permitted `list` or `get` command.
- Every OCI call must go through the MCP server; never run `oci ...` directly in a shell.
- Do not include `oci`, `--profile`, or `--auth` in an MCP command string. The running server owns profile and authentication selection.

Resolve a display name with the narrowest permitted ExaCC `list` command and known parent scope. Present all matches and require the user to select one; never select a resource automatically.

## Allowed ExaCC Scope

Use only `list` and `get` subcommands in these ExaCC command families after confirming the target belongs to the ExaCC hierarchy:

| Command family | Permitted operations |
| --- | --- |
| `db exadata-infrastructure` | `list`, `get`, `get-compute-units` |
| `db vm-cluster-network` | `list`, `get` |
| `db vm-cluster` | `list`, `get`, `list-updates`, `list-update-histories`, `get-update`, `get-update-history` |
| `db db-server` | `list`, `get` |
| `db exadata-infrastructure-un-allocated-resources` | `get` |
| `db infrastructure-target-version` | `get` |
| `db gi-version` | `list` |

Do not use ExaDB-XS (`db exadb-vm-cluster`), ExaCS public-cloud (`db cloud-vm-cluster`, `db cloud-exa-infra`), or non-ExaCC command families.

## Required Read Workflow

1. Identify the request as `list`, `get`, `show`, `inspect`, or inventory. Treat `show` and `inspect` as `get` when an OCID is supplied; otherwise resolve with a permitted `list` command.
2. If the request is a mutation, denylisted operation, or another non-read operation, provide the read-only server message and stop.
3. Call `get_oci_command_help` for the exact permitted command unless the user only requests a conceptual explanation.
4. Collect the scope required by current help. Do not guess OCIDs, display names, regions, or parent resources.
5. Execute only the permitted command through `run_oci_command`.
6. Present returned data without claiming it authorizes or validates a future mutation.

## Resource Hierarchy and Read Resolution

```text
Exadata Infrastructure
  -> VM Cluster Network
    -> VM Cluster
      -> DB Servers
```

For a supplied OCID, use its exact matching `get` command. For an inventory, resolve parent resources from the top of the hierarchy before listing a child resource. This proves the returned resources are ExaCC scoped.

## Command Patterns

Always confirm arguments with current command help before execution. These patterns are not a substitute for help.

```text
db exadata-infrastructure list --compartment-id <compartment-ocid>
db exadata-infrastructure get --exadata-infrastructure-id <infrastructure-ocid>
db vm-cluster-network list --compartment-id <compartment-ocid> --exadata-infrastructure-id <infrastructure-ocid>
db vm-cluster-network get --exadata-infrastructure-id <infrastructure-ocid> --vm-cluster-network-id <network-ocid>
db vm-cluster list --compartment-id <compartment-ocid> --exadata-infrastructure-id <infrastructure-ocid>
db vm-cluster get --vm-cluster-id <vm-cluster-ocid>
db db-server list --compartment-id <compartment-ocid> --exadata-infrastructure-id <infrastructure-ocid>
db db-server get --exadata-infrastructure-id <infrastructure-ocid> --db-server-id <db-server-ocid>
```

When complete inventory is requested, use `--all` only when current help supports it. Otherwise, follow the returned next-page token using the page argument shown by current help until there are no further pages.

## Error Handling

- **Denied command:** State that the operation is denied by the MCP server denylist and stop. Do not retry with a non-read command or direct shell command.
- **Unexpected argument or missing parameter:** Read help for the exact permitted command, rebuild it, and retry once.
- **Unauthorized or expired credentials:** Tell the user that the selected profile credentials are not valid. Do not add `--auth` as a workaround.
- **Resource not found:** Ask for a corrected OCID or a permitted list scope; do not infer parent resources.
- **Region or service unavailable:** Report the failing scope and continue only with other explicitly requested scopes.
