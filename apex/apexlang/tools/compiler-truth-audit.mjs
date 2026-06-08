#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildOracleNormalizedMap, ORACLE_NORMALIZER_VERSION, readOracleRuntimeMetadata } from "./query-valid-props-normalize.mjs";
import { resolveOracleRuntime } from "./query-valid-props-runtime.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const IS_PACKAGED_ROOT = path.basename(path.dirname(SCRIPT_PATH)) === "tools";
const REPO_ROOT = IS_PACKAGED_ROOT
  ? path.resolve(path.dirname(SCRIPT_PATH), "..")
  : path.resolve(path.dirname(SCRIPT_PATH), "../../..");
const DEFAULT_SOURCE_COMPONENT_ATTRIBUTES = path.join(REPO_ROOT, "ai-context", "memory-bank", "component-attributes.json");
const DEFAULT_PACKAGED_COMPONENT_ATTRIBUTES = path.join(REPO_ROOT, "assets", "component-attributes.json");
const SUPPORTED_COMPONENTS = new Set([
  "app",
  "page",
  "region",
  "pageItem",
  "button",
  "dynamicAction",
  "process",
  "computation",
  "validation"
]);
const COMPILER_METADATA_PROPERTY_ALIASES = new Map([
  ["app.authentication.scheme", "authenticationScheme"]
]);

function defaultCommand() {
  return IS_PACKAGED_ROOT
    ? "node tools/compiler-truth-audit.mjs"
    : `node ${["ai-context", "apexlang", "compiler-prop-map", "compiler-truth-audit.mjs"].join("/")}`;
}

function nextValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseArgs(argv) {
  const args = {
    appPath: "",
    reportPath: "",
    componentAttributes: "",
    compilerOracleHome: "",
    verifyComponentAttributes: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--app-path":
        args.appPath = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--report-path":
        args.reportPath = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--component-attributes":
        args.componentAttributes = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--compiler-oracle-home":
      case "--oracle-home":
        args.compilerOracleHome = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--verify-component-attributes":
        args.verifyComponentAttributes = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  const command = defaultCommand();
  console.log(`Usage:
  ${command} --app-path <path> [--report-path <path>] [--verify-component-attributes]
  ${command} --verify-component-attributes [--component-attributes <path>] [--report-path <path>]

Options:
  --app-path <path>                 Application root or directory containing .apx files to audit
  --report-path <path>              Write the compiler-truth audit report as JSON
  --component-attributes <path>     Override component-attributes.json path
  --compiler-oracle-home <path>     Oracle VS Code extension, dbtools, SQLcl home, or compiler jar override for compiler metadata
  --oracle-home <path>              Backward-compatible alias for --compiler-oracle-home
  --verify-component-attributes     Verify component-attributes.json provenance against compiler metadata
  --help                            Show this help
`);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectApxFiles(targetPath) {
  const resolved = path.resolve(targetPath);
  if (!(await pathExists(resolved))) {
    throw new Error(`APEXlang audit target does not exist: ${targetPath}`);
  }
  const stat = await fs.stat(resolved);
  if (stat.isFile()) {
    return resolved.endsWith(".apx") ? [resolved] : [];
  }
  const files = [];
  async function walk(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && full.endsWith(".apx")) {
        files.push(full);
      }
    }
  }
  await walk(resolved);
  return files.sort();
}

function buildCompilerContext(oracleHome) {
  const oracleRuntime = resolveOracleRuntime(oracleHome || undefined);
  const { metadata, buildId, metadataHash } = readOracleRuntimeMetadata(oracleRuntime.compilerJarPath);
  const map = buildOracleNormalizedMap({
    metadata,
    compilerJarPath: oracleRuntime.compilerJarPath,
    oracleHome: oracleRuntime.oracleHome,
    source: oracleRuntime.source
  });
  const provenance = {
    buildID: buildId,
    metadataHash,
    normalizerVersion: ORACLE_NORMALIZER_VERSION,
    source: oracleRuntime.source,
    oracleHome: oracleRuntime.oracleHome,
    compilerJar: oracleRuntime.compilerJarPath
  };
  return { map, provenance };
}

function firstRecordFor(map, singular, parentSingular = "") {
  const records = map.componentTypes.filter((record) => record.singular === singular);
  if (!records.length) {
    return null;
  }
  if (parentSingular) {
    const parentMatch = records.find((record) => record.parentComponentType === parentSingular);
    if (parentMatch) {
      return parentMatch;
    }
  }
  return records.length === 1 ? records[0] : records[0];
}

