# plugin-variants/socialSignIn

- componentType: `authentication`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[socialSignIn:"Social Sign-In"]>`; —; —;

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

- `mapAdditionalUserAttrsTo` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `additionalUserAttrs` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `convertUsernameToUpperCase` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `verifyAttrs` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `scope` — `<STRING>`; —; Yes; `profile`; —; maxLength=4000; —;
- `authProvider` — `<STRING>`; —; Yes; `OPENID_CONNECT`; `<enum:[facebook:"Facebook", google:"Google", genericOauth2Provider:"Generic OAuth2 Provider", openidConnect:"OpenID Connect Provider"]>`; maxLength=4000; —;
- `credentialStore` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; —;
- `authUriParams` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `username` — `<STRING>`; —; Yes; `#sub# (#APEX_AUTH_NAME#)`; —; maxLength=4000; —;
- `tokenEndpointUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `authentication[settings.authProvider] = genericOauth2Provider`;
- `authorizationEndpointUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `authentication[settings.authProvider] = genericOauth2Provider`;
- `tokenAuthMethod` — `<STRING>`; —; No; —; `<enum:[clientIdClientSecretInBody:"Client ID and Client Secret in Body", clientIdInBody:"Client ID in Body", basic:"Basic Authentication", basicClientIdInBody:"Basic Authentication and Client ID in Body"]>`; maxLength=4000; `authentication[settings.authProvider] = openidConnect` or `authentication[settings.authProvider] = genericOauth2Provider`;
- `discoveryUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `authentication[settings.authProvider] = openidConnect`;
- `userInfoEndpointUrl` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[settings.authProvider] = genericOauth2Provider`;

