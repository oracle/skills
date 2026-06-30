# OCI IoT CLI Workflows

Use this file for the public, CLI-first operator path. For large fleets, gateway topology, publish failures, raw commands, or cleanup, pair these commands with [resilience-guidance.md](resilience-guidance.md).

## Inputs To Gather

- `IOT_DOMAIN_ID`
- `OCI_CLI_PROFILE`
- `OCI_CLI_AUTH` when the profile requires a non-default auth mode, such as `security_token`
- `OCI_REGION` when the selected profile does not already target the domain's region
- resource identifiers already known by the user:
  - digital twin model ID
  - digital twin adapter ID
  - digital twin instance ID
  - digital twin relationship ID
  - work request ID

If only `IOT_DOMAIN_ID` is known, derive the rest first:

```bash
bash scripts/derive_domain_context.sh \
  --profile <oci_profile> \
  --auth <oci_cli_auth> \
  --region <oci_region> \
  --iot-domain-id <iot_domain_ocid>
```

Omit `--auth` only when the selected profile uses the CLI default auth mode. Omit `--region` only when the profile already selects the IoT domain's region. The helper needs a valid regional endpoint for its first domain read before it can derive the region from the returned device host. For security-token profiles, use `--auth security_token` and add the same global option to later OCI CLI commands.

## Command Capability Check

Check local CLI help before relying on newer filters or topology options:

```bash
oci iot digital-twin-instance list --help
oci iot digital-twin-instance create --help
oci iot digital-twin-relationship list --help
oci iot digital-twin-instance invoke-raw-json-command --help
```

If a documented CLI flag is missing locally, use the Python SDK or a narrower CLI fallback and call out the drift.

## Read-First Discovery

List the domain:

```bash
oci iot --profile <oci_profile> domain get \
  --iot-domain-id <iot_domain_ocid> \
  --output json
```

List domain groups only when the user needs tenancy discovery:

```bash
oci iot --profile <oci_profile> domain-group list --all
```

List active digital twin instances with a bounded first page:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance list \
  --iot-domain-id <iot_domain_ocid> \
  --lifecycle-state ACTIVE \
  --limit 100 \
  --output json
```

List active models:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-model list \
  --iot-domain-id <iot_domain_ocid> \
  --lifecycle-state ACTIVE \
  --limit 100 \
  --output json
```

List active adapters:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-adapter list \
  --iot-domain-id <iot_domain_ocid> \
  --lifecycle-state ACTIVE \
  --limit 100 \
  --output json
```

Use `--all` only after confirming the domain is small enough or the operator needs complete inventory.

## Full CLI Surface Awareness

For complete command-family coverage, see [platform-surface.md](platform-surface.md). The public CLI includes domain and domain-group lifecycle operations, data-retention changes, data-access configuration, work requests, all digital twin resource CRUD, digital twin content reads, and raw binary/json/text command invocation.

Use help before high-risk or less common operations:

```bash
oci iot domain change-data-retention-period --help
oci iot domain configure-apex-data-access --help
oci iot domain configure-direct-data-access --help
oci iot domain configure-ords-data-access --help
oci iot domain-group configure-data-access --help
oci iot digital-twin-instance invoke-raw-json-command --help
```

Do not provide an executable mutation for delete, compartment move, data-access configuration, retention changes, raw commands, or publish validation until the user approves that specific operation.

## Inspect Twin Content

Get instance metadata:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance get \
  --digital-twin-instance-id <digital_twin_instance_ocid> \
  --output json
```

Get latest content with metadata:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance get-content \
  --digital-twin-instance-id <digital_twin_instance_ocid> \
  --should-include-metadata true \
  --output json
```

Normalize exported JSON locally when helpful:

```bash
python3 scripts/twin_tools.py last-known \
  --input twin-content.json \
  --timestamp-key _metadata.timeLastHeard
```

If the content response has metadata but no current values, treat that as incomplete evidence and check publish/rejected-data paths before claiming the twin is healthy.

## Create A Model

Start from the neutral template:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-model create \
  --iot-domain-id <iot_domain_ocid> \
  --display-name "Temperature Sensor v1" \
  --spec file://templates/model.temperature-sensor.template.json \
  --wait-for-state ACTIVE
```

Verify both metadata and stored spec:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-model get \
  --digital-twin-model-id <digital_twin_model_ocid> \
  --output json
```

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-model get-spec \
  --digital-twin-model-id <digital_twin_model_ocid> \
  --output json
```

## Create An Adapter

