# Dapper + Oracle Database

## Overview

Dapper is a lightweight .NET micro-ORM that extends `IDbConnection` with convenient query and execute methods. It works directly with ODP.NET's `OracleConnection`, giving you raw SQL control with automatic result mapping.

```bash
dotnet add package Dapper
dotnet add package Oracle.ManagedDataAccess.Core
```

---

## Connecting

```csharp
using Oracle.ManagedDataAccess.Client;
using Dapper;

string connStr = "User Id=hr;Password=password;Data Source=localhost:1521/freepdb1;";

// Create and open connection
using var conn = new OracleConnection(connStr);
conn.Open();

// Or use a factory / DI
// builder.Services.AddScoped<IDbConnection>(_ =>
//     new OracleConnection(connStr));
```

---

## Querying

### `Query<T>` — Map Rows to Objects

```csharp
public class Employee
{
    public long    EmployeeId   { get; set; }
    public string  LastName     { get; set; }
    public decimal Salary       { get; set; }
    public long    DepartmentId { get; set; }
}

using var conn = new OracleConnection(connStr);

// Named bind parameters (: prefix for Oracle)
var employees = conn.Query<Employee>(
    @"SELECT employee_id   AS EmployeeId,
             last_name     AS LastName,
             salary        AS Salary,
             department_id AS DepartmentId
      FROM   employees
      WHERE  department_id = :deptId
        AND  salary        > :minSal
      ORDER BY last_name",
    new { deptId = 60, minSal = 5000m }
).ToList();
```

### `QuerySingle` / `QueryFirst`

```csharp
var emp = conn.QuerySingleOrDefault<Employee>(
    "SELECT employee_id AS EmployeeId, last_name AS LastName, salary AS Salary " +
    "FROM employees WHERE employee_id = :id",
    new { id = 100 }
);

if (emp is null) Console.WriteLine("Not found");
else Console.WriteLine($"{emp.LastName}: {emp.Salary}");
```

### Scalar Values

```csharp
var count = conn.ExecuteScalar<int>(
    "SELECT COUNT(*) FROM employees WHERE department_id = :dept",
    new { dept = 60 }
);

var maxSal = conn.ExecuteScalar<decimal>(
    "SELECT MAX(salary) FROM employees WHERE department_id = :dept",
    new { dept = 60 }
);
```

### Dynamic Results (no class needed)

```csharp
var rows = conn.Query(
    "SELECT last_name, salary FROM employees WHERE department_id = :dept",
    new { dept = 60 }
);

foreach (var row in rows)
{
    Console.WriteLine($"{row.LAST_NAME}: {row.SALARY}");
}
```

---

## DML

### `Execute` — INSERT / UPDATE / DELETE

```csharp
// UPDATE
int rowsAffected = conn.Execute(
    "UPDATE employees SET salary = :sal WHERE employee_id = :id",
    new { sal = 9500m, id = 100 }
);

// INSERT
conn.Execute(
    @"INSERT INTO employees (employee_id, last_name, email, salary, department_id)
      VALUES (employees_seq.NEXTVAL, :lastName, :email, :salary, :deptId)",
    new { lastName = "Smith", email = "smith@co.com", salary = 7500m, deptId = 60 }
);
```

### Batch Insert

```csharp
var newEmployees = new[]
{
    new { lastName = "Alice", email = "alice@co.com", salary = 6000m, deptId = 10 },
    new { lastName = "Bob",   email = "bob@co.com",   salary = 7000m, deptId = 20 },
};

conn.Execute(
    @"INSERT INTO employees (employee_id, last_name, email, salary, department_id)
      VALUES (employees_seq.NEXTVAL, :lastName, :email, :salary, :deptId)",
    newEmployees   // Dapper calls Execute once per row
);
```

---

## Transactions

```csharp
using var conn = new OracleConnection(connStr);
conn.Open();
using var txn = conn.BeginTransaction();

try
{
    conn.Execute(
        "UPDATE accounts SET balance = balance - :amt WHERE id = :from",
        new { amt = 500m, from = 1 },
        transaction: txn
    );
    conn.Execute(
        "UPDATE accounts SET balance = balance + :amt WHERE id = :to",
        new { amt = 500m, to = 2 },
        transaction: txn
    );
    txn.Commit();
}
catch
{
    txn.Rollback();
    throw;
}
```

---

## PL/SQL Calls

### Stored Procedure via `Execute`

```csharp
conn.Execute(
    "BEGIN hr.update_salary(:id, :sal); END;",
    new { id = 100, sal = 9500m }
);
```

### OUT Parameters with `DynamicParameters`

