# Oracle Database Auditing

## Overview

Database auditing creates an immutable record of who did what, when, and from where. It is a fundamental control for regulatory compliance, forensic investigation, and insider threat detection. Oracle provides several auditing mechanisms, but the primary and recommended approach since Oracle 12c is **Unified Auditing**.

Unified Auditing replaces the older fragmented auditing system (standard auditing, fine-grained auditing, OS auditing, SYS auditing) with a single, consistent framework. All audit records from all sources land in the `UNIFIED_AUDIT_TRAIL` view and are managed through a common set of commands.

### Unified Auditing vs Traditional Auditing

| Feature | Traditional (pre-12c) | Unified Auditing (12c+) |
|---|---|---|
| Storage | `AUD$` table or OS files | `AUDSYS` schema (secure) |
| Configuration | Multiple parameters | `CREATE AUDIT POLICY` |
| Fine-grained auditing | Separate `DBMS_FGA` | Integrated |
| SYS auditing | Separate | Integrated |
| Querying | Multiple views | `UNIFIED_AUDIT_TRAIL` |
| Tamper resistance | Limited | Enhanced (separate schema) |

### Checking the Auditing Mode

```sql
-- Check if pure unified auditing is active
SELECT value FROM v$option WHERE parameter = 'Unified Auditing';
-- Returns 'TRUE' for pure unified auditing

-- Check current audit trail setting (traditional auditing)
SHOW PARAMETER audit_trail;
-- In pure unified auditing, this parameter is ignored

-- Check which audit features are enabled
SELECT * FROM v$unified_audit_trail_exists;
```

---

## Enabling Pure Unified Auditing

By default, Oracle 12c databases run in "mixed mode" where both traditional and unified auditing coexist. Pure Unified Auditing requires relinking the Oracle executable:

```bash
# On the database server OS (as oracle OS user):
cd $ORACLE_HOME/rdbms/lib
make -f ins_rdbms.mk uniaud_on ioracle

# After relinking, restart the database
sqlplus / as sysdba
SHUTDOWN IMMEDIATE;
STARTUP;
```

---

## Creating Unified Audit Policies

Audit policies define what to audit. They are created once and can be enabled for all users or specific users.

### Basic Policy Creation Syntax

```sql
CREATE AUDIT POLICY policy_name
  [PRIVILEGES privilege_list]
  [ACTIONS action_list]
  [ACTIONS COMPONENT = component action_list]
  [WHEN 'condition_expression' EVALUATE PER SESSION|INSTANCE]
  [CONTAINER = CURRENT|ALL];
```

### Auditing Privilege Use

```sql
-- Audit use of powerful system privileges
CREATE AUDIT POLICY audit_dba_privs
  PRIVILEGES CREATE USER, DROP USER, ALTER USER,
             GRANT ANY PRIVILEGE, GRANT ANY ROLE,
             CREATE ANY TABLE, DROP ANY TABLE,
             AUDIT SYSTEM;

-- Enable for all users
AUDIT POLICY audit_dba_privs;

-- Enable only for specific users
AUDIT POLICY audit_dba_privs BY hr_admin, sys_admin;

-- Audit only failures (useful for detecting unauthorized access attempts)
AUDIT POLICY audit_dba_privs WHENEVER NOT SUCCESSFUL;

-- Audit both successes and failures
AUDIT POLICY audit_dba_privs WHENEVER SUCCESSFUL;
AUDIT POLICY audit_dba_privs WHENEVER NOT SUCCESSFUL;
```

### Auditing Object Actions

```sql
-- Audit all DML on a specific table
CREATE AUDIT POLICY audit_salary_changes
  ACTIONS SELECT, INSERT, UPDATE, DELETE ON hr.employees;

AUDIT POLICY audit_salary_changes;

-- Audit DDL on a schema
CREATE AUDIT POLICY audit_schema_ddl
  ACTIONS CREATE TABLE, ALTER TABLE, DROP TABLE,
          CREATE INDEX, DROP INDEX,
          CREATE VIEW, DROP VIEW,
          CREATE PROCEDURE, ALTER PROCEDURE, DROP PROCEDURE
  ON hr.employees;

-- Audit EXECUTE on a sensitive package
CREATE AUDIT POLICY audit_payroll_pkg
  ACTIONS EXECUTE ON payroll.process_payroll_pkg;

AUDIT POLICY audit_payroll_pkg;

-- Audit logins and logouts
CREATE AUDIT POLICY audit_connections
  ACTIONS LOGON, LOGOFF;

AUDIT POLICY audit_connections;
```

