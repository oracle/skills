# Overview and Lag Model

## Scope
Use this file first for general Data Guard troubleshooting orientation.

## Core principles
- Tuning assumes Oracle AI Database and Data Guard configuration best practices are already implemented.
- Data Guard performance depends on four broad areas:
  - primary system resources
  - standby system resources
  - network between primary and standby
  - storage and I/O latency

## The three troubleshooting domains
1. **Redo transport**
   - Focus: how fast redo reaches the standby
   - Main risk: transport lag increases RPO exposure
2. **Redo apply**
   - Focus: how fast redo is applied on the standby
   - Main risk: apply lag affects RTO and can also affect RPO when transport lag exists
3. **Role transitions**
   - Focus: switchover/failover speed and operational readiness

## Lag definitions
### Transport lag
Redo generated on the primary but not yet received by the standby.

### Apply lag
Redo received but not yet applied on the standby.
- Apply lag always includes transport lag.
- Apply lag can be equal to or greater than transport lag, but never lower.

## First diagnostic query
```sql
select name, value, time_computed, datum_time
from v$dataguard_stats
where name like '%lag';
```

## How to interpret DATUM_TIME
`DATUM_TIME` is the local standby time when the data used to compute lag was received.
- If `DATUM_TIME` changes normally, standby is receiving fresh data.
- If `DATUM_TIME` stops changing across repeated queries, the standby is not receiving fresh data.
- In that case, potential data loss should be assumed to be at least the difference between current standby time and `DATUM_TIME`.

## Lag history query
```sql
select name, time, unit, count, last_time_updated
from v$standby_event_histogram
where name like '%lag'
  and count > 0
order by last_time_updated;
```

## Practical interpretation
- **Transport lag high, apply lag also high**
  Fix transport first.
- **Transport lag near zero, apply lag high**
  Transport is likely healthy; focus on redo apply.
- **Both near zero most of the time with brief spikes**
  Check whether spikes align with batch windows, log switches, checkpoints, or network disturbances.

## Baseline expectations
For symmetric primary/standby systems with a healthy, well-tuned network and enough bandwidth:
- transport lag should usually be under 10 seconds
- in many environments it should be under 1 second

## Topology information to collect early
- Primary and standby shape:
  - RAC node count
  - CPUs and memory per node
  - storage type and I/O subsystem
- Network topology:
  - components between sites
  - bandwidth
  - latency
- Configuration traits:
  - ASYNC vs SYNC
  - compression enabled?
  - encryption enabled?
  - Oracle Net encryption enabled?
  - Active Data Guard reporting load?
  - Exadata vs non-Exadata?

## Quick triage map
1. Query `v$dataguard_stats`
2. Query `v$standby_event_histogram`
3. Decide whether the issue is transport, apply, or both
4. Compare lag timing with workload timing
5. Move to the relevant playbook:
   - transport: `04_TRANSPORT_TROUBLESHOOTING.md`
   - async deep dive: `05_ASYNC_TRANSPORT_ADVANCED.md`
   - sync deep dive: `06_SYNC_TRANSPORT_PERFORMANCE.md`
   - apply: `07_APPLY_TROUBLESHOOTING.md`
