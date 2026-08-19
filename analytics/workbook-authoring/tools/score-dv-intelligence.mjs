#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
   RUNTIME_PATH_SIGNAL_TEXTBOX,
   loadRuntimePathRegistry,
   resolveRuntimePathSignal,
   getCanonicalSignalText,
   collectLegacySignalTextValues
} from './runtime-path-registry-utils.mjs';

const argv = process.argv.slice(2);

function getArg(flag) {
   const index = argv.indexOf(flag);
   if (index === -1 || index + 1 >= argv.length) {
      return null;
   }
   return argv[index + 1];
}

function fail(message) {
   process.stderr.write(`DV_INTELLIGENCE_SCORING_FAILED: ${message}\n`);
   process.exit(1);
}

function readJson(filePath, label) {
   try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
   } catch (error) {
      fail(`Unable to parse ${label} '${filePath}': ${error?.message || String(error)}`);
   }
}

function ensureObject(value, label) {
   if (!value || typeof value !== 'object' || Array.isArray(value)) {
      fail(`${label} must be an object.`);
   }
}

function toTrimmedString(value) {
   if (typeof value !== 'string') {
      return null;
   }
   const trimmed = value.trim();
   return trimmed === '' ? null : trimmed;
}

function clamp(value, min, max) {
   return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
   const factor = 10 ** digits;
   return Math.round((value + Number.EPSILON) * factor) / factor;
}

