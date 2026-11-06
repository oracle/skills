# actionTemplate

- componentType: `actionTemplate`
- identifierRequired: true
- filePath: `shared-components/plugins/#plugin_type#/#identifier2##theme_static_id#/action-templates.apx`
- appliesWhen: `plugin[identification.type] = templateComponent`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[button:"Button", menu:"Menu"]>`; —; —;
- `apexlangName` — `<STRING>`; —; Yes; —; —; maxLength=40; —;

### advanced

- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### template

- `actionTemplate` — `<STRING>`; —; Yes; —; —; maxLength=30000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

