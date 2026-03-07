# SQLcl MCP Server

## Overview

The SQLcl MCP Server is a built-in capability of Oracle SQLcl (version 24.3+) that exposes Oracle Database functionality to AI assistants via the **Model Context Protocol (MCP)**. When the MCP server is active, AI tools such as Claude, VS Code Copilot, or Cursor can query schemas, run SQL statements, inspect database objects, and interact with an Oracle database through a standardized, tool-based interface — without the AI needing a native Oracle driver or direct database credentials embedded in the AI client configuration.

This feature turns SQLcl into a bridge between the AI world and the Oracle world: SQLcl holds the database connection and handles authentication, while the AI assistant drives the interaction through well-defined MCP tool calls.

---

## 1. What is the Model Context Protocol (MCP)?

MCP is an open protocol, originally introduced by Anthropic, that defines a standard way for AI models (clients) to call external tools and data sources (servers). Think of it as a structured API contract between an AI assistant and the services it needs to interact with:

- The **MCP client** is the AI assistant or IDE plugin (e.g., Claude Desktop, Claude Code CLI, VS Code with Copilot).
- The **MCP server** is a process that exposes a set of named tools the AI can invoke. The server receives tool-call requests, executes them, and returns structured results.
- Communication happens over **standard I/O (`stdio`)** — the AI client spawns SQLcl as a subprocess and communicates via stdin/stdout.

### Why MCP Matters for AI + Database Integration

Without MCP, integrating an AI assistant with a database requires either embedding SQL generation purely in the AI's pre-training (no live schema knowledge) or building a custom integration layer for every tool. MCP solves this with a universal contract:

- The AI can fetch live schema metadata before generating SQL, dramatically improving query accuracy.
- The AI can validate generated SQL by actually executing it (or using `EXPLAIN PLAN`) against the real database.
- No custom plugin or driver code is needed in the AI client — only a config file entry pointing to the MCP server.
- The database stays under the control of the DBA: the MCP server enforces the permissions of whatever database user it connects as.

### SQLcl as the MCP Server

SQLcl's MCP server works as follows:

1. SQLcl connects to an Oracle Database (using any supported connection method).
2. SQLcl starts its MCP server, which listens for tool invocations.
3. The AI assistant's MCP client sends tool requests (e.g., "list tables in schema HR").
4. SQLcl translates each tool request into SQL or PL/SQL, executes it against the connected database, and returns results to the AI.
5. The AI incorporates the results into its reasoning and response.

### Key Use Cases

- **Schema exploration** — Ask "What tables exist in the OE schema and how are they related?" and the AI queries the data dictionary live.
- **AI-assisted query writing** — The AI inspects column names, data types, and constraints before writing a JOIN query, reducing hallucinated column names.
- **Data analysis and reporting** — The AI runs aggregate queries and interprets results in natural language.
- **PL/SQL generation and validation** — The AI generates a procedure, then validates it by inspecting existing packages and object types in the database.
- **Database-assisted development** — Developers using Claude Code can ask questions about the database while editing application code, with the AI querying the live schema for accurate answers.

---

## 2. Installation & Prerequisites

### SQLcl Version Requirement

The MCP server feature requires **SQLcl 24.3 or later**. Earlier versions do not support the `-mcp` startup flag. Always verify before configuring AI clients:

```shell
sql -v
# Expected: SQLcl: Release 24.3.0.0 Production or newer
```

Install or upgrade via Homebrew on macOS:

```shell
brew install sqlcl
# or
brew upgrade sqlcl
```

