#!/usr/bin/env node

// All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

import { promises as fs } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const BASE_APP_RUNTIME_SEED_MANIFEST = "base-app-runtime-seed.manifest.json";
const REQUIRED_WORKSPACE_NAME_PLACEHOLDER = "__REQUIRED_WORKSPACE_NAME__";

function runtimeVersionToken() {
  return Date.now() + "-" + process.pid + "-" + Math.random().toString(16).slice(2, 10);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseFlag(args, name) {
  return args.includes(name);
}

function readOption(args, name, fallback = "") {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) {
    return fallback;
  }
  return args[index + 1];
}

function isPathInside(rootPath, targetPath) {
  const relative = path.relative(path.resolve(rootPath), path.resolve(targetPath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function isExistingApexAppRoot(directoryPath) {
  const markerFile = path.join(directoryPath, "application.apx");
  const markerDirectories = [".apex", "pages", "shared-components"];
  if (await pathExists(markerFile)) {
    return true;
  }
  const existingMarkers = await Promise.all(markerDirectories.map((name) => pathExists(path.join(directoryPath, name))));
  return existingMarkers.filter(Boolean).length >= 2;
}

async function directoryEntries(directoryPath) {
  try {
    return await fs.readdir(directoryPath);
  } catch {
    return [];
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

async function readJsonIfPresent(filePath) {
  if (!(await exists(filePath))) {
    return null;
  }
  return readJson(filePath);
}

function contextResolutionPath(workspaceRoot) {
  const outputRoot = String(process.env.APEXLANG_OUTPUT_ROOT || "").trim();
  return outputRoot
    ? path.join(path.resolve(outputRoot), "context-resolution.json")
    : path.join(workspaceRoot, "artifacts", "context-resolution.json");
}

async function selectedWorkspaceNameFromContext(workspaceRoot) {
  const contextPath = contextResolutionPath(workspaceRoot);
  const context = await readJsonIfPresent(contextPath);
  const workspaceName = String(context?.db_context?.workspace?.name ?? "").trim();
  return {
    workspaceName,
    contextPath
  };
}

async function resolveMaterializeWorkspaceName(workspaceRoot, explicitWorkspaceName) {
  const explicit = String(explicitWorkspaceName ?? "").trim();
  if (explicit) {
    return {
      workspaceName: explicit,
      source: "cli"
    };
  }
  const { workspaceName, contextPath } = await selectedWorkspaceNameFromContext(workspaceRoot);
  if (workspaceName) {
    return {
      workspaceName,
      source: "context-resolution",
      contextPath
    };
  }
  return {
    workspaceName: "",
    source: "missing",
    contextPath
  };
}

function dbContextFromWorkspaceArgs(args) {
  const workspaceName = String(readOption(args, "--workspace-name", "")).trim();
  const workspaceId = String(readOption(args, "--workspaceid", readOption(args, "--workspace-id", ""))).trim();
  const workspaceSource = String(readOption(args, "--workspace-source", workspaceName ? "user_provided" : "unresolved")).trim();
  return {
    db_connection_name: String(readOption(args, "--db-connection-name", readOption(args, "--db-connection", ""))).trim(),
    workspace: {
      name: workspaceName,
      workspace_id: workspaceId,
      source: workspaceSource || (workspaceName ? "user_provided" : "unresolved")
    }
  };
}

function printUsage() {
  console.log(`Usage:
  node tools/apexctl.mjs workspace probe [--db-connection-name <name>] [--workspace-name <name>] [--workspaceid <id>] [--workspace-source <source>]
  node tools/apexctl.mjs new-app materialize --app-path <path> [--workspace-name <name>]
  node tools/apexctl.mjs runtime preflight [--app-path <path>] [--db-connection-name <name>] [--execution-mode <auto|build-root|path>] [--supporting-objects] [--preflight-only] [--apex-root <path>] [--report-path <path>]
  node tools/apexctl.mjs runtime doctor [--app-path <path>] [--db-connection-name <name>] [--execution-mode <auto|build-root|path>] [--supporting-objects] [--apex-root <path>] [--report-path <path>]
  node tools/apexctl.mjs runtime verify-ui --app-path <path> [--runtime-base-url <url>] [--runtime-page-url <url>] [--runtime-provider <auto|chrome-devtools-mcp|http-fallback>] [--page <id>] [--artifact-dir <path>] [--report-path <path>]
  node tools/apexctl.mjs runtime validate --app-path <absolute_path> --db-connection-name <name> [--apex-root <path>] [--compiler-oracle-home <path>] [--execution-mode <auto|build-root|path>] [--workspaceid <id>] [--artifact-dir <path>] [--vscode-problems-path <path>] [--report-path <path>] [--transcript-path <path>]
  node tools/apexctl.mjs runtime roundtrip --app-path <path> --db-connection-name <name> [--import-intent <validate-only|validate-and-import>] [--execution-mode <auto|build-root|path>] [--target-resolution-mode <update-existing|create-new>] [--create-new-confirmed] [--workspaceid <id>] [--runtime-base-url <url>] [--runtime-page-url <url>] [--runtime-provider <auto|chrome-devtools-mcp|http-fallback>] [--page <id>] [--artifact-dir <path>] [--require-runtime-verification] [--skip-runtime-verification] [--supporting-objects] [--preflight-only] [--import-mode <auto|direct>] [--apex-root <path>] [--report-path <path>] [--transcript-path <path>]
  node tools/apexctl.mjs runtime predeploy --app-path <path> [--fix-vocab]
  node tools/apexctl.mjs apexlang validate --app-path <path> [--fix-vocab]
  node tools/apexctl.mjs apexlang compiler-truth audit --app-path <path> [--report-path <path>] [--compiler-oracle-home <path>] [--verify-component-attributes]
  node tools/apexctl.mjs diagnostics resolve-build-root --db-connection-name <name> [--apex-root <path>] [--report-path <path>]
`);
}

async function prepareRuntimeEnvironment() {
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const runtimeRoot = path.join(packageRoot, "runtime");
  const runRoot = process.env.APEXLANG_OUTPUT_ROOT
    ? path.resolve(process.env.APEXLANG_OUTPUT_ROOT)
    : path.join(os.tmpdir(), "apexlang-public-runtime-runs", runtimeVersionToken());
  await ensureDir(runRoot);
  process.env.APEXLANG_PACKAGE_ROOT = packageRoot;
  process.env.APEXLANG_RUNTIME_ROOT = runtimeRoot;
  process.env.APEXLANG_EMBEDDED_TOOLS_ROOT = path.join(packageRoot, "tools");
  process.env.APEXLANG_OUTPUT_ROOT = runRoot;
  const runtimeModule = await import(pathToFileURL(path.join(runtimeRoot, "runtime.bundle.mjs")).href + `?v=${runtimeVersionToken()}`);
  return { packageRoot, runtimeRoot, runRoot, runtimeModule };
}

async function loadBaseAppRuntimeSeedManifest(packageRoot) {
  const manifestPath = path.join(packageRoot, "templates", "base-app-structure", BASE_APP_RUNTIME_SEED_MANIFEST);
  const manifest = await readJson(manifestPath);
  return { manifestPath, manifest };
}

async function materializeNewApp(packageRoot, appPath, workspaceNameInput) {
  if (!appPath) {
    console.error("Missing required --app-path");
    return 1;
  }

  const workspaceRoot = process.cwd();
  const resolvedWorkspace = await resolveMaterializeWorkspaceName(workspaceRoot, workspaceNameInput);
  if (!resolvedWorkspace.workspaceName) {
    console.error(
      `Missing required --workspace-name and no selected workspace found in ${resolvedWorkspace.contextPath}`
    );
    return 1;
  }

  const resolvedAppPath = path.resolve(workspaceRoot, appPath);
  if (!isPathInside(workspaceRoot, resolvedAppPath)) {
    console.error(`--app-path must stay inside the current workspace: ${appPath}`);
    return 1;
  }

  const { manifestPath, manifest } = await loadBaseAppRuntimeSeedManifest(packageRoot);
  const templateRoot = path.join(packageRoot, "templates", "base-app-structure");
  const sourceRoot = String(manifest.source_root ?? "").trim();
  const scaffoldSourceRoot = sourceRoot ? path.join(templateRoot, sourceRoot) : templateRoot;
  const topLevelAllowlist = new Set((manifest.top_level_allowlist ?? []).map((entry) => String(entry)));
  const entries = (manifest.materialize_entries ?? []).map((entry) => String(entry));
  if (entries.length === 0) {
    console.error(`Base app runtime seed manifest has no materialize_entries: ${path.relative(packageRoot, manifestPath) || BASE_APP_RUNTIME_SEED_MANIFEST}`);
    return 1;
  }
  if (!(await pathExists(scaffoldSourceRoot))) {
    console.error(`Base app runtime seed source root missing: ${path.relative(packageRoot, scaffoldSourceRoot) || sourceRoot}`);
    return 1;
  }

  const targetExists = await pathExists(resolvedAppPath);
  if (targetExists) {
    if (await isExistingApexAppRoot(resolvedAppPath)) {
      console.error(`Target app path already looks like an APEX app root: ${appPath}`);
      return 1;
    }
    if ((await directoryEntries(resolvedAppPath)).length > 0) {
      console.error(`Target app path must be absent or empty: ${appPath}`);
      return 1;
    }
  }

  for (const entry of entries) {
    const topLevel = entry.split(/[\\/]/)[0];
    if (!topLevelAllowlist.has(topLevel)) {
      console.error(`Runtime seed manifest entry is outside the top-level allowlist: ${entry}`);
      return 1;
    }
    const sourcePath = path.join(scaffoldSourceRoot, entry);
    if (!(await pathExists(sourcePath))) {
      console.error(`Runtime seed entry missing from base-app-structure: ${entry}`);
      return 1;
    }
  }

  await ensureDir(resolvedAppPath);
  for (const entry of entries) {
    const sourcePath = path.join(scaffoldSourceRoot, entry);
    const destinationPath = path.join(resolvedAppPath, entry);
    await ensureDir(path.dirname(destinationPath));
    await fs.copyFile(sourcePath, destinationPath);
  }

  const deploymentPath = path.join(resolvedAppPath, "deployments", "default.json");
  if (await pathExists(deploymentPath)) {
    const deployment = await readJson(deploymentPath);
    if (!deployment.workspace || typeof deployment.workspace !== "object") {
      deployment.workspace = {};
    }
    deployment.workspace.name = resolvedWorkspace.workspaceName || REQUIRED_WORKSPACE_NAME_PLACEHOLDER;
    await writeJson(deploymentPath, deployment);
  }

  console.log(
    JSON.stringify(
      {
        status: "materialized",
        session_root: workspaceRoot,
        app_path: path.relative(workspaceRoot, resolvedAppPath) || ".",
        workspace_name: resolvedWorkspace.workspaceName,
        workspace_name_source: resolvedWorkspace.source,
        source_manifest: path.relative(packageRoot, manifestPath) || BASE_APP_RUNTIME_SEED_MANIFEST,
        materialized_entries: entries
      },
      null,
      2
    )
  );
  return 0;
}

async function runApexlangValidation(packageRoot, runtimeRoot, appPath, { fixVocab = false } = {}) {
  if (!appPath) {
    console.error("Missing required --app-path");
    return 1;
  }

  const reportDir = path.join(process.env.APEXLANG_OUTPUT_ROOT, "logs");
  await ensureDir(reportDir);
  const commands = [
    [
      "python3",
      [
        path.join(runtimeRoot, "internal", "python", "validate_apexlang_vocab.py"),
        "--app-path",
        appPath,
        "--report-path",
        path.join(reportDir, "apexlang-vocab-report.json"),
        ...(fixVocab ? ["--rewrite"] : ["--check-only"])
      ]
    ],
    [
      "python3",
      [
        path.join(runtimeRoot, "internal", "python", "validate_apexlang.py"),
        "--report-path",
        path.join(reportDir, "apexlang-dsl-report.json"),
        appPath
      ]
    ],
    [
      "python3",
      [
        path.join(runtimeRoot, "internal", "python", "validate_validations.py"),
        "--report-path",
        path.join(reportDir, "apexlang-validations-report.json"),
        appPath
      ]
    ]
  ];

  let failures = 0;
  for (const [command, commandArgs] of commands) {
    const result = spawnSync(command, commandArgs, {
      cwd: process.cwd(),
      encoding: "utf8",
      env: process.env
    });
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    if (typeof result.status !== "number" || result.status !== 0) {
      failures += 1;
    }
  }
  if (failures > 0) {
    console.log("APEXLANG_LOCAL_CHECK_FAILED");
    return 1;
  }
  console.log("APEXLANG_LOCAL_CHECK_OK");
  return 0;
}

async function handleWorkspace(runtimeModule, args) {
  const intelligencePath = path.join(process.cwd(), "assets", "workspace-intelligence.json");
  const intelligence = (await readJsonIfPresent(intelligencePath)) ?? runtimeModule.DEFAULT_CONFIG;
  const { resolution } = await runtimeModule.writeWorkspaceResolution({
    root: process.cwd(),
    intelligence,
    dbContext: dbContextFromWorkspaceArgs(args)
  });
  console.log(JSON.stringify(resolution, null, 2));
  return 0;
}

async function handleRuntime(packageRoot, runtimeModule, args) {
  const action = args[0];
  if (action === "preflight" || action === "doctor") {
    const result = await runtimeModule.runSqlclPreflight({
      appPath: readOption(args, "--app-path", ""),
      dbConnectionName: readOption(args, "--db-connection-name", readOption(args, "--db-connection", "")),
      executionMode: readOption(args, "--execution-mode", "auto"),
      supportingObjects: parseFlag(args, "--supporting-objects"),
      preflightOnly: parseFlag(args, "--preflight-only") || action === "doctor",
      doctorMode: action === "doctor",
      apexRoot: readOption(args, "--apex-root", ""),
      reportPath: readOption(args, "--report-path", "")
    });
    return result.code;
  }
  if (action === "verify-ui") {
    const result = await runtimeModule.verifyRuntimeUi({
      appPath: readOption(args, "--app-path", ""),
      runtimeBaseUrl: readOption(args, "--runtime-base-url", ""),
      runtimePageUrl: readOption(args, "--runtime-page-url", ""),
      runtimeProvider: readOption(args, "--runtime-provider", "auto"),
      pageId: readOption(args, "--page", ""),
      artifactDir: readOption(args, "--artifact-dir", "")
    });
    const reportPath = readOption(args, "--report-path", "");
    if (reportPath) {
      await ensureDir(path.dirname(reportPath));
      await fs.writeFile(reportPath, JSON.stringify(result.payload, null, 2) + "\n", "utf8");
    }
    console.log(JSON.stringify(result.payload, null, 2));
    return result.code;
  }
  if (action === "validate") {
    const result = await runtimeModule.runRuntimeValidate({
      appPath: readOption(args, "--app-path", ""),
      dbConnectionName: readOption(args, "--db-connection-name", readOption(args, "--db-connection", "")),
      executionMode: readOption(args, "--execution-mode", "auto"),
      targetResolutionMode: readOption(args, "--target-resolution-mode", "update-existing"),
      workspaceId: readOption(args, "--workspaceid", ""),
      supportingObjects: parseFlag(args, "--supporting-objects"),
      preflightOnly: parseFlag(args, "--preflight-only"),
      apexRoot: readOption(args, "--apex-root", ""),
      compilerOracleHome: readOption(args, "--compiler-oracle-home", readOption(args, "--oracle-home", "")),
      artifactDir: readOption(args, "--artifact-dir", ""),
      vscodeProblemsPath: readOption(args, "--vscode-problems-path", ""),
      reportPath: readOption(args, "--report-path", ""),
      transcriptPath: readOption(args, "--transcript-path", "")
    });
    console.log(JSON.stringify(result.payload, null, 2));
    return result.code;
  }
  if (action === "roundtrip") {
    const result = await runtimeModule.runRuntimeRoundtrip({
      appPath: readOption(args, "--app-path", ""),
      dbConnectionName: readOption(args, "--db-connection-name", readOption(args, "--db-connection", "")),
      executionMode: readOption(args, "--execution-mode", "auto"),
      importIntentChoice: readOption(args, "--import-intent", readOption(args, "--runtime-action", "validate-only")),
      importIntentSource: readOption(args, "--import-intent", readOption(args, "--runtime-action", "")) ? "cli" : "default",
      targetResolutionMode: readOption(args, "--target-resolution-mode", "update-existing"),
      createNewConfirmed: parseFlag(args, "--create-new-confirmed"),
      workspaceId: readOption(args, "--workspaceid", ""),
      runtimeBaseUrl: readOption(args, "--runtime-base-url", ""),
      runtimePageUrl: readOption(args, "--runtime-page-url", ""),
      runtimeProvider: readOption(args, "--runtime-provider", "auto"),
      pageId: readOption(args, "--page", ""),
      runtimeArtifactDir: readOption(args, "--artifact-dir", ""),
      requireRuntimeVerification: parseFlag(args, "--require-runtime-verification"),
      supportingObjects: parseFlag(args, "--supporting-objects"),
      preflightOnly: parseFlag(args, "--preflight-only"),
      importMode: readOption(args, "--import-mode", "auto"),
      apexRoot: readOption(args, "--apex-root", ""),
      reportPath: readOption(args, "--report-path", ""),
      transcriptPath: readOption(args, "--transcript-path", "")
    });
    console.log(JSON.stringify(result.payload, null, 2));
    return result.code;
  }
  if (action === "predeploy") {
    return runApexlangValidation(packageRoot, process.env.APEXLANG_RUNTIME_ROOT, readOption(args, "--app-path", ""), {
      fixVocab: parseFlag(args, "--fix-vocab")
    });
  }
  printUsage();
  return 1;
}

async function handleDiagnostics(runtimeModule, args) {
  if (args[0] !== "resolve-build-root") {
    printUsage();
    return 1;
  }
  const dbConnectionName = readOption(args, "--db-connection-name", readOption(args, "--db-connection", ""));
  if (!dbConnectionName) {
    console.error("Missing required --db-connection-name");
    return 1;
  }
  const result = await runtimeModule.resolveBuildRoot({
    dbConnectionName,
    apexRoot: readOption(args, "--apex-root", ""),
    reportPath: readOption(args, "--report-path", "")
  });
  console.log(JSON.stringify(result.payload, null, 2));
  return result.code;
}

async function main() {
  const { packageRoot, runtimeRoot, runtimeModule } = await prepareRuntimeEnvironment();
  const args = process.argv.slice(2);
  const namespace = args[0];
  const rest = args.slice(1);

  if (!namespace) {
    printUsage();
    return 1;
  }
  if (namespace === "workspace" && rest[0] === "probe") {
    return handleWorkspace(runtimeModule, rest);
  }
  if (namespace === "new-app" && rest[0] === "materialize") {
    return materializeNewApp(packageRoot, readOption(rest, "--app-path", ""), readOption(rest, "--workspace-name", ""));
  }
  if (namespace === "apexlang" && rest[0] === "validate") {
    return runApexlangValidation(packageRoot, runtimeRoot, readOption(rest, "--app-path", ""), {
      fixVocab: parseFlag(rest, "--fix-vocab")
    });
  }
  if (namespace === "apexlang" && rest[0] === "compiler-truth" && rest[1] === "audit") {
    const auditToolPath = path.join(packageRoot, "tools", "compiler-truth-audit.mjs");
    const result = spawnSync("node", [
      auditToolPath,
      "--app-path",
      readOption(rest, "--app-path", ""),
      ...(readOption(rest, "--report-path", "") ? ["--report-path", readOption(rest, "--report-path", "")] : []),
      ...(parseFlag(rest, "--verify-component-attributes") ? ["--verify-component-attributes"] : []),
      ...(readOption(rest, "--component-attributes", "") ? ["--component-attributes", readOption(rest, "--component-attributes", "")] : []),
      ...(readOption(rest, "--compiler-oracle-home", readOption(rest, "--oracle-home", "")) ? ["--compiler-oracle-home", readOption(rest, "--compiler-oracle-home", readOption(rest, "--oracle-home", ""))] : [])
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: process.env
    });
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    return typeof result.status === "number" ? result.status : 1;
  }
  if (namespace === "runtime") {
    return handleRuntime(packageRoot, runtimeModule, rest);
  }
  if (namespace === "diagnostics") {
    return handleDiagnostics(runtimeModule, rest);
  }
  printUsage();
  return 1;
}

main().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + "\n");
  process.exitCode = 1;
});
