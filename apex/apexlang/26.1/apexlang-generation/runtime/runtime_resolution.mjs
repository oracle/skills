/**
 * Pure runtime resolution helpers for import intent, build-root lookup, and candidate selection.
 */
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const DOTTED_SIGNATURE_PATTERN = /(?<version>\d+(?:\.\d+){2,})[_-](?<build>\d+)/g;
const UNDERSCORED_BUILD_SIGNATURE_PATTERN = /(?<major>\d+)_(?<minor>\d+)_(?<patch>\d+)_(?<build>\d+)/g;
const EXECUTION_MODES = new Set(["auto", "path", "build-root"]);
const RUNTIME_ACTIONS = new Set(["validate-only", "validate-and-import"]);
/**
 * Direct CLI reminder for explicit import intent; agent UX defaults to check-only and offers GUI import choices after the live APEXlang check.
 */
export const IMPORT_INTENT_PROMPT =
  "Direct runtime roundtrip calls require an import intent. Codex workflows default to checking APEXlang code and offer GUI import choices after the live APEXlang check.";

/**
 * Normalize runtime execution mode input to auto, build-root, or path.
 */
export function normalizeExecutionMode(value) {
  return EXECUTION_MODES.has(value) ? value : "auto";
}

/**
 * Normalize legacy runtime action wording to import-intent-compatible values.
 */
export function normalizeRuntimeAction(value) {
  return RUNTIME_ACTIONS.has(value) ? value : "";
}

/**
 * Resolve and validate the per-run validate-only versus validate-and-import decision.
 */
export function resolveImportIntent({ importIntentChoice = "", importIntentSource = "" } = {}) {
  const normalizedChoice = normalizeRuntimeAction(importIntentChoice);
  if (!normalizedChoice) {
    return {
      status: "missing",
      import_intent_prompted: false,
      import_intent_choice: "unresolved",
      import_intent_source: "",
      note: `Missing Inputs: ${IMPORT_INTENT_PROMPT}`
    };
  }
  return {
    status: "pass",
    import_intent_prompted: true,
    import_intent_choice: normalizedChoice,
    import_intent_source: importIntentSource || "test_injection",
    note: ""
  };
}

/**
 * Extract the build-root connection signature from a saved SQLcl connection name.
 */
export function parseConnectionSignature(dbConnectionName = "") {
  const dottedMatches = [...dbConnectionName.matchAll(DOTTED_SIGNATURE_PATTERN)];
  const underscoredMatches = [...dbConnectionName.matchAll(UNDERSCORED_BUILD_SIGNATURE_PATTERN)];
  if (dottedMatches.length === 0 && underscoredMatches.length === 0) {
    return null;
  }
  const dottedMatch = dottedMatches.at(-1);
  const underscoredMatch = underscoredMatches.at(-1);
  const dottedIndex = dottedMatch?.index ?? -1;
  const underscoredIndex = underscoredMatch?.index ?? -1;
  const useUnderscored = underscoredIndex > dottedIndex;
  const version = useUnderscored
    ? `${underscoredMatch.groups.major}.${underscoredMatch.groups.minor}.${underscoredMatch.groups.patch}`
    : dottedMatch.groups.version;
  const build = useUnderscored ? underscoredMatch.groups.build : dottedMatch.groups.build;
  const versionParts = version.split(".");
  if (versionParts.length < 3) {
    return null;
  }
  const buildVersion = versionParts.length > 3
    ? `${versionParts.slice(0, -1).join(".")}-${versionParts.at(-1)}`
    : version;
  return {
    version,
    build,
    build_version: buildVersion,
    signature: `${buildVersion}+${build}`
  };
}

/**
 * Build the standard build-root diagnostic payload when no DB connection is supplied.
 */
export function buildMissingConnectionResult(apexRoot = path.resolve(path.join(os.homedir(), "apex"))) {
  return {
    status: "fail",
    reason: "db_connection_name_required",
    apex_root: apexRoot,
    connection_signature: null,
    available_build_paths: [],
    candidate_paths: [],
    resolved_apex_build_root: "",
    recommended_cwd: "",
    flow_sql_present: false,
    next_action: "Provide --db-connection-name to resolve a matching build root."
  };
}

/**
 * Resolve the local APEX build root associated with a DB connection signature.
 */
