# Oracle Data Masking and Redaction

## Overview

Data masking and redaction are complementary security controls that protect sensitive data from unauthorized disclosure. They serve different purposes:

- **Oracle Data Redaction** (`DBMS_REDACT`) masks data dynamically at query time, in-memory, before it leaves the database engine. The data on disk is unchanged. This protects against unauthorized SQL access and application-layer exposure.
- **Oracle Data Safe / Advanced Masking** permanently transforms data in non-production copies. Once masked, the original values are gone. This protects sensitive data in development, test, and UAT environments.

Both features address a fundamental problem: organizations routinely need to expose sensitive data (PII, PCI, PHI) to developers, testers, analysts, and third-party applications — but those audiences should never see real values.

Oracle Data Redaction requires **Oracle Database Enterprise Edition 12c+** (included with Advanced Security Option in 12c, included in EE in 19c+). Oracle Data Safe is a cloud service (free tier available in OCI).

---

## Oracle Data Redaction (DBMS_REDACT)

Data Redaction transparently modifies query results for users who do not have the `EXEMPT REDACTION POLICY` privilege. The modification happens after the query executes but before results are returned to the client — so indexes, queries, and DML are unaffected.

### Redaction Types

| Type | Constant | Description |
|---|---|---|
| Full | `DBMS_REDACT.FULL` | Replaces entire value with a type-appropriate default (0 for numbers, spaces for strings, epoch for dates) |
| Partial | `DBMS_REDACT.PARTIAL` | Masks a portion of the value; preserves format |
| Regular Expression | `DBMS_REDACT.REGEXP` | Replaces patterns matching a regex |
| Random | `DBMS_REDACT.RANDOM` | Returns a random value each time; different on every query |
| None | `DBMS_REDACT.NONE` | Policy exists but no redaction occurs (used to suspend a policy) |

---

## Full Redaction

Full redaction replaces the entire value with a default: `0` for numbers, a single space `' '` for characters, and `01-JAN-01` for dates.

```sql
-- Redact an entire column
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'HR',
    object_name         => 'EMPLOYEES',
    column_name         => 'SALARY',
    policy_name         => 'REDACT_SALARY_FULL',
    function_type       => DBMS_REDACT.FULL,
    expression          => '1=1'   -- Always apply; use SYS_CONTEXT for conditional
  );
END;
/

-- Result for users without EXEMPT REDACTION POLICY:
-- SELECT salary FROM hr.employees WHERE employee_id = 100;
-- SALARY
-- 0

-- Redact a date column
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'PATIENTS',
    object_name         => 'MEDICAL_RECORDS',
    column_name         => 'DATE_OF_BIRTH',
    policy_name         => 'REDACT_DOB',
    function_type       => DBMS_REDACT.FULL,
    expression          => '1=1'
  );
END;
/
```

---

## Partial Redaction

Partial redaction preserves the format and some characters of the original value, masking only the sensitive portion. This is ideal for credit card numbers, SSNs, and phone numbers.

```sql
-- Credit card: show only last 4 digits (XXXX-XXXX-XXXX-1234)
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'PAYMENTS',
    object_name         => 'TRANSACTIONS',
    column_name         => 'CREDIT_CARD_NUMBER',
    policy_name         => 'REDACT_CC_PARTIAL',
    function_type       => DBMS_REDACT.PARTIAL,
    function_parameters => 'VVVVFVVVVFVVVVFLLL,VVVV-VVVV-VVVV-LLLL,*,1,12',
    -- Format: input_format, output_format, mask_char, start_pos, end_pos
    expression          => '1=1'
  );
END;
/
-- Result: ****-****-****-1234

-- Social Security Number: show only last 4 digits
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'HR',
    object_name         => 'EMPLOYEES',
    column_name         => 'SSN',
    policy_name         => 'REDACT_SSN',
    function_type       => DBMS_REDACT.PARTIAL,
    function_parameters => 'VVVFVVFVVVV,VVV-VV-VVVV,*,1,6',
    -- Mask characters 1-6, show characters 7-11 (last 4)
    expression          => '1=1'
  );
END;
/
-- Result: ***-**-1234

-- Email: mask local part, show domain
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'CUSTOMERS',
    object_name         => 'ACCOUNTS',
    column_name         => 'EMAIL_ADDRESS',
    policy_name         => 'REDACT_EMAIL',
    function_type       => DBMS_REDACT.PARTIAL,
    function_parameters => 'VVVVVVVVVVVVVVVVVVVV@VVVVVVVVVVVVVVVVVVVV,VVVV@VVVVVVVVVVVVVVVVVVVV,X,5,20',
    expression          => '1=1'
  );
END;
/
-- Result: johnXXXXXXXXXXXX@example.com (roughly)

-- Phone number: mask middle digits
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'HR',
    object_name         => 'EMPLOYEES',
    column_name         => 'PHONE_NUMBER',
    policy_name         => 'REDACT_PHONE',
    function_type       => DBMS_REDACT.PARTIAL,
    function_parameters => 'VVVFVVVFVVVV,VVV-VVV-VVVV,*,5,7',
    expression          => '1=1'
  );
END;
/
-- Result: 515-***-1234
```

