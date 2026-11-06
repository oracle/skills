# app

- componentType: `app`
- identifierRequired: true
- filePath: `application.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Provides a short descriptive name for the application to distinguish it from other applications in your development environment.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; `STANDARD`; `<enum:[standard:"Standard", library:"Library", boilerplate:"Boilerplate", theme:"Theme"]>`; —; —;
- `version` — `<STRING>`; —; Yes; `Release 1.0`; —; maxLength=255; —;
- `group` — `<@appGroup>`; —; No; —; —; lovType=COMPONENT; —;
- `alias` — `<STRING>`; Assigns an alternate alphanumeric application identifier. You can use this identifier in place of the application ID. When the Friendly URLs setting is enabled, the alias must be unique within the same workspace. When the Friendly URLs setting is disabled, the alias must be unique across all workspaces.; Yes; —; —; maxLength=80, textCase=UPPER; —;

### databaseSession

- `initPlsqlCode` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `cleanupPlsqlCode` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `parsingSchema` — `<STRING>`; —; No; —; —; maxLength=128; —;
- `mleEnvironment` — `<STRING>`; —; No; —; —; maxLength=255; —;

### security

- `enableDictation` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `allowBotAccess` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `referrerPolicy` — `<STRING>`; —; Yes; `strict-origin`; `<enum:[noReferrer:"no-referrer", noReferrerWhenDowngrade:"no-referrer-when-downgrade", origin:"origin", originWhenCrossOrigin:"origin-when-cross-origin", sameOrigin:"same-origin", strictOrigin:"strict-origin", strictOriginWhenCrossOrigin:"strict-origin-when-cross-origin", unsafeUrl:"unsafe-url"]>`; —; —;
- `htmlEscapingMode` — `<STRING>`; —; Yes; `E`; `<enum:[basic:"Basic", extended:"Extended"]>`; —; —;
- `httpResponseHeaders` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `runtimeApiUsage` — `<STRING>`; —; No; —; `<enum:[modifyThisApp:"Modify This Application", modifyOtherApps:"Modify Other Applications", modifyWorkspaceRepository:"Modify Workspace Repository"]>`; —; —;
- `deepLinking` — `<STRING>`; —; Yes; `N`; `<enum:[true:"Enabled", false:"Disabled"]>`; —; —;
- `embedInFrames` — `<STRING>`; —; Yes; `D`; `<enum:[deny:"Deny", allowSameOrigin:"Allow from same origin", allow:"Allow"]>`; —; —;
- `browserCache` — `<STRING>`; —; Yes; `N`; `<enum:[true:"Enabled", false:"Disabled"]>`; —; —;

### globalization

- `documentDirection` — `<STRING>`; —; No; —; `<enum:[leftToRight:"Left-To-Right", rightToLeft:"Right-To-Left"]>`; —; —;
- `primaryLanguage` — `<STRING>`; —; Yes; `en`; `<enum:[af, sq, ar-dz, ar-bh, ar-eg, ar-iq, ar-jo, ar-kw, ar-lb, ar-ly, ar-ma, ar-om, ar-qa, ar-sa, ar-sy, ar-tn, ar-ae, ar-ye, ar, hy, as, az, eu, be, bn, ba, bg, km, ca, zh-cn, zh-hk, zh-mo, zh-sg, zh-tw, zh, hr, cs, da, nl-be, nl, en-au, en-bz, en-ca, en-ie, en-jm, en-nz, en-ph, en-za, en-tt, en-gb, en-us, en-zw, en, et, mk, fo, fa, fi, fr-be, fr-ca, fr, fr-lu, fr-mc, fr-ch, gd, gl, de-at, de, de-li, de-lu, de-ch, el, gu, he, hi, hu, is, id, ga, it, it-ch, ja, kn, kk, kok, ko, kz, lv, lt, ms, ml, mt, mr, me, ne, nb-no, no, nn-no, or, pl, pt-br, pt, pa, ro, ru-md, ru, sr-cyrl, sr-latn, sr, sk, sl, es-ar, es-bo, es-cl, es-co, es-cr, es-do, es-ec, es-sv, es-gt, es-hn, es-mx, es-ni, es-pa, es-py, es-pe, es-pr, es, es-us, es-uy, es-ve, sw, sv-fi, sv, ta, te, th, tr, uk, ur, uz, vi, cy]>`; —; —;
- `languageDerivedFrom` — `<STRING>`; —; Yes; `FLOW_PRIMARY_LANGUAGE`; `<enum:[notTranslated:"No NLS (Application not translated)", appPrimaryLanguage:"Application Primary Language", browserPreference:"Browser (use browser language preference)", appPreference:"Application Preference (use FSP_LANGUAGE_PREFERENCE)", itemPreference:"Item Preference (use item containing preference)", session:"Session"]>`; —; —;
- `autoTimeZone` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `autoCsvEncoding` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `translationMethod` — `<STRING>`; —; No; —; `<enum:[translationApps:"Translation Applications", textMessages:"Text Message-Based Translation"]>`; —; —;

### advanced

- `passEcid` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `exactSubstitutions` — `<BOOLEAN>`; —; No; `Y`; —; —; —;
- `copyrightBanner` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `faviconHtml` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `maxBackgroundPageProcessJobs` — `<INTEGER>`; —; No; —; —; —; —;
- `opentelemetryProductFamily` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `modernizeApp` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `emailFromAddress` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `appBuilderIconName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `vacationRuleProcedureName` — `<STRING>`; Specify the name of a PL/SQL procedure in the format schemaName.packageName.procedureName. The procedure is expected to return alternate participants for task definitions in this application. The vacation rule procedure should implement the following interface.      procedure my_vacation_rule (         p_param    in apex_human_task.t_vacation_rule_input,         p_result  out apex_human_task.t_vacation_rule_result )\;  The procedure input is of type apex_human_task.t_vacation_rule_input and the result output is of type apex_human_task.t_vacation_rule_result ; No; —; —; maxLength=500; —;
- `mediaType` — `<STRING>`; —; No; —; —; maxLength=255; —;

