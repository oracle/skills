# Oracle Deep Data Security

## Overview

Oracle Deep Data Security (Deep Sec) is the Oracle AI Database 26ai framework for database-enforced, application-level authorization. Use it when an enterprise application, analytics tool, MCP server, or AI agent must access only the rows, columns, and cells authorized for the requesting end user.

Deep Sec authorizes an end user through a security context containing identity, data roles, and context attributes. It uses declarative SQL data grants rather than application-side filtering. The database applies the authorization to every SQL operation in that context, including operations issued by an agent.

Deep Sec is not a replacement name for Virtual Private Database (VPD). VPD uses `DBMS_RLS` policy functions that generate predicates for database users. Deep Sec uses end users, data roles, end-user security contexts, and `CREATE DATA GRANT` statements. Do not mix the two models in a design or migration plan without stating the difference.

## Version and Availability Gate

Confirm that the target is Oracle AI Database 26ai and that Deep Sec is available in the selected deployment before proposing SQL or driver code. Do not present this guide as compatible with Oracle Database 19c.

Identify the required release-update capability before implementation:

- Base 26ai: end users, data roles, end-user security contexts, data grants, dynamic masking, authorization APIs, and mandatory data privileges.
- Release update 23.26.2: JDBC Deep Sec APIs and service-provider integration.
- Release update 23.26.3: application identity logon, cross-table data grants, local-end-user MFA, and OCI IAM database-token authentication.

Use the Oracle Deep Data Security Guide and the selected client-driver documentation as the authority for version-specific grammar and APIs.

## Choose the Access Model

Start by identifying the requester and connection path.

| Access pattern | Use when | Required identity boundary |
| --- | --- | --- |
| Direct database access | An end user connects with a SQL client and an IAM token or local end-user credentials. | Database validates the end user and establishes the context. |
| Application-mediated access | An application accesses data on a person's behalf. | Application identity and end-user identity are both validated. |
| MCP or agent-mediated access | An MCP server or AI agent executes SQL for a person or managed agent identity. | Do not give a broad service account data privileges; establish the end-user context for each operation. |

For application- or agent-mediated access, model the application as an application identity. Keep its database privileges limited to establishing an end-user security context and the connectivity required for that flow. Do not rely on the application's ordinary database user privileges for data authorization.

## Model Identities and Data Roles

Use these entities deliberately:

- **End user**: the person or agent subject being authorized; it does not own schemas or database objects.
- **Data role**: an authorization role used by data grants. Map it to an IAM role or grant it to a locally managed end user where supported.
- **Application identity**: the trusted application or MCP server identity that can establish an end-user context.
- **End-user context**: the per-operation or per-session security boundary holding the active end user, enabled data roles, and approved attributes.

Map external roles to database data roles rather than duplicating application authorization in connection-user grants. Use local end users and locally managed data roles only for the supported development, testing, or local-authentication scenarios.

## Define End-User Contexts

Define custom end-user context objects before the application sends application-specific attributes. Limit attributes to the values policies actually need, such as organization, territory, business unit, or customer identifier. Specify data types and validation in the context definition.

Use `ORA_END_USER_CONTEXT` to reference approved attributes in a data grant predicate. Treat supplied context values as security inputs:

1. Derive identity and role claims from a validated token or locally authenticated end user.
2. Allow only the trusted application identity to establish or change the context.
3. Use explicit attributes rather than parsing untrusted SQL or JSON in a predicate.
4. Test missing, malformed, and cross-tenant context values as deny cases.

Do not reuse a connection with a prior user's Deep Sec context. Follow the selected driver's documented lifecycle for attaching, clearing, and replacing the end-user context.

## Create Data Grants

Use a named data grant for each independently managed policy. Keep the grant name stable and descriptive so it can be inspected, replaced, reviewed, and audited.

Start with the smallest possible target:

```sql
CREATE DATA GRANT sales_rep_orders
  AS SELECT (order_id, customer_id, order_total)
  ON sales.orders
  WHERE territory_id = ORA_END_USER_CONTEXT.sales.sales_context.territory_id
  TO sales_rep_role;
```

Before creating a grant, verify:

1. The target is a supported local table or view and is not a remote object over a database link.
2. The grant owner has required access to all objects, SQL macros, and functions referenced by the predicate.
3. Every grantee is a Deep Sec end user or data role, not a conventional database user or role.
4. The CRUD operations, column list, predicate, and optional start/end times express the intended authorization.
5. The policy has a test case for authorized rows, unauthorized rows, unauthorized columns, and DML that would move a row outside its permitted scope.

