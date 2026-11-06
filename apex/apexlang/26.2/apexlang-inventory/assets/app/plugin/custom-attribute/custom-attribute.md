# customAttribute

- componentType: `customAttribute`
- identifierRequired: true
- filePath: `shared-components/plugins/#plugin_type#/#identifier2##theme_static_id#/custom-attributes.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Specify the label which is displayed for that attribute in the Oracle APEX Builder.; Yes; —; —; maxLength=255; —;
- `staticId` — `<STRING>`; Specify the Static ID for this attribute. For Template Components can be referenced in the template using the #STATIC_ID# syntax and                                          for other Plug-in types can be referenced in the code via p_xxxx.attributes.get_varchar2( 'my_static_id' ).; Yes; —; —; maxLength=255; —;
- `scope` — `<STRING>`; —; Yes; `COMPONENT`; `<enum:[app:"Application", component:"Component", report:"Report", reportGroup:"Report Group", regionColumn:"Region Column"]>`; —; —;
- `attribute` — `<INTEGER>`; —; Yes; —; —; —; —;
- `type` — `<STRING>`; —; Yes; `TEXT`; `<enum:[authorizationGroup, checkboxes, codeLanguage, color, column, component, credential, dataLoadDefinitionId, dataLoadTableId, emailTemplate, html, icon, integer, javaScript-mle, javaScript-mleExpressionReturningBoolean, javaScript-mleExpressionReturningVarchar2, javaScript-mleFunctionBodyReturningBoolean, javaScript-mleFunctionBodyReturningVarchar2, javaScriptCode, linkToTargetPageUrl, mapBackground, media, number, owner, plsqlCode, plsqlExpressionReturningBoolean, plsqlExpressionReturningVarchar2, plsqlFunctionBodyReturningBoolean, plsqlFunctionBodyReturningVarchar2, plsqlPackage, plsqlProcedureOrFunction, pageItem, pageItems, pageNumber, pageNumbers, regionSqlQueryColumn, reportQuery, sqlQuery, selectList, sessionStateValue, table, taskDefinition, templatePlaceholders, text, textarea, workflowDefinition, xml, yesNo, restSource, restOperation]>`; —; —;
- `apexlangName` — `<STRING>`; —; Yes; —; —; maxLength=40; —;

### dependingOn

- `attribute` — `<@customAttribute>`; —; No; —; —; lovType=COMPONENT; —;
- `conditionType` — `<STRING>`; —; Yes; —; `<enum:[=:"equal to", !=:"not equal to", inList:"in list", notInList:"not in list", isNull:"is null", isNotNull:"is not null"]>`; —; `customAttribute[dependingOn.attribute] = sample`;
- `alwaysEvaluate` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `customAttribute[dependingOn.attribute] = sample`;
- `parentAttribute` — `<@customAttribute>`; —; No; —; —; lovType=COMPONENT; `customAttribute[identification.type] = table` or `customAttribute[identification.type] = column` or `customAttribute[identification.type] = plsqlPackage` or `customAttribute[identification.type] = plsqlProcedureOrFunction` or `customAttribute[identification.type] = restOperation`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `customAttribute[dependingOn.attribute] = sample` and `customAttribute[dependingOn.conditionType] = =` or `customAttribute[dependingOn.attribute] = sample` and `customAttribute[dependingOn.conditionType] = !=`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `customAttribute[dependingOn.attribute] = sample` and `customAttribute[dependingOn.conditionType] = inList` or `customAttribute[dependingOn.attribute] = sample` and `customAttribute[dependingOn.conditionType] = notInList`;

### builder

- `common` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `showInWizard` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; `customAttribute[identification.type] = text` or `customAttribute[identification.type] = textarea` or `customAttribute[identification.type] = html` or `customAttribute[identification.type] = xml`;
- `displayWidth` — `<NUMBER>`; —; No; —; —; —; `customAttribute[identification.type] = text` or `customAttribute[identification.type] = textarea` or `customAttribute[identification.type] = number` or `customAttribute[identification.type] = integer`;
- `unit` — `<STRING>`; —; No; —; —; maxLength=30; `customAttribute[identification.type] = text` or `customAttribute[identification.type] = number` or `customAttribute[identification.type] = integer`;
- `includeColumnsInItemsPicker` — `<BOOLEAN>`; —; Yes; `COMPONENT`; —; —; `plugin[identification.type] = region` and `customAttribute[identification.type] = text` or `plugin[identification.type] = region` and `customAttribute[identification.type] = textarea` or `plugin[identification.type] = region` and `customAttribute[identification.type] = html` or `plugin[identification.type] = region` and `customAttribute[identification.type] = xml` or `plugin[identification.type] = region` and `customAttribute[identification.type] = sqlQuery` or `plugin[identification.type] = region` and `customAttribute[identification.type] = plsqlCode` or `plugin[identification.type] = region` and `customAttribute[identification.type] = plsqlExpressionReturningVarchar2` or `plugin[identification.type] = region` and `customAttribute[identification.type] = plsqlExpressionReturningBoolean` or `plugin[identification.type] = region` and `customAttribute[identification.type] = plsqlFunctionBodyReturningVarchar2` or `plugin[identification.type] = region` and `customAttribute[identification.type] = plsqlFunctionBodyReturningBoolean` or `plugin[identification.type] = region` and `customAttribute[identification.type] = javaScriptCode` or `plugin[identification.type] = region` and `customAttribute[identification.type] = pageItem` or `plugin[identification.type] = region` and `customAttribute[identification.type] = pageItems` or `plugin[identification.type] = region` and `customAttribute[identification.type] = linkToTargetPageUrl` or `plugin[identification.type] = process` and `customAttribute[identification.type] = text` or `plugin[identification.type] = process` and `customAttribute[identification.type] = textarea` or `plugin[identification.type] = process` and `customAttribute[identification.type] = html` or `plugin[identification.type] = process` and `customAttribute[identification.type] = xml` or `plugin[identification.type] = process` and `customAttribute[identification.type] = sqlQuery` or `plugin[identification.type] = process` and `customAttribute[identification.type] = plsqlCode` or `plugin[identification.type] = process` and `customAttribute[identification.type] = plsqlExpressionReturningVarchar2` or `plugin[identification.type] = process` and `customAttribute[identification.type] = plsqlExpressionReturningBoolean` or `plugin[identification.type] = process` and `customAttribute[identification.type] = plsqlFunctionBodyReturningVarchar2` or `plugin[identification.type] = process` and `customAttribute[identification.type] = plsqlFunctionBodyReturningBoolean` or `plugin[identification.type] = process` and `customAttribute[identification.type] = javaScriptCode` or `plugin[identification.type] = process` and `customAttribute[identification.type] = pageItem` or `plugin[identification.type] = process` and `customAttribute[identification.type] = pageItems` or `plugin[identification.type] = process` and `customAttribute[identification.type] = linkToTargetPageUrl`;

### advanced

- `showDeprecatedAttributeForValues` — `<STRING>`; —; No; —; —; maxLength=30; —;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### examples

- `examples` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### appearance

- `sequence` — `<NUMBER>`; Specify the display sequence for this plug-in attribute in the Oracle APEX Builder.; Yes; —; —; —; —;
- `attributeGroup` — `<@attributeGroup>`; —; No; —; —; lovType=COMPONENT; `plugin[identification.type] = templateComponent` or `plugin[identification.type] = dynamicAction` or `plugin[identification.type] = item` or `plugin[identification.type] = region` or `plugin[identification.type] = process` or `plugin[identification.type] = genAITool`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### accessibility

- `importantForAccessibility` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; `customAttribute[accessibility.importantForAccessibility] = Y`;

### templateSupport

- `type` — `<STRING>`; —; No; —; `<enum:[substitutions:"Substitutions", templateDirectivesClient:"Template Directives - Client", templateDirectivesServer:"Template Directives - Server"]>`; —; —;
- `customSubstitutions` — `<STRING>`; —; No; —; —; —; `customAttribute[templateSupport.type] = templateDirectivesClient` and `customAttribute[identification.type] = html` or `customAttribute[templateSupport.type] = templateDirectivesClient` and `customAttribute[identification.type] = textarea` or `customAttribute[templateSupport.type] = templateDirectivesServer` and `customAttribute[identification.type] = html` or `customAttribute[templateSupport.type] = templateDirectivesServer` and `customAttribute[identification.type] = textarea`;

### componentLov

- `type` — `<STRING>`; —; Yes; `STATIC`; `<enum:[static:"Static", component:"Component"]>`; —; `customAttribute[identification.type] = selectList` or `customAttribute[identification.type] = checkboxes`;
- `componentType` — `<STRING>`; —; No; —; `<enum:[credential, remoteDatabase, authenticationServer, printServer, restServer, staticWorkspaceFile, appGroup, fileServer, genAI, vectorProvider, app, theme, themeStyle, themeFile, templateOptionGroup, globalTemplateOption, pageTemplate, pageTemplateOption, pageTemplateDisplayPoint, fieldTemplate, fieldTemplateOption, buttonTemplate, buttonTemplateOption, regionTemplate, regionTemplateOption, regionTemplateDisplayPoint, listTemplate, listTemplateOption, breadcrumbTemplate, breadcrumbTemplateOption, calendarTemplate, reportTemplate, reportTemplateOption, popupLovTemplate, plugin, pluginStdAttribute, pluginAttributeGroup, pluginCustomAttribute, pluginAttributeLovEntry, pluginActionTemplate, pluginActionPosition, pluginEvent, pluginFile, pluginSlot, pluginSetting, appItem, appComputation, appProcess, buildOption, authentication, authorization, aclRole, webSrcModule, webSrcOperation, webSrcModuleParam, webSrcModuleDataProfile, webSrcModuleDataProfileColumn, webSrcSyncStep, webSrcSyncStepWsParam, shortcut, appSubstitution, staticAppFile, textMessage, appSetting, pwaShortcut, pwaScreenshot, dualityViewSource, jsonDocumentSource, dualityViewDataProfile, dualityViewDataProfileColumn, jsonCollectionDataProfile, jsonCollectionDataProfileColumn, aiAgent, aiAgentTool, aiAgentToolParam, classicNavBar, breadcrumb, breadcrumbEntry, list, listEntry, lov, lovWsParam, lovEntry, lovColumn, webServiceReference, webServiceReferenceOperation, webServiceRefOperParamI, webServiceRefOperParamO, webServiceRefOperParamA, webServiceRefOperParamH, dataLoadTable, dataLoadRule, dataLoadLookup, tabSet, reportLayout, reportQuery, reportQueryStatement, reportQueryStmtWsParam, automation, automationWsParam, automationAction, emailTemplate, dataLoadDefinition, dataLoadDefDataProfile, dataLoadDefDataProfileColumn, taskDef, taskDefParam, taskDefAction, taskDefParticipant, languageMap, dynamicTranslation, concatenatedFile, searchConfig, searchConfigWsParam, pageGroup, tree, developerComment, supportObjects, supportObjectsSubstitution, supportObjectsBuildOption, supportObjectsValidation, supportObjectsInstall, supportObjectsInstallObject, supportObjectsUpgrade, page, region, pageItem, button, dynamicActionEvent, dynamicActionAction, pageMetaTag, validation, pageComputation, pageProcess, pageProcessWsParam, branch, regionPluginAttributes, irAttributes, irColumnGroup, irColumn, irPrintAttr, irSavedReport, irSavedReportColumn, irSavedReportCompute, irSavedReportSort, irSavedReportAggregate, irSavedReportFilter, irSavedReportCtrlBreak, irSavedReportHighlight, irSavedReportChart, irSavedReportGroupBy, irSavedReportGroupByCol, irSavedReportGroupByAgg, irSavedReportGroupBySort, irSavedReportPivot, irSavedReportPivotCol, irSavedReportPivotRow, irSavedReportPivotAgg, irSavedReportPivotSort, pageProcessWsParamIn, pageProcessWsParamOut, pageProcessWsParamAuth, pageProcessInvokeApiParam, classicReport, classicReportColumn, classicReportPrintAttr, tabularForm, tabularFormColumn, tabularFormPrintAttr, classicCalendar, regionColumn, regionTmplColumn, jetChart, jetChartSeries, jetChartAxes, jetChartWsParam, igAttributes, igColumnGroup, igColumn, igPrintAttr, igSavedReport, igSavedReportColumn, igSavedReportFilter, igSavedReportSort, igSavedReportAggregate, igSavedReportCtrlBreak, igSavedReportHighlight, igSavedReportChart, regionWsParam, facet, facetGroup, facetGroupItem, sfilter, sfilterGroup, sfilterGroupItem, card, cardAction, mapRegion, mapLayer, mapLayerWsParam, mapBackground, pageProcessTaskParam, searchRegionSources, regionAction, irColumnAction, regionActionMenuEntry, irColumnActionMenuEntry, buttonMenuEntry, regionActionMenuEntryAction, regionActionButtonAction, pageButtonAction, cardButtonAction, buttonActionMenuEntryAction, irActionButtonAction, irActionMenuEntryAction, workflow, workflowParam, workflowVersion, workflowActivity, workflowVariable, workflowActivityVariable, workflowParticipant, workflowTransition, workflowBranch, workflowParallelBranch, pageProcessWfParam, wfActivityTaskParam, wfActivityInvokeApiParam, wfActivityWsParam, wfActivityWfParam, componentGroup, compGrpComponent]>`; —; `customAttribute[identification.type] = component`;
- `nullText` — `<STRING>`; —; No; —; —; maxLength=255; `customAttribute[identification.type] = selectList` and `customAttribute[validation.required] = N` or `customAttribute[identification.type] = component` and `customAttribute[validation.required] = N`;
- `onDeleteBehavior` — `<STRING>`; —; No; —; `<enum:[cascade:"Cascade", setToNull:"Set to NULL"]>`; —; `customAttribute[identification.type] = component` and `customAttribute[componentLov.componentType] = sample`;

### validation

- `required` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `maxLength` — `<NUMBER>`; —; No; —; —; —; `customAttribute[identification.type] = text` or `customAttribute[identification.type] = textarea` or `customAttribute[identification.type] = number` or `customAttribute[identification.type] = integer`;
- `minColumns` — `<NUMBER>`; —; No; —; —; —; `customAttribute[identification.type] = sqlQuery`;
- `maxColumns` — `<NUMBER>`; —; No; —; —; —; `customAttribute[identification.type] = sqlQuery`;
- `textCase` — `<STRING>`; —; No; —; `<enum:[uppercase:"Uppercase", lowercase:"Lowercase"]>`; —; `customAttribute[identification.type] = text` or `customAttribute[identification.type] = textarea`;

### supports

- `dataTypes` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"Varchar2", number:"Number", date:"Date", timestamp:"Timestamp", timestampWithTimeZone:"Timestamp with Time Zone", timestampWithLocalTimeZone:"Timestamp with Local Time Zone", intervalYearToMonth:"Interval Year to Month", intervalDayToSecond:"Interval Day to Second", blob:"Blob", clob:"Clob", bfile:"Bfile", rowid:"Rowid"]>`; —; `customAttribute[identification.type] = regionSqlQueryColumn` or `customAttribute[identification.type] = column` or `customAttribute[identification.type] = sessionStateValue`;
- `components` — `<STRING>`; —; No; —; `<enum:[pageItems:"Page Items", interactiveGridColumns:"Interactive Grid Columns", facets:"Facets", facetGroupItems:"Facet Group Items", filters:"Filters", filterGroupItems:"Filter Group Items"]>`; —; `plugin[identification.type] = item`;
- `components` — `<STRING>`; —; No; —; `<enum:[pageProcesses:"Page Processes", automationActions:"Automation Actions", taskDefinitionActions:"Task Definition Actions", workflowActivities:"Workflow Activities"]>`; —; `plugin[identification.type] = process`;

### security

- `escapeMode` — `<STRING>`; —; Yes; `HTML`; `<enum:[html:"HTML", htmlAttribute:"HTML Attribute", stripHtml:"Strip HTML", raw:"Raw"]>`; —; `plugin[identification.type] = templateComponent`;

### default

- `sampleDataValue` — `<STRING>`; —; No; —; —; maxLength=4000; `plugin[identification.type] = templateComponent` or `plugin[identification.type] = region`;
- `value` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `value` — `<BOOLEAN>`; —; Yes; `N`; —; —; `customAttribute[identification.type] = yesNo`;

