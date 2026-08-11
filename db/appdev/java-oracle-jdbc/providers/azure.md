# JDBC Providers for Azure

## Overview

Use this skill to configure Oracle JDBC to load connection strings,
credentials, TLS wallets, or access tokens from Azure App Configuration and
Azure Key Vault.

For shared provider concepts (config vs resource providers, payload format,
caching, auto-detect auth), see [Oracle JDBC Driver Extensions](../providers.md) first.

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-azure</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 8, forward compatible with later JDKs.

## Centralized Config Providers

| Provider | URL prefix | Identifies |
|----------|-----------|------------|
| App Configuration | `jdbc:oracle:thin:@config-azure://{appconfig-name}?key={prefix}&label={value}` | Key/value pairs in an App Configuration store (values may reference Key Vault secrets) |
| Vault | `jdbc:oracle:thin:@config-azurevault://{secret-identifier}` | A JSON (or Pkl) payload stored as the content of a Key Vault secret |

```java
ds.setURL("jdbc:oracle:thin:@config-azure://myappconfig?key=/sales_app1/&label=dev");
```

App Configuration keys map to payload fields by suffix: `{prefix}user`,
`{prefix}connect_descriptor`, `{prefix}password`, `{prefix}wallet_location`,
and `{prefix}jdbc/{property}` for JDBC connection properties (e.g.
`/sales_app1/jdbc/oracle.jdbc.fanEnabled`). If `key`/`label` are omitted,
unlabeled/unprefixed values are used. `password` and `wallet_location` may
themselves be `{"uri": "https://myvault.vault.azure.net/secrets/..."}`
references into Key Vault.

Add `?parser=pkl` (plus `ojdbc-provider-pkl` on the classpath) to parse a Pkl
payload for the Vault provider — see [Pkl Parser](pkl.md).

## Resource Providers

| Provider | Name | Gives the driver |
|----------|------|-------------------|
| Access Token | `ojdbc-provider-azure-token` | OAuth access token authorizing Azure AD-mapped logins to an Autonomous Database |
| Key Vault Username | `ojdbc-provider-azure-key-vault-username` | Username from a Key Vault secret (`vaultUrl` + `secretName`) |
| Key Vault Password | `ojdbc-provider-azure-key-vault-password` | Password from a Key Vault secret (`vaultUrl` + `secretName`) |
| Key Vault TCPS Wallet | `ojdbc-provider-azure-key-vault-tls` | TLS wallet (`SSO`/`PKCS12`/`PEM`) stored base64 in a Key Vault secret |
| Key Vault SEPS Wallet | `ojdbc-provider-azure-key-vault-seps` | Username+password from a SEPS wallet stored in a Key Vault secret |
| Key Vault Connection String | `ojdbc-provider-azure-key-vault-tnsnames` | Connect string resolved from a `tnsnames.ora` alias stored in a Key Vault secret |

```properties
oracle.jdbc.provider.accessToken=ojdbc-provider-azure-token
oracle.jdbc.provider.accessToken.scope=https://example.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/.default
```

`scope` is the database's Application ID URI, optionally with a scope name
appended (`.../session:scope:connect`) or `.default` for the default scope.
Wallet providers require `type` (`SSO`/`PKCS12`/`PEM`) and, for
password-protected wallets, `walletPassword`.

## Authentication

Common parameters: `authenticationMethod`, `tenantId`, `clientId`,
`clientCertificatePath`, `clientCertificatePassword`, `clientSecret`,
`username`, `password`, `redirectUri` (default `http://localhost`). All fall
back to the matching Azure SDK environment variable (`AZURE_TENANT_ID`,
`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, etc.) when not set on the property.

`authenticationMethod` values: `service-principal` (tenant + client ID with
a certificate or secret), `managed-identity` (optionally with `clientId` for
user-assigned identities), `password` (client ID + username/password),
`device-code`, `interactive` (opens a browser), and `auto-detect` (default —
tries `service-principal`, `password`, `managed-identity`, in that order).

For Centralized Config Providers, `AUTHENTICATION` additionally accepts
`AZURE_DEFAULT` (the SDK's `DefaultAzureCredential` chain: environment →
managed identity → shared token cache → Visual Studio → Azure CLI →
PowerShell → interactive browser).

```properties
oracle.jdbc.provider.password=ojdbc-provider-azure-key-vault-password
oracle.jdbc.provider.password.authenticationMethod=service-principal
oracle.jdbc.provider.password.tenantId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
oracle.jdbc.provider.password.clientId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
oracle.jdbc.provider.password.clientCertificatePath=/users/app/certificate.pem
```

## Best Practices

- Reserve `AZURE_DEFAULT`/`auto-detect` for local development.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [OCI Providers](oci.md)
- [Pkl Parser](pkl.md)
- [Network Security](../../../security/network-security.md)

## Sources

- [ojdbc-provider-azure README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-azure/README.md)
- [ojdbc-provider-samples (Azure)](https://github.com/oracle/ojdbc-extensions/tree/main/ojdbc-provider-samples/src/main/java/oracle/jdbc/provider/azure)
- [Azure Identity SDK Credential Classes](https://github.com/Azure/azure-sdk-for-java/tree/main/sdk/identity/azure-identity#credential-classes)
- [Oracle AI Database JDBC Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/index.html)