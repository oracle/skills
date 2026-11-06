# parameter

- componentType: `parameter`
- identifierRequired: true

## Properties

### identification (direct group)

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;

### parameter

- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", timestamp:"TIMESTAMP", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", number:"NUMBER", boolean:"BOOLEAN", clob:"CLOB"]>`; maxLength=128; —;
- `direction` — `<STRING>`; The direction of the parameter as defined within the Workflow.; Yes; `IN`; `<enum:[in:"In", out:"Out", inOut:"In/Out"]>`; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### label

- `label` — `<STRING>`; An end-user friendly name of the workflow parameter.; Yes; —; —; maxLength=4000; —;

### validation

- `required` — `<BOOLEAN>`; —; Yes; `N`; —; —; `parameter[parameter.direction] = in` or `parameter[parameter.direction] = inOut`;

### displayFormatMasks

- `sessionStateFormatMask` — `<STRING>`; —; No; —; —; maxLength=255; `parameter[parameter.dataType] = number` or `parameter[parameter.dataType] = timestamp` or `parameter[parameter.dataType] = timestampWithTimeZone` or `parameter[parameter.dataType] = timestampWithLocalTimeZone`;
- `trueValue` — `<STRING>`; —; No; —; —; maxLength=10; `parameter[parameter.dataType] = boolean`;
- `falseValue` — `<STRING>`; —; No; —; —; maxLength=10; `parameter[parameter.dataType] = boolean`;

### default

- `value` — `<STRING>`; Default value of this parameter.; No; —; —; maxLength=4000; `parameter[parameter.direction] = in` or `parameter[parameter.direction] = inOut`;

