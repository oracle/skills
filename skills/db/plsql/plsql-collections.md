# PL/SQL Collections

## Overview

Collections are the primary data structure for in-memory sets of data in PL/SQL. There are three distinct types, each with different storage semantics, SQL visibility, and initialization requirements. Understanding when to use each type — and how to use collection methods safely — is essential for both correctness and performance.

---

## Collection Types Comparison

| Feature | Associative Array | Nested Table | Varray |
|---|---|---|---|
| **Also known as** | Index-by table, PL/SQL table | Unbounded array | Variable-size array |
| **Index type** | `PLS_INTEGER` or `VARCHAR2` | Integer (1-based) | Integer (1-based) |
| **Max size** | Unbounded | Unbounded | Fixed at declaration |
| **Sparse allowed** | Yes | Yes (after DELETE) | No |
| **Must be initialized** | No | Yes (before use) | Yes (before use) |
| **Can be NULL** | Cannot be null | Can be NULL (atomically null) | Can be NULL (atomically null) |
| **Stored in database** | No (PL/SQL only) | Yes (as column type) | Yes (as column type) |
| **SQL TABLE() access** | No | Yes | Yes |
| **Nested in object types** | No | Yes | Yes |
| **Multi-level nesting** | No | Yes | Yes |
| **Best use case** | In-memory lookup/cache, string-indexed maps | Set operations, SQL interop, flexible DML | Fixed-size arrays, database storage |

---

## Associative Arrays

Declared with `INDEX BY`. No initialization needed. Can use string or integer keys.

```sql
DECLARE
  -- Integer-indexed
  TYPE t_salary_map IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
  l_salaries t_salary_map;

  -- String-indexed (lookup table / hash map pattern)
  TYPE t_country_map IS TABLE OF VARCHAR2(100) INDEX BY VARCHAR2(3);
  l_countries t_country_map;
BEGIN
  -- Populate integer-indexed
  l_salaries(1)   := 50000;
  l_salaries(2)   := 60000;
  l_salaries(1000) := 75000;  -- sparse — gaps are fine

  -- Populate string-indexed (dictionary/map pattern)
  l_countries('USA') := 'United States';
  l_countries('GBR') := 'United Kingdom';
  l_countries('DEU') := 'Germany';

  -- Lookup
  IF l_countries.EXISTS('USA') THEN
    DBMS_OUTPUT.PUT_LINE(l_countries('USA'));
  END IF;

  -- Iterate using FIRST/NEXT
  DECLARE
    l_key VARCHAR2(3) := l_countries.FIRST;
  BEGIN
    WHILE l_key IS NOT NULL LOOP
      DBMS_OUTPUT.PUT_LINE(l_key || ': ' || l_countries(l_key));
      l_key := l_countries.NEXT(l_key);
    END LOOP;
  END;
END;
/
```

**Use case**: Caching lookup data, building in-memory hash maps, when string keys are needed.

---

## Nested Tables

Must be initialized before use. Support full collection methods and SQL `TABLE()` operator.

```sql
-- Schema-level type (storable in DB, usable in SQL)
CREATE OR REPLACE TYPE t_name_list AS TABLE OF VARCHAR2(100);
/

-- Package-level type (PL/SQL only)
DECLARE
  TYPE t_employee_ids IS TABLE OF employees.employee_id%TYPE;

  -- Must initialize before use
  l_ids t_employee_ids := t_employee_ids();  -- empty nested table
  l_names t_name_list  := t_name_list('Alice', 'Bob', 'Carol');
BEGIN
  -- Extend before assigning
  l_ids.EXTEND;
  l_ids(1) := 101;

  l_ids.EXTEND(3);  -- add 3 null slots
  l_ids(2) := 102;
  l_ids(3) := 103;
  l_ids(4) := 104;

  -- Delete creates sparse table
  l_ids.DELETE(2);  -- l_ids(2) no longer exists, but l_ids(3) still = 103

  -- Navigate sparse table safely
  FOR i IN 1..l_ids.LAST LOOP
    IF l_ids.EXISTS(i) THEN
      DBMS_OUTPUT.PUT_LINE(l_ids(i));
    END IF;
  END LOOP;

  -- SQL access via TABLE()
  SELECT column_value FROM TABLE(l_names);
END;
/
```

---

## Varrays

Fixed maximum size declared at creation. Cannot be sparse. Must be initialized.

