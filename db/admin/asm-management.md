# Oracle Automatic Storage Management (ASM)

## Overview

Oracle Automatic Storage Management (ASM) is Oracle's volume manager and file system, purpose-built for Oracle Database files. It manages a pool of disks as one or more **disk groups**, stripes and optionally mirrors data across the disks in a group, and presents the result to the database as a logical container that the database can address with simple `+DG_NAME` filenames.

ASM is the recommended storage layer for Oracle RAC, Exadata, Oracle Database Appliance (ODA), and most Oracle Cloud Infrastructure database services. It is also commonly used for single-instance databases on Linux when storage flexibility, online disk management, and integration with Oracle Grid Infrastructure are wanted. ASM is included with Oracle Grid Infrastructure at no extra cost relative to a database license.

This skill covers Standalone Grid Infrastructure (single-instance host) and Cluster Grid Infrastructure (RAC) ASM equally. Cluster topology, services, and CRSCTL/SRVCTL administration live in `db/architecture/rac-concepts.md`. Exadata Cell Server administration is intentionally out of scope.

---

## Architecture

### ASM Instance

ASM runs as its own Oracle instance, separate from the database instances it serves. On a single host the ASM instance is named `+ASM`; on each RAC node it is named `+ASM1`, `+ASM2`, and so on. The ASM instance has no datafiles of its own — it manages metadata describing how database files are laid out across disks and brokers I/O between database instances and disks.

The ASM instance exposes the same SQL interfaces a database instance does (`sqlplus / as sysasm`, `V$` views, `ALTER SYSTEM`), but accepts a smaller, ASM-specific set of statements (`ALTER DISKGROUP`, `CREATE DISKGROUP`, `MOUNT`, `DISMOUNT`, etc.).

Key background processes:

| Process | Role |
|---------|------|
| `RBAL`  | Coordinates rebalance activity for the instance |
| `ARBn`  | Worker processes that move extents during rebalance (`n` is the slave number) |
| `GMON`  | Maintains disk group membership in the ASM instance |
| `MARK`  | Marks ASM allocation units as stale so they can be re-mirrored |
| `Pnnn`  | Parallel slaves used by some ASM operations |
| `ASMB`  | Runs in each database instance and connects it to ASM |

### Disk Groups, Disks, Files, Allocation Units

A **disk group** is the unit of management. It owns a set of disks and presents them as a single namespace that database files live in.

A **disk** in ASM is anything Oracle Grid Infrastructure can address as a block device after disk discovery — a raw partition, a multipath device, an NVMe namespace, or an LVM logical volume. ASM does not require a filesystem on the disk; it writes the device directly.

An **ASM file** is any file Oracle stores in a disk group: datafiles, online redo logs, archived redo logs, control files, RMAN backup pieces, and the OCR/voting files when Grid Infrastructure is configured to store them in ASM. Files are referenced by ASM-style names such as `+DATA/ORCL/DATAFILE/system.257.123456789`.

An **allocation unit (AU)** is the smallest contiguous chunk ASM allocates on a disk. The default is 1 MB, set by the `AU_SIZE` attribute at disk-group creation. Larger AU sizes (4 MB or higher) are common for very large databases where read efficiency matters more than allocation granularity. AU size cannot be changed after the disk group is created.

ASM stripes an extent of a file across multiple disks in fine-grain or coarse-grain stripes (1 KB or 1 MB by default, depending on the file template), and ensures that disk space is balanced as files grow and shrink.

### Compatibility Attributes

Two disk-group attributes drive feature availability and on-disk format:

- `COMPATIBLE.ASM` — the minimum ASM software version that can mount the disk group.
- `COMPATIBLE.RDBMS` — the minimum database software version that can read or write files in the disk group.

Once advanced, both attributes cannot be lowered. Set them as high as the lowest software version in the deployment will tolerate.

```sql
ALTER DISKGROUP data SET ATTRIBUTE 'compatible.asm'   = '19.0.0.0.0';
ALTER DISKGROUP data SET ATTRIBUTE 'compatible.rdbms' = '19.0.0.0.0';
```

---

## Redundancy and Failure Groups

### Redundancy Levels

ASM offers four redundancy choices at disk-group creation time:

| Level      | Mirroring | Common use |
|------------|-----------|------------|
| `EXTERNAL` | None — ASM relies on the storage array | Storage already provides RAID; you do not want ASM to mirror |
| `NORMAL`   | Two-way mirroring | Standard on-prem RAC / Standalone deployments |
| `HIGH`     | Three-way mirroring | Critical systems; standard on Exadata for `DATA` and `RECO` |
| `FLEX`     | Per-file redundancy with quorum failgroups (12.2 and later) | Mixed workloads where some files need different redundancy in the same group |

