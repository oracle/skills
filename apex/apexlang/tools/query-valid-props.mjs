import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadOracleCompilerContext } from "./query-valid-props-context.mjs";
import {
  buildPropertyLookup as basePropertyLookup,
  parseQueryAssumptions as parseAssumptions,
  queryPropertyStatus as propertyStatus,
  resolveDottedComponentAlias,
  resolveLovValues,
  selectQueryComponents as selectComponents
} from "./query-valid-props-semantics.mjs";
import { loadTemplateComponentProfile } from "./query-valid-props-template-components.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const IS_PACKAGED_ROOT = path.basename(path.dirname(SCRIPT_PATH)) === "tools";

function defaultCommand() {
  return IS_PACKAGED_ROOT
    ? "node tools/query-valid-props.mjs"
    : `node ${["ai-context", "apexlang", "compiler-prop-map", "query-valid-props.mjs"].join("/")}`;
}

/**
 * Return the value after a flag, or fail with a clear command-line error.
 */
function readRequiredOptionValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

/**
 * Parse the query helper flags without normalizing the requested component yet.
 */
function parseArgs(argv) {
  const args = {
    javaHome: null,
    compilerOracleHome: null,
    component: null,
    componentTypeId: null,
    parent: null,
    group: null,
    templateComponent: null,
    auditOptionalProperties: false,
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
        args.javaHome = readRequiredOptionValue(argv, index, arg);
        index += 1;
        break;
      case "--compiler-oracle-home":
      case "--oracle-home":
        args.compilerOracleHome = readRequiredOptionValue(argv, index, arg);
        index += 1;
        break;
      case "--component":
        args.component = readRequiredOptionValue(argv, index, arg);
        index += 1;
        break;
      case "--component-type-id":
        args.componentTypeId = readRequiredOptionValue(argv, index, arg);
        index += 1;
        break;
      case "--parent":
        args.parent = readRequiredOptionValue(argv, index, arg);
        index += 1;
        break;
      case "--group":
        args.group = readRequiredOptionValue(argv, index, arg);
        index += 1;
        break;
      case "--template-component":
        args.templateComponent = readRequiredOptionValue(argv, index, arg);
        index += 1;
        break;
      case "--audit-optional-properties":
        args.auditOptionalProperties = true;
        break;
      case "--when":
        args.assumes.push(readRequiredOptionValue(argv, index, arg));
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

const APEXLANG_GRAMMAR_COMPONENT_RULE_PATTERN = /^"(?<keyword>[A-Za-z][A-Za-z0-9]*)"\s+\[\s*<required-ws>\s+<component-id>\s*\].*"\("[^\n]*/;
const APEXLANG_GRAMMAR_GROUP_RULE_PATTERN = /^<indent>\s+"(?<group>[A-Za-z][A-Za-z0-9]*)"\s+<ws>\s+"\{"/;
const APEXLANG_GRAMMAR_PROPERTY_PATTERN = /"([A-Za-z][A-Za-z0-9]*)"\s+":"[^(\n]*(?:\(\*\s*(?<comment>.*?)\s*\*\))?/g;
const APEXLANG_GRAMMAR_RULE_REF_PATTERN = /<([A-Za-z0-9-]+)>/g;

function resolveGrammarPath() {
  const repoGrammarPath = path.resolve("ai-context", "apexlang", "grammar", "apexlang.ebnf");
  if (fs.existsSync(repoGrammarPath)) {
    return repoGrammarPath;
  }
  const packagedGrammarPath = path.resolve(path.dirname(SCRIPT_PATH), "..", "assets", "grammar", "apexlang.ebnf");
  if (fs.existsSync(packagedGrammarPath)) {
    return packagedGrammarPath;
  }
  return null;
}

function parseEbnfRules(grammarText) {
  const rules = new Map();
  let currentName = "";
  let currentLines = [];

  for (const line of grammarText.split(/\r?\n/)) {
    const match = /^<([^>]+)>\s*::=\s*(.*)$/.exec(line);
    if (match) {
      if (currentName) {
        rules.set(currentName, currentLines.join("\n").trim());
      }
      currentName = match[1];
      currentLines = [match[2]];
      continue;
    }
    if (currentName) {
      currentLines.push(line);
    }
  }
  if (currentName) {
    rules.set(currentName, currentLines.join("\n").trim());
  }
  return rules;
}

function grammarRuleRefs(ruleBody) {
  return [...String(ruleBody || "").matchAll(APEXLANG_GRAMMAR_RULE_REF_PATTERN)].map((match) => match[1]);
}

function grammarProperties(ruleBody) {
  const properties = [];
  for (const match of String(ruleBody || "").matchAll(APEXLANG_GRAMMAR_PROPERTY_PATTERN)) {
    const comment = match.groups?.comment || "";
    properties.push({
      name: match[1],
      required: /\brequired\b/.test(comment),
      comment: comment || null
    });
  }
  return properties;
}

function buildGrammarComponentContracts(grammarText) {
  const rules = parseEbnfRules(grammarText);
  const contracts = new Map();
  for (const [ruleName, ruleBody] of rules.entries()) {
    const componentMatch = APEXLANG_GRAMMAR_COMPONENT_RULE_PATTERN.exec(ruleBody);
    if (!componentMatch) {
      continue;
    }
    const keyword = componentMatch.groups.keyword;
    const contract = {
      keyword,
      ruleName,
      directProperties: grammarProperties(rules.get(`${ruleName}-direct-property`)),
      groups: {}
    };
    for (const groupRuleName of grammarRuleRefs(rules.get(`${ruleName}-group-block`))) {
      const groupMatch = APEXLANG_GRAMMAR_GROUP_RULE_PATTERN.exec(rules.get(groupRuleName) || "");
      if (!groupMatch) {
        continue;
      }
      contract.groups[groupMatch.groups.group] = grammarProperties(rules.get(`${groupRuleName}-property`));
    }
    if (!contracts.has(keyword)) {
      contracts.set(keyword, []);
    }
    contracts.get(keyword).push(contract);
  }
  return contracts;
}

function propertyConditionFeatures(prop) {
  const features = new Set();
  function walk(node) {
    if (!node) {
      return;
    }
    if (node.conditions) {
      for (const condition of node.conditions) {
        walk(condition);
      }
      return;
    }
    if (node.type === "FEATURES") {
      for (const value of node.values || []) {
        features.add(value);
      }
    }
  }
  walk(prop.dependsOn);
  return [...features].sort();
}

function buildPageItemOptionalPropertiesAudit(map) {
  const grammarPath = resolveGrammarPath();
  if (!grammarPath) {
    throw new Error("APEXlang grammar file not found for optional property audit");
  }
  const grammarText = fs.readFileSync(grammarPath, "utf8");
  const grammarContracts = buildGrammarComponentContracts(grammarText).get("pageItem") || [];
  const grammarContract = grammarContracts[0];
  if (!grammarContract) {
    throw new Error(`APEXlang grammar file does not expose a pageItem contract: ${grammarPath}`);
  }

  const pageItemRecord = map.componentTypes.find((record) => record.componentTypeId === "5120" || record.singular === "pageItem");
  if (!pageItemRecord) {
    throw new Error("Compiler metadata does not expose pageItem component type 5120");
  }

  const compilerLookup = basePropertyLookup(pageItemRecord);
  const groups = {};
  for (const [groupName, grammarProps] of Object.entries(grammarContract.groups)) {
    groups[groupName] = grammarProps.map((grammarProp) => {
      const compilerProps = compilerLookup.get(`${groupName}.${grammarProp.name}`) || [];
      return {
        propertyName: grammarProp.name,
        grammarRequired: grammarProp.required,
        grammarComment: grammarProp.comment,
        compilerStatus: compilerProps.length ? "present" : "missing",
        compilerPropertyIds: compilerProps.map((prop) => prop.propertyId),
        compilerRequired: compilerProps.some((prop) => prop.required),
        compilerConditionFeatures: [...new Set(compilerProps.flatMap(propertyConditionFeatures))].sort(),
        compilerConditionText: compilerProps.map((prop) => conditionToText(prop.dependsOn)).filter(Boolean)
      };
    });
  }

  return {
    status: "pass",
    compilerTruth: map.compilerTruth,
    grammar: {
      path: grammarPath,
      component: "pageItem",
      ruleName: grammarContract.ruleName,
      directProperties: grammarContract.directProperties,
      groups
    },
    baseCompiler: {
      componentTypeId: pageItemRecord.componentTypeId,
      pluginPropertyId: pageItemRecord.pluginPropertyId,
      pluginComponentTypeName: pageItemRecord.pluginComponentTypeName,
      pluginApiExpression: pageItemRecord.pluginApiExpression,
      groups: Object.fromEntries(
        Object.entries(pageItemRecord.groups || {}).map(([groupName, props]) => [
          groupName,
          props.map((prop) => ({
            propertyName: prop.propertyName,
            propertyId: prop.propertyId,
            required: prop.required,
            conditionFeatures: propertyConditionFeatures(prop),
            conditionText: conditionToText(prop.dependsOn) || null
          }))
        ])
      )
    },
    pluginSettings: {
      state: "plugin_attribute_metadata_not_exposed",
      reason: "Live metadata exposes the pageItem plugin attribute sink but not a complete built-in native item plugin custom-attribute inventory; absence from generic grammar must not be treated as invalid settings syntax.",
      attributeSink: pageItemRecord.pluginApiExpression || null,
      pluginPropertyId: pageItemRecord.pluginPropertyId
    }
  };
}

/**
 * Render a compiler metadata dependency condition in readable text.
 */
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

function listComponents(map, args) {
  const matches = selectComponents(map, args);
  if (!matches.length) {
    console.log("No matching component types.");
    return;
  }
  for (const match of matches) {
    console.log(`${match.componentTypeId}\t${match.singular}\tparent=${match.parentComponentType || "none"}\tprops=${match.propertyCount}`);
    if (match.parentDependsOn) {
      console.log(`  valid when parent.${conditionToText(match.parentDependsOn)}`);
    }
  }
}

function renderLovValues(prop) {
  return resolveLovValues(prop).map((value) => {
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

/**
 * Print a human-readable component property summary.
 */
function renderComponent(record, args, assumptionIndex) {
  console.log(`${record.singular} [componentTypeId=${record.componentTypeId}]`);
  console.log(`parent: ${record.parentComponentType || "none"}`);
  if (record.parentDependsOn) {
    console.log(`valid when parent.${conditionToText(record.parentDependsOn)}`);
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

/**
 * Build the JSON payload for one component after applying dependency assumptions.
 */
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
  --audit-optional-properties  Emit pageItem grammar/compiler optional-property audit JSON
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
  ${command} --component pageItem --audit-optional-properties --json
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
  const { map, provenance } = loadOracleCompilerContext(args.compilerOracleHome);
  map.compilerTruth = provenance;

  console.error(
    `Using compiler metadata from SQLcl/Oracle runtime (build=${provenance.buildID}, normalizer=${provenance.normalizerVersion}, metadataHash=${provenance.metadataHash}, source=${provenance.source})`
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
  if (args.auditOptionalProperties) {
    if (args.component && args.component !== "pageItem") {
      throw new Error("--audit-optional-properties currently supports only --component pageItem");
    }
    console.log(JSON.stringify(buildPageItemOptionalPropertiesAudit(map), null, 2));
    return;
  }
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
