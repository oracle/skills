# SQL Best Practices in Oracle

## Overview

This guide keeps to SQL practices that Oracle documents explicitly in the SQL Language Reference, Development Guide, and SQL Tuning Guide. It focuses on nine areas Oracle calls out directly: set-based processing, bind variables, explicit join syntax, deterministic row limiting, explicit null handling, deliberate data type and precision selection, avoiding implicit data type conversion in predicates, deliberate use of virtual columns, and deliberate use of function-based indexes.

Each section also includes a local validation example from a Podman Oracle Free 26ai container started on macOS on March 12, 2026. These validations are empirical checks from one environment, not optimizer guarantees.

---

## Documentation Map

| Practice | Oracle documentation |
|---|---|
| Process work inside the database | Oracle Database 19c Development Guide / Oracle AI Database 26 Development Guide, **Building Effective Applications** -> **Process as Much Data as Possible Inside the Database** |
| Use bind variables for reused SQL | Oracle Database 19c Development Guide / Oracle AI Database 26 Development Guide, **Building Effective Applications** -> **Use Bind Variables** |
| Use explicit join syntax and explicit join conditions | Oracle Database 19c SQL Language Reference / Oracle AI Database 26 SQL Language Reference, **Joins**; Oracle AI Database 26 SQL Language Reference, **SELECT** -> `join_clause` |
| Make row limiting deterministic | Oracle Database 12c Release 1 (12.1) New Features Guide, **Native SQL Support for Query Row Limits and Row Offsets**; Oracle Database 19c SQL Language Reference / Oracle AI Database 26 SQL Language Reference, **SELECT** -> `row_limiting_clause`; Oracle Database 19c SQL Language Reference, **ROWNUM Pseudocolumn** |
| Handle nulls explicitly | Oracle Database 19c SQL Language Reference, **Null Conditions**; Oracle AI Database 26 SQL Language Reference, **Nulls** |
| Choose the most specific data type, length, and precision | Oracle Database 19c Development Guide, **Using SQL Data Types in Database Applications** -> **Use the Most Specific Type Possible**, **Using Character Data Types**; Oracle Database 19c SQL Language Reference / Oracle AI Database 26 SQL Language Reference, **Data Types** |
| Avoid implicit data type conversion in predicates | Oracle Database 19c SQL Language Reference / Oracle AI Database 26 SQL Language Reference, **Data Type Comparison Rules** -> **Implicit and Explicit Data Conversion**, **Implicit Data Type Conversion Rules**, **Implicit Data Conversion Examples**; Oracle Database 19c SQL Tuning Guide / Oracle AI Database 26 SQL Tuning Guide, **Optimizer Access Paths** |
| Use virtual columns when a derived value should behave like a column | Oracle Database 19c SQL Language Reference / Oracle AI Database 26 SQL Language Reference, **CREATE TABLE** -> `virtual_column_definition` |
| Use function-based indexes only when the workload justifies them | Oracle Database 19c SQL Language Reference, **CREATE INDEX** -> **Notes on Function-based Indexes**; Oracle AI Database 26 Development Guide, **Using Indexes in Database Applications** -> **When to Use Function-Based Indexes** |

---

## Process as Much Data as Possible Inside the Database

Oracle's Development Guide recommends doing as much work as possible inside the database and using built-in set-based processing instead of moving large data sets to the client and processing them there. Oracle documents this as a way to avoid network overhead and to take advantage of the database's set-oriented operations.

Use this as the default rule for SQL design:

- Prefer a single SQL statement over many small client round trips.
- Prefer set-based SQL over procedural row-by-row processing when the operation can be expressed that way.
- Keep data-intensive work inside SQL when the database can do it with set-oriented operations.

### Example: Row-by-Row Processing Versus Set-Based Processing

Avoid the row-by-row pattern that Oracle shows for loading an external table into a staging table:

```plsql
declare
  cursor c is select s.* from ext_scan_events s;
  r c%rowtype;
begin
  open c;
  loop
    fetch c into r;
    exit when c%notfound;
    insert into stage1_scan_events d values r;
    commit;
  end loop;
  close c;
end;
```

Documented consequences:

- Oracle says row-by-row processing can take unacceptably long for large data sets.
- Oracle says the application must run serially on a single CPU core and cannot exploit native database parallelism.

Prefer the set-based SQL example from the same Development Guide topic:

```sql
alter session enable parallel dml;
insert /*+ APPEND */ into stage1_scan_events d
  select s.* from ext_scan_events s;
commit;
```

Documented benefits:

- Oracle says a single SQL statement reads and writes all rows.
- Oracle says the application issues a single `COMMIT` after all rows are inserted.
- Oracle says set-based processing on large data sets is often orders of magnitude faster, and runtime can drop from hours to seconds.

### Local Validation Example

The following validation was run locally in schema `APP` on `FREEPDB1`:

```sql
set serveroutput on size unlimited

declare
  l_start_ts timestamp;
  l_diff interval day to second;
  l_row_ms number;
  l_set_ms number;
  l_count number;
begin
  execute immediate 'truncate table bp_stage_events_big';

  l_start_ts := systimestamp;
  for r in (select id, payload from bp_source_events_big order by id) loop
    insert into bp_stage_events_big(id, payload) values (r.id, r.payload);
    commit;
  end loop;
  l_diff := systimestamp - l_start_ts;
  l_row_ms := extract(day from l_diff) * 86400000
           + extract(hour from l_diff) * 3600000
           + extract(minute from l_diff) * 60000
           + extract(second from l_diff) * 1000;
  select count(*) into l_count from bp_stage_events_big;
  dbms_output.put_line('ROW_BY_ROW_MS=' || round(l_row_ms, 2));
  dbms_output.put_line('ROW_BY_ROW_COUNT=' || l_count);

  execute immediate 'truncate table bp_stage_events_big';

  l_start_ts := systimestamp;
  insert into bp_stage_events_big(id, payload)
  select id, payload from bp_source_events_big;
  commit;
  l_diff := systimestamp - l_start_ts;
  l_set_ms := extract(day from l_diff) * 86400000
           + extract(hour from l_diff) * 3600000
           + extract(minute from l_diff) * 60000
           + extract(second from l_diff) * 1000;
  select count(*) into l_count from bp_stage_events_big;
  dbms_output.put_line('SET_BASED_MS=' || round(l_set_ms, 2));
  dbms_output.put_line('SET_BASED_COUNT=' || l_count);
end;
/
```

