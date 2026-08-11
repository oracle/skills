# JDBC Providers for HashiCorp Vault

## Overview

Use this skill to configure Oracle JDBC to load connection strings,
credentials, or TLS wallets from HashiCorp Vault, specifically **HCP Vault
Dedicated**.

For shared provider concepts (config vs resource providers, payload format,
caching, auto-detect auth), see [Oracle JDBC Driver Extensions](../providers.md) first.

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-hashicorp</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 8, forward compatible with later JDKs.

## Endpoint Security Policy

This provider checks the Vault endpoint before sending any credential, so a
misconfigured URL cannot leak a token to the wrong host:

- `VAULT_ADDR` must be a valid URL with a host; HTTPS is required by default.
- Sensitive credentials (`VAULT_TOKEN`, `VAULT_PASSWORD`, `SECRET_ID`,
  `GITHUB_TOKEN`) are sent only when the target host is in
  `TRUSTED_VAULT_HOSTS` (comma-separated `host` or `host:port` entries, set
  as a system property or environment variable). Without it, sensitive-
  credential requests are rejected outright.
- `ALLOW_INSECURE_VAULT_ADDR=true` permits `http://` addresses — for
  local/dev only.

```bash
# Production
export VAULT_ADDR="https://vault.company.com:8200"
export TRUSTED_VAULT_HOSTS="vault.company.com:8200"

# Local/dev
export ALLOW_INSECURE_VAULT_ADDR=true
export VAULT_ADDR="http://127.0.0.1:8200"
export TRUSTED_VAULT_HOSTS="127.0.0.1:8200"
```

## Centralized Config Provider

| Provider | URL prefix | Identifies |
|----------|-----------|------------|
| HCP Vault Dedicated | `jdbc:oracle:thin:@config-hcpvaultdedicated://{secret-path}` | A JSON (or Pkl) payload stored at a Vault secret path |

```java
ds.setURL("jdbc:oracle:thin:@config-hcpvaultdedicated:///v1/namespace/secret/data/test_config");
```

`password` / `wallet_location` objects use `"type": "hcpvaultdedicated"` with
`"value"` as the secret path and an optional `"field_name"` when the secret
holds multiple key-value pairs. Add `?parser=pkl` (with `ojdbc-provider-pkl`
on the classpath) for Pkl payloads — see [Pkl Parser](pkl.md).

## Resource Providers

| Provider | Name | Gives the driver |
|----------|------|-------------------|
| Dedicated Vault Username | `ojdbc-provider-hcpvault-dedicated-username` | Username from a secret path (`secretPath`, optional `fieldName`) |
| Dedicated Vault Password | `ojdbc-provider-hcpvault-dedicated-password` | Password from a secret path |
| Dedicated Vault TCPS Wallet | `ojdbc-provider-hcpvault-dedicated-tls` | TLS wallet (`SSO`/`PKCS12`/`PEM`) stored base64 in a secret |
| Dedicated Vault SEPS Wallet | `ojdbc-provider-hcpvault-dedicated-seps` | Username+password from a SEPS wallet stored in a secret |
| Dedicated Vault Connection String | `ojdbc-provider-hcpvault-dedicated-tnsnames` | Connect string resolved from a `tnsnames.ora` alias in a secret |

All resource providers take `vaultAddr`, `secretPath`, and an optional
`fieldName` when the secret JSON has more than one key; wallet providers
additionally take `type` and, if protected, `walletPassword`.

## Authentication

Common parameters (each backed by a matching env var):
`authenticationMethod`, `vaultAddr` (`VAULT_ADDR`), `vaultNamespace`
(`VAULT_NAMESPACE`, default `admin`), `vaultToken` (`VAULT_TOKEN`),
`vaultUsername`/`vaultPassword` (`VAULT_USERNAME`/`VAULT_PASSWORD`),
`roleId`/`secretId` (`ROLE_ID`/`SECRET_ID`), `githubToken` (`GITHUB_TOKEN`),
plus per-method auth-path overrides (`userPassAuthPath`, `appRoleAuthPath`,
`githubAuthPath`).

`authenticationMethod` values: `vault-token`, `userpass`, `approle` (needs
`roleId` + `secretId`), `github`, and `auto-detect` (default — tries
`vault-token`, `userpass`, `approle`, `github`, in that order). Tokens from
`userpass`/`approle` are cached and reused until they expire;
`TOKEN_CACHE_MAX_ENTRIES` (default `100`) bounds the cache size.

```
jdbc:oracle:thin:@config-hcpvaultdedicated:///v1/namespace/secret/data/secret_name?KEY=sales_app1&authentication=approle
```

## Best Practices

- Always set `TRUSTED_VAULT_HOSTS` in any environment that uses token,
  userpass, AppRole, or GitHub authentication — without it, those methods
  are rejected by design.
- Never set `ALLOW_INSECURE_VAULT_ADDR=true` outside local development.
- Prefer AppRole for machine-to-machine authentication over static Vault
  tokens, since AppRole credentials can be scoped and rotated independently.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [Pkl Parser](pkl.md)
- [Network Security](../../../security/network-security.md)

## Sources

- [ojdbc-provider-hashicorp README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-hashicorp/README.md)
- [ojdbc-provider-samples (HashiCorp)](https://github.com/oracle/ojdbc-extensions/tree/main/ojdbc-provider-samples/src/main/java/oracle/jdbc/provider/hashicorp)
- [HashiCorp Vault Auth Methods](https://developer.hashicorp.com/vault/docs/auth)
- [Oracle AI Database JDBC Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/index.html)