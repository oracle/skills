# SQLcl DIFF

## Purpose

Use this skill to run the SQLcl DIFF command safely and consistently through
the SQLcl MCP Server.

DIFF is a SQLcl command, not standard SQL. Execute it with the SQLcl command
execution tool, usually named run-sqlcl or sqlcl:sqlcl_run. Do not execute DIFF
with run-sql or sqlcl:sql_run.

Use DIFF to compare two Oracle Database schemas represented by SQLcl
connections and to generate a ZIP artifact containing schema change scripts.

## Tool Routing

Use the available SQLcl MCP tools in this order when relevant:

1. Use the connection-listing tool, for example connections_list, to discover
   saved SQLcl connections.
2. Use connect only when comparing a source connection against the current SQLcl
   connection as the target.

Tool names can vary by MCP server or client. Use the equivalent
connection-listing and SQLcl command-execution tools exposed by the current
environment.

## Command Syntax

Build commands from the syntax returned by the installed SQLcl version. The
HELP DIFF output for this workflow is:

```text
diff|di -source <source> [-target <target>] [-artifact-out <artifact-out>] [-project-dir <project-dir>] [-use-existing-project] [-parallel-exports] [-log] [-generate-rollback] [-verbose] [-debug]
```

Options:

| Option | Required | Meaning |
| --- | --- | --- |
| -source \<source> | Yes | Source connection. Use a saved connection name or full connect string. |
| -target \<target> | No | Target connection. Use a saved connection name or full connect string. If omitted, the current SQLcl connection is used as the target. |
| -artifact-out \<artifact-out> | No | Output directory where SQLcl writes DIFF output. SQLcl creates/copies the actual ZIP artifact inside this directory along with log file when `-log` is used. |
| -project-dir \<project-dir> | No | Path to an existing project root to reuse. The project must contain a .dbtools folder and be a git repository. Use with -use-existing-project. |
| -use-existing-project | No | Reuse an existing project folder and skip project initialization. Use with -project-dir. |
| -parallel-exports | No | Use only when the user requests it or when the installed help confirms the intended behavior. |
| -log | No | Generate a troubleshooting log file. Use it by default for DIFF runs, but do not read the file unless needed. |
| -generate-rollback | No | Generate a rollback artifact by staging source against target, effectively target to source. |
| -verbose | No | Print more details in messages. Prefer this for traceable user-facing runs. |
| -debug | No | Show exception details and stack traces. Use only for troubleshooting. |

## Required Workflow

1. Confirm the user provided a source connection.
2. If the user provided a target connection, confirm it as well.
3. Prefer saved connection names over full connect strings, especially when
   passwords would be exposed in chat or logs.
4. If using a full connect string, avoid repeating passwords in the final
   response.
5. If -target is omitted, verify that the current SQLcl connection is the
   intended target.
6. Run help diff through run-sqlcl if syntax is uncertain or the SQLcl version
   may differ.
7. Use -artifact-out with an explicit filesystem path when the user wants a
   generated artifact.
8. Add -verbose when the user needs a traceable explanation of what happened.
9. Use -log by default when running DIFF so a log file is generated for
   troubleshooting. Report the log path alongside the artifact path, do not
   inspect or summarize the log unless the user asks for it, the command fails,
   or the user asks why it failed. If available.
10. Run the command through run-sqlcl or sqlcl:sqlcl_run.
11. Summarize the console output and report the artifact path printed by SQLcl.

## Rules and Pitfalls

Always:

- Use run-sqlcl or sqlcl:sqlcl_run for DIFF.
- Use -source; it is required.
- Use -target when the user gives two connections and neither is already the
  current SQLcl connection.
- Treat plain schema names as valid only if they are also saved connection names
  or part of a connect string.
- Explain that the generated ZIP artifact is stored on the SQLcl server
  filesystem.
- Report the exact artifact path or output path shown by SQLcl.

Never invent unsupported options such as:

```text
-conn1
-conn2
-schema1
-schema2
```

