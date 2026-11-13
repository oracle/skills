# actionPosition

- componentType: `actionPosition`
- identifierRequired: true
- filePath: `shared-components/plugins/#plugin_type#/#identifier2##theme_static_id#/action-positions.apx`
- appliesWhen: `plugin[identification.type] = templateComponent`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Specify the name displayed for this action position in the Builder.; Yes; —; —; maxLength=255; —;
- `staticId` — `<STRING>`; Specify the Static ID for this action position. This ID can be referenced in the partial template using the #STATIC_ID# syntax. If the position is of type link, #STATIC_ID_ATTR# can be used to reference the link attributes entered by the developer.; Yes; —; —; maxLength=255, textCase=UPPER; —;
- `sequence` — `<INTEGER>`; Specify the display sequence for this plug-in action position in the Oracle APEX Builder.; Yes; —; —; —; —;
- `apexlangName` — `<STRING>`; —; Yes; —; —; maxLength=40; —;

### advanced

- `quickPick` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### help

- `helpText` — `<STRING>`; Specify help text for this plug-in action position. The help text is displayed as context sensitive help for the action position in the Builder.; No; —; —; maxLength=4000; —;

### position

- `type` — `<STRING>`; —; Yes; `LINK`; `<enum:[link:"Link", template:"Template"]>`; —; —;
- `predefinedTemplate` — `<@actionTemplate>`; —; No; —; —; lovType=COMPONENT; `actionPosition[position.type] = template`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

