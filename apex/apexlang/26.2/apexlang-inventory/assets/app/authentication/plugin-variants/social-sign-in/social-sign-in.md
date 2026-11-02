# plugin-variants/socialSignIn

- componentType: `authentication`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name used by application developers to reference this authentication scheme.; Yes; —; —; maxLength=255; —;
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

- `master` — `<@authentication>`; —; No; —; `<enum:[@/8842.262/builder-extension-sign-in]>`; —; —;

### source

- `plsqlCode` — `<STRING>`; Enter a PL/SQL anonymous block of code that contains functions and procedures for verifying if the session is valid, pre- and post-authentication and (optionally) other authentication entry points. For performance reasons, you can store this code in a PL/SQL package in the database.; No; —; —; —; —;

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

- `helpText` — `<STRING>`; Text displayed in a help popup window, available on the login page. This should offer guidance and links to resources to assist users of the Oracle APEX built-in login page, specific to the type of authentication your application is using (Open Door, Oracle APEX account, or LDAP).; No; —; —; maxLength=4000; —;

### settings

- `scope` — `<STRING>`; —; Yes; `profile`; —; maxLength=4000; —;
- `username` — `<STRING>`; —; Yes; `#sub# (#APEX_AUTH_NAME#)`; —; maxLength=4000; —;
- `additionalUserAttrs` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `authUriParams` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `authProvider` — `<STRING>`; —; Yes; `OPENID_CONNECT`; `<enum:[facebook:"Facebook", openidConnect:"OpenID Connect Provider", google:"Google", genericOauth2Provider:"Generic OAuth2 Provider"]>`; maxLength=4000; —;
- `verifyAttrs` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `credentialStore` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; —;
- `mapAdditionalUserAttrsTo` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `convertUsernameToUpperCase` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `tokenAuthMethod` — `<STRING>`; —; No; —; `<enum:[clientIdClientSecretInBody:"Client ID and Client Secret in Body", basic:"Basic Authentication", clientIdInBody:"Client ID in Body", basicClientIdInBody:"Basic Authentication and Client ID in Body"]>`; maxLength=4000; `authentication[settings.authProvider] = openidConnect` or `authentication[settings.authProvider] = genericOauth2Provider`;
- `discoveryUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `authentication[settings.authProvider] = openidConnect`;
- `tokenEndpointUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `authentication[settings.authProvider] = genericOauth2Provider`;
- `userInfoEndpointUrl` — `<STRING>`; —; No; —; —; maxLength=4000; `authentication[settings.authProvider] = genericOauth2Provider`;
- `authorizationEndpointUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `authentication[settings.authProvider] = genericOauth2Provider`;

