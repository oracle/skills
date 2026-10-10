# Oracle SQL Assertions

## Overview

A **SQL assertion** is a schema-level integrity constraint whose Boolean expression must remain true as DML commits. Unlike a table `CHECK` constraint, an assertion can reference multiple rows and multiple base tables, so it can declare cross-row and cross-table business rules that previously required triggers or materialized-view workarounds.

Assertions require Oracle AI Database 26ai (RU 23.26.1 or later). They are not available on 19c or 21c. There is no `DELETE ASSERTION`; use `DROP ASSERTION`.

**When assertions are useful:**
- "Every department must have at least one employee"
- "No employee earns more than their manager"
- "A company must always have a president"
- Any rule that spans rows or tables and cannot be expressed as `CHECK`, `UNIQUE`, primary key, or foreign key

---

## Choose an Assertion or a Conventional Constraint

| Need | Use |
| --- | --- |
| Column or single-row rule | Table `CHECK`, `NOT NULL`, `UNIQUE`, or primary key |
| Parent/child existence by key | Foreign key |
| Cross-table or cross-row rule | `CREATE ASSERTION` |
| Unit-test expectation | utPLSQL; this is a different feature (see `db/devops/database-testing.md`) |

Oracle recommends conventional constraints for single-row rules because they perform better than an equivalent assertion.

Constraints and assertions share a namespace within a schema. An assertion cannot use a name already used by a constraint in the same schema (`ORA-00955`), and a constraint cannot use an assertion's name (`ORA-08721`).

---

## Privileges

`CREATE ASSERTION` lets a user create assertions in their own schema and alter or drop the assertions they own. For other schemas, use `CREATE ANY ASSERTION`, `ALTER ANY ASSERTION`, or `DROP ANY ASSERTION`, optionally scoped with `ON SCHEMA <schema>`.

Cross-schema table references require the `ASSERTION REFERENCES` object privilege on those tables, not the `REFERENCES` privilege used by foreign keys. Qualify every table in another schema with its owner. Synonyms are not allowed inside assertions.

```sql
GRANT CREATE ASSERTION TO app_owner;
GRANT ASSERTION REFERENCES ON hr.employees TO app_owner;
```

---

## CREATE ASSERTION

```sql
CREATE ASSERTION [ IF NOT EXISTS ] [schema.]assertion_name
CHECK ( existential_expression | universal_expression )
[ DEFERRABLE | NOT DEFERRABLE ]
[ INITIALLY IMMEDIATE | INITIALLY DEFERRED ]
[ ENABLE | DISABLE ]
[ VALIDATE | NOVALIDATE ];
```

Defaults are `NOT DEFERRABLE`, `INITIALLY IMMEDIATE`, and `ENABLE VALIDATE`. If only `DISABLE` is specified, the default is `NOVALIDATE`. `IF NOT EXISTS` suppresses `ORA-00955` when the name already exists and leaves that object unchanged. Deferrability cannot be changed later; drop and recreate the assertion. `DISABLE VALIDATE` is not supported (`ORA-08701`).

### Existential Form

Use `[NOT] EXISTS` when some row set must exist or must not exist. Nested `[NOT] EXISTS` and `[NOT] IN` are supported up to three levels; deeper nesting fails with `ORA-08712`. Join base tables with equijoins only. A correlated equijoin on a nullable column fails with `ORA-08689` followed by `ORA-08673` ("does not meet the criteria to do a FAST validation") unless the column is declared `NOT NULL` or the subquery adds an explicit `column IS NOT NULL` predicate, as in `e.deptno IS NOT NULL` below. The predicate does not change the result, because a null never satisfies the equijoin.

```sql
CREATE ASSERTION IF NOT EXISTS company_must_have_a_president
CHECK (
    EXISTS (
        SELECT 'a president'
          FROM employees
         WHERE job_id = 'AD_PRES'
    )
);
```

```sql
CREATE ASSERTION no_empty_departments
CHECK (
    NOT EXISTS (
        SELECT 'an empty department'
          FROM dept d
         WHERE NOT EXISTS (
                   SELECT 'an employee'
                     FROM emp e
                    WHERE e.deptno = d.deptno
                      AND e.deptno IS NOT NULL
               )
    )
);
```

Creating an `ENABLE VALIDATE` assertion fails with `ORA-08689` followed by `ORA-08601` if existing data violates the expression.

### Universal Form