Output:

```text
ROW_BY_ROW_MS=201.64
ROW_BY_ROW_COUNT=20000
SET_BASED_MS=3.17
SET_BASED_COUNT=20000
```

---

## Use Bind Variables for Reused SQL

Oracle documents bind variables as especially important for SQL statements that are reused, and calls out OLTP systems as the main case where they matter. The same documentation also says the impact is insignificant when SQL is not reused and that bind variables are often undesirable in data warehouse systems because statements are often ad hoc and literal values can help the optimizer choose plans.

Use this rule narrowly:

- Use bind variables for values that change between executions of the same SQL statement.
- Expect the biggest benefit in OLTP workloads where the same statement text is executed repeatedly.
- Do not assume the same guidance applies unchanged to ad hoc data warehouse queries.

### Example: Query Text Concatenation Versus Bind Variables

Avoid Oracle's no-bind loop from Example 8-1:

```plsql
FOR i IN 1 .. 5000 LOOP
  OPEN l_cursor FOR 'SELECT x FROM t WHERE x = ' || TO_CHAR(i);
  CLOSE l_cursor;
END LOOP;
```

Documented consequences:

- Oracle says the query without a bind variable is slower and uses many more latches.
- Oracle notes that the sample cost is shown for a single user and escalates rapidly as more users are added.

Prefer Oracle's equivalent loop with a bind variable:

```plsql
FOR i IN 1 .. 5000 LOOP
  OPEN l_cursor FOR 'SELECT x FROM t WHERE x = :x' USING i;
  CLOSE l_cursor;
END LOOP;
```

Documented benefits:

- Oracle says a statement with bind variable placeholders is hard parsed once and then soft parsed with different bind variables.
- Oracle's sample Runstats output shows the bind-variable run completing much faster than the literal-SQL run.
- Oracle also says using bind variables instead of string literals is the most effective way to make code invulnerable to SQL injection attacks.

### Local Validation Example

The following validation was run locally:

```sql
set serveroutput on size unlimited

declare
  l_start_ts timestamp;
  l_diff interval day to second;
  l_literal_ms number;
  l_bind_ms number;
  l_val number;
begin
  l_start_ts := systimestamp;
  for i in 1 .. 5000 loop
    execute immediate 'select x from bp_t where x = ' || to_char(i)
      into l_val;
  end loop;
  l_diff := systimestamp - l_start_ts;
  l_literal_ms := extract(day from l_diff) * 86400000
                + extract(hour from l_diff) * 3600000
                + extract(minute from l_diff) * 60000
                + extract(second from l_diff) * 1000;

  l_start_ts := systimestamp;
  for i in 1 .. 5000 loop
    execute immediate 'select x from bp_t where x = :x'
      into l_val using i;
  end loop;
  l_diff := systimestamp - l_start_ts;
  l_bind_ms := extract(day from l_diff) * 86400000
             + extract(hour from l_diff) * 3600000
             + extract(minute from l_diff) * 60000
             + extract(second from l_diff) * 1000;
  dbms_output.put_line('LITERAL_SQL_MS=' || round(l_literal_ms, 2));
  dbms_output.put_line('BIND_SQL_MS=' || round(l_bind_ms, 2));
end;
/
```

Output:

```text
LITERAL_SQL_MS=1046.43
BIND_SQL_MS=15.66
```

---

## Write Explicit, Unambiguous Joins

Oracle's SQL Language Reference says that if two tables in a join have any column name in common, then you must qualify all references to those columns throughout the query to avoid ambiguity. The same reference says that if a join condition is omitted, then Oracle returns a Cartesian product. For outer joins, Oracle recommends the `FROM` clause `OUTER JOIN` syntax rather than the Oracle join operator `(+)`.

Oracle also documents that the `join_clause` lets you specify join conditions separate from search or filter conditions in the `WHERE` clause. Keep that separation explicit:

- Put row-matching logic in `JOIN ... ON`.
- Keep search and filter predicates in `WHERE`.
- Qualify shared column names.
- Use `LEFT OUTER JOIN`, `RIGHT OUTER JOIN`, or `FULL OUTER JOIN` instead of `(+)` in new SQL.

### Documented Restrictions on `(+)`

Oracle documents several restrictions on the Oracle join operator `(+)`, including:

- It can appear only in the `WHERE` clause, or in the context of left-correlation inside table collection expressions.
- It can be applied only to a column, not to an arbitrary expression.
- A query block cannot use `FROM` clause join syntax and the `(+)` operator together.

These documented restrictions are one reason Oracle recommends the `FROM` clause `OUTER JOIN` syntax.

### Example: Traditional `(+)` Syntax Versus `LEFT OUTER JOIN`

Avoid Oracle's older outer-join syntax:

```sql
SELECT d.department_id, e.last_name
   FROM departments d, employees e
   WHERE d.department_id = e.department_id(+)
   ORDER BY d.department_id, e.last_name;
```

Documented consequences:

- Oracle strongly recommends the more flexible `FROM` clause join syntax instead.
- Oracle documents additional restrictions on `(+)`, including that you cannot mix it with `FROM` clause join syntax in the same query block.

Prefer Oracle's `LEFT OUTER JOIN` form:

```sql
SELECT d.department_id, e.last_name
   FROM departments d LEFT OUTER JOIN employees e
   ON d.department_id = e.department_id
   ORDER BY d.department_id, e.last_name;
```

Documented benefits:

- Oracle calls this `FROM` clause join syntax more flexible.
- Oracle documents that `ON` lets you keep join conditions separate from search or filter conditions in the `WHERE` clause.

Oracle also warns that if two tables in a join query have no join condition, then Oracle returns their Cartesian product. The join documentation gives the concrete example that two 100-row tables produce 10,000 rows.

### Local Validation Example

