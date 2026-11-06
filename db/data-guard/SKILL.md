---
name: oracle-data-guard
description: Provide operational guidance for Oracle Data Guard and SQLcl DG. Use when a user asks about SQLcl DG commands, Data Guard Broker fixed views, FSFO or observer state, transport or apply lag, ASYNC/SYNC/FASTSYNC performance, redo apply tuning, SIRA/MIRA, or runnable Data Guard diagnostic SQL.
---

# Oracle Data Guard

Use the bundled references as the source of truth for SQLcl MCP Data Guard guidance. Read only the smallest relevant reference. Do not claim to have inspected a live database, Broker configuration, or observer unless the user provides output or a connected tool returns it.

## Route the request

| Request | Read |
| --- | --- |
| Broad Data Guard question or uncertain topic | `references/00_DG_RESOURCE_INDEX.md` |
| SQLcl `DG` syntax or supported `SHOW` commands | `references/01_SQLCL_DG_COMMANDS.md` |
| Broker configuration/properties, role changes, FSFO, observer, or broker health | `references/02_BROKER_FIXED_VIEW_ROUTING.md` |
| General lag interpretation or transport-vs-apply triage | `references/03_OVERVIEW_AND_LAG_MODEL.md` |
| Redo transport lag | `references/04_TRANSPORT_TROUBLESHOOTING.md` |
| Deep ASYNC transport analysis or `krsb` statistics | `references/05_ASYNC_TRANSPORT_ADVANCED.md` |
| SYNC/FASTSYNC commit latency or remote write cost | `references/06_SYNC_TRANSPORT_PERFORMANCE.md` |
| Apply lag or recovery throughput | `references/07_APPLY_TROUBLESHOOTING.md` |
| SIRA/MIRA choice, recovery waits, or tuning | `references/08_APPLY_TUNING_SIRA_MIRA.md` |
| Runnable diagnostic SQL | `references/09_SQL_QUERY_COOKBOOK.md` |
| Concise triage flow or operational playbook | `references/10_DECISION_TREES_AND_PLAYBOOKS.md` |

## Response workflow

1. Identify the topology and concern: Broker versus SQLcl, transport versus apply, and ASYNC versus SYNC/FASTSYNC where relevant.
2. Read the selected reference. Read `09_SQL_QUERY_COOKBOOK.md` only when executable SQL directly helps.
3. State the evidence needed, provide safe diagnostic steps, and distinguish facts from hypotheses.
4. Treat example timestamps as placeholders; ask for the actual incident window when it affects a query.
5. When both transport and apply lag are zero, frame guidance as a health check, baseline, configuration review, or commit-latency investigation rather than a lag incident.

## Safety

Prefer observation before change. Clearly label commands that change database settings, enable tracing, or alter recovery configuration, and include the corresponding rollback/disable step when the reference provides one.
