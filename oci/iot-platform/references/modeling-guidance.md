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

## Versioning

Increment the DTMI version when behavior or meaning changes, such as:

- adding or removing telemetry fields
- changing units
- changing validation constraints
- changing relationship semantics

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