Use the neutral adapter template and update endpoint, timestamp mapping, and payload fields first.

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-adapter create \
  --iot-domain-id <iot_domain_ocid> \
  --digital-twin-model-id <digital_twin_model_ocid> \
  --display-name "Temperature Adapter" \
  --from-json file://templates/adapter.default.template.json \
  --wait-for-state ACTIVE
```

Verify:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-adapter get \
  --digital-twin-adapter-id <digital_twin_adapter_ocid> \
  --output json
```

## Create A Publishing Twin Instance

Update the instance template with the model, adapter, external key, and auth identifier first. For `DIRECT` twins, use an auth identifier owned by the test or deployment being validated; do not borrow an existing certificate or secret for release validation.

Do not default to `INDIRECT` connectivity to avoid supplying `authId`. If the user simply asks for a device or publishing twin and does not mention gateway routing, treat `DIRECT` as the likely default and explain that direct twins require an auth resource such as a Vault secret or certificate. Only create an `INDIRECT` twin when the user explicitly asks for an indirectly connected, downstream, or gateway-routed device, or when they provide a gateway twin and state that the new twin should use it.

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance create \
  --iot-domain-id <iot_domain_ocid> \
  --connectivity-type DIRECT \
  --from-json file://templates/instance.template.json \
  --wait-for-state ACTIVE
```

Verify:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance get \
  --digital-twin-instance-id <digital_twin_instance_ocid> \
  --output json
```

## Gateway-Aware Instances

Gateway routing is an explicit topology choice, not a substitute for publishing-device auth setup. Before creating an indirect twin, confirm the user intends a downstream device and identify the gateway twin.

List active gateway twins:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance list \
  --iot-domain-id <iot_domain_ocid> \
  --connectivity-type GATEWAY \
  --lifecycle-state ACTIVE \
  --limit 100 \
  --output json
```

Create an indirect twin only after the gateway twin is active:

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

Verify the created instance and confirm `connectivityType` and `gateways`.

## Create A Relationship

Only create a relationship after confirming the source model defines the content path and both twins are active.

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-relationship create \
  --iot-domain-id <iot_domain_ocid> \
  --source-digital-twin-instance-id <source_twin_ocid> \
  --target-digital-twin-instance-id <target_twin_ocid> \
  --content-path <relationship_name>
```

Verify with source, target, and content-path filters:

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

If no relationship appears, check the reverse direction before creating another relationship.

## Work Request Inspection

Use work requests for asynchronous failures or long-running operations:

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

After inspecting the work request, read the target resource again. A queued or accepted operation is not final-state proof.

## Device Connectivity And Publish Testing

The bundled template covers HTTPS publish testing. Oracle also documents MQTTs device-connect paths for structured publish and command response workflows. When MQTTs is in scope, use the official device-connect documentation and samples for topic/auth details; do not adapt the HTTPS template by guessing MQTT behavior.

## Publish Test Telemetry Over HTTPS

Choose the auth mode first.

The HTTPS publish URL path must match the adapter `inboundEnvelope.referenceEndpoint`. For the bundled adapter template, `referenceEndpoint` is `/sampletopic`, so the publish URL is:

```text
https://<domain-short-id>.device.iot.<region>.oci.oraclecloud.com/sampletopic
```

Posting to the bare device host returns `404 Not Found`; that usually means the path is missing or does not match the adapter endpoint.

For vault-secret-backed basic auth, start from:

```bash
bash templates/publish-curl.template.sh
```

The template passes the Basic authorization header to curl over standard input so the device secret is not included in process arguments. It also uses `--fail-with-body`, so HTTP authentication and endpoint errors return a nonzero status while preserving the response body for diagnosis.

For certificate-based publishing, switch to an mTLS client flow instead of `curl -u`.

After publishing, verify the twin content again. For basic validation, `digital-twin-instance get-content` with metadata is enough to prove the publish updated the twin:

```bash
oci iot --profile <oci_profile> --region <oci_region> digital-twin-instance get-content \
  --digital-twin-instance-id <digital_twin_instance_ocid> \
  --should-include-metadata true \
  --output json
```

If content did not update, check adapter endpoint path, payload content type, timestamp mapping, and auth mode. Rejected-data, snapshot, historized, or ORDS/Data API checks are optional advanced evidence paths and require separate Data API or `OCI_IOT_ORDS_*` credentials.

## Invoke A Raw JSON Command

Raw-command acceptance is not the same as device completion. Include response fields when a response is expected:

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

Verify final state through command response records, device-side evidence, or a fresh twin read.

## Cleanup Ordering

For teardown, read dependencies first, then delete in this order:

1. relationships
2. digital twin instances
3. adapters with no active dependent instances
4. models with no active dependent adapters or instances

Ask for explicit approval before destructive operations, and verify each resource reaches `DELETED` or disappears from active listings.
