# PL/SQL Design Patterns

## Overview

Proven design patterns in PL/SQL enable maintainable, performant, and testable code. This guide covers the most widely-used patterns: table APIs, autonomous transactions, pipelined functions, record types, object-relational types, multi-result-set patterns, and cursor reuse.

---

## Table API (TAPI) Pattern

A Table API encapsulates all DML for a table into a package, providing a single point of control for inserts, updates, deletes, and queries. It separates SQL from business logic and makes the data layer refactorable without touching callers.

```sql
-- Generated TAPI for the EMPLOYEES table
CREATE OR REPLACE PACKAGE employees_tapi AS

  -- Return type mirrors the table row
  SUBTYPE t_row IS employees%ROWTYPE;

  -- Insert: returns the new primary key
  FUNCTION ins(
    p_first_name    IN employees.first_name%TYPE,
    p_last_name     IN employees.last_name%TYPE,
    p_email         IN employees.email%TYPE,
    p_hire_date     IN employees.hire_date%TYPE    DEFAULT SYSDATE,
    p_job_id        IN employees.job_id%TYPE,
    p_salary        IN employees.salary%TYPE       DEFAULT NULL,
    p_department_id IN employees.department_id%TYPE DEFAULT NULL
  ) RETURN employees.employee_id%TYPE;

  -- Update by primary key
  PROCEDURE upd(
    p_employee_id   IN employees.employee_id%TYPE,
    p_first_name    IN employees.first_name%TYPE    DEFAULT NULL,
    p_last_name     IN employees.last_name%TYPE     DEFAULT NULL,
    p_salary        IN employees.salary%TYPE        DEFAULT NULL,
    p_department_id IN employees.department_id%TYPE DEFAULT NULL
  );

  -- Delete by primary key
  PROCEDURE del(
    p_employee_id IN employees.employee_id%TYPE
  );

  -- Select by primary key
  FUNCTION get(
    p_employee_id IN employees.employee_id%TYPE
  ) RETURN t_row;

  -- Existence check
  FUNCTION exists_by_id(
    p_employee_id IN employees.employee_id%TYPE
  ) RETURN BOOLEAN;

  -- Lock for update
  FUNCTION lock_row(
    p_employee_id IN employees.employee_id%TYPE
  ) RETURN t_row;

END employees_tapi;
/

CREATE OR REPLACE PACKAGE BODY employees_tapi AS

  FUNCTION ins(
    p_first_name    IN employees.first_name%TYPE,
    p_last_name     IN employees.last_name%TYPE,
    p_email         IN employees.email%TYPE,
    p_hire_date     IN employees.hire_date%TYPE    DEFAULT SYSDATE,
    p_job_id        IN employees.job_id%TYPE,
    p_salary        IN employees.salary%TYPE       DEFAULT NULL,
    p_department_id IN employees.department_id%TYPE DEFAULT NULL
  ) RETURN employees.employee_id%TYPE IS
    l_employee_id employees.employee_id%TYPE;
  BEGIN
    INSERT INTO employees (
      employee_id, first_name, last_name, email,
      hire_date, job_id, salary, department_id
    ) VALUES (
      employees_seq.NEXTVAL, p_first_name, p_last_name, p_email,
      p_hire_date, p_job_id, p_salary, p_department_id
    ) RETURNING employee_id INTO l_employee_id;

    RETURN l_employee_id;
  END ins;

  PROCEDURE upd(
    p_employee_id   IN employees.employee_id%TYPE,
    p_first_name    IN employees.first_name%TYPE    DEFAULT NULL,
    p_last_name     IN employees.last_name%TYPE     DEFAULT NULL,
    p_salary        IN employees.salary%TYPE        DEFAULT NULL,
    p_department_id IN employees.department_id%TYPE DEFAULT NULL
  ) IS
  BEGIN
    UPDATE employees
    SET    first_name    = NVL(p_first_name,    first_name),
           last_name     = NVL(p_last_name,     last_name),
           salary        = NVL(p_salary,        salary),
           department_id = NVL(p_department_id, department_id),
           updated_at    = SYSDATE
    WHERE  employee_id = p_employee_id;

    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20001, 'Employee not found: ' || p_employee_id);
    END IF;
  END upd;

  PROCEDURE del(p_employee_id IN employees.employee_id%TYPE) IS
  BEGIN
    DELETE FROM employees WHERE employee_id = p_employee_id;

    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20001, 'Employee not found: ' || p_employee_id);
    END IF;
  END del;

  FUNCTION get(p_employee_id IN employees.employee_id%TYPE) RETURN t_row IS
    l_row t_row;
  BEGIN
    SELECT * INTO l_row FROM employees WHERE employee_id = p_employee_id;
    RETURN l_row;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20001, 'Employee not found: ' || p_employee_id);
  END get;

  FUNCTION exists_by_id(p_employee_id IN employees.employee_id%TYPE) RETURN BOOLEAN IS
    l_count PLS_INTEGER;
  BEGIN
    SELECT COUNT(*) INTO l_count FROM employees
    WHERE employee_id = p_employee_id AND ROWNUM = 1;
    RETURN l_count > 0;
  END exists_by_id;

  FUNCTION lock_row(p_employee_id IN employees.employee_id%TYPE) RETURN t_row IS
    l_row t_row;
  BEGIN
    SELECT * INTO l_row FROM employees
    WHERE employee_id = p_employee_id
    FOR UPDATE NOWAIT;
    RETURN l_row;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20001, 'Employee not found: ' || p_employee_id);
    WHEN app_exceptions_pkg.e_resource_busy THEN
      RAISE_APPLICATION_ERROR(-20002, 'Employee record is locked: ' || p_employee_id);
  END lock_row;

END employees_tapi;
/
```

