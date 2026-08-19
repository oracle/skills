#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function failUsage(message) {
   process.stderr.write(`${message}\n`);
   process.exit(1);
}

const inputPath = getArg('--input');
if (!inputPath) {
   failUsage(
      'Usage: node .workbook-authoring/tools/modify-workbook.mjs --input <workbook.json> ' +
      '--operation <edit_filter_values_or_operator|add_filter_bar_filter|edit_titles> --source-mode <catalog_read|session_fast_path> ' +
      '--resolved-workbook-id <id> --confirmation-state <confirmed|pending> ' +
      '[--authoring-mode <generate_fresh|modify_existing>] [--edit-spec-file <file> | --edit-spec-json "<json>"] ' +
      '[--resolved-workbook-name "<name>"] [--resolved-workbook-path "<path>"] ' +
      '[--session-artifact-workbook-id <id>] [--session-artifact-path <file>] [--output <file>] [--in-place]'
   );
}

const operation = getArg('--operation');
const sourceMode = getArg('--source-mode');
const resolvedWorkbookID = getArg('--resolved-workbook-id');
const resolvedWorkbookName = getArg('--resolved-workbook-name');
const resolvedWorkbookPath = getArg('--resolved-workbook-path');
const confirmationState = getArg('--confirmation-state');
const sessionArtifactWorkbookID = getArg('--session-artifact-workbook-id');
const sessionArtifactPath = getArg('--session-artifact-path');
const authoringMode = (getArg('--authoring-mode') || 'modify_existing').trim();
const outputPath = getArg('--output');
const inPlace = hasFlag('--in-place');
const editSpecFile = getArg('--edit-spec-file');
const editSpecJson = getArg('--edit-spec-json');

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workbookAuthoringDir = path.resolve(scriptDir, '..');
const contractsDir = path.join(workbookAuthoringDir, 'model');

const editOperationContracts = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'edit-operation-contracts.v1.json'), 'utf8')
);
const filterProfilingContracts = JSON.parse(
   fs.readFileSync(path.join(contractsDir, 'filter-profiling-contracts.v1.json'), 'utf8')
);

const MODIFY_OPERATIONS = {
   EDIT_FILTER_VALUES_OR_OPERATOR: 'edit_filter_values_or_operator',
   ADD_FILTER_BAR_FILTER: 'add_filter_bar_filter',
   EDIT_TITLES: 'edit_titles'
};

