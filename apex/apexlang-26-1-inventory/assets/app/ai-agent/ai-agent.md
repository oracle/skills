# aiAgent

- componentType: `aiAgent`
- identifierRequired: true
- filePath: `shared-components/ai-agents/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### advanced

- `temperature` — `<NUMBER>`; —; No; —; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

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

