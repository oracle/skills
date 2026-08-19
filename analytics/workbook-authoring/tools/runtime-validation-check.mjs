#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
   RUNTIME_PATH_SIGNAL_TEXTBOX,
   loadRuntimePathRegistry,
   resolveRuntimePathSignal,
   getCanonicalSignalText,
   collectLegacySignalTextValues,
   migrateSignalLegacyTextToCanonical
} from './runtime-path-registry-utils.mjs';
import {
   extractWorkbookProjectVersion,
   resolveCompatibilityProfile
} from './compatibility-profile-utils.mjs';

const argv = process.argv.slice(2);

function getArg(flag) {
   const idx = argv.indexOf(flag);
   if (idx === -1 || idx + 1 >= argv.length) {
      return null;
   }
   return argv[idx + 1];
}

function hasFlag(flag) {
   return argv.includes(flag);
}

function fail(msg) {
   process.stderr.write(`${msg}\n`);
   process.exit(1);
}

const inputPath = getArg('--input');
if (!inputPath) {
   fail('Usage: node .workbook-authoring/tools/runtime-validation-check.mjs --input <workbook.json> [--compatibility-target <auto|legacy|standard|current|pv-N>] [--server-project-version <N>] [--target-version <deprecated YY.MM alias>] [--authoring-mode <generate_fresh|modify_existing>] [--requested-operation <edit_filter_values_or_operator|add_filter_bar_filter|edit_titles>] [--source-mode <catalog_read|session_fast_path>] [--confirmation-state <confirmed|pending>] [--resolved-workbook-id "<id>"] [--resolved-workbook-name "<name>"] [--resolved-workbook-path "<path>"] [--requested-plugin-type "<pluginType>"] [--allow-fallback-plugin-type --fallback-plugin-type "<pluginType>" --fallback-reason "<reason>"] [--version-selection-reason <selection reason>] [--export-requested <true|false>] [--oac-mcp-connected <true|false>] --discovery-method <search_catalog|discover_data> --save-available <true|false> --export-available <true|false> [--viz-resolution-profiles <file>] [--schema-registry-profile <file>] [--schema-dir <dir>] [--runtime-error "..."] [--apply-known-patches] [--output <file>] [--in-place]');
}

const runtimeErrorText = getArg('--runtime-error');
const outputPath = getArg('--output');
const inPlace = hasFlag('--in-place');
const applyKnownPatches = hasFlag('--apply-known-patches');
const authoringMode = (getArg('--authoring-mode') || 'generate_fresh').trim();
const requestedOperation = getArg('--requested-operation');
const modifySourceMode = getArg('--source-mode');
const confirmationState = getArg('--confirmation-state');
const resolvedWorkbookID = getArg('--resolved-workbook-id');
const resolvedWorkbookName = getArg('--resolved-workbook-name');
const resolvedWorkbookPath = getArg('--resolved-workbook-path');
const requestedPluginType = getArg('--requested-plugin-type');
const allowFallbackPluginType = hasFlag('--allow-fallback-plugin-type');
const fallbackPluginType = getArg('--fallback-plugin-type');
const fallbackReason = getArg('--fallback-reason');
const requestedTargetVersionRaw = getArg('--target-version') || process.env.WORKBOOK_AUTHORING_TARGET_VERSION || null;
const requestedCompatibilityTargetRaw = getArg('--compatibility-target') || process.env.WORKBOOK_AUTHORING_COMPATIBILITY_TARGET || null;
const serverProjectVersionRaw = getArg('--server-project-version') || process.env.WORKBOOK_AUTHORING_SERVER_PROJECT_VERSION || null;
const versionSelectionReasonRaw = getArg('--version-selection-reason') || process.env.WORKBOOK_AUTHORING_VERSION_SELECTION_REASON || null;
const exportRequestedRaw = getArg('--export-requested') || process.env.WORKBOOK_AUTHORING_EXPORT_REQUESTED || null;
const discoveryMethodOverrideRaw = getArg('--discovery-method') || process.env.WORKBOOK_AUTHORING_DISCOVERY_METHOD || null;
const oacMcpConnectedOverrideRaw = getArg('--oac-mcp-connected') || process.env.WORKBOOK_AUTHORING_OAC_MCP_CONNECTED || null;
const saveAvailableOverrideRaw = getArg('--save-available') || process.env.WORKBOOK_AUTHORING_SAVE_AVAILABLE || null;
const exportAvailableOverrideRaw = getArg('--export-available') || process.env.WORKBOOK_AUTHORING_EXPORT_AVAILABLE || null;
const explicitVersionSelectionReasons = new Set([
   'default_policy',
   'user_requested_newer',
   'required_newer_behavior',
   'capability_heuristic_2607',
   'capability_heuristic_2607_missing_fallback_latest',
   'capability_heuristic_2605',
   'capability_heuristic_2605_missing_fallback_latest',
   'validation_fallback',
   'session_sticky',
   'explicit_compatibility_target',
   'deprecated_release_alias',
   'existing_workbook_project_version',
   'server_project_version',
   'connected_standard_fallback',
   'connected_legacy_fallback',
   'offline_default'
]);

function parseDiscoveryMethodArg(value, flag) {
   if (value == null) {
      return null;
   }
   const normalized = String(value).trim();
   if (normalized === 'search_catalog' || normalized === 'discover_data') {
      return normalized;
   }
   fail(`Invalid value for ${flag}: ${value}. Use search_catalog or discover_data.`);
}

function parseBooleanArg(value, flag) {
   if (value == null) {
      return null;
   }
   const normalized = String(value).trim().toLowerCase();
   if (['true', '1', 'yes'].includes(normalized)) {
      return true;
   }
   if (['false', '0', 'no'].includes(normalized)) {
      return false;
   }
   fail(`Invalid boolean value for ${flag}: ${value}. Use true or false.`);
}

function parseVersionSelectionReasonArg(value, flag) {
   if (value == null) {
      return null;
   }
   const normalized = String(value).trim();
   if (explicitVersionSelectionReasons.has(normalized)) {
      return normalized;
   }
   fail(
      `Invalid value for ${flag}: ${value}. Use one of ${Array.from(explicitVersionSelectionReasons).join(', ')}.`
   );
}

function resolveVersionNodeDefault(versionCatalog, nodeID) {
   const defaults = versionCatalog?.defaults;
   if (defaults && typeof defaults === 'object' && !Array.isArray(defaults)) {
      const raw = defaults[nodeID];
      if (typeof raw === 'string' && raw.trim() !== '') {
         return raw.trim();
      }
   }
   const versionedNodes = Array.isArray(versionCatalog?.versionedNodes) ? versionCatalog.versionedNodes : [];
   const match = versionedNodes.find((entry) => entry && entry.id === nodeID);
   if (match && typeof match.defaultValue === 'string' && match.defaultValue.trim() !== '') {
      return match.defaultValue.trim();
   }
   fail(`version-field-catalog.json is missing default version for node '${nodeID}'.`);
}

function normalizeVersionToken(value, flagLabel) {
   if (value == null) {
      return null;
   }
   const normalized = String(value).trim();
   if (normalized === '') {
      return null;
   }
   if (!/^\d{2}\.\d{2}$/.test(normalized)) {
      fail(`Invalid value for ${flagLabel}: ${value}. Use YY.MM format (example: 26.07).`);
   }
   const [majorRaw, minorRaw] = normalized.split('.');
   const major = Number.parseInt(majorRaw, 10);
   const minor = Number.parseInt(minorRaw, 10);
   if (!Number.isInteger(major) || !Number.isInteger(minor)) {
      fail(`Invalid value for ${flagLabel}: ${value}. Use YY.MM format (example: 26.07).`);
   }
   if (major < 26 || (major === 26 && minor < 1)) {
      fail(`Invalid value for ${flagLabel}: ${value}. Target versions earlier than 26.01 are not supported.`);
   }
   return `${String(major).padStart(2, '0')}.${String(minor).padStart(2, '0')}`;
}

function tryNormalizeVersionFolderName(value) {
   if (typeof value !== 'string') {
      return null;
   }
   const normalized = value.trim();
   if (!/^\d{2}\.\d{2}$/.test(normalized)) {
      return null;
   }
   const [majorRaw, minorRaw] = normalized.split('.');
   const major = Number.parseInt(majorRaw, 10);
   const minor = Number.parseInt(minorRaw, 10);
   if (!Number.isInteger(major) || !Number.isInteger(minor)) {
      return null;
   }
   if (major < 26 || (major === 26 && minor < 1)) {
      return null;
   }
   return `${String(major).padStart(2, '0')}.${String(minor).padStart(2, '0')}`;
}

function versionSort(left, right) {
   const [leftMajor, leftMinor] = left.split('.').map((segment) => Number.parseInt(segment, 10));
   const [rightMajor, rightMinor] = right.split('.').map((segment) => Number.parseInt(segment, 10));
   if (leftMajor !== rightMajor) {
      return leftMajor - rightMajor;
   }
   return leftMinor - rightMinor;
}

function nextLowerVersion(availableTargetVersions, currentVersion) {
   const sorted = Array.isArray(availableTargetVersions)
      ? [...availableTargetVersions].sort(versionSort)
      : [];
   const currentIndex = sorted.indexOf(currentVersion);
   if (currentIndex <= 0) {
      return null;
   }
   return sorted[currentIndex - 1];
}

function listInstalledVersionBundles(bundleRootDir) {
   let directoryEntries = [];
   try {
      directoryEntries = fs.readdirSync(bundleRootDir, { withFileTypes: true });
   } catch (error) {
      return [];
   }
   const versions = [];
   for (const entry of directoryEntries) {
      if (!entry.isDirectory()) {
         continue;
      }
      const normalized = tryNormalizeVersionFolderName(entry.name);
      if (!normalized) {
         continue;
      }
      const modelDir = path.join(bundleRootDir, normalized, 'model');
      const templatesDir = path.join(bundleRootDir, normalized, 'templates');
      const schemasDir = path.join(bundleRootDir, normalized, 'schemas');
      if (fs.existsSync(modelDir) && fs.existsSync(templatesDir) && fs.existsSync(schemasDir)) {
         versions.push(normalized);
      }
   }
   return versions.sort(versionSort);
}

function readInstalledVersionBundleManifest(bundleRootDir) {
   const manifestPath = path.join(bundleRootDir, 'version-bundles.json');
   if (!fs.existsSync(manifestPath)) {
      return null;
   }
   let parsed = null;
   try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      parsed = JSON.parse(raw);
   } catch (error) {
      return null;
   }
   if (!parsed || typeof parsed !== 'object') {
      return null;
   }
   const installedVersions = Array.isArray(parsed.installedVersions)
      ? parsed.installedVersions
         .filter((value) => typeof value === 'string')
         .map((value) => tryNormalizeVersionFolderName(value))
         .filter((value) => typeof value === 'string')
      : [];
   const defaultTargetVersion = typeof parsed.defaultTargetVersion === 'string'
      ? tryNormalizeVersionFolderName(parsed.defaultTargetVersion)
      : null;
   const defaultTargetVersionByCapabilityRaw = (
      parsed.defaultTargetVersionByCapability &&
      typeof parsed.defaultTargetVersionByCapability === 'object' &&
      !Array.isArray(parsed.defaultTargetVersionByCapability)
   )
      ? parsed.defaultTargetVersionByCapability
      : {};
   const defaultTargetVersionByCapability = {};
   for (const [key, value] of Object.entries(defaultTargetVersionByCapabilityRaw)) {
      if (typeof value !== 'string') {
         continue;
      }
      const normalized = tryNormalizeVersionFolderName(value);
      if (typeof normalized === 'string') {
         defaultTargetVersionByCapability[key] = normalized;
      }
   }
   return {
      installedVersions: [...new Set(installedVersions)].sort(versionSort),
      defaultTargetVersion,
      defaultTargetVersionByCapability
   };
}

function resolveVersionBundleSelection(bundleRootDir, explicitTargetVersion, options = {}) {
   const discoveredTargetVersions = listInstalledVersionBundles(bundleRootDir);
   const versionBundleManifest = readInstalledVersionBundleManifest(bundleRootDir);
   let availableTargetVersions = [...discoveredTargetVersions];
   if (versionBundleManifest && versionBundleManifest.installedVersions.length > 0) {
      const manifestInstalledVersions = versionBundleManifest.installedVersions
         .filter((value) => discoveredTargetVersions.includes(value));
      const discoveredMissingFromManifest = discoveredTargetVersions
         .filter((value) => !manifestInstalledVersions.includes(value));
      availableTargetVersions = [...manifestInstalledVersions, ...discoveredMissingFromManifest].sort(versionSort);
   }
   const manifestDefaultTargetVersion = (
      versionBundleManifest &&
      typeof versionBundleManifest.defaultTargetVersion === 'string' &&
      availableTargetVersions.includes(versionBundleManifest.defaultTargetVersion)
   )
      ? versionBundleManifest.defaultTargetVersion
      : null;
   const capabilityDefaultKey = options.saveAvailableForDefaultVersion === true
      ? 'saveCatalogAvailable'
      : 'saveCatalogUnavailable';
   const manifestCapabilityDefaultTargetVersion = (
      versionBundleManifest &&
      versionBundleManifest.defaultTargetVersionByCapability &&
      typeof versionBundleManifest.defaultTargetVersionByCapability[capabilityDefaultKey] === 'string' &&
      availableTargetVersions.includes(versionBundleManifest.defaultTargetVersionByCapability[capabilityDefaultKey])
   )
      ? versionBundleManifest.defaultTargetVersionByCapability[capabilityDefaultKey]
      : null;
   if (availableTargetVersions.length === 0) {
      return {
         legacyLayout: true,
         selectedTargetVersion: null,
         availableTargetVersions,
         selectedBundleRootDir: bundleRootDir,
         explicitTargetRequested: explicitTargetVersion != null,
         implicitSelectionReason: null
      };
   }

   if (explicitTargetVersion != null) {
      if (!availableTargetVersions.includes(explicitTargetVersion)) {
         fail(
            `UNRESOLVED_TARGET_VERSION: targetVersion '${explicitTargetVersion}' is not installed. ` +
            `Installed versions: ${availableTargetVersions.join(', ')}.`
         );
      }
      return {
         legacyLayout: false,
         selectedTargetVersion: explicitTargetVersion,
         availableTargetVersions,
         selectedBundleRootDir: path.join(bundleRootDir, explicitTargetVersion),
         explicitTargetRequested: true,
         implicitSelectionReason: null
      };
   }

   const detectedTargetVersion = typeof options.detectedTargetVersion === 'string'
      ? options.detectedTargetVersion
      : null;
   if (detectedTargetVersion && availableTargetVersions.includes(detectedTargetVersion)) {
      return {
         legacyLayout: false,
         selectedTargetVersion: detectedTargetVersion,
         availableTargetVersions,
         selectedBundleRootDir: path.join(bundleRootDir, detectedTargetVersion),
         explicitTargetRequested: false,
         implicitSelectionReason: 'session_sticky'
      };
   }

   if (availableTargetVersions.length === 1) {
      return {
         legacyLayout: false,
         selectedTargetVersion: availableTargetVersions[0],
         availableTargetVersions,
         selectedBundleRootDir: path.join(bundleRootDir, availableTargetVersions[0]),
         explicitTargetRequested: false,
         implicitSelectionReason: 'default_policy'
      };
   }

   const sortedVersions = [...availableTargetVersions].sort(versionSort);
   const latestVersion = sortedVersions[sortedVersions.length - 1];
   const has2607 = sortedVersions.includes('26.07');
   let selectedTargetVersion = null;
   let implicitSelectionReason = null;

   if (manifestCapabilityDefaultTargetVersion) {
      selectedTargetVersion = manifestCapabilityDefaultTargetVersion;
      if (options.saveAvailableForDefaultVersion === true) {
         implicitSelectionReason = selectedTargetVersion === '26.07'
            ? 'capability_heuristic_2607'
            : 'capability_heuristic_2607_missing_fallback_latest';
      } else {
         implicitSelectionReason = selectedTargetVersion === '26.07'
            ? 'capability_heuristic_2607'
            : 'capability_heuristic_2607_missing_fallback_latest';
      }
   } else if (manifestDefaultTargetVersion) {
      selectedTargetVersion = manifestDefaultTargetVersion;
      implicitSelectionReason = 'default_policy';
   } else if (has2607) {
      selectedTargetVersion = '26.07';
      implicitSelectionReason = 'capability_heuristic_2607';
   } else {
      selectedTargetVersion = latestVersion;
      implicitSelectionReason = 'capability_heuristic_2607_missing_fallback_latest';
   }

   if (options.preferFallbackVersionFromValidationError === true) {
      const lowerVersion = nextLowerVersion(sortedVersions, selectedTargetVersion);
      if (lowerVersion) {
         selectedTargetVersion = lowerVersion;
         implicitSelectionReason = 'validation_fallback';
      }
   }

   return {
      legacyLayout: false,
      selectedTargetVersion,
      availableTargetVersions: sortedVersions,
      selectedBundleRootDir: path.join(bundleRootDir, selectedTargetVersion),
      explicitTargetRequested: false,
      implicitSelectionReason
   };
}

const versionSelectionReasonOverride = parseVersionSelectionReasonArg(
   versionSelectionReasonRaw,
   '--version-selection-reason'
);
const requestedTargetVersion = normalizeVersionToken(requestedTargetVersionRaw, '--target-version');
const exportRequestedOverride = parseBooleanArg(exportRequestedRaw, '--export-requested');
const discoveryMethodOverride = parseDiscoveryMethodArg(discoveryMethodOverrideRaw, '--discovery-method');
const oacMcpConnectedOverride = parseBooleanArg(oacMcpConnectedOverrideRaw, '--oac-mcp-connected');
const saveAvailableOverride = parseBooleanArg(saveAvailableOverrideRaw, '--save-available');
const exportAvailableOverride = parseBooleanArg(exportAvailableOverrideRaw, '--export-available');
const saveAvailableForDefaultVersion = saveAvailableOverride === true;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workbookAuthoringDir = path.resolve(scriptDir, '..');
let workbookPayloadForSelection = null;
try {
   workbookPayloadForSelection = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch {
   workbookPayloadForSelection = null;
}
let versionBundleSelection;
try {
   versionBundleSelection = fs.existsSync(path.join(workbookAuthoringDir, 'compatibility-profiles.json'))
      ? resolveCompatibilityProfile(workbookAuthoringDir, {
         explicitCompatibilityTarget: requestedCompatibilityTargetRaw,
         legacyReleaseTarget: requestedTargetVersion,
         existingWorkbookProjectVersion: extractWorkbookProjectVersion(workbookPayloadForSelection),
         serverProjectVersion: serverProjectVersionRaw,
         oacMcpConnected: oacMcpConnectedOverride === true || saveAvailableForDefaultVersion,
         saveAvailable: saveAvailableForDefaultVersion,
         allowSourceCurrentProfile: true
      })
      : resolveVersionBundleSelection(workbookAuthoringDir, requestedTargetVersion, {
         detectedTargetVersion: null,
         saveAvailableForDefaultVersion,
         preferFallbackVersionFromValidationError: false
      });
} catch (error) {
   fail(error?.message || String(error));
}
const contractsDir = path.join(versionBundleSelection.selectedBundleRootDir, 'model');
const schemaRegistryProfilePath = getArg('--schema-registry-profile') ||
   process.env.WORKBOOK_AUTHORING_SCHEMA_REGISTRY_PROFILE ||
   path.join(contractsDir, 'validation', 'schema-registry-profile.json');
const schemaDirPath = getArg('--schema-dir') ||
   process.env.WORKBOOK_AUTHORING_SCHEMA_DIR ||
   path.join(versionBundleSelection.selectedBundleRootDir, 'schemas');
const vizResolutionProfilesPath = getArg('--viz-resolution-profiles') ||
   process.env.WORKBOOK_AUTHORING_VIZ_RESOLUTION_PROFILES ||
   path.join(contractsDir, 'viz-resolution-profiles.v1.json');
const runtimeProfileContracts = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'runtime-profile-contracts.v1.json'), 'utf8')
);
const supportWindowContracts = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'support-window.v1.json'), 'utf8')
);
const semanticRules = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'semantic-validation-rules.v1.json'), 'utf8')
);
const pluginTypeAliases = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'plugin-type-aliases.v1.json'), 'utf8')
);
let vizResolutionProfiles;
try {
   vizResolutionProfiles = JSON.parse(fs.readFileSync(vizResolutionProfilesPath, 'utf8'));
} catch (error) {
   fail(
      `MISSING_VIZ_RESOLUTION_PROFILES: Unable to read '${vizResolutionProfilesPath}'. ` +
      'Run workbook authoring packaging generation to materialize viz-resolution-profiles.v1.json or pass --viz-resolution-profiles <file>.'
   );
}
const calculationContracts = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'calculation-contracts.v1.json'), 'utf8')
);
const editOperationContracts = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'edit-operation-contracts.v1.json'), 'utf8')
);
const filterProfilingContracts = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'filter-profiling-contracts.v1.json'), 'utf8')
);
const mapNetworkAllowlists = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'map-network-allowlists.v1.json'), 'utf8')
);
const runtimePathRegistry = loadRuntimePathRegistry({
   registryPath: path.join(contractsDir, 'runtime-path-registry.v1.json'),
   targetVersion: versionBundleSelection.selectedTargetVersion
});
const textboxRuntimePathSignalResolution = resolveRuntimePathSignal(runtimePathRegistry, RUNTIME_PATH_SIGNAL_TEXTBOX);
const textboxRuntimePathSignal = textboxRuntimePathSignalResolution.signal;
const versionFieldCatalog = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'version-field-catalog.json'), 'utf8')
);
const viewConfigDefaultVersion = resolveVersionNodeDefault(versionFieldCatalog, 'viewConfig');

let schemaRegistryProfile;
try {
   schemaRegistryProfile = JSON.parse(fs.readFileSync(schemaRegistryProfilePath, 'utf8'));
} catch (error) {
   fail(
      `MISSING_SCHEMA_REGISTRY_PROFILE: Unable to read '${schemaRegistryProfilePath}'. ` +
      'Provide --schema-registry-profile <file> or ensure packaged model/validation/schema-registry-profile.json exists.'
   );
}
const pluginTypeAliasByPluginType = new Map(
   ((pluginTypeAliases && Array.isArray(pluginTypeAliases.aliases)) ? pluginTypeAliases.aliases : [])
      .filter((entry) => entry && typeof entry.pluginType === 'string')
      .map((entry) => [entry.pluginType, entry])
);
const vizResolutionProfileByPluginType = new Map(
   ((vizResolutionProfiles && Array.isArray(vizResolutionProfiles.profiles)) ? vizResolutionProfiles.profiles : [])
      .filter((entry) => entry && typeof entry.pluginType === 'string')
      .map((entry) => [entry.pluginType, entry])
);
const semanticCheckDefinitionById = (() => {
   const byID = new Map();
   const familyChecks = semanticRules?.pluginFamilyChecks || {};
   for (const checks of Object.values(familyChecks)) {
      if (!Array.isArray(checks)) {
         continue;
      }
      for (const check of checks) {
         if (!check || typeof check.id !== 'string' || check.id.trim() === '') {
            continue;
         }
         if (!byID.has(check.id)) {
            byID.set(check.id, check);
         }
      }
   }
   return byID;
})();

function resolvePluginChecks(pluginType, familyName) {
   const fallbackChecks = semanticRules?.pluginFamilyChecks?.[familyName];
   const fallback = Array.isArray(fallbackChecks) ? fallbackChecks : [];
   const pluginTypeChecks = semanticRules?.pluginTypeChecks?.[pluginType];
   if (!Array.isArray(pluginTypeChecks) || pluginTypeChecks.length === 0) {
      return fallback;
   }

   const resolved = [];
   for (const checkID of pluginTypeChecks) {
      if (typeof checkID !== 'string' || checkID.trim() === '') {
         continue;
      }
      const check = semanticCheckDefinitionById.get(checkID);
      if (check) {
         resolved.push(check);
      } else {
         resolved.push({
            id: checkID,
            severity: 'error',
            rule: `check definition for '${checkID}' must exist in pluginFamilyChecks`,
            fixHint: `Define '${checkID}' in semantic-validation-rules.v1.json pluginFamilyChecks.`
         });
      }
   }
   return resolved.length > 0 ? resolved : fallback;
}
const calculationTypeContracts = calculationContracts?.columnPropertyMapContract?.typeContracts || {};
const supportedCalcTypes = new Set(Array.isArray(calculationContracts?.supportedCalculationTypes)
   ? calculationContracts.supportedCalculationTypes
   : []);
const typedCalculationRequiredTypes = new Set(Array.isArray(calculationContracts?.columnPropertyMapContract?.typedCalculationRequiredTypes)
   ? calculationContracts.columnPropertyMapContract.typedCalculationRequiredTypes
   : ['TEXT_GROUP', 'TIME_SERIES']);
const calcIdPrefixByType = calculationContracts?.idGenerationRules || {};
const PARAMETERS_SCHEMA_VERSION = '1.0.5';
const FILTER_PARAMETER_BINDING_KEYS = [
   'listParameterBinding',
   'startParameterBinding',
   'endParameterBinding',
   'countParameterBinding',
   'incrementParameterBinding',
   'timeLevelParameterBinding'
];
const DATA_ACTION_NAMESPACE_ABSTRACT = 'obitech-report/dataaction.AbstractDataAction';
const DATA_ACTION_NAMESPACE_HTTP = 'obitech-report/dataaction.AbstractHTTPDataAction';
const DATA_ACTION_NAMESPACE_BI_NAV = 'obitech-report/dataaction.BINavigationDataAction';
const DATA_ACTION_VALUE_PASSING_MODES = new Set(['all', 'anchorTo', 'none', 'custom', 'column', 'values']);
const DATA_ACTION_PARAMETER_PASSING_MODES = new Set(['all', 'none', 'custom']);
const DATA_ACTION_BIP_PARAMETER_MAPPING_TYPES = new Set(['default', 'custom']);
const PROHIBITED_URL_ACTION_SCHEMES = new Set(['data', 'file', 'javascript', 'vbscript']);
const NUMBER_FORMAT_ALLOWED_ABBREVIATION_SCALES = new Set(['off', 'on', 'thousand', 'million', 'billion', 'trillion']);
const NUMBER_FORMAT_ALLOWED_NEGATIVE_VALUE_STYLES = new Set(['default', 'accounting', 'red', 'red_accounting']);
const SCATTER_X_TAG = 'obitech-scatterchart#x';
const SCATTER_Y_TAG = 'obitech-scatterchart#y';
const EMBEDDED_VIZ_DUMMY_MEASURE_LINK_COLUMN_ID = '__EmbeddedVizDummyMeasureLink__';
const COLOR_CATEGORICAL_MEASURE_DOMAIN_KEY = '["obitech.colorcategory.value","categoricalSchemes","[]"]';
const COLOR_SEQUENTIAL_MEASURE_DOMAIN_KEY = '["obitech.colorcategory.range","sequentialSchemes","[]"]';
const SHAPE_CATEGORICAL_DOMAIN_KEY = '["obitech.category.value","categoricalSchemes","[]"]';

function parseSchemaArrayFromAmdFile(filePath) {
   const schemaText = fs.readFileSync(filePath, 'utf8');
   const schemaArrayMatcher = schemaText.match(/const\s+aSchemas\s*=\s*(\[[\s\S]*?\])\s*;/);
   if (!schemaArrayMatcher || !schemaArrayMatcher[1]) {
      fail(`INVALID_SCHEMA_FILE: Unable to parse schema array from '${filePath}'.`);
   }
   let parsed;
   try {
      parsed = JSON.parse(schemaArrayMatcher[1]);
   } catch (error) {
      fail(`INVALID_SCHEMA_FILE: Failed to parse schema JSON array from '${filePath}': ${error && error.message ? error.message : String(error)}`);
   }
   if (!Array.isArray(parsed)) {
      fail(`INVALID_SCHEMA_FILE: Parsed schema payload from '${filePath}' is not an array.`);
   }
   return parsed;
}

function collectSchemaFileNamesFromProfile(profile) {
   const fileNames = new Set();
   const profiles = (profile && typeof profile === 'object' && profile.profiles && typeof profile.profiles === 'object')
      ? profile.profiles
      : {};
   for (const profilePayload of Object.values(profiles)) {
      const schemaFiles = Array.isArray(profilePayload?.schemaFiles) ? profilePayload.schemaFiles : [];
      for (const schemaFileName of schemaFiles) {
         if (typeof schemaFileName === 'string' && schemaFileName.trim() !== '') {
            fileNames.add(schemaFileName);
         }
      }
   }
   return Array.from(fileNames);
}

function loadSchemaIndex(schemaDirectory, profile) {
   const profileSchemaFiles = collectSchemaFileNamesFromProfile(profile);
   if (!fs.existsSync(schemaDirectory) || !fs.statSync(schemaDirectory).isDirectory()) {
      fail(`MISSING_SCHEMA_DIRECTORY: Schema directory '${schemaDirectory}' does not exist.`);
   }
   const discoveredSchemaFiles = fs.readdirSync(schemaDirectory)
      .filter((entry) => typeof entry === 'string' && entry.endsWith('.js'))
      .filter((entry) => {
         const filePath = path.join(schemaDirectory, entry);
         try {
            return fs.readFileSync(filePath, 'utf8').includes('const aSchemas');
         } catch (_error) {
            return false;
         }
      });
   const schemaFileNames = Array.from(new Set([...profileSchemaFiles, ...discoveredSchemaFiles]));
   if (schemaFileNames.length === 0) {
      fail('INVALID_SCHEMA_REGISTRY_PROFILE: No schemaFiles were found across schema registry profiles.');
   }
   const missingProfileSchemaFiles = profileSchemaFiles.filter((fileName) => {
      const filePath = path.join(schemaDirectory, fileName);
      return !fs.existsSync(filePath);
   });
   if (missingProfileSchemaFiles.length > 0) {
      process.stderr.write(
         `WARNING: Schema registry profile references missing schema files that are not present in '${schemaDirectory}'. ` +
         `Ignoring missing entries: ${missingProfileSchemaFiles.sort().join(', ')}.\n`
      );
   }
   const byID = new Map();
   for (const fileName of schemaFileNames) {
      const filePath = path.join(schemaDirectory, fileName);
      if (!fs.existsSync(filePath)) {
         continue;
      }
      const schemaArray = parseSchemaArrayFromAmdFile(filePath);
      for (const schemaEntry of schemaArray) {
         if (!schemaEntry || typeof schemaEntry !== 'object' || Array.isArray(schemaEntry)) {
            continue;
         }
         const schemaID = schemaEntry.$id;
         if (typeof schemaID !== 'string' || schemaID.trim() === '') {
            continue;
         }
         if (!byID.has(schemaID)) {
            byID.set(schemaID, schemaEntry);
         }
      }
   }
   if (byID.size === 0) {
      fail(
         `INVALID_SCHEMA_REGISTRY_PROFILE: No loadable schemas were found in '${schemaDirectory}'. ` +
         'Ensure packaged schema files are present and parseable.'
      );
   }
   return byID;
}

const schemaByID = loadSchemaIndex(schemaDirPath, schemaRegistryProfile);

