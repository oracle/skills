# Oracle Database on OCI: Cloud Services Reference

## Overview

Oracle Cloud Infrastructure (OCI) offers a spectrum of database services ranging from fully self-managed virtual machine databases to fully autonomous, self-driving databases. Understanding which service tier fits a workload requires knowing the trade-offs in control, automation, cost, and performance for each option.

The three primary Oracle Database service families on OCI are:

| Service Family | Management Level | Best For |
|---|---|---|
| Autonomous Database (ATP/ADW) | Fully managed + self-tuning | New apps, analytics, dev/test, cost-sensitive |
| Base Database Service (DBCS) | Infrastructure managed; DB managed by you | Lift-and-shift, existing apps, full DBA control |
| Exadata Cloud Service (ExaCS) | Infrastructure managed; DB managed by you | Mission-critical OLTP, large-scale consolidation |

---

## 1. Autonomous Transaction Processing (ATP)

ATP is Oracle's fully managed OLTP database service. Oracle manages the infrastructure, patching, backup, tuning, and availability. Customers manage schemas, SQL, and application connectivity.

### Key Characteristics

- **Workload type:** Mixed OLTP + operational reporting
- **Storage format:** Row store by default, with In-Memory Column Store enabled automatically for eligible objects
- **Compute model:** OCPU-based (1 OCPU = 2 vCPUs); billed per OCPU-hour
- **Connection security:** mTLS enforced by default; wallet-based connections
- **Oracle version:** Latest Oracle 19c (or higher) with automated quarterly patching
- **Concurrency model:** 3 pre-configured services — `_tp` (low latency), `_tpurgent` (highest priority), `_low` (background)

### Connecting to ATP

```sql
-- ATP requires Oracle Wallet for authentication (mTLS)
-- Download the wallet (Instance Wallet or Regional Wallet) from OCI Console
-- or using OCI CLI:
-- oci db autonomous-database generate-wallet --autonomous-database-id <ocid> --file wallet.zip --password WalletPass#1

-- sqlplus connection using TNS_ADMIN pointing to wallet directory
-- export TNS_ADMIN=/home/oracle/wallet
-- sqlplus admin/YourPass#1@myatp_tp

-- JDBC connection string for applications
-- jdbc:oracle:thin:@myatp_tp?TNS_ADMIN=/wallet_dir

-- Check service names available in ATP
SELECT name, network_name, goal
FROM   v$active_services
WHERE  name NOT IN ('SYS$BACKGROUND', 'SYS$USERS')
ORDER  BY name;
```

### ATP-Specific Features

```sql
-- Autonomous Database automatically creates performance indexes
-- View auto-created indexes
SELECT index_name, table_name, visibility, status, auto
FROM   user_indexes
WHERE  auto = 'YES'
ORDER  BY table_name;

-- Auto-partitioning: ATP can automatically partition tables to improve performance
-- Check auto-partitioning candidates and status
SELECT table_name, partition_count, strategy, status, last_analyzed
FROM   dba_auto_partition_config
ORDER  BY table_name;

-- View auto-partitioning history
SELECT report_date, table_owner, table_name, partition_count, status
FROM   dba_auto_partition_history
ORDER  BY report_date DESC;

-- Machine Learning features in ATP
-- Oracle ML is pre-installed
SELECT *
FROM   user_mining_models;
```

---

## 2. Autonomous Data Warehouse (ADW)

ADW is Oracle's fully managed analytical database service. It is architected for parallel query execution, columnar storage, and BI/reporting workloads.

### Key Differences from ATP

| Feature | ATP | ADW |
|---|---|---|
| Primary workload | OLTP, mixed | Analytics, DW, reporting |
| Default parallelism | Low (OLTP-appropriate) | High (auto parallel query) |
| Default In-Memory | Selective | Aggressive (for eligible objects) |
| Auto-indexing | Enabled | Disabled (analytics prefers FTS) |
| Default compression | Advanced Row Compression | HCC Query High |
| Default service | `_tp` | `_high`, `_medium`, `_low` |