Use `ALL ... SATISFY` when every row in a row set must satisfy a condition. The predicate is true when every row satisfies the condition or when the `ALL` query returns no rows. An unknown result is treated as true, as with constraints. Nested `[NOT] EXISTS` inside a universal expression is limited to two levels.

```sql
CREATE ASSERTION staff_earn_less_than_manager
CHECK (
    ALL (
        SELECT staff.salary staff_salary,
               mgr.salary   manager_salary
          FROM hr.employees staff,
               hr.employees mgr
         WHERE staff.manager_id = mgr.employee_id
           AND staff.manager_id IS NOT NULL
    ) staff
    SATISFY (staff_salary < manager_salary)
) NOVALIDATE;
```

`NOVALIDATE` skips the existing-data scan. While the assertion is enabled, subsequent DML is still enforced.

### Deferrable Assertions

```sql
CREATE ASSERTION president_must_exist
CHECK (
    EXISTS (SELECT 1 FROM emp WHERE job = 'PRESIDENT')
)
DEFERRABLE INITIALLY DEFERRED;
```

A deferred assertion is checked at commit. A `DEFERRABLE INITIALLY IMMEDIATE` assertion is checked per statement until the transaction defers it with `SET CONSTRAINTS assertion_name DEFERRED` or `SET CONSTRAINTS ALL DEFERRED`. The setting lasts until the end of the transaction; after `COMMIT`, checking returns to immediate. Use deferral when a multi-table rule can only hold after several related rows are inserted in one transaction:

```sql
-- no_empty_departments created DEFERRABLE INITIALLY IMMEDIATE:
-- inserting the department alone fails at once with ORA-08601
SET CONSTRAINTS no_empty_departments DEFERRED;
INSERT INTO dept (deptno, dname) VALUES (20, 'SALES');
INSERT INTO emp (empno, deptno) VALUES (2, 20);
COMMIT;  -- checked here; succeeds because department 20 now has an employee
```

If the rule still fails at commit, `COMMIT` raises `ORA-02091` followed by `ORA-08601` and rolls back the whole transaction. `SET CONSTRAINTS` cannot be used inside a trigger.

---

## ALTER ASSERTION

Only enablement and validation can be changed. The check expression, name, and deferrability cannot be altered.

```sql
ALTER ASSERTION [ IF EXISTS ] [schema.]assertion_name
  { ENABLE | DISABLE } [ VALIDATE | NOVALIDATE ]
| { VALIDATE | NOVALIDATE };
```

State transitions:

- `DISABLE` to `ENABLE` defaults to `VALIDATE` and can require a full scan.
- `ENABLE` to `DISABLE` defaults to `NOVALIDATE`.
- `VALIDATE` or `NOVALIDATE` alone leaves the enable/disable status unchanged.
- `NOVALIDATE` to `VALIDATE` scans all involved tables. Moving from `ENABLE NOVALIDATE` to `ENABLE VALIDATE` does not block reads, writes, or other DDL, and can run in parallel.
- `VALIDATE` to `NOVALIDATE` discards the recorded validation state.
- `DISABLE VALIDATE` is not supported.
- Changing the Boolean expression or the name requires drop and recreate.

```sql
ALTER ASSERTION IF EXISTS company_must_have_a_president DISABLE;
ALTER ASSERTION hr.staff_earn_less_than_manager ENABLE NOVALIDATE;
ALTER ASSERTION hr.staff_earn_less_than_manager VALIDATE;
```

---

## DROP ASSERTION

```sql
DROP ASSERTION [ IF EXISTS ] [schema.]assertion_name;
```

`IF EXISTS` makes the statement a no-op when the assertion is absent. `IF NOT EXISTS` is not allowed on `ALTER` or `DROP`.

---

## Agent-Safe Authoring Workflow

1. Verify the database version with `SELECT banner_full FROM v$version`; require 26ai RU 23.26.1 or later.
2. Check the shared constraint/assertion namespace:

```sql
SELECT constraint_name FROM user_constraints
UNION ALL
SELECT assertion_name FROM user_assertions;
```

3. Draft and run a standalone query that returns the violating rows before creating the assertion.
4. On large or dirty data, consider `ENABLE NOVALIDATE`, then `VALIDATE` during an appropriate maintenance window.
5. Use `IF NOT EXISTS` and `IF EXISTS` only where idempotent migration behavior is intended.
6. After creation, query `USER_ASSERTIONS` and `USER_ASSERTION_DEPENDENCIES`.
7. Assertions are supported only at the default `READ COMMITTED` isolation level; assertion validation is not supported under `SERIALIZABLE`.