**TAPI tools**: Oracle has generators like `tapi_gen`, `OraOpenSource/tapi`, and SQL Developer data modeler can auto-generate TAPI packages.

---

## Autonomous Transaction Pattern for Audit and Logging

The autonomous transaction pattern ensures audit and log records are committed independently of the main transaction — logs survive rollbacks.

```sql
CREATE OR REPLACE PACKAGE BODY audit_pkg AS

  PROCEDURE log_change(
    p_table_name  IN VARCHAR2,
    p_operation   IN VARCHAR2,  -- INSERT / UPDATE / DELETE
    p_row_id      IN VARCHAR2,
    p_old_values  IN VARCHAR2 DEFAULT NULL,
    p_new_values  IN VARCHAR2 DEFAULT NULL
  ) IS
    PRAGMA AUTONOMOUS_TRANSACTION;
  BEGIN
    INSERT INTO audit_log (
      audit_id,
      log_timestamp,
      db_user,
      app_user,
      table_name,
      operation,
      row_identifier,
      old_values,
      new_values,
      session_id,
      client_identifier
    ) VALUES (
      audit_seq.NEXTVAL,
      SYSTIMESTAMP,
      SYS_CONTEXT('USERENV', 'SESSION_USER'),
      SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER'),
      p_table_name,
      p_operation,
      p_row_id,
      p_old_values,
      p_new_values,
      SYS_CONTEXT('USERENV', 'SESSIONID'),
      SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER')
    );
    COMMIT;  -- autonomous commit: does NOT affect caller's transaction
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;  -- rollback only the autonomous transaction
      -- Do NOT re-raise — logging failure should not break business logic
  END log_change;

END audit_pkg;
/

-- Usage in a DML trigger
CREATE OR REPLACE TRIGGER employees_audit_trg
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW
BEGIN
  IF INSERTING THEN
    audit_pkg.log_change('EMPLOYEES', 'INSERT', :NEW.employee_id,
      NULL, 'salary=' || :NEW.salary);
  ELSIF UPDATING THEN
    audit_pkg.log_change('EMPLOYEES', 'UPDATE', :NEW.employee_id,
      'salary=' || :OLD.salary, 'salary=' || :NEW.salary);
  ELSIF DELETING THEN
    audit_pkg.log_change('EMPLOYEES', 'DELETE', :OLD.employee_id,
      'salary=' || :OLD.salary, NULL);
  END IF;
END employees_audit_trg;
/
```

**Caution**: Autonomous transactions acquire their own locks and see their own view of committed data. Avoid complex queries in autonomous transactions — keep them focused on INSERT-and-COMMIT for logging.

---

## Pipelined Function for Streaming Results

A pipelined function yields rows to the caller as they are produced — it doesn't build the full result in memory first. This is ideal for transformations and ETL-style processing.

