# MAA Principles And Tiers

Use this file for MAA tier selection, architecture positioning, and RTO/RPO framing. Keep the answer business-outcome driven: data loss tolerance, downtime tolerance, local HA, disaster recovery distance, maintenance windows, application failover behavior, and operational automation.

## Core Principles

- Design for both unplanned outages and planned maintenance. A design that survives failures but requires long patch outages is incomplete.
- Treat HA and DR as related but different goals. RAC and service relocation address local HA; Data Guard and backups address site/database recovery; application continuity addresses user-visible interruption.
- Eliminate single points of failure across compute, storage, network, database services, clients, DNS, identity, and operations.
- Test role transitions, failover, restore, and application reconnect behavior. Untested availability architecture is an assumption.
- Prefer automation for repeated operational paths: patch planning, switchover, failover orchestration, health checks, and validation.
- Use database-aware replication for database recovery decisions. Storage mirroring may copy blocks, but Data Guard understands Oracle redo, recovery, corruption isolation, role transitions, and database consistency.
- Keep backups even when using Data Guard. Data Guard protects availability and disaster recovery posture; backups protect against logical corruption, user error, retention requirements, and recovery to prior points.

## Tier Guidance

| Tier | Best fit | Typical capabilities | Watch-outs |
|---|---|---|---|
| Bronze | Single-instance or basic restart availability | Basic backup/recovery, restart, monitoring | Usually not enough for mission-critical RTO/RPO or rolling maintenance |
| Silver | Local HA with reduced downtime | RAC or equivalent local HA, services, rolling maintenance where applicable | Does not by itself provide remote DR |
| Gold | HA plus disaster recovery | Data Guard, role transitions, backup/recovery, application failover planning | Client failover and operational drills decide whether objectives are actually met |
| Platinum | Near-zero downtime and stronger continuous availability | RAC + Active Data Guard, Application Continuity/FAN, standby-first maintenance, automation | Requires careful service design, driver/pool readiness, and tested operational runbooks |
| Diamond | Highest resilience and automation posture for AI-era mission-critical systems | Builds on Platinum with stronger automation, multicloud/region awareness, operational intelligence, and agent/API integration | Use current Oracle guidance; treat blogs as positioning unless docs confirm implementation detail |

## Decision Heuristics

- If the main risk is instance or node failure inside one site, start with RAC/service design and client failover.
- If the main risk is database, site, region, or cloud failure, include Data Guard/Active Data Guard and tested role transitions.
- If the main risk is patching downtime, consider RAC rolling maintenance, Data Guard standby-first patching, Oracle Update Advisor, and service draining.
- If application errors during failover matter, include FAN, connection string design, Transaction Guard, Application Continuity, or Transparent Application Continuity.
- If schema/application upgrades drive downtime, consider Edition-Based Redefinition rather than treating it as an infrastructure failover problem.
- If full application stacks must fail over, distinguish database DR from OCI Full Stack DR orchestration. Treat OCI Full Stack DR as primarily OCI application-stack orchestration; in multicloud, do not assume it can discover or manage non-OCI application containers and resources.

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
