# PL/SQL Security

## Overview

PL/SQL security encompasses how stored code exercises database privileges, how it resists SQL injection, and how it avoids unintended privilege escalation. Oracle provides a sophisticated rights model and a set of validation utilities (`DBMS_ASSERT`) that, when used correctly, make PL/SQL code resilient against common attack vectors.

---

## AUTHID: Definer Rights vs Invoker Rights

Every PL/SQL unit runs under either **definer rights** (default) or **invoker rights** (`AUTHID CURRENT_USER`). This determines which schema's privileges are used when the code executes.

### Definer Rights (Default: AUTHID DEFINER)

The code runs with the privileges of the schema that owns it, regardless of who calls it.

```sql
-- Owned by schema APP_OWNER
CREATE OR REPLACE PROCEDURE definer_example
  AUTHID DEFINER  -- this is the default; can be omitted
AS
BEGIN
  -- Executes as APP_OWNER
  -- APP_OWNER must have SELECT on sensitive_data
  -- The caller (PUBLIC, another user) does NOT need this privilege
  INSERT INTO sensitive_data (col1) VALUES ('test');
END definer_example;
/
```

**When to use definer rights**:
- The procedure accesses a specific schema's tables and should abstract privilege details from callers
- You want to grant execute on the procedure instead of granting direct table access
- Implementing a controlled API layer where callers cannot directly access underlying tables

**Security implication**: The calling user can perform actions they do not have direct privileges for. This is by design for controlled APIs, but becomes a risk if the procedure has SQL injection vulnerabilities — an attacker can exploit the elevated privilege context.

### Invoker Rights (AUTHID CURRENT_USER)

The code runs with the privileges of the calling user. Object references are resolved in the caller's schema.

```sql
-- Generic utility that operates in the caller's context
CREATE OR REPLACE PROCEDURE invoker_example
  AUTHID CURRENT_USER
AS
BEGIN
  -- Executes as the CALLING user
  -- Table 'my_log' is resolved in the caller's schema, not APP_OWNER's schema
  INSERT INTO my_log (log_time, message) VALUES (SYSDATE, 'Called');
  -- ^ Each caller must have INSERT on their own my_log table
END invoker_example;
/
```

**When to use invoker rights**:
- Utility procedures that should operate on the caller's own objects
- Generic logging, auditing, or batch framework code
- Multi-tenant systems where each tenant has identical schema structure
- Avoiding unintended privilege escalation

### Side-by-Side Comparison

| Aspect | Definer Rights | Invoker Rights |
|---|---|---|
| Privileges used | Owner of the procedure | Caller of the procedure |
| Object resolution | Owner's schema | Caller's schema |
| Caller needs table privileges | No | Yes |
| Use for shared APIs | Yes | No |
| Use for generic utilities | Risky | Preferred |
| Privilege escalation risk | Higher | Lower |
| Default | Yes | No (must specify) |

```sql
-- Pattern: definer rights for data access layer
-- APP_OWNER grants EXECUTE to app role; no direct table grants
CREATE OR REPLACE PACKAGE customer_api_pkg
  AUTHID DEFINER
AS
  FUNCTION get_customer(p_id IN NUMBER) RETURN customers%ROWTYPE;
  PROCEDURE update_customer_email(p_id IN NUMBER, p_email IN VARCHAR2);
END customer_api_pkg;
/
-- GRANT EXECUTE ON customer_api_pkg TO app_role;
-- Revoke direct table access from app_role — only pkg access allowed
```

---

## SQL Injection Vectors in PL/SQL

SQL injection occurs when attacker-controlled data is concatenated into a SQL or PL/SQL statement. In PL/SQL, this is most common in dynamic SQL.

### Vulnerable Pattern

```sql
-- VULNERABLE: user input concatenated directly
CREATE OR REPLACE PROCEDURE get_employee_bad(
  p_name IN VARCHAR2
) AS
  l_sql   VARCHAR2(1000);
  l_count NUMBER;
BEGIN
  -- If p_name = "' OR '1'='1" then this returns all rows
  -- If p_name = "' ; DROP TABLE employees;--" Oracle ignores (EXECUTE IMMEDIATE is single-stmt)
  -- But: "' UNION SELECT password,null,null FROM dba_users--" leaks data
  l_sql := 'SELECT COUNT(*) FROM employees WHERE last_name = ''' || p_name || '''';
  EXECUTE IMMEDIATE l_sql INTO l_count;
  DBMS_OUTPUT.PUT_LINE(l_count);
END get_employee_bad;
/
```

