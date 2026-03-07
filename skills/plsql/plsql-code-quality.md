# PL/SQL Code Quality

## Overview

Consistent, readable, and maintainable PL/SQL requires agreed naming conventions, avoidance of well-documented anti-patterns, and automated static analysis. This guide covers style standards, anti-pattern detection, code review practices, and tooling.

---

## Naming Conventions

Consistent naming is the foundation of readable code. The most widely adopted conventions derive from Oracle's own internal standards and the Trivadis PL/SQL Coding Guidelines.

### Variable Prefixes

| Prefix | Scope/Kind | Example |
|---|---|---|
| `l_` | Local variable | `l_employee_id`, `l_salary` |
| `g_` | Package global (package-level) variable | `g_debug_enabled`, `g_config_loaded` |
| `p_` | Parameter (IN, OUT, IN OUT) | `p_customer_id`, `p_result` |
| `c_` | Local constant | `c_max_retries`, `c_default_currency` |
| `gc_` | Package global constant | `gc_app_name`, `gc_max_batch_size` |
| `e_` | Exception variable | `e_order_not_found` |
| `r_` | Record variable | `r_employee`, `r_order` |
| `t_` | Type definition | `t_id_list`, `t_order_tab` |
| `cur_` or `c_` | Cursor | `cur_employees`, `c_pending_orders` |

### Object Naming Conventions

| Object Type | Convention | Example |
|---|---|---|
| Table | Plural noun, snake_case | `employees`, `order_items` |
| Package | Domain + `_pkg` | `order_mgmt_pkg`, `customer_api_pkg` |
| Procedure | Verb + noun | `create_order`, `validate_customer` |
| Function | Returns value; `get_` or `is_`/`has_` | `get_tax_rate`, `is_valid_email` |
| Trigger | Table + `_trg` or `_trigger` | `employees_audit_trg` |
| Sequence | Table + `_seq` | `orders_seq`, `employees_seq` |
| Index | `idx_` + table + column(s) | `idx_orders_customer_id` |
| Exception | `e_` + description | `e_invalid_order_status` |
| Type | `t_` + description | `t_employee_list`, `t_id_tab` |

### Full Example with Conventions

```sql
CREATE OR REPLACE PACKAGE order_mgmt_pkg AS
  -- Package constants (gc_ prefix)
  gc_max_order_items CONSTANT PLS_INTEGER := 500;
  gc_default_currency CONSTANT VARCHAR2(3) := 'USD';

  -- Public type (t_ prefix)
  TYPE t_order_summary IS RECORD (
    order_id       orders.order_id%TYPE,
    customer_name  VARCHAR2(100),
    total_amount   NUMBER
  );

  -- Public exception (e_ prefix)
  e_order_not_found EXCEPTION;

  -- Public procedures/functions
  FUNCTION get_order_summary(
    p_order_id IN orders.order_id%TYPE  -- p_ prefix for parameters
  ) RETURN t_order_summary;

END order_mgmt_pkg;
/

CREATE OR REPLACE PACKAGE BODY order_mgmt_pkg AS

  -- Private global (g_ prefix)
  g_cache_loaded BOOLEAN := FALSE;

  -- Private type
  TYPE t_cache_map IS TABLE OF t_order_summary INDEX BY PLS_INTEGER;
  g_cache t_cache_map;

  FUNCTION get_order_summary(
    p_order_id IN orders.order_id%TYPE
  ) RETURN t_order_summary IS
    -- Local variable (l_ prefix)
    l_summary   t_order_summary;
    -- Local constant (c_ prefix)
    c_not_found CONSTANT VARCHAR2(50) := 'Order not found: ';
  BEGIN
    SELECT o.order_id, c.customer_name, o.total_amount
    INTO   l_summary.order_id, l_summary.customer_name, l_summary.total_amount
    FROM   orders    o
    JOIN   customers c ON c.customer_id = o.customer_id
    WHERE  o.order_id = p_order_id;

    RETURN l_summary;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20001, c_not_found || p_order_id);
  END get_order_summary;

END order_mgmt_pkg;
/
```

---

## Style Guidelines (Oracle / Trivadis / PL/SQL Cop)

