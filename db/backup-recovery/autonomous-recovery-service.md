# Oracle Database Autonomous Recovery Service

## Overview

Oracle Database Autonomous Recovery Service is a managed Oracle Cloud service for protecting Oracle Databases with centralized backup storage, policy-based retention, immutable backup protection, monitoring, and recovery workflows. It is based on Oracle Zero Data Loss Recovery Appliance technology and supports Oracle Databases in OCI, Oracle Multicloud, and on-premises environments.

Use this guide as an operational skill reference for planning, enabling, managing, monitoring, and troubleshooting Recovery Service for OCI and Oracle Multicloud databases. For on-premises database onboarding with Cloud Protect Fleet Agent and SQLcl `rcv` commands, see `cloud-protect.md`.

This guide intentionally excludes the PDF sections "What's New in Recovery Service" and "Protecting On-premises Databases using Oracle Database Zero Data Loss Cloud Protect".

---

## Core Concepts

**Recovery Service**
The OCI managed service that stores protected database backups and recovery catalog metadata. It centralizes backup protection across supported Oracle Database deployments.

**Protected Database**
The Recovery Service resource representing a database that sends backups to Recovery Service. It tracks health, data loss exposure, recovery window, protection policy, storage usage, network details, work requests, metrics, and tags.

**Protection Policy**
The policy that controls backup retention, retention lock, and, for Oracle Multicloud databases, preferred backup storage location. Each protected database must have exactly one protection policy.

**Recovery Service Subnet**
The Recovery Service network presence in a database VCN. It identifies one or more private IPv4-only subnets used for backup and recovery traffic between databases and Recovery Service.

**Recovery Window**
The maximum time range, counting backward from the current time, in which the database can be recovered.

**Real-Time Data Protection**
An optional extra-cost feature that continuously sends redo from a protected database to Recovery Service to reduce RPO toward the last sub-second.

**Long-Term Retention Backup**
An on-demand backup retained independently from automatic backups. Recovery Service supports LTR backups for OCI Databases, Oracle Database@Azure, and Oracle Database@Google Cloud.

---

## Skill 1: Assess Recovery Service Readiness

Use this skill before enabling automatic backups or creating protected database resources.

### Database and Platform Checks

- Confirm the target is a supported Oracle Cloud Database or Oracle Multicloud Database.
- Confirm the platform is Linux x86-64 where platform validation applies.
- Confirm `COMPATIBLE` is `19.0.0` or higher.
- Confirm the database release is supported:
  - Oracle AI Database 26ai RU 23.4 or later
  - Oracle Database 21c RU 21.7 or later
  - Oracle Database 19c RU 19.16 or later
- For real-time data protection, confirm one of:
  - Oracle AI Database 26ai RU 23.4 or later
  - Oracle Database 21c RU 21.8 or later
  - Oracle Database 19c RU 19.18 or later

```sql
SHOW PARAMETER compatible;

SELECT banner_full
FROM v$version;
```

### Backup Destination Checks

Operational backups to two destinations can create data loss scenarios. Before enabling automatic backups to Recovery Service, disable manual backup scripts or processes that target other operational backup destinations.

### Limit Checks

In the OCI Console, review service limits before onboarding:

1. Open Governance & Administration.
2. Open Tenancy Management.
3. Select Limits, Quotas and Usage.
4. Select Autonomous Recovery Service.
5. Review protected database count and recovery-window storage usage.

For Oracle Multicloud databases, select the correct multicloud subscription before requesting a limit increase. Otherwise the increase applies to OCI resources.

---

## Skill 2: Configure Recovery Service Networking

Use this skill when planning or validating the network path between a database VCN and Recovery Service.

### Subnet Requirements

- Use an IPv4-only subnet. Recovery Service does not support IPv6-enabled subnets.
- Prefer a private subnet in the same VCN where the database resides.
- Use a recommended subnet size of `/24`.
- Use `/27` only as a lower bound if available IP addresses are constrained.
- Register only one Recovery Service subnet per VCN unless you are adding multiple subnets to the same Recovery Service subnet resource for capacity.
- Multiple protected databases can use the same Recovery Service subnet.

For OCI databases, Recovery Service can automatically register the backup subnet if it has enough free IP addresses. You can use the automatically registered subnet or register your own.

### Security Rules

Recovery Service needs stateful network access on two destination ports:

| Port | Purpose |
|---|---|
| `8005` | Backup traffic from the database to Recovery Service. |
| `2484` | SQL*Net connections to the RMAN catalog and real-time data protection traffic. |

Add stateful ingress rules to the Recovery Service subnet or NSG:

