#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
   RUNTIME_PATH_SIGNAL_TEXTBOX,
   loadRuntimePathRegistry,
   resolveRuntimePathSignal,
   getCanonicalSignalText,
   collectLegacySignalTextValues,
   selectSignalTextValue,
   setValueByPathSegments,
   migrateSignalLegacyTextToCanonical
} from './runtime-path-registry-utils.mjs';
import {
   extractWorkbookProjectVersion,
   resolveCompatibilityProfile
} from './compatibility-profile-utils.mjs';

const argv = process.argv.slice(2);
const EMBEDDED_VIZ_DUMMY_MEASURE_LINK_COLUMN_ID = '__EmbeddedVizDummyMeasureLink__';

function getArg(flag) {
   const index = argv.indexOf(flag);
   if (index === -1 || index + 1 >= argv.length) {
      return null;
   }
   return argv[index + 1];
}

function fail(code, message) {
   process.stderr.write(`${code}: ${message}\n`);
   process.exit(1);
}

function readJson(filePath, codeOnFailure) {
   try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
   } catch (error) {
      fail(codeOnFailure, `Unable to parse JSON file '${filePath}': ${error?.message || String(error)}`);
   }
}

function tryReadJson(filePath) {
   try {
      if (!fs.existsSync(filePath)) {
         return null;
      }
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return isPlainObject(parsed) ? parsed : null;
   } catch {
      return null;
   }
}

function resolveVersionNodeDefault(versionCatalog, nodeID, codeOnFailure) {
   const directDefault = toNonEmptyTrimmedString(versionCatalog?.defaults?.[nodeID]);
   if (directDefault) {
      return directDefault;
   }
   const versionedNodes = Array.isArray(versionCatalog?.versionedNodes) ? versionCatalog.versionedNodes : [];
   const matchingNode = versionedNodes.find((entry) => entry && entry.id === nodeID);
   const nodeDefault = toNonEmptyTrimmedString(matchingNode?.defaultValue);
   if (nodeDefault) {
      return nodeDefault;
   }
   fail(codeOnFailure, `version-field-catalog.json is missing default version for node '${nodeID}'.`);
}

function writeJson(filePath, payload) {
   fs.mkdirSync(path.dirname(filePath), { recursive: true });
   fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function asBoolean(value) {
   return value === true;
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
   fail('INVALID_REQUEST_CONTRACT', `Invalid boolean value for ${flag}: ${value}. Use true or false.`);
}

function ensureString(value, fieldPath) {
   if (typeof value !== 'string' || value.trim() === '') {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath} must be a non-empty string.`);
   }
}

function ensureObject(value, fieldPath) {
   if (!value || typeof value !== 'object' || Array.isArray(value)) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath} must be an object.`);
   }
}

function ensureArray(value, fieldPath) {
   if (!Array.isArray(value)) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath} must be an array.`);
   }
}

function ensureBoolean(value, fieldPath) {
   if (typeof value !== 'boolean') {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath} must be boolean.`);
   }
}

const COMPOSE_FILTER_OBJECT_MINIMAL_SHAPE = {
   filterID: '<filter_id>',
   columnID: '<column_id>',
   location: 'filter_bar',
   scope: 'global',
   operator: 'in',
   default: '<value|array|range>',
   planningOutcome: 'applied'
};

const COMPOSE_FILTER_OBJECT_MINIMAL_SHAPE_SNIPPET = JSON.stringify(COMPOSE_FILTER_OBJECT_MINIMAL_SHAPE);

const COMPACT_VIEW_TYPE_PLUGIN_TYPES = {
   area: 'oracle.bi.tech.chart.area',
   bar: 'oracle.bi.tech.chart.bar',
   combo: 'oracle.bi.tech.chart.comboMultiLayerChart',
   donut: 'oracle.bi.tech.chart.donut',
   horizontal_bar: 'oracle.bi.tech.chart.horizontalbar',
   horizontal_stacked_bar: 'oracle.bi.tech.chart.horizontalstackbar',
   kpi: 'oracle.bi.tech.ngperformancetile',
   kpi_tile: 'oracle.bi.tech.ngperformancetile',
   line: 'oracle.bi.tech.chart.line',
   map: 'oracle.bi.tech.map',
   performance_tile: 'oracle.bi.tech.ngperformancetile',
   pivot: 'oracle.bi.tech.pivot',
   scatter: 'oracle.bi.tech.chart.scatter',
   stacked_bar: 'oracle.bi.tech.chart.stackbar',
   table: 'oracle.bi.tech.table',
   tile: 'oracle.bi.tech.ngperformancetile'
};

const PLANNING_ROLE_TO_CANONICAL_COLUMN_ID = {
   'dimension.primary': 'dim_region',
   'dimension.secondary': 'dim_category',
   'measure.primary': 'mea_revenue',
   'measure.secondary': 'mea_profit',
   'temporal.primary': 'time_month',
   'temporal.start': 'time_start',
   'temporal.end': 'time_end'
};

const TABLE_MAX_COLUMN_COUNT = 50;
const COMPACT_MEASURE_ROLE_CAPACITY = 2;
const PLANNING_AGGREGATION_RULES = new Map([
   ['avg', 'avg'],
   ['average', 'avg'],
   ['avg_distinct', 'avgDistinct'],
   ['average_distinct', 'avgDistinct'],
   ['count', 'count'],
   ['count_distinct', 'countDistinct'],
   ['count_star', 'countStar'],
   ['default', 'default'],
   ['first', 'first'],
   ['last', 'last'],
   ['max', 'max'],
   ['maximum', 'max'],
   ['median', 'median'],
   ['min', 'min'],
   ['minimum', 'min'],
   ['none', 'none'],
   ['server', 'server'],
   ['server_aggregate', 'serverAggregate'],
   ['stddev', 'stddev'],
   ['sum', 'sum']
]);

const DATA_ACTION_NAMESPACE_ABSTRACT = 'obitech-report/dataaction.AbstractDataAction';
const DATA_ACTION_NAMESPACE_HTTP = 'obitech-report/dataaction.AbstractHTTPDataAction';
const DATA_ACTION_NAMESPACE_BI_NAV = 'obitech-report/dataaction.BINavigationDataAction';

function toJsonPointer(pathSegments) {
   if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
      return '/';
   }
   return `/${pathSegments.map((segment) => String(segment)
      .replaceAll('~', '~0')
      .replaceAll('/', '~1')).join('/')}`;
}

function failComposeRequirementsPreflight(pointer, message) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `compose_ootb requirements preflight failed at '${pointer}': ${message}. `
      + `Expected filter object shape: ${COMPOSE_FILTER_OBJECT_MINIMAL_SHAPE_SNIPPET}`
   );
}

function deepClone(value) {
   return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
   return value && typeof value === 'object' && !Array.isArray(value);
}

function toNonEmptyTrimmedString(value) {
   if (typeof value !== 'string') {
      return null;
   }
   const trimmed = value.trim();
   return trimmed === '' ? null : trimmed;
}

const PROHIBITED_URL_ACTION_SCHEMES = new Set(['data', 'file', 'javascript', 'vbscript']);

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

function clampNumber(value, min, max) {
   return Math.max(min, Math.min(max, value));
}

function normalizeFilterModeToken(value) {
   const normalized = toNonEmptyTrimmedString(value);
   if (!normalized) {
      return null;
   }
   return normalized.toLowerCase();
}

function buildCanvasViewIDIndex(canvases, labelPrefix) {
   const index = new Map();
   for (const [canvasIndex, canvas] of canvases.entries()) {
      const canvasID = toNonEmptyTrimmedString(canvas?.id);
      if (!canvasID) {
         fail('INVALID_REQUEST_CONTRACT', `${labelPrefix}[${canvasIndex}].id must be a non-empty string.`);
      }
      if (index.has(canvasID)) {
         fail('INVALID_REQUEST_CONTRACT', `${labelPrefix}[${canvasIndex}].id '${canvasID}' is duplicated.`);
      }
      const viewIDs = new Set();
      const views = Array.isArray(canvas?.views) ? canvas.views : [];
      for (const [viewIndex, view] of views.entries()) {
         const viewID = toNonEmptyTrimmedString(view?.id);
         if (!viewID) {
            fail('INVALID_REQUEST_CONTRACT', `${labelPrefix}[${canvasIndex}].views[${viewIndex}].id must be a non-empty string.`);
         }
         if (viewIDs.has(viewID)) {
            fail('INVALID_REQUEST_CONTRACT', `${labelPrefix}[${canvasIndex}].views[${viewIndex}].id '${viewID}' is duplicated within canvas '${canvasID}'.`);
         }
         viewIDs.add(viewID);
      }
      index.set(canvasID, viewIDs);
   }
   return index;
}

function isNonEmptyValue(value) {
   if (value === undefined || value === null) {
      return false;
   }
   if (typeof value === 'string') {
      return value.trim() !== '';
   }
   if (Array.isArray(value)) {
      return value.length > 0;
   }
   return true;
}

function getNestedValue(root, pathSegments) {
   if (!isPlainObject(root) || !Array.isArray(pathSegments) || pathSegments.length === 0) {
      return undefined;
   }
   let cursor = root;
   for (const segment of pathSegments) {
      if (!isPlainObject(cursor) || !(segment in cursor)) {
         return undefined;
      }
      cursor = cursor[segment];
   }
   return cursor;
}

function extractDefaultCandidateFromDecision(decision) {
   if (!isPlainObject(decision)) {
      return null;
   }
   const candidatePaths = [
      ['default'],
      ['defaultValue'],
      ['defaultValues'],
      ['value'],
      ['values'],
      ['range'],
      ['defaultRange'],
      ['resolvedDefault'],
      ['resolvedDefaultValue'],
      ['resolvedDefaultValues'],
      ['decision', 'default'],
      ['decision', 'defaultValue'],
      ['decision', 'defaultValues'],
      ['decision', 'range'],
      ['decision', 'defaultRange']
   ];
   for (const pathSegments of candidatePaths) {
      const candidate = getNestedValue(decision, pathSegments);
      if (isNonEmptyValue(candidate)) {
         return {
            value: deepClone(candidate),
            source: `derivedDecisions.${pathSegments.join('.')}`
         };
      }
   }
   return null;
}

function createComposeFilterDefaultResolver(filterDecisionTrace) {
   const derivedDecisions = Array.isArray(filterDecisionTrace?.derivedDecisions)
      ? filterDecisionTrace.derivedDecisions
      : [];
   const candidates = [];
   for (const decision of derivedDecisions) {
      if (!isPlainObject(decision)) {
         continue;
      }
      const candidate = extractDefaultCandidateFromDecision(decision);
      if (!candidate) {
         continue;
      }
      candidates.push({
         filterID: toNonEmptyTrimmedString(decision.filterID),
         columnID: toNonEmptyTrimmedString(decision.columnID),
         value: candidate.value,
         source: candidate.source
      });
   }
   return (filter) => {
      const filterID = toNonEmptyTrimmedString(filter?.filterID);
      const columnID = toNonEmptyTrimmedString(filter?.columnID);
      let matched = null;
      if (filterID && columnID) {
         matched = candidates.find((candidate) => candidate.filterID === filterID && candidate.columnID === columnID) || null;
      }
      if (!matched && filterID) {
         matched = candidates.find((candidate) => candidate.filterID === filterID) || null;
      }
      if (!matched && columnID) {
         matched = candidates.find((candidate) => candidate.columnID === columnID) || null;
      }
      if (!matched) {
         const selector = filterID || columnID || 'unkeyed_filter';
         return {
            found: false,
            reason: `No profiling-derived default found in adapterPayload.profiling.filterDecisionTrace.derivedDecisions for '${selector}'.`
         };
      }
      return {
         found: true,
         value: deepClone(matched.value),
         source: matched.source
      };
   };
}

function recordComposeFilterAutoFill(toleranceState, entry) {
   if (!isPlainObject(toleranceState)) {
      return;
   }
   if (!Array.isArray(toleranceState.autoFilledFilterFields)) {
      toleranceState.autoFilledFilterFields = [];
   }
   toleranceState.autoFilledFilterFields.push(entry);
}

function recordComposeFilterNoAutoFillReason(toleranceState, reason) {
   if (!isPlainObject(toleranceState)) {
      return;
   }
   if (!Array.isArray(toleranceState.noAutoFillReasons)) {
      toleranceState.noAutoFillReasons = [];
   }
   toleranceState.noAutoFillReasons.push(reason);
}

function validateComposeFilterObjects(filters, pointerPrefix, fieldPath, options = {}) {
   const toleranceMode = toNonEmptyTrimmedString(options.mode) === 'tolerant' ? 'tolerant' : 'strict';
   const resolveDefault = typeof options.resolveDefaultForFilter === 'function'
      ? options.resolveDefaultForFilter
      : () => ({ found: false, reason: 'No resolver provided.' });
   const toleranceState = isPlainObject(options.toleranceState)
      ? options.toleranceState
      : null;
   for (const [filterIndex, filter] of filters.entries()) {
      const filterPath = `${fieldPath}.filters[${filterIndex}]`;
      const filterPointerPrefix = `${pointerPrefix}/${filterIndex}`;
      if (!isPlainObject(filter)) {
         failComposeRequirementsPreflight(
            filterPointerPrefix,
            `${filterPath} must be an object.`
         );
      }
      const requiredStringFields = ['filterID', 'columnID', 'location', 'operator', 'planningOutcome'];
      for (const requiredField of requiredStringFields) {
         const value = toNonEmptyTrimmedString(filter[requiredField]);
         if (!value) {
            failComposeRequirementsPreflight(
               `${filterPointerPrefix}/${requiredField}`,
               `${filterPath}.${requiredField} must be a non-empty string.`
            );
         }
      }
      const scopeValue = toNonEmptyTrimmedString(filter.scope);
      if (!scopeValue) {
         if (toleranceMode === 'tolerant') {
            filter.scope = 'global';
            recordComposeFilterAutoFill(toleranceState, {
               pointer: `${filterPointerPrefix}/scope`,
               field: 'scope',
               value: 'global',
               reason: 'missing_scope_defaulted_to_global',
               filterID: toNonEmptyTrimmedString(filter.filterID),
               columnID: toNonEmptyTrimmedString(filter.columnID)
            });
         } else {
            failComposeRequirementsPreflight(
               `${filterPointerPrefix}/scope`,
               `${filterPath}.scope must be a non-empty string.`
            );
         }
      }
      if (filter.default === undefined) {
         if (toleranceMode === 'tolerant') {
            const resolution = resolveDefault(filter);
            if (resolution.found) {
               filter.default = deepClone(resolution.value);
               recordComposeFilterAutoFill(toleranceState, {
                  pointer: `${filterPointerPrefix}/default`,
                  field: 'default',
                  valueSource: resolution.source || 'derivedDecisions',
                  reason: 'missing_default_derived_from_profiling',
                  filterID: toNonEmptyTrimmedString(filter.filterID),
                  columnID: toNonEmptyTrimmedString(filter.columnID)
               });
            } else {
               const reason = toNonEmptyTrimmedString(resolution.reason) || 'unknown reason';
               recordComposeFilterNoAutoFillReason(toleranceState, reason);
               failComposeRequirementsPreflight(
                  `${filterPointerPrefix}/default`,
                  `${filterPath}.default must be provided (tolerant mode could not auto-fill: ${reason})`
               );
            }
         } else {
            failComposeRequirementsPreflight(
               `${filterPointerPrefix}/default`,
               `${filterPath}.default must be provided.`
            );
         }
      }
   }
}

function validateComposeViewPlanningFields(view, fieldPath, options = {}) {
   const enforceFilterObjectSchema = options.enforceFilterObjectSchema === true;
   const filterPointerPrefix = toNonEmptyTrimmedString(options.filterPointerPrefix);
   const composeFilterValidationOptions = isPlainObject(options.composeFilterValidationOptions)
      ? options.composeFilterValidationOptions
      : {};
   ensureString(view.purpose, `${fieldPath}.purpose`);
   if (!(typeof view.grain === 'string' || isPlainObject(view.grain) || Array.isArray(view.grain))) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.grain must be a string, object, or array.`);
   }
   ensureObject(view.bindings, `${fieldPath}.bindings`);
   if (Object.keys(view.bindings).length === 0) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.bindings must contain at least one role binding.`);
   }
   ensureObject(view.labels, `${fieldPath}.labels`);
   ensureArray(view.filters, `${fieldPath}.filters`);
   if (enforceFilterObjectSchema) {
      if (!filterPointerPrefix) {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${fieldPath}.filters preflight requires a non-empty filterPointerPrefix.`
         );
      }
      validateComposeFilterObjects(view.filters, filterPointerPrefix, fieldPath, composeFilterValidationOptions);
   }
   ensureArray(view.calculations, `${fieldPath}.calculations`);
   ensureArray(view.sort, `${fieldPath}.sort`);
   if (view.interactions !== undefined
      && !(Array.isArray(view.interactions) || isPlainObject(view.interactions))) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.interactions must be an array or object when provided.`);
   }
   const interactionCount = Array.isArray(view.interactions)
      ? view.interactions.length
      : (isPlainObject(view.interactions) ? Object.keys(view.interactions).length : 0);
   if (interactionCount > 0) {
      fail(
         'UNSUPPORTED_COMPOSE_INTERACTIONS',
         `${fieldPath}.interactions is not materialized by compose_ootb. Use top-level analysisRequirements.actions/dataActions for supported BI Navigation or URL Navigation behavior.`
      );
   }
}

function validateComposeAnalysisRequirements(analysisRequirements, analysisShape, selectedDataModel, options = {}) {
   const composeFilterToleranceMode = toNonEmptyTrimmedString(options.composeFilterToleranceMode) === 'tolerant'
      ? 'tolerant'
      : 'strict';
   const composeFilterToleranceState = isPlainObject(options.composeFilterToleranceState)
      ? options.composeFilterToleranceState
      : null;
   const composeFilterDefaultResolver = typeof options.composeFilterDefaultResolver === 'function'
      ? options.composeFilterDefaultResolver
      : (() => ({ found: false, reason: 'No compose filter default resolver provided.' }));
   if (!isPlainObject(analysisRequirements)) {
      fail(
         'MISSING_APPROVED_ANALYSIS_REQUIREMENTS',
         'compose_ootb requires analysisRequirements with explicit approval before generation.'
      );
   }
   ensureObject(analysisRequirements.approval, 'analysisRequirements.approval');
   const approvalStatus = toNonEmptyTrimmedString(analysisRequirements.approval.status);
   if (approvalStatus !== 'approved') {
      fail(
         'MISSING_APPROVED_ANALYSIS_REQUIREMENTS',
         `analysisRequirements.approval.status must be 'approved' for compose_ootb (found '${analysisRequirements.approval?.status}').`
      );
   }
   ensureString(analysisRequirements.approval.approvedBy, 'analysisRequirements.approval.approvedBy');
   ensureString(analysisRequirements.approval.approvedAt, 'analysisRequirements.approval.approvedAt');
   ensureObject(analysisRequirements.dataset, 'analysisRequirements.dataset');
   const requirementsDataModel = canonicalizeSubjectAreaToken(analysisRequirements.dataset.selectedDataModel);
   if (requirementsDataModel !== selectedDataModel) {
      fail(
         'MISSING_APPROVED_ANALYSIS_REQUIREMENTS',
         `analysisRequirements.dataset.selectedDataModel '${requirementsDataModel}' must match adapterPayload.discovery.selectedDataModel '${selectedDataModel}'.`
      );
   }
   ensureString(analysisRequirements.dataset.discoveryMethod, 'analysisRequirements.dataset.discoveryMethod');
   if (!['search_catalog', 'discover_data'].includes(analysisRequirements.dataset.discoveryMethod)) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `analysisRequirements.dataset.discoveryMethod '${analysisRequirements.dataset.discoveryMethod}' is not supported.`
      );
   }
   ensureArray(analysisRequirements.canvases, 'analysisRequirements.canvases');
   if (analysisRequirements.canvases.length === 0) {
      fail('MISSING_APPROVED_ANALYSIS_REQUIREMENTS', 'analysisRequirements.canvases must not be empty for compose_ootb.');
   }

   const analysisShapeCanvasIndex = buildCanvasViewIDIndex(analysisShape.canvases, 'analysisShape.canvases');
   const requirementsCanvasIndex = buildCanvasViewIDIndex(analysisRequirements.canvases, 'analysisRequirements.canvases');

   for (const [canvasID, requirementViewIDs] of requirementsCanvasIndex.entries()) {
      if (!analysisShapeCanvasIndex.has(canvasID)) {
         fail(
            'MISSING_APPROVED_ANALYSIS_REQUIREMENTS',
            `analysisRequirements references canvas '${canvasID}' that is missing in analysisShape.canvases.`
         );
      }
      const analysisShapeViewIDs = analysisShapeCanvasIndex.get(canvasID);
      for (const requirementViewID of requirementViewIDs) {
         if (!analysisShapeViewIDs.has(requirementViewID)) {
            fail(
               'MISSING_APPROVED_ANALYSIS_REQUIREMENTS',
               `analysisRequirements references view '${requirementViewID}' in canvas '${canvasID}' that is missing in analysisShape.`
            );
         }
      }
   }

   for (const [canvasIndex, canvas] of analysisShape.canvases.entries()) {
      for (const [viewIndex, view] of canvas.views.entries()) {
         validateComposeViewPlanningFields(
            view,
            `analysisShape.canvases[${canvasIndex}].views[${viewIndex}]`,
            {
               enforceFilterObjectSchema: false
            }
         );
      }
   }
   for (const [canvasIndex, canvas] of analysisRequirements.canvases.entries()) {
      for (const [viewIndex, view] of canvas.views.entries()) {
         ensureObject(view, `analysisRequirements.canvases[${canvasIndex}].views[${viewIndex}]`);
         validateComposeViewPlanningFields(
            view,
            `analysisRequirements.canvases[${canvasIndex}].views[${viewIndex}]`,
            {
               enforceFilterObjectSchema: true,
               filterPointerPrefix: toJsonPointer(['analysisRequirements', 'canvases', canvasIndex, 'views', viewIndex, 'filters']),
               composeFilterValidationOptions: {
                  mode: composeFilterToleranceMode,
                  toleranceState: composeFilterToleranceState,
                  resolveDefaultForFilter: composeFilterDefaultResolver
               }
            }
         );
      }
   }
}

function summarizeFilterPlanning(analysisRequirements) {
   const summary = {
      appliedCount: 0,
      consideredNotGroundedCount: 0,
      rejectedConflictCount: 0,
      rejectedMissingFieldCount: 0
   };
   if (!isPlainObject(analysisRequirements) || !Array.isArray(analysisRequirements.canvases)) {
      return summary;
   }
   for (const canvas of analysisRequirements.canvases) {
      const views = Array.isArray(canvas?.views) ? canvas.views : [];
      for (const view of views) {
         const filters = Array.isArray(view?.filters) ? view.filters : [];
         for (const filter of filters) {
            const outcomeToken = toNonEmptyTrimmedString(
               filter?.planningOutcome
               || filter?.status
               || filter?.resolution
               || filter?.disposition
            )?.toLowerCase();
            if (outcomeToken === 'considered_not_grounded') {
               summary.consideredNotGroundedCount += 1;
            } else if (outcomeToken === 'rejected_conflict') {
               summary.rejectedConflictCount += 1;
            } else if (outcomeToken === 'rejected_missing_field') {
               summary.rejectedMissingFieldCount += 1;
            } else {
               summary.appliedCount += 1;
            }
         }
      }
   }
   return summary;
}

function summarizeComposeFilterTolerance(seedSummary) {
   const autoFilledFilterFields = Array.isArray(seedSummary?.autoFilledFilterFields)
      ? seedSummary.autoFilledFilterFields
      : [];
   const noAutoFillReasons = Array.isArray(seedSummary?.noAutoFillReasons)
      ? seedSummary.noAutoFillReasons
      : [];
   const reasonCounts = {};
   for (const reason of noAutoFillReasons) {
      const normalizedReason = toNonEmptyTrimmedString(reason) || 'unspecified';
      reasonCounts[normalizedReason] = (reasonCounts[normalizedReason] || 0) + 1;
   }
   return {
      mode: toNonEmptyTrimmedString(seedSummary?.mode) || 'strict',
      enabled: seedSummary?.enabled === true,
      autoFillCount: autoFilledFilterFields.length,
      autoFilledFilterFields,
      noAutoFillReasons: reasonCounts
   };
}

function extractSemanticRoleOverridesFromPlanning(canvases, selectedDataModel) {
   const overrides = {};
   if (!Array.isArray(canvases)) {
      return overrides;
   }
   for (const canvas of canvases) {
      const views = Array.isArray(canvas?.views) ? canvas.views : [];
      for (const view of views) {
         const bindings = isPlainObject(view?.bindings) ? view.bindings : null;
         if (!bindings) {
            continue;
         }
         for (const [rawRole, rawBinding] of Object.entries(bindings)) {
            const normalizedRole = normalizeSemanticRoleName(rawRole);
            if (!normalizedRole || overrides[normalizedRole]) {
               continue;
            }
            const expressionCandidate = toNonEmptyTrimmedString(rawBinding)
               || toNonEmptyTrimmedString(rawBinding?.expression)
               || null;
            if (!expressionCandidate) {
               continue;
            }
            const parsed = parseDirectColumnExpression(expressionCandidate);
            if (!parsed || parsed.subjectAreaToken !== selectedDataModel) {
               continue;
            }
            overrides[normalizedRole] = {
               expression: expressionCandidate,
               reason: `analysis_requirements_binding:${toNonEmptyTrimmedString(view?.id) || 'unknown_view'}`
            };
         }
      }
   }
   return overrides;
}

function summarizeWorkbookComponentGraph(workbookJson) {
   const filterCollections = Array.isArray(workbookJson?.filterControlCollections?.children)
      ? workbookJson.filterControlCollections.children
      : [];
   const filterControlCount = filterCollections.reduce((count, collection) => {
      const controls = Array.isArray(collection?.filterControls?.children)
         ? collection.filterControls.children.length
         : 0;
      return count + controls;
   }, 0);
   const parameterCount = Array.isArray(workbookJson?.parameters?.settings)
      ? workbookJson.parameters.settings.length
      : 0;
   const dataActionCount = Array.isArray(workbookJson?.dataActions)
      ? workbookJson.dataActions.length
      : 0;
   const eventWiringCount = Array.isArray(workbookJson?.eventWiring?.children)
      ? workbookJson.eventWiring.children.length
      : 0;
   const interactionCount = Array.isArray(workbookJson?.interactions?.children)
      ? workbookJson.interactions.children.length
      : 0;
   return {
      filterControlCollectionCount: filterCollections.length,
      filterControlCount,
      parameterCount,
      dataActionCount,
      eventWiringCount,
      interactionCount
   };
}

function isXsaSubjectAreaExpression(token) {
   return /^XSA\([^)]*\)$/i.test(token);
}

function tryCanonicalizeSubjectAreaToken(rawToken) {
   const normalized = toNonEmptyTrimmedString(rawToken);
   if (!normalized) {
      return null;
   }
   if (isXsaSubjectAreaExpression(normalized)) {
      return normalized;
   }
   if (normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2) {
      return normalized;
   }
   let unwrapped = normalized;
   if (normalized.startsWith('\'') && normalized.endsWith('\'') && normalized.length >= 2) {
      unwrapped = normalized.slice(1, -1).trim();
   }
   if (!unwrapped) {
      return null;
   }
   const escaped = unwrapped.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
   return `"${escaped}"`;
}

function canonicalizeSubjectAreaToken(rawToken) {
   const canonicalToken = tryCanonicalizeSubjectAreaToken(rawToken);
   if (!canonicalToken) {
      fail('INVALID_ADAPTER_CONTRACT', 'adapterPayload.discovery.selectedDataModel must not be empty after subject-area token normalization.');
   }
   return canonicalToken;
}

function extractDiscoverySubjectAreaToken(discoveryValue) {
   if (typeof discoveryValue === 'string') {
      return tryCanonicalizeSubjectAreaToken(discoveryValue);
   }
   if (!isPlainObject(discoveryValue)) {
      return null;
   }
   const candidateFields = [
      'subjectAreaOrXsaExpr',
      'subjectArea',
      'xsaExpr',
      'name',
      'datamodelName',
      'displayName'
   ];
   for (const fieldName of candidateFields) {
      const token = tryCanonicalizeSubjectAreaToken(discoveryValue[fieldName]);
      if (token) {
         return token;
      }
   }
   return null;
}

function validateSelectedDataModelAgainstDiscovery(selectedDataModel, adapterDiscovery) {
   const candidateDataModels = Array.isArray(adapterDiscovery?.candidateDataModels)
      ? adapterDiscovery.candidateDataModels
      : [];
   const discoveryCandidateTokens = new Set();
   for (const candidate of candidateDataModels) {
      const token = extractDiscoverySubjectAreaToken(candidate);
      if (token) {
         discoveryCandidateTokens.add(token);
      }
   }
   if (discoveryCandidateTokens.size > 0 && !discoveryCandidateTokens.has(selectedDataModel)) {
      const candidateList = Array.from(discoveryCandidateTokens).join(', ');
      fail(
         'INVALID_ADAPTER_CONTRACT',
         `adapterPayload.discovery.selectedDataModel '${selectedDataModel}' does not match discovery.candidateDataModels. ` +
         `Use an exact discovered subject-area token from candidateDataModels. Available: ${candidateList}.`
      );
   }

   if (adapterDiscovery && Object.prototype.hasOwnProperty.call(adapterDiscovery, 'datasource')) {
      const datasourceToken = extractDiscoverySubjectAreaToken(adapterDiscovery.datasource);
      if (datasourceToken && datasourceToken !== selectedDataModel) {
         fail(
            'INVALID_ADAPTER_CONTRACT',
            `adapterPayload.discovery.datasource resolves to '${datasourceToken}' but selectedDataModel is '${selectedDataModel}'. ` +
            'Use one authoritative subject-area token for discovery.selectedDataModel and discovery.datasource.'
         );
      }
   }
}

function parseDescribeColumnDirectExpression(describeColumn) {
   if (!isPlainObject(describeColumn)) {
      return null;
   }
   const directExpressionCandidates = [
      describeColumn.fullyQualifiedName,
      describeColumn.fullyQualifiedColumnName,
      describeColumn.fullyQualifiedColumn,
      describeColumn.logicalSql,
      describeColumn.expression,
      describeColumn.formula,
      describeColumn.columnFormula?.expr?.expression
   ];
   for (const candidate of directExpressionCandidates) {
      const parsed = parseDirectColumnExpression(candidate);
      if (parsed) {
         return parsed;
      }
   }
   return null;
}

function validateDescribeColumnsSelectedDataModelConsistency(describeColumns, selectedDataModel) {
   const mismatches = [];
   const columns = Array.isArray(describeColumns) ? describeColumns : [];
   for (let index = 0; index < columns.length; index += 1) {
      const describeColumn = columns[index];
      const parsedExpression = parseDescribeColumnDirectExpression(describeColumn);
      if (!parsedExpression || parsedExpression.subjectAreaToken === selectedDataModel) {
         continue;
      }
      const columnLabel = toNonEmptyTrimmedString(
         describeColumn?.name
         || describeColumn?.displayName
         || describeColumn?.columnName
      ) || `index_${index}`;
      mismatches.push(`column '${columnLabel}' uses '${parsedExpression.subjectAreaToken}'`);
      if (mismatches.length >= 5) {
         break;
      }
   }
   if (mismatches.length > 0) {
      fail(
         'INVALID_ADAPTER_CONTRACT',
         `adapterPayload.describe.columns contains expressions that do not match selectedDataModel '${selectedDataModel}': ` +
         `${mismatches.join('; ')}. Use exact search_catalog-selected subject area token.`
      );
   }
}

function unescapeWorkbookIdentifier(value) {
   if (typeof value !== 'string') {
      return '';
   }
   return value.replace(/\\(["\\])/g, '$1');
}

function escapeWorkbookIdentifier(value) {
   return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function parseDirectColumnExpression(expression) {
   const normalized = toNonEmptyTrimmedString(expression);
   if (!normalized) {
      return null;
   }
   const quotedReferenceMatch = normalized.match(
      /^(XSA\([^)]*\)|"(?:[^"\\]|\\.)+")\."((?:[^"\\]|\\.)+)"\."((?:[^"\\]|\\.)+)"$/i
   );
   if (quotedReferenceMatch) {
      return {
         subjectAreaToken: quotedReferenceMatch[1],
         tableName: unescapeWorkbookIdentifier(quotedReferenceMatch[2]),
         columnName: unescapeWorkbookIdentifier(quotedReferenceMatch[3])
      };
   }
   return null;
}

function buildDirectColumnExpression(subjectAreaToken, tableName, columnName) {
   return `${subjectAreaToken}."${escapeWorkbookIdentifier(tableName)}"."${escapeWorkbookIdentifier(columnName)}"`;
}

function normalizeTextTokens(value) {
   if (typeof value !== 'string') {
      return [];
   }
   return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
}

function inferColumnClassFromID(columnID) {
   const normalized = toNonEmptyTrimmedString(columnID);
   if (!normalized) {
      return null;
   }
   if (normalized.startsWith('mea_')) {
      return 'measure';
   }
   if (normalized.startsWith('time_')) {
      return 'temporal';
   }
   return 'dimension';
}

function isTemporalDataType(dataTypeValue) {
   return /(DATE|TIME|TIMESTAMP)/.test(dataTypeValue);
}

function isNumericDataType(dataTypeValue) {
   return /(NUMBER|NUMERIC|DECIMAL|DOUBLE|FLOAT|REAL|INT|INTEGER|BIGINT|SMALLINT)/.test(dataTypeValue);
}

function inferDescribeColumnClass(describeColumn, parsedExpression) {
   const typeValue = toNonEmptyTrimmedString(describeColumn?.type)?.toUpperCase() || '';
   const columnTypeValue = toNonEmptyTrimmedString(describeColumn?.columnType)?.toUpperCase() || '';
   const dataTypeValue = toNonEmptyTrimmedString(describeColumn?.dataType)?.toUpperCase() || '';
   const aggregationValue = toNonEmptyTrimmedString(
      describeColumn?.aggregation
      || describeColumn?.defaultAggregation
      || describeColumn?.aggRule
   )?.toUpperCase() || '';

   if (typeValue.includes('MEASURE') || columnTypeValue.includes('MEASURE')) {
      return 'measure';
   }
   if (typeValue.includes('ATTRIBUTE') || columnTypeValue.includes('ATTRIBUTE')) {
      return isTemporalDataType(dataTypeValue) ? 'temporal' : 'dimension';
   }
   if (isTemporalDataType(dataTypeValue)) {
      return 'temporal';
   }
   if (aggregationValue && !['NONE', 'NA', 'N/A'].includes(aggregationValue)) {
      return 'measure';
   }
   if (isNumericDataType(dataTypeValue)) {
      return 'measure';
   }

   const nameSignals = [
      describeColumn?.name,
      describeColumn?.displayName,
      describeColumn?.columnName,
      parsedExpression?.tableName,
      parsedExpression?.columnName
   ].flatMap((value) => normalizeTextTokens(value));
   if (nameSignals.includes('date') || nameSignals.includes('month') || nameSignals.includes('year')
      || nameSignals.includes('quarter') || nameSignals.includes('week') || nameSignals.includes('day')) {
      return 'temporal';
   }
   return 'dimension';
}

function normalizeDescribeColumnDescriptor(describeColumn, selectedDataModel) {
   if (!isPlainObject(describeColumn)) {
      return null;
   }

   const directExpressionCandidates = [
      describeColumn.fullyQualifiedName,
      describeColumn.fullyQualifiedColumnName,
      describeColumn.fullyQualifiedColumn,
      describeColumn.logicalSql,
      describeColumn.expression,
      describeColumn.formula,
      describeColumn.columnFormula?.expr?.expression
   ];
   let parsedExpression = null;
   for (const candidate of directExpressionCandidates) {
      const parsed = parseDirectColumnExpression(candidate);
      if (parsed) {
         parsedExpression = parsed;
         break;
      }
   }
   if (!parsedExpression) {
      const tableName = toNonEmptyTrimmedString(
         describeColumn.tableName
         || describeColumn.table
         || describeColumn.logicalTable
         || describeColumn.folder
         || describeColumn.subjectAreaTable
      );
      const columnName = toNonEmptyTrimmedString(
         describeColumn.name
         || describeColumn.columnName
         || describeColumn.displayName
      );
      if (!tableName || !columnName) {
         return null;
      }
      parsedExpression = {
         subjectAreaToken: selectedDataModel,
         tableName,
         columnName
      };
   }

   const directExpression = buildDirectColumnExpression(
      selectedDataModel,
      parsedExpression.tableName,
      parsedExpression.columnName
   );
   const columnClass = inferDescribeColumnClass(describeColumn, parsedExpression);
   const displayName = toNonEmptyTrimmedString(describeColumn.displayName)
      || toNonEmptyTrimmedString(describeColumn.name)
      || parsedExpression.columnName;
   const dataType = toNonEmptyTrimmedString(describeColumn?.dataType)?.toUpperCase() || '';
   const aggregation = toNonEmptyTrimmedString(
      describeColumn?.aggregation
      || describeColumn?.defaultAggregation
      || describeColumn?.aggRule
   )?.toUpperCase() || '';
   const tokens = new Set([
      ...normalizeTextTokens(displayName),
      ...normalizeTextTokens(parsedExpression.columnName),
      ...normalizeTextTokens(parsedExpression.tableName),
      ...normalizeTextTokens(describeColumn?.folder),
      ...normalizeTextTokens(describeColumn?.tableName),
      ...normalizeTextTokens(describeColumn?.columnName),
      ...normalizeTextTokens(describeColumn?.columnType),
      ...normalizeTextTokens(describeColumn?.type)
   ]);
   return {
      directExpression,
      columnClass,
      displayName,
      tableName: parsedExpression.tableName,
      columnName: parsedExpression.columnName,
      dataType,
      aggregation,
      isTemporalDataType: isTemporalDataType(dataType),
      isNumericDataType: isNumericDataType(dataType),
      tokens
   };
}

function normalizeCompactToken(value) {
   return toNonEmptyTrimmedString(value)
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      || null;
}

function normalizePlanningAggregation(rawValue, fieldPath) {
   const value = toNonEmptyTrimmedString(rawValue);
   if (!value) {
      return null;
   }
   const token = normalizeCompactToken(value);
   const aggRule = PLANNING_AGGREGATION_RULES.get(token);
   if (!aggRule) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath} '${value}' is unsupported. Use a source-backed aggregation such as SUM, AVG, COUNT, COUNT DISTINCT, MIN, MAX, MEDIAN, FIRST, or LAST.`
      );
   }
   return aggRule;
}

function validatePlanningAggregationForSource(aggregation, descriptor, fieldPath) {
   if (!aggregation || ['default', 'none'].includes(aggregation)) {
      return aggregation;
   }
   const sourceAggregation = PLANNING_AGGREGATION_RULES.get(normalizeCompactToken(descriptor?.aggregation));
   if (!sourceAggregation || sourceAggregation !== aggregation) {
      fail(
         'UNSUPPORTED_PLANNING_AGGREGATION_OVERRIDE',
         `${fieldPath} requests '${aggregation}', but the discovered source aggregation is '${descriptor?.aggregation || 'unspecified'}'. Direct-source aggregation overrides require derived criteria-column and aggregationColumnMap synthesis, which compose_ootb does not currently materialize.`
      );
   }
   return aggregation;
}

function normalizePlanningFormat(rawValue, fieldPath) {
   if (rawValue === undefined || rawValue === null) {
      return null;
   }
   if (!isPlainObject(rawValue)) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath} must use the structured number-format object accepted by request.numberFormatting; free-form format strings are not supported.`
      );
   }
   return deepClone(rawValue);
}

function resolveCompactViewPluginType(view, fieldPath) {
   const explicitPluginType = toNonEmptyTrimmedString(view?.pluginType);
   if (explicitPluginType) {
      return explicitPluginType;
   }
   const compactType = normalizeCompactToken(view?.type || view?.viewType || view?.visualization);
   if (!compactType) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath}.pluginType is required when compact view type is not provided.`
      );
   }
   const pluginType = COMPACT_VIEW_TYPE_PLUGIN_TYPES[compactType];
   if (!pluginType) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath}.type '${view?.type || view?.viewType || view?.visualization}' is not a supported compact analysisRequirements view type. ` +
         'Provide an exact pluginType for advanced visualizations.'
      );
   }
   return pluginType;
}

function copyPlanningFieldIfMissing(target, source, fieldName) {
   if (target[fieldName] === undefined && source[fieldName] !== undefined) {
      target[fieldName] = deepClone(source[fieldName]);
   }
}

function bootstrapAnalysisRequirementsPlanning(requestPayload) {
   const analysisRequirements = isPlainObject(requestPayload?.analysisRequirements)
      ? requestPayload.analysisRequirements
      : null;
   if (!analysisRequirements) {
      return;
   }

   if (!isPlainObject(requestPayload.workbook) && isPlainObject(analysisRequirements.workbook)) {
      requestPayload.workbook = {};
   }
   if (isPlainObject(requestPayload.workbook) && isPlainObject(analysisRequirements.workbook)) {
      copyPlanningFieldIfMissing(requestPayload.workbook, analysisRequirements.workbook, 'name');
      copyPlanningFieldIfMissing(requestPayload.workbook, analysisRequirements.workbook, 'description');
   }

   if (!isPlainObject(requestPayload.analysisShape)) {
      requestPayload.analysisShape = {};
   }
   if (!Array.isArray(requestPayload.analysisShape.canvases) && Array.isArray(analysisRequirements.canvases)) {
      requestPayload.analysisShape.canvases = [];
   }
   if (requestPayload.analysisShape.filterMode === undefined && analysisRequirements.filterMode !== undefined) {
      requestPayload.analysisShape.filterMode = analysisRequirements.filterMode;
   }
   if (requestPayload.analysisShape.filterModeRequested === undefined && analysisRequirements.filterModeRequested !== undefined) {
      requestPayload.analysisShape.filterModeRequested = analysisRequirements.filterModeRequested;
   }

   const shapeCanvases = Array.isArray(requestPayload.analysisShape.canvases)
      ? requestPayload.analysisShape.canvases
      : [];
   const shapeCanvasByID = new Map(
      shapeCanvases
         .filter((canvas) => isPlainObject(canvas) && toNonEmptyTrimmedString(canvas.id))
         .map((canvas) => [toNonEmptyTrimmedString(canvas.id), canvas])
   );
   const requirementCanvases = Array.isArray(analysisRequirements.canvases)
      ? analysisRequirements.canvases
      : [];

   for (const [canvasIndex, requirementCanvas] of requirementCanvases.entries()) {
      if (!isPlainObject(requirementCanvas)) {
         continue;
      }
      const canvasID = toNonEmptyTrimmedString(requirementCanvas.id);
      if (!canvasID) {
         continue;
      }
      let shapeCanvas = shapeCanvasByID.get(canvasID);
      if (!shapeCanvas) {
         shapeCanvas = {
            id: canvasID,
            views: []
         };
         shapeCanvases.push(shapeCanvas);
         shapeCanvasByID.set(canvasID, shapeCanvas);
      }
      copyPlanningFieldIfMissing(shapeCanvas, requirementCanvas, 'name');
      copyPlanningFieldIfMissing(shapeCanvas, requirementCanvas, 'title');
      copyPlanningFieldIfMissing(shapeCanvas, requirementCanvas, 'layout');

      if (!Array.isArray(shapeCanvas.views)) {
         shapeCanvas.views = [];
      }
      const shapeViewByID = new Map(
         shapeCanvas.views
            .filter((view) => isPlainObject(view) && toNonEmptyTrimmedString(view.id))
            .map((view) => [toNonEmptyTrimmedString(view.id), view])
      );
      const requirementViews = Array.isArray(requirementCanvas.views) ? requirementCanvas.views : [];
      for (const [viewIndex, requirementView] of requirementViews.entries()) {
         if (!isPlainObject(requirementView)) {
            continue;
         }
         const viewID = toNonEmptyTrimmedString(requirementView.id);
         if (!viewID) {
            continue;
         }
         let shapeView = shapeViewByID.get(viewID);
         if (!shapeView) {
            shapeView = { id: viewID };
            shapeCanvas.views.push(shapeView);
            shapeViewByID.set(viewID, shapeView);
         }
         if (shapeView.pluginType === undefined) {
            shapeView.pluginType = resolveCompactViewPluginType(
               requirementView,
               `analysisRequirements.canvases[${canvasIndex}].views[${viewIndex}]`
            );
         }
         for (const fieldName of ['purpose', 'grain', 'bindings', 'labels', 'filters', 'calculations', 'sort', 'interactions']) {
            copyPlanningFieldIfMissing(shapeView, requirementView, fieldName);
         }
      }
   }
   requestPayload.analysisShape.canvases = shapeCanvases;
}

function normalizeAnalysisRequirementDatasourceAliases(analysisRequirements) {
   const datasourceByAlias = new Map();
   const rawDatasources = analysisRequirements?.datasources;
   const datasourceEntries = Array.isArray(rawDatasources)
      ? rawDatasources
      : (isPlainObject(rawDatasources)
         ? Object.entries(rawDatasources).map(([id, value]) => isPlainObject(value) ? { id, ...value } : { id, table: value })
         : []);
   for (const datasource of datasourceEntries) {
      if (!isPlainObject(datasource)) {
         continue;
      }
      const id = toNonEmptyTrimmedString(datasource.id || datasource.name || datasource.alias);
      if (!id) {
         continue;
      }
      const tableName = toNonEmptyTrimmedString(datasource.table || datasource.tableName || datasource.logicalTable || datasource.name);
      datasourceByAlias.set(id, {
         id,
         tableName
      });
      const compactID = normalizeCompactToken(id);
      if (compactID) {
         datasourceByAlias.set(compactID, {
            id,
            tableName
         });
      }
   }
   return datasourceByAlias;
}

function buildDescribeDescriptorLookup(describeDescriptors) {
   const byKey = new Map();
   for (const descriptor of describeDescriptors) {
      if (!descriptor) {
         continue;
      }
      const keys = [
         descriptor.displayName,
         descriptor.columnName,
         `${descriptor.tableName}.${descriptor.columnName}`,
         `${descriptor.tableName}.${descriptor.displayName}`,
         descriptor.directExpression
      ];
      for (const key of keys) {
         const compact = normalizeCompactToken(key);
         if (compact && !byKey.has(compact)) {
            byKey.set(compact, descriptor);
         }
      }
   }
   return byKey;
}

function resolveSourceReferenceToExpression(source, selectedDataModel, datasourceByAlias, descriptorLookup, fieldPath) {
   const sourceText = toNonEmptyTrimmedString(source);
   if (!sourceText) {
      return null;
   }
   const directParsed = parseDirectColumnExpression(sourceText);
   if (directParsed) {
      if (directParsed.subjectAreaToken !== selectedDataModel) {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${fieldPath} references subject area '${directParsed.subjectAreaToken}' but selectedDataModel is '${selectedDataModel}'.`
         );
      }
      return buildDirectColumnExpression(selectedDataModel, directParsed.tableName, directParsed.columnName);
   }

   const descriptor = descriptorLookup.get(normalizeCompactToken(sourceText));
   if (descriptor) {
      return descriptor.directExpression;
   }

   const dotIndex = sourceText.indexOf('.');
   if (dotIndex > 0 && dotIndex < sourceText.length - 1) {
      const left = sourceText.slice(0, dotIndex).trim();
      const right = sourceText.slice(dotIndex + 1).trim();
      const datasource = datasourceByAlias.get(left) || datasourceByAlias.get(normalizeCompactToken(left));
      const tableName = datasource?.tableName || left;
      const candidateExpression = buildDirectColumnExpression(selectedDataModel, tableName, right);
      const describedColumn = descriptorLookup.get(normalizeCompactToken(candidateExpression)) ||
         descriptorLookup.get(normalizeCompactToken(`${tableName}.${right}`));
      if (describedColumn) {
         return describedColumn.directExpression;
      }
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath} source '${sourceText}' does not match a column returned by adapterPayload.describe.columns.`
      );
   }

   return null;
}

function normalizeAnalysisRequirementFields(analysisRequirements, selectedDataModel, describeDescriptors) {
   const datasourceByAlias = normalizeAnalysisRequirementDatasourceAliases(analysisRequirements);
   const descriptorLookup = buildDescribeDescriptorLookup(describeDescriptors);
   const fieldByAlias = new Map();
   const rawFields = analysisRequirements?.fields;
   const fieldEntries = Array.isArray(rawFields)
      ? rawFields.map((value) => [value?.id || value?.name || value?.alias, value])
      : (isPlainObject(rawFields) ? Object.entries(rawFields) : []);

   for (const [rawAlias, rawSpec] of fieldEntries) {
      const alias = toNonEmptyTrimmedString(rawAlias);
      if (!alias) {
         continue;
      }
      const fieldPath = `analysisRequirements.fields.${alias}`;
      const spec = isPlainObject(rawSpec)
         ? rawSpec
         : { source: rawSpec };
      const expression = resolveSourceReferenceToExpression(
         spec.expression || spec.source || spec.column || spec.field,
         selectedDataModel,
         datasourceByAlias,
         descriptorLookup,
         fieldPath
      );
      const calculationExpression = expression
         ? null
         : toNonEmptyTrimmedString(spec.expression || spec.formula || spec.calculation);
      const descriptor = expression ? descriptorLookup.get(normalizeCompactToken(expression)) : null;
      const aggregation = normalizePlanningAggregation(spec.aggregation, `${fieldPath}.aggregation`);
      const normalized = {
         alias,
         expression,
         calculationExpression,
         type: normalizeCompactToken(spec.type || spec.columnType || spec.kind),
         aggregation: validatePlanningAggregationForSource(aggregation, descriptor, `${fieldPath}.aggregation`),
         format: normalizePlanningFormat(spec.format, `${fieldPath}.format`),
         role: normalizeSemanticRoleName(spec.role),
         columnID: toNonEmptyTrimmedString(spec.columnID)
      };
      fieldByAlias.set(alias, normalized);
      const compactAlias = normalizeCompactToken(alias);
      if (compactAlias) {
         fieldByAlias.set(compactAlias, normalized);
      }
   }

   return {
      fieldByAlias,
      datasourceByAlias,
      descriptorLookup
   };
}

function resolvePlanningFieldReference(rawReference, context, fieldPath, options = {}) {
   const allowCalculation = options.allowCalculation === true;
   const targetRole = normalizeSemanticRoleName(options.targetRole);
   const referenceSpec = isPlainObject(rawReference) ? rawReference : null;
   let reference = rawReference;
   if (isPlainObject(reference) && reference.field !== undefined) {
      reference = reference.field;
   }
   if (isPlainObject(reference) && (reference.expression !== undefined || reference.source !== undefined || reference.column !== undefined)) {
      const expression = resolveSourceReferenceToExpression(
         reference.expression || reference.source || reference.column,
         context.selectedDataModel,
         context.datasourceByAlias,
         context.descriptorLookup,
         fieldPath
      );
      if (expression) {
         const aggregation = normalizePlanningAggregation(reference.aggregation, `${fieldPath}.aggregation`);
         const descriptor = context.descriptorLookup.get(normalizeCompactToken(expression));
         return {
            expression,
            type: normalizeCompactToken(reference.type || reference.columnType || reference.kind),
            role: normalizeSemanticRoleName(reference.role) || targetRole,
            columnID: toNonEmptyTrimmedString(reference.columnID) || (targetRole ? PLANNING_ROLE_TO_CANONICAL_COLUMN_ID[targetRole] : null),
            aggregation: validatePlanningAggregationForSource(aggregation, descriptor, `${fieldPath}.aggregation`),
            format: normalizePlanningFormat(reference.format, `${fieldPath}.format`)
         };
      }
   }

   const referenceText = toNonEmptyTrimmedString(reference);
   if (!referenceText) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath} must reference a non-empty field alias or direct expression.`);
   }
   const aliasEntry = context.fieldByAlias.get(referenceText) || context.fieldByAlias.get(normalizeCompactToken(referenceText));
   if (aliasEntry) {
      if (aliasEntry.expression) {
         const requestedAggregation = referenceSpec?.aggregation !== undefined
            ? normalizePlanningAggregation(referenceSpec.aggregation, `${fieldPath}.aggregation`)
            : (aliasEntry.aggregation || null);
         const descriptor = context.descriptorLookup.get(normalizeCompactToken(aliasEntry.expression));
         return {
            expression: aliasEntry.expression,
            type: normalizeCompactToken(referenceSpec?.type || referenceSpec?.columnType || referenceSpec?.kind) || aliasEntry.type,
            role: normalizeSemanticRoleName(referenceSpec?.role) || aliasEntry.role || targetRole,
            columnID: toNonEmptyTrimmedString(referenceSpec?.columnID) || aliasEntry.columnID || (targetRole ? PLANNING_ROLE_TO_CANONICAL_COLUMN_ID[targetRole] : null),
            aggregation: validatePlanningAggregationForSource(requestedAggregation, descriptor, `${fieldPath}.aggregation`),
            format: referenceSpec?.format !== undefined
               ? normalizePlanningFormat(referenceSpec.format, `${fieldPath}.format`)
               : (aliasEntry.format ? deepClone(aliasEntry.format) : null)
         };
      }
      if (aliasEntry.calculationExpression && allowCalculation) {
         return {
            calculationExpression: aliasEntry.calculationExpression,
            type: 'calculation',
            role: aliasEntry.role || targetRole,
            columnID: aliasEntry.columnID || null
         };
      }
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath} references calculation alias '${aliasEntry.alias}', but compact calculation aliases cannot be bound to a visualization without an explicit advanced calculated criteria column.`
      );
   }

   const expression = resolveSourceReferenceToExpression(
      referenceText,
      context.selectedDataModel,
      context.datasourceByAlias,
      context.descriptorLookup,
      fieldPath
   );
   if (expression) {
      const aggregation = normalizePlanningAggregation(referenceSpec?.aggregation, `${fieldPath}.aggregation`);
      const descriptor = context.descriptorLookup.get(normalizeCompactToken(expression));
      return {
         expression,
         type: normalizeCompactToken(referenceSpec?.type || referenceSpec?.columnType || referenceSpec?.kind),
         role: normalizeSemanticRoleName(referenceSpec?.role) || targetRole,
         columnID: toNonEmptyTrimmedString(referenceSpec?.columnID) || (targetRole ? PLANNING_ROLE_TO_CANONICAL_COLUMN_ID[targetRole] : null),
         aggregation: validatePlanningAggregationForSource(aggregation, descriptor, `${fieldPath}.aggregation`),
         format: normalizePlanningFormat(referenceSpec?.format, `${fieldPath}.format`)
      };
   }

   fail(
      'INVALID_REQUEST_CONTRACT',
      `${fieldPath} references unresolved analysisRequirements field '${referenceText}'. Define it in analysisRequirements.fields or use a direct subjectArea.table.column expression.`
   );
}

function mergePlanningBinding(bindings, role, rawReference, context, fieldPath) {
   const normalizedRole = normalizeSemanticRoleName(role);
   if (!normalizedRole || rawReference === undefined || rawReference === null) {
      return;
   }
   const resolved = resolvePlanningFieldReference(rawReference, context, fieldPath, { targetRole: normalizedRole });
   const nextBinding = {
      expression: resolved.expression,
      ...(isPlainObject(rawReference) && toNonEmptyTrimmedString(rawReference.columnID)
         ? { columnID: toNonEmptyTrimmedString(rawReference.columnID) }
         : {}),
      ...(resolved.aggregation ? { aggregation: resolved.aggregation } : {}),
      ...(resolved.format ? { format: deepClone(resolved.format) } : {})
   };
   const existing = bindings[normalizedRole];
   const existingExpression = toNonEmptyTrimmedString(existing)
      || toNonEmptyTrimmedString(existing?.expression);
   if (existingExpression && existingExpression !== nextBinding.expression) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath} conflicts with explicit binding '${normalizedRole}'. Remove the shorthand field or make both expressions match.`
      );
   }
   if (isPlainObject(existing)) {
      const existingColumnID = toNonEmptyTrimmedString(existing.columnID);
      const nextColumnID = toNonEmptyTrimmedString(nextBinding.columnID);
      const existingAggregation = toNonEmptyTrimmedString(existing.aggregation);
      const nextAggregation = toNonEmptyTrimmedString(nextBinding.aggregation);
      if ((existingColumnID && nextColumnID && existingColumnID !== nextColumnID)
         || (existingAggregation && nextAggregation && existingAggregation !== nextAggregation)
         || (isPlainObject(existing.format) && isPlainObject(nextBinding.format)
            && !deepEqualsJsonValue(existing.format, nextBinding.format))) {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${fieldPath} conflicts with explicit binding '${normalizedRole}' metadata. Remove the shorthand field or make both binding definitions match.`
         );
      }
   }
   bindings[normalizedRole] = isPlainObject(existing)
      ? { ...nextBinding, ...existing, expression: nextBinding.expression }
      : nextBinding;
}

function normalizePivotBindingTopology(view, context, fieldPath) {
   const normalizeEdge = (edgeName, defaultColumnClass, roles) => {
      const rawEntries = view[edgeName];
      if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
         fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.${edgeName} must be a non-empty array for pivot views.`);
      }
      return rawEntries.map((rawEntry, index) => {
         const targetRole = roles[index] || null;
         const resolved = resolvePlanningFieldReference(rawEntry, context, `${fieldPath}.${edgeName}[${index}]`, {
            targetRole
         });
         const resolvedType = normalizeCompactToken(resolved.type);
         const columnClass = resolvedType === 'measure'
            ? 'measure'
            : (resolvedType === 'temporal' ? 'temporal' : defaultColumnClass);
         if (edgeName === 'measures' && columnClass !== 'measure') {
            fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.${edgeName}[${index}] must resolve to a measure field.`);
         }
         if (edgeName !== 'measures' && columnClass === 'measure') {
            fail(
               'INVALID_REQUEST_CONTRACT',
               `${fieldPath}.${edgeName}[${index}] must resolve to a dimension or temporal field.`
            );
         }
         return {
            expression: resolved.expression,
            columnClass,
            role: resolved.role || targetRole,
            templateColumnID: resolved.columnID || (targetRole ? PLANNING_ROLE_TO_CANONICAL_COLUMN_ID[targetRole] : null),
            aggregation: resolved.aggregation || null,
            format: resolved.format ? deepClone(resolved.format) : null
         };
      });
   };

   return {
      rows: normalizeEdge('rows', 'dimension', ['dimension.primary', 'dimension.secondary']),
      columns: normalizeEdge('columns', 'temporal', ['temporal.primary']),
      measures: normalizeEdge('measures', 'measure', ['measure.primary', 'measure.secondary'])
   };
}

function normalizeTableBindingTopology(view, context, fieldPath) {
   const rawColumns = view.columns;
   if (!Array.isArray(rawColumns) || rawColumns.length === 0) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.columns must be a non-empty array for table views.`);
   }
   if (rawColumns.length > TABLE_MAX_COLUMN_COUNT) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath}.columns contains ${rawColumns.length} entries, but oracle.bi.tech.table supports at most ${TABLE_MAX_COLUMN_COUNT} columns.`
      );
   }
   return {
      columns: rawColumns.map((rawEntry, index) => {
         const resolved = resolvePlanningFieldReference(rawEntry, context, `${fieldPath}.columns[${index}]`);
         const resolvedType = normalizeCompactToken(resolved.type);
         return {
            expression: resolved.expression,
            columnClass: resolvedType === 'measure'
               ? 'measure'
               : (resolvedType === 'temporal' ? 'temporal' : 'dimension'),
            role: resolved.role || null,
            templateColumnID: resolved.columnID || null,
            aggregation: resolved.aggregation || null,
            format: resolved.format ? deepClone(resolved.format) : null
         };
      })
   };
}

function mergeExistingPlanningBindings(bindings, explicitBindings, context, fieldPath) {
   if (!isPlainObject(explicitBindings)) {
      return;
   }
   for (const [rawRole, rawBinding] of Object.entries(explicitBindings)) {
      const normalizedRole = normalizeSemanticRoleName(rawRole);
      if (!normalizedRole) {
         continue;
      }
      if (toNonEmptyTrimmedString(rawBinding) || isPlainObject(rawBinding)) {
         const resolved = resolvePlanningFieldReference(rawBinding, context, `${fieldPath}.bindings.${rawRole}`, {
            targetRole: normalizedRole
         });
         bindings[normalizedRole] = isPlainObject(rawBinding)
            ? {
               ...rawBinding,
               expression: resolved.expression,
               ...(resolved.aggregation ? { aggregation: resolved.aggregation } : {}),
               ...(resolved.format ? { format: deepClone(resolved.format) } : {})
            }
            : {
               expression: resolved.expression,
               ...(resolved.aggregation ? { aggregation: resolved.aggregation } : {}),
               ...(resolved.format ? { format: deepClone(resolved.format) } : {})
            };
      }
   }
}

function normalizeViewBindingsFromShorthand(view, context, fieldPath) {
   const bindings = {};
   mergeExistingPlanningBindings(bindings, view.bindings, context, fieldPath);
   const pluginType = toNonEmptyTrimmedString(view.pluginType) || resolveCompactViewPluginType(view, fieldPath);
   const compactType = normalizeCompactToken(view.type || view.viewType || view.visualization);
   const chartType = compactType || normalizeCompactToken(pluginType?.split('.').pop());

   const assignMeasureList = (rawValue, startIndex = 0) => {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      const roles = ['measure.primary', 'measure.secondary'];
      const availableCapacity = COMPACT_MEASURE_ROLE_CAPACITY - startIndex;
      if (values.filter((value) => value !== undefined && value !== null).length > availableCapacity) {
         fail(
            'UNSUPPORTED_COMPACT_MEASURE_CARDINALITY',
            `${fieldPath} requests more than ${availableCapacity} measure binding(s), but the selected compact scaffold can materialize at most ${availableCapacity}. Use explicit advanced planning backed by a verified runtime fixture.`
         );
      }
      for (let index = 0; index < values.length && index + startIndex < roles.length; index += 1) {
         const value = values[index];
         mergePlanningBinding(bindings, roles[index + startIndex], value, context, `${fieldPath}.y[${index}]`);
      }
   };

   if (['line', 'area', 'combo'].includes(chartType)) {
      mergePlanningBinding(bindings, 'temporal.primary', view.x || view.time || view.date, context, `${fieldPath}.x`);
      assignMeasureList(view.y || view.value || view.metric || view.metrics || view.measures);
      mergePlanningBinding(bindings, 'dimension.secondary', view.color || view.series || view.category, context, `${fieldPath}.color`);
   } else if (chartType === 'scatter') {
      mergePlanningBinding(bindings, 'measure.primary', view.x || view.metric || view.value || view.measure, context, `${fieldPath}.x`);
      mergePlanningBinding(bindings, 'measure.secondary', view.y, context, `${fieldPath}.y`);
      mergePlanningBinding(bindings, 'dimension.primary', view.detail || view.category || view.group, context, `${fieldPath}.detail`);
      mergePlanningBinding(bindings, 'dimension.secondary', view.color || view.series, context, `${fieldPath}.color`);
   } else if (['horizontal_bar', 'horizontal_stacked_bar'].includes(chartType)) {
      mergePlanningBinding(bindings, 'dimension.primary', view.y || view.category || view.group, context, `${fieldPath}.y`);
      assignMeasureList(view.x || view.value || view.metric || view.measure || view.measures);
      mergePlanningBinding(bindings, 'dimension.secondary', view.color || view.series, context, `${fieldPath}.color`);
   } else if (['bar', 'stacked_bar'].includes(chartType)) {
      mergePlanningBinding(bindings, 'dimension.primary', view.x || view.category || view.group, context, `${fieldPath}.x`);
      assignMeasureList(view.y || view.value || view.metric || view.measure || view.measures);
      mergePlanningBinding(bindings, 'dimension.secondary', view.color || view.series, context, `${fieldPath}.color`);
   } else if (['donut', 'pie', 'treemap'].includes(chartType)) {
      mergePlanningBinding(bindings, 'dimension.primary', view.category || view.group || view.x, context, `${fieldPath}.category`);
      assignMeasureList(view.value || view.metric || view.measure || view.y);
   } else if (['kpi', 'kpi_tile', 'tile', 'performance_tile'].includes(chartType)) {
      mergePlanningBinding(bindings, 'measure.primary', view.metric || view.value || view.measure, context, `${fieldPath}.metric`);
   } else if (chartType === 'pivot') {
      const rows = Array.isArray(view.rows) ? view.rows : [];
      const columns = Array.isArray(view.columns) ? view.columns : [];
      const measures = Array.isArray(view.measures) ? view.measures : [view.measure].filter((value) => value !== undefined);
      const hasPivotShorthand = view.rows !== undefined
         || view.columns !== undefined
         || view.measures !== undefined
         || view.measure !== undefined;
      if (hasPivotShorthand) {
         view.pivotTopology = normalizePivotBindingTopology(
            {
               ...view,
               rows,
               columns,
               measures
            },
            context,
            fieldPath
         );
      }
      mergePlanningBinding(bindings, 'dimension.primary', rows[0], context, `${fieldPath}.rows[0]`);
      mergePlanningBinding(bindings, 'dimension.secondary', rows[1], context, `${fieldPath}.rows[1]`);
      mergePlanningBinding(bindings, 'temporal.primary', columns[0], context, `${fieldPath}.columns[0]`);
      assignMeasureList(measures);
   } else if (chartType === 'table') {
      const columns = Array.isArray(view.columns) ? view.columns : [];
      if (view.columns !== undefined) {
         view.tableTopology = normalizeTableBindingTopology(view, context, fieldPath);
      }
      const roleCounters = { dimension: 0, measure: 0, temporal: 0 };
      const rolesByClass = {
         dimension: ['dimension.primary', 'dimension.secondary'],
         measure: ['measure.primary', 'measure.secondary'],
         temporal: ['temporal.primary']
      };
      columns.forEach((columnRef, columnIndex) => {
         const resolved = resolvePlanningFieldReference(columnRef, context, `${fieldPath}.columns[${columnIndex}]`);
         const className = resolved.type === 'measure'
            ? 'measure'
            : (resolved.type === 'temporal' ? 'temporal' : 'dimension');
         const role = rolesByClass[className]?.[roleCounters[className]] || null;
         roleCounters[className] += 1;
         if (role) {
            mergePlanningBinding(bindings, role, columnRef, context, `${fieldPath}.columns[${columnIndex}]`);
         }
      });
   } else if (chartType === 'map') {
      mergePlanningBinding(bindings, 'dimension.primary', view.location || view.category || view.detail || view.x, context, `${fieldPath}.location`);
      assignMeasureList(view.metric || view.value || view.measure || view.measures);
   }

   return bindings;
}

function normalizeCalculationCollection(rawCalculations, context, fieldPath) {
   if (rawCalculations === undefined || rawCalculations === null) {
      return [];
   }
   const entries = Array.isArray(rawCalculations)
      ? rawCalculations.map((value, index) => [String(index), value])
      : (isPlainObject(rawCalculations) ? Object.entries(rawCalculations) : []);
   if (!Array.isArray(rawCalculations) && !isPlainObject(rawCalculations)) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath} must be an array or object when provided.`);
   }
   return entries.map(([rawID, rawSpec], index) => {
      if (typeof rawSpec === 'string') {
         const aliasEntry = context.fieldByAlias.get(rawSpec) || context.fieldByAlias.get(normalizeCompactToken(rawSpec));
         return aliasEntry?.calculationExpression || rawSpec;
      }
      if (!isPlainObject(rawSpec)) {
         fail('INVALID_REQUEST_CONTRACT', `${fieldPath}[${index}] must be a string or object.`);
      }
      const id = toNonEmptyTrimmedString(rawSpec.id || rawSpec.name || rawID);
      const expression = toNonEmptyTrimmedString(rawSpec.expression || rawSpec.formula || rawSpec.calculation);
      if (!expression) {
         fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.${id || index}.expression must be provided for compact calculations.`);
      }
      return {
         id,
         expression,
         type: toNonEmptyTrimmedString(rawSpec.type)?.toUpperCase() || 'EXPRESSION',
         aggregation: toNonEmptyTrimmedString(rawSpec.aggregation),
         format: toNonEmptyTrimmedString(rawSpec.format)
      };
   });
}

function normalizePlanningFilter(rawFilter, context, fieldPath, defaults = {}) {
   if (!isPlainObject(rawFilter)) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath} must be an object.`);
   }
   const fieldRef = rawFilter.field || rawFilter.column || rawFilter.expression || rawFilter.source || null;
   let resolved = null;
   if (fieldRef !== null) {
      resolved = resolvePlanningFieldReference(fieldRef, context, `${fieldPath}.field`, {
         targetRole: normalizeSemanticRoleName(rawFilter.role)
      });
   }
   const role = normalizeSemanticRoleName(rawFilter.role) || resolved?.role || null;
   const columnID = toNonEmptyTrimmedString(rawFilter.columnID)
      || resolved?.columnID
      || (role ? PLANNING_ROLE_TO_CANONICAL_COLUMN_ID[role] : null);
   if (!columnID) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath} must provide columnID or a field reference that resolves to a canonical planning role.`
      );
   }
   const filterID = toNonEmptyTrimmedString(rawFilter.filterID || rawFilter.id)
      || `flt_${normalizeCompactToken(columnID) || 'field'}`;
   const locationToken = normalizeCompactToken(rawFilter.location || defaults.location || 'filter_bar');
   const locationByToken = {
      filter_bar: 'filter_bar',
      filterbar: 'filter_bar',
      filter_viz: 'filter_viz',
      filterviz: 'filter_viz'
   };
   const location = locationByToken[locationToken];
   if (!location) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.location '${rawFilter.location}' is unsupported. Use filter_bar or filter_viz.`);
   }
   const scopeToken = normalizeCompactToken(rawFilter.scope || defaults.scope || 'global');
   const scopeByToken = {
      global: 'global',
      report: 'global',
      canvas: 'canvas',
      view: 'view',
      visualization: 'view',
      viz: 'view'
   };
   const scope = scopeByToken[scopeToken];
   if (!scope) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.scope '${rawFilter.scope}' is unsupported. Use global/report, canvas, or view.`);
   }
   const operatorToken = normalizeCompactToken(rawFilter.operator || rawFilter.op || 'in');
   const operatorByToken = {
      between: 'between',
      equal: 'equal',
      equals: 'equal',
      greater: 'greater',
      greater_or_equal: 'greaterOrEqual',
      in: 'in',
      less: 'less',
      less_or_equal: 'lessOrEqual',
      not_equal: 'notEqual',
      not_in: 'notIn',
      not_null: 'notNull',
      null: 'null'
   };
   const operator = operatorByToken[operatorToken];
   if (!operator) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${fieldPath}.operator '${rawFilter.operator || rawFilter.op}' is unsupported for compose filter materialization.`
      );
   }
   return {
      ...rawFilter,
      filterID,
      columnID,
      expression: resolved?.expression || toNonEmptyTrimmedString(rawFilter.expression) || null,
      columnClass: normalizeCompactToken(resolved?.type || rawFilter.type || rawFilter.columnType) || null,
      location,
      scope,
      operator,
      ...(rawFilter.default !== undefined ? { default: deepClone(rawFilter.default) } : {}),
      planningOutcome: toNonEmptyTrimmedString(rawFilter.planningOutcome || rawFilter.status) || 'applied'
   };
}

function collectPlanningFilters(rawFilters) {
   if (rawFilters === undefined || rawFilters === null) {
      return [];
   }
   if (Array.isArray(rawFilters)) {
      return rawFilters;
   }
   if (isPlainObject(rawFilters)) {
      return [rawFilters];
   }
   fail('INVALID_REQUEST_CONTRACT', 'analysisRequirements filter shorthand must be an object or array.');
}

function normalizePlanningSortEntries(rawSort, context, fieldPath) {
   if (rawSort === undefined || rawSort === null) {
      return [];
   }
   const entries = Array.isArray(rawSort) ? rawSort : [rawSort];
   return entries.map((rawEntry, index) => {
      const sortPath = `${fieldPath}[${index}]`;
      const entry = isPlainObject(rawEntry) ? rawEntry : { field: rawEntry };
      const fieldRef = entry.field || entry.column || entry.expression || entry.source;
      if (fieldRef === undefined || fieldRef === null) {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${sortPath} must identify a field using field, column, expression, or source.`
         );
      }
      const resolved = resolvePlanningFieldReference(fieldRef, context, `${sortPath}.field`);
      const rawDirection = normalizeCompactToken(entry.direction || entry.order || 'ascending');
      const direction = rawDirection === 'asc' || rawDirection === 'ascending'
         ? 'ascending'
         : (rawDirection === 'desc' || rawDirection === 'descending' ? 'descending' : null);
      if (!direction) {
         fail('INVALID_REQUEST_CONTRACT', `${sortPath}.direction must be ascending/asc or descending/desc.`);
      }
      return {
         expression: resolved.expression,
         columnID: resolved.columnID || null,
         direction,
         order: index
      };
   });
}

function normalizeAnalysisRequirementsShorthand(requestPayload, selectedDataModel, describeColumns) {
   const analysisRequirements = isPlainObject(requestPayload.analysisRequirements)
      ? requestPayload.analysisRequirements
      : null;
   if (!analysisRequirements) {
      return {
         applied: false,
         fieldAliasCount: 0,
         compactViewCount: 0,
         expandedFilterCount: 0,
         actionCount: 0
      };
   }

   const describeDescriptors = Array.isArray(describeColumns)
      ? describeColumns.map((column) => normalizeDescribeColumnDescriptor(column, selectedDataModel)).filter(Boolean)
      : [];
   const fieldContext = {
      selectedDataModel,
      ...normalizeAnalysisRequirementFields(analysisRequirements, selectedDataModel, describeDescriptors)
   };
   const globalFilters = collectPlanningFilters(analysisRequirements.filters).map((filter, index) =>
      normalizePlanningFilter(filter, fieldContext, `analysisRequirements.filters[${index}]`, {
         scope: 'global'
      })
   );
   const topLevelCalculations = normalizeCalculationCollection(
      analysisRequirements.calculations,
      fieldContext,
      'analysisRequirements.calculations'
   );
   if (topLevelCalculations.length > 0) {
      if (!isPlainObject(requestPayload.adapterPayload.calculations)) {
         requestPayload.adapterPayload.calculations = {};
      }
      if (!Array.isArray(requestPayload.adapterPayload.calculations.proposed)) {
         requestPayload.adapterPayload.calculations.proposed = [];
      }
      for (const calculation of topLevelCalculations) {
         if (isPlainObject(calculation)) {
            requestPayload.adapterPayload.calculations.proposed.push(calculation);
         }
      }
   }

   let compactViewCount = 0;
   let expandedFilterCount = 0;
   const shapeCanvasByID = new Map(
      (Array.isArray(requestPayload.analysisShape?.canvases) ? requestPayload.analysisShape.canvases : [])
         .filter((canvas) => isPlainObject(canvas) && toNonEmptyTrimmedString(canvas.id))
         .map((canvas) => [toNonEmptyTrimmedString(canvas.id), canvas])
   );

   const requirementCanvases = Array.isArray(analysisRequirements.canvases) ? analysisRequirements.canvases : [];
   for (const [canvasIndex, canvas] of requirementCanvases.entries()) {
      if (!isPlainObject(canvas)) {
         continue;
      }
      const canvasID = toNonEmptyTrimmedString(canvas.id);
      if (!canvasID) {
         continue;
      }
      const shapeCanvas = shapeCanvasByID.get(canvasID);
      const canvasFilters = [
         ...globalFilters,
         ...collectPlanningFilters(canvas.filters).map((filter, index) =>
            normalizePlanningFilter(filter, fieldContext, `analysisRequirements.canvases[${canvasIndex}].filters[${index}]`, {
               scope: 'canvas'
            })
         )
      ];
      expandedFilterCount += canvasFilters.length;
      const requirementViews = Array.isArray(canvas.views) ? canvas.views : [];
      const shapeViewByID = new Map(
         (Array.isArray(shapeCanvas?.views) ? shapeCanvas.views : [])
            .filter((view) => isPlainObject(view) && toNonEmptyTrimmedString(view.id))
            .map((view) => [toNonEmptyTrimmedString(view.id), view])
      );
      for (const [viewIndex, view] of requirementViews.entries()) {
         if (!isPlainObject(view)) {
            continue;
         }
         const viewPath = `analysisRequirements.canvases[${canvasIndex}].views[${viewIndex}]`;
         view.pluginType = resolveCompactViewPluginType(view, viewPath);
         if (view.type !== undefined || view.viewType !== undefined || view.visualization !== undefined) {
            compactViewCount += 1;
         }
         if (!toNonEmptyTrimmedString(view.purpose)) {
            view.purpose = toNonEmptyTrimmedString(view.title || view.id || view.type) || 'planned_view';
         }
         if (view.grain === undefined) {
            view.grain = view.x || view.category || view.rows || view.columns || view.metric || 'planned_grain';
         }
         const normalizedBindings = normalizeViewBindingsFromShorthand(view, fieldContext, viewPath);
         view.bindings = normalizedBindings;
         if (!isPlainObject(view.labels)) {
            view.labels = {};
         }
         if (!toNonEmptyTrimmedString(view.labels.title)) {
            view.labels.title = toNonEmptyTrimmedString(view.title || view.label || view.id) || view.id;
         }
         const viewFilters = [
            ...canvasFilters,
            ...collectPlanningFilters(view.filter).map((filter, index) =>
               normalizePlanningFilter(filter, fieldContext, `${viewPath}.filter[${index}]`, {
                  scope: 'view'
               })
            ),
            ...collectPlanningFilters(view.filters).map((filter) => deepClone(filter))
         ];
         view.filters = viewFilters;
         expandedFilterCount += viewFilters.length;
         view.calculations = normalizeCalculationCollection(view.calculations, fieldContext, `${viewPath}.calculations`);
         view.sort = normalizePlanningSortEntries(view.sort, fieldContext, `${viewPath}.sort`);

         const shapeView = shapeViewByID.get(toNonEmptyTrimmedString(view.id));
         if (shapeView) {
            shapeView.pluginType = view.pluginType;
            for (const fieldName of ['purpose', 'grain', 'bindings', 'pivotTopology', 'tableTopology', 'labels', 'filters', 'calculations', 'sort', 'interactions']) {
               if (view[fieldName] !== undefined) {
                  shapeView[fieldName] = deepClone(view[fieldName]);
               } else if (!['interactions', 'pivotTopology', 'tableTopology'].includes(fieldName)) {
                  shapeView[fieldName] = [];
               }
            }
         }
      }
   }

   const actions = Array.isArray(analysisRequirements.actions)
      ? analysisRequirements.actions
      : (Array.isArray(analysisRequirements.dataActions) ? analysisRequirements.dataActions : []);
   if (analysisRequirements.actions !== undefined && !Array.isArray(analysisRequirements.actions)) {
      fail('INVALID_REQUEST_CONTRACT', 'analysisRequirements.actions must be an array when provided.');
   }
   if (analysisRequirements.dataActions !== undefined && !Array.isArray(analysisRequirements.dataActions)) {
      fail('INVALID_REQUEST_CONTRACT', 'analysisRequirements.dataActions must be an array when provided.');
   }
   return {
      applied: true,
      fieldAliasCount: fieldContext.fieldByAlias.size,
      compactViewCount,
      expandedFilterCount,
      actionCount: actions.length,
      fieldContext
   };
}

function buildDataActionColumn(columnID, columnName) {
   return {
      sColumnID: columnID,
      sColumnName: columnName,
      sQualifiedDisplayName: columnName
   };
}

function buildDataActionColumnEntry(columnID, columnName) {
   return {
      oColumn: buildDataActionColumn(columnID, columnName),
      bIsRequired: true,
      bPassToTarget: true
   };
}

function resolvePlanningActionColumns(action, fieldContext, fieldPath) {
   const rawColumns = Array.isArray(action.contextColumns)
      ? action.contextColumns
      : (Array.isArray(action.columns) ? action.columns : []);
   return rawColumns.map((columnRef, index) => {
      const resolved = resolvePlanningFieldReference(columnRef, fieldContext, `${fieldPath}.contextColumns[${index}]`, {
         targetRole: isPlainObject(columnRef) ? normalizeSemanticRoleName(columnRef.role) : null
      });
      const role = resolved.role || null;
      const columnID = resolved.columnID || (role ? PLANNING_ROLE_TO_CANONICAL_COLUMN_ID[role] : null);
      if (!columnID) {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${fieldPath}.contextColumns[${index}] must resolve to a canonical criteria columnID.`
         );
      }
      return buildDataActionColumnEntry(columnID, toNonEmptyTrimmedString(columnRef?.label) || columnID);
   });
}

function applyPlanningDataActions(workbookJson, analysisRequirements, canvasViewNameByID, fieldContext) {
   const actions = Array.isArray(analysisRequirements?.actions)
      ? analysisRequirements.actions
      : (Array.isArray(analysisRequirements?.dataActions) ? analysisRequirements.dataActions : []);
   if (actions.length === 0) {
      return {
         appliedCount: 0
      };
   }
   if (!Array.isArray(workbookJson.dataActions)) {
      workbookJson.dataActions = [];
   }
   let appliedCount = 0;
   for (const [index, action] of actions.entries()) {
      if (!isPlainObject(action)) {
         fail('INVALID_REQUEST_CONTRACT', `analysisRequirements.actions[${index}] must be an object.`);
      }
      const actionPath = `analysisRequirements.actions[${index}]`;
      const actionType = normalizeCompactToken(action.type || action.actionType || 'navigate');
      const actionID = toNonEmptyTrimmedString(action.id) || `dataAction!${index + 1}`;
      const actionName = toNonEmptyTrimmedString(action.label || action.name || action.id) || `Data Action ${index + 1}`;
      const contextColumns = resolvePlanningActionColumns(action, fieldContext, actionPath);
      const passFilters = action.passFilters === true || action.pass_filters === true;
      const anchorColumns = passFilters ? contextColumns : [];
      const isUrlAction = actionType === 'url' || actionType === 'url_navigation';
      const abstractAction = {
         sClass: isUrlAction
            ? 'obitech-report/dataaction.URLNavigationDataAction'
            : 'obitech-report/dataaction.BINavigationDataAction',
         sID: actionID,
         sName: actionName,
         sScopeID: 'project',
         aContextColumns: contextColumns,
         sVersion: isUrlAction ? '1.0.1' : '1.0.2',
         _sNSVersion: isUrlAction ? '1.0.1' : '1.0.2',
         aAnchorToColumns: anchorColumns,
         eValuePassingMode: passFilters ? 'anchorTo' : 'none',
         bIsEnabled: action.enabled !== false
      };
      if (isUrlAction) {
         abstractAction.iMaxDataPointSelection = 0;
         const url = toNonEmptyTrimmedString(action.url || action.href);
         if (!url) {
            fail('INVALID_REQUEST_CONTRACT', `${actionPath}.url must be provided for URL navigation actions.`);
         }
         const prohibitedScheme = getProhibitedUrlActionScheme(url);
         if (prohibitedScheme) {
            fail(
               'INVALID_REQUEST_CONTRACT',
               `${actionPath}.url uses prohibited URL scheme '${prohibitedScheme}:'; use a supported web, relative, catalog, or parameterized target.`
            );
         }
         workbookJson.dataActions.push({
            [DATA_ACTION_NAMESPACE_ABSTRACT]: abstractAction,
            [DATA_ACTION_NAMESPACE_HTTP]: {
               sURL: url,
               eHTTPMethod: 'GET',
               _sNSVersion: '1.0.4'
            }
         });
         appliedCount += 1;
         continue;
      }

      if (!['navigate', 'bi_navigation', 'bi_nav'].includes(actionType)) {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${actionPath}.type '${action.type}' is unsupported. Supported compact action types: navigate, bi_navigation, url.`
         );
      }
      const targetCanvasID = toNonEmptyTrimmedString(action.targetCanvas || action.target_canvas || action.target);
      if (!targetCanvasID) {
         fail('INVALID_REQUEST_CONTRACT', `${actionPath}.target_canvas must be provided for BI navigation actions.`);
      }
      const targetCanvasViewName = canvasViewNameByID.get(targetCanvasID);
      if (!targetCanvasViewName) {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${actionPath}.target_canvas '${targetCanvasID}' does not resolve to a generated canvas.`
         );
      }
      workbookJson.dataActions.push({
         [DATA_ACTION_NAMESPACE_ABSTRACT]: abstractAction,
         [DATA_ACTION_NAMESPACE_BI_NAV]: {
            sTargetItemPath: null,
            sTargetItemType: 'project',
            sTargetCanvasID: targetCanvasViewName,
            sTargetDashboardPage: '',
            eBIPParameterMappingType: 'default',
            aBIPParameterMap: [],
            _sNSVersion: '1.0.2',
            eParameterPassingMode: passFilters ? 'all' : 'none',
            aPassedParameters: []
         }
      });
      appliedCount += 1;
   }
   return {
      appliedCount
   };
}

function normalizePlanningFilterDefaults(filter, fieldPath) {
   const operator = toNonEmptyTrimmedString(filter.operator);
   if (['null', 'notNull'].includes(operator)) {
      return [];
   }
   const values = Array.isArray(filter.default) ? filter.default : [filter.default];
   if (operator === 'between' && values.length !== 2) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.default must contain exactly two values for operator=between.`);
   }
   if (values.length === 0) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.default must contain at least one value for operator=${operator}.`);
   }
   if (values.some((value) => value === null || value === undefined)) {
      fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.default must not contain null values for operator=${operator}.`);
   }
   return values.map((value) => String(value));
}

function filterModelClassForPlanningFilter(filter) {
   if (['between', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'].includes(filter.operator)) {
      return normalizeCompactToken(filter.columnClass) === 'temporal'
         ? 'obitech-daterangefilter/daterangefilter.DateRangeFilterModel'
         : 'obitech-numberrangefilter/numberrangefilter.NumberRangeFilterModel';
   }
   return 'obitech-listfilter/listfilter.ListFilterModel';
}

function buildPlanningFilterControl(filter, columnID, expression, resolvedFilterID, filterControlConfigVersion, fieldPath) {
   const defaultValues = normalizePlanningFilterDefaults(filter, fieldPath);
   const modelClassName = filterModelClassForPlanningFilter(filter);
   const control = {
      type: 'saw:columnFilterControl',
      filterID: resolvedFilterID,
      columnID,
      formula: {
         expr: {
            type: 'sawx:sqlExpression',
            expression,
            children: []
         }
      },
      filterOperator: {
         op: filter.operator
      },
      filterControlConfig: {
         _version: filterControlConfigVersion,
         settings: {
            filterModelClassName: modelClassName,
            location: filter.location
         }
      },
      filterControlDefaultValues: {
         type: 'specificValue',
         children: defaultValues.map((text) => ({ text }))
      }
   };
   if (modelClassName.endsWith('ListFilterModel')) {
      control.filterControlSource = {
         type: 'saw:fcSpecificChoices',
         filterControlChoices: {
            children: defaultValues.map((text) => ({ value: { text } }))
         }
      };
   } else if (modelClassName.endsWith('DateRangeFilterModel')) {
      control.filterUIControl = {
         displayTimeZone: 'displayTimeZone',
         type: 'saw:fcCalendar'
      };
   }
   return control;
}

function applyPlanningFilters(workbookJson, analysisRequirements, generatedViewMappings, canvasViewNameByID, filterControlConfigVersion, requestedFilterMode) {
   const summary = {
      requiredCount: 0,
      appliedCount: 0,
      deduplicatedCount: 0,
      skippedDispositionCount: 0,
      materialized: []
   };
   const requirementViewByID = collectAnalysisRequirementViewsByID(analysisRequirements);
   const criteriaIndex = buildCriteriaExpressionIndex(workbookJson);
   const subjectArea = toNonEmptyTrimmedString(workbookJson?.criteria?.subjectArea);
   if (!isPlainObject(workbookJson.filterControlCollections)) {
      workbookJson.filterControlCollections = { children: [] };
   }
   if (!Array.isArray(workbookJson.filterControlCollections.children)) {
      workbookJson.filterControlCollections.children = [];
   }
   const collections = workbookJson.filterControlCollections.children;
   const collectionByName = new Map(
      collections
         .filter((collection) => isPlainObject(collection) && toNonEmptyTrimmedString(collection.name))
         .map((collection) => [toNonEmptyTrimmedString(collection.name), collection])
   );
   const materializedKeys = new Set();
   const usedFilterIDs = new Set();
   for (const collection of collections) {
      const controls = Array.isArray(collection?.filterControls?.children)
         ? collection.filterControls.children
         : [];
      for (const control of controls) {
         const filterID = toNonEmptyTrimmedString(control?.filterID);
         if (filterID) {
            usedFilterIDs.add(filterID);
         }
      }
   }

   for (const mapping of generatedViewMappings) {
      const requestedViewID = toNonEmptyTrimmedString(mapping?.requestedViewID);
      const viewName = toNonEmptyTrimmedString(mapping?.viewName);
      const canvasID = toNonEmptyTrimmedString(mapping?.canvasID);
      const canvasViewName = canvasID ? canvasViewNameByID.get(canvasID) : null;
      const requirementView = requestedViewID ? requirementViewByID.get(requestedViewID) : null;
      const filters = Array.isArray(requirementView?.filters) ? requirementView.filters : [];
      for (const [filterIndex, filter] of filters.entries()) {
         summary.requiredCount += 1;
         const fieldPath = `analysisRequirements view '${requestedViewID}' filters[${filterIndex}]`;
         const outcome = normalizeCompactToken(filter?.planningOutcome || filter?.status || 'applied');
         if (outcome && outcome !== 'applied') {
            summary.skippedDispositionCount += 1;
            continue;
         }
         const requestedLocation = toNonEmptyTrimmedString(filter?.location);
         if (requestedLocation !== 'filter_bar'
            && !(requestedLocation === 'filter_viz' && requestedFilterMode === 'filter_viz')) {
            fail(
               'UNSUPPORTED_COMPOSE_FILTER_LOCATION',
               `${fieldPath}.location '${requestedLocation}' is unsupported. Use filter_bar, or request analysisShape.filterMode=filter_viz with location=filter_viz.`
            );
         }
         const scope = normalizeCompactToken(filter?.scope);
         const collectionName = scope === 'global'
            ? 'report'
            : (scope === 'view' ? viewName : (scope === 'canvas' ? canvasViewName : null));
         if (!collectionName) {
            fail(
               'INVALID_REQUEST_CONTRACT',
               `${fieldPath}.scope '${filter?.scope}' does not resolve to a generated filter-control collection.`
            );
         }
         const plannedColumnID = toNonEmptyTrimmedString(filter?.columnID);
         const plannedColumnExpression = plannedColumnID
            ? toNonEmptyTrimmedString(criteriaIndex.byColumnID.get(plannedColumnID)?.columnFormula?.expr?.expression)
            : null;
         const parsedExpression = parseDirectColumnExpression(filter?.expression || plannedColumnExpression);
         if (!parsedExpression) {
            fail('INVALID_REQUEST_CONTRACT', `${fieldPath}.expression must resolve to a direct subjectArea.table.column expression.`);
         }
         const expression = buildDirectColumnExpression(
            parsedExpression.subjectAreaToken,
            parsedExpression.tableName,
            parsedExpression.columnName
         );
         const columnID = criteriaIndex.byExpression.get(expression.toLowerCase());
         if (!columnID) {
            fail(
               'UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY',
               `${fieldPath} expression '${expression}' is not materialized in workbook criteria.`
            );
         }
         const defaultValues = normalizePlanningFilterDefaults(filter, fieldPath);
         const materializedKey = `${collectionName}|${columnID}|${filter.operator}|${JSON.stringify(defaultValues)}`;
         if (materializedKeys.has(materializedKey)) {
            summary.deduplicatedCount += 1;
            continue;
         }
         materializedKeys.add(materializedKey);

         let collection = collectionByName.get(collectionName);
         if (!collection) {
            collection = {
               name: collectionName,
               ...(subjectArea ? { subjectArea } : {}),
               filterControls: { children: [] }
            };
            collections.push(collection);
            collectionByName.set(collectionName, collection);
         }
         if (!isPlainObject(collection.filterControls)) {
            collection.filterControls = { children: [] };
         }
         if (!Array.isArray(collection.filterControls.children)) {
            collection.filterControls.children = [];
         }
         if (scope === 'global') {
            workbookJson.filterControlCollectionRef = { name: 'report' };
         } else if (scope === 'canvas') {
            const canvasView = (Array.isArray(workbookJson?.views?.children) ? workbookJson.views.children : [])
               .find((view) => view?.type === 'saw:canvas' && view?.viewName === canvasViewName);
            if (!canvasView) {
               fail('UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY', `${fieldPath} cannot resolve canvas '${canvasID}' for filter scope wiring.`);
            }
            canvasView.filterControlCollectionRef = { name: canvasViewName };
         } else if (scope === 'view') {
            const matchingLayoutCells = (Array.isArray(workbookJson?.layouts?.children)
               ? workbookJson.layouts.children
               : []).flatMap((layout) => Array.isArray(layout?.children) ? layout.children : [])
               .filter((cell) => toNonEmptyTrimmedString(cell?.content?.viewName) === viewName);
            if (matchingLayoutCells.length === 0) {
               fail(
                  'UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY',
                  `${fieldPath} cannot resolve layout geometry for view '${requestedViewID}' filter scope wiring.`
               );
            }
            for (const cell of matchingLayoutCells) {
               cell.filterControlCollectionRef = { name: viewName };
            }
         }
         const baseFilterID = toNonEmptyTrimmedString(filter.filterID) || `flt_${normalizeCompactToken(columnID) || 'field'}`;
         let resolvedFilterID = baseFilterID;
         let suffix = 2;
         while (usedFilterIDs.has(resolvedFilterID)) {
            resolvedFilterID = `${baseFilterID}_${suffix}`;
            suffix += 1;
         }
         usedFilterIDs.add(resolvedFilterID);
         collection.filterControls.children.push(
            buildPlanningFilterControl(filter, columnID, expression, resolvedFilterID, filterControlConfigVersion, fieldPath)
         );
         summary.appliedCount += 1;
         summary.materialized.push({
            requestedViewID,
            scope,
            collectionName,
            filterID: resolvedFilterID,
            columnID,
            expression,
            operator: filter.operator,
            defaultValues
         });
      }
   }
   if (collections.length === 0) {
      delete workbookJson.filterControlCollections;
   }
   return summary;
}

function normalizeSemanticRoleName(rawRole) {
   const role = toNonEmptyTrimmedString(rawRole);
   return role ? role.toLowerCase() : null;
}

function resolveRoleClass(role, semanticRoleContracts) {
   const normalizedRole = normalizeSemanticRoleName(role);
   if (!normalizedRole) {
      return null;
   }
   const roleClassByRole = isPlainObject(semanticRoleContracts?.roleClassByRole)
      ? semanticRoleContracts.roleClassByRole
      : {};
   const className = toNonEmptyTrimmedString(roleClassByRole[normalizedRole]);
   if (className) {
      return className;
   }
   if (normalizedRole.startsWith('measure.')) {
      return 'measure';
   }
   if (normalizedRole.startsWith('temporal.')) {
      return 'temporal';
   }
   if (normalizedRole.startsWith('dimension.')) {
      return 'dimension';
   }
   return null;
}

function inferSemanticRoleFromColumnID(columnID, semanticRoleContracts) {
   const normalizedColumnID = toNonEmptyTrimmedString(columnID);
   if (!normalizedColumnID) {
      return null;
   }
   const roleByColumnID = isPlainObject(semanticRoleContracts?.legacyColumnIdRoleMap)
      ? semanticRoleContracts.legacyColumnIdRoleMap
      : {};
   const explicitRole = normalizeSemanticRoleName(roleByColumnID[normalizedColumnID]);
   if (explicitRole) {
      return explicitRole;
   }

   const normalized = normalizedColumnID.toLowerCase();
   if (normalized.startsWith('time_')) {
      if (normalized.includes('start') || normalized.includes('begin')) {
         return 'temporal.start';
      }
      if (normalized.includes('end') || normalized.includes('finish')) {
         return 'temporal.end';
      }
      return 'temporal.primary';
   }
   if (normalized.startsWith('mea_')) {
      if (normalized.includes('secondary') || normalized.includes('second') || normalized.includes('profit')
         || normalized.includes('margin') || normalized.includes('ratio') || normalized.includes('delta')) {
         return 'measure.secondary';
      }
      return 'measure.primary';
   }
   if (normalized.startsWith('dim_')) {
      if (normalized.includes('secondary') || normalized.includes('second') || normalized.includes('category')
         || normalized.includes('segment') || normalized.includes('channel')) {
         return 'dimension.secondary';
      }
      return 'dimension.primary';
   }
   return null;
}

function collectDesiredTokensForCriteriaColumn(criteriaColumn, fallbackColumnID, roleTokenHints = []) {
   const desired = new Set();
   for (const token of roleTokenHints) {
      for (const normalizedToken of normalizeTextTokens(token)) {
         desired.add(normalizedToken);
      }
   }
   const columnID = toNonEmptyTrimmedString(criteriaColumn?.columnID) || fallbackColumnID;
   if (columnID) {
      const stable = columnID.replace(/^(dim_|mea_|time_)/, '').replace(/_/g, ' ');
      for (const token of normalizeTextTokens(stable)) {
         desired.add(token);
      }
   }
   for (const token of normalizeTextTokens(criteriaColumn?.columnHeading?.caption?.text)) {
      desired.add(token);
   }
   return desired;
}

function scoreDescribeCandidateForColumn(criteriaColumnID, desiredTokens, candidate, desiredClass) {
   let score = 0;
   if (desiredClass && candidate.columnClass === desiredClass) {
      score += 180;
   } else if (desiredClass && desiredClass === 'temporal' && candidate.isTemporalDataType) {
      score += 120;
   } else if (desiredClass && desiredClass === 'measure' && candidate.isNumericDataType) {
      score += 90;
   } else if (desiredClass && candidate.columnClass !== desiredClass) {
      score -= 40;
   }

   const stableName = toNonEmptyTrimmedString(criteriaColumnID)
      ? criteriaColumnID.replace(/^(dim_|mea_|time_)/, '').toLowerCase()
      : '';
   const candidateColumnToken = candidate.columnName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
   if (stableName && candidateColumnToken === stableName) {
      score += 120;
   }
   for (const token of desiredTokens) {
      if (candidate.tokens.has(token)) {
         score += 18;
      }
   }
   return score;
}

function normalizeSemanticRoleMapValue(keyLabel, rawValue, selectedDataModel) {
   let expression = null;
   let reason = null;
   if (typeof rawValue === 'string') {
      expression = rawValue;
   } else if (isPlainObject(rawValue)) {
      expression = rawValue.expression;
      if (rawValue.reason !== undefined && rawValue.reason !== null && typeof rawValue.reason !== 'string') {
         fail(
            'INVALID_ADAPTER_CONTRACT',
            `adapterPayload.semanticRoleMap.${keyLabel}.reason must be a string when provided.`
         );
      }
      reason = toNonEmptyTrimmedString(rawValue.reason);
   } else {
      fail(
         'INVALID_ADAPTER_CONTRACT',
         `adapterPayload.semanticRoleMap.${keyLabel} must be a direct expression string or an object with expression.`
      );
   }

   const parsed = parseDirectColumnExpression(expression);
   if (!parsed) {
      fail(
         'INCOMPATIBLE_ROLE_MAPPING',
         `adapterPayload.semanticRoleMap.${keyLabel} must provide a direct expression in subjectArea.table.column form.`
      );
   }
   if (parsed.subjectAreaToken !== selectedDataModel) {
      fail(
         'INCOMPATIBLE_ROLE_MAPPING',
         `adapterPayload.semanticRoleMap.${keyLabel} expression subjectArea '${parsed.subjectAreaToken}' must match selectedDataModel '${selectedDataModel}'.`
      );
   }
   return {
      expression: buildDirectColumnExpression(selectedDataModel, parsed.tableName, parsed.columnName),
      reason
   };
}

function rebindCriteriaColumnsForCompose(workbookJson, describeColumns, selectedDataModel, options = {}) {
   const criteriaColumns = collectCriteriaColumns(workbookJson);
   const describeDescriptors = Array.isArray(describeColumns)
      ? describeColumns
         .map((column) => normalizeDescribeColumnDescriptor(column, selectedDataModel))
         .filter(Boolean)
      : [];
   if (describeDescriptors.length === 0) {
      fail(
         'INVALID_ADAPTER_CONTRACT',
         'adapterPayload.describe.columns must include usable metadata rows to rebind compose_ootb criteria formulas.'
      );
   }

   const descriptorsByClass = {
      dimension: describeDescriptors.filter((descriptor) => descriptor.columnClass === 'dimension'),
      measure: describeDescriptors.filter((descriptor) => descriptor.columnClass === 'measure'),
      temporal: describeDescriptors.filter((descriptor) => descriptor.columnClass === 'temporal')
   };
   const descriptorExpressionSet = new Set(describeDescriptors.map((descriptor) => descriptor.directExpression));
   const descriptorByExpression = new Map(describeDescriptors.map((descriptor) => [descriptor.directExpression, descriptor]));
   const semanticRoleContracts = isPlainObject(options.semanticRoleContracts) ? options.semanticRoleContracts : {};
   const roleTokenHints = isPlainObject(semanticRoleContracts.roleTokenHints) ? semanticRoleContracts.roleTokenHints : {};
   const requiredRolesByFamily = isPlainObject(semanticRoleContracts.familyRoleRequirements)
      ? semanticRoleContracts.familyRoleRequirements
      : {};
   const runtimeFamilies = Array.isArray(options.runtimeFamilies)
      ? options.runtimeFamilies.filter((value) => typeof value === 'string' && value.trim() !== '')
      : [];
   const requiredRoles = new Set();
   for (const runtimeFamily of runtimeFamilies) {
      const familyRequirements = requiredRolesByFamily[runtimeFamily];
      const familyRequiredRoles = Array.isArray(familyRequirements?.required)
         ? familyRequirements.required
         : [];
      for (const role of familyRequiredRoles) {
         const normalizedRole = normalizeSemanticRoleName(role);
         if (normalizedRole) {
            requiredRoles.add(normalizedRole);
         }
      }
   }
   const temporalAlwaysRequiredFamilies = new Set(
      Array.isArray(semanticRoleContracts?.temporalPolicy?.alwaysRequiredFamilies)
         ? semanticRoleContracts.temporalPolicy.alwaysRequiredFamilies
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
         : []
   );
   const requiresTemporalRole = Array.from(requiredRoles).some((role) => role.startsWith('temporal.'))
      || runtimeFamilies.some((family) => temporalAlwaysRequiredFamilies.has(family));
   const allowTemporalFallbackToDimension = !requiresTemporalRole && descriptorsByClass.temporal.length === 0;

   const explicitByRole = new Map();
   const explicitByColumnID = new Map();
   const explicitRoleMapRaw = isPlainObject(options.semanticRoleMap) ? options.semanticRoleMap : null;
   if (explicitRoleMapRaw) {
      for (const [rawKey, rawValue] of Object.entries(explicitRoleMapRaw)) {
         const key = toNonEmptyTrimmedString(rawKey);
         if (!key) {
            fail('INVALID_ADAPTER_CONTRACT', 'adapterPayload.semanticRoleMap keys must be non-empty strings.');
         }
         const normalizedRole = normalizeSemanticRoleName(key);
         const mapping = normalizeSemanticRoleMapValue(rawKey, rawValue, selectedDataModel);
         const roleClass = resolveRoleClass(normalizedRole, semanticRoleContracts);
         if (roleClass) {
            explicitByRole.set(normalizedRole, mapping);
         } else {
            explicitByColumnID.set(key, mapping);
         }
      }
   }

   const referencedColumnIDs = new Set();
   collectColumnIDsFromValue(workbookJson, referencedColumnIDs);

   const usedExpressions = new Set();
   const unresolved = [];
   const incompatibleMappings = [];
   const rebindingTrace = [];
   const skippedUnreferencedColumns = [];
   const resolvedRoles = new Set();
   const explicitMappingsApplied = [];

   for (let index = 0; index < criteriaColumns.length; index += 1) {
      const criteriaColumn = criteriaColumns[index];
      const columnID = toNonEmptyTrimmedString(criteriaColumn?.columnID);
      if (!columnID) {
         continue;
      }
      const inferredRole = inferSemanticRoleFromColumnID(columnID, semanticRoleContracts);
      const explicitMapping = explicitByColumnID.get(columnID)
         || (inferredRole ? explicitByRole.get(inferredRole) : null)
         || null;
      const shouldBind = referencedColumnIDs.has(columnID) || explicitMapping != null;
      if (!shouldBind) {
         skippedUnreferencedColumns.push(columnID);
         continue;
      }

      const configuredRoleClass = resolveRoleClass(inferredRole, semanticRoleContracts);
      let desiredClass = configuredRoleClass || inferColumnClassFromID(columnID) || 'dimension';
      if (desiredClass === 'temporal' && allowTemporalFallbackToDimension) {
         desiredClass = 'dimension';
      }
      const roleHints = inferredRole && Array.isArray(roleTokenHints[inferredRole]) ? roleTokenHints[inferredRole] : [];
      const desiredTokens = collectDesiredTokensForCriteriaColumn(criteriaColumn, columnID, roleHints);
      const candidatePool = descriptorsByClass[desiredClass]?.length > 0
         ? descriptorsByClass[desiredClass]
         : describeDescriptors;
      let selectedDescriptor = null;
      if (explicitMapping) {
         const explicitDescriptor = descriptorByExpression.get(explicitMapping.expression) || null;
         if (!explicitDescriptor) {
            incompatibleMappings.push(
               `columnID '${columnID}' mapped expression '${explicitMapping.expression}' is not present in adapterPayload.describe.columns.`
            );
            continue;
         }
         if (desiredClass === 'measure' && !(explicitDescriptor.columnClass === 'measure' || explicitDescriptor.isNumericDataType)) {
            incompatibleMappings.push(
               `columnID '${columnID}' explicit mapping '${explicitMapping.expression}' is not measure-compatible.`
            );
            continue;
         }
         if (desiredClass === 'temporal' && !(explicitDescriptor.columnClass === 'temporal' || explicitDescriptor.isTemporalDataType)) {
            incompatibleMappings.push(
               `columnID '${columnID}' explicit mapping '${explicitMapping.expression}' is not temporal-compatible.`
            );
            continue;
         }
         selectedDescriptor = explicitDescriptor;
         explicitMappingsApplied.push({
            columnID,
            role: inferredRole || null,
            expression: explicitMapping.expression,
            reason: explicitMapping.reason || null
         });
      } else {
         const ranked = candidatePool
            .map((candidate) => ({
               candidate,
               score: scoreDescribeCandidateForColumn(columnID, desiredTokens, candidate, desiredClass),
               alreadyUsed: usedExpressions.has(candidate.directExpression)
            }))
            .sort((left, right) => {
               if (right.score !== left.score) {
                  return right.score - left.score;
               }
               return left.candidate.directExpression.localeCompare(right.candidate.directExpression);
            });

         const selected = ranked.find((entry) => !entry.alreadyUsed)
            || ranked[0]
            || null;
         if (!selected) {
            unresolved.push(
               `columnID '${columnID}' (role=${inferredRole || 'unclassified'}, class=${desiredClass}) has no deterministic describe_data match.`
            );
            continue;
         }
         selectedDescriptor = selected.candidate;
      }

      usedExpressions.add(selectedDescriptor.directExpression);
      if (!isPlainObject(criteriaColumn.columnFormula)) {
         criteriaColumn.columnFormula = {};
      }
      if (!isPlainObject(criteriaColumn.columnFormula.expr)) {
         criteriaColumn.columnFormula.expr = {};
      }
      criteriaColumn.columnFormula.expr.type = 'sawx:sqlExpression';
      criteriaColumn.columnFormula.expr.expression = selectedDescriptor.directExpression;
      if (!Array.isArray(criteriaColumn.columnFormula.expr.children)) {
         criteriaColumn.columnFormula.expr.children = [];
      }
      if (!toNonEmptyTrimmedString(criteriaColumn?.columnHeading?.caption?.text)
         && toNonEmptyTrimmedString(selectedDescriptor.displayName)) {
         if (!isPlainObject(criteriaColumn.columnHeading)) {
            criteriaColumn.columnHeading = {};
         }
         if (!isPlainObject(criteriaColumn.columnHeading.caption)) {
            criteriaColumn.columnHeading.caption = {};
         }
         criteriaColumn.columnHeading.caption.text = selectedDescriptor.displayName;
      }
      if (inferredRole) {
         resolvedRoles.add(inferredRole);
      }
      rebindingTrace.push({
         columnID,
         role: inferredRole || null,
         expression: selectedDescriptor.directExpression,
         columnClass: desiredClass
      });
   }

   if (incompatibleMappings.length > 0) {
      fail(
         'INCOMPATIBLE_ROLE_MAPPING',
         `compose_ootb semanticRoleMap validation failed: ${incompatibleMappings.join(' ')}`
      );
   }
   if (unresolved.length > 0) {
      fail(
         'UNRESOLVED_CRITERIA_BINDING',
         `compose_ootb criteria rebinding failed: ${unresolved.join(' ')} ` +
         "Provide adapterPayload.semanticRoleMap for explicit role overrides when dataset vocabulary differs from scaffold defaults."
      );
   }

   const criteriaByID = new Map();
   for (let index = 0; index < criteriaColumns.length; index += 1) {
      const column = criteriaColumns[index];
      const columnID = toNonEmptyTrimmedString(column?.columnID);
      if (!columnID || criteriaByID.has(columnID)) {
         continue;
      }
      criteriaByID.set(columnID, {
         column,
         index
      });
   }
   const validationErrors = [];
   for (const referencedID of referencedColumnIDs) {
      if (referencedID === EMBEDDED_VIZ_DUMMY_MEASURE_LINK_COLUMN_ID) {
         continue;
      }
      const criteriaEntry = criteriaByID.get(referencedID);
      if (!criteriaEntry) {
         validationErrors.push(`Referenced columnID '${referencedID}' is missing from criteria.columns.`);
         continue;
      }
      const expression = toNonEmptyTrimmedString(criteriaEntry.column?.columnFormula?.expr?.expression);
      const directParsed = parseDirectColumnExpression(expression);
      if (!directParsed) {
         continue;
      }
      if (directParsed.subjectAreaToken !== selectedDataModel) {
         validationErrors.push(
            `columnID '${referencedID}' expression uses subjectArea '${directParsed.subjectAreaToken}' but selectedDataModel is '${selectedDataModel}'.`
         );
      }
      if (!descriptorExpressionSet.has(expression)) {
         validationErrors.push(
            `columnID '${referencedID}' expression '${expression}' is not present in adapterPayload.describe.columns.`
         );
      }
   }
   if (requiredRoles.size > 0) {
      for (const requiredRole of requiredRoles) {
         if (requiredRole.startsWith('temporal.') && allowTemporalFallbackToDimension) {
            continue;
         }
         if (!resolvedRoles.has(requiredRole)) {
            validationErrors.push(
               `required semantic role '${requiredRole}' is unresolved for runtime families [${runtimeFamilies.join(', ')}].`
            );
         }
      }
   }

   if (validationErrors.length > 0) {
      fail(
         'UNRESOLVED_CRITERIA_BINDING',
         `compose_ootb post-bind validation failed: ${validationErrors.join(' ')}`
      );
   }

   return {
      reboundCount: rebindingTrace.length,
      reboundColumns: rebindingTrace,
      skippedUnreferencedColumns,
      resolvedRoles: Array.from(resolvedRoles).sort(),
      requiredRoles: Array.from(requiredRoles).sort(),
      explicitMappingsApplied
   };
}

function setNestedValue(target, dotPath, value) {
   const parts = dotPath.split('.');
   let cursor = target;
   for (let index = 0; index < parts.length - 1; index += 1) {
      const key = parts[index];
      if (!isPlainObject(cursor[key])) {
         cursor[key] = {};
      }
      cursor = cursor[key];
   }
   cursor[parts[parts.length - 1]] = value;
}

function deleteNestedValue(target, dotPath) {
   const parts = dotPath.split('.');
   let cursor = target;
   for (let index = 0; index < parts.length - 1; index += 1) {
      const key = parts[index];
      if (!isPlainObject(cursor?.[key])) {
         return false;
      }
      cursor = cursor[key];
   }
   const leafKey = parts[parts.length - 1];
   if (!Object.prototype.hasOwnProperty.call(cursor, leafKey)) {
      return false;
   }
   delete cursor[leafKey];
   return true;
}

function resolveCanvasTitle(canvas) {
   const canvasName = toNonEmptyTrimmedString(canvas?.name);
   if (canvasName) {
      return canvasName;
   }
   return toNonEmptyTrimmedString(canvas?.title);
}

function applyCanvasTitleIfProvided(canvasView, canvasSpec) {
   const canvasTitle = resolveCanvasTitle(canvasSpec);
   if (!canvasTitle) {
      return;
   }
   setNestedValue(canvasView, 'viewCaption.caption.text', canvasTitle);
   deleteNestedValue(canvasView, 'canvasConfig.settings.title');
}

function applyViewTitleIfProvided(pluginView, viewSpec) {
   const title = toNonEmptyTrimmedString(viewSpec?.labels?.title || viewSpec?.title);
   if (!title) {
      return false;
   }
   setNestedValue(pluginView, 'viewCaption.caption.text', title);
   return true;
}

function findFirstViewByType(workbookJson, typeName) {
   const views = Array.isArray(workbookJson?.views?.children) ? workbookJson.views.children : [];
   return views.find((view) => view && view.type === typeName) || null;
}

function applyFinalPluginType(pluginView, finalPluginType) {
   if (!pluginView || typeof pluginView !== 'object') {
      return;
   }
   pluginView.pluginType = finalPluginType;

   const autoviz = pluginView?.viewConfig?.settings?.['obitech-autoviz/autoviz'];
   if (autoviz && typeof autoviz === 'object') {
      autoviz.innerPluginType = finalPluginType;
   }

   const nestedViews = Array.isArray(pluginView?.nestedViews?.children) ? pluginView.nestedViews.children : [];
   for (const nested of nestedViews) {
      if (nested && nested.position === 'embedded' && nested.view && typeof nested.view === 'object') {
         nested.view.pluginType = finalPluginType;
      }
   }
}

function buildSplitLayoutCustomProps(layout) {
   const firstCellHeight = toNonEmptyTrimmedString(layout?.children?.[0]?.displayFormat?.formatSpec?.height);
   const numericHeight = firstCellHeight && /^\d+px$/.test(firstCellHeight)
      ? Number.parseInt(firstCellHeight, 10)
      : 720;
   return {
      _version: '1.0.1',
      'oracle.bi.tech.layout.split': {
         layoutMinSize: {
            width: '100%',
            height: Number.isFinite(numericHeight) ? numericHeight : 720
         },
         _version: '1.0.0'
      }
   };
}

function normalizeLayoutCustomPropsSerialization(workbookJson) {
   const layouts = Array.isArray(workbookJson?.layouts?.children) ? workbookJson.layouts.children : [];
   for (const layout of layouts) {
      if (!isPlainObject(layout)) {
         continue;
      }
      if (layout.type !== 'oracle.bi.tech.layout.split' && !isPlainObject(layout?.layoutProps?.customProps)) {
         continue;
      }
      if (!isPlainObject(layout.layoutProps)) {
         layout.layoutProps = {};
      }
      if (!isPlainObject(layout.layoutProps.customProps)) {
         layout.layoutProps.customProps = {};
      }
      const customProps = layout.layoutProps.customProps;
      if (isPlainObject(customProps.text)) {
         customProps.text = JSON.stringify(customProps.text);
         continue;
      }
      if (typeof customProps.text === 'string' && customProps.text.trim() !== '') {
         try {
            const parsed = JSON.parse(customProps.text);
            if (isPlainObject(parsed)) {
               customProps.text = JSON.stringify(parsed);
            }
         } catch (_error) {
            // Keep the original string so strict validation can report the parse failure.
         }
         continue;
      }
      if (layout.type === 'oracle.bi.tech.layout.split') {
         customProps.text = JSON.stringify(buildSplitLayoutCustomProps(layout));
      }
   }
}

function buildComposeCell(viewName, left, top, width, height, zIndex) {
   return {
      content: {
         viewName,
         type: 'view'
      },
      left: String(left),
      top: String(top),
      zIndex,
      displayFormat: {
         formatSpec: {
            width: `${width}px`,
            height: `${height}px`
         }
      }
   };
}

function collectCriteriaColumns(workbookJson) {
   return Array.isArray(workbookJson?.criteria?.columns?.children)
      ? workbookJson.criteria.columns.children
      : [];
}

function buildCriteriaColumnMap(workbookJson) {
   const byID = new Map();
   for (const column of collectCriteriaColumns(workbookJson)) {
      const columnID = toNonEmptyTrimmedString(column?.columnID);
      if (!columnID || byID.has(columnID)) {
         continue;
      }
      byID.set(columnID, column);
   }
   return byID;
}

function canonicalizeDirectExpression(expression) {
   const parsed = parseDirectColumnExpression(expression);
   return parsed
      ? buildDirectColumnExpression(parsed.subjectAreaToken, parsed.tableName, parsed.columnName)
      : toNonEmptyTrimmedString(expression);
}

function buildCriteriaExpressionIndex(workbookJson) {
   const byExpression = new Map();
   const byColumnID = buildCriteriaColumnMap(workbookJson);
   for (const [columnID, column] of byColumnID.entries()) {
      const expression = canonicalizeDirectExpression(column?.columnFormula?.expr?.expression);
      if (!expression) {
         continue;
      }
      const key = expression.toLowerCase();
      if (!byExpression.has(key)) {
         byExpression.set(key, columnID);
      }
   }
   return {
      byExpression,
      byColumnID
   };
}

function inferCriteriaColumnPrefix(role, roleClass) {
   const normalizedRole = normalizeSemanticRoleName(role);
   const normalizedClass = toNonEmptyTrimmedString(roleClass);
   if (normalizedClass === 'measure' || normalizedRole?.startsWith('measure.')) {
      return 'mea';
   }
   if (normalizedClass === 'temporal' || normalizedRole?.startsWith('temporal.')) {
      return 'time';
   }
   return 'dim';
}

function sanitizeCriteriaColumnIDFragment(value) {
   const normalized = toNonEmptyTrimmedString(value);
   if (!normalized) {
      return 'binding';
   }
   const sanitized = normalized
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
   return sanitized || 'binding';
}

function allocateCriteriaColumnID(existingColumnIDs, prefix, viewID, role) {
   const baseViewID = sanitizeCriteriaColumnIDFragment(viewID).slice(0, 36);
   const baseRole = sanitizeCriteriaColumnIDFragment(role).slice(0, 24);
   const baseID = `${prefix}_req_${baseViewID}_${baseRole}`;
   let candidate = baseID;
   let suffix = 2;
   while (existingColumnIDs.has(candidate)) {
      candidate = `${baseID}_${suffix}`;
      suffix += 1;
   }
   existingColumnIDs.add(candidate);
   return candidate;
}

function buildCriteriaColumnForExpression(expression, columnID, sourceColumn) {
   const parsed = parseDirectColumnExpression(expression);
   const column = sourceColumn ? deepClone(sourceColumn) : {
      type: 'saw:regularColumn',
      columnFormula: {
         expr: {
            type: 'sawx:sqlExpression',
            children: []
         }
      },
      columnHeading: {
         caption: {}
      }
   };
   column.columnID = columnID;
   column.type = 'saw:regularColumn';
   if (!isPlainObject(column.columnFormula)) {
      column.columnFormula = {};
   }
   column.columnFormula.expr = {
      type: 'sawx:sqlExpression',
      expression,
      children: []
   };
   if (!isPlainObject(column.columnHeading)) {
      column.columnHeading = {};
   }
   if (!isPlainObject(column.columnHeading.caption)) {
      column.columnHeading.caption = {};
   }
   column.columnHeading.caption.text = parsed?.columnName || columnID;
   return column;
}

function replaceColumnIDsInObject(value, columnIDMap) {
   if (!value || typeof value !== 'object') {
      return 0;
   }
   let replacementCount = 0;
   if (Array.isArray(value)) {
      for (const entry of value) {
         replacementCount += replaceColumnIDsInObject(entry, columnIDMap);
      }
      return replacementCount;
   }
   for (const [key, nestedValue] of Object.entries(value)) {
      if (typeof nestedValue === 'string') {
         if ((key === 'columnID' || key === 'valueColumnID' || key === 'sColumnID') && columnIDMap.has(nestedValue)) {
            value[key] = columnIDMap.get(nestedValue);
            replacementCount += 1;
            continue;
         }
         if (key === 'id') {
            const sourceColumnIDs = Array.from(columnIDMap.keys())
               .filter(Boolean)
               .sort((left, right) => right.length - left.length);
            const replacementPattern = sourceColumnIDs.length > 0
               ? new RegExp(sourceColumnIDs.map((columnID) => columnID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
               : null;
            const rewritten = replacementPattern
               ? nestedValue.replace(replacementPattern, (columnID) => columnIDMap.get(columnID))
               : nestedValue;
            if (rewritten !== nestedValue) {
               value[key] = rewritten;
               replacementCount += 1;
            }
         }
         continue;
      }
      replacementCount += replaceColumnIDsInObject(nestedValue, columnIDMap);
   }
   return replacementCount;
}

function collectColumnReferenceIDs(value, columnIDs = new Set()) {
   if (!value || typeof value !== 'object') {
      return columnIDs;
   }
   if (Array.isArray(value)) {
      for (const entry of value) {
         collectColumnReferenceIDs(entry, columnIDs);
      }
      return columnIDs;
   }
   for (const [key, nestedValue] of Object.entries(value)) {
      if ((key === 'columnID' || key === 'valueColumnID' || key === 'sColumnID')
         && typeof nestedValue === 'string' && nestedValue.trim() !== '') {
         columnIDs.add(nestedValue.trim());
      }
      collectColumnReferenceIDs(nestedValue, columnIDs);
   }
   return columnIDs;
}

function collectAnalysisRequirementViewsByID(analysisRequirements) {
   const byID = new Map();
   const canvases = Array.isArray(analysisRequirements?.canvases) ? analysisRequirements.canvases : [];
   for (const canvas of canvases) {
      const views = Array.isArray(canvas?.views) ? canvas.views : [];
      for (const view of views) {
         const viewID = toNonEmptyTrimmedString(view?.id);
         if (!viewID || byID.has(viewID)) {
            continue;
         }
         byID.set(viewID, view);
      }
   }
   return byID;
}

function findCriteriaColumnTemplate(criteriaColumns, sourceColumnID, roleClass) {
   const sourceColumn = criteriaColumns.find((column) => toNonEmptyTrimmedString(column?.columnID) === sourceColumnID);
   if (sourceColumn) {
      return sourceColumn;
   }
   return criteriaColumns.find((column) => inferColumnClassFromID(column?.columnID) === roleClass) || criteriaColumns[0] || null;
}

function buildMaterializedColumnLayer(entry, options = {}) {
   return {
      columnID: entry.columnID,
      type: 'column',
      ...(entry.duplicateID ? { duplicateID: entry.duplicateID } : {}),
      ...(options.isUsed === true ? { isUsed: true } : {}),
      ...(entry.aggregation ? { aggRule: entry.aggregation } : {})
   };
}

function assignMaterializedDuplicateIDs(entryGroups) {
   const occurrenceCountByColumnID = new Map();
   return entryGroups.map((entries) => entries.map((entry) => {
      const columnID = toNonEmptyTrimmedString(entry?.columnID);
      if (!columnID) {
         return entry;
      }
      const occurrenceCount = occurrenceCountByColumnID.get(columnID) || 0;
      occurrenceCountByColumnID.set(columnID, occurrenceCount + 1);
      return occurrenceCount === 0
         ? { ...entry }
         : { ...entry, duplicateID: `${columnID}_d${occurrenceCount}` };
   }));
}

function applyPlanningColumnMetadata(pluginView, metadataByColumnID, sortEntries) {
   let aggregationApplicationCount = 0;
   let sortApplicationCount = 0;
   const appliedAggregationKeys = new Set();
   const appliedSortKeys = new Set();

   const visit = (value, pathKeys = []) => {
      if (!value || typeof value !== 'object') {
         return;
      }
      if (Array.isArray(value)) {
         for (const entry of value) {
            visit(entry, pathKeys);
         }
         return;
      }
      const columnID = toNonEmptyTrimmedString(value.columnID);
      if (columnID) {
         const metadata = metadataByColumnID.get(columnID);
         const containerKey = pathKeys.at(-1) || null;
         const ownerKey = pathKeys.at(-2) || null;
         const isColumnLayer = containerKey === 'logicalEdgeLayers'
            || (containerKey === 'children' && ownerKey === 'edgeLayers')
            || (containerKey === 'children' && ownerKey === 'measuresList' && value.type === 'column');
         if (metadata?.aggregation && isColumnLayer) {
            value.aggRule = metadata.aggregation;
            const key = `${columnID}|${metadata.aggregation}|${pathKeys.join('.')}`;
            if (!appliedAggregationKeys.has(key)) {
               appliedAggregationKeys.add(key);
               aggregationApplicationCount += 1;
            }
         }
         const matchingSorts = sortEntries.filter((entry) => entry.columnID === columnID);
         if (matchingSorts.length > 0 && containerKey === 'logicalEdgeLayers') {
            const sort = matchingSorts[0];
            value.columnSort = {
               direction: sort.direction,
               order: sort.order
            };
            const key = `${columnID}|${sort.direction}|${sort.order}`;
            if (!appliedSortKeys.has(key)) {
               appliedSortKeys.add(key);
               sortApplicationCount += 1;
            }
         }
      }
      for (const [key, nestedValue] of Object.entries(value)) {
         visit(nestedValue, [...pathKeys, key]);
      }
   };
   visit(pluginView);
   return {
      aggregationApplicationCount,
      sortApplicationCount
   };
}

function materializePivotBindingTopology(pluginView, topology) {
   const dataModel = pluginView?.dataModels?.children?.[0];
   const logicalDataModel = dataModel?.logicalDataModel?.settings?.logicalDataModel;
   if (!isPlainObject(dataModel) || !isPlainObject(logicalDataModel)) {
      fail('UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY', 'Pivot scaffold is missing its primary logical data model.');
   }
   const sourceRows = Array.isArray(topology?.rows) ? topology.rows : [];
   const sourceColumns = Array.isArray(topology?.columns) ? topology.columns : [];
   const sourceMeasures = Array.isArray(topology?.measures) ? topology.measures : [];
   const [rows, columns, measures] = assignMaterializedDuplicateIDs([
      sourceRows,
      sourceColumns,
      sourceMeasures
   ]);
   if (rows.length === 0 || columns.length === 0 || measures.length === 0) {
      fail(
         'UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY',
         'Pivot materialization requires at least one resolved row, column, and measure binding.'
      );
   }

   if (!isPlainObject(logicalDataModel.logicalEdges)) {
      logicalDataModel.logicalEdges = {};
   }
   const logicalEdges = logicalDataModel.logicalEdges;
   const buildLogicalLayers = (entries) => entries.map((entry) => buildMaterializedColumnLayer(entry, { isUsed: true }));
   logicalEdges.row = {
      ...(isPlainObject(logicalEdges.row) ? logicalEdges.row : {}),
      logicalEdgeLayers: buildLogicalLayers(rows)
   };
   logicalEdges.col = {
      ...(isPlainObject(logicalEdges.col) ? logicalEdges.col : {}),
      logicalEdgeLayers: buildLogicalLayers(columns)
   };
   logicalEdges.measures = {
      ...(isPlainObject(logicalEdges.measures) ? logicalEdges.measures : {}),
      logicalEdgeLayers: buildLogicalLayers(measures)
   };
   delete logicalEdges.column;

   if (!isPlainObject(dataModel.edges)) {
      dataModel.edges = { children: [] };
   }
   if (!Array.isArray(dataModel.edges.children)) {
      dataModel.edges.children = [];
   }
   const ensureExecutionEdge = (axis) => {
      let edge = dataModel.edges.children.find((candidate) => candidate?.axis === axis) || null;
      if (!edge) {
         edge = { axis, showColumnHeader: 'rollover' };
         if (axis === 'column') {
            edge.dependent = true;
         }
         dataModel.edges.children.push(edge);
      }
      return edge;
   };
   const buildPhysicalLayers = (entries) => entries.map((entry) => buildMaterializedColumnLayer(entry));
   const rowEdge = ensureExecutionEdge('row');
   rowEdge.edgeLayers = { children: buildPhysicalLayers(rows) };
   const columnEdge = ensureExecutionEdge('column');
   const existingMeasureMarker = Array.isArray(columnEdge?.edgeLayers?.children)
      ? columnEdge.edgeLayers.children.find((layer) => layer?.type === 'measure')
      : null;
   columnEdge.edgeLayers = {
      children: [
         ...buildPhysicalLayers(columns),
         isPlainObject(existingMeasureMarker)
            ? deepClone(existingMeasureMarker)
            : { type: 'measure', visibility: 'visible' }
      ]
   };
   dataModel.measuresList = {
      ...(isPlainObject(dataModel.measuresList) ? dataModel.measuresList : {}),
      children: buildLogicalLayers(measures)
   };

   return rows.length + columns.length + measures.length;
}

function materializeTableBindingTopology(pluginView, topology) {
   const dataModel = pluginView?.dataModels?.children?.[0];
   const logicalDataModel = dataModel?.logicalDataModel?.settings?.logicalDataModel;
   const sourceColumns = Array.isArray(topology?.columns) ? topology.columns : [];
   const [columns] = assignMaterializedDuplicateIDs([sourceColumns]);
   if (!isPlainObject(dataModel) || !isPlainObject(logicalDataModel)) {
      fail('UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY', 'Table scaffold is missing its primary logical data model.');
   }
   if (columns.length === 0 || columns.length > TABLE_MAX_COLUMN_COUNT) {
      fail(
         'UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY',
         `Table materialization requires between 1 and ${TABLE_MAX_COLUMN_COUNT} resolved column bindings.`
      );
   }

   if (!isPlainObject(logicalDataModel.logicalEdges)) {
      logicalDataModel.logicalEdges = {};
   }
   logicalDataModel.logicalEdges.row = {
      ...(isPlainObject(logicalDataModel.logicalEdges.row) ? logicalDataModel.logicalEdges.row : {}),
      logicalEdgeLayers: columns.map((entry) => ({
         ...buildMaterializedColumnLayer(entry, { isUsed: true })
      }))
   };
   delete logicalDataModel.logicalEdges.column;

   if (!isPlainObject(dataModel.edges)) {
      dataModel.edges = { children: [] };
   }
   if (!Array.isArray(dataModel.edges.children)) {
      dataModel.edges.children = [];
   }
   let rowEdge = dataModel.edges.children.find((candidate) => candidate?.axis === 'row') || null;
   if (!rowEdge) {
      rowEdge = { axis: 'row', showColumnHeader: 'true' };
      dataModel.edges.children.push(rowEdge);
   }
   rowEdge.edgeLayers = {
      children: columns.map((entry) => ({
         ...buildMaterializedColumnLayer(entry)
      }))
   };

   return columns.length;
}

function materializeScatterCategoricalColor(pluginView, colorColumnID) {
   const dataModel = pluginView?.dataModels?.children?.[0];
   const logicalDataModel = dataModel?.logicalDataModel?.settings?.logicalDataModel;
   const nestedEntry = (pluginView?.nestedViews?.children || []).find(
      (entry) => entry?.position === 'embedded' && entry?.view?.viewName === 'MeasureView_0'
   );
   const nestedDataModel = nestedEntry?.view?.dataModels?.children?.[0];
   if (!isPlainObject(dataModel) || !isPlainObject(logicalDataModel) || !isPlainObject(nestedDataModel)) {
      fail(
         'UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY',
         'Scatter categorical color requires the canonical primary data model and embedded MeasureView_0.'
      );
   }

   if (!isPlainObject(logicalDataModel.logicalEdges)) {
      logicalDataModel.logicalEdges = {};
   }
   logicalDataModel.logicalEdges.color = {
      ...(isPlainObject(logicalDataModel.logicalEdges.color) ? logicalDataModel.logicalEdges.color : {}),
      logicalEdgeLayers: [
         {
            columnID: colorColumnID,
            type: 'column',
            isUsed: true
         }
      ]
   };

   if (!isPlainObject(nestedDataModel.edges)) {
      nestedDataModel.edges = { children: [] };
   }
   if (!Array.isArray(nestedDataModel.edges.children)) {
      nestedDataModel.edges.children = [];
   }
   let columnEdge = nestedDataModel.edges.children.find((edge) => edge?.axis === 'column') || null;
   if (!columnEdge) {
      columnEdge = {
         axis: 'column',
         showColumnHeader: 'rollover',
         dependent: true
      };
      nestedDataModel.edges.children.push(columnEdge);
   }
   columnEdge.edgeLayers = {
      children: [
         {
            type: 'column',
            columnID: colorColumnID
         },
         {
            type: 'measure',
            visibility: 'hidden'
         }
      ]
   };

   const nestedMeasures = Array.isArray(nestedDataModel?.measuresList?.children)
      ? nestedDataModel.measuresList.children
      : [];
   for (const measure of nestedMeasures) {
      const additions = Array.isArray(measure?.propertyAdditions?.children)
         ? measure.propertyAdditions.children
         : null;
      if (!additions) {
         continue;
      }
      const retained = additions.filter((entry) => !['colorMin', 'colorMax', 'color'].includes(entry?.id));
      if (retained.length > 0) {
         measure.propertyAdditions.children = retained;
      } else {
         delete measure.propertyAdditions;
      }
   }

   return 1;
}

function materializeComposeViewBindings(workbookJson, analysisRequirements, viewAssignments, selectedDataModel, semanticRoleContracts) {
   const criteriaColumns = collectCriteriaColumns(workbookJson);
   const criteriaIndex = buildCriteriaExpressionIndex(workbookJson);
   const existingColumnIDs = new Set(criteriaIndex.byColumnID.keys());
   const pluginViewByName = new Map(
      collectPluginViews(workbookJson)
         .map((entry) => [toNonEmptyTrimmedString(entry?.view?.viewName), entry.view])
         .filter(([viewName]) => Boolean(viewName))
   );
   const requirementViewByID = collectAnalysisRequirementViewsByID(analysisRequirements);
   const summary = {
      materializedViewCount: 0,
      materializedBindingCount: 0,
      createdCriteriaColumnCount: 0,
      rewrittenColumnReferenceCount: 0,
      pivotTopologyMaterializedViewCount: 0,
      pivotTopologyBindingCount: 0,
      tableTopologyMaterializedViewCount: 0,
      tableTopologyBindingCount: 0,
      scatterCategoricalColorMaterializedViewCount: 0,
      scatterCategoricalColorBindingCount: 0,
      aggregationApplicationCount: 0,
      sortApplicationCount: 0,
      formatSpecsByColumnID: {},
      skippedBindingCount: 0,
      skippedBindings: []
   };
   const mergeColumnMetadata = (metadataByColumnID, columnID, nextMetadata, sourcePath) => {
      const existingMetadata = metadataByColumnID.get(columnID) || {};
      const existingAggregation = toNonEmptyTrimmedString(existingMetadata.aggregation);
      const nextAggregation = toNonEmptyTrimmedString(nextMetadata.aggregation);
      if (existingAggregation && nextAggregation && existingAggregation !== nextAggregation) {
         fail(
            'CONFLICTING_PLANNING_COLUMN_METADATA',
            `${sourcePath} requests aggregation '${nextAggregation}' for criteria column '${columnID}', ` +
               `which already uses aggregation '${existingAggregation}' in the same generated view.`
         );
      }
      const existingFormat = isPlainObject(existingMetadata.format) ? existingMetadata.format : null;
      const nextFormat = isPlainObject(nextMetadata.format) ? nextMetadata.format : null;
      if (existingFormat && nextFormat && !deepEqualsJsonValue(existingFormat, nextFormat)) {
         fail(
            'CONFLICTING_PLANNING_COLUMN_METADATA',
            `${sourcePath} requests a format for criteria column '${columnID}' that conflicts with another binding in the same generated view.`
         );
      }
      metadataByColumnID.set(columnID, {
         aggregation: nextAggregation || existingAggregation || null,
         format: deepClone(nextFormat || existingFormat)
      });
   };

   for (const assignment of viewAssignments) {
      const requestedViewID = toNonEmptyTrimmedString(assignment?.requestedViewID);
      const viewName = toNonEmptyTrimmedString(assignment?.viewName);
      const requirementView = requestedViewID ? requirementViewByID.get(requestedViewID) : null;
      const pluginView = viewName ? pluginViewByName.get(viewName) : null;
      const bindings = isPlainObject(requirementView?.bindings) ? requirementView.bindings : null;
      if (!requestedViewID || !viewName || !requirementView || !pluginView || !bindings) {
         continue;
      }

      const columnIDMap = new Map();
      const targetColumnIDByRole = new Map();
      const metadataByColumnID = new Map();
      const scaffoldColumnIDs = collectColumnReferenceIDs(pluginView);
      const scaffoldBindingSlots = isPlainObject(assignment?.bindingSlots) ? assignment.bindingSlots : {};
      const topologyManagesBindings = (pluginView.pluginType === 'oracle.bi.tech.table' && isPlainObject(requirementView.tableTopology))
         || (pluginView.pluginType === 'oracle.bi.tech.pivot' && isPlainObject(requirementView.pivotTopology));
      let viewBindingCount = 0;
      for (const [rawRole, binding] of Object.entries(bindings)) {
         const role = normalizeSemanticRoleName(rawRole);
         const expressionCandidate = toNonEmptyTrimmedString(binding) || toNonEmptyTrimmedString(binding?.expression);
         const parsed = parseDirectColumnExpression(expressionCandidate);
         const explicitSourceColumnID = toNonEmptyTrimmedString(binding?.columnID);
         const contractedSourceColumnID = role ? toNonEmptyTrimmedString(scaffoldBindingSlots[role]) : null;
         const sourceColumnID = explicitSourceColumnID
            || contractedSourceColumnID
            || (role ? PLANNING_ROLE_TO_CANONICAL_COLUMN_ID[role] : null);
         if (!role || !parsed || !sourceColumnID) {
            summary.skippedBindingCount += 1;
            summary.skippedBindings.push({
               requestedViewID,
               viewName,
               role: role || rawRole,
               reason: !parsed ? 'non_direct_expression' : 'missing_source_column_id'
            });
            continue;
         }
         const scatterManagesRole = pluginView.pluginType === 'oracle.bi.tech.chart.scatter' && role === 'dimension.secondary';
         if (!topologyManagesBindings && !scatterManagesRole && !scaffoldColumnIDs.has(sourceColumnID)) {
            fail(
               'UNRESOLVED_SCAFFOLD_BINDING_SLOT',
               `View '${requestedViewID}' (${pluginView.pluginType}) cannot materialize semantic role '${role}' because scaffold ` +
                  `'${assignment?.scaffoldTemplateId || 'unknown'}' does not reference column slot '${sourceColumnID}'. ` +
                  `Add a source-backed bindingSlots entry to the scaffold contract or provide a verified explicit binding columnID.`
            );
         }
         if (parsed.subjectAreaToken !== selectedDataModel) {
            fail(
               'INVALID_REQUEST_CONTRACT',
               `analysisRequirements view '${requestedViewID}' binding '${role}' uses subjectArea '${parsed.subjectAreaToken}' but selectedDataModel is '${selectedDataModel}'.`
            );
         }
         const expression = buildDirectColumnExpression(parsed.subjectAreaToken, parsed.tableName, parsed.columnName);
         const expressionKey = expression.toLowerCase();
         let targetColumnID = criteriaIndex.byExpression.get(expressionKey) || null;
         if (!targetColumnID) {
            const roleClass = resolveRoleClass(role, semanticRoleContracts) || inferColumnClassFromID(sourceColumnID) || 'dimension';
            const prefix = inferCriteriaColumnPrefix(role, roleClass);
            targetColumnID = allocateCriteriaColumnID(existingColumnIDs, prefix, requestedViewID, role);
            const templateColumn = findCriteriaColumnTemplate(criteriaColumns, sourceColumnID, roleClass);
            const createdColumn = buildCriteriaColumnForExpression(expression, targetColumnID, templateColumn);
            criteriaColumns.push(createdColumn);
            criteriaIndex.byColumnID.set(targetColumnID, createdColumn);
            criteriaIndex.byExpression.set(expressionKey, targetColumnID);
            summary.createdCriteriaColumnCount += 1;
         }
         const existingTarget = columnIDMap.get(sourceColumnID);
         if (existingTarget && existingTarget !== targetColumnID) {
            fail(
               'UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY',
               `View '${requestedViewID}' maps source column '${sourceColumnID}' to multiple requested binding expressions. ` +
               `The selected scaffold cannot represent roles '${role}' and earlier bindings independently.`
            );
         }
         columnIDMap.set(sourceColumnID, targetColumnID);
         targetColumnIDByRole.set(role, targetColumnID);
         if (binding?.aggregation || binding?.format) {
            mergeColumnMetadata(metadataByColumnID, targetColumnID, {
               aggregation: toNonEmptyTrimmedString(binding.aggregation),
               format: isPlainObject(binding.format) ? deepClone(binding.format) : null
            }, `View '${requestedViewID}' binding '${role}'`);
         }
         viewBindingCount += 1;
      }

      if (columnIDMap.size === 0) {
         continue;
      }
      const rewriteCount = replaceColumnIDsInObject(pluginView, columnIDMap);
      const resolveTopologyEntries = (entries, topologyKind, edgeName) => entries.map((entry, index) => {
         const expressionCandidate = toNonEmptyTrimmedString(entry?.expression);
         const parsed = parseDirectColumnExpression(expressionCandidate);
         if (!parsed || parsed.subjectAreaToken !== selectedDataModel) {
            fail(
               'INVALID_REQUEST_CONTRACT',
               `${topologyKind} view '${requestedViewID}' ${edgeName}[${index}] must resolve to a direct expression in selectedDataModel '${selectedDataModel}'.`
            );
         }
         const expression = buildDirectColumnExpression(parsed.subjectAreaToken, parsed.tableName, parsed.columnName);
         const expressionKey = expression.toLowerCase();
         let targetColumnID = criteriaIndex.byExpression.get(expressionKey) || null;
         if (!targetColumnID) {
            const roleClass = toNonEmptyTrimmedString(entry?.columnClass)
               || (edgeName === 'measures' ? 'measure' : 'dimension');
            const allocationRole = `${topologyKind.toLowerCase()}_${edgeName}_${index + 1}`;
            const prefix = inferCriteriaColumnPrefix(entry?.role, roleClass);
            targetColumnID = allocateCriteriaColumnID(existingColumnIDs, prefix, requestedViewID, allocationRole);
            const templateColumn = findCriteriaColumnTemplate(
               criteriaColumns,
               toNonEmptyTrimmedString(entry?.templateColumnID),
               roleClass
            );
            const createdColumn = buildCriteriaColumnForExpression(expression, targetColumnID, templateColumn);
            criteriaColumns.push(createdColumn);
            criteriaIndex.byColumnID.set(targetColumnID, createdColumn);
            criteriaIndex.byExpression.set(expressionKey, targetColumnID);
            summary.createdCriteriaColumnCount += 1;
         }
         if (entry?.aggregation || entry?.format) {
            mergeColumnMetadata(metadataByColumnID, targetColumnID, {
               aggregation: toNonEmptyTrimmedString(entry.aggregation),
               format: isPlainObject(entry.format) ? deepClone(entry.format) : null
            }, `${topologyKind} view '${requestedViewID}' ${edgeName}[${index}]`);
         }
         return {
            columnID: targetColumnID,
            expression,
            aggregation: toNonEmptyTrimmedString(entry?.aggregation),
            format: isPlainObject(entry?.format) ? deepClone(entry.format) : null
         };
      });
      let pivotTopologyBindingCount = 0;
      if (pluginView.pluginType === 'oracle.bi.tech.pivot' && isPlainObject(requirementView.pivotTopology)) {
         pivotTopologyBindingCount = materializePivotBindingTopology(pluginView, {
            rows: resolveTopologyEntries(requirementView.pivotTopology.rows || [], 'Pivot', 'rows'),
            columns: resolveTopologyEntries(requirementView.pivotTopology.columns || [], 'Pivot', 'columns'),
            measures: resolveTopologyEntries(requirementView.pivotTopology.measures || [], 'Pivot', 'measures')
         });
         summary.pivotTopologyMaterializedViewCount += 1;
         summary.pivotTopologyBindingCount += pivotTopologyBindingCount;
      }
      let tableTopologyBindingCount = 0;
      if (pluginView.pluginType === 'oracle.bi.tech.table' && isPlainObject(requirementView.tableTopology)) {
         tableTopologyBindingCount = materializeTableBindingTopology(pluginView, {
            columns: resolveTopologyEntries(requirementView.tableTopology.columns || [], 'Table', 'columns')
         });
         summary.tableTopologyMaterializedViewCount += 1;
         summary.tableTopologyBindingCount += tableTopologyBindingCount;
      }
      let scatterCategoricalColorBindingCount = 0;
      const scatterColorColumnID = targetColumnIDByRole.get('dimension.secondary');
      if (pluginView.pluginType === 'oracle.bi.tech.chart.scatter' && scatterColorColumnID) {
         scatterCategoricalColorBindingCount = materializeScatterCategoricalColor(pluginView, scatterColorColumnID);
         summary.scatterCategoricalColorMaterializedViewCount += 1;
         summary.scatterCategoricalColorBindingCount += scatterCategoricalColorBindingCount;
      }
      const resolvedSortEntries = (Array.isArray(requirementView.sort) ? requirementView.sort : []).map((sort, sortIndex) => {
         const expression = canonicalizeDirectExpression(sort?.expression);
         const columnID = expression ? criteriaIndex.byExpression.get(expression.toLowerCase()) : null;
         if (!columnID) {
            fail(
               'UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY',
               `View '${requestedViewID}' sort[${sortIndex}] does not resolve to a materialized criteria column.`
            );
         }
         return {
            columnID,
            direction: sort.direction,
            order: sortIndex
         };
      });
      const metadataSummary = applyPlanningColumnMetadata(pluginView, metadataByColumnID, resolvedSortEntries);
      summary.aggregationApplicationCount += metadataSummary.aggregationApplicationCount;
      summary.sortApplicationCount += metadataSummary.sortApplicationCount;
      for (const [columnID, metadata] of metadataByColumnID.entries()) {
         if (metadata.format) {
            const existingFormat = summary.formatSpecsByColumnID[columnID];
            if (existingFormat && !deepEqualsJsonValue(existingFormat, metadata.format)) {
               fail(
                  'CONFLICTING_PLANNING_COLUMN_METADATA',
                  `Criteria column '${columnID}' requests conflicting number formats across generated views.`
               );
            }
            summary.formatSpecsByColumnID[columnID] = deepClone(metadata.format);
         }
      }
      if (rewriteCount > 0 || pivotTopologyBindingCount > 0 || tableTopologyBindingCount > 0 || scatterCategoricalColorBindingCount > 0) {
         summary.materializedViewCount += 1;
         summary.materializedBindingCount += viewBindingCount;
         summary.rewrittenColumnReferenceCount += rewriteCount;
      }
   }

   return summary;
}

function collectPluginViews(workbookJson) {
   const views = Array.isArray(workbookJson?.views?.children) ? workbookJson.views.children : [];
   const pluginViews = [];
   for (let index = 0; index < views.length; index += 1) {
      const view = views[index];
      if (!view || typeof view !== 'object' || view.type !== 'saw:pluginView') {
         continue;
      }
      pluginViews.push({
         index,
         view
      });
   }
   return pluginViews;
}

function normalizeTextboxRuntimeText(workbookJson, viewConfigDefaultVersion) {
   const remediations = [];
   const pluginViews = collectPluginViews(workbookJson);
   for (const [position, entry] of pluginViews.entries()) {
      const pluginView = entry?.view;
      if (toNonEmptyTrimmedString(pluginView?.pluginType) !== 'oracle.bi.tech.textbox') {
         continue;
      }
      const runtimeBodyText = getTextboxRuntimeBodyText(pluginView);
      if (runtimeBodyText) {
         continue;
      }
      const migrationResult = migrateSignalLegacyTextToCanonical(pluginView, textboxRuntimePathSignal);
      if (!migrationResult?.migrated) {
         continue;
      }
      if (!setTextboxBodyText(pluginView, migrationResult.text, viewConfigDefaultVersion)) {
         continue;
      }
      remediations.push({
         viewName: toNonEmptyTrimmedString(pluginView?.viewName) || `plugin_view_${position + 1}`,
         source: migrationResult.source || 'legacy_path',
         text: migrationResult.text
      });
   }
   return {
      normalizedCount: remediations.length,
      remediations
   };
}

function collectCanvasViews(workbookJson) {
   const views = Array.isArray(workbookJson?.views?.children) ? workbookJson.views.children : [];
   return views.filter((view) => view && typeof view === 'object' && view.type === 'saw:canvas');
}

function collectFilterControlCollections(workbookJson) {
   return Array.isArray(workbookJson?.filterControlCollections?.children)
      ? workbookJson.filterControlCollections.children.filter((entry) => entry && typeof entry === 'object')
      : [];
}

function collectFilterControlCollectionNames(workbookJson) {
   const names = [];
   const seen = new Set();
   for (const entry of collectFilterControlCollections(workbookJson)) {
      const name = toNonEmptyTrimmedString(entry?.name);
      if (!name || seen.has(name)) {
         continue;
      }
      seen.add(name);
      names.push(name);
   }
   return names;
}

function normalizeFilterControlHostingForFilterBar(workbookJson) {
   const collectionNames = collectFilterControlCollectionNames(workbookJson);
   if (collectionNames.length === 0) {
      return;
   }

   const defaultCollectionName = collectionNames[0];

   const layouts = Array.isArray(workbookJson?.layouts?.children) ? workbookJson.layouts.children : [];
   for (const layout of layouts) {
      if (!layout || typeof layout !== 'object' || !Array.isArray(layout.children)) {
         continue;
      }
      for (const cell of layout.children) {
         if (!cell || typeof cell !== 'object') {
            continue;
         }
         if ('filterControlCollectionName' in cell) {
            delete cell.filterControlCollectionName;
         }
      }
   }

   for (const canvasView of collectCanvasViews(workbookJson)) {
      const existingName = toNonEmptyTrimmedString(canvasView?.filterControlCollectionRef?.name);
      if (existingName && collectionNames.includes(existingName)) {
         continue;
      }
      canvasView.filterControlCollectionRef = { name: defaultCollectionName };
   }

   for (const collection of collectFilterControlCollections(workbookJson)) {
      const controls = Array.isArray(collection?.filterControls?.children)
         ? collection.filterControls.children
         : [];
      for (const control of controls) {
         if (!control || typeof control !== 'object') {
            continue;
         }
         if (!isPlainObject(control.filterControlConfig)) {
            control.filterControlConfig = {};
         }
         if (!isPlainObject(control.filterControlConfig.settings)) {
            control.filterControlConfig.settings = {};
         }
         control.filterControlConfig.settings.location = 'filter_bar';
         if ('filterViz' in control.filterControlConfig.settings) {
            delete control.filterControlConfig.settings.filterViz;
         }
      }
   }
}

function normalizeFilterControlTypeToken(typeValue) {
   const normalized = toNonEmptyTrimmedString(typeValue);
   return normalized ? normalized.toLowerCase() : '';
}

function getFilterVizPluginViewsByName(workbookJson) {
   const byName = new Map();
   for (const pluginEntry of collectPluginViews(workbookJson)) {
      const pluginView = pluginEntry?.view;
      if (pluginView?.pluginType !== 'oracle.bi.tech.canvasfilterviz.listbox') {
         continue;
      }
      const viewName = toNonEmptyTrimmedString(pluginView?.viewName);
      if (!viewName || byName.has(viewName)) {
         continue;
      }
      byName.set(viewName, pluginView);
   }
   return byName;
}

function ensureFilterVizRowBindings(filterVizView, columnKeys, parameterKeys) {
   if (!isPlainObject(filterVizView?.dataModels)) {
      filterVizView.dataModels = { children: [] };
   }
   if (!Array.isArray(filterVizView.dataModels.children)) {
      filterVizView.dataModels.children = [];
   }
   if (filterVizView.dataModels.children.length === 0 || !isPlainObject(filterVizView.dataModels.children[0])) {
      filterVizView.dataModels.children = [{ name: 'dm1' }];
   }
   const primaryDataModel = filterVizView.dataModels.children[0];
   if (!isPlainObject(primaryDataModel.logicalDataModel)) {
      primaryDataModel.logicalDataModel = {
         _version: '1.0.0',
         settings: {
            logicalDataModel: {
               _settingsVersion: '1.0.0',
               logicalEdges: {}
            },
            ldm_generation: 1
         }
      };
   }
   if (!isPlainObject(primaryDataModel.logicalDataModel.settings)) {
      primaryDataModel.logicalDataModel.settings = {};
   }
   if (!isPlainObject(primaryDataModel.logicalDataModel.settings.logicalDataModel)) {
      primaryDataModel.logicalDataModel.settings.logicalDataModel = {};
   }
   const logicalDataModel = primaryDataModel.logicalDataModel.settings.logicalDataModel;
   if (!isPlainObject(logicalDataModel.logicalEdges)) {
      logicalDataModel.logicalEdges = {};
   }
   if (!isPlainObject(logicalDataModel.logicalEdges.row)) {
      logicalDataModel.logicalEdges.row = {};
   }
   const normalizedColumnKeys = Array.from(new Set(columnKeys.filter((value) => typeof value === 'string' && value.trim() !== ''))).sort();
   const normalizedParameterKeys = Array.from(new Set(parameterKeys.filter((value) => typeof value === 'string' && value.trim() !== ''))).sort();
   logicalDataModel.logicalEdges.row.logicalEdgeLayers = [
      ...normalizedColumnKeys.map((columnID) => ({
         columnID,
         type: 'column',
         isUsed: true
      })),
      ...normalizedParameterKeys.map((parameterName) => ({
         type: 'parameter',
         name: parameterName,
         isUsed: true
      }))
   ];
   if (!isPlainObject(primaryDataModel.logicalDataModel.settings)) {
      primaryDataModel.logicalDataModel.settings = {};
   }
   if (!Number.isInteger(primaryDataModel.logicalDataModel.settings.ldm_generation)) {
      primaryDataModel.logicalDataModel.settings.ldm_generation = 1;
   }
}

function normalizeFilterControlHostingForFilterViz(workbookJson) {
   const filterVizViewsByName = getFilterVizPluginViewsByName(workbookJson);
   if (filterVizViewsByName.size === 0) {
      return;
   }
   const defaultFilterVizViewName = Array.from(filterVizViewsByName.keys())[0];
   const filterVizWiringByView = new Map();
   const collections = collectFilterControlCollections(workbookJson);
   for (const collection of collections) {
      const controls = Array.isArray(collection?.filterControls?.children)
         ? collection.filterControls.children
         : [];
      for (const control of controls) {
         if (!isPlainObject(control)) {
            continue;
         }
         if (!isPlainObject(control.filterControlConfig)) {
            control.filterControlConfig = {};
         }
         if (!isPlainObject(control.filterControlConfig.settings)) {
            control.filterControlConfig.settings = {};
         }
         const settings = control.filterControlConfig.settings;
         if (normalizeFilterControlTypeToken(settings.location) !== 'filter_viz') {
            continue;
         }
         let targetFilterViz = toNonEmptyTrimmedString(settings.filterViz);
         if (!targetFilterViz || !filterVizViewsByName.has(targetFilterViz)) {
            targetFilterViz = defaultFilterVizViewName;
         }
         if (!targetFilterViz || !filterVizViewsByName.has(targetFilterViz)) {
            continue;
         }
         settings.filterViz = targetFilterViz;
         if (!filterVizWiringByView.has(targetFilterViz)) {
            filterVizWiringByView.set(targetFilterViz, {
               filterIDMap: new Map(),
               parameterIDMap: new Map()
            });
         }
         const wiring = filterVizWiringByView.get(targetFilterViz);
         const filterID = toNonEmptyTrimmedString(control.filterID);
         const controlType = normalizeFilterControlTypeToken(control.type);
         if (!filterID) {
            continue;
         }
         if (controlType === 'saw:columnfiltercontrol') {
            const columnID = toNonEmptyTrimmedString(control.columnID);
            if (columnID && !wiring.filterIDMap.has(columnID)) {
               wiring.filterIDMap.set(columnID, filterID);
            }
            continue;
         }
         if (controlType === 'saw:parameterfiltercontrol') {
            const parameter = toNonEmptyTrimmedString(control.parameter);
            if (parameter && !wiring.parameterIDMap.has(parameter)) {
               wiring.parameterIDMap.set(parameter, filterID);
            }
         }
      }
   }

   for (const [viewName, filterVizView] of filterVizViewsByName.entries()) {
      if (!isPlainObject(filterVizView.viewConfig)) {
         filterVizView.viewConfig = { _version: viewConfigDefaultVersion, settings: {} };
      }
      if (!isPlainObject(filterVizView.viewConfig.settings)) {
         filterVizView.viewConfig.settings = {};
      }
      if (!isPlainObject(filterVizView.viewConfig.settings['viz:filter'])) {
         filterVizView.viewConfig.settings['viz:filter'] = {};
      }
      const wiring = filterVizWiringByView.get(viewName) || {
         filterIDMap: new Map(),
         parameterIDMap: new Map()
      };
      const filterIDMap = Object.fromEntries(
         Array.from(wiring.filterIDMap.entries()).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      );
      const parameterIDMap = Object.fromEntries(
         Array.from(wiring.parameterIDMap.entries()).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      );
      if (Object.keys(filterIDMap).length > 0) {
         filterVizView.viewConfig.settings['viz:filter'].filterIDMap = filterIDMap;
      } else if ('filterIDMap' in filterVizView.viewConfig.settings['viz:filter']) {
         delete filterVizView.viewConfig.settings['viz:filter'].filterIDMap;
      }
      if (Object.keys(parameterIDMap).length > 0) {
         filterVizView.viewConfig.settings['viz:filter'].parameterIDMap = parameterIDMap;
      } else if ('parameterIDMap' in filterVizView.viewConfig.settings['viz:filter']) {
         delete filterVizView.viewConfig.settings['viz:filter'].parameterIDMap;
      }
      ensureFilterVizRowBindings(
         filterVizView,
         Object.keys(filterIDMap),
         Object.keys(parameterIDMap)
      );
   }
}

function toRoundedInteger(value, fallback = 0) {
   if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value);
   }
   return fallback;
}

function parsePixelValue(value, fallback = 0) {
   if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value);
   }
   if (typeof value !== 'string') {
      return fallback;
   }
   const normalized = value.trim();
   if (normalized === '') {
      return fallback;
   }
   const match = normalized.match(/^(-?\d+(?:\.\d+)?)(px)?$/i);
   if (!match) {
      return fallback;
   }
   return Math.round(Number.parseFloat(match[1]));
}

function toPixelString(value, minimum = 1) {
   const rounded = Math.max(minimum, toRoundedInteger(value, minimum));
   return `${rounded}px`;
}

function getNestedObjectAtPath(target, pathSegments) {
   let cursor = target;
   for (const segment of pathSegments) {
      if (!isPlainObject(cursor?.[segment])) {
         return null;
      }
      cursor = cursor[segment];
   }
   return cursor;
}

function normalizePathSegments(pathExpression) {
   if (typeof pathExpression !== 'string' || pathExpression.trim() === '') {
      return [];
   }
   const segments = [];
   let cursor = '';
   let escaped = false;
   for (const char of pathExpression.trim()) {
      if (escaped) {
         cursor += char;
         escaped = false;
         continue;
      }
      if (char === '\\') {
         escaped = true;
         continue;
      }
      if (char === '.') {
         const normalized = cursor.trim();
         if (normalized !== '') {
            segments.push(normalized);
         }
         cursor = '';
         continue;
      }
      cursor += char;
   }
   const tail = cursor.trim();
   if (tail !== '') {
      segments.push(tail);
   }
   return segments;
}

function deepEqualsJsonValue(left, right) {
   if (left === right) {
      return true;
   }
   if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
         return false;
      }
      for (let index = 0; index < left.length; index += 1) {
         if (!deepEqualsJsonValue(left[index], right[index])) {
            return false;
         }
      }
      return true;
   }
   if (isPlainObject(left) || isPlainObject(right)) {
      if (!isPlainObject(left) || !isPlainObject(right)) {
         return false;
      }
      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) {
         return false;
      }
      for (const key of leftKeys) {
         if (!Object.prototype.hasOwnProperty.call(right, key)) {
            return false;
         }
         if (!deepEqualsJsonValue(left[key], right[key])) {
            return false;
         }
      }
      return true;
   }
   return false;
}

function mergeOverlayIntoTarget(target, overlay, pathPrefix = '') {
   if (!isPlainObject(target) || !isPlainObject(overlay)) {
      return {
         changedPathCount: 0,
         changedPaths: []
      };
   }

   let changedPathCount = 0;
   const changedPaths = [];
   for (const [key, overlayValue] of Object.entries(overlay)) {
      const nextPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      if (isPlainObject(overlayValue)) {
         if (!isPlainObject(target[key])) {
            target[key] = {};
         }
         const nested = mergeOverlayIntoTarget(target[key], overlayValue, nextPath);
         changedPathCount += nested.changedPathCount;
         changedPaths.push(...nested.changedPaths);
         continue;
      }
      const currentValue = target[key];
      if (!deepEqualsJsonValue(currentValue, overlayValue)) {
         target[key] = deepClone(overlayValue);
         changedPathCount += 1;
         changedPaths.push(nextPath);
      }
   }
   return {
      changedPathCount,
      changedPaths
   };
}

function incrementCounter(map, key) {
   if (!key) {
      return;
   }
   map[key] = (map[key] || 0) + 1;
}

function getCellGeometry(cell) {
   const width = parsePixelValue(cell?.displayFormat?.formatSpec?.width, 0);
   const height = parsePixelValue(cell?.displayFormat?.formatSpec?.height, 0);
   return {
      left: parsePixelValue(cell?.left, 0),
      top: parsePixelValue(cell?.top, 0),
      width,
      height
   };
}

function setCellGeometry(cell, left, top, width, height) {
   const nextLeft = String(toRoundedInteger(left, 0));
   const nextTop = String(toRoundedInteger(top, 0));
   const nextWidth = toPixelString(width);
   const nextHeight = toPixelString(height);
   const currentGeometry = getCellGeometry(cell);
   const geometryChanged = currentGeometry.left !== Number.parseInt(nextLeft, 10)
      || currentGeometry.top !== Number.parseInt(nextTop, 10)
      || currentGeometry.width !== parsePixelValue(nextWidth, currentGeometry.width)
      || currentGeometry.height !== parsePixelValue(nextHeight, currentGeometry.height);

   if (!geometryChanged) {
      return false;
   }

   cell.left = nextLeft;
   cell.top = nextTop;
   if (!isPlainObject(cell.displayFormat)) {
      cell.displayFormat = {};
   }
   if (!isPlainObject(cell.displayFormat.formatSpec)) {
      cell.displayFormat.formatSpec = {};
   }
   cell.displayFormat.formatSpec.width = nextWidth;
   cell.displayFormat.formatSpec.height = nextHeight;
   return true;
}

function computeLayoutContentBounds(layout) {
   const cells = Array.isArray(layout?.children) ? layout.children : [];
   let right = 0;
   let bottom = 0;
   for (const cell of cells) {
      if (!cell || typeof cell !== 'object') {
         continue;
      }
      const geometry = getCellGeometry(cell);
      right = Math.max(right, geometry.left + Math.max(0, geometry.width));
      bottom = Math.max(bottom, geometry.top + Math.max(0, geometry.height));
   }
   return { right, bottom };
}

function updateSplitLayoutMinSizeFromCells(layout, context = {}) {
   if (!isPlainObject(layout) || layout.type !== 'oracle.bi.tech.layout.split') {
      return null;
   }
   if (!isPlainObject(layout.layoutProps)) {
      layout.layoutProps = {};
   }
   if (!isPlainObject(layout.layoutProps.customProps)) {
      layout.layoutProps.customProps = {};
   }

   let customProps = null;
   const rawText = layout.layoutProps.customProps.text;
   if (isPlainObject(rawText)) {
      customProps = deepClone(rawText);
   } else if (typeof rawText === 'string' && rawText.trim() !== '') {
      try {
         const parsed = JSON.parse(rawText);
         if (isPlainObject(parsed)) {
            customProps = parsed;
         }
      } catch (_error) {
         return null;
      }
   }
   if (!isPlainObject(customProps)) {
      customProps = buildSplitLayoutCustomProps(layout);
   }
   if (!isPlainObject(customProps['oracle.bi.tech.layout.split'])) {
      customProps['oracle.bi.tech.layout.split'] = {};
   }
   const splitProps = customProps['oracle.bi.tech.layout.split'];
   if (!isPlainObject(splitProps.layoutMinSize)) {
      splitProps.layoutMinSize = {};
   }

   const bounds = computeLayoutContentBounds(layout);
   const bottomPadding = Math.max(0, parsePixelValue(context?.bottomPaddingPx, 24));
   const minimumHeight = Math.max(0, parsePixelValue(context?.minHeightPx, 0));
   const requiredHeight = Math.max(1, minimumHeight, toRoundedInteger(bounds.bottom + bottomPadding, 1));
   const currentHeight = parsePixelValue(splitProps.layoutMinSize.height, 0);
   const finalHeight = context?.allowShrinkHeight === true
      ? requiredHeight
      : Math.max(currentHeight, requiredHeight);
   const previousHeight = splitProps.layoutMinSize.height;
   const previousWidth = splitProps.layoutMinSize.width;

   customProps._version = toNonEmptyTrimmedString(customProps._version) || '1.0.1';
   splitProps._version = toNonEmptyTrimmedString(splitProps._version) || '1.0.0';
   splitProps.layoutMinSize.width = toNonEmptyTrimmedString(splitProps.layoutMinSize.width) || '100%';
   splitProps.layoutMinSize.height = finalHeight;
   layout.layoutProps.customProps.text = JSON.stringify(customProps);

   if (previousHeight !== splitProps.layoutMinSize.height || previousWidth !== splitProps.layoutMinSize.width) {
      return {
         type: 'layout_min_size_updated',
         previousWidth: previousWidth ?? null,
         previousHeight: previousHeight ?? null,
         width: splitProps.layoutMinSize.width,
         height: splitProps.layoutMinSize.height
      };
   }
   return null;
}

function collectLayouts(workbookJson) {
   return Array.isArray(workbookJson?.layouts?.children)
      ? workbookJson.layouts.children.filter((layout) => layout && typeof layout === 'object')
      : [];
}

function buildLayoutMapByName(workbookJson) {
   const byName = new Map();
   for (const layout of collectLayouts(workbookJson)) {
      const name = toNonEmptyTrimmedString(layout?.name);
      if (!name || byName.has(name)) {
         continue;
      }
      byName.set(name, layout);
   }
   return byName;
}

function humanizeToken(value) {
   const normalized = toNonEmptyTrimmedString(value);
   if (!normalized) {
      return null;
   }
   return normalized
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
}

function toQuestionTitle(value) {
   const normalized = toNonEmptyTrimmedString(value);
   if (!normalized) {
      return null;
   }
   const stripped = normalized.replace(/[?.!]+$/, '').trim();
   if (!stripped) {
      return null;
   }
   if (/^(who|what|when|where|why|how)\b/i.test(stripped)) {
      return `${stripped}?`;
   }
   return `How is ${stripped}?`;
}

function getCanvasTitle(canvasView) {
   const captionTitle = toNonEmptyTrimmedString(canvasView?.viewCaption?.caption?.text);
   if (captionTitle) {
      return captionTitle;
   }
   return toNonEmptyTrimmedString(canvasView?.canvasConfig?.settings?.title);
}

function setCanvasTitle(canvasView, title) {
   const normalized = toNonEmptyTrimmedString(title);
   if (!normalized) {
      return false;
   }
   setNestedValue(canvasView, 'viewCaption.caption.text', normalized);
   deleteNestedValue(canvasView, 'canvasConfig.settings.title');
   return true;
}

function getArchetypeConfig(polishContract, archetypeID) {
   const archetypeMap = isPlainObject(polishContract?.layoutArchetypes)
      ? polishContract.layoutArchetypes
      : {};
   const fallbackID = toNonEmptyTrimmedString(polishContract?.defaults?.fallbackLayoutArchetype) || 'content_grid';
   const requestedConfig = isPlainObject(archetypeMap?.[archetypeID]) ? archetypeMap[archetypeID] : null;
   const fallbackConfig = isPlainObject(archetypeMap?.[fallbackID]) ? archetypeMap[fallbackID] : null;
   const resolvedID = requestedConfig ? archetypeID : fallbackID;
   return {
      archetypeID: resolvedID,
      config: requestedConfig || fallbackConfig || {
         canvasWidthPx: 1200,
         viewportHeightPx: 720,
         topOffsetPx: 24,
         leftPaddingPx: 24,
         rightPaddingPx: 24,
         bottomPaddingPx: 24,
         gutterXPx: 24,
         gutterYPx: 24,
         maxColumns: 2,
         minCellHeightPx: 220
      }
   };
}

function resolveCanvasArchetypeID(polishHints, canvasSpec, canvasIndex, requestedFilterMode, polishContract) {
   const allowedArchetypes = new Set(
      Object.keys(isPlainObject(polishContract?.layoutArchetypes) ? polishContract.layoutArchetypes : {})
   );
   const byCanvasID = isPlainObject(polishHints?.byCanvasID) ? polishHints.byCanvasID : {};
   const byCanvasIndex = isPlainObject(polishHints?.byCanvasIndex) ? polishHints.byCanvasIndex : {};
   const canvasID = toNonEmptyTrimmedString(canvasSpec?.id);
   const hintedByID = canvasID && typeof byCanvasID[canvasID] === 'string' ? byCanvasID[canvasID] : null;
   const hintedByIndex = typeof byCanvasIndex[String(canvasIndex)] === 'string' ? byCanvasIndex[String(canvasIndex)] : null;
   const hintedDefault = typeof polishHints?.defaultArchetype === 'string' ? polishHints.defaultArchetype : null;
   const filterModeDefaults = isPlainObject(polishContract?.defaults?.layoutArchetypeByFilterMode)
      ? polishContract.defaults.layoutArchetypeByFilterMode
      : {};
   const fallbackByFilterMode = typeof filterModeDefaults[requestedFilterMode] === 'string'
      ? filterModeDefaults[requestedFilterMode]
      : null;
   const fallbackGlobal = toNonEmptyTrimmedString(polishContract?.defaults?.fallbackLayoutArchetype) || 'content_grid';

   const candidateOrder = [hintedByID, hintedByIndex, hintedDefault, fallbackByFilterMode, fallbackGlobal];
   for (const candidate of candidateOrder) {
      const normalized = toNonEmptyTrimmedString(candidate);
      if (!normalized) {
         continue;
      }
      if (allowedArchetypes.size === 0 || allowedArchetypes.has(normalized)) {
         return normalized;
      }
   }
   return fallbackGlobal;
}

function extractHorizontalGutters(layout) {
   const rows = new Map();
   const children = Array.isArray(layout?.children) ? layout.children : [];
   for (const cell of children) {
      if (!cell || typeof cell !== 'object') {
         continue;
      }
      const geometry = getCellGeometry(cell);
      const rowKey = String(geometry.top);
      if (!rows.has(rowKey)) {
         rows.set(rowKey, []);
      }
      rows.get(rowKey).push(geometry);
   }
   const gutters = [];
   for (const rowCells of rows.values()) {
      rowCells.sort((left, right) => left.left - right.left);
      for (let index = 1; index < rowCells.length; index += 1) {
         const prev = rowCells[index - 1];
         const current = rowCells[index];
         gutters.push(current.left - (prev.left + prev.width));
      }
   }
   return gutters;
}

function resolveRuntimeFamilyForCell(cell, context) {
   const viewName = toNonEmptyTrimmedString(cell?.content?.viewName);
   if (!viewName) {
      return null;
   }
   const pluginView = context?.pluginByViewName?.get(viewName);
   const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
   if (!pluginType || typeof context?.resolveRuntimeFamilyForPluginType !== 'function') {
      return null;
   }
   return context.resolveRuntimeFamilyForPluginType(pluginType);
}

function findEdgeByAxis(pluginView, axisName) {
   const dataModelChildren = Array.isArray(pluginView?.dataModels?.children)
      ? pluginView.dataModels.children
      : [];
   for (const dataModel of dataModelChildren) {
      const edgeChildren = Array.isArray(dataModel?.edges?.children) ? dataModel.edges.children : [];
      const edge = edgeChildren.find((entry) => toNonEmptyTrimmedString(entry?.axis) === axisName);
      if (edge) {
         return edge;
      }
   }
   return null;
}

function getVisibleRowColumnLayers(rowEdge) {
   const layerChildren = Array.isArray(rowEdge?.edgeLayers?.children) ? rowEdge.edgeLayers.children : [];
   return layerChildren.filter((layer) => {
      if (toNonEmptyTrimmedString(layer?.type) !== 'column') {
         return false;
      }
      return toNonEmptyTrimmedString(layer?.visibility) !== 'hidden';
   });
}

function normalizeTitleToken(value) {
   const normalized = toNonEmptyTrimmedString(value);
   if (!normalized) {
      return null;
   }
   const compact = normalized.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
   return compact || null;
}

function titlesEquivalent(leftValue, rightValue) {
   const left = normalizeTitleToken(leftValue);
   const right = normalizeTitleToken(rightValue);
   return Boolean(left && right && left === right);
}

function getViewCaptionText(pluginView) {
   return toNonEmptyTrimmedString(pluginView?.viewCaption?.caption?.text);
}

function getTextboxRuntimeBodyText(pluginView) {
   return getCanonicalSignalText(pluginView, textboxRuntimePathSignal);
}

function getTextboxLegacyBodyText(pluginView) {
   const legacyCandidates = collectLegacySignalTextValues(pluginView, textboxRuntimePathSignal);
   return legacyCandidates.length > 0 ? legacyCandidates[0].text : null;
}

function getTextboxBodyText(pluginView) {
   return selectSignalTextValue(pluginView, textboxRuntimePathSignal, { allowLegacyFallback: true }).selectedText;
}

function setTextboxBodyText(pluginView, value, viewConfigDefaultVersion) {
   const normalized = toNonEmptyTrimmedString(value);
   if (!normalized) {
      return false;
   }
   ensurePluginViewConfig(pluginView, viewConfigDefaultVersion);
   return setValueByPathSegments(pluginView, textboxRuntimePathSignal?.canonical?.pathSegments, normalized);
}

function clearViewCaptionText(pluginView) {
   if (!isPlainObject(pluginView?.viewCaption?.caption)) {
      return false;
   }
   if (!('text' in pluginView.viewCaption.caption)) {
      return false;
   }
   if (pluginView.viewCaption.caption.text === '') {
      return false;
   }
   pluginView.viewCaption.caption.text = '';
   return true;
}

function geometryHorizontalOverlapRatio(baseGeometry, candidateGeometry) {
   const baseLeft = baseGeometry.left;
   const baseRight = baseGeometry.left + Math.max(0, baseGeometry.width);
   const candidateLeft = candidateGeometry.left;
   const candidateRight = candidateGeometry.left + Math.max(0, candidateGeometry.width);
   const overlap = Math.max(0, Math.min(baseRight, candidateRight) - Math.max(baseLeft, candidateLeft));
   if (overlap <= 0 || baseGeometry.width <= 0) {
      return 0;
   }
   return overlap / baseGeometry.width;
}

function geometryOverlapArea(leftGeometry, rightGeometry) {
   const leftWidth = Math.max(0, leftGeometry.width);
   const leftHeight = Math.max(0, leftGeometry.height);
   const rightWidth = Math.max(0, rightGeometry.width);
   const rightHeight = Math.max(0, rightGeometry.height);
   if (leftWidth <= 0 || leftHeight <= 0 || rightWidth <= 0 || rightHeight <= 0) {
      return 0;
   }
   const overlapWidth = Math.max(
      0,
      Math.min(leftGeometry.left + leftWidth, rightGeometry.left + rightWidth) - Math.max(leftGeometry.left, rightGeometry.left)
   );
   const overlapHeight = Math.max(
      0,
      Math.min(leftGeometry.top + leftHeight, rightGeometry.top + rightHeight) - Math.max(leftGeometry.top, rightGeometry.top)
   );
   return overlapWidth * overlapHeight;
}

function distributeRowHeights(availableHeight, weights, minCellHeight) {
   if (!Array.isArray(weights) || weights.length === 0) {
      return [];
   }
   if (availableHeight <= 0) {
      return new Array(weights.length).fill(minCellHeight);
   }

   const totalWeight = Math.max(1, weights.reduce((sum, value) => sum + Math.max(0.01, value), 0));
   const rawHeights = weights.map((weight) => (availableHeight * Math.max(0.01, weight)) / totalWeight);
   const rowHeights = rawHeights.map((height) => Math.max(minCellHeight, Math.floor(height)));
   let consumed = rowHeights.reduce((sum, height) => sum + height, 0);

   if (consumed < availableHeight) {
      let remaining = availableHeight - consumed;
      const fractionalOrder = rawHeights
         .map((height, index) => ({ index, fractional: height - Math.floor(height) }))
         .sort((left, right) => right.fractional - left.fractional);
      let cursor = 0;
      while (remaining > 0 && fractionalOrder.length > 0) {
         const target = fractionalOrder[cursor % fractionalOrder.length];
         rowHeights[target.index] += 1;
         remaining -= 1;
         cursor += 1;
      }
      consumed = rowHeights.reduce((sum, height) => sum + height, 0);
   } else if (consumed > availableHeight) {
      let overflow = consumed - availableHeight;
      const trimOrder = rowHeights
         .map((height, index) => ({ index, slack: Math.max(0, height - minCellHeight) }))
         .sort((left, right) => right.slack - left.slack);
      while (overflow > 0) {
         let drained = false;
         for (const entry of trimOrder) {
            if (overflow <= 0) {
               break;
            }
            if (rowHeights[entry.index] > minCellHeight) {
               rowHeights[entry.index] -= 1;
               overflow -= 1;
               drained = true;
            }
         }
         if (!drained) {
            break;
         }
      }
   }

   return rowHeights;
}

function enforcePrimaryRowMinimumHeight(rowHeights, rowHasPrimaryData, minimumHeight, minCellHeight) {
   if (!Array.isArray(rowHeights) || rowHeights.length <= 1) {
      return;
   }
   for (let rowIndex = 0; rowIndex < rowHeights.length; rowIndex += 1) {
      if (!rowHasPrimaryData[rowIndex]) {
         continue;
      }
      const requiredHeight = Math.max(minimumHeight, minCellHeight);
      if (rowHeights[rowIndex] >= requiredHeight) {
         continue;
      }
      let deficit = requiredHeight - rowHeights[rowIndex];
      const donorIndexes = rowHeights
         .map((height, index) => ({ index, slack: Math.max(0, height - minCellHeight) }))
         .filter((entry) => entry.index !== rowIndex && entry.slack > 0)
         .sort((left, right) => right.slack - left.slack);
      for (const donor of donorIndexes) {
         if (deficit <= 0) {
            break;
         }
         const transferable = Math.min(deficit, Math.max(0, rowHeights[donor.index] - minCellHeight));
         if (transferable <= 0) {
            continue;
         }
         rowHeights[donor.index] -= transferable;
         rowHeights[rowIndex] += transferable;
         deficit -= transferable;
      }
   }
}

function distributeVariableRowHeights(availableHeight, rowWeights, rowMinHeights) {
   if (!Array.isArray(rowWeights) || rowWeights.length === 0) {
      return [];
   }
   const resolvedMinHeights = rowWeights.map((_, index) => Math.max(1, parsePixelValue(rowMinHeights?.[index], 220)));
   const minimumTotal = resolvedMinHeights.reduce((sum, height) => sum + height, 0);
   if (availableHeight <= minimumTotal) {
      return resolvedMinHeights;
   }

   const totalWeight = Math.max(1, rowWeights.reduce((sum, value) => sum + Math.max(0.01, value), 0));
   let remaining = availableHeight - minimumTotal;
   const rowHeights = resolvedMinHeights.slice();
   const rawExtras = rowWeights.map((weight) => (remaining * Math.max(0.01, weight)) / totalWeight);
   for (let index = 0; index < rowHeights.length; index += 1) {
      const extra = Math.floor(rawExtras[index]);
      rowHeights[index] += extra;
      remaining -= extra;
   }

   const fractionalOrder = rawExtras
      .map((height, index) => ({ index, fractional: height - Math.floor(height) }))
      .sort((left, right) => right.fractional - left.fractional);
   let cursor = 0;
   while (remaining > 0 && fractionalOrder.length > 0) {
      const target = fractionalOrder[cursor % fractionalOrder.length];
      rowHeights[target.index] += 1;
      remaining -= 1;
      cursor += 1;
   }
   return rowHeights;
}

function getLayoutRoleDefinitions(polishContract) {
   const roleContainer = isPlainObject(polishContract?.layoutRoles) ? polishContract.layoutRoles : {};
   return isPlainObject(roleContainer.roles) ? roleContainer.roles : {};
}

function getLayoutRoleOrder(archetypeConfig, layoutPolicy, polishContract) {
   const fromArchetype = Array.isArray(archetypeConfig?.roleOrder)
      ? archetypeConfig.roleOrder
      : [];
   const fromPolicy = Array.isArray(layoutPolicy?.defaultRoleOrder)
      ? layoutPolicy.defaultRoleOrder
      : [];
   const fromContract = Array.isArray(polishContract?.layoutRoles?.defaultRoleOrder)
      ? polishContract.layoutRoles.defaultRoleOrder
      : [];
   const resolved = [...fromArchetype, ...fromPolicy, ...fromContract]
      .filter((value) => typeof value === 'string' && value.trim() !== '');
   return resolved.length > 0
      ? Array.from(new Set(resolved))
      : ['kpi', 'filter', 'primaryComparison', 'primaryTrend', 'primaryDetail', 'supportingVisual'];
}

function resolvePluginForCell(cell, context) {
   const viewName = toNonEmptyTrimmedString(cell?.content?.viewName);
   if (!viewName) {
      return { viewName: null, pluginView: null, pluginType: null, runtimeFamily: null };
   }
   const pluginView = context?.pluginByViewName?.get(viewName) || null;
   const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
   const runtimeFamily = pluginType && typeof context?.resolveRuntimeFamilyForPluginType === 'function'
      ? context.resolveRuntimeFamilyForPluginType(pluginType)
      : null;
   return { viewName, pluginView, pluginType, runtimeFamily };
}

function matchesLayoutRole(roleConfig, pluginType, runtimeFamily) {
   if (!isPlainObject(roleConfig)) {
      return false;
   }
   const pluginTypes = Array.isArray(roleConfig.pluginTypes) ? roleConfig.pluginTypes : [];
   if (pluginType && pluginTypes.includes(pluginType)) {
      return true;
   }
   const runtimeFamilies = Array.isArray(roleConfig.runtimeFamilies) ? roleConfig.runtimeFamilies : [];
   return Boolean(runtimeFamily && runtimeFamilies.includes(runtimeFamily));
}

function inferLayoutRoleForCell(cell, context = {}) {
   const { pluginType, runtimeFamily } = resolvePluginForCell(cell, context);
   const roleDefinitions = getLayoutRoleDefinitions(context?.polishContract);
   const roleOrder = getLayoutRoleOrder(context?.archetypeConfig, context?.layoutPolicy, context?.polishContract);
   for (const roleID of roleOrder) {
      if (matchesLayoutRole(roleDefinitions[roleID], pluginType, runtimeFamily)) {
         return roleID;
      }
   }
   for (const [roleID, roleConfig] of Object.entries(roleDefinitions)) {
      if (matchesLayoutRole(roleConfig, pluginType, runtimeFamily)) {
         return roleID;
      }
   }
   return 'supportingVisual';
}

function buildLayoutRoleEntries(layout, context = {}) {
   const roleDefinitions = getLayoutRoleDefinitions(context?.polishContract);
   return (Array.isArray(layout?.children) ? layout.children : [])
      .map((cell, originalIndex) => {
         const role = inferLayoutRoleForCell(cell, context);
         const roleConfig = isPlainObject(roleDefinitions[role]) ? roleDefinitions[role] : {};
         const pluginInfo = resolvePluginForCell(cell, context);
         return {
            cell,
            originalIndex,
            role,
            roleConfig,
            rowGroup: toNonEmptyTrimmedString(roleConfig.rowGroup) || role,
            minHeight: Math.max(1, parsePixelValue(roleConfig.minHeightPx, parsePixelValue(context?.archetypeConfig?.minCellHeightPx, 220))),
            maxColumns: Math.max(1, parsePixelValue(roleConfig.maxColumns, parsePixelValue(context?.archetypeConfig?.maxColumns, 2))),
            rowWeight: Math.max(0.01, Number.parseFloat(roleConfig.rowWeight ?? 1) || 1),
            ...pluginInfo
         };
      })
      .filter((entry) => entry.cell && typeof entry.cell === 'object');
}

function orderLayoutEntriesByRole(entries, roleOrder) {
   const roleRank = new Map(roleOrder.map((roleID, index) => [roleID, index]));
   return entries.slice().sort((left, right) => {
      const leftRank = roleRank.has(left.role) ? roleRank.get(left.role) : roleOrder.length;
      const rightRank = roleRank.has(right.role) ? roleRank.get(right.role) : roleOrder.length;
      if (leftRank !== rightRank) {
         return leftRank - rightRank;
      }
      return left.originalIndex - right.originalIndex;
   });
}

function groupLayoutEntriesIntoRows(entries, maxColumns) {
   const rows = [];
   let currentRow = [];
   let currentGroup = null;

   function flushCurrentRow() {
      if (currentRow.length > 0) {
         rows.push(currentRow);
      }
      currentRow = [];
      currentGroup = null;
   }

   for (const entry of entries) {
      const rowMaxColumns = Math.max(1, Math.min(maxColumns, entry.maxColumns || maxColumns));
      if (currentRow.length === 0) {
         currentRow.push(entry);
         currentGroup = entry.rowGroup;
         continue;
      }
      const compatibleGroup = currentGroup === entry.rowGroup;
      const currentMaxColumns = Math.max(
         1,
         Math.min(maxColumns, ...currentRow.map((rowEntry) => rowEntry.maxColumns || maxColumns), rowMaxColumns)
      );
      if (!compatibleGroup || currentRow.length >= currentMaxColumns) {
         flushCurrentRow();
      }
      currentRow.push(entry);
      currentGroup = entry.rowGroup;
   }
   flushCurrentRow();
   return rows;
}

function getSystemLayoutTemplateMap(systemLayoutTemplates) {
   return isPlainObject(systemLayoutTemplates?.templates) ? systemLayoutTemplates.templates : {};
}

function getSystemLayoutTemplateByID(systemLayoutTemplates, templateID) {
   const normalizedID = toNonEmptyTrimmedString(templateID);
   if (!normalizedID) {
      return null;
   }
   const templateMap = getSystemLayoutTemplateMap(systemLayoutTemplates);
   const template = templateMap[normalizedID];
   return isPlainObject(template) ? template : null;
}

function validateRegisteredLayoutTemplateID(systemLayoutTemplates, templateID, sourceDescription) {
   const normalizedID = toNonEmptyTrimmedString(templateID);
   if (!normalizedID) {
      return null;
   }
   const template = getSystemLayoutTemplateByID(systemLayoutTemplates, normalizedID);
   if (!template) {
      const knownIDs = Object.keys(getSystemLayoutTemplateMap(systemLayoutTemplates)).sort();
      fail(
         'INVALID_REQUEST_CONTRACT',
         `${sourceDescription} references unknown registered layout template '${normalizedID}'. Known templates: ${knownIDs.join(', ')}.`
      );
   }
   return normalizedID;
}

function resolveRegisteredLayoutTemplateCandidate(polishHints, canvasSpec, canvasIndex, requestedFilterMode, systemLayoutTemplates) {
   const canvasID = toNonEmptyTrimmedString(canvasSpec?.id);
   const layoutIntent = isPlainObject(canvasSpec?.layout) ? canvasSpec.layout : {};
   const explicitFromLayout = toNonEmptyTrimmedString(layoutIntent.registeredTemplateID || layoutIntent.templateID);
   if (explicitFromLayout) {
      return {
         templateID: validateRegisteredLayoutTemplateID(systemLayoutTemplates, explicitFromLayout, `analysisShape.canvases[${canvasIndex}].layout`),
         source: 'canvas_layout',
         explicit: true
      };
   }

   const byCanvasID = isPlainObject(polishHints?.registeredTemplateByCanvasID)
      ? polishHints.registeredTemplateByCanvasID
      : {};
   const byCanvasIndex = isPlainObject(polishHints?.registeredTemplateByCanvasIndex)
      ? polishHints.registeredTemplateByCanvasIndex
      : {};
   const hintedByID = canvasID && typeof byCanvasID[canvasID] === 'string' ? byCanvasID[canvasID] : null;
   if (hintedByID) {
      return {
         templateID: validateRegisteredLayoutTemplateID(systemLayoutTemplates, hintedByID, `presentationPolish.layoutTemplateHints.registeredTemplateByCanvasID.${canvasID}`),
         source: 'hint_by_canvas_id',
         explicit: true
      };
   }
   const hintedByIndex = typeof byCanvasIndex[String(canvasIndex)] === 'string' ? byCanvasIndex[String(canvasIndex)] : null;
   if (hintedByIndex) {
      return {
         templateID: validateRegisteredLayoutTemplateID(systemLayoutTemplates, hintedByIndex, `presentationPolish.layoutTemplateHints.registeredTemplateByCanvasIndex.${canvasIndex}`),
         source: 'hint_by_canvas_index',
         explicit: true
      };
   }
   const defaultHint = toNonEmptyTrimmedString(polishHints?.defaultRegisteredTemplate);
   if (defaultHint) {
      return {
         templateID: validateRegisteredLayoutTemplateID(systemLayoutTemplates, defaultHint, 'presentationPolish.layoutTemplateHints.defaultRegisteredTemplate'),
         source: 'hint_default',
         explicit: true
      };
   }

   return null;
}

function layoutEntriesContainAnyRole(entries, requiredRoles) {
   if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return true;
   }
   const roleSet = new Set(requiredRoles.filter((role) => typeof role === 'string' && role.trim() !== ''));
   if (roleSet.size === 0) {
      return true;
   }
   return entries.some((entry) => roleSet.has(entry.role));
}

function findSlotEntryCandidate(unassignedEntries, acceptedRoles, exactRole) {
   const accepted = new Set(Array.isArray(acceptedRoles) ? acceptedRoles.filter((role) => typeof role === 'string') : []);
   let candidate = null;
   if (exactRole) {
      candidate = unassignedEntries.find((entry) => entry.role === exactRole && (accepted.size === 0 || accepted.has(entry.role)));
      if (candidate) {
         return candidate;
      }
   }
   candidate = unassignedEntries.find((entry) => accepted.has(entry.role));
   if (candidate) {
      return candidate;
   }
   return null;
}

function isKpiLayoutRole(role) {
   return role === 'kpi';
}

function isFilterLayoutRole(role) {
   return role === 'filter';
}

function getCompactRegisteredTemplateSettings(template, context = {}) {
   const layoutPolicy = isPlainObject(context?.layoutPolicy) ? context.layoutPolicy : {};
   const canvasWidth = Math.max(600, parsePixelValue(template?.width, parsePixelValue(layoutPolicy.canvasWidthPx, 1242)));
   const targetHeight = Math.max(560, parsePixelValue(layoutPolicy.compactDashboardTargetHeightPx, 760));
   const gutter = Math.max(8, parsePixelValue(layoutPolicy.compactRegisteredTemplateGutterPx, parsePixelValue(context?.gutterYPx, 16)));
   const leftPadding = Math.max(0, parsePixelValue(context?.leftPaddingPx, 24));
   const rightPadding = Math.max(0, parsePixelValue(context?.rightPaddingPx, 24));
   const maxTileHeight = Math.max(96, parsePixelValue(layoutPolicy.maxCompactPerformanceTileHeightPx, 180));
   const tileHeight = Math.max(96, Math.min(maxTileHeight, parsePixelValue(layoutPolicy.compactPerformanceTileHeightPx, 140)));
   const minPrimaryVisualHeight = Math.max(220, parsePixelValue(layoutPolicy.primaryVisualMinHeightPx, 300));
   const minPrimaryDataHeight = Math.max(minPrimaryVisualHeight, parsePixelValue(layoutPolicy.primaryDataMinHeightPx, 400));
   return {
      canvasWidth,
      targetHeight,
      gutter,
      leftPadding,
      rightPadding,
      tileHeight,
      maxTileHeight,
      minPrimaryVisualHeight,
      minPrimaryDataHeight
   };
}

function setAssignedCellGeometry(assignment, geometry, remediations, template) {
   if (!assignment?.entry?.cell || !geometry) {
      return;
   }
   const left = toRoundedInteger(geometry.left, 0);
   const top = toRoundedInteger(geometry.top, 0);
   const width = toRoundedInteger(geometry.width, 240);
   const height = toRoundedInteger(geometry.height, 220);
   const changed = setCellGeometry(assignment.entry.cell, left, top, width, height);
   if (changed) {
      remediations.push({
         type: 'registered_template_slot_applied',
         templateID: template.id,
         slotID: toNonEmptyTrimmedString(assignment.slot?.slotID) || null,
         role: assignment.entry.role,
         left,
         top,
         width,
         height
      });
   }
}

function layoutAssignedRows(assignments, context) {
   const maxColumns = Math.max(1, parsePixelValue(context?.maxColumns, 2));
   const entries = assignments.map((assignment) => assignment.entry);
   const rows = context?.preserveRoleRows === false
      ? entries.reduce((accumulator, entry) => {
         const currentRow = accumulator[accumulator.length - 1];
         if (!currentRow || currentRow.length >= maxColumns) {
            accumulator.push([entry]);
         } else {
            currentRow.push(entry);
         }
         return accumulator;
      }, [])
      : groupLayoutEntriesIntoRows(entries, maxColumns);
   const assignmentByEntry = new Map(assignments.map((assignment) => [assignment.entry, assignment]));
   return rows.map((row) => row.map((entry) => assignmentByEntry.get(entry)).filter(Boolean));
}

function applyCompactRows(assignments, bounds, settings, remediations, template, context = {}) {
   if (!Array.isArray(assignments) || assignments.length === 0) {
      return bounds.top;
   }
   const rows = layoutAssignedRows(assignments, {
      maxColumns: Math.max(1, parsePixelValue(context?.maxColumns, 2)),
      preserveRoleRows: context?.preserveRoleRows
   });
   let top = bounds.top;
   for (const rowAssignments of rows) {
      const columns = Math.max(1, rowAssignments.length);
      const availableWidth = bounds.width - Math.max(0, columns - 1) * settings.gutter;
      const cellWidth = Math.max(220, Math.floor(availableWidth / columns));
      const cellHeight = Math.max(...rowAssignments.map((assignment) => {
         const entry = assignment.entry;
         if (entry.runtimeFamily === 'table' || entry.runtimeFamily === 'pivot' || entry.role === 'primaryDetail') {
            return settings.minPrimaryDataHeight;
         }
         return Math.max(entry.minHeight, settings.minPrimaryVisualHeight);
      }));
      for (let col = 0; col < rowAssignments.length; col += 1) {
         setAssignedCellGeometry(rowAssignments[col], {
            left: bounds.left + col * (cellWidth + settings.gutter),
            top,
            width: cellWidth,
            height: cellHeight
         }, remediations, template);
      }
      top += cellHeight + settings.gutter;
   }
   return top;
}

function compactRegisteredTemplateAssignments(assignedEntries, template, context = {}) {
   const remediations = [];
   const settings = getCompactRegisteredTemplateSettings(template, context);
   const filterAssignments = assignedEntries.filter((assignment) => isFilterLayoutRole(assignment.entry.role));
   const kpiAssignments = assignedEntries.filter((assignment) => isKpiLayoutRole(assignment.entry.role));
   const visualAssignments = assignedEntries.filter((assignment) => !isFilterLayoutRole(assignment.entry.role) && !isKpiLayoutRole(assignment.entry.role));
   const hasFilter = filterAssignments.length > 0;
   const isFilterLeft = template?.id === 'bitech.layoutTemplate.filterLeft';
   let contentLeft = settings.leftPadding;
   let contentTop = hasFilter && !isFilterLeft ? 0 : settings.leftPadding;
   let contentWidth = settings.canvasWidth - settings.leftPadding - settings.rightPadding;

   if (hasFilter && isFilterLeft) {
      const sourceRailWidth = Math.max(...filterAssignments.map((assignment) => parsePixelValue(assignment.slot?.width, 260)), 260);
      const railWidth = Math.min(288, Math.max(220, sourceRailWidth));
      contentLeft = railWidth + settings.gutter;
      contentTop = 0;
      contentWidth = settings.canvasWidth - contentLeft - settings.rightPadding;
   } else if (hasFilter) {
      const filterHeight = Math.min(131, Math.max(88, ...filterAssignments.map((assignment) => parsePixelValue(assignment.slot?.height, 112))));
      for (const assignment of filterAssignments) {
         setAssignedCellGeometry(assignment, {
            left: 0,
            top: 0,
            width: settings.canvasWidth,
            height: filterHeight
         }, remediations, template);
      }
      contentTop = filterHeight + settings.gutter;
   }

   if (kpiAssignments.length > 0) {
      const columns = Math.min(4, kpiAssignments.length);
      const availableWidth = contentWidth - Math.max(0, columns - 1) * settings.gutter;
      const cellWidth = Math.max(180, Math.floor(availableWidth / columns));
      for (let index = 0; index < kpiAssignments.length; index += 1) {
         const row = Math.floor(index / columns);
         const col = index % columns;
         setAssignedCellGeometry(kpiAssignments[index], {
            left: contentLeft + col * (cellWidth + settings.gutter),
            top: contentTop + row * (settings.tileHeight + settings.gutter),
            width: cellWidth,
            height: settings.tileHeight
         }, remediations, template);
      }
      const rowCount = Math.ceil(kpiAssignments.length / columns);
      contentTop += rowCount * settings.tileHeight + Math.max(0, rowCount) * settings.gutter;
   }

   contentTop = applyCompactRows(visualAssignments, {
      left: contentLeft,
      top: contentTop,
      width: contentWidth
   }, settings, remediations, template, {
      maxColumns: 2,
      preserveRoleRows: hasFilter || kpiAssignments.length > 0 || visualAssignments.length > 4
   });

   if (hasFilter && isFilterLeft) {
      const contentBottom = Math.max(contentTop - settings.gutter, settings.targetHeight);
      const railHeight = Math.max(360, Math.min(settings.targetHeight, contentBottom));
      for (const assignment of filterAssignments) {
         setAssignedCellGeometry(assignment, {
            left: 0,
            top: 0,
            width: contentLeft - settings.gutter,
            height: railHeight
         }, remediations, template);
      }
   }

   return {
      remediations,
      contentBottom: Math.max(0, contentTop - settings.gutter),
      settings
   };
}

function packRegisteredTemplateOverflowEntries(entries, template, context) {
   if (!Array.isArray(entries) || entries.length === 0) {
      return [];
   }
   const templateWidth = Math.max(600, parsePixelValue(template?.width, 1200));
   const gutterX = Math.max(0, parsePixelValue(context?.gutterXPx, 24));
   const gutterY = Math.max(0, parsePixelValue(context?.gutterYPx, 24));
   const leftPadding = Math.max(0, parsePixelValue(context?.leftPaddingPx, 24));
   const rightPadding = Math.max(0, parsePixelValue(context?.rightPaddingPx, 24));
   const rows = groupLayoutEntriesIntoRows(entries, 2);
   const remediations = [];
   let top = Math.max(0, parsePixelValue(context?.startTopPx, parsePixelValue(template?.height, 720) + gutterY));
   for (const rowEntries of rows) {
      const columns = Math.max(1, rowEntries.length);
      const availableWidth = templateWidth - leftPadding - rightPadding - Math.max(0, columns - 1) * gutterX;
      const cellWidth = Math.max(240, Math.floor(availableWidth / columns));
      const cellHeight = Math.max(...rowEntries.map((entry) => entry.minHeight), 260);
      for (let col = 0; col < rowEntries.length; col += 1) {
         const entry = rowEntries[col];
         const left = leftPadding + col * (cellWidth + gutterX);
         const changed = setCellGeometry(entry.cell, left, top, cellWidth, cellHeight);
         if (changed) {
            remediations.push({
               type: 'registered_template_overflow_geometry_normalized',
               role: entry.role,
               left,
               top,
               width: cellWidth,
               height: cellHeight
            });
         }
      }
      top += cellHeight + gutterY;
   }
   return remediations;
}

function normalizeLayoutForRegisteredTemplate(layout, template, context = {}) {
   if (!isPlainObject(template) || !Array.isArray(template.slots) || template.slots.length === 0) {
      return {
         applied: false,
         skippedReason: 'registered_template_invalid',
         remediations: [],
         roleAssignments: []
      };
   }
   const entries = buildLayoutRoleEntries(layout, {
      ...context,
      archetypeConfig: {
         maxColumns: 2,
         minCellHeightPx: 220
      }
   });
   if (entries.length === 0) {
      return {
         applied: false,
         skippedReason: 'registered_template_no_cells',
         remediations: [],
         roleAssignments: []
      };
   }
   const candidate = context?.registeredLayoutTemplateCandidate;
   const requiredRoles = Array.isArray(context?.systemLayoutTemplates?.defaults?.applyDefaultOnlyWhenAnyRole)
      ? context.systemLayoutTemplates.defaults.applyDefaultOnlyWhenAnyRole
      : [];
   if (!candidate?.explicit && !layoutEntriesContainAnyRole(entries, requiredRoles)) {
      return {
         applied: false,
         skippedReason: 'registered_template_default_role_missing',
         remediations: [],
         roleAssignments: []
      };
   }

   const remediations = [];
   const unassignedEntries = entries.slice();
   const assignedEntries = [];
   for (const slot of template.slots) {
      if (!isPlainObject(slot)) {
         continue;
      }
      const slotRole = toNonEmptyTrimmedString(slot.role);
      const entry = findSlotEntryCandidate(unassignedEntries, slot.acceptedRoles, slotRole);
      if (!entry) {
         continue;
      }
      const entryIndex = unassignedEntries.indexOf(entry);
      if (entryIndex >= 0) {
         unassignedEntries.splice(entryIndex, 1);
      }
      assignedEntries.push({
         entry,
         slot
      });
   }

   if (assignedEntries.length === 0) {
      return {
         applied: false,
         skippedReason: 'registered_template_no_matching_slots',
         remediations: [],
         roleAssignments: []
      };
   }

   const compactResult = compactRegisteredTemplateAssignments(assignedEntries, template, context);
   remediations.push(...compactResult.remediations);
   const overflowRemediations = packRegisteredTemplateOverflowEntries(unassignedEntries, template, {
      ...context,
      startTopPx: compactResult.contentBottom + Math.max(0, parsePixelValue(context?.gutterYPx, compactResult.settings?.gutter || 24))
   });
   remediations.push(...overflowRemediations);
   layout.children = [
      ...assignedEntries.map((entry) => entry.entry.cell),
      ...unassignedEntries.map((entry) => entry.cell)
   ];
   for (let index = 0; index < layout.children.length; index += 1) {
      const cell = layout.children[index];
      if (cell && typeof cell === 'object') {
         cell.zIndex = index + 2;
      }
   }
   const minSizeResult = updateSplitLayoutMinSizeFromCells(layout, {
      bottomPaddingPx: parsePixelValue(context?.bottomPaddingPx, 24),
      allowShrinkHeight: true
   });
   if (minSizeResult) {
      remediations.push(minSizeResult);
   }

   const roleAssignments = [
      ...assignedEntries.map((assignment, index) => ({
         cellIndex: index,
         viewName: assignment.entry.viewName || null,
         pluginType: assignment.entry.pluginType || null,
         runtimeFamily: assignment.entry.runtimeFamily || null,
         role: assignment.entry.role,
         rowGroup: assignment.entry.rowGroup,
         registeredTemplateID: template.id,
         slotID: toNonEmptyTrimmedString(assignment.slot.slotID) || null
      })),
      ...unassignedEntries.map((entry, overflowIndex) => ({
         cellIndex: assignedEntries.length + overflowIndex,
         viewName: entry.viewName || null,
         pluginType: entry.pluginType || null,
         runtimeFamily: entry.runtimeFamily || null,
         role: entry.role,
         rowGroup: entry.rowGroup,
         registeredTemplateID: template.id,
         slotID: null
      }))
   ];

   return {
      applied: true,
      templateID: template.id,
      templateName: template.name || null,
      remediations,
      roleAssignments
   };
}

function normalizeLayoutForArchetype(layout, cellCount, archetypeConfig, context = {}) {
   if (!Array.isArray(layout?.children) || layout.children.length === 0) {
      return { remediations: [], roleAssignments: [] };
   }

   const canvasWidth = parsePixelValue(archetypeConfig?.canvasWidthPx, 1200);
   const viewportHeight = parsePixelValue(archetypeConfig?.viewportHeightPx, 720);
   const topOffset = parsePixelValue(archetypeConfig?.topOffsetPx, 24);
   const leftPadding = parsePixelValue(archetypeConfig?.leftPaddingPx, 24);
   const rightPadding = parsePixelValue(archetypeConfig?.rightPaddingPx, 24);
   const bottomPadding = parsePixelValue(archetypeConfig?.bottomPaddingPx, 24);
   const gutterX = parsePixelValue(archetypeConfig?.gutterXPx, 24);
   const gutterY = parsePixelValue(archetypeConfig?.gutterYPx, 24);
   const maxColumns = Math.max(1, parsePixelValue(archetypeConfig?.maxColumns, 2));
   const minCellHeight = Math.max(140, parsePixelValue(archetypeConfig?.minCellHeightPx, 220));
   const minCellWidth = Math.max(220, parsePixelValue(
      archetypeConfig?.minCellWidthPx,
      parsePixelValue(context?.layoutPolicy?.minCellWidthPx, 240)
   ));
   const resolvedPrimaryWeight = Number.parseFloat(
      archetypeConfig?.primaryDataRowWeight ?? context?.layoutPolicy?.primaryDataRowWeight ?? 1.35
   );
   const primaryRowWeight = Number.isFinite(resolvedPrimaryWeight) && resolvedPrimaryWeight > 0
      ? Math.max(1, resolvedPrimaryWeight)
      : 1.35;
   const primaryDataFamilies = new Set(
      Array.isArray(context?.layoutPolicy?.primaryDataFamilies)
         ? context.layoutPolicy.primaryDataFamilies.filter((value) => typeof value === 'string')
         : ['table', 'pivot']
   );
   const primaryDataMinHeightPx = Math.max(
      minCellHeight,
      parsePixelValue(
         context?.layoutPolicy?.primaryDataMinHeightPx,
         parsePixelValue(context?.minPrimaryTableHeightPx, 360)
      )
   );

   const remediations = [];
   const roleOrder = getLayoutRoleOrder(archetypeConfig, context?.layoutPolicy, context?.polishContract);
   const originalEntries = buildLayoutRoleEntries(layout, {
      ...context,
      archetypeConfig
   });
   const orderedEntries = orderLayoutEntriesByRole(originalEntries, roleOrder);
   const reordered = orderedEntries.some((entry, index) => entry.originalIndex !== index);
   if (reordered) {
      layout.children = orderedEntries.map((entry) => entry.cell);
      remediations.push({
         type: 'role_order_normalized',
         roleOrder: orderedEntries.map((entry) => entry.role)
      });
   }

   const rows = groupLayoutEntriesIntoRows(orderedEntries, maxColumns);
   const availableHeight = viewportHeight - topOffset - bottomPadding - Math.max(0, rows.length - 1) * gutterY;
   const rowWeights = rows.map((row) => Math.max(...row.map((entry) => {
      if (entry.runtimeFamily && primaryDataFamilies.has(entry.runtimeFamily)) {
         return Math.max(entry.rowWeight, primaryRowWeight);
      }
      return entry.rowWeight;
   })));
   const rowMinHeights = rows.map((row) => Math.max(...row.map((entry) => {
      if (entry.runtimeFamily && primaryDataFamilies.has(entry.runtimeFamily)) {
         return Math.max(entry.minHeight, primaryDataMinHeightPx);
      }
      return Math.max(entry.minHeight, minCellHeight);
   })));
   const rowHeights = distributeVariableRowHeights(Math.max(0, availableHeight), rowWeights, rowMinHeights);

   let top = topOffset;
   for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const rowEntries = rows[rowIndex];
      const columns = Math.max(1, rowEntries.length);
      const availableWidth = canvasWidth - leftPadding - rightPadding - Math.max(0, columns - 1) * gutterX;
      const cellWidth = Math.max(minCellWidth, Math.floor(availableWidth / columns));
      const cellHeight = rowHeights[rowIndex] || Math.max(...rowEntries.map((entry) => entry.minHeight), minCellHeight);
      for (let col = 0; col < rowEntries.length; col += 1) {
         const entry = rowEntries[col];
         const cell = entry.cell;
         const left = leftPadding + col * (cellWidth + gutterX);
         const finalIndex = layout.children.indexOf(cell);
         const changed = setCellGeometry(cell, left, top, cellWidth, cellHeight);
         if (!changed) {
            continue;
         }
         remediations.push({
            type: 'geometry_normalized',
            cellIndex: finalIndex >= 0 ? finalIndex : entry.originalIndex,
            role: entry.role,
            left,
            top,
            width: cellWidth,
            height: cellHeight
         });
      }
      top += cellHeight + gutterY;
   }

   const minSizeResult = updateSplitLayoutMinSizeFromCells(layout, {
      bottomPaddingPx: bottomPadding,
      allowShrinkHeight: true
   });
   if (minSizeResult) {
      remediations.push(minSizeResult);
   }

   const roleAssignments = orderedEntries.map((entry, index) => ({
      cellIndex: index,
      viewName: entry.viewName || null,
      pluginType: entry.pluginType || null,
      runtimeFamily: entry.runtimeFamily || null,
      role: entry.role,
      rowGroup: entry.rowGroup
   }));
   return { remediations, roleAssignments };
}

function runPresentationUxLint(workbookJson, context) {
   const findings = [];
   const thresholds = isPlainObject(context?.polishContract?.uxLint?.thresholds)
      ? context.polishContract.uxLint.thresholds
      : {};
   const gutterTolerancePx = Math.max(0, parsePixelValue(thresholds.gutterTolerancePx, 6));
   const layoutOverlapTolerancePx = Math.max(0, parsePixelValue(thresholds.layoutOverlapTolerancePx, 1));
   const minRailWidthPx = Math.max(120, parsePixelValue(thresholds.minRailWidthPx, 220));
   const minPrimaryTableHeightPx = Math.max(180, parsePixelValue(thresholds.minPrimaryTableHeightPx, 360));
   const minPrimaryVisualHeightPx = Math.max(180, parsePixelValue(thresholds.minPrimaryVisualHeightPx, 300));
   const maxCompactPerformanceTileHeightPx = Math.max(96, parsePixelValue(thresholds.maxCompactPerformanceTileHeightPx, 180));
   const maxFirstVisualTopPx = Math.max(120, parsePixelValue(thresholds.maxFirstVisualTopPx, 260));
   const maxCompactDashboardScrollHeightPx = Math.max(560, parsePixelValue(thresholds.maxCompactDashboardScrollHeightPx, 820));
   const compactDashboardMaxViewCount = Math.max(1, parsePixelValue(thresholds.compactDashboardMaxViewCount, 4));
   const paletteFamilyWarningThreshold = Math.max(2, parsePixelValue(thresholds.paletteFamilyWarningThreshold, 4));
   const layoutPolicy = isPlainObject(context?.polishContract?.layoutPolicies)
      ? context.polishContract.layoutPolicies
      : {};

   const layouts = collectLayouts(workbookJson);
   const layoutByName = buildLayoutMapByName(workbookJson);
   const canvasViews = collectCanvasViews(workbookJson);
   const pluginViews = collectPluginViews(workbookJson);
   const pluginByViewName = new Map(
      pluginViews
         .map((entry) => [toNonEmptyTrimmedString(entry?.view?.viewName), entry.view])
         .filter(([viewName]) => Boolean(viewName))
   );

   for (const [layoutIndex, layout] of layouts.entries()) {
      const layoutLabel = layout?.name || `layout_${layoutIndex + 1}`;
      const layoutCells = Array.isArray(layout?.children) ? layout.children : [];
      const gutters = extractHorizontalGutters(layout);
      if (gutters.length > 1) {
         const minGutter = Math.min(...gutters);
         const maxGutter = Math.max(...gutters);
         if (Math.abs(maxGutter - minGutter) > gutterTolerancePx) {
            findings.push({
               id: 'UX_GUTTER_INCONSISTENT',
               severity: 'warning',
               message: `Layout '${layoutLabel}' horizontal gutters are inconsistent (${minGutter}px..${maxGutter}px).`
            });
         }
      }

      const cellGeometries = layoutCells.map((cell, cellIndex) => ({
         cell,
         cellIndex,
         geometry: getCellGeometry(cell)
      }));
      for (let leftIndex = 0; leftIndex < cellGeometries.length; leftIndex += 1) {
         for (let rightIndex = leftIndex + 1; rightIndex < cellGeometries.length; rightIndex += 1) {
            const overlapArea = geometryOverlapArea(cellGeometries[leftIndex].geometry, cellGeometries[rightIndex].geometry);
            if (overlapArea > layoutOverlapTolerancePx) {
               findings.push({
                  id: 'UX_LAYOUT_CELL_OVERLAP',
                  severity: 'severe',
                  message: `Layout '${layoutLabel}' has overlapping cells ${cellGeometries[leftIndex].cellIndex + 1} and ${cellGeometries[rightIndex].cellIndex + 1}.`
               });
            }
         }
      }

      let splitLayoutMinHeight = 0;
      if (layout.type === 'oracle.bi.tech.layout.split') {
         const customPropsText = layout?.layoutProps?.customProps?.text;
         let parsedCustomProps = null;
         if (typeof customPropsText === 'string' && customPropsText.trim() !== '') {
            try {
               parsedCustomProps = JSON.parse(customPropsText);
            } catch (_error) {
               parsedCustomProps = null;
            }
         } else if (isPlainObject(customPropsText)) {
            parsedCustomProps = customPropsText;
         }
         splitLayoutMinHeight = parsePixelValue(parsedCustomProps?.['oracle.bi.tech.layout.split']?.layoutMinSize?.height, 0);
         const requiredHeight = computeLayoutContentBounds(layout).bottom;
         if (splitLayoutMinHeight > 0 && requiredHeight > splitLayoutMinHeight + layoutOverlapTolerancePx) {
            findings.push({
               id: 'UX_LAYOUT_MIN_SIZE_BELOW_CONTENT',
               severity: 'severe',
               message: `Layout '${layoutLabel}' layoutMinSize.height is ${splitLayoutMinHeight}px but content extends to ${requiredHeight}px.`
            });
         }
      }

      const viewCellEntries = layoutCells
         .map((cell, cellIndex) => {
            const geometry = getCellGeometry(cell);
            const cellViewName = toNonEmptyTrimmedString(cell?.content?.viewName);
            const pluginView = cellViewName ? pluginByViewName.get(cellViewName) : null;
            const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
            const runtimeFamily = pluginType && typeof context.resolveRuntimeFamilyForPluginType === 'function'
               ? context.resolveRuntimeFamilyForPluginType(pluginType)
               : null;
            return {
               cell,
               cellIndex,
               geometry,
               cellViewName,
               pluginView,
               pluginType,
               runtimeFamily
            };
         })
         .filter((entry) => entry.cellViewName);
      if (viewCellEntries.length > 0 && viewCellEntries.length <= compactDashboardMaxViewCount) {
         const firstVisualTop = Math.min(...viewCellEntries.map((entry) => entry.geometry.top).filter((value) => value >= 0));
         if (Number.isFinite(firstVisualTop) && firstVisualTop > maxFirstVisualTopPx) {
            findings.push({
               id: 'UX_LAYOUT_EXCESSIVE_TOP_WHITESPACE',
               severity: 'warning',
               message: `Layout '${layoutLabel}' first visual starts at ${firstVisualTop}px; compact dashboards should start before ${maxFirstVisualTopPx}px unless a real header/filter region is present.`
            });
         }
         if (splitLayoutMinHeight > maxCompactDashboardScrollHeightPx) {
            findings.push({
               id: 'UX_LAYOUT_UNNECESSARY_SCROLL_HEIGHT',
               severity: 'warning',
               message: `Layout '${layoutLabel}' has ${viewCellEntries.length} view cell(s) but layoutMinSize.height is ${splitLayoutMinHeight}px; compact dashboards should avoid unnecessary scrolling.`
            });
         }
      }

      let primaryDataViewportChecked = false;
      for (const [cellIndex, cell] of layoutCells.entries()) {
         if (!cell || typeof cell !== 'object') {
            continue;
         }
         const geometry = getCellGeometry(cell);
         if (context.requestedFilterMode === 'filter_viz' && toNonEmptyTrimmedString(cell.filterControlCollectionName)) {
            if (geometry.width > 0 && geometry.width < minRailWidthPx) {
               findings.push({
                  id: 'UX_FILTER_RAIL_TOO_NARROW',
                  severity: 'severe',
                  message: `Filter rail cell in layout '${layoutLabel}' is ${geometry.width}px; expected >= ${minRailWidthPx}px.`
               });
            }
         }

         const cellViewName = toNonEmptyTrimmedString(cell?.content?.viewName);
         const pluginView = cellViewName ? pluginByViewName.get(cellViewName) : null;
         if (cellViewName && !pluginView) {
            findings.push({
               id: 'UX_LAYOUT_CELL_VIEW_MISSING',
               severity: 'severe',
               message: `Layout '${layoutLabel}' cell ${cellIndex + 1} references missing view '${cellViewName}'.`
            });
            continue;
         }
         const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
         const runtimeFamily = pluginType && typeof context.resolveRuntimeFamilyForPluginType === 'function'
            ? context.resolveRuntimeFamilyForPluginType(pluginType)
            : null;
         if (runtimeFamily === 'performance_tile' && geometry.height > maxCompactPerformanceTileHeightPx) {
            findings.push({
               id: 'UX_PERFORMANCE_TILE_TOO_TALL',
               severity: 'warning',
               message: `Performance tile '${cellViewName || `cell_${cellIndex + 1}`}' height is ${geometry.height}px; compact KPI tiles should stay at or below ${maxCompactPerformanceTileHeightPx}px unless intentionally hero-sized.`
            });
         }
         const inferredRole = inferLayoutRoleForCell(cell, {
            polishContract: context.polishContract,
            layoutPolicy,
            pluginByViewName,
            resolveRuntimeFamilyForPluginType: context.resolveRuntimeFamilyForPluginType
         });
         if (!primaryDataViewportChecked && inferredRole === 'primaryDetail' && geometry.height > 0 && geometry.height < minPrimaryTableHeightPx) {
            findings.push({
               id: 'UX_PRIMARY_TABLE_VIEWPORT_TOO_SMALL',
               severity: 'severe',
               message: `Primary ${runtimeFamily} view '${cellViewName || `cell_${cellIndex + 1}`}' height is ${geometry.height}px; expected >= ${minPrimaryTableHeightPx}px.`
            });
         }
         if ((inferredRole === 'primaryComparison' || inferredRole === 'primaryTrend') && geometry.height > 0 && geometry.height < minPrimaryVisualHeightPx) {
            findings.push({
               id: 'UX_PRIMARY_VISUAL_VIEWPORT_TOO_SMALL',
               severity: 'warning',
               message: `Primary visual '${cellViewName || `cell_${cellIndex + 1}`}' height is ${geometry.height}px; expected >= ${minPrimaryVisualHeightPx}px.`
            });
         }
         if (!primaryDataViewportChecked && inferredRole === 'primaryDetail') {
            primaryDataViewportChecked = true;
         }
      }
   }

   for (const [canvasIndex, canvasView] of canvasViews.entries()) {
      const canvasTitle = getCanvasTitle(canvasView);
      if (!canvasTitle) {
         findings.push({
            id: 'UX_CANVAS_TITLE_MISSING',
            severity: 'warning',
            message: `Canvas '${canvasView?.viewName || `canvas_${canvasIndex + 1}`}' is missing a title.`
         });
      }

      const layoutName = toNonEmptyTrimmedString(canvasView?.rootLayoutName);
      const layout = layoutName ? layoutByName.get(layoutName) : null;
      const families = new Set();
      for (const cell of Array.isArray(layout?.children) ? layout.children : []) {
         const viewName = toNonEmptyTrimmedString(cell?.content?.viewName);
         if (!viewName) {
            continue;
         }
         const pluginView = pluginByViewName.get(viewName);
         const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
         const runtimeFamily = pluginType ? context.resolveRuntimeFamilyForPluginType(pluginType) : null;
         if (runtimeFamily) {
            families.add(runtimeFamily);
         }
      }
      if (families.size >= paletteFamilyWarningThreshold) {
         findings.push({
            id: 'UX_PALETTE_RUNTIME_MIX',
            severity: 'warning',
            message: `Canvas '${canvasView?.viewName || `canvas_${canvasIndex + 1}`}' mixes ${families.size} runtime families (${Array.from(families).join(', ')}).`
         });
      }
   }

   return findings;
}

function applyPresentationPolish(workbookJson, context) {
   const polishContract = isPlainObject(context?.polishContract) ? context.polishContract : {};
   const neutralTheme = isPlainObject(polishContract.neutralTheme) ? polishContract.neutralTheme : {};
   const styleTokenSetId = toNonEmptyTrimmedString(
      context?.styleTokenSetId
      || neutralTheme.tokenSetId
      || polishContract?.defaults?.styleTokenSetId
   ) || 'neutral_v2';
   const mode = context?.mode || 'off';
   const titlePolicy = context?.titlePolicy || 'preserve_input';
   const remediationsApplied = [];
   const archetypesApplied = [];
   const styleApplications = [];
   const warnings = [];
   const severe = [];
   const noOpReasons = {};
   let styleChangeCount = 0;
   let compactTableChangeCount = 0;
   let titleNormalizationChangeCount = 0;

   if (mode !== 'off') {
      const canvasViews = collectCanvasViews(workbookJson);
      const layoutByName = buildLayoutMapByName(workbookJson);
      const pluginViews = collectPluginViews(workbookJson);
      const pluginByViewName = new Map(
         pluginViews
            .map((entry) => [toNonEmptyTrimmedString(entry?.view?.viewName), entry.view])
            .filter(([viewName]) => Boolean(viewName))
      );
      const layoutPolicy = isPlainObject(polishContract.layoutPolicies) ? polishContract.layoutPolicies : {};
      const minPrimaryTableHeightPx = Math.max(
         180,
         parsePixelValue(
            polishContract?.uxLint?.thresholds?.minPrimaryTableHeightPx,
            parsePixelValue(layoutPolicy.primaryDataMinHeightPx, 360)
         )
      );
      const compactValueTableMaxHeightPx = Math.max(
         120,
         parsePixelValue(layoutPolicy.compactValueTableMaxHeightPx, 240)
      );
      const duplicateTitleVerticalGapMaxPx = Math.max(
         0,
         parsePixelValue(layoutPolicy.duplicateTitleVerticalGapMaxPx, 96)
      );
      const rawDuplicateTitleOverlapRatio = Number.parseFloat(layoutPolicy.duplicateTitleMinHorizontalOverlapRatio);
      const duplicateTitleMinHorizontalOverlapRatio = Number.isFinite(rawDuplicateTitleOverlapRatio)
         ? Math.min(1, Math.max(0.1, rawDuplicateTitleOverlapRatio))
         : 0.45;

      for (const [canvasIndex, canvasView] of canvasViews.entries()) {
         const canvasSpec = Array.isArray(context?.requestCanvases) ? context.requestCanvases[canvasIndex] : null;
         const canvasExplicitTitle = resolveCanvasTitle(canvasSpec);
         const existingTitle = getCanvasTitle(canvasView);
         if (!existingTitle) {
            const seedTitle = humanizeToken(canvasExplicitTitle || canvasSpec?.name || canvasSpec?.id || `Canvas ${canvasIndex + 1}`);
            const generatedTitle = titlePolicy === 'question_oriented'
               ? (toQuestionTitle(seedTitle) || `How is canvas ${canvasIndex + 1}?`)
               : (seedTitle || `Canvas ${canvasIndex + 1}`);
            if (setCanvasTitle(canvasView, generatedTitle)) {
               remediationsApplied.push({
                  type: 'canvas_title_applied',
                  canvasIndex,
                  title: generatedTitle
               });
            }
         } else if (titlePolicy === 'question_oriented' && !canvasExplicitTitle && !/[?]$/.test(existingTitle)) {
            const normalizedTitle = toQuestionTitle(existingTitle);
            if (normalizedTitle && normalizedTitle !== existingTitle && setCanvasTitle(canvasView, normalizedTitle)) {
               remediationsApplied.push({
                  type: 'canvas_title_normalized',
                  canvasIndex,
                  title: normalizedTitle
               });
            }
         }

         const archetypeID = resolveCanvasArchetypeID(
            context?.layoutTemplateHints,
            canvasSpec,
            canvasIndex,
            context?.requestedFilterMode || 'filter_bar',
            polishContract
         );
         const archetype = getArchetypeConfig(polishContract, archetypeID);
         const layoutName = toNonEmptyTrimmedString(canvasView?.rootLayoutName);
         const layout = layoutName ? layoutByName.get(layoutName) : null;
         if (!layout || !Array.isArray(layout.children) || layout.children.length === 0) {
            warnings.push({
               id: 'UX_LAYOUT_MISSING_FOR_CANVAS',
               severity: 'warning',
               message: `Canvas '${canvasView?.viewName || `canvas_${canvasIndex + 1}`}' is missing a layout and was not normalized.`
            });
            incrementCounter(noOpReasons, 'layout_missing_for_canvas');
            continue;
         }
         const registeredTemplateCandidate = resolveRegisteredLayoutTemplateCandidate(
            context?.layoutTemplateHints,
            canvasSpec,
            canvasIndex,
            context?.requestedFilterMode || 'filter_bar',
            context?.systemLayoutTemplates || {}
         );
         const registeredTemplate = registeredTemplateCandidate
            ? getSystemLayoutTemplateByID(context?.systemLayoutTemplates || {}, registeredTemplateCandidate.templateID)
            : null;
         let registeredTemplateResult = null;
         if (registeredTemplate) {
            registeredTemplateResult = normalizeLayoutForRegisteredTemplate(layout, registeredTemplate, {
               pluginByViewName,
               resolveRuntimeFamilyForPluginType: context.resolveRuntimeFamilyForPluginType,
               layoutPolicy,
               polishContract,
               systemLayoutTemplates: context?.systemLayoutTemplates || {},
               registeredLayoutTemplateCandidate: registeredTemplateCandidate,
               leftPaddingPx: archetype.config.leftPaddingPx,
               rightPaddingPx: archetype.config.rightPaddingPx,
               bottomPaddingPx: archetype.config.bottomPaddingPx,
               gutterXPx: archetype.config.gutterXPx,
               gutterYPx: archetype.config.gutterYPx
            });
            if (registeredTemplateResult.applied !== true) {
               incrementCounter(noOpReasons, registeredTemplateResult.skippedReason || 'registered_template_skipped');
            }
         }
         const geometryResult = registeredTemplateResult?.applied === true
            ? registeredTemplateResult
            : normalizeLayoutForArchetype(layout, layout.children.length, archetype.config, {
               pluginByViewName,
               resolveRuntimeFamilyForPluginType: context.resolveRuntimeFamilyForPluginType,
               layoutPolicy,
               minPrimaryTableHeightPx,
               polishContract
            });
         archetypesApplied.push({
            canvasIndex,
            canvasID: toNonEmptyTrimmedString(canvasSpec?.id) || null,
            layoutName,
            archetypeID: archetype.archetypeID,
            registeredTemplateID: registeredTemplateResult?.applied === true ? registeredTemplateResult.templateID : null,
            registeredTemplateName: registeredTemplateResult?.applied === true ? registeredTemplateResult.templateName : null,
            registeredTemplateSource: registeredTemplateResult?.applied === true ? registeredTemplateCandidate?.source : null,
            roleAssignments: geometryResult.roleAssignments || []
         });
         if (geometryResult.remediations.length === 0) {
            incrementCounter(noOpReasons, 'layout_already_normalized');
         }
         remediationsApplied.push(...geometryResult.remediations.map((entry) => ({
            ...entry,
            canvasIndex,
            layoutName,
            archetypeID: archetype.archetypeID
         })));

         // Compact single-value tables in small cards should prioritize value visibility.
         // Hiding row headers prevents header-only rendering in constrained tile-like regions.
         for (const [cellIndex, cell] of layout.children.entries()) {
            if (!cell || typeof cell !== 'object') {
               continue;
            }
            const geometry = getCellGeometry(cell);
            if (geometry.height <= 0 || geometry.height > compactValueTableMaxHeightPx) {
               continue;
            }
            const viewName = toNonEmptyTrimmedString(cell?.content?.viewName);
            if (!viewName) {
               continue;
            }
            const pluginView = pluginByViewName.get(viewName);
            const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
            const runtimeFamily = pluginType ? context.resolveRuntimeFamilyForPluginType(pluginType) : null;
            if (runtimeFamily !== 'table') {
               continue;
            }

            const rowEdge = findEdgeByAxis(pluginView, 'row');
            const visibleRowLayers = getVisibleRowColumnLayers(rowEdge);
            if (visibleRowLayers.length !== 1) {
               continue;
            }

            const previousShowColumnHeader = toNonEmptyTrimmedString(rowEdge?.showColumnHeader) || null;
            if (previousShowColumnHeader === 'false') {
               incrementCounter(noOpReasons, 'compact_table_header_already_hidden');
               continue;
            }

            rowEdge.showColumnHeader = 'false';
            compactTableChangeCount += 1;
            remediationsApplied.push({
               type: 'compact_table_header_hidden',
               canvasIndex,
               layoutName,
               viewName,
               cellIndex,
               previousShowColumnHeader,
               compactValueTableMaxHeightPx
            });
         }

         // Avoid duplicate section titles when a textbox title sits above a table.
         // Keep textbox title and suppress matching table caption to prevent inconsistent double-title rendering.
         const canvasCellEntries = layout.children
            .map((cell, cellIndex) => {
               const viewName = toNonEmptyTrimmedString(cell?.content?.viewName);
               if (!viewName) {
                  return null;
               }
               const pluginView = pluginByViewName.get(viewName);
               if (!pluginView) {
                  return null;
               }
               const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
               const runtimeFamily = pluginType ? context.resolveRuntimeFamilyForPluginType(pluginType) : null;
               return {
                  cellIndex,
                  viewName,
                  pluginView,
                  pluginType,
                  runtimeFamily,
                  geometry: getCellGeometry(cell)
               };
            })
            .filter(Boolean);

         const tableCaptionSuppressedForView = new Set();
         const tableEntries = canvasCellEntries.filter((entry) => entry.runtimeFamily === 'table');
         const textboxEntries = canvasCellEntries.filter(
            (entry) => entry.pluginType === 'oracle.bi.tech.textbox' && entry.runtimeFamily === 'ui_control'
         );
         for (const textboxEntry of textboxEntries) {
            const textboxCaption = getViewCaptionText(textboxEntry.pluginView);
            const textboxBodyText = getTextboxBodyText(textboxEntry.pluginView);
            if (!textboxBodyText && textboxCaption) {
               const seeded = setTextboxBodyText(textboxEntry.pluginView, textboxCaption, context.viewConfigDefaultVersion);
               if (seeded) {
                  titleNormalizationChangeCount += 1;
                  remediationsApplied.push({
                     type: 'textbox_text_seeded_from_caption',
                     canvasIndex,
                     layoutName,
                     viewName: textboxEntry.viewName,
                     cellIndex: textboxEntry.cellIndex,
                     text: textboxCaption
                  });
               }
            }

            const effectiveTextboxTitle = getTextboxBodyText(textboxEntry.pluginView) || getViewCaptionText(textboxEntry.pluginView);
            if (!effectiveTextboxTitle) {
               continue;
            }
            const textboxBottom = textboxEntry.geometry.top + Math.max(0, textboxEntry.geometry.height);
            const candidateTables = tableEntries
               .map((tableEntry) => {
                  const tableTop = tableEntry.geometry.top;
                  const verticalGap = tableTop - textboxBottom;
                  const overlapRatio = geometryHorizontalOverlapRatio(textboxEntry.geometry, tableEntry.geometry);
                  return {
                     tableEntry,
                     verticalGap,
                     overlapRatio
                  };
               })
               .filter((candidate) => (
                  candidate.verticalGap >= 0
                  && candidate.verticalGap <= duplicateTitleVerticalGapMaxPx
                  && candidate.overlapRatio >= duplicateTitleMinHorizontalOverlapRatio
               ))
               .sort((left, right) => {
                  if (left.verticalGap !== right.verticalGap) {
                     return left.verticalGap - right.verticalGap;
                  }
                  if (left.overlapRatio !== right.overlapRatio) {
                     return right.overlapRatio - left.overlapRatio;
                  }
                  return left.tableEntry.cellIndex - right.tableEntry.cellIndex;
               });
            for (const candidate of candidateTables) {
               const tableEntry = candidate.tableEntry;
               if (tableCaptionSuppressedForView.has(tableEntry.viewName)) {
                  continue;
               }
               const tableCaption = getViewCaptionText(tableEntry.pluginView);
               if (!tableCaption) {
                  incrementCounter(noOpReasons, 'table_caption_already_empty');
                  continue;
               }
               if (!titlesEquivalent(effectiveTextboxTitle, tableCaption)) {
                  continue;
               }
               if (clearViewCaptionText(tableEntry.pluginView)) {
                  tableCaptionSuppressedForView.add(tableEntry.viewName);
                  titleNormalizationChangeCount += 1;
                  remediationsApplied.push({
                     type: 'table_caption_suppressed_for_textbox_title',
                     canvasIndex,
                     layoutName,
                     textboxViewName: textboxEntry.viewName,
                     textboxCellIndex: textboxEntry.cellIndex,
                     tableViewName: tableEntry.viewName,
                     tableCellIndex: tableEntry.cellIndex,
                     title: tableCaption
                  });
               }
               break;
            }
         }
      }

      const styleOverlaysByFamily = isPlainObject(polishContract.styleOverlaysByRuntimeFamily)
         ? polishContract.styleOverlaysByRuntimeFamily
         : {};
      for (const pluginEntry of pluginViews) {
         const pluginView = pluginEntry.view;
         const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
         const viewName = toNonEmptyTrimmedString(pluginView?.viewName) || `plugin_view_${pluginEntry.index + 1}`;
         const runtimeFamily = pluginType ? context.resolveRuntimeFamilyForPluginType(pluginType) : null;
         if (!runtimeFamily) {
            incrementCounter(noOpReasons, 'unsupported_runtime_family');
            styleApplications.push({
               viewName,
               pluginType,
               runtimeFamily,
               applied: false,
               changedPathCount: 0,
               noOpReason: 'unsupported_runtime_family'
            });
            continue;
         }
         const overlaySpecs = Array.isArray(styleOverlaysByFamily[runtimeFamily])
            ? styleOverlaysByFamily[runtimeFamily]
            : [];
         if (overlaySpecs.length === 0) {
            incrementCounter(noOpReasons, 'overlay_not_configured');
            styleApplications.push({
               viewName,
               pluginType,
               runtimeFamily,
               applied: false,
               changedPathCount: 0,
               noOpReason: 'overlay_not_configured'
            });
            continue;
         }
         const settings = ensureViewConfigSettings(pluginView, context.viewConfigDefaultVersion);
         const attemptedPaths = [];
         const changedPaths = [];
         const skippedReasons = [];
         let changedPathCount = 0;

         for (const overlaySpec of overlaySpecs) {
            const configuredPath = toNonEmptyTrimmedString(overlaySpec?.path);
            const overlay = isPlainObject(overlaySpec?.overlay) ? overlaySpec.overlay : null;
            if (!configuredPath) {
               skippedReasons.push('invalid_overlay_path');
               continue;
            }
            if (!overlay || Object.keys(overlay).length === 0) {
               skippedReasons.push('overlay_empty');
               continue;
            }
            const normalizedPath = configuredPath.replace(/^viewConfig\.settings\./, '');
            const pathSegments = normalizePathSegments(normalizedPath);
            if (pathSegments.length === 0) {
               skippedReasons.push('invalid_overlay_path');
               continue;
            }
            const createPathIfMissing = overlaySpec?.createPathIfMissing === true;
            const target = createPathIfMissing
               ? ensureNestedObjectAtPath(settings, pathSegments)
               : getNestedObjectAtPath(settings, pathSegments);
            if (!target) {
               skippedReasons.push('style_path_missing_in_scaffold');
               continue;
            }
            attemptedPaths.push(normalizedPath);
            const mergeResult = mergeOverlayIntoTarget(target, overlay);
            changedPathCount += mergeResult.changedPathCount;
            changedPaths.push(...mergeResult.changedPaths);
         }

         const applied = changedPathCount > 0;
         let noOpReason = null;
         if (!applied) {
            noOpReason = skippedReasons[0] || 'already_in_desired_state';
            incrementCounter(noOpReasons, noOpReason);
         }
         styleApplications.push({
            viewName,
            pluginType,
            runtimeFamily,
            attemptedPaths,
            changedPaths,
            changedPathCount,
            applied,
            noOpReason
         });
         styleChangeCount += changedPathCount;
      }
   }

   const lintFindings = runPresentationUxLint(workbookJson, context);
   for (const finding of lintFindings) {
      if (finding?.severity === 'severe') {
         severe.push(finding);
      } else {
         warnings.push(finding);
      }
   }

   const findings = [...warnings, ...severe];
   const strictViolation = mode === 'strict' && severe.length > 0;
   const layoutChangeTypes = new Set([
      'geometry_normalized',
      'role_order_normalized',
      'layout_min_size_updated',
      'registered_template_slot_applied',
      'registered_template_overflow_geometry_normalized'
   ]);
   const layoutChangeCount = remediationsApplied.filter((entry) => layoutChangeTypes.has(entry?.type)).length;
   const titleChangeCount = remediationsApplied.filter((entry) => `${entry?.type || ''}`.startsWith('canvas_title_')).length;
   styleChangeCount += compactTableChangeCount + titleNormalizationChangeCount;
   const effectiveChangeCount = layoutChangeCount + styleChangeCount + titleChangeCount;
   return {
      mode,
      applied: mode !== 'off',
      styleTokenSetId,
      archetypesApplied,
      titlePolicy,
      effectiveChangeCount,
      layoutChangeCount,
      styleChangeCount,
      noOpReasons,
      uxLintSummary: {
         warningCount: warnings.length,
         severeCount: severe.length,
         findings,
         strictViolation
      },
      remediationsApplied,
      styleApplications
   };
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
         const columnID = nestedValue.trim();
         if (columnID !== EMBEDDED_VIZ_DUMMY_MEASURE_LINK_COLUMN_ID) {
            collector.add(columnID);
         }
      }
      collectColumnIDsFromValue(nestedValue, collector);
   }
}

function getColumnLabel(column, fallbackID) {
   const heading = toNonEmptyTrimmedString(column?.columnHeading?.caption?.text);
   if (heading) {
      return heading;
   }
   const formula = toNonEmptyTrimmedString(column?.columnFormula?.expr?.expression);
   if (formula && formula.length <= 96) {
      return formula;
   }
   return fallbackID;
}

function getTextTokensForColumn(column, fallbackID) {
   const fragments = [];
   const heading = toNonEmptyTrimmedString(column?.columnHeading?.caption?.text);
   const expression = toNonEmptyTrimmedString(column?.columnFormula?.expr?.expression);
   if (heading) {
      fragments.push(heading);
   }
   if (fallbackID) {
      fragments.push(fallbackID);
   }
   if (expression) {
      fragments.push(expression);
   }
   return fragments.join(' ').toLowerCase();
}

function inferCurrencyCodeFromText(lowerText) {
   const currencySignals = [
      { pattern: /\b(usd|us dollar|dollar)\b/, code: 'USD' },
      { pattern: /\b(eur|euro)\b/, code: 'EUR' },
      { pattern: /\b(gbp|pound|sterling)\b/, code: 'GBP' },
      { pattern: /\b(jpy|yen)\b/, code: 'JPY' },
      { pattern: /\b(cad)\b/, code: 'CAD' },
      { pattern: /\b(aud)\b/, code: 'AUD' },
      { pattern: /\b(inr|rupee)\b/, code: 'INR' }
   ];
   for (const signal of currencySignals) {
      if (signal.pattern.test(lowerText)) {
         return signal.code;
      }
   }
   if (lowerText.includes('$')) {
      return 'USD';
   }
   return 'USD';
}

function inferAutoSafeNumberFormat(column, columnID) {
   const lowerText = getTextTokensForColumn(column, columnID);
   const percentSignal = /%|\b(percent|percentage|pct|ratio|rate|share|conversion)\b/;
   if (percentSignal.test(lowerText)) {
      return {
         style: 'percent',
         useGrouping: true,
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
         useAbbreviation: false,
         negativeValuesStyle: 'default',
         currencyDisplay: 'symbol'
      };
   }
   const currencySignal = /\$|\b(revenue|sales|amount|cost|price|profit|expense|spend|income|gmv|arr|mrr)\b|\b(usd|eur|gbp|jpy|cad|aud|inr)\b/;
   if (currencySignal.test(lowerText)) {
      return {
         style: 'currency',
         currency: inferCurrencyCodeFromText(lowerText),
         useGrouping: true,
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
         useAbbreviation: false,
         negativeValuesStyle: 'default',
         currencyDisplay: 'symbol'
      };
   }
   const integerSignal = /\b(count|qty|quantity|units|orders|customers|visits|sessions|transactions|records)\b|count\s*\(/;
   if (integerSignal.test(lowerText)) {
      return {
         style: 'decimal',
         useGrouping: true,
         minimumFractionDigits: 0,
         maximumFractionDigits: 0,
         useAbbreviation: false,
         negativeValuesStyle: 'default',
         currencyDisplay: 'symbol'
      };
   }
   return null;
}

function isLikelyMeasureColumn(column, columnID) {
   if (typeof columnID === 'string' && columnID.startsWith('mea_')) {
      return true;
   }
   const expression = toNonEmptyTrimmedString(column?.columnFormula?.expr?.expression);
   if (expression) {
      const expressionLower = expression.toLowerCase();
      if (/\b(sum|avg|average|min|max|count|median|stddev|variance|distinct)\s*\(/.test(expressionLower)) {
         return true;
      }
   }
   const lowerText = getTextTokensForColumn(column, columnID);
   return /\b(revenue|sales|amount|cost|price|profit|expense|income|count|qty|quantity|units|orders|customers|visits|sessions|transactions|records|percent|percentage|pct|ratio|rate|share)\b/.test(lowerText);
}

const NUMBER_FORMAT_ALLOWED_ABBREVIATION_SCALES = new Set([
   'off',
   'on',
   'thousand',
   'million',
   'billion',
   'trillion'
]);
const NUMBER_FORMAT_ALLOWED_NEGATIVE_VALUE_STYLES = new Set([
   'default',
   'accounting',
   'red',
   'red_accounting'
]);

function normalizeNumberFormatSpec(rawSpec, errorFieldPath) {
   if (!rawSpec || typeof rawSpec !== 'object' || Array.isArray(rawSpec)) {
      fail('INVALID_REQUEST_CONTRACT', `${errorFieldPath} must be an object.`);
   }
   const normalized = { ...rawSpec };
   const allowedStyles = new Set(['decimal', 'percent', 'same_as_measure', 'currency']);
   if (typeof normalized.style === 'string') {
      if (!allowedStyles.has(normalized.style)) {
         fail('INVALID_REQUEST_CONTRACT', `${errorFieldPath}.style must be one of ${Array.from(allowedStyles).join(', ')}.`);
      }
   } else {
      normalized.style = 'decimal';
   }
   if (normalized.style === 'currency') {
      const currency = toNonEmptyTrimmedString(normalized.currency);
      normalized.currency = currency || 'USD';
   }
   if (typeof normalized.useGrouping !== 'boolean') {
      normalized.useGrouping = true;
   }
   if (typeof normalized.minimumFractionDigits !== 'number') {
      normalized.minimumFractionDigits = normalized.style === 'currency' || normalized.style === 'percent' ? 2 : 0;
   }
   if (typeof normalized.maximumFractionDigits !== 'number') {
      normalized.maximumFractionDigits = normalized.style === 'currency' || normalized.style === 'percent' ? 2 : normalized.minimumFractionDigits;
   }
   if (typeof normalized.useAbbreviation !== 'boolean') {
      normalized.useAbbreviation = false;
   }
   if (typeof normalized.abbreviationScale === 'string') {
      const abbreviationScale = normalized.abbreviationScale.trim();
      if (abbreviationScale === 'auto') {
         normalized.abbreviationScale = 'on';
      } else if (NUMBER_FORMAT_ALLOWED_ABBREVIATION_SCALES.has(abbreviationScale)) {
         normalized.abbreviationScale = abbreviationScale;
      } else {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${errorFieldPath}.abbreviationScale must be one of ${Array.from(NUMBER_FORMAT_ALLOWED_ABBREVIATION_SCALES).join(', ')}. Use 'on' for automatic abbreviation.`
         );
      }
   } else if (normalized.abbreviationScale !== undefined && normalized.abbreviationScale !== null) {
      fail('INVALID_REQUEST_CONTRACT', `${errorFieldPath}.abbreviationScale must be a string when provided.`);
   } else {
      delete normalized.abbreviationScale;
      if (normalized.useAbbreviation === true) {
         normalized.abbreviationScale = 'on';
      }
   }
   if (typeof normalized.negativeValuesStyle === 'string') {
      const negativeValuesStyle = normalized.negativeValuesStyle.trim();
      if (negativeValuesStyle === 'minus') {
         normalized.negativeValuesStyle = 'default';
      } else if (NUMBER_FORMAT_ALLOWED_NEGATIVE_VALUE_STYLES.has(negativeValuesStyle)) {
         normalized.negativeValuesStyle = negativeValuesStyle;
      } else {
         fail(
            'INVALID_REQUEST_CONTRACT',
            `${errorFieldPath}.negativeValuesStyle must be one of ${Array.from(NUMBER_FORMAT_ALLOWED_NEGATIVE_VALUE_STYLES).join(', ')}. Use 'default' for minus-sign negatives.`
         );
      }
   } else if (normalized.negativeValuesStyle !== undefined && normalized.negativeValuesStyle !== null) {
      fail('INVALID_REQUEST_CONTRACT', `${errorFieldPath}.negativeValuesStyle must be a string when provided.`);
   } else {
      normalized.negativeValuesStyle = 'default';
   }
   if (typeof normalized.currencyDisplay !== 'string') {
      normalized.currencyDisplay = 'symbol';
   }
   return normalized;
}

function ensureViewConfigSettings(pluginView, viewConfigDefaultVersion) {
   const viewConfig = ensurePluginViewConfig(pluginView, viewConfigDefaultVersion);
   if (!isPlainObject(viewConfig.settings)) {
      viewConfig.settings = {};
   }
   return viewConfig.settings;
}

function ensurePluginViewConfig(pluginView, viewConfigDefaultVersion) {
   if (!isPlainObject(pluginView?.viewConfig)) {
      pluginView.viewConfig = {
         _version: viewConfigDefaultVersion,
         settings: {}
      };
   } else if (toNonEmptyTrimmedString(pluginView.viewConfig._version) == null) {
      pluginView.viewConfig._version = viewConfigDefaultVersion;
   }
   return pluginView.viewConfig;
}

function normalizeFormatterPath(pathExpression) {
   if (typeof pathExpression !== 'string' || pathExpression.trim() === '') {
      return [];
   }
   return pathExpression.split('.').map((segment) => segment.trim()).filter((segment) => segment !== '');
}

function ensureNestedObjectAtPath(target, pathSegments) {
   let cursor = target;
   for (const segment of pathSegments) {
      if (!isPlainObject(cursor?.[segment])) {
         cursor[segment] = {};
      }
      cursor = cursor[segment];
   }
   return cursor;
}

function sanitizeFormatterToken(rawValue) {
   const normalized = toNonEmptyTrimmedString(rawValue) || '';
   const compact = normalized
      .replace(/[^A-Za-z0-9_]/g, '')
      .trim();
   return compact || null;
}

function buildNumberFormatPropertyKeys(runtimeFamily, column, columnID) {
   const heading = toNonEmptyTrimmedString(column?.columnHeading?.caption?.text);
   const token = sanitizeFormatterToken(heading) || sanitizeFormatterToken(columnID) || 'Measure';
   const normalizedColumnID = toNonEmptyTrimmedString(columnID);
   const keys = [];

   if (runtimeFamily === 'performance_tile') {
      keys.push(`numberFormat${token}`);
      if (normalizedColumnID) {
         keys.push(`numberFormat${token}:::${normalizedColumnID}`);
         keys.push(`numberFormat${token}:::${normalizedColumnID}.tooltip`);
      }
      return [...new Set(keys)];
   }

   let prefix = 'bidvtchart_number_format_';
   if (runtimeFamily === 'map') {
      prefix = 'map_number_format_';
   } else if (runtimeFamily === 'network_graph') {
      prefix = 'embed_chart_number_format_';
   }
   keys.push(`${prefix}${token}`);
   keys.push(`${prefix}${token}.tooltip`);
   if (normalizedColumnID) {
      keys.push(`${prefix}${token}:::${normalizedColumnID}`);
      keys.push(`${prefix}${token}:::${normalizedColumnID}.tooltip`);
   }
   return [...new Set(keys)];
}

function resolveExistingPath(candidates, code, label) {
   for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'string') {
         continue;
      }
      const resolved = path.resolve(candidate);
      if (fs.existsSync(resolved)) {
         return resolved;
      }
   }
   fail(code, `Unable to resolve ${label}. Checked: ${candidates.filter(Boolean).join(', ')}`);
}

function normalizeVersionToken(value, label) {
   if (value == null) {
      return null;
   }
   const normalized = String(value).trim();
   if (normalized === '') {
      return null;
   }
   if (!/^\d{2}\.\d{2}$/.test(normalized)) {
      fail('UNRESOLVED_TARGET_VERSION', `${label} '${value}' must use YY.MM format (example: 26.07).`);
   }
   const [majorRaw, minorRaw] = normalized.split('.');
   const major = Number.parseInt(majorRaw, 10);
   const minor = Number.parseInt(minorRaw, 10);
   if (!Number.isInteger(major) || !Number.isInteger(minor)) {
      fail('UNRESOLVED_TARGET_VERSION', `${label} '${value}' must use YY.MM format (example: 26.07).`);
   }
   if (major < 26 || (major === 26 && minor < 1)) {
      fail('UNRESOLVED_TARGET_VERSION', `${label} '${value}' is not supported. Minimum supported target is 26.01.`);
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

function detectVersionMismatchValidationSignal(savePayload) {
   if (!savePayload || typeof savePayload !== 'object') {
      return false;
   }
   const serialized = JSON.stringify(savePayload).toLowerCase();
   if (!serialized) {
      return false;
   }
   const hasVersionMismatchMessage = (
      /version\s+\d+\.\d+\.\d+\s+doesnt exist/i.test(serialized) ||
      /version\s+\d+\.\d+\.\d+\s+doesn't exist/i.test(serialized) ||
      serialized.includes('value for version field _version not provided')
   );
   if (!hasVersionMismatchMessage) {
      return false;
   }
   return (
      serialized.includes('/views/children/') ||
      serialized.includes('viewconfig') ||
      serialized.includes('canvasconfig') ||
      serialized.includes('criteria')
   );
}

function listInstalledVersionBundles(bundleRootDir) {
   let entries = [];
   try {
      entries = fs.readdirSync(bundleRootDir, { withFileTypes: true });
   } catch (error) {
      return [];
   }

   const versions = [];
   for (const entry of entries) {
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
            'UNRESOLVED_TARGET_VERSION',
            `targetVersion '${explicitTargetVersion}' is not installed. Installed versions: ${availableTargetVersions.join(', ')}`
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

const requestPathArg = getArg('--request');
if (!requestPathArg) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      'Usage: node .workbook-authoring/tools/regenerate-workbook.mjs --request <request.json> [--compatibility-target <auto|legacy|standard|current|pv-N>] [--server-project-version <N>] [--target-version <deprecated YY.MM alias>] [--output <workbook.json>] [--viz-resolution-profiles <file>] [--schema-registry-profile <file>] [--schema-dir <dir>]'
   );
}

const requestedOutputPathArg = getArg('--output');
const requestPath = path.resolve(requestPathArg);
if (!fs.existsSync(requestPath)) {
   fail('INVALID_REQUEST_CONTRACT', `Request file does not exist: ${requestPath}`);
}
const request = readJson(requestPath, 'INVALID_REQUEST_CONTRACT');
ensureObject(request, 'request');

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workbookAuthoringDir = path.resolve(scriptDir, '..');
const skillBundleDir = path.resolve(workbookAuthoringDir, '..');
const appDir = path.resolve(skillBundleDir, '..');
const repoRoot = path.resolve(appDir, '..', '..');
const runtimeValidationCheckPath = path.join(workbookAuthoringDir, 'tools', 'runtime-validation-check.mjs');
const requirementsTraceValidationPath = path.join(workbookAuthoringDir, 'tools', 'validate-requirements-trace.mjs');
const dvIntelligenceScoringPath = path.join(workbookAuthoringDir, 'tools', 'score-dv-intelligence.mjs');
const requestedTargetVersion = normalizeVersionToken(
   getArg('--target-version') || request.targetVersion || process.env.WORKBOOK_AUTHORING_TARGET_VERSION || null,
   'targetVersion'
);
const requestedCompatibilityTarget = getArg('--compatibility-target') ||
   request.compatibilityTarget ||
   process.env.WORKBOOK_AUTHORING_COMPATIBILITY_TARGET ||
   null;
const serverProjectVersion = getArg('--server-project-version') ||
   request?.serverInfo?.oracleAnalytics?.workbook?.latestProjectVersion ||
   request?.serverInfo?.workbook?.latestProjectVersion ||
   request.serverProjectVersion ||
   process.env.WORKBOOK_AUTHORING_SERVER_PROJECT_VERSION ||
   null;
const oacMcpConnectedOverride = parseBooleanArg(
   getArg('--oac-mcp-connected') || process.env.WORKBOOK_AUTHORING_OAC_MCP_CONNECTED || null,
   '--oac-mcp-connected'
);
const rawCapabilitiesForVersionSelection = request.capabilities && typeof request.capabilities === 'object'
   ? request.capabilities
   : {};
const saveAvailableForDefaultVersion = rawCapabilitiesForVersionSelection.saveAvailable === true;
const oacMcpConnectedForDefaultVersion = oacMcpConnectedOverride ?? (
   rawCapabilitiesForVersionSelection.oacMcpConnected === true || saveAvailableForDefaultVersion
);
const boundWorkbookPath = request?.adapterPayload?.binding?.boundWorkbookPath;
const boundWorkbookPayload = request?.adapterPayload?.binding?.boundWorkbookJson ||
   (typeof boundWorkbookPath === 'string' ? tryReadJson(boundWorkbookPath) : null) ||
   null;
const generationStrategyForVersionSelection = toNonEmptyTrimmedString(request.generationStrategy) || 'auto';
let boundWorkbookProjectVersionForSelection = null;
let versionBundleSelection;
try {
   boundWorkbookProjectVersionForSelection = generationStrategyForVersionSelection === 'compose_ootb'
      ? null
      : extractWorkbookProjectVersion(boundWorkbookPayload);
   versionBundleSelection = fs.existsSync(path.join(workbookAuthoringDir, 'compatibility-profiles.json'))
      ? resolveCompatibilityProfile(workbookAuthoringDir, {
         explicitCompatibilityTarget: requestedCompatibilityTarget,
         legacyReleaseTarget: requestedTargetVersion,
         existingWorkbookProjectVersion: boundWorkbookProjectVersionForSelection,
         serverProjectVersion,
         oacMcpConnected: oacMcpConnectedForDefaultVersion,
         saveAvailable: saveAvailableForDefaultVersion,
         allowSourceCurrentProfile: true
      })
      : resolveVersionBundleSelection(workbookAuthoringDir, requestedTargetVersion, {
         detectedTargetVersion: null,
         saveAvailableForDefaultVersion,
         preferFallbackVersionFromValidationError: false
      });
} catch (error) {
   fail('UNRESOLVED_TARGET_VERSION', error?.message || String(error));
}
const contractsDir = path.join(versionBundleSelection.selectedBundleRootDir, 'model');
const templatesDir = path.join(versionBundleSelection.selectedBundleRootDir, 'templates');

const regenerateContractPath = path.join(contractsDir, 'regenerate-workbook-contract.v1.json');
const adapterContractPath = path.join(contractsDir, 'regenerate-workbook-adapter-contract.v1.json');
const supportWindowPath = path.join(contractsDir, 'support-window.v1.json');
const templateIndexPath = path.join(templatesDir, 'template-index.json');
const filterProfilingContractPath = path.join(contractsDir, 'filter-profiling-contracts.v1.json');
const semanticRoleContractsPath = path.join(contractsDir, 'semantic-role-contracts.v1.json');
const calculationContractsPath = path.join(contractsDir, 'calculation-contracts.v1.json');
const presentationPolishContractsPath = path.join(contractsDir, 'presentation-polish-contracts.v1.json');
const systemLayoutTemplatesPath = path.join(contractsDir, 'system-layout-templates.v1.json');
const dvIntelligenceContractsPath = path.join(contractsDir, 'dv-intelligence-contract.v1.json');
const runtimePathRegistryPath = path.join(contractsDir, 'runtime-path-registry.v1.json');
const pluginTypeAliasesPath = path.join(contractsDir, 'plugin-type-aliases.v1.json');
const versionFieldCatalogPath = path.join(contractsDir, 'version-field-catalog.json');

if (!fs.existsSync(runtimeValidationCheckPath)) {
   fail('RUNTIME_VALIDATION_CHECK_STRICT_FAILED', `Missing runtime-validation-check tool: ${runtimeValidationCheckPath}`);
}
if (!fs.existsSync(requirementsTraceValidationPath)) {
   fail('REQUIREMENTS_TRACE_VALIDATION_FAILED', `Missing validate-requirements-trace tool: ${requirementsTraceValidationPath}`);
}

const regenerateContract = readJson(regenerateContractPath, 'INVALID_REQUEST_CONTRACT');
const adapterContract = readJson(adapterContractPath, 'INVALID_ADAPTER_CONTRACT');
const supportWindow = readJson(supportWindowPath, 'UNRESOLVED_TARGET_VERSION');
const templateIndex = readJson(templateIndexPath, 'UNRESOLVED_PLUGIN_PROFILE');
const filterProfilingContract = readJson(filterProfilingContractPath, 'INVALID_ADAPTER_CONTRACT');
const semanticRoleContracts = readJson(semanticRoleContractsPath, 'INVALID_ADAPTER_CONTRACT');
const calculationContracts = readJson(calculationContractsPath, 'INVALID_ADAPTER_CONTRACT');
const presentationPolishContracts = readJson(presentationPolishContractsPath, 'INVALID_REQUEST_CONTRACT');
const systemLayoutTemplates = tryReadJson(systemLayoutTemplatesPath) || {
   manifestVersion: 1,
   contractVersion: 'v1',
   defaults: {},
   templates: {}
};
const dvIntelligenceContracts = tryReadJson(dvIntelligenceContractsPath) || {
   contractVersion: 'v1',
   modes: ['auto', 'off'],
   defaults: {
      mode: 'auto',
      profileByTargetVersion: {
         default: 'balanced_v1'
      }
   }
};
const pluginTypeAliases = readJson(pluginTypeAliasesPath, 'UNRESOLVED_PLUGIN_PROFILE');
const versionFieldCatalog = readJson(versionFieldCatalogPath, 'INVALID_ADAPTER_CONTRACT');
const runtimePathRegistry = loadRuntimePathRegistry({
   registryPath: runtimePathRegistryPath,
   targetVersion: versionBundleSelection.selectedTargetVersion
});
const textboxRuntimePathSignalResolution = resolveRuntimePathSignal(runtimePathRegistry, RUNTIME_PATH_SIGNAL_TEXTBOX);
const textboxRuntimePathSignal = textboxRuntimePathSignalResolution.signal;
const runtimePathRegistryDiagnostics = Array.isArray(textboxRuntimePathSignalResolution.diagnostics)
   ? textboxRuntimePathSignalResolution.diagnostics
   : [];
const viewConfigDefaultVersion = resolveVersionNodeDefault(versionFieldCatalog, 'viewConfig', 'INVALID_ADAPTER_CONTRACT');
const filterControlConfigDefaultVersion = resolveVersionNodeDefault(versionFieldCatalog, 'filterControlConfig', 'INVALID_ADAPTER_CONTRACT');

const vizResolutionProfilesPath = resolveExistingPath(
   [
      getArg('--viz-resolution-profiles'),
      process.env.WORKBOOK_AUTHORING_VIZ_RESOLUTION_PROFILES,
      path.join(contractsDir, 'viz-resolution-profiles.v1.json'),
      path.join(appDir, 'build', 'generated', 'model', 'viz-resolution-profiles.v1.json')
   ],
   'UNRESOLVED_PLUGIN_PROFILE',
   'viz-resolution profiles'
);
const schemaRegistryProfilePath = resolveExistingPath(
   [
      getArg('--schema-registry-profile'),
      process.env.WORKBOOK_AUTHORING_SCHEMA_REGISTRY_PROFILE,
      path.join(contractsDir, 'validation', 'schema-registry-profile.json'),
      path.join(appDir, 'build', 'generated', 'model', 'validation', 'schema-registry-profile.json')
   ],
   'RUNTIME_VALIDATION_CHECK_STRICT_FAILED',
   'schema registry profile'
);
const schemaDirPath = resolveExistingPath(
   [
      getArg('--schema-dir'),
      process.env.WORKBOOK_AUTHORING_SCHEMA_DIR,
      path.join(versionBundleSelection.selectedBundleRootDir, 'schemas'),
   ],
   'RUNTIME_VALIDATION_CHECK_STRICT_FAILED',
   'schema directory'
);

const requestContract = regenerateContract.requestContract || {};
bootstrapAnalysisRequirementsPlanning(request);
const requiredTopLevelFields = Array.isArray(requestContract.requiredTopLevelFields)
   ? requestContract.requiredTopLevelFields
   : [];
for (const requiredField of requiredTopLevelFields) {
   if (!(requiredField in request)) {
      fail('INVALID_REQUEST_CONTRACT', `Missing required field '${requiredField}'.`);
   }
}

const executionModeDefault = requestContract.executionMode?.default || 'regenerate_workbook';
const executionModeAllowed = new Set(
   Array.isArray(requestContract.executionMode?.allowed)
      ? requestContract.executionMode.allowed
      : ['regenerate_workbook']
);
const executionMode = request.executionMode || executionModeDefault;
if (!executionModeAllowed.has(executionMode)) {
   fail('INVALID_REQUEST_CONTRACT', `executionMode '${executionMode}' is not allowed.`);
}

const allowedGenerationStrategies = new Set(
   Array.isArray(requestContract.generationStrategy?.allowed)
      ? requestContract.generationStrategy.allowed
      : ['auto', 'compose_ootb', 'passthrough_bound']
);
const generationStrategyRequested = request.generationStrategy || requestContract.generationStrategy?.default || 'auto';
if (!allowedGenerationStrategies.has(generationStrategyRequested)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `generationStrategy '${generationStrategyRequested}' is not allowed. Allowed: ${Array.from(allowedGenerationStrategies).join(', ')}.`
   );
}

ensureObject(request.analysisShape, 'analysisShape');
ensureArray(request.analysisShape.canvases, 'analysisShape.canvases');
if (request.analysisShape.canvases.length === 0) {
   fail('INVALID_REQUEST_CONTRACT', 'analysisShape.canvases must contain at least one canvas.');
}

let explicitFilterModeRequest = null;
if (request.analysisShape.filterMode !== undefined) {
   ensureString(request.analysisShape.filterMode, 'analysisShape.filterMode');
   explicitFilterModeRequest = normalizeFilterModeToken(request.analysisShape.filterMode);
}
if (request.analysisShape.filterModeRequested !== undefined) {
   ensureString(request.analysisShape.filterModeRequested, 'analysisShape.filterModeRequested');
   const aliasMode = normalizeFilterModeToken(request.analysisShape.filterModeRequested);
   if (!explicitFilterModeRequest) {
      explicitFilterModeRequest = aliasMode;
   } else if (aliasMode !== explicitFilterModeRequest) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `analysisShape.filterMode (${explicitFilterModeRequest}) conflicts with analysisShape.filterModeRequested (${aliasMode}).`
      );
   }
}
if (explicitFilterModeRequest && !['filter_bar', 'filter_viz'].includes(explicitFilterModeRequest)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `analysisShape.filterMode '${explicitFilterModeRequest}' is not supported. Allowed: filter_bar, filter_viz.`
   );
}
const requestedFilterMode = explicitFilterModeRequest || 'filter_bar';

const requestedViews = [];
for (const [canvasIndex, canvas] of request.analysisShape.canvases.entries()) {
   ensureObject(canvas, `analysisShape.canvases[${canvasIndex}]`);
   ensureString(canvas.id, `analysisShape.canvases[${canvasIndex}].id`);
   if (canvas.name !== undefined && typeof canvas.name !== 'string') {
      fail('INVALID_REQUEST_CONTRACT', `analysisShape.canvases[${canvasIndex}].name must be a string when provided.`);
   }
   if (canvas.title !== undefined && typeof canvas.title !== 'string') {
      fail('INVALID_REQUEST_CONTRACT', `analysisShape.canvases[${canvasIndex}].title must be a string when provided.`);
   }
   ensureArray(canvas.views, `analysisShape.canvases[${canvasIndex}].views`);
   if (canvas.views.length === 0) {
      fail('INVALID_REQUEST_CONTRACT', `analysisShape.canvases[${canvasIndex}].views must not be empty.`);
   }
   for (const [viewIndex, view] of canvas.views.entries()) {
      ensureObject(view, `analysisShape.canvases[${canvasIndex}].views[${viewIndex}]`);
      ensureString(view.id, `analysisShape.canvases[${canvasIndex}].views[${viewIndex}].id`);
      ensureString(view.pluginType, `analysisShape.canvases[${canvasIndex}].views[${viewIndex}].pluginType`);
      const requestOrder = requestedViews.length;
      requestedViews.push({
         ...view,
         canvasIndex,
         viewIndex,
         requestOrder
      });
   }
}
const analysisRequirements = request.analysisRequirements === undefined
   ? null
   : request.analysisRequirements;
if (analysisRequirements !== null && !isPlainObject(analysisRequirements)) {
   fail('INVALID_REQUEST_CONTRACT', 'analysisRequirements must be an object when provided.');
}

ensureObject(request.capabilities, 'capabilities');
const capabilities = request.capabilities;
ensureString(capabilities.discoveryMethod, 'capabilities.discoveryMethod');
if (!['search_catalog', 'discover_data'].includes(capabilities.discoveryMethod)) {
   fail('INVALID_REQUEST_CONTRACT', `Unsupported capabilities.discoveryMethod '${capabilities.discoveryMethod}'.`);
}
for (const boolField of ['saveAvailable', 'exportAvailable']) {
   if (typeof capabilities[boolField] !== 'boolean') {
      fail('INVALID_REQUEST_CONTRACT', `capabilities.${boolField} must be boolean.`);
   }
}
if (capabilities.exportRequested !== undefined && typeof capabilities.exportRequested !== 'boolean') {
   fail('INVALID_REQUEST_CONTRACT', 'capabilities.exportRequested must be boolean when provided.');
}
if (capabilities.traceRequested !== undefined && typeof capabilities.traceRequested !== 'boolean') {
   fail('INVALID_REQUEST_CONTRACT', 'capabilities.traceRequested must be boolean when provided.');
}
if (capabilities.oacMcpConnected !== undefined && typeof capabilities.oacMcpConnected !== 'boolean') {
   fail('INVALID_REQUEST_CONTRACT', 'capabilities.oacMcpConnected must be boolean when provided.');
}

if (request.requestedPluginType !== undefined && typeof request.requestedPluginType !== 'string') {
   fail('INVALID_REQUEST_CONTRACT', 'requestedPluginType must be a string when provided.');
}
if (request.workbook !== undefined) {
   ensureObject(request.workbook, 'workbook');
   if (request.workbook.name !== undefined && typeof request.workbook.name !== 'string') {
      fail('INVALID_REQUEST_CONTRACT', 'workbook.name must be a string when provided.');
   }
   if (request.workbook.description !== undefined && typeof request.workbook.description !== 'string') {
      fail('INVALID_REQUEST_CONTRACT', 'workbook.description must be a string when provided.');
   }
}

const numberFormattingContract = isPlainObject(requestContract.numberFormatting)
   ? requestContract.numberFormatting
   : {};
const allowedNumberFormattingPolicies = new Set(
   Array.isArray(numberFormattingContract.allowedPolicies)
      ? numberFormattingContract.allowedPolicies
      : ['none', 'auto_safe', 'explicit_only']
);
const allowedNumberFormattingScopes = new Set(
   Array.isArray(numberFormattingContract.allowedScopes)
      ? numberFormattingContract.allowedScopes
      : ['all_supported_measure_views', 'requested_views', 'view_ids']
);
const allowedNumberFormattingValidationModes = new Set(
   Array.isArray(numberFormattingContract.allowedValidationModes)
      ? numberFormattingContract.allowedValidationModes
      : ['report_only', 'error_on_unformatted']
);
let numberFormattingRequest = {};
if (request.numberFormatting !== undefined) {
   ensureObject(request.numberFormatting, 'numberFormatting');
   numberFormattingRequest = request.numberFormatting;
}
const numberFormattingPolicy = numberFormattingRequest.policy ||
   numberFormattingContract.defaultPolicy ||
   'auto_safe';
if (!allowedNumberFormattingPolicies.has(numberFormattingPolicy)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `numberFormatting.policy '${numberFormattingPolicy}' is not allowed. Allowed: ${Array.from(allowedNumberFormattingPolicies).join(', ')}.`
   );
}
const numberFormattingScope = numberFormattingRequest.scope ||
   numberFormattingContract.defaultScope ||
   'all_supported_measure_views';
if (!allowedNumberFormattingScopes.has(numberFormattingScope)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `numberFormatting.scope '${numberFormattingScope}' is not allowed. Allowed: ${Array.from(allowedNumberFormattingScopes).join(', ')}.`
   );
}
const numberFormattingValidationMode = numberFormattingRequest.validationMode ||
   numberFormattingContract.defaultValidationMode ||
   'report_only';
if (!allowedNumberFormattingValidationModes.has(numberFormattingValidationMode)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `numberFormatting.validationMode '${numberFormattingValidationMode}' is not allowed. Allowed: ${Array.from(allowedNumberFormattingValidationModes).join(', ')}.`
   );
}
const numberFormattingViewIDs = new Set();
if (numberFormattingScope === 'view_ids') {
   if (!Array.isArray(numberFormattingRequest.viewIDs) || numberFormattingRequest.viewIDs.length === 0) {
      fail('INVALID_REQUEST_CONTRACT', 'numberFormatting.viewIDs must be a non-empty array when numberFormatting.scope=view_ids.');
   }
   for (const [index, viewID] of numberFormattingRequest.viewIDs.entries()) {
      if (typeof viewID !== 'string' || viewID.trim() === '') {
         fail('INVALID_REQUEST_CONTRACT', `numberFormatting.viewIDs[${index}] must be a non-empty string.`);
      }
      numberFormattingViewIDs.add(viewID.trim());
   }
} else if (numberFormattingRequest.viewIDs !== undefined && !Array.isArray(numberFormattingRequest.viewIDs)) {
   fail('INVALID_REQUEST_CONTRACT', 'numberFormatting.viewIDs must be an array when provided.');
}
let numberFormattingExplicitDefault = null;
if (numberFormattingRequest.explicitDefault !== undefined) {
   numberFormattingExplicitDefault = normalizeNumberFormatSpec(numberFormattingRequest.explicitDefault, 'numberFormatting.explicitDefault');
}
const numberFormattingExplicitByColumnID = new Map();
if (numberFormattingRequest.explicitByColumnID !== undefined) {
   if (!isPlainObject(numberFormattingRequest.explicitByColumnID)) {
      fail('INVALID_REQUEST_CONTRACT', 'numberFormatting.explicitByColumnID must be an object when provided.');
   }
   for (const [columnID, rawSpec] of Object.entries(numberFormattingRequest.explicitByColumnID)) {
      const normalizedID = toNonEmptyTrimmedString(columnID);
      if (!normalizedID) {
         fail('INVALID_REQUEST_CONTRACT', 'numberFormatting.explicitByColumnID keys must be non-empty.');
      }
      numberFormattingExplicitByColumnID.set(
         normalizedID,
         normalizeNumberFormatSpec(rawSpec, `numberFormatting.explicitByColumnID.${columnID}`)
      );
   }
}
const numberFormattingExplicitByLabel = new Map();
if (numberFormattingRequest.explicitByLabel !== undefined) {
   if (!isPlainObject(numberFormattingRequest.explicitByLabel)) {
      fail('INVALID_REQUEST_CONTRACT', 'numberFormatting.explicitByLabel must be an object when provided.');
   }
   for (const [labelKey, rawSpec] of Object.entries(numberFormattingRequest.explicitByLabel)) {
      const normalizedLabel = toNonEmptyTrimmedString(labelKey);
      if (!normalizedLabel) {
         fail('INVALID_REQUEST_CONTRACT', 'numberFormatting.explicitByLabel keys must be non-empty.');
      }
      numberFormattingExplicitByLabel.set(
         normalizedLabel.toLowerCase(),
         normalizeNumberFormatSpec(rawSpec, `numberFormatting.explicitByLabel.${labelKey}`)
      );
   }
}
if (numberFormattingPolicy === 'explicit_only'
   && !numberFormattingExplicitDefault
   && numberFormattingExplicitByColumnID.size === 0
   && numberFormattingExplicitByLabel.size === 0) {
   fail('INVALID_REQUEST_CONTRACT', 'numberFormatting.policy=explicit_only requires explicitDefault, explicitByColumnID, or explicitByLabel.');
}

const composeFilterToleranceContract = isPlainObject(requestContract.composeFilterTolerance)
   ? requestContract.composeFilterTolerance
   : {};
const allowedComposeFilterToleranceModes = new Set(
   Array.isArray(composeFilterToleranceContract.allowedModes)
      ? composeFilterToleranceContract.allowedModes
      : ['strict', 'tolerant']
);
let composeFilterToleranceRequest = {};
if (request.composeFilterTolerance !== undefined) {
   ensureObject(request.composeFilterTolerance, 'composeFilterTolerance');
   composeFilterToleranceRequest = request.composeFilterTolerance;
}
const requestedComposeFilterToleranceMode = toNonEmptyTrimmedString(composeFilterToleranceRequest.mode)?.toLowerCase() || null;
if (requestedComposeFilterToleranceMode && !allowedComposeFilterToleranceModes.has(requestedComposeFilterToleranceMode)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `composeFilterTolerance.mode '${requestedComposeFilterToleranceMode}' is not allowed. Allowed: ${Array.from(allowedComposeFilterToleranceModes).join(', ')}.`
   );
}
const composeFilterToleranceMode = requestedComposeFilterToleranceMode
   || toNonEmptyTrimmedString(composeFilterToleranceContract.defaultMode)
   || 'strict';
if (!allowedComposeFilterToleranceModes.has(composeFilterToleranceMode)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `Derived composeFilterTolerance.mode '${composeFilterToleranceMode}' is not allowed. Allowed: ${Array.from(allowedComposeFilterToleranceModes).join(', ')}.`
   );
}

const presentationPolishRequestContract = isPlainObject(requestContract.presentationPolish)
   ? requestContract.presentationPolish
   : {};
const presentationPolishContractDefaults = isPlainObject(presentationPolishContracts.defaults)
   ? presentationPolishContracts.defaults
   : {};
const allowedPresentationPolishModes = new Set(
   Array.isArray(presentationPolishRequestContract.allowedModes)
      ? presentationPolishRequestContract.allowedModes
      : (Array.isArray(presentationPolishContracts.modes)
         ? presentationPolishContracts.modes
         : ['auto', 'off', 'strict'])
);
let presentationPolishRequest = {};
if (request.presentationPolish !== undefined) {
   ensureObject(request.presentationPolish, 'presentationPolish');
   presentationPolishRequest = request.presentationPolish;
}
const requestedPresentationPolishMode = toNonEmptyTrimmedString(presentationPolishRequest.mode);
if (requestedPresentationPolishMode && !allowedPresentationPolishModes.has(requestedPresentationPolishMode)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `presentationPolish.mode '${requestedPresentationPolishMode}' is not allowed. Allowed: ${Array.from(allowedPresentationPolishModes).join(', ')}.`
   );
}
const presentationPolishLayoutHints = isPlainObject(presentationPolishRequest.layoutTemplateHints)
   ? presentationPolishRequest.layoutTemplateHints
   : {};
if (presentationPolishRequest.layoutTemplateHints !== undefined && !isPlainObject(presentationPolishRequest.layoutTemplateHints)) {
   fail('INVALID_REQUEST_CONTRACT', 'presentationPolish.layoutTemplateHints must be an object when provided.');
}
if (presentationPolishLayoutHints.byCanvasID !== undefined && !isPlainObject(presentationPolishLayoutHints.byCanvasID)) {
   fail('INVALID_REQUEST_CONTRACT', 'presentationPolish.layoutTemplateHints.byCanvasID must be an object when provided.');
}
if (presentationPolishLayoutHints.byCanvasIndex !== undefined && !isPlainObject(presentationPolishLayoutHints.byCanvasIndex)) {
   fail('INVALID_REQUEST_CONTRACT', 'presentationPolish.layoutTemplateHints.byCanvasIndex must be an object when provided.');
}
if (presentationPolishLayoutHints.registeredTemplateByCanvasID !== undefined && !isPlainObject(presentationPolishLayoutHints.registeredTemplateByCanvasID)) {
   fail('INVALID_REQUEST_CONTRACT', 'presentationPolish.layoutTemplateHints.registeredTemplateByCanvasID must be an object when provided.');
}
if (presentationPolishLayoutHints.registeredTemplateByCanvasIndex !== undefined && !isPlainObject(presentationPolishLayoutHints.registeredTemplateByCanvasIndex)) {
   fail('INVALID_REQUEST_CONTRACT', 'presentationPolish.layoutTemplateHints.registeredTemplateByCanvasIndex must be an object when provided.');
}
const allowedTitlePolicies = new Set(
   Array.isArray(presentationPolishRequestContract?.titlePolicy?.allowed)
      ? presentationPolishRequestContract.titlePolicy.allowed
      : (Array.isArray(presentationPolishContracts.titlePolicies)
         ? presentationPolishContracts.titlePolicies
         : ['question_oriented', 'preserve_input'])
);
const requestedPresentationPolishTitlePolicy = toNonEmptyTrimmedString(presentationPolishRequest.titlePolicy);
if (requestedPresentationPolishTitlePolicy && !allowedTitlePolicies.has(requestedPresentationPolishTitlePolicy)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `presentationPolish.titlePolicy '${requestedPresentationPolishTitlePolicy}' is not allowed. Allowed: ${Array.from(allowedTitlePolicies).join(', ')}.`
   );
}
const defaultPresentationPolishTitlePolicy = toNonEmptyTrimmedString(presentationPolishContractDefaults.titlePolicy) || 'question_oriented';

const visualizationIntelligenceRequestContract = isPlainObject(requestContract.visualizationIntelligence)
   ? requestContract.visualizationIntelligence
   : {};
const visualizationIntelligenceContractDefaults = isPlainObject(dvIntelligenceContracts.defaults)
   ? dvIntelligenceContracts.defaults
   : {};
const allowedVisualizationIntelligenceModes = new Set(
   Array.isArray(visualizationIntelligenceRequestContract.allowedModes)
      ? visualizationIntelligenceRequestContract.allowedModes
      : (Array.isArray(dvIntelligenceContracts.modes) ? dvIntelligenceContracts.modes : ['auto', 'off'])
);
let visualizationIntelligenceRequest = {};
if (request.visualizationIntelligence !== undefined) {
   ensureObject(request.visualizationIntelligence, 'visualizationIntelligence');
   visualizationIntelligenceRequest = request.visualizationIntelligence;
}
const requestedVisualizationIntelligenceMode = toNonEmptyTrimmedString(visualizationIntelligenceRequest.mode);
if (requestedVisualizationIntelligenceMode && !allowedVisualizationIntelligenceModes.has(requestedVisualizationIntelligenceMode)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `visualizationIntelligence.mode '${requestedVisualizationIntelligenceMode}' is not allowed. Allowed: ${Array.from(allowedVisualizationIntelligenceModes).join(', ')}.`
   );
}
const defaultVisualizationIntelligenceMode = toNonEmptyTrimmedString(
   visualizationIntelligenceRequestContract.defaultMode
   || visualizationIntelligenceContractDefaults.mode
) || 'auto';
const visualizationIntelligenceMode = requestedVisualizationIntelligenceMode || defaultVisualizationIntelligenceMode;
if (!allowedVisualizationIntelligenceModes.has(visualizationIntelligenceMode)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `Derived visualizationIntelligence.mode '${visualizationIntelligenceMode}' is not allowed. Allowed: ${Array.from(allowedVisualizationIntelligenceModes).join(', ')}.`
   );
}
let visualizationIntelligenceAudienceProfile = null;
if (visualizationIntelligenceRequest.audienceProfile !== undefined) {
   if (isPlainObject(visualizationIntelligenceRequest.audienceProfile)) {
      const role = toNonEmptyTrimmedString(visualizationIntelligenceRequest.audienceProfile.role);
      const targetLevel = toNonEmptyTrimmedString(visualizationIntelligenceRequest.audienceProfile.targetLevel);
      visualizationIntelligenceAudienceProfile = {};
      if (role) {
         visualizationIntelligenceAudienceProfile.role = role;
      }
      if (targetLevel) {
         visualizationIntelligenceAudienceProfile.targetLevel = targetLevel;
      }
      if (Object.keys(visualizationIntelligenceAudienceProfile).length === 0) {
         visualizationIntelligenceAudienceProfile = null;
      }
   } else {
      fail('INVALID_REQUEST_CONTRACT', 'visualizationIntelligence.audienceProfile must be an object when provided.');
   }
}

const allowedVersionReasons = new Set(Array.isArray(requestContract.versionSelectionReasonAllowed)
   ? requestContract.versionSelectionReasonAllowed
   : [
      'default_policy',
      'user_requested_newer',
      'required_newer_behavior',
      'capability_heuristic_2607',
      'capability_heuristic_2607_missing_fallback_latest',
      'capability_heuristic_2605',
      'capability_heuristic_2605_missing_fallback_latest',
      'validation_fallback',
      'session_sticky'
   ]);
if (request.versionSelectionReason !== undefined) {
   ensureString(request.versionSelectionReason, 'versionSelectionReason');
   if (!allowedVersionReasons.has(request.versionSelectionReason)) {
      fail(
         'INVALID_REQUEST_CONTRACT',
         `versionSelectionReason must be one of ${Array.from(allowedVersionReasons).join(', ')}.`
      );
   }
}

ensureObject(request.adapterPayload, 'adapterPayload');
const adapterPayload = request.adapterPayload;
const requiredAdapterSections = Array.isArray(adapterContract.requiredSections)
   ? adapterContract.requiredSections
   : ['discovery', 'describe', 'profiling'];
for (const sectionName of requiredAdapterSections) {
   if (!(sectionName in adapterPayload)) {
      fail('INVALID_ADAPTER_CONTRACT', `adapterPayload.${sectionName} is required.`);
   }
   ensureObject(adapterPayload[sectionName], `adapterPayload.${sectionName}`);
}

const adapterDiscovery = adapterPayload.discovery;
ensureString(adapterDiscovery.method, 'adapterPayload.discovery.method');
if (!['search_catalog', 'discover_data'].includes(adapterDiscovery.method)) {
   fail('INVALID_ADAPTER_CONTRACT', `adapterPayload.discovery.method '${adapterDiscovery.method}' is not supported.`);
}
if (adapterDiscovery.method !== capabilities.discoveryMethod) {
   fail(
      'INVALID_ADAPTER_CONTRACT',
      `adapterPayload.discovery.method (${adapterDiscovery.method}) must match capabilities.discoveryMethod (${capabilities.discoveryMethod}).`
   );
}
ensureString(adapterDiscovery.selectedDataModel, 'adapterPayload.discovery.selectedDataModel');
const selectedDataModel = canonicalizeSubjectAreaToken(adapterDiscovery.selectedDataModel);
validateSelectedDataModelAgainstDiscovery(selectedDataModel, adapterDiscovery);

const adapterDescribe = adapterPayload.describe;
ensureArray(adapterDescribe.tables, 'adapterPayload.describe.tables');
ensureArray(adapterDescribe.columns, 'adapterPayload.describe.columns');
validateDescribeColumnsSelectedDataModelConsistency(adapterDescribe.columns, selectedDataModel);
const requirementsResolutionEvidence = adapterPayload.requirementsResolutionEvidence;
if (requirementsResolutionEvidence !== undefined) {
   ensureObject(requirementsResolutionEvidence, 'adapterPayload.requirementsResolutionEvidence');
   ensureArray(requirementsResolutionEvidence.resolvedExpressions, 'adapterPayload.requirementsResolutionEvidence.resolvedExpressions');
   ensureArray(requirementsResolutionEvidence.profileGrounding, 'adapterPayload.requirementsResolutionEvidence.profileGrounding');
   ensureArray(requirementsResolutionEvidence.rejectedAlternatives, 'adapterPayload.requirementsResolutionEvidence.rejectedAlternatives');
}

if (adapterPayload.semanticRoleMap !== undefined && !isPlainObject(adapterPayload.semanticRoleMap)) {
   fail('INVALID_ADAPTER_CONTRACT', 'adapterPayload.semanticRoleMap must be an object when provided.');
}

const adapterProfiling = adapterPayload.profiling;
ensureObject(adapterProfiling.filterDecisionTrace, 'adapterPayload.profiling.filterDecisionTrace');
const requiredFilterTraceFields = Array.isArray(filterProfilingContract?.traceContract?.requiredOutputFields)
   ? filterProfilingContract.traceContract.requiredOutputFields
   : [];
for (const fieldName of requiredFilterTraceFields) {
   if (!(fieldName in adapterProfiling.filterDecisionTrace)) {
      fail(
         'INVALID_ADAPTER_CONTRACT',
         `adapterPayload.profiling.filterDecisionTrace missing required field '${fieldName}'.`
      );
   }
}
const selectedFilterModeFromTrace = normalizeFilterModeToken(adapterProfiling.filterDecisionTrace.selectedFilterMode);
if (!selectedFilterModeFromTrace || !['filter_bar', 'filter_viz', 'mixed', 'none'].includes(selectedFilterModeFromTrace)) {
   fail(
      'INVALID_ADAPTER_CONTRACT',
      `adapterPayload.profiling.filterDecisionTrace.selectedFilterMode '${adapterProfiling.filterDecisionTrace.selectedFilterMode}' is unsupported. Allowed: filter_bar, filter_viz, mixed, none.`
   );
}
const traceUsesFilterViz = selectedFilterModeFromTrace === 'filter_viz' || selectedFilterModeFromTrace === 'mixed';
if (traceUsesFilterViz && requestedFilterMode !== 'filter_viz') {
   fail(
      'INVALID_ADAPTER_CONTRACT',
      `adapterPayload.profiling.filterDecisionTrace.selectedFilterMode '${selectedFilterModeFromTrace}' requires explicit request analysisShape.filterMode='filter_viz'.`
   );
}

const hasBoundWorkbookJson = adapterPayload.binding?.boundWorkbookJson && typeof adapterPayload.binding.boundWorkbookJson === 'object';
const hasBoundWorkbookPath = typeof adapterPayload.binding?.boundWorkbookPath === 'string' && adapterPayload.binding.boundWorkbookPath.trim() !== '';
const hasBoundWorkbookInput = Boolean(hasBoundWorkbookJson || hasBoundWorkbookPath);
const generationStrategyApplied = generationStrategyRequested === 'auto'
   ? (hasBoundWorkbookInput ? 'passthrough_bound' : 'compose_ootb')
   : generationStrategyRequested;
const compositionCoverage = generationStrategyApplied === 'passthrough_bound'
   ? 'agent_bound_passthrough'
   : 'ootb_composed';
let analysisRequirementsPlanningNormalization = {
   applied: false,
   fieldAliasCount: 0,
   compactViewCount: 0,
   expandedFilterCount: 0,
   actionCount: 0
};
let analysisRequirementsFieldContext = null;
if (generationStrategyApplied === 'compose_ootb') {
   const normalizationResult = normalizeAnalysisRequirementsShorthand(
      request,
      selectedDataModel,
      adapterDescribe.columns
   );
   analysisRequirementsFieldContext = normalizationResult.fieldContext || null;
   analysisRequirementsPlanningNormalization = {
      applied: normalizationResult.applied === true,
      fieldAliasCount: Number.isInteger(normalizationResult.fieldAliasCount) ? normalizationResult.fieldAliasCount : 0,
      compactViewCount: Number.isInteger(normalizationResult.compactViewCount) ? normalizationResult.compactViewCount : 0,
      expandedFilterCount: Number.isInteger(normalizationResult.expandedFilterCount) ? normalizationResult.expandedFilterCount : 0,
      actionCount: Number.isInteger(normalizationResult.actionCount) ? normalizationResult.actionCount : 0
   };
}

const calcSupportedTypes = new Set(
   Array.isArray(calculationContracts?.supportedCalculationTypes)
      ? calculationContracts.supportedCalculationTypes
      : []
);
if (Array.isArray(adapterPayload.calculations?.proposed)) {
   adapterPayload.calculations.proposed.forEach((calc, index) => {
      if (!calc || typeof calc !== 'object') {
         fail('INVALID_ADAPTER_CONTRACT', `adapterPayload.calculations.proposed[${index}] must be an object.`);
      }
      if (typeof calc.type === 'string' && calc.type.trim() !== '' && !calcSupportedTypes.has(calc.type)) {
         fail(
            'INVALID_ADAPTER_CONTRACT',
            `adapterPayload.calculations.proposed[${index}].type '${calc.type}' is not supported by calculation-contracts.`
         );
      }
   });
}

const tracks = supportWindow?.tracks;
if (!tracks || typeof tracks !== 'object') {
   fail('UNRESOLVED_TARGET_VERSION', 'support-window.v1.json is missing tracks.');
}
const trackEntries = Object.entries(tracks)
   .filter(([, payload]) => payload && typeof payload === 'object')
   .map(([trackName, payload]) => ({
      trackName,
      displayVersion: payload.displayVersion,
      projectVersion: payload.projectVersion
   }))
   .filter((entry) => typeof entry.displayVersion === 'string' && Number.isInteger(entry.projectVersion));
if (trackEntries.length === 0) {
   fail('UNRESOLVED_TARGET_VERSION', 'support-window.v1.json does not define any valid track entries.');
}

const defaultTrackName = supportWindow.defaultTrack;
const defaultTrack = trackEntries.find((entry) => entry.trackName === defaultTrackName) || trackEntries[0];
const highestTrack = [...trackEntries].sort((left, right) => {
   if (left.displayVersion === right.displayVersion) {
      return left.projectVersion - right.projectVersion;
   }
   return left.displayVersion.localeCompare(right.displayVersion);
})[trackEntries.length - 1];

let selectedTrack = defaultTrack;
if (!versionBundleSelection.legacyLayout) {
   const selectedBundleTrack = trackEntries.find(
      (entry) => entry.displayVersion === versionBundleSelection.selectedTargetVersion
   );
   if (!selectedBundleTrack) {
      fail(
         'UNRESOLVED_TARGET_VERSION',
         `Installed targetVersion '${versionBundleSelection.selectedTargetVersion}' is missing from support-window. Supported by bundle: ${trackEntries.map((entry) => entry.displayVersion).join(', ')}`
      );
   }
   selectedTrack = selectedBundleTrack;
} else if (requestedTargetVersion != null) {
   const explicit = trackEntries.find((entry) => entry.displayVersion === requestedTargetVersion);
   if (!explicit) {
      fail(
         'UNRESOLVED_TARGET_VERSION',
         `targetVersion '${requestedTargetVersion}' is not in support-window. Supported: ${trackEntries.map((entry) => entry.displayVersion).join(', ')}`
      );
   }
   selectedTrack = explicit;
} else if (request.analysisShape.requiresNewerBehavior === true) {
   selectedTrack = highestTrack;
}

let reasonForVersionSelection = request.versionSelectionReason || null;
if (!reasonForVersionSelection) {
   if (versionBundleSelection.explicitTargetRequested || requestedTargetVersion != null) {
      reasonForVersionSelection = selectedTrack.displayVersion === defaultTrack.displayVersion
         ? 'default_policy'
         : 'user_requested_newer';
   } else if (!versionBundleSelection.legacyLayout && typeof versionBundleSelection.implicitSelectionReason === 'string') {
      reasonForVersionSelection = versionBundleSelection.implicitSelectionReason;
   } else if (!versionBundleSelection.legacyLayout) {
      reasonForVersionSelection = 'default_policy';
   } else if (request.analysisShape.requiresNewerBehavior === true) {
      reasonForVersionSelection = 'required_newer_behavior';
   } else {
      reasonForVersionSelection = 'default_policy';
   }
}
if (!allowedVersionReasons.has(reasonForVersionSelection)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `Derived reasonForVersionSelection '${reasonForVersionSelection}' is not allowed by contract.`
   );
}

const vizResolutionProfiles = readJson(vizResolutionProfilesPath, 'UNRESOLVED_PLUGIN_PROFILE');
const profileByPluginType = new Map(
   (Array.isArray(vizResolutionProfiles.profiles) ? vizResolutionProfiles.profiles : [])
      .filter((entry) => entry && typeof entry.pluginType === 'string')
      .map((entry) => [entry.pluginType, entry])
);
const aliasByPluginType = new Map(
   (Array.isArray(pluginTypeAliases.aliases) ? pluginTypeAliases.aliases : [])
      .filter((entry) => entry && typeof entry.pluginType === 'string')
      .map((entry) => [entry.pluginType, entry])
);

const defaultFormatterPathByFamily = {
   chart_autoviz: 'viz:chart',
   chart_combo_multilayer: 'viz:chart',
   table: 'viz:chart',
   pivot: 'viz:chart',
   performance_tile: 'viz:chart',
   map: 'viz:chart',
   network_graph: 'viz:networkchart'
};
const formatterPathByFamily = {};
const contractFormatterMapping = isPlainObject(numberFormattingContract.pluginFormatterMapping)
   ? numberFormattingContract.pluginFormatterMapping
   : {};
const contractFormatterByFamily = isPlainObject(contractFormatterMapping.byRuntimeFamily)
   ? contractFormatterMapping.byRuntimeFamily
   : {};
for (const [family, defaultPath] of Object.entries(defaultFormatterPathByFamily)) {
   const contractEntry = contractFormatterByFamily[family];
   const contractPath = typeof contractEntry === 'string'
      ? contractEntry
      : (isPlainObject(contractEntry) ? contractEntry.formatterPath : null);
   formatterPathByFamily[family] = typeof contractPath === 'string' && contractPath.trim() !== ''
      ? contractPath.trim()
      : defaultPath;
}

function resolveRuntimeFamilyForPluginType(pluginType) {
   const profile = profileByPluginType.get(pluginType);
   if (profile && typeof profile.runtimeContractFamily === 'string' && profile.runtimeContractFamily.trim() !== '') {
      return profile.runtimeContractFamily.trim();
   }
   const aliasEntry = aliasByPluginType.get(pluginType);
   if (aliasEntry && typeof aliasEntry.runtimeContractFamily === 'string' && aliasEntry.runtimeContractFamily.trim() !== '') {
      return aliasEntry.runtimeContractFamily.trim();
   }
   return null;
}

const templateEntries = Array.isArray(templateIndex.templates) ? templateIndex.templates : [];
const templateById = new Map(
   templateEntries
      .filter((entry) => entry && typeof entry.id === 'string' && typeof entry.file === 'string')
      .map((entry) => [entry.id, entry])
);
const templateEntriesByRuntimeFamily = new Map();
for (const entry of templateEntries) {
   if (!entry || typeof entry.id !== 'string' || typeof entry.runtimeContractFamily !== 'string') {
      continue;
   }
   if (!templateEntriesByRuntimeFamily.has(entry.runtimeContractFamily)) {
      templateEntriesByRuntimeFamily.set(entry.runtimeContractFamily, []);
   }
   templateEntriesByRuntimeFamily.get(entry.runtimeContractFamily).push(entry);
}
const describeDescriptorsForPlanning = adapterDescribe.columns
   .map((column) => normalizeDescribeColumnDescriptor(column, selectedDataModel))
   .filter(Boolean);
const hasPlanningDescriptors = describeDescriptorsForPlanning.length > 0;
const availableClassCountsForPlanning = {
   dimension: describeDescriptorsForPlanning.filter((descriptor) => descriptor.columnClass === 'dimension').length,
   measure: describeDescriptorsForPlanning.filter((descriptor) => descriptor.columnClass === 'measure').length,
   temporal: describeDescriptorsForPlanning.filter((descriptor) => descriptor.columnClass === 'temporal').length
};
function metadataRequirementToClass(requirement) {
   const normalized = toNonEmptyTrimmedString(requirement);
   if (!normalized) {
      return null;
   }
   if (normalized.startsWith('dimension.')) {
      return 'dimension';
   }
   if (normalized.startsWith('measure.')) {
      return 'measure';
   }
   if (normalized.startsWith('temporal.')) {
      return 'temporal';
   }
   return null;
}

function evaluateTemplateCompatibility(templateEntry, availableCounts) {
   const requiredMetadata = Array.isArray(templateEntry?.requiredMetadata) ? templateEntry.requiredMetadata : [];
   const missingMetadata = [];
   for (const requirement of requiredMetadata) {
      const requiredClass = metadataRequirementToClass(requirement);
      if (!requiredClass) {
         continue;
      }
      if (!availableCounts[requiredClass] || availableCounts[requiredClass] <= 0) {
         missingMetadata.push(requirement);
      }
   }
   return {
      compatible: missingMetadata.length === 0,
      missingMetadata,
      requiredMetadata
   };
}

const defaultComposePresentationPolishMode = toNonEmptyTrimmedString(
   presentationPolishRequestContract.defaultComposeMode || presentationPolishContractDefaults.modeByGenerationStrategy?.compose_ootb
) || 'auto';
const defaultNonComposePresentationPolishMode = toNonEmptyTrimmedString(
   presentationPolishRequestContract.defaultNonComposeMode || presentationPolishContractDefaults.modeByGenerationStrategy?.passthrough_bound
) || 'auto';
const presentationPolishMode = requestedPresentationPolishMode
   || (generationStrategyApplied === 'compose_ootb'
      ? defaultComposePresentationPolishMode
      : defaultNonComposePresentationPolishMode);
if (!allowedPresentationPolishModes.has(presentationPolishMode)) {
   fail(
      'INVALID_REQUEST_CONTRACT',
      `Derived presentationPolish.mode '${presentationPolishMode}' is not allowed. Allowed: ${Array.from(allowedPresentationPolishModes).join(', ')}.`
   );
}
const presentationPolishTitlePolicy = requestedPresentationPolishTitlePolicy || defaultPresentationPolishTitlePolicy;
if (generationStrategyApplied === 'passthrough_bound' && !hasBoundWorkbookInput) {
   fail(
      'INVALID_ADAPTER_CONTRACT',
      'generationStrategy passthrough_bound requires adapterPayload.binding.boundWorkbookJson or adapterPayload.binding.boundWorkbookPath.'
   );
}
const composeFilterToleranceSummarySeed = {
   mode: composeFilterToleranceMode,
   enabled: composeFilterToleranceMode === 'tolerant',
   autoFilledFilterFields: [],
   noAutoFillReasons: []
};
const composeFilterDefaultResolver = createComposeFilterDefaultResolver(adapterProfiling.filterDecisionTrace);
const skipRequirementsGate = process.env.WORKBOOK_AUTHORING_SKIP_REQUIREMENTS_GATE === 'true';
if (generationStrategyApplied === 'compose_ootb' && !skipRequirementsGate) {
   validateComposeAnalysisRequirements(
      analysisRequirements,
      request.analysisShape,
      selectedDataModel,
      {
         composeFilterToleranceMode,
         composeFilterToleranceState: composeFilterToleranceSummarySeed,
         composeFilterDefaultResolver
      }
   );
}

function resolveRequestedProfiles(strictMode) {
   const unresolvedReasons = [];
   const resolved = requestedViews.map((view) => {
      const profile = profileByPluginType.get(view.pluginType);
      if (!profile) {
         const reason = `No viz-resolution profile found for pluginType '${view.pluginType}' (canvas ${view.canvasIndex}, view ${view.viewIndex}).`;
         unresolvedReasons.push(reason);
         if (strictMode) {
            fail('UNRESOLVED_PLUGIN_PROFILE', reason);
         }
         return {
            requestedPluginType: view.pluginType,
            runtimeContractFamily: null,
            scaffoldTemplateId: null,
            bindingSlots: {},
            finalPluginType: view.pluginType,
            templateFile: null,
            unresolved: true
         };
      }
      const templateID = profile.canonicalScaffoldTemplateId;
      const canonicalTemplateEntry = templateById.get(templateID);
      if (!canonicalTemplateEntry) {
         const reason = `No template-index entry found for scaffold template '${templateID}' (pluginType '${view.pluginType}').`;
         unresolvedReasons.push(reason);
         if (strictMode) {
            fail('UNRESOLVED_PLUGIN_PROFILE', reason);
         }
         return {
            requestedPluginType: view.pluginType,
            runtimeContractFamily: profile.runtimeContractFamily || null,
            scaffoldTemplateId: templateID,
            bindingSlots: {},
            finalPluginType: profile.finalPluginType || view.pluginType,
            templateFile: null,
            unresolved: true
         };
      }
      const runtimeFamily = profile.runtimeContractFamily || null;
      const familyCandidates = runtimeFamily && templateEntriesByRuntimeFamily.has(runtimeFamily)
         ? templateEntriesByRuntimeFamily.get(runtimeFamily)
         : [canonicalTemplateEntry];
      const canonicalCompatibility = evaluateTemplateCompatibility(canonicalTemplateEntry, availableClassCountsForPlanning);
      let selectedTemplateEntry = canonicalTemplateEntry;
      let fallbackUsed = false;
      let fallbackReason = null;
      if (hasPlanningDescriptors && !canonicalCompatibility.compatible) {
         const compatibleCandidates = familyCandidates
            .map((candidate) => ({
               candidate,
               compatibility: evaluateTemplateCompatibility(candidate, availableClassCountsForPlanning)
            }))
            .filter((entry) => entry.compatibility.compatible);
         if (compatibleCandidates.length > 0) {
            const canonicalRequirements = Array.isArray(canonicalTemplateEntry.requiredMetadata)
               ? canonicalTemplateEntry.requiredMetadata
               : [];
            compatibleCandidates.sort((left, right) => {
               const leftRequirements = Array.isArray(left.candidate.requiredMetadata) ? left.candidate.requiredMetadata : [];
               const rightRequirements = Array.isArray(right.candidate.requiredMetadata) ? right.candidate.requiredMetadata : [];
               const overlapScore = (requirements) => requirements.filter((value) => canonicalRequirements.includes(value)).length;
               const leftScore =
                  (left.candidate.id === templateID ? 100 : 0) +
                  (left.candidate.pluginType === (profile.finalPluginType || view.pluginType) ? 50 : 0) +
                  overlapScore(leftRequirements) * 10 +
                  leftRequirements.length;
               const rightScore =
                  (right.candidate.id === templateID ? 100 : 0) +
                  (right.candidate.pluginType === (profile.finalPluginType || view.pluginType) ? 50 : 0) +
                  overlapScore(rightRequirements) * 10 +
                  rightRequirements.length;
               if (rightScore !== leftScore) {
                  return rightScore - leftScore;
               }
               return left.candidate.id.localeCompare(right.candidate.id);
            });
            selectedTemplateEntry = compatibleCandidates[0].candidate;
            fallbackUsed = selectedTemplateEntry.id !== templateID;
            fallbackReason = fallbackUsed
               ? `canonical template '${templateID}' missing metadata [${canonicalCompatibility.missingMetadata.join(', ')}]; switched to '${selectedTemplateEntry.id}'.`
               : null;
         } else {
            const reason = `No compatible scaffold template found for pluginType '${view.pluginType}' (runtime family '${runtimeFamily}') with available metadata classes ` +
               `(dimension=${availableClassCountsForPlanning.dimension}, measure=${availableClassCountsForPlanning.measure}, temporal=${availableClassCountsForPlanning.temporal}). ` +
               `Canonical template '${templateID}' missing [${canonicalCompatibility.missingMetadata.join(', ')}].`;
            unresolvedReasons.push(reason);
            if (strictMode) {
               fail('UNRESOLVED_PLUGIN_PROFILE', reason);
            }
            return {
               requestedPluginType: view.pluginType,
               runtimeContractFamily: runtimeFamily,
               scaffoldTemplateId: templateID,
               bindingSlots: {},
               finalPluginType: profile.finalPluginType || view.pluginType,
               templateFile: null,
               fallbackUsed: false,
               fallbackReason: null,
               unresolved: true
            };
         }
      }
      return {
         requestedPluginType: view.pluginType,
         runtimeContractFamily: runtimeFamily,
         scaffoldTemplateId: selectedTemplateEntry.id,
         bindingSlots: isPlainObject(selectedTemplateEntry.bindingSlots)
            ? deepClone(selectedTemplateEntry.bindingSlots)
            : {},
         finalPluginType: profile.finalPluginType || view.pluginType,
         templateFile: selectedTemplateEntry.file,
         fallbackUsed,
         fallbackReason,
         unresolved: false
      };
   });
   return {
      resolvedProfiles: resolved,
      unresolvedReasons
   };
}

const strictProfileResolution = generationStrategyApplied === 'compose_ootb';
const profileResolution = resolveRequestedProfiles(strictProfileResolution);
const resolvedProfiles = profileResolution.resolvedProfiles;
const unsupportedTopologyReasons = [...profileResolution.unresolvedReasons];

const scaffoldCache = new Map();
function findPluginViewForScaffold(scaffoldWorkbook, preferredPluginType) {
   const pluginViews = Array.isArray(scaffoldWorkbook?.views?.children)
      ? scaffoldWorkbook.views.children.filter((view) => view && typeof view === 'object' && view.type === 'saw:pluginView')
      : [];
   if (pluginViews.length === 0) {
      return null;
   }
   const preferred = toNonEmptyTrimmedString(preferredPluginType);
   if (preferred) {
      const exactMatch = pluginViews.find((view) => toNonEmptyTrimmedString(view.pluginType) === preferred);
      if (exactMatch) {
         return exactMatch;
      }
   }
   return pluginViews[0];
}

function loadScaffoldBundleForView(resolvedProfile, viewMeta) {
   const bundleKey = resolvedProfile?.scaffoldTemplateId || `${viewMeta.pluginType}::fallback`;
   if (scaffoldCache.has(bundleKey)) {
      return scaffoldCache.get(bundleKey);
   }
   const reasonPrefix = `Scaffold extraction failed for pluginType '${viewMeta.pluginType}' (canvas ${viewMeta.canvasIndex}, view ${viewMeta.viewIndex}): `;
   if (!resolvedProfile || resolvedProfile.unresolved || typeof resolvedProfile.templateFile !== 'string') {
      const missing = {
         pluginView: null,
         canvasView: null,
         layout: null,
         criteriaColumns: []
      };
      scaffoldCache.set(bundleKey, missing);
      return missing;
   }
   const scaffoldPath = path.join(templatesDir, resolvedProfile.templateFile);
   if (!fs.existsSync(scaffoldPath)) {
      fail('UNRESOLVED_PLUGIN_PROFILE', `Scaffold template file not found: ${scaffoldPath}`);
   }
   const scaffoldWorkbook = readJson(scaffoldPath, 'UNRESOLVED_PLUGIN_PROFILE');
   const pluginView = findPluginViewForScaffold(scaffoldWorkbook, resolvedProfile?.finalPluginType || viewMeta?.pluginType);
   const canvasView = findFirstViewByType(scaffoldWorkbook, 'saw:canvas');
   const layout = Array.isArray(scaffoldWorkbook?.layouts?.children) ? scaffoldWorkbook.layouts.children[0] : null;
   if (!pluginView) {
      unsupportedTopologyReasons.push(`${reasonPrefix}template '${resolvedProfile.scaffoldTemplateId}' does not contain a saw:pluginView.`);
   }
   if (!canvasView) {
      unsupportedTopologyReasons.push(`${reasonPrefix}template '${resolvedProfile.scaffoldTemplateId}' does not contain a saw:canvas view.`);
   }
   if (!layout || typeof layout !== 'object') {
      unsupportedTopologyReasons.push(`${reasonPrefix}template '${resolvedProfile.scaffoldTemplateId}' does not contain a usable layout.`);
   }
   const bundle = {
      workbook: scaffoldWorkbook,
      pluginView,
      canvasView,
      layout,
      criteriaColumns: collectCriteriaColumns(scaffoldWorkbook)
   };
   scaffoldCache.set(bundleKey, bundle);
   return bundle;
}

let workbookJson = null;
const generatedViewMappings = [];
const generatedCanvasViewNameByID = new Map();
if (generationStrategyApplied === 'passthrough_bound') {
   if (hasBoundWorkbookJson) {
      workbookJson = deepClone(adapterPayload.binding.boundWorkbookJson);
   } else {
      const boundPath = path.resolve(adapterPayload.binding.boundWorkbookPath);
      if (!fs.existsSync(boundPath)) {
         fail('INVALID_ADAPTER_CONTRACT', `adapterPayload.binding.boundWorkbookPath does not exist: ${boundPath}`);
      }
      workbookJson = readJson(boundPath, 'INVALID_ADAPTER_CONTRACT');
   }
} else {
   const maxCanvasCount = 8;
   const maxViewsPerCanvas = 16;
   if (request.analysisShape.canvases.length > maxCanvasCount) {
      unsupportedTopologyReasons.push(
         `compose_ootb supports at most ${maxCanvasCount} canvases (requested ${request.analysisShape.canvases.length}).`
      );
   }
   for (const [canvasIndex, canvas] of request.analysisShape.canvases.entries()) {
      if (Array.isArray(canvas.views) && canvas.views.length > maxViewsPerCanvas) {
         unsupportedTopologyReasons.push(
            `compose_ootb supports at most ${maxViewsPerCanvas} views per canvas (canvas index ${canvasIndex} requested ${canvas.views.length}).`
         );
      }
   }

   if (requestedViews.length === 0) {
      unsupportedTopologyReasons.push('compose_ootb requires at least one requested view.');
   }

   const firstBundle = requestedViews.length > 0
      ? loadScaffoldBundleForView(resolvedProfiles[0], requestedViews[0])
      : null;
   if (!firstBundle || !firstBundle.workbook || typeof firstBundle.workbook !== 'object') {
      unsupportedTopologyReasons.push('compose_ootb could not resolve a base scaffold workbook.');
   }

   for (const viewMeta of requestedViews) {
      loadScaffoldBundleForView(resolvedProfiles[viewMeta.requestOrder], viewMeta);
   }

   if (unsupportedTopologyReasons.length > 0) {
      fail(
         'UNSUPPORTED_SCAFFOLD_BINDING_TOPOLOGY',
         unsupportedTopologyReasons.join(' ')
      );
   }

   workbookJson = deepClone(firstBundle.workbook);
   workbookJson.layouts = { children: [] };
   workbookJson.views = workbookJson.views && typeof workbookJson.views === 'object' ? workbookJson.views : {};
   workbookJson.views.currentView = 0;
   workbookJson.views.children = [];

   const mergedColumnsByID = new Map();
   for (const viewMeta of requestedViews) {
      const bundle = loadScaffoldBundleForView(resolvedProfiles[viewMeta.requestOrder], viewMeta);
      for (const column of bundle.criteriaColumns || []) {
         const columnID = toNonEmptyTrimmedString(column?.columnID);
         if (!columnID) {
            continue;
         }
         if (!mergedColumnsByID.has(columnID)) {
            mergedColumnsByID.set(columnID, deepClone(column));
         }
      }
   }
   if (workbookJson.criteria && typeof workbookJson.criteria === 'object') {
      if (!workbookJson.criteria.columns || typeof workbookJson.criteria.columns !== 'object') {
         workbookJson.criteria.columns = { children: [] };
      }
      workbookJson.criteria.columns.children = Array.from(mergedColumnsByID.values());
   }

   let globalViewCounter = 1;
   for (const [canvasIndex, canvas] of request.analysisShape.canvases.entries()) {
      const canvasViewRequests = requestedViews.filter((entry) => entry.canvasIndex === canvasIndex);
      if (canvasViewRequests.length === 0) {
         continue;
      }

      const canvasSeedBundle = loadScaffoldBundleForView(
         resolvedProfiles[canvasViewRequests[0].requestOrder],
         canvasViewRequests[0]
      );
      const layoutName = `layout${canvasIndex + 1}`;
      const canvasViewName = `canvas!${canvasIndex + 1}`;
      const requestedCanvasID = toNonEmptyTrimmedString(canvas.id);
      if (requestedCanvasID) {
         generatedCanvasViewNameByID.set(requestedCanvasID, canvasViewName);
      }

      const canvasView = deepClone(canvasSeedBundle.canvasView);
      canvasView.viewName = canvasViewName;
      canvasView.rootLayoutName = layoutName;
      applyCanvasTitleIfProvided(canvasView, canvas);
      workbookJson.views.children.push(canvasView);

      const layout = deepClone(canvasSeedBundle.layout);
      layout.name = layoutName;
      layout.children = [];

      const cols = canvasViewRequests.length <= 1 ? 1 : 2;
      const rows = Math.ceil(canvasViewRequests.length / cols);
      const cellWidth = cols === 1 ? 1200 : 600;
      const cellHeight = Math.max(220, Math.floor(680 / rows));

      for (let localIndex = 0; localIndex < canvasViewRequests.length; localIndex += 1) {
         const viewMeta = canvasViewRequests[localIndex];
         const requestedViewIndex = viewMeta.requestOrder;
         const bundle = loadScaffoldBundleForView(resolvedProfiles[requestedViewIndex], viewMeta);
         const pluginView = deepClone(bundle.pluginView);
         const pluginViewName = `view!${globalViewCounter}`;
         globalViewCounter += 1;
         pluginView.viewName = pluginViewName;
         applyFinalPluginType(pluginView, resolvedProfiles[requestedViewIndex].finalPluginType);
         applyViewTitleIfProvided(
            pluginView,
            collectAnalysisRequirementViewsByID(analysisRequirements).get(toNonEmptyTrimmedString(viewMeta.id)) || viewMeta
         );
         workbookJson.views.children.push(pluginView);
         generatedViewMappings.push({
            requestedViewID: viewMeta.id,
            canvasID: request.analysisShape.canvases[canvasIndex]?.id || null,
            viewName: pluginViewName,
            scaffoldTemplateId: resolvedProfiles[requestedViewIndex].scaffoldTemplateId,
            bindingSlots: deepClone(resolvedProfiles[requestedViewIndex].bindingSlots || {}),
            pluginType: pluginView.pluginType || resolvedProfiles[requestedViewIndex].finalPluginType
         });

         const colIndex = localIndex % cols;
         const rowIndex = Math.floor(localIndex / cols);
         layout.children.push(
            buildComposeCell(
               pluginViewName,
               colIndex * cellWidth,
               rowIndex * cellHeight,
               cellWidth,
               cellHeight,
               localIndex + 1
            )
         );
      }

      workbookJson.layouts.children.push(layout);
   }
}

if (!workbookJson || typeof workbookJson !== 'object' || Array.isArray(workbookJson)) {
   fail('INVALID_ADAPTER_CONTRACT', 'Resolved workbook JSON payload is invalid.');
}

const payloadSaveMetadata = {
   name: (typeof workbookJson.name === 'string' && workbookJson.name.trim() !== '') ? workbookJson.name.trim() : null,
   description: (typeof workbookJson.description === 'string') ? workbookJson.description : null
};
const requestSaveMetadata = {
   name: (request.workbook && typeof request.workbook.name === 'string' && request.workbook.name.trim() !== '')
      ? request.workbook.name.trim()
      : null,
   description: (request.workbook && typeof request.workbook.description === 'string')
      ? request.workbook.description
      : null
};
const saveMetadata = {
   name: requestSaveMetadata.name ?? payloadSaveMetadata.name ?? null,
   description: requestSaveMetadata.description ?? payloadSaveMetadata.description ?? null
};
delete workbookJson.name;
delete workbookJson.description;

workbookJson.projectVersion = selectedTrack.projectVersion;
if (generationStrategyApplied === 'compose_ootb') {
   if (Array.isArray(workbookJson.datasources?.children) && workbookJson.datasources.children.length > 0) {
      if (workbookJson.datasources.children[0] && typeof workbookJson.datasources.children[0] === 'object') {
         workbookJson.datasources.children[0].subjectArea = selectedDataModel;
      }
   }
   if (workbookJson.criteria && typeof workbookJson.criteria === 'object') {
      workbookJson.criteria.subjectArea = selectedDataModel;
   }
}
const planningDerivedSemanticRoleMap = generationStrategyApplied === 'compose_ootb'
   ? {
      ...extractSemanticRoleOverridesFromPlanning(request.analysisShape?.canvases, selectedDataModel),
      ...extractSemanticRoleOverridesFromPlanning(analysisRequirements?.canvases, selectedDataModel)
   }
   : {};
const composedSemanticRoleMap = generationStrategyApplied === 'compose_ootb'
   ? {
      ...(isPlainObject(adapterPayload.semanticRoleMap) ? adapterPayload.semanticRoleMap : {}),
      ...planningDerivedSemanticRoleMap
   }
   : (isPlainObject(adapterPayload.semanticRoleMap) ? adapterPayload.semanticRoleMap : null);
const criteriaRebindingSummary = generationStrategyApplied === 'compose_ootb'
   ? rebindCriteriaColumnsForCompose(workbookJson, adapterDescribe.columns, selectedDataModel, {
      semanticRoleMap: composedSemanticRoleMap,
      semanticRoleContracts,
      runtimeFamilies: resolvedProfiles
         .map((profile) => toNonEmptyTrimmedString(profile?.runtimeContractFamily))
         .filter(Boolean)
   })
   : {
      reboundCount: 0,
      reboundColumns: []
   };

const perViewBindingMaterializationSummary = generationStrategyApplied === 'compose_ootb'
   ? materializeComposeViewBindings(
      workbookJson,
      analysisRequirements,
      generatedViewMappings,
      selectedDataModel,
      semanticRoleContracts
   )
   : {
      materializedViewCount: 0,
      materializedBindingCount: 0,
      createdCriteriaColumnCount: 0,
      rewrittenColumnReferenceCount: 0,
      pivotTopologyMaterializedViewCount: 0,
      pivotTopologyBindingCount: 0,
      tableTopologyMaterializedViewCount: 0,
      tableTopologyBindingCount: 0,
      skippedBindingCount: 0,
      skippedBindings: []
   };
for (const [columnID, formatSpec] of Object.entries(perViewBindingMaterializationSummary.formatSpecsByColumnID || {})) {
   if (!numberFormattingExplicitByColumnID.has(columnID)) {
      numberFormattingExplicitByColumnID.set(
         columnID,
         normalizeNumberFormatSpec(formatSpec, `analysisRequirements.fields format for ${columnID}`)
      );
   }
}
const planningFilterMaterializationSummary = generationStrategyApplied === 'compose_ootb'
   ? applyPlanningFilters(
      workbookJson,
      analysisRequirements,
      generatedViewMappings,
      generatedCanvasViewNameByID,
      filterControlConfigDefaultVersion,
      requestedFilterMode
   )
   : {
      requiredCount: 0,
      appliedCount: 0,
      deduplicatedCount: 0,
      skippedDispositionCount: 0,
      materialized: []
   };
const criteriaColumnMap = buildCriteriaColumnMap(workbookJson);
const pluginViewEntries = collectPluginViews(workbookJson);
const textboxRuntimeNormalizationSummary = normalizeTextboxRuntimeText(workbookJson, viewConfigDefaultVersion);
const requestedViewIDsByViewName = new Map();
const presentationPolishSummary = applyPresentationPolish(workbookJson, {
   mode: presentationPolishMode,
   titlePolicy: presentationPolishTitlePolicy,
   generationStrategyApplied,
   requestedFilterMode,
   requestCanvases: request.analysisShape.canvases,
   layoutTemplateHints: presentationPolishLayoutHints,
   polishContract: presentationPolishContracts,
   systemLayoutTemplates,
   styleTokenSetId: presentationPolishContractDefaults.styleTokenSetId,
   resolveRuntimeFamilyForPluginType,
   viewConfigDefaultVersion
});
if (presentationPolishSummary.uxLintSummary.strictViolation) {
   const firstSevere = (presentationPolishSummary.uxLintSummary.findings || []).find((finding) => finding?.severity === 'severe') || null;
   const firstMessage = toNonEmptyTrimmedString(firstSevere?.message) || 'Unknown severe UX lint finding.';
   fail(
      'PRESENTATION_POLISH_STRICT_FAILED',
      `presentationPolish strict mode failed with ${presentationPolishSummary.uxLintSummary.severeCount} severe finding(s). First issue: ${firstMessage}`
   );
}

function mapRequestedViewToViewName(requestedViewID, viewName) {
   if (typeof requestedViewID !== 'string' || requestedViewID.trim() === '') {
      return;
   }
   if (typeof viewName !== 'string' || viewName.trim() === '') {
      return;
   }
   const normalizedRequestedViewID = requestedViewID.trim();
   const normalizedViewName = viewName.trim();
   if (!requestedViewIDsByViewName.has(normalizedViewName)) {
      requestedViewIDsByViewName.set(normalizedViewName, []);
   }
   const existing = requestedViewIDsByViewName.get(normalizedViewName);
   if (!existing.includes(normalizedRequestedViewID)) {
      existing.push(normalizedRequestedViewID);
   }
}

for (const generatedMapping of generatedViewMappings) {
   mapRequestedViewToViewName(generatedMapping.requestedViewID, generatedMapping.viewName);
}

if (requestedViews.length > 0) {
   const claimedPluginViewNames = new Set(
      Array.from(requestedViewIDsByViewName.keys()).filter((value) => typeof value === 'string' && value !== '')
   );
   const fallbackCandidates = pluginViewEntries
      .map((entry, index) => {
         const viewName = toNonEmptyTrimmedString(entry?.view?.viewName) || `plugin_view_${index + 1}`;
         const pluginType = toNonEmptyTrimmedString(entry?.view?.pluginType);
         return {
            viewName,
            pluginType,
            assigned: claimedPluginViewNames.has(viewName)
         };
      });
   for (const requestView of requestedViews) {
      const requestViewID = toNonEmptyTrimmedString(requestView.id);
      if (!requestViewID) {
         continue;
      }
      const hasMapping = Array.from(requestedViewIDsByViewName.values()).some((requestIDs) => requestIDs.includes(requestViewID));
      if (hasMapping) {
         continue;
      }
      const requestedPluginType = toNonEmptyTrimmedString(requestView.pluginType);
      let candidate = fallbackCandidates.find((entry) => !entry.assigned && requestedPluginType && entry.pluginType === requestedPluginType);
      if (!candidate) {
         candidate = fallbackCandidates.find((entry) => !entry.assigned) || null;
      }
      if (!candidate) {
         break;
      }
      candidate.assigned = true;
      mapRequestedViewToViewName(requestViewID, candidate.viewName);
   }
}
const requirementsViewAssignments = [];
for (const [viewName, requestIDs] of requestedViewIDsByViewName.entries()) {
   for (const requestedViewID of requestIDs) {
      requirementsViewAssignments.push({
         requestedViewID,
         viewName
      });
   }
}
const requirementsTraceRequired = generationStrategyApplied === 'compose_ootb' && !skipRequirementsGate;
const filterPlanningSummary = summarizeFilterPlanning(analysisRequirements);
const templateFallbackCount = resolvedProfiles.filter((profile) => profile?.fallbackUsed === true).length;
const explicitMappingCount = Array.isArray(criteriaRebindingSummary?.explicitMappingsApplied)
   ? criteriaRebindingSummary.explicitMappingsApplied.length
   : 0;
const reboundCount = Number.isInteger(criteriaRebindingSummary?.reboundCount)
   ? criteriaRebindingSummary.reboundCount
   : 0;
const semanticInferenceFallbackCount = generationStrategyApplied === 'compose_ootb'
   ? Math.max(reboundCount - explicitMappingCount, 0)
   : 0;
const fallbackUsageSummary = {
   semanticInferenceFallbackUsed: semanticInferenceFallbackCount > 0,
   semanticInferenceFallbackCount,
   templateFallbackUsed: templateFallbackCount > 0,
   templateFallbackCount
};
const planningDataActionSummary = generationStrategyApplied === 'compose_ootb' && analysisRequirementsFieldContext
   ? applyPlanningDataActions(workbookJson, analysisRequirements, generatedCanvasViewNameByID, analysisRequirementsFieldContext)
   : {
      appliedCount: 0
   };
const componentGraphSummary = summarizeWorkbookComponentGraph(workbookJson);

function resolveNumberFormatSpecForColumn(columnID, column) {
   const explicitByColumnID = numberFormattingExplicitByColumnID.get(columnID);
   if (explicitByColumnID) {
      return {
         spec: deepClone(explicitByColumnID),
         source: 'explicit_by_column_id'
      };
   }

   const labelCandidates = [];
   const heading = toNonEmptyTrimmedString(column?.columnHeading?.caption?.text);
   if (heading) {
      labelCandidates.push(heading.toLowerCase());
   }
   const fallbackLabel = getColumnLabel(column, columnID);
   if (fallbackLabel) {
      labelCandidates.push(fallbackLabel.toLowerCase());
   }
   for (const labelCandidate of labelCandidates) {
      if (numberFormattingExplicitByLabel.has(labelCandidate)) {
         return {
            spec: deepClone(numberFormattingExplicitByLabel.get(labelCandidate)),
            source: 'explicit_by_label'
         };
      }
   }

   if (numberFormattingExplicitDefault) {
      return {
         spec: deepClone(numberFormattingExplicitDefault),
         source: 'explicit_default'
      };
   }

   if (numberFormattingPolicy === 'auto_safe') {
      const inferred = inferAutoSafeNumberFormat(column, columnID);
      if (inferred) {
         return {
            spec: normalizeNumberFormatSpec(inferred, `numberFormatting.auto_safe.${columnID}`),
            source: 'auto_safe_inference'
         };
      }
   }

   return {
      spec: null,
      source: 'none'
   };
}

const numberFormattingSummary = {
   policy: numberFormattingPolicy,
   scope: numberFormattingScope,
   validationMode: numberFormattingValidationMode,
   enabled: numberFormattingPolicy !== 'none',
   targetMeasureViewCount: 0,
   targetMeasureColumnCount: 0,
   formattedViewCount: 0,
   formattedColumnCount: 0,
   unformattedMeasureViews: []
};
const numberFormattingTrace = [];

if (numberFormattingPolicy !== 'none') {
   for (const [pluginIndex, pluginEntry] of pluginViewEntries.entries()) {
      const pluginView = pluginEntry.view;
      const viewName = toNonEmptyTrimmedString(pluginView?.viewName) || `plugin_view_${pluginIndex + 1}`;
      const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType) || null;
      const runtimeFamily = pluginType ? resolveRuntimeFamilyForPluginType(pluginType) : null;
      const formatterPath = runtimeFamily ? formatterPathByFamily[runtimeFamily] : null;
      const formatterPathSegments = normalizeFormatterPath(formatterPath);
      const requestedViewIDs = requestedViewIDsByViewName.get(viewName) || [];

      let viewInScope = false;
      if (numberFormattingScope === 'all_supported_measure_views') {
         viewInScope = true;
      } else if (numberFormattingScope === 'requested_views') {
         viewInScope = requestedViewIDs.length > 0;
      } else if (numberFormattingScope === 'view_ids') {
         viewInScope = requestedViewIDs.some((requestID) => numberFormattingViewIDs.has(requestID)) || numberFormattingViewIDs.has(viewName);
      }
      if (!viewInScope) {
         continue;
      }

      const referencedColumnIDs = new Set();
      collectColumnIDsFromValue(pluginView?.dataModels, referencedColumnIDs);
      const measureColumnIDs = Array.from(referencedColumnIDs).filter((columnID) => {
         const column = criteriaColumnMap.get(columnID) || null;
         return isLikelyMeasureColumn(column, columnID);
      });
      if (measureColumnIDs.length === 0) {
         continue;
      }

      numberFormattingSummary.targetMeasureViewCount += 1;
      numberFormattingSummary.targetMeasureColumnCount += measureColumnIDs.length;

      const traceEntry = {
         viewName,
         requestedViewIDs,
         pluginType,
         runtimeFamily,
         measureColumnIDs,
         formattedColumnIDs: [],
         skippedColumnIDs: [],
         formatterPath: formatterPath || null
      };

      if (!runtimeFamily || formatterPathSegments.length === 0) {
         traceEntry.reason = !runtimeFamily
            ? 'unsupported_runtime_family'
            : 'missing_formatter_path_mapping';
         traceEntry.skippedColumnIDs = [...measureColumnIDs];
         numberFormattingSummary.unformattedMeasureViews.push({
            viewName,
            requestedViewIDs,
            pluginType,
            runtimeFamily,
            reason: traceEntry.reason,
            unformattedColumnIDs: [...measureColumnIDs]
         });
         numberFormattingTrace.push(traceEntry);
         continue;
      }

      const settings = ensureViewConfigSettings(pluginView, viewConfigDefaultVersion);
      const formatterContainer = ensureNestedObjectAtPath(settings, formatterPathSegments);

      const unresolvedColumnIDs = [];
      const appliedColumns = [];
      for (const columnID of measureColumnIDs) {
         const column = criteriaColumnMap.get(columnID) || null;
         const resolution = resolveNumberFormatSpecForColumn(columnID, column);
         if (!resolution.spec) {
            unresolvedColumnIDs.push(columnID);
            continue;
         }
         const normalizedSpec = normalizeNumberFormatSpec(resolution.spec, `numberFormatting.resolved.${columnID}`);
         const persistedSpec = {
            ...normalizedSpec,
            bIsNested: true
         };
         const propertyKeys = buildNumberFormatPropertyKeys(runtimeFamily, column, columnID);
         for (const propertyKey of propertyKeys) {
            formatterContainer[propertyKey] = deepClone(persistedSpec);
         }
         if (!isPlainObject(formatterContainer.numberFormat)) {
            formatterContainer.numberFormat = deepClone(persistedSpec);
         }
         appliedColumns.push({
            columnID,
            source: resolution.source,
            propertyKeys
         });
      }

      if (appliedColumns.length > 0) {
         numberFormattingSummary.formattedViewCount += 1;
         numberFormattingSummary.formattedColumnCount += appliedColumns.length;
      }
      if (unresolvedColumnIDs.length > 0) {
         numberFormattingSummary.unformattedMeasureViews.push({
            viewName,
            requestedViewIDs,
            pluginType,
            runtimeFamily,
            reason: 'missing_format_for_measure_columns',
            unformattedColumnIDs: unresolvedColumnIDs
         });
      }

      traceEntry.formattedColumnIDs = appliedColumns.map((entry) => entry.columnID);
      traceEntry.appliedColumns = appliedColumns;
      traceEntry.skippedColumnIDs = unresolvedColumnIDs;
      traceEntry.reason = unresolvedColumnIDs.length > 0 && appliedColumns.length === 0
         ? 'no_measure_columns_formatted'
         : (unresolvedColumnIDs.length > 0 ? 'partial_formatting' : 'all_measure_columns_formatted');
      numberFormattingTrace.push(traceEntry);
   }
}

if (generationStrategyApplied === 'compose_ootb' && requestedFilterMode === 'filter_viz') {
   normalizeFilterControlHostingForFilterViz(workbookJson);
} else if (requestedFilterMode !== 'filter_viz') {
   normalizeFilterControlHostingForFilterBar(workbookJson);
}

numberFormattingSummary.unformattedMeasureViewCount = numberFormattingSummary.unformattedMeasureViews.length;
if (numberFormattingPolicy !== 'none'
   && numberFormattingValidationMode === 'error_on_unformatted'
   && numberFormattingSummary.unformattedMeasureViewCount > 0) {
   const firstGap = numberFormattingSummary.unformattedMeasureViews[0];
   const firstViewName = firstGap?.viewName || 'unknown_view';
   const firstReason = firstGap?.reason || 'unknown_reason';
   fail(
      'NUMBER_FORMATTING_VALIDATION_FAILED',
      `Unformatted measure views detected (${numberFormattingSummary.unformattedMeasureViewCount}). First gap: ${firstViewName} (${firstReason}).`
   );
}

const requestedPluginTypeForValidationCheck = typeof request.requestedPluginType === 'string' && request.requestedPluginType.trim() !== ''
   ? request.requestedPluginType.trim()
   : null;

normalizeLayoutCustomPropsSerialization(workbookJson);

const outputWorkbookPath = path.resolve(
   requestedOutputPathArg ||
   request.output?.workbookPath ||
   path.join(
      path.dirname(requestPath),
      `${path.basename(requestPath, path.extname(requestPath))}.regenerated.workbook.json`
   )
);
writeJson(outputWorkbookPath, workbookJson);

function runRequirementsTraceValidation() {
   const traceRequestPath = path.join(
      path.dirname(outputWorkbookPath),
      `${path.basename(outputWorkbookPath, path.extname(outputWorkbookPath))}.requirements-trace.request.json`
   );
   writeJson(traceRequestPath, {
      generationStrategyApplied,
      targetVersion: selectedTrack.displayVersion,
      selectedDataModel,
      analysisRequirements,
      analysisShape: request.analysisShape,
      workbookPath: outputWorkbookPath,
      viewAssignments: requirementsViewAssignments
   });

   const result = spawnSync(
      process.execPath,
      [
         requirementsTraceValidationPath,
         '--request',
         traceRequestPath,
         '--runtime-path-registry',
         runtimePathRegistryPath
      ],
      {
         encoding: 'utf8',
         cwd: repoRoot,
         env: process.env
      }
   );
   if (result.status !== 0) {
      const stderrText = (result.stderr || '').trim();
      fail(
         'REQUIREMENTS_TRACE_VALIDATION_FAILED',
         stderrText || 'validate-requirements-trace failed without stderr output.'
      );
   }
   const stdoutText = (result.stdout || '').trim();
   if (!stdoutText) {
      fail('REQUIREMENTS_TRACE_VALIDATION_FAILED', 'validate-requirements-trace returned empty stdout.');
   }
   let parsed;
   try {
      parsed = JSON.parse(stdoutText);
   } catch (error) {
      fail(
         'REQUIREMENTS_TRACE_VALIDATION_FAILED',
         `Unable to parse validate-requirements-trace JSON output: ${error?.message || String(error)}`
      );
   }
   if (!isPlainObject(parsed)) {
      fail('REQUIREMENTS_TRACE_VALIDATION_FAILED', 'validate-requirements-trace output must be a JSON object.');
   }
   return parsed;
}

function summarizeRequirementsTrace(requirementsTraceResult) {
   const blockingMismatches = Array.isArray(requirementsTraceResult.blockingMismatches)
      ? requirementsTraceResult.blockingMismatches
      : (Array.isArray(requirementsTraceResult.mismatches) ? requirementsTraceResult.mismatches : []);
   const warningMismatches = Array.isArray(requirementsTraceResult.warnings)
      ? requirementsTraceResult.warnings
      : [];
   const blockingMismatchCount = Number.isInteger(requirementsTraceResult.blockingMismatchCount)
      ? requirementsTraceResult.blockingMismatchCount
      : blockingMismatches.length;
   const warningCount = Number.isInteger(requirementsTraceResult.warningCount)
      ? requirementsTraceResult.warningCount
      : warningMismatches.length;
   return {
      required: requirementsTraceRequired,
      executed: true,
      valid: blockingMismatchCount === 0 && requirementsTraceResult.valid !== false,
      mismatchCount: blockingMismatchCount,
      blockingMismatchCount,
      warningCount,
      mismatches: blockingMismatches,
      blockingMismatches,
      warnings: warningMismatches
   };
}

function enforceRequirementsTrace(summary, phase) {
   if (!requirementsTraceRequired || summary.valid) {
      return;
   }
   const firstMismatch = summary.blockingMismatches[0];
   const firstMessage = toNonEmptyTrimmedString(firstMismatch?.message) || 'requirements trace mismatch';
   fail(
      'REQUIREMENTS_TRACE_VALIDATION_FAILED',
      `${phase} requirements trace validation failed with ${summary.blockingMismatchCount} blocking mismatch(es). `
      + `First issue: ${firstMessage}`
   );
}

let requirementsTraceSummary = summarizeRequirementsTrace(runRequirementsTraceValidation());
const composeFilterToleranceSummary = summarizeComposeFilterTolerance(composeFilterToleranceSummarySeed);
enforceRequirementsTrace(requirementsTraceSummary, 'Pre-canonicalization');
const planningConsumptionSummary = {
   required: requirementsTraceRequired,
   valid: requirementsTraceSummary.valid,
   unconsumedCount: requirementsTraceSummary.blockingMismatchCount,
   bindingMaterializedViewCount: perViewBindingMaterializationSummary.materializedViewCount,
   filterRequiredCount: planningFilterMaterializationSummary.requiredCount,
   filterAppliedCount: planningFilterMaterializationSummary.appliedCount,
   filterDeduplicatedCount: planningFilterMaterializationSummary.deduplicatedCount,
   aggregationApplicationCount: perViewBindingMaterializationSummary.aggregationApplicationCount,
   sortApplicationCount: perViewBindingMaterializationSummary.sortApplicationCount
};

function runRuntimeValidationCheck(extraArgs, errorCode) {
   const baseArgs = [
      runtimeValidationCheckPath,
      '--input',
      outputWorkbookPath,
      '--viz-resolution-profiles',
      vizResolutionProfilesPath,
      '--schema-registry-profile',
      schemaRegistryProfilePath,
      '--schema-dir',
      schemaDirPath,
      '--discovery-method',
      capabilities.discoveryMethod,
      '--oac-mcp-connected',
      String(oacMcpConnectedForDefaultVersion),
      '--save-available',
      String(asBoolean(capabilities.saveAvailable)),
      '--export-available',
      String(asBoolean(capabilities.exportAvailable))
   ];
   if (versionBundleSelection.selectedCompatibilityTarget) {
      baseArgs.push('--compatibility-target', versionBundleSelection.selectedCompatibilityTarget);
   } else {
      baseArgs.push('--target-version', selectedTrack.displayVersion);
   }

   if (typeof capabilities.exportRequested === 'boolean') {
      baseArgs.push('--export-requested', String(capabilities.exportRequested));
   }
   if (reasonForVersionSelection) {
      baseArgs.push('--version-selection-reason', reasonForVersionSelection);
   }
   if (requestedPluginTypeForValidationCheck) {
      baseArgs.push('--requested-plugin-type', requestedPluginTypeForValidationCheck);
   }
   if (Array.isArray(extraArgs) && extraArgs.length > 0) {
      baseArgs.push(...extraArgs);
   }

   const result = spawnSync(process.execPath, baseArgs, {
      encoding: 'utf8',
      cwd: repoRoot,
      env: process.env
   });

   if (result.status !== 0) {
      const stderrText = (result.stderr || '').trim();
      fail(errorCode, stderrText || 'runtime-validation-check failed without stderr output.');
   }

   const stdoutText = (result.stdout || '').trim();
   if (!stdoutText) {
      fail('RUNTIME_VALIDATION_CHECK_OUTPUT_PARSE_FAILED', 'runtime-validation-check returned empty stdout.');
   }

   let parsed;
   try {
      parsed = JSON.parse(stdoutText);
   } catch (error) {
      fail('RUNTIME_VALIDATION_CHECK_OUTPUT_PARSE_FAILED', `Unable to parse runtime-validation-check JSON output: ${error?.message || String(error)}`);
   }
   if (!parsed || typeof parsed !== 'object') {
      fail('RUNTIME_VALIDATION_CHECK_OUTPUT_PARSE_FAILED', 'runtime-validation-check JSON output is not an object.');
   }
   return parsed;
}

const canonicalizeResult = runRuntimeValidationCheck(['--apply-known-patches', '--in-place'], 'RUNTIME_VALIDATION_CHECK_CANONICALIZE_FAILED');
const strictResult = runRuntimeValidationCheck([], 'RUNTIME_VALIDATION_CHECK_STRICT_FAILED');
requirementsTraceSummary = summarizeRequirementsTrace(runRequirementsTraceValidation());
enforceRequirementsTrace(requirementsTraceSummary, 'Post-canonicalization');
planningConsumptionSummary.valid = requirementsTraceSummary.valid;
planningConsumptionSummary.unconsumedCount = requirementsTraceSummary.blockingMismatchCount;

function resolveDvIntelligenceProfileID(targetVersionToken) {
   const profileByTargetVersion = isPlainObject(dvIntelligenceContracts?.defaults?.profileByTargetVersion)
      ? dvIntelligenceContracts.defaults.profileByTargetVersion
      : {};
   return toNonEmptyTrimmedString(profileByTargetVersion[targetVersionToken])
      || toNonEmptyTrimmedString(profileByTargetVersion.default)
      || 'balanced_v1';
}

function resolveDvIntelligenceReferences() {
   const rawReferences = Array.isArray(dvIntelligenceContracts?.documentation?.references)
      ? dvIntelligenceContracts.documentation.references
      : [];
   return rawReferences.reduce((normalized, reference) => {
      if (!isPlainObject(reference)) {
         return normalized;
      }
      const url = toNonEmptyTrimmedString(reference.url);
      if (!url) {
         return normalized;
      }
      const normalizedReference = { url };
      const id = toNonEmptyTrimmedString(reference.id);
      const title = toNonEmptyTrimmedString(reference.title);
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

function buildDvIntelligenceUnavailableSummary(mode, targetVersionToken, warningReason) {
   const references = resolveDvIntelligenceReferences();
   return {
      mode,
      status: mode === 'off' ? 'disabled' : 'scoring_unavailable',
      overallScore: null,
      audienceLevel: null,
      dimensionScores: [],
      recommendations: mode === 'off'
         ? []
         : [
            {
               id: 'DV_INTELLIGENCE_SCORING_UNAVAILABLE',
               priority: 'low',
               dimensionID: null,
               message: 'DV intelligence scoring was unavailable for this run.',
               action: warningReason
            }
         ],
      evidenceCoverage: {
         featureCount: 0,
         availableFeatureCount: 0,
         coverageRatio: 0
      },
      versionProfile: {
         id: resolveDvIntelligenceProfileID(targetVersionToken),
         targetVersion: targetVersionToken,
         contractVersion: toNonEmptyTrimmedString(dvIntelligenceContracts?.contractVersion) || 'v1',
         audienceProfile: visualizationIntelligenceAudienceProfile
      },
      ...(references.length > 0 ? { references } : {})
   };
}

function runDvIntelligenceScoring() {
   const targetVersionToken = strictResult.targetVersion || selectedTrack.displayVersion;
   if (visualizationIntelligenceMode === 'off') {
      const summary = buildDvIntelligenceUnavailableSummary('off', targetVersionToken, 'visualizationIntelligence.mode=off');
      return {
         summary,
         trace: {
            mode: 'off',
            status: 'disabled',
            reason: 'visualizationIntelligence.mode=off'
         }
      };
   }
   if (!fs.existsSync(dvIntelligenceScoringPath)) {
      const reason = `Missing DV intelligence scoring tool: ${dvIntelligenceScoringPath}`;
      return {
         summary: buildDvIntelligenceUnavailableSummary(visualizationIntelligenceMode, targetVersionToken, reason),
         trace: {
            mode: visualizationIntelligenceMode,
            status: 'scoring_unavailable',
            reason
         }
      };
   }
   if (!fs.existsSync(dvIntelligenceContractsPath)) {
      const reason = `Missing DV intelligence contract: ${dvIntelligenceContractsPath}`;
      return {
         summary: buildDvIntelligenceUnavailableSummary(visualizationIntelligenceMode, targetVersionToken, reason),
         trace: {
            mode: visualizationIntelligenceMode,
            status: 'scoring_unavailable',
            reason
         }
      };
   }

   const scoringRequestPath = path.join(
      path.dirname(outputWorkbookPath),
      `${path.basename(outputWorkbookPath, path.extname(outputWorkbookPath))}.dv-intelligence.request.json`
   );
   writeJson(scoringRequestPath, {
      mode: visualizationIntelligenceMode,
      targetVersion: targetVersionToken,
      profileID: resolveDvIntelligenceProfileID(targetVersionToken),
      audienceProfile: visualizationIntelligenceAudienceProfile,
      workbookJson,
      summaries: {
         validationStatus: {
            valid: strictResult.valid === true
         },
         requirementsTraceSummary,
         filterPlanningSummary,
         componentGraphSummary,
         presentationPolishSummary,
         numberFormattingSummary
      },
      analysisSignals: {
         calculationCount: Array.isArray(analysisRequirements?.canvases)
            ? analysisRequirements.canvases.reduce((canvasTotal, canvas) => {
               const views = Array.isArray(canvas?.views) ? canvas.views : [];
               return canvasTotal + views.reduce((viewTotal, view) => {
                  const calculations = Array.isArray(view?.calculations) ? view.calculations.length : 0;
                  return viewTotal + calculations;
               }, 0);
            }, 0)
            : 0
      }
   });

   const scoringResult = spawnSync(
      process.execPath,
      [
         dvIntelligenceScoringPath,
         '--request',
         scoringRequestPath,
         '--contract',
         dvIntelligenceContractsPath,
         '--runtime-path-registry',
         runtimePathRegistryPath
      ],
      {
         encoding: 'utf8',
         cwd: repoRoot,
         env: process.env
      }
   );
   if (scoringResult.status !== 0) {
      const reason = (scoringResult.stderr || '').trim() || 'score-dv-intelligence failed without stderr output.';
      return {
         summary: buildDvIntelligenceUnavailableSummary(visualizationIntelligenceMode, targetVersionToken, reason),
         trace: {
            mode: visualizationIntelligenceMode,
            status: 'scoring_unavailable',
            reason
         }
      };
   }

   const scoringStdout = (scoringResult.stdout || '').trim();
   if (!scoringStdout) {
      const reason = 'score-dv-intelligence returned empty stdout.';
      return {
         summary: buildDvIntelligenceUnavailableSummary(visualizationIntelligenceMode, targetVersionToken, reason),
         trace: {
            mode: visualizationIntelligenceMode,
            status: 'scoring_unavailable',
            reason
         }
      };
   }

   let parsedScoringResult = null;
   try {
      parsedScoringResult = JSON.parse(scoringStdout);
   } catch (error) {
      const reason = `Unable to parse score-dv-intelligence output: ${error?.message || String(error)}`;
      return {
         summary: buildDvIntelligenceUnavailableSummary(visualizationIntelligenceMode, targetVersionToken, reason),
         trace: {
            mode: visualizationIntelligenceMode,
            status: 'scoring_unavailable',
            reason
         }
      };
   }

   if (!isPlainObject(parsedScoringResult) || !isPlainObject(parsedScoringResult.summary)) {
      const reason = 'score-dv-intelligence output must contain summary object.';
      return {
         summary: buildDvIntelligenceUnavailableSummary(visualizationIntelligenceMode, targetVersionToken, reason),
         trace: {
            mode: visualizationIntelligenceMode,
            status: 'scoring_unavailable',
            reason
         }
      };
   }

   const scoredSummary = {
      ...parsedScoringResult.summary,
      mode: toNonEmptyTrimmedString(parsedScoringResult.summary.mode) || visualizationIntelligenceMode,
      status: toNonEmptyTrimmedString(parsedScoringResult.summary.status) || 'scored',
      overallScore: Number.isFinite(Number(parsedScoringResult.summary.overallScore))
         ? clampNumber(Number(parsedScoringResult.summary.overallScore), 0, 100)
         : null,
      dimensionScores: Array.isArray(parsedScoringResult.summary.dimensionScores)
         ? parsedScoringResult.summary.dimensionScores
         : [],
      recommendations: Array.isArray(parsedScoringResult.summary.recommendations)
         ? parsedScoringResult.summary.recommendations
         : [],
      evidenceCoverage: isPlainObject(parsedScoringResult.summary.evidenceCoverage)
         ? parsedScoringResult.summary.evidenceCoverage
         : {
            featureCount: 0,
            availableFeatureCount: 0,
            coverageRatio: 0
         },
      versionProfile: isPlainObject(parsedScoringResult.summary.versionProfile)
         ? parsedScoringResult.summary.versionProfile
         : {
            id: resolveDvIntelligenceProfileID(targetVersionToken),
            targetVersion: targetVersionToken,
            contractVersion: toNonEmptyTrimmedString(dvIntelligenceContracts?.contractVersion) || 'v1',
            audienceProfile: visualizationIntelligenceAudienceProfile
         }
   };
   if (!Array.isArray(scoredSummary.references) || scoredSummary.references.length === 0) {
      const references = resolveDvIntelligenceReferences();
      if (references.length > 0) {
         scoredSummary.references = references;
      }
   }
   return {
      summary: scoredSummary,
      trace: isPlainObject(parsedScoringResult.trace)
         ? parsedScoringResult.trace
         : {
            mode: visualizationIntelligenceMode,
            status: 'scored',
            reason: 'score-dv-intelligence trace omitted'
         }
   };
}

const dvIntelligenceResult = runDvIntelligenceScoring();
const dvIntelligenceSummary = dvIntelligenceResult.summary;
const dvIntelligenceTrace = dvIntelligenceResult.trace;

const saveAttempted = asBoolean(adapterPayload.save?.attempted);
const saveOutcomeInput = typeof adapterPayload.save?.outcome === 'string'
   ? adapterPayload.save.outcome.trim()
   : '';
const saveOutcome = capabilities.saveAvailable
   ? (saveOutcomeInput !== '' ? saveOutcomeInput : (saveAttempted ? 'unknown' : 'not_attempted'))
   : 'not_available';
const viewUrlInput = typeof adapterPayload.save?.viewUrl === 'string'
   ? adapterPayload.save.viewUrl.trim()
   : '';
const viewUrl = viewUrlInput !== '' ? viewUrlInput : null;
const successfulSaveOutcomes = new Set(Array.isArray(adapterContract.saveSection?.successOutcomesRequiringViewUrl)
   ? adapterContract.saveSection.successOutcomesRequiringViewUrl
      .filter((value) => typeof value === 'string' && value.trim() !== '')
      .map((value) => value.trim())
   : ['success', 'saved']);
if (capabilities.saveAvailable && successfulSaveOutcomes.has(saveOutcome) && viewUrl === null) {
   fail(
      'INVALID_ADAPTER_CONTRACT',
      `adapterPayload.save.viewUrl is required when adapterPayload.save.outcome is '${saveOutcome}'.`
   );
}
const exportRequested = capabilities.exportRequested === true;
const exportOutcome = capabilities.exportAvailable
   ? (exportRequested
      ? (typeof adapterPayload.export?.outcome === 'string' ? adapterPayload.export.outcome : (asBoolean(adapterPayload.export?.attempted) ? 'unknown' : 'not_attempted'))
      : 'not_requested')
   : 'not_available';
let evidenceLevel = 'valid_json';
if (Array.isArray(adapterDescribe.columns) && adapterDescribe.columns.length > 0) {
   evidenceLevel = 'metadata_vetted';
}
if (requirementsTraceSummary.valid) {
   evidenceLevel = 'traceability_vetted';
}
if (strictResult.valid === true) {
   evidenceLevel = 'runtime_vetted';
}
if (capabilities.saveAvailable && successfulSaveOutcomes.has(saveOutcome) && viewUrl) {
   evidenceLevel = 'saved';
}

const traceRequested = asBoolean(capabilities.traceRequested) || asBoolean(request.traceRequested);

const response = {
   status: strictResult.valid === true ? 'ok' : 'error',
   workbookPath: outputWorkbookPath,
   validationStatus: {
      valid: strictResult.valid === true,
      pluginViewsValidated: strictResult.pluginViewsValidated ?? null,
      errors: Array.isArray(strictResult.errors) ? strictResult.errors : []
   },
   generationStrategyRequested,
   generationStrategyApplied,
   compositionCoverage,
   unsupportedTopologyReasons,
   saveAttempted,
   saveOutcome,
   viewUrl,
   exportOutcome,
   targetVersion: strictResult.targetVersion || selectedTrack.displayVersion,
   compatibilityTarget: versionBundleSelection.selectedCompatibilityTarget || selectedTrack.displayVersion,
   detectedTargetVersion: strictResult.targetVersion || selectedTrack.displayVersion,
   availableTargetVersions: versionBundleSelection.availableTargetVersions,
   executionMode,
   discoveryMethod: strictResult.discoveryMethod || capabilities.discoveryMethod,
   saveAvailable: asBoolean(capabilities.saveAvailable),
   exportAvailable: asBoolean(capabilities.exportAvailable),
   exportRequested,
   evidenceLevel,
   localJsonPath: outputWorkbookPath,
   savedWorkbookTarget: adapterPayload.save?.savedWorkbookTarget || null,
   saveMetadata,
   requirementsTraceSummary,
   analysisRequirementsPlanningNormalization,
   perViewBindingMaterializationSummary,
   planningFilterMaterializationSummary,
   planningConsumptionSummary,
   composeFilterToleranceSummary,
   filterPlanningSummary,
   componentGraphSummary,
   planningDataActionSummary,
   fallbackUsageSummary,
   numberFormattingSummary,
   textboxRuntimeNormalizationSummary: {
      normalizedCount: textboxRuntimeNormalizationSummary.normalizedCount
   },
   runtimePathRegistryDiagnostics,
   presentationPolishSummary: {
      mode: presentationPolishSummary.mode,
      applied: presentationPolishSummary.applied,
      styleTokenSetId: presentationPolishSummary.styleTokenSetId,
      archetypesApplied: presentationPolishSummary.archetypesApplied,
      titlePolicy: presentationPolishSummary.titlePolicy,
      effectiveChangeCount: presentationPolishSummary.effectiveChangeCount,
      layoutChangeCount: presentationPolishSummary.layoutChangeCount,
      styleChangeCount: presentationPolishSummary.styleChangeCount,
      noOpReasons: presentationPolishSummary.noOpReasons,
      uxLintSummary: presentationPolishSummary.uxLintSummary
   },
   dvIntelligenceSummary
};

if (traceRequested) {
   response.executionCapabilityTrace = {
      targetVersion: strictResult.targetVersion || selectedTrack.displayVersion,
      compatibilityTarget: versionBundleSelection.selectedCompatibilityTarget || selectedTrack.displayVersion,
      availableTargetVersions: Array.isArray(strictResult.availableTargetVersions)
         ? strictResult.availableTargetVersions
         : versionBundleSelection.availableTargetVersions,
      executionMode: strictResult.executionMode || executionMode,
      reasonForVersionSelection: strictResult.reasonForVersionSelection || reasonForVersionSelection,
      capabilitySource: strictResult.capabilitySource || 'runtime_tool_detection',
      saveToolDetected: strictResult.saveToolDetected,
      exportToolDetected: strictResult.exportToolDetected,
      discoveryMethod: strictResult.discoveryMethod || capabilities.discoveryMethod,
      saveAvailable: strictResult.saveAvailable,
      exportAvailable: strictResult.exportAvailable,
      exportRequested: strictResult.exportRequested
   };
   response.resolutionTrace = strictResult.resolutionTrace || {
      requestedPluginType: requestedPluginTypeForValidationCheck,
      resolvedFamily: resolvedProfiles[0]?.runtimeContractFamily || null,
      scaffoldTemplate: resolvedProfiles[0]?.scaffoldTemplateId || null,
      finalPluginType: resolvedProfiles[0]?.finalPluginType || null,
      fallbackUsed: false,
      reason: 'resolved_by_regenerate_driver'
   };
   response.filterDecisionTrace = adapterProfiling.filterDecisionTrace;
   response.driverTrace = {
      contractVersion: regenerateContract.contractVersion || 'v1',
      adapterContractVersion: adapterContract.contractVersion || 'v1',
      selectedTrackVersion: selectedTrack.displayVersion,
      selectedProjectVersion: selectedTrack.projectVersion,
      availableTargetVersions: versionBundleSelection.availableTargetVersions,
      requestedViewCount: requestedViews.length,
      generationStrategyRequested,
      generationStrategyApplied,
      compositionCoverage,
      unsupportedTopologyReasons,
      requestedFilterMode,
      selectedFilterModeFromTrace,
      effectiveFilterMode: requestedFilterMode === 'filter_viz' ? 'filter_viz' : 'filter_bar',
      requirementsTraceSummary,
      analysisRequirementsPlanningNormalization,
      composeFilterToleranceSummary,
      filterPlanningSummary,
      planningFilterMaterializationSummary,
      planningConsumptionSummary,
      componentGraphSummary,
      planningDataActionSummary,
      fallbackUsageSummary,
      requirementResolutionEvidenceProvided: isPlainObject(requirementsResolutionEvidence),
      criteriaRebindingSummary,
      perViewBindingMaterializationSummary,
      presentationPolishMode,
      presentationPolishTitlePolicy,
      presentationPolishApplied: presentationPolishSummary.applied,
      presentationPolishStyleTokenSetId: presentationPolishSummary.styleTokenSetId,
      presentationPolishArchetypesApplied: presentationPolishSummary.archetypesApplied,
      presentationPolishEffectiveChangeCount: presentationPolishSummary.effectiveChangeCount,
      presentationPolishLayoutChangeCount: presentationPolishSummary.layoutChangeCount,
      presentationPolishStyleChangeCount: presentationPolishSummary.styleChangeCount,
      presentationPolishNoOpReasons: presentationPolishSummary.noOpReasons,
      presentationPolishUxLintSummary: presentationPolishSummary.uxLintSummary,
      visualizationIntelligenceMode,
      dvIntelligenceStatus: dvIntelligenceSummary?.status || null,
      dvIntelligenceOverallScore: dvIntelligenceSummary?.overallScore ?? null,
      dvIntelligenceAudienceLevel: isPlainObject(dvIntelligenceSummary?.audienceLevel)
         ? dvIntelligenceSummary.audienceLevel
         : null,
      textboxRuntimeNormalizationSummary,
      runtimePathRegistryDiagnostics,
      canonicalizeAppliedPatches: Array.isArray(canonicalizeResult.appliedPatches) ? canonicalizeResult.appliedPatches : [],
      vizProfiles: resolvedProfiles
   };
   response.numberFormattingTrace = numberFormattingTrace;
   response.presentationPolishTrace = {
      effectiveChangeCount: presentationPolishSummary.effectiveChangeCount,
      layoutChangeCount: presentationPolishSummary.layoutChangeCount,
      styleChangeCount: presentationPolishSummary.styleChangeCount,
      noOpReasons: presentationPolishSummary.noOpReasons,
      remediationsApplied: presentationPolishSummary.remediationsApplied,
      styleApplications: presentationPolishSummary.styleApplications
   };
   response.dvIntelligenceTrace = dvIntelligenceTrace;
}

process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
