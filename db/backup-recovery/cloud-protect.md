# Oracle Database Zero Data Loss Cloud Protect

## Overview

Oracle Database Zero Data Loss Cloud Protect lets on-premises Oracle Databases use Oracle Zero Data Loss Autonomous Recovery Service in OCI for protected backups, real-time redo protection, and point-in-time recovery. It is operated from the database server through the Cloud Protect Fleet Agent, which is delivered through SQLcl and invoked with the `rcv` command.

Use this guide as an operational skill reference for onboarding, protecting, monitoring, and restoring on-premises databases with Recovery Service. For RMAN command fundamentals, see `rman-basics.md` and `rman-overview.md`.

---

## Core Concepts

**Recovery Service**
The OCI managed service that stores protected database backups and recovery catalog metadata. Recovery Service creates a protected database resource for each onboarded source database.

**Cloud Protect Fleet Agent**
A SQLcl-based tool installed on the on-premises database server. It discovers databases, generates onboarding configuration, registers protected databases with Recovery Service, configures RMAN integration, and reports protection status.

**Protected Database**
The Recovery Service resource representing a database that has been added to Recovery Service. The resource tracks health, recovery window, data loss exposure, protection policy, network details, metrics, work requests, and tags.

**Real-Time Data Protection**
An optional extra-cost mode that sends redo from the protected database to Recovery Service. It reduces potential data loss exposure and is recommended after onboarding.

**Protection Policy**
The policy that controls backup retention and the recovery window. Cloud Protect uses the Oracle-defined Bronze protection policy by default unless the generated configuration is changed before onboarding.

**SBT Library**
Cloud Protect uses the `libra.so` SBT library for RMAN backup and recovery operations with Recovery Service.

---

## Skill 1: Assess Cloud Protect Readiness

Use this skill before installing SQLcl or registering a database.

### Platform and Database Checks

- Confirm the database host is Linux x86-64.
- Confirm the database release is Oracle Database 19c RU 19.18 or later, or Oracle AI Database 26ai RU 23.4 or later.
- Confirm `COMPATIBLE` is `19.0.0` or higher.
- Confirm the Oracle Cloud tenancy, subscription, compartment, Recovery Service subnet, and network path are ready.
- Confirm mandatory Recovery Service onboarding requirements have been reviewed.

```sql
-- Run as a privileged database user.
SHOW PARAMETER compatible;

SELECT banner_full
FROM v$version;
```

### Encryption and Wallet Checks

Backups to Recovery Service require a TDE wallet to be set up and open even when TDE is not configured for the database. If PDBs use local TDE wallets, confirm each local wallet is open.

```sql
SELECT con_id, wallet_type, status, wallet_order
FROM v$encryption_wallet
ORDER BY con_id;
```

Prefer an external key management system, such as Oracle Key Vault, for production key custody. Do not treat a host-local wallet as sufficient protection against host compromise.

### DNS and Network Checks

- Confirm the on-premises network can resolve Recovery Service backup IP addresses.
- Confirm a DNS listener is available for requests from the on-premises network.
- Confirm the FQDN is registered with the Recovery Service subnet.
- Confirm firewall rules allow the required database-to-Recovery-Service traffic.

### SBT Library Checks

Cloud Protect requires `libra.so`.

```bash
echo "$ORACLE_HOME"
ls -l "$ORACLE_HOME/lib/libra.so"
```

For Oracle Database 19.27 or later, and Oracle AI Database 26ai RU 23.8 or later, `libra.so` should be available under `$ORACLE_HOME/lib` after database installation. For earlier supported database versions, download the library from My Oracle Support patch `37855779`.

---

## Skill 2: Install and Prepare SQLcl

Use this skill on each target database server or compute node where Cloud Protect commands must run.

### Install SQLcl RPM

Download the latest SQLcl RPM for the host operating system from Oracle yum, then install it as `root`.

```bash
rpm -ivh /path/to/sqlcl-linux-<version>.rpm
```

### Enable and Start the Scheduler

```bash
systemctl enable sql-scheduler
systemctl start sql-scheduler
systemctl status sql-scheduler
```

### Add SQLcl to the Oracle User PATH

Set the SQLcl binary path for the Oracle software owner, usually `oracle`.

```bash
export PATH=/opt/oracle/sqlcl/bin:$PATH
```

Persist the PATH update in the Oracle user's shell profile if the host standard allows it.

