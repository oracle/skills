# JDBC Dependencies for Oracle Database

## Overview

Use this skill to choose the Oracle JDBC driver and related artifacts for a Java application that connects to Oracle Database.

Oracle provides the JDBC Thin driver (`ojdbc`) as a pure Java JAR, so no Oracle Client installation is required for standard JDBC Thin connections. Oracle also provides UCP (Universal Connection Pool) for production connection pooling.

## Driver and JDK Selection

| JAR | JDK Compatibility |
|-----|-------------------|
| `ojdbc17.jar` | JDK 17, 19, 21, 25 |
| `ojdbc11.jar` | JDK 11, 21 |
| `ojdbc8.jar` | JDK 8, 11 |

Use the matching UCP artifact for the JDBC driver line:

| JDBC artifact | UCP artifact |
|---------------|--------------|
| `ojdbc17` | `ucp17` |
| `ojdbc11` | `ucp11` |
| `ojdbc8` | `ucp` |

Keep `ojdbc` and `ucp` artifacts on the same version.

## Maven

For modern JDK 17+ applications:

```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc17</artifactId>
    <version>23.26.2.0.0</version>
</dependency>

<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ucp17</artifactId>
    <version>23.26.2.0.0</version>
</dependency>
```

For JDK 11 applications:

```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <version>23.26.2.0.0</version>
</dependency>

<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ucp11</artifactId>
    <version>23.26.2.0.0</version>
</dependency>
```

For applications that intentionally use Oracle's production dependency bundle:

```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc17-production</artifactId>
    <version>23.26.2.0.0</version>
    <type>pom</type>
</dependency>
```

## Gradle

For modern JDK 17+ applications:

```groovy
implementation 'com.oracle.database.jdbc:ojdbc17:23.26.2.0.0'
implementation 'com.oracle.database.jdbc:ucp17:23.26.2.0.0'
```

For JDK 11 applications:

```groovy
implementation 'com.oracle.database.jdbc:ojdbc11:23.26.2.0.0'
implementation 'com.oracle.database.jdbc:ucp11:23.26.2.0.0'
```

## Dependency Practices

- Pin JDBC and UCP versions explicitly unless your platform has a controlled BOM strategy.
- Upgrade the JDBC driver through normal dependency patching, especially for security and compatibility fixes.
- Keep JDBC, UCP, ONS, and related Oracle database client artifacts from the same release line when practical.
- Use `ojdbc17` for new JDK 17+ services unless a platform constraint requires `ojdbc11`.
- Avoid old drivers such as `ojdbc6` or `ojdbc7`; they miss current fixes and features.

## Oracle Version Notes (19c vs 26ai)

- The examples use the Oracle AI Database 26ai JDBC/UCP RU line.
- Oracle Database 26ai JDBC drivers are certified with Oracle Database 26ai, 21c, and 19c servers.
- Newer server features, such as JSON Relational Duality Views and `VECTOR`, require a compatible database release and a current JDBC driver line.

## Related Skills

- [JDBC Connections](connections.md)
- [JDBC Pooling and Production](pooling-production.md)
- [Java Oracle JDBC Overview](../java-oracle-jdbc.md)

## Sources

- [Oracle AI Database JDBC Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/index.html)
- [Oracle AI Database UCP Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjucp/index.html)
- [Oracle JDBC Downloads](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html)
