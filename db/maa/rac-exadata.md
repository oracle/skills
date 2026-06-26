# RAC, Exadata, And Engineered Systems

Use this file for MAA guidance involving Oracle RAC, Oracle Clusterware, Exadata Database Machine, Exadata Database Service, Exadata Cloud@Customer, consolidation, and platform maintenance.

## RAC MAA Role

- RAC provides local high availability and scale-out by allowing services to run across database instances in a cluster.
- RAC is not disaster recovery by itself. Pair RAC with Data Guard or another DR architecture when site, region, or cloud failure is in scope.
- Services are the operational abstraction. Place, drain, relocate, and fail over services intentionally.
- Use rolling maintenance where supported, but validate application behavior because local rolling database maintenance still depends on client failover and service draining.
- Use Clusterware to manage resources consistently; avoid hand-built failover logic around cluster-managed components.

## Exadata MAA Role

- Exadata is an engineered database platform with integrated compute, storage, networking, and database optimizations. MAA guidance should account for the whole platform, not only the database homes.
- Distinguish Exadata Database Machine, Exadata Database Service, Exadata Cloud@Customer, and Oracle Database@Cloud deployments. Operational responsibility and maintenance procedures differ.
- Exadata MAA commonly combines RAC for local HA, Data Guard/Active Data Guard for DR, RMAN/ZDLRA for recovery, and application continuity patterns for client experience.
- Consolidation requires workload isolation, service design, backup/recovery planning, patch coordination, and capacity headroom for failover.
- Platform maintenance needs explicit sequencing across database, Grid Infrastructure, storage/server software, and cloud-service operations.

## Design Checklist

- Define which failure domains are covered: instance, node, cell, rack, site, region, cloud provider.
- Use services for workload separation, planned draining, role-based routing, and client failover.
- Validate that interconnect, storage, SCAN/listeners, DNS, and client networks are redundant and monitored.
- Maintain capacity for degraded operations. HA architecture fails in practice when the surviving side cannot carry required workload.
- Align backup and DR strategy with consolidation density; one platform outage can affect many databases.
- For security, patching, and STIG-style hardening questions, verify current Exadata documentation before giving step-by-step commands.

## Common Mistakes

- Calling an Exadata RAC deployment "Platinum" without Data Guard, application continuity, and tested operational practices.
- Consolidating many critical databases without capacity reservation for failover or maintenance.
- Patching the database layer while ignoring Grid Infrastructure, Exadata software, client drivers, or application pools.
- Treating Exadata Cloud operations exactly like on-premises Exadata operations.
- Skipping application connection testing because the database cluster failover itself succeeded.

## Sources

- RAC Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/racad/index.html
- RAC technical architecture: https://docs.oracle.com/en/database/oracle/oracle-database/26/adrac/index.html
- Clusterware Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/cwadd/index.html
- RAC patch maintenance: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbprc/index.html
- Exadata Database Machine MAA: https://www.oracle.com/docs/tech/exadata-maa.pdf
- Exadata security architecture: https://www.oracle.com/a/tech/docs/exadata-maximum-security-architecture.pdf
- Exadata maintenance guide: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmmn/index.html