- Source: database VCN CIDR, database subnet CIDR, or database NSG depending on your network model
- Protocol: TCP
- Destination port: `8005`
- Destination port: `2484`

If subnet-to-subnet traffic is restricted, add egress rules from the database subnet or database NSG to the Recovery Service subnet or NSG on ports `8005` and `2484`.

If both security lists and NSGs exist, validate the NSG rules carefully because NSG rules take precedence for attached VNICs.

### Register a Recovery Service Subnet

In the OCI Console:

1. Open Oracle Database.
2. Open Database Backups.
3. Select Recovery Service Subnets.
4. Select Register Recovery Service subnet.
5. Enter a non-sensitive name.
6. Select the compartment and VCN.
7. Select the subnet configured for Recovery Service operations.
8. If needed, add another subnet for private endpoint capacity.
9. If using NSGs, add up to five Recovery Service NSGs.
10. Select Register.

### Manage Subnet Capacity

If a Recovery Service subnet runs out of available private IP addresses:

- Add another subnet to the Recovery Service subnet resource, or
- Use a different Recovery Service subnet.

When replacing a subnet, add the new subnet first, then delete the old subnet. A Recovery Service subnet must always be associated with at least one subnet in the database VCN.

---

## Skill 3: Choose or Create a Protection Policy

Use this skill before enabling automatic backups or changing backup retention.

### Oracle-Defined Policies

| Policy | Retention |
|---|---:|
| Bronze | 14 days |
| Silver | 35 days |
| Gold | 65 days |
| Platinum | 95 days |

Oracle-defined policies cannot be modified. Silver is the default policy when enabling automatic backups to Recovery Service.

### Custom Policies

Create a custom policy when the Oracle-defined policies do not match your retention, lock, or multicloud backup-location requirements.

Custom policy rules:

- Retention must be from `14` to `95` days.
- Retention lock is optional.
- For Oracle Database@Azure, Oracle Database@Google Cloud, and Oracle Database@AWS, you can choose whether backups stay in Oracle Cloud or in the same cloud provider as the database.

Caution: You cannot undo the "Store backups in the same cloud provider as the database" option after creating the policy.

### Retention Lock

Use retention lock to protect backups from accidental modification or malicious deletion.

- The scheduled lock date must be at least 14 days in the future.
- During the delay period, you can change retention or disable the lock.
- After the lock takes effect, you cannot disable retention lock.
- After the lock takes effect, you can only increase retention, up to 95 days.
- Backups cannot be modified or deleted until the retention period ends.
- A protected database cannot be assigned to a different policy while its current policy is permanently locked.

### Create a Protection Policy

In the OCI Console:

1. Open Oracle Database.
2. Open Database Backups.
3. Select Protection Policies.
4. Select Create protection policy.
5. Enter a non-sensitive name.
6. Select the compartment.
7. Enter backup retention from `14` to `95` days.
8. Optionally enable retention lock and schedule the lock date.
9. Optionally select same-cloud backup storage for Oracle Multicloud databases.
10. Add tags if required.
11. Select Create.

---

## Skill 4: Enable Automatic Backups to Recovery Service

Use this skill to configure an OCI or Oracle Multicloud database to use Recovery Service.

### Enable Backup Protection

In the OCI Console:

1. Open Oracle Database.
2. Open the relevant database service.
3. Navigate to the target database details page.
4. From Actions, select Configure automatic backups.
5. Select Enable automatic backups.
6. Set Backup destination to Autonomous Recovery Service.
7. Select a protection policy.
8. Review the backup location.
9. Review whether the selected policy has retention lock enabled.
10. Optionally enable real-time data protection.
11. Choose backup retention behavior after database termination:
    - Retain backups according to the protection policy retention period.
    - Retain backups for 72 hours, then delete.
12. Select Save.

After automatic backups are enabled, Recovery Service creates a protected database resource.

### What Recovery Service Backs Up

Recovery Service uses Oracle-managed automatic backups:

- Initial RMAN level 0 backup
- Successive RMAN level 1 incremental backups
- Backups retained according to the selected protection policy

Do not rely on separate manual operational backup destinations once Recovery Service automatic backups are enabled.

---

## Skill 5: Review Protected Database Health

Use this skill for daily operations, post-onboarding validation, and incident triage.

### OCI Console Status Check

Open:

```text
Oracle Database > Database Backups > Protected Databases
```

Select the protected database and review:

- Health
- Real-time protection
- Management type
- Data loss exposure
- Protection policy
- Current recovery window
- Recovery-window current space used
- Recovery-window projected space used for policy
- Long-term retention current space used, if applicable
- Protected database size
- Last failed backup
- Last completed backup
- Last backup duration
- DB unique name
- Database version
- Subscription
- Backup location
- Network details
- Monitoring
- Work requests
- Tags