```sql
-- Define the return row type
CREATE OR REPLACE TYPE t_sales_summary_row AS OBJECT (
  region_name    VARCHAR2(50),
  product_name   VARCHAR2(100),
  units_sold     NUMBER,
  revenue        NUMBER(15,2),
  rank_in_region NUMBER
);

CREATE OR REPLACE TYPE t_sales_summary_tab AS TABLE OF t_sales_summary_row;
/

-- Pipelined function
CREATE OR REPLACE FUNCTION get_sales_summary(
  p_start_date IN DATE,
  p_end_date   IN DATE
) RETURN t_sales_summary_tab PIPELINED
AUTHID CURRENT_USER IS

  CURSOR c_sales IS
    SELECT r.region_name, p.product_name,
           SUM(s.quantity)              AS units_sold,
           SUM(s.quantity * s.price)    AS revenue,
           RANK() OVER (
             PARTITION BY r.region_name
             ORDER BY SUM(s.quantity * s.price) DESC
           ) AS rank_in_region
    FROM   sales s
    JOIN   products p ON p.product_id = s.product_id
    JOIN   regions  r ON r.region_id  = s.region_id
    WHERE  s.sale_date BETWEEN p_start_date AND p_end_date
    GROUP BY r.region_name, p.product_name;

BEGIN
  FOR rec IN c_sales LOOP
    PIPE ROW(t_sales_summary_row(
      rec.region_name,
      rec.product_name,
      rec.units_sold,
      rec.revenue,
      rec.rank_in_region
    ));
  END LOOP;

  RETURN;  -- required; no value after RETURN for pipelined functions
EXCEPTION
  WHEN NO_DATA_NEEDED THEN
    NULL;  -- consumer stopped consuming early — normal, not an error
END get_sales_summary;
/

-- Use in SQL like a table
SELECT * FROM TABLE(get_sales_summary(DATE '2024-01-01', DATE '2024-12-31'))
WHERE  rank_in_region <= 5
ORDER BY region_name, rank_in_region;
```

---

## PL/SQL Record Types vs %ROWTYPE

### %ROWTYPE (anchored to table/cursor)

```sql
DECLARE
  -- Anchored to the table structure — adapts if columns are added
  l_emp  employees%ROWTYPE;
  l_dept departments%ROWTYPE;

  -- Anchored to a cursor — only includes selected columns
  CURSOR c_report IS
    SELECT e.employee_id, e.last_name, d.department_name
    FROM   employees e JOIN departments d USING (department_id);

  l_report_row c_report%ROWTYPE;
BEGIN
  SELECT * INTO l_emp FROM employees WHERE employee_id = 100;
  DBMS_OUTPUT.PUT_LINE(l_emp.last_name || ', ' || l_emp.first_name);
END;
```

### Explicit Record Types (custom structure)

```sql
DECLARE
  -- Custom record type for aggregated/transformed data
  TYPE t_employee_summary IS RECORD (
    employee_id   employees.employee_id%TYPE,
    full_name     VARCHAR2(101),  -- computed: last + ', ' + first
    department    departments.department_name%TYPE,
    salary_band   VARCHAR2(10),   -- JUNIOR / MID / SENIOR
    tenure_years  NUMBER
  );

  TYPE t_summary_tab IS TABLE OF t_employee_summary;
  l_summaries t_summary_tab := t_summary_tab();

  l_summary t_employee_summary;
BEGIN
  l_summary.employee_id  := 100;
  l_summary.full_name    := 'King, Steven';
  l_summary.department   := 'Executive';
  l_summary.salary_band  := 'SENIOR';
  l_summary.tenure_years := 15;

  l_summaries.EXTEND;
  l_summaries(l_summaries.LAST) := l_summary;
END;
```

---

## Object Types in PL/SQL

Oracle object types bring OOP concepts (encapsulation, inheritance, polymorphism) to the database.

