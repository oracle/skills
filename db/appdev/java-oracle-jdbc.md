# Java + Oracle Database (JDBC)

## Overview

Oracle provides the **JDBC Thin driver** (`ojdbc`) for connecting Java applications to Oracle Database. No Oracle Client installation is required — the driver is a pure Java JAR. Oracle also provides **UCP** (Universal Connection Pool) for production connection pooling.

| JAR | JDK Compatibility |
|-----|-------------------|
| `ojdbc11.jar` | JDK 11, 17, 21 |
| `ojdbc8.jar`  | JDK 8, 11, 17, 21 |

### Maven / Gradle

```xml
<!-- Maven -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <version>23.4.0.24.05</version>
</dependency>

<!-- UCP (connection pool) -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ucp11</artifactId>
    <version>23.4.0.24.05</version>
</dependency>
```

```groovy
// Gradle
implementation 'com.oracle.database.jdbc:ojdbc11:23.4.0.24.05'
implementation 'com.oracle.database.jdbc:ucp11:23.4.0.24.05'
```

---

## Connecting

### Basic Connection

```java
import java.sql.*;
import oracle.jdbc.pool.OracleDataSource;

// Easy Connect
String url = "jdbc:oracle:thin:@localhost:1521/freepdb1";

// Alternatives:
// String url = "jdbc:oracle:thin:@mydb_high";  // TNS alias
// String url = "jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=freepdb1)))";

try (Connection conn = DriverManager.getConnection(url, "hr", "password");
     Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("SELECT sysdate FROM dual")) {
    if (rs.next()) {
        System.out.println(rs.getTimestamp(1));
    }
}
```

### Wallet / mTLS (Autonomous Database)

```java
System.setProperty("oracle.net.tns_admin", "/path/to/wallet");

String url = "jdbc:oracle:thin:@myatp_high?TNS_ADMIN=/path/to/wallet";

// If the wallet is password-protected
OracleDataSource ods = new OracleDataSource();
ods.setURL(url);
ods.setUser("admin");
ods.setPassword("password");
ods.setConnectionProperty("oracle.net.wallet_password", "walletpassword");

try (Connection conn = ods.getConnection()) {
    // use conn
}
```

---

## Executing SQL

### Bind Variables (PreparedStatement)

Always use `PreparedStatement` with `?` placeholders — never concatenate user input.

```java
String sql = "SELECT last_name, salary FROM employees WHERE department_id = ? AND salary > ?";

try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setInt(1, 60);
    pstmt.setDouble(2, 5000.0);

    try (ResultSet rs = pstmt.executeQuery()) {
        while (rs.next()) {
            System.out.printf("%s: %.2f%n", rs.getString("last_name"), rs.getDouble("salary"));
        }
    }
}
```

### Named Binds (OraclePreparedStatement)

```java
import oracle.jdbc.OraclePreparedStatement;

String sql = "SELECT last_name FROM employees WHERE employee_id = :id";

try (OraclePreparedStatement pstmt = (OraclePreparedStatement) conn.prepareStatement(sql)) {
    pstmt.setIntAtName("id", 100);
    try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) System.out.println(rs.getString(1));
    }
}
```

### DML

```java
String sql = "UPDATE employees SET salary = ? WHERE employee_id = ?";

try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setDouble(1, 9500.0);
    pstmt.setInt(2, 100);
    int rowsUpdated = pstmt.executeUpdate();
    conn.commit();
    System.out.println("Rows updated: " + rowsUpdated);
}
```

### Batch Insert (addBatch / executeBatch)

```java
conn.setAutoCommit(false);

String sql = "INSERT INTO employees (employee_id, last_name, department_id) VALUES (?, ?, ?)";

try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    int[][] data = {{201, 60}, {202, 20}, {203, 10}};
    String[] names = {"Alice", "Bob", "Carol"};

    for (int i = 0; i < data.length; i++) {
        pstmt.setInt(1, data[i][0]);
        pstmt.setString(2, names[i]);
        pstmt.setInt(3, data[i][1]);
        pstmt.addBatch();
    }
    int[] results = pstmt.executeBatch();
    conn.commit();
}
```

---

## Connection Pooling (UCP)

```java
import oracle.ucp.jdbc.PoolDataSource;
import oracle.ucp.jdbc.PoolDataSourceFactory;

PoolDataSource pds = PoolDataSourceFactory.getPoolDataSource();
pds.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
pds.setURL("jdbc:oracle:thin:@localhost:1521/freepdb1");
pds.setUser("hr");
pds.setPassword("password");
pds.setInitialPoolSize(2);
pds.setMinPoolSize(2);
pds.setMaxPoolSize(20);
pds.setConnectionPoolName("HRPool");

// Borrow connection from pool
try (Connection conn = pds.getConnection()) {
    // use conn
}
```