---

## Dictionary Views

```sql
SELECT assertion_name, status, deferrable, deferred, validated
  FROM user_assertions;

SELECT assertion_name, definition_sql
  FROM user_assertions;

SELECT assertion_name,
       referenced_owner,
       referenced_name,
       referenced_type,
       validation_type,
       validation_event
  FROM user_assertion_dependencies;
```

Assertion views include `USER_ASSERTIONS`, `ALL_ASSERTIONS`, `DBA_ASSERTIONS`, and their CDB equivalents, plus the `*_ASSERTION_DEPENDENCIES` and `*_ASSERTION_LOCK_MATRIX` families. `DEFINITION_SQL` holds the normalized statement with the owner-qualified name (for example `CREATE ASSERTION "HR"."NO_EMPTY_DEPARTMENTS" CHECK ...`), not the exact submitted text. `ALL_ASSERTIONS.DEFINITION_SQL` is null when the assertion belongs to another schema and is visible only through a privilege on one of its tables. `USER_ASSERTION_LOCK_MATRIX` describes enqueue behavior during concurrent DML.

### Extracting Assertion DDL

`DBA_ASSERTIONS.DEFINITION_SQL` (or `USER_ASSERTIONS` / `ALL_ASSERTIONS`) is the only reliable source of an assertion's DDL. The `DBMS_METADATA` documentation lists `ASSERTION` as a supported object type and shows a `GET_DDL('ASSERTION', ...)` example, but on 23.26.1 and 23.26.3, `DBMS_METADATA.GET_DDL`, `GET_XML`, and `GET_SXML` reject `'ASSERTION'` as the object type with `ORA-31600` (Bug 40080026, "DBMS_METADATA.GET_DDL FAILED WITH ORA-31600 FOR OBJECT TYPE ASSERTION IN 26AI"; the bug is internal and viewable by Oracle employees only), and the SQLcl `DDL` command returns nothing for an assertion. Export and compare tools that depend on `DBMS_METADATA` therefore omit assertions; script them from `DEFINITION_SQL` instead.

```sql
SELECT definition_sql
  FROM user_assertions
 WHERE assertion_name = 'NO_EMPTY_DEPARTMENTS';
```

SQLcl `FORMAT` in 26.1.2 skips files containing `ALL ... SATISFY` or the `DEFINITION_SQL` statement shape with a parse error; SQLcl 26.2.2 formats both. Reformatting changes the text stored in source control but not the assertion's semantics.

---

## Errors

| Code | Meaning |
| --- | --- |
| `ORA-08601` | SQL assertion violated |
| `ORA-02091` | Transaction rolled back; precedes `ORA-08601` when a deferred assertion fails at commit |
| `ORA-08701` | Attempt to set an assertion to `DISABLE VALIDATE` |
| `ORA-00955` | `CREATE ASSERTION` name already used by an existing object |
| `ORA-08721` | Constraint name already used by an existing SQL assertion |
| `ORA-00901` | `CREATE ASSERTION` used on a release that does not implement it |
| `ORA-08689` | `CREATE ASSERTION` failed; the next error line gives the reason |
| `ORA-08677` | Unsupported SQL function, for example `SYSDATE` (follows `ORA-08689`) |
| `ORA-08673` | An equijoin does not meet the criteria for fast validation, typically a nullable join column without `IS NOT NULL` (follows `ORA-08689`) |
| `ORA-08712` | Query block nesting limit exceeded (follows `ORA-08689`) |
| `ORA-08726` | Number of columns per table limit exceeded, maximum 32 (follows `ORA-08689`) |
| `ORA-08727` | Assertion definition is too large (maximum 4096 bytes) |

An immediate assertion violation fails the statement and leaves the rest of the transaction intact. A deferred assertion violation fails `COMMIT` with `ORA-02091` followed by `ORA-08601`, and the whole transaction is rolled back. DDL statements commit implicitly, so DDL issued in a transaction with pending deferred violations fails the same way.

---

## Unsupported Constructs

Do not generate assertions that use:

