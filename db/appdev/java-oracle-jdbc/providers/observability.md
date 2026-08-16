# JDBC Observability Provider

## Overview

Use this skill to trace Oracle JDBC activity — round trips, Application
Continuity (AC) replay, VIP failover — into OpenTelemetry (OTEL) or Java
Flight Recorder (JFR), without changing application code.

The provider implements the driver's `TraceEventListener` SPI and is
notified of driver-internal events, which it publishes to the enabled
tracer(s).

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-observability</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 11, forward compatible with later JDKs.

## Usage

```properties
oracle.jdbc.provider.traceEventListener=observability-trace-event-listener-provider
oracle.jdbc.provider.traceEventListener.unique_identifier=<name>
```

Connections that share a `unique_identifier` share one listener instance and
configuration; omit it to use the identifier `default`.

## Configuring Which Tracers Run

```java
System.setProperty("oracle.jdbc.provider.observability.enabledTracers", "OTEL,JFR");
System.setProperty("oracle.jdbc.provider.observability.sensitiveDataEnabled", "true");
```

Or via MBean at runtime:

```java
ObservabilityTraceEventListener listener = ObservabilityTraceEventListener.getTraceEventListener("<name>");
ObjectName objectName = new ObjectName(listener.getMBeanObjectName());
MBeanServer server = ManagementFactory.getPlatformMBeanServer();
server.setAttribute(objectName, new Attribute("EnabledTracers", "OTEL,JFR"));
server.setAttribute(objectName, new Attribute("SensitiveDataEnabled", "true"));
```

`sensitiveDataEnabled` (default `false`) gates attributes like SQL text,
database username, and full connection descriptors — leave it off in
production unless your trace backend is access-controlled to the same
standard as the database itself.

## OpenTelemetry Semantic Conventions

The OTEL tracer supports both the legacy (default) and the stable OTel
Database Semantic Conventions, controlled by the
`OTEL_SEMCONV_STABILITY_OPT_IN` environment variable:

| Value | Behavior |
|-------|----------|
| unset (default) | Legacy/experimental attributes only |
| `database` | Stable attributes only (`db.system.name`, `db.operation.name`, `oracle.db.*`, `server.address`, etc.) |
| `database/dup` | Both, for gradual migration |

```bash
export OTEL_SEMCONV_STABILITY_OPT_IN=database
```

Stable roundtrip attributes include `db.system.name` (`"oracle.db"`),
`oracle.db.service`, `db.operation.name`, `db.query.summary`,
`server.address`/`server.port`, `oracle.db.instance.name`, `oracle.db.pdb`,
`oracle.db.query.sql.id`, `oracle.db.session.id`; opt-in (sensitive)
attributes include `db.user`, `db.query.text`, `db.response.returned_rows`;
error attributes include `error.type` and `db.response.status_code`
(`ORA-XXXXX`). AC replay and VIP retry events have analogous stable/legacy
attribute sets — see the provider's README for the full list.

## Backward Compatibility

The older, OTEL-only provider name still works:

```properties
oracle.jdbc.provider.traceEventListener=open-telemetry-trace-event-listener-provider
```

This enables only OTEL (not JFR), and is configured via
`oracle.jdbc.provider.opentelemetry.enabled` /
`oracle.jdbc.provider.opentelemetry.sensitive-enabled` system properties or
the equivalent `Enabled`/`SensitiveDataEnabled` MBean attributes.

## Best Practices

- Start with `enabledTracers=OTEL` in most stacks; add `JFR` only when you
  need JVM-native profiling correlation.
- Migrate to `OTEL_SEMCONV_STABILITY_OPT_IN=database/dup` before cutting
  over dashboards/alerts built on the legacy attribute names, then drop to
  `database` once consumers are updated.
- Keep `sensitiveDataEnabled=false` unless the trace pipeline is as trusted
  as the database connection itself.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [Java Oracle JDBC Overview](../../java-oracle-jdbc.md)
- [AWR Reports](../../../performance/awr-reports.md)

## Sources

- [ojdbc-provider-observability README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-observability/README.md)
- [OpenTelemetry Database Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/database/database-spans/)