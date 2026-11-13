# pwaScreenshot

- componentType: `pwaScreenshot`
- identifierRequired: true

## Properties

### screenshot

- `sizes` — `<STRING>`; —; No; —; —; —; —;
- `formFactor` — `<STRING>`; —; No; —; `<enum:[narrow:"Narrow", wide:"Wide"]>`; —; —;
- `url` — `<STRING>`; Identifies the target URL which this PWA screenshot opens.; Yes; —; —; —; —;

### advanced

- `staticId` — `<STRING>`; Enter a unique Static ID to identify this component in API calls or refer to it in application export files. If you change the Static ID, dependent components will retain their references, but any existing API calls using the old ID must be updated manually.; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### label (direct group)

- `label` — `<STRING>`; Identify the label of the PWA screenshot that is used for accessibility purposes when installing the PWA.; Yes; —; —; maxLength=255; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