The following validation was run locally:

```sql
set serveroutput on size unlimited

declare
  l_cart number;
  l_plus number;
  l_ansi number;
  l_dummy number;
begin
  select count(*) into l_cart from bp_departments d, bp_employees e;
  select count(*) into l_plus
  from (
    select d.department_id, e.last_name
    from bp_departments d, bp_employees e
    where d.department_id = e.department_id(+)
  );
  select count(*) into l_ansi
  from (
    select d.department_id, e.last_name
    from bp_departments d left outer join bp_employees e
      on d.department_id = e.department_id
  );
  dbms_output.put_line('CARTESIAN_COUNT=' || l_cart);
  dbms_output.put_line('PLUS_LEFT_COUNT=' || l_plus);
  dbms_output.put_line('ANSI_LEFT_COUNT=' || l_ansi);

  begin
    execute immediate q'[select count(*) from bp_departments d join bp_employees e on d.department_id = e.department_id where d.department_id = e.department_id(+)]'
      into l_dummy;
  exception
    when others then
      dbms_output.put_line('MIXED_JOIN_ERROR=' || sqlcode);
  end;
end;
/
```

Output:

```text
CARTESIAN_COUNT=20
PLUS_LEFT_COUNT=5
ANSI_LEFT_COUNT=5
MIXED_JOIN_ERROR=-25156
```

---

## Prefer FETCH FIRST for Row Limiting

Oracle Database 12c Release 1 (12.1) introduced native SQL support for query row limits and row offsets through the `FETCH FIRST` and `OFFSET` clauses. Oracle's 19c `ROWNUM` documentation also says that the `row_limiting_clause` of the `SELECT` statement provides superior support for limiting the number of rows returned by a query.

Oracle's `SELECT` documentation for 19c and 26ai adds one more important point: for consistent results, specify the `order_by_clause` when you use the `row_limiting_clause`.

```sql
SELECT employee_id, last_name
  FROM employees
  ORDER BY employee_id
  FETCH FIRST 5 ROWS ONLY;
```

```sql
SELECT employee_id, last_name
  FROM employees
  ORDER BY employee_id
  OFFSET 5 ROWS FETCH NEXT 5 ROWS ONLY;
```

Use this as the primary row-limiting pattern:

- If row order matters, specify `ORDER BY`.
- Use `FETCH FIRST ... ROWS ONLY` for top-N queries.
- Use `OFFSET ... FETCH NEXT ... ROWS ONLY` for paging through ordered results.

### Legacy `ROWNUM` Pattern

Oracle still documents `ROWNUM`, but the same 19c page says the `row_limiting_clause` provides superior support for limiting rows. Keep `ROWNUM` mainly for existing SQL that already uses it, or when you specifically need the pseudocolumn behavior Oracle documents.

If you must use `ROWNUM`, Oracle shows this pattern to apply ordering first:

```sql
SELECT *
  FROM (SELECT * FROM employees ORDER BY employee_id)
  WHERE ROWNUM < 11;
```

### Documented Limitations

Oracle documents these row-limiting caveats:

- `ROWNUM > 1` is always false.
- `FOR UPDATE` cannot be used with the `row_limiting_clause`.
- Materialized views are not eligible for incremental refresh if the defining query contains the `row_limiting_clause`.
- If the select list contains identically named columns and you specify the `row_limiting_clause`, Oracle returns `ORA-00918`.

### Example: `ROWNUM` with `ORDER BY` Versus `FETCH FIRST`

Avoid the `ROWNUM` pattern that Oracle shows before the rows are ordered:

```sql
SELECT *
  FROM employees
  WHERE ROWNUM < 11
  ORDER BY last_name;
```

Documented consequence:

- Oracle says the rows can vary depending on the way Oracle chooses to access the data.

Prefer the `row_limiting_clause` example Oracle documents for top-N reporting:

```sql
SELECT employee_id, last_name
  FROM employees
  ORDER BY employee_id
  FETCH FIRST 5 ROWS ONLY;
```

Oracle also documents this paging form:

```sql
SELECT employee_id, last_name
  FROM employees
  ORDER BY employee_id
  OFFSET 5 ROWS FETCH NEXT 5 ROWS ONLY;
```

Documented benefits:

- Oracle introduced `FETCH FIRST` and `OFFSET` as native SQL support for query row limits and row offsets.
- Oracle says the `row_limiting_clause` provides superior support for limiting rows.
- Oracle says to specify `ORDER BY` for consistent, deterministic results.

### Local Validation Example

The following validation was run locally:

```sql
set serveroutput on size unlimited

declare
  l_bad varchar2(4000);
  l_good varchar2(4000);
begin
  select listagg(last_name, ',') within group (order by last_name)
    into l_bad
  from (
    select last_name
    from bp_rowlimit
    where rownum < 6
    order by last_name
  );

  select listagg(last_name, ',') within group (order by last_name)
    into l_good
  from (
    select last_name
    from bp_rowlimit
    order by last_name
    fetch first 5 rows only
  );

  dbms_output.put_line('ROWNUM_LIST=' || l_bad);
  dbms_output.put_line('FETCH_FIRST_LIST=' || l_good);
end;
/
```

Output:

```text
ROWNUM_LIST=Victor,Whiskey,Xray,Yankee,Zulu
FETCH_FIRST_LIST=Alpha,Bravo,Charlie,Delta,Echo
```

---

## Handle NULLs Explicitly

Oracle documents null handling in two places that matter here. The SQL Language Reference says to use `IS NULL` to test for nulls and `IS NOT NULL` to test for values that are not null. It also states that Oracle currently treats a character value with zero length as null, but this may not continue to be true in future releases.

```sql
SELECT last_name
  FROM employees
  WHERE commission_pct
  IS NULL
  ORDER BY last_name;
```

Use this guidance as written:

- Test nulls with `IS NULL` and `IS NOT NULL`.
- Do not assume the current empty-string behavior will remain unchanged in future releases.

### Example: `a = NULL` Versus `IS NULL`

Avoid the documented condition:

```sql
a = NULL
```

Documented consequence:

