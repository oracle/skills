# OCI IoT Operator Resilience Guidance

Use this reference when an OCI IoT task involves troubleshooting, large fleets, gateway topology, raw commands, publish failures, cleanup, or uncertainty about CLI, SDK, or MCP behavior.

## Default Operator Posture

- Read before changing. Capture current resource state before create, update, delete, publish, or command operations.
- Prefer `ACTIVE` resources unless the user is explicitly auditing deleted or historical resources.
- Bound list operations. Use `--limit`, targeted filters, and follow-up pages before using `--all` in a large domain.
- Verify every mutation with a fresh read. For asynchronous operations, also inspect the work request.
- Keep public examples tenant-neutral. Do not introduce internal profiles, private network access patterns, schemas, or private tooling.

## CLI, SDK, And MCP Routing

Use the OCI CLI as the default public path because it is broadly available and maps cleanly to Oracle documentation.

Before using recently added flags or when CLI docs, SDK docs, and local behavior differ, verify the local command shape:

```bash
oci iot digital-twin-instance list --help
oci iot digital-twin-instance create --help
oci iot digital-twin-relationship list --help
oci iot digital-twin-instance invoke-raw-json-command --help
```

Use the Python SDK when the task needs repeatable structured pagination, programmatic reporting, or fields that are exposed in the SDK before examples appear in CLI docs.

MCP is optional. Use an OCI IoT MCP server only when it is already available in the user's environment. Treat MCP output as an operator convenience, not as a release requirement. Useful MCP-style patterns to preserve in responses are structured errors, retry hints, bounded pagination, selector ambiguity checks, friendly domain/twin resolution, gateway-topology summaries, Data API current-state summaries, and explicit final-state validation. See [mcp-optional-use.md](mcp-optional-use.md) for the optional tool families and fallback rules.

## Bounded Pagination

For first-pass discovery, avoid unbounded domain-wide reads:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance list \
  --iot-domain-id <iot_domain_ocid> \
  --lifecycle-state ACTIVE \
  --limit 100 \
  --output json
```

If a response includes a next page token, continue only while the next token is new and the page is useful. Stop and report the condition if a page is empty but returns another token, or if the same next token repeats.

For operator summaries, use targeted filters first:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance list \
  --iot-domain-id <iot_domain_ocid> \
  --digital-twin-model-id <digital_twin_model_ocid> \
  --connectivity-type DIRECT \
  --lifecycle-state ACTIVE \
  --limit 100 \
  --output json
```

Use `--all` only after confirming the domain is small enough or the user explicitly needs complete inventory.

## Latest Twin Content

Always request metadata when checking current state:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance get-content \
  --digital-twin-instance-id <digital_twin_instance_ocid> \
  --should-include-metadata true \
  --output json
```

Treat `timeLastHeard`, adapter timestamps, and content timestamps as evidence, not assumptions. In exported JSON, metadata may appear at `data._metadata` or under the returned content object. If the response is effectively etag-only or lacks content, say that there is no current-state evidence yet and verify publish, adapter mapping, and rejected data instead of claiming the twin is healthy.

## Gateway-Aware Twins

Digital twin instances can be direct devices, gateways, indirect devices, or non-connected logical twins. Check the topology before diagnosing telemetry:

When creating a digital twin instance, do not assume `INDIRECT` connectivity. If the request is for a normal publishing device and no gateway routing is mentioned, use or recommend `DIRECT` and explain the required auth resource. Use `INDIRECT` only when the user explicitly asks for a downstream/gateway-routed device or provides a gateway routing requirement.

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance list \
  --iot-domain-id <iot_domain_ocid> \
  --connectivity-type GATEWAY \
  --lifecycle-state ACTIVE \
  --limit 100 \
  --output json
```

For indirect devices, inspect the instance and confirm the `gateways` field:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance get \
  --digital-twin-instance-id <indirect_twin_ocid> \
  --output json
```

When creating an indirect twin, pass a gateway list only after confirming the gateway twin is `ACTIVE` and has `connectivityType` of `GATEWAY`:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance create \
  --iot-domain-id <iot_domain_ocid> \
  --connectivity-type INDIRECT \
  --gateways '["<gateway_twin_ocid>"]' \
  --digital-twin-model-id <digital_twin_model_ocid> \
  --digital-twin-adapter-id <digital_twin_adapter_ocid> \
  --display-name "<display_name>" \
  --external-key "<external_key>" \
  --wait-for-state ACTIVE
```

