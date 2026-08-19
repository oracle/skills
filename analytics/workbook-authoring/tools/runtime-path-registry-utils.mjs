import fs from 'node:fs';

export const RUNTIME_PATH_SIGNAL_TEXTBOX = 'textbox_runtime_text';

export const DEFAULT_RUNTIME_PATH_REGISTRY = {
   contractVersion: 'v1',
   defaults: {
      profileByTargetVersion: {
         default: 'core_v1',
         '26.05': 'core_v1',
         '26.07': 'core_v1'
      }
   },
   profiles: {
      core_v1: {
         signals: {
            [RUNTIME_PATH_SIGNAL_TEXTBOX]: {
               canonical: {
                  id: 'TEXTBOX_RUNTIME_TEXT_CANONICAL',
                  jsonPointer: '/viewConfig/settings/viz:chart/textContents/caption/text',
                  pathSegments: ['viewConfig', 'settings', 'viz:chart', 'textContents', 'caption', 'text']
               },
               legacyInputsAllowedForMigration: [
                  {
                     id: 'TEXTBOX_RUNTIME_TEXT_LEGACY_VIEWCONFIG_TEXTCONTENTS',
                     jsonPointer: '/viewConfig/textContents/caption/text',
                     pathSegments: ['viewConfig', 'textContents', 'caption', 'text']
                  },
                  {
                     id: 'TEXTBOX_RUNTIME_TEXT_LEGACY_PLUGIN_SETTINGS',
                     jsonPointer: '/viewConfig/settings/oracle.bi.tech.textbox/settings/text',
                     pathSegments: ['viewConfig', 'settings', 'oracle.bi.tech.textbox', 'settings', 'text']
                  },
                  {
                     id: 'TEXTBOX_RUNTIME_TEXT_LEGACY_VIEWCAPTION',
                     jsonPointer: '/viewCaption/caption/text',
                     pathSegments: ['viewCaption', 'caption', 'text']
                  }
               ],
               strictRequiresCanonical: true
            }
         }
      }
   }
};

function deepClone(value) {
   return JSON.parse(JSON.stringify(value));
}

export function isPlainObject(value) {
   return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function toNonEmptyTrimmedString(value) {
   if (typeof value !== 'string') {
      return null;
   }
   const trimmed = value.trim();
   return trimmed === '' ? null : trimmed;
}

function normalizePathSegments(pathSegments) {
   if (!Array.isArray(pathSegments)) {
      return [];
   }
   return pathSegments
      .map((segment) => (typeof segment === 'string' ? segment.trim() : ''))
      .filter((segment) => segment.length > 0);
}

function normalizePathEntry(rawEntry, fallbackID) {
   const source = isPlainObject(rawEntry) ? rawEntry : {};
   const pathSegments = normalizePathSegments(source.pathSegments);
   const jsonPointer = toNonEmptyTrimmedString(source.jsonPointer)
      || (pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '/');
   return {
      id: toNonEmptyTrimmedString(source.id) || fallbackID,
      jsonPointer,
      pathSegments
   };
}

function normalizeSignal(rawSignal, signalID) {
   const source = isPlainObject(rawSignal) ? rawSignal : {};
   const canonical = normalizePathEntry(source.canonical, `${signalID}_canonical`);
   const legacyInputsAllowedForMigration = Array.isArray(source.legacyInputsAllowedForMigration)
      ? source.legacyInputsAllowedForMigration.map((entry, index) => normalizePathEntry(entry, `${signalID}_legacy_${index + 1}`))
      : [];
   return {
      signalID,
      canonical,
      legacyInputsAllowedForMigration,
      strictRequiresCanonical: source.strictRequiresCanonical !== false
   };
}

function resolveSignalProfileID(registryPayload, targetVersion, requestedSignalProfileID) {
   const requested = toNonEmptyTrimmedString(requestedSignalProfileID);
   if (requested) {
      return requested;
   }
   const profileMap = isPlainObject(registryPayload?.defaults?.profileByTargetVersion)
      ? registryPayload.defaults.profileByTargetVersion
      : {};
   const versionToken = toNonEmptyTrimmedString(targetVersion);
   if (versionToken && toNonEmptyTrimmedString(profileMap[versionToken])) {
      return toNonEmptyTrimmedString(profileMap[versionToken]);
   }
   return toNonEmptyTrimmedString(profileMap.default) || 'core_v1';
}

function resolveSignalsForProfile(registryPayload, profileID) {
   if (isPlainObject(registryPayload?.profiles?.[profileID]?.signals)) {
      return registryPayload.profiles[profileID].signals;
   }
   if (isPlainObject(registryPayload?.signals)) {
      return registryPayload.signals;
   }
   return {};
}

export function loadRuntimePathRegistry(options = {}) {
   const registryPath = toNonEmptyTrimmedString(options.registryPath);
   const targetVersion = toNonEmptyTrimmedString(options.targetVersion);
   const signalProfileID = toNonEmptyTrimmedString(options.signalProfileID);

   let parsedRegistry = null;
   if (registryPath && fs.existsSync(registryPath)) {
      try {
         const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
         if (isPlainObject(parsed)) {
            parsedRegistry = parsed;
         }
      } catch {
         parsedRegistry = null;
      }
   }

   const sourceRegistry = parsedRegistry || DEFAULT_RUNTIME_PATH_REGISTRY;
   const profileID = resolveSignalProfileID(sourceRegistry, targetVersion, signalProfileID);
   const rawSignals = resolveSignalsForProfile(sourceRegistry, profileID);
   const fallbackSignals = resolveSignalsForProfile(DEFAULT_RUNTIME_PATH_REGISTRY, 'core_v1');

   const normalizedSignals = {};
   for (const [rawSignalID, rawSignal] of Object.entries({ ...fallbackSignals, ...rawSignals })) {
      const signalIDValue = toNonEmptyTrimmedString(rawSignalID);
      if (!signalIDValue) {
         continue;
      }
      normalizedSignals[signalIDValue] = normalizeSignal(rawSignal, signalIDValue);
   }

   return {
      contractVersion: toNonEmptyTrimmedString(sourceRegistry.contractVersion) || 'v1',
      registryPath: registryPath || null,
      source: parsedRegistry ? 'file' : 'fallback_default',
      profileID,
      targetVersion,
      signals: normalizedSignals
   };
}

export function resolveRuntimePathSignal(registryContext, signalID) {
   const signalToken = toNonEmptyTrimmedString(signalID);
   const availableSignals = isPlainObject(registryContext?.signals)
      ? registryContext.signals
      : {};
   const direct = signalToken ? availableSignals[signalToken] : null;
   if (direct) {
      return {
         signal: direct,
         diagnostics: []
      };
   }

   const fallbackSignals = resolveSignalsForProfile(DEFAULT_RUNTIME_PATH_REGISTRY, 'core_v1');
   const fallbackSignal = signalToken && fallbackSignals[signalToken]
      ? normalizeSignal(fallbackSignals[signalToken], signalToken)
      : null;

   if (fallbackSignal) {
      return {
         signal: fallbackSignal,
         diagnostics: [
            `RUNTIME_PATH_REGISTRY_DRIFT: signal '${signalToken}' missing from registry profile '${toNonEmptyTrimmedString(registryContext?.profileID) || 'unknown'}'; using fallback defaults.`
         ]
      };
   }

   const defaultSignal = normalizeSignal(DEFAULT_RUNTIME_PATH_REGISTRY.profiles.core_v1.signals[RUNTIME_PATH_SIGNAL_TEXTBOX], RUNTIME_PATH_SIGNAL_TEXTBOX);
   return {
      signal: defaultSignal,
      diagnostics: [
         `RUNTIME_PATH_REGISTRY_DRIFT: unable to resolve signal '${signalToken || 'unknown'}'; using textbox fallback signal.`
      ]
   };
}

export function getValueByPathSegments(root, pathSegments) {
   if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
      return undefined;
   }
   let cursor = root;
   for (const segment of pathSegments) {
      if (!isPlainObject(cursor) && !Array.isArray(cursor)) {
         return undefined;
      }
      cursor = cursor[segment];
      if (cursor === undefined) {
         return undefined;
      }
   }
   return cursor;
}

