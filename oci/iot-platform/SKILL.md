---
name: oci-iot-platform
description: Explore, create, and troubleshoot Oracle Cloud Infrastructure Internet of Things Platform resources, including domains, digital twin models, adapters, instances, relationships, and device publish flows. Use when requests involve OCI IoT bootstrap, digital twin inspection, safe lifecycle operations, or translating OCI IoT docs and samples into concrete commands.
---

# OCI IoT Platform

## Quick Start

1. Confirm the user is working with Oracle Cloud Infrastructure Internet of Things Platform.
2. Ask for the minimum context needed before giving commands:
   - `IOT_DOMAIN_ID` when available
   - `OCI_CLI_PROFILE`
   - `OCI_CLI_AUTH` when the selected profile needs it, such as `security_token`
   - `OCI_REGION` when the selected profile does not already target the domain's region
   - intended operation: inspect, create, update, delete, or publish test telemetry
3. Prefer this execution order:
   - discover the domain and current state
   - inspect the relevant model, adapter, or twin
   - check local CLI capability with `oci ... --help` when using newer filters or gateway/raw-command options
   - make the smallest required change
   - verify the result with a fresh read

## Default Workflow

1. Start with read-only OCI CLI discovery.
2. Use `scripts/derive_domain_context.sh` when the user has `IOT_DOMAIN_ID` and a profile or explicit region that can reach the domain.
3. Use [references/platform-surface.md](references/platform-surface.md) when the task needs orientation on OCI IoT resource families, data flow, connectivity types, or which surface to use.
4. Use [references/cli-workflows.md](references/cli-workflows.md) for control-plane actions:
   - domains and domain groups
   - digital twin models
   - adapters
   - instances
   - relationships
   - work requests
   - HTTPS publish examples
5. Use [references/mcp-optional-use.md](references/mcp-optional-use.md) only when an OCI IoT MCP server is already available in the user's environment. Keep CLI as the fallback and never require MCP for public workflows.
6. Use [references/resilience-guidance.md](references/resilience-guidance.md) for:
   - large or ambiguous list operations
   - SDK or CLI command-shape drift
   - gateway-aware topology
   - relationship source/target diagnosis
   - work-request failures
   - publish rejection triage
   - raw-command final-state validation
   - cleanup or rollback planning
7. Use [references/modeling-guidance.md](references/modeling-guidance.md) when the request involves DTDL authoring or adapter payload design.
8. Use [references/data-access.md](references/data-access.md) only when the user explicitly needs Data API, ORDS, direct database access, or APEX-oriented workflows.
9. Use [references/release-validation.md](references/release-validation.md) before calling the skill package ready to share publicly.

## Bundled Resources

- Run [scripts/derive_domain_context.sh](scripts/derive_domain_context.sh) to derive:
  - region
  - device host
  - data host
  - domain group OCID
  - short IDs used in later commands
- Run [scripts/twin_tools.py](scripts/twin_tools.py) for:
  - `last-known`
  - `offline`
  - `telemetry-template`
- Reuse [templates/model.temperature-sensor.template.json](templates/model.temperature-sensor.template.json), [templates/adapter.default.template.json](templates/adapter.default.template.json), [templates/instance.template.json](templates/instance.template.json), and [templates/publish-curl.template.sh](templates/publish-curl.template.sh) as neutral starting points.
- Use [references/platform-surface.md](references/platform-surface.md) to explain how domains, domain groups, models, adapters, twins, relationships, work requests, raw commands, and data access fit together.
- Use [references/resilience-guidance.md](references/resilience-guidance.md) to keep operator responses bounded, active-resource focused, and explicit about final-state evidence.
- Use [references/mcp-optional-use.md](references/mcp-optional-use.md) to recognize optional OCI IoT MCP tool families, gateway-aware helper behavior, Data API wrappers, and safety rules.

## Guardrails

- Do not assume internal tenancy names, profiles, network access patterns, or private tooling.
- Treat Oracle product docs and official samples as the source of truth for platform behavior.
- Prefer read-only commands first and verify current state before recommending mutations.
- When suggesting create, update, or delete operations, include a verification command immediately after the mutation.
- Bound large reads with filters and `--limit` before using `--all`.
- Treat asynchronous acceptance, including raw-command `202`, as incomplete until final state is verified.
- For digital twin instance creation, never use `INDIRECT` as a shortcut to avoid auth setup. Use `INDIRECT` only when the user explicitly asks for a gateway/downstream topology or provides a gateway routing requirement. Otherwise clarify connectivity or proceed with `DIRECT` when a publishing device is implied.
- Keep MCP guidance optional. Do not make MCP installation or private MCP bootstrap part of the public workflow.
- When MCP is already available, treat it as an accelerator for joined context, selector resolution, bounded pagination, gateway topology, Data API summaries, and polling; always be ready to fall back to CLI or SDK commands.
- Treat device publishing auth modes separately:
  - vault-secret-backed basic auth
  - certificate-based mTLS
- Do not imply OCI IoT is a general-purpose MQTT broker.
- Keep examples redacted and tenant-neutral.

## Output Style

For each task, return:

1. The exact command sequence with placeholders filled or called out.
2. The key IDs, state, or timestamps that matter.
3. The next verification step.

## Sources

- Oracle IoT service docs:
  - `https://docs.oracle.com/en-us/iaas/Content/internet-of-things/home.htm`
- OCI CLI IoT command reference:
  - `https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/iot.html`
- Oracle sample repository:
  - `https://github.com/oracle-samples/oci-iot-samples`
