import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const IS_PACKAGED_ROOT = path.basename(path.dirname(SCRIPT_PATH)) === "tools";
const REPO_ROOT = IS_PACKAGED_ROOT
  ? path.resolve(path.dirname(SCRIPT_PATH), "..")
  : path.resolve(path.dirname(SCRIPT_PATH), "..", "..", "..");

export const TEMPLATE_COMPONENT_ALIASES = {
  actions: "actions-theme-universal-theme",
  avatar: "avatar-theme-universal-theme",
  badge: "badge-theme-universal-theme",
  button: "button-theme-universal-theme",
  comments: "comments-theme-universal-theme",
  contentRow: "contentRow-theme-universal-theme",
  flexboxContainer: "flexboxContainer-theme-universal-theme",
  listItem: "listItem-theme-universal-theme",
  mediaList: "mediaList-theme-universal-theme",
  metricCard: "metricCard-theme-universal-theme",
  timeline: "timeline-theme-universal-theme"
};

export const DISTILLED_TEMPLATE_COMPONENT_PROFILE_PATH = IS_PACKAGED_ROOT
  ? path.join(REPO_ROOT, "templates", "template-components", "template-component-profiles.json")
  : path.join(REPO_ROOT, "ai-context", "apexlang", "templates", "template-components", "template-component-profiles.json");

const TEMPLATE_COMPONENT_METADATA_PROVENANCE = {
  backend: "repo-theme-export",
  authority: "theme-export-metadata",
  compilerBacked: false,
  limitations: [
    "Theme-export attributes are metadata inventory, not compiler-backed APEXlang legality.",
    "Use direct compiler validation against the target APEX build for emitted structure and properties."
  ]
};

function resolveTemplateComponentDir(sourceRoot, name) {
  const aliasTarget = TEMPLATE_COMPONENT_ALIASES[name] || name;
  const pluginDir = path.join(sourceRoot, aliasTarget);
  if (!fs.existsSync(pluginDir) || !fs.statSync(pluginDir).isDirectory()) {
    return null;
  }
  return {
    requestedName: name,
    resolvedName: aliasTarget,
    pluginDir
  };
}

function findParenBlock(text, keyword) {
  const pattern = new RegExp(`(^|\\n)\\s*${keyword}\\s+([A-Za-z0-9_$-]+)\\s*\\(`, "m");
  const match = pattern.exec(text);
  if (!match) {
    return null;
  }

  const start = match.index + match[1].length;
  const identifier = match[2];
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    const ch = text[index];
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return {
          identifier,
          block: text.slice(start, index + 1)
        };
      }
    }
  }
  return null;
}

function extractScalar(text, key) {
  if (!text) {
    return null;
  }

  const blockPattern = new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*\\\`\\\`\\\`(?:[A-Za-z0-9_-]+)?\\n([\\s\\S]*?)\\\`\\\`\\\``, "m");
  const blockMatch = blockPattern.exec(text);
  if (blockMatch) {
    return blockMatch[2].trim();
  }

  const pattern = new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*(.+)`, "m");
  const match = pattern.exec(text);
  return match ? match[2].trim() : null;
}

function extractBraceBlock(text, key) {
  const pattern = new RegExp(`(^|\\n)\\s*${key}\\s*\\{`, "m");
  const match = pattern.exec(text);
  if (!match) {
    return null;
  }
  const start = match.index + match[1].length + match[0].slice(match[1].length).lastIndexOf("{");
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    const ch = text[index];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }
  return null;
}

function extractListItems(text, key) {
  const pattern = new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*\\[([^\\]]*)\\]`, "m");
  const match = pattern.exec(text);
  if (!match) {
    return [];
  }
  return match[2]
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function findAllParenBlocks(text, keyword) {
  const results = [];
  const pattern = new RegExp(`(^|\\n)\\s*${keyword}\\s+([A-Za-z0-9_$-]+)\\s*\\(`, "gm");
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const start = match.index + match[1].length;
    const identifier = match[2];
    let depth = 0;
    for (let index = start; index < text.length; index += 1) {
      const ch = text[index];
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          results.push({ identifier, block: text.slice(start, index + 1) });
          pattern.lastIndex = index + 1;
          break;
        }
      }
    }
  }
  return results;
}

function parseAttributeGroupBlock(identifier, block) {
  const advancedBlock = extractBraceBlock(block, "advanced") || "";
  return {
    identifier,
    name: extractScalar(block, "name"),
    sequence: extractScalar(block, "sequence"),
    staticId: extractScalar(advancedBlock, "staticId")
  };
}

