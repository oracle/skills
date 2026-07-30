const DOTTED_COMPONENT_ALIASES = new Map([
  ["facetedSearch.facet", { component: "facet", parent: "region", assumes: ["94=NATIVE_FACETED_SEARCH"] }],
  ["smartFilters.filter", { component: "filter", parent: "region", assumes: ["94=NATIVE_SMART_FILTERS"] }],
  ["region.facetedSearch.child", { component: "facet", parent: "region", assumes: ["94=NATIVE_FACETED_SEARCH"] }],
  ["map.region", { component: "region", assumes: ["94=NATIVE_MAP"] }],
  ["map.layer", { component: "layer" }],
  ["map.layer.source", { component: "layer", group: "source" }],
  ["map.layer.columnMapping", { component: "layer", group: "columnMapping" }],
  ["map.layer.tooltip", { component: "layer", group: "tooltip" }],
  ["map.layer.infoWindow", { component: "layer", group: "infoWindow" }],
  ["map.layer.link", { component: "layer", group: "link" }],
  ["chart.region", { component: "region", assumes: ["94=NATIVE_JET_CHART"] }],
  ["chart.series", { component: "series" }],
  ["chart.series.marker", { component: "series", group: "marker" }],
  ["chart.series.line", { component: "series", group: "line" }],
  ["chart.series.label", { component: "series", group: "label" }],
  ["chart.series.tooltip", { component: "series", group: "tooltip" }],
  ["chart.axis", { component: "axis" }],
  ["chart.axis.x", { component: "axis" }],
  ["chart.axis.y", { component: "axis" }],
  ["chart.axis.y2", { component: "axis" }],
  ["interactiveReport.region", { component: "region", assumes: ["94=NATIVE_IR"] }],
  ["interactiveGrid.region", { component: "region", assumes: ["94=NATIVE_IG"] }],
  ["classicReport.region", { component: "region", assumes: ["94=NATIVE_SQL_REPORT"] }],
  ["form.region", { component: "region", assumes: ["94=NATIVE_FORM"] }],
  ["report.column", { component: "column", parent: "region" }],
  ["report.column.heading", { component: "column", parent: "region", group: "heading" }],
  ["report.column.layout", { component: "column", parent: "region", group: "layout" }],
  ["report.column.source", { component: "column", parent: "region", group: "source" }],
  ["report.column.appearance", { component: "column", parent: "region", group: "appearance" }],
  ["report.column.link", { component: "column", parent: "region", group: "link" }],
  ["pageItem.layout", { component: "pageItem", group: "layout" }],
  ["pageItem.source", { component: "pageItem", group: "source" }],
  ["pageItem.validation", { component: "pageItem", group: "validation" }],
  ["displayOnly.source", { component: "pageItem", group: "source", assumes: ["381=DISPLAY_ONLY"] }]
]);

const COMPILER_METADATA_PROPERTY_ALIASES = new Map([
  ["app.authentication.scheme", "authenticationScheme"]
]);

const APEXLANG_NATIVE_VALUE_ALIASES = new Map([
  ["true", "Y"],
  ["false", "N"],
  ["normal", "NORMAL"],
  ["modalDialog", "MODAL"],
  ["nonModalDialog", "NON_MODAL"],
  ["breadcrumb", "NATIVE_BREADCRUMB"],
  ["staticContent", "NATIVE_STATIC"],
  ["standard", "STANDARD"],
  ["redirectThisApp", "REDIRECT_PAGE"],
  ["facetedSearch", "NATIVE_FACETED_SEARCH"],
  ["smartFilters", "NATIVE_SMART_FILTERS"],
  ["classicReport", "NATIVE_SQL_REPORT"],
  ["interactiveReport", "NATIVE_IR"],
  ["interactiveGrid", "NATIVE_IG"],
  ["form", "NATIVE_FORM"],
  ["map", "NATIVE_MAP"],
  ["chart", "NATIVE_JET_CHART"],
  ["checkboxGroup", "NATIVE_CHECKBOX"],
  ["radioGroup", "NATIVE_RADIOGROUP"],
  ["selectList", "NATIVE_SELECT_LIST"],
  ["search", "NATIVE_SEARCH"],
  ["range", "NATIVE_RANGE"],
  ["displayOnly", "DISPLAY_ONLY"]
]);