```sql
-- Base object type with methods
CREATE OR REPLACE TYPE shape_t AS OBJECT (
  color  VARCHAR2(20),

  -- Member function (instance method)
  MEMBER FUNCTION area RETURN NUMBER,

  -- Member procedure
  MEMBER PROCEDURE describe,

  -- Static function (class method)
  STATIC FUNCTION default_color RETURN VARCHAR2,

  -- Map function for comparisons (alternative to ORDER method)
  MAP MEMBER FUNCTION sort_key RETURN NUMBER
) NOT FINAL;  -- NOT FINAL enables subtype creation
/

-- Subtype: rectangle extends shape
CREATE OR REPLACE TYPE rectangle_t UNDER shape_t (
  width  NUMBER,
  height NUMBER,

  -- Constructor
  CONSTRUCTOR FUNCTION rectangle_t(
    p_color  IN VARCHAR2,
    p_width  IN NUMBER,
    p_height IN NUMBER
  ) RETURN SELF AS RESULT,

  -- Override inherited methods
  OVERRIDING MEMBER FUNCTION area RETURN NUMBER,
  OVERRIDING MEMBER PROCEDURE describe,
  OVERRIDING MAP MEMBER FUNCTION sort_key RETURN NUMBER
);
/

-- Type body
CREATE OR REPLACE TYPE BODY rectangle_t AS

  CONSTRUCTOR FUNCTION rectangle_t(
    p_color IN VARCHAR2, p_width IN NUMBER, p_height IN NUMBER
  ) RETURN SELF AS RESULT IS
  BEGIN
    self.color  := p_color;
    self.width  := p_width;
    self.height := p_height;
    RETURN;
  END;

  OVERRIDING MEMBER FUNCTION area RETURN NUMBER IS
  BEGIN
    RETURN self.width * self.height;
  END area;

  OVERRIDING MEMBER PROCEDURE describe IS
  BEGIN
    DBMS_OUTPUT.PUT_LINE(
      'Rectangle: ' || self.width || 'x' || self.height ||
      ' = ' || self.area() || ' sq units, color=' || self.color
    );
  END describe;

  OVERRIDING MAP MEMBER FUNCTION sort_key RETURN NUMBER IS
  BEGIN
    RETURN self.area();
  END sort_key;

END;
/

-- Usage
DECLARE
  l_rect rectangle_t;
BEGIN
  l_rect := rectangle_t(p_color => 'blue', p_width => 5, p_height => 3);
  l_rect.describe;            -- "Rectangle: 5x3 = 15 sq units, color=blue"
  DBMS_OUTPUT.PUT_LINE(l_rect.area());  -- 15
END;
/
```

---

## Returning Multiple Result Sets via REF CURSORs

A procedure with multiple OUT SYS_REFCURSOR parameters can return several independent result sets to the caller.

```sql
CREATE OR REPLACE PROCEDURE get_order_dashboard(
  p_customer_id    IN  NUMBER,
  p_pending_orders OUT SYS_REFCURSOR,
  p_order_history  OUT SYS_REFCURSOR,
  p_summary        OUT SYS_REFCURSOR
) AS
BEGIN
  -- First result set: pending orders
  OPEN p_pending_orders FOR
    SELECT order_id, order_date, total_amount
    FROM   orders
    WHERE  customer_id = p_customer_id
      AND  status = 'PENDING'
    ORDER BY order_date;

  -- Second result set: last 12 months history
  OPEN p_order_history FOR
    SELECT order_id, order_date, status, total_amount
    FROM   orders
    WHERE  customer_id = p_customer_id
      AND  order_date >= ADD_MONTHS(SYSDATE, -12)
    ORDER BY order_date DESC;

  -- Third result set: summary statistics
  OPEN p_summary FOR
    SELECT COUNT(*)                     AS total_orders,
           SUM(total_amount)            AS lifetime_value,
           MAX(order_date)              AS last_order_date,
           AVG(total_amount)            AS avg_order_value
    FROM   orders
    WHERE  customer_id = p_customer_id;

END get_order_dashboard;
/

-- Usage: Java JDBC would call this and process 3 result sets
-- PL/SQL caller:
DECLARE
  l_pending  SYS_REFCURSOR;
  l_history  SYS_REFCURSOR;
  l_summary  SYS_REFCURSOR;
  l_order_id NUMBER;
  l_total    NUMBER;
BEGIN
  get_order_dashboard(
    p_customer_id    => 12345,
    p_pending_orders => l_pending,
    p_order_history  => l_history,
    p_summary        => l_summary
  );

  -- Process pending orders
  LOOP
    FETCH l_pending INTO l_order_id, l_total;
    EXIT WHEN l_pending%NOTFOUND;
    DBMS_OUTPUT.PUT_LINE('Pending: ' || l_order_id || ' $' || l_total);
  END LOOP;
  CLOSE l_pending;

  CLOSE l_history;  -- if not consuming, still must close
  CLOSE l_summary;
END;
/
```