For other platforms, download the latest ZIP from [Oracle SQLcl Downloads](https://www.oracle.com/tools/downloads/sqlcl-downloads.html) and replace the existing installation.

### Java Requirement

SQLcl requires **JDK 17 or newer** (JDK 21 recommended for SQLcl 24.x+). Verify:

```shell
java -version
```

### Starting the MCP Server

The MCP server is always started via the **`-mcp` startup flag** passed when launching SQLcl. There is no interactive command to type at the `SQL>` prompt — the flag must be present at launch time. SQLcl connects to the database, then immediately enters MCP server mode, reading protocol messages on stdin and writing responses on stdout.

#### Basic Connection (Easy Connect)

```shell
sql username/password@//hostname:1521/service_name -mcp
```

#### TNS-Based Connection

```shell
sql username/password@tns_alias -mcp
```

Requires `TNS_ADMIN` environment variable to point to the directory containing `tnsnames.ora` and `sqlnet.ora`.

#### Using a Wallet (ATP / ADW / mTLS)

For Oracle Autonomous Database (ATP, ADW) or any mTLS connection:

```shell
sql -cloudconfig /path/to/wallet.zip username/password@tns_alias -mcp
```

The `-cloudconfig` flag must come before the connection string. The wallet zip provides the TLS certificates and `tnsnames.ora`.

### Transport

SQLcl MCP uses **`stdio` only**. The AI client (Claude Desktop, Claude Code, etc.) spawns SQLcl as a child process and communicates via stdin/stdout. There is no HTTP, SSE, or network port involved.

---

## 3. Connecting AI Assistants

### Claude Desktop

Claude Desktop reads MCP server configurations from `claude_desktop_config.json`. The location is platform-dependent:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add an entry under `"mcpServers"`:

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "sql",
      "args": [
        "app_user/password@//myhost.example.com:1521/FREEPDB1",
        "-mcp"
      ]
    }
  }
}
```

For ATP/ADW with a wallet (keeping credentials out of the config via environment variables):

```json
{
  "mcpServers": {
    "oracle-atp": {
      "command": "sql",
      "args": [
        "-cloudconfig",
        "/Users/klrice/wallets/my_atp_wallet.zip",
        "app_user/@my_atp_high",
        "-mcp"
      ],
      "env": {
        "ORACLE_MCP_PASSWORD": "VaultOrEnvManagedSecret"
      }
    }
  }
}
```

> **Note:** Storing passwords directly in `claude_desktop_config.json` is a security risk. See Section 5 for wallet-based and environment-variable-based credential management.

Restart Claude Desktop after editing the config. Verify the server is active by looking for the hammer/tools icon in the Claude Desktop interface.

### Claude Code (CLI)

Claude Code reads MCP configurations from `.mcp.json` in the project directory (project-scoped) or `~/.claude/mcp.json` (user-scoped). You can also add servers using the `claude mcp add` command.

#### Using `claude mcp add`

```shell
claude mcp add oracle-db sql -- \
  "app_user/password@//myhost.example.com:1521/FREEPDB1" \
  "-mcp"
```

This writes the configuration to `.mcp.json` in the current directory.

#### Manual `.mcp.json` Configuration

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "sql",
      "args": [
        "app_user/password@//myhost.example.com:1521/FREEPDB1",
        "-mcp"
      ]
    }
  }
}
```

For a wallet-based connection:

```json
{
  "mcpServers": {
    "oracle-atp": {
      "command": "sql",
      "args": [
        "-cloudconfig",
        "/home/user/wallets/atp_wallet.zip",
        "app_user/password@mydb_high",
        "-mcp"
      ]
    }
  }
}
```

Verify the server is recognized by Claude Code:

```shell
claude mcp list
```

### VS Code with GitHub Copilot (MCP Preview)

VS Code supports MCP servers in the Copilot chat extension. Add to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "oracle-db": {
      "command": "sql",
      "args": [
        "app_user/password@//myhost.example.com:1521/FREEPDB1",
        "-mcp"
      ]
    }
  }
}
```

### Cursor

In Cursor, add MCP servers via the settings UI or by editing `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "sql",
      "args": [
        "app_user/password@//myhost.example.com:1521/FREEPDB1",
        "-mcp"
      ]
    }
  }
}
```

### Using Environment Variables for Passwords

All MCP client config formats support an `env` block for passing environment variables to the server process. Use this to avoid hardcoding passwords:

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "sql",
      "args": [
        "app_user/@//myhost.example.com:1521/FREEPDB1",
        "-mcp"
      ],
      "env": {
        "SQLCL_MCP_PASSWORD": "your_password_here"
      }
    }
  }
}
```

Better still: use a wallet (Section 2) so no password appears anywhere in the config.

---

