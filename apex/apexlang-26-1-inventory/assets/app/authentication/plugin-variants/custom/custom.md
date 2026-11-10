# plugin-variants/custom

- componentType: `authentication`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[custom:"Custom"]>`; —; —;

### sessionSharing

- `type` — `<STRING>`; —; Yes; `A`; `<enum:[app:"Application (No Sharing)", workspaceSharing:"Workspace Sharing", custom:"Custom"]>`; —; —;
- `cookieName` — `<STRING>`; —; No; —; —; maxLength=255; `authentication[sessionSharing.type] = custom`;
- `cookiePath` — `<STRING>`; —; No; —; —; maxLength=255; `authentication[sessionSharing.type] = custom`;
- `cookieDomain` — `<STRING>`; —; No; —; —; maxLength=255; `authentication[sessionSharing.type] = custom`;
- `secure` — `<BOOLEAN>`; —; Yes; `N`; —; —; `authentication[sessionSharing.type] = custom`;

### loginProcessing

- `switchInSession` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `preAuthenticationProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `postAuthenticationProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### subscription

- `master` — `<@authentication>`; —; No; —; `<enum:[@/8842.261/builder-extension-sign-in]>`; —; —;

### source

- `plsqlCode` — `<STRING>`; —; No; —; —; —; —;

### sessionNotValid

- `verifyFunctionName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `redirectTo` — `<STRING>`; —; Yes; `LOGIN`; `<enum:[loginPage:"Login Page", builtInLoginPage:"Built-In Login Page", url:"URL"]>`; —; —;
- `invalidSessionUrl` — `<COMPLEX>`; —; No; —; —; —; `authentication[sessionNotValid.redirectTo] = url`;

### postLogout

- `redirectTo` — `<STRING>`; —; Yes; `HOME`; `<enum:[homePage:"Home Page", url:"URL"]>`; —; —;
- `url` — `<STRING>`; —; Yes; —; —; maxLength=4000; `authentication[postLogout.redirectTo] = url`;

### realAppSecurity

- `rasMode` — `<STRING>`; —; Yes; `0`; `<enum:[disabled:"Disabled", externalUsers:"External Users", internalUsers:"Internal Users"]>`; —; —;
- `dynamicRoles` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[realAppSecurity.rasMode] = externalUsers` or `authentication[realAppSecurity.rasMode] = internalUsers`;
- `namespaces` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[realAppSecurity.rasMode] = externalUsers` or `authentication[realAppSecurity.rasMode] = internalUsers`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### settings

- `invalidSessionProcedureName` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `postLogoutProcedureName` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `sentryFunctionName` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `authFunctionName` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `enableLegacyAuthAttrs` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `ssoPartnerAppName` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[settings.enableLegacyAuthAttrs] = Y`;
- `useExactDn` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `authentication[settings.enableLegacyAuthAttrs] = Y`;
- `ldapPort` — `<INTEGER>`; —; No; —; —; —; `authentication[settings.enableLegacyAuthAttrs] = Y`;
- `usernameEscaping` — `<STRING>`; —; Yes; `STD`; `<enum:[standard:"Standard", onlySpecialChars:"Only special characters", noEscaping:"No Escaping"]>`; maxLength=4000; `authentication[settings.enableLegacyAuthAttrs] = Y`;
- `useSsl` — `<STRING>`; —; Yes; `NO_SSL`; `<enum:[noSsl:"No SSL", sslWithAuth:"SSL with Authentication", ssl:"SSL"]>`; maxLength=4000; `authentication[settings.enableLegacyAuthAttrs] = Y`;
- `ldapUsernameEditFunction` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[settings.enableLegacyAuthAttrs] = Y`;
- `ldapHost` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[settings.enableLegacyAuthAttrs] = Y`;
- `ldapDnString` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[settings.enableLegacyAuthAttrs] = Y`;
- `searchFilter` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[settings.enableLegacyAuthAttrs] = Y` and `authentication[settings.useExactDn] = N`;

