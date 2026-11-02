#!/usr/bin/env node

/**
 * Standalone SQLcl preflight probe for PATH and build-root runtime capabilities.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { apexlangOutputRoot, isPackagedSkillRuntime } from "./lib/common.mjs";
import {
  buildMissingConnectionResult,
  describeRuntimeSelection,
  normalizeExecutionMode,
  resolveBuildRootInfo,
  selectRuntimeCandidate
} from "./runtime_resolution.mjs";

/**
 * Read a CLI option from process arguments for the standalone preflight script.
 */
function readOption(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) {
    return fallback;
  }
  return process.argv[index + 1];
}

/**
 * Run a probe command synchronously and return normalized output metadata.
 */
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    input: options.input
  });
  return {
    code: typeof result.status === "number" ? result.status : 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
    error: result.error ? String(result.error.message || result.error) : ""
  };
}

/**
 * Check command help output for a case-insensitive capability phrase.
 */
function hasWord(output, word) {
  return new RegExp(`\\b${word}\\b`, "i").test(output);
}

/**
 * Locate the sql executable on PATH and record the selected entrypoint.
 */
function pickPathSqlcl() {
  const candidates = process.platform === "win32" ? ["sql.exe", "sql"] : ["sql", "sql.exe"];
  for (const candidate of candidates) {
    const result = run(candidate, ["-v"]);
    if (!result.error) {
      return { executable: candidate, version: result.output };
    }
  }
  return null;
}

/**
 * Probe PATH SQLcl for APEX validate, import, and export command support.
 */
function probePathSqlcl(executable) {
  const apex = run(executable, ["/nolog"], { input: "help apex\nexit\n" });
  const validate = run(executable, ["/nolog"], { input: "help apex validate\nexit\n" });
  const imp = run(executable, ["/nolog"], { input: "help apex import\nexit\n" });
  const exp = run(executable, ["/nolog"], { input: "help apex export\nexit\n" });
  const result = {
    candidate: "path",
    runtime_entrypoint: "sql on PATH",
    authenticated_connect_order: ["sql -name <db_connection_name>", "sql <db_connection_name>", "sql /nolog + connect <db_connection_name>"],
    sqlcl_found: true,
    executable,
    version_raw: "",
    version_recorded: false,
    apex_command_available: hasWord(apex.output, "apex"),
    apex_validate_available: hasWord(validate.output, "validate"),
    apex_import_available: hasWord(imp.output, "import"),
    apex_export_available: hasWord(exp.output, "export"),
    required_runtime_commands_available: false,
    runtime_validate_enabled: false,
    runtime_import_enabled: false,
    runtime_export_enabled: false,
    capability_state: "sqlcl_missing",
    notes: []
  };

  const version = run(executable, ["-v"]);
  result.version_raw = version.output;
  result.version_recorded = Boolean(version.output);
  result.runtime_validate_enabled = result.apex_command_available && result.apex_validate_available;
  result.required_runtime_commands_available =
    result.apex_command_available && result.apex_validate_available && result.apex_import_available;
  result.runtime_import_enabled = result.required_runtime_commands_available;
  result.runtime_export_enabled = result.apex_command_available && result.apex_export_available;
  if (result.required_runtime_commands_available) {
    result.capability_state = "path_sqlcl_apex_validate_import";
  } else if (result.runtime_validate_enabled) {
    result.capability_state = "path_sqlcl_apex_validate_only";
  } else if (result.apex_command_available) {
    result.capability_state = "path_sqlcl_apex_base";
  } else {
    result.capability_state = "path_sqlcl_db_only";
  }
  if (!result.required_runtime_commands_available) {
    result.notes.push("PATH SQLcl is present, but validate/import capability is incomplete.");
  }
  return result;
}

/**
 * Probe the resolved build-root APEX CLI for SQLcl-backed runtime capabilities.
 */
function probeBuildRootRuntime(buildRootInfo) {
  const result = {
    candidate: "build-root",
    runtime_entrypoint: "apex sql from resolved build root",
    authenticated_connect_order: ["apex sql (resolved build root)", "sql -name <db_connection_name>", "sql <db_connection_name>", "sql /nolog + connect <db_connection_name>"],
    resolved_apex_build_root: buildRootInfo.resolved_apex_build_root,
    recommended_cwd: buildRootInfo.recommended_cwd,
    apex_cli_found: false,
    executable: "apex",
    version_raw: "",
    version_recorded: false,
    apex_command_available: false,
    apex_validate_available: false,
    apex_import_available: false,
    apex_export_available: false,
    required_runtime_commands_available: false,
    runtime_validate_enabled: false,
    runtime_import_enabled: false,
    runtime_export_enabled: false,
    capability_state: "build_root_unavailable",
    notes: []
  };

  if (buildRootInfo.status !== "pass") {
    result.capability_state = "build_root_unresolved";
    result.notes.push(buildRootInfo.reason || "build_root_unresolved");
    return result;
  }

  const help = run("apex", ["--help"], { cwd: buildRootInfo.recommended_cwd });
  if (help.error || (!help.output && help.code !== 0)) {
    result.capability_state = "build_root_apex_cli_missing";
    result.notes.push(help.error || "apex CLI is not available from the resolved build root.");
    return result;
  }

  const sqlHelp = run("apex", ["sql", "--help"], { cwd: buildRootInfo.recommended_cwd });
  const validateHelp = run("apex", ["validate", "--help"], { cwd: buildRootInfo.recommended_cwd });
  const importHelp = run("apex", ["import", "--help"], { cwd: buildRootInfo.recommended_cwd });
  const exportHelp = run("apex", ["export", "--help"], { cwd: buildRootInfo.recommended_cwd });
  result.apex_cli_found = true;
  result.version_raw = help.output;
  result.version_recorded = Boolean(help.output);
  result.apex_command_available = hasWord(sqlHelp.output, "SQLcl");
  result.apex_validate_available = hasWord(validateHelp.output, "Validate APEX");
  result.apex_import_available = hasWord(importHelp.output, "Import one or more apps");
  result.apex_export_available = hasWord(exportHelp.output, "Export one or more apps");
  result.runtime_validate_enabled = result.apex_command_available && result.apex_validate_available;
  result.required_runtime_commands_available =
    result.apex_command_available && result.apex_validate_available && result.apex_import_available;
  result.runtime_import_enabled = result.required_runtime_commands_available;
  result.runtime_export_enabled = result.apex_export_available;
  if (result.required_runtime_commands_available) {
    result.capability_state = "build_root_apex_sql_validate_import";
  } else if (result.runtime_validate_enabled) {
    result.capability_state = "build_root_apex_sql_validate_only";
  } else if (result.apex_cli_found) {
    result.capability_state = "build_root_apex_cli_only";
  }
  if (!result.required_runtime_commands_available) {
    result.notes.push("Resolved build root is present, but apex CLI validate/import capability is incomplete.");
  }
  return result;
}

