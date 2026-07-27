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
- [Resource Hierarchy And Existing-vs-New Choices](#resource-hierarchy-and-existing-vs-new-choices)
- [Region Handling](#region-handling)
- [Resource Resolution Patterns](#resource-resolution-patterns)
- [List And Read Operations Usually Need Scope](#list-and-read-operations-usually-need-scope)
- [Create Workflows](#create-workflows)
- [Impactful Operations](#impactful-operations)
- [Error Handling](#error-handling)
- [Common Pitfalls](#common-pitfalls)
- [Correct And Incorrect Tool Calls](#correct-and-incorrect-tool-calls)
- [Sources](#sources)

## Purpose

Read this file for direct ExaDB-XS list, get, inspect, create, update, scale, patch, move, and delete workflows through `oracle/mcp oci-api-mcp-server`. Every executed OCI call must use this MCP server; do not run `oci ...` in a shell on this path. User-facing command examples may show the complete `oci ...` form.

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
- Ask for a compartment before create unless it can be derived from a known parent OCID.
- Ask for a region only for regional workflows; never silently use a profile region.
- If the user selects `all regions`, list subscribed regions and consolidate the regional results.
- Resolve hierarchy top-down: compartment → storage vault → ExaDB VM cluster → DB home → CDB → PDB.
- For ExaDB-XS database inventory, list VM clusters first, then databases for each VM cluster; list PDBs only when requested.
- Require a pre-flight summary and explicit `yes` for create, update, scale, patch, move, and delete.
- Do not poll unless asked.

## Server Surfaces

| Surface | Type | Use it for | Key rule |
| --- | --- | --- | --- |
| `run_oci_command` | Tool | Execute OCI commands | Pass text after `oci` only |
| `get_oci_command_help` | Tool | Inspect command syntax | Do not include `--help` |
| `resource://oci-api-commands` | Resource | Discover command families | Read it as a resource |

## Absolute Rules

1. Execute every OCI operation through `oci-api-mcp-server` only.
2. Never include `oci`, `--profile`, or `--auth` in a command string.
3. Resolve names to OCIDs before mutation.
4. Resolve regional scope before any regional ExaDB-XS command.
5. Follow the hierarchy top-down.
6. Ask whether a storage vault is existing or new before collecting VM-cluster details.
7. Require an explicit `yes` for impactful actions.
8. Do not use `oci search` for resource resolution.
9. Ask for the target compartment before create unless it can be derived from a known parent OCID.
10. When a VM cluster OCID is known, run `db exadb-vm-cluster get --exadb-vm-cluster-id <OCID>`, extract `output.data["compartment-id"]`, and reuse it for DB home and database work.
11. Never scope `db db-home list`, `db database list`, `db pluggable-database list`, or `db backup list` with `--compartment-id` alone.
12. Always include `--vm-cluster-id` for `db db-home list` and `db database list`.
13. Scope `db pluggable-database list` and `db backup list` with `--database-id`.
14. Use `--compartment-id-in-subtree true` only with `iam compartment list`, never a `db` command.
15. If a mutation is denied by MCP server policy, report the policy mismatch and stop; never fall back to direct shell execution.
16. Call `get_oci_command_help` before constructing any create, update, scale, or delete command whose flags are uncertain.

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
4. Get live command help before fragile syntax.
5. Show pre-flight for impactful actions.
6. Execute through `run_oci_command`.
7. Stop after the initial response unless monitoring was requested.

## Service Defaulting Rules

Default generic OCI database, databases, CDB, PDB, DB home, VM cluster, and Exascale storage-vault requests to ExaDB-XS unless the user explicitly names another database service.

## Resource Hierarchy And Existing-vs-New Choices

```text
compartment
  -> Exascale DB storage vault
    -> ExaDB VM cluster
      -> DB home
        -> database / CDB
          -> pluggable database / PDB
```

For every parent choice, ask existing versus new. For existing resources, accept an OCID, resolve an exact name, or list choices. Do not gather child inputs before the parent is resolved.

- The Exascale DB storage vault is the shared storage pool and must exist before its VM cluster is provisioned.
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

Use `db exascale-db-storage-vault list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all` to list, `get --exascale-db-storage-vault-id <OCID>` to inspect, and `get_oci_command_help` before create, update, change-compartment, or delete.

### ExaDB VM Cluster

Use `db exadb-vm-cluster list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all` to list and `get --exadb-vm-cluster-id <OCID>` to inspect. Resolve the parent storage vault before create. Get help before `create`, `update`, `change-compartment`, `add`, `remove`, or `delete`.

### DB Home

List DB homes against the resolved VM cluster using `db db-home list --compartment-id <COMPARTMENT_OCID> --vm-cluster-id <VM_CLUSTER_OCID> --region <REGION>`. Get exact syntax before create/update/delete.

### Database

List databases under the resolved ExaDB VM cluster with `db database list --compartment-id <COMPARTMENT_OCID> --vm-cluster-id <VM_CLUSTER_OCID> --region <REGION>`. Get a database by OCID and use command help before create, patch, upgrade, update, or delete.

### Pluggable Database

List PDBs only under a resolved database using `db pluggable-database list --database-id <DATABASE_OCID> --region <REGION>`. Get help before create, clone, update, start, stop, or delete.

## List And Read Operations Usually Need Scope

For inventory: resolve compartment and region, list ExaDB VM clusters, then drill into databases. Add storage-vault and DB-home detail when requested. Do not treat a bare compartment-level database list as sufficient ExaDB-XS scoping.

Never run `db database list` or `db db-home list` with only `--compartment-id`; always add `--vm-cluster-id`. Never run `db pluggable-database list` or `db backup list` with only `--compartment-id`; always add `--database-id`.

## Create Workflows

### Create Exascale DB Storage Vault

Collect compartment, region, availability domain, display name, capacity, and any supported tags. Inspect `db exascale-db-storage-vault create` help, show pre-flight, then require `yes`.

### Create ExaDB VM Cluster

#### Step 1: Existing or new VM cluster

Ask whether to use an existing ExaDB VM cluster or create a new one. For an existing cluster, ask for an OCID, exact display name, or permission to list clusters first.

#### Step 2: Resolve the Exascale storage vault

List vaults in the resolved compartment and region:

```json
{"command":"db exascale-db-storage-vault list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all --query \"data[*].{Name:\\\"display-name\\\",ID:id,State:\\\"lifecycle-state\\\",AD:\\\"availability-domain\\\",StorageGB:\\\"high-capacity-storage-gb\\\"}\" --output table"}
```

Ask whether to use an existing vault or create one. For a new vault, inspect create help; collect display name, availability domain, and storage size; show pre-flight; and require `yes`.

#### Step 3: Resolve networking

Ask whether the user has subnet OCIDs or wants them listed. Client and backup subnets must be distinct private subnets in the same VCN and region. This is discovery only; do not create a VCN or subnet.

```json
{"command":"network vcn list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all"}
```

```json
{"command":"network subnet list --compartment-id <COMPARTMENT_OCID> --vcn-id <VCN_OCID> --region <REGION> --all"}
```

#### Step 4: Resolve the Grid Infrastructure image

```sh
oci db gi-version list \\
  --compartment-id <YOUR_COMPARTMENT_OCID> \\
  --shape ExaDbXS \\
  --availability-domain <YOUR_AD_NAME>
```

```sh
oci db gi-minor-version list \\
  --compartment-id <YOUR_COMPARTMENT_OCID> \\
  --shape-family EXADB_XS \\
  --availability-domain <YOUR_AD_NAME> \\
  --version <MAJOR_VERSION>
```

Use the selected minor version's `grid-image-id` as `--grid-image-id`. For example, if the major version is `19.0.0.0`, pass `--version 19.0.0.0` to the minor-version command.

#### Step 5: Collect remaining required parameters

Call `get_oci_command_help("db exadb-vm-cluster create")` first. At minimum collect:

- `--display-name`
- `--hostname`
- `--shape`
- `--node-count`
- `--total-e-cpu-count`
- `--enabled-e-cpu-count`
- `--vm-file-system-storage`
- `--ssh-authorized-keys-file`
- optional `--cluster-name`, `--domain`, `--license-model`, `--time-zone`, `--nsg-ids`, `--backup-network-nsg-ids`, `--system-version`, `--shape-attribute`, and tags

`--ssh-authorized-keys-file` must be a real file path containing an RSA public key. Do not use Ed25519 keys or inline SSH key material into that flag.

#### Step 6: Pre-flight summary and create

Show assembled parameters, require `yes`, then run `db exadb-vm-cluster create`. Do not poll for `AVAILABLE` unless asked.

### List ExaDB VM Clusters

Resolve compartment and region first; accept one region or `all regions`.

```json
{"command":"db exadb-vm-cluster list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"display-name\\\",State:\\\"lifecycle-state\\\",AD:\\\"availability-domain\\\",Nodes:\\\"node-count\\\",EnabledECPU:\\\"enabled-e-cpu-count\\\",TotalECPU:\\\"total-e-cpu-count\\\"}\" --output table"}
```

For `all regions`, list subscribed regions first, then run the list once per region.

### Scale Or Update ExaDB VM Clusters

Resolve the target by OCID, name, or list. Show current state with `db exadb-vm-cluster get --exadb-vm-cluster-id <VM_CLUSTER_OCID> --region <REGION>`, inspect update help, collect only requested changes, show pre-flight, require `yes`, then update. Treat ECPU capacity changes as update flows.

### Delete ExaDB VM Clusters

Show current state with `db exadb-vm-cluster get`, require `yes`, then run the delete command. Do not poll unless asked.

### Create DB Home

Collect resolved VM-cluster OCID, DB-home name, supported DB version, initial database details, and password without echoing it. Inspect DB-home create help, show pre-flight, then require `yes`.

### Create Database

#### Step 1: Resolve the VM cluster

Ask whether the database belongs in an existing or new VM cluster. With a known VM-cluster OCID, run `db exadb-vm-cluster get --exadb-vm-cluster-id <VM_CLUSTER_OCID> --region <REGION>`, extract `output.data["compartment-id"]`, and reuse it.

#### Step 2: Resolve DB home

Ask whether to use an existing DB home or create/let OCI provision the needed database layer according to live CLI behavior. List DB homes with:

```json
{"command":"db db-home list --compartment-id <COMPARTMENT_OCID> --vm-cluster-id <VM_CLUSTER_OCID> --region <REGION> --all"}
```

#### Step 3: Collect database parameters

Call `get_oci_command_help("db database create")` first. At minimum collect `--db-name`, `--admin-password`, `--db-version`, and `--vm-cluster-id`; collect optional `--db-home-id`, `--pdb-name`, character set, workload, managed software update, backup, storage, and tags when supported by the installed CLI.

#### Step 4: Pre-flight summary and create

Show assembled parameters, require `yes`, then run `db database create`. Do not poll unless asked.

### List Databases

Resolve a VM cluster by OCID, name, or compartment-and-region list. List databases only with `--vm-cluster-id`, then group by `db-home-id` or filter client-side for one DB home:

```json
{"command":"db database list --compartment-id <COMPARTMENT_OCID> --vm-cluster-id <VM_CLUSTER_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"db-name\\\",DisplayName:\\\"display-name\\\",State:\\\"lifecycle-state\\\",DbHomeId:\\\"db-home-id\\\"}\" --output table"}
```

For one DB home only, filter `data[?\"db-home-id\"=='<DB_HOME_OCID>']`. Never return a flat compartment-wide database list without VM-cluster and DB-home context.

### Create Pluggable Database

Ask whether the PDB belongs in an existing CDB or a new one. A known database OCID is sufficient scope; otherwise complete database creation first. Call `get_oci_command_help("db pluggable-database create")`, then collect `--container-database-id`, `--pdb-name`, `--pdb-admin-password`, and optional TDE/wallet password and tags. Show pre-flight, require `yes`, then create.

### List Pluggable Databases

Resolve the parent database/CDB, then list only with `--database-id`:

```json
{"command":"db pluggable-database list --database-id <DATABASE_OCID> --region <REGION> --query \"data[*].{ID:id,Name:\\\"pdb-name\\\",OpenMode:\\\"open-mode\\\",State:\\\"lifecycle-state\\\"}\" --output table"}
```

## Impactful Operations

Before mutation, show resource OCID, compartment, region, operation, and material implications such as capacity changes, deletion, or replacement. Execute only after the user replies `yes`. Return the initial work request/response and do not wait unless asked.

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
- Skipping the storage vault before VM-cluster creation.
- Silently defaulting the region.
- Polling by default.
- Passing `oci`, `--profile`, `--auth`, or `--help` in MCP tool input.

## Correct And Incorrect Tool Calls

Correct:

```json
{"tool":"get_oci_command_help","arguments":{"command":"db exadb-vm-cluster create"}}
```

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
{"tool":"get_oci_command_help","arguments":{"command":"db exadb-vm-cluster create --help"}}
```

The help tool receives the command group without `--help`.

```json
{"tool":"run_oci_command","arguments":{"command":"db database list --compartment-id <COMPARTMENT_OCID> --region <REGION>"}}
```

This database list is missing the required VM-cluster scope anchor.

## Sources

- OCI CLI Reference: `oci db exadb-vm-cluster`
- OCI CLI Reference: `oci db exascale-db-storage-vault`
- OCI CLI Reference: `oci db database`
- OCI CLI Reference: `oci db pluggable-database`
