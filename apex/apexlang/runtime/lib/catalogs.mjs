/**
 * Catalog verification helpers for router, policy, and orchestration metadata.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { exists, isPackagedSkillRuntime, readJson, repoPath } from "./common.mjs";

const RULE_ID_PATTERN = /\b[A-Z][A-Z0-9_]+(?:_\d{3}|_STALE)\b/g;
const DEFAULT_CONTEXT_BUDGET = 12000;

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_$]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeIdentifier(value) {
  return String(value ?? "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " ").replaceAll("-", " ");
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function activeAssetPaths() {
  if (isPackagedSkillRuntime()) {
    return {
      rules: repoPath("assets", "rules.catalog.json"),
      recipes: repoPath("assets", "validator-fix-recipes.json"),
      patterns: repoPath("assets", "contracts", "page-patterns.json"),
      packs: repoPath("assets", "contracts", "page-construction-packs.json"),
      components: repoPath("assets", "apex-generation", "components.registry.json")
    };
  }
  return {
    rules: repoPath("references/policies", "memory-bank", "rules.catalog.json"),
    recipes: repoPath("skills", "apexlang", "assets", "validator-fix-recipes.json"),
    patterns: repoPath("skills", "apexlang", "contracts", "page-patterns.json"),
    packs: repoPath("skills", "apexlang", "contracts", "page-construction-packs.json"),
    components: repoPath("skills", "apexlang", "apex-developer", "assets", "components.registry.json")
  };
}

function resolveRuntimeReference(value) {
  const reference = String(value ?? "");
  if (!reference) {
    return "";
  }
  return path.resolve(repoPath(), reference);
}

function phraseScore(intent, phrase) {
  const normalizedPhrase = normalizeSearchText(phrase);
  if (!normalizedPhrase) {
    return 0;
  }
  if (` ${intent} `.includes(` ${normalizedPhrase} `)) {
    return Math.max(4, normalizedPhrase.split(" ").length * 3);
  }
  const intentTokens = new Set(intent.split(" ").filter((token) => token.length > 2));
  const phraseTokens = normalizedPhrase.split(" ").filter((token) => token.length > 2);
  const overlap = phraseTokens.filter((token) => intentTokens.has(token)).length;
  return overlap === phraseTokens.length && overlap > 0 ? overlap : 0;
}

function selectProfiles(catalog, intent, maxProfiles = 2) {
  const ranked = (catalog.profiles ?? [])
    .map((profile) => ({
      ...profile,
      __score: Math.max(0, ...(profile.keywords ?? []).map((keyword) => phraseScore(intent, keyword)))
    }))
    .filter((profile) => profile.__score >= 3)
    .sort((left, right) => right.__score - left.__score || String(left.id).localeCompare(String(right.id)));
  const topScore = ranked[0]?.__score ?? 0;
  return ranked
    .filter((profile, index) => index === 0 || profile.__score >= topScore * 0.75)
    .slice(0, maxProfiles)
    .map(({ __score, ...profile }) => profile);
}

function selectComponents(registry, intent, maxComponents = 4) {
  const priority = new Map();
  for (const entry of registry.synonymPriority ?? []) {
    if (phraseScore(intent, entry.synonym) > 0) {
      priority.set(entry.prefer, 0.5);
    }
  }
  const ranked = (registry.components ?? [])
    .map((component) => {
      const phrases = [component.name, humanizeIdentifier(component.name), ...(component.synonyms ?? [])];
      return {
        component,
        score: Math.max(0, ...phrases.map((phrase) => phraseScore(intent, phrase))) + (priority.get(component.name) ?? 0)
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.component.name).localeCompare(String(right.component.name)));
  const topScore = ranked[0]?.score ?? 0;
  const selected = [];
  for (const entry of ranked) {
    if (entry.score < 3 || entry.score < topScore * 0.66) continue;
    if (selected.some((candidate) => candidate.component.name.startsWith(`${entry.component.name}-`))) {
      continue;
    }
    if (selected.some((candidate) => (candidate.component.synonyms ?? []).some((synonym) => phraseScore(normalizeSearchText(entry.component.name), synonym) > 0))) {
      continue;
    }
    selected.push(entry);
    if (selected.length >= maxComponents) break;
  }
  return selected.map(({ component }) => ({
    name: component.name,
    target_type: component.target_type,
    rules: component.rules ?? [],
    templates: component.templates ?? [],
    requires: component.requires ?? {},
    workflow: component.workflow
  }));
}

function patternContractById(patternCatalog, packCatalog, patternId, components = []) {
  const requested = normalizeSearchText(patternId).replaceAll(" ", "-");
  const pattern = (patternCatalog.patterns ?? []).find((candidate) => {
    return candidate.id === requested || normalizeSearchText(candidate.name).replaceAll(" ", "-") === requested;
  });
  if (!pattern) {
    return {
      id: String(patternId || "unspecified"),
      name: String(patternId || "Unspecified pattern"),
      status: components.length > 0 ? "component_registry_backed" : "unsupported",
      required_inputs: [],
      optional_inputs: [],
      generated_components: components.map((component) => component.name),
      renderer_rules: ["query_property_mapper_for_non_exact_shapes", "validate_generated_apx"],
      validation_rules: ["COMPILER_TRUTH_EVIDENCE_REQUIRED_001"],
      reference_paths: uniqueStrings(components.flatMap((component) => [...component.rules, ...component.templates, component.workflow]))
    };
  }
  const pack = (packCatalog.packs ?? []).find((candidate) => candidate.pattern_id === pattern.id);
  return {
    id: pattern.id,
    name: pattern.name,
    status: pack ? "resolved_pack" : "resolved_pattern",
    required_inputs: pattern.required_inputs ?? pack?.inputs?.required ?? [],
    optional_inputs: pack?.inputs?.optional ?? [],
    generated_components: pattern.generated_components ?? pack?.components ?? [],
    renderer_rules: pack?.renderer_rules ?? [],
    validation_rules: uniqueStrings([...(pattern.validation_rules ?? []), ...(pack?.validation_rules ?? [])]),
    reference_paths: pattern.reference_paths ?? []
  };
}

function selectRuleCards(catalog, intent, profiles, additionalRuleIds = []) {
  const requiredIds = new Set([
    ...(catalog.core_rule_ids ?? []),
    ...profiles.flatMap((profile) => profile.rule_ids ?? []),
    ...additionalRuleIds
  ]);
  return (catalog.rules ?? [])
    .filter((rule) => {
      if (requiredIds.has(rule.rule_id)) {
        return true;
      }
      const phrases = [...(rule.applies_to ?? []), ...(rule.required_load_when ?? [])];
      return phrases.some((phrase) => phraseScore(intent, phrase) >= 3);
    })
    .map((rule) => ({
      rule_id: rule.rule_id,
      summary: rule.summary,
      owner: rule.owner,
      details_doc: rule.details_doc,
      examples_doc: rule.examples_doc,
      enforced_by: rule.enforced_by ?? [],
      directives: rule.directives ?? []
    }));
}

function selectPatterns(patternCatalog, packCatalog, intent) {
  const patterns = (patternCatalog.patterns ?? [])
    .map((pattern) => ({
      ...pattern,
      __score:
        (pattern.selection_require_any ?? []).length > 0 &&
        !(pattern.selection_require_any ?? []).some((keyword) => phraseScore(intent, keyword) > 0)
          ? 0
          : (pattern.intent_keywords ?? []).reduce((score, keyword) => score + phraseScore(intent, keyword), 0)
    }))
    .filter((pattern) => pattern.__score > 0)
    .sort((left, right) => right.__score - left.__score || String(left.id).localeCompare(String(right.id)))
    .slice(0, 1);
  return patterns.map(({ __score, ...pattern }) => {
    const pack = (packCatalog.packs ?? []).find((candidate) => candidate.pattern_id === pattern.id);
    return {
      id: pattern.id,
      name: pattern.name,
      required_inputs: pattern.required_inputs ?? pack?.inputs?.required ?? [],
      optional_inputs: pack?.inputs?.optional ?? [],
      generated_components: pattern.generated_components ?? pack?.components ?? [],
      renderer_rules: pack?.renderer_rules ?? [],
      validation_rules: uniqueStrings([...(pattern.validation_rules ?? []), ...(pack?.validation_rules ?? [])]),
      reference_paths: pattern.reference_paths ?? []
    };
  });
}

function headingName(line) {
  const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
  if (!match) {
    return null;
  }
  return { level: match[1].length, title: normalizeSearchText(match[2]) };
}

function extractMarkdownSections(text, requestedSections) {
  const wanted = requestedSections.map(normalizeSearchText).filter(Boolean);
  if (wanted.length === 0) {
    return "";
  }
  const lines = text.split(/\r?\n/);
  const output = [];
  let activeLevel = 0;
  let active = false;
  for (const line of lines) {
    const heading = headingName(line);
    if (heading) {
      if (active && heading.level <= activeLevel) {
        active = false;
      }
      if (wanted.some((section) => heading.title === section || heading.title.startsWith(`${section} `))) {
        active = true;
        activeLevel = heading.level;
      }
    }
    if (active) {
      output.push(line);
    }
  }
  return output.join("\n").trim();
}

function selectTemplateRoutes(profile, intent) {
  const routes = profile.template_routes ?? [];
  const scored = routes
    .map((route) => ({
      ...route,
      __score: Math.max(0, ...(route.keywords ?? []).map((keyword) => phraseScore(intent, keyword)))
    }))
    .filter((route) => route.__score > 0)
    .sort((left, right) => right.__score - left.__score);
  return scored.length > 0 ? scored.slice(0, 1).map(({ __score, ...route }) => route) : [];
}

async function projectTemplates(profiles, intent) {
  const projections = [];
  for (const profile of profiles) {
    const selected = [...(profile.template_projections ?? []), ...selectTemplateRoutes(profile, intent)];
    for (const projection of selected) {
      const filePath = resolveRuntimeReference(projection.path);
      if (!filePath || !(await exists(filePath))) {
        projections.push({ path: projection.path, sections: projection.sections ?? [], status: "missing" });
        continue;
      }
      const source = await fs.readFile(filePath, "utf8");
      const projected = extractMarkdownSections(source, projection.sections ?? []);
      const content = projected || (Buffer.byteLength(source) <= 4000 ? source.trim() : "");
      projections.push({
        path: projection.path,
        sections: projection.sections ?? [],
        status: content ? "projected" : "reference_only",
        source_bytes: Buffer.byteLength(source),
        projected_bytes: Buffer.byteLength(content),
        ...(content ? { content } : {})
      });
    }
  }
  const seen = new Set();
  return projections.filter((projection) => {
    const key = `${projection.path}:${(projection.sections ?? []).join("|")}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function collectRuleIds(value, target = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(RULE_ID_PATTERN)) {
      target.add(match[0]);
    }
    return target;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectRuleIds(entry, target));
    return target;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      collectRuleIds(key, target);
      collectRuleIds(entry, target);
    });
  }
  return target;
}

function compactRecipe(ruleId, recipe, defaults) {
  if (!recipe) {
    return {
      rule_id: ruleId,
      status: "missing_recipe",
      fallback: defaults?.fallback ?? "Stop with Required Revisions or Missing Inputs instead of guessing."
    };
  }
  return {
    rule_id: ruleId,
    status: "resolved",
    cause: recipe.cause,
    deterministic_fix: recipe.deterministicFix,
    owning_guidance: recipe.owningGuidance ?? [],
    verification: recipe.verification ?? defaults?.verification ?? []
  };
}

function capsuleFingerprint(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 20);
}

function fitCapsuleToBudget(capsule, maxBytes, { allowFurtherCompaction = false } = {}) {
  let encoded = JSON.stringify(capsule);
  if (Buffer.byteLength(encoded) <= maxBytes) {
    return capsule;
  }
  const compact = structuredClone(capsule);
  for (const projection of compact.template_projections ?? []) {
    delete projection.content;
    compact.budget_status = "template_content_omitted";
    if (Buffer.byteLength(JSON.stringify(compact)) <= maxBytes) {
      return compact;
    }
  }
  compact.best_practices = (compact.best_practices ?? []).map(({ rule_id, summary, owner }) => ({ rule_id, summary, owner }));
  compact.budget_status = "compact_rule_cards";
  const compactBytes = Buffer.byteLength(JSON.stringify(compact));
  if (compactBytes > maxBytes && !allowFurtherCompaction) {
    throw new Error(`context capsule cannot fit within ${maxBytes} bytes; minimum compact size is ${compactBytes} bytes`);
  }
  return compact;
}

/**
 * Resolve a compact, task-specific best-practice capsule without exposing full catalogs to the model.
 */