### Conditional Auditing (WHEN Clause)

The `WHEN` clause allows the policy to fire only when a specific condition is true. This can dramatically reduce audit volume by filtering to exactly the cases of interest.

```sql
-- Only audit salary access outside business hours
CREATE AUDIT POLICY audit_after_hours_salary
  ACTIONS SELECT ON hr.employees
  WHEN 'TO_NUMBER(TO_CHAR(SYSDATE,''HH24'')) NOT BETWEEN 8 AND 18'
  EVALUATE PER SESSION;

AUDIT POLICY audit_after_hours_salary;

-- Audit access from outside the corporate network
CREATE AUDIT POLICY audit_external_access
  ACTIONS SELECT, INSERT, UPDATE, DELETE ON payments.transactions
  WHEN 'SYS_CONTEXT(''USERENV'',''IP_ADDRESS'') NOT LIKE ''10.%'''
  EVALUATE PER SESSION;

AUDIT POLICY audit_external_access;

-- Audit specific application connections
CREATE AUDIT POLICY audit_third_party_access
  ACTIONS SELECT ON hr.employees
  WHEN 'SYS_CONTEXT(''USERENV'',''MODULE'') NOT LIKE ''HR_APP%'''
  EVALUATE PER SESSION;

AUDIT POLICY audit_third_party_access BY APP_READ_USER;
```

---

## Auditing Privileged Users (SYS and SYSDBA)

Privileged users like `SYS` can bypass standard security controls. Oracle provides mechanisms to audit even these users.

```sql
-- Enable SYS-level auditing (writes to OS file or AUDSYS)
-- Set in initialization parameter file:
ALTER SYSTEM SET audit_sys_operations = TRUE SCOPE = SPFILE;
-- Requires restart

-- In unified auditing, create a policy for privileged users
CREATE AUDIT POLICY audit_sysdba_actions
  ACTIONS ALL
  WHEN 'SYS_CONTEXT(''USERENV'',''ISDBA'') = ''TRUE'''
  EVALUATE PER SESSION;

AUDIT POLICY audit_sysdba_actions;

-- Audit all actions by named DBA accounts
CREATE AUDIT POLICY audit_named_dbas
  ACTIONS ALL;

AUDIT POLICY audit_named_dbas BY dba_user1, dba_user2, dba_user3;
```

---

## Fine-Grained Auditing (DBMS_FGA)

Fine-Grained Auditing (FGA) allows you to audit SELECT statements that access specific columns and optionally capture the actual query that was run. In unified auditing mode, `DBMS_FGA` policies are still supported and their records appear in `UNIFIED_AUDIT_TRAIL`.

