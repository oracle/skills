# Custom, Fine-Tuned, and Imported Models in OCI Generative AI

## Overview

Use this file when the user wants to bring a non-default model path into OCI Generative AI: fine-tuning a supported base model, importing a compatible open-source or third-party model, or hosting a custom model behind an OCI endpoint.

## Choose the Custom Model Path

| User Need | Recommended Path |
|-----------|------------------|
| Improve a supported OCI base model with owned examples | Fine-tune a base model |
| Host a validated Hugging Face or Object Storage model | Import a model |
| Serve a custom or imported model with isolation | Dedicated AI cluster plus endpoint |
| Use the model from API-first agents | Confirm the model works with the target OpenAI-compatible endpoint and region |

## Fine-Tuning Journey

1. Confirm that the target base model supports fine-tuning and dedicated serving in the required region.
2. Prepare the training dataset and store it in Object Storage.
3. Create a fine-tuning dedicated AI cluster for the selected base model.
4. Create a new custom model or a new version of an existing custom model.
5. Create a hosting dedicated AI cluster.
6. Create an endpoint for the custom model.
7. Test the endpoint, then add cost, retirement, monitoring, private access, and cleanup steps before production.

Fine-tuning clusters are model-specific and resource-intensive. Check the current model page for the required unit shape, unit count, and retirement state before recommending this route.

## Imported Model Journey

1. Confirm the source: Hugging Face or OCI Object Storage.
2. Verify the exact model ID and capability against the compatible-model family page. Capabilities now also include image generation/editing, audio transcription, and speech synthesis; import support doesn't imply Responses API support.
3. For Object Storage imports, require Hugging Face-style artifacts and a `config.json` in the model artifact directory.
4. Import the model.
5. Match a compatible minimum unit shape to regional hardware availability and tenancy limits, then create the hosting cluster. Imported shapes have no provider prefix. Allow more hardware for longer context when supported.
6. Create an endpoint and validate invocation through the API, SDK, or playground.

Imported hosting has a one-hour minimum billable duration, followed by millisecond proration; it doesn't use the pretrained hosting 744-unit-hour commitment. Use `oci/enterprise-ai/cost/cost-estimation.md` for AI-unit and replica calculations.

## Compatible Model Updates

The import catalog spans SEA-LION, Qwen, DeepSeek, Gemma, OmniVoice, Llama, Phi, MiniMax, Mistral, Kimi, Nemotron, Whisper, gpt-oss, MiMo, and GLM. Read only the relevant provider page for exact IDs, modalities, and minimum shapes.

The September 2026 releases include GLM-5.3/5.3-Flash, DeepSeek V4.1 Flash and V4 Pro 0813, Gemma 4 26B A4B IT and 31B IT, and Qwen3.8-27B/3.5-397B-A17B. These are import candidates, not additions to on-demand serving. For example, DeepSeek V4.1 Flash accepts image/text inputs and lists `H100_X8`, `H200_X4`, or `B200_X4`; GLM-5.3 lists `B200_X8`. Confirm the region provides the chosen hardware before recommending either.

Large imported models can require multi-node serving: DeepSeek V4 Pro lists `H100_X16` among its supported shapes. A model's advertised context length may require more resources than the smallest supported shape.

For modality-specific tasks:

- Qwen Image models generate or edit images. Follow their API restrictions: URL response format and streaming aren't supported; don't assume OpenAI image API parity.
- `openai/whisper-large-v3-turbo` imports for audio-to-text, with `H100_X1` or `A100_80G_X1` minimum shapes.
- `k2-fsa/OmniVoice` imports for speech synthesis. Select a compatible shape from its card; it is a different path from on-demand xAI Voice.

## Externally Fine-Tuned Artifacts

OCI Generative AI doesn't fine-tune imported models. For an externally fine-tuned supported base model, verify the documented transformer-version requirement and parameter count within ±10% of the base. Merge LoRA weights into the base before import; each imported fine-tuned model can include one merged adapter. Validate artifacts against the provider-specific compatibility page.

## Endpoint and API Fit

- For simple application calls, use the model endpoint directly through OCI Generative AI APIs.
- For new agentic workflows, prefer the OCI Responses API when the imported or custom model is supported for the target endpoint, model, and region.
- The current agentic availability page explicitly supports imported `Qwen/Qwen3.6-35B-A3B` and `google/gemma-4-31b-it` through Responses. Import, create a hosting cluster, and create the model endpoint first; verify the endpoint invocation contract and tool support separately.
- For legacy chat-only code, use Chat Completions only when the user does not need Responses API tools, state, files, vector stores, or structured output.
- For private-only access, pair the endpoint with a Generative AI private endpoint and validate DNS resolution from the calling network.

## Lifecycle and Risk Checks

- Check model availability by region before naming a model.
- Check deprecation and retirement metadata before choosing a base model for fine-tuning or dedicated hosting.
- Subscribe to OCI announcements or operational notifications for model retirement changes.
- Validate third-party model license and usage terms before import.
- Keep cleanup steps explicit for imported models, dedicated AI clusters, endpoints, files, and Object Storage artifacts.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/fine-tune-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-ai-cluster-fine-tuning.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/imported-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/import-model-from-hugging-face.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/imported-alibaba-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/imported-deepseek-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/imported-google-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/imported-zai-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/imported-openai-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/imported-k2-fsa-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/hardware-unit-shapes-by-region.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-ai-cluster-hosting.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agentic-regions.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/manage-imported-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/import-model-from-bucket.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/model-endpoint-regions.htm
- https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/retire-announcements.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/pay-dedicated.htm
