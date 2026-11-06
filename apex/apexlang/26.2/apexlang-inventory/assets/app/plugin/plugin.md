# plugin

- componentType: `plugin`
- identifierRequired: true
- filePath: `shared-components/plugins/#plugin_type#/#identifier2##theme_static_id#/plugin.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The name of your plug-in.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; `TEMPLATE COMPONENT`; `<enum:[templateComponent:"Template Component", item:"Item", region:"Region", dynamicAction:"Dynamic Action", genAITool:"Generative AI Tool", process:"Process", authenticationScheme:"Authentication Scheme", authorizationScheme:"Authorization Scheme", restDataSource:"REST Data Source", interactiveReportColumn:"Interactive Report Column"]>`; —; —;
- `apexlangName` — `<STRING>`; Enter the camelCase name for this plug-in as it appears in an APEXlang file. Caution: Changing it may prevent existing APEXlang files from being imported.; Yes; —; —; maxLength=40; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=45, textCase=UPPER; —;
- `theme` — `<@theme>`; —; No; —; —; lovType=COMPONENT; `plugin[identification.type] = templateComponent`;

### advanced

- `deprecated` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `legacy` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `filePrefix` — `<STRING>`; Determines the virtual path the Web server uses to point to the files of the plug-in. Do not specify anything to reference files which are stored with your plug-in definition in the database. For performance reasons you can also store your plug-in files on your Web Server. Use &#35\;APEX_FILES&#35\; or any valid URL to reference them.; No; —; —; maxLength=255; —;
- `quickPick` — `<BOOLEAN>`; —; Yes; `N`; —; —; `plugin[identification.type] = templateComponent`;
- `category` — `<STRING>`; —; No; —; `<enum:[component:"Component", effect:"Effect", execute:"Execute", initialize:"Initialize", miscellaneous:"Miscellaneous", navigation:"Navigation", notification:"Notification", style:"Style", builtInComponents:"Built-in Components", appComponents:"Application Components", themeComponents:"Theme Components", ai:"AI"]>`; —; `plugin[identification.type] = dynamicAction`;
- `substituteAttributeValues` — `<BOOLEAN>`; —; Yes; `N`; —; —; `plugin[callbacks.apiInterface] = function` or `plugin[callbacks.apiInterface] = procedureWithLegacyAttributes`;

### subscription

- `master` — `<@plugin>`; —; No; —; —; lovType=COMPONENT; —;
- `subscribeComponentSettings` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `plugin[subscription.master] = sample`;

### information

- `version` — `<STRING>`; —; No; —; —; maxLength=30; —;
- `aboutUrl` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### aiTool

- `executionLocation` — `<STRING>`; —; Yes; `SERVER`; `<enum:[clientSide:"Client-side", serverSide:"Server-side"]>`; —; `plugin[identification.type] = genAITool`;
- `supportedExecutionPoints` — `<STRING>`; —; Yes; `ON_DEMAND`; `<enum:[augmentSystemPrompt:"Augment System Prompt", onDemand:"On Demand"]>`; —; `plugin[identification.type] = genAITool`;

### source

- `sampleData` — `<STRING>`; —; No; —; `<enum:[employees:"Employees", tasks:"Tasks", products:"Products", projects:"Projects"]>`; —; `plugin[identification.type] = region` or `plugin[identification.type] = templateComponent`;
- `plsqlCode` — `<STRING>`; —; No; —; —; —; `plugin[identification.type] = region` or `plugin[identification.type] = dynamicAction` or `plugin[identification.type] = process` or `plugin[identification.type] = authorizationScheme` or `plugin[identification.type] = authenticationScheme` or `plugin[identification.type] = item` or `plugin[identification.type] = restDataSource` or `plugin[identification.type] = genAITool`;

### component

- `standardAttributes` — `<STRING>`; —; No; —; `<enum:[rowSelection:"Has Row Selection Support", regionTemplateAttr:"Has Region Template Attribute"]>`; —; `plugin[identification.type] = templateComponent`;
- `supports` — `<STRING>`; —; Yes; `APEX_APPLICATION_PAGE_ITEMS:APEX_APPL_PAGE_IG_COLUMNS`; `<enum:[pageItems:"Page Items", interactiveGridColumns:"Interactive Grid Columns", facets:"Facets", facetGroupItems:"Facet Group Items", filters:"Filters", filterGroupItems:"Filter Group Items"]>`; —; `plugin[identification.type] = item`;
- `supports` — `<STRING>`; —; Yes; `APEX_APPLICATION_PAGE_PROC:APEX_APPL_AUTOMATION_ACTIONS:APEX_APPL_TASKDEF_ACTIONS:APEX_APPL_WORKFLOW_ACTIVITIES`; `<enum:[pageProcesses:"Page Processes", automationActions:"Automation Actions", taskDefinitionActions:"Task Definition Actions", workflowActivities:"Workflow Activities"]>`; —; `plugin[identification.type] = process`;
- `standardAttributes` — `<STRING>`; —; No; —; `<enum:[visibleWidget, standardFormElement, sessionStateChangeable, readOnlyAttr, escapeSpecialCharsAttr, quickPickAttrs, sourceAttrs, formatMaskDateOnly, formatMaskNumberOnly, elementAttrs, widthAttrs, heightAttr, elementOptionAttr, placeholderAttr, iconAttr, encryptSessionStateAttr, listOfValues, lovDisplayNullAttrs, cascadingLovAttrs, joinLovforColumnDisplay, filter, link, initJavascriptCodeAttr, facetGatherOccurrences, facetShowSelectedFirst, facetMaxDisplayedEntries, facetClientSideFiltering, facetLovDisplayNullValue, aiEnabled, configurableAiEnabled, configurableAiSystemPrompt, requiresAiChatWidget, alwaysMultipleValues, optionalMultipleValues]>`; —; `plugin[identification.type] = item`;
- `standardAttributes` — `<STRING>`; —; No; —; `<enum:[regionSourceSupportsDifferentDataSources, regionSourceIsSqlQuery, regionSourceIsPlsqlCode, regionSourceIsPlsqlFunctionBody, regionSourceIsHtml, regionSourceIsPlainText, pageItemsToSubmitAttr, orderByAttr, noOfFetchedRowsAttr, noDataFoundMessageAttr, escapeSpecialCharsRegionAttr, initJavascriptCodeAttr, regionColumns, headingColumnAttr, headingAlignmentColumnAttr, alignmentColumnAttr, cssClassColumnAttr, customAttrsColumnAttr, escapeSpecialCharsColumnAttr, supportsFacetedSearchSmartFilters, lazyLoading, lazyLoadingAlways, isEditable, aiEnabled, configurableAiEnabled, configurableAiSystemPrompt, requiresAiChatWidget]>`; —; `plugin[identification.type] = region`;
- `standardAttributes` — `<STRING>`; —; No; —; `<enum:[forItem:"For Item(s)", forButton:"For Button", forRegion:"For Region", forJquerySelector:"For jQuery Selector", forJavaScriptExpression:"For JavaScript Expression", forTriggeringElement:"For Triggering Element", forEventSource:"For Event Source", affectedElementRequired:"Affected Element Required", defaultFireOnInitialization:"Check "Fire on Initialization"", stopExecutionOnErrorAttr:"Has "Stop Execution on Error" Attribute", waitForResultAttr:"Has "Wait For Result" Attribute", initJavascriptCodeAttr:"Has "Initialization JavaScript Code" Attribute", aiEnabled:"AI Enabled", configurableAiEnabled:"Configurable "AI Enabled"", configurableAiSystemPrompt:"Configurable "AI System Prompt"", requiresAiChatWidget:"Requires AI Chat Widget"]>`; —; `plugin[identification.type] = dynamicAction`;
- `standardAttributes` — `<STRING>`; —; No; —; `<enum:[sessionNotValidAttr:"Has Session not Valid Attribute", hasLoginPage:"Has Login Page In Application"]>`; —; `plugin[identification.type] = authenticationScheme`;
- `standardAttributes` — `<STRING>`; —; No; —; `<enum:[defaultEndpoint:"Default Endpoint", doNotTestEndpoint:"Do Not Test Endpoint"]>`; —; `plugin[identification.type] = restDataSource`;
- `standardAttributes` — `<STRING>`; —; No; —; `<enum:[region:"Region", regionRequired:"Region Required", waitForCompletion:"Wait For Completion", form:"Form", aiEnabled:"AI Enabled", configurableAiEnabled:"Configurable "AI Enabled"", configurableAiSystemPrompt:"Configurable "AI System Prompt""]>`; —; `plugin[identification.type] = process`;
- `supportsSessionStateDataTypes` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", clob:"CLOB", boolean:"BOOLEAN"]>`; —; `plugin[identification.type] = item`;