---

## Parse Once, Execute Many Pattern with DBMS_SQL

For dynamic SQL executed many times with different bind values, parse once and re-execute to avoid repeated hard parsing.

```sql
CREATE OR REPLACE PROCEDURE bulk_insert_orders(
  p_orders IN order_collection_t
) IS
  l_cursor    INTEGER;
  l_rows_proc INTEGER;
BEGIN
  -- Parse once
  l_cursor := DBMS_SQL.OPEN_CURSOR;
  DBMS_SQL.PARSE(
    l_cursor,
    'INSERT INTO orders (customer_id, order_date, status, total_amount)
     VALUES (:cust_id, :ord_date, :status, :amount)',
    DBMS_SQL.NATIVE
  );

  -- Execute many times with different bind values
  FOR i IN 1..p_orders.COUNT LOOP
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':cust_id',  p_orders(i).customer_id);
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':ord_date', p_orders(i).order_date);
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':status',   p_orders(i).status);
    DBMS_SQL.BIND_VARIABLE(l_cursor, ':amount',   p_orders(i).total_amount);

    l_rows_proc := DBMS_SQL.EXECUTE(l_cursor);
  END LOOP;

  DBMS_SQL.CLOSE_CURSOR(l_cursor);
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    IF DBMS_SQL.IS_OPEN(l_cursor) THEN
      DBMS_SQL.CLOSE_CURSOR(l_cursor);
    END IF;
    RAISE;
END bulk_insert_orders;
/
```

For most cases, `FORALL` with static SQL is cleaner and faster than `DBMS_SQL` parse-once. Use `DBMS_SQL` when the SQL structure itself is dynamic (unknown column count, DDL with variable arguments).

---

## Best Practices

- Use TAPI to centralize DML — when a table changes, only the TAPI needs updating, not every caller.
- Use autonomous transactions exclusively for logging/auditing — not for general DML workarounds.
- Always handle `NO_DATA_NEEDED` in pipelined functions — it is not an error; the consumer stopped early.
- Prefer `%ROWTYPE` over explicit record types when the structure maps 1:1 to a table — it survives schema changes.
- Use object types for complex domain models that benefit from encapsulation; use record types for simple data transfer.
- When returning multiple cursors, document clearly which caller is responsible for closing each one.
- Cache DBMS_SQL cursor handles at the package level for procedures called in tight loops.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| TAPI that commits internally | Breaks transaction composability | Never commit inside TAPI; let the caller control transactions |
| Autonomous transaction for business DML | Creates invisible uncommitted sibling transaction | Use autonomous transactions only for audit/log |
| Pipelined function with no `NO_DATA_NEEDED` handler | ORA-06548 when consumer stops early | Catch `NO_DATA_NEEDED` and return |
| Object type with no `NOT FINAL` when subtypes needed | Cannot create subtypes | Add `NOT FINAL` to base type |
| Multiple REF CURSOR OUTs not closed by caller | Cursor leaks | Document ownership; always close in EXCEPTION handler |
| DBMS_SQL cursor not closed on exception | Cursor leak and resource exhaustion | Always close in EXCEPTION handler with `IS_OPEN` check |

---

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

- **Oracle 9i+**: Object type inheritance (`UNDER`) and `NOT FINAL` fully supported.
- **Oracle 12c+**: Implicit result sets (`DBMS_SQL.RETURN_RESULT`) for compatibility with SQL Server style result set return from procedures.
- **Oracle 18c+**: Polymorphic table functions (`PTIF`) using `DBMS_TF` package — a major extension of the pipelined function concept that allows the return schema to be defined at runtime.
- **Oracle 21c+**: Full JSON support in object types for document-relational hybrid patterns.

---

## Sources

- [Oracle Database PL/SQL Language Reference 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/) — TAPI patterns, autonomous transactions, pipelined functions, object types
- [Oracle Database PL/SQL Language Reference 19c — PIPELINED Clause](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/CREATE-FUNCTION-statement.html) — pipelined table functions, NO_DATA_NEEDED
- [DBMS_SQL (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SQL.html) — parse-once execute-many pattern
