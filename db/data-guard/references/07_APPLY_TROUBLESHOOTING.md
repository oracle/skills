# Redo Apply Troubleshooting

## When to use
Use this file when:
- apply lag is high
- transport lag is low or near zero
- the standby is receiving redo but not applying fast enough

## Apply process model
1. RFS writes received redo to standby redo logs
2. Recovery coordinator / log merger merges redo threads
3. Recovery workers read needed blocks and apply change vectors in buffer cache
4. DBWR checkpoints dirty buffers to data files

## Expectations by workload
### OLTP recovery
- usually I/O intensive
- many small random reads and writes
- strongly benefits from high IOPS and a symmetric standby

### Batch recovery
- more sequential and efficient
- often reaches much higher apply rates than OLTP

### Mixed workloads
- apply rate depends on the blend of OLTP and batch patterns
- similar redo rates can still produce very different apply rates

## Confirm the problem
```sql
select name, value, time_computed, datum_time
from v$dataguard_stats
where name like '%lag';
```

If transport lag is high, fix transport first.

Lag history:
```sql
select name, time, unit, count, last_time_updated
from v$standby_event_histogram
where name like '%lag'
  and count > 0
order by last_time_updated;
```

## Gather timing evidence
Record these every 15 to 30 minutes during the problem window:
```sql
select name, value, time_computed, datum_time
from v$dataguard_stats
where name like '%lag';
```

```sql
select *
from v$standby_event_histogram
where name like '%lag'
  and count > 0;
```

## Best runtime view for apply throughput
```sql
alter session set nls_date_format='YYYY/MM/DD HH24:MI:SS';

select start_time, item, sofar, units
from gv$recovery_progress;
```

## Key columns from V$RECOVERY_PROGRESS
- **Active Apply Rate**
  Best real indicator. Moving average over roughly the last 3 minutes; excludes idle wait for incoming redo.
- **Average Apply Rate**
  Includes waiting time; often less useful.
- **Maximum Apply Rate**
  Peak recent throughput.
- **Redo Applied**
- **Last Applied Redo**
- **Apply Time per Log**
- **Checkpoint Time per Log**
- **Standby Apply Lag**

## How to use recovery progress
Compare:
- redo generation rate on the primary
- `Active Apply Rate` on the standby

If redo generation persistently exceeds active apply rate, lag will grow.

## Primary redo generation comparison
Daily view:
```sql
select trunc(completion_time) as "DATE",
       count(*) as "LOG SWITCHES",
       round(sum(blocks*block_size)/1024/1024) as "REDO PER DAY (MB)"
from v$archived_log
where dest_id = 1
group by trunc(completion_time)
order by 1;
```

Per-log view:
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

## When standby AWR is unavailable
Use ASH to find top waits over the last 30 minutes:
```sql
select *
from (
  select a.event_id,
         e.name,
         sum(a.time_waited) total_time_waited
  from v$active_session_history a,
       v$event_name e
  where a.event_id = e.event_id
    and a.sample_time >= (sysdate - 30/(24*60))
  group by a.event_id, e.name
  order by 3 desc
)
where rownum < 11;
```

Between two timestamps:
```sql
-- Replace the timestamp window below with the incident window you are investigating.
select *
from (
  select a.event_id,
         e.name,
         sum(a.time_waited) total_time_waited
  from v$active_session_history a,
       v$event_name e
  where a.event_id = e.event_id
    and a.sample_time between to_date('<start_timestamp>','YYYY/MM/DD HH24:MI:SS')
                          and to_date('<end_timestamp>','YYYY/MM/DD HH24:MI:SS')
  group by a.event_id, e.name
  order by 3 desc
)
where rownum < 11;
```

## Large lag shortcut
If apply lag exceeds 24 hours, consider roll-forward from service instead of applying the entire gap:
- `recover database from service`
- this can reduce catch-up time significantly

Trade-off:
- skips some logical/lost-write checks inherent in normal redo apply
- requires manual intervention

## Rare last-resort trade-offs for speed
Only when current protection goals cannot be met:
- mount standby instead of Active Data Guard
- reduce or disable `DB_BLOCK_CHECKING` on standby
- disable Flashback Database
- disable `DB_LOST_WRITE_PROTECT` on primary and standby
These are performance-vs-protection trade-offs and should be treated as temporary or exceptional.
