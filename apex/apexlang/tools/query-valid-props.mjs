import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildOracleNormalizedMap, ORACLE_NORMALIZER_VERSION, readOracleRuntimeMetadata } from "./query-valid-props-normalize.mjs";
import { resolveOracleRuntime } from "./query-valid-props-runtime.mjs";
import { loadTemplateComponentProfile } from "./query-valid-props-template-components.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const IS_PACKAGED_ROOT = path.basename(path.dirname(SCRIPT_PATH)) === "tools";

function defaultCommand() {
  return IS_PACKAGED_ROOT
    ? "node tools/query-valid-props.mjs"
    : `node ${["ai-context", "apexlang", "compiler-prop-map", "query-valid-props.mjs"].join("/")}`;
}

function nextValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseArgs(argv) {
  const args = {
    javaHome: null,
    compilerOracleHome: null,
    component: null,
    componentTypeId: null,
    parent: null,
    group: null,
    templateComponent: null,
    assumes: [],
    list: false,
    dumpJson: false,
    json: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--java-home":
        args.javaHome = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--compiler-oracle-home":
      case "--oracle-home":
        args.compilerOracleHome = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--component":
        args.component = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--component-type-id":
        args.componentTypeId = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--parent":
        args.parent = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--group":
        args.group = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--template-component":
        args.templateComponent = nextValue(argv, index, arg);
        index += 1;
        break;
      case "--when":
        args.assumes.push(nextValue(argv, index, arg));
        index += 1;
        break;
      case "--list":
        args.list = true;
        break;
      case "--dump-json":
        args.dumpJson = true;
        args.json = true;
        break;
      case "--json":
        args.json = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

const DOTTED_COMPONENT_ALIASES = new Map([
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

function resolveDottedComponentAlias(args) {
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

function parseAssumptions(entries) {
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
    byRawKey.set(key, value);
    byScopedName.set(key, value);
    const propertyName = key.split(".").at(-1);
    if (!byPropertyName.has(propertyName)) {
      byPropertyName.set(propertyName, []);
    }
    byPropertyName.get(propertyName).push({ key, value });
  }

  return { byRawKey, byScopedName, byPropertyName };
}

function conditionToText(node) {
  if (!node) {
    return "";
  }
  if (node.conditions) {
    return `(${node.conditions.map(conditionToText).join(` ${node.operator} `)})`;
  }
  const left = node.propertyName
    ? `${node.propertyName}${node.componentTypeName ? `@${node.componentTypeName}` : ""}`
    : node.componentTypeName || "condition";
  if (node.values) {
    return `${left} ${node.type} [${node.values.join(", ")}]`;
  }
  if (node.value !== undefined) {
    return `${left} ${node.type} ${node.value}`;
  }
  return `${left} ${node.type}`;
}

function resolveAssumptionValue(condition, assumptionIndex) {
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

function evaluateLeaf(condition, assumptionIndex) {
  const resolved = resolveAssumptionValue(condition, assumptionIndex);
  if (resolved.state !== "known") {
    return { state: "unknown", reason: resolved.reason };
  }

  const actual = resolved.value;
  switch (condition.type) {
    case "EQUALS":
      return { state: actual === condition.value ? "true" : "false" };
    case "NOT_EQUALS":
      return { state: actual !== condition.value ? "true" : "false" };
    case "IN_LIST":
      return { state: condition.values?.includes(actual) ? "true" : "false" };
    case "NOT_IN_LIST":
      return { state: condition.values?.includes(actual) ? "false" : "true" };
    case "NOT_NULL":
      return { state: actual ? "true" : "false" };
    case "NULL":
      return { state: actual ? "false" : "true" };
    case "STARTS_WITH":
      return { state: actual.startsWith(condition.value || "") ? "true" : "false" };
    case "STARTS_WITH_ANY":
      return { state: (condition.values || []).some((value) => actual.startsWith(value)) ? "true" : "false" };
    default:
      return { state: "unknown", reason: `unsupported operator ${condition.type}` };
  }
}

function combineResults(operator, results) {
  const states = results.map((result) => result.state);
  if (operator === "AND") {
    if (states.includes("false")) return { state: "false" };
    if (states.every((state) => state === "true")) return { state: "true" };
    return { state: "unknown" };
  }
  if (operator === "OR") {
    if (states.includes("true")) return { state: "true" };
    if (states.every((state) => state === "false")) return { state: "false" };
    return { state: "unknown" };
  }
  return { state: "unknown" };
}

function evaluateCondition(node, assumptionIndex) {
  if (!node) {
    return { state: "true" };
  }
  if (node.conditions) {
    return combineResults(
      node.operator || "AND",
      node.conditions.map((condition) => evaluateCondition(condition, assumptionIndex))
    );
  }
  return evaluateLeaf(node, assumptionIndex);
}

function selectComponents(map, args) {
  let matches = map.componentTypes;

  if (args.componentTypeId) {
    matches = matches.filter((record) => record.componentTypeId === args.componentTypeId);
  }
  if (args.component) {
    matches = matches.filter((record) => record.singular === args.component);
  }
  if (args.parent) {
    matches = matches.filter((record) => record.parentComponentType === args.parent);
  }

  return matches.sort((left, right) => left.componentTypeId.localeCompare(right.componentTypeId));
}

function listComponents(map, args) {
  const matches = selectComponents(map, args);
  if (!matches.length) {
    console.log("No matching component types.");
    return;
  }
  for (const match of matches) {
    console.log(`${match.componentTypeId}\t${match.singular}\tparent=${match.parentComponentType || "none"}\tprops=${match.propertyCount}`);
    if (match.parentDependsOn) {
      console.log(`  when ${conditionToText(match.parentDependsOn)}`);
    }
  }
}

function propertyStatus(prop, assumptionIndex) {
  const result = evaluateCondition(prop.dependsOn, assumptionIndex);
  if (result.state === "true") return "active";
  if (result.state === "false") return "inactive";
  return prop.dependsOn ? "conditional" : "active";
}

function renderLovValues(prop) {
  if (!prop.lov?.values?.length) {
    return [];
  }

  return prop.lov.values.map((value) => {
    const parts = [value.name];
    if (value.returnValue && value.returnValue !== value.name) {
      parts.push(`internal=${value.returnValue}`);
    }
    if (value.label && value.label !== value.name) {
      parts.push(`label=${JSON.stringify(value.label)}`);
    }
    return parts.join(" | ");
  });
}

function renderComponent(record, args, assumptionIndex) {
  console.log(`${record.singular} [componentTypeId=${record.componentTypeId}]`);
  console.log(`parent: ${record.parentComponentType || "none"}`);
  if (record.parentDependsOn) {
    console.log(`parent condition: ${conditionToText(record.parentDependsOn)}`);
  }
  if (record.filePath) {
    console.log(`filePath: ${record.filePath}`);
  }
  console.log(`propertyCount: ${record.propertyCount}`);
  console.log("");

  const groupEntries = Object.entries(record.groups)
    .filter(([groupName]) => !args.group || groupName === args.group);

  for (const [groupName, props] of groupEntries) {
    console.log(`[${groupName}]`);
    for (const prop of props) {
      const status = propertyStatus(prop, assumptionIndex);
      const details = [];
      if (prop.required) details.push("required");
      if (prop.defaultValue !== null) details.push(`default=${prop.defaultValue}`);
      if (prop.lov?.type) details.push(`lovType=${prop.lov.type}`);
      if (prop.lov?.scope) details.push(`lovScope=${prop.lov.scope}`);
      if (prop.dependsOn) details.push(`when ${conditionToText(prop.dependsOn)}`);
      console.log(`- ${status.padEnd(11)} ${prop.propertyName}${details.length ? ` (${details.join("; ")})` : ""}`);
      for (const value of renderLovValues(prop)) {
        console.log(`  value: ${value}`);
      }
    }
    console.log("");
  }
}

function componentPayload(record, args, assumptionIndex) {
  const groups = {};
  for (const [groupName, props] of Object.entries(record.groups)) {
    if (args.group && groupName !== args.group) {
      continue;
    }
    groups[groupName] = props.map((prop) => ({
      ...prop,
      status: propertyStatus(prop, assumptionIndex)
    }));
  }
  return {
    componentTypeId: record.componentTypeId,
    singular: record.singular,
    plural: record.plural,
    parentComponentType: record.parentComponentType,
    parentDependsOn: record.parentDependsOn,
    pluginPropertyId: record.pluginPropertyId,
    pluginComponentTypeName: record.pluginComponentTypeName,
    propertyCount: record.propertyCount,
    groups
  };
}

function printHelp() {
  const command = defaultCommand();
  console.log(`Usage:
  ${command} --component <name> [options]
  ${command} --template-component <contentRow|metricCard|...> [--dump-json]

Options:
  --java-home <path>           Compatibility flag; ignored by the current Node implementation
  --compiler-oracle-home <path> Oracle VS Code extension, dbtools, SQLcl home, or compiler jar override for compiler metadata
  --oracle-home <path>         Backward-compatible alias for --compiler-oracle-home
  --component <name>           Semantic component name or dotted alias, for example region, map.layer.link, or chart.series
  --component-type-id <id>     Exact compiler component type id, for example 5110
  --parent <name>              Filter by parent semantic name, for example page or region
  --group <name>               Show only one group, for example source
  --template-component <name>  Inspect Universal Theme template-component metadata and distilled settings
  --when <expr>                Assumption used to classify props, for example identification.type=NATIVE_IR or 94=NATIVE_IR
  --list                       List matching component types instead of property details
  --json                       Emit a machine-readable compiler-truth payload
  --dump-json                  Backward-compatible alias for --json
  --help                       Show this help

Examples:
  ${command} --component region --group source --when 94=NATIVE_IR --when 957=LOCAL --when 959=TABLE
  ${command} --component column --parent region --list
  ${command} --component map.layer.link
  ${command} --component chart.series.marker
  ${command} --template-component metricCard
  ${command} --json > /tmp/apexlang-runtime-map.json
  ${command} --compiler-oracle-home /path/to/oracle.sql-developer-26.1.2 --component-type-id 7320
`);
}

function renderTemplateComponentProfile(profile) {
  console.log(`templateComponent ${profile.requestedName} [theme=${profile.theme}]`);
  console.log(`plugin: ${profile.plugin.identifier}`);
  console.log(`name: ${profile.plugin.name || "unknown"}`);
  console.log(`staticId: ${profile.plugin.staticId || "unknown"}`);
  console.log(`availableAs: ${profile.plugin.availableAs.join(", ") || "unknown"}`);
  if (profile.plugin.reportGroup) {
    console.log(`reportGroup: ${profile.plugin.reportGroup}`);
  }
  if (profile.plugin.reportRow) {
    console.log(`reportRow: ${profile.plugin.reportRow}`);
  }
  if (profile.attributeGroups?.length) {
    console.log(`attributeGroups: ${profile.attributeGroups.map((group) => group.identifier).join(", ")}`);
  }
  console.log("");
  console.log("[customAttributes]");
  for (const attr of profile.customAttributes) {
    const details = [];
    details.push(`type=${attr.type}`);
    if (attr.required) details.push("required");
    if (attr.attributeGroup) details.push(`group=${attr.attributeGroup}`);
    if (attr.defaultValue) details.push(`default=${attr.defaultValue}`);
    if (attr.dependencyAttribute) {
      details.push(`when ${attr.dependencyAttribute} ${attr.dependencyCondition || ""} ${attr.dependencyValue || ""}`.trim());
    }
    console.log(`- ${attr.apexlangName || attr.identifier}${details.length ? ` (${details.join("; ")})` : ""}`);
    if (attr.name && attr.name !== attr.apexlangName) {
      console.log(`  label: ${attr.name}`);
    }
    for (const entry of attr.entries) {
      console.log(`  value: ${entry.name}${entry.returnValue ? ` | return=${entry.returnValue}` : ""}${entry.display ? ` | display=${JSON.stringify(entry.display)}` : ""}`);
    }
  }
}

function resolveOracleBackedMap(args) {
  const oracleRuntime = resolveOracleRuntime(args.compilerOracleHome);
  const { metadata, buildId, metadataHash } = readOracleRuntimeMetadata(oracleRuntime.compilerJarPath);
  const map = buildOracleNormalizedMap({
    metadata,
    compilerJarPath: oracleRuntime.compilerJarPath,
    oracleHome: oracleRuntime.oracleHome,
    source: oracleRuntime.source
  });
  map.compilerTruth = {
    buildID: buildId,
    metadataHash,
    normalizerVersion: ORACLE_NORMALIZER_VERSION,
    source: oracleRuntime.source,
    oracleHome: oracleRuntime.oracleHome,
    compilerJar: oracleRuntime.compilerJarPath
  };

  console.error(
    `Using compiler metadata from SQLcl/Oracle runtime (build=${buildId}, normalizer=${ORACLE_NORMALIZER_VERSION}, metadataHash=${metadataHash}, source=${oracleRuntime.source})`
  );
  return map;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  resolveDottedComponentAlias(args);
  const wantsFullMapJson = (args.json || args.dumpJson) && !args.list && !args.component && !args.componentTypeId && !args.templateComponent;
  if (args.help || (!wantsFullMapJson && !args.list && !args.component && !args.componentTypeId && !args.templateComponent)) {
    printHelp();
    return;
  }

  if (args.templateComponent) {
    const profile = loadTemplateComponentProfile(args.templateComponent);
    if (args.json || args.dumpJson) {
      console.log(JSON.stringify(profile, null, 2));
      return;
    }
    renderTemplateComponentProfile(profile);
    return;
  }

  const map = resolveOracleBackedMap(args);
  if (wantsFullMapJson) {
    console.log(JSON.stringify(map, null, 2));
    return;
  }

  const assumptionIndex = parseAssumptions(args.assumes);
  const matches = selectComponents(map, args);

  if (!matches.length) {
    console.error("No matching component types.");
    process.exitCode = 1;
    return;
  }

  if (args.json || args.dumpJson) {
    console.log(JSON.stringify(
      {
        status: "pass",
        compilerTruth: map.compilerTruth,
        query: {
          component: args.component,
          componentTypeId: args.componentTypeId,
          parent: args.parent,
          group: args.group,
          assumptions: args.assumes,
          list: args.list
        },
        matches: args.list
          ? matches.map((record) => ({
              componentTypeId: record.componentTypeId,
              singular: record.singular,
              parentComponentType: record.parentComponentType,
              propertyCount: record.propertyCount,
              parentDependsOn: record.parentDependsOn
            }))
          : matches.map((record) => componentPayload(record, args, assumptionIndex))
      },
      null,
      2
    ));
    return;
  }

  if (args.list) {
    listComponents(map, args);
    return;
  }

  for (const [index, record] of matches.entries()) {
    if (index > 0) {
      console.log("=".repeat(72));
    }
    renderComponent(record, args, assumptionIndex);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