### Partial Redaction Format Parameter Explained

The `function_parameters` string for `PARTIAL` redaction uses a 5-part format:
```
'input_format, output_format, mask_char, start_position, end_position'
```
- `V` in format = variable position (data-dependent character)
- `F` in format = fixed separator character
- `L` in format = literal keep character (not masked)
- `start_position` and `end_position` are 1-based positions to mask

---

## Regular Expression Redaction

Regex redaction is the most flexible option, using `REGEXP_REPLACE`-style pattern matching to selectively mask data.

```sql
-- Redact all email addresses in a free-text notes column
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'SUPPORT',
    object_name         => 'TICKETS',
    column_name         => 'DESCRIPTION',
    policy_name         => 'REDACT_EMAIL_IN_TEXT',
    function_type       => DBMS_REDACT.REGEXP,
    regexp_pattern      => '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    regexp_replace_string => '***@***.***',
    regexp_position     => 1,      -- Start position in string
    regexp_occurrence   => 0,      -- 0 = all occurrences
    regexp_match_parameter => 'i', -- Case-insensitive
    expression          => '1=1'
  );
END;
/

-- Redact US SSN patterns (###-##-####)
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema         => 'HR',
    object_name           => 'EMPLOYEE_NOTES',
    column_name           => 'NOTE_TEXT',
    policy_name           => 'REDACT_SSN_PATTERN',
    function_type         => DBMS_REDACT.REGEXP,
    regexp_pattern        => '\d{3}-\d{2}-\d{4}',
    regexp_replace_string => '***-**-****',
    regexp_occurrence     => 0,
    expression            => '1=1'
  );
END;
/

-- Redact IP addresses in log tables
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema         => 'APP',
    object_name           => 'ACCESS_LOG',
    column_name           => 'CLIENT_IP',
    policy_name           => 'REDACT_IP',
    function_type         => DBMS_REDACT.REGEXP,
    regexp_pattern        => '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',
    regexp_replace_string => '*.*.*.*',
    regexp_occurrence     => 0,
    expression            => '1=1'
  );
END;
/
```

---

## Random Redaction

Random redaction returns a randomly generated value on each query. The data type is preserved. This is useful when showing realistic-looking but fabricated data is acceptable.

```sql
-- Random salary values (different on every SELECT)
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    column_name     => 'SALARY',
    policy_name     => 'REDACT_SALARY_RANDOM',
    function_type   => DBMS_REDACT.RANDOM,
    expression      => '1=1'
  );
END;
/
-- Each SELECT returns a different random numeric value
```

---

## Conditional Redaction (Selective Application)

The `expression` parameter is a SQL condition evaluated per row (and per session). When it evaluates to TRUE, redaction is applied. This is the mechanism for role-based or context-based redaction.

