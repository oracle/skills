# Oracle Data Guard

## Overview

Oracle Data Guard is Oracle's high-availability, disaster recovery, and data protection solution. It maintains one or more synchronized copies of a production database (the **primary**) called **standby databases**. If the primary database becomes unavailable, a standby can be activated to take over, minimizing downtime and data loss.

Data Guard is licensed with Oracle Database Enterprise Edition. It is Oracle's recommended disaster recovery solution for mission-critical databases and is a core component of Maximum Availability Architecture (MAA).

---

## Physical vs Logical Standby

### Physical Standby

A physical standby is a block-for-block identical copy of the primary database. Redo data generated on the primary is shipped to the standby and applied using **Media Recovery** (Redo Apply). The standby is always in a state of recovery.

**Characteristics:**
- Byte-for-byte identical to primary at the block level
- Uses Redo Apply (MRP — Managed Recovery Process)
- Can be opened read-only while applying redo (Active Data Guard — requires separate license)
- Supports all data types and object types without restriction
- Fastest to configure and easiest to maintain
- Used for most DR and HA deployments

**When to use:** DR/HA for any workload, read offload with Active Data Guard, rolling upgrades.

### Logical Standby

A logical standby receives redo from the primary, mines it into SQL statements, and applies those statements using **SQL Apply** (LogMiner-based). The standby database is open read-write and can have additional objects not on the primary.

**Characteristics:**
- Open for read-write during apply
- Additional reporting tables, indexes, or schemas can exist on the standby
- Does not support all data types (e.g., BFILE, NCLOB on some versions have restrictions)
- More complex to manage; SQL Apply can lag behind Redo Apply under heavy load
- Supports transformations of data during apply

**When to use:** Reporting databases needing read-write access, custom schema modifications on standby, selective replication.

### Snapshot Standby

A snapshot standby is a physical standby that has been temporarily converted to a read-write state for testing. Redo from the primary continues to be received but not applied. When converted back, the divergent changes are discarded and recovery resumes.

```sql
-- Convert physical standby to snapshot standby (via DGMGRL)
DGMGRL> CONVERT DATABASE standby_db TO SNAPSHOT STANDBY;

-- Convert back to physical standby
DGMGRL> CONVERT DATABASE standby_db TO PHYSICAL STANDBY;
```

---

## Redo Transport and Apply

### Redo Transport

The primary database ships redo log data to standby destinations. Transport can be synchronous or asynchronous.

**SYNC (synchronous):** Primary waits for acknowledgment from standby before committing. Zero data loss, but adds latency to commits.

**ASYNC (asynchronous):** Primary commits without waiting for standby acknowledgment. Better performance, but potential for data loss equal to the transport lag.

```sql
-- Configure redo transport on primary (example LOG_ARCHIVE_DEST_2)
ALTER SYSTEM SET LOG_ARCHIVE_DEST_2 =
  'SERVICE=standby_tns ASYNC NOAFFIRM
   DB_UNIQUE_NAME=standby_db
   VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE)
   COMPRESSION=ENABLE'
  SCOPE=BOTH;

ALTER SYSTEM SET LOG_ARCHIVE_DEST_STATE_2 = ENABLE SCOPE=BOTH;
```

### Redo Apply (Physical Standby)

The Managed Recovery Process (MRP) applies archived redo logs or redo from the standby redo logs (real-time apply).

```sql
-- Start managed recovery (on physical standby)
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;

-- Start real-time apply (applies redo as it arrives, before archiving)
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE
  USING CURRENT LOGFILE DISCONNECT FROM SESSION;

-- Stop managed recovery
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;

-- Check apply status
SELECT process, status, sequence#, thread#
FROM v$managed_standby
ORDER BY process;
```

### SQL Apply (Logical Standby)

