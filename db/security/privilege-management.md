# Oracle Privilege Management

## Overview

Privilege management is the foundation of Oracle database security. Oracle uses a discretionary access control (DAC) model where users are granted explicit rights to perform operations or access objects. Getting privilege management right is the single most impactful security control in any Oracle deployment — overly permissive privilege grants are the root cause of the vast majority of database breaches and insider threats.

Oracle privileges fall into two major categories: **system privileges** (the right to perform a class of operation anywhere in the database) and **object privileges** (the right to perform a specific operation on a specific object). Both can be granted directly to users or collected into **roles** for easier administration.

---

## System Privileges

System privileges grant the ability to perform actions that affect the database as a whole or objects in any schema. There are over 200 system privileges in Oracle. The most dangerous ones are those with the `ANY` keyword.

### Dangerous System Privileges to Watch

| Privilege | Risk |
|---|---|
| `DBA` role | Near-total control of the database |
| `SYSDBA` / `SYSOPER` | Administrative OS-bypass access |
| `CREATE ANY TABLE` | Create objects in any schema |
| `DROP ANY TABLE` | Destroy any schema's data |
| `SELECT ANY TABLE` | Read any data in the database |
| `EXECUTE ANY PROCEDURE` | Run any stored code |
| `ALTER ANY TABLE` | Modify any table's structure |
| `GRANT ANY PRIVILEGE` | Re-grant privileges to anyone |
| `GRANT ANY ROLE` | Assign any role to anyone |
| `BECOME USER` | Impersonate any user |

### Granting System Privileges

```sql
-- Grant a specific system privilege to a user
GRANT CREATE SESSION TO app_user;
GRANT CREATE TABLE TO app_user;
GRANT CREATE SEQUENCE TO app_user;

-- Grant with ADMIN OPTION allows the grantee to re-grant
-- Use this sparingly — it creates uncontrolled privilege spread
GRANT CREATE TABLE TO schema_owner WITH ADMIN OPTION;

-- Grant to a role
GRANT CREATE SESSION TO app_readonly_role;
```

### Revoking System Privileges

```sql
-- Revoke a system privilege
REVOKE CREATE TABLE FROM app_user;

-- Note: Revoking a system privilege granted WITH ADMIN OPTION does NOT
-- cascade-revoke privileges that were re-granted by that user.
-- This is different from object privilege revoke behavior.
REVOKE CREATE SESSION FROM schema_owner;
```

---

## Object Privileges

Object privileges control what a user can do with a specific database object such as a table, view, sequence, or procedure. They are more granular than system privileges and should always be preferred.

### Common Object Privileges

```sql
-- Table/View privileges
GRANT SELECT ON hr.employees TO reporting_user;
GRANT INSERT ON hr.employees TO data_entry_user;
GRANT UPDATE (salary, job_id) ON hr.employees TO hr_manager;  -- Column-level grant
GRANT DELETE ON hr.employees TO hr_admin;
GRANT REFERENCES ON hr.departments TO app_user;  -- Needed for FK constraints

-- Sequence privileges
GRANT SELECT ON hr.emp_seq TO app_user;

-- Procedure/Function/Package privileges
GRANT EXECUTE ON hr.process_payroll TO payroll_app;

-- Grant to all users (avoid for sensitive objects)
GRANT SELECT ON hr.public_holidays TO PUBLIC;  -- Use with caution!
```

### Column-Level Grants

Oracle allows UPDATE and REFERENCES grants at the column level, which is a powerful tool for least privilege:

```sql
-- Allow updating only specific columns
GRANT UPDATE (phone_number, email) ON hr.employees TO help_desk_role;

-- Verify column-level grants
SELECT grantee, owner, table_name, column_name, privilege
FROM dba_col_privs
WHERE owner = 'HR'
ORDER BY table_name, column_name;
```

---

## Roles

Roles are named collections of privileges that simplify privilege administration. Rather than granting dozens of privileges to each user individually, you grant them a role. Roles can contain both system and object privileges, and roles can be granted to other roles.

### Creating and Managing Roles

