import fs from 'node:fs';
import path from 'node:path';

function isPlainObject(value) {
   return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
   if (typeof value !== 'string') {
      return null;
   }
   const normalized = value.trim();
   return normalized === '' ? null : normalized;
}

function positiveInteger(value) {
   if (typeof value === 'string') {
      const normalized = value.trim();
      if (!/^[1-9]\d*$/.test(normalized)) {
         return null;
      }
      value = Number(normalized);
   }
   return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function optionalProjectVersion(value, label) {
   if (value === undefined || value === null || value === '') {
      return null;
   }
   const parsed = positiveInteger(value);
   if (!parsed) {
      throw new Error(`INVALID_PROJECT_VERSION: ${label} must be a positive integer, found '${value}'.`);
   }
   return parsed;
}

function normalizeProfile(rawProfile) {
   if (!isPlainObject(rawProfile)) {
      return null;
   }
   const id = nonEmptyString(rawProfile.id);
   const target = nonEmptyString(rawProfile.target);
   const authoredProjectVersion = positiveInteger(rawProfile.authoredProjectVersion);
   const minimumServerProjectVersion = positiveInteger(rawProfile.minimumServerProjectVersion);
   const maximumServerProjectVersion = positiveInteger(rawProfile.maximumServerProjectVersion);
   if (!id || !/^pv-\d+$/.test(id) || !target || !authoredProjectVersion ||
      !minimumServerProjectVersion || !maximumServerProjectVersion ||
      minimumServerProjectVersion > maximumServerProjectVersion) {
      return null;
   }
   return {
      id,
      target,
      authoredProjectVersion,
      minimumServerProjectVersion,
      maximumServerProjectVersion,
      releaseAliases: Array.isArray(rawProfile.releaseAliases)
         ? rawProfile.releaseAliases.map(nonEmptyString).filter(Boolean)
         : []
   };
}

export function readCompatibilityProfileManifest(bundleRootDir, options = {}) {
   const manifestPath = path.join(bundleRootDir, 'compatibility-profiles.json');
   let parsed;
   try {
      parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
   } catch (error) {
      throw new Error(`COMPATIBILITY_MANIFEST_INVALID: Unable to read '${manifestPath}': ${error?.message || String(error)}`);
   }
   const profiles = Array.isArray(parsed?.profiles)
      ? parsed.profiles.map(normalizeProfile).filter(Boolean)
      : [];
   if (profiles.length === 0 || profiles.length !== parsed.profiles.length) {
      throw new Error('COMPATIBILITY_MANIFEST_INVALID: profiles must contain valid project-version compatibility profiles.');
   }
   const profileRoot = nonEmptyString(parsed.profileRoot) || 'compatibility-profiles';
   for (const profile of profiles) {
      const profileDir = path.join(bundleRootDir, profileRoot, profile.id);
      const installed = fs.existsSync(path.join(profileDir, 'model')) &&
         fs.existsSync(path.join(profileDir, 'templates')) &&
         fs.existsSync(path.join(profileDir, 'schemas'));
      const sourceCurrentProfile = options.allowSourceCurrentProfile === true &&
         profile.target === 'current' &&
         fs.existsSync(path.join(bundleRootDir, 'model')) &&
         fs.existsSync(path.join(bundleRootDir, 'templates'));
      if (!installed && !sourceCurrentProfile && options.allowMissingProfiles !== true) {
         throw new Error(`COMPATIBILITY_PROFILE_NOT_INSTALLED: '${profile.id}' is missing model, templates, or schemas.`);
      }
      profile.bundleRootDir = sourceCurrentProfile ? bundleRootDir : profileDir;
      profile.installed = installed || sourceCurrentProfile;
      profile.sourceLayout = sourceCurrentProfile;
   }
   return {
      manifestVersion: parsed.manifestVersion,
      defaultCompatibilityTarget: nonEmptyString(parsed.defaultCompatibilityTarget) || 'standard',
      profileRoot,
      profiles
   };
}

function findProfileForTarget(manifest, rawTarget) {
   const target = nonEmptyString(rawTarget);
   if (!target || target === 'auto') {
      return null;
   }
   return manifest.profiles.find((profile) => (
      profile.id === target ||
      profile.target === target ||
      profile.releaseAliases.includes(target)
   )) || null;
}

function findProfileForProjectVersion(manifest, rawProjectVersion) {
   const projectVersion = positiveInteger(rawProjectVersion);
   if (!projectVersion) {
      return null;
   }
   return manifest.profiles.find((profile) => (
      projectVersion >= profile.minimumServerProjectVersion &&
      projectVersion <= profile.maximumServerProjectVersion
   )) || null;
}

function requireProfile(profile, message) {
   if (!profile) {
      throw new Error(`UNRESOLVED_COMPATIBILITY_TARGET: ${message}`);
   }
   return profile;
}

export function resolveCompatibilityProfile(bundleRootDir, options = {}) {
   const allowSourceCurrentProfile = options.allowSourceCurrentProfile === true;
   const manifest = readCompatibilityProfileManifest(bundleRootDir, {
      allowSourceCurrentProfile,
      allowMissingProfiles: allowSourceCurrentProfile
   });
   let profile = null;
   let reason = null;
   const explicitCompatibilityTarget = nonEmptyString(options.explicitCompatibilityTarget);
   const legacyReleaseTarget = nonEmptyString(options.legacyReleaseTarget);
   const existingWorkbookProjectVersion = optionalProjectVersion(
      options.existingWorkbookProjectVersion,
      'existingWorkbookProjectVersion'
   );
   const serverProjectVersion = optionalProjectVersion(options.serverProjectVersion, 'serverProjectVersion');

   if (explicitCompatibilityTarget && explicitCompatibilityTarget !== 'auto') {
      profile = requireProfile(
         findProfileForTarget(manifest, explicitCompatibilityTarget),
         `Compatibility target '${explicitCompatibilityTarget}' is not installed.`
      );
      reason = 'explicit_compatibility_target';
   } else if (legacyReleaseTarget) {
      profile = requireProfile(
         findProfileForTarget(manifest, legacyReleaseTarget),
         `Release alias '${legacyReleaseTarget}' is not installed.`
      );
      reason = 'deprecated_release_alias';
   } else if (existingWorkbookProjectVersion) {
      profile = requireProfile(
         findProfileForProjectVersion(manifest, existingWorkbookProjectVersion),
         `Existing workbook project version '${existingWorkbookProjectVersion}' is outside the installed compatibility ranges.`
      );
      reason = 'existing_workbook_project_version';
   } else if (serverProjectVersion) {
      profile = requireProfile(
         findProfileForProjectVersion(manifest, serverProjectVersion),
         `Server project version '${serverProjectVersion}' is outside the installed compatibility ranges.`
      );
      reason = 'server_project_version';
   } else {
      const fallbackTarget = options.oacMcpConnected === true && options.saveAvailable !== true
         ? 'legacy'
         : manifest.defaultCompatibilityTarget;
      profile = requireProfile(
         findProfileForTarget(manifest, fallbackTarget),
         `Fallback compatibility target '${fallbackTarget}' is not installed.`
      );
      reason = options.oacMcpConnected === true
         ? (options.saveAvailable === true ? 'connected_standard_fallback' : 'connected_legacy_fallback')
         : 'offline_default';
   }

   if (profile.installed !== true) {
      throw new Error(
         `COMPATIBILITY_PROFILE_NOT_INSTALLED: '${profile.id}' is not available in this source layout. ` +
         'Run packageWorkbookAuthoringInstallable and use the staged or packaged skill root.'
      );
   }

   let selectedTargetVersion = profile.target;
   let authoredProjectVersion = profile.authoredProjectVersion;
   if (profile.sourceLayout === true) {
      const supportWindowPath = path.join(bundleRootDir, 'model', 'support-window.v1.json');
      const supportWindow = JSON.parse(fs.readFileSync(supportWindowPath, 'utf8'));
      const defaultTrack = isPlainObject(supportWindow?.tracks)
         ? supportWindow.tracks[nonEmptyString(supportWindow.defaultTrack)]
         : null;
      selectedTargetVersion = nonEmptyString(defaultTrack?.displayVersion) || selectedTargetVersion;
      authoredProjectVersion = positiveInteger(defaultTrack?.projectVersion) || authoredProjectVersion;
   }

   return {
      manifest,
      profile,
      selectedBundleRootDir: profile.bundleRootDir,
      selectedTargetVersion,
      selectedCompatibilityTarget: profile.target,
      selectedProfileID: profile.id,
      authoredProjectVersion,
      availableTargetVersions: manifest.profiles.map((entry) => entry.target),
      explicitTargetRequested: Boolean(explicitCompatibilityTarget || legacyReleaseTarget),
      implicitSelectionReason: reason,
      legacyLayout: false
   };
}

export function extractWorkbookProjectVersion(payload) {
   if (!isPlainObject(payload)) {
      return null;
   }
   const workbook = isPlainObject(payload.json)
      ? payload.json
      : (isPlainObject(payload.content?.json) ? payload.content.json : payload);
   return optionalProjectVersion(workbook.projectVersion, 'workbook.projectVersion');
}
