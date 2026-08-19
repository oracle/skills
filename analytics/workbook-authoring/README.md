# Workbook Authoring Skill Bundle (v1.3)

This directory contains shared assets used by workbook-authoring skills/workflows.
End users should start with `USERGUIDE.md` for outcome-focused usage instructions.

## What the skill does

1. Generates full workbook JSON with deterministic template-first composition (`regenerate_workbook`).
2. Supports bounded modify operations on existing workbooks (`modify_existing`):
3. edit filter values/operator
4. add filter-bar filter
5. edit workbook/canvas/view titles
6. Runs strict runtime validation check before save and performs deterministic patch+retry for known signatures.
7. Saves disk-first and optionally saves/exports through OAC MCP tools when available.
8. Supports project-version compatibility profiles under `.workbook-authoring/compatibility-profiles/`.
9. Enforces requirements-first compose flow (`analysisRequirements` approval gate + requirements-trace validation) before runtime validation/save.
10. Emits advisory DV Intelligence scoring (`dvIntelligenceSummary`) using deterministic workbook evidence and weighted dimension scoring.

## Prerequisites

1. OAC MCP connection must be configured in the client environment.
2. OAC MCP setup guide:
3. <https://docs.oracle.com/en/cloud/paas/analytics-cloud/acsdv/add-oracle-analytics-cloud-mcp-server-your-ai-client-preview.html>

## Installation

Install one bundle into the target root so these directories are siblings:
1. `.agents/`
2. `.claude/`
3. `.workbook-authoring/`

1. Install `workbook-authoring-skills-<buildVersion>.zip`.
2. This installs shared skill files plus all supported project-version compatibility profiles.
3. Profiles and deprecated release aliases are listed in `.workbook-authoring/compatibility-profiles.json`.
4. Installable `npx skills` option: unzip `workbook-authoring-skills-installable-<buildVersion>.zip`, then run:
5. `npx skills add ./workbook-authoring`
6. Unified plugin option (future publish workflows): unzip `workbook-authoring-plugin-<buildVersion>.zip` and use the contained plugin manifests.
7. Installable and plugin packages are self-contained under `workbook-authoring/skills/workbook-authoring/.workbook-authoring`, so no manual copy step is required.

### Selecting compatibility after install

1. The skill calls `oracle_analytics-get_server_info` when available and selects the profile containing the server's latest workbook project version.
2. User-facing targets are `auto`, `legacy`, `standard`, and `current`; expert diagnostics may use `pv-N`.
3. Request capability `oacMcpConnected` records actual OAC MCP tool availability independently of the required `discoveryMethod` field.
4. Without server-info support, connected save-capable environments use `standard`, connected environments without save use `legacy`, and disconnected authoring uses the manifest default (`standard`).
5. Existing workbooks keep their supported persisted project version in modify flows.
6. `26.05`, `26.07`, `26.09`, and `26.10` remain deprecated aliases during migration.

## Scope

1. Fresh full workbook regeneration is the primary/default path.
2. Additive modify-existing mode is limited to `edit_filter_values_or_operator` / `add_filter_bar_filter` / `edit_titles`.
2. Disk-first output (local JSON is always written before save attempts).
3. Deterministic generation flow with runtime-profile handshake.
4. MCP save + optional export loop (export runs only on explicit user request).
5. Public API/token flows remain out of scope.
6. Save-target mode is independent: update intent replaces existing workbook by default.

## Package Profiles

1. Skills package: `workbook-authoring-skills-<buildVersion>.zip` (shared assets + all supported compatibility profiles).
2. Installable package: `workbook-authoring-skills-installable-<buildVersion>.zip` (local `npx skills add ./workbook-authoring` flow).
3. Unified plugin package: `workbook-authoring-plugin-<buildVersion>.zip` (single package containing Codex + Claude manifests).
4. Internal release maintenance may still generate an intermediate add-on artifact, but it is not part of end-user installation.

## Schema Bundle

`compatibility-profiles/<PROFILE_ID>/schemas/` includes closure-complete generated schema modules plus `workbook-schema-manifest.json`.

## Model Artifacts

