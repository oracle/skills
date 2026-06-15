# MAA Knowledge Sources

This catalog identifies primary Oracle MAA knowledge sources for source selection and weighting. It is a curated navigation aid, not a replacement for retrieving the current source content.

---

## Retrieval Principles

- Public Oracle Database and OCI Database Service documentation can answer many MAA questions, but verify current guidance from Oracle sources for user-facing recommendations.
- Public sources can answer many MAA questions, but restricted support sources are required for some support, diagnostic, certification, critical issue, or version-specific inquiries.
- For restricted sources, cite the MOS Doc ID and retrieve the document through approved tools before summarizing details.
- Treat Oracle MAA blogs as current announcements, applied examples, and explanatory context. Prefer documentation, MAA white papers, or MOS notes for definitive procedural, supportability, and version-specific guidance.

---

## P1 Public MAA Documentation

- High Availability Overview and Best Practices: https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/index.html
- Oracle MAA Reference Architectures: https://docs.oracle.com/en/database/oracle/oracle-database/26/haiad/index.html

## P2 Public Product Documentation

1. Data Guard Broker: https://docs.oracle.com/en/database/oracle/oracle-database/26/dgbkr/index.html
2. Data Guard Concepts and Administration: https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/index.html
3. Backup and Recovery IAD: https://docs.oracle.com/en/database/oracle/oracle-database/26/bkupr/index.html
4. Database Backup and Recovery User's Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/bradv/index.html
5. Database Backup and Recovery Reference: https://docs.oracle.com/en/database/oracle/oracle-database/26/rcmrf/index.html
6. Database Patch Maintenance Guidelines: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/index.html
7. Oracle Database Recommended Patch Maintenance for Databases Deployed with Oracle Data Guard: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbpdg/index.html
8. Oracle Database Recommended Patch Maintenance for Oracle Real Application Clusters: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbprc/index.html
9. Oracle Database Upgrade Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/upgrd/index.html
10. Real Application Clusters Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/racad/index.html
11. Oracle Real Application Clusters 26ai Technical Architecture: https://docs.oracle.com/en/database/oracle/oracle-database/26/adrac/index.html
12. Clusterware Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/cwadd/index.html
13. Fleet Patching and Provisioning Administrator's Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/fppad/index.html
14. Automatic Storage Management Administrator's Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/ostmg/index.html
15. Oracle Globally Distributed Database Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/shard/index.html
16. Security Guide for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmsq/index.html
17. Maintenance Guide for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmmn/index.html
18. System Overview for Exadata Database Machine: https://docs.oracle.com/en/engineered-systems/exadata-database-machine/dbmso/index.html
19. Zero Data Loss Recovery Appliance Protected Database Configuration Guide: https://docs.oracle.com/en/engineered-systems/zero-data-loss-recovery-appliance/23.1/ampdb/index.html
20. Zero Data Loss Recovery Appliance Administrator's Guide: https://docs.oracle.com/en/engineered-systems/zero-data-loss-recovery-appliance/23.1/amagd/index.html
21. Oracle Autonomous Health Framework User's Guide: https://docs.oracle.com/en/engineered-systems/health-diagnostics/autonomous-health-framework/ahfug/index.html

---

## Public APIs And Tools

- Oracle Database Patch Maintenance Guidelines, Oracle Update Advisor section: https://docs.oracle.com/en/database/oracle/oracle-database/26/dbptc/#GUID-7C39B9BE-8988-41C1-8C3D-C10F5AFB3DE1
- Oracle Update Advisor REST API: https://docs.oracle.com/en/database/oracle/oracle-database/26/dgoui/#GUID-251DAB7C-80FD-40ED-84D0-459695FC7B0D
  Use this public REST API documentation when helping users create CLI tools, custom clients, or agents that integrate directly with Oracle Update Advisor.

---

## Public MAA White Papers

Index: https://www.oracle.com/database/technologies/high-availability/oracle-database-maa-best-practices.html

