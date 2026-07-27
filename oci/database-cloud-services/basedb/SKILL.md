---
name: basedb
description: Manage Oracle Base Database Service virtual machine DB systems through Terraform generation or OCI execution with oracle/mcp oci-api-mcp-server. Use for BaseDB, Base Database Service, VM DB systems, dbsystems, ocid1.dbsystem OCIDs, DB homes, databases/CDBs, PDBs, backups, Data Guard, patches, upgrades, compartment moves, subscription changes, and termination. Also use for generic OCI database or DB-system requests unless the user explicitly names another database service.
---

# BaseDB

## Overview

`BaseDB` means Oracle Base Database Service on virtual machine DB systems throughout this skill.
This skill has two explicit paths:

- generate exactly three BaseDB Terraform files
- operate BaseDB directly through `oracle/mcp oci-api-mcp-server`

For every requested action, ask whether the user wants OCI MCP or Terraform before collecting resource inputs. Ask for list, show, get, inspect, inventory, create, update, patch, upgrade, move, Data Guard, delete, and terminate actions alike. If the user already selected the mode in the same request, treat that as the answer and do not ask again.

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
2. Decide the execution mode.
3. Read the matching reference.
4. Collect required parameters for that path.
5. Show a pre-flight summary for impactful actions.
6. Generate code or execute commands.

### Step 1: Identify the action

Common action families:

- list, show, get, inspect, inventory
- create, launch, restore, clone, add
- update, patch, upgrade, move, change subscription
- enable, switchover, failover, reinstate
- terminate, delete, remove
- generate `main.tf`, `variables.tf`, and `terraform.tfvars`

### Step 2: Decide the execution mode

- Before every action whose mode has not already been explicitly selected, ask exactly: `Do you want to use OCI MCP for this action, or Terraform?`
- Do not infer the mode from the action. This question applies to list, show, get, inspect, inventory, create, update, patch, upgrade, move, Data Guard, delete, and terminate requests.
- Select Terraform generation only after the user chooses Terraform.
- Select OCI MCP only after the user chooses OCI MCP.
- If the user asks this skill to run Terraform `init`, `fmt`, `validate`, `plan`, `apply`, `import`, or `destroy`, explain that the skill is generation-only and do not run the command.
- If the user chooses Terraform for an action that cannot be represented by the three creation files, explain the limitation and ask whether they want to switch to OCI MCP. Never switch modes without their answer.
- Never execute the Terraform binary or silently convert Terraform generation into OCI execution.

### Step 3: Read the correct reference

- Read [references/terraform.md](references/terraform.md) only for generating the three Terraform files.
- Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md) for direct OCI operations through MCP.
- Read both only for an explicit comparison, migration, or combined request.

### Step 4: Collect parameters in the correct order

Apply these collection rules:

- Never invent OCIDs, regions, availability domains, database versions, shapes, subnet IDs, NSG IDs, passwords, SSH keys, or display names.
- Never ask child-layer questions before the parent-layer decision is settled.
- Use existing compartments, VCNs, and subnets; this skill discovers but does not create them.
- Require RSA SSH public keys with at least 2048-bit strength. Do not use ED25519 keys for BaseDB.
- If the user chooses an existing resource, ask whether they have:
  - the specific OCID
  - the specific display name or resource name
  - or want the available resources listed first
- Collect every required DB-system input before generating Terraform or constructing a launch command.
- Never echo admin passwords, SSH private keys, API private keys, wallet secrets, TDE passwords, or session tokens back to the user.

### Step 5: Confirm impactful actions

For OCI MCP create, update, patch, upgrade, move, subscription change, Data Guard role change, delete, and terminate:

- show the resolved scope and planned action
- show the current target state when the resource already exists
- show material replacement, downtime, billing, storage, backup, and Data Guard implications
- require an explicit `yes` before execution
- do not poll or wait for completion unless the user explicitly asks

## Reference Map

### `references/terraform.md`

Read only for generating `main.tf`, `variables.tf`, and `terraform.tfvars` for VM DB-system creation with its initial DB home/database inline. It is the source of truth for Terraform inputs and HCL generation.

### `references/oci-api-mcp-server.md`

Read for direct MCP operations, compartment and network discovery, BaseDB inventory, launch variants, DB-system lifecycle mutations, DB homes, databases/CDBs, PDBs, backups, Data Guard, command help, and error handling. It is the source of truth for MCP-only execution.

## Required Behaviors

### When the user says "create database"

1. Default to BaseDB unless another database service is explicit.
2. Ask whether the user wants the three Terraform files or OCI MCP execution unless already explicit.
3. For Terraform, explain that a new VM DB system includes its initial DB home/database inline.
4. Read the matching reference and collect parent-to-child inputs.
5. Generate code or execute only after the appropriate confirmation.

### When the user says "make Terraform code"

Read [references/terraform.md](references/terraform.md), collect mandatory Terraform inputs, and generate only `main.tf`, `variables.tf`, and `terraform.tfvars`. Do not execute Terraform.

### When the user says "run the OCI CLI command using MCP server"

Read [references/oci-api-mcp-server.md](references/oci-api-mcp-server.md), collect runtime scope, and execute only through MCP. Do not offer Terraform unless asked.

## Scripts

This skill has no bundled executor and never runs Terraform commands.
