# Oracle User Management

## Overview

Oracle user management encompasses creating database users, controlling what those users can access (privileges and roles), enforcing security policies through profiles, and managing account lifecycle (locking, expiring, unlocking). In a Multitenant (CDB/PDB) environment, additional concepts of common users and local users apply.

Proper user management is foundational to database security. Mismanaged accounts — stale service accounts, default passwords, overprivileged schemas — are among the most common vectors for data breaches.

---

## CREATE USER Syntax

### Basic User Creation

```sql
-- Minimum required: username and authentication
CREATE USER app_user IDENTIFIED BY "S3cur3P@ss!";

-- Full example with common attributes
CREATE USER app_user
  IDENTIFIED BY "S3cur3P@ss!"
  DEFAULT TABLESPACE app_data
  TEMPORARY TABLESPACE temp
  QUOTA 500M ON app_data
  QUOTA UNLIMITED ON app_indexes
  PROFILE app_profile
  ACCOUNT UNLOCK
  PASSWORD EXPIRE;  -- force password change on first login
```

### Key CREATE USER Clauses

**`IDENTIFIED BY`** — password authentication (most common)

**`IDENTIFIED EXTERNALLY`** — OS-authenticated user (username must match OS user prefixed by `os_authent_prefix`, default `OPS$`)

**`IDENTIFIED GLOBALLY`** — Oracle Internet Directory (LDAP/OID) or Oracle Cloud authentication

**`DEFAULT TABLESPACE`** — where the user's objects are created if no tablespace is specified. Defaults to `USERS` (or `SYSTEM` if `USERS` doesn't exist — avoid this).

**`TEMPORARY TABLESPACE`** — where sort operations spill to disk. Should always point to a shared temporary tablespace, not `SYSTEM`.

**`QUOTA`** — how much space the user can consume in a tablespace. Without a quota, the user can create objects but cannot allocate any extents. `UNLIMITED` removes the cap.

**`PROFILE`** — assigns a resource and password policy profile (see below).

**`PASSWORD EXPIRE`** — immediately expires the password, forcing the user to change it on first login. A security best practice for new accounts.

**`ACCOUNT LOCK / UNLOCK`** — creates the account locked (prevents login until explicitly unlocked).

### Altering Users

```sql
-- Change password
ALTER USER app_user IDENTIFIED BY "NewP@ssw0rd!";

-- Modify tablespace quota
ALTER USER app_user QUOTA UNLIMITED ON app_data;
ALTER USER app_user QUOTA 0 ON app_data;  -- revoke all quota (cannot add to existing objects)

-- Change profile
ALTER USER app_user PROFILE high_security_profile;

-- Lock an account
ALTER USER app_user ACCOUNT LOCK;

-- Unlock an account
ALTER USER app_user ACCOUNT UNLOCK;

-- Expire password (force reset on next login)
ALTER USER app_user PASSWORD EXPIRE;

-- Change default tablespace
ALTER USER app_user DEFAULT TABLESPACE new_tablespace;
```

### Dropping Users

```sql
-- Drop user with no objects (will fail if objects exist)
DROP USER app_user;

-- Drop user and all their owned objects (schema)
DROP USER app_user CASCADE;
```

`CASCADE` drops all objects owned by the user, including tables, indexes, views, procedures, sequences, etc. Use with extreme caution — this is irreversible.

---

## Profile Management

A **profile** is a named set of limits that controls password policy and resource consumption. Every user is assigned exactly one profile. If no profile is specified at user creation, the `DEFAULT` profile is used.

### Creating Profiles