If a gateway publishes on behalf of downstream devices, verify adapter endpoint paths, external keys, and timestamp mapping before assuming a platform issue.

When an optional MCP server is available, prefer gateway-aware context helpers for topology diagnosis because they can combine the twin, domain, domain group, adapter, model, gateway references, and bounded indirect-child discovery in one structured payload. Still verify critical results with direct reads before mutation.

## Relationship Direction

Relationship direction matters. Before creating or troubleshooting a relationship:

- confirm the source model defines the `contentPath` or relationship property being used
- confirm both source and target twins are `ACTIVE`
- filter by source, target, and content path instead of reading all relationships

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-relationship list \
  --iot-domain-id <iot_domain_ocid> \
  --source-digital-twin-instance-id <source_twin_ocid> \
  --target-digital-twin-instance-id <target_twin_ocid> \
  --content-path <relationship_name> \
  --lifecycle-state ACTIVE \
  --limit 100 \
  --output json
```

If a relationship appears missing, check the reverse direction before creating a duplicate.

## Work Requests

After create, update, or delete operations, capture the work request ID when the CLI returns one. For failures or slow state transitions, inspect status, errors, and logs:

```bash
oci iot --profile <oci_profile> --region <oci_region> work-request get \
  --work-request-id <work_request_ocid> \
  --output json
```

```bash
oci iot --profile <oci_profile> --region <oci_region> work-request list-errors \
  --work-request-id <work_request_ocid> \
  --limit 100 \
  --output json
```

```bash
oci iot --profile <oci_profile> --region <oci_region> work-request list-logs \
  --work-request-id <work_request_ocid> \
  --limit 100 \
  --output json
```

Do not treat a queued or accepted work request as a completed operation. Verify the target resource state afterward.

## Publish Failure Triage

After a publish attempt, verify the latest content first. If content did not update:

- confirm the HTTPS endpoint path matches the adapter `inboundEnvelope.referenceEndpoint`
- confirm the payload content type matches the adapter expectation
- confirm the timestamp format and property names match the adapter mapping
- keep basic-auth and mTLS troubleshooting separate
- check rejected data through the advanced Data API or ORDS path when available
- check historized data only when the domain is configured to store it

A `404 Not Found` from the bare device host usually means the publish URL is missing the adapter endpoint path or the path does not match `inboundEnvelope.referenceEndpoint`. Add the reference endpoint path before changing auth or payload assumptions.

For basic validation, a fresh `digital-twin-instance get-content --should-include-metadata true` read is enough when it shows the published state. Data API or ORDS checks for rejected, snapshot, historized, or raw records are optional advanced evidence paths and may require separate credentials. For failures with only partial evidence, state exactly what was verified and what remains unknown. A successful HTTP response from a publishing client is not enough by itself; the twin content or rejected-data reason is the stronger verification point.

If MCP Data API helpers are available, use them to fetch recent rejected-data, snapshot, historized, and raw-command records for the target twin. Keep the query bounded and avoid logging bearer tokens.

## Raw Command Completion

For raw commands, a `202` response means the command was accepted for processing. It does not prove the device received the command or returned a response.

When a response is expected, include response endpoint and duration fields:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance invoke-raw-json-command \
  --digital-twin-instance-id <digital_twin_instance_ocid> \
  --request-endpoint <request_endpoint> \
  --request-duration PT30S \
  --response-endpoint <response_endpoint> \
  --response-duration PT30S \
  --request-data-content-type application/json \
  --request-data file://command-request.json
```

Verify the final state through the Data API, ORDS command records, device logs, or a fresh twin content read. If the command has no response path, say that the command can only be verified by downstream state or device-side evidence.

If an optional MCP server exposes a raw-command-and-wait helper, use it only after explicit approval to send the command. It should poll for terminal data-plane evidence; a `202` accepted response alone is not completion.

## Cleanup Ordering

For teardown or rollback:

1. List and delete active relationships for the target twins.
2. Delete digital twin instances.
3. Delete adapters only after no active instances use them.
4. Delete models only after no active adapters or instances depend on them.
5. Verify each resource reaches `DELETED` or no longer appears in active listings.

Never recommend broad deletion from a name match alone. Read the resource by OCID, confirm dependencies, and ask for explicit approval before destructive operations.