### Start SQLcl

```bash
/opt/oracle/sqlcl/bin/sql /nolog
```

Before running any `rcv` command, set `ORACLE_HOME`. In RAC, set it on the current node where SQLcl is running.

```bash
export ORACLE_HOME=/u01/app/oracle/product/19.0.0.0/dbhome_1
```

---

## Skill 3: Configure OCI API Authentication

Use this skill once per host or agent environment so the on-premises database can call Recovery Service APIs.

### Prepare API Key Material

1. In the OCI Console, add an API signing key for the OCI user or principal selected for Cloud Protect operations.
2. Generate the OCI configuration file for that key.
3. Store the private key and OCI config in a secure directory readable by the Oracle software owner.
4. Limit permissions on the key directory and key file.

```bash
chmod 700 /secure/oci
chmod 600 /secure/oci/config /secure/oci/oci_api_key.pem
```

### Register Authentication with Cloud Protect

Start SQLcl and configure authentication with the OCI config file.

```bash
/opt/oracle/sqlcl/bin/sql /nolog
```

```sql
SQL> rcv configure authentication -method api_key -oci_config /secure/oci/config
SQL> rcv show authentication
```

Keep the OCI config and private key outside shared writable locations. Rotate the key using the same operational process used for other OCI API signing keys.

---

## Skill 4: Discover and Add Databases to Recovery Service

Use this skill to register on-premises databases with Recovery Service and create protected database resources.

### Generate the Add-Database Configuration

Log in as the Oracle software owner and confirm `ORACLE_HOME` is set.

```bash
echo "$ORACLE_HOME"
/opt/oracle/sqlcl/bin/sql /nolog
```

In RAC, start SQLcl only on the first compute node for the onboarding workflow.

Run auto-discovery and generate the configuration file.

```sql
SQL> rcv add database -auto_discover -generate_config_only -compartment_id <COMPARTMENT_OCID> -recovery_service_subnets <RECOVERY_SERVICE_SUBNET_OCID>
```

Cloud Protect generates an `add_database.json` file. Review the generated path in the command output.

### Review and Edit `add_database.json`

The generated configuration contains one entry per discovered database. Review every value before registration.

```json
[
  {
    "dbUniqueName": "DB1",
    "displayName": "DB1",
    "compartmentId": "ocid1.compartment.oc1..example",
    "protectionPolicy": "ocid1.recoveryservicepolicy.oc1..example",
    "sbtLibrary": "/u01/app/oracle/product/19.27.0.0/dbhome_1/lib/libra.so",
    "oracleHome": "/u01/app/oracle/product/19.27.0.0/dbhome_1",
    "oracleSid": "DB1",
    "recoveryServiceSubnets": [
      "ocid1.subnet.oc1.phx.example"
    ]
  }
]
```

Check these fields especially:

- `dbUniqueName`: Must match the database unique name.
- `displayName`: Should be meaningful to OCI operators.
- `compartmentId`: Must be the target compartment OCID.
- `protectionPolicy`: Defaults to Bronze unless changed.
- `sbtLibrary`: Must point to the correct `libra.so`.
- `oracleHome`: Must match the database Oracle home.
- `oracleSid`: Must be correct for the target instance.
- `recoveryServiceSubnets`: Must contain the intended Recovery Service subnet OCID values.

### Register the Database

Run the add command again with the reviewed configuration.

```sql
SQL> rcv add database -config /u01/app/oracle/rcv/add_database.json
```

During registration, Cloud Protect validates prerequisites, creates or configures required database credentials, creates the Recovery Service protected database resource, waits for it to become active, retrieves network details, registers the database with the Recovery Service recovery catalog using RMAN, and configures the database for Cloud Protect.

After registration, Cloud Protect maintains data protection for the database.

### Connect Through the Named Recovery Connection

For later protected-database operations, connect using the generated named connection.

```bash
/opt/oracle/sqlcl/bin/sql -name <DB_UNIQUE_NAME>_rcv_conn
```

Example:

```bash
/opt/oracle/sqlcl/bin/sql -name c1db1_rcv_conn
```

---

## Skill 5: Enable Real-Time Data Protection

Use this skill after the database has been registered with Recovery Service.

1. Connect to the protected database using the generated named connection.

```bash
/opt/oracle/sqlcl/bin/sql -name <DB_UNIQUE_NAME>_rcv_conn
```

2. Add real-time redo protection.

