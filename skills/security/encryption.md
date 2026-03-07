# Oracle Database Encryption

## Overview

Encryption in Oracle protects data from unauthorized access at the storage layer — meaning that even if an attacker steals your datafiles, backup tapes, or tablespace exports, they cannot read the data without the encryption keys. This is a distinct protection layer from access control (which prevents unauthorized queries) and auditing (which detects unauthorized access). Together, they form a defense-in-depth strategy.

Oracle provides two primary encryption mechanisms:

- **Transparent Data Encryption (TDE)**: Encrypts datafiles, tablespaces, and individual columns on disk. The encryption and decryption is transparent to applications — queries, DML, and DDL work exactly as before.
- **DBMS_CRYPTO**: A PL/SQL API for encrypting specific values in application logic, useful for cases where the application needs to control the encryption beyond what TDE provides.

TDE requires the **Oracle Advanced Security Option**, which is a separately licensed extra-cost option for Oracle Database Enterprise Edition in on-premises deployments (including 19c). It is included without extra charge in certain Oracle Cloud database service tiers (BaseDB EE-HP, BaseDB EE-EP, ExaDB). Always verify current licensing with Oracle's official Licensing Information User Manual for your specific version and deployment type.

---

## Transparent Data Encryption Architecture

TDE uses a two-tier key hierarchy:

```
Oracle Wallet / Key Store
  └── Master Encryption Key (MEK)
        └── Table/Tablespace Encryption Key (DEK — Data Encryption Key)
              └── Encrypted data blocks on disk
```

