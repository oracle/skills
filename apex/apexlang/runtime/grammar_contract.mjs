/**
 * Build compact, task-scoped contracts from the canonical APEXlang EBNF.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const CONTRACT_SCHEMA_VERSION = 3;
const DEFAULT_CORE_PRODUCTIONS = [
  "nl",
  "blank-lines",
  "ws",
  "required-ws",
  "indent",
  "line-end",
  "value",
  "string-like-value",
  "component-id",
  "identifier",
  "identifier-start",
  "identifier-rest",
  "string",
  "multiline-string",
  "reference",
  "boolean",
  "number",
  "array",
  "comment"
];
const COMPILER_VALUE_FALLBACKS = new Map([
  ["normal", "NORMAL"],
  ["modalDialog", "MODAL"],
  ["nonModalDialog", "NON_MODAL"],
  ["breadcrumb", "NATIVE_BREADCRUMB"],
  ["staticContent", "NATIVE_STATIC"],
  ["classicReport", "NATIVE_SQL_REPORT"],
  ["interactiveReport", "NATIVE_IR"],
  ["form", "NATIVE_FORM"],
  ["standard", "STANDARD"],
  ["redirectThisApp", "REDIRECT_PAGE"],
  ["true", "Y"],
  ["false", "N"]
]);
const INSTANCE_POLICY_RULES = [
  {
    id: "VALIDATION_CANONICAL_STRUCTURE_001",
    family: "page.validation",
    declarationIdPrefix: "VAL_",
    forbidBlocks: ["config"],
    requiredBlocks: ["execution", "validation", "error"],
    requiredProperties: ["execution.sequence", "error.errorMessage"],
    bindings: [
      {
        whenAssumptionEndsWith: "validation.item",
        target: "error.associatedItem",
        transform: "reference"
      }
    ]
  }
];

function resolveLayout() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const packagedRoot = path.resolve(moduleDir, "..");
  if (existsSync(path.join(packagedRoot, "assets", "grammar", "apexlang.ebnf"))) {
    return {
      packaged: true,
      root: packagedRoot,
      grammarPath: path.join(packagedRoot, "assets", "grammar", "apexlang.ebnf"),
      semanticRulesPath: path.join(packagedRoot, "assets", "contracts", "grammar-semantic-rules.json")
    };
  }
  const repoRoot = path.resolve(moduleDir, "../../../..");
  return {
    packaged: false,
    root: repoRoot,
    grammarPath: path.join(repoRoot, "references/policies", "apexlang", "grammar", "apexlang.ebnf"),
    semanticRulesPath: path.join(repoRoot, "skills", "apexlang", "contracts", "grammar-semantic-rules.json")
  };
}

async function ensureDir(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

function parseProductions(grammarText) {
  const productions = new Map();
  let currentName = "";
  let currentLines = [];

  const flush = () => {
    if (currentName) {
      productions.set(currentName, currentLines.join("\n").trimEnd());
    }
  };

  for (const line of grammarText.split(/\r?\n/)) {
    const match = line.match(/^<([^>]+)>\s*::=/);
    if (match) {
      flush();
      currentName = match[1];
      currentLines = [line];
    } else if (currentName) {
      currentLines.push(line);
    }
  }
  flush();
  return productions;
}

function referencedProductions(definition) {
  return [...definition.matchAll(/<([^>]+)>/g)].map((match) => match[1]);
}

function isChildSelector(name) {
  return name.endsWith("-child-component");
}

function isGroupSelector(name) {
  return name.endsWith("-group-block");
}

function selectorOptions(name, definition) {
  return [...new Set(referencedProductions(definition).filter((reference) => reference !== name))];
}

function productionClosure(productions, roots, groups, coreProductions) {
  const selectedRoots = new Set(roots);
  const selectedGroups = new Set(groups);
  const visited = new Set();
  const pending = [...coreProductions, ...roots];
  const allowedChildren = {};
  const allowedGroups = {};

  while (pending.length > 0) {
    const name = pending.pop();
    if (visited.has(name)) {
      continue;
    }
    const definition = productions.get(name);
    if (!definition) {
      continue;
    }
    visited.add(name);

    const references = referencedProductions(definition).filter((reference) => reference !== name);
    if (isChildSelector(name)) {
      allowedChildren[name] = selectorOptions(name, definition);
      for (const reference of references) {
        if (selectedRoots.has(reference)) {
          pending.push(reference);
        }
      }
      continue;
    }
    if (isGroupSelector(name)) {
      allowedGroups[name] = selectorOptions(name, definition);
      for (const reference of references) {
        const groupSelected = [...selectedGroups].some((group) => reference === group || reference.endsWith(`-${group}`));
        if (groupSelected) {
          pending.push(reference);
        }
      }
      continue;
    }
    pending.push(...references);
  }

  return {
    names: [...visited].sort(),
    allowedChildren,
    allowedGroups
  };
}

function normalizeComponents(components) {
  return [...new Set(components.flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean))].sort();
}

function normalizeChildren(children, requestedComponents) {
  const values = normalizeComponents(children || []);
  for (const value of values) {
    const [parent, child, ...extra] = value.split(".");
    if (!parent || !child || extra.length > 0 || !requestedComponents.includes(parent)) {
      throw new Error(`Invalid child selector '${value}'; expected <requested-component>.<child>`);
    }
  }
  return values;
}

function normalizeInstances(values, requestedChildren) {
  const bySelector = new Map();
  for (const rawValue of values.flatMap((value) => Array.isArray(value) ? value : [value])) {
    const text = String(rawValue).trim();
    if (!text) continue;
    const match = text.match(/^([A-Za-z][A-Za-z0-9]*)\.([A-Za-z][A-Za-z0-9]*)\[([^\]]+)\]\.([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)?)=(.+)$/);
    if (!match) {
      throw new Error(`Invalid --instance condition '${text}'; expected parent.child[id].[group.]property=value`);
    }
    const [, parent, child, rawId, propertyPath, rawConditionValue] = match;
    const family = `${parent}.${child}`;
    if (!requestedChildren.includes(family)) {
      throw new Error(`Instance condition '${text}' requires --children ${family}`);
    }
    const id = rawId.trim();
    const value = rawConditionValue.trim();
    if (!id || !value) throw new Error(`Invalid --instance condition '${text}'`);
    const segments = propertyPath.split(".");
    const condition = {
      selector: `${family}[${id}].${propertyPath}`,
      family,
      parent,
      child,
      id,
      group: segments.length === 2 ? segments[0] : null,
      property: segments.at(-1),
      value
    };
    const existing = bySelector.get(condition.selector);
    if (existing && existing.value !== value) {
      throw new Error(`Conflicting --instance conditions for ${condition.selector}`);
    }
    bySelector.set(condition.selector, condition);
  }
  return [...bySelector.values()].sort((left, right) => left.selector.localeCompare(right.selector));
}

function normalizeConditions(values, requestedComponents) {
  const componentOrder = [...requestedComponents].sort((left, right) => right.length - left.length);
  const bySelector = new Map();
  for (const rawValue of values.flatMap((value) => Array.isArray(value) ? value : [value])) {
    const text = String(rawValue).trim();
    if (!text) {
      continue;
    }
    const separator = text.indexOf("=");
    if (separator <= 0 || separator === text.length - 1) {
      throw new Error(`Invalid --when condition: ${text}; expected component[.group].property=value`);
    }
    const selector = text.slice(0, separator).trim();
    const value = text.slice(separator + 1).trim();
    const component = componentOrder.find((name) => selector === name || selector.startsWith(`${name}.`));
    if (!component) {
      throw new Error(`Condition selector must start with a requested component: ${selector}`);
    }
    const segments = selector.slice(component.length + 1).split(".").filter(Boolean);
    if (segments.length < 1 || segments.length > 2) {
      throw new Error(`Invalid condition selector: ${selector}; expected component[.group].property`);
    }
    const condition = {
      selector,
      component,
      group: segments.length === 2 ? segments[0] : null,
      property: segments.at(-1),
      value
    };
    const existing = bySelector.get(selector);
    if (existing && existing.value !== value) {
      throw new Error(`Conflicting --when conditions for ${selector}: ${existing.value}, ${value}`);
    }
    bySelector.set(selector, condition);
  }
  return [...bySelector.values()].sort((left, right) => left.selector.localeCompare(right.selector));
}

function normalizedToken(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function compilerConditionState(condition, assumptions) {
  if (!condition) return "active";
  if (condition.conditions) {
    const states = condition.conditions.map((child) => compilerConditionState(child, assumptions));
    if ((condition.operator || "AND") === "AND") {
      if (states.includes("inactive")) return "inactive";
      return states.every((state) => state === "active") ? "active" : "conditional";
    }
    if (states.includes("active")) return "active";
    return states.every((state) => state === "inactive") ? "inactive" : "conditional";
  }
  const actual = assumptions.get(String(condition.propertyId || ""))
    ?? assumptions.get(condition.propertyName || "");
  if (actual === undefined) return "conditional";
  const expected = String(condition.value ?? "");
  const values = (condition.values || []).map(String);
  switch (condition.type) {
    case "EQUALS": return actual === expected ? "active" : "inactive";
    case "NOT_EQUALS": return actual !== expected ? "active" : "inactive";
    case "IN_LIST": return values.includes(actual) ? "active" : "inactive";
    case "NOT_IN_LIST": return values.includes(actual) ? "inactive" : "active";
    case "NOT_NULL": return actual ? "active" : "inactive";
    case "NULL": return actual ? "inactive" : "active";
    case "STARTS_WITH": return actual.startsWith(expected) ? "active" : "inactive";
    case "NOT_STARTS_WITH": return actual.startsWith(expected) ? "inactive" : "active";
    default: return "conditional";
  }
}

function compilerRecordProperties(record) {
  return [
    ...(record.properties || []),
    ...Object.values(record.groups || {}).flat()
  ];
}

function grammarComponentKeyword(definition) {
  return definition?.match(/::=\s*"([A-Za-z][A-Za-z0-9]*)"/)?.[1] || null;
}

function grammarVariantProperties(productions, root) {
  const names = [...productions.keys()].filter((name) => name === root || name.startsWith(`${root}-`));
  return new Set(names.flatMap((name) =>
    [...productions.get(name).matchAll(/"([A-Za-z][A-Za-z0-9]*)"\s+":"\s+<ws>/g)].map((match) => match[1])));
}

function grammarPropertyGroup(productions, component, property) {
  const directName = `${component}-direct-property`;
  if (productions.get(directName)?.includes(`"${property}"`)) return null;
  const prefix = `${component}-`;
  const suffix = "-property";
  const matches = [...productions.entries()]
    .filter(([name, definition]) => name.startsWith(prefix)
      && name.endsWith(suffix)
      && definition.includes(`"${property}"`))
    .map(([name]) => name.slice(prefix.length, -suffix.length));
  return matches.length === 1 ? matches[0] : null;
}

function matchGrammarVariant(productions, alternatives, record) {
  const compilerProperties = new Set(compilerRecordProperties(record).map(({ propertyName }) => propertyName));
  const scored = alternatives.map((production) => {
    const grammarProperties = grammarVariantProperties(productions, production);
    const overlap = [...grammarProperties].filter((property) => compilerProperties.has(property)).length;
    const union = new Set([...grammarProperties, ...compilerProperties]).size;
    return { production, overlap, similarity: union ? overlap / union : 0 };
  }).sort((left, right) => right.similarity - left.similarity || right.overlap - left.overlap);
  if (!scored[0] || scored[0].overlap === 0) return null;
  if (scored[1] && scored[0].similarity === scored[1].similarity && scored[0].overlap === scored[1].overlap) return null;
  return scored[0];
}

function resolveCompilerChildren({ map, productions, requestedChildren, assumptionIndex }) {
  const resolved = [];
  const childrenByParent = new Map();
  for (const selector of requestedChildren) {
    const [parent, child] = selector.split(".");
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, new Set());
    childrenByParent.get(parent).add(child);
  }
  for (const [parent, selectedChildren] of childrenByParent) {
    const selector = productions.get(`${parent}-child-component`);
    if (!selector) continue;
    const alternatives = selectorOptions(`${parent}-child-component`, selector);
    const byKeyword = new Map();
    for (const production of alternatives) {
      const keyword = grammarComponentKeyword(productions.get(production));
      if (!keyword) continue;
      if (!byKeyword.has(keyword)) byKeyword.set(keyword, []);
      byKeyword.get(keyword).push(production);
    }
    for (const [child, grammarAlternatives] of byKeyword) {
      if (!selectedChildren.has(child)) continue;
      const candidates = map.componentTypes.filter((record) =>
        record.singular === child && record.parentComponentType === parent);
      if (candidates.length === 0) continue;
      const classified = candidates.map((record) => ({
        record,
        state: compilerConditionState(record.parentDependsOn, assumptionIndex)
      })).filter(({ state }) => state !== "inactive");
      const active = classified.filter(({ state }) => state === "active");
      const selectable = active.length > 0 ? active : classified;
      if (selectable.length !== 1) continue;
      const selected = selectable[0];
      const grammar = matchGrammarVariant(productions, grammarAlternatives, selected.record);
      if (!grammar) continue;
      resolved.push({
        parent,
        child,
        compilerComponentTypeId: selected.record.componentTypeId,
        compilerState: selected.state,
        grammarProduction: grammar.production,
        grammarSimilarity: Number(grammar.similarity.toFixed(4)),
        declaration: `${child} (`,
        componentIdPolicy: grammarAlternatives.length > 1 ? "omit-to-disambiguate-variant" : "optional",
        record: selected.record
      });
    }
  }
  return resolved;
}

function buildInstanceContracts(resolvedChildren, requestedInstances, requestedGroups, baseAssumptionIndex) {
  const families = new Map(resolvedChildren.map((child) => [`${child.parent}.${child.child}`, child]));
  const grouped = new Map();
  for (const condition of requestedInstances) {
    const key = `${condition.family}[${condition.id}]`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(condition);
  }
  const contracts = [];
  for (const [selector, conditions] of grouped) {
    const resolved = families.get(conditions[0].family);
    if (!resolved) {
      throw new Error(`Instance '${selector}' has no unambiguous resolved child record`);
    }
    const assumptionIndex = new Map([...baseAssumptionIndex]
      .filter(([key]) => /^\d+$/.test(String(key))));
    const assumptions = [];
    const assumedGroups = new Set();
    for (const condition of conditions) {
      const found = findCompilerProperty(resolved.record, condition);
      if (!found) {
        throw new Error(`Instance property '${condition.selector}' is not present in compiler metadata`);
      }
      const value = compilerValue(found.property, condition.value);
      const path = [selector, found.group, found.property.propertyName].filter(Boolean).join(".");
      assumptions.push({
        path,
        dslValue: condition.value,
        compilerPropertyId: found.property.propertyId || null,
        compilerValue: value
      });
      if (found.group) assumedGroups.add(found.group);
      assumptionIndex.set(found.property.propertyName, value);
      if (found.property.propertyId) assumptionIndex.set(String(found.property.propertyId), value);
    }
    const groupedCandidates = Object.entries(resolved.record.groups || {})
      .filter(([group]) => requestedGroups.includes(group))
      .flatMap(([group, items]) => items.map((property) => ({ group, property })));
    const groupedIds = new Set(groupedCandidates.map(({ property }) => String(property.propertyId || "")));
    const candidates = [
      ...groupedCandidates,
      ...(resolved.record.properties || [])
        .filter((property) => !groupedIds.has(String(property.propertyId || "")))
        .map((property) => ({ group: null, property }))
    ];
    const propertyStates = candidates.map(({ group, property }) => ({
      group,
      property,
      state: property.dependsOn
        ? compilerConditionState(property.dependsOn, assumptionIndex)
        : "active"
    }));
    const requiredActiveProperties = propertyStates
      .filter(({ property, state }) => property.required && state === "active")
      .map(({ group, property }) => ({
        path: [selector, group, property.propertyName].filter(Boolean).join("."),
        compilerPropertyId: property.propertyId || null
      }))
      .sort((left, right) => left.path.localeCompare(right.path));
    const omitProperties = [...new Set(propertyStates
      .filter(({ group, property, state }) => group && assumedGroups.has(group)
        && property.required && state === "inactive")
      .map(({ group, property }) =>
        [selector, group, property.propertyName].filter(Boolean).join(".")))]
      .sort((left, right) => left.localeCompare(right));
    const repositoryPolicies = INSTANCE_POLICY_RULES
      .filter((rule) => rule.family === conditions[0].family)
      .map((rule) => {
        const bindings = rule.bindings.flatMap((binding) => {
          const assumption = assumptions.find(({ path }) => path.endsWith(binding.whenAssumptionEndsWith));
          if (!assumption) return [];
          return [{
            source: assumption.path,
            target: `${selector}.${binding.target}`,
            value: binding.transform === "reference" ? `@${assumption.dslValue}` : assumption.dslValue
          }];
        });
        return {
          ruleId: rule.id,
          declarationId: rule.declarationIdPrefix
            ? `${rule.declarationIdPrefix}${conditions[0].id}`.toUpperCase()
            : null,
          exactDeclaration: rule.declarationIdPrefix
            ? `${resolved.child} ${`${rule.declarationIdPrefix}${conditions[0].id}`.toUpperCase()} (`
            : resolved.declaration,
          requiredBlocks: rule.requiredBlocks,
          forbidBlocks: rule.forbidBlocks || [],
          requiredProperties: rule.requiredProperties.map((property) => `${selector}.${property}`),
          bindings
        };
      });
    contracts.push({
      selector,
      family: conditions[0].family,
      id: conditions[0].id,
      compilerComponentTypeId: resolved.compilerComponentTypeId,
      grammarProduction: resolved.grammarProduction,
      declaration: resolved.declaration,
      componentIdPolicy: resolved.componentIdPolicy,
      assumptions,
      requiredActiveProperties,
      omitProperties,
      repositoryPolicies
    });
  }
  return contracts.sort((left, right) => left.selector.localeCompare(right.selector));
}

function findCompilerProperty(record, condition) {
  const candidates = [
    ...(record.properties || []).map((property) => ({ group: null, property })),
    ...Object.entries(record.groups || {}).flatMap(([group, properties]) =>
      properties.map((property) => ({ group, property })))
  ].filter(({ property }) => property.propertyName === condition.property);
  if (condition.group) {
    return candidates.find(({ group }) => group === condition.group) || null;
  }
  return candidates.find(({ group }) => group === null) || candidates[0] || null;
}

function compilerValue(property, dslValue) {
  const values = property.lov?.values || [];
  const match = values.find(({ name, returnValue }) =>
    normalizedToken(name) === normalizedToken(dslValue)
    || normalizedToken(returnValue) === normalizedToken(dslValue));
  return match?.returnValue || COMPILER_VALUE_FALLBACKS.get(dslValue) || dslValue;
}

function dslValue(property, value) {
  const match = (property?.lov?.values || []).find((item) => String(item.returnValue) === String(value));
  if (match?.name) return match.name;
  if (value === "Y") return true;
  if (value === "N") return false;
  const fallback = [...COMPILER_VALUE_FALLBACKS].find(([, compilerToken]) => compilerToken === value);
  return fallback?.[0] || value;
}

function conditionLeaves(condition) {
  if (!condition) return [];
  if (condition.conditions) return condition.conditions.flatMap(conditionLeaves);
  return [condition];
}

function activationCondition(condition, siblingProperties) {
  if (condition.conditions) {
    const conditions = condition.conditions.map((child) => activationCondition(child, siblingProperties));
    if (conditions.some((item) => !item)) return null;
    return { operator: String(condition.operator || "AND").toLowerCase(), conditions };
  }
  const dependency = siblingProperties.find((property) =>
    String(property.propertyId || "") === String(condition.propertyId || "")
    || property.propertyName === condition.propertyName);
  if (!dependency) return null;
  const operator = {
    EQUALS: "equals",
    NOT_EQUALS: "notEquals",
    IN_LIST: "in",
    NOT_IN_LIST: "notIn",
    NULL: "isNull",
    NOT_NULL: "isNotNull"
  }[condition.type];
  if (!operator) return null;
  const result = {
    property: dependency.propertyName,
    operator,
    missingAllowed: condition.hasToExist === false
  };
  if (condition.value !== undefined) result.value = dslValue(dependency, condition.value);
  if (condition.values) result.values = condition.values.map((value) => dslValue(dependency, value));
  return result;
}

async function buildCompilerContract(layout, productions, requestedComponents, requestedChildren, requestedInstances, requestedGroups, selectedConditions) {
  const toolRoot = layout.packaged
    ? path.join(layout.root, "tools")
    : path.join(layout.root, "references/policies", "apexlang", "compiler-prop-map");
  try {
    const [{ buildOracleNormalizedMap, readOracleRuntimeMetadata, ORACLE_NORMALIZER_VERSION }, { resolveOracleRuntime }] = await Promise.all([
      import(pathToFileURL(path.join(toolRoot, "query-valid-props-normalize.mjs")).href),
      import(pathToFileURL(path.join(toolRoot, "query-valid-props-runtime.mjs")).href)
    ]);
    const runtime = resolveOracleRuntime();
    const { metadata, buildId, metadataHash } = readOracleRuntimeMetadata(runtime.compilerJarPath);
    const map = buildOracleNormalizedMap({
      metadata,
      compilerJarPath: runtime.compilerJarPath,
      oracleHome: runtime.oracleHome,
      source: runtime.source
    });
    const records = new Map(requestedComponents.map((component) => [
      component,
      map.componentTypes.find((record) => record.singular === component && !record.parentComponentType)
        || map.componentTypes.find((record) => record.singular === component)
    ]));
    const assumptions = [];
    const assumptionIndex = new Map();
    for (const condition of selectedConditions) {
      const record = records.get(condition.component);
      const found = record ? findCompilerProperty(record, condition) : null;
      if (!found) continue;
      const value = compilerValue(found.property, condition.value);
      const grammarGroup = condition.group
        || grammarPropertyGroup(productions, condition.component, found.property.propertyName);
      assumptions.push({
        selector: condition.selector,
        path: [condition.component, grammarGroup, found.property.propertyName].filter(Boolean).join("."),
        dslValue: condition.value,
        compilerPropertyId: found.property.propertyId || null,
        compilerValue: value
      });
      assumptionIndex.set(found.property.propertyName, value);
      if (found.property.propertyId) assumptionIndex.set(String(found.property.propertyId), value);
    }
    const resolvedChildren = resolveCompilerChildren({
      map,
      productions,
      requestedChildren,
      assumptionIndex
    });
    const instanceContracts = buildInstanceContracts(
      resolvedChildren,
      requestedInstances,
      requestedGroups,
      assumptionIndex
    );
    for (const child of resolvedChildren) {
      records.set(`${child.parent}.${child.child}`, child.record);
    }
    const properties = [];
    const activationRules = [];
    for (const [component, record] of records) {
      if (!record) continue;
      const groupedCandidates = Object.entries(record.groups || {})
          .filter(([group]) => requestedGroups.includes(group))
          .flatMap(([group, items]) => items.map((property) => ({ group, property })));
      for (const [group, items] of Object.entries(record.groups || {})) {
        if (!requestedGroups.includes(group)) continue;
        for (const property of items) {
          if (!property.required || !property.dependsOn) continue;
          if (compilerConditionState(property.dependsOn, assumptionIndex) !== "conditional") continue;
          const leaves = conditionLeaves(property.dependsOn);
          if (!leaves.some((leaf) => leaf.hasToExist === false)) continue;
          const siblingOnly = leaves.length > 0 && leaves.every((leaf) => items.some((candidate) =>
            String(candidate.propertyId || "") === String(leaf.propertyId || "")
            || candidate.propertyName === leaf.propertyName));
          if (!siblingOnly) continue;
          const activeWhen = activationCondition(property.dependsOn, items);
          if (!activeWhen) continue;
          activationRules.push({
            path: `${component}.${group}.${property.propertyName}`,
            activeWhen,
            otherwise: "omit"
          });
        }
      }
      const groupedIds = new Set(groupedCandidates.map(({ property }) => String(property.propertyId || "")));
      const candidates = [
        ...groupedCandidates,
        ...(record.properties || [])
          .filter((property) => !groupedIds.has(String(property.propertyId || "")))
          .map((property) => ({ group: null, property }))
      ];
      for (const { group, property } of candidates) {
        if (!property.required) continue;
        const state = property.dependsOn
          ? compilerConditionState(property.dependsOn, assumptionIndex)
          : "active";
        if (state !== "active") continue;
        properties.push({
          path: [component, group, property.propertyName].filter(Boolean).join("."),
          compilerPropertyId: property.propertyId || null
        });
      }
    }
    const uniqueProperties = [...new Map(properties.map((item) => [item.path, item])).values()]
      .sort((left, right) => left.path.localeCompare(right.path));
    return {
      status: "resolved",
      source: "compiler-runtime-metadata",
      buildID: buildId,
      metadataHash,
      normalizerVersion: ORACLE_NORMALIZER_VERSION,
      assumptions,
      requiredActiveProperties: uniqueProperties,
      resolvedChildren: resolvedChildren.map(({ record: _record, ...child }) => child),
      instances: instanceContracts,
      activationRules: [...new Map(activationRules.map((item) => [`${item.path}:${JSON.stringify(item.activeWhen)}`, item])).values()]
        .sort((left, right) => left.path.localeCompare(right.path))
    };
  } catch (error) {
    return {
      status: "unavailable",
      reason: error instanceof Error ? error.message : String(error),
      assumptions: [],
      requiredActiveProperties: [],
      resolvedChildren: [],
      instances: [],
      activationRules: []
    };
  }
}

function productionContext(name, requestedComponents) {
  const component = [...requestedComponents]
    .sort((left, right) => right.length - left.length)
    .find((candidate) => name === candidate || name.startsWith(`${candidate}-`));
  if (!component) {
    return null;
  }
  const suffix = name.slice(component.length + 1);
  const group = suffix.endsWith("-property") ? suffix.slice(0, -"-property".length) : null;
  return { component, group };
}

function narrowDefinition(name, definition, conditions, requestedComponents) {
  const context = productionContext(name, requestedComponents);
  if (!context || !name.endsWith("-property")) {
    return { definition, narrowedEnums: 0 };
  }
  let narrowedEnums = 0;
  const nextDefinition = definition.split("\n").map((line) => {
    const propertyMatch = line.match(/"([^"]+)"\s*":"\s*<ws>\s*\(([^)]+)\)/);
    if (!propertyMatch) {
      return line;
    }
    const property = propertyMatch[1];
    const condition = conditions.find((item) => item.component === context.component
      && item.property === property
      && (!item.group || item.group === context.group || context.group === "direct"));
    if (!condition) {
      return line;
    }
    const acceptedValues = [...propertyMatch[2].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    const selected = acceptedValues.find((value) => normalizedToken(value) === normalizedToken(condition.value));
    if (!selected) {
      return line;
    }
    narrowedEnums += 1;
    return line.replace(`(${propertyMatch[2]})`, `"${selected}"`);
  }).join("\n");
  return { definition: nextDefinition, narrowedEnums };
}

function selectSemanticRules(catalog, requestedComponents, selectedConditions) {
  const componentSet = new Set(requestedComponents);
  const conditionSet = new Set(selectedConditions.map(({ selector, value }) => `${selector}=${value}`));
  return catalog.rules.filter(({ match = {} }) =>
    (match.components || []).every((component) => componentSet.has(component))
    && (match.conditions || []).every((condition) => conditionSet.has(condition))
  ).map(({ match: _match, ...rule }) => rule);
}

function generationChecklist(rules) {
  return rules.map(({ id, level, scope, check = null }) => ({ ruleId: id, level, scope, check }));
}

function componentBlocks(text, component) {
  const pattern = new RegExp(`^([ \\t]*)${component}\\b[^\\n]*\\(\\s*$([\\s\\S]*?)^\\1\\)\\s*$`, "gm");
  return [...text.matchAll(pattern)].map((match) => match[0]);
}

function cleanScalar(value) {
  return String(value).trim().replace(/^"|"$/g, "");
}

function checkCanonicalPageIdentity(artifactPath, text) {
  const filenameMatch = path.basename(artifactPath).match(/^p(\d{5})-([a-z0-9-]+)\.apx$/i);
  if (!filenameMatch) {
    return { passed: false, message: "Page artifact filename must use pNNNNN-<slug>.apx." };
  }
  const expectedPage = Number.parseInt(filenameMatch[1], 10);
  const expectedAlias = filenameMatch[2].toUpperCase();
  const declarationMatch = text.match(/^page\s+(\d+)\s*\(/m);
  const pagePropertyMatch = text.match(/^\s+page:\s*(\d+)\s*$/m);
  const aliasMatch = text.match(/^\s+alias:\s*(.+?)\s*$/m);
  const actualAlias = aliasMatch ? cleanScalar(aliasMatch[1]) : "";
  const passed = Number.parseInt(declarationMatch?.[1] || "", 10) === expectedPage
    && Number.parseInt(pagePropertyMatch?.[1] || "", 10) === expectedPage
    && actualAlias === expectedAlias;
  return {
    passed,
    message: passed
      ? `Page declaration, page property, and alias match ${path.basename(artifactPath)}.`
      : `Expected page ${expectedPage} and alias ${expectedAlias} from ${path.basename(artifactPath)}.`
  };
}

function checkNormalStaticContentSlot(_artifactPath, text) {
  const staticRegions = componentBlocks(text, "region").filter((block) => /^\s*type:\s*staticContent\s*$/m.test(block));
  const passed = staticRegions.length > 0 && staticRegions.every((block) => /^\s*slot:\s*body\s*$/m.test(block));
  return {
    passed,
    message: passed
      ? "Every selected static-content region uses layout.slot: body."
      : "A normal-page static-content region is missing layout.slot: body."
  };
}

function checkNormalPageBreadcrumbRegion(_artifactPath, text) {
  const breadcrumbRegions = componentBlocks(text, "region").filter((block) => /^\s*type:\s*breadcrumb\s*$/m.test(block));
  const passed = breadcrumbRegions.some((block) => /^\s*breadcrumb:\s*@breadcrumb\s*$/m.test(block)
    && /^\s*slot:\s*breadcrumbBar\s*$/m.test(block));
  return {
    passed,
    message: passed
      ? "The page renders the required breadcrumb region."
      : "Add a breadcrumb region with source.breadcrumb: @breadcrumb and layout.slot: breadcrumbBar."
  };
}

function checkNormalPageBodyRegions(_artifactPath, text) {
  const bodyRegions = componentBlocks(text, "region")
    .filter((block) => !/^\s*type:\s*breadcrumb\s*$/m.test(block));
  const passed = bodyRegions.length === 0 || bodyRegions.every((block) => /^\s*slot:\s*body\s*$/m.test(block));
  return {
    passed,
    message: passed
      ? "Every non-breadcrumb region on the normal page uses layout.slot: body."
      : "A non-breadcrumb region on the normal page must use layout.slot: body."
  };
}

function checkSameAppButtonTarget(_artifactPath, text) {
  const redirectButtons = componentBlocks(text, "button").filter((block) => /^\s*action:\s*redirectThisApp\s*$/m.test(block));
  const passed = redirectButtons.length > 0 && redirectButtons.every((block) => /^\s*target:\s*\{\s*$/m.test(block));
  return {
    passed,
    message: passed
      ? "Every redirectThisApp button uses an object-valued target."
      : "A redirectThisApp button is missing an object-valued target: { ... } property."
  };
}

const CONTRACT_CHECKS = {
  "canonical-page-identity": checkCanonicalPageIdentity,
  "normal-static-content-slot": checkNormalStaticContentSlot,
  "normal-page-breadcrumb-region": checkNormalPageBreadcrumbRegion,
  "normal-page-body-regions": checkNormalPageBodyRegions,
  "same-app-button-target": checkSameAppButtonTarget
};

function cacheFileName(grammarSha256, semanticRulesSha256, compilerIdentity, components, children, instances, groups, conditions) {
  const selectionHash = createHash("sha256")
    .update(`${semanticRulesSha256}|${compilerIdentity}|${components.join(",")}|${children.join(",")}|${instances.map(({ selector, value }) => `${selector}=${value}`).join(",")}|${groups.join(",")}|${conditions.map(({ selector, value }) => `${selector}=${value}`).join(",")}`)
    .digest("hex")
    .slice(0, 16);
  return `${grammarSha256}-${selectionHash}.json`;
}

/**
 * Return a compact EBNF closure for explicitly selected component productions.
 * Child selector rules are retained as summaries but recursively expanded only
 * for child components included in the explicit selection.
 */
