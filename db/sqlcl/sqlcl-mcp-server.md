# SQLcl MCP Server

## Overview

The SQLcl MCP Server is a built-in capability of Oracle SQLcl (**25.2 or later**) that exposes Oracle Database functionality to AI assistants via the **Model Context Protocol (MCP)**. SQLcl acts as the MCP server — it holds the database connection and handles authentication, while AI clients (Claude Desktop, Claude Code, VS Code with Cline, etc.) drive the interaction through well-defined MCP tool calls.

Communication uses **`stdio` only**. The AI client spawns SQLcl as a child process and communicates via stdin/stdout. There is no HTTP, SSE, or network port.

---

## Prerequisites

- **SQLcl 25.2 or later** (MCP was not present in 24.3 or earlier) — download: https://download.oracle.com/otn_software/java/sqldeveloper/sqlcl-latest.zip
- **JRE 17 or 21**

Verify your version:

```shell
sql -V
# SQLcl: Release 25.2.0 Production or newer required
```

Upgrade on macOS:

```shell
brew upgrade sqlcl
```

Upgrade on Windows (PowerShell):

```powershell
winget upgrade Oracle.SQLcl
```

Manual install from zip (macOS/Linux):

```shell
curl -O https://download.oracle.com/otn_software/java/sqldeveloper/sqlcl-latest.zip
unzip sqlcl-latest.zip -d ~/sqlcl
export PATH="$HOME/sqlcl/sqlcl/bin:$PATH"
```

Find the absolute path to `sql` (needed for MCP config):

```shell
# macOS / Linux
which sql

# Windows
where sql
```

---

## Step 1: Save Your Database Connection

The MCP server does **not** accept credentials on the command line. You must pre-save connections using SQLcl's connection store before starting the MCP server.

Connect and save with the `-save` and `-savepwd` flags:

```shell
sql /nolog
```

```sql
conn -save my_connection -savepwd username/password@//hostname:1521/service_name
```

- `-save <name>` — saves the connection under a name
- `-savepwd` — stores the password securely in `~/.dbtools`

The password **must** be saved with `-savepwd` for the MCP server to be able to use it. After saving, the AI client will reference this named connection via the `connect` MCP tool.

For TNS-based connections, set `TNS_ADMIN` so SQLcl can find `tnsnames.ora`:

```shell
sql /nolog
```

```sql
conn -save my_tns_connection -savepwd username/password@tns_alias
```

---

## Step 2: Start the MCP Server

Start SQLcl with the `-mcp` flag:

```shell
sql -mcp
```

SQLcl starts in MCP server mode, listening on stdin/stdout. The default restrict level when using `-mcp` is **4** (most restrictive — see Restrict Levels below).

You will see a startup confirmation:

```
---------- MCP SERVER STARTUP ----------
MCP Server started successfully on Fri Jun 13 13:52:13 WEST 2025
Press Ctrl+C to stop the server
----------------------------------------
```

To use a different restrict level:

```shell
sql -R 1 -mcp
```

---

