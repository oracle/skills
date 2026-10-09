# Enterprise AI Models in OCI Generative AI

## Overview

Use this file when the task is to choose, invoke, host, or operate OCI Generative AI models. Keep the user's path focused on the workload: chat, embeddings, rerank, custom model hosting, private access, or production serving.

## User Journey

1. Identify the model task first:
   - Chat for assistants, question answering, summarization, and generation.
   - Embeddings for semantic search, clustering, recommendations, and RAG retrieval.
   - Rerank for ordering candidate documents or search results by relevance.
   - Voice when the user explicitly needs text-to-speech and the model is available in the target region.
   - Imported image generation, image editing, or audio transcription when the model card supports that capability; use `custom-and-imported-models.md` for these paths.
2. Choose the usage mode:
   - On-demand mode for fast experimentation or managed shared access.
   - Dedicated mode when the workload needs predictable performance, isolation, or hosted custom models.
3. Confirm model and region availability before recommending a model name.
4. Decide whether the application can call public OCI endpoints or needs private endpoint access.
5. Add governance requirements before production: IAM, guardrails, logging, auditability, and cost controls.

Use `custom-and-imported-models.md` when the user needs fine-tuning, model import, third-party model hosting, custom-model versioning, or imported-model cost behavior.

## Model Infrastructure

Enterprise AI Models in OCI Generative AI are organized around:

- Pretrained hosted models for managed inference.
- Imported models for supported custom deployments.
- Dedicated AI clusters for isolated model hosting.
- Endpoints for serving model traffic.
- Private endpoints for secure network access.
- Model discovery for programmatic capability and availability checks.
- Routing profiles for a controlled regional scope for on-demand inference.

Do not hard-code a model list in generated guidance unless the user explicitly needs a current model choice. Model availability changes by region, so verify against Oracle's current model-by-region documentation before making a specific recommendation.

Model catalogs now include multiple provider families and model tasks, including chat, embeddings, rerank, and voice. Treat provider, model family, region, pricing unit, retirement state, and allowed usage mode as one decision instead of separate afterthoughts.

## Model Discovery

Use `ListModelDiscovery` or `oci generative-ai model-discovery-collection list-model-discovery`; discovery isn't available in the Console. Filter by region or realm, capability, serving mode, OpenAI-compatible API support, access type, and lifecycle state. Unfiltered results span regions and include pretrained and fine-tuned models.

```bash
oci generative-ai model-discovery-collection list-model-discovery \
  --compartment-id "$COMPARTMENT_OCID" \
  --region-parameterconflict us-chicago-1 \
  --capability CHAT --serving-mode ON_DEMAND \
  --is-deprecated false --is-on-demand-retired false --all
```

`--region-parameterconflict` filters model availability; the global `--region` selects the service endpoint. Inspect supported parameters and modalities in the returned model details before generating invocation code.

Distinguish `HOSTED` from `PROXY`: proxy inference leaves OCI for a provider location. Check each model's External Calls notes rather than treating an OCI regional URL as proof that inference stays in that region.

## Availability and Lifecycle Checks

Before recommending a specific model:

1. Check the model-by-region table for on-demand, dedicated, interconnect-only, or unavailable status.
2. Check the model card for supported input/output modalities, context limits, dedicated unit requirements, pricing unit, and benchmark notes.
3. Check deprecation and retirement metadata before using a model in dedicated serving, fine-tuning, or a long-lived production application.
4. Prefer an active replacement model when the current model is deprecated unless the user has a migration constraint.

As of the 2026-10-09 review, `xai.grok-4.7` is the latest announced on-demand Grok release. Its model card documents 500,000-token context, required reasoning, function calling, structured outputs, and separate cached-input and context-tier pricing. Check agentic API and tool eligibility independently; a native inference release doesn't establish support for every agent tool.

For Abu Dhabi, on-demand `cohere.command-a-vision` and `cohere.embed-v4.0` retire on **2026-10-21**, superseding the earlier October 12 date. Dedicated deployments and other regions are unaffected. Use a supported on-demand region or dedicated hosting where capacity exists. The retired `cohere.command-latest` and `cohere.command-plus-latest` aliases must not be used in new examples.

## On-Demand vs Dedicated

Use on-demand mode when the user needs a simple path to experiment, prototype, or run variable workloads without managing serving capacity.

Use dedicated mode when the user needs:

- Single-tenant serving infrastructure.
- Predictable latency or throughput.
- Custom model hosting or fine-tuned model endpoints.
- Production isolation and capacity planning.

Dedicated models are region-bound through their deployed endpoint, so confirm that the target application, data residency requirements, and model region line up.

