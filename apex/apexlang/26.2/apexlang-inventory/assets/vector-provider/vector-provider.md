# vectorProvider

- componentType: `vectorProvider`
- identifierRequired: true
- filePath: `workspace-components/vector-providers/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for this Vector Provider.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[databaseOnnxModel:"Database ONNX Model", genAIService:"Generative AI Service", customPlsql:"Custom PL/SQL"]>`; —; —;

### advanced

- `serverTimeout` — `<INTEGER>`; Defines the transfer timeout for communicating with the Vector Provider in seconds.; No; —; —; —; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the Vector Provider in API Calls. Static IDs are also used to identify an existing Vector Provider when the application is being exported and imported to another workspace.; Yes; —; —; maxLength=255; —;
- `maxTokens` — `<INTEGER>`; Enter the maximum number of AI Tokens per rolling 24 hour period that Oracle APEX can use for this Vector Provider. Please note that not every Vector Provider supports token usage information, so it might be possible that &PRODUCT_NAME can't enforce this limit.; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### endpointUrl

- `url` — `<STRING>`; Enter the endpoint URL for this Vector Provider.; Yes; —; —; maxLength=4000; `vectorProvider[identification.type] = genAIService`;

### authentication

- `credentials` — `<@webCredential>`; —; No; —; —; lovType=COMPONENT; `vectorProvider[identification.type] = genAIService`;

### genAIService

- `modelName` — `<STRING>`; —; No; —; —; maxLength=255; `vectorProvider[identification.type] = genAIService`;
- `provider` — `<STRING>`; —; Yes; —; `<enum:[ociGenAI:"OCI Generative AI", openai:"OpenAI", cohere:"Cohere", googleGemini:"Google Gemini", mistralAi:"Mistral AI", ollama:"Ollama", genericOpenaiApiCompatible:"Generic (OpenAI API Compatible)"]>`; —; `vectorProvider[identification.type] = genAIService`;

### additionalData

- `httpHeaders` — `<STRING>`; —; No; —; —; maxLength=4000; `vectorProvider[identification.type] = genAIService`;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=4000; `vectorProvider[identification.type] = genAIService` and `vectorProvider[identification.type] = genAIService` and `vectorProvider[genAIService.provider] = ociGenAI`;

### localEmbedding

- `owner` — `<STRING>`; —; No; —; —; —; `vectorProvider[identification.type] = databaseOnnxModel`;
- `modelName` — `<STRING>`; —; Yes; —; —; —; `vectorProvider[identification.type] = databaseOnnxModel`;
- `function` — `<STRING>`; —; Yes; —; —; maxLength=255; `vectorProvider[identification.type] = customPlsql`;

### ociGenAI

- `compartmentId` — `<STRING>`; —; Yes; —; —; maxLength=255; `vectorProvider[identification.type] = genAIService` and `vectorProvider[identification.type] = genAIService` and `vectorProvider[genAIService.provider] = ociGenAI`;
- `servingMode` — `<STRING>`; —; Yes; —; `<enum:[onDemand:"On-Demand", dedicated:"Dedicated"]>`; —; `vectorProvider[identification.type] = genAIService` and `vectorProvider[identification.type] = genAIService` and `vectorProvider[genAIService.provider] = ociGenAI`;
- `endpointId` — `<STRING>`; —; No; —; —; maxLength=255; `vectorProvider[identification.type] = genAIService` and `vectorProvider[identification.type] = genAIService` and `vectorProvider[genAIService.provider] = ociGenAI`;