### runtime

- `friendlyUrls` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `allowFeedback` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `logging` — `<BOOLEAN>`; —; Yes; `YES`; —; —; —;
- `debugging` — `<BOOLEAN>`; —; Yes; `0`; —; —; —;
- `compatibilityMode` — `<STRING>`; —; Yes; `26.1`; `<enum:[26.1:"26.1 to 26.2", 24.2:"24.2", 21.2:"21.2 to 24.1", 19.2-20.1-20.2-21.1:"19.2 / 20.1 / 20.2 / 21.1", 19.1:"19.1", 5.1-18.1-18.2:"5.1 / 18.1 / 18.2", 5.0:"5.0", 4.2:"4.2", 4.1:"4.1", 4.0:"Pre 4.1"]>`; —; —;
- `accessibleReadOnlyItems` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### proxy

- `proxyServer` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `noProxyDomains` — `<STRING>`; —; No; —; —; maxLength=500; `app[proxy.proxyServer] = sample`;

### rowSearch

- `tokenize` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `textQueryFunction` — `<STRING>`; —; No; —; `<enum:[searchEngine:"Search Engine", expertSearch:"Expert Search", custom:"Custom"]>`; —; —;
- `customFunctionName` — `<STRING>`; —; Yes; —; —; maxLength=500; `app[rowSearch.textQueryFunction] = custom`;

### availability

