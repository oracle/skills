# Oracle Simple Vector SDK Deployment Setup

Use this reference whenever the user asks to provision, create, prepare, or
set up a database deployment for Oracle Vector SDK / VecDB / oracle-vecdb.

## Setup source

Start with the Oracle Vector SDK Quick Start Guide:

https://docs.oracle.com/en/cloud/paas/autonomous-database/vcapi/quickstart.html

Complete the Quick Start's **Prepare an AI Database** step by following the
instructions provided there.

## Choose the database setup

Read the current Quick Start and the setup pages it links to. If the
documentation presents more than one database type or deployment option and
the user has not already specified one, ask the user which setup to use before
provisioning. Present the local container setup as the default preference, but
do not select it silently. List the documented options in the question and
mark local container setup as the default preference. Use the exact options and
prerequisites documented by the current Oracle sources.

Do not continue until the user has selected an option or explicitly confirmed
the default local-container setup.

Prompt the user for credentials, do not invent usernames or passwords.


## Workflow

1. Read the Oracle Vector SDK Quick Start Guide.
2. Complete the **Prepare an AI Database** step.
3. Complete every documented provisioning and connection prerequisite for the
   selected setup, including the database, schema/user, privileges, REST access,
   credentials, and console access where applicable.
4. Continue with the remaining Quick Start steps after the database and its
   documented connection path are ready.
5. Record the selected setup type and all resulting connection details.
6. Run read-only Oracle Vector SDK discovery before creating tables, loading
    models, or ingesting data.
7. Present the user with the completion report


Provisioning external or billable resources requires explicit authorization.
Never commit passwords or tokens.

## Completion report

Do not report provisioning as complete until all documented setup steps for the
selected database type have succeeded. Verify the new user with a read-only
VecDB discovery call, then report:

- Selected database setup/type.
- Database or deployment name and identifier, or the local container name.
- Database version and ORDS version, where applicable.
- Host, port, service/DSN, and REST base URL, where applicable.
- New database username.
- Authentication method and TLS status.
- Vector Database Console URL
- VecDB REST endpoint.
- Result of the read-only connectivity verification.

The Vector Database Console URL is:

`https://<host>/ords/sql-developer?nav=vector-db`

The console URL is different from the SDK/REST endpoint:

`https://<host>/ords/<schema>/_/db-api/stable/vecdb/`


## Next steps

After reporting the completion details, provide the relevant resources:

- Oracle Vector SDK Python repository: https://github.com/oracle/vecdb-python-sdk
- Sample applications: https://github.com/oracle-devrel/oracle-ai-developer-hub/tree/main/apps/vecdb
- Sample notebooks: https://github.com/oracle-devrel/oracle-ai-developer-hub/tree/main/notebooks/vecdb
- Sample solution prompts: https://github.com/oracle-devrel/oracle-ai-developer-hub/tree/main/apps/vecdb
  (see each sample application's `prompts/` directory).
