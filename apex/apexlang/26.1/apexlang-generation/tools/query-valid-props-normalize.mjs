import { createHash } from "node:crypto";
import path from "node:path";
import { readJarEntry } from "./query-valid-props-runtime.mjs";

export const ORACLE_NORMALIZER_VERSION = "node-json-v1";

function hashText(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

function normalizeName(value) {
  return value?.name?.singular || value?.name?.plural || null;
}

function summarizeCondition(node, metadata) {
  if (!node) {
    return null;
  }
  if (node.conditions) {
    return {
      operator: node.operator || "AND",
      conditions: node.conditions.map((condition) => summarizeCondition(condition, metadata))
    };
  }
  const propertyName = node.propertyId ? metadata.properties?.[node.propertyId]?.name : node.propertyName;
  const componentTypeName = node.componentTypeId
    ? normalizeName(metadata.componentTypes?.[node.componentTypeId])
    : undefined;
  return {
    type: node.type,
    propertyId: node.propertyId || undefined,
    propertyName: propertyName || undefined,
    componentTypeId: node.componentTypeId || undefined,
    componentTypeName: componentTypeName || undefined,
    value: node.value,
    values: node.values,
    hasToExist: node.hasToExist
  };
}

function summarizeLov(propertyDefinition) {
  const lov = propertyDefinition?.lov;
  if (!lov) {
    return null;
  }

  return {
    type: lov.type || null,
    scope: lov.scope || null,
    values: Array.isArray(lov.values)
      ? lov.values.map((value) => ({
          name: value.name || null,
          returnValue: value.r ?? null,
          label: value.d?.en || null,
          helpText: value.helpText?.en || null
        }))
      : []
  };
}

function buildComponentRecord(componentTypeId, componentType, metadata) {
  const groups = {};
  const properties = Object.entries(componentType.properties || {})
    .map(([propertyId, property]) => {
      const groupName = property.groupName || metadata.groups?.[property.groupId]?.name || "ungrouped";
      const propertyDefinition = metadata.properties?.[propertyId] || null;
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      const record = {
        propertyId,
        propertyName: property.propertyName,
        required: Boolean(property.isRequired),
        displayOrder: property.displayOrder ?? null,
        dependsOn: summarizeCondition(property.dependingOn, metadata),
        lov: summarizeLov(propertyDefinition),
        defaultValue: property.defaultValue ?? null
      };
      groups[groupName].push(record);
      return record;
    })
    .sort((a, b) => {
      if (a.displayOrder === null && b.displayOrder === null) return a.propertyName.localeCompare(b.propertyName);
      if (a.displayOrder === null) return 1;
      if (b.displayOrder === null) return -1;
      return a.displayOrder - b.displayOrder;
    });

  for (const list of Object.values(groups)) {
    list.sort((a, b) => {
      if (a.displayOrder === null && b.displayOrder === null) return a.propertyName.localeCompare(b.propertyName);
      if (a.displayOrder === null) return 1;
      if (b.displayOrder === null) return -1;
      return a.displayOrder - b.displayOrder;
    });
  }

  const parentComponentTypeId = componentType.parent?.componentTypeId || null;
  const parentComponentType = parentComponentTypeId
    ? normalizeName(metadata.componentTypes?.[parentComponentTypeId])
    : null;

  return {
    componentTypeId,
    singular: componentType.name?.singular || null,
    plural: componentType.name?.plural || null,
    filePath: componentType.filePath || null,
    parentComponentTypeId,
    parentComponentType,
    parentDependsOn: summarizeCondition(componentType.parent?.dependingOn, metadata),
    pluginPropertyId: componentType.plugin?.propertyId || null,
    pluginComponentTypeName: componentType.plugin?.componentTypeName || null,
    pluginApiExpression: componentType.plugin?.api?.expression || null,
    propertyCount: properties.length,
    groups,
    properties
  };
}

function buildIndex(records) {
  const bySingular = {};
  const byParent = {};

  for (const record of records) {
    if (record.singular) {
      bySingular[record.singular] ||= [];
      bySingular[record.singular].push({
        componentTypeId: record.componentTypeId,
        parentComponentType: record.parentComponentType,
        propertyCount: record.propertyCount,
        filePath: record.filePath
      });
    }
    if (record.parentComponentType) {
      byParent[record.parentComponentType] ||= [];
      byParent[record.parentComponentType].push({
        componentTypeId: record.componentTypeId,
        singular: record.singular,
        parentDependsOn: record.parentDependsOn
      });
    }
  }

  for (const list of Object.values(bySingular)) {
    list.sort((a, b) => a.componentTypeId.localeCompare(b.componentTypeId));
  }
  for (const list of Object.values(byParent)) {
    list.sort((a, b) => a.componentTypeId.localeCompare(b.componentTypeId));
  }

  return { bySingular, byParent };
}

export function readOracleRuntimeMetadata(compilerJarPath) {
  const metadataText = readJarEntry(compilerJarPath, "apexlang_meta_data.json");
  return parseOracleRuntimeMetadataText(metadataText, compilerJarPath);
}

export function parseOracleRuntimeMetadataText(metadataText, compilerJarPath = "apexlang_meta_data.json") {
  const metadata = JSON.parse(metadataText);
  if (!metadata.buildID) {
    throw new Error(`Oracle compiler metadata does not expose buildID in ${compilerJarPath}`);
  }
  return {
    metadata,
    metadataText,
    buildId: String(metadata.buildID),
    metadataHash: hashText(metadataText)
  };
}

export function buildOracleNormalizedMap({ metadata, compilerJarPath, oracleHome, source }) {
  const records = Object.entries(metadata.componentTypes || {})
    .map(([componentTypeId, componentType]) => buildComponentRecord(componentTypeId, componentType, metadata))
    .sort((a, b) => a.componentTypeId.localeCompare(b.componentTypeId));

  return {
    backend: "oracle",
    buildID: metadata.buildID,
    generatedAt: new Date().toISOString(),
    metadataPath: `oracle-runtime:${path.basename(compilerJarPath)}`,
    componentTypeCount: records.length,
    normalizerVersion: ORACLE_NORMALIZER_VERSION,
    oracleSource: {
      kind: source,
      oracleHome,
      compilerJar: compilerJarPath
    },
    index: buildIndex(records),
    componentTypes: records
  };
}
