# Oracle Maximum Availability Architecture (MAA)

## Overview

Use this file to answer Oracle Maximum Availability Architecture questions with practical MAA guidance, not by loading a large list of links. Start with the routing table, read only the topic file needed for the user's question, and open `source-index.md` only when citations, source verification, or a less common source is needed.

## Routing

| User asks about | Read |
|---|---|
| MAA principles, tier selection, RTO/RPO framing, Bronze/Silver/Gold/Platinum/Diamond | `maa-tiers.md` |
| Data Guard, Active Data Guard, role transitions, standby-first maintenance, redo transport, hybrid cloud DR | `data-guard-maa.md` |
| RAC, Exadata, engineered systems, local HA, consolidation, platform maintenance | `rac-exadata.md` |
| Services, client failover, continuous availability, connection strings, FAN, AC/TAC | `application-continuity.md` |
| Patching, maintenance, Oracle Update Advisor, building Oracle Update Advisor clients or agents | `patching-update-advisor.md` |
| Edition-Based Redefinition or zero-downtime application upgrades | `edition-based-redefinition.md` |
| Oracle multicloud, Oracle Database@Azure/AWS/GCP, OCI Full Stack DR in OCI, regional and DNS failures | `multicloud-dr.md` |
| Backup strategy, RMAN, restore validation, ZDLRA, corruption protection | `backup-recovery-zdlra.md` |
| Exact source links, citations, or less common public docs/blogs | `source-index.md` |

## Answering Rules

1. Answer from the topic guidance first. Do not make the source index the primary context.
2. State assumptions that materially affect the recommendation: Oracle Database release, deployment model, cloud/on-premises target, RAC/Data Guard/Exadata use, latency, RTO/RPO, and application failover needs.
3. Separate durable MAA principles from release-specific syntax or supportability.
4. Prefer current public Oracle documentation for release-specific behavior, API details, certification, command syntax, and procedural steps.
5. Use blogs for announcements, examples, and explanatory context; use documentation and white papers for architecture and procedure.
6. When the question overlaps existing Oracle Database skills, use MAA guidance for the availability architecture decision and rely on database-topic skills for low-level mechanics.
7. Cite source titles or links when making specific claims that users may need to verify.

## Common Response Shape

- Recommendation: direct answer and preferred MAA pattern.
- Rationale: why this pattern fits the RTO/RPO, topology, maintenance, or application requirement.
- Implementation considerations: key prerequisites, decisions, and risks.
- Sources to verify: concise list of the most relevant public Oracle docs or blogs.

## Oracle Version Notes (19c vs 26ai)

- Use Oracle Database 19c as the baseline for mixed-version estates unless the user explicitly targets a newer release.
- Use Oracle Database 26ai documentation as the preferred current documentation set for new guidance when a 26ai version is available.
- Call out newer features, APIs, or operational improvements that require 23ai/26ai or a specific cloud service level.
- When recommending MAA designs for 19c, verify that 26ai-only capabilities have a 19c-compatible alternative or clearly mark them as unavailable.
- Oracle Update Advisor and newer Data Guard/MAA automation flows may have 26ai-specific documentation or API coverage; verify current support before prescribing an automated workflow.
