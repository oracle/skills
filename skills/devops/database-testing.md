# Database Testing with utPLSQL

## Overview

Testing PL/SQL code has historically been treated as a second-class concern — manual testing, ad hoc scripts, or no testing at all. The utPLSQL framework brings unit testing discipline to Oracle database development: structured test packages, assertions, setup/teardown lifecycle, mocking, code coverage measurement, and integration with CI/CD pipelines.

utPLSQL (version 3.x) is the modern successor to utPLSQL v1 and Steven Feuerstein's original work. It runs entirely inside the Oracle database as a set of installed packages, requiring no external runtime. Tests are written in PL/SQL, making them native to the environment they test.

This guide covers the full lifecycle: writing tests, managing test data, mocking dependencies, integrating with pipelines, and measuring coverage.

---

## Installing utPLSQL

```shell
# Clone the repository
git clone https://github.com/utPLSQL/utPLSQL.git
cd utPLSQL

# Install into the database
# The installer creates the UT3 schema and all framework objects
sqlplus sys/password@//host:1521/service AS SYSDBA @install/install.sql

# Create a dedicated tester account
sqlplus sys/password@//host:1521/service AS SYSDBA <<'EOF'
CREATE USER ut_runner IDENTIFIED BY "password";
GRANT CREATE SESSION TO ut_runner;
GRANT ut_runner TO ut_runner;   -- utPLSQL role
EOF
```

### Post-Installation Verification

```sql
-- Verify no invalid objects remain after install
SELECT object_name, object_type, status
FROM   all_objects
WHERE  owner = 'UT3'
  AND  object_type IN ('PACKAGE', 'TYPE')
  AND  status = 'INVALID';
-- Should return no rows

-- Run the framework self-test
BEGIN
  ut.run();
END;
/
```

---

## Test Package Structure

utPLSQL tests are organized as annotated PL/SQL packages. Annotations (`-- %` comments) drive the framework:

| Annotation | Purpose |
|---|---|
| `%suite` | Marks a package as a test suite |
| `%suitepath(path)` | Hierarchical path for organizing suites (e.g., `myapp.orders`) |
| `%test` | Marks a procedure as a test |
| `%beforeall` | Runs once before the entire suite |
| `%afterall` | Runs once after the entire suite |
| `%beforeeach` | Runs before each test |
| `%aftereach` | Runs after each test |
| `%suite_context` / `%context` | Descriptive grouping label for sub-contexts |
| `%endcontext` | Ends a context group |
| `%displayname` | Human-readable test/suite name |
| `%disabled` | Skip this test |
| `%throws` | Expect a specific exception code |
| `%tags(tag1,tag2)` | Tag for selective test running |

### Minimal Test Package