### ADW Connection Services

ADW provides three pre-defined services with different resource profiles:

| Service | Parallelism | Priority | Use Case |
|---|---|---|---|
| `_high` | Max DOP | Highest | Single critical query |
| `_medium` | Moderate DOP | Medium | Standard BI/reporting |
| `_low` | Minimal | Lowest | ETL, data loads, background |

```sql
-- Connect using the appropriate service for workload type
-- For BI tool connections: @myinstance_medium
-- For ETL loads: @myinstance_low
-- For ad-hoc critical queries: @myinstance_high

-- Check current resource group assignments
SELECT username, resource_consumer_group
FROM   v$session
WHERE  type = 'USER'
ORDER  BY username;

-- ADW automatically applies HCC compression to new tables
-- Check compression on ADW tables
SELECT table_name, compression, compress_for
FROM   user_tables
ORDER  BY table_name;
```

---

## 3. Auto-Scaling and Auto-Backup

### Auto-Scaling (Compute)

Autonomous Databases support automatic scaling of compute resources without downtime when the database is under CPU pressure.

```sql
-- Scaling is managed via OCI Console, CLI, or REST API
-- OCI CLI to enable auto-scaling:
-- oci db autonomous-database update \
--     --autonomous-database-id <ocid> \
--     --is-auto-scaling-enabled true

-- Monitor CPU usage to understand scaling behavior
SELECT end_interval_time,
       ROUND(AVG(value), 2) AS avg_cpu_pct
FROM   dba_hist_sysmetric_summary
WHERE  metric_name = 'CPU Usage Per Sec'
  AND  end_interval_time >= SYSTIMESTAMP - INTERVAL '24' HOUR
GROUP  BY end_interval_time
ORDER  BY end_interval_time DESC
FETCH  FIRST 48 ROWS ONLY;

-- Autonomous Database scales between baseCPU and 3x baseCPU automatically
-- Current OCPU allocation visible in:
SELECT name, value
FROM   v$parameter
WHERE  name IN ('cpu_count', 'parallel_threads_per_cpu')
ORDER  BY name;
```

### Auto-Backup

Autonomous Databases perform automatic daily backups to OCI Object Storage with a 60-day retention period by default.

```sql
-- OCI CLI: list available backups for an Autonomous Database
-- oci db autonomous-database-backup list \
--     --autonomous-database-id <ocid>

-- OCI CLI: restore to a specific point in time
-- oci db autonomous-database restore \
--     --autonomous-database-id <ocid> \
--     --timestamp "2026-03-01T12:00:00.000Z"

-- View backup history from within the database
SELECT input_type, status, start_time, end_time,
       input_bytes / 1024 / 1024 / 1024 AS input_gb,
       output_bytes / 1024 / 1024 / 1024 AS output_gb
FROM   v$rman_backup_job_details
ORDER  BY start_time DESC
FETCH  FIRST 10 ROWS ONLY;
```

---

## 4. Base Database Service (DBCS)

Base Database Service provisions Oracle Database on OCI compute shapes (Virtual Machine or Bare Metal). Oracle manages the underlying infrastructure (OS patching, storage provisioning), while the DBA retains full control over the database.

### VM DB System vs. Bare Metal DB System

| Aspect | VM DB System | BM DB System |
|---|---|---|
| Compute | Shared or dedicated VM | Full bare metal node |
| Storage | Iscsi block volumes | NVMe local SSD + block |
| RAC support | Up to 2 nodes (RAC Two-Node) | Up to 2 nodes |
| Starting size | 1 OCPU | 24+ OCPUs |
| Use case | Dev, test, smaller prod | Large OLTP, high I/O |

### Provisioning Considerations

