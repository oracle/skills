# PL/SQL Compiler Options

## Overview

Oracle provides a rich set of compiler configuration parameters that control optimization level, execution model, conditional compilation, and environment-detection capabilities. Understanding these options allows developers to tune for performance, write environment-aware code, and implement edition-based release management.

---

## PLSQL_OPTIMIZE_LEVEL

Controls the aggressiveness of the PL/SQL optimizer. Higher levels produce faster code but may make debugging harder.

| Level | Name | Description |
|---|---|---|
| 0 | None | Maintains Oracle9i evaluation order, side effects, exceptions, and package initializations. Use only for debugging compatibility with very old code. |
| 1 | Basic | Applies wide-range optimizations including elimination of unnecessary computations and exceptions, but generally preserves original source order. Good balance for rapid development. |
| 2 | Standard | **Default.** Applies modern optimization techniques beyond level 1, including code movement optimizations. Best execution performance for most code. |
| 3 | Aggressive | Applies advanced optimizations beyond level 2 including automatic subprogram inlining. `PRAGMA INLINE 'YES'` at this level marks calls as high-priority for inlining. |

```sql
-- Set at session level (affects all subsequent compilations in session)
ALTER SESSION SET PLSQL_OPTIMIZE_LEVEL = 2;  -- default

-- Set for a specific compilation
ALTER PROCEDURE my_proc COMPILE PLSQL_OPTIMIZE_LEVEL = 3;

-- Set at system level (affects all sessions unless overridden)
ALTER SYSTEM SET PLSQL_OPTIMIZE_LEVEL = 2 SCOPE = BOTH;

-- Set in DDL for individual objects
CREATE OR REPLACE PROCEDURE fast_proc IS
  PRAGMA INLINE(helper_func, 'YES');  -- at level 2+, inline this call
BEGIN
  helper_func(42);
END fast_proc;
/
```

### PRAGMA INLINE (Optimizer Level 2+)

`PRAGMA INLINE` can direct the optimizer to inline (or not inline) specific function calls. It is effective at **optimizer level 2 and above**:

- At level 2: `'YES'` causes the call to be inlined; `'NO'` prevents inlining.
- At level 3: `'YES'` marks the call as high-priority for inlining (compiler still makes final decision); `'NO'` prevents inlining.

```sql
CREATE OR REPLACE FUNCTION calculate_tax(p_amount NUMBER) RETURN NUMBER IS
BEGIN
  RETURN ROUND(p_amount * 0.0825, 2);
END calculate_tax;
/

CREATE OR REPLACE PROCEDURE process_invoices IS
BEGIN
  FOR inv IN (SELECT invoice_id, amount FROM invoices) LOOP
    PRAGMA INLINE(calculate_tax, 'YES');  -- inline this call site
    UPDATE invoices
    SET    tax_amount = calculate_tax(inv.amount)
    WHERE  invoice_id = inv.invoice_id;
  END LOOP;
END process_invoices;
/
```

### Checking Current Optimization Level

```sql
-- Check optimization level of compiled objects
SELECT object_name, object_type, plsql_optimize_level
FROM   user_plsql_object_settings
WHERE  object_type IN ('PROCEDURE', 'FUNCTION', 'PACKAGE BODY');

-- Check session-level setting
SELECT value FROM v$parameter WHERE name = 'plsql_optimize_level';
```

---

## PLSQL_CODE_TYPE: INTERPRETED vs NATIVE

Controls whether PL/SQL is compiled to interpreted bytecode (the default) or native machine code.

| Setting | Description |
|---|---|
| `INTERPRETED` | Default. Compiled to PVM (PL/SQL Virtual Machine) bytecode. Interpreted at runtime. |
| `NATIVE` | Compiled to native C code, then to machine instructions. Faster for CPU-intensive code. |

```sql
-- Set at session level
ALTER SESSION SET PLSQL_CODE_TYPE = NATIVE;

-- Compile specific object as native
ALTER PROCEDURE number_crunch COMPILE PLSQL_CODE_TYPE = NATIVE;

-- Or in the CREATE statement
CREATE OR REPLACE PROCEDURE number_crunch IS
  PRAGMA PLSQL_CODE_TYPE NATIVE;
  -- Note: PRAGMA form is not the standard way; use ALTER or session setting
BEGIN
  -- CPU-intensive computation
END number_crunch;
/

-- Check what each object uses
SELECT object_name, object_type, plsql_code_type
FROM   user_plsql_object_settings
ORDER BY object_type, object_name;
```

### When Native Compilation Helps