- Oracle says this condition evaluates to `UNKNOWN`.
- Oracle says that if an `UNKNOWN` condition is used in a `WHERE` clause of a `SELECT` statement, then no rows are returned.

Prefer Oracle's null-test example:

```sql
SELECT last_name
  FROM employees
  WHERE commission_pct
  IS NULL
  ORDER BY last_name;
```

Documented benefit:

- Oracle says to test for nulls only with `IS NULL` and `IS NOT NULL`.

### Local Validation Example

The following validation was run locally:

```sql
set serveroutput on size unlimited

declare
  l_eq_null number;
  l_is_null number;
begin
  select count(*) into l_eq_null from bp_employees where commission_pct = null;
  select count(*) into l_is_null from bp_employees where commission_pct is null;
  dbms_output.put_line('EQUAL_NULL_COUNT=' || l_eq_null);
  dbms_output.put_line('IS_NULL_COUNT=' || l_is_null);
end;
/
```

Output:

```text
EQUAL_NULL_COUNT=0
IS_NULL_COUNT=3
```

---

## Choose the Most Specific Data Type, Length, and Precision

Oracle's Development Guide says to use the most specific type possible, including the most specific length or precision. Oracle gives concrete examples such as `NUMBER(38)` instead of `NUMBER`, `CHAR(16)` instead of `CHAR(2000)`, and `VARCHAR2(30)` instead of `VARCHAR2(4000)`.

Apply that guidance directly when you design tables and query interfaces:

- Use `VARCHAR2` for variable-length character data. Oracle says `VARCHAR2` values are not blank padded, are more space efficient than `CHAR`, and usually perform better.
- Use `CHAR` when ANSI compatibility is important and when trailing blanks are unimportant. Oracle says `VARCHAR2` is more space efficient and usually performs better.
- Use `NCHAR`, `NVARCHAR2`, and `NCLOB` only when you need national-character-set storage. Oracle says that if the database character set is Unicode, then define Unicode data with `CHAR`, `VARCHAR2`, and `CLOB` instead.
- Use `NUMBER(p)` for exact integer-style values and `NUMBER(p,s)` for exact fixed-point values. Oracle says a declared precision and scale add integrity checking, round excess scale, and reject values whose precision is too large.
- Remember that `NUMBER` without precision and scale means Oracle's maximum range and precision for that data type.
- Use `DATE` when second precision is enough and time zone information is not needed. Oracle documents that `DATE` stores hour, minute, and second, but not fractional seconds or time zone.
- Use `TIMESTAMP` when fractional seconds matter, `TIMESTAMP WITH TIME ZONE` when the stored time zone or UTC offset matters, and `TIMESTAMP WITH LOCAL TIME ZONE` when values should be normalized to the database time zone and displayed in the session's local time zone.
- Use `INTERVAL YEAR TO MONTH` for year-and-month intervals and `INTERVAL DAY TO SECOND` for day-hour-minute-second intervals.
- Do not create new tables with `LONG` or `LONG RAW`. Oracle documents those types only for backward compatibility and says to use `LOB` data types instead.
- For approximate numeric values, Oracle says `BINARY_FLOAT` and `BINARY_DOUBLE` are better choices than `FLOAT` for most applications.

### Example: Generic Column Definitions Versus Specific Column Definitions

Avoid a generic design like this:

```sql
CREATE TABLE invoice_events_bad (
  status_code CHAR(30),
  amount NUMBER,
  event_time DATE,
  details LONG
);
```

Documented consequences:

- Oracle says `VARCHAR2` is more space efficient than `CHAR` and usually performs better.
- Oracle's Development Guide uses bare `NUMBER` and oversized character definitions as examples of definitions that are less specific than they need to be.
- Oracle documents that `DATE` has no fractional seconds and no time zone.
- Oracle says do not create tables with `LONG` or `LONG RAW`.

Prefer a definition that matches the actual data:

```sql
CREATE TABLE invoice_events_good (
  status_code VARCHAR2(30),
  amount NUMBER(12,2),
  event_time TIMESTAMP(3) WITH TIME ZONE,
  details CLOB
);
```

Documented benefits:

- This follows Oracle's guidance to use the most specific type, length, and precision.
- `VARCHAR2` avoids blank-padding behavior that Oracle documents for `CHAR`.
- `NUMBER(12,2)` adds the integrity checking Oracle documents for declared precision and scale.
- `TIMESTAMP(3) WITH TIME ZONE` preserves fractional seconds and time zone information that `DATE` does not store.
- `CLOB` uses the LOB family Oracle documents as the replacement for `LONG`.

### Local Validation Example

The following validation was run locally:

```sql
set serveroutput on size unlimited

begin
  execute immediate 'drop table bp_datatypes purge';
exception
  when others then
    if sqlcode != -942 then
      raise;
    end if;
end;
/

create table bp_datatypes (
  status_char      char(4),
  status_varchar   varchar2(4),
  amount_generic   number,
  amount_fixed     number(6,2),
  event_date       date,
  event_ts_tz      timestamp(3) with time zone,
  notes_clob       clob
)
/

declare
  l_char_len number;
  l_varchar_len number;
  l_amount_generic varchar2(40);
  l_amount_fixed varchar2(40);
  l_event_date varchar2(40);
  l_event_ts varchar2(60);
  l_generic_precision varchar2(20);
  l_generic_scale varchar2(20);
  l_fixed_precision varchar2(20);
  l_fixed_scale varchar2(20);
  l_notes_type varchar2(30);
begin
  insert into bp_datatypes(
    status_char,
    status_varchar,
    amount_generic,
    amount_fixed,
    event_date,
    event_ts_tz,
    notes_clob
  )
  values (
    'OK',
    'OK',
    123.456,
    123.456,
    to_date('2026-03-12 10:15:30', 'YYYY-MM-DD HH24:MI:SS'),
    to_timestamp_tz('2026-03-12 10:15:30.123 -08:00', 'YYYY-MM-DD HH24:MI:SS.FF3 TZH:TZM'),
    'validated'
  );
  commit;

  select length(status_char),
         length(status_varchar),
         to_char(amount_generic),
         to_char(amount_fixed, 'FM9990D00'),
         to_char(event_date, 'YYYY-MM-DD HH24:MI:SS'),
         to_char(event_ts_tz, 'YYYY-MM-DD HH24:MI:SS.FF3 TZH:TZM')
    into l_char_len,
         l_varchar_len,
         l_amount_generic,
         l_amount_fixed,
         l_event_date,
         l_event_ts
    from bp_datatypes;

  select nvl(to_char(data_precision), 'NULL'),
         nvl(to_char(data_scale), 'NULL')
    into l_generic_precision,
         l_generic_scale
    from user_tab_columns
   where table_name = 'BP_DATATYPES'
     and column_name = 'AMOUNT_GENERIC';

  select nvl(to_char(data_precision), 'NULL'),
         nvl(to_char(data_scale), 'NULL')
    into l_fixed_precision,
         l_fixed_scale
    from user_tab_columns
   where table_name = 'BP_DATATYPES'
     and column_name = 'AMOUNT_FIXED';

  select data_type
    into l_notes_type
    from user_tab_columns
   where table_name = 'BP_DATATYPES'
     and column_name = 'NOTES_CLOB';

  dbms_output.put_line('CHAR_LENGTH=' || l_char_len);
  dbms_output.put_line('VARCHAR2_LENGTH=' || l_varchar_len);
  dbms_output.put_line('NUMBER_VALUE=' || l_amount_generic);
  dbms_output.put_line('NUMBER_6_2_VALUE=' || l_amount_fixed);
  dbms_output.put_line('DATE_VALUE=' || l_event_date);
  dbms_output.put_line('TIMESTAMP_TZ_VALUE=' || l_event_ts);
  dbms_output.put_line('NUMBER_PRECISION=' || l_generic_precision);
  dbms_output.put_line('NUMBER_SCALE=' || l_generic_scale);
  dbms_output.put_line('NUMBER_6_2_PRECISION=' || l_fixed_precision);
  dbms_output.put_line('NUMBER_6_2_SCALE=' || l_fixed_scale);
  dbms_output.put_line('NOTES_TYPE=' || l_notes_type);

  begin
    update bp_datatypes set amount_fixed = 12345.67;
    commit;
  exception
    when others then
      dbms_output.put_line('PRECISION_ERROR=' || sqlcode);
      rollback;
  end;
end;
/
```

Output:

```text
CHAR_LENGTH=4
VARCHAR2_LENGTH=2
NUMBER_VALUE=123.456
NUMBER_6_2_VALUE=123.46
DATE_VALUE=2026-03-12 10:15:30
TIMESTAMP_TZ_VALUE=2026-03-12 10:15:30.123 -08:00
NUMBER_PRECISION=NULL
NUMBER_SCALE=NULL
NUMBER_6_2_PRECISION=6
NUMBER_6_2_SCALE=2
NOTES_TYPE=CLOB
PRECISION_ERROR=-1438
```

---

## Avoid Implicit Data Type Conversion in Predicates

Oracle's SQL Language Reference recommends explicit conversions rather than implicit conversions. The documented reasons include better SQL statement readability, less dependence on context, less vulnerability to changes in conversion algorithms and defaults, and better performance. Oracle also states that if implicit data type conversion occurs in an index expression, then Oracle Database might not use the index because the index is defined for the pre-conversion data type.

Oracle documents the conversion direction for common mixed-type comparisons. In the following examples, Oracle says it converts the string literal to `NUMBER` in the first query and to `DATE` in the second query:

```sql
SELECT last_name
  FROM employees
  WHERE employee_id = '200';
```

```sql
SELECT last_name
  FROM employees 
  WHERE hire_date = '24-JUN-06';
```

Oracle's SQL Tuning Guide gives a concrete index-related example with the predicate `WHERE char_col=1`. Oracle says that unless the index is a function-based index, the database indexes the values of the column, not the values of the column with the function applied, and this prevents use of the index.

Use this guidance:

- Compare values using matching data types instead of relying on implicit conversion.
- Be especially careful with predicates on indexed columns.
- If the workload requires a function or expression in the predicate, Oracle documents function-based indexes as the relevant index type.

### Example: Implicit Predicate Conversion Versus Explicit Conversion Functions

Avoid Oracle's documented implicit-conversion examples:

```sql
SELECT last_name
  FROM employees
  WHERE employee_id = '200';
```

```sql
SELECT last_name
  FROM employees 
  WHERE hire_date = '24-JUN-06';
```

Documented consequences:

- Oracle says the first statement implicitly converts `'200'` to `200`.
- Oracle says the second statement implicitly converts `'24-JUN-06'` to a `DATE` using the default date format.
- Oracle recommends explicit conversions because they are easier to understand, more predictable across releases and products, and can avoid negative performance effects.
- Oracle also says that if implicit conversion occurs in an index expression, then Oracle Database might not use the index.
- Oracle's SQL Tuning Guide gives `WHERE char_col=1` as a typical application mistake that prevents use of a normal index unless the index is function-based.

Prefer explicit conversion functions. Oracle documents examples such as:

```sql
SELECT TO_DATE(
    'January 15, 1989, 11:00 A.M.',
    'Month dd, YYYY, HH:MI A.M.',
    'NLS_DATE_LANGUAGE = American')
     FROM DUAL;
```

```sql
UPDATE employees SET salary = salary + 
   TO_NUMBER('100.00', '9G999D99')
   WHERE last_name = 'Perkins';
```

Documented benefits:

- Oracle says explicit conversion functions make SQL statements easier to understand.
- Oracle says explicit conversion behavior is more predictable than implicit conversion behavior.

### Local Validation Example

The following validation was run locally:

```sql
set serveroutput on size unlimited

declare
  l_op varchar2(200);
  l_access varchar2(4000);
  l_filter varchar2(4000);
begin
  delete from plan_table where statement_id in ('CHAR_STR_OUT', 'CHAR_NUM_OUT');

  execute immediate q'[explain plan set statement_id = 'CHAR_STR_OUT' for select * from bp_char_idx where char_col = '42']';
  select trim(operation || ' ' || options || ' ' || object_name),
         nvl(access_predicates, '<null>'),
         nvl(filter_predicates, '<null>')
    into l_op, l_access, l_filter
    from plan_table
   where statement_id = 'CHAR_STR_OUT'
     and id = 1;
  dbms_output.put_line('CHAR_STR_OP=' || l_op);
  dbms_output.put_line('CHAR_STR_ACCESS=' || l_access);
  dbms_output.put_line('CHAR_STR_FILTER=' || l_filter);

  execute immediate q'[explain plan set statement_id = 'CHAR_NUM_OUT' for select * from bp_char_idx where char_col = 42]';
  select trim(operation || ' ' || options || ' ' || object_name),
         nvl(access_predicates, '<null>'),
         nvl(filter_predicates, '<null>')
    into l_op, l_access, l_filter
    from plan_table
   where statement_id = 'CHAR_NUM_OUT'
     and id = 1;
  dbms_output.put_line('CHAR_NUM_OP=' || l_op);
  dbms_output.put_line('CHAR_NUM_ACCESS=' || l_access);
  dbms_output.put_line('CHAR_NUM_FILTER=' || l_filter);
end;
/
```

Output:

```text
CHAR_STR_OP=INDEX RANGE SCAN BP_CHAR_IDX_I
CHAR_STR_ACCESS="CHAR_COL"='42'
CHAR_STR_FILTER=<null>
CHAR_NUM_OP=TABLE ACCESS FULL BP_CHAR_IDX
CHAR_NUM_ACCESS=<null>
CHAR_NUM_FILTER=TO_NUMBER("CHAR_COL")=42
```

---

## Use Virtual Columns for Derived Values That Should Behave Like Columns

Oracle's SQL Language Reference says a virtual column is not stored on disk and its value is derived on demand from the defining expression. Oracle also says virtual columns can be used in queries, DML, and DDL statements, can be indexed, and can have statistics collected on them.

Use this guidance when a derived value should be exposed at table level:

- Use a virtual column when the derived value should be referenced as a column in SQL, not only as an ad hoc expression in one query.
- Specify a data type and precision on the virtual column when you need the derived column's type to be explicit. Oracle says the data type is optional and, if omitted, Oracle determines it from the expression result.
- Keep the virtual-column expression scalar and based on columns in the same table. Oracle says the expression can refer only to columns in the same table and the result must be a scalar value.
- Do not try to update a virtual column directly. Oracle documents that you cannot directly update a virtual column.
- Do not define a virtual column as a `LOB`, `LONG RAW`, or user-defined type. Oracle documents those as unsupported virtual-column data types.

### Documented Limitations

Oracle documents these virtual-column restrictions:

- The expression cannot refer to another virtual column by name.
- The expression cannot use a PL/SQL function that is not declared `DETERMINISTIC`.
- If the expression uses a deterministic user-defined function, then the virtual column cannot be used as a partitioning key.
- If the virtual column expression refers to a deterministic user-defined function and that function is replaced, then Oracle does not automatically update dependent statistics.

### Example: Query Expression Versus a Virtual Column

If you only write the derived expression inline, it remains just an expression in that statement:

```sql
SELECT qty * unit_price AS line_total
  FROM sales_lines
  WHERE qty * unit_price >= 40;
```

Prefer a virtual column when the derived value should behave like a column in the table definition:

```sql
CREATE TABLE sales_lines (
  qty NUMBER(6),
  unit_price NUMBER(8,2),
  line_total NUMBER(10,2) GENERATED ALWAYS AS (qty * unit_price) VIRTUAL
);
```

Documented benefits:

- Oracle says the virtual-column value is derived on demand and not stored on disk.
- Oracle says the virtual column can be used in queries, DML, and DDL statements.
- Oracle says the virtual column can be indexed and can have statistics collected on it.
- Oracle says the virtual column data type can be declared explicitly or derived from the expression.

### Local Validation Example

The following validation was run locally:

```sql
set serveroutput on size unlimited

begin
  execute immediate 'drop index bp_virtual_sales_ix';
exception
  when others then
    if sqlcode != -1418 and sqlcode != -942 then
      raise;
    end if;
end;
/

begin
  execute immediate 'drop table bp_virtual_sales purge';
exception
  when others then
    if sqlcode != -942 then
      raise;
    end if;
end;
/

create table bp_virtual_sales (
  qty number(6),
  unit_price number(8,2),
  line_total number(10,2) generated always as (qty * unit_price) virtual
)
/

declare
  l_virtual_flag varchar2(3);
  l_initial_total varchar2(20);
  l_updated_total varchar2(20);
  l_rows number;
  l_idx_col varchar2(30);
begin
  insert into bp_virtual_sales(qty, unit_price) values (2, 12.50);
  insert into bp_virtual_sales(qty, unit_price) values (3, 16.50);
  commit;

  select virtual_column
    into l_virtual_flag
    from user_tab_cols
   where table_name = 'BP_VIRTUAL_SALES'
     and column_name = 'LINE_TOTAL';

  select to_char(line_total, 'FM9990D00')
    into l_initial_total
    from bp_virtual_sales
   where qty = 2
     and unit_price = 12.50;

  update bp_virtual_sales
     set qty = 4
   where qty = 2
     and unit_price = 12.50;
  commit;

  select to_char(line_total, 'FM9990D00')
    into l_updated_total
    from bp_virtual_sales
   where qty = 4
     and unit_price = 12.50;

  select count(*)
    into l_rows
    from bp_virtual_sales
   where line_total >= 40;

  execute immediate 'create index bp_virtual_sales_ix on bp_virtual_sales(line_total)';

  select column_name
    into l_idx_col
    from user_ind_columns
   where index_name = 'BP_VIRTUAL_SALES_IX'
     and table_name = 'BP_VIRTUAL_SALES';

  dbms_output.put_line('VIRTUAL_COLUMN=' || l_virtual_flag);
  dbms_output.put_line('INITIAL_TOTAL=' || l_initial_total);
  dbms_output.put_line('UPDATED_TOTAL=' || l_updated_total);
  dbms_output.put_line('ROWS_GE_40=' || l_rows);
  dbms_output.put_line('INDEX_COLUMN=' || l_idx_col);

  begin
    execute immediate 'update bp_virtual_sales set line_total = 99';
  exception
    when others then
      dbms_output.put_line('UPDATE_ERROR=' || sqlcode);
      rollback;
  end;
end;
/
```