## 4. Available MCP Tools

The SQLcl MCP server exposes the following tools to connected AI clients. The exact set may expand across SQLcl releases; use the MCP introspection feature (automatically invoked by AI clients on startup) to get the current list from your installed version.

### Core Tools

| Tool Name | Description |
|-----------|-------------|
| `execute_query` | Executes a `SELECT` statement and returns rows as structured JSON. Used for data retrieval, analysis, and validation. |
| `run_statement` | Executes any SQL or PL/SQL statement (DDL, DML, anonymous blocks). Returns success/error status and output. |
| `list_tables` | Lists tables visible to the connected user, optionally filtered by schema or name pattern. |
| `describe_object` | Returns the full definition of a named database object: columns and types for tables/views, source for procedures/functions/packages/triggers. |
| `get_schema` | Returns a comprehensive schema dump for a given schema owner — tables, views, indexes, constraints, sequences. |
| `list_schemas` | Lists all schemas (users) accessible from the current connection. |
| `explain_plan` | Returns the execution plan for a given SQL statement without executing it. |
| `get_object_source` | Returns the DDL source text for stored program units (procedures, functions, packages, triggers, types). |
| `list_objects` | Lists database objects of a given type (TABLE, VIEW, PROCEDURE, PACKAGE, TRIGGER, INDEX, SEQUENCE, etc.) in a schema. |
| `get_table_data` | Retrieves a sample of rows from a table (bounded fetch, not for bulk export). |

### Tool Details

#### `execute_query`
The primary read tool. The AI submits a `SELECT` statement and receives rows back as structured data. Safest tool in terms of side effects.

```
Input:  { "sql": "SELECT table_name, num_rows FROM user_tables ORDER BY num_rows DESC" }
Output: { "rows": [ {"TABLE_NAME": "ORDERS", "NUM_ROWS": 48302}, ... ] }
```

#### `run_statement`
Executes any statement, including `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, and PL/SQL blocks. This is the read-write tool — use with appropriate database user permissions and care. The AI should only call this when the user has explicitly requested a data or schema change.

```
Input:  { "sql": "ALTER TABLE customers ADD (loyalty_tier VARCHAR2(20))" }
Output: { "status": "success", "message": "Table altered." }
```

#### `describe_object`
One of the most frequently used tools for AI-assisted development. The AI calls this to understand a table's structure before writing queries or generating application code.

```
Input:  { "object_name": "ORDERS", "schema": "OE" }
Output: Full column list with names, data types, nullable flags, and constraints.
```

#### `explain_plan`
Allows the AI to evaluate query efficiency before recommending a query to the user. Critical for performance-aware query generation.

```
Input:  { "sql": "SELECT * FROM orders o JOIN order_items i ON o.order_id = i.order_id WHERE o.customer_id = 101" }
Output: Formatted execution plan with estimated cost and cardinality.
```

### Read-Only vs Read-Write Tools

| Category | Tools | Risk Level |
|----------|-------|------------|
| Read-only | `execute_query`, `list_tables`, `describe_object`, `get_schema`, `list_schemas`, `explain_plan`, `get_object_source`, `list_objects`, `get_table_data` | Low — no data modification possible |
| Read-write | `run_statement` | Medium to High — can modify or drop data and schema objects |

For environments where the AI should only explore and advise (not modify), connect as a read-only database user (see Section 5). This makes `run_statement` effectively harmless because the database will reject any DML/DDL attempts.

---

## 5. Security Considerations

### Use a Least-Privilege Database User

Never connect the MCP server as `SYS`, `SYSTEM`, or any DBA-privileged account. Create a dedicated MCP user with only the permissions needed:

```sql
-- Create a read-only MCP user
CREATE USER mcp_reader IDENTIFIED BY "StrongPassword123!";
GRANT CREATE SESSION TO mcp_reader;
GRANT SELECT ANY TABLE TO mcp_reader;        -- or grant per-table
GRANT SELECT ANY DICTIONARY TO mcp_reader;  -- for schema introspection

