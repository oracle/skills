# APEX Export Review

APEX exports can contain sensitive metadata: URLs, authorization schemes, build options, substitution strings, static files, credential references, REST endpoints, defaults, install scripts, and business logic. Review before commit, sharing, or import.

Use App Builder export or SQLcl APEX export workflows, but keep generic SQLcl syntax and CI/CD mechanics in the SQLcl DB skills.

If the user's entry point is a customer-specific APEX application export file, including `.sql` or `.apx`, load `references/monitoring/apex-performance-evidence.md` first. Ask once whether additional evidence exists for the same case, such as APEX Activity Log/Page Performance, APEX Debug, HAR/Network, AWR/ASH, SQL Monitor, ORDS logs, deployment logs, or another export. If the user declines or no more files are available, continue with the export review or runtime-risk review using the available evidence and state the limits.

Before starting a file-only export review, tell the user that the review is static and does not require database access. For customer exports, ask whether the result should stay chat-only or be saved to a user-confirmed external output path. Do not write customer-specific export findings under `apex/admin/<customer_name>` or anywhere else in the skill tree. If the review later needs live validation, stop before connecting and apply the APEX Admin Identity Gate or DB-skill handoff as appropriate.

## Review Checklist

- Application ID and alias are intentional for the target environment.
- Workspace and parsing schema mapping are explicit.
- Build options match the target environment.
- Substitution strings do not include real secrets or production-only endpoints unless intentionally deployed.
- Static files and supporting objects do not embed tokens, passwords, private URLs, or customer data.
- Authentication and authorization schemes are correct for the target environment.
- Web Credentials are referenced safely; secret values are not printed, committed, or copied into examples.
- REST Data Sources and remote server URLs are environment-aware.
- No real passwords, tokens, OAuth secrets, SMTP credentials, wallet passwords, web credential values, or secret-bearing URLs appear in exports, scripts, examples, logs, or chat output.

## DB Skill Usage

DB skill in use: `db/security/encryption.md`, `db/security/network-security.md`, or `db/security/privilege-management.md` for generic secret storage, TLS/network, and privilege implementation. The APEX deployment skill is being used for APEX export and credential-reference review.

After this handoff, use the selected DB security skill's required connection/user. Do not reuse the APEX admin connection for grants, network ACLs, encryption, masking, or database secret-store changes unless the DB skill explicitly accepts it.