```sql
-- Create a simple role
CREATE ROLE app_read_role;
CREATE ROLE app_write_role;
CREATE ROLE app_admin_role;

-- Create a password-protected role (must be enabled explicitly)
CREATE ROLE sensitive_data_role IDENTIFIED BY "R0leP@ssw0rd!";

-- Grant privileges into the role
GRANT SELECT ON orders.customers TO app_read_role;
GRANT SELECT ON orders.order_lines TO app_read_role;
GRANT SELECT ON orders.products TO app_read_role;

GRANT app_read_role TO app_write_role;  -- Role hierarchy
GRANT INSERT, UPDATE, DELETE ON orders.customers TO app_write_role;

-- Grant the role to users
GRANT app_read_role TO reporting_svc;
GRANT app_write_role TO webapp_svc;

-- Grant with ADMIN OPTION (allows re-granting the role)
GRANT app_read_role TO team_lead WITH ADMIN OPTION;
```

### Enabling Password-Protected Roles

```sql
-- In application code or session setup
SET ROLE sensitive_data_role IDENTIFIED BY "R0leP@ssw0rd!";

-- Disable a specific role for the current session
SET ROLE ALL EXCEPT sensitive_data_role;

-- Re-enable all roles
SET ROLE ALL;
```

### Predefined Oracle Roles (Use with Extreme Caution)

```sql
-- DBA role: grants nearly every system privilege including WITH ADMIN OPTION
-- NEVER grant this to application accounts
GRANT DBA TO scott;  -- BAD PRACTICE

-- CONNECT role: in 12c+ it effectively provides only CREATE SESSION
-- RESOURCE role: grants object-creation privileges such as CREATE TABLE and CREATE PROCEDURE
-- Prefer explicit privilege grants instead of relying on legacy predefined roles

-- Check what's inside Oracle's predefined roles
SELECT privilege, admin_option
FROM dba_sys_privs
WHERE grantee = 'DBA'
ORDER BY privilege;
```

---

## Least Privilege Principle

The principle of least privilege states that any user, application, or process should have only the minimum access rights required to perform its function and nothing more.

### Designing a Least-Privilege Schema

```sql
-- Step 1: Separate schema owner from application user
-- The schema owner creates objects but never connects in production
CREATE USER orders_schema IDENTIFIED BY "SchemaP@ss!" ACCOUNT LOCK;

-- Step 2: Create the application service account with no unnecessary privileges
CREATE USER orders_app IDENTIFIED BY "AppP@ss!"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp
  PROFILE app_profile;

-- Step 3: Grant only what is needed
GRANT CREATE SESSION TO orders_app;
GRANT SELECT, INSERT, UPDATE ON orders_schema.orders TO orders_app;
GRANT SELECT ON orders_schema.customers TO orders_app;
GRANT SELECT ON orders_schema.products TO orders_app;
GRANT EXECUTE ON orders_schema.process_order TO orders_app;

-- Step 4: Create a read-only reporting account
CREATE USER orders_report IDENTIFIED BY "ReportP@ss!";
GRANT CREATE SESSION TO orders_report;
GRANT SELECT ON orders_schema.orders TO orders_report;
GRANT SELECT ON orders_schema.order_lines TO orders_report;
```

---

## Privilege Analysis with DBMS_PRIVILEGE_CAPTURE

Oracle 12c+ includes the `DBMS_PRIVILEGE_CAPTURE` package, which lets you capture which privileges a user actually uses during a period of activity. This is the definitive tool for right-sizing privileges.

### Running a Privilege Capture

