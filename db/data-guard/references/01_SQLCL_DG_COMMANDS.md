# SQLcl DG Commands

## Purpose
This resource explains how SQLcl exposes Oracle Data Guard Broker `DG` commands
through the SQLcl MCP server. Use it for command-surface questions, not for
lag troubleshooting or broker metadata routing.

## Use this resource when
- the user asks what `DG` commands SQLcl supports
- the user wants the SQLcl syntax for a broker `SHOW` command
- the answer should explain whether SQLcl behaves like DGMGRL for a supported
  command

## Use a different resource when
- the question is about broker properties or fixed views:
  `02_BROKER_FIXED_VIEW_ROUTING.md`
- the question is about transport lag, apply lag, or FSFO tuning:
  use `03_OVERVIEW_AND_LAG_MODEL.md` and the downstream troubleshooting files
- the answer needs troubleshooting SQL:
  `09_SQL_QUERY_COOKBOOK.md`

## Command entry point
Run broker commands in SQLcl with:

```text
DG <command>
```

When invoked from MCP, these commands should be executed through the SQLcl
command tool rather than through a plain SQL query tool.

## Supported command surface
The currently documented SQLcl `DG` coverage in this resource is limited to the
following `SHOW` commands:

```text
DG SHOW CONFIGURATION [ <property name> ];
DG SHOW CONFIGURATION VERBOSE [ <property name> ];
DG SHOW DATABASE <database name> [ <property name> ];
DG SHOW DATABASE VERBOSE <database name> [ <property name> ];
```

## Practical interpretation
- SQLcl provides a non-interactive way to run these broker inspection commands.
- SQLcl is suitable for scripting and automation when the supported `SHOW`
  command surface is sufficient.
- Output formatting may differ from DGMGRL, but the intent and command
  semantics should remain aligned for supported commands.

## Answering guidance for an agent
- If the user asks "what can I run in SQLcl for broker inspection?", answer
  from the supported commands above.
- If the user asks for broker internals, property names, or view-level routing,
  pivot to `02_BROKER_FIXED_VIEW_ROUTING.md`.
- If the user asks for diagnosis of warnings, lag, or errors in a DG
  configuration, use the troubleshooting resources instead of relying on this
  command reference alone.

## Limitations
- This resource does not redefine DGMGRL semantics.
- Advanced interactive DGMGRL workflows are outside this SQLcl-focused
  resource.
- This resource documents the currently supported `SHOW` command surface only.

## Reference context
- Applies to SQLcl
- Applies to Oracle Data Guard Broker-enabled environments
- Last reviewed for this resource set: 2026-02