## Routing Profiles

For on-demand cross-region routing, create a profile for one model and one or more supported regions in the same realm. The service restricts routing to that set; this feature doesn't route dedicated endpoints or select between multiple models.

1. Check on-demand model availability and approve the target regional scope.
2. Create the profile in a compartment through the Console, `CreateRoutingProfile`, or `oci generative-ai routing-profile create`.
3. For CLI policies, use `--model-routing-policy` and `--region-routing-policy` with JSON files; generate the schema from the current CLI rather than inventing policy fields.
4. Reference the profile OCID as the model in a supported inference request. Check the target inference API contract before generating code.
5. Grant profile read access alongside inference permission; see the governance file.
6. Recheck model availability when updating the model or regions. Profiles also support list, get, move, and delete operations.

Do not assume a routing algorithm, latency guarantee, failover policy, or OpenAI-compatible request shape beyond the documented contract.

## Dedicated Hardware and Capacity

Check **Hardware Unit Shapes by Region**, then the model's compatible baseline. Regional hardware availability alone doesn't establish model availability or tenancy capacity.

- OCI model shapes include a provider prefix, such as `Cohere_H100_X2`; imported shapes omit it, such as `H100_X2`.
- `Xn` counts hardware units per replica. AI units are pricing multipliers; see `oci/enterprise-ai/cost/cost-estimation.md`.
- Current hardware families include A10, A100 40G/80G, H100, H200, B200, and B300. Check commercial, government, and sovereign region tables separately.
- Preserve exact shape spelling from the API or Console, including provider-prefix case. Verify model-card spelling against supported API values when documentation differs.
- The shape is immutable after cluster creation. Scale throughput with replicas, which can be updated; additional endpoints don't add replicas.
- Default dedicated capacity is zero. Check the hardware-specific limit and request capacity before deployment; B300 government deployments require `dedicated-unit-b300-count`.
- Hosting clusters default to 50 endpoints; `endpoint-per-dedicated-unit-count` controls endpoint capacity separately from replicas and hardware units.

Use the current performance benchmarks to choose an initial replica count, then validate with the workload. Monitor GPU utilization, token volume, invocation latency, and client/server errors through OCI Monitoring; fine-tuning clusters don't expose hosting cluster metrics.

## Cost Inputs

For on-demand mode, estimate by the pricing unit shown for the model on Oracle's pricing page. Some models are priced by character-based transactions and newer model families can be priced by input and output tokens. Do not assume one unit model for all providers.

For dedicated mode, estimate by AI unit-hours and required unit multipliers for the selected model. For OCI Generative AI pretrained and fine-tuned model hosting, check the current minimum commitment before recommending dedicated serving. Imported models can have different commitment behavior.

Use `oci/enterprise-ai/cost/cost-estimation.md` when the user asks for sizing, monthly cost, pricing-page mapping, or cost-estimator inputs.

## Endpoint Guidance

For endpoint decisions:

- Use standard model endpoints when public OCI service access is acceptable.
- Use private endpoints when traffic must stay inside a VCN, peered VCN, VPN, FastConnect, or other private network path.
- Treat endpoint, private endpoint, and dedicated cluster limits as planning inputs, not afterthoughts.
- Include deletion and cleanup steps for experiments because endpoints and dedicated clusters can continue to incur cost.

## Common Mistakes

- Starting with a service name instead of a user task.
- Choosing a model before checking region availability.
- Ignoring model deprecation and retirement dates for production endpoints.
- Designing RAG with a chat model only and forgetting embeddings or rerank.
- Moving to dedicated serving without a latency, throughput, isolation, or custom-model reason.
- Treating private endpoints as an application toggle rather than a networking and DNS design.
- Estimating model cost without checking whether the model is priced by characters, tokens, search units, or AI unit-hours.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/model-discovery.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/generative-ai/model-discovery-collection/list-model-discovery.html
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/routing-profile.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-routing-profile.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/update-routing-profile.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/routing-profile-permissions.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/hardware-unit-shapes-by-region.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-ai-cluster-hosting.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/limits.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/performance.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/metric-details.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agentic-regions.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/x-ai-grok-4-7.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/deprecating-on-demand.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/deprecating-dedicated.htm
- https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/new-on-demand-retirement-date-AUH.htm
- https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/cohere-command-model-aliases-retired.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/pretrained-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/model-endpoint-regions.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/concepts.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/ai-cluster.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/endpoint.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/private-endpoint.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/modes.htm
- https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/retire-announcements.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/pay-on-demand.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/pay-dedicated.htm
