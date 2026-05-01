# SQLcl AWR Command

## Overview

The `awr` command in SQLcl creates and retrieves Automatic Workload Repository (AWR) reports for the connected Oracle Database instance. AWR reports capture database workload, performance, and resource usage metrics between two snapshots, making them the primary tool for diagnosing performance problems and understanding database behavior over time.

SQLcl's `awr` command is a lightweight wrapper around Oracle's AWR infrastructure — no separate tooling or manual DBMS_WORKLOAD_REPOSITORY calls required.

**Requires:** DBA privilege or access to the `DBA_HIST_*` views (typically granted via the `SELECT ANY DICTIONARY` or `SELECT_CATALOG_ROLE` privilege).

---

## Syntax

```sql
awr <subcommand>
```

Three subcommands are available:

| Subcommand | Description |
|------------|-------------|
| `awr create snapshot` | Take a new AWR snapshot |
| `awr create report` | Generate an AWR report between two snapshots |
| `awr list snapshots` | List all available snapshots |

---

## Subcommand Reference

### awr list snapshots

Lists all AWR snapshots available in the current database instance:

```sql
awr list snapshots
```

Alias:

```sql
awr list snap
```

Output shows snapshot IDs, timestamps, and instance information. Use the IDs from this output as the `begin-snapshot-id` and `end-snapshot-id` for report generation.

---

### awr create snapshot

Takes a new AWR snapshot immediately and prints the assigned snapshot ID:

```sql
awr create snapshot
```

Optional flush-level controls the amount of data captured:

```sql
awr create snapshot bestfit   -- Default: Oracle chooses the optimal level
awr create snapshot lite      -- Minimal data; fastest
awr create snapshot typical   -- Standard data set
awr create snapshot all       -- Maximum data; slowest
```

`bestfit` is the default when no level is specified.

Use this to bracket a specific workload period — take a snapshot before and after running a workload, then generate a report between those two IDs.

---

### awr create report

Generates an AWR report as a file in the current working directory:

```sql
awr create html <begin-snapshot-id> <end-snapshot-id>
awr create text <begin-snapshot-id> <end-snapshot-id>
```

The output file is named automatically:

```
AWR-<DB_Name>-<PDB_Name>-<Timestamp>.html
AWR-<DB_Name>-<PDB_Name>-<Timestamp>.txt
```

**Default behavior when snapshot IDs are omitted:**

```sql
-- Uses the last two snapshots (second-to-last as begin, last as end)
awr create html
awr create text
```

---

## Common Workflows

### Diagnose a recent performance problem

```sql
-- List snapshots to find the relevant time window
awr list snapshots

-- Generate an HTML report for that window (e.g., snapshots 142 to 145)
awr create html 142 145
```

Open the resulting `.html` file in a browser for the full formatted report including Top SQL, wait events, load profile, and instance efficiency metrics.

### Bracket a specific workload

```sql
-- Take a snapshot before running the workload
awr create snapshot
-- note the snapshot ID printed, e.g. 200

-- Run your workload / test here

-- Take a snapshot after
awr create snapshot
-- note the snapshot ID printed, e.g. 201

-- Generate a report covering exactly that workload period
awr create html 200 201
```

### Quick report from the last snapshot interval

```sql
-- No IDs needed — uses the most recent interval automatically
awr create html
```

### Generate a plain-text report for scripted parsing

```sql
awr create text 142 145
```

Text format is useful for automated parsing, email delivery, or logging to a file with SPOOL:

```sql
SPOOL /var/reports/awr_latest.txt
awr create text
SPOOL OFF
```

---

## Reading an AWR Report

Key sections to check in every AWR report:

| Section | What to Look For |
|---------|-----------------|
| **Load Profile** | DB Time per second — high values indicate a busy or slow database |
| **Instance Efficiency** | Buffer hit %, soft parse % — should both be > 95% |
| **Top 5 Timed Events** | The dominant wait events during the interval |
| **SQL Statistics** | Top SQL by elapsed time, CPU, I/O — identifies expensive queries |
| **Segment Statistics** | Hot tables/indexes by physical reads or buffer gets |
| **Memory Statistics** | SGA/PGA usage and advice |
| **I/O Statistics** | Read/write throughput and latency by file |

---

## Scheduling Regular AWR Reports

Use the SQLcl Scheduler Daemon to automate nightly AWR reports:

```yaml
# ~/.dbtools/schedules/scheduler.yaml
jobs:
  - name: nightly-awr-report
    cron: 0 0 7 * * ?
    connection: my_prod_db
    payload: |
      awr create html
      exit
```

Or via a wrapper script:

```sql
-- /opt/scripts/awr_report.sql
awr create html
exit
```

```shell
sql -S user/pass@service @/opt/scripts/awr_report.sql
```

---

## Best Practices

- Run `awr list snapshots` before generating a report to confirm the snapshot IDs exist and span the time window you want.
- Use HTML format for human review; use text format when the output needs to be parsed programmatically or sent in plain-text email.
- Keep snapshot intervals short (15–30 minutes) during active problem investigation so you can isolate the exact period when performance degraded.
- The default AWR snapshot interval is 60 minutes. For fine-grained baselining during a test, take manual snapshots at shorter intervals with `awr create snapshot`.
- Run AWR reports on a non-production replica when possible — generating large AWR reports against a heavily loaded production database consumes I/O and memory.

---

## Common Mistakes and How to Avoid Them

**Mistake: Insufficient privileges**
The `awr` command requires access to `DBA_HIST_*` views. If you see `ORA-00942` errors, ensure the user has `SELECT ANY DICTIONARY` or `SELECT_CATALOG_ROLE`.

**Mistake: Snapshot IDs from a different instance**
In a RAC environment, AWR snapshots are instance-specific. Ensure the begin and end snapshots are from the same instance. Check `awr list snapshots` for the instance column.

**Mistake: Interval too wide to be useful**
An AWR report spanning 8 hours will average out peaks and make it hard to identify short performance spikes. Narrow the interval to the window when the problem occurred.

**Mistake: Not checking the current directory**
The report file is written to the current working directory at the time SQLcl is running. If you are running non-interactively, set your working directory explicitly before calling `awr create`.

---

## Related Skills

- `sqlcl-basics.md` — Connecting and session setup
- `sqlcl-scheduler-daemon.md` — Automate nightly AWR report generation
- `sqlcl-cicd.md` — Running `awr create` non-interactively in pipelines
- `monitoring/top-sql-queries.md` — Querying V$SQL for real-time SQL performance

---

## Sources

- [AWR Command Reference — Oracle SQLcl 25.4 User's Guide](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.4/sqcug/awr.html)
- [Oracle Database Performance Tuning Guide — AWR](https://docs.oracle.com/en/database/oracle/oracle-database/21/tgdba/gathering-database-statistics.html)
