# Decision Trees and Playbooks

## Playbook 1: Lag triage
1. Run:
   - `v$dataguard_stats`
   - `v$standby_event_histogram`
2. If `transport lag` is high:
   - go to transport workflow
3. If `transport lag` is low but `apply lag` is high:
   - go to apply workflow
4. If both are low except for short spikes:
   - correlate with batch windows, log switches, checkpoints, network spikes

## Playbook 2: Transport workflow
1. Confirm lag timing and recurrence
2. Compare with primary redo generation peaks
3. Check `LOG_ARCHIVE_DEST_n`:
   - ASYNC or SYNC?
   - compression?
   - encryption?
   - FASTSYNC?
4. Evaluate:
   - bandwidth
   - latency
   - socket buffers
   - MTU
5. Check system pressure:
   - CPU
   - I/O
   - interface utilization
6. If ASYNC remains slow:
   - enable krsb stats
   - classify dominant time as network / disk / DG layer
7. If SYNC impact is high:
   - compare TPS vs remote-write latency
   - inspect standby redo log placement and standby I/O

## Playbook 3: Apply workflow
1. Confirm transport is healthy enough
2. Query `gv$recovery_progress`
3. Compare primary redo rate to standby `Active Apply Rate`
4. Gather standby AWR / ASH / OS data
5. Identify top recovery waits
6. Apply targeted tuning:
   - redo read path
   - datafile read/write path
   - checkpoint path
   - buffer sizing
7. If lag is > 24 hours:
   - consider recover-from-service roll-forward

## Playbook 4: When to consider MIRA
Only if:
- SIRA has already been tuned
- storage is not the main bottleneck
- `PR00` is CPU bound for much of the representative workload
- release and patch level are MIRA-ready

If yes:
- enable MIRA
- increase MIRA buffers
- re-check top waits and SGA usage
- iterate

## Playbook 5: Fast verbal answer templates for an agent
### "Why is my standby behind?"
- First determine whether the issue is transport lag, apply lag, or both.
- If transport lag is high, inspect redo generation spikes, network throughput/latency, compression/encryption overhead, and primary/standby resource pressure.
- If transport lag is low but apply lag is high, compare `Active Apply Rate` with primary redo rate and inspect standby recovery waits.

### "Is SYNC killing performance?"
- Do not judge from `log file sync` average alone.
- Compare TPS, `log file parallel write`, `SYNC remote write`, redo write size, and standby I/O latency.
- If `SYNC remote write` dominates, the standby remote write path or network is usually the bottleneck.

### "Should I enable MIRA?"
- Not until SIRA is tuned.
- Consider MIRA only when `PR00` is CPU bound and storage is not the limiting resource.
- After enabling MIRA, tune `_mira_num_local_buffers` and `_mira_num_receive_buffers` iteratively.

## Recommended MCP retrieval tags
- dataguard-overview
- transport-lag
- apply-lag
- async-transport
- sync-transport
- krsb
- recovery-progress
- awr
- ash
- sira
- mira
- standby-io
- redo-generation