export async function resolveContextCapsule({ intent, phase = "draft", maxBytes = DEFAULT_CONTEXT_BUDGET } = {}) {
  const normalizedIntent = normalizeSearchText(intent);
  if (!normalizedIntent) {
    throw new Error("context resolve requires a non-empty intent");
  }
  const assets = activeAssetPaths();
  const [catalog, recipeCatalog, patternCatalog, packCatalog, componentRegistry] = await Promise.all([
    readJson(assets.rules),
    readJson(assets.recipes),
    readJson(assets.patterns),
    readJson(assets.packs),
    readJson(assets.components)
  ]);
  const profiles = selectProfiles(catalog, normalizedIntent);
  const components = selectComponents(componentRegistry, normalizedIntent);
  const patterns = selectPatterns(patternCatalog, packCatalog, normalizedIntent);
  const rules = selectRuleCards(catalog, normalizedIntent, profiles, patterns.flatMap((pattern) => pattern.validation_rules));
  const profileRuleIds = uniqueStrings(profiles.flatMap((profile) => profile.rule_ids ?? []));
  const profileRecipes = profileRuleIds
    .filter((ruleId) => recipeCatalog.recipes?.[ruleId])
    .map((ruleId) => compactRecipe(ruleId, recipeCatalog.recipes[ruleId], recipeCatalog.defaults));
  const templateProjections = await projectTemplates(profiles, normalizedIntent);
  const sourcePaths = uniqueStrings([
    ...rules.flatMap((rule) => [rule.owner, rule.details_doc, rule.examples_doc]),
    ...profiles.flatMap((profile) => profile.guidance_paths ?? []),
    ...patterns.flatMap((pattern) => pattern.reference_paths ?? []),
    ...components.flatMap((component) => [...component.rules, ...component.templates, component.workflow]),
    ...templateProjections.map((projection) => projection.path)
  ]);
  const base = {
    schema_version: 1,
    kind: "apexlang_context_capsule",
    intent: String(intent).trim(),
    normalized_intent: normalizedIntent,
    phase,
    matched_profiles: profiles.map((profile) => profile.id),
    selected_patterns: patterns,
    selected_components: components,
    best_practices: rules,
    profile_directives: profiles.flatMap((profile) => profile.directives ?? []),
    applicable_repairs: phase === "revision" || phase === "critique" ? profileRecipes : [],
    template_projections: templateProjections,
    source_paths: sourcePaths,
    stop_conditions: catalog.stop_conditions ?? [],
    required_validation: catalog.required_validation ?? []
  };
  const fingerprint = capsuleFingerprint(base);
  const capsule = fitCapsuleToBudget({ ...base, fingerprint }, Number(maxBytes) || DEFAULT_CONTEXT_BUDGET);
  return {
    payload: capsule,
    fingerprint,
    bytes: Buffer.byteLength(JSON.stringify(capsule))
  };
}