`compatibility-profiles/<PROFILE_ID>/model/` includes:
1. `workbook-model-index.json`
2. `workbook-authoring-constraints.json`
3. `roots/workbook_root_<version>.json`
4. `validation/schema-registry-profile.json`
5. `metadata-to-json-mapping.v1.json`
6. `filter-profiling-contracts.v1.json`
7. `calculation-contracts.v1.json`
8. `semantic-role-contracts.v1.json`
9. `presentation-polish-contracts.v1.json`
10. `dv-intelligence-contract.v1.json`
11. `version-field-catalog.json`
12. `runtime-profile-contracts.v1.json`
13. `semantic-validation-rules.v1.json`
14. `plugin-type-aliases.v1.json`
15. `viz-runtime-catalog.v1.json`
16. `viz-resolution-profiles.v1.json`
17. `edit-operation-contracts.v1.json`
18. `support-window.v1.json`
19. `regenerate-workbook-contract.v1.json`
20. `regenerate-workbook-adapter-contract.v1.json`

## Runtime Validation Check Tooling

`tools/runtime-validation-check.mjs` enforces semantic runtime invariants and deterministic patch routing.
`tools/modify-workbook.mjs` applies deterministic `edit_filter_values_or_operator` / `add_filter_bar_filter` / `edit_titles` mutations in `modify_existing` mode.
`tools/regenerate-workbook.mjs` is the canonical deterministic regenerate entrypoint.
`tools/validate-requirements-trace.mjs` validates approved requirements traceability against generated workbook JSON before runtime validation/save.
`tools/score-dv-intelligence.mjs` computes advisory DV Intelligence scoring (`dvIntelligenceSummary`) from workbook evidence and profile-based weighted dimensions.
Runtime validation check includes a schema-acceptance gate and strips known-safe internal trace keys from workbook payload before save.

Canonical regenerate command:

```bash
node .workbook-authoring/tools/regenerate-workbook.mjs --request <request.json> [--compatibility-target "<auto|legacy|standard|current|pv-N>"] [--server-project-version "<N>"] [--target-version "<deprecated YY.MM alias>"] [--output <workbook.json>]
```

Driver contract files:
1. `.workbook-authoring/compatibility-profiles/<PROFILE_ID>/model/regenerate-workbook-contract.v1.json`
2. `.workbook-authoring/compatibility-profiles/<PROFILE_ID>/model/regenerate-workbook-adapter-contract.v1.json`

