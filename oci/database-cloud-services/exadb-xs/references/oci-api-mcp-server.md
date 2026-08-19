# ExaDB-XS OCI API MCP Server Reference

## Table of Contents

- [Purpose](#purpose)
- [About oci-api-mcp-server](#about-oci-api-mcp-server)
- [Workflow Highlights](#workflow-highlights)
- [Server Surfaces](#server-surfaces)
- [Absolute Rules](#absolute-rules)
- [MCP Server Contract](#mcp-server-contract)
- [Compartment Operations](#compartment-operations)
- [Scoping Rules](#scoping-rules)
- [Resolution Order](#resolution-order)
- [Service Defaulting Rules](#service-defaulting-rules)
- [Resource Hierarchy And Existing-Resource Resolution](#resource-hierarchy-and-existing-resource-resolution)
- [Region Handling](#region-handling)
- [Resource Resolution Patterns](#resource-resolution-patterns)
- [List And Read Operations Usually Need Scope](#list-and-read-operations-usually-need-scope)
- [Read-only Boundary](#read-only-boundary)
- [Error Handling](#error-handling)
- [Common Pitfalls](#common-pitfalls)
- [Correct And Incorrect Tool Calls](#correct-and-incorrect-tool-calls)
- [Sources](#sources)

## Purpose

Read this file for direct read-only ExaDB-XS list, get, inspect, and inventory workflows through `oracle/mcp oci-api-mcp-server`. Every executed OCI call must use this MCP server; do not run `oci ...` in a shell on this path. User-facing command examples may show the complete `oci ...` form.

Treat generic OCI database, databases, CDB, PDB, DB home, VM cluster, and Exascale storage-vault requests as ExaDB-XS unless the user explicitly names another database service.

## About oci-api-mcp-server

`oracle.oci-api-mcp-server` exposes OCI CLI access through MCP.

- Use `run_oci_command` to execute OCI command text.
- Use `get_oci_command_help` to inspect current syntax before fragile commands.
- Use `resource://oci-api-commands` for command-family discovery.
- For user-facing shell examples, show the complete `oci ...` command. For `run_oci_command`, pass only the text after `oci`; never send `oci`, `--profile`, or `--auth`.

Assume the active MCP server session already uses the intended OCI profile for the conversation. Do not explain server startup, session authentication, or profile selection unless the user asks about the MCP server itself.

## Workflow Highlights

- Treat generic OCI database, databases, CDB, PDB, DB home, VM cluster, and Exascale storage-vault requests as ExaDB-XS unless another OCI database service is named.
- For list/read, resolve direct OCID or compartment and region first.
- Ask for a region only for regional workflows; never silently use a profile region.
- If the user selects `all regions`, list subscribed regions and consolidate the regional results.
- Resolve hierarchy top-down: compartment → storage vault → ExaDB VM cluster → DB home → CDB → PDB.
- For ExaDB-XS database inventory, list VM clusters first, then databases for each VM cluster; list PDBs only when requested.
- Do not collect inputs for or execute resource mutations.

## Server Surfaces

| Surface | Type | Use it for | Key rule |
| --- | --- | --- | --- |
| `run_oci_command` | Tool | Execute OCI commands | Pass text after `oci` only |
| `get_oci_command_help` | Tool | Inspect command syntax | Do not include `--help` |
| `resource://oci-api-commands` | Resource | Discover command families | Read it as a resource |

## Read-only Boundary

This skill currently supports read-only operations only: `list`, `show`, `get`, `inspect`, and `inventory`.

Explicitly deny `create`, `provision`, `build`, `add`, `update`, `patch`, `scale`, `move`, `change-compartment`, `delete`, `remove`, `upgrade`, `clone`, `start`, and `stop` requests. State that ExaDB-XS mutation operations are currently disabled and that this skill supports read-only OCI API MCP operations only.

For a denied mutation, do not collect mutation inputs, call `get_oci_command_help`, or call `run_oci_command` for that operation.

## Absolute Rules

1. Execute every OCI operation through `oci-api-mcp-server` only.
2. Never include `oci`, `--profile`, or `--auth` in a command string.
3. Resolve names to OCIDs before read operations.
4. Resolve regional scope before any regional ExaDB-XS command.
5. Follow the hierarchy top-down.
6. Do not use `oci search` for resource resolution.
7. When a VM cluster OCID is known, run `db exadb-vm-cluster get --exadb-vm-cluster-id <OCID>`, extract `output.data["compartment-id"]`, and reuse it for DB home and database work.
8. Never scope `db db-home list`, `db database list`, `db pluggable-database list`, or `db backup list` with `--compartment-id` alone.
9. Always include `--vm-cluster-id` for `db db-home list` and `db database list`.
10. Scope `db pluggable-database list` and `db backup list` with `--database-id`.
11. Use `--compartment-id-in-subtree true` only with `iam compartment list`, never a `db` command.
12. If a read operation is denied by MCP server policy, report the policy mismatch and stop; never fall back to direct shell execution.
13. Call `get_oci_command_help` before constructing a read command whose flags are uncertain.

## MCP Server Contract

Profile and auth are server-level settings, not tool-call options. Never add `--profile` or `--auth` to a command string, and do not run `oci session authenticate` through this path.

## Compartment Operations

Compartment discovery is tenancy-global. This skill can list or resolve existing compartments, but does not create compartments. Get tenancy context with `iam region-subscription list`, then list descendants with:

```text
iam compartment list --compartment-id <TENANCY_OCID> --compartment-id-in-subtree true --all
```

For a compartment name, match `output.data[].name`: use the one matching OCID; if multiple match, show the OCIDs and ask the user; if none match, confirm tenancy root or offer the full list.

## Resolution Order

1. Resolve compartment or tenancy root.
2. Resolve the user-supplied region for regional work.
3. Resolve storage vault, VM cluster, DB home, database, and PDB parents in order.
4. Get live command help before fragile read syntax.
5. Execute through `run_oci_command`.
6. Stop after the initial response unless monitoring was requested.

## Service Defaulting Rules

Default generic OCI database, databases, CDB, PDB, DB home, VM cluster, and Exascale storage-vault requests to ExaDB-XS unless the user explicitly names another database service.

## Resource Hierarchy And Existing-Resource Resolution

```text
compartment
  -> Exascale DB storage vault
    -> ExaDB VM cluster
      -> DB home
        -> database / CDB
          -> pluggable database / PDB
```

For every parent choice, resolve an existing resource using an OCID, exact name, or inventory list. Do not gather child inputs before the parent is resolved, and do not collect inputs for new resources.

- The Exascale DB storage vault is the shared storage pool associated with its VM cluster.
- The ExaDB VM cluster is the compute layer linked to its vault.
- A DB home is the Oracle software home on the VM cluster.
- A database/CDB is under a DB home; a PDB is under one database/CDB.

## Scoping Rules

- Never run `db database list` with only `--compartment-id`; always anchor it to a specific ExaDB-XS VM cluster with `--vm-cluster-id`, then group by `db-home-id` or filter for one DB home.
- Never run `db db-home list` with only `--compartment-id`; always include `--vm-cluster-id`.
- Never run `db pluggable-database list` or `db backup list` with only `--compartment-id`; always include `--database-id`.

## Region Handling

Ask for one region or `all regions` for every regional ExaDB-XS workflow. For `all regions`, first run `iam region-subscription list`, filter subscribed regions, then run the requested operation in each region. Do not ask for a region for tenancy-global IAM compartment discovery.

## Resource Resolution Patterns

### Exascale DB Storage Vault

Use `db exascale-db-storage-vault list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all` to list and `get --exascale-db-storage-vault-id <OCID>` to inspect.

### ExaDB VM Cluster

Use `db exadb-vm-cluster list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all` to list and `get --exadb-vm-cluster-id <OCID>` to inspect. Resolve the parent storage vault for resource context when needed.

### DB Home

List DB homes against the resolved VM cluster using `db db-home list --compartment-id <COMPARTMENT_OCID> --vm-cluster-id <VM_CLUSTER_OCID> --region <REGION>`.

### Database

List databases under the resolved ExaDB VM cluster with `db database list --compartment-id <COMPARTMENT_OCID> --vm-cluster-id <VM_CLUSTER_OCID> --region <REGION>`. Get a database by OCID when requested.

### Pluggable Database

List PDBs only under a resolved database using `db pluggable-database list --database-id <DATABASE_OCID> --region <REGION>`.

## List And Read Operations Usually Need Scope

For inventory: resolve compartment and region, list ExaDB VM clusters, then drill into databases. Add storage-vault and DB-home detail when requested. Do not treat a bare compartment-level database list as sufficient ExaDB-XS scoping.

Never run `db database list` or `db db-home list` with only `--compartment-id`; always add `--vm-cluster-id`. Never run `db pluggable-database list` or `db backup list` with only `--compartment-id`; always add `--database-id`.

### List ExaDB VM Clusters

Resolve compartment and region first; accept one region or `all regions`.

```json
{"command":"db exadb-vm-cluster list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"display-name\\\",State:\\\"lifecycle-state\\\",AD:\\\"availability-domain\\\",Nodes:\\\"node-count\\\",EnabledECPU:\\\"enabled-e-cpu-count\\\",TotalECPU:\\\"total-e-cpu-count\\\"}\" --output table"}
```

For `all regions`, list subscribed regions first, then run the list once per region.

### List Databases

Resolve a VM cluster by OCID, name, or compartment-and-region list. List databases only with `--vm-cluster-id`, then group by `db-home-id` or filter client-side for one DB home:

```json
{"command":"db database list --compartment-id <COMPARTMENT_OCID> --vm-cluster-id <VM_CLUSTER_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"db-name\\\",DisplayName:\\\"display-name\\\",State:\\\"lifecycle-state\\\",DbHomeId:\\\"db-home-id\\\"}\" --output table"}
```

For one DB home only, filter `data[?\"db-home-id\"=='<DB_HOME_OCID>']`. Never return a flat compartment-wide database list without VM-cluster and DB-home context.

### List Pluggable Databases

Resolve the parent database/CDB, then list only with `--database-id`:

```json
{"command":"db pluggable-database list --database-id <DATABASE_OCID> --region <REGION> --query \"data[*].{ID:id,Name:\\\"pdb-name\\\",OpenMode:\\\"open-mode\\\",State:\\\"lifecycle-state\\\"}\" --output table"}
```

## Error Handling

- **Unexpected argument or missing parameter:** call `get_oci_command_help` for the exact command group, rebuild the command, and retry once.
- **Unauthorized, invalid token, or expired session:** report that the MCP server session is not authenticated for its selected profile or tenancy; do not add `--auth` or `--profile` as a workaround.
- **Forbidden:** report the failed operation and its scope as an IAM-policy issue.
- **Not found:** re-resolve the resource and parent chain before retrying.
- **Region/service unavailable:** report the failing region and continue remaining requested regions for `all regions` unless the user asked to stop.
- **MCP server denies a command:** report that server policy does not match this skill and stop; do not fall back to direct shell execution.

## Common Pitfalls

- Confusing ExaDB-XS with ExaCS/ExaDB-D or ExaCC: `exadb-vm-cluster` is ExaDB-XS; `cloud-vm-cluster` is ExaDB-D; `vm-cluster` is ExaCC.
- Listing databases or DB homes with only `--compartment-id`.
- Silently defaulting the region.
- Polling by default.
- Passing `oci`, `--profile`, `--auth`, or `--help` in MCP tool input.

## Correct And Incorrect Read-only Tool Calls

Correct:

```json
{"tool":"run_oci_command","arguments":{"command":"db exadb-vm-cluster list --compartment-id <COMPARTMENT_OCID> --region <REGION>"}}
```

```json
{"tool":"run_oci_command","arguments":{"command":"db database list --compartment-id <COMPARTMENT_OCID> --vm-cluster-id <VM_CLUSTER_OCID> --region <REGION> --all"}}
```

Incorrect:

```json
{"tool":"run_oci_command","arguments":{"command":"oci db exadb-vm-cluster list --profile DEFAULT --compartment-id <COMPARTMENT_OCID>"}}
```

The latter incorrectly includes the executable and per-call profile.

```json
{"tool":"run_oci_command","arguments":{"command":"db database list --compartment-id <COMPARTMENT_OCID> --region <REGION>"}}
```

This database list is missing the required VM-cluster scope anchor.

## Sources

- OCI CLI Reference: `oci db exadb-vm-cluster`
- OCI CLI Reference: `oci db exascale-db-storage-vault`
- OCI CLI Reference: `oci db database`
- OCI CLI Reference: `oci db pluggable-database`
