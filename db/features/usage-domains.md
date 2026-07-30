# Oracle SQL Usage Domains

## Overview

A **usage domain** is a reusable, centrally managed definition that a table column can be associated with. A domain bundles a data type with optional properties: check constraints, a default, a collation, a display expression, an order expression, and annotations. Columns associated with a domain inherit all of it — one definition, many tables, consistent behavior.

Usage domains were introduced in Oracle Database 23ai. Together with annotations they act as a "data intention language": they document intended data usage in the dictionary and enforce it consistently, which helps both data discovery and consistency across a schema.

Domains are metadata, not new storage types: the column keeps its base data type (`USER_TAB_COLUMNS.DATA_TYPE` still shows `VARCHAR2` etc.); the association is visible in `USER_TAB_COLS.DOMAIN_NAME`.

**When usage domains are useful:**
- Centralizing a check constraint, default, or format rule used by many tables
- Enum-like columns with a stable, closed value list
- Documenting intended usage (display/order rules, annotations) where applications can discover it
- Composite values whose columns belong together (amount + currency code + exchange rate)

---

## Creating Domains

### Single-Column Domain

```sql
CREATE DOMAIN email_d AS VARCHAR2(320 CHAR)
  CONSTRAINT email_d_chk CHECK (REGEXP_LIKE(VALUE, '^[^@]+@[^@]+\.[^@]+$'))
  DISPLAY LOWER(VALUE)
  ANNOTATIONS (Description 'RFC-style e-mail address');
```

- `VALUE` is the placeholder for the column value inside constraint, display, and order expressions; for single-column domains the domain name itself also works as placeholder.
- `DISPLAY <expr>` defines a canonical rendering, retrievable via `DOMAIN_DISPLAY(col)`; `ORDER <expr>` defines a canonical sort key for `DOMAIN_ORDER(col)`.
- `CREATE DOMAIN IF NOT EXISTS` is supported. The optional keyword flavor `CREATE USECASE DOMAIN` creates the same object.

Available clauses in order: `STRICT`, default, collation, `NOT NULL`, check constraints, `DISPLAY`, `ORDER`, `ANNOTATIONS`.

- Defaults support `DEFAULT ON NULL <expr>` (implicitly adds `NOT NULL`) and may reference `sequence.NEXTVAL`/`CURRVAL`. Subqueries and PL/SQL functions are not allowed.
- Check constraints must be deterministic (no `CURRENT_DATE`, no PL/SQL functions), may be declared `DEFERRABLE`, and cannot reference table columns.

### Enum via Check Constraint

A check constraint with an `IN` list turns a domain into a de-facto enumeration:

```sql
CREATE DOMAIN order_status_enum AS VARCHAR2(20)
  NOT NULL
  CONSTRAINT order_status_enum_chk CHECK (VALUE IN ('OPEN', 'PAID', 'SHIPPED', 'CANCELLED'))
  DISPLAY VALUE;
```

Size the base type with headroom: adding a longer literal later requires a full domain recreation (see below), widening beyond the base type even more so.

### Native ENUM Domain

```sql
CREATE DOMAIN order_status AS ENUM (New, Open, Shipped, Closed, Cancelled);

CREATE DOMAIN days_of_week AS ENUM (
  Sunday   = Su = 0,     -- name = alias = value
  Monday   = Mo,
  Saturday = Sa
);
```

- Without explicit values Oracle numbers the names 1, 2, 3, … **in list order** — reordering the list silently changes the stored semantics. Assign explicit values for anything that gets persisted.
- The generated check constraint cannot be dropped; display defaults to the enum name, order to the enum values.
- An enum domain is queryable like a table (`SELECT * FROM order_status` returns `ENUM_NAME`, `ENUM_VALUE`) and its names work as literals: `order_status.Cancelled`.

### Multi-Column Domain

Constrains several columns together — the classic example is money as a composite value (amount + ISO currency code + exchange rate):

