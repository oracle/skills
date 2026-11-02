# legacyDataLoadDefinition

- componentType: `legacyDataLoadDefinition`
- identifierRequired: true
- filePath: `shared-components/legacy-data-load-definitions/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### target

- `tableOwner` — `<STRING>`; —; No; —; —; —; —;
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;

### subscription

- `master` — `<@dataLoadDefinition>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `columnAliasesLov` — `<@lov>`; —; No; —; —; lovType=COMPONENT; —;
- `wizardPageIds` — `<STRING>`; —; No; —; —; —; —;

### validation

- `skipValidation` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `versionColumn` — `<STRING>`; —; No; —; —; —; `legacyDataLoadDefinition[validation.skipValidation] = N`;

### uniqueKeys

- `uniqueColumn1` — `<STRING>`; —; Yes; —; —; —; —;
- `isUk1CaseSensitive` — `<BOOLEAN>`; —; Yes; `N`; —; —; `legacyDataLoadDefinition[uniqueKeys.uniqueColumn1] = sample`;
- `uniqueColumn2` — `<STRING>`; —; No; —; —; —; `legacyDataLoadDefinition[uniqueKeys.uniqueColumn1] = sample`;
- `isUk2CaseSensitive` — `<BOOLEAN>`; —; Yes; `N`; —; —; `legacyDataLoadDefinition[uniqueKeys.uniqueColumn1] = sample` and `legacyDataLoadDefinition[uniqueKeys.uniqueColumn2] = sample`;
- `uniqueColumn3` — `<STRING>`; —; No; —; —; —; `legacyDataLoadDefinition[uniqueKeys.uniqueColumn1] = sample` and `legacyDataLoadDefinition[uniqueKeys.uniqueColumn2] = sample`;
- `isUk3CaseSensitive` — `<BOOLEAN>`; —; Yes; `N`; —; —; `legacyDataLoadDefinition[uniqueKeys.uniqueColumn1] = sample` and `legacyDataLoadDefinition[uniqueKeys.uniqueColumn2] = sample` and `legacyDataLoadDefinition[uniqueKeys.uniqueColumn3] = sample`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