`NORMAL` and `HIGH` redundancy require at least 2 and 3 failure groups respectively. `EXTERNAL` requires only 1.

### Failure Groups

A **failure group** is a subset of disks within a disk group that share a failure boundary. ASM places mirror copies of an extent on disks in different failure groups, so the loss of one failure group does not lose data.

By default each disk is its own failure group. To survive correlated failures (a whole controller, an entire JBOD, a single rack) explicitly assign disks to failure groups:

```sql
CREATE DISKGROUP data NORMAL REDUNDANCY
  FAILGROUP fg_array_a DISK
    '/dev/oracleasm/disk1' NAME data_0001,
    '/dev/oracleasm/disk2' NAME data_0002
  FAILGROUP fg_array_b DISK
    '/dev/oracleasm/disk3' NAME data_0003,
    '/dev/oracleasm/disk4' NAME data_0004
  ATTRIBUTE 'au_size' = '4M',
            'compatible.asm'   = '19.0.0.0.0',
            'compatible.rdbms' = '19.0.0.0.0';
```

In a typical RAC + dual-array deployment, place each storage array's LUNs in a distinct failure group so that the loss of one array does not take the disk group down.

---

## Disk Discovery

ASM discovers disks at instance start and on demand using the `ASM_DISKSTRING` parameter, which is a comma-separated list of glob patterns evaluated against block-device paths.

```sql
SHOW PARAMETER asm_diskstring

-- Example values
ALTER SYSTEM SET ASM_DISKSTRING = '/dev/oracleasm/disks/*' SCOPE=BOTH;
ALTER SYSTEM SET ASM_DISKSTRING = '/dev/mapper/ora_*'      SCOPE=BOTH;
ALTER SYSTEM SET ASM_DISKSTRING = 'AFD:*'                  SCOPE=BOTH;
```

Once `ASM_DISKSTRING` is set, the ASM instance scans the matching paths for disk headers and either claims the disk (if it has been provisioned for ASM) or ignores it.

The three common ways to provision and persist ASM device names on Linux are:

| Method | When it fits |
|--------|--------------|
| **Oracle ASM Filter Driver (AFD)** | Recommended on Oracle Linux and supported variants from 12.1.0.2 onward. Requires Grid Infrastructure. Provides device labelling, I/O fencing, and protection against accidental writes. |
| **ASMLib** | Older Linux deployments that have not migrated. Still supported on Oracle Linux but largely superseded by AFD. |
| **udev rules** | Distribution-neutral, no extra packages. The administrator writes `/etc/udev/rules.d/` rules to assign stable names, owners, and modes to block devices. |

Whichever method is used, `ASM_DISKSTRING` must match the resulting paths exactly, and the disks must be readable and writable by the Grid Infrastructure user (typically `grid` or `oracle`).

---

## Disk Group Lifecycle

### Create

```sql
CREATE DISKGROUP reco NORMAL REDUNDANCY
  FAILGROUP fg1 DISK '/dev/mapper/reco_a*' NAME reco_a
  FAILGROUP fg2 DISK '/dev/mapper/reco_b*' NAME reco_b
  ATTRIBUTE 'au_size'           = '4M',
            'compatible.asm'    = '19.0.0.0.0',
            'compatible.rdbms'  = '19.0.0.0.0';
```

`CREATE DISKGROUP` writes the ASM header on each disk and registers the group in the Grid Infrastructure registry. After creation, mount the group on every node that needs it (via `srvctl modify diskgroup` or by running `ALTER DISKGROUP MOUNT` on each ASM instance, depending on Grid Infrastructure version).

### Alter

The `ALTER DISKGROUP` statement covers most ongoing operations: mounting, dismounting, adding and dropping disks, resizing disks, changing attributes, and triggering rebalance.

```sql
-- Mount / dismount
ALTER DISKGROUP data MOUNT;
ALTER DISKGROUP data DISMOUNT;

-- Change an attribute
ALTER DISKGROUP data SET ATTRIBUTE 'compatible.rdbms' = '19.0.0.0.0';

-- Trigger or change a rebalance (POWER 0 suspends an in-progress rebalance)
ALTER DISKGROUP data REBALANCE POWER 8;
ALTER DISKGROUP data REBALANCE POWER 0;
```

### Drop

`DROP DISKGROUP` only succeeds if the group has no active database files. Use the `INCLUDING CONTENTS` clause to drop a group whose contents have already been migrated elsewhere.

```sql
DROP DISKGROUP scratch INCLUDING CONTENTS;
```

