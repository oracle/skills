# slot

- componentType: `slot`
- identifierRequired: true
- filePath: `shared-components/plugins/#plugin_type#/#identifier2##theme_static_id#/slots.apx`
- appliesWhen: `plugin[identification.type] = templateComponent`

## Properties

### supports

- `regions` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `items` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `buttons` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `regionTypes` — `<STRING>`; —; No; —; —; —; `slot[supports.regions] = Y`;
- `itemTypes` — `<STRING>`; —; No; —; —; —; `slot[supports.items] = Y`;

### gridLayout

- `gridSupport` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `maxFixedColumns` — `<INTEGER>`; —; No; —; —; —; —;
- `newRow` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### identification (direct group)

- `apexlangName` — `<STRING>`; —; Yes; —; —; maxLength=40; —;
- `name` — `<STRING>`; The name of a plug-in slot.; Yes; —; —; maxLength=30; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=30, textCase=UPPER; —;

