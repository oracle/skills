# ERD Design & Normalization for Oracle Database

## Overview

Entity Relationship Design (ERD) is the foundational step in building a well-structured relational database. In Oracle environments, a well-designed ERD translates directly into maintainable schemas, efficient queries, and predictable growth. This guide covers the full spectrum of ERD design: entity and relationship modeling, normalization through all normal forms, Oracle-specific naming rules, and cardinality modeling best practices.

---

## 1. Core ERD Concepts

### Entities

An **entity** represents a distinct object or concept about which data is stored. In Oracle, each entity typically maps to a table. Entities fall into two categories:

- **Strong entities**: Exist independently (e.g., `CUSTOMER`, `PRODUCT`).
- **Weak entities**: Depend on a strong entity for their existence (e.g., `ORDER_ITEM` depends on `ORDER`).

### Attributes

Attributes describe properties of an entity. Oracle-specific considerations:

| Attribute Type | Description | Oracle Mapping |
|---|---|---|
| Simple | Single-valued, atomic | Standard column |
| Composite | Can be broken into sub-parts (e.g., full name) | Multiple columns preferred |
| Derived | Computed from other data | Virtual column or view |
| Multi-valued | Can hold multiple values | Child table (avoid arrays) |

### Relationships

Relationships define how entities associate with one another. Oracle enforces relationships through **foreign key constraints**, **check constraints**, and **triggers**.

---

## 2. Relationship Cardinality

Cardinality defines the numeric nature of a relationship between two entities.

### One-to-One (1:1)

Rare in practice; often indicates a candidate for table merging or a security-based split.

```sql
CREATE TABLE EMPLOYEE (
    employee_id   NUMBER(10)    NOT NULL,
    full_name     VARCHAR2(100) NOT NULL,
    CONSTRAINT pk_employee PRIMARY KEY (employee_id)
);

CREATE TABLE EMPLOYEE_SECURITY (
    employee_id   NUMBER(10)    NOT NULL,
    password_hash VARCHAR2(256) NOT NULL,
    last_login    TIMESTAMP,
    CONSTRAINT pk_emp_security  PRIMARY KEY (employee_id),
    CONSTRAINT fk_emp_security  FOREIGN KEY (employee_id)
                                REFERENCES EMPLOYEE (employee_id)
                                ON DELETE CASCADE
);
```

### One-to-Many (1:N)

The most common relationship type. The "many" side holds the foreign key.

```sql
CREATE TABLE DEPARTMENT (
    department_id   NUMBER(6)    NOT NULL,
    department_name VARCHAR2(100) NOT NULL,
    CONSTRAINT pk_department PRIMARY KEY (department_id)
);

CREATE TABLE EMPLOYEE (
    employee_id     NUMBER(10)    NOT NULL,
    full_name       VARCHAR2(100) NOT NULL,
    department_id   NUMBER(6)     NOT NULL,
    hire_date       DATE          NOT NULL,
    CONSTRAINT pk_employee    PRIMARY KEY (employee_id),
    CONSTRAINT fk_emp_dept    FOREIGN KEY (department_id)
                              REFERENCES DEPARTMENT (department_id)
);
```

### Many-to-Many (M:N)

Resolved through an **associative (junction) table**, which itself often carries attributes.

```sql
CREATE TABLE STUDENT (
    student_id  NUMBER(10)   NOT NULL,
    full_name   VARCHAR2(100) NOT NULL,
    CONSTRAINT pk_student PRIMARY KEY (student_id)
);

CREATE TABLE COURSE (
    course_id   NUMBER(6)    NOT NULL,
    course_name VARCHAR2(200) NOT NULL,
    CONSTRAINT pk_course PRIMARY KEY (course_id)
);

-- Junction table with its own attributes
CREATE TABLE ENROLLMENT (
    student_id    NUMBER(10) NOT NULL,
    course_id     NUMBER(6)  NOT NULL,
    enrolled_date DATE       NOT NULL,
    grade         VARCHAR2(2),
    CONSTRAINT pk_enrollment  PRIMARY KEY (student_id, course_id),
    CONSTRAINT fk_enroll_stu  FOREIGN KEY (student_id) REFERENCES STUDENT (student_id),
    CONSTRAINT fk_enroll_crs  FOREIGN KEY (course_id)  REFERENCES COURSE  (course_id)
);
```

### Self-Referencing (Recursive) Relationships

Common for hierarchical data (org charts, bill of materials).