### templateComponent

- `availableAs` — `<STRING>`; —; No; —; `<enum:[partial:"Single (Partial)", report:"Multiple (Report)", regionOnly:"Region Only"]>`; —; `plugin[identification.type] = templateComponent`;
- `partial` — `<STRING>`; —; No; —; —; —; `plugin[identification.type] = templateComponent`;
- `translateTemplates` — `<BOOLEAN>`; —; Yes; `N`; —; —; `plugin[identification.type] = templateComponent`;
- `defaultEscapeMode` — `<STRING>`; —; Yes; `HTML`; `<enum:[html:"HTML", htmlAttribute:"HTML Attribute", stripHtml:"Strip HTML", raw:"Raw"]>`; —; `plugin[identification.type] = templateComponent`;
- `reportGroup` — `<STRING>`; —; No; —; —; —; `plugin[identification.type] = templateComponent` and `plugin[templateComponent.availableAs] = report`;
- `reportBody` — `<STRING>`; —; No; —; —; —; `plugin[identification.type] = templateComponent` and `plugin[templateComponent.availableAs] = report`;
- `reportRow` — `<STRING>`; —; No; —; —; —; `plugin[identification.type] = templateComponent` and `plugin[templateComponent.availableAs] = report`;
- `numberOfLazyLoadingSkeletons` — `<INTEGER>`; —; No; —; —; —; `plugin[identification.type] = templateComponent` and `plugin[templateComponent.availableAs] = report`;
- `reportContainer` — `<STRING>`; —; No; —; —; —; `plugin[identification.type] = templateComponent` and `plugin[templateComponent.availableAs] = report`;

