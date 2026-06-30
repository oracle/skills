import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

/**
 * Runtime discovery and JAR-reading helpers for compiler-backed property metadata.
 */

export const ORACLE_HOME_ENV_VARS = ["APEXLANG_ORACLE_HOME", "DBTOOLS_HOME", "SQLCL_HOME", "ORACLE_HOME"];
export const MAX_METADATA_OUTPUT_BYTES = 64 * 1024 * 1024;
const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;
const ZIP_STORED_METHOD = 0;
const ZIP_DEFLATE_METHOD = 8;
const ZIP_MAX_COMMENT_LENGTH = 0xffff;

function isExecutableFile(candidate) {
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
}

/**
 * Find the SQLcl sql executable on PATH across Unix and Windows shells.
 */
export function findSqlOnPath({
  pathValue = process.env.PATH || "",
  platform = process.platform,
  pathExtValue = process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM"
} = {}) {
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  const executableNames = platform === "win32"
    ? Array.from(new Set([
        "sql",
        ...pathExtValue
          .split(";")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => `sql${value.toLowerCase()}`)
      ]))
    : ["sql"];

  for (const entry of pathEntries) {
    for (const executableName of executableNames) {
      const candidate = path.join(entry, executableName);
      if (isExecutableFile(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Build ordered Oracle runtime candidates from flags, environment variables, VS Code extensions, and PATH SQLcl.
 */
export function collectOracleHomeCandidates(explicitOracleHome) {
  const candidates = [];
  const seen = new Set();

  function addCandidate(candidate, source) {
    if (!candidate) {
      return;
    }
    const resolved = path.resolve(candidate);
    if (seen.has(resolved)) {
      return;
    }
    seen.add(resolved);
    candidates.push({ path: resolved, source });
  }

  if (explicitOracleHome) {
    addCandidate(explicitOracleHome, "flag");
    return candidates;
  }

  for (const envName of ORACLE_HOME_ENV_VARS) {
    if (process.env[envName]) {
      addCandidate(process.env[envName], `env:${envName}`);
    }
  }

  const vscodeExtensionsDir = path.join(os.homedir(), ".vscode", "extensions");
  if (fs.existsSync(vscodeExtensionsDir)) {
    const extensionDirs = fs.readdirSync(vscodeExtensionsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("oracle.sql-developer-"))
      .map((entry) => path.join(vscodeExtensionsDir, entry.name))
      .sort((left, right) => right.localeCompare(left));
    for (const extensionDir of extensionDirs) {
      addCandidate(extensionDir, "vscode_extension");
    }
  }

  const resolvedSqlPath = findSqlOnPath();
  if (resolvedSqlPath) {
    addCandidate(path.dirname(path.dirname(resolvedSqlPath)), "path_sqlcl");
  }

  return candidates;
}

/**
 * Return the newest APEXlang compiler JAR in a directory, when present.
 */
export function findCompilerJarInDirectory(directory) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    return null;
  }
  const matches = fs.readdirSync(directory)
    .filter((entry) => /^apexlang-compiler-.*\.jar$/.test(entry))
    .sort((left, right) => right.localeCompare(left));
  if (!matches.length) {
    return null;
  }
  return path.join(directory, matches[0]);
}

/**
 * Resolve one candidate path into the compiler JAR and runtime home used by metadata queries.
 */
export function resolveOracleRuntimeCandidate(candidate) {
  const directPath = candidate.path;
  const checks = [];

  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile() && directPath.endsWith(".jar")) {
    checks.push({
      compilerJarPath: directPath,
      runtimeHome: path.dirname(path.dirname(directPath))
    });
  }

  checks.push(
    {
      compilerJarPath: findCompilerJarInDirectory(path.join(directPath, "dbtools", "sqlcl", "lib")),
      runtimeHome: path.join(directPath, "dbtools", "sqlcl")
    },
    {
      compilerJarPath: findCompilerJarInDirectory(path.join(directPath, "sqlcl", "lib")),
      runtimeHome: path.join(directPath, "sqlcl")
    },
    {
      compilerJarPath: findCompilerJarInDirectory(path.join(directPath, "lib")),
      runtimeHome: directPath
    }
  );

  const buildRootCompilerJar = path.join(directPath, "lib", "ext", "apexlang-compiler.jar");
  if (fs.existsSync(buildRootCompilerJar)) {
    checks.push({
      compilerJarPath: buildRootCompilerJar,
      runtimeHome: directPath
    });
  }

  for (const check of checks) {
    if (!check.compilerJarPath || !fs.existsSync(check.compilerJarPath)) {
      continue;
    }
    return {
      compilerJarPath: check.compilerJarPath,
      oracleHome: candidate.path,
      runtimeHome: check.runtimeHome,
      source: candidate.source
    };
  }

  return null;
}

/**
 * Resolve the first usable Oracle runtime or throw a clear setup error.
 */
export function resolveOracleRuntime(explicitOracleHome) {
  const candidates = collectOracleHomeCandidates(explicitOracleHome);
  for (const candidate of candidates) {
    const resolved = resolveOracleRuntimeCandidate(candidate);
    if (resolved) {
      return resolved;
    }
  }

  const details = candidates.map((candidate) => `- ${candidate.source}: ${candidate.path}`).join("\n");
  throw new Error(
    [
      "Could not find an Oracle APEXlang runtime for query-valid-props.",
      "Expected an installed Oracle VS Code extension, dbtools home, SQLcl home, or direct compiler jar path.",
      "Checked:",
      details || "- none"
    ].join("\n")
  );
}

function readUInt16(buffer, offset, context) {
  if (offset < 0 || offset + 2 > buffer.length) {
    throw new Error(`Malformed jar: could not read ${context}`);
  }
  return buffer.readUInt16LE(offset);
}

function readUInt32(buffer, offset, context) {
  if (offset < 0 || offset + 4 > buffer.length) {
    throw new Error(`Malformed jar: could not read ${context}`);
  }
  return buffer.readUInt32LE(offset);
}

function findEndOfCentralDirectory(buffer) {
  const minimumLength = 22;
  if (buffer.length < minimumLength) {
    throw new Error("Malformed jar: file is too small to be a ZIP/JAR archive");
  }

  const start = Math.max(0, buffer.length - minimumLength - ZIP_MAX_COMMENT_LENGTH);
  for (let offset = buffer.length - minimumLength; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === ZIP_EOCD_SIGNATURE) {
      return offset;
    }
  }
  throw new Error("Malformed jar: could not find ZIP end of central directory");
}

