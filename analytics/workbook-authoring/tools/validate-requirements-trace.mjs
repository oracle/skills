#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
   RUNTIME_PATH_SIGNAL_TEXTBOX,
   loadRuntimePathRegistry,
   resolveRuntimePathSignal,
   selectSignalTextValue
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
   process.stderr.write(`${message}\n`);
   process.exit(1);
}

function readJson(filePath, label) {
   try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
   } catch (error) {
      fail(`Unable to parse ${label} JSON '${filePath}': ${error?.message || String(error)}`);
   }
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

function normalizeText(value) {
   return toNonEmptyTrimmedString(value)?.toLowerCase() || null;
}

function unescapeQuotedToken(rawValue, quoteToken) {
   const unescapedQuote = quoteToken === '"' ? '\\"' : "\\'";
   return rawValue
      .replaceAll('\\\\', '\\')
      .replaceAll(unescapedQuote, quoteToken);
}

function quoteIdentifier(value) {
   return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function canonicalizeSubjectAreaToken(rawToken) {
   const normalized = toNonEmptyTrimmedString(rawToken);
   if (!normalized) {
      return null;
   }
   if (/^XSA\([^)]*\)$/i.test(normalized)) {
      return normalized;
   }
   if (normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2) {
      const value = unescapeQuotedToken(normalized.slice(1, -1), '"');
      return quoteIdentifier(value);
   }
   if (normalized.startsWith('\'') && normalized.endsWith('\'') && normalized.length >= 2) {
      const value = unescapeQuotedToken(normalized.slice(1, -1), '\'');
      return quoteIdentifier(value);
   }
   return quoteIdentifier(normalized);
}

function canonicalizeIdentifierToken(rawToken) {
   const normalized = toNonEmptyTrimmedString(rawToken);
   if (!normalized) {
      return null;
   }
   return quoteIdentifier(unescapeQuotedToken(normalized, '"'));
}

function parseDirectColumnExpression(expression) {
   const normalized = toNonEmptyTrimmedString(expression);
   if (!normalized) {
      return null;
   }
   const quotedReferenceMatch = normalized.match(
      /^(XSA\([^)]*\)|"(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+'|[^.]+)\."((?:[^"\\]|\\.)+)"\."((?:[^"\\]|\\.)+)"$/i
   );
   if (quotedReferenceMatch) {
      const [, rawSubjectAreaToken, rawTableToken, rawColumnToken] = quotedReferenceMatch;
      const canonicalSubjectArea = canonicalizeSubjectAreaToken(rawSubjectAreaToken);
      const canonicalTable = canonicalizeIdentifierToken(rawTableToken);
      const canonicalColumn = canonicalizeIdentifierToken(rawColumnToken);
      if (!canonicalSubjectArea || !canonicalTable || !canonicalColumn) {
         return null;
      }
      return `${canonicalSubjectArea}.${canonicalTable}.${canonicalColumn}`;
   }
   return null;
}

function collectCriteriaExpressions(workbookJson) {
   const directExpressions = new Set();
   const directExpressionsLower = new Set();
   const expressionsByColumnID = new Map();
   const columns = Array.isArray(workbookJson?.criteria?.columns?.children)
      ? workbookJson.criteria.columns.children
      : [];
   for (const column of columns) {
      const columnID = toNonEmptyTrimmedString(column?.columnID);
      const expr = toNonEmptyTrimmedString(column?.columnFormula?.expr?.expression);
      if (!expr) {
         continue;
      }
      const columnExpressions = new Set([expr, expr.toLowerCase()]);
      directExpressions.add(expr);
      directExpressionsLower.add(expr.toLowerCase());
      const canonicalExpr = parseDirectColumnExpression(expr);
      if (canonicalExpr) {
         directExpressions.add(canonicalExpr);
         directExpressionsLower.add(canonicalExpr.toLowerCase());
         columnExpressions.add(canonicalExpr);
         columnExpressions.add(canonicalExpr.toLowerCase());
      }
      if (columnID) {
         expressionsByColumnID.set(columnID, columnExpressions);
      }
   }
   return {
      directExpressions,
      directExpressionsLower,
      expressionsByColumnID
   };
}