function writeJson(file, value) {
   fs.writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`, 'utf8');
}

function failInputArtifactNotReady(file, reason) {
   fail(`INPUT_ARTIFACT_NOT_READY: Input artifact '${file}' is not ready (${reason}). Generation may still be in progress. Run generation and validation check sequentially.`);
}

function loadWorkbookInput(file) {
   let stats;
   try {
      stats = fs.statSync(file);
   } catch (error) {
      if (error && error.code === 'ENOENT') {
         failInputArtifactNotReady(file, 'file does not exist');
      }
      fail(`INPUT_READ_ERROR: Unable to read '${file}': ${error && error.message ? error.message : String(error)}`);
   }

   if (!stats.isFile()) {
      failInputArtifactNotReady(file, 'path is not a file');
   }
   if (stats.size === 0) {
      failInputArtifactNotReady(file, 'file is empty');
   }

   let raw;
   try {
      raw = fs.readFileSync(file, 'utf8');
   } catch (error) {
      if (error && error.code === 'ENOENT') {
         failInputArtifactNotReady(file, 'file disappeared before read');
      }
      fail(`INPUT_READ_ERROR: Unable to read '${file}': ${error && error.message ? error.message : String(error)}`);
   }

   if (raw.trim() === '') {
      failInputArtifactNotReady(file, 'file has no JSON content');
   }

   try {
      return JSON.parse(raw);
   } catch (error) {
      if (error instanceof SyntaxError && /Unexpected end of JSON input/i.test(error.message || '')) {
         failInputArtifactNotReady(file, 'JSON is incomplete');
      }
      fail(`INVALID_WORKBOOK_JSON: Failed to parse '${file}': ${error && error.message ? error.message : String(error)}`);
   }
}

function deepClone(value) {
   return JSON.parse(JSON.stringify(value));
}

function getByJsonPointer(obj, pointer) {
   if (pointer === '' || pointer === '/') {
      return obj;
   }
   const parts = pointer
      .split('/')
      .slice(1)
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
   let current = obj;
   for (const part of parts) {
      if (current == null || typeof current !== 'object' || !(part in current)) {
         return undefined;
      }
      current = current[part];
   }
   return current;
}

function setByJsonPointer(obj, pointer, value) {
   const parts = pointer
      .split('/')
      .slice(1)
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
   let current = obj;
   for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      if (current[key] == null || typeof current[key] !== 'object') {
         current[key] = {};
      }
      current = current[key];
   }
   current[parts[parts.length - 1]] = value;
}

function ensureArrayPath(obj, pointer) {
   const value = getByJsonPointer(obj, pointer);
   if (Array.isArray(value)) {
      return value;
   }
   setByJsonPointer(obj, pointer, []);
   return getByJsonPointer(obj, pointer);
}

function findRuntimeProfile(projectVersion) {
   const profiles = runtimeProfileContracts.projectVersionProfiles || [];
   for (const profile of profiles) {
      const range = profile.projectVersionRange || {};
      if (projectVersion >= range.min && projectVersion <= range.max) {
         return profile;
      }
   }
   return profiles[0] || null;
}

function getSchemaCapabilities(profile, familyName) {
   return (profile?.schemaCapabilities && profile.schemaCapabilities[familyName]) || {};
}

function findPluginFamily(pluginType) {
   const families = runtimeProfileContracts.pluginFamilies || {};
   for (const [family, payload] of Object.entries(families)) {
      if ((payload.pluginTypes || []).includes(pluginType)) {
         return { family, payload };
      }
   }
   return null;
}

function resolvePluginFamily(pluginType) {
   const families = runtimeProfileContracts.pluginFamilies || {};
   const resolutionProfile = vizResolutionProfileByPluginType.get(pluginType);
   if (
      resolutionProfile &&
      typeof resolutionProfile.runtimeContractFamily === 'string' &&
      Object.prototype.hasOwnProperty.call(families, resolutionProfile.runtimeContractFamily)
   ) {
      return {
         family: resolutionProfile.runtimeContractFamily,
         payload: families[resolutionProfile.runtimeContractFamily],
         aliasEntry: pluginTypeAliasByPluginType.get(pluginType) || null,
         resolutionProfile,
         source: 'viz-resolution-profiles'
      };
   }
   const aliasEntry = pluginTypeAliasByPluginType.get(pluginType);
   if (
      aliasEntry &&
      typeof aliasEntry.runtimeContractFamily === 'string' &&
      Object.prototype.hasOwnProperty.call(families, aliasEntry.runtimeContractFamily)
   ) {
      return {
         family: aliasEntry.runtimeContractFamily,
         payload: families[aliasEntry.runtimeContractFamily],
         aliasEntry,
         resolutionProfile: null,
         source: 'plugin-type-aliases'
      };
   }
   const fallback = findPluginFamily(pluginType);
   if (fallback) {
      return {
         ...fallback,
         aliasEntry: null,
         resolutionProfile: null,
         source: 'runtime-profile-contracts'
      };
   }
   return null;
}

function resolvePublicExecutionContext(projectVersion) {
   const tracksRaw = supportWindowContracts && typeof supportWindowContracts === 'object'
      ? supportWindowContracts.tracks
      : null;
   const tracks = tracksRaw && typeof tracksRaw === 'object'
      ? Object.entries(tracksRaw)
         .filter(([, payload]) => payload && typeof payload === 'object')
         .map(([trackId, payload]) => ({
            trackId,
            displayVersion: typeof payload.displayVersion === 'string' ? payload.displayVersion : null,
            projectVersion: Number.isFinite(payload.projectVersion) ? Number(payload.projectVersion) : null
         }))
      : [];

   const defaultTrack = typeof supportWindowContracts?.defaultTrack === 'string'
      ? supportWindowContracts.defaultTrack
      : null;

   const matchedTrack = tracks.find((entry) => entry.projectVersion === projectVersion) || null;
   const defaultTrackEntry = defaultTrack
      ? (tracks.find((entry) => entry.trackId === defaultTrack) || null)
      : null;
   let selectedTrack = matchedTrack;
   let derivedVersionSelectionReason = 'project_version_matches_supported_target';

   if (!selectedTrack) {
      if (defaultTrackEntry) {
         selectedTrack = defaultTrackEntry;
         derivedVersionSelectionReason = 'project_version_not_in_support_window_fallback_default_target';
      } else {
         selectedTrack = tracks[0] || null;
         derivedVersionSelectionReason = 'project_version_not_in_support_window_fallback_first_supported_target';
      }
   }

   if (!selectedTrack) {
      fail('UNRESOLVED_TARGET_VERSION: support-window.v1.json does not define any usable track entries.');
   }

   if (!versionBundleSelection.legacyLayout) {
      const selectedBundleVersion = versionBundleSelection.selectedTargetVersion;
      const selectedBundleTrack = tracks.find((entry) => entry.displayVersion === selectedBundleVersion) || null;
      if (!selectedBundleTrack) {
         fail(
            `UNRESOLVED_TARGET_VERSION: Installed version bundle '${selectedBundleVersion}' is missing a matching track in support-window.v1.json.`
         );
      }
      selectedTrack = selectedBundleTrack;
      derivedVersionSelectionReason = versionBundleSelection.explicitTargetRequested
         ? 'user_requested_newer'
         : (versionBundleSelection.implicitSelectionReason || 'default_policy');
   } else if (requestedTargetVersion != null) {
      const explicitTrack = tracks.find((entry) => entry.displayVersion === requestedTargetVersion) || null;
      if (!explicitTrack) {
         fail(
            `UNRESOLVED_TARGET_VERSION: targetVersion '${requestedTargetVersion}' is not available in this bundle. ` +
            `Supported versions: ${tracks.map((entry) => entry.displayVersion).filter(Boolean).join(', ')}.`
         );
      }
      selectedTrack = explicitTrack;
      derivedVersionSelectionReason = 'user_requested_newer';
   }

   const missingCapabilityInputs = [];
   if (typeof discoveryMethodOverride !== 'string' || discoveryMethodOverride.trim() === '') {
      missingCapabilityInputs.push('--discovery-method');
   }
   if (saveAvailableOverride === null) {
      missingCapabilityInputs.push('--save-available');
   }
   if (exportAvailableOverride === null) {
      missingCapabilityInputs.push('--export-available');
   }
   if (missingCapabilityInputs.length > 0) {
      fail(
         'MISSING_EXECUTION_CAPABILITY_INPUT: runtime-validation-check requires explicit runtime capability inputs from tool detection. ' +
         `Missing ${missingCapabilityInputs.join(', ')}. ` +
         'Provide --discovery-method <search_catalog|discover_data> --save-available <true|false> --export-available <true|false>.'
      );
   }

   const exportRequested = exportRequestedOverride === null ? false : exportRequestedOverride;

   return {
      targetVersion: selectedTrack?.displayVersion || null,
      compatibilityTarget: versionBundleSelection.selectedCompatibilityTarget || selectedTrack?.displayVersion || null,
      availableTargetVersions: versionBundleSelection.availableTargetVersions,
      executionMode: authoringMode,
      reasonForVersionSelection: versionSelectionReasonOverride || derivedVersionSelectionReason,
      discoveryMethod: discoveryMethodOverride,
      saveAvailable: saveAvailableOverride,
      exportAvailable: exportAvailableOverride,
      exportRequested,
      capabilitySource: 'runtime_tool_detection',
      saveToolDetected: saveAvailableOverride,
      exportToolDetected: exportAvailableOverride
   };
}

function getPluginViews(workbook) {
   const views = (workbook.views && workbook.views.children) || [];
   const pluginViews = [];
   for (let index = 0; index < views.length; index += 1) {
      const view = views[index];
      if (
         view &&
         view.type === 'saw:pluginView'
      ) {
         pluginViews.push({
            view,
            index,
            path: `/views/children/${index}`
         });
      }
   }
   return pluginViews;
}

function getPluginViewsByFamily(workbook, familyName) {
   return getPluginViews(workbook).filter((entry) => resolvePluginFamily(entry.view?.pluginType)?.family === familyName);
}

function inferColumnClassFromID(columnID) {
   if (typeof columnID !== 'string') {
      return 'unknown';
   }
   if (columnID.startsWith('dim_')) {
      return 'dimension';
   }
   if (columnID.startsWith('mea_')) {
      return 'measure';
   }
   if (columnID.startsWith('time_')) {
      return 'temporal';
   }
   return 'unknown';
}

function normalizeColumnID(columnID) {
   return typeof columnID === 'string' ? columnID.trim() : '';
}

function toNonEmptyTrimmedString(value) {
   if (typeof value !== 'string') {
      return null;
   }
   const trimmed = value.trim();
   return trimmed === '' ? null : trimmed;
}

function getProhibitedUrlActionScheme(value) {
   if (typeof value !== 'string') {
      return null;
   }
   const normalized = value.replace(/[\u0000-\u0020\u007f]/g, '');
   const match = normalized.match(/^([a-z][a-z0-9+.-]*):/i);
   if (!match) {
      return null;
   }
   const scheme = match[1].toLowerCase();
   return PROHIBITED_URL_ACTION_SCHEMES.has(scheme) ? scheme : null;
}

function toJsonPointer(pathSegments) {
   if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
      return '/';
   }
   return `/${pathSegments.map((segment) => String(segment)
      .replaceAll('~', '~0')
      .replaceAll('/', '~1')).join('/')}`;
}

function getCriteriaColumnByID(workbook, columnID) {
   const normalized = normalizeColumnID(columnID);
   if (!normalized) {
      return null;
   }
   const criteriaColumns = getCriteriaColumns(workbook);
   return criteriaColumns.find((column) => normalizeColumnID(column?.columnID) === normalized) || null;
}

function getCriteriaColumnExpressionText(column) {
   const expression = column?.columnFormula?.expr?.expression;
   return typeof expression === 'string' ? expression : '';
}

const GEO_COMPATIBILITY_TOKENS = [
   'geo',
   'geograph',
   'latitude',
   'longitude',
   'lat',
   'lon',
   'country',
   'state',
   'city',
   'county',
   'province',
   'postal',
   'zip',
   'address',
   'region'
];

function isGeographyCompatibleColumn(column) {
   if (!isPlainObject(column)) {
      return false;
   }
   const haystack = `${normalizeColumnID(column.columnID)} ${getCriteriaColumnExpressionText(column)}`.toLowerCase();
   if (!haystack) {
      return false;
   }
   return GEO_COMPATIBILITY_TOKENS.some((token) => haystack.includes(token));
}

function isGeographyCompatibleColumnID(workbook, columnID) {
   const column = getCriteriaColumnByID(workbook, columnID);
   return isGeographyCompatibleColumn(column);
}

function getLogicalEdgeColumnIDs(logicalEdges, edgeKey) {
   const layers = logicalEdges?.[edgeKey]?.logicalEdgeLayers;
   if (!Array.isArray(layers)) {
      return [];
   }
   const ids = [];
   for (const layer of layers) {
      if (layer?.type !== 'column') {
         continue;
      }
      const columnID = normalizeColumnID(layer?.columnID);
      if (!columnID) {
         continue;
      }
      if (!ids.includes(columnID)) {
         ids.push(columnID);
      }
   }
   return ids;
}

function getMeasureColumnIDsFromCriteria(workbook) {
   const criteriaColumns = getCriteriaColumns(workbook);
   const measureIDs = [];
   for (const column of criteriaColumns) {
      const columnID = normalizeColumnID(column?.columnID);
      if (!columnID) {
         continue;
      }
      if (inferColumnClassFromID(columnID) !== 'measure') {
         continue;
      }
      if (!measureIDs.includes(columnID)) {
         measureIDs.push(columnID);
      }
   }
   return measureIDs;
}

function getDimensionTemporalColumnIDs(workbook) {
   const criteriaColumns = getCriteriaColumns(workbook);
   const ids = [];
   for (const column of criteriaColumns) {
      const columnID = normalizeColumnID(column?.columnID);
      if (!columnID) {
         continue;
      }
      const columnClass = inferColumnClassFromID(columnID);
      if (columnClass !== 'dimension' && columnClass !== 'temporal') {
         continue;
      }
      if (!ids.includes(columnID)) {
         ids.push(columnID);
      }
   }
   return ids;
}

function getPreferredMeasureColumnID(workbook, logicalEdges = null) {
   const logicalMeasureIDs = getLogicalEdgeColumnIDs(logicalEdges, 'measures');
   if (logicalMeasureIDs.length > 0) {
      return logicalMeasureIDs[0];
   }
   const criteriaMeasureIDs = getMeasureColumnIDsFromCriteria(workbook);
   return criteriaMeasureIDs.length > 0 ? criteriaMeasureIDs[0] : null;
}

function getPreferredMapDetailColumnID(workbook, logicalEdges = null) {
   const detailIDs = getLogicalEdgeColumnIDs(logicalEdges, 'detail');
   const geoDetail = detailIDs.find((columnID) => isGeographyCompatibleColumnID(workbook, columnID));
   if (geoDetail) {
      return geoDetail;
   }

   const criteriaColumns = getCriteriaColumns(workbook);
   const geoColumn = criteriaColumns.find((column) => {
      const columnID = normalizeColumnID(column?.columnID);
      const columnClass = inferColumnClassFromID(columnID);
      return (columnClass === 'dimension' || columnClass === 'temporal') && isGeographyCompatibleColumn(column);
   });
   const geoColumnID = normalizeColumnID(geoColumn?.columnID);
   if (geoColumnID) {
      return geoColumnID;
   }

   if (detailIDs.length > 0) {
      return detailIDs[0];
   }

   const fallbackIDs = getDimensionTemporalColumnIDs(workbook);
   return fallbackIDs.length > 0 ? fallbackIDs[0] : null;
}

function getPreferredNetworkDetailColumnIDs(workbook, logicalEdges = null, requiredCount = 2) {
   const required = Number.isInteger(requiredCount) && requiredCount > 0 ? requiredCount : 2;
   const selected = [];
   for (const columnID of getLogicalEdgeColumnIDs(logicalEdges, 'detail')) {
      if (!selected.includes(columnID)) {
         selected.push(columnID);
      }
      if (selected.length >= required) {
         return selected;
      }
   }
   for (const columnID of getDimensionTemporalColumnIDs(workbook)) {
      if (!selected.includes(columnID)) {
         selected.push(columnID);
      }
      if (selected.length >= required) {
         return selected;
      }
   }
   return selected;
}

function getExecutionPluginViews(pluginView) {
   const executionViews = [];
   if (isPlainObject(pluginView) && pluginView.type === 'saw:pluginView') {
      executionViews.push({
         scope: 'primary',
         view: pluginView
      });
   }
   const nestedChildren = pluginView?.nestedViews?.children;
   if (!Array.isArray(nestedChildren)) {
      return executionViews;
   }
   nestedChildren.forEach((entry, index) => {
      const nestedView = entry?.view;
      if (isPlainObject(nestedView) && nestedView.type === 'saw:pluginView') {
         executionViews.push({
            scope: `nested_${index}`,
            view: nestedView
         });
      }
   });
   return executionViews;
}

function getColumnBoundEdgeLayerIDs(pluginView, axis) {
   const edge = getEdgeByAxis(pluginView, axis);
   const layers = getEdgeLayers(edge);
   if (!Array.isArray(layers)) {
      return [];
   }
   const columnIDs = [];
   for (const layer of layers) {
      if (layer?.type !== 'column') {
         continue;
      }
      const columnID = normalizeColumnID(layer?.columnID);
      if (!columnID) {
         continue;
      }
      if (!columnIDs.includes(columnID)) {
         columnIDs.push(columnID);
      }
   }
   return columnIDs;
}

function getFilterControls(workbook) {
   const collections = workbook?.filterControlCollections?.children;
   if (!Array.isArray(collections)) {
      return [];
   }
   const controls = [];
   for (let collectionIndex = 0; collectionIndex < collections.length; collectionIndex += 1) {
      const collection = collections[collectionIndex];
      const collectionName = typeof collection?.name === 'string' ? collection.name : null;
      const filterControls = collection?.filterControls?.children;
      if (!Array.isArray(filterControls)) {
         continue;
      }
      for (let controlIndex = 0; controlIndex < filterControls.length; controlIndex += 1) {
         const control = filterControls[controlIndex];
         if (!isPlainObject(control)) {
            continue;
         }
         const columnID = typeof control?.columnID === 'string' ? control.columnID : null;
         const location = control?.filterControlConfig?.settings?.location;
         const filterMode = typeof location === 'string' ? location : null;
         const filterID = typeof control?.filterID === 'string' ? control.filterID : `fc_${collectionIndex}_${controlIndex}`;
         const operator = typeof control?.filterOperator?.op === 'string'
            ? control.filterOperator.op
            : null;
         controls.push({
            filterID,
            type: typeof control?.type === 'string' ? control.type : null,
            columnID,
            parameter: typeof control?.parameter === 'string' ? control.parameter : null,
            expression: typeof control?.expr?.expression === 'string' ? control.expr.expression : null,
            filterControlDefaultValues: isPlainObject(control?.filterControlDefaultValues)
               ? control.filterControlDefaultValues
               : null,
            columnClass: inferColumnClassFromID(columnID),
            collectionName,
            location: filterMode,
            filterViz: typeof control?.filterControlConfig?.settings?.filterViz === 'string'
               ? control.filterControlConfig.settings.filterViz
               : null,
            operator,
            path: `/filterControlCollections/children/${collectionIndex}/filterControls/children/${controlIndex}`
         });
      }
   }
   return controls;
}

function getWorkbookParameterSettings(workbook) {
   return Array.isArray(workbook?.parameters?.settings) ? workbook.parameters.settings : [];
}

function getWorkbookParameterSettingsByName(workbook) {
   const byName = new Map();
   for (const [index, parameter] of getWorkbookParameterSettings(workbook).entries()) {
      const name = toNonEmptyTrimmedString(parameter?.name);
      if (!name) {
         continue;
      }
      byName.set(name, {
         parameter,
         index
      });
   }
   return byName;
}

function getFilterParameterBindings(workbook) {
   const bindings = [];
   for (const control of getFilterControls(workbook)) {
      const defaults = control.filterControlDefaultValues;
      if (!isPlainObject(defaults)) {
         continue;
      }
      for (const bindingKey of FILTER_PARAMETER_BINDING_KEYS) {
         const parameterName = toNonEmptyTrimmedString(defaults[bindingKey]);
         if (!parameterName) {
            continue;
         }
         bindings.push({
            parameterName,
            bindingKey,
            filterID: control.filterID,
            controlType: normalizeFilterControlType(control.type),
            path: `${control.path}/filterControlDefaultValues/${bindingKey}`
         });
      }
   }
   return bindings;
}

function buildDefaultFilterParameterSetting(parameterName) {
   return {
      name: parameterName,
      description: '',
      dataType: 'text',
      isMultiValue: true,
      isLocked: false,
      isAliasEnabled: false,
      enforceValidation: false,
      initialValue: {
         type: 'value'
      },
      possibleValue: {
         type: 'any'
      }
   };
}

function ensureFilterParameterBindingDefinitions(workbook) {
   const bindings = getFilterParameterBindings(workbook);
   if (bindings.length === 0) {
      return;
   }
   if (!isPlainObject(workbook.parameters)) {
      workbook.parameters = {};
   }
   workbook.parameters._version = PARAMETERS_SCHEMA_VERSION;
   if (!Array.isArray(workbook.parameters.settings)) {
      workbook.parameters.settings = [];
   }
   const existing = getWorkbookParameterSettingsByName(workbook);
   for (const binding of bindings) {
      if (existing.has(binding.parameterName)) {
         continue;
      }
      const parameter = buildDefaultFilterParameterSetting(binding.parameterName);
      workbook.parameters.settings.push(parameter);
      existing.set(binding.parameterName, {
         parameter,
         index: workbook.parameters.settings.length - 1
      });
   }
}

function normalizeFilterTextValue(value) {
   if (isPlainObject(value)) {
      return value;
   }
   if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return { text: String(value) };
   }
   return value;
}

function patchFilterControlChoiceValueShapes(workbook) {
   const collections = Array.isArray(workbook?.filterControlCollections?.children)
      ? workbook.filterControlCollections.children
      : [];
   for (const collection of collections) {
      const controls = Array.isArray(collection?.filterControls?.children)
         ? collection.filterControls.children
         : [];
      for (const control of controls) {
         if (!isPlainObject(control)) {
            continue;
         }
         const defaults = control.filterControlDefaultValues;
         if (isPlainObject(defaults) && Array.isArray(defaults.children)) {
            defaults.children = defaults.children.map(normalizeFilterTextValue);
         }
         const choices = control.filterControlSource?.filterControlChoices;
         const choiceChildren = Array.isArray(choices?.children) ? choices.children : [];
         for (let index = 0; index < choiceChildren.length; index += 1) {
            const choice = choiceChildren[index];
            if (isPlainObject(choice)) {
               choice.value = normalizeFilterTextValue(choice.value);
            } else if (typeof choice === 'string' || typeof choice === 'number' || typeof choice === 'boolean') {
               choiceChildren[index] = { value: { text: String(choice) } };
            }
         }
      }
   }
}

function checkFilterChoiceValueShapes(workbook, check) {
   const errors = [];
   const collections = Array.isArray(workbook?.filterControlCollections?.children)
      ? workbook.filterControlCollections.children
      : [];
   for (let collectionIndex = 0; collectionIndex < collections.length; collectionIndex += 1) {
      const controls = Array.isArray(collections[collectionIndex]?.filterControls?.children)
         ? collections[collectionIndex].filterControls.children
         : [];
      for (let controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
         const control = controls[controlIndex];
         if (!isPlainObject(control)) {
            continue;
         }
         const controlPath = `/filterControlCollections/children/${collectionIndex}/filterControls/children/${controlIndex}`;
         const defaults = control.filterControlDefaultValues;
         if (isPlainObject(defaults) && Array.isArray(defaults.children)) {
            for (let valueIndex = 0; valueIndex < defaults.children.length; valueIndex += 1) {
               if (!isPlainObject(defaults.children[valueIndex])) {
                  errors.push(
                     createError(
                        check.id,
                        'filterControlDefaultValues.children entries must be objects such as {"text":"value"}, not scalar literals.',
                        `${controlPath}/filterControlDefaultValues/children/${valueIndex}`,
                        check.fixHint
                     )
                  );
               }
            }
         }
         const choiceChildren = control.filterControlSource?.filterControlChoices?.children;
         if (Array.isArray(choiceChildren)) {
            for (let choiceIndex = 0; choiceIndex < choiceChildren.length; choiceIndex += 1) {
               const choice = choiceChildren[choiceIndex];
               if (!isPlainObject(choice)) {
                  errors.push(
                     createError(
                        check.id,
                        'filterControlChoices.children entries must be objects with object-valued value fields.',
                        `${controlPath}/filterControlSource/filterControlChoices/children/${choiceIndex}`,
                        check.fixHint
                     )
                  );
                  continue;
               }
               if (!isPlainObject(choice.value)) {
                  errors.push(
                     createError(
                        check.id,
                        'filterControlChoices.children[].value must be an object such as {"text":"value"}, not a scalar literal.',
                        `${controlPath}/filterControlSource/filterControlChoices/children/${choiceIndex}/value`,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }
   }
   return errors;
}

function normalizeFilterControlType(typeValue) {
   if (typeof typeValue !== 'string') {
      return '';
   }
   return typeValue.trim().toLowerCase();
}

function getFilterVizMapKeys(mapNode) {
   if (!isPlainObject(mapNode)) {
      return [];
   }
   return Object.keys(mapNode)
      .map((key) => normalizeColumnID(key))
      .filter((key) => key !== '')
      .sort();
}

function getFilterVizRowBindingKeys(pluginView) {
   const rowColumnKeys = new Set();
   const rowParameterKeys = new Set();
   const dataModels = Array.isArray(pluginView?.dataModels?.children)
      ? pluginView.dataModels.children
      : [];
   for (const dataModel of dataModels) {
      const rowLayers = dataModel?.logicalDataModel?.settings?.logicalDataModel?.logicalEdges?.row?.logicalEdgeLayers;
      if (!Array.isArray(rowLayers)) {
         continue;
      }
      for (const layer of rowLayers) {
         const layerType = normalizeFilterControlType(layer?.type);
         if (layerType === 'column') {
            const key = normalizeColumnID(layer?.columnID);
            if (key) {
               rowColumnKeys.add(key);
            }
            continue;
         }
         if (layerType === 'parameter') {
            const key = normalizeColumnID(layer?.name);
            if (key) {
               rowParameterKeys.add(key);
            }
         }
      }
   }
   return {
      columnKeys: Array.from(rowColumnKeys).sort(),
      parameterKeys: Array.from(rowParameterKeys).sort()
   };
}

function deriveSelectedFilterMode(filterControls) {
   if (!Array.isArray(filterControls) || filterControls.length === 0) {
      return 'none';
   }
   const uniqueLocations = new Set(
      filterControls
         .map((entry) => entry?.location)
         .filter((location) => typeof location === 'string' && location.trim() !== '')
   );
   if (uniqueLocations.size === 0) {
      return 'none';
   }
   if (uniqueLocations.size > 1) {
      return 'mixed';
   }
   const [mode] = Array.from(uniqueLocations);
   return mode || 'none';
}

function buildFilterDecisionTrace(workbook) {
   const filterControls = getFilterControls(workbook);
   const defaultOperators = filterProfilingContracts?.decisionRules?.operatorDefaults || {};
   const selectedFilterMode = deriveSelectedFilterMode(filterControls);

   const queryIntents = filterControls.map((control) => {
      const className = control.columnClass;
      const probes = Array.isArray(filterProfilingContracts?.probeTemplates?.[className])
         ? filterProfilingContracts.probeTemplates[className].map((probe) => probe?.id).filter((id) => typeof id === 'string' && id.trim() !== '')
         : [];
      return {
         columnID: control.columnID,
         columnClass: className,
         intents: probes
      };
   });

   const derivedDecisions = filterControls.map((control) => {
      const fallbackOperator = defaultOperators?.[control.columnClass];
      return {
         filterID: control.filterID,
         columnID: control.columnID,
         location: control.location || selectedFilterMode,
         operator: control.operator || (typeof fallbackOperator === 'string' ? fallbackOperator : null),
         source: control.operator ? 'workbook_filter_control' : 'profiling_contract_default'
      };
   });

   return {
      required: filterControls.length > 0,
      contractVersion: filterProfilingContracts?.contractVersion || null,
      selectedFilterMode,
      fallbackUsed: filterControls.length > 0,
      fallbackReason: filterControls.length > 0
         ? 'profiling trace not provided by orchestration; using structural fallback trace'
         : null,
      queryIntents,
      probeResults: [],
      derivedDecisions,
      traceSource: 'runtime_inferred'
   };
}

function buildModifyTrace(modifyContext) {
   return {
      required: modifyContext.authoringMode === 'modify_existing',
      requestedOperation: modifyContext.requestedOperation || null,
      resolvedWorkbookTarget: {
         id: modifyContext.resolvedWorkbookTarget.id || null,
         name: modifyContext.resolvedWorkbookTarget.name || null,
         path: modifyContext.resolvedWorkbookTarget.path || null
      },
      sourceMode: modifyContext.sourceMode || null,
      confirmationState: modifyContext.confirmationState || null,
      mutationsApplied: [],
      pathsChanged: [],
      fallbackUsed: false,
      fallbackReason: null,
      saveNameOverride: null,
      traceSource: modifyContext.authoringMode === 'modify_existing' ? 'runtime_inferred' : 'not_required'
   };
}

function getPrimaryDataModel(pluginView) {
   return pluginView?.dataModels?.children?.[0] || null;
}

function getLogicalEdges(pluginView) {
   return getPrimaryDataModel(pluginView)?.logicalDataModel?.settings?.logicalDataModel?.logicalEdges || {};
}

function getViewConfigSettings(pluginView) {
   return pluginView?.viewConfig?.settings || {};
}

function getMapViewConfig(pluginView) {
   const settings = getViewConfigSettings(pluginView);
   const chartSettings = settings?.['viz:chart'];
   if (!isPlainObject(chartSettings)) {
      return null;
   }
   const mapSettings = chartSettings?.[mapNetworkAllowlists?.map?.viewConfigNamespaces?.map || 'viz_map'];
   return isPlainObject(mapSettings) ? mapSettings : null;
}

function getDataLayersInfo(pluginView) {
   return getPrimaryDataModel(pluginView)?.logicalDataModel?.settings?.logicalDataModel?.dataLayersInfo || null;
}

function hasUsableDataLayersInfo(pluginView) {
   const dataLayersInfo = getDataLayersInfo(pluginView);
   if (!isPlainObject(dataLayersInfo)) {
      return false;
   }
   const activeDataLayer = typeof dataLayersInfo.activeDataLayer === 'string'
      ? dataLayersInfo.activeDataLayer.trim()
      : '';
   const dataLayers = isPlainObject(dataLayersInfo.dataLayers) ? dataLayersInfo.dataLayers : null;
   if (!activeDataLayer || !dataLayers || Object.keys(dataLayers).length === 0) {
      return false;
   }
   const activeLayerPayload = dataLayers[activeDataLayer];
   return isPlainObject(activeLayerPayload);
}

function getMapRenderType(pluginView) {
   const dataLayersInfo = getDataLayersInfo(pluginView);
   const dataLayers = isPlainObject(dataLayersInfo?.dataLayers) ? dataLayersInfo.dataLayers : null;
   if (dataLayers) {
      for (const layerConfig of Object.values(dataLayers)) {
         const renderType = layerConfig?.namespacedConfig?.viz_map?.layerRenderType;
         if (typeof renderType === 'string' && renderType.trim() !== '') {
            return renderType.trim();
         }
      }
   }
   const mapSettings = getMapViewConfig(pluginView);
   const fallbackRenderType = mapSettings?.layerRenderType;
   if (typeof fallbackRenderType === 'string' && fallbackRenderType.trim() !== '') {
      return fallbackRenderType.trim();
   }
   return null;
}

function getEdgeByAxis(pluginView, axis) {
   const edges = getPrimaryDataModel(pluginView)?.edges?.children || [];
   return edges.find((edge) => edge?.axis === axis) || null;
}

function getEdgeLayers(edge) {
   return edge?.edgeLayers?.children || [];
}

function collectColumnIDs(node, out = new Set()) {
   if (Array.isArray(node)) {
      for (const entry of node) {
         collectColumnIDs(entry, out);
      }
      return out;
   }
   if (node && typeof node === 'object') {
      if (typeof node.columnID === 'string' && node.columnID) {
         out.add(node.columnID);
      }
      for (const value of Object.values(node)) {
         collectColumnIDs(value, out);
      }
   }
   return out;
}

function collectStringValues(node, pathParts = [], out = []) {
   if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index += 1) {
         collectStringValues(node[index], pathParts.concat(String(index)), out);
      }
      return out;
   }
   if (isPlainObject(node)) {
      for (const [key, value] of Object.entries(node)) {
         collectStringValues(value, pathParts.concat(key), out);
      }
      return out;
   }
   if (typeof node === 'string') {
      out.push({
         value: node,
         path: toJsonPointer(pathParts)
      });
   }
   return out;
}

function normalizeDataActionColumnID(columnPayload) {
   return toNonEmptyTrimmedString(columnPayload?.sColumnID);
}

function validateDataActionColumnArray(actionErrors, check, columnArray, pointer, criteriaIDs, arrayLabel) {
   if (!Array.isArray(columnArray)) {
      actionErrors.push(
         createError(
            check.id,
            `${arrayLabel} must be an array.`,
            pointer,
            check.fixHint
         )
      );
      return;
   }
   for (let index = 0; index < columnArray.length; index += 1) {
      const columnEntry = columnArray[index];
      const columnPointer = `${pointer}/${index}/oColumn`;
      const columnPayload = columnEntry?.oColumn;
      const columnID = normalizeDataActionColumnID(columnPayload);
      if (!isPlainObject(columnEntry) || !isPlainObject(columnPayload)) {
         actionErrors.push(
            createError(
               check.id,
               `${arrayLabel}[${index}] must include oColumn payload.`,
               columnPointer,
               check.fixHint
            )
         );
         continue;
      }
      for (const fieldName of ['sColumnID', 'sColumnName', 'sQualifiedDisplayName']) {
         if (!toNonEmptyTrimmedString(columnPayload[fieldName])) {
            actionErrors.push(
               createError(
                  check.id,
                  `${arrayLabel}[${index}].oColumn.${fieldName} must be a non-empty string.`,
                  `${columnPointer}/${fieldName}`,
                  check.fixHint
               )
            );
         }
      }
      if (columnID && !criteriaIDs.has(columnID)) {
         actionErrors.push(
            createError(
               check.id,
               `${arrayLabel}[${index}] references column '${columnID}' that is not in criteria.columns.children.`,
               `${columnPointer}/sColumnID`,
               check.fixHint
            )
         );
      }
   }
}

function isPlainObject(value) {
   return value != null && typeof value === 'object' && !Array.isArray(value);
}

function ensureObjectProperty(parent, key, defaultValue) {
   if (!isPlainObject(parent[key])) {
      parent[key] = deepClone(defaultValue);
   }
   return parent[key];
}

function getNextIndexFromValueMap(valueMap) {
   if (!isPlainObject(valueMap)) {
      return 0;
   }
   let nextIndex = 0;
   for (const value of Object.values(valueMap)) {
      if (Number.isInteger(value) && value >= nextIndex) {
         nextIndex = value + 1;
      }
   }
   return nextIndex;
}

function collectLikelyMeasureColumnIDs(workbook) {
   const ids = new Set();
   const criteriaColumns = getCriteriaColumns(workbook);
   for (const column of criteriaColumns) {
      if (typeof column?.columnID === 'string' && column.columnID.startsWith('mea_')) {
         ids.add(column.columnID);
      }
   }

   function walk(node, pathParts = []) {
      if (Array.isArray(node)) {
         for (let idx = 0; idx < node.length; idx += 1) {
            walk(node[idx], pathParts.concat(String(idx)));
         }
         return;
      }
      if (!isPlainObject(node)) {
         return;
      }

      const columnID = node.columnID;
      if (typeof columnID === 'string' && columnID.trim() !== '') {
         const pathValue = pathParts.join('/');
         const layerType = typeof node.type === 'string' ? node.type : '';
         const isLikelyMeasure =
            columnID.startsWith('mea_') ||
            layerType === 'measure' ||
            pathValue.includes('/measuresList/') ||
            pathValue.includes('/logicalEdges/measures/') ||
            (pathValue.includes('/logicalEdges/color/') && layerType === 'column' && columnID.startsWith('mea_')) ||
            Object.prototype.hasOwnProperty.call(node, 'aggRule');
         if (isLikelyMeasure) {
            ids.add(columnID);
         }
      }

      for (const [key, value] of Object.entries(node)) {
         walk(value, pathParts.concat(key));
      }
   }

   walk(workbook?.views, ['views']);
   return Array.from(ids).sort();
}

function createError(id, message, pathValue, fixHint) {
   return {
      id,
      message,
      path: pathValue,
      fixHint
   };
}

function createWarning(id, message, pathValue, fixHint) {
   return {
      id,
      severity: 'warning',
      message,
      path: pathValue,
      fixHint
   };
}

function buildPluginViewPathFromSignal(pathTemplate, signalPath) {
   const baseTemplate = typeof pathTemplate === 'string' && pathTemplate.trim() !== ''
      ? pathTemplate
      : '/views/children/*';
   const suffix = typeof signalPath === 'string' && signalPath.trim() !== '' ? signalPath.trim() : '/';
   return `${baseTemplate}${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
}

function escapePointerToken(token) {
   return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

function getSchemaByID(schemaID) {
   return schemaByID.get(schemaID) || null;
}

function resolveSchemaForProjectVersion(projectVersion) {
   const schemaIDPattern = schemaRegistryProfile?.schemaIdPattern;
   if (typeof schemaIDPattern !== 'string' || schemaIDPattern.trim() === '') {
      return null;
   }
   const versionMappings = (schemaRegistryProfile?.versionMappings && typeof schemaRegistryProfile.versionMappings === 'object')
      ? schemaRegistryProfile.versionMappings
      : {};
   const supportedSchemaVersions = Array.isArray(schemaRegistryProfile?.supportedSchemaVersions)
      ? schemaRegistryProfile.supportedSchemaVersions
         .map((value) => Number(value))
         .filter((value) => Number.isFinite(value))
      : [];
   let resolvedVersion = null;
   if (Number.isFinite(projectVersion) && supportedSchemaVersions.includes(Number(projectVersion))) {
      resolvedVersion = Number(projectVersion);
   } else {
      const mapped = versionMappings[String(projectVersion)];
      if (Number.isFinite(Number(mapped))) {
         resolvedVersion = Number(mapped);
      }
   }
   if (!Number.isFinite(resolvedVersion)) {
      const latestVersion = Number(schemaRegistryProfile?.latestSchemaVersion);
      if (Number.isFinite(latestVersion)) {
         resolvedVersion = latestVersion;
      } else if (supportedSchemaVersions.length > 0) {
         resolvedVersion = Math.max(...supportedSchemaVersions);
      }
   }
   if (!Number.isFinite(resolvedVersion)) {
      return null;
   }
   const rootSchemaID = schemaIDPattern.replace('{VERSION}', String(resolvedVersion));
   return {
      rootSchemaID,
      rootSchema: getSchemaByID(rootSchemaID)
   };
}

function resolveRuleSchema(rule, valueAtPath) {
   if (typeof rule?.schemaID === 'string' && rule.schemaID.trim() !== '') {
      return getSchemaByID(rule.schemaID);
   }
   if (typeof rule?.schemaIDPattern === 'string' && rule.schemaIDPattern.trim() !== '') {
      const versionFieldName = typeof rule?.versionFieldName === 'string' ? rule.versionFieldName : null;
      const defaultVersion = rule?.defaultVersion;
      let resolvedVersion = defaultVersion;
      if (versionFieldName && isPlainObject(valueAtPath) && Object.prototype.hasOwnProperty.call(valueAtPath, versionFieldName)) {
         resolvedVersion = valueAtPath[versionFieldName];
      }
      if (resolvedVersion === undefined || resolvedVersion === null || String(resolvedVersion).trim() === '') {
         return null;
      }
      const schemaID = rule.schemaIDPattern.replace('{VERSION}', String(resolvedVersion));
      return getSchemaByID(schemaID);
   }
   return null;
}

function collectObjectPaths(value, pointer = '', out = []) {
   if (isPlainObject(value)) {
      out.push({ pointer, value });
      for (const [key, child] of Object.entries(value)) {
         collectObjectPaths(child, `${pointer}/${escapePointerToken(key)}`, out);
      }
      return out;
   }
   if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
         collectObjectPaths(value[index], `${pointer}/${index}`, out);
      }
   }
   return out;
}

function isPathRuleConditionSatisfied(pathRule, objectValue) {
   const condition = pathRule?.when;
   if (!isPlainObject(condition)) {
      return true;
   }
   const fieldName = condition.field;
   if (typeof fieldName !== 'string' || fieldName.trim() === '') {
      return true;
   }
   const expectedValue = condition.equals;
   const actualValue = isPlainObject(objectValue) ? objectValue[fieldName] : undefined;
   return actualValue === expectedValue;
}