### Spring Boot DataSource Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521/freepdb1
    username: hr
    password: password
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 2
```

```xml
<!-- pom.xml — Spring Boot uses HikariCP by default; UCP needs explicit config -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11-production</artifactId>
    <version>23.4.0.24.05</version>
    <type>pom</type>
</dependency>
```

---

## PL/SQL Calls

### Stored Procedure

```java
// {call procedure_name(?, ?, ?)}
try (CallableStatement cstmt = conn.prepareCall("{call hr.update_salary(?, ?)}")) {
    cstmt.setInt(1, 100);
    cstmt.setDouble(2, 9500.0);
    cstmt.execute();
    conn.commit();
}
```

### Function with Return Value

```java
try (CallableStatement cstmt = conn.prepareCall("{? = call hr.get_employee_count(?)}")) {
    cstmt.registerOutParameter(1, Types.INTEGER);
    cstmt.setInt(2, 60);
    cstmt.execute();
    int count = cstmt.getInt(1);
    System.out.println("Count: " + count);
}
```

### OUT Parameters

```java
try (CallableStatement cstmt = conn.prepareCall(
        "{call hr.get_employee(?, ?, ?)}")) {
    cstmt.setInt(1, 100);
    cstmt.registerOutParameter(2, Types.VARCHAR);   // last_name OUT
    cstmt.registerOutParameter(3, Types.NUMERIC);   // salary OUT
    cstmt.execute();
    System.out.printf("%s: %.2f%n", cstmt.getString(2), cstmt.getDouble(3));
}
```

### REF CURSOR

```java
import oracle.jdbc.OracleTypes;

