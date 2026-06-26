# MAA Source Index

Use this file only when exact public source links, citations, freshness checks, or less common source lookup is needed. For normal answers, load the focused topic files first and use their built-in MAA guidance.

This index identifies primary public Oracle Maximum Availability Architecture (MAA) sources for source selection, source weighting, and answer grounding. It keeps authoritative links and concise summaries so agents can choose the right source quickly without treating the full URL catalog as the main context.

## Retrieval Principles

- Prefer current Oracle public documentation over memory when the answer depends on release behavior, supported procedure, API details, certification, syntax, or operational steps.
- Use this file as a navigation and summarization layer, not as a replacement for retrieving the current source when exact details matter.
- Weight sources in this order for external-facing answers: public MAA documentation, product documentation, public API/tool documentation, white papers and technical briefs, Oracle MAA blogs.
- Use blogs for announcements, examples, and context. Use documentation for supportability and procedural detail.

## Topic Guide

### MAA Architecture And Tiers

Use the MAA overview and reference architecture docs when explaining Bronze, Silver, Gold, Platinum, and newer Diamond-tier concepts. Anchor the answer on the business requirement: local HA, disaster recovery, zero or near-zero downtime maintenance, data protection, multicloud resilience, or operational automation.

Primary sources:

- High Availability Overview and Best Practices: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/index.html
- Oracle MAA Reference Architectures: https://docs.oracle.com/en/database/oracle/oracle-database/26/haiad/index.html
- MAA Platinum Reference Architecture: https://docs.oracle.com/en/database/oracle/oracle-database/26/haiad/maa_platinum.html
- Technical Brief Paper: Oracle Maximum Availability Architecture Overview: https://www.oracle.com/a/tech/docs/maa-overview-technical-brief.pdf
- Oracle MAA data sheet, updated Feb 2026: https://www.oracle.com/a/tech/docs/maa-data-sheet.pdf
- Ascend to the Diamond Tier: Introducing the Next-Gen Oracle Maximum Availability Architecture (MAA): https://blogs.oracle.com/maa/ascend-to-the-diamond-tier-introducing-the-next-gen-oracle-maximum-availability-architecture-maa

### Oracle AI Database Cloud And Multicloud

Use these sources for Oracle AI Database cloud deployment best practices, certified multicloud combinations, and cross-cloud MAA architecture discussions. Focus on topology, client connectivity, DNS, Data Guard role transitions, service placement, security boundaries, and cloud-specific operational responsibilities. For multicloud, treat OCI Full Stack DR as integration for supported Oracle database resources rather than a general-purpose discovery/orchestration layer for non-OCI application resources.

Primary sources:

- Oracle AI Database Cloud Best Practices: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/overview-oracle-ai-database-cloud-best-practices.html
- Oracle Multicloud Certification Matrix: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/multilcoud-certification-matrix.html
- MAA Platinum Tier Across Oracle Multicloud: https://blogs.oracle.com/maa/maa-platinum-tier-across-oracle-multicloud
- OCI Full Stack DR Supports Oracle AI Database, Azure, AWS, and Google Cloud: https://blogs.oracle.com/maa/oci-full-stack-dr-supports-oracle-ai-databaseazure-aws-and-google-cloud
- DR with Azure and OCI: https://blogs.oracle.com/maa/dr-azure-oci
- Surviving Regional and DNS Failures in the Cloud: https://blogs.oracle.com/maa/surviving-regional-and-dns-failures-in-the-cloud

### Data Guard And Active Data Guard

Use Data Guard sources for disaster recovery, data protection, role transitions, redo transport, standby-first maintenance, hybrid cloud DR, and read-only/offload use cases. Ask for protection mode, database version, deployment model, distance, latency, redo rate, RTO/RPO, and client failover requirements.

Primary sources:

