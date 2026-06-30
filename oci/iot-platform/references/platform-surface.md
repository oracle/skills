# OCI IoT Platform Surface

Use this reference to orient before choosing CLI, SDK, or optional MCP tools. It summarizes the public OCI IoT resource model and function families without assuming a specific tenancy.

## Resource Model

OCI IoT Platform work usually flows through these resources:

```text
Compartment
  -> IoT domain group
      -> IoT domain
          -> digital twin model
          -> digital twin adapter
          -> digital twin instance
          -> digital twin relationship
          -> work requests
          -> data retention and data access configuration
```

The data path is separate from control-plane management:

```text
device, gateway, or external application publish
  -> domain device host
  -> adapter endpoint and envelope mapping
  -> digital twin snapshot / historized data / rejected data
  -> optional Data API, ORDS, direct database, or APEX-facing views
```

Raw commands are a control-plane request that must be verified through a data-plane or device-side final-state signal.

Device connectivity is broader than the HTTPS template bundled with this skill. Oracle documents sending unstructured data over HTTPS, structured data over HTTPS, structured data over MQTTs, custom-format structured data over HTTPS, and receiving unstructured commands with MQTTs responses. Do not describe OCI IoT as a general-purpose MQTT broker; treat MQTTs as a documented device-connect path with its own auth, topic, and response semantics.

## Function Families

| Family | What It Controls | Typical Use | Verification |
| --- | --- | --- | --- |
| Domain groups | Shared grouping, data host, group-level data access | Bootstrap tenancy context and data-host short ID | Read domain group and derived data host |
| Domains | Device host, domain metadata, data retention, domain-level data access | Locate target IoT environment | Read domain, lifecycle state, device host, group ID |
| Models | DTDL model specs | Define twin shape, telemetry, properties, relationships | Read model and stored spec |
| Adapters | Inbound routes and payload envelope mapping | Map published payloads into twin content | Read adapter, route, model link, envelope |
| Instances | Digital twins for devices, gateways, logical assets, or indirect devices | Create or inspect a twin and its connectivity | Read instance, content, connectivity type, gateways |
| Relationships | Directed graph edges between twins | Model topology or containment | Filter by source, target, content path, lifecycle |
| Work requests | Async operation status, errors, logs | Diagnose create/update/delete failures | Read status, errors, logs, target resource state |
| Raw commands | Request/response dispatch through a twin | Send a command to a device integration | Verify response record, device evidence, or state change |
| Data API | Snapshot, raw, historized, rejected, and raw-command records | Troubleshoot current and historical ingest | Bounded query plus record-by-ID when needed |
| Data access config | ORDS, direct DB, APEX, VCN/identity access | Enable advanced data workflows | Read config and test narrow access path |

## CLI Command Families

The public OCI CLI exposes these IoT command groups:

- `digital-twin-adapter`: create, delete, get, list, update
- `digital-twin-instance`: create, delete, get, get-content, invoke raw binary/json/text command, list, update
- `digital-twin-model`: create, delete, get, get-spec, list, update
- `digital-twin-relationship`: create, delete, get, list, update
- `domain`: create, delete, get, list, update, change compartment, change data retention period, configure APEX/DIRECT/ORDS data access
- `domain-group`: create, delete, get, list, update, change compartment, configure data access
- `work-request`: get, list, list errors, list logs

For high-risk operations such as data-access configuration, compartment moves, deletes, raw commands, or retention changes, inspect command help first and ask for explicit approval before giving an executable mutation sequence.

## Connectivity Types

Digital twin instances may use:

- `DIRECT`: a directly connected device twin; usually needs an auth resource for publishing.
- `GATEWAY`: a gateway twin that can represent downstream device connectivity.
- `INDIRECT`: a downstream twin connected through one or more gateway twin OCIDs in `gateways`.
- `NONE`: a logical or non-connected twin.

Before diagnosing telemetry, inspect `connectivity_type`, `gateways`, adapter endpoint path, external key, and latest content metadata.

## Operation Posture

For every function family:

1. Read the current resource first.
2. Prefer lifecycle-state filters and `--limit` before complete inventory.
3. Check local CLI help or SDK docs when using newer fields.
4. Ask for explicit approval before create, update, delete, data-access config, compartment moves, raw commands, or publish validation.
5. Verify final state after the operation.

## Surface Selection

- Use OCI CLI for public, reproducible command sequences.
- Use Python SDK for programmatic pagination, typed fields, or structured reports.
- Use optional MCP only when it is already available and helps join context, resolve selectors, poll state, or summarize Data API evidence.
- Use direct Data API, ORDS, database, or APEX paths only when the user explicitly needs advanced data access.