- Views, materialized views, temporary tables, external tables, synonyms, database links, or virtual columns
- `GROUP BY`, `HAVING`, aggregate functions, or analytic functions
- Outer joins, ANSI join syntax, cross joins, `CROSS APPLY`, `OUTER APPLY`, or lateral inline views
- Scalar subqueries, hierarchical queries, set operators, or the `WITH` clause
- LOB, BFILE, LONG, JSON, or ADT columns
- Partition extension, `SAMPLE`, row limiting, or `FETCH FIRST`
- PL/SQL or C functions, including deterministic functions that do not access tables
- `PIVOT`, `UNPIVOT`, `MODEL`, `MATCH_RECOGNIZE`, or flashback query
- JSON, XML, or GRAPH tables, or `ONLY` of an object view
- Quantified comparisons (`ANY`, `SOME`, `ALL`) other than the assertion `ALL ... SATISFY` form

Do not use non-deterministic or session-dependent values such as `SYSDATE`, `SYSTIMESTAMP`, `SYS_CONTEXT`, `USERENV`, `USER`, `CURRENT_SCHEMA`, `CURRENT_USER`, or `SESSION_USER`.

Object references must be base tables in the schema or qualified base tables in another schema.

---

## Size and Column Limits

The SQL Language Reference does not state these limits, and the error-help pages for `ORA-08727` and `ORA-08726` show the maximum only as a placeholder. The values below come from the runtime error text ("maximum allowed = 4096 bytes", "maximum allowed = 32") observed on Oracle AI Database 26ai 23.26.1 and 23.26.3, and may change in later release updates. Check a draft against them before running `CREATE ASSERTION`:

- **Definition size: at most 4096 bytes** (`ORA-08727`, raised directly without `ORA-08689`). The limit covers the whole statement text, including whitespace, comments, and literals. `DEFINITION_SQL` is a `CLOB`, so the dictionary column itself does not reveal the limit. Keep a margin, and move long literal lists into a lookup table that the assertion joins to.
- **Column references per table: at most 32** (`ORA-08689` followed by `ORA-08726`). Each comparison against a column counts separately. An `IN` list counts once per value, so `col IN ('A', 'B', ...)` with 40 values exceeds the limit just like 40 `OR col = ...` predicates. For a long value list, use a lookup table instead of literals.

Neither limit is reported until `CREATE ASSERTION` runs, so estimate both while drafting: the byte length of the statement, and the number of column comparisons per table alias.

---

## Best Practices

- **Prefer conventional constraints** for single-row and key rules; reserve assertions for genuinely cross-row or cross-table rules.
- **Write the violation query first.** An assertion is the negation of "there exists a violating row"; a working violation query is both the draft and the diagnostic when `ORA-08601` fires.
- **Name the subquery select list descriptively** (`SELECT 'an empty department'`). The text is ignored for evaluation but makes `DEFINITION_SQL` self-documenting.
- **Make multi-table rules deferrable** when related rows must be inserted in one transaction in an order that temporarily breaks the rule.
- **Use lookup tables instead of long literal lists** to stay within the size and column limits.

---

## Oracle Version Notes (19c vs 26ai)

- `CREATE ASSERTION`, `ALTER ASSERTION`, `DROP ASSERTION`, the `ASSERTION REFERENCES` privilege, and the `*_ASSERTION*` dictionary views require Oracle AI Database 26ai RU 23.26.1 or later.
- On 19c, 21c, or earlier 23ai/26ai release updates, `CREATE ASSERTION` fails (`ORA-00901`). Do not pretend it works; state the version gap explicitly.
- Pre-26ai alternatives: a table `CHECK` for single-row rules, a foreign key for key relationships, or an explicitly designed trigger/package or fast-refresh-on-commit materialized view with a check constraint for cross-table integrity (see `db/features/materialized-views.md`). Trigger-based enforcement must handle concurrency itself, for example by serializing on a parent row lock.

## Sources

- [Oracle AI Database SQL Language Reference: CREATE ASSERTION](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/create-assertion.html)
- [Oracle AI Database SQL Language Reference: ALTER ASSERTION](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/alter-assertion.html)
- [Oracle AI Database SQL Language Reference: DROP ASSERTION](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/drop-assertion.html)
- [Oracle AI Database Development Guide: Maintaining Data Integrity](https://docs.oracle.com/en/database/oracle/oracle-database/26/adfns/data-integrity.html)
- [Oracle AI Database PL/SQL Packages and Types Reference: DBMS_METADATA](https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/DBMS_METADATA.html) (object types table and the `GET_DDL` assertion example)
