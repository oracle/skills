# ExaDB-D OCI API MCP Server Reference

## Purpose

Read this file when the user wants to inspect Oracle ExaDB-D (Exadata Database Service on Dedicated Infrastructure, also known as ExaCS) through `oracle/mcp oci-api-mcp-server`.

The server is read-only for this skill: use only supported `list` and `get` operations. The upstream server denylist is authoritative for blocked commands: <https://github.com/oracle/mcp/blob/main/src/oci-api-mcp-server/oracle/oci_api_mcp_server/denylist>.

## Read-only server contract

`oci-api-mcp-server` does not support create or update operations for ExaDB-D resources as of today. It also denies every operation in its upstream denylist.

For a request to create, provision, add, update, patch, scale, move, remove, delete, or otherwise mutate any ExaDB-D resource, stop before collecting inputs, calling command help, or invoking the MCP server. Tell the user exactly:

> The OCI API MCP server does not support this operation as of today.

If the requested operation is in the upstream denylist, also state that it is denied by the MCP server denylist. Do not suggest server configuration, allow lists, command sets, direct OCI CLI, another tool, or a workaround.

## About oci-api-mcp-server

`oracle.oci-api-mcp-server` is a `stdio` MCP server that exposes OCI CLI access through MCP surfaces instead of direct shell commands.

- Every permitted OCI call must go through the MCP server.
- Use `run_oci_command` to execute a permitted command.
- Use `get_oci_command_help` to inspect the current syntax of an exact `list` or `get` command.
- Use `resource://oci-api-commands` for service discovery.
- Never run `oci ...` directly in a shell.

At server startup, it selects one OCI profile from `OCI_CONFIG_PROFILE` or `DEFAULT`, and chooses authentication from that profile or `OCI_CLI_AUTH`. Profile and authentication are server-level settings, not per-call settings.

Therefore, never include `oci`, `--profile`, or `--auth` in a command string, and do not run `oci session authenticate` through this path.

## Allowed ExaDB-D scope

Use only ExaDB-D read operations in these command families after confirming the target belongs to the ExaDB-D hierarchy:

- `db cloud-exa-infra list` and `get`
- `db cloud-vm-cluster list` and `get`
- `db db-home list` and `get`
- `db database list` and `get`
- `db pluggable-database list` and `get`
- `db backup list` and `get`, when the backup's database target is confirmed as ExaDB-D

Never use `db exadb-vm-cluster`, ExaCC, or another database-service command family. Do not use non-ExaDB-D commands for compartments, identity, VCNs, subnets, route tables, security lists, gateways, DNS, or NSGs.

## Required read workflow

1. Identify the request as `list`, `get`, `show`, `inspect`, or inventory. Treat `show` and `inspect` as `get` when an OCID is supplied; otherwise resolve with an allowed `list`.
2. If the request is any mutation or denylisted operation, provide the read-only server message and stop.
3. Call `get_oci_command_help` for the exact permitted `list` or `get` subcommand, unless the user only asks for a conceptual explanation.
4. Collect the scope required by current help. Do not guess OCIDs, regions, or parent resources.
5. Execute only the permitted `list` or `get` command through `run_oci_command`.
6. Present the returned data without claiming that it authorizes or validates a future mutation.

For a regional operation, require an explicit region; never silently use the profile region. For `all regions`, require the user's explicit region list or use a separate region/identity skill if one is available. Do not use a non-ExaDB-D command to discover regions.

## Resource hierarchy and read resolution

Use this hierarchy to scope inventory and resolve parent resources:

```text
compartment
  -> cloud-exa-infra
    -> cloud-vm-cluster
      -> db-home
        -> database / CDB
          -> pluggable-database / PDB
```

For an OCID, use the exact allowed `get` command to inspect the resource. For a name, list the resource in its known permitted scope, present any matches, and require the user to select one; never choose a match automatically.

For ExaDB-D database inventory in a compartment, first list Cloud VM Clusters, then list databases for each selected Cloud VM Cluster. For PDB inventory, first resolve the database/CDB, then list PDBs for each selected database. This hierarchy proves the results are ExaDB-D scoped.

## Command patterns

Always confirm the exact arguments with current command help before execution. These are patterns, not a substitute for help.

### Cloud Exadata Infrastructure

```text
db cloud-exa-infra list --compartment-id <compartment_ocid> --region <region> --all
db cloud-exa-infra get --cloud-exa-infra-id <ocid> --region <region>
```

### Cloud VM Cluster

```text
db cloud-vm-cluster list --compartment-id <compartment_ocid> --region <region> --all
db cloud-vm-cluster get --cloud-vm-cluster-id <ocid> --region <region>
```

### DB Home

```text
db db-home list --compartment-id <compartment_ocid> --vm-cluster-id <vm_cluster_ocid> --region <region> --all
db db-home get --db-home-id <ocid> --region <region>
```

### Database / CDB

```text
db database list --compartment-id <compartment_ocid> --vm-cluster-id <vm_cluster_ocid> --region <region> --all
db database get --database-id <ocid> --region <region>
```

### Pluggable Database / PDB

```text
db pluggable-database list --database-id <database_ocid> --region <region> --all
db pluggable-database get --pluggable-database-id <ocid> --region <region>
```

If current help does not support `--all`, follow the returned pagination token with the supported page argument until all requested pages are retrieved.

## Error handling

- **Denied command:** State that the operation is denied by the MCP server denylist and stop. Do not retry with a mutation or direct shell command.
- **Unexpected argument or missing parameter:** Read help for the exact permitted command, rebuild it, and retry once.
- **Unauthorized or expired credentials:** Tell the user that the selected profile credentials are not valid. Do not add `--auth` as a workaround.
- **Resource not found:** Ask for a corrected OCID or permitted list scope; do not infer parent resources.
- **Region/service unavailable:** Report the failing region and continue with other explicitly requested regions unless the user asked to stop.

## Correct call examples

```json
{
  "tool": "get_oci_command_help",
  "arguments": { "command": "db cloud-vm-cluster list" }
}
```

```json
{
  "tool": "run_oci_command",
  "arguments": {
    "command": "db cloud-vm-cluster list --compartment-id ocid1.compartment.oc1..xyz --region us-ashburn-1 --all"
  }
}
```

```json
{
  "tool": "run_oci_command",
  "arguments": {
    "command": "db database get --database-id ocid1.database.oc1..xyz --region us-ashburn-1"
  }
}
```