- Technical Brief Paper: Oracle Maximum Availability Architecture Overview: https://www.oracle.com/a/tech/docs/maa-overview-technical-brief.pdf
- Oracle MAA data sheet, updated Feb 2026: https://www.oracle.com/a/tech/docs/maa-data-sheet.pdf
- Oracle Exadata Database Machine: Maximum Availability Architecture: https://www.oracle.com/docs/tech/exadata-maa.pdf
- Exadata Maximum Security Architecture: https://www.oracle.com/a/tech/docs/exadata-maximum-security-architecture.pdf
- MAA Platinum: https://docs.oracle.com/en/database/oracle/oracle-database/26/haiad/maara_platinum.html
- Exadata KVM Overview: https://www.oracle.com/docs/tech/exadata-kvm-overview.pdf
- MAA Consolidation: https://www.oracle.com/docs/tech/database/maa-consolidation.pdf
- ADG vs. Storage Mirroring: https://www.oracle.com/docs/tech/adg-vs-storage-mirroring-v1.pdf
- Continuous Availability: https://www.oracle.com/a/ocom/docs/database/continuous-availabiliity.pdf
- Application Continuity for Oracle Database 23ai: https://www.oracle.com/a/otn/docs/application-continuity-oracle-database-23ai.pdf
- Fast Application Notification: https://www.oracle.com/a/ocom/docs/database/fast-application-notification.pdf
- Application Checklist for Continuous Availability for MAA: https://www.oracle.com/a/tech/docs/application-checklist-for-continuous-availability-for-maa.pdf
- Application Continuity Checklist for ADB-S: https://www.oracle.com/a/tech/docs/application-continuity-checklist-for-adb-s.pdf
- ZDM GoldenGate Performance: https://www.oracle.com/docs/tech/zdm-gg-performance.pdf
- OCI Managed/Co-managed Consolidation Deployment Strategies: https://www.oracle.com/a/otn/docs/database/oci-managed-comanaged-consolidation-deployment-strategies.pdf

---

## Edition-Based Redefinition Resources

- Edition-Based Redefinition overview: https://www.oracle.com/database/technologies/high-availability/ebr.html
- Edition-Based Redefinition documentation: https://docs.oracle.com/en/database/oracle/oracle-database/26/adfns/editions.html
- EBR Technical Deep Dive Overview: https://www.oracle.com/a/tech/docs/ebr-technical-deep-dive-overview.pdf
- EBR Overview Presentation: https://www.oracle.com/a/tech/docs/ebr-overview-presentation.pdf
- EBR FAQ: https://www.oracle.com/a/tech/docs/ebr-faq.pdf

---

## Oracle MAA Blogs

- MAA blog category index: https://blogs.oracle.com/maa/category/maa
- Raising the Standard for Mission-Critical Availability and Security in the Age of AI: https://blogs.oracle.com/database/raising-the-standard-for-mission-critical-availability-and-security-in-the-age-of-ai
- Analyst Perspectives on Oracle AI Database Mission-Critical Capabilities: https://blogs.oracle.com/database/analyst-perspectives-on-oracle-ai-database-mission-critical-capabilities
- Ascend to the Diamond Tier: Introducing the Next-Gen Oracle Maximum Availability Architecture (MAA): https://blogs.oracle.com/maa/ascend-to-the-diamond-tier-introducing-the-next-gen-oracle-maximum-availability-architecture-maa
- From Green Lights to Gold Tiers: MAA and Oracle Update Advisor: https://blogs.oracle.com/maa/from-green-lights-to-gold-tiers-maa-oracleupdateadvisor
- Accept the AI Challenge: Build Your Own Oracle Update Advisor Client or Agent: https://blogs.oracle.com/maa/accept-the-ai-challenge-build-your-own-oracle-update-advisor-client-or-agent
- ONNX on Active Data Guard: https://blogs.oracle.com/maa/onnx-on-active-data-guard
- OCI Full Stack DR Supports Oracle AI Database, Azure, AWS, and Google Cloud: https://blogs.oracle.com/maa/oci-full-stack-dr-supports-oracle-ai-databaseazure-aws-and-google-cloud
- DG 26ai Online Tablespace Encryption: https://blogs.oracle.com/maa/dg26ai-online-tablespace-encryption
- Higher Data Guard Redo Transport Throughput: https://blogs.oracle.com/maa/higher-data-guard-redo-transport-throughput
- Oracle RAC 26ai: Unlocking Resilient, Scalable, and AI-Driven Applications: https://blogs.oracle.com/maa/oracle-rac-26ai-unlocking-resilient-scalable-and-ai-driven-applications
- DR with Azure and OCI: https://blogs.oracle.com/maa/dr-azure-oci
- Introducing DG Redo Decrypt for Hybrid Cloud: https://blogs.oracle.com/maa/introducing-dg-redo-decrypt-for-hybrid-cloud
- Surviving Regional and DNS Failures in the Cloud: https://blogs.oracle.com/maa/surviving-regional-and-dns-failures-in-the-cloud
- Application and AI Scalability with Oracle Active Data Guard: https://blogs.oracle.com/maa/application-and-ai-scalability-with-oracle-active-data-guard
- Simplified Exadata Platform Migrations with Data Guard in Oracle Cloud: https://blogs.oracle.com/maa/simplified-exadata-platform-migrations-with-data-guard-in-oracle-cloud
- Faster Disaster Recovery Troubleshooting with Generative AI Log Summarization in OCI Full Stack DR: https://blogs.oracle.com/maa/faster-disaster-recovery-troubleshooting-generative-ai-log-summarization-in-oci-full-stack-dr
- Introducing the OCI Full Stack Disaster Recovery MCP Server: https://blogs.oracle.com/maa/introducing-the-oci-full-stack-disaster-recovery-mcp-server
- Announcing Oracle Update Advisor: https://blogs.oracle.com/maa/announcing-oracle-update-advisor
- Edition-Based Redefinition: A Solution for Zero-Downtime Application Upgrades: https://blogs.oracle.com/maa/edition-based-redefinition-a-solution-for-zero-downtime-application-upgrades