The [Trivadis PL/SQL and SQL Coding Guidelines](https://trivadis.github.io/plsql-and-sql-coding-guidelines/) are the most comprehensive publicly available style standard. Key rules:

### Formatting

```sql
-- G-1010: Use meaningful names (not single letters except loop counters)
-- BAD:
FOR i IN 1..l_c LOOP
  IF x > 0 THEN d := p * r; END IF;
END LOOP;

-- GOOD:
FOR idx IN 1..l_count LOOP
  IF l_amount > 0 THEN
    l_discount := l_price * l_rate;
  END IF;
END LOOP;

-- G-2130: Align variable declarations
l_employee_id   employees.employee_id%TYPE;
l_salary        employees.salary%TYPE;
l_department_id employees.department_id%TYPE;

-- G-4130: Indent consistently (2 or 4 spaces; be consistent)
BEGIN
  IF condition THEN
    do_something;
    IF nested_condition THEN
      do_nested_thing;
    END IF;
  END IF;
END;
```

### Keywords and Identifiers

```sql
-- G-1020: Keywords in UPPERCASE, identifiers in lowercase
-- BAD: select employee_id FROM Employees WHERE Department_Id = 10;
-- GOOD:
SELECT employee_id FROM employees WHERE department_id = 10;

-- G-2180: Never use Oracle reserved words as identifiers
-- BAD: DECLARE date DATE; BEGIN ... END;
-- GOOD: DECLARE l_hire_date DATE; BEGIN ... END;

-- G-2230: Use %TYPE for variable declarations anchored to columns
l_salary employees.salary%TYPE;     -- adapts to column type changes
-- vs.
l_salary NUMBER(8,2);               -- will break if column precision changes
```

---

## Anti-Patterns Reference

### WHEN OTHERS THEN NULL

```sql
-- NEVER do this
EXCEPTION
  WHEN OTHERS THEN NULL;

-- Why it's harmful:
-- 1. Silently discards all exceptions
-- 2. Caller has no idea the operation failed
-- 3. Data may be in inconsistent state
-- 4. Impossible to diagnose in production

-- Correct pattern: always log and re-raise
EXCEPTION
  WHEN OTHERS THEN
    error_logger_pkg.log_error('MY_PKG', 'MY_PROC');
    RAISE;
```

### SELECT * in PL/SQL

```sql
-- AVOID: SELECT * in PL/SQL
DECLARE l_emp employees%ROWTYPE;
BEGIN
  SELECT * INTO l_emp FROM employees WHERE employee_id = 100;
  -- Problem: if columns are added, reorder, or removed, this may silently
  -- map wrong values (if %ROWTYPE is cached), or cause runtime errors

-- PREFERRED: explicit column list
DECLARE
  l_emp_id   employees.employee_id%TYPE;
  l_emp_name employees.last_name%TYPE;
BEGIN
  SELECT employee_id, last_name INTO l_emp_id, l_emp_name
  FROM   employees WHERE employee_id = 100;
```

**Exception**: `SELECT * ... INTO l_%ROWTYPE` is acceptable when %ROWTYPE is used and you genuinely need all columns.

### Hardcoded Schema Names

```sql
-- AVOID: hardcoded schema names
SELECT * FROM hr.employees;  -- breaks if deployed to different schema
INSERT INTO finance.accounts VALUES ...;

-- PREFERRED: use synonyms or current schema references
SELECT * FROM employees;     -- resolves via synonym or current schema

-- If cross-schema access is needed, use constants or configurable references
SELECT * FROM config_pkg.schema_prefix || '.employees';
```

### Magic Numbers

```sql
-- AVOID: unexplained numeric literals
IF l_status_code = 3 THEN ...;        -- what is 3?
IF l_retry_count > 5 THEN ...;        -- why 5?
l_rate := l_amount * 0.0825;          -- what rate is this?

-- PREFERRED: named constants
DECLARE
  c_status_shipped   CONSTANT PLS_INTEGER := 3;
  c_max_retries      CONSTANT PLS_INTEGER := 5;
  c_sales_tax_rate   CONSTANT NUMBER      := 0.0825;  -- TX state rate
BEGIN
  IF l_status_code = c_status_shipped THEN ...;
  IF l_retry_count > c_max_retries THEN ...;
  l_rate := l_amount * c_sales_tax_rate;
```

### Autonomous Transaction Abuse

```sql
-- AVOID: using autonomous transactions to bypass constraints
PROCEDURE sneaky_insert(p_data IN VARCHAR2) IS
  PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  -- "Getting around" the parent transaction's state
  INSERT INTO main_table VALUES (p_data);
  COMMIT;  -- committed regardless of parent transaction outcome
END;
-- Problem: parent transaction may ROLLBACK, but this autonomous insert already committed
-- Data is now inconsistent

-- Autonomous transactions are ONLY appropriate for:
-- 1. Error/audit logging (log must survive rollback)
-- 2. Truly independent operations with no data consistency requirement
```

### Implicit Conversion

```sql
-- AVOID: implicit type conversion (unpredictable, NLS-dependent)
WHERE hire_date = '01-JAN-2024'      -- depends on NLS_DATE_FORMAT
WHERE employee_id = '100'            -- implicit VARCHAR2 to NUMBER

-- PREFERRED: explicit conversion
WHERE hire_date = DATE '2024-01-01'  -- ANSI date literal, no NLS dependency
WHERE hire_date = TO_DATE('2024-01-01', 'YYYY-MM-DD')
WHERE employee_id = 100              -- numeric literal, no conversion needed
```

---

## Code Review Checklist

```
CORRECTNESS
[ ] No WHEN OTHERS THEN NULL
[ ] All exceptions are logged with FORMAT_ERROR_BACKTRACE
[ ] SQL%ROWCOUNT captured immediately after DML
[ ] Cursors closed in exception handlers (%ISOPEN check)
[ ] No implicit type conversions in WHERE clauses
[ ] Date literals use DATE 'YYYY-MM-DD' or explicit TO_DATE with format

PERFORMANCE
[ ] No DML inside cursor loops (use FORALL)
[ ] BULK COLLECT uses LIMIT clause
[ ] No SELECT inside a loop (use JOIN or pre-fetch)
[ ] NOCOPY used for large IN OUT collection parameters
[ ] RESULT_CACHE considered for pure functions called repeatedly

SECURITY
[ ] Dynamic SQL uses bind variables (:1, :name), not concatenation
[ ] Table/column names in dynamic SQL validated with DBMS_ASSERT
[ ] Error messages don't expose schema internals to end users
[ ] AUTHID CURRENT_USER considered for utility procedures

MAINTAINABILITY
[ ] Variable names follow prefix conventions (l_, p_, g_, c_)
[ ] No magic numbers — all literals are named constants
[ ] %TYPE used for anchored declarations
[ ] Package spec is minimal — only public members declared
[ ] Procedures are focused (single responsibility)
[ ] No hardcoded schema names

TESTING
[ ] Unit tests exist for new procedures/functions
[ ] Edge cases tested (NULL inputs, empty sets, boundary values)
[ ] Error paths tested (%throws or try/catch patterns)
```

---

## Static Analysis Tools

### PL/SQL Cop (Trivadis)

PL/SQL Cop is a commercial static analysis tool based on Trivadis guidelines. It integrates with Maven, Gradle, and CI/CD pipelines.

```bash
# Command-line usage
tvdcc -url jdbc:oracle:thin:@host:1521/service \
      -user scott -password tiger \
      -path /path/to/plsql/sources \
      -format html \
      -output report.html

# Results show violations by rule category:
# G-2150: Avoid comparisons with NULL — use IS NULL / IS NOT NULL
# G-5030: Never write logic in the spec — keep it in the body
# G-7810: Never use WHEN OTHERS without RAISE or RAISE_APPLICATION_ERROR
```

### SonarQube PL/SQL Plugin

SonarQube with the Oracle PL/SQL plugin (part of SonarQube Developer Edition) provides:
- Rule-based static analysis
- Code complexity metrics
- Duplication detection
- Issue tracking over time
- Integration with pull request reviews

```yaml
# sonar-project.properties for PL/SQL project
sonar.projectKey=my_plsql_project
sonar.sources=src/plsql
sonar.language=plsql
sonar.plsql.jdbc.url=jdbc:oracle:thin:@host:1521/service
sonar.plsql.jdbc.username=sonar_user
sonar.plsql.jdbc.password=sonar_password
```

### SQL Developer Code Analysis

SQL Developer includes a built-in code analysis tool:
1. **Tools > Code Analysis > Run Analysis**
2. Select rules (PL/SQL Best Practices, Security, etc.)
3. Results appear in the Code Analysis panel with line numbers

---

## McCabe Cyclomatic Complexity

Cyclomatic complexity measures the number of linearly independent paths through code. High complexity = harder to test and maintain.

**Formula**: Complexity = Number of decision points + 1

Decision points: `IF`, `ELSIF`, `CASE WHEN`, `LOOP`, `WHILE`, `FOR`, `EXCEPTION WHEN`, `AND`, `OR` in conditions.

| Complexity | Rating | Action |
|---|---|---|
| 1–5 | Low | Good — simple to understand and test |
| 6–10 | Moderate | Acceptable — review carefully |
| 11–15 | High | Consider refactoring |
| 16–25 | Very High | Strong refactoring recommendation |
| > 25 | Extreme | Must refactor before code review approval |

```sql
-- High complexity example (refactor this)
PROCEDURE process_order(p_id IN NUMBER, p_type IN VARCHAR2) IS
BEGIN
  IF p_type = 'EXPRESS' THEN
    IF p_id > 0 THEN
      IF check_stock THEN
        FOR item IN c_items LOOP
          IF item.available THEN
            IF item.quantity > 10 THEN
              apply_bulk_discount;
            ELSE
              apply_standard_price;
            END IF;
          END IF;
        END LOOP;
      END IF;
    END IF;
  ELSIF p_type = 'STANDARD' THEN
    -- ... more nesting ...
  END IF;
END process_order;
-- Complexity > 10 — extract inner logic into focused helper procedures

-- Refactored: lower complexity per procedure
PROCEDURE process_express_order(p_id IN NUMBER) IS
BEGIN
  IF check_stock THEN
    apply_item_pricing;  -- extracted procedure handles item loop
  END IF;
END process_express_order;
```

---

## Maximum Procedure Length Guidelines

| Recommendation | Guideline |
|---|---|
| Maximum procedure body | 60–80 lines (excluding declarations) |
| Maximum package body | 1000–1500 lines before splitting |
| Maximum nesting depth | 3–4 levels of IF/LOOP nesting |
| Maximum parameters | 7–10 parameters; use record type for more |

When a procedure exceeds these limits, extract clearly-named helper procedures. The original procedure becomes a coordinator.

---

## Automated Quality Gate Example (CI/CD)

```bash
#!/bin/bash
# quality_gate.sh: fail the build if quality thresholds are not met

# Run SonarQube analysis
sonar-scanner \
  -Dsonar.host.url=https://sonar.mycompany.com \
  -Dsonar.token=$SONAR_TOKEN

# Check quality gate status (wait for analysis to complete)
STATUS=$(curl -s -u "$SONAR_TOKEN:" \
  "https://sonar.mycompany.com/api/qualitygates/project_status?projectKey=my_plsql_project" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['projectStatus']['status'])")

if [ "$STATUS" != "OK" ]; then
  echo "Quality gate failed: $STATUS"
  exit 1
fi
```

---

## Version Notes

- **All versions**: Naming conventions and anti-patterns apply regardless of Oracle version.
- **Oracle 12.2+**: `ACCESSIBLE BY` clause enforces API access restrictions, supporting encapsulation guidelines.
- **Trivadis Guidelines**: Updated regularly; current version covers Oracle through 21c. Available at https://trivadis.github.io/plsql-and-sql-coding-guidelines/
- **PL/SQL Cop**: Version 6.x supports Oracle 12c through 21c patterns.
- **SonarQube PL/SQL**: Available in Developer Edition and above; rules updated with each SonarQube release.

---

## Sources

- [Trivadis PL/SQL and SQL Coding Guidelines](https://trivadis.github.io/plsql-and-sql-coding-guidelines/) — naming conventions, anti-patterns, complexity metrics
- [Oracle Database PL/SQL Language Reference 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/) — language features referenced in quality guidelines
- [Oracle Database Reference 19c — USER_ERRORS](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/USER_ERRORS.html) — compile error detection
