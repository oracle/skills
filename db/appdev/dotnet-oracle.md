# .NET + Oracle Database (ODP.NET)

## Overview

Oracle Data Provider for .NET (ODP.NET) is the official Oracle Database driver for .NET and C# applications. Three packages are available:

| Package | Description |
| ------- | ----------- |
| `Oracle.ManagedDataAccess.Core` | ODP.NET Core — pure .NET, no Oracle Client required for multi-platform .NET (Core). Recommended and most popular. |
| `Oracle.ManagedDataAccess` | Managed ODP.NET — pure .NET, no Oracle Client required. Recommended for .NET Framework on Windows apps. |
| `Oracle.DataAccess` | Unmanaged ODP.NET — requires Oracle Client installation. For .NET Framework on Windows apps. Deprecated in version 26ai. |

ODP.NET Core and managed ODP.NET can be installed from NuGet Gallery.

```bash
# Add ODP.NET Core via NuGet
dotnet add package Oracle.ManagedDataAccess.Core

# Add managed ODP.NET via NuGet
dotnet add package Oracle.ManagedDataAccess
```

Popular optional ODP.NET packages include:

| Package | Description |
| ------- | ----------- |
| `Oracle.EntityFrameworkCore` | ODP.NET Entity Framework Core is a cross-platform object-relational mapper for Oracle Database. Requires ODP.NET Core. |
| `Oracle.ManagedDataAccess.EntityFramework` | ODP.NET Entity Framework 6 is a .NET Framework object-relational mapper for Oracle Database. Requires managed ODP.NET. |
| `Oracle.ManagedDataAccess.OpenTelemetry` | ODP.NET Extension for OpenTelemetry creates and publishes ODP.NET traces to an OpenTelemetry collector. Available with ODP.NET Core managed ODP.NET. |

```bash
# Add ODP.NET Entity Framework Core via NuGet
dotnet add package Oracle.EntityFrameworkCore

# Add ODP.NET Entity Framework via NuGet
dotnet add package Oracle.ManagedDataAccess.EntityFramework

# Add ODP.NET OpenTelemetry via NuGet
dotnet add package Oracle.ManagedDataAccess.OpenTelemetry
```

The example code below uses or builds upon the Oracle HR sample schema.

---

## Connecting

### Basic Connection to On-Premises Oracle Database

```csharp
using Oracle.ManagedDataAccess.Client;

// Easy Connect connecting to Oracle AI Database Free
string connStr = "User Id=hr;Password=password;Data Source=localhost:1521/freepdb1;";

// Alternatives to connect using a net service alias and connect descriptor 
// connStr = "User Id=hr;Password=password;Data Source=mydb_high;";
// connStr = "User Id=hr;Password=password;" +
//     "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))" +
//     "(CONNECT_DATA=(SERVICE_NAME=freepdb1)));";

using var conn = new OracleConnection(connStr);
conn.Open();

using var cmd = conn.CreateCommand();
cmd.CommandText = "SELECT SYSDATE FROM DUAL";
var result = cmd.ExecuteScalar();
Console.WriteLine(result);
```

### Basic Connection to Oracle Autonomous AI Database using a wallet and mTLS

```csharp
// Set TNS_ADMIN to wallet directory containing tnsnames.ora, sqlnet.ora, cwallet.sso files
string connStr = "User Id=admin;Password=password;Data Source=myatp_high;" +
    "Connection Timeout=120;";

// Set fully qualified paths to wallet and *.ora files
OracleConfiguration.TnsAdmin = "<PATH TO *.ORA FILES>";
OracleConfiguration.WalletLocation = "<PATH TO WALLET FILE>";

using var conn = new OracleConnection(connStr);
conn.Open();
```

---

## Executing SQL

### Bind Parameters

ODP.NET uses `:` syntax for parameter binds. ODP.NET can bind by parameter order (default) or by name.

```csharp
using var cmd = new OracleCommand(
    "SELECT last_name, salary FROM employees WHERE department_id = :deptId AND salary > :minSal",
    conn);

cmd.Parameters.Add("deptId", OracleDbType.Int32).Value = 60;
cmd.Parameters.Add("minSal", OracleDbType.Decimal).Value = 5000;

using var reader = cmd.ExecuteReader();
while (reader.Read())
{
    Console.WriteLine($"{reader["LAST_NAME"]}: {reader["SALARY"]}");
}
```

### DML

```csharp
using var cmd = new OracleCommand(
    "UPDATE employees SET salary = :sal WHERE employee_id = :id", conn);

cmd.Parameters.Add("sal",  OracleDbType.Decimal).Value = 9500;
cmd.Parameters.Add("id",   OracleDbType.Int32).Value   = 100;

int rows = cmd.ExecuteNonQuery();
Console.WriteLine($"Rows updated: {rows}");
```

