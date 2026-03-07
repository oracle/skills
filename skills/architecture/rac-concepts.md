# Oracle Real Application Clusters (RAC) Architecture

## Overview

Oracle Real Application Clusters (RAC) is a shared-disk cluster database technology that allows multiple Oracle instances to mount and open the same database simultaneously. Each node runs its own Oracle instance (memory structures + background processes), but all nodes share the same set of datafiles stored on shared storage (ASM or a cluster file system). RAC provides high availability through instance survivability and horizontal scalability by distributing workload across nodes.

RAC is the cornerstone of Oracle's Maximum Availability Architecture (MAA) and is commonly combined with Data Guard for both HA within a site and DR across sites.

---

## 1. Core Architecture Components

### Shared Storage

All RAC nodes access the same datafiles, control files, redo log groups, and archived logs. Oracle Automatic Storage Management (ASM) is the recommended storage layer. ASM provides:

- Striping across disks for I/O throughput
- Mirroring for local redundancy
- ASM Cluster File System (ACFS) for non-database files

Each node runs its own ASM instance (`+ASM1`, `+ASM2`, etc.) as a distinct Oracle instance type.

### Oracle Clusterware (Grid Infrastructure)

Grid Infrastructure (GI) is the cluster software stack that underpins RAC. It must be installed before RAC databases. Key GI components:

| Component | Purpose |
|---|---|
| Oracle Cluster Registry (OCR) | Stores cluster topology, resource definitions, and configuration |
| Voting Disk | Used for node eviction decisions during split-brain scenarios |
| CSS (Cluster Synchronization Services) | Heartbeat and membership management |
| CRS (Cluster Ready Services) | Resource management — starts/stops/monitors DB, VIPs, SCAN |
| CTSS (Cluster Time Synchronization Service) | Keeps node clocks synchronized if NTP is not used |
| SCAN (Single Client Access Name) | Single hostname resolving to 1–3 IPs for client connection load balancing (Oracle recommends 3) |

### Instance Components Unique to RAC

Each RAC instance has background processes beyond those found in single-instance Oracle:

| Process | Description |
|---|---|
| LMS (Lock Manager Server) | Serves block transfer requests from other nodes; multiple LMS processes per instance |
| LMD (Lock Manager Daemon) | Manages enqueue requests; communicates with remote LMDs |
| LCK (Lock Process) | Handles instance locks (non-PCM) |
| LMON (Global Enqueue Service Monitor) | Monitors cluster reconfiguration events; handles global enqueue recovery and instance recovery |
| DIAG (Diagnosability Process) | Captures diagnostic data for global resource issues |
| RMSn (RAC Management Server) | Manages Oracle resources in the cluster |

---

## 2. Cache Fusion and the Interconnect

Cache Fusion is Oracle's protocol for moving data blocks between instances over the private interconnect rather than writing them to and re-reading from disk. It is the defining technology that makes shared-disk RAC practical.

### How Cache Fusion Works

1. Instance 1 reads block 42 from disk into its buffer cache.
2. Instance 2 needs block 42. Instead of a disk I/O, Oracle's Global Cache Service (GCS) identifies that Instance 1 holds block 42.
3. GCS instructs Instance 1 to ship block 42 directly to Instance 2 over the private interconnect.
4. Instance 2 receives the current version of the block without ever touching disk.

This block transfer is called a **CR (Consistent Read) transfer** when the receiver needs an older image for read consistency, or a **Current Block transfer** when the receiver needs the most recent committed version to modify it.

### The Private Interconnect

The interconnect is a dedicated, low-latency, high-bandwidth network used exclusively for Cache Fusion traffic and cluster heartbeats. Requirements:

- Must be a **private** network (never route interconnect traffic over public interfaces)
- Target latency: sub-1ms round-trip
- Bandwidth: 10 GbE minimum; 25 GbE or InfiniBand for high-throughput workloads
- Redundancy: bonded NICs (active/passive or active/active) are strongly recommended

```sql
-- Verify interconnect configuration from GV$ views
SELECT inst_id, name, ip_address, is_public
FROM   gv$cluster_interconnects
ORDER  BY inst_id, name;

-- Check interconnect statistics
SELECT inst_id,
       gc_cr_blocks_received,
       gc_current_blocks_received,
       gc_cr_blocks_served,
       gc_current_blocks_served
FROM   gv$sysstat
WHERE  name IN ('gc cr blocks received', 'gc current blocks received',
                'gc cr blocks served',  'gc current blocks served')
ORDER  BY inst_id;
```

---

## 3. Global Cache Service (GCS) and Global Enqueue Service (GES)