```sql
-- Step 1: Create a capture policy
-- Capture type options: G_DATABASE (all), G_ROLE, G_CONTEXT, G_ROLE_AND_CONTEXT
-- The roles parameter is only meaningful when type = G_ROLE or G_ROLE_AND_CONTEXT.
-- For G_DATABASE, omit roles (or pass NULL).
BEGIN
  DBMS_PRIVILEGE_CAPTURE.CREATE_CAPTURE(
    name        => 'app_privs_capture',
    description => 'Capture privileges used by the orders app',
    type        => DBMS_PRIVILEGE_CAPTURE.G_DATABASE
  );
END;
/

-- To capture only privileges used via a specific role, use G_ROLE:
-- BEGIN
--   DBMS_PRIVILEGE_CAPTURE.CREATE_CAPTURE(
--     name  => 'role_privs_capture',
--     type  => DBMS_PRIVILEGE_CAPTURE.G_ROLE,
--     roles => role_name_list('ORDERS_APP_ROLE')
--   );
-- END;
-- /

-- Step 2: Enable the capture
EXEC DBMS_PRIVILEGE_CAPTURE.ENABLE_CAPTURE('app_privs_capture');

-- Step 3: Run the application workload now (run all code paths)

-- Step 4: Disable the capture
EXEC DBMS_PRIVILEGE_CAPTURE.DISABLE_CAPTURE('app_privs_capture');

-- Step 5: Generate the analysis results
EXEC DBMS_PRIVILEGE_CAPTURE.GENERATE_RESULT('app_privs_capture');

-- Step 6: Query the results
-- Privileges that WERE used
SELECT username, sys_priv, object_owner, object_name, object_type
FROM dba_used_privs
WHERE capture = 'APP_PRIVS_CAPTURE'
ORDER BY username, sys_priv;

-- Privileges that were NOT used (candidates for revocation)
SELECT username, sys_priv, object_owner, object_name, object_type
FROM dba_unused_privs
WHERE capture = 'APP_PRIVS_CAPTURE'
ORDER BY username, sys_priv;

-- Step 7: Clean up
EXEC DBMS_PRIVILEGE_CAPTURE.DROP_CAPTURE('app_privs_capture');
```

---

## Querying the Privilege Data Dictionary

### System Privilege Queries

```sql
-- All system privileges granted to a user (direct grants)
SELECT grantee, privilege, admin_option
FROM dba_sys_privs
WHERE grantee = 'ORDERS_APP'
ORDER BY privilege;

-- All system privileges granted to a role
SELECT grantee, privilege, admin_option
FROM dba_sys_privs
WHERE grantee = 'APP_WRITE_ROLE'
ORDER BY privilege;

-- Find all users with a direct DBA role grant
SELECT grantee, granted_role, admin_option, default_role
FROM dba_role_privs
WHERE granted_role = 'DBA'
ORDER BY grantee;

-- Recursively find all system privileges for a user including via roles
-- Uses recursive CTE (Oracle 11g R2+)
WITH role_tree (role_or_user) AS (
  SELECT granted_role
  FROM dba_role_privs
  WHERE grantee = 'ORDERS_APP'
  UNION ALL
  SELECT rp.granted_role
  FROM dba_role_privs rp
  JOIN role_tree rt ON rp.grantee = rt.role_or_user
)
SELECT sp.grantee, sp.privilege, sp.admin_option
FROM dba_sys_privs sp
WHERE sp.grantee IN (
  SELECT role_or_user FROM role_tree
  UNION ALL SELECT 'ORDERS_APP' FROM dual
)
ORDER BY sp.grantee, sp.privilege;
```

### Object Privilege Queries

```sql
-- All object privileges granted to a user
SELECT owner, table_name, grantee, privilege, grantable, hierarchy
FROM dba_tab_privs
WHERE grantee = 'ORDERS_APP'
ORDER BY owner, table_name, privilege;

-- Find who has access to a specific sensitive table
SELECT grantee, privilege, grantable
FROM dba_tab_privs
WHERE owner = 'HR' AND table_name = 'EMPLOYEES'
ORDER BY grantee;

-- Column-level privileges
SELECT owner, table_name, column_name, grantee, privilege
FROM dba_col_privs
WHERE owner = 'HR'
ORDER BY table_name, column_name, grantee;

-- Find all grants made to PUBLIC (high risk)
SELECT owner, table_name, privilege, grantable
FROM dba_tab_privs
WHERE grantee = 'PUBLIC'
ORDER BY owner, table_name;

SELECT privilege, admin_option
FROM dba_sys_privs
WHERE grantee = 'PUBLIC'
ORDER BY privilege;
```

### Role Membership Queries

```sql
-- Roles granted to a user
SELECT granted_role, admin_option, default_role
FROM dba_role_privs
WHERE grantee = 'ORDERS_APP'
ORDER BY granted_role;

-- All members of a role
SELECT grantee, admin_option, default_role
FROM dba_role_privs
WHERE granted_role = 'APP_WRITE_ROLE'
ORDER BY grantee;

-- Direct system privileges granted to a role
SELECT role, privilege, admin_option
FROM role_sys_privs
WHERE role = 'APP_WRITE_ROLE'
ORDER BY privilege;

-- Direct object privileges granted to a role
SELECT role, owner, table_name, privilege, grantable
FROM role_tab_privs
WHERE role = 'APP_WRITE_ROLE'
ORDER BY owner, table_name;
```

