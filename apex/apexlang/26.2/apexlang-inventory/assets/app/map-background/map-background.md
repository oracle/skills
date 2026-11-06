# mapBackground

- componentType: `mapBackground`
- identifierRequired: true
- filePath: `shared-components/map-backgrounds.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Display Name for this Map Background.; Yes; —; —; maxLength=255; —;
- `apiKey` — `<STRING>`; —; No; —; `<enum:[staticValue:"Static Value", webCredential:"Web Credential"]>`; —; —;
- `type` — `<STRING>`; —; Yes; `VECTOR`; `<enum:[raster:"Raster XYZ Tile Layer", vector:"Vector Tile Layer", ogcWms:"OGC WMS"]>`; —; —;
- `url` — `<STRING>`; —; Yes; —; —; —; —;
- `httpHeaders` — `<STRING>`; —; No; —; —; —; —;
- `webCredential` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; `mapBackground[identification.apiKey] = webCredential`;
- `attribution` — `<STRING>`; —; No; —; —; —; `mapBackground[identification.type] = raster` or `mapBackground[identification.type] = ogcWms`;
- `staticValue` — `<STRING>`; —; Yes; —; —; —; `mapBackground[identification.apiKey] = staticValue`;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `minZoomLevel` — `<NUMBER>`; —; No; —; —; —; —;
- `maxZoomLevel` — `<NUMBER>`; —; No; —; —; —; —;

### subscription

- `master` — `<@mapBackground>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