- Data Guard Concepts and Administration: https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/index.html
- Data Guard Broker: https://docs.oracle.com/en/database/oracle/oracle-database/26/dgbkr/index.html
- Oracle Database Recommended Patch Maintenance for Databases Deployed with Oracle Data Guard: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbpdg/index.html
- Application and AI Scalability with Oracle Active Data Guard: https://blogs.oracle.com/maa/application-and-ai-scalability-with-oracle-active-data-guard
- ONNX on Active Data Guard: https://blogs.oracle.com/maa/onnx-on-active-data-guard
- DG 26ai Online Tablespace Encryption: https://blogs.oracle.com/maa/dg26ai-online-tablespace-encryption
- Higher Data Guard Redo Transport Throughput: https://blogs.oracle.com/maa/higher-data-guard-redo-transport-throughput
- Introducing DG Redo Decrypt for Hybrid Cloud: https://blogs.oracle.com/maa/introducing-dg-redo-decrypt-for-hybrid-cloud
- Simplified Exadata Platform Migrations with Data Guard in Oracle Cloud: https://blogs.oracle.com/maa/simplified-exadata-platform-migrations-with-data-guard-in-oracle-cloud
- ADG vs. Storage Mirroring: https://www.oracle.com/docs/tech/adg-vs-storage-mirroring-v1.pdf

### RAC, Clusterware, Services, And Client Failover

Use RAC and Clusterware sources for local high availability, service placement, rolling maintenance, scale-out, and client failover readiness. For applications, emphasize services, HA-aware connection strings, FAN, Application Continuity, Transaction Guard, connection draining, and driver/pool behavior.

Primary sources:

- Real Application Clusters Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/racad/index.html
- Oracle Real Application Clusters 26ai Technical Architecture: https://docs.oracle.com/en/database/oracle/oracle-database/26/adrac/index.html
- Clusterware Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/cwadd/index.html
- Oracle Database Recommended Patch Maintenance for Oracle Real Application Clusters: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbprc/index.html
- Oracle RAC 26ai: Unlocking Resilient, Scalable, and AI-Driven Applications: https://blogs.oracle.com/maa/oracle-rac-26ai-unlocking-resilient-scalable-and-ai-driven-applications
- The High Availability Connection String Explained: https://blogs.oracle.com/maa/the-high-availability-connection-string-explained

### Application Continuity, FAN, And Continuous Availability

Use these sources when the question is about avoiding or masking application interruptions during planned maintenance, outages, failover, switchover, connection failures, or database service relocation. Explain which failures can be hidden from the application, which require retry logic, and which require application or driver changes.

Primary sources:

- Continuous Availability: https://www.oracle.com/a/ocom/docs/database/continuous-availabiliity.pdf
- Application Continuity for Oracle Database 23ai: https://www.oracle.com/a/otn/docs/application-continuity-oracle-database-23ai.pdf
- Fast Application Notification: https://www.oracle.com/a/ocom/docs/database/fast-application-notification.pdf
- Application Checklist for Continuous Availability for MAA: https://www.oracle.com/a/tech/docs/application-checklist-for-continuous-availability-for-maa.pdf
- Application Continuity Checklist for ADB-S: https://www.oracle.com/a/tech/docs/application-continuity-checklist-for-adb-s.pdf

### Patching, Maintenance, And Oracle Update Advisor

Use these sources for patch planning, recommended patching methods, rolling approaches, Data Guard standby-first patterns, RAC maintenance, and Oracle Update Advisor automation. Separate database patching, Grid Infrastructure patching, Exadata platform maintenance, and application deployment changes.

Primary sources:

- Database Patch Maintenance Guidelines: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/index.html
- Oracle Database Patch Maintenance Guidelines, Oracle Update Advisor section: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/#GUID-7C39B9BE-8988-41C1-8C3D-C10F5AFB3DE1
- Oracle Update Advisor REST API: https://docs.oracle.com/en/database/oracle/oracle-database/26/dgoui/#GUID-251DAB7C-80FD-40ED-84D0-459695FC7B0D
- From Green Lights to Gold Tiers: MAA and Oracle Update Advisor: https://blogs.oracle.com/maa/from-green-lights-to-gold-tiers-maa-oracleupdateadvisor
- Accept the AI Challenge: Build Your Own Oracle Update Advisor Client or Agent: https://blogs.oracle.com/maa/accept-the-ai-challenge-build-your-own-oracle-update-advisor-client-or-agent
- Announcing Oracle Update Advisor: https://blogs.oracle.com/maa/announcing-oracle-update-advisor

