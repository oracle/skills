# PL/SQL Package Design

## Overview

Packages are the fundamental unit of modular programming in PL/SQL. They group related procedures, functions, types, variables, and constants into a single named object. Well-designed packages improve maintainability, performance (compiled once, loaded once per session), and enable information hiding through public/private API separation.

---

## Package Architecture Principles

A package has two parts:

- **Package Specification (Spec)**: The public interface — what callers can see and use.
- **Package Body**: The implementation — private members and the code behind the spec.

The spec is compiled independently. When only the body changes, dependent objects remain valid, reducing recompilation cascades.

```sql
-- Specification: public API
CREATE OR REPLACE PACKAGE order_mgmt_pkg AS

  -- Public type
  TYPE t_order_status IS TABLE OF VARCHAR2(30) INDEX BY PLS_INTEGER;

  -- Public constants
  c_status_pending   CONSTANT VARCHAR2(10) := 'PENDING';
  c_status_shipped   CONSTANT VARCHAR2(10) := 'SHIPPED';
  c_status_cancelled CONSTANT VARCHAR2(10) := 'CANCELLED';

  -- Public procedures/functions
  PROCEDURE create_order(
    p_customer_id IN  orders.customer_id%TYPE,
    p_order_id    OUT orders.order_id%TYPE
  );

  FUNCTION get_order_status(
    p_order_id IN orders.order_id%TYPE
  ) RETURN VARCHAR2;

  PROCEDURE cancel_order(
    p_order_id IN orders.order_id%TYPE,
    p_reason   IN VARCHAR2 DEFAULT NULL
  );

END order_mgmt_pkg;
/

-- Body: implementation + private members
CREATE OR REPLACE PACKAGE BODY order_mgmt_pkg AS

  -- Private constant (not visible to callers)
  c_max_retries CONSTANT PLS_INTEGER := 3;

  -- Private procedure (not in spec)
  PROCEDURE log_order_event(
    p_order_id IN orders.order_id%TYPE,
    p_event    IN VARCHAR2
  ) IS
    PRAGMA AUTONOMOUS_TRANSACTION;
  BEGIN
    INSERT INTO order_audit_log (order_id, event_time, event_desc)
    VALUES (p_order_id, SYSTIMESTAMP, p_event);
    COMMIT;
  END log_order_event;

  -- Public procedure implementation
  PROCEDURE create_order(
    p_customer_id IN  orders.customer_id%TYPE,
    p_order_id    OUT orders.order_id%TYPE
  ) IS
  BEGIN
    INSERT INTO orders (customer_id, status, created_at)
    VALUES (p_customer_id, c_status_pending, SYSDATE)
    RETURNING order_id INTO p_order_id;

    log_order_event(p_order_id, 'ORDER_CREATED');
    COMMIT;
  END create_order;

  FUNCTION get_order_status(
    p_order_id IN orders.order_id%TYPE
  ) RETURN VARCHAR2 IS
    l_status orders.status%TYPE;
  BEGIN
    SELECT status INTO l_status
    FROM   orders
    WHERE  order_id = p_order_id;
    RETURN l_status;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN NULL;
  END get_order_status;

  PROCEDURE cancel_order(
    p_order_id IN orders.order_id%TYPE,
    p_reason   IN VARCHAR2 DEFAULT NULL
  ) IS
  BEGIN
    UPDATE orders
    SET    status     = c_status_cancelled,
           cancelled_at = SYSDATE,
           cancel_reason = p_reason
    WHERE  order_id = p_order_id;

    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20001, 'Order not found: ' || p_order_id);
    END IF;

    log_order_event(p_order_id, 'ORDER_CANCELLED');
    COMMIT;
  END cancel_order;

END order_mgmt_pkg;
/
```

---

## Spec vs Body Separation Strategy

| What belongs in SPEC | What belongs in BODY |
|---|---|
| Types used by callers | Private types |
| Public procedure/function signatures | All procedure/function bodies |
| Public constants | Private constants |
| Public variables (avoid if possible) | Private variables |
| Exceptions callers must catch | Private exceptions |
| Cursor declarations callers iterate | All cursor implementations |

**Rule of thumb**: If a caller does not need to reference it, keep it in the body. Minimizing the spec reduces coupling and recompilation.

---

## Designing Public vs Private APIs

### Public API Design Principles

1. **Stable signatures**: Changing a spec parameter breaks all dependents. Use default values to add parameters without breaking existing calls.
2. **Meaningful names**: `process_order` is better than `do_stuff`.
3. **Single responsibility**: Each procedure does one thing.
4. **Return values vs OUT parameters**: Functions returning a single value are more composable. Use procedures with OUT parameters for multiple outputs or DML operations.

