# Apply Tuning: SIRA and MIRA

## Use order
1. Tune **single-instance redo apply (SIRA)** first
2. Only evaluate **multi-instance redo apply (MIRA)** after SIRA is well tuned

## SIRA prerequisites and bottleneck checks
Check for:
- CPU saturation on standby
- saturated standby I/O subsystem
- standby SGA / buffer cache smaller than primary
- contention from reporting workloads on Active Data Guard

Needed resources:
- CPU for `PR00` and recovery workers `PRnn`
- low-latency, high-bandwidth datafile I/O
- enough memory for symmetric SGA and buffer cache
- network capacity for incoming redo

## Evidence to collect
- standby AWR (ideally every 30 minutes or less during the issue)
- standby ASH
- OSWatcher / ExaWatcher
- `top` or `ps` for CPU of `ora_pr00_<SID>`

## Recovery wait events and tuning actions

### 1) `log file sequential read`
Meaning:
- recovery coordinator waits on redo reads from standby redo logs, archived logs, or online logs

Action:
- improve I/O bandwidth for archive/SRL/redo storage

### 2) `parallel recovery read buffer free`
Meaning:
- all read buffers are in use; workers are lagging behind coordinator

Action:
```sql
_log_read_buffers = 256
```
(max value noted in source)

### 3) `parallel recovery change buffer free`
Meaning:
- coordinator waits for workers to release buffers

Action:
- improve datafile I/O bandwidth

### 4) `db file sequential read`
Meaning:
- recovery worker waits on data block read I/O

Action:
- improve datafile storage performance

### 5) `checkpoint completed`
Meaning:
- apply is stalled waiting for checkpoint completion

Actions:
- improve datafile storage performance
- increase `db_writer_processes` until `checkpoint completed` is below `db file parallel write`
- consider larger online log files to reduce full checkpoint frequency at log switches

### 6) `recovery read`
Meaning:
- recovery worker waits on batched data block reads

Action:
- improve datafile I/O

### 7) `recovery apply pending` / `recovery receive buffer free` (mostly relevant to MIRA)
Meaning:
- buffer passing between instances is a bottleneck

Action:
- increase `_mira_num_local_buffers`
- increase `_mira_num_receive_buffers`

## MIRA decision criteria
Consider MIRA only when all of the following are true:
- SIRA is already well tuned
- standby is **not** primarily I/O bound
- `PR00` is CPU bound
- `PR00` uses > ~70% CPU for much of the representative interval
- database release is effectively 19c with relevant fixes; source recommends at least 19.13 for important MIRA fixes

## Exadata-specific MIRA prerequisite
On Exadata without persistent memory in certain release combinations, MIRA requires:
```sql
_cache_fusion_pipelined_updates_enable = FALSE
```
Only redo generated with the relevant parameter disabled can be recovered with MIRA.

## Recommended initial MIRA buffer settings
```sql
_mira_local_buffers       = 100
_mira_num_receive_buffers = 100
_mira_rcv_max_buffers     = 10000
```

Notes:
- these increase SGA use
- restart required for effect
- RAC rolling restart is allowed

## MIRA memory estimate
Per participating RAC instance:
```text
((_mira_local_buffers * 2) + (_mira_num_receive_buffers * (instances - 1))) MB
```

Example for 4 instances with local=100 and receive=100:
```text
(100*2) + (100*3) = 500 MB
```

## How to enable MIRA
Broker:
```text
ApplyInstances=<#|ALL>
```

SQL:
```sql
alter database recover managed standby database disconnect from session instances all;
```

## MIRA iterative tuning loop
1. Enable MIRA with all standby instances if appropriate
2. Start with larger MIRA buffers
3. Monitor apply rate and standby AWR during normal and peak windows
4. If top waits include:
   - `recovery apply pending`
   - `recovery receive buffer free`
   increase `_mira_num_receive_buffers` and `_mira_num_local_buffers` in steps of 100
5. Re-check SGA headroom and system contention
6. Repeat until waits are no longer significant or gains flatten

## Practical rule
If `PR00` is not CPU bound, go back to SIRA tuning. MIRA is not the first answer for a generally slow standby.