-- Or for a more restricted grant (preferred):
GRANT SELECT ON oe.orders TO mcp_reader;
GRANT SELECT ON oe.order_items TO mcp_reader;
GRANT SELECT ON oe.customers TO mcp_reader;
```

For development environments where the AI needs to create objects or run DML:

```sql
CREATE USER mcp_dev IDENTIFIED BY "DevPassword456!";
GRANT CREATE SESSION, CREATE TABLE, CREATE PROCEDURE TO mcp_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON oe.orders TO mcp_dev;
```

### Wallet-Based Authentication (No Password Exposure)

Using an Oracle wallet eliminates the need for passwords in config files or command-line arguments. This is the recommended approach for any persistent MCP configuration:

1. Create or download a wallet (automatic for ATP/ADW from OCI Console).
2. Configure the wallet in `sqlnet.ora` within the wallet directory.
3. Reference the wallet zip in the MCP config without a password:

```json
{
  "mcpServers": {
    "oracle-atp": {
      "command": "sql",
      "args": [
        "-cloudconfig",
        "/secure/path/to/wallet.zip",
        "mcp_reader/@mydb_low",
        "-mcp"
      ]
    }
  }
}
```

Note the empty password (`/@`) — the wallet provides the credential.

### Transport Security

SQLcl MCP uses `stdio` only — the AI client spawns SQLcl as a subprocess. No network port is opened. Security is entirely determined by:
- The OS user running the AI client process (controls who can start the MCP server)
- The Oracle database user SQLcl connects as (controls what the AI can do in the DB)

### What an AI Assistant Can and Cannot Do via MCP

**Can do (limited by DB user permissions):**
- Query any table the MCP user has SELECT on
- View schema metadata (object names, column definitions, source code)
- Execute DML/DDL if the MCP user has those grants
- Read data from views, call read-only functions

**Cannot do:**
- Bypass Oracle's access control — every operation runs under the MCP database user's privileges
- Access the OS filesystem or other databases
- Escalate privileges beyond what the MCP database user holds
- Perform bulk data exports efficiently (MCP is not designed for bulk transfer)

### Audit Logging

Enable Oracle Unified Auditing for the MCP database user to maintain a record of all AI-driven SQL execution:

```sql
CREATE AUDIT POLICY mcp_audit_policy
  ACTIONS SELECT, INSERT, UPDATE, DELETE, EXECUTE
  WHEN 'SYS_CONTEXT(''USERENV'', ''SESSION_USER'') = ''MCP_READER'''
  EVALUATE PER SESSION;

AUDIT POLICY mcp_audit_policy;
```

This creates an audit trail that distinguishes AI-driven queries from application queries, which is valuable for compliance and incident investigation.

### Avoiding Sensitive Data Exposure

- **Grant column-level privileges** where possible to prevent AI from accessing PII or sensitive columns it doesn't need.
- **Use views** to expose pre-filtered, masked, or aggregated data to the MCP user instead of granting direct table access.
- **Row-level security** (Oracle VPD / RLS) applies normally — the MCP user sees only what the policy permits.
- **Be aware of AI context windows** — when the AI calls `get_table_data`, actual row data enters the AI's context. Avoid using MCP against tables containing PII, financial data, or secrets unless necessary and governed.

---

## 6. Practical Examples

### Schema Exploration Workflow

**User prompt to AI:**
> "What tables are in the OE schema and how are orders related to customers?"

**MCP calls triggered:**
1. `list_tables` with `schema: "OE"` — returns list of table names
2. `describe_object` for `OE.ORDERS` — returns columns and constraints
3. `describe_object` for `OE.CUSTOMERS` — returns columns and primary key
4. `execute_query` to query `user_constraints` and `user_cons_columns` for foreign key relationships

**Result:** The AI accurately describes the relationship using live schema data rather than guessing.

### AI-Assisted Query Writing

**User prompt:**
> "Write a query showing total revenue by product category for Q1 2024, using the OE schema."

**MCP calls triggered:**
1. `list_tables` — discovers relevant tables (ORDERS, ORDER_ITEMS, PRODUCTS, PRODUCT_CATEGORIES)
2. `describe_object` for each relevant table — learns column names and types
3. `execute_query` with a COUNT(\*) and date range to validate row availability
4. Returns the final query after verifying column names exist

**Generated SQL (grounded in live schema):**

```sql
SELECT
    pc.category_name,
    SUM(oi.unit_price * oi.quantity) AS total_revenue
