# aiAgent

- componentType: `aiAgent`
- identifierRequired: true
- filePath: `shared-components/ai-agents/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a name of the AI Agent.; Yes; —; —; maxLength=255; —;

### advanced

- `temperature` — `<NUMBER>`; —; No; —; —; —; —;
- `reasoningEffort` — `<STRING>`; —; No; —; `<enum:[none:"None (Provider specific)", minimal:"Minimal (Provider specific)", low:"Low", medium:"Medium", high:"High", xhigh:"Extra High (Provider specific)", max:"Maximum (Provider specific)"]>`; —; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the AI Agent in API Calls.; Yes; —; —; maxLength=255; —;

### subscription

- `master` — `<@aiAgent>`; —; No; —; —; lovType=COMPONENT; —;

### responseFormat

- `type` — `<STRING>`; —; Yes; `TEXT`; `<enum:[text:"Text", jsonObject:"JSON Object"]>`; —; —;
- `jsonSchema` — `<STRING>`; —; Yes; —; —; —; `aiAgent[responseFormat.type] = jsonObject`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### genAI

- `service` — `<@genAIService>`; —; No; —; —; lovType=COMPONENT; —;
- `systemPrompt` — `<STRING>`; —; No; —; —; —; —;
- `welcomeMessage` — `<STRING>`; —; No; —; —; —; —;

