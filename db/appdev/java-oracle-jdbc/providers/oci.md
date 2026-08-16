# JDBC Providers for OCI

## Overview

Use this skill to configure Oracle JDBC to load connection strings,
credentials, TLS wallets, or access tokens from Oracle Cloud Infrastructure
(OCI) services: Database Tools Connections, Object Storage, and Vault.

For the shared provider concepts (config vs resource providers, payload
format, caching, auto-detect auth), see [Oracle JDBC Driver Extensions](../providers.md)
first.

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-oci</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 8, forward compatible with later JDKs.

## Centralized Config Providers

| Provider | URL prefix | Identifies |
|----------|-----------|------------|
| Database Tools Connections | `jdbc:oracle:thin:@config-ocidbtools://{ocid}` | An OCI Database Tools Connection resource (stores user, password, wallet) |
| Object Storage | `jdbc:oracle:thin:@config-ociobject://{url-path}` | A JSON (or Pkl) payload object in Object Storage |
| Vault | `jdbc:oracle:thin:@config-ocivault://{secret-ocid}` | A JSON (or Pkl) payload stored as the content of a Vault secret |

```java
OracleDataSource ds = new OracleDataSource();
ds.setURL("jdbc:oracle:thin:@config-ociobject://mytenancy.objectstorage.us-phoenix-1.oci.customer-oci.com/n/mytenancy/b/bucket1/o/payload.json");
try (Connection cn = ds.getConnection()) { ... }
```

Object Storage accepts standard, PAR-token, and `customer-oci.com` URL forms;
see the [OCI Object Storage URI guide](https://docs.oracle.com/en/cloud/paas/autonomous-database/csgru/get-uri-access-object-store.html)
for how to obtain one. Database Tools Connections also support Proxy
Authentication when only a username (no password/roles) is set on the proxy
info.

To parse a Pkl payload instead of JSON, add `?parser=pkl` and put
`ojdbc-provider-pkl` on the classpath (Object Storage and Vault providers
only — see [Pkl Parser](pkl.md)).

## Resource Providers

| Provider | Name | Gives the driver |
|----------|------|-------------------|
| Database Connection String | `ojdbc-provider-oci-database-connection-string` | Connect string for an Autonomous Database, by `ocid` |
| Database TLS | `ojdbc-provider-oci-database-tls` | mTLS keys/certs for an Autonomous Database, by `ocid` |
| Vault Password | `ojdbc-provider-oci-vault-password` | Password from a Vault secret, by `ocid` |
| Vault Username | `ojdbc-provider-oci-vault-username` | Username from a Vault secret, by `ocid` |
| TCPS Wallet | `ojdbc-provider-oci-vault-tls` | TLS wallet (`SSO`/`PKCS12`/`PEM`) stored base64 in a Vault secret |
| SEPS Wallet | `ojdbc-provider-oci-vault-seps` | Username+password from a SEPS wallet stored in a Vault secret |
| Vault Connection String | `ojdbc-provider-oci-vault-tnsnames` | Connect string resolved from a `tnsnames.ora` alias stored in a Vault secret |
| Access Token | `ojdbc-provider-oci-token` | OAuth access token authorizing IAM-mapped logins to an Autonomous Database |

```properties
oracle.jdbc.provider.accessToken=ojdbc-provider-oci-token
oracle.jdbc.provider.accessToken.scope=urn:oracle:db::id::ocid1.compartment.oc1..aaaaaaaajx2fpr7szach4vpdsjegvkbjirronlnwkxiivwmp6qfrissxgyia
```

`scope` accepts a database OCID, a compartment OCID, or `*` (least to most
privileged — see the provider's README for the URN forms). `Database Connection
String` also accepts `consumerGroup` (`HIGH`/`MEDIUM`/`LOW`/`TP`/`TPURGENT`,
default `MEDIUM`). `TCPS Wallet` / `SEPS Wallet` require `type`
(`SSO`/`PKCS12`/`PEM`) and, for password-protected wallets, `walletPassword`.

## Authentication

Common parameters on every provider above:
`authenticationMethod`, `configFile` (default `~/.oci/config`), `profile`
(default `DEFAULT`), `region`, `username` (a caller-chosen cache-partition
label, not a credential), `instancePrincipalTimeout` (default `5`s),
`interactiveTimeout` (default `5`min).

`authenticationMethod` values: `config-file`, `instance-principal`,
`resource-principal`, `cloud-shell`, `interactive` (opens a browser, local
callback server on port `8181`), and `auto-detect` (default — tries
`config-file`, `cloud-shell`, `resource-principal`, `instance-principal`, in
that order).

```properties
oracle.jdbc.provider.database=ojdbc-provider-oci-database-connection-string
oracle.jdbc.provider.database.authenticationMethod=config-file
oracle.jdbc.provider.database.configFile=/home/app/resources/oci-config
oracle.jdbc.provider.database.profile=APP_PROFILE
```

## Best Practices

- Use `instance-principal` or `resource-principal` for workloads running on
  OCI compute/Functions instead of shipping a config file.
- Set `region` explicitly for `interactive` auth against government realms
  (e.g. `us-langley-1`), since the default login endpoint is
  `login.oci.oraclecloud.com`.
- Scope the Access Token Provider to a single database OCID, not `*`.
- Set a distinct `username` label per end user when one process fetches the
  same secret/token on behalf of multiple end users with `interactive` auth,
  so their cached logins do not collide.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [Pkl Parser](pkl.md)
- [Network Security](../../../security/network-security.md)

## Sources

- [ojdbc-provider-oci README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-oci/README.md)
- [ojdbc-provider-samples (OCI)](https://github.com/oracle/ojdbc-extensions/tree/main/ojdbc-provider-samples/src/main/java/oracle/jdbc/provider/oci)
- [OCI SDK Authentication Methods](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdk_authentication_methods.htm)
- [Oracle AI Database JDBC Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/index.html)