- `status` — `<STRING>`; —; Yes; `AVAILABLE_W_EDIT_LINK`; `<enum:[available:"Available", availableWithDevToolbar:"Available with Developer Toolbar", availableDevsOnly:"Available to Developers Only", restricted:"Restricted Access", unavailable:"Unavailable", unavailableStatusShownWithPlsql:"Unavailable (Status Shown with PL/SQL)", unavailableRedirectToUrl:"Unavailable (Redirect to URL)"]>`; —; —;
- `globalNotificationMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `message` — `<STRING>`; —; Yes; —; —; maxLength=4000; `app[availability.status] = unavailable` or `app[availability.status] = unavailableStatusShownWithPlsql` or `app[availability.status] = unavailableRedirectToUrl`;
- `buildStatus` — `<STRING>`; —; Yes; `RUN_AND_BUILD`; `<enum:[runOnly:"Run Application Only", runAndBuild:"Run and Build Application"]>`; —; `app[identification.type] = standard` or `app[identification.type] = boilerplate`;
- `restrictUserList` — `<STRING>`; —; Yes; —; —; maxLength=4000; `app[availability.status] = restricted`;

### errorHandling

- `defaultDisplayLocation` — `<STRING>`; —; Yes; `INLINE_WITH_FIELD_AND_NOTIFICATION`; `<enum:[inlineWithFieldAndInNotification:"Inline with Field and in Notification", inlineWithField:"Inline with Field", inlineInNotification:"Inline in Notification"]>`; —; —;
- `errorHandlingFunctionName` — `<STRING>`; —; No; —; —; maxLength=255; —;

### reportPrinting

- `type` — `<STRING>`; —; Yes; `NATIVE`; `<enum:[native:"Native Printing", remote:"Remote Print Server", useInstanceSettings:"Use Instance Settings"]>`; —; —;
- `remotePrintServer` — `<@printServer>`; —; Yes; —; —; lovType=COMPONENT; `app[reportPrinting.type] = remote`;
- `credentials` — `<@webCredential>`; —; No; —; —; lovType=COMPONENT; `app[reportPrinting.type] = remote`;

### authentication

- `publicUser` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `scheme` — `<@authentication>`; —; No; —; —; lovType=COMPONENT; —;
- `configProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `enableDeepDataSecurity` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `databaseResourceScope` — `<STRING>`; —; Yes; —; —; maxLength=4000; `app[authentication.enableDeepDataSecurity] = Y`;
- `appScope` — `<STRING>`; —; Yes; —; —; maxLength=4000; `app[authentication.enableDeepDataSecurity] = Y`;

### authorization

- `sourceForRoleOrGroupSchemes` — `<STRING>`; —; Yes; `R`; `<enum:[accessControlUserRoleAssignments:"Access Control User Role Assignments", authenticationScheme:"Authentication Scheme", customCode:"Custom Code"]>`; —; —;
- `scheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;
- `runOnPublicPages` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `runOnBackgroundJob` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `app[authorization.scheme] = sample`;

### sessionManagement

- `maxSessionLength` — `<INTEGER>`; —; No; —; —; —; —;
- `sessionTimeoutUrl` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `maxSessionIdleTime` — `<INTEGER>`; —; No; —; —; —; —;
- `sessionIdleTimeoutUrl` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `sessionTimeoutWarning` — `<INTEGER>`; —; No; —; —; —; —;
- `rejoinSessions` — `<STRING>`; —; Yes; `N`; `<enum:[false:"Disabled", publicSessions:"Enabled for Public Sessions", allSessions:"Enabled for All Sessions"]>`; —; —;
- `sessionStateCommits` — `<STRING>`; —; Yes; `END_OF_REQUEST`; `<enum:[immediate:"Immediate", endOfRequest:"End Of Request"]>`; —; —;

### sessionStateProtection

- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `acceptPre202UrlChecksums` — `<BOOLEAN>`; —; No; `N`; —; —; —;
- `allowUrlsCreatedAfter` — `<DATETIME>`; —; No; —; —; —; —;
- `bookmarkHashFunction` — `<STRING>`; —; Yes; `SH512`; `<enum:[sha1:"SHA-1", sha2-256bit:"SHA-2, 256 bit", sha2-384bit:"SHA-2, 384 bit", sha2-512bit:"SHA-2, 512 bit", md5:"MD5"]>`; —; —;
- `checksumSalt` — `<STRING>`; —; No; —; —; —; —;

### appFormatMasks

- `date` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `dateTime` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `timestamp` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `timestampTimeZone` — `<STRING>`; —; No; —; —; maxLength=255; —;

### charValueComparison

- `mode` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `behavior` — `<STRING>`; —; No; —; `<enum:[binary:"Binary", linguistic:"Linguistic"]>`; —; —;

### logo

- `type` — `<STRING>`; —; No; —; `<enum:[image:"Image", text:"Text", imageAndText:"Image and Text", custom:"Custom"]>`; —; —;
- `imageUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `app[logo.type] = image` or `app[logo.type] = imageAndText`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `app[logo.type] = text` or `app[logo.type] = imageAndText`;
- `customHtml` — `<STRING>`; —; Yes; —; —; maxLength=4000; `app[logo.type] = custom`;

### javaScript