```sql
-- Varray type with max 12 elements
CREATE OR REPLACE TYPE t_month_names AS VARRAY(12) OF VARCHAR2(20);
/

DECLARE
  l_months t_month_names := t_month_names(
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  );
BEGIN
  -- Can hold at most 12 elements (defined in type)
  DBMS_OUTPUT.PUT_LINE('Month 3: ' || l_months(3));  -- March
  DBMS_OUTPUT.PUT_LINE('Count: ' || l_months.COUNT);  -- 12
  DBMS_OUTPUT.PUT_LINE('Limit: ' || l_months.LIMIT);  -- 12

  -- Cannot DELETE individual elements from a varray
  -- l_months.DELETE(1);  -- This would raise an error

  -- Can TRIM from the end
  l_months.TRIM;    -- removes last element
  l_months.TRIM(2); -- removes last 2 elements
END;
/
```

**Use case**: When the maximum size is known and fixed (months, days of week, fixed-size lookup arrays stored in database columns).

---

## Collection Methods Reference

| Method | Associative Array | Nested Table | Varray | Description |
|---|---|---|---|---|
| `COUNT` | Yes | Yes | Yes | Number of elements currently in collection |
| `FIRST` | Yes | Yes | Yes | Lowest index (NULL if empty) |
| `LAST` | Yes | Yes | Yes | Highest index (NULL if empty) |
| `NEXT(n)` | Yes | Yes | Yes | Index after n (NULL if none) |
| `PRIOR(n)` | Yes | Yes | Yes | Index before n (NULL if none) |
| `EXISTS(n)` | Yes | Yes | Yes | TRUE if element at index n exists |
| `DELETE` | Yes (all) | Yes (all) | No | Delete all elements |
| `DELETE(n)` | Yes | Yes | No | Delete element at index n |
| `DELETE(m,n)` | Yes | Yes | No | Delete elements from index m to n |
| `EXTEND` | No | Yes | Yes | Add one null element |
| `EXTEND(n)` | No | Yes | Yes | Add n null elements |
| `EXTEND(n,i)` | No | Yes | Yes | Add n copies of element at index i |
| `TRIM` | No | Yes | Yes | Remove last element |
| `TRIM(n)` | No | Yes | Yes | Remove last n elements |
| `LIMIT` | No | No | Yes | Maximum allowed elements |

```sql
DECLARE
  TYPE t_numbers IS TABLE OF NUMBER;
  l_nums t_numbers := t_numbers(10, 20, 30, 40, 50);
BEGIN
  DBMS_OUTPUT.PUT_LINE('COUNT: ' || l_nums.COUNT);   -- 5
  DBMS_OUTPUT.PUT_LINE('FIRST: ' || l_nums.FIRST);   -- 1
  DBMS_OUTPUT.PUT_LINE('LAST: '  || l_nums.LAST);    -- 5
  DBMS_OUTPUT.PUT_LINE('NEXT(3): ' || l_nums.NEXT(3)); -- 4
  DBMS_OUTPUT.PUT_LINE('PRIOR(3): '|| l_nums.PRIOR(3)); -- 2

  l_nums.DELETE(3);  -- remove element at index 3
  DBMS_OUTPUT.PUT_LINE('COUNT after DELETE(3): ' || l_nums.COUNT); -- 4
  DBMS_OUTPUT.PUT_LINE('EXISTS(3): ' || CASE WHEN l_nums.EXISTS(3) THEN 'Y' ELSE 'N' END); -- N
  DBMS_OUTPUT.PUT_LINE('NEXT(2): ' || l_nums.NEXT(2)); -- 4 (skips deleted 3)

  l_nums.EXTEND(2);  -- add 2 null elements at positions 6 and 7 (wait — LAST was 5, but 3 deleted)
  -- Actually EXTEND adds after LAST
  l_nums(l_nums.LAST) := 60;  -- assign to last extended element

  l_nums.TRIM;  -- remove last element
  DBMS_OUTPUT.PUT_LINE('COUNT after TRIM: ' || l_nums.COUNT);
END;
/
```

---

## Bulk Operations with Collections

Collections are the vehicle for bulk DML via `FORALL` and bulk SELECT via `BULK COLLECT`.

