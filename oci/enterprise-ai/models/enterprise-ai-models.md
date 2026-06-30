# Enterprise AI Models in OCI Generative AI

## Overview

Use this file when the task is to choose, invoke, host, or operate OCI Generative AI models. Keep the user's path focused on the workload: chat, embeddings, rerank, custom model hosting, private access, or production serving.

## User Journey

1. Identify the model task first:
   - Chat for assistants, question answering, summarization, and generation.
   - Embeddings for semantic search, clustering, recommendations, and RAG retrieval.
   - Rerank for ordering candidate documents or search results by relevance.
   - Voice when the user explicitly needs text-to-speech and the model is available in the target region.
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

Do not hard-code a model list in generated guidance unless the user explicitly needs a current model choice. Model availability changes by region, so verify against Oracle's current model-by-region documentation before making a specific recommendation.

Model catalogs now include multiple provider families and model tasks, including chat, embeddings, rerank, and voice. Treat provider, model family, region, pricing unit, retirement state, and allowed usage mode as one decision instead of separate afterthoughts.

## Availability and Lifecycle Checks

Before recommending a specific model:

1. Check the model-by-region table for on-demand, dedicated, interconnect-only, or unavailable status.
2. Check the model card for supported input/output modalities, context limits, dedicated unit requirements, pricing unit, and benchmark notes.
3. Check deprecation and retirement metadata before using a model in dedicated serving, fine-tuning, or a long-lived production application.
4. Prefer an active replacement model when the current model is deprecated unless the user has a migration constraint.

## On-Demand vs Dedicated

Use on-demand mode when the user needs a simple path to experiment, prototype, or run variable workloads without managing serving capacity.

Use dedicated mode when the user needs:

- Single-tenant serving infrastructure.
- Predictable latency or throughput.
- Custom model hosting or fine-tuned model endpoints.
- Production isolation and capacity planning.

Dedicated models are region-bound through their deployed endpoint, so confirm that the target application, data residency requirements, and model region line up.

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