function nearestComponent(stack) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].kind === "component") {
      return stack[index];
    }
  }
  return null;
}

function nearestGroup(stack) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].kind === "group") {
      return stack[index];
    }
    if (stack[index].kind === "opaque") {
      return null;
    }
  }
  return null;
}

function insideOpaque(stack) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].kind === "opaque") {
      return true;
    }
    if (stack[index].kind === "component") {
      return false;
    }
  }
  return false;
}

function lineOpenCloseBalance(line) {
  let opens = 0;
  let closes = 0;
  let inSingle = false;
  let inDouble = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const prev = line[index - 1];
    if (char === "'" && !inDouble && prev !== "\\") {
      inSingle = !inSingle;
      continue;
    }
    if (char === '"' && !inSingle && prev !== "\\") {
      inDouble = !inDouble;
      continue;
    }
    if (inSingle || inDouble) {
      continue;
    }
    if (char === "{" || char === "(") opens += 1;
    if (char === "}" || char === ")") closes += 1;
  }
  return { opens, closes };
}

function addIssue(issues, filePath, lineNumber, code, message, details = {}) {
  issues.push({
    file: path.relative(process.cwd(), filePath) || path.basename(filePath),
    line: lineNumber,
    code,
    message,
    ...details
  });
}

function compilerMetadataPropertyNames(componentName, groupName, propertyName) {
  const names = [propertyName];
  const scopedKey = groupName
    ? `${componentName}.${groupName}.${propertyName}`
    : `${componentName}.${propertyName}`;
  const alias = COMPILER_METADATA_PROPERTY_ALIASES.get(scopedKey);
  if (alias && !names.includes(alias)) {
    names.push(alias);
  }
  return names;
}

function validateProperty({ issues, filePath, lineNumber, componentFrame, groupFrame, propertyName }) {
  if (!componentFrame?.record || !propertyName) {
    return;
  }
  const compilerPropertyNames = compilerMetadataPropertyNames(componentFrame.name, groupFrame?.name || "", propertyName);
  if (groupFrame) {
    const props = componentFrame.record.groups[groupFrame.name] || [];
    const match = props.find((prop) => compilerPropertyNames.includes(prop.propertyName));
    if (!match) {
      addIssue(
        issues,
        filePath,
        lineNumber,
        "COMPILER_TRUTH_PROP_UNKNOWN",
        `${componentFrame.name}.${groupFrame.name}.${propertyName} is not present in compiler metadata`,
        {
          component: componentFrame.name,
          componentTypeId: componentFrame.record.componentTypeId,
          group: groupFrame.name,
          property: propertyName
        }
      );
    }
    return;
  }

  const anyMatch = componentFrame.record.properties.some((prop) => compilerPropertyNames.includes(prop.propertyName));
  if (!anyMatch) {
    addIssue(
      issues,
      filePath,
      lineNumber,
      "COMPILER_TRUTH_PROP_UNKNOWN",
      `${componentFrame.name}.${propertyName} is not present in compiler metadata`,
      {
        component: componentFrame.name,
        componentTypeId: componentFrame.record.componentTypeId,
        property: propertyName
      }
    );
  }
}

export function auditApxText(filePath, text, map) {
  const issues = [];
  const observations = [];
  const stack = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) {
      return;
    }

    const currentComponent = nearestComponent(stack);
    const currentGroup = nearestGroup(stack);
    const opaqueScope = insideOpaque(stack);
    const propMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9]*)\s*:/);
    if (propMatch && currentComponent && !opaqueScope) {
      validateProperty({
        issues,
        filePath,
        lineNumber,
        componentFrame: currentComponent,
        groupFrame: currentGroup,
        propertyName: propMatch[1]
      });
    }

    const blockMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9]*)\b(?:\s+[^({]+?)?\s*([({])/);
    if (blockMatch) {
      const [, token, delimiter] = blockMatch;
      const parentComponent = nearestComponent(stack);
      const parentName = parentComponent?.name || "";
      const { opens, closes } = lineOpenCloseBalance(line);
      const shouldPush = opens > closes;
      if (delimiter === "(" && SUPPORTED_COMPONENTS.has(token)) {
        const record = firstRecordFor(map, token, parentName);
        if (record) {
          observations.push({
            file: path.relative(process.cwd(), filePath) || path.basename(filePath),
            line: lineNumber,
            component: token,
            componentTypeId: record.componentTypeId,
            parent: record.parentComponentType || ""
          });
          if (shouldPush) {
            stack.push({ kind: "component", name: token, record });
          }
        }
      } else if (delimiter === "{" && !opaqueScope && parentComponent?.record?.groups?.[token]) {
        if (shouldPush) {
          stack.push({ kind: "group", name: token });
        }
      } else if (shouldPush) {
        stack.push({ kind: "opaque", name: token });
      }
    }

    if (!blockMatch && propMatch) {
      const { opens, closes } = lineOpenCloseBalance(line);
      if (opens > closes) {
        stack.push({ kind: "opaque", name: propMatch[1] });
      }
    }

    const { opens, closes } = lineOpenCloseBalance(line);
    const netCloses = Math.max(0, closes - opens);
    for (let count = 0; count < netCloses && stack.length > 0; count += 1) {
      stack.pop();
    }
  });

  return { issues, observations };
}