### callbacks

- `apiInterface` — `<STRING>`; —; Yes; `3`; `<enum:[procedure:"Procedure", procedureWithLegacyAttributes:"Procedure with Legacy Attributes", function:"Function"]>`; —; —;
- `metaDataProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = item`;
- `sessionSentryProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = authenticationScheme`;
- `invalidSessionProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = authenticationScheme`;
- `authenticationProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = authenticationScheme`;
- `postLogoutProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = authenticationScheme`;
- `ajaxProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = authenticationScheme` or `plugin[identification.type] = dynamicAction` or `plugin[identification.type] = region` or `plugin[identification.type] = item`;
- `validationProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = item`;
- `restSourceCapabilitiesProcedure` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = restDataSource`;
- `restSourceFetchProcedure` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = restDataSource`;
- `restSourceDmlProcedure` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = restDataSource`;
- `restSourceExecuteProcedure` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = restDataSource`;
- `restSourceDiscoverProcedure` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = restDataSource`;
- `aiRequestHandlerProcedure` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = region` and `plugin[identification.type] = region` and `plugin[component.standardAttributes] = configurableAiEnabled` or `plugin[identification.type] = region` and `plugin[identification.type] = region` and `plugin[component.standardAttributes] = aiEnabled` or `plugin[identification.type] = item` and `plugin[identification.type] = item` and `plugin[component.standardAttributes] = configurableAiEnabled` or `plugin[identification.type] = item` and `plugin[identification.type] = item` and `plugin[component.standardAttributes] = aiEnabled` or `plugin[identification.type] = dynamicAction` and `plugin[identification.type] = dynamicAction` and `plugin[component.standardAttributes] = configurableAiEnabled` or `plugin[identification.type] = dynamicAction` and `plugin[identification.type] = dynamicAction` and `plugin[component.standardAttributes] = aiEnabled`;
- `aiResponseHandlerProcedure` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = region` and `plugin[identification.type] = region` and `plugin[component.standardAttributes] = configurableAiEnabled` or `plugin[identification.type] = region` and `plugin[identification.type] = region` and `plugin[component.standardAttributes] = aiEnabled` or `plugin[identification.type] = item` and `plugin[identification.type] = item` and `plugin[component.standardAttributes] = configurableAiEnabled` or `plugin[identification.type] = item` and `plugin[identification.type] = item` and `plugin[component.standardAttributes] = aiEnabled` or `plugin[identification.type] = dynamicAction` and `plugin[identification.type] = dynamicAction` and `plugin[component.standardAttributes] = configurableAiEnabled` or `plugin[identification.type] = dynamicAction` and `plugin[identification.type] = dynamicAction` and `plugin[component.standardAttributes] = aiEnabled`;
- `completionFunctionProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = process` and `plugin[component.standardAttributes] = waitForCompletion`;
- `renderProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = dynamicAction` or `plugin[identification.type] = item` or `plugin[identification.type] = region` or `plugin[identification.type] = genAITool` and `plugin[identification.type] = genAITool` and `plugin[aiTool.executionLocation] = clientSide`;
- `executionFunctionProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = authorizationScheme` or `plugin[identification.type] = process` or `plugin[identification.type] = genAITool` and `plugin[identification.type] = genAITool` and `plugin[aiTool.executionLocation] = serverSide`;
- `terminationFunctionProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; `plugin[identification.type] = process` and `plugin[component.standardAttributes] = waitForCompletion`;

