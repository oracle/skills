---
name: basedb
description: Inspect Oracle Base Database Service virtual machine DB systems through oracle/mcp oci-api-mcp-server. Use for BaseDB, Base Database Service, VM DB systems, dbsystems, ocid1.dbsystem OCIDs, DB homes, databases/CDBs, PDBs, backups, and Data Guard inventory. Also use for generic OCI database or DB-system inspection requests unless the user explicitly names another database service.
---

# BaseDB

## Overview

`BaseDB` means Oracle Base Database Service on virtual machine DB systems throughout this skill.
Use `oracle/mcp oci-api-mcp-server` for read-only BaseDB operations only.

## Temporary Mutation Denial

Before any MCP call, identify whether the request is read-only. Deny create, launch, restore, clone, add, update, patch, upgrade, move, subscription change, Data Guard role change, delete, and terminate requests because this MCP server does not currently support BaseDB mutations. Do not collect mutation inputs, call MCP command help, or execute an MCP command for a denied request.

## Service Defaults

When active, treat generic OCI database, database, DB-system, dbsystem, DB home, CDB, PDB, backup, and Data Guard requests as BaseDB unless the user explicitly names another database service.

Scope this skill to virtual machine DB systems. Do not use it for bare metal DB systems, another OCI database service, or host-local DBCLI administration.

## Resource Hierarchy

Follow this hierarchy strictly:

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

Never skip a required parent decision. Resolve parents from the top down for read-only workflows.

## Routing Workflow

1. Identify the resource family and action.
2. Read the MCP reference.
3. Collect required parameters.
4. Execute the read-only MCP command.

### Step 1: Identify the action

Common action families:

- list, show, get, inspect, inventory

### Step 2: Read the MCP reference

Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md) for read-only BaseDB operations, compartment and network discovery, inventory, DB home, database/CDB, PDB, backup, and Data Guard requests.

### Step 3: Collect parameters in the correct order

Apply these collection rules:

- Never invent OCIDs, regions, availability domains, database versions, shapes, subnet IDs, NSG IDs, passwords, SSH keys, or display names.
- Never ask child-layer questions before the parent-layer decision is settled.
- Use existing compartments, VCNs, and subnets; this skill discovers but does not create them.
- Require RSA SSH public keys with at least 2048-bit strength. Do not use ED25519 keys for BaseDB.
- If the user chooses an existing resource, ask whether they have:
  - the specific OCID
  - the specific display name or resource name
  - or want the available resources listed first
- Never echo admin passwords, SSH private keys, API private keys, wallet secrets, TDE passwords, or session tokens back to the user.

## Reference Map

### `references/oci-api-mcp-server.md`

Read for direct read-only MCP operations, compartment and network discovery, BaseDB inventory, DB homes, databases/CDBs, PDBs, backups, Data Guard, command help, and error handling.

## Required Behaviors

### When the user says "run the OCI CLI command using MCP server"

If the command is read-only, read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md), collect runtime scope, and execute only through MCP. Otherwise deny it before any MCP call.