try (CallableStatement cstmt = conn.prepareCall(
        "{call hr.get_dept_employees(?, ?)}")) {
    cstmt.setInt(1, 60);
    cstmt.registerOutParameter(2, OracleTypes.CURSOR);
    cstmt.execute();

    try (ResultSet rs = (ResultSet) cstmt.getObject(2)) {
        while (rs.next()) {
            System.out.println(rs.getString("last_name"));
        }
    }
}
```

---

## Security Considerations

### Credential Management
- **Never hardcode passwords** in application code or configuration files
- Use Oracle Wallet to store credentials securely:
  ```java
  // For Autonomous Database or TLS connections
  System.setProperty("oracle.net.tns_admin", "/path/to/wallet");
  String url = "jdbc:oracle:thin:@myatp_high?TNS_ADMIN=/path/to/wallet";
  // Wallet password can be set via connection property
  OracleDataSource ods = new OracleDataSource();
  ods.setURL(url);
  ods.setUser("username");
  // Wallet password (if wallet is password-protected)
  ods.setConnectionProperty("oracle.net.wallet_password", "walletPassword");
  ```
- Consider using external credential stores (AWS Secrets Manager, HashiCorp Vault) for production deployments

### Network Security
- **Always use TCPS (TLS)** for production connections:
  ```java
  String url = "jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCPS)(HOST=db-host)(PORT=2484))(CONNECT_DATA=(SERVICE_NAME=service_name)))";
  ```
- Verify server identity with `SSL_SERVER_CERT_DN` in connection properties when using TCPS
- For cloud deployments, use IAM authentication where available:
  ```java
  // Example for Oracle Cloud Infrastructure
  OracleDataSource ods = new OracleDataSource();
  ods.setURL("jdbc:oracle:thin:@your_tcp_alias");
  // Set IAM credentials via OracleCloudIamUsernameCallbackHandler
  ```

### SQL Injection Prevention
- **Always use `PreparedStatement`** with bind variables (already covered in best practices)
- Never concatenate user input into SQL strings
- For dynamic SQL (table/column names), use whitelist validation:
  ```java
  // UNSAFE: String sql = "SELECT * FROM " + userInputTable; // NEVER DO THIS
  // SAFE: Validate against allowed table names
  if (ALLOWED_TABLES.contains(userInputTable)) {
      String sql = "SELECT * FROM " + userInputTable;
      // Use PreparedStatement for any user values in WHERE clause
  }
  ```

### Principle of Least Privilege
- Database user should have **minimum required privileges**:
  ```sql
  -- Instead of granting CONNECT, RESOURCE roles:
  CREATE USER app_user IDENTIFIED BY "secure_password";
  GRANT CREATE SESSION TO app_user;
  GRANT SELECT, INSERT, UPDATE ON needed_table TO app_user;
  GRANT EXECUTE ON needed_procedure TO app_user;
  ```
- Avoid granting excessive privileges like `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`
- Use roles to manage permissions: `GRANT app_user_role TO app_user;`

### Auditing and Monitoring
- Set client information for traceability in database logs:
  ```java
  OracleConnection oraConn = conn.unwrap(OracleConnection.class);
  oraConn.setClientInfo("OCSID.MODULE", "YourAppName");
  oraConn.setClientInfo("OCSID.ACTION", "SpecificOperation");
  oraConn.setClientInfo("OCSID.CLIENTID", "endUserIdentifier");
  ```
- These values appear in `V$SESSION.MODULE`, `V$SESSION.ACTION`, `V$SESSION.CLIENT_IDENTIFIER`
- Enable unified auditing to track database access:
  ```sql
  -- Audit failed logins (brute force detection)
  CREATE AUDIT POLICY failed_logins_pol
    ACTIONS LOGON
    WHENEVER NOT SUCCESSFUL;
  AUDIT POLICY failed_logins_pol;
  ```

### Data Protection
- Consider using **Transparent Data Encryption (TDE)** for sensitive data at rest
- For application-level encryption of sensitive fields before storage:
  ```java
  // Encrypt sensitive data before inserting/updateing
  String encryptedSSN = encrypt(ssnValue); // Using AES/GCM or similar
  preparedStatement.setString(1, encryptedSSN);
  ```
- Use Oracle Data Redaction for masking sensitive data in query results:
  ```sql
  -- Example: Redact SSN for non-HR users
  BEGIN
    DBMS_REDACT.ADD_POLICY(
      object_schema => 'HR',
      object_name => 'EMPLOYEES',
      column_name => 'SSN',
      policy_name => 'REDACT_SSN_POLICY',
      function_type => DBMS_REDACT.PARTIAL,
      expression => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') NOT IN (''HR_MANAGER'')'
    );
  END;
  ```

### Connection Pool Security
- When using connection pools (UCP, HikariCP):
  - Validate connections before use: `setConnectionValidationQuery("SELECT 1 FROM DUAL")`
  - Set appropriate timeout values to prevent resource exhaustion
  - Consider using separate pools for different privilege levels if needed
- For UCP specifically:
  ```java
  PoolDataSource pds = PoolDataSourceFactory.getPoolDataSource();
  pds.setConnectionFactoryClassName("oracle.jdbc.pool.OracleDataSource");
  pds.setURL(secureUrl);
  pds.setUser(username);
  // Consider using callback handlers for credential retrieval
  pds.setConnectionFactoryProperties(java.util.Collections.singletonMap(
      "oracle.net.wallet_location", "(SOURCE=(METHOD=FILE)(METHOD_DATA=(DIRECTORY=/path/to/wallet)))"
  ));
  ```

### Dependency Security
- Keep JDBC driver updated: Regularly check for new `ojdbc` versions
- Monitor for CVEs in Oracle JDBC driver and related libraries
- Use dependency checking tools (OWASP Dependency-Check, Snyk) in CI/CD pipeline

---

## Best Practices

- **Always use `PreparedStatement`** — never `Statement` with string concatenation.
- **Use `try-with-resources`** for connections, statements, and result sets.
- **Disable `autoCommit`** for DML-heavy code: `conn.setAutoCommit(false)`.
- **Use `addBatch`/`executeBatch`** for bulk inserts — far faster than looping single inserts.
- **Use UCP** for production pooling; Hikari is fine for Spring Boot apps.
- **Set `setFetchSize`** on `Statement` for large result sets: `stmt.setFetchSize(1000)`.
- **Set client info** (`OCSID.MODULE`, `OCSID.ACTION`) for tracing in AWR/ASH.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `Statement` with string concat | SQL injection | Use `PreparedStatement` |
| Not closing `ResultSet`/`Statement` | Connection/cursor leaks | Use try-with-resources |
| `autoCommit=true` in batch jobs | Commits per row; very slow | `setAutoCommit(false)` + batch commit |
| `getObject()` instead of typed getter | Type mismatch surprises | Use `getString()`, `getInt()`, etc. |
| Not setting `fetchSize` | Excessive round-trips on large result sets | `stmt.setFetchSize(1000)` |
| Using `ojdbc6` or `ojdbc7` | Unsupported, missing features | Use `ojdbc8` (JDK8+) or `ojdbc11` (JDK11+) |

---

## Oracle Version Notes (19c vs 26ai)

- `ojdbc11` 23.x supports both Oracle 19c and 23ai servers.
- Oracle 23ai JSON Relational Duality Views are queryable via standard JDBC.
- `ojdbc11` 23.x adds support for the `VECTOR` data type (23ai AI Vector Search).

## Sources

- [Oracle JDBC Developer's Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/)
- [UCP Developer's Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjucp/)
- [Oracle JDBC Downloads (Maven Central)](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html)
- [Spring Boot Oracle Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#appendix.application-properties.data)