- `fileUrls` — `<STRING>`; Enter JavaScript file URLs for code to be loaded on every page. Each URL has to be written into a new line. If you provide a minified version of your file, you can use the substitution string #MIN# to include .min or #MIN_DIRECTORY# to include minified/ in your file URL for a regular page view and an empty string if the page is viewed in debug mode.  JavaScript file URLs you enter here replaces the #APPLICATION_JAVASCRIPT# substitution string in the page template.; No; —; —; maxLength=4000; —;
- `includeLegacyJavascript` — `<STRING>`; —; No; —; `<enum:[pre18:"Pre 18.1", 18:"18.x"]>`; —; —;
- `includeJqueryMigrate` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### userInterface

- `usersCanChooseThemeStyle` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `addBuiltWithApexToFooter` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `autoDismissSuccessMessages` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `currentTheme` — `<@theme>`; —; Yes; —; —; lovType=COMPONENT; —;
- `globalPage` — `<INTEGER>`; —; No; —; —; —; —;

### navigationBar

- `implementation` — `<STRING>`; —; Yes; `LIST`; `<enum:[classic:"Classic", list:"List"]>`; —; —;
- `list` — `<@list>`; —; Yes; —; —; lovType=COMPONENT; `app[navigationBar.implementation] = list`;
- `listTemplate` — `<@listTemplate>`; —; Yes; —; `<enum:[@/badge-list, @/cards, @/links-list, @/media-list, @/menu-bar, @/menu-popup, @/navigation-bar, @/side-navigation-menu, @/tabs, @/top-navigation-mega-menu, @/top-navigation-menu, @/top-navigation-tabs, @/wizard-progress]>`; —; `app[navigationBar.implementation] = list`;
- `templateOptions` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; `app[navigationBar.implementation] = list` and `app[navigationBar.listTemplate] = sample`;

### staticFiles

- `appFilesPath` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `apexFilesPath` — `<STRING>`; —; No; —; —; maxLength=255; —;

### progressiveWebApp

- `enable` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `appShortName` — `<STRING>`; —; No; —; —; maxLength=18; `app[progressiveWebApp.enable] = Y`;
- `installable` — `<BOOLEAN>`; —; Yes; `N`; —; —; `app[progressiveWebApp.enable] = Y`;
- `enablePushNotifications` — `<BOOLEAN>`; —; Yes; `N`; —; —; `app[progressiveWebApp.enable] = Y`;
- `manifestIconUrl` — `<STRING>`; —; No; —; —; maxLength=255; `app[progressiveWebApp.enable] = Y`;
- `display` — `<STRING>`; —; Yes; `standalone`; `<enum:[fullscreen:"Fullscreen", standalone:"Standalone", minimalUI:"Minimal UI", browser:"Browser"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[progressiveWebApp.installable] = Y`;
- `screenOrientation` — `<STRING>`; —; Yes; `any`; `<enum:[any:"Any", natural:"Natural", landscape:"Landscape", landscapePrimary:"Landscape Primary", landscapeSecondary:"Landscape Secondary", portrait:"Portrait", portraitPrimary:"Portrait Primary", portraitSecondary:"Portrait Secondary"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[progressiveWebApp.installable] = Y`;
- `themeColor` — `<STRING>`; —; No; —; —; maxLength=128; `app[progressiveWebApp.enable] = Y` and `app[progressiveWebApp.installable] = Y`;
- `backgroundColor` — `<STRING>`; —; No; —; —; maxLength=128; `app[progressiveWebApp.enable] = Y` and `app[progressiveWebApp.installable] = Y`;
- `appDescription` — `<STRING>`; —; No; —; —; maxLength=4000; `app[progressiveWebApp.enable] = Y` and `app[progressiveWebApp.installable] = Y`;
- `customManifest` — `<STRING>`; —; No; —; —; maxLength=4000; `app[progressiveWebApp.enable] = Y` and `app[progressiveWebApp.installable] = Y`;
- `pushNotificationsCredentials` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; `app[progressiveWebApp.enable] = Y` and `app[progressiveWebApp.enablePushNotifications] = Y`;
- `contactEmail` — `<STRING>`; —; No; —; —; maxLength=255; `app[progressiveWebApp.enable] = Y` and `app[progressiveWebApp.enablePushNotifications] = Y`;

### genAI

- `requestHandlerProcedure` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `responseHandlerProcedure` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `service` — `<@genAIService>`; —; No; —; —; lovType=COMPONENT; —;
- `aiConsentMessage` — `<STRING>`; —; No; —; —; maxLength=4000; `app[genAI.service] = sample`;