```sql
-- Package specification
CREATE OR REPLACE PACKAGE ut_pkg_orders AS
  -- %suite(Order Processing Tests)
  -- %suitepath(app.orders)

  -- %beforeall
  PROCEDURE setup_suite;

  -- %afterall
  PROCEDURE teardown_suite;

  -- %beforeeach
  PROCEDURE setup_test;

  -- %aftereach
  PROCEDURE teardown_test;

  -- %test(Calculate order total with multiple lines)
  PROCEDURE test_order_total_multiple_lines;

  -- %test(Calculate order total with single line)
  PROCEDURE test_order_total_single_line;

  -- %test(Raise exception for non-existent order)
  -- %throws(-20001)
  PROCEDURE test_order_total_invalid_id;

END ut_pkg_orders;
/

-- Package body
CREATE OR REPLACE PACKAGE BODY ut_pkg_orders AS

  -- Suite-level constants
  c_test_customer_id CONSTANT NUMBER := -9001;
  c_test_order_id    CONSTANT NUMBER := -9001;

  -- -----------------------------------------------------------------------
  -- Lifecycle hooks
  -- -----------------------------------------------------------------------

  PROCEDURE setup_suite IS
  BEGIN
    -- Insert a permanent test customer used by all tests
    INSERT INTO CUSTOMERS_T (CUSTOMER_ID, FIRST_NAME, LAST_NAME, EMAIL)
    VALUES (c_test_customer_id, 'Test', 'User', 'test@example.com');
    COMMIT;
  END setup_suite;

  PROCEDURE teardown_suite IS
  BEGIN
    -- Remove all test data by key range (negative IDs are test data)
    DELETE FROM ORDER_LINES WHERE ORDER_ID < 0;
    DELETE FROM ORDERS       WHERE ORDER_ID < 0;
    DELETE FROM CUSTOMERS_T  WHERE CUSTOMER_ID < 0;
    COMMIT;
  END teardown_suite;

  PROCEDURE setup_test IS
  BEGIN
    -- Insert a fresh test order before each test
    INSERT INTO ORDERS (ORDER_ID, CUSTOMER_ID, ORDER_DATE, STATUS_CODE)
    VALUES (c_test_order_id, c_test_customer_id, SYSDATE, 'PENDING');
    COMMIT;
  END setup_test;

  PROCEDURE teardown_test IS
  BEGIN
    -- Clean up per-test data
    DELETE FROM ORDER_LINES WHERE ORDER_ID = c_test_order_id;
    DELETE FROM ORDERS       WHERE ORDER_ID = c_test_order_id;
    COMMIT;
  END teardown_test;

  -- -----------------------------------------------------------------------
  -- Tests
  -- -----------------------------------------------------------------------

  PROCEDURE test_order_total_multiple_lines IS
    v_actual NUMBER;
  BEGIN
    -- Arrange: insert order lines
    INSERT INTO ORDER_LINES (LINE_ID, ORDER_ID, PRODUCT_ID, QTY, UNIT_PRICE)
    VALUES (-1, c_test_order_id, 1001, 2, 19.99);

    INSERT INTO ORDER_LINES (LINE_ID, ORDER_ID, PRODUCT_ID, QTY, UNIT_PRICE)
    VALUES (-2, c_test_order_id, 1002, 1, 49.99);

    COMMIT;

    -- Act
    v_actual := PKG_ORDERS.get_order_total(c_test_order_id);

    -- Assert
    ut.expect(v_actual).to_equal(89.97);   -- 2*19.99 + 1*49.99
  END test_order_total_multiple_lines;

  PROCEDURE test_order_total_single_line IS
    v_actual NUMBER;
  BEGIN
    INSERT INTO ORDER_LINES (LINE_ID, ORDER_ID, PRODUCT_ID, QTY, UNIT_PRICE)
    VALUES (-1, c_test_order_id, 1001, 1, 100.00);
    COMMIT;

    v_actual := PKG_ORDERS.get_order_total(c_test_order_id);

    ut.expect(v_actual).to_equal(100.00);
  END test_order_total_single_line;

  PROCEDURE test_order_total_invalid_id IS
    v_dummy NUMBER;
  BEGIN
    -- Expect PKG_ORDERS to raise ORA-20001 for a non-existent order
    v_dummy := PKG_ORDERS.get_order_total(-99999);
  END test_order_total_invalid_id;

END ut_pkg_orders;
/
```

---

## Assertions

utPLSQL uses a fluent assertion API centered on `ut.expect(actual).to_*(expected)`. All assertion methods support optional failure messages.

```sql
-- Scalar equality
ut.expect(v_count).to_equal(5);
ut.expect(v_count).not_to_equal(0);
ut.expect(v_name).to_equal('ACTIVE');

-- Null checks
ut.expect(v_result).to_be_null();
ut.expect(v_result).not_to_be_null();

-- Numeric comparisons
ut.expect(v_total).to_be_greater_than(0);
ut.expect(v_total).to_be_greater_or_equal(1);
ut.expect(v_total).to_be_less_than(1000);
ut.expect(v_total).to_be_less_or_equal(1000);
ut.expect(v_total).to_be_between(10, 999);

-- Boolean
ut.expect(v_flag).to_be_true();
ut.expect(v_flag).to_be_false();

-- Strings
ut.expect(v_message).to_be_like('%error%');              -- SQL LIKE pattern
ut.expect(v_message).not_to_be_like('%SUCCESS%');
ut.expect(v_name).to_be_like_ignoring_case('%smith%');   -- case-insensitive LIKE
ut.expect(v_message).to_match('^ERROR:.*\d{4}$');        -- REGEXP

-- Custom failure message
ut.expect(v_status, 'Order status should be SHIPPED').to_equal('SHIPPED');
```