### Backup, Recovery, RMAN, And ZDLRA

Use these sources for backup strategy, recovery validation, restore performance, corruption protection, recovery objectives, and Zero Data Loss Recovery Appliance architecture. Keep the distinction clear: backups are required even when Data Guard is deployed, and Data Guard is not a substitute for backup and recovery planning.

Primary sources:

- Backup and Recovery IAD: https://docs.oracle.com/en/database/oracle/oracle-database/26/bkupr/index.html
- Database Backup and Recovery User's Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/bradv/index.html
- Database Backup and Recovery Reference: https://docs.oracle.com/en/database/oracle/oracle-database/26/rcmrf/index.html
- Zero Data Loss Recovery Appliance Protected Database Configuration Guide: https://docs.oracle.com/en/engineered-systems/zero-data-loss-recovery-appliance/23.1/ampdb/index.html
- Zero Data Loss Recovery Appliance Administrator's Guide: https://docs.oracle.com/en/engineered-systems/zero-data-loss-recovery-appliance/23.1/amagd/index.html

### Exadata And Engineered Systems

Use Exadata sources for engineered system architecture, Exadata-specific MAA patterns, maintenance, security, platform migration, consolidation, and KVM considerations. Clarify whether the user means Exadata Database Machine, Exadata Database Service, Exadata Cloud@Customer, or a multicloud Oracle Database@Cloud deployment.

Primary sources:

- Security Guide for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmsq/index.html
- Maintenance Guide for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmmn/index.html
- System Overview for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmso/index.html
- Oracle Exadata Database Machine: Maximum Availability Architecture: https://www.oracle.com/docs/tech/exadata-maa.pdf
- Exadata Maximum Security Architecture: https://www.oracle.com/a/tech/docs/exadata-maximum-security-architecture.pdf
- Exadata KVM Overview: https://www.oracle.com/docs/tech/exadata-kvm-overview.pdf
- MAA Consolidation: https://www.oracle.com/docs/tech/database/maa-consolidation.pdf
- OCI Managed/Co-managed Consolidation Deployment Strategies: https://www.oracle.com/a/otn/docs/database/oci-managed-comanaged-consolidation-deployment-strategies.pdf

### Edition-Based Redefinition

Use EBR sources for zero or near-zero downtime application upgrades involving database object changes. Explain editions, editioned objects, editioning views, crossedition triggers, phased rollout, and fallback planning at a high level; then point users to the documentation and technical papers for implementation details.

Primary sources:

- Edition-Based Redefinition overview: https://www.oracle.com/database/technologies/high-availability/ebr.html
- Edition-Based Redefinition documentation: https://docs.oracle.com/en/database/oracle/oracle-database/26/adfns/editions.html
- EBR Technical Deep Dive Overview: https://www.oracle.com/a/tech/docs/ebr-technical-deep-dive-overview.pdf
- EBR Overview Presentation: https://www.oracle.com/a/tech/docs/ebr-overview-presentation.pdf
- EBR FAQ: https://www.oracle.com/a/tech/docs/ebr-faq.pdf
- Edition-Based Redefinition: A Solution for Zero-Downtime Application Upgrades: https://blogs.oracle.com/maa/edition-based-redefinition-a-solution-for-zero-downtime-application-upgrades

### OCI Full Stack Disaster Recovery

Use these sources when the user asks about OCI full-stack disaster recovery, DR orchestration, generative AI log summarization, or MCP-based integrations. Distinguish OCI application-stack orchestration from database-level Data Guard configuration. In multicloud, OCI Full Stack DR can integrate with supported Oracle database resources, but do not imply it can discover or orchestrate non-OCI application containers and resources.

Primary sources:

