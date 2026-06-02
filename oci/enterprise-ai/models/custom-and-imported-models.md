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
2. Verify the model is compatible with OCI Generative AI and supports one of the documented capabilities: text-to-text, image-and-text-to-text, embedding, or rerank.
3. For Object Storage imports, require Hugging Face-style artifacts and a `config.json` in the model artifact directory.
4. Import the model.
5. Create a hosting dedicated AI cluster using the recommended imported-model unit size.
6. Create an endpoint and validate invocation through the API, SDK, or playground.

Imported models do not follow every pretrained-model hosting rule. In particular, Oracle documents different commitment behavior for imported model hosting, so check the imported-model cost guidance instead of assuming the pretrained hosting minimum.

## Endpoint and API Fit

- For simple application calls, use the model endpoint directly through OCI Generative AI APIs.
- For new agentic workflows, prefer the OCI Responses API when the imported or custom model is supported for the target endpoint, model, and region.
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
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/manage-imported-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/import-model-from-bucket.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/model-endpoint-regions.htm
- https://docs.oracle.com/en-us/iaas/releasenotes/generative-ai/retire-announcements.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/pay-dedicated.htm
