# PL/SQL Unit Testing with utPLSQL

## Overview

utPLSQL is the de facto standard unit testing framework for Oracle PL/SQL. It follows xUnit conventions (like JUnit for Java) and integrates with CI/CD pipelines, producing JUnit XML output and code coverage reports. This guide covers installation, test structure, the full assertion API, and integration patterns.

---

## Installation and Configuration

### Installation

```bash
# Download the latest release from GitHub
# https://github.com/utPLSQL/utPLSQL/releases

# Connect as SYS or a user with DBA privilege
sqlplus sys/password@database as sysdba

# Run the installation script (installs into the UT3 schema by default)
@install.sql UT3 UT3_TABLESPACE

# Grant access to developers and application schemas
GRANT EXECUTE ON ut3.ut TO my_test_user;
GRANT SELECT ON ut3.ut_annotation_manager TO my_test_user;

-- Or use the convenience package alias
-- utPLSQL creates public synonyms by default
```

### Post-Installation Verification

```sql
-- Verify installation
SELECT object_name, object_type, status
FROM   all_objects
WHERE  owner = 'UT3'
  AND  object_type IN ('PACKAGE', 'TYPE')
  AND  status = 'INVALID';

-- Should return no rows
-- Run self-test:
BEGIN
  ut.run();
END;
/
```

---

## Test Package Structure

A utPLSQL test suite is a PL/SQL package with special annotation comments (`-- %suite`, `-- %test`, etc.).

```sql
-- Test package specification
CREATE OR REPLACE PACKAGE test_order_mgmt_pkg AS
  -- %suite(Order Management Tests)
  -- %suitepath(myapp.orders)

  -- %beforeall
  PROCEDURE setup_test_data;

  -- %afterall
  PROCEDURE cleanup_test_data;

  -- %beforeeach
  PROCEDURE reset_state;

  -- %aftereach
  PROCEDURE verify_no_side_effects;

  -- %test(Create order with valid customer)
  PROCEDURE test_create_order_valid;

  -- %test(Create order with null customer raises exception)
  -- %throws(-20001)
  PROCEDURE test_create_order_null_customer;

  -- %test(Cancel shipped order raises exception)
  -- %throws(-20010)
  PROCEDURE test_cancel_shipped_order;

  -- %test(Get order status for known order)
  PROCEDURE test_get_order_status;

  -- %test(Get order status returns NULL for unknown order)
  PROCEDURE test_get_status_unknown_order;

  -- %disabled
  -- %test(Integration test - skip in unit test run)
  PROCEDURE test_full_order_workflow;

END test_order_mgmt_pkg;
/
```