```sql
-- Audit SELECT on sensitive columns with query capture
-- Note: the audit_trail parameter is desupported in Oracle 23ai.
-- All FGA records are written to UNIFIED_AUDIT_TRAIL automatically.
BEGIN
  DBMS_FGA.ADD_POLICY(
    object_schema    => 'HR',
    object_name      => 'EMPLOYEES',
    policy_name      => 'AUDIT_SALARY_ACCESS',
    audit_column     => 'SALARY,COMMISSION_PCT',  -- Fire only when these are referenced
    audit_condition  => NULL,  -- NULL = always audit
    statement_types  => 'SELECT',
    enable           => TRUE
  );
END;
/

-- FGA with a condition: audit only when salary > 100000
BEGIN
  DBMS_FGA.ADD_POLICY(
    object_schema   => 'HR',
    object_name     => 'EMPLOYEES',
    policy_name     => 'AUDIT_HIGH_SALARY_ACCESS',
    audit_column    => 'SALARY',
    audit_condition => 'SALARY > 100000',
    statement_types => 'SELECT'
  );
END;
/

-- FGA with a handler procedure (alert on access)
CREATE OR REPLACE PROCEDURE security_alert(
  p_schema    IN VARCHAR2,
  p_object    IN VARCHAR2,
  p_policy    IN VARCHAR2
) AS
BEGIN
  INSERT INTO security.alerts (schema_name, object_name, policy_name,
                                db_user, os_user, ip_address, alert_time)
  VALUES (p_schema, p_object, p_policy,
          SYS_CONTEXT('USERENV', 'SESSION_USER'),
          SYS_CONTEXT('USERENV', 'OS_USER'),
          SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
          SYSTIMESTAMP);
  COMMIT;
END;
/

BEGIN
  DBMS_FGA.ADD_POLICY(
    object_schema    => 'FINANCE',
    object_name      => 'WIRE_TRANSFERS',
    policy_name      => 'ALERT_WIRE_ACCESS',
    handler_schema   => 'SECURITY',
    handler_module   => 'SECURITY_ALERT',  -- Called when policy fires
    enable           => TRUE
  );
END;
/

-- Manage FGA policies
EXEC DBMS_FGA.ENABLE_POLICY('HR', 'EMPLOYEES', 'AUDIT_SALARY_ACCESS');
EXEC DBMS_FGA.DISABLE_POLICY('HR', 'EMPLOYEES', 'AUDIT_SALARY_ACCESS');
EXEC DBMS_FGA.DROP_POLICY('HR', 'EMPLOYEES', 'AUDIT_SALARY_ACCESS');
```

---

## Querying UNIFIED_AUDIT_TRAIL

The `UNIFIED_AUDIT_TRAIL` view is the central query point for all audit records.

### Key Columns in UNIFIED_AUDIT_TRAIL

| Column | Description |
|---|---|
| `EVENT_TIMESTAMP` | When the event occurred |
| `DBUSERNAME` | Database username |
| `OS_USERNAME` | Operating system username |
| `USERHOST` | Client host name |
| `UNIFIED_AUDIT_POLICIES` | Which audit policy triggered this record |
| `ACTION_NAME` | The SQL action (SELECT, INSERT, LOGON, etc.) |
| `OBJECT_SCHEMA` | Schema of the accessed object |
| `OBJECT_NAME` | Name of the accessed object |
| `SQL_TEXT` | The actual SQL statement (stored as CLOB) |
| `RETURN_CODE` | Oracle error code (0 = success) |
| `AUTHENTICATION_TYPE` | Authentication method and client address details (contains embedded client IP in format `(CLIENT ADDRESS=((PROTOCOL=...)(HOST=ip)(PORT=port)))`) |
| `SYSTEM_PRIVILEGE_USED` | System privileges used to execute the audited action (e.g., `SYSDBA`) |

> **Note:** `UNIFIED_AUDIT_TRAIL` does **not** have a `CLIENT_IP` column. Client IP is embedded inside the `AUTHENTICATION_TYPE` string. There is also no `AUTHENTICATION_PRIVILEGE` column — use `SYSTEM_PRIVILEGE_USED` to find SYSDBA/SYSOPER usage.

### Common Audit Trail Queries

