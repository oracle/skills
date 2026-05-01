# SQLcl Background Jobs

## Overview

SQLcl provides `BACKGROUND` (alias `bg`) and `JOBS` (alias `jb`) commands for running SQLcl commands asynchronously and managing the resulting background tasks. This allows long-running operations to execute without blocking the interactive prompt, and multiple tasks to run in parallel within the same SQLcl session.

The `WAIT4` (alias `w4`) command complements these by blocking the session until specified tasks complete — enabling simple dependency chains.

Use background jobs for:
- Running multiple export or reporting commands in parallel
- Firing off a long-running operation while continuing interactive work
- Orchestrating dependent tasks (run B only after A completes)

---

## BACKGROUND Command

Runs any SQLcl command as a background task.

### Syntax

```sql
background|bg [OPTIONS] <command>
```

### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `-taskname <name>` | `-tn` | Assign a name to this task for later reference |
| `-wait4 <names>` | `-w4` | Comma-separated list of task names this job should wait for before starting |

### Basic Usage

```sql
-- Run a command in the background (auto-assigned task ID)
background apex list

-- Run with a named task
background -taskname export1 apex list

-- Run after other named tasks complete
background -taskname task3 -wait4 task1,task2 apex list
```

---

## JOBS Command

Lists, monitors, and manages background tasks.

### Syntax

```sql
jobs|jb [SUBCOMMAND] [OPTIONS]
```

### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `-id <id>` | `-i` | Target a specific task by numeric ID |
| `-taskname <name>` | `-tn` | Target a specific task by name |

### List All Jobs

```sql
jobs
```

Shows all background tasks with their IDs, names, status, and result summary.

### Show a Specific Job

```sql
jobs -id 2
jobs -taskname export1
```

### View Job Logs

```sql
jobs logs -id 2
jobs logs -taskname export1
```

Shows the full output produced by the background task.

### Cancel a Running Job

```sql
jobs cancel -id 2
jobs cancel -taskname export1
```

### Delete Jobs from the List

```sql
-- Delete a specific finished job
jobs delete -id 2

-- Delete all finished jobs
jobs delete -finished

-- Delete all jobs (finished and running)
jobs delete -all
```

---

## WAIT4 Command

Blocks the current session until one or more named background tasks finish.

### Syntax

```sql
wait4|w4 [OPTIONS] <task-name>[,<task-name>...]
```

### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `-delay <ms>` | `-d` | Milliseconds to poll between checks (default: 0) |

### Examples

```sql
-- Wait for a single task
wait4 export1

-- Wait for multiple tasks
wait4 task1,task3

-- Wait with a polling delay of 500ms
wait4 -delay 500 task1,task2
```

---

## Practical Examples

### Run Two Exports in Parallel

```sql
-- Start both exports simultaneously
background -taskname export-employees SET SQLFORMAT CSV
background -taskname export-orders SET SQLFORMAT CSV

-- Wait for both to finish
wait4 export-employees,export-orders

-- Check results
jobs logs -taskname export-employees
jobs logs -taskname export-orders
```

### Sequential Dependency Chain

```sql
-- task2 only starts after task1 completes
background -taskname task1 apex list
background -taskname task2 -wait4 task1 apex export -applicationid 100

wait4 task2
```

### Run a Long SQLcl Command Without Blocking

```sql
-- Fire off a Liquibase status check in the background
background -taskname lb-status lb status -changelog-file controller.xml

-- Continue working interactively while it runs
SELECT COUNT(*) FROM employees;

-- When ready, check the result
jobs logs -taskname lb-status
```

### Parallel AWR Reports for Multiple Snapshots

```sql
background -taskname awr-morning  awr create html 140 145
background -taskname awr-evening  awr create html 146 150

wait4 awr-morning,awr-evening
jobs
```

### Clean Up After a Session

```sql
-- Remove all finished tasks from the list
jobs delete -finished

-- Or remove everything
jobs delete -all
```

---

## Job Status Values

When you run `jobs`, each task shows one of these statuses:

| Status | Meaning |
|--------|---------|
| `RUNNING` | Task is currently executing |
| `COMPLETED` | Task finished successfully |
| `FAILED` | Task encountered an error |
| `WAITING` | Task is queued, waiting for its `-wait4` dependencies |
| `CANCELLED` | Task was cancelled via `jobs cancel` |

---

## Best Practices

- Always name tasks with `-taskname` when running more than one background job. Auto-assigned numeric IDs are hard to track.
- Use `wait4` before accessing results of background tasks — reading logs before a task finishes gives partial output.
- Use `-delay` with `wait4` for long-running tasks to reduce CPU polling overhead: `wait4 -delay 1000 mytask`.
- Clean up completed jobs with `jobs delete -finished` at the end of a session to keep the jobs list readable.
- Background jobs run within the same SQLcl session and share the database connection. Avoid running background jobs that issue conflicting DDL or DML against the same objects simultaneously.
- For scheduled recurring background tasks (not just ad-hoc parallelism), use the SQLcl Scheduler Daemon instead.

---

## Common Mistakes and How to Avoid Them

**Mistake: Reading logs before the task finishes**
`jobs logs` returns whatever output exists at that moment. If the task is still running, you get partial output. Use `wait4` first.

**Mistake: `-wait4` referencing a non-existent task name**
If the task named in `-wait4` does not exist or has already been deleted, the dependent job may start immediately or hang. Check `jobs` to confirm the dependency task is listed.

**Mistake: Running conflicting DML in parallel tasks**
Background tasks share the session connection. Two tasks updating the same rows concurrently will cause lock contention. Design parallel tasks to operate on distinct data sets.

**Mistake: Forgetting to clean up**
The jobs list accumulates across the session. `jobs delete -all` or `jobs delete -finished` keeps it manageable.

---

## Related Skills

- `sqlcl-awr.md` — Run AWR reports in parallel using background jobs
- `sqlcl-scheduler-daemon.md` — Schedule recurring jobs outside of an interactive session
- `sqlcl-scripting.md` — JavaScript scripts that can be dispatched as background payloads
- `sqlcl-cicd.md` — Non-interactive SQLcl patterns

---

## Sources

- [BACKGROUND Command Reference — Oracle SQLcl 25.4 User's Guide](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.4/sqcug/background.html)
- [Oracle SQLcl 25.2 User's Guide](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/oracle-sqlcl-users-guide.pdf)