```sql
SQL> rcv add realtime_redo
```

3. Restart the database for the configuration to take effect.

4. Verify protection health after the database is back online.

```sql
SQL> rcv show database
```

Real-time data protection is recommended because it lowers expected data loss exposure when the protected database is healthy.

---

## Skill 6: Check Protection Status

Use this skill for daily operations, post-onboarding validation, and incident triage.

### SQLcl Status Check

Connect as the `SYSBACKUP` recovery connection and show the database.

```bash
/opt/oracle/sqlcl/bin/sql -name <DB_UNIQUE_NAME>_rcv_conn
```

```sql
SQL> rcv show database
```

### Health Interpretation

| Health | Meaning | Typical Action |
|---|---|---|
| `Protected` | Recovery Service can recover within the full current recovery window. Data loss exposure is under the expected threshold. | Continue normal monitoring. |
| `Warning` | Recovery is still possible within the current recovery window, but data loss exposure is above the expected threshold. | Check recent backups, redo shipping, agent logs, network, and Recovery Service metrics. |
| `Alert` | Recovery Service cannot recover within the current recovery window and the latest backup has failed. | Treat as urgent. Check backup failures, SBT access, database connectivity, and Recovery Service work requests. |

For real-time protection, the expected healthy data loss exposure threshold is under 10 seconds. Without real-time protection, the expected threshold is under 120 minutes.

### OCI Console Status Check

In the OCI Console, open the protected database details page from the Protected databases list. Review:

- Health
- Real-time protection
- Management type
- Data loss exposure
- Protection policy
- Current recovery window
- Space usage
- DB unique name, database name, database identifier, and database version
- Backup location and compartment
- Network details
- Monitoring charts
- Work requests
- Tags

For active protected databases, OCI refreshes Health and Data loss exposure on the details page about once per minute.

---

## Skill 7: Back Up and Operate with `rcv`

Use this skill after onboarding when you need command discovery or explicit Cloud Protect operations.

### Command Pattern

```sql
SQL> rcv <action> <object> [options]
```

Examples:

```sql
SQL> help rcv
SQL> rcv show database
SQL> rcv show restore_range
SQL> rcv backup database
SQL> rcv run checks
```

### Command Families

| Action | Purpose |
|---|---|
| `add` | Add a database, protection policy, Recovery Service subnet, real-time redo, or schedule. |
| `configure` | Configure database, RMAN, RMAN environment, protection policy, Recovery Service subnet, schedule, or authentication. |
| `remove` | Remove a database, protection policy, real-time redo, or schedule. |
| `show` | Display database, RMAN, policy, subnet, schedule, authentication, or restore-range details. |
| `backup` | Back up a database. |
| `run` | Run checks. |
| `import` | Import a database. |

### SYSBACKUP Requirements

Commands that directly operate on a database, RMAN, schedules, real-time redo, backups, checks, or restore ranges generally require `SYSBACKUP` privileges. Object-management commands such as adding or showing policies, subnets, authentication, and imports do not require `SYSBACKUP`.

When in doubt, connect with the generated named connection:

```bash
/opt/oracle/sqlcl/bin/sql -name <DB_UNIQUE_NAME>_rcv_conn
```

---

## Skill 8: Prepare Restore from Recovery Service

Use this skill when restoring an on-premises database from Recovery Service backups.

### View the Available Restore Range

Connect through the Cloud Protect named connection.

```bash
/opt/oracle/sqlcl/bin/sql -name <DB_UNIQUE_NAME>_rcv_conn
```

```sql
SQL> rcv show restore_range
```

Use the restore range to decide the recovery target time, SCN, or sequence.

### Generate the RMAN Restore Environment

```sql
SQL> rcv configure rman_env
```

This generates an RMAN environment script and an RMAN restore template under the database-specific Cloud Protect directory, commonly under:

```text
/u01/app/oracle/rcv/dbs/<DB_UNIQUE_NAME>/rman_env/
```

Review and edit `rcv_restore_template.rman` with the required RMAN commands.

### Run RMAN with the Generated Environment

```bash
source /u01/app/oracle/rcv/dbs/<DB_UNIQUE_NAME>/rman_env/rman_env.sh
rman target / catalog /@<DB_UNIQUE_NAME>_DBRS \
  cmdfile /u01/app/oracle/rcv/dbs/<DB_UNIQUE_NAME>/rman_env/rcv_restore_template.rman
```