Do not say the ZIP file was attached, downloaded, or returned in chat unless
another tool explicitly retrieved or uploaded it.

## Common Commands

### Confirm syntax

Use this when the installed SQLcl version is unknown or the command options are
uncertain:

```text
help diff
```

### Compare two saved connections

Use this when both source and target are saved SQLcl connections:

```text
diff -source conn1 -target conn2 -artifact-out /path/to/diff/output-dir
```

Response pattern:

```text
The DIFF command completed. SQLcl wrote the generated ZIP artifact to /path/to/diff/output-dir on the SQLcl server filesystem. MCP returned the console output and artifact path, not the binary ZIP content.
```

### Compare using full connect strings

Use full connect strings only when saved connections are not available. Prefer
not to echo credentials back to the user.

```text
diff -source hr/<password>@//host:1521/DB -target jdbc:oracle:thin:@host:1521/DB?user=scott&password=<password> -artifact-out /path/to/diff/output-dir
```

After running, redact passwords in summaries.

### Use current connection as target

Use this only when the current SQLcl connection is already the intended target:

```text
diff -source dev_conn -artifact-out /path/to/diff/output-dir
```

Response pattern:

```text
The DIFF command compared source connection dev_conn against the current SQLcl connection as the target. The generated artifact path reported by SQLcl is /path/to/diff/output-dir.
```

### Reuse an existing project

Use this only when the user provides or confirms an existing project root. The
project root must contain a .dbtools folder and be a git repository.

```text
diff -source conn1 -target conn2 -use-existing-project -project-dir /path/to/project
```

If the project root is not known, ask for it before using
-use-existing-project.

### Generate rollback artifact

Use this when the user explicitly asks for rollback output:

```text
diff -source conn1 -target conn2 -artifact-out /path/to/diff/output-dir -generate-rollback
```

Explain that rollback generation stages source against target, effectively
producing target-to-source rollback output.

## Artifact Handling

SQLcl DIFF writes a generated ZIP artifact to the SQLcl server filesystem. The
artifact contains schema change scripts generated by SQLcl. Treat `-artifact-out` as a directory path, not the final ZIP file path. Use a directory name without a `.zip` suffix. SQLcl writes the actual ZIP artifact inside the output directory.

The MCP response usually contains only console text, including status messages
and any printed artifact path. It does not automatically carry the binary ZIP
file.

The model should say:

```text
The artifact was generated at <path> on the SQLcl server filesystem.
```

The model should not say:

```text
The ZIP file is attached.
```

or:

```text
The ZIP is available in this chat.
```

If the user asks to inspect the artifact contents, the model can run an unzip or
list command against the reported artifact path to display file names and
content. Always confirm the artifact path from the SQLcl console output before
attempting to access it.

## Review and Deployment Guidance

Treat DIFF as a compare-and-generate step. Do not deploy generated changes
automatically.

Only discuss deployment after the user has reviewed the generated scripts and
explicitly asks how to deploy them. Never run deployment commands without
explicit user confirmation.

## Troubleshooting

- If a saved connection is missing, ask the user to create or save the SQLcl
  connection first.
- If a password is missing, expired, or invalid, ask the user to re-save the
  connection with valid credentials.
- If the target was omitted accidentally, add -target \<target> or connect to
  the intended target first.
- If the artifact path is unclear, report the path printed by SQLcl and explain
  that the ZIP is on the SQLcl server filesystem.
- If -use-existing-project fails, confirm the project root contains .dbtools and
  is a git repository.
- If the command fails due to MCP or SQLcl restrictions, report the restriction
  and suggest adjusting the MCP server configuration if appropriate.
- If unexpected syntax errors occur, run help diff and rebuild the command from
  the installed SQLcl help output.

## Related Skills

- sqlcl-mcp-server.md
- sqlcl-cicd.md
- sqlcl-liquibase.md
- sqlcl-ddl-generation.md

## Sources

- SQLcl HELP DIFF output provided for this skill specification.
- Oracle SQLcl MCP Server skill in oracle/skills.
- Oracle Skills authoring guide.
