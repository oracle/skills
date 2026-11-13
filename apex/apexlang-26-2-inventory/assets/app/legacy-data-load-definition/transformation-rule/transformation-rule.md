# transformationRule

- componentType: `transformationRule`
- identifierRequired: true
- appliesWhen: `legacyDataLoadDefinition[validation.skipValidation] = N`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### transformation

- `columnNames` — `<STRING>`; —; Yes; —; —; —; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[upperCase:"To Upper Case", lowerCase:"To Lower Case", replace:"Replace", trim:"Trim", leftTrim:"Left Trim", rightTrim:"Right Trim", singleWhitespace:"Single Whitespace", plsqlExpression:"PLSQL Expression", plsqlFunctionBody:"PLSQL Function Body", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return colon separated value)"]>`; —; —;
- `trimChars` — `<STRING>`; —; No; —; —; maxLength=4000; `transformationRule[transformation.type] = leftTrim` or `transformationRule[transformation.type] = rightTrim` or `transformationRule[transformation.type] = trim`;
- `find` — `<STRING>`; Specify the string that should be found in the column value.; Yes; —; —; maxLength=4000; `transformationRule[transformation.type] = replace`;
- `replaceWith` — `<STRING>`; Specify the string that should replace the string found in the column value.; No; —; —; maxLength=4000; `transformationRule[transformation.type] = replace`;
- `trim` — `<STRING>`; —; Yes; `both`; `<enum:[trailing:"Trailing", leading:"Leading", both:"Both"]>`; —; `transformationRule[transformation.type] = trim`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `transformationRule[transformation.type] = plsqlExpression`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `transformationRule[transformation.type] = sqlQuerySingleValue` or `transformationRule[transformation.type] = sqlQueryMultipleValues`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `transformationRule[transformation.type] = plsqlFunctionBody`;

### advanced

- `staticId` — `<STRING>`; Static ID for this search configuration. The static ID is used when using the search configuration in a programmatic context, with the APEX_SEARCH package.; Yes; —; —; maxLength=255; —;

### error

- `errorMessage` — `<STRING>`; Enter the text to be displayed if the transformation rule fails.; No; —; —; maxLength=4000; —;

### execution

- `sequence` — `<NUMBER>`; Specify the sequence for the transformation rule. The sequence determines the order of evaluation.; Yes; —; —; —; —;