---

## Avoiding PUBLIC Grants

Granting privileges to `PUBLIC` makes them available to every user in the database, including any future users created. This is extremely dangerous for sensitive objects.

```sql
-- DANGEROUS: Never do this for application tables
GRANT SELECT ON payroll.salary_data TO PUBLIC;
GRANT EXECUTE ON sys.utl_file TO PUBLIC;  -- Allows file system access

-- Audit current PUBLIC grants
SELECT owner, table_name, privilege
FROM dba_tab_privs
WHERE grantee = 'PUBLIC'
  AND owner NOT IN ('SYS', 'SYSTEM', 'XDB', 'APEX_PUBLIC_USER',
                    'FLOWS_FILES', 'CTXSYS', 'MDSYS', 'ORDSYS')
ORDER BY owner, table_name;

-- Revoke excessive PUBLIC grants
REVOKE EXECUTE ON utl_file FROM PUBLIC;
REVOKE EXECUTE ON utl_http FROM PUBLIC;
REVOKE EXECUTE ON utl_tcp FROM PUBLIC;
REVOKE EXECUTE ON utl_smtp FROM PUBLIC;
REVOKE EXECUTE ON dbms_advisor FROM PUBLIC;
```

---

## User Account Security Settings

```sql
-- Create a secure profile for application users
CREATE PROFILE app_profile LIMIT
  SESSIONS_PER_USER          5
  CPU_PER_SESSION            UNLIMITED
  CPU_PER_CALL               3000
  CONNECT_TIME               60
  IDLE_TIME                  15
  LOGICAL_READS_PER_SESSION  DEFAULT
  LOGICAL_READS_PER_CALL     1000000
  PRIVATE_SGA                15K
  FAILED_LOGIN_ATTEMPTS      5
  PASSWORD_LIFE_TIME         90
  PASSWORD_REUSE_TIME        365
  PASSWORD_REUSE_MAX         10
  PASSWORD_VERIFY_FUNCTION   ora12c_strong_verify_function
  PASSWORD_LOCK_TIME         1/24
  PASSWORD_GRACE_TIME        7;

-- Assign profile to user
ALTER USER app_user PROFILE app_profile;

-- Lock accounts that should never log in directly
ALTER USER schema_owner ACCOUNT LOCK;

-- Check for default passwords (Oracle 12c+)
SELECT username, account_status
FROM dba_users_with_defpwd
ORDER BY username;
```

---

## Best Practices

1. **Use schema separation**: The account that owns objects should be locked and never used for application connections. Application service accounts should only have grants on the objects they need.

2. **Never grant DBA to application accounts**: The DBA role grants almost every privilege in the database. Application service accounts must never hold it.

3. **Prefer roles over direct grants**: Roles make privilege management auditable and easier to revoke. Grant privileges to roles, grant roles to users.

4. **Avoid `WITH ADMIN OPTION` and `WITH GRANT OPTION`**: These allow privilege spread outside your control. Only grant them to DBA accounts when absolutely required.

5. **Never grant to PUBLIC**: Anything granted to PUBLIC is available to everyone. Even seemingly innocuous packages can be leveraged for SQL injection or data exfiltration.

6. **Run DBMS_PRIVILEGE_CAPTURE before major releases**: Capture the privileges used in a staging environment and ensure the production account has exactly those privileges.

7. **Audit DBA_SYS_PRIVS regularly**: Schedule a weekly or monthly job to report on any new system privilege grants and have them reviewed.

8. **Use the principle of separation of duties**: The user who creates data should not be the same user who can delete or export it.

---

## Common Mistakes and How to Avoid Them

### Mistake 1: Granting RESOURCE Role to Service Accounts

The `RESOURCE` role grants `CREATE TABLE`, `CREATE PROCEDURE`, `CREATE SEQUENCE`, and others. Application service accounts should never create their own objects.