```sql
-- Redact salary ONLY when the session user is NOT in the HR role
-- Application context must be set up first (see row-level-security.md)
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'HR',
    object_name         => 'EMPLOYEES',
    column_name         => 'SALARY',
    policy_name         => 'CONDITIONAL_SALARY_REDACT',
    function_type       => DBMS_REDACT.FULL,
    -- Apply redaction when user is NOT in HR/PAYROLL role
    expression          => 'SYS_CONTEXT(''hr_ctx'', ''user_role'') NOT IN (''HR_MGR'', ''PAYROLL'')'
  );
END;
/

-- Redact based on database session user (simpler approach using USERENV)
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'PAYMENTS',
    object_name         => 'TRANSACTIONS',
    column_name         => 'CREDIT_CARD_NUMBER',
    policy_name         => 'CC_REDACT_BY_USER',
    function_type       => DBMS_REDACT.PARTIAL,
    function_parameters => 'VVVVFVVVVFVVVVFLLL,VVVV-VVVV-VVVV-LLLL,*,1,12',
    -- Apply to everyone except the payment_processor service account
    expression          => 'SYS_CONTEXT(''USERENV'', ''SESSION_USER'') != ''PAYMENT_PROCESSOR'''
  );
END;
/
```

---

## Managing Redaction Policies

```sql
-- Add an additional column to an existing policy
BEGIN
  DBMS_REDACT.ALTER_POLICY(
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'REDACT_SALARY_FULL',
    action          => DBMS_REDACT.ADD_COLUMN,
    column_name     => 'COMMISSION_PCT',
    function_type   => DBMS_REDACT.FULL
  );
END;
/

-- Modify the redaction type for an existing column
BEGIN
  DBMS_REDACT.ALTER_POLICY(
    object_schema       => 'HR',
    object_name         => 'EMPLOYEES',
    policy_name         => 'REDACT_SALARY_FULL',
    action              => DBMS_REDACT.MODIFY_COLUMN,
    column_name         => 'SALARY',
    function_type       => DBMS_REDACT.PARTIAL,
    function_parameters => 'NNNNNNNNNN,NNNNNNNNNN,*,1,5'
  );
END;
/

-- Remove a specific column from a policy
BEGIN
  DBMS_REDACT.ALTER_POLICY(
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'REDACT_SALARY_FULL',
    action          => DBMS_REDACT.DROP_COLUMN,
    column_name     => 'COMMISSION_PCT'
  );
END;
/

-- Disable a policy (suspend redaction)
-- DBMS_REDACT.DISABLE_POLICY is a standalone procedure, NOT an ALTER_POLICY action constant
BEGIN
  DBMS_REDACT.DISABLE_POLICY(
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'REDACT_SALARY_FULL'
  );
END;
/

-- Re-enable a policy
-- DBMS_REDACT.ENABLE_POLICY is a standalone procedure, NOT an ALTER_POLICY action constant
BEGIN
  DBMS_REDACT.ENABLE_POLICY(
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'REDACT_SALARY_FULL'
  );
END;
/

-- Drop a policy entirely
BEGIN
  DBMS_REDACT.DROP_POLICY(
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'REDACT_SALARY_FULL'
  );
END;
/
```

### Querying Redaction Policies

```sql
-- All redaction policies and their columns
SELECT object_schema, object_name, policy_name, column_name,
       function_type, function_parameters, regexp_pattern,
       expression, enable
FROM redaction_policies
ORDER BY object_schema, object_name, policy_name;

-- Alternative view (older)
SELECT object_schema, object_name, policy_name, column_name,
       function_type, expression, policy_enable
FROM dba_redaction_policies
ORDER BY object_schema, object_name;

-- Find all redacted columns in a specific schema
SELECT object_name, column_name, function_type, expression
FROM redaction_policies
WHERE object_schema = 'HR'
ORDER BY object_name, column_name;
```

---

## Permanent Data Masking for Non-Production Environments

For non-production copies, data must be permanently transformed before delivery to developers, testers, or third parties. Oracle provides several approaches.

### Oracle Data Safe (Cloud)

Oracle Data Safe is a free cloud service for OCI-hosted databases and an add-on for on-premises databases. It provides:
- Sensitive data discovery (automatically finds PII, PCI, PHI)
- Data masking with 50+ built-in masking formats
- Activity auditing
- Security assessments

### Manual Permanent Masking Techniques

When Oracle Data Safe is not available, permanent masking can be implemented in SQL during a refresh cycle:

```sql
-- Step 1: Identify sensitive columns
-- Step 2: Create masked copies in non-production

-- Shuffle values (preserves distribution, breaks re-identification)
UPDATE hr.employees e1
SET salary = (
  SELECT e2.salary
  FROM hr.employees e2
  WHERE ROWNUM = 1
  ORDER BY DBMS_RANDOM.VALUE
);
COMMIT;

-- Replace names with randomly generated names from a lookup table
UPDATE hr.employees
SET first_name = (SELECT name FROM name_lookup ORDER BY DBMS_RANDOM.VALUE FETCH FIRST 1 ROWS ONLY),
    last_name  = (SELECT surname FROM surname_lookup ORDER BY DBMS_RANDOM.VALUE FETCH FIRST 1 ROWS ONLY);
COMMIT;

-- Hash email addresses (consistent: same input always produces same output)
UPDATE customers
SET email = LOWER(RAWTOHEX(DBMS_CRYPTO.HASH(
  UTL_RAW.CAST_TO_RAW(LOWER(email)),
  DBMS_CRYPTO.HASH_SH256
))) || '@masked.example.com';
COMMIT;

-- Randomize dates within a range (preserves relative ordering)
UPDATE patients
SET date_of_birth = date_of_birth + TRUNC(DBMS_RANDOM.VALUE(-365, 365));
COMMIT;

-- Null out highly sensitive fields entirely
UPDATE hr.employees
SET national_id     = NULL,
    passport_number = NULL,
    biometric_data  = NULL;
COMMIT;

-- Replace credit card numbers with consistent format-preserving values
UPDATE payments
SET credit_card_number = '4111' || LPAD(TRUNC(DBMS_RANDOM.VALUE(0, 999999999999)), 12, '0');
COMMIT;
```

### Subset-and-Mask Pipeline for Non-Production Refresh

```sql
-- 1. Export only a subset of production data (no masking needed for non-PII tables)
-- 2. For sensitive tables, use INSERT...SELECT with masking inline:
INSERT INTO nonprod.employees (
  employee_id, first_name, last_name, email, phone_number,
  hire_date, job_id, salary, department_id
)
SELECT
  employee_id,
  'First' || employee_id                              AS first_name,
  'Last'  || employee_id                              AS last_name,
  'user'  || employee_id || '@test.example.com'       AS email,
  '555-' || LPAD(employee_id, 3, '0') || '-0000'     AS phone_number,
  hire_date,   -- Non-sensitive; keep as-is
  job_id,      -- Non-sensitive; keep as-is
  ROUND(DBMS_RANDOM.VALUE(30000, 150000))             AS salary,
  department_id
FROM prod.employees;
COMMIT;
```

---

## Sensitive Column Discovery

Before masking, you need to know which columns hold sensitive data. Oracle Data Safe automates this, but you can do a pattern-based search manually:

```sql
-- Search for likely sensitive column names across all tables
SELECT owner, table_name, column_name, data_type
FROM dba_tab_columns
WHERE REGEXP_LIKE(column_name,
  'SSN|SOCIAL.SECURITY|NATIONAL.ID|PASSPORT|CREDIT.CARD|CARD.NUMBER|' ||
  'CVV|CVC|ACCOUNT.NUMBER|ROUTING|SALARY|WAGE|COMMISSION|BONUS|' ||
  'DATE.OF.BIRTH|DOB|BIRTH.DATE|GENDER|RACE|ETHNICITY|RELIGION|' ||
  'DIAGNOSIS|MEDICAL|HEALTH|PATIENT|PRESCRIPTION|' ||
  'PASSWORD|SECRET|TOKEN|API.KEY|PRIVATE.KEY|' ||
  'EMAIL|PHONE|MOBILE|ADDRESS|ZIP|POSTAL',
  'i'
)
AND owner NOT IN ('SYS', 'SYSTEM', 'CTXSYS', 'MDSYS', 'ORDSYS', 'XDB')
ORDER BY owner, table_name, column_name;
```

---

## Best Practices

1. **Redact at the lowest level possible**: Apply policies to base tables, not views. Views over redacted tables inherit the redaction automatically.

2. **Use conditional expressions for role-based redaction**: A policy with `expression => '1=1'` always redacts. Use `SYS_CONTEXT` expressions to allow privileged roles to see real data.