```sql
-- Start SQL Apply on logical standby
ALTER DATABASE START LOGICAL STANDBY APPLY IMMEDIATE;

-- Stop SQL Apply
ALTER DATABASE STOP LOGICAL STANDBY APPLY;

-- Check SQL Apply status
SELECT status, applied_scn, latest_scn
FROM dba_logstdby_progress;
```

### Standby Redo Logs

Standby Redo Logs (SRLs) are required for real-time apply and for synchronous redo transport. They receive redo from the primary's current online redo logs (in addition to archived logs).

```sql
-- Add standby redo log groups (on standby; should have primary group count + 1)
-- Each group should be same size as primary online redo logs
ALTER DATABASE ADD STANDBY LOGFILE GROUP 4
  ('/oradata/standby/stdby_redo04.log') SIZE 500M;

ALTER DATABASE ADD STANDBY LOGFILE GROUP 5
  ('/oradata/standby/stdby_redo05.log') SIZE 500M;

-- View standby redo logs
SELECT group#, members, bytes/1048576 size_mb, status
FROM v$standby_log;
```

---

## Data Guard Broker (DGMGRL)

Data Guard Broker is the management framework for Data Guard configurations. It automates and centralizes configuration, monitoring, and role transitions. Using Broker is strongly recommended over manual Data Guard management.

### Enabling the Broker

```sql
-- Enable on both primary and standby
ALTER SYSTEM SET dg_broker_start = TRUE SCOPE=BOTH;
```

### Creating a Broker Configuration

```bash
# Connect to DGMGRL (from primary or any host with network access)
dgmgrl sys/<password>@primary_db

DGMGRL> CREATE CONFIGURATION 'my_dg_config'
          AS PRIMARY DATABASE IS primary_db
          CONNECT IDENTIFIER IS primary_tns;

DGMGRL> ADD DATABASE standby_db
          AS CONNECT IDENTIFIER IS standby_tns
          MAINTAINED AS PHYSICAL;

DGMGRL> ENABLE CONFIGURATION;
```

### Common DGMGRL Commands

```bash
# Show full configuration and health
DGMGRL> SHOW CONFIGURATION;

# Show details for a specific database
DGMGRL> SHOW DATABASE VERBOSE standby_db;

# Show current lag
DGMGRL> SHOW DATABASE standby_db 'ApplyLag';
DGMGRL> SHOW DATABASE standby_db 'TransportLag';

# Edit a property
DGMGRL> EDIT DATABASE standby_db SET PROPERTY LogXptMode='ASYNC';
DGMGRL> EDIT DATABASE primary_db SET PROPERTY RedoRoutes='(LOCAL : standby_db ASYNC)';

# Validate the configuration
DGMGRL> VALIDATE DATABASE standby_db;
DGMGRL> VALIDATE DATABASE VERBOSE standby_db;
```

---

## Switchover vs Failover

### Switchover

A **switchover** is a planned, graceful role reversal. Both databases remain intact and no data is lost. Used for planned maintenance, patching, or testing.

**Sequence of events:**
1. Primary transitions to standby role (flushes redo, prevents new connections)
2. Standby transitions to primary role
3. Both databases are operational in their new roles

```bash
# Verify readiness before switchover
DGMGRL> VALIDATE DATABASE standby_db;

# Perform switchover (Broker handles both sides automatically)
DGMGRL> SWITCHOVER TO standby_db;

# Verify new configuration
DGMGRL> SHOW CONFIGURATION;
```

**Manual switchover (without Broker):**
```sql
-- On PRIMARY: initiate switchover
ALTER DATABASE COMMIT TO SWITCHOVER TO PHYSICAL STANDBY WITH SESSION SHUTDOWN;

-- On STANDBY: complete the switchover to become primary
ALTER DATABASE COMMIT TO SWITCHOVER TO PRIMARY WITH SESSION SHUTDOWN;
ALTER DATABASE OPEN;
```

### Failover

A **failover** is an emergency operation when the primary database is unavailable or has failed and cannot be recovered quickly. Data loss is possible unless using Maximum Protection or Maximum Availability mode with synchronous redo transport and all redo is received.

