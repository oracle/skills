# SQL Query Cookbook for Data Guard Triage

## Usage note
Replace placeholder timestamp windows with the actual incident range you are
investigating.

## 1) Current lag
```sql
select name, value, time_computed, datum_time
from v$dataguard_stats
where name like '%lag';
```

## 2) Lag history since standby startup
```sql
select name, time, unit, count, last_time_updated
from v$standby_event_histogram
where name like '%lag'
  and count > 0
order by last_time_updated;
```

## 3) Daily redo generation history on primary
```sql
select trunc(completion_time) as "DATE",
       count(*) as "LOG SWITCHES",
       round(sum(blocks*block_size)/1024/1024) as "REDO PER DAY (MB)"
from v$archived_log
where dest_id = 1
group by trunc(completion_time)
order by 1;
```

## 4) Peak hourly redo generation
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

## 5) Per-log redo rate
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

## 6) Recovery progress on standby
```sql
alter session set nls_date_format='YYYY/MM/DD HH24:MI:SS';

select start_time, item, sofar, units
from gv$recovery_progress;
```

## 7) Find top waits in standby ASH (last 30 min)
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

## 8) Find top waits in standby ASH (between timestamps)
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

## 9) Enable krsb stats for ASYNC transport analysis
```sql
alter session set events '16421 trace name context forever, level 3';
```

## 10) Disable krsb stats
```sql
alter session set events '16421 trace name context forever, level 1';
```

## 11) Find ASYNC transport trace file
```sql
select dp.name,
       dp.pid as ospid,
       p.tracefile
from v$dataguard_process dp,
     v$process p
where dp.pid = p.spid
  and dp.role like 'async%';
```

## 12) Enable MIRA through SQL
```sql
alter database recover managed standby database disconnect from session instances all;
```
