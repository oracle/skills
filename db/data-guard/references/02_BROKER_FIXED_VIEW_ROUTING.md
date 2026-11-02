# Data Guard Broker Fixed View Routing Guide

## Purpose
This resource maps common Data Guard Broker questions to the broker fixed view
that should answer them. Use it when the question is about broker-managed
configuration state, broker properties, role-change history, Fast-Start
Failover, observer health, or broker status checks.

## Release-awareness note
These views are not all available in every Oracle Database release. Current
Oracle Database Reference documentation shows:
- `V$DG_BROKER_CONFIG` in 21c and later
- `V$DG_BROKER_PROPERTY` starting in 21c
- `V$DG_BROKER_ROLE_CHANGE` starting in 26ai
- `V$DG_BROKER_TAG` starting in 26ai RU 23.26.1
- `V$FAST_START_FAILOVER_CONFIG` starting in 26ai
- `V$FS_LAG_HISTOGRAM` starting in 26ai
- `V$FS_FAILOVER_STATS` as deprecated in 26ai in favor of
  `V$DG_BROKER_ROLE_CHANGE`

When a view is unavailable in the target release, fall back to older broker
tooling such as DGMGRL output, or to older fixed views that remain documented
for that release.

## Use this resource when
- the user asks which broker view to query first
- the answer needs broker configuration, property, or status metadata
- the question is about FSFO mode, observer state, or recent broker role
  changes

## Prefer other DG resources when
- the question is about SQLcl `DG` command syntax:
  `01_SQLCL_DG_COMMANDS.md`
- the question is about general lag diagnosis or tuning:
  `03_OVERVIEW_AND_LAG_MODEL.md` through `10_DECISION_TREES_AND_PLAYBOOKS.md`
- the answer needs ready-to-run troubleshooting SQL:
  `09_SQL_QUERY_COOKBOOK.md`

## Fast routing table

| Question type | Query first | Why |
| --- | --- | --- |
| Which databases are in the broker configuration? | `V$DG_BROKER_CONFIG` | Configuration members, roles, enablement, status |
| What is the value of a broker property? | `V$DG_BROKER_PROPERTY` | Documented broker properties by scope and role |
| What happened in the last switchover or failover? | `V$DG_BROKER_ROLE_CHANGE` | Recent broker role-change history |
| What metadata tags exist in the broker config? | `V$DG_BROKER_TAG` | User-defined tags for configuration or members |
| Is FSFO enabled and how is it configured? | `V$FAST_START_FAILOVER_CONFIG` | FSFO mode, thresholds, lag limit, target |
| Which observers are running and connected? | `V$FS_FAILOVER_OBSERVERS` | Observer registration, master observer, connectivity |
| Why did the last FSFO occur? | `V$FS_FAILOVER_STATS` | Last FSFO time and reason |
| Is lag preventing FSFO? | `V$FS_LAG_HISTOGRAM` | Apply and transport lag distribution for FSFO decisions |
| Are observer ping failures transient or prolonged? | `V$FS_OBSERVER_HISTOGRAM` | Observer-to-primary ping-failure histogram |
| What did the broker status check report? | `V$DG_BROKER_STATUS` or `GV$DG_BROKER_STATUS`, if documented in the target release | Broker health/status report when that view family is exposed in the target release |

## View catalog

## `V$DG_BROKER_CONFIG`

### Use this view when
- the user asks which databases are in the broker configuration
- the user asks about primary, standby, far sync, or member enablement
- the user wants high-level broker status for each member

### Key columns
- `DATABASE`
- `CONNECT_IDENTIFIER`
- `DATAGUARD_ROLE`
- `REDO_SOURCE`
- `ENABLED`
- `STATUS`
- `SEVERITY`
- `STATUS_MESSAGE`
- `VERSION`

### Notes
- This is the best broker entry view for high-level configuration inspection.
- It is not the best source for detailed transport or apply metrics.
- In 26ai, current Oracle Database Reference documentation also lists
  `SWITCHOVER_READY`, `FAILOVER_READY`, `CURRENT_STATE`, and
  `TRANSPORT_MODE`.

## `V$DG_BROKER_PROPERTY`

### Use this view when
- the user asks for a broker property value
- the user asks which properties apply to a configuration, member, or instance
- the answer needs property scope, property type, or valid role

### Key columns
- `MEMBER`
- `DATAGUARD_ROLE`
- `PROPERTY`
- `PROPERTY_TYPE`
- `VALUE`
- `VALUE_TYPE`

### Notes
- This is the primary source for documented broker properties.
- Configuration-level, member-level, and instance-level properties all appear
  here.
- Current Oracle Database Reference documentation shows this view starting in
  21c.
- Current 26ai Oracle Database Reference documentation also lists `INSTANCE`,
  `SCOPE`, and `VALID_ROLE`.

## `V$DG_BROKER_ROLE_CHANGE`

### Use this view when
- the user asks about recent switchovers, failovers, or FSFO events
- the user wants to know when a role change started and ended
- the user wants the recorded reason for a fast-start failover

### Key columns
- `EVENT`
- `STANDBY_TYPE`
- `OLD_PRIMARY`
- `NEW_PRIMARY`
- `FS_FAILOVER_REASON`
- `BEGIN_TIME`
- `END_TIME`

### Notes
- The view exposes up to ten recent broker-managed role changes.
- Use it for broker history and timing, not for current member health.
- Current Oracle Database Reference documentation shows this view starting in
  26ai.

