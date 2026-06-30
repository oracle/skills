# Optional OCI IoT MCP Use

Use this reference only when the user's environment already exposes an OCI IoT MCP server. The public skill must stay useful without MCP; do not make MCP installation, private server bootstrap, or private credentials part of the default workflow.

## When MCP Helps

Prefer the OCI CLI for public, repeatable command sequences. Use MCP as an optional accelerator when the task needs joined context or operator-friendly wrappers, such as:

- resolving an IoT domain or twin from friendly selectors
- inspecting how a twin maps to its domain, domain group, model, adapter, and gateway topology
- checking latest snapshot, historized, raw-command, and rejected-data records together
- passively validating whether a twin is reporting data
- waiting for a raw-command result or a snapshot update
- avoiding unbounded relationship traversal by using page-aware or bounded helpers
- checking gateway-aware fields before diagnosing indirect device telemetry

## Tool Families To Recognize

An OCI IoT MCP server may expose these categories. Names vary by implementation, so inspect the tool list in the active client instead of assuming every tool exists.

Control plane:

- IoT domain and domain group get/list/create/update/delete
- compartment moves
- data retention changes
- data access configuration
- work request get/list/log/error inspection
- digital twin model, adapter, instance, and relationship CRUD
- digital twin instance content reads
- raw-command invocation

Data plane:

- token or domain-context helpers for the IoT Data API
- raw data list/get
- snapshot data list
- historized data list/get
- rejected data list/get
- raw command data list/get

Agent-oriented wrappers:

- domain context derivation
- latest twin state
- platform context for a twin
- passive twin readiness validation
- recent raw command and rejected-data lookups for a twin
- raw command invocation plus wait
- wait for twin snapshot update

## Auth Mode Pinning

For customer environments that should use an API-key OCI profile, pin the MCP server auth environment instead of relying on auto-detection:

```bash
OCI_CONFIG_PROFILE=<customer_api_key_profile>
OCI_IOT_AUTH_TYPE=api_key
OCI_REGION=<oci_region>
```

If MCP calls fail with `401 NotAuthenticated`, first verify the selected profile, region, and auth type. In workstations with multiple OCI auth styles configured, automatic auth selection may choose a different or stale local auth path. Pinning `OCI_IOT_AUTH_TYPE=api_key` avoids that ambiguity for API-key profile tests. Use `OCI_IOT_AUTH_TYPE=security_token` only when the intended profile is a fresh security-token profile.

## Gateway-Aware Patterns

Gateway-aware MCP surfaces should preserve these instance fields:

- `connectivity_type`: `DIRECT`, `INDIRECT`, `GATEWAY`, or `NONE`
- `gateways`: gateway digital twin instance OCIDs for indirect twins
- `auth_id`, `external_key`, model IDs, adapter IDs, lifecycle state, and tags when available

Use these fields to reason about topology:

1. For an `INDIRECT` twin, resolve each gateway ID before diagnosing telemetry.
2. For a `GATEWAY` twin, use a bounded indirect-child lookup; do not assume one page contains every child.
3. For missing data, verify adapter endpoint paths, external keys, payload mapping, rejected-data records, and gateway topology before blaming the platform.
4. For relationship checks, filter by source, target, content path, and lifecycle state before broad listing.

## Safety Rules

- MCP tool calls run with the authority of the configured OCI profile or bearer token.
- Treat returned Data API bearer tokens as secrets.
- Prefer read-only MCP calls first.
- Ask for explicit approval before create, update, delete, data-access configuration, compartment moves, raw-command invocation, or publish-like actions.
- Treat asynchronous acceptance and raw-command `202` responses as incomplete until final state is verified.
- For basic publish validation, a digital twin instance content read with metadata is sufficient when it shows the updated state. MCP Data API or ORDS helpers are optional and may require separate `OCI_IOT_ORDS_*` credentials.
- If MCP output conflicts with CLI or SDK behavior, verify with a direct read and state the discrepancy.

## Response Pattern

When using MCP, tell the user:

1. Which MCP tool family was used.
2. Why MCP was useful compared with direct CLI.
3. What final-state evidence was verified.
4. Which direct CLI or SDK command would be the fallback if MCP is unavailable.