### Comparing Cursors

Cursor comparison is one of utPLSQL's most powerful features for testing queries:

```sql
PROCEDURE test_active_customer_view IS
BEGIN
  ut.expect(
    CURSOR(
      SELECT CUSTOMER_ID, EMAIL, STATUS_CODE
      FROM   CUSTOMERS
      WHERE  CUSTOMER_ID = c_test_customer_id
    )
  ).to_equal(
    CURSOR(
      SELECT c_test_customer_id AS CUSTOMER_ID,
             'test@example.com' AS EMAIL,
             'ACTIVE'           AS STATUS_CODE
      FROM   DUAL
    )
  );
END test_active_customer_view;
```

Cursor comparisons support additional modifiers:

```sql
-- Exclude non-deterministic columns (e.g. timestamps) from comparison
ut.expect(l_actual).to_equal(l_expected)
  .exclude_columns(ut_varchar2_list('created_at', 'updated_at'));

-- Unordered comparison (row order does not matter)
ut.expect(l_actual).to_equal(l_expected).unordered;
```

### Comparing Collections

```sql
PROCEDURE test_product_list IS
  TYPE t_ids IS TABLE OF NUMBER;
  v_actual   t_ids;
  v_expected t_ids := t_ids(101, 102, 103);
BEGIN
  SELECT PRODUCT_ID
  BULK COLLECT INTO v_actual
  FROM   PRODUCTS
  WHERE  CATEGORY = 'WIDGET'
  ORDER BY PRODUCT_ID;

  ut.expect(anydata.ConvertCollection(v_actual))
    .to_equal(anydata.ConvertCollection(v_expected));
END test_product_list;
```

### Exception Testing

```sql
-- Method 1: %throws annotation (cleanest for a single expected exception)
-- %throws(-20001)
PROCEDURE test_invalid_input IS
BEGIN
  validate_customer(NULL);  -- should raise ORA-20001
END;

-- Method 2: Inline ut.expect().to_throw() for multiple exception cases
PROCEDURE test_multiple_exception_cases IS
BEGIN
  ut.expect(
    PROCEDURE() IS BEGIN validate_customer(NULL); END;
  ).to_throw(-20001);

  ut.expect(
    PROCEDURE() IS BEGIN validate_customer(-1); END;
  ).to_throw(-20002, 'negative customer id');
END;
```

---

## Test Data Management

### Strategies for Isolating Test Data

**Negative ID Convention:** Reserve negative or very high integer ranges for test data. Teardown deletes by this range. Simple, effective, and prevents accidental deletion of real data.

```sql
-- Test data IDs: -9999 to -1
-- Production data IDs: 1+
c_test_id_offset CONSTANT NUMBER := -9000;
```

**Savepoint-Based Rollback:** Roll back after each test, avoiding permanent inserts. Fastest approach, but cannot test COMMIT-dependent logic.

```sql
PROCEDURE setup_test IS
BEGIN
  SAVEPOINT test_start;
END setup_test;

PROCEDURE teardown_test IS
BEGIN
  ROLLBACK TO SAVEPOINT test_start;
END teardown_test;
```

**Autonomous Transaction for Persistent Test Data:** Insert reference/setup data that must survive the test transaction context (e.g., lookup tables required by the code under test):

```sql
-- %beforeall
PROCEDURE setup_test_data IS
  PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  INSERT INTO test_customers VALUES (99999, 'TEST CORP', 'ACTIVE');
  COMMIT;
END setup_test_data;

-- %afterall
PROCEDURE cleanup_test_data IS
  PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
  DELETE FROM test_customers WHERE customer_id = 99999;
  COMMIT;
END cleanup_test_data;
```

**Dedicated Test Schema:** Run tests in a completely separate schema that is dropped and recreated per CI run. Best isolation, highest overhead.

```sql
-- CI pipeline creates a test schema:
CREATE USER test_schema IDENTIFIED BY "password";
GRANT CREATE SESSION, CREATE TABLE, CREATE PROCEDURE TO test_schema;

-- Apply migrations to test_schema
-- Run tests
-- Drop test_schema after run
```