- Faster Disaster Recovery Troubleshooting with Generative AI Log Summarization in OCI Full Stack DR: https://blogs.oracle.com/maa/faster-disaster-recovery-troubleshooting-generative-ai-log-summarization-in-oci-full-stack-dr
- Introducing the OCI Full Stack Disaster Recovery MCP Server: https://blogs.oracle.com/maa/introducing-the-oci-full-stack-disaster-recovery-mcp-server
- OCI Full Stack DR Supports Oracle AI Database, Azure, AWS, and Google Cloud: https://blogs.oracle.com/maa/oci-full-stack-dr-supports-oracle-ai-databaseazure-aws-and-google-cloud

### Security, Health, And Operations

Use these sources for security architecture, Exadata security, health diagnostics, and operational readiness. For vulnerability findings or support-specific diagnostics, answer only from the public sources in this external catalog.

Primary sources:

- Security Guide for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmsq/index.html
- Exadata Maximum Security Architecture: https://www.oracle.com/a/tech/docs/exadata-maximum-security-architecture.pdf
- Oracle Autonomous Health Framework User's Guide: https://docs.oracle.com/en/engineered-systems/health-diagnostics/autonomous-health-framework/ahfug/index.html

## Complete Public Source List

### P1 Public MAA Documentation

- High Availability Overview and Best Practices: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/index.html
  Summary: Start here for public MAA best practices, architecture context, HA/DR concepts, cloud best-practice entry points, and general decision framing.
- Oracle AI Database Cloud Best Practices: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/overview-oracle-ai-database-cloud-best-practices.html
  Summary: Use for cloud deployment best practices for Oracle AI Database, including availability, resilience, and operational considerations in cloud environments.
- Oracle Multicloud Certification Matrix: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/multilcoud-certification-matrix.html
  Summary: Use to verify certified Oracle Database multicloud combinations before recommending an architecture.
- Oracle MAA Reference Architectures: https://docs.oracle.com/en/database/oracle/oracle-database/26/haiad/index.html
  Summary: Use for MAA architecture patterns and tier-oriented guidance.
- MAA Platinum Reference Architecture: https://docs.oracle.com/en/database/oracle/oracle-database/26/haiad/maa_platinum.html
  Summary: Use for Platinum-tier MAA architecture guidance and near-zero downtime/continuous availability architecture discussions.

### P2 Public Product Documentation

1. Data Guard Broker: https://docs.oracle.com/en/database/oracle/oracle-database/26/dgbkr/index.html
   Summary: Use for broker-based Data Guard configuration, management, switchover/failover operations, and automation-adjacent Data Guard administration.
2. Data Guard Concepts and Administration: https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/index.html
   Summary: Use for Data Guard architecture, redo transport, apply, protection modes, role transitions, and standby database operations.
3. Backup and Recovery IAD: https://docs.oracle.com/en/database/oracle/oracle-database/26/bkupr/index.html
   Summary: Use for backup/recovery implementation and administration topics.
4. Database Backup and Recovery User's Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/bradv/index.html
   Summary: Use for RMAN and recovery planning, backup strategies, restore/recover procedures, and recovery validation.
5. Database Backup and Recovery Reference: https://docs.oracle.com/en/database/oracle/oracle-database/26/rcmrf/index.html
   Summary: Use for exact RMAN command and reference details.
6. Database Patch Maintenance Guidelines: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/index.html
   Summary: Use for database patch planning and Oracle patch maintenance guidance.
7. Oracle Database Recommended Patch Maintenance for Databases Deployed with Oracle Data Guard: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbpdg/index.html
   Summary: Use for Data Guard-aware patching approaches and standby-first maintenance planning.
8. Oracle Database Recommended Patch Maintenance for Oracle Real Application Clusters: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbprc/index.html
   Summary: Use for RAC patching and maintenance approaches.
9. Oracle Database Upgrade Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/upgrd/index.html
   Summary: Use for database upgrade planning and procedures.
10. Real Application Clusters Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/racad/index.html
    Summary: Use for RAC deployment, services, management, workload placement, and operational guidance.
