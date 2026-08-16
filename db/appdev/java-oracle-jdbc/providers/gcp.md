# JDBC Providers for GCP

## Overview

Use this skill to configure Oracle JDBC to load connection strings,
credentials, or TLS wallets from Google Cloud Storage and GCP Secret
Manager.

For shared provider concepts (config vs resource providers, payload format,
caching), see [Oracle JDBC Driver Extensions](../providers.md) first.

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-gcp</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 8, forward compatible with later JDKs.

## Authentication

Providers use [Application Default Credentials
(ADC)](https://cloud.google.com/docs/authentication/application-default-credentials).
ADC resolves credentials in order: `GOOGLE_APPLICATION_CREDENTIALS`
environment variable → user credentials from the `gcloud` CLI → the attached
service account from the metadata server. There is no per-provider
authentication parameter to configure — set up ADC once for the runtime
environment:

```bash
gcloud auth application-default login
```

## Centralized Config Providers

| Provider | URL prefix | Identifies |
|----------|-----------|------------|
| Cloud Storage | `jdbc:oracle:thin:@config-gcpstorage://project={project};bucket={bucket};object={object}` (also accepts `gs://{bucket}/{object}` or `https://storage.googleapis.com/{bucket}/{object}`) | A JSON (or Pkl) payload object in Cloud Storage |
| Secret Manager | `jdbc:oracle:thin:@config-gcpsecretmanager:{resource-name}` | A JSON (or Pkl) payload stored as a Secret Manager secret |

```java
ds.setURL("jdbc:oracle:thin:@config-gcpstorage://project=myproject;bucket=mybucket;object=payload.json");
```

`project` is optional for the `project=;bucket=;object=` form; the `gs://`
and `storage.googleapis.com` forms always use the SDK's default client
project. The payload has 3 root fields: `connect_descriptor` (required),
`user`, `password` — plus the shared `wallet_location` and `jdbc` object
described in [Oracle JDBC Driver Extensions](../providers.md). Add `?parser=pkl` (with
`ojdbc-provider-pkl` on the classpath) for Pkl payloads — see
[Pkl Parser](pkl.md).

## Resource Providers

| Provider | Name | Gives the driver |
|----------|------|-------------------|
| Secret Manager Password | `ojdbc-provider-gcp-secretmanager-password` | Password from a secret version (`secretVersionName`) |
| Secret Manager Username | `ojdbc-provider-gcp-secretmanager-username` | Username from a secret version |
| Secret Manager TCPS Wallet | `ojdbc-provider-gcp-secretmanager-tls` | TLS wallet (`SSO`/`PKCS12`/`PEM`), stored base64 or as raw imported bytes |
| Secret Manager SEPS Wallet | `ojdbc-provider-gcp-secretmanager-seps` | Username+password from a SEPS wallet secret |
| Secret Manager Connection String | `ojdbc-provider-gcp-secretmanager-tnsnames` | Connect string resolved from a `tnsnames.ora` alias in a secret |

`secretVersionName` has the form
`projects/{project-id}/secrets/{secret-id}/versions/{version-id}`. Wallet
providers auto-detect base64 vs raw imported bytes, and require `type`
(`SSO`/`PKCS12`/`PEM`) plus `walletPassword` for protected wallets.

```properties
oracle.jdbc.provider.password=ojdbc-provider-gcp-secretmanager-password
oracle.jdbc.provider.password.secretVersionName=projects/138028249883/secrets/test-secret/versions/1
```

## Best Practices

- Grant the runtime's service account `roles/secretmanager.secretAccessor`
  scoped to the specific secrets it needs, not project-wide access.
- Prefer the attached service account (metadata server) over
  `GOOGLE_APPLICATION_CREDENTIALS` key files on GCE/GKE/Cloud Run — it
  avoids a long-lived key to rotate or leak.
- Pin a `versions/{n}` in `secretVersionName` for reproducible deploys
  instead of `versions/latest`, if your workflow supports it.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [Pkl Parser](pkl.md)
- [Network Security](../../../security/network-security.md)

## Sources

- [ojdbc-provider-gcp README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-gcp/README.md)
- [ojdbc-provider-samples (GCP)](https://github.com/oracle/ojdbc-extensions/tree/main/ojdbc-provider-samples/src/main/java/oracle/jdbc/provider/gcp)
- [GCP Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Oracle AI Database JDBC Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/index.html)