```csharp
using Oracle.ManagedDataAccess.Client;

var p = new DynamicParameters();
p.Add("p_dept_id", 60,    direction: ParameterDirection.Input);
p.Add("p_count",   dbType: DbType.Int32, direction: ParameterDirection.Output);
p.Add("p_avg_sal", dbType: DbType.Decimal, direction: ParameterDirection.Output);

conn.Execute("BEGIN hr.get_dept_stats(:p_dept_id, :p_count, :p_avg_sal); END;", p);

int     count  = p.Get<int>("p_count");
decimal avgSal = p.Get<decimal>("p_avg_sal");
Console.WriteLine($"Count: {count}, Avg Salary: {avgSal}");
```

### Function Return Value

```csharp
var p = new DynamicParameters();
p.Add("result",    dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);
p.Add("p_dept_id", 60, direction: ParameterDirection.Input);

conn.Execute("BEGIN :result := hr.get_employee_count(:p_dept_id); END;", p);
int count = p.Get<int>("result");
```

---

## Multi-Mapping (Joins)

```csharp
public class Department
{
    public long   DepartmentId   { get; set; }
    public string DepartmentName { get; set; }
}

var sql = @"
    SELECT e.employee_id   AS EmployeeId,
           e.last_name     AS LastName,
           e.salary        AS Salary,
           d.department_id AS DepartmentId,
           d.department_name AS DepartmentName
    FROM   employees e
    JOIN   departments d ON e.department_id = d.department_id
    WHERE  e.department_id = :dept";

var employees = conn.Query<Employee, Department, Employee>(
    sql,
    (emp, dept) => { emp.Department = dept; return emp; },
    new { dept = 60 },
    splitOn: "DepartmentId"
).ToList();
```

---

## Async Support

```csharp
using var conn = new OracleConnection(connStr);

var employees = await conn.QueryAsync<Employee>(
    "SELECT employee_id AS EmployeeId, last_name AS LastName, salary AS Salary " +
    "FROM employees WHERE department_id = :dept",
    new { dept = 60 }
);

await conn.ExecuteAsync(
    "UPDATE employees SET salary = :sal WHERE employee_id = :id",
    new { sal = 9500m, id = 100 }
);
```

---

## Column Name Mapping

Oracle returns column names in UPPERCASE. Dapper maps by column alias to property name (case-insensitive). Always alias Oracle columns to match C# property names:

```csharp
// Without alias — may not map correctly
"SELECT EMPLOYEE_ID, LAST_NAME FROM employees"

// With alias — maps reliably
"SELECT employee_id AS EmployeeId, last_name AS LastName FROM employees"
```

Alternatively, use `Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;` or a custom type map.

---

## Dependency Injection (ASP.NET Core)

```csharp
// Program.cs
builder.Services.AddScoped<IDbConnection>(_ =>
    new OracleConnection(builder.Configuration.GetConnectionString("OracleDb")));

// appsettings.json
{
  "ConnectionStrings": {
    "OracleDb": "User Id=hr;Password=password;Data Source=localhost:1521/freepdb1;"
  }
}

// EmployeeRepository.cs
public class EmployeeRepository
{
    private readonly IDbConnection _conn;

    public EmployeeRepository(IDbConnection conn) => _conn = conn;

    public Task<IEnumerable<Employee>> GetByDeptAsync(int deptId) =>
        _conn.QueryAsync<Employee>(
            "SELECT employee_id AS EmployeeId, last_name AS LastName " +
            "FROM employees WHERE department_id = :dept",
            new { dept = deptId });
}
```

---

## Best Practices

- **Always alias columns** to match C# property names — avoids silent mapping failures.
- **Use `DynamicParameters`** for OUT parameters and PL/SQL procedure calls.
- **Use async overloads** (`QueryAsync`, `ExecuteAsync`) in ASP.NET Core.
- **Reuse `OracleConnection`** — Dapper does not pool connections itself; rely on ODP.NET's built-in pool.
- **Pass `transaction:`** to every Dapper call when inside a transaction.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| No column aliases | Oracle UPPERCASE names don't map to camelCase C# properties | Always alias: `employee_id AS EmployeeId` |
| Forgetting `transaction:` param | Operations run outside the transaction | Pass `transaction: txn` to every call |
| `@param` instead of `:param` | ODP.NET uses `:` prefix | Use `:paramName` syntax |
| `QuerySingle` on 0 rows | Throws `InvalidOperationException` | Use `QuerySingleOrDefault` |
| Not opening connection | `InvalidOperationException: Connection is not open` | Call `conn.Open()` or `await conn.OpenAsync()` |

---

## Oracle Version Notes (19c vs 26ai)

- All patterns work on Oracle 19c+.
- Oracle 26ai native `BOOLEAN` maps to C# `bool` via standard ODP.NET binding.

## Sources

- [Dapper GitHub](https://github.com/DapperLib/Dapper)
- [Dapper Documentation](https://www.learndapper.com/)
- [ODP.NET Managed Driver](https://docs.oracle.com/en/database/oracle/oracle-database/19/odpnt/)
