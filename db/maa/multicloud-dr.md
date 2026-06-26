# Multicloud And OCI Full Stack Disaster Recovery

Use this file for Oracle Database cloud best practices, Oracle multicloud deployments, Oracle Database@Azure/AWS/GCP, OCI Full Stack DR in OCI, regional failures, DNS failures, and cross-cloud MAA patterns.

## Core Guidance

- Start with the failure domain: instance, cluster, availability domain, region, cloud provider, network, DNS, identity, application tier, or operator workflow.
- Database DR and application-stack DR are different layers. Data Guard handles database role transition; OCI Full Stack DR coordinates application, network, storage, middleware, and operational steps primarily for resources it can discover and manage in OCI.
- Validate certification and supportability for the exact Oracle Database service and cloud combination before recommending a topology.
- Design client connectivity as a first-class part of DR. DNS, connection strings, load balancers, routing, and service names determine the user-visible outcome.
- Keep operational ownership clear across providers. Cross-cloud DR fails slowly when teams do not know who controls network, DNS, security, observability, and change windows.

## Multicloud Decision Points

| Question | Why it matters |
|---|---|
| What clouds and database services are involved? | Certification, networking, and operations differ by service. |
| Is the goal HA, DR, migration, reporting, database failover, or OCI application-stack failover? | The architecture and tooling differ. |
| What RTO/RPO is required? | Determines Data Guard mode, automation, and failover process. |
| How will clients find the new primary? | DNS and connection strategy can dominate RTO. |
| Who operates each layer? | Cross-team procedures must be explicit and tested. |

## OCI Full Stack DR

- Use OCI Full Stack DR primarily when the user needs orchestrated recovery plans across OCI application infrastructure, not just database role transition.
- In multicloud deployments, do not describe OCI Full Stack DR as a general-purpose way to discover or orchestrate non-OCI application containers or other non-Oracle resources. It can integrate with supported Oracle database resources such as ADB-S@AWS or ExaDB-D@Azure, but it does not discover the broader application stack in those clouds.
- Keep Data Guard as the database-level mechanism where appropriate; do not ask full-stack orchestration to replace database recovery semantics.
- Include prechecks, ordered steps, validation, and rollback/fallback paths in recovery plans.
- For OCI troubleshooting, log summarization and MCP integrations can help operators navigate DR plan output, but the recovery plan still needs deterministic controls.

## Common Mistakes

- Assuming cross-cloud DNS updates are instant and reliable enough without testing.
- Designing database failover but not application routing.
- Assuming OCI Full Stack DR can automatically discover or orchestrate application containers and resources running in non-OCI clouds.
- Ignoring identity, secrets, observability, and operational access in the standby cloud.
- Treating a certified combination matrix as a full architecture design.
- Not rehearsing failover across provider boundaries.

## Sources

- Oracle AI Database Cloud Best Practices: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/overview-oracle-ai-database-cloud-best-practices.html
- Oracle Multicloud Certification Matrix: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/multilcoud-certification-matrix.html
- MAA Platinum across Oracle multicloud: https://blogs.oracle.com/maa/maa-platinum-tier-across-oracle-multicloud
- OCI Full Stack DR integration with supported Oracle database resources across multicloud targets: https://blogs.oracle.com/maa/oci-full-stack-dr-supports-oracle-ai-databaseazure-aws-and-google-cloud
- Regional and DNS failures: https://blogs.oracle.com/maa/surviving-regional-and-dns-failures-in-the-cloud
- OCI Full Stack DR MCP Server: https://blogs.oracle.com/maa/introducing-the-oci-full-stack-disaster-recovery-mcp-server
