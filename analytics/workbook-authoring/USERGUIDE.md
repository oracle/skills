# Workbook Authoring Skill: End User Guide

This guide is for users who want to create or update Oracle Analytics workbooks through an AI coding agent.

## What this skill helps you do

1. Create new workbooks from natural-language analysis requests.
2. Generate multi-canvas and multi-visualization workbooks.
3. Apply common workbook updates, including filter changes and title updates.
4. Apply first-pass presentation polish for `compose_ootb` requests (layout normalization, title normalization, UX lint warnings).
5. Save generated workbooks to OAC and return a workbook link when save is available.
6. Optionally export previews when requested.

## Prerequisites

1. Your AI client must be configured with an Oracle Analytics Cloud MCP connection.
2. OAC MCP setup guide:
3. <https://docs.oracle.com/en/cloud/paas/analytics-cloud/acsdv/add-oracle-analytics-cloud-mcp-server-your-ai-client-preview.html>

## Installation model

1. Install one workbook-authoring skill bundle (`workbook-authoring-skills-<buildVersion>.zip`).
2. The bundle includes shared skill files plus all supported project-version compatibility profiles.
3. Installed profiles are listed in `.workbook-authoring/compatibility-profiles.json`.
4. For local `npx skills` installs, unzip `workbook-authoring-skills-installable-<buildVersion>.zip`, then run:
5. `npx skills add ./workbook-authoring`
6. For future plugin-publish workflows, use `workbook-authoring-plugin-<buildVersion>.zip`.
7. No manual asset copy is required; installable/plugin packages are self-contained.

## Choosing compatibility

1. Normally use `auto`; the skill detects server workbook compatibility through `oracle_analytics-get_server_info` when available.
2. You can explicitly request `legacy`, `standard`, or `current` when automatic discovery is unavailable or when support directs you to a profile.
3. Without server-info support, the skill uses `standard` in save-capable and disconnected environments, and `legacy` when connected without catalog save support.
4. Older release prompts (`26.05`, `26.07`, `26.09`, and `26.10`) remain accepted as deprecated aliases.

## Recommended way to ask your agent

Use clear business intent plus expected layout. Compatibility selection is automatic unless you explicitly override it.

Example requests:
1. "Create a sales performance workbook for FY2025 with 2 canvases: executive summary and regional deep dive."
2. "Use legacy compatibility. Build a workbook with bar, line, and table visuals for revenue, margin, and units by month."
3. "Update the existing workbook and rename canvas titles to Executive Summary and Trend Analysis."
4. "Create a new copy in /Shared/DV and return the workbook URL."

## Best practices

1. The agent may infer canvas names, but provide them explicitly for guaranteed first-pass labeling.
2. State whether you want a new workbook or an update to an existing one.
3. Include metric formatting requirements early (currency, decimals, abbreviations, negatives).
4. Ask for trace/diagnostics only when troubleshooting.
5. If you want to control presentation polish, ask explicitly:
6. default is `presentationPolish.mode=auto` for both `compose_ootb` and `passthrough_bound`
7. use `presentationPolish.mode=off` to disable polish
8. use `presentationPolish.mode=strict` to fail on severe UX issues before save
9. request OAC system layout templates explicitly with `analysisRequirements.canvases[].layout.templateID` using `bitech.layoutTemplate.filterLeft` or `bitech.layoutTemplate.filterTop`; default generation uses flexible role-aware archetypes
10. performance tiles stay compact by default when sharing a canvas with charts or tables, including compact NG tile label/value typography; ask for hero metrics only when you want tile-dominant canvases
11. ask for polish telemetry (`effectiveChangeCount`, `layoutChangeCount`, `styleChangeCount`, `noOpReasons`) when validating first-pass presentation quality
12. state aggregation, number formatting, filter, sort, and title intent directly; generation now verifies that applied planning is represented in the saved workbook shape
13. compact chart requests support up to two measures; use a supported detailed topology for larger measure sets instead of relying on shorthand

## What to expect from output

1. A generated workbook artifact.
2. Save result (when save capability is available).
3. Workbook link (`viewUrl`) on successful save.
4. Optional export artifact if explicitly requested.

## Known boundaries

1. The skill is optimized for deterministic workbook authoring flows, not arbitrary manual JSON editing.
2. Some visualization-specific runtime nuances may still require follow-up refinement in rare cases.
3. Advanced custom structures are supported best when clearly specified in your request.

## If something fails

1. Re-run with an explicit compatibility target only when automatic detection is unavailable or support recommends it.
2. If workbook JSON is large enough that Codex MCP argument limits are likely, ask the agent to minify the same JSON object before saving through the MCP save tool.
3. If save fails due to tool-call payload constraints, ask the agent to retry with payload compaction (minified JSON) while preserving semantic equivalence.
4. If truncation/argument-size limits persist after compaction, ask for a lean retry first with `numberFormatting.policy=none` and `presentationPolish.mode=off`, then retry minified save payload.
5. Do not use file path / `jsonPath` references for workbook save payloads; `save_catalog_content` requires inline JSON object or stringified JSON content.
6. Ask the agent to return diagnostics and contract-gap summary.
7. Confirm OAC MCP save/export capabilities are available in your environment.
8. Retry with tighter scope (single subject area, explicit measures/dimensions), then expand.
9. If strict presentation polish was enabled, ask for reported UX lint findings and retry with adjusted layout hints.

## Report an issue with a feedback package

1. Ask the agent to prepare a feedback package when generation/check/save/export/UI runtime fails.
2. Supported package modes:
3. `sanitized` (default): includes redacted summaries and masks sensitive fields; raw workbook JSON is omitted by default.
4. `full`: includes raw artifacts when available and requires explicit confirmation after a sensitive-content warning.
5. Package contract:
6. folder name: `feedback-<YYYYMMDD-HHMMSS>-<short_slug>`
7. required files: `ISSUE_REPORT.md`, `feedback_manifest.json`, `environment_context.json`
8. The agent should always create the package locally first and then ask whether you want to share it.
9. A full package can contain prompts, workbook JSON, metadata, sampled values, errors, and traces; review it before sharing.