```sql
DECLARE
  TYPE t_emp_id_tab  IS TABLE OF employees.employee_id%TYPE;
  TYPE t_dept_id_tab IS TABLE OF employees.department_id%TYPE;
  TYPE t_sal_tab     IS TABLE OF employees.salary%TYPE;

  l_emp_ids  t_emp_id_tab;
  l_dept_ids t_dept_id_tab;
  l_salaries t_sal_tab;

  CURSOR c_dept10 IS
    SELECT employee_id, department_id, salary
    FROM   employees
    WHERE  department_id = 10;
BEGIN
  -- Bulk fetch into parallel collections
  OPEN c_dept10;
  FETCH c_dept10 BULK COLLECT INTO l_emp_ids, l_dept_ids, l_salaries LIMIT 500;
  CLOSE c_dept10;

  -- Modify in PL/SQL
  FOR i IN 1..l_salaries.COUNT LOOP
    l_salaries(i) := l_salaries(i) * 1.05;  -- 5% raise
  END LOOP;

  -- Single FORALL sends all DML at once
  FORALL i IN 1..l_emp_ids.COUNT
    UPDATE employees
    SET    salary = l_salaries(i)
    WHERE  employee_id = l_emp_ids(i);

  DBMS_OUTPUT.PUT_LINE('Updated: ' || SQL%ROWCOUNT || ' rows');
  COMMIT;
END;
/
```

**Using %ROWTYPE for cleaner code**:

```sql
DECLARE
  TYPE t_emp_tab IS TABLE OF employees%ROWTYPE;
  l_employees t_emp_tab;
BEGIN
  SELECT * BULK COLLECT INTO l_employees
  FROM   employees
  WHERE  department_id = 20
  LIMIT 1000;

  FOR i IN 1..l_employees.COUNT LOOP
    DBMS_OUTPUT.PUT_LINE(l_employees(i).last_name);
  END LOOP;
END;
/
```

---

## TABLE() and CAST() for SQL Access

Schema-level nested table and varray types can be used in SQL via the `TABLE()` operator.

```sql
-- Use nested table in SQL FROM clause
CREATE OR REPLACE TYPE t_number_list AS TABLE OF NUMBER;
/

-- Inline collection in SQL
SELECT column_value AS id
FROM   TABLE(t_number_list(10, 20, 30, 40));

-- Pass collection to SQL from PL/SQL
DECLARE
  l_dept_ids t_number_list := t_number_list(10, 20, 30);
BEGIN
  -- IN list from collection
  FOR rec IN (
    SELECT employee_id, last_name
    FROM   employees
    WHERE  department_id IN (SELECT column_value FROM TABLE(l_dept_ids))
  ) LOOP
    DBMS_OUTPUT.PUT_LINE(rec.last_name);
  END LOOP;
END;
/

-- CAST() with MULTISET for type conversion
SELECT d.department_name,
       CAST(MULTISET(
         SELECT e.last_name
         FROM   employees e
         WHERE  e.department_id = d.department_id
       ) AS t_name_list) AS employee_names
FROM   departments d;
```

---

## Collection Exceptions

| Exception | ORA Code | Trigger Condition |
|---|---|---|
| `COLLECTION_IS_NULL` | ORA-06531 | Method called on uninitialized (atomically null) nested table or varray |
| `NO_DATA_FOUND` | ORA-01403 | Subscript refers to deleted or nonexistent element |
| `SUBSCRIPT_BEYOND_COUNT` | ORA-06533 | Subscript exceeds COUNT |
| `SUBSCRIPT_OUTSIDE_LIMIT` | ORA-06532 | Varray subscript below 1 or beyond LIMIT |
| `VALUE_ERROR` | ORA-06502 | Non-integer subscript on integer-indexed collection |

```sql
DECLARE
  TYPE t_nums IS TABLE OF NUMBER;
  l_nums t_nums;  -- uninitialized = NULL
BEGIN
  -- COLLECTION_IS_NULL: l_nums is null, not just empty
  l_nums.EXTEND;  -- ORA-06531: reference to uninitialized collection

EXCEPTION
  WHEN COLLECTION_IS_NULL THEN
    DBMS_OUTPUT.PUT_LINE('Initialize with constructor first: l_nums := t_nums()');
END;
/

DECLARE
  TYPE t_nums IS TABLE OF NUMBER;
  l_nums t_nums := t_nums(1, 2, 3);
BEGIN
  l_nums.DELETE(2);

  -- NO_DATA_FOUND: element 2 was deleted
  DBMS_OUTPUT.PUT_LINE(l_nums(2));  -- ORA-01403

  -- SUBSCRIPT_BEYOND_COUNT: only 2 elements remain (indices 1 and 3)
  DBMS_OUTPUT.PUT_LINE(l_nums(10)); -- ORA-06533

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('Element does not exist — use EXISTS() first');
  WHEN SUBSCRIPT_BEYOND_COUNT THEN
    DBMS_OUTPUT.PUT_LINE('Index beyond COUNT');
END;
/
```

