# pwaScreenshot

- componentType: `pwaScreenshot`
- identifierRequired: true

## Properties

### screenshot

- `sizes` — `<STRING>`; —; No; —; —; —; —;
- `formFactor` — `<STRING>`; —; No; —; `<enum:[narrow:"Narrow", wide:"Wide"]>`; —; —;
- `url` — `<STRING>`; —; Yes; —; —; —; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### label (direct group)

- `label` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

