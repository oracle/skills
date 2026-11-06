# genAIService

- componentType: `genAIService`
- identifierRequired: true
- filePath: `workspace-components/generative-ai-services/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for this Generative AI Service.; Yes; —; —; maxLength=255; —;
- `provider` — `<STRING>`; —; Yes; —; `<enum:[ociGenAI:"OCI Generative AI", openai:"OpenAI", cohere:"Cohere", googleGemini:"Google Gemini", anthropicClaude:"Anthropic Claude", mistralAi:"Mistral AI", ollama:"Ollama", genericOpenaiApiCompatible:"Generic (OpenAI API Compatible)"]>`; —; —;

### advanced

- `serverTimeout` — `<INTEGER>`; Defines the transfer timeout for communicating with the Generative AI Service in seconds.; No; —; —; —; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the Generative AI Service in API Calls. Static IDs are also used to identify an existing Generative AI Service when the application is being exported and imported to another workspace.; Yes; —; —; maxLength=255; —;
- `modelName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `maxTokens` — `<INTEGER>`; Enter the maximum number of AI Tokens per rolling 24 hour period that Oracle APEX can use for this Generative AI Service. Please note that not every Generative AI Service supports token usage information, so it might be possible that &PRODUCT_NAME can't enforce this limit.; No; —; —; —; —;
- `providerApi` — `<STRING>`; —; Yes; —; `<enum:[responses:"Responses", generic:"Generic", interactions:"Interactions", chatCompletions:"Chat Completions", generateText:"Generate Text"]>`; —; `genAIService[identification.provider] = openai` or `genAIService[identification.provider] = genericOpenaiApiCompatible` or `genAIService[identification.provider] = ollama` or `genAIService[identification.provider] = ociGenAI` or `genAIService[identification.provider] = googleGemini`;

### endpointUrl

- `url` — `<STRING>`; Enter the endpoint URL for this Generative AI Service.; Yes; —; —; maxLength=4000; —;

### authentication

- `credentials` — `<@webCredential>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### appBuilder

- `usedByAppBuilder` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `defaultForNewApps` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### additionalData

- `httpHeaders` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### ociGenAI

- `compartmentId` — `<STRING>`; —; Yes; —; —; maxLength=255; `genAIService[identification.provider] = ociGenAI`;
- `servingMode` — `<STRING>`; —; Yes; —; `<enum:[onDemand:"On-Demand", dedicated:"Dedicated"]>`; —; `genAIService[identification.provider] = ociGenAI`;
- `endpointId` — `<STRING>`; —; Yes; —; —; maxLength=255; `genAIService[identification.provider] = ociGenAI` and `genAIService[ociGenAI.servingMode] = dedicated`;
- `projectId` — `<STRING>`; —; Yes; —; —; maxLength=255; `genAIService[identification.provider] = ociGenAI` and `genAIService[identification.provider] = openai` and `genAIService[advanced.providerApi] = responses` or `genAIService[identification.provider] = ociGenAI` and `genAIService[identification.provider] = genericOpenaiApiCompatible` and `genAIService[advanced.providerApi] = responses` or `genAIService[identification.provider] = ociGenAI` and `genAIService[identification.provider] = ollama` and `genAIService[advanced.providerApi] = responses` or `genAIService[identification.provider] = ociGenAI` and `genAIService[identification.provider] = ociGenAI` and `genAIService[advanced.providerApi] = responses` or `genAIService[identification.provider] = ociGenAI` and `genAIService[identification.provider] = googleGemini` and `genAIService[advanced.providerApi] = responses`;