function parseActionPositionBlock(identifier, block) {
  const positionBlock = extractBraceBlock(block, "position") || "";
  return {
    identifier,
    name: extractScalar(block, "name"),
    staticId: extractScalar(block, "staticId"),
    sequence: extractScalar(block, "sequence"),
    positionType: extractScalar(positionBlock, "type")
  };
}

function parseActionTemplateBlock(identifier, block) {
  const advancedBlock = extractBraceBlock(block, "advanced") || "";
  return {
    identifier,
    name: extractScalar(block, "name"),
    type: extractScalar(block, "type"),
    staticId: extractScalar(advancedBlock, "staticId")
  };
}

function parseSlotBlock(identifier, block) {
  const supportsBlock = extractBraceBlock(block, "supports") || "";
  const gridLayoutBlock = extractBraceBlock(block, "gridLayout") || "";
  return {
    identifier,
    name: extractScalar(block, "name"),
    staticId: extractScalar(block, "staticId"),
    supports: {
      items: extractScalar(supportsBlock, "items"),
      buttons: extractScalar(supportsBlock, "buttons")
    },
    gridLayout: {
      newRow: extractScalar(gridLayoutBlock, "newRow")
    }
  };
}

function parseCustomAttributeBlock(identifier, block) {
  const required = /^\s*required\s*:\s*true\s*$/m.test(extractBraceBlock(block, "validation") || "");
  const appearanceBlock = extractBraceBlock(block, "appearance") || "";
  const dependingOnBlock = extractBraceBlock(block, "dependingOn") || "";
  const defaultBlock = extractBraceBlock(block, "default") || "";
  const securityBlock = extractBraceBlock(block, "security") || "";
  const entries = findAllParenBlocks(block, "entry").map(({ identifier: entryName, block: entryBlock }) => ({
    name: entryName,
    display: extractScalar(entryBlock, "display"),
    returnValue: extractScalar(entryBlock, "return"),
    sequence: extractScalar(entryBlock, "sequence")
  }));
  return {
    identifier,
    apexlangName: extractScalar(block, "apexlangName"),
    attributeId: extractScalar(block, "attribute"),
    name: extractScalar(block, "name"),
    type: extractScalar(block, "type") || "text",
    required,
    defaultValue: extractScalar(defaultBlock, "value"),
    sampleDataValue: extractScalar(defaultBlock, "sampleDataValue"),
    attributeGroup: extractScalar(appearanceBlock, "attributeGroup"),
    sequence: extractScalar(appearanceBlock, "sequence"),
    dependencyAttribute: extractScalar(dependingOnBlock, "attribute"),
    dependencyCondition: extractScalar(dependingOnBlock, "conditionType"),
    dependencyValue: extractScalar(dependingOnBlock, "value"),
    escapeMode: extractScalar(securityBlock, "escapeMode"),
    helpText: extractScalar(extractBraceBlock(block, "help") || "", "helpText") || extractScalar(block, "helpText"),
    entries
  };
}