```sql
-- After provisioning via OCI Console or CLI, verify DB configuration
SELECT name, db_unique_name, log_mode, open_mode,
       flashback_on, force_logging, platform_name
FROM   v$database;

-- Check storage usage on DBCS (block volumes appear as ASM disk groups)
SELECT group_number, name, type, state, total_mb, free_mb,
       ROUND((total_mb - free_mb) / total_mb * 100, 1) AS pct_used
FROM   v$asm_diskgroup
ORDER  BY name;

-- DBCS includes Data Guard by default for Enterprise Edition High Performance
-- Check Data Guard configuration
SELECT db_unique_name, role, open_mode, protection_mode, protection_level
FROM   v$database;
```

### DBCS-Specific Operations

```sql
-- Enable or verify archivelog mode (required for backups and Data Guard)
ARCHIVE LOG LIST;

-- RMAN backup on DBCS (Oracle manages backup to OCI Object Storage or local)
-- The OCI backup plugin (bkup_api) is pre-installed on DBCS
-- Manual RMAN backup to OCI Object Storage:
-- RMAN> CONFIGURE CHANNEL DEVICE TYPE SBT
--   PARMS='SBT_LIBRARY=/opt/oracle/dcs/commonstore/pkgrepos/oss/odbcs/libopc.so
--          ENV=(OPC_PFILE=/opt/oracle/dcs/commonstore/objectstore/config/opctest.ora)';
-- RMAN> BACKUP DATABASE PLUS ARCHIVELOG;

-- DBCS patching uses DBA console (OCI console) or dbaascli utility
-- dbaascli dbpatch apply --db MYDB --patch_id <patch_id>
```

---

## 5. Exadata Cloud Service (ExaCS)

ExaCS brings the full Exadata hardware platform (including Smart Scan, Storage Indexes, and HCC) to OCI. Oracle manages the Exadata hardware and grid infrastructure; the customer manages the database.

### ExaCS Infrastructure Options

| Option | Description |
|---|---|
| Quarter Rack | 2 DB servers, 3 storage cells |
| Half Rack | 4 DB servers, 6 storage cells |
| Full Rack | 8 DB servers, 12 storage cells |
| Elastic Configurations (X9M+) | Choose DB server and storage cell count independently |

### ExaCS vs. ExaDB-C@C (Exadata Cloud at Customer)

- **ExaCS**: Exadata hardware resides in OCI data centers. Customer manages the DB; Oracle manages Exadata infrastructure.
- **ExaDB-C@C**: Exadata hardware installed at the customer's on-premises data center; Oracle manages infrastructure remotely; customer manages the DB.

```sql
-- Verify Exadata features are active
SELECT name, value
FROM   v$parameter
WHERE  name IN ('cell_offload_processing',
                'cell_offload_compaction',
                'cell_offload_plan_display',
                'enable_goldengate_replication')
ORDER  BY name;

-- Confirm Smart Scan is being used
SELECT name, value
FROM   v$sysstat
WHERE  name IN (
    'cell physical IO interconnect bytes',
    'cell physical IO interconnect bytes returned by smart scan',
    'cell scans'
)
ORDER  BY name;
```

---

## 6. OCI Connection Methods

### Standard Connections (Non-Autonomous)

```sql
-- Standard JDBC connection to DBCS
-- jdbc:oracle:thin:@//host:1521/service_name

-- TNS-based connection
-- HOST_PORT_SN =
--   (DESCRIPTION =
--     (ADDRESS = (PROTOCOL = TCP)(HOST = mydbcs-host.subnet.vcn.oraclevcn.com)(PORT = 1521))
--     (CONNECT_DATA = (SERVER = DEDICATED)(SERVICE_NAME = mydb.subnet.vcn.oraclevcn.com))
--   )

-- Check listening services on DBCS
SELECT name, network_name
FROM   v$active_services
WHERE  name NOT IN ('SYS$BACKGROUND', 'SYS$USERS')
ORDER  BY name;
```

