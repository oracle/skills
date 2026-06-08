# JDBC SQL and PL/SQL

## Overview

Use this skill when executing SQL or PL/SQL from Java with Oracle JDBC. It covers bind variables, named binds, DML, batching, stored procedures, functions, OUT parameters, and REF CURSOR results.

For connection URL setup, start with [JDBC Connections](connections.md).

## Bind Variables

Always use `PreparedStatement` with `?` placeholders for user values. Do not concatenate user input into SQL strings.

```java
String sql = "SELECT last_name, salary FROM employees WHERE department_id = ? AND salary > ?";

try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setInt(1, 60);
    pstmt.setDouble(2, 5000.0);

    try (ResultSet rs = pstmt.executeQuery()) {
        while (rs.next()) {
            System.out.printf("%s: %.2f%n",
                    rs.getString("last_name"),
                    rs.getDouble("salary"));
        }
    }
}
```

## Named Binds

Oracle JDBC supports named binds through `OraclePreparedStatement`.

```java
import oracle.jdbc.OraclePreparedStatement;

String sql = "SELECT last_name FROM employees WHERE employee_id = :id";

try (OraclePreparedStatement pstmt =
        (OraclePreparedStatement) conn.prepareStatement(sql)) {
    pstmt.setIntAtName("id", 100);

    try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
            System.out.println(rs.getString(1));
        }
    }
}
```

## DML

Manage transaction boundaries explicitly for DML-heavy code.

```java
conn.setAutoCommit(false);

String sql = "UPDATE employees SET salary = ? WHERE employee_id = ?";

try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setDouble(1, 9500.0);
    pstmt.setInt(2, 100);

    int rowsUpdated = pstmt.executeUpdate();
    conn.commit();

    System.out.println("Rows updated: " + rowsUpdated);
} catch (SQLException e) {
    conn.rollback();
    throw e;
}
```

## Batch Inserts

Use `addBatch` and `executeBatch` for bulk inserts or updates.

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

## Fetch Size

For large result sets, tune fetch size to reduce round trips.

```java
try (PreparedStatement pstmt = conn.prepareStatement(
        "SELECT employee_id, last_name FROM employees")) {
    pstmt.setFetchSize(1000);

    try (ResultSet rs = pstmt.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getInt("employee_id"));
        }
    }
}
```

## Stored Procedure

```java
try (CallableStatement cstmt = conn.prepareCall("{call hr.update_salary(?, ?)}")) {
    cstmt.setInt(1, 100);
    cstmt.setDouble(2, 9500.0);
    cstmt.execute();
    conn.commit();
}
```

## Function with Return Value

```java
try (CallableStatement cstmt = conn.prepareCall("{? = call hr.get_employee_count(?)}")) {
    cstmt.registerOutParameter(1, Types.INTEGER);
    cstmt.setInt(2, 60);
    cstmt.execute();

    int count = cstmt.getInt(1);
    System.out.println("Count: " + count);
}
```

## OUT Parameters

```java
try (CallableStatement cstmt = conn.prepareCall(
        "{call hr.get_employee(?, ?, ?)}")) {
    cstmt.setInt(1, 100);
    cstmt.registerOutParameter(2, Types.VARCHAR);
    cstmt.registerOutParameter(3, Types.NUMERIC);
    cstmt.execute();

    System.out.printf("%s: %.2f%n",
            cstmt.getString(2),
            cstmt.getDouble(3));
}
```

## REF CURSOR

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

## Dynamic SQL Safety

Bind variables protect values, not SQL identifiers. If user input controls table names, column names, sort directions, or other SQL structure, validate it against a whitelist before building the SQL string.

```java
if (!ALLOWED_TABLES.contains(userInputTable)) {
    throw new IllegalArgumentException("Unsupported table");
}

String sql = "SELECT * FROM " + userInputTable + " WHERE employee_id = ?";

try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setInt(1, employeeId);
    try (ResultSet rs = pstmt.executeQuery()) {
        // use rs
    }
}
```

## Best Practices

- Use `PreparedStatement` for SQL with values.
- Use try-with-resources for connections, statements, and result sets.
- Disable `autoCommit` for DML-heavy code and commit intentionally.
- Roll back failed transactions before returning the connection to a pool.
- Use `addBatch` and `executeBatch` for bulk operations.
- Use typed getters such as `getString`, `getInt`, and `getTimestamp` when the expected type is known.
- Set `fetchSize` for large query result sets.

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `Statement` with string concatenation | SQL injection | Use `PreparedStatement` |
| Not closing `ResultSet` or `Statement` | Connection and cursor leaks | Use try-with-resources |
| `autoCommit=true` in batch jobs | Commits per row and slows the job | Use `setAutoCommit(false)` and batch commit |
| `getObject()` everywhere | Type mismatch surprises | Use typed getters where practical |
| Not setting `fetchSize` | Excessive round trips on large results | Use `stmt.setFetchSize(...)` |

## Oracle Version Notes (19c vs 26ai)

- Oracle 23ai and 26ai JSON Relational Duality Views are queryable through standard JDBC.
- The 23ai and 26ai `VECTOR` data type is supported by the 23.x/26ai JDBC driver line.
- Keep SQL examples compatible with the target database version, especially when using newer data types or JSON features.

## Related Skills

- [JDBC Connections](connections.md)
- [JDBC Pooling and Production](pooling-production.md)
- [SQL Injection Avoidance](../../sql-dev/sql-injection-avoidance.md)
- [Transaction Management](../transaction-management.md)
- [Java Oracle JDBC Overview](../java-oracle-jdbc.md)

## Sources

- [Oracle AI Database JDBC Developer's Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/index.html)
- [Oracle JDBC Downloads](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html)