```sql
CREATE PROFILE app_profile LIMIT
  -- Password limits
  FAILED_LOGIN_ATTEMPTS    5          -- lock after 5 consecutive failures
  PASSWORD_LOCK_TIME       1/24       -- lock for 1 hour (fractions of a day)
  PASSWORD_LIFE_TIME       90         -- password expires after 90 days
  PASSWORD_REUSE_TIME      365        -- cannot reuse a password for 365 days
  PASSWORD_REUSE_MAX       10         -- cannot reuse any of the last 10 passwords
  PASSWORD_GRACE_TIME      7          -- 7-day grace period after expiry before lockout
  PASSWORD_VERIFY_FUNCTION ora12c_strong_verify_function  -- complexity check function

  -- Resource limits (requires RESOURCE_LIMIT = TRUE)
  SESSIONS_PER_USER        10         -- max concurrent sessions
  CPU_PER_SESSION          UNLIMITED
  CPU_PER_CALL             3000       -- max CPU units per SQL call
  CONNECT_TIME             480        -- max session duration in minutes (8 hours)
  IDLE_TIME                30         -- disconnect idle sessions after 30 minutes
  LOGICAL_READS_PER_SESSION UNLIMITED
  PRIVATE_SGA              UNLIMITED;
```

### Password Verification Functions

Oracle ships built-in password complexity functions:
- `ora12c_strong_verify_function` — requires mixed case, digits, special characters, minimum 9 chars
- `ora12c_verify_function` — less strict
- `verify_function_11G` — older, less strict

You can also write a custom PL/SQL function that follows the documented interface:

```sql
-- View built-in password functions (in SYS schema)
SELECT object_name FROM dba_objects
WHERE object_name LIKE '%VERIFY%'
  AND object_type = 'FUNCTION'
  AND owner = 'SYS';
```

### Common Profile Limits Reference

| Parameter | Description | Recommended (Prod) |
|---|---|---|
| `FAILED_LOGIN_ATTEMPTS` | Lockout after N failures | 5–10 |
| `PASSWORD_LOCK_TIME` | Duration of lockout | 1/24 (1 hour) or UNLIMITED |
| `PASSWORD_LIFE_TIME` | Days until expiry | 90 (or per policy) |
| `PASSWORD_REUSE_TIME` | Days before reuse | 365 |
| `PASSWORD_REUSE_MAX` | Previous passwords blocked | 10 |
| `IDLE_TIME` | Disconnect idle sessions (minutes) | 30–60 |
| `SESSIONS_PER_USER` | Concurrent sessions | Per app design |
| `CONNECT_TIME` | Max session duration (minutes) | 480 or UNLIMITED |

### Modifying and Dropping Profiles

```sql
-- Modify an existing profile
ALTER PROFILE app_profile LIMIT
  PASSWORD_LIFE_TIME 60
  IDLE_TIME          20;

-- Drop a profile (reassign users first, or use CASCADE)
DROP PROFILE app_profile;               -- fails if users are assigned
DROP PROFILE app_profile CASCADE;       -- reassigns users to DEFAULT profile
```

### Enabling Resource Limits

Resource limits (CPU, SESSIONS, IDLE_TIME, etc.) are only enforced if the `RESOURCE_LIMIT` parameter is `TRUE`. Password limits are always enforced regardless.

```sql
-- Check if resource limits are enforced
SHOW PARAMETER resource_limit;

-- Enable resource limit enforcement
ALTER SYSTEM SET RESOURCE_LIMIT = TRUE SCOPE=BOTH;
```

---

## Default and Temporary Tablespace Assignment

### Database-Level Defaults

Oracle has a database-level default tablespace and default temporary tablespace. Any user created without explicit tablespace assignments inherits these.

```sql
-- View database-level defaults
SELECT property_name, property_value
FROM database_properties
WHERE property_name IN ('DEFAULT_PERMANENT_TABLESPACE', 'DEFAULT_TEMP_TABLESPACE');

-- Set database-level defaults
ALTER DATABASE DEFAULT TABLESPACE users;
ALTER DATABASE DEFAULT TEMPORARY TABLESPACE temp;
```

### Temporary Tablespace Groups

Multiple temporary tablespaces can be grouped so Oracle assigns users to the least-loaded member:

```sql
-- Create a temporary tablespace group
CREATE TEMPORARY TABLESPACE temp1
  TEMPFILE '/oradata/temp1_01.tmp' SIZE 2G AUTOEXTEND ON
  TABLESPACE GROUP temp_group;

CREATE TEMPORARY TABLESPACE temp2
  TEMPFILE '/oradata/temp2_01.tmp' SIZE 2G AUTOEXTEND ON
  TABLESPACE GROUP temp_group;

-- Assign a user to the group
ALTER USER app_user TEMPORARY TABLESPACE temp_group;
```