Output:

```text
VIRTUAL_COLUMN=YES
INITIAL_TOTAL=25.00
UPDATED_TOTAL=50.00
ROWS_GE_40=2
INDEX_COLUMN=LINE_TOTAL
UPDATE_ERROR=-54017
```

---

## Use Function-Based Indexes Deliberately

Oracle documents function-based indexes as a way to speed queries that evaluate a function or expression in a predicate or in the `ORDER BY` clause. Oracle's 26ai Development Guide says they are appropriate when the function is expensive to compute or when many queries must evaluate the same expression. The same section says not to use them when the expression is not queried often enough to justify the extra work, or when the overhead of maintaining the index during `INSERT` and `UPDATE` operations outweighs the query benefit.

Oracle's 19c SQL Language Reference adds several operational requirements and limitations:

- After creating a function-based index, gather statistics on both the index and its base table before the cost-based optimizer can use it.
- Oracle Database does not use the index unless the query filters out nulls.
- If the index expression causes internal character conversion, changing session-level NLS settings other than `NLS_SORT` and `NLS_COMP` can make queries return incorrect results.
- If a user-defined function in the index becomes invalid or is dropped, then Oracle marks the index `DISABLED`.

```sql
CREATE INDEX upper_ix ON employees (UPPER(last_name));

SELECT first_name, last_name 
   FROM employees WHERE UPPER(last_name) IS NOT NULL
   ORDER BY UPPER(last_name);
```

Use them when the workload matches the documented use case, and verify the operational prerequisites before expecting the optimizer to use them.

### Example: Expression Predicate Without the Right Query Shape Versus a Usable Function-Based Index

Oracle's function-based index example starts by creating the index:

```sql
CREATE INDEX upper_ix ON employees (UPPER(last_name));
```

Avoid assuming Oracle will always use the index after it is created. Oracle explicitly says that without the `WHERE` clause in the next query, Oracle Database may perform a full table scan.

Prefer Oracle's query that filters out nulls:

```sql
SELECT first_name, last_name 
   FROM employees WHERE UPPER(last_name) IS NOT NULL
   ORDER BY UPPER(last_name);
```

Documented benefits:

- Oracle says this statement will use the index unless some other condition prevents the optimizer from doing so.
- Oracle says filtering out nulls increases the likelihood that Oracle Database will use the function-based index rather than performing a full table scan.

### Local Validation Example

The first local attempt to reproduce Oracle's `IS NOT NULL` example still chose a full table scan on this instance, so the clearer local validation used an equality predicate:

```sql
set serveroutput on size unlimited

declare
  l_op varchar2(200);
  l_access varchar2(4000);
  l_filter varchar2(4000);
begin
  begin execute immediate 'drop index bp_fb_search_upper_ix'; exception when others then null; end;
  begin execute immediate 'drop index bp_fb_norm_ix'; exception when others then null; end;

  execute immediate 'create index bp_fb_norm_ix on bp_fb_search(last_name)';
  dbms_stats.gather_table_stats(user, 'BP_FB_SEARCH', cascade => true);
  delete from plan_table where statement_id in ('FB_EQ_NORM_OUT', 'FB_EQ_FUNC_OUT');
  execute immediate q'[explain plan set statement_id = 'FB_EQ_NORM_OUT' for select first_name, last_name from bp_fb_search where upper(last_name) = 'JOHNSON']';
  select trim(operation || ' ' || options || ' ' || object_name),
         nvl(access_predicates, '<null>'),
         nvl(filter_predicates, '<null>')
    into l_op, l_access, l_filter
    from plan_table
   where statement_id = 'FB_EQ_NORM_OUT'
     and operation = 'TABLE ACCESS'
     and options = 'FULL';
  dbms_output.put_line('FB_EQ_NORM_OP=' || l_op);
  dbms_output.put_line('FB_EQ_NORM_ACCESS=' || l_access);
  dbms_output.put_line('FB_EQ_NORM_FILTER=' || l_filter);

  execute immediate 'drop index bp_fb_norm_ix';
  execute immediate 'create index bp_fb_search_upper_ix on bp_fb_search(upper(last_name))';
  dbms_stats.gather_table_stats(user, 'BP_FB_SEARCH', cascade => true);
  execute immediate q'[explain plan set statement_id = 'FB_EQ_FUNC_OUT' for select first_name, last_name from bp_fb_search where upper(last_name) = 'JOHNSON']';
  select trim(operation || ' ' || options || ' ' || object_name),
         nvl(access_predicates, '<null>'),
         nvl(filter_predicates, '<null>')
    into l_op, l_access, l_filter
    from plan_table
   where statement_id = 'FB_EQ_FUNC_OUT'
     and operation = 'INDEX'
     and options = 'RANGE SCAN';
  dbms_output.put_line('FB_EQ_FUNC_OP=' || l_op);
  dbms_output.put_line('FB_EQ_FUNC_ACCESS=' || l_access);
  dbms_output.put_line('FB_EQ_FUNC_FILTER=' || l_filter);
end;
/
```

Output:

```text
FB_EQ_NORM_OP=TABLE ACCESS FULL BP_FB_SEARCH
FB_EQ_NORM_ACCESS=<null>
FB_EQ_NORM_FILTER=UPPER("LAST_NAME")='JOHNSON'
FB_EQ_FUNC_OP=INDEX RANGE SCAN BP_FB_SEARCH_UPPER_IX
FB_EQ_FUNC_ACCESS=UPPER("LAST_NAME")='JOHNSON'
FB_EQ_FUNC_FILTER=<null>
```

---

## Best Practices Summary