## `V$DG_BROKER_TAG`

### Use this view when
- the user asks about broker tags or metadata labels
- the user wants configuration-level tags or member-level tags

### Key columns
- `MEMBER`
- `NAME`
- `VALUE`

### Notes
- `MEMBER IS NULL` indicates a configuration-level tag.
- Tags are metadata only; they do not change broker behavior.
- Current Oracle Database Reference documentation shows this view starting in
  26ai RU 23.26.1.

## `V$FAST_START_FAILOVER_CONFIG`

### Use this view when
- the user asks whether FSFO is enabled
- the user asks for FSFO mode, threshold, lag limit, or current target
- the user asks about auto-reinstate, observer override, or shutdown-primary
  behavior

### Key columns
- `FAST_START_FAILOVER_MODE`
- `STATUS`
- `CURRENT_TARGET`
- `THRESHOLD`
- `OBSERVER_PRESENT`
- `OBSERVER_HOST`
- `PING_INTERVAL`
- `PING_RETRY`
- `LAG_LIMIT`
- `AUTO_REINSTATE`
- `OBSERVER_OVERRIDE`
- `SHUTDOWN_PRIMARY`

### Notes
- Current Oracle Database Reference documentation shows this view starting in
  26ai.
- In 26ai and later, prefer this view over legacy `V$DATABASE`
  `FS_FAILOVER_*` columns.
- It provides configuration state, not per-observer runtime detail.

## `V$FS_FAILOVER_OBSERVERS`

### Use this view when
- the user asks which observers are running
- the user wants to know which observer is the master observer
- the user asks whether the observer is connected to the primary or target

### Key columns
- `NAME`
- `REGISTERED`
- `HOST`
- `ISMASTER`
- `TIME_SELECTED`
- `PINGING_PRIMARY`
- `PINGING_TARGET`

### Notes
- Query this view on the primary database for reliable behavior.
- A non-empty `NAME` indicates a started observer slot.
- Current 21c Oracle Database Reference documentation also lists `LOG_FILE`
  and `STATE_FILE`.
- Current 26ai Oracle Database Reference documentation also lists
  `LAST_PING_PRIMARY`, `LAST_PING_TARGET`, and `CURRENT_TIME`.

## `V$FS_FAILOVER_STATS`

### Use this view when
- the user asks when the last FSFO happened
- the user asks why the last FSFO occurred
- the user asks whether FSFO has happened recently

### Key columns
- `LAST_FAILOVER_TIME`
- `LAST_FAILOVER_REASON`

### Notes
- This view describes only the most recent FSFO event.
- The data is not historical across restarts.
- Current Oracle Database upgrade documentation marks this view as deprecated
  in 26ai and recommends `V$DG_BROKER_ROLE_CHANGE` instead.

## `V$FS_LAG_HISTOGRAM`

### Use this view when
- the user asks whether lag is preventing FSFO
- the user asks how to choose `FastStartFailoverLagLimit`
- the user wants the distribution of apply or transport lag observed by the
  primary

### Key columns
- `THREAD#`
- `LAG_TYPE`
- `LAG_TIME`
- `LAG_COUNT`
- `LAG_UPDATE_TIME`

### Notes
- This histogram is useful for choosing an FSFO lag limit that tolerates normal
  transient lag but rejects sustained outliers.
- Use it for distribution, not for point-in-time lag.
- Current Oracle Database Reference documentation shows this view starting in
  26ai.

## `V$FS_OBSERVER_HISTOGRAM`

### Use this view when
- the user asks how stable observer connectivity is
- the user asks how to choose `FastStartFailoverThreshold`
- the user wants to know how long observer ping failures last

### Key columns
- `OBSERVER_NAME`
- `OBSERVER_HOST`
- `WAIT_TIME`
- `WAIT_COUNT`
- `LAST_UPDATE_TIME`

### Notes
- This view is about observer-to-primary ping failures, not redo transport lag.
- Use it when connectivity instability is suspected.

## `V$DG_BROKER_STATUS` and `GV$DG_BROKER_STATUS`

### Use this view when
- the user asks what the broker status report found
- the user asks for the latest broker warning, failure, or success message
- the answer should aggregate broker health across instances

### Notes
- Use these views only if they are documented and exposed in the target
  database release.
- During review of current public Oracle Database Reference pages, a stable
  current reference page for these view definitions was not confirmed, so this
  resource intentionally does not hard-code a key-column list here.
- If the views exist in the target release, inspect them directly with
  `DESC V$DG_BROKER_STATUS` or by querying the data dictionary on that release
  before depending on column names in automation.

## Practical routing rules
- Configuration/member inventory: `V$DG_BROKER_CONFIG`
- Property values and thresholds: `V$DG_BROKER_PROPERTY`
- Recent broker-managed role transitions: `V$DG_BROKER_ROLE_CHANGE`
- FSFO configuration: `V$FAST_START_FAILOVER_CONFIG`
- Observer runtime status: `V$FS_FAILOVER_OBSERVERS`
- Last FSFO event: `V$FS_FAILOVER_STATS`
- Lag distribution for FSFO policy: `V$FS_LAG_HISTOGRAM`
- Observer connectivity histogram: `V$FS_OBSERVER_HISTOGRAM`
- Latest broker health report: `V$DG_BROKER_STATUS` / `GV$DG_BROKER_STATUS`