Native compilation provides the most benefit for:
- **CPU-intensive numerical algorithms** (encryption, compression, scientific computing)
- **Tight loops** with complex PL/SQL logic
- **Rarely-called but compute-heavy** procedures where startup cost is less important

Native compilation provides **little or no benefit** for:
- Procedures that spend most time in SQL operations (SQL runs in the SQL engine regardless)
- I/O-bound operations
- Code that frequently calls Java stored procedures or external procedures

```sql
-- Profile to determine if native compilation helps
-- Before: run with INTERPRETED, record elapsed time
ALTER SESSION SET PLSQL_CODE_TYPE = INTERPRETED;
ALTER PROCEDURE my_compute_proc COMPILE;

SET TIMING ON
BEGIN my_compute_proc(1000000); END;
/

-- After: recompile as NATIVE
ALTER SESSION SET PLSQL_CODE_TYPE = NATIVE;
ALTER PROCEDURE my_compute_proc COMPILE;

BEGIN my_compute_proc(1000000); END;
/
-- Compare elapsed times; native is typically 10-30% faster for CPU-bound code
```

---

## Conditional Compilation

Conditional compilation allows different code to be included or excluded at compile time, based on boolean conditions and inquiry directives. The preprocessor runs before the normal PL/SQL compiler.

### Basic Syntax

```sql
-- $IF condition $THEN ... [$ELSIF condition $THEN ...] [$ELSE ...] $END
-- Note: no semicolons on preprocessor directives

CREATE OR REPLACE PROCEDURE conditional_example IS
  $IF $$debug_mode $THEN
    l_start_time TIMESTAMP := SYSTIMESTAMP;
  $END
BEGIN
  $IF $$debug_mode $THEN
    DBMS_OUTPUT.PUT_LINE('Starting at: ' || TO_CHAR(l_start_time, 'HH24:MI:SS.FF3'));
  $END

  process_data;

  $IF $$debug_mode $THEN
    DBMS_OUTPUT.PUT_LINE('Elapsed: ' ||
      EXTRACT(SECOND FROM (SYSTIMESTAMP - l_start_time)) || 's');
  $END
END conditional_example;
/
```

### Built-in Inquiry Directives

| Directive | Type | Description |
|---|---|---|
| `$$PLSQL_LINE` | PLS_INTEGER | Current line number in the source |
| `$$PLSQL_UNIT` | VARCHAR2 | Name of the current program unit |
| `$$PLSQL_UNIT_OWNER` | VARCHAR2 | Owner of the current program unit (12.2+) |
| `$$PLSQL_UNIT_TYPE` | VARCHAR2 | Type of the current unit (PROCEDURE, FUNCTION, etc.) (12.2+) |
| `$$PLSQL_CCFLAGS` | N/A | Set via the PLSQL_CCFLAGS parameter |
| `$$DEBUG` | BOOLEAN | Set by PLSQL_CCFLAGS; undefined by default |

```sql
-- Use built-in directives for self-aware error messages
CREATE OR REPLACE PROCEDURE self_aware_proc IS
BEGIN
  DBMS_OUTPUT.PUT_LINE(
    'Executing: ' || $$PLSQL_UNIT ||
    ' at line: '  || $$PLSQL_LINE
  );
  risky_operation;
EXCEPTION
  WHEN OTHERS THEN
    RAISE_APPLICATION_ERROR(-20001,
      'Error in ' || $$PLSQL_UNIT || ' line ' || $$PLSQL_LINE ||
      ': ' || SQLERRM);
END self_aware_proc;
/
```

---

## PLSQL_CCFLAGS: Compile-Time Constants

`PLSQL_CCFLAGS` defines custom boolean or integer compile-time constants used in `$IF` conditions.

```sql
-- Set flags at session level before compiling
ALTER SESSION SET PLSQL_CCFLAGS = 'debug_mode:TRUE, env_dev:TRUE, version:2';

-- Or set at system level (affects all future compilations)
ALTER SYSTEM SET PLSQL_CCFLAGS = 'debug_mode:FALSE, env_dev:FALSE, version:2' SCOPE = BOTH;

-- Use in code
CREATE OR REPLACE PROCEDURE env_aware_proc IS
BEGIN
  $IF $$debug_mode $THEN
    -- This block is compiled in only when debug_mode=TRUE
    DBMS_OUTPUT.PUT_LINE('[DEBUG] Entering env_aware_proc');
    DBMS_APPLICATION_INFO.SET_ACTION('ENV_AWARE_PROC:DEBUG');
  $ELSE
    DBMS_APPLICATION_INFO.SET_ACTION('ENV_AWARE_PROC');
  $END

  $IF $$version = 2 $THEN
    -- Version 2 code path
    process_v2;
  $ELSIF $$version = 1 $THEN
    -- Version 1 legacy code path
    process_v1;
  $ELSE
    -- Default
    process_default;
  $END
END env_aware_proc;
/
```