```sql
-- Test package body
CREATE OR REPLACE PACKAGE BODY test_order_mgmt_pkg AS

  -- Package-level variables for test data
  g_test_customer_id  NUMBER;
  g_test_order_id     NUMBER;

  -- %beforeall: runs once before all tests in this suite
  PROCEDURE setup_test_data IS
  BEGIN
    -- Insert test customer (will be rolled back at end of all tests)
    INSERT INTO customers (customer_id, customer_name, status)
    VALUES (99999, 'TEST CUSTOMER', 'ACTIVE')
    RETURNING customer_id INTO g_test_customer_id;
  END setup_test_data;

  -- %afterall: runs once after all tests in this suite
  PROCEDURE cleanup_test_data IS
  BEGIN
    DELETE FROM customers WHERE customer_id = 99999;
  END cleanup_test_data;

  -- %beforeeach: runs before EACH test
  PROCEDURE reset_state IS
  BEGIN
    -- Ensure we start each test with a clean order state
    DELETE FROM orders WHERE customer_id = 99999;
    g_test_order_id := NULL;
  END reset_state;

  -- %aftereach: runs after EACH test
  PROCEDURE verify_no_side_effects IS
  BEGIN
    -- Verify the test didn't commit unexpected data
    ut.expect(
      (SELECT COUNT(*) FROM orders WHERE customer_id = 99999 AND status = 'SHIPPED')
    ).to_equal(0);
  END verify_no_side_effects;

  -- %test(Create order with valid customer)
  PROCEDURE test_create_order_valid IS
    l_new_order_id NUMBER;
  BEGIN
    -- Act
    order_mgmt_pkg.create_order(
      p_customer_id => g_test_customer_id,
      p_order_id    => l_new_order_id
    );

    -- Assert: order was created
    ut.expect(l_new_order_id).not_to_be_null();

    -- Assert: order has correct status
    ut.expect(order_mgmt_pkg.get_order_status(l_new_order_id))
      .to_equal('PENDING');

    -- Assert: order exists in table
    ut.expect(
      (SELECT COUNT(*) FROM orders WHERE order_id = l_new_order_id)
    ).to_equal(1);
  END test_create_order_valid;

  -- %test(Create order with null customer raises exception)
  -- %throws(-20001)
  PROCEDURE test_create_order_null_customer IS
    l_order_id NUMBER;
  BEGIN
    -- When NULL is passed, should raise ORA-20001
    order_mgmt_pkg.create_order(
      p_customer_id => NULL,
      p_order_id    => l_order_id
    );
    -- utPLSQL catches the exception and verifies it matches %throws
  END test_create_order_null_customer;

  -- %test(Get order status for known order)
  PROCEDURE test_get_order_status IS
    l_order_id NUMBER;
    l_status   VARCHAR2(20);
  BEGIN
    -- Arrange: create order
    INSERT INTO orders (customer_id, status, created_at)
    VALUES (g_test_customer_id, 'PENDING', SYSDATE)
    RETURNING order_id INTO l_order_id;

    -- Act
    l_status := order_mgmt_pkg.get_order_status(l_order_id);

    -- Assert
    ut.expect(l_status).to_equal('PENDING');
  END test_get_order_status;

  -- %test(Get order status returns NULL for unknown order)
  PROCEDURE test_get_status_unknown_order IS
    l_status VARCHAR2(20);
  BEGIN
    l_status := order_mgmt_pkg.get_order_status(-999);
    ut.expect(l_status).to_be_null();
  END test_get_status_unknown_order;

  -- %disabled
  -- %test(Integration test - skip in unit test run)
  PROCEDURE test_full_order_workflow IS
  BEGIN
    NULL;  -- disabled, won't run
  END test_full_order_workflow;

END test_order_mgmt_pkg;
/
```

---

## Annotations Reference

| Annotation | Location | Description |
|---|---|---|
| `-- %suite` | Package spec | Marks as test suite; optional display name in parentheses |
| `-- %suitepath(path)` | Package spec | Hierarchical path for organizing suites (e.g., `myapp.orders`) |
| `-- %test` | Procedure spec | Marks as a test; optional display name |
| `-- %beforeall` | Procedure spec | Runs once before all tests in suite |
| `-- %afterall` | Procedure spec | Runs once after all tests in suite |
| `-- %beforeeach` | Procedure spec | Runs before each test in suite |
| `-- %aftereach` | Procedure spec | Runs after each test in suite |
| `-- %throws(error_code)` | Test procedure | Expected exception; test passes if this error is raised |
| `-- %disabled` | Procedure spec | Skip this test in test runs |
| `-- %context(name)` | Inline | Groups tests within a suite into sub-contexts |
| `-- %endcontext` | Inline | Ends a context group |
| `-- %tags(tag1,tag2)` | Test/Suite | Tag for selective test running |

---

## Full Assertion API

### Basic Expectations

```sql
-- Equality
ut.expect(actual_value).to_equal(expected_value);
ut.expect(actual_value).not_to_equal(expected_value);

-- NULL checks
ut.expect(l_var).to_be_null();
ut.expect(l_var).not_to_be_null();

-- Boolean
ut.expect(l_flag).to_be_true();
ut.expect(l_flag).to_be_false();

-- Numeric comparisons
ut.expect(l_count).to_be_greater_than(0);
ut.expect(l_count).to_be_greater_or_equal(1);
ut.expect(l_count).to_be_less_than(100);
ut.expect(l_count).to_be_less_or_equal(99);
ut.expect(l_count).to_be_between(1, 99);

-- Like pattern
ut.expect(l_message).to_be_like('%ERROR%');
ut.expect(l_message).not_to_be_like('%SUCCESS%');

-- Case insensitive match
ut.expect(l_name).to_be_like_ignoring_case('%smith%');
```

### Collection and Cursor Assertions