```sql
CREATE TABLE CATEGORY (
    category_id        NUMBER(10)    NOT NULL,
    category_name      VARCHAR2(100) NOT NULL,
    parent_category_id NUMBER(10),              -- NULL for root nodes
    CONSTRAINT pk_category     PRIMARY KEY (category_id),
    CONSTRAINT fk_cat_parent   FOREIGN KEY (parent_category_id)
                               REFERENCES CATEGORY (category_id)
);
```

Traversing this hierarchy in Oracle uses `CONNECT BY` or recursive CTEs (11g R2+):

```sql
-- Oracle hierarchical query
SELECT category_id, category_name, LEVEL AS depth,
       SYS_CONNECT_BY_PATH(category_name, ' > ') AS full_path
FROM   CATEGORY
START WITH parent_category_id IS NULL
CONNECT BY PRIOR category_id = parent_category_id
ORDER  SIBLINGS BY category_name;
```

---

## 3. Normalization

Normalization reduces data redundancy and improves data integrity by organizing data into well-structured tables. Each normal form builds on the previous.

### First Normal Form (1NF)

**Rules:**
- All column values must be atomic (indivisible).
- No repeating groups or arrays.
- Each row must be uniquely identifiable (primary key exists).

**Violation example:**

```
CUSTOMER(customer_id, name, phone1, phone2, phone3)  -- repeating groups
CUSTOMER(customer_id, name, "555-1234, 555-5678")    -- non-atomic value
```

**1NF resolution:**

```sql
CREATE TABLE CUSTOMER (
    customer_id  NUMBER(10)   NOT NULL,
    full_name    VARCHAR2(100) NOT NULL,
    CONSTRAINT pk_customer PRIMARY KEY (customer_id)
);

CREATE TABLE CUSTOMER_PHONE (
    customer_id  NUMBER(10)   NOT NULL,
    phone_type   VARCHAR2(20) NOT NULL,  -- MOBILE, HOME, WORK
    phone_number VARCHAR2(20) NOT NULL,
    CONSTRAINT pk_cust_phone  PRIMARY KEY (customer_id, phone_type),
    CONSTRAINT fk_cust_phone  FOREIGN KEY (customer_id)
                              REFERENCES CUSTOMER (customer_id)
);
```

### Second Normal Form (2NF)

**Rules:**
- Must be in 1NF.
- Every non-key attribute must be fully functionally dependent on the **entire** primary key (no partial dependencies — only relevant when PK is composite).

**Violation example** (composite PK: `order_id + product_id`):

```
ORDER_ITEM(order_id, product_id, quantity, product_name, product_price)
-- product_name and product_price depend only on product_id, not the full key
```

**2NF resolution:**

```sql
CREATE TABLE PRODUCT (
    product_id    NUMBER(10)     NOT NULL,
    product_name  VARCHAR2(200)  NOT NULL,
    unit_price    NUMBER(12,2)   NOT NULL,
    CONSTRAINT pk_product PRIMARY KEY (product_id)
);

CREATE TABLE ORDER_ITEM (
    order_id    NUMBER(10) NOT NULL,
    product_id  NUMBER(10) NOT NULL,
    quantity    NUMBER(8)  NOT NULL,
    unit_price  NUMBER(12,2) NOT NULL,  -- captured at time of order (snapshot)
    CONSTRAINT pk_order_item  PRIMARY KEY (order_id, product_id),
    CONSTRAINT fk_oi_product  FOREIGN KEY (product_id) REFERENCES PRODUCT (product_id)
);
```

### Third Normal Form (3NF)

**Rules:**
- Must be in 2NF.
- No transitive dependencies: non-key attributes must not depend on other non-key attributes.

**Violation example:**

```
EMPLOYEE(employee_id, name, department_id, department_name, department_location)
-- department_name and department_location depend on department_id, not employee_id
```

**3NF resolution:** Extract `DEPARTMENT` as a separate table (already shown in earlier examples).

### Boyce-Codd Normal Form (BCNF)

A stricter version of 3NF. Every determinant must be a candidate key. Violations occur when a table has multiple overlapping candidate keys.

```sql
-- Violation: TEACHING(student, subject, teacher)
-- where each teacher teaches only one subject, but a student can have multiple teachers
-- Determinants: (student, subject) -> teacher  AND  (student, teacher) -> subject
-- teacher -> subject (teacher is not a candidate key)

-- Resolution: split into two tables
CREATE TABLE TEACHER_SUBJECT (
    teacher_id  NUMBER(10) NOT NULL,
    subject_id  NUMBER(10) NOT NULL,
    CONSTRAINT pk_teacher_subj PRIMARY KEY (teacher_id),  -- each teacher one subject
    CONSTRAINT fk_ts_subject   FOREIGN KEY (subject_id) REFERENCES SUBJECT (subject_id)
);

CREATE TABLE STUDENT_TEACHER (
    student_id  NUMBER(10) NOT NULL,
    teacher_id  NUMBER(10) NOT NULL,
    CONSTRAINT pk_student_teacher PRIMARY KEY (student_id, teacher_id)
);
```

