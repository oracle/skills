# GORM + Oracle Database

## Overview

GORM is the most popular Go ORM. Oracle support is community-maintained rather than first-party. A current community dialect is `github.com/godoes/gorm-oracle`. Its own README notes that it is not recommended for production use, so teams that need production-grade Oracle support often use `godror` with `database/sql` directly instead of a GORM dialect.

```bash
go get gorm.io/gorm
go get github.com/godoes/gorm-oracle
```

Community GORM Oracle dialects vary in implementation details and support level. Validate behavior against your exact version before relying on features like schema migration or auto-generated keys in production.

---

## Connecting

```go
package main

import (
    "time"

    oracle "github.com/godoes/gorm-oracle"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

func main() {
    options := map[string]string{
        "CONNECTION TIMEOUT": "30",
    }

    dsn := oracle.BuildUrl("localhost", "1521", "freepdb1", "hr", "password", options)

    // Alternative TNS alias or descriptor forms can be supplied directly in Config.DSN
    // dsn := `user="hr" password="password" connectString="mydb_high"`

    dialector := oracle.New(oracle.Config{DSN: dsn})
    db, err := gorm.Open(dialector, &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),  // SQL logging
    })
    if err != nil {
        panic("failed to connect: " + err.Error())
    }

    // Configure pool
    sqlDB, _ := db.DB()
    sqlDB.SetMaxOpenConns(20)
    sqlDB.SetMaxIdleConns(5)
    sqlDB.SetConnMaxLifetime(30 * time.Minute)
}
```

---

## Models

```go
import "gorm.io/gorm"

// GORM uses struct tags to map to Oracle columns
type Department struct {
    DepartmentID   uint   `gorm:"column:DEPARTMENT_ID;primaryKey"`
    DepartmentName string `gorm:"column:DEPARTMENT_NAME;not null;size:30"`
    Employees      []Employee `gorm:"foreignKey:DepartmentID"`
}

func (Department) TableName() string { return "HR.DEPARTMENTS" }

type Employee struct {
    EmployeeID   uint           `gorm:"column:EMPLOYEE_ID;primaryKey;autoIncrement:false"`
    LastName     string         `gorm:"column:LAST_NAME;not null;size:25"`
    Email        string         `gorm:"column:EMAIL;not null;size:25;uniqueIndex"`
    Salary       float64        `gorm:"column:SALARY"`
    HireDate     time.Time      `gorm:"column:HIRE_DATE"`
    DepartmentID uint           `gorm:"column:DEPARTMENT_ID"`
    Department   Department     `gorm:"foreignKey:DepartmentID"`
    DeletedAt    gorm.DeletedAt `gorm:"column:DELETED_AT;index"` // soft delete
}

func (Employee) TableName() string { return "HR.EMPLOYEES" }
```

### Oracle Sequence for Primary Key

GORM's `autoIncrement` doesn't map to Oracle sequences. Use a `BeforeCreate` hook:

```go
func (e *Employee) BeforeCreate(tx *gorm.DB) error {
    var id int64
    tx.Raw("SELECT employees_seq.NEXTVAL FROM DUAL").Scan(&id)
    e.EmployeeID = uint(id)
    return nil
}
```

### LOB Fields

```go
type EmployeeDoc struct {
    DocID  uint   `gorm:"column:DOC_ID;primaryKey"`
    Resume string `gorm:"column:RESUME;type:CLOB"`
    Photo  []byte `gorm:"column:PHOTO;type:BLOB"`
}
```

---

## CRUD Operations

### Create

```go
emp := Employee{
    LastName:     "Smith",
    Email:        "smith@co.com",
    Salary:       7500,
    DepartmentID: 60,
}
result := db.Create(&emp)
if result.Error != nil {
    log.Fatal(result.Error)
}
fmt.Println("Inserted:", emp.EmployeeID)
```

### Read

```go
// Find by PK
var emp Employee
db.First(&emp, 100)

// Find all with conditions
var employees []Employee
db.Where("salary > ? AND department_id = ?", 5000, 60).
   Order("last_name ASC").
   Find(&employees)

// Preload association
db.Preload("Department").Find(&employees)

// Specific columns
db.Select("EMPLOYEE_ID", "LAST_NAME", "SALARY").
   Where("department_id = ?", 60).
   Find(&employees)
```

### Update

```go
// Update single field
db.Model(&Employee{}).Where("employee_id = ?", 100).Update("SALARY", 9500)

// Update multiple fields
db.Model(&emp).Updates(Employee{Salary: 9500, DepartmentID: 10})

// Update with map (avoids zero-value issue)
db.Model(&Employee{EmployeeID: 100}).Updates(map[string]interface{}{
    "SALARY":        9500,
    "DEPARTMENT_ID": 10,
})
```

### Delete