### defaultSlots

- `regions` — `<STRING>`; —; No; —; —; lovType=SLOTS; `plugin[identification.type] = templateComponent`;
- `items` — `<STRING>`; —; No; —; —; lovType=SLOTS; `plugin[identification.type] = templateComponent`;
- `buttons` — `<STRING>`; —; No; —; —; lovType=SLOTS; `plugin[identification.type] = templateComponent`;

### onDemand

- `description` — `<STRING>`; —; No; —; —; —; `plugin[identification.type] = genAITool` and `plugin[aiTool.supportedExecutionPoints] = onDemand`;
- `parameters` — `<STRING>`; —; Yes; `NO_PARAMETERS`; `<enum:[noParameters:"No Parameters", definedByAiTool:"Defined by AI Tool", definedByPlugIn:"Defined by Plug-in"]>`; —; `plugin[identification.type] = genAITool` and `plugin[aiTool.supportedExecutionPoints] = onDemand`;
- `parametersJsonSchema` — `<STRING>`; —; Yes; —; —; —; `plugin[identification.type] = genAITool` and `plugin[aiTool.supportedExecutionPoints] = onDemand` and `plugin[onDemand.parameters] = definedByPlugIn`;

### javaScript

- `fileUrls` — `<STRING>`; Enter JavaScript file URLs for code to be loaded with this plug-in. Each URL has to be written on a new line. If you provide a minified version of your file you can use the substitution string #MIN# to include .min, or #MIN_DIRECTORY# to include minified/ in your file URL for a regular page view, and an empty string if the page is viewed in debug mode. You also have access to the substitution string #PLUGIN_FILES# to substitute the value of the plug-in's file prefix. JavaScript file URLs you enter here will be emitted within the #GENERATED_JAVASCRIPT# substitution string in the page template. Note: You do not need to include opening or closing script tags, just the file URL.; No; —; —; maxLength=4000; `plugin[identification.type] = region` or `plugin[identification.type] = dynamicAction` or `plugin[identification.type] = item` or `plugin[identification.type] = templateComponent` or `plugin[identification.type] = genAITool` and `plugin[identification.type] = genAITool` and `plugin[aiTool.executionLocation] = clientSide`;

### css

- `fileUrls` — `<STRING>`; Enter Cascading Style Sheet file URLs to be loaded with this plug-in. Each URL has to be written on a new line. If you provide a minified version of your file you can use the substitution string #MIN# to include .min, or #MIN_DIRECTORY# to include minified/ in your file URL for a regular page view, and an empty string if the page is viewed in debug mode. You also have access to the substitution string #PLUGIN_FILES# to substitute with the value of the plug-in's file prefix. File URLs you enter here will be emitted within the #APEX_CSS# substitution string in the page template. Note: You do not need to include opening or closing link tags, just the file URL.; No; —; —; maxLength=4000; `plugin[identification.type] = region` or `plugin[identification.type] = dynamicAction` or `plugin[identification.type] = item` or `plugin[identification.type] = templateComponent` or `plugin[identification.type] = genAITool` and `plugin[identification.type] = genAITool` and `plugin[aiTool.executionLocation] = clientSide`;

