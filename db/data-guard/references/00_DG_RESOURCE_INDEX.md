# Oracle Data Guard MCP Resource Index

## Purpose
Use this file as the entry point for all Data Guard resources shipped with the
SQLcl MCP server. The resource set is organized to support three common tasks:

- answering SQLcl `DG` command questions
- routing Data Guard Broker questions to the correct fixed view
- troubleshooting lag, transport, apply, and FSFO behavior

## Resource map

### 00. Entry point
- `00_DG_RESOURCE_INDEX.md`
  Start here when the question is broad or when the agent needs to choose the
  next DG resource.

### 01. SQLcl command surface
- `01_SQLCL_DG_COMMANDS.md`
  Use for SQLcl `DG` command syntax, supported `SHOW` commands, execution
  expectations, and when SQLcl is acting as a DGMGRL-style command entry point.

### 02. Broker fixed-view routing
- `02_BROKER_FIXED_VIEW_ROUTING.md`
  Use for broker configuration, properties, role-change history, FSFO status,
  observer state, and broker health/status questions.

### 03. Orientation and triage
- `03_OVERVIEW_AND_LAG_MODEL.md`
  Use first for general lag interpretation and deciding whether the issue is
  transport, apply, or role-transition related.

### 04. Transport troubleshooting
- `04_TRANSPORT_TROUBLESHOOTING.md`
  Use when transport lag is high or redo is not reaching the standby fast
  enough.

### 05. Deep ASYNC analysis
- `05_ASYNC_TRANSPORT_ADVANCED.md`
  Use when transport is ASYNC and the basic transport checklist is not enough.

### 06. SYNC or FASTSYNC performance
- `06_SYNC_TRANSPORT_PERFORMANCE.md`
  Use when the question is about commit latency, remote write cost, or standby
  redo log placement under SYNC or FASTSYNC.

### 07. Apply troubleshooting
- `07_APPLY_TROUBLESHOOTING.md`
  Use when transport is healthy enough but apply lag remains high.

### 08. Apply tuning
- `08_APPLY_TUNING_SIRA_MIRA.md`
  Use for SIRA or MIRA tuning decisions, wait interpretation, and buffer
  tuning.

### 09. Query cookbook
- `09_SQL_QUERY_COOKBOOK.md`
  Use when the answer should include runnable SQL for diagnosis.

### 10. Fast triage playbooks
- `10_DECISION_TREES_AND_PLAYBOOKS.md`
  Use for concise operational playbooks and short-form answer templates.

## Recommended retrieval paths

### SQLcl DG command questions
1. `01_SQLCL_DG_COMMANDS.md`
2. `02_BROKER_FIXED_VIEW_ROUTING.md` if the answer also needs broker view or
   metadata guidance

### Broker configuration, property, or FSFO questions
1. `02_BROKER_FIXED_VIEW_ROUTING.md`
2. `09_SQL_QUERY_COOKBOOK.md` if the answer should include runnable SQL

### Lag or performance troubleshooting
1. `03_OVERVIEW_AND_LAG_MODEL.md`
2. `04_TRANSPORT_TROUBLESHOOTING.md` for transport lag
3. `05_ASYNC_TRANSPORT_ADVANCED.md` for deep ASYNC investigation
4. `06_SYNC_TRANSPORT_PERFORMANCE.md` for SYNC or FASTSYNC
5. `07_APPLY_TROUBLESHOOTING.md` for apply lag
6. `08_APPLY_TUNING_SIRA_MIRA.md` for tuning follow-through
7. `09_SQL_QUERY_COOKBOOK.md` for runnable SQL
8. `10_DECISION_TREES_AND_PLAYBOOKS.md` for compact next-step guidance

## Authoring guidance for agents
- Prefer the smallest relevant resource instead of loading the entire set.
- Use `02_BROKER_FIXED_VIEW_ROUTING.md` for broker metadata questions before
  defaulting to general lag playbooks.
- Use `09_SQL_QUERY_COOKBOOK.md` only when a query helps answer the user's
  request directly.
- Treat example timestamps in the cookbook and troubleshooting guides as
  placeholders to be replaced with the real incident window.

## Source
- The troubleshooting pack is derived from `MAA Best Practice for Data Guard`.
- The command and broker fixed-view resources are curated specifically for the
  SQLcl MCP server.
