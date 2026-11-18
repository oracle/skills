# OCI NL2SQL Semantic Store Setup

## Overview

Use this workflow to set up one OCI NL2SQL Semantic Store when the customer already has an Autonomous Database and two active Database Tools connections:

- an **enrichment connection** with access to read approved schema metadata and sample data;
- a distinct, lower-privilege **query connection** for generated SQL.

The workflow validates customer-owned prerequisites, inventories existing IAM coverage, previews the required IAM changes, creates the Semantic Store, and verifies first enrichment. It does not provision the database, Database Tools connections, networks, secrets, an MCP server, a client application, or SQL execution.

Keep read-only validation automatic after the customer supplies its target details. Require explicit customer approval before every group, policy, or Semantic Store mutation.

## Required Customer Inputs

Request non-secret values only:

```text
OCI CLI profile name
Authentication mode: security token or existing API-key profile
Environment and OCI region
Target tenancy OCID
Target Semantic Store compartment OCID
Semantic Store endpoint: exact environment endpoint or public default

Autonomous Database OCID or display name
Enrichment Database Tools connection OCID or display name
Query Database Tools connection OCID or display name
Approved schema allow-list

Semantic Store display name
Description, enrichment schedule, and optional tags
```

Never request or store passwords, session tokens, private keys, wallet files, secret values, or OCI configuration contents. The customer must run OCI CLI commands from an environment that can access both its local OCI profile and OCI endpoints. If an automation environment cannot reach OCI, provide the exact non-secret read-only command for the customer to run locally rather than treating the failed execution as an authentication failure.

The OCI APIs cannot authoritatively infer the customer's approved schema allow-list. If an equivalent existing Semantic Store uses the same connections, present its schemas as a candidate; otherwise require the customer to select the allow-list.

## Setup Workflow

### 1. Validate the OCI target

Validate the selected OCI CLI authentication without reading profile configuration. For a security-token profile, use a read-only session validation. Then validate the destination directly:

1. Get the supplied compartment by OCID.
2. Verify that it is active and retrieve its parent tenancy OCID.
3. Get the parent tenancy and verify its display name.
4. Preserve the customer-supplied environment endpoint; do not substitute a development or production endpoint based on generic documentation.

Treat the endpoint, tenancy, compartment, and region as one mutation boundary. Do not infer the target from the CLI profile's default tenancy or from unscoped listings.

### 2. Validate database prerequisites

Read the selected Autonomous Database and both Database Tools connections. Confirm that:

- the database is available;
- both connections are active and distinct;
- both connections target the same approved database;
- the selected schema list is explicit;
- the Database Tools, database, and referenced-secret compartments are known for runtime policy scoping.

Connection metadata may not prove database-level grants or least privilege. Record those as customer-controlled assertions unless supported APIs contradict the selected configuration. Do not create database users, grants, connections, secrets, or network resources in this workflow.