### Test Data Builders

A PL/SQL builder pattern avoids scattering INSERT statements across test packages:

```sql
CREATE OR REPLACE PACKAGE TEST_DATA_BUILDER AS

  FUNCTION build_customer(
    p_customer_id  NUMBER    DEFAULT -9001,
    p_first_name   VARCHAR2  DEFAULT 'Test',
    p_last_name    VARCHAR2  DEFAULT 'User',
    p_email        VARCHAR2  DEFAULT 'test@example.com',
    p_status       VARCHAR2  DEFAULT 'ACTIVE'
  ) RETURN NUMBER;  -- Returns the customer_id

  FUNCTION build_order(
    p_order_id    NUMBER   DEFAULT -9001,
    p_customer_id NUMBER   DEFAULT -9001,
    p_status      VARCHAR2 DEFAULT 'PENDING'
  ) RETURN NUMBER;  -- Returns the order_id

END TEST_DATA_BUILDER;
/

CREATE OR REPLACE PACKAGE BODY TEST_DATA_BUILDER AS

  FUNCTION build_customer(
    p_customer_id  NUMBER    DEFAULT -9001,
    p_first_name   VARCHAR2  DEFAULT 'Test',
    p_last_name    VARCHAR2  DEFAULT 'User',
    p_email        VARCHAR2  DEFAULT 'test@example.com',
    p_status       VARCHAR2  DEFAULT 'ACTIVE'
  ) RETURN NUMBER IS
  BEGIN
    INSERT INTO CUSTOMERS_T (CUSTOMER_ID, FIRST_NAME, LAST_NAME, EMAIL, STATUS_CODE)
    VALUES (p_customer_id, p_first_name, p_last_name, p_email, p_status);
    RETURN p_customer_id;
  END build_customer;

  FUNCTION build_order(
    p_order_id    NUMBER   DEFAULT -9001,
    p_customer_id NUMBER   DEFAULT -9001,
    p_status      VARCHAR2 DEFAULT 'PENDING'
  ) RETURN NUMBER IS
  BEGIN
    INSERT INTO ORDERS (ORDER_ID, CUSTOMER_ID, ORDER_DATE, STATUS_CODE)
    VALUES (p_order_id, p_customer_id, SYSDATE, p_status);
    RETURN p_order_id;
  END build_order;

END TEST_DATA_BUILDER;
/
```

---

## Mocking with utPLSQL

utPLSQL includes a mocking framework that stubs out package function/procedure calls. This allows testing a package in isolation from its dependencies (external services, other packages, expensive queries).

```sql
-- Suppose PKG_PRICING calls an external rate service via PKG_EXCHANGE_RATES
-- We want to test PKG_PRICING without the real exchange rate lookup

PROCEDURE test_price_in_eur IS
BEGIN
  -- Mock PKG_EXCHANGE_RATES.get_rate to always return 0.92
  ut3.ut_mock.package_function(
    a_owner       => 'APP_OWNER',
    a_package     => 'PKG_EXCHANGE_RATES',
    a_name        => 'GET_RATE',
    a_return_value => 0.92
  );

  -- Now call the function under test
  ut.expect(
    PKG_PRICING.convert_to_eur(p_amount_usd => 100.00)
  ).to_equal(92.00);

  -- Verify the mock was called with expected arguments
  ut3.ut_mock.expect_called(
    a_owner   => 'APP_OWNER',
    a_package => 'PKG_EXCHANGE_RATES',
    a_name    => 'GET_RATE',
    a_times   => 1
  );
END test_price_in_eur;
```

### Mocking Sequence-Based ID Generation

```sql
-- Mock a sequence by stubbing the function that wraps NEXTVAL
ut3.ut_mock.package_function(
  a_owner        => 'APP_OWNER',
  a_package      => 'PKG_ID_GENERATOR',
  a_name         => 'NEXT_ORDER_ID',
  a_return_value => 42
);
```

---

## TDD Workflow for PL/SQL

### Red-Green-Refactor Cycle

