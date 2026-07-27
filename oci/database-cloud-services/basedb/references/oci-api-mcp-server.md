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
- [Create Workflows](#create-workflows)
- [Impactful Operations](#impactful-operations)
- [Error Handling](#error-handling)
- [Common Pitfalls](#common-pitfalls)
- [Correct And Incorrect Tool Calls](#correct-and-incorrect-tool-calls)
- [Sources](#sources)

## Purpose

Read this file for direct BaseDB virtual machine DB-system list, get, launch, restore, update, patch, upgrade, move, subscription, terminate, DB home, database/CDB, PDB, backup, and Data Guard workflows through `oracle/mcp oci-api-mcp-server`.

Every OCI call must use this MCP server. Never run `oci ...` in a shell on this path.

Treat generic OCI database, databases, DB-system, dbsystem, DB home, CDB, PDB, backup, and Data Guard requests as BaseDB unless the user explicitly names another database service.

Before using this reference for any action, confirm that the user selected OCI MCP. If no mode was selected, ask whether they want OCI MCP or Terraform first.

## About oci-api-mcp-server

`oracle.oci-api-mcp-server` exposes OCI CLI access through MCP.

- Use `run_oci_command` to execute OCI command text.
- Use `get_oci_command_help` to inspect current syntax before fragile commands.
- Use `resource://oci-api-commands` for command-family discovery.
- Pass only text after `oci`; never send `oci`, `--profile`, or `--auth`.

Assume the active MCP server session already uses the intended OCI authentication context. Do not explain server startup, local session authentication, or profile selection unless the user asks about the MCP server itself.

## Workflow Highlights

- Ask the user to choose OCI MCP or Terraform before every action whose mode is not already explicit, including list and read actions.
- Default generic OCI database and DB-system requests to BaseDB unless another database service is named.
- Scope this reference to BaseDB virtual machine DB systems; reject bare metal and other service-specific command families.
- For list/read, resolve a direct OCID or compartment and region first.
- Ask for a compartment before launch unless it can be derived from a known parent.
- Ask for a region for regional workflows; never silently use a remembered region.
- For `all regions`, list subscribed regions and consolidate regional results.
- Resolve hierarchy top-down: compartment → VCN → subnet → VM DB system → DB home → CDB → PDB.
- Use existing compartments, VCNs, subnets, and NSGs; do not create infrastructure.
- For BaseDB database inventory, list VM DB systems first, then DB homes and databases; list PDBs, backups, and Data Guard only when requested.
- Require a pre-flight summary and explicit `yes` for launch, restore, update, patch apply, upgrade, move, subscription change, Data Guard role operations, and termination.
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
3. Use `db system` for BaseDB VM DB-system operations.
4. Never substitute another OCI database service's command family for `db system`.
5. Resolve names to OCIDs before mutation.
6. Resolve regional scope before any regional BaseDB command.
7. Follow the hierarchy top-down.
8. Use existing compartments and networking; never create compartments, VCNs, subnets, gateways, route tables, security lists, NSGs, or IAM policies.
9. Require an explicit `yes` for impactful actions.
10. Do not use `oci search` or Resource Search for BaseDB resolution.
11. When a DB-system OCID is known, use it directly for `db system get`; do not require compartment resolution first.
12. Always include `--db-system-id` when listing DB homes in a known VM DB system.
13. Always include `--db-home-id` when listing databases in a known DB home.
14. Scope PDB, backup, and Data Guard lists with the database OCID.
15. Use `--compartment-id-in-subtree true` only with `iam compartment list`, never a `db` command.
16. If a mutation is denied by MCP server policy, report the policy mismatch and stop; never fall back to direct shell execution.
17. Call `get_oci_command_help` before launch, restore, update, patch, upgrade, move, subscription, Data Guard, or termination commands whose flags are uncertain.
18. Never echo passwords, private keys, wallet secrets, TDE passwords, or session tokens.
19. Never use implicit wait flags or repeated polling unless the user asks to monitor.
20. Require RSA SSH public keys with at least 2048-bit strength. Never use ED25519 keys for BaseDB.
21. Never execute an MCP command until the user has selected OCI MCP for the requested action.

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
3. Resolve availability domain for launch workflows.
4. Resolve existing VCN, subnet, and optional NSGs.
5. Resolve VM DB system, DB home, database/CDB, and PDB parents in order.
6. Get live command help before fragile syntax.
7. Show pre-flight for impactful actions.
8. Execute through `run_oci_command`.
9. Stop after the initial response unless monitoring was requested.

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
- The subnet is required for DB-system launch.
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

Get a database by its OCID and inspect command help before create, update, patch, upgrade, move, or delete.

### Pluggable Database

List PDBs only under a resolved database:

```text
db pluggable-database list --database-id <DATABASE_OCID> --region <REGION> --all
```

Get help before create, clone, relocate, update, start, stop, or delete.

### Backup

List backups under a resolved database:

```text
db backup list --database-id <DATABASE_OCID> --region <REGION> --all
```

Use current help to resolve on-demand backup creation, get, delete, and restore syntax.

### Data Guard Association

List associations under a resolved database:

```text
db data-guard-association list --database-id <DATABASE_OCID> --region <REGION> --all
```

Always get live help before enable, failover, switchover, reinstate, or role-conversion operations.

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

Read-only list/get operations still require the OCI MCP-or-Terraform mode choice, but do not require a separate mutation confirmation after OCI MCP is selected.

## Create Workflows

### Launch VM DB System

#### Step 1: Resolve Compartment And Region

Collect or resolve:

- target compartment OCID
- target region
- availability domain

Resolve availability domains with:

```text
iam availability-domain list --compartment-id <TENANCY_OCID>
```

Never invent an availability-domain name.

#### Step 2: Resolve Existing Network

Ask whether the user has a subnet OCID, exact subnet name, or wants VCNs/subnets listed.

1. Resolve an existing VCN.
2. Resolve an existing subnet within that VCN.
3. Resolve optional existing NSGs.
4. Validate VCN membership and region.

Do not create any network resource.

#### Step 3: Resolve Shape And Database Version

Use live help and supported discovery commands:

```text
db system-shape list --compartment-id <COMPARTMENT_OCID> --availability-domain <AD_NAME> --region <REGION>
```

```text
db version list --compartment-id <COMPARTMENT_OCID> --db-system-shape <SHAPE> --region <REGION>
```

Show supported BaseDB results and let the user choose. Do not reuse shapes or images from another service.

#### Step 4: Collect Required Parameters

Call `get_oci_command_help("db system launch")` before constructing the command.

At minimum confirm:

- compartment OCID
- region and availability domain
- subnet OCID
- VM shape
- hostname and display name
- database edition and version
- initial database name
- admin password without echoing it
- SSH authorized keys file or supported key input containing RSA-2048-or-stronger public keys
- node count
- compute model/count
- initial storage and performance
- license model
- optional PDB, NSGs, backups, maintenance, time zone, encryption, and tags

Use generated JSON input for complex nested arguments if supported by the MCP server command surface. Never invent JSON shapes.

#### Step 5: Pre-flight Summary And Launch

Show:

- resolved compartment, region, and availability domain
- VCN, subnet, and NSGs
- shape, node count, and compute sizing
- storage and license settings
- DB-system display name and hostname
- database edition, version, CDB name, and optional PDB name
- backup/encryption selections
- expected billing and availability impact

Require explicit `yes`, then run `db system launch`. Do not poll for `AVAILABLE` unless asked.

### Launch From Backup

Resolve and inspect the source backup first:

```text
db backup get --backup-id <BACKUP_OCID> --region <REGION>
```

Then:

1. call `get_oci_command_help("db system launch-from-backup")`
2. resolve target compartment, region, AD, VCN, subnet, shape, keys, storage, and license settings
3. confirm source backup OCID and source database metadata
4. collect any required admin or TDE password securely
5. show pre-flight and require `yes`
6. execute once and stop unless monitoring was requested

### Launch From Database

Resolve and inspect the source database first. Then:

1. call `get_oci_command_help("db system launch-from-database")`
2. generate or inspect the required DB-home JSON schema through command help
3. resolve target compartment, region, AD, subnet, shape, hostname, storage, and SSH keys
4. show source-to-target mapping
5. require `yes`
6. execute once without implicit polling

### Launch From DB System

Use this only when the user explicitly requests a launch from another DB system.

1. get both source DB-system state and current command help
2. resolve every target prerequisite
3. use the command's generated JSON schema for complex details
4. show source and target OCIDs, region, network, shape, storage, DB-home/database settings, downtime, and billing impact
5. require `yes`
6. execute once and stop unless asked to monitor

### List VM DB Systems

Resolve compartment and region first; accept one region or `all regions`.

```json
{"command":"db system list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"display-name\\\",State:\\\"lifecycle-state\\\",Shape:shape,AD:\\\"availability-domain\\\",Nodes:\\\"node-count\\\",Version:version}\" --output table"}
```

For `all regions`, list subscribed regions first and label each result.

### Update VM DB System

1. Resolve the target by OCID, exact name, or list.
2. Show current state with `db system get`.
3. Call `get_oci_command_help("db system update")`.
4. Collect only requested supported changes.
5. Use dry-run or precheck capability when current help exposes it.
6. Reject storage decreases.
7. Explain replacement, downtime, or billing risk.
8. Require `yes`.
9. Execute and stop unless monitoring was requested.

### Patch VM DB System

1. Resolve the DB system and patch ID.
2. Show current state and available/applicable patch details.
3. Call `get_oci_command_help("db system patch")`.
4. Run `PRECHECK` before `APPLY` unless the user supplies evidence of a current successful precheck.
5. Report precheck response and stop unless the user explicitly asks to continue.
6. Before `APPLY`, show the patch ID and expected impact and require `yes`.
7. Do not poll after submission unless asked.

### Upgrade VM DB System

1. Resolve the DB system and target GI or OS version.
2. Show current state and current version.
3. Call `get_oci_command_help("db system upgrade")`.
4. Run the supported precheck before upgrade.
5. Require `yes` before `UPGRADE` or `ROLLBACK`.
6. Execute only the requested action.
7. Do not wait for completion unless asked.

### Change Compartment

1. Resolve the DB system and target compartment OCID.
2. Show current and target compartments.
3. Call `get_oci_command_help("db system change-compartment")`.
4. Explain policy and visibility implications.
5. Require `yes`.
6. Execute once and stop unless asked to monitor.

### Change Cloud DB System Subscription

1. Resolve the DB system and requested subscription.
2. Show current state and subscription-related fields.
3. Call `get_oci_command_help("db system change-cloud-db-system-subscription")`.
4. Explain billing and entitlement implications.
5. Require `yes`.
6. Execute once without implicit polling.

### Terminate VM DB System

1. Get the target DB system by OCID.
2. Show display name, OCID, lifecycle state, compartment, region, shape, database version, and available backup/retention settings.
3. Call `get_oci_command_help("db system terminate")`.
4. Explain deletion and data-retention implications.
5. Require explicit `yes`.
6. Use force only if current help requires it and confirmation already exists.
7. Execute once and do not poll unless asked.

### List DB Homes

Resolve the VM DB system first:

```json
{"command":"db db-home list --compartment-id <COMPARTMENT_OCID> --db-system-id <DB_SYSTEM_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"display-name\\\",State:\\\"lifecycle-state\\\",Version:\\\"db-version\\\"}\" --output table"}
```

Do not use scoping flags from another database service.

### Create Database

For a BaseDB VM DB system:

1. resolve the DB system and DB home
2. inspect `db database create` help
3. confirm that the live command supports the requested VM DB-system operation
4. collect database name, admin password, DB home or DB-system identifier, optional PDB, backup, encryption, and tags
5. show pre-flight and require `yes`
6. execute once without implicit polling

If the live command surface does not support an additional database for the selected VM configuration, report the limitation instead of substituting another service's workflow.

### List Databases

Resolve a DB system, then a DB home. List with the DB-home scope:

```json
{"command":"db database list --compartment-id <COMPARTMENT_OCID> --db-home-id <DB_HOME_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"db-name\\\",DisplayName:\\\"display-name\\\",State:\\\"lifecycle-state\\\",DbHomeId:\\\"db-home-id\\\"}\" --output table"}
```

Preserve DB-system and DB-home context in the returned inventory.

### Create Pluggable Database

1. Resolve the parent database/CDB.
2. Call `get_oci_command_help("db pluggable-database create")`.
3. Collect the container database ID, PDB name, PDB admin password, and any supported TDE/wallet password and tags.
4. Show pre-flight and require `yes`.
5. Execute once without implicit polling.

### List Pluggable Databases

Resolve the parent database/CDB, then:

```json
{"command":"db pluggable-database list --database-id <DATABASE_OCID> --region <REGION> --all --query \"data[*].{ID:id,Name:\\\"pdb-name\\\",OpenMode:\\\"open-mode\\\",State:\\\"lifecycle-state\\\"}\" --output table"}
```

### Backup Operations

For list/get, resolve the parent database and execute without confirmation.

For create, delete, or restore:

1. resolve database and backup OCIDs
2. inspect exact command help
3. show source, target, retention, replacement, and data-loss implications
4. require `yes`
5. execute once and stop unless monitoring was requested

Never delete a backup as an implied part of DB-system cleanup.

### Data Guard Operations

For list/get, resolve the parent database and association.

For enable, failover, switchover, reinstate, or role conversion:

1. get primary database and association state
2. get peer database state when available
3. inspect exact command help
4. show current and requested roles, regions/ADs, lag or health fields, expected downtime, and data-loss risk
5. require explicit `yes`
6. execute only the selected operation
7. do not poll unless asked

Never infer that failover and switchover are interchangeable.

## Impactful Operations

Before any mutation, show:

- action and exact command family
- target display name and OCID
- compartment and region
- current lifecycle state
- requested changes
- replacement, downtime, billing, storage, backup, and Data Guard implications

Require the user to reply `yes`. Return the initial response and work-request OCID if present. Do not wait or poll unless requested.

Read-only list/get operations need the OCI MCP-or-Terraform mode choice, but do not need a separate mutation confirmation after OCI MCP is selected.

## Error Handling

- **Unexpected argument or missing parameter:** call `get_oci_command_help` for the exact command group, rebuild the command, and retry once.
- **Unauthorized or expired server session:** report that the MCP server session is not authenticated or authorized for the selected tenancy; do not add `--auth` or `--profile`.
- **Forbidden:** report the failed operation, resource, compartment, and region as an IAM or server-policy issue.
- **Not found:** re-resolve the resource, region, and parent chain before retrying.
- **Ambiguous name:** show matching OCIDs and ask the user to select one.
- **Region/service unavailable:** report the failing region and continue remaining requested regions unless asked to stop.
- **MCP server denies a command:** report that server policy does not match the skill and stop; do not fall back to shell.
- **Complex JSON rejected:** regenerate the parameter or full-command JSON schema from current help; never guess the shape.
- **Long-running operation:** return the work request or initial resource state and stop unless monitoring was requested.

## Common Pitfalls

- Confusing BaseDB `db system` with another service's command groups.
- Routing a generic DB-system request to another service when none is named.
- Using bare metal or another service's Terraform/CLI recipes for a VM DB system.
- Listing DB homes without a DB-system parent.
- Listing databases without a DB-home parent.
- Listing PDBs, backups, or Data Guard associations without a database parent.
- Creating compartments or networking as an implicit prerequisite.
- Inventing an availability domain, subnet, shape, database version, or OCID.
- Silently defaulting the region.
- Polling by default.
- Passing `oci`, `--profile`, `--auth`, or `--help` in MCP tool input.
- Echoing passwords or secret material.
- Running patch apply or upgrade before a successful precheck.
- Treating Data Guard failover and switchover as equivalent.
- Falling back to local OCI CLI after an MCP denial.

## Correct And Incorrect Tool Calls

Correct:

```json
{"tool":"get_oci_command_help","arguments":{"command":"db system launch"}}
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
{"tool":"get_oci_command_help","arguments":{"command":"db system launch --help"}}
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
- Oracle OCI Terraform provider resource: `oci_database_db_system`
