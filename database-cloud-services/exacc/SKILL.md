---
name: exacc
description: Inspect Oracle Exadata Cloud@Customer (ExaCC) through the OCI API MCP server. Use for list, get, show, inspect, and inventory requests for Exadata Infrastructures, VM Cluster Networks, VM Clusters, DB Servers, unallocated resources, infrastructure target versions, and Grid Infrastructure versions. For any mutation or other non-read operation, explicitly state that the OCI API MCP server does not support the operation as of today.
---

# ExaCC

## Overview

Use this skill for Oracle Exadata Cloud@Customer (ExaCC) read operations through `oracle/mcp oci-api-mcp-server`. The skill supports permitted `list` and `get` operations only.

Keep the service boundary focused on ExaCC. Use these MCP command families:

```text
db exadata-infrastructure
db vm-cluster-network
db vm-cluster
db db-server
db exadata-infrastructure-un-allocated-resources
db infrastructure-target-version
db gi-version
```

Route ExaDB-XS resources (`exadb-vm-cluster`, `exascale-db-storage-vault`) and ExaCS public-cloud resources (`cloud-vm-cluster`, `cloud-exa-infra`) to their corresponding skills.

## Resource Hierarchy

```text
Exadata Infrastructure
  -> VM Cluster Network
    -> VM Cluster
      -> DB Servers
```

Treat DB homes, databases, and PDBs as adjacent Database Service work. Keep their ExaCC VM Cluster parent explicit when they are included in a request.

## Routing Workflow

1. Identify the ExaCC resource and requested operation.
2. Apply the operation gate before collecting inputs, checking command help, or calling MCP.
3. For a permitted operation, read [OCI API MCP server](references/oci-api-mcp-server.md), collect the required read scope, then read [validation](references/validation.md).
4. Call `get_oci_command_help` for the exact permitted command, then execute it only through the OCI API MCP server.

## Operation Gate

### Supported operations

Only `list` and `get` ExaCC commands are supported. Treat `show` and `inspect` as `get` when an OCID is supplied; otherwise, use an allowed `list` command to resolve the resource. Use allowed `list` commands for inventory.

### Unsupported operations

Create, provision, build, add, update, patch, scale, resize, activate, move, remove, delete, change-compartment, download, generate, validate, and every other non-read operation are unsupported. For any such request, stop immediately and tell the user exactly:

> The OCI API MCP server does not support this operation as of today.

If the requested operation is in the upstream denylist, also state that it is denied by the MCP server denylist. Do not collect mutation inputs, request confirmation, invoke command help, call the MCP server, suggest a server configuration change, run the OCI CLI directly, or suggest a workaround.

## Shared Operating Rules

- Resolve ExaCC parent resources from the top of the hierarchy to the requested child resource.
- Use `get_oci_command_help` to confirm current syntax, required flags, filters, and pagination for an exact permitted `list` or `get` command.
- Execute all OCI operations through the OCI API MCP server. Never run a raw `oci` command in a shell or include `oci`, `--profile`, or `--auth` in an MCP command string.
- Keep credentials, session tokens, API private keys, SSH private keys, and database passwords out of generated files, command echoes, and summaries.

## Reference Map

- [OCI API MCP server](references/oci-api-mcp-server.md) — permitted ExaCC MCP reads, command help, scope collection, and error handling.
- [Validation](references/validation.md) — scope and identity validation for permitted ExaCC reads.