1. **Write a failing test** that describes the desired behavior.
2. **Write the minimum PL/SQL** to make the test pass.
3. **Refactor** the implementation while keeping tests green.
4. **Repeat** for the next behavior.

```sql
-- Step 1: Write the failing test first
-- (The procedure PROCESS_REFUND does not exist yet)

CREATE OR REPLACE PACKAGE ut_pkg_refunds AS
  -- %suite(Refund Processing)
  -- %test(Successful refund creates credit memo)
  PROCEDURE test_refund_creates_credit_memo;
END ut_pkg_refunds;
/

CREATE OR REPLACE PACKAGE BODY ut_pkg_refunds AS
  PROCEDURE test_refund_creates_credit_memo IS
    v_memo_id NUMBER;
    v_order_id NUMBER := -9001;
  BEGIN
    -- Arrange
    INSERT INTO ORDERS (ORDER_ID, CUSTOMER_ID, ORDER_DATE, STATUS_CODE, TOTAL_AMOUNT)
    VALUES (v_order_id, -9001, SYSDATE - 5, 'SHIPPED', 150.00);
    COMMIT;

    -- Act: this call fails until we implement the procedure
    PKG_REFUNDS.process_refund(
      p_order_id  => v_order_id,
      p_amount    => 50.00,
      o_memo_id   => v_memo_id
    );

    -- Assert
    ut.expect(v_memo_id).not_to_be_null();

    DECLARE
      v_status VARCHAR2(20);
    BEGIN
      SELECT STATUS INTO v_status FROM CREDIT_MEMOS WHERE MEMO_ID = v_memo_id;
      ut.expect(v_status).to_equal('PENDING');
    END;

    ROLLBACK;
  END test_refund_creates_credit_memo;
END ut_pkg_refunds;
/
```

```shell
# Run the test and watch it fail (RED)
sql /nolog <<'EOF'
  connect ut_runner/password@//host:1521/service
  SET SERVEROUTPUT ON
  EXEC ut.run('ut_pkg_refunds');
EOF
```

Now implement the procedure, re-run, and watch it pass (GREEN).

---

## Running Tests

```sql
-- Run all tests in the database
EXEC ut.run();

-- Run a specific suite
EXEC ut.run('ut_pkg_orders');

-- Run a specific test by path
EXEC ut.run('ut_pkg_orders.test_order_total_multiple_lines');

-- Run tests matching a tag
EXEC ut.run(a_tags => ut_varchar2_list('order', 'critical'));

-- Run with specific reporter
BEGIN
  ut.run(
    a_paths   => ut_varchar2_list('app.orders'),
    a_reporter => ut_documentation_reporter()
  );
END;
/
```

---

## Integrating DB Tests into CI/CD

### Output Reporters

utPLSQL supports multiple output formats for CI integration:

| Reporter | Output Format | Use Case |
|---|---|---|
| `ut_documentation_reporter` | Human-readable text | Local development |
| `ut_junit_reporter` | JUnit XML | CI/CD (Jenkins, GitLab CI, GitHub Actions) |
| `ut_sonar_test_reporter` | SonarQube format | SonarQube integration |
| `ut_teamcity_reporter` | TeamCity format | JetBrains TeamCity |
| `ut_tap_reporter` | TAP (Test Anything Protocol) | Generic CI tools |
| `ut_coveralls_reporter` | Coveralls JSON | Coveralls code coverage service |
| `ut_coverage_html_reporter` | HTML | Human-readable coverage report |
| `ut_coverage_cobertura_reporter` | Cobertura XML | Coverage in CI dashboards |

```sql
-- JUnit XML (consumed by Jenkins, GitHub Actions, GitLab CI)
BEGIN
  ut.run(
    a_paths    => ut_varchar2_list(':app'),
    a_reporters => ut_reporters(
      ut_junit_reporter()
    ),
    a_output_to => ut_output_to_file('/tmp/test-results.xml')
  );
END;
/
```

```sql
-- Teamcity format
BEGIN
  ut.run(
    a_reporters => ut_reporters(ut_teamcity_reporter())
  );
END;
/

-- Sonar Qube compatible
BEGIN
  ut.run(
    a_reporters => ut_reporters(ut_sonar_test_reporter())
  );
END;
/
```