```sql
-- Recent login failures (brute force detection)
-- Note: UNIFIED_AUDIT_TRAIL has no CLIENT_IP column; client IP is inside AUTHENTICATION_TYPE
SELECT event_timestamp, dbusername, userhost, return_code, authentication_type
FROM unified_audit_trail
WHERE action_name = 'LOGON'
  AND return_code != 0
  AND event_timestamp > SYSDATE - 1  -- Last 24 hours
ORDER BY event_timestamp DESC;

-- Users who accessed salary data today
SELECT event_timestamp, dbusername, userhost, action_name, sql_text
FROM unified_audit_trail
WHERE object_name = 'EMPLOYEES'
  AND object_schema = 'HR'
  AND unified_audit_policies LIKE '%SALARY%'
  AND event_timestamp > TRUNC(SYSDATE)
ORDER BY event_timestamp DESC;

-- DDL changes in the last 7 days
SELECT event_timestamp, dbusername, userhost, action_name,
       object_schema, object_name, sql_text
FROM unified_audit_trail
WHERE action_name IN ('CREATE TABLE', 'DROP TABLE', 'ALTER TABLE',
                      'CREATE INDEX', 'DROP INDEX', 'TRUNCATE TABLE')
  AND event_timestamp > SYSDATE - 7
ORDER BY event_timestamp DESC;

-- Privilege grants (SOX: who changed access?)
SELECT event_timestamp, dbusername, userhost, action_name, sql_text
FROM unified_audit_trail
WHERE action_name IN ('GRANT', 'REVOKE', 'CREATE ROLE', 'DROP ROLE',
                      'CREATE USER', 'DROP USER', 'ALTER USER')
  AND event_timestamp > SYSDATE - 30
ORDER BY event_timestamp DESC;

-- All actions by SYS or SYSDBA in the last week
-- Use SYSTEM_PRIVILEGE_USED to detect SYSDBA logins (no AUTHENTICATION_PRIVILEGE column)
SELECT event_timestamp, dbusername, os_username, userhost,
       action_name, object_name, sql_text, system_privilege_used
FROM unified_audit_trail
WHERE (dbusername = 'SYS' OR system_privilege_used LIKE '%SYSDBA%')
  AND event_timestamp > SYSDATE - 7
ORDER BY event_timestamp DESC;

-- Failed access attempts (possible SQL injection or unauthorized access)
SELECT event_timestamp, dbusername, userhost, action_name,
       object_name, return_code, sql_text
FROM unified_audit_trail
WHERE return_code NOT IN (0, 1403)  -- Exclude NOT FOUND (1403)
  AND event_timestamp > SYSDATE - 1
ORDER BY event_timestamp DESC, dbusername;

-- Top 20 most active users by audit event count
SELECT dbusername, COUNT(*) event_count,
       COUNT(DISTINCT action_name) distinct_actions
FROM unified_audit_trail
WHERE event_timestamp > SYSDATE - 7
GROUP BY dbusername
ORDER BY event_count DESC
FETCH FIRST 20 ROWS ONLY;
```

---

## Managing Audit Policies

```sql
-- List all defined audit policies
SELECT policy_name, enabled_option, entity_name, entity_type,
       success, failure
FROM audit_unified_enabled_policies
ORDER BY policy_name, entity_name;

-- List all policies (including disabled)
SELECT policy_name, policy_type, object_schema, object_name,
       condition_eval_opt
FROM audit_unified_policies
ORDER BY policy_name;

-- Disable an audit policy
NOAUDIT POLICY audit_salary_changes;

-- Disable for a specific user only
NOAUDIT POLICY audit_salary_changes BY specific_user;

-- Drop a policy permanently
DROP AUDIT POLICY audit_salary_changes;

-- Purge old audit records (requires AUDIT_ADMIN role or DBA)
-- CLEAN_AUDIT_TRAIL has no delete_timestamp parameter.
-- To purge records older than 90 days: first set the archive timestamp, then call CLEAN.
BEGIN
  DBMS_AUDIT_MGMT.SET_LAST_ARCHIVE_TIMESTAMP(
    audit_trail_type  => DBMS_AUDIT_MGMT.AUDIT_TRAIL_UNIFIED,
    last_archive_time => SYSTIMESTAMP - INTERVAL '90' DAY
  );
END;
/

-- Then purge records older than the archive timestamp
BEGIN
  DBMS_AUDIT_MGMT.CLEAN_AUDIT_TRAIL(
    audit_trail_type        => DBMS_AUDIT_MGMT.AUDIT_TRAIL_UNIFIED,
    use_last_arch_timestamp => TRUE   -- Deletes records older than the timestamp set above
  );
END;
/

BEGIN
  DBMS_AUDIT_MGMT.CREATE_PURGE_JOB(
    audit_trail_type           => DBMS_AUDIT_MGMT.AUDIT_TRAIL_UNIFIED,
    audit_trail_purge_interval => 24,          -- Run every 24 hours
    audit_trail_purge_name     => 'DAILY_AUDIT_PURGE',
    use_last_arch_timestamp    => TRUE
  );
END;
/
```