**Failover permanently activates the standby as the new primary.** The old primary cannot be used without reinstating it as a standby.

```bash
# Failover using Broker (recommended)
DGMGRL> FAILOVER TO standby_db;

# With data loss prevention attempt (waits for all redo)
DGMGRL> FAILOVER TO standby_db IMMEDIATE;
```

**Manual failover (without Broker):**
```sql
-- On STANDBY: recover any remaining archived logs, then activate
RECOVER MANAGED STANDBY DATABASE CANCEL;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE FINISH;
ALTER DATABASE ACTIVATE PHYSICAL STANDBY DATABASE;
ALTER DATABASE OPEN;
```

### Reinstating the Old Primary

After a failover, the old primary can be reinstated as a standby:

```bash
DGMGRL> REINSTATE DATABASE old_primary_db;
```

This uses Flashback Database on the old primary to roll it back to before the failover point, then re-synchronizes it with the new primary.

---

## Lag Monitoring

### Transport Lag and Apply Lag

- **Transport Lag:** How far behind the standby is in receiving redo from the primary
- **Apply Lag:** How far behind the standby is in applying received redo

```sql
-- View lag from the standby database
SELECT name, value, time_computed, datum_time
FROM v$dataguard_stats
WHERE name IN ('transport lag', 'apply lag', 'apply finish time');

-- View from primary (requires DBA_LOGSTDBY_LOG or V$ARCHIVE_DEST_STATUS)
SELECT dest_id, dest_name, status, archived_seq#, applied_seq#,
       gap_status
FROM v$archive_dest_status
WHERE target = 'STANDBY';

-- Check for archive gap
SELECT thread#, low_sequence#, high_sequence#
FROM v$archive_gap;
```

### Monitoring via DGMGRL

```bash
DGMGRL> SHOW DATABASE standby_db 'ApplyLag';
DGMGRL> SHOW DATABASE standby_db 'TransportLag';
DGMGRL> SHOW DATABASE standby_db 'RecvQEntries';
DGMGRL> SHOW DATABASE standby_db 'SendQEntries';
```

### Monitoring via Enterprise Manager

Enterprise Manager Data Guard management page shows lag graphs, configuration topology, and alert thresholds. For automated alerting, configure EM metric thresholds on `ApplyLag` and `TransportLag`.

---

## Active Data Guard (Read Offload)

Active Data Guard (ADG) allows a physical standby database to be open **read-only** while simultaneously applying redo from the primary. This requires an additional Active Data Guard license.

**Use cases:**
- Offload reporting queries from the primary
- Offload backups (back up from the standby, not the primary)
- Distribute read workloads globally using far sync instances

### Opening a Physical Standby Read-Only with ADG

```sql
-- On standby: open read-only while continuing to apply redo
ALTER DATABASE OPEN READ ONLY;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE
  USING CURRENT LOGFILE DISCONNECT FROM SESSION;

-- Confirm it is applying while open
SELECT open_mode, db_unique_name FROM v$database;
-- open_mode should be: READ ONLY WITH APPLY
```

### Far Sync Instance

A Far Sync instance is a lightweight Oracle instance (no datafiles) placed geographically close to the standby to receive synchronous redo from the primary and forward it asynchronously to the remote standby. This achieves synchronous transport over a short distance (low latency) while still protecting a geographically distant standby.

```bash
# Add a far sync instance to broker configuration
DGMGRL> ADD FAR_SYNC farsync_inst AS CONNECT IDENTIFIER IS farsync_tns;
DGMGRL> EDIT DATABASE primary_db SET PROPERTY RedoRoutes =
          '(LOCAL : farsync_inst SYNC)(farsync_inst : standby_db ASYNC)';
DGMGRL> ENABLE FAR_SYNC farsync_inst;
```

---

## Protection Modes

Data Guard protection modes define the trade-off between data protection (zero data loss) and primary database performance/availability.