### Environment Detection Pattern

```sql
-- Compile with environment-specific behavior
-- Production: ALTER SESSION SET PLSQL_CCFLAGS = 'env_prod:TRUE, env_dev:FALSE';
-- Development: ALTER SESSION SET PLSQL_CCFLAGS = 'env_prod:FALSE, env_dev:TRUE';

CREATE OR REPLACE FUNCTION get_service_url(p_service IN VARCHAR2) RETURN VARCHAR2 IS
BEGIN
  $IF $$env_prod $THEN
    RETURN 'https://api.production.com/' || p_service;
  $ELSIF $$env_dev $THEN
    RETURN 'https://api.dev.internal/' || p_service;
  $ELSE
    -- Default to dev if no flag set
    RETURN 'https://api.dev.internal/' || p_service;
  $END
END get_service_url;
/
```

### Checking CCFLAGS on Compiled Objects

```sql
-- View PLSQL_CCFLAGS for each object
SELECT object_name, object_type, plsql_ccflags
FROM   user_plsql_object_settings
WHERE  plsql_ccflags IS NOT NULL;

-- View all settings for a specific object
SELECT *
FROM   user_plsql_object_settings
WHERE  object_name = 'ENV_AWARE_PROC'
  AND  object_type = 'PROCEDURE';
```

---

## Compile-Time Constants for Version Compatibility

Conditional compilation enables a single codebase to support multiple Oracle database versions.

```sql
-- DBMS_DB_VERSION provides Oracle version constants as compile-time values
CREATE OR REPLACE PROCEDURE version_compatible_proc IS
BEGIN
  $IF DBMS_DB_VERSION.VER_LE_12_1 $THEN
    -- Oracle 12.1 or earlier: use workaround
    legacy_12c_approach;
  $ELSIF DBMS_DB_VERSION.VER_LE_18 $THEN
    -- Oracle 12.2 through 18c
    intermediate_approach;
  $ELSE
    -- Oracle 19c+: use modern features
    modern_approach;
  $END
END version_compatible_proc;
/

-- DBMS_DB_VERSION constants available (confirmed in Oracle 19c documentation):
-- DBMS_DB_VERSION.VERSION       -- major version number (e.g., 19)
-- DBMS_DB_VERSION.RELEASE       -- release number (e.g., 0)
-- DBMS_DB_VERSION.VER_LE_9      -- Oracle <= 9
-- DBMS_DB_VERSION.VER_LE_9_1    -- Oracle <= 9.1
-- DBMS_DB_VERSION.VER_LE_9_2    -- Oracle <= 9.2
-- DBMS_DB_VERSION.VER_LE_10     -- Oracle <= 10
-- DBMS_DB_VERSION.VER_LE_10_1   -- Oracle <= 10.1
-- DBMS_DB_VERSION.VER_LE_10_2   -- Oracle <= 10.2
-- DBMS_DB_VERSION.VER_LE_11     -- Oracle <= 11
-- DBMS_DB_VERSION.VER_LE_11_1   -- Oracle <= 11.1
-- DBMS_DB_VERSION.VER_LE_11_2   -- Oracle <= 11.2
-- DBMS_DB_VERSION.VER_LE_12     -- Oracle <= 12
-- DBMS_DB_VERSION.VER_LE_12_1   -- Oracle <= 12.1
-- DBMS_DB_VERSION.VER_LE_12_2   -- Oracle <= 12.2
-- DBMS_DB_VERSION.VER_LE_18     -- Oracle <= 18c
-- DBMS_DB_VERSION.VER_LE_19     -- Oracle <= 19c
-- Note: VER_LE_21 is NOT present in Oracle 19c DBMS_DB_VERSION; available only in 21c+ installations
```

---

## Edition-Based Compilation

Edition-Based Redefinition (EBR), introduced in Oracle 11gR2, allows multiple versions of PL/SQL objects to coexist in the same schema using editions. This enables zero-downtime upgrades.

