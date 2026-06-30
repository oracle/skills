# OCI IoT Data Access

Use this file only when the user explicitly needs data-plane access beyond the default OCI CLI workflows.

## Scope

This reference covers advanced and optional paths:

- IoT Data API
- ORDS-backed queries
- direct database access
- APEX-oriented workspace access
- Oracle Database Tools connections
- Select AI through APEX or SQLcl
- Data Pump import/export and Object Storage archive workflows
- raw and normalized database queue streaming

These paths usually require separate authentication, networking, or tenancy setup beyond normal CLI usage.

Every path in this reference is advanced and optional. Require explicit opt-in from the operator and complete a path-specific auth, network, IAM, database, retention, and data-handling review before giving executable setup or mutation steps. Never guess connection strings, proxy users, credentials, endpoints, or policies.

## When To Use This Path

Use advanced data access when the user asks for one of these:

- historized values
- raw ingestion records
- rejected telemetry details
- command round-trip data
- APEX workspace changes
- migration, backup, archive, generated-SQL, or queue-streaming workflows

Do not default to this path for ordinary digital twin inspection.

## Prerequisite Checklist

Confirm which of these already exist:

- an IoT domain group and domain
- IAM policy allowing the requested access
- OAuth client details for the Data API path
- network path for database access, when direct DB access is required
- any required private network connectivity

If these prerequisites are missing, say so clearly before giving commands.

## Data API / ORDS Notes

- Treat the Data API and ORDS flows as separate from the control plane.
- Keep tokens, client secrets, and user passwords out of logs and shared transcripts.
- Prefer narrow, task-specific queries rather than broad dumps.
- Verify the user actually needs raw, rejected, or historized records before steering them here.
- Use the domain-group short ID and domain short ID to form the ORDS/Data API base path.
- Treat snapshot, raw, historized, rejected, and raw-command data as separate collections with different verification value.
- Keep list windows bounded by time, twin filter, limit, or another narrow query parameter.
- Fetch a record by ID when a list response omits payload details needed for diagnosis.

Typical Data API base URL shape:

```text
https://<domain_group_short_id>.data.iot.<region>.oci.oraclecloud.com/ords/<domain_short_id>/20250531
```

`20250531` is the current public IoT Data API version segment. Keep it between the domain short ID and the collection path.

Common collection paths:

- `/snapshotData` for latest normalized twin snapshots
- `/rawData` for accepted raw ingestion records
- `/historizedData` for historized records when retention is enabled
- `/rejectedData` for rejected ingest details
- `/rawCommandData` for raw-command request and response records

Optional MCP servers may provide wrappers for these collections, token minting, and latest-state summaries. Use them only when already available and still treat returned bearer tokens as secrets.

## Direct Database Access Notes

Direct database access is powerful but operationally heavier than the CLI path.

Typical prerequisites include:

- a reachable network path
- tenancy permissions
- token-based database access
- the correct schema context for the requested task

If the user only needs current twin state, prefer `digital-twin-instance get-content` instead.

## Oracle Database Tools

An Oracle Database Tools connection is an optional path to the IoT database after direct database access, private networking, IAM token authentication, and the documented IoT workspace proxy user are configured. Treat it as separately provisioned access, not an automatic Data API fallback. Read the current database-access configuration before proposing any connection change.

## Select AI

Select AI can translate natural-language IoT questions into SQL through APEX SQL Workshop or SQLcl after the documented database, provider, and IAM setup. Always review generated SQL, its target schema, and its data scope before execution. Do not present generated SQL as trusted merely because the prompt was natural language.

## Data Pump And Archive Workflows

Use Data Pump import/export as an advanced migration or backup path. For longer-term archive, Oracle documents exporting IoT domain data to Object Storage, including query-friendly formats such as Parquet and Data Pump format when BLOB content must be preserved. Verify archived objects and retention requirements before any separately approved source-data cleanup.

The official sample repository includes an `archive-domain` SQL/Python workflow. `archive-domain` is a sample workflow name, not an OCI resource, API operation, or CLI command; follow the official sample instead of inventing an archive helper.

## Database Queue Streaming

After direct database connectivity is configured, advanced consumers can subscribe to the public raw database queue (`RAW_DATA_IN`) or normalized database queue (`NORMALIZED_DATA`). Use the official Java/Python samples, account for the documented queue-retention window, and remove subscribers when they are no longer needed. Do not add a queue helper to this skill.

## Data Access Configuration

Treat data-access configuration as a mutation on the IoT domain or domain group. The public CLI includes separate domain commands for APEX, DIRECT, and ORDS access, plus domain-group data access configuration. These are not default troubleshooting steps.

Before suggesting them:

- identify whether the user needs APEX, ORDS/Data API, direct database, or VCN-scoped access
- read the existing domain or domain-group configuration
- inspect the relevant `oci iot domain ... --help` or `oci iot domain-group ... --help` output
- confirm the IAM, identity-domain, VCN, or workspace prerequisites
- ask for explicit approval before making the change

## APEX Notes

APEX-related work should be treated as separate from core digital twin operations.

Before suggesting workspace changes:

- confirm that the user actually needs APEX access
- separate workspace actions from IoT control-plane actions
- avoid implying APEX is part of the default public skill path

## Guidance For Responses

When using this reference:

1. State that the workflow is advanced or optional.
2. List the prerequisites that are assumed.
3. Give the smallest command set needed for the task.
4. Include a verification step.
5. Say whether a CLI/API fallback exists if an optional MCP helper was used.

## Sources

- Connecting to IoT data: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/connecting-to-data.htm`
- Database Tools scenario: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/query-iot-database-with-database-tools.htm`
- Select AI from APEX: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/select-ai-apex.htm`
- Data Pump and Object Storage archive: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/import-export-object-storage.htm`
- Normalized queue streaming: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/stream-normalized-queue.htm`
- Official SQL archive sample: `https://github.com/oracle-samples/oci-iot-samples/tree/main/samples/sql/archive-domain`
- Official Python archive sample: `https://github.com/oracle-samples/oci-iot-samples/tree/main/samples/python/archive-domain`
- Official Python queue samples: `https://github.com/oracle-samples/oci-iot-samples/tree/main/samples/python/queues`
- Official Java samples: `https://github.com/oracle-samples/oci-iot-samples/tree/main/samples/java`