### Safe Pattern: Bind Variables

```sql
-- SAFE: bind variable — p_name is data, never SQL syntax
CREATE OR REPLACE PROCEDURE get_employee_safe(
  p_name IN VARCHAR2
) AS
  l_count NUMBER;
BEGIN
  EXECUTE IMMEDIATE
    'SELECT COUNT(*) FROM employees WHERE last_name = :1'
    INTO l_count USING p_name;
  DBMS_OUTPUT.PUT_LINE(l_count);
END get_employee_safe;
/
```

### When Bind Variables Cannot Be Used

Table names, column names, and schema names cannot be bind variables — they are structural SQL components. For these, use `DBMS_ASSERT` to validate input before concatenation.

---

## DBMS_ASSERT Functions

`DBMS_ASSERT` provides validation routines that raise exceptions for invalid or potentially malicious input before it is used in dynamic SQL.

```sql
-- Validate that input is a simple SQL name (no special characters)
BEGIN
  DBMS_ASSERT.SIMPLE_SQL_NAME('employees');     -- OK: returns 'employees'
  DBMS_ASSERT.SIMPLE_SQL_NAME('my table');      -- RAISES ORA-44003: invalid SQL name
  DBMS_ASSERT.SIMPLE_SQL_NAME('emp;DROP TABLE');-- RAISES ORA-44003
END;

-- Validate that input is an existing schema object
BEGIN
  DBMS_ASSERT.SQL_OBJECT_NAME('SCOTT.EMPLOYEES'); -- OK if object exists
  DBMS_ASSERT.SQL_OBJECT_NAME('nonexistent_obj'); -- RAISES ORA-44002: not found
END;

-- Safely quote a string literal
DECLARE
  l_safe_val VARCHAR2(200);
BEGIN
  -- ENQUOTE_LITERAL wraps in single quotes and doubles any embedded quotes
  l_safe_val := DBMS_ASSERT.ENQUOTE_LITERAL('O''Brien');
  -- Returns: 'O''Brien'  (safe for embedding in SQL string literal)
  DBMS_OUTPUT.PUT_LINE(l_safe_val);
END;

-- Safely quote an identifier (object name)
DECLARE
  l_table_name VARCHAR2(100) := 'MY TABLE';  -- has a space
  l_quoted     VARCHAR2(100);
BEGIN
  -- ENQUOTE_NAME wraps in double quotes for use as identifier
  l_quoted := DBMS_ASSERT.ENQUOTE_NAME('MY TABLE', FALSE);
  -- Returns: "MY TABLE"  (valid quoted identifier)
  DBMS_OUTPUT.PUT_LINE(l_quoted);
END;
```

### DBMS_ASSERT Functions Reference

| Function | Purpose | Raises |
|---|---|---|
| `SIMPLE_SQL_NAME(str)` | Validates name has no special chars, spaces, or SQL keywords | ORA-44003 |
| `QUALIFIED_SQL_NAME(str)` | Validates schema.object[.subobject] format | ORA-44004 |
| `SQL_OBJECT_NAME(str)` | Validates name AND verifies the object exists | ORA-44002 |
| `SCHEMA_NAME(str)` | Validates and verifies the schema exists | ORA-44001 |
| `ENQUOTE_LITERAL(str)` | Quotes string as a literal value (single quotes, escapes embedded quotes) | None documented |
| `ENQUOTE_NAME(str, capitalize)` | Quotes identifier with double quotes | None documented |
| `NOOP(str)` | Returns string unchanged; documents that no validation was performed | Never |

### Safe Dynamic DDL Pattern