### Transactions

```csharp
using var txn = conn.BeginTransaction();
try
{
    using var cmd1 = new OracleCommand("UPDATE accounts SET balance = balance - :amt WHERE id = :from", conn);
    cmd1.Parameters.Add("amt",  OracleDbType.Decimal).Value = 500;
    cmd1.Parameters.Add("from", OracleDbType.Int32).Value   = 1;
    cmd1.ExecuteNonQuery();

    using var cmd2 = new OracleCommand("UPDATE accounts SET balance = balance + :amt WHERE id = :to", conn);
    cmd2.Parameters.Add("amt", OracleDbType.Decimal).Value = 500;
    cmd2.Parameters.Add("to",  OracleDbType.Int32).Value   = 2;
    cmd2.ExecuteNonQuery();

    txn.Commit();
}
catch
{
    txn.Rollback();
    throw;
}
```

### Batch Insert Using Array Binding

ODP.NET supports array binding for high-performance bulk DML:

```csharp
int batchSize = 3;
using var cmd = new OracleCommand(
    "INSERT INTO employees (employee_id, last_name, department_id) VALUES (:id, :name, :dept)",
    conn);

cmd.ArrayBindCount = batchSize;

cmd.Parameters.Add("id",   OracleDbType.Int32,   new int[]    { 301, 302, 303 }, ParameterDirection.Input);
cmd.Parameters.Add("name", OracleDbType.Varchar2, new string[] { "Alice", "Bob", "Carol" }, ParameterDirection.Input);
cmd.Parameters.Add("dept", OracleDbType.Int32,   new int[]    { 10, 20, 10 }, ParameterDirection.Input);

cmd.ExecuteNonQuery();
```

---

## Connection Pooling and Connection Strings

ODP.NET has built-in connection pooling enabled by default. Configure via the connection string:

```csharp
string connStr = "User Id=hr;Password=password;Data Source=localhost:1521/freepdb1;" +
    "Min Pool Size=5;Max Pool Size=150;Connection Timeout=20;Incr Pool Size=10;Decr Pool Size=2;";
```

### Store ODP.NET Connection Strings in `appsettings.json`

```json
{
  "ConnectionStrings": {
    "OracleDb": "User Id=hr;Password=password;Data Source=localhost:1521/freepdb1;Min Pool Size=2;Max Pool Size=20;"
  }
}
```

```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseOracle(builder.Configuration.GetConnectionString("OracleDb")));
```

---

## Entity Framework Core

```csharp
// DbContext
public class AppDbContext : DbContext
{
    public DbSet<Employee> Employees { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseOracle("User Id=hr;Password=password;Data Source=localhost:1521/freepdb1;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Employee>(e =>
        {
            e.ToTable("EMPLOYEES");
            e.HasKey(x => x.EmployeeId);
            e.Property(x => x.EmployeeId).HasColumnName("EMPLOYEE_ID");
            e.Property(x => x.LastName).HasColumnName("LAST_NAME").HasMaxLength(25);
            e.Property(x => x.Salary).HasColumnName("SALARY");
        });
    }
}

// Querying
using var db = new AppDbContext();
var employees = await db.Employees
    .Where(e => e.Salary > 5000)
    .OrderBy(e => e.LastName)
    .ToListAsync();

// Raw SQL with EF Core
var results = await db.Employees
    .FromSqlRaw("SELECT * FROM employees WHERE department_id = {0}", 60)
    .ToListAsync();
```

---

## PL/SQL Calls

### Stored Procedure

```csharp
using var cmd = new OracleCommand("hr.update_salary", conn);
cmd.CommandType = CommandType.StoredProcedure;
cmd.Parameters.Add("p_id",  OracleDbType.Int32).Value   = 100;
cmd.Parameters.Add("p_sal", OracleDbType.Decimal).Value = 9500;
cmd.ExecuteNonQuery();
```

### Function with Return Value

```csharp
using var cmd = new OracleCommand("hr.get_employee_count", conn);
cmd.CommandType = CommandType.StoredProcedure;

var ret = cmd.Parameters.Add("ret", OracleDbType.Int32);
ret.Direction = ParameterDirection.ReturnValue;

cmd.Parameters.Add("p_dept", OracleDbType.Int32).Value = 60;
cmd.ExecuteNonQuery();

Console.WriteLine($"Count: {ret.Value}");
```

### Return Result Set Using REF CURSOR

