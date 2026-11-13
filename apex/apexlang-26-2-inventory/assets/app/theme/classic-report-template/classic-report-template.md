# classicReportTemplate

- componentType: `classicReportTemplate`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/classic-report-templates/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The display name of this template.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; No; —; `<enum:[genericColumns:"Generic Columns (column template)", namedColumn:"Named Column (row template)"]>`; —; —;
- `templateClass` — `<STRING>`; —; No; —; `<enum:[borderless:"Borderless", horizontalBorder:"Horizontal Border", oneColumnUnorderedList:"One Column Unordered List", standard:"Standard", standardAlternatingRowColors:"Standard, Alternating Row Colors", valueAttributePairs:"Value Attribute Pairs", custom1:"Custom 1", custom2:"Custom 2", custom3:"Custom 3", custom4:"Custom 4", custom5:"Custom 5", custom6:"Custom 6", custom7:"Custom 7", custom8:"Custom 8"]>`; —; —;

### javaScript

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `executeWhenPageLoads` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### advanced

- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; —; No; —; —; maxLength=255; —;

### templateOptions

- `preset` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;
- `default` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;

### subscription

- `master` — `<@classicReportTemplate>`; —; No; —; `<enum:[@/8842.262/universal-theme/alerts, @/8842.262/universal-theme/badge-list, @/8842.262/universal-theme/cards, @/8842.262/universal-theme/comments, @/8842.262/universal-theme/content-row, @/8842.262/universal-theme/contextual-info, @/8842.262/universal-theme/media-list, @/8842.262/universal-theme/search-results, @/8842.262/universal-theme/standard, @/8842.262/universal-theme/timeline, @/8842.262/universal-theme/value-attribute-pairs-column, @/8842.262/universal-theme/value-attribute-pairs-row]>`; —; —;
- `master` — `<@classicReportTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### reportTemplate

- `bottom` — `<STRING>`; —; No; —; —; —; —;
- `top` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns` or `classicReportTemplate[identification.type] = namedColumn`;

### pagination

- `template` — `<STRING>`; —; No; —; —; —; —;
- `nextPage` — `<STRING>`; —; No; —; —; —; —;
- `previousPage` — `<STRING>`; —; No; —; —; —; —;
- `nextSet` — `<STRING>`; —; No; —; —; —; —;
- `previousSet` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### css

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### columnTemplates

- `beforeHeading` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns`;
- `heading` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns` or `classicReportTemplate[identification.type] = namedColumn`;
- `afterHeading` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns`;
- `beforeEachRow` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns`;

### columnTemplate1

