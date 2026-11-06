import { buildOracleNormalizedMap, ORACLE_NORMALIZER_VERSION, readOracleRuntimeMetadata } from "./query-valid-props-normalize.mjs";
import { resolveOracleRuntime } from "./query-valid-props-runtime.mjs";

/**
 * Load one compiler-backed MMD context with normalized metadata and provenance.
 */
export function loadOracleCompilerContext(compilerOracleHome, dependencies = {}) {
  const resolveRuntime = dependencies.resolveOracleRuntime || resolveOracleRuntime;
  const readRuntimeMetadata = dependencies.readOracleRuntimeMetadata || readOracleRuntimeMetadata;
  const buildNormalizedMap = dependencies.buildOracleNormalizedMap || buildOracleNormalizedMap;

  const oracleRuntime = resolveRuntime(compilerOracleHome);
  const { metadata, buildId, metadataHash } = readRuntimeMetadata(oracleRuntime.compilerJarPath);
  const map = buildNormalizedMap({
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
