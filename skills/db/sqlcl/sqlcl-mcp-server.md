# SQLcl MCP Server

## Overview

The SQLcl MCP Server is a built-in capability of Oracle SQLcl (**25.2 or later**) that exposes Oracle Database functionality to AI assistants via the **Model Context Protocol (MCP)**. SQLcl acts as the MCP server — it holds the database connection and handles authentication, while AI clients (Claude Desktop, Claude Code, VS Code with Cline, etc.) drive the interaction through well-defined MCP tool calls.

Communication uses **`stdio` only**. The AI client spawns SQLcl as a child process and communicates via stdin/stdout. There is no HTTP, SSE, or network port.

---

## Prerequisites

- **SQLcl 25.2 or later** (MCP was not present in 24.3 or earlier)
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
| `run-sqlcl` | Executes SQLcl-specific commands and extensions |

The AI client will first call `list-connections` to discover available connections, then `connect` to establish a session, then `run-sql` or `run-sqlcl` to interact with the database.

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

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using SQLcl 24.3 or earlier | Upgrade to 25.2+; MCP was not available in earlier versions |
| Passing credentials on the `sql -mcp` command line | Pre-save connections with `conn -save -savepwd` instead |
| Using a relative path to `sql` in the MCP config | Use the absolute path (`which sql`) — AI clients do not inherit your shell PATH |
| Forgetting `TNS_ADMIN` in the config `env` block for TNS connections | MCP client processes don't inherit shell env vars; set `TNS_ADMIN` explicitly in the config |
| Saving a connection without `-savepwd` | The MCP server cannot connect without a saved password; always include `-savepwd` |
| Expecting HTTP/SSE transport | SQLcl MCP is stdio only — no network port is involved |

---

## Related Skills

- `sqlcl-basics.md` — SQLcl installation, connection methods, and core commands
- `sqlcl-cicd.md` — Using SQLcl non-interactively in pipelines
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
