---
name: basedb
description: Manage Oracle Base Database Service virtual machine DB systems through oracle/mcp oci-api-mcp-server. Use for BaseDB, Base Database Service, VM DB systems, dbsystems, ocid1.dbsystem OCIDs, DB homes, databases/CDBs, PDBs, backups, Data Guard, patches, upgrades, compartment moves, subscription changes, and termination. Also use for generic OCI database or DB-system requests unless the user explicitly names another database service.
---

# BaseDB

## Overview

`BaseDB` means Oracle Base Database Service on virtual machine DB systems throughout this skill.
Execute every BaseDB operation directly through `oracle/mcp oci-api-mcp-server`.

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

Never skip a required parent decision. Resolve parents from the top down for every create, update, patch, upgrade, move, Data Guard, or delete workflow.

## Routing Workflow

1. Identify the resource family and action.
2. Read the MCP reference.
3. Collect required parameters.
4. Show a pre-flight summary for impactful actions.
5. Execute through MCP.

### Step 1: Identify the action

Common action families:

- list, show, get, inspect, inventory
- create, launch, restore, clone, add
- update, patch, upgrade, move, change subscription
- enable, switchover, failover, reinstate
- terminate, delete, remove

### Step 2: Read the MCP reference

Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md) for every direct BaseDB operation, compartment and network discovery, inventory, lifecycle mutation, DB home, database/CDB, PDB, backup, and Data Guard request.

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
- Collect every required DB-system input before constructing a launch command.
- Never echo admin passwords, SSH private keys, API private keys, wallet secrets, TDE passwords, or session tokens back to the user.

### Step 4: Confirm impactful actions

For OCI MCP create, update, patch, upgrade, move, subscription change, Data Guard role change, delete, and terminate:

- show the resolved scope and planned action
- show the current target state when the resource already exists
- show material replacement, downtime, billing, storage, backup, and Data Guard implications
- require an explicit `yes` before execution
- do not poll or wait for completion unless the user explicitly asks

## Reference Map

### `references/oci-api-mcp-server.md`

Read for direct MCP operations, compartment and network discovery, BaseDB inventory, launch variants, DB-system lifecycle mutations, DB homes, databases/CDBs, PDBs, backups, Data Guard, command help, and error handling. It is the source of truth for MCP-only execution.

## Required Behaviors

### When the user says "create database"

1. Default to BaseDB unless another database service is explicit.
2. Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md) and collect parent-to-child inputs.
3. Execute only after the appropriate confirmation.

### When the user says "run the OCI CLI command using MCP server"

Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md), collect runtime scope, and execute only through MCP.