function loadTemplateComponentProfileFromSourceRoot(sourceRoot, name) {
  const resolved = resolveTemplateComponentDir(sourceRoot, name);
  if (!resolved) {
    throw new Error(`Unknown template component '${name}'. Try one of: ${Object.keys(TEMPLATE_COMPONENT_ALIASES).join(", ")}`);
  }

  const pluginPath = path.join(resolved.pluginDir, "plugin.apx");
  if (!fs.existsSync(pluginPath)) {
    throw new Error(`No plugin.apx found for template component '${resolved.resolvedName}'`);
  }
  const pluginText = fs.readFileSync(pluginPath, "utf8");
  const customAttributesText = fs.existsSync(path.join(resolved.pluginDir, "custom-attributes.apx"))
    ? fs.readFileSync(path.join(resolved.pluginDir, "custom-attributes.apx"), "utf8")
    : "";
  const attributeGroupsText = fs.existsSync(path.join(resolved.pluginDir, "attribute-groups.apx"))
    ? fs.readFileSync(path.join(resolved.pluginDir, "attribute-groups.apx"), "utf8")
    : "";
  const actionPositionsText = fs.existsSync(path.join(resolved.pluginDir, "action-positions.apx"))
    ? fs.readFileSync(path.join(resolved.pluginDir, "action-positions.apx"), "utf8")
    : "";
  const actionTemplatesText = fs.existsSync(path.join(resolved.pluginDir, "action-templates.apx"))
    ? fs.readFileSync(path.join(resolved.pluginDir, "action-templates.apx"), "utf8")
    : "";
  const slotsText = fs.existsSync(path.join(resolved.pluginDir, "slots.apx"))
    ? fs.readFileSync(path.join(resolved.pluginDir, "slots.apx"), "utf8")
    : "";
  const pluginBlock = findParenBlock(pluginText, "plugin");
  if (!pluginBlock) {
    throw new Error(`Could not parse plugin.apx for ${resolved.resolvedName}`);
  }
  const templateComponentBlock = extractBraceBlock(pluginBlock.block, "templateComponent") || "";

  return {
    ...TEMPLATE_COMPONENT_METADATA_PROVENANCE,
    theme: "universal-theme",
    requestedName: resolved.requestedName,
    resolvedName: resolved.resolvedName,
    sourceDir: path.basename(resolved.pluginDir),
    plugin: {
      identifier: pluginBlock.identifier,
      name: extractScalar(pluginBlock.block, "name"),
      staticId: extractScalar(pluginBlock.block, "staticId"),
      availableAs: extractListItems(templateComponentBlock, "availableAs"),
      reportBody: extractScalar(templateComponentBlock, "reportBody"),
      reportRow: extractScalar(templateComponentBlock, "reportRow"),
      reportGroup: extractScalar(templateComponentBlock, "reportGroup"),
      reportContainer: extractScalar(templateComponentBlock, "reportContainer"),
      numberOfLazyLoadingSkeletons: extractScalar(templateComponentBlock, "numberOfLazyLoadingSkeletons")
    },
    attributeGroups: findAllParenBlocks(attributeGroupsText, "attributeGroup").map(({ identifier, block }) =>
      parseAttributeGroupBlock(identifier, block)
    ),
    actionPositions: findAllParenBlocks(actionPositionsText, "actionPosition").map(({ identifier, block }) =>
      parseActionPositionBlock(identifier, block)
    ),
    actionTemplates: findAllParenBlocks(actionTemplatesText, "actionTemplate").map(({ identifier, block }) =>
      parseActionTemplateBlock(identifier, block)
    ),
    slots: findAllParenBlocks(slotsText, "slot").map(({ identifier, block }) => parseSlotBlock(identifier, block)),
    customAttributes: findAllParenBlocks(customAttributesText, "customAttribute").map(({ identifier, block }) =>
      parseCustomAttributeBlock(identifier, block)
    )
  };
}

export function buildTemplateComponentCatalogFromSourceRoot(sourceRoot) {
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`Template-component source root does not exist: ${sourceRoot}`);
  }
  const components = {};
  for (const name of Object.keys(TEMPLATE_COMPONENT_ALIASES)) {
    try {
      components[name] = loadTemplateComponentProfileFromSourceRoot(sourceRoot, name);
    } catch (error) {
      if (/No plugin\.apx found/.test(String(error?.message))) {
        continue;
      }
      throw error;
    }
  }
  return {
    schemaVersion: 1,
    theme: "universal-theme",
    source: "repo-theme-export",
    authority: TEMPLATE_COMPONENT_METADATA_PROVENANCE.authority,
    compilerBacked: TEMPLATE_COMPONENT_METADATA_PROVENANCE.compilerBacked,
    limitations: TEMPLATE_COMPONENT_METADATA_PROVENANCE.limitations,
    aliases: TEMPLATE_COMPONENT_ALIASES,
    components
  };
}

export function loadTemplateComponentCatalog() {
  if (!fs.existsSync(DISTILLED_TEMPLATE_COMPONENT_PROFILE_PATH)) {
    throw new Error(
      `Template-component profile catalog is unavailable: ${DISTILLED_TEMPLATE_COMPONENT_PROFILE_PATH}. Regenerate it before querying template-component metadata.`
    );
  }
  return JSON.parse(fs.readFileSync(DISTILLED_TEMPLATE_COMPONENT_PROFILE_PATH, "utf8"));
}

export function loadTemplateComponentProfile(name) {
  const catalog = loadTemplateComponentCatalog();
  const aliasKey = catalog.components[name] ? name : Object.keys(catalog.aliases || {}).find((key) => catalog.aliases[key] === name);
  if (!aliasKey || !catalog.components[aliasKey]) {
    throw new Error(`Unknown template component '${name}'. Try one of: ${Object.keys(catalog.components).join(", ")}`);
  }
  const profile = catalog.components[aliasKey];
  return {
    ...profile,
    ...TEMPLATE_COMPONENT_METADATA_PROVENANCE,
    requestedName: name
  };
}