const dbConnectionName = readOption("--db-connection-name", readOption("--db-connection", ""));
const executionMode = normalizeExecutionMode(readOption("--execution-mode", "auto"));
const apexRoot = resolve(readOption("--apex-root", resolve(os.homedir(), "apex")));
const defaultReportPath = isPackagedSkillRuntime()
  ? resolve(apexlangOutputRoot(), "logs", "runtime-preflight.json")
  : resolve(process.cwd(), "artifacts/logs/runtime-preflight.json");
const reportPath = resolve(readOption("--report-path", defaultReportPath));

const pathSqlcl = (() => {
  const sqlcl = pickPathSqlcl();
  if (!sqlcl) {
    return {
      candidate: "path",
      runtime_entrypoint: "sql on PATH",
      authenticated_connect_order: ["sql -name <db_connection_name>", "sql <db_connection_name>", "sql /nolog + connect <db_connection_name>"],
      sqlcl_found: false,
      executable: "",
      version_raw: "",
      version_recorded: false,
      apex_command_available: false,
      apex_validate_available: false,
      apex_import_available: false,
      apex_export_available: false,
      required_runtime_commands_available: false,
      runtime_validate_enabled: false,
      runtime_import_enabled: false,
      runtime_export_enabled: false,
      capability_state: "sqlcl_missing",
      notes: ["sql was not found on PATH."]
    };
  }
  return probePathSqlcl(sqlcl.executable);
})();

const buildRootInfo = dbConnectionName
  ? resolveBuildRootInfo({ dbConnectionName, apexRoot })
  : buildMissingConnectionResult(apexRoot);

const buildRootRuntime = probeBuildRootRuntime(buildRootInfo);
const selectedRuntime = selectRuntimeCandidate(executionMode, pathSqlcl, buildRootRuntime);
const selection = describeRuntimeSelection({
  executionMode,
  selectedRuntime,
  buildRootInfo,
  pathSqlcl
});

const status = {
  timestamp: new Date().toISOString(),
  platform: process.platform,
  db_connection_name: dbConnectionName,
  connection_signature: buildRootInfo.connection_signature,
  execution_mode_requested: executionMode,
  execution_mode_used: selectedRuntime?.candidate ?? "",
  reason: selection.reason,
  runtime_selection_note: selection.note,
  runtime_entrypoint: selectedRuntime?.runtime_entrypoint ?? "",
  resolved_apex_build_root: buildRootInfo.resolved_apex_build_root,
  authenticated_connect_order: selectedRuntime?.authenticated_connect_order ?? [],
  sqlcl_found: Boolean(selectedRuntime?.required_runtime_commands_available),
  sqlcl_executable: selectedRuntime?.executable ?? "",
  sqlcl_version_raw: selectedRuntime?.version_raw ?? "",
  sqlcl_version_recorded: Boolean(selectedRuntime?.version_recorded),
  apex_command_available: Boolean(selectedRuntime?.apex_command_available),
  apex_validate_available: Boolean(selectedRuntime?.apex_validate_available),
  apex_import_available: Boolean(selectedRuntime?.apex_import_available),
  apex_export_available: Boolean(selectedRuntime?.apex_export_available),
  required_runtime_commands_available: Boolean(selectedRuntime?.required_runtime_commands_available),
  runtime_validate_enabled: Boolean(selectedRuntime?.runtime_validate_enabled),
  runtime_import_enabled: Boolean(selectedRuntime?.runtime_import_enabled),
  runtime_export_enabled: Boolean(selectedRuntime?.runtime_export_enabled),
  capability_state: selectedRuntime?.capability_state ?? "runtime_unavailable",
  path_sqlcl: pathSqlcl,
  build_root_runtime: {
    ...buildRootInfo,
    ...buildRootRuntime
  },
  notes: []
};

if (!selectedRuntime) {
  status.notes.push(selection.note);
}
status.notes.push(...pathSqlcl.notes);
status.notes.push(...buildRootRuntime.notes);

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(status, null, 2));
process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
process.exitCode = selectedRuntime ? 0 : 1;
