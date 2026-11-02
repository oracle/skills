# webCredential

- componentType: `webCredential`
- identifierRequired: true
- filePath: `workspace-components/credentials/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for the Credentials. This name must be unique within the workspace.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; `BASIC`; `<enum:[basicAuthentication:"Basic Authentication", oauth2ClientCredentialsFlow:"OAuth2 Client Credentials Flow", oci:"Oracle Cloud Infrastructure (OCI)", httpHeader:"HTTP Header", urlQueryString:"URL Query String", keyPair:"Key Pair", certificatePrivateKeyPair:"Certificate/Private Key Pair", oauth2PasswordFlow:"OAuth2 Password Flow", signedUserAssertion:"Signed User Assertion", userAssertionSigningCertificate:"User Assertion Signing Certificate"]>`; —; —;

### advanced

- `staticId` — `<STRING>`; Use the Static ID to reference the Credential in API Calls.; Yes; —; —; maxLength=255; —;
- `namedScopes` — `<STRING>`; —; No; —; —; —; `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = oauth2PasswordFlow`;
- `usernameExpression` — `<STRING>`; —; No; —; —; maxLength=4000; `webCredential[identification.type] = signedUserAssertion`;
- `signingCredential` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; `webCredential[identification.type] = signedUserAssertion`;
- `authenticationCredential` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; `webCredential[identification.type] = oauth2PasswordFlow`;
- `tokenAuthenticationMethod` — `<STRING>`; —; Yes; `BASIC`; `<enum:[clientIdAndClientSecretInBody:"Client ID and Client Secret in Body", basicAuthentication:"Basic Authentication", basicAuthenticationAndClientIdInBody:"Basic Authentication and Client ID in Body", clientIdInBody:"Client ID in Body"]>`; —; `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = oauth2PasswordFlow`;
- `promptOnInstall` — `<BOOLEAN>`; —; Yes; `N`; —; —; `webCredential[identification.type] = basicAuthentication` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = oauth2PasswordFlow` or `webCredential[identification.type] = oci`;
- `validForUrls` — `<STRING>`; —; No; —; —; —; `webCredential[identification.type] = basicAuthentication` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = oauth2PasswordFlow` or `webCredential[identification.type] = oci`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### authentication

- `audienceList` — `<STRING>`; —; No; —; —; —; `webCredential[identification.type] = userAssertionSigningCertificate`;
- `certificateAlias` — `<STRING>`; —; No; —; —; —; `webCredential[identification.type] = userAssertionSigningCertificate`;
- `publicKey` — `<STRING>`; —; No; —; —; maxLength=4000; `webCredential[identification.type] = keyPair`;
- `ociTenancyId` — `<STRING>`; —; No; —; —; maxLength=4000; `webCredential[identification.type] = oci`;
- `ociPublicKeyFingerprint` — `<STRING>`; —; No; —; —; maxLength=4000; `webCredential[identification.type] = oci`;
- `certificate` — `<STRING>`; —; No; —; —; maxLength=4000; `webCredential[identification.type] = certificatePrivateKeyPair` or `webCredential[identification.type] = userAssertionSigningCertificate`;
- `credentialName` — `<STRING>`; —; No; —; —; maxLength=4000; `webCredential[identification.type] = httpHeader` or `webCredential[identification.type] = urlQueryString`;
- `ociUserId` — `<STRING>`; —; No; —; —; —; `webCredential[identification.type] = oci`;
- `databaseCredentialName` — `<STRING>`; —; No; —; —; maxLength=128; `webCredential[identification.type] = basicAuthentication` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = oauth2PasswordFlow` or `webCredential[identification.type] = oci`;
- `oauthScope` — `<STRING>`; —; No; —; —; maxLength=255; `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = oauth2PasswordFlow`;
- `clientIdOrUsername` — `<STRING>`; —; No; —; —; maxLength=4000; `webCredential[identification.type] = basicAuthentication` and `webCredential[identification.type] = basicAuthentication` or `webCredential[identification.type] = basicAuthentication` and `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = basicAuthentication` and `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = basicAuthentication` and `webCredential[identification.type] = oauth2PasswordFlow` or `webCredential[identification.type] = basicAuthentication` and `webCredential[identification.type] = oci` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` and `webCredential[identification.type] = basicAuthentication` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` and `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` and `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` and `webCredential[identification.type] = oauth2PasswordFlow` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` and `webCredential[identification.type] = oci` or `webCredential[identification.type] = signedUserAssertion` and `webCredential[identification.type] = basicAuthentication` or `webCredential[identification.type] = signedUserAssertion` and `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = signedUserAssertion` and `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = signedUserAssertion` and `webCredential[identification.type] = oauth2PasswordFlow` or `webCredential[identification.type] = signedUserAssertion` and `webCredential[identification.type] = oci` or `webCredential[identification.type] = oauth2PasswordFlow` and `webCredential[identification.type] = basicAuthentication` or `webCredential[identification.type] = oauth2PasswordFlow` and `webCredential[identification.type] = oauth2ClientCredentialsFlow` or `webCredential[identification.type] = oauth2PasswordFlow` and `webCredential[identification.type] = signedUserAssertion` or `webCredential[identification.type] = oauth2PasswordFlow` and `webCredential[identification.type] = oauth2PasswordFlow` or `webCredential[identification.type] = oauth2PasswordFlow` and `webCredential[identification.type] = oci`;
- `instanceLevelDatabaseCredential` — `<BOOLEAN>`; —; Yes; `N`; —; —; `webCredential[identification.type] = basicAuthentication` and `webCredential[authentication.databaseCredentialName] = sample` or `webCredential[identification.type] = oauth2ClientCredentialsFlow` and `webCredential[authentication.databaseCredentialName] = sample` or `webCredential[identification.type] = signedUserAssertion` and `webCredential[authentication.databaseCredentialName] = sample` or `webCredential[identification.type] = oauth2PasswordFlow` and `webCredential[authentication.databaseCredentialName] = sample` or `webCredential[identification.type] = oci` and `webCredential[authentication.databaseCredentialName] = sample`;

