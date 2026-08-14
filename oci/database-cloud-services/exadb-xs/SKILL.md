---
name: exadb-xs
description: Manage Oracle ExaDB-XS (Exadata Database Service on Exascale Infrastructure) exclusively through the oracle/mcp oci-api-mcp-server. Use when a user asks to list, inspect, create, update, scale, patch, move, or delete Exascale storage vaults, ExaDB VM clusters, DB homes, databases/CDBs, or PDBs.
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

Never skip a required parent decision. Resolve parents from the top down for every create, update, scale, patch, move, or delete workflow.

## Routing Workflow

1. Identify the resource family and action.
2. Read `references/oci-api-mcp-server.md`.
3. Collect the required parameters.
4. Show a pre-flight summary for impactful actions.
5. Execute the operation through the OCI API MCP server.

### Step 1: Identify the action

Common action families:

- list, show, get, inspect, inventory
- create, provision, build, add
- update, patch, scale, move
- delete, remove

### Step 2: Use OCI API MCP execution

- Execute every ExaDB-XS operation through `oracle/mcp oci-api-mcp-server` only.
- Do not run `oci ...` commands in a shell for this skill.
- If the user asks for Terraform or HCL, state that this skill supports only direct OCI API MCP operations; do not generate files or invoke Terraform.

### Step 3: Read the correct reference

- Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md) for direct OCI operations through MCP.

### Step 4: Collect parameters in the correct order

Apply these collection rules:

- Never invent OCIDs, region names, availability domains, Grid image IDs, DB versions, shapes, subnet IDs, NSG IDs, passwords, or display names.
- Never ask child-layer questions before the parent-layer decision is settled.
- For every parent choice, ask whether to use an existing resource or create a new one.
- If the user chooses an existing resource, ask whether they have:
  - the specific OCID
  - the specific display name or resource name
  - or want the available resources listed first
- If the user chooses a new resource, collect all required inputs for that layer before descending.
- Use RSA SSH keys; do not request or recommend Ed25519 keys.
- Never echo admin passwords, SSH private keys, API private keys, wallet secrets, or session tokens back to the user.

### Step 5: Confirm impactful actions

For create, update, patch, scale, move, and delete:

- show the resolved scope and planned action
- show whether each layer is existing or new
- require an explicit `yes` before execution
- do not poll or wait for completion unless the user explicitly asks

## Reference Map

### `references/oci-api-mcp-server.md`

Read for direct MCP operations, compartment resolution, ExaDB-XS inventory, mutations, command help, and error handling. It is the source of truth for MCP-only execution.

## Required Behaviors

### When the user says "create database"

1. Confirm it is ExaDB-XS; otherwise ask which OCI database service is intended.
2. Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md) and collect the required parent-to-child inputs.
3. Execute through OCI API MCP only after the appropriate confirmation.

### When the user says "make Terraform code"

State that this skill supports only direct OCI API MCP operations. Do not generate Terraform files, invoke Terraform, or read a Terraform reference.

### When the user says "run the OCI CLI command using MCP server"

Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md), collect runtime scope, and execute only through MCP.
