# Oracle JDBC Driver Extensions

## Overview

Use this skill when a Java application needs Oracle JDBC to pull connection
strings, credentials, wallets, or trace events from a cloud secret store,
configuration service, or observability stack, instead of hardcoding them.

Starting with the 23.3 release, Oracle JDBC defines Service Provider
Interfaces (SPIs) in the `oracle.jdbc.spi` package. The
[oracle/ojdbc-extensions](https://github.com/oracle/ojdbc-extensions) project
implements these SPIs as "providers" that plug into the driver through
`java.util.ServiceLoader`, with no application code changes. This skill
distills the intent and configuration surface of those providers; consult the
per-cloud pages below when configuring a specific one.

For core JDBC usage (driver artifact selection, URLs, SQL, pooling), start
with [Java Oracle JDBC Overview](../java-oracle-jdbc.md) instead.

## Provider Types

Most providers in this project are one of two kinds:

| Type | What it gives the driver | Identified by |
|------|---------------------------|----------------|
| **Centralized Config Provider** | Everything needed to open a connection: connect descriptor, user, password, wallet, and JDBC properties, all in one payload | A JDBC URL prefix: `jdbc:oracle:thin:@config-{provider}://...` |
| **Resource Provider** | One specific resource: a password, username, access token, TLS wallet, SEPS wallet, or `tnsnames.ora`-based connection string | A connection property: `oracle.jdbc.provider.{resource-type}={provider-name}` |

A Resource Provider is selected per resource type. The property name to the
left of `=` is fixed by Oracle JDBC (e.g. `oracle.jdbc.provider.password`,
`oracle.jdbc.provider.accessToken`, `oracle.jdbc.provider.username`,
`oracle.jdbc.provider.traceEventListener`); the value is the provider's
registered name (e.g. `ojdbc-provider-oci-vault-password`). Provider-specific
parameters are appended as `oracle.jdbc.provider.{resource-type}.{param}=...`.

A third kind, the **JSON Provider** (`oracle.jdbc.spi.JsonProvider`), doesn't
supply connection resources at all — it plugs into the driver's native JSON
(OSON) handling. `ojdbc-provider-jackson-oson` is the one example in this
project; see [Jackson OSON Provider](providers/jackson-oson.md).

## Provider Map

| Provider | Dependency | JDK | Skill |
|----------|-----------|-----|-------|
| OCI | `com.oracle.database.jdbc:ojdbc-provider-oci` | 8+ | [OCI Providers](providers/oci.md) |
| Azure | `com.oracle.database.jdbc:ojdbc-provider-azure` | 8+ | [Azure Providers](providers/azure.md) |
| HashiCorp Vault (HCP Dedicated) | `com.oracle.database.jdbc:ojdbc-provider-hashicorp` | 8+ | [HashiCorp Providers](providers/hashicorp.md) |
| GCP | `com.oracle.database.jdbc:ojdbc-provider-gcp` | 8+ | [GCP Providers](providers/gcp.md) |
| AWS | `com.oracle.database.jdbc:ojdbc-provider-aws` | 8+ | [AWS Providers](providers/aws.md) |
| Observability (OpenTelemetry / JFR) | `com.oracle.database.jdbc:ojdbc-provider-observability` | 11+ | [Observability Provider](providers/observability.md) |
| Spring (Deep Data Security end-user context) | `com.oracle.database.jdbc:ojdbc-provider-spring` | 17+ | [Spring Providers](providers/spring.md) |
| Pkl parser (used by other providers) | `com.oracle.database.jdbc:ojdbc-provider-pkl` | 17+ | [Pkl Parser](providers/pkl.md) |
| Jackson OSON (JSON mapping) | `com.oracle.database.jdbc:ojdbc-provider-jackson-oson` | 8+ (needs JDBC 23.6+) | [Jackson OSON Provider](providers/jackson-oson.md) |

Keep every provider dependency you use on the same release line and version
(e.g. all `1.1.0`) when combined in one application.

## Shared Concepts Across Cloud Providers

The OCI, Azure, HashiCorp, GCP, and AWS providers share one design, so
learning it once transfers across clouds:

- **Configuration payload.** A Centralized Config Provider's payload is JSON
  by default, with four root keys: `connect_descriptor` (required), `user`,
  `password`, `wallet_location` (all optional), plus a `jdbc` object whose
  keys are properties from
  [`OracleConnection`](https://docs.oracle.com/en/database/oracle/oracle-database/23/jajdb/oracle/jdbc/OracleConnection.html)
  (e.g. `"autoCommit": "false"`, `"oracle.jdbc.ReadTimeout": 1000`).
- **Password / wallet_location as an object.** Instead of a raw string, both
  fields can be an object: `{"type": "ocivault|azurevault|gcpsecretmanager|
  awssecretsmanager|hcpvaultdedicated|base64", "value": "...", "authentication": {...}}`.
  This lets a payload stored in one cloud reference a secret stored in
  another. The wallet always goes in the top-level `wallet_location` object,
  not inside the `jdbc` object.
- **Pluggable payload parser.** Payloads are parsed as JSON unless a
  `parser` query parameter names another parser provider on the classpath,
  e.g. `?parser=pkl` with `ojdbc-provider-pkl` present. See
  [Pkl Parser](providers/pkl.md).
- **Auto-detect authentication.** Each cloud provider supports an
  `authenticationMethod` (or `AUTHENTICATION`) parameter with an
  `auto-detect` default that tries credential sources in a fixed order
  (SDK config file/env vars first, workload identity last). Prefer pinning
  an explicit method in production so a misconfigured environment fails
  loudly instead of silently authenticating as the wrong identity.
- **Common resource-provider parameters live on the property, not the URL.**
  Parameters are appended to whichever `oracle.jdbc.provider.*` property
  identifies the provider, and only work in a connection properties file or
  programmatic configuration — not as JVM system properties.

## Best Practices

- Pick the Centralized Config Provider path when one secret/service should
  own the *entire* connection (descriptor + credentials); pick Resource
  Providers when only one piece (e.g. just the password, or just an access
  token) should be externalized and the rest is static.
- Put the wallet in the `wallet_location` object and a plaintext secret in
  the `password` object — not inside the payload's `jdbc` object.
- Pin an explicit `authenticationMethod` in production; reserve
  `auto-detect` for local development.
- Keep every provider dependency used in one application on the same
  release version, and on the same line as `ojdbc17`/`ucp17` (see
  [JDBC Dependencies](dependencies.md)).
- Use least-privilege IAM/Vault policies for the identity each provider
  authenticates as — these providers only fetch what the driver needs, they
  do not authorize it.

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Setting `oracle.net.wallet_password` outside the `jdbc` object | Provider ignores it or the wallet fails to decrypt | Put `oracle.net.wallet_password` inside the payload's `jdbc` object |
| Configuring provider parameters as `-D` JVM system properties | Silently ignored for provider selection/config | Use a connection properties file or programmatic `Properties` |
| Mixing provider dependency versions | Class or behavior mismatches | Align all provider versions with the driver/UCP line |
| Relying on `auto-detect` in production | Non-deterministic identity if multiple credential sources are present | Set `authenticationMethod` explicitly |

## Related Skills

- [Java Oracle JDBC Overview](../java-oracle-jdbc.md)
- [JDBC Connections](connections.md)
- [JDBC Pooling and Production](pooling-production.md)
- [Network Security](../../security/network-security.md)

## Sources

- [oracle/ojdbc-extensions](https://github.com/oracle/ojdbc-extensions)
- [Oracle AI Database JDBC Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/index.html)
- [OracleResourceProvider (SPI)](https://docs.oracle.com/en/database/oracle/oracle-database/23/jajdb/oracle/jdbc/spi/OracleResourceProvider.html)
- [OracleConnection connection properties](https://docs.oracle.com/en/database/oracle/oracle-database/23/jajdb/oracle/jdbc/OracleConnection.html)