### Wallet-Based Connections (Autonomous Database)

```sql
-- Three wallet types for Autonomous Databases:
-- 1. Instance Wallet: specific to one DB instance
-- 2. Regional Wallet: works with any Autonomous DB in the region
-- 3. mTLS (mutual TLS): two-way certificate authentication

-- TLS-only connection (wallet not required, 21c and later ADB)
-- Disable wallet requirement for TLS-only connections:
-- oci db autonomous-database update \
--     --autonomous-database-id <ocid> \
--     --is-mtls-connection-required false

-- JDBC Easy Connect Plus syntax (no wallet, TLS only)
-- jdbc:oracle:thin:@myatp.adb.us-ashburn-1.oraclecloud.com:1522/dbname_tp.adb.oraclecloud.com

-- Verify TLS settings
SELECT name, value
FROM   v$parameter
WHERE  name IN ('ssl_version', 'sqlnet.encryption_server', 'sqlnet.authentication_services');
```

### Private Endpoint Connections

OCI supports connecting to Autonomous Databases from within a VCN using Private Endpoints, eliminating internet exposure:

```sql
-- Private endpoint forces all connections through the VCN
-- Configured at provisioning time or added post-provisioning via OCI Console

-- After enabling private endpoint, check endpoint details:
-- oci db autonomous-database get --autonomous-database-id <ocid> \
--     --query 'data.{"private-endpoint": "private-endpoint", "private-ip": "private-ip"}'

-- Connection string for private endpoint uses private IP or private DNS name
-- jdbc:oracle:thin:@10.0.1.25:1521/myatp_tp
```

---

## 7. Oracle Cloud Free Tier

Oracle Cloud Free Tier provides two Autonomous Databases (1 OCPU, 20 GB storage each) permanently free with no time limit, plus $300 in credits for other services for 30 days.

### Free Tier Limitations

| Resource | Always Free Limit |
|---|---|
| Autonomous DB instances | 2 (one ATP, one ADW) |
| OCPUs per instance | 1 (no auto-scaling) |
| Storage per instance | 20 GB |
| APEX workspaces | Included |
| Oracle ML notebooks | Included |
| Data loading | REST, APEX, DB Actions |
| Backup | 60 days included |

```sql
-- Connecting to Free Tier Autonomous Database
-- Service names follow the same pattern as paid ADB
-- Available services: _tp, _tpurgent, _low, _high, _medium

-- Verify Free Tier resource constraints
SELECT name, value
FROM   v$parameter
WHERE  name IN ('cpu_count', 'sga_max_size', 'pga_aggregate_target')
ORDER  BY name;

-- Free Tier comes with Oracle APEX pre-installed
SELECT version, status
FROM   apex_release;

-- ORDS (Oracle REST Data Services) is pre-enabled in Free Tier
-- Check ORDS configuration
SELECT *
FROM   user_ords_schemas;
```

---

## 8. Cloud-Specific Features Summary

### Autonomous Database Operational Commands (OCI CLI)

```bash
# Start / Stop Autonomous Database
oci db autonomous-database start  --autonomous-database-id <ocid>
oci db autonomous-database stop   --autonomous-database-id <ocid>

# Scale OCPUs (no downtime)
oci db autonomous-database update \
    --autonomous-database-id <ocid> \
    --cpu-core-count 8

# Scale storage (no downtime, can only increase)
oci db autonomous-database update \
    --autonomous-database-id <ocid> \
    --data-storage-size-in-tbs 2

# Clone an Autonomous Database
oci db autonomous-database create-from-clone \
    --clone-type FULL \
    --source-id <source_ocid> \
    --display-name MyATP_Clone \
    --db-name MYATPCLONE \
    --admin-password "ClonePass#1" \
    --compartment-id <compartment_ocid>
```

### Database Actions (SQL Developer Web)

All Autonomous Database instances include Database Actions (formerly SQL Developer Web), a browser-based SQL and administration IDE accessible at:

