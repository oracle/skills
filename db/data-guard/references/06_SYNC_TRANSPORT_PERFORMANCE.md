# SYNC Transport Performance and Troubleshooting

## When to use
Use this file when redo transport is synchronous (`SYNC` or `FASTSYNC`) and performance impact must be explained or tuned.

## Key warning
Do **not** use `log file sync` average by itself as the primary measure of SYNC impact.

Reason:
- `log file sync` includes batching effects from many sessions waiting behind the same LGWR work
- a few outliers can heavily skew the average
- application throughput and response time may change much less than the wait average suggests

## Commit path with SYNC
1. Foreground posts LGWR and starts `log file sync`
2. LGWR gets CPU
3. LGWR starts redo write time
4. RAC only: LGWR broadcasts write
5. If SYNC standby exists, remote write starts
6. LGWR issues local write (`log file parallel write`)
7. LGWR waits for remote completion
8. LGWR completes redo write / sync remote write
9. RAC only: wait for broadcast ACK
10. Update on-disk SCN
11. Post foregrounds
12. Foregrounds get CPU
13. `log file sync` ends

## Metrics that matter most
- local redo write latency = `log file parallel write`
- remote write latency = `SYNC remote write`
- average redo write size = `redo size / redo writes`
- application-level throughput = TPS from AWR
- foreground commit latency = `log file sync`

## Why log file sync is misleading
A small number of long remote or local write outliers can cause many sessions to wait.
That inflates `log file sync` averages even if:
- most commits remain fast
- TPS impact is modest
- the main issue is a few long waits rather than a general slowdown

## Common causes of SYNC outliers
- spikes in network latency
- standby I/O slower than primary I/O
- standby hosting extra dev/test workloads
- frequent log switches
- checkpoint spikes on standby
- standby redo logs on slow storage
- multiple standby redo log members in a slower disk group

## Frequent log switches matter
A primary log switch forces standby work:
- finish standby redo log header updates
- switch to a new standby redo log
- checkpoint activity
- archive prior standby redo log
These cause write bursts and can create SYNC outliers.

## What to monitor
For OLTP:
- TPS from AWR
- redo size per second
- `log file parallel write`
- `SYNC remote write`
- `log file sync`

For batch:
- focus on elapsed job time and throughput
- do not rely on `log file sync` averages alone

## Performance interpretation pattern
If SYNC is enabled and:
- `log file sync` rises sharply
- `log file parallel write` rises only slightly
- `SYNC remote write` is large
then the standby remote write path is likely the bottleneck.

## Example tuning pattern
Observed problem:
- standby redo logs had multiple members
- logs were placed on a slower disk group

Improvement:
- reduce standby redo logs to a single member
- place them on a fast disk group

Expected result:
- lower RFS random I/O latency
- lower `SYNC remote write`
- smaller application throughput impact

## FASTSYNC note
`FASTSYNC` can reduce the performance penalty of synchronous protection while preserving zero data loss semantics appropriate to its configuration model. It is especially relevant when remote write latency is the main concern.

## Practical SYNC playbook
1. Measure baseline without SYNC when possible
2. Compare:
   - TPS
   - redo rate
   - `log file sync`
   - `log file parallel write`
   - `SYNC remote write`
   - redo write size
3. If remote write dominates:
   - tune standby redo log placement
   - reduce standby SRL member overhead
   - inspect standby I/O latency
   - evaluate network latency
4. If log switch bursts create outliers:
   - consider larger log sizes
   - reduce excessive switching frequency
5. Judge success by **application throughput and response time**, not only by log-file-sync averages