After RMAN connects to the target database and Recovery Service catalog, use regular RMAN commands such as `LIST`, `RESTORE`, and `RECOVER`.

### Example RMAN Restore Template

```sql
RUN {
  SET UNTIL TIME "TO_DATE('2026-06-01 10:00:00','YYYY-MM-DD HH24:MI:SS')";
  RESTORE DATABASE;
  RECOVER DATABASE;
}
```

For incomplete recovery, open with `RESETLOGS` after recovery completes.

```sql
ALTER DATABASE OPEN RESETLOGS;
```

---

## Skill 9: Monitor in OCI

Use this skill after onboarding to validate that OCI shows the expected protected database state.

### Protected Database Details

Open the OCI Console and navigate to the protected database details page from the Protected databases list. For OCI-managed and multicloud databases, the protected database page can also be reached from the database information page by selecting Autonomous Recovery Service in the Backup destination field.

### Details Tab

Review:

- Protection summary: Health, real-time protection, management type, data loss exposure, protection policy, current recovery window.
- Space usage: Current and projected recovery-window storage, long-term retention storage where supported, and protected database size.
- Protected database: DB unique name, database name, database identifier, and database version.
- General information: Backup location, compartment, backup configuration created time, and backup configuration updated time.

For Cloud Protect on-premises databases, Management type should indicate that the database is provisioned through Cloud Protect.

### Other Tabs

- `Network details`: Recovery Service subnets associated with the protected database.
- `Monitoring`: Default metric charts for the protected database.
- `Work requests`: Associated Recovery Service work requests.
- `Tags`: Tags applied to the protected database resource.

Set OCI Monitoring alarms for key Recovery Service metrics so failures or data loss exposure problems are not found only through manual checks.

---

## Operational Checklist

Use this checklist for a new on-premises database onboarding.

1. Confirm Linux x86-64, supported database release, and `COMPATIBLE >= 19.0.0`.
2. Confirm TDE wallet setup and open wallet status for CDB and PDBs.
3. Confirm DNS, FQDN registration, Recovery Service subnet, and network access.
4. Confirm `libra.so` exists or install the required SBT library patch.
5. Install SQLcl RPM on the target database host or nodes.
6. Enable and start `sql-scheduler`.
7. Set `/opt/oracle/sqlcl/bin` in the Oracle user's PATH.
8. Configure OCI API key authentication with `rcv configure authentication`.
9. Generate `add_database.json` using `rcv add database -auto_discover -generate_config_only`.
10. Review and edit compartment, policy, subnet, Oracle home, SID, and SBT library values.
11. Register the database with `rcv add database -config`.
12. Connect with `<DB_UNIQUE_NAME>_rcv_conn`.
13. Enable real-time redo protection with `rcv add realtime_redo`.
14. Restart the database if real-time redo protection was enabled.
15. Validate `rcv show database` returns the expected health.
16. Validate the OCI protected database details page.
17. Configure OCI Monitoring alarms.
18. Generate and test the RMAN restore environment before relying on the protection setup.

---

## Troubleshooting Guide

### `rcv` Commands Fail Immediately

- Confirm SQLcl is installed and the Oracle user's PATH includes `/opt/oracle/sqlcl/bin`.
- Confirm `ORACLE_HOME` is set for the current shell.
- In RAC, confirm the command is running from the correct node for the workflow.
- Run `help rcv` to confirm the Cloud Protect commands are available.

### Authentication Fails

- Confirm `rcv configure authentication` was run with the correct OCI config path.
- Confirm the Oracle user can read the OCI config and private key.
- Confirm the OCI user has the required Recovery Service permissions.
- Confirm the API key fingerprint in OCI matches the local config.

### Database Discovery Is Wrong or Incomplete

- Confirm `ORACLE_HOME`, `ORACLE_SID`, and local inventory are correct.
- Review the generated `add_database.json` before onboarding.
- Fix `oracleHome`, `oracleSid`, `dbUniqueName`, `sbtLibrary`, and subnet values before running `rcv add database -config`.

### Protected Database Remains Unhealthy

- Run `rcv show database`.
- Check Cloud Protect logs under `/u01/app/oracle/rcv/dbs/<DB_UNIQUE_NAME>/log` or the generated path shown by command output.
- Check OCI work requests for the protected database.
- Check database alert logs, SBT library accessibility, wallet status, and network reachability.
- Check whether real-time redo protection is enabled and whether redo shipping is current.

