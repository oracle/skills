# filter

- componentType: `filter`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### condition (direct group)

- `type` — `<STRING>`; —; Yes; `COL`; `<enum:[column:"Column", rowSearch:"Row Search", rowExpression:"Row Expression"]>`; —; —;
- `column` — `<STRING>`; —; Yes; —; —; maxLength=128; `filter[condition.type] = column`;
- `operator` — `<STRING>`; —; Yes; `=`; `<enum:[=:"=", !=:"!=", >:">", >=:">=", <:"<", <=:"<=", between:"between", isNull:"is null", isNotNull:"is not null", like:"like", notLike:"not like", in:"in", notIn:"not in", contains:"contains", doesNotContain:"does not contain", regexp:"matches regular expression", isInTheLast:"is in the last", isNotInTheLast:"is not in the last", isInTheNext:"is in the next", isNotInTheNext:"is not in the next"]>`; —; `filter[condition.type] = column`;
- `rowExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[condition.type] = rowExpression`;
- `search` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[condition.type] = rowSearch`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[condition.type] = column` and `filter[condition.type] = column`;
- `value` — `<NUMBER>`; —; Yes; —; —; —; `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = isInTheLast` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = isNotInTheLast` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = isInTheNext` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = isNotInTheNext`;
- `from` — `<STRING>`; —; Yes; —; —; maxLength=1900; `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = between`;
- `to` — `<STRING>`; —; Yes; —; —; maxLength=1900; `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = between`;
- `unit` — `<STRING>`; —; Yes; —; `<enum:[min:"minutes", hours:"hours", days:"days", weeks:"weeks", months:"months", years:"years"]>`; —; `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = isInTheLast` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = isNotInTheLast` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = isInTheNext` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = isNotInTheNext`;

### advanced

- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### identification

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; `filter[condition.type] = rowExpression`;