11. Oracle Real Application Clusters 26ai Technical Architecture: https://docs.oracle.com/en/database/oracle/oracle-database/26/adrac/index.html
    Summary: Use for RAC architecture details and 26ai-specific RAC technical positioning.
12. Clusterware Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/cwadd/index.html
    Summary: Use for Oracle Clusterware administration and deployment.
13. Fleet Patching and Provisioning Administrator's Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/fppad/index.html
    Summary: Use for Fleet Patching and Provisioning operations.
14. Automatic Storage Management Administrator's Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/ostmg/index.html
    Summary: Use for ASM storage administration.
15. Oracle Globally Distributed Database Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/shard/index.html
    Summary: Use for globally distributed database topics and sharding-related HA/scale considerations.
16. Security Guide for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmsq/index.html
    Summary: Use for Exadata security configuration and operational security guidance.
17. Maintenance Guide for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmmn/index.html
    Summary: Use for Exadata maintenance tasks and platform operations.
18. System Overview for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmso/index.html
    Summary: Use for Exadata platform overview and component context.
19. Zero Data Loss Recovery Appliance Protected Database Configuration Guide: https://docs.oracle.com/en/engineered-systems/zero-data-loss-recovery-appliance/23.1/ampdb/index.html
    Summary: Use for protected database configuration with Zero Data Loss Recovery Appliance.
20. Zero Data Loss Recovery Appliance Administrator's Guide: https://docs.oracle.com/en/engineered-systems/zero-data-loss-recovery-appliance/23.1/amagd/index.html
    Summary: Use for ZDLRA administration and operations.
21. Oracle Autonomous Health Framework User's Guide: https://docs.oracle.com/en/engineered-systems/health-diagnostics/autonomous-health-framework/ahfug/index.html
    Summary: Use for AHF diagnostics, health checks, and operational troubleshooting support.

### Public APIs And Tools

- Oracle Database Patch Maintenance Guidelines, Oracle Update Advisor section: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/#GUID-7C39B9BE-8988-41C1-8C3D-C10F5AFB3DE1
  Summary: Use to orient users to Oracle Update Advisor in the patch maintenance flow.
- Oracle Update Advisor REST API: https://docs.oracle.com/en/database/oracle/oracle-database/26/dgoui/#GUID-251DAB7C-80FD-40ED-84D0-459695FC7B0D
  Summary: Use when helping users create CLI tools, custom clients, or agents that integrate directly with Oracle Update Advisor.

### Public MAA White Papers And Technical Resources

- Public MAA best-practices index: https://www.oracle.com/database/technologies/high-availability/oracle-database-maa-best-practices.html
  Summary: Use as the landing page for Oracle public MAA papers and best-practice resources.
- Technical Brief Paper: Oracle Maximum Availability Architecture Overview: https://www.oracle.com/a/tech/docs/maa-overview-technical-brief.pdf
  Summary: Use for a concise MAA overview suitable for executive or architecture-level explanations.
- Oracle MAA data sheet, updated Feb 2026: https://www.oracle.com/a/tech/docs/maa-data-sheet.pdf
  Summary: Use for compact positioning and summary-level MAA messaging.
- Oracle Exadata Database Machine: Maximum Availability Architecture: https://www.oracle.com/docs/tech/exadata-maa.pdf
  Summary: Use for Exadata-specific MAA architecture and best-practice discussions.
- Exadata Maximum Security Architecture: https://www.oracle.com/a/tech/docs/exadata-maximum-security-architecture.pdf
  Summary: Use for Exadata security architecture positioning and best practices.
- Exadata KVM Overview: https://www.oracle.com/docs/tech/exadata-kvm-overview.pdf
  Summary: Use for Exadata KVM architecture and operational context.
- MAA Consolidation: https://www.oracle.com/docs/tech/database/maa-consolidation.pdf
  Summary: Use for consolidation architecture and MAA considerations.
- ADG vs. Storage Mirroring: https://www.oracle.com/docs/tech/adg-vs-storage-mirroring-v1.pdf
  Summary: Use when comparing database-aware disaster recovery with storage-level replication.