The regenerate driver expects standardized adapter payload sections for discovery/describe/profiling inputs and then runs canonicalization + strict semantic validation check automatically.
For `compose_ootb`, the request must include approved `analysisRequirements` aligned with `analysisShape`; compose views must provide `purpose`, `grain`, `bindings`, `labels`, `filters`, `calculations`, and `sort`.
Field aliases and bindings may specify source-backed aggregation plus a structured number-format object. Direct-source aggregation must match `describe_data` or use `default` / `none`; unsupported overrides fail before generation. Direct sorts, applied filters, and requested titles are materialized into workbook JSON and verified before save.
Compact chart shorthand supports primary and secondary measures; larger measure arrays fail instead of being truncated. Non-empty per-view `interactions` also fail until a source-backed materializer exists; use top-level `actions` / `dataActions` for supported navigation.
For `compose_ootb`, each `analysisRequirements.canvases[].views[].filters[]` entry must include `filterID`, `columnID`, `location`, `scope`, `operator`, `default`, and `planningOutcome`.
Compose preflight request lint supports optional `composeFilterTolerance.mode`:
1. `strict` (default): required filter fields fail fast with JSON-pointer diagnostics (for example `/analysisRequirements/canvases/0/views/0/filters/0/scope`) plus the expected minimal filter object shape.
2. `tolerant`: missing `scope` auto-fills to `global`; missing `default` is derived from `adapterPayload.profiling.filterDecisionTrace.derivedDecisions` when possible, otherwise generation still fails fast with deterministic diagnostics.
Regenerate output includes `composeFilterToleranceSummary` telemetry.
The regenerate driver runs `validate-requirements-trace` before runtime validation.
Requirements-trace severity split:
1. blocking mismatches (for example unresolved bindings, aggregation/format/filter/sort/title gaps, calculation gaps, or placeholder leakage) fail compose flows.
2. warnings remain advisory and are returned in `requirementsTraceSummary.warnings`.
Regenerate output includes evidence/traceability telemetry (`evidenceLevel`, `requirementsTraceSummary`, `planningFilterMaterializationSummary`, `planningConsumptionSummary`, `filterPlanningSummary`, `componentGraphSummary`, `fallbackUsageSummary`) for deterministic auditability. Compose requires `planningConsumptionSummary.valid=true` and `unconsumedCount=0`.
`workbook.name` / `workbook.description` are treated as save-layer metadata only; the driver strips root `name` / `description` from `content.json` and returns metadata via response `saveMetadata` for orchestration handoff.
Recommend providing `analysisShape.canvases[].name` during initial generation when canvas labels are known. This field is optional, and omitted names do not block generation.
`generationStrategy` supports hybrid execution:
1. `auto` (default): uses `passthrough_bound` when bound workbook input exists, otherwise `compose_ootb`.
2. `compose_ootb`: deterministic OOTB multi-canvas/multi-viz topology composition from `analysisShape` for supported 80/20 cases.
3. `passthrough_bound`: advanced/custom escape hatch; keeps agent-provided workbook topology and relies on canonicalization + strict validation check as final gates.
`presentationPolish` is an optional additive request block for presentation-quality normalization:
1. `mode`: `auto | off | strict`
2. `layoutTemplateHints`: optional `defaultArchetype`, `byCanvasID`, `byCanvasIndex`, `defaultRegisteredTemplate`, `registeredTemplateByCanvasID`, `registeredTemplateByCanvasIndex`
3. `titlePolicy`: optional `question_oriented | preserve_input`
4. defaults: `compose_ootb -> auto`, non-`compose_ootb -> auto` unless explicitly disabled
5. OAC system registered layout templates are supported as source-backed layout intent/zones: `bitech.layoutTemplate.filterLeft` and `bitech.layoutTemplate.filterTop`
6. use `analysisRequirements.canvases[].layout.templateID` for explicit per-canvas registered template selection; registered templates are not auto-applied as the default layout engine
7. generated dashboard JSON stays compact by default: performance tiles are KPI strip cells with compact NG tile typography, and three/four-view canvases should fit the visible workbook surface unless long scrolling is intentional
8. strict mode fails generation on severe UX lint findings before save
9. response summary includes polish effect telemetry: `effectiveChangeCount`, `layoutChangeCount`, `styleChangeCount`, `noOpReasons`

Canonicalization + semantic validation check sequence:

```bash
node .workbook-authoring/tools/runtime-validation-check.mjs --input <workbook.json> [--compatibility-target "<auto|legacy|standard|current|pv-N>"] [--server-project-version "<N>"] [--target-version "<deprecated YY.MM alias>"] --requested-plugin-type "<pluginType>" --discovery-method "<search_catalog|discover_data>" --save-available "<true|false>" --export-available "<true|false>" [--export-requested "<true|false>"] --apply-known-patches --in-place
```

Then run strict semantic validation:

```bash
node .workbook-authoring/tools/runtime-validation-check.mjs --input <workbook.json> [--compatibility-target "<auto|legacy|standard|current|pv-N>"] [--server-project-version "<N>"] [--target-version "<deprecated YY.MM alias>"] --requested-plugin-type "<pluginType>" --discovery-method "<search_catalog|discover_data>" --save-available "<true|false>" --export-available "<true|false>" [--export-requested "<true|false>"]
```

If validation check returns `INPUT_ARTIFACT_NOT_READY`, generation/check ordering was violated or the file was still incomplete. Rerun the validation check after generation completes.
Runtime validation check capability inputs are mandatory and must come from runtime tool detection. Missing `--discovery-method`, `--save-available`, or `--export-available` causes deterministic `MISSING_EXECUTION_CAPABILITY_INPUT`.
Pass `--compatibility-target` only for explicit user intent and `--server-project-version` only from `oracle_analytics-get_server_info`; otherwise the shared resolver applies capability/offline fallback policy.

Patch + retry preparation:

```bash
node .workbook-authoring/tools/runtime-validation-check.mjs \
  --input <workbook.json> \
  --target-version "<YY.MM>" \
  --discovery-method "<search_catalog|discover_data>" \
  --save-available "<true|false>" \
  --export-available "<true|false>" \
  [--export-requested "<true|false>"] \
  [--version-selection-reason "<default_policy|user_requested_newer|required_newer_behavior|capability_heuristic_2607|capability_heuristic_2607_missing_fallback_latest|capability_heuristic_2605|capability_heuristic_2605_missing_fallback_latest|validation_fallback|session_sticky>"] \
  --runtime-error "<error text>" \
  --apply-known-patches \
  --in-place
```

Modify-mode deterministic mutation:

```bash
node .workbook-authoring/tools/modify-workbook.mjs \
  --input <workbook.json> \
  --authoring-mode modify_existing \
  --operation add_filter_bar_filter \
  --source-mode catalog_read \
  --resolved-workbook-id "<targetId>" \
  --confirmation-state confirmed \
  --edit-spec-json '{"columnID":"dim_region"}' \
  --in-place
```

## Canonical Templates

`templates/` keeps stable template IDs while upgrading internals to runtime-valid baseline structures.

`template-index.json` now declares:
1. runtime contract family per template
2. default/fallback dialect metadata
3. required semantic validation checks

## Authoring Policy

1. Requested viz -> save target resolution -> metadata discovery -> required ANSI-first filter profiling with Logical SQL fallback -> resolution profile map -> runtime family -> canonical scaffold -> mapping -> canonicalization check -> strict validation check.
2. Regenerate strategy defaults to hybrid auto-routing:
3. use OOTB composition when no bound workbook is provided.
4. use passthrough escape hatch when bound workbook is provided.
5. Alias mapping is compatibility metadata only; resolution profiles are the primary plugin contract.
6. Mapping includes metric-fit evaluation and workbook-local calc auto gap fill using `calculation-contracts.v1.json`.
7. Viz-lock policy is strict by default: requested plugin type must match final plugin type unless explicit fallback override provides target plugin type + reason.
8. Runtime resolves contracts/templates/schemas from `.workbook-authoring/compatibility-profiles/<PROFILE_ID>/...`.
9. Runtime selects compatibility by explicit target, deprecated release alias, existing workbook project version, detected server project version, capability fallback, then manifest offline default.
10. Capability routing drives behavior: discovery uses `find_matching_datasources` first when available, then `search_catalog` for authoritative catalog resolution, with `discover_data` only as compatibility fallback when newer discovery tools are unavailable; save/export tool absence is non-fatal and yields disk-only outcome.
11. `generate -> check -> save -> optional_export` must run sequentially (no parallel orchestration between these steps).
12. Canonicalization check must seed runtime defaults (`parameters._version`, color/shape measure domain scaffolding) before strict semantic validation check and save.
13. Save success returns `viewUrl` immediately; export follows only when explicitly requested by user intent.
14. If workbook JSON is large enough that Codex MCP argument truncation/transport limits are likely, minify the same object before the first MCP save call and verify canonical deep equivalence.
15. For save payload truncation/argument-size failures after compaction, run one lean retry using `numberFormatting.policy=none` and `presentationPolish.mode=off`, then retry with minified JSON payload.
16. Known runtime errors use one deterministic patch + one retry.
17. Server sample workbook inspection is fallback-only.
18. Default user-facing output is concise: local path (if generated), saved workbook id/path (or disk-only outcome), `viewUrl` on save success, selected `compatibilityTarget`, and export summary only when explicitly requested.
19. Detailed trace output is opt-in only and should be emitted only when user explicitly requests `trace`, `debug`, `diagnostics`, or sets `traceRequested=true`.
20. Save target policy is mandatory:
21. update/change requests resolve to `replace_existing` and save by workbook `id`.
22. explicit new/copy requests resolve to `create_new` and save by `parentId` + `name`.
23. unresolved/ambiguous update target must fail fast (no silent duplicate workbook creation).
24. When trace output is requested, expose only `compatibilityTarget`, `executionMode`, `reasonForVersionSelection`, `capabilitySource`, `saveToolDetected`, `exportToolDetected`, `discoveryMethod`, `saveAvailable`, `exportAvailable`, `exportRequested`, `generationStrategyRequested`, `generationStrategyApplied`, `compositionCoverage`, `unsupportedTopologyReasons`, plus resolution/filter/modify trace blocks; never expose internal track keys/projectVersion IDs.