### Global Cache Service (GCS)

GCS manages the state of all data blocks across all instances. Each block has a master instance that tracks its state. The GCS maintains a distributed lock called a **PCM (Parallel Cache Management) lock** for every block.

Block states tracked by GCS:
- **LOCAL** — owned and potentially modified by the local instance only
- **SHARED** — multiple instances hold a consistent read copy
- **NULL** — the instance no longer needs the block in current mode

### Global Enqueue Service (GES)

GES manages non-cache-fusion resources that span instances, such as dictionary locks, DML locks, sequences, and DDL locks. GES ensures that when Instance 1 acquires a lock on a row, Instance 2 cannot acquire a conflicting lock on the same row.

### Monitoring GCS/GES Activity

```sql
-- Global cache efficiency: ratio of disk reads avoided by Cache Fusion
SELECT inst_id,
       ROUND(
           (gc_cr_blocks_received + gc_current_blocks_received) /
           NULLIF(physical_reads + gc_cr_blocks_received + gc_current_blocks_received, 0) * 100,
           2
       ) AS cache_fusion_pct
FROM (
    SELECT inst_id,
           SUM(CASE WHEN name = 'gc cr blocks received'      THEN value ELSE 0 END) AS gc_cr_blocks_received,
           SUM(CASE WHEN name = 'gc current blocks received' THEN value ELSE 0 END) AS gc_current_blocks_received,
           SUM(CASE WHEN name = 'physical reads'             THEN value ELSE 0 END) AS physical_reads
    FROM   gv$sysstat
    WHERE  name IN ('gc cr blocks received', 'gc current blocks received', 'physical reads')
    GROUP  BY inst_id
)
ORDER  BY inst_id;

-- Top segments causing cross-instance block transfers
SELECT segment_name, segment_type,
       gc_buffer_busy_waits, gc_cr_blocks_received, gc_current_blocks_received
FROM   gv$segment_statistics
WHERE  statistic_name IN ('gc buffer busy waits')
  AND  value > 0
ORDER  BY value DESC
FETCH  FIRST 20 ROWS ONLY;
```

---

## 4. RAC Services Configuration

RAC services are the primary mechanism for directing workload to specific nodes and enabling transparent failover. A service is a named entity that clients connect to rather than connecting directly to an instance.

### Service Types

| Service Type | Description |
|---|---|
| Preferred/Available | Service runs on preferred node(s); fails over to available node(s) on failure |
| Uniform | Service runs on all nodes simultaneously |
| Administrator-managed | You define preferred/available instances manually |
| Policy-managed (Server Pools) | Oracle GI manages instance counts dynamically based on server pool policies |

### Creating and Configuring Services

```sql
-- Using DBCA or SRVCTL (preferred for RAC services)
-- From the OS command line on a cluster node:
--
-- Create a service with preferred instances
-- srvctl add service -db MYDB -service OLTP_SVC \
--     -preferred MYDB1,MYDB2 -available MYDB3

-- Verify service configuration
-- srvctl config service -db MYDB -service OLTP_SVC

-- Start/stop a service
-- srvctl start  service -db MYDB -service OLTP_SVC
-- srvctl stop   service -db MYDB -service OLTP_SVC

-- From within SQL*Plus: create a service programmatically
BEGIN
    DBMS_SERVICE.CREATE_SERVICE(
        service_name  => 'OLTP_SVC',
        network_name  => 'OLTP_SVC',
        goal          => DBMS_SERVICE.GOAL_THROUGHPUT,
        clb_goal      => DBMS_SERVICE.CLB_GOAL_LONG
    );
END;
/

-- Check active services on each instance
SELECT inst_id, name, network_name, goal, clb_goal
FROM   gv$active_services
WHERE  name NOT IN ('SYS$BACKGROUND', 'SYS$USERS')
ORDER  BY name, inst_id;
```

### Service Attributes for Performance

```sql
-- Service-level thresholds trigger alerts when violated
BEGIN
    DBMS_SERVICE.MODIFY_SERVICE(
        service_name            => 'OLTP_SVC',
        goal                    => DBMS_SERVICE.GOAL_SERVICE_TIME,
        clb_goal                => DBMS_SERVICE.CLB_GOAL_SHORT,
        -- Alert when elapsed time per call exceeds 5 seconds
        aq_ha_notifications     => TRUE,
        -- Commit outcome tracking (for at-most-once execution)
        commit_outcome          => TRUE,
        retention_timeout       => 604800  -- 7 days in seconds
    );
END;
/
```

---

## 5. Node Affinity

