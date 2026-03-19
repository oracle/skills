# ORDS Installation and Configuration

## Overview

Installing Oracle REST Data Services (ORDS) involves downloading the software, preparing the Oracle Database, running the installation command to create/update the ORDS metadata schema, configuring database connection pools, and optionally setting up HTTPS. This guide covers self-managed ORDS installation — on-premises, OCI Compute, or in containers. For Autonomous Database, ORDS is pre-installed and this guide does not apply.

---

## Prerequisites

### Software Requirements

| Component | Minimum Version |
|---|---|
| Java (JDK/JRE) | 11 (17+ recommended for ORDS 23+) |
| Oracle Database | 11.2.0.4 (12c+ strongly recommended) |
| ORDS | 22.x or later (use latest) |
| OS | Linux x86-64, Windows, macOS (dev only) |

Check Java version before proceeding:

```shell
java -version
# Expected output example:
# java version "17.0.8" 2023-07-18 LTS
# Java(TM) SE Runtime Environment (Oracle) ...
```

### Database Prerequisites

ORDS installation requires a database user with DBA or equivalent privileges to create the ORDS_METADATA schema and ORDS_PUBLIC_USER account. Prepare:

1. A PDB (Pluggable Database) or a non-CDB to install ORDS into.
2. The SYS or a DBA-privileged account credentials for the initial install.
3. Sufficient tablespace: ORDS_METADATA schema requires ~50MB.

```sql
-- Verify you're connecting to the correct PDB
SHOW CON_NAME;

-- Check available tablespace
SELECT tablespace_name, bytes/1024/1024 AS mb_free
FROM dba_free_space
WHERE tablespace_name = 'SYSAUX'
ORDER BY 1;
```

---

## Downloading ORDS