Treat a missing predicate as access to all rows of the target. Use it only for a consciously broad policy.

## Use Advanced Authorization Deliberately

### Cross-Table Data Grants

Use a cross-table data grant when access to a child object's rows must derive from a granted privilege on related parent rows. Define the relationship and test both direct and inherited authorization. Confirm the administrator has the required authority for both target and parent object schemas.

Do not implement this relationship by duplicating parent predicates across every child table when a cross-table grant describes the intended policy.

### Dynamic Masking

Use a dynamic masking policy when an unauthorized value must be replaced rather than returned as `NULL`. Base the masking decision on cell authorization and runtime context. Test that filtering, joins, ordering, exports, and analytics do not reveal information through masked values or inference paths.

Dynamic masking is a Deep Sec behavior. Do not assume that a `DBMS_REDACT` example has the same authorization semantics.

### Authorization APIs and Privilege Elevation

Use documented authorization APIs when an application must check whether an end user can perform an action before issuing it. Use privilege elevation only from trusted application code, for a narrow operation, and for the shortest supported scope. Do not grant permanent elevated data roles to an end user as a substitute.

### Mandatory Data Privileges

Use mandatory data-privilege enforcement where a central administrator must ensure that object privileges cannot bypass Deep Sec policies. Document the affected applications and validate their required connection and administrative privileges after enabling it.

## Implement a Secure Agent or MCP Flow

Use this sequence for an agent that queries application data:

1. Authenticate the human or managed agent and the application or MCP server through the supported IAM or local-authentication flow.
2. Establish an end-user security context with the validated end user, mapped data roles, and only required context attributes.
3. Execute ordinary parameterized SQL through the driver while the Deep Sec context is active.
4. Let the database enforce data grants; do not add a second, conflicting application-side row filter as the source of truth.
5. Clear or replace the context before returning the connection to the pool.
6. Record application identity, end-user identity, and relevant audit data without logging tokens or raw sensitive values.

Do not make a language model, prompt, or MCP tool policy the sole authorization control. Treat them as callers; Deep Sec is the data-layer enforcement point.

## Validate and Troubleshoot

Test each policy as the relevant end user, not only as an administrator. Cover at least:

- expected rows and columns are accessible;
- unauthorized rows are absent;
- unauthorized columns or cells are masked as designed;
- `INSERT` and `UPDATE` cannot create or move values outside authorized scope;
- a user without the data role has no unintended access;
- context-attribute changes affect only the intended policies;
- pooled connections do not retain a previous end user's context.

When troubleshooting, inspect in this order:

1. end-user provisioning and active data-role mapping;
2. application identity and token validation;
3. active end-user context and attribute values;
4. data-grant target, grantee, privilege, column list, predicate, and effective time window;
5. mandatory privilege configuration and documented diagnostic tracing.

Never resolve an authorization failure by adding broad `SELECT ANY TABLE`, object grants to a service account, or a permanent bypass privilege. Identify the missing Deep Sec identity, role, context, or data grant instead.

## Decision Guide

| Requirement | Prefer |
| --- | --- |
| End-user row, column, or cell access for applications, analytics, or agents | Deep Sec data grants |
| Predicate-based filtering for traditional database users | VPD / `DBMS_RLS` |
| Static presentation-layer value hiding | Data Redaction, when its semantics fit |
| Persistent masking of non-production data | Data Safe or a governed masking process |
| Protection against unapproved SQL statements or connection paths | SQL Firewall, alongside—not instead of—data authorization |

## Sources

- Oracle Deep Data Security Guide: `https://docs.oracle.com/en/database/oracle/oracle-database/26/ddscg/`
- What Is Oracle Deep Data Security: `https://docs.oracle.com/en/database/oracle/oracle-database/26/ddscg/what-is-oracle-deep-data-security.html`
- End-User Security Context: `https://docs.oracle.com/en/database/oracle/oracle-database/26/ddscg/end-user-security-context.html`
- Create Data Grants: `https://docs.oracle.com/en/database/oracle/oracle-database/26/ddscg/create-data-grants.html`
- Access and Privilege Issues: `https://docs.oracle.com/en/database/oracle/oracle-database/26/ddscg/access-and-privilege-issues.html`
- Oracle AI Database 26ai New Features: `https://docs.oracle.com/en/database/oracle/oracle-database/26/nfcoa/all-nfg.html`