```csharp
using var cmd = new OracleCommand("hr.get_dept_employees", conn);
cmd.CommandType = CommandType.StoredProcedure;
cmd.Parameters.Add("p_dept", OracleDbType.Int32).Value = 60;

var cursorParam = cmd.Parameters.Add("p_cursor", OracleDbType.RefCursor);
cursorParam.Direction = ParameterDirection.Output;

cmd.ExecuteNonQuery();

using var reader = ((OracleRefCursor)cursorParam.Value).GetDataReader();
while (reader.Read())
{
    Console.WriteLine(reader["LAST_NAME"]);
}
```

---

## Large Object (LOB) Handling

```csharp
// Read Character LOB (CLOB)
using var cmd = new OracleCommand(
    "SELECT resume FROM employee_docs WHERE employee_id = :id", conn);
cmd.Parameters.Add("id", 100);

using var reader = cmd.ExecuteReader();
if (reader.Read())
{
    OracleClob clob = reader.GetOracleClob(0);
    string text = clob.Value;  // full text
    Console.WriteLine(text[..200]);
}

// Write Binary LOB (BLOB) from file
byte[] photoBytes = File.ReadAllBytes("photo.jpg");
using var cmd2 = new OracleCommand(
    "UPDATE employee_photos SET photo = :photo WHERE employee_id = :id", conn);
cmd2.Parameters.Add("photo", OracleDbType.Blob).Value = photoBytes;
cmd2.Parameters.Add("id", 100);
cmd2.ExecuteNonQuery();
```

---

## Best Practices

- **Always use bind parameters** with `:name` syntax — never string concatenation.
- **Rely on the built-in connection pool to optimize connection performance and behavior** — set `Min Pool Size` and `Max Pool Size` in the connection string.
- **Use array binding** for bulk inserts (`ArrayBindCount`) — far faster than looping.
- **Dispose all ODP.NET objects, especially connections and commands** with `using` or explicit `Close()` and `Dispose()` calls.
- **Use `OracleDbType` explicitly** to avoid implicit type mapping surprises.
- **Set `BindByName = true`** when the command's bind parameter order does not match the SQL order: `OracleCommand.BindByName = true;`.
- **For large result sets, reduce database round trips by increasing `RowsToFetchPerRoundTrip`** on the `OracleConfiguration`, `OracleConnection`, `OracleCommand`, `OracleDataReader`, or `OracleRefCursor` class.
- **For large LOBs and LONGs, reduce database round trips by increasing the initial LOB or LONG data retrieved using `InitialLOBFetchSize` and `InitialLONGFetchSize`, respectively.** By default, initial LOB and LONG data fetches are deferred until a read attempt.

---

## Common Mistakes

| Mistake | Problem | Fix |
| ------- | ------- | --- |
| Using `@parameter` instead of `:parameter` | Parameter not bound; ORA-01008 | ODP.NET uses `:name` syntax |
| Not setting `BindByName = true` | Parameters bound by position, not name | Set `OracleCommand.BindByName = true` when opting to bind parameters by name. |
| String concatenation in SQL | SQL injection | Use bind parameters and `OracleDBMSAssert` |
| Not disposing `OracleConnection` | Pool exhaustion | Use `using` statement or explicit `Close()` and `Dispose()` calls |
| Expecting EF Core to know the database version to ensure client feature compatibility | EF Core has no mechanism to retrieve this info | Set the database compatibility version, such as `UseOracleSQLCompatibility(OracleSQLCompatibility.DatabaseVersion23)` for Oracle AI Database 23ai and 26ai. |

---

## Oracle Version Notes (19c vs 26ai)

- `Oracle.ManagedDataAccess.Core` and `Oracle.ManagedDataAccess` 23.x support Oracle Database 19c through 26ai.
- `Oracle.EntityFrameworkCore` major version number matches the EF Core major version it supports, such as `Oracle.EntityFrameworkCore 10.23.26200` supports EF Core 10.
- Oracle AI Database `VECTOR` type support is available in ODP.NET 23.3 and higher.
- The `RowsToFetchPerRoundTrip` property is supported with ODP.NET Core and managed ODP.NET 23.7 and higher.

## Sources

- [ODP.NET Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/26/odpnt/)
- [Oracle .NET Developer Center](https://www.oracle.com/database/technologies/appdev/dotnet.html)
- [Oracle .NET Sample Code](https://github.com/oracle/dotnet-db-samples/)
- [Oracle .NET Videos](https://www.youtube.com/oracledotnetteam)
- [ODP.NET Forum](https://forums.oracle.com/ords/apexds/domain/dev-community/category/odp-dot-net)
