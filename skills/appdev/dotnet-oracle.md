# .NET + Oracle Database (ODP.NET)

## Overview

Oracle Data Provider for .NET (ODP.NET) is the official Oracle driver for .NET applications. Two packages are available:

| Package | Description |
|---------|-------------|
| `Oracle.ManagedDataAccess.Core` | Managed driver — pure .NET, no Oracle Client required. Recommended for most scenarios. |
| `Oracle.DataAccess` | Unmanaged driver — requires Oracle Client installation. Needed for advanced features (AQ, Sharding). |

```bash
# NuGet — Managed driver (.NET 6+)
dotnet add package Oracle.ManagedDataAccess.Core

# Entity Framework Core provider
dotnet add package Oracle.EntityFrameworkCore
```

---

## Connecting

### Basic Connection

```csharp
using Oracle.ManagedDataAccess.Client;

// Easy Connect
string connStr = "User Id=hr;Password=password;Data Source=localhost:1521/freepdb1;";

// Alternatives:
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

### Wallet / mTLS (Autonomous Database)

```csharp
// Set TNS_ADMIN to wallet directory (contains tnsnames.ora, sqlnet.ora, cwallet.sso)
string connStr = "User Id=admin;Password=password;Data Source=myatp_high;" +
    "Connection Timeout=30;";

// Configure wallet location in code
OracleConfiguration.TnsAdmin = "/path/to/wallet";
OracleConfiguration.WalletLocation = "/path/to/wallet";

using var conn = new OracleConnection(connStr);
conn.Open();
```

---

## Executing SQL

### Bind Parameters

ODP.NET uses `:name` syntax for named binds (not `@` like SQL Server).

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
conn.Commit();
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

### Batch Insert (Array Binding)

ODP.NET supports array binding for high-performance bulk DML:

```csharp
int batchSize = 3;
using var cmd = new OracleCommand(
    "INSERT INTO employees (employee_id, last_name, department_id) VALUES (:id, :name, :dept)",
    conn);

cmd.ArrayBindCount = batchSize;

cmd.Parameters.Add("id",   OracleDbType.Int32,   new int[]    { 201, 202, 203 }, ParameterDirection.Input);
cmd.Parameters.Add("name", OracleDbType.Varchar2, new string[] { "Alice", "Bob", "Carol" }, ParameterDirection.Input);
cmd.Parameters.Add("dept", OracleDbType.Int32,   new int[]    { 10, 20, 10 }, ParameterDirection.Input);

cmd.ExecuteNonQuery();
conn.Commit();
```

---

## Connection Pooling

ODP.NET has built-in connection pooling enabled by default. Configure via the connection string:

```csharp
string connStr = "User Id=hr;Password=password;Data Source=localhost:1521/freepdb1;" +
    "Min Pool Size=2;Max Pool Size=20;Connection Lifetime=300;Pooling=true;";
```

### With `appsettings.json` (ASP.NET Core)

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
conn.Commit();
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

### REF CURSOR

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

## LOB Handling

```csharp
// Read CLOB
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

// Write BLOB from file
byte[] photoBytes = File.ReadAllBytes("photo.jpg");
using var cmd2 = new OracleCommand(
    "UPDATE employee_photos SET photo = :photo WHERE employee_id = :id", conn);
cmd2.Parameters.Add("photo", OracleDbType.Blob).Value = photoBytes;
cmd2.Parameters.Add("id", 100);
cmd2.ExecuteNonQuery();
conn.Commit();
```

---

## Best Practices

- **Always use named bind parameters** with `:name` syntax — never string concatenation.
- **Rely on the built-in connection pool** — set `Min Pool Size` and `Max Pool Size` in the connection string.
- **Use array binding** for bulk inserts (`ArrayBindCount`) — far faster than looping.
- **Dispose connections and commands** with `using` to return connections to the pool promptly.
- **Use `OracleDbType` explicitly** to avoid implicit type mapping surprises.
- **Set `BindByName = true`** when parameter order in the command does not match the SQL: `cmd.BindByName = true;`

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using `@param` instead of `:param` | Parameter not bound; ORA-01008 | ODP.NET uses `:name` syntax |
| Not setting `BindByName = true` | Parameters bound by position, not name | `cmd.BindByName = true` |
| String concat in SQL | SQL injection | Use OracleParameter |
| Not disposing OracleConnection | Pool exhaustion | Use `using` statement |
| Expecting EF Core migrations to work like SQL Server | Oracle schema differences | Use Oracle-specific migration configs |

---

## Oracle Version Notes (19c vs 26ai)

- `Oracle.ManagedDataAccess.Core` 23.x supports Oracle Database 11.2 through 26ai.
- `Oracle.EntityFrameworkCore` 8.x targets EF Core 8 / .NET 8.
- Oracle 23ai `VECTOR` type support is available in ODP.NET 23.4+.

## Sources

- [ODP.NET Managed Driver Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/19/odpnt/)
- [Oracle.ManagedDataAccess.Core on NuGet](https://www.nuget.org/packages/Oracle.ManagedDataAccess.Core)
- [Oracle EF Core Provider](https://www.nuget.org/packages/Oracle.EntityFrameworkCore)
- [Oracle .NET Developer Center](https://www.oracle.com/database/technologies/appdev/dotnet.html)