### Health Interpretation

| Health | Meaning | Typical Action |
|---|---|---|
| `Protected` | Recovery Service can recover to any point in the full recovery window. Data loss exposure is under the expected threshold. | Continue normal monitoring. |
| `Warning` | Recovery is available in the current recovery window, but data loss exposure is above the expected threshold. | Check backups, redo shipping, network, metrics, and work requests. |
| `Alert` | Recovery Service cannot recover within the current recovery window and the latest backup failed. | Treat as urgent. Investigate backup failure, subnet, ports, and work requests. |

Expected data loss exposure threshold:

- With real-time data protection: under 10 seconds.
- Without real-time data protection: under 120 minutes.

For active protected databases, the details page refreshes Health and Data loss exposure about once per minute.

---

## Skill 6: Enable Real-Time Data Protection

Use this skill when the database needs lower RPO than scheduled backups can provide.

Real-time data protection continuously transfers redo to Recovery Service and can reduce RPO toward the last sub-second. It is an extra-cost option.

### Supported Releases

- Oracle AI Database 26ai RU 23.4 or later
- Oracle Database 21c RU 21.8 or later
- Oracle Database 19c RU 19.18 or later

### Enable from Automatic Backup Settings

1. Open the protected database details page.
2. Select the linked source database.
3. From Actions, select Configure automatic backups.
4. Enable Real-time data protection.
5. Select Save.

After enabling, verify the protected database details page shows real-time protection enabled and that Data loss exposure stays within the expected threshold.

---

## Skill 7: Create Long-Term Retention Backups

Use this skill for compliance, regulatory, or business-retention backup needs that exceed the automatic backup recovery window.

### Support and Retention

Recovery Service supports LTR backups for:

- OCI Databases
- Oracle Database@Azure
- Oracle Database@Google Cloud

LTR retention range:

- `90` to `3650` days
- `1` to `10` years

LTR backups are independent of automatic backups and are stored in Object Storage Infrequent Access.

### Create an LTR Backup

In the OCI Console:

1. Open the source database details page.
2. Select the Backups tab.
3. Select Create Backup.
4. Select Specify long-term backup retention period.
5. Enter the retention period in days or years.
6. Create the backup.

Recovery Service deletes the LTR backup after its retention period ends.

When terminating a database, LTR backups follow the termination backup option:

- Delete backups in 72 hours.
- Delete based on policy, retaining LTR backups until their specified retention period ends.

---

## Skill 8: Recover a Database from Recovery Service

Use this skill when restoring an OCI database from automatic backups created by Recovery Service.

### Restore Options

Recovery Service supports:

- Restore to latest
- Restore to timestamp
- Restore to SCN

LTR backups are restored by creating a new database. The in-place restore options do not apply to LTR backups.

### Restore from Automatic Backups

In the OCI Console:

1. Open Oracle Database.
2. Open the relevant database service.
3. Navigate to the target database.
4. From Actions, select Restore.
5. Choose one:
   - Restore to the latest
   - Restore to a timestamp
   - Restore to SCN
6. Confirm the restore.

Validate recovery by checking the database state, protected database health, and subsequent backup status.

---

## Skill 9: Monitor Recovery Service

Use this skill to build operational dashboards and alarms for protected databases.

### Metric Namespace

```text
oci_recovery_service
```

### Metric Dimensions

| Dimension | Meaning |
|---|---|
| `resourceId` | Protected database OCID. |
| `dBUniqueName` | Unique name identifying the protected database. |

### Default Metrics

| Metric | Unit | Typical Use |
|---|---|---|
| `SpaceUsedForRecoveryWindow` | GB | Track backup storage used to meet recovery window. |
| `ProtectedDatabaseSize` | GB | Track source database size protected by Recovery Service. |
| `ProtectedDatabaseHealth` | Count | Alert on health changes. `0` means Protected, `1` means Warning, `2` means Alert. |
| `DataLossExposure` | Seconds | Alert when potential data loss exceeds RPO. |

### View Metrics

For one protected database:

```text
Protected database details > Monitoring
```

For multiple protected databases:

```text
Observability & Management > Monitoring > Service Metrics > oci_recovery_service
```

For custom queries:

```text
Observability & Management > Monitoring > Metrics Explorer
```

### Recommended Alarms

- `ProtectedDatabaseHealth >= 1`
- `ProtectedDatabaseHealth == 2`
- `DataLossExposure` above your RPO threshold
- `SpaceUsedForRecoveryWindow` above your storage planning threshold

