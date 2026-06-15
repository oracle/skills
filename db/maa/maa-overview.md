# Oracle Maximum Availability Architecture (MAA)

## Overview

Oracle Maximum Availability Architecture (MAA) is Oracle's best-practice framework for designing, deploying, operating, and validating highly available Oracle Database environments. Use this guide when a user asks about MAA reference architectures, availability tiers, Data Guard, RAC, Exadata, backup and recovery, patching, rolling maintenance, Oracle Update Advisor, Edition-Based Redefinition, Zero Data Loss Recovery Appliance, or mission-critical availability.

MAA guidance should be source-aware. Prefer current Oracle documentation and Oracle MAA publications over memory, and call out when an answer depends on restricted support notes, product release, deployment model, or service type.

---

## Workflow

1. Classify the request by topic: reference architecture, Data Guard, RAC/Clusterware, Exadata, backup/recovery/RMAN, patching, upgrade, Oracle Update Advisor, continuous availability, Edition-Based Redefinition, ZDLRA, security/STIG, Exachk, or MAA review.
2. Use `maa-knowledge-sources.md` to identify the best source class and starting links.
3. Prefer current Oracle sources over memory:
   - Use P1 MAA documentation for general architecture and best-practice questions.
   - Use P2 product documentation for component-specific technical details.
   - Use Oracle MAA white papers and blogs for applied scenarios, current announcements, and explanatory context.
   - Use MOS notes for restricted, version-specific, diagnostic, certification, critical issue, or support-procedure details.
   - Use Exachk catalogs for best-practice check interpretation.
4. State assumptions about database release, deployment model, platform, and service type when they affect the recommendation.
5. When sources conflict, prefer the most specific and current authoritative Oracle source. Name the conflict and explain which source was followed.
6. Cite links, document titles, or MOS Doc IDs whenever possible. Do not imply access to restricted support content unless the content was actually retrieved.

---

## Common MAA Source Selection

| User asks about | Start with |
|---|---|
| MAA tiers, reference architectures, availability design | `maa-knowledge-sources.md` P1 MAA documentation |
| Data Guard configuration, redo transport, switchover, failover | `db/architecture/dataguard.md`, then Data Guard Broker and Concepts documentation |
| RAC, Clusterware, ASM, Exadata architecture | P2 RAC, Clusterware, ASM, and Exadata documentation |
| Patch planning, standby-first patching, Oracle Update Advisor | Database Patch Maintenance Guidelines, Oracle Update Advisor REST API, and relevant MOS notes |
| Backup, recovery, RMAN, ZDLRA | Backup and Recovery docs, ZDLRA docs, and ZDLRA MOS notes |
| Continuous availability and application failover | Application Continuity, FAN, application checklist, and validation MOS notes |
| Online application upgrades | Edition-Based Redefinition resources and `db/devops/schema-migrations.md` |
| Exachk findings | Exachk catalog and Exadata Exachk MOS note |

---

## Answering Guidance

- Separate durable MAA principles from release-specific or support-policy details.
- Ask for missing version/platform details only when a wrong assumption would materially change the recommendation.
- For restricted sources, provide the relevant MOS Doc ID and summarize only if the content is available in the current context.
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