- Continuous Availability: https://www.oracle.com/a/ocom/docs/database/continuous-availabiliity.pdf
  Summary: Use for application-level continuous availability patterns.
- Application Continuity for Oracle Database 23ai: https://www.oracle.com/a/otn/docs/application-continuity-oracle-database-23ai.pdf
  Summary: Use for Application Continuity concepts and deployment considerations.
- Fast Application Notification: https://www.oracle.com/a/ocom/docs/database/fast-application-notification.pdf
  Summary: Use for FAN behavior and application/client reaction to database service events.
- Application Checklist for Continuous Availability for MAA: https://www.oracle.com/a/tech/docs/application-checklist-for-continuous-availability-for-maa.pdf
  Summary: Use as an application-readiness checklist for continuous availability.
- Application Continuity Checklist for ADB-S: https://www.oracle.com/a/tech/docs/application-continuity-checklist-for-adb-s.pdf
  Summary: Use for Application Continuity readiness with Autonomous Database Serverless scenarios.
- ZDM GoldenGate Performance: https://www.oracle.com/docs/tech/zdm-gg-performance.pdf
  Summary: Use for Zero Downtime Migration and GoldenGate performance context.
- OCI Managed/Co-managed Consolidation Deployment Strategies: https://www.oracle.com/a/otn/docs/database/oci-managed-comanaged-consolidation-deployment-strategies.pdf
  Summary: Use for deployment strategy decisions involving OCI managed or co-managed database consolidation.

### Edition-Based Redefinition Resources

- Edition-Based Redefinition overview: https://www.oracle.com/database/technologies/high-availability/ebr.html
  Summary: Use for an external overview of EBR and zero-downtime application upgrade positioning.
- Edition-Based Redefinition documentation: https://docs.oracle.com/en/database/oracle/oracle-database/26/adfns/editions.html
  Summary: Use for implementation detail about editions and EBR features.
- EBR Technical Deep Dive Overview: https://www.oracle.com/a/tech/docs/ebr-technical-deep-dive-overview.pdf
  Summary: Use for detailed technical explanation of EBR patterns.
- EBR Overview Presentation: https://www.oracle.com/a/tech/docs/ebr-overview-presentation.pdf
  Summary: Use for presentation-oriented EBR overview material.
- EBR FAQ: https://www.oracle.com/a/tech/docs/ebr-faq.pdf
  Summary: Use for frequently asked EBR questions and concise clarifications.

### Oracle MAA Blogs

Use Oracle MAA blog posts for current announcements, applied examples, and explanatory context. Prefer product documentation, MAA white papers, or API docs for definitive procedural and supportability guidance.

- MAA blog category index: https://blogs.oracle.com/maa/category/maa
  Summary: Use to find current public MAA blog posts.
- Raising the Standard for Mission-Critical Availability and Security in the Age of AI: https://blogs.oracle.com/database/raising-the-standard-for-mission-critical-availability-and-security-in-the-age-of-ai
  Summary: Use for Oracle AI Database mission-critical availability and security positioning.
- Analyst Perspectives on Oracle AI Database Mission-Critical Capabilities: https://blogs.oracle.com/database/analyst-perspectives-on-oracle-ai-database-mission-critical-capabilities
  Summary: Use for analyst-view context on Oracle AI Database mission-critical capabilities.
- Ascend to the Diamond Tier: Introducing the Next-Gen Oracle Maximum Availability Architecture (MAA): https://blogs.oracle.com/maa/ascend-to-the-diamond-tier-introducing-the-next-gen-oracle-maximum-availability-architecture-maa
  Summary: Use for MAA Diamond-tier positioning and next-generation MAA concepts.
- MAA Platinum Tier Across Oracle Multicloud: https://blogs.oracle.com/maa/maa-platinum-tier-across-oracle-multicloud
  Summary: Use for Active Data Guard and MAA Platinum-tier context across Oracle multicloud deployments.
- From Green Lights to Gold Tiers: MAA and Oracle Update Advisor: https://blogs.oracle.com/maa/from-green-lights-to-gold-tiers-maa-oracleupdateadvisor
  Summary: Use for Oracle Update Advisor's role in operationalizing software health and MAA resilience.
