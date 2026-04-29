# Go + Oracle Database

## Overview

`godror` is the recommended Go driver for Oracle Database. It implements the standard `database/sql` interface and uses Oracle's ODPI-C library under the hood (requires Oracle Instant Client).

```bash
go get github.com/godror/godror
```

**Oracle Instant Client** must be installed and on the library path (`LD_LIBRARY_PATH` on Linux, `DYLD_LIBRARY_PATH` on macOS, `PATH` on Windows).

```bash
# macOS example
export DYLD_LIBRARY_PATH=/opt/oracle/instantclient_21_9:$DYLD_LIBRARY_PATH

# Linux
export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_9:$LD_LIBRARY_PATH
```

---

## Connecting

### Basic Connection

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "log"

    _ "github.com/godror/godror"
)

func main() {
    // Easy Connect DSN
    dsn := `user="hr" password="password" connectString="localhost:1521/freepdb1"`

    db, err := sql.Open("godror", dsn)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // Verify connectivity
    if err := db.PingContext(context.Background()); err != nil {
        log.Fatal(err)
    }

    var now string
    if err := db.QueryRowContext(context.Background(),
        "SELECT TO_CHAR(SYSDATE) FROM DUAL").Scan(&now); err != nil {
        log.Fatal(err)
    }
    fmt.Println("Oracle time:", now)
}
```

### TNS Alias

```go
dsn := `user="hr" password="password" connectString="mydb_high" libDir="/opt/oracle/instantclient_21_9"`
```

### Wallet / mTLS (Autonomous Database)

```go
dsn := `user="admin" password="password" connectString="myatp_high" ` +
    `walletLocation="/path/to/wallet" ` +
    `libDir="/opt/oracle/instantclient_21_9"`
```

### Pool Configuration

`database/sql` manages the connection pool. Configure it at startup:

```go
db, err := sql.Open("godror", dsn)
if err != nil {
    log.Fatal(err)
}
db.SetMaxOpenConns(20)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

---

## Executing SQL

### Bind Variables

`godror` supports named binds with `:name` syntax. Always use bind variables — never format user data into SQL strings.

```go
ctx := context.Background()

// Named bind
row := db.QueryRowContext(ctx,
    "SELECT last_name, salary FROM employees WHERE employee_id = :id",
    sql.Named("id", 100))

var lastName string
var salary float64
if err := row.Scan(&lastName, &salary); err != nil {
    log.Fatal(err)
}
fmt.Printf("%s: %.2f\n", lastName, salary)
```

### Query Multiple Rows

```go
rows, err := db.QueryContext(ctx,
    `SELECT employee_id, last_name, salary
     FROM   employees
     WHERE  department_id = :dept AND salary > :minSal`,
    sql.Named("dept", 60),
    sql.Named("minSal", 5000.0))
if err != nil {
    log.Fatal(err)
}
defer rows.Close()

for rows.Next() {
    var id int
    var name string
    var sal float64
    if err := rows.Scan(&id, &name, &sal); err != nil {
        log.Fatal(err)
    }
    fmt.Printf("%d %s %.2f\n", id, name, sal)
}
if err := rows.Err(); err != nil {
    log.Fatal(err)
}
```

### DML

```go
result, err := db.ExecContext(ctx,
    "UPDATE employees SET salary = :sal WHERE employee_id = :id",
    sql.Named("sal", 9500.0),
    sql.Named("id", 100))
if err != nil {
    log.Fatal(err)
}
rowsAffected, _ := result.RowsAffected()
fmt.Printf("Rows updated: %d\n", rowsAffected)
```

### Transactions

```go
txn, err := db.BeginTx(ctx, nil)
if err != nil {
    log.Fatal(err)
}
defer func() {
    if p := recover(); p != nil {
        txn.Rollback()
        panic(p)
    }
}()

_, err = txn.ExecContext(ctx,
    "UPDATE accounts SET balance = balance - :amt WHERE id = :from",
    sql.Named("amt", 500), sql.Named("from", 1))
if err != nil {
    txn.Rollback()
    log.Fatal(err)
}

_, err = txn.ExecContext(ctx,
    "UPDATE accounts SET balance = balance + :amt WHERE id = :to",
    sql.Named("amt", 500), sql.Named("to", 2))
if err != nil {
    txn.Rollback()
    log.Fatal(err)
}

if err := txn.Commit(); err != nil {
    log.Fatal(err)
}
```

---

## PL/SQL Calls

### Anonymous Block with OUT Parameters

```go
import "github.com/godror/godror"

var outVal string

_, err := db.ExecContext(ctx, `
    BEGIN
        :out := 'Hello from PL/SQL ' || TO_CHAR(SYSDATE);
    END;`,
    sql.Named("out", sql.Out{Dest: &outVal}))
if err != nil {
    log.Fatal(err)
}
fmt.Println(outVal)
```

### Stored Procedure