---

## Skill 10: Use Recovery Service APIs and CLI

Use this skill when automating Recovery Service operations or reviewing IAM requirements.

### Protected Database Operations

| Task | API |
|---|---|
| Create protected database | `CreateProtectedDatabase` |
| Dry-run protected database creation | `CreateProtectedDatabase` with `opc-dry-run` |
| Get protected database | `GetProtectedDatabase` |
| Update protected database | `UpdateProtectedDatabase` |
| Fetch network configuration | `FetchProtectedDatabaseConfiguration` |
| Move compartment | `ChangeProtectedDatabaseCompartment` |
| Schedule deletion | `ScheduleProtectedDatabaseDeletion` |
| Cancel deletion | `CancelProtectedDatabaseDeletion` |
| Delete protected database | `DeleteProtectedDatabase` |

Use a dry run before creation to catch:

- Recovery Service subnet with insufficient free IP addresses
- Missing network-management permissions
- Service capacity limits
- Quota limits
- Duplicate database ID
- Missing or inactive protection policy
- Missing Recovery Service subnet registration

### Protection Policy Operations

| Task | API |
|---|---|
| Create policy | `CreateProtectionPolicy` |
| Get policy | `GetProtectionPolicy` |
| Update policy | `UpdateProtectionPolicy` |
| Move compartment | `ChangeProtectionPolicyCompartment` |
| Delete policy | `DeleteProtectionPolicy` |

### Recovery Service Subnet Operations

| Task | API |
|---|---|
| Create subnet resource | `CreateRecoveryServiceSubnet` |
| Get subnet resource | `GetRecoveryServiceSubnet` |
| Update subnet resource | `UpdateRecoveryServiceSubnet` |
| Move compartment | `ChangeRecoveryServiceSubnetCompartment` |
| Delete subnet resource | `DeleteRecoveryServiceSubnet` |

### LTR Backup Operations

| Task | API |
|---|---|
| Create LTR backup | `CreateLongTermBackup` |
| List LTR backups | `ListLongTermBackups` |
| Get LTR backup | `GetLongTermBackup` |
| Update LTR backup | `UpdateLongTermBackup` |
| Cancel LTR backup | `CancelLongTermBackup` |
| Delete LTR backup | `DeleteLongTermBackup` |

### IAM Resource Types

| Resource Type | Purpose |
|---|---|
| `recovery-service-family` | All Recovery Service resources. |
| `recovery-service-protected-database` | Protected database resources. |
| `recovery-service-policy` | Protection policies. |
| `recovery-service-subnet` | Recovery Service subnets. |
| `long-term-backup` | LTR backup resources. |
| `recovery-service-work-request` | Work request visibility. |

Common policy examples:

```text
Allow group RecoveryServiceAdmin to manage recovery-service-family in tenancy
Allow group RecoveryServicePolicyAdmins to manage recovery-service-policy in compartment <compartment-name>
Allow group RecoveryServiceNetworkAdmins to manage recovery-service-subnet in compartment <compartment-name>
```

---

## Skill 11: Track Events and Audit Activity

Use this skill when creating event rules or investigating who changed Recovery Service resources.

Recovery Service emits events for:

- Protected databases
- Recovery Service subnets
- Protection policies

Event type prefix:

```text
com.oraclecloud.autonomousrecoveryservice
```

Common event families:

- Protected database create, update, delete, change compartment, change billing compartment, and fetch configuration
- Recovery Service subnet create, update, delete, and change compartment
- Protection policy create, update, delete, and change compartment

Most event families include `.begin` and `.end` variants.

Use OCI Audit to review API calls made against Recovery Service resources.

---

## Skill 12: Troubleshoot Backup Failures

Use this skill when a protected database backup fails, health changes to Warning or Alert, or data loss exposure grows.

### Connection Timeout

Run a connectivity check from the database client:

```bash
tnsping dbrs
```

If `TNS-12535: TNS:operation timed out` or a similar timeout appears, check:

- Port `8005` ingress to the Recovery Service subnet or NSG
- Port `2484` ingress to the Recovery Service subnet or NSG
- Database subnet or NSG egress on ports `8005` and `2484`
- Whether subnet-to-subnet traffic is restricted
- Whether custom DNS resolves Recovery Service hostnames correctly

For DNS checks, compare hostnames from `dbrsnames.ora` or `tnsping` output with IP addresses in the protected database `hosts.txt` file.

Download the protected database network files from:

```text
Protected database details > Actions > Download configuration
```

The default zip file is `dbrsconfig.zip` and includes:

- `dbrsnames.ora`
- `certChainPem`
- `cabundle.txt`
- `hosts.txt`