function inflateEntryData(compressedData, entryName, jarPath) {
  try {
    return zlib.inflateRawSync(compressedData, { maxOutputLength: MAX_METADATA_OUTPUT_BYTES });
  } catch (error) {
    throw new Error(
      `Could not decompress ${entryName} from ${jarPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Locate and read one entry from a JAR/ZIP file without shelling out to unzip.
 */
export function readJarEntry(jarPath, entryName) {
  const archive = fs.readFileSync(jarPath);
  const eocdOffset = findEndOfCentralDirectory(archive);
  const centralDirectorySize = readUInt32(archive, eocdOffset + 12, "central directory size");
  const centralDirectoryOffset = readUInt32(archive, eocdOffset + 16, "central directory offset");
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

  if (centralDirectoryEnd > archive.length) {
    throw new Error(`Malformed jar: central directory exceeds file length in ${jarPath}`);
  }

  let offset = centralDirectoryOffset;
  while (offset < centralDirectoryEnd) {
    const signature = readUInt32(archive, offset, "central directory signature");
    if (signature !== ZIP_CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error(`Malformed jar: invalid central directory entry in ${jarPath}`);
    }

    const compressionMethod = readUInt16(archive, offset + 10, "central directory compression method");
    const compressedSize = readUInt32(archive, offset + 20, "central directory compressed size");
    const uncompressedSize = readUInt32(archive, offset + 24, "central directory uncompressed size");
    const fileNameLength = readUInt16(archive, offset + 28, "central directory file name length");
    const extraFieldLength = readUInt16(archive, offset + 30, "central directory extra field length");
    const fileCommentLength = readUInt16(archive, offset + 32, "central directory comment length");
    const localHeaderOffset = readUInt32(archive, offset + 42, "central directory local header offset");
    const nameOffset = offset + 46;
    const nameEnd = nameOffset + fileNameLength;

    if (nameEnd > archive.length) {
      throw new Error(`Malformed jar: central directory entry name exceeds file length in ${jarPath}`);
    }

    const currentEntryName = archive.toString("utf8", nameOffset, nameEnd);
    const nextOffset = nameEnd + extraFieldLength + fileCommentLength;
    if (nextOffset > archive.length) {
      throw new Error(`Malformed jar: central directory entry exceeds file length in ${jarPath}`);
    }

    if (currentEntryName === entryName) {
      if (compressedSize > MAX_METADATA_OUTPUT_BYTES || uncompressedSize > MAX_METADATA_OUTPUT_BYTES) {
        throw new Error(
          `Jar entry ${entryName} in ${jarPath} exceeds the maximum supported size of ${MAX_METADATA_OUTPUT_BYTES} bytes`
        );
      }

      if (readUInt32(archive, localHeaderOffset, "local file header signature") !== ZIP_LOCAL_FILE_SIGNATURE) {
        throw new Error(`Malformed jar: invalid local file header for ${entryName} in ${jarPath}`);
      }

      const localNameLength = readUInt16(archive, localHeaderOffset + 26, "local file header name length");
      const localExtraLength = readUInt16(archive, localHeaderOffset + 28, "local file header extra field length");
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const dataEnd = dataOffset + compressedSize;
      if (dataEnd > archive.length) {
        throw new Error(`Malformed jar: entry data for ${entryName} exceeds file length in ${jarPath}`);
      }

      const compressedData = archive.subarray(dataOffset, dataEnd);
      let entryData;
      if (compressionMethod === ZIP_STORED_METHOD) {
        entryData = Buffer.from(compressedData);
      } else if (compressionMethod === ZIP_DEFLATE_METHOD) {
        entryData = inflateEntryData(compressedData, entryName, jarPath);
      } else {
        throw new Error(
          `Jar entry ${entryName} in ${jarPath} uses unsupported compression method ${compressionMethod}`
        );
      }

      if (entryData.length !== uncompressedSize) {
        throw new Error(
          `Malformed jar: entry ${entryName} in ${jarPath} expected ${uncompressedSize} bytes, found ${entryData.length}`
        );
      }

      return entryData.toString("utf8");
    }

    offset = nextOffset;
  }

  throw new Error(`Jar entry ${entryName} not found in ${jarPath}`);
}