---

## Audit Trail Architecture and Sizing

The unified audit trail is stored in the `AUDSYS` schema in the `SYSAUX` tablespace by default. For large databases with high audit volumes, consider moving it to a dedicated tablespace.

```sql
-- Check current audit trail tablespace
SELECT tablespace_name
FROM dba_segments
WHERE owner = 'AUDSYS'
FETCH FIRST 1 ROWS ONLY;

-- Check size of the audit trail
SELECT ROUND(SUM(bytes)/1024/1024/1024, 2) AS size_gb
FROM dba_segments
WHERE owner = 'AUDSYS';

-- Move audit trail to a dedicated tablespace (requires AUDIT_ADMIN role)
BEGIN
  DBMS_AUDIT_MGMT.SET_AUDIT_TRAIL_LOCATION(
    audit_trail_type    => DBMS_AUDIT_MGMT.AUDIT_TRAIL_UNIFIED,
    audit_trail_location_value => 'AUDIT_TBS'  -- Must exist first
  );
END;
/

-- Check audit trail growth trend
SELECT TRUNC(event_timestamp, 'DD') AS audit_day,
       COUNT(*) AS event_count,
       ROUND(COUNT(*) * 500 / 1024 / 1024, 2) AS approx_mb  -- ~500 bytes/record
FROM unified_audit_trail
WHERE event_timestamp > SYSDATE - 30
GROUP BY TRUNC(event_timestamp, 'DD')
ORDER BY audit_day;
```

---

## Best Practices

1. **Always audit authentication events**: Logon failures are your primary indicator of brute-force attacks and unauthorized access attempts. Logon successes establish the baseline for anomaly detection.

2. **Audit all DDL**: Schema changes can destroy audit trails, drop tables, or create backdoors. Every `CREATE`, `ALTER`, `DROP`, `TRUNCATE` in your application schemas must be audited.

3. **Audit all privilege and role grants**: These are change events in your access control model. Under SOX and PCI, these must be reviewed.

4. **Use `DBMS_FGA` for sensitive column access**: When you need to know exactly which query accessed salary data, FGA is the right tool. SQL text is captured in `UNIFIED_AUDIT_TRAIL.SQL_TEXT`. Note: the `audit_trail` parameter (DBMS_FGA.DB + DBMS_FGA.EXTENDED) is desupported in Oracle 23ai — all FGA records automatically land in the unified audit trail.

5. **Store audit records separately from the database being audited**: Ideally, ship audit records to a SIEM or separate audit database in real time. A DBA who can delete audit records can cover their tracks.

6. **Do not over-audit SELECT on busy tables**: Auditing every SELECT on a table with millions of reads per day will fill your audit tablespace quickly and may impact performance. Use FGA with conditions to target what matters.

7. **Review audit policies quarterly**: Policies that were relevant six months ago may no longer apply. Remove unused policies and add new ones as the application evolves.

8. **Test that policies fire**: After creating a policy, verify it generates records by performing the audited action and querying `UNIFIED_AUDIT_TRAIL`.

---

## Common Mistakes and How to Avoid Them

### Mistake 1: Auditing Everything by Default

```sql
-- BAD: This will generate millions of records per hour on a busy OLTP system
AUDIT ALL STATEMENTS;

-- GOOD: Audit strategically — privilege use, DDL, and sensitive data access
CREATE AUDIT POLICY targeted_audit
  ACTIONS SELECT ON finance.wire_transfers,
          DELETE ON finance.wire_transfers,
          INSERT ON finance.wire_transfers,
          UPDATE ON finance.wire_transfers;
AUDIT POLICY targeted_audit;
```

### Mistake 2: Allowing DBAs to Purge Audit Records Without Oversight