```go
// Delete by PK (soft delete if DeletedAt field exists)
db.Delete(&Employee{}, 100)

// Hard delete (bypasses soft delete)
db.Unscoped().Delete(&Employee{}, 100)

// Bulk delete
db.Where("department_id = ?", 999).Delete(&Employee{})
```

---

## Raw SQL

```go
// Raw SELECT
var employees []Employee
db.Raw(
    "SELECT employee_id, last_name, salary FROM employees WHERE department_id = :dept AND salary > :minSal",
    map[string]interface{}{"dept": 60, "minSal": 5000},
).Scan(&employees)

// Exec (DML)
db.Exec("UPDATE employees SET salary = :sal WHERE employee_id = :id",
    map[string]interface{}{"sal": 9500, "id": 100})

// PL/SQL
db.Exec("BEGIN hr.update_salary(:id, :sal); END;",
    map[string]interface{}{"id": 100, "sal": 9500})
```

---

## Transactions

```go
// Manual transaction
tx := db.Begin()
defer func() {
    if r := recover(); r != nil {
        tx.Rollback()
    }
}()

if err := tx.Error; err != nil {
    log.Fatal(err)
}

if err := tx.Model(&Employee{}).Where("employee_id = ?", 100).
    Update("SALARY", 9500).Error; err != nil {
    tx.Rollback()
    log.Fatal(err)
}

tx.Commit()

// Closure transaction (recommended)
err := db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Model(&Employee{}).Where("employee_id = ?", 100).
        Update("SALARY", 9500).Error; err != nil {
        return err // auto-rollback
    }
    if err := tx.Create(&Employee{LastName: "New", Email: "new@co.com"}).Error; err != nil {
        return err
    }
    return nil // auto-commit
})
```

---

## Pagination

```go
type PaginatedResult struct {
    Employees []Employee
    Total     int64
    Page      int
    PageSize  int
}

func GetEmployees(db *gorm.DB, page, pageSize int) PaginatedResult {
    var employees []Employee
    var total int64

    db.Model(&Employee{}).Count(&total)
    db.Offset((page - 1) * pageSize).Limit(pageSize).
       Order("last_name ASC").Find(&employees)

    return PaginatedResult{
        Employees: employees,
        Total:     total,
        Page:      page,
        PageSize:  pageSize,
    }
}
```

---

## Scopes (Reusable Query Conditions)

```go
func HighEarners(minSal float64) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("salary > ?", minSal)
    }
}

func InDepartment(deptID uint) func(*gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("department_id = ?", deptID)
    }
}

// Usage
var employees []Employee
db.Scopes(HighEarners(5000), InDepartment(60)).Find(&employees)
```

---

## Auto Migrate

```go
// Creates or updates tables to match struct definitions
// Use with caution — does not drop columns or rename
db.AutoMigrate(&Employee{}, &Department{})

// Better: use SQL migration files for production
```

---

## Best Practices

- **Use `BeforeCreate` hooks** for Oracle sequence-based PKs — do not rely on `autoIncrement`.
- **Use `db.Transaction(func(tx) error {...})`** over manual `Begin/Commit/Rollback`.
- **Use `map[string]interface{}`** in `Updates` to avoid GORM skipping zero-value fields.
- **Set `TableName()`** on every model to use explicit Oracle schema-qualified names.
- **Use `Preload`** for associations rather than `Joins` for cleaner N+1 avoidance.
- **Never use `AutoMigrate` in production** — manage schema changes with explicit DDL scripts.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Relying on `autoIncrement` | Dialect support varies; generated DDL may not match Oracle expectations | Use `BeforeCreate` + `NEXTVAL` unless you have verified identity-column behavior in your exact dialect version |
| `Updates(struct{})` with zero values | GORM skips zero-value fields | Use `Updates(map[string]interface{}{...})` |
| Missing `TableName()` | GORM generates wrong table name | Always implement `TableName()` |
| `First` on empty result | Returns `gorm.ErrRecordNotFound` panic | Check `result.Error == gorm.ErrRecordNotFound` |
| `AutoMigrate` in production | Alters schema unexpectedly | Use controlled DDL migrations |
| Missing Instant Client in PATH | godror panics at startup | Set `LD_LIBRARY_PATH` / `DYLD_LIBRARY_PATH` |

---

## Oracle Version Notes (19c vs 26ai)

- All patterns work on Oracle 19c+.
- Oracle 26ai adds native `BOOLEAN` and modern `IDENTITY` support in the database, but GORM Oracle dialect behavior depends on the specific community driver version you choose.

## Sources

- [GORM Documentation](https://gorm.io/docs/)
- [GORM Oracle Driver (godoes/gorm-oracle)](https://github.com/godoes/gorm-oracle)
- [godror GitHub](https://github.com/godror/godror)
- [Oracle Instant Client](https://www.oracle.com/database/technologies/instant-client.html)