The **Master Encryption Key (MEK)** is stored in the Oracle Wallet (a password-protected PKCS#12 container or hardware HSM). The **Data Encryption Keys (DEKs)** are stored encrypted by the MEK inside the database itself. To decrypt data, the wallet must be open (the MEK loaded into memory). Once open, Oracle handles encryption and decryption transparently.

---

## Oracle Wallet Setup and Management

### Creating the Wallet

```sql
-- Step 1: Set the wallet location in sqlnet.ora (or init.ora for 12c+)
-- File: $ORACLE_BASE/admin/<db_name>/wallet/

-- In sqlnet.ora:
-- ENCRYPTION_WALLET_LOCATION =
--   (SOURCE = (METHOD = FILE)
--     (METHOD_DATA = (DIRECTORY = /opt/oracle/admin/ORCL/wallet)))

-- In 19c+, use the WALLET_ROOT initialization parameter (recommended):
-- ENCRYPTION_WALLET_LOCATION in sqlnet.ora is deprecated as of Oracle 19c.
ALTER SYSTEM SET wallet_root = '/opt/oracle/admin/ORCL/wallet' SCOPE = SPFILE;
-- Requires restart; when WALLET_ROOT is set it takes precedence over sqlnet.ora
-- ENCRYPTION_WALLET_LOCATION. Use TDE_CONFIGURATION alongside WALLET_ROOT.

-- Set the TDE configuration (keystore type)
ALTER SYSTEM SET tde_configuration = 'KEYSTORE_CONFIGURATION=FILE' SCOPE = BOTH;
```

```sql
-- Step 2: Create the wallet (from SQL*Plus, connected as SYSDBA or with ADMINISTER KEY MANAGEMENT privilege)
ADMINISTER KEY MANAGEMENT CREATE KEYSTORE '/opt/oracle/admin/ORCL/wallet'
  IDENTIFIED BY "W@lletP@ssw0rd!";
-- Creates the ewallet.p12 file

-- Step 3: Open the wallet
ADMINISTER KEY MANAGEMENT SET KEYSTORE OPEN
  IDENTIFIED BY "W@lletP@ssw0rd!"
  CONTAINER = ALL;  -- Open in all PDBs (for CDB); use CURRENT for specific PDB

-- Step 4: Create (and activate) the Master Encryption Key
ADMINISTER KEY MANAGEMENT SET KEY
  IDENTIFIED BY "W@lletP@ssw0rd!"
  WITH BACKUP USING 'pre_tde_backup'
  CONTAINER = ALL;
```

### Auto-Login Wallet (for Unattended Restarts)

A password-protected wallet requires manual opening after every database restart. An auto-login wallet opens automatically:

```sql
-- Create an auto-login wallet from an existing password-protected wallet
ADMINISTER KEY MANAGEMENT CREATE AUTO_LOGIN KEYSTORE
  FROM KEYSTORE '/opt/oracle/admin/ORCL/wallet'
  IDENTIFIED BY "W@lletP@ssw0rd!";
-- Creates cwallet.sso (the auto-login file)

-- Check wallet status
SELECT wrl_type, wrl_parameter, status, wallet_type, keystore_mode, con_id
FROM v$encryption_wallet;
-- STATUS should be 'OPEN' and WALLET_TYPE should be 'AUTOLOGIN'

-- For a local auto-login wallet (cannot be used on a different server):
ADMINISTER KEY MANAGEMENT CREATE LOCAL AUTO_LOGIN KEYSTORE
  FROM KEYSTORE '/opt/oracle/admin/ORCL/wallet'
  IDENTIFIED BY "W@lletP@ssw0rd!";
```

### Wallet Management Commands

```sql
-- Open the wallet (required after manual restart if not auto-login)
ADMINISTER KEY MANAGEMENT SET KEYSTORE OPEN
  IDENTIFIED BY "W@lletP@ssw0rd!";

-- Close the wallet (encrypt data in memory; all TDE operations stop)
ADMINISTER KEY MANAGEMENT SET KEYSTORE CLOSE
  IDENTIFIED BY "W@lletP@ssw0rd!";

-- Backup the wallet
ADMINISTER KEY MANAGEMENT BACKUP KEYSTORE
  USING 'backup_tag_name'
  IDENTIFIED BY "W@lletP@ssw0rd!";

-- Check wallet and key status
SELECT key_id, creation_time, activation_time, key_use, keystore_type,
       origin, backed_up, con_id
FROM v$encryption_keys;

-- Check all keystore details
SELECT * FROM v$encryption_wallet;
```

---

## Tablespace Encryption

Encrypting entire tablespaces is the most common and recommended TDE deployment. All objects created in an encrypted tablespace (tables, indexes, LOBs, undo data) are automatically encrypted.

### Creating an Encrypted Tablespace

```sql
-- Create a new encrypted tablespace (AES256 is the recommended algorithm)
CREATE TABLESPACE sensitive_data
  DATAFILE '/opt/oracle/oradata/ORCL/sensitive_data01.dbf' SIZE 1G AUTOEXTEND ON
  ENCRYPTION USING AES256
  DEFAULT STORAGE (ENCRYPT);

-- AES128 is also available; 3DES168 is supported but not recommended for new deployments

-- Verify encryption
SELECT tablespace_name, encrypted
FROM dba_tablespaces
WHERE encrypted = 'YES';

-- Move a table to an encrypted tablespace
ALTER TABLE hr.employees MOVE TABLESPACE sensitive_data;

-- Rebuild indexes after table move (indexes do not move automatically)
ALTER INDEX hr.emp_emp_id_pk REBUILD TABLESPACE sensitive_data;
ALTER INDEX hr.emp_department_ix REBUILD TABLESPACE sensitive_data;

-- Move all indexes for a table to the encrypted tablespace
SELECT 'ALTER INDEX ' || owner || '.' || index_name ||
       ' REBUILD TABLESPACE sensitive_data;' AS rebuild_cmd
FROM dba_indexes
WHERE table_owner = 'HR' AND table_name = 'EMPLOYEES';
```

### Encrypting an Existing Tablespace (Online, 12c+)

```sql
-- Offline encryption (faster, requires downtime)
ALTER TABLESPACE users OFFLINE;
ALTER TABLESPACE users ENCRYPTION OFFLINE ENCRYPT;
ALTER TABLESPACE users ONLINE;

-- Online encryption (no downtime, uses AES256 by default)
ALTER TABLESPACE users ENCRYPTION ONLINE ENCRYPT;

-- Online encryption with specific algorithm
ALTER TABLESPACE users ENCRYPTION ONLINE USING AES256 ENCRYPT;

-- Check progress of online encryption
SELECT tablespace_name, encryption_status
FROM dba_tablespace_encryption_progress;

-- For tablespace with in-progress encryption
SELECT * FROM v$encrypted_tablespaces;
```

---

## Column-Level Encryption

Column-level TDE encrypts individual columns rather than entire tablespaces. It is more granular but has more overhead and limitations (encrypted columns cannot be indexed with standard indexes, and the column values are stored encrypted even in the buffer cache until decrypted for processing).

```sql
-- Add encryption to an existing column
ALTER TABLE hr.employees
  MODIFY (ssn ENCRYPT USING 'AES256' NO SALT);
-- SALT adds random data to prevent frequency analysis
-- NO SALT is needed if the column is used in a WHERE clause equality join
-- (salted values are different each encryption, so equality comparisons fail)

-- Encrypt a column with SALT (better security, cannot be queried with =)
ALTER TABLE patients.records
  MODIFY (credit_card_number ENCRYPT USING 'AES256');
-- SALT is the default; equivalent to: ENCRYPT USING 'AES256' SALT

-- Create a new table with an encrypted column
CREATE TABLE payroll.salary_data (
  employee_id   NUMBER(6)        NOT NULL,
  salary        NUMBER(8,2)      ENCRYPT USING 'AES256' NO SALT,
  bonus         NUMBER(8,2)      ENCRYPT USING 'AES256' NO SALT,
  bank_account  VARCHAR2(30)     ENCRYPT USING 'AES256',
  CONSTRAINT sal_emp_fk FOREIGN KEY (employee_id) REFERENCES hr.employees(employee_id)
);

-- Remove column encryption
ALTER TABLE hr.employees MODIFY (ssn DECRYPT);

-- Check which columns are encrypted
SELECT owner, table_name, column_name, encryption_alg, salt
FROM dba_encrypted_columns
ORDER BY owner, table_name, column_name;
```

### Encryption Algorithms Supported

| Algorithm | Key Length | Notes |
|---|---|---|
| `AES128` | 128-bit | Acceptable; NIST approved |
| `AES192` | 192-bit | Good choice |
| `AES256` | 256-bit | Recommended; FIPS 140-2 compliant; default in 23ai |
| `3DES168` | 168-bit | Legacy; not recommended for new deployments |
| `ARIA128` | 128-bit | Korean standard; for regulatory compliance in KR |
| `ARIA192` | 192-bit | Korean standard |
| `ARIA256` | 256-bit | Korean standard |
| `GOST256` | 256-bit | Russian standard — **deprecated in Oracle 23c; desupported and removed in Oracle 26ai**. Do not use for new deployments. |

> **Note on ARIA and GOST:** ARIA was added in Oracle 19c for offline tablespace encryption. GOST was also added in 19c but is deprecated in 23c and fully removed in Oracle 26ai. Use AES256 for all new deployments.

---

## Key Rotation

Regular key rotation is a security best practice and a compliance requirement in many frameworks. Oracle TDE supports re-keying without taking the database offline.

### Rotating the Master Encryption Key

```sql
-- Create a new Master Encryption Key (old key is retained to decrypt data
-- encrypted with the old key; Oracle handles the transition automatically)
ADMINISTER KEY MANAGEMENT SET KEY
  IDENTIFIED BY "W@lletP@ssw0rd!"
  WITH BACKUP USING 'pre_rotation_backup';

-- Verify the new key is active
SELECT key_id, creation_time, activation_time, key_use
FROM v$encryption_keys
ORDER BY creation_time DESC;
-- The most recently activated key is the current MEK

-- After rotation, re-encrypt tablespace DEKs with the new MEK (optional but recommended)
-- This ensures old MEK is no longer needed for any live data
ALTER TABLESPACE sensitive_data ENCRYPTION REKEY;
-- This is an online operation; it re-encrypts the tablespace DEK with the new MEK
```

### Key Rotation Best Practices for CDB/PDB

```sql
-- In a CDB, rotate the key for a specific PDB
ALTER SESSION SET CONTAINER = pdb_finance;

ADMINISTER KEY MANAGEMENT SET KEY
  IDENTIFIED BY "W@lletP@ssw0rd!"
  WITH BACKUP USING 'pdb_finance_rotation'
  CONTAINER = CURRENT;

-- Rotate for all PDBs at once
ADMINISTER KEY MANAGEMENT SET KEY
  IDENTIFIED BY "W@lletP@ssw0rd!"
  CONTAINER = ALL;
```

---

## DBMS_CRYPTO for Application-Layer Encryption

For cases where the application needs direct control over encryption (e.g., encrypting specific values before storing, or encrypting data that needs to be sent to an external system), use `DBMS_CRYPTO`:

```sql
-- Generate a random encryption key
DECLARE
  v_key RAW(32);  -- 256-bit key for AES256
BEGIN
  v_key := DBMS_CRYPTO.RANDOMBYTES(32);
  -- Store this key securely (in a key management system, not in the database)
  DBMS_OUTPUT.PUT_LINE('Key: ' || RAWTOHEX(v_key));
END;
/

-- Encrypt a value
DECLARE
  v_data      RAW(2000);
  v_key       RAW(32)   := HEXTORAW('YOUR_KEY_HEX_HERE');  -- 32 bytes = 256 bits
  v_iv        RAW(16)   := DBMS_CRYPTO.RANDOMBYTES(16);  -- Initialization vector
  v_encrypted RAW(2000);
  v_plaintext VARCHAR2(200) := 'Sensitive data here';
BEGIN
  v_data      := UTL_RAW.CAST_TO_RAW(v_plaintext);
  v_encrypted := DBMS_CRYPTO.ENCRYPT(
    src => v_data,
    typ => DBMS_CRYPTO.ENCRYPT_AES256 + DBMS_CRYPTO.CHAIN_CBC + DBMS_CRYPTO.PAD_PKCS5,
    key => v_key,
    iv  => v_iv
  );
  -- Store v_encrypted and v_iv together (you need both to decrypt)
  DBMS_OUTPUT.PUT_LINE('Encrypted: ' || RAWTOHEX(v_encrypted));
END;
/

-- Decrypt a value
DECLARE
  v_key       RAW(32)   := HEXTORAW('YOUR_KEY_HEX_HERE');
  v_iv        RAW(16)   := HEXTORAW('YOUR_IV_HEX_HERE');
  v_encrypted RAW(2000) := HEXTORAW('YOUR_ENCRYPTED_HEX_HERE');
  v_decrypted RAW(2000);
  v_plaintext VARCHAR2(200);
BEGIN
  v_decrypted := DBMS_CRYPTO.DECRYPT(
    src => v_encrypted,
    typ => DBMS_CRYPTO.ENCRYPT_AES256 + DBMS_CRYPTO.CHAIN_CBC + DBMS_CRYPTO.PAD_PKCS5,
    key => v_key,
    iv  => v_iv
  );
  v_plaintext := UTL_RAW.CAST_TO_VARCHAR2(v_decrypted);
  DBMS_OUTPUT.PUT_LINE('Decrypted: ' || v_plaintext);
END;
/

-- Hash a value (one-way; for passwords and integrity checks)
DECLARE
  v_hash RAW(32);
BEGIN
  v_hash := DBMS_CRYPTO.HASH(
    src => UTL_RAW.CAST_TO_RAW('value_to_hash'),
    typ => DBMS_CRYPTO.HASH_SH256
  );
  DBMS_OUTPUT.PUT_LINE('SHA256: ' || RAWTOHEX(v_hash));
END;
/

-- MAC (Message Authentication Code) for integrity verification
DECLARE
  v_mac RAW(32);
  v_key RAW(32) := HEXTORAW('YOUR_KEY_HEX_HERE');
BEGIN
  v_mac := DBMS_CRYPTO.MAC(
    src => UTL_RAW.CAST_TO_RAW('data to authenticate'),
    typ => DBMS_CRYPTO.HMAC_SH256,
    key => v_key
  );
  DBMS_OUTPUT.PUT_LINE('HMAC-SHA256: ' || RAWTOHEX(v_mac));
END;
/
```

---

## Encrypted Backup

TDE-encrypted tablespaces are backed up as encrypted by RMAN automatically. For non-TDE databases or additional backup encryption:

```sql
-- Configure RMAN encryption for backups
RMAN> CONFIGURE ENCRYPTION FOR DATABASE ON;
RMAN> CONFIGURE ENCRYPTION ALGORITHM 'AES256';

-- Encrypt backups with the TDE wallet (transparent)
RMAN> BACKUP DATABASE;

-- Encrypt backups with a passphrase (independent of wallet)
RMAN> SET ENCRYPTION ON IDENTIFIED BY "BackupP@ss!" ONLY;
RMAN> BACKUP DATABASE;

-- Verify backup encryption
RMAN> LIST BACKUP SUMMARY;
-- The ENCRYPTED column shows 'YES' for encrypted backups
```

---

## Monitoring and Verification

```sql
-- Verify all sensitive tablespaces are encrypted
SELECT ts.tablespace_name,
       CASE WHEN ts.encrypted = 'YES' THEN 'ENCRYPTED' ELSE 'NOT ENCRYPTED' END AS status,
       ts.block_size,
       ROUND(SUM(df.bytes)/1024/1024/1024, 2) AS size_gb
FROM dba_tablespaces ts
JOIN dba_data_files df ON df.tablespace_name = ts.tablespace_name
WHERE ts.tablespace_name NOT IN ('SYSTEM', 'SYSAUX', 'TEMP', 'UNDOTBS1')
GROUP BY ts.tablespace_name, ts.encrypted, ts.block_size
ORDER BY ts.tablespace_name;

-- Check which tables are in unencrypted tablespaces
SELECT t.owner, t.table_name, t.tablespace_name
FROM dba_tables t
JOIN dba_tablespaces ts ON ts.tablespace_name = t.tablespace_name
WHERE ts.encrypted = 'NO'
  AND t.owner NOT IN ('SYS', 'SYSTEM', 'CTXSYS', 'MDSYS', 'ORDSYS', 'XDB')
ORDER BY t.owner, t.table_name;

-- Audit TDE key management operations
SELECT event_timestamp, dbusername, action_name, sql_text
FROM unified_audit_trail
WHERE action_name LIKE 'ADMINISTER KEY MANAGEMENT%'
ORDER BY event_timestamp DESC;
```

---

## Best Practices

1. **Encrypt tablespaces, not just columns**: Tablespace encryption is simpler to manage, has less performance overhead than column encryption, and protects all data including indexes, undo, and temp data.

2. **Use AES256**: It is the strongest algorithm Oracle supports for TDE, is FIPS 140-2 compliant, and the performance difference vs AES128 is negligible on modern hardware.

3. **Use a local auto-login wallet in production only if the server itself is physically secured**: An auto-login wallet file (cwallet.sso) opens without a password. If the file is stolen along with the datafiles, the data can be decrypted.

4. **Back up the wallet separately from the database**: If you lose your wallet and your datafiles are encrypted, your data is gone. Store wallet backups in a separate, secured location.

5. **Enable wallet backups before key rotation**: Always use `WITH BACKUP` when rotating keys. The backup preserves the old key so you can decrypt older data if needed.

6. **Audit wallet operations**: All `ADMINISTER KEY MANAGEMENT` commands should be audited. A DBA who rotates keys without authorization can make data inaccessible.

7. **Test decrypt after encryption**: After enabling TDE on a tablespace, always run a test query to confirm data is readable. Confirm the wallet is the expected version.

8. **Document your key management procedures**: In a disaster recovery scenario, the procedure to restore and open the wallet is time-critical. Written run-books must be tested and stored securely.

---

## Common Mistakes and How to Avoid Them

### Mistake 1: Storing the Wallet in the Same Location as the Datafiles

```bash
# BAD: Wallet inside the database home or alongside the datafiles
/opt/oracle/oradata/ORCL/wallet/

# GOOD: Wallet on a separate filesystem, different from datafiles
/secure/keystore/ORCL/wallet/
# Or: HSM (Hardware Security Module) for highest security
```

### Mistake 2: Not Backing Up the Wallet Before Key Rotation

```sql
-- ALWAYS use WITH BACKUP when rotating
ADMINISTER KEY MANAGEMENT SET KEY
  IDENTIFIED BY "W@lletP@ssw0rd!"
  WITH BACKUP USING 'before_rotation_2026_01';  -- Tag the backup with date

-- Verify backup was created
SELECT key_id, backed_up, creation_time
FROM v$encryption_keys
ORDER BY creation_time DESC;
```

### Mistake 3: Using Column Encryption on Indexed Columns

Column-level TDE with SALT prevents standard index use (since every encryption of the same value is different). With NO SALT, equality queries work but frequency analysis attacks become possible.

```sql
-- For columns used in WHERE clauses: use NO SALT or prefer tablespace encryption
ALTER TABLE employees MODIFY (emp_code ENCRYPT USING 'AES256' NO SALT);

-- For columns never queried directly (e.g., stored bank account): SALT is fine
ALTER TABLE employees MODIFY (bank_account ENCRYPT USING 'AES256');  -- SALT is default
```

### Mistake 4: Forgetting That Exports Bypass TDE

Data Pump exports (`expdp`) decrypt data before export. The exported dump file is unencrypted unless you explicitly encrypt it:

```bash
# Always use ENCRYPTION when exporting TDE-protected data
expdp system/password FULL=Y \
  DUMPFILE=full_backup.dmp \
  ENCRYPTION=ALL \
  ENCRYPTION_PASSWORD=DumpFileP@ss! \
  ENCRYPTION_ALGORITHM=AES256
```

---

## Compliance Considerations

### PCI-DSS
- Requirement 3.4: Render PAN unreadable anywhere it is stored using strong cryptography
- TDE directly satisfies this requirement for stored cardholder data
- PCI-DSS requires AES-128 minimum; AES-256 is recommended
- Key management procedures must be documented (who can access keys, how often rotated)
- Requirement 3.5: Protect keys used to secure cardholder data against disclosure and misuse

### HIPAA
- 45 CFR 164.312(a)(2)(iv): Encryption and decryption of ePHI
- 45 CFR 164.312(e)(2)(ii): Encrypt ePHI in transit
- TDE satisfies the at-rest encryption addressable specification
- NIST guidelines recommend AES-256 for healthcare data at rest

### GDPR
- Article 32: Implement encryption of personal data as an appropriate technical measure
- While GDPR does not mandate specific algorithms, encryption is a primary example of appropriate measures
- Encrypted data that is breached may be exempt from breach notification if keys were not compromised

### FIPS 140-2
- For U.S. federal systems, FIPS 140-2 validated cryptographic modules are required
- Oracle's AES256 implementation is FIPS 140-2 validated
- Enable FIPS mode in Oracle Network:
  ```
  # In sqlnet.ora:
  SQLNET.FIPS_140 = TRUE
  ```

---

## Sources

- [Oracle Database Advanced Security Guide 19c — Using Transparent Data Encryption](https://docs.oracle.com/en/database/oracle/oracle-database/19/asoag/using-transparent-data-encryption.html)
- [Oracle Database Advanced Security Guide 19c — Changes in 19c (ARIA, GOST added)](https://docs.oracle.com/en/database/oracle/oracle-database/19/asoag/release-changes.html)
- [Oracle Database Reference 19c — WALLET_ROOT Parameter](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/WALLET_ROOT.html)
- [Oracle Database 19c Licensing Information User Manual](https://docs.oracle.com/en/database/oracle/oracle-database/19/dblic/Licensing-Information.html)
- [Oracle PL/SQL Packages Reference 19c — DBMS_CRYPTO](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_CRYPTO.html)
- [Oracle Database 19c New Features Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/newft/)
- [Oracle Support Note: How to Convert From SQLNET.ENCRYPTION_WALLET_LOCATION to WALLET_ROOT (Doc ID 2642694.1)](https://support.oracle.com/knowledge/Oracle%20Database%20Products/2642694_1.html)