```sql
-- Create a separate AUDIT_ADMIN role that is not held by regular DBAs
-- DBAs cannot purge audit records for their own actions
-- Require dual control for purge operations

-- Check who can manage the audit trail
SELECT grantee FROM dba_sys_privs
WHERE privilege = 'AUDIT SYSTEM'
UNION
SELECT grantee FROM dba_role_privs
WHERE granted_role = 'AUDIT_ADMIN';
```

### Mistake 3: Not Archiving Before Purging

```sql
-- Always archive audit records to an external system before purging
-- Use Oracle Advanced Queuing, a database link to a logging DB, or export to a SIEM

-- Example: Archive via a DB link before purge
INSERT INTO audit_archive.unified_audit_archive@audit_db_link
SELECT * FROM unified_audit_trail
WHERE event_timestamp < SYSTIMESTAMP - INTERVAL '90' DAY;
COMMIT;

-- Then purge records older than the archive timestamp just set
BEGIN
  DBMS_AUDIT_MGMT.CLEAN_AUDIT_TRAIL(
    audit_trail_type        => DBMS_AUDIT_MGMT.AUDIT_TRAIL_UNIFIED,
    use_last_arch_timestamp => TRUE
  );
END;
/
```

### Mistake 4: Not Including SQL Text in Policies

```sql
-- BAD: Knows that user accessed the table, not what they queried
CREATE AUDIT POLICY audit_emp ACTIONS SELECT ON hr.employees;

-- GOOD: Use FGA to capture the actual SQL text (stored in UNIFIED_AUDIT_TRAIL.SQL_TEXT)
-- The audit_trail parameter is desupported in 23ai; all records go to UNIFIED_AUDIT_TRAIL
BEGIN
  DBMS_FGA.ADD_POLICY(
    object_schema => 'HR', object_name => 'EMPLOYEES',
    policy_name   => 'FGA_EMP_SELECT'
  );
END;
/
```

---

## Compliance Considerations

### SOX (Sarbanes-Oxley)
- All access to financial data tables must be logged
- All privilege grants and role assignments must be logged
- Audit logs must be retained for 7 years
- DBA activities must be audited and reviewed independently
- Audit records must be protected from tampering

### PCI-DSS
- Requirement 10: Track and monitor all access to network resources and cardholder data
- Requirement 10.2: Implement audit logs for all system components
- Requirement 10.3: Capture date/time, user, type of event, and outcome
- Requirement 10.5: Secure audit trails so they cannot be altered
- Requirement 10.7: Retain audit trail history for at least one year

```sql
-- PCI-compliant policy for cardholder data access
CREATE AUDIT POLICY pci_cardholder_audit
  ACTIONS SELECT, INSERT, UPDATE, DELETE
    ON payments.card_data,
  ACTIONS SELECT, INSERT, UPDATE, DELETE
    ON payments.transactions;

AUDIT POLICY pci_cardholder_audit;

-- Supplemental FGA to capture query text (records go to UNIFIED_AUDIT_TRAIL.SQL_TEXT)
-- audit_trail parameter is desupported in 23ai
BEGIN
  DBMS_FGA.ADD_POLICY(
    object_schema => 'PAYMENTS', object_name => 'CARD_DATA',
    policy_name   => 'PCI_FGA_CARD_DATA'
  );
END;
/
```

### HIPAA
- 45 CFR 164.312(b): Implement hardware, software, and procedural mechanisms to record and examine activity in information systems containing PHI
- Audit logs must include user ID, date, time, and type of access
- Logs must be reviewed regularly (typically weekly/monthly)
- Audit logs must be retained for at least 6 years

---

## Sources

- [Oracle Database Security Guide 19c — Introduction to Auditing](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/introduction-to-auditing.html)
- [Oracle Database Security Guide 19c — Administering the Audit Trail](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/administering-the-audit-trail.html)
- [Oracle Database Reference 19c — UNIFIED_AUDIT_TRAIL](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/UNIFIED_AUDIT_TRAIL.html)
- [Oracle PL/SQL Packages Reference 19c — DBMS_FGA](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_FGA.html)
- [Oracle PL/SQL Packages Reference 19c — DBMS_AUDIT_MGMT](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_AUDIT_MGMT.html)