### Monitoring Tablespace Quotas

```sql
-- View all user quotas
SELECT username, tablespace_name,
       bytes/1048576 used_mb,
       max_bytes/1048576 quota_mb,
       CASE WHEN max_bytes = -1 THEN 'UNLIMITED' ELSE TO_CHAR(max_bytes/1048576) END quota_display
FROM dba_ts_quotas
ORDER BY username, tablespace_name;

-- Users with no quota (cannot allocate extents)
SELECT u.username
FROM dba_users u
WHERE NOT EXISTS (
  SELECT 1 FROM dba_ts_quotas q
  WHERE q.username = u.username
    AND (q.max_bytes = -1 OR q.max_bytes > 0)
)
  AND u.account_status = 'OPEN'
ORDER BY u.username;
```

---

## Account Locking and Unlocking

### Automatic Locking

Oracle automatically locks an account after `FAILED_LOGIN_ATTEMPTS` consecutive failed logins (as defined in the user's profile). The lock duration is `PASSWORD_LOCK_TIME` (can be `UNLIMITED`, requiring manual unlock).

```sql
-- Find locked accounts
SELECT username, account_status, lock_date
FROM dba_users
WHERE account_status LIKE '%LOCKED%'
ORDER BY lock_date;

-- Unlock a specific account
ALTER USER app_user ACCOUNT UNLOCK;

-- Unlock and expire password (force reset)
ALTER USER app_user ACCOUNT UNLOCK PASSWORD EXPIRE;
```

### Expired Passwords

When a password reaches `PASSWORD_LIFE_TIME`, the account enters `EXPIRED` or `EXPIRED (GRACE)` status. Users can still log in during the grace period but must change their password immediately.

```sql
-- Find expired accounts
SELECT username, account_status, expiry_date
FROM dba_users
WHERE account_status IN ('EXPIRED', 'EXPIRED(GRACE)')
ORDER BY expiry_date;

-- Reset an expired password
ALTER USER app_user IDENTIFIED BY "NewP@ssw0rd!";

-- Expire a password (force change)
ALTER USER app_user PASSWORD EXPIRE;
```

### Account Status Reference

| Status | Meaning |
|---|---|
| `OPEN` | Active, no issues |
| `LOCKED` | Explicitly locked by DBA |
| `LOCKED (TIMED)` | Locked due to failed login attempts |
| `EXPIRED` | Password expired; grace period ended |
| `EXPIRED (GRACE)` | Password expired; within grace period |
| `EXPIRED & LOCKED` | Both expired and locked |
| `EXPIRED (GRACE) & LOCKED` | Both expired (grace) and locked |

---

## Proxy Authentication

Proxy authentication allows one database user (the **proxy user**) to connect on behalf of another user (the **client user**). The connection appears as the client user in `V$SESSION`, but the proxy user's credentials are used for authentication.

**Use cases:**
- Connection pooling where a pool user connects on behalf of application users
- Auditing — the real end-user identity is preserved in audit trails
- PL/SQL middle-tier applications

```sql
-- Grant proxy rights: allow proxy_user to connect as client_user
ALTER USER client_user GRANT CONNECT THROUGH proxy_user;

-- Restrict proxy to specific roles
ALTER USER client_user GRANT CONNECT THROUGH proxy_user
  WITH ROLE reporting_role;

-- Revoke proxy rights
ALTER USER client_user REVOKE CONNECT THROUGH proxy_user;

-- View proxy authorizations
SELECT proxy, client, proxy_authority, role
FROM proxy_users;
```

### Connecting via Proxy (SQL*Plus / JDBC)

```bash
# SQL*Plus: connect as proxy_user acting as client_user
sqlplus proxy_user[client_user]/<proxy_password>@service_name
```

```java
// JDBC: set proxy properties
Properties props = new Properties();
props.put("PROXY_USER_NAME", "client_user");
Connection conn = DriverManager.getConnection(url, "proxy_user", "proxy_password");
((OracleConnection)conn).openProxySession(OracleConnection.PROXYTYPE_USER_NAME, props);
```

---

## Common Users in a CDB (Multitenant Architecture)

In Oracle Multitenant, a **Container Database (CDB)** contains the root container (CDB$ROOT) and one or more **Pluggable Databases (PDBs)**. Users can be either:

- **Common users** — created in the CDB root; exist in CDB$ROOT and optionally in all PDBs
- **Local users** — created within a specific PDB; exist only in that PDB

### Common Users

Common users are prefixed by convention with `C##` (enforced by default since Oracle 12c). They authenticate against the CDB root but can be granted privileges in individual PDBs.

```sql
-- Connect to CDB root to create a common user
ALTER SESSION SET CONTAINER = CDB$ROOT;

CREATE USER c##dba_admin
  IDENTIFIED BY "P@ssw0rd!"
  CONTAINER = ALL;   -- or CURRENT (only in root)

-- Grant common roles
GRANT c##connect, c##resource TO c##dba_admin CONTAINER=ALL;

-- Grant DBA privilege in all PDBs
GRANT DBA TO c##dba_admin CONTAINER=ALL;

-- Grant privileges in a specific PDB only
GRANT DBA TO c##dba_admin CONTAINER=CURRENT;
```

### Local Users (in a PDB)

```sql
-- Connect to a specific PDB first
ALTER SESSION SET CONTAINER = pdb_production;
-- or connect directly: sqlplus sys/<password>@pdb_production AS SYSDBA

-- Create a local user (no C## prefix required)
CREATE USER app_owner
  IDENTIFIED BY "P@ssw0rd!"
  DEFAULT TABLESPACE app_data
  TEMPORARY TABLESPACE temp
  QUOTA UNLIMITED ON app_data;

GRANT CONNECT, RESOURCE TO app_owner;
```

### Key CDB/PDB User Management Queries

```sql
-- View all common users
SELECT username, common, account_status, created
FROM cdb_users
WHERE common = 'YES'
ORDER BY username;

-- View users across all PDBs (from CDB root)
SELECT con_id, username, account_status, default_tablespace
FROM cdb_users
ORDER BY con_id, username;

-- Find which container you're in
SELECT sys_context('USERENV','CON_NAME') current_container FROM dual;

-- Switch containers
ALTER SESSION SET CONTAINER = pdb_production;
ALTER SESSION SET CONTAINER = CDB$ROOT;
```

### Changing the C## Prefix Requirement

By default, Oracle enforces the `C##` prefix for common users. This can be changed (not recommended for security, but sometimes needed for legacy applications):

```sql
-- Allow common users without C## prefix (not recommended)
ALTER SYSTEM SET "_common_user_prefix" = '' SCOPE=SPFILE;
-- Requires restart
```

---

## Useful User Management Queries

```sql
-- Complete user inventory
SELECT username, account_status, default_tablespace,
       temporary_tablespace, profile, created, last_login,
       authentication_type
FROM dba_users
ORDER BY username;

-- Users with default password (immediate security risk)
SELECT username, account_status
FROM dba_users
WHERE password = 'DEFAULT' OR authentication_type = 'PASSWORD'
  AND account_status = 'OPEN';

-- Check for users using the DEFAULT profile (may have weak settings)
SELECT username FROM dba_users WHERE profile = 'DEFAULT';

-- Profile settings comparison (all profiles)
SELECT profile, resource_name, limit
FROM dba_profiles
WHERE resource_name IN (
  'FAILED_LOGIN_ATTEMPTS','PASSWORD_LIFE_TIME',
  'PASSWORD_REUSE_TIME','PASSWORD_REUSE_MAX',
  'IDLE_TIME','SESSIONS_PER_USER'
)
ORDER BY profile, resource_name;

-- Users who have not logged in recently (stale accounts)
SELECT username, last_login, account_status
FROM dba_users
WHERE last_login < SYSDATE - 90
  AND account_status = 'OPEN'
ORDER BY last_login;

-- Failed login attempts (from audit trail or login tracking)
SELECT username, os_username, terminal, timestamp, returncode
FROM dba_audit_trail
WHERE returncode IN (1017, 28000)  -- 1017=bad password, 28000=locked
  AND timestamp > SYSDATE - 1
ORDER BY timestamp DESC;
```

---

## Best Practices

- **Apply the principle of least privilege.** Create application accounts with only the specific object privileges required. Avoid granting `DBA` or `RESOURCE` to application users.

- **Never use SYS or SYSTEM as the application schema owner.** Create dedicated schemas for each application.

- **Assign a profile to every production user** — do not leave users on the `DEFAULT` profile. The `DEFAULT` profile's limits may not match your security policy.

- **Use `PASSWORD EXPIRE`** when creating new accounts to force the user to set their own password.

- **Lock all default Oracle accounts** that are not in use. Many default accounts (e.g., `SCOTT`, `HR`, `OUTLN`) exist in new databases and should be locked or expired.
  ```sql
  -- Lock all non-essential Oracle-supplied accounts
  -- (customize the exclusion list for your environment)
  SELECT 'ALTER USER ' || username || ' ACCOUNT LOCK;'
  FROM dba_users
  WHERE oracle_maintained = 'Y'
    AND account_status != 'EXPIRED & LOCKED';
  ```

- **Enable Unified Auditing** to track privilege use, failed logins, and schema changes.

- **Review stale accounts monthly.** Lock accounts for users who have left the organization or whose projects have ended.

- **Use proxy authentication for connection pools** to preserve end-user identity in audit trails.

---

## Common Mistakes and How to Avoid Them

**Granting DBA to application users**
The `DBA` role includes the ability to drop tables, read any table, create users, and more. Application accounts should have only `CONNECT` and specific object privileges. Audit `DBA` role grants regularly:
```sql
SELECT grantee, granted_role FROM dba_role_privs WHERE granted_role = 'DBA';
```

**Not setting a quota — and being surprised when INSERTs fail**
A user without a quota can be granted `RESOURCE` or `CREATE TABLE` but cannot actually store any rows. Always set explicit quotas or `UNLIMITED` on the user's default tablespace.

**Leaving the DEFAULT profile unchanged**
Many organizations leave `DEFAULT` with `PASSWORD_LIFE_TIME = UNLIMITED` and no `FAILED_LOGIN_ATTEMPTS` limit. This means no lockout and no password rotation. Harden the `DEFAULT` profile or create custom profiles and assign them.
```sql
ALTER PROFILE DEFAULT LIMIT
  FAILED_LOGIN_ATTEMPTS 10
  PASSWORD_LIFE_TIME     180;
```

**Manually editing DBA_USERS without using ALTER USER**
There is no legitimate reason to directly update `USER$` or related base tables. Always use `ALTER USER`. Direct manipulation can leave the data dictionary in an inconsistent state.

**Forgetting that DROP USER CASCADE is permanent**
`DROP USER foo CASCADE` drops all objects owned by `foo` immediately and without confirmation. Always verify the schema contents before running this command in production.
```sql
-- Check what a user owns before dropping
SELECT object_type, COUNT(*) FROM dba_objects WHERE owner = 'APP_USER' GROUP BY object_type;
```

**CDB: Creating local users in CDB$ROOT**
Local users (without `C##`) created in CDB$ROOT are technically common users without the prefix enforcement. They cause confusion and management complexity. Always create application users as local users inside the appropriate PDB.

---

## Sources

- [Oracle Database Security Guide 19c — Managing Security for Oracle Database Users](https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/managing-security-for-oracle-database-users.html)
- [Oracle Database 19c SQL Language Reference — CREATE USER](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-USER.html)
- [Oracle Database 19c SQL Language Reference — ALTER USER](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ALTER-USER.html)
- [Oracle Database 19c SQL Language Reference — CREATE PROFILE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-PROFILE.html)
- [Oracle Database 19c Reference — DBA_USERS](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_USERS.html)
