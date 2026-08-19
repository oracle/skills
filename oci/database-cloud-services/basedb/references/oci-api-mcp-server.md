# BaseDB OCI API MCP Server Reference

## Table of Contents

- [Purpose](#purpose)
- [About oci-api-mcp-server](#about-oci-api-mcp-server)
- [Workflow Highlights](#workflow-highlights)
- [Server Surfaces](#server-surfaces)
- [Absolute Rules](#absolute-rules)
- [MCP Server Contract](#mcp-server-contract)
- [Compartment Operations](#compartment-operations)
- [Resolution Order](#resolution-order)
- [Service Defaulting Rules](#service-defaulting-rules)
- [Resource Hierarchy And Existing-vs-New Choices](#resource-hierarchy-and-existing-vs-new-choices)
- [Scoping Rules](#scoping-rules)
- [Region Handling](#region-handling)
- [Resource Resolution Patterns](#resource-resolution-patterns)
- [List And Read Operations Usually Need Scope](#list-and-read-operations-usually-need-scope)
- [Error Handling](#error-handling)
- [Common Pitfalls](#common-pitfalls)
- [Correct And Incorrect Tool Calls](#correct-and-incorrect-tool-calls)
- [Sources](#sources)

## Purpose

Read this file for direct read-only BaseDB virtual machine DB-system list/get, DB home, database/CDB, PDB, backup, and Data Guard workflows through `oracle/mcp oci-api-mcp-server`.

Every OCI call must use this MCP server. Never run `oci ...` in a shell on this path.

Treat generic OCI database, databases, DB-system, dbsystem, DB home, CDB, PDB, backup, and Data Guard requests as BaseDB unless the user explicitly names another database service.

## Temporary Mutation Denial

Before any MCP call, deny create, launch, restore, clone, add, update, patch, upgrade, move, subscription change, Data Guard role change, delete, and terminate requests. This MCP server does not currently support BaseDB mutations. Do not collect mutation inputs, call `get_oci_command_help`, or use `run_oci_command` for a denied request.

## About oci-api-mcp-server

`oracle.oci-api-mcp-server` exposes OCI CLI access through MCP.

- Use `run_oci_command` to execute OCI command text.
- Use `get_oci_command_help` to inspect current read-only command syntax.
- Use `resource://oci-api-commands` for command-family discovery.
- Pass only text after `oci`; never send `oci`, `--profile`, or `--auth`.

Assume the active MCP server session already uses the intended OCI authentication context. Do not explain server startup, local session authentication, or profile selection unless the user asks about the MCP server itself.

## Workflow Highlights

- Default generic OCI database and DB-system requests to BaseDB unless another database service is named.
- Scope this reference to BaseDB virtual machine DB systems; reject bare metal and other service-specific command families.
- Deny mutations before any MCP call.
- For list/read, resolve a direct OCID or compartment and region first.
- Ask for a region for regional workflows; never silently use a remembered region.
- For `all regions`, list subscribed regions and consolidate regional results.
- Resolve hierarchy top-down: compartment → VCN → subnet → VM DB system → DB home → CDB → PDB.
- Use existing compartments, VCNs, subnets, and NSGs; do not create infrastructure.
- For BaseDB database inventory, list VM DB systems first, then DB homes and databases; list PDBs, backups, and Data Guard only when requested.

## Server Surfaces

| Surface | Type | Use it for | Key rule |
| --- | --- | --- | --- |
| `run_oci_command` | Tool | Execute OCI commands | Pass text after `oci` only |
| `get_oci_command_help` | Tool | Inspect command syntax | Do not include `--help` |
| `resource://oci-api-commands` | Resource | Discover command families | Read it as a resource |

## Absolute Rules

1. Execute every OCI operation through `oci-api-mcp-server` only.
2. Never include `oci`, `--profile`, or `--auth` in a command string.
3. Use `db system` for BaseDB VM DB-system operations.
4. Never substitute another OCI database service's command family for `db system`.
5. Resolve regional scope before any regional BaseDB command.
6. Follow the hierarchy top-down.
7. Use existing compartments and networking; never create compartments, VCNs, subnets, gateways, route tables, security lists, NSGs, or IAM policies.
8. Do not use `oci search` or Resource Search for BaseDB resolution.
9. When a DB-system OCID is known, use it directly for `db system get`; do not require compartment resolution first.
10. Always include `--db-system-id` when listing DB homes in a known VM DB system.
11. Always include `--db-home-id` when listing databases in a known DB home.
12. Scope PDB, backup, and Data Guard lists with the database OCID.
13. Use `--compartment-id-in-subtree true` only with `iam compartment list`, never a `db` command.
14. Never echo passwords, private keys, wallet secrets, TDE passwords, or session tokens.
15. Require RSA SSH public keys with at least 2048-bit strength. Never use ED25519 keys for BaseDB.

## MCP Server Contract

Profile and authentication are server-level settings, not tool-call options. Never add `--profile` or `--auth` to a command string, and do not run `oci session authenticate` through this path.

Pass commands exactly as the OCI CLI command text following `oci`. Examples:

```text
db system list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all
```

```text
db system get --db-system-id <DB_SYSTEM_OCID> --region <REGION>
```

Do not assume that local OCI CLI extensions, aliases, preprod endpoints, or profile settings are available through the MCP server. If the server cannot reach the intended tenancy or service endpoint, report that boundary instead of adding local flags.

## Compartment Operations

Compartment discovery is tenancy-global. This skill can list and resolve existing compartments, but does not create them.

Get tenancy context through the server's active session and list descendants with:

```text
iam compartment list --compartment-id <TENANCY_OCID> --compartment-id-in-subtree true --all
```

Resolution rules:

- If the user supplies a compartment OCID, use it directly.
- If the user says `root compartment`, use the tenancy OCID as `--compartment-id`.
- If the user supplies a name, match active compartments by exact name.
- If one match exists, use its OCID.
- If multiple matches exist, show names and OCIDs and ask which one to use.
- If no match exists, ask whether the user meant tenancy root.
- Never pass a profile name, tenancy name, or compartment name to `--compartment-id`.

## Resolution Order

1. Resolve tenancy root or target compartment.
2. Resolve the user-supplied region for regional work.
3. Resolve existing VCN, subnet, and optional NSGs when requested.
4. Resolve VM DB system, DB home, database/CDB, and PDB parents in order.
5. Get live command help before read-only command syntax that is uncertain.
6. Execute through `run_oci_command`.

## Service Defaulting Rules

Default generic OCI database, databases, DB-system, dbsystem, DB home, CDB, PDB, backup, and Data Guard requests to BaseDB.

Do not claim the request if it explicitly names another database service.

If a DB-system OCID starts with `ocid1.dbsystem`, treat it as a BaseDB candidate and confirm its resource details with `db system get`.

## Resource Hierarchy And Existing-vs-New Choices

```text
compartment
  -> VCN
    -> subnet
      -> VM DB system
        -> DB home
          -> database / CDB
            -> pluggable database / PDB
              -> backups and Data Guard associations
```

For every parent choice, accept an OCID, resolve an exact name, or list choices. Do not gather child inputs before the parent is resolved.

- The compartment owns the DB system and existing network resources.
- The VCN contains the selected subnet and optional NSGs.
- The VM DB system contains compute, storage, and the initial DB home/database.
- A DB home is an Oracle software home inside the DB system.
- A database/CDB belongs to a DB home.
- A PDB belongs to one CDB.
- Backups and Data Guard associations are resolved from the database.

## Scoping Rules

- `db system list` is compartment and region scoped.
- `db system get` needs only the DB-system OCID plus region when the server requires it.
- `db db-home list` must use the resolved DB-system OCID and the compartment argument required by live help.
- `db database list` must use the resolved DB-home OCID and the compartment argument required by live help.
- `db pluggable-database list`, `db backup list`, and `db data-guard-association list` must use the resolved database OCID.
- For resource-name resolution, filter within the resolved parent scope and region.
- Do not return a flat compartment-wide database list without DB-system and DB-home context.

## Region Handling

Ask for one region or `all regions` for every regional BaseDB workflow.

For `all regions`:

1. run `iam region-subscription list`
2. select subscribed regions
3. run the requested BaseDB operation once per region
4. label and consolidate results by region
5. continue other regions if one region fails unless the user asks to stop

Do not ask for a region for tenancy-global compartment discovery.

Common user-friendly mappings may be offered, but never selected silently:

- Ashburn → `us-ashburn-1`
- Phoenix → `us-phoenix-1`
- Frankfurt → `eu-frankfurt-1`
- London → `uk-london-1`
- Zurich → `eu-zurich-1`

## Resource Resolution Patterns

### VM DB System

List:

```text
db system list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all
```

Get:

```text
db system get --db-system-id <DB_SYSTEM_OCID> --region <REGION>
```

For a display name, list within the compartment and region and match the complete `display-name`. If multiple resources match, show their OCIDs and lifecycle states.

### VCN And Subnet

List existing VCNs:

```text
network vcn list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all
```

List existing subnets in a selected VCN:

```text
network subnet list --compartment-id <COMPARTMENT_OCID> --vcn-id <VCN_OCID> --region <REGION> --all
```

Validate that the selected subnet and optional NSGs belong to the selected VCN. Discovery only: do not create networking.

### DB Home

List DB homes only after resolving a DB system:

```text
db db-home list --compartment-id <COMPARTMENT_OCID> --db-system-id <DB_SYSTEM_OCID> --region <REGION> --all
```

Use `db db-home get --db-home-id <DB_HOME_OCID>` for exact state when supported by live help.

### Database

List databases only after resolving a DB home:

```text
db database list --compartment-id <COMPARTMENT_OCID> --db-home-id <DB_HOME_OCID> --region <REGION> --all
```

Get a database by its OCID when supported by live help.

### Pluggable Database

List PDBs only under a resolved database:

```text
db pluggable-database list --database-id <DATABASE_OCID> --region <REGION> --all
```


### Backup

List backups under a resolved database:

```text
db backup list --database-id <DATABASE_OCID> --region <REGION> --all
```


### Data Guard Association

List associations under a resolved database:

```text
db data-guard-association list --database-id <DATABASE_OCID> --region <REGION> --all
```


## List And Read Operations Usually Need Scope

For BaseDB inventory:

1. resolve compartment and region
2. list VM DB systems
3. list DB homes for each selected DB system
4. list databases for each selected DB home
5. list PDBs, backups, or Data Guard associations only when requested

Recommended DB-system inventory:

```json
{"command":"db system list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all --query \"data[*].{Name:\\\"display-name\\\",ID:id,State:\\\"lifecycle-state\\\",Shape:shape,AD:\\\"availability-domain\\\",Version:version}\" --output table"}
```

For a known DB-system OCID, skip compartment discovery and get it directly.

Read-only list/get operations do not require a mutation confirmation.

## List And Read Workflows

### List VM DB Systems

Resolve compartment and region first; accept one region or `all regions`.

```json
{"command":"db system list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"display-name\\\",State:\\\"lifecycle-state\\\",Shape:shape,AD:\\\"availability-domain\\\",Nodes:\\\"node-count\\\",Version:version}\" --output table"}
```

For `all regions`, list subscribed regions first and label each result.

### List DB Homes

Resolve the VM DB system first:

```json
{"command":"db db-home list --compartment-id <COMPARTMENT_OCID> --db-system-id <DB_SYSTEM_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"display-name\\\",State:\\\"lifecycle-state\\\",Version:\\\"db-version\\\"}\" --output table"}
```

Do not use scoping flags from another database service.

### List Databases

Resolve a DB system, then a DB home. List with the DB-home scope:

```json
{"command":"db database list --compartment-id <COMPARTMENT_OCID> --db-home-id <DB_HOME_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"db-name\\\",DisplayName:\\\"display-name\\\",State:\\\"lifecycle-state\\\",DbHomeId:\\\"db-home-id\\\"}\" --output table"}
```

Preserve DB-system and DB-home context in the returned inventory.

### List Pluggable Databases

Resolve the parent database/CDB, then:

```json
{"command":"db pluggable-database list --database-id <DATABASE_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"pdb-name\\\",OpenMode:\\\"open-mode\\\",State:\\\"lifecycle-state\\\"}\" --output table"}
```

### List Backups And Data Guard Associations

Resolve the parent database, then use the `db backup list` or `db data-guard-association list` command shown above. Do not modify the returned resources.

## Error Handling

- **Unexpected argument or missing parameter:** call `get_oci_command_help` for the exact command group, rebuild the command, and retry once.
- **Unauthorized or expired server session:** report that the MCP server session is not authenticated or authorized for the selected tenancy; do not add `--auth` or `--profile`.
- **Forbidden:** report the failed operation, resource, compartment, and region as an IAM or server-policy issue.
- **Not found:** re-resolve the resource, region, and parent chain before retrying.
- **Ambiguous name:** show matching OCIDs and ask the user to select one.
- **Region/service unavailable:** report the failing region and continue remaining requested regions unless asked to stop.
- **MCP server denies a command:** report that server policy does not match the skill and stop; do not fall back to shell.

## Common Pitfalls

- Confusing BaseDB `db system` with another service's command groups.
- Routing a generic DB-system request to another service when none is named.
- Using bare metal or another service's CLI recipes for a VM DB system.
- Listing DB homes without a DB-system parent.
- Listing databases without a DB-home parent.
- Listing PDBs, backups, or Data Guard associations without a database parent.
- Creating compartments or networking as an implicit prerequisite.
- Inventing an availability domain, subnet, shape, database version, or OCID.
- Silently defaulting the region.
- Polling by default.
- Passing `oci`, `--profile`, `--auth`, or `--help` in MCP tool input.
- Echoing passwords or secret material.
- Falling back to local OCI CLI after an MCP denial.

## Correct And Incorrect Tool Calls

Correct:

```json
{"tool":"get_oci_command_help","arguments":{"command":"db system list"}}
```

```json
{"tool":"run_oci_command","arguments":{"command":"db system list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all"}}
```

```json
{"tool":"run_oci_command","arguments":{"command":"db db-home list --compartment-id <COMPARTMENT_OCID> --db-system-id <DB_SYSTEM_OCID> --region <REGION> --all"}}
```

```json
{"tool":"run_oci_command","arguments":{"command":"db database list --compartment-id <COMPARTMENT_OCID> --db-home-id <DB_HOME_OCID> --region <REGION> --all"}}
```

Incorrect:

```json
{"tool":"run_oci_command","arguments":{"command":"oci db system list --profile DEFAULT --compartment-id <COMPARTMENT_OCID>"}}
```

This incorrectly includes the executable and per-call profile.

```json
{"tool":"get_oci_command_help","arguments":{"command":"db system list --help"}}
```

The help tool receives the command group without `--help`.

```json
{"tool":"run_oci_command","arguments":{"command":"db database list --compartment-id <COMPARTMENT_OCID> --region <REGION>"}}
```

This omits the DB-home scope anchor.

Any command family other than the BaseDB `db system` hierarchy is incorrect for this skill.

## Sources

- Oracle OCI CLI command reference: `oci db system`
- Oracle OCI CLI command reference: `oci db db-home`
- Oracle OCI CLI command reference: `oci db database`
- Oracle OCI CLI command reference: `oci db pluggable-database`
- Oracle OCI CLI command reference: `oci db backup`
- Oracle OCI CLI command reference: `oci db data-guard-association`
- Oracle Base Database Service documentation
