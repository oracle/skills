# APEX Instance Administrator Bootstrap

Use this topic when the user asks to create, reset, or unlock an APEX Instance Administrator for APEX Administration Services, especially for the `INTERNAL` workspace after a new self-managed or container-based APEX installation.

This is installation/bootstrap work, not ordinary workspace-user administration. Do not route it to `APEX_UTIL.CREATE_USER`, and do not ask for a non-SYS/SYSTEM account with `APEX_ADMINISTRATOR_ROLE` as the primary path.

Official source: Oracle APEX Installation Guide, "Creating or Updating Your Instance Administration Account" and "Running apxchpwd.sql":

```text
https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/downloading-installing-apex.html#GUID-4062E1F0-2772-48FC-A4AA-436F326CF751
```

## Trigger Phrases

Route here for prompts such as:

- `can you create an apex instance admin`
- `create an APEX instance administrator`
- `an APEX internal/admin user for the INTERNAL workspace`
- `create an admin for INTERNAL`
- `reset the APEX Administration Services admin`
- `unlock the APEX instance administrator`

Do not respond by asking whether this means a database account granted `APEX_ADMINISTRATOR_ROLE`. Ask that only when the user says "database account", "grant role", or otherwise describes a database-login administrator rather than the APEX Administration Services administrator.

## When To Use apxchpwd.sql

Before giving local script steps, ask whether the environment is self-managed/container-based, co-managed Cloud with host/database access, or fully managed. Do not infer this from the service name alone.

For self-managed/container/co-managed Cloud APEX installations where the user can access the APEX installation directory and connect to the target database as `SYS AS SYSDBA`, run `apxchpwd.sql` from the APEX installation directory to create or update the Instance Administrator account. Use it for:

- New Oracle APEX installations where no Instance Administrator exists yet.
- Runtime-to-development conversion where the Instance Administrator password must be set.
- Changing an existing Instance Administrator password.
- Unlocking an existing Instance Administrator account.

`apxchpwd.sql` is not supported on Oracle Autonomous AI Database or Oracle APEX AI Application Generator Service (APEX Service). For those managed services, do not give local script steps. Tell the user this is managed-service administration and route them to the service-specific console/documentation path for creating, resetting, or unlocking the APEX Administration Services account.

Example managed-service response:

```text
This environment is managed, so I should not give apxchpwd.sql commands. Use the service-specific administration/reset path for APEX Administration Services instead. I can help identify the right console/documentation path, but I will not ask for or handle the APEX admin password in chat.
```

## Required Connection

Run the script in the database/PDB where APEX is installed. Start SQLcl from the directory where the APEX installation ZIP was unpacked and connect as `SYS AS SYSDBA`.

This privileged connection is allowed here because the task is explicit APEX installation/bootstrap work. Do not use this exception for routine workspace creation, workspace-user changes, application import, monitoring, or APEX API automation.

## Password-Safe Handling

Do not ask the user to send the Instance Administrator password in chat.

Do not run `apxchpwd.sql` through `sql_run`. SQLcl MCP commands and SQL statements are logged, and the script is interactive. Give the user a terminal sequence with placeholders and instruct them to enter the password only at the script prompt.

## Confirmation Gate

Before giving final commands or telling the user to proceed, summarize all non-secret details and require explicit confirmation.

Confirm at least:

- Action: create, reset, unlock, or bootstrap an APEX Instance Administrator.
- Environment type: self-managed/container/co-managed Cloud or managed Autonomous AI Database/APEX Service.
- Target database, PDB, or service name.
- APEX installation directory containing `apxchpwd.sql`, only for self-managed/container/co-managed Cloud.
- Instance Administrator username.
- Email address.

Use a confirmation prompt like:

```text
Please confirm these details before I give the final apxchpwd.sql run commands:

Action: <ACTION>
Environment: <SELF_MANAGED_OR_CONTAINER_OR_MANAGED_SERVICE>
Target database/PDB/service: <DB_PDB_OR_SERVICE>
APEX install directory: <APEX_INSTALL_DIR>
Instance Administrator username: <USERNAME>
Email: <EMAIL>

Do not send the password in chat. Reply with "confirmed" only if these non-secret details are correct.
```

Do not proceed from inferred values, remembered context, or partial confirmation. If anything changes, restate the full confirmed set before giving final commands.

Example response when details are missing:

```text
Yes. For an APEX Instance Administrator in the INTERNAL workspace after a self-managed/container installation, use apxchpwd.sql; this is not a normal APEX workspace user create.

First I need to confirm whether this is self-managed/container/co-managed Cloud or a managed Autonomous AI Database/APEX Service environment. If it is self-managed/container/co-managed Cloud, I also need the APEX install directory, target database/PDB/service name, desired username, and email address so I can summarize the non-secret details for confirmation. Do not send the APEX admin password in chat.
```

Example response when enough environment detail is known:

```text
Please confirm these details before I give the final apxchpwd.sql run commands:

Action: create or update an APEX Instance Administrator
Environment: <SELF_MANAGED_OR_CONTAINER_OR_MANAGED_SERVICE>
Target database/PDB/service: <DB_PDB_OR_SERVICE>
APEX install directory: <APEX_INSTALL_DIR>
Instance Administrator username: <USERNAME>
Email: <EMAIL>

Do not send the password in chat. Reply with "confirmed" only if these non-secret details are correct.
```

Example final response after explicit confirmation:

```text
Run this from a shell on the database host or container, replacing the placeholders:

cd <APEX_INSTALL_DIR>
sql /nolog
CONNECT SYS@<PDB_SERVICE> AS SYSDBA
@apxchpwd.sql

Enter the Instance Administrator username, email address, and password only when apxchpwd.sql prompts for them. If the username does not exist, the script creates it; if it exists, it updates/unlocks it.
```

If the user is working inside an Oracle container and the image did not create the APEX Instance Administrator, tell them to exec into the container, change to the unpacked APEX installation directory, connect to the database/PDB where APEX was installed as `SYS AS SYSDBA`, and run `@apxchpwd.sql`.

## Checks Before Giving Steps

Ask for or confirm:

- Whether the environment is self-managed/container-based, co-managed Cloud with host/database access, or managed Autonomous AI Database/APEX Service.
- The target database, PDB, or service name where APEX is installed.
- The APEX installation directory that contains `apxchpwd.sql`, only for self-managed/container/co-managed Cloud.
- The desired Instance Administrator username and email address, if they want a concrete runbook.

Do not require a saved SQLcl MCP connection for the password-setting step. If MCP is used at all, keep it to read-only checks such as APEX version or PDB identification, and still do not collect or log the Instance Administrator password.
