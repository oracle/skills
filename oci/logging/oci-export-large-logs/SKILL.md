---
name: oci-export-large-logs
description: Export complete OCI Logging Search results to JSON through native OCI CLI pagination. Use when Console or CLI results are capped or truncated, when service, custom, audit, load-balancer, or VCN flow logs span high-volume or multi-day intervals, or when an auditable read-only export must preserve every returned event, including repeated log IDs.
---

# Export Large OCI Logs

## Overview

Export every page returned by OCI Logging Search without assuming that a log event ID is globally unique. Use the bundled exporter to follow `opc-next-page`, stream results to disk, and atomically publish the output only after all pages succeed.

The operation is read-only. Do not change log configuration, retention, capture filters, or monitored resources.

## Workflow

1. Confirm the OCI profile, region, exact search query, UTC start and end times, and output path.
2. Prefer a deterministic raw-event query ending in `sort by datetime asc`.
3. Run `scripts/export_oci_logs.py`. Request approval if OCI access must run outside the sandbox.
4. Require an exit status of zero and a final summary with `"complete": true`.
5. Report the requested UTC coverage, page count, result count, empty-result status, and first and last returned timestamps.
6. Keep production log exports out of source control unless the user explicitly requests otherwise.

## Query Scope

Use the full compartment, log-group, and log scope when available:

```text
search "COMPARTMENT_OCID/LOG_GROUP_OCID/LOG_OCID" | sort by datetime asc
```

If only a log OCID is known, use a broader accessible compartment or tenancy and filter on `oracle.logid`:

```text
search "COMPARTMENT_OR_TENANCY_OCID"
| where oracle.logid = 'LOG_OCID'
| sort by datetime asc
```

A zero-result search is a valid export, but it does not prove that the supplied scope is correct. If the log should contain data, obtain the exact Advanced Mode query from the Console and verify `LOG_CONTENT_READ` plus read access to the containing log group.

## Export

```bash
python3 <skill-dir>/scripts/export_oci_logs.py \
  --profile PROFILE \
  --region eu-frankfurt-1 \
  --search-query 'search "COMPARTMENT_OCID/LOG_GROUP_OCID/LOG_OCID" | sort by datetime asc' \
  --time-start 2026-07-01T00:00:00Z \
  --time-end 2026-07-04T00:00:00Z \
  --output complete-logs.json
```

Use `--help` for optional authentication, config-file, OCI executable, and per-page limit controls.

The script writes progress to stderr and one machine-readable JSON summary to stdout. It writes one response page at a time to a temporary file, preserves every result in service order, rejects malformed responses and repeated page tokens, and replaces the destination only after successful completion.

## Output Contract

The output remains a JSON object with:

- `results`: every raw search result, without ID-based deduplication or schema-specific rewriting
- `summary.complete`: `true` only after the final page is written
- `summary.empty`: whether the search returned zero results
- `summary.pagesFetched` and `summary.resultCount`
- `summary.timeStart`, `summary.timeEnd`, `summary.searchQuery`, `summary.profile`, and `summary.region`
- `summary.firstResultTimestamp` and `summary.lastResultTimestamp` when a recognizable timestamp exists

Do not require `summary.resultCount` to equal a count of unique `data.logContent.id` values. VCN flow logs can repeat that ID across distinct events.

## Guardrails

- Never treat one capped response as complete when `opc-next-page` is present.
- Never deduplicate different results solely by `data.logContent.id`.
- Preserve raw field values and repeated events.
- Keep search scope and time bounds unchanged while traversing page tokens.
- Surface OCI CLI stderr and exit nonzero without replacing an existing output.
- Treat summarized or aggregated queries as query results, not as raw log-event exports.

## Sources

- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/logging-search/search-logs.html
- https://docs.oracle.com/en-us/iaas/Content/Logging/Concepts/searchinglogs.htm
- https://docs.oracle.com/en-us/iaas/Content/Logging/Reference/query_language_specification.htm
- https://docs.oracle.com/en-us/iaas/Content/API/Concepts/usingapi.htm#nine
