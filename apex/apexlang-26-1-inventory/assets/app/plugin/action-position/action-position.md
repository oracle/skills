# actionPosition

- componentType: `actionPosition`
- identifierRequired: true
- filePath: `shared-components/plugins/#plugin_type#/#identifier2##theme_static_id#/action-positions.apx`
- appliesWhen: `plugin[identification.type] = templateComponent`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;
- `sequence` — `<INTEGER>`; —; Yes; —; —; —; —;
- `apexlangName` — `<STRING>`; —; Yes; —; —; maxLength=40; —;

### advanced

- `quickPick` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### position

- `type` — `<STRING>`; —; Yes; `LINK`; `<enum:[link:"Link", template:"Template"]>`; —; —;
- `predefinedTemplate` — `<@actionTemplate>`; —; No; —; —; lovType=COMPONENT; `actionPosition[position.type] = template`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

