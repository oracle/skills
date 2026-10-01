# ExaCC Read Validation Reference

## Purpose

Use this reference only after the request has passed the read-only operation gate in `SKILL.md`. It validates the scope of permitted `list` and `get` requests; it must not be used to prepare, validate, or execute a mutation.

## Rules

- First confirm the requested command is an allowed ExaCC `list` or `get` command. If it is a create, update, delete, patch, scale, move, or another denylisted operation, stop and state: `The OCI API MCP server does not support this operation as of today.`
- Use `get_oci_command_help` for the exact permitted command. Current help is authoritative for required flags, pagination, and filters.
- Require the scope indicated by current help. Do not invent OCIDs, display names, regions, or parent relationships.
- For a direct ExaCC OCID, use the matching permitted `get` command to confirm the resource type when needed for the user's request.
- For name resolution, use only a permitted ExaCC `list` command in a known scope. Present all matches and require the user to choose; never select a resource automatically.
- For child inventory, retain hierarchy proof: resolve the Exadata Infrastructure before VM Cluster Networks or DB Servers, and resolve a VM Cluster before its maintenance inventory.
- If a permitted read command fails, report the returned error and ask for corrected scope or an OCID. Do not retry by switching to a non-read command or a direct OCI CLI command.

## Pagination

When the user requests complete inventory, use `--all` only when current help supports it. Otherwise, follow the server's returned next-page token with the current-help page argument until there are no more pages, then consolidate the results.