- `template` — `<STRING>`; —; Yes; —; —; —; `classicReportTemplate[identification.type] = genericColumns`;
- `conditionType` — `<STRING>`; —; No; —; `<enum:[plsqlExpression:"Use Based on PL/SQL Expression", evenRowNos:"Use for Even Numbered Rows", oddRowNos:"Use for Odd Numbered Rows"]>`; —; `classicReportTemplate[identification.type] = genericColumns` and `classicReportTemplate[columnTemplate1.template] = sample`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicReportTemplate[identification.type] = genericColumns` and `classicReportTemplate[columnTemplate1.template] = sample` and `classicReportTemplate[columnTemplate1.conditionType] = plsqlExpression`;

### columnTemplate2

- `template` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns`;
- `conditionType` — `<STRING>`; —; No; —; `<enum:[plsqlExpression:"Use Based on PL/SQL Expression", evenRowNos:"Use for Even Numbered Rows", oddRowNos:"Use for Odd Numbered Rows"]>`; —; `classicReportTemplate[identification.type] = genericColumns` and `classicReportTemplate[columnTemplate2.template] = sample`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicReportTemplate[identification.type] = genericColumns` and `classicReportTemplate[columnTemplate2.template] = sample` and `classicReportTemplate[columnTemplate2.conditionType] = plsqlExpression`;

### columnTemplate3

- `template` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns`;
- `conditionType` — `<STRING>`; —; No; —; `<enum:[plsqlExpression:"Use Based on PL/SQL Expression", evenRowNos:"Use for Even Numbered Rows", oddRowNos:"Use for Odd Numbered Rows"]>`; —; `classicReportTemplate[identification.type] = genericColumns` and `classicReportTemplate[columnTemplate3.template] = sample`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicReportTemplate[identification.type] = genericColumns` and `classicReportTemplate[columnTemplate3.template] = sample` and `classicReportTemplate[columnTemplate3.conditionType] = plsqlExpression`;

### columnTemplate4

- `template` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns`;
- `conditionType` — `<STRING>`; —; No; —; `<enum:[plsqlExpression:"Use Based on PL/SQL Expression", evenRowNos:"Use for Even Numbered Rows", oddRowNos:"Use for Odd Numbered Rows"]>`; —; `classicReportTemplate[identification.type] = genericColumns` and `classicReportTemplate[columnTemplate4.template] = sample`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicReportTemplate[identification.type] = genericColumns` and `classicReportTemplate[columnTemplate4.template] = sample` and `classicReportTemplate[columnTemplate4.conditionType] = plsqlExpression`;

### rowTemplate1

- `template` — `<STRING>`; —; Yes; —; —; —; `classicReportTemplate[identification.type] = namedColumn`;
- `conditionType` — `<STRING>`; —; No; —; `<enum:[plsqlExpression:"Use Based on PL/SQL Expression", evenRowNos:"Use for Even Numbered Rows", oddRowNos:"Use for Odd Numbered Rows"]>`; —; `classicReportTemplate[identification.type] = namedColumn` and `classicReportTemplate[rowTemplate1.template] = sample`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicReportTemplate[identification.type] = namedColumn` and `classicReportTemplate[rowTemplate1.template] = sample` and `classicReportTemplate[rowTemplate1.conditionType] = plsqlExpression`;

### rowTemplate2

- `template` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = namedColumn`;
- `conditionType` — `<STRING>`; —; No; —; `<enum:[plsqlExpression:"Use Based on PL/SQL Expression", evenRowNos:"Use for Even Numbered Rows", oddRowNos:"Use for Odd Numbered Rows"]>`; —; `classicReportTemplate[identification.type] = namedColumn` and `classicReportTemplate[rowTemplate2.template] = sample`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicReportTemplate[identification.type] = namedColumn` and `classicReportTemplate[rowTemplate2.template] = sample` and `classicReportTemplate[rowTemplate2.conditionType] = plsqlExpression`;

### rowTemplate3

- `template` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = namedColumn`;
- `conditionType` — `<STRING>`; —; No; —; `<enum:[plsqlExpression:"Use Based on PL/SQL Expression", evenRowNos:"Use for Even Numbered Rows", oddRowNos:"Use for Odd Numbered Rows"]>`; —; `classicReportTemplate[identification.type] = namedColumn` and `classicReportTemplate[rowTemplate3.template] = sample`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicReportTemplate[identification.type] = namedColumn` and `classicReportTemplate[rowTemplate3.template] = sample` and `classicReportTemplate[rowTemplate3.conditionType] = plsqlExpression`;

### rowTemplate4

- `template` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = namedColumn`;
- `conditionType` — `<STRING>`; —; No; —; `<enum:[plsqlExpression:"Use Based on PL/SQL Expression", evenRowNos:"Use for Even Numbered Rows", oddRowNos:"Use for Odd Numbered Rows"]>`; —; `classicReportTemplate[identification.type] = namedColumn` and `classicReportTemplate[rowTemplate4.template] = sample`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicReportTemplate[identification.type] = namedColumn` and `classicReportTemplate[rowTemplate4.template] = sample` and `classicReportTemplate[rowTemplate4.conditionType] = plsqlExpression`;

### rowTemplates

- `afterEachRow` — `<STRING>`; —; No; —; —; —; `classicReportTemplate[identification.type] = genericColumns`;

### rowHighlighting

- `checkedRow` — `<STRING>`; —; No; —; —; maxLength=255; `classicReportTemplate[identification.type] = genericColumns`;
- `currentRow` — `<STRING>`; —; No; —; —; maxLength=255; `classicReportTemplate[identification.type] = genericColumns`;

