# JDBC Jackson OSON Provider

## Overview

Use this skill when a Java application reads or writes Oracle JSON (OSON)
columns and you want direct POJO ↔ OSON mapping through Jackson, instead of
hand-rolled `ObjectMapper`/`ObjectNode` marshaling around raw bytes.

This provider implements
[`oracle.jdbc.spi.OsonProvider`](https://docs.oracle.com/en/database/oracle/oracle-database/23/jajdb/oracle/jdbc/spi/OsonProvider.html)
(a `JsonProvider`) — a different SPI family from the Centralized
Config/Resource Providers covered in [Oracle JDBC Driver Extensions](../providers.md).
It plugs into the driver's native JSON handling rather than supplying
connection resources.

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-jackson-oson</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 8, forward compatible with later JDKs. Requires JDBC Thin
Driver **23.6 or newer**. This artifact pulls in `ojdbc8` transitively —
exclude it if the application already depends on `ojdbc11`/`ojdbc17`, so two
driver versions don't land on the classpath together:

```xml
<exclusions>
  <exclusion>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
  </exclusion>
</exclusions>
```

## Activation

Set the JSON provider connection property before opening the connection:

```java
OracleDataSource ods = new OracleDataSource();
ods.setURL(url);
ods.setUser(user);
ods.setPassword(password);
ods.setConnectionProperty(OracleConnection.CONNECTION_PROPERTY_PROVIDER_JSON, "jackson-json-provider");
Connection conn = ods.getConnection();
```

Unlike the cloud secret/config providers, this provider takes no further
`.{param}` suffixes — one property turns it on for the connection. Once
active, read/write JSON columns directly as POJOs:

```java
try (PreparedStatement pstmt = conn.prepareStatement(
        "insert into jackson_oson_sample (id, json_value) values (?, ?)")) {
    pstmt.setInt(1, 1);
    pstmt.setObject(2, emp, OracleType.JSON);   // Emp is a plain POJO
    pstmt.execute();
}

try (Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("select id, json_value from jackson_oson_sample")) {
    while (rs.next()) {
        Emp emp = rs.getObject(2, Emp.class);   // deserialized straight to the POJO
    }
}
```

The same activation property works transparently under Hibernate/JPA —
entities mapped to `JSON` columns get the same serialization path once the
property is set on the underlying connection.

## Java ↔ OSON Type Mapping

| Java Type | OSON Type |
|-----------|-----------|
| `LocalDateTime` | `TIMESTAMP` |
| `OffsetDateTime` | `TIMESTAMPTZ` |
| `Period` | `INTERVALYM` |
| `Duration` | `INTERVALDS` |
| `BigInteger`, `Year` | `NUMBER` |
| `byte[]` | `byte[]` |
| `java.util.Date` | `TIMESTAMP` |
| `java.sql.Date`, `LocalDate` | `DATE` |
| `Timestamp` | `TIMESTAMP` |
| `Boolean` | `BOOLEAN` |
| `UUID` | `UUID` (as `byte[]`) |

Standard Jackson annotations are supported on mapped POJOs; note that when
`@JsonFormat` is used, values are processed as strings rather than their
native OSON type.

## Best Practices

- Exclude the transitive `ojdbc8` dependency whenever the application
  already pins `ojdbc11`/`ojdbc17` — see [JDBC Dependencies](../dependencies.md).
- Prefer `setObject(..., OracleType.JSON)` / `getObject(..., Class)` over
  manually building `ObjectNode`/byte arrays — that direct POJO mapping is
  the reason to use this provider at all.
- Confirm the target column is a native `JSON` (OSON) column, not
  `VARCHAR2`/`CLOB` holding JSON text — this provider maps to OSON storage;
  see [JSON in Oracle](../../json-in-oracle.md) for the database-side type.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [JSON in Oracle](../../json-in-oracle.md)
- [JDBC SQL and PL/SQL](../sql.md)

## Sources

- [ojdbc-provider-jackson-oson README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-jackson-oson/README.md)
- [oracle.jdbc.spi.OsonProvider](https://docs.oracle.com/en/database/oracle/oracle-database/23/jajdb/oracle/jdbc/spi/OsonProvider.html)
- [ojdbc-provider-samples (OSON)](https://github.com/oracle/ojdbc-extensions/tree/main/ojdbc-provider-samples/src/main/java/oracle/jdbc/provider/oson/sample)