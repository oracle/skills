# highlight

- componentType: `highlight`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; No; —; —; maxLength=255; —;

### highlight

- `type` — `<STRING>`; —; Yes; `ROW`; `<enum:[row:"Row", cell:"Cell"]>`; —; —;

### condition

- `column` — `<STRING>`; —; Yes; —; —; maxLength=128; —;
- `operator` — `<STRING>`; —; Yes; `=`; `<enum:[=:"=", !=:"!=", >:">", >=:">=", <:"<", <=:"<=", between:"between", isNull:"is null", isNotNull:"is not null", like:"like", notLike:"not like", in:"in", notIn:"not in", contains:"contains", doesNotContain:"does not contain", regexp:"matches regular expression", isInTheLast:"is in the last", isNotInTheLast:"is not in the last", isInTheNext:"is in the next", isNotInTheNext:"is not in the next"]>`; —; —;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `value` — `<NUMBER>`; —; Yes; —; —; —; `highlight[condition.operator] = isInTheLast` or `highlight[condition.operator] = isNotInTheLast` or `highlight[condition.operator] = isInTheNext` or `highlight[condition.operator] = isNotInTheNext`;
- `from` — `<STRING>`; —; Yes; —; —; maxLength=1900; `highlight[condition.operator] = between`;
- `to` — `<STRING>`; —; Yes; —; —; maxLength=1900; `highlight[condition.operator] = between`;
- `unit` — `<STRING>`; —; Yes; —; `<enum:[min:"minutes", hours:"hours", days:"days", weeks:"weeks", months:"months", years:"years"]>`; —; `highlight[condition.operator] = isInTheLast` or `highlight[condition.operator] = isNotInTheLast` or `highlight[condition.operator] = isInTheNext` or `highlight[condition.operator] = isNotInTheNext`;

### advanced

- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### colors

- `background` — `<STRING>`; —; No; —; —; maxLength=30; —;
- `text` — `<STRING>`; —; No; —; —; maxLength=30; —;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