Node affinity is the practice of binding specific workloads or schemas to specific nodes in the cluster. This is important for reducing Cache Fusion traffic: when the same data is always accessed by the same node, there are no cross-instance block transfers.

### Application-Level Affinity

The most reliable form of affinity is achieved by routing application connections through dedicated services bound to specific instances:

```
OLTP Application  -> OLTP_SVC  -> Node 1 & 2 (preferred)
Report Application -> RPT_SVC  -> Node 3 & 4 (preferred)
Batch Jobs         -> BATCH_SVC -> Node 4   (preferred)
```

With this topology, OLTP data blocks live primarily in Node 1/2 buffer caches and reporting data lives primarily in Node 3/4 caches, minimizing cross-instance transfers.

### Table Partitioning and Affinity

In policy-managed databases with multiple server pools, partitioned tables can be used so that different partitions are predominantly accessed by different node sets. This is called **partition affinity**.

```sql
-- Example: Range-partitioned sales table where regional apps connect
-- through region-specific services mapped to specific nodes
CREATE TABLE SALES (
    sale_id     NUMBER        NOT NULL,
    region_id   NUMBER(2)     NOT NULL,
    sale_date   DATE          NOT NULL,
    amount      NUMBER(12,2)  NOT NULL
)
PARTITION BY RANGE (region_id) (
    PARTITION sales_region_1  VALUES LESS THAN (6),   -- Nodes 1-2
    PARTITION sales_region_2  VALUES LESS THAN (11),  -- Nodes 3-4
    PARTITION sales_region_3  VALUES LESS THAN (16),  -- Nodes 5-6
    PARTITION sales_other     VALUES LESS THAN (MAXVALUE)
);
```

---

## 6. RAC-Specific Wait Events

RAC introduces a set of wait events that do not exist in single-instance Oracle. High wait times on these events indicate interconnect or cache contention issues.

### Critical Wait Events

| Wait Event | Cause | Threshold |
|---|---|---|
| `gc buffer busy acquire` | Local session waiting to acquire a block being shipped from remote | < 1ms avg |
| `gc buffer busy release` | Local session waiting while another local session holds a block being requested remotely | < 1ms avg |
| `gc cr block busy` | Requesting a CR copy of a block while the master is processing a transfer | < 2ms avg |
| `gc current block busy` | Requesting current block; remote instance has not yet shipped it | < 2ms avg |
| `gc cr block 2-way` | Normal 2-way CR block transfer (requester + master); acceptable baseline | < 1ms |
| `gc current block 2-way` | Normal 2-way current block transfer | < 1ms |
| `gc cr block 3-way` | 3-way transfer (requester + master + holder); higher latency | < 2ms |
| `gc current block 3-way` | 3-way current block transfer | < 2ms |
| `gcs log flush sync` | Waiting for remote instance to flush its redo log before block transfer | Check redo |
| `enq: TX - row lock contention` | Row-level lock held on another instance | Application issue |

```sql
-- Top RAC wait events by total wait time
SELECT inst_id,
       event,
       total_waits,
       time_waited_micro / 1e6          AS total_sec,
       ROUND(time_waited_micro / NULLIF(total_waits, 0) / 1000, 3) AS avg_wait_ms
FROM   gv$system_event
WHERE  event LIKE 'gc %'
   OR  event LIKE 'gcs %'
   OR  event LIKE 'ges %'
ORDER  BY time_waited_micro DESC
FETCH  FIRST 20 ROWS ONLY;

-- Session-level RAC waits (for diagnosing a specific connection)
SELECT sid, event, state, wait_class,
       seconds_in_wait, p1, p2, p3
FROM   gv$session
WHERE  wait_class != 'Idle'
  AND  (event LIKE 'gc %' OR event LIKE 'gcs %')
ORDER  BY seconds_in_wait DESC;
```

---

## 7. Transparent Application Failover (TAF) and Fast Connection Failover (FCF)

### Transparent Application Failover (TAF)

TAF is a client-side failover mechanism configured in the TNS descriptor or Oracle Connection Pool. When the instance a client is connected to fails, TAF automatically reconnects the client to a surviving instance and optionally replays the current SELECT statement from the point of failure.

```
# TNS entry with TAF (tnsnames.ora)
MYDB_TAF =
  (DESCRIPTION =
    (FAILOVER = ON)
    (LOAD_BALANCE = OFF)
    (ADDRESS = (PROTOCOL = TCP)(HOST = node1-vip)(PORT = 1521))
    (ADDRESS = (PROTOCOL = TCP)(HOST = node2-vip)(PORT = 1521))
    (CONNECT_DATA =
      (SERVICE_NAME = OLTP_SVC)
      (FAILOVER_MODE =
        (TYPE = SELECT)    -- or SESSION for non-query failover
        (METHOD = BASIC)   -- or PRECONNECT for pre-established shadow connection
        (RETRIES = 30)
        (DELAY = 5)
      )
    )
  )
```