```sql
-- Check if EBR is enabled for the schema
SELECT editions_enabled FROM dba_users WHERE username = 'MY_APP';

-- Enable EBR for a schema (DBA action)
ALTER USER my_app ENABLE EDITIONS;

-- Create a new edition
CREATE EDITION v2_edition;
GRANT USE ON EDITION v2_edition TO my_app;

-- Switch to new edition for this session
ALTER SESSION SET EDITION = v2_edition;

-- Now compile the new version of the procedure
-- It exists only in v2_edition; the original is in ORA$BASE
CREATE OR REPLACE PROCEDURE get_order_status(p_id IN NUMBER) RETURN VARCHAR2 IS
  -- New version with enhanced logic
BEGIN
  -- ... new implementation ...
END get_order_status;
/

-- Crossedition trigger: keep old and new tables in sync during migration
CREATE OR REPLACE TRIGGER sync_new_column_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  FORWARD CROSSEDITION
BEGIN
  :NEW.new_status_column := map_status(:NEW.old_status_column);
END;
/

-- Once all sessions are on v2_edition, retire v1
-- ALTER DATABASE DEFAULT EDITION = v2_edition;
-- DROP EDITION ora$base CASCADE;  (careful: removes all v1 PL/SQL)
```

---

## Compiler Settings Best Practices

| Setting | Development | Test | Production |
|---|---|---|---|
| `PLSQL_OPTIMIZE_LEVEL` | 1 (for debugging) | 2 | 2 or 3 |
| `PLSQL_CODE_TYPE` | INTERPRETED | INTERPRETED | NATIVE for CPU-intensive only |
| `PLSQL_WARNINGS` | ENABLE:ALL | ENABLE:ALL | ENABLE:SEVERE only |
| `PLSQL_CCFLAGS` | `debug_mode:TRUE` | `debug_mode:FALSE` | `debug_mode:FALSE` |

```sql
-- Template: set session settings before bulk compile
ALTER SESSION SET PLSQL_OPTIMIZE_LEVEL  = 2;
ALTER SESSION SET PLSQL_CODE_TYPE       = INTERPRETED;
ALTER SESSION SET PLSQL_WARNINGS        = 'ENABLE:ALL';
ALTER SESSION SET PLSQL_CCFLAGS         = 'debug_mode:FALSE, env_prod:TRUE';

-- Recompile invalid objects after a settings change
BEGIN
  DBMS_UTILITY.COMPILE_SCHEMA(
    schema   => USER,
    compile_all => FALSE  -- FALSE = only invalid objects
  );
END;
/
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Deploying with OPTIMIZE_LEVEL=0 | Slow production code | Always use level 2+ for production |
| Using NATIVE compilation everywhere | Marginal gain, longer compile time | Profile first; apply selectively to CPU-bound code |
| PLSQL_CCFLAGS set inconsistently per object | Code compiled with different flags behaves differently | Use a compile script that sets flags uniformly before all DDL |
| Mixing conditional compilation and regular IF | Compile-time vs runtime confusion | `$IF` is processed at compile time; `IF` runs at runtime — don't confuse them |
| Not recording PLSQL_CCFLAGS in source control | Cannot reproduce the compiled binary exactly | Store the compile script (with flag settings) in source control |
| Forgetting `$END` | Compilation error: unterminated conditional | Always pair `$IF ... $THEN` with `$END` |

---

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

- **Oracle 10gR2+**: Conditional compilation (`$IF`, `$THEN`, `$ELSE`, `$END`, `PLSQL_CCFLAGS`) introduced.
- **Oracle 11gR2+**: Edition-Based Redefinition (EBR) for zero-downtime upgrades.
- **Oracle 12.2+**: `$$PLSQL_UNIT_OWNER` and `$$PLSQL_UNIT_TYPE` inquiry directives added.
- **Oracle 12cR1+**: `PRAGMA INLINE` for manual inlining hints — effective at optimizer level 2 (`'YES'` inlines the call) and level 3 (`'YES'` marks as high-priority for inlining).
- **Oracle 19c+**: `DBMS_DB_VERSION.VER_LE_19` is the highest VER_LE constant confirmed in 19c documentation. `VER_LE_21` is available only in 21c+ installations.

---

## See Also

- [PL/SQL Code Quality](../plsql/plsql-code-quality.md) — Naming conventions, anti-patterns, and code standards

## Sources

- Oracle Database 19c Reference — PLSQL_OPTIMIZE_LEVEL: https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/PLSQL_OPTIMIZE_LEVEL.html
- Oracle Database 19c PL/SQL Language Reference — INLINE Pragma: https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/INLINE-pragma.html
- Oracle Database 19c PL/SQL Packages Reference — DBMS_DB_VERSION: https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_DB_VERSION.html
- Oracle Database 19c PL/SQL Language Reference — Conditional Compilation: https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/plsql-language-fundamentals.html