Protect these files from unauthorized access.

### Subnet Has No Available IP Addresses

If a work request reports subnet failure or insufficient addresses:

- Check available private IP addresses in the Recovery Service subnet.
- Add another subnet to the Recovery Service subnet resource.
- Use a different Recovery Service subnet if needed.
- Re-run the failed workflow after capacity is corrected.

### Protected Database Creation Fails

Use `CreateProtectedDatabase` dry run when possible. Review work request errors and logs for:

- Missing IAM policy
- Missing Recovery Service subnet
- Inactive or invalid protection policy
- Service limits
- Compartment quotas
- Duplicate protected database identity
- Network reachability issues

### Support Escalation

Before opening a My Oracle Support service request:

- Collect work request errors and logs.
- Capture OCI Console error messages.
- Identify whether the issue affects onboarding, backups, or restore.
- Include database service type, compartment, protected database OCID, policy OCID, subnet OCID, and relevant timestamps.

State clearly that the issue is related to Autonomous Recovery Service.

---

## Operational Checklist

Use this checklist for a new OCI or Oracle Multicloud database protection setup.

1. Confirm database release and `COMPATIBLE >= 19.0.0`.
2. Confirm no conflicting manual operational backup destination remains active.
3. Review Recovery Service limits and quotas.
4. Confirm IAM policies for Recovery Service administration.
5. Confirm multicloud subscription policies if applicable.
6. Confirm the Recovery Service subnet is IPv4-only and sized appropriately.
7. Confirm stateful ingress on ports `8005` and `2484`.
8. Confirm egress on ports `8005` and `2484` when network rules restrict traffic.
9. Select an Oracle-defined or custom protection policy.
10. Decide whether retention lock is required.
11. Decide whether multicloud backups should stay in Oracle Cloud or the source cloud provider.
12. Enable automatic backups with Autonomous Recovery Service as the backup destination.
13. Decide whether to enable real-time data protection.
14. Validate the protected database resource is created.
15. Validate Health, Data loss exposure, Protection policy, Current recovery window, and Backup location.
16. Review Network details and Work requests.
17. Configure Monitoring alarms for health and data loss exposure.
18. Document restore options and LTR backup requirements.

---

## Quick Reference

| Item | Value |
|---|---|
| Backup traffic port | `8005` |
| SQL*Net/RMAN catalog port | `2484` |
| Recommended Recovery Service subnet size | `/24` |
| Minimum practical subnet size | `/27` |
| Custom protection policy retention | `14` to `95` days |
| Bronze policy | `14` days |
| Silver policy | `35` days |
| Gold policy | `65` days |
| Platinum policy | `95` days |
| Retention lock minimum delay | `14` days |
| LTR backup retention | `90` to `3650` days |
| Health metric namespace | `oci_recovery_service` |
| Protected health metric values | `0` Protected, `1` Warning, `2` Alert |
| Real-time data protection threshold | Data loss exposure under `10` seconds |
| Non-real-time healthy threshold | Data loss exposure under `120` minutes |

---

## Sources

- [Using Oracle Database Autonomous Recovery Service](https://docs.oracle.com/en/cloud/paas/recovery-service/dbrsu/using-oracle-database-autonomous-recovery-service.pdf)
- [Database Autonomous Recovery Service](https://docs.oracle.com/en-us/iaas/recovery-service/index.html)
- [Recovery Service Terminology](https://docs.oracle.com/en-us/iaas/recovery-service/doc/recovery-service-concepts.html)
- [Onboarding Oracle Database to Recovery Service](https://docs.oracle.com/en-us/iaas/recovery-service/doc/getting-started-recovery-service.html)
- [Backing Up Oracle Cloud Databases to Recovery Service](https://docs.oracle.com/en-us/iaas/recovery-service/doc/automatic-backup-recovery-service.html)
- [About Configuring Protection Policies](https://docs.oracle.com/iaas/recovery-service/doc/overview-protection-policy.html)
- [Backup Retention](https://docs.oracle.com/en-us/iaas/recovery-service/doc/backup-retention.html)
- [Managing Protected Databases](https://docs.oracle.com/en-us/iaas/recovery-service/doc/recovery-system.html)
- [Using the API to Manage Recovery Service Resources](https://docs.oracle.com/en-us/iaas/recovery-service/doc/using-api-recovery-service.html)
- [Recovery Service Metrics](https://docs.oracle.com/iaas/recovery-service/doc/recovery-service-metrics.html)
- [About Recovery Service Resource Types](https://docs.oracle.com/en-us/iaas/recovery-service/doc/supported-recovery-service-policies.html)
