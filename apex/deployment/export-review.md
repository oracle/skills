# APEX Export Review

APEX exports can contain sensitive metadata: URLs, authorization schemes, build options, substitution strings, static files, credential references, REST endpoints, defaults, install scripts, and business logic. Review before commit, sharing, or import.

Use App Builder export or SQLcl APEX export workflows, but keep generic SQLcl syntax and CI/CD mechanics in the SQLcl DB skills.

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