function validateAgainstSchemaLite(value, schema, pointer, visitedRefs, issues) {
   if (!schema || typeof schema !== 'object') {
      return;
   }
   if (typeof schema.$ref === 'string') {
      const ref = schema.$ref;
      const visitKey = `${ref}@${pointer}`;
      if (visitedRefs.has(visitKey)) {
         return;
      }
      visitedRefs.add(visitKey);
      const resolved = getSchemaByID(ref);
      if (resolved) {
         validateAgainstSchemaLite(value, resolved, pointer, visitedRefs, issues);
      }
      return;
   }

   if (schema.const !== undefined && value !== schema.const) {
      issues.push({
         path: pointer,
         message: `Value must equal const '${schema.const}'.`
      });
      return;
   }

   const schemaType = schema.type;
   const expectsObject = schemaType === 'object' || (Array.isArray(schemaType) && schemaType.includes('object')) || isPlainObject(schema.properties);
   const expectsArray = schemaType === 'array' || (Array.isArray(schemaType) && schemaType.includes('array'));

   if (expectsObject) {
      if (!isPlainObject(value)) {
         issues.push({
            path: pointer,
            message: 'Expected object value.'
         });
         return;
      }

      const properties = isPlainObject(schema.properties) ? schema.properties : {};
      const required = Array.isArray(schema.required) ? schema.required : [];
      for (const requiredField of required) {
         if (typeof requiredField === 'string' && !Object.prototype.hasOwnProperty.call(value, requiredField)) {
            issues.push({
               path: `${pointer}/${escapePointerToken(requiredField)}`,
               message: `Missing required property '${requiredField}'.`
            });
         }
      }

      if (schema.additionalProperties === false) {
         const allowedKeys = new Set(Object.keys(properties));
         for (const key of Object.keys(value)) {
            if (!allowedKeys.has(key)) {
               issues.push({
                  path: pointer,
                  message: `Property '${key}' is not defined in schema and additional properties are not allowed.`
               });
            }
         }
      }

      for (const [key, childValue] of Object.entries(value)) {
         const childSchema = properties[key];
         if (childSchema && typeof childSchema === 'object') {
            validateAgainstSchemaLite(
               childValue,
               childSchema,
               `${pointer}/${escapePointerToken(key)}`,
               visitedRefs,
               issues
            );
         }
      }
      return;
   }

   if (expectsArray) {
      if (!Array.isArray(value)) {
         issues.push({
            path: pointer,
            message: 'Expected array value.'
         });
         return;
      }
      if (schema.items && typeof schema.items === 'object') {
         for (let index = 0; index < value.length; index += 1) {
            validateAgainstSchemaLite(
               value[index],
               schema.items,
               `${pointer}/${index}`,
               visitedRefs,
               issues
            );
         }
      }
   }
}

function runSchemaAcceptanceGate(workbook) {
   const issues = [];
   const rootResolution = resolveSchemaForProjectVersion(workbook?.projectVersion);
   if (!rootResolution?.rootSchema) {
      issues.push({
         path: '/projectVersion',
         message: `Unable to resolve root schema for projectVersion '${workbook?.projectVersion}'.`
      });
      return issues;
   }

   validateAgainstSchemaLite(workbook, rootResolution.rootSchema, '', new Set(), issues);

   const relativeRules = Array.isArray(schemaRegistryProfile?.relativeSchemaRules)
      ? schemaRegistryProfile.relativeSchemaRules
      : [];
   for (const rule of relativeRules) {
      const pointer = typeof rule?.path === 'string' ? rule.path : null;
      if (!pointer) {
         continue;
      }
      const valueAtPath = getByJsonPointer(workbook, pointer);
      if (typeof valueAtPath === 'undefined') {
         continue;
      }
      const schema = resolveRuleSchema(rule, valueAtPath);
      if (!schema) {
         continue;
      }
      validateAgainstSchemaLite(valueAtPath, schema, pointer, new Set(), issues);
   }

   const pathRules = Array.isArray(schemaRegistryProfile?.pathSchemaRules)
      ? schemaRegistryProfile.pathSchemaRules
      : [];
   const objectNodes = collectObjectPaths(workbook);
   for (const pathRule of pathRules) {
      if (typeof pathRule?.path === 'string') {
         const valueAtPath = getByJsonPointer(workbook, pathRule.path);
         if (typeof valueAtPath === 'undefined') {
            continue;
         }
         if (!isPathRuleConditionSatisfied(pathRule, valueAtPath)) {
            continue;
         }
         const schema = resolveRuleSchema(pathRule, valueAtPath);
         if (!schema) {
            continue;
         }
         validateAgainstSchemaLite(valueAtPath, schema, pathRule.path, new Set(), issues);
         continue;
      }
      if (typeof pathRule?.pathRegex !== 'string' || pathRule.pathRegex.trim() === '') {
         continue;
      }
      let regex;
      try {
         regex = new RegExp(pathRule.pathRegex);
      } catch (_error) {
         continue;
      }
      for (const objectNode of objectNodes) {
         if (!regex.test(objectNode.pointer)) {
            continue;
         }
         if (!isPathRuleConditionSatisfied(pathRule, objectNode.value)) {
            continue;
         }
         const schema = resolveRuleSchema(pathRule, objectNode.value);
         if (!schema) {
            continue;
         }
         validateAgainstSchemaLite(objectNode.value, schema, objectNode.pointer, new Set(), issues);
      }
   }

   return issues;
}

function sanitizeKnownSafeWorkbookMetadata(workbook) {
   const removedPaths = [];
   const reportSettings = workbook?.reportConfig?.settings;
   if (isPlainObject(reportSettings) && Object.prototype.hasOwnProperty.call(reportSettings, 'oracle.bi.tech.workbookAuthoringTrace')) {
      delete reportSettings['oracle.bi.tech.workbookAuthoringTrace'];
      removedPaths.push('/reportConfig/settings/oracle.bi.tech.workbookAuthoringTrace');
   }
   return removedPaths;
}

function getCriteriaColumns(workbook) {
   return workbook?.criteria?.columns?.children || [];
}

function getColumnPropertyMap(workbook) {
   return workbook?.criteria?.criteriaConfig?.settings?.columnPropertyMap || {};
}

function getCalcReferenceRegex() {
   const configured = calculationContracts?.nestedReferenceContract?.regex;
   if (typeof configured === 'string' && configured.trim() !== '') {
      return new RegExp(configured, 'g');
   }
   return /@calculation\("([^"]+)"\)/g;
}

function getCalcReferenceIDs(expression) {
   if (typeof expression !== 'string' || expression.trim() === '') {
      return [];
   }
   const regex = getCalcReferenceRegex();
   const refs = new Set();
   let match;
   while ((match = regex.exec(expression)) !== null) {
      if (match[1]) {
         refs.add(match[1]);
      }
   }
   return Array.from(refs);
}

function getCalcIDPrefixMap() {
   return Object.entries(calcIdPrefixByType)
      .filter(([, pattern]) => typeof pattern === 'string' && pattern.includes('<stableName>'))
      .reduce((acc, [type, pattern]) => {
         acc[type] = pattern.split('<stableName>')[0];
         return acc;
      }, {});
}

function inferCalculationType(columnID, columnProperty) {
   if (columnProperty && typeof columnProperty.type === 'string') {
      return columnProperty.type;
   }
   if (typeof columnID !== 'string') {
      return null;
   }
   const prefixMap = getCalcIDPrefixMap();
   for (const [type, prefix] of Object.entries(prefixMap)) {
      if (prefix && columnID.startsWith(prefix)) {
         return type;
      }
   }
   return null;
}

function isDirectColumnReferenceExpression(expression) {
   if (typeof expression !== 'string') {
      return false;
   }
   const normalized = expression.trim();
   if (normalized === '') {
      return false;
   }
   if (/^"[^"]+"\."[^"]+"\."[^"]+"$/.test(normalized)) {
      return true;
   }
   if (/^XSA\([^)]*\)\."[^"]+"\."[^"]+"$/i.test(normalized)) {
      return true;
   }
   if (/^@column\("([^"]+)"\)$/.test(normalized)) {
      return true;
   }
   return false;
}

function parseDirectColumnReferenceExpression(expression) {
   if (typeof expression !== 'string') {
      return null;
   }
   const normalized = expression.trim();
   if (normalized === '') {
      return null;
   }
   const match = normalized.match(
      /^(XSA\([^)]*\)|"(?:[^"\\]|\\.)+")\."((?:[^"\\]|\\.)+)"\."((?:[^"\\]|\\.)+)"$/i
   );
   if (!match) {
      return null;
   }
   return {
      subjectAreaToken: match[1],
      tableName: match[2],
      columnName: match[3]
   };
}

function isCanonicalSubjectAreaToken(value) {
   if (typeof value !== 'string') {
      return false;
   }
   const normalized = value.trim();
   if (normalized === '') {
      return false;
   }
   if (/^XSA\([^)]*\)$/i.test(normalized)) {
      return true;
   }
   return /^"([^"\\]|\\.)+"$/.test(normalized);
}

function isCalculationColumn(column) {
   const expression = column?.columnFormula?.expr?.expression;
   if (column?.userExpression === true) {
      return true;
   }
   if (typeof column?.columnID === 'string' && column.columnID.startsWith('calc_')) {
      return true;
   }
   if (typeof expression === 'string' && expression.includes('@calculation("')) {
      return true;
   }
   if (typeof expression === 'string' && !isDirectColumnReferenceExpression(expression)) {
      return true;
   }
   return false;
}

function getCalculationColumnsWithIndex(workbook) {
   const columns = getCriteriaColumns(workbook);
   const results = [];
   for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      if (isCalculationColumn(column)) {
         results.push({ column, index });
      }
   }
   return results;
}

function ensureCriteriaConfigColumnPropertyMap(workbook) {
   if (!workbook.criteria) {
      workbook.criteria = {};
   }
   if (!workbook.criteria.criteriaConfig) {
      workbook.criteria.criteriaConfig = { _version: '1.0.2', settings: {} };
   }
   if (!workbook.criteria.criteriaConfig.settings) {
      workbook.criteria.criteriaConfig.settings = {};
   }
   if (!workbook.criteria.criteriaConfig.settings.columnPropertyMap || typeof workbook.criteria.criteriaConfig.settings.columnPropertyMap !== 'object') {
      workbook.criteria.criteriaConfig.settings.columnPropertyMap = {};
   }
   return workbook.criteria.criteriaConfig.settings.columnPropertyMap;
}