```
https://<adb_host>/ords/sql-developer
```

Key Database Actions modules:
- SQL Worksheet — interactive SQL execution
- Data Load — upload CSV/JSON/Parquet directly to tables
- Data Studio — business intelligence, data insights
- Oracle ML — Jupyter-compatible ML notebooks
- Oracle APEX — full application development platform

---

## 9. Best Practices

- **Use Private Endpoints for all production Autonomous Databases.** Public endpoints expose the database to the internet. Private endpoints restrict access to your VCN and eliminate the need for IP allowlisting.
- **Use the `_medium` service for BI tool connections to ADW.** The `_high` service uses maximum parallelism, which works well for single queries but can cause contention when many BI users are active simultaneously.
- **Enable auto-scaling during initial deployment and disable it only after load testing.** It is far better to discover that auto-scaling is needed during testing than after a production load spike causes connection timeouts.
- **Store wallet files securely.** Autonomous Database wallets contain private keys. Never commit wallet files to source control. Use OCI Vault for secret management in CI/CD pipelines.
- **Right-size DBCS before migrating to Autonomous.** Test the application on ATP using the same data volume and workload profile. Autonomous's automatic optimizations can change query plans; validate execution plans after migration.
- **Use Data Safe for Autonomous Database security posture management.** Data Safe (included with ADB) provides security assessments, user assessments, data masking, and activity auditing with no additional configuration.

---

## 10. Common Mistakes and How to Avoid Them

### Mistake 1: Connecting to ATP with `_high` Service for OLTP Applications

The `_high` service in ATP uses maximum DOP, which causes parallel query overhead and resource contention for short OLTP transactions. Use `_tp` (low-latency, no parallelism) for OLTP and `_tpurgent` for priority transactions.

### Mistake 2: Not Rotating Wallets After Security Events

Wallets do not expire automatically. After a security incident or staff change, download and deploy a new wallet. The old wallet remains valid until explicitly invalidated by rotating the database password.

```bash
# Rotate the ADMIN password (invalidates the old wallet on next download)
oci db autonomous-database update \
    --autonomous-database-id <ocid> \
    --admin-password "NewSecurePass#2"
# Then re-download the wallet
oci db autonomous-database generate-wallet \
    --autonomous-database-id <ocid> \
    --file new_wallet.zip \
    --password "WalletPass#2"
```

### Mistake 3: Assuming DBCS Patches Are Automatic

Unlike Autonomous Databases, DBCS patches are **not** applied automatically. The DBA must apply quarterly DB patches manually through the OCI Console (one-click patching) or via `dbaascli`. Unpatched DBCS instances accumulate CVEs over time.

### Mistake 4: Using Autonomous Database for Workloads Requiring Custom Initialization Parameters

ATP and ADW do not allow modification of most `init.ora` parameters. Workloads that require specific `optimizer_features_enable`, custom `event` settings, or non-standard memory parameters are not suitable for Autonomous Database. Use DBCS or ExaCS for those workloads.

### Mistake 5: Ignoring Egress Costs When Loading Data

Downloading large datasets from Autonomous Database to on-premises incurs OCI egress charges. Use OCI Object Storage as an intermediate stage (egress between ADB and OCI Object Storage in the same region is free) and then transfer from Object Storage to on-premises.

---

## Sources

- [Oracle Autonomous Database Documentation](https://docs.oracle.com/en/cloud/paas/autonomous-database/) — ATP, ADW, auto-scaling, auto-backup, wallet connections
- [Oracle Base Database Service Documentation](https://docs.oracle.com/en/cloud/paas/base-database/) — DBCS provisioning, VM vs. BM, patching
- [Oracle Exadata Cloud Service Documentation](https://docs.oracle.com/en/engineered-systems/exadata-cloud-service/) — ExaCS infrastructure options
- [OCI CLI Reference](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/) — autonomous-database commands
