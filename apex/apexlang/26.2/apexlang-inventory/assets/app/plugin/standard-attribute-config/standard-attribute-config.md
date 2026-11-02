# standardAttributeConfig

- componentType: `standardAttributeConfig`
- identifierRequired: true
- appliesWhen: `plugin[identification.type] = item` or `plugin[identification.type] = region` or `plugin[identification.type] = process` or `plugin[identification.type] = dynamicAction` or `plugin[identification.type] = restDataSource`

## Properties

### validation

- `required` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### default

- `value` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### dependingOn

- `attribute` — `<@customAttribute>`; —; No; —; —; lovType=COMPONENT; —;
- `conditionType` — `<STRING>`; —; Yes; —; `<enum:[=:"equal to", !=:"not equal to", inList:"in list", notInList:"not in list", isNull:"is null", isNotNull:"is not null"]>`; —; `standardAttributeConfig[dependingOn.attribute] = sample`;
- `alwaysEvaluate` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `standardAttributeConfig[dependingOn.attribute] = sample`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `standardAttributeConfig[dependingOn.attribute] = sample` and `standardAttributeConfig[dependingOn.conditionType] = =` or `standardAttributeConfig[dependingOn.attribute] = sample` and `standardAttributeConfig[dependingOn.conditionType] = !=`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `standardAttributeConfig[dependingOn.attribute] = sample` and `standardAttributeConfig[dependingOn.conditionType] = inList` or `standardAttributeConfig[dependingOn.attribute] = sample` and `standardAttributeConfig[dependingOn.conditionType] = notInList`;

### help

- `helpText` — `<STRING>`; Specify help text for this plug-in attribute. The help text is displayed as context sensitive help for the attribute in the Builder.; No; —; —; maxLength=4000; —;

### examples

- `examples` — `<STRING>`; Specify examples for this plug-in attribute. The examples are displayed as part of the context sensitive help for the attribute in the Builder.; No; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; `<enum:[defaultEndpoint:"Default Endpoint", hasLov:"Has List of Values", hasInitJavaScriptCodeAttribute:"Has "Initialization JavaScript Code" Attribute", regionSourceIsHtml:"Region Source is HTML", regionSourceIsPlainText:"Region Source is Plain Text", regionSourceIsPlsqlFunctionBody:"Region Source is PL/SQL Function Body", regionSourceIsPlsqlCode:"Region Source is PL/SQL Code", regionSourceIsSqlQuery:"Region Source is SQL Query", regionSourceSupportsDifferentDataSources:"Region Source supports different Data Sources"]>`; —; `plugin[identification.type] = dynamicAction` or `plugin[identification.type] = item` or `plugin[identification.type] = region` or `plugin[identification.type] = restDataSource`;

### sqlQuery

- `minColumns` — `<INTEGER>`; —; No; —; —; —; `plugin[identification.type] = dynamicAction` and `standardAttributeConfig[identification.name] = hasLov` or `plugin[identification.type] = dynamicAction` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlFunctionBody` or `plugin[identification.type] = dynamicAction` and `standardAttributeConfig[identification.name] = regionSourceIsSqlQuery` or `plugin[identification.type] = dynamicAction` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlCode` or `plugin[identification.type] = item` and `standardAttributeConfig[identification.name] = hasLov` or `plugin[identification.type] = item` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlFunctionBody` or `plugin[identification.type] = item` and `standardAttributeConfig[identification.name] = regionSourceIsSqlQuery` or `plugin[identification.type] = item` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlCode` or `plugin[identification.type] = region` and `standardAttributeConfig[identification.name] = hasLov` or `plugin[identification.type] = region` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlFunctionBody` or `plugin[identification.type] = region` and `standardAttributeConfig[identification.name] = regionSourceIsSqlQuery` or `plugin[identification.type] = region` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlCode` or `plugin[identification.type] = restDataSource` and `standardAttributeConfig[identification.name] = hasLov` or `plugin[identification.type] = restDataSource` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlFunctionBody` or `plugin[identification.type] = restDataSource` and `standardAttributeConfig[identification.name] = regionSourceIsSqlQuery` or `plugin[identification.type] = restDataSource` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlCode`;
- `maxColumns` — `<INTEGER>`; —; No; —; —; —; `plugin[identification.type] = dynamicAction` and `standardAttributeConfig[identification.name] = hasLov` or `plugin[identification.type] = dynamicAction` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlFunctionBody` or `plugin[identification.type] = dynamicAction` and `standardAttributeConfig[identification.name] = regionSourceIsSqlQuery` or `plugin[identification.type] = dynamicAction` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlCode` or `plugin[identification.type] = item` and `standardAttributeConfig[identification.name] = hasLov` or `plugin[identification.type] = item` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlFunctionBody` or `plugin[identification.type] = item` and `standardAttributeConfig[identification.name] = regionSourceIsSqlQuery` or `plugin[identification.type] = item` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlCode` or `plugin[identification.type] = region` and `standardAttributeConfig[identification.name] = hasLov` or `plugin[identification.type] = region` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlFunctionBody` or `plugin[identification.type] = region` and `standardAttributeConfig[identification.name] = regionSourceIsSqlQuery` or `plugin[identification.type] = region` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlCode` or `plugin[identification.type] = restDataSource` and `standardAttributeConfig[identification.name] = hasLov` or `plugin[identification.type] = restDataSource` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlFunctionBody` or `plugin[identification.type] = restDataSource` and `standardAttributeConfig[identification.name] = regionSourceIsSqlQuery` or `plugin[identification.type] = restDataSource` and `standardAttributeConfig[identification.name] = regionSourceIsPlsqlCode`;