### navigationMenu

- `listTemplate` — `<@listTemplate>`; —; No; —; `<enum:[@/badge-list, @/cards, @/links-list, @/media-list, @/menu-bar, @/menu-popup, @/navigation-bar, @/side-navigation-menu, @/tabs, @/top-navigation-mega-menu, @/top-navigation-menu, @/top-navigation-tabs, @/wizard-progress]>`; —; —;
- `list` — `<@list>`; —; No; —; —; lovType=COMPONENT; `app[navigationMenu.listTemplate] = sample`;
- `listPosition` — `<STRING>`; —; Yes; `SIDE`; `<enum:[top:"Top", side:"Side"]>`; —; `app[navigationMenu.listTemplate] = sample`;
- `templateOptions` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; `app[navigationMenu.listTemplate] = sample`;

### navigation

- `homeUrl` — `<COMPLEX>`; —; Yes; —; —; —; —;
- `loginUrl` — `<COMPLEX>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### css

- `fileUrls` — `<STRING>`; Enter CSS file URLs to be loaded on every page. Each URL has to be written into a new line. If you provide a minified version of your file you can use the substitution string #MIN# to include .min or #MIN_DIRECTORY# to include minified/ in your file URL for a regular page view and an empty string if the page is viewed in debug mode. You also have access to the substitution string #APP_VERSION# if you want to include the application's version in the file URL.  File URLs you enter here will replace the #APPLICATION_CSS# substitution string in the page template.; No; —; —; maxLength=4000; —;

### fileStorage

- `type` — `<STRING>`; —; Yes; `DB`; `<enum:[database:"Database", objectStorage:"Object Storage"]>`; —; —;
- `fileServer` — `<@fileServer>`; —; No; —; —; lovType=COMPONENT; `app[fileStorage.type] = objectStorage`;

### customServiceWorker

- `mode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom", url:"URL"]>`; —; `app[progressiveWebApp.enable] = Y`;
- `url` — `<STRING>`; —; Yes; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = url`;
- `fetchMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom", hook:"Hook"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `notificationCloseMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom", hook:"Hook"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `canMakePaymentMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `paymentRequestMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `installMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom", hook:"Hook"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `pushMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom", hook:"Hook"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `syncMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `notificationClickMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom", hook:"Hook"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `functionVariableDeclarationMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", hook:"Hook"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `activateMode` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", custom:"Custom", hook:"Hook"]>`; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom`;
- `functionVariableDeclaration` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.functionVariableDeclarationMode] = hook`;
- `eventInstallBefore` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.installMode] = hook`;
- `eventInstallAfter` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.installMode] = hook`;
- `eventActivateBefore` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.activateMode] = hook`;
- `eventActivateAfter` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.activateMode] = hook`;
- `eventFetchBefore` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.fetchMode] = hook`;
- `eventFetchCacheDefinition` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.fetchMode] = hook`;
- `eventFetchCacheResponse` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.fetchMode] = hook`;
- `eventFetchNetworkResponseSuccess` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.fetchMode] = hook`;
- `eventFetchNetworkResponseError` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.fetchMode] = hook`;
- `eventFetchOfflinePage` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.fetchMode] = hook`;
- `eventFetchNetworkFallback` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.fetchMode] = hook`;
- `eventSync` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.syncMode] = custom`;
- `eventPushBefore` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.pushMode] = hook`;
- `eventPushAfter` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.pushMode] = hook`;
- `evenNotificationClickBefore` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.notificationClickMode] = hook`;
- `evenNotificationClickAfter` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.notificationClickMode] = hook`;
- `evenNotificationClose` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.notificationCloseMode] = custom`;
- `evenCanMakePayment` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.canMakePaymentMode] = custom`;
- `evenPaymentRequest` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.paymentRequestMode] = custom`;
- `eventInstall` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.installMode] = custom`;
- `eventActivate` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.activateMode] = custom`;
- `eventFetch` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.fetchMode] = custom`;
- `eventPush` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.pushMode] = custom`;
- `eventNotificationClick` — `<STRING>`; —; No; —; —; —; `app[progressiveWebApp.enable] = Y` and `app[customServiceWorker.mode] = custom` and `app[customServiceWorker.notificationClickMode] = custom`;

