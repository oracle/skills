/**
 * Generated packaged runtime bundle for the public APEXlang skill.
 * This keeps the public runtime direct-importable without temp copying.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  isPackagedSkillRuntime,
  apexlangToolPath,
  collectFiles,
  ensureDir,
  readJson,
  removeDir,
  runCommand,
  skillLogPath,
  sqlclToolPath,
  stableStringify,
  writeJson
} from "./lib/common.mjs";
import {
  IMPORT_INTENT_PROMPT,
  normalizeExecutionMode,
  resolveImportIntent,
  resolveBuildRootInfo
} from "./runtime_resolution.mjs";

/**
 * Draft staging helpers that isolate runtime edits before publishing app artifacts.
 */

const WORK_ROOT = path.join(os.tmpdir(), "apex-app-gen");

function timestampToken() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z");
}

function randomToken() {
  return Math.random().toString(36).slice(2, 8);
}

function withinPath(parentPath, targetPath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(targetPath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/**
 * Return the default temporary root for draft runtime working copies.
 */
function defaultDraftsRoot() {
  return WORK_ROOT;
}

/**
 * Return whether a path is safely inside the configured draft root.
 */
function isDraftPath(targetPath) {
  return withinPath(WORK_ROOT, targetPath);
}

/**
 * Create a collision-resistant draft run identifier for staging paths.
 */
function makeDraftRunId(prefix = "draft") {
  return `${prefix}-${timestampToken()}-${randomToken()}`;
}

/**
 * Create or reuse a staged application path for runtime check work.
 */
async function prepareStagedApp({
  appPath,
  finalAppPath = "",
  draftsRoot = "",
  runId = "",
  skipFinalSync = false
} = {}) {
  const requestedAppPath = path.resolve(appPath || "");
  const resolvedFinalAppPath = finalAppPath ? path.resolve(finalAppPath) : "";
  const root = path.resolve(draftsRoot || WORK_ROOT);

  if (!requestedAppPath) {
    throw new Error("prepareStagedApp requires appPath");
  }

  if (isDraftPath(requestedAppPath)) {
    const cleanupTarget = isDraftPath(requestedAppPath) ? path.dirname(requestedAppPath) : "";
    return {
      requestedAppPath,
      stagingAppPath: requestedAppPath,
      stagingRunRoot: cleanupTarget,
      finalAppPath: resolvedFinalAppPath || requestedAppPath,
      createdStagingCopy: false
    };
  }

  const runIdentifier = runId || makeDraftRunId("roundtrip");
  const stagingRunRoot = path.join(root, runIdentifier);
  const stagingAppPath = path.join(stagingRunRoot, path.basename(requestedAppPath));
  await ensureDir(stagingRunRoot);

  if (await exists(requestedAppPath)) {
    const stat = await fs.stat(requestedAppPath);
    if (!stat.isDirectory()) {
      throw new Error(`App path is not a directory: ${requestedAppPath}`);
    }
    await fs.cp(requestedAppPath, stagingAppPath, { recursive: true });
  } else {
    await ensureDir(stagingAppPath);
  }

  return {
    requestedAppPath,
    stagingAppPath,
    stagingRunRoot,
    finalAppPath: resolvedFinalAppPath || requestedAppPath,
    createdStagingCopy: true
  };
}

/**
 * Publish a staged application tree back to its final app path.
 */
async function syncStagedAppToFinal({ stagingAppPath, finalAppPath } = {}) {
  if (!stagingAppPath || !finalAppPath) {
    return { status: "skipped", reason: "final_app_path_not_provided" };
  }
  const resolvedStagingPath = path.resolve(stagingAppPath);
  const resolvedFinalPath = path.resolve(finalAppPath);
  if (resolvedStagingPath === resolvedFinalPath) {
    return { status: "skipped", reason: "staging_equals_final" };
  }

  await ensureDir(path.dirname(resolvedFinalPath));
  await removeDir(resolvedFinalPath);
  await fs.cp(resolvedStagingPath, resolvedFinalPath, { recursive: true });
  return { status: "published", reason: "" };
}

/**
 * Remove a staged draft run only when it is inside the safe draft root.
 */
async function cleanupDraftRun(stagingRunRoot) {
  if (!stagingRunRoot || !isDraftPath(stagingRunRoot)) {
    return { status: "skipped", reason: "not_a_draft_path" };
  }
  await removeDir(stagingRunRoot);
  return { status: "removed", reason: "" };
}

/**
 * Public workspace probe that discovers app, metadata, requirement, and explicit DB/workspace prompt context.
 */


/**
 * Default discovery policy for app roots, metadata files, bounded scans, and explicit DB/workspace prompts.
 */
const DEFAULT_CONFIG = {
  app_discovery: {
    standard_root: "applications",
    marker_files: ["application.apx"],
    marker_directories: [".apex", "pages", "shared-components"]
  },
  root_candidates: {
    table_metadata: ["table-metadata"],
    data_model: ["dm", "data-model", "data-models", "data-modeler"],
    api_contract: ["openapi", "apis", "api", "contracts"],
    requirements: ["specs", "requirements"]
  },
  bounded_scan: {
    max_depth: 4,
    excluded_directories: [
      ".git",
      ".vscode",
      "node_modules",
      "dist",
      "build",
      "coverage",
      ".next",
      ".turbo",
      "artifacts",
      "apex-exports"
    ],
    allowed_extensions: [".json", ".yaml", ".yml", ".md", ".sql", ".xml"]
  },
  db_prompt_flow: {
    prompt_mode: "explicit_db_connection_and_workspace_flow",
    interactive_only: true,
    discovery_steps: ["inspect_offline_schema_registry", "scan_saved_sqlcl_connections"],
    metadata_preference: "prefer_authoritative_offline_context",
    required_live_inputs: ["db_connection_name", "db_context.workspace.name"],
    auto_bind_single_saved_connection: false,
    manual_entry: {
      input_name: "db_connection_name",
      companion_input_name: "apex_workspace_name",
      workspace_context_field: "db_context.workspace.name",
      prompt: "Provide db_connection_name and the corresponding APEX workspace name for this workflow."
    },
    workspace_prompt: {
      input_name: "apex_workspace_name",
      context_field: "db_context.workspace.name",
      prompt: "Provide the APEX workspace name that corresponds to db_connection_name."
    },
    multiple_connection_prompt: {
      source: "saved_sqlcl_connections",
      prompt_mode: "select_from_list",
      empty_list_prompt:
        "No saved SQLcl connections were found. Provide db_connection_name and the corresponding APEX workspace name if live DB context is still required, or continue only with authoritative offline metadata."
    },
    offline_override: {
      prompt_mode: "explicit_opt_in",
      note: "Offline mode is selected only when the user explicitly asks for offline-only execution."
    },
    offline_behavior: {
      disables_live_metadata_validation: true,
      disables_apex_validate: true,
      disables_apex_import: true
    },
    workspace_selection: {
      prompt_mode: "explicit_workspace_name_required",
      persistence: "session_context_only",
      context_path: "APEXLANG_OUTPUT_ROOT/context-resolution.json",
      context_field: "db_context.workspace",
      materialization_behavior: "new-app materialize requires --workspace-name or session context populated from the user-provided workspace name"
    }
  }
};

function normalizeDbContext(dbContext = {}) {
  const workspace = dbContext.workspace && typeof dbContext.workspace === "object" ? dbContext.workspace : {};
  const workspaceName = String(workspace.name ?? dbContext.workspaceName ?? "").trim();
  const workspaceId = String(workspace.workspace_id ?? workspace.workspaceId ?? dbContext.workspaceId ?? "").trim();
  const source = String(workspace.source ?? dbContext.workspaceSource ?? (workspaceName ? "user_provided" : "unresolved")).trim();
  return {
    db_connection_name: String(dbContext.db_connection_name ?? dbContext.dbConnectionName ?? "").trim(),
    workspace: {
      name: workspaceName,
      workspace_id: workspaceId,
      source: source || (workspaceName ? "user_provided" : "unresolved")
    }
  };
}

function hasDbContextInput(dbContext = {}) {
  const normalized = normalizeDbContext(dbContext);
  return Boolean(
    normalized.db_connection_name ||
      normalized.workspace.name ||
      normalized.workspace.workspace_id ||
      normalized.workspace.source !== "unresolved"
  );
}

function normalizePath(root, target) {
  return path.relative(root, target) || ".";
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(target) {
  if (!(await exists(target))) {
    return null;
  }
  try {
    return JSON.parse(await fs.readFile(target, "utf8"));
  } catch {
    return null;
  }
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Classify a metadata source by filename and extension.
 */
function detectFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") {
    return "json";
  }
  if (ext === ".yaml" || ext === ".yml") {
    return "yaml";
  }
  if (ext === ".md") {
    return "markdown";
  }
  if (ext === ".sql") {
    return "sql";
  }
  if (ext === ".xml") {
    return "xml";
  }
  return ext || "text";
}

/**
 * Create the shared metadata record envelope used by all detectors.
 */
function makeBaseRecord(filePath, format, sourceClass, authorityLevel, contents) {
  const lowerText = contents.toLowerCase();
  return {
    source_class: sourceClass,
    path: filePath,
    format,
    authority_level: authorityLevel,
    objects: [],
    columns: [],
    apis: [],
    annotations_present: lowerText.includes("annotation"),
    comments_present: lowerText.includes("comment"),
    hints: [],
    gaps: []
  };
}

function normalizeObjectName(value) {
  return String(value ?? "")
    .replace(/^"+|"+$/g, "")
    .trim();
}

function objectRecord(name, kind = "object") {
  return {
    name: normalizeObjectName(name),
    kind
  };
}

function columnRecord(objectName, columnName, dataType = "") {
  return {
    object_name: normalizeObjectName(objectName),
    column_name: normalizeObjectName(columnName),
    data_type: String(dataType ?? "").trim()
  };
}

function apiRecord(method, route, sourceName = "") {
  return {
    method: String(method ?? "").toUpperCase(),
    route: String(route ?? "").trim(),
    source_name: String(sourceName ?? "").trim()
  };
}

function pushColumns(record, objectName, columns, fallbackKind = "table") {
  const cleanObjectName = normalizeObjectName(objectName);
  if (!cleanObjectName) {
    return;
  }
  record.objects.push(objectRecord(cleanObjectName, fallbackKind));
  for (const column of columns) {
    const columnName = normalizeObjectName(column.name ?? column.column_name ?? column);
    if (!columnName) {
      continue;
    }
    record.columns.push(columnRecord(cleanObjectName, columnName, column.data_type ?? column.type ?? ""));
  }
}

/**
 * Convert structured table/object metadata maps into normalized records.
 */
function parseStructuredObjectMap(record, source, preferredKind) {
  for (const [key, value] of Object.entries(source ?? {})) {
    if (!value || typeof value !== "object") {
      continue;
    }
    const lowerKey = key.toLowerCase();
    if (!["tables", "views", "objects", "entities"].includes(lowerKey)) {
      continue;
    }
    const kind = lowerKey === "entities" ? "entity" : lowerKey.slice(0, -1);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!item || typeof item !== "object") {
          continue;
        }
        const name = item.name ?? item.table_name ?? item.view_name ?? item.object_name ?? item.entity_name;
        const columns = item.columns ?? item.attributes ?? [];
        pushColumns(record, name, Array.isArray(columns) ? columns : [], kind || preferredKind);
      }
      continue;
    }
    for (const [name, item] of Object.entries(value)) {
      const columns = item?.columns ?? item?.attributes ?? [];
      pushColumns(record, name, Array.isArray(columns) ? columns : [], kind || preferredKind);
    }
  }
}

/**
 * Detect schema, API, preference, and app-path intelligence from JSON files.
 */
function detectJsonRecord(filePath, parsed, contents) {
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  if (typeof parsed.openapi === "string" || typeof parsed.swagger === "string" || parsed.paths) {
    const record = makeBaseRecord(filePath, "json", "api_contract", "authoritative", contents);
    for (const [route, definition] of Object.entries(parsed.paths ?? {})) {
      if (!definition || typeof definition !== "object") {
        continue;
      }
      const methods = Object.keys(definition).filter((key) => ["get", "post", "put", "patch", "delete", "options", "head"].includes(key.toLowerCase()));
      for (const method of methods) {
        record.apis.push(apiRecord(method, route, definition[method]?.operationId ?? ""));
      }
    }
    if (record.apis.length === 0) {
      record.gaps.push("api_operations_unresolved");
    }
    return record;
  }

  if (parsed.info && Array.isArray(parsed.item)) {
    const record = makeBaseRecord(filePath, "json", "api_contract", "authoritative", contents);
    const walkItems = (items) => {
      for (const item of items ?? []) {
        if (item?.request) {
          const route = item.request.url?.raw ?? (Array.isArray(item.request.url?.path) ? `/${item.request.url.path.join("/")}` : "");
          record.apis.push(apiRecord(item.request.method ?? "", route, item.name ?? ""));
        }
        if (Array.isArray(item?.item)) {
          walkItems(item.item);
        }
      }
    };
    walkItems(parsed.item);
    if (record.apis.length === 0) {
      record.gaps.push("postman_requests_unresolved");
    }
    return record;
  }

  if (parsed.tables || parsed.views || parsed.objects) {
    const record = makeBaseRecord(filePath, "json", "table_metadata", "authoritative", contents);
    parseStructuredObjectMap(record, parsed, "table");
    if (record.columns.length === 0) {
      record.gaps.push("structured_columns_unresolved");
    }
    return record;
  }

  if (parsed.entities || parsed.relationships || parsed.ddl) {
    const record = makeBaseRecord(filePath, "json", "data_model", "authoritative", contents);
    parseStructuredObjectMap(record, parsed, "entity");
    if (typeof parsed.ddl === "string" && parsed.ddl.toLowerCase().includes("create table")) {
      record.hints.push("ddl_embedded");
    }
    if (record.objects.length === 0) {
      record.gaps.push("data_model_objects_unresolved");
    }
    return record;
  }

  return null;
}

/**
 * Extract YAML-like frontmatter from Markdown content.
 */
function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {};
  }
  const data = {};
  for (const line of match[1].split("\n")) {
    const frontmatterMatch = line.match(/^([A-Za-z0-9_]+):\s*(.+)$/);
    if (frontmatterMatch) {
      data[frontmatterMatch[1]] = frontmatterMatch[2].trim();
    }
  }
  return data;
}

/**
 * Parse Markdown schema dictionaries into normalized object and column records.
 */
