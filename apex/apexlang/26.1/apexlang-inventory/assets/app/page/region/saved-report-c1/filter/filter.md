# filter

- componentType: `filter`
- identifierRequired: false
- appliesWhen: `region[identification.type] = interactiveGrid`

## Properties

### condition (direct group)

- `type` — `<STRING>`; —; Yes; `COLUMN`; `<enum:[column:"Column", rowSearch:"Row Search"]>`; —; —;
- `operator` — `<STRING>`; —; Yes; `EQ`; `<enum:[equals:"equals", notEquals:"not equals", greaterThan:"greater than", greaterThanOrEquals:"greater than or equals", lessThan:"less than", lessThanOrEquals:"less than or equals", isEmpty:"is empty", isNotEmpty:"is not empty", in:"in", notIn:"not in", between:"between", notBetween:"not between", contains:"contains", doesNotContain:"does not contain", startsWith:"starts with", doesNotStartWith:"does not start with", matchesRegexp:"matches regular expression", inTheLast:"in the last", notInTheLast:"not in the last", inTheNext:"in the next", notInTheNext:"not in the next"]>`; —; `filter[condition.type] = column`;
- `search` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[condition.type] = rowSearch`;
- `column` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `filter[condition.type] = column`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[condition.type] = column` and `filter[condition.type] = column`;
- `value` — `<NUMBER>`; —; Yes; —; —; —; `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = inTheLast` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = notInTheLast` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = inTheNext` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = notInTheNext`;
- `from` — `<STRING>`; —; Yes; —; —; maxLength=1900; `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = between` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = notBetween`;
- `to` — `<STRING>`; —; Yes; —; —; maxLength=1900; `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = between` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = notBetween`;
- `unit` — `<STRING>`; —; Yes; —; `<enum:[min:"minutes", hours:"hours", days:"days", weeks:"weeks", months:"months", years:"years"]>`; —; `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = inTheLast` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = notInTheLast` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = inTheNext` or `filter[condition.type] = column` and `filter[condition.type] = column` and `filter[condition.operator] = notInTheNext`;
- `caseSensitive` — `<BOOLEAN>`; —; Yes; `N`; —; —; `filter[condition.type] = rowSearch` or `filter[condition.type] = column` and `filter[condition.operator] = contains` or `filter[condition.type] = column` and `filter[condition.operator] = doesNotContain` or `filter[condition.type] = column` and `filter[condition.operator] = startsWith` or `filter[condition.type] = column` and `filter[condition.operator] = doesNotStartWith` or `filter[condition.type] = column` and `filter[condition.operator] = matchesRegexp`;

### advanced

- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