function isPlainObject(value) {
   return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeDocumentationReferences(contract) {
   const rawReferences = Array.isArray(contract?.documentation?.references)
      ? contract.documentation.references
      : [];
   return rawReferences.reduce((normalized, reference) => {
      if (!isPlainObject(reference)) {
         return normalized;
      }
      const url = toTrimmedString(reference.url);
      if (!url) {
         return normalized;
      }
      const normalizedReference = { url };
      const id = toTrimmedString(reference.id);
      const title = toTrimmedString(reference.title);
      if (id) {
         normalizedReference.id = id;
      }
      if (title) {
         normalizedReference.title = title;
      }
      normalized.push(normalizedReference);
      return normalized;
   }, []);
}

function getNestedPath(root, pathExpression) {
   if (!pathExpression) {
      return root;
   }
   const parts = String(pathExpression).split('.').filter(Boolean);
   let current = root;
   for (const part of parts) {
      if (!isPlainObject(current) && !Array.isArray(current)) {
         return undefined;
      }
      current = current[part];
      if (current === undefined) {
         return undefined;
      }
   }
   return current;
}

function normalizeRuntimeFamily(pluginType) {
   const normalized = toTrimmedString(pluginType);
   if (!normalized) {
      return null;
   }
   if (normalized.includes('.table')) {
      return 'table';
   }
   if (normalized.includes('.pivot')) {
      return 'pivot';
   }
   if (normalized.includes('.map')) {
      return 'map';
   }
   if (normalized.includes('.network')) {
      return 'network_graph';
   }
   if (normalized.includes('.gantt')) {
      return 'gantt';
   }
   if (normalized.includes('.parallel')) {
      return 'parallel_coordinates';
   }
   if (normalized.includes('.performance')) {
      return 'performance_tile';
   }
   if (normalized.includes('.textbox')) {
      return 'textbox';
   }
   if (normalized.includes('.filter')) {
      return 'filter';
   }
   if (normalized.includes('.chart') || normalized.includes('.line') || normalized.includes('.bar') || normalized.includes('.area')) {
      return 'chart';
   }
   return 'other';
}

function getCanvasTitle(canvasView) {
   const captionText = toTrimmedString(canvasView?.viewCaption?.caption?.text);
   if (captionText) {
      return captionText;
   }
   return toTrimmedString(canvasView?.caption?.text);
}

function normalizeTokens(value) {
   const normalized = toTrimmedString(value);
   if (!normalized) {
      return [];
   }
   return normalized
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
}

function extractQuotedColumnName(expression) {
   const normalized = toTrimmedString(expression);
   if (!normalized) {
      return null;
   }
   const match = normalized.match(/\."((?:[^"\\]|\\.)+)"\s*$/);
   return match ? match[1].replace(/\\(["\\])/g, '$1') : null;
}

function collectColumnIDsFromValue(value, collector) {
   if (!value || typeof value !== 'object') {
      return;
   }
   if (Array.isArray(value)) {
      for (const entry of value) {
         collectColumnIDsFromValue(entry, collector);
      }
      return;
   }
   for (const [key, nestedValue] of Object.entries(value)) {
      if (key === 'columnID' && typeof nestedValue === 'string' && nestedValue.trim() !== '') {
         collector.add(nestedValue.trim());
      }
      collectColumnIDsFromValue(nestedValue, collector);
   }
}

function buildCriteriaColumnInfoByID(workbookJson) {
   const byID = new Map();
   const criteriaColumns = Array.isArray(workbookJson?.criteria?.columns?.children)
      ? workbookJson.criteria.columns.children
      : [];
   for (const column of criteriaColumns) {
      const columnID = toTrimmedString(column?.columnID);
      if (!columnID || byID.has(columnID)) {
         continue;
      }
      const expression = toTrimmedString(column?.columnFormula?.expr?.expression);
      const heading = toTrimmedString(column?.columnHeading?.caption?.text);
      const expressionColumn = extractQuotedColumnName(expression);
      byID.set(columnID, {
         columnID,
         label: heading || expressionColumn || columnID,
         expression
      });
   }
   return byID;
}

function normalizeMetricFamilyTokens(columnInfo) {
   const variantTokens = new Set([
      'avg',
      'average',
      'current',
      'latest',
      'last',
      'max',
      'maximum',
      'min',
      'minimum',
      'peak',
      'top',
      'total'
   ]);
   const tokens = [
      ...normalizeTokens(columnInfo?.label),
      ...normalizeTokens(extractQuotedColumnName(columnInfo?.expression))
   ].filter((token) => !variantTokens.has(token));
   return Array.from(new Set(tokens)).sort();
}

function metricFamiliesOverlap(leftInfo, rightInfo) {
   const leftTokens = normalizeMetricFamilyTokens(leftInfo);
   const rightTokens = normalizeMetricFamilyTokens(rightInfo);
   if (leftTokens.length === 0 || rightTokens.length === 0) {
      return false;
   }
   return leftTokens.some((token) => rightTokens.includes(token));
}

function collectRelatedScatterMeasureFindings(workbookJson) {
   const criteriaByID = buildCriteriaColumnInfoByID(workbookJson);
   const pluginViews = Array.isArray(workbookJson?.views?.children)
      ? workbookJson.views.children.filter((view) => isPlainObject(view) && toTrimmedString(view?.pluginType) === 'oracle.bi.tech.chart.scatter')
      : [];
   const findings = [];
   for (const view of pluginViews) {
      const measureLayers = view?.dataModels?.children?.[0]?.logicalDataModel?.settings?.logicalDataModel?.logicalEdges?.measures?.logicalEdgeLayers;
      const measureColumnIDs = Array.isArray(measureLayers)
         ? measureLayers
            .map((layer) => toTrimmedString(layer?.columnID))
            .filter(Boolean)
         : [];
      if (measureColumnIDs.length < 2) {
         continue;
      }
      const leftInfo = criteriaByID.get(measureColumnIDs[0]);
      const rightInfo = criteriaByID.get(measureColumnIDs[1]);
      if (!leftInfo || !rightInfo || leftInfo.columnID === rightInfo.columnID) {
         continue;
      }
      if (!metricFamiliesOverlap(leftInfo, rightInfo)) {
         continue;
      }
      findings.push({
         viewName: toTrimmedString(view?.viewName) || 'unknown_scatter',
         left: leftInfo.label,
         right: rightInfo.label
      });
   }
   return findings;
}

function collectWorkbookSignals(workbookJson, textboxRuntimePathSignal) {
   const views = Array.isArray(workbookJson?.views?.children) ? workbookJson.views.children : [];
   const pluginViews = views.filter((view) => toTrimmedString(view?.pluginType));
   const canvasViews = views.filter((view) => String(view?.type || '').toLowerCase() === 'saw:canvasview');
   const textboxViews = pluginViews.filter((view) => toTrimmedString(view?.pluginType) === 'oracle.bi.tech.textbox');
   const canvasTitlesPresent = canvasViews.filter((canvasView) => getCanvasTitle(canvasView)).length;

   let textboxCanonicalTextCount = 0;
   let textboxLegacyOnlyCount = 0;
   textboxViews.forEach((view) => {
      const canonicalText = getCanonicalSignalText(view, textboxRuntimePathSignal);
      if (canonicalText) {
         textboxCanonicalTextCount += 1;
         return;
      }
      const legacyMatches = collectLegacySignalTextValues(view, textboxRuntimePathSignal);
      if (legacyMatches.length > 0) {
         textboxLegacyOnlyCount += 1;
      }
   });

   const runtimeFamilies = new Set();
   pluginViews.forEach((view) => {
      const family = normalizeRuntimeFamily(view?.pluginType);
      if (family && family !== 'other') {
         runtimeFamilies.add(family);
      }
   });

   let filterControlCount = 0;
   const filterCollections = Array.isArray(workbookJson?.filterControlCollections?.children)
      ? workbookJson.filterControlCollections.children
      : [];
   filterCollections.forEach((collection) => {
      const controls = Array.isArray(collection?.children) ? collection.children : [];
      filterControlCount += controls.length;
   });

   const criteriaColumns = Array.isArray(workbookJson?.criteria?.columns?.children)
      ? workbookJson.criteria.columns.children
      : [];
   let derivedFormulaCount = 0;
   criteriaColumns.forEach((column) => {
      const expression = String(column?.columnFormula?.expr?.expression || '').trim();
      if (!expression) {
         return;
      }
      if (/[+\-*/]/.test(expression) || /\bCASE\b/i.test(expression) || /\bAGO\b|\bTODATE\b|\bTOPN\b/i.test(expression)) {
         derivedFormulaCount += 1;
      }
   });

   const interactions = Array.isArray(workbookJson?.interactions?.children) ? workbookJson.interactions.children.length : 0;
   const dataActions = Array.isArray(workbookJson?.dataActions) ? workbookJson.dataActions.length : 0;
   const eventWiring = Array.isArray(workbookJson?.events?.children) ? workbookJson.events.children.length : 0;
   const relatedScatterMeasureFindings = collectRelatedScatterMeasureFindings(workbookJson);

   return {
      pluginViewCount: pluginViews.length,
      canvasCount: Math.max(canvasViews.length, 1),
      textboxCount: textboxViews.length,
      textboxCanonicalTextCount,
      textboxLegacyOnlyCount,
      canvasTitlesPresent,
      uniqueRuntimeFamilyCount: runtimeFamilies.size,
      runtimeFamilies: Array.from(runtimeFamilies).sort(),
      filterControlCount,
      derivedFormulaCount,
      interactions,
      dataActions,
      eventWiring,
      relatedScatterMeasureCount: relatedScatterMeasureFindings.length,
      relatedScatterMeasureFindings
   };
}

function computeFilterPlanQuality(filterPlanningSummary) {
   const applied = Number(filterPlanningSummary?.appliedCount || 0);
   const considered = Number(filterPlanningSummary?.consideredNotGroundedCount || 0);
   const rejectedConflict = Number(filterPlanningSummary?.rejectedConflictCount || 0);
   const rejectedMissing = Number(filterPlanningSummary?.rejectedMissingFieldCount || 0);
   const total = applied + considered + rejectedConflict + rejectedMissing;
   if (total <= 0) {
      return 0.5;
   }
   return clamp((applied + considered * 0.5) / total, 0, 1);
}

function computePresentationQuality(presentationPolishSummary) {
   const polishApplied = presentationPolishSummary?.applied === true;
   const uxLintSummary = isPlainObject(presentationPolishSummary?.uxLintSummary)
      ? presentationPolishSummary.uxLintSummary
      : {};
   const severeCount = Number(uxLintSummary?.severeCount || 0);
   const warningCount = Number(uxLintSummary?.warningCount || 0);
   const mode = toTrimmedString(presentationPolishSummary?.mode) || 'off';

   let score = 1;
   score -= severeCount * 0.35;
   score -= warningCount * 0.06;
   if (mode === 'off') {
      score -= 0.1;
   }
   if (polishApplied) {
      score += 0.05;
   }
   return clamp(score, 0, 1);
}

function computeViewDensityBalance(pluginViewCount, canvasCount) {
   if (canvasCount <= 0) {
      return 0;
   }
   const viewsPerCanvas = pluginViewCount / canvasCount;
   return clamp(1 - Math.abs(viewsPerCanvas - 4) / 4, 0, 1);
}

function evaluateRuleCondition(features, condition) {
   const featureID = toTrimmedString(condition?.feature);
   const operator = toTrimmedString(condition?.operator);
   if (!featureID || !operator) {
      return false;
   }
   const rawFeatureValue = Number(features[featureID]);
   const featureValue = Number.isFinite(rawFeatureValue) ? rawFeatureValue : 0;
   const expectedValueRaw = Number(condition?.value);
   const expectedValue = Number.isFinite(expectedValueRaw) ? expectedValueRaw : 0;

   if (operator === 'lt') {
      return featureValue < expectedValue;
   }
   if (operator === 'lte') {
      return featureValue <= expectedValue;
   }
   if (operator === 'gt') {
      return featureValue > expectedValue;
   }
   if (operator === 'gte') {
      return featureValue >= expectedValue;
   }
   if (operator === 'eq') {
      return featureValue === expectedValue;
   }
   if (operator === 'neq') {
      return featureValue !== expectedValue;
   }
   return false;
}

function scoreDimension(features, dimension) {
   const featureWeights = isPlainObject(dimension?.featureWeights) ? dimension.featureWeights : {};
   const weightEntries = Object.entries(featureWeights)
      .filter(([, weight]) => Number.isFinite(Number(weight)) && Number(weight) > 0)
      .map(([featureID, weight]) => [featureID, Number(weight)]);
   if (weightEntries.length === 0) {
      return {
         id: dimension?.id || 'unknown',
         label: dimension?.label || 'Unknown',
         weight: Number(dimension?.weight || 0),
         score: 0,
         featureContribution: []
      };
   }
   const totalWeight = weightEntries.reduce((sum, [, weight]) => sum + weight, 0);
   let weightedScore = 0;
   const contributions = [];
   weightEntries.forEach(([featureID, weight]) => {
      const featureValue = clamp(Number(features[featureID] ?? 0), 0, 1);
      const contribution = featureValue * weight;
      weightedScore += contribution;
      contributions.push({
         feature: featureID,
         value: round(featureValue, 4),
         weight: round(weight, 4),
         weightedContribution: round(contribution, 4)
      });
   });
   const normalized = totalWeight > 0 ? weightedScore / totalWeight : 0;
   return {
      id: dimension.id,
      label: dimension.label,
      weight: Number.isFinite(Number(dimension.weight)) ? Number(dimension.weight) : 0,
      score: round(clamp(normalized, 0, 1) * 100, 2),
      featureContribution: contributions
   };
}

const requestPath = getArg('--request');
if (!requestPath) {
   fail('Usage: node score-dv-intelligence.mjs --request <request.json> [--contract <contract.json>]');
}

const resolvedRequestPath = path.resolve(requestPath);
if (!fs.existsSync(resolvedRequestPath)) {
   fail(`Request file does not exist: ${resolvedRequestPath}`);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workbookAuthoringDir = path.resolve(scriptDir, '..');
const contractPath = path.resolve(
   getArg('--contract') || path.join(workbookAuthoringDir, 'model', 'dv-intelligence-contract.v1.json')
);
if (!fs.existsSync(contractPath)) {
   fail(`DV Intelligence contract file does not exist: ${contractPath}`);
}

const request = readJson(resolvedRequestPath, 'request');
ensureObject(request, 'request');
const contract = readJson(contractPath, 'dv-intelligence-contract');
ensureObject(contract, 'dv-intelligence-contract');

const mode = toTrimmedString(request.mode) || toTrimmedString(contract?.defaults?.mode) || 'auto';
if (!Array.isArray(contract.modes) || !contract.modes.includes(mode)) {
   fail(`Unsupported mode '${mode}'. Allowed modes: ${(Array.isArray(contract.modes) ? contract.modes.join(', ') : 'auto, off')}`);
}

const workbookJson = request.workbookJson;
if (mode !== 'off') {
   ensureObject(workbookJson, 'request.workbookJson');
}

const targetVersion = toTrimmedString(request.targetVersion) || 'unknown';
const runtimePathRegistry = loadRuntimePathRegistry({
   registryPath: getArg('--runtime-path-registry') || null,
   targetVersion
});
const textboxRuntimePathSignalResolution = resolveRuntimePathSignal(runtimePathRegistry, RUNTIME_PATH_SIGNAL_TEXTBOX);
const textboxRuntimePathSignal = textboxRuntimePathSignalResolution.signal;
const runtimePathRegistryDiagnostics = Array.isArray(textboxRuntimePathSignalResolution.diagnostics)
   ? textboxRuntimePathSignalResolution.diagnostics
   : [];
const profileByTargetVersion = isPlainObject(contract?.defaults?.profileByTargetVersion)
   ? contract.defaults.profileByTargetVersion
   : {};
const requestedProfileID = toTrimmedString(request.profileID);
const resolvedProfileID = requestedProfileID
   || toTrimmedString(profileByTargetVersion[targetVersion])
   || toTrimmedString(profileByTargetVersion.default)
   || 'balanced_v1';
const profile = isPlainObject(contract?.profiles?.[resolvedProfileID]) ? contract.profiles[resolvedProfileID] : null;
if (mode !== 'off' && !profile) {
   fail(`Profile '${resolvedProfileID}' was not found in DV Intelligence contract.`);
}

const audienceProfileInput = request.audienceProfile;
const defaultAudienceProfile = isPlainObject(contract?.defaults?.defaultAudienceProfile)
   ? contract.defaults.defaultAudienceProfile
   : {};
const normalizedAudienceProfile = isPlainObject(audienceProfileInput)
   ? {
      role: toTrimmedString(audienceProfileInput.role) || toTrimmedString(defaultAudienceProfile.role) || 'general_analyst',
      targetLevel: toTrimmedString(audienceProfileInput.targetLevel) || toTrimmedString(defaultAudienceProfile.targetLevel) || 'intermediate'
   }
   : {
      role: toTrimmedString(defaultAudienceProfile.role) || 'general_analyst',
      targetLevel: toTrimmedString(defaultAudienceProfile.targetLevel) || 'intermediate'
   };
const documentationReferences = normalizeDocumentationReferences(contract);

if (mode === 'off') {
   process.stdout.write(
      `${JSON.stringify({
         status: 'ok',
         summary: {
            mode,
            status: 'disabled',
            overallScore: null,
            audienceLevel: null,
            dimensionScores: [],
            recommendations: [],
            evidenceCoverage: {
               featureCount: 0,
               availableFeatureCount: 0,
               coverageRatio: 0
            },
            versionProfile: {
               id: resolvedProfileID,
               targetVersion,
               contractVersion: toTrimmedString(contract.contractVersion) || 'v1',
               audienceProfile: normalizedAudienceProfile
            },
            ...(documentationReferences.length > 0 ? { references: documentationReferences } : {})
         },
         trace: {
            mode,
            status: 'disabled',
            reason: 'visualizationIntelligence.mode=off',
            ...(documentationReferences.length > 0 ? { references: documentationReferences } : {})
         }
      }, null, 2)}\n`
   );
   process.exit(0);
}

const summaries = isPlainObject(request.summaries) ? request.summaries : {};
const workbookSignals = collectWorkbookSignals(workbookJson, textboxRuntimePathSignal);
const requirementsTraceSummary = isPlainObject(summaries.requirementsTraceSummary) ? summaries.requirementsTraceSummary : {};
const componentGraphSummary = isPlainObject(summaries.componentGraphSummary) ? summaries.componentGraphSummary : {};
const presentationPolishSummary = isPlainObject(summaries.presentationPolishSummary) ? summaries.presentationPolishSummary : {};
const filterPlanningSummary = isPlainObject(summaries.filterPlanningSummary) ? summaries.filterPlanningSummary : {};
const numberFormattingSummary = isPlainObject(summaries.numberFormattingSummary) ? summaries.numberFormattingSummary : {};
const validationStatus = isPlainObject(summaries.validationStatus) ? summaries.validationStatus : {};

const calcSignalRaw = Number(request?.analysisSignals?.calculationCount ?? 0) + Number(workbookSignals.derivedFormulaCount || 0);
const calcSignal = clamp(calcSignalRaw / 3, 0, 1);
const measureCoverageSeed = Number(numberFormattingSummary?.targetMeasureViewCount || 0);
const measureCoverage = workbookSignals.pluginViewCount > 0
   ? clamp((measureCoverageSeed > 0 ? measureCoverageSeed : workbookSignals.pluginViewCount * 0.5) / workbookSignals.pluginViewCount, 0, 1)
   : 0;
const interactionCount = Number(componentGraphSummary?.interactionCount || 0) + workbookSignals.interactions;
const eventWiringCount = Number(componentGraphSummary?.eventWiringCount || 0) + workbookSignals.eventWiring;
const dataActionCount = Number(componentGraphSummary?.dataActionCount || 0) + workbookSignals.dataActions;
const interactionSignal = clamp((interactionCount + eventWiringCount + dataActionCount) / 3, 0, 1);
const filterControlCount = Math.max(
   Number(componentGraphSummary?.filterControlCount || 0),
   workbookSignals.filterControlCount
);

const features = {
   runtime_valid: validationStatus.valid === true ? 1 : 0,
   requirements_trace_valid: requirementsTraceSummary.valid === true ? 1 : 0,
   number_formatting_enabled: numberFormattingSummary.enabled === true ? 1 : 0,
   filter_plan_quality: computeFilterPlanQuality(filterPlanningSummary),
   calculation_signal: calcSignal,
   measure_coverage: measureCoverage,
   analysis_traceability: requirementsTraceSummary.valid === true
      ? 1
      : (requirementsTraceSummary.executed === true ? 0.4 : 0),
   visualization_diversity: workbookSignals.pluginViewCount > 0
      ? clamp(workbookSignals.uniqueRuntimeFamilyCount / 5, 0, 1)
      : 0,
   presentation_quality: computePresentationQuality(presentationPolishSummary),
   narrative_coverage: clamp(workbookSignals.textboxCanonicalTextCount / workbookSignals.canvasCount, 0, 1),
   canvas_title_coverage: clamp(workbookSignals.canvasTitlesPresent / workbookSignals.canvasCount, 0, 1),
   filter_control_coverage: clamp(filterControlCount / workbookSignals.canvasCount, 0, 1),
   interaction_signal: interactionSignal,
   layout_severity_penalty_inverted: clamp(1 - Number(presentationPolishSummary?.uxLintSummary?.severeCount || 0) * 0.5, 0, 1),
   view_density_balance: computeViewDensityBalance(workbookSignals.pluginViewCount, workbookSignals.canvasCount),
   textbox_legacy_only_penalty: clamp(workbookSignals.textboxLegacyOnlyCount / workbookSignals.canvasCount, 0, 1)
};

const dimensions = Array.isArray(profile.dimensions) ? profile.dimensions : [];
const scoredDimensions = dimensions.map((dimension) => scoreDimension(features, dimension));
const totalDimensionWeight = scoredDimensions
   .map((dimension) => Number(dimension.weight))
   .filter((weight) => Number.isFinite(weight) && weight > 0)
   .reduce((sum, weight) => sum + weight, 0);
const weightedScore = scoredDimensions.reduce((sum, dimension) => {
   const safeWeight = Number.isFinite(Number(dimension.weight)) ? Number(dimension.weight) : 0;
   return sum + dimension.score * safeWeight;
}, 0);
const overallScore = round(totalDimensionWeight > 0 ? weightedScore / totalDimensionWeight : 0, 2);

const audienceBands = Array.isArray(profile.audienceBands) ? profile.audienceBands : [];
const resolvedAudienceBand = audienceBands.find((band) => {
   const minScore = Number(band?.minScore);
   const maxScore = Number(band?.maxScore);
   return Number.isFinite(minScore) && Number.isFinite(maxScore) && overallScore >= minScore && overallScore <= maxScore;
}) || null;

const recommendationRules = Array.isArray(profile.recommendationRules) ? profile.recommendationRules : [];
const recommendations = [];
const ruleHits = [];
recommendationRules.forEach((rule) => {
   const conditions = Array.isArray(rule?.conditions) ? rule.conditions : [];
   if (conditions.length === 0) {
      return;
   }
   const matched = conditions.every((condition) => evaluateRuleCondition(features, condition));
   ruleHits.push({
      id: rule?.id || 'unknown_rule',
      matched
   });
   if (!matched) {
      return;
   }
   recommendations.push({
      id: rule.id,
      priority: toTrimmedString(rule.priority) || 'medium',
      dimensionID: toTrimmedString(rule.dimensionID),
      message: toTrimmedString(rule.message) || 'Quality gap detected.',
      action: toTrimmedString(rule.action) || 'Review dimension evidence and apply deterministic improvements.'
   });
});

if (workbookSignals.relatedScatterMeasureCount > 0) {
   const firstFinding = Array.isArray(workbookSignals.relatedScatterMeasureFindings)
      ? workbookSignals.relatedScatterMeasureFindings[0]
      : null;
   recommendations.push({
      id: 'RELATED_METRIC_SCATTER_NEEDS_CONTEXT',
      priority: 'medium',
      dimensionID: 'visualization_quality',
      message: `Scatter view '${firstFinding?.viewName || 'unknown_scatter'}' compares related measures${firstFinding ? ` (${firstFinding.left} vs ${firstFinding.right})` : ''}.`,
      action: 'Add interpretive context such as a reference line or derived delta metric, or use a clearer comparison visual such as a sorted bar chart of the difference.'
   });
}

if (recommendations.length === 0) {
   recommendations.push({
      id: 'MAINTAIN_QUALITY_BASELINE',
      priority: 'low',
      dimensionID: null,
      message: 'No major quality gaps detected by current DV Intelligence rules.',
      action: 'Maintain current structure and refine domain-specific storytelling as needed.'
   });
}

const priorityOrder = new Map([
   ['critical', 0],
   ['high', 1],
   ['medium', 2],
   ['low', 3]
]);
recommendations.sort((left, right) => {
   const leftRank = priorityOrder.has(left.priority) ? priorityOrder.get(left.priority) : 99;
   const rightRank = priorityOrder.has(right.priority) ? priorityOrder.get(right.priority) : 99;
   if (leftRank !== rightRank) {
      return leftRank - rightRank;
   }
   return String(left.id).localeCompare(String(right.id));
});

const featureIDs = Object.keys(features);
const availableFeatureCount = featureIDs.filter((featureID) => Number.isFinite(features[featureID])).length;
const evidenceCoverage = {
   featureCount: featureIDs.length,
   availableFeatureCount,
   coverageRatio: round(featureIDs.length > 0 ? availableFeatureCount / featureIDs.length : 0, 4),
   pluginViewCount: workbookSignals.pluginViewCount,
   canvasCount: workbookSignals.canvasCount,
   filterControlCount,
   interactionCount: interactionCount + eventWiringCount + dataActionCount,
   textboxCount: workbookSignals.textboxCount,
   textboxCanonicalTextCount: workbookSignals.textboxCanonicalTextCount,
   textboxLegacyOnlyCount: workbookSignals.textboxLegacyOnlyCount
};

process.stdout.write(
   `${JSON.stringify({
      status: 'ok',
      summary: {
         mode,
         status: 'scored',
         overallScore,
         audienceLevel: resolvedAudienceBand
            ? {
               id: resolvedAudienceBand.id,
               label: resolvedAudienceBand.label,
               description: resolvedAudienceBand.description,
               minScore: Number(resolvedAudienceBand.minScore),
               maxScore: Number(resolvedAudienceBand.maxScore)
            }
            : null,
         dimensionScores: scoredDimensions.map((dimension) => ({
            id: dimension.id,
            label: dimension.label,
            weight: round(Number(dimension.weight || 0), 4),
            score: dimension.score
         })),
         recommendations,
         evidenceCoverage,
         versionProfile: {
            id: resolvedProfileID,
            targetVersion,
            contractVersion: toTrimmedString(contract.contractVersion) || 'v1',
            audienceProfile: normalizedAudienceProfile
         },
         ...(runtimePathRegistryDiagnostics.length > 0 ? { runtimePathRegistryDiagnostics } : {}),
         ...(documentationReferences.length > 0 ? { references: documentationReferences } : {})
      },
      trace: {
         mode,
         features: Object.fromEntries(
            Object.entries(features)
               .sort(([left], [right]) => left.localeCompare(right))
               .map(([featureID, featureValue]) => [featureID, round(featureValue, 4)])
         ),
         workbookSignals,
         dimensionComputations: scoredDimensions.map((dimension) => ({
            id: dimension.id,
            score: dimension.score,
            weight: round(Number(dimension.weight || 0), 4),
            featureContribution: dimension.featureContribution
         })),
         ruleHits,
         ...(runtimePathRegistryDiagnostics.length > 0 ? { runtimePathRegistryDiagnostics } : {}),
         ...(documentationReferences.length > 0 ? { references: documentationReferences } : {})
      }
   }, null, 2)}\n`
);
