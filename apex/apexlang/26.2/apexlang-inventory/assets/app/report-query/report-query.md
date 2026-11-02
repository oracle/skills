# reportQuery

- componentType: `reportQuery`
- identifierRequired: true
- filePath: `shared-components/report-queries/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The report query name identifies the report query. When referencing a report query as a link target, the report query name is part of the request string.; Yes; —; —; maxLength=255; —;

### sessionState

- `include` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `items` — `<STRING>`; —; No; —; —; maxLength=2000, textCase=UPPER; `reportQuery[sessionState.include] = Y`;

### advanced

- `staticId` — `<STRING>`; Use the Static ID to reference the report query in API Calls.; Yes; —; —; maxLength=255; —;

### output

- `fileName` — `<STRING>`; The report query output filename.; Yes; —; —; maxLength=4000; —;
- `viewFileAs` — `<STRING>`; —; Yes; `ATTACHMENT`; `<enum:[attachment:"Attachment", inline:"Inline"]>`; —; —;
- `layout` — `<@reportLayout>`; Chose the report layout you want to use for formatting the report query result. Generic report layouts typically work with any report query. Named Column layouts work only with the report query they were created for or report queries that have a compatible list of columns.; No; —; —; lovType=COMPONENT; —;
- `format` — `<STRING>`; —; Yes; `PDF`; `<enum:[pdf:"PDF", word:"Word", excel:"Excel", html:"HTML", powerpoint:"Powerpoint", markdown:"Markdown", csv:"CSV", openDocumentText:"Open Document Text", openDocumentSpreadsheet:"Open Document Spreadsheet", openDocumentPresentation:"Open Document Presentation"]>`; —; `app[reportPrinting.type] = remote`;
- `format` — `<STRING>`; Select the report output format. Supported formats include PDF, Microsoft Word (RTF format), Microsoft Excel (HTML format), and HTML. You can also have the output format specified by an item.; Yes; `PDF`; `<enum:[pdf:"PDF", word:"Word", excel:"Excel", html:"HTML", xml:"XML"]>`; —; `app[reportPrinting.type] = useInstanceSettings` or `app[reportPrinting.type] = remote`;
- `formatItem` — `<STRING>`; —; No; —; —; maxLength=255, textCase=UPPER; `app[reportPrinting.type] = useInstanceSettings` and `app[reportPrinting.type] = remote` or `app[reportPrinting.type] = remote` and `app[reportPrinting.type] = remote`;

