# genAIService

- componentType: `genAIService`
- identifierRequired: true
- filePath: `workspace-components/generative-ai-services/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `provider` — `<STRING>`; —; Yes; —; `<enum:[ociGenAI:"OCI Generative AI", openai:"OpenAI", cohere:"Cohere", googleGemini:"Google Gemini", genericOpenaiApiCompatible:"Generic (OpenAI API Compatible)"]>`; —; —;

### advanced

- `serverTimeout` — `<INTEGER>`; —; No; —; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `modelName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `maxTokens` — `<INTEGER>`; —; No; —; —; —; —;

### endpointUrl

- `url` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

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