### CI Pipeline Integration

```yaml
# .github/workflows/db-test.yml
name: Database Tests

on:
  pull_request:
    paths:
      - 'db/**'
      - 'src/plsql/**'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      oracle:
        image: gvenzl/oracle-free:23-slim
        env:
          ORACLE_PASSWORD: testpassword
        ports:
          - 1521:1521
        options: >-
          --health-cmd "sqlplus -L sys/testpassword@//localhost:1521/FREEPDB1 AS SYSDBA < /dev/null"
          --health-interval 30s
          --health-timeout 10s
          --health-retries 10

    steps:
      - uses: actions/checkout@v4

      - name: Install utPLSQL
        run: |
          sqlplus sys/testpassword@//localhost:1521/FREEPDB1 AS SYSDBA \
            @utPLSQL/install/install.sql

      - name: Apply schema migrations
        run: |
          liquibase \
            --url="jdbc:oracle:thin:@//localhost:1521/FREEPDB1" \
            --username=sys --password=testpassword \
            --defaultSchemaName=APP_OWNER \
            update

      - name: Deploy test packages
        run: |
          sqlplus app_owner/password@//localhost:1521/FREEPDB1 \
            @tests/install_tests.sql

      - name: Run utPLSQL tests
        run: |
          sqlplus ut_runner/password@//localhost:1521/FREEPDB1 <<'EOF'
            WHENEVER SQLERROR EXIT FAILURE
            BEGIN
              ut.run(
                a_reporters => ut_reporters(
                  ut_junit_reporter(),
                  ut_documentation_reporter()
                ),
                a_output_to => ut_output_to_file('/tmp/test-results.xml')
              );
            END;
            /
            EXIT
          EOF

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: /tmp/test-results.xml

      - name: Publish test results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: /tmp/test-results.xml
```

### utPLSQL CLI (Java Client)

The utPLSQL-cli Java client provides a convenient command-line interface that pulls results from the database without requiring SQL*Plus:

```shell
# Install
wget https://github.com/utPLSQL/utPLSQL-cli/releases/latest/download/utplsql-cli.zip
unzip utplsql-cli.zip

# Run tests with JUnit output
./utplsql run app_owner/password@//host:1521/service \
  -f=ut_junit_reporter          -o=test-results.xml \
  -f=ut_documentation_reporter  -o=/dev/stdout \
  -source_path=src/plsql \
  -test_path=tests
```

---

## Code Coverage

utPLSQL integrates with Oracle's built-in DBMS_PROFILER and DBMS_PLSQL_CODE_COVERAGE to measure which lines of PL/SQL are executed during test runs.

```sql
-- Run tests with coverage collection
BEGIN
  ut.run(
    a_paths         => ut_varchar2_list(':app'),
    a_reporters     => ut_reporters(
      ut_documentation_reporter(),
      ut_coverage_html_reporter()
    ),
    a_coverage_schemes => ut_varchar2_list('APP_OWNER'),
    a_output_to     => ut_output_to_file('/tmp/coverage.html')
  );
END;
/
```

```shell
# utPLSQL-cli with coverage
./utplsql run app_owner/password@//host:1521/service \
  -f=ut_documentation_reporter  -o=/dev/stdout \
  -f=ut_coverage_html_reporter  -o=coverage.html \
  -f=ut_coverage_cobertura_reporter -o=coverage.xml \
  -source_path=src/plsql \
  -test_path=tests \
  -coverage_schemes=APP_OWNER
```

### Checking Coverage Programmatically

```sql
-- Query coverage results after a test run (UT3.UT_COVERAGE_DETAILS view)
SELECT
    o.OWNER,
    o.OBJECT_NAME,
    o.OBJECT_TYPE,
    c.COVERED_LINES,
    c.UNCOVERED_LINES,
    c.TOTAL_LINES,
    ROUND(c.COVERED_LINES / NULLIF(c.TOTAL_LINES, 0) * 100, 1) AS PCT_COVERAGE
FROM
    UT3.UT_COVERAGE_DETAILS c
JOIN
    ALL_OBJECTS o ON o.OBJECT_ID = c.OBJECT_ID
WHERE
    o.OWNER = 'APP_OWNER'
ORDER BY
    PCT_COVERAGE ASC;

-- Alternative view: UT3.UT_COVERAGE_RESULTS
SELECT object_name, object_type,
       covered_lines,
       total_lines,
       ROUND(covered_lines / NULLIF(total_lines, 0) * 100, 1) AS pct_covered
FROM   ut3.ut_coverage_results
ORDER BY pct_covered;
```