ORDS is available from:
- [Oracle Technology Network (OTN)](https://www.oracle.com/database/sqldeveloper/technologies/db-actions/download/)
- Oracle Maven Repository (for CI/CD pipelines)
- Oracle Container Registry (Docker image)

```shell
# After downloading ords-latest.zip, extract it
unzip ords-latest.zip -d /opt/oracle/ords
ls /opt/oracle/ords
# ords.war   ords   docs/   ...

# Add ORDS bin to PATH
export PATH=$PATH:/opt/oracle/ords/bin
echo 'export PATH=$PATH:/opt/oracle/ords/bin' >> ~/.bashrc

# Verify
ords --version
# Oracle REST Data Services 24.x.x ...
```

---

## Configuration Directory Structure

ORDS uses a configuration directory (separate from the software installation) to store all settings. This directory must persist across upgrades.

```shell
# Create config directory
mkdir -p /opt/oracle/ords/config
export ORDS_CONFIG=/opt/oracle/ords/config
```

After installation, the config directory looks like:

```
/opt/oracle/ords/config/
├── databases/
│   └── default/
│       └── pool.json         # Connection pool settings (managed by CLI — do not hand-edit)
├── global/
│   └── settings.json         # Global ORDS settings (managed by CLI)
└── credentials              # Oracle Wallet directory — passwords stored here, never in JSON
```

> All configuration files are managed by the `ords config set` CLI. Do not hand-edit JSON files. Passwords are stored in the Oracle Wallet (`credentials/`) and never appear in any config file.

---

## The `ords install` Command Walkthrough

### Interactive Installation

Run the installer interactively for the first install:

```shell
ords --config /opt/oracle/ords/config install
```

The interactive installer prompts for:

1. **Connection type**: Basic (hostname/port/service) or TNS name or custom JDBC URL
2. **Database host**: e.g., `mydb.example.com`
3. **Database port**: e.g., `1521`
4. **Database service name**: e.g., `mypdb.example.com`
5. **ORDS administrator user**: typically `SYS AS SYSDBA` for initial install
6. **SYS password**
7. **ORDS runtime user** (ORDS_PUBLIC_USER password): set a strong password
8. **Tablespace for ORDS metadata**: default is SYSAUX
9. **Features to enable**: Database Actions, REST Enabled SQL, etc.

After install, ORDS creates:
- `ORDS_METADATA` schema in the database
- `ORDS_PUBLIC_USER` database account
- The pool configuration file in the config directory

### Silent/Non-Interactive Installation for Automation

For CI/CD pipelines, automated provisioning, or Ansible/Terraform workflows, use a silent install with a response file or environment variables.

**Method 1: Pipe responses via stdin**

```shell
ords --config /opt/oracle/ords/config install \
  --admin-user SYS \
  --db-hostname mydb.example.com \
  --db-port 1521 \
  --db-servicename mypdb.example.com \
  --feature-db-api true \
  --feature-rest-enabled-sql true \
  --feature-sdw true \
  --log-folder /var/log/ords \
  --password-stdin <<EOF
SysPassword123!
OrdsPublicUserPwd456!
EOF
```

**Method 2: Use `ords install --interactive false`**

```shell
ords --config /opt/oracle/ords/config install \
  --interactive false \
  --db-hostname mydb.example.com \
  --db-port 1521 \
  --db-servicename mypdb.example.com \
  --db-username ORDS_PUBLIC_USER \
  --admin-user SYS \
  --feature-sdw true
# Passwords prompted separately or via env vars
```

**Method 3: Pre-write pool configuration, then install with `--db-only`**

Write the pool config first, then run the DB install phase only:

```shell
ords --config /opt/oracle/ords/config config set db.hostname mydb.example.com
ords --config /opt/oracle/ords/config config set db.port 1521
ords --config /opt/oracle/ords/config config set db.servicename mypdb.example.com

# Set passwords via stdin
echo "SysPassword123!" | ords --config /opt/oracle/ords/config install \
  --admin-user "SYS AS SYSDBA" \
  --password-stdin
```

---

## Pool Configuration Reference

All pool settings are managed exclusively via the `ords config set` CLI. **Passwords are stored in an Oracle Wallet** in the `credentials/` directory — they never appear in any configuration file. Do not hand-edit the JSON config files ORDS generates.

```shell
# Set connection parameters
ords --config /opt/oracle/ords/config config set db.hostname mydb.example.com
ords --config /opt/oracle/ords/config config set db.port 1521
ords --config /opt/oracle/ords/config config set db.servicename mypdb.example.com
ords --config /opt/oracle/ords/config config set db.username ORDS_PUBLIC_USER

# Set password — stored in Oracle Wallet, never in a config file
ords --config /opt/oracle/ords/config config secret set db.password \
  --password-stdin <<< "MySecurePassword123!"

# UCP pool sizing
ords --config /opt/oracle/ords/config config set jdbc.InitialLimit 5
ords --config /opt/oracle/ords/config config set jdbc.MinLimit 5
ords --config /opt/oracle/ords/config config set jdbc.MaxLimit 30

# Feature flags
ords --config /opt/oracle/ords/config config set feature.sdw true
```

Key parameters:

| Parameter | Description | Recommended |
|---|---|---|
| `jdbc.InitialLimit` | Connections created at startup | 5-10 |
| `jdbc.MinLimit` | Minimum pool size maintained | 5-10 |
| `jdbc.MaxLimit` | Maximum connections (hard cap) | 20-50 (tune to DB max) |
| `jdbc.statementTimeout` | Seconds before idle statement closed | 900 |
| `jdbc.InactivityTimeout` | Seconds before idle connection closed | 1800 |
| `db.connectionType` | basic / tns / customurl | basic |

---

## Oracle Wallet Setup for mTLS (ATP/ADW)

When connecting ORDS to Autonomous Database (ATP or ADW), mTLS requires a wallet. This applies when running self-managed ORDS against ADB.

### Step 1: Download the Wallet

Download `Wallet_<DBName>.zip` from OCI Console → Autonomous Database → DB Connection.

```shell
mkdir -p /opt/oracle/ords/wallet
unzip Wallet_MYATP.zip -d /opt/oracle/ords/wallet
ls /opt/oracle/ords/wallet
# cwallet.sso  ewallet.p12  keystore.jks  ojdbc.properties
# sqlnet.ora   tnsnames.ora  truststore.jks
```

### Step 2: Configure ORDS Pool for mTLS

```shell
# Set connection type to TNS
ords --config /opt/oracle/ords/config config set db.connectionType tns

# Point to wallet directory (contains tnsnames.ora and sqlnet.ora)
ords --config /opt/oracle/ords/config config set db.tnsAliasName myatp_high
ords --config /opt/oracle/ords/config config set \
  db.wallet.zip.path /opt/oracle/ords/wallet/Wallet_MYATP.zip

# Or set TNS_ADMIN environment variable
export TNS_ADMIN=/opt/oracle/ords/wallet
```

Configure the pool for wallet-based connection via CLI:

```shell
ords --config /opt/oracle/ords/config config set db.connectionType tns
ords --config /opt/oracle/ords/config config set db.tnsAliasName myatp_high
ords --config /opt/oracle/ords/config config set \
  db.wallet.zip.path /opt/oracle/ords/wallet/Wallet_MYATP.zip
ords --config /opt/oracle/ords/config config set db.username ORDS_PUBLIC_USER
ords --config /opt/oracle/ords/config config secret set db.password \
  --password-stdin <<< "MySecurePassword123!"
```

---

## Configuring HTTPS/TLS

### Option A: ORDS Standalone with Self-Signed Certificate (Dev)

```shell
# Generate self-signed cert
keytool -genkeypair \
  -alias ords-ssl \
  -keyalg RSA \
  -keysize 2048 \
  -validity 365 \
  -keystore /opt/oracle/ords/config/ords/standalone/ords.jks \
  -storepass changeit \
  -dname "CN=myserver.example.com, OU=ORDS, O=MyOrg, C=US"
```

```shell
# Configure standalone to use it
ords --config /opt/oracle/ords/config config set \
  standalone.https.port 8443
ords --config /opt/oracle/ords/config config set \
  standalone.https.cert /opt/oracle/ords/config/ords/standalone/ords.jks
ords --config /opt/oracle/ords/config config set \
  standalone.https.cert.secret changeit
```

### Option B: ORDS behind a Reverse Proxy (Recommended for Production)

Run ORDS on HTTP (port 8080) behind Nginx or Apache HTTPD which terminates TLS. ORDS receives plain HTTP internally.

```nginx
# /etc/nginx/conf.d/ords.conf
server {
    listen 443 ssl;
    server_name api.mycompany.com;

    ssl_certificate     /etc/ssl/certs/mycompany.crt;
    ssl_certificate_key /etc/ssl/private/mycompany.key;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location /ords/ {
        proxy_pass         http://localhost:8080/ords/;
        proxy_set_header   Host $host;
        proxy_set_header   X-Forwarded-For $remote_addr;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }
}
```

Set ORDS to trust the forwarded-proto header:

```shell
ords --config /opt/oracle/ords/config config set \
  security.forceHTTPS true
```

---

## Starting and Stopping ORDS

```shell
# Start in foreground (dev)
ords --config /opt/oracle/ords/config serve

# Start with specific port
ords --config /opt/oracle/ords/config serve --port 8080

# Run as background service (Linux systemd)
```

```ini
# /etc/systemd/system/ords.service
[Unit]
Description=Oracle REST Data Services
After=network.target

[Service]
Type=simple
User=oracle
Environment="ORDS_CONFIG=/opt/oracle/ords/config"
ExecStart=/opt/oracle/ords/bin/ords --config /opt/oracle/ords/config serve
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```shell
systemctl daemon-reload
systemctl enable ords
systemctl start ords
systemctl status ords
```

---

## Upgrading ORDS

ORDS upgrades are two-phase: update the software, then upgrade the database metadata schema.

```shell
# 1. Stop ORDS
systemctl stop ords

# 2. Download and extract new ORDS version
unzip ords-24.x.x.zip -d /opt/oracle/ords_new

# 3. Update PATH to point to new version
export PATH=/opt/oracle/ords_new/bin:$PATH

# 4. Upgrade the ORDS schema in the database
# (uses existing pool config — no re-install needed)
ords --config /opt/oracle/ords/config install \
  --admin-user "SYS AS SYSDBA" \
  --db-hostname mydb.example.com \
  --db-port 1521 \
  --db-servicename mypdb.example.com

# 5. Start new ORDS version
systemctl start ords

# 6. Verify
ords --version
curl http://localhost:8080/ords/_/db-api/stable/metadata-catalog/
```

The `ords install` command is idempotent — re-running it upgrades the schema if already present and creates it fresh if not.

---

## Best Practices

- **Separate config directory from software directory**: The config dir should persist across software upgrades. Store in `/opt/oracle/ords/config` (not inside the ORDS software directory).
- **Use ORDS CLI for all config changes**: Avoid manually editing XML files. The CLI handles wallet management, schema validation, and config refresh.
- **Passwords live in the Oracle Wallet**: ORDS stores all passwords in an Oracle Wallet (`credentials/` in the config directory). Passwords never appear in any config file. Always use `ords config secret set db.password` to set or rotate credentials — never attempt to write a password directly into a config file.
- **Use TNS aliases for ADB**: Wallet-based connections via TNS aliases are more maintainable than custom JDBC URLs.
- **Test with `ords validate`** before starting after a config change: `ords --config /path/config validate` checks pool connectivity and reports issues.
- **Set `jdbc.MaxLimit` based on DB max sessions**: Too high a limit can exhaust DB connections. Use `SELECT * FROM v$resource_limit WHERE resource_name = 'sessions'` to check limits.
- **Keep ORDS log directory on fast storage**: High-throughput ORDS servers write significant log volume. Use SSD-backed volumes for log directories.

## Common Mistakes

- **Not upgrading the DB schema after upgrading ORDS software**: Running new ORDS against old schema causes errors. Always run `ords install` after upgrading the binary.
- **Setting `jdbc.MaxLimit` too low (default 10)**: The default is appropriate for development. Production needs 20-100+ depending on concurrency.
- **Using TNS without setting `TNS_ADMIN`**: If the wallet directory path is set but `TNS_ADMIN` is not, Oracle JDBC cannot find `tnsnames.ora`.
- **Running ORDS as root**: Always run ORDS as a dedicated OS user (`oracle` or `ords`) with no unnecessary privileges.
- **Forgetting to open firewall ports**: ORDS standalone defaults to port 8080 (HTTP) and 8443 (HTTPS). Ensure these are allowed through OS firewall and cloud security groups.
- **Installing into the CDB root**: Always install ORDS into a PDB, not the CDB root. ORDS_METADATA in CDB root causes schema resolution issues.

---


## Security Considerations

### Secure Installation Practices

- **Never run ORDS installation as root** - always use a dedicated OS user:
  ```bash
  # Create dedicated ORDS OS user
  sudo useradd -r -s /bin/false ords

  # Install ORDS as the ords user
  sudo -u ords ords --config /opt/oracle/ords/config install
  ```

- **Restrict database credentials used during installation:**
  - Use the least privileged account needed for installation (SYSAS SYSDBA is required for initial install)
  - Consider using a dedicated installation account with limited privileges instead of SYS for repeatable installs
  - After installation, remove any temporary accounts created during the process

- **Secure the installation process:**
  - Download ORDS from official Oracle sources only
  - Verify checksums/signatures of downloaded ORDS packages
  - Keep ORDS software and configuration directories backed up and secured

- **Installation environment security:**
  - Perform installation in a secure, isolated environment
  - Ensure network isolation during installation if possible
  - Monitor installation logs for suspicious activity

### Database Security During Installation

- **Secure ORDS schema creation:**
  ```sql
  -- Instead of using default tablespace (might be shared)
  CREATE TABLESPACE ords_meta_tbs
    DATAFILE '/u01/app/oracle/oradata/ORDS_METADATA01.DBF'
    SIZE 100M AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED;

  -- Then specify during installation:
  # During interactive install, specify the custom tablespace
  # Or via silent install:
  ords config set db.tablespace ords_meta_tbs
  ```

- **Restrict ORDS_METADATA schema privileges:**
  - The ORDS_METADATA schema only needs specific privileges to function
  - Review and minimize privileges granted to ORDS_METADATA after installation
  - Consider using Database Vault to protect the ORDS_METADATA schema

- **Secure ORDS_PUBLIC_USER account:**
  - ORDS_PUBLIC_USER should only have CREATE SESSION privilege
  - All actual database access should be through proxy authentication or specific schema privileges
  - Never grant excessive privileges to ORDS_PUBLIC_USER

### Credential Security

- **Always use the Oracle Wallet for credential storage:**
  ```bash
  # CORRECT: Passwords stored in Oracle Wallet only
  ords --config /opt/oracle/ords/config config secret set db.password \
    --password-stdin <<< "SecureDatabasePassword123!"

  # INCORRECT: Attempting to store passwords in config files (won't work)
  # DO NOT ATTEMPT TO MANUALLY EDIT pool.json TO ADD PASSWORDS
  ```

- **Use strong, unique passwords for all ORDS-related accounts:**
  - SYS account used for installation: strong, unique password
  - ORDS_PUBLIC_USER: strong, unique password (stored in wallet)
  - Any proxy accounts: strong, unique passwords
  - Never grant excessive privileges to ORDS_PUBLIC_USER
  - Consider using password generators for high entropy passwords

- **Password rotation procedures:**
  - Establish regular password rotation schedules (e.g., every 90 days)
  - Use automated tools for password rotation where possible
  - Update all related systems when passwords change

- **Consider using cybersecurity frameworks** for password management:
  - NIST SP 800-63B for password guidelines
  - CIS Controls for privileged account management

### Network Security During Installation

- **Secure database connections during installation:**
  - Prefer TCPS/TLS connections even during installation
  - If using TCP, ensure network is trusted and monitored

- **Restrict access to installation ports:**
  - If using ORDS standalone during installation, restrict access to installation host
  - Consider installing ORDS in a DMZ or isolated network segment

- **Secure communication channels:**
  - Use SSH tunnels for remote installation processes
  - Ensure installation scripts and configuration files are transferred securely

### Configuration Security

- **Secure the ORDS configuration directory:**
  ```bash
  # Restrict access to configuration directory
  sudo chown -R ords:ords /opt/oracle/ords/config
  sudo chmod -R 750 /opt/oracle/ords/config
  sudo chmod 700 /opt/oracle/ords/config/credentials  # Wallet directory
  ```

- **Protect backup configurations:**
  - Encrypt ORDS configuration backups
  - Store backups in secure, access-controlled locations
  - Apply same access controls to backups as live configuration

- **Secure wallet backups:**
  - The Oracle Wallet in credentials/ contains all passwords
  - Back up the wallet securely and separately from other backups
  - Ensure wallet backups are encrypted and access-controlled

### HTTPS/TLS Configuration Security

- **Use strong TLS configurations:**
  ```bash
  # Disable weak TLS versions and cipher suites
  ords --config /opt/oracle/ords/config config set \
    java.opts "-Djdk.tls.disabledAlgorithms=SSLv3,TLSv1,TLSv1.1,RC4,DES,MD5withRSA,DH keySize<1024,FALSE"
  ```

- **Use certificates from trusted sources:**
  - Prefer certificates from commercial CAs or internal PKI
  - If using self-signed certificates, ensure proper certificate validation in clients
  - Consider using certificate pinning for high-security applications

- **Implement proper certificate lifecycle management:**
  - Monitor certificate expiration dates
  - Automate certificate renewal where possible
  - Test certificate changes in staging before production deployment

### Feature Security Configuration

- **Disable unnecessary features during installation:**
  ```bash
  # Only enable features that are actually needed
  ords --config /opt/oracle/ords/config config set feature.sdw false  # Disable if not needed
  ords --config /opt/oracle/ords/config config set feature.db-api false  # Disable if not needed
  ords --config /opt/oracle/ords/config config set feature.rest-enabled-sql false  # Disable if not needed
  ```

- **Security implications of ORDS features:**
  - **Database Actions (SDW)**: Provides powerful SQL execution interface - disable if not needed
  - **REST Enabled SQL**: Allows arbitrary SQL execution - ensure properly secured if enabled
  - **AutoREST**: Automatically generates CRUD endpoints - review generated endpoints for security

- **Secure feature configuration:**
  - Review and secure each enabled feature according to its security best practices
  - Consider enabling features gradually and testing security implications

### Monitoring and Logging Security

- **Secure logging configuration:**
  ```bash
  # Store logs in secure location with restricted access
  ords --config /opt/oracle/ords/config config set log.folder /var/log/ords

  # Restrict access to log directory
  sudo mkdir -p /var/log/ords
  sudo chown ords:ords /var/log/ords
  sudo chmod 750 /var/log/ords
  ```

- **Monitor installation and configuration changes:**
  - Audit changes to ORDS configuration
  - Monitor for failed login attempts or suspicious activity
  - Consider integrating ORDS logs with SIEM solutions

- **Enable request logging for security monitoring** (in appropriate environments):
  ```bash
  # Enable access logging (be mindful of performance impact)
  ords --config /opt/oracle/ords/config config set jdbc.DebugPrintStatementBounds true
  ```

### Deployment Environment Security

- **Separate environments securely:**
  - Use separate ORDS configurations for development, testing, and production
  - Ensure production credentials are never used in non-production environments
  - Consider using environment-specific configuration directories

- **Secure the deployment process:**
  - Use secure deployment pipelines (CI/CD) with proper access controls
  - Implement approval gates for production deployments
  - Maintain audit trails of all configuration changes

- **Container security considerations** (if using Docker):
  ```dockerfile
  # Example secure ORDS Dockerfile practices
  FROM oraclelinux:8-slim

  # Create non-root user
  RUN groupadd -r ords && useradd -r -g ords ords

  # Install ORDS as non-root user
  USER ords

  # Set secure permissions
  RUN chmod 750 /opt/oracle/ords/config

  # Exclude sensitive files from image
  # Mount credentials directory as volume at runtime
  ```

### Compliance Considerations During Installation

- **PCI-DSS**:
  - Ensure installation process doesn't expose cardholder data environments
  - Implement strong access controls for installation credentials
  - Log and monitor all installation activities

- **HIPAA**:
  - Ensure installation process protects ePHI
  - Implement access controls and audit trails for installation activities
  - Consider encryption of installation logs containing PHI references

- **SOX**:
  - Implement change control procedures for ORDS installation
  - Document and approve all installation and configuration changes
  - Maintain audit trail of installation activities

- **GDPR**:
  - Ensure installation process protects personal data
  - Implement data protection by design during installation
  - Consider data minimization in installation logging

### Post-Installation Security Validation

- **Validate installation security:**
  ```bash
  # Check that passwords are not in config files
  grep -r "password" /opt/oracle/ords/config/ --exclude-dir=credentials

  # Verify wallet directory permissions
  ls -la /opt/oracle/ords/config/credentials/

  # Check OS user ORDS is running as
  ps -ef | grep ords

  # Validate network exposure
  # Ensure ORDS is not directly exposed to internet without reverse proxy/WAF
  ```

- **Perform security testing:**
  - Conduct vulnerability scans on installed ORDS instance
  - Perform penetration testing (in authorized environments only)
  - Validate authentication and authorization controls

- **Establish security baseline:**
  - Document secure configuration baseline
  - Implement configuration drift detection
  - Regularly validate against security baseline

## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle REST Data Services Installation and Configuration Guide](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/ordig/index.html)
- [ORDS CLI Reference — ords install](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/ordig/installing-oracle-rest-data-services.html)
- [ORDS Configuration Settings Reference](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/24.2/ordig/configuration-settings.html)
