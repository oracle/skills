/**
 * Shared filesystem, process, and serialization helpers for APEXlang tooling.
 */
import { execFile } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT_OVERRIDE = process.env.APEXLANG_PACKAGE_ROOT ? path.resolve(process.env.APEXLANG_PACKAGE_ROOT) : "";
const EMBEDDED_TOOLS_ROOT_OVERRIDE = process.env.APEXLANG_EMBEDDED_TOOLS_ROOT ? path.resolve(process.env.APEXLANG_EMBEDDED_TOOLS_ROOT) : "";
const RUNTIME_ROOT_OVERRIDE = process.env.APEXLANG_RUNTIME_ROOT ? path.resolve(process.env.APEXLANG_RUNTIME_ROOT) : "";
const PACKAGED_OUTPUT_ROOT_OVERRIDE = process.env.APEXLANG_OUTPUT_ROOT ? path.resolve(process.env.APEXLANG_OUTPUT_ROOT) : "";

function hasSourceRepoMarkers(targetPath) {
  return existsSync(path.join(targetPath, "package.json")) && existsSync(path.join(targetPath, "skills", "apexlang", "assets", "public-package.manifest.json"));
}

function hasPackagedSkillMarkers(targetPath) {
  return existsSync(path.join(targetPath, "SKILL.md")) && existsSync(path.join(targetPath, "manifest.json")) && existsSync(path.join(targetPath, "tools"));
}

