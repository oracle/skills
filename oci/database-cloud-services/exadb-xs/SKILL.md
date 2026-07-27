---
name: exadb-xs-tf-skills
description: Manage Oracle ExaDB-XS (Exadata Database Service on Exascale Infrastructure) through generation of exactly three Terraform files or OCI execution with oracle/mcp oci-api-mcp-server. Use when a user asks to list, inspect, create, update, scale, patch, move, or delete Exascale storage vaults, ExaDB VM clusters, DB homes, databases/CDBs, or PDBs, or wants Terraform files for those resources.
---

# ExaDB-XS

## Overview

`ExaDB-XS` means Exadata Database Service on Exascale Infrastructure throughout this skill.
This skill has two explicit paths:

- generate exactly three ExaDB-XS Terraform files
- operate ExaDB-XS directly through `oracle/mcp oci-api-mcp-server`

For every request that does not explicitly name Terraform or OCI MCP execution, ask which path the user wants before doing any work or collecting resource inputs.

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
2. Decide the execution mode.
3. Read the matching reference.
4. Collect required parameters for that path.
5. Show a pre-flight summary for impactful actions.
6. Generate code or execute commands.

### Step 1: Identify the action

Common action families:

- list, show, get, inspect, inventory
- create, provision, build, add
- update, patch, scale, move
- delete, remove
- generate Terraform files

### Step 2: Decide the execution mode

- If the user has not explicitly selected a mode, ask exactly: `Do you want Terraform code for this, or do you want me to run the OCI CLI command through the MCP server?`
- Ask this for list, show, get, inspect, inventory, create, update, patch, scale, move, and delete requests alike.
- Do not continue, collect inputs, or select a resource workflow until the user selects Terraform or OCI MCP.
- Select Terraform only when the user asks for Terraform/HCL or chooses Terraform.
- Select OCI MCP only when the user asks for OCI MCP/direct execution or chooses OCI MCP.
- Never silently convert Terraform into OCI execution or execute OCI commands for a Terraform-only request.

### Step 3: Read the correct reference

- Read [references/terraform.md](references/terraform.md) for Terraform file generation.
- Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md) for direct OCI operations through MCP.
- Read only the reference files needed for the selected path.

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

### `references/terraform.md`

Read for Terraform file generation and reuse of existing storage vaults, VM clusters, or DB homes. It is the source of truth for inputs, resource selection, and HCL generation.

### `references/oci-api-mcp-server.md`

Read for direct MCP operations, compartment resolution, ExaDB-XS inventory, mutations, command help, and error handling. It is the source of truth for MCP-only execution.

## Required Behaviors

### When the user says "create database"

1. Confirm it is ExaDB-XS; otherwise ask which OCI database service is intended.
2. Apply the execution-mode decision from the routing workflow before collecting inputs.
3. Read the matching reference and collect the required parent-to-child inputs.
4. Generate code or execute only after the appropriate confirmation.

### When the user says "make Terraform code"

Read [references/terraform.md](references/terraform.md), collect mandatory Terraform inputs, and create exactly `main.tf`, `variables.tf`, and `terraform.tfvars`. Do not offer OCI MCP instead.

### When the user says "run the OCI CLI command using MCP server"

Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md), collect runtime scope, and execute only through MCP. Do not offer Terraform unless asked.

## Terraform Boundary

For Terraform requests, create exactly these three files and no others:

- `main.tf`
- `variables.tf`
- `terraform.tfvars`

Never invoke Terraform or any Terraform subcommand, including `init`, `fmt`, `validate`, `plan`, or `apply`. Do not create Terraform state, lock files, plan files, key files, scripts, examples, or other auxiliary artifacts.