### Maximum Protection

- Requires synchronous redo transport (SYNC AFFIRM) to at least one standby
- Primary shuts down if no synchronized standby is available
- Guarantees zero data loss
- Adds commit latency equal to the round-trip to the standby

```sql
ALTER DATABASE SET STANDBY DATABASE TO MAXIMIZE PROTECTION;
```

### Maximum Availability

- Requires SYNC transport; if standby is unavailable, automatically degrades to asynchronous (no primary shutdown)
- Zero data loss when standby is reachable
- Best balance of protection and availability — recommended for most production deployments

```sql
ALTER DATABASE SET STANDBY DATABASE TO MAXIMIZE AVAILABILITY;
```

### Maximum Performance (Default)

- Uses asynchronous transport (ASYNC)
- Primary never waits for standby acknowledgment
- Best performance; potential data loss equal to the transport lag
- Default mode; suitable when some data loss is acceptable

```sql
ALTER DATABASE SET STANDBY DATABASE TO MAXIMIZE PERFORMANCE;
```

---

## Best Practices

- **Use Data Guard Broker (DGMGRL)** for all configuration management. Manual log_archive_dest parameter management is error-prone and difficult to maintain.

- **Configure Standby Redo Logs** on both primary and standby. They are required for real-time apply and synchronous transport.

- **Use Maximum Availability** mode with SYNC transport for critical OLTP workloads where the network latency to the standby is acceptable (typically under 5ms RTT).

- **Monitor lag actively.** A standby with 4 hours of apply lag provides 4 hours of recovery time, not instant failover.

- **Test switchovers regularly** (quarterly at minimum). A failover procedure that has never been executed is a high-risk assumption.

- **Back up from the standby** to offload backup I/O from the primary. RMAN can back up from a physical standby.

- **Enable Flashback Database** on the primary to enable reinstatement after failover.
  ```sql
  ALTER DATABASE FLASHBACK ON;
  ```

- **Size the Standby Redo Logs correctly.** Each group should be the same size as the primary online redo logs, and there should be (number of primary groups + 1) standby redo log groups per thread.

---

## Common Mistakes and How to Avoid Them

**Not configuring Standby Redo Logs**
Without SRLs, real-time apply is not possible. Redo is only applied after archiving, increasing apply lag unnecessarily.

**Incorrect LOG_ARCHIVE_DEST parameter syntax**
The `VALID_FOR` attribute must match the database role and log type. Misconfiguration causes redo transport to silently stop.

```sql
-- Correct: ship online logs when acting as primary
ALTER SYSTEM SET LOG_ARCHIVE_DEST_2 =
  'SERVICE=standby ASYNC NOAFFIRM
   DB_UNIQUE_NAME=standby
   VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE)';
```

**Forgetting to set DB_UNIQUE_NAME**
All databases in a Data Guard configuration must have unique `DB_UNIQUE_NAME` values. They can share the same `DB_NAME`.

```sql
-- Check
SELECT db_unique_name, db_name FROM v$database;
```

**Failover without checking for gaps**
Before failing over manually, always check for archive gaps:
```sql
SELECT * FROM v$archive_gap;
```

**Not enabling Flashback on the primary**
Without Flashback, reinstating the old primary after failover requires a full rebuild from backup. Always enable Flashback on the primary before any failover.

**Treating the standby as a permanent reporting database without ADG license**
Opening a standby read-only and suspending apply is not Active Data Guard. You need the ADG license to keep apply running while the database is open.

---

## Sources

- [Oracle Data Guard Concepts and Administration 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/sbydb/)
- [Oracle Database 19c SQL Language Reference — ALTER DATABASE (Data Guard clauses)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ALTER-DATABASE.html)
- [Oracle Data Guard Broker 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/dgbkr/)
- [Oracle Database 19c Reference — V$DATAGUARD_STATS](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-DATAGUARD_STATS.html)
