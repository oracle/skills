# connection

- componentType: `connection`
- identifierRequired: false

## Properties

### identification (direct group)

- `name` — `<STRING>`; Name of this workflow activity transition.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; `NORMAL`; `<enum:[normal:"Normal", error:"Error", timeout:"Timeout"]>`; —; —;

### activity

- `from` — `<@activity>`; —; Yes; —; —; lovType=COMPONENT; —;
- `to` — `<@activity>`; —; Yes; —; —; lovType=COMPONENT; —;

### advanced

- `diagram` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### condition

- `operator` — `<STRING>`; —; Yes; —; `<enum:[=:"Is Equal To", !=:"Is Not Equal To", >:"Is Greater Than", <:"Is Less Than", >=:"Is Greater Than Or Equal To", <=:"Is Less Than Or Equal To", isNotNull:"Is Not Null"]>`; —; `connection[identification.type] = error`;
- `value` — `<STRING>`; —; Yes; —; —; —; `connection[identification.type] = error`;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; `connection[identification.type] = error`;

### execution

- `sequence` — `<NUMBER>`; —; No; —; —; —; `connection[identification.type] = error`;