function findColumnIDsForExpression(criteriaExpressionCatalog, expression) {
   const canonical = parseDirectColumnExpression(expression);
   if (!canonical) {
      return new Set();
   }
   const columnIDs = new Set();
   for (const [columnID, expressions] of criteriaExpressionCatalog.expressionsByColumnID.entries()) {
      for (const candidate of expressions) {
         if (parseDirectColumnExpression(candidate) === canonical) {
            columnIDs.add(columnID);
         }
      }
   }
   return columnIDs;
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

function collectEffectiveExpressionsForView(pluginView, criteriaExpressionCatalog) {
   const columnIDs = new Set();
   collectColumnIDsFromValue(pluginView?.dataModels, columnIDs);
   const expressions = new Set();
   for (const columnID of columnIDs) {
      const columnExpressions = criteriaExpressionCatalog.expressionsByColumnID.get(columnID);
      if (!columnExpressions) {
         continue;
      }
      for (const expression of columnExpressions) {
         expressions.add(expression);
      }
   }
   return expressions;
}

function logicalColumnIDs(pluginView, edgeName) {
   const layers = pluginView?.dataModels?.children?.[0]
      ?.logicalDataModel?.settings?.logicalDataModel?.logicalEdges?.[edgeName]?.logicalEdgeLayers;
   return (Array.isArray(layers) ? layers : [])
      .filter((layer) => layer?.type === 'column')
      .map((layer) => toNonEmptyTrimmedString(layer?.columnID))
      .filter(Boolean);
}

function collectRoleColumnIDs(pluginView, role) {
   const pluginType = toNonEmptyTrimmedString(pluginView?.pluginType);
   if (!pluginType || typeof role !== 'string') {
      return null;
   }
   if (pluginType === 'oracle.bi.tech.table' || pluginType === 'oracle.bi.tech.pivot') {
      return null;
   }
   const measureIDs = logicalColumnIDs(pluginView, 'measures');
   const detailIDs = logicalColumnIDs(pluginView, 'detail');
   const colorIDs = logicalColumnIDs(pluginView, 'color');
   if (role === 'measure.primary') {
      return measureIDs.slice(0, 1);
   }
   if (role === 'measure.secondary') {
      return measureIDs.slice(1, 2);
   }
   if (pluginType === 'oracle.bi.tech.chart.scatter') {
      if (role === 'dimension.primary') {
         return detailIDs.slice(0, 1);
      }
      if (role === 'dimension.secondary') {
         return colorIDs.slice(0, 1);
      }
   }
   if (pluginType.startsWith('oracle.bi.tech.chart.')) {
      if (role === 'dimension.primary' || role === 'temporal.primary') {
         return detailIDs.slice(0, 1);
      }
      if (role === 'dimension.secondary') {
         return detailIDs.length > 1 ? detailIDs.slice(1, 2) : colorIDs.slice(0, 1);
      }
   }
   return null;
}

function collectObjectsForColumnIDs(value, columnIDs, parentKey = null, results = []) {
   if (!value || typeof value !== 'object') {
      return results;
   }
   if (Array.isArray(value)) {
      for (const entry of value) {
         collectObjectsForColumnIDs(entry, columnIDs, parentKey, results);
      }
      return results;
   }
   if (columnIDs.has(toNonEmptyTrimmedString(value.columnID))) {
      results.push({ value, parentKey });
   }
   for (const [key, nestedValue] of Object.entries(value)) {
      collectObjectsForColumnIDs(nestedValue, columnIDs, key, results);
   }
   return results;
}

function collectFilterControls(workbookJson) {
   const controls = [];
   const collections = Array.isArray(workbookJson?.filterControlCollections?.children)
      ? workbookJson.filterControlCollections.children
      : [];
   for (const collection of collections) {
      const children = Array.isArray(collection?.filterControls?.children)
         ? collection.filterControls.children
         : [];
      for (const control of children) {
         controls.push({
            collectionName: toNonEmptyTrimmedString(collection?.name),
            control
         });
      }
   }
   return controls;
}

function collectViewFilterCollectionRefCoverage(workbookJson) {
   const coverageByViewName = new Map();
   const layouts = Array.isArray(workbookJson?.layouts?.children) ? workbookJson.layouts.children : [];
   for (const layout of layouts) {
      const cells = Array.isArray(layout?.children) ? layout.children : [];
      for (const cell of cells) {
         const viewName = toNonEmptyTrimmedString(cell?.content?.viewName);
         if (!viewName) {
            continue;
         }
         const coverage = coverageByViewName.get(viewName) || { cellCount: 0, matchingRefCount: 0 };
         coverage.cellCount += 1;
         if (toNonEmptyTrimmedString(cell?.filterControlCollectionRef?.name) === viewName) {
            coverage.matchingRefCount += 1;
         }
         coverageByViewName.set(viewName, coverage);
      }
   }
   return coverageByViewName;
}

function normalizedFilterDefaultValues(filter) {
   const values = Array.isArray(filter?.default) ? filter.default : [filter?.default];
   return ['null', 'notNull'].includes(toNonEmptyTrimmedString(filter?.operator))
      ? []
      : values.map((value) => String(value));
}

function objectContainsSubset(value, expected) {
   if (!isPlainObject(value) || !isPlainObject(expected)) {
      return false;
   }
   return Object.entries(expected).every(([key, expectedValue]) => value[key] === expectedValue);
}

function containsObjectSubset(value, expected) {
   if (!value || typeof value !== 'object') {
      return false;
   }
   if (isPlainObject(value) && objectContainsSubset(value, expected)) {
      return true;
   }
   return Object.values(value).some((nestedValue) => containsObjectSubset(nestedValue, expected));
}

function collectPluginViews(workbookJson, textboxRuntimePathSignal) {
   const views = Array.isArray(workbookJson?.views?.children) ? workbookJson.views.children : [];
   return views
      .filter((view) => isPlainObject(view) && view.type === 'saw:pluginView')
      .map((view, index) => {
         const captionText = toNonEmptyTrimmedString(view?.viewCaption?.caption?.text);
         const textboxText = selectSignalTextValue(view, textboxRuntimePathSignal, { allowLegacyFallback: true }).selectedText;
         return {
            index,
            view,
            viewName: toNonEmptyTrimmedString(view?.viewName) || `plugin_view_${index + 1}`,
            pluginType: toNonEmptyTrimmedString(view?.pluginType) || null,
            titleText: captionText || textboxText || null
         };
      });
}

function classifyFilterOutcome(filter) {
   const token = normalizeText(
      filter?.planningOutcome
      || filter?.status
      || filter?.resolution
      || filter?.disposition
   );
   if (token === 'considered_not_grounded') {
      return 'considered_not_grounded';
   }
   if (token === 'rejected_conflict') {
      return 'rejected_conflict';
   }
   if (token === 'rejected_missing_field') {
      return 'rejected_missing_field';
   }
   return 'applied';
}

const requestPathArg = getArg('--request');
if (!requestPathArg) {
   fail('Usage: node validate-requirements-trace.mjs --request <trace-request.json>');
}

const requestPath = path.resolve(requestPathArg);
if (!fs.existsSync(requestPath)) {
   fail(`Trace request file does not exist: ${requestPath}`);
}

const traceRequest = readJson(requestPath, 'trace request');
if (!isPlainObject(traceRequest)) {
   fail('Trace request must be a JSON object.');
}

const workbookPath = toNonEmptyTrimmedString(traceRequest.workbookPath);
if (!workbookPath) {
   fail('trace request workbookPath is required.');
}
const resolvedWorkbookPath = path.resolve(workbookPath);
if (!fs.existsSync(resolvedWorkbookPath)) {
   fail(`Workbook file does not exist: ${resolvedWorkbookPath}`);
}
const workbookJson = readJson(resolvedWorkbookPath, 'workbook');

const analysisShape = isPlainObject(traceRequest.analysisShape) ? traceRequest.analysisShape : null;
const analysisRequirements = isPlainObject(traceRequest.analysisRequirements) ? traceRequest.analysisRequirements : null;
const generationStrategyApplied = toNonEmptyTrimmedString(traceRequest.generationStrategyApplied) || 'unknown';
const viewAssignments = Array.isArray(traceRequest.viewAssignments) ? traceRequest.viewAssignments : [];
const runtimePathRegistry = loadRuntimePathRegistry({
   registryPath: getArg('--runtime-path-registry') || null,
   targetVersion: toNonEmptyTrimmedString(traceRequest.targetVersion)
});
const textboxRuntimePathSignal = resolveRuntimePathSignal(runtimePathRegistry, RUNTIME_PATH_SIGNAL_TEXTBOX).signal;

const issues = [];
let issueCounter = 0;
function addIssue(id, message, severity, contextPath = null) {
   issueCounter += 1;
   issues.push({
      id,
      order: issueCounter,
      message,
      path: contextPath,
      severity
   });
}

function addMismatch(id, message, contextPath = null) {
   addIssue(id, message, 'error', contextPath);
}

function addWarning(id, message, contextPath = null) {
   addIssue(id, message, 'warning', contextPath);
}

const criteriaExpressionCatalog = collectCriteriaExpressions(workbookJson);
const pluginViews = collectPluginViews(workbookJson, textboxRuntimePathSignal);
const filterControls = collectFilterControls(workbookJson);
const viewFilterCollectionRefCoverage = collectViewFilterCollectionRefCoverage(workbookJson);
const canvasFilterCollectionRefs = new Set(
   (Array.isArray(workbookJson?.views?.children) ? workbookJson.views.children : [])
      .filter((view) => view?.type === 'saw:canvas')
      .map((view) => toNonEmptyTrimmedString(view?.filterControlCollectionRef?.name))
      .filter(Boolean)
);
const reportFilterCollectionRef = toNonEmptyTrimmedString(workbookJson?.filterControlCollectionRef?.name);
const requestedViewToViewName = new Map();
for (const assignment of viewAssignments) {
   const requestedViewID = toNonEmptyTrimmedString(assignment?.requestedViewID);
   const viewName = toNonEmptyTrimmedString(assignment?.viewName);
   if (requestedViewID && viewName && !requestedViewToViewName.has(requestedViewID)) {
      requestedViewToViewName.set(requestedViewID, viewName);
   }
}

const counts = {
   requiredBindingCount: 0,
   resolvedBindingCount: 0,
   requiredCalculationCount: 0,
   resolvedCalculationCount: 0,
   requiredFilterCount: 0,
   appliedFilterCount: 0,
   consideredNotGroundedFilterCount: 0,
   rejectedConflictFilterCount: 0,
   rejectedMissingFieldFilterCount: 0
};

if (generationStrategyApplied === 'compose_ootb' && !analysisRequirements) {
   addMismatch('REQ_MISSING_APPROVED_ARTIFACT', 'compose_ootb requires analysisRequirements for traceability validation.', 'analysisRequirements');
}

if (analysisRequirements) {
   const requirementCanvases = Array.isArray(analysisRequirements.canvases) ? analysisRequirements.canvases : [];
   if (requirementCanvases.length === 0) {
      addMismatch('REQ_CANVASES_EMPTY', 'analysisRequirements.canvases must not be empty.', 'analysisRequirements.canvases');
   }

   const analysisShapeCanvasViewIndex = new Map();
   const shapeCanvases = Array.isArray(analysisShape?.canvases) ? analysisShape.canvases : [];
   for (const canvas of shapeCanvases) {
      const canvasID = toNonEmptyTrimmedString(canvas?.id);
      if (!canvasID) {
         continue;
      }
      const views = Array.isArray(canvas?.views) ? canvas.views : [];
      analysisShapeCanvasViewIndex.set(
         canvasID,
         new Set(views.map((view) => toNonEmptyTrimmedString(view?.id)).filter(Boolean))
      );
   }

   for (let canvasIndex = 0; canvasIndex < requirementCanvases.length; canvasIndex += 1) {
      const canvas = requirementCanvases[canvasIndex];
      const canvasID = toNonEmptyTrimmedString(canvas?.id);
      const canvasPath = `analysisRequirements.canvases[${canvasIndex}]`;
      if (!canvasID) {
         addMismatch('REQ_CANVAS_ID_MISSING', 'Canvas id is required.', `${canvasPath}.id`);
         continue;
      }
      if (!analysisShapeCanvasViewIndex.has(canvasID)) {
         addMismatch('REQ_CANVAS_NOT_IN_ANALYSIS_SHAPE', `Canvas '${canvasID}' is not present in analysisShape.`, `${canvasPath}.id`);
      }
      const views = Array.isArray(canvas?.views) ? canvas.views : [];
      for (let viewIndex = 0; viewIndex < views.length; viewIndex += 1) {
         const view = views[viewIndex];
         const viewID = toNonEmptyTrimmedString(view?.id);
         const viewPath = `${canvasPath}.views[${viewIndex}]`;
         if (!viewID) {
            addMismatch('REQ_VIEW_ID_MISSING', 'View id is required.', `${viewPath}.id`);
            continue;
         }
         const analysisShapeViews = analysisShapeCanvasViewIndex.get(canvasID);
         if (analysisShapeViews && !analysisShapeViews.has(viewID)) {
            addMismatch('REQ_VIEW_NOT_IN_ANALYSIS_SHAPE', `View '${viewID}' in canvas '${canvasID}' is not present in analysisShape.`, `${viewPath}.id`);
         }

         const bindings = isPlainObject(view?.bindings) ? view.bindings : null;
         if (!bindings || Object.keys(bindings).length === 0) {
            addMismatch('REQ_BINDINGS_MISSING', `View '${viewID}' must include at least one binding.`, `${viewPath}.bindings`);
         } else {
            for (const [role, binding] of Object.entries(bindings)) {
               const rolePath = `${viewPath}.bindings.${role}`;
               const expression = toNonEmptyTrimmedString(binding) || toNonEmptyTrimmedString(binding?.expression);
               counts.requiredBindingCount += 1;
               if (!expression) {
                  addMismatch('REQ_BINDING_EXPRESSION_MISSING', `Binding '${role}' in view '${viewID}' is missing expression.`, rolePath);
                  continue;
               }
               const parsedDirect = parseDirectColumnExpression(expression);
               if (!parsedDirect) {
                  addMismatch('REQ_BINDING_EXPRESSION_INVALID', `Binding '${role}' in view '${viewID}' is not a direct subjectArea.table.column expression.`, rolePath);
                  continue;
               }
               if (criteriaExpressionCatalog.directExpressions.has(parsedDirect)
                  || criteriaExpressionCatalog.directExpressionsLower.has(parsedDirect.toLowerCase())) {
                  counts.resolvedBindingCount += 1;
               } else {
                  addMismatch('REQ_BINDING_NOT_IN_CRITERIA', `Binding '${role}' expression in view '${viewID}' is missing from workbook criteria columns.`, rolePath);
                  continue;
               }

               const requestedViewName = requestedViewToViewName.get(viewID);
               const targetView = requestedViewName
                  ? pluginViews.find((entry) => entry.viewName === requestedViewName)
                  : null;
               if (!targetView) {
                  addMismatch(
                     'REQ_VIEW_ASSIGNMENT_MISSING',
                     `View '${viewID}' has binding '${role}' but no generated view assignment was available for effective-binding validation.`,
                     rolePath
                  );
                  continue;
               }

               const effectiveExpressions = collectEffectiveExpressionsForView(targetView.view, criteriaExpressionCatalog);
               const hasEffectiveBinding = effectiveExpressions.has(parsedDirect)
                  || effectiveExpressions.has(parsedDirect.toLowerCase());
               if (!hasEffectiveBinding) {
                  const message = `Binding '${role}' in requested view '${viewID}' resolves to '${parsedDirect}', ` +
                     `but generated view '${targetView.viewName}' does not bind that criteria expression.`;
                  addMismatch('REQ_VIEW_EFFECTIVE_BINDING_MISMATCH', message, rolePath);
               }
               const targetColumnIDs = findColumnIDsForExpression(criteriaExpressionCatalog, parsedDirect);
               const roleColumnIDs = collectRoleColumnIDs(targetView.view, role);
               if (Array.isArray(roleColumnIDs)
                  && !roleColumnIDs.some((columnID) => targetColumnIDs.has(columnID))) {
                  addMismatch(
                     'REQ_VIEW_ROLE_BINDING_MISMATCH',
                     `Binding '${role}' in requested view '${viewID}' resolves to '${parsedDirect}', but generated view `
                        + `'${targetView.viewName}' assigns [${roleColumnIDs.join(', ') || 'none'}] to that role.`,
                     rolePath
                  );
               }
               const materializedColumnObjects = collectObjectsForColumnIDs(targetView.view?.dataModels, targetColumnIDs);
               const requiredAggregation = toNonEmptyTrimmedString(binding?.aggregation);
               if (requiredAggregation
                  && !materializedColumnObjects.some((entry) => entry.value?.aggRule === requiredAggregation)) {
                  addMismatch(
                     'REQ_BINDING_AGGREGATION_MISMATCH',
                     `Binding '${role}' in requested view '${viewID}' requires aggregation '${requiredAggregation}', but it is not persisted on the generated data-model layers.`,
                     `${rolePath}.aggregation`
                  );
               }
               if (isPlainObject(binding?.format)
                  && !containsObjectSubset(targetView.view?.viewConfig, binding.format)) {
                  addMismatch(
                     'REQ_BINDING_FORMAT_MISMATCH',
                     `Binding '${role}' in requested view '${viewID}' requires an explicit number format that is not persisted in the generated view configuration.`,
                     `${rolePath}.format`
                  );
               }
            }
         }

         const pivotTopology = isPlainObject(view?.pivotTopology) ? view.pivotTopology : null;
         if (pivotTopology) {
            const bindingExpressions = new Set(
               Object.values(bindings || {})
                  .map((binding) => parseDirectColumnExpression(
                     toNonEmptyTrimmedString(binding) || toNonEmptyTrimmedString(binding?.expression)
                  ))
                  .filter(Boolean)
                  .map((expression) => expression.toLowerCase())
            );
            const requestedViewName = requestedViewToViewName.get(viewID);
            const targetView = requestedViewName
               ? pluginViews.find((entry) => entry.viewName === requestedViewName)
               : null;
            const pivotLogicalEdges = targetView?.view?.dataModels?.children?.[0]
               ?.logicalDataModel?.settings?.logicalDataModel?.logicalEdges || {};
            const generatedEdgeExpressions = (logicalEdgeName) => {
               const layers = Array.isArray(pivotLogicalEdges?.[logicalEdgeName]?.logicalEdgeLayers)
                  ? pivotLogicalEdges[logicalEdgeName].logicalEdgeLayers
                  : [];
               return layers
                  .filter((layer) => layer?.type === 'column' && typeof layer?.columnID === 'string')
                  .map((layer) => {
                     const expressions = criteriaExpressionCatalog.expressionsByColumnID.get(layer.columnID) || new Set();
                     for (const expressionValue of expressions) {
                        const canonical = parseDirectColumnExpression(expressionValue);
                        if (canonical) {
                           return canonical;
                        }
                     }
                     return null;
                  })
                  .filter(Boolean);
            };
            const logicalEdgeByTopologyEdge = {
               rows: 'row',
               columns: 'col',
               measures: 'measures'
            };
            for (const edgeName of ['rows', 'columns', 'measures']) {
               const entries = Array.isArray(pivotTopology[edgeName]) ? pivotTopology[edgeName] : [];
               const requestedExpressions = [];
               let allExpressionsValid = true;
               for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
                  const topologyPath = `${viewPath}.pivotTopology.${edgeName}[${entryIndex}]`;
                  const expression = toNonEmptyTrimmedString(entries[entryIndex]?.expression);
                  const parsedDirect = parseDirectColumnExpression(expression);
                  if (!parsedDirect) {
                     allExpressionsValid = false;
                     addMismatch(
                        'REQ_PIVOT_TOPOLOGY_EXPRESSION_INVALID',
                        `Pivot ${edgeName}[${entryIndex}] in view '${viewID}' is not a direct subjectArea.table.column expression.`,
                        topologyPath
                     );
                     continue;
                  }
                  requestedExpressions.push(parsedDirect);
                  if (targetView) {
                     const targetColumnIDs = findColumnIDsForExpression(criteriaExpressionCatalog, parsedDirect);
                     const materializedColumnObjects = collectObjectsForColumnIDs(targetView.view?.dataModels, targetColumnIDs);
                     const requiredAggregation = toNonEmptyTrimmedString(entries[entryIndex]?.aggregation);
                     if (requiredAggregation
                        && !materializedColumnObjects.some((entry) => entry.value?.aggRule === requiredAggregation)) {
                        addMismatch(
                           'REQ_PIVOT_TOPOLOGY_AGGREGATION_MISMATCH',
                           `Pivot ${edgeName}[${entryIndex}] in view '${viewID}' requires aggregation '${requiredAggregation}', but it is not persisted.`,
                           `${topologyPath}.aggregation`
                        );
                     }
                     if (isPlainObject(entries[entryIndex]?.format)
                        && !containsObjectSubset(targetView.view?.viewConfig, entries[entryIndex].format)) {
                        addMismatch(
                           'REQ_PIVOT_TOPOLOGY_FORMAT_MISMATCH',
                           `Pivot ${edgeName}[${entryIndex}] in view '${viewID}' requires a number format that is not persisted.`,
                           `${topologyPath}.format`
                        );
                     }
                  }
                  if (bindingExpressions.has(parsedDirect.toLowerCase())) {
                     continue;
                  }
                  counts.requiredBindingCount += 1;
                  if (!(criteriaExpressionCatalog.directExpressions.has(parsedDirect)
                     || criteriaExpressionCatalog.directExpressionsLower.has(parsedDirect.toLowerCase()))) {
                     addMismatch(
                        'REQ_PIVOT_TOPOLOGY_NOT_IN_CRITERIA',
                        `Pivot ${edgeName}[${entryIndex}] expression in view '${viewID}' is missing from workbook criteria columns.`,
                        topologyPath
                     );
                     continue;
                  }
                  counts.resolvedBindingCount += 1;
               }
               if (!targetView) {
                  addMismatch(
                     'REQ_VIEW_ASSIGNMENT_MISSING',
                     `Pivot view '${viewID}' has ordered ${edgeName} bindings but no generated view assignment was available for topology validation.`,
                     `${viewPath}.pivotTopology.${edgeName}`
                  );
                  continue;
               }
               const actualExpressions = generatedEdgeExpressions(logicalEdgeByTopologyEdge[edgeName]);
               const topologyMatches = allExpressionsValid
                  && requestedExpressions.length === actualExpressions.length
                  && requestedExpressions.every((expressionValue, index) => expressionValue === actualExpressions[index]);
               if (!topologyMatches) {
                  addMismatch(
                     'REQ_PIVOT_TOPOLOGY_BINDING_MISMATCH',
                     `Pivot ${edgeName} in requested view '${viewID}' must match generated view '${targetView.viewName}' in the same order. ` +
                        `Requested [${requestedExpressions.join(', ')}], generated [${actualExpressions.join(', ')}].`,
                     `${viewPath}.pivotTopology.${edgeName}`
                  );
               }
            }
         }

         const tableTopology = isPlainObject(view?.tableTopology) ? view.tableTopology : null;
         if (tableTopology) {
            const bindingExpressions = new Set(
               Object.values(bindings || {})
                  .map((binding) => parseDirectColumnExpression(
                     toNonEmptyTrimmedString(binding) || toNonEmptyTrimmedString(binding?.expression)
                  ))
                  .filter(Boolean)
                  .map((expression) => expression.toLowerCase())
            );
            const requestedViewName = requestedViewToViewName.get(viewID);
            const targetView = requestedViewName
               ? pluginViews.find((entry) => entry.viewName === requestedViewName)
               : null;
            const entries = Array.isArray(tableTopology.columns) ? tableTopology.columns : [];
            const requestedExpressions = [];
            let allExpressionsValid = 0 < entries.length;
            for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
               const topologyPath = `${viewPath}.tableTopology.columns[${entryIndex}]`;
               const expression = toNonEmptyTrimmedString(entries[entryIndex]?.expression);
               const parsedDirect = parseDirectColumnExpression(expression);
               if (!parsedDirect) {
                  allExpressionsValid = false;
                  addMismatch(
                     'REQ_TABLE_TOPOLOGY_EXPRESSION_INVALID',
                     `Table columns[${entryIndex}] in view '${viewID}' is not a direct subjectArea.table.column expression.`,
                     topologyPath
                  );
                  continue;
               }
               requestedExpressions.push(parsedDirect);
               if (targetView) {
                  const targetColumnIDs = findColumnIDsForExpression(criteriaExpressionCatalog, parsedDirect);
                  const materializedColumnObjects = collectObjectsForColumnIDs(targetView.view?.dataModels, targetColumnIDs);
                  const requiredAggregation = toNonEmptyTrimmedString(entries[entryIndex]?.aggregation);
                  if (requiredAggregation
                     && !materializedColumnObjects.some((entry) => entry.value?.aggRule === requiredAggregation)) {
                     addMismatch(
                        'REQ_TABLE_TOPOLOGY_AGGREGATION_MISMATCH',
                        `Table columns[${entryIndex}] in view '${viewID}' requires aggregation '${requiredAggregation}', but it is not persisted.`,
                        `${topologyPath}.aggregation`
                     );
                  }
                  if (isPlainObject(entries[entryIndex]?.format)
                     && !containsObjectSubset(targetView.view?.viewConfig, entries[entryIndex].format)) {
                     addMismatch(
                        'REQ_TABLE_TOPOLOGY_FORMAT_MISMATCH',
                        `Table columns[${entryIndex}] in view '${viewID}' requires a number format that is not persisted.`,
                        `${topologyPath}.format`
                     );
                  }
               }
               if (bindingExpressions.has(parsedDirect.toLowerCase())) {
                  continue;
               }
               counts.requiredBindingCount += 1;
               if (!(criteriaExpressionCatalog.directExpressions.has(parsedDirect)
                  || criteriaExpressionCatalog.directExpressionsLower.has(parsedDirect.toLowerCase()))) {
                  addMismatch(
                     'REQ_TABLE_TOPOLOGY_NOT_IN_CRITERIA',
                     `Table columns[${entryIndex}] expression in view '${viewID}' is missing from workbook criteria columns.`,
                     topologyPath
                  );
                  continue;
               }
               counts.resolvedBindingCount += 1;
            }
            if (!targetView) {
               addMismatch(
                  'REQ_VIEW_ASSIGNMENT_MISSING',
                  `Table view '${viewID}' has ordered column bindings but no generated view assignment was available for topology validation.`,
                  `${viewPath}.tableTopology.columns`
               );
            } else {
               const logicalRows = targetView?.view?.dataModels?.children?.[0]
                  ?.logicalDataModel?.settings?.logicalDataModel?.logicalEdges?.row?.logicalEdgeLayers;
               const actualExpressions = (Array.isArray(logicalRows) ? logicalRows : [])
                  .filter((layer) => layer?.type === 'column' && typeof layer?.columnID === 'string')
                  .map((layer) => {
                     const expressions = criteriaExpressionCatalog.expressionsByColumnID.get(layer.columnID) || new Set();
                     for (const expressionValue of expressions) {
                        const canonical = parseDirectColumnExpression(expressionValue);
                        if (canonical) {
                           return canonical;
                        }
                     }
                     return null;
                  })
                  .filter(Boolean);
               const topologyMatches = allExpressionsValid
                  && requestedExpressions.length === actualExpressions.length
                  && requestedExpressions.every((expressionValue, index) => expressionValue === actualExpressions[index]);
               if (!topologyMatches) {
                  addMismatch(
                     'REQ_TABLE_TOPOLOGY_BINDING_MISMATCH',
                     `Table columns in requested view '${viewID}' must match generated view '${targetView.viewName}' in the same order. ` +
                        `Requested [${requestedExpressions.join(', ')}], generated [${actualExpressions.join(', ')}].`,
                     `${viewPath}.tableTopology.columns`
                  );
               }
            }
         }

         const calculations = Array.isArray(view?.calculations) ? view.calculations : [];
         for (let calculationIndex = 0; calculationIndex < calculations.length; calculationIndex += 1) {
            const calculation = calculations[calculationIndex];
            const calcPath = `${viewPath}.calculations[${calculationIndex}]`;
            const calcExpression = toNonEmptyTrimmedString(calculation)
               || toNonEmptyTrimmedString(calculation?.expression)
               || toNonEmptyTrimmedString(calculation?.formula)
               || null;
            counts.requiredCalculationCount += 1;
            if (!calcExpression) {
               addMismatch('REQ_CALC_EXPRESSION_MISSING', `Calculation ${calculationIndex + 1} in view '${viewID}' is missing expression/formula.`, calcPath);
               continue;
            }
            const calcNormalized = calcExpression.toLowerCase();
            const resolved = criteriaExpressionCatalog.directExpressionsLower.has(calcNormalized)
               || Array.from(criteriaExpressionCatalog.directExpressionsLower)
                  .some((value) => value.includes(calcNormalized) || calcNormalized.includes(value));
            if (resolved) {
               counts.resolvedCalculationCount += 1;
            } else {
               addMismatch('REQ_CALC_NOT_IN_CRITERIA', `Calculation ${calculationIndex + 1} in view '${viewID}' is not traceable to workbook criteria expressions.`, calcPath);
            }
         }

         const filters = Array.isArray(view?.filters) ? view.filters : [];
         for (let filterIndex = 0; filterIndex < filters.length; filterIndex += 1) {
            const filter = filters[filterIndex];
            const filterPath = `${viewPath}.filters[${filterIndex}]`;
            counts.requiredFilterCount += 1;
            if (!isPlainObject(filter)) {
               addMismatch('REQ_FILTER_INVALID', `Filter ${filterIndex + 1} in view '${viewID}' must be an object.`, filterPath);
               continue;
            }
            if (!toNonEmptyTrimmedString(filter.scope)
               || !toNonEmptyTrimmedString(filter.operator)
               || filter.default === undefined) {
               addMismatch('REQ_FILTER_FIELDS_MISSING', `Filter ${filterIndex + 1} in view '${viewID}' must define scope, operator, and default.`, filterPath);
            }
            const outcome = classifyFilterOutcome(filter);
            if (outcome === 'considered_not_grounded') {
               counts.consideredNotGroundedFilterCount += 1;
            } else if (outcome === 'rejected_conflict') {
               counts.rejectedConflictFilterCount += 1;
            } else if (outcome === 'rejected_missing_field') {
               counts.rejectedMissingFieldFilterCount += 1;
            } else {
               const requestedViewName = requestedViewToViewName.get(viewID);
               const plannedColumnID = toNonEmptyTrimmedString(filter.columnID);
               let plannedExpression = parseDirectColumnExpression(filter.expression);
               if (!plannedExpression && plannedColumnID) {
                  const expressions = criteriaExpressionCatalog.expressionsByColumnID.get(plannedColumnID) || new Set();
                  for (const candidate of expressions) {
                     plannedExpression = parseDirectColumnExpression(candidate);
                     if (plannedExpression) {
                        break;
                     }
                  }
               }
               const expectedDefaults = normalizedFilterDefaultValues(filter);
               const scope = normalizeText(filter.scope);
               const matchingControl = filterControls.find((entry) => {
                  const controlExpression = parseDirectColumnExpression(entry.control?.formula?.expr?.expression);
                  const actualDefaults = Array.isArray(entry.control?.filterControlDefaultValues?.children)
                     ? entry.control.filterControlDefaultValues.children.map((value) => String(value?.text))
                     : [];
                  const scopeMatches = scope === 'global'
                     ? entry.collectionName === 'report' && reportFilterCollectionRef === 'report'
                     : (scope === 'view'
                        ? entry.collectionName === requestedViewName
                           && viewFilterCollectionRefCoverage.get(requestedViewName)?.cellCount > 0
                           && viewFilterCollectionRefCoverage.get(requestedViewName)?.matchingRefCount
                              === viewFilterCollectionRefCoverage.get(requestedViewName)?.cellCount
                        : canvasFilterCollectionRefs.has(entry.collectionName));
                  return Boolean(plannedExpression)
                     && controlExpression === plannedExpression
                     && entry.control?.filterOperator?.op === filter.operator
                     && entry.control?.filterControlConfig?.settings?.location === filter.location
                     && scopeMatches
                     && actualDefaults.length === expectedDefaults.length
                     && actualDefaults.every((value, index) => value === expectedDefaults[index]);
               });
               if (!matchingControl) {
                  addMismatch(
                     'REQ_FILTER_NOT_MATERIALIZED',
                     `Filter ${filterIndex + 1} in view '${viewID}' is marked applied but no matching persisted filter control was found.`,
                     filterPath
                  );
               } else {
                  counts.appliedFilterCount += 1;
               }
            }
         }

         const requestedViewName = requestedViewToViewName.get(viewID);
         const targetView = requestedViewName
            ? pluginViews.find((entry) => entry.viewName === requestedViewName)
            : null;
         const requiredTitle = toNonEmptyTrimmedString(view?.labels?.title);
         if (requiredTitle) {
            const normalizedRequiredTitle = normalizeText(requiredTitle);
            const foundTitle = targetView
               ? normalizeText(targetView.titleText) === normalizedRequiredTitle
               : pluginViews.some((entry) => normalizeText(entry.titleText) === normalizedRequiredTitle);
            if (!foundTitle) {
               addMismatch('REQ_LABEL_TITLE_MISSING', `Title '${requiredTitle}' for view '${viewID}' is not present in generated plugin view caption/text.`, `${viewPath}.labels.title`);
            }
         }

         const sorts = Array.isArray(view?.sort) ? view.sort : [];
         for (let sortIndex = 0; sortIndex < sorts.length; sortIndex += 1) {
            const sort = sorts[sortIndex];
            const sortPath = `${viewPath}.sort[${sortIndex}]`;
            const expression = parseDirectColumnExpression(sort?.expression);
            const targetColumnIDs = findColumnIDsForExpression(criteriaExpressionCatalog, expression);
            const materializedColumnObjects = targetView
               ? collectObjectsForColumnIDs(targetView.view?.dataModels, targetColumnIDs)
               : [];
            const foundSort = materializedColumnObjects.some((entry) =>
               entry.parentKey === 'logicalEdgeLayers'
               && entry.value?.columnSort?.direction === sort?.direction
               && entry.value?.columnSort?.order === sortIndex
            );
            if (!foundSort) {
               addMismatch(
                  'REQ_SORT_NOT_MATERIALIZED',
                  `Sort ${sortIndex + 1} in requested view '${viewID}' is not persisted on the generated logical data model.`,
                  sortPath
               );
            }
         }
      }
   }
}

const placeholderPattern = /(placeholder|todo|tbd|__)/i;
const criteriaColumns = Array.isArray(workbookJson?.criteria?.columns?.children)
   ? workbookJson.criteria.columns.children
   : [];
for (let columnIndex = 0; columnIndex < criteriaColumns.length; columnIndex += 1) {
   const heading = toNonEmptyTrimmedString(criteriaColumns[columnIndex]?.columnHeading?.caption?.text);
   if (heading && placeholderPattern.test(heading)) {
      addMismatch(
         'REQ_PLACEHOLDER_HEADING',
         `Placeholder-like heading detected in criteria column '${heading}'.`,
         `workbook.criteria.columns.children[${columnIndex}].columnHeading.caption.text`
      );
      break;
   }
}

const blockingMismatches = issues.filter((issue) => issue.severity !== 'warning');
const warnings = issues.filter((issue) => issue.severity === 'warning');

const result = {
   valid: blockingMismatches.length === 0,
   mismatchCount: blockingMismatches.length,
   blockingMismatchCount: blockingMismatches.length,
   warningCount: warnings.length,
   mismatches: blockingMismatches,
   blockingMismatches,
   warnings,
   counts
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
