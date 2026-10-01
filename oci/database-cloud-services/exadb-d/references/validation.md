# ExaDB-D Read Validation Reference

## Purpose

Use this reference only after the request has passed the read-only operation gate in `SKILL.md`. It validates the scope of permitted `list` and `get` requests; it must not be used to prepare, validate, or execute a mutation.

## Rules

- First confirm that the requested command is an allowed ExaDB-D `list` or `get` command. If it is a create, update, delete, patch, scale, move, or another denylisted operation, stop and state: `The OCI API MCP server does not support this operation as of today.`
- Use `get_oci_command_help` for the exact allowed subcommand. Current help is authoritative for required flags, pagination, and filters.
- Require an explicit region whenever current help requires `--region`. Never silently use the profile region.
- Require the scope indicated by current help. Do not invent OCIDs, display names, regions, or parent relationships.
- For a direct ExaDB-D OCID, use the matching `get` command to confirm the resource type when that confirmation is needed for the user's request.
- For name resolution, use only an allowed ExaDB-D `list` in a known scope. Present all matches and require the user to choose; never select a resource automatically.
- Do not run non-ExaDB-D commands to resolve or validate compartments, VCNs, subnets, NSGs, identity, or regions. Use a matching dependency skill where available, otherwise request the relevant OCID or explicit region from the user.
- For databases and PDBs, retain hierarchy proof: inventory databases through a Cloud VM Cluster, and inventory PDBs through their database/CDB.
- If an allowed read command fails, report the returned error and ask for corrected scope or an OCID. Do not retry by switching to a mutation or a direct OCI CLI command.

## Pagination

When the user requests complete inventory, use `--all` only when current help supports it. Otherwise, follow the server's returned next-page token with the current-help page argument until there are no more pages, then consolidate the results.