function resolveRootContext(startDir) {
  if (PACKAGE_ROOT_OVERRIDE) {
    return {
      rootType: "packaged-skill",
      rootPath: PACKAGE_ROOT_OVERRIDE
    };
  }
  let current = path.resolve(startDir);
  while (true) {
    if (hasSourceRepoMarkers(current)) {
      return {
        rootType: "source-repo",
        rootPath: current
      };
    }
    if (hasPackagedSkillMarkers(current)) {
      return {
        rootType: "packaged-skill",
        rootPath: current
      };
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return {
    rootType: "source-repo",
    rootPath: path.resolve(MODULE_DIR, "../../../..")
  };
}

const ROOT_CONTEXT = resolveRootContext(MODULE_DIR);

/**
 * Absolute repository root or installed package root for the active tooling location.
 */
export const REPO_ROOT = ROOT_CONTEXT.rootPath;
export const TOOLING_ENV = ROOT_CONTEXT.rootType;
export const SKILL_ROOT = TOOLING_ENV === "packaged-skill" ? REPO_ROOT : path.join(REPO_ROOT, "skills", "apexlang");

/**
 * Return whether the current tooling is executing from an installed public skill package.
 */
export function isPackagedSkillRuntime() {
  return TOOLING_ENV === "packaged-skill";
}

/**
 * Resolve the runtime output root for source and packaged layouts.
 */
export function apexlangOutputRoot() {
  if (isPackagedSkillRuntime()) {
    if (!PACKAGED_OUTPUT_ROOT_OVERRIDE) {
      throw new Error("APEXLANG_OUTPUT_ROOT is required in packaged apexlang runtime");
    }
    return PACKAGED_OUTPUT_ROOT_OVERRIDE;
  }
  return repoPath("artifacts", "apexlang");
}

/**
 * Read and parse a JSON file using UTF-8 encoding.
 */
export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

/**
 * Read JSON when a file exists; return null only when it is absent.
 */
export async function readJsonIfPresent(filePath) {
  if (!(await exists(filePath))) {
    return null;
  }
  return readJson(filePath);
}

/**
 * Write stable pretty JSON and ensure the destination directory exists.
 */
export async function writeJson(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

/**
 * Create a directory tree when it does not already exist.
 */
export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Remove a directory tree without failing when it is already absent.
 */
export async function removeDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
}

/**
 * Return whether a filesystem path is accessible.
 */
export async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve one or more path segments from the repository root.
 */
export function repoPath(...parts) {
  return path.join(REPO_ROOT, ...parts);
}

/**
 * Resolve a path inside the APEXlang skill root in either source or packaged layouts.
 */
export function apexlangPath(...parts) {
  return path.join(SKILL_ROOT, ...parts);
}

/**
 * Resolve a template path for source and packaged layouts.
 */
export function apexlangTemplatePath(...parts) {
  if (isPackagedSkillRuntime()) {
    return apexlangPath("templates", ...parts);
  }
  return repoPath("references/policies", "apexlang", "templates", ...parts);
}

/**
 * Resolve a tool path that should be reachable from the installed public skill.
 */
export function apexlangToolPath(...parts) {
  if (isPackagedSkillRuntime()) {
    if (EMBEDDED_TOOLS_ROOT_OVERRIDE) {
      return path.join(EMBEDDED_TOOLS_ROOT_OVERRIDE, ...parts);
    }
    if (PACKAGE_ROOT_OVERRIDE) {
      return path.join(PACKAGE_ROOT_OVERRIDE, "tools", ...parts);
    }
    if (RUNTIME_ROOT_OVERRIDE) {
      return path.join(path.dirname(RUNTIME_ROOT_OVERRIDE), "tools", ...parts);
    }
  }
  return apexlangPath("tools", ...parts);
}

/**
 * Resolve a SQLcl helper tool path for source and packaged layouts.
 */
export function sqlclToolPath(...parts) {
  if (isPackagedSkillRuntime()) {
    if (RUNTIME_ROOT_OVERRIDE) {
      return path.join(RUNTIME_ROOT_OVERRIDE, ...parts);
    }
    if (PACKAGE_ROOT_OVERRIDE) {
      return path.join(PACKAGE_ROOT_OVERRIDE, "runtime", ...parts);
    }
    return apexlangPath("runtime", ...parts);
  }
  return repoPath("skills", "sqlcl", "tools", ...parts);
}

/**
 * Resolve the default runtime log directory for source and packaged layouts.
 */
export function skillLogPath(...parts) {
  return path.join(apexlangOutputRoot(), "logs", ...parts);
}

/**
 * Resolve the default runtime report directory for source and packaged layouts.
 */
export function skillReportPath(...parts) {
  return path.join(apexlangOutputRoot(), "reports", ...parts);
}

/**
 * Render a path relative to the repository root for user-facing output.
 */
export function relativeToRepo(targetPath) {
  return path.relative(REPO_ROOT, targetPath) || ".";
}

/**
 * Return whether a target path stays inside a root directory.
 */
export function isPathInside(rootPath, targetPath) {
  const relative = path.relative(path.resolve(rootPath), path.resolve(targetPath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/**
 * Return whether a CLI flag is present in the argument list.
 */
export function parseFlag(args, name) {
  return args.includes(name);
}

/**
 * Read the value that follows a named CLI option, or return a fallback.
 */
export function readOption(args, name, fallback = "") {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) {
    return fallback;
  }
  return args[index + 1];
}

/**
 * Run a child process with optional passthrough and failure capture.
 */
export async function runCommand(command, args, options = {}) {
  const {
    cwd = REPO_ROOT,
    env,
    allowFailure = false,
    passthrough = true
  } = options;
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      env: { ...process.env, ...env },
      maxBuffer: 50 * 1024 * 1024
    });
    if (passthrough) {
      if (result.stdout) {
        process.stdout.write(result.stdout);
      }
      if (result.stderr) {
        process.stderr.write(result.stderr);
      }
    }
    return { code: 0, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  } catch (error) {
    if (passthrough) {
      if (error.stdout) {
        process.stdout.write(error.stdout);
      }
      if (error.stderr) {
        process.stderr.write(error.stderr);
      }
    }
    if (!allowFailure) {
      throw error;
    }
    return {
      code: typeof error.code === "number" ? error.code : 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
      error
    };
  }
}

/**
 * Recursively collect files under a directory that match an optional predicate.
 */
export async function collectFiles(dirPath, predicate) {
  const output = [];
  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      if (!predicate || predicate(absolutePath, entry)) {
        output.push(absolutePath);
      }
    }
  }
  if (await exists(dirPath)) {
    await walk(dirPath);
  }
  return output.sort();
}

/**
 * Classify files whose contents should be treated as text by package tooling.
 */
export function isTextPath(filePath, extraSuffixes = []) {
  const suffix = path.extname(filePath).toLowerCase();
  const allowed = new Set([".md", ".txt", ".json", ".yaml", ".yml", ".mjs", ".js", ".py", ".sh", ...extraSuffixes]);
  return allowed.has(suffix) || path.basename(filePath) === "SKILL.md" || path.basename(filePath) === "openai.yaml";
}

/**
 * Serialize values with recursively sorted object keys for deterministic comparisons.
 */
export function stableStringify(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => JSON.parse(stableStringify(item))));
  }
  if (value && typeof value === "object") {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      output[key] = JSON.parse(stableStringify(value[key]));
    }
    return JSON.stringify(output);
  }
  if (typeof value === "undefined") {
    return "null";
  }
  return JSON.stringify(value);
}
