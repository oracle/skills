---
name: exadb-xs
description: Perform read-only Oracle ExaDB-XS (Exadata Database Service on Exascale Infrastructure) operations exclusively through the oracle/mcp oci-api-mcp-server. Use when a user asks to list, show, inspect, get, or inventory Exascale storage vaults, ExaDB VM clusters, DB homes, databases/CDBs, or PDBs.
---

# ExaDB-XS

## Overview

`ExaDB-XS` means Exadata Database Service on Exascale Infrastructure throughout this skill.
This skill has one execution path: operate ExaDB-XS directly through `oracle/mcp oci-api-mcp-server`.

For every ExaDB-XS request, use the OCI API MCP server. Terraform and HCL requests are outside this skill; do not generate Terraform files or invoke Terraform.

## Service Defaults

When active, treat explicit ExaDB-XS, Exascale storage vault, or ExaDB VM cluster requests as this service. Do not claim generic OCI database, DB home, CDB, or PDB requests: those need an explicit service name because they can belong to multiple OCI database services.

## Resource Hierarchy

Follow this hierarchy strictly:

```text
compartment
  -> Exascale DB storage vault
    -> ExaDB VM cluster
      -> DB home
        -> database / CDB
          -> pluggable database / PDB
```

For read-only workflows, resolve existing parents from the top down. Do not collect inputs for creating or changing resources.

## Routing Workflow

1. Identify the resource family and action.
2. Read `references/oci-api-mcp-server.md`.
3. Collect the required parameters.
4. Execute the read-only operation through the OCI API MCP server.

### Step 1: Identify the action

Common action families:

- list, show, get, inspect, inventory

### Denied mutation actions

This skill is read-only. Explicitly deny requests for `create`, `provision`, `build`, `add`, `update`, `patch`, `scale`, `move`, `change-compartment`, `delete`, `remove`, `upgrade`, `clone`, `start`, or `stop` operations.

For a denied request, respond that ExaDB-XS mutation operations are currently disabled and that this skill supports read-only OCI API MCP operations only. Do not read mutation instructions, collect mutation inputs, call `get_oci_command_help`, or call `run_oci_command` for the denied operation.

### Step 2: Use OCI API MCP execution

- Execute every ExaDB-XS operation through `oracle/mcp oci-api-mcp-server` only.
- Do not run `oci ...` commands in a shell for this skill.
- Apply the denied-mutation rule before reading the reference or collecting inputs.
- If the user asks for Terraform or HCL, state that this skill supports only direct OCI API MCP operations; do not generate files or invoke Terraform.

### Step 3: Read the correct reference

- Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md) for direct OCI operations through MCP.

### Step 4: Collect parameters in the correct order

Apply these collection rules:

- Never invent OCIDs, region names, availability domains, Grid image IDs, DB versions, shapes, subnet IDs, NSG IDs, passwords, or display names.
- Resolve existing resources by specific OCID, exact display name, or an inventory list.
- Never ask child-layer questions before the existing parent is resolved.
- Use RSA SSH keys; do not request or recommend Ed25519 keys.
- Never echo admin passwords, SSH private keys, API private keys, wallet secrets, or session tokens back to the user.

### Step 5: Execute read-only operations

- Execute only after the read-only scope is resolved.
- Do not request mutation confirmation because mutation operations are denied.
- Do not poll or wait for completion unless the user explicitly asks.

## Reference Map

### `references/oci-api-mcp-server.md`

Read for direct MCP operations, compartment resolution, ExaDB-XS inventory, command help, and error handling. It is the source of truth for read-only MCP execution.

## Required Behaviors

### When the user asks for a mutation

Explicitly deny the request because ExaDB-XS mutation operations are currently disabled. Do not collect inputs or call an MCP tool for the denied operation.

### When the user says "make Terraform code"

State that this skill supports only direct OCI API MCP operations. Do not generate Terraform files, invoke Terraform, or read a Terraform reference.

### When the user says "run the OCI CLI command using MCP server"

Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md), collect runtime scope, and execute only through MCP.
