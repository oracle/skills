# pwaShortcut

- componentType: `pwaShortcut`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Name of this PWA shortcut.; Yes; —; —; maxLength=255; —;
- `sequence` — `<INTEGER>`; —; Yes; —; —; —; —;

### shortcut

- `iconUrl` — `<STRING>`; Identifies the icon URL used by this PWA shortcut.; No; —; —; —; —;
- `description` — `<STRING>`; Identifies the description of the PWA shortcut.; No; —; —; maxLength=4000; —;
- `target` — `<COMPLEX>`; Identifies the target URL which this PWA shortcut opens.; Yes; —; —; —; —;

### advanced

- `staticId` — `<STRING>`; Enter a unique Static ID to identify this component in API calls or refer to it in application export files. If you change the Static ID, dependent components will retain their references, but any existing API calls using the old ID must be updated manually.; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

