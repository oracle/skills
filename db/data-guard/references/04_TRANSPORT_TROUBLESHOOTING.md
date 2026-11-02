# Redo Transport Troubleshooting

## When to use
Use this file when transport lag is unacceptable.

## Main idea
Redo transport performance is governed by:
- primary resources
- standby resources
- network throughput and latency
- I/O performance
- optional overheads such as compression and encryption

## Step-by-step transport workflow

### 1) Confirm that transport lag exists
```sql
select name, value, time_computed, datum_time
from v$dataguard_stats
where name like '%lag';
```

Also review lag history:
```sql
select name, time, unit, count, last_time_updated
from v$standby_event_histogram
where name like '%lag'
  and count > 0
order by last_time_updated;
```

### 2) Record when lag starts and how it evolves
Questions:
- Did lag start during a daily, monthly, or quarter-end batch?
- Is it persistent or only bursty?
- Does lag shrink after workload returns to normal?

### 3) Inspect transport configuration
Check each enabled `LOG_ARCHIVE_DEST_n` and note:
- transport mode: ASYNC or SYNC
- `FASTSYNC` present?
- compression enabled?
- encryption enabled?

Why this matters:
- redo compression can reduce bandwidth consumption but add CPU overhead
- redo encryption adds CPU overhead on send and receive paths
- Oracle Net encryption can also significantly reduce throughput

### 4) Compare current lag timing with redo generation spikes on primary
Daily redo history:
```sql
select trunc(completion_time) as "DATE",
       count(*) as "LOG SWITCHES",
       round(sum(blocks*block_size)/1024/1024) as "REDO PER DAY (MB)"
from v$archived_log
where dest_id = 1
group by trunc(completion_time)
order by 1;
```

Peak hourly redo generation:
```sql
select begin_time,
       instance_number,
       metric_name,
       round(value/1024/1024) as "MAX RATE MB"
from (
  select to_char(begin_time,'DD-MON-YYYY HH24') begin_time,
         instance_number,
         metric_name,
         max(value) value
  from dba_hist_sysmetric_history
  where metric_name = 'Redo Generated Per Sec'
    and trunc(begin_time) >= trunc(sysdate-7)
  group by to_char(begin_time,'DD-MON-YYYY HH24'),
           instance_number,
           metric_name
)
order by 1, 3;
```

Per-log redo rate:
```sql
alter session set nls_date_format='YYYY/MM/DD HH24:MI:SS';

-- Replace the timestamp window below with the incident window you are investigating.
select thread#,
       sequence#,
       blocks*block_size/1024/1024 as mb,
       (next_time-first_time)*86400 as sec,
       (blocks*block_size/1024/1024)/((next_time-first_time)*86400) as "MB/s"
from v$archived_log
where ((next_time-first_time)*86400 <> 0)
  and first_time between to_date('<start_timestamp>','YYYY/MM/DD HH24:MI:SS')
                    and to_date('<end_timestamp>','YYYY/MM/DD HH24:MI:SS')
  and dest_id = 1
order by first_time;
```

### 5) Evaluate the network
Questions:
- Is available bandwidth sufficient for peak redo generation?
- Are socket buffers sized appropriately?
- Is MTU tuned for redo write sizes?
- Is latency acceptable for the chosen transport mode?

Guidance:
- ASYNC mostly needs strong single-stream throughput
- SYNC is much more sensitive to round-trip latency
- More than ~5 ms latency can materially affect SYNC throughput

### 6) Evaluate system resources on both sides
Transport can degrade when:
- primary or standby is CPU bound
- TT0n async sender is CPU bound (> ~70% of a CPU)
- I/O is saturated
- network interfaces are oversubscribed

Collect:
- AWR / ASH
- OSWatcher or ExaWatcher
- CPU and I/O utilization
- network interface utilization
- standby redo log write latency

## Important operational note
A common standby issue is poor standby redo log write latency caused by
insufficient I/O bandwidth. Address the standby I/O bottleneck directly when
possible because **Data Guard Fast Sync** does not improve redo log write
latency on the standby itself.

What Fast Sync can improve is **primary commit latency** for SYNC transport.
With Fast Sync (`SYNC` with `NOAFFIRM`), the primary does not wait for redo to
be written to the standby SRL before acknowledging commit, so standby SRL write
latency is removed from the primary commit path. This can reduce commit latency
at the primary, but the standby-side write latency problem still remains and
must be evaluated separately.

## When to stop transport tuning
If after network + system tuning the transport lag returns to acceptable levels, stop here.
If not:
- for ASYNC deep analysis, use `05_ASYNC_TRANSPORT_ADVANCED.md`
- for SYNC analysis, use `06_SYNC_TRANSPORT_PERFORMANCE.md`
