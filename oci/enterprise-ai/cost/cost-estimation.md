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
| Dedicated serving or fine-tuning | AI unit-hours, model-specific unit multipliers, and minimum commitments |
| Imported model hosting | Model Import AI unit-hours and the imported model's recommended unit size |
| Rerank | Search units |
| Web Search | Requests |
| File Search | Storage hours and retrieval usage |
| Vector Stores | Storage hours and retrieval requests |
| Agent memory | Ingestion events and retention storage |
| Code Interpreter | Container-related usage, memory choices, files, and generated outputs |
| OCI Generative AI Agents | Agent transactions, knowledge base storage, and data ingestion |
| Hosted applications | Replica runtime, scaling limits, managed storage, endpoint choice, and network assumptions |

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

For token-priced models, use the exact input-token and output-token price lines from Oracle's price list:

```text
cost = (input_tokens / 1,000,000) * input_token_unit_price
     + (output_tokens / 1,000,000) * output_token_unit_price
```

## Dedicated Formula

For OCI Generative AI pretrained and fine-tuned models on dedicated serving:

```text
billable_unit_hours = max(actual_hours * required_units, minimum_commitment_unit_hours)
cost = billable_unit_hours * unit_hour_price * model_multiplier
```

Check the current model page and dedicated cost documentation for required units, model multipliers, and minimum commitments. Imported models can have different commitment behavior from pretrained and fine-tuned OCI Generative AI models.

For imported models, use the imported-model resource and pricing guidance to select the recommended dedicated AI cluster unit size, then multiply by the Model Import AI-unit-per-hour price line. Do not apply pretrained-model minimum commitments to imported-model hosting without checking the current imported-model documentation.

## Agent and Retrieval Cost Mapping

When using the Oracle price list or Enterprise AI cost estimator, look for cost lines that match the actual agent capabilities:

- File Search storage for files indexed for retrieval.
- Vector Store storage and retrieval for reusable retrieval indexes.
- Memory ingestion and retention for stored or compacted context.
- Web Search requests when enabled for supported models.
- Code Interpreter or container-backed execution where applicable.
- OCI Generative AI Agents transaction, knowledge base storage, and ingestion lines when using that service path.
- Hosted application runtime and managed storage costs through the related OCI services or hosted application estimator inputs.

## Agent Cost Checklist

Before using the cost estimator for an agent, collect:

- Model IDs and expected input/output volume.
- Average and peak requests per day.
- Whether the agent uses File Search, Code Interpreter, Function Calling, MCP Calling, SQL Search, Web Search, memory, or vector stores.
- Whether xAI-compatible tools are enabled for supported xAI models.
- File count, average file size, update frequency, and retention period.
- Vector Store storage duration and retrieval frequency.
- Memory ingestion event count and retention storage.
- Imported model source, recommended unit size, expected runtime hours, and endpoint lifecycle if using model import.
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
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/modes.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/manage-imported-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/tool-support.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agents.htm
