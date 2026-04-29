# ORDS Sessionless Transactions

## Overview

Sessionless transactions in Oracle REST Data Services (ORDS) let a client start a transaction on one database session, suspend it, and then resume and commit or roll it back from another request by using a global transaction identifier (`GTRID`). ORDS exposes database APIs to start, commit, and roll back the transaction, and then lets you carry the `GTRID` in `x-ords-sessionless-transaction-id` when calling REST-Enabled SQL, REST modules, or AutoREST services.

Use this feature when a multi-step workflow must keep a single transaction open across multiple HTTP requests without tying up the same database session for the entire duration. Keep in mind that sessionless transactions are subject to a timeout, so the workflow must complete or explicitly resume and finalize the transaction before it expires.

---

## Prerequisites and Version Support

- ORDS added documented sessionless transaction support in release **25.3**.
- Oracle Database support starts with **Oracle AI Database Release 26ai, version 23.6**.
- The control APIs require a client with the ORDS **SQL Administrator** or **SQL Developer** role.
- Sessionless transactions apply to **a single Oracle Database**. Do not use them to coordinate work across multiple resource managers.

Before using these examples, ensure the target pool is configured for ORDS Database API. In practice, that means `database.api.enabled=true` for the Database API endpoints and `restEnabledSql.active=true` for the current example flow. After changing pool settings, restart ORDS. Also use a REST-enabled schema alias and credentials authorized for the endpoint being called. See [ords-installation.md](./ords-installation.md) and [ords-authentication.md](./ords-authentication.md) for broader setup and authentication context.

---

## Configuring the Timeout

ORDS uses the `jdbc.sessionlesstxn.timeout` pool setting to control how long a suspended sessionless transaction may remain suspended.

```shell
ords config --db-pool <pool_name> set jdbc.sessionlesstxn.timeout <timeout_value>
```

Example:

```shell
ords config --db-pool default set jdbc.sessionlesstxn.timeout 5m
```

If you omit `--db-pool`, ORDS applies the setting to the `default` pool. If you do not set this value, ORDS uses a **60-second** timeout. If a suspended sessionless transaction is not resumed within the configured duration, Oracle Database cancels the transaction.

---

## Management APIs

ORDS exposes three database API endpoints for sessionless transaction control:

| Operation | Method | Endpoint |
|---|---|---|
| Start | `POST` | `/ords/<schema_alias>/_/db-api/stable/database/sessionless-transactions/` |
| Commit | `PUT` | `/ords/<schema_alias>/_/db-api/stable/database/sessionless-transactions/<GTRID>` |
| Roll back | `DELETE` | `/ords/<schema_alias>/_/db-api/stable/database/sessionless-transactions/<GTRID>` |

The `POST` call returns the `GTRID`, which must be reused on subsequent requests.

---

## Start a Transaction

Use the database API to start a new sessionless transaction:

```shell
curl -X POST --location "https://localhost:8080/ords/<schema_alias>/_/db-api/stable/database/sessionless-transactions/" \
    --user <username>:<password>
```

Response:

```json
{
  "gtrid": "25fd48199404437aa5faf33fe2b9fe0c",
  "status": "Start transaction"
}
```

Persist the returned `gtrid` for the rest of the workflow.

---

## Invoke Services Within the Same Transaction

To execute subsequent requests inside the same sessionless transaction, include the `GTRID` in either:

- the `x-ords-sessionless-transaction-id` request header
- the `x-ords-sessionless-transaction-id` query parameter

ORDS documents this for REST-Enabled SQL, REST modules, and AutoREST calls.

Examples:

```http
POST /ords/<schema_alias>/_/sql?x-ords-sessionless-transaction-id=<GTRID>

GET /ords/<schema_alias>/table?x-ords-sessionless-transaction-id=<GTRID>
```

Using the query parameter:

```shell
curl -X POST --location "https://localhost:8080/ords/admin/_/sql?x-ords-sessionless-transaction-id=25fd48199404437aa5faf33fe2b9fe0c" \
    --user <username>:<password> \
    -H "Content-Type: application/sql" \
    --data "SELECT * FROM my_table"
```

Using the header:

```shell
curl -X POST --location "https://localhost:8080/ords/admin/_/sql" \
    --user <username>:<password> \
    -H "Content-Type: application/sql" \
    -H "x-ords-sessionless-transaction-id: 25fd48199404437aa5faf33fe2b9fe0c" \
    --data "SELECT * FROM my_table"
```

As long as you keep sending the same `GTRID`, ORDS continues the work in the same sessionless transaction context.

---

## Commit or Roll Back the Transaction

Commit:

```shell
curl -X PUT --location "https://localhost:8080/ords/<schema_alias>/_/db-api/stable/database/sessionless-transactions/<GTRID>" \
     --user <username>:<password>
```

Roll back:

```shell
curl -X DELETE --location "https://localhost:8080/ords/<schema_alias>/_/db-api/stable/database/sessionless-transactions/<GTRID>" \
     --user <username>:<password>
```

---

## Transaction-Ending Behaviors

ORDS explicitly notes that some REST requests can end the sessionless transaction without calling the control APIs:

- A `COMMIT` statement ends the sessionless transaction.
- A `ROLLBACK` statement ends the sessionless transaction.
- DDL statements such as `CREATE`, `ALTER`, and `DROP` also end the sessionless transaction because they implicitly commit.

Avoid mixing explicit transaction-control SQL or DDL into a workflow unless ending the transaction is intentional.

---

## Operational Notes

Sessionless transactions break the usual coupling between the transaction and the session. After work is suspended, the session or connection can be released and used by another client while the transaction remains identified by its `GTRID`.

When choosing the timeout, Oracle documents these tradeoffs:

- very high timeout values can hold database resources, including locked rows, for longer
- very low timeout values can cancel the transaction as soon as it is suspended and released
- the default is `60` seconds

---

## Best Practices

- Set `jdbc.sessionlesstxn.timeout` explicitly for the pool instead of relying on the default when the workflow spans multiple HTTP calls.
- Treat the returned `GTRID` as required workflow state and pass it on every follow-up request.
- Keep the unit of work inside one Oracle Database only.
- Keep DDL and explicit `COMMIT` or `ROLLBACK` statements out of the service calls unless you intend to end the transaction.

---

## Common Mistakes

- Starting a sessionless transaction and then forgetting to send the `GTRID` on the next request.
- Letting the workflow sit longer than the configured timeout after the transaction is suspended.
- Attempting to use the feature on Oracle Database 19c or earlier releases that do not support sessionless transactions.
- Treating sessionless transactions as a multi-resource distributed transaction mechanism.

---

## Oracle Version Notes (19c vs 26ai)

- Oracle Database **19c** does not support sessionless transactions.
- ORDS introduced documented sessionless transaction support in **25.3**.
- The database prerequisite is **Oracle AI Database Release 26ai, version 23.6**.
- The same API pattern remains documented in the ORDS **25.4** and **26.1** developer guides.

## Sources

- [Changes in Release 25.3 Oracle REST Data Services Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.3/orddg/changes-release-25.3-oracle-rest-data-services-developers-guide.html)
- [Enabling ORDS Database API](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.4/orddg/enabling-ords-database-api.html)
- [Developing Oracle REST Data Services Applications (25.4)](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.4/orddg/developing-REST-applications.html)
- [Developing Oracle REST Data Services Applications (26.1)](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.1/orddg/developing-REST-applications.html)
- [Oracle Database JDBC Developer's Guide — Sessionless Transactions](https://docs.oracle.com/en/database/oracle/oracle-database/23/jjdbc/sessionless-transactions.html)