```sql
CREATE DOMAIN currency AS (
  amount            AS NUMBER(10,2),
  iso_currency_code AS CHAR(3 CHAR) STRICT,
  exchange_rate     AS NUMBER
)
DISPLAY '(' || iso_currency_code || ')' || ROUND(amount * exchange_rate, 2)
ORDER amount * exchange_rate;
```

Attach with a column list; the domain functions then take the same list:

```sql
CREATE TABLE order_items (
  order_id          NUMBER,
  total_paid        NUMBER(10,2),
  currency_code     CHAR(3 CHAR),
  usd_exchange_rate NUMBER,
  DOMAIN currency (total_paid, currency_code, usd_exchange_rate)
);

SELECT order_id,
       DOMAIN_DISPLAY(total_paid, currency_code, usd_exchange_rate) AS usd_amount
FROM   order_items
ORDER  BY DOMAIN_ORDER(total_paid, currency_code, usd_exchange_rate);
```

### Flexible Domain

A discriminant column picks the applied subdomain per row (supertype/subtype pattern, e.g. postal addresses per country):

```sql
CREATE FLEXIBLE DOMAIN address (line_1, line_2, town, postal_code)
  CHOOSE DOMAIN USING (country_code VARCHAR2(2 CHAR))
  FROM CASE country_code
         WHEN 'GB' THEN gb_address(line_1, line_2, town, postal_code)
         WHEN 'US' THEN us_address(line_1, line_2, town, postal_code)
       END;
```

Only `CASE`/`DECODE` over the discriminant is allowed in `FROM`. Prefer single-column domains unless the constraint genuinely spans columns — tooling handles them best.

### JSON-Schema Domain

```sql
CREATE DOMAIN w2_form AS JSON
  CONSTRAINT CHECK (VALUE IS JSON VALIDATE USING '{"type":"object","required":["wages"]}');

-- shorthand (newer releases):
CREATE DOMAIN w2_form AS JSON VALIDATE USING '{"type":"object","required":["wages"]}';
```

### Built-In SYS Domains

Oracle ships ready-made domains (e-mail, phone number, day names, …) — the hard regexes are already written:

```sql
SELECT domain_name, search_condition
FROM   dba_domain_constraints
WHERE  domain_owner = 'SYS';
```

---

## Associating a Domain with Columns

```sql
CREATE TABLE t (email email_d);                          -- SQL standard style
CREATE TABLE t (email DOMAIN email_d);                   -- explicit keyword
CREATE TABLE t (email VARCHAR2(320 CHAR) DOMAIN email_d);

ALTER TABLE legacy_orders MODIFY (order_status DOMAIN order_status_enum);
ALTER TABLE customers MODIFY (email) ADD DOMAIN email_d;
```

- **Re-associating validates existing rows** — a violating stored value fails the ALTER. That makes the association a free data-quality check (expect a full scan on large tables).
- One domain per column: a second association raises ORA-11512.
- **STRICT vs non-strict:** without `STRICT`, a column merely needs type limits ≥ the domain's — precision and scale are not enforced. With `STRICT` the limits must match exactly, otherwise ORA-11517.

Detaching a single column is treacherous (verified on Oracle Database 23ai, version 23.26):

- `ALTER TABLE t MODIFY order_status DROP DOMAIN;` raises ORA-02000 "missing AS keyword".
- Re-stating the identical base type (`MODIFY (order_status VARCHAR2(20))`) executes fine but is a **silent no-op** — `USER_TAB_COLS.DOMAIN_NAME` stays populated.

The reliable way to sever every association at once is `DROP DOMAIN … FORCE`; always verify a detach actually happened by re-querying `USER_TAB_COLS.DOMAIN_NAME`.

---

## ALTER DOMAIN — Display, Order, Annotations Only

`ALTER DOMAIN` covers only the presentation layer:

```sql
ALTER DOMAIN currency ADD DISPLAY '(' || iso_currency_code || ')' || amount;
ALTER DOMAIN day_of_week MODIFY DISPLAY LOWER(day_of_week);
ALTER DOMAIN day_of_week DROP DISPLAY;
ALTER DOMAIN year_of_birth ADD ORDER FLOOR(year_of_birth / 100);
ALTER DOMAIN day_of_week ANNOTATIONS (Display 'Day of week');
```

- `ADD` fails if the expression already exists; `MODIFY`/`DROP` fail if it does not; `DROP DISPLAY` fails while a flexible domain depends on it.
- Altering display/order invalidates cursors and materialized views that call `DOMAIN_DISPLAY`/`DOMAIN_ORDER`.
- **The data type, check constraints, and defaults cannot be altered** — those require the recreation sequence below.

---

## DROP DOMAIN

```sql
DROP DOMAIN IF EXISTS email_d;        -- fails with ORA-11502 while dependents exist
DROP DOMAIN email_d FORCE;            -- severs all column associations
DROP DOMAIN email_d FORCE PRESERVE;   -- severs, but keeps constraints/defaults on the columns
```

- `FORCE` removes inherited constraints, defaults (unless set directly on the column), and column annotations; keeps collation and data; invalidates dependent cursors and materialized views that use domain functions; drops dependent flexible domains.
- Recycle-bin copies of dropped tables count as dependents (`BIN$…` rows in `USER_DEPENDENCIES`) — `FORCE` clears those too, or purge the recycle bin first (verified on 23.26).
- `FORCE PRESERVE` keeps the inherited constraints and defaults on the columns — made for temporary drops. Re-attaching afterwards can create **duplicate constraints**; clean up with `ALTER TABLE … DROP CONSTRAINT`.

---

## Changing Constraints or the Data Type — Recreation Sequence

There is no ALTER for a domain's data type or check constraints. With dependent columns, the safe, explicit sequence is:

```sql
-- 1) find every dependent column (for step 3 - and to know what you are touching)
SELECT table_name, column_name FROM user_tab_cols WHERE domain_name = 'ORDER_STATUS_ENUM';

-- 2) drop and recreate with the new definition
DROP DOMAIN IF EXISTS order_status_enum FORCE;
CREATE DOMAIN order_status_enum AS VARCHAR2(20)
  NOT NULL
  CONSTRAINT order_status_enum_chk CHECK (VALUE IN ('OPEN', 'PAID', 'SHIPPED', 'CANCELLED', 'REFUNDED'))
  DISPLAY VALUE;

-- 3) re-attach (validates all existing rows per table)
ALTER TABLE orders        MODIFY (order_status DOMAIN order_status_enum);
ALTER TABLE legacy_orders MODIFY (order_status DOMAIN order_status_enum);
```

- With plain `FORCE` the columns briefly lose the domain's NOT NULL and check protection — run the block in one deployment window without concurrent writers. `FORCE PRESERVE` closes that gap but leaves duplicate constraints to drop after re-attaching; pick one.
- Widening the base type additionally needs `ALTER TABLE … MODIFY (col <new type>)` per table between drop and re-attach, otherwise the re-attach fails on the size mismatch.
- Keep the recreated definition identical apart from the intended change (including `DISPLAY`, annotations, and the constraint name) so deployment diffs stay trivial.

---

## Domain Functions and Dictionary Views