export function resolveBuildRootInfo({ dbConnectionName = "", apexRoot = path.join(os.homedir(), "apex") } = {}) {
  const resolvedApexRoot = path.resolve(apexRoot);
  const signature = parseConnectionSignature(dbConnectionName);
  const result = {
    status: "fail",
    reason: "",
    apex_root: resolvedApexRoot,
    connection_signature: signature,
    available_build_paths: [],
    candidate_paths: [],
    resolved_apex_build_root: "",
    recommended_cwd: "",
    flow_sql_present: false,
    next_action: ""
  };

  try {
    const entries = readdirSync(resolvedApexRoot, { withFileTypes: true });
    result.available_build_paths = entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("build-"))
      .map((entry) => path.join(resolvedApexRoot, entry.name))
      .sort();
  } catch {
    result.reason = "apex_root_missing";
    result.next_action = "Provide a valid local apex root or override --apex-root.";
    return result;
  }

  if (!signature) {
    result.reason = "connection_alias_not_parseable";
    result.next_action = "Use a db_connection_name that encodes the APEX version/build signature.";
    return result;
  }

  const candidates = result.available_build_paths.filter((entry) =>
    path.basename(entry).startsWith(`build-${signature.build_version}+${signature.build}`)
  );
  result.candidate_paths = candidates;

  const validCandidates = candidates.filter((entry) => existsSync(path.join(entry, "core", "flow.sql")));
  if (candidates.length === 0) {
    result.reason = "matching_build_not_found";
    result.next_action = "Install or restore the matching local APEX build.";
    return result;
  }
  if (validCandidates.length === 0) {
    result.reason = "matching_build_missing_core_flow";
    result.next_action = "Use a complete APEX build root that contains core/flow.sql.";
    return result;
  }
  if (validCandidates.length > 1) {
    result.reason = "matching_build_ambiguous";
    result.candidate_paths = validCandidates;
    result.next_action = "Resolve the matching build root explicitly.";
    return result;
  }

  result.status = "pass";
  result.reason = "resolved";
  result.resolved_apex_build_root = validCandidates[0];
  result.recommended_cwd = validCandidates[0];
  result.flow_sql_present = true;
  result.next_action = "Use this build root for build-root runtime execution or diagnostics.";
  return result;
}

/**
 * Choose the usable runtime candidate according to requested execution mode.
 */
export function selectRuntimeCandidate(executionMode, pathSqlcl, buildRootRuntime) {
  const normalizedMode = normalizeExecutionMode(executionMode);
  if (normalizedMode === "path") {
    return pathSqlcl.required_runtime_commands_available ? pathSqlcl : null;
  }
  if (normalizedMode === "build-root") {
    return buildRootRuntime.required_runtime_commands_available ? buildRootRuntime : null;
  }
  if (buildRootRuntime.required_runtime_commands_available) {
    return buildRootRuntime;
  }
  if (pathSqlcl.required_runtime_commands_available) {
    return pathSqlcl;
  }
  return null;
}

/**
 * Explain why a runtime candidate was selected or why none was available.
 */
export function describeRuntimeSelection({ executionMode, selectedRuntime, buildRootInfo, pathSqlcl }) {
  const normalizedMode = normalizeExecutionMode(executionMode);
  if (selectedRuntime?.candidate === "build-root") {
    return {
      reason: buildRootInfo.reason || "resolved",
      note: "Selected the build-root runtime resolved from db_connection_name."
    };
  }
  if (selectedRuntime?.candidate === "path") {
    if (normalizedMode === "path") {
      return {
        reason: "path_runtime_forced",
        note: "Selected PATH SQLcl because execution mode was forced to path."
      };
    }
    if (buildRootInfo.status !== "pass") {
      return {
        reason: buildRootInfo.reason || "build_root_unavailable",
        note: "Selected PATH SQLcl because no connection-derived build-root runtime was available."
      };
    }
    return {
      reason: "path_runtime_selected",
      note: "Selected PATH SQLcl because the connection-derived build-root runtime was not capability-ready."
    };
  }
  if (normalizedMode === "build-root") {
    return {
      reason: buildRootInfo.reason || "build_root_unavailable",
      note: "Build-root mode failed because the connection-derived build-root runtime was unavailable."
    };
  }
  return {
    reason: pathSqlcl?.capability_state || buildRootInfo.reason || "runtime_unavailable",
    note: "No executable runtime path was available after evaluating connection-derived build-root and PATH SQLcl candidates."
  };
}