FROM oe.orders o
JOIN oe.order_items oi   ON o.order_id   = oi.order_id
JOIN oe.products p       ON oi.product_id = p.product_id
JOIN oe.product_categories pc ON p.category_id = pc.category_id
WHERE o.order_date >= DATE '2024-01-01'
  AND o.order_date <  DATE '2024-04-01'
GROUP BY pc.category_name
ORDER BY total_revenue DESC;
```

### Generating and Validating a PL/SQL Procedure

**User prompt:**
> "Write a PL/SQL procedure to archive orders older than 2 years to an ORDERS_ARCHIVE table."

**MCP calls triggered:**
1. `describe_object` for `ORDERS` — gets exact column list and types
2. `list_objects` checking for existence of `ORDERS_ARCHIVE`
3. `describe_object` for `ORDERS_ARCHIVE` (if it exists) — verifies column compatibility
4. `explain_plan` on the candidate DELETE statement — checks performance
5. Returns the procedure with correct column names, data types, and a bulk-collect/FORALL pattern

### Claude Code: Database-Assisted Development

When developing an application with Claude Code in a project that has `.mcp.json` configured:

```shell
# In the project directory with .mcp.json pointing to the Oracle MCP server
claude
```

**Developer prompt in Claude Code:**
> "I'm writing a JDBC query for the customer order history endpoint. What indexes exist on the ORDERS table, and is my query using them?"

Claude Code calls `describe_object` for ORDERS, `list_objects` for indexes on ORDERS, then `explain_plan` for the developer's query — all without leaving the coding session.

### Checking Data Quality

**User prompt:**
> "Are there any orders in the ORDERS table with a NULL customer_id, or orders where the order_date is in the future?"

**MCP calls triggered:**
1. `execute_query`: `SELECT COUNT(*) FROM oe.orders WHERE customer_id IS NULL`
2. `execute_query`: `SELECT COUNT(*) FROM oe.orders WHERE order_date > SYSDATE`

The AI reports the exact counts and suggests remediation if issues are found.

---

## 7. Troubleshooting & Tips

### Common Connection Errors

**Error: `ORA-12541: TNS:no listener`**
- The database host or port is incorrect in the connection string.
- Verify: `telnet hostname 1521` or `nc -zv hostname 1521`
- Fix: Correct the hostname and port in the `args` array of the MCP config.

**Error: `ORA-01017: invalid username/password; logon denied`**
- Wrong credentials.
- If using a wallet: ensure the TNS alias matches exactly what is in `tnsnames.ora` inside the wallet zip.
- Fix: Re-verify credentials; for wallet-based auth, re-download the wallet from OCI Console.

**Error: `sql: command not found` (AI client cannot start the server)**
- SQLcl (`sql`) is not in the PATH seen by the AI client process.
- Fix: Use the absolute path to the `sql` binary in the config:

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "/opt/homebrew/bin/sql",
      "args": ["user/pass@//host:1521/svc", "-mcp"]
    }
  }
}
```

Find the absolute path with:
```shell
which sql
```

**Error: SQLcl starts but immediately exits instead of staying in MCP mode**
- SQLcl version is older than 24.3 and does not recognise the `-mcp` flag — it is silently ignored and SQLcl exits normally.
- Fix: `brew upgrade sqlcl` or download the latest version, then verify with `sql -v`.

**MCP server starts but AI reports "no tools available"**
- The connection to the database failed silently, so no tools could be registered.
- Fix: Test the connection string manually: `sql user/pass@//host:1521/svc` and confirm you get a `SQL>` prompt.

### Checking SQLcl Version

```shell
sql -v
# SQLcl: Release 24.3.0.0 Production
```

To check from within a session:

```sql
SELECT * FROM v$version WHERE banner LIKE '%SQL%';
-- Or check SQLcl's own version variable:
SHOW SQLCL
```

### Debugging MCP Communication

Enable verbose MCP logging by setting the `SQLCL_MCP_LOG` environment variable before starting:

