# reportQuery

- componentType: `reportQuery`
- identifierRequired: true
- filePath: `shared-components/report-queries.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### sessionState

- `include` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `items` — `<STRING>`; —; No; —; —; maxLength=2000, textCase=UPPER; `reportQuery[sessionState.include] = Y`;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### output

- `fileName` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `viewFileAs` — `<STRING>`; —; Yes; `ATTACHMENT`; `<enum:[attachment:"Attachment", inline:"Inline"]>`; —; —;
- `layout` — `<@reportLayout>`; —; No; —; —; lovType=COMPONENT; —;
- `format` — `<STRING>`; —; Yes; `PDF`; `<enum:[pdf:"PDF", word:"Word", excel:"Excel", html:"HTML", powerpoint:"Powerpoint", markdown:"Markdown", csv:"CSV", openDocumentText:"Open Document Text", openDocumentSpreadsheet:"Open Document Spreadsheet", openDocumentPresentation:"Open Document Presentation"]>`; —; `app[reportPrinting.type] = remote`;
- `format` — `<STRING>`; —; Yes; `PDF`; `<enum:[pdf:"PDF", word:"Word", excel:"Excel", html:"HTML", xml:"XML"]>`; —; `app[reportPrinting.type] = useInstanceSettings` or `app[reportPrinting.type] = remote`;
- `formatItem` — `<STRING>`; —; No; —; —; maxLength=255, textCase=UPPER; `app[reportPrinting.type] = useInstanceSettings` and `app[reportPrinting.type] = remote` or `app[reportPrinting.type] = remote` and `app[reportPrinting.type] = remote`;

