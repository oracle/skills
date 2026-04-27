# SQLcl Basics

## Overview

SQLcl (SQL Command Line) is Oracle's modern replacement for SQL*Plus. It is a free, Java-based command-line interface for Oracle Database that ships with Oracle Database installations and is also available as a standalone download. SQLcl offers significant improvements over SQL*Plus including tab completion, command history, in-line editing, built-in Liquibase support, a JavaScript scripting engine, and richer output formatting options.

SQLcl is distributed as a single ZIP file (no installer required) and runs on any platform with a JDK 17 or newer (JDK 21 recommended). It is also available via Homebrew on macOS. The executable is named `sql` (not `sqlcl`) to ease migration from SQL*Plus.

---

## Installation

### macOS via Homebrew (Recommended)

```shell
brew install sqlcl
```

After installation, the command is available as `sql`. Homebrew manages updates through `brew upgrade sqlcl`.

### Manual Installation (All Platforms)

1. Download the latest SQLcl ZIP from [Oracle Downloads](https://www.oracle.com/tools/downloads/sqlcl-downloads.html). No Oracle account is required.
2. Unzip to a directory of your choice:
   ```shell
   unzip sqlcl-<version>.zip -d /opt/sqlcl
   ```
3. Add the `bin` directory to your PATH:
   ```shell
   export PATH=/opt/sqlcl/bin:$PATH
   ```
4. Verify the installation:
   ```shell
   sql -V
   ```

### Verify Java

SQLcl 25.2 and later requires Java 17 or 21. If you have multiple JDKs, ensure the correct one is on your PATH:

```shell
java -version
```

---

## Connecting to Oracle Database

### Basic Username/Password

```shell
sql username/password@hostname:port/service_name
```

Example:

```shell
sql hr/hr@localhost:1521/FREEPDB1
```

### Easy Connect Syntax (EZConnect)

Easy Connect is the most portable connection method and does not require a `tnsnames.ora` file:

```shell
sql username/password@//hostname:port/service_name
```

You can also use EZConnect Plus syntax (Oracle 19c+) for additional options:

```shell
sql hr/hr@"(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=myhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=MYPDB)))"
```

### TNS Alias

If `$TNS_ADMIN` or `$ORACLE_HOME/network/admin/tnsnames.ora` is configured:

```shell
sql username/password@MY_TNS_ALIAS
```

Set the TNS admin directory explicitly:

```shell
export TNS_ADMIN=/path/to/wallet_or_tns
sql hr/hr@MY_SERVICE
```

### Oracle Cloud (Autonomous Database) Wallet

Download the wallet ZIP from the Oracle Cloud Console, then unzip it to a local directory:

```shell
unzip Wallet_MyDB.zip -d /path/to/wallet
```

Connect using the wallet:

```shell
sql username/password@"(DESCRIPTION=(ADDRESS=(PROTOCOL=tcps)(HOST=adb.us-ashburn-1.oraclecloud.com)(PORT=1522))(CONNECT_DATA=(SERVICE_NAME=myadb_high.adb.oraclecloud.com))(SECURITY=(MY_WALLET_DIRECTORY=/path/to/wallet)))"
```

Alternatively, set `TNS_ADMIN` to the wallet directory and use the pre-defined TNS aliases it contains:

```shell
export TNS_ADMIN=/path/to/wallet
sql admin/MyPassword123@myadb_high
```

### Prompting for Password (Secure)

Omit the password to be prompted (avoids password in shell history):

```shell
sql hr@localhost:1521/FREEPDB1
```

SQLcl will prompt: `Password? (**********?)`

### SYSDBA / SYSOPER Connections

```shell
sql sys/password@localhost:1521/ORCL as sysdba
sql / as sysdba
```

### Connecting from Within SQLcl

Use the `CONNECT` command to switch connections without restarting:

```sql
CONNECT hr/hr@localhost:1521/FREEPDB1
CONNECT admin@myadb_high
```

---

## Key Differences from SQL*Plus

| Feature | SQL*Plus | SQLcl |
|---|---|---|
| Tab completion | No | Yes (tables, columns, keywords) |
| Command history | No | Yes (up/down arrows, HISTORY command) |
| In-line editing | No | Yes (cursor keys, readline-style) |
| JavaScript scripting | No | Yes (built-in engine) |
| Liquibase | No | Built-in |
| Output formats | Limited | CSV, JSON, XML, INSERT, and more |
| DDL command | No | Yes (`DDL tablename`) |
| LOAD command | No | Yes (CSV/JSON ingestion) |
| Syntax highlighting | No | Yes (ANSICONSOLE format) |
| File size | Large (requires Oracle Client) | Small standalone JAR |
| Connection | Requires Oracle Client libs | Pure Java, no client required |

SQLcl accepts the same SQL*Plus scripts (`.sql` files with `@` and `@@` directives) with minimal compatibility issues. Most SQL*Plus commands (`SET`, `COLUMN`, `SPOOL`, etc.) work unchanged.

---

## Essential Commands

### HELP

Display available commands and their syntax:

```sql
HELP
HELP INDEX
HELP SET
HELP SPOOL
HELP CONNECT
```

### SET

Control SQLcl behavior. Common settings:

```sql
-- Control output verbosity
SET ECHO ON             -- Print each command before executing
SET FEEDBACK ON         -- Show row counts after queries
SET HEADING ON          -- Show column headers
SET TIMING ON           -- Show execution time
SET SERVEROUTPUT ON     -- Enable DBMS_OUTPUT
SET SERVEROUTPUT ON SIZE UNLIMITED

-- Output formatting
SET LINESIZE 200        -- Characters per output line
SET PAGESIZE 50         -- Lines per page (0 = no pagination)
SET WRAP ON             -- Wrap long lines (default)
SET TRIM ON             -- Remove trailing spaces
SET NULL "[NULL]"       -- Display text for NULL values

-- Number formatting
SET NUMFORMAT 999,999,999
SET NUMWIDTH 15

-- Output format (SQLcl-specific)
SET SQLFORMAT CSV
SET SQLFORMAT JSON
SET SQLFORMAT DEFAULT
```

### SHOW

Display current settings:

```sql
SHOW ALL                -- Show all SET values
SHOW SQLFORMAT          -- Current output format
SHOW USER               -- Current username
SHOW CON_NAME           -- Current container (CDB/PDB)
SHOW PDBS               -- List PDBs (requires CDB$ROOT connection)
SHOW ERRORS             -- Show compilation errors for last object
SHOW PARAMETERS nls     -- Show NLS database parameters
SHOW SGA                -- Show SGA memory breakdown
```

### HISTORY

SQLcl maintains a persistent command history across sessions (stored in `~/.sqlcl/history.log`):

```sql
HISTORY                 -- Show recent command history
HISTORY 20              -- Show last 20 commands
HISTORY FULL            -- Show full history with timestamps
HISTORY USAGE           -- Show most-used commands
HISTORY SCRIPT          -- Save history as a script
HISTORY CLEAR           -- Clear history
```

Run a command from history by its number:

```sql
HISTORY 5               -- Re-run command #5
```

### ALIAS

Create shortcuts for frequently used commands:

```sql
-- Create an alias
ALIAS tables=SELECT table_name, num_rows FROM user_tables ORDER BY 1;
ALIAS cols=SELECT column_name, data_type, nullable FROM user_tab_columns WHERE table_name = UPPER('&1');

-- Use the alias
tables
cols employees

-- List all aliases
ALIAS LIST

-- Delete an alias
ALIAS DROP tables

-- Save aliases persistently (to ~/.sqlcl/aliases.xml)
ALIAS SAVE
ALIAS LOAD
```

### Running Scripts

```sql
-- Run a script file
@/path/to/script.sql
@@relative/to/current.sql  -- Relative to current script

-- Run from URL
@https://example.com/script.sql

-- Pass arguments
@script.sql arg1 arg2
-- Arguments accessible as &1, &2, etc.
```

---

## Command Recall and Editing

SQLcl uses JLine for readline-style editing:

| Key | Action |
|---|---|
| Up/Down arrows | Navigate history |
| Ctrl+R | Reverse history search |
| Ctrl+A | Jump to beginning of line |
| Ctrl+E | Jump to end of line |
| Ctrl+K | Delete to end of line |
| Ctrl+U | Delete entire line |
| Ctrl+W | Delete previous word |
| Tab | Auto-complete |
| Alt+. | Insert last argument of previous command |

### Multi-line Editing

SQLcl supports multi-line SQL editing. Press Enter to continue a SQL statement across lines. The prompt changes from `SQL>` to the line number. Use `/` on a blank line or a semicolon to execute:

```
SQL> SELECT employee_id,
  2         first_name,
  3         last_name
  4    FROM employees
  5   WHERE department_id = 90
  6  /
```

The `/` command re-runs the SQL buffer. Use `L` (LIST) to display the current buffer:

```sql
LIST            -- Show SQL buffer
L 3             -- Show line 3
C /old/new/     -- Change text in buffer (SQL*Plus-style)
```

---

## Tab Completion

Tab completion works for:

- SQL keywords (`SELECT`, `FROM`, `WHERE`, etc.)
- Table and view names
- Column names (context-aware after `SELECT`, `WHERE`, etc.)
- SQLcl commands (`HISTORY`, `ALIAS`, `DDL`, etc.)
- File paths (for `@` and `SPOOL`)
- Bind variable names

Press Tab once to complete or twice to show all possibilities when there are multiple matches.

---

## Startup and Configuration Files

SQLcl reads `login.sql` on startup, similar to SQL*Plus:

- Searches in current directory first
- Then in your home directory (`~/login.sql` on Unix-like systems)

Example `login.sql`:

```sql
-- ~/login.sql
SET LINESIZE 200
SET PAGESIZE 100
SET TIMING ON
SET SERVEROUTPUT ON SIZE UNLIMITED
SET SQLFORMAT ANSICONSOLE

ALIAS tables=SELECT table_name, num_rows, last_analyzed FROM user_tables ORDER BY 1;
ALIAS inval=SELECT object_type, object_name, status FROM user_objects WHERE status != 'VALID' ORDER BY 1, 2;
```

---

## Useful Runtime Commands

```sql
-- Exit SQLcl
EXIT
QUIT
EXIT 1          -- Exit with specific return code

-- Clear screen
CLEAR SCREEN
CL SCR

-- Show current date/time
SELECT SYSDATE FROM DUAL;

-- Time a query
SET TIMING ON
SELECT COUNT(*) FROM big_table;
-- Elapsed: 00:00:01.234

-- Show current database info
SELECT * FROM v$instance;
SELECT name, db_unique_name, open_mode FROM v$database;

-- Describe an object
DESC employees
DESC hr.employees
DESC my_package
```

---

## Best Practices

- Always use `CONNECT` command with a password prompt (omit password from command line) in shared or logged environments to prevent credentials appearing in shell history or process lists.
- Set `TNS_ADMIN` in your shell profile rather than embedding wallet paths in connection strings to keep scripts portable.
- Store common `SET` commands and `ALIAS` definitions in `login.sql` so every session starts consistently configured.
- Use `SET FEEDBACK ON` and `SET TIMING ON` during interactive work; turn them `OFF` in scripts where only output data matters.
- Prefer `SET SERVEROUTPUT ON SIZE UNLIMITED` over a fixed size to avoid truncated DBMS_OUTPUT.
- Use `SPOOL /path/to/output.log` with `SPOOL OFF` around batch operations to capture all output for later review.
- When connecting to Autonomous Database, store the wallet path in `TNS_ADMIN` and commit the `tnsnames.ora` and `sqlnet.ora` (without the actual wallet files) to version control so connection strings are reproducible.

---

## Common Mistakes and How to Avoid Them

**Mistake: Password visible in process list or shell history**
Omit the password from the connection string. SQLcl will prompt securely. Alternatively, use a wallet or use the `DEFINE` command to prompt at script start.

**Mistake: Scripts failing due to SQL*Plus compatibility**
Most SQL*Plus scripts run in SQLcl unchanged. If you encounter issues, check for use of `COLUMN ... NOPRINT` with complex formatting or very old `SET` options. SQLcl supports the vast majority of SQL*Plus directives.

**Mistake: `SET PAGESIZE 0` breaking column headers**
`SET PAGESIZE 0` suppresses page breaks but also suppresses column headers. Use `SET PAGESIZE 50000` with `SET HEADING ON` when you want headers without pagination breaks.

**Mistake: Forgetting `SET FEEDBACK OFF` in data export scripts**
Row count messages like `25 rows selected.` will appear in your output file. Always set `SET FEEDBACK OFF` and `SET HEADING OFF` when spooling data for downstream consumption.

**Mistake: Tab completion not working**
Tab completion requires the terminal to be in a mode that passes control characters. Ensure you are running SQLcl in an interactive terminal, not through a pipe or non-interactive shell substitution.

**Mistake: Using SQL*Plus executable path in scripts**
After migrating to SQLcl, update your scripts and aliases to use `sql` instead of `sqlplus`. The behavior is nearly identical for standard SQL and PL/SQL execution.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle SQLcl Product Page](https://www.oracle.com/database/sqldeveloper/technologies/sqlcl/)
- [Oracle SQLcl 25.2 User's Guide](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/oracle-sqlcl-users-guide.pdf)
- [Starting and Leaving SQLcl — startup flags and version flag](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/startup-sqlcl-settings.html)
- [SQLcl Release Notes 25.2](https://www.oracle.com/tools/sqlcl/sqlcl-relnotes-25.2.html)
- [SQLcl Release Notes 25.2.1 — Java 17/21 requirement confirmed](https://www.oracle.com/tools/sqlcl/sqlcl-relnotes-25.2.1.html)