const NATIVE_TYPE_FEATURES = new Map([
  ["NATIVE_IR", new Set(["COLUMNS"])],
  ["NATIVE_SQL_REPORT", new Set(["COLUMNS"])],
  ["NATIVE_IG", new Set(["COLUMNS"])],
  ["NATIVE_CHECKBOX", new Set(["VISIBLE", "LOV", "FC_HAS_FEEDBACK", "FC_SHOW_SELECTED_FIRST", "FC_SHOW_MORE_COUNT", "FC_FILTER_VALUES", "FC_LOV_DISPLAY_NULL"])],
  ["NATIVE_RADIOGROUP", new Set(["VISIBLE", "LOV", "FC_HAS_FEEDBACK", "FC_SHOW_SELECTED_FIRST", "FC_SHOW_MORE_COUNT", "FC_FILTER_VALUES", "FC_LOV_DISPLAY_NULL"])],
  ["NATIVE_SELECT_LIST", new Set(["VISIBLE", "LOV", "FC_HAS_FEEDBACK", "FC_FILTER_VALUES", "FC_LOV_DISPLAY_NULL"])],
  ["NATIVE_RANGE", new Set(["FC_HAS_FEEDBACK"])]
]);

export function normalizeSemanticValue(value) {
  const cleaned = String(value ?? "").trim().replace(/^["']|["']$/g, "");
  return APEXLANG_NATIVE_VALUE_ALIASES.get(cleaned) || cleaned;
}

export function lookupNativeTypeFeatures(value) {
  const features = NATIVE_TYPE_FEATURES.get(value);
  return features ? new Set(features) : undefined;
}

export function resolveDottedComponentAlias(args) {
  if (!args.component || !args.component.includes(".")) {
    return;
  }

  const alias = DOTTED_COMPONENT_ALIASES.get(args.component);
  if (!alias) {
    throw new Error(`Unknown dotted component alias: ${args.component}`);
  }

  args.component = alias.component;
  if (!args.group && alias.group) {
    args.group = alias.group;
  }
  if (alias.parent && !args.parent) {
    args.parent = alias.parent;
  }
  if (alias.assumes?.length) {
    const existing = new Set(args.assumes);
    for (const assumption of alias.assumes) {
      if (!existing.has(assumption)) {
        args.assumes.push(assumption);
      }
    }
  }
}

export function parseQueryAssumptions(entries) {
  const byRawKey = new Map();
  const byScopedName = new Map();
  const byPropertyName = new Map();

  for (const entry of entries) {
    const pivot = entry.indexOf("=");
    if (pivot === -1) {
      throw new Error(`Invalid --when expression: ${entry}. Expected group.property=value or property=value`);
    }
    const key = entry.slice(0, pivot).trim();
    const value = entry.slice(pivot + 1).trim();
    if (!key || !value) {
      throw new Error(`Invalid --when expression: ${entry}. Expected non-empty key and value`);
    }
    const normalizedValue = normalizeSemanticValue(value);
    byRawKey.set(key, normalizedValue);
    byScopedName.set(key, normalizedValue);
    const propertyName = key.split(".").at(-1);
    if (!byPropertyName.has(propertyName)) {
      byPropertyName.set(propertyName, []);
    }
    byPropertyName.get(propertyName).push({ key, value: normalizedValue });
  }

  return { byRawKey, byScopedName, byPropertyName };
}

function resolveQueryConditionValue(condition, assumptionIndex) {
  if (condition.propertyId && assumptionIndex.byRawKey.has(condition.propertyId)) {
    return { state: "known", value: assumptionIndex.byRawKey.get(condition.propertyId) };
  }

  const propertyName = condition.propertyName;
  if (!propertyName) {
    return { state: "unknown", reason: "condition has no property name" };
  }

  if (assumptionIndex.byScopedName.has(propertyName)) {
    return { state: "known", value: assumptionIndex.byScopedName.get(propertyName) };
  }

  const matches = assumptionIndex.byPropertyName.get(propertyName) || [];
  if (!matches.length) {
    return { state: "unknown", reason: `no assumption for ${propertyName}` };
  }
  if (matches.length > 1) {
    return {
      state: "unknown",
      reason: `ambiguous assumption for ${propertyName}: ${matches.map((match) => match.key).join(", ")}`
    };
  }
  return { state: "known", value: matches[0].value };
}

function resolveAuditConditionValue(condition, props) {
  if (condition.propertyId && props[condition.propertyId] !== undefined) {
    return { state: "known", value: props[condition.propertyId] };
  }
  if (condition.propertyName && props[condition.propertyName] !== undefined) {
    return { state: "known", value: props[condition.propertyName] };
  }
  return { state: "unknown" };
}

function evaluateConditionLeaf(condition, values, mode) {
  const resolved = mode === "query"
    ? resolveQueryConditionValue(condition, values)
    : resolveAuditConditionValue(condition, values);
  if (resolved.state !== "known") {
    return { state: "unknown", reason: resolved.reason };
  }

  const actual = normalizeSemanticValue(resolved.value);
  const expected = mode === "audit" ? normalizeSemanticValue(condition.value) : condition.value;
  const expectedValues = mode === "audit"
    ? (condition.values || []).map(normalizeSemanticValue)
    : condition.values || [];
  switch (condition.type) {
    case "EQUALS":
      return { state: actual === expected ? "true" : "false" };
    case "NOT_EQUALS":
      return { state: actual !== expected ? "true" : "false" };
    case "IN_LIST":
      return { state: expectedValues.includes(actual) ? "true" : "false" };
    case "NOT_IN_LIST":
      return { state: expectedValues.includes(actual) ? "false" : "true" };
    case "NOT_NULL":
      return { state: actual ? "true" : "false" };
    case "NULL":
      return { state: actual ? "false" : "true" };
    case "STARTS_WITH":
      return { state: actual.startsWith(expected || "") ? "true" : "false" };
    case "STARTS_WITH_ANY":
      return { state: expectedValues.some((value) => actual.startsWith(value)) ? "true" : "false" };
    case "FEATURES": {
      const features = lookupNativeTypeFeatures(actual);
      if (!features) {
        return {
          state: "unknown",
          reason: mode === "query" ? `no feature map for ${actual}` : undefined
        };
      }
      if (expectedValues.every((value) => features.has(value))) {
        return { state: "true" };
      }
      return mode === "audit"
        ? { state: "unknown" }
        : { state: "false" };
    }
    default:
      return {
        state: "unknown",
        reason: mode === "query" ? `unsupported operator ${condition.type}` : undefined
      };
  }
}

function combineConditionResults(operator, results, mode) {
  const states = results.map((result) => result.state);
  const requiresState = mode === "audit";
  if (operator === "AND") {
    if (states.includes("false")) return { state: "false" };
    if ((!requiresState || states.length) && states.every((state) => state === "true")) return { state: "true" };
    return { state: "unknown" };
  }
  if (operator === "OR") {
    if (states.includes("true")) return { state: "true" };
    if ((!requiresState || states.length) && states.every((state) => state === "false")) return { state: "false" };
    return { state: "unknown" };
  }
  return { state: "unknown" };
}

function evaluateCondition(condition, values, mode) {
  if (!condition) {
    return { state: "true" };
  }
  if (condition.conditions) {
    return combineConditionResults(
      condition.operator || "AND",
      condition.conditions.map((child) => evaluateCondition(child, values, mode)),
      mode
    );
  }
  return evaluateConditionLeaf(condition, values, mode);
}

export function evaluateQueryCondition(condition, assumptionIndex) {
  return evaluateCondition(condition, assumptionIndex, "query");
}

export function evaluateAuditCondition(condition, props) {
  return evaluateCondition(condition, props, "audit").state;
}

function filterRecordsByCondition(records, values, conditionKey, mode) {
  const evaluated = records.map((record) => ({
    record,
    state: record[conditionKey]
      ? evaluateCondition(record[conditionKey], values, mode).state
      : "unconditional"
  }));
  const trueMatches = evaluated.filter((entry) => entry.state === "true").map((entry) => entry.record);
  if (trueMatches.length) {
    return trueMatches;
  }
  return evaluated.filter((entry) => entry.state !== "false").map((entry) => entry.record);
}

export function selectQueryComponents(map, args) {
  let matches = map.componentTypes;
  const assumptionIndex = parseQueryAssumptions(args.assumes);

  if (args.componentTypeId) {
    matches = matches.filter((record) => record.componentTypeId === args.componentTypeId);
  }
  if (args.component) {
    matches = matches.filter((record) => record.singular === args.component);
  }
  if (args.parent) {
    matches = matches.filter((record) => record.parentComponentType === args.parent);
  }
  if (args.assumes.length) {
    matches = filterRecordsByCondition(matches, assumptionIndex, "parentDependsOn", "query");
  }
  if (
    args.component &&
    !args.componentTypeId &&
    !args.parent &&
    !args.assumes.length &&
    matches.length > 1
  ) {
    const candidates = matches
      .map((record) => `${record.componentTypeId} parent=${record.parentComponentType || "none"}`)
      .join(", ");
    throw new Error(
      `Ambiguous component '${args.component}'. Add --parent, --component-type-id, or --when assumptions. Candidates: ${candidates}`
    );
  }
  if (args.assumes.length && matches.length > 1 && !args.list) {
    const candidates = matches
      .map((record) => `${record.componentTypeId} parent=${record.parentComponentType || "none"}`)
      .join(", ");
    throw new Error(
      `Ambiguous component '${args.component || "*"}' after evaluating assumptions. Add --parent or --component-type-id. Candidates: ${candidates}`
    );
  }

  return matches.sort((left, right) => left.componentTypeId.localeCompare(right.componentTypeId));
}

export function resolveAuditComponentRecord(map, singular, parentFrame = null) {
  let records = map.componentTypes.filter((record) => record.singular === singular);
  if (parentFrame?.record) {
    records = records.filter((record) => record.parentComponentType === parentFrame.record.singular);
    records = filterRecordsByCondition(records, parentFrame.props || {}, "parentDependsOn", "audit");
  } else if (records.length > 1) {
    records = records.filter((record) => !record.parentComponentType);
  }
  if (records.length === 1) {
    return { record: records[0], failure: "" };
  }
  return { record: null, failure: records.length ? "ambiguous" : "none", candidates: records };
}

export function buildPropertyLookup(record) {
  const lookup = new Map();
  for (const [groupName, props] of Object.entries(record.groups || {})) {
    for (const prop of props) {
      const key = `${groupName}.${prop.propertyName}`;
      if (!lookup.has(key)) {
        lookup.set(key, []);
      }
      lookup.get(key).push(prop);
    }
  }
  return lookup;
}

function compilerMetadataPropertyNames(componentName, groupName, propertyName) {
  const names = [propertyName];
  const scopedKey = groupName
    ? `${componentName}.${groupName}.${propertyName}`
    : `${componentName}.${propertyName}`;
  const alias = COMPILER_METADATA_PROPERTY_ALIASES.get(scopedKey);
  if (alias && !names.includes(alias)) {
    names.push(alias);
  }
  return names;
}

export function resolveAuditProperty({ record, componentName, groupName = "", propertyName, props = {} }) {
  const compilerPropertyNames = compilerMetadataPropertyNames(componentName, groupName, propertyName);
  const candidates = groupName
    ? record.groups[groupName] || []
    : record.properties;
  const property = candidates.find((candidate) => compilerPropertyNames.includes(candidate.propertyName)) || null;
  return {
    property,
    conditionState: property ? evaluateAuditCondition(property.dependsOn, props) : null
  };
}

export function queryPropertyStatus(prop, assumptionIndex) {
  const result = evaluateQueryCondition(prop.dependsOn, assumptionIndex);
  if (result.state === "true") return "active";
  if (result.state === "false") return "inactive";
  return prop.dependsOn ? "conditional" : "active";
}

export function resolveLovValues(prop) {
  if (!prop.lov?.values?.length) {
    return [];
  }
  return prop.lov.values;
}