- Accept the AI Challenge: Build Your Own Oracle Update Advisor Client or Agent: https://blogs.oracle.com/maa/accept-the-ai-challenge-build-your-own-oracle-update-advisor-client-or-agent
  Summary: Use for examples and motivation around clients or agents that use Oracle Update Advisor.
- ONNX on Active Data Guard: https://blogs.oracle.com/maa/onnx-on-active-data-guard
  Summary: Use for in-database AI inference on Active Data Guard and read-mostly AI workload context.
- OCI Full Stack DR Supports Oracle AI Database, Azure, AWS, and Google Cloud: https://blogs.oracle.com/maa/oci-full-stack-dr-supports-oracle-ai-databaseazure-aws-and-google-cloud
  Summary: Use for OCI Full Stack DR integration with supported Oracle AI Database resources across multicloud targets; do not treat it as broad non-OCI application-stack discovery.
- DG 26ai Online Tablespace Encryption: https://blogs.oracle.com/maa/dg26ai-online-tablespace-encryption
  Summary: Use for Data Guard 26ai online tablespace encryption context.
- Higher Data Guard Redo Transport Throughput: https://blogs.oracle.com/maa/higher-data-guard-redo-transport-throughput
  Summary: Use for redo transport throughput improvement context.
- Oracle RAC 26ai: Unlocking Resilient, Scalable, and AI-Driven Applications: https://blogs.oracle.com/maa/oracle-rac-26ai-unlocking-resilient-scalable-and-ai-driven-applications
  Summary: Use for RAC 26ai availability, scalability, and AI-driven application positioning.
- DR with Azure and OCI: https://blogs.oracle.com/maa/dr-azure-oci
  Summary: Use for Data Guard disaster recovery across Oracle Database@Azure and OCI.
- Introducing DG Redo Decrypt for Hybrid Cloud: https://blogs.oracle.com/maa/introducing-dg-redo-decrypt-for-hybrid-cloud
  Summary: Use for hybrid cloud Data Guard redo decryption context.
- Surviving Regional and DNS Failures in the Cloud: https://blogs.oracle.com/maa/surviving-regional-and-dns-failures-in-the-cloud
  Summary: Use for regional outage and DNS failure resilience patterns.
- Application and AI Scalability with Oracle Active Data Guard: https://blogs.oracle.com/maa/application-and-ai-scalability-with-oracle-active-data-guard
  Summary: Use for Active Data Guard application and AI workload scaling context.
- Simplified Exadata Platform Migrations with Data Guard in Oracle Cloud: https://blogs.oracle.com/maa/simplified-exadata-platform-migrations-with-data-guard-in-oracle-cloud
  Summary: Use for Exadata platform migration patterns using Data Guard.
- Faster Disaster Recovery Troubleshooting with Generative AI Log Summarization in OCI Full Stack DR: https://blogs.oracle.com/maa/faster-disaster-recovery-troubleshooting-generative-ai-log-summarization-in-oci-full-stack-dr
  Summary: Use for OCI Full Stack DR troubleshooting and generative AI log summarization context.
- Introducing the OCI Full Stack Disaster Recovery MCP Server: https://blogs.oracle.com/maa/introducing-the-oci-full-stack-disaster-recovery-mcp-server
  Summary: Use for MCP integration with OCI Full Stack Disaster Recovery.
- Announcing Oracle Update Advisor: https://blogs.oracle.com/maa/announcing-oracle-update-advisor
  Summary: Use for Oracle Update Advisor announcement and purpose.
- The High Availability Connection String Explained: https://blogs.oracle.com/maa/the-high-availability-connection-string-explained
  Summary: Use for practical explanation of high availability connection strings.
- Edition-Based Redefinition: A Solution for Zero-Downtime Application Upgrades: https://blogs.oracle.com/maa/edition-based-redefinition-a-solution-for-zero-downtime-application-upgrades
  Summary: Use for EBR as a zero-downtime application upgrade pattern.