TAF limitations:
- In-progress DML is **not** replayed; the application receives an error for uncommitted transactions
- `TYPE=SELECT` re-executes the query from the beginning (rows already fetched are skipped)
- TAF does not protect against network partitions mid-transaction

### Fast Connection Failover (FCF)

FCF uses Oracle Notification Service (ONS) and is configured in JDBC Thin drivers or Universal Connection Pool (UCP). FCF is superior to TAF for Java applications:

- The connection pool receives an ONS event (via the GI event notification system) immediately when a service goes down
- Stale connections are proactively removed from the pool before applications try to use them
- Works with Application Continuity (AC) for transparent replay of in-flight transactions

```java
// UCP configuration for FCF (conceptual — not SQL)
// dataSource.setFastConnectionFailoverEnabled(true);
// dataSource.setONSConfiguration("nodes=node1:6200,node2:6200");
```

### Application Continuity (AC) and Transparent Application Continuity (TAC)

Application Continuity (introduced in Oracle Database 12c Release 1) extends TAF concepts to transparently replay in-flight transactions, including DML, after a recoverable error. TAC (introduced in 18c, expanded in 19c) does this without any application configuration by using `failover_type => 'AUTO'` on the service (rather than `'TRANSACTION'` for standard AC).

```sql
-- Check if Application Continuity is enabled for a service
SELECT name, failover_type, failover_method, goal, commit_outcome, retention_timeout
FROM   dba_services
WHERE  name = 'OLTP_SVC';

-- Enable Application Continuity on a service (failover_type => 'TRANSACTION' = AC)
-- For Transparent Application Continuity (TAC, 18c+), use failover_type => 'AUTO'
BEGIN
    DBMS_SERVICE.MODIFY_SERVICE(
        service_name    => 'OLTP_SVC',
        failover_type   => 'TRANSACTION',  -- enables AC; use 'AUTO' for TAC (18c+)
        commit_outcome  => TRUE,
        retention_timeout => 86400
    );
END;
/
```

---

## 8. Cluster Verification Utility (CVU)

CVU (`cluvfy`) is Oracle's pre-installation and post-installation diagnostic tool for cluster environments. It checks network configuration, OS parameters, shared storage, and cluster software health.

```bash
# Pre-installation checks (run before installing Grid Infrastructure)
# cluvfy stage -pre crsinst -n node1,node2 -verbose

# Post-installation check
# cluvfy stage -post crsinst -n node1,node2

# Verify the cluster at any time
# cluvfy comp sys     -n node1,node2        -- OS parameters
# cluvfy comp nodecon -n node1,node2        -- node connectivity
# cluvfy comp ocr     -n node1,node2        -- OCR integrity
# cluvfy comp ssa     -n node1,node2 -s disk_group_name  -- shared storage

-- Verify RAC database health from SQL*Plus
-- Check all instances are open
SELECT inst_id, instance_name, host_name, status, database_status
FROM   gv$instance
ORDER  BY inst_id;

-- Check cluster_interconnects
SELECT inst_id, name, ip_address, is_public, source
FROM   gv$cluster_interconnects;

-- Verify all datafiles are accessible from all instances
SELECT inst_id, file#, status, name
FROM   gv$datafile_header
WHERE  status != 'ONLINE'
ORDER  BY inst_id, file#;

-- Check voting disk and OCR status (from OS as root)
-- crsctl query css votedisk
-- ocrcheck
```

---

## 9. Best Practices

- **Use SCAN (Single Client Access Name) for all client connections.** SCAN provides a single address for clients regardless of how many nodes exist. Never hardcode VIP addresses in application connection strings.
- **Run Grid Infrastructure and Database homes on separate file systems.** GI patching and DB patching are independent; separate homes prevent unintended outages.
- **Size the interconnect for peak block transfer load.** Monitor `gc cr blocks received` and `gc current blocks received` rates to project bandwidth requirements. A saturated interconnect is the leading cause of RAC performance degradation.
- **Design services before deployment.** Services should map 1:1 to application workload types (OLTP, reporting, batch). Mixing workloads in one service makes diagnosis and isolation impossible.
- **Never use `ALTER SYSTEM` to set initialization parameters in RAC without specifying `SID=*` or `SID=<sid>`.** A misconfigured parameter on one instance can cause that instance to crash.
- **Prefer policy-managed databases for new deployments.** Server pools allow Oracle to dynamically rebalance instances across nodes during node failure without manual intervention.
- **Enable Cluster Health Monitor (CHM/OS Watcher).** CHM captures OS-level metrics (CPU, memory, network, disk I/O) per-node with 1-second granularity, which is invaluable during post-mortem analysis of node evictions.