```shell
export SQLCL_MCP_LOG=DEBUG
sql user/pass@//host:1521/svc -mcp
```

Logs are written to stderr. In MCP client configs, stderr from the server process is typically captured by the client and available in its log viewer (e.g., Claude Desktop's log viewer via Help > Show Logs).

For Claude Code, run with verbose output:

```shell
claude --debug
```

This shows MCP tool calls and responses in real time.

### Performance Considerations

MCP is designed for **interactive, query-driven workflows** — not bulk data transfer. Keep these limits in mind:

- **Row limits:** `execute_query` and `get_table_data` return a bounded number of rows (typically 100-500). Do not use MCP to export large datasets.
- **Query timeout:** Long-running queries will block the MCP server. Add `FETCH FIRST N ROWS ONLY` to queries when exploring unknown table sizes.
- **Concurrent calls:** Each AI client session spawns its own SQLcl process. Multiple users each need their own independently configured MCP server entry pointing to their own SQLcl subprocess.
- **Schema dumps:** `get_schema` on a large schema (thousands of objects) can take several seconds and produce a large response that consumes significant AI context window. Filter by object type or name prefix when possible.

### Common Mistakes and How to Avoid Them

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Using `SYS` or `SYSTEM` as the MCP user | AI has full DBA access to the database | Create a dedicated least-privilege user |
| Hardcoding passwords in `claude_desktop_config.json` | Credentials visible in plaintext config file | Use wallet authentication or environment variables |
| Expecting SQLcl MCP to support HTTP/SSE | SQLcl MCP is stdio only — there is no network transport option | Use stdio; each AI client manages its own SQLcl subprocess |
| Running MCP against production with a read-write user | AI could accidentally modify production data | Use read-only user for production; read-write only for dev/test |
| Not checking SQLcl version before configuring | `-mcp` flag silently ignored, server never starts | Always run `sql -v` and confirm 24.3+ before configuring AI clients |
| Using relative paths for the wallet in config | Config breaks when run from different directories | Always use absolute paths for wallet, `sql` binary, and config files |
| Pointing MCP at a table with PII | Customer data enters the AI context window | Use VPD, column masking, or restrict MCP user's table grants |

---

## Quick Reference

### Minimal Working Config (Claude Desktop / Claude Code)

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "/opt/homebrew/bin/sql",
      "args": [
        "mcp_user/password@//localhost:1521/FREEPDB1",
        "-mcp"
      ]
    }
  }
}
```

### Minimal Working Config (ATP with Wallet)

```json
{
  "mcpServers": {
    "oracle-atp": {
      "command": "/opt/homebrew/bin/sql",
      "args": [
        "-cloudconfig",
        "/Users/klrice/wallets/myatp_wallet.zip",
        "mcp_user/password@myatp_low",
        "-mcp"
      ]
    }
  }
}
```

### Adding to Claude Code via CLI

```shell
claude mcp add oracle-db /opt/homebrew/bin/sql -- \
  "mcp_user/password@//localhost:1521/FREEPDB1" \
  "-mcp"
```

### Verifying MCP Server is Running

```shell
# List configured MCP servers in Claude Code
claude mcp list

# Test the connection string independently
/opt/homebrew/bin/sql mcp_user/password@//localhost:1521/FREEPDB1
# Should return: Connected.
# SQL>
```

### Creating a Read-Only MCP User (Quick Setup)

```sql
CREATE USER mcp_reader IDENTIFIED BY "SecurePassword1!";
GRANT CREATE SESSION TO mcp_reader;
GRANT SELECT ANY TABLE TO mcp_reader;
GRANT SELECT ANY DICTIONARY TO mcp_reader;
```

---

## Related Skills

- `sqlcl-basics.md` — SQLcl installation, connection methods, and core commands
- `sqlcl-scripting.md` — JavaScript scripting engine in SQLcl
- `sqlcl-liquibase.md` — Database change management with SQLcl Liquibase
- `security/db-user-management.md` — Oracle user creation and privilege management
- `ords/ords-overview.md` — Oracle REST Data Services (complementary API layer for Oracle DB)