### Fourth Normal Form (4NF)

**Rules:**
- Must be in BCNF.
- No multi-valued dependencies (two or more independent multi-valued facts about an entity in the same table).

**Violation:**

```
EMPLOYEE_SKILLS_LANGUAGES(employee_id, skill, language)
-- skills and languages are independent multi-valued facts about an employee
```

**4NF resolution:**

```sql
CREATE TABLE EMPLOYEE_SKILL (
    employee_id  NUMBER(10)   NOT NULL,
    skill        VARCHAR2(100) NOT NULL,
    CONSTRAINT pk_emp_skill PRIMARY KEY (employee_id, skill)
);

CREATE TABLE EMPLOYEE_LANGUAGE (
    employee_id  NUMBER(10)   NOT NULL,
    language     VARCHAR2(100) NOT NULL,
    CONSTRAINT pk_emp_lang PRIMARY KEY (employee_id, language)
);
```

### Fifth Normal Form (5NF)

**Rules:**
- Must be in 4NF.
- No join dependencies that are not implied by candidate keys (no lossless decomposition into smaller tables can represent the original table's semantics better).

5NF is primarily theoretical and rarely encountered in practice. It applies when a fact can only be represented by the combination of three or more entities simultaneously.

---

## 4. Oracle Naming Conventions

Oracle has strict naming rules and reserved words that must be respected during ERD-to-DDL translation.

### Hard Rules (Oracle Enforced)

- Object names: **1–128 bytes** (Oracle 12.2+); **1–30 bytes** in earlier versions.
- Must start with a letter (unless quoted).
- Can contain: letters, digits, `_`, `$`, `#`.
- Case-insensitive **unless** double-quoted.
- **Avoid double-quoting**: it creates case-sensitive names that require quoting everywhere.

### Recommended Naming Standards

| Object | Convention | Example |
|---|---|---|
| Table | Plural noun, UPPER_SNAKE_CASE | `CUSTOMERS`, `ORDER_ITEMS` |
| Column | Descriptive noun, UPPER_SNAKE_CASE | `CUSTOMER_ID`, `CREATED_AT` |
| Primary Key | `PK_<table>` | `PK_CUSTOMERS` |
| Foreign Key | `FK_<child>_<parent>` | `FK_ORDERS_CUSTOMERS` |
| Unique Constraint | `UQ_<table>_<column(s)>` | `UQ_CUSTOMERS_EMAIL` |
| Check Constraint | `CK_<table>_<column>` | `CK_EMPLOYEES_SALARY` |
| Index | `IX_<table>_<column(s)>` | `IX_ORDERS_ORDER_DATE` |
| Sequence | `SEQ_<table>` | `SEQ_CUSTOMERS` |
| View | `V_<name>` or `VW_<name>` | `V_ACTIVE_ORDERS` |
| Trigger | `TRG_<table>_<timing>_<event>` | `TRG_ORDERS_BI_INSERT` |

### Oracle Reserved Words to Avoid as Identifiers

The following are commonly misused Oracle reserved words — never use these as table or column names without quoting:

```
ACCESS      ADD         ALL         ALTER       AND
ANY         AS          ASC         AUDIT       BETWEEN
BY          CHAR        CHECK       CLUSTER     COLUMN
COMMENT     COMPRESS    CONNECT     CREATE      CURRENT
DATE        DECIMAL     DEFAULT     DELETE      DESC
DISTINCT    DROP        ELSE        EXCLUSIVE   EXISTS
FILE        FLOAT       FOR         FROM        GRANT
GROUP       HAVING      IDENTIFIED  IMMEDIATE   IN
INCREMENT   INDEX       INITIAL     INSERT      INTEGER
INTERSECT   INTO        IS          LEVEL       LIKE
LOCK        LONG        MAXEXTENTS  MINUS       MLSLABEL
MODE        MODIFY      NOAUDIT     NOCOMPRESS  NOT
NOWAIT      NULL        NUMBER      OF          OFFLINE
ON          ONLINE      OPTION      OR          ORDER
PCTFREE     PRIOR       PRIVILEGES  PUBLIC      RAW
RENAME      RESOURCE    REVOKE      ROW         ROWID
ROWNUM      ROWS        SELECT      SESSION     SET
SHARE       SIZE        SMALLINT    START       SUCCESSFUL
SYNONYM     SYSDATE     TABLE       THEN        TO
TRIGGER     UID         UNION       UNIQUE      UPDATE
USER        VALIDATE    VALUES      VARCHAR     VARCHAR2
VIEW        WHENEVER    WHERE       WITH
```

**Problematic column name examples and replacements:**

```sql
-- BAD: uses reserved words
CREATE TABLE ORDERS (
    order_id  NUMBER,
    date      DATE,        -- DATE is a reserved word
    comment   VARCHAR2(500) -- COMMENT is a reserved word
);

-- GOOD: descriptive alternatives
CREATE TABLE ORDERS (
    order_id      NUMBER,
    order_date    DATE,
    order_comment VARCHAR2(500)
);
```

---

## 5. Oracle-Specific ERD Considerations

### Surrogate vs. Natural Keys

Oracle strongly supports surrogate primary keys via **sequences** and **identity columns** (12c+).

```sql
-- Oracle 12c+ identity column (recommended for new development)
CREATE TABLE CUSTOMER (
    customer_id   NUMBER        GENERATED ALWAYS AS IDENTITY,
    email         VARCHAR2(255) NOT NULL,
    created_at    TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_customer  PRIMARY KEY (customer_id),
    CONSTRAINT uq_cust_email UNIQUE (email)
);

-- Pre-12c pattern using sequence + trigger
CREATE SEQUENCE SEQ_CUSTOMER START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE TRIGGER TRG_CUSTOMER_BI
BEFORE INSERT ON CUSTOMER
FOR EACH ROW
BEGIN
    IF :NEW.customer_id IS NULL THEN
        :NEW.customer_id := SEQ_CUSTOMER.NEXTVAL;
    END IF;
END;
/
```

### Constraint Deferability

Oracle supports **deferrable constraints**, which is critical when dealing with circular foreign keys or bulk load operations.

```sql
-- Deferrable FK — useful for batch inserts where parent/child order is uncertain
ALTER TABLE ORDER_ITEM
    ADD CONSTRAINT fk_oi_order
        FOREIGN KEY (order_id) REFERENCES ORDERS (order_id)
        DEFERRABLE INITIALLY DEFERRED;
```

### Virtual Columns as Derived Attributes

Instead of storing computed values, Oracle virtual columns keep data consistent without application logic.

```sql
CREATE TABLE PRODUCT (
    product_id    NUMBER(10)   NOT NULL,
    unit_price    NUMBER(12,2) NOT NULL,
    tax_rate      NUMBER(5,4)  NOT NULL,
    price_with_tax NUMBER(12,2) GENERATED ALWAYS AS (unit_price * (1 + tax_rate)) VIRTUAL,
    CONSTRAINT pk_product PRIMARY KEY (product_id)
);
```

### Invisible Columns (12c+)

Useful during schema migrations — add new columns without breaking existing `SELECT *` queries.

```sql
ALTER TABLE CUSTOMER ADD (
    legacy_system_id VARCHAR2(50) INVISIBLE
);
```

---

## 6. Best Practices

- **Always define primary keys** on every table. Oracle will create a unique index automatically.
- **Name all constraints explicitly.** Anonymous constraints receive system-generated names (e.g., `SYS_C001234`) that make maintenance, error messages, and migrations extremely difficult.
- **Enforce NOT NULL at the database level**, not just the application layer, for mandatory attributes.
- **Use `DATE` for date-only data and `TIMESTAMP WITH TIME ZONE` for datetime data** that crosses time zones. Avoid storing dates as `VARCHAR2`.
- **Model optional relationships carefully.** A nullable foreign key is appropriate; a mandatory relationship should enforce `NOT NULL` on the FK column.
- **Keep junction tables thin.** The junction table's purpose is to resolve the M:N — business attributes naturally appearing on the relationship (date, quantity, status) belong there, but avoid over-loading them.
- **Document ERDs with business context.** Column comments in Oracle are part of the schema and are invaluable for future developers.

```sql
COMMENT ON TABLE  CUSTOMER IS 'Registered customers who have completed account creation.';
COMMENT ON COLUMN CUSTOMER.customer_id IS 'Surrogate primary key, generated by identity column.';
COMMENT ON COLUMN CUSTOMER.email       IS 'Unique login email address. Lowercased before storage.';
```

---

## 7. Common Mistakes and How to Avoid Them

### Mistake 1: Storing Multiple Values in a Single Column

```sql
-- BAD: CSV in a column
CREATE TABLE PROJECT (
    project_id   NUMBER,
    team_members VARCHAR2(4000)  -- "101,102,103" — unqueryable, unmaintainable
);

-- GOOD: proper child table
CREATE TABLE PROJECT_MEMBER (
    project_id   NUMBER NOT NULL,
    employee_id  NUMBER NOT NULL,
    CONSTRAINT pk_project_member PRIMARY KEY (project_id, employee_id)
);
```

### Mistake 2: Using ROWNUM or ROWID as a Primary Key

`ROWNUM` and `ROWID` are pseudo-columns — they change on bulk operations, partition moves, and table reorganizations. Always use a proper surrogate or natural key.

### Mistake 3: Skipping Foreign Key Indexes

Oracle does **not** automatically create indexes on foreign key columns. Without these indexes, lock escalation and full table scans occur on the child table during parent-row deletes.

```sql
-- After creating the FK, always add an index on the FK column(s)
CREATE INDEX IX_ORDER_ITEMS_ORDER_ID ON ORDER_ITEMS (order_id);
CREATE INDEX IX_ORDER_ITEMS_PRODUCT_ID ON ORDER_ITEMS (product_id);
```

### Mistake 4: Over-Normalizing for Performance-Critical OLTP

While 3NF is the target for OLTP, over-normalizing into dozens of tiny tables can create query-time joins that hurt performance. Profile before splitting further than 3NF.

### Mistake 5: Ignoring NULL Semantics in Unique Constraints

Oracle treats `NULL` as distinct from all values **including other NULLs** in unique constraints. Multiple rows can have `NULL` in a unique-constrained column. If you need "unique or null" behavior with explicit NULL handling, use a unique function-based index.

```sql
-- Allow multiple NULLs but enforce uniqueness for non-NULL values
CREATE UNIQUE INDEX UX_EMP_NATIONAL_ID
    ON EMPLOYEE (CASE WHEN national_id IS NOT NULL THEN national_id END);
```

### Mistake 6: Using VARCHAR2 for Fixed-Format Codes

Use `CHAR` for truly fixed-length codes (ISO country codes, state abbreviations) to save storage and ensure consistent comparisons.

```sql
country_code  CHAR(2)      NOT NULL,  -- 'US', 'GB', 'AU'
status_code   CHAR(1)      NOT NULL   -- 'A'ctive, 'I'nactive, 'S'uspended
```

---

## 8. Oracle Version Notes

| Feature | Version Introduced |
|---|---|
| Identity columns | 12c (12.1) |
| Invisible columns | 12c (12.1) |
| In-memory column store | 12c (12.1.0.2 patchset) |
| Polymorphic table functions | 18c |
| Automatic indexing | 19c |
| Blockchain tables | 21c (20c was preview only; backported to 19.10+) |
| Object name length 128 bytes | 12.2 |
| `WITH FUNCTION` inline SQL functions | 12c (12.1) |

For pre-12c systems, replace identity columns with sequences and before-insert triggers, and keep object names to 30 characters maximum.

---

## Sources

- [Oracle Database 23ai SQL Language Reference — Database Object Names and Qualifiers](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/Database-Object-Names-and-Qualifiers.html)
- [Oracle Database 23ai Concepts — Tables and Table Clusters](https://docs.oracle.com/en/database/oracle/oracle-database/23/cncpt/tables-and-table-clusters.html)
- [Oracle Database 12c R1 — Identity Columns (oracle-base.com)](https://oracle-base.com/articles/12c/identity-columns-in-oracle-12cr1)
- [Oracle Database 12c R1 — Invisible Columns (oracle-base.com)](https://oracle-base.com/articles/12c/invisible-columns-12cr1)
- [Oracle Database 12c R1 — In-Memory Column Store (oracle-base.com)](https://oracle-base.com/articles/12c/in-memory-column-store-12cr1)
- [Oracle Database 12c R1 — WITH Clause Enhancements (oracle-base.com)](https://oracle-base.com/articles/12c/with-clause-enhancements-12cr1)
- [Oracle Database 18c — Polymorphic Table Functions (oracle-base.com)](https://oracle-base.com/articles/18c/polymorphic-table-functions-18c)
- [Oracle Database 19c — Automatic Indexing (oracle-base.com)](https://oracle-base.com/articles/19c/automatic-indexing-19c)
- [Oracle Database 21c — Blockchain Tables (oracle-base.com)](https://oracle-base.com/articles/21c/blockchain-tables-21c)
- [Oracle Database 11g R2 — Recursive Subquery Factoring (oracle-base.com)](https://oracle-base.com/articles/11g/recursive-subquery-factoring-11gr2)