```sql
-- BAD
GRANT RESOURCE TO webapp_svc;

-- GOOD: Grant only the specific object privileges needed
GRANT SELECT, INSERT, UPDATE ON app_schema.orders TO webapp_svc;
GRANT EXECUTE ON app_schema.order_pkg TO webapp_svc;
```

### Mistake 2: Using `SELECT ANY TABLE` Instead of Specific Grants

```sql
-- BAD: Allows reading every table in the entire database
GRANT SELECT ANY TABLE TO reporting_user;

-- GOOD: Create a view or grant specific tables
GRANT SELECT ON sales.orders TO reporting_user;
GRANT SELECT ON sales.order_lines TO reporting_user;
-- Or better: create a read-only role
GRANT reporting_role TO reporting_user;
```

### Mistake 3: Forgetting to Revoke Default Public Packages

```sql
-- Many dangerous packages are granted to PUBLIC by default
-- Revoke them and grant only to accounts that need them
REVOKE EXECUTE ON sys.dbms_backup_restore FROM PUBLIC;
REVOKE EXECUTE ON sys.utl_file FROM PUBLIC;
GRANT EXECUTE ON sys.utl_file TO etl_process_account;
```

### Mistake 4: Not Auditing Privilege Grant History

Without unified auditing enabled for privilege grants, you have no record of who granted what. Always audit `GRANT` and `REVOKE` statements (see `auditing.md`).

### Mistake 5: Granting Privileges Without Time Limits

Oracle does not have native privilege expiry, but you can implement it:

```sql
-- Create a job to revoke a temporary grant
BEGIN
  DBMS_SCHEDULER.CREATE_JOB(
    job_name        => 'REVOKE_TEMP_ACCESS',
    job_type        => 'PLSQL_BLOCK',
    job_action      => 'BEGIN EXECUTE IMMEDIATE ''REVOKE SELECT ON hr.employees FROM contractor_user''; END;',
    start_date      => SYSTIMESTAMP + INTERVAL '30' DAY,
    enabled         => TRUE,
    comments        => 'Auto-revoke temporary contractor access'
  );
END;
/
```

---

## Compliance Considerations

### SOX (Sarbanes-Oxley)
- Requires separation of duties between developers, DBAs, and business users
- Financial data tables must have documented access control lists
- Privileged access must be reviewed at least quarterly
- All DBA-level actions must be audited

### PCI-DSS
- Requirement 7: Restrict access to cardholder data by business need to know
- Requirement 8: Identify and authenticate access to system components
- Users accessing cardholder data must have the minimum necessary privileges
- Access control lists must be reviewed at least every six months

### HIPAA
- Minimum necessary standard: access only to PHI required for a user's role
- Technical safeguards must ensure only authorized users access ePHI
- Access must be unique per individual (no shared service account logins for humans)
- Audit logs of access to PHI tables must be maintained

```sql
-- Compliance query: identify users with broad access to sensitive schemas
SELECT DISTINCT grantee
FROM dba_tab_privs
WHERE owner IN ('HR', 'PAYROLL', 'FINANCE', 'HEALTH')
  AND grantee NOT IN (
    SELECT role FROM dba_roles  -- Exclude role names from results
  )
ORDER BY grantee;

-- Find users with system privileges that could bypass row-level security
SELECT grantee, privilege
FROM dba_sys_privs
WHERE privilege IN (
  'SELECT ANY TABLE',
  'INSERT ANY TABLE',
  'UPDATE ANY TABLE',
  'DELETE ANY TABLE',
  'EXEMPT ACCESS POLICY'  -- Bypasses VPD — extremely sensitive
)
ORDER BY grantee, privilege;
```

> **Critical**: The `EXEMPT ACCESS POLICY` privilege bypasses all Virtual Private Database (VPD) row-level security policies. It should never be granted to any user except for specific, documented ETL or DBA accounts, and its use must be heavily audited.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c Security Guide (DBSEG)](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/)
- [Oracle Database 19c SQL Language Reference — GRANT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/GRANT.html)
- [DBA_SYS_PRIVS — Oracle Database 19c Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_SYS_PRIVS.html)
- [DBMS_PRIVILEGE_CAPTURE — Oracle Database 19c PL/SQL Packages and Types Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_PRIVILEGE_CAPTURE.html)
