# Backup, Recovery, RMAN, And ZDLRA

Use this file for MAA backup/recovery strategy, RMAN, restore validation, corruption protection, recovery objectives, and Zero Data Loss Recovery Appliance positioning.

## Core Guidance

- Backups remain mandatory even with RAC, Data Guard, or Active Data Guard.
- Design recovery around both RTO and recovery point requirements, including logical corruption and user error.
- Validate restore and recovery, not just backup job success.
- Keep backup retention, immutability, encryption, offsite copies, and compliance requirements explicit.
- Use standby databases to offload backups where it fits the architecture and licensing.
- Use ZDLRA when the requirement is centralized, database-aware protection, incremental-forever strategy, recovery validation, and stronger recovery automation for Oracle databases.

## Data Guard Versus Backup

| Capability | Data Guard | Backup/RMAN/ZDLRA |
|---|---|---|
| Fast database failover | Yes | No |
| Protection from site failure | Yes, with remote standby | Yes, depending on copy location and restore time |
| Point-in-time recovery | Limited by standby/flashback strategy | Core capability |
| Logical error recovery | Not sufficient by itself | Core capability |
| Long retention | Not the primary purpose | Core capability |
| Corruption detection/repair workflow | Helps in database-aware ways | Required for full recovery strategy |

## Recovery Readiness Checklist

- Define the recovery scenarios: media failure, site loss, operator error, corruption, ransomware, failed patch, failed deployment.
- Confirm where backups live and whether they survive the failure domain.
- Test restore to alternate location.
- Test point-in-time recovery.
- Track backup encryption keys and wallet/secret availability.
- Monitor backup age, recoverability, failed jobs, restore performance, and recovery catalog health where used.

## Common Mistakes

- Reporting “backup succeeded” without proving restore works.
- Keeping backups in the same failure domain as the database.
- Assuming Data Guard protects against all logical mistakes.
- Ignoring recovery time for very large databases.
- Not testing wallet/key availability during restore.

## Sources

- Backup and Recovery IAD: https://docs.oracle.com/en/database/oracle/oracle-database/26/bkupr/index.html
- Backup and Recovery User's Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/bradv/index.html
- Backup and Recovery Reference: https://docs.oracle.com/en/database/oracle/oracle-database/26/rcmrf/index.html
- ZDLRA Protected Database Configuration Guide: https://docs.oracle.com/en/engineered-systems/zero-data-loss-recovery-appliance/23.1/ampdb/index.html
- ZDLRA Administrator's Guide: https://docs.oracle.com/en/engineered-systems/zero-data-loss-recovery-appliance/23.1/amagd/index.html