---

## 10. Common Mistakes and How to Avoid Them

### Mistake 1: Routing Interconnect Traffic Over the Public Network

If `/etc/hosts` or DNS does not have a proper private hostname entry, Oracle may default to using the public network for interconnect traffic. This floods the public NIC and causes massive GCS latency.

**Fix:** Always verify the interconnect IP is on the private network before and after installation.

```sql
-- Confirm interconnect is NOT the public IP
SELECT name, ip_address, is_public FROM gv$cluster_interconnects;
-- is_public should be 'NO' for the active interconnect
```

### Mistake 2: Using Default UNDO and TEMP Tablespaces Shared Across Instances

RAC requires one UNDO tablespace **per instance**. Using a single UNDO tablespace is not supported in RAC.

```sql
-- Check UNDO tablespace assignment per instance
SELECT inst_id, value AS undo_tablespace
FROM   gv$parameter
WHERE  name = 'undo_tablespace'
ORDER  BY inst_id;

-- Each inst_id should have a unique undo tablespace name
-- UNDOTBS1 -> inst 1, UNDOTBS2 -> inst 2, etc.
```

### Mistake 3: Not Indexing Sequence-Driven Primary Keys for Cache Fusion

With a single sequence shared across all instances, the "right-hand side" index leaf block becomes a hot block that every instance races to update. This causes massive `gc buffer busy` waits.

**Fix:** Use a **reverse key index** or hash partitioned index on sequence-generated keys in high-concurrency RAC insert scenarios.

```sql
-- Reverse key index reduces right-hand contention
CREATE INDEX IX_ORDERS_ORDER_ID ON ORDERS (order_id) REVERSE;

-- Alternatively, use a sequence with a large CACHE value to reduce SGA pressure
CREATE SEQUENCE SEQ_ORDERS
    START WITH 1
    INCREMENT BY 1
    CACHE 1000       -- Each instance pre-allocates 1000 values; reduces GES traffic
    NOORDER;         -- NOORDER avoids ordering overhead in RAC; fine for surrogate keys
```

### Mistake 4: Ignoring Node Eviction Root Causes

Node evictions (where a hung or slow node is forcibly removed from the cluster) are often treated as hardware failures when they are actually caused by:
- A frozen OS process holding a cluster lock
- A slow interconnect causing missed heartbeats
- An overloaded node failing to respond to CSS within the `misscount` timeout

Always analyze `cssd.log`, `alert_<sid>.log`, and CHM data together before concluding hardware is at fault.

### Mistake 5: Applying Patches Without Running `opatchauto`

In a RAC environment, GI and RAC patches must be applied with `opatchauto` in a rolling manner. Manually applying patches without `opatchauto` can leave GI and DB homes in an inconsistent state across nodes, leading to split-brain scenarios.

---

## Sources

- [Oracle Real Application Clusters Administration and Deployment Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/racad/) — RAC architecture, background processes, GCS/GES, services, TAF, CVU
- [Oracle RAC 19c Glossary](https://docs.oracle.com/en/database/oracle/oracle-database/19/racad/glossary.html) — LMON (Global Enqueue Service Monitor), LMSn, LMD, Cache Fusion, GCS, GES, SCAN, OCR, CSS, CTSS definitions
- [About RAC Background Processes (12c doc, applies to 19c)](https://docs.oracle.com/database/121/RACAD/GUID-AEBD3F49-4F10-4BDE-9008-DC1AF8E7DB42.htm) — LMS, LMD, LCK, LMON, DIAG, RMSn descriptions
- [About Connecting to an Oracle RAC Database Using SCANs](https://docs.oracle.com/en/database/oracle/oracle-database/19/rilin/about-connecting-to-an-oracle-rac-database-using-scans.html) — SCAN resolves to 1–3 IPs; Oracle recommends 3
- [Ensuring Application Continuity (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/racad/ensuring-application-continuity.html) — AC introduced in 12c R1; TAC introduced in 18c; FAILOVER_TYPE values
- [DBMS_SERVICE (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_SERVICE.html) — failover_type valid values (TRANSACTION, SELECT, SESSION, NONE)