```sql
-- Comparing result sets (most powerful assertion)
DECLARE
  l_actual   SYS_REFCURSOR;
  l_expected SYS_REFCURSOR;
BEGIN
  -- Open actual results cursor
  OPEN l_actual FOR
    SELECT * FROM orders WHERE customer_id = 99999 ORDER BY order_id;

  -- Open expected results cursor
  OPEN l_expected FOR
    SELECT * FROM (
      VALUES ROW(1001, 99999, 'PENDING', SYSDATE),
             ROW(1002, 99999, 'SHIPPED', SYSDATE - 1)
    ) t(order_id, customer_id, status, created_at)
    ORDER BY order_id;

  ut.expect(l_actual).to_equal(l_expected);
END;

-- Cursor with column exclusions (ignore timestamps in comparison)
ut.expect(l_actual).to_equal(l_expected)
  .exclude_columns(ut_varchar2_list('created_at', 'updated_at'));

-- Cursor unordered comparison
ut.expect(l_actual).to_equal(l_expected).unordered;

-- Collection assertion
DECLARE
  l_actual   ut_varchar2_list;
  l_expected ut_varchar2_list;
BEGIN
  -- ... populate l_actual from function under test ...
  l_expected := ut_varchar2_list('Alice', 'Bob', 'Carol');

  ut.expect(l_actual).to_equal(l_expected);
END;
```

### Exception Testing

```sql
-- Method 1: %throws annotation (cleanest for single expected exception)
-- %throws(-20001)
PROCEDURE test_invalid_input IS
BEGIN
  validate_customer(NULL);  -- should raise ORA-20001
END;

-- Method 2: Inline exception test with ut.expect().to_throw()
PROCEDURE test_multiple_exception_cases IS
BEGIN
  -- Test that procedure raises when called with bad data
  ut.expect(
    PROCEDURE() IS BEGIN validate_customer(NULL); END;
  ).to_throw(-20001);

  ut.expect(
    PROCEDURE() IS BEGIN validate_customer(-1); END;
  ).to_throw(-20002, 'negative customer id');
END;
```

---

## Test Data Isolation Strategies

### Strategy 1: Rollback via Savepoints (Default utPLSQL Behavior)

utPLSQL wraps each test in a transaction. By default it does NOT rollback — your tests must manage transactions.

```sql
-- Best practice: don't commit in tests
-- Use ROLLBACK or rely on test cleanup procedures

-- %beforeeach
PROCEDURE reset_state IS
BEGIN
  ROLLBACK;  -- undo anything from previous test
  DELETE FROM orders WHERE customer_id = 99999;
END reset_state;
```

### Strategy 2: Autonomous Transaction for Test Data

```sql
-- Insert test data that survives the test transaction context
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

### Strategy 3: Dedicated Test Schema

Run tests in a schema that mirrors production, populated with known test data. Reset the schema between test runs using a schema refresh script.

---

## Running Tests

### From SQL*Plus or SQLcl

```sql
-- Run all tests visible to current user
BEGIN ut.run(); END;
/

-- Run specific suite
BEGIN ut.run('test_order_mgmt_pkg'); END;
/

-- Run tests by path
BEGIN ut.run('myapp.orders'); END;
/

-- Run specific test
BEGIN ut.run('test_order_mgmt_pkg.test_create_order_valid'); END;
/

-- Run with specific reporter
BEGIN
  ut.run(
    a_paths    => ut_varchar2_list(':myapp'),
    a_reporter => ut_documentation_reporter()
  );
END;
/
```

### JUnit XML Output (for CI/CD)

```bash
# Using the utPLSQL CLI (recommended for CI/CD)
# https://github.com/utPLSQL/utPLSQL-cli

utplsql run user/password@//host:1521/service \
  -p=':myapp' \
  -f=ut_junit_reporter \
  -o=test-results.xml \
  -c  # enable color output
```

```sql
-- From SQL, generate JUnit XML to a file
DECLARE
  l_reporter  ut_junit_reporter := ut_junit_reporter();
  l_file      UTL_FILE.FILE_TYPE;
BEGIN
  ut.run(
    a_paths    => ut_varchar2_list(':myapp'),
    a_reporter => l_reporter
  );

  -- Write XML output to file
  l_file := UTL_FILE.FOPEN('TEST_OUTPUT_DIR', 'results.xml', 'w', 32767);
  FOR line IN (
    SELECT column_value FROM TABLE(l_reporter.get_lines())
  ) LOOP
    UTL_FILE.PUT_LINE(l_file, line.column_value);
  END LOOP;
  UTL_FILE.FCLOSE(l_file);
