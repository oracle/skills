# Oracle Maximum Availability Architecture (MAA)

## Overview

Oracle Maximum Availability Architecture (MAA) is Oracle's best-practice framework for designing, deploying, operating, and validating highly available Oracle Database environments. Use this guide when a user asks about MAA reference architectures, availability tiers, Data Guard, RAC, Exadata, backup and recovery, patching, rolling maintenance, Oracle Update Advisor, Edition-Based Redefinition, Zero Data Loss Recovery Appliance, multicloud, or mission-critical availability.

MAA guidance should be source-aware. Prefer current public Oracle documentation and Oracle MAA publications over memory, and call out when an answer depends on product release, deployment model, or service type.

---

## Workflow

1. Classify the request by topic: reference architecture, Data Guard, RAC/Clusterware, Exadata, backup/recovery/RMAN, patching, upgrade, Oracle Update Advisor, continuous availability, Edition-Based Redefinition, ZDLRA, multicloud, OCI Full Stack DR, security, health, operations, or MAA review.
2. Use `maa-knowledge-sources.md` when the question requires source selection, topic framing, source prioritization, summaries, or links to public MAA material.
3. Prefer current public Oracle sources over memory, especially for release-specific behavior, supportability, API details, syntax, certification, or operational procedures:
   - Use P1 MAA documentation for general architecture and best-practice questions.
   - Use P2 product documentation for component-specific technical details.
   - Use public API/tool documentation for Oracle Update Advisor or automation-oriented workflows.
   - Use Oracle MAA white papers for applied scenarios and best-practice narratives.
   - Use Oracle MAA blogs for announcements, examples, and current explanatory context.
4. State assumptions about database release, deployment model, platform, and service type when they affect the recommendation.
5. When sources conflict, prefer the most specific and current authoritative Oracle source. Name the conflict and explain which source was followed.
6. Cite links and document titles whenever possible.

---

## Common MAA Source Selection

| User asks about | Start with |
|---|---|
| MAA tiers, reference architectures, availability design | `maa-knowledge-sources.md` P1 MAA documentation |
| Data Guard configuration, redo transport, switchover, failover | `db/architecture/dataguard.md`, then Data Guard Broker and Concepts documentation |
| RAC, Clusterware, ASM, Exadata architecture | P2 RAC, Clusterware, ASM, and Exadata documentation |
| Oracle AI Database cloud or multicloud MAA | Oracle AI Database Cloud Best Practices, Oracle Multicloud Certification Matrix, and multicloud MAA blogs |
| Patch planning, standby-first patching, Oracle Update Advisor | Database Patch Maintenance Guidelines, Oracle Update Advisor REST API, and Oracle Update Advisor blogs |
| Backup, recovery, RMAN, ZDLRA | Backup and Recovery docs and ZDLRA docs |
| Continuous availability and application failover | Application Continuity, FAN, and application checklist resources |
| Online application upgrades | Edition-Based Redefinition resources and `db/devops/schema-migrations.md` |
| OCI Full Stack Disaster Recovery | OCI Full Stack DR blogs and Data Guard documentation as needed |
| Security, health, and operations | Exadata security docs, Exadata security architecture, and Autonomous Health Framework docs |

---

## Answering Guidance

- Separate durable MAA principles from release-specific or support-policy details.
- Ask for missing version/platform details only when a wrong assumption would materially change the recommendation.
- Answer from public Oracle material available in the catalog and cite the source links used.
- For operational runbooks, include verification and rollback considerations where appropriate.
- For agent or automation use cases, check whether a public API or machine-readable tool exists before proposing screen-driven workflows.

---

## Oracle Version Notes (19c vs 26ai)

- Use Oracle Database 19c as the baseline for mixed-version estates unless the user explicitly targets a newer release.
- Use Oracle Database 26ai documentation as the preferred current documentation set for new guidance when a 26ai version is available.
- Call out newer features, APIs, or operational improvements that require 23ai/26ai or a specific cloud service level.
- When recommending MAA designs for 19c, verify that 26ai-only capabilities have a 19c-compatible alternative or clearly mark them as unavailable.
- Oracle Update Advisor and newer Data Guard/MAA automation flows may have 26ai-specific documentation or API coverage; verify current support before prescribing an automated workflow.

---

## Sources

- `maa-knowledge-sources.md`
- [High Availability Overview and Best Practices](https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/index.html)
- [Oracle MAA Reference Architectures](https://docs.oracle.com/en/database/oracle/oracle-database/26/haiad/index.html)
- [Oracle Database Patch Maintenance Guidelines](https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/index.html)
- [Oracle Update Advisor REST API](https://docs.oracle.com/en/database/oracle/oracle-database/26/dgoui/#GUID-251DAB7C-80FD-40ED-84D0-459695FC7B0D)
