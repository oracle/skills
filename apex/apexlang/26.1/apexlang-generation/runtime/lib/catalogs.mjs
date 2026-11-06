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

function sortedUniqueStrings(values) {
  return uniqueStrings(values).sort((left, right) => left.localeCompare(right));
}

function missingPatternReadinessInputs(patterns, context = {}) {
  return sortedUniqueStrings(
    patterns.flatMap((pattern) => (pattern.readiness_required_inputs ?? [])
      .filter((input) => context[input] === undefined || context[input] === null || context[input] === ""))
  );
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

function routingMatches(intent, phrases = []) {
  return sortedUniqueStrings(phrases).filter((phrase) => phraseScore(intent, phrase) > 0);
}

function routingDescriptors(registry) {
  return (registry.components ?? [])
    .filter((component) => component.routing && typeof component.routing === "object")
    .map((component) => ({ component, routing: component.routing }));
}

function sourceIntentForRouting(intent, context, mode) {
  if (mode === "partial") {
    return String(context?.sourceIntent || "sessionState");
  }
  const explicit = normalizeSearchText(
    context?.sourceIntent
      || context?.sourceType
      || context?.source?.type
      || intent
  );
  if (/(?:rest|web source|remote server)/.test(explicit)) return "restSource";
  if (/(?:json duality|duality view)/.test(explicit)) return "jsonDualityView";
  if (/(?:json source|json collection)/.test(explicit)) return "jsonSource";
  if (/(?:property graph|graph source)/.test(explicit)) return "propertyGraph";
  if (/(?:function body|plsql function|javascript function)/.test(explicit)) return "functionBody";
  if (/(?:sample data|sample-data)/.test(explicit)) return "sampleData";
  return "localDatabase";
}

function placementIntentForRouting(intent, context) {
  const explicit = normalizeSearchText(
    context?.placementIntent
      || context?.placement
      || (context?.parentRegion ? "nested" : "")
  );
  const nested = explicit === "nested"
    || /(?:nested|inside|within|under|embedded|child region|subregion|sub regions)/.test(explicit)
    || /(?:nested|inside|within|under|embedded|child region|subregion|sub regions)/.test(intent);
  return nested ? "nested" : "topLevel";
}

function routeOwner({ component, routing }) {
  return routing.owner || component.name;
}

function routeSignals({ routing }, intent) {
  const signalGroups = routing.signalGroups ?? {};
  const matchedSignalGroups = Object.entries(signalGroups)
    .filter(([, phrases]) => routingMatches(intent, phrases).length > 0)
    .map(([group]) => group);
  const featureSignals = Object.entries(routing.featureSignals ?? {})
    .filter(([, phrases]) => routingMatches(intent, phrases).length > 0)
    .map(([feature]) => feature);
  const competingMatches = Object.fromEntries(
    Object.entries(routing.competingSignals ?? {})
      .map(([candidate, phrases]) => [candidate, routingMatches(intent, phrases)])
      .filter(([, matches]) => matches.length > 0)
  );
  const rowEvidence = routingMatches(intent, routing.rowEvidence ?? []).length > 0;
  const fallback = routing.semanticFallback ?? {};
  const requiredGroups = fallback.requiredSignalGroups ?? [];
  const semanticFallback = requiredGroups.length > 0
    && requiredGroups.every((group) => matchedSignalGroups.includes(group))
    && (!fallback.requireRowEvidence || rowEvidence);
  return {
    matchedSignalGroups,
    featureSignals,
    competingMatches,
    aliases: routingMatches(intent, routing.aliases ?? []),
    semanticFallback
  };
}

function routeMode(intent, routing) {
  const mode = routing.mode ?? {};
  const partialSignals = mode.partialSignals ?? [];
  return partialSignals.some((phrase) => routingMatches(intent, [phrase]).length > 0)
    ? "partial"
    : mode.default ?? "report";
}

function supportsSourceIntent(routing, mode, sourceIntent) {
  const adapters = (routing.sourceAdapters?.[mode] ?? [])
    .map((entry) => typeof entry === "string" ? entry : entry?.adapter)
    .filter(Boolean);
  return adapters.includes(sourceIntent)
    || adapters.some((adapter) => String(adapter).startsWith(`${sourceIntent}/`));
}

function selectRoutingSelector(descriptors, normalizedIntent, selectorField) {
  const selectorCandidates = descriptors.flatMap(({ component, routing }) =>
    Object.entries(routing[selectorField] ?? {}).map(([group, phrases]) => ({
      group,
      owner: group === "direct" ? (routing.owner || component.name) : group,
      descriptor: { component, routing },
      matches: routingMatches(normalizedIntent, phrases),
      precedence: (routing.precedence ?? []).indexOf(group),
      weight: Number(routing.selectorWeights?.[group] ?? 0)
    }))
  ).filter(({ matches }) => matches.length > 0);
  return selectorCandidates
    .sort((left, right) => {
      const score = (candidate) => Math.max(0, ...candidate.matches.map((phrase) => phraseScore(normalizedIntent, phrase)));
      return score(right) + right.weight - score(left) - left.weight
        || (left.precedence < 0 ? Number.MAX_SAFE_INTEGER : left.precedence) - (right.precedence < 0 ? Number.MAX_SAFE_INTEGER : right.precedence)
        || left.owner.localeCompare(right.owner);
    })[0];
}

/**
 * Resolve owner/mode/source/placement before component/profile scoring.
 * Priority: explicit selectors, eligible competing signals, aliases, fallback
 * selectors, semantic fallback, then generic component scoring. Competing
 * signals require an explicit alias or satisfied semantic fallback on their
 * owning route. Both selector groups use the registry's weights and precedence;
 * omitted groups have no candidates.
 */
export function resolveRoutingDecision({ registry, intent, context = {} } = {}) {
  const descriptors = routingDescriptors(registry ?? {});
  const normalizedIntent = normalizeSearchText(intent);
  const routes = descriptors.map((descriptor) => ({
    ...descriptor,
    owner: routeOwner(descriptor),
    signals: routeSignals(descriptor, normalizedIntent)
  }));
  const selectedSelector = selectRoutingSelector(descriptors, normalizedIntent, "selectorGroups");

  let owner = "";
  let routeReason = "";
  let activeRoute = null;
  if (selectedSelector) {
    owner = selectedSelector.owner;
    routeReason = `explicit-${selectedSelector.group}-selector`;
    activeRoute = routes.find(({ component }) => component.name === selectedSelector.descriptor.component.name) || null;
  } else {
    const competingCandidate = routes
      .filter((route) => route.signals.aliases.length > 0 || route.signals.semanticFallback)
      .flatMap((route) =>
        (route.routing.competingOrder ?? Object.keys(route.signals.competingMatches).sort())
          .filter((candidate) => route.signals.competingMatches[candidate]?.length > 0)
          .map((candidate, index) => ({ route, owner: candidate, index })))
      .sort((left, right) => left.index - right.index || left.owner.localeCompare(right.owner))[0];
    if (competingCandidate) {
      owner = competingCandidate.owner;
      routeReason = "explicit-competing-component-selector";
      activeRoute = competingCandidate.route;
    } else {
      const routeCandidate = routes
        .filter((route) => route.signals.aliases.length > 0 || route.signals.semanticFallback)
        .sort((left, right) => {
          const leftExplicit = left.signals.aliases.length > 0 ? 1 : 0;
          const rightExplicit = right.signals.aliases.length > 0 ? 1 : 0;
          return rightExplicit - leftExplicit
            || right.signals.matchedSignalGroups.length - left.signals.matchedSignalGroups.length
            || left.owner.localeCompare(right.owner);
        })[0];
      // Generic template wording yields to aliases, but still beats semantic inference.
      const fallbackSelector = routeCandidate?.signals.aliases.length > 0
        ? null
        : selectRoutingSelector(descriptors, normalizedIntent, "fallbackSelectorGroups");
      if (fallbackSelector) {
        owner = fallbackSelector.owner;
        routeReason = `fallback-${fallbackSelector.group}-selector`;
        activeRoute = routes.find(({ component }) => component.name === fallbackSelector.descriptor.component.name) || null;
      } else if (routeCandidate) {
        owner = routeCandidate.owner;
        routeReason = routeCandidate.signals.aliases.length > 0
          ? "explicit-component-alias"
          : "semantic-component-fallback";
        activeRoute = routeCandidate;
      }
    }
  }

  if (!owner && routes.some((route) => route.signals.matchedSignalGroups.includes("collection"))) {
    const genericCandidates = (registry.components ?? [])
      .map((component) => ({
        name: component.name,
        score: Math.max(0, ...[
          component.name,
          humanizeIdentifier(component.name),
          ...(component.synonyms ?? [])
        ].map((phrase) => phraseScore(normalizedIntent, phrase)))
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
    if (genericCandidates[0]) {
      owner = genericCandidates[0].name;
      routeReason = "closest-supported-route";
    }
  }

  const config = activeRoute?.routing ?? {};
  const signals = activeRoute?.signals ?? {
    matchedSignalGroups: [], featureSignals: [], competingMatches: {}, semanticFallback: false
  };
  const isDirectOwner = owner === activeRoute?.owner;
  const mode = routeMode(normalizedIntent, config);
  const sourceIntent = sourceIntentForRouting(normalizedIntent, context, mode);
  const placementIntent = placementIntentForRouting(normalizedIntent, context);

  const missingInputs = [];
  if (isDirectOwner && !supportsSourceIntent(config, mode, sourceIntent)) {
    missingInputs.push(`unsupported-source-adapter:${sourceIntent}`);
  }
  for (const feature of config.unsupportedFeatures ?? []) {
    if (signals.featureSignals.includes(feature)) {
      missingInputs.push(`unsupported-feature:${feature}`);
    }
  }
  if (isDirectOwner && placementIntent === "nested" && config.placement?.nested?.requiresParentRegion && !context?.parentRegion) {
    missingInputs.push("parentRegion");
  }

  const suppressedCandidates = [
    ...(config.suppressedCandidates?.[owner] ?? []),
    ...(isDirectOwner ? Object.keys(signals.competingMatches) : [])
  ];

  const normalizedMissingInputs = sortedUniqueStrings(missingInputs);
  return {
    owner: owner || null,
    status: normalizedMissingInputs.length > 0 ? "blocked" : "ready",
    mode,
    matchedSignalGroups: sortedUniqueStrings(signals.matchedSignalGroups),
    suppressedCandidates: sortedUniqueStrings(suppressedCandidates),
    featureSignals: sortedUniqueStrings(signals.featureSignals),
    placementIntent,
    sourceIntent,
    missingInputs: normalizedMissingInputs,
    __preferredComponent: owner || null,
    __routeReason: routeReason,
    __explicit: Boolean(owner),
    __semanticFallback: signals.semanticFallback
  };
}

function completeRoutingDecision(decision, components) {
  if (decision.owner) {
    return decision;
  }
  const fallbackOwner = components[0]?.name || null;
  const missingInputs = fallbackOwner
    ? decision.missingInputs
    : sortedUniqueStrings([...decision.missingInputs, "supported-component-route"]);
  return {
    ...decision,
    owner: fallbackOwner,
    __preferredComponent: fallbackOwner,
    __routeReason: fallbackOwner ? "closest-supported-route" : "missing-inputs",
    missingInputs,
    status: missingInputs.length > 0 ? "blocked" : "ready"
  };
}

function intentExplicitlyExcludesIcons(intent) {
  return /\b(?:without|omit|omits|exclude|excludes)\s+(?:an?\s+|the\s+)?(?:icon|icons|checkmark|glyph|pictogram)\b/.test(intent)
    || /\bno\s+(?:icon|icons|checkmark|glyph|pictogram)\b/.test(intent)
    || /\bdo(?:es)?\s+not\s+(?:use|add|show|include)\s+(?:an?\s+|the\s+)?(?:icon|icons|checkmark|glyph|pictogram)\b/.test(intent)
    || /\bicon\s+free\b/.test(intent);
}

function intentRequestsNestedCommentsBadge(intent) {
  if (!/\bcomments?\b/.test(intent) || !/\bbadges?\b/.test(intent)) {
    return false;
  }
  return /\b(?:on|in|inside|within|for|to|with|beside|per)\s+(?:each\s+|every\s+|the\s+)?comments?\b/.test(intent)
    || /\b(?:each|every)\s+comments?\b[^.]*\bbadges?\b/.test(intent);
}

function intentRequestsCommentsColumn(intent) {
  return /\bcomments?\s+(?:(?:interactive\s+report|ir)\s+)?column\b/.test(intent)
    || /\b(?:interactive\s+report|ir)\s+comments?\s+column\b/.test(intent)
    || /\b(?:interactive\s+report|ir)\s+column\b[^.]*\bcomments?\b/.test(intent);
}

function matchesSelectedComponents(entry, selectedComponentIds) {
  const componentIds = entry.component_ids ?? [];
  return componentIds.length === 0
    || selectedComponentIds.size === 0
    || componentIds.some((componentId) => selectedComponentIds.has(componentId));
}

function selectProfiles(catalog, intent, selectedComponentIds, maxProfiles = 2, routingDecision = {}) {
  const excludesIcons = intentExplicitlyExcludesIcons(intent);
  const ranked = (catalog.profiles ?? [])
    .map((profile) => ({
      ...profile,
      __score: Math.max(
        routingDecision.owner && profile.id === routingDecision.owner ? 1000 : 0,
        ...(profile.keywords ?? []).map((keyword) => phraseScore(intent, keyword)),
        ...(profile.routing?.aliases ?? []).map((alias) => phraseScore(intent, alias))
      )
    }))
    .filter((profile) => profile.__score >= 3
      && !(excludesIcons && profile.id === "icons")
      && matchesSelectedComponents(profile, selectedComponentIds))
    .sort((left, right) => right.__score - left.__score || String(left.id).localeCompare(String(right.id)));
  const topScore = ranked[0]?.__score ?? 0;
  const selected = ranked
    .filter((profile, index) => index === 0 || profile.__score >= topScore * 0.75)
    .slice(0, maxProfiles);
  const iconProfile = ranked.find((profile) => profile.id === "icons" && profile.__score >= 4);
  if (iconProfile && !selected.some((profile) => profile.id === "icons")) {
    selected.splice(Math.max(0, maxProfiles - 1), 1, iconProfile);
  }
  return selected.map(({ __score, ...profile }) => profile);
}

function routingPhraseScore(intent, phrase) {
  return phraseScore(intent, phrase);
}

function explicitSelectorScore(intent, component) {
  return Math.max(0, ...(component.routing?.explicitSelectors ?? []).map((selector) => {
    const normalizedSelector = normalizeSearchText(selector);
    if (!normalizedSelector || !` ${intent} `.includes(` ${normalizedSelector} `)) {
      return 0;
    }
    return Math.max(4, normalizedSelector.split(" ").length * 3);
  }));
}

function matchedSignalGroups(intent, routing) {
  return Object.entries(routing?.semanticSignalGroups ?? {})
    .filter(([, signals]) => Math.max(0, ...(signals ?? []).map((signal) => routingPhraseScore(intent, signal))) > 0)
    .map(([group]) => group)
    .sort((left, right) => left.localeCompare(right));
}

function matchedFeatureSignals(intent, routing) {
  return Object.entries(routing?.featureSignals ?? {})
    .filter(([, signals]) => Math.max(0, ...(signals ?? []).map((signal) => routingPhraseScore(intent, signal))) > 0)
    .map(([feature]) => feature)
    .sort((left, right) => left.localeCompare(right));
}

function resolveComponentRouting(registry, intent, ranked) {
  const metricEntry = ranked.find(({ component }) => component.name === "metric-card")?.component
    ?? (registry.components ?? []).find((component) => component.name === "metric-card");
  const routing = metricEntry?.routing ?? {};
  const explicitMetric = metricEntry && explicitSelectorScore(intent, metricEntry) > 0;
  const semanticMatches = matchedSignalGroups(intent, routing);
  const requiredSemanticGroups = routing.requiredSemanticSignalGroups ?? [];
  const semanticMetric = requiredSemanticGroups.length > 0
    && requiredSemanticGroups.every((group) => semanticMatches.includes(group));
  const owner = explicitMetric || semanticMetric ? "metric-card" : null;
  const mode = explicitMetric && (routing.partialTriggers ?? []).some((phrase) => routingPhraseScore(intent, phrase) > 0)
    ? "partial"
    : explicitMetric || semanticMetric
      ? routing.defaultMode ?? "report"
      : null;
  const placementIntent = /\b(?:nested|inside|under|within)\b/.test(intent) ? "nested" : "topLevel";
  const featureSignals = matchedFeatureSignals(intent, routing);
  const sourceAdapters = routing.sourceAdapters?.[mode] ?? [];
  const matchedSources = sourceAdapters.filter((entry) =>
    (entry.signals ?? []).some((signal) => routingPhraseScore(intent, signal) > 0));
  const sourceIntent = matchedSources.length === 1 ? matchedSources[0].adapter : null;
  const missingInputs = [];

  if ((explicitMetric || semanticMetric) && matchedSources.length === 0) {
    missingInputs.push("source adapter");
  }
  if (matchedSources.length > 1) {
    missingInputs.push("unambiguous source adapter");
  }
  if (semanticMetric) {
    missingInputs.push("source projection evidence");
  }
  if (placementIntent === "nested") {
    missingInputs.push("existing parent static ID and verified slot");
  }
  if (!explicitMetric && !semanticMetric && semanticMatches.length > 0) {
    missingInputs.push("complete Metric Card semantic signal groups");
  }

  return {
    owner,
    mode,
    matchedSignalGroups: explicitMetric
      ? ["explicit-component", ...semanticMatches].sort((left, right) => left.localeCompare(right))
      : semanticMatches,
    suppressedCandidates: owner ? [...(routing.suppresses ?? [])].sort((left, right) => left.localeCompare(right)) : [],
    featureSignals,
    placementIntent,
    sourceIntent,
    missingInputs: [...new Set(missingInputs)].sort((left, right) => left.localeCompare(right))
  };
}

function projectComponent(component, intent, routingDecision = {}) {
  const commentsColumn = intentRequestsCommentsColumn(intent);
  const conditionalTemplates = (component.conditionalTemplates ?? [])
    .filter((route) => {
      if (component.name !== "comments") return true;
      const isPartialColumnRoute = route.templates?.some(
        (template) => template.endsWith("comments/comments.partial-column.md")
      );
      if (isPartialColumnRoute) return commentsColumn;
      if (!commentsColumn) return true;
      return route.templates?.some((template) => template.endsWith("avatar/avatar._template_options.md"))
        && /\b(?:avatar|author\s+(?:icon|initials)|profile\s+(?:image|picture)|user\s+(?:icon|initials))\b/.test(intent);
    })
    .filter((route) => Math.max(
      0,
      ...(route.keywords ?? []).map((keyword) => phraseScore(intent, keyword)),
      ...(route.featureSignals ?? []).map((feature) => routingDecision.featureSignals?.includes(feature) ? 4 : 0)
    ) > 0)
    .flatMap((route) => route.templates ?? []);
  return {
    name: component.name,
    target_type: component.target_type,
    rules: component.rules ?? [],
    templates: uniqueStrings([...(component.templates ?? []), ...conditionalTemplates]),
    requires: component.requires ?? {},
    applicationSettings: component.applicationSettings ?? [],
    routing: component.routing ?? {},
    workflow: component.workflow,
    ...(component.routing?.semanticSupport ? { semantic_support: sortedUniqueStrings(component.routing.semanticSupport) } : {})
  };
}

function selectComponents(registry, intent, maxComponents = 4, preferredComponentIds = [], routingDecision = {}) {
  const priority = new Map();
  for (const entry of registry.synonymPriority ?? []) {
    if (phraseScore(intent, entry.synonym) > 0) {
      priority.set(entry.prefer, 0.5);
    }
  }
  const ranked = (registry.components ?? [])
    .map((component) => {
      const phrases = [
        component.name,
        humanizeIdentifier(component.name),
        ...(component.synonyms ?? []),
        ...(component.routing?.aliases ?? [])
      ];
      return {
        component,
        explicitScore: explicitSelectorScore(intent, component),
        score: Math.max(0, ...phrases.map((phrase) => phraseScore(intent, phrase)))
          + (priority.get(component.name) ?? 0)
          + (explicitSelectorScore(intent, component) > 0 ? 100 : 0)
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.component.name).localeCompare(String(right.component.name)));
  const preferred = [...new Set(preferredComponentIds.filter(Boolean))]
    .map((name) => ranked.find((entry) => entry.component.name === name)
      || { component: (registry.components ?? []).find((component) => component.name === name), score: Number.MAX_SAFE_INTEGER })
    .filter((entry) => entry.component);
  const preferredNames = new Set(preferred.map(({ component }) => component.name));
  const rankedUnforced = ranked.filter(({ component }) => !preferredNames.has(component.name));
  if (preferred.length > 0) {
    return preferred.map(({ component }) => projectComponent(component, intent, routingDecision));
  }
  const topScore = rankedUnforced[0]?.score ?? 0;
  const selected = [...preferred];
  for (const entry of rankedUnforced) {
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
  const explicitSelected = selected.filter(({ explicitScore }) => explicitScore > 0);
  const routingSuppressions = new Set(explicitSelected.flatMap(({ component }) => component.routing?.suppresses ?? []));
  const exclusions = new Set(selected.flatMap(({ component }) => component.excludes ?? []));
  const nestedCommentsBadge = intentRequestsNestedCommentsBadge(intent);
  const resolved = selected
    .filter(({ component, explicitScore }) =>
      !exclusions.has(component.name)
      && (!routingSuppressions.has(component.name) || explicitScore > 0))
    .filter(({ component }) => !(nestedCommentsBadge && component.name === "badge"));
  if (nestedCommentsBadge && !resolved.some(({ component }) => component.name === "comments")) {
    const comments = (registry.components ?? []).find((component) => component.name === "comments");
    if (comments) {
      resolved.unshift({ component: comments, score: topScore });
    }
  }
  return resolved.slice(0, maxComponents)
    .map(({ component }) => projectComponent(component, intent, routingDecision));
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
    ...((pattern.contract ?? pack?.contract) ? { contract: pattern.contract ?? pack.contract } : {}),
    reference_paths: pattern.reference_paths ?? []
  };
}

function selectRuleCards(catalog, intent, profiles, additionalRuleIds = [], selectedComponentIds = new Set()) {
  const excludesIcons = intentExplicitlyExcludesIcons(intent);
  const requiredIds = new Set([
    ...(catalog.core_rule_ids ?? []),
    ...profiles.flatMap((profile) => profile.rule_ids ?? []),
    ...additionalRuleIds
  ]);
  return (catalog.rules ?? [])
    .filter((rule) => {
      if (!matchesSelectedComponents(rule, selectedComponentIds)) {
        return false;
      }
      if (excludesIcons && rule.rule_id === "FA_ICON_REQUIRED_001") {
        return false;
      }
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
        (pattern.selection_exclude_any ?? []).some((keyword) => phraseScore(intent, keyword) > 0) ||
        ((pattern.selection_require_any ?? []).length > 0 &&
          !(pattern.selection_require_any ?? []).some((keyword) => phraseScore(intent, keyword) > 0))
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
      ...(pattern.readiness_required_inputs ? { readiness_required_inputs: pattern.readiness_required_inputs } : {}),
      optional_inputs: pack?.inputs?.optional ?? [],
      generated_components: pattern.generated_components ?? pack?.components ?? [],
      renderer_rules: pack?.renderer_rules ?? [],
      validation_rules: uniqueStrings([...(pattern.validation_rules ?? []), ...(pack?.validation_rules ?? [])]),
      ...((pattern.contract ?? pack?.contract) ? { contract: pattern.contract ?? pack.contract } : {}),
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

function selectTemplateRoutes(profile, intent, routingDecision = {}) {
  const routes = profile.template_routes ?? [];
  const scored = routes
    .map((route) => ({
      ...route,
      __score: Math.max(
        0,
        ...(route.keywords ?? []).map((keyword) => phraseScore(intent, keyword)),
        ...(route.featureSignals ?? []).map((feature) => routingDecision.featureSignals?.includes(feature) ? 4 : 0)
      )
    }))
    .filter((route) => route.__score > 0)
    .sort((left, right) => right.__score - left.__score);
  return scored.length > 0 ? scored.slice(0, 1).map(({ __score, ...route }) => route) : [];
}

async function projectTemplates(profiles, intent, routingDecision = {}) {
  const projections = [];
  for (const profile of profiles) {
    const selected = [...(profile.template_projections ?? []), ...selectTemplateRoutes(profile, intent, routingDecision)];
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
  compact.best_practices = (compact.best_practices ?? []).map(({ rule_id, summary, owner }) => ({ rule_id, summary, owner }));
  compact.budget_status = "compact_rule_cards";
  if (Buffer.byteLength(JSON.stringify(compact)) <= maxBytes) {
    return compact;
  }
  for (const projection of compact.template_projections ?? []) {
    delete projection.content;
    compact.budget_status = "template_content_omitted";
    if (Buffer.byteLength(JSON.stringify(compact)) <= maxBytes) {
      return compact;
    }
  }
  if (Buffer.byteLength(JSON.stringify(compact)) > maxBytes) {
    // Matching inputs are redundant after routing_decision is resolved. Keep
    // source, placement, and feature constraints needed by generation.
    for (const component of compact.selected_components ?? []) {
      for (const key of [
        "selectorGroups", "fallbackSelectorGroups", "selectorWeights", "precedence",
        "competingOrder", "competingSignals", "suppressedCandidates", "aliases",
        "semanticFallback", "signalGroups", "rowEvidence", "featureSignals"
      ]) {
        if (component.routing) delete component.routing[key];
      }
    }
    compact.budget_status = "compact_routing_metadata";
  }
  const compactBytes = Buffer.byteLength(JSON.stringify(compact));
  if (compactBytes > maxBytes && !allowFurtherCompaction) {
    throw new Error(`context capsule cannot fit within ${maxBytes} bytes; minimum compact size is ${compactBytes} bytes`);
  }
  return compact;
}

/**
 * Resolve a compact, task-specific best-practice capsule without exposing full catalogs to the model.
 */
export async function resolveContextCapsule({ intent, phase = "draft", maxBytes = DEFAULT_CONTEXT_BUDGET, context = {}, routingContext = {} } = {}) {
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
  const resolvedContext = Object.keys(context).length > 0 ? context : routingContext;
  const initialRoutingDecision = resolveRoutingDecision({
    registry: componentRegistry,
    intent: normalizedIntent,
    context: resolvedContext
  });
  const components = selectComponents(
    componentRegistry,
    normalizedIntent,
    4,
    initialRoutingDecision.__preferredComponent ? [initialRoutingDecision.__preferredComponent] : [],
    initialRoutingDecision
  );
  const completedRoutingDecision = completeRoutingDecision(initialRoutingDecision, components);
  const rankedComponents = (componentRegistry.components ?? [])
    .map((component) => ({ component, explicitScore: explicitSelectorScore(normalizedIntent, component) }))
    .filter(({ component }) => component.name === "metric-card" || component.routing?.suppresses?.length)
    .sort((left, right) => String(left.component.name).localeCompare(String(right.component.name)));
  const componentRouting = resolveComponentRouting(componentRegistry, normalizedIntent, rankedComponents);
  const selectedComponentIds = new Set(components.map((component) => component.name));
  const profiles = selectProfiles(catalog, normalizedIntent, selectedComponentIds, 2, completedRoutingDecision);
  const patterns = selectPatterns(patternCatalog, packCatalog, normalizedIntent);
  const missingInputs = sortedUniqueStrings([
    ...completedRoutingDecision.missingInputs,
    ...missingPatternReadinessInputs(patterns, resolvedContext)
  ]);
  const routingDecision = {
    ...completedRoutingDecision,
    missingInputs,
    status: missingInputs.length > 0 ? "blocked" : "ready"
  };
  const rules = selectRuleCards(
    catalog,
    normalizedIntent,
    profiles,
    patterns.flatMap((pattern) => pattern.validation_rules),
    selectedComponentIds
  );
  const profileRuleIds = uniqueStrings(profiles.flatMap((profile) => profile.rule_ids ?? []));
  const profileRecipes = profileRuleIds
    .filter((ruleId) => recipeCatalog.recipes?.[ruleId])
    .map((ruleId) => compactRecipe(ruleId, recipeCatalog.recipes[ruleId], recipeCatalog.defaults));
  const templateProjections = await projectTemplates(profiles, normalizedIntent, routingDecision);
  const selectedRegistryComponents = (componentRegistry.components ?? [])
    .filter((component) => selectedComponentIds.has(component.name));
  const sourcePaths = uniqueStrings([
    ...rules.flatMap((rule) => [rule.owner, rule.details_doc, rule.examples_doc]),
    ...profiles.flatMap((profile) => profile.guidance_paths ?? []),
    ...patterns.flatMap((pattern) => pattern.reference_paths ?? []),
    ...components.flatMap((component) => [...component.rules, ...component.templates, component.workflow]),
    ...selectedRegistryComponents.flatMap((component) => component.routing?.semanticSupport ?? []),
    ...templateProjections.map((projection) => projection.path)
  ]);
  const base = {
    schema_version: 1,
    kind: "apexlang_context_capsule",
    intent: String(intent).trim(),
    normalized_intent: normalizedIntent,
    phase,
    generation_status: routingDecision.status,
    matched_profiles: profiles.map((profile) => profile.id).sort((left, right) => left.localeCompare(right)),
    routing_decision: Object.fromEntries(
      Object.entries(routingDecision).filter(([key]) => !key.startsWith("__"))
    ),
    component_routing: componentRouting,
    selected_patterns: patterns.map(({ readiness_required_inputs, ...pattern }) => pattern),
    selected_components: components,
    best_practices: rules,
    profile_directives: profiles.flatMap((profile) => profile.directives ?? []),
    applicable_repairs: phase === "revision" || phase === "critique" ? profileRecipes : [],
    template_projections: templateProjections,
    source_paths: sourcePaths.sort((left, right) => left.localeCompare(right)),
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