/**
 * Resolve only deterministic repair recipes referenced by explicit rule IDs or a problems payload.
 */
export async function resolveRepairCapsule({ ruleIds = [], problems, unitId = "", irPointer = "" } = {}) {
  const assets = activeAssetPaths();
  const recipeCatalog = await readJson(assets.recipes);
  const selectedIds = collectRuleIds(problems, new Set(ruleIds.flatMap((value) => String(value).split(","))));
  const normalizedIds = [...selectedIds].map((value) => String(value).trim()).filter(Boolean).sort();
  if (normalizedIds.length === 0) {
    throw new Error("context repair requires --rule-id or a problems payload containing rule IDs");
  }
  const repairs = normalizedIds.map((ruleId) => compactRecipe(ruleId, recipeCatalog.recipes?.[ruleId], recipeCatalog.defaults));
  const payload = {
    schema_version: 1,
    kind: "apexlang_repair_capsule",
    ...(unitId ? { unit_id: unitId } : {}),
    ...(irPointer ? { ir_pointer: irPointer } : {}),
    rule_ids: normalizedIds,
    repairs,
    repair_policy: recipeCatalog.usage?.repairPolicy,
    required_response: recipeCatalog.usage?.requiredResponse
  };
  return {
    payload,
    fingerprint: capsuleFingerprint(payload),
    bytes: Buffer.byteLength(JSON.stringify(payload))
  };
}

