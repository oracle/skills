# APEX Post-Deploy Validation

Validate APEX-specific behavior after import.

## Validation Checklist

- Application exists in the expected workspace with the expected ID, alias, owner, and parsing schema.
- Build options and substitution strings match target environment policy.
- Authentication and authorization schemes work for Workspace Admin, Developer, End User, parsing schema, database-login user, ORDS/APEX runtime account, and DBA/admin account boundaries.
- REST Data Sources and Web Credentials resolve without exposing secret values.
- Critical pages compile and run with expected authorization and session-state protection.
- Supporting objects ran only when intended and did not perform surprise destructive work.
- APEX activity/debug/error logs are free of deployment-time secret leakage.

## Security Review

- Privileges remain least-privilege.
- No broad grants such as `DBA`, `SELECT ANY TABLE`, `EXECUTE ANY PROCEDURE`, `CREATE ANY TABLE`, `GRANT ANY ROLE`, or `GRANT ANY PRIVILEGE` were introduced for ordinary APEX deployment.
- APEX session state, hidden items, read-only items, and client-side checks are not treated as security boundaries.
- Any database auditing requirement is handled by the DB auditing skill.

DB skill in use: `db/security/auditing.md` for generic database audit policy and evidence handling. The APEX deployment skill is being used for APEX release traceability and post-import validation context.