---

## Exachk

- Exachk best-practice check catalog.
- Oracle Exadata Database Machine Exachk (MOS Doc ID 1070954.1).

---

## MOS And Restricted Sources

Use MOS sources for restricted details, supportability, certification, critical issues, diagnostics, questionnaires, and implementation procedures. Retrieve the note before summarizing its content.

- Exadata Database Machine and Exadata Storage Server Supported Versions (Doc ID 888828.1)
- Exadata Critical Issues (Doc ID 1270094.1)
- Exadata Database Service Software Versions (Doc ID 2333222.1)
- Oracle Patch Assurance - Data Guard Standby-First Patch Apply (Doc ID 1265700.1)
- MAA Reviews: Requesting Assistance, Providing Diagnostic Collections and Completing the Questionnaire (Doc ID 2953810.1)
- Upgrading to 19c Oracle Database with Reduced Downtime Using DBMS_ROLLING on Exadata Database Service (ExaDB) (Doc ID 2832235.1)
- Validating Application Failover Readiness (Doc ID 2758734.1)
- Data Guard Impact on Oracle Multitenant Environments (Doc ID 2049127.1)
- Exadata System Software Certification and Error Correction (Doc ID 2075007.1)
- Exadata OL8 System Hardening for STIG Security Compliance (Doc ID 2934166.1)
- Oracle Exadata Database Machine DoD STIG and SCAP Guidelines (Doc ID 1526868.1)
- Responses to common Exadata security scan findings (Doc ID 1405320.1)
- Best Practices for Corruption Detection, Prevention, and Automatic Repair - in a Data Guard Configuration (Doc ID 1302539.1)
- Using PDB Relocation to Move a Single PDB to Another CDB Without Upgrade (Doc ID 2771737.1)
- Best Practices for Pluggable Database End User and Application Connection and Open on Database Startup (Doc ID 2833029.1)
- Oracle Exadata Database Machine Security FAQ (Doc ID 2751741.1)
- Oracle ACFS Snapshot Use Cases on Exadata (Doc ID 2761360.1)
- Exadata Auditing of Vulnerabilities Using Oracle Linux OVAL Definitions (Doc ID 2981997.1)
- Understanding ASM Capacity and Reservation of Free Space in Exadata (Doc ID 1551288.1)
- Oracle Exadata Database Machine Java Guidelines (Doc ID 2664950.1)
- Assessing and Tuning Network Performance for Data Guard and RMAN (Doc ID 2064368.1)
- Graceful Application Switchover in RAC with No Application Interruption (Doc ID 1593712.1)
- Troubleshooting Methodology (Doc ID 2408256.1): https://support.oracle.com/epmos/faces/DocumentDisplay?id=2408256.1
- Zero Data Loss Recovery Appliance SR Data Collection (Doc ID 2154189.1): https://support.oracle.com/epmos/faces/DocumentDisplay?id=2154189.1
- Zero Data Loss Recovery Appliance Supported Versions (Doc ID 1927416.1): https://support.oracle.com/epmos/faces/DocumentDisplay?id=1927416.1
- Zero Data Loss Recovery Appliance Critical Issues (Doc ID 1927928.1): https://support.oracle.com/epmos/faces/DocumentDisplay?id=1927928.1
- Cross Platform Database Migration using ZDLRA (Doc ID 2460552.1)
- HOWTO - Improve RMAN restore database performance by using Multi-Instance Database Restore KB119134
