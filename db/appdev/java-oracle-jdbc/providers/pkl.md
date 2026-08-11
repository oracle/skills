# JDBC Pkl Parser

## Overview

Use this skill when a Centralized Config Provider's payload should be
written in [Pkl](https://pkl-lang.org/index.html) (a typed configuration
language with schema-checked templates) instead of raw JSON.

This is a **parser**, not a config source on its own — it implements
`OracleConfigurationParser` and plugs into any provider that extends
`OracleConfigurationParsableProvider`: `file`, `https` (built into the
driver), and the OCI Object Storage/Vault, Azure Vault, GCP Storage/Secret
Manager, AWS S3/Secrets Manager/Parameter Store/AppConfig providers — see
[Oracle JDBC Driver Extensions](../providers.md) for the full list.

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-pkl</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 17 (required by Pkl itself), forward compatible with later
JDKs.

## Usage

Add `parser=pkl` to any supporting provider's URL; the default parser is
`json` when this option is omitted.

```
jdbc:oracle:thin:@config-file://{pkl-file-name}?parser=pkl[&key=prefix&label=value]
```

## Writing a `.pkl` Configuration

Two authoring styles are supported, both against the shared
[`JdbcConfig.pkl`](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-pkl/template/JdbcConfig.pkl)
template, which defines the same `connect_descriptor` / `user` / `password`
/ `wallet_location` / `jdbc` shape used by the JSON payloads.

**`amends`** — one config per file, the whole file *is* the config:

```pkl
amends "https://raw.githubusercontent.com/oracle/ojdbc-extensions/refs/heads/main/ojdbc-provider-pkl/template/JdbcConfig.pkl"

connect_descriptor = "dbhost:1521/orclpdb1"
user = "scott"

password {
  type = "ocivault"
  value = "ocid1.vaultsecret..."
  authentication { ["method"] = "OCI_DEFAULT" }
}

jdbc {
  autoCommit = false
  `oracle.jdbc.loginTimeout` = 60.s
}
```

```
jdbc:oracle:thin:@config-file://myJdbcConfig.pkl?parser=pkl
```

**`import`** — multiple named configs in one file, selected with `key`:

```pkl
import "https://raw.githubusercontent.com/oracle/ojdbc-extensions/refs/heads/main/ojdbc-provider-pkl/template/JdbcConfig.pkl"

config1 = (JdbcConfig) {
  connect_descriptor = "dbhost:1521/orclpdb1"
  user = "scott"
  password {
    type = "ocivault"
    value = "ocid1.vaultsecret..."
    authentication { ["method"] = "OCI_DEFAULT" }
  }
  jdbc { autoCommit = false }
}
```

```
jdbc:oracle:thin:@config-file://myJdbcConfig.pkl?parser=pkl&key=config1
```

## Best Practices

- Prefer `amends` for one-config-per-file setups (simplest, matches the
  JSON single-payload model); use `import` with `key` only when several
  environments/configs genuinely belong in one file.
- Amend/import the template by a pinned commit or tag, not a moving branch
  ref, so a template change upstream cannot silently alter parsing of an
  already-deployed config.
- Pkl's typed properties (e.g. `60.s` as a duration) catch malformed values
  at parse time — prefer them over string-typed JDBC properties where Pkl's
  schema supports it.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [OCI Providers](oci.md)
- [Azure Providers](azure.md)
- [AWS Providers](aws.md)
- [GCP Providers](gcp.md)
- [HashiCorp Providers](hashicorp.md)

## Sources

- [ojdbc-provider-pkl README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-pkl/README.md)
- [ojdbc-provider-samples (Pkl)](https://github.com/oracle/ojdbc-extensions/tree/main/ojdbc-provider-samples/src/main/java/oracle/jdbc/provider/pkl/configuration)
- [Pkl language](https://pkl-lang.org/index.html)
- [JdbcConfig.pkl template](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-pkl/template/JdbcConfig.pkl)