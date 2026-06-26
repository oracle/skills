# Patching, Maintenance, And Oracle Update Advisor

Use this file for MAA patching strategy, maintenance planning, Oracle Update Advisor, and agent/client integration with the Oracle Update Advisor REST API.

## MAA Maintenance Principles

- Treat patching as an availability workflow, not a one-time command.
- Separate database home patching, Grid Infrastructure patching, Exadata platform maintenance, application changes, and client failover readiness.
- Prefer rolling and standby-first approaches where supported and appropriate.
- Validate the target state before changing roles or moving workload.
- Use automation and repeatable runbooks for patch analysis, prechecks, execution, validation, and fallback.
- Keep patch recommendations current; patching guidance is release- and environment-sensitive.

## Choosing A Patching Pattern

| Environment | Common MAA pattern |
|---|---|
| Single-instance, no standby | Plan outage or use migration/upgrade techniques; backups and restore validation become critical. |
| RAC | Use rolling maintenance where supported; drain services and validate client failover. |
| Data Guard | Patch standby first where supported, validate, switchover, then patch former primary. |
| Exadata | Separate database, GI, and platform maintenance. Follow Exadata-specific maintenance guidance. |
| Multicloud | Account for provider networking, DNS, service routing, and cross-cloud operational ownership. |

## Oracle Update Advisor

Use Oracle Update Advisor when the user needs current patch/maintenance recommendations, software health assessment, or a programmatic path to patch planning.

- For human workflow: explain what Oracle Update Advisor evaluates and how it helps move from manual patch research to guided maintenance decisions.
- For automation: point to the public REST API and recommend building clients that retrieve recommendations, surface required actions, and integrate with runbooks or agents.
- For agents: keep the agent in an advisory/planning lane unless the user explicitly authorizes changes. Agents should collect environment metadata, call the API, summarize recommendations, and ask before taking operational action.

## Agent/CLI Client Considerations

- Authenticate using the approved mechanism for the target environment.
- Treat API responses as advisory input; do not patch automatically without policy checks and human approval.
- Preserve the original recommendation payload for auditability.
- Include database release, patch level, deployment type, Data Guard/RAC status, and Exadata/cloud context in the workflow.
- Render recommendations by urgency, dependency, downtime impact, and MAA tier impact.

## Common Mistakes

- Patching primary first in a Data Guard configuration when standby-first maintenance would reduce risk.
- Ignoring application connection draining and pool behavior during rolling maintenance.
- Treating patching, upgrade, and platform maintenance as the same workflow.
- Using old patch assumptions without checking current Oracle Update Advisor or documentation.

## Sources

- Database Patch Maintenance Guidelines: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/index.html
- Oracle Update Advisor section: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/#GUID-7C39B9BE-8988-41C1-8C3D-C10F5AFB3DE1
- Oracle Update Advisor REST API: https://docs.oracle.com/en/database/oracle/oracle-database/26/dgoui/#GUID-251DAB7C-80FD-40ED-84D0-459695FC7B0D
- Data Guard patch maintenance: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbpdg/index.html
- RAC patch maintenance: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbprc/index.html
- Build an Oracle Update Advisor client or agent: https://blogs.oracle.com/maa/accept-the-ai-challenge-build-your-own-oracle-update-advisor-client-or-agent