- Process data inside the database and prefer set-based SQL.
- Use bind variables for reused SQL, especially in OLTP workloads.
- Write explicit joins, include join conditions, and qualify shared column names.
- Use `JOIN ... ON` and keep filtering logic separate in `WHERE`.
- Use `ORDER BY` when row order matters and prefer `FETCH FIRST` or `OFFSET ... FETCH` for row limiting.
- Test nulls with `IS NULL` and `IS NOT NULL`.
- Choose the most specific data type, length, and precision that matches the data you store.
- Avoid implicit data type conversion in predicates, especially on indexed columns.
- Use a virtual column when a derived value should behave like a named column in SQL.
- Use function-based indexes only when the same expression is queried often enough to justify the maintenance cost.

---

## Common Mistakes

| Mistake | Documented consequence or limitation |
|---|---|
| Omitting a join condition | Oracle returns a Cartesian product. |
| Using `(+)` in new SQL or mixing it with `FROM` clause join syntax in the same query block | Oracle documents additional restrictions on `(+)`, and it cannot be mixed with `FROM` clause join syntax in one query block. |
| Using `ROWNUM > 1` as a filter | Oracle documents that this condition is always false. |
| Using `ROWNUM` as the primary top-N pattern when `FETCH FIRST` or `OFFSET ... FETCH` is available | Oracle documents that the `row_limiting_clause` provides superior support for limiting rows. |
| Applying `ORDER BY` in the same query block as `ROWNUM` and expecting ordered top-N results | Oracle documents that the rows can vary depending on the way Oracle chooses to access the data. |
| Using the `row_limiting_clause` without `ORDER BY` when result order matters | Oracle says to specify the `order_by_clause` for consistent results. |
| Using `CHAR` for ordinary variable-length text | Oracle says `VARCHAR2` is more space efficient and usually performs better than `CHAR`. |
| Using bare `NUMBER`, `DATE`, or `LONG` when the business data needs fixed precision, time zone retention, or large-object storage | Oracle says use the most specific type and precision, documents that `DATE` does not store fractional seconds or time zone, and says not to create tables with `LONG` or `LONG RAW`. |
| Comparing indexed character columns to numeric or date literals and relying on implicit conversion | Oracle warns that implicit conversion in an index expression might prevent index use, and the SQL Tuning Guide uses `WHERE char_col=1` as an example that prevents use of the index unless the index is function-based. |
| Trying to update a virtual column directly or defining one with unsupported expression rules | Oracle says virtual columns cannot be updated directly, must return a scalar value, and can reference only same-table columns. |
| Expecting a function-based index to be used before statistics are gathered or when nulls are not filtered | Oracle says gather statistics first, and that the index is not used unless the query filters out nulls. |

---

## Oracle Version Notes (19c vs 26ai)

Minimum version used in this file:

| Feature or guidance | Minimum version used here | Notes |
|---|---|---|
| Set-based processing guidance | 19c | Documented in both 19c and 26ai Development Guide sections on building effective applications. |
| Bind variable guidance | 19c | Documented in both 19c and 26ai Development Guide sections on building effective applications. |
| Explicit join syntax and join-condition guidance | 19c | Documented in both 19c and 26ai SQL Language Reference join documentation. |
| `FETCH FIRST` and `OFFSET ... FETCH` row-limiting syntax | 12.1 | Documented in Oracle Database 12c Release 1 (12.1) and supported in both 19c and 26ai. |
| `ROWNUM` legacy guidance | 19c | Oracle still documents `ROWNUM`, but also says the `row_limiting_clause` provides superior support for limiting rows. |
| Null handling guidance | 19c | Documented in both 19c and 26ai SQL Language Reference null documentation. |
| Data type, length, and precision guidance for character, numeric, datetime, interval, and LOB types | 19c | Documented in 19c Development Guide and in both 19c and 26ai SQL Language Reference data type documentation. |
| Implicit data type conversion guidance | 19c | Documented in both 19c and 26ai SQL Language Reference data type comparison rules and SQL Tuning Guide optimizer access path guidance. |
| Virtual column guidance | 19c | Documented in 19c `CREATE TABLE`. Oracle AI Database 26 also documents `MATERIALIZED | STORED` expression columns; use `VIRTUAL` for 19c-compatible SQL. |
| Function-based index guidance | 19c | Documented in 19c SQL Language Reference and 26ai Development Guide. |
| Extended `row_limiting_clause` syntax with `APPROX | APPROXIMATE` and `row_limiting_partition_clause` | 26ai | Documented in 26ai `SELECT`; not used in this file. |

- All practices in this file are documented in Oracle Database 19c and remain valid in Oracle AI Database 26ai.
- This file uses `FETCH FIRST` and `OFFSET ... FETCH` as the baseline row-limiting syntax because Oracle documents that syntax in 12.1 and documents it in both 19c and 26ai.
- The data type examples in this file stay inside the 19c-compatible set of character, numeric, datetime, interval, and LOB types.
- The virtual-column examples in this file use the 19c-compatible `VIRTUAL` form. Oracle AI Database 26 also documents `MATERIALIZED | STORED` expression columns, but those forms are not used here.
- Oracle AI Database 26ai documents extended `row_limiting_clause` syntax that includes `APPROX | APPROXIMATE` and a `row_limiting_partition_clause`. Those extensions are not used in this file; keep to the 19c-compatible subset when you need cross-version SQL.
- The current Oracle behavior that treats zero-length character values as null is documented in both releases, but Oracle also says this may not continue to be true in future releases.

## Sources

- https://docs.oracle.com/database/121/NEWFT/chapter12101.htm#NEWFT138
- https://docs.oracle.com/database/121/SQLRF/statements_10002.htm
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Joins.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/SELECT.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROWNUM-Pseudocolumn.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Null-Conditions.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Nulls.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/tdddg/using-SQL-data-types-in-database-applications.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Data-Types.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/adfns/data-types.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Type-Comparison-Rules.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Data-Type-Comparison-Rules.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/create_table.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TO_DATE.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TO_NUMBER.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/tdddg/building-effective-applications.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/tdddg/building-effective-applications.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/optimizer-access-paths.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/optimizer-access-paths.html
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-INDEX.html
- https://docs.oracle.com/en/database/oracle/oracle-database/26/adfns/indexes.html#GUID-11E7100E-1316-4963-83C5-A85940BE9BB6