function resolveCatalogPath(baseDir, value) {
  if (
    value.startsWith("references/policies/") ||
    value.startsWith("skills/") ||
    value.startsWith("applications/") ||
    value.startsWith("artifacts/")
  ) {
    return repoPath(value);
  }
  return path.resolve(baseDir, value);
}

function collectCatalogPaths(payload, issues, baseDir, label) {
  if (!payload || typeof payload !== "object") {
    issues.push(`${label} must be a JSON object`);
    return;
  }
  for (const [key, value] of Object.entries(payload)) {
    if (key.endsWith("_path") || key === "path") {
      if (typeof value !== "string" || !value) {
        issues.push(`${label}.${key} must be a non-empty string`);
      } else {
        const target = resolveCatalogPath(baseDir, value);
        issues.push({ __pathCheck: true, label: `${label}.${key}`, target });
      }
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === "object") {
          collectCatalogPaths(item, issues, baseDir, `${label}[${index}]`);
        }
      });
      continue;
    }
    if (value && typeof value === "object") {
      collectCatalogPaths(value, issues, baseDir, `${label}.${key}`);
    }
  }
}

/**
 * Validate catalog JSON files and confirm referenced paths exist.
 */
export async function verifyCatalogs() {
  const issues = [];
  const catalogFiles = [
    repoPath("references/policies", "routing-assets-index.json"),
    repoPath("references/policies", "routing-catalog-main.json"),
    repoPath("references/policies", "routing-load-policy.json"),
    repoPath("skills", "apexlang", "domains-catalog.json"),
    repoPath("skills", "sqlcl", "assets", "orchestration.manifest.json")
  ];

  for (const filePath of catalogFiles) {
    const payload = await readJson(filePath);
    collectCatalogPaths(payload, issues, path.dirname(filePath), path.relative(repoPath(), filePath));
  }

  const pathChecks = issues.filter((entry) => entry && typeof entry === "object" && entry.__pathCheck);
  const textIssues = issues.filter((entry) => typeof entry === "string");
  for (const check of pathChecks) {
    if (!(await exists(check.target))) {
      textIssues.push(`${check.label} references missing path: ${path.relative(repoPath(), check.target)}`);
    }
  }
  return textIssues;
}