function parseMarkdownSchemaDictionary(filePath, contents) {
  const frontmatter = extractFrontmatter(contents);
  const isSchemaDictionary = frontmatter.schema_name || frontmatter.objects_documented || frontmatter.covers_columns;
  if (!isSchemaDictionary) {
    return null;
  }
  const record = makeBaseRecord(filePath, "markdown", "table_metadata", "authoritative", contents);
  const sections = contents.split(/\n(?=##+\s+)/);
  for (const section of sections) {
    const headingMatch = section.match(/^##+\s*(table|view|object|entity)\s*:?\s*([^\n]+)/im);
    if (!headingMatch) {
      continue;
    }
    const objectName = normalizeObjectName(headingMatch[2]);
    const kind = headingMatch[1].toLowerCase();
    record.objects.push(objectRecord(objectName, kind));
    for (const line of section.split("\n")) {
      const bulletMatch = line.match(/^\s*[-*]\s*`?([A-Za-z][A-Za-z0-9_$#]*)`?(?:\s*\(([^)]+)\))?/);
      if (bulletMatch) {
        record.columns.push(columnRecord(objectName, bulletMatch[1], bulletMatch[2] ?? ""));
        continue;
      }
      const tableMatch = line.match(/^\|\s*`?([A-Za-z][A-Za-z0-9_$#]*)`?\s*\|/);
      if (tableMatch && tableMatch[1].toLowerCase() !== "column" && tableMatch[1].toLowerCase() !== "name") {
        record.columns.push(columnRecord(objectName, tableMatch[1], ""));
      }
    }
  }
  if (record.objects.length === 0) {
    record.gaps.push("schema_dictionary_objects_unresolved");
  }
  return record;
}

/**
 * Parse requirement Markdown for app-path and preference hints.
 */
function parseRequirementsMarkdown(filePath, contents) {
  const lowerText = contents.toLowerCase();
  if (!lowerText.includes("acceptance criteria") && !lowerText.includes("# requirements") && !lowerText.includes("# spec") && !lowerText.includes("functional requirements")) {
    return null;
  }
  const record = makeBaseRecord(filePath, "markdown", "requirements", "supporting", contents);
  const heading = contents.match(/^#\s+(.+)$/m);
  if (heading) {
    record.hints.push(`title:${heading[1].trim()}`);
  }
  const appAliasMatch = contents.match(/^\s*[-*]?\s*\**Application Alias:\**\s*`?([A-Za-z0-9_-]+)`?\s*$/im);
  if (appAliasMatch) {
    record.hints.push(`app_alias:${appAliasMatch[1].trim()}`);
  }
  const targetAppPathMatch = contents.match(/^\s*[-*]?\s*\**Target App Path:\**\s*`?([^`\n]+)`?\s*$/im);
  if (targetAppPathMatch) {
    record.hints.push(`target_app_path:${targetAppPathMatch[1].trim()}`);
  }
  const terms = contents.match(/\b[A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2}\b/g) ?? [];
  record.hints.push(...uniqueStrings(terms).slice(0, 12).map((term) => `term:${term}`));
  return record;
}

/**
 * Parse lightweight OpenAPI YAML route declarations.
 */
function parseYamlOpenApi(filePath, contents) {
  const lowerText = contents.toLowerCase();
  if (!/^(openapi|swagger):/m.test(lowerText) || !/^paths:/m.test(lowerText)) {
    return null;
  }
  const record = makeBaseRecord(filePath, "yaml", "api_contract", "authoritative", contents);
  const pathMatches = [...contents.matchAll(/^\s{2}(\/[^:]+):\s*$/gm)];
  for (let index = 0; index < pathMatches.length; index += 1) {
    const route = pathMatches[index][1].trim();
    const start = pathMatches[index].index ?? 0;
    const end = index + 1 < pathMatches.length ? pathMatches[index + 1].index ?? contents.length : contents.length;
    const block = contents.slice(start, end);
    const methods = [...block.matchAll(/^\s{4}(get|post|put|patch|delete|options|head):\s*$/gim)];
    for (const method of methods) {
      record.apis.push(apiRecord(method[1], route, ""));
    }
  }
  if (record.apis.length === 0) {
    record.gaps.push("openapi_paths_unresolved");
  }
  return record;
}

/**
 * Parse supported YAML metadata files into normalized intelligence records.
 */
function parseYamlMetadata(filePath, contents) {
  const lowerText = contents.toLowerCase();
  const isMetadata = /^(schema_name|tables|views|objects):/m.test(lowerText) && /columns:/m.test(lowerText);
  const isDataModel = /^(entities|relationships):/m.test(lowerText);
  if (!isMetadata && !isDataModel) {
    return null;
  }
  const sourceClass = isDataModel && !isMetadata ? "data_model" : "table_metadata";
  const record = makeBaseRecord(filePath, "yaml", sourceClass, "authoritative", contents);
  const lines = contents.split("\n");
  let currentObjectName = "";
  let currentKind = sourceClass === "data_model" ? "entity" : "table";
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const objectNameMatch = line.match(/^\s*-\s+name:\s*["']?([^"']+)["']?\s*$/);
    const keyedObjectMatch = line.match(/^\s{2}([A-Za-z0-9_$#.-]+):\s*$/);
    if (objectNameMatch) {
      currentObjectName = normalizeObjectName(objectNameMatch[1]);
      if (currentObjectName) {
        record.objects.push(objectRecord(currentObjectName, currentKind));
      }
      continue;
    }
    if (keyedObjectMatch && !["tables", "views", "objects", "entities", "columns", "relationships", "attributes"].includes(keyedObjectMatch[1])) {
      currentObjectName = normalizeObjectName(keyedObjectMatch[1]);
      if (currentObjectName) {
        record.objects.push(objectRecord(currentObjectName, currentKind));
      }
      continue;
    }
    const columnNameMatch = line.match(/^\s*-\s+(name|column_name):\s*["']?([^"']+)["']?\s*$/);
    if (columnNameMatch && currentObjectName) {
      record.columns.push(columnRecord(currentObjectName, columnNameMatch[2], ""));
      continue;
    }
    const keyedColumnMatch = line.match(/^\s{4}([A-Za-z0-9_$#.-]+):\s*$/);
    if (keyedColumnMatch && currentObjectName && !["columns", "attributes"].includes(keyedColumnMatch[1])) {
      record.columns.push(columnRecord(currentObjectName, keyedColumnMatch[1], ""));
    }
  }
  if (record.objects.length === 0) {
    record.gaps.push(`${sourceClass}_objects_unresolved`);
  }
  return record;
}

/**
 * Parse SQL DDL for table, view, and column intelligence.
 */
function parseSqlDdl(filePath, contents) {
  const lowerText = contents.toLowerCase();
  if (!lowerText.includes("create table") && !lowerText.includes("create view")) {
    return null;
  }
  const record = makeBaseRecord(filePath, "sql", "data_model", "authoritative", contents);
  const tableMatches = [...contents.matchAll(/create\s+(?:or\s+replace\s+)?table\s+([A-Za-z0-9_."$#]+)\s*\(([\s\S]*?)\)\s*;/gim)];
  for (const match of tableMatches) {
    const objectName = normalizeObjectName(match[1].split(".").pop());
    record.objects.push(objectRecord(objectName, "table"));
    const body = match[2];
    for (const line of body.split("\n")) {
      const trimmed = line.trim().replace(/,$/, "");
      if (!trimmed || /^(constraint|primary key|foreign key|unique|check)\b/i.test(trimmed)) {
        continue;
      }
      const columnMatch = trimmed.match(/^"?([A-Za-z][A-Za-z0-9_$#]*)"?\s+([A-Za-z0-9_(), ]+)/);
      if (columnMatch) {
        record.columns.push(columnRecord(objectName, columnMatch[1], columnMatch[2]));
      }
    }
  }
  const viewMatches = [...contents.matchAll(/create\s+(?:or\s+replace\s+)?view\s+([A-Za-z0-9_."$#]+)\s*(?:\(([^)]*)\))?\s+as/gim)];
  for (const match of viewMatches) {
    const objectName = normalizeObjectName(match[1].split(".").pop());
    record.objects.push(objectRecord(objectName, "view"));
    const explicitColumns = match[2]
      ? match[2].split(",").map((value) => value.trim()).filter(Boolean)
      : [];
    for (const columnName of explicitColumns) {
      record.columns.push(columnRecord(objectName, columnName, ""));
    }
  }
  if (record.objects.length === 0) {
    return null;
  }
  if (record.columns.length === 0) {
    record.gaps.push("ddl_columns_unresolved");
  }
  return record;
}

/**
 * Choose the best detector for a structured file and return discovered records.
 */
function classifyStructuredFile(filePath, contents) {
  const format = detectFormat(filePath);
  if (format === "json") {
    try {
      return detectJsonRecord(filePath, JSON.parse(contents), contents);
    } catch {
      return null;
    }
  }
  if (format === "yaml") {
    return parseYamlOpenApi(filePath, contents) ?? parseYamlMetadata(filePath, contents);
  }
  if (format === "markdown") {
    return parseMarkdownSchemaDictionary(filePath, contents) ?? parseRequirementsMarkdown(filePath, contents);
  }
  if (format === "sql") {
    return parseSqlDdl(filePath, contents);
  }
  return null;
}

function isAllowedExtension(filePath, allowedExtensions) {
  return allowedExtensions.includes(path.extname(filePath).toLowerCase());
}

/**
 * Scan a workspace using configured depth, extension, and excluded-directory limits.
 */
async function walkBounded(root, config) {
  const discovered = [];
  async function walk(current, depth) {
    if (depth > config.max_depth) {
      return;
    }
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (config.excluded_directories.includes(entry.name)) {
          continue;
        }
        await walk(absolute, depth + 1);
        continue;
      }
      if (!isAllowedExtension(absolute, config.allowed_extensions)) {
        continue;
      }
      const contents = await fs.readFile(absolute, "utf8");
      const classified = classifyStructuredFile(normalizePath(root, absolute), contents);
      if (classified) {
        discovered.push(classified);
      }
    }
  }
  await walk(root, 0);
  return discovered;
}

async function hasAnyExistingChild(directoryPath, childNames) {
  for (const childName of childNames) {
    if (await exists(path.join(directoryPath, childName))) {
      return true;
    }
  }
  return false;
}

async function isApexAppRoot(directoryPath, appDiscovery) {
  for (const markerFile of appDiscovery.marker_files ?? []) {
    if (await exists(path.join(directoryPath, markerFile))) {
      return true;
    }
  }
  const markerDirectories = appDiscovery.marker_directories ?? [];
  const hasApexMetadata = await exists(path.join(directoryPath, ".apex"));
  if (hasApexMetadata && (await hasAnyExistingChild(directoryPath, markerDirectories.filter((name) => name !== ".apex")))) {
    return true;
  }
  return false;
}

function appCandidate(root, directoryPath, source) {
  const relativePath = normalizePath(root, directoryPath);
  return {
    path: relativePath,
    source,
    standard_location: relativePath === "applications" || relativePath.startsWith("applications/")
  };
}

function collectRequirementHints(records, prefix) {
  return records
    .filter((record) => record.source_class === "requirements")
    .flatMap((record) => record.hints ?? [])
    .filter((hint) => hint.startsWith(prefix))
    .map((hint) => hint.slice(prefix.length))
    .filter(Boolean);
}

function inferSuggestedAppPath({ discovered, standardRootName }) {
  const aliases = collectRequirementHints(discovered, "app_alias:");
  if (aliases.length > 0) {
    return path.posix.join(standardRootName, aliases[0]);
  }
  const targetPaths = collectRequirementHints(discovered, "target_app_path:");
  for (const targetPath of targetPaths) {
    const normalized = targetPath.replace(/\\/g, "/").trim().replace(/\/+$/, "");
    if (!normalized) {
      continue;
    }
    if (normalized.startsWith(`${standardRootName}/`)) {
      return normalized;
    }
  }
  const titles = collectRequirementHints(discovered, "title:");
  for (const title of titles) {
    const slug = slugify(title);
    if (slug) {
      return path.posix.join(standardRootName, slug);
    }
  }
  return "";
}

function isTemplateScaffoldCandidate(root, directoryPath) {
  const relativePath = normalizePath(root, directoryPath).replaceAll(path.sep, "/");
  return (
    relativePath === "templates/base-app-structure" ||
    relativePath === "ai-context/apexlang/templates/base-app-structure" ||
    relativePath === "templates/base-app-structure/scaffold-example" ||
    relativePath === "ai-context/apexlang/templates/base-app-structure/scaffold-example"
  );
}

function isOutputOrBackupCandidate(root, directoryPath) {
  const relativePath = normalizePath(root, directoryPath).replaceAll(path.sep, "/");
  return relativePath.split("/").some((segment) => segment === "artifacts" || segment === "apex-exports");
}

/**
 * Collect explicit and discovered APEX application root candidates.
 */
async function collectApexAppCandidates({ root, intelligence, discovered, authoritativeOfflineContext }) {
  const appDiscovery = intelligence.app_discovery ?? DEFAULT_CONFIG.app_discovery;
  const standardRootName = appDiscovery.standard_root ?? "applications";
  const standardRoot = path.join(root, standardRootName);
  const standardRootPresent = await exists(standardRoot);
  const candidates = [];
  const seen = new Set();

  async function addCandidate(directoryPath, source) {
    const resolved = path.resolve(directoryPath);
    if (seen.has(resolved) || !(await exists(resolved))) {
      return;
    }
    if (isTemplateScaffoldCandidate(root, resolved) || isOutputOrBackupCandidate(root, resolved)) {
      return;
    }
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) {
        return;
      }
    } catch {
      return;
    }
    if (!(await isApexAppRoot(resolved, appDiscovery))) {
      return;
    }
    seen.add(resolved);
    candidates.push(appCandidate(root, resolved, source));
  }

  if (standardRootPresent) {
    await addCandidate(standardRoot, "standard_root");
    const entries = await fs.readdir(standardRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await addCandidate(path.join(standardRoot, entry.name), "standard_root_child");
      }
    }
  }

  const scanConfig = intelligence.bounded_scan ?? DEFAULT_CONFIG.bounded_scan;
  async function walkDirectories(current, depth) {
    if (depth > scanConfig.max_depth) {
      return;
    }
    if (await isApexAppRoot(current, appDiscovery)) {
      await addCandidate(current, "bounded_scan");
    }
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || scanConfig.excluded_directories.includes(entry.name)) {
        continue;
      }
      await walkDirectories(path.join(current, entry.name), depth + 1);
    }
  }
  await walkDirectories(root, 0);

  const standardCandidates = candidates.filter((candidate) => candidate.standard_location);
  const suggestedAppPath = inferSuggestedAppPath({ discovered, standardRootName });
  let status = "missing";
  let promptRequired = true;
  let prompt = "Provide the exact APEX app directory, or provide a bounded directory to scan for app roots.";
  if (standardCandidates.length === 1) {
    status = "resolved";
    promptRequired = false;
    prompt = "";
  } else if (standardRootPresent && candidates.length === 0 && authoritativeOfflineContext) {
    status = "create_new_allowed";
    promptRequired = false;
    prompt = "";
  } else if (standardCandidates.length > 1) {
    status = "ambiguous";
    prompt = "Multiple apps were found under applications/. Specify the exact app directory to modify.";
  } else if (candidates.length === 1) {
    status = "needs_confirmation";
    prompt = "One nonstandard APEX app candidate was found. Confirm this app directory before app-scoped reads or edits.";
  } else if (candidates.length > 1) {
    status = "ambiguous";
    prompt = "Multiple nonstandard APEX app candidates were found. Specify the exact app directory to modify.";
  } else if (!standardRootPresent) {
    prompt = "No applications/ directory was found. Specify the exact APEX app directory, or provide a bounded directory to scan.";
  }

  return {
    status,
    standard_root: standardRootName,
    standard_root_present: standardRootPresent,
    candidates,
    suggested_app_path: status === "create_new_allowed" ? suggestedAppPath : "",
    prompt_required: promptRequired,
    prompt
  };
}

/**
 * Group object metadata by name and source to identify conflicting definitions.
 */
function buildObjectConflictMap(records) {
  const objectMap = new Map();
  for (const record of records) {
    for (const objectEntry of record.objects) {
      const objectName = normalizeObjectName(objectEntry.name).toUpperCase();
      if (!objectName) {
        continue;
      }
      const columns = uniqueStrings(
        record.columns
          .filter((column) => normalizeObjectName(column.object_name).toUpperCase() === objectName)
          .map((column) => normalizeObjectName(column.column_name).toUpperCase())
      ).sort();
      const signature = columns.join(",");
      const current = objectMap.get(objectName) ?? [];
      current.push({
        path: record.path,
        source_class: record.source_class,
        signature
      });
      objectMap.set(objectName, current);
    }
  }
  return objectMap;
}

/**
 * Return conflict records for objects described by multiple metadata sources.
 */
function findConflicts(records) {
  const conflicts = [];
  for (const [objectName, entries] of buildObjectConflictMap(records).entries()) {
    const signatures = uniqueStrings(entries.map((entry) => entry.signature).filter(Boolean));
    if (signatures.length > 1) {
      conflicts.push({
        object_name: objectName,
        sources: entries.map((entry) => ({ path: entry.path, source_class: entry.source_class }))
      });
    }
  }
  return conflicts;
}

/**
 * Discover workspace intelligence from app paths, metadata files, requirements, APIs, and schema hints.
 */
async function probeWorkspace({ root = process.cwd(), intelligence = DEFAULT_CONFIG, dbContext = {} } = {}) {
  const discovered = [];

  for (const [sourceClass, roots] of Object.entries(intelligence.root_candidates ?? {})) {
    for (const rootName of roots) {
      const target = path.join(root, rootName);
      if (!(await exists(target))) {
        continue;
      }
      discovered.push({
        source_class: sourceClass,
        path: normalizePath(root, target),
        format: "directory",
        authority_level: "supporting",
        objects: [],
        columns: [],
        apis: [],
        annotations_present: false,
        comments_present: false,
        hints: ["candidate_root_present"],
        gaps: []
      });
    }
  }

  const scanResults = await walkBounded(root, intelligence.bounded_scan ?? DEFAULT_CONFIG.bounded_scan);
  for (const entry of scanResults) {
    if (!discovered.some((existing) => existing.path === entry.path && existing.source_class === entry.source_class)) {
      discovered.push(entry);
    }
  }

  const authoritative = discovered.filter((entry) => entry.authority_level === "authoritative");
  const conflicts = findConflicts(authoritative);
  const authoritativeOfflineContext = authoritative.length > 0 && conflicts.length === 0;
  const appContext = await collectApexAppCandidates({
    root,
    intelligence,
    discovered,
    authoritativeOfflineContext
  });
  const resolution = {
    status: conflicts.length > 0 ? "conflict" : authoritative.length > 0 ? "resolved" : "unresolved",
    session_root: root,
    discovered_sources: discovered,
    authoritative_offline_context: authoritativeOfflineContext,
    app_context: appContext,
    db_context: normalizeDbContext(dbContext),
    selected_sources: conflicts.length > 0 ? [] : authoritative.map((entry) => ({ source_class: entry.source_class, path: entry.path })),
    db_prompt_flow: intelligence.db_prompt_flow ?? DEFAULT_CONFIG.db_prompt_flow
  };
  if (conflicts.length > 0) {
    resolution.gaps = conflicts.map((conflict) => ({
      type: "authoritative_conflict",
      object_name: conflict.object_name,
      sources: conflict.sources
    }));
  }
  return resolution;
}

/**
 * Probe a workspace and write the normalized resolution report to disk.
 */
async function writeWorkspaceResolution({ root = process.cwd(), intelligence = DEFAULT_CONFIG, dbContext = {} } = {}) {
  const packagedOutputRoot = String(process.env.APEXLANG_OUTPUT_ROOT || "").trim();
  const reportPath = packagedOutputRoot
    ? path.join(path.resolve(packagedOutputRoot), "context-resolution.json")
    : path.join(root, "artifacts", "context-resolution.json");
  const existingResolution = await readJsonIfPresent(reportPath);
  const effectiveDbContext = hasDbContextInput(dbContext) ? dbContext : existingResolution?.db_context ?? {};
  const resolution = await probeWorkspace({ root, intelligence, dbContext: effectiveDbContext });
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(resolution, null, 2) + "\n", "utf8");
  return { reportPath, resolution };
}

/**
 * SQLcl runtime orchestration for preflight and same-session validation/import roundtrips.
 */

const DEFAULT_BUILD_ROOT_REPORT = skillLogPath("apex-build-root-resolution.json");
const DEFAULT_PREFLIGHT_REPORT = skillLogPath("runtime-preflight.json");
const DEFAULT_ROUNDTRIP_REPORT = skillLogPath("runtime-run.json");
const DEFAULT_ROUNDTRIP_LOG = skillLogPath("runtime-run.log");
const DEFAULT_VALIDATION_ARTIFACT_DIR = skillLogPath("validation");
const DEFAULT_VALIDATION_REPORT = path.join(DEFAULT_VALIDATION_ARTIFACT_DIR, "validation-report.json");
const DEFAULT_VALIDATION_TRANSCRIPT = path.join(DEFAULT_VALIDATION_ARTIFACT_DIR, "validation-transcript.log");
const DEFAULT_VALIDATION_PROBLEMS = path.join(DEFAULT_VALIDATION_ARTIFACT_DIR, "problems.json");
const DEFAULT_VALIDATION_CONTRACT_DIR = path.join(DEFAULT_VALIDATION_ARTIFACT_DIR, "component-contracts");
const DEFAULT_VALIDATION_COMPILER_TRUTH_REPORT = path.join(DEFAULT_VALIDATION_ARTIFACT_DIR, "compiler-truth-report.json");
const DEFAULT_VALIDATION_ROUNDTRIP_REPORT = path.join(DEFAULT_VALIDATION_ARTIFACT_DIR, "roundtrip-report.json");
const DEFAULT_RUNTIME_VERIFY_ARTIFACT_DIR = skillLogPath("runtime-verify");
const SOURCE_IMPORT_LANE = "apexlang_source_import";
const COMPILED_SQL_EXPORT_IMPORT_LANE = "compiled_sql_export_import";
const APEXLANG_INFO_PATH = path.join(".apex", "apexlang.json");
const DEFAULT_RUNTIME_PROVIDER = "auto";
const RUNTIME_PROVIDER_CHROME = "chrome-devtools-mcp";
const RUNTIME_PROVIDER_HTTP = "http-fallback";
const DEFAULT_RUNTIME_BASE_URLS = [
  "http://localhost:8003/ords",
  "https://localhost:8003/ords",
  "http://localhost:2326/ords",
  "https://localhost:2326/ords"
];
const LOGIN_PATTERNS = [
  /\bP9999_USERNAME\b/i,
  /\bP9999_PASSWORD\b/i,
  /\bsign in\b/i,
  /\blogin\b/i,
  /\busername\b/i,
  /\bpassword\b/i
];
const APEX_RUNTIME_ERROR_PATTERNS = [
  /\bORA-\d+\b/i,
  /\bAjax call returned server error\b/i,
  /\bAPEX - Attempt to save item\b/i,
  /\bTechnical Info\b/i,
  /\bError Processing Request\b/i,
  /\bAPEXlang Compile Errors\b/i
];
const RUNTIME_TEXT_TAG_STRIP_PATTERN = /<[^>]+>/g;
const FAILURE_PATTERN = /\b(ORA-\d+|SP2-\d+|ERROR\b|Error!|not connected|unknown command|EPERM|ENOENT)\b/i;
const WARNING_PATTERN = /\bwarning\b/i;
const PASSWORD_PROMPT_PATTERN = /password\?/i;
const WORKSPACE_PATTERN =
  /(workspace.*ambigu|multiple[- ]workspace|multiple workspaces available|workspaceid or the workspace option)/i;
const VALIDATE_IMPORT_OUTPUT_PATTERN = /\b(validation successful\.?|importing application id:|apexlang (compile|import) errors:)\b/i;
const BUILT_ROOT_SANDBOX_FILESYSTEM_PATTERN = /\b(EPERM|ENOENT)\b/i;
const BUILD_ROOT_WORKDIR_PATTERN = /\bworkdir\/[^\s:'"]+/i;
const WORKSPACE_LOOKUP_BEGIN = "__APEX_WORKSPACE_LOOKUP_BEGIN__";
const WORKSPACE_LOOKUP_END = "__APEX_WORKSPACE_LOOKUP_END__";
const APP_IDENTITY_LOOKUP_BEGIN = "__APEX_APP_IDENTITY_LOOKUP_BEGIN__";
const APP_IDENTITY_LOOKUP_END = "__APEX_APP_IDENTITY_LOOKUP_END__";
const WORKSPACE_SCOPE_LOOKUP_BEGIN = "__APEX_WORKSPACE_SCOPE_LOOKUP_BEGIN__";
const WORKSPACE_SCOPE_LOOKUP_END = "__APEX_WORKSPACE_SCOPE_LOOKUP_END__";
const WORKSPACE_APP_LIST_BEGIN = "__APEX_WORKSPACE_APP_LIST_BEGIN__";
const WORKSPACE_APP_LIST_END = "__APEX_WORKSPACE_APP_LIST_END__";
const WORKSPACE_RESOLUTION_STATUS = "Identifying workspace ID for DB connection, please bare with me...";
const DEBUG_MAX_RETRY_COUNT = 3;
const LOCAL_VALIDATION_REQUESTED_ENTRYPOINT = "npm_run_apexlang_validate";
const LOCAL_VALIDATION_FALLBACK_ENTRYPOINT = "direct_apexctl_validate";
const LOCAL_CHECK_OK_TOKEN = "APEXLANG_LOCAL_CHECK_OK";
const LOCAL_CHECK_FAILED_TOKEN = "APEXLANG_LOCAL_CHECK_FAILED";
const LIVE_CHECK_OK_TOKEN = "APEXLANG_LIVE_CHECK_OK";
const LIVE_CHECK_FAILED_TOKEN = "APEXLANG_LIVE_CHECK_FAILED";
const LIVE_RUNTIME_VALIDATION_RULE_ID = "LIVE_RUNTIME_VALIDATION_REQUIRED_001";
const LOCAL_VALIDATION_VALIDATOR_OUTPUT_PATTERN =
  /\b(?:APEXLANG_LOCAL_CHECK_[A-Z0-9_]+|APEXCTL_APEXLANG_VALIDATE_[A-Z0-9_]+|APEXLANG_DSL_LINT_[A-Z0-9_]+|VALIDATION_LINT_[A-Z0-9_]+|Vocabulary compatibility check|DSL_RULE_[A-Z0-9_]+|validate_apexlang(?:_vocab)?\.py|validate_validations\.py)\b/i;
const LOCAL_VALIDATION_WRAPPER_FAILURE_PATTERNS = [
  { pattern: /Missing script:\s*["']?apexlang:validate["']?/i, reason: "npm_missing_script" },
  { pattern: /\bnpm ERR!|\bnpm error\b/i, reason: "npm_wrapper_error" },
  { pattern: /spawn\s+npm\s+ENOENT|command not found:\s*npm/i, reason: "npm_executable_unavailable" },
  { pattern: /package\.json|could not read package\.json|ENOENT.*package\.json|Could not determine executable to run/i, reason: "npm_wrapper_environment" }
];
const CACHEABLE_SOURCE_LANE_FAILURE_CLASSES = new Set([
  "import version-gate failure",
  "compiler metadata or property-model failure",
  "APX syntax or file-shape failure"
]);
const STAGE_BUDGETS_MS = Object.freeze({
  preflight: 60000,
  local_validate: 30000,
  target_resolve: 120000,
  live_validate: 30000,
  import: 60000
});
const SQL_PROBE_ERROR_PATTERN = /\b(ORA-\d+|SP2-\d+|PLS-\d+)\b/i;
const WRAPPER_ONLY_FAILURE_PATTERN = /\b(EPERM|ENOENT|not connected|unknown command|workspaceid or the workspace option|multiple workspaces available)\b/i;

function appendOption(args, name, value) {
  if (value) {
    args.push(name, value);
  }
}

function cleanOutput(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? `\n${result.error}` : ""}`.trim();
}

function parseImportedApplicationId(output = "") {
  const match = String(output).match(/Importing application ID:\s*(\d+)/i);
  if (!match) {
    return null;
  }
  const appId = Number.parseInt(match[1], 10);
  return Number.isInteger(appId) && appId > 0 ? appId : null;
}

function classifyLocalValidationPrimaryFailure(result) {
  const output = cleanOutput(result);
  if (LOCAL_VALIDATION_VALIDATOR_OUTPUT_PATTERN.test(output)) {
    return {
      primaryStatus: "validator_failure",
      allowFallback: false,
      fallbackReason: ""
    };
  }
  for (const matcher of LOCAL_VALIDATION_WRAPPER_FAILURE_PATTERNS) {
    if (matcher.pattern.test(output)) {
      return {
        primaryStatus: "wrapper_failure",
        allowFallback: true,
        fallbackReason: matcher.reason
      };
    }
  }
  return {
    primaryStatus: "unclassified_failure",
    allowFallback: false,
    fallbackReason: ""
  };
}

async function runCanonicalLocalValidation({ appPath, deps, preferFallback }) {
  if (preferFallback === "skip_by_roundtrip_policy") {
    return {
      requestedEntrypoint: LOCAL_VALIDATION_FALLBACK_ENTRYPOINT,
      entrypointUsed: "",
      fallbackUsed: false,
      primaryStatus: "skipped_by_roundtrip_policy",
      fallbackReason: "roundtrip_policy_skip",
      fallbackStatus: "not-run",
      finalResult: { code: 0, stdout: "", stderr: "" },
      transcriptEntries: []
    };
  }
  const baseOptions = { allowFailure: true, passthrough: false };
  const requestedEntrypoint = LOCAL_VALIDATION_FALLBACK_ENTRYPOINT;
  const result = await deps.runCommand(
    "node",
    [apexlangToolPath("apexctl.mjs"), "apexlang", "validate", "--app-path", appPath],
    baseOptions
  );
  return {
    requestedEntrypoint,
    entrypointUsed: LOCAL_VALIDATION_FALLBACK_ENTRYPOINT,
    fallbackUsed: false,
    primaryStatus: result.code === 0 ? "pass" : "validator_failure",
    fallbackReason: preferFallback || (isPackagedSkillRuntime() ? "packaged_runtime_direct_validation" : "direct_runtime_validation"),
    fallbackStatus: "not-run",
    finalResult: result,
    transcriptEntries: [
      {
        heading: "direct_apexctl",
        output: cleanOutput(result)
      }
    ]
  };
}

function nowMs() {
  return Date.now();
}

function buildStageReport(phase, budgetMs) {
  return {
    phase,
    budget_ms: budgetMs,
    duration_ms: 0,
    budget_exceeded: false,
    status: "not-run",
    failure_class: "",
    next_safe_action: "",
    inputs_digest: ""
  };
}

async function runTimedStage(summary, phase, inputPayload, runner, options = {}) {
  const stage = buildStageReport(phase, STAGE_BUDGETS_MS[phase] ?? 0);
  const startedAt = nowMs();
  try {
    const result = await runner();
    stage.duration_ms = nowMs() - startedAt;
    stage.inputs_digest = hashText(stableStringify(inputPayload ?? {}));
    if (stage.duration_ms > stage.budget_ms) {
      stage.budget_exceeded = true;
      const allowBudgetOverrun = typeof options.allowBudgetOverrun === "function"
        ? Boolean(options.allowBudgetOverrun(result, stage))
        : Boolean(options.allowBudgetOverrun);
      if (!allowBudgetOverrun) {
        stage.status = "fail";
        stage.failure_class = `${phase}_timeout`;
        stage.next_safe_action = stageTimeoutNextSafeAction(phase);
        summary.phase_reports.push(stage);
        return {
          ok: false,
          timeout: true,
          stage,
          result
        };
      }
      stage.status = "pass";
      stage.next_safe_action = `${phase} exceeded the configured budget but returned the required success facts.`;
      summary.phase_reports.push(stage);
      return { ok: true, stage, result };
    }
    stage.status = "pass";
    stage.next_safe_action = phase === "import" ? "No action required." : `Continue to ${nextPhaseLabel(phase)}.`;
    summary.phase_reports.push(stage);
    return { ok: true, stage, result };
  } catch (error) {
    stage.duration_ms = nowMs() - startedAt;
    stage.inputs_digest = hashText(stableStringify(inputPayload ?? {}));
    stage.status = "fail";
    stage.failure_class = error?.stageFailureClass || `${phase}_failure`;
    stage.next_safe_action = error?.nextSafeAction || `Fix the ${phase} failure before retrying.`;
    summary.phase_reports.push(stage);
    return { ok: false, stage, error };
  }
}

function nextPhaseLabel(phase) {
  if (phase === "preflight") {
    return "local_validate";
  }
  if (phase === "local_validate") {
    return "target_resolve";
  }
  if (phase === "target_resolve") {
    return "live_validate";
  }
  return "completion";
}

function stageTimeoutNextSafeAction(phase) {
  if (phase === "target_resolve") {
    return "Target resolution exceeded the configured budget. Import remains blocked; do not bypass with direct apex import.";
  }
  return `Investigate why ${phase} exceeded the configured budget.`;
}

function targetResolutionBypassBlockedAction() {
  return "Resolve the target application identity in the bounded target resolver before import. Live validate success proves source syntax only; do not bypass target resolution with direct apex import.";
}

function targetResolutionAllowsImport(summary) {
  if (summary.target_resolution_mode === "update-existing") {
    return summary.target_resolution_status === "resolved_existing_app" &&
      Number.isInteger(summary.canonical_application_id) &&
      summary.canonical_application_id > 0;
  }
  if (summary.target_resolution_mode === "create-new") {
    return summary.target_resolution_status === "not_found_in_workspace" &&
      summary.create_new_confirmed === true;
  }
  return false;
}

function applyTargetResolutionBlockedSummary(summary, failureClass, recommendedNextAction = targetResolutionBypassBlockedAction()) {
  summary.validate_status = "blocked";
  summary.live_check_status = "blocked";
  summary.final_check_status = "blocked";
  summary.import_status = "blocked";
  summary.runtime_gate_status = "fail";
  summary.failure_class = failureClass;
  summary.blocking_reason = failureClass;
  summary.direct_import_fallback_allowed = false;
  summary.recommended_next_action = recommendedNextAction;
  summary.notes.push("Import remains blocked because target resolution did not prove an authorized target.");
  summary.notes.push("Live validate success is not target-identity evidence.");
}

function buildFrozenPreflightFacts({
  appPath,
  dbConnectionName,
  executionMode,
  preflightPayload,
  supportingObjects = false
}) {
  return {
    app_path: path.resolve(appPath || ""),
    execution_mode_requested: normalizeExecutionMode(executionMode || "auto"),
    execution_mode_selected: preflightPayload.execution_mode_used || "",
    db_connection_name: dbConnectionName || "",
    connection_signature: preflightPayload.connection_signature ?? null,
    workspace_scope: {
      workspace_id: "",
      workspace_name: ""
    },
    schema_scope: {
      current_schema: "",
      current_user: ""
    },
    requested_application_id: null,
    requested_application_alias: "",
    supporting_objects_enabled: Boolean(supportingObjects),
    stage_budgets: STAGE_BUDGETS_MS,
    runtime_entrypoint: preflightPayload.runtime_entrypoint || "",
    package_runtime_version: preflightPayload.runtime_version || preflightPayload.connection_signature?.signature || ""
  };
}

async function readAppApexlangVersion(appPath) {
  try {
    const payload = await readJson(path.join(appPath, APEXLANG_INFO_PATH));
    return String(payload?.mmdVersion ?? "").trim();
  } catch {
    return "";
  }
}

function assertRuntimeApexlangCompatibility({ appApexlangVersion = "", connectionSignature = null }) {
  if (!appApexlangVersion) {
    const error = new Error("Unable to resolve mmdVersion from .apex/apexlang.json.");
    error.stageFailureClass = "preflight_apexlang_version_missing";
    error.nextSafeAction = "Add .apex/apexlang.json with the active APEXlang mmdVersion before validation or import.";
    throw error;
  }
  const runtimeVersion = connectionSignature?.signature || "";
  if (!runtimeVersion) {
    return;
  }
  if (appApexlangVersion !== runtimeVersion) {
    const error = new Error(
      `APEXlang mmdVersion ${appApexlangVersion} does not match runtime ${runtimeVersion}.`
    );
    error.stageFailureClass = "preflight_apexlang_version_mismatch";
    error.nextSafeAction = "Use the matching APEX build-root connection or regenerate the app with the active APEXlang version.";
    throw error;
  }
}

async function loadWorkspaceProbeModule() {
  return { DEFAULT_CONFIG, probeWorkspace, writeWorkspaceResolution };
}

async function collectMetadataReferences() {
  const workspaceProbe = await loadWorkspaceProbeModule();
  const resolution = await workspaceProbe.probeWorkspace({ root: process.cwd() });
  const objectMap = new Map();
  for (const source of resolution.discovered_sources ?? []) {
    if (!["table_metadata", "data_model"].includes(source.source_class) || source.authority_level !== "authoritative") {
      continue;
    }
    for (const object of source.objects ?? []) {
      const objectName = normalizeComparableText(object.name);
      if (!objectName) {
        continue;
      }
      if (!objectMap.has(objectName)) {
        objectMap.set(objectName, {
          object_name: object.name,
          object_type: object.kind || "",
          columns: new Set()
        });
      }
    }
    for (const column of source.columns ?? []) {
      const objectName = normalizeComparableText(column.object_name);
      const columnName = normalizeComparableText(column.column_name);
      if (!objectName) {
        continue;
      }
      if (!objectMap.has(objectName)) {
        objectMap.set(objectName, {
          object_name: column.object_name,
          object_type: "",
          columns: new Set()
        });
      }
      if (columnName) {
        objectMap.get(objectName).columns.add(column.column_name);
      }
    }
  }
  return [...objectMap.values()].map((entry) => ({
    object_name: entry.object_name,
    object_type: entry.object_type,
    columns: [...entry.columns].sort()
  }));
}

function buildDelimitedSqlProbeScript(probeName, query) {
  return [
    "set feedback off",
    "set heading off",
    "set pagesize 0",
    "set verify off",
    "set echo off",
    "set termout on",
    "set trimspool on",
    `prompt __APEX_PROBE_BEGIN__|${probeName}`,
    query.trim().replace(/;?\s*$/, ";"),
    `prompt __APEX_PROBE_END__|${probeName}`,
    "exit"
  ].join("\n");
}

export function terminateSqlStatement(query = "") {
  return String(query).trim().replace(/;?\s*$/, ";");
}

function extractDelimitedProbeRows(output = "", probeName = "") {
  const pattern = new RegExp(`__APEX_PROBE_BEGIN__\\|${probeName}([\\s\\S]*?)__APEX_PROBE_END__\\|${probeName}`, "i");
  const match = output.match(pattern);
  const scopedOutput = match ? match[1] : output;
  return scopedOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function runStructuredSqlProbe({
  probeName,
  query,
  executionModeUsed,
  buildRoot,
  dbConnectionName
}) {
  const input = buildDelimitedSqlProbeScript(probeName, query);
  const sessionResult = executionModeUsed === "build-root"
    ? await runBuildRootSession({
        buildRoot,
        input,
        label: probeName
      })
    : runPathSession({
        dbConnectionName,
        input,
        labelPrefix: probeName
      });
  const output = cleanOutput(sessionResult.result || sessionResult);
  return {
    success: sessionResult.success && !SQL_PROBE_ERROR_PATTERN.test(output),
    sessionResult,
    rows: extractDelimitedProbeRows(output, probeName),
    output
  };
}

async function runLiveMetadataProbe({
  dbConnectionName,
  executionModeUsed,
  buildRoot
}) {
  const references = await collectMetadataReferences();
  if (references.length === 0) {
    return {
      currentSchema: "",
      currentUser: "",
      references: [],
      conflicts: [],
      missingObjects: [],
      missingColumns: []
    };
  }

  const schemaProbe = await runStructuredSqlProbe({
    probeName: "current_schema_user",
    query:
      "select sys_context('USERENV','CURRENT_SCHEMA') || '|' || sys_context('USERENV','SESSION_USER') from dual",
    executionModeUsed,
    buildRoot,
    dbConnectionName
  });
  if (!schemaProbe.success) {
    const error = new Error("Live metadata schema probe failed.");
    error.stageFailureClass = "preflight_live_metadata_probe_failed";
    error.nextSafeAction = "Fix the DB metadata probe failure before validation or import.";
    throw error;
  }
  const [schemaRow = ""] = schemaProbe.rows;
  const [currentSchema = "", currentUser = ""] = schemaRow.split("|").map((value) => value.trim());
  const objectNames = references.map((entry) => quoteSqlLiteral(normalizeComparableText(entry.object_name))).join(", ");
  const objectProbe = await runStructuredSqlProbe({
    probeName: "live_metadata_objects",
    query:
      "select owner || '|' || object_name || '|' || object_type from all_objects " +
      `where upper(object_name) in (${objectNames}) and object_type in ('TABLE', 'VIEW') order by owner, object_name`,
    executionModeUsed,
    buildRoot,
    dbConnectionName
  });
  if (!objectProbe.success) {
    const error = new Error("Live metadata object probe failed.");
    error.stageFailureClass = "preflight_live_metadata_probe_failed";
    error.nextSafeAction = "Fix the DB metadata object probe failure before validation or import.";
    throw error;
  }
  const liveObjects = objectProbe.rows.map((row) => {
    const [owner, objectName, objectType] = row.split("|").map((value) => value.trim());
    return { owner, object_name: objectName, object_type: objectType };
  });
  const liveObjectMap = new Map(liveObjects.map((entry) => [normalizeComparableText(entry.object_name), entry]));
  const missingObjects = references
    .filter((entry) => !liveObjectMap.has(normalizeComparableText(entry.object_name)))
    .map((entry) => entry.object_name);

  const missingColumns = [];
  for (const reference of references.filter((entry) => entry.columns.length > 0 && liveObjectMap.has(normalizeComparableText(entry.object_name)))) {
    const liveObject = liveObjectMap.get(normalizeComparableText(reference.object_name));
    const columnNames = reference.columns.map((column) => quoteSqlLiteral(normalizeComparableText(column))).join(", ");
    const columnProbe = await runStructuredSqlProbe({
      probeName: `live_metadata_columns_${sanitizeSegment(reference.object_name) || "object"}`,
      query:
        "select column_name from all_tab_columns " +
        `where owner = ${quoteSqlLiteral(liveObject.owner)} and upper(table_name) = upper(${quoteSqlLiteral(liveObject.object_name)}) and upper(column_name) in (${columnNames}) order by column_name`,
      executionModeUsed,
      buildRoot,
      dbConnectionName
    });
    if (!columnProbe.success) {
      const error = new Error(`Live metadata column probe failed for ${reference.object_name}.`);
      error.stageFailureClass = "preflight_live_metadata_probe_failed";
      error.nextSafeAction = "Fix the DB metadata column probe failure before validation or import.";
      throw error;
    }
    const liveColumns = new Set(columnProbe.rows.map((row) => normalizeComparableText(row)));
    for (const column of reference.columns) {
      if (!liveColumns.has(normalizeComparableText(column))) {
        missingColumns.push(`${reference.object_name}.${column}`);
      }
    }
  }

  const conflicts = references
    .filter((entry) => liveObjectMap.has(normalizeComparableText(entry.object_name)))
    .filter((entry) => {
      const liveObject = liveObjectMap.get(normalizeComparableText(entry.object_name));
      return entry.object_type && liveObject.object_type && normalizeComparableText(entry.object_type) !== normalizeComparableText(liveObject.object_type);
    })
    .map((entry) => {
      const liveObject = liveObjectMap.get(normalizeComparableText(entry.object_name));
      return {
        object_name: entry.object_name,
        bundled_type: entry.object_type,
        live_type: liveObject.object_type,
        live_owner: liveObject.owner
      };
    });

  return {
    currentSchema,
    currentUser,
    references,
    conflicts,
    missingObjects,
    missingColumns
  };
}

function classifyImportFallbackEligibility(runtimeResult) {
  const output = cleanOutput(runtimeResult?.result || runtimeResult);
  return Boolean(output) && WRAPPER_ONLY_FAILURE_PATTERN.test(output) && !VALIDATE_IMPORT_OUTPUT_PATTERN.test(output);
}

async function executeDirectImport({
  appPath,
  dbConnectionName,
  executionModeUsed,
  buildRoot,
  workspaceId,
  executeRoundtripImpl = executeSelectedRoundtrip
}) {
  return executeRoundtripImpl({
    appPath,
    dbConnectionName,
    executionModeUsed,
    buildRoot,
    workspaceId,
    includeImport: true
  });
}

function parseJsonOutput(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function pathForCommand(targetPath) {
  return String(path.resolve(targetPath)).replace(/\\/g, "/");
}

function quotedPath(targetPath) {
  return `"${pathForCommand(targetPath).replace(/"/g, '\\"')}"`;
}

function quoteSqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function normalizeComparableText(value = "") {
  return String(value).trim().replace(/\s+/g, " ").toUpperCase();
}

function sanitizeSegment(value = "") {
  return String(value)
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function hashText(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeRuntimeProvider(value = DEFAULT_RUNTIME_PROVIDER) {
  const normalized = String(value || DEFAULT_RUNTIME_PROVIDER).trim().toLowerCase();
  if (normalized === RUNTIME_PROVIDER_CHROME || normalized === RUNTIME_PROVIDER_HTTP) {
    return normalized;
  }
  return DEFAULT_RUNTIME_PROVIDER;
}

function decodeHtmlEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

function extractTextFromHtml(html = "") {
  return decodeHtmlEntities(
    String(html)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(RUNTIME_TEXT_TAG_STRIP_PATTERN, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function normalizeRuntimeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeRuntimeBaseUrl(baseUrl = "") {
  const trimmed = String(baseUrl || "").trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.replace(/\/+$/, "");
}

function getRuntimeBaseUrlCandidates(explicitBaseUrl = "") {
  const envCandidates = [
    process.env.APEX_RUNTIME_BASE_URL,
    process.env.APEX_BASE_URL,
    process.env.ORDS_BASE_URL,
    process.env.APEX_ORDS_BASE_URL
  ];
  const candidates = [explicitBaseUrl, ...envCandidates, ...DEFAULT_RUNTIME_BASE_URLS]
    .map((candidate) => normalizeRuntimeBaseUrl(candidate))
    .filter(Boolean);
  return [...new Set(candidates)];
}

function buildRuntimePageUrl({ runtimeBaseUrl = "", applicationId, pageId }) {
  const normalizedBaseUrl = normalizeRuntimeBaseUrl(runtimeBaseUrl);
  if (!normalizedBaseUrl || !applicationId || !pageId) {
    return "";
  }
  return `${normalizedBaseUrl}/f?p=${applicationId}:${pageId}`;
}

function sanitizeArtifactFilePart(value = "") {
  return sanitizeSegment(String(value || "").replace(/\./g, "-")) || "target";
}

function safeArtifactName(prefix, detail, suffix) {
  return `${sanitizeArtifactFilePart(prefix)}-${sanitizeArtifactFilePart(detail)}.${suffix}`;
}

async function requestRuntimeUrl(targetUrl, { maxRedirects = 5 } = {}) {
  const visited = [];

  async function execute(currentUrl, redirectsRemaining) {
    const parsedUrl = new URL(currentUrl);
    const client = parsedUrl.protocol === "https:" ? https : http;
    const result = await new Promise((resolve, reject) => {
      const req = client.request(
        parsedUrl,
        {
          method: "GET",
          headers: {
            "user-agent": "apexctl-runtime-verifier/1.0",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          },
          rejectUnauthorized: false
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            resolve({
              statusCode: res.statusCode || 0,
              headers: res.headers,
              body: Buffer.concat(chunks).toString("utf8")
            });
          });
        }
      );
      req.on("error", reject);
      req.end();
    });

    visited.push({
      url: currentUrl,
      statusCode: result.statusCode
    });

    const location = result.headers.location;
    if (
      location &&
      result.statusCode >= 300 &&
      result.statusCode < 400 &&
      redirectsRemaining > 0
    ) {
      const nextUrl = new URL(location, currentUrl).toString();
      return execute(nextUrl, redirectsRemaining - 1);
    }

    return {
      finalUrl: currentUrl,
      visited,
      ...result
    };
  }

  return execute(targetUrl, maxRedirects);
}

function extractPageFileId(pageFilePath = "") {
  const match = path.basename(pageFilePath).match(/^p0*([1-9]\d*|0+)-/i);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

async function deriveChangedPageFiles({ appPath, runCommandImpl }) {
  const pagesPath = path.join(path.resolve(appPath), "pages");
  const candidates = new Set();
  const gitCommands = [
    ["git", ["status", "--porcelain", "--", pagesPath]],
    ["git", ["ls-files", "--others", "--exclude-standard", "--", pagesPath]]
  ];

  for (const [command, args] of gitCommands) {
    const result = await runCommandImpl(command, args, {
      allowFailure: true,
      passthrough: false
    });
    if (result.code !== 0 && command === "git") {
      continue;
    }
    const lines = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    for (const line of lines) {
      const filePath = line.replace(/^[A-Z?]{1,2}\s+/, "").trim();
      if (/\/pages\/p\d+.*\.apx$/i.test(filePath)) {
        candidates.add(path.resolve(filePath));
      }
    }
  }

  return [...candidates].sort();
}

async function extractRuntimeTargets({
  appPath,
  runtimePageUrl = "",
  runtimeBaseUrl = "",
  pageId = "",
  runCommandImpl
}) {
  const appIdentity = await loadAppIdentity(appPath);
  const explicitPageId = pageId ? Number.parseInt(pageId, 10) : null;
  const pageFiles = explicitPageId
    ? [path.join(path.resolve(appPath), "pages", `p${String(explicitPageId).padStart(5, "0")}`)]
    : await deriveChangedPageFiles({ appPath, runCommandImpl });

  const targets = [];
  for (const pageFile of pageFiles) {
    const fileId = explicitPageId || extractPageFileId(pageFile);
    if (!fileId) {
      continue;
    }
    let resolvedPath = pageFile;
    if (!resolvedPath.endsWith(".apx")) {
      const matches = await collectFiles(path.dirname(resolvedPath), (candidate) => path.basename(candidate).startsWith(path.basename(resolvedPath)) && candidate.endsWith(".apx"));
      resolvedPath = matches[0] || "";
    }
    if (!resolvedPath || !(await exists(resolvedPath))) {
      targets.push({
        pageId: fileId,
        pageFilePath: resolvedPath,
        runtimeUrl: runtimePageUrl || buildRuntimePageUrl({
          runtimeBaseUrl,
          applicationId: appIdentity.applicationId,
          pageId: fileId
        }),
        expectedTexts: [],
        regionNames: [],
        pageName: "",
        pageTitle: ""
      });
      continue;
    }
    const content = await fs.readFile(resolvedPath, "utf8");
    const pageName = (content.match(/^\s*name:\s*(.+)$/m)?.[1] || "").trim();
    const pageTitle = (content.match(/^\s*title:\s*(.+)$/m)?.[1] || "").trim();
    const regionNames = [...content.matchAll(/^\s*region [^(]+\(\s*\n\s*name:\s*(.+)$/gm)]
      .map((match) => String(match[1] || "").trim())
      .filter(Boolean)
      .slice(0, 5);
    const expectedTexts = [pageTitle, pageName, ...regionNames].filter(Boolean);
    targets.push({
      pageId: fileId,
      pageFilePath: resolvedPath,
      runtimeUrl: runtimePageUrl || buildRuntimePageUrl({
        runtimeBaseUrl,
        applicationId: appIdentity.applicationId,
        pageId: fileId
      }),
      expectedTexts,
      regionNames,
      pageName,
      pageTitle
    });
  }

  return {
    appIdentity,
    targets
  };
}

function summarizeHttpRuntimeFindings({
  pageTarget,
  response,
  artifactPaths
}) {
  const bodyText = extractTextFromHtml(response.body);
  const normalizedBodyText = normalizeRuntimeText(bodyText);
  const findings = [];
  let blockingReason = "";
  let status = "pass";

  if (response.statusCode >= 400) {
    findings.push({
      category: "network",
      severity: "critical",
      code: "http_status_error",
      message: `Runtime page returned HTTP ${response.statusCode}.`
    });
    status = "fail";
    blockingReason = "runtime_page_http_error";
  }

  const loginDetected = LOGIN_PATTERNS.some((pattern) => pattern.test(bodyText))
    || response.visited.some((visit) => /:9999\b|login/i.test(visit.url));
  if (loginDetected) {
    findings.push({
      category: "auth",
      severity: "critical",
      code: "login_required",
      message: "Runtime verification reached a login page instead of the target page."
    });
    status = "blocked";
    blockingReason = "runtime_auth_required";
  }

  const runtimeErrorMatch = APEX_RUNTIME_ERROR_PATTERNS.find((pattern) => pattern.test(bodyText));
  if (runtimeErrorMatch) {
    findings.push({
      category: "dom",
      severity: "critical",
      code: "apex_runtime_error_text",
      message: "Runtime page body contains an APEX or ORA error signature."
    });
    status = "fail";
    blockingReason ||= "runtime_page_error_text_detected";
  }

  const missingExpectations = pageTarget.expectedTexts.filter((expectedText) => {
    const normalizedExpected = normalizeRuntimeText(expectedText.replace(/^&APP_TEXT\$[A-Z0-9_$.]+\.?$/i, ""));
    return normalizedExpected && !normalizedBodyText.includes(normalizedExpected);
  });
  for (const missingText of missingExpectations) {
    findings.push({
      category: "dom",
      severity: "warning",
      code: "expected_text_missing",
      message: `Expected runtime text was not found in the returned page HTML: ${missingText}`
    });
  }

  return {
    pageId: pageTarget.pageId,
    runtimeUrl: pageTarget.runtimeUrl,
    finalUrl: response.finalUrl,
    status,
    blockingReason,
    provider: RUNTIME_PROVIDER_HTTP,
    findings,
    consoleSummary: {
      status: "unavailable",
      message: "Console inspection is unavailable in the HTTP fallback provider."
    },
    networkSummary: {
      status: findings.some((finding) => finding.category === "network" && finding.severity === "critical") ? "fail" : "pass",
      requestCount: response.visited.length,
      redirects: response.visited.slice(0, -1)
    },
    artifactPaths,
    httpStatus: response.statusCode,
    pageTitle: pageTarget.pageTitle,
    pageName: pageTarget.pageName
  };
}

async function inferReachableRuntimeBaseUrl(explicitBaseUrl = "") {
  const candidates = getRuntimeBaseUrlCandidates(explicitBaseUrl);
  for (const candidate of candidates) {
    try {
      const response = await requestRuntimeUrl(`${candidate}/`);
      if (response.statusCode > 0 && response.statusCode < 500) {
        return {
          status: "pass",
          runtimeBaseUrl: candidate,
          checkedCandidates: candidates
        };
      }
    } catch {
      // Keep trying the next candidate.
    }
  }
  return {
    status: "fail",
    runtimeBaseUrl: "",
    checkedCandidates: candidates
  };
}

async function verifyRuntimeUiWithHttpFallback({
  appPath,
  runtimeBaseUrl = "",
  runtimePageUrl = "",
  pageId = "",
  artifactDir = DEFAULT_RUNTIME_VERIFY_ARTIFACT_DIR,
  runCommandImpl
}) {
  const baseUrlResolution = runtimePageUrl
    ? { status: "pass", runtimeBaseUrl: "", checkedCandidates: [] }
    : await inferReachableRuntimeBaseUrl(runtimeBaseUrl);
  const targetsResult = await extractRuntimeTargets({
    appPath,
    runtimePageUrl,
    runtimeBaseUrl: baseUrlResolution.runtimeBaseUrl,
    pageId,
    runCommandImpl
  });

  if (targetsResult.targets.length === 0) {
    return {
      code: 0,
      payload: {
        runtime_verification_status: "not-run",
        runtime_verification_provider_requested: DEFAULT_RUNTIME_PROVIDER,
        runtime_verification_provider_used: "none",
        runtime_verification_scope: "changed-pages-only",
        runtime_verification_targets: [],
        runtime_verification_findings: [],
        runtime_verification_artifacts: [],
        runtime_verification_blocking_reason: "",
        runtime_verification_retry_required: false,
        runtime_verification_notes: [
          "Runtime verification did not run because no changed page targets could be inferred from the current app path."
        ]
      }
    };
  }

  if (!runtimePageUrl && !baseUrlResolution.runtimeBaseUrl) {
    return {
      code: 1,
      payload: {
        runtime_verification_status: "blocked",
        runtime_verification_provider_requested: DEFAULT_RUNTIME_PROVIDER,
        runtime_verification_provider_used: "none",
        runtime_verification_scope: "changed-pages-only",
        runtime_verification_targets: targetsResult.targets.map((target) => ({
          page_id: target.pageId,
          runtime_url: target.runtimeUrl
        })),
        runtime_verification_findings: [],
        runtime_verification_artifacts: [],
        runtime_verification_blocking_reason: "runtime_base_url_inference_failed",
        runtime_verification_retry_required: true,
        runtime_verification_notes: [
          "I could not figure out the local runtime page URL.",
          "If you have the page URL or the app base URL, use that for runtime verification.",
          `Checked runtime base URL candidates: ${baseUrlResolution.checkedCandidates.join(", ")}`
        ]
      }
    };
  }

  await ensureDir(artifactDir);
  const pageResults = [];
  const runtimeArtifacts = [];

  for (const target of targetsResult.targets) {
    if (!target.runtimeUrl) {
      pageResults.push({
        pageId: target.pageId,
        runtimeUrl: "",
        finalUrl: "",
        status: "blocked",
        blockingReason: "runtime_target_url_missing",
        provider: RUNTIME_PROVIDER_HTTP,
        findings: [
          {
            category: "network",
            severity: "critical",
            code: "runtime_target_url_missing",
            message: "Runtime verification could not build a page URL for this target."
          }
        ],
        consoleSummary: {
          status: "unavailable",
          message: "Console inspection is unavailable in the HTTP fallback provider."
        },
        networkSummary: {
          status: "fail",
          requestCount: 0,
          redirects: []
        },
        artifactPaths: {},
        httpStatus: 0,
        pageTitle: target.pageTitle,
        pageName: target.pageName
      });
      continue;
    }

    try {
      const response = await requestRuntimeUrl(target.runtimeUrl);
      const htmlArtifactPath = path.join(
        artifactDir,
        safeArtifactName(`runtime-page-${targetsResult.appIdentity.applicationId || "app"}`, String(target.pageId), "html")
      );
      await fs.writeFile(htmlArtifactPath, response.body, "utf8");
      const artifactPaths = { html: htmlArtifactPath };
      runtimeArtifacts.push(artifactPaths);
      pageResults.push(
        summarizeHttpRuntimeFindings({
          pageTarget: target,
          response,
          artifactPaths
        })
      );
    } catch (error) {
      pageResults.push({
        pageId: target.pageId,
        runtimeUrl: target.runtimeUrl,
        finalUrl: "",
        status: "fail",
        blockingReason: "runtime_request_failed",
        provider: RUNTIME_PROVIDER_HTTP,
        findings: [
          {
            category: "network",
            severity: "critical",
            code: "runtime_request_failed",
            message: `Runtime verification request failed: ${error.message}`
          }
        ],
        consoleSummary: {
          status: "unavailable",
          message: "Console inspection is unavailable in the HTTP fallback provider."
        },
        networkSummary: {
          status: "fail",
          requestCount: 0,
          redirects: []
        },
        artifactPaths: {},
        httpStatus: 0,
        pageTitle: target.pageTitle,
        pageName: target.pageName
      });
    }
  }

  const blockingPage = pageResults.find((result) => result.status === "blocked");
  const failingPage = pageResults.find((result) => result.status === "fail");
  const overallStatus = blockingPage ? "blocked" : failingPage ? "fail" : "pass";

  return {
    code: overallStatus === "pass" ? 0 : 1,
    payload: {
      runtime_verification_status: overallStatus,
      runtime_verification_provider_requested: DEFAULT_RUNTIME_PROVIDER,
      runtime_verification_provider_used: RUNTIME_PROVIDER_HTTP,
      runtime_verification_scope: "changed-pages-only",
      runtime_verification_targets: pageResults.map((result) => ({
        page_id: result.pageId,
        runtime_url: result.runtimeUrl,
        final_url: result.finalUrl,
        status: result.status,
        page_name: result.pageName,
        page_title: result.pageTitle
      })),
      runtime_verification_findings: pageResults.flatMap((result) =>
        result.findings.map((finding) => ({
          page_id: result.pageId,
          runtime_url: result.runtimeUrl,
          ...finding
        }))
      ),
      runtime_verification_artifacts: runtimeArtifacts,
      runtime_verification_blocking_reason: blockingPage?.blockingReason || failingPage?.blockingReason || "",
      runtime_verification_retry_required: overallStatus !== "pass",
      runtime_verification_notes: overallStatus === "blocked"
        ? ["Runtime verification is blocked until the runtime page URL is reachable and authenticated."]
        : overallStatus === "fail"
          ? ["Runtime verification found critical live-page issues before import."]
          : ["Runtime verification did not find critical live-page issues in the HTTP fallback pass."]
    }
  };
}

export async function verifyRuntimeUi(options = {}) {
  const deps = {
    runCommand,
    verifyRuntimeWithChromeDevtools: null,
    ...options._deps
  };
  const requestedProvider = normalizeRuntimeProvider(options.runtimeProvider || DEFAULT_RUNTIME_PROVIDER);
  const artifactDir = path.resolve(options.artifactDir || DEFAULT_RUNTIME_VERIFY_ARTIFACT_DIR);

  if (!options.appPath) {
    return {
      code: 1,
      payload: {
        runtime_verification_status: "blocked",
        runtime_verification_provider_requested: requestedProvider,
        runtime_verification_provider_used: "none",
        runtime_verification_scope: "changed-pages-only",
        runtime_verification_targets: [],
        runtime_verification_findings: [],
        runtime_verification_artifacts: [],
        runtime_verification_blocking_reason: "missing_app_path",
        runtime_verification_retry_required: true,
        runtime_verification_notes: ["Missing required --app-path"]
      }
    };
  }

  if (
    requestedProvider === RUNTIME_PROVIDER_CHROME &&
    typeof deps.verifyRuntimeWithChromeDevtools === "function"
  ) {
    return deps.verifyRuntimeWithChromeDevtools({
      appPath: options.appPath,
      runtimeBaseUrl: options.runtimeBaseUrl,
      runtimePageUrl: options.runtimePageUrl,
      pageId: options.pageId,
      artifactDir
    });
  }

  const result = await verifyRuntimeUiWithHttpFallback({
    appPath: options.appPath,
    runtimeBaseUrl: options.runtimeBaseUrl,
    runtimePageUrl: options.runtimePageUrl,
    pageId: options.pageId,
    artifactDir,
    runCommandImpl: deps.runCommand
  });
  result.payload.runtime_verification_provider_requested = requestedProvider;
  if (requestedProvider === RUNTIME_PROVIDER_CHROME) {
    result.payload.runtime_verification_notes = [
      "Chrome DevTools MCP runtime verification is not available in this CLI execution path, so the run fell back to HTTP-based runtime verification.",
      ...result.payload.runtime_verification_notes
    ];
    result.payload.runtime_verification_provider_requested = RUNTIME_PROVIDER_CHROME;
  }
  return result;
}

/**
 * Build the same-session validate/import SQLcl script for a target app.
 */
function buildSqlclSessionScript(appPath, { workspaceId = "", includeImport = true } = {}) {
  const workspaceArg = workspaceId ? ` -workspaceid ${workspaceId}` : "";
  const lines = [`apex validate -input ${quotedPath(appPath)}${workspaceArg}`];
  if (includeImport) {
    lines.push(`apex import -input ${quotedPath(appPath)}${workspaceArg}`);
  }
  lines.push("exit");
  return lines.join("\n");
}

/**
 * Wrap a workspace lookup query with parseable output sentinels.
 */
export function buildWorkspaceLookupScript(query) {
  return [
    "set feedback off",
    "set heading off",
    "set pagesize 0",
    "set verify off",
    "set echo off",
    "set termout on",
    "set trimspool on",
    `prompt ${WORKSPACE_LOOKUP_BEGIN}`,
    terminateSqlStatement(query),
    `prompt ${WORKSPACE_LOOKUP_END}`,
    "exit"
  ].join("\n");
}

export function buildAppIdentityLookupScript(query) {
  return [
    "set feedback off",
    "set heading off",
    "set pagesize 0",
    "set verify off",
    "set echo off",
    "set termout on",
    "set trimspool on",
    `prompt ${APP_IDENTITY_LOOKUP_BEGIN}`,
    terminateSqlStatement(query),
    `prompt ${APP_IDENTITY_LOOKUP_END}`,
    "exit"
  ].join("\n");
}

export function buildWorkspaceScopeLookupScript(query) {
  return [
    "set feedback off",
    "set heading off",
    "set pagesize 0",
    "set verify off",
    "set echo off",
    "set termout on",
    "set trimspool on",
    `prompt ${WORKSPACE_SCOPE_LOOKUP_BEGIN}`,
    terminateSqlStatement(query),
    `prompt ${WORKSPACE_SCOPE_LOOKUP_END}`,
    "exit"
  ].join("\n");
}

export function buildWorkspaceAppListScript(query) {
  return [
    "set feedback off",
    "set heading off",
    "set pagesize 0",
    "set verify off",
    "set echo off",
    "set termout on",
    "set trimspool on",
    `prompt ${WORKSPACE_APP_LIST_BEGIN}`,
    terminateSqlStatement(query),
    `prompt ${WORKSPACE_APP_LIST_END}`,
    "exit"
  ].join("\n");
}

/**
 * Run an interactive command with stdin and normalized stdout/stderr capture.
 */
function runInteractiveCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    input: options.input,
    timeout: options.timeout ?? 300000,
    env: { ...process.env, ...(options.env ?? {}) }
  });
  return {
    code: typeof result.status === "number" ? result.status : 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error.message || result.error) : ""
  };
}

export function hasRuntimeFailure(result) {
  const output = cleanOutput(result);
  return result.code !== 0 || FAILURE_PATTERN.test(output) || WARNING_PATTERN.test(output) || PASSWORD_PROMPT_PATTERN.test(output);
}

/**
 * Detect SQLcl output that requires a run-scoped workspace ID retry.
 */
export function hasWorkspaceAmbiguity(result) {
  return WORKSPACE_PATTERN.test(cleanOutput(result));
}

function extractWorkspaceIds(output = "") {
  const markerPattern = new RegExp(`${WORKSPACE_LOOKUP_BEGIN}([\\s\\S]*?)${WORKSPACE_LOOKUP_END}`, "i");
  const match = output.match(markerPattern);
  const scopedOutput = match ? match[1] : output;
  return [...new Set(
    scopedOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\d+$/.test(line))
  )];
}

function extractAppIdentityRows(output = "") {
  const markerPattern = new RegExp(`${APP_IDENTITY_LOOKUP_BEGIN}([\\s\\S]*?)${APP_IDENTITY_LOOKUP_END}`, "i");
  const match = output.match(markerPattern);
  const scopedOutput = match ? match[1] : output;
  return scopedOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [idValue, ...aliasParts] = line.split("|");
      const applicationId = Number.parseInt(idValue, 10);
      if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return null;
      }
      return {
        applicationId,
        applicationAlias: aliasParts.join("|").trim()
      };
    })
    .filter(Boolean);
}

function extractWorkspaceScopeRows(output = "") {
  const markerPattern = new RegExp(`${WORKSPACE_SCOPE_LOOKUP_BEGIN}([\\s\\S]*?)${WORKSPACE_SCOPE_LOOKUP_END}`, "i");
  const match = output.match(markerPattern);
  const scopedOutput = match ? match[1] : output;
  return scopedOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [idValue, ...nameParts] = line.split("|");
      const workspaceId = Number.parseInt(idValue, 10);
      if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
        return null;
      }
      return {
        workspaceId: String(workspaceId),
        workspaceName: nameParts.join("|").trim()
      };
    })
    .filter(Boolean);
}

