# OCI IoT Modeling Guidance

Use this file when the request involves digital twin model authoring, version changes, adapter payload mapping, or DTDL review.

## Principles

1. Start with the smallest model that supports the use case.
2. Keep payload shape and adapter mapping aligned.
3. Version the model when semantics change.
4. Prefer explicit names and units.
5. Treat local modeling preferences as examples, not platform rules.

## DTDL Basics

- Use DTDL v3 for model definitions.
- Give every interface a stable DTMI.
- Use descriptive `displayName` values, but avoid depending on them for logic.
- Keep schema choices simple unless the use case demands complexity.

OCI release guidance announces altitude support for point DTDL schemas. Confirm the current schema documentation and service capability before using altitude in a public executable example.

## Version Compatibility

An in-place instance upgrade candidate is a strictly additive next minor model version. It must preserve every existing name, type or schema class, meaning, unit, constraint, relationship, and command contract. Additive fields may be introduced, but existing behavior must remain compatible.

Field removal or rename, type or unit changes, narrowed constraints, relationship or command-contract changes, major-version changes, and downgrades are incompatible and require a new twin instance. Do not relabel an incompatible change as a minor release to keep an existing instance.

## Compatible Model Migration

Use a read-first, approval-gated sequence; do not turn these steps into executable mutations until the operator approves the specific change.

1. Read the current model, adapter, instance metadata, and twin content.
2. Create the compatible minor model version.
3. Create a new adapter that references the new model and preserves all existing mappings.
4. Retain the old adapter for rollback until validation is complete.
5. Update the instance to the new adapter.
6. Publish a representative payload through the documented device path.
7. Verify the instance metadata and run `get-content --should-include-metadata true` to confirm normalized content after the update.
8. If validation fails, roll back by updating the instance to the old adapter and verify the restored state.

## Telemetry Design

- Use consistent timestamp handling between the device payload and the adapter envelope.
- Add units for quantitative values when the model supports them.
- Keep field names stable once devices start publishing.
- Prefer one clear example model over a broad, overloaded sample.

## Adapter Design

- Keep the inbound envelope small and representative.
- Make the reference payload realistic enough to test mapping.
- Map only the fields the model actually exposes.
- Review publish auth and endpoint choices separately from payload mapping.
- OCI release guidance announces JQ `has` support in adapter expressions. Verify the current JQ mapping reference and service capability before using `has` in a public executable example.

## Relationship Design

- Use relationships when they model real graph structure.
- Confirm the relationship content path exists in the source model before creating instances.
- Avoid encoding business meaning twice in both strings and relationships unless there is a specific reason.

## Safe Public Examples

For public templates:

- use neutral names
- use placeholder identifiers
- avoid tenant-specific topic paths unless clearly labeled as examples
- avoid environment-specific assumptions about auth mode

## Sources

- Compatible model upgrade scenario: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/create-new-model-version.htm`
- Adapter updates: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/update-digital-twin-adapter.htm`
- Instance updates: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/update-digital-twin-instance.htm`
- Altitude and JQ `has` release announcement: `https://docs.oracle.com/en-us/iaas/releasenotes/internet-of-things/update-04142026.htm`
- JQ mapping reference: `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/jq-adapter-mapping-reference.htm`
