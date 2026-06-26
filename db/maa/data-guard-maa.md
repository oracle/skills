# Data Guard MAA Guidance

Use this file for the MAA layer of Data Guard and Active Data Guard decisions. For low-level Data Guard syntax and administration mechanics, lean on existing Oracle Database Data Guard skills or current product documentation.

## MAA Positioning

- Data Guard is the primary Oracle database-aware DR technology for physical standby, role transition, and redo-based recovery across sites or clouds.
- Active Data Guard adds read-only workload offload, reporting, backups from standby, and additional use cases while redo apply continues.
- Data Guard Broker should be the default management path for MAA-style operations because it centralizes configuration, validation, switchover, failover, and Fast-Start Failover.
- Use Data Guard for planned maintenance as well as disaster recovery: standby-first patching, switchover, validation, and fallback planning reduce outage risk.

## Key Architecture Decisions

| Decision | Guidance |
|---|---|
| Protection mode | Match RPO and latency. Maximum Performance favors distance and commit latency; Maximum Availability targets zero/near-zero data loss where SYNC latency is acceptable; Maximum Protection is specialized and can stop the primary if protection is unavailable. |
| Transport | Choose SYNC/ASYNC based on RPO, distance, latency, redo rate, and application commit sensitivity. Validate with workload, not only network theory. |
| Standby type | Physical standby is the default for broad compatibility and DR. Snapshot standby is for temporary testing. Logical approaches or GoldenGate solve different requirements. |
| Broker | Prefer Broker for operational consistency, validation, and role transitions. |
| FSFO | Use when automatic failover is required and the organization accepts the operational model. Deploy observers carefully and test failure conditions. |
| Client failover | Data Guard alone does not make applications transparent. Pair role transitions with services, connection strings, FAN, AC/TAC, and pool behavior. |

## Operational Best Practices

- Configure standby redo logs appropriately and validate real-time apply when low RPO matters.
- Enable and test Flashback Database where reinstatement after failover is part of the operational plan.
- Run regular switchovers, not just tabletop exercises.
- Monitor transport lag, apply lag, archive gaps, observer health, database role, protection level, and service placement.
- Size and test redo transport for peak redo generation, not only average redo rate.
- Document decision criteria for switchover, failover, reinstate, and fallback. During an incident, ambiguity burns RTO.
- For hybrid or multicloud deployments, validate network latency, routing, security controls, DNS behavior, and operational ownership across providers.

## Standby-First Maintenance Pattern

1. Validate the Data Guard configuration and application failover readiness.
2. Patch or upgrade the standby side first where supported.
3. Allow redo/apply to catch up and validate health.
4. Switchover to make the patched standby primary.
5. Patch the former primary.
6. Optionally switch back after validation, or keep the new role if that is the operational standard.

## Common Mistakes

- Failing over manually without checking for redo gaps and data loss implications.
- Having Data Guard configured but not application services and connection strings.
- Letting the standby lag silently grow until RTO/RPO assumptions are false.
- Using storage replication as if it provided the same database-aware protection as Data Guard.
- Not testing reinstate after failover.

## Sources

- Data Guard Concepts and Administration: https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/index.html
- Data Guard Broker: https://docs.oracle.com/en/database/oracle/oracle-database/26/dgbkr/index.html
- Data Guard patch maintenance: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbpdg/index.html
- Active Data Guard scaling context: https://blogs.oracle.com/maa/application-and-ai-scalability-with-oracle-active-data-guard
- Redo transport throughput context: https://blogs.oracle.com/maa/higher-data-guard-redo-transport-throughput
- ADG vs. storage mirroring: https://www.oracle.com/docs/tech/adg-vs-storage-mirroring-v1.pdf
