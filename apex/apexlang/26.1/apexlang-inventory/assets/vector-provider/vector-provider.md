# vectorProvider

- componentType: `vectorProvider`
- identifierRequired: true
- filePath: `workspace-components/vector-providers/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[databaseOnnxModel:"Database ONNX Model", genAIService:"Generative AI Service", customPlsql:"Custom PL/SQL"]>`; —; —;

### advanced

- `serverTimeout` — `<INTEGER>`; —; No; —; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `maxTokens` — `<INTEGER>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### endpointUrl

- `url` — `<STRING>`; —; Yes; —; —; maxLength=4000; `vectorProvider[identification.type] = genAIService`;

### authentication

- `credentials` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; `vectorProvider[identification.type] = genAIService`;

### genAIService

- `modelName` — `<STRING>`; —; No; —; —; maxLength=255; `vectorProvider[identification.type] = genAIService`;
- `provider` — `<STRING>`; —; Yes; —; `<enum:[ociGenAI:"OCI Generative AI", openai:"OpenAI", cohere:"Cohere", googleGemini:"Google Gemini", genericOpenaiApiCompatible:"Generic (OpenAI API Compatible)"]>`; —; `vectorProvider[identification.type] = genAIService`;

### additionalData

- `httpHeaders` — `<STRING>`; —; No; —; —; maxLength=4000; `vectorProvider[identification.type] = genAIService`;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=4000; `vectorProvider[identification.type] = genAIService` and `vectorProvider[identification.type] = genAIService` and `vectorProvider[genAIService.provider] = ociGenAI`;

### localEmbedding

- `owner` — `<STRING>`; —; No; —; —; —; `vectorProvider[identification.type] = databaseOnnxModel`;
- `modelName` — `<STRING>`; —; Yes; —; —; —; `vectorProvider[identification.type] = databaseOnnxModel`;
- `function` — `<STRING>`; —; Yes; —; —; maxLength=255; `vectorProvider[identification.type] = customPlsql`;

