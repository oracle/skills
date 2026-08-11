# JDBC Providers for AWS

## Overview

Use this skill to configure Oracle JDBC to load connection strings,
credentials, or TLS wallets from AWS S3, Secrets Manager, Systems Manager
Parameter Store, and AppConfig.

For shared provider concepts (config vs resource providers, payload format,
caching), see [Oracle JDBC Driver Extensions](../providers.md) first.

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-aws</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 8, forward compatible with later JDKs.

## Centralized Config Providers

| Provider | URL prefix | Identifies |
|----------|-----------|------------|
| S3 | `jdbc:oracle:thin:@config-awss3://{s3-uri}` (or `jdbc:oracle:thin:@config-aws{s3-uri}`) | A JSON (or Pkl) payload object in S3 |
| Secrets Manager | `jdbc:oracle:thin:@config-awssecretsmanager://{secret-name}` | A JSON (or Pkl) payload stored as a secret |
| Parameter Store | `jdbc:oracle:thin:@config-awsparameterstore://{parameter-name}` | A JSON (or Pkl) payload stored as a parameter value |
| AppConfig Freeform | `jdbc:oracle:thin:@config-awsappconfig://{application-id}?appconfig_environment={env}&appconfig_profile={profile}` | A freeform configuration profile in AWS AppConfig |

```java
ds.setURL("jdbc:oracle:thin:@config-awss3://s3://mybucket/payload.json");
```

AppConfig's `environment` and `profile` may instead come from system
properties (`aws.appconfig.environment`, `aws.appconfig.profile`) or
environment variables (`AWS_APP_CONFIG_ENVIRONMENT`,
`AWS_APP_CONFIG_PROFILE`). All four share the standard `connect_descriptor` /
`user` / `password` / `wallet_location` / `jdbc` payload shape from
[Oracle JDBC Driver Extensions](../providers.md). Add `?parser=pkl` (with
`ojdbc-provider-pkl` on the classpath) for Pkl payloads — see
[Pkl Parser](pkl.md).

## Resource Providers

| Provider | Name | Gives the driver |
|----------|------|-------------------|
| Secrets Manager Username | `ojdbc-provider-aws-secrets-manager-username` | Username from a secret (`secretName`, optional `fieldName`) |
| Parameter Store Username | `ojdbc-provider-aws-parameter-store-username` | Username from a parameter (`parameterName`) |
| Secrets Manager Password | `ojdbc-provider-aws-secrets-manager-password` | Password from a secret |
| Parameter Store Password | `ojdbc-provider-aws-parameter-store-password` | Password from a parameter |
| Secrets Manager TCPS Wallet | `ojdbc-provider-aws-secrets-manager-tls` | TLS wallet (`SSO`/`PKCS12`/`PEM`) from a secret |
| Secrets Manager SEPS Wallet | `ojdbc-provider-aws-secrets-manager-seps` | Username+password from a SEPS wallet secret |
| Parameter Store SEPS Wallet | `ojdbc-provider-aws-parameter-store-seps` | Same as above, sourced from Parameter Store |
| Secrets Manager Connection String | `ojdbc-provider-aws-secrets-manager-tnsnames` | Connect string from a `tnsnames.ora` alias in a secret |
| Parameter Store Connection String | `ojdbc-provider-aws-parameter-store-tnsnames` | Same, sourced from Parameter Store |

`fieldName` selects a key when a secret/parameter stores multiple key-value
pairs; it is an error to set it on a plain-text secret, and an error to omit
it when multiple keys exist with no single unambiguous value.

```properties
oracle.jdbc.provider.password=ojdbc-provider-aws-secrets-manager-password
oracle.jdbc.provider.password.authenticationMethod=aws-default
oracle.jdbc.provider.password.awsRegion=us-west-2
oracle.jdbc.provider.password.fieldName=password
```

## Authentication

Providers use the AWS SDK [Default Credentials Provider
Chain](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/credentials-chain.html):
Java system properties → environment variables → web identity token (STS) →
shared credentials/config files → ECS container credentials → EC2 instance
role. The only provider-specific parameters are `authenticationMethod`
(currently just `aws-default`) and `awsRegion`, which — if unset — falls
back to the [default region provider
chain](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/region-selection.html#automatically-determine-the-aws-region-from-the-environment).

## Best Practices

- On EC2/ECS/Lambda, rely on the instance/task/execution role instead of
  static access keys.
- Set `awsRegion` explicitly when the resource's region differs from the
  environment's default region, to avoid cross-region latency or
  `ResourceNotFoundException`.
- Use `fieldName` rather than one secret per credential when several
  related values (username, password, wallet) live together — it keeps
  rotation atomic.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [Pkl Parser](pkl.md)
- [Network Security](../../../security/network-security.md)

## Sources

- [ojdbc-provider-aws README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-aws/README.md)
- [ojdbc-provider-samples (AWS)](https://github.com/oracle/ojdbc-extensions/tree/main/ojdbc-provider-samples/src/main/java/oracle/jdbc/provider/aws)
- [AWS SDK Default Credentials Provider Chain](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/credentials-chain.html)
- [Oracle AI Database JDBC Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/index.html)