END;
/
```

### Available Reporters

| Reporter | Output Format | Use Case |
|---|---|---|
| `ut_documentation_reporter` | Human-readable text | Local development |
| `ut_junit_reporter` | JUnit XML | CI/CD (Jenkins, GitLab CI, GitHub Actions) |
| `ut_sonar_test_reporter` | SonarQube format | SonarQube integration |
| `ut_teamcity_reporter` | TeamCity format | JetBrains TeamCity |
| `ut_tap_reporter` | TAP (Test Anything Protocol) | Generic CI tools |
| `ut_coveralls_reporter` | Coveralls JSON | Coveralls code coverage service |

---

## Code Coverage Reporting

```sql
-- Enable coverage collection during test run
BEGIN
  ut.run(
    a_paths              => ut_varchar2_list(':myapp'),
    a_reporter           => ut_documentation_reporter(),
    a_coverage_schemes   => ut_varchar2_list('MY_APP_SCHEMA'),
    a_coverage_reporter  => ut_coverage_sonarqube_reporter()
  );
END;
/

-- View coverage results
SELECT object_name, object_type,
       covered_lines,
       total_lines,
       ROUND(covered_lines / NULLIF(total_lines, 0) * 100, 1) AS pct_covered
FROM   ut3.ut_coverage_results
ORDER BY pct_covered;
```

---

## Mocking with utPLSQL

utPLSQL supports procedure/function mocking through the `ut_mock` API (available in utPLSQL v3.1+).

```sql
-- Simple mock: stub a dependency
-- The code under test calls external_service_pkg.send_email()
-- We mock it so tests don't actually send emails

-- %test(Order confirmation email is triggered)
PROCEDURE test_order_email_sent IS
BEGIN
  -- Set up mock: record calls to send_email
  ut_mock.set_mock(
    a_object_name  => 'external_service_pkg',
    a_method_name  => 'send_email',
    a_return_value => TRUE
  );

  -- Act: process order (which internally calls send_email)
  order_mgmt_pkg.create_order(p_customer_id => 99999, p_order_id => l_id);

  -- Assert: send_email was called exactly once
  ut_mock.verify_call_count(
    a_object_name => 'external_service_pkg',
    a_method_name => 'send_email',
    a_times       => 1
  );
END test_order_email_sent;
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: PL/SQL Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      oracle:
        image: gvenzl/oracle-xe:21-slim
        env:
          ORACLE_PASSWORD: test_password
        ports:
          - 1521:1521

    steps:
      - uses: actions/checkout@v3

      - name: Run utPLSQL tests
        run: |
          utplsql run system/test_password@//localhost:1521/XEPDB1 \
            -p=':myapp' \
            -f=ut_junit_reporter \
            -o=test-results/results.xml

      - name: Publish Test Results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: test-results/results.xml
```

---

## Best Practices

- Write tests before or alongside the code (TDD or parallel development).
- Each test procedure should test exactly ONE behavior or scenario.
- Use `%beforeeach` for state that changes per test; use `%beforeall` for expensive setup that can be shared.
- Never use hardcoded IDs that might conflict with existing data — use sequences or known-safe ranges.
- Test both the happy path AND error conditions (`%throws`).
- Cursor assertions are the most powerful way to test data-returning functions — use them instead of COUNT(*) checks.
- Use `.exclude_columns()` to ignore non-deterministic columns like `created_at` in cursor comparisons.
- Aim for > 80% code coverage as a minimum; focus on branch coverage, not just line coverage.
- Integrate tests into CI/CD pipelines — run on every commit.
- Use `-- %tags` to separate fast unit tests from slow integration tests.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Committing in test procedures | Leaves permanent test data in DB | Use `ROLLBACK` in `%aftereach` or avoid commits |
| Testing implementation details (not behavior) | Tests break on refactor | Test via the public API only |
| No teardown | Test data accumulates, causing future test failures | Always have `%afterall` cleanup |
| Hardcoded IDs in test data | Conflicts with other data | Use sequences, or known-safe negative/large IDs |
| Using `WHEN OTHERS THEN NULL` in tests | Test always passes even when code throws | Never swallow exceptions in test procedures |
| Asserting only COUNT(*) | Doesn't validate actual data values | Use cursor assertions for full content validation |
| Not testing edge cases | Happy-path-only coverage | Add tests for NULL inputs, empty sets, boundary values |

---

## Sources

- [utPLSQL Documentation](https://utplsql.org/utPLSQL/latest/) — annotations, assertion API, reporters, coverage, mocking
- [utPLSQL GitHub Repository](https://github.com/utPLSQL/utPLSQL) — installation, v3.x release notes
- [utPLSQL-cli GitHub Repository](https://github.com/utPLSQL/utPLSQL-cli) — CLI runner, JUnit XML output