export function setValueByPathSegments(root, pathSegments, value) {
   if (!isPlainObject(root) || !Array.isArray(pathSegments) || pathSegments.length === 0) {
      return false;
   }
   let cursor = root;
   for (let index = 0; index < pathSegments.length - 1; index += 1) {
      const segment = pathSegments[index];
      if (!isPlainObject(cursor[segment])) {
         cursor[segment] = {};
      }
      cursor = cursor[segment];
   }
   const lastSegment = pathSegments[pathSegments.length - 1];
   if (cursor[lastSegment] === value) {
      return false;
   }
   cursor[lastSegment] = value;
   return true;
}

export function getCanonicalSignalText(root, signal) {
   const value = getValueByPathSegments(root, signal?.canonical?.pathSegments);
   return toNonEmptyTrimmedString(value);
}

export function collectLegacySignalTextValues(root, signal) {
   const legacyEntries = Array.isArray(signal?.legacyInputsAllowedForMigration)
      ? signal.legacyInputsAllowedForMigration
      : [];
   const matches = [];
   for (const entry of legacyEntries) {
      const rawValue = getValueByPathSegments(root, entry.pathSegments);
      const text = toNonEmptyTrimmedString(rawValue);
      if (!text) {
         continue;
      }
      matches.push({
         id: entry.id,
         jsonPointer: entry.jsonPointer,
         pathSegments: entry.pathSegments,
         text
      });
   }
   return matches;
}

export function selectSignalTextValue(root, signal, options = {}) {
   const canonicalText = getCanonicalSignalText(root, signal);
   const legacyMatches = collectLegacySignalTextValues(root, signal);
   const allowLegacyFallback = options.allowLegacyFallback !== false;
   if (canonicalText) {
      return {
         canonicalText,
         selectedText: canonicalText,
         source: 'canonical',
         legacyMatches
      };
   }
   if (allowLegacyFallback && legacyMatches.length > 0) {
      return {
         canonicalText: null,
         selectedText: legacyMatches[0].text,
         source: legacyMatches[0].id,
         legacyMatches
      };
   }
   return {
      canonicalText: null,
      selectedText: null,
      source: null,
      legacyMatches
   };
}

export function migrateSignalLegacyTextToCanonical(root, signal) {
   const canonicalText = getCanonicalSignalText(root, signal);
   if (canonicalText) {
      return {
         migrated: false,
         text: canonicalText,
         source: 'canonical'
      };
   }
   const legacyMatches = collectLegacySignalTextValues(root, signal);
   if (legacyMatches.length === 0) {
      return {
         migrated: false,
         text: null,
         source: null
      };
   }
   const selected = legacyMatches[0];
   const changed = setValueByPathSegments(root, signal?.canonical?.pathSegments, selected.text);
   return {
      migrated: changed,
      text: selected.text,
      source: selected.id,
      jsonPointer: selected.jsonPointer
   };
}

export function cloneRuntimePathRegistry(value) {
   return deepClone(value);
}