function normalizeToken(value) {
   return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function replaceCalcReferences(expression, replacementMap) {
   if (typeof expression !== 'string' || expression.trim() === '' || replacementMap.size === 0) {
      return expression;
   }
   const regex = getCalcReferenceRegex();
   return expression.replace(regex, (full, capturedID) => {
      if (replacementMap.has(capturedID)) {
         return `@calculation("${replacementMap.get(capturedID)}")`;
      }
      return full;
   });
}

function topologicalOrderCalcColumns(calcColumns) {
   const map = new Map(calcColumns.map((entry) => [entry.column?.columnID, entry]));
   const nodes = Array.from(map.keys()).filter((id) => typeof id === 'string' && id.trim() !== '');
   const incomingCount = new Map(nodes.map((id) => [id, 0]));
   const edges = new Map(nodes.map((id) => [id, []]));

   for (const nodeID of nodes) {
      const expression = map.get(nodeID)?.column?.columnFormula?.expr?.expression;
      const refs = getCalcReferenceIDs(expression).filter((refID) => map.has(refID));
      for (const refID of refs) {
         edges.get(refID).push(nodeID);
         incomingCount.set(nodeID, (incomingCount.get(nodeID) || 0) + 1);
      }
   }

   const queue = nodes.filter((id) => (incomingCount.get(id) || 0) === 0)
      .sort((left, right) => (map.get(left)?.index || 0) - (map.get(right)?.index || 0));
   const ordered = [];

   while (queue.length > 0) {
      const id = queue.shift();
      ordered.push(id);
      for (const nextID of edges.get(id) || []) {
         incomingCount.set(nextID, (incomingCount.get(nextID) || 0) - 1);
         if ((incomingCount.get(nextID) || 0) === 0) {
            queue.push(nextID);
            queue.sort((left, right) => (map.get(left)?.index || 0) - (map.get(right)?.index || 0));
         }
      }
   }

   if (ordered.length !== nodes.length) {
      return null;
   }

   return ordered
      .map((id) => map.get(id))
      .filter(Boolean);
}

function validateTypedCalcOptions(calcType, options) {
   const typeContract = calculationTypeContracts?.[calcType] || {};
   const requiredOptions = Array.isArray(typeContract.requiredOptions) ? typeContract.requiredOptions : [];
   const violations = [];
   if (options == null || typeof options !== 'object' || Array.isArray(options)) {
      violations.push('options missing');
      return violations;
   }
   for (const optionName of requiredOptions) {
      if (!(optionName in options)) {
         violations.push(`options.${optionName} missing`);
      } else if (optionName === 'autoName' && typeof options[optionName] !== 'boolean') {
         violations.push('options.autoName must be boolean');
      } else if (optionName === 'groups' && !Array.isArray(options[optionName])) {
         violations.push('options.groups must be array');
      } else if (optionName === 'includeOthers' && !Array.isArray(options[optionName])) {
         violations.push('options.includeOthers must be array');
      } else if (optionName === 'othersName' && typeof options[optionName] !== 'string') {
         violations.push('options.othersName must be string');
      } else if (optionName === 'timeSeriesCalcID' && typeof options[optionName] !== 'string') {
         violations.push('options.timeSeriesCalcID must be string');
      } else if (optionName === 'measureFormula' && typeof options[optionName] !== 'string') {
         violations.push('options.measureFormula must be string');
      }
   }
   return violations;
}

function withViewContext(errors, viewMeta) {
   return errors.map((entry) => {
      const contextualPath = String(entry.path || '').replace('/views/children/*', viewMeta.path);
      return {
         ...entry,
         path: contextualPath || viewMeta.path,
         viewIndex: viewMeta.index,
         viewName: viewMeta.view?.viewName || null,
         viewPluginType: viewMeta.view?.pluginType || null
      };
   });
}

const AUTOVIZ_BASE_PROPERTY_ADDITION_REQUIREMENTS = {
   colorMin: {
      aggRule: 'min',
      placement: 'first_cell',
      stacked: false,
      grainEdge: 'none',
      acrossMeasures: 'single'
   },
   colorMax: {
      aggRule: 'max',
      placement: 'first_cell',
      stacked: false,
      grainEdge: 'none',
      acrossMeasures: 'single'
   },
   color: {
      aggRule: 'default',
      placement: 'all',
      stacked: false,
      grainEdge: 'none',
      acrossMeasures: 'single'
   }
};

function buildAutovizPropertyAdditions(measureColumnID, includeMinMax) {
   const children = [];
   if (includeMinMax) {
      children.push({
         id: `min.${measureColumnID}`,
         valueColumnID: measureColumnID,
         aggRule: 'min',
         stacked: false,
         placement: 'first_cell',
         grainEdge: 'none',
         acrossMeasures: 'single'
      });
      children.push({
         id: `max.${measureColumnID}`,
         valueColumnID: measureColumnID,
         aggRule: 'max',
         stacked: false,
         placement: 'first_cell',
         grainEdge: 'none',
         acrossMeasures: 'single'
      });
   }

   children.push({
      id: 'colorMin',
      valueColumnID: measureColumnID,
      aggRule: 'min',
      stacked: false,
      placement: 'first_cell',
      grainEdge: 'none',
      acrossMeasures: 'single'
   });
   children.push({
      id: 'colorMax',
      valueColumnID: measureColumnID,
      aggRule: 'max',
      stacked: false,
      placement: 'first_cell',
      grainEdge: 'none',
      acrossMeasures: 'single'
   });
   children.push({
      id: 'color',
      valueColumnID: measureColumnID,
      aggRule: 'default',
      stacked: false,
      placement: 'all',
      grainEdge: 'none',
      acrossMeasures: 'single'
   });
   return children;
}

function checkFilterParameterBindingsResolve(workbook, check) {
   const errors = [];
   const parameterSettingsByName = getWorkbookParameterSettingsByName(workbook);
   const bindings = getFilterParameterBindings(workbook);
   for (const binding of bindings) {
      const parameterEntry = parameterSettingsByName.get(binding.parameterName);
      if (!parameterEntry) {
         errors.push(
            createError(
               check.id,
               `Filter control '${binding.filterID}' ${binding.bindingKey} references parameter '${binding.parameterName}', but parameters.settings has no matching name.`,
               binding.path,
               check.fixHint
            )
         );
         continue;
      }
      if (binding.bindingKey === 'listParameterBinding' && parameterEntry.parameter?.isMultiValue !== true) {
         errors.push(
            createError(
               check.id,
               `Filter control '${binding.filterID}' listParameterBinding '${binding.parameterName}' must resolve to a multi-value parameter.`,
               `/parameters/settings/${parameterEntry.index}/isMultiValue`,
               check.fixHint
            )
         );
      }
   }
   return errors;
}

function checkUnsupportedForeignFormulaDialect(workbook, check) {
   const errors = [];
   const columns = getCriteriaColumns(workbook);
   for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      const expression = column?.columnFormula?.expr?.expression;
      if (typeof expression !== 'string' || expression.trim() === '') {
         continue;
      }
      if (/\bCOUNTD\s*\(/i.test(expression)) {
         errors.push(
            createError(
               check.id,
               `Criteria column '${column?.columnID || `index_${index}`}' uses Tableau COUNTD(...) syntax; use governed measures or OAC COUNT(DISTINCT ...) syntax.`,
               `/criteria/columns/children/${index}/columnFormula/expr/expression`,
               check.fixHint
            )
         );
      }
   }
   return errors;
}

function checkDataActions(workbook, check) {
   const errors = [];
   if (workbook?.dataActions == null) {
      return errors;
   }
   if (!Array.isArray(workbook.dataActions)) {
      errors.push(
         createError(
            check.id,
            'dataActions must be a top-level array of data action entries.',
            '/dataActions',
            check.fixHint
         )
      );
      return errors;
   }

   const criteriaIDs = new Set(getCriteriaColumns(workbook).map((column) => column?.columnID).filter(Boolean));
   for (let index = 0; index < workbook.dataActions.length; index += 1) {
      const dataAction = workbook.dataActions[index];
      const actionPointer = `/dataActions/${index}`;
      if (!isPlainObject(dataAction)) {
         errors.push(
            createError(
               check.id,
               `dataActions[${index}] must be an object.`,
               actionPointer,
               check.fixHint
            )
         );
         continue;
      }

      const abstractAction = dataAction[DATA_ACTION_NAMESPACE_ABSTRACT];
      if (!isPlainObject(abstractAction)) {
         errors.push(
            createError(
               check.id,
               `dataActions[${index}] is missing ${DATA_ACTION_NAMESPACE_ABSTRACT}.`,
               `${actionPointer}/${DATA_ACTION_NAMESPACE_ABSTRACT}`,
               check.fixHint
            )
         );
         continue;
      }

      for (const fieldName of ['sClass', 'sID', 'sName', 'sScopeID', 'sVersion', '_sNSVersion']) {
         if (!toNonEmptyTrimmedString(abstractAction[fieldName])) {
            errors.push(
               createError(
                  check.id,
                  `${DATA_ACTION_NAMESPACE_ABSTRACT}.${fieldName} must be a non-empty string.`,
                  `${actionPointer}/${DATA_ACTION_NAMESPACE_ABSTRACT}/${fieldName}`,
                  check.fixHint
               )
            );
         }
      }

      const valuePassingMode = toNonEmptyTrimmedString(abstractAction.eValuePassingMode);
      if (valuePassingMode && !DATA_ACTION_VALUE_PASSING_MODES.has(valuePassingMode)) {
         errors.push(
            createError(
               check.id,
               `${DATA_ACTION_NAMESPACE_ABSTRACT}.eValuePassingMode '${valuePassingMode}' is not supported.`,
               `${actionPointer}/${DATA_ACTION_NAMESPACE_ABSTRACT}/eValuePassingMode`,
               check.fixHint
            )
         );
      }

      validateDataActionColumnArray(
         errors,
         check,
         abstractAction.aContextColumns,
         `${actionPointer}/${DATA_ACTION_NAMESPACE_ABSTRACT}/aContextColumns`,
         criteriaIDs,
         'aContextColumns'
      );
      validateDataActionColumnArray(
         errors,
         check,
         abstractAction.aAnchorToColumns,
         `${actionPointer}/${DATA_ACTION_NAMESPACE_ABSTRACT}/aAnchorToColumns`,
         criteriaIDs,
         'aAnchorToColumns'
      );

      const biNavigationAction = dataAction[DATA_ACTION_NAMESPACE_BI_NAV];
      if (biNavigationAction !== undefined) {
         if (!isPlainObject(biNavigationAction)) {
            errors.push(
               createError(
                  check.id,
                  `${DATA_ACTION_NAMESPACE_BI_NAV} must be an object when present.`,
                  `${actionPointer}/${DATA_ACTION_NAMESPACE_BI_NAV}`,
                  check.fixHint
               )
            );
         } else {
            for (const fieldName of ['sTargetItemType', 'sTargetCanvasID', '_sNSVersion']) {
               if (!toNonEmptyTrimmedString(biNavigationAction[fieldName])) {
                  errors.push(
                     createError(
                        check.id,
                        `${DATA_ACTION_NAMESPACE_BI_NAV}.${fieldName} must be a non-empty string.`,
                        `${actionPointer}/${DATA_ACTION_NAMESPACE_BI_NAV}/${fieldName}`,
                        check.fixHint
                     )
                  );
               }
            }

            const parameterMappingType = toNonEmptyTrimmedString(biNavigationAction.eBIPParameterMappingType);
            if (!parameterMappingType || !DATA_ACTION_BIP_PARAMETER_MAPPING_TYPES.has(parameterMappingType)) {
               errors.push(
                  createError(
                     check.id,
                     `${DATA_ACTION_NAMESPACE_BI_NAV}.eBIPParameterMappingType must be default or custom.`,
                     `${actionPointer}/${DATA_ACTION_NAMESPACE_BI_NAV}/eBIPParameterMappingType`,
                     check.fixHint
                  )
               );
            }
            if (!Array.isArray(biNavigationAction.aBIPParameterMap)) {
               errors.push(
                  createError(
                     check.id,
                     `${DATA_ACTION_NAMESPACE_BI_NAV}.aBIPParameterMap must be an array.`,
                     `${actionPointer}/${DATA_ACTION_NAMESPACE_BI_NAV}/aBIPParameterMap`,
                     check.fixHint
                  )
               );
            }

            const parameterPassingMode = toNonEmptyTrimmedString(biNavigationAction.eParameterPassingMode);
            if (parameterPassingMode && !DATA_ACTION_PARAMETER_PASSING_MODES.has(parameterPassingMode)) {
               errors.push(
                  createError(
                     check.id,
                     `${DATA_ACTION_NAMESPACE_BI_NAV}.eParameterPassingMode '${parameterPassingMode}' is not supported.`,
                     `${actionPointer}/${DATA_ACTION_NAMESPACE_BI_NAV}/eParameterPassingMode`,
                     check.fixHint
                  )
               );
            }
            if (biNavigationAction.aPassedParameters !== undefined && !Array.isArray(biNavigationAction.aPassedParameters)) {
               errors.push(
                  createError(
                     check.id,
                     `${DATA_ACTION_NAMESPACE_BI_NAV}.aPassedParameters must be an array when present.`,
                     `${actionPointer}/${DATA_ACTION_NAMESPACE_BI_NAV}/aPassedParameters`,
                     check.fixHint
                  )
               );
            }
         }
      }

      const httpAction = dataAction[DATA_ACTION_NAMESPACE_HTTP];
      if (httpAction !== undefined) {
         if (!isPlainObject(httpAction)) {
            errors.push(
               createError(
                  check.id,
                  `${DATA_ACTION_NAMESPACE_HTTP} must be an object when present.`,
                  `${actionPointer}/${DATA_ACTION_NAMESPACE_HTTP}`,
                  check.fixHint
               )
            );
         } else {
            if (typeof httpAction.sURL !== 'string') {
               errors.push(
                  createError(
                     check.id,
                     `${DATA_ACTION_NAMESPACE_HTTP}.sURL must be a string.`,
                     `${actionPointer}/${DATA_ACTION_NAMESPACE_HTTP}/sURL`,
                     check.fixHint
                  )
               );
            } else {
               const prohibitedScheme = getProhibitedUrlActionScheme(httpAction.sURL);
               if (prohibitedScheme) {
                  errors.push(
                     createError(
                        check.id,
                        `${DATA_ACTION_NAMESPACE_HTTP}.sURL uses prohibited URL scheme '${prohibitedScheme}:'.`,
                        `${actionPointer}/${DATA_ACTION_NAMESPACE_HTTP}/sURL`,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }
   }

   return errors;
}

function checkCriteriaSentinelFilterWarnings(workbook) {
   const warnings = [];
   const criteriaFilter = workbook?.criteria?.filter;
   if (criteriaFilter == null) {
      return warnings;
   }
   const sentinelValues = new Set(['none', '(none)', 'all', '(all)', '<all>']);
   const stringValues = collectStringValues(criteriaFilter, ['criteria', 'filter']);
   for (const entry of stringValues) {
      const normalized = entry.value.trim().toLowerCase();
      if (!sentinelValues.has(normalized)) {
         continue;
      }
      warnings.push(
         createWarning(
            'GLOBAL_SENTINEL_DEFAULT_FILTER_PREDICATE',
            `criteria.filter contains placeholder literal '${entry.value}'. Persist real runtime defaults only; leave placeholder or unselected states out of query predicates.`,
            entry.path,
            'Remove sentinel placeholder predicates such as None/All unless the value is an intentional data value.'
         )
      );
   }
   return warnings;
}

function isNumberFormatSettingKey(key) {
   if (typeof key !== 'string') {
      return false;
   }
   return key.includes('_number_format_') ||
      key.includes('numberFormat') ||
      key.includes('NumberFormat');
}

function collectNumberFormatSettings(node, pathParts = [], out = []) {
   if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index += 1) {
         collectNumberFormatSettings(node[index], pathParts.concat(String(index)), out);
      }
      return out;
   }
   if (!isPlainObject(node)) {
      return out;
   }
   for (const [key, value] of Object.entries(node)) {
      const childPath = pathParts.concat(key);
      if (isNumberFormatSettingKey(key) && isPlainObject(value)) {
         out.push({
            path: toJsonPointer(childPath),
            value
         });
      }
      collectNumberFormatSettings(value, childPath, out);
   }
   return out;
}

function checkNumberFormatSaveCompatibility(workbook, check) {
   const errors = [];
   for (const { path: settingPath, value: numberFormat } of collectNumberFormatSettings(workbook)) {
      if (Object.prototype.hasOwnProperty.call(numberFormat, 'abbreviationScale')) {
         const abbreviationScale = numberFormat.abbreviationScale;
         if (typeof abbreviationScale !== 'string' || !NUMBER_FORMAT_ALLOWED_ABBREVIATION_SCALES.has(abbreviationScale)) {
            errors.push(
               createError(
                  check.id,
                  `Number format abbreviationScale '${String(abbreviationScale)}' is not save-compatible. Use one of ${Array.from(NUMBER_FORMAT_ALLOWED_ABBREVIATION_SCALES).join(', ')}; use 'on' for automatic abbreviation.`,
                  `${settingPath}/abbreviationScale`,
                  check.fixHint
               )
            );
         }
      }
      if (Object.prototype.hasOwnProperty.call(numberFormat, 'negativeValuesStyle')) {
         const negativeValuesStyle = numberFormat.negativeValuesStyle;
         if (typeof negativeValuesStyle !== 'string' || !NUMBER_FORMAT_ALLOWED_NEGATIVE_VALUE_STYLES.has(negativeValuesStyle)) {
            errors.push(
               createError(
                  check.id,
                  `Number format negativeValuesStyle '${String(negativeValuesStyle)}' is not save-compatible. Use one of ${Array.from(NUMBER_FORMAT_ALLOWED_NEGATIVE_VALUE_STYLES).join(', ')}; use 'default' for minus-sign negatives.`,
                  `${settingPath}/negativeValuesStyle`,
                  check.fixHint
               )
            );
         }
      }
   }
   return errors;
}

function collectLayoutCustomPropsTextPayloads(workbook) {
   const payloads = [];
   const layouts = Array.isArray(workbook?.layouts?.children) ? workbook.layouts.children : [];
   for (let index = 0; index < layouts.length; index += 1) {
      const layout = layouts[index];
      if (!isPlainObject(layout)) {
         continue;
      }
      const customProps = layout?.layoutProps?.customProps;
      if (!isPlainObject(customProps) || !Object.prototype.hasOwnProperty.call(customProps, 'text')) {
         continue;
      }
      payloads.push({
         layout,
         value: customProps.text,
         path: `/layouts/children/${index}/layoutProps/customProps/text`
      });
   }
   return payloads;
}

function checkLayoutCustomPropsJsonParseable(workbook, check) {
   const errors = [];
   for (const payload of collectLayoutCustomPropsTextPayloads(workbook)) {
      if (typeof payload.value !== 'string') {
         errors.push(
            createError(
               check.id,
               'layoutProps.customProps.text must be a JSON-encoded string.',
               payload.path,
               check.fixHint
            )
         );
         continue;
      }

      let parsed;
      try {
         parsed = JSON.parse(payload.value);
      } catch (error) {
         errors.push(
            createError(
               check.id,
               `layoutProps.customProps.text must parse as JSON: ${error?.message || String(error)}.`,
               payload.path,
               check.fixHint
            )
         );
         continue;
      }

      if (!isPlainObject(parsed)) {
         errors.push(
            createError(
               check.id,
               'layoutProps.customProps.text must parse to a JSON object.',
               payload.path,
               check.fixHint
            )
         );
         continue;
      }

      if (payload.layout?.type === 'oracle.bi.tech.layout.split') {
         const splitProps = parsed['oracle.bi.tech.layout.split'];
         if (!isPlainObject(splitProps) || !isPlainObject(splitProps.layoutMinSize)) {
            errors.push(
               createError(
                  check.id,
                  "split layout customProps.text must include oracle.bi.tech.layout.split.layoutMinSize.",
                  payload.path,
                  check.fixHint
               )
            );
         }
      }
   }
   return errors;
}

function checkGlobal(workbook, profile, filterDecisionTrace, modifyContext, modifyTrace) {
   const errors = [];

   for (const check of semanticRules.globalChecks || []) {
      if (check.id === 'GLOBAL_REQUIRED_TOP_LEVEL_NODES') {
         for (const pointer of check.requiredJsonPaths || []) {
            if (typeof getByJsonPointer(workbook, pointer) === 'undefined') {
               errors.push(createError(check.id, `Missing required node: ${pointer}`, pointer, check.fixHint));
            }
         }
      }

      if (check.id === 'GLOBAL_LAYOUT_VIEW_REFERENTIAL_INTEGRITY') {
         const viewNames = new Set((workbook.views?.children || []).map((view) => view?.viewName).filter(Boolean));
         const layoutChildren = workbook.layouts?.children || [];
         for (let l = 0; l < layoutChildren.length; l += 1) {
            const cells = layoutChildren[l]?.children || [];
            for (let c = 0; c < cells.length; c += 1) {
               const viewName = cells[c]?.content?.viewName;
               if (viewName && !viewNames.has(viewName)) {
                  errors.push(
                     createError(
                        check.id,
                        `Layout cell references missing view '${viewName}'.`,
                        `/layouts/children/${l}/children/${c}/content/viewName`,
                        check.fixHint
                     )
                  );
               }
            }
         }

         const currentView = workbook.views?.currentView;
         const currentCanvas = workbook.views?.children?.[currentView];
         if (!currentCanvas || currentCanvas.type !== 'saw:canvas') {
            errors.push(createError(check.id, 'views.currentView must reference a canvas view.', '/views/currentView', check.fixHint));
         }
      }

      if (check.id === 'GLOBAL_CRITERIA_DATASOURCE_ALIGNMENT') {
         const criteriaSA = workbook.criteria?.subjectArea;
         const datasourceSA = workbook.datasources?.children?.[0]?.subjectArea;
         if (typeof criteriaSA === 'string' && !isCanonicalSubjectAreaToken(criteriaSA)) {
            errors.push(
               createError(
                  check.id,
                  'criteria.subjectArea must be a canonical token (quoted subject area name or XSA(...) expression).',
                  '/criteria/subjectArea',
                  check.fixHint
               )
            );
         }
         if (typeof datasourceSA === 'string' && !isCanonicalSubjectAreaToken(datasourceSA)) {
            errors.push(
               createError(
                  check.id,
                  'datasources.children[0].subjectArea must be a canonical token (quoted subject area name or XSA(...) expression).',
                  '/datasources/children/0/subjectArea',
                  check.fixHint
               )
            );
         }
         if (criteriaSA && datasourceSA && criteriaSA !== datasourceSA) {
            errors.push(
               createError(
                  check.id,
                  'criteria.subjectArea and datasources.children[0].subjectArea must match.',
                  '/criteria/subjectArea',
                  check.fixHint
               )
            );
         }

         const criteriaIDs = new Set((workbook.criteria?.columns?.children || []).map((col) => col?.columnID).filter(Boolean));
         const referencedIDs = collectColumnIDs(workbook);
         for (const columnID of referencedIDs) {
            if (columnID === EMBEDDED_VIZ_DUMMY_MEASURE_LINK_COLUMN_ID) {
               continue;
            }
            if (!criteriaIDs.has(columnID)) {
               errors.push(
                  createError(
                     check.id,
                     `Referenced columnID '${columnID}' not found in criteria columns.`,
                     '/criteria/columns/children',
                     check.fixHint
                  )
               );
            }
         }

         if (typeof criteriaSA === 'string' && criteriaSA.trim() !== '') {
            const criteriaColumns = workbook.criteria?.columns?.children || [];
            for (let index = 0; index < criteriaColumns.length; index += 1) {
               const column = criteriaColumns[index];
               const expression = column?.columnFormula?.expr?.expression;
               if (!isDirectColumnReferenceExpression(expression)) {
                  continue;
               }
               const parsedExpression = parseDirectColumnReferenceExpression(expression);
               if (!parsedExpression) {
                  continue;
               }
               if (parsedExpression.subjectAreaToken !== criteriaSA) {
                  errors.push(
                     createError(
                        check.id,
                        `criteria column '${column?.columnID || `index_${index}`}' expression subjectArea '${parsedExpression.subjectAreaToken}' must match criteria.subjectArea '${criteriaSA}'.`,
                        `/criteria/columns/children/${index}/columnFormula/expr/expression`,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }

      if (check.id === 'GLOBAL_CALC_REFERENCES_RESOLVE') {
         const calcColumns = getCalculationColumnsWithIndex(workbook);
         const calcById = new Map(calcColumns
            .filter((entry) => typeof entry?.column?.columnID === 'string')
            .map((entry) => [entry.column.columnID, entry]));
         for (const calcEntry of calcColumns) {
            const expression = calcEntry?.column?.columnFormula?.expr?.expression;
            const refs = getCalcReferenceIDs(expression);
            for (const refID of refs) {
               const target = calcById.get(refID);
               if (!target) {
                  errors.push(
                     createError(
                        check.id,
                        `Calculation reference '${refID}' does not resolve to an existing calculation column.`,
                        `/criteria/columns/children/${calcEntry.index}/columnFormula/expr/expression`,
                        check.fixHint
                     )
                  );
               } else if (target.column?.userExpression !== true) {
                  errors.push(
                     createError(
                        check.id,
                        `Calculation reference '${refID}' must target a userExpression column.`,
                        `/criteria/columns/children/${calcEntry.index}/columnFormula/expr/expression`,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }

      if (check.id === 'GLOBAL_CALC_REFERENCE_NO_CYCLES') {
         const calcColumns = getCalculationColumnsWithIndex(workbook);
         const calcById = new Map(calcColumns
            .filter((entry) => typeof entry?.column?.columnID === 'string')
            .map((entry) => [entry.column.columnID, entry]));
         const visitState = new Map();
         const stack = [];
         let cycleDetected = false;

         function dfs(calcID) {
            if (cycleDetected) {
               return;
            }
            const state = visitState.get(calcID) || 0;
            if (state === 1) {
               const cycleStart = stack.indexOf(calcID);
               const cyclePath = cycleStart >= 0 ? stack.slice(cycleStart).concat(calcID) : [calcID, calcID];
               errors.push(
                  createError(
                     check.id,
                     `Calculation dependency cycle detected: ${cyclePath.join(' -> ')}.`,
                     '/criteria/columns/children',
                     check.fixHint
                  )
               );
               cycleDetected = true;
               return;
            }
            if (state === 2) {
               return;
            }
            visitState.set(calcID, 1);
            stack.push(calcID);
            const expression = calcById.get(calcID)?.column?.columnFormula?.expr?.expression;
            const refs = getCalcReferenceIDs(expression).filter((refID) => calcById.has(refID));
            for (const refID of refs) {
               dfs(refID);
               if (cycleDetected) {
                  break;
               }
            }
            stack.pop();
            visitState.set(calcID, 2);
         }

         for (const calcID of calcById.keys()) {
            if (!cycleDetected) {
               dfs(calcID);
            }
         }
      }

      if (check.id === 'GLOBAL_TYPED_CALC_COLUMN_PROPERTY_MAP') {
         const calcColumns = getCalculationColumnsWithIndex(workbook);
         const columnPropertyMap = getColumnPropertyMap(workbook);
         for (const calcEntry of calcColumns) {
            const columnID = calcEntry?.column?.columnID;
            if (typeof columnID !== 'string' || columnID.trim() === '') {
               continue;
            }
            const propertyEntry = columnPropertyMap?.[columnID];
            const inferredType = inferCalculationType(columnID, propertyEntry);
            const requiresTypedPayload = typedCalculationRequiredTypes.has(inferredType);

            if (requiresTypedPayload && (!(propertyEntry instanceof Object) || Array.isArray(propertyEntry))) {
               errors.push(
                  createError(
                     check.id,
                     `Typed calculation '${columnID}' is missing criteriaConfig.settings.columnPropertyMap payload.`,
                     `/criteria/criteriaConfig/settings/columnPropertyMap/${columnID}`,
                     check.fixHint
                  )
               );
               continue;
            }

            if (!(propertyEntry instanceof Object) || Array.isArray(propertyEntry) || !inferredType || !supportedCalcTypes.has(inferredType)) {
               continue;
            }

            const typeContract = calculationTypeContracts?.[inferredType] || {};
            const requiredTopLevel = Array.isArray(typeContract.requiredTopLevel) ? typeContract.requiredTopLevel : [];
            const violations = [];
            for (const fieldName of requiredTopLevel) {
               if (!(fieldName in propertyEntry)) {
                  violations.push(`${fieldName} missing`);
               } else if (fieldName === 'type' && propertyEntry[fieldName] !== inferredType) {
                  violations.push(`type=${JSON.stringify(propertyEntry[fieldName])} (expected ${JSON.stringify(inferredType)})`);
               } else if (fieldName === 'parentExpression' && (typeof propertyEntry[fieldName] !== 'string' || propertyEntry[fieldName].trim() === '')) {
                  violations.push('parentExpression missing/empty');
               } else if (fieldName === 'options' && (propertyEntry[fieldName] == null || typeof propertyEntry[fieldName] !== 'object' || Array.isArray(propertyEntry[fieldName]))) {
                  violations.push('options missing/invalid');
               }
            }

            const optionViolations = validateTypedCalcOptions(inferredType, propertyEntry.options);
            violations.push(...optionViolations);
            if (violations.length > 0) {
               errors.push(
                  createError(
                     check.id,
                     `Invalid typed calc payload for '${columnID}': ${violations.join('; ')}.`,
                     `/criteria/criteriaConfig/settings/columnPropertyMap/${columnID}`,
                     check.fixHint
                  )
               );
            }
         }
      }

      if (check.id === 'GLOBAL_CALC_REFERENCE_ORDERING') {
         const calcColumns = getCalculationColumnsWithIndex(workbook);
         const calcIndexById = new Map(calcColumns
            .filter((entry) => typeof entry?.column?.columnID === 'string')
            .map((entry) => [entry.column.columnID, entry.index]));
         for (const calcEntry of calcColumns) {
            const expression = calcEntry?.column?.columnFormula?.expr?.expression;
            const refs = getCalcReferenceIDs(expression);
            for (const refID of refs) {
               if (!calcIndexById.has(refID)) {
                  continue;
               }
               const refIndex = calcIndexById.get(refID);
               if (refIndex >= calcEntry.index) {
                  errors.push(
                     createError(
                        check.id,
                        `Calculation '${calcEntry.column?.columnID}' must appear after referenced calculation '${refID}'.`,
                        `/criteria/columns/children/${calcEntry.index}`,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }

      if (check.id === 'GLOBAL_DERIVED_FORMULA_MARKED_USER_EXPRESSION') {
         const columns = getCriteriaColumns(workbook);
         for (let index = 0; index < columns.length; index += 1) {
            const column = columns[index];
            const expression = column?.columnFormula?.expr?.expression;
            if (typeof expression !== 'string' || expression.trim() === '') {
               continue;
            }
            if (isDirectColumnReferenceExpression(expression)) {
               continue;
            }
            if (column?.userExpression !== true) {
               errors.push(
                  createError(
                     check.id,
                     `Derived formula column '${column?.columnID || `index_${index}`}' must be marked userExpression=true.`,
                     `/criteria/columns/children/${index}`,
                     check.fixHint
                  )
               );
            }
         }
      }

      if (check.id === 'GLOBAL_UNSUPPORTED_FOREIGN_FORMULA_DIALECT') {
         errors.push(...checkUnsupportedForeignFormulaDialect(workbook, check));
      }

      if (check.id === 'GLOBAL_FILTER_PARAMETER_BINDINGS_RESOLVE') {
         errors.push(...checkFilterParameterBindingsResolve(workbook, check));
      }

      if (check.id === 'GLOBAL_FILTER_CHOICE_VALUES_OBJECT_SHAPE') {
         errors.push(...checkFilterChoiceValueShapes(workbook, check));
      }

      if (check.id === 'GLOBAL_DATA_ACTIONS_SOURCE_SCHEMA') {
         errors.push(...checkDataActions(workbook, check));
      }

      if (check.id === 'GLOBAL_NUMBER_FORMAT_SAVE_SCHEMA_COMPATIBLE') {
         errors.push(...checkNumberFormatSaveCompatibility(workbook, check));
      }

      if (check.id === 'GLOBAL_LAYOUT_CUSTOM_PROPS_JSON_PARSEABLE') {
         errors.push(...checkLayoutCustomPropsJsonParseable(workbook, check));
      }

      if (check.id === 'GLOBAL_PROFILE_REPORTCONFIG_REQUIREMENTS') {
         const requiredPaths = profile?.reportConfigRequirements?.requiredJsonPaths || [];
         for (const pointer of requiredPaths) {
            if (typeof getByJsonPointer(workbook, pointer) === 'undefined') {
               errors.push(createError(check.id, `Missing profile-required reportConfig node: ${pointer}`, pointer, check.fixHint));
            }
         }
      }

      if (check.id === 'GLOBAL_SCHEMA_ACCEPTANCE_GATE') {
         const schemaIssues = runSchemaAcceptanceGate(workbook);
         for (const issue of schemaIssues) {
            errors.push(
               createError(
                  check.id,
                  `Schema acceptance check failed at '${issue.path || '/'}': ${issue.message}`,
                  issue.path || '/',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'GLOBAL_FILTER_DECISION_TRACE_PRESENT') {
         const requiredFields = Array.isArray(filterProfilingContracts?.traceContract?.requiredOutputFields)
            ? filterProfilingContracts.traceContract.requiredOutputFields
            : [];
         for (const fieldName of requiredFields) {
            if (!Object.prototype.hasOwnProperty.call(filterDecisionTrace || {}, fieldName)) {
               errors.push(
                  createError(
                     check.id,
                     `Filter decision trace is missing required field '${fieldName}'.`,
                     '/filterDecisionTrace',
                     check.fixHint
                  )
               );
            }
         }

         if (
            filterDecisionTrace?.fallbackUsed === true &&
            (typeof filterDecisionTrace?.fallbackReason !== 'string' || filterDecisionTrace.fallbackReason.trim() === '')
         ) {
            errors.push(
               createError(
                  check.id,
                  'Filter decision trace requires fallbackReason when fallbackUsed=true.',
                  '/filterDecisionTrace/fallbackReason',
                  check.fixHint
               )
            );
         }

         if (
            filterDecisionTrace?.required === true &&
            (!Array.isArray(filterDecisionTrace?.derivedDecisions) || filterDecisionTrace.derivedDecisions.length === 0)
         ) {
            errors.push(
               createError(
                  check.id,
                  'Filter decision trace requires derivedDecisions entries when filter controls exist.',
                  '/filterDecisionTrace/derivedDecisions',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'GLOBAL_MODIFY_TRACE_PRESENT') {
         if (modifyContext?.authoringMode !== 'modify_existing') {
            continue;
         }

         if (!isPlainObject(modifyTrace)) {
            errors.push(
               createError(
                  check.id,
                  'Modify mode requires modifyTrace in validation check execution output.',
                  '/modifyTrace',
                  check.fixHint
               )
            );
            continue;
         }

         const requiredFields = Array.isArray(editOperationContracts?.traceContract?.requiredOutputFields)
            ? editOperationContracts.traceContract.requiredOutputFields
            : [];
         for (const fieldName of requiredFields) {
            if (!Object.prototype.hasOwnProperty.call(modifyTrace, fieldName)) {
               errors.push(
                  createError(
                     check.id,
                     `Modify trace is missing required field '${fieldName}'.`,
                     '/modifyTrace',
                     check.fixHint
                  )
               );
            }
         }
         if (typeof modifyTrace?.requestedOperation !== 'string' || modifyTrace.requestedOperation.trim() === '') {
            errors.push(
               createError(
                  check.id,
                  'Modify trace requestedOperation must be a non-empty string.',
                  '/modifyTrace/requestedOperation',
                  check.fixHint
               )
            );
         }
         if (typeof modifyTrace?.sourceMode !== 'string' || modifyTrace.sourceMode.trim() === '') {
            errors.push(
               createError(
                  check.id,
                  'Modify trace sourceMode must be a non-empty string.',
                  '/modifyTrace/sourceMode',
                  check.fixHint
               )
            );
         }
         if (typeof modifyTrace?.confirmationState !== 'string' || modifyTrace.confirmationState.trim() === '') {
            errors.push(
               createError(
                  check.id,
                  'Modify trace confirmationState must be a non-empty string.',
                  '/modifyTrace/confirmationState',
                  check.fixHint
               )
            );
         }
         if (!Array.isArray(modifyTrace?.mutationsApplied)) {
            errors.push(
               createError(
                  check.id,
                  'Modify trace mutationsApplied must be an array.',
                  '/modifyTrace/mutationsApplied',
                  check.fixHint
               )
            );
         }
         if (!Array.isArray(modifyTrace?.pathsChanged)) {
            errors.push(
               createError(
                  check.id,
                  'Modify trace pathsChanged must be an array.',
                  '/modifyTrace/pathsChanged',
                  check.fixHint
               )
            );
         }

         if (
            modifyTrace?.fallbackUsed === true &&
            (typeof modifyTrace?.fallbackReason !== 'string' || modifyTrace.fallbackReason.trim() === '')
         ) {
            errors.push(
               createError(
                  check.id,
                  'Modify trace requires fallbackReason when fallbackUsed=true.',
                  '/modifyTrace/fallbackReason',
                  check.fixHint
               )
            );
         }

         const target = modifyTrace?.resolvedWorkbookTarget;
         const requiredTargetFields = Array.isArray(editOperationContracts?.traceContract?.resolvedWorkbookTargetFields)
            ? editOperationContracts.traceContract.resolvedWorkbookTargetFields
            : ['id', 'name', 'path'];
         if (!isPlainObject(target)) {
            errors.push(
               createError(
                  check.id,
                  'Modify trace requires resolvedWorkbookTarget object with id/name/path fields.',
                  '/modifyTrace/resolvedWorkbookTarget',
                  check.fixHint
               )
            );
         } else {
            for (const fieldName of requiredTargetFields) {
               if (!Object.prototype.hasOwnProperty.call(target, fieldName)) {
                  errors.push(
                     createError(
                        check.id,
                        `Modify trace resolvedWorkbookTarget missing field '${fieldName}'.`,
                        '/modifyTrace/resolvedWorkbookTarget',
                        check.fixHint
                     )
                  );
               }
            }
            if (typeof target.id !== 'string' || target.id.trim() === '') {
               errors.push(
                  createError(
                     check.id,
                     'Modify trace resolvedWorkbookTarget.id must be a non-empty string.',
                     '/modifyTrace/resolvedWorkbookTarget/id',
                     check.fixHint
                  )
               );
            }
         }

         if (
            modifyContext?.requestedOperation &&
            modifyTrace?.requestedOperation &&
            modifyTrace.requestedOperation !== modifyContext.requestedOperation
         ) {
            errors.push(
               createError(
                  check.id,
                  `Modify trace requestedOperation '${modifyTrace.requestedOperation}' does not match requested operation '${modifyContext.requestedOperation}'.`,
                  '/modifyTrace/requestedOperation',
                  check.fixHint
               )
            );
         }
         if (
            modifyContext?.sourceMode &&
            modifyTrace?.sourceMode &&
            modifyTrace.sourceMode !== modifyContext.sourceMode
         ) {
            errors.push(
               createError(
                  check.id,
                  `Modify trace sourceMode '${modifyTrace.sourceMode}' does not match expected sourceMode '${modifyContext.sourceMode}'.`,
                  '/modifyTrace/sourceMode',
                  check.fixHint
               )
            );
         }
         if (
            modifyContext?.resolvedWorkbookTarget?.id &&
            target?.id &&
            target.id !== modifyContext.resolvedWorkbookTarget.id
         ) {
            errors.push(
               createError(
                  check.id,
                  `Modify trace resolvedWorkbookTarget.id '${target.id}' does not match expected id '${modifyContext.resolvedWorkbookTarget.id}'.`,
                  '/modifyTrace/resolvedWorkbookTarget/id',
                  check.fixHint
               )
            );
         }
      }
   }

   return errors;
}

function checkTable(pluginView, checks = semanticRules.pluginFamilyChecks?.table || []) {
   const errors = [];
   const logicalEdges = getLogicalEdges(pluginView) || {};
   const columnLayerTokens = (layers) => (Array.isArray(layers) ? layers : [])
      .filter((layer) => layer?.type === 'column' && typeof layer?.columnID === 'string' && layer.columnID !== '')
      .map((layer) => `${layer.columnID}\u0000${typeof layer.duplicateID === 'string' ? layer.duplicateID : ''}`);
   const physicalRowLayers = getEdgeLayers(getEdgeByAxis(pluginView, 'row'));
   const physicalRowTokens = columnLayerTokens(physicalRowLayers);
   const logicalRowTokens = columnLayerTokens(logicalEdges?.row?.logicalEdgeLayers);

   for (const check of checks) {
      if (check.id === 'TABLE_COLUMN_EDGE_EMPTY') {
         const columnEdge = getEdgeByAxis(pluginView, 'column');
         const layers = getEdgeLayers(columnEdge);
         if (layers.length > 0) {
            errors.push(createError(check.id, 'Table column edge must not contain layers.', '/views/children/*/dataModels/children/0/edges/children[column]', check.fixHint));
         }
      }

      if (check.id === 'TABLE_ROW_EDGE_HAS_BINDING') {
         if (physicalRowTokens.length === 0 || physicalRowTokens.length > 50 || physicalRowTokens.length !== physicalRowLayers.length) {
            errors.push(createError(check.id, 'Table row edge must contain between 1 and 50 column layers.', '/views/children/*/dataModels/children/0/edges/children[row]', check.fixHint));
         }
      }

      if (check.id === 'TABLE_ROW_EDGE_PARITY') {
         const rowsMatch = logicalRowTokens.length === physicalRowTokens.length
            && logicalRowTokens.every((value, index) => value === physicalRowTokens[index]);
         if (!rowsMatch) {
            errors.push(createError(check.id, 'Table logical row bindings must match execution row bindings in order.', '/views/children/*/dataModels/children/0/edges/children[row]/edgeLayers', check.fixHint));
         }
      }

      if (check.id === 'TABLE_LOGICAL_COLUMN_EDGE_EMPTY') {
         const hasLogicalColumn = Object.prototype.hasOwnProperty.call(logicalEdges, 'column');
         if (hasLogicalColumn) {
            errors.push(createError(check.id, 'Table logical column edge must be absent.', '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/column', check.fixHint));
         }
      }
   }

   return errors;
}

function getAutovizNestedMeasure(pluginView) {
   const nestedMeasureView = (pluginView?.nestedViews?.children || []).find(
      (nested) => nested?.position === 'embedded' && nested?.view?.viewName === 'MeasureView_0'
   );
   return nestedMeasureView?.view?.dataModels?.children?.[0]?.measuresList?.children?.[0] || null;
}

function validatePropertyAdditionContract(additions, requirements) {
   const additionsByID = new Map(
      additions
         .filter((entry) => entry?.id)
         .map((entry) => [entry.id, entry])
   );
   const violations = [];
   for (const [requiredID, requiredShape] of Object.entries(requirements)) {
      const entry = additionsByID.get(requiredID);
      if (!entry) {
         violations.push(`${requiredID} missing`);
         continue;
      }
      if (entry.valueColumnID == null || entry.valueColumnID === '') {
         violations.push(`${requiredID}.valueColumnID missing`);
      }
      for (const [fieldName, expectedValue] of Object.entries(requiredShape)) {
         if (!(fieldName in entry)) {
            violations.push(`${requiredID}.${fieldName} missing`);
         } else if (entry[fieldName] !== expectedValue) {
            violations.push(
               `${requiredID}.${fieldName}=${JSON.stringify(entry[fieldName])} (expected ${JSON.stringify(expectedValue)})`
            );
         }
      }
   }
   return violations;
}

function getEmbeddedNestedPluginViews(pluginView) {
   const nestedViews = Array.isArray(pluginView?.nestedViews?.children)
      ? pluginView.nestedViews.children
      : [];
   return nestedViews
      .map((entry, index) => ({
         entry,
         index,
         view: entry?.view
      }))
      .filter((entry) => (
         entry.entry?.position === 'embedded' &&
         isPlainObject(entry.view) &&
         entry.view.type === 'saw:pluginView'
      ));
}

function getMeasureListViewNames(dataModel) {
   const measuresList = Array.isArray(dataModel?.measuresList?.children)
      ? dataModel.measuresList.children
      : [];
   return measuresList
      .filter((entry) => entry?.type === 'view')
      .map((entry) => toNonEmptyTrimmedString(entry?.name))
      .filter((name) => typeof name === 'string');
}

function hasLogicalEdgeLayerTag(layer, tagName) {
   return Array.isArray(layer?.tags) && layer.tags.includes(tagName);
}

function getScatterMeasureLayers(logicalEdges) {
   const measureLayers = logicalEdges?.measures?.logicalEdgeLayers;
   if (!Array.isArray(measureLayers)) {
      return [];
   }
   return measureLayers.filter((layer) => (
      isPlainObject(layer) &&
      isMeasureLayer(layer) &&
      normalizeColumnID(layer?.columnID) !== ''
   ));
}

function getNestedMeasureViewDataModel(pluginView) {
   const nestedMeasureView = (pluginView?.nestedViews?.children || []).find(
      (nested) => nested?.position === 'embedded' && nested?.view?.viewName === 'MeasureView_0'
   );
   return nestedMeasureView?.view?.dataModels?.children?.[0] || null;
}

function getScatterTaggedMeasureIDs(logicalEdges) {
   const taggedIDs = {
      x: null,
      y: null
   };
   for (const layer of getScatterMeasureLayers(logicalEdges)) {
      if (!taggedIDs.x && hasLogicalEdgeLayerTag(layer, SCATTER_X_TAG)) {
         taggedIDs.x = normalizeColumnID(layer?.columnID);
      }
      if (!taggedIDs.y && hasLogicalEdgeLayerTag(layer, SCATTER_Y_TAG)) {
         taggedIDs.y = normalizeColumnID(layer?.columnID);
      }
   }
   return taggedIDs;
}

function getFirstLogicalEdgeColumnID(logicalEdges, edgeName) {
   const layers = logicalEdges?.[edgeName]?.logicalEdgeLayers;
   if (!Array.isArray(layers)) {
      return null;
   }
   for (const layer of layers) {
      const columnID = normalizeColumnID(layer?.columnID);
      if (columnID) {
         return columnID;
      }
   }
   return null;
}

function getNestedExecutionColumnIDs(nestedDataModel, axis) {
   const edge = (nestedDataModel?.edges?.children || []).find((candidate) => candidate?.axis === axis);
   const layers = Array.isArray(edge?.edgeLayers?.children) ? edge.edgeLayers.children : [];
   return layers
      .filter((layer) => layer?.type === 'column')
      .map((layer) => normalizeColumnID(layer?.columnID))
      .filter(Boolean);
}

function getScatterContinuousColorMeasureID(logicalEdges, nestedDataModel) {
   const colorColumnID = getFirstLogicalEdgeColumnID(logicalEdges, 'color');
   if (!colorColumnID) {
      return null;
   }
   const nestedMeasures = Array.isArray(nestedDataModel?.measuresList?.children)
      ? nestedDataModel.measuresList.children
      : [];
   const hasContinuousColorAddition = nestedMeasures.some((measure) => {
      const additions = Array.isArray(measure?.propertyAdditions?.children)
         ? measure.propertyAdditions.children
         : [];
      return additions.some((addition) => (
         ['colorMin', 'colorMax', 'color'].includes(addition?.id) &&
         normalizeColumnID(addition?.valueColumnID) === colorColumnID
      ));
   });
   return hasContinuousColorAddition ? colorColumnID : null;
}

function buildScatterNestedPropertyRequirements(xMeasureID, yMeasureID, colorMeasureID) {
   const requirements = {};
   for (const measureID of [xMeasureID, yMeasureID]) {
      if (!measureID) {
         continue;
      }
      requirements[`min.${measureID}`] = {
         valueColumnID: measureID,
         aggRule: 'min',
         placement: 'first_cell',
         stacked: false,
         grainEdge: 'none',
         acrossMeasures: 'single'
      };
      requirements[`max.${measureID}`] = {
         valueColumnID: measureID,
         aggRule: 'max',
         placement: 'first_cell',
         stacked: false,
         grainEdge: 'none',
         acrossMeasures: 'single'
      };
      requirements[`median.${measureID}`] = {
         valueColumnID: measureID,
         aggRule: 'median',
         placement: 'first_cell',
         stacked: false,
         grainEdge: 'none',
         acrossMeasures: 'single'
      };
   }
   if (colorMeasureID) {
      requirements.colorMin = {
         valueColumnID: colorMeasureID,
         aggRule: 'min',
         placement: 'first_cell',
         stacked: false,
         grainEdge: 'none',
         acrossMeasures: 'single'
      };
      requirements.colorMax = {
         valueColumnID: colorMeasureID,
         aggRule: 'max',
         placement: 'first_cell',
         stacked: false,
         grainEdge: 'none',
         acrossMeasures: 'single'
      };
      requirements.color = {
         valueColumnID: colorMeasureID,
         aggRule: 'default',
         placement: 'all',
         stacked: false,
         grainEdge: 'none',
         acrossMeasures: 'single'
      };
   }
   return requirements;
}

function propertyAdditionsFromRequirements(requirements) {
   return Object.entries(requirements).map(([id, shape]) => ({
      id,
      ...shape
   }));
}

function checkAutovizMeasureParity(pluginView, check) {
   const dataModel = getPrimaryDataModel(pluginView);
   const logicalEdges = getLogicalEdges(pluginView);
   const logicalMeasureIDs = (logicalEdges?.measures?.logicalEdgeLayers || [])
      .filter((layer) => layer?.type === 'column')
      .map((layer) => normalizeColumnID(layer?.columnID))
      .filter(Boolean);
   const nestedDataModel = getNestedMeasureViewDataModel(pluginView);
   const nestedMeasureIDs = (nestedDataModel?.measuresList?.children || [])
      .filter((measure) => measure?.type === 'column')
      .map((measure) => normalizeColumnID(measure?.columnID))
      .filter(Boolean);
   const outerMeasureViewIDs = (dataModel?.measuresList?.children || [])
      .filter((measure) => measure?.type === 'view' && measure?.name === 'MeasureView_0')
      .map((measure) => normalizeColumnID(measure?.columnID))
      .filter(Boolean);
   const logicalNestedMatch = logicalMeasureIDs.length > 0
      && logicalMeasureIDs.length === nestedMeasureIDs.length
      && logicalMeasureIDs.every((columnID, index) => nestedMeasureIDs[index] === columnID);
   const outerReferenceMatch = outerMeasureViewIDs.length === 1
      && outerMeasureViewIDs[0] === nestedMeasureIDs[0]
      && logicalMeasureIDs.includes(outerMeasureViewIDs[0]);
   if (logicalNestedMatch && outerReferenceMatch) {
      return [];
   }
   return [
      createError(
         check.id,
         `Autoviz MeasureView_0 outer reference (${outerMeasureViewIDs.join(', ') || 'none'}), logical measures (${logicalMeasureIDs.join(', ') || 'none'}), and nested measures (${nestedMeasureIDs.join(', ') || 'none'}) must preserve the same primary measure and ordered logical/nested measure set.`,
         '/views/children/*/dataModels/children/0/measuresList',
         check.fixHint
      )
   ];
}

function checkAutoviz(pluginView, checks = semanticRules.pluginFamilyChecks?.chart_autoviz || []) {
   const errors = [];
   const pluginType = pluginView?.pluginType;
   const dataModel = getPrimaryDataModel(pluginView);
   const logicalEdges = getLogicalEdges(pluginView);
   const nestedMeasure = getAutovizNestedMeasure(pluginView);

   for (const check of checks) {
      if (check.id === 'AUTOVIZ_HAS_INNER_PLUGIN_TYPE') {
         const inner = pluginView?.viewConfig?.settings?.['obitech-autoviz/autoviz']?.innerPluginType;
         if (inner !== pluginType) {
            errors.push(createError(check.id, 'Autoviz innerPluginType must match pluginType.', '/views/children/*/viewConfig/settings/obitech-autoviz~1autoviz/innerPluginType', check.fixHint));
         }
      }

      if (check.id === 'AUTOVIZ_HAS_MEASURES_LIST_VIEW_ENTRY') {
         const hasMeasureView = (dataModel?.measuresList?.children || []).some((item) => item?.type === 'view' && item?.name === 'MeasureView_0');
         if (!hasMeasureView) {
            errors.push(createError(check.id, 'Autoviz main data model must include MeasureView_0 measuresList entry.', '/views/children/*/dataModels/children/0/measuresList', check.fixHint));
         }
      }

      if (check.id === 'AUTOVIZ_HAS_NESTED_MEASURE_VIEW') {
         const hasNested = Boolean(nestedMeasure);
         if (!hasNested) {
            errors.push(createError(check.id, 'Autoviz view must include embedded MeasureView_0 nested view.', '/views/children/*/nestedViews', check.fixHint));
         }
      }

      if (check.id === 'AUTOVIZ_LOGICAL_NESTED_MEASURE_PARITY') {
         errors.push(...checkAutovizMeasureParity(pluginView, check));
      }

      if (check.id === 'AUTOVIZ_HAS_COLOR_EDGE_WITH_HIDDEN_MEASURE') {
         const colorLayers = logicalEdges?.color?.logicalEdgeLayers || [];
         const hasHiddenMeasure = colorLayers.some((layer) => layer?.type === 'measure' && layer?.visibility === 'hidden');
         if (!hasHiddenMeasure) {
            errors.push(createError(check.id, 'Autoviz color logical edge must include hidden measure layer.', '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/color', check.fixHint));
         }
      }

      if (check.id === 'AUTOVIZ_HAS_NESTED_PROPERTY_ADDITIONS') {
         const additions = nestedMeasure?.propertyAdditions?.children || [];
         const violations = validatePropertyAdditionContract(additions, AUTOVIZ_BASE_PROPERTY_ADDITION_REQUIREMENTS);
         if (violations.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Nested measure propertyAdditions invalid: ${violations.join('; ')}.`,
                  '/views/children/*/nestedViews/children/0/view/dataModels/children/0/measuresList/children/0/propertyAdditions',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'AUTOVIZ_DONUT_HAS_MIN_MAX_PROPERTY_ADDITIONS') {
         if (pluginType !== 'oracle.bi.tech.chart.donut') {
            continue;
         }
         const measureColumnID = nestedMeasure?.columnID;
         if (!measureColumnID) {
            errors.push(
               createError(
                  check.id,
                  'Donut nested MeasureView_0 must include a measure column binding before min/max validation.',
                  '/views/children/*/nestedViews/children/0/view/dataModels/children/0/measuresList/children/0/columnID',
                  check.fixHint
               )
            );
            continue;
         }
         const additions = nestedMeasure?.propertyAdditions?.children || [];
         const donutRequirements = {
            [`min.${measureColumnID}`]: {
               aggRule: 'min',
               placement: 'first_cell',
               stacked: false,
               grainEdge: 'none',
               acrossMeasures: 'single'
            },
            [`max.${measureColumnID}`]: {
               aggRule: 'max',
               placement: 'first_cell',
               stacked: false,
               grainEdge: 'none',
               acrossMeasures: 'single'
            }
         };
         const violations = validatePropertyAdditionContract(additions, donutRequirements);
         if (violations.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Donut nested measure propertyAdditions invalid: ${violations.join('; ')}.`,
                  '/views/children/*/nestedViews/children/0/view/dataModels/children/0/measuresList/children/0/propertyAdditions',
                  check.fixHint
               )
            );
         }
      }

      if (pluginType === 'oracle.bi.tech.chart.scatter' && check.id === 'SCATTER_SINGLE_NESTED_MARKING_VIEW') {
         const embeddedNestedViews = getEmbeddedNestedPluginViews(pluginView);
         const hasSingleMeasureView = embeddedNestedViews.length === 1 &&
            embeddedNestedViews[0]?.view?.viewName === 'MeasureView_0';
         if (!hasSingleMeasureView) {
            const nestedNames = embeddedNestedViews
               .map((entry) => entry?.view?.viewName)
               .filter(Boolean)
               .join(', ');
            errors.push(
               createError(
                  check.id,
                  `Scatter must use exactly one embedded nested MeasureView_0 for marking runtime compatibility; found ${embeddedNestedViews.length}${nestedNames ? ` (${nestedNames})` : ''}.`,
                  '/views/children/*/nestedViews',
                  check.fixHint
               )
            );
         }
      }

      if (pluginType === 'oracle.bi.tech.chart.scatter' && check.id === 'SCATTER_MEASURE_VIEW_SINGLE_REFERENCE') {
         const viewNames = Array.from(new Set(getMeasureListViewNames(dataModel)));
         const invalidNames = viewNames.filter((name) => name !== 'MeasureView_0');
         if (invalidNames.length > 0 || viewNames.length > 1) {
            errors.push(
               createError(
                  check.id,
                  `Scatter main measuresList may reference only MeasureView_0; found ${viewNames.join(', ') || 'none'}.`,
                  '/views/children/*/dataModels/children/0/measuresList',
                  check.fixHint
               )
            );
         }
      }

      if (pluginType === 'oracle.bi.tech.chart.scatter' && check.id === 'SCATTER_MEASURE_XY_TAGS_REQUIRED') {
         const measureLayers = getScatterMeasureLayers(logicalEdges);
         if (measureLayers.length === 0) {
            errors.push(
               createError(
                  check.id,
                  'Scatter logicalEdges.measures must include x/y tagged measure layers.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/measures',
                  check.fixHint
               )
            );
            continue;
         }
         const untagged = measureLayers.filter((layer) => (
            !hasLogicalEdgeLayerTag(layer, SCATTER_X_TAG) &&
            !hasLogicalEdgeLayerTag(layer, SCATTER_Y_TAG)
         ));
         const xLayers = measureLayers.filter((layer) => hasLogicalEdgeLayerTag(layer, SCATTER_X_TAG));
         const yLayers = measureLayers.filter((layer) => hasLogicalEdgeLayerTag(layer, SCATTER_Y_TAG));
         if (untagged.length > 0) {
            const untaggedIDs = untagged.map((layer) => normalizeColumnID(layer?.columnID)).filter(Boolean).join(', ');
            errors.push(
               createError(
                  check.id,
                  `Scatter measure layers must carry ${SCATTER_X_TAG} or ${SCATTER_Y_TAG} tags; untagged measures: ${untaggedIDs || 'unknown'}.`,
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/measures/logicalEdgeLayers',
                  check.fixHint
               )
            );
         }
         if (xLayers.length !== 1 || yLayers.length !== 1) {
            errors.push(
               createError(
                  check.id,
                  `Scatter requires exactly one ${SCATTER_X_TAG} layer and one ${SCATTER_Y_TAG} layer; found ${xLayers.length} x-tagged and ${yLayers.length} y-tagged measure layers.`,
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/measures/logicalEdgeLayers',
                  check.fixHint
               )
            );
         }
      }

      if (pluginType === 'oracle.bi.tech.chart.scatter' && check.id === 'SCATTER_NESTED_MEASURE_PROPERTY_ADDITIONS') {
         const taggedIDs = getScatterTaggedMeasureIDs(logicalEdges);
         const xMeasureID = taggedIDs.x;
         const yMeasureID = taggedIDs.y;
         const nestedDataModel = getNestedMeasureViewDataModel(pluginView);
         const colorMeasureID = getScatterContinuousColorMeasureID(logicalEdges, nestedDataModel);
         const nestedMeasures = Array.isArray(nestedDataModel?.measuresList?.children)
            ? nestedDataModel.measuresList.children
            : [];
         const xNestedMeasure = nestedMeasures.find((measure) => normalizeColumnID(measure?.columnID) === xMeasureID);
         const yNestedMeasure = nestedMeasures.find((measure) => normalizeColumnID(measure?.columnID) === yMeasureID);
         const missing = [];
         if (!xMeasureID || !xNestedMeasure) {
            missing.push('x nested measure');
         }
         if (!yMeasureID || !yNestedMeasure) {
            missing.push('y nested measure');
         }
         if (missing.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Scatter nested MeasureView_0 is missing required ${missing.join(' and ')}.`,
                  '/views/children/*/nestedViews/children/0/view/dataModels/children/0/measuresList',
                  check.fixHint
               )
            );
            continue;
         }
         const tagViolations = [];
         if (!hasLogicalEdgeLayerTag(xNestedMeasure, SCATTER_X_TAG)) {
            tagViolations.push(`${xMeasureID} missing ${SCATTER_X_TAG}`);
         }
         if (!hasLogicalEdgeLayerTag(yNestedMeasure, SCATTER_Y_TAG)) {
            tagViolations.push(`${yMeasureID} missing ${SCATTER_Y_TAG}`);
         }
         const xAdditions = Array.isArray(xNestedMeasure?.propertyAdditions?.children)
            ? xNestedMeasure.propertyAdditions.children
            : [];
         const xRequirements = buildScatterNestedPropertyRequirements(xMeasureID, yMeasureID, colorMeasureID);
         const xViolations = validatePropertyAdditionContract(xAdditions, xRequirements);
         const yAdditions = Array.isArray(yNestedMeasure?.propertyAdditions?.children)
            ? yNestedMeasure.propertyAdditions.children
            : [];
         const yViolations = colorMeasureID
            ? validatePropertyAdditionContract(yAdditions, {
               color: {
                  valueColumnID: colorMeasureID,
                  aggRule: 'default',
                  placement: 'all',
                  stacked: false,
                  grainEdge: 'none',
                  acrossMeasures: 'single'
               }
            })
            : [];
         const violations = [...tagViolations, ...xViolations, ...yViolations];
         if (violations.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Scatter nested MeasureView_0 runtime scaffold invalid: ${violations.join('; ')}.`,
                  '/views/children/*/nestedViews/children/0/view/dataModels/children/0/measuresList',
                  check.fixHint
               )
            );
         }
      }

      if (pluginType === 'oracle.bi.tech.chart.scatter' && check.id === 'SCATTER_CATEGORICAL_COLOR_EXECUTION_BINDING') {
         const nestedDataModel = getNestedMeasureViewDataModel(pluginView);
         const colorColumnID = getFirstLogicalEdgeColumnID(logicalEdges, 'color');
         const continuousColorMeasureID = getScatterContinuousColorMeasureID(logicalEdges, nestedDataModel);
         if (colorColumnID && !continuousColorMeasureID) {
            const executionColumnIDs = getNestedExecutionColumnIDs(nestedDataModel, 'column');
            if (!executionColumnIDs.includes(colorColumnID)) {
               errors.push(
                  createError(
                     check.id,
                     `Scatter categorical color '${colorColumnID}' must be present on the nested MeasureView_0 execution column edge.`,
                     '/views/children/*/nestedViews/children/0/view/dataModels/children/0/edges/children[column]/edgeLayers',
                     check.fixHint
                  )
               );
            }
         }
      }

      if (pluginType === 'oracle.bi.tech.chart.scatter' && check.id === 'SCATTER_MEASURE_DIMENSION_EXECUTION_BINDING') {
         const nestedDataModel = getNestedMeasureViewDataModel(pluginView);
         const executionColumnEdge = (nestedDataModel?.edges?.children || []).find((edge) => edge?.axis === 'column');
         const executionColumnLayers = Array.isArray(executionColumnEdge?.edgeLayers?.children)
            ? executionColumnEdge.edgeLayers.children
            : [];
         const measureDimensionLayers = executionColumnLayers.filter((layer) => (
            layer?.type === 'measure' && layer?.visibility === 'hidden'
         ));
         if (measureDimensionLayers.length !== 1) {
            errors.push(
               createError(
                  check.id,
                  `Scatter nested MeasureView_0 execution column edge requires exactly one hidden Measure Dimension layer; found ${measureDimensionLayers.length}.`,
                  '/views/children/*/nestedViews/children/0/view/dataModels/children/0/edges/children[column]/edgeLayers',
                  check.fixHint
               )
            );
         }
      }
   }

   if (pluginType !== 'oracle.bi.tech.chart.comboMultiLayerChart'
      && !checks.some((check) => check.id === 'AUTOVIZ_LOGICAL_NESTED_MEASURE_PARITY')) {
      const parityCheck = semanticCheckDefinitionById.get('AUTOVIZ_LOGICAL_NESTED_MEASURE_PARITY');
      if (parityCheck) {
         errors.push(...checkAutovizMeasureParity(pluginView, parityCheck));
      }
   }

   return errors;
}

function checkComboMultilayer(pluginView, profile, checks = semanticRules.pluginFamilyChecks?.chart_combo_multilayer || []) {
   const errors = [];
   const dataModel = getPrimaryDataModel(pluginView);
   const nestedMeasureView = (pluginView?.nestedViews?.children || []).find(
      (nested) => nested?.position === 'embedded' && nested?.view?.viewName === 'MeasureView_0'
   )?.view;
   const comboSettings = pluginView?.viewConfig?.settings?.['oracle.bi.tech.chart.comboMultiLayerChart']?.settings || {};
   const comboViewDataLayers = comboSettings?.dataLayersInfo || {};
   const ldm = dataModel?.logicalDataModel?.settings?.logicalDataModel || {};
   const ldmDataLayersInfo = ldm?.dataLayersInfo || {};
   const declaredLayers = Object.keys(ldmDataLayersInfo?.dataLayers || {});
   const nestedModels = nestedMeasureView?.dataModels?.children || [];
   const nestedModelsByName = new Map(nestedModels.map((model) => [model?.name, model]));
   const schemaCapabilities = getSchemaCapabilities(profile, 'chart_combo_multilayer');
   const allowMeasureInfos = schemaCapabilities.allowMeasureInfos !== false;

   errors.push(...checkAutoviz(pluginView, checks));

   for (const check of checks) {
      if (check.id === 'COMBO_HAS_PLUGIN_DATALAYERS_INFO') {
         const keys = Object.keys(comboViewDataLayers).filter((key) => typeof key === 'string' && key.trim() !== '');
         if (keys.length === 0) {
            errors.push(
               createError(
                  check.id,
                  'Combo viewConfig must include non-empty dataLayersInfo entries.',
                  '/views/children/*/viewConfig/settings/oracle.bi.tech.chart.comboMultiLayerChart/settings/dataLayersInfo',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'COMBO_HAS_LDM_DATALAYERS_INFO') {
         if (!ldmDataLayersInfo || typeof ldmDataLayersInfo !== 'object' || declaredLayers.length === 0) {
            errors.push(
               createError(
                  check.id,
                  'Combo logicalDataModel must include dataLayersInfo.dataLayers entries.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/dataLayersInfo',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'COMBO_ACTIVE_LAYER_IS_VALID') {
         const activeDataLayer = ldmDataLayersInfo?.activeDataLayer;
         if (!activeDataLayer || !declaredLayers.includes(activeDataLayer)) {
            errors.push(
               createError(
                  check.id,
                  'Combo activeDataLayer must be non-empty and match a declared data layer.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/dataLayersInfo/activeDataLayer',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'COMBO_NESTED_LAYER_MODELS_MATCH_DECLARED_LAYERS') {
         for (const layerName of declaredLayers) {
            if (!nestedModelsByName.has(layerName)) {
               errors.push(
                  createError(
                     check.id,
                     `Missing nested MeasureView_0 data model for layer '${layerName}'.`,
                     '/views/children/*/nestedViews/children/0/view/dataModels/children',
                     check.fixHint
                  )
               );
            }
         }
      }

      if (check.id === 'COMBO_LAYER_MEASURE_BINDING_NON_EMPTY') {
         for (const layerName of declaredLayers) {
            const nestedModel = nestedModelsByName.get(layerName);
            const measures = nestedModel?.measuresList?.children || [];
            const hasMeasureBinding = measures.some((entry) => typeof entry?.columnID === 'string' && entry.columnID.trim() !== '');
            const hasPropertyAdditions = measures.some((entry) => (entry?.propertyAdditions?.children || []).length > 0);
            if (!hasMeasureBinding || !hasPropertyAdditions) {
               errors.push(
                  createError(
                     check.id,
                     `Nested combo layer '${layerName}' must include non-empty measure binding and propertyAdditions.`,
                     '/views/children/*/nestedViews/children/0/view/dataModels/children',
                     check.fixHint
                  )
               );
            }
         }
      }

      if (check.id === 'COMBO_LOGICAL_EDGE_TO_LAYER_MAPPING_NON_EMPTY') {
         for (const layerName of declaredLayers) {
            const ldmLayer = ldmDataLayersInfo?.dataLayers?.[layerName];
            const dataModelName = ldmLayer?.dataModelName;
            const viewType = comboViewDataLayers?.[layerName];
            const logicalLayerMeasures = ldmLayer?.logicalDataModel?.logicalEdges?.measures?.logicalEdgeLayers || [];
            const hasMeasureColumn = logicalLayerMeasures.some((layer) => typeof layer?.columnID === 'string' && layer.columnID.trim() !== '');

            if (!dataModelName || dataModelName !== layerName || !viewType || !hasMeasureColumn) {
               errors.push(
                  createError(
                     check.id,
                     `Combo layer '${layerName}' must have aligned layer names and non-empty logicalEdges.measures binding.`,
                     '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/dataLayersInfo',
                     check.fixHint
                  )
               );
            }
         }
      }

      if (check.id === 'COMBO_MEASURE_INFOS_ALLOWED_BY_PROFILE') {
         if (!allowMeasureInfos && comboSettings && Object.prototype.hasOwnProperty.call(comboSettings, 'measureInfos')) {
            errors.push(
               createError(
                  check.id,
                  'Current runtime profile does not allow combo measureInfos in viewConfig settings.',
                  '/views/children/*/viewConfig/settings/oracle.bi.tech.chart.comboMultiLayerChart/settings/measureInfos',
                  check.fixHint
               )
            );
         }
      }
   }

   return errors;
}

function checkRowColumnLogicalEdges(pluginView, check) {
   const logicalEdges = getLogicalEdges(pluginView);
   const hasRow = (logicalEdges?.row?.logicalEdgeLayers || []).length > 0;
   const hasColOrColumnOrMeasures =
      (logicalEdges?.col?.logicalEdgeLayers || []).length > 0 ||
      (logicalEdges?.column?.logicalEdgeLayers || []).length > 0 ||
      (logicalEdges?.measures?.logicalEdgeLayers || []).length > 0;
   if (!hasRow || !hasColOrColumnOrMeasures) {
      return [createError(check.id, 'Plugin must include row plus col/column/measures logical edge bindings.', '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges', check.fixHint)];
   }
   return [];
}

function checkAnyLogicalEdgeBinding(pluginView, check) {
   const logicalEdges = getLogicalEdges(pluginView);
   if (!isPlainObject(logicalEdges)) {
      return [createError(check.id, 'Plugin must include at least one logical edge binding.', '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges', check.fixHint)];
   }
   const hasAnyLayer = Object.values(logicalEdges).some((edge) => Array.isArray(edge?.logicalEdgeLayers) && edge.logicalEdgeLayers.length > 0);
   if (!hasAnyLayer) {
      return [createError(check.id, 'Plugin must include at least one logical edge binding.', '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges', check.fixHint)];
   }
   return [];
}

function checkMeasureBinding(pluginView, check) {
   const referencedIDs = collectColumnIDs(getPrimaryDataModel(pluginView));
   const hasMeasure = Array.from(referencedIDs).some((columnID) => String(columnID).startsWith('mea_'));
   if (!hasMeasure) {
      return [createError(check.id, 'Primary measure binding is required for this plugin family.', '/views/children/*/dataModels/children/0', check.fixHint)];
   }
   return [];
}

function isMeasureLayer(layer) {
   const columnID = String(layer?.columnID || '');
   return columnID.startsWith('mea_') || typeof layer?.aggRule === 'string';
}

function checkPivot(pluginView, checks = semanticRules.pluginFamilyChecks?.pivot || []) {
   const errors = [];
   const logicalEdges = getLogicalEdges(pluginView);
   const dataModel = getPrimaryDataModel(pluginView);
   const columnLayerTokens = (layers) => (Array.isArray(layers) ? layers : [])
      .filter((layer) => layer?.type === 'column' && typeof layer?.columnID === 'string' && layer.columnID !== '')
      .map((layer) => `${layer.columnID}\u0000${typeof layer.duplicateID === 'string' ? layer.duplicateID : ''}`);
   const arraysEqual = (left, right) => left.length === right.length
      && left.every((value, index) => value === right[index]);
   const logicalRowTokens = columnLayerTokens(logicalEdges?.row?.logicalEdgeLayers);
   const logicalColumnTokens = columnLayerTokens(logicalEdges?.col?.logicalEdgeLayers);
   const logicalMeasureTokens = columnLayerTokens(logicalEdges?.measures?.logicalEdgeLayers);
   const physicalRowTokens = columnLayerTokens(getEdgeLayers(getEdgeByAxis(pluginView, 'row')));
   const physicalColumnTokens = columnLayerTokens(getEdgeLayers(getEdgeByAxis(pluginView, 'column')));
   const measuresListTokens = columnLayerTokens(dataModel?.measuresList?.children);

   for (const check of checks) {
      if (check.id === 'PIVOT_HAS_ROW_EDGE_BINDING') {
         const rowLayers = logicalEdges?.row?.logicalEdgeLayers || [];
         if (rowLayers.length === 0) {
            errors.push(
               createError(
                  check.id,
                  'Pivot requires at least one row logical edge layer.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/row',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PIVOT_HAS_COLUMN_EDGE_BINDING') {
         const colLayers = logicalEdges?.col?.logicalEdgeLayers || [];
         if (colLayers.length === 0) {
            const hasLegacyColumn = Object.prototype.hasOwnProperty.call(logicalEdges, 'column');
            const detail = hasLegacyColumn
               ? "Found legacy logicalEdges.column; pivot requires logicalEdges.col for this schema profile."
               : 'Pivot requires at least one column logical edge layer.';
            errors.push(
               createError(
                  check.id,
                  detail,
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/col',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PIVOT_HAS_MEASURES_BINDING') {
         const measureLayers = logicalEdges?.measures?.logicalEdgeLayers || [];
         if (!measureLayers.some((layer) => isMeasureLayer(layer))) {
            errors.push(
               createError(
                  check.id,
                  'Pivot requires at least one measure logical edge layer.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/measures',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PIVOT_ROW_EDGE_PARITY' && !arraysEqual(logicalRowTokens, physicalRowTokens)) {
         errors.push(
            createError(
               check.id,
               'Pivot logical row bindings must match execution row bindings in order.',
               '/views/children/*/dataModels/children/0/edges/children[row]/edgeLayers',
               check.fixHint
            )
         );
      }
      if (check.id === 'PIVOT_COLUMN_EDGE_PARITY' && !arraysEqual(logicalColumnTokens, physicalColumnTokens)) {
         errors.push(
            createError(
               check.id,
               'Pivot logical column bindings must match execution column bindings in order.',
               '/views/children/*/dataModels/children/0/edges/children[column]/edgeLayers',
               check.fixHint
            )
         );
      }
      if (check.id === 'PIVOT_MEASURES_LIST_PARITY' && !arraysEqual(logicalMeasureTokens, measuresListTokens)) {
         errors.push(
            createError(
               check.id,
               'Pivot logical measure bindings must match measuresList bindings in order.',
               '/views/children/*/dataModels/children/0/measuresList/children',
               check.fixHint
            )
         );
      }
   }

   return errors;
}

function normalizeExpressionForComparison(expression) {
   if (typeof expression !== 'string') {
      return '';
   }
   return expression.replace(/\s+/g, '').toLowerCase();
}

function getTaggedItemLayer(logicalEdges, tagName) {
   const itemLayers = logicalEdges?.item?.logicalEdgeLayers;
   if (!Array.isArray(itemLayers)) {
      return null;
   }
   return itemLayers.find((layer) => (
      isPlainObject(layer) &&
      Array.isArray(layer.tags) &&
      layer.tags.includes(tagName)
   )) || null;
}

function getGanttStartEndBinding(workbook, logicalEdges) {
   const startLayer = getTaggedItemLayer(logicalEdges, 'obitech-gantt#start');
   const endLayer = getTaggedItemLayer(logicalEdges, 'obitech-gantt#end');
   const startColumnID = normalizeColumnID(startLayer?.columnID);
   const endColumnID = normalizeColumnID(endLayer?.columnID);
   const startColumn = startColumnID ? getCriteriaColumnByID(workbook, startColumnID) : null;
   const endColumn = endColumnID ? getCriteriaColumnByID(workbook, endColumnID) : null;
   const startExpression = getCriteriaColumnExpressionText(startColumn);
   const endExpression = getCriteriaColumnExpressionText(endColumn);
   return {
      startLayer,
      endLayer,
      startColumnID,
      endColumnID,
      startColumn,
      endColumn,
      startExpression,
      endExpression,
      normalizedStartExpression: normalizeExpressionForComparison(startExpression),
      normalizedEndExpression: normalizeExpressionForComparison(endExpression)
   };
}

function checkGantt(workbook, pluginView, checks = semanticRules.pluginFamilyChecks?.gantt || []) {
   const errors = [];
   const logicalEdges = getLogicalEdges(pluginView);
   const executionViews = getExecutionPluginViews(pluginView);
   const ganttBinding = getGanttStartEndBinding(workbook, logicalEdges);
   const startEndIDs = new Set(
      [ganttBinding.startColumnID, ganttBinding.endColumnID]
         .map((columnID) => normalizeColumnID(columnID))
         .filter((columnID) => columnID !== '')
   );

   for (const check of checks) {
      if (check.id === 'GANTT_HAS_CATEGORY_ROW_BINDING') {
         const rowLayers = logicalEdges?.row?.logicalEdgeLayers || [];
         if (rowLayers.length === 0) {
            errors.push(
               createError(
                  check.id,
                  'Gantt requires at least one row/category logical edge layer.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/row',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'GANTT_HAS_ITEM_EDGE_WITH_START_END_TAGS') {
         const itemLayers = logicalEdges?.item?.logicalEdgeLayers || [];
         const hasStart = itemLayers.some((layer) => Array.isArray(layer?.tags) && layer.tags.includes('obitech-gantt#start'));
         const hasEnd = itemLayers.some((layer) => Array.isArray(layer?.tags) && layer.tags.includes('obitech-gantt#end'));
         if (!hasStart || !hasEnd) {
            errors.push(
               createError(
                  check.id,
                  'Gantt logical item edge must include start/end tagged layers (obitech-gantt#start, obitech-gantt#end).',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/item',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'GANTT_HAS_DETAIL_EDGE_BINDING') {
         const detailLayers = logicalEdges?.detail?.logicalEdgeLayers || [];
         if (!detailLayers.some((layer) => layer?.type === 'column' && normalizeColumnID(layer?.columnID))) {
            errors.push(
               createError(
                  check.id,
                  'Gantt requires at least one detail logical edge layer.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/detail',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'GANTT_DURATION_NON_ZERO_BASELINE') {
         const sameColumnID = ganttBinding.startColumnID && ganttBinding.endColumnID && ganttBinding.startColumnID === ganttBinding.endColumnID;
         const sameExpression = ganttBinding.normalizedStartExpression
            && ganttBinding.normalizedEndExpression
            && ganttBinding.normalizedStartExpression === ganttBinding.normalizedEndExpression;
         if (sameColumnID || sameExpression) {
            const detail = sameColumnID
               ? `Gantt start/end resolve to the same columnID '${ganttBinding.startColumnID}'.`
               : 'Gantt start/end resolve to identical criteria expressions, producing zero-duration tasks.';
            errors.push(
               createError(
                  check.id,
                  detail,
                  '/criteria/columns/children',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'GANTT_EXECUTION_TRELLIS_MINIMIZED') {
         const unresolvedScopes = executionViews
            .filter((executionMeta) => {
               const rowIDs = getColumnBoundEdgeLayerIDs(executionMeta.view, 'row');
               const columnIDs = getColumnBoundEdgeLayerIDs(executionMeta.view, 'column');
               const hasOverAssignedRows = rowIDs.length !== 1;
               const hasOverAssignedColumns = columnIDs.length !== 1;
               const usesStartEndColumnForTrellis = columnIDs.some((columnID) => startEndIDs.has(columnID));
               return hasOverAssignedRows || hasOverAssignedColumns || usesStartEndColumnForTrellis;
            })
            .map((executionMeta) => executionMeta.scope);
         if (unresolvedScopes.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Gantt execution trellis bindings must be normalized for scopes: ${unresolvedScopes.join(', ')}.`,
                  '/views/children/*/dataModels/children/0/edges/children',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'GANTT_HAS_DATA_LAYERS_INFO') {
         if (!hasUsableDataLayersInfo(pluginView)) {
            errors.push(
               createError(
                  check.id,
                  'Gantt requires logicalDataModel.dataLayersInfo with activeDataLayer and matching dataLayers entry.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/dataLayersInfo',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'GANTT_REJECTS_LEGACY_LOGICAL_COLUMN_KEY') {
         const hasLegacyColumn = Object.prototype.hasOwnProperty.call(logicalEdges, 'column');
         if (hasLegacyColumn) {
            errors.push(
               createError(
                  check.id,
                  'Gantt logicalEdges.column is schema-invalid; use logicalEdges.col.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges',
                  check.fixHint
               )
            );
         }
      }
   }

   return errors;
}

function checkPerformanceTile(pluginView, checks = semanticRules.pluginFamilyChecks?.performance_tile || []) {
   const errors = [];
   const logicalEdges = getLogicalEdges(pluginView);

   for (const check of checks) {
      if (check.id === 'PERFORMANCE_TILE_NO_DERIVED_LAYOUT_OVERRIDES') {
         const tileSettings = pluginView?.viewConfig?.settings?.['viz:ngperformancetile'];
         if (isPlainObject(tileSettings)) {
            for (const propertyName of ['verticalLayout', 'primaryAlignment']) {
               if (Object.prototype.hasOwnProperty.call(tileSettings, propertyName)) {
                  errors.push(
                     createError(
                        check.id,
                        `Performance tile setting '${propertyName}' is derived from tileStyle and is not save-schema compatible as a persisted override.`,
                        `/views/children/*/viewConfig/settings/viz:ngperformancetile/${propertyName}`,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }
      if (check.id === 'PERFORMANCE_TILE_HAS_LOGICAL_MEASURES_BINDING') {
         const measureLayers = logicalEdges?.measures?.logicalEdgeLayers || [];
         if (!measureLayers.some((layer) => isMeasureLayer(layer))) {
            errors.push(
               createError(
                  check.id,
                  'Performance tile requires logical measures binding.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/measures',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PLUGIN_HAS_PRIMARY_MEASURE_BINDING') {
         errors.push(...checkMeasureBinding(pluginView, check));
      }
   }
   return errors;
}

function checkParallelCoordinates(workbook, pluginView, checks = semanticRules.pluginFamilyChecks?.parallel_coordinates || []) {
   const errors = [];
   const logicalEdges = getLogicalEdges(pluginView);
   const executionViews = getExecutionPluginViews(pluginView);
   const likelyMeasureIDs = new Set(collectLikelyMeasureColumnIDs(workbook));
   for (const columnID of getLogicalEdgeColumnIDs(logicalEdges, 'col')) {
      if (inferColumnClassFromID(columnID) === 'measure') {
         likelyMeasureIDs.add(columnID);
      }
   }
   for (const columnID of getMeasureColumnIDsFromCriteria(workbook)) {
      likelyMeasureIDs.add(columnID);
   }

   for (const check of checks) {
      if (check.id === 'PLUGIN_HAS_LOGICAL_ROW_AND_COLUMN_EDGES') {
         const hasRow = (logicalEdges?.row?.logicalEdgeLayers || []).length > 0;
         const hasCol = (logicalEdges?.col?.logicalEdgeLayers || []).length > 0;
         if (!hasRow || !hasCol) {
            errors.push(
               createError(
                  check.id,
                  'Parallel coordinates must include row plus col logical edge bindings.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PARALLEL_COORDINATES_HAS_MULTI_MEASURE_COLUMN_BINDING') {
         const colLayers = logicalEdges?.col?.logicalEdgeLayers || [];
         const measureCount = colLayers.filter((layer) => isMeasureLayer(layer)).length;
         if (measureCount < 2) {
            errors.push(
               createError(
                  check.id,
                  'Parallel coordinates requires at least two measures on logical col edge.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/col',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PARALLEL_COORDINATES_HAS_DETAIL_EDGE_BINDING') {
         const detailLayers = logicalEdges?.detail?.logicalEdgeLayers || [];
         if (!detailLayers.some((layer) => layer?.type === 'column' && normalizeColumnID(layer?.columnID))) {
            errors.push(
               createError(
                  check.id,
                  'Parallel coordinates requires at least one detail logical edge layer.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/detail',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PARALLEL_COORDINATES_EXECUTION_TRELLIS_MINIMIZED') {
         const unresolvedScopes = executionViews
            .filter((executionMeta) => {
               const rowIDs = getColumnBoundEdgeLayerIDs(executionMeta.view, 'row');
               const columnIDs = getColumnBoundEdgeLayerIDs(executionMeta.view, 'column');
               if (rowIDs.length !== 1 || columnIDs.length !== 1) {
                  return true;
               }
               return !columnIDs.some((columnID) => likelyMeasureIDs.has(columnID) || inferColumnClassFromID(columnID) === 'measure');
            })
            .map((executionMeta) => executionMeta.scope);
         if (unresolvedScopes.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Parallel coordinates execution trellis bindings must be normalized for scopes: ${unresolvedScopes.join(', ')}.`,
                  '/views/children/*/dataModels/children/0/edges/children',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PARALLEL_COORDINATES_REJECTS_LEGACY_LOGICAL_COLUMN_KEY') {
         const hasLegacyColumn = isPlainObject(logicalEdges) && Object.prototype.hasOwnProperty.call(logicalEdges, 'column');
         if (hasLegacyColumn) {
            errors.push(
               createError(
                  check.id,
                  'Parallel coordinates does not allow logicalEdges.column; use logicalEdges.col.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/column',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'PARALLEL_COORDINATES_HAS_DATA_LAYERS_INFO') {
         if (!hasUsableDataLayersInfo(pluginView)) {
            errors.push(
               createError(
                  check.id,
                  'Parallel coordinates requires logicalDataModel.dataLayersInfo with activeDataLayer and matching dataLayers entry.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/dataLayersInfo',
                  check.fixHint
               )
            );
         }
      }
   }
   return errors;
}

function countLogicalEdgeLayers(logicalEdges, edgeKey) {
   const layers = logicalEdges?.[edgeKey]?.logicalEdgeLayers;
   return Array.isArray(layers) ? layers.length : 0;
}

function checkMap(pluginView, workbook, checks = semanticRules.pluginFamilyChecks?.map || []) {
   const errors = [];
   const logicalEdges = getLogicalEdges(pluginView);
   const settings = getViewConfigSettings(pluginView);
   const mapSettings = getMapViewConfig(pluginView);
   const pluginType = pluginView?.pluginType;
   const executionViews = getExecutionPluginViews(pluginView);
   const mapDetailIDs = getLogicalEdgeColumnIDs(logicalEdges, 'detail');
   const preferredMeasureID = getPreferredMeasureColumnID(workbook, logicalEdges);
   const likelyMeasureIDs = new Set(collectLikelyMeasureColumnIDs(workbook));
   if (preferredMeasureID) {
      likelyMeasureIDs.add(preferredMeasureID);
   }
   const autovizNamespace = mapNetworkAllowlists?.map?.viewConfigNamespaces?.autoviz || 'obitech-autoviz/autoviz';
   const mapNamespace = mapNetworkAllowlists?.map?.viewConfigNamespaces?.map || 'viz_map';
   const renderTypeInvalidEdgeMatrix = isPlainObject(mapNetworkAllowlists?.map?.renderTypeInvalidLogicalEdges)
      ? mapNetworkAllowlists.map.renderTypeInvalidLogicalEdges
      : {};

   for (const check of checks) {
      if (check.id === 'MAP_AUTOVIZ_INNER_PLUGIN_MATCH') {
         const innerPluginType = settings?.[autovizNamespace]?.innerPluginType;
         if (typeof innerPluginType !== 'string' || innerPluginType !== pluginType) {
            errors.push(
               createError(
                  check.id,
                  'Map autoviz innerPluginType must match pluginType.',
                  '/views/children/*/viewConfig/settings/obitech-autoviz~1autoviz/innerPluginType',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'MAP_HAS_DETAIL_EDGE_BINDING') {
         if (mapDetailIDs.length === 0) {
            errors.push(
               createError(
                  check.id,
                  'Map requires at least one detail logical edge layer.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/detail',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'MAP_DETAIL_EDGE_GEO_COMPATIBLE') {
         const hasGeoCompatibleDetail = mapDetailIDs.some((columnID) => isGeographyCompatibleColumnID(workbook, columnID));
         if (!hasGeoCompatibleDetail) {
            errors.push(
               createError(
                  check.id,
                  'Map detail logical edge must reference at least one geography-compatible column.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/detail',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'MAP_VIZ_MAP_SETTINGS_OBJECT') {
         if (!isPlainObject(mapSettings)) {
            errors.push(
               createError(
                  check.id,
                  `Map requires viewConfig.settings['viz:chart'].${mapNamespace} object.`,
                  '/views/children/*/viewConfig/settings/viz:chart',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'MAP_EXECUTION_ROW_EDGE_DETAIL_BINDING') {
         const hasNestedExecutionView = executionViews.some((executionMeta) => executionMeta.scope !== 'primary');
         const detailBoundScopes = executionViews
            .filter((executionMeta) => {
               if (hasNestedExecutionView && executionMeta.scope === 'primary') {
                  return false;
               }
               const rowIDs = getColumnBoundEdgeLayerIDs(executionMeta.view, 'row');
               if (rowIDs.length === 0) {
                  return false;
               }
               if (mapDetailIDs.length === 0) {
                  return true;
               }
               return rowIDs.some((columnID) => mapDetailIDs.includes(columnID));
            })
            .map((executionMeta) => executionMeta.scope);
         if (detailBoundScopes.length === 0) {
            errors.push(
               createError(
                  check.id,
                  hasNestedExecutionView
                     ? 'Map embedded execution row edge must include at least one map detail column.'
                     : 'Map execution row edge must include at least one map detail column.',
                  '/views/children/*/dataModels/children/0/edges/children[row]/edgeLayers',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'MAP_NO_MEASURE_ON_UNUSED_EDGE') {
         const unresolvedScopes = executionViews
            .filter((executionMeta) => {
               const columnIDs = getColumnBoundEdgeLayerIDs(executionMeta.view, 'column');
               return columnIDs.some((columnID) => likelyMeasureIDs.has(columnID) || inferColumnClassFromID(columnID) === 'measure');
            })
            .map((executionMeta) => executionMeta.scope);
         if (unresolvedScopes.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Map execution column edge is the OAC UI Unused role and must not contain measure bindings for scopes: ${unresolvedScopes.join(', ')}.`,
                  '/views/children/*/dataModels/children/0/edges/children[column]/edgeLayers',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'MAP_HAS_DATA_LAYERS_INFO') {
         if (!hasUsableDataLayersInfo(pluginView)) {
            errors.push(
               createError(
                  check.id,
                  'Map requires logicalDataModel.dataLayersInfo with activeDataLayer and matching dataLayers entry.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/dataLayersInfo',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'MAP_RENDER_TYPE_INVALID_EDGE_COMBINATION') {
         const renderType = getMapRenderType(pluginView);
         if (!renderType) {
            continue;
         }
         const disallowedEdges = Array.isArray(renderTypeInvalidEdgeMatrix[renderType])
            ? renderTypeInvalidEdgeMatrix[renderType]
            : [];
         if (disallowedEdges.length === 0) {
            continue;
         }
         const violatedEdges = disallowedEdges.filter((edgeKey) => countLogicalEdgeLayers(logicalEdges, edgeKey) > 0);
         if (violatedEdges.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Map render type '${renderType}' disallows logical edges: ${violatedEdges.join(', ')}.`,
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges',
                  check.fixHint
               )
            );
         }
      }
   }

   return errors;
}

function checkNetworkGraph(pluginView, workbook, checks = semanticRules.pluginFamilyChecks?.network_graph || []) {
   const errors = [];
   const logicalEdges = getLogicalEdges(pluginView);
   const settings = getViewConfigSettings(pluginView);
   const pluginType = pluginView?.pluginType;
   const executionViews = getExecutionPluginViews(pluginView);
   const requiredDetailIDs = getPreferredNetworkDetailColumnIDs(workbook, logicalEdges, 2);
   const likelyMeasureIDs = new Set(collectLikelyMeasureColumnIDs(workbook));
   for (const columnID of getLogicalEdgeColumnIDs(logicalEdges, 'measures')) {
      likelyMeasureIDs.add(columnID);
   }
   const autovizNamespace = mapNetworkAllowlists?.networkGraph?.viewConfigNamespaces?.autoviz || 'obitech-autoviz/autoviz';
   const sankeyNamespace = mapNetworkAllowlists?.sankey?.viewConfigNamespaces?.sankey || 'viz:sankeychart';

   for (const check of checks) {
      if (check.id === 'NETWORK_AUTOVIZ_INNER_PLUGIN_MATCH') {
         const innerPluginType = settings?.[autovizNamespace]?.innerPluginType;
         if (typeof innerPluginType !== 'string' || innerPluginType !== pluginType) {
            errors.push(
               createError(
                  check.id,
                  'Network-family autoviz innerPluginType must match pluginType.',
                  '/views/children/*/viewConfig/settings/obitech-autoviz~1autoviz/innerPluginType',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'NETWORK_HAS_DETAIL_EDGE_BINDING') {
         if (countLogicalEdgeLayers(logicalEdges, 'detail') === 0) {
            errors.push(
               createError(
                  check.id,
                  'Network-family views require at least one detail logical edge layer.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/detail',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'NETWORK_MIN_DETAIL_LAYER_COUNT') {
         const detailCount = getLogicalEdgeColumnIDs(logicalEdges, 'detail').length;
         if (detailCount < 2) {
            errors.push(
               createError(
                  check.id,
                  `Network-family views require at least two detail logical edge layers (found ${detailCount}).`,
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/logicalEdges/detail',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'NETWORK_EXECUTION_ROW_EDGE_STABLE') {
         const requiredPair = requiredDetailIDs.slice(0, 2);
         const unresolvedScopes = executionViews
            .filter((executionMeta) => {
               const rowIDs = getColumnBoundEdgeLayerIDs(executionMeta.view, 'row');
               if (rowIDs.length < 2) {
                  return true;
               }
               if (requiredPair.length < 2) {
                  return false;
               }
               return requiredPair.some((columnID) => !rowIDs.includes(columnID));
            })
            .map((executionMeta) => executionMeta.scope);
         if (unresolvedScopes.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Network-family execution row edge must carry stable source-target detail bindings for scopes: ${unresolvedScopes.join(', ')}.`,
                  '/views/children/*/dataModels/children/0/edges/children[row]/edgeLayers',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'NETWORK_EXECUTION_COLUMN_EDGE_MEASURE_BINDING') {
         const unresolvedScopes = executionViews
            .filter((executionMeta) => {
               const columnIDs = getColumnBoundEdgeLayerIDs(executionMeta.view, 'column');
               return !columnIDs.some((columnID) => likelyMeasureIDs.has(columnID) || inferColumnClassFromID(columnID) === 'measure');
            })
            .map((executionMeta) => executionMeta.scope);
         if (unresolvedScopes.length > 0) {
            errors.push(
               createError(
                  check.id,
                  `Network-family execution column edge must include a concrete measure column binding for scopes: ${unresolvedScopes.join(', ')}.`,
                  '/views/children/*/dataModels/children/0/edges/children[column]/edgeLayers',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'NETWORK_HAS_DATA_LAYERS_INFO') {
         if (!hasUsableDataLayersInfo(pluginView)) {
            errors.push(
               createError(
                  check.id,
                  'Network-family views require logicalDataModel.dataLayersInfo with activeDataLayer and matching dataLayers entry.',
                  '/views/children/*/dataModels/children/0/logicalDataModel/settings/logicalDataModel/dataLayersInfo',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'SANKEY_HAS_SANKEY_SETTINGS_NAMESPACE' && pluginType === 'oracle.bi.tech.sankey') {
         if (!isPlainObject(settings?.[sankeyNamespace])) {
            errors.push(
               createError(
                  check.id,
                  `Sankey requires viewConfig.settings['${sankeyNamespace}'] object.`,
                  `/views/children/*/viewConfig/settings/${sankeyNamespace}`,
                  check.fixHint
               )
            );
         }
      }
   }

   return errors;
}

function checkFilterControlViz(pluginView, workbook, checks = semanticRules.pluginFamilyChecks?.filter_control_viz || []) {
   const errors = [];
   const collections = Array.isArray(workbook?.filterControlCollections?.children)
      ? workbook.filterControlCollections.children
      : [];
   const filterViewName = normalizeColumnID(pluginView?.viewName);
   const allPluginViews = getPluginViews(workbook);
   const filterVizViewNames = new Set(
      allPluginViews
         .filter((entry) => entry?.view?.pluginType === 'oracle.bi.tech.canvasfilterviz.listbox')
         .map((entry) => normalizeColumnID(entry?.view?.viewName))
         .filter(Boolean)
   );
   const allControls = [];
   for (let collectionIndex = 0; collectionIndex < collections.length; collectionIndex += 1) {
      const collection = collections[collectionIndex];
      const controls = Array.isArray(collection?.filterControls?.children) ? collection.filterControls.children : [];
      for (let controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
         const control = controls[controlIndex];
         if (!isPlainObject(control)) {
            continue;
         }
         const filterType = normalizeFilterControlType(control?.type);
         const pathPrefix = `/filterControlCollections/children/${collectionIndex}/filterControls/children/${controlIndex}`;
         allControls.push({
            collectionName: normalizeColumnID(collection?.name),
            type: filterType,
            filterID: normalizeColumnID(control?.filterID),
            columnID: normalizeColumnID(control?.columnID),
            parameter: normalizeColumnID(control?.parameter),
            expression: normalizeColumnID(control?.expr?.expression),
            groupOperator: normalizeColumnID(control?.groupOperator),
            groupCollectionRef: normalizeColumnID(control?.filterControlCollectionRef),
            formulaExpression: normalizeColumnID(control?.formula?.expr?.expression),
            location: normalizeFilterControlType(control?.filterControlConfig?.settings?.location),
            filterViz: normalizeColumnID(control?.filterControlConfig?.settings?.filterViz),
            hasDefaultValuesNode: isPlainObject(control?.filterControlDefaultValues),
            pathPrefix
         });
      }
   }

   const allControlsByID = new Map(
      allControls
         .filter((control) => control.filterID !== '')
         .map((control) => [control.filterID, control])
   );
   const controlsForView = allControls.filter(
      (control) => control.location === 'filter_viz' && control.filterViz === filterViewName
   );
   const columnControlsForView = controlsForView.filter((control) => control.type === 'saw:columnfiltercontrol');
   const parameterControlsForView = controlsForView.filter((control) => control.type === 'saw:parameterfiltercontrol');
   const expectedColumnMapKeys = Array.from(new Set(
      columnControlsForView
         .map((control) => control.columnID)
         .filter(Boolean)
   )).sort();
   const expectedParameterMapKeys = Array.from(new Set(
      parameterControlsForView
         .map((control) => control.parameter)
         .filter(Boolean)
   )).sort();
   const expectedColumnControlIDs = new Set(
      columnControlsForView
         .map((control) => control.filterID)
         .filter(Boolean)
   );
   const expectedParameterControlIDs = new Set(
      parameterControlsForView
         .map((control) => control.filterID)
         .filter(Boolean)
   );

   const filterSettings = isPlainObject(getViewConfigSettings(pluginView)?.['viz:filter'])
      ? getViewConfigSettings(pluginView)['viz:filter']
      : null;
   const filterIDMap = isPlainObject(filterSettings?.filterIDMap) ? filterSettings.filterIDMap : null;
   const parameterIDMap = isPlainObject(filterSettings?.parameterIDMap) ? filterSettings.parameterIDMap : null;
   const filterIDMapKeys = getFilterVizMapKeys(filterIDMap);
   const parameterIDMapKeys = getFilterVizMapKeys(parameterIDMap);
   const rowBindingKeys = getFilterVizRowBindingKeys(pluginView);
   const rowColumnKeys = rowBindingKeys.columnKeys;
   const rowParameterKeys = rowBindingKeys.parameterKeys;
   const layouts = Array.isArray(workbook?.layouts?.children) ? workbook.layouts.children : [];
   const views = Array.isArray(workbook?.views?.children) ? workbook.views.children : [];
   const canvasesByLayoutName = new Map();
   for (let viewIndex = 0; viewIndex < views.length; viewIndex += 1) {
      const candidateView = views[viewIndex];
      if (!isPlainObject(candidateView) || candidateView.type !== 'saw:canvas') {
         continue;
      }
      const rootLayoutName = normalizeColumnID(candidateView.rootLayoutName);
      if (rootLayoutName === '') {
         continue;
      }
      const canvasMeta = {
         viewIndex,
         viewName: normalizeColumnID(candidateView.viewName),
         collectionRefName: normalizeColumnID(candidateView?.filterControlCollectionRef?.name)
      };
      if (!canvasesByLayoutName.has(rootLayoutName)) {
         canvasesByLayoutName.set(rootLayoutName, []);
      }
      canvasesByLayoutName.get(rootLayoutName).push(canvasMeta);
   }
   const filterVizLayoutCells = [];
   for (let layoutIndex = 0; layoutIndex < layouts.length; layoutIndex += 1) {
      const layout = layouts[layoutIndex];
      const layoutName = normalizeColumnID(layout?.name);
      if (layoutName === '') {
         continue;
      }
      const layoutChildren = Array.isArray(layout?.children) ? layout.children : [];
      for (let cellIndex = 0; cellIndex < layoutChildren.length; cellIndex += 1) {
         const layoutCell = layoutChildren[cellIndex];
         const contentViewName = normalizeColumnID(layoutCell?.content?.viewName);
         if (contentViewName !== filterViewName) {
            continue;
         }
         filterVizLayoutCells.push({
            layoutName,
            layoutIndex,
            cellIndex,
            collectionName: normalizeColumnID(layoutCell?.filterControlCollectionName)
         });
      }
   }

   function diffKeys(requiredKeys, actualKeys) {
      const requiredSet = new Set(requiredKeys);
      const actualSet = new Set(actualKeys);
      return {
         missing: requiredKeys.filter((key) => !actualSet.has(key)),
         extra: actualKeys.filter((key) => !requiredSet.has(key))
      };
   }

   for (const check of checks) {
      if (check.id === 'FILTER_CONTROL_HAS_CONTROL_COLLECTION') {
         if (collections.length === 0 || allControls.length === 0) {
            errors.push(
               createError(
                  check.id,
                  'Filter control visualization requires filterControlCollections.children with at least one collection.',
                  '/views/children/*/filterControlCollections/children',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'FILTER_CONTROL_HAS_SOURCE_COLUMN') {
         const invalidColumnControl = allControls.find((control) =>
            control.type === 'saw:columnfiltercontrol'
            && (control.columnID === '' || control.formulaExpression === '')
         );
         if (invalidColumnControl) {
            const missingColumnID = invalidColumnControl.columnID === '';
            errors.push(
               createError(
                  check.id,
                  missingColumnID
                     ? 'Column filter controls must include non-empty columnID.'
                     : 'Column filter controls must include formula.expr.expression source binding.',
                  `${invalidColumnControl.pathPrefix}/${missingColumnID ? 'columnID' : 'formula/expr/expression'}`,
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'FILTER_CONTROL_HAS_DEFAULT_VALUES_NODE') {
         const missingDefaultsControl = allControls.find((control) =>
            control.type === 'saw:columnfiltercontrol' && control.hasDefaultValuesNode !== true
         );
         if (missingDefaultsControl) {
            errors.push(
               createError(
                  check.id,
                  'Column filter controls must include filterControlDefaultValues object.',
                  `${missingDefaultsControl.pathPrefix}/filterControlDefaultValues`,
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'FILTER_CONTROL_TYPE_REQUIRED_FIELDS') {
         for (const control of allControls) {
            if (control.filterID === '') {
               errors.push(
                  createError(
                     check.id,
                     'Each filter control must include non-empty filterID.',
                     `${control.pathPrefix}/filterID`,
                     check.fixHint
                  )
               );
               continue;
            }
            if (control.type === 'saw:columnfiltercontrol') {
               if (control.columnID === '') {
                  errors.push(
                     createError(
                        check.id,
                        `Column filter control '${control.filterID}' must include non-empty columnID.`,
                        `${control.pathPrefix}/columnID`,
                        check.fixHint
                     )
                  );
               }
               if (control.formulaExpression === '') {
                  errors.push(
                     createError(
                        check.id,
                        `Column filter control '${control.filterID}' must include formula.expr.expression.`,
                        `${control.pathPrefix}/formula/expr/expression`,
                        check.fixHint
                     )
                  );
               }
            } else if (control.type === 'saw:parameterfiltercontrol') {
               if (control.parameter === '') {
                  errors.push(
                     createError(
                        check.id,
                        `Parameter filter control '${control.filterID}' must include non-empty parameter.`,
                        `${control.pathPrefix}/parameter`,
                        check.fixHint
                     )
                  );
               }
            } else if (control.type === 'saw:expressionfiltercontrol') {
               if (control.expression === '') {
                  errors.push(
                     createError(
                        check.id,
                        `Expression filter control '${control.filterID}' must include expr.expression.`,
                        `${control.pathPrefix}/expr/expression`,
                        check.fixHint
                     )
                  );
               }
            } else if (control.type === 'saw:groupfiltercontrol') {
               if (control.groupCollectionRef === '') {
                  errors.push(
                     createError(
                        check.id,
                        `Group filter control '${control.filterID}' must include filterControlCollectionRef.`,
                        `${control.pathPrefix}/filterControlCollectionRef`,
                        check.fixHint
                     )
                  );
               }
               if (control.groupOperator === '') {
                  errors.push(
                     createError(
                        check.id,
                        `Group filter control '${control.filterID}' must include groupOperator.`,
                        `${control.pathPrefix}/groupOperator`,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }

      if (check.id === 'FILTER_VIZ_FILTERCONTROL_LINKAGE_CONSISTENT') {
         for (const control of allControls) {
            if (control.location !== 'filter_viz') {
               continue;
            }
            if (control.filterViz === '') {
               errors.push(
                  createError(
                     check.id,
                     `Filter control '${control.filterID || control.pathPrefix}' uses location=filter_viz but is missing filterControlConfig.settings.filterViz.`,
                     `${control.pathPrefix}/filterControlConfig/settings/filterViz`,
                     check.fixHint
                  )
               );
               continue;
            }
            if (!filterVizViewNames.has(control.filterViz)) {
               errors.push(
                  createError(
                     check.id,
                     `Filter control '${control.filterID || control.pathPrefix}' references missing filter_viz view '${control.filterViz}'.`,
                     `${control.pathPrefix}/filterControlConfig/settings/filterViz`,
                     check.fixHint
                  )
               );
            }
         }
      }

      if (check.id === 'FILTER_VIZ_CANVAS_COLLECTION_CONTEXT_CONSISTENT') {
         for (const layoutCell of filterVizLayoutCells) {
            const collectionPath = `/layouts/children/${layoutCell.layoutIndex}/children/${layoutCell.cellIndex}/filterControlCollectionName`;
            const canvasesForLayout = canvasesByLayoutName.get(layoutCell.layoutName) || [];
            if (canvasesForLayout.length === 0) {
               errors.push(
                  createError(
                     check.id,
                     `Layout '${layoutCell.layoutName}' hosting filter view '${filterViewName || 'unknown'}' is not owned by any canvas rootLayoutName.`,
                     `/layouts/children/${layoutCell.layoutIndex}/name`,
                     check.fixHint
                  )
               );
               continue;
            }

            for (const canvasMeta of canvasesForLayout) {
               const canvasPath = `/views/children/${canvasMeta.viewIndex}/filterControlCollectionRef/name`;
               if (canvasMeta.collectionRefName === '') {
                  errors.push(
                     createError(
                        check.id,
                        `Canvas '${canvasMeta.viewName || canvasMeta.viewIndex}' must define filterControlCollectionRef.name for layout '${layoutCell.layoutName}'.`,
                        canvasPath,
                        check.fixHint
                     )
                  );
                  continue;
               }
               const hasCanvasCollection = collections.some(
                  (collection) => normalizeColumnID(collection?.name) === canvasMeta.collectionRefName
               );
               if (!hasCanvasCollection) {
                  errors.push(
                     createError(
                        check.id,
                        `Canvas '${canvasMeta.viewName || canvasMeta.viewIndex}' references missing filterControlCollection '${canvasMeta.collectionRefName}'.`,
                        canvasPath,
                        check.fixHint
                     )
                  );
               }
               if (canvasMeta.collectionRefName !== layoutCell.collectionName) {
                  if (layoutCell.collectionName === '') {
                     // Some valid payloads omit layout-level collection names and rely on canvas references.
                  } else {
                     errors.push(
                        createError(
                           check.id,
                           `Canvas '${canvasMeta.viewName || canvasMeta.viewIndex}' filterControlCollectionRef '${canvasMeta.collectionRefName}' must match layout filterControlCollectionName '${layoutCell.collectionName}'.`,
                           canvasPath,
                           check.fixHint
                        )
                     );
                  }
               }
               if (controlsForView.length > 0) {
                  const hasControlsForCanvasCollection = controlsForView.some(
                     (control) => control.collectionName === canvasMeta.collectionRefName
                  );
                  if (!hasControlsForCanvasCollection) {
                     errors.push(
                        createError(
                           check.id,
                           `Filter view '${filterViewName || 'unknown'}' has no location=filter_viz controls in canvas collection '${canvasMeta.collectionRefName}'.`,
                           canvasPath,
                           check.fixHint
                        )
                     );
                  }
               }
            }

            if (layoutCell.collectionName !== '') {
               const hasLayoutCollection = collections.some(
                  (collection) => normalizeColumnID(collection?.name) === layoutCell.collectionName
               );
               if (!hasLayoutCollection) {
                  errors.push(
                     createError(
                        check.id,
                        `Layout collection '${layoutCell.collectionName}' for filter view '${filterViewName || 'unknown'}' does not exist in filterControlCollections.`,
                        collectionPath,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }

      if (check.id === 'FILTER_VIZ_HAS_REQUIRED_MAPS') {
         const needsFilterIDMap = expectedColumnMapKeys.length > 0 || rowColumnKeys.length > 0;
         const needsParameterIDMap = expectedParameterMapKeys.length > 0 || rowParameterKeys.length > 0;
         if (needsFilterIDMap && !isPlainObject(filterIDMap)) {
            errors.push(
               createError(
                  check.id,
                  `Filter view '${filterViewName || 'unknown'}' requires viewConfig.settings['viz:filter'].filterIDMap for column filter bindings.`,
                  '/views/children/*/viewConfig/settings/viz:filter/filterIDMap',
                  check.fixHint
               )
            );
         }
         if (needsParameterIDMap && !isPlainObject(parameterIDMap)) {
            errors.push(
               createError(
                  check.id,
                  `Filter view '${filterViewName || 'unknown'}' requires viewConfig.settings['viz:filter'].parameterIDMap for parameter filter bindings.`,
                  '/views/children/*/viewConfig/settings/viz:filter/parameterIDMap',
                  check.fixHint
               )
            );
         }
      }

      if (check.id === 'FILTER_VIZ_MAP_KEYS_MATCH_LDM_ROW_BINDINGS') {
         if (isPlainObject(filterIDMap)) {
            const expected = Array.from(new Set([...rowColumnKeys, ...expectedColumnMapKeys])).sort();
            const { missing, extra } = diffKeys(expected, filterIDMapKeys);
            if (missing.length > 0 || extra.length > 0) {
               const detail = [];
               if (missing.length > 0) {
                  detail.push(`missing keys: ${missing.join(', ')}`);
               }
               if (extra.length > 0) {
                  detail.push(`extra keys: ${extra.join(', ')}`);
               }
               errors.push(
                  createError(
                     check.id,
                     `filterIDMap keys must match filter_viz row column bindings for view '${filterViewName || 'unknown'}' (${detail.join('; ')}).`,
                     '/views/children/*/viewConfig/settings/viz:filter/filterIDMap',
                     check.fixHint
                  )
               );
            }
         }
         if (isPlainObject(parameterIDMap)) {
            const expected = Array.from(new Set([...rowParameterKeys, ...expectedParameterMapKeys])).sort();
            const { missing, extra } = diffKeys(expected, parameterIDMapKeys);
            if (missing.length > 0 || extra.length > 0) {
               const detail = [];
               if (missing.length > 0) {
                  detail.push(`missing keys: ${missing.join(', ')}`);
               }
               if (extra.length > 0) {
                  detail.push(`extra keys: ${extra.join(', ')}`);
               }
               errors.push(
                  createError(
                     check.id,
                     `parameterIDMap keys must match filter_viz row parameter bindings for view '${filterViewName || 'unknown'}' (${detail.join('; ')}).`,
                     '/views/children/*/viewConfig/settings/viz:filter/parameterIDMap',
                     check.fixHint
                  )
               );
            }
         }
      }

      if (check.id === 'FILTER_VIZ_MAP_VALUES_MATCH_EXISTING_FILTER_CONTROLS') {
         if (isPlainObject(filterIDMap)) {
            for (const [rawKey, rawValue] of Object.entries(filterIDMap)) {
               const key = normalizeColumnID(rawKey);
               const mappedFilterID = normalizeColumnID(rawValue);
               if (!key) {
                  continue;
               }
               if (!mappedFilterID) {
                  errors.push(
                     createError(
                        check.id,
                        `filterIDMap['${key}'] must resolve to a non-empty filterID.`,
                        `/views/children/*/viewConfig/settings/viz:filter/filterIDMap/${key}`,
                        check.fixHint
                     )
                  );
                  continue;
               }
               const mappedControl = allControlsByID.get(mappedFilterID);
               if (!mappedControl) {
                  errors.push(
                     createError(
                        check.id,
                        `filterIDMap['${key}'] references unknown filterID '${mappedFilterID}'.`,
                        `/views/children/*/viewConfig/settings/viz:filter/filterIDMap/${key}`,
                        check.fixHint
                     )
                  );
                  continue;
               }
               if (mappedControl.type !== 'saw:columnfiltercontrol'
                  || mappedControl.location !== 'filter_viz'
                  || mappedControl.filterViz !== filterViewName
                  || !expectedColumnControlIDs.has(mappedFilterID)) {
                  errors.push(
                     createError(
                        check.id,
                        `filterIDMap['${key}'] must reference a column filter control linked to filter view '${filterViewName}'.`,
                        `/views/children/*/viewConfig/settings/viz:filter/filterIDMap/${key}`,
                        check.fixHint
                     )
                  );
               }
            }
         }
         if (isPlainObject(parameterIDMap)) {
            for (const [rawKey, rawValue] of Object.entries(parameterIDMap)) {
               const key = normalizeColumnID(rawKey);
               const mappedFilterID = normalizeColumnID(rawValue);
               if (!key) {
                  continue;
               }
               if (!mappedFilterID) {
                  errors.push(
                     createError(
                        check.id,
                        `parameterIDMap['${key}'] must resolve to a non-empty filterID.`,
                        `/views/children/*/viewConfig/settings/viz:filter/parameterIDMap/${key}`,
                        check.fixHint
                     )
                  );
                  continue;
               }
               const mappedControl = allControlsByID.get(mappedFilterID);
               if (!mappedControl) {
                  errors.push(
                     createError(
                        check.id,
                        `parameterIDMap['${key}'] references unknown filterID '${mappedFilterID}'.`,
                        `/views/children/*/viewConfig/settings/viz:filter/parameterIDMap/${key}`,
                        check.fixHint
                     )
                  );
                  continue;
               }
               if (mappedControl.type !== 'saw:parameterfiltercontrol'
                  || mappedControl.location !== 'filter_viz'
                  || mappedControl.filterViz !== filterViewName
                  || !expectedParameterControlIDs.has(mappedFilterID)) {
                  errors.push(
                     createError(
                        check.id,
                        `parameterIDMap['${key}'] must reference a parameter filter control linked to filter view '${filterViewName}'.`,
                        `/views/children/*/viewConfig/settings/viz:filter/parameterIDMap/${key}`,
                        check.fixHint
                     )
                  );
               }
            }
         }
      }
   }

   return errors;
}

function checkGenericFamily(pluginView, family, checks = semanticRules.pluginFamilyChecks?.[family] || []) {
   const errors = [];
   for (const check of checks) {
      if (check.id === 'PLUGIN_HAS_LOGICAL_ROW_AND_COLUMN_EDGES') {
         errors.push(...checkRowColumnLogicalEdges(pluginView, check));
      }
      if (check.id === 'PLUGIN_HAS_ANY_LOGICAL_EDGE_BINDING') {
         errors.push(...checkAnyLogicalEdgeBinding(pluginView, check));
      }
      if (check.id === 'PLUGIN_HAS_PRIMARY_MEASURE_BINDING') {
         errors.push(...checkMeasureBinding(pluginView, check));
      }
      if (check.id === 'UI_CONTROL_VALID_PLUGIN_TYPE') {
         const pluginType = pluginView?.pluginType;
         if (!(typeof pluginType === 'string') || pluginType.trim().length === 0) {
            errors.push(createError(check.id, 'UI control pluginType must be non-empty.', '/views/children/*/pluginType', check.fixHint));
         } else if (!pluginTypeAliasByPluginType.has(pluginType)) {
            errors.push(
               createError(
                  check.id,
                  `UI control pluginType '${pluginType}' must be mapped in plugin-type-aliases.v1.json.`,
                  '/views/children/*/pluginType',
                  check.fixHint
               )
            );
         }
      }
      if (check.id === 'TEXTBOX_HAS_RUNTIME_TEXT_CONTENTS') {
         const pluginType = (typeof pluginView?.pluginType === 'string') ? pluginView.pluginType.trim() : '';
         if (pluginType === 'oracle.bi.tech.textbox') {
            const canonicalText = getCanonicalSignalText(pluginView, textboxRuntimePathSignal);
            const legacyCandidates = collectLegacySignalTextValues(pluginView, textboxRuntimePathSignal);
            const hasAnyTextboxText = Boolean(canonicalText || legacyCandidates.length > 0);
            if (hasAnyTextboxText && !canonicalText) {
               const canonicalPath = buildPluginViewPathFromSignal('/views/children/*', textboxRuntimePathSignal?.canonical?.jsonPointer);
               const legacyCandidatePointers = legacyCandidates
                  .map((candidate) => buildPluginViewPathFromSignal('/views/children/*', candidate?.jsonPointer))
                  .filter((value, index, values) => typeof value === 'string' && values.indexOf(value) === index);
               const legacyDetails = legacyCandidatePointers.length > 0
                  ? ` Legacy-only paths found: ${legacyCandidatePointers.join(', ')}.`
                  : '';
               errors.push(
                  createError(
                     legacyCandidatePointers.length > 0 ? 'TEXTBOX_LEGACY_ONLY_RUNTIME_PATH' : 'TEXTBOX_CANONICAL_RUNTIME_PATH_REQUIRED',
                     `Textbox text must be populated at canonical runtime path '${textboxRuntimePathSignal?.canonical?.jsonPointer || '/viewConfig/settings/viz:chart/textContents/caption/text'}'.${legacyDetails}`,
                     canonicalPath,
                     check.fixHint
                  )
               );
            }
         }
      }
   }
   return errors;
}

function checkUiControl(pluginView, checks = semanticRules.pluginFamilyChecks?.ui_control || []) {
   return checkGenericFamily(pluginView, 'ui_control', checks);
}

function buildResolutionTrace(primaryPlugin, fallbackUsed, reason) {
   return {
      requestedPluginType: requestedPluginType || null,
      resolvedFamily: primaryPlugin?.pluginFamily || null,
      scaffoldTemplate: primaryPlugin?.scaffoldTemplate || null,
      finalPluginType: primaryPlugin?.pluginType || null,
      fallbackUsed,
      reason: reason || null
   };
}

function evaluateWorkbook(workbook) {
   const projectVersion = workbook.projectVersion;
   const profile = findRuntimeProfile(projectVersion);
   const publicExecutionContext = resolvePublicExecutionContext(projectVersion);
   const pluginViews = getPluginViews(workbook);
   const evaluatedPlugins = [];
   const filterDecisionTrace = buildFilterDecisionTrace(workbook);
   const modifyContext = {
      authoringMode,
      requestedOperation: requestedOperation || null,
      sourceMode: modifySourceMode || null,
      confirmationState: confirmationState || null,
      resolvedWorkbookTarget: {
         id: resolvedWorkbookID || null,
         name: resolvedWorkbookName || null,
         path: resolvedWorkbookPath || null
      }
   };
   const modifyTrace = buildModifyTrace(modifyContext);

   const errors = [];
   const warnings = checkCriteriaSentinelFilterWarnings(workbook);
   for (const diagnostic of textboxRuntimePathSignalResolution?.diagnostics || []) {
      errors.push(
         createError(
            'RUNTIME_PATH_REGISTRY_DRIFT',
            diagnostic,
            '/model/runtime-path-registry.v1.json',
            'Align runtime-path-registry.v1.json with runtime-path-registry-utils.mjs defaults and ensure textbox_runtime_text signal exists.'
         )
      );
   }
   const supportedAuthoringModes = new Set(Object.keys(editOperationContracts?.authoringModes || {}));
   if (!supportedAuthoringModes.has(authoringMode)) {
      errors.push(
         createError(
            'GLOBAL_MODIFY_TRACE_PRESENT',
            `Unsupported authoring mode '${authoringMode}'.`,
            '/modifyTrace',
            'Use a supported authoring mode from edit-operation-contracts.v1.json.'
         )
      );
   }
   errors.push(...checkGlobal(workbook, profile, filterDecisionTrace, modifyContext, modifyTrace));

   if (pluginViews.length === 0) {
      errors.push(createError('GLOBAL_PRIMARY_PLUGIN_VIEW', 'No supported plugin views found.', '/views/children', 'Template must include at least one supported plugin view.'));
   } else {
      for (const viewMeta of pluginViews) {
         const pluginType = viewMeta.view?.pluginType || null;
         const familyPayload = pluginType ? resolvePluginFamily(pluginType) : null;
         evaluatedPlugins.push({
            viewIndex: viewMeta.index,
            viewName: viewMeta.view?.viewName || null,
            pluginType,
            pluginFamily: familyPayload?.family || null,
            familySource: familyPayload?.source || null,
            aliasDefaultTemplateId: familyPayload?.aliasEntry?.defaultTemplateId || null,
            scaffoldTemplate: familyPayload?.resolutionProfile?.canonicalScaffoldTemplateId ||
               familyPayload?.aliasEntry?.defaultTemplateId ||
               null
         });

         if (!familyPayload) {
            errors.push(
               ...withViewContext(
                  [
                     createError(
                        'GLOBAL_PLUGIN_FAMILY_UNMAPPED',
                        `Plugin type '${pluginType}' is not mapped to a runtime family.`,
                        '/views/children/*/pluginType',
                        'Add plugin mapping to viz-resolution-profiles.v1.json (preferred) and runtime-profile-contracts.v1.json.'
                     )
                  ],
                  viewMeta
               )
            );
            continue;
         }

         const pluginChecks = resolvePluginChecks(pluginType, familyPayload.family);

         if (familyPayload.family === 'table') {
            errors.push(...withViewContext(checkTable(viewMeta.view, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'chart_autoviz') {
            errors.push(...withViewContext(checkAutoviz(viewMeta.view, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'chart_combo_multilayer') {
            errors.push(...withViewContext(checkComboMultilayer(viewMeta.view, profile, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'pivot') {
            errors.push(...withViewContext(checkPivot(viewMeta.view, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'gantt') {
            errors.push(...withViewContext(checkGantt(workbook, viewMeta.view, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'performance_tile') {
            errors.push(...withViewContext(checkPerformanceTile(viewMeta.view, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'parallel_coordinates') {
            errors.push(...withViewContext(checkParallelCoordinates(workbook, viewMeta.view, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'network_graph') {
            errors.push(...withViewContext(checkNetworkGraph(viewMeta.view, workbook, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'map') {
            errors.push(...withViewContext(checkMap(viewMeta.view, workbook, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'filter_control_viz') {
            errors.push(...withViewContext(checkFilterControlViz(viewMeta.view, workbook, pluginChecks), viewMeta));
            continue;
         }
         if (familyPayload.family === 'ui_control') {
            errors.push(...withViewContext(checkUiControl(viewMeta.view, pluginChecks), viewMeta));
            continue;
         }
         errors.push(...withViewContext(checkGenericFamily(viewMeta.view, familyPayload.family, pluginChecks), viewMeta));
      }
   }

   const primaryPlugin = evaluatedPlugins[0] || null;
   const requestedMapped = requestedPluginType ? vizResolutionProfileByPluginType.has(requestedPluginType) : true;
   let fallbackUsed = false;
   let resolutionReason = 'no requested plugin type provided';

   if (requestedPluginType) {
      if (!requestedMapped && !allowFallbackPluginType) {
         errors.push(
            createError(
               'GLOBAL_VIZ_LOCK_REQUESTED_PLUGIN_TYPE_MATCH',
               `Requested plugin type '${requestedPluginType}' is not mapped in viz-resolution-profiles.v1.json.`,
               '/views/children/*/pluginType',
               'Add the requested plugin to viz-resolution-profiles.v1.json or pass explicit fallback override.'
            )
         );
      }

      if (!primaryPlugin || !primaryPlugin.pluginType) {
         errors.push(
            createError(
               'GLOBAL_VIZ_LOCK_REQUESTED_PLUGIN_TYPE_MATCH',
               `Requested plugin type '${requestedPluginType}' cannot be validated because no primary plugin view was found.`,
               '/views/children',
               'Ensure workbook includes a plugin view before running validation check.'
            )
         );
      } else if (primaryPlugin.pluginType !== requestedPluginType) {
         if (!allowFallbackPluginType) {
            errors.push(
               createError(
                  'GLOBAL_VIZ_LOCK_REQUESTED_PLUGIN_TYPE_MATCH',
                  `Requested plugin type '${requestedPluginType}' does not match generated plugin type '${primaryPlugin.pluginType}'.`,
                  '/views/children/*/pluginType',
                  'Regenerate workbook with requested plugin type, or rerun validation check with explicit fallback override arguments.'
               )
            );
         } else {
            if (!fallbackPluginType || fallbackPluginType.trim() === '') {
               errors.push(
                  createError(
                     'GLOBAL_VIZ_LOCK_FALLBACK_OVERRIDE_REQUIRES_REASON',
                     'Fallback override requires --fallback-plugin-type when requested plugin type differs from generated plugin.',
                     '/views/children/*/pluginType',
                     'Set --fallback-plugin-type to the generated plugin type and provide --fallback-reason.'
                  )
               );
            }
            if (!fallbackReason || fallbackReason.trim() === '') {
               errors.push(
                  createError(
                     'GLOBAL_VIZ_LOCK_FALLBACK_OVERRIDE_REQUIRES_REASON',
                     'Fallback override requires non-empty --fallback-reason when requested plugin type differs from generated plugin.',
                     '/views/children/*/pluginType',
                     'Provide --fallback-reason to document why fallback is intentional.'
                  )
               );
            }
            if (fallbackPluginType && fallbackPluginType !== primaryPlugin.pluginType) {
               errors.push(
                  createError(
                     'GLOBAL_VIZ_LOCK_FALLBACK_OVERRIDE_REQUIRES_REASON',
                     `Fallback plugin type '${fallbackPluginType}' must match generated plugin type '${primaryPlugin.pluginType}'.`,
                     '/views/children/*/pluginType',
                     'Use --fallback-plugin-type with the generated plugin type to make override explicit.'
                  )
               );
            }
            if (fallbackPluginType === primaryPlugin.pluginType && fallbackReason && fallbackReason.trim() !== '') {
               fallbackUsed = true;
               resolutionReason = fallbackReason.trim();
            }
         }
      } else {
         resolutionReason = 'requested plugin type preserved';
      }
   }

   if (requestedPluginType && requestedMapped === false && allowFallbackPluginType && !fallbackUsed) {
      resolutionReason = fallbackReason && fallbackReason.trim() !== ''
         ? fallbackReason.trim()
         : 'requested plugin type unmapped; fallback override incomplete'
   }

   const resolutionTrace = buildResolutionTrace(primaryPlugin, fallbackUsed, resolutionReason);

   return {
      targetVersion: publicExecutionContext.targetVersion,
      compatibilityTarget: publicExecutionContext.compatibilityTarget,
      availableTargetVersions: publicExecutionContext.availableTargetVersions,
      executionMode: publicExecutionContext.executionMode,
      reasonForVersionSelection: publicExecutionContext.reasonForVersionSelection,
      capabilitySource: publicExecutionContext.capabilitySource,
      saveToolDetected: publicExecutionContext.saveToolDetected,
      exportToolDetected: publicExecutionContext.exportToolDetected,
      discoveryMethod: publicExecutionContext.discoveryMethod,
      saveAvailable: publicExecutionContext.saveAvailable,
      exportAvailable: publicExecutionContext.exportAvailable,
      exportRequested: publicExecutionContext.exportRequested,
      authoringMode,
      requestedOperation: requestedOperation || null,
      sourceMode: modifySourceMode || null,
      confirmationState: confirmationState || null,
      resolvedWorkbookTarget: modifyContext.resolvedWorkbookTarget,
      pluginType: evaluatedPlugins[0]?.pluginType || null,
      pluginFamily: evaluatedPlugins[0]?.pluginFamily || null,
      pluginViewsValidated: evaluatedPlugins.length,
      evaluatedPlugins,
      resolutionTrace,
      filterDecisionTrace,
      modifyTrace,
      valid: errors.length === 0,
      warnings,
      errors
   };
}

function ensureReportConfigDefaults(workbook, profile) {
   const defaults = profile?.reportConfigRequirements?.defaults || {};
   for (const [pointer, value] of Object.entries(defaults)) {
      if (typeof getByJsonPointer(workbook, pointer) === 'undefined') {
         setByJsonPointer(workbook, pointer, deepClone(value));
      }
   }
}

function patchTextboxCanonicalRuntimePaths(workbook) {
   const views = Array.isArray(workbook?.views?.children) ? workbook.views.children : [];
   for (const view of views) {
      if (!isPlainObject(view) || view.type !== 'saw:pluginView') {
         continue;
      }
      const pluginType = typeof view.pluginType === 'string' ? view.pluginType.trim() : '';
      if (pluginType !== 'oracle.bi.tech.textbox') {
         continue;
      }
      migrateSignalLegacyTextToCanonical(view, textboxRuntimePathSignal);
   }
}

function patchPerformanceTileDerivedLayoutOverrides(workbook) {
   const views = Array.isArray(workbook?.views?.children) ? workbook.views.children : [];
   for (const view of views) {
      if (!isPlainObject(view) || view.type !== 'saw:pluginView') {
         continue;
      }
      const tileSettings = view?.viewConfig?.settings?.['viz:ngperformancetile'];
      if (!isPlainObject(tileSettings)) {
         continue;
      }
      delete tileSettings.verticalLayout;
      delete tileSettings.primaryAlignment;
   }
}

function patchCanonicalRuntimeDefaults(workbook, profile) {
   ensureReportConfigDefaults(workbook, profile);
   patchTextboxCanonicalRuntimePaths(workbook);
   patchFilterControlChoiceValueShapes(workbook);
   patchPerformanceTileDerivedLayoutOverrides(workbook);

   if (!isPlainObject(workbook.parameters)) {
      workbook.parameters = {};
   }
   workbook.parameters._version = PARAMETERS_SCHEMA_VERSION;
   ensureFilterParameterBindingDefinitions(workbook);

   if (!isPlainObject(workbook.reportConfig)) {
      workbook.reportConfig = {};
   }
   if (!isPlainObject(workbook.reportConfig.settings)) {
      workbook.reportConfig.settings = {};
   }

   const reportSettings = workbook.reportConfig.settings;
   const colorService = ensureObjectProperty(reportSettings, 'oracle.bi.tech.colorSchemeService', {
      _version: '1.0.0',
      settings: {
         version: '1.0.3',
         generation: 0,
         colorDomains: {},
         defaults: {
            rangeLuminosity: 'hslblend'
         }
      }
   });
   if (typeof colorService._version !== 'string') {
      colorService._version = '1.0.0';
   }
   const colorSettings = ensureObjectProperty(colorService, 'settings', {});
   if (typeof colorSettings.version !== 'string') {
      colorSettings.version = '1.0.3';
   }
   if (!Number.isInteger(colorSettings.generation)) {
      colorSettings.generation = 0;
   }
   const colorDefaults = ensureObjectProperty(colorSettings, 'defaults', {});
   if (typeof colorDefaults.rangeLuminosity !== 'string' || colorDefaults.rangeLuminosity.trim() === '') {
      colorDefaults.rangeLuminosity = 'hslblend';
   }
   const colorDomains = ensureObjectProperty(colorSettings, 'colorDomains', {});

   const categoricalMeasureMapping = ensureObjectProperty(colorDomains, COLOR_CATEGORICAL_MEASURE_DOMAIN_KEY, {
      generation: 0,
      colorMap: {},
      coloringType: 'categoricalSchemes',
      colorScheme: null,
      noRepeat: true,
      hierarchical: false,
      nextIndex: 0
   });
   if (!Number.isInteger(categoricalMeasureMapping.generation)) {
      categoricalMeasureMapping.generation = 0;
   }
   categoricalMeasureMapping.coloringType = 'categoricalSchemes';
   if (!Object.prototype.hasOwnProperty.call(categoricalMeasureMapping, 'colorScheme')) {
      categoricalMeasureMapping.colorScheme = null;
   }
   if (typeof categoricalMeasureMapping.noRepeat !== 'boolean') {
      categoricalMeasureMapping.noRepeat = true;
   }
   if (typeof categoricalMeasureMapping.hierarchical !== 'boolean') {
      categoricalMeasureMapping.hierarchical = false;
   }
   const categoricalColorMap = ensureObjectProperty(categoricalMeasureMapping, 'colorMap', {});
   const minNextIndex = getNextIndexFromValueMap(categoricalColorMap);
   if (!Number.isInteger(categoricalMeasureMapping.nextIndex) || categoricalMeasureMapping.nextIndex < minNextIndex) {
      categoricalMeasureMapping.nextIndex = minNextIndex;
   }

   const sequentialMeasureMapping = ensureObjectProperty(colorDomains, COLOR_SEQUENTIAL_MEASURE_DOMAIN_KEY, {
      generation: 0,
      colorMap: {},
      coloringType: 'sequentialSchemes',
      colorScheme: null,
      nextIndex: 0,
      oMeasureMap: {}
   });
   if (!Number.isInteger(sequentialMeasureMapping.generation)) {
      sequentialMeasureMapping.generation = 0;
   }
   sequentialMeasureMapping.coloringType = 'sequentialSchemes';
   if (!Object.prototype.hasOwnProperty.call(sequentialMeasureMapping, 'colorScheme')) {
      sequentialMeasureMapping.colorScheme = null;
   }
   if (!Number.isInteger(sequentialMeasureMapping.nextIndex) || sequentialMeasureMapping.nextIndex < 0) {
      sequentialMeasureMapping.nextIndex = 0;
   }
   ensureObjectProperty(sequentialMeasureMapping, 'colorMap', {});
   const sequentialMeasureMap = ensureObjectProperty(sequentialMeasureMapping, 'oMeasureMap', {});

   const measureColumnIDs = collectLikelyMeasureColumnIDs(workbook);
   for (const measureID of measureColumnIDs) {
      if (!Object.prototype.hasOwnProperty.call(categoricalColorMap, measureID)) {
         categoricalColorMap[measureID] = categoricalMeasureMapping.nextIndex;
         categoricalMeasureMapping.nextIndex += 1;
      }

      if (!isPlainObject(sequentialMeasureMap[measureID])) {
         sequentialMeasureMap[measureID] = {
            sColorScheme: '',
            bInvert: false
         };
      } else {
         if (typeof sequentialMeasureMap[measureID].sColorScheme !== 'string') {
            sequentialMeasureMap[measureID].sColorScheme = '';
         }
         if (typeof sequentialMeasureMap[measureID].bInvert !== 'boolean') {
            sequentialMeasureMap[measureID].bInvert = false;
         }
      }
   }

   const shapeService = ensureObjectProperty(reportSettings, 'oracle.bi.tech.shapeSchemeService', {
      _version: '1.0.0',
      settings: {
         version: '1.0.3',
         generation: 0,
         domains: {}
      }
   });
   if (typeof shapeService._version !== 'string') {
      shapeService._version = '1.0.0';
   }
   const shapeSettings = ensureObjectProperty(shapeService, 'settings', {});
   if (typeof shapeSettings.version !== 'string') {
      shapeSettings.version = '1.0.3';
   }
   if (!Number.isInteger(shapeSettings.generation)) {
      shapeSettings.generation = 0;
   }
   const shapeDomains = ensureObjectProperty(shapeSettings, 'domains', {});
   const categoricalShapeMapping = ensureObjectProperty(shapeDomains, SHAPE_CATEGORICAL_DOMAIN_KEY, {
      generation: 0,
      valueMap: {},
      type: 'categoricalSchemes',
      scheme: null,
      nextIndex: 0
   });
   if (!Number.isInteger(categoricalShapeMapping.generation)) {
      categoricalShapeMapping.generation = 0;
   }
   categoricalShapeMapping.type = 'categoricalSchemes';
   if (!Object.prototype.hasOwnProperty.call(categoricalShapeMapping, 'scheme')) {
      categoricalShapeMapping.scheme = null;
   }
   ensureObjectProperty(categoricalShapeMapping, 'valueMap', {});
   if (!Number.isInteger(categoricalShapeMapping.nextIndex) || categoricalShapeMapping.nextIndex < 0) {
      categoricalShapeMapping.nextIndex = 0;
   }
}

function patchTableColumnEdge(workbook) {
   const tableViews = getPluginViewsByFamily(workbook, 'table');
   if (tableViews.length === 0) {
      return;
   }

   for (const viewMeta of tableViews) {
      const pluginView = viewMeta.view;
      const rowEdge = getEdgeByAxis(pluginView, 'row');
      const columnEdge = getEdgeByAxis(pluginView, 'column');
      if (!rowEdge || !columnEdge) {
         continue;
      }

      if (!rowEdge.edgeLayers) {
         rowEdge.edgeLayers = { children: [] };
      }
      if (!columnEdge.edgeLayers) {
         columnEdge.edgeLayers = { children: [] };
      }

      const rowLayers = rowEdge.edgeLayers.children || [];
      const columnLayers = columnEdge.edgeLayers.children || [];

      for (const layer of columnLayers) {
         const serialized = JSON.stringify(layer);
         const exists = rowLayers.some((entry) => JSON.stringify(entry) === serialized);
         if (!exists) {
            rowLayers.push(layer);
         }
      }
      columnEdge.edgeLayers.children = [];

      const logicalEdges = getLogicalEdges(pluginView);
      if (!logicalEdges.row) {
         logicalEdges.row = { logicalEdgeLayers: [] };
      }

      const rowLogical = logicalEdges.row.logicalEdgeLayers || [];
      const hasLogicalColumn = Object.prototype.hasOwnProperty.call(logicalEdges, 'column');
      const colLogical = hasLogicalColumn ? (logicalEdges.column?.logicalEdgeLayers || []) : [];
      for (const layer of colLogical) {
         const serialized = JSON.stringify(layer);
         const exists = rowLogical.some((entry) => JSON.stringify(entry) === serialized);
         if (!exists) {
            rowLogical.push(layer);
         }
      }
      logicalEdges.row.logicalEdgeLayers = rowLogical;
      if (hasLogicalColumn) {
         delete logicalEdges.column;
      }
   }
}

function patchPivotLogicalEdgeColumnToCol(workbook) {
   const pivotViews = getPluginViewsByFamily(workbook, 'pivot');
   if (pivotViews.length === 0) {
      return;
   }

   for (const viewMeta of pivotViews) {
      const pluginView = viewMeta.view;
      const logicalEdges = getLogicalEdges(pluginView);
      if (!isPlainObject(logicalEdges)) {
         continue;
      }

      const hasLegacyColumn = Object.prototype.hasOwnProperty.call(logicalEdges, 'column');
      if (!hasLegacyColumn) {
         continue;
      }

      const legacyLayers = Array.isArray(logicalEdges.column?.logicalEdgeLayers)
         ? logicalEdges.column.logicalEdgeLayers
         : [];
      if (!isPlainObject(logicalEdges.col)) {
         logicalEdges.col = { logicalEdgeLayers: [] };
      }
      if (!Array.isArray(logicalEdges.col.logicalEdgeLayers)) {
         logicalEdges.col.logicalEdgeLayers = [];
      }

      for (const layer of legacyLayers) {
         const serialized = JSON.stringify(layer);
         const exists = logicalEdges.col.logicalEdgeLayers.some((entry) => JSON.stringify(entry) === serialized);
         if (!exists) {
            logicalEdges.col.logicalEdgeLayers.push(layer);
         }
      }

      delete logicalEdges.column;
   }
}

function patchParallelCoordinatesLogicalEdgeColumnToCol(workbook) {
   const parallelViews = getPluginViewsByFamily(workbook, 'parallel_coordinates');
   if (parallelViews.length === 0) {
      return;
   }

   for (const viewMeta of parallelViews) {
      const pluginView = viewMeta.view;
      const logicalEdges = getLogicalEdges(pluginView);
      if (!isPlainObject(logicalEdges)) {
         continue;
      }

      const hasLegacyColumn = Object.prototype.hasOwnProperty.call(logicalEdges, 'column');
      if (!hasLegacyColumn) {
         continue;
      }

      const legacyLayers = Array.isArray(logicalEdges.column?.logicalEdgeLayers)
         ? logicalEdges.column.logicalEdgeLayers
         : [];
      if (!isPlainObject(logicalEdges.col)) {
         logicalEdges.col = { logicalEdgeLayers: [] };
      }
      if (!Array.isArray(logicalEdges.col.logicalEdgeLayers)) {
         logicalEdges.col.logicalEdgeLayers = [];
      }

      for (const layer of legacyLayers) {
         const serialized = JSON.stringify(layer);
         const exists = logicalEdges.col.logicalEdgeLayers.some((entry) => JSON.stringify(entry) === serialized);
         if (!exists) {
            logicalEdges.col.logicalEdgeLayers.push(layer);
         }
      }

      delete logicalEdges.column;
   }
}

function patchGanttLogicalEdgeColumnToCol(workbook) {
   const ganttViews = getPluginViewsByFamily(workbook, 'gantt');
   if (ganttViews.length === 0) {
      return;
   }

   for (const viewMeta of ganttViews) {
      const pluginView = viewMeta.view;
      const logicalEdges = getLogicalEdges(pluginView);
      if (!isPlainObject(logicalEdges)) {
         continue;
      }

      const hasLegacyColumn = Object.prototype.hasOwnProperty.call(logicalEdges, 'column');
      if (!hasLegacyColumn) {
         continue;
      }

      const legacyLayers = Array.isArray(logicalEdges.column?.logicalEdgeLayers)
         ? logicalEdges.column.logicalEdgeLayers
         : [];
      if (!isPlainObject(logicalEdges.col)) {
         logicalEdges.col = { logicalEdgeLayers: [] };
      }
      if (!Array.isArray(logicalEdges.col.logicalEdgeLayers)) {
         logicalEdges.col.logicalEdgeLayers = [];
      }

      for (const layer of legacyLayers) {
         const serialized = JSON.stringify(layer);
         const exists = logicalEdges.col.logicalEdgeLayers.some((entry) => JSON.stringify(entry) === serialized);
         if (!exists) {
            logicalEdges.col.logicalEdgeLayers.push(layer);
         }
      }

      delete logicalEdges.column;
   }
}

function buildGanttDerivedEndExpression(startExpression) {
   const normalizedStart = typeof startExpression === 'string' ? startExpression.trim() : '';
   if (!normalizedStart) {
      return null;
   }
   return `TIMESTAMPADD(SQL_TSI_DAY, 1, ${normalizedStart})`;
}

function patchParallelCoordinatesEnsureDetailEdge(workbook) {
   const parallelViews = getPluginViewsByFamily(workbook, 'parallel_coordinates');
   if (parallelViews.length === 0) {
      return;
   }

   for (const viewMeta of parallelViews) {
      const logicalEdges = getLogicalEdges(viewMeta.view);
      if (!isPlainObject(logicalEdges)) {
         continue;
      }

      const detailColumnIDs = [];
      for (const columnID of getLogicalEdgeColumnIDs(logicalEdges, 'row')) {
         if (!detailColumnIDs.includes(columnID)) {
            detailColumnIDs.push(columnID);
         }
      }
      for (const columnID of getLogicalEdgeColumnIDs(logicalEdges, 'col')) {
         if (!detailColumnIDs.includes(columnID)) {
            detailColumnIDs.push(columnID);
         }
      }

      if (detailColumnIDs.length === 0) {
         for (const columnID of getDimensionTemporalColumnIDs(workbook).slice(0, 2)) {
            if (!detailColumnIDs.includes(columnID)) {
               detailColumnIDs.push(columnID);
            }
         }
         for (const columnID of getMeasureColumnIDsFromCriteria(workbook).slice(0, 2)) {
            if (!detailColumnIDs.includes(columnID)) {
               detailColumnIDs.push(columnID);
            }
         }
      }
      ensureLogicalDetailColumns(logicalEdges, detailColumnIDs);
   }
}

function patchGanttEnsureDurationAndDetail(workbook) {
   const ganttViews = getPluginViewsByFamily(workbook, 'gantt');
   if (ganttViews.length === 0) {
      return;
   }

   for (const viewMeta of ganttViews) {
      const logicalEdges = getLogicalEdges(viewMeta.view);
      if (!isPlainObject(logicalEdges)) {
         continue;
      }

      const rowIDs = getLogicalEdgeColumnIDs(logicalEdges, 'row');
      if (rowIDs.length > 0) {
         ensureLogicalDetailColumns(logicalEdges, rowIDs);
      } else {
         ensureLogicalDetailColumns(logicalEdges, getDimensionTemporalColumnIDs(workbook).slice(0, 1));
      }

      const binding = getGanttStartEndBinding(workbook, logicalEdges);
      const sameColumnID = binding.startColumnID && binding.endColumnID && binding.startColumnID === binding.endColumnID;
      const sameExpression = binding.normalizedStartExpression
         && binding.normalizedEndExpression
         && binding.normalizedStartExpression === binding.normalizedEndExpression;

      let effectiveEndColumnID = binding.endColumnID;
      let effectiveEndColumn = binding.endColumn;
      if (sameColumnID && isPlainObject(binding.endLayer)) {
         const candidateEndIDs = [];
         for (const columnID of getLogicalEdgeColumnIDs(logicalEdges, 'col')) {
            if (!candidateEndIDs.includes(columnID)) {
               candidateEndIDs.push(columnID);
            }
         }
         for (const column of getCriteriaColumns(workbook)) {
            const columnID = normalizeColumnID(column?.columnID);
            if (columnID && !candidateEndIDs.includes(columnID)) {
               candidateEndIDs.push(columnID);
            }
         }
         const replacementEndID = candidateEndIDs.find((columnID) => (
            columnID &&
            columnID !== binding.startColumnID &&
            isPlainObject(getCriteriaColumnByID(workbook, columnID))
         ));
         if (replacementEndID) {
            binding.endLayer.columnID = replacementEndID;
            effectiveEndColumnID = replacementEndID;
            effectiveEndColumn = getCriteriaColumnByID(workbook, replacementEndID);
         }
      }

      const shouldPatchDuration = sameColumnID || sameExpression;
      if (!shouldPatchDuration || !isPlainObject(effectiveEndColumn)) {
         continue;
      }

      const derivedExpression = buildGanttDerivedEndExpression(binding.startExpression);
      if (!derivedExpression) {
         continue;
      }

      if (!isPlainObject(effectiveEndColumn.columnFormula)) {
         effectiveEndColumn.columnFormula = {};
      }
      if (!isPlainObject(effectiveEndColumn.columnFormula.expr)) {
         effectiveEndColumn.columnFormula.expr = {
            type: 'sawx:sqlExpression',
            children: []
         };
      }
      effectiveEndColumn.columnFormula.expr.type = effectiveEndColumn.columnFormula.expr.type || 'sawx:sqlExpression';
      if (!Array.isArray(effectiveEndColumn.columnFormula.expr.children)) {
         effectiveEndColumn.columnFormula.expr.children = [];
      }
      effectiveEndColumn.columnFormula.expr.expression = derivedExpression;
      effectiveEndColumn.userExpression = true;
   }
}

function pickFirstColumnID(candidates = [], excluded = new Set()) {
   for (const rawColumnID of Array.isArray(candidates) ? candidates : []) {
      const columnID = normalizeColumnID(rawColumnID);
      if (!columnID) {
         continue;
      }
      if (excluded.has(columnID)) {
         continue;
      }
      return columnID;
   }
   return null;
}

function patchParallelCoordinatesNormalizeExecutionTrellis(workbook) {
   const parallelViews = getPluginViewsByFamily(workbook, 'parallel_coordinates');
   if (parallelViews.length === 0) {
      return;
   }

   for (const viewMeta of parallelViews) {
      const pluginView = viewMeta.view;
      const logicalEdges = getLogicalEdges(pluginView);
      if (!isPlainObject(logicalEdges)) {
         continue;
      }

      const rowCandidateIDs = getLogicalEdgeColumnIDs(logicalEdges, 'row');
      const fallbackDimensionIDs = getDimensionTemporalColumnIDs(workbook);
      const rowColumnID = pickFirstColumnID([...rowCandidateIDs, ...fallbackDimensionIDs]);
      if (!rowColumnID) {
         continue;
      }

      const likelyMeasureIDs = new Set(collectLikelyMeasureColumnIDs(workbook));
      for (const measureID of getMeasureColumnIDsFromCriteria(workbook)) {
         likelyMeasureIDs.add(measureID);
      }
      const colCandidateIDs = getLogicalEdgeColumnIDs(logicalEdges, 'col');
      const measureColumnID = pickFirstColumnID(
         [
            ...colCandidateIDs.filter((columnID) => likelyMeasureIDs.has(columnID) || inferColumnClassFromID(columnID) === 'measure'),
            ...getMeasureColumnIDsFromCriteria(workbook)
         ]
      );
      if (!measureColumnID) {
         continue;
      }

      normalizeExecutionEdgesForPluginView(pluginView, [rowColumnID], measureColumnID);
   }
}

function patchGanttNormalizeExecutionTrellis(workbook) {
   const ganttViews = getPluginViewsByFamily(workbook, 'gantt');
   if (ganttViews.length === 0) {
      return;
   }

   for (const viewMeta of ganttViews) {
      const pluginView = viewMeta.view;
      const logicalEdges = getLogicalEdges(pluginView);
      if (!isPlainObject(logicalEdges)) {
         continue;
      }

      const rowColumnID = pickFirstColumnID([
         ...getLogicalEdgeColumnIDs(logicalEdges, 'row'),
         ...getLogicalEdgeColumnIDs(logicalEdges, 'detail'),
         ...getDimensionTemporalColumnIDs(workbook)
      ]);
      if (!rowColumnID) {
         continue;
      }

      const binding = getGanttStartEndBinding(workbook, logicalEdges);
      const excluded = new Set(
         [binding.startColumnID, binding.endColumnID]
            .map((columnID) => normalizeColumnID(columnID))
            .filter((columnID) => columnID !== '')
      );
      const likelyMeasureIDs = new Set(collectLikelyMeasureColumnIDs(workbook));
      const columnCandidateIDs = [
         ...getMeasureColumnIDsFromCriteria(workbook),
         ...getLogicalEdgeColumnIDs(logicalEdges, 'col'),
         ...getLogicalEdgeColumnIDs(logicalEdges, 'detail'),
         ...getDimensionTemporalColumnIDs(workbook),
         ...getCriteriaColumns(workbook).map((column) => normalizeColumnID(column?.columnID))
      ];
      const executionColumnID = pickFirstColumnID(
         [
            ...columnCandidateIDs.filter((columnID) => likelyMeasureIDs.has(columnID) || inferColumnClassFromID(columnID) === 'measure'),
            ...columnCandidateIDs
         ],
         excluded
      );
      if (!executionColumnID) {
         continue;
      }

      normalizeExecutionEdgesForPluginView(pluginView, [rowColumnID], executionColumnID);
   }
}

function ensureSingleLayerDataLayersInfoForView(pluginView) {
   if (!isPlainObject(pluginView)) {
      return;
   }

   if (!isPlainObject(pluginView.dataModels)) {
      pluginView.dataModels = { children: [] };
   }
   if (!Array.isArray(pluginView.dataModels.children) || pluginView.dataModels.children.length === 0) {
      pluginView.dataModels.children = [{ name: 'dm1' }];
   }

   const primaryDataModel = pluginView.dataModels.children[0];
   if (!isPlainObject(primaryDataModel)) {
      pluginView.dataModels.children[0] = { name: 'dm1' };
   }
   const dataModel = pluginView.dataModels.children[0];
   const dataModelName = typeof dataModel.name === 'string' && dataModel.name.trim() !== ''
      ? dataModel.name.trim()
      : 'dm1';
   dataModel.name = dataModelName;

   if (!isPlainObject(dataModel.logicalDataModel)) {
      dataModel.logicalDataModel = {
         _version: '1.0.0',
         settings: {
            logicalDataModel: {
               _settingsVersion: '2.0.1',
               logicalEdges: {}
            },
            ldm_generation: 1
         }
      };
   }
   const logicalDataModel = dataModel.logicalDataModel;
   if (!isPlainObject(logicalDataModel.settings)) {
      logicalDataModel.settings = {
         logicalDataModel: {
            _settingsVersion: '2.0.1',
            logicalEdges: {}
         },
         ldm_generation: 1
      };
   }
   const logicalDataModelSettings = logicalDataModel.settings;
   if (!isPlainObject(logicalDataModelSettings.logicalDataModel)) {
      logicalDataModelSettings.logicalDataModel = {
         _settingsVersion: '2.0.1',
         logicalEdges: {}
      };
   }
   const ldm = logicalDataModelSettings.logicalDataModel;
   if (!isPlainObject(ldm.logicalEdges)) {
      ldm.logicalEdges = {};
   }
   if (typeof ldm._settingsVersion !== 'string' || ldm._settingsVersion.trim() === '') {
      ldm._settingsVersion = '2.0.1';
   }
   const dataLayersInfo = ensureObjectProperty(ldm, 'dataLayersInfo', {
      activeDataLayer: dataModelName,
      dataLayers: {}
   });
   if (!isPlainObject(dataLayersInfo.dataLayers)) {
      dataLayersInfo.dataLayers = {};
   }
   if (typeof dataLayersInfo.activeDataLayer !== 'string' || dataLayersInfo.activeDataLayer.trim() === '') {
      dataLayersInfo.activeDataLayer = dataModelName;
   }
   const activeDataLayer = dataLayersInfo.activeDataLayer.trim();
   if (!isPlainObject(dataLayersInfo.dataLayers[activeDataLayer])) {
      dataLayersInfo.dataLayers[activeDataLayer] = {};
   }
   const activeLayerPayload = dataLayersInfo.dataLayers[activeDataLayer];
   if (typeof activeLayerPayload.dataModelName !== 'string' || activeLayerPayload.dataModelName.trim() === '') {
      activeLayerPayload.dataModelName = dataModelName;
   }
   if (!isPlainObject(activeLayerPayload.logicalDataModel)) {
      activeLayerPayload.logicalDataModel = {
         _settingsVersion: '1.0.0',
         logicalEdges: {}
      };
   } else {
      if (typeof activeLayerPayload.logicalDataModel._settingsVersion !== 'string'
         || activeLayerPayload.logicalDataModel._settingsVersion.trim() === '') {
         activeLayerPayload.logicalDataModel._settingsVersion = '1.0.0';
      }
      if (!isPlainObject(activeLayerPayload.logicalDataModel.logicalEdges)) {
         activeLayerPayload.logicalDataModel.logicalEdges = {};
      }
   }
   if (!Number.isInteger(activeLayerPayload.order)) {
      activeLayerPayload.order = 0;
   }

   if (!isPlainObject(dataLayersInfo.dataLayers[dataModelName])) {
      dataLayersInfo.dataLayers[dataModelName] = {
         dataModelName,
         logicalDataModel: {
            _settingsVersion: '1.0.0',
            logicalEdges: {}
         },
         order: 0
      };
   }
}

function patchEnsureSingleLayerDataLayersInfo(workbook) {
   const targetFamilies = ['map', 'network_graph', 'parallel_coordinates', 'gantt'];
   for (const familyName of targetFamilies) {
      const familyViews = getPluginViewsByFamily(workbook, familyName);
      for (const viewMeta of familyViews) {
         ensureSingleLayerDataLayersInfoForView(viewMeta.view);
      }
   }
}

function ensurePrimaryDataModelForPatch(pluginView) {
   if (!isPlainObject(pluginView.dataModels)) {
      pluginView.dataModels = { children: [] };
   }
   if (!Array.isArray(pluginView.dataModels.children)) {
      pluginView.dataModels.children = [];
   }
   if (!isPlainObject(pluginView.dataModels.children[0])) {
      pluginView.dataModels.children[0] = { name: 'dm1' };
   }
   if (!pluginView.dataModels.children[0].name) {
      pluginView.dataModels.children[0].name = 'dm1';
   }
   return pluginView.dataModels.children[0];
}

function ensureEdgeForAxis(pluginView, axis) {
   const dataModel = ensurePrimaryDataModelForPatch(pluginView);
   if (!isPlainObject(dataModel.edges)) {
      dataModel.edges = { children: [] };
   }
   if (!Array.isArray(dataModel.edges.children)) {
      dataModel.edges.children = [];
   }
   let edge = dataModel.edges.children.find((entry) => isPlainObject(entry) && entry.axis === axis) || null;
   if (!edge) {
      edge = {
         axis
      };
      if (axis === 'row' || axis === 'column') {
         edge.showColumnHeader = 'rollover';
      }
      if (axis === 'column') {
         edge.dependent = true;
      }
      dataModel.edges.children.push(edge);
   }
   return edge;
}

function setEdgeColumnLayers(pluginView, axis, columnIDs) {
   const normalizedIDs = (Array.isArray(columnIDs) ? columnIDs : [])
      .map((columnID) => normalizeColumnID(columnID))
      .filter((columnID, index, array) => columnID !== '' && array.indexOf(columnID) === index);
   if (normalizedIDs.length === 0) {
      return;
   }
   const edge = ensureEdgeForAxis(pluginView, axis);
   edge.edgeLayers = {
      children: normalizedIDs.map((columnID) => ({
         type: 'column',
         columnID
      }))
   };
}

function clearEdgeLayersForAxis(pluginView, axis) {
   const edge = ensureEdgeForAxis(pluginView, axis);
   edge.edgeLayers = { children: [] };
}

function removeEdgeLayersForAxis(pluginView, axis) {
   const edge = ensureEdgeForAxis(pluginView, axis);
   delete edge.edgeLayers;
}

function normalizeExecutionEdgesForPluginView(pluginView, rowColumnIDs, measureColumnID) {
   const normalizedMeasureID = normalizeColumnID(measureColumnID);
   for (const executionMeta of getExecutionPluginViews(pluginView)) {
      setEdgeColumnLayers(executionMeta.view, 'row', rowColumnIDs);
      if (normalizedMeasureID) {
         setEdgeColumnLayers(executionMeta.view, 'column', [normalizedMeasureID]);
      }
   }
}

function normalizeMapExecutionEdgesForPluginView(pluginView, rowColumnIDs) {
   for (const executionMeta of getExecutionPluginViews(pluginView)) {
      setEdgeColumnLayers(executionMeta.view, 'row', rowColumnIDs);
      clearEdgeLayersForAxis(executionMeta.view, 'column');
   }
}

function ensureEmbeddedMeasureView(pluginView) {
   if (!isPlainObject(pluginView.nestedViews)) {
      pluginView.nestedViews = { children: [] };
   }
   if (!Array.isArray(pluginView.nestedViews.children)) {
      pluginView.nestedViews.children = [];
   }
   let nestedEntry = pluginView.nestedViews.children.find((entry) => (
      entry?.position === 'embedded' &&
      entry?.view?.type === 'saw:pluginView' &&
      entry?.view?.viewName === 'MeasureView_0'
   ));
   if (!nestedEntry) {
      nestedEntry = {
         position: 'embedded',
         view: {
            type: 'saw:pluginView',
            pluginType: pluginView.pluginType,
            viewName: 'MeasureView_0',
            dataModels: { children: [] }
         }
      };
      pluginView.nestedViews.children = [nestedEntry];
   } else {
      pluginView.nestedViews.children = [nestedEntry];
   }
   const nestedView = nestedEntry.view;
   nestedView.pluginType = pluginView.pluginType;
   nestedView.viewName = 'MeasureView_0';
   if (!isPlainObject(nestedView.dataModels)) {
      nestedView.dataModels = { children: [] };
   }
   if (!Array.isArray(nestedView.dataModels.children) || nestedView.dataModels.children.length === 0) {
      nestedView.dataModels.children = [{ name: 'dm1' }];
   }
   return nestedView;
}

function normalizeMapEmbeddedRuntimeScaffold(pluginView, detailColumnID, measureColumnID) {
   const dataModel = getPrimaryDataModel(pluginView);
   if (!isPlainObject(dataModel)) {
      return;
   }
   const dataModelName = normalizeColumnID(dataModel.name) || 'dm1';
   if (!isPlainObject(dataModel.logicalDataModel)) {
      dataModel.logicalDataModel = {
         _version: '1.0.0',
         settings: {
            logicalDataModel: {},
            ldm_generation: 1
         }
      };
   }
   if (!isPlainObject(dataModel.logicalDataModel.settings)) {
      dataModel.logicalDataModel.settings = {};
   }
   const ldm = ensureObjectProperty(dataModel.logicalDataModel.settings, 'logicalDataModel', {});
   ldm._settingsVersion = '2.0.1';
   const logicalEdges = ensureObjectProperty(ldm, 'logicalEdges', {});
   logicalEdges.measures = { logicalEdgeLayers: [] };
   if (detailColumnID) {
      logicalEdges.detail = {
         logicalEdgeLayers: [
            {
               columnID: detailColumnID,
               type: 'column',
               isUsed: true
            }
         ]
      };
   }
   if (measureColumnID) {
      logicalEdges.color = {
         logicalEdgeLayers: [
            {
               columnID: measureColumnID,
               type: 'column',
               isUsed: true
            },
            {
               type: 'measure',
               visibility: 'hidden',
               userAdded: false,
               isUsed: false
            }
         ]
      };
   }
   ldm.dataLayersInfo = {
      activeDataLayer: dataModelName,
      dataLayers: {
         [dataModelName]: {
            dataModelName,
            logicalDataModel: {
               logicalEdges: deepClone(logicalEdges),
               _settingsVersion: '2.0.1'
            },
            order: 0,
            namespacedConfig: {
               viz_map: {}
            }
         }
      }
   };
   dataModel.measuresList = {
      children: [
         {
            columnID: EMBEDDED_VIZ_DUMMY_MEASURE_LINK_COLUMN_ID,
            type: 'view',
            name: 'MeasureView_0'
         }
      ]
   };
   removeEdgeLayersForAxis(pluginView, 'row');
   removeEdgeLayersForAxis(pluginView, 'column');

   const nestedView = ensureEmbeddedMeasureView(pluginView);
   const nestedDataModel = nestedView.dataModels.children[0];
   nestedDataModel.name = dataModelName;
   nestedDataModel.edges = {
      children: [
         {
            axis: 'row',
            showColumnHeader: 'rollover',
            edgeLayers: {
               children: detailColumnID
                  ? [
                     {
                        type: 'column',
                        columnID: detailColumnID
                     }
                  ]
                  : []
            }
         },
         {
            axis: 'column',
            showColumnHeader: 'rollover',
            dependent: true
         },
         {
            axis: 'page'
         },
         {
            axis: 'section'
         }
      ]
   };
   nestedDataModel.measuresList = {
      children: [
         {
            columnID: EMBEDDED_VIZ_DUMMY_MEASURE_LINK_COLUMN_ID,
            type: 'column',
            propertyAdditions: {
               children: measureColumnID ? buildAutovizPropertyAdditions(measureColumnID, false) : []
            }
         }
      ]
   };
}

function ensureLogicalDetailColumns(logicalEdges, detailColumnIDs) {
   if (!isPlainObject(logicalEdges)) {
      return;
   }
   if (!isPlainObject(logicalEdges.detail)) {
      logicalEdges.detail = { logicalEdgeLayers: [] };
   }
   if (!Array.isArray(logicalEdges.detail.logicalEdgeLayers)) {
      logicalEdges.detail.logicalEdgeLayers = [];
   }
   for (const columnID of detailColumnIDs) {
      const normalizedID = normalizeColumnID(columnID);
      if (!normalizedID) {
         continue;
      }
      const hasDetailColumn = logicalEdges.detail.logicalEdgeLayers.some((layer) => normalizeColumnID(layer?.columnID) === normalizedID);
      if (!hasDetailColumn) {
         logicalEdges.detail.logicalEdgeLayers.push({
            columnID: normalizedID,
            type: 'column',
            isUsed: true
         });
      }
   }
}

function patchMapEnsureAutovizAndVizMapScaffold(workbook) {
   const mapViews = getPluginViewsByFamily(workbook, 'map');
   if (mapViews.length === 0) {
      return;
   }

   for (const viewMeta of mapViews) {
      const pluginView = viewMeta.view;
      if (!isPlainObject(pluginView.viewConfig)) {
         pluginView.viewConfig = { _version: viewConfigDefaultVersion, settings: {} };
      }
      if (!isPlainObject(pluginView.viewConfig.settings)) {
         pluginView.viewConfig.settings = {};
      }
      const settings = pluginView.viewConfig.settings;

      if (!isPlainObject(settings['obitech-autoviz/autoviz'])) {
         settings['obitech-autoviz/autoviz'] = {};
      }
      settings['obitech-autoviz/autoviz'].innerPluginType = pluginView.pluginType;

      if (!isPlainObject(settings['viz:chart'])) {
         settings['viz:chart'] = {};
      }
      if (!isPlainObject(settings['viz:chart'].viz_map)) {
         settings['viz:chart'].viz_map = {};
      }

      const logicalEdges = getLogicalEdges(pluginView);
      const detailColumnID = getPreferredMapDetailColumnID(workbook, logicalEdges);
      const measureColumnID = getPreferredMeasureColumnID(workbook, logicalEdges);
      normalizeMapEmbeddedRuntimeScaffold(pluginView, detailColumnID, measureColumnID);
   }
}

function clearLogicalEdgeLayers(logicalEdges, edgeKeys) {
   if (!isPlainObject(logicalEdges)) {
      return;
   }
   for (const edgeKey of edgeKeys) {
      if (!isPlainObject(logicalEdges[edgeKey])) {
         continue;
      }
      if (Array.isArray(logicalEdges[edgeKey].logicalEdgeLayers) && logicalEdges[edgeKey].logicalEdgeLayers.length > 0) {
         logicalEdges[edgeKey].logicalEdgeLayers = [];
      }
   }
}

function patchMapDropRenderTypeInvalidEdges(workbook) {
   const mapViews = getPluginViewsByFamily(workbook, 'map');
   if (mapViews.length === 0) {
      return;
   }
   const renderTypeInvalidEdgeMatrix = isPlainObject(mapNetworkAllowlists?.map?.renderTypeInvalidLogicalEdges)
      ? mapNetworkAllowlists.map.renderTypeInvalidLogicalEdges
      : {};

   for (const viewMeta of mapViews) {
      const pluginView = viewMeta.view;
      const renderType = getMapRenderType(pluginView);
      if (!renderType) {
         continue;
      }
      const disallowedEdges = Array.isArray(renderTypeInvalidEdgeMatrix[renderType])
         ? renderTypeInvalidEdgeMatrix[renderType]
         : [];
      if (disallowedEdges.length === 0) {
         continue;
      }
      clearLogicalEdgeLayers(getLogicalEdges(pluginView), disallowedEdges);
      const dataLayers = getDataLayersInfo(pluginView)?.dataLayers;
      if (isPlainObject(dataLayers)) {
         for (const layerConfig of Object.values(dataLayers)) {
            clearLogicalEdgeLayers(layerConfig?.logicalDataModel?.logicalEdges, disallowedEdges);
         }
      }
   }
}

function patchNetworkEnsureAutovizInnerPlugin(workbook) {
   const networkViews = getPluginViewsByFamily(workbook, 'network_graph');
   if (networkViews.length === 0) {
      return;
   }
   for (const viewMeta of networkViews) {
      const pluginView = viewMeta.view;
      if (!isPlainObject(pluginView.viewConfig)) {
         pluginView.viewConfig = { _version: viewConfigDefaultVersion, settings: {} };
      }
      if (!isPlainObject(pluginView.viewConfig.settings)) {
         pluginView.viewConfig.settings = {};
      }
      if (!isPlainObject(pluginView.viewConfig.settings['obitech-autoviz/autoviz'])) {
         pluginView.viewConfig.settings['obitech-autoviz/autoviz'] = {};
      }
      pluginView.viewConfig.settings['obitech-autoviz/autoviz'].innerPluginType = pluginView.pluginType;

      const logicalEdges = getLogicalEdges(pluginView);
      const detailColumnIDs = getPreferredNetworkDetailColumnIDs(workbook, logicalEdges, 2);
      const measureColumnID = getPreferredMeasureColumnID(workbook, logicalEdges);
      ensureLogicalDetailColumns(logicalEdges, detailColumnIDs);
      normalizeExecutionEdgesForPluginView(pluginView, detailColumnIDs, measureColumnID);
   }
}

function patchSankeyEnsureDefaultSettings(workbook) {
   const sankeyViews = getPluginViews(workbook).filter((entry) => entry?.view?.pluginType === 'oracle.bi.tech.sankey');
   if (sankeyViews.length === 0) {
      return;
   }
   const sankeyDefaultSettings = isPlainObject(mapNetworkAllowlists?.sankey?.defaultSettings)
      ? mapNetworkAllowlists.sankey.defaultSettings
      : {
         nodeHeightType: 'condense',
         nodeWidthType: 'auto',
         nodeGapType: 'auto',
         lineTransparencyType: 'auto',
         dataLabelPosition: 'insideNode'
      };

   for (const viewMeta of sankeyViews) {
      const pluginView = viewMeta.view;
      if (!isPlainObject(pluginView.viewConfig)) {
         pluginView.viewConfig = { _version: viewConfigDefaultVersion, settings: {} };
      }
      if (!isPlainObject(pluginView.viewConfig.settings)) {
         pluginView.viewConfig.settings = {};
      }
      if (!isPlainObject(pluginView.viewConfig.settings['viz:sankeychart'])) {
         pluginView.viewConfig.settings['viz:sankeychart'] = {};
      }
      const sankeySettings = pluginView.viewConfig.settings['viz:sankeychart'];
      for (const [settingKey, settingValue] of Object.entries(sankeyDefaultSettings)) {
         if (!(settingKey in sankeySettings)) {
            sankeySettings[settingKey] = settingValue;
         }
      }
   }
}

function patchAutovizScaffold(workbook) {
   const autovizViews = getPluginViewsByFamily(workbook, 'chart_autoviz');
   if (autovizViews.length === 0) {
      return;
   }

   const criteriaColumns = workbook.criteria?.columns?.children || [];
   const criteriaByColumnID = new Map(
      criteriaColumns
         .filter((column) => normalizeColumnID(column?.columnID))
         .map((column) => [normalizeColumnID(column.columnID), column])
   );
   const fallbackDetailColumn = criteriaColumns.find((column) => (
      String(column?.columnID || '').startsWith('dim_') || String(column?.columnID || '').startsWith('time_')
   ));
   const fallbackMeasureColumns = criteriaColumns.filter((column) => String(column?.columnID || '').startsWith('mea_'));
   if (fallbackMeasureColumns.length === 0 || !fallbackDetailColumn) {
      return;
   }

   for (const viewMeta of autovizViews) {
      const pluginView = viewMeta.view;
      const includeMinMax = pluginView?.pluginType === 'oracle.bi.tech.chart.donut';
      const isScatter = pluginView?.pluginType === 'oracle.bi.tech.chart.scatter';
      if (!pluginView.viewConfig) {
         pluginView.viewConfig = { _version: viewConfigDefaultVersion, settings: {} };
      }
      if (!pluginView.viewConfig.settings) {
         pluginView.viewConfig.settings = {};
      }
      pluginView.viewConfig.settings['obitech-autoviz/autoviz'] = {
         innerPluginType: pluginView.pluginType
      };
      if (!pluginView.viewConfig.settings['oracle.bi.tech.table']) {
         pluginView.viewConfig.settings['oracle.bi.tech.table'] = {
            _version: '1.0.1',
            settings: {}
         };
      }

      if (!pluginView.dataModels) {
         pluginView.dataModels = { children: [] };
      }
      if (!pluginView.dataModels.children || pluginView.dataModels.children.length === 0) {
         pluginView.dataModels.children = [{ name: 'dm1' }];
      }

      const dataModel = pluginView.dataModels.children[0];
      const existingLogicalEdges = getLogicalEdges(pluginView) || {};
      const existingNestedDataModel = getNestedMeasureViewDataModel(pluginView);
      const existingLogicalMeasureLayers = Array.isArray(existingLogicalEdges?.measures?.logicalEdgeLayers)
         ? existingLogicalEdges.measures.logicalEdgeLayers.filter((layer) => (
            layer?.type === 'column' && criteriaByColumnID.has(normalizeColumnID(layer?.columnID))
         ))
         : [];
      const existingNestedMeasureLayers = Array.isArray(existingNestedDataModel?.measuresList?.children)
         ? existingNestedDataModel.measuresList.children.filter((layer) => (
            layer?.type === 'column' && criteriaByColumnID.has(normalizeColumnID(layer?.columnID))
         ))
         : [];
      const sourceMeasureLayers = existingLogicalMeasureLayers.length > 0
         ? existingLogicalMeasureLayers
         : existingNestedMeasureLayers;
      const requiredMeasureCount = isScatter ? 2 : 1;
      const fallbackMeasureLayers = fallbackMeasureColumns.map((column) => ({
         columnID: column.columnID,
         type: 'column',
         isUsed: true
      }));
      const effectiveMeasureLayers = sourceMeasureLayers.length >= requiredMeasureCount
         ? (isScatter ? sourceMeasureLayers.slice(0, requiredMeasureCount) : sourceMeasureLayers)
         : [...sourceMeasureLayers, ...fallbackMeasureLayers]
            .filter((layer, index, layers) => layers.findIndex((candidate) => (
               normalizeColumnID(candidate?.columnID) === normalizeColumnID(layer?.columnID)
            )) === index)
            .slice(0, requiredMeasureCount);
      if (effectiveMeasureLayers.length < requiredMeasureCount) {
         continue;
      }
      const primaryMeasureColumnID = normalizeColumnID(effectiveMeasureLayers[0]?.columnID);
      const existingDetailColumnID = getFirstLogicalEdgeColumnID(existingLogicalEdges, 'detail')
         || getNestedExecutionColumnIDs(existingNestedDataModel, 'row')[0]
         || normalizeColumnID(fallbackDetailColumn.columnID);
      const detailColumnID = criteriaByColumnID.has(existingDetailColumnID)
         ? existingDetailColumnID
         : normalizeColumnID(fallbackDetailColumn.columnID);
      const existingColorColumnID = getFirstLogicalEdgeColumnID(existingLogicalEdges, 'color');
      const colorCriteriaColumn = criteriaByColumnID.get(existingColorColumnID);
      const scatterCategoricalColorColumnID = isScatter
         && colorCriteriaColumn
         && !String(existingColorColumnID).startsWith('mea_')
         ? existingColorColumnID
         : null;
      const scatterContinuousColorMeasureID = isScatter && !scatterCategoricalColorColumnID
         ? (getScatterContinuousColorMeasureID(existingLogicalEdges, existingNestedDataModel)
            || (String(existingColorColumnID).startsWith('mea_') ? existingColorColumnID : null))
         : null;
      if (!dataModel.logicalDataModel) {
         dataModel.logicalDataModel = {
            _version: '1.0.0',
            settings: {
               logicalDataModel: {
                  logicalEdges: {},
                  _settingsVersion: '2.0.1'
               },
               ldm_generation: 1
            }
         };
      }

      const logicalEdges = dataModel.logicalDataModel.settings.logicalDataModel.logicalEdges || {};
      logicalEdges.measures = {
         logicalEdgeLayers: effectiveMeasureLayers.map((sourceLayer, index) => {
            const layer = {
               ...deepClone(sourceLayer),
               columnID: normalizeColumnID(sourceLayer.columnID),
               type: 'column',
               isUsed: true
            };
            if (isScatter) {
               layer.tags = [index === 0 ? SCATTER_X_TAG : SCATTER_Y_TAG];
            }
            return layer;
         })
      };
      logicalEdges.detail = {
         logicalEdgeLayers: [
            {
               columnID: detailColumnID,
               type: 'column',
               isUsed: true
            }
         ]
      };
      if (isScatter) {
         if (scatterCategoricalColorColumnID) {
            logicalEdges.color = {
               logicalEdgeLayers: [{
                  columnID: scatterCategoricalColorColumnID,
                  type: 'column',
                  isUsed: true
               }]
            };
         } else if (scatterContinuousColorMeasureID) {
            logicalEdges.color = {
               logicalEdgeLayers: [{
                  columnID: scatterContinuousColorMeasureID,
                  type: 'column',
                  isUsed: true
               }]
            };
         } else {
            delete logicalEdges.color;
         }
      } else {
         logicalEdges.color = {
            logicalEdgeLayers: [
               {
                  columnID: primaryMeasureColumnID,
                  type: 'column',
                  isUsed: true
               },
               {
                  type: 'measure',
                  visibility: 'hidden',
                  userAdded: false,
                  isUsed: true
               }
            ]
         };
      }
      dataModel.logicalDataModel.settings.logicalDataModel.logicalEdges = logicalEdges;

      if (!dataModel.measuresList) {
         dataModel.measuresList = { children: [] };
      }
      dataModel.measuresList.children = [
         {
            columnID: primaryMeasureColumnID,
            type: 'view',
            name: 'MeasureView_0',
            aggRule: 'none'
         }
      ];

      const scatterPropertyAdditions = isScatter
         ? propertyAdditionsFromRequirements(buildScatterNestedPropertyRequirements(
            normalizeColumnID(effectiveMeasureLayers[0]?.columnID),
            normalizeColumnID(effectiveMeasureLayers[1]?.columnID),
            scatterContinuousColorMeasureID
         ))
         : null;
      const executionColumnLayers = [
         ...(scatterCategoricalColorColumnID
            ? [{ type: 'column', columnID: scatterCategoricalColorColumnID }]
            : []),
         { type: 'measure', visibility: 'hidden' }
      ];

      pluginView.nestedViews = {
         children: [
            {
               position: 'embedded',
               view: {
                  type: 'saw:pluginView',
                  pluginType: pluginView.pluginType,
                  viewName: 'MeasureView_0',
                  dataModels: {
                     children: [
                        {
                           name: 'dm1',
                           edges: {
                              children: [
                                 {
                                    axis: 'row',
                                    showColumnHeader: 'rollover',
                                    edgeLayers: {
                                       children: [
                                          {
                                             type: 'column',
                                             columnID: detailColumnID
                                          }
                                       ]
                                    }
                                 },
                                 {
                                    axis: 'column',
                                    showColumnHeader: 'rollover',
                                    dependent: true,
                                    edgeLayers: {
                                       children: executionColumnLayers
                                    }
                                 },
                                 {
                                    axis: 'page'
                                 },
                                 {
                                    axis: 'section'
                                 }
                              ]
                           },
                           measuresList: {
                              children: isScatter
                                 ? effectiveMeasureLayers.map((sourceLayer, index) => {
                                    const layer = {
                                       ...deepClone(sourceLayer),
                                       columnID: normalizeColumnID(sourceLayer.columnID),
                                       type: 'column',
                                       isUsed: true,
                                       tags: [index === 0 ? SCATTER_X_TAG : SCATTER_Y_TAG]
                                    };
                                    delete layer.propertyAdditions;
                                    if (index === 0) {
                                       layer.propertyAdditions = { children: scatterPropertyAdditions };
                                    } else if (scatterContinuousColorMeasureID) {
                                       layer.propertyAdditions = {
                                          children: propertyAdditionsFromRequirements({
                                             color: {
                                                valueColumnID: scatterContinuousColorMeasureID,
                                                aggRule: 'default',
                                                placement: 'all',
                                                stacked: false,
                                                grainEdge: 'none',
                                                acrossMeasures: 'single'
                                             }
                                          })
                                       };
                                    }
                                    return layer;
                                 })
                                 : effectiveMeasureLayers.map((sourceLayer) => {
                                    const columnID = normalizeColumnID(sourceLayer.columnID);
                                    return {
                                       ...deepClone(sourceLayer),
                                       columnID,
                                       type: 'column',
                                       isUsed: true,
                                       propertyAdditions: {
                                          children: buildAutovizPropertyAdditions(columnID, includeMinMax)
                                       }
                                    };
                                 })
                           }
                        }
                     ]
                  },
                  physicalDataModelVersion: '2.5'
               }
            }
         ]
      };

      if (!pluginView.physicalDataModelVersion) {
         pluginView.physicalDataModelVersion = '2.5';
      }
   }
}

function patchComboMultilayerScaffold(workbook) {
   const comboViews = getPluginViewsByFamily(workbook, 'chart_combo_multilayer');
   if (comboViews.length === 0) {
      return;
   }

   const criteriaColumns = workbook.criteria?.columns?.children || [];
   const detailColumn = criteriaColumns.find((col) => String(col?.columnID || '').startsWith('time_')) ||
      criteriaColumns.find((col) => String(col?.columnID || '').startsWith('dim_'));
   const measureColumns = criteriaColumns.filter((col) => String(col?.columnID || '').startsWith('mea_'));
   if (!detailColumn || measureColumns.length === 0) {
      return;
   }

   const primaryMeasure = measureColumns[0];
   const secondaryMeasure = measureColumns[1] || measureColumns[0];
   const layerBindings = [
      {
         layerName: 'ndm2',
         chartType: 'bar',
         measureColumnID: primaryMeasure.columnID,
         order: 0
      },
      {
         layerName: 'ndm3',
         chartType: 'line',
         measureColumnID: secondaryMeasure.columnID,
         order: 1
      }
   ];

   const profile = findRuntimeProfile(workbook.projectVersion);
   const comboCapabilities = getSchemaCapabilities(profile, 'chart_combo_multilayer');
   const allowMeasureInfos = comboCapabilities.allowMeasureInfos !== false;

   for (const viewMeta of comboViews) {
      const pluginView = viewMeta.view;
      if (!pluginView.viewConfig) {
         pluginView.viewConfig = { _version: viewConfigDefaultVersion, settings: {} };
      }
      if (!pluginView.viewConfig.settings) {
         pluginView.viewConfig.settings = {};
      }
      if (!pluginView.viewConfig.settings['oracle.bi.tech.table']) {
         pluginView.viewConfig.settings['oracle.bi.tech.table'] = {
            _version: '1.0.1',
            settings: {}
         };
      }
      pluginView.viewConfig.settings['obitech-autoviz/autoviz'] = {
         innerPluginType: pluginView.pluginType
      };
      if (!pluginView.viewConfig.settings['oracle.bi.tech.chart.comboMultiLayerChart']) {
         pluginView.viewConfig.settings['oracle.bi.tech.chart.comboMultiLayerChart'] = {
            _version: '1.0.0',
            settings: {}
         };
      }

      const comboSettings = pluginView.viewConfig.settings['oracle.bi.tech.chart.comboMultiLayerChart'].settings || {};
      comboSettings.dataLayersInfo = {};
      for (const layerBinding of layerBindings) {
         comboSettings.dataLayersInfo[layerBinding.layerName] = layerBinding.chartType;
      }
      if (!allowMeasureInfos && Object.prototype.hasOwnProperty.call(comboSettings, 'measureInfos')) {
         delete comboSettings.measureInfos;
      }
      pluginView.viewConfig.settings['oracle.bi.tech.chart.comboMultiLayerChart'].settings = comboSettings;

      if (!pluginView.dataModels) {
         pluginView.dataModels = { children: [] };
      }
      if (!pluginView.dataModels.children || pluginView.dataModels.children.length === 0) {
         pluginView.dataModels.children = [{ name: 'dm1' }];
      }
      const dataModel = pluginView.dataModels.children[0];
      dataModel.name = 'dm1';
      if (!dataModel.logicalDataModel) {
         dataModel.logicalDataModel = {
            _version: '1.0.0',
            settings: {
               logicalDataModel: {
                  _settingsVersion: '2.0.1',
                  logicalEdges: {}
               },
               ldm_generation: 1
            }
         };
      }
      if (!dataModel.logicalDataModel.settings) {
         dataModel.logicalDataModel.settings = { logicalDataModel: { _settingsVersion: '2.0.1', logicalEdges: {} } };
      }
      if (!dataModel.logicalDataModel.settings.logicalDataModel) {
         dataModel.logicalDataModel.settings.logicalDataModel = { _settingsVersion: '2.0.1', logicalEdges: {} };
      }
      const ldm = dataModel.logicalDataModel.settings.logicalDataModel;
      ldm._settingsVersion = ldm._settingsVersion || '2.0.1';
      ldm.dataLayersInfo = {
         activeDataLayer: layerBindings[layerBindings.length - 1].layerName,
         dataLayers: {}
      };
      for (const layerBinding of layerBindings) {
         ldm.dataLayersInfo.dataLayers[layerBinding.layerName] = {
            dataModelName: layerBinding.layerName,
            logicalDataModel: {
               _settingsVersion: '1.0.0',
               logicalEdges: {
                  color: {
                     logicalEdgeLayers: [
                        {
                           type: 'measure',
                           visibility: 'hidden',
                           userAdded: false,
                           isUsed: true
                        }
                     ]
                  },
                  measures: {
                     logicalEdgeLayers: [
                        {
                           columnID: layerBinding.measureColumnID,
                           type: 'column',
                           isUsed: true
                        }
                     ]
                  }
               }
            },
            order: layerBinding.order
         };
      }
      ldm.logicalEdges = {
         color: {
            logicalEdgeLayers: [
               {
                  type: 'measure',
                  visibility: 'hidden',
                  userAdded: false,
                  isUsed: true
               }
            ]
         },
         detail: {
            logicalEdgeLayers: [
               {
                  columnID: detailColumn.columnID,
                  type: 'column',
                  isUsed: true
               }
            ]
         },
         measures: {
            logicalEdgeLayers: [
               {
                  columnID: secondaryMeasure.columnID,
                  type: 'column',
                  isUsed: true
               }
            ]
         }
      };

      if (!dataModel.measuresList) {
         dataModel.measuresList = { children: [] };
      }
      dataModel.measuresList.children = [
         {
            columnID: primaryMeasure.columnID,
            type: 'view',
            name: 'MeasureView_0',
            aggRule: 'none'
         }
      ];

      pluginView.nestedViews = {
         children: [
            {
               position: 'embedded',
               view: {
                  type: 'saw:pluginView',
                  pluginType: pluginView.pluginType,
                  viewName: 'MeasureView_0',
                  dataModels: {
                     children: layerBindings.map((layerBinding) => ({
                        name: layerBinding.layerName,
                        edges: {
                           children: [
                              {
                                 axis: 'row',
                                 showColumnHeader: 'rollover',
                                 edgeLayers: {
                                    children: [
                                       {
                                          type: 'column',
                                          columnID: detailColumn.columnID
                                       }
                                    ]
                                 }
                              },
                              {
                                 axis: 'column',
                                 showColumnHeader: 'rollover',
                                 dependent: true,
                                 edgeLayers: {
                                    children: [
                                       {
                                          type: 'measure',
                                          visibility: 'hidden'
                                       }
                                    ]
                                 }
                              },
                              {
                                 axis: 'page'
                              },
                              {
                                 axis: 'section'
                              }
                           ]
                        },
                        measuresList: {
                           children: [
                              {
                                 columnID: layerBinding.measureColumnID,
                                 type: 'column',
                                 isUsed: true,
                                 propertyAdditions: {
                                    children: buildAutovizPropertyAdditions(layerBinding.measureColumnID, true)
                                 }
                              }
                           ]
                        }
                     }))
                  },
                  physicalDataModelVersion: '2.5'
               }
            }
         ]
      };

      if (!pluginView.physicalDataModelVersion) {
         pluginView.physicalDataModelVersion = '2.5';
      }
   }
}

function patchCalculationContractScaffold(workbook) {
   const criteriaColumns = getCriteriaColumns(workbook);
   const calcColumns = getCalculationColumnsWithIndex(workbook);
   if (calcColumns.length === 0) {
      return;
   }

   const calculationColumnsById = new Map(
      calcColumns
         .filter((entry) => typeof entry?.column?.columnID === 'string')
         .map((entry) => [entry.column.columnID, entry.column])
   );
   const replacementMap = new Map();
   const columnPropertyMap = ensureCriteriaConfigColumnPropertyMap(workbook);

   for (const calcEntry of calcColumns) {
      const column = calcEntry.column;
      const columnID = column?.columnID;
      if (typeof columnID !== 'string' || columnID.trim() === '') {
         continue;
      }
      if (column.userExpression !== true) {
         column.userExpression = true;
      }
      if (!column.columnFormula || typeof column.columnFormula !== 'object') {
         column.columnFormula = {};
      }
      if (!column.columnFormula.expr || typeof column.columnFormula.expr !== 'object') {
         column.columnFormula.expr = {};
      }
      if (column.columnFormula.expr.type !== 'sawx:sqlExpression') {
         column.columnFormula.expr.type = 'sawx:sqlExpression';
      }
      if (!Array.isArray(column.columnFormula.expr.children)) {
         column.columnFormula.expr.children = [];
      }
      if (typeof column.columnFormula.expr.expression !== 'string') {
         column.columnFormula.expr.expression = '';
      }
      if (!column.columnHeading || typeof column.columnHeading !== 'object') {
         column.columnHeading = {};
      }
      if (!column.columnHeading.caption || typeof column.columnHeading.caption !== 'object') {
         column.columnHeading.caption = {};
      }
      if (typeof column.columnHeading.caption.text !== 'string' || column.columnHeading.caption.text.trim() === '') {
         column.columnHeading.caption.text = columnID;
      }

      const expression = column.columnFormula?.expr?.expression || '';
      const refIDs = getCalcReferenceIDs(expression);
      const unresolvedRefIDs = refIDs.filter((refID) => !calculationColumnsById.has(refID));
      if (unresolvedRefIDs.length > 0) {
         const normalizedCalcIDToReal = new Map();
         for (const calcID of calculationColumnsById.keys()) {
            const normalized = normalizeToken(calcID);
            if (!normalizedCalcIDToReal.has(normalized)) {
               normalizedCalcIDToReal.set(normalized, []);
            }
            normalizedCalcIDToReal.get(normalized).push(calcID);
         }
         for (const unresolvedRefID of unresolvedRefIDs) {
            const candidates = normalizedCalcIDToReal.get(normalizeToken(unresolvedRefID)) || [];
            if (candidates.length === 1 && candidates[0] !== unresolvedRefID) {
               replacementMap.set(unresolvedRefID, candidates[0]);
            }
         }
      }

      const existingPropertyEntry = columnPropertyMap?.[columnID];
      const inferredType = inferCalculationType(columnID, existingPropertyEntry);
      if (!inferredType || !supportedCalcTypes.has(inferredType)) {
         continue;
      }

      let propertyEntry = existingPropertyEntry;
      if (propertyEntry == null || typeof propertyEntry !== 'object' || Array.isArray(propertyEntry)) {
         propertyEntry = {};
      }
      propertyEntry.type = inferredType;
      if (typeof propertyEntry.parentExpression !== 'string' || propertyEntry.parentExpression.trim() === '') {
         propertyEntry.parentExpression = expression;
      }
      if (propertyEntry.options == null || typeof propertyEntry.options !== 'object' || Array.isArray(propertyEntry.options)) {
         propertyEntry.options = {};
      }

      const typeDefaults = calculationTypeContracts?.[inferredType]?.defaults?.options || {};
      for (const [optionName, optionValue] of Object.entries(typeDefaults)) {
         if (!(optionName in propertyEntry.options)) {
            propertyEntry.options[optionName] = deepClone(optionValue);
         }
      }

      const requiredOptions = Array.isArray(calculationTypeContracts?.[inferredType]?.requiredOptions)
         ? calculationTypeContracts[inferredType].requiredOptions
         : [];
      for (const optionName of requiredOptions) {
         if (!(optionName in propertyEntry.options)) {
            if (optionName === 'autoName') {
               propertyEntry.options[optionName] = true;
            } else if (optionName === 'timeLevel') {
               propertyEntry.options[optionName] = null;
            } else if (optionName === 'groups' || optionName === 'includeOthers') {
               propertyEntry.options[optionName] = [];
            } else if (optionName === 'othersName') {
               propertyEntry.options[optionName] = 'Others';
            } else {
               propertyEntry.options[optionName] = '';
            }
         }
      }

      if (inferredType === 'TIME_SERIES' && typeof propertyEntry.options.measureFormula !== 'string') {
         propertyEntry.options.measureFormula = '';
      }
      if (inferredType === 'TEXT_GROUP' && !Array.isArray(propertyEntry.options.includeOthers)) {
         propertyEntry.options.includeOthers = ['false'];
      }

      columnPropertyMap[columnID] = propertyEntry;
   }

   if (replacementMap.size > 0) {
      for (const calcEntry of calcColumns) {
         const expression = calcEntry.column?.columnFormula?.expr?.expression;
         calcEntry.column.columnFormula.expr.expression = replaceCalcReferences(expression, replacementMap);
      }
      for (const propertyEntry of Object.values(columnPropertyMap)) {
         if (!propertyEntry || typeof propertyEntry !== 'object' || Array.isArray(propertyEntry)) {
            continue;
         }
         if (typeof propertyEntry.parentExpression === 'string') {
            propertyEntry.parentExpression = replaceCalcReferences(propertyEntry.parentExpression, replacementMap);
         }
      }
   }

   const orderedCalcEntries = topologicalOrderCalcColumns(calcColumns);
   if (orderedCalcEntries) {
      const calcIDs = new Set(calcColumns.map((entry) => entry.column?.columnID));
      const nonCalcColumns = criteriaColumns.filter((column) => !calcIDs.has(column?.columnID));
      workbook.criteria.columns.children = nonCalcColumns.concat(orderedCalcEntries.map((entry) => entry.column));
   }
}

function selectPatchActions(runtimeError, evaluationErrors) {
   const selected = new Set();
   selected.add('PATCH_CANONICAL_RUNTIME_DEFAULTS');

   if (runtimeError) {
      for (const signature of runtimeProfileContracts.runtimeErrorSignatures || []) {
         const matchAll = signature.matchAll || [];
         const matchAny = signature.matchAny || [];
         const allSatisfied = matchAll.length === 0 || matchAll.every((token) => runtimeError.includes(token));
         const anySatisfied = matchAny.length === 0 || matchAny.some((token) => runtimeError.includes(token));
         if (allSatisfied && anySatisfied) {
            selected.add(signature.patchAction);
         }
      }
   }

   const errorIDs = new Set((evaluationErrors || []).map((entry) => entry.id));
   const hasTraceSchemaRejection = (evaluationErrors || []).some((entry) => (
      entry?.id === 'GLOBAL_SCHEMA_ACCEPTANCE_GATE' &&
      typeof entry?.message === 'string' &&
      entry.message.includes('oracle.bi.tech.workbookAuthoringTrace')
   ));
   if (hasTraceSchemaRejection) {
      selected.add('PATCH_REMOVE_WORKBOOK_AUTHORING_TRACE');
   }
   if (errorIDs.has('TABLE_COLUMN_EDGE_EMPTY') || errorIDs.has('TABLE_LOGICAL_COLUMN_EDGE_EMPTY')) {
      selected.add('PATCH_TABLE_MOVE_COLUMN_EDGE_LAYERS_TO_ROW');
   }
   if (errorIDs.has('PIVOT_HAS_COLUMN_EDGE_BINDING')) {
      selected.add('PATCH_PIVOT_LOGICAL_EDGE_COLUMN_TO_COL');
   }
   if (errorIDs.has('PARALLEL_COORDINATES_REJECTS_LEGACY_LOGICAL_COLUMN_KEY')) {
      selected.add('PATCH_PARALLEL_COORDINATES_LOGICAL_EDGE_COLUMN_TO_COL');
   }
   if (errorIDs.has('PARALLEL_COORDINATES_HAS_DETAIL_EDGE_BINDING')) {
      selected.add('PATCH_PARALLEL_COORDINATES_ENSURE_DETAIL_EDGE');
   }
   if (errorIDs.has('PARALLEL_COORDINATES_EXECUTION_TRELLIS_MINIMIZED')) {
      selected.add('PATCH_PARALLEL_COORDINATES_NORMALIZE_EXECUTION_TRELLIS');
   }
   if (
      errorIDs.has('MAP_HAS_DATA_LAYERS_INFO') ||
      errorIDs.has('NETWORK_HAS_DATA_LAYERS_INFO') ||
      errorIDs.has('PARALLEL_COORDINATES_HAS_DATA_LAYERS_INFO') ||
      errorIDs.has('GANTT_HAS_DATA_LAYERS_INFO')
   ) {
      selected.add('PATCH_ENSURE_SINGLE_LAYER_DATA_LAYERS_INFO');
   }
   if (errorIDs.has('GANTT_REJECTS_LEGACY_LOGICAL_COLUMN_KEY')) {
      selected.add('PATCH_GANTT_LOGICAL_EDGE_COLUMN_TO_COL');
   }
   if (errorIDs.has('GANTT_HAS_DETAIL_EDGE_BINDING') || errorIDs.has('GANTT_DURATION_NON_ZERO_BASELINE')) {
      selected.add('PATCH_GANTT_ENSURE_DURATION_AND_DETAIL');
   }
   if (errorIDs.has('GANTT_EXECUTION_TRELLIS_MINIMIZED')) {
      selected.add('PATCH_GANTT_NORMALIZE_EXECUTION_TRELLIS');
   }
   if (
      errorIDs.has('MAP_AUTOVIZ_INNER_PLUGIN_MATCH') ||
      errorIDs.has('MAP_HAS_DETAIL_EDGE_BINDING') ||
      errorIDs.has('MAP_VIZ_MAP_SETTINGS_OBJECT') ||
      errorIDs.has('MAP_DETAIL_EDGE_GEO_COMPATIBLE') ||
      errorIDs.has('MAP_EXECUTION_ROW_EDGE_DETAIL_BINDING') ||
      errorIDs.has('MAP_NO_MEASURE_ON_UNUSED_EDGE')
   ) {
      selected.add('PATCH_MAP_ENSURE_AUTOVIZ_AND_VIZ_MAP_SCAFFOLD');
   }
   if (errorIDs.has('MAP_RENDER_TYPE_INVALID_EDGE_COMBINATION')) {
      selected.add('PATCH_MAP_DROP_RENDER_TYPE_INVALID_EDGES');
   }
   if (
      errorIDs.has('NETWORK_AUTOVIZ_INNER_PLUGIN_MATCH') ||
      errorIDs.has('NETWORK_MIN_DETAIL_LAYER_COUNT') ||
      errorIDs.has('NETWORK_EXECUTION_ROW_EDGE_STABLE') ||
      errorIDs.has('NETWORK_EXECUTION_COLUMN_EDGE_MEASURE_BINDING')
   ) {
      selected.add('PATCH_NETWORK_ENSURE_AUTOVIZ_INNER_PLUGIN');
   }
   if (errorIDs.has('SANKEY_HAS_SANKEY_SETTINGS_NAMESPACE')) {
      selected.add('PATCH_SANKEY_ENSURE_DEFAULT_SETTINGS');
   }
   if (
      errorIDs.has('AUTOVIZ_HAS_INNER_PLUGIN_TYPE') ||
      errorIDs.has('AUTOVIZ_HAS_MEASURES_LIST_VIEW_ENTRY') ||
      errorIDs.has('AUTOVIZ_HAS_NESTED_MEASURE_VIEW') ||
      errorIDs.has('AUTOVIZ_LOGICAL_NESTED_MEASURE_PARITY') ||
      errorIDs.has('AUTOVIZ_HAS_COLOR_EDGE_WITH_HIDDEN_MEASURE') ||
      errorIDs.has('AUTOVIZ_HAS_NESTED_PROPERTY_ADDITIONS') ||
      errorIDs.has('AUTOVIZ_DONUT_HAS_MIN_MAX_PROPERTY_ADDITIONS') ||
      errorIDs.has('SCATTER_SINGLE_NESTED_MARKING_VIEW') ||
      errorIDs.has('SCATTER_MEASURE_VIEW_SINGLE_REFERENCE') ||
      errorIDs.has('SCATTER_MEASURE_XY_TAGS_REQUIRED') ||
      errorIDs.has('SCATTER_MEASURE_DIMENSION_EXECUTION_BINDING') ||
      errorIDs.has('SCATTER_NESTED_MEASURE_PROPERTY_ADDITIONS')
   ) {
      selected.add('PATCH_AUTOVIZ_CONTRACT_SCAFFOLD');
   }
   if (
      errorIDs.has('COMBO_HAS_PLUGIN_DATALAYERS_INFO') ||
      errorIDs.has('COMBO_HAS_LDM_DATALAYERS_INFO') ||
      errorIDs.has('COMBO_ACTIVE_LAYER_IS_VALID') ||
      errorIDs.has('COMBO_NESTED_LAYER_MODELS_MATCH_DECLARED_LAYERS') ||
      errorIDs.has('COMBO_LAYER_MEASURE_BINDING_NON_EMPTY') ||
      errorIDs.has('COMBO_LOGICAL_EDGE_TO_LAYER_MAPPING_NON_EMPTY') ||
      errorIDs.has('COMBO_MEASURE_INFOS_ALLOWED_BY_PROFILE')
   ) {
      selected.add('PATCH_COMBO_MULTILAYER_CONTRACT_SCAFFOLD');
   }
   if (errorIDs.has('GLOBAL_PROFILE_REPORTCONFIG_REQUIREMENTS') || errorIDs.has('GLOBAL_REQUIRED_TOP_LEVEL_NODES')) {
      selected.add('PATCH_REPORT_CONFIG_DEFAULTS');
   }
   if (
      errorIDs.has('GLOBAL_CALC_REFERENCES_RESOLVE') ||
      errorIDs.has('GLOBAL_CALC_REFERENCE_NO_CYCLES') ||
      errorIDs.has('GLOBAL_TYPED_CALC_COLUMN_PROPERTY_MAP') ||
      errorIDs.has('GLOBAL_CALC_REFERENCE_ORDERING') ||
      errorIDs.has('GLOBAL_DERIVED_FORMULA_MARKED_USER_EXPRESSION')
   ) {
      selected.add('PATCH_CALCULATION_CONTRACT_SCAFFOLD');
   }

   return Array.from(selected);
}

function applyPatches(workbook, patchActions) {
   const patched = deepClone(workbook);
   const profile = findRuntimeProfile(patched.projectVersion);
   const sanitizedPaths = [];

   for (const patchAction of patchActions) {
      if (patchAction === 'PATCH_REMOVE_WORKBOOK_AUTHORING_TRACE') {
         sanitizedPaths.push(...sanitizeKnownSafeWorkbookMetadata(patched));
      }
      if (patchAction === 'PATCH_TABLE_MOVE_COLUMN_EDGE_LAYERS_TO_ROW') {
         patchTableColumnEdge(patched);
      }
      if (patchAction === 'PATCH_AUTOVIZ_CONTRACT_SCAFFOLD') {
         patchAutovizScaffold(patched);
      }
      if (patchAction === 'PATCH_PIVOT_LOGICAL_EDGE_COLUMN_TO_COL') {
         patchPivotLogicalEdgeColumnToCol(patched);
      }
      if (patchAction === 'PATCH_PARALLEL_COORDINATES_LOGICAL_EDGE_COLUMN_TO_COL') {
         patchParallelCoordinatesLogicalEdgeColumnToCol(patched);
      }
      if (patchAction === 'PATCH_PARALLEL_COORDINATES_ENSURE_DETAIL_EDGE') {
         patchParallelCoordinatesEnsureDetailEdge(patched);
      }
      if (patchAction === 'PATCH_PARALLEL_COORDINATES_NORMALIZE_EXECUTION_TRELLIS') {
         patchParallelCoordinatesNormalizeExecutionTrellis(patched);
      }
      if (patchAction === 'PATCH_ENSURE_SINGLE_LAYER_DATA_LAYERS_INFO') {
         patchEnsureSingleLayerDataLayersInfo(patched);
      }
      if (patchAction === 'PATCH_GANTT_LOGICAL_EDGE_COLUMN_TO_COL') {
         patchGanttLogicalEdgeColumnToCol(patched);
      }
      if (patchAction === 'PATCH_GANTT_ENSURE_DURATION_AND_DETAIL') {
         patchGanttEnsureDurationAndDetail(patched);
      }
      if (patchAction === 'PATCH_GANTT_NORMALIZE_EXECUTION_TRELLIS') {
         patchGanttNormalizeExecutionTrellis(patched);
      }
      if (patchAction === 'PATCH_MAP_ENSURE_AUTOVIZ_AND_VIZ_MAP_SCAFFOLD') {
         patchMapEnsureAutovizAndVizMapScaffold(patched);
      }
      if (patchAction === 'PATCH_MAP_DROP_RENDER_TYPE_INVALID_EDGES') {
         patchMapDropRenderTypeInvalidEdges(patched);
      }
      if (patchAction === 'PATCH_NETWORK_ENSURE_AUTOVIZ_INNER_PLUGIN') {
         patchNetworkEnsureAutovizInnerPlugin(patched);
      }
      if (patchAction === 'PATCH_SANKEY_ENSURE_DEFAULT_SETTINGS') {
         patchSankeyEnsureDefaultSettings(patched);
      }
      if (patchAction === 'PATCH_COMBO_MULTILAYER_CONTRACT_SCAFFOLD') {
         patchComboMultilayerScaffold(patched);
      }
      if (patchAction === 'PATCH_REPORT_CONFIG_DEFAULTS') {
         ensureReportConfigDefaults(patched, profile);
      }
      if (patchAction === 'PATCH_CANONICAL_RUNTIME_DEFAULTS') {
         patchCanonicalRuntimeDefaults(patched, profile);
      }
      if (patchAction === 'PATCH_CALCULATION_CONTRACT_SCAFFOLD') {
         patchCalculationContractScaffold(patched);
      }
   }

   return {
      workbook: patched,
      sanitizedPaths
   };
}

const workbookInput = loadWorkbookInput(inputPath);
let workbookWorking = deepClone(workbookInput);
let sanitizedPaths = sanitizeKnownSafeWorkbookMetadata(workbookWorking);
let evaluation = evaluateWorkbook(workbookWorking);
let appliedPatches = [];

if (applyKnownPatches) {
   const patches = selectPatchActions(runtimeErrorText || '', evaluation.errors);
   if (patches.length > 0) {
      const patchResult = applyPatches(workbookWorking, patches);
      workbookWorking = patchResult.workbook;
      if (Array.isArray(patchResult.sanitizedPaths)) {
         sanitizedPaths.push(...patchResult.sanitizedPaths);
      }
      sanitizedPaths.push(...sanitizeKnownSafeWorkbookMetadata(workbookWorking));
      appliedPatches = patches;
      evaluation = evaluateWorkbook(workbookWorking);
   }
}
sanitizedPaths = Array.from(new Set(sanitizedPaths));

if (inPlace) {
   writeJson(inputPath, workbookWorking);
}
if (outputPath) {
   writeJson(outputPath, workbookWorking);
}

const result = {
   valid: evaluation.valid,
   targetVersion: evaluation.targetVersion,
   compatibilityTarget: evaluation.compatibilityTarget,
   availableTargetVersions: evaluation.availableTargetVersions,
   executionMode: evaluation.executionMode,
   reasonForVersionSelection: evaluation.reasonForVersionSelection,
   capabilitySource: evaluation.capabilitySource,
   saveToolDetected: evaluation.saveToolDetected,
   exportToolDetected: evaluation.exportToolDetected,
   discoveryMethod: evaluation.discoveryMethod,
   saveAvailable: evaluation.saveAvailable,
   exportAvailable: evaluation.exportAvailable,
   exportRequested: evaluation.exportRequested,
   authoringMode: evaluation.authoringMode,
   requestedOperation: evaluation.requestedOperation,
   sourceMode: evaluation.sourceMode,
   confirmationState: evaluation.confirmationState,
   resolvedWorkbookTarget: evaluation.resolvedWorkbookTarget,
   pluginType: evaluation.pluginType,
   pluginFamily: evaluation.pluginFamily,
   pluginViewsValidated: evaluation.pluginViewsValidated,
   evaluatedPlugins: evaluation.evaluatedPlugins,
   resolutionTrace: evaluation.resolutionTrace,
   filterDecisionTrace: evaluation.filterDecisionTrace,
   modifyTrace: evaluation.modifyTrace,
   sanitizedPaths,
   appliedPatches,
   warnings: evaluation.warnings,
   errors: evaluation.errors
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