function extractWorkspaceApplicationRows(output = "") {
  const markerPattern = new RegExp(`${WORKSPACE_APP_LIST_BEGIN}([\\s\\S]*?)${WORKSPACE_APP_LIST_END}`, "i");
  const match = output.match(markerPattern);
  const scopedOutput = match ? match[1] : output;
  return scopedOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [idValue, aliasValue = "", ...nameParts] = line.split("|");
      const applicationId = Number.parseInt(idValue, 10);
      if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return null;
      }
      return {
        applicationId,
        applicationAlias: aliasValue.trim(),
        applicationName: nameParts.join("|").trim()
      };
    })
    .filter(Boolean);
}

function parseApplicationAlias(applicationContent = "") {
  const match = applicationContent.match(/^\s*app\s+([A-Z0-9_-]+)\s*\(/m);
  return match?.[1] ?? "";
}

function parseApplicationName(applicationContent = "") {
  const match = applicationContent.match(/^\s*name:\s*(.+)$/m);
  return match?.[1]?.trim() ?? "";
}

/**
 * Load app identity metadata from deployment files and application DSL.
 */
async function loadAppIdentity(appPath) {
  const identity = {
    applicationId: null,
    applicationAlias: "",
    applicationName: "",
    workspaceName: ""
  };

  const deploymentPath = path.join(appPath, "deployments", "default.json");
  try {
    const deployment = JSON.parse(await fs.readFile(deploymentPath, "utf8"));
    const appId = Number.parseInt(String(deployment?.app?.id ?? ""), 10);
    if (Number.isInteger(appId) && appId > 0) {
      identity.applicationId = appId;
    }
    identity.workspaceName = String(deployment?.workspace?.name ?? "").trim();
  } catch {
    // Keep identity unset when deployment metadata is unavailable.
  }

  const applicationPath = path.join(appPath, "application.apx");
  try {
    const applicationContent = await fs.readFile(applicationPath, "utf8");
    identity.applicationAlias = parseApplicationAlias(applicationContent);
    identity.applicationName = parseApplicationName(applicationContent);
  } catch {
    // Keep alias unset when the application file is unavailable.
  }

  return identity;
}

async function resolveAppIdentityOrThrow(appPath) {
  const identity = await loadAppIdentity(appPath);
  if (!identity.applicationId) {
    throw new Error("Application identity could not be derived from deployments/default.json.");
  }
  return identity;
}

async function writeAppDeploymentId(appPath, applicationId) {
  const deploymentPath = path.join(appPath, "deployments", "default.json");
  let deployment = {};
  try {
    deployment = JSON.parse(await fs.readFile(deploymentPath, "utf8"));
  } catch {
    deployment = {};
  }
  deployment.app = deployment.app && typeof deployment.app === "object" ? deployment.app : {};
  deployment.app.id = applicationId;
  await fs.writeFile(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");
}

/**
 * Build a deterministic file manifest for exported app content.
 */
async function buildManifestFromDirectory(rootDir, { excludePaths = [] } = {}) {
  const excluded = new Set(excludePaths.map((entry) => path.resolve(entry)));
  const files = (await collectFiles(rootDir)).filter((filePath) => !excluded.has(path.resolve(filePath)));
  const entries = [];
  for (const filePath of files) {
    const buffer = await fs.readFile(filePath);
    entries.push({
      path: path.relative(rootDir, filePath).replace(/\\/g, "/"),
      sha256: createHash("sha256").update(buffer).digest("hex"),
      bytes: buffer.length
    });
  }
  const hash = hashText(
    stableStringify(entries.map(({ path: relPath, sha256, bytes }) => ({ path: relPath, sha256, bytes })))
  );
  return {
    generated_at: new Date().toISOString(),
    hash,
    file_count: entries.length,
    files: entries
  };
}

async function buildWorkspaceLookupCandidates(appPath) {
  const identity = await loadAppIdentity(appPath);
  const candidates = [];

  if (identity.applicationId) {
    candidates.push({
      source: "application_id",
      query: `select distinct workspace_id from apex_applications where application_id = ${identity.applicationId};`
    });
  }

  if (identity.applicationAlias) {
    candidates.push({
      source: "application_alias",
      query: `select distinct workspace_id from apex_applications where upper(alias) = upper(${quoteSqlLiteral(identity.applicationAlias)});`
    });
  }

  return candidates;
}

function buildCanonicalAppIdentityCandidates({ sourceIdentity, preservedCanonicalId }) {
  const candidates = [];

  if (preservedCanonicalId) {
    candidates.push({
      source: "preserved_session_authority",
      query:
        "select distinct application_id || '|' || nvl(alias, '') " +
        `from apex_applications where application_id = ${preservedCanonicalId};`
    });
  }

  if (sourceIdentity.applicationId) {
    candidates.push({
      source: "source_application_id",
      query:
        "select distinct application_id || '|' || nvl(alias, '') " +
        `from apex_applications where application_id = ${sourceIdentity.applicationId};`
    });
  }

  if (sourceIdentity.applicationAlias) {
    candidates.push({
      source: "source_application_alias",
      query:
        "select distinct application_id || '|' || nvl(alias, '') " +
        `from apex_applications where upper(alias) = upper(${quoteSqlLiteral(sourceIdentity.applicationAlias)});`
    });
  }

  return candidates;
}

async function resolvePreservedCanonicalAuthority({ reportPath, appPath, dbConnectionName }) {
  try {
    const prior = await readJson(reportPath);
    if (
      path.resolve(prior?.final_app_path || "") === path.resolve(appPath) &&
      prior?.db_connection_name === dbConnectionName &&
      Number.isInteger(prior?.canonical_application_id) &&
      prior.canonical_application_id > 0
    ) {
      return {
        applicationId: prior.canonical_application_id,
        applicationAlias: prior.canonical_application_alias || "",
        source: "runtime_report"
      };
    }
  } catch {
    // Ignore missing or unreadable prior runtime reports.
  }
  return null;
}

async function resolvePreservedSourceLaneFailure({ reportPath, appPath, dbConnectionName, sourceLaneInputHash, canonicalApplicationId }) {
  try {
    const prior = await readJson(reportPath);
    if (path.resolve(prior?.final_app_path || "") !== path.resolve(appPath)) {
      return null;
    }
    if (prior?.db_connection_name !== dbConnectionName) {
      return null;
    }
    if (prior?.import_lane_used !== SOURCE_IMPORT_LANE) {
      return null;
    }
    if (!CACHEABLE_SOURCE_LANE_FAILURE_CLASSES.has(prior?.failure_class || "")) {
      return null;
    }
    if (!prior?.source_lane_input_hash || prior.source_lane_input_hash !== sourceLaneInputHash) {
      return null;
    }
    if (
      Number.isInteger(canonicalApplicationId) &&
      Number.isInteger(prior?.canonical_application_id) &&
      prior.canonical_application_id !== canonicalApplicationId
    ) {
      return null;
    }
    return {
      failureClass: prior.failure_class,
      blockingReason: prior.blocking_reason || "",
      failureStage: prior.failure_stage || "",
      debuggingBucket: prior.debugging_bucket || "",
      owningLayer: prior.owning_layer || "",
      confirmingCheck: prior.confirming_check || "",
      fixPattern: prior.fix_pattern || "",
      canonicalApplicationId: Number.isInteger(prior?.canonical_application_id) ? prior.canonical_application_id : null,
      canonicalApplicationAlias: prior?.canonical_application_alias || "",
      importLaneDecisionBasis: prior?.lane_decision_basis || "",
      sourceLaneInputHash: prior.source_lane_input_hash
    };
  } catch {
    return null;
  }
}

function restoreCachedFailureDebuggingRoute(summary, preservedFailure) {
  summary.failure_stage = preservedFailure.failureStage || summary.failure_stage;
  summary.debugging_bucket = preservedFailure.debuggingBucket || preservedFailure.failureClass || summary.debugging_bucket;
  summary.owning_layer = preservedFailure.owningLayer || summary.owning_layer;
  summary.confirming_check = preservedFailure.confirmingCheck || summary.confirming_check;
  summary.fix_pattern = preservedFailure.fixPattern || summary.fix_pattern;
  summary.review_status = "debugging_routed";
}

async function runLookupSession({ buildRoot, dbConnectionName, executionModeUsed, input, label }) {
  return executionModeUsed === "build-root"
    ? runBuildRootSession({ buildRoot, input, label })
    : runPathSession({ dbConnectionName, input, labelPrefix: label });
}

async function resolveWorkspaceScopeForRuntime(options = {}) {
  const sourceIdentity = options.sourceIdentity ?? await loadAppIdentity(options.appPath);
  const transcriptParts = ["## workspace_scope_status\nResolving intended workspace scope for runtime target resolution.\n"];

  if (options.workspaceId) {
    transcriptParts.push(`Using run-scoped workspace id ${options.workspaceId}.\n`);
    return {
      success: true,
      workspaceId: String(options.workspaceId),
      workspaceName: sourceIdentity.workspaceName || "",
      resolutionSource: "run_scoped_workspaceid",
      transcript: transcriptParts.join("\n")
    };
  }

  if (!sourceIdentity.workspaceName) {
    transcriptParts.push("Source deployment metadata does not define a workspace name.\n");
    return {
      success: false,
      blockingReason: "lookup_scope_workspace_missing",
      message: "Unable to bound runtime target resolution to one workspace because deployments/default.json does not define workspace.name.",
      transcript: transcriptParts.join("\n")
    };
  }

  const script = buildWorkspaceScopeLookupScript(
    "select workspace_id || '|' || workspace " +
      `from apex_workspaces where upper(workspace) = upper(${quoteSqlLiteral(sourceIdentity.workspaceName)});`
  );
  const sessionResult = await runLookupSession({
    buildRoot: options.buildRoot,
    dbConnectionName: options.dbConnectionName,
    executionModeUsed: options.executionModeUsed,
    input: script,
    label: "workspace_scope_lookup"
  });
  transcriptParts.push(sessionResult.transcript);

  if (!sessionResult.success) {
    transcriptParts.push("Workspace scope lookup session failed.\n");
    return {
      success: false,
      blockingReason: "lookup_scope_workspace_session_failed",
      message: "Unable to confirm the intended workspace scope in the selected runtime path.",
      transcript: transcriptParts.join("\n")
    };
  }

  const rows = extractWorkspaceScopeRows(cleanOutput(sessionResult.result));
  if (rows.length === 1) {
    transcriptParts.push(`Resolved workspace id ${rows[0].workspaceId} using workspace.name.\n`);
    return {
      success: true,
      workspaceId: rows[0].workspaceId,
      workspaceName: rows[0].workspaceName || sourceIdentity.workspaceName,
      resolutionSource: "deployment_workspace_name",
      transcript: transcriptParts.join("\n")
    };
  }

  transcriptParts.push(
    rows.length > 1
      ? `Workspace scope lookup returned multiple matches for ${sourceIdentity.workspaceName}.\n`
      : `Workspace scope lookup returned no match for ${sourceIdentity.workspaceName}.\n`
  );
  return {
    success: false,
    blockingReason: rows.length > 1 ? "lookup_scope_workspace_ambiguous" : "lookup_scope_workspace_not_found",
    message: rows.length > 1
      ? `Workspace scope lookup returned multiple matches for workspace ${sourceIdentity.workspaceName}.`
      : `Workspace scope lookup found no workspace named ${sourceIdentity.workspaceName}.`,
    transcript: transcriptParts.join("\n")
  };
}

async function resolveRuntimeTargetApplication(options = {}) {
  const sourceIdentity = options.sourceIdentity ?? await loadAppIdentity(options.appPath);
  const transcriptParts = ["## target_resolution_status\nResolving runtime target application.\n"];
  const workspaceScope = await resolveWorkspaceScopeForRuntime({
    appPath: options.appPath,
    sourceIdentity,
    dbConnectionName: options.dbConnectionName,
    executionModeUsed: options.executionModeUsed,
    buildRoot: options.buildRoot,
    workspaceId: options.workspaceId
  });
  transcriptParts.push(workspaceScope.transcript);

  if (!workspaceScope.success) {
    return {
      success: false,
      targetResolutionStatus: "identity_uncertain",
      blockingReason: workspaceScope.blockingReason,
      message: workspaceScope.message,
      sourceIdentity,
      lookupScopeWorkspaceId: "",
      lookupScopeWorkspaceName: sourceIdentity.workspaceName || "",
      candidateCount: 0,
      candidateIds: [],
      candidateEvidenceLevel: "",
      transcript: transcriptParts.join("\n")
    };
  }

  const lookupScopeWorkspaceId = workspaceScope.workspaceId;
  const lookupScopeWorkspaceName = workspaceScope.workspaceName;
  const idCandidates = [];
  if (options.preservedCanonicalAuthority?.applicationId) {
    idCandidates.push({
      source: "preserved_session_authority",
      applicationId: options.preservedCanonicalAuthority.applicationId
    });
  }
  if (sourceIdentity.applicationId) {
    idCandidates.push({
      source: "source_application_id",
      applicationId: sourceIdentity.applicationId
    });
  }

  for (const candidate of idCandidates) {
    const script = buildAppIdentityLookupScript(
      "select application_id || '|' || nvl(alias, '') " +
        `from apex_applications where workspace_id = ${lookupScopeWorkspaceId} and application_id = ${candidate.applicationId};`
    );
    const sessionResult = await runLookupSession({
      buildRoot: options.buildRoot,
      dbConnectionName: options.dbConnectionName,
      executionModeUsed: options.executionModeUsed,
      input: script,
      label: `target_resolution_${candidate.source}`
    });
    transcriptParts.push(sessionResult.transcript);
    if (!sessionResult.success) {
      return {
        success: false,
        targetResolutionStatus: "identity_uncertain",
        blockingReason: "target_resolution_id_lookup_failed",
        message: `Runtime target resolution failed while checking ${candidate.source}.`,
        sourceIdentity,
        lookupScopeWorkspaceId,
        lookupScopeWorkspaceName,
        candidateCount: 0,
        candidateIds: [],
        candidateEvidenceLevel: "",
        transcript: transcriptParts.join("\n")
      };
    }
    const rows = extractAppIdentityRows(cleanOutput(sessionResult.result));
    if (rows.length === 1) {
      transcriptParts.push(`Resolved existing app ${rows[0].applicationId} using ${candidate.source}.\n`);
      return {
        success: true,
        targetResolutionStatus: "resolved_existing_app",
        sourceIdentity,
        canonicalIdentity: rows[0],
        resolutionSource: candidate.source,
        lookupScopeWorkspaceId,
        lookupScopeWorkspaceName,
        candidateCount: 1,
        candidateIds: [rows[0].applicationId],
        candidateEvidenceLevel: "id",
        transcript: transcriptParts.join("\n")
      };
    }
    if (rows.length > 1) {
      return {
        success: true,
        targetResolutionStatus: "ambiguous_candidates",
        sourceIdentity,
        message: `Runtime target resolution found multiple live apps while checking ${candidate.source}.`,
        lookupScopeWorkspaceId,
        lookupScopeWorkspaceName,
        candidateCount: rows.length,
        candidateIds: rows.map((row) => row.applicationId),
        candidateEvidenceLevel: "id",
        transcript: transcriptParts.join("\n")
      };
    }
  }

  if (sourceIdentity.applicationAlias) {
    const aliasScript = buildAppIdentityLookupScript(
      "select application_id || '|' || nvl(alias, '') " +
        `from apex_applications where workspace_id = ${lookupScopeWorkspaceId} and upper(alias) = upper(${quoteSqlLiteral(sourceIdentity.applicationAlias)});`
    );
    const aliasResult = await runLookupSession({
      buildRoot: options.buildRoot,
      dbConnectionName: options.dbConnectionName,
      executionModeUsed: options.executionModeUsed,
      input: aliasScript,
      label: "target_resolution_source_application_alias"
    });
    transcriptParts.push(aliasResult.transcript);
    if (!aliasResult.success) {
      return {
        success: false,
        targetResolutionStatus: "identity_uncertain",
        blockingReason: "target_resolution_alias_lookup_failed",
        message: "Runtime target resolution failed while checking source application alias.",
        sourceIdentity,
        lookupScopeWorkspaceId,
        lookupScopeWorkspaceName,
        candidateCount: 0,
        candidateIds: [],
        candidateEvidenceLevel: "",
        transcript: transcriptParts.join("\n")
      };
    }
    const aliasRows = extractAppIdentityRows(cleanOutput(aliasResult.result));
    if (aliasRows.length === 1) {
      transcriptParts.push(`Resolved existing app ${aliasRows[0].applicationId} using source application alias.\n`);
      return {
        success: true,
        targetResolutionStatus: "resolved_existing_app",
        sourceIdentity,
        canonicalIdentity: aliasRows[0],
        resolutionSource: "source_application_alias",
        lookupScopeWorkspaceId,
        lookupScopeWorkspaceName,
        candidateCount: 1,
        candidateIds: [aliasRows[0].applicationId],
        candidateEvidenceLevel: "alias",
        transcript: transcriptParts.join("\n")
      };
    }
    if (aliasRows.length > 1) {
      return {
        success: true,
        targetResolutionStatus: "ambiguous_candidates",
        sourceIdentity,
        message: "Runtime target resolution found multiple live apps with the same alias in the intended workspace.",
        lookupScopeWorkspaceId,
        lookupScopeWorkspaceName,
        candidateCount: aliasRows.length,
        candidateIds: aliasRows.map((row) => row.applicationId),
        candidateEvidenceLevel: "alias",
        transcript: transcriptParts.join("\n")
      };
    }
  }

  const appListScript = buildWorkspaceAppListScript(
    "select application_id || '|' || nvl(alias, '') || '|' || nvl(application_name, '') " +
      `from apex_applications where workspace_id = ${lookupScopeWorkspaceId} order by application_id`
  );
  const appListResult = await runLookupSession({
    buildRoot: options.buildRoot,
    dbConnectionName: options.dbConnectionName,
    executionModeUsed: options.executionModeUsed,
    input: appListScript,
    label: "target_resolution_workspace_app_list"
  });
  transcriptParts.push(appListResult.transcript);
  if (!appListResult.success) {
    return {
      success: false,
      targetResolutionStatus: "identity_uncertain",
      blockingReason: "target_resolution_workspace_app_list_failed",
      message: "Runtime target resolution could not list apps in the intended workspace.",
      sourceIdentity,
      lookupScopeWorkspaceId,
      lookupScopeWorkspaceName,
      candidateCount: 0,
      candidateIds: [],
      candidateEvidenceLevel: "",
      transcript: transcriptParts.join("\n")
    };
  }

  const workspaceApps = extractWorkspaceApplicationRows(cleanOutput(appListResult.result));
  const sourceName = normalizeComparableText(sourceIdentity.applicationName);
  const fingerprintCandidates = sourceName
    ? workspaceApps.filter((row) => normalizeComparableText(row.applicationName) === sourceName)
    : [];

  if (fingerprintCandidates.length === 0) {
    transcriptParts.push("No existing app candidate matched the bounded workspace lookup.\n");
    return {
      success: true,
      targetResolutionStatus: "not_found_in_workspace",
      sourceIdentity,
      resolutionSource: "workspace_not_found",
      lookupScopeWorkspaceId,
      lookupScopeWorkspaceName,
      candidateCount: 0,
      candidateIds: [],
      candidateEvidenceLevel: "not-found",
      transcript: transcriptParts.join("\n")
    };
  }

  transcriptParts.push(
    `Workspace fingerprint lookup produced ${fingerprintCandidates.length} plausible candidate(s): ${fingerprintCandidates.map((row) => row.applicationId).join(", ")}.\n`
  );
  return {
    success: true,
    targetResolutionStatus: "ambiguous_candidates",
    sourceIdentity,
    message: "Runtime target resolution found plausible existing app candidates but could not prove a unique target.",
    lookupScopeWorkspaceId,
    lookupScopeWorkspaceName,
    candidateCount: fingerprintCandidates.length,
    candidateIds: fingerprintCandidates.map((row) => row.applicationId),
    candidateEvidenceLevel: "fingerprint",
    transcript: transcriptParts.join("\n")
  };
}

/**
 * Classify failures caused by local runtime environment issues rather than app content.
 */
export function classifyEnvironmentBlocker({ localValidationStatus, executionModeUsed, runtimeResult }) {
  if (localValidationStatus !== "pass" || executionModeUsed !== "build-root" || !runtimeResult) {
    return null;
  }
  const output = cleanOutput(runtimeResult.result || runtimeResult);
  if (!output || VALIDATE_IMPORT_OUTPUT_PATTERN.test(output)) {
    return null;
  }
  if (!BUILT_ROOT_SANDBOX_FILESYSTEM_PATTERN.test(output) || !BUILD_ROOT_WORKDIR_PATTERN.test(output)) {
    return null;
  }
  return {
    failure_class: "environment_blocker",
    blocking_reason: "build_root_sandbox_filesystem_setup",
    environment_blocker_detected: true,
    environment_blocker_details: "Build-root runtime could not create required workdir files before real validate/import output."
  };
}

/**
 * Resolve and persist diagnostics for the local APEX build root.
 */
export async function resolveBuildRoot(options) {
  const reportPath = path.resolve(options.reportPath || DEFAULT_BUILD_ROOT_REPORT);
  const result = {
    timestamp: new Date().toISOString(),
    db_connection_name: options.dbConnectionName,
    ...resolveBuildRootInfo({
      dbConnectionName: options.dbConnectionName,
      apexRoot: options.apexRoot
    })
  };
  await writeJson(reportPath, result);
  return { code: result.status === "pass" ? 0 : 1, payload: result };
}

/**
 * Run the standalone SQLcl preflight probe and parse its JSON status.
 */
export async function getSqlclPreflight(options = {}) {
  const args = [sqlclToolPath("sqlcl_preflight.mjs")];
  appendOption(args, "--db-connection-name", options.dbConnectionName || "");
  appendOption(args, "--execution-mode", normalizeExecutionMode(options.executionMode || "auto"));
  appendOption(args, "--apex-root", options.apexRoot || "");
  appendOption(args, "--report-path", options.reportPath || DEFAULT_PREFLIGHT_REPORT);
  const result = await runCommand("node", args, { allowFailure: true, passthrough: false });
  const payload = parseJsonOutput(result.stdout) ?? {
    timestamp: new Date().toISOString(),
    execution_mode_requested: normalizeExecutionMode(options.executionMode || "auto"),
    execution_mode_used: "",
    required_runtime_commands_available: false,
    capability_state: "preflight_output_unparseable",
    notes: ["sqlcl_preflight.mjs did not return parseable JSON"],
    raw_stdout: result.stdout,
    raw_stderr: result.stderr
  };
  return { code: result.code, payload, stdout: result.stdout, stderr: result.stderr };
}

/**
 * Run SQLcl preflight and write the canonical runtime capability report.
 */
export async function runSqlclPreflight(options = {}) {
  const summary = {
    timestamp: new Date().toISOString(),
    phase_reports: [],
    preflight_only: true,
    doctor_mode: Boolean(options.doctorMode),
    app_path: options.appPath ? path.resolve(options.appPath) : "",
    db_connection_name: options.dbConnectionName || "",
    execution_mode_requested: normalizeExecutionMode(options.executionMode || "auto"),
    supporting_objects_enabled: Boolean(options.supportingObjects)
  };
  const stage = await runTimedStage(
    summary,
    "preflight",
    {
      app_path: options.appPath || "",
      db_connection_name: options.dbConnectionName || "",
      execution_mode: options.executionMode || "auto"
    },
    async () => {
      const result = await getSqlclPreflight(options);
      const payload = {
        ...result.payload,
        phase_reports: summary.phase_reports,
        preflight_only: true,
        doctor_mode: Boolean(options.doctorMode),
        app_path: options.appPath ? path.resolve(options.appPath) : "",
        supporting_objects_enabled: Boolean(options.supportingObjects)
      };
      if (options.appPath && payload.execution_mode_used) {
        const liveMetadata = await runLiveMetadataProbe({
          dbConnectionName: options.dbConnectionName,
          executionModeUsed: payload.execution_mode_used,
          buildRoot: payload.build_root_runtime?.recommended_cwd || ""
        });
        payload.live_metadata_probe = {
          references: liveMetadata.references,
          conflicts: liveMetadata.conflicts,
          missing_objects: liveMetadata.missingObjects,
          missing_columns: liveMetadata.missingColumns,
          current_schema: liveMetadata.currentSchema,
          current_user: liveMetadata.currentUser
        };
      }
      return { result, payload };
    }
  );
  const payload = stage.ok
    ? { ...stage.result.payload, phase_reports: summary.phase_reports }
    : {
        timestamp: new Date().toISOString(),
        db_connection_name: options.dbConnectionName || "",
        execution_mode_requested: normalizeExecutionMode(options.executionMode || "auto"),
        execution_mode_used: "",
        capability_state: stage.stage.failure_class,
        required_runtime_commands_available: false,
        phase_reports: summary.phase_reports,
        preflight_only: true,
        doctor_mode: Boolean(options.doctorMode),
        notes: [stage.stage.next_safe_action]
      };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  return { code: stage.ok ? stage.result.result.code : 1, payload };
}

/**
 * Create the standard runtime roundtrip summary envelope.
 */
function buildRoundtripSummary(base) {
  const reportPath = path.resolve(base.reportPath || DEFAULT_ROUNDTRIP_REPORT);
  const transcriptPath = path.resolve(base.transcriptPath || DEFAULT_ROUNDTRIP_LOG);
  const problemsPath = path.resolve(base.problemsPath || path.join(path.dirname(reportPath), "problems.json"));
  return {
    timestamp: new Date().toISOString(),
    final_app_path: path.resolve(base.appPath),
    temp_app_path: "",
    failed_temp_app_path: "",
    phase_reports: [],
    stage_budgets_ms: STAGE_BUDGETS_MS,
    frozen_preflight_facts: null,
    db_connection_name: base.dbConnectionName,
    connection_signature: null,
    target_build: "",
    warnings_as_errors: true,
    execution_mode_requested: normalizeExecutionMode(base.executionMode || "auto"),
    execution_mode_used: "",
    preflight_only: Boolean(base.preflightOnly),
    doctor_mode: Boolean(base.doctorMode),
    supporting_objects_enabled: Boolean(base.supportingObjects),
    import_mode_requested: base.importMode || "auto",
    import_mode_used: base.importMode || "auto",
    reason: "",
    import_intent_prompted: false,
    import_intent_choice: "unresolved",
    import_intent_source: "",
    runtime_action_resolved: "",
    runtime_action_source: "",
    import_lane_requested: SOURCE_IMPORT_LANE,
    import_lane_used: "",
    import_lane_fallback_used: false,
    import_lane_fallback_reason: "",
    lane_decision_basis: "",
    source_lane_input_hash: "",
    source_lane_retry_state: "not_used",
    source_lane_retry_skipped_due_to_cached_failure: false,
    source_lane_last_failure_class: "",
    source_lane_last_failure_stage: "",
    alternate_import_lane_available: false,
    alternate_import_lane_name: COMPILED_SQL_EXPORT_IMPORT_LANE,
    target_resolution_mode: base.targetResolutionMode || "update-existing",
    target_resolution_status: "not-required",
    lookup_scope_workspaceid: "",
    lookup_scope_workspace_name: "",
    candidate_count: 0,
    candidate_ids: [],
    candidate_evidence_level: "",
    target_resolution_required_for_import: true,
    direct_import_bypass_forbidden: true,
    direct_import_fallback_allowed: false,
    create_new_confirmation_required: false,
    create_new_confirmed: Boolean(base.createNewConfirmed),
    source_application_id: null,
    source_application_alias: "",
    canonical_application_id: null,
    canonical_application_alias: "",
    canonical_resolution_source: "",
    canonical_mapping_status: "not-required",
    canonical_mapping_reused: false,
    canonical_mapping_mismatch_detected: false,
    canonical_mapping_reconciled_source: false,
    accidental_duplicate_application_id: null,
    runtime_selection_note: "",
    workspaceid: base.workspaceId || "",
    recommended_next_action: "",
    review_status: "internal_loop_required",
    review_pass_count: 0,
    confidence_score: null,
    confidence_threshold: 0.95,
    blocking_findings_count: null,
    validate_status: "blocked",
    local_check_status: "not-run",
    live_check_status: "blocked",
    final_check_status: "blocked",
    local_check_token: "",
    live_check_token: "",
    import_status: "blocked",
    runtime_gate_status: "blocked",
    runtime_verification_status: "not-run",
    runtime_verification_required: Boolean(base.requireRuntimeVerification),
    runtime_verification_provider_requested: normalizeRuntimeProvider(base.runtimeProvider || DEFAULT_RUNTIME_PROVIDER),
    runtime_verification_provider_used: "none",
    runtime_verification_scope: "changed-pages-only",
    runtime_verification_targets: [],
    runtime_verification_findings: [],
    runtime_verification_artifacts: [],
    runtime_verification_blocking_reason: "",
    runtime_verification_retry_required: false,
    capability_state: "",
    local_validation_policy: "advisory",
    local_validation_execution_status: "not-run",
    local_validation_status: "not-run",
    local_validation_entrypoint_requested: LOCAL_VALIDATION_REQUESTED_ENTRYPOINT,
    local_validation_entrypoint_used: "",
    local_validation_fallback_used: false,
    local_validation_fallback_reason: "",
    local_validation_primary_status: "not-run",
    local_validation_fallback_status: "not-run",
    publish_status: "blocked",
    cleanup_status: "blocked",
    resolved_apex_build_root: "",
    recommended_cwd: "",
    runtime_entrypoint: "",
    session_entrypoint_used: "",
    failure_stage: "",
    debugging_bucket: "",
    owning_layer: "",
    confirming_check: "",
    fix_pattern: "",
    auto_fix_eligible: false,
    auto_fix_applied: false,
    auto_fix_handler: "",
    debug_retry_count: 0,
    debug_max_retry_count: DEBUG_MAX_RETRY_COUNT,
    external_owner_handoff_required: false,
    failure_class: "",
    blocking_reason: "",
    environment_blocker_detected: false,
    environment_blocker_details: "",
    transcript_path: transcriptPath,
    report_path: reportPath,
    problems_path: problemsPath,
    validation_feedback_status: "not-run",
    problem_count: 0,
    unresolved_count: 0,
    repair_loop_required: false,
    notes: []
  };
}

/**
 * Create a structured debugging record from a failed runtime attempt.
 */
function buildFailureDebuggingRecord({
  stage,
  bucket,
  owner,
  check,
  fixPattern,
  handler = "",
  autoFixEligible = false,
  externalOwner = false
}) {
  return {
    stage,
    bucket,
    owner,
    check,
    fixPattern,
    handler,
    autoFixEligible,
    externalOwner
  };
}

function noteValidationReviewFailure(summary, { stage, attempt }) {
  const totalPasses = summary.debug_max_retry_count || DEBUG_MAX_RETRY_COUNT;
  summary.review_pass_count = Math.max(summary.review_pass_count || 0, attempt);
  if (stage === "live_validate") {
    summary.notes.push(
      `Validation review pass ${attempt}/${totalPasses} failed in the APEXlang source import lane. Debugging started before any import attempt.`
    );
    summary.notes.push("No blind second or third live validate run will happen unless a concrete repo-local fix is applied first.");
    return;
  }
  summary.notes.push(
    `Validation review pass ${attempt}/${totalPasses} failed before live SQLcl work. Debugging started immediately.`
  );
}

/**
 * Classify caught runtime failures into environment or app-content categories.
 */
function classifyCaughtFailure({ stage, output = "", summary }) {
  const normalizedOutput = String(output || "");

  if (stage === "local_validation") {
    if (/execution\.event must not be emitted/i.test(normalizedOutput)) {
      return buildFailureDebuggingRecord({
        stage,
        bucket: "APX syntax or file-shape failure",
        owner: "staged .apx artifact shape and local APEXlang validator",
        check: "Re-run local apexlang validation on the transient app path.",
        fixPattern: "Remove invalid execution.event properties from dynamic-action action execution blocks.",
        handler: "remove_dynamic_action_execution_event",
        autoFixEligible: true,
        externalOwner: false
      });
    }
    return buildFailureDebuggingRecord({
      stage,
      bucket: "APX syntax or file-shape failure",
      owner: "staged .apx artifact shape and local APEXlang validator",
      check: "Re-run local apexlang validation on the transient app path.",
      fixPattern: "Fix the emitted or edited .apx shape before any live SQLcl retry.",
      autoFixEligible: false,
      externalOwner: false
    });
  }

  if (stage === "workspace_resolution" || /workspace/i.test(summary.blocking_reason || "")) {
    return buildFailureDebuggingRecord({
      stage,
      bucket: /workspace/i.test(normalizedOutput) || /workspace/i.test(summary.blocking_reason || "")
        ? "runtime session/workspace routing issue"
        : "runtime session/wrapper artifact",
      owner: "skills/sqlcl/tools/runtime.mjs runtime execution path",
      check: "Reproduce the same app path and connection from the selected real SQLcl runtime path.",
      fixPattern: /workspace/i.test(normalizedOutput) || /workspace/i.test(summary.blocking_reason || "")
        ? "Keep the fix in the runtime contract or invocation path; resolve and apply a run-scoped workspace id before rerunning."
        : "Treat the real SQLcl session as the source of truth and correct the runtime wrapper or session handling.",
      autoFixEligible: false,
      externalOwner: false
    });
  }

  if (stage === "live_validate" || stage === "live_import") {
    if (/created for APEX|compiler version|runtime version/i.test(normalizedOutput)) {
      return buildFailureDebuggingRecord({
        stage,
        bucket: "import version-gate failure",
        owner: "APEX import/version validation owner outside this repo",
        check: "Reproduce the smallest direct validate/import path and confirm the version gate outcome.",
        fixPattern: "Patch the import/version owner, not the staged DSL artifact.",
        autoFixEligible: false,
        externalOwner: true
      });
    }
    if (/property_|property deprecated|metadata|display-group|child-component/i.test(normalizedOutput)) {
      return buildFailureDebuggingRecord({
        stage,
        bucket: "compiler metadata or property-model failure",
        owner: "active APEX compiler/property model owner",
        check: "Run the smallest confirming metadata or runtime check for the failing property surface.",
        fixPattern: "Keep dependency, requiredness, and metadata-rule changes aligned in the owning layer.",
        autoFixEligible: false,
        externalOwner: true
      });
    }
    return buildFailureDebuggingRecord({
      stage,
      bucket: "runtime session/wrapper artifact",
      owner: "skills/sqlcl/tools/runtime.mjs runtime execution path",
      check: "Reproduce the same app path and connection from a real SQLcl session before changing the DSL.",
      fixPattern: "Treat the real SQLcl session as the source of truth and correct wrapper/session handling first.",
      autoFixEligible: false,
      externalOwner: false
    });
  }

  if (stage === "runtime_verification") {
    const authBlocked = /login page|runtime_auth_required|sign in|username|password/i.test(normalizedOutput);
    return buildFailureDebuggingRecord({
      stage,
      bucket: "runtime UI/UX verification failure",
      owner: authBlocked
        ? "runtime page authentication or runtime URL selection"
        : "running application page composition, shared components, or runtime rendering",
      check: authBlocked
        ? "Open the same runtime page URL in the browser and confirm you reach the target page instead of the login page."
        : "Re-run the same runtime page with runtime verification and inspect the exact live page error, missing content, or failing request.",
      fixPattern: authBlocked
        ? "Make the runtime page URL reachable in an authenticated session before retrying validation and import."
        : "Use the runtime evidence to fix the owning page, shared component, or runtime behavior before re-running validation.",
      autoFixEligible: false,
      externalOwner: false
    });
  }

  return buildFailureDebuggingRecord({
    stage,
    bucket: "runtime session/wrapper artifact",
    owner: "skills/sqlcl/tools/runtime.mjs runtime execution path",
    check: "Reproduce the same app path and connection from the selected runtime path.",
    fixPattern: "Keep the fix in the runtime execution path that reported the failure.",
    autoFixEligible: false,
    externalOwner: false
  });
}

function applyFailureDebuggingRecord(summary, record) {
  summary.failure_stage = record.stage;
  summary.debugging_bucket = record.bucket;
  summary.owning_layer = record.owner;
  summary.confirming_check = record.check;
  summary.fix_pattern = record.fixPattern;
  summary.auto_fix_eligible = record.autoFixEligible;
  summary.auto_fix_handler = record.handler || "";
  summary.external_owner_handoff_required = record.externalOwner;
  summary.review_status = "debugging_routed";
  summary.notes.push(`Debugging bucket: ${record.bucket}.`);
  summary.notes.push(`Owning layer: ${record.owner}.`);
  summary.notes.push(`Smallest confirming check: ${record.check}`);
  summary.notes.push(`Fix pattern: ${record.fixPattern}`);
  if (record.externalOwner) {
    summary.notes.push("The owning layer is outside this repo; runtime will stop with a precise handoff instead of attempting an auto-fix.");
  }
}

function recordCaughtFailure(summary, { stage, output = "" }) {
  const record = classifyCaughtFailure({ stage, output, summary });
  if (!summary.failure_class) {
    summary.failure_class = record.bucket;
  }
  applyFailureDebuggingRecord(summary, record);
  return record;
}

function parseExecutionEventLintFindings(output = "") {
  const findings = [];
  const pattern = /^(?<file>.+?\.apx):(?<line>\d+): .*execution\.event must not be emitted/mg;
  for (const match of output.matchAll(pattern)) {
    findings.push({
      filePath: match.groups.file,
      lineNumber: Number.parseInt(match.groups.line, 10)
    });
  }
  return findings;
}

async function removeExecutionEventLinesFromFiles(output = "") {
  const findings = parseExecutionEventLintFindings(output);
  if (findings.length === 0) {
    return { applied: false, changedFiles: [] };
  }

  const grouped = new Map();
  for (const finding of findings) {
    const resolvedPath = path.resolve(finding.filePath);
    if (!grouped.has(resolvedPath)) {
      grouped.set(resolvedPath, new Set());
    }
    grouped.get(resolvedPath).add(finding.lineNumber);
  }

  const changedFiles = [];
  for (const [filePath, lineNumbers] of grouped.entries()) {
    const original = await fs.readFile(filePath, "utf8");
    const lines = original.split("\n");
    let changed = false;
    const sorted = [...lineNumbers].sort((left, right) => right - left);
    for (const lineNumber of sorted) {
      const index = lineNumber - 1;
      if (index < 0 || index >= lines.length) {
        continue;
      }
      if (!/^\s*event:\s*@/.test(lines[index])) {
        continue;
      }
      lines.splice(index, 1);
      changed = true;
    }
    if (changed) {
      await fs.writeFile(filePath, lines.join("\n"), "utf8");
      changedFiles.push(filePath);
    }
  }

  return { applied: changedFiles.length > 0, changedFiles };
}

/**
 * Apply local deterministic fixes for known validation failure classes.
 */
async function applyRepoLocalDebugFix({ summary, record, output = "" }) {
  if (!record.autoFixEligible || !record.handler || summary.debug_retry_count >= summary.debug_max_retry_count) {
    return { applied: false, changedFiles: [] };
  }

  let fixResult = { applied: false, changedFiles: [] };
  if (record.handler === "remove_dynamic_action_execution_event") {
    fixResult = await removeExecutionEventLinesFromFiles(output);
  }

  if (fixResult.applied) {
    summary.auto_fix_applied = true;
    summary.debug_retry_count += 1;
    summary.review_status = "debugging_fix_applied";
    summary.notes.push(`Applied repo-local fix using handler ${record.handler}.`);
    if (fixResult.changedFiles.length > 0) {
      summary.notes.push(`Updated staged files: ${fixResult.changedFiles.join(", ")}`);
    }
  }
  return fixResult;
}

function applyRuntimeAttemptFailure({ summary, runtimeResult, stage }) {
  summary.session_entrypoint_used = runtimeResult?.entrypoint || summary.session_entrypoint_used;
  summary.failed_temp_app_path = summary.temp_app_path;
  summary.import_lane_used = SOURCE_IMPORT_LANE;

  const environmentBlocker = classifyEnvironmentBlocker({
    localValidationStatus: summary.local_validation_status,
    executionModeUsed: summary.execution_mode_used,
    runtimeResult
  });
  if (environmentBlocker) {
    summary.validate_status = "blocked";
    summary.import_status = summary.import_intent_choice === "validate-and-import" ? "blocked" : "skipped";
    summary.runtime_gate_status = "blocked";
    summary.failure_class = environmentBlocker.failure_class;
    summary.blocking_reason = environmentBlocker.blocking_reason;
    summary.environment_blocker_detected = environmentBlocker.environment_blocker_detected;
    summary.environment_blocker_details = environmentBlocker.environment_blocker_details;
    summary.notes.push("Sandbox-only build-root filesystem/setup blocker detected before any real validate/import outcome.");
    summary.notes.push("Continue with the real live build-root roundtrip in an execution context that can write the required build-root work files.");
    return;
  }

  if (stage === "live_import") {
    summary.validate_status = "pass";
    summary.import_status = "fail";
  } else {
    summary.validate_status = "fail";
    summary.import_status = summary.import_intent_choice === "validate-and-import" ? "blocked" : "skipped";
  }
  summary.runtime_gate_status = "fail";
  summary.notes.push(stage === "live_import"
    ? "APEXlang source import failed after the same-session validate pass."
    : "APEXlang source validate failed in the selected runtime path.");
  if (stage === "live_validate") {
    noteValidationReviewFailure(summary, { stage, attempt: 1 });
  }
  recordCaughtFailure(summary, {
    stage,
    output: cleanOutput(runtimeResult?.result || runtimeResult)
  });
  summary.source_lane_last_failure_class = summary.failure_class;
  summary.source_lane_last_failure_stage = summary.failure_stage;
}

function syncCheckAliases(summary) {
  summary.local_check_status = summary.local_validation_status || summary.local_check_status || "not-run";
  summary.live_check_status = summary.validate_status || summary.live_check_status || "blocked";
  summary.final_check_status = summary.runtime_gate_status || summary.final_check_status || "blocked";
  summary.local_check_token =
    summary.local_check_status === "pass"
      ? LOCAL_CHECK_OK_TOKEN
      : summary.local_check_status === "fail"
        ? LOCAL_CHECK_FAILED_TOKEN
        : "";
  summary.live_check_token =
    summary.live_check_status === "pass"
      ? LIVE_CHECK_OK_TOKEN
      : summary.live_check_status === "fail"
        ? LIVE_CHECK_FAILED_TOKEN
        : "";
  return summary;
}

async function writeRoundtripArtifacts(summary, transcript) {
  syncCheckAliases(summary);
  const problemsPayload = buildRoundtripProblemsPayload(summary, transcript);
  applyRoundtripProblemSummary(summary, problemsPayload);
  await ensureDir(path.dirname(summary.transcript_path));
  await fs.writeFile(summary.transcript_path, `${transcript.trimEnd()}\n`, "utf8");
  await writeJson(summary.problems_path, problemsPayload);
  await writeJson(summary.report_path, summary);
}

function buildRoundtripResult(code, summary) {
  return { code, payload: syncCheckAliases(summary) };
}

function compilerTruthAuditToolPath() {
  return isPackagedSkillRuntime()
    ? apexlangToolPath("compiler-truth-audit.mjs")
    : path.resolve(apexlangToolPath("..", "..", "..", "ai-context", "apexlang", "compiler-prop-map", "compiler-truth-audit.mjs"));
}

function componentAttributesPath() {
  return isPackagedSkillRuntime()
    ? path.resolve(apexlangToolPath("..", "assets", "component-attributes.json"))
    : path.resolve(apexlangToolPath("..", "..", "..", "ai-context", "memory-bank", "component-attributes.json"));
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

function normalizeProblemSeverity(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["warning", "warn"].includes(normalized)) {
    return "warning";
  }
  if (["info", "information", "hint"].includes(normalized)) {
    return "info";
  }
  return "error";
}

function inferCompilerType(message = "") {
  const text = String(message || "");
  const match = text.match(/\b(ORA-\d+|SP2-\d+|PLS-\d+|DSL_[A-Z0-9_]+|APEXLANG_[A-Z0-9_]+|COMPILER_TRUTH_[A-Z0-9_]+|INVALID_[A-Z0-9_]+|MISSING_[A-Z0-9_]+)\b/i);
  return match ? match[1] : "";
}

function normalizeProblem(problem = {}, source = "unknown") {
  const message = String(problem.message ?? problem.text ?? problem.description ?? "").trim();
  return {
    source: String(problem.source || source),
    file: String(problem.file || problem.path || problem.uri || "").trim(),
    line: Number.isInteger(problem.line) ? problem.line : Number.parseInt(problem.line || "0", 10) || null,
    column: Number.isInteger(problem.column) ? problem.column : Number.parseInt(problem.column || "0", 10) || null,
    severity: normalizeProblemSeverity(problem.severity),
    compiler_type: String(problem.compiler_type || problem.compilerType || problem.code || problem.rule || inferCompilerType(message)).trim(),
    message
  };
}

function problemSortKey(problem) {
  return [
    problem.file || "",
    String(problem.line ?? 0).padStart(8, "0"),
    problem.severity === "error" ? "0" : problem.severity === "warning" ? "1" : "2",
    problem.compiler_type || "",
    problem.message || ""
  ].join("|");
}

function sortProblems(problems = []) {
  return [...problems].sort((left, right) => problemSortKey(left).localeCompare(problemSortKey(right)));
}

function parseLiveProblemLines(lines = []) {
  const problems = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (
      !line ||
      /\b(?:APEXLANG_DSL_LINT_OK|VALIDATION_LINT_OK|APEXLANG_LOCAL_CHECK_OK|APEXLANG_LIVE_CHECK_OK)\b/.test(line) ||
      /\b(?:APEXLANG_LOCAL_CHECK_FAILED|APEXCTL_APEXLANG_VALIDATE_FAILED)\b/.test(line)
    ) {
      continue;
    }
    const hasProblemSignal =
      /\b(ORA-\d+|SP2-\d+|PLS-\d+|APEXLANG_(?:COMPILE|IMPORT|LIVE)_[A-Z0-9_]+|DSL_[A-Z0-9_]+|INVALID_[A-Z0-9_]+|MISSING_[A-Z0-9_]+|Error!|\berror\b|\bwarning\b)\b/i.test(line);
    if (!hasProblemSignal) {
      continue;
    }
    const pathMatch = line.match(/([^:\s]+\.apx):(\d+)(?::(\d+))?:\s*(.*)$/i);
    problems.push(normalizeProblem({
      source: "apex_validate",
      file: pathMatch ? pathMatch[1] : "",
      line: pathMatch ? Number.parseInt(pathMatch[2], 10) : index + 1,
      column: pathMatch?.[3] ? Number.parseInt(pathMatch[3], 10) : null,
      severity: /\bwarning\b/i.test(line) ? "warning" : "error",
      message: pathMatch ? pathMatch[4] : line
    }, "apex_validate"));
  }
  return problems;
}

function parseLiveTranscriptProblems(transcript = "") {
  const sections = [];
  let current = { heading: "", lines: [] };
  for (const line of String(transcript || "").split(/\r?\n/)) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      if (current.heading || current.lines.length > 0) {
        sections.push(current);
      }
      current = { heading: headingMatch[1], lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  if (current.heading || current.lines.length > 0) {
    sections.push(current);
  }

  const liveSections = sections.filter((section) =>
    /(roundtrip|live_validate|live_import|direct_import|apex_validate|sql_(?:name_)?alias|sql_nolog)/i.test(section.heading)
  );
  return liveSections.flatMap((section) => parseLiveProblemLines(section.lines));
}

function buildProblemsPayload({ liveResult = {}, compilerTruth = {}, vscodeProblems = {}, report = {} } = {}) {
  const liveStatus = String(liveResult.status || liveResult.live_check_status || report.live_check_status || "blocked");
  const appPath = liveResult.appPath || report.app_path || "";
  const problems = liveStatus === "pass"
    ? []
    : sortProblems(parseLiveTranscriptProblems(liveResult.transcript || ""));
  const unresolvedProblems = problems.filter((problem) => ["error", "warning"].includes(problem.severity));
  return {
    generated_at: new Date().toISOString(),
    build: liveResult.build || compilerTruth.build || report.target_build || "unknown",
    app_path: appPath,
    live_check_status: liveResult.live_check_status || liveStatus,
    import_intent: liveResult.importIntent || report.import_intent || "",
    import_status: liveResult.importStatus || report.import_status || "",
    warnings_as_errors: true,
    repair_recipe_catalog: "assets/validator-fix-recipes.json",
    sort_order: ["file", "line", "severity", "compiler_type", "message"],
    problem_count: problems.length,
    unresolved_count: unresolvedProblems.length,
    diagnostic_sources: {
      compiler_truth: {
        status: compilerTruth.status || "not_run",
        problem_count: Array.isArray(compilerTruth.problems) ? compilerTruth.problems.length : 0
      },
      vscode_problems: {
        status: vscodeProblems.status || "not_provided",
        unresolved_count: vscodeProblems.unresolved_count ?? null
      }
    },
    problems
  };
}

function buildRoundtripProblemsPayload(summary, transcript = "") {
  return buildProblemsPayload({
    liveResult: {
      status: summary.live_check_status,
      live_check_status: summary.live_check_status,
      transcript,
      appPath: summary.final_app_path,
      build: summary.target_build || "unknown",
      importIntent: summary.import_intent_choice,
      importStatus: summary.import_status
    },
    report: {
      app_path: summary.final_app_path,
      live_check_status: summary.live_check_status,
      import_intent: summary.import_intent_choice,
      import_status: summary.import_status,
      target_build: summary.target_build || "unknown"
    }
  });
}

function applyRoundtripProblemSummary(summary, problemsPayload) {
  summary.problem_count = problemsPayload.problem_count;
  summary.unresolved_count = problemsPayload.unresolved_count;
  summary.repair_loop_required = problemsPayload.unresolved_count > 0;
  summary.validation_feedback_status = problemsPayload.unresolved_count > 0
    ? "repair-required"
    : "clean";
  if (summary.repair_loop_required && !summary.recommended_next_action) {
    summary.recommended_next_action = "Feed problems.json through assets/validator-fix-recipes.json, patch the reported warnings/errors, then rerun validation before import.";
  }
  if (summary.repair_loop_required) {
    summary.notes.push(`Validation feedback written to ${summary.problems_path}.`);
  }
}

function compilerTruthProblems(report = {}) {
  return (Array.isArray(report?.issues) ? report.issues : []).map((issue) => normalizeProblem({
    source: "compiler_truth",
    file: issue.file || issue.path || "",
    line: issue.line || null,
    column: issue.column || null,
    severity: issue.severity || "error",
    code: issue.code || issue.rule || issue.issue_code || "",
    message: issue.message || issue.detail || JSON.stringify(issue)
  }, "compiler_truth"));
}

async function loadVscodeProblemsEvidence({ vscodeProblemsPath = "", appPath = "" } = {}) {
  if (!vscodeProblemsPath) {
    return {
      status: "not_provided",
      source: "not_provided",
      checked_paths: [],
      unresolved_count: null,
      problems: [],
      blocking_reason: ""
    };
  }
  const payload = await readJson(vscodeProblemsPath);
  const rawProblems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.problems)
      ? payload.problems
      : Array.isArray(payload.diagnostics)
        ? payload.diagnostics
        : [];
  const appRoot = appPath ? path.resolve(appPath) : "";
  const problems = rawProblems
    .map((problem) => normalizeProblem(problem, "vscode_problems"))
    .filter((problem) => {
      if (!appRoot || !problem.file) {
        return true;
      }
      const resolved = path.isAbsolute(problem.file) ? problem.file : path.resolve(appRoot, problem.file);
      return resolved.startsWith(appRoot);
    });
  const unresolved = problems.filter((problem) => ["error", "warning"].includes(problem.severity));
  return {
    status: unresolved.length === 0 ? "pass" : "fail",
    source: "user_snapshot",
    checked_paths: [...new Set(problems.map((problem) => problem.file).filter(Boolean))].sort(),
    unresolved_count: unresolved.length,
    problems,
    blocking_reason: unresolved.length === 0 ? "" : "VS Code Problems snapshot contains unresolved generated-artifact issues."
  };
}

function buildComponentContracts(componentAttributes = {}, { build = "", compilerReport = {}, source = "component-attributes" } = {}) {
  const components = {};
  for (const [componentType, families] of Object.entries(componentAttributes.components || {})) {
    components[componentType] = {};
    for (const [familyName, contract] of Object.entries(families || {})) {
      components[componentType][familyName] = {
        allowedBlocks: contract.allowedBlocks || [],
        requiredBlocks: contract.requiredBlocks || [],
        propertyEnums: contract.propertyEnums || {},
        childComponents: {}
      };
      for (const [childName, childContract] of Object.entries(contract || {})) {
        if (!childContract || typeof childContract !== "object" || Array.isArray(childContract)) {
          continue;
        }
        if (!childContract.allowedProperties && !childContract.requiredProperties && !childContract.allowedBlocks) {
          continue;
        }
        components[componentType][familyName].childComponents[childName] = {
          allowedProperties: childContract.allowedProperties || [],
          requiredProperties: childContract.requiredProperties || [],
          allowedBlocks: childContract.allowedBlocks || [],
          requiredBlocks: childContract.requiredBlocks || [],
          propertyEnums: childContract.propertyEnums || {}
        };
      }
    }
  }
  return {
    generated_at: new Date().toISOString(),
    build: build || compilerReport?.compilerTruth?.buildID || componentAttributes?.compilerProvenance?.buildID || "unknown",
    source,
    warnings_as_errors: true,
    valid_component_types: Object.keys(components).sort(),
    deprecated_slots: componentAttributes?.deprecatedSlots || componentAttributes?.deprecated_slots || [],
    known_warning_as_error_cases: compilerReport?.warningAsErrorCases || componentAttributes?.knownWarningAsErrorCases || [],
    compiler_truth_status: compilerReport?.status || "unknown",
    compiler_provenance: componentAttributes?.compilerProvenance || null,
    components
  };
}

function validationArtifactPaths(options = {}) {
  const artifactDir = path.resolve(
    options.artifactDir ||
      (options.reportPath ? path.dirname(path.resolve(options.reportPath)) : DEFAULT_VALIDATION_ARTIFACT_DIR)
  );
  const reportPath = path.resolve(options.reportPath || path.join(artifactDir, path.basename(DEFAULT_VALIDATION_REPORT)));
  return {
    artifactDir,
    reportPath,
    transcriptPath: path.resolve(options.transcriptPath || path.join(artifactDir, path.basename(DEFAULT_VALIDATION_TRANSCRIPT))),
    problemsPath: path.resolve(options.problemsPath || path.join(artifactDir, path.basename(DEFAULT_VALIDATION_PROBLEMS))),
    roundtripReportPath: path.resolve(options.roundtripReportPath || path.join(artifactDir, path.basename(DEFAULT_VALIDATION_ROUNDTRIP_REPORT))),
    compilerTruthReportPath: path.resolve(options.compilerTruthReportPath || path.join(artifactDir, path.basename(DEFAULT_VALIDATION_COMPILER_TRUTH_REPORT))),
    componentContractsDir: path.resolve(options.componentContractsDir || path.join(artifactDir, path.basename(DEFAULT_VALIDATION_CONTRACT_DIR)))
  };
}

async function writeValidationArtifacts({ report, problemsPayload, componentContract, paths }) {
  const contractBuild = sanitizeSegment(componentContract.build || "unknown") || "unknown";
  const componentContractPath = path.join(paths.componentContractsDir, `${contractBuild}.json`);
  report.artifacts.component_contract_path = componentContractPath;
  try {
    await fs.access(paths.transcriptPath);
  } catch {
    await ensureDir(path.dirname(paths.transcriptPath));
    await fs.writeFile(paths.transcriptPath, "No live validation transcript was produced before validation blocked.\n", "utf8");
  }
  await writeJson(paths.problemsPath, problemsPayload);
  await writeJson(componentContractPath, componentContract);
  await writeJson(paths.reportPath, report);
}

export async function runRuntimeValidate(options = {}) {
  const deps = {
    runRuntimeRoundtrip,
    runCommand,
    loadVscodeProblemsEvidence,
    readJsonIfExists,
    writeValidationArtifacts,
    ...options._deps
  };
  const paths = validationArtifactPaths(options);
  const appPath = options.appPath ? path.resolve(options.appPath) : "";
  const report = {
    timestamp: new Date().toISOString(),
    validation_flow: "deterministic_live_validator_first",
    rule_id: LIVE_RUNTIME_VALIDATION_RULE_ID,
    app_path: appPath,
    db_connection_name: options.dbConnectionName || "",
    apex_root: options.apexRoot || "",
    compiler_oracle_home: options.compilerOracleHome || "",
    live_check_status: "blocked",
    validation_status: "blocked",
    warnings_as_errors: true,
    local_validation_policy: "syntax_hygiene_only",
    artifacts: {
      validation_report_path: paths.reportPath,
      validation_transcript_path: paths.transcriptPath,
      problems_path: paths.problemsPath,
      roundtrip_report_path: paths.roundtripReportPath,
      compiler_truth_report_path: paths.compilerTruthReportPath,
      component_contract_path: ""
    },
    validation_sources: {
      live_validator: { status: "blocked", source: "runtime validate-only roundtrip" },
      compiler_truth: { status: "not_run", report_path: paths.compilerTruthReportPath },
      vscode_problems: { status: "not_provided", source: "not_provided", unresolved_count: null }
    },
    diagnostic_sources: {
      local_lint: { status: "not_run", source: "runtime validate-only roundtrip" },
      compiler_truth: { status: "not_run", report_path: paths.compilerTruthReportPath },
      vscode_problems: { status: "not_provided", source: "not_provided", unresolved_count: null }
    },
    problem_count: 0,
    unresolved_count: 0,
    blocking_reasons: [],
    notes: [
      "Live APEX validate output is authoritative over broad local policy or template prose.",
      "Local checks are treated as syntax hygiene unless they are generated from the selected target build metadata."
    ]
  };

  if (!appPath) {
    report.blocking_reasons.push("Missing required --app-path");
  }
  if (!options.dbConnectionName) {
    report.blocking_reasons.push("Missing required --db-connection-name");
  }

  let roundtripResult = null;
  if (report.blocking_reasons.length === 0) {
    roundtripResult = await deps.runRuntimeRoundtrip({
      appPath,
      dbConnectionName: options.dbConnectionName,
      executionMode: options.executionMode || "auto",
      importIntentChoice: "validate-only",
      importIntentSource: "runtime_validate",
      targetResolutionMode: options.targetResolutionMode || "update-existing",
      workspaceId: options.workspaceId || "",
      supportingObjects: Boolean(options.supportingObjects),
      preflightOnly: Boolean(options.preflightOnly),
      apexRoot: options.apexRoot || "",
      reportPath: paths.roundtripReportPath,
      transcriptPath: paths.transcriptPath,
      localValidationPolicy: options.localValidationPolicy || "skip"
    });
    report.live_check_status = roundtripResult.payload.live_check_status || roundtripResult.payload.validate_status || "fail";
    report.validation_sources.live_validator = {
      status: roundtripResult.code === 0 && report.live_check_status === "pass" ? "pass" : "fail",
      source: "runtime validate-only roundtrip",
      report_path: paths.roundtripReportPath,
      transcript_path: paths.transcriptPath
    };
    report.diagnostic_sources.local_lint = {
      status: roundtripResult.payload.local_validation_status || roundtripResult.payload.local_check_status || "not_run",
      execution_status: roundtripResult.payload.local_validation_execution_status || "",
      entrypoint: roundtripResult.payload.local_validation_entrypoint_used || "",
      policy: "advisory"
    };
    report.target_build = roundtripResult.payload.target_build || "";
    report.resolved_apex_build_root = roundtripResult.payload.resolved_apex_build_root || "";
    report.execution_mode_used = roundtripResult.payload.execution_mode_used || "";
    if (report.validation_sources.live_validator.status !== "pass") {
      report.blocking_reasons.push("Live APEX validation did not pass or did not produce pass evidence.");
    }
  }

  const compilerArgs = [
    compilerTruthAuditToolPath(),
    "--app-path",
    appPath || ".",
    "--verify-component-attributes",
    "--report-path",
    paths.compilerTruthReportPath
  ];
  if (options.compilerOracleHome) {
    compilerArgs.push("--compiler-oracle-home", options.compilerOracleHome);
  }
  const compilerResult = appPath
    ? await deps.runCommand("node", compilerArgs, { allowFailure: true, passthrough: false })
    : { code: 1, stdout: "", stderr: "Missing --app-path" };
  const compilerReport = (await deps.readJsonIfExists(paths.compilerTruthReportPath)) || {};
  report.validation_sources.compiler_truth = {
    status: compilerResult.code === 0 && compilerReport.status !== "fail" ? "pass" : "fail",
    report_path: paths.compilerTruthReportPath,
    output: cleanOutput(compilerResult).slice(0, 4000)
  };
  report.diagnostic_sources.compiler_truth = {
    ...report.validation_sources.compiler_truth,
    policy: "advisory_when_live_validation_passes"
  };

  const componentAttributes = (await deps.readJsonIfExists(componentAttributesPath())) || {};
  const componentContract = buildComponentContracts(componentAttributes, {
    build: report.target_build || compilerReport?.compilerTruth?.buildID || "",
    compilerReport,
    source: report.target_build ? "target-build-component-contract" : "component-attributes-fallback"
  });

  const vscodeEvidence = await deps.loadVscodeProblemsEvidence({
    vscodeProblemsPath: options.vscodeProblemsPath || "",
    appPath
  });
  report.validation_sources.vscode_problems = {
    status: vscodeEvidence.status,
    source: vscodeEvidence.source,
    checked_paths: vscodeEvidence.checked_paths,
    unresolved_count: vscodeEvidence.unresolved_count,
    blocking_reason: vscodeEvidence.blocking_reason || ""
  };
  report.diagnostic_sources.vscode_problems = {
    ...report.validation_sources.vscode_problems,
    policy: "advisory_when_live_validation_passes"
  };

  const transcript = await fs.readFile(paths.transcriptPath, "utf8").catch(() => "");
  const compilerProblems = compilerTruthProblems(compilerReport);
  const problemsPayload = buildProblemsPayload({
    liveResult: {
      status: report.validation_sources.live_validator.status,
      live_check_status: report.live_check_status,
      transcript,
      appPath,
      build: componentContract.build,
      importStatus: "skipped"
    },
    compilerTruth: {
      status: report.validation_sources.compiler_truth.status,
      build: componentContract.build,
      problems: compilerProblems
    },
    vscodeProblems: vscodeEvidence,
    report
  });
  report.problem_count = problemsPayload.problem_count;
  report.unresolved_count = problemsPayload.unresolved_count;
  if (problemsPayload.unresolved_count > 0) {
    report.blocking_reasons.push("problems.json contains unresolved validation problems.");
  }

  report.validation_status =
    report.validation_sources.live_validator.status === "pass" &&
    problemsPayload.unresolved_count === 0 &&
    !report.blocking_reasons.some((reason) => /^Missing required /.test(reason))
      ? "pass"
      : "fail";
  report.import_eligibility = report.validation_status === "pass" ? "validate-only-passed" : "blocked";

  await deps.writeValidationArtifacts({
    report,
    problemsPayload,
    componentContract,
    paths
  });
  return { code: report.validation_status === "pass" ? 0 : 1, payload: report };
}

async function resolveCanonicalApplicationIdentityForRuntime(options = {}) {
  const sourceIdentity = await loadAppIdentity(options.appPath);
  const candidates = buildCanonicalAppIdentityCandidates({
    sourceIdentity,
    preservedCanonicalId: options.preservedCanonicalAuthority?.applicationId ?? null
  });

  if (candidates.length === 0) {
    return {
      success: false,
      sourceIdentity,
      blockingReason: "canonical_application_identity_missing",
      message: "Unable to resolve canonical application identity because the source app has neither a numeric deployment id nor an alias.",
      transcript: "## canonical_application_identity\nUnable to resolve canonical application identity because the source app has neither a numeric deployment id nor an alias.\n"
    };
  }

  const transcriptParts = ["## canonical_application_identity_status\nResolving canonical live application identity for import-authorized run.\n"];
  let lastFailure = {
    blockingReason: "canonical_application_lookup_failed",
    message: "Canonical application lookup did not return a single matching live application."
  };

  for (const candidate of candidates) {
    const script = buildAppIdentityLookupScript(candidate.query);
    const sessionResult = options.executionModeUsed === "build-root"
      ? await runBuildRootSession({
          buildRoot: options.buildRoot,
          input: script,
          label: `canonical_application_identity_${candidate.source}`
        })
      : runPathSession({
          dbConnectionName: options.dbConnectionName,
          input: script,
          labelPrefix: `canonical_application_identity_${candidate.source}`
        });

    transcriptParts.push(sessionResult.transcript);
    if (!sessionResult.success) {
      lastFailure = {
        blockingReason: "canonical_application_lookup_session_failed",
        message: `Canonical application lookup failed while checking ${candidate.source}.`
      };
      continue;
    }

    const rows = extractAppIdentityRows(cleanOutput(sessionResult.result));
    if (rows.length === 1) {
      transcriptParts.push(`Resolved canonical application id ${rows[0].applicationId} using ${candidate.source}.\n`);
      return {
        success: true,
        sourceIdentity,
        canonicalIdentity: rows[0],
        resolutionSource: candidate.source,
        transcript: transcriptParts.join("\n")
      };
    }

    lastFailure = rows.length > 1
      ? {
          blockingReason: "canonical_application_lookup_ambiguous",
          message: `Canonical application lookup returned multiple live applications while checking ${candidate.source}.`
        }
      : {
          blockingReason: "canonical_application_not_found",
          message: `Canonical application lookup returned no live application while checking ${candidate.source}.`
        };
  }

  transcriptParts.push(`${lastFailure.message}\n`);
  return {
    success: false,
    sourceIdentity,
    blockingReason: lastFailure.blockingReason,
    message: lastFailure.message,
    transcript: transcriptParts.join("\n")
  };
}

export function buildPathSessionAttempts({ dbConnectionName, input, labelPrefix = "sql" }) {
  return [
    {
      label: `${labelPrefix}_sql_name_alias`,
      command: "sql",
      args: ["-name", dbConnectionName],
      input
    },
    {
      label: `${labelPrefix}_sql_alias`,
      command: "sql",
      args: [dbConnectionName],
      input
    },
    {
      label: `${labelPrefix}_sql_nolog_connect`,
      command: "sql",
      args: ["/nolog"],
      input: `connect ${dbConnectionName}\n${input}`
    }
  ];
}

function runPathSession({ dbConnectionName, input, labelPrefix = "sql" }) {
  const attempts = buildPathSessionAttempts({ dbConnectionName, input, labelPrefix });
  const transcript = [];
  let lastResult = null;
  for (const attempt of attempts) {
    const result = runInteractiveCommand(attempt.command, attempt.args, { input: attempt.input });
    lastResult = result;
    transcript.push(`## ${attempt.label}\n${cleanOutput(result)}\n`);
    if (hasWorkspaceAmbiguity(result)) {
      return {
        success: false,
        workspaceAmbiguity: true,
        entrypoint: attempt.label,
        result,
        transcript: transcript.join("\n")
      };
    }
    if (!hasRuntimeFailure(result)) {
      return {
        success: true,
        entrypoint: attempt.label,
        result,
        transcript: transcript.join("\n")
      };
    }
  }
  return {
    success: false,
    entrypoint: attempts.at(-1).label,
    result: lastResult,
    transcript: transcript.join("\n")
  };
}

async function runBuildRootSession({ buildRoot, input, label = "apex_sql_build_root" }) {
  const tempScriptPath = path.join(os.tmpdir(), `apexctl-roundtrip-${Date.now()}.sql`);
  await fs.writeFile(tempScriptPath, `${input}\n`, "utf8");
  const result = runInteractiveCommand("apex", ["sql", "-s", tempScriptPath], { cwd: buildRoot });
  await fs.rm(tempScriptPath, { force: true });
  return {
    success: !hasWorkspaceAmbiguity(result) && !hasRuntimeFailure(result),
    workspaceAmbiguity: hasWorkspaceAmbiguity(result),
    entrypoint: label,
    result,
    transcript: `## ${label}\n${cleanOutput(result)}\n`
  };
}

function runPathRoundtrip({ appPath, dbConnectionName, workspaceId, includeImport = true }) {
  const script = buildSqlclSessionScript(appPath, { workspaceId, includeImport });
  return runPathSession({ dbConnectionName, input: script, labelPrefix: "roundtrip" });
}

async function runBuildRootRoundtrip({ appPath, buildRoot, workspaceId, includeImport = true }) {
  const input = buildSqlclSessionScript(appPath, { workspaceId, includeImport });
  return runBuildRootSession({ buildRoot, input, label: "apex_sql_build_root" });
}

/**
 * Run validate/import through the selected runtime candidate.
 */
async function executeSelectedRoundtrip({
  appPath,
  dbConnectionName,
  executionModeUsed,
  buildRoot,
  workspaceId,
  includeImport = true
}) {
  if (executionModeUsed === "build-root") {
    return runBuildRootRoundtrip({
      appPath,
      buildRoot,
      workspaceId,
      includeImport
    });
  }
  return runPathRoundtrip({
    appPath,
    dbConnectionName,
    workspaceId,
    includeImport
  });
}

/**
 * Resolve an APEX workspace ID for the current runtime connection and target app.
 */
export async function resolveWorkspaceIdForRuntime(options = {}) {
  const candidates = await buildWorkspaceLookupCandidates(options.appPath);
  if (candidates.length === 0) {
    return {
      success: false,
      blocking_reason: "workspace_resolution_missing_app_identity",
      message: "Unable to resolve workspace id because application identity could not be derived from the app path.",
      transcript: "## workspace_resolution\nUnable to resolve workspace id because application identity could not be derived from the app path.\n"
    };
  }

  const transcriptParts = [`## workspace_resolution_status\n${WORKSPACE_RESOLUTION_STATUS}\n`];
  let lastFailure = {
    blocking_reason: "workspace_resolution_failed",
    message: "Workspace id resolution did not return a single candidate."
  };

  for (const candidate of candidates) {
    const script = buildWorkspaceLookupScript(candidate.query);
    const sessionResult = options.executionModeUsed === "build-root"
      ? await runBuildRootSession({
          buildRoot: options.buildRoot,
          input: script,
          label: `workspace_resolution_${candidate.source}`
        })
      : runPathSession({
          dbConnectionName: options.dbConnectionName,
          input: script,
          labelPrefix: `workspace_resolution_${candidate.source}`
        });

    transcriptParts.push(sessionResult.transcript);

    if (sessionResult.workspaceAmbiguity) {
      lastFailure = {
        blocking_reason: "workspace_resolution_session_ambiguous",
        message: "Workspace id resolution query was blocked by workspace ambiguity in the selected runtime path."
      };
      continue;
    }

    if (!sessionResult.success) {
      lastFailure = {
        blocking_reason: "workspace_resolution_session_failed",
        message: "Workspace id resolution query failed in the selected runtime path."
      };
      continue;
    }

    const workspaceIds = extractWorkspaceIds(cleanOutput(sessionResult.result));
    if (workspaceIds.length === 1) {
      transcriptParts.push(`Resolved workspace id ${workspaceIds[0]} using ${candidate.source}.\n`);
      return {
        success: true,
        workspaceId: workspaceIds[0],
        resolutionSource: candidate.source,
        transcript: transcriptParts.join("\n")
      };
    }

    lastFailure = workspaceIds.length > 1
      ? {
          blocking_reason: "workspace_resolution_ambiguous",
          message: `Workspace id resolution returned multiple candidates (${workspaceIds.join(", ")}) using ${candidate.source}.`
        }
      : {
          blocking_reason: "workspace_resolution_not_found",
          message: `Workspace id resolution returned no candidates using ${candidate.source}.`
        };
  }

  transcriptParts.push(`${lastFailure.message}\n`);
  return {
    success: false,
    blocking_reason: lastFailure.blocking_reason,
    message: lastFailure.message,
    transcript: transcriptParts.join("\n")
  };
}

async function runRoundtripWithWorkspaceResolution({
  appPath,
  dbConnectionName,
  executionModeUsed,
  buildRoot,
  workspaceId,
  includeImport,
  summary,
  transcriptParts,
  deps
}) {
  let runtimeResult = await deps.executeSelectedRoundtrip({
    appPath,
    dbConnectionName,
    executionModeUsed,
    buildRoot,
    workspaceId,
    includeImport
  });
  transcriptParts.push(runtimeResult.transcript);

  if (runtimeResult.workspaceAmbiguity && !workspaceId) {
    summary.notes.push("Workspace ambiguity detected in real SQLcl session.");
    summary.notes.push(WORKSPACE_RESOLUTION_STATUS);

    const resolution = await deps.resolveWorkspaceIdForRuntime({
      appPath,
      dbConnectionName,
      executionModeUsed,
      buildRoot
    });
    transcriptParts.push(resolution.transcript);

    if (!resolution.success) {
      summary.validate_status = "blocked";
      summary.import_status = includeImport ? "blocked" : "skipped";
      summary.runtime_gate_status = "fail";
      summary.failure_class = "runtime_session_workspace_routing_issue";
      summary.blocking_reason = resolution.blocking_reason;
      summary.failed_temp_app_path = summary.temp_app_path;
      summary.notes.push(resolution.message);
      recordCaughtFailure(summary, {
        stage: "workspace_resolution",
        output: `${resolution.message}\n${resolution.transcript || ""}`
      });
      return { success: false, runtimeResult: null };
    }

    summary.workspaceid = resolution.workspaceId;
    summary.notes.push(`Resolved workspace id ${resolution.workspaceId} using ${resolution.resolutionSource}.`);

    runtimeResult = await deps.executeSelectedRoundtrip({
      appPath,
      dbConnectionName,
      executionModeUsed,
      buildRoot,
      workspaceId: resolution.workspaceId,
      includeImport
    });
    transcriptParts.push(runtimeResult.transcript);
  }

  if (runtimeResult.workspaceAmbiguity) {
    summary.validate_status = "blocked";
    summary.import_status = includeImport ? "blocked" : "skipped";
    summary.runtime_gate_status = "fail";
    summary.failure_class = "runtime_session_workspace_routing_issue";
    summary.blocking_reason = summary.workspaceid
      ? "workspace_resolution_rerun_still_ambiguous"
      : "workspace_resolution_not_attempted";
    summary.notes.push("Workspace ambiguity persisted after runtime execution.");
    summary.failed_temp_app_path = summary.temp_app_path;
    recordCaughtFailure(summary, {
      stage: "workspace_resolution",
      output: cleanOutput(runtimeResult.result || runtimeResult)
    });
    return { success: false, runtimeResult };
  }

  return { success: true, runtimeResult };
}

function applyRuntimeVerificationSummary(summary, verificationPayload = {}) {
  summary.runtime_verification_status = verificationPayload.runtime_verification_status || "not-run";
  summary.runtime_verification_provider_requested =
    verificationPayload.runtime_verification_provider_requested || summary.runtime_verification_provider_requested;
  summary.runtime_verification_provider_used =
    verificationPayload.runtime_verification_provider_used || summary.runtime_verification_provider_used;
  summary.runtime_verification_scope =
    verificationPayload.runtime_verification_scope || summary.runtime_verification_scope;
  summary.runtime_verification_targets = verificationPayload.runtime_verification_targets || [];
  summary.runtime_verification_findings = verificationPayload.runtime_verification_findings || [];
  summary.runtime_verification_artifacts = verificationPayload.runtime_verification_artifacts || [];
  summary.runtime_verification_blocking_reason = verificationPayload.runtime_verification_blocking_reason || "";
  summary.runtime_verification_retry_required = Boolean(verificationPayload.runtime_verification_retry_required);
  if (verificationPayload.runtime_verification_notes?.length) {
    summary.notes.push(...verificationPayload.runtime_verification_notes);
  }
}

/**
 * Validate and optionally import an app through the selected SQLcl runtime path.
 */
export async function runRuntimeRoundtrip(options = {}) {
  const deps = {
    runCommand,
    getSqlclPreflight,
    runLiveMetadataProbe,
    resolveRuntimeTargetApplication,
    executeSelectedRoundtrip,
    resolveWorkspaceIdForRuntime,
    verifyRuntimeUi,
    writeRoundtripArtifacts,
    ...options._deps
  };
  const summary = buildRoundtripSummary({
    appPath: options.appPath,
    dbConnectionName: options.dbConnectionName,
    executionMode: options.executionMode,
    targetResolutionMode: options.targetResolutionMode || "update-existing",
    createNewConfirmed: options.createNewConfirmed,
    workspaceId: options.workspaceId,
    runtimeProvider: options.runtimeProvider,
    requireRuntimeVerification: options.requireRuntimeVerification,
    preflightOnly: options.preflightOnly,
    doctorMode: options.doctorMode,
    supportingObjects: options.supportingObjects,
    importMode: options.importMode,
    transcriptPath: options.transcriptPath,
    reportPath: options.reportPath
  });
  summary.import_lane_used = SOURCE_IMPORT_LANE;
  summary.lane_decision_basis = "canonical_runtime_roundtrip_source_lane";

  if (!options.appPath) {
    summary.notes.push("Missing required --app-path");
    await deps.writeRoundtripArtifacts(summary, "ROUNDTRIP_BLOCKED missing --app-path");
    return buildRoundtripResult(1, summary);
  }
  if (!options.dbConnectionName) {
    summary.notes.push("Missing required --db-connection-name");
    await deps.writeRoundtripArtifacts(summary, "ROUNDTRIP_BLOCKED missing --db-connection-name");
    return buildRoundtripResult(1, summary);
  }

  const importIntent = resolveImportIntent({
    importIntentChoice: options.importIntentChoice || "validate-only",
    importIntentSource: options.importIntentSource || (options.importIntentChoice ? "cli" : "default")
  });
  summary.import_intent_prompted = importIntent.import_intent_prompted;
  summary.import_intent_choice = importIntent.import_intent_choice;
  summary.import_intent_source = importIntent.import_intent_source;
  summary.runtime_action_resolved = importIntent.import_intent_choice === "unresolved" ? "" : importIntent.import_intent_choice;
  summary.runtime_action_source = importIntent.import_intent_source;
  summary.import_status = summary.import_intent_choice === "validate-only" ? "skipped" : "blocked";
  summary.publish_status = "not-required";
  summary.cleanup_status = "not-required";
  summary.temp_app_path = path.resolve(options.appPath);

  const transcriptParts = [];
  let preflightPayload = null;
  let currentSourceIdentity = null;
  let liveMetadata = null;

  const preflightStage = await runTimedStage(
    summary,
    "preflight",
    {
      app_path: options.appPath,
      db_connection_name: options.dbConnectionName,
      execution_mode: options.executionMode,
      supporting_objects: summary.supporting_objects_enabled
    },
    async () => {
      const preflight = await deps.getSqlclPreflight({
        dbConnectionName: options.dbConnectionName,
        executionMode: options.executionMode,
        apexRoot: options.apexRoot
      });
      preflightPayload = preflight.payload;
      summary.capability_state = preflight.payload.capability_state;
      summary.connection_signature = preflight.payload.connection_signature ?? null;
      summary.target_build = summary.connection_signature?.signature || "";
      summary.execution_mode_used = preflight.payload.execution_mode_used || "";
      summary.reason = preflight.payload.reason || "";
      summary.runtime_selection_note = preflight.payload.runtime_selection_note || "";
      summary.runtime_entrypoint = preflight.payload.runtime_entrypoint || "";
      summary.resolved_apex_build_root = preflight.payload.build_root_runtime?.resolved_apex_build_root || "";
      summary.recommended_cwd = preflight.payload.build_root_runtime?.recommended_cwd || "";
      const runtimeReady = summary.import_intent_choice === "validate-only"
        ? Boolean(preflight.payload.runtime_validate_enabled)
        : Boolean(preflight.payload.required_runtime_commands_available);
      if (!runtimeReady || !summary.execution_mode_used) {
        const error = new Error("Runtime preflight did not produce an executable runtime path.");
        error.stageFailureClass = "preflight_runtime_unavailable";
        error.nextSafeAction = "Resolve the runtime preflight failure before validation or import.";
        throw error;
      }
      currentSourceIdentity = await loadAppIdentity(options.appPath);
      summary.source_application_id = currentSourceIdentity.applicationId;
      summary.source_application_alias = currentSourceIdentity.applicationAlias;
      summary.source_apexlang_version = await readAppApexlangVersion(options.appPath);
      assertRuntimeApexlangCompatibility({
        appApexlangVersion: summary.source_apexlang_version,
        connectionSignature: preflightPayload.connection_signature
      });
      const frozenFacts = buildFrozenPreflightFacts({
        appPath: options.appPath,
        dbConnectionName: options.dbConnectionName,
        executionMode: options.executionMode,
        preflightPayload,
        supportingObjects: summary.supporting_objects_enabled
      });
      frozenFacts.source_apexlang_version = summary.source_apexlang_version;
      frozenFacts.requested_application_id = currentSourceIdentity.applicationId;
      frozenFacts.requested_application_alias = currentSourceIdentity.applicationAlias;
      liveMetadata = await deps.runLiveMetadataProbe({
        dbConnectionName: options.dbConnectionName,
        executionModeUsed: summary.execution_mode_used,
        buildRoot: summary.recommended_cwd
      });
      frozenFacts.schema_scope.current_schema = liveMetadata.currentSchema;
      frozenFacts.schema_scope.current_user = liveMetadata.currentUser;
      summary.frozen_preflight_facts = frozenFacts;
      summary.notes.push("Runtime preflight resolved a single execution path and froze the handoff facts.");
      summary.notes.push(`Supporting objects are ${summary.supporting_objects_enabled ? "enabled" : "disabled"} for this run.`);
      if (liveMetadata.conflicts.length > 0) {
        summary.notes.push("Live DB metadata conflicts with bundled metadata. Live DB metadata will be treated as the source of truth.");
      }
      if (liveMetadata.missingObjects.length > 0 || liveMetadata.missingColumns.length > 0) {
        summary.notes.push(
          "Live metadata probing found missing referenced objects or columns, but the roundtrip continued so live validate/import can act as the real gate."
        );
      }
      summary.metadata_probe = {
        references: liveMetadata.references,
        conflicts: liveMetadata.conflicts,
        missing_objects: liveMetadata.missingObjects,
        missing_columns: liveMetadata.missingColumns,
        current_schema: liveMetadata.currentSchema,
        current_user: liveMetadata.currentUser
      };
      transcriptParts.push(`${preflight.stdout}${preflight.stderr}`.trim());
      return { preflightPayload, frozenFacts, liveMetadata };
    },
    {
      allowBudgetOverrun: (result) =>
        Boolean(
          result?.preflightPayload?.execution_mode_used &&
          result?.liveMetadata &&
          Array.isArray(result.liveMetadata.missingObjects) &&
          Array.isArray(result.liveMetadata.missingColumns) &&
          result.liveMetadata.missingObjects.length === 0 &&
          result.liveMetadata.missingColumns.length === 0
        )
    }
  );
  if (!preflightStage.ok) {
    summary.runtime_gate_status = "fail";
    summary.failure_class = preflightStage.stage.failure_class;
    summary.blocking_reason = preflightStage.stage.failure_class;
    await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
    return buildRoundtripResult(1, summary);
  }
  if (preflightStage.stage.budget_exceeded) {
    summary.notes.push("Preflight exceeded its stage budget but runtime capability and live metadata probing already succeeded, so the roundtrip continued.");
  }

  if (options.preflightOnly || options.doctorMode) {
    summary.validate_status = "skipped";
    summary.import_status = "skipped";
    summary.runtime_gate_status = "pass";
    summary.recommended_next_action = "Run runtime roundtrip without --preflight-only when ready.";
    await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
    return buildRoundtripResult(0, summary);
  }

  const localValidationStage = await runTimedStage(
    summary,
    "local_validate",
    { app_path: options.appPath },
    async () => runCanonicalLocalValidation({
      appPath: options.appPath,
      deps
      ,
      preferFallback: options.localValidationPolicy === "skip" ? "skip_by_roundtrip_policy" : ""
    })
  );
  if (!localValidationStage.ok) {
    summary.runtime_gate_status = "fail";
    summary.failure_class = localValidationStage.stage.failure_class;
    summary.blocking_reason = localValidationStage.stage.failure_class;
    await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
    return buildRoundtripResult(1, summary);
  }
  const localValidation = localValidationStage.result;
  for (const entry of localValidation.transcriptEntries) {
    if (entry.output) {
      transcriptParts.push(`## local_validate_${entry.heading}\n${entry.output}\n`);
    }
  }
  summary.local_validation_entrypoint_requested = localValidation.requestedEntrypoint;
  summary.local_validation_entrypoint_used = localValidation.entrypointUsed;
  summary.local_validation_fallback_used = false;
  summary.local_validation_fallback_reason = localValidation.fallbackReason || "";
  summary.local_validation_primary_status = localValidation.primaryStatus;
  summary.local_validation_fallback_status = "not-run";
  summary.local_validation_execution_status =
    localValidation.primaryStatus === "skipped_by_roundtrip_policy" ? "skipped_by_roundtrip_policy" : "executed";
  if (localValidation.primaryStatus === "skipped_by_roundtrip_policy") {
    summary.local_validation_status = "skipped";
    summary.notes.push("Skipped the local first-pass check because the active roundtrip policy marked it as optional helper work.");
  } else {
    summary.local_validation_status = localValidation.finalResult.code === 0 ? "pass" : "fail";
    if (localValidation.finalResult.code !== 0) {
      summary.notes.push("The local first-pass check reported findings, but the live roundtrip lane continued because the local check is advisory for this workflow.");
    }
  }

  const targetResolveStage = await runTimedStage(
    summary,
    "target_resolve",
    {
      import_intent: summary.import_intent_choice,
      target_resolution_mode: summary.target_resolution_mode
    },
    async () => {
      if (summary.import_intent_choice !== "validate-and-import") {
        return {
          skipped: true,
          targetResolutionStatus: "not-required"
        };
      }
      const targetResolution = await deps.resolveRuntimeTargetApplication({
        appPath: options.appPath,
        dbConnectionName: options.dbConnectionName,
        executionModeUsed: summary.execution_mode_used,
        buildRoot: summary.recommended_cwd,
        workspaceId: options.workspaceId,
        targetResolutionMode: summary.target_resolution_mode
      });
      transcriptParts.push(targetResolution.transcript || "");
      summary.target_resolution_status = targetResolution.targetResolutionStatus;
      summary.lookup_scope_workspaceid = targetResolution.lookupScopeWorkspaceId || "";
      summary.lookup_scope_workspace_name = targetResolution.lookupScopeWorkspaceName || "";
      summary.candidate_count = targetResolution.candidateCount ?? 0;
      summary.candidate_ids = targetResolution.candidateIds ?? [];
      summary.candidate_evidence_level = targetResolution.candidateEvidenceLevel || "";
      summary.workspaceid = targetResolution.lookupScopeWorkspaceId || summary.workspaceid;
      if (!summary.frozen_preflight_facts.workspace_scope.workspace_id) {
        summary.frozen_preflight_facts.workspace_scope.workspace_id = summary.lookup_scope_workspaceid;
        summary.frozen_preflight_facts.workspace_scope.workspace_name = summary.lookup_scope_workspace_name;
      }
      if (!targetResolution.success) {
        const error = new Error(targetResolution.message || "Target resolution failed.");
        error.stageFailureClass = targetResolution.blockingReason || "target_resolution_failed";
        error.nextSafeAction = targetResolutionBypassBlockedAction();
        throw error;
      }
      if (summary.target_resolution_mode === "update-existing" && targetResolution.targetResolutionStatus !== "resolved_existing_app") {
        const error = new Error(targetResolution.message || "Target resolution did not prove a unique existing app target.");
        error.stageFailureClass = targetResolution.targetResolutionStatus || "target_resolution_failed";
        error.nextSafeAction = targetResolutionBypassBlockedAction();
        throw error;
      }
      if (summary.target_resolution_mode === "create-new") {
        if (targetResolution.targetResolutionStatus !== "not_found_in_workspace") {
          const error = new Error(targetResolution.message || "Create-new import did not prove the app is absent from the workspace.");
          error.stageFailureClass = `create_new_${targetResolution.targetResolutionStatus || "target_resolution_failed"}`;
          error.nextSafeAction = targetResolutionBypassBlockedAction();
          throw error;
        }
        if (!summary.create_new_confirmed) {
          summary.create_new_confirmation_required = true;
          const error = new Error("Create-new import requires explicit confirmation after target resolution proves not_found_in_workspace.");
          error.stageFailureClass = "create_new_confirmation_required";
          error.nextSafeAction = "Confirm create-new explicitly after target resolution proves not_found_in_workspace, or rerun update-existing for an existing app.";
          throw error;
        }
        summary.create_new_confirmation_required = false;
      }
      if (targetResolution.canonicalIdentity) {
        summary.canonical_application_id = targetResolution.canonicalIdentity.applicationId;
        summary.canonical_application_alias = targetResolution.canonicalIdentity.applicationAlias;
        summary.canonical_resolution_source = targetResolution.resolutionSource;
        summary.canonical_mapping_status = "resolved";
      }
      summary.direct_import_fallback_allowed = targetResolutionAllowsImport(summary);
      return targetResolution;
    }
  );
  if (!targetResolveStage.ok) {
    applyTargetResolutionBlockedSummary(
      summary,
      targetResolveStage.stage.failure_class,
      targetResolveStage.stage.next_safe_action || targetResolutionBypassBlockedAction()
    );
    await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
    return buildRoundtripResult(1, summary);
  }

  const liveValidateStage = await runTimedStage(
    summary,
    "live_validate",
    {
      app_path: options.appPath,
      execution_mode_used: summary.execution_mode_used,
      workspace_id: summary.workspaceid || options.workspaceId
    },
    async () => {
      const validateRun = await runRoundtripWithWorkspaceResolution({
        appPath: options.appPath,
        dbConnectionName: options.dbConnectionName,
        executionModeUsed: summary.execution_mode_used,
        buildRoot: summary.recommended_cwd,
        workspaceId: summary.workspaceid || options.workspaceId,
        includeImport: false,
        summary,
        transcriptParts,
        deps
      });
      if (!validateRun.success || !validateRun.runtimeResult?.success) {
        const error = new Error("Live validate failed.");
        error.stageFailureClass = "live_validate_failed";
        error.nextSafeAction = "Fix the live validate failure before import.";
        throw error;
      }
      return validateRun.runtimeResult;
    }
  );
  if (!liveValidateStage.ok) {
    summary.validate_status = "fail";
    summary.import_status = summary.import_intent_choice === "validate-and-import" ? "blocked" : "skipped";
    summary.runtime_gate_status = "fail";
    summary.failure_class = liveValidateStage.stage.failure_class;
    summary.blocking_reason = liveValidateStage.stage.failure_class;
    await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
    return buildRoundtripResult(1, summary);
  }
  summary.validate_status = "pass";

  if (summary.import_intent_choice !== "validate-and-import") {
    summary.import_status = "skipped";
    summary.runtime_gate_status = "pass";
    summary.notes.push("Skipped import because the resolved runtime action is validate-only.");
    if (summary.runtime_verification_required) {
      summary.notes.push("Runtime verification was requested, but it only runs after a successful import and was therefore not executed.");
    }
    await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
    return buildRoundtripResult(0, summary);
  }

  const importStage = await runTimedStage(
    summary,
    "import",
    {
      app_path: options.appPath,
      execution_mode_used: summary.execution_mode_used,
      workspace_id: summary.workspaceid || options.workspaceId,
      import_mode: summary.import_mode_requested
    },
    async () => {
      if (!targetResolutionAllowsImport(summary)) {
        const error = new Error("Import requires proven target resolution authorization.");
        error.stageFailureClass = "target_resolution_import_guard_failed";
        error.nextSafeAction = targetResolutionBypassBlockedAction();
        throw error;
      }
      let importRun;
      if (summary.import_mode_requested === "direct") {
        summary.import_mode_used = "direct";
        importRun = await executeDirectImport({
          appPath: options.appPath,
          dbConnectionName: options.dbConnectionName,
          executionModeUsed: summary.execution_mode_used,
          buildRoot: summary.recommended_cwd,
          workspaceId: summary.workspaceid || options.workspaceId
        });
        transcriptParts.push(importRun.transcript);
      } else {
        importRun = await runRoundtripWithWorkspaceResolution({
          appPath: options.appPath,
          dbConnectionName: options.dbConnectionName,
          executionModeUsed: summary.execution_mode_used,
          buildRoot: summary.recommended_cwd,
          workspaceId: summary.workspaceid || options.workspaceId,
          includeImport: true,
          summary,
          transcriptParts,
          deps
        });
        if (!importRun.success) {
          const error = new Error("Live import wrapper flow failed.");
          error.stageFailureClass = "live_import_failed";
          error.nextSafeAction = "Fix the import wrapper failure before retrying.";
          throw error;
        }
        if (!importRun.runtimeResult.success && classifyImportFallbackEligibility(importRun.runtimeResult)) {
          summary.import_lane_fallback_used = true;
          summary.import_lane_fallback_reason = "wrapper_only_failure";
          summary.import_mode_used = "direct";
          const directImport = await executeDirectImport({
            appPath: options.appPath,
            dbConnectionName: options.dbConnectionName,
            executionModeUsed: summary.execution_mode_used,
            buildRoot: summary.recommended_cwd,
            workspaceId: summary.workspaceid || options.workspaceId,
            executeRoundtripImpl: deps.executeSelectedRoundtrip
          });
          transcriptParts.push(directImport.transcript);
          return directImport;
        }
        importRun = importRun.runtimeResult;
      }
      if (!importRun.success) {
        const error = new Error("Live import failed.");
        error.stageFailureClass = "live_import_failed";
        error.nextSafeAction = "Fix the live import failure before retrying.";
        throw error;
      }
      const importedApplicationId = parseImportedApplicationId(cleanOutput(importRun.result || importRun));
      if (
        Number.isInteger(importedApplicationId) &&
        summary.canonical_application_id &&
        importedApplicationId !== summary.canonical_application_id
      ) {
        const error = new Error("Imported application id did not match the resolved canonical target.");
        error.stageFailureClass = "canonical_application_import_target_mismatch";
        error.nextSafeAction = "Fix the target mapping mismatch before retrying import.";
        throw error;
      }
      if (Number.isInteger(importedApplicationId) && importedApplicationId > 0 && !summary.canonical_application_id) {
        summary.canonical_application_id = importedApplicationId;
      }
      return importRun;
    }
  );
  if (!importStage.ok) {
    if (importStage.stage.failure_class === "target_resolution_import_guard_failed") {
      applyTargetResolutionBlockedSummary(summary, importStage.stage.failure_class);
      await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
      return buildRoundtripResult(1, summary);
    }
    summary.import_status = "fail";
    summary.runtime_gate_status = "fail";
    summary.failure_class = importStage.stage.failure_class;
    summary.blocking_reason = importStage.stage.failure_class;
    await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
    return buildRoundtripResult(1, summary);
  }

  summary.import_status = "pass";
  summary.runtime_gate_status = "pass";
  summary.session_entrypoint_used = importStage.result.entrypoint || "";
  if (summary.runtime_verification_required) {
    const verificationResult = await deps.verifyRuntimeUi({
      appPath: options.appPath,
      runtimeBaseUrl: options.runtimeBaseUrl,
      runtimePageUrl: options.runtimePageUrl,
      pageId: options.pageId,
      runtimeProvider: options.runtimeProvider,
      artifactDir: options.runtimeArtifactDir,
      _deps: options._deps
    });
    applyRuntimeVerificationSummary(summary, verificationResult.payload);
    transcriptParts.push(`## runtime_verification\n${JSON.stringify(verificationResult.payload, null, 2)}\n`);
    if (verificationResult.code !== 0) {
      summary.notes.push("Import succeeded, but post-import runtime verification found issues.");
      summary.recommended_next_action = "Review the recorded post-import runtime verification findings.";
    }
  } else {
    summary.notes.push("Post-import runtime verification is disabled by default. Use --require-runtime-verification to enable it.");
  }
  await deps.writeRoundtripArtifacts(summary, transcriptParts.join("\n"));
  return buildRoundtripResult(0, summary);
}

export { DEFAULT_CONFIG, probeWorkspace, writeWorkspaceResolution };