### Rebalance Behavior

Rebalance is the process of moving allocation units between disks so that data is spread evenly. ASM triggers a rebalance automatically when disks are added or dropped; the administrator can also trigger one manually.

Rebalance power is set with the `REBALANCE POWER` clause. The legal range is `0` (suspend) up to the value of the `ASM_POWER_LIMIT` initialization parameter (default 1, maximum 1024 from 12.2 onward when `compatible.asm >= 11.2.0.2`). Higher power moves data faster but consumes more I/O and CPU; pick a value that does not starve production workloads.

```sql
-- Suspend an in-flight rebalance, then resume at lower power
ALTER DISKGROUP data REBALANCE POWER 0;
ALTER DISKGROUP data REBALANCE POWER 4;

-- Block until the rebalance completes (useful in scripts)
ALTER DISKGROUP data REBALANCE POWER 8 WAIT;
```

While a rebalance is running, `V$ASM_OPERATION` reports its progress (see [Monitoring](#monitoring)).

---

## Day-to-Day Operations

### Add and Drop Disks

```sql
-- Add a disk into an existing failure group with explicit name
ALTER DISKGROUP data
  ADD FAILGROUP fg_array_a
  DISK '/dev/oracleasm/disk5' NAME data_0005
  REBALANCE POWER 4;

-- Drop a disk; ASM rebalances surviving disks before retiring it
ALTER DISKGROUP data
  DROP DISK data_0005
  REBALANCE POWER 4;
```

`DROP DISK` returns immediately, but the underlying disk is not released until the rebalance finishes. Watch `V$ASM_OPERATION` and the disk's `HEADER_STATUS`; the disk leaves the group only after `HEADER_STATUS` becomes `FORMER`.

### Resize a Disk

If the underlying LUN has been expanded, tell ASM to use the new size:

```sql
-- Pick up the new size automatically
ALTER DISKGROUP data RESIZE ALL;

-- Or resize a single disk to an explicit size
ALTER DISKGROUP data RESIZE DISK data_0001 SIZE 200G REBALANCE POWER 4;
```

### Move Files Between Disk Groups

Database files can be moved online with `ALTER DATABASE MOVE DATAFILE` (12.1 and later) or via RMAN:

```sql
-- Online move (database connection, not ASM connection)
ALTER DATABASE MOVE DATAFILE '+DATA/orcl/datafile/users.260.123456789'
                       TO   '+DATA2/orcl/datafile/users.dbf';
```

Online redo log members are moved with `ALTER DATABASE` add/drop logfile member operations; control files require a database restart.

### ASMCMD Essentials

`asmcmd` is the command-line shell for ASM, run by the Grid Infrastructure user. It exposes a Unix-like interface over the ASM file system.

```bash
# Launch with privileged credentials
asmcmd -p

# Inspect disk groups and disks
asmcmd> lsdg
asmcmd> lsdsk -k -G data
asmcmd> lsct                # connected database instances

# Browse the ASM file system
asmcmd> ls +DATA/ORCL/DATAFILE
asmcmd> du +DATA/ORCL
asmcmd> find +DATA -t DATAFILE

# Manage aliases (human-friendly names for system-generated files)
asmcmd> mkalias '+DATA/ORCL/DATAFILE/system.257.123456789' '+DATA/ORCL/system.dbf'
```

ASMCMD also implements `cp`, `rm`, `mkdir`, `mv`, `chown`, `chmod`, and `chgrp`. The full reference is in the Oracle ASM documentation linked in [Sources](#sources).

---

## Monitoring

### Key Views

The ASM instance exposes the state of the storage layer through dynamic performance views. The most frequently queried are:

| View | What it tells you |
|------|-------------------|
| `V$ASM_DISK`       | One row per discovered disk: header status, total/free size, mount status, failure group |
| `V$ASM_DISKGROUP`  | One row per known disk group: state, redundancy, total/free MB, allocation unit size |
| `V$ASM_OPERATION`  | One row per in-flight operation (rebalance, resync); estimated minutes remaining |
| `V$ASM_CLIENT`     | Database instances currently connected to ASM and the disk groups they have open |
| `V$ASM_FILE`       | Files in each disk group, with type, size, redundancy, striping |
| `V$ASM_TEMPLATE`   | File-creation templates per disk group (striping, redundancy defaults) |
| `V$ASM_ATTRIBUTE`  | Disk-group attribute values (`compatible.asm`, `au_size`, etc.) |

In a RAC cluster, the cluster-wide equivalents are `GV$ASM_*`.

### Daily-Health Snapshot

```sql
-- Disk group capacity and state
SELECT name,
       state,
       type,
       total_mb,
       free_mb,
       ROUND( (1 - free_mb/NULLIF(total_mb,0)) * 100, 2) AS pct_used
FROM   v$asm_diskgroup
ORDER  BY name;

-- Disks that are not in the expected normal state
SELECT group_number, name, path, header_status, mount_status, mode_status, failgroup
FROM   v$asm_disk
WHERE  header_status <> 'MEMBER'
   OR  mount_status  <> 'CACHED'
   OR  mode_status   <> 'ONLINE';
```

### Rebalance Progress

```sql
SELECT group_number,
       operation,
       state,
       power,
       sofar,
       est_work,
       est_minutes
FROM   v$asm_operation
ORDER  BY group_number;
```

When `est_minutes` does not converge, the rebalance is being throttled (low `POWER`) or contending with another workload. Increase `POWER` only if there is I/O headroom — overshoot can starve production sessions.

### What to Alert On

- Any `V$ASM_DISKGROUP.STATE` other than `MOUNTED`.
- `pct_used` above the operational threshold (a common rule is alert at 80%, page at 90%).
- Any row in `V$ASM_DISK` with `HEADER_STATUS` of `UNKNOWN`, `CANDIDATE`, `FOREIGN`, or `INCOMPATIBLE` on a node where the disk should be in use.
- A long-running rebalance that has not progressed (compare `SOFAR` over time).
- An ASM client (`V$ASM_CLIENT`) that has unexpectedly disconnected.

---

## Common Errors

The diagnostic flow for ASM errors is almost always the same: read the alert log of the ASM instance, then the alert log of the affected database instance, then check Grid Infrastructure (`crsctl status resource -t`, `srvctl status diskgroup`).

### `ORA-15014: Path 'X' is not in the discovery set`

Raised when a referenced disk path does not match any pattern in `ASM_DISKSTRING`, or when the device is missing or unreadable.

Diagnostic steps:

1. Verify the device exists: `ls -l <path>` on every cluster node.
2. Check ownership/permissions; the Grid Infrastructure user must have read/write access.
3. Compare the path to `ASM_DISKSTRING`. If you use AFD or ASMLib, the discovery path should be `AFD:*` or `ORCL:*`, not the raw device.
4. If a node was added recently, confirm the same multipath/AFD/udev configuration was applied there.

### `ORA-15032: Not all alterations performed`

An umbrella error returned when an `ALTER DISKGROUP` statement fails. The actual cause appears either in a stacked `ORA-150xx` alongside `ORA-15032` or in the ASM alert log. Always read the next message in the stack — `ORA-15032` on its own is not actionable.

### `ORA-15040: Diskgroup is incomplete`

A required disk is missing from a mounted disk group. Inspect `V$ASM_DISK`:

```sql
SELECT group_number, disk_number, name, path, header_status, mount_status
FROM   v$asm_disk
WHERE  group_number = (SELECT group_number FROM v$asm_diskgroup WHERE name = 'DATA');
```

Investigate any disk with `MOUNT_STATUS = 'MISSING'` at the OS layer (multipath, SAN, storage array) before forcing any ASM-side action.

### `ORA-15042: Disk N is missing from group "X"`

A specific numbered disk cannot be located when the disk group is mounted. Same investigation flow as `ORA-15040`. If the disk is permanently lost and the disk group has redundancy headroom, drop the disk explicitly with `ALTER DISKGROUP X DROP DISK ... FORCE` and let ASM rebalance the remainder. `FORCE` discards the disk's content; only use it when the disk truly cannot be brought back.

For a broader catalogue of `ORA-` codes seen by agents and operators, see `db/agent/ora-error-catalog.md`.

---

## Best Practices

- **Use `EXTERNAL` redundancy only when the storage array genuinely provides full protection** — otherwise a single failure can take the disk group down. On commodity storage, prefer `NORMAL` or `HIGH`.
- **Keep at least 25–30% free space in each disk group** so a rebalance after a failed disk has room to re-mirror. Exadata and ODA often plan for 40%.
- **Place failure groups across physical fault boundaries** — separate arrays, separate JBODs, separate racks. Failure groups inside a single shelf provide no real protection.
- **Use a dedicated disk group for the FRA** so backup and archive activity does not compete with primary-database I/O on the `DATA` disk group.
- **For RAC, store OCR and voting files in a disk group with `NORMAL` (3 voting files) or `HIGH` (5 voting files) redundancy.** External redundancy is permitted only when the storage layer can guarantee it.
- **Pick AU size at creation and leave it alone.** 1 MB suits OLTP; 4 MB is common for VLDB and Exadata. Changing it later requires a recreate.
- **Tune `ASM_POWER_LIMIT` (or per-statement `POWER`) to the I/O budget of the production workload.** Burning rebalance through a peak window is a self-inflicted incident.
- **Monitor `V$ASM_OPERATION` and the alert log during disk add/drop.** A rebalance that stops making progress is a leading indicator of a failing disk that has not yet been reported by the OS.

---

## Common Mistakes and How to Avoid Them

**Mistake: Disks defined as their own failure groups when they should share one**
If every disk is its own failure group, ASM mirrors based on disk count rather than physical fault boundary. The disk group survives a single-disk failure but not the loss of an array. Define failure groups explicitly to mirror physical layout.

**Mistake: Setting `ASM_DISKSTRING` to a pattern that catches non-ASM devices**
A broad glob (`/dev/sd*`) can sweep up boot disks or pre-existing filesystems, generating spurious `FOREIGN` rows in `V$ASM_DISK` and slowing discovery. Scope the pattern to a directory dedicated to ASM, or to AFD/ASMLib aliases.

**Mistake: Using `FORCE` on `DROP DISK` to "fix" a slow rebalance**
`FORCE` skips the rebalance and discards the disk's mirror data. Used on a live disk it can leave the disk group degraded or unmountable. Only use `FORCE` when the disk is genuinely unreachable and its content has already been reconstructed elsewhere.

**Mistake: Running rebalance at maximum power during business hours**
A `POWER` of 11 (or higher in 12.2+) can saturate the storage path and starve production sessions. Schedule large rebalances for low-load windows or pin to a moderate power.

**Mistake: Reusing disk-group names across environments**
Identical names in dev, staging, and production make it dangerously easy to point a recovery operation at the wrong cluster. Use environment-prefixed names or rely on `DB_UNIQUE_NAME` plus distinct disk-group names.

**Mistake: Dropping a disk before checking that the group has free space to absorb its content**
If `(free_mb - usable_file_mb_after_drop)` would go negative, the drop fails or leaves the group at risk. Run the calculation against `V$ASM_DISKGROUP` before issuing the drop.

---

## Oracle Version Notes (19c vs 26ai)

- `EXTERNAL`, `NORMAL`, and `HIGH` redundancy are stable and behave the same in 19c and 26ai. `FLEX` disk groups (introduced in 12.2) and the related quorum failure groups are fully supported across both releases; verify `compatible.asm` and `compatible.rdbms` are both at or above `12.2` before relying on `FLEX`-only features.
- The maximum `POWER` for rebalance has been 1024 since 12.2, conditional on `compatible.asm >= 11.2.0.2`. The default `ASM_POWER_LIMIT` remains `1` on both 19c and 26ai.
- Oracle ASM Filter Driver (AFD) is the preferred provisioning method on supported Linux distributions on both 19c and 26ai. ASMLib is still available on Oracle Linux but is no longer the recommended default.
- Some ASM commands (`ALTER DISKGROUP REPLACE DISK`, online disk relocation) extend their behaviour in newer releases. When mixing 19c and 26ai instances against the same disk group, the lowest `compatible.asm` value sets the feature ceiling for the group.
- Treat any feature documented only in 23ai or 26ai release notes as 26ai-capable and provide a 19c-compatible alternative when scripting automation that has to run against both.

---

## Related Skills

- `db/architecture/rac-concepts.md` — RAC topology, instances, services, and how ASM fits into the cluster.
- `db/architecture/exadata-features.md` — Exadata-specific storage cells layered on top of ASM.
- `db/admin/redo-log-management.md` — placing online redo logs on ASM-backed disk groups.
- `db/admin/backup-recovery.md` — using ASM as an RMAN backup destination and FRA target.
- `db/agent/ora-error-catalog.md` — agent-friendly catalogue of `ORA-` codes referenced here.

---

## Sources

- [Oracle Database 19c Automatic Storage Management Administrator's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/ostmg/index.html)
- [Oracle Database 19c Reference — Dynamic Performance Views (`V$ASM_*`)](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/dynamic-performance-views.html)
- [Oracle Database 19c ASMCMD Command Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/ostmg/asmcmd-reference.html)
- [Oracle Grid Infrastructure 19c Installation and Upgrade Guide for Linux — Configuring Oracle ASM Filter Driver](https://docs.oracle.com/en/database/oracle/oracle-database/19/cwlin/index.html)
- [Oracle Database 19c Error Messages — `ORA-15000` to `ORA-15999`](https://docs.oracle.com/en/database/oracle/oracle-database/19/errmg/ORA-15000.html)