function defaultComponentAttributesPath() {
  return IS_PACKAGED_ROOT ? DEFAULT_PACKAGED_COMPONENT_ATTRIBUTES : DEFAULT_SOURCE_COMPONENT_ATTRIBUTES;
}

async function verifyComponentAttributes(componentAttributesPath, provenance) {
  const resolvedPath = path.resolve(componentAttributesPath || defaultComponentAttributesPath());
  const issues = [];
  if (!(await pathExists(resolvedPath))) {
    issues.push({
      file: resolvedPath,
      line: 1,
      code: "COMPILER_TRUTH_COMPONENT_ATTRIBUTES_MISSING",
      message: `component-attributes.json not found: ${resolvedPath}`
    });
    return { path: resolvedPath, issues };
  }
  const payload = JSON.parse(await fs.readFile(resolvedPath, "utf8"));
  const recorded = payload.compilerProvenance || {};
  const expected = {
    buildID: provenance.buildID,
    metadataHash: provenance.metadataHash,
    normalizerVersion: provenance.normalizerVersion
  };
  for (const [key, value] of Object.entries(expected)) {
    if (recorded[key] !== value) {
      issues.push({
        file: path.relative(process.cwd(), resolvedPath) || resolvedPath,
        line: 1,
        code: "COMPILER_TRUTH_COMPONENT_ATTRIBUTES_STALE",
        message: `component-attributes.json compilerProvenance.${key} must be ${value}`,
        expected: value,
        actual: recorded[key] ?? null
      });
    }
  }
  if (recorded.coverage !== "curated_subset") {
    issues.push({
      file: path.relative(process.cwd(), resolvedPath) || resolvedPath,
      line: 1,
      code: "COMPILER_TRUTH_COMPONENT_ATTRIBUTES_COVERAGE",
      message: "component-attributes.json must declare compilerProvenance.coverage: curated_subset",
      expected: "curated_subset",
      actual: recorded.coverage ?? null
    });
  }
  return { path: resolvedPath, issues };
}

async function writeReport(reportPath, payload) {
  if (!reportPath) {
    return;
  }
  const resolvedPath = path.resolve(reportPath);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function runCompilerTruthAudit(options = {}) {
  const { map, provenance } = buildCompilerContext(options.compilerOracleHome || options.oracleHome || "");
  const issues = [];
  const observations = [];
  const targets = [];

  if (options.appPath) {
    const files = await collectApxFiles(options.appPath);
    targets.push(...files);
    for (const filePath of files) {
      const text = await fs.readFile(filePath, "utf8");
      const result = auditApxText(filePath, text, map);
      issues.push(...result.issues);
      observations.push(...result.observations);
    }
  }

  let componentAttributes = null;
  if (options.verifyComponentAttributes) {
    componentAttributes = await verifyComponentAttributes(options.componentAttributes || "", provenance);
    issues.push(...componentAttributes.issues);
  }

  const payload = {
    mode: "compiler-truth",
    status: issues.length ? "fail" : "pass",
    compilerTruth: provenance,
    targets: targets.map((target) => path.relative(process.cwd(), target) || target),
    componentAttributes,
    observations,
    issues
  };
  await writeReport(options.reportPath || "", payload);
  return { code: issues.length ? 1 : 0, payload };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.appPath && !args.verifyComponentAttributes)) {
    printHelp();
    return 0;
  }
  const result = await runCompilerTruthAudit(args);
  if (result.payload.status === "pass") {
    console.log("APEXLANG_COMPILER_TRUTH_AUDIT_OK");
  } else {
    console.log("APEXLANG_COMPILER_TRUTH_AUDIT_FAILED");
    for (const issue of result.payload.issues) {
      console.log(` - ${issue.file}:${issue.line}: ${issue.code} ${issue.message}`);
    }
  }
  return result.code;
}

const INVOKED_AS_MAIN = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (INVOKED_AS_MAIN) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