If a prerequisite is missing, hand off to the Database Tools administrator and the [Database Tools IAM policy guidance](https://docs.oracle.com/en-us/iaas/database-tools/doc/required-iam-policies.html). The optional `DatabaseToolsConnectionAdministrators` policies enable Database Tools infrastructure administration; they are not Semantic Store runtime policies and are not required to create a Semantic Store when the connections already exist.

### 3. Discover IAM coverage

Use read-only IAM calls to map effective coverage separately for:

1. Semantic Store administrators.
2. Semantic Store users or generation callers.
3. The Semantic Store resource principal at runtime.

Reuse compatible, dedicated policies where they exist. Broad or shared policies can demonstrate effective coverage, but do not edit them or treat them as a safe mutation target. Resolve the tenancy home region before IAM writes. IAM groups are tenancy-scoped; the policy container may be the Semantic Store compartment or tenancy root, depending on the statement scope.

### 4. Preview IAM changes

If coverage is missing, present one clear preview before any mutation. Default names are `semantic-store-admin`, `semantic-store-users`, and an `nl2sql-` policy prefix. The preview must identify exact group and policy containers, region, statements, effects, and recovery.

#### Semantic Store administrator policy

```text
allow group <semantic-store-admin> to manage generative-ai-semantic-store in compartment id <semantic-store-compartment-ocid>
allow group <semantic-store-admin> to manage generative-ai-nl2sql in compartment id <semantic-store-compartment-ocid>
```

#### Semantic Store user or generation-caller policy

```text
allow group <semantic-store-users> to read generative-ai-semantic-store in compartment id <semantic-store-compartment-ocid>
allow group <semantic-store-users> to manage generative-ai-nl2sql in compartment id <semantic-store-compartment-ocid>
```

`manage generative-ai-nl2sql` is required for SQL generation. If a group should only view Semantic Stores and enrichment, omit that statement. Group membership is a separate customer IAM process; create no memberships unless the customer explicitly requests it.

#### Semantic Store runtime policy

Scope these statements to the verified resource locations. They authorize the Semantic Store resource principal, not individual people:

```text
allow any-user to use database-tools-family in compartment id <dbtools-compartment-ocid> where all {request.principal.type='generativeaisemanticstore'}
allow any-user to read database-family in compartment id <database-compartment-ocid> where all {request.principal.type='generativeaisemanticstore'}
allow any-user to read autonomous-database-family in compartment id <database-compartment-ocid> where all {request.principal.type='generativeaisemanticstore'}
allow any-user to read secret-family in compartment id <secrets-compartment-ocid> where all {request.principal.type='generativeaisemanticstore'}
allow any-user to use generative-ai-family in tenancy where all {request.principal.type='generativeaisemanticstore'}
```

Use `in compartment id <ocid>` when the policy scope is an OCID. Before an IAM mutation, use explicit CLI containers: the verified tenancy OCID for `oci iam group create` and the reviewed policy container OCID for `oci iam policy create`. Do not rely on a CLI profile's default tenancy. Treat a blank or timed-out write as indeterminate, read the exact resource to verify its state, and obtain new approval before retrying.

### 5. Create the Semantic Store

After the customer approves the exact creation request, create one Semantic Store using:

- the approved target compartment and endpoint;
- the separate enrichment and query connections;
- the explicit schema allow-list; and
- `ON_CREATE` enrichment unless the customer selects manual enrichment.

Before retrying a failed or indeterminate create request, perform a read-only lookup to avoid creating a duplicate. Do not update or delete an existing store without separate approval.

### 6. Verify first enrichment

For `ON_CREATE`, wait for the enrichment result and inspect detailed counters. A store in `ACTIVE` state or an enrichment job in `SUCCEEDED` state is not sufficient evidence by itself. Treat first enrichment as successful only when:

```text
discovered > 0
eligible > 0
updated > 0
failed = 0
```

If enrichment is partial or failed, stop the workflow and report the counters, job/request IDs, selected model configuration when visible, region, schema, and non-secret service-log evidence. Common causes include insufficient Semantic Store runtime IAM, Database Tools access or database grants, unsupported model/region availability, and regional subscription or entitlement gaps.

## Optional Generation-Only Check

After successful enrichment, optionally call `GenerateSqlFromNl` with one approved read-only business question. Confirm that generated SQL refers only to the approved schemas. SQL generation does not execute the query. Keep execution, MCP setup, client integration, and broader end-user authorization as separate follow-on work.

## Completion Criteria

Report setup complete only after all of the following are verified:

- required administrator, user, and resource-principal policy coverage is effective;
- the Semantic Store is active with the requested connections and schema scope;
- first enrichment has positive discovered, eligible, and updated counts and zero failed tables.

For a completed setup, report the store name, compartment, schema allow-list, enrichment schedule, and counters. Offer the optional generation-only check next.

## Common Mistakes

- Using the same broad connection for enrichment and generated queries instead of a distinct lower-privilege query connection.
- Assuming a successful lifecycle state means semantic metadata was written.
- Using the profile's default tenancy instead of the customer-supplied tenancy and compartment OCIDs.
- Creating duplicate policies rather than reusing compatible dedicated coverage.
- Giving human users the Semantic Store resource-principal runtime policies.
- Treating connection metadata as proof of database-level grants when the API cannot expose them.
- Moving to MCP or SQL execution before first enrichment succeeds.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/nl2sql.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/nl2sql-permissions.htm
- https://docs.oracle.com/en-us/iaas/database-tools/doc/required-iam-policies.html
- https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/clitoken.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/setup/config.html