```sql
-- Good: default parameter allows adding optional behavior
PROCEDURE process_payment(
  p_order_id      IN orders.order_id%TYPE,
  p_amount        IN NUMBER,
  p_currency      IN VARCHAR2 DEFAULT 'USD',  -- added later, no breaking change
  p_send_receipt  IN BOOLEAN  DEFAULT TRUE    -- added later, no breaking change
);
```

### Private Implementation Helpers

Keep implementation details private. Only promote to spec when another package genuinely needs it.

```sql
-- Private helper: validation logic callers never call directly
PROCEDURE validate_order_amount(
  p_amount   IN NUMBER,
  p_currency IN VARCHAR2
) IS
BEGIN
  IF p_amount <= 0 THEN
    RAISE_APPLICATION_ERROR(-20010, 'Amount must be positive');
  END IF;
  IF p_currency NOT IN ('USD', 'EUR', 'GBP') THEN
    RAISE_APPLICATION_ERROR(-20011, 'Unsupported currency: ' || p_currency);
  END IF;
END validate_order_amount;
```

---

## Package Initialization Blocks

A package body may have an optional initialization block that runs exactly once per session — the first time the package is referenced.

```sql
CREATE OR REPLACE PACKAGE BODY config_pkg AS

  g_env_name     VARCHAR2(50);
  g_debug_enabled BOOLEAN;

  -- Initialization block: runs once per session on first package reference
  BEGIN
    -- Load configuration from a settings table
    BEGIN
      SELECT setting_value
      INTO   g_env_name
      FROM   app_settings
      WHERE  setting_name = 'ENVIRONMENT';
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        g_env_name := 'UNKNOWN';
    END;

    g_debug_enabled := (g_env_name IN ('DEV', 'TEST'));
  END config_pkg;
/
```

### Package State Pitfalls with Connection Pooling

**This is a critical production concern.** Package-level variables (global state) are session-scoped. With connection pooling (JDBC, OCI, DRCP), a session may be reused across different logical users or requests. Package state from a previous user's request may persist.

```sql
-- DANGEROUS: package variable holds user-specific state
CREATE OR REPLACE PACKAGE session_context_pkg AS
  g_current_user_id NUMBER;  -- This persists across pool reuse!
  PROCEDURE set_user(p_user_id IN NUMBER);
  FUNCTION  get_user RETURN NUMBER;
END session_context_pkg;
/

-- SAFE ALTERNATIVE: use application context (SYS_CONTEXT)
-- Set at login via a logon trigger or app initialization call
BEGIN
  DBMS_SESSION.SET_CONTEXT(
    namespace => 'APP_CTX',
    attribute => 'USER_ID',
    value     => TO_CHAR(p_user_id)
  );
END;

-- Read anywhere, session-specific, not affected by pooling misconceptions
SELECT SYS_CONTEXT('APP_CTX', 'USER_ID') FROM DUAL;
```

### Safe Use of Package State

Package state is appropriate for:
- **Read-only configuration** loaded once from tables (environment flags, lookup maps)
- **Session-scoped caches** where staleness is acceptable and the session represents one user

```sql
CREATE OR REPLACE PACKAGE BODY lookup_cache_pkg AS

  TYPE t_code_map IS TABLE OF VARCHAR2(200) INDEX BY VARCHAR2(30);
  g_status_map t_code_map;
  g_map_loaded BOOLEAN := FALSE;

  PROCEDURE ensure_loaded IS
  BEGIN
    IF NOT g_map_loaded THEN
      FOR rec IN (SELECT code, description FROM status_codes) LOOP
        g_status_map(rec.code) := rec.description;
      END LOOP;
      g_map_loaded := TRUE;
    END IF;
  END ensure_loaded;

  FUNCTION get_status_desc(p_code IN VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
    ensure_loaded;
    IF g_status_map.EXISTS(p_code) THEN
      RETURN g_status_map(p_code);
    END IF;
    RETURN 'UNKNOWN';
  END get_status_desc;

END lookup_cache_pkg;
/
```

---

## Cohesion and Coupling

- **High cohesion**: Group procedures that operate on the same data or serve the same feature domain. `customer_pkg` handles customer operations, not order operations.
- **Low coupling**: Packages should not circularly depend on each other. If `pkg_a` calls `pkg_b` and vice versa, extract shared logic into a third package.

### Detecting Circular Dependencies

```sql
-- Check for circular dependencies in USER_DEPENDENCIES
SELECT referenced_name, name
FROM   user_dependencies
WHERE  type = 'PACKAGE BODY'
  AND  referenced_type IN ('PACKAGE', 'PACKAGE BODY')
ORDER BY referenced_name;
```

---

## Forward Declarations

Within a package body, a procedure defined after another cannot be called by the earlier one without a forward declaration:

```sql
CREATE OR REPLACE PACKAGE BODY mutual_pkg AS

  -- Forward declaration allows process_a to call process_b
  -- even though process_b is defined later
  PROCEDURE process_b(p_id IN NUMBER);

  PROCEDURE process_a(p_id IN NUMBER) IS
  BEGIN
    IF p_id > 0 THEN
      process_b(p_id - 1);  -- valid because of forward declaration
    END IF;
  END process_a;

  PROCEDURE process_b(p_id IN NUMBER) IS
  BEGIN
    DBMS_OUTPUT.PUT_LINE('Processing: ' || p_id);
    IF p_id > 0 THEN
      process_a(p_id - 1);
    END IF;
  END process_b;

END mutual_pkg;
/
```

---

## Overloading

The same procedure/function name can appear multiple times in a spec with different parameter signatures. Oracle resolves the call at compile time.

```sql
CREATE OR REPLACE PACKAGE format_pkg AS

  -- Overloaded: same name, different parameter types
  FUNCTION format_date(p_date IN DATE)      RETURN VARCHAR2;
  FUNCTION format_date(p_date IN TIMESTAMP) RETURN VARCHAR2;
  FUNCTION format_date(p_date IN DATE, p_fmt IN VARCHAR2) RETURN VARCHAR2;

END format_pkg;
/

CREATE OR REPLACE PACKAGE BODY format_pkg AS

  FUNCTION format_date(p_date IN DATE) RETURN VARCHAR2 IS
  BEGIN
    RETURN TO_CHAR(p_date, 'YYYY-MM-DD');
  END format_date;

  FUNCTION format_date(p_date IN TIMESTAMP) RETURN VARCHAR2 IS
  BEGIN
    RETURN TO_CHAR(p_date, 'YYYY-MM-DD HH24:MI:SS.FF3');
  END format_date;

  FUNCTION format_date(p_date IN DATE, p_fmt IN VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
    RETURN TO_CHAR(p_date, p_fmt);
  END format_date;

END format_pkg;
/
```

**Overloading restrictions**: Cannot overload based solely on return type. Cannot overload when the only difference is IN vs OUT mode. Cannot overload when parameter types differ only in PLS_INTEGER vs NUMBER (subtypes of the same family).

---

## Package Size Guidelines

Large packages are harder to maintain and cause longer compilation times. Consider splitting by:

| Signal | Action |
|---|---|
| Body exceeds ~1000-1500 lines | Split into sub-packages by feature area |
| Spec has 30+ public members | Review if all are truly public |
| Package mixes multiple domains | Split by domain (customer vs order vs payment) |
| Initialization block hits tables from many schemas | Extract to a dedicated config package |

---

## Best Practices

- Always create the spec first, then the body. This allows dependent objects to compile against the spec before the body exists.
- Use `NOCOPY` for large IN OUT collection parameters (see performance guide).
- Never put DML in a package initialization block — it runs implicitly and can cause unexpected commits or locks.
- Prefix package-level (global) variables with `g_` to distinguish from local variables.
- Anchor variable declarations to column types using `%TYPE` to survive schema changes.
- Document the spec with comments; it serves as the API documentation.

---

## Common Mistakes and Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Public package variables | Callers depend on internal state directly; hard to change | Use getter/setter functions |
| Storing user identity in package globals with connection pooling | State leaks across requests | Use application context (`DBMS_SESSION.SET_CONTEXT`) |
| Circular package dependencies | Cannot compile; maintenance nightmare | Extract shared types/utilities into a separate base package |
| One giant "utils" package | Zero cohesion; everything depends on it | Break into domain-specific packages |
| Business logic in initialization blocks | Runs silently on first reference; hard to debug | Use explicit initialization procedures |
| Recompiling spec for body-only changes | Invalidates all dependent objects | Change body only when logic changes; change spec only when API changes |

---

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

- **Oracle 12c+**: Invisible columns in tables do not affect `%ROWTYPE` in packages compiled before the column was added — recompile is needed.
- **Oracle 18c+**: Private procedures in the package spec (using `ACCESSIBLE BY` introduced in 12.2) allow fine-grained access control between packages.
- **Oracle 12.2+**: `ACCESSIBLE BY` clause allows restricting which units can call a package.

```sql
-- 12.2+: Restrict access to this package to only order_mgmt_pkg
CREATE OR REPLACE PACKAGE order_internals_pkg
  ACCESSIBLE BY (PACKAGE order_mgmt_pkg)
AS
  PROCEDURE internal_validate(p_order_id IN NUMBER);
END order_internals_pkg;
/
```

---

## Sources

- [Oracle Database PL/SQL Language Reference 19c — Packages](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-packages.html) — package structure, spec vs body, overloading, forward declarations, initialization
- [Oracle Database PL/SQL Language Reference 19c — ACCESSIBLE BY Clause](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/ACCESSIBLE-BY-clause.html) — 12.2+ access control
- [DBMS_SESSION (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SESSION.html) — SET_CONTEXT for application context