```go
var lastName string
var salary   float64

_, err := db.ExecContext(ctx, `
    BEGIN
        hr.get_employee(:id, :name, :sal);
    END;`,
    sql.Named("id",   100),
    sql.Named("name", sql.Out{Dest: &lastName, In: false}),
    sql.Named("sal",  sql.Out{Dest: &salary,   In: false}))
if err != nil {
    log.Fatal(err)
}
fmt.Printf("%s: %.2f\n", lastName, salary)
```

### REF CURSOR

```go
var rc driver.Rows  // godror returns REF CURSOR as driver.Rows

_, err := db.ExecContext(ctx, `
    BEGIN
        OPEN :rc FOR SELECT employee_id, last_name FROM employees WHERE department_id = :dept;
    END;`,
    sql.Named("rc",   sql.Out{Dest: &rc}),
    sql.Named("dept", 60))
if err != nil {
    log.Fatal(err)
}

// Wrap in sql.Rows
rows := godror.WrapRows(ctx, db, rc)
defer rows.Close()

for rows.Next() {
    var id int
    var name string
    rows.Scan(&id, &name)
    fmt.Println(id, name)
}
```

---

## Bulk Insert

```go
// Use a transaction and loop for batch inserts
type Employee struct {
    ID   int
    Name string
    Dept int
}

employees := []Employee{
    {201, "Alice", 10},
    {202, "Bob",   20},
    {203, "Carol", 10},
}

txn, _ := db.BeginTx(ctx, nil)
stmt, err := txn.PrepareContext(ctx,
    "INSERT INTO employees (employee_id, last_name, department_id) VALUES (:id, :name, :dept)")
if err != nil {
    txn.Rollback()
    log.Fatal(err)
}
defer stmt.Close()

for _, e := range employees {
    if _, err := stmt.ExecContext(ctx,
        sql.Named("id",   e.ID),
        sql.Named("name", e.Name),
        sql.Named("dept", e.Dept)); err != nil {
        txn.Rollback()
        log.Fatal(err)
    }
}
txn.Commit()
```

---

## LOB Handling

```go
import "github.com/godror/godror"

// Read CLOB
var clob godror.Lob
err = db.QueryRowContext(ctx,
    "SELECT resume FROM employee_docs WHERE employee_id = :id",
    sql.Named("id", 100)).Scan(&clob)
if err != nil {
    log.Fatal(err)
}
content, _ := io.ReadAll(clob)
fmt.Println(string(content[:200]))

// Write CLOB
text := "Large document content..."
_, err = db.ExecContext(ctx,
    "UPDATE employee_docs SET resume = :resume WHERE employee_id = :id",
    sql.Named("resume", godror.Lob{Reader: strings.NewReader(text), IsClob: true}),
    sql.Named("id", 100))
```

---

## Error Handling

```go
import "github.com/godror/godror"

_, err := db.ExecContext(ctx, "INSERT INTO employees (employee_id) VALUES (:id)",
    sql.Named("id", 100))  // duplicate
if err != nil {
    var oraErr *godror.OraErr
    if errors.As(err, &oraErr) {
        fmt.Printf("ORA-%05d: %s\n", oraErr.Code(), oraErr.Message())
        // ORA-00001: unique constraint violated
    } else {
        log.Fatal(err)
    }
}
```

---

## Best Practices

- **Always use named binds** (`sql.Named`) — avoids positional ordering errors.
- **Configure pool sizes** at startup with `SetMaxOpenConns` and `SetMaxIdleConns`.
- **Always call `rows.Close()`** in a `defer` immediately after opening rows.
- **Check `rows.Err()`** after the loop — errors during iteration are stored there.
- **Use transactions** for multi-statement DML; `database/sql` does not auto-commit.
- **Reuse prepared statements** with `db.PrepareContext` for repeated queries in tight loops.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| String formatting user input into SQL | SQL injection | Use `sql.Named` binds |
| Not calling `rows.Close()` | Cursor leak; connection held | `defer rows.Close()` immediately |
| Not checking `rows.Err()` | Silent data truncation | Always check after loop |
| Forgetting `LD_LIBRARY_PATH` / `DYLD_LIBRARY_PATH` | Runtime panic loading ODPI-C | Set library path before starting app |
| Using positional `?` binds | Not supported by godror | Use `:name` with `sql.Named` |
| `db.SetMaxOpenConns(0)` (unlimited) | Connection exhaustion under load | Set a reasonable limit (e.g. 20) |

---

## Oracle Version Notes (19c vs 26ai)

- `godror` supports Oracle Database 11.2 and later via ODPI-C.
- Oracle 23ai `VECTOR` type requires godror 0.44+ and Oracle Instant Client 23.

## Sources

- [godror GitHub](https://github.com/godror/godror)
- [godror Documentation](https://pkg.go.dev/github.com/godror/godror)
- [Oracle Instant Client Downloads](https://www.oracle.com/database/technologies/instant-client.html)
- [database/sql Go Standard Library](https://pkg.go.dev/database/sql)
