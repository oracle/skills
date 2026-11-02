# Advanced ASYNC Transport Analysis

## When to use
Use this file when:
- transport is ASYNC
- lag continues after normal network and capacity checks
- you need to determine whether the bottleneck is network, disk, or Data Guard processing

## ASYNC behavior model
- Commits do **not** wait for standby acknowledgment.
- TT0n sends redo from the primary log buffer.
- If TT0n falls behind and the log buffer recycles, TT0n reads from the online redo log on disk.
- If multiple log switches occur before TT0n catches up, redo gap resolution sends intermediate archived logs as needed.

## Key resource dependency
ASYNC can keep up with very high workloads if the environment has enough:
- network bandwidth
- CPU
- memory
- primary log I/O bandwidth
- standby receive/write capacity

## Enable lightweight krsb stats
Enable on both primary and standby:
```sql
alter session set events '16421 trace name context forever, level 3';
```

This is described as lightweight and intended for diagnosing where ASYNC shipping spends time.

## Find the async transport process trace file
```sql
select dp.name,
       dp.pid as ospid,
       p.tracefile
from v$dataguard_process dp,
     v$process p
where dp.pid = p.spid
  and dp.role like 'async%';
```

## How to read krsb stats

### Start with the client-side percentages
Look at which layer dominates elapsed time:
- network
- disk
- Data Guard layer

### Network interpretation
Key fields:
- `Average time : NETWORK SEND`
- `Total bytes completed synchronously / Total bytes written`
- `Percentage of time in network`

Heuristics:
- Higher `NETWORK SEND` times can point to network encryption or redo compression overhead.
- If `Total bytes completed synchronously / Total bytes written` is **less than 90%**, larger TCP socket buffers may help.
  - This typically means tuning `tcp_rmem` and `tcp_wmem`
  - A transport restart is required after such changes

### Disk interpretation
Key fields:
- `Log buffer blocks`
- `Read-ahead blocks`
- `Disk stall blocks`
- `Percentage of time in disk layer`

Heuristics:
- Best case: most reads come from the log buffer, not disk.
- If a meaningful portion comes from disk, increasing `log_buffer` on the primary may help.
  - Requires database restart
  - RAC rolling restart is supported
- If `Disk stall blocks` is high, consider:
```sql
_log_archive_buffers = 256
```
  - Requires restart
  - RAC rolling restart is supported

### Data Guard layer interpretation
If most time is in the Data Guard layer and lag exists:
- suspect broader system resource constraints
- check CPU and memory pressure
- review OSWatcher / ExaWatcher

## Encryption guidance
Oracle Net encryption can significantly reduce redo throughput at high redo rates.

If application connections require Oracle Net encryption but redo transport does not, you can disable encryption only for the redo transport alias by using the standby net service descriptor:
```text
(SECURITY=(ENCRYPTION_CLIENT=REJECTED))
```

Use this only when business/security policy allows it.

## Disable krsb stats after testing
```sql
alter session set events '16421 trace name context forever, level 1';
```

## Practical ASYNC decision rules
- **Mostly network time**
  Tune bandwidth, latency, socket buffers, MTU, or reduce encryption/compression overhead.
- **Mostly disk time**
  Improve primary ORL read path, standby write path, and relevant storage tiers.
- **Mostly DG layer time**
  Suspect CPU/memory contention or process scheduling bottlenecks.
- **Frequent fallback from log buffer to ORL**
  Consider larger `log_buffer` and investigate why TT0n cannot keep up.
