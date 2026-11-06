# pwaShortcut

- componentType: `pwaShortcut`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `sequence` — `<INTEGER>`; —; Yes; —; —; —; —;

### shortcut

- `iconUrl` — `<STRING>`; —; No; —; —; —; —;
- `description` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `target` — `<COMPLEX>`; —; Yes; —; —; —; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

