# MAA Principles And Tiers

Use this file for MAA tier selection, architecture positioning, and RTO/RPO framing. Keep the answer business-outcome driven: data loss tolerance, downtime tolerance, local HA, disaster recovery distance, maintenance windows, application failover behavior, and operational automation.

## Core Principles

- Design for both unplanned outages and planned maintenance. A design that survives failures but requires long patch outages is incomplete.
- Treat HA and DR as related but different goals. RAC and service relocation address local HA; Data Guard and backups address site/database recovery; application continuity addresses user-visible interruption.
- Eliminate single points of failure across compute, storage, network, database services, clients, DNS, identity, and operations.
- Test role transitions, failover, restore, and application reconnect behavior. Untested availability architecture is an assumption.
- Prefer automation for repeated operational paths: patch planning, switchover, failover orchestration, health checks, and validation.
- Evaluate a mission-critical database by demonstrated behavior under failures, maintenance, scale, and recovery, not by feature-list parity alone.
- Use database-aware replication for database recovery decisions. Storage mirroring may copy blocks, but Data Guard understands Oracle redo, recovery, corruption isolation, role transitions, and database consistency.
- Keep backups even when using Data Guard. Data Guard protects availability and disaster recovery posture; backups protect against logical corruption, user error, retention requirements, and recovery to prior points.

## Tier Guidance

| Tier | Best fit | Typical capabilities | Watch-outs |
|---|---|---|---|
| Bronze | Dev, test, and lower-criticality production | Single instance, backup/restore, Clusterware restart where appropriate, RMAN, Flashback, and recovery validation | Recovery commonly takes minutes to hours; site or corruption recovery depends on backups. |
| Silver | Production or departmental workloads | Bronze plus RAC or Data Guard, Application Continuity, and a tested backup/recovery design | Local HA can be seconds to minutes, but regional recovery and RPO depend on replication and backup design. |
| Gold | Business-critical workloads | Silver plus RAC, Active Data Guard with automatic failover, and application failover readiness | Target outcomes require healthy redo transport, role-based services, and rehearsed automation. |
| Platinum | Mission-critical workloads | Gold plus Oracle AI Database 26ai on Exadata, Active Data Guard, comprehensive data protection, Application Continuity, and at least one standby across an availability domain or region | Requires careful service design, driver/pool readiness, capacity, and tested operational runbooks. |
| Diamond | Highest resilience and automation posture for AI-era mission-critical systems | Builds on Platinum with stronger automation, multicloud/region awareness, operational intelligence, and agent/API integration | Use current Oracle guidance; treat blogs as positioning unless docs confirm implementation detail |

## Published Tier Objectives

Treat the following as reference-architecture objectives, not guarantees. Confirm the deployed topology, workload, client behavior, and operational automation before committing an SLA.

| Tier | Local HA RTO | Regional DR RTO | RPO |
|---|---|---|---|
| Bronze | Minutes to one hour | Hours to days | Less than 15 minutes |
| Silver | Seconds to minutes | Hours to days | Less than 15 minutes |
| Gold | Less than 60 seconds | Less than 5 minutes | Zero or near-zero |
| Platinum | Less than 10 seconds | Less than 30 seconds | Zero or near-zero |
| Diamond | Less than 3 seconds | Less than 3 seconds | Zero or near-zero |

## Decision Heuristics

- If the main risk is instance or node failure inside one site, start with RAC/service design and client failover.
- If the main risk is database, site, region, or cloud failure, include Data Guard/Active Data Guard and tested role transitions.
- If the main risk is patching downtime, consider RAC rolling maintenance, Data Guard standby-first patching, Oracle Update Advisor, and service draining.
- If application errors during failover matter, include FAN, connection string design, Transaction Guard, Application Continuity, or Transparent Application Continuity.
- If schema/application upgrades drive downtime, consider Edition-Based Redefinition rather than treating it as an infrastructure failover problem.
- If full application stacks must fail over, distinguish database DR from OCI Full Stack DR orchestration. Treat OCI Full Stack DR as primarily OCI application-stack orchestration; in multicloud, do not assume it can discover or manage non-OCI application containers and resources.

## Mission-Critical Platform Evaluation

- Treat database selection as a cross-functional risk decision involving application owners, operations, security, compliance, and business stakeholders.
- Require production evidence at comparable scale and service levels: measured RTO/RPO under load, multi-region behavior, mixed-workload performance, node and network failure handling, rolling maintenance, backup/restore, patching, and upgrade outcomes.
- Assess operational maturity beyond features: failure diagnostics, predictable recovery, vulnerability and patch management, global support, experienced operators, tooling integrations, and established runbooks.
- Include security, supply-chain, compliance, product-roadmap, ecosystem, portability, and exit risks in the evaluation.
- Prefer validated reference architectures such as Oracle MAA and engineered platforms such as Exadata when operational predictability is a primary requirement.
- Use emerging databases selectively where the failure impact is contained, objective evidence supports the workload, and a tested exit strategy exists.
- Consider a converged database when it can reduce data copies, integration paths, database sprawl, and governance complexity without compromising workload requirements.

## Common Mistakes

- Equating RAC with DR. RAC improves local availability; it does not replace a remote standby.
- Equating Data Guard with backup. Data Guard is not a substitute for retention and point-in-time recovery.
- Designing only the database and ignoring clients, services, DNS, connection pools, and retry behavior.
- Assuming maximum availability mode is always correct. SYNC transport depends on latency, distance, workload, and commit impact.
- Treating a blog announcement as procedural support detail without verifying current documentation.

## Sources

- High Availability Overview and Best Practices: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/index.html
- Oracle MAA Reference Architectures: https://docs.oracle.com/en/database/oracle/oracle-database/26/haiad/index.html
- MAA Overview Technical Brief: https://www.oracle.com/a/tech/docs/maa-overview-technical-brief.pdf
- MAA data sheet: https://www.oracle.com/a/tech/docs/maa-data-sheet.pdf
- Diamond tier context: https://blogs.oracle.com/maa/ascend-to-the-diamond-tier-introducing-the-next-gen-oracle-maximum-availability-architecture-maa
- MAA Platinum across Oracle multicloud: https://blogs.oracle.com/maa/maa-platinum-tier-across-oracle-multicloud
- Evaluating databases for mission-critical workloads: https://blogs.oracle.com/maa/evaluating-databases-for-mission-critical-workloads
- MAA on-premises, Exadata, and cloud overview: https://www.oracle.com/a/tech/docs/maa-onpremises-overview.pdf
