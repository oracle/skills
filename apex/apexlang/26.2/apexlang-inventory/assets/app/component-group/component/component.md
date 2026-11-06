# component

- componentType: `component`
- identifierRequired: false

## Properties

### component (direct group)

- `type` — `<STRING>`; —; Yes; —; `<enum:[accessControlRole:"Access Control Role", appComputation:"Application Computation", appItem:"Application Item", appProcess:"Application Process", appSetting:"Application Setting", authentication:"Authentication", authorization:"Authorization", buildOption:"Build Option", dataLoadDefinition:"Data Load Definition", jsonDualityView:"JSON Duality View", emailTemplate:"Email Template", aiAgent:"AI Agent", jsonSource:"JSON Source", list:"List", lov:"List of Values", mapBackground:"Map Background", plugin:"Plugin", componentSetting:"Component Setting", reportLayout:"Report Layout", restDataSource:"REST Data Source", searchConfig:"Search Configuration", shortcut:"Shortcut", textMessage:"Text Message"]>`; —; —;
- `appItem` — `<@appItem>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = appItem`;
- `appProcess` — `<@appProcess>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = appProcess`;
- `appComputation` — `<@appComputation>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = appComputation`;
- `appSetting` — `<@appSetting>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = appSetting`;
- `buildOption` — `<@buildOption>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = buildOption`;
- `list` — `<@list>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = list`;
- `searchConfig` — `<@searchConfig>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = searchConfig`;
- `dataLoadDefinition` — `<@dataLoadDefinition>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = dataLoadDefinition`;
- `restDataSource` — `<@restDataSource>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = restDataSource`;
- `authenticationScheme` — `<@authentication>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = authentication`;
- `authorizationScheme` — `<@authorization>`; —; Yes; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; `component[component.type] = authorization`;
- `appAccessControlRole` — `<@role>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = accessControlRole`;
- `emailTemplate` — `<@emailTemplate>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = emailTemplate`;
- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = lov`;
- `plugIn` — `<@plugin>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = plugin`;
- `componentSettings` — `<@componentSetting>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = componentSetting`;
- `shortcut` — `<@shortcut>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = shortcut`;
- `mapBackground` — `<@mapBackground>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = mapBackground`;
- `reportLayout` — `<@reportLayout>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = reportLayout`;
- `textMessage` — `<@textMessage>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = textMessage`;
- `aiAgent` — `<@aiAgent>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = aiAgent`;
- `jsonSource` — `<@jsonSource>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = jsonSource`;
- `jsonDualityView` — `<@jsonDualityView>`; —; Yes; —; —; lovType=COMPONENT; `component[component.type] = jsonDualityView`;

