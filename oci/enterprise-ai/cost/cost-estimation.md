# Cost Estimation for OCI Generative AI and Enterprise AI Agents

## Overview

Use this file when the user asks for OCI Generative AI pricing, cost-estimator inputs, monthly cost sizing, or whether a design has hidden cost drivers. Do not hard-code prices in this skill; route to Oracle's current price list and cost estimator because models, units, and regions change.

## Cost Estimator Journey

1. Open Oracle's OCI Enterprise AI cost estimator or the OCI price list.
2. Select the AI and Machine Learning category.
3. Load OCI Generative AI for model inference and model-serving costs.
4. Load OCI Generative AI Agents when estimating agent transactions, knowledge base storage, or data ingestion.
5. Enter usage by the unit shown in the estimator: characters, tokens, search units, requests, events, gigabyte-hours, AI unit-hours, or cluster hours.
6. Add related services such as Object Storage, networking, logging, load balancing, or database services only when the architecture actually uses them.

Use the cost estimator as the user journey artifact, not only as a calculator. Capture the architecture choices first, then map each choice to the estimator line item so stakeholders can see what feature adds which cost.

## Cost Drivers

| Workload Element | Estimate With |
|------------------|---------------|
| On-demand character-priced chat | Prompt characters plus response characters |
| On-demand embeddings | Input characters |
| Token-priced models | Input tokens and output tokens, using the specific pricing line for the model |
| Cached input or context-tier pricing | Separate cached and uncached input, output, and the applicable context tier |
| Dedicated serving or fine-tuning | AI unit-hours, model-specific unit multipliers, and minimum commitments |
| Imported model hosting | Model Import AI unit-hours and the imported model's recommended unit size |
| Rerank | Search units |
| Provider search tools | The provider's documented usage unit, after checking OCI tool support |
| File Search | Storage hours and retrieval usage |
| Vector Stores | Storage hours and retrieval requests |
| Agent memory | Ingestion events and retention storage |
| Code Interpreter | Container-related usage, memory choices, files, and generated outputs |
| OCI Generative AI Agents | Agent transactions, knowledge base storage, and data ingestion |
| Hosted applications | Replica runtime, scaling limits, managed storage, endpoint choice, and network assumptions |
| Scheduled NL2SQL enrichment | Refresh frequency, changed schema metadata, and selected model inference |

## On-Demand Formula

For character-priced on-demand inferencing:

```text
transactions = input_characters + output_characters
cost = (transactions / 10,000) * unit_price
```

For embeddings:

```text
transactions = input_characters
cost = (transactions / 10,000) * embedding_unit_price
```

For token-priced models without separate cached-input rates, use the exact input-token and output-token price lines from Oracle's price list:

```text
cost = (input_tokens / 1,000,000) * input_token_unit_price
     + (output_tokens / 1,000,000) * output_token_unit_price
```

When cached input has its own rate, split input into cached and uncached tokens to avoid charging both rates for the same tokens. Use the model's actual price denominator and context tier.

## Dedicated Formula

First identify the pricing scheme for the model and shape. For older model-specific unit sizes with a documented multiplier:

```text
billable_unit_hours = max(actual_hours * required_units, minimum_commitment_unit_hours)
cost = billable_unit_hours * unit_hour_price * model_multiplier
```

For hardware shapes, use the AI unit count from Oracle's hardware table:

```text
hourly_cost = ai_units_per_replica * replicas * applicable_ai_unit_hour_price
imported_hosting_cost = max(runtime_hours, 1) * hourly_cost
```

Provider prefixes don't change the AI unit count: `H100_X2` and `Cohere_H100_X2` each represent 12.02 AI units per replica. Hardware card count, AI units, and replicas are different quantities. Don't apply an additional legacy model multiplier to a hardware shape's AI unit count.

OCI pretrained/fine-tuned hosting has a 744-unit-hour minimum per hosting cluster. Fine-tuning has a one-unit-hour minimum per job, with model-specific required units. Apply the documented pricing scheme and commitment, rather than assuming a common one-hour runtime floor for every deployment.

Imported hosting uses the **Model Import AI Unit Per Hour** line and a one-hour duration floor. Beyond that hour, runtime is prorated to the millisecond; metering reports every five minutes. A cluster deleted before one hour is still billed to the floor. For example, two replicas of `H100_X2` run for 30 minutes incur `12.02 * 2 * 1` AI unit-hours, before multiplying by the current Model Import rate.

Check the hardware table for every shape's multiplier and limit; recheck rates in the price list instead of storing currency values here.

## Agent and Retrieval Cost Mapping

When using the Oracle price list or Enterprise AI cost estimator, look for cost lines that match the actual agent capabilities:

- File Search storage for files indexed for retrieval.
- Vector Store storage and retrieval for reusable retrieval indexes.
- Memory ingestion and retention for stored or compacted context.
- Provider search usage, such as X Search, when listed for the chosen model in the current OCI tool table.
- Code Interpreter or container-backed execution where applicable.
- OCI Generative AI Agents transaction, knowledge base storage, and ingestion lines when using that service path.
- Hosted application runtime and managed storage costs through the related OCI services or hosted application estimator inputs.

## Agent Cost Checklist

Before using the cost estimator for an agent, collect:

- Model IDs and expected input/output volume.
- Cached input volume and context-length tier when the model has separate rates; Grok 4.7 documents both.
- Average and peak requests per day.
- Whether the agent uses File Search, Code Interpreter, Function Calling, MCP Calling, SQL Search, provider search tools, memory, or vector stores.
- Whether xAI-compatible tools are enabled for supported xAI models.
- File count, average file size, update frequency, and retention period.
- Vector Store storage duration and retrieval frequency.
- Memory ingestion event count and retention storage.
- Imported model source, recommended unit size, expected runtime hours, and endpoint lifecycle if using model import.
- Hardware unit shape, AI unit count per replica, replica count, and shape-specific service limit.
- Routing-profile target regions and regional pricing assumptions when using cross-region on-demand inference.
- NL2SQL enrichment model and refresh schedule, in addition to SQL-generation traffic.
- Fine-tuning job frequency, cluster unit count, training duration, hosting cluster runtime, and base-model retirement risk.
- Hosted application replica count, runtime hours, managed storage, public/private endpoint design, and network egress assumptions.
- OCI Generative AI Agents transaction volume, knowledge base storage, and data ingestion, if using that service path.

## Common Mistakes

- Estimating only model inference and ignoring retrieval, storage, memory, or hosted runtime.
- Treating every model as character-priced when some pricing lines are token-based.
- Forgetting output tokens or response characters in chat cost.
- Using dedicated serving for a prototype without checking minimum commitments.
- Keeping vector stores, files, containers, memory, endpoints, or hosted deployments alive after experiments.
- Assuming SQL Search query execution is included in generated-SQL cost; execution happens separately through database tooling.

## Sources

- https://www.oracle.com/artificial-intelligence/enterprise-ai/cost-estimator/
- https://www.oracle.com/cloud/price-list/
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/calculate-cost.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/pay-on-demand.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/pay-dedicated.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/hardware-unit-shapes-by-region.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-ai-cluster-hosting.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/x-ai-grok-4-7.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/nl2sql.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/routing-profile.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/modes.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/manage-imported-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/tool-support.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agents.htm