```sql
CREATE OR REPLACE PROCEDURE create_partition(
  p_table_name     IN VARCHAR2,
  p_partition_name IN VARCHAR2,
  p_upper_bound    IN DATE
) AS
  l_table     VARCHAR2(128);
  l_partition VARCHAR2(128);
  l_sql       VARCHAR2(500);
BEGIN
  -- Validate inputs before use in dynamic DDL
  l_table     := DBMS_ASSERT.SIMPLE_SQL_NAME(p_table_name);
  l_partition := DBMS_ASSERT.SIMPLE_SQL_NAME(p_partition_name);

  -- Date value: use TO_CHAR to produce a safe literal (no injection possible with dates)
  l_sql := 'ALTER TABLE ' || l_table ||
           ' ADD PARTITION ' || l_partition ||
           ' VALUES LESS THAN (DATE ''' ||
           TO_CHAR(p_upper_bound, 'YYYY-MM-DD') || ''')';

  EXECUTE IMMEDIATE l_sql;
END create_partition;
/
```

---

## Privilege Escalation Risks with Definer Rights

A definer rights procedure that contains SQL injection vulnerability gives the attacker the owner's privileges, not the caller's. This is the most dangerous form of SQL injection in Oracle.

```sql
-- Owned by DBA_TOOLS (a DBA schema)
-- Has SELECT ANY TABLE privilege
CREATE OR REPLACE PROCEDURE report_generator(
  p_table_name IN VARCHAR2
) AUTHID DEFINER AS
  l_sql    VARCHAR2(500);
  l_count  NUMBER;
BEGIN
  -- VULNERABLE: DBA privilege + SQL injection = attacker reads any table
  l_sql := 'SELECT COUNT(*) FROM ' || p_table_name;
  EXECUTE IMMEDIATE l_sql INTO l_count;
  DBMS_OUTPUT.PUT_LINE(l_count);
END;
-- Attacker passes: 'SYS.USER$ WHERE ROWNUM=1 UNION SELECT username FROM dba_users--'
-- Result: attacker reads DBA_USERS using DBA_TOOLS' SELECT ANY TABLE privilege
```

**Mitigation checklist for definer rights procedures with dynamic SQL**:
1. Use bind variables for all data values
2. Use `DBMS_ASSERT` to validate all structural SQL components (table names, column names)
3. Maintain a whitelist of permitted table/column names in a control table, and validate against it
4. Avoid `SELECT ANY TABLE` or `DBA` roles for schemas owning accessible PL/SQL

---

## Secure Coding Checklist

```
[ ] All dynamic SQL uses bind variables for data values
[ ] Table/column names in dynamic SQL are validated with DBMS_ASSERT.SIMPLE_SQL_NAME
[ ] Definer rights procedures do not grant callers elevated privileges unintentionally
[ ] Error messages do not expose internal schema names or SQL structure to end users
[ ] DBMS_ASSERT.SQL_OBJECT_NAME used when an object must exist before use
[ ] No hardcoded credentials in PL/SQL source
[ ] EXECUTE IMMEDIATE used with USING clause (bind variables), not concatenation
[ ] Sensitive procedures use AUTHID CURRENT_USER where caller's privileges are appropriate
[ ] Package specs do not expose internal types or cursors that shouldn't be public
[ ] Audit logging includes the calling user (SYS_CONTEXT('USERENV','SESSION_USER'))
```

---

## Oracle Database Vault Context

Oracle Database Vault (optional licensed feature) adds realm-based access control on top of standard Oracle privileges. Even accounts with DBA role can be blocked from accessing application data if Database Vault realms are properly configured.

```sql
-- Check if Database Vault is enabled
SELECT parameter, value FROM v$option WHERE parameter = 'Oracle Database Vault';

-- In a Vault-enabled database, check realm membership before granting access
-- This is typically done by the Vault administrator, not application code

-- Application code can read the current Vault session context
SELECT SYS_CONTEXT('DVSYS', 'ROLE') FROM DUAL;  -- current realm role

-- Code factor example: restrict execution based on IP or authentication method
-- (Configured in Vault, readable in PL/SQL via SYS_CONTEXT)
IF SYS_CONTEXT('DVSYS', 'NETWORK_IP_ADDRESS') NOT LIKE '10.0.%' THEN
  RAISE_APPLICATION_ERROR(-20403, 'Access denied from this network location');
END IF;
```

