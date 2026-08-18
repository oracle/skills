---
name: exadb-d
description: Inspect Oracle ExaDB-D (Exadata Database Service on Dedicated Infrastructure, also known as ExaCS) through the OCI API MCP server. Use for list, get, show, inspect, and inventory requests for Cloud Exadata Infrastructure, Cloud VM Clusters, DB Homes, databases/CDBs, pluggable databases/PDBs, and ExaDB-D backups. For create, update, or any other ExaDB-D mutation request, explicitly state that the OCI API MCP server does not support the operation as of today.
---

# ExaDB-D

## Overview

`ExaDB-D` and `ExaCS` refer to the same OCI dedicated Exadata service throughout this skill. The `oracle/mcp oci-api-mcp-server` route is read-only for ExaDB-D: it supports permitted `list` and `get` operations only.

The upstream MCP server denylist is authoritative for blocked operations:

<https://github.com/oracle/mcp/blob/main/src/oci-api-mcp-server/oracle/oci_api_mcp_server/denylist>

## Service defaults

When this skill is active:

- Treat generic OCI database, database/CDB, PDB, DB Home, Cloud VM Cluster, VM Cluster, Cloud Exadata Infrastructure, and Exa infrastructure requests as ExaDB-D unless the user explicitly names another OCI database service.
- Treat `database` as the ExaDB-D CDB layer and `pluggable database` or `PDB` as a child of a specific ExaDB-D database/CDB.
- Keep this skill scoped to ExaDB-D resources only. Do not use it for identity, networking, DNS, or other non-ExaDB-D resources.
- Use only `db` command families verified as ExaDB-D. Never use ExaDB-XS (`db exadb-vm-cluster`), ExaCC, or another database-service command family.

## Operation gate

Before collecting inputs, checking command help, or calling the MCP server, classify the requested operation.

### Supported operations

- list, get, show, inspect, inventory

`show` and `inspect` mean `get` when an OCID is supplied; otherwise use a permitted `list` flow to resolve the resource.

### Unsupported operations

Create, provision, build, add, update, patch, scale, move, remove, delete, and every other ExaDB-D mutation are unsupported. For any such request, stop immediately and tell the user exactly:

> The OCI API MCP server does not support this operation as of today.

If the requested operation is in the upstream denylist, add that it is denied by the MCP server denylist. Do not collect mutation inputs, request confirmation, invoke command help, call the MCP server, offer server configuration changes, run the OCI CLI directly, or suggest a workaround.

## Read workflow

1. Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md).
2. Identify the target ExaDB-D resource and the permitted read operation.
3. Call `get_oci_command_help` for the exact `list` or `get` subcommand unless the user only asks for a conceptual explanation.
4. Collect the required scope from current help. Never invent OCIDs, names, regions, or parent resources.
5. Execute only the allowed command through the OCI API MCP server.
6. Report the returned information clearly, including regional grouping when relevant.

All OCI calls must go through the MCP server. Never run a raw `oci` command in a shell, and never send `oci`, `--profile`, or `--auth` in the MCP command string.

## Resource hierarchy

Use this hierarchy to resolve and inventory ExaDB-D resources:

```text
compartment
  -> cloud-exa-infra
    -> cloud-vm-cluster
      -> db-home
        -> database / CDB
          -> pluggable-database / PDB
```

For a supplied OCID, use the matching permitted `get` command. To resolve a name, list the matching resource type in its resolved scope, show all matches, and ask the user to select one. Never choose a resource on the user's behalf.

For a database inventory in a compartment, list Cloud VM Clusters first, then list databases for each selected cluster. For PDB inventory, resolve the database/CDB first, then list PDBs for each selected database.

## Scope rules

- Require an explicit region for regional requests; never default to the profile region.
- For `all regions`, require the user’s explicit region list or use an available region/identity skill. Do not use non-ExaDB-D discovery commands to find regions.
- Require the compartment OCID and parent OCID(s) shown as required by current command help for scoped list calls.
- If the user needs a non-ExaDB-D scope value resolved by name, hand off only to a matching dependency skill; otherwise request the concrete OCID.
- Do not use direct reads to imply that a future mutation is permitted or validated.

## Reference map

### `references/oci-api-mcp-server.md`

Read this file for the read-only MCP contract, denylist handling, command construction, hierarchy traversal, and list/get examples.

### `references/validation.md`

This reference applies only to validating the scope and identity of permitted ExaDB-D read requests. Do not use it for mutation planning or pre-flight checks, because mutations are not supported.