3. **Do not rely on redaction as the only control**: Redaction is a defense-in-depth measure. Users with direct export tools (Data Pump, SQL*Plus SPOOL) or backup access can bypass it. Combine with privilege management and auditing.

4. **Never use real production data in non-production**: Even with redaction in place on production, non-production copies should use permanently masked data. There are too many ways for sensitive data to leak through logs, error messages, and debugging tools.

5. **Audit access to redacted columns**: Enable fine-grained auditing (see `auditing.md`) on tables with redaction policies so you can detect unusual access patterns.

6. **Document your masking strategy**: For compliance, you must be able to demonstrate that specific columns in specific tables are masked and explain the masking technique used.

7. **Test redaction with a non-privileged account**: Always verify your policies work correctly by connecting as a user who should see masked data and confirming the masking behavior.

---

## Common Mistakes and How to Avoid Them

### Mistake 1: Assuming Export Tools Respect Redaction

Data Pump (`expdp`), SQL*Plus `COPY`, database links, and GoldenGate all can bypass Data Redaction because they run with DBA-level privileges or use direct path access.

```sql
-- Check who has EXEMPT REDACTION POLICY (can see all data unmasked)
SELECT grantee, privilege
FROM dba_sys_privs
WHERE privilege = 'EXEMPT REDACTION POLICY'
ORDER BY grantee;

-- Users with EXP_FULL_DATABASE or DBA role also bypass redaction
-- via Data Pump — protect exports with encryption (see encryption.md)
```

### Mistake 2: Redaction Does Not Prevent Inference

If a column is fully redacted but an index on it allows binary search, a determined attacker can use bisection to infer the real value. Combine redaction with access controls.

### Mistake 3: Not Testing the expression Parameter

An incorrectly written expression can result in the policy never applying (everyone sees real data) or always applying (privileged users also see masked data):

```sql
-- Test your expression logic directly
SELECT
  CASE
    WHEN SYS_CONTEXT('hr_ctx', 'user_role') NOT IN ('HR_MGR', 'PAYROLL')
    THEN 'REDACTED'
    ELSE 'VISIBLE'
  END AS salary_visibility
FROM dual;
```

---

## Compliance Considerations

### PCI-DSS
- Requirement 3.3: Mask PAN (primary account number) when displayed. At minimum, only the first 6 and last 4 digits may be shown.
- Requirement 3.4: Render PAN unreadable anywhere it is stored.
- Data Redaction directly satisfies display masking (Requirement 3.3).
- Requirement 3.4 requires encryption (see `encryption.md`) for storage masking.

```sql
-- PCI-compliant credit card display masking
BEGIN
  DBMS_REDACT.ADD_POLICY(
    object_schema       => 'PAYMENTS',
    object_name         => 'CARD_DATA',
    column_name         => 'PAN',
    policy_name         => 'PCI_PAN_MASK',
    function_type       => DBMS_REDACT.PARTIAL,
    -- Show first 6 and last 4, mask middle 6
    function_parameters => 'VVVVVVFVVVVVVVFVVVV,VVVVVVFVVVVVVVFVVVV,*,7,12',
    expression          => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') != ''PCI_PROCESSOR'''
  );
END;
/
```

### HIPAA
- The Safe Harbor de-identification standard requires 18 specific identifiers to be removed or masked (name, address, dates, phone, SSN, medical record numbers, etc.).
- Data Redaction satisfies this for query-time access control.
- For data shared externally, permanent masking is required.

### GDPR
- Personal data must not be more available than necessary for its stated purpose.
- Data Redaction helps enforce purpose limitation at the database layer.
- For the right to erasure, permanent deletion or permanent masking is required — not dynamic redaction.

---

## Sources

- [Oracle PL/SQL Packages Reference 19c — DBMS_REDACT](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_REDACT.html)
- [Oracle Database Advanced Security Guide 19c — Configuring Oracle Data Redaction Policies](https://docs.oracle.com/en/database/oracle/oracle-database/19/asoag/configuring-oracle-data-redaction-policies.html)
- [Oracle Database Reference 19c — REDACTION_POLICIES](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/REDACTION_POLICIES.html)
- [Oracle Data Safe Documentation](https://docs.oracle.com/en/cloud/paas/data-safe/index.html)