### Restore Preparation Fails

- Run `rcv show restore_range` and confirm Recovery Service has a usable restore range.
- Re-run `rcv configure rman_env`.
- Confirm the generated `rman_env.sh` points to the expected Oracle home, SBT configuration, and Recovery Service catalog connection.
- Confirm RMAN can connect to both `target /` and `catalog /@<DB_UNIQUE_NAME>_DBRS`.

---

## Command Quick Reference

```bash
# Start SQLcl without connecting.
/opt/oracle/sqlcl/bin/sql /nolog

# Connect to a protected database through the generated named connection.
/opt/oracle/sqlcl/bin/sql -name <DB_UNIQUE_NAME>_rcv_conn
```

```sql
-- Show available Cloud Protect commands.
SQL> help rcv

-- Configure OCI API key authentication.
SQL> rcv configure authentication -method api_key -oci_config /secure/oci/config

-- Show authentication configuration.
SQL> rcv show authentication

-- Generate add-database config from auto-discovery.
SQL> rcv add database -auto_discover -generate_config_only -compartment_id <COMPARTMENT_OCID> -recovery_service_subnets <RECOVERY_SERVICE_SUBNET_OCID>

-- Register databases from reviewed config.
SQL> rcv add database -config /u01/app/oracle/rcv/add_database.json

-- Enable real-time redo protection.
SQL> rcv add realtime_redo

-- Show protected database status.
SQL> rcv show database

-- Show restore range.
SQL> rcv show restore_range

-- Generate RMAN restore environment.
SQL> rcv configure rman_env

-- Run checks.
SQL> rcv run checks

-- Back up database explicitly.
SQL> rcv backup database
```

---

## Version Notes

- Treat Oracle Database 19c RU 19.18 as the minimum 19c level for Cloud Protect Fleet Agent usage.
- Treat Oracle AI Database 26ai RU 23.4 as the minimum 26ai level for Cloud Protect Fleet Agent usage.
- For `libra.so`, Oracle Database 19.27 or later and Oracle AI Database 26ai RU 23.8 or later should include the library under `$ORACLE_HOME/lib`.
- For earlier supported releases, plan the My Oracle Support SBT library patch before onboarding.

---

## Sources

- [Protecting On-premises Databases using Oracle Database Zero Data Loss Cloud Protect](https://docs.oracle.com/en-us/iaas/recovery-service/doc/protecting-premises-databases-using-recovery-service.html)
- [About Data Protection for On-Premises Databases](https://docs.oracle.com/en-us/iaas/recovery-service/doc/data-protection-premises-databases.html)
- [Prerequisites for Cloud Protect Fleet Agent](https://docs.oracle.com/en-us/iaas/recovery-service/doc/prerequisites-oracle-cloud-protect-fleet-agent.html)
- [Preparing to Use Cloud Protect Fleet Agent with SQLcl](https://docs.oracle.com/en-us/iaas/recovery-service/doc/preparing-use-oracle-cloud-protect-sqlcl.html)
- [Download and Set Up Cloud Protect Fleet Agent (SQLcl)](https://docs.oracle.com/en-us/iaas/recovery-service/doc/download-and-install-sqlcl.html)
- [Cloud Protect Fleet Agent Commands in SQLcl](https://docs.oracle.com/en-us/iaas/recovery-service/doc/list-oracle-cloud-protect-fleet-agent-commands-sqlcl.html)
- [Configuring OCI Authentication for Database Access to Recovery Service](https://docs.oracle.com/en-us/iaas/recovery-service/doc/configure-oci-authentication-database-access-recovery-service.html)
- [Add On-Premises Database to Recovery Service Using Cloud Protect](https://docs.oracle.com/en-us/iaas/recovery-service/doc/add-premises-database-recovery-service-using-cloud-protect.html)
- [Viewing On-Premises Database Protection Summary](https://docs.oracle.com/en-us/iaas/recovery-service/doc/viewing-premises-database-protection-summary.html)
- [Restore On-Premises Database Using Backups from Recovery Service](https://docs.oracle.com/en-us/iaas/recovery-service/doc/restore-premises-database-using-backups-recovery-service.html)
- [Using the OCI Console to View Protected Database Details](https://docs.oracle.com/en-us/iaas/recovery-service/doc/using-oci-console-view-protected-database-details.html)