## Step 3: Configure Your AI Client

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "sqlcl": {
      "command": "/path/to/sql",
      "args": ["-mcp"]
    }
  }
}
```

For TNS connections, pass `TNS_ADMIN` so the spawned process can find `tnsnames.ora` (MCP client processes do not inherit shell environment variables):

```json
{
  "mcpServers": {
    "sqlcl": {
      "command": "/path/to/sql",
      "args": ["-mcp"],
      "env": {
        "TNS_ADMIN": "/path/to/tns/directory"
      }
    }
  }
}
```

Use the absolute path to `sql` — find it with:

```shell
which sql
```

Restart Claude Desktop after editing the config.

### Claude Code

Add the server using the `claude mcp add` command:

```shell
claude mcp add sqlcl /path/to/sql -- -mcp
```

Or manually create/edit `.mcp.json` in your project directory:

```json
{
  "mcpServers": {
    "sqlcl": {
      "command": "/path/to/sql",
      "args": ["-mcp"]
    }
  }
}
```

Verify the server is registered:

```shell
claude mcp list
```

### VS Code with Cline

Edit `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "sqlcl": {
      "command": "/path/to/sql",
      "args": ["-mcp"],
      "disabled": false
    }
  }
}
```

---

## MCP Tools

Five tools are exposed by the SQLcl MCP server. Oracle adds new tools in each SQLcl release.

| Tool | Description |
|------|-------------|
| `list-connections` | Discovers and lists all saved Oracle Database connections in `~/.dbtools` |
| `connect` | Establishes a connection to one of the saved named connections |
| `disconnect` | Terminates the current active Oracle Database connection |
| `run-sql` | Executes standard SQL queries and PL/SQL code blocks against the connected database |
| `run-sqlcl` | Executes SQLcl-specific commands and extensions, including: output formatting (`SET SQLFORMAT CSV/JSON`), data loading (`LOAD`), DDL generation (`DDL tablename`), Liquibase operations (`lb update`, `lb status`, `lb rollback`), and JavaScript automation (`script`) |

The AI client will first call `list-connections` to discover available connections, then `connect` to establish a session, then `run-sql` or `run-sqlcl` to interact with the database.

### Multiple Connections

You can save multiple named connections in `~/.dbtools` and switch between them within the same MCP session. Ask the AI to call `list-connections` to see all available connections, then `connect` with a different connection name to switch databases. Only one connection is active at a time — switching disconnects the previous one.

---

## Restrict Levels

The `-R` flag controls which SQLcl commands are available to the MCP server. When `-mcp` is used, the default is **level 4** (most restrictive).

| Level | What is blocked |
|-------|----------------|
| `0` | Nothing — all commands allowed |
| `1` | Host/OS commands (`host`, `!`, `$`, `edit`) |
| `2` | Level 1 + file-saving commands (`save`, `spool`, `store`) |
| `3` | Level 2 + script execution (`@`, `@@`, `get`, `start`) |
| `4` | Level 3 + 100+ additional commands — **default for `-mcp`** |

Example — allow slightly more than the default:

```shell
sql -R 3 -mcp
```

Example config with restrict level:

```json
{
  "mcpServers": {
    "sqlcl": {
      "command": "/path/to/sql",
      "args": ["-R", "1", "-mcp"]
    }
  }
}
```

---

## Common Use Cases

### Natural Language Queries

Ask the AI to query your database in plain English:

> "Show me the top 10 customers by revenue this quarter."
> "How many orders were placed yesterday, grouped by status?"
> "Find all employees in the SALES department earning above 80000."

The AI translates these into SQL via `run-sql` and returns formatted results.

### Schema Exploration

> "What tables are in the OE schema?"
> "Describe the structure of the ORDERS table including constraints."
> "What indexes exist on the CUSTOMERS table?"

Useful for onboarding to an unfamiliar database without writing any SQL manually.

### Report Generation

> "Export the monthly sales summary as CSV."
> "Generate an HTML report of open support tickets."

The AI can use `run-sqlcl` to spool output or format results using SQLcl's built-in report commands.

### Query Tuning and Debugging

> "Why is this query slow?" (paste query)
> "Show me the execution plan for this SQL."
> "Find the top 5 SQL statements by elapsed time from V\$SQL."

Combine with V$SQL tagging — AI-generated queries are marked with `/* LLM in use is [model] */` so you can identify them in AWR/ASH.

### Transaction Review Before Commit

The AI can stage changes and wait for explicit approval before committing:

> "Update all customer records in the Northeast region, but show me what will change before committing."
> "Delete orders older than 2 years — let me review the count first."

The AI will run a `SELECT` preview, present the results, then only execute the `UPDATE`/`DELETE` and `COMMIT` after confirmation.

### Multi-Environment Comparison

With multiple saved connections you can compare across environments in one session:

> "Compare the customer count between the dev and prod databases."
> "Show me which tables exist in prod but not in dev."

The AI switches between named connections via the `connect` tool and presents results side-by-side.

### Performance Monitoring and Optimization

> "Show me which queries are running slow today and give me optimization tips."
> "Find the top 5 SQL statements by elapsed time."
> "Check for missing indexes on the ORDERS table."

The AI queries `V$SQL`, `V$SESSION`, and related views, and can suggest query rewrites or index additions based on what it finds.

### Schema Changes and Migrations

With a less restrictive user and restrict level, the AI can assist with DDL:

> "Add a NOT NULL column STATUS to the ORDERS table with a default of 'OPEN'."
> "Create an index on ORDERS(CUSTOMER_ID, ORDER_DATE)."

Always review generated DDL before confirming execution.

### DDL Extraction

The `DDL` command (via `run-sqlcl`) generates clean, portable `CREATE` statements for any object:

> "Show me the DDL for the ORDERS table."
> "Extract the package spec and body for HR_UTILS."
> "Generate CREATE TABLE DDL for all tables starting with APP_."

Use `SET DDL STORAGE OFF` / `SET DDL SEGMENT_ATTRIBUTES OFF` first for environment-portable output.

### Data Loading

The `LOAD` command (via `run-sqlcl`) ingests CSV or JSON files directly into Oracle tables:

> "Load this CSV file into the STAGING_EMPLOYEES table."
> "Import the reference data file into COUNTRIES with TRUNCATE ON."

See `sqlcl-data-loading.md` for options like `DATEFORMAT`, `BATCHSIZE`, and `ERROR_LOG`.

### Formatted Output and Export

Use `SET SQLFORMAT` (via `run-sqlcl`) to control result format before querying:

> "Export the EMPLOYEES table as CSV."
> "Give me the top 10 orders as JSON for the API team."

Common formats: `CSV`, `JSON`, `JSON-FORMATTED`, `XML`, `INSERT`, `ANSICONSOLE`.

### Liquibase Operations

All `lb` commands are available via `run-sqlcl`:

> "Show me the pending Liquibase changesets."
> "Apply the changelog to the test database."
> "Roll back to tag v1.2.0."

```
lb status -changelog-file controller.xml
lb update -changelog-file controller.xml
lb rollback -tag v1.2.0 -changelog-file controller.xml
lb generate-schema -split
```

### JavaScript Automation

Complex multi-step automation can be run via `script` (through `run-sqlcl`):

> "Run the schema inventory script and write the output to /tmp/inventory.csv."
> "Execute the batch update script for PENDING orders."

JavaScript scripts have access to `util.executeReturnList`, file I/O via Java types, and full JDBC access. See `sqlcl-scripting.md`.

---

## Limitations

| Limitation | Detail |
|------------|--------|
| Transport | `stdio` only — no HTTP, SSE, or WebSocket support |
| Single active connection | Only one database connection is active at a time per MCP server instance |
| Result set size | Very large result sets may be truncated by the AI client's context window, not by SQLcl itself — use `WHERE`, `ROWNUM`, or `FETCH FIRST` to limit rows |
| No credential passing at runtime | Passwords must be pre-saved; there is no way to pass them dynamically |
| No interactive prompts | SQLcl commands that prompt for input (e.g., `ACCEPT`) will hang — avoid these in MCP mode |
| Restrict level 4 by default | Many SQLcl commands are blocked unless you explicitly lower the restrict level |
| No parallel sessions | One `sql -mcp` process = one session; run multiple processes for multiple concurrent connections |

---

## Monitoring

### Activity Log Table

SQLcl automatically creates a `DBTOOLS$MCP_LOG` table in the connected schema to record all MCP activity:

```sql
SELECT id, mcp_client, model, end_point_type, end_point_name, log_message
FROM DBTOOLS$MCP_LOG;
```

This provides a full audit trail of AI-driven SQL execution, including which AI client and model made each call.

### V$SESSION Integration

SQLcl populates Oracle session metadata for MCP connections:

- `V$SESSION.MODULE` — set to the MCP client name (e.g., `Claude Desktop`)
- `V$SESSION.ACTION` — set to the LLM model name

This allows DBAs to identify and monitor AI-driven sessions in real time.

### Query Tagging

All SQL generated and executed by an LLM through the MCP server is automatically tagged with a comment:

```sql
/* LLM in use is [model-name] */ SELECT ...
```

This makes AI-generated SQL identifiable in AWR, ASH, and `V$SQL`.

---

## Security Considerations

### Use a Least-Privilege Database User

Save a dedicated, restricted database user for MCP connections rather than using your DBA account:

```sql
CREATE USER mcp_reader IDENTIFIED BY "StrongPassword123!";
GRANT CREATE SESSION TO mcp_reader;
GRANT SELECT ON oe.orders TO mcp_reader;
GRANT SELECT ON oe.customers TO mcp_reader;
-- Grant SELECT ANY DICTIONARY for schema introspection:
GRANT SELECT ANY DICTIONARY TO mcp_reader;
```

Save this connection before starting the MCP server:

```sql
conn -save mcp_readonly -savepwd mcp_reader/StrongPassword123!@//host:1521/svc
```

### What the AI Can and Cannot Do

The AI operates entirely within the permissions of the database user it connects as. Restrict levels further limit SQLcl commands available within the session.

**Cannot do regardless of DB permissions:**
- Access the OS filesystem (blocked by default restrict level)
- Open network connections
- Escalate database privileges

### TNS_ADMIN Is the Only Supported Environment Variable

The only environment variable documented for the SQLcl MCP server is `TNS_ADMIN`. Do not attempt to pass passwords via environment variables — there is no supported mechanism for this. All credentials must be pre-saved using `conn -save -savepwd`.

---

## Troubleshooting

### Common Configuration Mistakes

| Mistake | Fix |
|---------|-----|
| Using SQLcl 24.3 or earlier | Upgrade to 25.2+; MCP was not available in earlier versions |
| Passing credentials on the `sql -mcp` command line | Pre-save connections with `conn -save -savepwd` instead |
| Using a relative path to `sql` in the MCP config | Use the absolute path (`which sql` / `where sql`) — AI clients do not inherit your shell PATH |
| Forgetting `TNS_ADMIN` in the config `env` block for TNS connections | MCP client processes don't inherit shell env vars; set `TNS_ADMIN` explicitly in the config |
| Saving a connection without `-savepwd` | The MCP server cannot connect without a saved password; always include `-savepwd` |
| Expecting HTTP/SSE transport | SQLcl MCP is stdio only — no network port is involved |

### MCP Server Not Appearing in AI Client

1. Confirm the absolute path to `sql` is correct and the binary is executable.
2. Run `sql -V` from the exact path in the config to verify the version is 25.2+.
3. Check that `JRE 17` or `JRE 21` is on the PATH used by the AI client process — set `JAVA_HOME` in the config `env` block if needed:

```json
"env": {
  "JAVA_HOME": "/path/to/jre"
}
```

4. Restart the AI client after any config change.

### Connection Fails After `connect` Tool Call

- Verify the named connection exists: `ls ~/.dbtools/`
- Re-save the connection with `-savepwd` if the password was not stored.
- Check that the database host/port/service is reachable from the machine running SQLcl.

### `DBTOOLS$MCP_LOG` Table Not Created

The log table is created in the schema of the connected user on first use. Ensure the user has `CREATE TABLE` privilege, or grant it:

```sql
GRANT CREATE TABLE TO mcp_reader;
```

### Java Not Found at Startup

Set `JAVA_HOME` explicitly in the MCP server config `env` block. SQLcl requires JRE 17 or 21 — other versions are not supported.

### Non-ASCII Characters Garbled in Results

SQLcl uses the JVM's default charset for output. For UTF-8 data, set `JAVA_TOOL_OPTIONS` in the MCP server config `env` block:

```json
"env": {
  "JAVA_TOOL_OPTIONS": "-Dfile.encoding=UTF-8"
}
```

---

## Related Skills

- `sqlcl-basics.md` — SQLcl installation, connection methods, and core commands
- `sqlcl-cicd.md` — Using SQLcl non-interactively in pipelines
- `sqlcl-formatting.md` — `SET SQLFORMAT` modes (CSV, JSON, XML, ANSICONSOLE) and SPOOL
- `sqlcl-scripting.md` — JavaScript automation via the `script` command
- `sqlcl-data-loading.md` — `LOAD` command for CSV and JSON ingestion
- `sqlcl-ddl-generation.md` — `DDL` command and `DBMS_METADATA` for schema extraction
- `sqlcl-liquibase.md` — Built-in Liquibase (`lb`) for changelog-based schema migrations
- `sqlcl-awr.md` — AWR report generation for performance monitoring
- `sqlcl-background-jobs.md` — Running commands asynchronously with `background` and `jobs`
- `sqlcl-scheduler-daemon.md` — Scheduling recurring SQL jobs with the SQLcl daemon
- `security/privilege-management.md` — Oracle user creation and least-privilege setup
- `monitoring/top-sql-queries.md` — Identifying AI-generated SQL via V$SQL tagging

---

## Sources

- [Using the Oracle SQLcl MCP Server](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.4/sqcug/using-oracle-sqlcl-mcp-server.html)
- [Preparing Your Environment](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.4/sqcug/preparing-your-environment.html)
- [Starting and Managing the SQLcl MCP Server](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/starting-and-managing-sqlcl-mcp-server.html)
- [About the SQLcl MCP Server Tools](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.3/sqcug/sqlcl-mcp-server-tools.html)
- [Monitoring the SQLcl MCP Server](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.3/sqcug/monitoring-sqlcl-mcp-server.html)
- [Configuring Restrict Levels for the SQLcl MCP Server](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.4/sqcug/configuring-restrict-levels-sqlcl-mcp-server.html)
