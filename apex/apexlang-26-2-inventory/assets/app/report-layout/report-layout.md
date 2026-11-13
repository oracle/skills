# reportLayout

- componentType: `reportLayout`
- identifierRequired: true
- filePath: `shared-components/report-layouts/<filename>.apx`

## Properties

### identification (direct group)

- `type` — `<STRING>`; —; Yes; `RTF_FILE`; `<enum:[xslGeneric:"Generic Columns (XSL-FO)", rtf:"Named Columns (RTF)", xsl:"Named Columns (XSL-FO)", docx:"Named Columns (DOCX)", xlsx:"Named Columns (XLSX)", pptx:"Named Columns (PPTX)", html:"Named Columns (HTML)", markdown:"Named Columns (Markdown)", csv:"Named Columns (CSV)", txt:"Named Columns (TXT)", odt:"Named Columns (Open Document Text)", ods:"Named Columns (Open Document Spreadsheet)", odp:"Named Columns (Open Document Presentation)"]>`; —; —;
- `name` — `<STRING>`; Enter a name to identify the report layout when associating it with a report query or report region. Saved report layouts appear under Shared Components.; Yes; —; —; maxLength=4000; —;

### subscription

- `master` — `<@reportLayout>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### advanced

- `staticId` — `<STRING>`; Static ID for this report layout. The static ID is used when referencing the report layout in API Calls.; Yes; —; —; maxLength=500; —;

### file

- `fileName` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `mimeType` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `content` — `<BLOB>`; —; Yes; —; —; —; —;

### templates

- `page` — `<STRING>`; —; Yes; —; —; —; `reportLayout[identification.type] = rtf` or `reportLayout[identification.type] = xsl` or `reportLayout[identification.type] = xslGeneric`;
- `columnHeading` — `<STRING>`; —; Yes; —; —; maxLength=4000; `reportLayout[identification.type] = xslGeneric`;
- `columnWidth` — `<STRING>`; —; Yes; —; —; maxLength=4000; `reportLayout[identification.type] = xslGeneric`;
- `column` — `<STRING>`; —; Yes; —; —; maxLength=4000; `reportLayout[identification.type] = xslGeneric`;

### dataLoop

- `name` — `<STRING>`; —; No; —; —; maxLength=255; —;