function writeJson(file, value) {
   fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function failInputArtifactNotReady(file, reason) {
   process.stderr.write(
      `INPUT_ARTIFACT_NOT_READY: Input artifact '${file}' is not ready (${reason}). ` +
      'Modification likely ran before generation/save completion.\n'
   );
   process.exit(1);
}

function loadWorkbookInput(file) {
   let stats;
   try {
      stats = fs.statSync(file);
   } catch (error) {
      if (error && error.code === 'ENOENT') {
         failInputArtifactNotReady(file, 'file does not exist');
      }
      throw error;
   }
   if (!stats.isFile()) {
      failInputArtifactNotReady(file, 'path is not a file');
   }
   if (stats.size === 0) {
      failInputArtifactNotReady(file, 'file is empty');
   }
   const raw = fs.readFileSync(file, 'utf8');
   if (raw.trim() === '') {
      failInputArtifactNotReady(file, 'file has no JSON content');
   }
   return JSON.parse(raw);
}

function loadEditSpec() {
   if (editSpecFile && editSpecJson) {
      throw new Error('Provide exactly one of --edit-spec-file or --edit-spec-json.');
   }
   if (editSpecFile) {
      const raw = fs.readFileSync(editSpecFile, 'utf8');
      return JSON.parse(raw);
   }
   if (editSpecJson) {
      return JSON.parse(editSpecJson);
   }
   return {};
}

function isPlainObject(value) {
   return value != null && typeof value === 'object' && !Array.isArray(value);
}

function ensureObject(target, key, defaultValue) {
   if (!isPlainObject(target[key])) {
      target[key] = defaultValue;
   }
   return target[key];
}

function normalizeToken(value) {
   return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function inferColumnClass(columnID) {
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

function toTextValues(values) {
   if (!Array.isArray(values)) {
      return [];
   }
   return values
      .map((value) => ({ text: String(value) }))
      .filter((entry) => entry.text.trim() !== '');
}

function getNestedValue(obj, dotPath) {
   const parts = dotPath.split('.');
   let cursor = obj;
   for (const part of parts) {
      if (cursor == null || typeof cursor !== 'object' || !(part in cursor)) {
         return undefined;
      }
      cursor = cursor[part];
   }
   return cursor;
}

function setNestedValue(obj, dotPath, value) {
   const parts = dotPath.split('.');
   let cursor = obj;
   for (let index = 0; index < parts.length - 1; index += 1) {
      const key = parts[index];
      if (!isPlainObject(cursor[key])) {
         cursor[key] = {};
      }
      cursor = cursor[key];
   }
   cursor[parts[parts.length - 1]] = value;
}

function deleteNestedValue(obj, dotPath) {
   const parts = dotPath.split('.');
   let cursor = obj;
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

function getCriteriaColumns(workbook) {
   const columns = workbook?.criteria?.columns?.children;
   return Array.isArray(columns) ? columns : [];
}

function getCanvasViews(workbook) {
   const views = workbook?.views?.children;
   if (!Array.isArray(views)) {
      return [];
   }
   const results = [];
   for (let index = 0; index < views.length; index += 1) {
      const view = views[index];
      if (view?.type === 'saw:canvas' && typeof view?.viewName === 'string') {
         results.push({ view, index, viewName: view.viewName, path: `/views/children/${index}` });
      }
   }
   return results;
}

function getPluginViews(workbook) {
   const views = workbook?.views?.children;
   if (!Array.isArray(views)) {
      return [];
   }
   const results = [];
   for (let index = 0; index < views.length; index += 1) {
      const view = views[index];
      if (view?.type === 'saw:pluginView' && typeof view?.viewName === 'string') {
         results.push({ view, index, viewName: view.viewName, path: `/views/children/${index}` });
      }
   }
   return results;
}

function ensureFilterCollections(workbook) {
   if (!isPlainObject(workbook.filterControlCollections)) {
      workbook.filterControlCollections = {};
   }
   if (!Array.isArray(workbook.filterControlCollections.children)) {
      workbook.filterControlCollections.children = [];
   }
   return workbook.filterControlCollections.children;
}

function findOrCreateCollection(workbook, name, subjectArea, pathsChanged) {
   const collections = ensureFilterCollections(workbook);
   let collectionIndex = collections.findIndex((entry) => entry?.name === name);
   if (collectionIndex === -1) {
      const created = {
         name,
         subjectArea: subjectArea || workbook?.criteria?.subjectArea || null,
         filterControls: {
            children: []
         }
      };
      collections.push(created);
      collectionIndex = collections.length - 1;
      pathsChanged.push('/filterControlCollections/children');
   }
   const collection = collections[collectionIndex];
   if (!isPlainObject(collection.filterControls)) {
      collection.filterControls = { children: [] };
      pathsChanged.push(`/filterControlCollections/children/${collectionIndex}/filterControls`);
   }
   if (!Array.isArray(collection.filterControls.children)) {
      collection.filterControls.children = [];
      pathsChanged.push(`/filterControlCollections/children/${collectionIndex}/filterControls/children`);
   }
   return { collection, collectionIndex };
}

function getFilterControls(workbook) {
   const collections = workbook?.filterControlCollections?.children;
   if (!Array.isArray(collections)) {
      return [];
   }
   const controls = [];
   for (let collectionIndex = 0; collectionIndex < collections.length; collectionIndex += 1) {
      const collection = collections[collectionIndex];
      const controlChildren = collection?.filterControls?.children;
      if (!Array.isArray(controlChildren)) {
         continue;
      }
      for (let controlIndex = 0; controlIndex < controlChildren.length; controlIndex += 1) {
         const control = controlChildren[controlIndex];
         if (!isPlainObject(control)) {
            continue;
         }
         const formulaExpression = control?.formula?.expr?.expression;
         controls.push({
            collectionIndex,
            controlIndex,
            control,
            collectionName: collection?.name || null,
            path: `/filterControlCollections/children/${collectionIndex}/filterControls/children/${controlIndex}`,
            filterID: typeof control?.filterID === 'string' ? control.filterID : null,
            columnID: typeof control?.columnID === 'string' ? control.columnID : null,
            formulaExpression: typeof formulaExpression === 'string' ? formulaExpression : null
         });
      }
   }
   return controls;
}

function findUniqueFilterControl(workbook, selector) {
   const controls = getFilterControls(workbook);
   if (!isPlainObject(selector)) {
      return { errorCode: 'MODIFY_FILTER_SELECTOR_NOT_FOUND', detail: 'selector object is required' };
   }

   let matches = [];
   if (typeof selector.filterID === 'string' && selector.filterID.trim() !== '') {
      matches = controls.filter((entry) => entry.filterID === selector.filterID);
   } else if (typeof selector.columnID === 'string' && selector.columnID.trim() !== '') {
      matches = controls.filter((entry) => entry.columnID === selector.columnID);
   } else if (typeof selector.displayName === 'string' && selector.displayName.trim() !== '') {
      const needle = normalizeToken(selector.displayName);
      matches = controls.filter((entry) => {
         const tokens = [
            normalizeToken(entry.filterID),
            normalizeToken(entry.columnID),
            normalizeToken(entry.formulaExpression)
         ];
         return tokens.some((token) => token && token.includes(needle));
      });
   } else {
      return { errorCode: 'MODIFY_FILTER_SELECTOR_NOT_FOUND', detail: 'selector must include filterID, columnID, or displayName' };
   }

   if (matches.length === 0) {
      return { errorCode: 'MODIFY_FILTER_SELECTOR_NOT_FOUND', detail: 'no filter control matched selector' };
   }
   if (matches.length > 1) {
      return {
         errorCode: 'MODIFY_FILTER_SELECTOR_AMBIGUOUS',
         detail: `selector matched ${matches.length} controls`,
         candidates: matches.map((entry) => ({
            filterID: entry.filterID,
            columnID: entry.columnID,
            collectionName: entry.collectionName,
            path: entry.path
         }))
      };
   }
   return { match: matches[0] };
}

function ensureFilterIDUnique(collection, preferredID) {
   const children = collection?.filterControls?.children || [];
   const normalizedBase = (preferredID && preferredID.trim() !== '') ? preferredID.trim() : 'fc_filter';
   const existing = new Set(children.map((entry) => entry?.filterID).filter((value) => typeof value === 'string'));
   if (!existing.has(normalizedBase)) {
      return normalizedBase;
   }
   let counter = 2;
   while (existing.has(`${normalizedBase}_${counter}`)) {
      counter += 1;
   }
   return `${normalizedBase}_${counter}`;
}

function applyOperationEditFilterValuesOrOperator(workbook, spec, context) {
   const selector = spec?.selector;
   const updates = spec?.set;
   if (!isPlainObject(updates)) {
      context.errors.push({
         code: 'MODIFY_FILTER_MISSING_UPDATE_PAYLOAD',
         message: 'edit_filter_values_or_operator requires edit spec field set{...} with at least one mutation.',
         path: '/spec/set'
      });
      return;
   }
   const hasUpdate =
      typeof updates.operator === 'string' ||
      Array.isArray(updates.defaultValues) ||
      Array.isArray(updates.sourceChoices);
   if (!hasUpdate) {
      context.errors.push({
         code: 'MODIFY_FILTER_MISSING_UPDATE_PAYLOAD',
         message: 'edit_filter_values_or_operator requires one of: set.operator, set.defaultValues, set.sourceChoices.',
         path: '/spec/set'
      });
      return;
   }

   const selected = findUniqueFilterControl(workbook, selector);
   if (!selected.match) {
      context.errors.push({
         code: selected.errorCode,
         message: selected.detail,
         path: '/spec/selector',
         details: selected.candidates || null
      });
      return;
   }

   const target = selected.match.control;
   const targetPath = selected.match.path;

   if (typeof updates.operator === 'string' && updates.operator.trim() !== '') {
      target.filterOperator = { op: updates.operator.trim() };
      context.pathsChanged.push(`${targetPath}/filterOperator/op`);
      context.mutationsApplied.push('edit_filter_values_or_operator:set_filter_operator');
   }

   if (Array.isArray(updates.defaultValues)) {
      const children = toTextValues(updates.defaultValues);
      target.filterControlDefaultValues = {
         type: 'specificValue',
         children
      };
      context.pathsChanged.push(`${targetPath}/filterControlDefaultValues`);
      context.mutationsApplied.push('edit_filter_values_or_operator:set_filter_default_values');
   }

   if (Array.isArray(updates.sourceChoices) || Array.isArray(updates.defaultValues)) {
      const sourceValues = Array.isArray(updates.sourceChoices)
         ? updates.sourceChoices
         : updates.defaultValues;
      const sourceChoices = toTextValues(sourceValues);
      target.filterControlSource = {
         type: 'saw:fcSpecificChoices',
         filterControlChoices: {
            children: sourceChoices.map((entry) => ({ value: entry }))
         }
      };
      context.pathsChanged.push(`${targetPath}/filterControlSource`);
      context.mutationsApplied.push('edit_filter_values_or_operator:set_filter_source_choices');
   }
}

function applyOperationAddFilterBarFilter(workbook, spec, context) {
   const columnID = typeof spec?.columnID === 'string' ? spec.columnID.trim() : '';
   if (!columnID) {
      context.errors.push({
         code: 'MODIFY_FILTER_ADD_COLUMN_MISSING',
         message: 'add_filter_bar_filter requires edit spec field columnID.',
         path: '/spec/columnID'
      });
      return;
   }

   const criteriaColumn = getCriteriaColumns(workbook).find((column) => column?.columnID === columnID);
   if (!criteriaColumn) {
      context.errors.push({
         code: 'MODIFY_FILTER_ADD_CRITERIA_COLUMN_MISSING',
         message: `Column '${columnID}' does not exist in criteria.columns.children.`,
         path: '/criteria/columns/children',
         fixHint: 'Add the criteria column first or choose an existing columnID.'
      });
      return;
   }

   const criteriaFormula = criteriaColumn?.columnFormula?.expr?.expression;
   if (typeof criteriaFormula !== 'string' || criteriaFormula.trim() === '') {
      context.errors.push({
         code: 'MODIFY_FILTER_ADD_CRITERIA_COLUMN_MISSING',
         message: `Column '${columnID}' is missing a formula expression.`,
         path: '/criteria/columns/children'
      });
      return;
   }

   const allCanvasViews = getCanvasViews(workbook);
   let targetCanvasNames = Array.isArray(spec?.targetCanvases)
      ? spec.targetCanvases.filter((entry) => typeof entry === 'string' && entry.trim() !== '').map((entry) => entry.trim())
      : [];
   if (targetCanvasNames.length === 0) {
      targetCanvasNames = allCanvasViews.map((entry) => entry.viewName);
   }
   if (targetCanvasNames.length === 0) {
      context.errors.push({
         code: 'MODIFY_VIEW_NOT_FOUND',
         message: 'No canvas views found to attach filter-bar controls.',
         path: '/views/children'
      });
      return;
   }

   const operatorDefaults = filterProfilingContracts?.decisionRules?.operatorDefaults || {};
   const inferredClass = inferColumnClass(columnID);
   const selectedOperator = (typeof spec?.operator === 'string' && spec.operator.trim() !== '')
      ? spec.operator.trim()
      : (operatorDefaults[inferredClass] || 'in');
   const defaultValues = Array.isArray(spec?.defaultValues) ? spec.defaultValues : [];
   const sourceChoices = Array.isArray(spec?.sourceChoices) ? spec.sourceChoices : defaultValues;
   const subjectArea = workbook?.criteria?.subjectArea || workbook?.datasources?.children?.[0]?.subjectArea || null;
   const preferredFilterID = (typeof spec?.filterID === 'string' && spec.filterID.trim() !== '')
      ? spec.filterID.trim()
      : `fc_filterbar_${columnID}`;

   for (const canvasName of targetCanvasNames) {
      const canvasMeta = allCanvasViews.find((entry) => entry.viewName === canvasName);
      if (!canvasMeta) {
         context.errors.push({
            code: 'MODIFY_VIEW_NOT_FOUND',
            message: `Canvas '${canvasName}' was not found.`,
            path: '/views/children'
         });
         continue;
      }

      let collectionRefName = canvasName;
      if (!isPlainObject(canvasMeta.view.filterControlCollectionRef)) {
         canvasMeta.view.filterControlCollectionRef = { name: canvasName };
         context.pathsChanged.push(`${canvasMeta.path}/filterControlCollectionRef`);
      } else {
         const existingName = typeof canvasMeta.view.filterControlCollectionRef.name === 'string'
            ? canvasMeta.view.filterControlCollectionRef.name.trim()
            : '';
         if (existingName !== '') {
            collectionRefName = existingName;
         } else {
            canvasMeta.view.filterControlCollectionRef.name = canvasName;
            context.pathsChanged.push(`${canvasMeta.path}/filterControlCollectionRef/name`);
         }
      }

      const { collection, collectionIndex } = findOrCreateCollection(workbook, collectionRefName, subjectArea, context.pathsChanged);
      const filterID = ensureFilterIDUnique(collection, preferredFilterID);
      const newControl = {
         type: 'saw:columnFilterControl',
         filterID,
         columnID,
         formula: {
            expr: {
               type: 'sawx:sqlExpression',
               expression: criteriaFormula,
               children: []
            }
         },
         filterOperator: {
            op: selectedOperator
         },
         filterControlConfig: {
            _version: '1.0.11',
            settings: {
               filterModelClassName: 'obitech-listfilter/listfilter.ListFilterModel',
               location: 'filter_bar'
            }
         },
         filterControlDefaultValues: {
            type: 'specificValue',
            children: toTextValues(defaultValues)
         },
         filterControlSource: {
            type: 'saw:fcSpecificChoices',
            filterControlChoices: {
               children: toTextValues(sourceChoices).map((entry) => ({ value: entry }))
            }
         }
      };
      collection.filterControls.children.push(newControl);
      const controlIndex = collection.filterControls.children.length - 1;
      context.pathsChanged.push(`/filterControlCollections/children/${collectionIndex}/filterControls/children/${controlIndex}`);
      context.mutationsApplied.push(`add_filter_bar_filter:add_filter_bar_control:${canvasName}`);
   }
}

function findExistingTitlePath(view, candidates) {
   for (const candidate of candidates) {
      const current = getNestedValue(view, candidate);
      if (typeof current === 'string') {
         return candidate;
      }
   }
   return null;
}

function resolveTitleWritePath(view, candidates, defaultPath, allowCreateAtDefaultPath) {
   const existingTitlePath = findExistingTitlePath(view, candidates);
   if (existingTitlePath) {
      return {
         path: existingTitlePath,
         createdPath: false
      };
   }
   if (allowCreateAtDefaultPath && typeof defaultPath === 'string' && defaultPath.trim() !== '') {
      return {
         path: defaultPath.trim(),
         createdPath: true
      };
   }
   return null;
}

function applyOperationEditTitles(workbook, spec, context) {
   const definition = editOperationContracts?.operationDefinitions?.[MODIFY_OPERATIONS.EDIT_TITLES] || {};
   const canvasCandidates = Array.isArray(definition.canvasTitlePathCandidates)
      ? definition.canvasTitlePathCandidates
      : [];
   const viewCandidates = Array.isArray(definition.viewTitlePathCandidates)
      ? definition.viewTitlePathCandidates
      : [];
   const allowCreateAtDefaultPath = definition.allowCreateAtDefaultPath === true;
   const defaultCanvasTitlePath = typeof definition.defaultCanvasTitlePath === 'string'
      ? definition.defaultCanvasTitlePath
      : null;
   const defaultViewTitlePath = typeof definition.defaultViewTitlePath === 'string'
      ? definition.defaultViewTitlePath
      : null;

   let anyMutation = false;
   const legacyCanvasTitlePath = 'canvasConfig.settings.title';
   const legacyViewTitlePath = 'viewConfig.settings.title';

   if (typeof spec?.workbookTitle === 'string' && spec.workbookTitle.trim() !== '') {
      context.saveNameOverride = spec.workbookTitle.trim();
      context.mutationsApplied.push('edit_titles:set_workbook_save_name_override');
      anyMutation = true;
   }

   const canvasUpdates = Array.isArray(spec?.canvasTitles) ? spec.canvasTitles : [];
   const canvasViews = getCanvasViews(workbook);
   for (const request of canvasUpdates) {
      const targetName = typeof request?.canvasViewName === 'string' ? request.canvasViewName : '';
      const nextTitle = typeof request?.title === 'string' ? request.title : '';
      if (!targetName || !nextTitle) {
         continue;
      }
      const canvasMeta = canvasViews.find((entry) => entry.viewName === targetName);
      if (!canvasMeta) {
         context.errors.push({
            code: 'MODIFY_VIEW_NOT_FOUND',
            message: `Canvas '${targetName}' was not found.`,
            path: '/views/children'
         });
         continue;
      }
      const titlePathResolution = resolveTitleWritePath(
         canvasMeta.view,
         canvasCandidates,
         defaultCanvasTitlePath,
         allowCreateAtDefaultPath
      );
      if (!titlePathResolution) {
         context.errors.push({
            code: 'MODIFY_TITLE_PATH_MISSING',
            message: `Canvas '${targetName}' has no supported existing title path.`,
            path: canvasMeta.path,
            fixHint: 'Use workbook title override or add title path support in contracts.'
         });
         continue;
      }
      const titlePath = titlePathResolution.path;
      setNestedValue(canvasMeta.view, titlePath, nextTitle);
      context.pathsChanged.push(`${canvasMeta.path}/${titlePath.replace(/\./g, '/')}`);
      context.mutationsApplied.push(`edit_titles:set_canvas_title:${targetName}`);
      if (titlePath !== legacyCanvasTitlePath && deleteNestedValue(canvasMeta.view, legacyCanvasTitlePath)) {
         context.pathsChanged.push(`${canvasMeta.path}/${legacyCanvasTitlePath.replace(/\./g, '/')}`);
         context.warnings.push(`Removed legacy unsupported canvas title path '${legacyCanvasTitlePath}' for canvas '${targetName}'.`);
      }
      if (titlePathResolution.createdPath) {
         context.warnings.push(`Created missing canvas title path '${titlePath}' for canvas '${targetName}'.`);
      }
      anyMutation = true;
   }

   const viewUpdates = Array.isArray(spec?.viewTitles) ? spec.viewTitles : [];
   const pluginViews = getPluginViews(workbook);
   for (const request of viewUpdates) {
      const targetName = typeof request?.viewName === 'string' ? request.viewName : '';
      const nextTitle = typeof request?.title === 'string' ? request.title : '';
      if (!targetName || !nextTitle) {
         continue;
      }
      const pluginMeta = pluginViews.find((entry) => entry.viewName === targetName);
      if (!pluginMeta) {
         context.errors.push({
            code: 'MODIFY_VIEW_NOT_FOUND',
            message: `View '${targetName}' was not found.`,
            path: '/views/children'
         });
         continue;
      }
      const titlePathResolution = resolveTitleWritePath(
         pluginMeta.view,
         viewCandidates,
         defaultViewTitlePath,
         allowCreateAtDefaultPath
      );
      if (!titlePathResolution) {
         context.errors.push({
            code: 'MODIFY_TITLE_PATH_MISSING',
            message: `View '${targetName}' has no supported existing title path.`,
            path: pluginMeta.path,
            fixHint: 'Use workbook title override or add title path support in contracts.'
         });
         continue;
      }
      const titlePath = titlePathResolution.path;
      setNestedValue(pluginMeta.view, titlePath, nextTitle);
      context.pathsChanged.push(`${pluginMeta.path}/${titlePath.replace(/\./g, '/')}`);
      context.mutationsApplied.push(`edit_titles:set_view_title:${targetName}`);
      if (titlePath !== legacyViewTitlePath && deleteNestedValue(pluginMeta.view, legacyViewTitlePath)) {
         context.pathsChanged.push(`${pluginMeta.path}/${legacyViewTitlePath.replace(/\./g, '/')}`);
         context.warnings.push(`Removed legacy unsupported view title path '${legacyViewTitlePath}' for view '${targetName}'.`);
      }
      if (titlePathResolution.createdPath) {
         context.warnings.push(`Created missing view title path '${titlePath}' for view '${targetName}'.`);
      }
      anyMutation = true;
   }

   if (!anyMutation) {
      context.errors.push({
         code: 'MODIFY_INVALID_SPEC',
         message: 'edit_titles produced no title mutations. Provide workbookTitle, canvasTitles, or viewTitles.',
         path: '/spec'
      });
   }
}

function buildModifyTrace(context) {
   return {
      requestedOperation: context.requestedOperation,
      resolvedWorkbookTarget: {
         id: context.resolvedWorkbookTarget.id,
         name: context.resolvedWorkbookTarget.name || null,
         path: context.resolvedWorkbookTarget.path || null
      },
      sourceMode: context.sourceMode,
      confirmationState: context.confirmationState,
      mutationsApplied: context.mutationsApplied,
      pathsChanged: context.pathsChanged,
      fallbackUsed: context.warnings.length > 0,
      fallbackReason: context.warnings.length > 0 ? context.warnings.join('; ') : null
   };
}

const result = {
   valid: false,
   authoringMode,
   requestedOperation: operation || null,
   sourceMode: sourceMode || null,
   resolvedWorkbookTarget: {
      id: resolvedWorkbookID || null,
      name: resolvedWorkbookName || null,
      path: resolvedWorkbookPath || null
   },
   confirmationState: confirmationState || null,
   saveNameOverride: null,
   modifyTrace: null,
   mutationsApplied: [],
   pathsChanged: [],
   warnings: [],
   errors: []
};

let workbook;
let editSpec;
try {
   workbook = loadWorkbookInput(inputPath);
} catch (error) {
   process.stderr.write(`INPUT_READ_ERROR: ${error?.message || String(error)}\n`);
   process.exit(1);
}

try {
   editSpec = loadEditSpec();
} catch (error) {
   result.errors.push({
      code: 'MODIFY_INVALID_SPEC',
      message: `Failed to parse edit spec: ${error?.message || String(error)}`,
      path: '/spec'
   });
}

const supportedModes = new Set(Object.keys(editOperationContracts?.authoringModes || {}));
if (!supportedModes.has(authoringMode)) {
   result.errors.push({
      code: 'MODIFY_INVALID_SPEC',
      message: `Unsupported authoring mode '${authoringMode}'.`,
      path: '/authoring-mode'
   });
}

if (authoringMode !== 'modify_existing') {
   result.errors.push({
      code: 'MODIFY_INVALID_SPEC',
      message: `modify-workbook tool only supports authoring mode 'modify_existing' (received '${authoringMode}').`,
      path: '/authoring-mode'
   });
}

const supportedOps = new Set(editOperationContracts?.supportedModifyOperations || []);
if (!operation || !supportedOps.has(operation)) {
   result.errors.push({
      code: 'MODIFY_UNSUPPORTED_OPERATION',
      message: `Operation '${operation || 'null'}' is not supported. Supported operations: ${Array.from(supportedOps).join(', ')}.`,
      path: '/operation'
   });
}

const requiredConfirmationState = editOperationContracts?.confirmationPolicy?.requiredConfirmationState || 'confirmed';
if (!confirmationState || confirmationState !== requiredConfirmationState) {
   result.errors.push({
      code: 'MODIFY_CONFIRMATION_REQUIRED',
      message: `Confirmation state must be '${requiredConfirmationState}' before modify write.`,
      path: '/confirmation-state'
   });
}

if (!resolvedWorkbookID || resolvedWorkbookID.trim() === '') {
   result.errors.push({
      code: 'MODIFY_TARGET_REQUIRED',
      message: 'resolved-workbook-id is required for modify mode.',
      path: '/resolved-workbook-id'
   });
}

const allowedSourceModes = new Set(editOperationContracts?.sourceAcquisitionPolicy?.allowedSourceModes || []);
if (!sourceMode || !allowedSourceModes.has(sourceMode)) {
   result.errors.push({
      code: 'MODIFY_SOURCE_MODE_INVALID',
      message: `source-mode must be one of: ${Array.from(allowedSourceModes).join(', ')}.`,
      path: '/source-mode'
   });
}

if (sourceMode === 'session_fast_path') {
   if (!sessionArtifactPath || !sessionArtifactWorkbookID) {
      result.errors.push({
         code: 'MODIFY_FAST_PATH_MISSING_SESSION_ARTIFACT',
         message: 'session_fast_path requires both session-artifact-path and session-artifact-workbook-id.',
         path: '/source-mode'
      });
   } else {
      if (!fs.existsSync(sessionArtifactPath)) {
         result.errors.push({
            code: 'MODIFY_FAST_PATH_MISSING_SESSION_ARTIFACT',
            message: `Session artifact path '${sessionArtifactPath}' does not exist.`,
            path: '/session-artifact-path'
         });
      }
      if (resolvedWorkbookID && sessionArtifactWorkbookID && resolvedWorkbookID !== sessionArtifactWorkbookID) {
         result.errors.push({
            code: 'MODIFY_FAST_PATH_TARGET_MISMATCH',
            message: `Resolved workbook id '${resolvedWorkbookID}' does not match session artifact workbook id '${sessionArtifactWorkbookID}'.`,
            path: '/session-artifact-workbook-id'
         });
      }
   }
}

if (result.errors.length === 0) {
   const context = {
      requestedOperation: operation,
      sourceMode,
      confirmationState,
      resolvedWorkbookTarget: result.resolvedWorkbookTarget,
      mutationsApplied: result.mutationsApplied,
      pathsChanged: result.pathsChanged,
      warnings: result.warnings,
      errors: result.errors,
      saveNameOverride: null
   };

   if (operation === MODIFY_OPERATIONS.EDIT_FILTER_VALUES_OR_OPERATOR) {
      applyOperationEditFilterValuesOrOperator(workbook, editSpec || {}, context);
   } else if (operation === MODIFY_OPERATIONS.ADD_FILTER_BAR_FILTER) {
      applyOperationAddFilterBarFilter(workbook, editSpec || {}, context);
   } else if (operation === MODIFY_OPERATIONS.EDIT_TITLES) {
      applyOperationEditTitles(workbook, editSpec || {}, context);
   }

   if (context.errors.length === 0) {
      result.modifyTrace = buildModifyTrace(context);
      if (context.saveNameOverride) {
         result.modifyTrace.saveNameOverride = context.saveNameOverride;
      }
      result.saveNameOverride = context.saveNameOverride;
      result.valid = true;
   }
}

if (result.valid) {
   if (inPlace) {
      writeJson(inputPath, workbook);
   }
   if (outputPath) {
      writeJson(outputPath, workbook);
   }
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.valid ? 0 : 2);