---

## Best Practices

- **Test behavior, not implementation.** Assert on observable outcomes (return values, rows inserted, exceptions raised) rather than internal state or intermediate variables. Tests should survive refactoring without changes.
- **Keep tests fast.** Each test should complete in milliseconds. Tests that run slow reduce developer feedback loops and tempt teams to skip running them. Avoid full-table queries in test setup; use targeted inserts with known primary keys.
- **Use negative IDs for all test data.** This isolates test data from application data in shared databases and makes cleanup deterministic: `DELETE WHERE ID < 0`.
- **Test exception paths explicitly.** The `%throws` annotation and `ut.expect(...)throws(...)` pattern make error path testing clean. PL/SQL exception handling is a common source of bugs that only surface in edge cases.
- **Co-locate test packages with the code they test.** A `src/plsql/pkg_orders.pks` should have a corresponding `tests/ut_pkg_orders.pks` in the same repository.
- **Run tests on every pull request.** Use the JUnit XML reporter to integrate with the PR check system. A red test should block merge.
- **Measure and gate on coverage.** Aim for 80%+ line coverage on business-critical packages. Use coverage reports in CI to identify gaps, but do not treat 100% as the goal — test quality matters more than test quantity.
- **Use `%tags` to separate fast unit tests from slow integration tests.** This allows running the fast suite on every commit and the full suite nightly or on release branches.
- **Use cursor assertions over COUNT(*) checks.** Cursor comparison validates actual data values; a COUNT of 1 only tells you a row exists.

---

## Common Mistakes

**Mistake: Tests that depend on execution order.**
Each test should be independently runnable. Tests that rely on data left behind by a previous test are fragile and misleading. Use `%beforeeach` to set up fresh state before every test.

**Mistake: Committing test data without cleanup.**
If `teardown` procedures fail (e.g., due to constraint violations in cleanup order), test data accumulates across runs. Use the negative ID convention and clean up in the correct dependency order: lines before headers, child records before parents.

**Mistake: Testing the framework, not the code.**
Writing tests that simply call `ut.expect(1).to_equal(1)` or test Oracle built-in behavior adds noise without value. Every test should exercise a specific behavior of application code.

**Mistake: Ignoring recompilation errors in test packages.**
If the code under test changes its interface (renamed parameter, changed type), test packages compile with errors but utPLSQL may report them as failures rather than compilation problems. Check `USER_ERRORS` after deploying both application code and test packages.

**Mistake: Running tests against a production database.**
utPLSQL tests insert, update, and delete data. They should never run against production — not even with careful cleanup. Use dedicated test environments or ephemeral CI containers.

**Mistake: Using `WHEN OTHERS THEN NULL` in test procedures.**
Swallowing exceptions in test code causes tests to pass even when the code under test throws. Never suppress exceptions inside test procedures.

**Mistake: Asserting only COUNT(*).**
A count of 1 only confirms a row exists; it does not validate its content. Use cursor assertions to verify actual column values.

**Mistake: Hardcoded IDs that conflict with existing data.**
Use sequences, known-safe negative ranges, or very large integers (e.g., 99999+) to avoid collisions with application data.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [utPLSQL Documentation](https://utplsql.org/utPLSQL/latest/) — test package annotations, assertion API, reporters, coverage
- [utPLSQL GitHub Repository](https://github.com/utPLSQL/utPLSQL) — installation, version 3.x architecture
- [utPLSQL-cli GitHub Repository](https://github.com/utPLSQL/utPLSQL-cli) — Java CLI client for test execution
- [DBMS_PLSQL_CODE_COVERAGE (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_PLSQL_CODE_COVERAGE.html) — code coverage infrastructure used by utPLSQL
