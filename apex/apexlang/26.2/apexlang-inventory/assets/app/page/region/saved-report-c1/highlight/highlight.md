# highlight

- componentType: `highlight`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveGrid`

## Properties

### condition

- `type` — `<STRING>`; —; Yes; `COLUMN`; `<enum:[column:"Column", rowSearch:"Row Search"]>`; —; —;
- `operator` — `<STRING>`; —; Yes; `EQ`; `<enum:[equals:"equals", notEquals:"not equals", greaterThan:"greater than", greaterThanOrEquals:"greater than or equals", lessThan:"less than", lessThanOrEquals:"less than or equals", isEmpty:"is empty", isNotEmpty:"is not empty", in:"in", notIn:"not in", between:"between", notBetween:"not between", contains:"contains", doesNotContain:"does not contain", startsWith:"starts with", doesNotStartWith:"does not start with", matchesRegexp:"matches regular expression", inTheLast:"in the last", notInTheLast:"not in the last", inTheNext:"in the next", notInTheNext:"not in the next"]>`; —; `highlight[condition.type] = column`;
- `search` — `<STRING>`; —; Yes; —; —; maxLength=4000; `highlight[condition.type] = rowSearch`;
- `column` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `highlight[condition.type] = column`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `highlight[condition.type] = column` and `highlight[condition.type] = column`;
- `value` — `<NUMBER>`; —; Yes; —; —; —; `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = inTheLast` or `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = notInTheLast` or `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = inTheNext` or `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = notInTheNext`;
- `from` — `<STRING>`; —; Yes; —; —; maxLength=1900; `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = between` or `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = notBetween`;
- `to` — `<STRING>`; —; Yes; —; —; maxLength=1900; `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = between` or `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = notBetween`;
- `unit` — `<STRING>`; —; Yes; —; `<enum:[min:"minutes", hours:"hours", days:"days", weeks:"weeks", months:"months", years:"years"]>`; —; `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = inTheLast` or `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = notInTheLast` or `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = inTheNext` or `highlight[condition.type] = column` and `highlight[condition.type] = column` and `highlight[condition.operator] = notInTheNext`;
- `caseSensitive` — `<BOOLEAN>`; —; Yes; `N`; —; —; `highlight[condition.type] = rowSearch` or `highlight[condition.type] = column` and `highlight[condition.operator] = contains` or `highlight[condition.type] = column` and `highlight[condition.operator] = doesNotContain` or `highlight[condition.type] = column` and `highlight[condition.operator] = startsWith` or `highlight[condition.type] = column` and `highlight[condition.operator] = doesNotStartWith` or `highlight[condition.type] = column` and `highlight[condition.operator] = matchesRegexp`;

### advanced

- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=40; —;

### highlight

- `type` — `<STRING>`; —; Yes; `ROW`; `<enum:[row:"Row", cell:"Cell"]>`; —; —;
- `column` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `highlight[highlight.type] = cell`;

### colors

- `background` — `<STRING>`; —; No; —; —; maxLength=30; —;
- `text` — `<STRING>`; —; No; —; —; maxLength=30; —;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