| What | How |
|---|---|
| Domain of a column | `USER_TAB_COLS.DOMAIN_NAME` (and `DOMAIN_OWNER`) |
| Domain definitions | `USER_DOMAINS` |
| Domain constraints | `USER_DOMAIN_CONSTRAINTS` — the constraint name column is `NAME`, **not** `CONSTRAINT_NAME` (querying the latter raises ORA-00904); generated internals appear as `SYS_DOMAIN_C…` with `GENERATED = 'GENERATED NAME'` |
| Domain columns | `USER_DOMAIN_COLS` (includes the `DISCRIMINANT` flag for flexible domains) |
| Inherited table constraints | `USER_CONSTRAINTS.DOMAIN_NAME` |
| Canonical rendering | `DOMAIN_DISPLAY(col [, col2, …])` |
| Canonical sort key | `DOMAIN_ORDER(col [, col2, …])` |
| Check value incl. constraints | `DOMAIN_CHECK(domain_name, value)` |
| Check type conversion only | `DOMAIN_CHECK_TYPE(domain_name, value)` |
| Resolve at runtime | `DOMAIN_NAME(col)` |
| Cast a literal | `CAST(value AS DOMAIN domain_name)` |

---

## Best Practices and Common Mistakes

1. **Plan constraint changes as recreations from day one.** Keep the original `CREATE DOMAIN` statement in a versioned deployment script so the recreation can copy it verbatim.
2. **Re-attach validates.** Full scan per table; a failing row aborts the association with the offending constraint.
3. **Non-strict ignores precision and scale.** A `NUMBER(10,2)` domain happily attaches to a plain `INTEGER` column. Use `STRICT` where the limits are part of the contract.
4. **No PL/SQL support.** Domains exist only in SQL: neither variables nor procedure/function parameters can be declared of a domain type, so the type safety a domain suggests ends at the table — a routine handling an `email_d` value still takes a plain `VARCHAR2` and accepts any string. `col%TYPE` on a domain column resolves to the bare base type without the domain's constraints. Workaround for critical routines: validate explicitly at entry with `DOMAIN_CHECK(domain_name, value)`.
5. **Enum auto-numbering is order-dependent.** Assign explicit values to persisted enum domains.
6. **Domains vs. lookup tables.** A domain enforces and documents a closed value list, but it is not a foreign key: no referenced rows, no joins. Use a domain for stable technical enumerations; use a lookup table when values carry attributes or change at runtime.
7. **Check the built-ins first.** SYS ships e-mail/phone/day domains with curated regexes.
8. **Naming conventions help.** Suffixes such as `_ENUM` (value-list domains) and `_D` (typed scalar domains) make `USER_TAB_COLS.DOMAIN_NAME` listings self-explanatory.
9. **Third-party SQL parsers lag behind.** IDEs frequently flag valid domain syntax as an error. Verify against the database, not the editor squiggles.
10. **Annotations over comments.** Domains and their columns take `ANNOTATIONS (…)`; prefer them to `COMMENT ON` for machine-readable, dictionary-native documentation.

---

## Oracle Version Notes (19c vs 23ai/26ai)

- **19c and earlier:** usage domains do not exist. The closest substitutes are check constraints per table, virtual columns, and lookup tables.
- **23ai:** `CREATE DOMAIN` (single-column, multi-column, flexible), `STRICT`, domain functions, `DROP DOMAIN [FORCE]`, annotations. Detach behavior noted above verified on 23ai version 23.26.
- **Newer 23ai release updates / 26ai:** `ALTER DOMAIN` (display/order/annotations), native `ENUM` domains, JSON-schema shorthand (`AS JSON VALIDATE USING`), `FORCE PRESERVE`. Feature availability grows with release updates — verify a clause against the target database before relying on it.

---

## Sources

- [CREATE DOMAIN — Oracle Database SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/create-domain.html)
- [ALTER DOMAIN — Oracle Database SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/alter-domain.html)
- [DROP DOMAIN — Oracle Database SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/drop-domain.html)
- [Domain Functions — Oracle Database SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Single-Row-Functions.html)
- [Oracle-Base: SQL Domains in Oracle Database 23ai](https://oracle-base.com/articles/23/domains-23)
- [Chris Saxon: Simple Data Definitions with Domains and Annotations (UKOUG 2023)](https://cdn.ymaws.com/ukoug.org/resource/resmgr/speakerslides23/Chris_Saxon_-_Simple_data_de.pdf)