**Defensive pattern**: Always check `EXISTS()` before accessing by index, especially after `DELETE`.

---

## Multi-Level Collections

Nested tables can contain other collection types (nested tables of nested tables).

```sql
-- Multi-level: table of tables
CREATE OR REPLACE TYPE t_string_list AS TABLE OF VARCHAR2(100);
/

CREATE OR REPLACE TYPE t_string_matrix AS TABLE OF t_string_list;
/

DECLARE
  l_matrix t_string_matrix := t_string_matrix();
  l_row1   t_string_list   := t_string_list('Q1', 'Q2', 'Q3', 'Q4');
  l_row2   t_string_list   := t_string_list('Jan', 'Feb', 'Mar');
BEGIN
  l_matrix.EXTEND(2);
  l_matrix(1) := l_row1;
  l_matrix(2) := l_row2;

  -- Access: outer(row)(column)
  DBMS_OUTPUT.PUT_LINE(l_matrix(1)(2));  -- Q2
  DBMS_OUTPUT.PUT_LINE(l_matrix(2)(1));  -- Jan

  -- Iterate
  FOR i IN 1..l_matrix.COUNT LOOP
    FOR j IN 1..l_matrix(i).COUNT LOOP
      DBMS_OUTPUT.PUT_LINE(i || ',' || j || ': ' || l_matrix(i)(j));
    END LOOP;
  END LOOP;
END;
/
```

---

## Best Practices

- Use **associative arrays** for all in-memory temporary storage in PL/SQL — zero initialization overhead.
- Use **nested tables** when you need SQL access (`TABLE()`), bulk DML, or set operations (`MULTISET UNION`, `MULTISET INTERSECT`).
- Use **varrays** only when the maximum size is truly fixed and the type needs to be stored in a database column.
- Always call `EXISTS()` before accessing an element that may have been deleted.
- When iterating a potentially sparse collection, use `FIRST`/`NEXT` instead of a numeric FOR loop.
- Use `BULK COLLECT ... LIMIT` in loops — never `BULK COLLECT` without `LIMIT` on tables with unbounded row counts.
- Anchor collection element types to column definitions with `%TYPE` to survive schema changes.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Accessing uninitialized nested table | `ORA-06531: COLLECTION_IS_NULL` | Initialize: `l_tab := t_tab()` |
| Accessing deleted element without `EXISTS()` | `ORA-01403` | Always check `IF l_tab.EXISTS(i)` |
| Iterating with `FOR i IN 1..l_tab.COUNT` on sparse table | Skips `EXISTS` check; `COUNT` includes deleted | Use `FIRST`/`NEXT` loop |
| `BULK COLLECT` without `LIMIT` | Loads entire result set into PGA | Always add `LIMIT n` |
| Using `TRIM` when `DELETE` was used | `TRIM` removes from end regardless of gaps | Use `DELETE` or `TRIM` consistently |
| Nested table assigned NULL | Becomes atomically null; all method calls fail | Assign empty constructor, not NULL |
| `FORALL` on sparse collection | ORA-22160: element at index does not exist | Use `FORALL i IN INDICES OF l_tab` |

```sql
-- Sparse collection with FORALL: use INDICES OF
DECLARE
  TYPE t_ids IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
  l_ids t_ids;
BEGIN
  l_ids(1)  := 101;
  l_ids(5)  := 105;  -- gap: 2,3,4 don't exist
  l_ids(10) := 110;

  -- FORALL i IN 1..l_ids.LAST would fail — gaps exist
  -- Use INDICES OF to iterate only existing elements
  FORALL i IN INDICES OF l_ids
    UPDATE employees SET status = 'PROCESSED' WHERE employee_id = l_ids(i);
END;
/
```

---

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

- **Oracle 9i+**: `BULK COLLECT`, `FORALL`, and the `TABLE()` operator are mature and fully supported.
- **Oracle 10g+**: String-indexed associative arrays (`INDEX BY VARCHAR2(n)`) fully supported.
- **Oracle 12c+**: `ACCESSIBLE BY` can restrict which units can use package-level collection types.
- **Oracle 21c+**: Improved JSON integration with collections for document-style data.

---

## Sources

- [Oracle Database PL/SQL Language Reference 19c — Collection Types](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-collections-and-records.html) — associative arrays, nested tables, varrays, BULK COLLECT, FORALL, INDICES OF
- [Oracle Database PL/SQL Language Reference 19c — FORALL Statement](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/FORALL-statement.html) — INDICES OF, VALUES OF, sparse collection handling