export async function buildGrammarContract({ components, children = [], instances = [], groups = [], conditions = [], cacheDir = "", useCache = true } = {}) {
  const requestedComponents = normalizeComponents(components || []);
  const requestedGroups = normalizeComponents(groups || []);
  const requestedChildren = normalizeChildren(children || [], requestedComponents);
  const requestedInstances = normalizeInstances(instances || [], requestedChildren);
  if (requestedComponents.length === 0) {
    throw new Error("At least one component is required");
  }

  const layout = resolveLayout();
  const sourcePath = layout.grammarPath;
  const grammarText = await fs.readFile(sourcePath, "utf8");
  const grammarSha256 = createHash("sha256").update(grammarText).digest("hex");
  const semanticRulesText = await fs.readFile(layout.semanticRulesPath, "utf8");
  const semanticRulesSha256 = createHash("sha256").update(semanticRulesText).digest("hex");
  const semanticRulesCatalog = JSON.parse(semanticRulesText);
  const productions = parseProductions(grammarText);
  const unknownComponents = requestedComponents.filter((name) => !productions.has(name));
  if (unknownComponents.length > 0) {
    throw new Error(`Unknown grammar component production(s): ${unknownComponents.join(", ")}`);
  }
  const selectedConditions = normalizeConditions(conditions || [], requestedComponents);
  const compilerContract = await buildCompilerContract(
    layout,
    productions,
    requestedComponents,
    requestedChildren,
    requestedInstances,
    requestedGroups,
    selectedConditions
  );
  const compilerIdentity = compilerContract.status === "resolved"
    ? `${compilerContract.buildID}:${compilerContract.metadataHash}`
    : `unavailable:${compilerContract.reason}`;

  const resolvedCacheDir = cacheDir
    ? path.resolve(cacheDir)
    : layout.packaged
      ? path.join(path.resolve(process.env.APEXLANG_OUTPUT_ROOT || process.cwd()), ".apexlang-cache", "grammar-contracts")
      : path.join(layout.root, "artifacts", "apexlang", "cache", "grammar-contracts");
  const cachePath = path.join(resolvedCacheDir, cacheFileName(grammarSha256, semanticRulesSha256, compilerIdentity, requestedComponents, requestedChildren, requestedInstances, requestedGroups, selectedConditions));
  if (useCache) {
    try {
      const cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
      return { contract: cached, cachePath, cacheStatus: "hit" };
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const resolvedGrammarChildren = compilerContract.resolvedChildren.map(({ grammarProduction }) => grammarProduction);
  const closure = productionClosure(
    productions,
    [...requestedComponents, ...resolvedGrammarChildren],
    requestedGroups,
    DEFAULT_CORE_PRODUCTIONS
  );
  let narrowedEnumCount = 0;
  const contractProductions = closure.names.map((name) => {
    const narrowed = narrowDefinition(name, productions.get(name), selectedConditions, requestedComponents);
    narrowedEnumCount += narrowed.narrowedEnums;
    return { name, definition: narrowed.definition };
  });
  const semanticRules = selectSemanticRules(semanticRulesCatalog, requestedComponents, selectedConditions);
  const checklist = generationChecklist(semanticRules);
  const contract = {
    schemaVersion: CONTRACT_SCHEMA_VERSION,
    purpose: "Task-scoped APEXlang syntax contract; compiler truth remains authoritative for semantic legality.",
    grammar: {
      sha256: grammarSha256,
      source: layout.packaged
        ? "assets/grammar/apexlang.ebnf"
        : "assets/grammar/apexlang.ebnf"
    },
    requestedComponents,
    requestedChildren,
    requestedInstances,
    requestedGroups,
    selectedConditions,
    semanticContract: {
      source: layout.packaged
        ? "assets/contracts/grammar-semantic-rules.json"
        : "assets/contracts/grammar-semantic-rules.json",
      sha256: semanticRulesSha256,
      rules: semanticRules,
      generationChecklist: checklist
    },
    compilerContract,
    expansionPolicy: {
      mode: "compiler-resolved-child-closure",
      description: "Child selectors remain summaries; compiler-compatible child variants are resolved from parent assumptions and expanded only when one structural match is unambiguous."
    },
    allowedChildren: closure.allowedChildren,
    allowedGroups: closure.allowedGroups,
    productions: contractProductions,
    stats: {
      productionCount: contractProductions.length,
      definitionCharacters: contractProductions.reduce((total, item) => total + item.definition.length, 0),
      narrowedEnumCount,
      semanticRuleCount: semanticRules.length,
      checklistCount: checklist.length,
      semanticContractCharacters: JSON.stringify({ rules: semanticRules, generationChecklist: checklist }).length,
      compilerContractCharacters: JSON.stringify(compilerContract).length,
      fullGrammarCharacters: grammarText.length
    }
  };

  if (useCache) {
    await ensureDir(resolvedCacheDir);
    await fs.writeFile(cachePath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  }
  return { contract, cachePath, cacheStatus: useCache ? "miss" : "disabled" };
}

/** Audit deterministic MUST checks for one generated artifact. */
export async function auditGrammarContract({ contract, artifactPath } = {}) {
  if (!contract?.semanticContract?.generationChecklist) {
    throw new Error("A grammar contract with semanticContract.generationChecklist is required");
  }
  if (!artifactPath) {
    throw new Error("An artifact path is required");
  }
  const resolvedArtifactPath = path.resolve(artifactPath);
  const text = await fs.readFile(resolvedArtifactPath, "utf8");
  const checks = [];
  const outOfScope = [];
  const decisions = [];
  for (const item of contract.semanticContract.generationChecklist) {
    if (item.level === "decision") {
      decisions.push({ ...item, status: "intent-dependent" });
      continue;
    }
    if (item.scope !== "page-local") {
      outOfScope.push({ ...item, status: "out-of-artifact-scope" });
      continue;
    }
    const check = CONTRACT_CHECKS[item.check];
    if (!check) {
      checks.push({ ...item, status: "unverified", message: `No deterministic check is registered for ${item.check}.` });
      continue;
    }
    const result = check(resolvedArtifactPath, text);
    checks.push({ ...item, status: result.passed ? "passed" : "failed", message: result.message });
  }
  const failed = checks.filter(({ status }) => status !== "passed");
  return {
    schemaVersion: 1,
    artifactPath: resolvedArtifactPath,
    status: failed.length === 0 ? "passed" : "failed",
    checks,
    decisions,
    outOfScope,
    summary: {
      passed: checks.filter(({ status }) => status === "passed").length,
      failed: failed.length,
      decisions: decisions.length,
      outOfScope: outOfScope.length
    }
  };
}