---

## Additional Security Patterns

### Restricting Package Access (12.2+)

```sql
-- Only allow specific packages to call sensitive_ops_pkg
CREATE OR REPLACE PACKAGE sensitive_ops_pkg
  ACCESSIBLE BY (PACKAGE order_processor_pkg, PACKAGE batch_runner_pkg)
AS
  PROCEDURE delete_order(p_id IN NUMBER);
END sensitive_ops_pkg;
/
-- Calling sensitive_ops_pkg from any other unit raises PLS-00904
```

### Avoiding Data Leakage in Error Messages

```sql
-- WRONG: exposes internal SQL structure
EXCEPTION
  WHEN OTHERS THEN
    RAISE_APPLICATION_ERROR(-20001,
      'Error in: SELECT * FROM ' || l_table_name || ' - ' || SQLERRM);

-- RIGHT: generic message to client, full detail in internal log
EXCEPTION
  WHEN OTHERS THEN
    error_logger_pkg.log_error('ORDER_PKG', 'PROCESS_ORDER');
    RAISE_APPLICATION_ERROR(-20001, 'An internal error occurred. Reference: ' || l_log_id);
```

### Secure Logon Trigger Pattern

```sql
-- Set application context at login for use in RLS policies
CREATE OR REPLACE TRIGGER app_logon_trigger
  AFTER LOGON ON SCHEMA
BEGIN
  DBMS_SESSION.SET_CONTEXT(
    namespace => 'APP_SECURITY',
    attribute => 'AUTHENTICATED_USER',
    value     => SYS_CONTEXT('USERENV', 'SESSION_USER')
  );
  DBMS_SESSION.SET_CONTEXT(
    namespace => 'APP_SECURITY',
    attribute => 'CLIENT_HOST',
    value     => SYS_CONTEXT('USERENV', 'HOST')
  );
END app_logon_trigger;
/
```

---

## Common Mistakes and Anti-Patterns

| Anti-Pattern | Risk | Mitigation |
|---|---|---|
| String concatenation in dynamic SQL | SQL injection | Bind variables + `DBMS_ASSERT` |
| Definer rights on SQL-injection-vulnerable code | Privilege escalation | Fix injection first; consider invoker rights |
| Exposing schema structure in error messages | Information leakage | Generic errors to clients; internal logging |
| Granting `EXECUTE ANY PROCEDURE` | Caller can run all definer-rights code | Grant execute on specific procedures only |
| Hardcoded passwords in PL/SQL | Credential exposure | Use Oracle Wallet, database links with no password in source |
| No validation of `p_table_name` before DDL | Table name injection | `DBMS_ASSERT.SIMPLE_SQL_NAME` + whitelist |
| `NOOP` used as "validation" | No actual validation performed | Use actual `DBMS_ASSERT` validation functions |
| SELECT ANY TABLE on app schema | Any app proc can read any data | Restrict to specific tables via grants |

---

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

- **Oracle 12.2+**: `ACCESSIBLE BY` clause enforces compile-time access control between PL/SQL units.
- **Oracle 12c+**: `DBMS_PRIVILEGE_CAPTURE` enables privilege analysis — identifies which privileges are actually used, helping implement least privilege.
- **Oracle 18c+**: `DEFAULT COLLATION` and `COLLATION` on individual columns can affect string comparison in dynamic SQL — validate that DBMS_ASSERT behavior is consistent with collation settings.
- **All versions**: `DBMS_ASSERT` has been available since Oracle 10.2; use it consistently in all PL/SQL handling user-supplied identifiers in dynamic SQL.

---

## Sources

- [Oracle Database PL/SQL Language Reference 19c — AUTHID Clause](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/AUTHID-clause.html) — definer rights vs invoker rights
- [DBMS_ASSERT (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_ASSERT.html) — SQL_OBJECT_NAME, SIMPLE_SQL_NAME, ENQUOTE_LITERAL, NOOP
- [Oracle Database Security Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/) — privilege analysis, application context, RLS
- [Oracle Database PL/SQL Language Reference 19c — ACCESSIBLE BY Clause](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/ACCESSIBLE-BY-clause.html) — 12.2+ compile-time access control
