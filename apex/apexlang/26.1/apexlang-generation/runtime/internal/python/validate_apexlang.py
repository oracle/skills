#!/usr/bin/env python3
"""Validate APEXlang DSL contracts and layout rules."""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from functools import wraps
import html
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urljoin, urlsplit

from validator_common import (
    APEXLANG_GRAMMAR_PATH,
    COMPONENT_ATTRIBUTES_PATH,
    FONT_APEX_ICON_INDEX_PATH,
    LOG_ROOT,
    PACKAGED_SKILL,
    ROOT,
    collect_targets,
    display_path,
    issue_to_record,
    line_no,
    load_runtime_component_map,
    write_report,
)

SCHEMA_PATH = COMPONENT_ATTRIBUTES_PATH
INLINE_BLOCK_CHAR_LIMIT = 4000
DEFAULT_REPORT = LOG_ROOT / "apexlang-dsl-report.json"
APP_ROOT_ALLOWED_ENTRIES = {
    ".apex",
    "application.apx",
    "deployments",
    "page-groups.apx",
    "pages",
    "shared-components",
    "supporting-objects",
}
APP_ROOT_FORBIDDEN_TEMPLATE_ARTIFACTS = {
    "README.md",
    "base-app-structure._common.md",
    "base-app-structure._index.md",
    "base-app-structure.registry.json",
}
APP_UX_CONTRACT_FILENAME = "app-ux-contract.json"
APP_UX_CONTRACT_RELATIVE_PATH = Path(".apexlang") / APP_UX_CONTRACT_FILENAME
LEGACY_APP_UX_CONTRACT_RELATIVE_PATH = Path(".apex") / APP_UX_CONTRACT_FILENAME
EXPORT_BACKUP_PATH_SEGMENT = "apex-exports"
SMART_FILTER_ALLOWED_RESULTS_REGION_TYPES = {
    "classicReport",
    "cards",
    "map",
    "calendar",
}
SMART_FILTER_FORBIDDEN_RESULTS_REGION_TYPES = {
    "smartFilters",
    "facetedSearch",
}
SMART_FILTER_MATCH_SEMANTICS = {"contains", "starts", "exact"}
SMART_FILTER_TOKENIZATION_DECISIONS = (
    "trimming",
    "repeated_whitespace",
    "punctuation_boundaries",
    "case_normalization",
    "accent_normalization",
    "duplicate_tokens",
    "token_order",
)
SMART_FILTER_TOKENIZATION_SCOPE = {"search", "suggestions", "refinements"}
SMART_FILTER_EVIDENCE_SOURCES = {"schema_doc", "live_db", "user_asserted"}
SMART_FILTER_PLAN_FILENAMES = (
    Path(".apexlang") / "smart-filter-generation-plan.json",
    Path(".apex") / "smart-filter-generation-plan.json",
    Path("smart-filter-generation-plan.json"),
)
STALE_TEMPLATE_OPTION_VALUES = {
    "end": "js-dialog-class-t-Drawer--pullOutEnd",
    "start": "js-dialog-class-t-Drawer--pullOutStart",
    "top": "js-dialog-class-t-Drawer--pullOutTop",
    "bottom": "js-dialog-class-t-Drawer--pullOutBottom",
    "use-current-breadcrumb-entry": "#DEFAULT#",
    "t-BreadcrumbRegion--useBreadcrumbTitle": "#DEFAULT#",
}
GENERIC_HELP_TEXT_VALUES = {
    "enter or review this value for the current record.",
    "enter or review this value.",
    "enter a value.",
    "enter value.",
}
MODAL_REPORT_REFRESH_REGION_TYPES = {
    "classicReport",
    "interactiveGrid",
    "interactiveReport",
}
IMAGE_UPLOAD_LEGACY_SETTINGS = {
    "storageType",
    "displayAs",
    "allowMultipleFiles",
    "maxFileSize",
    "displayDownloadLink",
    "downloadLinkText",
    "purgeFilesAt",
    "dropzoneTitle",
    "dropzoneDescription",
    "maxWidth",
    "maxHeight",
    "allowCropping",
    "aspectRatio",
    "customAspectRatio",
    "captureUsing",
    "previewSize",
}
IMAGE_UPLOAD_LEGACY_SOURCE_PROPERTIES = {
    "mimeTypeColumn",
    "filenameColumn",
    "blobLastUpdatedColumn",
}
FILE_UPLOAD_LEGACY_SETTINGS = {
    "storageType",
    "displayAs",
    "allowMultipleFiles",
    "fileTypes",
    "maxFileSize",
    "displayDownloadLink",
    "downloadLinkText",
    "contentDisposition",
    "purgeFileAt",
    "dropzoneTitle",
    "dropzoneDescription",
    "captureUsing",
}
FILE_UPLOAD_DISPLAY_PROPERTIES = {
    "displayAs",
    "dropzoneTitle",
    "dropzoneDesc",
    "allowCopyPaste",
    "captureUsing",
}
FILE_UPLOAD_STORAGE_PROPERTIES = {
    "type",
    "allowMultipleFiles",
    "fileTypes",
    "maxFileSize",
}
FILE_UPLOAD_DISPLAY_AS_VALUES = {
    "blockDropzone",
    "inlineDropzone",
    "nativeFileBrowse",
}
FILE_UPLOAD_CAPTURE_USING_VALUES = {
    "selfieCamera",
    "mainCamera",
}
FILE_UPLOAD_STORAGE_TYPE_VALUES = {
    "appTempFiles",
}
ICON_LITERAL_PROPERTIES = {
    "icon",
    "groupIcon",
    "imageIconCssClasses",
    "iconCssClasses",
    "linkIcon",
    "noDataFoundIcon",
}
_FONT_APEX_ICON_INDEX: tuple[set[str], set[str]] | None = None
AVATAR_URL_BIND_PATTERN = re.compile(
    r"(?is)^\s*:(APP_FILES|APEX_FILES)\s*\|\|\s*'((?:''|[^'])+)'\s*$"
)
AVATAR_CSS_FRAMEWORK_PREFIXES = ("a-", "is-", "js-", "t-", "u-")
AVATAR_CSS_ALWAYS_FORBIDDEN_PATTERNS = (
    re.compile(r"(?:^|[-_])hidden(?:$|[-_])"),
    re.compile(r"(?:^|[-_])visually[-_]?hidden(?:$|[-_])"),
    re.compile(r"(?:^|[-_])screen[-_]?reader(?:$|[-_])"),
    re.compile(r"(?:^|[-_])sr[-_]?only(?:$|[-_])"),
    re.compile(r"(?:^|[-_])hide(?:$|[-_]|[a-z])"),
    re.compile(r"(?:^|[-_])(?:invisible|offscreen|display[-_]?none|opacity[-_]?0|collapse[dp]?)(?:$|[-_]|[a-z])"),
)
BADGE_ALLOWED_STATE_VALUES = {"danger", "info", "success", "warning"}
BADGE_ALLOWED_VALUE_DATA_TYPES = {
    "date",
    "intervaldaytosecond",
    "intervalyeartomonth",
    "number",
    "varchar2",
}
PROJECTION_COVERAGE_REGION_TYPES = {
    "avatar",
    "badge",
    "classicReport",
    "comments",
    "interactiveReport",
    "interactiveGrid",
    "contentRow",
    "mediaList",
    "metricCard",
    "timeline",
}
DASHBOARD_LAYOUT_ROW_REGION_TYPES = {
    "cards",
    "chart",
    "classicReport",
    "contentRow",
    "interactiveGrid",
    "interactiveReport",
    "metricCard",
}
DASHBOARD_LAYOUT_ROW_RECIPE_REGION_COUNTS = {
    "metric-card-strip": 1,
    "two-up-equal": 2,
    "three-up-equal": 3,
    "full-width-detail": 1,
    "single-full-width": 1,
    "contextual-summary": 1,
    "cards-full-width": 1,
    "stacked-content": 1,
}
DASHBOARD_LAYOUT_ROW_DISALLOWED_RECIPES = {
    "dashboard-chart-flow": "split chart regions into explicit two-up-equal and three-up-equal row entries",
}
DASHBOARD_PAGE_KEYWORDS = {
    "analytics",
    "dashboard",
    "kpi",
    "metric",
    "summary",
}
DASHBOARD_METRIC_FAKE_KEYWORDS = {
    "kpi",
    "metric",
    "metric-card",
    "metric_card",
    "summary-card",
}
DASHBOARD_KPI_CLASSIC_REPORT_SOURCE_KEYWORDS = {
    "metric_value",
    "metric_title",
    "metric_meta",
    "kpi_value",
    "kpi_title",
    "kpi_meta",
}
LOB_COMPARISON_RULE_ID = "SQL_PLSQL_LOB_COMPARISON_KEY_FORBIDDEN_001"
LOB_COMPARISON_REMEDIATION = (
    "raw LOB expressions can raise ORA-22848: cannot use BLOB type as comparison key; "
    "use scalar keys such as PK/FK, filename, MIME type, charset, last-updated timestamp, "
    "modeled checksum/hash, or dbms_lob.getlength(<lob_expr>) for file size"
)
CONFIG_BUILD_OPTION_BLOCK_META = {
    "allowedProperties": ["buildOption"],
}
CLASSIC_REPORT_CONTEXTUAL_INFO_APPEARANCE_OPTIONS = [
    "#DEFAULT#",
    "t-Region--hideHeader js-addHiddenHeadingRoleDesc",
    "t-Region--noUI",
]
LIVE_EXTERNAL_IDENTIFIER_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]*$")
SAVED_REPORT_VISIBILITY_FALLBACKS = {
    "interactiveGrid": ("primary", "alternative", "public", "private"),
    "interactiveReport": ("primaryDefault", "alternativeDefault", "public", "private"),
}
LintRunner = Callable[["LintContext"], list[str]]


@dataclass
class LintContext:
    """Shared context for one validator target."""

    path: Path
    text: str
    schema: dict[str, Any]
    validation_context: dict[str, Any] = field(default_factory=dict)
    runtime_component_map: dict[str, Any] | None = None
    cache: dict[str, Any] = field(default_factory=dict)


@dataclass
class ApexlangGrammarComponentContract:
    """Grammar-derived component shape used for template syntax linting."""

    keyword: str
    rule_name: str
    direct_properties: set[str] = field(default_factory=set)
    group_properties: dict[str, set[str]] = field(default_factory=dict)


@dataclass
class ApexlangTemplateSnippet:
    """One fenced apexlang snippet extracted from a Markdown template."""

    text: str
    offset: int


@dataclass
class ApexlangSnippetComponent:
    """One component declaration found inside a fenced apexlang snippet."""

    keyword: str
    offset: int
    text: str


@dataclass
class ApexlangAstProperty:
    """One source-located APX property captured from a component or group."""

    name: str
    value: str
    offset: int


@dataclass
class ApexlangAstComponent:
    """One APX component node with enough context for semantic validation."""

    keyword: str
    identifier: str
    start_offset: int
    end_offset: int
    text: str
    parent: "ApexlangAstComponent | None" = None
    children: list["ApexlangAstComponent"] = field(default_factory=list)
    direct_properties: dict[str, ApexlangAstProperty] = field(default_factory=dict)
    group_properties: dict[str, dict[str, ApexlangAstProperty]] = field(default_factory=dict)
    compiler_record: dict[str, Any] | None = None


_APEXLANG_GRAMMAR_CONTRACTS_CACHE: dict[str, list[ApexlangGrammarComponentContract]] | None = None
APEXLANG_TEMPLATE_COMPONENT_SCHEMA_KEYWORDS = {
    "componentSetting": ("sharedComponent", "componentSetting"),
}
APEXLANG_TEMPLATE_PAGE_ITEM_SCHEMA_ALIASES = {
    "checkbox": "radioGroup",
}
APEXLANG_PAGE_ITEM_PLUGIN_ATTRIBUTE_GROUPS = {"settings", "search"}
APEXLANG_FILE_UPLOAD_PLUGIN_ATTRIBUTE_GROUPS = {"display", "storage"}
APEXLANG_TEMPLATE_FENCE_START_PATTERN = re.compile(r"(?i)^[ \t]{0,3}```apexlang[ \t]*$")
APEXLANG_TEMPLATE_FENCE_END_PATTERN = re.compile(r"^[ \t]{0,3}```[ \t]*$")
APEXLANG_COMPONENT_DECLARATION_PATTERN = re.compile(
    r"^[ \t]*([A-Za-z][A-Za-z0-9]*)\b(?![ \t]*:).*?\([ \t]*(?://.*)?$"
)
APEXLANG_PROPERTY_LINE_PATTERN = re.compile(r"^[ \t]*([A-Za-z][A-Za-z0-9]*)[ \t]*:")
APEXLANG_GROUP_BLOCK_LINE_PATTERN = re.compile(r"^[ \t]*([A-Za-z][A-Za-z0-9]*)[ \t]*\{[ \t]*(?://.*)?$")
APEXLANG_GRAMMAR_COMPONENT_RULE_PATTERN = re.compile(
    r'^"(?P<keyword>[A-Za-z][A-Za-z0-9]*)"\s+\[\s*<required-ws>\s+<component-id>\s*\].*"\("[^\n]*'
)
APEXLANG_GRAMMAR_GROUP_RULE_PATTERN = re.compile(
    r'^<indent>\s+"(?P<group>[A-Za-z][A-Za-z0-9]*)"\s+<ws>\s+"\{"'
)
APEXLANG_GRAMMAR_PROPERTY_PATTERN = re.compile(r'"([A-Za-z][A-Za-z0-9]*)"\s+":"')
APEXLANG_GRAMMAR_RULE_REF_PATTERN = re.compile(r"<([A-Za-z0-9-]+)>")
APEXLANG_COMPONENT_DECLARATION_DETAIL_PATTERN = re.compile(
    r"^[ \t]*([A-Za-z][A-Za-z0-9]*)\b(?![ \t]*:)(?:[ \t]+([A-Za-z0-9_$-]+))?.*?\([ \t]*(?://.*)?$"
)
APEXLANG_NATIVE_VALUE_ALIASES = {
    "facetedSearch": "NATIVE_FACETED_SEARCH",
    "smartFilters": "NATIVE_SMART_FILTERS",
    "classicReport": "NATIVE_SQL_REPORT",
    "interactiveReport": "NATIVE_IR",
    "interactiveGrid": "NATIVE_IG",
    "form": "NATIVE_FORM",
    "map": "NATIVE_MAP",
    "chart": "NATIVE_JET_CHART",
    "checkboxGroup": "NATIVE_CHECKBOX",
    "radioGroup": "NATIVE_RADIOGROUP",
    "selectList": "NATIVE_SELECT_LIST",
    "search": "NATIVE_SEARCH",
    "range": "NATIVE_RANGE",
    "displayOnly": "DISPLAY_ONLY",
}
NATIVE_TYPE_FEATURES = {
    "NATIVE_IR": {"COLUMNS"},
    "NATIVE_IG": {"COLUMNS"},
    "NATIVE_CHECKBOX": {
        "VISIBLE",
        "LOV",
        "FC_HAS_FEEDBACK",
        "FC_SHOW_SELECTED_FIRST",
        "FC_SHOW_MORE_COUNT",
        "FC_FILTER_VALUES",
        "FC_LOV_DISPLAY_NULL",
    },
    "NATIVE_RADIOGROUP": {
        "VISIBLE",
        "LOV",
        "FC_HAS_FEEDBACK",
        "FC_SHOW_SELECTED_FIRST",
        "FC_SHOW_MORE_COUNT",
        "FC_FILTER_VALUES",
        "FC_LOV_DISPLAY_NULL",
    },
    "NATIVE_SELECT_LIST": {"VISIBLE", "LOV", "FC_HAS_FEEDBACK", "FC_FILTER_VALUES", "FC_LOV_DISPLAY_NULL"},
    "NATIVE_RANGE": {"FC_HAS_FEEDBACK"},
}
REQUIRED_CHILD_CONTRACTS = {
    ("region", "NATIVE_FACETED_SEARCH"): ("facet", "compiler metadata/export behavior: faceted-search regions require facet children"),
    ("region", "NATIVE_SMART_FILTERS"): ("filter", "compiler metadata/export behavior: smart-filter regions require filter children"),
}


def load_schema(schema_path: Path = SCHEMA_PATH) -> dict:
    """Load the validator schema and attach runtime compiler metadata when available."""
    try:
        data = json.loads(schema_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise RuntimeError(f"Failed to parse schema: {schema_path} ({exc})") from exc

    if not isinstance(data, dict) or not isinstance(data.get("components"), dict):
        raise RuntimeError("component-attributes.json must contain a top-level 'components' object")
    normalize_runtime_component_contract(data)
    runtime_component_map = load_runtime_component_map()
    if runtime_component_map:
        data["_runtimeComponentMap"] = runtime_component_map
        data["_runtimeComponentMapSource"] = "query-valid-props"
    else:
        data["_runtimeComponentMap"] = None
        data["_runtimeComponentMapSource"] = "component-attributes-only"
    return data


def normalize_runtime_component_contract(data: dict[str, Any]) -> None:
    """Expose generated component-contract child nodes in the validator schema shape."""

    def expand_node(node: Any) -> None:
        if not isinstance(node, dict):
            return
        children = node.get("childComponents", {})
        if isinstance(children, dict):
            for child_name, child_node in children.items():
                if not isinstance(child_node, dict):
                    continue
                expand_node(child_node)
                node[child_name] = child_node
        for child_name, child_node in list(node.items()):
            if child_name == "childComponents" or not isinstance(child_node, dict):
                continue
            if any(key in child_node for key in ("allowedProperties", "requiredProperties", "allowedBlocks", "childComponents")):
                expand_node(child_node)

    for families in data.get("components", {}).values():
        if not isinstance(families, dict):
            continue
        for family in families.values():
            expand_node(family)


def iter_line_spans(text: str) -> list[tuple[int, str]]:
    """Return line offsets paired with line text, preserving line endings."""
    offset = 0
    spans: list[tuple[int, str]] = []
    for line in text.splitlines(keepends=True):
        spans.append((offset, line))
        offset += len(line)
    if text and not text.endswith(("\n", "\r")):
        return spans
    return spans


def parse_ebnf_rules(grammar_text: str) -> dict[str, str]:
    """Parse a simple EBNF file into rule-name to rule-body text."""
    rules: dict[str, str] = {}
    current_name = ""
    current_lines: list[str] = []

    for line in grammar_text.splitlines():
        match = re.match(r"^<([^>]+)>\s*::=\s*(.*)$", line)
        if match:
            if current_name:
                rules[current_name] = "\n".join(current_lines).strip()
            current_name = match.group(1)
            current_lines = [match.group(2)]
            continue
        if current_name:
            current_lines.append(line)

    if current_name:
        rules[current_name] = "\n".join(current_lines).strip()

    return rules


def apexlang_grammar_property_names(rule_body: str) -> set[str]:
    """Return property literals declared by a `*-property` grammar rule."""
    return set(APEXLANG_GRAMMAR_PROPERTY_PATTERN.findall(rule_body))


def apexlang_grammar_rule_refs(rule_body: str) -> list[str]:
    """Return referenced grammar rule names in source order."""
    return APEXLANG_GRAMMAR_RULE_REF_PATTERN.findall(rule_body)


def build_apexlang_grammar_contracts_from_text(grammar_text: str) -> dict[str, list[ApexlangGrammarComponentContract]]:
    """Build grammar-derived component contracts keyed by emitted component keyword."""
    rules = parse_ebnf_rules(grammar_text)
    contracts: dict[str, list[ApexlangGrammarComponentContract]] = {}

    for rule_name, rule_body in rules.items():
        component_match = APEXLANG_GRAMMAR_COMPONENT_RULE_PATTERN.match(rule_body)
        if not component_match:
            continue

        keyword = component_match.group("keyword")
        direct_properties = apexlang_grammar_property_names(rules.get(f"{rule_name}-direct-property", ""))
        group_properties: dict[str, set[str]] = {}

        for group_rule_name in apexlang_grammar_rule_refs(rules.get(f"{rule_name}-group-block", "")):
            group_body = rules.get(group_rule_name, "")
            group_match = APEXLANG_GRAMMAR_GROUP_RULE_PATTERN.match(group_body)
            if not group_match:
                continue
            group_name = group_match.group("group")
            property_rule_name = f"{group_rule_name}-property"
            properties = apexlang_grammar_property_names(rules.get(property_rule_name, ""))
            group_properties.setdefault(group_name, set()).update(properties)

        contracts.setdefault(keyword, []).append(
            ApexlangGrammarComponentContract(
                keyword=keyword,
                rule_name=rule_name,
                direct_properties=direct_properties,
                group_properties=group_properties,
            )
        )

    return contracts


def load_apexlang_grammar_contracts() -> dict[str, list[ApexlangGrammarComponentContract]]:
    """Load and cache grammar-derived component contracts."""
    global _APEXLANG_GRAMMAR_CONTRACTS_CACHE
    if _APEXLANG_GRAMMAR_CONTRACTS_CACHE is not None:
        return _APEXLANG_GRAMMAR_CONTRACTS_CACHE
    if not APEXLANG_GRAMMAR_PATH.exists():
        raise RuntimeError(f"APEXlang grammar file not found: {APEXLANG_GRAMMAR_PATH}")

    grammar_text = APEXLANG_GRAMMAR_PATH.read_text(encoding="utf-8")
    contracts = build_apexlang_grammar_contracts_from_text(grammar_text)
    if not contracts:
        raise RuntimeError(f"APEXlang grammar produced no component contracts: {APEXLANG_GRAMMAR_PATH}")
    _APEXLANG_GRAMMAR_CONTRACTS_CACHE = contracts
    return contracts


def apexlang_template_direct_property_value(block: str, prop_name: str) -> str | None:
    """Return a simple immediate direct property value from a component block."""
    paren_depth = 0
    brace_depth = 0
    in_fence = False
    for line_offset, line in apexlang_component_body_lines(block):
        _ = line_offset
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if paren_depth == 0 and brace_depth == 0:
            prop_match = APEXLANG_PROPERTY_LINE_PATTERN.match(line)
            if prop_match and prop_match.group(1) == prop_name:
                return line[prop_match.end() :].strip().strip('"')

        if line_is_apexlang_component_declaration(line):
            paren_depth += 1
            continue
        if re.match(r"^[ \t]*\)[ \t]*(?://.*)?$", line):
            paren_depth = max(0, paren_depth - 1)
            continue
        paren_delta, brace_delta = structural_delta_for_line(line)
        paren_depth = max(0, paren_depth + paren_delta)
        brace_depth = max(0, brace_depth + brace_delta)
    return None


def apexlang_template_variant_key(component: ApexlangSnippetComponent) -> str | None:
    """Infer a component variant from direct template properties."""
    if component.keyword == "region":
        region_type = apexlang_template_direct_property_value(component.text, "type")
        if region_type == "themeTemplateComponent/badge":
            return "badge"
        if region_type == "themeTemplateComponent/metricCard":
            return "metricCard"
        if region_type == "themeTemplateComponent/contentRow":
            return "contentRow"
        if region_type == "themeTemplateComponent/comments":
            return "comments"
        if region_type == "themeTemplateComponent/timeline":
            return "timeline"
        if region_type == "themeTemplateComponent/mediaList":
            return "mediaList"
        if region_type == "themeTemplateComponent/avatar":
            return "avatar"
        return region_type
    if component.keyword == "pageItem":
        item_type = apexlang_template_direct_property_value(component.text, "type")
        return APEXLANG_TEMPLATE_PAGE_ITEM_SCHEMA_ALIASES.get(item_type or "", item_type)
    return None


def apexlang_contract_from_schema_node(
    keyword: str,
    rule_name: str,
    node: Any,
    *,
    include_direct_properties: bool,
) -> ApexlangGrammarComponentContract | None:
    """Build a validator contract from a curated component-attributes node."""
    if not isinstance(node, dict):
        return None

    direct_properties = set()
    if include_direct_properties:
        direct_properties.update(str(prop) for prop in node.get("allowedProperties", []) if isinstance(prop, str))

    group_properties: dict[str, set[str]] = {}
    for group_name, group_node in node.items():
        if not isinstance(group_node, dict):
            continue
        allowed = {str(prop) for prop in group_node.get("allowedProperties", []) if isinstance(prop, str)}
        if allowed:
            group_properties[group_name] = allowed

    if not direct_properties and not group_properties:
        return None
    return ApexlangGrammarComponentContract(
        keyword=keyword,
        rule_name=rule_name,
        direct_properties=direct_properties,
        group_properties=group_properties,
    )


def apexlang_schema_contracts_for_component(
    schema: dict[str, Any],
    component: ApexlangSnippetComponent,
) -> list[ApexlangGrammarComponentContract]:
    """Return compiler-provenanced schema contracts applicable to a snippet component."""
    components_schema = schema.get("components", {})
    contracts: list[ApexlangGrammarComponentContract] = []

    if component.keyword in APEXLANG_TEMPLATE_COMPONENT_SCHEMA_KEYWORDS:
        container_name, variant_name = APEXLANG_TEMPLATE_COMPONENT_SCHEMA_KEYWORDS[component.keyword]
        node = components_schema.get(container_name, {}).get(variant_name)
        contract = apexlang_contract_from_schema_node(
            component.keyword,
            f"component-attributes:{container_name}.{variant_name}",
            node,
            include_direct_properties=True,
        )
        return [contract] if contract else []

    if component.keyword == "column":
        column_type = apexlang_template_direct_property_value(component.text, "type")
        if column_type == "themeTemplateComponent/comments":
            node = (
                components_schema.get("region", {})
                .get("interactiveReport", {})
                .get("column", {})
                .get("commentsColumn")
            )
            contract = apexlang_contract_from_schema_node(
                component.keyword,
                "component-attributes:region.interactiveReport.column.commentsColumn",
                node,
                include_direct_properties=False,
            )
            return [contract] if contract else []

    variant_key = apexlang_template_variant_key(component)
    if not variant_key:
        return contracts

    node = components_schema.get(component.keyword, {}).get(variant_key)
    contract = apexlang_contract_from_schema_node(
        component.keyword,
        f"component-attributes:{component.keyword}.{variant_key}",
        node,
        include_direct_properties=False,
    )
    if contract:
        contracts.append(contract)
    return contracts


def apexlang_is_page_item_plugin_attribute_group(component: ApexlangSnippetComponent, group_name: str) -> bool:
    """Return true for native item plugin attribute groups not enumerated by the generic EBNF snapshot."""
    if component.keyword != "pageItem":
        return False
    item_type = apexlang_template_direct_property_value(component.text, "type")
    if item_type == "fileUpload" and group_name in APEXLANG_FILE_UPLOAD_PLUGIN_ATTRIBUTE_GROUPS:
        return True
    return group_name in APEXLANG_PAGE_ITEM_PLUGIN_ATTRIBUTE_GROUPS


def extract_apexlang_fenced_examples(markdown: str) -> list[ApexlangTemplateSnippet]:
    """Extract only Markdown fences explicitly labeled `apexlang`."""
    snippets: list[ApexlangTemplateSnippet] = []
    lines = iter_line_spans(markdown)
    idx = 0
    while idx < len(lines):
        line_offset, line = lines[idx]
        if not APEXLANG_TEMPLATE_FENCE_START_PATTERN.match(line.rstrip("\r\n")):
            idx += 1
            continue

        content_start = line_offset + len(line)
        idx += 1
        while idx < len(lines):
            close_offset, close_line = lines[idx]
            if APEXLANG_TEMPLATE_FENCE_END_PATTERN.match(close_line.rstrip("\r\n")):
                snippets.append(ApexlangTemplateSnippet(markdown[content_start:close_offset], content_start))
                break
            idx += 1
        idx += 1

    return snippets


def line_is_apexlang_component_declaration(line: str) -> re.Match[str] | None:
    """Return a match for a line-oriented component declaration."""
    return APEXLANG_COMPONENT_DECLARATION_PATTERN.match(line.rstrip("\r\n"))


def structural_delta_for_line(line: str) -> tuple[int, int]:
    """Return parenthesis and brace deltas outside strings and template placeholders."""
    cleaned = re.sub(r"\{\{.*?\}\}", "", line)
    paren_delta = 0
    brace_delta = 0
    in_string = False
    idx = 0

    while idx < len(cleaned):
        ch = cleaned[idx]
        if ch == '"' and (idx == 0 or cleaned[idx - 1] != "\\"):
            in_string = not in_string
            idx += 1
            continue
        if in_string:
            idx += 1
            continue
        if ch == "(":
            paren_delta += 1
        elif ch == ")":
            paren_delta -= 1
        elif ch == "{":
            brace_delta += 1
        elif ch == "}":
            brace_delta -= 1
        idx += 1

    return paren_delta, brace_delta


def find_apexlang_component_end_line(lines: list[tuple[int, str]], start_line_index: int) -> int:
    """Find the line index where a component declaration closes."""
    depth = 0
    in_fence = False

    for idx in range(start_line_index, len(lines)):
        _offset, line = lines[idx]
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        if line_is_apexlang_component_declaration(line):
            depth += 1
        elif re.match(r"^[ \t]*\)[ \t]*(?://.*)?$", line):
            depth -= 1
            if depth <= 0:
                return idx

    return start_line_index


def find_apexlang_snippet_components(snippet_text: str) -> list[ApexlangSnippetComponent]:
    """Find component declarations in a fenced apexlang snippet."""
    components: list[ApexlangSnippetComponent] = []
    lines = iter_line_spans(snippet_text)
    in_fence = False

    for idx, (line_offset, line) in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        match = line_is_apexlang_component_declaration(line)
        if not match:
            continue
        end_idx = find_apexlang_component_end_line(lines, idx)
        end_offset, end_line = lines[end_idx]
        components.append(
            ApexlangSnippetComponent(
                keyword=match.group(1),
                offset=line_offset,
                text=snippet_text[line_offset : end_offset + len(end_line)],
            )
        )

    return components


def apexlang_component_body_lines(block: str) -> list[tuple[int, str]]:
    """Return component body lines after the declaration line."""
    lines = iter_line_spans(block)
    if len(lines) <= 1:
        return []
    return lines[1:]


def extract_apexlang_immediate_direct_properties(block: str) -> list[tuple[str, int]]:
    """Extract immediate direct property names from a component block."""
    props: list[tuple[str, int]] = []
    paren_depth = 0
    brace_depth = 0
    in_fence = False

    for line_offset, line in apexlang_component_body_lines(block):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        if paren_depth == 0 and brace_depth == 0:
            prop_match = APEXLANG_PROPERTY_LINE_PATTERN.match(line)
            if prop_match:
                props.append((prop_match.group(1), line_offset + prop_match.start(1)))

        if line_is_apexlang_component_declaration(line):
            paren_depth += 1
            continue
        if re.match(r"^[ \t]*\)[ \t]*(?://.*)?$", line):
            paren_depth = max(0, paren_depth - 1)
            continue

        paren_delta, brace_delta = structural_delta_for_line(line)
        paren_depth = max(0, paren_depth + paren_delta)
        brace_depth = max(0, brace_depth + brace_delta)

    return props


def find_apexlang_group_block_end_line(lines: list[tuple[int, str]], start_line_index: int) -> int:
    """Find the line index where a named brace group closes."""
    brace_depth = 0
    in_fence = False

    for idx in range(start_line_index, len(lines)):
        _offset, line = lines[idx]
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        _paren_delta, brace_delta = structural_delta_for_line(line)
        brace_depth += brace_delta
        if brace_depth <= 0 and idx > start_line_index:
            return idx

    return start_line_index


def extract_apexlang_immediate_group_blocks(block: str) -> list[tuple[str, int, str]]:
    """Extract immediate named brace groups from a component block."""
    groups: list[tuple[str, int, str]] = []
    lines = apexlang_component_body_lines(block)
    paren_depth = 0
    brace_depth = 0
    in_fence = False

    for idx, (line_offset, line) in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        if paren_depth == 0 and brace_depth == 0:
            group_match = APEXLANG_GROUP_BLOCK_LINE_PATTERN.match(line)
            if group_match:
                end_idx = find_apexlang_group_block_end_line(lines, idx)
                end_offset, end_line = lines[end_idx]
                groups.append((group_match.group(1), line_offset, block[line_offset : end_offset + len(end_line)]))

        if line_is_apexlang_component_declaration(line):
            paren_depth += 1
            continue
        if re.match(r"^[ \t]*\)[ \t]*(?://.*)?$", line):
            paren_depth = max(0, paren_depth - 1)
            continue

        paren_delta, brace_delta = structural_delta_for_line(line)
        paren_depth = max(0, paren_depth + paren_delta)
        brace_depth = max(0, brace_depth + brace_delta)

    return groups


def extract_apexlang_immediate_group_properties(group_block: str) -> list[tuple[str, int]]:
    """Extract immediate property names from a named brace group."""
    props: list[tuple[str, int]] = []
    lines = iter_line_spans(group_block)
    paren_depth = 0
    brace_depth = 0
    in_fence = False

    for idx, (line_offset, line) in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if idx == 0:
            _paren_delta, brace_delta = structural_delta_for_line(line)
            brace_depth = max(0, brace_depth + brace_delta - 1)
            continue

        if paren_depth == 0 and brace_depth == 0:
            prop_match = APEXLANG_PROPERTY_LINE_PATTERN.match(line)
            if prop_match:
                props.append((prop_match.group(1), line_offset + prop_match.start(1)))

        if line_is_apexlang_component_declaration(line):
            paren_depth += 1
            continue
        if re.match(r"^[ \t]*\)[ \t]*(?://.*)?$", line):
            paren_depth = max(0, paren_depth - 1)
            continue

        paren_delta, brace_delta = structural_delta_for_line(line)
        paren_depth = max(0, paren_depth + paren_delta)
        brace_depth = max(0, brace_depth + brace_delta)

    return props


def find_component_blocks(text: str, keyword: str) -> list[tuple[int, str, str]]:
    """Find named parenthesized APEXlang component blocks by keyword."""
    results: list[tuple[int, str, str]] = []
    pattern = re.compile(rf"^[ \t]*{re.escape(keyword)}\s+([A-Za-z0-9_$-]+)\s*\(", re.MULTILINE)
    for match in pattern.finditer(text):
        start = match.start()
        name = match.group(1)
        depth = 0
        for idx in range(start, len(text)):
            ch = text[idx]
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    results.append((start, name, text[start : idx + 1]))
                    break
    return results


def find_named_brace_blocks(text: str) -> list[tuple[int, str, str]]:
    """Find named brace blocks while respecting quoted strings."""
    results: list[tuple[int, str, str]] = []
    pattern = re.compile(r"(?m)^[ \t]*([A-Za-z][A-Za-z0-9-]*)\s*\{")
    for match in pattern.finditer(text):
        start = match.start()
        name = match.group(1)
        depth = 0
        in_string = False
        for idx in range(match.end() - 1, len(text)):
            ch = text[idx]
            if ch == '"' and (idx == 0 or text[idx - 1] != "\\"):
                in_string = not in_string
            if in_string:
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    results.append((start, name, text[start : idx + 1]))
                    break
    return results


def extract_item_type(block: str) -> str | None:
    """Extract an item type value from an item block when present."""
    match = re.search(r"(?m)^\s*type\s*:\s*([A-Za-z0-9_/-]+)\s*$", block)
    return match.group(1) if match else None


def region_schema_key(region_type: str) -> str:
    """Map a region type to its component schema key."""
    if region_type == "themeTemplateComponent/badge":
        return "badge"
    if region_type == "themeTemplateComponent/contentRow":
        return "contentRow"
    if region_type == "themeTemplateComponent/mediaList":
        return "mediaList"
    if region_type == "themeTemplateComponent/metricCard":
        return "metricCard"
    if region_type == "themeTemplateComponent/comments":
        return "comments"
    if region_type == "themeTemplateComponent/timeline":
        return "timeline"
    if region_type == "themeTemplateComponent/avatar":
        return "avatar"
    return region_type


def extract_top_level_blocks(block: str) -> dict[str, tuple[int, str]]:
    """Return first-level nested brace blocks keyed by block name."""
    body_start = block.find("\n")
    body = block[body_start:] if body_start != -1 else block
    mapping: dict[str, tuple[int, str]] = {}
    for offset, name, sub_block in find_named_brace_blocks(body):
        paren_depth, brace_depth = nesting_depth(body, offset)
        if paren_depth == 0 and brace_depth == 0 and name not in mapping:
            mapping[name] = (offset + body_start, sub_block)
    return mapping


def block_body(block: str) -> tuple[int, str]:
    """Return the inner body text and its offset for a brace block."""
    body_start = block.find("\n")
    if body_start == -1:
        return len(block), ""
    return body_start + 1, block[body_start + 1 :]


def nesting_depth(text: str, idx: int) -> tuple[int, int]:
    """Calculate brace and parenthesis depth at a character offset."""
    paren_depth = 0
    brace_depth = 0
    in_string = False

    for pos, ch in enumerate(text[:idx]):
        if ch == '"' and (pos == 0 or text[pos - 1] != "\\"):
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "(":
            paren_depth += 1
        elif ch == ")":
            paren_depth = max(0, paren_depth - 1)
        elif ch == "{":
            brace_depth += 1
        elif ch == "}":
            brace_depth = max(0, brace_depth - 1)

    return paren_depth, brace_depth


def unmatched_closing_brace_offsets(text: str) -> list[int]:
    """Return offsets for closing braces that do not match an opened brace."""
    offsets: list[int] = []
    brace_depth = 0
    in_string = False
    in_fence = False
    offset = 0

    for line in text.splitlines(keepends=True):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            offset += len(line)
            continue
        if in_fence:
            offset += len(line)
            continue

        for column, ch in enumerate(line):
            absolute_offset = offset + column
            if ch == '"' and (absolute_offset == 0 or text[absolute_offset - 1] != "\\"):
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == "{":
                brace_depth += 1
            elif ch == "}":
                if brace_depth == 0:
                    offsets.append(absolute_offset)
                else:
                    brace_depth -= 1

        offset += len(line)

    return offsets


def find_immediate_component_blocks(block: str, keyword: str) -> list[tuple[int, str, str]]:
    """Find child component blocks that are immediate children of a block."""
    body_offset, body = block_body(block)
    results: list[tuple[int, str, str]] = []
    for start, name, child_block in find_component_blocks(body, keyword):
        paren_depth, brace_depth = nesting_depth(body, start)
        if paren_depth == 0 and brace_depth == 0:
            results.append((body_offset + start, name, child_block))
    return results


def find_immediate_unnamed_component_blocks(block: str, keyword: str) -> list[tuple[int, str, str]]:
    """Find immediate child components whose grammar permits an omitted identifier."""
    body_offset, body = block_body(block)
    results: list[tuple[int, str, str]] = []
    pattern = re.compile(
        rf"^[ \t]*{re.escape(keyword)}(?:\s+([A-Za-z0-9_$-]+))?\s*\(",
        re.MULTILINE,
    )
    for match in pattern.finditer(body):
        start = match.start()
        paren_depth, brace_depth = nesting_depth(body, start)
        if paren_depth != 0 or brace_depth != 0:
            continue
        depth = 0
        for idx in range(start, len(body)):
            ch = body[idx]
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    results.append((body_offset + start, match.group(1) or "", body[start : idx + 1]))
                    break
    return results


def find_region_column_blocks(region_type_key: str, region_block: str) -> list[tuple[int, str, str]]:
    """Find immediate region-column components using the family compiler shape."""
    if region_type_key == "mediaList":
        return find_immediate_unnamed_component_blocks(region_block, "column")
    return find_immediate_component_blocks(region_block, "column")


def find_immediate_named_brace_blocks(block: str, block_name: str) -> list[tuple[int, str]]:
    """Find named brace blocks that are immediate children of a parenthesized component block."""
    body_offset, body = block_body(block)
    results: list[tuple[int, str]] = []
    for start, name, child_block in find_named_brace_blocks(body):
        if name != block_name:
            continue
        paren_depth, brace_depth = nesting_depth(body, start)
        if paren_depth == 0 and brace_depth == 0:
            results.append((body_offset + start, child_block))
    return results


def parse_int(value: str | None) -> int | None:
    """Parse an integer string and return None for invalid values."""
    if value is None:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def is_template_base_app_structure_path(path: Path) -> bool:
    """Return whether a path belongs to the template-family base-app-structure tree."""
    parts = path.resolve().parts
    return "templates" in parts and "base-app-structure" in parts


def is_app_root(path: Path) -> bool:
    """Return whether a directory looks like a generated app root."""
    return path.is_dir() and (
        (path / "application.apx").exists() or (path / ".apex" / "apexlang.json").exists()
    )


def resolve_app_root(path: Path) -> Path | None:
    """Resolve the nearest generated app root for a file or directory."""
    current = path.resolve()
    if current.is_file():
        current = current.parent

    while True:
        if is_template_base_app_structure_path(current):
            return None
        if is_app_root(current):
            return current
        if current.parent == current:
            return None
        current = current.parent


def is_export_backup_path(path: Path) -> bool:
    """Return true when a path belongs to an ignored APEX export backup tree."""
    return EXPORT_BACKUP_PATH_SEGMENT in path.parts


def collect_app_roots(paths: list[str]) -> list[Path]:
    """Collect generated app roots from explicit paths or from the default applications tree."""
    app_roots: set[Path] = set()
    if paths:
        for raw in paths:
            path = Path(raw)
            if not path.exists():
                continue
            if path.is_dir():
                resolved_root = resolve_app_root(path)
                if resolved_root:
                    app_roots.add(resolved_root)
                    continue
                for candidate in sorted(path.rglob("application.apx")):
                    if is_export_backup_path(candidate):
                        continue
                    app_root = resolve_app_root(candidate.parent)
                    if app_root:
                        app_roots.add(app_root)
            else:
                app_root = resolve_app_root(path)
                if app_root:
                    app_roots.add(app_root)
        return sorted(app_roots)

    applications_root = ROOT / "applications"
    if not applications_root.exists():
        return []
    for candidate in sorted(applications_root.rglob("application.apx")):
        if is_export_backup_path(candidate):
            continue
        app_root = resolve_app_root(candidate.parent)
        if app_root:
            app_roots.add(app_root)
    return sorted(app_roots)


def lint_app_root_contract(app_root: Path) -> list[str]:
    """Validate top-level generated app-root contents against the runtime-artifact allowlist."""
    issues: list[str] = []
    if is_template_base_app_structure_path(app_root) or not app_root.exists() or not app_root.is_dir():
        return issues

    for entry in sorted(app_root.iterdir(), key=lambda item: item.name):
        entry_name = entry.name
        if entry_name in APP_ROOT_FORBIDDEN_TEMPLATE_ARTIFACTS:
            issues.append(
                f"{display_path(entry)}:1: APP_TEMPLATE_ARTIFACT_LEAK_001 "
                f"generated app root contains forbidden template artifact '{entry_name}'"
            )
            continue
        if entry_name == EXPORT_BACKUP_PATH_SEGMENT:
            # Backup/export material is ignored by policy even when it sits under
            # an app root. It must not become validation input or a leak failure.
            continue
        if entry_name not in APP_ROOT_ALLOWED_ENTRIES:
            issues.append(
                f"{display_path(entry)}:1: APP_TEMPLATE_ARTIFACT_LEAK_001 "
                f"generated app root contains top-level entry outside runtime allowlist '{entry_name}'"
            )

    return issues


def breadcrumb_entry_page_numbers(app_root: Path) -> set[int]:
    """Return page numbers declared in the app's shared breadcrumb entries."""
    breadcrumb_path = app_root / "shared-components" / "breadcrumbs.apx"
    if not breadcrumb_path.exists():
        return set()

    try:
        text = breadcrumb_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return set()

    page_numbers: set[int] = set()
    for _breadcrumb_start, _breadcrumb_name, breadcrumb_block in find_component_blocks(text, "breadcrumb"):
        for _entry_offset, _entry_name, entry_block in find_immediate_component_blocks(breadcrumb_block, "entry"):
            props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_property_values(entry_block)
            }
            page_number = parse_int(props.get("pageNumber"))
            if page_number is not None:
                page_numbers.add(page_number)
    return page_numbers


def page_is_modal_dialog(page_block: str) -> bool:
    """Return whether a page declares modal-dialog page mode."""
    appearance_meta = extract_top_level_blocks(page_block).get("appearance")
    if not appearance_meta:
        return False
    _appearance_offset, appearance_block = appearance_meta
    props = {
        prop_name: clean_scalar_value(prop_value).lower()
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(appearance_block)
    }
    return props.get("pageMode") == "modaldialog"


def page_has_visible_breadcrumb_region(page_block: str) -> bool:
    """Return whether a page renders a breadcrumb region wired to the shared breadcrumb."""
    for _region_offset, _region_name, region_block in find_immediate_component_blocks(page_block, "region"):
        if (extract_item_type(region_block) or "") != "breadcrumb":
            continue
        source_meta = extract_top_level_blocks(region_block).get("source")
        if not source_meta:
            continue
        _source_offset, source_block = source_meta
        source_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
        }
        if source_props.get("breadcrumb") == "@breadcrumb":
            return True
    return False


GENERIC_BREADCRUMB_REGION_TITLES = {"breadcrumb", "breadcrumbs", "title bar", "titlebar", "page header"}


def breadcrumb_region_title_issues(page_path: Path, text: str, page_start: int, page_block: str) -> list[str]:
    """Reject breadcrumb title-bar regions that expose generic chrome labels."""
    issues: list[str] = []
    for region_offset, _region_name, region_block in find_immediate_component_blocks(page_block, "region"):
        if (extract_item_type(region_block) or "") != "breadcrumb":
            continue
        props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_property_values(region_block)
        }
        region_title, title_offset = props.get("name", ("", region_offset))
        if region_title.strip().lower() not in GENERIC_BREADCRUMB_REGION_TITLES:
            continue
        source_meta = extract_top_level_blocks(region_block).get("source")
        appearance_meta = extract_top_level_blocks(region_block).get("appearance")
        if not source_meta or not appearance_meta:
            continue
        _source_offset, source_block = source_meta
        _appearance_offset, appearance_block = appearance_meta
        source_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
        }
        appearance_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(appearance_block)
        }
        if source_props.get("breadcrumb") != "@breadcrumb" or appearance_props.get("template") != "@/title-bar":
            continue
        issues.append(
            f"{display_path(page_path)}:{line_no(text, page_start + region_offset + title_offset)}: "
            "BREADCRUMB_REGION_TITLE_VISIBLE_GENERIC_001 breadcrumb/title-bar regions must not expose "
            f"generic visible title '{region_title}'; use the current breadcrumb entry/page title as the title source"
        )
    return issues


def lint_breadcrumb_coverage_contract(app_root: Path) -> list[str]:
    """Require non-modal generated pages to have shared entries and rendered breadcrumb regions."""
    issues: list[str] = []
    if is_template_base_app_structure_path(app_root) or not app_root.exists() or not app_root.is_dir():
        return issues

    pages_root = app_root / "pages"
    if not pages_root.exists():
        return issues

    covered_pages = breadcrumb_entry_page_numbers(app_root)
    for page_path in sorted(pages_root.glob("*.apx")):
        if is_export_backup_path(page_path):
            continue
        try:
            text = page_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for page_start, page_name, page_block in find_component_blocks(text, "page"):
            page_number = parse_int(page_name)
            if page_number is None or page_number in {0, 9999} or page_is_modal_dialog(page_block):
                continue
            if page_number not in covered_pages:
                issues.append(
                    f"{display_path(page_path)}:{line_no(text, page_start)}: "
                    f"BREADCRUMB_COVERAGE_ENTRY_REQUIRED_001 page '{page_name}' must have a matching "
                    f"shared-components/breadcrumbs.apx entry with pageNumber: {page_number}"
                )
            if not page_has_visible_breadcrumb_region(page_block):
                issues.append(
                    f"{display_path(page_path)}:{line_no(text, page_start)}: "
                    f"BREADCRUMB_COVERAGE_REGION_REQUIRED_001 page '{page_name}' must render a breadcrumb region "
                    "with type: breadcrumb and source.breadcrumb: @breadcrumb"
                )
            issues.extend(breadcrumb_region_title_issues(page_path, text, page_start, page_block))
    return issues


def modal_page_numbers(app_root: Path) -> set[int]:
    """Return modal-dialog page numbers declared in a generated app."""
    pages_root = app_root / "pages"
    if not pages_root.exists():
        return set()

    modal_pages: set[int] = set()
    for page_path in sorted(pages_root.glob("*.apx")):
        if is_export_backup_path(page_path):
            continue
        try:
            text = page_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for _page_start, page_name, page_block in find_component_blocks(text, "page"):
            page_number = parse_int(page_name)
            if page_number is not None and page_is_modal_dialog(page_block):
                modal_pages.add(page_number)
    return modal_pages


def target_page_from_link_block(link_block: str) -> int | None:
    """Return a literal page target from a declarative report link block."""
    target_page_meta = extract_property_value_at_brace_depth(link_block, "page", brace_depth=2)
    if target_page_meta is None:
        return None
    return parse_int(clean_scalar_value(target_page_meta[0]))


def component_identifier_is_live_external(identifier: str) -> bool:
    """Return whether a child component identifier is accepted by the live compiler."""
    return bool(LIVE_EXTERNAL_IDENTIFIER_PATTERN.fullmatch(identifier.strip()))


def target_page_from_button_behavior(button_block: str) -> int | None:
    """Return a literal page target from a redirectThisApp button behavior block."""
    behavior_meta = extract_top_level_blocks(button_block).get("behavior")
    if not behavior_meta:
        return None
    _behavior_offset, behavior_block = behavior_meta
    behavior_props = {
        prop_name: clean_scalar_value(prop_value)
        for prop_name, prop_value, _prop_offset in extract_property_values(behavior_block)
    }
    if behavior_props.get("action") != "redirectThisApp":
        return None
    target_page_meta = extract_property_value_at_brace_depth(behavior_block, "page", brace_depth=1)
    if target_page_meta is None:
        target_page_meta = extract_property_value_at_brace_depth(behavior_block, "page", brace_depth=2)
    if target_page_meta is None:
        return None
    return parse_int(clean_scalar_value(target_page_meta[0]))


def target_page_from_action_behavior(action_block: str) -> int | None:
    """Return a literal page target from a region action behavior block."""
    behavior_meta = extract_top_level_blocks(action_block).get("behavior")
    if not behavior_meta:
        return None
    _behavior_offset, behavior_block = behavior_meta
    target_page_meta = extract_property_value_at_brace_depth(behavior_block, "page", brace_depth=1)
    if target_page_meta is None:
        target_page_meta = extract_property_value_at_brace_depth(behavior_block, "page", brace_depth=2)
    if target_page_meta is not None:
        return parse_int(clean_scalar_value(target_page_meta[0]))
    target_url_meta = extract_property_value_at_brace_depth(behavior_block, "targetUrl", brace_depth=1)
    if target_url_meta is None:
        target_url_meta = extract_property_value_at_brace_depth(behavior_block, "targetUrl", brace_depth=0)
    if target_url_meta is None:
        return None
    match = re.search(r"f\?p=[^:]*:(\d+):", clean_scalar_value(target_url_meta[0]), re.IGNORECASE)
    return parse_int(match.group(1)) if match else None


def button_region_reference(button_block: str) -> str | None:
    """Return the layout.region reference for a report-scoped button."""
    layout_meta = extract_top_level_blocks(button_block).get("layout")
    if not layout_meta:
        return None
    _layout_offset, layout_block = layout_meta
    props = {
        prop_name: clean_scalar_value(prop_value)
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(layout_block)
    }
    return props.get("region")


def page_has_dialog_close_refresh(page_block: str, region_name: str) -> bool:
    """Return whether a page refreshes the target region after a successful dialog close."""
    expected_region_ref = f"@{region_name}"
    for _da_offset, _da_name, da_block in find_immediate_component_blocks(page_block, "dynamicAction"):
        da_blocks = extract_top_level_blocks(da_block)
        when_meta = da_blocks.get("when")
        if not when_meta:
            continue
        _when_offset, when_block = when_meta
        when_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(when_block)
        }
        if when_props.get("event") != "apexafterclosedialog":
            continue

        for _action_offset, _action_name, action_block in find_immediate_component_blocks(da_block, "action"):
            action_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_property_values(action_block)
            }
            if action_props.get("action") != "refresh":
                continue
            affected_meta = extract_top_level_blocks(action_block).get("affectedElements")
            if not affected_meta:
                continue
            _affected_offset, affected_block = affected_meta
            affected_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(affected_block)
            }
            if affected_props.get("selectionType") == "region" and affected_props.get("region") == expected_region_ref:
                return True
    return False


def page_dialog_close_refresh_regions(page_block: str) -> set[str]:
    """Return region static ids refreshed by apexafterclosedialog dynamic actions."""
    regions: set[str] = set()
    for _da_offset, _da_name, da_block in find_immediate_component_blocks(page_block, "dynamicAction"):
        da_blocks = extract_top_level_blocks(da_block)
        when_meta = da_blocks.get("when")
        if not when_meta:
            continue
        _when_offset, when_block = when_meta
        when_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(when_block)
        }
        if when_props.get("event") != "apexafterclosedialog":
            continue

        for _action_offset, _action_name, action_block in find_immediate_component_blocks(da_block, "action"):
            action_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_property_values(action_block)
            }
            if action_props.get("action") != "refresh":
                continue
            affected_meta = extract_top_level_blocks(action_block).get("affectedElements")
            if not affected_meta:
                continue
            _affected_offset, affected_block = affected_meta
            affected_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(affected_block)
            }
            region_ref = affected_props.get("region", "")
            if affected_props.get("selectionType") == "region" and region_ref.startswith("@"):
                regions.add(region_ref[1:])
    return regions


def page_has_modal_launcher(page_block: str, modal_pages: set[int]) -> bool:
    """Return whether the page has any recognized launcher to a known modal dialog page."""
    for target_page in modal_pages:
        if page_has_link_to_target(page_block, target_page):
            return True
    return False


def page_modal_report_refresh_requirements(page_block: str, modal_pages: set[int]) -> list[tuple[str, str, str]]:
    """Return report regions that link to modal pages and therefore require close-refresh DAs."""
    requirements: list[tuple[str, str, str]] = []
    report_region_names: set[str] = set()

    for _region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
        region_type = extract_item_type(region_block) or ""
        if region_type not in MODAL_REPORT_REFRESH_REGION_TYPES:
            continue
        report_region_names.add(region_name)

        for _link_offset, link_block in find_immediate_named_brace_blocks(region_block, "link"):
            target_page = target_page_from_link_block(link_block)
            if target_page in modal_pages:
                requirements.append((region_name, region_type, f"region link to modal page {target_page}"))

        for _column_offset, column_name, column_block in find_immediate_component_blocks(region_block, "column"):
            for _link_offset, link_block in find_immediate_named_brace_blocks(column_block, "link"):
                target_page = target_page_from_link_block(link_block)
                if target_page in modal_pages:
                    requirements.append((region_name, region_type, f"column '{column_name}' link to modal page {target_page}"))

    for _button_offset, button_name, button_block in find_immediate_component_blocks(page_block, "button"):
        region_ref = button_region_reference(button_block)
        if not region_ref or not region_ref.startswith("@"):
            continue
        region_name = region_ref[1:]
        if region_name not in report_region_names:
            continue
        target_page = target_page_from_button_behavior(button_block)
        if target_page in modal_pages:
            requirements.append((region_name, "report", f"button '{button_name}' target to modal page {target_page}"))

    return requirements


def lint_modal_report_refresh_contract(app_root: Path) -> list[str]:
    """Require reports that launch modal pages to refresh after successful dialog close."""
    issues: list[str] = []
    if is_template_base_app_structure_path(app_root) or not app_root.exists() or not app_root.is_dir():
        return issues

    pages_root = app_root / "pages"
    if not pages_root.exists():
        return issues

    modal_pages = modal_page_numbers(app_root)
    if not modal_pages:
        return issues

    for page_path in sorted(pages_root.glob("*.apx")):
        if is_export_backup_path(page_path):
            continue
        try:
            text = page_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for page_start, page_name, page_block in find_component_blocks(text, "page"):
            refresh_requirements = page_modal_report_refresh_requirements(page_block, modal_pages)
            for region_name, region_type, source_label in refresh_requirements:
                if page_has_dialog_close_refresh(page_block, region_name):
                    continue
                issues.append(
                    f"{display_path(page_path)}:{line_no(text, page_start)}: "
                    f"MODAL_REPORT_REFRESH_REQUIRED_001 page '{page_name}' {source_label} must include an "
                    f"apexafterclosedialog dynamic action that refreshes @{region_name}"
                )
            report_regions = {
                region_name
                for _region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region")
                if (extract_item_type(region_block) or "") in MODAL_REPORT_REFRESH_REGION_TYPES
            }
            launch_regions = {region_name for region_name, _region_type, _source_label in refresh_requirements}
            has_page_modal_launcher = page_has_modal_launcher(page_block, modal_pages)
            for region_name in sorted(page_dialog_close_refresh_regions(page_block) & report_regions):
                if region_name in launch_regions or has_page_modal_launcher:
                    continue
                issues.append(
                    f"{display_path(page_path)}:{line_no(text, page_start)}: "
                    f"MODAL_REPORT_LAUNCH_REQUIRED_001 page '{page_name}' refreshes report @{region_name} "
                    "after dialog close but has no declarative report link or page/report button to a modal page"
                )
    return issues


def lint_modal_cards_refresh_contract(app_root: Path) -> list[str]:
    """Require Cards that launch modal pages to refresh themselves after dialog close."""
    issues: list[str] = []
    if is_template_base_app_structure_path(app_root) or not app_root.exists() or not app_root.is_dir():
        return issues

    pages_root = app_root / "pages"
    if not pages_root.exists():
        return issues
    modal_pages = modal_page_numbers(app_root)
    change_modal_pages: set[int] = set()
    for modal_path in sorted(pages_root.glob("*.apx")):
        if is_export_backup_path(modal_path):
            continue
        try:
            modal_text = modal_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for _page_start, modal_page_name, modal_page_block in find_component_blocks(modal_text, "page"):
            modal_page_number = page_number_from_context(modal_path, modal_page_name, modal_page_block)
            if modal_page_number not in modal_pages:
                continue
            if any(
                region_schema_key(extract_item_type(region_block) or "") == "form"
                for _region_offset, _region_name, region_block in find_immediate_component_blocks(modal_page_block, "region")
            ):
                change_modal_pages.add(modal_page_number)
    if not change_modal_pages:
        return issues

    for page_path in sorted(pages_root.glob("*.apx")):
        if is_export_backup_path(page_path):
            continue
        try:
            text = page_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for page_start, page_name, page_block in find_component_blocks(text, "page"):
            dialog_refreshes: set[str] = set()
            for _da_offset, _da_name, da_block in find_immediate_component_blocks(page_block, "dynamicAction"):
                event, selection_type, trigger_region, _trigger_items = dynamic_action_when_values(da_block)
                refresh_regions = dynamic_action_refresh_regions(da_block)
                if event != "apexafterclosedialog" or selection_type != "region":
                    continue
                if trigger_region.startswith("@") and refresh_regions == {trigger_region[1:]}:
                    dialog_refreshes.add(trigger_region[1:])

            for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
                if region_schema_key(extract_item_type(region_block) or "") != "cards":
                    continue
                modal_targets = {
                    target_page
                    for _action_offset, _action_name, action_block in find_immediate_component_blocks(region_block, "action")
                    if (target_page := target_page_from_action_behavior(action_block)) in change_modal_pages
                }
                if not modal_targets or region_name in dialog_refreshes:
                    continue
                issues.append(
                    f"{display_path(page_path)}:{line_no(text, page_start + region_offset)}: "
                    f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 page '{page_name}' Cards region '@{region_name}' "
                    f"launches modal page(s) {', '.join(str(page) for page in sorted(modal_targets))} and must include "
                    "an apexafterclosedialog dynamic action triggered by and refreshing exactly that Cards region"
                )
    return issues


def json_scalar_values(value: object) -> list[str]:
    """Return all scalar values in a JSON-like object as normalized strings."""
    values: list[str] = []
    if isinstance(value, dict):
        for nested_value in value.values():
            values.extend(json_scalar_values(nested_value))
    elif isinstance(value, list):
        for nested_value in value:
            values.extend(json_scalar_values(nested_value))
    elif value is not None:
        values.append(str(value).strip().lower())
    return values


def project_root_for_app(app_root: Path) -> Path:
    """Return the user project root for a resolved application directory."""
    if app_root.parent.name.lower() == "applications":
        return app_root.parent.parent
    return app_root.parent


def app_ux_contract_path(app_root: Path) -> Path:
    """Return the preferred root-level UX contract path for an application."""
    return project_root_for_app(app_root) / APP_UX_CONTRACT_RELATIVE_PATH


def legacy_app_ux_contract_path(app_root: Path) -> Path:
    """Return the legacy app-local UX contract path."""
    return app_root / LEGACY_APP_UX_CONTRACT_RELATIVE_PATH


def existing_app_ux_contract_path(app_root: Path) -> Path | None:
    """Return the first supported UX contract path that exists."""
    preferred_path = app_ux_contract_path(app_root)
    if preferred_path.exists():
        return preferred_path
    legacy_path = legacy_app_ux_contract_path(app_root)
    if legacy_path.exists():
        return legacy_path
    return None


def app_requires_ux_contract(app_root: Path) -> bool:
    """Return whether an app root declares itself as a full-app FR/model generation run."""
    if existing_app_ux_contract_path(app_root):
        return True

    metadata_path = app_root / ".apex" / "apexlang.json"
    if not metadata_path.exists():
        return False
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except Exception:
        return False
    if isinstance(metadata, dict) and metadata.get("requiresAppUxContract") is True:
        return True

    marker_text = " ".join(json_scalar_values(metadata))
    return (
        ("full" in marker_text or "complete" in marker_text)
        and ("fr" in marker_text or "functional requirement" in marker_text or "requirement" in marker_text)
    )


def load_app_ux_contract(app_root: Path) -> tuple[dict[str, Any] | None, str | None]:
    """Load an app UX contract JSON file and return a payload/error pair."""
    contract_path = existing_app_ux_contract_path(app_root)
    if contract_path is None:
        return None, None
    try:
        payload = json.loads(contract_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return None, f"cannot parse app UX contract JSON: {exc}"
    if not isinstance(payload, dict):
        return None, "app UX contract must be a JSON object"
    return payload, None


def as_list(value: object) -> list[object]:
    """Normalize a JSON value into a list of entries."""
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return [value]
    return []


def dict_entries(value: object) -> list[dict[str, Any]]:
    """Return object entries from a JSON value."""
    return [entry for entry in as_list(value) if isinstance(entry, dict)]


def json_path_values(payload: dict[str, Any], *paths: str) -> list[object]:
    """Collect values from dotted JSON paths when present."""
    values: list[object] = []
    for raw_path in paths:
        current: object = payload
        found = True
        for part in raw_path.split("."):
            if not isinstance(current, dict) or part not in current:
                found = False
                break
            current = current[part]
        if found:
            values.append(current)
    return values


def contract_collection(payload: dict[str, Any], *paths: str) -> list[dict[str, Any]]:
    """Collect object entries from one or more contract locations."""
    entries: list[dict[str, Any]] = []
    for value in json_path_values(payload, *paths):
        entries.extend(dict_entries(value))
    return entries


def contract_page_number(entry: dict[str, Any], *names: str) -> int | None:
    """Extract a page number from a contract entry."""
    for name in names:
        if name in entry:
            value = entry.get(name)
            if isinstance(value, int):
                return value
            if isinstance(value, str):
                parsed = parse_int(value)
                if parsed is not None:
                    return parsed
    return None


def contract_string(entry: dict[str, Any], *names: str) -> str:
    """Extract the first non-empty string-ish value from a contract entry."""
    for name in names:
        value = entry.get(name)
        if value is None:
            continue
        if isinstance(value, (str, int, float)):
            text = str(value).strip()
            if text:
                return text
    return ""


def contract_bool(entry: dict[str, Any], name: str, default: bool = False) -> bool:
    """Extract a boolean from a contract entry."""
    value = entry.get(name)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "yes", "required"}
    return default


def contract_section_is_empty(value: object) -> bool:
    """Return whether a required contract section is missing meaningful content."""
    if value is None:
        return True
    if isinstance(value, (list, dict, str)):
        return len(value) == 0
    return False


def app_page_index(app_root: Path) -> dict[int, dict[str, object]]:
    """Return generated page metadata indexed by page number."""
    pages: dict[int, dict[str, object]] = {}
    pages_root = app_root / "pages"
    if not pages_root.exists():
        return pages
    for page_path in sorted(pages_root.glob("*.apx")):
        if is_export_backup_path(page_path):
            continue
        try:
            text = page_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for page_start, page_name, page_block in find_component_blocks(text, "page"):
            page_number = parse_int(page_name)
            if page_number is None:
                continue
            pages[page_number] = {
                "path": page_path,
                "text": text,
                "start": page_start,
                "name": page_name,
                "block": page_block,
            }
    return pages


def page_region_blocks(page_block: str) -> dict[str, str]:
    """Return immediate page regions by static id."""
    return {
        region_name: region_block
        for _region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region")
    }


def page_region_layout_props(page_block: str) -> dict[str, dict[str, tuple[str, int]]]:
    """Return immediate page region layout properties by static id."""
    layouts: dict[str, dict[str, tuple[str, int]]] = {}
    for _region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
        layout_meta = extract_top_level_blocks(region_block).get("layout")
        if not layout_meta:
            continue
        _layout_offset, layout_block = layout_meta
        layouts[region_name] = layout_properties(layout_block)
    return layouts


def page_has_region_type(page_block: str, expected_types: set[str]) -> bool:
    """Return whether a page has at least one region matching a normalized region type."""
    for _region_offset, _region_name, region_block in find_immediate_component_blocks(page_block, "region"):
        region_type = region_schema_key(extract_item_type(region_block) or "")
        if region_type in expected_types:
            return True
    return False


def page_region_has_type(page_block: str, region_name: str, expected_types: set[str]) -> bool:
    """Return whether a named region has a matching normalized type."""
    region_block = page_region_blocks(page_block).get(region_name)
    if not region_block:
        return False
    return region_schema_key(extract_item_type(region_block) or "") in expected_types


def ux_pattern_expected_types(pattern_name: str) -> set[str]:
    """Map contract UX pattern names to expected APEX region families."""
    normalized = re.sub(r"[^a-z0-9]+", "", pattern_name.lower())
    if normalized in {"dashboard", "analytics", "kpi"}:
        return {"metricCard", "chart"}
    if normalized in {"masterdetail", "masterdetailworkbench", "workbench"}:
        return {"contentRow"}
    if normalized in {"cards", "card", "gallery", "media", "visualsummarycards"}:
        return {"cards"}
    if normalized in {"map", "spatialmap"}:
        return {"map"}
    if normalized in {"calendar", "schedule"}:
        return {"calendar"}
    if normalized in {"smartfilters", "smartfilter", "smartsearch"}:
        return {"smartFilters"}
    if normalized in {"facetedsearch", "facets"}:
        return {"facetedSearch"}
    if normalized in {"hub", "listnavigation", "navigationhub", "launchhub"}:
        return {"staticContent", "list"}
    return set()


def list_entry_target_pages(app_root: Path) -> set[int]:
    """Return page numbers targeted by shared navigation/list entries."""
    list_path = app_root / "shared-components" / "lists.apx"
    if not list_path.exists():
        return set()
    try:
        text = list_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return set()

    pages: set[int] = set()
    for _list_start, _list_name, list_block in find_component_blocks(text, "list"):
        for _entry_offset, _entry_name, entry_block in find_immediate_component_blocks(list_block, "entry"):
            link_meta = extract_top_level_blocks(entry_block).get("link")
            if not link_meta:
                continue
            _link_offset, link_block = link_meta
            target_page = target_page_from_link_block(link_block)
            if target_page is not None:
                pages.add(target_page)
    return pages


def shared_list_entry_metadata(app_root: Path) -> dict[int, list[dict[str, str]]]:
    """Return shared list entry metadata indexed by target page."""
    list_path = app_root / "shared-components" / "lists.apx"
    if not list_path.exists():
        return {}
    try:
        text = list_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return {}

    by_page: dict[int, list[dict[str, str]]] = {}
    for _list_start, list_name, list_block in find_component_blocks(text, "list"):
        for _entry_offset, entry_name, entry_block in find_immediate_component_blocks(list_block, "entry"):
            target_page: int | None = None
            link_meta = extract_top_level_blocks(entry_block).get("link")
            if link_meta:
                _link_offset, link_block = link_meta
                target_page = target_page_from_link_block(link_block)
            if target_page is None:
                continue

            icon_value = ""
            icon_meta = extract_top_level_blocks(entry_block).get("icon")
            if icon_meta:
                _icon_offset, icon_block = icon_meta
                icon_props = {
                    prop_name: clean_scalar_value(prop_value)
                    for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(icon_block)
                }
                icon_value = icon_props.get("imageIconCssClasses", "")

            description_value = ""
            uda_meta = extract_top_level_blocks(entry_block).get("userDefinedAttributes")
            if uda_meta:
                _uda_offset, uda_block = uda_meta
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(uda_block):
                    if prop_name == "1":
                        description_value = clean_scalar_value(prop_value)
                        break

            by_page.setdefault(target_page, []).append(
                {
                    "list": list_name,
                    "entry": entry_name,
                    "icon": icon_value,
                    "description": description_value,
                }
            )
    return by_page


def normalize_ref(value: str) -> str:
    """Normalize an APEXlang reference-like value for comparison."""
    return clean_scalar_value(value).lstrip("@").strip()


def breadcrumb_entry_index(app_root: Path) -> dict[int, dict[str, object]]:
    """Return shared breadcrumb entries indexed by page number."""
    breadcrumb_path = app_root / "shared-components" / "breadcrumbs.apx"
    if not breadcrumb_path.exists():
        return {}
    try:
        text = breadcrumb_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return {}

    by_page: dict[int, dict[str, object]] = {}
    by_name: dict[str, dict[str, object]] = {}
    for _breadcrumb_start, _breadcrumb_name, breadcrumb_block in find_component_blocks(text, "breadcrumb"):
        for _entry_offset, entry_name, entry_block in find_immediate_component_blocks(breadcrumb_block, "entry"):
            props = dict((name, (value, offset)) for name, value, offset in extract_immediate_property_values(entry_block))
            page_number = parse_int(clean_scalar_value(props.get("pageNumber", ("", 0))[0]) or None)
            if page_number is None:
                continue
            parent_entry = ""
            appearance_meta = extract_top_level_blocks(entry_block).get("appearance")
            if appearance_meta:
                _appearance_offset, appearance_block = appearance_meta
                appearance_props = dict(
                    (name, (value, offset)) for name, value, offset in extract_immediate_brace_property_values(appearance_block)
                )
                parent_entry = normalize_ref(appearance_props.get("parentEntry", ("", 0))[0])
            entry = {
                "name": entry_name,
                "page": page_number,
                "parentEntry": parent_entry,
                "parentPage": None,
            }
            by_page[page_number] = entry
            by_name[entry_name] = entry

    for entry in by_page.values():
        parent_entry = str(entry.get("parentEntry") or "")
        if parent_entry and parent_entry in by_name:
            entry["parentPage"] = by_name[parent_entry].get("page")
    return by_page


def contract_page_list(payload: dict[str, Any], *paths: str) -> list[int]:
    """Collect page numbers from one or more contract list paths."""
    pages: list[int] = []
    for value in json_path_values(payload, *paths):
        for item in as_list(value):
            page_number: int | None = None
            if isinstance(item, int):
                page_number = item
            elif isinstance(item, str):
                page_number = parse_int(item)
            elif isinstance(item, dict):
                page_number = contract_page_number(item, "page", "pageNumber", "targetPage", "launchPage")
            if page_number is not None:
                pages.append(page_number)
    return pages


def management_hub_page_number(contract: dict[str, Any], inventory: list[dict[str, Any]]) -> int | None:
    """Resolve the management hub page from explicit contract data or page inventory."""
    explicit_pages = contract_page_list(contract, "compositionPlan.managementHubPage", "compositionPlan.launchHubPage")
    if explicit_pages:
        return explicit_pages[0]
    for entry in inventory:
        page_number = contract_page_number(entry, "page", "pageNumber", "id")
        haystack = " ".join(
            filter(
                None,
                (
                    contract_string(entry, "name", "label", "title"),
                    contract_string(entry, "type", "apexPattern", "pattern"),
                ),
            )
        ).lower()
        if page_number and "management" in haystack and ("hub" in haystack or "launcher" in haystack):
            return page_number
    return None


def contextual_page_type(page_type: str) -> bool:
    """Return whether a planned page depends on a contextual launcher link."""
    normalized = page_type.lower()
    return any(token in normalized for token in ("context", "detail", "360", "drilldown")) and "modal" not in normalized


def link_contract_entries(contract: dict[str, Any]) -> list[dict[str, Any]]:
    """Collect contract entries that should materialize as links or navigation actions."""
    return contract_collection(
        contract,
        "compositionPlan.hubEntries",
        "compositionPlan.managementHubEntries",
        "behaviorPlan.modalTargets",
        "compositionPlan.modalTargets",
        "behaviorPlan.pageActions",
        "compositionPlan.pageActions",
        "behaviorPlan.reportLinks",
        "compositionPlan.reportLinks",
        "behaviorPlan.rowLinks",
        "compositionPlan.rowLinks",
        "behaviorPlan.cardLinks",
        "compositionPlan.cardLinks",
        "behaviorPlan.mapTargets",
        "compositionPlan.mapTargets",
        "behaviorPlan.calendarLinks",
        "compositionPlan.calendarLinks",
        "behaviorPlan.contextLinks",
        "compositionPlan.contextLinks",
    )


def link_contract_pair(entry: dict[str, Any]) -> tuple[int | None, int | None]:
    """Extract source and target page numbers from a link-like contract entry."""
    source_page = contract_page_number(entry, "sourcePage", "page", "fromPage", "launcherPage")
    target_page = contract_page_number(
        entry,
        "targetPage",
        "modalPage",
        "launchPage",
        "detailPage",
        "contextPage",
        "toPage",
    )
    return source_page, target_page


def parse_layout_row_plan(page_block: str) -> list[dict[str, object]]:
    """Parse the compact layout_row_plan trace comment emitted in generated pages."""
    match = re.search(r"layout_row_plan\s*:\s*(\[[^\r\n]*\])", page_block)
    if not match:
        return []
    plan_text = match.group(1)[1:-1]
    rows: list[dict[str, object]] = []
    for row_match in re.finditer(r"\{([^{}]+)\}", plan_text):
        row_text = row_match.group(1)
        regions_match = re.search(r"regions\s*:\s*\[([^\]]*)\]", row_text)
        if not regions_match:
            continue
        regions = [
            region.strip().strip("'\"")
            for region in regions_match.group(1).split(",")
            if region.strip().strip("'\"")
        ]
        slot_match = re.search(r"slot\s*:\s*([^,\]]+)", row_text)
        recipe_match = re.search(r"recipe\s*:\s*([^,\]]+)", row_text)
        row_name_match = re.search(r"row\s*:\s*([^,\]]+)", row_text)
        rows.append(
            {
                "slot": (slot_match.group(1).strip().strip("'\"") if slot_match else ""),
                "recipe": (recipe_match.group(1).strip().strip("'\"") if recipe_match else ""),
                "row": (row_name_match.group(1).strip().strip("'\"") if row_name_match else ""),
                "regions": regions,
            }
        )
    return rows


def page_has_link_to_target(page_block: str, target_page: int, source_region: str = "") -> bool:
    """Return whether a page contains a declarative link/button target to a page."""
    for _region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
        if source_region and region_name != source_region:
            continue
        for _action_offset, _action_name, action_block in find_immediate_component_blocks(region_block, "action"):
            if target_page_from_action_behavior(action_block) == target_page:
                return True
        for _layer_offset, _layer_name, layer_block in find_immediate_component_blocks(region_block, "layer"):
            for _link_offset, link_block in find_immediate_named_brace_blocks(layer_block, "link"):
                if target_page_from_link_block(link_block) == target_page:
                    return True
        for _link_offset, link_block in find_immediate_named_brace_blocks(region_block, "link"):
            if target_page_from_link_block(link_block) == target_page:
                return True
        for _column_offset, _column_name, column_block in find_immediate_component_blocks(region_block, "column"):
            for _link_offset, link_block in find_immediate_named_brace_blocks(column_block, "link"):
                if target_page_from_link_block(link_block) == target_page:
                    return True
    for _button_offset, _button_name, button_block in find_immediate_component_blocks(page_block, "button"):
        if source_region:
            region_ref = button_region_reference(button_block)
            if region_ref != f"@{source_region}":
                continue
        if target_page_from_button_behavior(button_block) == target_page:
            return True
    return False


def page_has_button_to_target(page_block: str, target_page: int, source_region: str = "") -> bool:
    """Return whether a page-level or region-scoped button targets a page."""
    for _button_offset, _button_name, button_block in find_immediate_component_blocks(page_block, "button"):
        if source_region:
            region_ref = button_region_reference(button_block)
            if region_ref != f"@{source_region}":
                continue
        if target_page_from_button_behavior(button_block) == target_page:
            return True
    return False


def page_has_breadcrumb_button_to_target(page_block: str, target_page: int) -> bool:
    """Return whether a button targets a page from the breadcrumb/title-bar region."""
    for _button_offset, _button_name, button_block in find_immediate_component_blocks(page_block, "button"):
        region_ref = button_region_reference(button_block)
        if region_ref not in {"@breadcrumb", "@Breadcrumb"}:
            continue
        if target_page_from_button_behavior(button_block) == target_page:
            return True
    return False


def page_has_breadcrumb_region(page_block: str) -> bool:
    """Return whether a page has a breadcrumb/title-bar region available for page actions."""
    for _region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
        region_type = region_schema_key(extract_item_type(region_block) or "")
        if region_type == "breadcrumb" or region_name.lower() == "breadcrumb":
            return True
    return False


def page_contains_declared_columns(page_block: str, columns: list[str]) -> bool:
    """Return whether all declared column identifiers appear in a page block."""
    normalized_block = page_block.upper()
    return all(normalize_sql_identifier(column) in normalized_block for column in columns if column)


def page_item_type(page_block: str, item_name: str) -> str:
    """Return a page item's type, or an empty string when missing."""
    for _item_offset, current_item_name, item_block in find_immediate_component_blocks(page_block, "pageItem"):
        if current_item_name.upper() == item_name.upper():
            return extract_item_type(item_block) or ""
    return ""


def page_item_block(page_block: str, item_name: str) -> str:
    """Return a page item's block, or an empty string when missing."""
    for _item_offset, current_item_name, item_block in find_immediate_component_blocks(page_block, "pageItem"):
        if current_item_name.upper() == item_name.upper():
            return item_block
    return ""


def normalize_contract_item(value: str) -> str:
    """Normalize contract item references for APEXlang page-item comparisons."""
    return clean_scalar_value(value).lstrip("@").upper()


def contract_nested_dict(entry: dict[str, Any], *names: str) -> dict[str, Any]:
    """Return the first nested object from a contract entry."""
    for name in names:
        value = entry.get(name)
        if isinstance(value, dict):
            return value
    return {}


def contract_nested_string(entry: dict[str, Any], names: tuple[str, ...], nested_names: tuple[str, ...]) -> str:
    """Extract a string from either top-level aliases or nested object aliases."""
    direct = contract_string(entry, *names)
    if direct:
        return direct
    for nested_name in nested_names:
        nested = entry.get(nested_name)
        if isinstance(nested, dict):
            nested_value = contract_string(nested, *names)
            if nested_value:
                return nested_value
    return ""


def validation_block_requires_item_when(page_block: str, target_item: str, when_item: str, when_value: str) -> bool:
    """Return whether a page-level validation requires target_item when when_item has when_value."""
    target = normalize_contract_item(target_item)
    controller = normalize_contract_item(when_item)
    value = clean_scalar_value(when_value).upper()
    if not target or not controller or not value:
        return False

    for _validation_offset, _validation_name, validation_block in find_immediate_component_blocks(page_block, "validation"):
        block_text = validation_block.upper()
        if target not in block_text or controller not in block_text or value not in block_text:
            continue
        if re.search(r"\bITEMISNOTNULL\b|\bIS\s+NOT\s+NULL\b|\bNOT\s+NULL\b|\bVALUE\s+REQUIRED\b", block_text):
            return True

    return False


def page_item_has_static_required_validation(page_block: str, target_item: str) -> bool:
    """Return whether an item is unconditionally required through its item validation block."""
    item_block = page_item_block(page_block, target_item)
    if not item_block:
        return False
    validation_meta = extract_top_level_blocks(item_block).get("validation")
    if not validation_meta:
        return False
    _validation_offset, validation_block = validation_meta
    validation_props = {
        prop_name: clean_scalar_value(prop_value).lower()
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(validation_block)
    }
    return validation_props.get("valuerequired") == "true" or validation_props.get("valueRequired") == "true"


def page_has_required_validation(page_block: str, entry: dict[str, Any]) -> bool:
    """Return whether a form validation contract entry is represented in page artifacts."""
    target_item = contract_nested_string(
        entry,
        ("item", "pageItem", "targetItem", "requiredItem", "associatedItem"),
        ("requiredWhen", "when", "condition"),
    )
    when_item = contract_nested_string(
        entry,
        ("whenItem", "controllerItem", "dependsOnItem", "sourceItem"),
        ("requiredWhen", "when", "condition"),
    )
    when_value = contract_nested_string(
        entry,
        ("whenValue", "value", "equals", "expectedValue"),
        ("requiredWhen", "when", "condition"),
    )
    if not target_item:
        return True
    if when_item and when_value:
        return validation_block_requires_item_when(page_block, target_item, when_item, when_value)
    return page_item_has_static_required_validation(page_block, target_item)


def page_item_is_context_hidden(page_block: str, item_name: str) -> bool:
    """Return whether an item is rendered as hidden for context-owned form state."""
    item_block = page_item_block(page_block, item_name)
    if not item_block:
        return False
    item_type = (extract_item_type(item_block) or "").lower()
    if item_type == "hidden":
        return True
    appearance_meta = extract_top_level_blocks(item_block).get("appearance")
    if not appearance_meta:
        return False
    _appearance_offset, appearance_block = appearance_meta
    appearance_props = {
        prop_name: clean_scalar_value(prop_value)
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(appearance_block)
    }
    return appearance_props.get("template") == "@/hidden"


def page_has_defaulting_behavior(page_block: str, target_item: str, source_item: str = "", source_column: str = "") -> bool:
    """Return whether a target item has an explicit default/set-value behavior from a source item or column."""
    target = normalize_contract_item(target_item)
    source = normalize_contract_item(source_item)
    column = normalize_sql_identifier(source_column).upper() if source_column else ""
    if not target:
        return True
    normalized_block = page_block.upper()
    if target not in normalized_block:
        return False
    if source and source not in normalized_block:
        return False
    if column and column not in normalized_block:
        return False
    return bool(re.search(r"\bDYNAMICACTION\b|\bSETVALUE\b|\bCOMPUTATION\b|\bINITIALI[ZS]E\b|\bSQLQUERY\b|\bPLSQL\b|\bDEFAULT\s*\{", normalized_block))


def lint_app_ux_contract(app_root: Path) -> list[str]:
    """Validate full-app UX traceability declared by the root .apexlang contract."""
    issues: list[str] = []
    if is_template_base_app_structure_path(app_root) or not app_root.exists() or not app_root.is_dir():
        return issues

    contract_path = existing_app_ux_contract_path(app_root) or app_ux_contract_path(app_root)
    contract, contract_error = load_app_ux_contract(app_root)
    if contract is None:
        if app_requires_ux_contract(app_root):
            detail = contract_error or "full-app FR/model generation must include .apexlang/app-ux-contract.json at the user project root"
            issues.append(
                f"{display_path(contract_path)}:1: APP_UX_CONTRACT_REQUIRED_001 {detail}"
            )
        return issues
    if contract_error:
        issues.append(f"{display_path(contract_path)}:1: APP_UX_CONTRACT_REQUIRED_001 {contract_error}")
        return issues

    required_sections = (
        "sourceEvidence",
        "pageInventory",
        "compositionPlan",
        "richUiPatternPlan",
        "lovPlan",
        "behaviorPlan",
        "testPlan",
    )
    for section_name in required_sections:
        if contract_section_is_empty(contract.get(section_name)):
            issues.append(
                f"{display_path(contract_path)}:1: APP_UX_CONTRACT_REQUIRED_001 "
                f"app UX contract must define non-empty section '{section_name}'"
            )

    pages = app_page_index(app_root)
    inventory = contract_collection(contract, "pageInventory")
    page_inventory_types: dict[int, str] = {}
    inventory_pages: set[int] = set()
    for entry in inventory:
        page_number = contract_page_number(entry, "page", "pageNumber", "id")
        if page_number is None:
            issues.append(
                f"{display_path(contract_path)}:1: APP_UX_TRACEABILITY_REQUIRED_001 "
                "pageInventory entry must declare page or pageNumber"
            )
            continue
        inventory_pages.add(page_number)
        page_inventory_types[page_number] = contract_string(entry, "type", "apexPattern", "pattern", "pageType")
        if page_number not in pages:
            issues.append(
                f"{display_path(contract_path)}:1: APP_UX_PAGE_MISSING_001 "
                f"contract pageInventory declares page {page_number} but no matching pages/p{page_number:05d}-*.apx exists"
            )
        if not contract_string(entry, "requirementId", "requirement", "sourceRequirement", "derivedWorkflowId", "derivedWorkflow"):
            issues.append(
                f"{display_path(contract_path)}:1: APP_UX_TRACEABILITY_REQUIRED_001 "
                f"pageInventory page {page_number} must map to requirementId or derivedWorkflowId"
            )

    for page_number, page_data in pages.items():
        page_block = str(page_data["block"])
        if page_number in {0, 9999} or page_is_modal_dialog(page_block) or is_login_page(str(page_data["name"]), page_block):
            continue
        if page_number not in inventory_pages:
            issues.append(
                f"{display_path(page_data['path'])}:{line_no(str(page_data['text']), int(page_data['start']))}: "
                f"APP_UX_TRACEABILITY_REQUIRED_001 generated user page {page_number} must have a pageInventory contract entry"
            )

    rich_ui_entries = contract_collection(contract, "richUiPatternPlan")
    rich_ui_patterns_by_page: dict[int, set[str]] = {}
    for pattern_entry in rich_ui_entries:
        pattern_page = contract_page_number(pattern_entry, "page", "pageNumber")
        pattern_name = contract_string(pattern_entry, "pattern", "type", "apexPattern")
        if pattern_page and pattern_name:
            rich_ui_patterns_by_page.setdefault(pattern_page, set()).add(
                re.sub(r"[^a-z0-9]+", "", pattern_name.lower())
            )

    for entry in rich_ui_entries:
        if not contract_bool(entry, "required", True):
            continue
        page_number = contract_page_number(entry, "page", "pageNumber")
        pattern_name = contract_string(entry, "pattern", "type", "apexPattern")
        expected_types = ux_pattern_expected_types(pattern_name)
        if not page_number or not pattern_name or not expected_types or page_number not in pages:
            continue
        page_block = str(pages[page_number]["block"])
        normalized_pattern_name = re.sub(r"[^a-z0-9]+", "", pattern_name.lower())
        filter_owner_patterns = {"facetedsearch", "facets", "smartfilters", "smartfilter", "smartsearch"}
        if (
            normalized_pattern_name in {"cards", "card", "visualsummarycards"}
            and page_has_region_type(page_block, {"facetedSearch", "smartFilters"})
            and not (rich_ui_patterns_by_page.get(page_number, set()) & filter_owner_patterns)
        ):
            issues.append(
                f"{display_path(pages[page_number]['path'])}:"
                f"{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 page {page_number} declares the visual-summary Cards "
                "pattern but contains Faceted Search or Smart Filters orchestration without declaring that "
                "filtering pattern as the owner"
            )
        region_name = contract_string(entry, "region", "regionStaticId", "regionId")
        has_pattern = (
            page_region_has_type(page_block, region_name, expected_types)
            if region_name
            else page_has_region_type(page_block, expected_types)
        )
        if not has_pattern:
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_PATTERN_REQUIRED_001 page {page_number} contract requires UX pattern '{pattern_name}'"
                + (f" in region '{region_name}'" if region_name else "")
            )

        declared_columns = [
            contract_string(entry, "displayColumn"),
            contract_string(entry, "imageColumn"),
            contract_string(entry, "tooltipColumn"),
            contract_string(entry, "infoWindowColumn"),
        ]
        declared_columns.extend(str(column) for column in as_list(entry.get("tooltipColumns")) if isinstance(column, str))
        declared_columns = [column for column in declared_columns if column]
        if declared_columns and not page_contains_declared_columns(page_block, declared_columns):
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_DISPLAY_MAPPING_REQUIRED_001 page {page_number} pattern '{pattern_name}' must use declared display column(s): "
                f"{', '.join(declared_columns)}"
            )

    navigation_pages = list_entry_target_pages(app_root)
    for entry in contract_collection(contract, "compositionPlan.navigationMenu", "compositionPlan.navigationEntries"):
        page_number = contract_page_number(entry, "page", "pageNumber", "targetPage")
        if page_number and page_number not in navigation_pages:
            issues.append(
                f"{display_path(app_root / 'shared-components' / 'lists.apx')}:1: "
                f"APP_UX_TRACEABILITY_REQUIRED_001 navigation contract requires a shared list entry targeting page {page_number}"
            )

    breadcrumb_entries = breadcrumb_entry_index(app_root)
    for entry in contract_collection(contract, "compositionPlan.breadcrumbs", "compositionPlan.breadcrumbEntries"):
        page_number = contract_page_number(entry, "page", "pageNumber", "targetPage")
        if not page_number:
            continue
        actual = breadcrumb_entries.get(page_number)
        if not actual:
            issues.append(
                f"{display_path(app_root / 'shared-components' / 'breadcrumbs.apx')}:1: "
                f"APP_UX_BREADCRUMB_HIERARCHY_REQUIRED_001 breadcrumb contract requires an entry for page {page_number}"
            )
            continue
        expected_parent_entry = normalize_ref(contract_string(entry, "parentEntry", "parent"))
        expected_parent_page = contract_page_number(entry, "parentPage", "parentPageNumber")
        actual_parent_entry = str(actual.get("parentEntry") or "")
        actual_parent_page = actual.get("parentPage")
        if expected_parent_entry and actual_parent_entry != expected_parent_entry:
            issues.append(
                f"{display_path(app_root / 'shared-components' / 'breadcrumbs.apx')}:1: "
                f"APP_UX_BREADCRUMB_HIERARCHY_REQUIRED_001 page {page_number} breadcrumb must use parentEntry @{expected_parent_entry}"
            )
        if expected_parent_page and actual_parent_page != expected_parent_page:
            issues.append(
                f"{display_path(app_root / 'shared-components' / 'breadcrumbs.apx')}:1: "
                f"APP_UX_BREADCRUMB_HIERARCHY_REQUIRED_001 page {page_number} breadcrumb must be parented to page {expected_parent_page}"
            )

    management_targets = set(contract_page_list(contract, "compositionPlan.managementHubPages"))
    management_hub_page = management_hub_page_number(contract, inventory)
    if management_targets and management_hub_page:
        for target_page in sorted(page for page in management_targets if page != management_hub_page):
            actual = breadcrumb_entries.get(target_page)
            actual_parent_page = actual.get("parentPage") if actual else None
            if actual_parent_page != management_hub_page:
                issues.append(
                    f"{display_path(app_root / 'shared-components' / 'breadcrumbs.apx')}:1: "
                    f"APP_UX_BREADCRUMB_HIERARCHY_REQUIRED_001 management page {target_page} "
                    f"must have breadcrumb parent page {management_hub_page}"
                )

    shared_list_entries = shared_list_entry_metadata(app_root)
    for target_page in sorted(management_targets):
        entries = shared_list_entries.get(target_page, [])
        if not entries:
            continue
        if not any(re.search(r"\bfa-[A-Za-z0-9_-]+\b", entry.get("icon", "")) for entry in entries):
            issues.append(
                f"{display_path(app_root / 'shared-components' / 'lists.apx')}:1: "
                f"APP_UX_HUB_ICON_REQUIRED_001 management hub target page {target_page} "
                "must have a shared list entry with icon.imageIconCssClasses using a fa-* icon"
            )
        if not any(entry.get("description", "") for entry in entries):
            issues.append(
                f"{display_path(app_root / 'shared-components' / 'lists.apx')}:1: "
                f"APP_UX_HUB_ICON_REQUIRED_001 management hub target page {target_page} "
                "must have a shared list entry description for the media-list hub"
            )

    for entry in contract_collection(contract, "compositionPlan.hubEntries", "compositionPlan.managementHubEntries"):
        source_page = contract_page_number(entry, "sourcePage", "page")
        target_page = contract_page_number(entry, "targetPage", "launchPage")
        if not source_page or not target_page or source_page not in pages:
            continue
        if not page_has_link_to_target(str(pages[source_page]["block"]), target_page):
            issues.append(
                f"{display_path(pages[source_page]['path'])}:{line_no(str(pages[source_page]['text']), int(pages[source_page]['start']))}: "
                f"APP_UX_TRACEABILITY_REQUIRED_001 hub contract requires page {source_page} to link to page {target_page}"
            )

    declared_link_pairs: set[tuple[int, int]] = set()
    for entry in link_contract_entries(contract):
        source_page, target_page = link_contract_pair(entry)
        if source_page and target_page:
            declared_link_pairs.add((source_page, target_page))

    for entry in contract_collection(
        contract,
        "behaviorPlan.reportLinks",
        "compositionPlan.reportLinks",
        "behaviorPlan.rowLinks",
        "compositionPlan.rowLinks",
        "behaviorPlan.cardLinks",
        "compositionPlan.cardLinks",
        "behaviorPlan.contextLinks",
        "compositionPlan.contextLinks",
    ):
        source_page, target_page = link_contract_pair(entry)
        source_region = contract_string(entry, "sourceRegion", "region", "reportRegion", "launcherRegion")
        if not source_page or not target_page or source_page not in pages:
            continue
        if not page_has_link_to_target(str(pages[source_page]["block"]), target_page, source_region):
            issues.append(
                f"{display_path(pages[source_page]['path'])}:{line_no(str(pages[source_page]['text']), int(pages[source_page]['start']))}: "
                f"APP_UX_TRACEABILITY_REQUIRED_001 report link contract requires page {source_page} "
                f"region '{source_region or '*'}' to link to page {target_page}"
            )

    for page_number, page_type in page_inventory_types.items():
        if not contextual_page_type(page_type):
            continue
        actual = breadcrumb_entries.get(page_number)
        parent_page = actual.get("parentPage") if actual else None
        if not parent_page or parent_page not in pages:
            continue
        if (parent_page, page_number) not in declared_link_pairs:
            issues.append(
                f"{display_path(pages[parent_page]['path'])}:{line_no(str(pages[parent_page]['text']), int(pages[parent_page]['start']))}: "
                f"APP_UX_TRACEABILITY_REQUIRED_001 contextual page {page_number} ('{page_type}') "
                f"must have a behaviorPlan.reportLinks/contextLinks entry from breadcrumb parent page {parent_page}"
            )
            continue
        if not page_has_link_to_target(str(pages[parent_page]["block"]), page_number):
            issues.append(
                f"{display_path(pages[parent_page]['path'])}:{line_no(str(pages[parent_page]['text']), int(pages[parent_page]['start']))}: "
                f"APP_UX_TRACEABILITY_REQUIRED_001 contextual page {page_number} ('{page_type}') "
                f"must be reachable from breadcrumb parent page {parent_page}"
            )

    for entry in contract_collection(contract, "behaviorPlan.parentChildContext", "compositionPlan.parentChildContext"):
        page_number = contract_page_number(entry, "page", "sourcePage", "pageNumber")
        if not page_number or page_number not in pages:
            continue
        page_type = page_inventory_types.get(page_number, "")
        if not re.search(r"(parent|child|master|detail|workbench)", page_type, re.IGNORECASE):
            continue
        action_coverage = dict_entries(entry.get("actionCoverage"))
        action_coverage.extend(dict_entries(entry.get("actions")))
        action_coverage.extend(dict_entries(entry.get("links")))
        if not action_coverage:
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"PARENT_CHILD_ACTION_COVERAGE_REQUIRED_001 parent-child page {page_number} must declare actionCoverage "
                "for required parent edit, child create, child edit/detail, and page-level create behaviors"
            )
            continue
        page_block = str(pages[page_number]["block"])
        for action in action_coverage:
            target_page = contract_page_number(action, "targetPage", "modalPage", "launchPage", "detailPage")
            source_region = contract_string(action, "sourceRegion", "region", "reportRegion", "launcherRegion")
            action_name = contract_string(action, "name", "action", "actionType", "type") or "action"
            if not target_page:
                issues.append(
                    f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                    f"PARENT_CHILD_ACTION_COVERAGE_REQUIRED_001 parent-child page {page_number} action '{action_name}' "
                    "must declare targetPage/modalPage"
                )
                continue
            if not page_has_link_to_target(page_block, target_page, source_region):
                issues.append(
                    f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                    f"PARENT_CHILD_ACTION_COVERAGE_REQUIRED_001 parent-child page {page_number} action '{action_name}' "
                    f"must link from region '{source_region or '*'}' to page {target_page}"
                )

    for entry in contract_collection(contract, "behaviorPlan.modalTargets", "compositionPlan.modalTargets"):
        source_page = contract_page_number(entry, "sourcePage", "page")
        target_page = contract_page_number(entry, "targetPage", "modalPage")
        source_region = contract_string(entry, "sourceRegion", "region", "launcherRegion")
        if not source_page or not target_page or source_page not in pages:
            continue
        if not page_has_link_to_target(str(pages[source_page]["block"]), target_page, source_region):
            issues.append(
                f"{display_path(pages[source_page]['path'])}:{line_no(str(pages[source_page]['text']), int(pages[source_page]['start']))}: "
                f"APP_UX_TRACEABILITY_REQUIRED_001 modal target contract requires page {source_page} "
                f"region '{source_region or '*'}' to launch page {target_page}"
            )

    for entry in contract_collection(contract, "behaviorPlan.pageActions", "compositionPlan.pageActions"):
        source_page = contract_page_number(entry, "sourcePage", "page")
        target_page = contract_page_number(entry, "targetPage", "modalPage", "launchPage")
        source_region = contract_string(entry, "sourceRegion", "region", "launcherRegion")
        placement = contract_string(entry, "placement", "location", "slot")
        if not source_page or not target_page or source_page not in pages:
            continue
        page_block = str(pages[source_page]["block"])
        if placement.lower() in {"breadcrumb", "breadcrumbbar", "titlebar", "title-bar"}:
            if not page_has_breadcrumb_button_to_target(page_block, target_page):
                issues.append(
                    f"{display_path(pages[source_page]['path'])}:{line_no(str(pages[source_page]['text']), int(pages[source_page]['start']))}: "
                    f"APP_UX_TRACEABILITY_REQUIRED_001 page action contract requires page {source_page} "
                    f"to expose a breadcrumb/title-bar button targeting page {target_page}"
                )
            continue
        if not page_has_button_to_target(page_block, target_page, source_region):
            issues.append(
                f"{display_path(pages[source_page]['path'])}:{line_no(str(pages[source_page]['text']), int(pages[source_page]['start']))}: "
                f"APP_UX_TRACEABILITY_REQUIRED_001 page action contract requires page {source_page} "
                f"region '{source_region or '*'}' to expose a button targeting page {target_page}"
            )

    for entry in contract_collection(contract, "behaviorPlan.refreshDependencies", "compositionPlan.refreshDependencies"):
        page_number = contract_page_number(entry, "page", "sourcePage")
        target_region = contract_string(entry, "targetRegion", "refreshRegion", "region")
        trigger_region = contract_string(entry, "triggerRegion", "sourceRegion")
        event_name = contract_string(entry, "event")
        if not page_number or not target_region or page_number not in pages:
            continue
        page_block = str(pages[page_number]["block"])
        has_refresh = (
            page_has_dialog_close_refresh(page_block, target_region)
            if event_name == "apexafterclosedialog"
            else bool(trigger_region and page_has_region_refresh_action(page_block, trigger_region, target_region))
        )
        if not has_refresh:
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_PATTERN_REQUIRED_001 refresh contract requires page {page_number} to refresh region '{target_region}'"
            )

    lov_item_types = {"selectList", "popupLov", "radioGroup", "checkboxGroup", "combobox", "shuttle"}
    for entry in contract_collection(contract, "lovPlan", "behaviorPlan.lovPlan"):
        page_number = contract_page_number(entry, "page", "pageNumber")
        item_name = contract_string(entry, "item", "pageItem", "itemName")
        display_column = contract_string(entry, "displayColumn", "display")
        return_column = contract_string(entry, "returnColumn", "return")
        if not page_number or not item_name or page_number not in pages:
            continue
        page_block = str(pages[page_number]["block"])
        item_type = page_item_type(page_block, item_name)
        if item_type not in lov_item_types:
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_LOV_MAPPING_REQUIRED_001 contract item {item_name} must use an LOV-capable item type, got '{item_type or 'missing'}'"
            )
        required_columns = [column for column in (display_column, return_column) if column]
        if required_columns and not page_contains_declared_columns(page_block, required_columns):
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_LOV_MAPPING_REQUIRED_001 item {item_name} must use declared LOV column(s): {', '.join(required_columns)}"
            )

    for entry in contract_collection(contract, "compositionPlan.layoutRecipes", "pageInventory"):
        page_number = contract_page_number(entry, "page", "pageNumber", "id")
        recipe = contract_string(entry, "layoutRecipe", "layout", "recipe")
        if not page_number or not recipe or page_number not in pages:
            continue
        page_block = str(pages[page_number]["block"])
        if recipe == "master-detail-split" and not page_has_region_type(page_block, {"contentRow"}):
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_LAYOUT_RECIPE_REQUIRED_001 page {page_number} layout recipe '{recipe}' requires a Content Row master region"
            )
        if recipe == "dashboard-row-plan" and "layout_row_plan" not in page_block:
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_LAYOUT_RECIPE_REQUIRED_001 page {page_number} layout recipe '{recipe}' requires layout_row_plan traceability"
            )

    dashboard_pages = {
        contract_page_number(entry, "page", "pageNumber", "id")
        for entry in inventory
        if any(token in contract_string(entry, "type", "apexPattern", "pattern").lower() for token in ("dashboard", "analytics"))
    }
    dashboard_pages.discard(None)
    for page_number in sorted(page for page in dashboard_pages if page in pages):
        page_block = str(pages[page_number]["block"])
        row_plan = parse_layout_row_plan(page_block)
        if not row_plan:
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_LAYOUT_RECIPE_REQUIRED_001 dashboard page {page_number} requires layout_row_plan traceability"
            )
            continue
        layouts = page_region_layout_props(page_block)
        for row in row_plan:
            regions = [str(region) for region in row.get("regions", [])]
            if not regions:
                continue
            recipe = str(row.get("recipe") or "").strip().lower()
            expected_region_count = DASHBOARD_LAYOUT_ROW_RECIPE_REGION_COUNTS.get(recipe)
            if recipe in DASHBOARD_LAYOUT_ROW_DISALLOWED_RECIPES:
                issues.append(
                    f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                    f"APP_UX_LAYOUT_RECIPE_REQUIRED_001 dashboard row '{row.get('row') or '*'}' recipe '{recipe}' is not a valid emitted row recipe; "
                    f"{DASHBOARD_LAYOUT_ROW_DISALLOWED_RECIPES[recipe]}"
                )
            if expected_region_count is not None and len(regions) != expected_region_count:
                issues.append(
                    f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                    f"APP_UX_LAYOUT_RECIPE_REQUIRED_001 dashboard row '{row.get('row') or '*'}' recipe '{recipe}' must list exactly "
                    f"{expected_region_count} region{'s' if expected_region_count != 1 else ''}; create separate row-plan entries for stacked full-width sections"
                )
            for index, region_name in enumerate(regions):
                if region_name not in layouts:
                    issues.append(
                        f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                        f"APP_UX_LAYOUT_RECIPE_REQUIRED_001 dashboard layout_row_plan references missing region '{region_name}'"
                    )
                    continue
                props = layouts[region_name]
                start_new_row = clean_scalar_value(props.get("startNewRow", ("", 0))[0]).lower()
                if index == 0 and start_new_row == "false":
                    issues.append(
                        f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                        f"APP_UX_LAYOUT_RECIPE_REQUIRED_001 dashboard row '{row.get('row') or '*'}' "
                        f"first region '{region_name}' must omit layout.startNewRow"
                    )
                if index > 0 and start_new_row != "false":
                    issues.append(
                        f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                        f"APP_UX_LAYOUT_RECIPE_REQUIRED_001 dashboard row '{row.get('row') or '*'}' "
                        f"sibling region '{region_name}' must set layout.startNewRow: false"
                    )

    for entry in contract_collection(
        contract,
        "behaviorPlan.validations",
        "behaviorPlan.formValidations",
        "behaviorPlan.conditionalValidations",
        "compositionPlan.validations",
    ):
        page_number = contract_page_number(entry, "page", "pageNumber", "targetPage")
        if not page_number or page_number not in pages:
            continue
        target_item = contract_nested_string(
            entry,
            ("item", "pageItem", "targetItem", "requiredItem", "associatedItem"),
            ("requiredWhen", "when", "condition"),
        )
        when_item = contract_nested_string(
            entry,
            ("whenItem", "controllerItem", "dependsOnItem", "sourceItem"),
            ("requiredWhen", "when", "condition"),
        )
        when_value = contract_nested_string(
            entry,
            ("whenValue", "value", "equals", "expectedValue"),
            ("requiredWhen", "when", "condition"),
        )
        if not target_item:
            continue
        if not page_has_required_validation(str(pages[page_number]["block"]), entry):
            condition_text = f" when {when_item} = {when_value}" if when_item and when_value else ""
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_FORM_VALIDATION_REQUIRED_001 page {page_number} must require item {normalize_contract_item(target_item)}{condition_text}"
            )

    for entry in contract_collection(
        contract,
        "behaviorPlan.formContext",
        "behaviorPlan.formBehaviors",
        "behaviorPlan.formItems",
        "compositionPlan.formContext",
    ):
        page_number = contract_page_number(entry, "page", "pageNumber", "targetPage")
        item_name = contract_string(entry, "item", "pageItem", "itemName", "contextItem", "parentItem")
        if not page_number or not item_name or page_number not in pages:
            continue
        visibility = contract_string(entry, "visibility", "display", "renderAs", "contextDisplay").lower()
        context_owned = contract_bool(entry, "contextOwned") or contract_bool(entry, "hideWhenContext") or contract_bool(entry, "hiddenInContext")
        if visibility in {"hidden", "context-hidden", "hiddenincontext"} or context_owned:
            if not page_item_is_context_hidden(str(pages[page_number]["block"]), item_name):
                issues.append(
                    f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                    f"APP_UX_FORM_CONTEXT_REQUIRED_001 page {page_number} context-owned item {normalize_contract_item(item_name)} "
                    "must be hidden or rendered with the hidden item template"
                )

    for entry in contract_collection(
        contract,
        "behaviorPlan.defaulting",
        "behaviorPlan.formDefaults",
        "behaviorPlan.itemDefaults",
        "compositionPlan.formDefaults",
    ):
        page_number = contract_page_number(entry, "page", "pageNumber", "targetPage")
        target_item = contract_string(entry, "item", "pageItem", "targetItem", "defaultItem")
        if not page_number or not target_item or page_number not in pages:
            continue
        source_item = contract_string(entry, "sourceItem", "dependsOnItem", "triggerItem", "fromItem")
        source_column = contract_string(entry, "sourceColumn", "defaultColumn", "fromColumn", "lookupColumn")
        if not page_has_defaulting_behavior(str(pages[page_number]["block"]), target_item, source_item, source_column):
            source_text = ""
            if source_item:
                source_text += f" from item {normalize_contract_item(source_item)}"
            if source_column:
                source_text += f" using column {normalize_sql_identifier(source_column).upper()}"
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_FORM_DEFAULT_REQUIRED_001 page {page_number} must default item {normalize_contract_item(target_item)}{source_text}"
            )

    for entry in contract_collection(contract, "compositionPlan.accessibility", "behaviorPlan.accessibility"):
        page_number = contract_page_number(entry, "page", "pageNumber")
        required_text = contract_string(entry, "landmarkType", "noDataMessage", "label", "helpText")
        if not page_number or not required_text or page_number not in pages:
            continue
        if required_text.lower() not in str(pages[page_number]["block"]).lower():
            issues.append(
                f"{display_path(pages[page_number]['path'])}:{line_no(str(pages[page_number]['text']), int(pages[page_number]['start']))}: "
                f"APP_UX_ACCESSIBILITY_GUIDANCE_REQUIRED_001 page {page_number} must include declared accessibility/guidance text '{required_text}'"
            )

    return issues


def layout_properties(layout_block: str) -> dict[str, tuple[str, int]]:
    """Extract layout property values with offsets from a layout block."""
    return {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_property_values(layout_block)
    }


def is_equal_width_explicit_group(group: list[dict[str, object]]) -> bool:
    """Return whether a group uses explicit equal-width grid coordinates."""
    if len(group) < 2:
        return False
    spans = [region["column_span"] for region in group]
    columns = [region["column"] for region in group]
    if any(span is None or column is None for span, column in zip(spans, columns)):
        return False
    first_column = columns[0]
    first_span = spans[0]
    if first_column != 1 or first_span is None:
        return False
    if any(span != first_span for span in spans):
        return False
    expected_columns = [1 + idx * first_span for idx in range(len(group))]
    return columns == expected_columns


def has_explicit_coordinates(component: dict[str, object]) -> bool:
    """Return whether a component declares complete grid coordinates."""
    return component["column"] is not None or component["column_span"] is not None


def is_allowed_asymmetric_mixed_row(row: list[dict[str, object]]) -> bool:
    """Return whether a mixed row matches the canonical narrow-lead split recipe."""
    if len(row) != 2:
        return False

    first, second = row
    if first["kind"] != "region" or second["kind"] != "region":
        return False
    if first["column"] is not None or second["column"] is not None or second["column_span"] is not None:
        return False
    if first["column_span"] not in (3, 4):
        return False
    return second["start_new_row"] == "false"


def component_scope_label(component: dict[str, object]) -> str:
    """Build a concise label for diagnostics about a component scope."""
    scope_type = component["scope_type"]
    scope_name = component["scope_name"]
    scope_slot = component["scope_slot"]

    if scope_type == "page-slot":
        return f"page slot '{scope_name}'"
    if scope_type == "nested-region":
        return f"nested region scope parent '{scope_name}' slot '{scope_slot}'"
    if scope_type == "item-region":
        return f"item scope region '{scope_name}' slot '{scope_slot}'"
    if scope_type == "button-region":
        return f"button scope region '{scope_name}' slot '{scope_slot}'"
    return f"layout scope '{scope_name}'"


def infer_scope_rows(components: list[dict[str, object]]) -> list[list[dict[str, object]]]:
    """Group components into inferred layout rows from explicit coordinates."""
    rows: list[list[dict[str, object]]] = []
    current_row: list[dict[str, object]] = []

    for component in sorted(components, key=lambda entry: (int(entry["sequence"]), int(entry["layout_offset"]))):
        if not current_row:
            current_row = [component]
            continue

        same_row = False
        if component["start_new_row"] == "false":
            same_row = True
        elif component["column"] is not None and int(component["column"]) > 1:
            same_row = True
        elif is_equal_width_explicit_group(current_row + [component]):
            same_row = True

        if same_row:
            current_row.append(component)
        else:
            rows.append(current_row)
            current_row = [component]

    if current_row:
        rows.append(current_row)

    return rows


def add_scoped_component(
    scoped_components: dict[tuple[str, str, str], list[dict[str, object]]],
    *,
    page_name: str,
    component_kind: str,
    component_name: str,
    component_start: int,
    layout_offset: int,
    props: dict[str, tuple[str, int]],
    scope_type: str,
    scope_name: str,
    scope_slot: str,
    fallback_sequence: int,
) -> None:
    """Append a component summary to the active layout scope."""
    start_new_row = props.get("startNewRow", ("", 0))[0]
    column = parse_int(props.get("column", ("", 0))[0] or None)
    column_span = parse_int(props.get("columnSpan", ("", 0))[0] or None)
    sequence = parse_int(props.get("sequence", ("", 0))[0] or None)

    scoped_components.setdefault((scope_type, scope_name, scope_slot), []).append(
        {
            "page_name": page_name,
            "kind": component_kind,
            "name": component_name,
            "layout_offset": component_start + layout_offset,
            "layout_props": props,
            "sequence": sequence if sequence is not None else fallback_sequence,
            "start_new_row": start_new_row,
            "column": column,
            "column_span": column_span,
            "scope_type": scope_type,
            "scope_name": scope_name,
            "scope_slot": scope_slot,
        }
    )


def lint_layout_scopes(path: Path, text: str) -> list[str]:
    """Validate layout scope and grid-coordinate consistency for an APEXlang file."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        scoped_components: dict[tuple[str, str, str], list[dict[str, object]]] = {}

        for index, (region_offset, region_name, region_block) in enumerate(
            find_immediate_component_blocks(page_block, "region")
        ):
            top_level_blocks = extract_top_level_blocks(region_block)
            layout_meta = top_level_blocks.get("layout")
            if not layout_meta:
                continue
            layout_offset, layout_block = layout_meta
            props = layout_properties(layout_block)
            slot = props.get("slot", ("", 0))[0]
            parent_region = props.get("parentRegion", ("", 0))[0]
            if parent_region:
                add_scoped_component(
                    scoped_components,
                    page_name=page_name,
                    component_kind="region",
                    component_name=region_name,
                    component_start=page_start + region_offset,
                    layout_offset=layout_offset,
                    props=props,
                    scope_type="nested-region",
                    scope_name=parent_region,
                    scope_slot=slot or "SUB_REGIONS",
                    fallback_sequence=(index + 1) * 10,
                )
            elif slot:
                add_scoped_component(
                    scoped_components,
                    page_name=page_name,
                    component_kind="region",
                    component_name=region_name,
                    component_start=page_start + region_offset,
                    layout_offset=layout_offset,
                    props=props,
                    scope_type="page-slot",
                    scope_name=slot,
                    scope_slot=slot,
                    fallback_sequence=(index + 1) * 10,
                )

        for index, (item_offset, item_name, item_block) in enumerate(find_immediate_component_blocks(page_block, "pageItem")):
            top_level_blocks = extract_top_level_blocks(item_block)
            layout_meta = top_level_blocks.get("layout")
            if not layout_meta:
                continue
            layout_offset, layout_block = layout_meta
            props = layout_properties(layout_block)
            region = props.get("region", ("", 0))[0]
            slot = props.get("slot", ("", 0))[0] or "BODY"
            if not region:
                continue
            add_scoped_component(
                scoped_components,
                page_name=page_name,
                component_kind="pageItem",
                component_name=item_name,
                component_start=page_start + item_offset,
                layout_offset=layout_offset,
                props=props,
                scope_type="item-region",
                scope_name=region,
                scope_slot=slot,
                fallback_sequence=(index + 1) * 10,
            )

        for index, (button_offset, button_name, button_block) in enumerate(find_immediate_component_blocks(page_block, "button")):
            top_level_blocks = extract_top_level_blocks(button_block)
            layout_meta = top_level_blocks.get("layout")
            if not layout_meta:
                continue
            layout_offset, layout_block = layout_meta
            props = layout_properties(layout_block)
            region = props.get("region", ("", 0))[0]
            slot = props.get("slot", ("", 0))[0] or "BODY"
            if not region:
                continue
            add_scoped_component(
                scoped_components,
                page_name=page_name,
                component_kind="button",
                component_name=button_name,
                component_start=page_start + button_offset,
                layout_offset=layout_offset,
                props=props,
                scope_type="button-region",
                scope_name=region,
                scope_slot=slot,
                fallback_sequence=(index + 1) * 10,
            )

        for components in scoped_components.values():
            for row in infer_scope_rows(components):
                first = row[0]
                scope_label = component_scope_label(first)
                first_component_label = f"{first['kind']} '{first['name']}'"

                if first["start_new_row"] == "false":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, int(first['layout_offset']))}: "
                        f"LAYOUT_RULE_ROW_START page '{page_name}' {scope_label} {first_component_label} must omit "
                        "layout.startNewRow on the first component in a row"
                    )

                if len(row) < 2:
                    continue

                inferred_equal_width = is_equal_width_explicit_group(row) or not any(
                    has_explicit_coordinates(component) for component in row
                )

                if inferred_equal_width:
                    for component in row[1:]:
                        if component["start_new_row"] != "false":
                            issues.append(
                                f"{display_path(path)}:{line_no(text, int(component['layout_offset']))}: "
                                f"LAYOUT_RULE_FLOW page '{page_name}' {scope_label} {component['kind']} "
                                f"'{component['name']}' must set layout.startNewRow: false for equal-width siblings"
                            )

                if is_equal_width_explicit_group(row):
                    for component in row:
                        for prop_name in ("column", "columnSpan"):
                            if prop_name not in component["layout_props"]:
                                continue
                            _value, prop_offset = component["layout_props"][prop_name]
                            issues.append(
                                f"{display_path(path)}:{line_no(text, int(component['layout_offset']) + prop_offset)}: "
                                f"LAYOUT_RULE_EQUAL_WIDTH page '{page_name}' {scope_label} {component['kind']} "
                                f"'{component['name']}' should omit layout.{prop_name} and rely on sequence plus "
                                "startNewRow: false for equal-width rows"
                            )

                explicit_spans = [int(component["column_span"]) for component in row if component["column_span"] is not None]
                if explicit_spans and sum(explicit_spans) > 12:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, int(first['layout_offset']))}: "
                        f"LAYOUT_RULE_ROW_SPAN page '{page_name}' {scope_label} row starting at {first_component_label} "
                        f"exceeds the 12-column grid within that scope (sum={sum(explicit_spans)})"
                    )

                has_explicit = any(has_explicit_coordinates(component) for component in row)
                has_implicit = any(not has_explicit_coordinates(component) for component in row)
                if has_explicit and has_implicit and not is_allowed_asymmetric_mixed_row(row):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, int(first['layout_offset']))}: "
                        f"LAYOUT_RULE_MIXED page '{page_name}' {scope_label} mixes implicit-flow and explicit-grid "
                        f"placement within the same row starting at {first_component_label}"
                    )

    return issues


def scalar_props_from_component(block: str) -> dict[str, tuple[str, int]]:
    """Return immediate scalar component properties by name."""
    return {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_property_values(block)
    }


def scalar_props_from_brace_block(block: str) -> dict[str, tuple[str, int]]:
    """Return immediate scalar brace properties by name."""
    return {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(block)
    }


def dashboard_region_category(region_type_key: str) -> str:
    """Classify a region for dashboard row-contract linting."""
    if region_type_key == "metricCard":
        return "metric"
    if region_type_key == "chart":
        return "chart"
    if region_type_key in DASHBOARD_LAYOUT_ROW_REGION_TYPES:
        return "content"
    return ""


def dashboard_page_is_likely(page_name: str, page_block: str, body_regions: list[dict[str, object]]) -> bool:
    """Return whether a page should receive dashboard-specific layout checks."""
    page_props = scalar_props_from_component(page_block)
    page_text_parts = [page_name]
    for prop_name in ("name", "alias", "title"):
        prop_meta = page_props.get(prop_name)
        if prop_meta:
            page_text_parts.append(clean_scalar_value(prop_meta[0]))
    page_text = " ".join(page_text_parts).lower()
    if any(keyword in page_text for keyword in DASHBOARD_PAGE_KEYWORDS):
        return True

    categories = [str(region.get("category") or "") for region in body_regions]
    if categories.count("chart") >= 2 or categories.count("metric") >= 2:
        return True
    return "chart" in categories and "metric" in categories


def metric_card_standard_template_is_justified(region_block: str) -> bool:
    """Return whether the region text explicitly justifies visible standard chrome."""
    normalized = region_block.lower()
    justification_terms = (
        "standard metric card wrapper justified",
        "titled wrapper",
        "landmarked wrapper",
        "visible region chrome",
        "visible standard region chrome",
    )
    return any(term in normalized for term in justification_terms)


def static_region_fakes_metric_card(region_name: str, region_block: str, top_level_blocks: dict[str, tuple[int, str]]) -> bool:
    """Detect static HTML regions that appear to fake a KPI Metric Card."""
    region_props = scalar_props_from_component(region_block)
    label_parts = [region_name]
    name_meta = region_props.get("name")
    if name_meta:
        label_parts.append(clean_scalar_value(name_meta[0]))
    label_text = " ".join(label_parts).lower()

    source_meta = top_level_blocks.get("source")
    source_text = ""
    if source_meta:
        _source_offset, source_block = source_meta
        source_text = extract_fenced_property_body(source_block, "htmlCode") or source_block
    source_text = source_text.lower()

    has_metric_label = any(keyword in label_text for keyword in DASHBOARD_METRIC_FAKE_KEYWORDS)
    has_metric_markup = any(keyword in source_text for keyword in ("metric-card", "metric_card", "kpi-card", "kpi_card"))
    return bool(source_text.strip()) and (has_metric_label or has_metric_markup)


def classic_report_fakes_metric_card(region_block: str, top_level_blocks: dict[str, tuple[int, str]]) -> bool:
    """Detect Classic Reports being used as single-value KPI Metric Card stand-ins."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return False
    _source_offset, source_block = source_meta
    source_sql = extract_fenced_property_body(source_block, "sqlQuery") or source_block
    source_text = source_sql.lower()
    if not any(keyword in source_text for keyword in DASHBOARD_KPI_CLASSIC_REPORT_SOURCE_KEYWORDS):
        return False

    column_names = [
        column_name.lower()
        for _column_offset, column_name, _column_block in find_immediate_component_blocks(region_block, "column")
    ]
    return any(column_name in DASHBOARD_KPI_CLASSIC_REPORT_SOURCE_KEYWORDS for column_name in column_names) or (
        " count(" in source_text
        or " sum(" in source_text
        or " avg(" in source_text
        or " min(" in source_text
        or " max(" in source_text
    )


def lint_dashboard_layout_contracts(path: Path, text: str) -> list[str]:
    """Validate dashboard-specific Metric Card and BODY row layout contracts."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        body_regions: list[dict[str, object]] = []

        for index, (region_offset, region_name, region_block) in enumerate(
            find_immediate_component_blocks(page_block, "region")
        ):
            region_type = extract_item_type(region_block) or ""
            region_type_key = region_schema_key(region_type)
            top_level_blocks = extract_top_level_blocks(region_block)
            layout_meta = top_level_blocks.get("layout")
            if not layout_meta:
                continue
            layout_offset, layout_block = layout_meta
            layout_props = layout_properties(layout_block)
            slot = clean_scalar_value(layout_props.get("slot", ("", 0))[0]).lower()
            parent_region = layout_props.get("parentRegion", ("", 0))[0]
            if slot != "body" or parent_region:
                continue

            appearance_template = ""
            appearance_meta = top_level_blocks.get("appearance")
            if appearance_meta:
                _appearance_offset, appearance_block = appearance_meta
                appearance_props = scalar_props_from_brace_block(appearance_block)
                appearance_template = clean_scalar_value(appearance_props.get("template", ("", 0))[0])

            body_regions.append(
                {
                    "name": region_name,
                    "region_type": region_type,
                    "region_type_key": region_type_key,
                    "category": dashboard_region_category(region_type_key),
                    "start": page_start + region_offset,
                    "layout_offset": page_start + region_offset + layout_offset,
                    "sequence": parse_int(layout_props.get("sequence", ("", 0))[0] or None) or (index + 1) * 10,
                    "start_new_row": clean_scalar_value(layout_props.get("startNewRow", ("", 0))[0]).lower(),
                    "column": parse_int(layout_props.get("column", ("", 0))[0] or None),
                    "column_span": parse_int(layout_props.get("columnSpan", ("", 0))[0] or None),
                    "appearance_template": appearance_template,
                    "block": region_block,
                    "top_level_blocks": top_level_blocks,
                }
            )

        if not body_regions or not dashboard_page_is_likely(page_name, page_block, body_regions):
            continue

        ordered_body_regions = sorted(body_regions, key=lambda entry: (int(entry["sequence"]), int(entry["start"])))
        metric_run: list[dict[str, object]] = []

        def flush_metric_run() -> None:
            """Report a run of sibling metric regions that should be normalized."""
            if len(metric_run) < 2:
                return
            first_metric = metric_run[0]
            issues.append(
                f"{display_path(path)}:{line_no(text, int(first_metric['start']))}: "
                f"METRIC_CARD_REGION_NORMALIZATION_REQUIRED_001 page '{page_name}' dashboard KPI strip has "
                f"{len(metric_run)} sibling Metric Card regions; use one normalized Metric Card region with one source row per metric"
            )

        previous: dict[str, object] | None = None
        for region in ordered_body_regions:
            category = str(region.get("category") or "")
            if category == "metric":
                metric_run.append(region)
            else:
                flush_metric_run()
                metric_run = []

            region_type_key = str(region["region_type_key"])
            appearance_template = str(region["appearance_template"])
            if (
                region_type_key == "metricCard"
                and appearance_template == "@/standard"
                and not metric_card_standard_template_is_justified(str(region["block"]))
            ):
                issues.append(
                    f"{display_path(path)}:{line_no(text, int(region['start']))}: "
                    f"METRIC_CARD_STANDARD_TEMPLATE_FORBIDDEN_001 page '{page_name}' dashboard KPI Metric Card "
                    f"region '{region['name']}' must use @/blank-with-attributes unless visible standard chrome is explicitly titled or landmarked"
                )

            if (
                region_type_key == "staticContent"
                and appearance_template == "@/standard"
                and static_region_fakes_metric_card(str(region["name"]), str(region["block"]), region["top_level_blocks"])  # type: ignore[arg-type]
            ):
                issues.append(
                    f"{display_path(path)}:{line_no(text, int(region['start']))}: "
                    f"STATIC_REGION_METRIC_CARD_FAKE_FORBIDDEN_001 page '{page_name}' static region "
                    f"'{region['name']}' must not fake KPI Metric Cards with standard/static markup; use themeTemplateComponent/metricCard"
                )

            if (
                region_type_key == "classicReport"
                and classic_report_fakes_metric_card(str(region["block"]), region["top_level_blocks"])  # type: ignore[arg-type]
            ):
                issues.append(
                    f"{display_path(path)}:{line_no(text, int(region['start']))}: "
                    f"DASHBOARD_KPI_METRIC_CARD_REQUIRED_001 page '{page_name}' Classic Report region "
                    f"'{region['name']}' looks like a single-value KPI; use themeTemplateComponent/metricCard "
                    "with a normalized metric source instead"
                )

            if previous:
                previous_category = str(previous.get("category") or "")
                same_dashboard_row_family = category and category == previous_category
                lacks_same_row_marker = region["start_new_row"] != "false"
                current_explicit = region["column"] is not None or region["column_span"] is not None
                previous_explicit = previous["column"] is not None or previous["column_span"] is not None
                if same_dashboard_row_family and lacks_same_row_marker and not current_explicit and not previous_explicit:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, int(region['layout_offset']))}: "
                        f"DASHBOARD_LAYOUT_ROW_PLAN_REQUIRED_001 page '{page_name}' dashboard BODY {category} region "
                        f"'{region['name']}' is stacked by omission; define layout_row_plan and set layout.startNewRow: false "
                        "on second-and-later equal-width siblings"
                    )

            previous = region

        flush_metric_run()

    return issues


def extract_property_names(block: str) -> list[tuple[str, int]]:
    """Extract top-level property names and offsets from a block."""
    props: list[tuple[str, int]] = []
    for match in re.finditer(r"(?m)^\s*([A-Za-z][A-Za-z0-9]*)\s*:", block):
        props.append((match.group(1), match.start()))
    return props


def extract_property_values(block: str) -> list[tuple[str, str, int]]:
    """Extract property values and offsets from a block body."""
    props: list[tuple[str, str, int]] = []
    line_offset = 0
    in_fence = False

    for line in block.splitlines(keepends=True):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            line_offset += len(line)
            continue

        if in_fence:
            line_offset += len(line)
            continue

        match = re.match(r"^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*([^\n]+)$", line)
        if match:
            props.append((match.group(1), match.group(2).strip(), line_offset + match.start()))

        line_offset += len(line)
    return props


def extract_immediate_property_values(block: str) -> list[tuple[str, str, int]]:
    """Extract immediate property values without descending into nested blocks."""
    declaration_end = block.find("(")
    if declaration_end == -1:
        return []
    body_start = block.find("\n", declaration_end)
    if body_start == -1:
        return []
    body_offset = body_start + 1
    body = block[body_offset:]
    props: list[tuple[str, str, int]] = []
    for prop_name, prop_value, prop_offset in extract_property_values(body):
        paren_depth, brace_depth = nesting_depth(body, prop_offset)
        if paren_depth == 0 and brace_depth == 0:
            props.append((prop_name, prop_value, body_offset + prop_offset))
    return props


def extract_immediate_brace_property_values(block: str) -> list[tuple[str, str, int]]:
    """Extract immediate brace-property values without descending into nested braces."""
    props: list[tuple[str, str, int]] = []
    for prop_name, prop_value, prop_offset in extract_property_values(block):
        paren_depth, brace_depth = nesting_depth(block, prop_offset)
        if paren_depth == 0 and brace_depth == 1:
            props.append((prop_name, prop_value, prop_offset))
    return props


def extract_immediate_brace_property_names(block: str) -> list[tuple[str, int]]:
    """Extract immediate brace-property names, including multiline properties such as sqlQuery:."""
    props: list[tuple[str, int]] = []
    for prop_name, prop_offset in extract_property_names(block):
        paren_depth, brace_depth = nesting_depth(block, prop_offset)
        if paren_depth == 0 and brace_depth == 1:
            props.append((prop_name, prop_offset))
    return props


def normalize_value(value: str) -> str:
    """Normalize scalar text for comparison with schema values."""
    normalized = value.strip().rstrip(",")
    if normalized.startswith('"') and normalized.endswith('"') and len(normalized) >= 2:
        normalized = normalized[1:-1]
    return normalized.strip().lower()


def expected_value_text(value: object) -> str:
    """Render schema values for readable issue messages."""
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    return str(value)


BUTTON_TEMPLATE_OPTION_EMITTED_VALUES = {
    "t-Button--desktopHideIcon",
    "t-Button--gapBottom",
    "t-Button--gapRight",
    "t-Button--hoverIconPush",
    "t-Button--hoverIconSpin",
    "t-Button--iconLeft",
    "t-Button--iconRight",
    "t-Button--link",
    "t-Button--mobileHideLabel",
    "t-Button--noUI",
    "t-Button--padLeft",
    "t-Button--padTop",
    "t-Button--pillStart",
    "t-Button--primary",
    "t-Button--simple",
    "t-Button--stretch",
    "t-Button--success",
    "t-Button--tiny",
}

BUTTON_TEMPLATE_OPTION_CANONICAL_BY_NORMALIZED = {
    normalize_value(value): value for value in BUTTON_TEMPLATE_OPTION_EMITTED_VALUES
}

BUTTON_TEMPLATE_OPTION_ALIAS_MAP = {
    "desktophideicon": "t-Button--desktopHideIcon",
    "gapbottom": "t-Button--gapBottom",
    "gapright": "t-Button--gapRight",
    "hide-icon-on-desktop": "t-Button--desktopHideIcon",
    "hide-label-on-mobile": "t-Button--mobileHideLabel",
    "hover-icon-push": "t-Button--hoverIconPush",
    "hover-icon-spin": "t-Button--hoverIconSpin",
    "hovericonpush": "t-Button--hoverIconPush",
    "hovericonspin": "t-Button--hoverIconSpin",
    "icon-left": "t-Button--iconLeft",
    "icon-right": "t-Button--iconRight",
    "iconleft": "t-Button--iconLeft",
    "iconright": "t-Button--iconRight",
    "left": "t-Button--iconLeft",
    "link": "t-Button--link",
    "mobilehidelabel": "t-Button--mobileHideLabel",
    "no-ui": "t-Button--noUI",
    "noui": "t-Button--noUI",
    "pad-left": "t-Button--padLeft",
    "pad-top": "t-Button--padTop",
    "padleft": "t-Button--padLeft",
    "padtop": "t-Button--padTop",
    "pill-start": "t-Button--pillStart",
    "pillstart": "t-Button--pillStart",
    "primary": "t-Button--primary",
    "push": "t-Button--hoverIconPush",
    "right": "t-Button--iconRight",
    "simple": "t-Button--simple",
    "spin": "t-Button--hoverIconSpin",
    "stretch": "t-Button--stretch",
    "success": "t-Button--success",
    "tiny": "t-Button--tiny",
}

BUTTON_ICON_POSITION_TEMPLATE_OPTIONS = {"t-Button--iconLeft", "t-Button--iconRight"}

CALENDAR_LEGACY_SETTING_ALIASES = {
    "displayCol": "displayColumn",
    "startDateCol": "startDateColumn",
    "endDateCol": "endDateColumn",
    "allDayEventCol": "allDayEventColumn",
    "pkCol": "pkColumn",
}

CALENDAR_ADDITIONAL_VIEW_VALUES = {"list", "navigation"}

DYNAMIC_ACTION_ALLOWED_EVENTS = {
    "apexafterclosecanceldialog",
    "apexafterclosedialog",
    "apexafterrefresh",
    "apexbeforepagesubmit",
    "apexbeforerefresh",
    "apexdoubletap",
    "apexpan",
    "apexpress",
    "apexselectionchange",
    "apexswipe",
    "apextap",
    "change",
    "click",
    "custom",
    "dblclick",
    "focusin",
    "focusout",
    "input",
    "item/geocodedAddress/apexgeocoderresponse",
    "item/geocodedAddress/apexgeocoderselection",
    "item/markdownEditor/markdownified",
    "item/shuttle/shuttlechangeorder",
    "keydown",
    "keypress",
    "keyup",
    "load",
    "mousedown",
    "mouseenter",
    "mouseleave",
    "mousemove",
    "mouseup",
    "ready",
    "region/calendar/apexcalendardateselect",
    "region/calendar/apexcalendareventselect",
    "region/calendar/apexcalendarviewchange",
    "region/cards/tablemodelviewpagechange",
    "region/facetedSearch/facetsafterremovechart",
    "region/facetedSearch/facetsbeforeaddchart",
    "region/facetedSearch/facetschange",
    "region/interactiveGrid/apexbeginrecordedit",
    "region/interactiveGrid/gridpagechange",
    "region/interactiveGrid/interactivegridmodechange",
    "region/interactiveGrid/interactivegridreportchange",
    "region/interactiveGrid/interactivegridsave",
    "region/interactiveGrid/interactivegridselectionchange",
    "region/interactiveGrid/interactivegridviewchange",
    "region/map/spatialmapchanged",
    "region/map/spatialmapclick",
    "region/map/spatialmapinitialized",
    "region/map/spatialmapobjectclick",
    "region/smartFilters/facetschange",
    "region/tree/treeviewselectionchange",
    "resize",
    "scroll",
    "select",
    "unload",
}


def is_button_template_family_path(path: Path) -> bool:
    """Return whether a path belongs to the references/policies button template family."""
    normalized_path = display_path(path).replace("\\", "/").lower()
    return "/templates/buttons/" in normalized_path


def extract_template_option_entries(block_text: str) -> list[tuple[str, int]]:
    """Extract templateOptions entries from an appearance-like block."""
    entries: list[tuple[str, int]] = []
    array_match = re.search(r"(?ms)templateOptions\s*:\s*\[(.*?)\]", block_text)
    if array_match:
        body = array_match.group(1)
        line_offset = 0
        for line in body.splitlines(keepends=True):
            stripped = line.strip()
            if not stripped:
                line_offset += len(line)
                continue
            search_start = 0
            for part in [segment.strip() for segment in stripped.split(",") if segment.strip()]:
                part_offset = line.find(part, search_start)
                if part_offset == -1:
                    part_offset = line.find(part)
                entries.append((part, array_match.start(1) + line_offset + max(part_offset, 0)))
                search_start = max(part_offset, 0) + len(part)
            line_offset += len(line)
        return entries

    for prop_name, prop_value, prop_offset in extract_property_values(block_text):
        if prop_name == "templateOptions":
            entries.append((prop_value, prop_offset))
    return entries


def extract_clean_property_value(block_text: str, prop_name: str) -> tuple[str, int] | None:
    """Extract a cleaned property value from a block."""
    for found_name, found_value, found_offset in extract_property_values(block_text):
        if found_name == prop_name:
            return clean_scalar_value(found_value), found_offset
    return None


def lint_button_template_option_values(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    block_offset: int,
    block_text: str,
    template_mode: bool,
) -> None:
    """Validate button appearance.templateOptions values against the canonical emitted-value contract."""
    issue_prefix = "DSL_TEMPLATE_VALUE" if template_mode else "DSL_RULE_VALUE"

    for token, token_offset in extract_template_option_entries(block_text):
        cleaned = token.strip().rstrip(",")
        if not cleaned or ("{{" in cleaned and "}}" in cleaned):
            continue
        if cleaned == "#DEFAULT#":
            continue

        normalized = normalize_value(cleaned)
        canonical = BUTTON_TEMPLATE_OPTION_CANONICAL_BY_NORMALIZED.get(normalized)
        alias_target = BUTTON_TEMPLATE_OPTION_ALIAS_MAP.get(normalized)
        absolute_offset = component_start + block_offset + token_offset

        if alias_target is not None:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_offset)}: "
                f"{issue_prefix} {component_label} appearance.templateOptions must use canonical emitted value "
                f"'{alias_target}' instead of '{cleaned}'"
            )
            continue

        if canonical is not None:
            if cleaned != canonical:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_offset)}: "
                    f"{issue_prefix} {component_label} appearance.templateOptions must use canonical emitted value "
                    f"'{canonical}' instead of '{cleaned}'"
                )
            continue

        issues.append(
            f"{display_path(path)}:{line_no(text, absolute_offset)}: "
            f"{issue_prefix} {component_label} appearance.templateOptions must use an accepted canonical emitted "
            f"button value; got '{cleaned}'"
        )


def lint_button_icon_position_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    block_offset: int,
    block_text: str,
    template_mode: bool,
) -> None:
    """Validate default icon placement for text-with-icon buttons and the icon-only exception."""
    issue_prefix = "DSL_TEMPLATE_VALUE" if template_mode else "DSL_RULE_VALUE"
    button_template_meta = extract_clean_property_value(block_text, "buttonTemplate")
    if not button_template_meta:
        return

    button_template, button_template_offset = button_template_meta
    if "{{" in button_template and "}}" in button_template:
        return

    option_entries = extract_template_option_entries(block_text)
    has_variable_options = any("{{" in token and "}}" in token for token, _offset in option_entries)
    position_entries = [
        (token.strip().rstrip(","), token_offset)
        for token, token_offset in option_entries
        if token.strip().rstrip(",") in BUTTON_ICON_POSITION_TEMPLATE_OPTIONS
    ]

    if button_template == "@/text-with-icon":
        icon_meta = extract_clean_property_value(block_text, "icon")
        if not icon_meta:
            return
        icon_value, icon_offset = icon_meta
        if not icon_value or icon_value.lower() == "null" or ("{{" in icon_value and "}}" in icon_value):
            return
        if has_variable_options:
            return
        if not position_entries:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_offset + icon_offset)}: "
                f"{issue_prefix} {component_label} appearance.templateOptions must include "
                "'t-Button--iconLeft' by default, or 't-Button--iconRight' when explicitly requested, "
                "when @/text-with-icon has an icon"
            )
            return
        if len(position_entries) > 1:
            _token, token_offset = position_entries[1]
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_offset + token_offset)}: "
                f"{issue_prefix} {component_label} appearance.templateOptions must include exactly one "
                "button icon-position option for @/text-with-icon"
            )
        return

    if button_template == "@/icon" and position_entries:
        token, token_offset = position_entries[0]
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset + token_offset)}: "
            f"{issue_prefix} {component_label} appearance.templateOptions must not include '{token}' "
            "for icon-only @/icon buttons"
        )


def lint_button_template_option_contract(path: Path, text: str, *, template_mode: bool) -> list[str]:
    """Validate button appearance.templateOptions blocks in templates and final .apx files."""
    issues: list[str] = []

    for start, button_name, block in find_component_blocks(text, "button"):
        top_level_blocks = extract_top_level_blocks(block)
        appearance_meta = top_level_blocks.get("appearance")
        if not appearance_meta:
            continue
        block_offset, block_text = appearance_meta
        component_label = f"button '{button_name}'"
        lint_button_template_option_values(
            issues=issues,
            path=path,
            text=text,
            component_start=start,
            component_label=component_label,
            block_offset=block_offset,
            block_text=block_text,
            template_mode=template_mode,
        )
        lint_button_icon_position_contract(
            issues=issues,
            path=path,
            text=text,
            component_start=start,
            component_label=component_label,
            block_offset=block_offset,
            block_text=block_text,
            template_mode=template_mode,
        )

    return issues


def lint_button_template_option_inventory(path: Path, text: str) -> list[str]:
    """Validate button template-option inventories use canonical emitted values instead of static_id aliases."""
    issues: list[str] = []
    if not is_button_template_family_path(path):
        return issues

    for match in re.finditer(r"static_id\s*=\s*([A-Za-z0-9-]+)", text):
        alias = match.group(1)
        canonical = BUTTON_TEMPLATE_OPTION_ALIAS_MAP.get(normalize_value(alias))
        if canonical is None:
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, match.start(1))}: "
            f"DSL_TEMPLATE_VALUE button template-option inventory must use canonical emitted value "
            f"'{canonical}' instead of static_id '{alias}'"
        )

    return issues


def clean_scalar_value(value: str) -> str:
    """Remove wrapping quotes and whitespace from scalar DSL values."""
    cleaned = value.strip().rstrip(",")
    if cleaned.startswith('"') and cleaned.endswith('"') and len(cleaned) >= 2:
        cleaned = cleaned[1:-1]
    return cleaned.strip()


def normalize_semantic_value(value: str) -> str:
    """Normalize APX-friendly values to compiler-native values for semantic checks."""
    cleaned = clean_scalar_value(value)
    return APEXLANG_NATIVE_VALUE_ALIASES.get(cleaned, cleaned)


def apx_ast_component_label(node: ApexlangAstComponent) -> str:
    """Render a concise component label for diagnostics."""
    return f"{node.keyword} \"{node.identifier}\"" if node.identifier else node.keyword


def parse_apx_component_tree(text: str) -> list[ApexlangAstComponent]:
    """Parse APX component declarations into a source-offset component tree."""
    lines = iter_line_spans(text)
    nodes: list[ApexlangAstComponent] = []
    for idx, (line_offset, line) in enumerate(lines):
        match = APEXLANG_COMPONENT_DECLARATION_DETAIL_PATTERN.match(line.rstrip("\r\n"))
        if not match:
            continue
        end_idx = find_apexlang_component_end_line(lines, idx)
        end_offset, end_line = lines[end_idx]
        nodes.append(
            ApexlangAstComponent(
                keyword=match.group(1),
                identifier=match.group(2) or "",
                start_offset=line_offset,
                end_offset=end_offset + len(end_line),
                text=text[line_offset : end_offset + len(end_line)],
            )
        )

    nodes.sort(key=lambda node: (node.start_offset, -(node.end_offset - node.start_offset)))
    roots: list[ApexlangAstComponent] = []
    stack: list[ApexlangAstComponent] = []
    for node in nodes:
        while stack and not (stack[-1].start_offset < node.start_offset and stack[-1].end_offset >= node.end_offset):
            stack.pop()
        if stack:
            node.parent = stack[-1]
            stack[-1].children.append(node)
        else:
            roots.append(node)
        stack.append(node)

    for node in nodes:
        node.direct_properties = {
            prop_name: ApexlangAstProperty(
                name=prop_name,
                value=prop_value,
                offset=node.start_offset + prop_offset,
            )
            for prop_name, prop_value, prop_offset in extract_immediate_property_values(node.text)
        }
        for group_name, (group_offset, group_block) in extract_top_level_blocks(node.text).items():
            node.group_properties[group_name] = {
                prop_name: ApexlangAstProperty(
                    name=prop_name,
                    value=prop_value,
                    offset=node.start_offset + group_offset + prop_offset,
                )
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(group_block)
            }
    return roots


def walk_apx_ast(nodes: list[ApexlangAstComponent]) -> list[ApexlangAstComponent]:
    """Return APX AST nodes in preorder."""
    result: list[ApexlangAstComponent] = []

    def walk(node: ApexlangAstComponent) -> None:
        result.append(node)
        for child in node.children:
            walk(child)

    for root in nodes:
        walk(root)
    return result


def runtime_component_records(runtime_component_map: dict[str, Any]) -> list[dict[str, Any]]:
    """Return normalized runtime component records from the compiler map."""
    records = runtime_component_map.get("componentTypes")
    return records if isinstance(records, list) else []


def apx_component_property_values(node: ApexlangAstComponent) -> dict[str, str]:
    """Return normalized semantic property values for one component."""
    values: dict[str, str] = {}
    for prop in node.direct_properties.values():
        values[prop.name] = normalize_semantic_value(prop.value)
    for group_props in node.group_properties.values():
        for prop in group_props.values():
            values.setdefault(prop.name, normalize_semantic_value(prop.value))
    return values


def condition_value(condition: dict[str, Any], values: dict[str, str]) -> tuple[str, str | None]:
    """Resolve a metadata condition property against normalized source values."""
    property_name = str(condition.get("propertyName") or "")
    property_id = str(condition.get("propertyId") or "")
    if property_id and property_id in values:
        return "known", values[property_id]
    if property_name and property_name in values:
        return "known", values[property_name]
    return "unknown", None


def evaluate_metadata_leaf(condition: dict[str, Any], values: dict[str, str]) -> str:
    """Evaluate one compiler metadata condition leaf against semantic values."""
    state, actual_value = condition_value(condition, values)
    if state != "known" or actual_value is None:
        return "unknown"
    actual = normalize_semantic_value(actual_value)
    expected = normalize_semantic_value(str(condition.get("value", "")))
    expected_values = [normalize_semantic_value(str(value)) for value in condition.get("values") or []]
    condition_type = condition.get("type")
    if condition_type == "EQUALS":
        return "true" if actual == expected else "false"
    if condition_type == "NOT_EQUALS":
        return "false" if actual == expected else "true"
    if condition_type == "IN_LIST":
        return "true" if actual in expected_values else "false"
    if condition_type == "NOT_IN_LIST":
        return "false" if actual in expected_values else "true"
    if condition_type == "NOT_NULL":
        return "true" if actual else "false"
    if condition_type == "NULL":
        return "false" if actual else "true"
    if condition_type == "STARTS_WITH":
        return "true" if actual.startswith(expected) else "false"
    if condition_type == "STARTS_WITH_ANY":
        return "true" if any(actual.startswith(value) for value in expected_values) else "false"
    if condition_type == "FEATURES":
        features = NATIVE_TYPE_FEATURES.get(actual)
        if features is None:
            return "unknown"
        return "true" if all(value in features for value in expected_values) else "false"
    return "unknown"


def combine_metadata_states(operator: str, states: list[str]) -> str:
    """Combine metadata condition states using compiler condition operators."""
    if operator == "AND":
        if "false" in states:
            return "false"
        if states and all(state == "true" for state in states):
            return "true"
        return "unknown"
    if operator == "OR":
        if "true" in states:
            return "true"
        if states and all(state == "false" for state in states):
            return "false"
        return "unknown"
    return "unknown"


def evaluate_metadata_condition(condition: Any, values: dict[str, str]) -> str:
    """Evaluate compiler metadata dependsOn/parentDependsOn conditions."""
    if not isinstance(condition, dict):
        return "true"
    nested = condition.get("conditions")
    if isinstance(nested, list):
        return combine_metadata_states(
            str(condition.get("operator") or "AND"),
            [evaluate_metadata_condition(child, values) for child in nested],
        )
    return evaluate_metadata_leaf(condition, values)


def filter_records_by_condition(records: list[dict[str, Any]], values: dict[str, str], condition_key: str) -> list[dict[str, Any]]:
    """Apply condition filtering, preferring known-true matches over unknown matches."""
    evaluated: list[tuple[dict[str, Any], str]] = []
    for record in records:
        condition = record.get(condition_key)
        if not condition:
            evaluated.append((record, "unconditional"))
        else:
            evaluated.append((record, evaluate_metadata_condition(condition, values)))
    true_matches = [record for record, state in evaluated if state == "true"]
    if true_matches:
        return true_matches
    return [record for record, state in evaluated if state != "false"]


def resolve_apx_component_record(
    node: ApexlangAstComponent,
    runtime_component_map: dict[str, Any],
) -> tuple[dict[str, Any] | None, str | None]:
    """Resolve an APX component node to exactly one compiler component record."""
    candidates = [
        record
        for record in runtime_component_records(runtime_component_map)
        if isinstance(record, dict) and record.get("singular") == node.keyword
    ]
    if node.parent:
        parent_singular = (
            str(node.parent.compiler_record.get("singular"))
            if isinstance(node.parent.compiler_record, dict)
            else node.parent.keyword
        )
        candidates = [record for record in candidates if record.get("parentComponentType") == parent_singular]
        candidates = filter_records_by_condition(candidates, apx_component_property_values(node.parent), "parentDependsOn")
    elif len(candidates) > 1:
        candidates = [record for record in candidates if not record.get("parentComponentType")]

    if len(candidates) == 1:
        return candidates[0], None
    if not candidates:
        return None, "none"
    return None, "ambiguous"


def compiler_property_candidates(
    record: dict[str, Any],
    group_name: str | None,
    property_name: str,
) -> list[dict[str, Any]]:
    """Return compiler property records for a property name in component or group scope."""
    if group_name:
        groups = record.get("groups")
        group_props = groups.get(group_name) if isinstance(groups, dict) else None
        return [
            prop
            for prop in (group_props if isinstance(group_props, list) else [])
            if isinstance(prop, dict) and prop.get("propertyName") == property_name
        ]
    props = record.get("properties")
    return [
        prop
        for prop in (props if isinstance(props, list) else [])
        if isinstance(prop, dict) and prop.get("propertyName") == property_name
    ]


def expected_child_keyword(node: ApexlangAstComponent) -> tuple[str, str] | None:
    """Return provenance-tagged required child keyword for known compiler child contracts."""
    native_type = apx_component_property_values(node).get("type", "")
    return REQUIRED_CHILD_CONTRACTS.get((node.keyword, native_type))


def lint_semantic_component_tree(ctx: LintContext) -> list[str]:
    """Validate APX components through compiler metadata instead of BNF semantics."""
    runtime_component_map = ctx.runtime_component_map
    if not isinstance(runtime_component_map, dict):
        return []
    issues: list[str] = []
    roots = parse_apx_component_tree(ctx.text)
    for node in walk_apx_ast(roots):
        record, failure = resolve_apx_component_record(node, runtime_component_map)
        node.compiler_record = record
        semantic_child_scope = bool(
            node.parent
            and node.parent.keyword == "region"
            and node.keyword in {"filter", "facet"}
        )
        if record is None:
            if not semantic_child_scope:
                continue
            if failure == "ambiguous":
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, node.start_offset)}: "
                    f"APEXLANG_AMBIGUOUS_COMPONENT_001 ambiguous component {apx_component_property_values(node)} "
                    f"for {apx_ast_component_label(node)}; add parent/type context so compiler metadata resolves exactly one record"
                )
                continue
            if node.parent:
                parent_type = node.parent.direct_properties.get("type")
                parent_type_value = clean_scalar_value(parent_type.value) if parent_type else "<missing>"
                parent_native_type = normalize_semantic_value(parent_type_value)
                expected = expected_child_keyword(node.parent)
                expected_text = f"; {node.parent.keyword}.type = {parent_type_value} requires child \"{expected[0]}\"" if expected else ""
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, node.start_offset)}: "
                    "APEXLANG_INVALID_CHILD_COMPONENT_001 "
                    f"Invalid child component \"{node.keyword}\" under {apx_ast_component_label(node.parent)}. "
                    f"parent type: {parent_type_value} / {parent_native_type}{expected_text}"
                )
            else:
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, node.start_offset)}: "
                    f"APEXLANG_UNKNOWN_COMPONENT_001 compiler metadata has no component record for {apx_ast_component_label(node)}"
                )
            continue

        values = apx_component_property_values(node)
        if semantic_child_scope:
            for prop in node.direct_properties.values():
                candidates = compiler_property_candidates(record, None, prop.name)
                if not candidates:
                    issues.append(
                        f"{display_path(ctx.path)}:{line_no(ctx.text, prop.offset)}: "
                        f"APEXLANG_SEMANTIC_PROPERTY_UNKNOWN_001 {apx_ast_component_label(node)} property '{prop.name}' "
                        "is not present in compiler metadata"
                    )
                    continue
                active = filter_records_by_condition(candidates, values, "dependsOn")
                if not active:
                    issues.append(
                        f"{display_path(ctx.path)}:{line_no(ctx.text, prop.offset)}: "
                        f"APEXLANG_INACTIVE_PROPERTY_001 {apx_ast_component_label(node)} property '{prop.name}' "
                        "exists in compiler metadata but is inactive under current component properties"
                    )
            for group_name, group_props in node.group_properties.items():
                for prop in group_props.values():
                    candidates = compiler_property_candidates(record, group_name, prop.name)
                    if not candidates:
                        issues.append(
                            f"{display_path(ctx.path)}:{line_no(ctx.text, prop.offset)}: "
                            f"APEXLANG_SEMANTIC_PROPERTY_UNKNOWN_001 {apx_ast_component_label(node)} group '{group_name}' "
                            f"property '{prop.name}' is not present in compiler metadata"
                        )
                        continue
                    active = filter_records_by_condition(candidates, values, "dependsOn")
                    if not active:
                        issues.append(
                            f"{display_path(ctx.path)}:{line_no(ctx.text, prop.offset)}: "
                            f"APEXLANG_INACTIVE_PROPERTY_001 {apx_ast_component_label(node)} group '{group_name}' property '{prop.name}' "
                            "exists in compiler metadata but is inactive under current component properties"
                        )

        required_child = expected_child_keyword(node)
        if required_child:
            required_keyword, provenance = required_child
            if not any(child.keyword == required_keyword for child in node.children):
                type_prop = node.direct_properties.get("type")
                type_value = clean_scalar_value(type_prop.value) if type_prop else "<missing>"
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, node.start_offset)}: "
                    f"APEXLANG_REQUIRED_CHILD_COMPONENT_001 {apx_ast_component_label(node)} type {type_value} "
                    f"requires at least one child \"{required_keyword}\" ({provenance})"
                )

    return issues


def extract_fenced_property_body(block: str, prop_name: str) -> str | None:
    """Return the fenced body for a multiline property such as sqlQuery:."""
    pattern = re.compile(
        rf"(?ms)^\s*{re.escape(prop_name)}\s*:\s*```[A-Za-z0-9_-]*\s*\n(.*?)^\s*```"
    )
    match = pattern.search(block)
    if not match:
        return None
    return match.group(1).strip()


def extract_property_object_block(block: str, prop_name: str) -> tuple[int, str] | None:
    """Return a property object block such as `item: { ... }` with its offset."""
    pattern = re.compile(rf"(?m)^[ \t]*{re.escape(prop_name)}\s*:\s*\{{")
    match = pattern.search(block)
    if not match:
        return None
    open_brace = block.find("{", match.start(), match.end())
    if open_brace == -1:
        return None

    depth = 0
    in_string = False
    for idx in range(open_brace, len(block)):
        ch = block[idx]
        if ch == '"' and (idx == 0 or block[idx - 1] != "\\"):
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return match.start(), block[match.start() : idx + 1]
    return None


def contains_sql_order_by_clause(sql_text: str) -> bool:
    """Return whether SQL text contains an ORDER BY clause outside quotes/comments."""
    stripped = strip_sql_comments(sql_text)
    in_single_quote = False
    in_double_quote = False
    idx = 0
    lower = stripped.lower()

    while idx < len(stripped):
        char = stripped[idx]
        next_char = stripped[idx + 1] if idx + 1 < len(stripped) else ""

        if in_single_quote:
            if char == "'" and next_char == "'":
                idx += 2
                continue
            if char == "'":
                in_single_quote = False
            idx += 1
            continue

        if in_double_quote:
            if char == '"':
                in_double_quote = False
            idx += 1
            continue

        if char == "'":
            in_single_quote = True
            idx += 1
            continue

        if char == '"':
            in_double_quote = True
            idx += 1
            continue

        if lower.startswith("order", idx):
            prev_char = stripped[idx - 1] if idx > 0 else " "
            after_order = idx + 5
            next_boundary = stripped[after_order] if after_order < len(stripped) else " "
            if prev_char.isalnum() or prev_char == "_" or next_boundary.isalnum() or next_boundary == "_":
                idx += 1
                continue
            by_match = re.match(r"\s+by\b", lower[after_order:])
            if by_match:
                return True

        idx += 1

    return False


def strip_sql_comments(sql_text: str) -> str:
    """Remove simple SQL comments to make lightweight select-list parsing more reliable."""
    without_block_comments = re.sub(r"(?s)/\*.*?\*/", " ", sql_text)
    return re.sub(r"(?m)--.*$", "", without_block_comments)


def mask_sql_literals_comments_and_nested_queries(sql_text: str) -> str:
    """Mask text that cannot prove an outer-query row bound while preserving positions."""
    masked = list(sql_text)
    idx = 0
    state = "code"
    while idx < len(masked):
        char = sql_text[idx]
        next_char = sql_text[idx + 1] if idx + 1 < len(sql_text) else ""

        if state == "single_quote":
            if char == "'" and next_char == "'":
                masked[idx] = masked[idx + 1] = " "
                idx += 2
                continue
            if char == "'":
                state = "code"
            masked[idx] = " "
            idx += 1
            continue
        if state == "double_quote":
            if char == '"' and next_char == '"':
                masked[idx] = masked[idx + 1] = " "
                idx += 2
                continue
            if char == '"':
                state = "code"
            masked[idx] = " "
            idx += 1
            continue
        if state == "line_comment":
            if char in "\r\n":
                state = "code"
            else:
                masked[idx] = " "
            idx += 1
            continue
        if state == "block_comment":
            masked[idx] = " "
            if char == "*" and next_char == "/":
                masked[idx + 1] = " "
                state = "code"
                idx += 2
            else:
                idx += 1
            continue

        if char == "'":
            state = "single_quote"
            masked[idx] = " "
        elif char == '"':
            state = "double_quote"
            masked[idx] = " "
        elif char == "-" and next_char == "-":
            state = "line_comment"
            masked[idx] = masked[idx + 1] = " "
            idx += 1
        elif char == "/" and next_char == "*":
            state = "block_comment"
            masked[idx] = masked[idx + 1] = " "
            idx += 1
        idx += 1

    literal_free = "".join(masked)
    stack: list[int] = []
    nested_ranges: list[tuple[int, int]] = []
    for position, char in enumerate(literal_free):
        if char == "(":
            stack.append(position)
        elif char == ")" and stack:
            opening = stack.pop()
            if re.match(r"(?is)\s*(?:select|with)\b", literal_free[opening + 1 : position]):
                nested_ranges.append((opening + 1, position))

    for start, end in nested_ranges:
        for position in range(start, end):
            if masked[position] not in "\r\n":
                masked[position] = " "
    return "".join(masked)


def sql_predicate_has_single_row_bound(predicate: str) -> bool:
    """Prove a positive ROWNUM bound through AND/OR, leaving other atoms opaque."""
    tokens = re.findall(r"[A-Za-z_][A-Za-z0-9_$#]*|\d+(?:\.\d+)?|<=|>=|<>|!=|\S", predicate.lower())

    def proves_bound(expression: list[str]) -> bool:
        depth = 0
        case_depth = 0
        between_pending = False
        conjunctions: list[int] = []
        disjunctions: list[int] = []
        outer_close = None
        for index, token in enumerate(expression):
            if token == "(":
                depth += 1
            elif token == ")":
                depth -= 1
                if depth < 0:
                    return False
                if depth == 0 and outer_close is None:
                    outer_close = index
            elif token == "case":
                case_depth += 1
            elif token == "end" and case_depth:
                case_depth -= 1
            elif depth == 0 and case_depth == 0:
                if token == "between":
                    between_pending = True
                elif token == "and":
                    if between_pending:
                        between_pending = False
                    else:
                        conjunctions.append(index)
                elif token == "or":
                    disjunctions.append(index)
        if not expression or depth or case_depth or between_pending:
            return False
        if expression[0] == "(" and outer_close == len(expression) - 1:
            return proves_bound(expression[1:-1])

        # OR has lower precedence than AND. Every disjunct must retain a bound,
        # whereas any conjunct can limit the entire conjunction to one row.
        separators = disjunctions or conjunctions
        if separators:
            boundaries = [-1, *separators, len(expression)]
            operands = [
                proves_bound(expression[start + 1 : end])
                for start, end in zip(boundaries, boundaries[1:])
            ]
            return all(operands) if disjunctions else any(operands)
        return expression in (["rownum", "=", "1"], ["rownum", "<=", "1"], ["rownum", "<", "2"])

    return proves_bound(tokens)


def sql_outer_query_has_single_row_bound(sql_text: str) -> bool:
    """Return whether the outer SQL query has a non-neutralized one-row bound."""
    outer_sql = mask_sql_literals_comments_and_nested_queries(sql_text)
    if re.search(r"(?is)\bfetch\s+(?:first|next)\s+1\s+rows?\s+only\b", outer_sql):
        return True

    where_match = re.search(
        r"(?is)\bwhere\b(.*?)(?=\b(?:group\s+by|order\s+by|fetch|offset|union|intersect|minus)\b|$)",
        outer_sql,
    )
    if not where_match:
        return False
    return sql_predicate_has_single_row_bound(where_match.group(1).strip().removesuffix(";"))


def split_sql_top_level(sql_text: str, delimiter: str) -> list[str]:
    """Split SQL text on a delimiter only when not nested inside parentheses or quotes."""
    parts: list[str] = []
    current: list[str] = []
    depth = 0
    in_single_quote = False
    in_double_quote = False
    idx = 0

    while idx < len(sql_text):
        char = sql_text[idx]
        next_char = sql_text[idx + 1] if idx + 1 < len(sql_text) else ""

        if in_single_quote:
            current.append(char)
            if char == "'" and next_char == "'":
                current.append(next_char)
                idx += 2
                continue
            if char == "'":
                in_single_quote = False
            idx += 1
            continue

        if in_double_quote:
            current.append(char)
            if char == '"':
                in_double_quote = False
            idx += 1
            continue

        if char == "'":
            in_single_quote = True
            current.append(char)
            idx += 1
            continue

        if char == '"':
            in_double_quote = True
            current.append(char)
            idx += 1
            continue

        if char == "(":
            depth += 1
            current.append(char)
            idx += 1
            continue

        if char == ")":
            depth = max(depth - 1, 0)
            current.append(char)
            idx += 1
            continue

        if char == delimiter and depth == 0:
            parts.append("".join(current).strip())
            current = []
            idx += 1
            continue

        current.append(char)
        idx += 1

    tail = "".join(current).strip()
    if tail:
        parts.append(tail)
    return parts


def split_sql_top_level_set_queries(sql_text: str) -> list[str]:
    """Split a SQL set query at top-level UNION operators outside quotes and parentheses."""
    parts: list[str] = []
    current: list[str] = []
    depth = 0
    in_single_quote = False
    in_double_quote = False
    idx = 0
    lower = sql_text.lower()

    while idx < len(sql_text):
        char = sql_text[idx]
        next_char = sql_text[idx + 1] if idx + 1 < len(sql_text) else ""

        if in_single_quote:
            current.append(char)
            if char == "'" and next_char == "'":
                current.append(next_char)
                idx += 2
                continue
            if char == "'":
                in_single_quote = False
            idx += 1
            continue

        if in_double_quote:
            current.append(char)
            if char == '"':
                in_double_quote = False
            idx += 1
            continue

        if char == "'":
            in_single_quote = True
            current.append(char)
            idx += 1
            continue

        if char == '"':
            in_double_quote = True
            current.append(char)
            idx += 1
            continue

        if char == "(":
            depth += 1
            current.append(char)
            idx += 1
            continue

        if char == ")":
            depth = max(depth - 1, 0)
            current.append(char)
            idx += 1
            continue

        if depth == 0 and lower.startswith("union", idx):
            previous = sql_text[idx - 1] if idx > 0 else " "
            after_union = idx + 5
            following = sql_text[after_union] if after_union < len(sql_text) else " "
            if not (previous.isalnum() or previous == "_") and not (following.isalnum() or following == "_"):
                parts.append("".join(current).strip())
                current = []
                idx = after_union
                modifier_match = re.match(r"(?is)\s+(?:all|distinct)\b", sql_text[idx:])
                if modifier_match:
                    idx += modifier_match.end()
                continue

        current.append(char)
        idx += 1

    tail = "".join(current).strip()
    if tail:
        parts.append(tail)
    return parts


def extract_top_level_select_list(sql_text: str) -> list[str] | None:
    """Extract the outer select-list expressions, including queries prefixed by CTEs."""
    stripped = strip_sql_comments(sql_text).strip().rstrip(";")
    if not stripped:
        return None

    lower = stripped.lower()
    depth = 0
    in_single_quote = False
    in_double_quote = False
    select_start = -1
    from_start = -1
    idx = 0

    while idx < len(stripped):
        char = stripped[idx]
        next_char = stripped[idx + 1] if idx + 1 < len(stripped) else ""

        if in_single_quote:
            if char == "'" and next_char == "'":
                idx += 2
                continue
            if char == "'":
                in_single_quote = False
            idx += 1
            continue

        if in_double_quote:
            if char == '"':
                in_double_quote = False
            idx += 1
            continue

        if char == "'":
            in_single_quote = True
            idx += 1
            continue

        if char == '"':
            in_double_quote = True
            idx += 1
            continue

        if char == "(":
            depth += 1
            idx += 1
            continue

        if char == ")":
            depth = max(depth - 1, 0)
            idx += 1
            continue

        if depth == 0 and lower.startswith("select", idx):
            prev_char = stripped[idx - 1] if idx > 0 else " "
            next_boundary = stripped[idx + 6] if idx + 6 < len(stripped) else " "
            if not (prev_char.isalnum() or prev_char == "_") and not (next_boundary.isalnum() or next_boundary == "_"):
                select_start = idx + 6
                idx += 6
                continue

        if depth == 0 and select_start != -1 and lower.startswith("from", idx):
            prev_char = stripped[idx - 1] if idx > 0 else " "
            next_boundary = stripped[idx + 4] if idx + 4 < len(stripped) else " "
            if not (prev_char.isalnum() or prev_char == "_") and not (next_boundary.isalnum() or next_boundary == "_"):
                from_start = idx
                break

        idx += 1

    if select_start == -1 or from_start == -1 or from_start <= select_start:
        return None

    select_list = stripped[select_start:from_start].strip()
    if not select_list:
        return None
    return split_sql_top_level(select_list, ",")


def normalize_sql_identifier(value: str) -> str:
    """Normalize SQL identifiers for case-insensitive alias comparisons."""
    cleaned = clean_scalar_value(value)
    if cleaned.startswith('"') and cleaned.endswith('"') and len(cleaned) >= 2:
        cleaned = cleaned[1:-1]
    return cleaned.strip().lower()


def extract_select_expression_identifier(expression: str) -> str | None:
    """Best-effort alias/name extraction for simple top-level select expressions."""
    expr = expression.strip().rstrip(",")
    if not expr:
        return None

    alias_match = re.search(r'(?is)\bas\s+("(?:[^"]+)"|[A-Za-z][A-Za-z0-9_$#]*)\s*$', expr)
    if alias_match:
        return alias_match.group(1)

    trailing_alias_match = re.search(
        r'(?is)^(.*?)(?<![.(])\s+("?[A-Za-z][A-Za-z0-9_$#]*"?)\s*$',
        expr,
    )
    if trailing_alias_match:
        prefix = trailing_alias_match.group(1).strip()
        candidate = trailing_alias_match.group(2)
        if prefix and not re.fullmatch(r'"?[A-Za-z][A-Za-z0-9_$#]*"?(?:\."?[A-Za-z][A-Za-z0-9_$#]*"?)*', prefix):
            return candidate

    qualified_name_match = re.fullmatch(r'"?([A-Za-z][A-Za-z0-9_$#]*)"?(?:\."?([A-Za-z][A-Za-z0-9_$#]*)"?)?', expr)
    if qualified_name_match:
        return qualified_name_match.group(2) or qualified_name_match.group(1)

    return None


def normalize_lob_identifier(value: str) -> str:
    """Return the unqualified normalized identifier used for LOB-name heuristics."""
    cleaned = value.strip().strip('"')
    if "." in cleaned:
        cleaned = cleaned.split(".")[-1].strip().strip('"')
    return cleaned.lower()


def collect_blob_column_mappings(text: str) -> set[str]:
    """Collect explicit Cards/media raw BLOB aliases from DSL media.blobColumn mappings."""
    mappings: set[str] = set()
    for match in re.finditer(r"(?mi)^\s*blobColumn\s*:\s*([A-Za-z][A-Za-z0-9_$#]*)\s*$", text):
        mappings.add(normalize_lob_identifier(match.group(1)))
    return mappings


def collect_explicit_non_lob_column_mappings(text: str) -> set[str]:
    """Collect child-column mappings explicitly declared with scalar datatypes."""
    mappings: set[str] = set()
    lob_data_types = {"blob", "clob", "nclob", "bfile"}
    for _column_start, _column_name, column_block in find_component_blocks(text, "column"):
        source_meta = extract_top_level_blocks(column_block).get("source")
        if not source_meta:
            continue
        _source_offset, source_block = source_meta
        source_props = {
            prop_name: prop_value
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
        }
        database_column = source_props.get("databaseColumn", "")
        data_type = normalize_value(source_props.get("dataType", ""))
        if database_column and data_type and data_type not in lob_data_types:
            mappings.add(normalize_lob_identifier(database_column))
    return mappings


def likely_lob_identifier(
    identifier: str,
    known_lob_identifiers: set[str],
    known_non_lob_identifiers: set[str],
) -> bool:
    """Return whether an identifier is likely to represent a raw LOB expression."""
    normalized = normalize_lob_identifier(identifier)
    if normalized in known_lob_identifiers:
        return True
    if normalized in known_non_lob_identifiers:
        return False
    return bool(
        re.search(r"(?i)(?:^|_)(?:blob|clob|nclob|bfile)$", normalized)
        or re.search(r"(?i)_(?:image|file|content)$", normalized)
    )


def mask_dbms_lob_getlength(sql_text: str) -> str:
    """Mask scalar LOB-length calls so their raw LOB argument is not treated as a comparison key."""
    pattern = re.compile(r"(?is)\bdbms_lob\s*\.\s*getlength\s*\(")
    chars = list(sql_text)
    for match in pattern.finditer(sql_text):
        depth = 0
        idx = match.end() - 1
        while idx < len(sql_text):
            char = sql_text[idx]
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    idx += 1
                    break
            idx += 1
        for pos in range(match.start(), min(idx, len(chars))):
            chars[pos] = " "
    return "".join(chars)


def find_lob_identifier_in_expression(
    expression: str,
    known_lob_identifiers: set[str],
    known_non_lob_identifiers: set[str],
) -> tuple[str, int] | None:
    """Return the first likely raw LOB identifier in an expression after scalar wrappers are masked."""
    masked = mask_dbms_lob_getlength(expression)
    for match in re.finditer(
        r'(?i)(?<![.])"?[A-Za-z][A-Za-z0-9_$#]*"?(?:\."?[A-Za-z][A-Za-z0-9_$#]*"?)*',
        masked,
    ):
        token = match.group(0)
        if likely_lob_identifier(token, known_lob_identifiers, known_non_lob_identifiers):
            return token, match.start()
    return None


def sql_clause_body_pattern(clause: str, stop_clauses: str) -> re.Pattern[str]:
    """Build a lightweight clause body regex for SQL hygiene checks."""
    return re.compile(rf"(?is)\b{clause}\b(?P<body>.*?)(?=\b(?:{stop_clauses})\b|$)")


def inspect_lob_key_terms(
    *,
    issues: list[str],
    path: Path,
    text: str,
    snippet: str,
    snippet_base: int,
    body: str,
    body_base: int,
    context: str,
    known_lob_identifiers: set[str],
    known_non_lob_identifiers: set[str],
) -> None:
    """Inspect comma-separated key terms and report likely raw LOB usage."""
    for term in split_sql_top_level(body, ","):
        lob_meta = find_lob_identifier_in_expression(term, known_lob_identifiers, known_non_lob_identifiers)
        if not lob_meta:
            continue
        lob_identifier, rel_in_term = lob_meta
        term_offset = body.lower().find(term.lower().strip())
        rel_offset = max(term_offset, 0) + rel_in_term
        issues.append(
            f"{display_path(path)}:{line_no(text, snippet_base + body_base + rel_offset)}: "
            f"{LOB_COMPARISON_RULE_ID} {context} must not use raw LOB expression `{lob_identifier}` as a comparison key - "
            f"{LOB_COMPARISON_REMEDIATION}"
        )


def inspect_lob_comparison_predicates(
    *,
    issues: list[str],
    path: Path,
    text: str,
    snippet: str,
    snippet_base: int,
    body: str,
    body_base: int,
    context: str,
    known_lob_identifiers: set[str],
    known_non_lob_identifiers: set[str],
) -> None:
    """Inspect WHERE/HAVING/ON predicate bodies for direct raw LOB comparisons."""
    masked = mask_dbms_lob_getlength(body)
    token_pattern = re.compile(
        r'(?i)(?<![.])"?[A-Za-z][A-Za-z0-9_$#]*"?(?:\."?[A-Za-z][A-Za-z0-9_$#]*"?)*'
    )
    for match in token_pattern.finditer(masked):
        token = match.group(0)
        if not likely_lob_identifier(token, known_lob_identifiers, known_non_lob_identifiers):
            continue
        before = masked[max(0, match.start() - 48) : match.start()]
        after = masked[match.end() : match.end() + 48]
        compared_after = re.match(r"(?is)^\s*(=|<>|!=|<=|>=|<|>|\blike\b|\bin\s*\(|\bbetween\b)", after)
        compared_before = re.search(r"(?is)(=|<>|!=|<=|>=|<|>|\blike\b)\s*$", before)
        if not compared_after and not compared_before:
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, snippet_base + body_base + match.start())}: "
            f"{LOB_COMPARISON_RULE_ID} {context} must not compare raw LOB expression `{token}` directly - "
            f"{LOB_COMPARISON_REMEDIATION}"
        )


def lint_sql_lob_comparison_keys(path: Path, text: str) -> list[str]:
    """Reject obvious raw LOB expressions in SQL/PLSQL comparison-key positions."""
    issues: list[str] = []
    known_lob_identifiers = collect_blob_column_mappings(text)
    known_non_lob_identifiers = collect_explicit_non_lob_column_mappings(text)
    stop_clauses = (
        r"from|where|group\s+by|having|order\s+by|fetch|offset|union(?:\s+all)?|intersect|minus|"
        r"connect\s+by|start\s+with|model|returning"
    )

    def inspect_sql(snippet: str, snippet_base: int, label: str) -> None:
        """Inspect one SQL snippet for raw LOB comparison-key usage."""
        sql = strip_sql_comments(snippet)
        if not sql.strip():
            return

        distinct_match = re.search(r"(?is)\bselect\s+distinct\s+(?P<body>.*?)(?=\bfrom\b|$)", sql)
        if distinct_match:
            inspect_lob_key_terms(
                issues=issues,
                path=path,
                text=text,
                snippet=snippet,
                snippet_base=snippet_base,
                body=distinct_match.group("body"),
                body_base=distinct_match.start("body"),
                context=f"{label} SELECT DISTINCT",
                known_lob_identifiers=known_lob_identifiers,
                known_non_lob_identifiers=known_non_lob_identifiers,
            )

        for clause, context in (
            (r"group\s+by", "GROUP BY"),
            (r"order\s+by", "ORDER BY"),
        ):
            for match in sql_clause_body_pattern(clause, stop_clauses).finditer(sql):
                inspect_lob_key_terms(
                    issues=issues,
                    path=path,
                    text=text,
                    snippet=snippet,
                    snippet_base=snippet_base,
                    body=match.group("body"),
                    body_base=match.start("body"),
                    context=f"{label} {context}",
                    known_lob_identifiers=known_lob_identifiers,
                    known_non_lob_identifiers=known_non_lob_identifiers,
                )

        for over_match in re.finditer(r"(?is)\bover\s*\((?P<body>.*?)\)", sql):
            over_body = over_match.group("body")
            analytic_stop = r"partition\s+by|order\s+by|rows|range|groups"
            for clause, context in (
                (r"partition\s+by", "analytic PARTITION BY"),
                (r"order\s+by", "analytic ORDER BY"),
            ):
                for clause_match in sql_clause_body_pattern(clause, analytic_stop).finditer(over_body):
                    inspect_lob_key_terms(
                        issues=issues,
                        path=path,
                        text=text,
                        snippet=snippet,
                        snippet_base=snippet_base,
                        body=clause_match.group("body"),
                        body_base=over_match.start("body") + clause_match.start("body"),
                        context=f"{label} {context}",
                        known_lob_identifiers=known_lob_identifiers,
                        known_non_lob_identifiers=known_non_lob_identifiers,
                    )

        if re.search(r"(?is)\b(?:union(?:\s+all)?|intersect|minus)\b", sql):
            for part in re.split(r"(?is)\b(?:union(?:\s+all)?|intersect|minus)\b", sql):
                part_offset = sql.find(part)
                select_list = extract_top_level_select_list(part)
                if not select_list:
                    continue
                body = ", ".join(select_list)
                inspect_lob_key_terms(
                    issues=issues,
                    path=path,
                    text=text,
                    snippet=snippet,
                    snippet_base=snippet_base,
                    body=body,
                    body_base=max(part_offset, 0),
                    context=f"{label} set operation SELECT list",
                    known_lob_identifiers=known_lob_identifiers,
                    known_non_lob_identifiers=known_non_lob_identifiers,
                )

        predicate_patterns = [
            (r"where", "WHERE comparison predicate", stop_clauses),
            (r"having", "HAVING comparison predicate", stop_clauses),
            (
                r"on",
                "JOIN ON comparison predicate",
                r"(?:inner|left|right|full|cross)?\s*join|where|group\s+by|having|order\s+by|fetch|offset|union(?:\s+all)?|intersect|minus",
            ),
        ]
        for clause, context, stops in predicate_patterns:
            for match in sql_clause_body_pattern(clause, stops).finditer(sql):
                inspect_lob_comparison_predicates(
                    issues=issues,
                    path=path,
                    text=text,
                    snippet=snippet,
                    snippet_base=snippet_base,
                    body=match.group("body"),
                    body_base=match.start("body"),
                    context=f"{label} {context}",
                    known_lob_identifiers=known_lob_identifiers,
                    known_non_lob_identifiers=known_non_lob_identifiers,
                )

    for fence_match in re.finditer(r"(?ms)```(?P<lang>sql|plsql)\s*(?P<body>.*?)\s*```", text):
        inspect_sql(
            fence_match.group("body"),
            fence_match.start("body"),
            f"fenced {fence_match.group('lang').upper()}",
        )

    for prop_match in re.finditer(r"(?m)^\s*(plsqlFunctionBody|plsqlExpression)\s*:\s*(.+)$", text):
        inspect_sql(prop_match.group(2), prop_match.start(2), prop_match.group(1))

    return issues


def normalize_component_reference(value: str) -> str:
    """Normalize APEX component references such as @alias for metadata lookup."""
    cleaned = clean_scalar_value(value)
    if cleaned.startswith("@"):
        cleaned = cleaned[1:]
    return normalize_sql_identifier(cleaned)


def is_select_star_expression(expression: str) -> bool:
    """Return whether a select-list expression is a wildcard projection."""
    cleaned = expression.strip().rstrip(",")
    return bool(re.fullmatch(r'(?is)(?:"?[A-Za-z][A-Za-z0-9_$#]*"?\.)?\*', cleaned))


def parse_markdown_frontmatter(markdown: str) -> dict[str, str]:
    """Parse simple YAML-like frontmatter used by schema dictionaries."""
    match = re.match(r"(?s)^---\n(.*?)\n---\n?", markdown)
    if not match:
        return {}
    frontmatter: dict[str, str] = {}
    for line in match.group(1).splitlines():
        field_match = re.match(r"^([A-Za-z0-9_]+):\s*(.+)$", line)
        if field_match:
            frontmatter[field_match.group(1)] = field_match.group(2).strip().strip('"')
    return frontmatter


def frontmatter_bool(value: str | None) -> bool:
    """Return true for common frontmatter boolean spellings."""
    return (value or "").strip().lower() in {"true", "yes", "y", "1"}


def parse_schema_dictionary_columns(markdown: str) -> dict[str, list[str]]:
    """Parse table/view columns from an offline schema dictionary markdown body."""
    columns_by_object: dict[str, list[str]] = {}
    sections = re.split(r"\n(?=##+\s+)", markdown)
    for section in sections:
        heading_match = re.match(r"(?is)^##+\s*(table|view|object|entity)\s*:?\s*([^\n]+)", section.strip())
        if not heading_match:
            continue
        object_name = normalize_sql_identifier(heading_match.group(2))
        if not object_name:
            continue
        columns: list[str] = []
        seen: set[str] = set()
        for line in section.splitlines():
            bullet_match = re.match(r'^\s*[-*]\s*`?([A-Za-z][A-Za-z0-9_$#]*)`?(?:\s*\(([^)]+)\))?', line)
            table_match = re.match(r'^\|\s*`?([A-Za-z][A-Za-z0-9_$#]*)`?\s*\|', line)
            column_name = ""
            if bullet_match:
                column_name = bullet_match.group(1)
            elif table_match and table_match.group(1).lower() not in {"column", "name"}:
                column_name = table_match.group(1)
            normalized = normalize_sql_identifier(column_name)
            if normalized and normalized not in seen:
                seen.add(normalized)
                columns.append(column_name)
        if columns:
            columns_by_object[object_name] = columns
    return columns_by_object


def load_schema_dictionary_columns() -> dict[str, list[str]]:
    """Load known offline schema dictionary columns from env and references/policies/db."""
    columns_by_object: dict[str, list[str]] = {}
    candidate_paths: list[Path] = []

    env_paths = os.environ.get("APEXLANG_SCHEMA_DICTIONARY_PATHS", "").strip()
    if env_paths:
        candidate_paths.extend(Path(raw).expanduser() for raw in env_paths.split(os.pathsep) if raw.strip())

    index_path = ROOT / "references/policies" / "db" / "index.json"
    if index_path.exists():
        try:
            index_payload = json.loads(index_path.read_text(encoding="utf-8"))
        except Exception:
            index_payload = {}
        for entry in index_payload.get("schemas", []) if isinstance(index_payload, dict) else []:
            if not isinstance(entry, dict):
                continue
            rel_path = entry.get("path") or entry.get("file") or entry.get("doc_path") or entry.get("selected_schema_doc_path")
            if isinstance(rel_path, str) and rel_path.strip():
                candidate_paths.append((ROOT / rel_path).resolve() if not Path(rel_path).is_absolute() else Path(rel_path))

    for candidate in candidate_paths:
        if not candidate.exists() or not candidate.is_file():
            continue
        try:
            markdown = candidate.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        frontmatter = parse_markdown_frontmatter(markdown)
        if frontmatter:
            if frontmatter.get("status", "").lower() != "active":
                continue
            if frontmatter.get("metadata_mode", "").lower() != "offline_dictionary":
                continue
            if not frontmatter_bool(frontmatter.get("covers_columns")):
                continue
        for object_name, columns in parse_schema_dictionary_columns(markdown).items():
            columns_by_object[object_name] = columns

    return columns_by_object


def collect_rest_profiles_from_text(text: str) -> dict[str, list[str]]:
    """Collect REST data profile columns from restDataSource blocks in APEXlang text."""
    profiles: dict[str, list[str]] = {}
    for _offset, rest_name, rest_block in find_component_blocks(text, "restDataSource"):
        columns: list[str] = []
        seen: set[str] = set()
        profile_columns = [
            *find_immediate_component_blocks(rest_block, "dataProfileCol"),
            *find_immediate_component_blocks(rest_block, "dataProfileColumn"),
        ]
        for _col_offset, col_identifier, col_block in profile_columns:
            col_name = col_identifier
            for prop_name, prop_value, _prop_offset in extract_immediate_property_values(col_block):
                if prop_name in {"colName", "columnName"}:
                    col_name = clean_scalar_value(prop_value)
                    break
            normalized = normalize_sql_identifier(col_name)
            if normalized and normalized not in seen:
                seen.add(normalized)
                columns.append(col_name)
        if columns:
            profiles[normalize_component_reference(rest_name)] = columns
    return profiles


def authoritative_profile_enum_from_column(column_block: str) -> set[str | None] | None:
    """Read an explicit finite enum assertion from a REST profile-column comments block."""
    comments_meta = extract_top_level_blocks(column_block).get("comments")
    if not comments_meta:
        return None
    _comments_offset, comments_block = comments_meta
    comments_value = next(
        (
            clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(comments_block)
            if prop_name == "comments"
        ),
        "",
    )
    enum_match = re.search(
        r"(?is)\bauthoritative-profile-enum\s*:\s*\[([^\]]*)\]",
        comments_value,
    )
    if not enum_match:
        return None
    values: set[str | None] = set()
    for raw_value in enum_match.group(1).split(","):
        value = raw_value.strip().strip("\"'")
        if not value:
            return None
        values.add(None if value.lower() == "null" else value)
    return values or None


def collect_rest_profile_enums_from_text(text: str) -> dict[str, dict[str, set[str | None]]]:
    """Collect authoritative finite enums declared by REST data-profile columns."""
    profiles: dict[str, dict[str, set[str | None]]] = {}
    for _offset, rest_name, rest_block in find_component_blocks(text, "restDataSource"):
        column_enums: dict[str, set[str | None]] = {}
        profile_columns = [
            *find_immediate_component_blocks(rest_block, "dataProfileCol"),
            *find_immediate_component_blocks(rest_block, "dataProfileColumn"),
        ]
        for _col_offset, col_identifier, col_block in profile_columns:
            col_name = col_identifier
            for prop_name, prop_value, _prop_offset in extract_immediate_property_values(col_block):
                if prop_name in {"colName", "columnName"}:
                    col_name = clean_scalar_value(prop_value)
                    break
            enum_values = authoritative_profile_enum_from_column(col_block)
            normalized_column = normalize_sql_identifier(col_name)
            if normalized_column and enum_values is not None:
                column_enums[normalized_column] = enum_values
        if column_enums:
            profiles[normalize_component_reference(rest_name)] = column_enums
    return profiles


def authoritative_profile_url_prefixes_from_column(column_block: str) -> set[str] | None:
    """Read explicit URL-origin constraints from a REST profile-column comments block."""
    comments_meta = extract_top_level_blocks(column_block).get("comments")
    if not comments_meta:
        return None
    _comments_offset, comments_block = comments_meta
    comments_value = next(
        (
            clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(comments_block)
            if prop_name == "comments"
        ),
        "",
    )
    prefix_match = re.search(
        r"(?is)\bauthoritative-profile-url-prefixes\s*:\s*\[([^\]]*)\]",
        comments_value,
    )
    if not prefix_match:
        return None
    prefixes = {
        raw_prefix.strip().strip("\"'")
        for raw_prefix in prefix_match.group(1).split(",")
        if raw_prefix.strip().strip("\"'")
    }
    return prefixes or None


def collect_rest_profile_url_prefixes_from_text(text: str) -> dict[str, dict[str, set[str]]]:
    """Collect authoritative URL constraints declared by REST data-profile columns."""
    profiles: dict[str, dict[str, set[str]]] = {}
    for _offset, rest_name, rest_block in find_component_blocks(text, "restDataSource"):
        column_prefixes: dict[str, set[str]] = {}
        profile_columns = [
            *find_immediate_component_blocks(rest_block, "dataProfileCol"),
            *find_immediate_component_blocks(rest_block, "dataProfileColumn"),
        ]
        for _col_offset, col_identifier, col_block in profile_columns:
            col_name = col_identifier
            for prop_name, prop_value, _prop_offset in extract_immediate_property_values(col_block):
                if prop_name in {"colName", "columnName"}:
                    col_name = clean_scalar_value(prop_value)
                    break
            prefixes = authoritative_profile_url_prefixes_from_column(col_block)
            normalized_column = normalize_sql_identifier(col_name)
            if normalized_column and prefixes is not None:
                column_prefixes[normalized_column] = prefixes
        if column_prefixes:
            profiles[normalize_component_reference(rest_name)] = column_prefixes
    return profiles


def multiline_or_scalar_property(block: str, prop_name: str) -> str:
    """Return a fenced multiline property body or its immediate scalar fallback."""
    fenced = extract_fenced_property_body(block, prop_name)
    if fenced is not None:
        return fenced
    return next(
        (
            clean_scalar_value(prop_value)
            for name, prop_value, _prop_offset in extract_immediate_brace_property_values(block)
            if name == prop_name
        ),
        "",
    )


def split_url_prefix_evidence(value: str) -> list[str]:
    """Split newline- or comma-delimited URL restriction evidence."""
    return [
        clean_scalar_value(part)
        for part in re.split(r"[\n,]+", value or "")
        if clean_scalar_value(part)
    ]


def collect_rest_security_context_from_text(text: str) -> tuple[dict[str, dict[str, str]], dict[str, str], dict[str, list[str]]]:
    """Collect REST source, remote-server, and Web Credential security metadata."""
    rest_sources: dict[str, dict[str, str]] = {}
    rest_servers: dict[str, str] = {}
    web_credentials: dict[str, list[str]] = {}

    for _offset, rest_name, rest_block in find_component_blocks(text, "restDataSource"):
        source_meta = extract_top_level_blocks(rest_block).get("source")
        authentication_meta = extract_top_level_blocks(rest_block).get("authentication")
        source_props: dict[str, str] = {}
        authentication_props: dict[str, str] = {}
        if source_meta:
            source_props = {
                name: clean_scalar_value(value)
                for name, value, _prop_offset in extract_immediate_brace_property_values(source_meta[1])
            }
        if authentication_meta:
            authentication_props = {
                name: clean_scalar_value(value)
                for name, value, _prop_offset in extract_immediate_brace_property_values(authentication_meta[1])
            }
        rest_sources[normalize_component_reference(rest_name)] = {
            "remote_server": normalize_component_reference(source_props.get("remoteServer", "")),
            "url_path_prefix": source_props.get("urlPathPrefix", ""),
            "credential": normalize_component_reference(authentication_props.get("credentials", "")),
        }

    for _offset, server_name, server_block in find_component_blocks(text, "restDataSourceServer"):
        endpoint_meta = extract_top_level_blocks(server_block).get("endpointUrl")
        endpoint_url = ""
        if endpoint_meta:
            endpoint_url = next(
                (
                    clean_scalar_value(value)
                    for name, value, _prop_offset in extract_immediate_brace_property_values(endpoint_meta[1])
                    if name == "url"
                ),
                "",
            )
        rest_servers[normalize_component_reference(server_name)] = endpoint_url

    for _offset, credential_name, credential_block in find_component_blocks(text, "webCredential"):
        advanced_meta = extract_top_level_blocks(credential_block).get("advanced")
        valid_for_urls = ""
        if advanced_meta:
            valid_for_urls = multiline_or_scalar_property(advanced_meta[1], "validForUrls")
        web_credentials[normalize_component_reference(credential_name)] = split_url_prefix_evidence(valid_for_urls)

    return rest_sources, rest_servers, web_credentials


def build_validation_context(
    targets: list[Path],
    generation_plan_path: str | Path | None = None,
    require_smart_filter_generation_plan: bool = False,
) -> dict[str, Any]:
    """Build cross-file validation context used for projection coverage checks."""
    rest_profiles: dict[str, list[str]] = {}
    rest_profile_enums: dict[str, dict[str, set[str | None]]] = {}
    rest_profile_url_prefixes: dict[str, dict[str, set[str]]] = {}
    rest_sources: dict[str, dict[str, str]] = {}
    rest_servers: dict[str, str] = {}
    web_credentials: dict[str, list[str]] = {}
    authorization_schemes: set[str] = set()
    page_items: set[str] = set()
    for target in targets:
        try:
            text = target.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        rest_profiles.update(collect_rest_profiles_from_text(text))
        rest_profile_enums.update(collect_rest_profile_enums_from_text(text))
        rest_profile_url_prefixes.update(collect_rest_profile_url_prefixes_from_text(text))
        target_rest_sources, target_rest_servers, target_web_credentials = collect_rest_security_context_from_text(text)
        rest_sources.update(target_rest_sources)
        rest_servers.update(target_rest_servers)
        web_credentials.update(target_web_credentials)
        authorization_schemes.update(
            normalize_component_reference(identifier)
            for _offset, identifier, _block in find_component_blocks(text, "authorization")
        )
        page_items.update(
            normalize_sql_identifier(identifier)
            for _offset, identifier, _block in find_component_blocks(text, "pageItem")
        )
    context = {
        "schema_columns": load_schema_dictionary_columns(),
        "rest_profiles": rest_profiles,
        "rest_profile_enums": rest_profile_enums,
        "rest_profile_url_prefixes": rest_profile_url_prefixes,
        "rest_sources": rest_sources,
        "rest_servers": rest_servers,
        "web_credentials": web_credentials,
        "authorization_schemes": authorization_schemes,
        "page_items": page_items,
    }
    if generation_plan_path:
        plan_path = Path(generation_plan_path).expanduser()
        context["smart_filter_generation_plan_path"] = str(plan_path)
        if not plan_path.exists():
            context["smart_filter_generation_plan_error"] = f"generation plan '{plan_path}' does not exist"
    context["require_smart_filter_generation_plan"] = require_smart_filter_generation_plan
    return context


def projection_columns_from_sql(sql_query_text: str) -> tuple[list[str], str | None]:
    """Return SQL projection aliases or an error message when aliases cannot be proven."""
    select_list = extract_top_level_select_list(sql_query_text)
    if not select_list:
        return [], "SQL projection could not be resolved; use an explicit simple select list or provide metadata"

    aliases: list[str] = []
    seen: set[str] = set()
    for expression in select_list:
        if is_select_star_expression(expression):
            return [], "SQL projection uses wildcard selection; enumerate columns explicitly"
        identifier = extract_select_expression_identifier(expression)
        if not identifier:
            return [], f"SQL projection expression '{expression.strip()}' must have a resolvable alias"
        normalized = normalize_sql_identifier(identifier)
        if normalized in seen:
            return [], f"SQL projection alias '{clean_scalar_value(identifier)}' is duplicated"
        seen.add(normalized)
        aliases.append(clean_scalar_value(identifier))
    return aliases, None


def source_projection_columns(
    top_level_blocks: dict[str, tuple[int, str]],
    validation_context: dict[str, Any] | None,
) -> tuple[list[str], str | None, str]:
    """Resolve source columns when local metadata can prove the selected source projection."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return [], None, "none"

    _source_offset, source_block = source_meta
    prop_names = {prop_name for prop_name, _prop_offset in extract_immediate_brace_property_names(source_block)}
    source_props = {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
    }
    source_type_meta = source_props.get("type")
    source_type = clean_scalar_value(source_type_meta[0]).lower() if source_type_meta else ""

    if source_type == "sqlquery" or "sqlQuery" in prop_names:
        sql_query_text = extract_fenced_property_body(source_block, "sqlQuery")
        if not sql_query_text:
            return [], None, "sql"
        aliases, error = projection_columns_from_sql(sql_query_text)
        return aliases, error, "sql"

    table_meta = source_props.get("tableName")
    if table_meta or source_type in {"table", "tableview"}:
        table_name = clean_scalar_value(table_meta[0]) if table_meta else ""
        if not table_name:
            return [], "table source projection requires source.tableName", "table"
        schema_columns = (validation_context or {}).get("schema_columns", {})
        columns = schema_columns.get(normalize_sql_identifier(table_name), []) if isinstance(schema_columns, dict) else []
        if not columns:
            return [], f"table source projection for '{table_name}' requires offline schema metadata with columns", "table"
        return columns, None, "table"

    rest_meta = source_props.get("restSource")
    location_meta = source_props.get("location")
    location = clean_scalar_value(location_meta[0]).lower() if location_meta else ""
    if rest_meta or location == "restsource":
        rest_name = clean_scalar_value(rest_meta[0]) if rest_meta else ""
        if not rest_name:
            return [], "REST source projection requires source.restSource", "rest"
        rest_profiles = (validation_context or {}).get("rest_profiles", {})
        rest_reference = normalize_component_reference(rest_name)
        columns = rest_profiles.get(rest_reference, []) if isinstance(rest_profiles, dict) else []
        if not columns:
            return [], f"REST source projection for '{rest_reference or rest_name}' requires resolvable dataProfileCol metadata", "rest"
        return columns, None, "rest"

    opaque_source_kinds = {
        "functionbody": "functionBody",
        "propertygraph": "propertyGraph",
    }
    if source_type in opaque_source_kinds:
        return [], None, opaque_source_kinds[source_type]

    location_source_kinds = {
        "jsondualityview": "jsonDualityView",
        "jsonsource": "jsonSource",
        "sampledata": "sampleData",
    }
    if location in location_source_kinds:
        return [], None, location_source_kinds[location]

    # Preserve compiler-supported future source modes. Their explicit child-column
    # declarations remain locally checkable even when their runtime projection is not.
    return [], None, "opaque"


def projection_source_requires_columns(region_type_key: str, top_level_blocks: dict[str, tuple[int, str]]) -> bool:
    """Return whether this region family must mirror source projections with child columns."""
    if region_type_key in {"classicReport", "interactiveReport", "interactiveGrid"}:
        return source_block_is_sql_or_table_backed(top_level_blocks) or source_block_is_rest_backed(top_level_blocks)
    if region_type_key in {"badge", "mediaList"}:
        return template_component_display_mode(top_level_blocks) == "report" and "source" in top_level_blocks
    if region_type_key in {"avatar", "comments", "contentRow", "metricCard", "timeline"}:
        return template_component_display_mode(top_level_blocks) == "report" and source_block_has_data_projection(top_level_blocks)
    return False


def badge_state_literal_results(expression: str) -> set[str] | None:
    """Return statically proven semantic results from one Badge state SQL expression."""
    expression_body = expression.strip()
    identifier = extract_select_expression_identifier(expression_body)
    if identifier and not (
        normalize_sql_identifier(identifier) == "end"
        and re.match(r"(?is)^case\b", expression_body)
        and re.search(r"(?is)\bend\s*$", expression_body)
    ):
        expression_body = re.sub(
            rf"(?is)\s+(?:as\s+)?{re.escape(identifier)}\s*$",
            "",
            expression_body,
        ).strip()

    literal_match = re.fullmatch(r"'((?:''|[^'])*)'", expression_body, re.DOTALL)
    if literal_match:
        return {literal_match.group(1).replace("''", "'")}

    if not re.match(r"(?is)^case\b", expression_body) or not re.search(r"(?is)\bend\s*$", expression_body):
        return None

    then_values = re.findall(r"(?is)\bthen\s+'((?:''|[^'])*)'", expression_body)
    else_values = re.findall(r"(?is)\belse\s+'((?:''|[^'])*)'", expression_body)
    then_count = len(re.findall(r"(?is)\bthen\b", expression_body))
    else_count = len(re.findall(r"(?is)\belse\b", expression_body))
    if (
        not then_values
        or len(then_values) != then_count
        or else_count != 1
        or len(else_values) != else_count
    ):
        return None
    return {value.replace("''", "'") for value in then_values + else_values}


def badge_state_values_from_sql(sql_query_text: str, normalized_state_column: str) -> set[str] | None:
    """Prove Badge state results across every top-level SQL UNION branch."""
    set_queries = split_sql_top_level_set_queries(strip_sql_comments(sql_query_text))
    if not set_queries:
        return None

    first_select_list = extract_top_level_select_list(set_queries[0])
    if not first_select_list:
        return None
    state_index = next(
        (
            index
            for index, expression in enumerate(first_select_list)
            if normalize_sql_identifier(extract_select_expression_identifier(expression) or "") == normalized_state_column
        ),
        None,
    )
    if state_index is None:
        return None

    proven_states: set[str] = set()
    for set_query in set_queries:
        select_list = extract_top_level_select_list(set_query)
        if not select_list or state_index >= len(select_list):
            return None
        branch_states = badge_state_literal_results(select_list[state_index])
        if branch_states is None:
            return None
        proven_states.update(branch_states)
    return proven_states


def template_component_column_source_metadata(region_block: str) -> dict[str, tuple[str, int]]:
    """Map template-component source aliases to datatypes and region-relative offsets."""
    metadata: dict[str, tuple[str, int]] = {}
    for column_offset, column_identifier, column_block in find_immediate_component_blocks(region_block, "column"):
        source_meta = extract_top_level_blocks(column_block).get("source")
        if not source_meta:
            continue
        source_offset, source_block = source_meta
        source_props = {
            prop_name: (prop_value, prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
        }
        database_column_meta = source_props.get("databaseColumn")
        data_type_meta = source_props.get("dataType")
        if not data_type_meta:
            continue
        source_name = clean_scalar_value(database_column_meta[0]) if database_column_meta else column_identifier
        data_type, data_type_offset = data_type_meta
        metadata[normalize_sql_identifier(source_name)] = (
            clean_scalar_value(data_type),
            column_offset + source_offset + data_type_offset,
        )
    return metadata


def lint_metric_card_nested_placement_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
    known_region_ids: set[str],
) -> None:
    """Require an existing parent and verified nested-region slot for nested Metric Cards."""
    layout_meta = top_level_blocks.get("layout")
    if not layout_meta:
        return
    layout_offset, layout_block = layout_meta
    layout_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(layout_block)
    }
    parent_meta = layout_props.get("parentRegion")
    if not parent_meta:
        return
    parent_reference, parent_offset = parent_meta
    if normalize_component_reference(parent_reference) not in known_region_ids:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + layout_offset + parent_offset)}: "
            f"METRIC_CARD_NESTED_PARENT_REQUIRED_001 {component_label} layout.parentRegion must reference an "
            "existing same-page region static ID"
        )
    slot_meta = layout_props.get("slot")
    if not slot_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + layout_offset)}: "
            f"METRIC_CARD_NESTED_SLOT_REQUIRED_001 {component_label} nested placement requires layout.slot: SUB_REGIONS"
        )
        return
    slot, slot_offset = slot_meta
    if normalize_value(slot).replace("_", "") != "subregions":
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + layout_offset + slot_offset)}: "
            f"METRIC_CARD_NESTED_SLOT_REQUIRED_001 {component_label} nested placement must use the verified "
            "layout.slot: SUB_REGIONS"
        )


def badge_column_source_metadata(region_block: str) -> dict[str, tuple[str, int]]:
    """Preserve the Badge-specific metadata entry point."""
    return template_component_column_source_metadata(region_block)


def lint_static_template_component_icon(
    *,
    issues: list[str],
    path: Path,
    text: str,
    absolute_offset: int,
    component_label: str,
    property_path: str,
    value: str,
) -> None:
    """Reject dynamic template-component icons; global icon lint covers invalid literals."""
    cleaned_icon = clean_scalar_value(value)
    if classify_fa_icon_value(cleaned_icon) != "unresolved":
        return
    issues.append(
        f"{display_path(path)}:{line_no(text, absolute_offset)}: "
        f"FA_ICON_REQUIRED_001 {component_label} {property_path} must be a static catalog-listed Font APEX "
        f"icon with optional catalog-listed modifiers; found '{cleaned_icon}'"
    )


def lint_template_component_avatar_icon(
    *,
    issues: list[str],
    path: Path,
    text: str,
    absolute_offset: int,
    component_label: str,
    property_path: str,
    value: str,
    column_data_types: dict[str, str],
    sql_query_text: str | None,
) -> None:
    """Allow static icons or source-backed icons whose complete SQL output is provably safe."""
    cleaned_icon = clean_scalar_value(value)
    if "{{" in cleaned_icon and "}}" in cleaned_icon:
        return
    substitution = re.fullmatch(r"&([A-Z][A-Z0-9_]*)\.", cleaned_icon)
    if not substitution:
        lint_static_template_component_icon(
            issues=issues,
            path=path,
            text=text,
            absolute_offset=absolute_offset,
            component_label=component_label,
            property_path=property_path,
            value=cleaned_icon,
        )
        return

    icon_column_name = substitution.group(1)
    normalized_icon_column = normalize_sql_identifier(icon_column_name)
    if normalized_icon_column not in column_data_types:
        issues.append(
            f"{display_path(path)}:{line_no(text, absolute_offset)}: "
            f"AVATAR_ICON_ALLOWLIST_REQUIRED_001 {component_label} {property_path} '{cleaned_icon}' must "
            "reference a declared child column"
        )
        return
    if normalize_value(column_data_types[normalized_icon_column]) != "varchar2":
        issues.append(
            f"{display_path(path)}:{line_no(text, absolute_offset)}: "
            f"AVATAR_ICON_ALLOWLIST_REQUIRED_001 {component_label} {property_path} '{cleaned_icon}' must "
            "reference a varchar2 child column"
        )
        return

    expressions = sql_projection_expressions(sql_query_text, icon_column_name) if sql_query_text else None
    values: list[str] = []
    if expressions:
        for expression in expressions:
            expression_values = avatar_icon_expression_values(expression)
            if not expression_values:
                values = []
                break
            values.extend(expression_values)
    if not expressions or not values:
        issues.append(
            f"{display_path(path)}:{line_no(text, absolute_offset)}: "
            f"AVATAR_ICON_ALLOWLIST_REQUIRED_001 {component_label} source-backed {property_path} requires "
            "statically verified Font APEX literals or an explicit CASE mapping in source.sqlQuery"
        )
        return

    invalid_values = sorted({item for item in values if not value_is_fa_icon(item)})
    if invalid_values:
        issues.append(
            f"{display_path(path)}:{line_no(text, absolute_offset)}: "
            f"AVATAR_ICON_ALLOWLIST_REQUIRED_001 {component_label} source icon value(s) "
            f"{', '.join(invalid_values)} must each contain exactly one icon and only optional modifiers "
            "from the canonical Font APEX index"
        )


def lint_badge_source_setting_mappings(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
    validation_context: dict[str, Any] | None = None,
) -> None:
    """Enforce safe Badge mappings, semantic tokens, and link behavior."""
    badge_actions = find_immediate_component_blocks(region_block, "action")
    if len(badge_actions) > 1:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + badge_actions[1][0])}: "
            f"BADGE_ACTION_CARDINALITY_REQUIRED_001 {component_label} supports at most one link action; "
            f"found {len(badge_actions)} actions"
        )

    settings_meta = top_level_blocks.get("settings")
    if not settings_meta:
        return

    settings_offset, settings_block = settings_meta
    expected_columns, projection_error, source_kind = source_projection_columns(top_level_blocks, validation_context)
    normalized_columns = {
        normalize_sql_identifier(column)
        for column in expected_columns
    } if not projection_error else set()

    setting_props = {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
    }
    column_metadata = badge_column_source_metadata(region_block)

    for prop_name, (prop_value, prop_offset) in setting_props.items():
        if prop_name not in {"value", "state"}:
            continue
        cleaned_value = clean_scalar_value(prop_value)
        absolute_offset = component_start + settings_offset + prop_offset
        if AMP_SUBSTITUTION_TOKEN_PATTERN.fullmatch(cleaned_value) or "&" in cleaned_value:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_offset)}: "
                f"DSL_RULE_VALUE {component_label} settings.{prop_name} must use a bare source-column alias "
                f"such as BADGE_{prop_name.upper()}, not '&COLUMN_NAME.' substitution syntax"
            )
            continue
        normalized_cleaned_value = normalize_sql_identifier(cleaned_value)
        if normalized_cleaned_value not in column_metadata:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_offset)}: "
                f"DSL_RULE_VALUE {component_label} settings.{prop_name} references '{cleaned_value}', "
                "which is not mapped by an immediate Badge child column"
            )
            continue
        if normalized_columns and normalized_cleaned_value not in normalized_columns:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_offset)}: "
                f"DSL_RULE_VALUE {component_label} settings.{prop_name} references '{cleaned_value}', "
                "which is not projected by the Badge source"
            )

    label_meta = setting_props.get("label")
    if label_meta:
        label_value, label_offset = label_meta
        cleaned_label = clean_scalar_value(label_value)
        label_is_dynamic = bool(
            AMP_SUBSTITUTION_TOKEN_PATTERN.search(cleaned_label)
            or SUBSTITUTION_TOKEN_PATTERN.search(cleaned_label)
            or "{{" in cleaned_label
            or "}}" in cleaned_label
            or re.fullmatch(r":[A-Za-z][A-Za-z0-9_$#]*", cleaned_label)
        )
        label_contains_markup = bool(
            re.search(r"(?is)<\s*/?\s*[A-Za-z][^>]*>|\bon[A-Za-z]+\s*=", cleaned_label)
        )
        if not cleaned_label or label_is_dynamic or label_contains_markup:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + settings_offset + label_offset)}: "
                f"BADGE_LABEL_STATIC_REQUIRED_001 {component_label} settings.label must be non-empty plain static "
                "text; source mappings, substitutions, binds, template values, HTML, and event attributes are rejected"
            )

    icon_meta = setting_props.get("icon")
    if icon_meta:
        icon_value, icon_offset = icon_meta
        lint_static_template_component_icon(
            issues=issues,
            path=path,
            text=text,
            absolute_offset=component_start + settings_offset + icon_offset,
            component_label=component_label,
            property_path="settings.icon",
            value=icon_value,
        )

    value_meta = setting_props.get("value")
    if value_meta:
        value_column, _value_offset = value_meta
        normalized_value_column = normalize_sql_identifier(value_column)
        value_column_meta = column_metadata.get(normalized_value_column)
        if value_column_meta:
            value_data_type, value_data_type_offset = value_column_meta
            if normalize_value(value_data_type) not in BADGE_ALLOWED_VALUE_DATA_TYPES:
                allowed_text = ", ".join(
                    ["varchar2", "number", "date", "intervalYearToMonth", "intervalDayToSecond"]
                )
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + value_data_type_offset)}: "
                    f"BADGE_VALUE_DATATYPE_REQUIRED_001 {component_label} settings.value maps to "
                    f"source.dataType '{value_data_type}', but Badge value supports only: {allowed_text}"
                )

    state_meta = setting_props.get("state")
    if state_meta:
        state_column, state_offset = state_meta
        normalized_state_column = normalize_sql_identifier(state_column)
        state_column_meta = column_metadata.get(normalized_state_column)
        if state_column_meta:
            state_data_type, state_data_type_offset = state_column_meta
            if normalize_value(state_data_type) != "varchar2":
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + state_data_type_offset)}: "
                    f"BADGE_STATE_DATATYPE_REQUIRED_001 {component_label} settings.state must map to a varchar2 "
                    f"source column; found '{state_data_type}'"
                )
        proven_states: set[str] | None = None
        source_meta = top_level_blocks.get("source")
        if source_kind == "sql" and source_meta:
            _source_offset, source_block = source_meta
            sql_query_text = extract_fenced_property_body(source_block, "sqlQuery")
            if sql_query_text:
                proven_states = badge_state_values_from_sql(sql_query_text, normalized_state_column)

        if source_kind == "sql" and (
            proven_states is None or not proven_states.issubset(BADGE_ALLOWED_STATE_VALUES)
        ):
            allowed_text = ", ".join(sorted(BADGE_ALLOWED_STATE_VALUES))
            found_text = ", ".join(sorted(proven_states)) if proven_states else "unproven dynamic values"
            proof_hint = (
                " For sqlQuery sources, use a literal or CASE expression whose result values are allowlisted."
                if source_kind == "sql"
                else " Verify the selected source contract and omit settings.state when state was not requested."
            )
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + settings_offset + state_offset)}: "
                f"BADGE_STATE_ALLOWLIST_REQUIRED_001 {component_label} settings.state must be proven by its "
                f"projected source to return only: {allowed_text}; found {found_text}.{proof_hint}"
            )

    for action_offset, action_identifier, action_block in badge_actions:
        behavior_meta = extract_top_level_blocks(action_block).get("behavior")
        if not behavior_meta:
            continue
        behavior_offset, behavior_block = behavior_meta
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(behavior_block):
            absolute_offset = component_start + action_offset + behavior_offset + prop_offset
            action_label = f"{component_label} action '{action_identifier}'"
            if prop_name == "linkAttributes":
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_offset)}: "
                    f"BADGE_LINK_ATTRIBUTES_FORBIDDEN_001 {action_label} must not emit custom linkAttributes; "
                    "inline handlers and arbitrary class/attribute input are not trusted Badge link configuration"
                )
            elif prop_name == "targetUrl" or (
                prop_name == "type" and normalize_value(prop_value) == "redirecturl"
            ):
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_offset)}: "
                    f"BADGE_TARGET_URL_ALLOWLIST_REQUIRED_001 {action_label} must use a reviewed structured target; "
                    "Badge redirectUrl behavior and targetUrl are rejected because this repository has no "
                    "application-specific URL allowlist"
                )


def projection_column_is_allowed_extra(region_type_key: str, column_block: str, normalized_name: str) -> bool:
    """Return whether an emitted child column may exist outside the source projection."""
    if normalized_name.startswith("apex$"):
        return True
    if region_type_key == "classicReport":
        props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_property_values(column_block)
        }
        return props.get("derivedColumn", "N").upper() != "N"
    return False


def collect_emitted_projection_columns(region_type_key: str, region_block: str) -> dict[str, tuple[str, str, bool]]:
    """Collect emitted child column names mapped to source projection aliases."""
    emitted: dict[str, tuple[str, str, bool]] = {}
    for _column_offset, column_identifier, column_block in find_region_column_blocks(region_type_key, region_block):
        source_name = column_identifier
        if region_type_key == "mediaList":
            direct_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_property_values(column_block)
            }
            source_name = direct_props.get("columnName", "")
        column_top_level_blocks = extract_top_level_blocks(column_block)
        source_meta = column_top_level_blocks.get("source")
        if source_meta:
            _source_offset, source_block = source_meta
            source_props = {
                prop_name: (prop_value, prop_offset)
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
            }
            database_column_meta = source_props.get("databaseColumn")
            if database_column_meta:
                source_name = clean_scalar_value(database_column_meta[0])
        normalized = normalize_sql_identifier(source_name)
        if not normalized:
            continue
        emitted[normalized] = (
            source_name,
            column_identifier,
            projection_column_is_allowed_extra(region_type_key, column_block, normalized),
        )
    return emitted


def lint_map_initial_position_sql_aliases(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    block_offset: int,
    block_text: str,
) -> None:
    """Validate SQL-driven map initial-position aliases against configured column names."""
    prop_name_offsets = {
        prop_name: prop_offset for prop_name, prop_offset in extract_immediate_brace_property_names(block_text)
    }
    scalar_props = {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(block_text)
    }

    type_meta = scalar_props.get("type")
    if not type_meta or clean_scalar_value(type_meta[0]).lower() != "sqlquery":
        return

    sql_query_text = extract_fenced_property_body(block_text, "sqlQuery")
    if not sql_query_text:
        return

    select_list = extract_top_level_select_list(sql_query_text)
    if not select_list:
        return

    available_aliases = {
        normalize_sql_identifier(identifier)
        for identifier in (extract_select_expression_identifier(expression) for expression in select_list)
        if identifier
    }
    if not available_aliases:
        return

    geometry_meta = scalar_props.get("geometryColumnDataType")
    geometry_type = clean_scalar_value(geometry_meta[0]).lower() if geometry_meta else ""
    expected_props: list[str] = []
    if geometry_type == "longitudelatitude":
        expected_props.extend(["initialLongitudeColumn", "initialLatitudeColumn"])
    if "initialZoomlevelColumn" in scalar_props:
        expected_props.append("initialZoomlevelColumn")

    for prop_name in expected_props:
        prop_meta = scalar_props.get(prop_name)
        if not prop_meta:
            continue
        expected_value, prop_offset = prop_meta
        normalized_expected = normalize_sql_identifier(expected_value)
        if normalized_expected in available_aliases:
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset + prop_offset)}: "
            f"DSL_RULE_VALUE {component_label} initialPositionAndZoom.{prop_name} must match a SQL select-list alias; "
            f"query must return alias '{clean_scalar_value(expected_value)}'"
        )

    lower_sql = sql_query_text.lower()
    uses_average_center = bool(re.search(r"\bavg\s*\(\s*(longitude|latitude)\b", lower_sql))
    has_fixed_zoom_column = False
    zoom_meta = scalar_props.get("initialZoomlevelColumn")
    if zoom_meta:
        zoom_column = normalize_sql_identifier(zoom_meta[0])
        for expression in select_list:
            alias = normalize_sql_identifier(extract_select_expression_identifier(expression) or "")
            if alias != zoom_column:
                continue
            if re.search(r"(?i)(^|[\s,(])\d+(\.\d+)?\s+(?:as\s+)?[A-Z_][A-Z0-9_]*\s*$", expression.strip()):
                has_fixed_zoom_column = True
                break
    if uses_average_center and (has_fixed_zoom_column or zoom_meta):
        issue_offset = prop_name_offsets.get("sqlQuery", 0)
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset + issue_offset)}: "
            f"MAP_INITIAL_VIEWPORT_BOUNDS_REQUIRED_001 {component_label} must not center a multi-marker map on "
            "avg(latitude/longitude) with a fixed zoom level; use a bounds/query-results viewport derived from "
            "min/max latitude and longitude, or omit the fixed zoom when requirements explicitly call for one known "
            "location"
        )


def translation_language_suffixes(language: str) -> list[str]:
    """Return accepted translation filename suffixes for a language code."""
    cleaned = clean_scalar_value(language).replace("_", "-").strip().lower()
    if not cleaned:
        return []

    parts = [part for part in cleaned.split("-") if part]
    if not parts:
        return []

    candidates: list[str] = []

    def add_suffix(token: str) -> None:
        """Append a unique accepted suffix candidate."""
        if token and token not in candidates:
            candidates.append(token)

    full_underscore = "_".join(part.upper() for part in parts)
    full_hyphen = "-".join(part.upper() for part in parts)
    add_suffix(f"_{full_underscore}")
    add_suffix(f"-{full_hyphen}")
    add_suffix(f"_{''.join(part.upper() for part in parts)}")

    primary = parts[0].upper()
    add_suffix(f"_{primary}")
    add_suffix(f"-{primary}")

    return candidates


def lint_translation_text_messages(path: Path, text: str) -> list[str]:
    """Validate translation message syntax and language file naming."""
    issues: list[str] = []

    for start, component_id, block in find_component_blocks(text, "textMessage"):
        top_level_blocks = extract_top_level_blocks(block)
        message_meta = top_level_blocks.get("message")
        if not message_meta:
            continue

        message_offset, message_block = message_meta
        message_props = {
            prop_name: (prop_value, prop_offset)
            for prop_name, prop_value, prop_offset in extract_property_values(message_block)
        }
        language_meta = message_props.get("language")
        if not language_meta:
            continue

        language_value, _language_offset = language_meta
        cleaned_component_id = clean_scalar_value(component_id)
        if not cleaned_component_id:
            continue

        for suffix in translation_language_suffixes(language_value):
            if cleaned_component_id.upper().endswith(suffix):
                issues.append(
                    f"{display_path(path)}:{line_no(text, start)}: "
                    f"DSL_TRANSLATION_STATIC_ID textMessage identifier '{cleaned_component_id}' must keep the same "
                    "message key across languages; remove the language suffix and rely on message.language "
                    "to distinguish variants"
                )
                break

    return issues


SAME_APP_F_URL_PATTERN = re.compile(
    r"f\?p\s*=\s*(?:&APP_ID\.|#APP_ID#|&FLOW_ID\.|#FLOW_ID#)",
    re.IGNORECASE,
)
APEX_PAGE_GET_URL_PATTERN = re.compile(r"\bapex_page\.get_url\s*\(", re.IGNORECASE)
SUBSTITUTION_TOKEN_PATTERN = re.compile(r"#[A-Za-z][A-Za-z0-9_$-]*#")
AMP_SUBSTITUTION_TOKEN_PATTERN = re.compile(r"&([A-Za-z][A-Za-z0-9_$-]*)\.")
REPORT_TARGET_ITEMS_PATTERN = re.compile(r"items\s*:\s*\{(?P<body>.*?)\n\s*\}", re.IGNORECASE | re.DOTALL)
REPORT_TARGET_ITEM_ASSIGNMENT_PATTERN = re.compile(
    r"(?m)^\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.+?)\s*$"
)


def is_allowed_page_or_app_substitution(token: str) -> bool:
    """Return whether an ampersand substitution token is clearly page/app/session scoped."""
    normalized = token.upper()
    if re.fullmatch(r"P\d+_[A-Z0-9_]+", normalized):
        return True
    return normalized in {
        "APP_ID",
        "APP_SESSION",
        "SESSION",
        "DEBUG",
        "REQUEST",
        "FLOW_ID",
        "APP_PAGE_ID",
    }


def is_same_app_f_url(value: str) -> bool:
    """Return whether a scalar value is a same-application f?p URL string."""
    return bool(SAME_APP_F_URL_PATTERN.search(clean_scalar_value(value)))


def lint_declarative_button_targets(path: Path, text: str) -> list[str]:
    """Reject scalar or block-style same-application button redirect targets."""
    issues: list[str] = []

    for button_start, button_name, button_block in find_component_blocks(text, "button"):
        top_level_blocks = extract_top_level_blocks(button_block)
        behavior_meta = top_level_blocks.get("behavior")
        if not behavior_meta:
            continue

        behavior_offset, behavior_block = behavior_meta
        behavior_props = {
            prop_name: (prop_value, prop_offset)
            for prop_name, prop_value, prop_offset in extract_property_values(behavior_block)
        }
        behavior_blocks = extract_top_level_blocks(behavior_block)
        action_meta = behavior_props.get("action")
        if not action_meta or clean_scalar_value(action_meta[0]) != "redirectThisApp":
            continue

        target_block_meta = behavior_blocks.get("target")
        if target_block_meta:
            target_block_offset, _target_block = target_block_meta
            issues.append(
                f"{display_path(path)}:{line_no(text, button_start + behavior_offset + target_block_offset)}: "
                f"DECLARATIVE_BUTTON_TARGET_REQUIRED button '{button_name}' action redirectThisApp must use "
                "declarative target: { page, items, clearCache, action, request } syntax; bare 'target { ... }' blocks are invalid"
            )
            continue

        target_meta = behavior_props.get("target")
        if not target_meta:
            continue

        target_value, target_offset = target_meta
        if clean_scalar_value(target_value).startswith("{"):
            continue

        issues.append(
            f"{display_path(path)}:{line_no(text, button_start + behavior_offset + target_offset)}: "
            f"DECLARATIVE_BUTTON_TARGET_REQUIRED button '{button_name}' action redirectThisApp must use "
            "declarative target: { page, items, clearCache, action, request } syntax instead of a scalar URL target"
        )

    return issues


def link_block_uses_computed_target(link_block: str) -> bool:
    """Return whether a link block targets a SQL-projected URL column by substitution token."""
    for prop_name, prop_value, _prop_offset in extract_property_values(link_block):
        if prop_name == "target" and SUBSTITUTION_TOKEN_PATTERN.search(clean_scalar_value(prop_value)):
            return True

    return False


def report_region_has_computed_url_navigation(region_block: str) -> bool:
    """Return whether a report region appears to navigate through a SQL-computed URL column."""
    for _link_offset, link_block in find_immediate_named_brace_blocks(region_block, "link"):
        if link_block_uses_computed_target(link_block):
            return True

    for _column_offset, _column_name, column_block in find_immediate_component_blocks(region_block, "column"):
        for _link_offset, link_block in find_immediate_named_brace_blocks(column_block, "link"):
            if link_block_uses_computed_target(link_block):
                return True
        column_is_link = False
        column_has_computed_target = False
        for prop_name, prop_value, _prop_offset in extract_immediate_property_values(column_block):
            if prop_name == "type" and clean_scalar_value(prop_value).lower() == "link":
                column_is_link = True
            if prop_name == "target" and SUBSTITUTION_TOKEN_PATTERN.search(clean_scalar_value(prop_value)):
                column_has_computed_target = True
        if column_is_link and column_has_computed_target:
            return True

    return False


def lint_report_link_block_target(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    link_offset: int,
    link_block: str,
    component_label: str,
) -> None:
    """Reject scalar same-application f?p URL targets in Classic/Interactive Report link blocks."""
    for prop_name, prop_value, prop_offset in extract_property_values(link_block):
        if prop_name == "target" and is_same_app_f_url(prop_value):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + link_offset + prop_offset)}: "
                f"DECLARATIVE_REPORT_LINK_REQUIRED {component_label} must use declarative target "
                "{ page, items, clearCache } syntax instead of scalar f?p same-application URLs"
            )
        if prop_name == "type" and clean_scalar_value(prop_value).lower() == "url" and SAME_APP_F_URL_PATTERN.search(link_block):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + link_offset + prop_offset)}: "
                f"DECLARATIVE_REPORT_LINK_REQUIRED {component_label} must not use type: url for same-application navigation; "
                "use declarative target { page, items, clearCache } syntax"
            )
        if prop_name == "items":
            target_items_match = REPORT_TARGET_ITEMS_PATTERN.search(link_block)
            if not target_items_match:
                continue
            target_items_body = target_items_match.group("body")
            for assignment_match in REPORT_TARGET_ITEM_ASSIGNMENT_PATTERN.finditer(target_items_body):
                _dest_item = assignment_match.group(1)
                rhs = clean_scalar_value(assignment_match.group(2))
                amp_match = AMP_SUBSTITUTION_TOKEN_PATTERN.fullmatch(rhs)
                if not amp_match:
                    continue
                token = amp_match.group(1)
                if is_allowed_page_or_app_substitution(token):
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + link_offset + prop_offset)}: "
                    f"REPORT_LINK_ROW_SUBSTITUTION_REQUIRED {component_label} target.items uses '&{token}.'; "
                    f"use '#{token}#' for current Classic Report / Interactive Report row values and reserve '&ITEM.' for page/app/session substitutions"
                )


def lint_declarative_report_link_targets(path: Path, text: str) -> list[str]:
    """Reject scalar same-application f?p URL targets for Classic Report and Interactive Report links."""
    issues: list[str] = []
    report_types = {"classicReport", "interactiveReport"}

    for region_start, region_name, region_block in find_component_blocks(text, "region"):
        region_type_match = re.search(r"(?m)^\s*type\s*:\s*([A-Za-z][A-Za-z0-9]*)\s*$", region_block)
        if not region_type_match:
            continue
        region_type = region_type_match.group(1)
        if region_type not in report_types:
            continue

        region_label = f"region '{region_name}' type '{region_type}' link"
        for link_offset, link_block in find_immediate_named_brace_blocks(region_block, "link"):
            lint_report_link_block_target(
                issues=issues,
                path=path,
                text=text,
                component_start=region_start,
                link_offset=link_offset,
                link_block=link_block,
                component_label=region_label,
            )

        for column_offset, column_name, column_block in find_immediate_component_blocks(region_block, "column"):
            column_label = f"column '{column_name}' in region '{region_name}' type '{region_type}' link"
            for link_offset, link_block in find_immediate_named_brace_blocks(column_block, "link"):
                lint_report_link_block_target(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=region_start + column_offset,
                    link_offset=link_offset,
                    link_block=link_block,
                    component_label=column_label,
                )

        if not report_region_has_computed_url_navigation(region_block):
            continue

        region_blocks = extract_top_level_blocks(region_block)
        source_meta = region_blocks.get("source")
        if not source_meta:
            continue

        source_offset, source_block = source_meta
        sql_match = re.search(r"(?ms)```sql\s*(.*?)\s*```", source_block)
        if not sql_match:
            continue

        url_match = APEX_PAGE_GET_URL_PATTERN.search(sql_match.group(1))
        if url_match:
            issues.append(
                f"{display_path(path)}:{line_no(text, region_start + source_offset + sql_match.start(1) + url_match.start())}: "
                f"DECLARATIVE_REPORT_LINK_REQUIRED region '{region_name}' type '{region_type}' must not use "
                "SQL-generated apex_page.get_url(...) for report navigation when declarative target syntax is available"
            )

    return issues


def lint_declarative_navigation_targets(path: Path, text: str) -> list[str]:
    """Run declarative target checks for same-app buttons and report links."""
    issues = lint_declarative_button_targets(path, text)
    issues.extend(lint_declarative_report_link_targets(path, text))
    return issues


def lint_report_column_rendering(path: Path, text: str) -> list[str]:
    """Validate report column rendering rules and declarative column settings."""
    issues: list[str] = []
    report_types = {"classicReport", "interactiveReport", "interactiveGrid"}
    html_tag_pattern = re.compile(r"<\s*(span|div|a|img|style|script|svg)\b", re.IGNORECASE)

    for region_start, region_name, region_block in find_component_blocks(text, "region"):
        region_type_match = re.search(r"(?m)^\s*type\s*:\s*([A-Za-z][A-Za-z0-9]*)\s*$", region_block)
        if not region_type_match:
            continue
        region_type = region_type_match.group(1)
        if region_type not in report_types:
            continue

        region_blocks = extract_top_level_blocks(region_block)
        source_meta = region_blocks.get("source")
        if source_meta:
            source_offset, source_block = source_meta
            sql_match = re.search(r"(?ms)```sql\s*(.*?)\s*```", source_block)
            if sql_match and html_tag_pattern.search(sql_match.group(1)):
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + source_offset + sql_match.start(1))}: "
                    f"DSL_REPORT_SQL_HTML region '{region_name}' type '{region_type}' SQL must be data-only; move "
                    "markup to columnFormatting.htmlExpression"
                )

        for column_offset, column_name, column_block in find_immediate_component_blocks(region_block, "column"):
            column_start = region_start + column_offset
            component_label = f"column '{column_name}' in region '{region_name}' type '{region_type}'"
            column_type: str | None = None
            column_type_offset: int | None = None

            for prop_name, prop_value, prop_offset in extract_immediate_property_values(column_block):
                if prop_name == "type":
                    normalized_type = clean_scalar_value(prop_value).lower()
                    if normalized_type:
                        column_type = normalized_type
                        column_type_offset = prop_offset
                if prop_name == "htmlExpression":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, column_start + prop_offset)}: "
                        f"DSL_REPORT_RENDER_PROP {component_label} must not use top-level htmlExpression; use "
                        "columnFormatting.htmlExpression"
                    )

            column_blocks = extract_top_level_blocks(column_block)
            link_meta = column_blocks.get("link")
            if region_type == "classicReport" and link_meta and column_type != "link":
                link_offset, _link_block = link_meta
                issues.append(
                    f"{display_path(path)}:{line_no(text, column_start + link_offset)}: "
                    f"CLASSIC_REPORT_LINK_COLUMN_TYPE_REQUIRED_001 {component_label} emits link {{}} but must also "
                    "emit top-level type: link"
                )

            if region_type == "interactiveReport" and column_type == "link":
                issues.append(
                    f"{display_path(path)}:{line_no(text, column_start + (column_type_offset or 0))}: "
                    f"INTERACTIVE_REPORT_LINK_COLUMN_TYPE_FORBIDDEN_001 {component_label} uses type: link; "
                    "type: link is Classic Report-only and Interactive Report links must keep type: plainText "
                    "with link {}"
                )

            security_meta = column_blocks.get("security")
            if security_meta and is_business_app_path(path):
                security_offset, security_block = security_meta
                for prop_name, prop_value, prop_offset in extract_property_values(security_block):
                    if prop_name == "escapeSpecialChars" and clean_scalar_value(prop_value).lower() == "false":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, column_start + security_offset + prop_offset)}: "
                            f"REPORT_ESCAPE_REQUIRED_001 {component_label} must not disable escaping outside approved declarative formatting"
                        )

            if "columnFormatting" not in column_blocks:
                continue

            formatting_offset, formatting_block = column_blocks["columnFormatting"]
            formatting_props = extract_property_values(formatting_block)
            prop_names = {prop_name for prop_name, _prop_value, _prop_offset in formatting_props}

            for prop_name, _prop_value, prop_offset in formatting_props:
                if prop_name != "htmlExpression":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, column_start + formatting_offset + prop_offset)}: "
                        f"DSL_REPORT_RENDER_BLOCK {component_label} columnFormatting.{prop_name} is not supported; "
                        "only columnFormatting.htmlExpression is allowed"
                    )

            has_html_expression = "htmlExpression" in prop_names or bool(
                re.search(r"(?m)^\s*htmlExpression\s*:\s*$", formatting_block)
            )
            if not has_html_expression:
                issues.append(
                    f"{display_path(path)}:{line_no(text, column_start + formatting_offset)}: "
                    f"DSL_REPORT_RENDER_BLOCK {component_label} columnFormatting must define htmlExpression"
                )
                continue

            if column_type == "richText":
                issues.append(
                    f"{display_path(path)}:{line_no(text, column_start + formatting_offset)}: "
                    f"DSL_REPORT_RENDER_TYPE {component_label} must not use type: richText when "
                    "columnFormatting.htmlExpression is present; keep plain text type implicit"
                )

    return issues


def lint_classic_report_default_templates(path: Path, text: str) -> list[str]:
    """Validate classic report region and report-template defaults."""
    issues: list[str] = []
    default_appearance_options = ["#DEFAULT#"]
    default_component_options = ["#DEFAULT#", "t-Report--stretch", "t-Report--horizontalBorders"]

    def property_value(block_text: str, prop_name: str) -> tuple[str, int] | None:
        """Return the first matching property value and offset from a block."""
        for found_name, found_value, found_offset in extract_property_values(block_text):
            if found_name == prop_name:
                return found_value, found_offset
        return None

    def template_options(block_text: str) -> list[tuple[str, int]]:
        """Return cleaned template option entries from a block."""
        entries: list[tuple[str, int]] = []
        for token, token_offset in extract_template_option_entries(block_text):
            cleaned = token.strip().rstrip(",")
            if not cleaned:
                continue
            entries.append((cleaned, token_offset))
        return entries

    for region_start, region_name, region_block in find_component_blocks(text, "region"):
        if extract_item_type(region_block) != "classicReport":
            continue

        top_level_blocks = extract_top_level_blocks(region_block)
        component_label = f"region '{region_name}' type 'classicReport'"

        appearance_meta = top_level_blocks.get("appearance")
        if not appearance_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, region_start)}: "
                f"DSL_RULE_VALUE {component_label} must define appearance with the canonical Classic Report default template block"
            )
        else:
            appearance_offset, appearance_block = appearance_meta
            appearance_template_meta = property_value(appearance_block, "template")
            appearance_template = clean_scalar_value(appearance_template_meta[0]) if appearance_template_meta else ""
            if appearance_template not in {"@/standard", "@/contextual-info"}:
                issue_offset = appearance_offset + (
                    appearance_template_meta[1] if appearance_template_meta else 0
                )
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + issue_offset)}: "
                    f"DSL_RULE_VALUE {component_label} appearance.template must default to '@/standard' "
                    "or use documented contextual-info override '@/contextual-info'"
                )

            appearance_options = template_options(appearance_block)
            appearance_values = [value for value, _offset in appearance_options]
            if appearance_template == "@/contextual-info":
                if appearance_values != CLASSIC_REPORT_CONTEXTUAL_INFO_APPEARANCE_OPTIONS:
                    issue_offset = appearance_offset + (appearance_options[0][1] if appearance_options else 0)
                    issues.append(
                        f"{display_path(path)}:{line_no(text, region_start + issue_offset)}: "
                        f"CLASSIC_REPORT_CONTEXTUAL_INFO_TEMPLATE_OPTIONS_REQUIRED_001 {component_label} "
                        "appearance.templateOptions for @/contextual-info must be exactly '#DEFAULT#', "
                        "'t-Region--hideHeader js-addHiddenHeadingRoleDesc', and 't-Region--noUI'"
                    )
            elif appearance_values != default_appearance_options:
                issue_offset = appearance_offset + (appearance_options[0][1] if appearance_options else 0)
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + issue_offset)}: "
                    f"CLASSIC_REPORT_DEFAULT_TEMPLATE_REQUIRED_001 {component_label} appearance.templateOptions "
                    "must be exactly '#DEFAULT#'"
                )

        component_meta = top_level_blocks.get("componentAppearance")
        if not component_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, region_start)}: "
                f"CLASSIC_REPORT_COMPONENT_APPEARANCE_REQUIRED_001 {component_label} must define "
                "componentAppearance.template; live validation reports Missing required parameter (411): "
                "componentAppearance - template (string)"
            )
        else:
            component_offset, component_block = component_meta
            component_template_meta = property_value(component_block, "template")
            if not component_template_meta or clean_scalar_value(component_template_meta[0]) != "@/standard":
                issue_offset = component_offset + (
                    component_template_meta[1] if component_template_meta else 0
                )
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + issue_offset)}: "
                    f"CLASSIC_REPORT_COMPONENT_APPEARANCE_REQUIRED_001 {component_label} "
                    "componentAppearance.template must default to '@/standard' for compiler property 411"
                )

            component_options = template_options(component_block)
            component_values = [value for value, _offset in component_options]
            if component_values != default_component_options:
                issue_offset = component_offset + (component_options[0][1] if component_options else 0)
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + issue_offset)}: "
                    f"CLASSIC_REPORT_DEFAULT_TEMPLATE_REQUIRED_001 {component_label} componentAppearance.templateOptions "
                    "must be exactly '#DEFAULT#', 't-Report--stretch', and 't-Report--horizontalBorders'; "
                    "do not emit alternating-row tokens such as 't-Report--altRowsDefault' or "
                    "'t-Report--staticRowColors'"
                )

    return issues


def lint_classic_report_hidden_column_headings(path: Path, text: str) -> list[str]:
    """Reject hidden Classic Report columns that still emit heading blocks."""
    issues: list[str] = []
    for region_start, region_name, region_block in find_component_blocks(text, "region"):
        region_type = extract_item_type(region_block)
        if region_schema_key(region_type or "") != "classicReport":
            continue
        component_label = f"region '{region_name}' type '{region_type}'"
        for column_offset, column_identifier, column_block in find_immediate_component_blocks(region_block, "column"):
            column_props = {
                prop_name: clean_scalar_value(prop_value).lower()
                for prop_name, prop_value, _prop_offset in extract_immediate_property_values(column_block)
            }
            if column_props.get("type") != "hidden":
                continue
            heading_meta = extract_top_level_blocks(column_block).get("heading")
            if not heading_meta:
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, region_start + column_offset + heading_meta[0])}: "
                f"CLASSIC_REPORT_HIDDEN_COLUMN_HEADING_FORBIDDEN_001 {component_label} column "
                f"'{column_identifier}' type 'hidden' must omit the heading block"
            )
    return issues


def lint_smart_filter_results_regions(
    path: Path,
    text: str,
    validation_context: dict[str, Any] | None = None,
    *,
    apex_242: bool = True,
) -> list[str]:
    """Validate one Smart Filters region targets one unambiguous compatible base region."""
    issues: list[str] = []
    allowed_types = SMART_FILTER_ALLOWED_RESULTS_REGION_TYPES
    if not apex_242:
        # Preserved Markdown syntax examples span compiler releases. Their lint
        # does not certify 24.2 compatibility; every generated .apx uses the pin.
        allowed_types = allowed_types | {"interactiveReport", "interactiveGrid", "contentRow"}
    pages = find_component_blocks(text, "page")
    containers = [(page_start, page_name, page_block) for page_start, page_name, page_block in pages]
    if not containers:
        containers = [(0, path.stem, text)]

    for container_start, page_name, container_block in containers:
        if pages:
            region_entries = [
                (container_start + region_offset, region_name, region_block)
                for region_offset, region_name, region_block in find_immediate_component_blocks(container_block, "region")
            ]
        else:
            region_entries = find_component_blocks(container_block, "region")

        regions_by_static_id: dict[str, list[tuple[int, str, str]]] = {}
        smart_filter_regions: list[tuple[int, str, str, str]] = []
        for region_start, region_name, region_block in region_entries:
            region_type = extract_item_type(region_block) or ""
            region_type_key = region_schema_key(region_type)
            regions_by_static_id.setdefault(region_name, []).append((region_start, region_type_key, region_block))
            if region_type_key == "smartFilters":
                smart_filter_regions.append((region_start, region_name, region_type, region_block))

        if path.suffix.lower() == ".apx" and len(smart_filter_regions) > 1:
            issue_start = smart_filter_regions[1][0]
            issues.append(
                f"{display_path(path)}:{line_no(text, issue_start)}: "
                f"SMART_FILTER_TOPOLOGY_REQUIRED_001 page '{page_name}' must declare exactly one Smart Filters "
                f"region for the Smart Filter Search pattern; found {len(smart_filter_regions)}"
            )

        for region_start, region_name, region_type, region_block in smart_filter_regions:
            component_label = f"region '{region_name}' type '{region_type}'"
            source_meta = extract_top_level_blocks(region_block).get("source")
            if not source_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start)}: "
                    f"SMART_FILTER_RESULTS_REGION_REQUIRED_001 {component_label} must define "
                    "source.filteredRegion with one base-region static-id reference"
                )
                continue
            source_offset, source_block = source_meta
            source_props = {
                prop_name: (prop_value, prop_offset)
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
            }
            filtered_meta = source_props.get("filteredRegion")
            if not filtered_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + source_offset)}: "
                    f"SMART_FILTER_RESULTS_REGION_REQUIRED_001 {component_label} must define "
                    "source.filteredRegion with one base-region static-id reference"
                )
                continue
            filtered_value, filtered_offset = filtered_meta
            filtered_reference = clean_scalar_value(filtered_value)
            issue_offset = region_start + source_offset + filtered_offset
            if "{{" in filtered_reference:
                continue
            if not re.fullmatch(r"@[A-Za-z0-9_$-]+", filtered_reference):
                issues.append(
                    f"{display_path(path)}:{line_no(text, issue_offset)}: "
                    f"SMART_FILTER_TOPOLOGY_REQUIRED_001 {component_label} filteredRegion must contain exactly "
                    "one explicit @<base-region-static-id> reference"
                )
                continue

            filtered_region = filtered_reference[1:]
            target_candidates = regions_by_static_id.get(filtered_region, [])
            if not target_candidates:
                issues.append(
                    f"{display_path(path)}:{line_no(text, issue_offset)}: "
                    f"SMART_FILTER_RESULTS_REGION_REQUIRED_001 {component_label} filteredRegion must reference an "
                    "existing page results region"
                )
                continue
            if len(target_candidates) != 1:
                issues.append(
                    f"{display_path(path)}:{line_no(text, issue_offset)}: "
                    f"SMART_FILTER_TOPOLOGY_REQUIRED_001 {component_label} filteredRegion '{filtered_reference}' "
                    f"is ambiguous because {len(target_candidates)} page regions use that static id"
                )
                continue

            target_region_start, target_region_type, _target_region_block = target_candidates[0]
            if (
                target_region_type in SMART_FILTER_FORBIDDEN_RESULTS_REGION_TYPES
                or target_region_type not in allowed_types
            ):
                issues.append(
                    f"{display_path(path)}:{line_no(text, issue_offset)}: "
                    f"SMART_FILTER_RESULTS_REGION_REQUIRED_001 {component_label} filteredRegion must reference a "
                    "Classic Report, Cards, Map, or Calendar region supported by APEX 24.2"
                )
                continue
            if target_region_start < region_start:
                issues.append(
                    f"{display_path(path)}:{line_no(text, issue_offset)}: "
                    f"SMART_FILTER_RESULTS_REGION_ORDER_REQUIRED_001 {component_label} must appear before "
                    f"filteredRegion '{filtered_region}' so Smart Filters are declared before the region they filter"
                )
    return issues


def smart_filter_db_columns_ordered(region_block: str) -> list[str]:
    """Return normalized dbColumns in declaration order, preserving duplicates."""
    columns: list[str] = []
    for _filter_offset, _filter_name, filter_block in find_immediate_component_blocks(region_block, "filter"):
        source_meta = extract_top_level_blocks(filter_block).get("source")
        if not source_meta:
            continue
        _source_offset, source_block = source_meta
        source_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
        }
        db_columns = source_props.get("dbColumns", "")
        for column in re.split(r"[\s,]+", db_columns):
            normalized = normalize_sql_identifier(column)
            if normalized:
                columns.append(normalized)
    return columns


def smart_filter_db_columns(region_block: str) -> set[str]:
    """Return normalized dbColumns referenced by Smart Filters child filters."""
    return set(smart_filter_db_columns_ordered(region_block))


def _smart_filter_plan_value(mapping: dict[str, Any], *names: str) -> Any:
    """Return the first populated snake/camel-case plan field."""
    if not isinstance(mapping, dict):
        return None
    for name in names:
        if name in mapping:
            return mapping[name]
    return None


def _smart_filter_plan_is_nonempty(value: Any) -> bool:
    """Return whether a plan value contains meaningful evidence."""
    if value is None or value is False:
        return False
    if isinstance(value, str):
        return bool(value.strip()) and value.strip().lower() not in {
            "unknown",
            "unresolved",
            "not_provided",
            "not provided",
            "pending",
        }
    if isinstance(value, (list, tuple, dict)):
        return len(value) > 0
    return True


def _smart_filter_page_number(path: Path, text: str) -> int | None:
    """Resolve a page number for generation-plan selection."""
    filename_match = re.match(r"p0*(\d+)-", path.name, re.IGNORECASE)
    if filename_match:
        return int(filename_match.group(1))
    declaration_match = re.search(r"(?m)^\s*page\s+(\d+)\s*\(", text)
    return int(declaration_match.group(1)) if declaration_match else None


def _smart_filter_plan_entry_for_page(plan: dict[str, Any], path: Path, text: str) -> dict[str, Any] | None:
    """Select one page plan from a direct plan or a pages/plans collection."""
    if not isinstance(plan, dict):
        return None
    page_number = _smart_filter_page_number(path, text)
    collection = _smart_filter_plan_value(plan, "pages", "page_plans", "pagePlans", "plans")
    if isinstance(collection, list):
        candidates = [entry for entry in collection if isinstance(entry, dict)]
        if page_number is not None:
            for entry in candidates:
                entry_page = _smart_filter_plan_value(entry, "page", "page_id", "pageId", "page_number", "pageNumber")
                try:
                    if int(entry_page) == page_number:
                        return entry
                except (TypeError, ValueError):
                    continue
        return candidates[0] if len(candidates) == 1 else None
    plan_page = _smart_filter_plan_value(plan, "page", "page_id", "pageId", "page_number", "pageNumber")
    if plan_page is None or page_number is None:
        return plan
    try:
        return plan if int(plan_page) == page_number else None
    except (TypeError, ValueError):
        return None


def _load_smart_filter_plan_file(plan_path: Path) -> tuple[dict[str, Any] | None, str | None]:
    """Load one explicitly selected generation plan without treating prose as evidence."""
    try:
        payload = json.loads(plan_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return None, f"could not parse generation plan '{plan_path}': {exc}"
    if not isinstance(payload, dict):
        return None, f"generation plan '{plan_path}' must contain a JSON object"
    return payload, None


def smart_filter_generation_plan_state(
    path: Path,
    text: str,
    validation_context: dict[str, Any] | None = None,
) -> tuple[dict[str, Any] | None, str | None, bool]:
    """Resolve a structured Smart Filter Generation Plan and its blocking state."""
    context = validation_context or {}
    for plan_key in ("smart_filter_generation_plan", "generation_plan"):
        if plan_key not in context:
            continue
        direct_plan = context.get(plan_key)
        if isinstance(direct_plan, dict):
            return _smart_filter_plan_entry_for_page(direct_plan, path, text), None, True
        if direct_plan is not None:
            return None, f"{plan_key} must contain a JSON object", True

    plan_error = context.get("smart_filter_generation_plan_error")
    explicit_path = context.get("smart_filter_generation_plan_path")
    if explicit_path:
        plan_path = Path(str(explicit_path)).expanduser()
        payload, error = _load_smart_filter_plan_file(plan_path)
        if error:
            return None, error, True
        return _smart_filter_plan_entry_for_page(payload or {}, path, text), None, True

    current = path.parent.resolve()
    for _ in range(6):
        for relative_name in SMART_FILTER_PLAN_FILENAMES:
            candidate = current / relative_name
            if not candidate.exists() or not candidate.is_file():
                continue
            payload, error = _load_smart_filter_plan_file(candidate)
            if error:
                return None, error, True
            return _smart_filter_plan_entry_for_page(payload or {}, path, text), None, True
        if current.parent == current:
            break
        current = current.parent

    if plan_error:
        return None, str(plan_error), True
    return None, None, bool(context.get("require_smart_filter_generation_plan"))


def _smart_filter_plan_section(plan: dict[str, Any], *names: str) -> dict[str, Any]:
    """Return a nested plan section, falling back to the plan itself."""
    value = _smart_filter_plan_value(plan, *names)
    return value if isinstance(value, dict) else plan


def _smart_filter_plan_explicit_projection(plan: dict[str, Any]) -> list[str]:
    """Return a normalized explicit base projection when the plan proves one."""
    base_plan = _smart_filter_plan_section(plan, "base_source", "baseSource", "source")
    explicit_projection = _smart_filter_plan_value(base_plan, "explicit_projection", "explicitProjection")
    projection = _smart_filter_plan_value(base_plan, "projection", "projected_columns", "projectedColumns")
    if explicit_projection is not True or not isinstance(projection, list) or not projection:
        return []
    normalized = [normalize_sql_identifier(str(column)) for column in projection]
    return normalized if all(normalized) else []


def _smart_filter_plan_issue(
    path: Path,
    text: str,
    offset: int,
    rule_id: str,
    component_label: str,
    message: str,
) -> str:
    """Format a deterministic Smart Filter plan finding."""
    return (
        f"{display_path(path)}:{line_no(text, offset)}: {rule_id} {component_label} {message}; "
        "stop with Missing Inputs"
    )


def _smart_filter_plan_evidence_records(value: Any) -> dict[str, Any]:
    """Normalize property-level compiler evidence keyed by behavior name."""
    if isinstance(value, dict):
        nested = _smart_filter_plan_value(value, "properties", "propertyEvidence", "property_evidence")
        if isinstance(nested, dict):
            return nested
        return value
    if isinstance(value, list):
        records: dict[str, Any] = {}
        for record in value:
            if not isinstance(record, dict):
                continue
            name = _smart_filter_plan_value(record, "property", "property_name", "propertyName", "decision", "name")
            if isinstance(name, str) and name.strip():
                records[name.strip()] = record
        return records
    return {}


def _smart_filter_plan_evidence_is_resolved(value: Any) -> bool:
    """Return whether one evidence record proves a supported compiler representation."""
    if isinstance(value, str):
        return _smart_filter_plan_is_nonempty(value)
    if not isinstance(value, dict):
        return False
    status = str(_smart_filter_plan_value(value, "status", "state", "result", "support") or "").strip().lower()
    if status in {"unsupported", "unrepresentable", "unresolved", "missing", "blocked"}:
        return False
    if _smart_filter_plan_value(value, "supported", "representable", "compiler_supported") is False:
        return False
    reference = _smart_filter_plan_value(value, "reference", "evidence_ref", "evidenceRef", "query", "command", "build")
    return _smart_filter_plan_is_nonempty(reference) or status in {"supported", "represented", "verified", "pass", "passed"}


def _smart_filter_region_target(region_block: str) -> str:
    """Return one explicit Smart Filter target static id, when present."""
    source_meta = extract_top_level_blocks(region_block).get("source")
    if not source_meta:
        return ""
    _source_offset, source_block = source_meta
    for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block):
        if prop_name == "filteredRegion":
            value = clean_scalar_value(prop_value)
            return value[1:] if re.fullmatch(r"@[A-Za-z0-9_$-]+", value) else ""
    return ""


def map_layer_projection_identifiers(
    map_region_block: str,
    validation_context: dict[str, Any] | None,
) -> set[str]:
    """Return normalized projection aliases from all map layer sources."""
    identifiers: set[str] = set()
    for _layer_offset, _layer_name, layer_block in find_immediate_component_blocks(map_region_block, "layer"):
        top_level_blocks = extract_top_level_blocks(layer_block)
        expected_columns, _projection_error, _source_kind = source_projection_columns(top_level_blocks, validation_context)
        identifiers.update(normalize_sql_identifier(column) for column in expected_columns)
    return {identifier for identifier in identifiers if identifier}


def split_page_item_list(value: str) -> set[str]:
    """Extract page item names from a comma/list scalar."""
    return {match.group(0).upper() for match in re.finditer(r"\bP\d+_[A-Za-z0-9_$#]+\b", value or "", re.IGNORECASE)}


def sql_page_item_binds(sql_text: str, page_number: int | None = None) -> set[str]:
    """Extract same-page APEX page item binds from SQL text."""
    binds: set[str] = set()
    for match in re.finditer(r":(P\d+_[A-Za-z0-9_$#]+)\b", sql_text or "", re.IGNORECASE):
        item_name = match.group(1).upper()
        if page_number is not None:
            item_page = re.match(r"P(\d+)_", item_name, re.IGNORECASE)
            if item_page and int(item_page.group(1)) != page_number:
                continue
        binds.add(item_name)
    return binds


def sql_page_item_session_state_refs(sql_text: str, page_number: int | None = None) -> set[str]:
    """Extract APEX page item references read through v()/nv() session-state functions."""
    refs: set[str] = set()
    patterns = (
        r"\b(?:v|nv)\s*\(\s*'((?:P\d+_)[A-Za-z0-9_$#]+)'\s*\)",
        r"\b(?:v|nv)\s*\(\s*'P'\s*\|\|\s*'(\d+_[A-Za-z0-9_$#]+)'\s*\)",
    )
    for pattern in patterns:
        for match in re.finditer(pattern, sql_text or "", re.IGNORECASE):
            item_name = match.group(1).upper()
            if not item_name.startswith("P"):
                item_name = f"P{item_name}"
            if page_number is not None:
                item_page = re.match(r"P(\d+)_", item_name, re.IGNORECASE)
                if item_page and int(item_page.group(1)) != page_number:
                    continue
            refs.add(item_name)
    return refs


def page_number_from_context(path: Path, page_name: str, page_block: str) -> int | None:
    """Resolve the page number from a page block or canonical page filename."""
    page_match = re.match(r"(\d+)$", page_name)
    if page_match:
        return int(page_match.group(1))
    file_match = re.match(r"p0*(\d+)-", path.name, re.IGNORECASE)
    if file_match:
        return int(file_match.group(1))
    declaration_match = re.search(r"(?m)^\s*page\s+(\d+)\s*\(", page_block)
    if declaration_match:
        return int(declaration_match.group(1))
    return None


def page_filename_identity(path: Path) -> tuple[int, str] | None:
    """Return the page number and alias implied by a canonical page filename."""
    match = re.match(r"p0*(\d+)-(.+)\.apx$", path.name, re.IGNORECASE)
    if not match:
        return None
    slug = match.group(2)
    expected_alias = re.sub(r"[^A-Z0-9]+", "-", slug.upper()).strip("-")
    if not expected_alias:
        return None
    return int(match.group(1)), expected_alias


def lint_page_filename_identity_contract(path: Path, text: str) -> list[str]:
    """Validate canonical page filenames match the page declaration and alias."""
    expected = page_filename_identity(path)
    if expected is None:
        return []
    expected_page_number, expected_alias = expected
    if expected_page_number == 0:
        return []
    issues: list[str] = []
    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        declared_page_number = parse_int(page_name)
        if declared_page_number != expected_page_number:
            issues.append(
                f"{display_path(path)}:{line_no(text, page_start)}: "
                f"PAGE_FILENAME_NUMBER_MISMATCH_001 file '{path.name}' requires page {expected_page_number}; "
                f"got page {page_name}"
            )
        props = {name: (value, offset) for name, value, offset in extract_immediate_property_values(page_block)}
        alias_meta = props.get("alias")
        actual_alias = clean_scalar_value(alias_meta[0]) if alias_meta else ""
        if actual_alias != expected_alias:
            issue_offset = alias_meta[1] if alias_meta else 0
            issues.append(
                f"{display_path(path)}:{line_no(text, page_start + issue_offset)}: "
                f"PAGE_ALIAS_FILENAME_MISMATCH_001 file '{path.name}' requires alias '{expected_alias}'; "
                f"got '{actual_alias or '<missing>'}'"
            )
    return issues


def lint_page_direct_property_contract(path: Path, text: str) -> list[str]:
    """Reject page identity repeated as an unsupported direct page property."""
    issues: list[str] = []
    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for prop_name, _prop_value, prop_offset in extract_immediate_property_values(page_block):
            if prop_name != "page":
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, page_start + prop_offset)}: "
                "PAGE_DIRECT_PROPERTY_INVALID_001 direct property 'page' is invalid; "
                f"the page number belongs only in the `page {page_name} (` declaration"
            )
    return issues


def source_sql_query(top_level_blocks: dict[str, tuple[int, str]]) -> str:
    """Return a region source.sqlQuery body when present."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return ""
    _source_offset, source_block = source_meta
    return extract_fenced_property_body(source_block, "sqlQuery") or ""


def source_page_items_to_submit(top_level_blocks: dict[str, tuple[int, str]]) -> set[str]:
    """Return source.pageItemsToSubmit item names for a region."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return set()
    _source_offset, source_block = source_meta
    source_props = {
        prop_name: prop_value
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
    }
    return split_page_item_list(source_props.get("pageItemsToSubmit", ""))


def dynamic_action_refresh_regions(dynamic_action_block: str) -> set[str]:
    """Return static ids targeted by native Refresh actions in one dynamic action."""
    regions: set[str] = set()
    for _action_offset, _action_name, action_block in find_immediate_component_blocks(dynamic_action_block, "action"):
        action_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_property_values(action_block)
        }
        if action_props.get("action") != "refresh":
            continue
        affected_meta = extract_top_level_blocks(action_block).get("affectedElements")
        if not affected_meta:
            continue
        _affected_offset, affected_block = affected_meta
        affected_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(affected_block)
        }
        region_ref = affected_props.get("region", "")
        if affected_props.get("selectionType") == "region" and region_ref.startswith("@"):
            regions.add(region_ref[1:])
    return regions


def dynamic_action_when_values(dynamic_action_block: str) -> tuple[str, str, str, set[str]]:
    """Return event, selection type, region, and item triggers for one dynamic action."""
    when_meta = extract_top_level_blocks(dynamic_action_block).get("when")
    if not when_meta:
        return "", "", "", set()
    _when_offset, when_block = when_meta
    when_props = {
        prop_name: clean_scalar_value(prop_value)
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(when_block)
    }
    return (
        when_props.get("event", ""),
        when_props.get("selectionType", ""),
        when_props.get("region", ""),
        split_page_item_list(when_props.get("items", "")),
    )


def lint_cards_refresh_contract(path: Path, text: str) -> list[str]:
    """Validate Cards bind submission plus item-change and dialog-close refresh wiring."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        page_number = page_number_from_context(path, page_name, page_block)
        cards: dict[str, tuple[int, set[str], set[str]]] = {}
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if region_schema_key(extract_item_type(region_block) or "") != "cards":
                continue
            top_level_blocks = extract_top_level_blocks(region_block)
            binds = sql_page_item_binds(source_sql_query(top_level_blocks), page_number)
            submitted = source_page_items_to_submit(top_level_blocks)
            cards[region_name] = (region_offset, binds, submitted)
            missing_submit = sorted(binds - submitted)
            if missing_submit:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset)}: "
                    f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 region '{region_name}' type 'cards' SQL references "
                    f"{', '.join(':' + item for item in missing_submit)} and must list them in source.pageItemsToSubmit"
                )

        if not cards:
            continue

        refresh_actions: list[tuple[str, str, str, str, set[str], set[str], int]] = []
        for da_offset, da_name, da_block in find_immediate_component_blocks(page_block, "dynamicAction"):
            event, selection_type, trigger_region, trigger_items = dynamic_action_when_values(da_block)
            refresh_regions = dynamic_action_refresh_regions(da_block)
            refresh_actions.append(
                (da_name, event, selection_type, trigger_region, trigger_items, refresh_regions, da_offset)
            )
            cards_targets = refresh_regions & set(cards)
            if not cards_targets:
                continue
            if len(refresh_regions) != 1 or len(cards_targets) != 1:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + da_offset)}: "
                    f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 dynamicAction '{da_name}' must target exactly one "
                    "Cards region with its Refresh action"
                )
            if not event:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + da_offset)}: "
                    f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 dynamicAction '{da_name}' refreshing Cards must "
                    "define a when trigger"
                )
                continue
            if event == "change":
                if selection_type != "items" or not trigger_items:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + da_offset)}: "
                        f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 dynamicAction '{da_name}' item-change Cards "
                        "refresh must use when.selectionType: items with at least one when.items trigger"
                    )
                for cards_name in cards_targets:
                    submitted = cards[cards_name][2]
                    missing_trigger_submit = sorted(trigger_items - submitted)
                    if missing_trigger_submit:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, page_start + da_offset)}: "
                            f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 dynamicAction '{da_name}' trigger item(s) "
                            f"{', '.join(missing_trigger_submit)} must appear in @{cards_name} source.pageItemsToSubmit"
                        )
            elif event == "apexafterclosedialog":
                if selection_type != "region" or not trigger_region.startswith("@"):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + da_offset)}: "
                        f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 dynamicAction '{da_name}' dialog-close Cards "
                        "refresh must use when.selectionType: region with a concrete when.region trigger"
                    )
            else:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + da_offset)}: "
                    f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 dynamicAction '{da_name}' refreshing Cards must use "
                    "when.event: change or apexafterclosedialog"
                )

        for cards_name, (region_offset, _binds, submitted) in cards.items():
            if not submitted:
                continue
            related_change_actions = [
                action
                for action in refresh_actions
                if action[1] == "change" and action[4] & submitted and action[5]
            ]
            if related_change_actions and not any(action[5] == {cards_name} for action in related_change_actions):
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset)}: "
                    f"CARDS_INTERACTION_BOUNDARY_REQUIRED_001 item-change refresh for @{cards_name} must target "
                    "that Cards region and no other region"
                )

    return issues


def map_layer_sql_binds(map_region_block: str, page_number: int | None = None) -> set[str]:
    """Return same-page item binds used by all SQL-backed map layers."""
    binds: set[str] = set()
    for _layer_offset, _layer_name, layer_block in find_immediate_component_blocks(map_region_block, "layer"):
        sql_query = source_sql_query(extract_top_level_blocks(layer_block))
        binds.update(sql_page_item_binds(sql_query, page_number))
        binds.update(sql_page_item_session_state_refs(sql_query, page_number))
    return binds


def map_layer_page_items_to_submit(map_region_block: str) -> set[str]:
    """Return page items submitted by all map layer sources."""
    submitted: set[str] = set()
    for _layer_offset, _layer_name, layer_block in find_immediate_component_blocks(map_region_block, "layer"):
        submitted.update(source_page_items_to_submit(extract_top_level_blocks(layer_block)))
    return submitted


def content_row_projection_identifiers(
    top_level_blocks: dict[str, tuple[int, str]],
    region_block: str,
    validation_context: dict[str, Any] | None = None,
) -> set[str]:
    """Collect source and emitted identifiers that Content Row settings may reference."""
    identifiers: set[str] = set()
    expected_columns, _projection_error, _source_kind = source_projection_columns(top_level_blocks, validation_context)
    identifiers.update(normalize_sql_identifier(column) for column in expected_columns)
    for normalized in collect_emitted_projection_columns("contentRow", region_block):
        identifiers.add(normalized)
    return {identifier for identifier in identifiers if identifier}


def metric_card_projection_identifiers(
    top_level_blocks: dict[str, tuple[int, str]],
    region_block: str,
    validation_context: dict[str, Any] | None = None,
) -> set[str]:
    """Collect source and emitted identifiers referenced by Metric Card attributes."""
    identifiers: set[str] = set()
    expected_columns, _projection_error, _source_kind = source_projection_columns(top_level_blocks, validation_context)
    identifiers.update(normalize_sql_identifier(column) for column in expected_columns)
    for normalized in collect_emitted_projection_columns("metricCard", region_block):
        identifiers.add(normalized)
    return {identifier for identifier in identifiers if identifier}


def metric_card_grouped_columns(region_block: str) -> list[str]:
    """Return Metric Card child columns marked for report grouping in declaration order."""
    grouped: list[str] = []
    for _column_offset, column_identifier, column_block in find_immediate_component_blocks(region_block, "column"):
        column_blocks = extract_top_level_blocks(column_block)
        appearance_meta = column_blocks.get("appearance")
        source_meta = column_blocks.get("source")
        if not appearance_meta or not source_meta:
            continue
        _appearance_offset, appearance_block = appearance_meta
        appearance_props = {
            name: clean_scalar_value(value)
            for name, value, _offset in extract_immediate_brace_property_values(appearance_block)
        }
        if normalize_value(appearance_props.get("group", "")) != "true":
            continue
        _source_offset, source_block = source_meta
        source_props = {
            name: clean_scalar_value(value)
            for name, value, _offset in extract_immediate_brace_property_values(source_block)
        }
        grouped.append(source_props.get("databaseColumn", column_identifier))
    return grouped


def metric_card_static_avatar_url_is_safe(value: str) -> bool:
    """Return whether a static Metric Card Avatar URL is application-managed and relative."""
    cleaned = clean_scalar_value(value)
    prefix_match = re.match(r"^(#(?:APP|APEX)_FILES#)(.+)$", cleaned)
    if not prefix_match:
        return False
    relative_path = prefix_match.group(2).strip()
    if not relative_path or relative_path.startswith("/"):
        return False
    if "//" in relative_path or ":" in relative_path:
        return False
    if any(segment == ".." for segment in relative_path.split("/")):
        return False
    return not bool(re.search(r"[\x00-\x1f\x7f]", relative_path))


def metric_card_target_url_safety_error(value: str) -> str | None:
    """Return the safety failure for one Metric Card redirect URL, if any."""
    cleaned = html.unescape(clean_scalar_value(value))
    if not cleaned:
        return "must not be empty"
    if re.search(r"[\x00-\x1f\x7f]", cleaned):
        return "must not contain control characters"
    if "{{" in cleaned or "}}" in cleaned or AMP_SUBSTITUTION_TOKEN_PATTERN.fullmatch(cleaned) or SUBSTITUTION_TOKEN_PATTERN.fullmatch(cleaned):
        return "must not be a wholly dynamic destination that cannot be reviewed"

    substitution_matches = sorted(
        [*AMP_SUBSTITUTION_TOKEN_PATTERN.finditer(cleaned), *SUBSTITUTION_TOKEN_PATTERN.finditer(cleaned)],
        key=lambda match: match.start(),
    )
    if substitution_matches:
        masked = AMP_SUBSTITUTION_TOKEN_PATTERN.sub(lambda match: "x" * len(match.group(0)), cleaned)
        masked = SUBSTITUTION_TOKEN_PATTERN.sub(lambda match: "x" * len(match.group(0)), masked)
        query_start = masked.find("?")
        fragment_start = masked.find("#", query_start + 1) if query_start >= 0 else -1
        if query_start < 0 or any(
            match.start() <= query_start or (fragment_start >= 0 and match.start() > fragment_start)
            for match in substitution_matches
        ):
            return "must keep substitutions inside query parameters; the scheme, host, path, and fragment must be static"

    compact = re.sub(r"\s+", "", cleaned)
    if compact.startswith(("//", "\\\\", "/\\", "\\/")):
        return "must not use a protocol-relative destination"
    if is_same_app_f_url(cleaned):
        return "must use a structured target for same-application navigation instead of an f?p= URL"

    scheme_match = re.match(r"(?i)^([a-z][a-z0-9+.-]*):", compact)
    if scheme_match and scheme_match.group(1).lower() not in {"http", "https", "mailto", "tel"}:
        return "must use a relative URL or the http, https, mailto, or tel scheme"
    return None


def metric_card_link_attributes_safety_error(value: str) -> str | None:
    """Return the safety failure for static Metric Card link attributes, if any."""
    cleaned = html.unescape(clean_scalar_value(value)).replace('\\"', '"').replace("\\'", "'")
    if not cleaned:
        return None
    if re.search(r"[\x00-\x1f\x7f]", cleaned):
        return "must not contain control characters"
    if "{{" in cleaned or "}}" in cleaned or AMP_SUBSTITUTION_TOKEN_PATTERN.search(cleaned) or SUBSTITUTION_TOKEN_PATTERN.search(cleaned):
        return "must be static so every emitted attribute can be reviewed"
    if re.search(r"(?i)(?:^|\s)on[a-z][a-z0-9_-]*\s*=", cleaned):
        return "must not contain inline event handlers"
    if re.search(r"(?i)(?:^|\s)(?:href|src|xlink:href|action|formaction)\s*=", cleaned):
        return "must not contain URL-bearing attributes; use behavior.targetUrl for navigation"
    if re.search(r"(?i)(?:javascript|vbscript|data)\s*:|expression\s*\(", cleaned):
        return "must not contain unsafe URL schemes or scriptable CSS"
    if re.search(r"(?i)(?:^|\s)target\s*=\s*(['\"]?)_blank\1(?:\s|$)", cleaned):
        rel_match = re.search(r"(?i)(?:^|\s)rel\s*=\s*(['\"])(.*?)\1|(?:^|\s)rel\s*=\s*([^\s]+)", cleaned)
        rel_value = (rel_match.group(2) or rel_match.group(3) or "").lower() if rel_match else ""
        if not {"noopener", "noreferrer"}.intersection(rel_value.split()):
            return "target=\"_blank\" requires rel=\"noopener\" or rel=\"noreferrer\""
    return None


def lint_metric_card_avatar_image_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
    avatar_offset: int,
    avatar_block: str,
    column_metadata: dict[str, tuple[str, int]],
) -> None:
    """Validate Metric Card Avatar media shape, column mappings, and URL safety."""
    image_meta = extract_property_object_block(avatar_block, "image")
    if not image_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
            f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.image must be an object"
        )
        return

    image_offset, image_block = image_meta
    image_props = {
        name: (clean_scalar_value(value), offset)
        for name, value, offset in extract_property_values(image_block)
        if name != "image"
    }
    image_type_meta = image_props.get("type")
    image_type = image_type_meta[0] if image_type_meta else ""
    required_by_type = {
        "url": {"type", "url"},
        "urlColumn": {"type", "urlColumn"},
        "blobColumn": {"type", "blobColumn", "filenameColumn", "mimeTypeColumn", "lastUpdatedColumn"},
    }
    if image_type not in required_by_type:
        issue_offset = image_type_meta[1] if image_type_meta else 0
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + avatar_offset + image_offset + issue_offset)}: "
            f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.image.type must be one of: "
            "blobColumn, url, urlColumn"
        )
        return

    required_props = required_by_type[image_type]
    for prop_name in sorted(required_props - set(image_props)):
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + avatar_offset + image_offset)}: "
            f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.image.type: {image_type} "
            f"requires plugin-avatar.image.{prop_name}"
        )
    for prop_name in sorted(set(image_props) - required_props):
        _value, prop_offset = image_props[prop_name]
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + avatar_offset + image_offset + prop_offset)}: "
            f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.image.{prop_name} must be "
            f"omitted when plugin-avatar.image.type: {image_type}"
        )

    def validate_column(prop_name: str, allowed_types: set[str]) -> str | None:
        prop_meta = image_props.get(prop_name)
        if not prop_meta:
            return None
        column_name, prop_offset = prop_meta
        normalized_column = normalize_sql_identifier(column_name)
        column_meta = column_metadata.get(normalized_column)
        if AMP_SUBSTITUTION_TOKEN_PATTERN.fullmatch(column_name) or not column_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + avatar_offset + image_offset + prop_offset)}: "
                f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.image.{prop_name} "
                "must use a bare projected child-column alias"
            )
            return None
        data_type = normalize_value(column_meta[0])
        if data_type not in allowed_types:
            allowed_text = ", ".join(sorted(allowed_types))
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + avatar_offset + image_offset + prop_offset)}: "
                f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.image.{prop_name} "
                f"must reference source.dataType {allowed_text}; found '{column_meta[0]}'"
            )
            return None
        return normalized_column

    if image_type == "blobColumn":
        validate_column("blobColumn", {"blob"})
        validate_column("filenameColumn", {"varchar2"})
        validate_column("mimeTypeColumn", {"varchar2"})
        validate_column(
            "lastUpdatedColumn",
            {"date", "timestamp", "timestampwithlocaltimezone", "timestampwithtimezone"},
        )
        return

    if image_type == "url":
        url_meta = image_props.get("url")
        if url_meta and not metric_card_static_avatar_url_is_safe(url_meta[0]):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + avatar_offset + image_offset + url_meta[1])}: "
                f"AVATAR_IMAGE_URL_SAFETY_REQUIRED_001 {component_label} plugin-avatar.image.url must use "
                "#APP_FILES# or #APEX_FILES# plus one static relative path"
            )
        return

    normalized_url_column = validate_column("urlColumn", {"varchar2"})
    if not normalized_url_column:
        return
    source_meta = top_level_blocks.get("source")
    sql_query_text = extract_fenced_property_body(source_meta[1], "sqlQuery") if source_meta else None
    expressions = sql_projection_expressions(sql_query_text, normalized_url_column) if sql_query_text else None
    if not expressions or any(not avatar_url_expression_is_safe(expression) for expression in expressions):
        url_meta = image_props["urlColumn"]
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + avatar_offset + image_offset + url_meta[1])}: "
            f"AVATAR_IMAGE_URL_SAFETY_REQUIRED_001 {component_label} plugin-avatar.image.urlColumn "
            f"'{url_meta[0]}' must be proven by source.sqlQuery to use :APP_FILES or :APEX_FILES plus one "
            "static relative path"
        )


def lint_metric_card_mapping_contracts(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
    validation_context: dict[str, Any] | None = None,
) -> None:
    """Validate Metric Card text, nested feature, grouping, and row-link mappings."""
    identifiers = metric_card_projection_identifiers(top_level_blocks, region_block, validation_context)
    column_metadata = template_component_column_source_metadata(region_block)
    grouped_columns = metric_card_grouped_columns(region_block)
    _source_columns, _projection_error, source_kind = source_projection_columns(
        top_level_blocks,
        validation_context,
    )
    display_mode = template_component_display_mode(top_level_blocks)

    settings_meta = top_level_blocks.get("settings")
    if settings_meta:
        settings_offset, settings_block = settings_meta
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block):
            if display_mode == "partial" and prop_name in {"layout", "itemCssClasses"}:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + settings_offset + prop_offset)}: "
                    f"METRIC_CARD_PARTIAL_SCOPE_REQUIRED_001 {component_label} settings.{prop_name} is report-only "
                    "and must be omitted when componentAppearance.display: partial"
                )
            value = clean_scalar_value(prop_value)
            normalized = normalize_sql_identifier(value)
            if (
                prop_name in {"title", "metric", "meta"}
                and re.fullmatch(r"[A-Za-z][A-Za-z0-9_$#]*", value)
                and normalized in identifiers
            ):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + settings_offset + prop_offset)}: "
                    f"METRIC_CARD_SETTINGS_SUBSTITUTION_REQUIRED_001 {component_label} settings.{prop_name} "
                    f"references source column '{value}' and must use '&{value.upper()}.' substitution syntax"
                )
            for substitution_match in AMP_SUBSTITUTION_TOKEN_PATTERN.finditer(value):
                if identifiers and normalize_sql_identifier(substitution_match.group(1)) not in identifiers:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + settings_offset + prop_offset)}: "
                        f"DSL_RULE_VALUE {component_label} settings.{prop_name} references source column "
                        f"'&{substitution_match.group(1)}.' that is not projected by the Metric Card source"
                    )

    avatar_meta = top_level_blocks.get("plugin-avatar")
    if avatar_meta:
        avatar_offset, avatar_block = avatar_meta
        avatar_names = {name for name, _offset in extract_immediate_brace_property_names(avatar_block)}
        avatar_props = {
            name: (clean_scalar_value(value), offset)
            for name, value, offset in extract_immediate_brace_property_values(avatar_block)
        }
        display_avatar = normalize_value(avatar_props.get("displayAvatar", ("", 0))[0])
        avatar_type = clean_scalar_value(avatar_props.get("type", ("", 0))[0])
        if display_avatar != "true":
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
                f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar must define displayAvatar: true"
            )
        payload_names = {name for name in ("icon", "initials", "image") if name in avatar_names}
        if avatar_type not in {"icon", "initials", "image"}:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
                f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar must define one supported type"
            )
        elif payload_names != {avatar_type}:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
                f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.type: {avatar_type} "
                f"requires only plugin-avatar.{avatar_type} as its payload"
            )

        initials_meta = avatar_props.get("initials")
        if initials_meta:
            initials_value, initials_offset = initials_meta
            normalized_initials = normalize_sql_identifier(initials_value)
            if re.fullmatch(r"&[A-Za-z][A-Za-z0-9_$#]*\.", initials_value):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + avatar_offset + initials_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.initials must use a bare "
                    "projected varchar2 alias, not &COLUMN. substitution syntax"
                )
            elif normalized_initials not in identifiers or normalized_initials not in column_metadata:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + avatar_offset + initials_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.initials '{initials_value}' "
                    "must reference a projected Metric Card child column"
                )
            elif normalize_value(column_metadata[normalized_initials][0]) != "varchar2":
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + avatar_offset + initials_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.initials '{initials_value}' "
                    "must reference a varchar2 child column"
                )

        alignment_meta = avatar_props.get("alignment")
        position = clean_scalar_value(avatar_props.get("position", ("", 0))[0])
        if alignment_meta and position != "inline":
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + avatar_offset + alignment_meta[1])}: "
                f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.alignment is allowed only "
                "when plugin-avatar.position: inline"
            )

        style_meta = avatar_props.get("style")
        if style_meta and avatar_type == "image":
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + avatar_offset + style_meta[1])}: "
                f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-avatar.style is allowed only "
                "when plugin-avatar.type is icon or initials"
            )

        icon_meta = avatar_props.get("icon")
        if icon_meta:
            source_meta = top_level_blocks.get("source")
            sql_query_text = extract_fenced_property_body(source_meta[1], "sqlQuery") if source_meta else None
            lint_template_component_avatar_icon(
                issues=issues,
                path=path,
                text=text,
                absolute_offset=component_start + avatar_offset + icon_meta[1],
                component_label=component_label,
                property_path="plugin-avatar.icon",
                value=icon_meta[0],
                column_data_types={name: meta[0] for name, meta in column_metadata.items()},
                sql_query_text=sql_query_text,
            )

        if avatar_type == "image":
            lint_metric_card_avatar_image_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=component_start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
                avatar_offset=avatar_offset,
                avatar_block=avatar_block,
                column_metadata=column_metadata,
            )

    badge_meta = top_level_blocks.get("plugin-badge")
    if badge_meta:
        badge_offset, badge_block = badge_meta
        badge_props = {
            name: (clean_scalar_value(value), offset)
            for name, value, offset in extract_immediate_brace_property_values(badge_block)
        }
        display_badge = normalize_value(badge_props.get("displayBadge", ("", 0))[0])
        if display_badge != "true":
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + badge_offset)}: "
                f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-badge must define displayBadge: true"
            )
        for required_name in ("label", "value"):
            if required_name not in badge_props:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + badge_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-badge must define {required_name}"
                )

        label_meta = badge_props.get("label")
        if label_meta:
            label_value, label_offset = label_meta
            normalized_label = normalize_sql_identifier(label_value)
            absolute_label_offset = component_start + badge_offset + label_offset
            if re.fullmatch(r"&[A-Za-z][A-Za-z0-9_$#]*\.", label_value):
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_label_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} source-backed plugin-badge.label "
                    "must use a bare projected alias, not &COLUMN. substitution syntax"
                )
            elif re.search(r"(?is)<\s*/?\s*[A-Za-z][^>]*>|\bon[A-Za-z]+\s*=", label_value):
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_label_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-badge.label must not contain "
                    "HTML or event attributes"
                )
            elif normalized_label in identifiers:
                label_column_meta = column_metadata.get(normalized_label)
                if not label_column_meta or normalize_value(label_column_meta[0]) != "varchar2":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_label_offset)}: "
                        f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} source-backed "
                        "plugin-badge.label must reference a projected varchar2 child column"
                    )
            elif re.fullmatch(r"[A-Z][A-Z0-9_$#]*", label_value) and "_" in label_value:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_label_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} source-backed plugin-badge.label "
                    f"'{label_value}' must reference a projected Metric Card child column"
                )

        badge_icon_meta = badge_props.get("icon")
        if badge_icon_meta:
            lint_static_template_component_icon(
                issues=issues,
                path=path,
                text=text,
                absolute_offset=component_start + badge_offset + badge_icon_meta[1],
                component_label=component_label,
                property_path="plugin-badge.icon",
                value=badge_icon_meta[0],
            )

        badge_value_types = {"varchar2", "number", "date", "intervalyeartomonth", "intervaldaytosecond"}
        for selector_name in ("value", "state"):
            selector_meta = badge_props.get(selector_name)
            if not selector_meta:
                continue
            selector_value, selector_offset = selector_meta
            normalized_selector = normalize_sql_identifier(selector_value)
            if re.fullmatch(r"&[A-Za-z][A-Za-z0-9_$#]*\.", selector_value):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + badge_offset + selector_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-badge.{selector_name} must use "
                    "a bare projected alias, not &COLUMN. substitution syntax"
                )
                continue
            if normalized_selector not in identifiers or normalized_selector not in column_metadata:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + badge_offset + selector_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-badge.{selector_name} "
                    f"'{selector_value}' must reference a projected Metric Card child column"
                )
                continue
            data_type = normalize_value(column_metadata[normalized_selector][0])
            if selector_name == "value" and data_type not in badge_value_types:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + badge_offset + selector_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-badge.value column "
                    "must use varchar2, number, date, intervalYearToMonth, or intervalDayToSecond"
                )
            if selector_name == "state" and data_type != "varchar2":
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + badge_offset + selector_offset)}: "
                    f"METRIC_CARD_AVATAR_BADGE_REQUIRED_001 {component_label} plugin-badge.state column must use varchar2"
                )

        state_meta = badge_props.get("state")
        if state_meta and source_kind == "sql":
            state_column, state_offset = state_meta
            normalized_state_column = normalize_sql_identifier(state_column)
            source_meta = top_level_blocks.get("source")
            sql_query_text = extract_fenced_property_body(source_meta[1], "sqlQuery") if source_meta else None
            proven_states = (
                badge_state_values_from_sql(sql_query_text, normalized_state_column)
                if sql_query_text
                else None
            )
            if proven_states is None or not proven_states.issubset(BADGE_ALLOWED_STATE_VALUES):
                allowed_text = ", ".join(sorted(BADGE_ALLOWED_STATE_VALUES))
                found_text = ", ".join(sorted(proven_states)) if proven_states else "unproven dynamic values"
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + badge_offset + state_offset)}: "
                    f"BADGE_STATE_ALLOWLIST_REQUIRED_001 {component_label} plugin-badge.state must be proven by "
                    f"its projected SQL source to return only: {allowed_text}; found {found_text}"
                )

    grouping_meta = top_level_blocks.get("plugin-grouping")
    if grouping_meta:
        grouping_offset, grouping_block = grouping_meta
        grouping_props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(grouping_block)
        }
        if grouping_props.get("groupIcon") and not grouping_props.get("groupTitle"):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + grouping_offset + grouping_props['groupIcon'][1])}: "
                f"DSL_RULE_REQUIRED {component_label} plugin-grouping.groupIcon requires plugin-grouping.groupTitle"
            )
        group_icon_meta = grouping_props.get("groupIcon")
        if group_icon_meta:
            lint_static_template_component_icon(
                issues=issues,
                path=path,
                text=text,
                absolute_offset=component_start + grouping_offset + group_icon_meta[1],
                component_label=component_label,
                property_path="plugin-grouping.groupIcon",
                value=group_icon_meta[0],
            )

        if not grouped_columns:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + grouping_offset)}: "
                f"DSL_RULE_REQUIRED {component_label} plugin-grouping requires at least one child column with "
                "appearance.group: true"
            )

    if grouped_columns:
        order_by_meta = top_level_blocks.get("orderBy")
        grouping_offset = grouping_meta[0] if grouping_meta else 0
        if not order_by_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + grouping_offset)}: "
                f"DSL_RULE_REQUIRED {component_label} grouped Metric Card output requires top-level orderBy"
            )
        else:
            order_by_offset, order_by_block = order_by_meta
            order_props = {
                name: (clean_scalar_value(value), offset)
                for name, value, offset in extract_immediate_brace_property_values(order_by_block)
            }
            order_type = order_props.get("type", ("", 0))[0]
            clause = order_props.get("orderByClause", ("", 0))[0]
            if order_type != "staticValue" or not clause:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + order_by_offset)}: "
                    f"DSL_RULE_REQUIRED {component_label} grouped Metric Card output requires "
                    "orderBy.type: staticValue with orderBy.orderByClause"
                )
            else:
                order_terms = [
                    normalize_sql_identifier(re.split(r"\s+", term.strip(), maxsplit=1)[0])
                    for term in clause.split(",")
                    if term.strip()
                ]
                expected_groups = [normalize_sql_identifier(column) for column in grouped_columns]
                if order_terms[: len(expected_groups)] != expected_groups:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + order_by_offset)}: "
                        f"DSL_RULE_VALUE {component_label} orderBy.orderByClause must start with grouped "
                        f"columns in declaration order: {', '.join(grouped_columns)}"
                    )

    row_selection_meta = top_level_blocks.get("rowSelection")
    if row_selection_meta and not content_row_primary_key_columns(region_block):
        row_selection_offset, _row_selection_block = row_selection_meta
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + row_selection_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} rowSelection requires one child column with source.primaryKey: true"
        )

    if display_mode == "partial":
        for block_name in ("plugin-grouping", "rowSelection", "messages", "pagination"):
            block_meta = top_level_blocks.get(block_name)
            if not block_meta:
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_meta[0])}: "
                f"METRIC_CARD_PARTIAL_SCOPE_REQUIRED_001 {component_label} block '{block_name}' is report-only "
                "and must be omitted when componentAppearance.display: partial"
            )

    for action_offset, action_identifier, action_block in find_immediate_component_blocks(region_block, "action"):
        action_blocks = extract_top_level_blocks(action_block)
        behavior_meta = action_blocks.get("behavior")
        if behavior_meta:
            behavior_offset, behavior_block = behavior_meta
            behavior_props = {
                prop_name: (clean_scalar_value(prop_value), prop_offset)
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(behavior_block)
            }
            behavior_type = behavior_props.get("type", ("", 0))[0]
            target_meta = extract_property_object_block(behavior_block, "target")
            target_url = behavior_props.get("targetUrl", ("", 0))[0]
            target_url_meta = behavior_props.get("targetUrl")
            if target_url_meta:
                target_url_error = metric_card_target_url_safety_error(target_url_meta[0])
                if target_url_error:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset + target_url_meta[1])}: "
                        f"METRIC_CARD_TARGET_URL_SAFETY_REQUIRED_001 {component_label} action '{action_identifier}' "
                        f"behavior.targetUrl {target_url_error}"
                    )
            link_attributes_meta = behavior_props.get("linkAttributes")
            if link_attributes_meta:
                link_attributes_error = metric_card_link_attributes_safety_error(link_attributes_meta[0])
                if link_attributes_error:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset + link_attributes_meta[1])}: "
                        f"METRIC_CARD_LINK_ATTRIBUTES_SAFETY_REQUIRED_001 {component_label} action "
                        f"'{action_identifier}' behavior.linkAttributes {link_attributes_error}"
                    )
            if behavior_type in {"redirectThisApp", "redirectOtherApp"} and not target_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset)}: "
                    f"DSL_RULE_REQUIRED {component_label} action '{action_identifier}' behavior.type: "
                    f"{behavior_type} requires behavior.target"
                )
            if behavior_type == "redirectUrl" and not target_url:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset)}: "
                    f"DSL_RULE_REQUIRED {component_label} action '{action_identifier}' behavior.type: redirectUrl "
                    "requires behavior.targetUrl"
                )
            if behavior_type == "triggerAction" and (target_meta or target_url):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset)}: "
                    f"DSL_RULE_VALUE {component_label} action '{action_identifier}' behavior.type: triggerAction "
                    "must omit behavior.target and behavior.targetUrl"
                )
            if behavior_type in {"redirectThisApp", "redirectOtherApp"} and target_url:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset)}: "
                    f"DSL_RULE_VALUE {component_label} action '{action_identifier}' behavior.type: {behavior_type} "
                    "must omit behavior.targetUrl"
                )
            if behavior_type == "redirectUrl" and target_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset)}: "
                    f"DSL_RULE_VALUE {component_label} action '{action_identifier}' behavior.type: redirectUrl "
                    "must omit behavior.target"
                )
        for token, token_offset in action_target_item_substitutions(action_block):
            if not identifiers or normalize_sql_identifier(token) in identifiers:
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + action_offset + token_offset)}: "
                f"DSL_RULE_VALUE {component_label} action '{action_identifier}' behavior.target.items references "
                f"source column '&{token}.' that is not projected by the Metric Card source"
            )


def content_row_primary_key_columns(region_block: str) -> set[str]:
    """Return Content Row child columns marked as source.primaryKey."""
    primary_keys: set[str] = set()
    for _column_offset, column_identifier, column_block in find_immediate_component_blocks(region_block, "column"):
        source_meta = extract_top_level_blocks(column_block).get("source")
        if not source_meta:
            continue
        _source_offset, source_block = source_meta
        source_props = {
            prop_name: (prop_value, prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
        }
        primary_key_meta = source_props.get("primaryKey")
        if not primary_key_meta or clean_scalar_value(primary_key_meta[0]).lower() != "true":
            continue
        database_column_meta = source_props.get("databaseColumn")
        primary_keys.add(clean_scalar_value(database_column_meta[0] if database_column_meta else column_identifier).upper())
    return primary_keys


def page_item_types(page_block: str) -> dict[str, str]:
    """Return page item names mapped to their declared types."""
    items: dict[str, str] = {}
    for _item_offset, item_name, item_block in find_immediate_component_blocks(page_block, "pageItem"):
        items[item_name.upper()] = (extract_item_type(item_block) or "").lower()
    return items


def has_hidden_page_item(item_types: dict[str, str], item_name: str) -> bool:
    """Return whether a same-page context item exists as a hidden item."""
    return item_types.get(item_name.upper()) == "hidden"


def item_suffix_matches_pk(item_name: str, pk_columns: set[str]) -> str | None:
    """Return the matching PK column when a Pn_* item suffix matches a PK name."""
    suffix = re.sub(r"^P\d+_", "", item_name.upper())
    for pk_column in pk_columns:
        if normalize_sql_identifier(suffix) == normalize_sql_identifier(pk_column):
            return pk_column
    return None


def layout_block_props(region_block: str) -> tuple[int, dict[str, tuple[str, int]]]:
    """Return a region layout offset and properties."""
    layout_meta = extract_top_level_blocks(region_block).get("layout")
    if not layout_meta:
        return 0, {}
    layout_offset, layout_block = layout_meta
    return layout_offset, layout_properties(layout_block)


def page_template_value(page_block: str) -> str:
    """Return the page template reference from the page appearance block."""
    appearance_meta = extract_top_level_blocks(page_block).get("appearance")
    if not appearance_meta:
        return ""
    _appearance_offset, appearance_block = appearance_meta
    appearance_props = {
        prop_name: clean_scalar_value(prop_value)
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(appearance_block)
    }
    return appearance_props.get("pageTemplate", "")


def region_appearance_template(region_block: str) -> tuple[str, int]:
    """Return the region appearance template reference and relative offset."""
    appearance_meta = extract_top_level_blocks(region_block).get("appearance")
    if not appearance_meta:
        return "", 0
    appearance_offset, appearance_block = appearance_meta
    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(appearance_block):
        if prop_name == "template":
            return clean_scalar_value(prop_value), appearance_offset + prop_offset
    return "", appearance_offset


def action_sets_context_item(action_block: str, context_item: str, pk_column: str) -> bool:
    """Return whether a Content Row action sets the same-page context item from a PK substitution."""
    if not re.search(r"(?m)^\s*position\s*:\s*fullRowLink\s*$", action_block):
        return False
    if re.search(r"(?m)^\s*type\s*:\s*redirectUrl\s*$", action_block) or re.search(r"(?m)^\s*targetUrl\s*:", action_block):
        return False
    item_pattern = rf"\b{re.escape(context_item)}\s*:"
    substitution_pattern = rf"&{re.escape(pk_column)}\."
    return bool(re.search(item_pattern, action_block, re.IGNORECASE) and re.search(substitution_pattern, action_block, re.IGNORECASE))


def content_row_redirect_url_full_row_actions(region_block: str) -> list[str]:
    """Return full-row Content Row actions that use URL redirects instead of declarative/dynamic behavior."""
    actions: list[str] = []
    for _action_offset, action_name, action_block in find_immediate_component_blocks(region_block, "action"):
        if not re.search(r"(?m)^\s*position\s*:\s*fullRowLink\s*$", action_block):
            continue
        if re.search(r"(?m)^\s*type\s*:\s*redirectUrl\s*$", action_block) or re.search(r"(?m)^\s*targetUrl\s*:", action_block):
            actions.append(action_name)
    return actions


def content_row_has_context_action(region_block: str, context_item: str, pk_column: str) -> bool:
    """Return whether a Content Row has the required master-detail full-row action."""
    for _action_offset, _action_name, action_block in find_immediate_component_blocks(region_block, "action"):
        if action_sets_context_item(action_block, context_item, pk_column):
            return True
    return False


def same_page_master_detail_pairs(
    path: Path,
    text: str,
) -> list[dict[str, object]]:
    """Infer explicit Content Row master-detail pairs from PK columns and same-page child binds."""
    pairs: list[dict[str, object]] = []
    child_region_types = {"classicReport", "interactiveReport", "interactiveGrid", "contentRow", "map"}

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        page_number = page_number_from_context(path, page_name, page_block)
        masters: list[dict[str, object]] = []
        children: list[dict[str, object]] = []
        item_types = page_item_types(page_block)

        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block) or ""
            region_type_key = region_schema_key(region_type)
            top_level_blocks = extract_top_level_blocks(region_block)
            layout_offset, layout_props = layout_block_props(region_block)
            region_data: dict[str, object] = {
                "page_start": page_start,
                "page_name": page_name,
                "page_block": page_block,
                "page_number": page_number,
                "item_types": item_types,
                "region_start": page_start + region_offset,
                "region_name": region_name,
                "region_block": region_block,
                "region_type": region_type,
                "region_type_key": region_type_key,
                "top_level_blocks": top_level_blocks,
                "layout_offset": page_start + region_offset + layout_offset,
                "layout_props": layout_props,
            }
            if region_type_key == "contentRow":
                pk_columns = content_row_primary_key_columns(region_block)
                if pk_columns:
                    region_data["pk_columns"] = pk_columns
                    masters.append(region_data)
                continue
            if region_type_key in child_region_types:
                sql_query = source_sql_query(top_level_blocks)
                binds = sql_page_item_binds(sql_query, page_number)
                if region_type_key == "map":
                    binds.update(map_layer_sql_binds(region_block, page_number))
                if binds:
                    region_data["sql_query"] = sql_query
                    region_data["binds"] = binds
                    children.append(region_data)

        for master in masters:
            pk_columns = master.get("pk_columns")
            if not isinstance(pk_columns, set):
                continue
            for child in children:
                binds = child.get("binds")
                if not isinstance(binds, set):
                    continue
                for bind_item in sorted(binds):
                    pk_column = item_suffix_matches_pk(bind_item, pk_columns)
                    if not pk_column:
                        continue
                    pairs.append(
                        {
                            **master,
                            "child_region_start": child["region_start"],
                            "child_region_name": child["region_name"],
                            "child_region_block": child["region_block"],
                            "child_region_type": child["region_type"],
                            "child_region_type_key": child["region_type_key"],
                            "child_top_level_blocks": child["top_level_blocks"],
                            "child_layout_offset": child["layout_offset"],
                            "child_layout_props": child["layout_props"],
                            "context_item": bind_item,
                            "pk_column": pk_column,
                        }
                    )
    return pairs


def lint_content_row_settings_and_selection_contracts(
    path: Path,
    text: str,
    validation_context: dict[str, Any] | None = None,
) -> list[str]:
    """Validate Content Row display substitutions and native selection item wiring."""
    issues: list[str] = []

    for page_start, _page_name, page_block in find_component_blocks(text, "page"):
        items = page_item_types(page_block)
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block) or ""
            if region_schema_key(region_type) != "contentRow":
                continue
            component_label = f"region '{region_name}' type '{region_type}'"
            component_start = page_start + region_offset
            top_level_blocks = extract_top_level_blocks(region_block)
            identifiers = content_row_projection_identifiers(top_level_blocks, region_block, validation_context)

            settings_meta = top_level_blocks.get("settings")
            if settings_meta:
                settings_offset, settings_block = settings_meta
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block):
                    if prop_name not in {"overline", "title", "description", "miscellaneous"}:
                        continue
                    value = clean_scalar_value(prop_value)
                    if re.fullmatch(r"[A-Za-z][A-Za-z0-9_$#]*", value) and normalize_sql_identifier(value) in identifiers:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + settings_offset + prop_offset)}: "
                            f"CONTENT_ROW_SETTINGS_SUBSTITUTION_REQUIRED_001 {component_label} settings.{prop_name} "
                            f"references source column '{value}' and must use '&{value.upper()}.' substitution syntax"
                        )

            layout_offset, layout_props = layout_block_props(region_block)
            slot = clean_scalar_value(layout_props.get("slot", ("", 0))[0]).lower()
            span = parse_int(layout_props.get("columnSpan", ("", 0))[0] or None)
            narrow_parent = slot == "leftcolumn" or (span is not None and span <= 4)
            visible_button_actions: list[tuple[str, int]] = []
            if narrow_parent:
                for action_offset, action_name, action_block in find_immediate_component_blocks(region_block, "action"):
                    action_props = {
                        prop_name: clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in extract_immediate_property_values(action_block)
                    }
                    if action_props.get("position") == "primaryActions" and action_props.get("template") == "button":
                        visible_button_actions.append((action_name, action_offset))
                if len(visible_button_actions) > 1:
                    first_action_name, first_action_offset = visible_button_actions[0]
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + first_action_offset)}: "
                        f"CONTENT_ROW_ACTION_MENU_REQUIRED_001 {component_label} is a narrow master/list region with "
                        f"{len(visible_button_actions)} primary action buttons; use one primaryActions action with "
                        f"template: menu instead of separate crowded buttons starting at '{first_action_name}'"
                    )

            row_selection_meta = top_level_blocks.get("rowSelection")
            if not row_selection_meta:
                continue
            row_selection_offset, row_selection_block = row_selection_meta
            row_props = {
                prop_name: (clean_scalar_value(prop_value), prop_offset)
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(row_selection_block)
            }
            selection_type = row_props.get("type", ("", 0))[0]
            primary_keys = content_row_primary_key_columns(region_block)
            current_item = row_props.get("currentSelectionPageItem", ("", 0))[0].upper()
            select_all_item = row_props.get("selectAllPageItem", ("", 0))[0].upper()

            if not primary_keys:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + row_selection_offset)}: "
                    f"CONTENT_ROW_SELECTION_ITEMS_REQUIRED_001 {component_label} rowSelection requires one child column "
                    "with source.primaryKey: true"
                )
            if selection_type == "focusOnly" and (current_item or select_all_item):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + row_selection_offset)}: "
                    f"CONTENT_ROW_SELECTION_ITEMS_REQUIRED_001 {component_label} rowSelection focusOnly must not emit "
                    "currentSelectionPageItem or selectAllPageItem"
                )
            if selection_type in {"singleSelection", "multipleSelection"}:
                if not current_item or not has_hidden_page_item(items, current_item):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + row_selection_offset + row_props.get('currentSelectionPageItem', ('', 0))[1])}: "
                        f"CONTENT_ROW_SELECTION_ITEMS_REQUIRED_001 {component_label} rowSelection {selection_type} "
                        "requires currentSelectionPageItem backed by a same-page hidden page item"
                    )
            if selection_type == "multipleSelection":
                if not select_all_item or items.get(select_all_item) not in {"checkbox", "switch"}:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + row_selection_offset + row_props.get('selectAllPageItem', ('', 0))[1])}: "
                        f"CONTENT_ROW_SELECTION_ITEMS_REQUIRED_001 {component_label} rowSelection multipleSelection "
                        "requires selectAllPageItem backed by a same-page checkbox or switch item"
                    )

    return issues


def lint_media_list_contract(
    path: Path,
    text: str,
    schema: dict[str, Any],
    validation_context: dict[str, Any] | None = None,
) -> list[str]:
    """Validate Media List against the active compiler-backed capability schema."""
    issues: list[str] = []
    media_list_schema = schema.get("components", {}).get("region", {}).get("mediaList", {})
    if not isinstance(media_list_schema, dict):
        media_list_schema = {}
    media_list_allowed_blocks = set(media_list_schema.get("allowedBlocks", []))
    column_schema = media_list_schema.get("column", {})
    if not isinstance(column_schema, dict):
        column_schema = {}
    column_allowed_properties = set(column_schema.get("allowedProperties", []))
    column_source_schema = column_schema.get("source", {})
    if not isinstance(column_source_schema, dict):
        column_source_schema = {}
    column_source_allowed_properties = set(column_source_schema.get("allowedProperties", []))
    named_column_shape = "databaseColumn" in column_source_allowed_properties
    generic_column_shape = "columnName" in column_allowed_properties

    avatar_schema = media_list_schema.get("plugin-avatar", {})
    if not isinstance(avatar_schema, dict):
        avatar_schema = {}
    avatar_allowed_properties = set(avatar_schema.get("allowedProperties", []))
    badge_schema = media_list_schema.get("plugin-badge", {})
    if not isinstance(badge_schema, dict):
        badge_schema = {}
    badge_allowed_properties = set(badge_schema.get("allowedProperties", []))
    grouping_schema = media_list_schema.get("plugin-grouping", {})
    grouping_supported = (
        "plugin-grouping" in media_list_allowed_blocks
        and isinstance(grouping_schema, dict)
        and bool(grouping_schema.get("allowedProperties", []))
    )
    grouping_allowed_properties = set(grouping_schema.get("allowedProperties", [])) if grouping_supported else set()
    declared_page_items = set((validation_context or {}).get("page_items", set())) | {
        normalize_sql_identifier(item_name)
        for _item_offset, item_name, _item_block in find_component_blocks(text, "pageItem")
    }

    def partial_page_item_selector(value: str) -> str:
        if re.fullmatch(r"P\d+_[A-Za-z0-9_$#]+", value, re.IGNORECASE):
            return normalize_sql_identifier(value)
        return ""

    def region_reference_keys(region_name: str, region_block: str) -> set[str]:
        keys = {normalize_sql_identifier(region_name), normalize_sql_identifier(region_name).lstrip("@")}
        advanced_meta = extract_top_level_blocks(region_block).get("advanced")
        if advanced_meta:
            _advanced_offset, advanced_block = advanced_meta
            advanced_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(advanced_block)
            }
            if advanced_props.get("staticId"):
                keys.add(normalize_sql_identifier(advanced_props["staticId"]).lstrip("@"))
        return {key for key in keys if key}

    def placement_issues(page_start: int, page_block: str, region_offset: int, region_name: str, region_block: str) -> list[str]:
        layout_meta = extract_top_level_blocks(region_block).get("layout")
        if not layout_meta:
            return []
        layout_offset, layout_block = layout_meta
        layout_props = layout_properties(layout_block)
        slot, slot_offset = layout_props.get("slot", ("", 0))
        slot = clean_scalar_value(slot)
        parent_region, parent_offset = layout_props.get("parentRegion", ("", 0))
        parent_region = clean_scalar_value(parent_region).lstrip("@")
        component_start = page_start + region_offset
        label = f"Media List region '{region_name}'"
        local_issues: list[str] = []
        if not parent_region:
            if slot.lower() != "body":
                local_issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + layout_offset + slot_offset)}: "
                    f"MEDIA_LIST_PLACEMENT_CONTRACT_REQUIRED_001 {label} top-level placement must use layout.slot: body"
                )
            return local_issues

        parent_regions = [
            (candidate_name, candidate_block)
            for _candidate_offset, candidate_name, candidate_block in find_immediate_component_blocks(page_block, "region")
            if normalize_sql_identifier(parent_region) in region_reference_keys(candidate_name, candidate_block)
        ]
        if len(parent_regions) != 1 or normalize_sql_identifier(parent_region) in region_reference_keys(region_name, region_block):
            reason = "ambiguous or unresolved" if len(parent_regions) != 1 else "must not reference itself"
            local_issues.append(
                f"{display_path(path)}:{line_no(text, component_start + layout_offset + parent_offset)}: "
                f"MEDIA_LIST_PARENT_REGION_REQUIRED_001 {label} parentRegion '{parent_region}' is {reason}; "
                "resolve one existing parent region by static ID or normalized reference"
            )
            return local_issues

        parent_name, parent_block = parent_regions[0]
        parent_template, parent_template_offset = region_appearance_template(parent_block)
        parent_template = clean_scalar_value(parent_template).lower()
        if parent_template not in {"@/standard", "@/content-block"}:
            local_issues.append(
                f"{display_path(path)}:{line_no(text, component_start + layout_offset + parent_offset)}: "
                f"MEDIA_LIST_PARENT_REGION_REQUIRED_001 {label} parent '{parent_name}' must have verified "
                "appearance.template @/standard or @/content-block"
            )
            return local_issues
        if slot not in {"regionBody", "subRegions"}:
            local_issues.append(
                f"{display_path(path)}:{line_no(text, component_start + layout_offset + slot_offset)}: "
                f"MEDIA_LIST_PARENT_SLOT_UNSUPPORTED_001 {label} slot '{slot}' is not supported by parent "
                f"template {parent_template}; use regionBody by default or explicitly supported subRegions"
            )
        return local_issues

    for page_start, _page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block) or ""
            if region_schema_key(region_type) != "mediaList":
                continue

            component_start = page_start + region_offset
            component_label = f"Media List region '{region_name}'"
            top_level_blocks = extract_top_level_blocks(region_block)
            display = template_component_display_mode(top_level_blocks)
            columns: dict[str, tuple[str, int]] = {}
            issues.extend(placement_issues(page_start, page_block, region_offset, region_name, region_block))

            for column_offset, column_identifier, column_block in find_region_column_blocks("mediaList", region_block):
                direct_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_property_values(column_block)
                }
                column_name, column_name_offset = direct_props.get("columnName", ("", 0))
                source_meta = extract_top_level_blocks(column_block).get("source")
                source_offset = 0
                source_props: dict[str, tuple[str, int]] = {}
                if source_meta:
                    source_offset, source_block = source_meta
                    source_props = {
                        prop_name: (clean_scalar_value(prop_value), prop_offset)
                        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                    }

                resolved_alias = ""
                if named_column_shape and not generic_column_shape:
                    resolved_alias = column_identifier
                    if not column_identifier:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + column_offset)}: "
                            f"MEDIA_LIST_COLUMN_SHAPE_REQUIRED_001 {component_label} active compiler contract requires "
                            "named column blocks"
                        )
                    if column_identifier and not re.fullmatch(r"[A-Z][A-Z0-9_$#]*", column_identifier):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + column_offset)}: "
                            f"MEDIA_LIST_COLUMN_SHAPE_REQUIRED_001 {component_label} column identifier '{column_identifier}' "
                            "must be an uppercase projected alias"
                        )
                    for forbidden_prop in ("columnName", "show"):
                        if forbidden_prop in direct_props:
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + column_offset + direct_props[forbidden_prop][1])}: "
                                f"MEDIA_LIST_COLUMN_SHAPE_REQUIRED_001 {component_label} active named-column contract "
                                f"must not emit {forbidden_prop}"
                            )
                    database_column, database_column_offset = source_props.get("databaseColumn", ("", 0))
                    if normalize_sql_identifier(database_column) != normalize_sql_identifier(column_identifier):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + column_offset + source_offset + database_column_offset)}: "
                            f"MEDIA_LIST_COLUMN_SHAPE_REQUIRED_001 {component_label} column '{column_identifier}' must map "
                            "source.databaseColumn to the same projected alias required by the active contract"
                        )
                elif generic_column_shape and not named_column_shape:
                    resolved_alias = column_name
                    if column_identifier:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + column_offset)}: "
                            f"MEDIA_LIST_COLUMN_SHAPE_REQUIRED_001 {component_label} active compiler contract requires "
                            "unnamed column blocks"
                        )
                    if column_name and not re.fullmatch(r"[A-Z][A-Z0-9_$#]*", column_name):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + column_offset + column_name_offset)}: "
                            f"MEDIA_LIST_COLUMN_SHAPE_REQUIRED_001 {component_label} columnName '{column_name}' must be "
                            "an uppercase projected alias"
                        )
                else:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + column_offset)}: "
                        f"MEDIA_LIST_CAPABILITY_CONTRACT_REQUIRED_001 {component_label} active compiler contract does "
                        "not resolve exactly one supported report-column shape"
                    )

                if source_meta and resolved_alias:
                    data_type, data_type_offset = source_props.get("dataType", ("", 0))
                    columns[normalize_sql_identifier(resolved_alias)] = (
                        data_type,
                        column_offset + source_offset + data_type_offset,
                    )

            settings_meta = top_level_blocks.get("settings")
            settings: dict[str, tuple[str, int]] = {}
            if settings_meta:
                settings_offset, settings_block = settings_meta
                settings = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
                }
            else:
                settings_offset = 0

            if display == "report":
                source_meta = top_level_blocks.get("source")
                if not source_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start)}: "
                        f"MEDIA_LIST_DISPLAY_MODE_REQUIRED_001 {component_label} report mode requires a verified source"
                    )
                else:
                    source_offset, source_block = source_meta
                    source_props = {
                        prop_name: (clean_scalar_value(prop_value), prop_offset)
                        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                    }
                    source_location = source_props.get("location", ("", 0))[0]
                    source_type = source_props.get("type", ("", 0))[0]
                    if source_location != "localDatabase" or source_type != "sqlQuery" or not extract_fenced_property_body(source_block, "sqlQuery"):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + source_offset)}: "
                            f"MEDIA_LIST_SOURCE_CAPABILITY_REQUIRED_001 {component_label} report source must use "
                            "location: localDatabase, type: sqlQuery, and a non-empty source.sqlQuery; unsupported "
                            "REST, JSON, graph, function-body, and sample-data adapters require Missing Inputs"
                        )
                for prop_name in ("title", "description"):
                    if prop_name not in settings:
                        continue
                    value, prop_offset = settings[prop_name]
                    normalized = normalize_sql_identifier(value)
                    if not re.fullmatch(r"[A-Z][A-Z0-9_$#]*", value) or normalized not in columns:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + settings_offset + prop_offset)}: "
                            f"MEDIA_LIST_MAPPING_REQUIRED_001 {component_label} settings.{prop_name} must use a bare "
                            "uppercase projected Media List column alias"
                        )
                    elif columns[normalized][0].lower() != "varchar2":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + settings_offset + prop_offset)}: "
                            f"MEDIA_LIST_MAPPING_REQUIRED_001 {component_label} settings.{prop_name} must map to varchar2"
                        )
            elif display == "partial":
                for forbidden_block in ("source", "orderBy", "plugin-grouping"):
                    if forbidden_block in top_level_blocks:
                        block_offset, _block_text = top_level_blocks[forbidden_block]
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + block_offset)}: "
                            f"MEDIA_LIST_DISPLAY_MODE_REQUIRED_001 {component_label} partial mode must not define "
                            f"report-only block '{forbidden_block}'"
                        )
                if columns:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start)}: "
                        f"MEDIA_LIST_DISPLAY_MODE_REQUIRED_001 {component_label} partial mode must not define report columns"
                    )
                for prop_name in ("applyThemeColors", "layout", "size"):
                    if prop_name in settings:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + settings_offset + settings[prop_name][1])}: "
                            f"MEDIA_LIST_DISPLAY_MODE_REQUIRED_001 {component_label} partial mode must not define "
                            f"report-only settings.{prop_name}"
                        )
                for prop_name in ("title", "description"):
                    if prop_name not in settings:
                        continue
                    value, prop_offset = settings[prop_name]
                    selector = partial_page_item_selector(value)
                    if selector and selector not in declared_page_items:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + settings_offset + prop_offset)}: "
                            f"MEDIA_LIST_PARTIAL_BINDING_REQUIRED_001 {component_label} settings.{prop_name} "
                            f"references undeclared session-state item '{value}'"
                        )

            avatar_meta = top_level_blocks.get("plugin-avatar")
            badge_meta = top_level_blocks.get("plugin-badge")
            display_avatar = settings.get("displayAvatar", ("false", 0))[0].lower() == "true"
            display_badge = settings.get("displayBadge", ("false", 0))[0].lower() == "true"
            if display_avatar != bool(avatar_meta):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start)}: "
                    f"MEDIA_LIST_AVATAR_BADGE_CONTRACT_REQUIRED_001 {component_label} settings.displayAvatar: true "
                    "and plugin-avatar must be emitted together"
                )
            if display_badge != bool(badge_meta):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start)}: "
                    f"MEDIA_LIST_AVATAR_BADGE_CONTRACT_REQUIRED_001 {component_label} settings.displayBadge: true "
                    "and plugin-badge must be emitted together"
                )

            source_meta = top_level_blocks.get("source")
            sql_query_text = extract_fenced_property_body(source_meta[1], "sqlQuery") if source_meta else None
            if avatar_meta:
                avatar_offset, avatar_block = avatar_meta
                avatar_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(avatar_block)
                }
                if "size" in avatar_props and "size" not in avatar_allowed_properties:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + avatar_offset + avatar_props['size'][1])}: "
                        f"MEDIA_LIST_CAPABILITY_UNSUPPORTED_001 {component_label} plugin-avatar.size is not exposed "
                        "by the active Media List compiler contract"
                    )
                avatar_type = avatar_props.get("type", ("", 0))[0]
                payloads = {name for name in ("initials", "icon", "image") if name in avatar_props or find_property_object_blocks(avatar_block, name)}
                expected_payload = avatar_type if avatar_type in {"initials", "icon", "image"} else ""
                if payloads != ({expected_payload} if expected_payload else set()):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
                        f"AVATAR_TYPE_PAYLOAD_REQUIRED_001 {component_label} plugin-avatar must emit exactly the "
                        "payload selected by its type"
                    )
                if avatar_type == "initials" and "initials" in avatar_props:
                    value, prop_offset = avatar_props["initials"]
                    normalized = normalize_sql_identifier(value)
                    if display == "report" and (normalized not in columns or columns[normalized][0].lower() != "varchar2"):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + avatar_offset + prop_offset)}: "
                            f"AVATAR_INITIALS_COLUMN_REFERENCE_REQUIRED_001 {component_label} plugin-avatar.initials "
                            "must map to a projected varchar2 column"
                        )
                    if display == "partial":
                        selector = partial_page_item_selector(value)
                        if selector and selector not in declared_page_items:
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + avatar_offset + prop_offset)}: "
                                f"MEDIA_LIST_PARTIAL_BINDING_REQUIRED_001 {component_label} plugin-avatar.initials "
                                f"references undeclared session-state item '{value}'"
                            )
                if avatar_type == "icon" and "icon" in avatar_props:
                    value, prop_offset = avatar_props["icon"]
                    if classify_fa_icon_value(value) != "valid":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + avatar_offset + prop_offset)}: "
                            f"AVATAR_ICON_ALLOWLIST_REQUIRED_001 {component_label} plugin-avatar.icon must be one "
                            "static allowlisted Font APEX icon"
                        )
                if avatar_type == "image":
                    image_blocks = find_property_object_blocks(avatar_block, "image")
                    image_block = image_blocks[0][1] if len(image_blocks) == 1 else ""
                    image_type_meta = extract_property_value_at_brace_depth(image_block, "type", brace_depth=1) if image_block else None
                    url_column_meta = extract_property_value_at_brace_depth(image_block, "urlColumn", brace_depth=1) if image_block else None
                    image_type = clean_scalar_value(image_type_meta[0]) if image_type_meta else ""
                    url_column = clean_scalar_value(url_column_meta[0]) if url_column_meta else ""
                    normalized_url_column = normalize_sql_identifier(url_column)
                    report_image_invalid = display == "report" and (
                        normalized_url_column not in columns or columns[normalized_url_column][0].lower() != "varchar2"
                    )
                    partial_selector = partial_page_item_selector(url_column) if display == "partial" else ""
                    partial_image_invalid = bool(partial_selector and partial_selector not in declared_page_items)
                    if image_type != "urlColumn" or not url_column or report_image_invalid or partial_image_invalid:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
                            f"AVATAR_IMAGE_URL_COLUMN_REQUIRED_001 {component_label} plugin-avatar.image must use "
                            "type: urlColumn mapped to a projected varchar2 column"
                        )
                    elif sql_query_text:
                        expressions = sql_projection_expressions(sql_query_text, url_column)
                        if not expressions or any(not avatar_url_expression_is_safe(expression) for expression in expressions):
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
                                f"AVATAR_IMAGE_URL_SAFETY_REQUIRED_001 {component_label} Avatar URL SQL must use "
                                "only :APP_FILES or :APEX_FILES plus a static relative path"
                            )
                comment_text = avatar_comment_text(region_block)
                description_meta = avatar_props.get("description")
                if not description_meta and not avatar_comment_has_marker(comment_text, "AVATAR_PURPOSE_DECORATIVE"):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
                        f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} meaningful Avatar requires "
                        "a description or the AVATAR_PURPOSE_DECORATIVE marker"
                    )
                if description_meta:
                    description, prop_offset = description_meta
                    substitution = AMP_SUBSTITUTION_TOKEN_PATTERN.fullmatch(description)
                    if substitution and display == "report":
                        normalized = normalize_sql_identifier(substitution.group(1))
                        if normalized not in columns or columns[normalized][0].lower() != "varchar2":
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + avatar_offset + prop_offset)}: "
                                f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} dynamic Avatar "
                                "description must map to a projected varchar2 column"
                            )
                    elif substitution and display == "partial":
                        selector = partial_page_item_selector(substitution.group(1))
                        if selector and selector not in declared_page_items:
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + avatar_offset + prop_offset)}: "
                                f"MEDIA_LIST_PARTIAL_BINDING_REQUIRED_001 {component_label} plugin-avatar.description "
                                f"references undeclared session-state item '{substitution.group(1)}'"
                            )

            if badge_meta:
                badge_offset, badge_block = badge_meta
                badge_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(badge_block)
                }
                if "size" in badge_props and "size" not in badge_allowed_properties:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + badge_offset + badge_props['size'][1])}: "
                        f"MEDIA_LIST_CAPABILITY_UNSUPPORTED_001 {component_label} plugin-badge.size is not exposed "
                        "by the active Media List compiler contract"
                    )
                label, label_offset = badge_props.get("label", ("", 0))
                if not label or AMP_SUBSTITUTION_TOKEN_PATTERN.search(label) or re.search(r"[<>]", label):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + badge_offset + label_offset)}: "
                        f"BADGE_LABEL_STATIC_REQUIRED_001 {component_label} plugin-badge.label must be static plain text"
                    )
                for prop_name in ("value", "state"):
                    if prop_name not in badge_props:
                        continue
                    value, prop_offset = badge_props[prop_name]
                    normalized = normalize_sql_identifier(value)
                    data_type = columns.get(normalized, ("", 0))[0].lower()
                    allowed_types = BADGE_ALLOWED_VALUE_DATA_TYPES if prop_name == "value" else {"varchar2"}
                    if display == "report" and (not re.fullmatch(r"[A-Z][A-Z0-9_$#]*", value) or data_type not in allowed_types):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + badge_offset + prop_offset)}: "
                            f"{'BADGE_VALUE_DATATYPE_REQUIRED_001' if prop_name == 'value' else 'BADGE_STATE_DATATYPE_REQUIRED_001'} "
                            f"{component_label} plugin-badge.{prop_name} "
                            "must map to a compatible projected column"
                        )
                    if display == "partial":
                        selector = partial_page_item_selector(value)
                        if prop_name == "value" and selector and selector not in declared_page_items:
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + badge_offset + prop_offset)}: "
                                f"MEDIA_LIST_PARTIAL_BINDING_REQUIRED_001 {component_label} plugin-badge.value "
                                f"references undeclared session-state item '{value}'"
                            )
                        if prop_name == "state" and value.lower() not in BADGE_ALLOWED_STATE_VALUES:
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + badge_offset + prop_offset)}: "
                                f"BADGE_STATE_ALLOWLIST_REQUIRED_001 {component_label} partial-mode Badge state "
                                "must be a proven static danger, warning, success, or info value"
                            )
                    if prop_name == "state" and sql_query_text and normalized in columns:
                        states = badge_state_values_from_sql(sql_query_text, normalized)
                        if states is None or not states.issubset(BADGE_ALLOWED_STATE_VALUES):
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + badge_offset + prop_offset)}: "
                                f"BADGE_STATE_ALLOWLIST_REQUIRED_001 {component_label} Badge state SQL must prove only "
                                "danger, warning, success, or info"
                            )
                if "icon" in badge_props and classify_fa_icon_value(badge_props["icon"][0]) != "valid":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + badge_offset + badge_props['icon'][1])}: "
                        f"FA_ICON_REQUIRED_001 {component_label} plugin-badge.icon must be one static "
                        "allowlisted Font APEX icon"
                    )

            grouping_meta = top_level_blocks.get("plugin-grouping")
            if grouping_meta:
                grouping_offset, grouping_block = grouping_meta
                if not grouping_supported:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + grouping_offset)}: "
                        f"MEDIA_LIST_CAPABILITY_UNSUPPORTED_001 {component_label} plugin-grouping is not exposed by "
                        "the active Media List compiler contract"
                    )
                else:
                    grouping_props = {
                        prop_name: (clean_scalar_value(prop_value), prop_offset)
                        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(grouping_block)
                    }
                    title_property = next(
                        (prop_name for prop_name in ("groupTitle", "title") if prop_name in grouping_allowed_properties),
                        "",
                    )
                    icon_property = next(
                        (prop_name for prop_name in ("groupIcon", "icon") if prop_name in grouping_allowed_properties),
                        "",
                    )
                    group_title, title_offset = grouping_props.get(title_property, ("", 0)) if title_property else ("", 0)
                    substitution = AMP_SUBSTITUTION_TOKEN_PATTERN.fullmatch(group_title)
                    if substitution:
                        normalized_group = normalize_sql_identifier(substitution.group(1))
                        if normalized_group not in columns or columns[normalized_group][0].lower() != "varchar2":
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + grouping_offset + title_offset)}: "
                                f"MEDIA_LIST_GROUPING_REQUIRED_001 {component_label} dynamic {title_property} must map "
                                "to a projected varchar2 column"
                            )
                        order_meta = top_level_blocks.get("orderBy")
                        if order_meta:
                            order_props = {
                                prop_name: clean_scalar_value(prop_value)
                                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(order_meta[1])
                            }
                            clause = order_props.get("orderByClause", "")
                            terms = split_sql_top_level(clause, ",") if clause else []
                            first_identifier = normalized_order_by_term_identifier(terms[0]) if terms else None
                            if first_identifier != normalized_group:
                                issues.append(
                                    f"{display_path(path)}:{line_no(text, component_start + order_meta[0])}: "
                                    f"MEDIA_LIST_GROUPING_REQUIRED_001 {component_label} ordering must start with the "
                                    "dynamic group-title alias so groups remain contiguous"
                                )
                    if icon_property and icon_property in grouping_props and classify_fa_icon_value(grouping_props[icon_property][0]) != "valid":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + grouping_offset + grouping_props[icon_property][1])}: "
                            f"MEDIA_LIST_GROUPING_REQUIRED_001 {component_label} {icon_property} must be one static "
                            "allowlisted Font APEX icon"
                        )

            actions = find_immediate_component_blocks(region_block, "action")
            if len(actions) > 1:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + actions[1][0])}: "
                    f"MEDIA_LIST_ACTION_CARDINALITY_REQUIRED_001 {component_label} supports at most one link action"
                )
            for action_offset, action_name, action_block in actions:
                behavior_meta = extract_top_level_blocks(action_block).get("behavior")
                if behavior_meta:
                    behavior_offset, behavior_block = behavior_meta
                    behavior_props = {
                        prop_name: (clean_scalar_value(prop_value), prop_offset)
                        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(behavior_block)
                    }
                    for forbidden_prop in ("targetUrl", "linkAttributes"):
                        if forbidden_prop in behavior_props:
                            issues.append(
                                f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset + behavior_props[forbidden_prop][1])}: "
                                f"MEDIA_LIST_TARGET_URL_ALLOWLIST_REQUIRED_001 {component_label} action '{action_name}' "
                                f"must not define behavior.{forbidden_prop}"
                            )
                    behavior_type = behavior_props.get("type", ("", 0))[0]
                    has_target = bool(find_property_object_blocks(behavior_block, "target"))
                    if behavior_type == "triggerAction":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset)}: "
                            f"MEDIA_LIST_TRIGGER_ACTION_OWNER_REQUIRED_001 {component_label} action '{action_name}' "
                            "cannot use triggerAction until an owning dynamic action is proven"
                        )
                    elif behavior_type == "redirectThisApp" and not has_target:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + action_offset + behavior_offset)}: "
                            f"MEDIA_LIST_ACTION_BEHAVIOR_REQUIRED_001 {component_label} action '{action_name}' must "
                            "pair redirectThisApp with a structured target"
                        )
                for source_column, substitution_offset in action_target_item_substitutions(action_block):
                    if normalize_sql_identifier(source_column) not in columns:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + action_offset + substitution_offset)}: "
                            f"MEDIA_LIST_MAPPING_REQUIRED_001 {component_label} action '{action_name}' references "
                            f"unprojected row column '{source_column}'"
                        )
    return issues


def lint_metric_card_selection_contracts(
    path: Path,
    text: str,
    validation_context: dict[str, Any] | None = None,
) -> list[str]:
    """Validate Metric Card selection mode page-item wiring."""
    del validation_context
    issues: list[str] = []

    for page_start, _page_name, page_block in find_component_blocks(text, "page"):
        items = page_item_types(page_block)
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block) or ""
            if region_schema_key(region_type) != "metricCard":
                continue
            top_level_blocks = extract_top_level_blocks(region_block)
            row_selection_meta = top_level_blocks.get("rowSelection")
            if not row_selection_meta:
                continue

            component_label = f"region '{region_name}' type '{region_type}'"
            component_start = page_start + region_offset
            row_selection_offset, row_selection_block = row_selection_meta
            row_props = {
                prop_name: (clean_scalar_value(prop_value), prop_offset)
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(row_selection_block)
            }
            selection_type = row_props.get("type", ("", 0))[0]
            current_item = row_props.get("currentSelectionPageItem", ("", 0))[0].upper()
            select_all_item = row_props.get("selectAllPageItem", ("", 0))[0].upper()

            if selection_type == "focusOnly" and (current_item or select_all_item):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + row_selection_offset)}: "
                    f"METRIC_CARD_SELECTION_ITEMS_REQUIRED_001 {component_label} rowSelection focusOnly must not "
                    "emit currentSelectionPageItem or selectAllPageItem"
                )
            if selection_type in {"singleSelection", "multipleSelection"}:
                if not current_item or not has_hidden_page_item(items, current_item):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + row_selection_offset + row_props.get('currentSelectionPageItem', ('', 0))[1])}: "
                        f"METRIC_CARD_SELECTION_ITEMS_REQUIRED_001 {component_label} rowSelection {selection_type} "
                        "requires currentSelectionPageItem backed by a same-page hidden page item"
                    )
            if selection_type == "singleSelection" and select_all_item:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + row_selection_offset + row_props.get('selectAllPageItem', ('', 0))[1])}: "
                    f"METRIC_CARD_SELECTION_ITEMS_REQUIRED_001 {component_label} rowSelection singleSelection must "
                    "omit selectAllPageItem"
                )
            if selection_type == "multipleSelection":
                if not select_all_item or items.get(select_all_item) not in {"checkbox", "switch"}:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + row_selection_offset + row_props.get('selectAllPageItem', ('', 0))[1])}: "
                        f"METRIC_CARD_SELECTION_ITEMS_REQUIRED_001 {component_label} rowSelection multipleSelection "
                        "requires selectAllPageItem backed by a same-page checkbox or switch item"
                    )
    return issues


def page_has_region_refresh_action(page_block: str, trigger_region_name: str, target_region_name: str) -> bool:
    """Return whether a dynamic action on a source region refreshes a target region."""
    trigger_region_ref = f"@{trigger_region_name}"
    target_region_ref = f"@{target_region_name}"
    for _da_offset, _da_name, da_block in find_component_blocks(page_block, "dynamicAction"):
        da_blocks = extract_top_level_blocks(da_block)
        when_meta = da_blocks.get("when")
        if not when_meta:
            continue
        _when_offset, when_block = when_meta
        when_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(when_block)
        }
        if when_props.get("selectionType") != "region" or when_props.get("region") != trigger_region_ref:
            continue
        for _action_offset, _action_name, action_block in find_immediate_component_blocks(da_block, "action"):
            action_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_property_values(action_block)
            }
            if action_props.get("action") != "refresh":
                continue
            affected_meta = extract_top_level_blocks(action_block).get("affectedElements")
            if not affected_meta:
                continue
            _affected_offset, affected_block = affected_meta
            affected_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(affected_block)
            }
            if affected_props.get("selectionType") == "region" and affected_props.get("region") == target_region_ref:
                return True
    return False


def lint_master_detail_contracts(path: Path, text: str) -> list[str]:
    """Validate deterministic Content Row master-detail layout and context wiring."""
    issues: list[str] = []

    for pair in same_page_master_detail_pairs(path, text):
        page_name = str(pair["page_name"])
        master_name = str(pair["region_name"])
        child_name = str(pair["child_region_name"])
        context_item = str(pair["context_item"])
        pk_column = str(pair["pk_column"])
        master_block = str(pair["region_block"])
        master_layout_props = pair.get("layout_props") if isinstance(pair.get("layout_props"), dict) else {}
        child_layout_props = pair.get("child_layout_props") if isinstance(pair.get("child_layout_props"), dict) else {}
        item_types = pair.get("item_types") if isinstance(pair.get("item_types"), dict) else {}
        master_slot = clean_scalar_value(master_layout_props.get("slot", ("", 0))[0]).lower()
        child_slot = clean_scalar_value(child_layout_props.get("slot", ("", 0))[0]).lower()
        master_span = parse_int(master_layout_props.get("columnSpan", ("", 0))[0] or None)
        child_start_new_row = clean_scalar_value(child_layout_props.get("startNewRow", ("", 0))[0]).lower()
        page_template = page_template_value(str(pair.get("page_block", ""))).lower()
        master_appearance_template, master_appearance_offset = region_appearance_template(master_block)
        master_line = line_no(text, int(pair["layout_offset"]))
        child_line = line_no(text, int(pair["child_layout_offset"]))

        if page_template and page_template != "@/standard":
            issues.append(
                f"{display_path(path)}:{master_line}: MASTER_DETAIL_LAYOUT_REQUIRED_001 page '{page_name}' master "
                f"Content Row '{master_name}' must use appearance.pageTemplate @/standard; reserve left-side-column "
                "templates for faceted-search/filter-sidebar pages"
            )

        if not (master_slot == "body" and child_slot == "body" and master_span in {3, 4} and child_start_new_row == "false"):
            issues.append(
                f"{display_path(path)}:{master_line}: MASTER_DETAIL_LAYOUT_REQUIRED_001 page '{page_name}' master "
                f"Content Row '{master_name}' and child region '{child_name}' must use a BODY asymmetric row with "
                "parent columnSpan 3/4 and child layout.startNewRow: false"
            )

        if master_appearance_template != "@/standard":
            issues.append(
                f"{display_path(path)}:{line_no(text, int(pair['region_start']) + master_appearance_offset)}: "
                f"MASTER_DETAIL_CONTENT_ROW_TEMPLATE_REQUIRED_001 page '{page_name}' master Content Row "
                f"'{master_name}' must use appearance.template @/standard; reserve @/blank-with-attributes "
                "for structural containers and dashboard KPI strips"
            )

        if not content_row_has_context_action(master_block, context_item, pk_column):
            issues.append(
                f"{display_path(path)}:{line_no(text, int(pair['region_start']))}: "
                f"MASTER_DETAIL_CONTENT_ROW_ACTION_REQUIRED_001 page '{page_name}' master Content Row '{master_name}' "
                f"must define a fullRowLink action that sets hidden item {context_item} from &{pk_column}. "
                "Do not use redirectUrl/targetUrl for same-page master-detail selection."
            )
        for action_name in content_row_redirect_url_full_row_actions(master_block):
            issues.append(
                f"{display_path(path)}:{line_no(text, int(pair['region_start']))}: "
                f"MASTER_DETAIL_DYNAMIC_ACTION_REQUIRED_001 page '{page_name}' master Content Row '{master_name}' "
                f"fullRowLink action '{action_name}' must not use redirectUrl/targetUrl; use a dynamic-action/declarative "
                f"context update for {context_item} and refresh child region '{child_name}'"
            )

        child_top_level = pair.get("child_top_level_blocks")
        submitted_items = source_page_items_to_submit(child_top_level if isinstance(child_top_level, dict) else {})
        is_map_child = str(pair["child_region_type_key"]) == "map"
        if not is_map_child and context_item not in submitted_items:
            issues.append(
                f"{display_path(path)}:{child_line}: MASTER_DETAIL_CHILD_BIND_SUBMIT_REQUIRED_001 page '{page_name}' "
                f"child region '{child_name}' SQL references :{context_item} and must list it in source.pageItemsToSubmit"
            )
        if not page_has_region_refresh_action(
            str(pair.get("page_block", "")),
            master_name,
            child_name,
        ):
            issues.append(
                f"{display_path(path)}:{child_line}: MASTER_DETAIL_DYNAMIC_ACTION_REQUIRED_001 page '{page_name}' "
                f"child region '{child_name}' depends on {context_item} and must be refreshed by a dynamic action "
                f"triggered from master Content Row '{master_name}'"
            )

        if not has_hidden_page_item(item_types, context_item):
            issues.append(
                f"{display_path(path)}:{line_no(text, int(pair['region_start']))}: "
                f"MASTER_DETAIL_VISIBLE_SELECTOR_REGRESSION_001 page '{page_name}' context item {context_item} "
                "must be a hidden same-page item; do not use a visible selector as the parent-child bridge"
            )

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        if not same_page_master_detail_pairs(path, page_block):
            continue
        for button_offset, button_name, button_block in find_immediate_component_blocks(page_block, "button"):
            props = scalar_props_from_component(button_block)
            label = clean_scalar_value(props.get("label", ("", 0))[0])
            action_text = f"{button_name} {label}".lower()
            if not re.search(r"\b(create|add|edit|delete|detail|line|item|order)\b", action_text):
                continue
            layout_meta = extract_top_level_blocks(button_block).get("layout")
            if not layout_meta:
                continue
            layout_offset, layout_block = layout_meta
            layout_props = layout_properties(layout_block)
            slot = clean_scalar_value(layout_props.get("slot", ("", 0))[0]).lower()
            region = clean_scalar_value(layout_props.get("region", ("", 0))[0])
            if slot == "body" and not region:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + button_offset + layout_offset)}: "
                    f"MASTER_DETAIL_TOOLBAR_ACTIONS_REQUIRED_001 page '{page_name}' action button '{button_name}' "
                    "must be anchored to the relevant parent/child region toolbar or page header, not free-floating in BODY"
                )

    return issues


def lint_interactive_report_contracts(
    path: Path,
    text: str,
    validation_context: dict[str, Any] | None = None,
) -> list[str]:
    """Validate Interactive Report projection, bind-submit, and text-search contracts."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        page_number = page_number_from_context(path, page_name, page_block)
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block) or ""
            if region_schema_key(region_type) != "interactiveReport":
                continue
            component_start = page_start + region_offset
            component_label = f"region '{region_name}' type '{region_type}'"
            top_level_blocks = extract_top_level_blocks(region_block)
            if projection_source_requires_columns("interactiveReport", top_level_blocks):
                actual_columns = len(find_immediate_component_blocks(region_block, "column"))
                expected_columns, projection_error, _source_kind = source_projection_columns(top_level_blocks, validation_context)
                if projection_error:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start)}: "
                        f"IR_PROJECTED_COLUMNS_REQUIRED_001 {component_label} {projection_error}"
                    )
                elif actual_columns == 0:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start)}: "
                        f"IR_PROJECTED_COLUMNS_REQUIRED_001 {component_label} with SQL/table/REST source must define "
                        "immediate column child blocks for every projected column"
                    )
                elif expected_columns:
                    emitted = collect_emitted_projection_columns("interactiveReport", region_block)
                    missing = [
                        column
                        for column in expected_columns
                        if normalize_sql_identifier(column) not in emitted
                    ]
                    if missing:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start)}: "
                            f"IR_PROJECTED_COLUMNS_REQUIRED_001 {component_label} source projection is missing child "
                            f"column block(s): {', '.join(missing)}"
                        )

            sql_query = source_sql_query(top_level_blocks)
            if not sql_query:
                continue
            binds = sql_page_item_binds(sql_query, page_number)
            submitted_items = source_page_items_to_submit(top_level_blocks)
            missing_submit = sorted(binds - submitted_items)
            if missing_submit:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start)}: "
                    f"IR_CONTEXT_BIND_SUBMIT_REQUIRED_001 {component_label} SQL references "
                    f"{', '.join(':' + item for item in missing_submit)} and must list them in source.pageItemsToSubmit"
                )

            for predicate_match in re.finditer(
                r"(?is)(?P<lhs>(?:lower\s*\([^)]*\)|[A-Za-z][A-Za-z0-9_$.]*))\s*"
                r"(?P<op>=|!=|<>|like)\s*"
                r"(?P<rhs>(?:lower\s*\(\s*:P\d+_[^)]+\)|:P\d+_[A-Za-z0-9_$#]+|'[^']*'))",
                strip_sql_comments(sql_query),
            ):
                rhs = predicate_match.group("rhs")
                bind_match = re.search(r":(P\d+_[A-Za-z0-9_$#]+)", rhs, re.IGNORECASE)
                if not bind_match:
                    continue
                bind_name = bind_match.group(1).upper()
                if not re.search(r"(SEARCH|FILTER|TEXT|NAME|STATUS|CODE|TERM)$", bind_name, re.IGNORECASE):
                    continue
                lhs = predicate_match.group("lhs").strip().lower()
                rhs_normalized = rhs.strip().lower()
                if not (lhs.startswith("lower(") and rhs_normalized.startswith("lower(")):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start)}: "
                        f"IR_TEXT_SEARCH_CASE_NORMALIZATION_REQUIRED_001 {component_label} text predicate using "
                        f":{bind_name} must normalize both sides with LOWER()"
                    )
                    break

    return issues


def lint_map_layer_bind_submit_contract(path: Path, text: str) -> list[str]:
    """Validate map layer SQL avoids unsupported session-state workaround calls."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        page_number = page_number_from_context(path, page_name, page_block)
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block) or ""
            if region_schema_key(region_type) != "map":
                continue
            component_start = page_start + region_offset
            for layer_offset, layer_name, layer_block in find_immediate_component_blocks(region_block, "layer"):
                top_level_blocks = extract_top_level_blocks(layer_block)
                sql_query = source_sql_query(top_level_blocks)
                if not sql_query:
                    continue
                session_state_refs = sql_page_item_session_state_refs(sql_query, page_number)
                if session_state_refs:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + layer_offset)}: "
                        f"MAP_LAYER_CONTEXT_BIND_REQUIRED_001 map region '{region_name}' layer '{layer_name}' "
                        f"must reference selected context items with normal bind syntax, not v()/nv() session-state "
                        f"workarounds: {', '.join(sorted(session_state_refs))}"
                    )

    return issues


def _smart_filter_target_region_for_page(
    text: str,
    region_start: int,
    region_block: str,
) -> tuple[str, str, int, str] | None:
    """Resolve a Smart Filter target within the containing page."""
    target_name = _smart_filter_region_target(region_block)
    if not target_name:
        return None
    pages = find_component_blocks(text, "page")
    containing_page = next(
        ((start, block) for start, _name, block in pages if start <= region_start < start + len(block)),
        None,
    )
    page_block = containing_page[1] if containing_page else None
    page_start = containing_page[0] if containing_page else 0
    region_entries = (
        find_immediate_component_blocks(page_block, "region")
        if page_block is not None
        else find_component_blocks(text, "region")
    )
    candidates = [
        (region_schema_key(extract_item_type(block) or ""), block, page_start + start if page_block is not None else start, name)
        for start, name, block in region_entries
        if name == target_name
    ]
    if len(candidates) != 1:
        return None
    region_type, target_block, target_start, _target_name = candidates[0]
    return target_name, region_type, target_start, target_block


def smart_filter_result_source_blocks(region_block: str) -> dict[str, tuple[int, str]]:
    """Resolve the single base dataset, including a Map's nested layer source."""
    if region_schema_key(extract_item_type(region_block) or "") != "map":
        return extract_top_level_blocks(region_block)
    layers = find_component_blocks(region_block, "layer")
    if len(layers) != 1:
        return {}
    layer_offset, _layer_name, layer_block = layers[0]
    return {
        name: (layer_offset + offset, block)
        for name, (offset, block) in extract_top_level_blocks(layer_block).items()
    }


def smart_filter_sql_objects(sql: str) -> tuple[set[str], str | None]:
    """Collect source objects from simple SELECTs; fail closed on opaque SQL forms.

    This is an evidence gate, not an Oracle SQL parser. CTEs, database links and
    table functions need a richer parser before their object scope can be proven.
    Literals/comments are tokenized before looking for FROM/JOIN references.
    """
    token_pattern = r'''--[^\n]*|/\*[\s\S]*?\*/|'(?:''|[^'])*'|"(?:""|[^"])*"|[A-Za-z_][A-Za-z0-9_$#]*|\S'''
    tokens = [
        token for token in re.findall(token_pattern, sql)
        if not token.startswith(("--", "/*"))
    ]
    identifier = re.compile(r'(?:"(?:""|[^"])+"|[A-Za-z_][A-Za-z0-9_$#]*)\Z')
    if any(token.lower() in {"with", "pivot", "unpivot", "match_recognize", "model"} or token == "@" for token in tokens):
        return set(), "SQL object scope cannot be proven for CTEs, database links or advanced SQL clauses"
    objects: set[str] = set()
    # Each parenthesis level tracks whether commas introduce another FROM source.
    from_scopes = [False]
    expect_source = False
    stop_clauses = {"where", "group", "order", "having", "connect", "start", "union", "intersect", "minus", "fetch", "offset"}
    builtins = {
        "count", "sum", "min", "max", "avg", "lower", "upper", "trim", "ltrim", "rtrim",
        "nvl", "nvl2", "coalesce", "nullif", "decode", "round", "trunc", "to_char", "to_date",
        "to_number", "cast", "extract", "substr", "replace", "length", "abs", "greatest",
        "least", "listagg", "row_number", "rank", "dense_rank", "over", "in", "exists",
        "not", "and", "or", "as",
    }
    index = 0
    while index < len(tokens):
        token = tokens[index]
        lower = token.lower()
        if token == "(":
            if expect_source and (index + 1 >= len(tokens) or tokens[index + 1].lower() != "select"):
                return set(), "SQL source is not a provable table, view or SELECT subquery"
            from_scopes.append(False)
            expect_source = False
        elif token == ")":
            if len(from_scopes) == 1:
                return set(), "SQL has unbalanced parentheses"
            from_scopes.pop()
        elif lower in {"from", "join"}:
            from_scopes[-1] = True
            expect_source = True
        elif lower in stop_clauses:
            from_scopes[-1] = False
        elif token == "," and from_scopes[-1]:
            expect_source = True
        elif identifier.fullmatch(token):
            parts = [token]
            end = index + 1
            while end + 1 < len(tokens) and tokens[end] == "." and identifier.fullmatch(tokens[end + 1]):
                parts.append(tokens[end + 1])
                end += 2
            name = ".".join(parts)
            is_call = end < len(tokens) and tokens[end] == "("
            if expect_source:
                if is_call or lower in {"lateral", "only"}:
                    return set(), "table functions and opaque FROM sources require proven object scope"
                objects.add(name.upper() if '"' not in name else name)
                expect_source = False
            elif is_call and lower not in builtins and lower != "select":
                objects.add(name.upper() if '"' not in name else name)
            index = end - 1
        index += 1
    if expect_source or len(from_scopes) != 1 or not objects:
        return set(), "SQL object scope is incomplete or cannot be proven"
    return objects, None


def smart_filter_object_evidence(base_plan: dict[str, Any], referenced: set[str]) -> tuple[dict[str, dict[str, Any]], bool]:
    """Require named, resolved evidence for the actual source objects, not a label."""
    supplied = _smart_filter_plan_value(base_plan, "object_evidence", "objectEvidence", "objects")
    if isinstance(supplied, dict):
        supplied = [dict(record, object=name) if isinstance(record, dict) else None for name, record in supplied.items()]
    if not isinstance(supplied, list) or not supplied:
        return {}, False
    records: dict[str, dict[str, Any]] = {}
    for record in supplied:
        if not isinstance(record, dict):
            return {}, False
        name = _smart_filter_plan_value(record, "object", "name")
        source = _smart_filter_plan_value(record, "source", "evidence_source", "evidenceSource")
        if not isinstance(name, str) or not name.strip() or not isinstance(source, str) or source not in SMART_FILTER_EVIDENCE_SOURCES:
            return {}, False
        key = name.strip() if '"' in name else name.strip().upper()
        if key in records:
            return {}, False
        records[key] = record
    return records, bool(referenced) and referenced.issubset(records)


def lint_smart_filter_base_source_contract(
    path: Path,
    text: str,
    validation_context: dict[str, Any] | None = None,
) -> list[str]:
    """Enforce Smart Filter base-source modes and explicit, non-wildcard projections."""
    issues: list[str] = []
    for region_start, region_name, region_block in find_component_blocks(text, "region"):
        if region_schema_key(extract_item_type(region_block) or "") != "smartFilters":
            continue
        component_label = f"region '{region_name}' type 'smartFilters'"
        target = _smart_filter_target_region_for_page(text, region_start, region_block)
        source_issue_offset = region_start
        if target is None:
            # Topology and results-region validators own missing/ambiguous targets.
            continue
        target_name, target_type, _target_start, target_block = target
        if target_type not in SMART_FILTER_ALLOWED_RESULTS_REGION_TYPES:
            continue
        target_top_level = smart_filter_result_source_blocks(target_block)
        source_meta = target_top_level.get("source")
        if not source_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, region_start)}: "
                "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001 "
                f"{component_label} filtered base region '{target_name}' must define a secured_view or canonical_sql source"
            )
            continue

        source_offset, source_block = source_meta
        source_props = {
            prop_name: (prop_value, prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
        }
        source_names = {prop_name for prop_name, _prop_offset in extract_immediate_brace_property_names(source_block)}
        source_type = clean_scalar_value(source_props.get("type", ("", 0))[0]).lower()
        table_name = clean_scalar_value(source_props.get("tableName", ("", 0))[0])
        sql_query = extract_fenced_property_body(source_block, "sqlQuery")
        source_projection_error: str | None = None
        if source_type == "sqlquery" or "sqlQuery" in source_names:
            source_mode = "canonical_sql"
            if not sql_query.strip():
                issues.append(
                    f"{display_path(path)}:{line_no(text, _target_start + source_offset)}: "
                    "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001 "
                    f"{component_label} filtered base region '{target_name}' canonical_sql source must define a non-empty sqlQuery"
                )
            else:
                _projection, projection_error = projection_columns_from_sql(sql_query)
                if projection_error:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, _target_start + source_offset)}: "
                        "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001 "
                        f"{component_label} filtered base region '{target_name}' must use an explicit canonical_sql projection: {projection_error}"
                    )
        elif source_type in {"table", "tableview"} or table_name:
            source_mode = "secured_view"
            if not table_name:
                issues.append(
                    f"{display_path(path)}:{line_no(text, _target_start + source_offset)}: "
                    "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001 "
                    f"{component_label} filtered base region '{target_name}' secured_view source must define source.tableName"
                )
            else:
                _projection, projection_error, _source_kind = source_projection_columns(target_top_level, validation_context)
                if projection_error:
                    source_projection_error = projection_error
        else:
            source_mode = "unsupported"
            issues.append(
                f"{display_path(path)}:{line_no(text, _target_start + source_offset)}: "
                "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001 "
                f"{component_label} filtered base region '{target_name}' source mode is unsupported; use secured_view or canonical_sql"
            )

        plan, plan_error, plan_required = smart_filter_generation_plan_state(path, text, validation_context)
        if plan_error:
            issues.append(_smart_filter_plan_issue(
                path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                f"generation plan is invalid: {plan_error}"
            ))
            continue
        if plan is None:
            if source_projection_error:
                issues.append(
                    f"{display_path(path)}:{line_no(text, _target_start + source_offset)}: "
                    "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001 "
                    f"{component_label} filtered base region '{target_name}' secured_view projection cannot be proven: {source_projection_error}"
                )
            if plan_required or source_mode == "secured_view":
                issues.append(_smart_filter_plan_issue(
                    path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                    "requires a structured Generation Plan with base source and object evidence"
                ))
            continue

        base_plan = _smart_filter_plan_section(plan, "base_source", "baseSource", "source")
        planned_target = _smart_filter_plan_value(plan, "base_region_static_id", "baseRegionStaticId")
        if planned_target and str(planned_target).lstrip("@") != target_name:
            issues.append(_smart_filter_plan_issue(
                path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                f"base_region_static_id must resolve to '{target_name}'"
            ))
        planned_mode = str(_smart_filter_plan_value(base_plan, "mode", "source_mode", "sourceMode") or "").strip().lower()
        if planned_mode not in {"secured_view", "canonical_sql"}:
            issues.append(_smart_filter_plan_issue(
                path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                "base_source.mode must be secured_view or canonical_sql"
            ))
        elif planned_mode != source_mode:
            issues.append(_smart_filter_plan_issue(
                path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                f"base_source.mode '{planned_mode}' does not match emitted source mode '{source_mode}'"
            ))

        projection = _smart_filter_plan_value(base_plan, "projection", "projected_columns", "projectedColumns")
        plan_projection = _smart_filter_plan_explicit_projection(plan)
        if not plan_projection:
            issues.append(_smart_filter_plan_issue(
                path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                "base_source must record explicit_projection: true and a non-empty projection list"
            ))
        elif len(plan_projection) != len(set(plan_projection)):
            issues.append(_smart_filter_plan_issue(
                path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                "base_source.projection must not contain duplicate columns"
            ))
        actual_projection, actual_projection_error, _actual_source_kind = source_projection_columns(
            target_top_level, validation_context
        )
        if isinstance(projection, list) and projection and actual_projection and not actual_projection_error:
            expected_projection = [normalize_sql_identifier(str(column)) for column in projection]
            emitted_projection = [normalize_sql_identifier(str(column)) for column in actual_projection]
            if expected_projection != emitted_projection:
                issues.append(_smart_filter_plan_issue(
                    path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                    "base_source.projection must equal the emitted base-source projection in declaration order"
                ))
        if source_mode == "canonical_sql":
            referenced_objects, object_error = smart_filter_sql_objects(sql_query)
            canonical_sql = _smart_filter_plan_value(base_plan, "canonical_sql", "canonicalSql")
            if not isinstance(canonical_sql, str) or canonical_sql.strip() != sql_query.strip():
                issues.append(_smart_filter_plan_issue(
                    path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                    "base_source.canonical_sql must exactly match the supplied SQL; rewrites are not permitted"
                ))
        else:
            referenced_objects = {table_name if '"' in table_name else table_name.upper()} if table_name else set()
            object_error = None
        evidence_records, evidence_valid = smart_filter_object_evidence(base_plan, referenced_objects)
        if object_error or not evidence_valid:
            issues.append(_smart_filter_plan_issue(
                path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                object_error or "base_source requires named, resolved object evidence matching every referenced object: " + ", ".join(sorted(referenced_objects))
            ))
        if source_mode == "secured_view":
            record = evidence_records.get(next(iter(referenced_objects), ""), {})
            if record.get("object_type") != "view" or record.get("secured") is not True:
                evidence_valid = False
                issues.append(_smart_filter_plan_issue(
                    path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                    "the actual tableName requires object_type: view and secured: true evidence; tableView alone does not prove a secured view"
                ))
        no_rewrite = _smart_filter_plan_value(base_plan, "no_rewrite", "preserve_canonical_sql", "preserveCanonicalSql")
        if no_rewrite is not True:
            issues.append(_smart_filter_plan_issue(
                path, text, source_issue_offset, "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001", component_label,
                "base_source must record no_rewrite: true"
            ))

        if source_projection_error and not (
            source_mode == "secured_view"
            and planned_mode == "secured_view"
            and plan_projection
            and evidence_valid
            and no_rewrite is True
        ):
            issues.append(
                f"{display_path(path)}:{line_no(text, _target_start + source_offset)}: "
                "SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001 "
                f"{component_label} filtered base region '{target_name}' secured_view projection cannot be proven: {source_projection_error}"
            )
    return issues


def lint_smart_filter_search_behavior_contract(ctx: LintContext) -> list[str]:
    """Validate Generation Plan matching, tokenization, and compiler-representation evidence."""
    issues: list[str] = []
    for region_start, region_name, region_block in find_component_blocks(ctx.text, "region"):
        if region_schema_key(extract_item_type(region_block) or "") != "smartFilters":
            continue
        component_label = f"region '{region_name}' type 'smartFilters'"
        plan, plan_error, plan_required = smart_filter_generation_plan_state(ctx.path, ctx.text, ctx.validation_context)
        if plan_error:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, f"generation plan is invalid: {plan_error}"))
            continue
        if plan is None:
            if plan_required:
                issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "requires a structured Generation Plan"))
            continue
        search_plan = _smart_filter_plan_section(plan, "search", "search_behavior", "searchBehavior")
        semantics = _smart_filter_plan_value(search_plan, "match_semantics", "matchSemantics", "semantic")
        semantic_values = semantics if isinstance(semantics, list) else [semantics]
        semantic_values = [str(value).strip().lower() for value in semantic_values if value is not None and str(value).strip()]
        if len(semantic_values) != 1 or semantic_values[0] not in SMART_FILTER_MATCH_SEMANTICS:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "match_semantics must contain exactly one of contains, starts, or exact"))

        min_chars = _smart_filter_plan_value(search_plan, "min_chars", "minChars")
        max_len = _smart_filter_plan_value(search_plan, "max_len", "maxLen")
        if isinstance(min_chars, bool) or not isinstance(min_chars, int) or min_chars < 1:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "min_chars must be a positive integer"))
        if isinstance(max_len, bool) or not isinstance(max_len, int) or max_len < 1:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "max_len must be a positive integer"))
        elif isinstance(min_chars, int) and min_chars > 0 and max_len < min_chars:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "max_len must be greater than or equal to min_chars"))

        tokenization = _smart_filter_plan_value(search_plan, "tokenization_policy", "tokenizationPolicy")
        if not isinstance(tokenization, dict):
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "tokenization_policy must define trimming, repeated_whitespace, punctuation_boundaries, case_normalization, accent_normalization, duplicate_tokens, and token_order"))
        else:
            for decision in SMART_FILTER_TOKENIZATION_DECISIONS:
                value = _smart_filter_plan_value(tokenization, decision, re.sub(r"_([a-z])", lambda match: match.group(1).upper(), decision))
                if not _smart_filter_plan_is_nonempty(value):
                    issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, f"tokenization_policy.{decision} is unresolved"))
            scope = _smart_filter_plan_value(search_plan, "consistency_scope", "consistencyScope") or _smart_filter_plan_value(tokenization, "consistency_scope", "consistencyScope")
            scope_values = set(scope) if isinstance(scope, list) else set()
            if scope_values != SMART_FILTER_TOKENIZATION_SCOPE:
                issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "tokenization policy must apply consistently to search, suggestions, and refinements"))
            scoped_policies = _smart_filter_plan_value(search_plan, "policies", "scoped_policies", "scopedPolicies")
            if isinstance(scoped_policies, dict):
                normalized_policies = [json.dumps(scoped_policies.get(name), sort_keys=True) for name in sorted(SMART_FILTER_TOKENIZATION_SCOPE)]
                if any(not _smart_filter_plan_is_nonempty(scoped_policies.get(name)) for name in SMART_FILTER_TOKENIZATION_SCOPE) or len(set(normalized_policies)) != 1:
                    issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "search, suggestions, and refinements must use one consistent tokenization policy"))

        overrides = _smart_filter_plan_value(search_plan, "per_attribute_overrides", "perAttributeOverrides")
        if isinstance(overrides, dict):
            invalid_overrides = [name for name, value in overrides.items() if str(value).lower() not in SMART_FILTER_MATCH_SEMANTICS]
            if invalid_overrides:
                issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, f"per-attribute match overrides are invalid: {', '.join(sorted(map(str, invalid_overrides)))}"))

        compiler_evidence = _smart_filter_plan_value(
            search_plan, "compiler_evidence", "compilerEvidence", "compiler_representation_evidence", "compilerRepresentationEvidence"
        )
        records = _smart_filter_plan_evidence_records(compiler_evidence)
        for required_name in ("match_semantics", "min_chars", "max_len", "tokenization_policy"):
            record = records.get(required_name) or records.get(re.sub(r"_([a-z])", lambda match: match.group(1).upper(), required_name))
            if not _smart_filter_plan_evidence_is_resolved(record):
                issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, f"compiler evidence for {required_name} is missing, unresolved, or unrepresentable"))
        if _smart_filter_plan_value(search_plan, "base_sql_rewrite", "baseSqlRewrite", "allow_base_sql_rewrite") is True:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001", component_label, "base SQL rewrite must be false"))
    return issues


def _smart_filter_expected_cardinality_is_positive(value: Any) -> bool:
    """Return whether a cardinality estimate is a positive numeric value."""
    if isinstance(value, bool):
        return False
    if isinstance(value, (int, float)):
        return value > 0
    if isinstance(value, dict):
        return any(_smart_filter_expected_cardinality_is_positive(value.get(name)) for name in ("value", "estimate", "expected", "rows", "max"))
    return False


def _smart_filter_readiness_value_is_resolved(value: Any) -> bool:
    """Return whether performance evidence is present and not explicitly pending."""
    if isinstance(value, dict):
        status = str(_smart_filter_plan_value(value, "status", "state", "result") or "").strip().lower()
        if status in {"unknown", "unresolved", "missing", "pending", "blocked", "unsupported", "unrepresentable"}:
            return False
    return _smart_filter_plan_is_nonempty(value)


def lint_smart_filter_performance_readiness_contract(ctx: LintContext) -> list[str]:
    """Validate Generation Plan index, statistics, and cardinality readiness evidence."""
    issues: list[str] = []
    for region_start, region_name, region_block in find_component_blocks(ctx.text, "region"):
        if region_schema_key(extract_item_type(region_block) or "") != "smartFilters":
            continue
        component_label = f"region '{region_name}' type 'smartFilters'"
        plan, plan_error, plan_required = smart_filter_generation_plan_state(ctx.path, ctx.text, ctx.validation_context)
        if plan_error:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, f"generation plan is invalid: {plan_error}"))
            continue
        if plan is None:
            if plan_required:
                issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, "requires a structured Generation Plan"))
            continue
        performance = _smart_filter_plan_section(plan, "performance_readiness", "performanceReadiness", "performance")
        strategy = _smart_filter_plan_value(performance, "index_strategy", "indexStrategy", "search_strategy", "searchStrategy")
        statistics = _smart_filter_plan_value(performance, "statistics_status", "statisticsStatus", "optimizer_statistics", "optimizerStatistics")
        cardinality = _smart_filter_plan_value(performance, "expected_cardinality", "expectedCardinality", "cardinality")
        if not _smart_filter_readiness_value_is_resolved(strategy):
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, "performance_readiness.index_strategy is unresolved"))
        if not _smart_filter_readiness_value_is_resolved(statistics):
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, "performance_readiness.statistics_status is unresolved"))
        if not _smart_filter_expected_cardinality_is_positive(cardinality):
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, "performance_readiness.expected_cardinality must be a positive estimate"))

        search_plan = _smart_filter_plan_section(plan, "search", "search_behavior", "searchBehavior")
        semantic = str(_smart_filter_plan_value(search_plan, "match_semantics", "matchSemantics", "semantic") or "").lower()
        planned_attributes = _smart_filter_plan_value(plan, "searchable_attributes", "searchableAttributes", "allowlist")
        if isinstance(planned_attributes, list):
            normalized_attributes = {normalize_sql_identifier(str(attribute)) for attribute in planned_attributes}
            if isinstance(strategy, dict):
                strategy_attributes = {
                    normalize_sql_identifier(str(attribute))
                    for attribute in strategy
                    if str(attribute).lower() not in {"default", "all"}
                }
                if "default" not in {str(attribute).lower() for attribute in strategy} and normalized_attributes - strategy_attributes:
                    issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, "index_strategy must cover every searchable attribute or declare a default strategy"))
            elif isinstance(strategy, list):
                strategy_attributes = {
                    normalize_sql_identifier(str(_smart_filter_plan_value(entry, "attribute", "column", "databaseColumn") or ""))
                    for entry in strategy if isinstance(entry, dict)
                }
                if normalized_attributes - strategy_attributes:
                    issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, "index_strategy must cover every searchable attribute"))
        strategy_text = json.dumps(strategy, sort_keys=True).lower()
        if semantic == "contains" and not any(token in strategy_text for token in ("text", "function", "substring", "scan", "accepted")):
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, "contains matching needs compatible text/function-based strategy or an explicit accepted scan-cost decision"))
        if "function" in strategy_text and "function-based" not in strategy_text and "function_based" not in strategy_text and "functionbased" not in strategy_text:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001", component_label, "function-wrapped search requires matching function-based index evidence"))
    return issues


def lint_smart_filter_accessibility_contract(ctx: LintContext) -> list[str]:
    """Validate Smart Filter child guidance and runtime acceptance evidence in the plan."""
    issues: list[str] = []
    for region_start, region_name, region_block in find_component_blocks(ctx.text, "region"):
        if region_schema_key(extract_item_type(region_block) or "") != "smartFilters":
            continue
        plan, plan_error, plan_required = smart_filter_generation_plan_state(ctx.path, ctx.text, ctx.validation_context)
        if plan_error:
            issues.append(_smart_filter_plan_issue(
                ctx.path, ctx.text, region_start, "SMART_FILTER_ACCESSIBILITY_GUIDANCE_REQUIRED_001",
                f"region '{region_name}' type 'smartFilters'", f"generation plan is invalid: {plan_error}"
            ))
            continue
        if plan is None:
            if plan_required:
                issues.append(_smart_filter_plan_issue(
                    ctx.path, ctx.text, region_start, "SMART_FILTER_ACCESSIBILITY_GUIDANCE_REQUIRED_001",
                    f"region '{region_name}' type 'smartFilters'", "requires a structured Generation Plan"
                ))
            continue
        component_label = f"region '{region_name}' type 'smartFilters'"
        for filter_offset, filter_name, filter_block in find_immediate_component_blocks(region_block, "filter"):
            blocks = extract_top_level_blocks(filter_block)
            label_meta = blocks.get("label")
            label_value = ""
            if label_meta:
                label_value = next(
                    (clean_scalar_value(value) for prop_name, value, _prop_offset in extract_immediate_brace_property_values(label_meta[1]) if prop_name == "label"),
                    "",
                )
            if not label_value:
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, region_start + filter_offset)}: "
                    "SMART_FILTER_ACCESSIBILITY_GUIDANCE_REQUIRED_001 "
                    f"{component_label} child '{filter_name}' must define a concise visible label"
                )
            if "help" not in blocks and "comments" not in blocks:
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, region_start + filter_offset)}: "
                    "SMART_FILTER_ACCESSIBILITY_GUIDANCE_REQUIRED_001 "
                    f"{component_label} child '{filter_name}' must define useful help or comments guidance"
                )

        acceptance = _smart_filter_plan_section(plan, "runtime_acceptance", "runtimeAcceptance", "acceptance")
        refresh = _smart_filter_plan_value(acceptance, "result_refresh_without_reload", "resultRefreshWithoutReload", "native_refresh")
        exports = _smart_filter_plan_value(acceptance, "filtered_exports", "filteredExports", "export_filters")
        if refresh is not True or exports is not True:
            issues.append(_smart_filter_plan_issue(ctx.path, ctx.text, region_start, "SMART_FILTER_RUNTIME_ACCEPTANCE_REQUIRED_001", component_label, "runtime_acceptance must prove result refresh without page reload and exports honoring active filters"))
    return issues


def lint_smart_filter_search_source_contract(
    path: Path,
    text: str,
    validation_context: dict[str, Any] | None = None,
) -> list[str]:
    """Validate Smart Filters search allowlists against the targeted base projection."""
    issues: list[str] = []
    pages = find_component_blocks(text, "page")
    for region_start, region_name, region_block in find_component_blocks(text, "region"):
        region_type = extract_item_type(region_block) or ""
        if region_schema_key(region_type) != "smartFilters":
            continue
        search_filters = [
            (filter_offset, filter_name, filter_block)
            for filter_offset, filter_name, filter_block in find_immediate_component_blocks(region_block, "filter")
            if extract_item_type(filter_block) == "search"
        ]
        if not search_filters:
            issues.append(
                f"{display_path(path)}:{line_no(text, region_start)}: "
                f"SMART_FILTER_SEARCH_SOURCE_REQUIRED_001 region '{region_name}' must define at least one "
                "type 'search' filter with a non-empty source.dbColumns allowlist"
            )
            continue

        target_region_block = ""
        region_source_meta = extract_top_level_blocks(region_block).get("source")
        if region_source_meta:
            _region_source_offset, region_source_block = region_source_meta
            filtered_meta = next(
                (
                    (prop_value, prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(region_source_block)
                    if prop_name == "filteredRegion"
                ),
                None,
            )
            if filtered_meta:
                filtered_reference = clean_scalar_value(filtered_meta[0])
                if re.fullmatch(r"@[A-Za-z0-9_$-]+", filtered_reference):
                    target_name = filtered_reference[1:]
                    page_block = next(
                        (block for start, _name, block in pages if start <= region_start < start + len(block)),
                        None,
                    )
                    page_regions = (
                        find_immediate_component_blocks(page_block, "region")
                        if page_block is not None else find_component_blocks(text, "region")
                    )
                    candidates = [
                        (region_schema_key(extract_item_type(candidate_block) or ""), candidate_block)
                        for _candidate_start, candidate_name, candidate_block in page_regions
                        if candidate_name == target_name
                    ]
                    if len(candidates) == 1 and candidates[0][0] in SMART_FILTER_ALLOWED_RESULTS_REGION_TYPES:
                        target_region_block = candidates[0][1]

        expected_columns: list[str] = []
        projection_error: str | None = None
        source_kind = "none"
        if target_region_block:
            expected_columns, projection_error, source_kind = source_projection_columns(
                smart_filter_result_source_blocks(target_region_block),
                validation_context,
            )
        plan, plan_error, plan_required = smart_filter_generation_plan_state(path, text, validation_context)
        plan_projection = _smart_filter_plan_explicit_projection(plan) if plan is not None and not plan_error else []
        if (
            target_region_block
            and source_kind == "table"
            and (projection_error or not expected_columns)
            and plan_projection
        ):
            expected_columns = plan_projection
            projection_error = None
            source_kind = "generation_plan"
        normalized_expected_columns = {
            normalize_sql_identifier(column)
            for column in expected_columns
            if normalize_sql_identifier(column)
        }

        for filter_offset, filter_name, filter_block in search_filters:
            source_meta = extract_top_level_blocks(filter_block).get("source")
            if not source_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + filter_offset)}: "
                    f"SMART_FILTER_SEARCH_SOURCE_REQUIRED_001 region '{region_name}' search filter '{filter_name}' "
                    "must define source.dbColumns for canonical free-text search"
                )
                continue
            source_offset, source_block = source_meta
            prop_names = {prop_name for prop_name, _prop_offset in extract_immediate_brace_property_names(source_block)}
            if "dbColumns" not in prop_names:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + filter_offset + source_offset)}: "
                    f"SMART_FILTER_SEARCH_SOURCE_REQUIRED_001 region '{region_name}' search filter '{filter_name}' "
                    "must use source.dbColumns, not source.databaseColumn or another shortcut"
                )
                continue
            db_columns_meta = next(
                (
                    (prop_value, prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                    if prop_name == "dbColumns"
                ),
                None,
            )
            db_columns_value = clean_scalar_value(db_columns_meta[0]) if db_columns_meta else ""
            searchable_columns = [
                column
                for column in re.split(r"[\s,]+", db_columns_value)
                if normalize_sql_identifier(column)
            ]
            if not searchable_columns or "{{" in db_columns_value:
                issue_relative_offset = db_columns_meta[1] if db_columns_meta else 0
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + filter_offset + source_offset + issue_relative_offset)}: "
                    f"SMART_FILTER_SEARCH_SOURCE_REQUIRED_001 region '{region_name}' search filter '{filter_name}' "
                    "must define a non-empty explicit source.dbColumns allowlist"
                )
                continue
            normalized_searchable_columns = [normalize_sql_identifier(column) for column in searchable_columns]
            duplicate_columns = sorted({
                column for column in normalized_searchable_columns
                if normalized_searchable_columns.count(column) > 1
            })
            if duplicate_columns:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + filter_offset + source_offset + (db_columns_meta[1] if db_columns_meta else 0))}: "
                    "SMART_FILTER_SEARCH_SOURCE_REQUIRED_001 "
                    f"region '{region_name}' search filter '{filter_name}' source.dbColumns must not contain duplicate columns: "
                    f"{', '.join(duplicate_columns)}"
                )

            if plan_error:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + filter_offset + source_offset)}: "
                    "SMART_FILTER_SEARCHABLE_COLUMNS_BASE_PROJECTION_REQUIRED_001 "
                    f"region '{region_name}' search filter '{filter_name}' cannot validate the declared allowlist because the Generation Plan is invalid: {plan_error}"
                )
            elif plan is None and plan_required:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + filter_offset + source_offset)}: "
                    "SMART_FILTER_SEARCHABLE_COLUMNS_BASE_PROJECTION_REQUIRED_001 "
                    f"region '{region_name}' search filter '{filter_name}' requires a structured Generation Plan"
                )
            elif plan is not None:
                search_plan = _smart_filter_plan_section(plan, "search", "search_behavior", "searchBehavior")
                planned_columns = _smart_filter_plan_value(
                    plan, "searchable_attributes", "searchableAttributes", "allowlist"
                )
                planned_columns = planned_columns or _smart_filter_plan_value(
                    search_plan, "searchable_attributes", "searchableAttributes", "allowlist"
                )
                if isinstance(planned_columns, list):
                    normalized_planned_columns = [normalize_sql_identifier(str(column)) for column in planned_columns]
                    if normalized_searchable_columns != normalized_planned_columns:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, region_start + filter_offset + source_offset + (db_columns_meta[1] if db_columns_meta else 0))}: "
                            "SMART_FILTER_SEARCHABLE_COLUMNS_BASE_PROJECTION_REQUIRED_001 "
                            f"region '{region_name}' search filter '{filter_name}' source.dbColumns must preserve the Generation Plan allowlist order: "
                            f"expected {', '.join(normalized_planned_columns)}; got {', '.join(normalized_searchable_columns)}"
                        )
            if not target_region_block:
                continue
            if projection_error or source_kind == "none" or not normalized_expected_columns:
                reason = projection_error or "the target base source projection cannot be proven locally"
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + filter_offset + source_offset)}: "
                    "SMART_FILTER_SEARCHABLE_COLUMNS_BASE_PROJECTION_REQUIRED_001 "
                    f"region '{region_name}' search filter '{filter_name}' cannot verify source.dbColumns against "
                    f"the filtered base region: {reason}"
                )
                continue
            outside_projection = [
                column
                for column in searchable_columns
                if normalize_sql_identifier(column) not in normalized_expected_columns
            ]
            if outside_projection:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start + filter_offset + source_offset)}: "
                    "SMART_FILTER_SEARCHABLE_COLUMNS_BASE_PROJECTION_REQUIRED_001 "
                    f"region '{region_name}' search filter '{filter_name}' source.dbColumns must be a subset of "
                    f"the filtered base projection; not projected: {', '.join(outside_projection)}"
                )
    return issues


def component_authorization_scheme(component_block: str) -> str | None:
    """Return a component's explicit authorization scheme, when present."""
    security_meta = extract_top_level_blocks(component_block).get("security")
    if not security_meta:
        return None
    _security_offset, security_block = security_meta
    for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(security_block):
        if prop_name == "authorizationScheme":
            return clean_scalar_value(prop_value)
    return None


def canonical_server_side_condition(component_block: str) -> tuple[tuple[str, str], ...] | None:
    """Compare condition properties by name while preserving literal and expression contents."""
    condition_meta = extract_top_level_blocks(component_block).get("serverSideCondition")
    if not condition_meta:
        return None
    _condition_offset, condition_block = condition_meta
    properties = extract_apexlang_immediate_group_properties(condition_block)
    values: list[tuple[str, str]] = []
    for index, (name, offset) in enumerate(properties):
        value_start = condition_block.index(":", offset) + 1
        value_end = properties[index + 1][1] if index + 1 < len(properties) else condition_block.rfind("}")
        values.append((name, condition_block[value_start:value_end].strip()))
    return tuple(sorted(values))


def smart_filter_refinements(block: str, authorization: str | None, condition: Any, offset: int = 0):
    """Walk group containers and checkbox children with their effective scope."""
    children = sorted(
        (start, name, child, kind)
        for kind in ("filter", "filterGroup", "checkbox")
        for start, name, child in find_immediate_component_blocks(block, kind)
    )
    for start, name, child, kind in children:
        child_authorization = component_authorization_scheme(child) or authorization
        child_condition = canonical_server_side_condition(child)
        if child_condition is None:
            child_condition = condition
        yield offset + start, name, child, kind, child_authorization, child_condition
        if kind == "filterGroup":
            yield from smart_filter_refinements(child, child_authorization, child_condition, offset + start)


def lint_smart_filter_security_scope_contract(
    path: Path,
    text: str,
    validation_context: dict[str, Any] | None = None,
) -> list[str]:
    """Keep Smart Filters, their base region, and refinement sources in one security scope."""
    issues: list[str] = []
    pages = find_component_blocks(text, "page")
    containers = [(page_start, page_block) for page_start, _page_name, page_block in pages]
    if not containers:
        containers = [(0, text)]

    for container_start, container_block in containers:
        if pages:
            region_entries = [
                (container_start + region_offset, region_name, region_block)
                for region_offset, region_name, region_block in find_immediate_component_blocks(container_block, "region")
            ]
        else:
            region_entries = find_component_blocks(container_block, "region")

        page_authorization = component_authorization_scheme(container_block)
        regions_by_static_id: dict[str, list[tuple[int, str, str]]] = {}
        for region_start, region_name, region_block in region_entries:
            regions_by_static_id.setdefault(region_name, []).append((region_start, region_name, region_block))

        for region_start, region_name, region_block in region_entries:
            if region_schema_key(extract_item_type(region_block) or "") != "smartFilters":
                continue

            source_meta = extract_top_level_blocks(region_block).get("source")
            if not source_meta:
                continue
            _source_offset, source_block = source_meta
            filtered_reference = next(
                (
                    clean_scalar_value(prop_value)
                    for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
                    if prop_name == "filteredRegion"
                ),
                "",
            )
            if not re.fullmatch(r"@[A-Za-z0-9_$-]+", filtered_reference):
                continue
            target_candidates = regions_by_static_id.get(filtered_reference[1:], [])
            if len(target_candidates) != 1:
                continue
            _target_start, target_name, target_region_block = target_candidates[0]
            if region_schema_key(extract_item_type(target_region_block) or "") not in SMART_FILTER_ALLOWED_RESULTS_REGION_TYPES:
                continue

            plan, plan_error, plan_required = smart_filter_generation_plan_state(path, text, validation_context)
            component_label = f"region '{region_name}' type 'smartFilters'"
            if plan_error:
                issues.append(_smart_filter_plan_issue(
                    path, text, region_start, "SMART_FILTER_SECURITY_SCOPE_MATCH_REQUIRED_001", component_label,
                    f"generation plan is invalid: {plan_error}"
                ))
            elif plan is None:
                if plan_required:
                    issues.append(_smart_filter_plan_issue(
                        path, text, region_start, "SMART_FILTER_SECURITY_SCOPE_MATCH_REQUIRED_001", component_label,
                        "requires a structured security_scope evidence section"
                    ))
            else:
                security_plan = _smart_filter_plan_section(plan, "security_scope", "securityScope", "security")
                planned_auth = _smart_filter_plan_value(security_plan, "authorization_scheme", "authorizationScheme", "authorization")
                planned_condition = _smart_filter_plan_value(security_plan, "server_side_condition", "serverSideCondition", "condition")
                public_scope = _smart_filter_plan_value(security_plan, "public_scope", "publicScope", "same_public_scope")
                base_dataset_flags = (
                    "suggestions_use_base_dataset",
                    "refinements_use_base_dataset",
                    "counts_use_base_dataset",
                    "results_use_base_dataset",
                )
                if (smart_authorization := component_authorization_scheme(region_block) or page_authorization) is None and public_scope is not True:
                    issues.append(_smart_filter_plan_issue(
                        path, text, region_start, "SMART_FILTER_SECURITY_SCOPE_MATCH_REQUIRED_001", component_label,
                        "security_scope must explicitly record public_scope: true when authorization is intentionally absent"
                    ))
                if smart_authorization is not None and not _smart_filter_plan_is_nonempty(planned_auth):
                    issues.append(_smart_filter_plan_issue(
                        path, text, region_start, "SMART_FILTER_SECURITY_SCOPE_MATCH_REQUIRED_001", component_label,
                        "security_scope must record the effective authorization scheme"
                    ))
                if not _smart_filter_plan_is_nonempty(planned_condition) and public_scope is not True:
                    issues.append(_smart_filter_plan_issue(
                        path, text, region_start, "SMART_FILTER_SECURITY_SCOPE_MATCH_REQUIRED_001", component_label,
                        "security_scope must record the effective server-side condition or explicit public scope"
                    ))
                for flag in base_dataset_flags:
                    if _smart_filter_plan_value(security_plan, flag, re.sub(r"_([a-z])", lambda match: match.group(1).upper(), flag)) is not True:
                        issues.append(_smart_filter_plan_issue(
                            path, text, region_start, "SMART_FILTER_SECURITY_SCOPE_MATCH_REQUIRED_001", component_label,
                            f"security_scope.{flag} must be true"
                        ))

            smart_authorization = component_authorization_scheme(region_block) or page_authorization
            base_authorization = component_authorization_scheme(target_region_block) or page_authorization
            smart_condition = canonical_server_side_condition(region_block)
            base_condition = canonical_server_side_condition(target_region_block)
            if smart_authorization != base_authorization or smart_condition != base_condition:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start)}: "
                    "SMART_FILTER_SECURITY_SCOPE_MATCH_REQUIRED_001 "
                    f"region '{region_name}' and filtered base region '{target_name}' must have the same effective "
                    "authorizationScheme and exact serverSideCondition"
                )

            expected_columns, projection_error, source_kind = source_projection_columns(
                smart_filter_result_source_blocks(target_region_block),
                validation_context,
            )
            plan_projection = _smart_filter_plan_explicit_projection(plan) if plan is not None and not plan_error else []
            if (
                source_kind == "table"
                and (projection_error or not expected_columns)
                and plan_projection
            ):
                expected_columns = plan_projection
                projection_error = None
                source_kind = "generation_plan"
            normalized_expected_columns = {
                normalize_sql_identifier(column)
                for column in expected_columns
                if normalize_sql_identifier(column)
            }

            for filter_offset, filter_name, filter_block, filter_kind, filter_authorization, filter_condition in smart_filter_refinements(
                region_block, smart_authorization, smart_condition
            ):
                if extract_item_type(filter_block) == "search":
                    continue
                if filter_authorization != base_authorization or filter_condition != base_condition:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, region_start + filter_offset)}: "
                        "SMART_FILTER_SECURITY_SCOPE_MATCH_REQUIRED_001 "
                        f"region '{region_name}' refinement filter '{filter_name}' must inherit or exactly match "
                        f"the security scope of filtered base region '{target_name}'"
                    )

                filter_blocks = extract_top_level_blocks(filter_block)
                filter_source_meta = filter_blocks.get("source")
                database_column = ""
                source_issue_offset = region_start + filter_offset
                if filter_source_meta:
                    source_offset, filter_source_block = filter_source_meta
                    source_issue_offset += source_offset
                    database_column = next(
                        (
                            clean_scalar_value(prop_value)
                            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(filter_source_block)
                            if prop_name == "databaseColumn"
                        ),
                        "",
                    )
                normalized_database_column = normalize_sql_identifier(database_column)
                if filter_kind == "filterGroup" and filter_source_meta is None:
                    # Groups may only provide labels/suggestions; their checkboxes own columns.
                    pass
                elif not normalized_database_column or "{{" in database_column:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, source_issue_offset)}: "
                        "SMART_FILTER_REFINEMENT_SOURCE_SCOPE_REQUIRED_001 "
                        f"region '{region_name}' refinement filter '{filter_name}' must define one explicit "
                        "source.databaseColumn from the filtered base projection"
                    )
                elif projection_error or source_kind == "none" or not normalized_expected_columns:
                    reason = projection_error or "the target base source projection cannot be proven locally"
                    issues.append(
                        f"{display_path(path)}:{line_no(text, source_issue_offset)}: "
                        "SMART_FILTER_REFINEMENT_SOURCE_SCOPE_REQUIRED_001 "
                        f"region '{region_name}' refinement filter '{filter_name}' cannot verify "
                        f"source.databaseColumn against the filtered base region: {reason}"
                    )
                elif normalized_database_column not in normalized_expected_columns:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, source_issue_offset)}: "
                        "SMART_FILTER_REFINEMENT_SOURCE_SCOPE_REQUIRED_001 "
                        f"region '{region_name}' refinement filter '{filter_name}' source.databaseColumn "
                        f"'{database_column}' is not projected by filtered base region '{target_name}'"
                    )

                lov_meta = filter_blocks.get("lov")
                if lov_meta:
                    lov_offset, lov_block = lov_meta
                    lov_props = {
                        prop_name: clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(lov_block)
                    }
                    lov_names = {
                        prop_name for prop_name, _prop_offset in extract_immediate_brace_property_names(lov_block)
                    }
                    lov_type = re.sub(r"[^a-z0-9]", "", lov_props.get("type", "").lower())
                    independent_lov_types = {"shared", "sharedcomponent", "sqlquery", "functionbody"}
                    allowed_lov_types = {"distinctvalues", "static", "staticvalues", "basederived", "base"}
                    unsafe_lov_shape = (
                        lov_type in independent_lov_types
                        or not lov_type
                        or lov_type not in allowed_lov_types
                        or any("sql" in name.lower() or "function" in name.lower() or "shared" in name.lower() for name in lov_names)
                    )
                    if unsafe_lov_shape:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, region_start + filter_offset + lov_offset)}: "
                            "SMART_FILTER_REFINEMENT_SOURCE_SCOPE_REQUIRED_001 "
                            f"region '{region_name}' refinement filter '{filter_name}' must derive dynamic LOV "
                            "values from the filtered base dataset with lov.type distinctValues or use static authored "
                            "values; independent shared, SQL-query, and function-body LOV sources are not permitted; "
                            "unknown LOV source shapes are also blocked"
                        )

                suggestions_meta = filter_blocks.get("suggestions")
                if suggestions_meta:
                    suggestions_offset, suggestions_block = suggestions_meta
                    suggestion_props = {
                        prop_name: clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(suggestions_block)
                    }
                    suggestion_names = {
                        prop_name for prop_name, _prop_offset in extract_immediate_brace_property_names(suggestions_block)
                    }
                    suggestion_type = re.sub(
                        r"[^a-z0-9]", "", suggestion_props.get("type", "").lower()
                    )
                    allowed_suggestion_types = {"static", "staticvalues", "distinctvalues", "basederived", "base", "native"}
                    unsafe_suggestion_shape = (
                        suggestion_type in {"sqlquery", "functionbody", "shared", "sharedcomponent"}
                        or not suggestion_type
                        or suggestion_type not in allowed_suggestion_types
                        or any("sql" in name.lower() or "function" in name.lower() or "shared" in name.lower() for name in suggestion_names)
                    )
                    if unsafe_suggestion_shape:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, region_start + filter_offset + suggestions_offset)}: "
                            "SMART_FILTER_REFINEMENT_SOURCE_SCOPE_REQUIRED_001 "
                            f"region '{region_name}' refinement filter '{filter_name}' must use dynamic base-derived "
                            "or static authored suggestions; an independent suggestions.sqlQuery is not permitted"
                        )

    return issues


def lint_smart_filter_settings_contract(ctx: LintContext) -> list[str]:
    """Validate compiler-supported Smart Filters settings and ticket values."""
    issues: list[str] = []
    runtime_component_map = ctx.runtime_component_map
    roots = parse_apx_component_tree(ctx.text)
    fixed_ticket_values = {
        "maxSuggestionChips": "100",
        "moreFiltersSuggestionChip": "true",
        "compactNosThreshold": "10000",
    }
    ticket_setting_names = {
        *fixed_ticket_values,
        "showTotalRowCount",
        "totalRowCountLabel",
    }

    for node in walk_apx_ast(roots):
        record = None
        failure = None
        if isinstance(runtime_component_map, dict):
            record, failure = resolve_apx_component_record(node, runtime_component_map)
            node.compiler_record = record

        if node.keyword != "region":
            continue
        values = apx_component_property_values(node)
        if values.get("type") != "NATIVE_SMART_FILTERS":
            continue

        component_label = f"region '{node.identifier}' type 'smartFilters'"
        plan, plan_error, plan_required = smart_filter_generation_plan_state(ctx.path, ctx.text, ctx.validation_context)
        if plan_error:
            issues.append(_smart_filter_plan_issue(
                ctx.path, ctx.text, node.start_offset, "SMART_FILTER_SETTINGS_COMPILER_EVIDENCE_REQUIRED_001", component_label,
                f"generation plan is invalid: {plan_error}"
            ))
        elif plan is None:
            if plan_required:
                issues.append(_smart_filter_plan_issue(
                    ctx.path, ctx.text, node.start_offset, "SMART_FILTER_SETTINGS_COMPILER_EVIDENCE_REQUIRED_001", component_label,
                    "requires a structured settings_contract evidence section"
                ))
        else:
            settings_plan = _smart_filter_plan_section(plan, "settings_contract", "settingsContract", "settings")
            settings_evidence = _smart_filter_plan_value(
                settings_plan, "compiler_evidence", "compilerEvidence", "property_evidence", "propertyEvidence"
            )
            settings_records = _smart_filter_plan_evidence_records(settings_evidence)
            for property_name in ("maxSuggestionChips", "moreFiltersSuggestionChip", "compactNosThreshold", "showTotalRowCount"):
                record = settings_records.get(property_name)
                if not _smart_filter_plan_evidence_is_resolved(record):
                    issues.append(_smart_filter_plan_issue(
                        ctx.path, ctx.text, node.start_offset, "SMART_FILTER_SETTINGS_COMPILER_EVIDENCE_REQUIRED_001", component_label,
                        f"settings_contract compiler evidence for {property_name} is missing or unresolved"
                    ))
        settings_meta = extract_top_level_blocks(node.text).get("settings")
        issue_offset = node.start_offset + (settings_meta[0] if settings_meta else 0)

        # Template shells are incomplete drafting examples, not generated pages.
        if ctx.path.suffix.lower() != ".apx" and not settings_meta:
            continue

        if not isinstance(runtime_component_map, dict):
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, issue_offset)}: "
                f"SMART_FILTER_SETTINGS_COMPILER_EVIDENCE_REQUIRED_001 {component_label} settings require "
                "active compiler metadata even when omitted; stop with Missing Inputs"
            )
            continue

        if record is None:
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, issue_offset)}: "
                f"SMART_FILTER_SETTINGS_COMPILER_EVIDENCE_REQUIRED_001 {component_label} settings could not be "
                f"resolved to one compiler component record ({failure or 'unknown resolution failure'}); "
                "stop with Missing Inputs"
            )
            continue

        groups = record.get("groups")
        compiler_settings = groups.get("settings") if isinstance(groups, dict) else None
        compiler_setting_records = [
            prop for prop in (compiler_settings if isinstance(compiler_settings, list) else []) if isinstance(prop, dict)
        ]
        # Generic region metadata exposes a plug-in attribute sink without the
        # native plug-in inventory. Its absence cannot establish lack of support.
        if not compiler_setting_records and record.get("pluginApiExpression"):
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, issue_offset)}: "
                f"SMART_FILTER_SETTINGS_COMPILER_EVIDENCE_REQUIRED_001 {component_label} active compiler "
                f"metadata build {runtime_component_map.get('buildID') or 'unknown'} exposes a plug-in "
                "attribute sink but no native plug-in settings inventory; resolve target-build "
                "compiler evidence before accepting or rejecting these settings; stop with Missing Inputs; "
                "omitting these settings does not satisfy the contract"
            )
            continue
        compiler_setting_names = {
            prop.get("propertyName")
            for prop in compiler_setting_records
            if isinstance(prop.get("propertyName"), str)
        }
        emitted_settings = node.group_properties.get("settings", {})
        show_total_meta = emitted_settings.get("showTotalRowCount")
        show_total_value = clean_scalar_value(show_total_meta.value).lower() if show_total_meta else None
        required_setting_names = {*fixed_ticket_values, "showTotalRowCount"}
        if show_total_value == "true":
            required_setting_names.add("totalRowCountLabel")
        build_id = str(runtime_component_map.get("buildID") or "unknown")
        unsupported_required = required_setting_names - compiler_setting_names
        if unsupported_required:
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, issue_offset)}: "
                f"SMART_FILTER_SETTINGS_UNSUPPORTED_001 {component_label} required settings are not supported "
                f"by active compiler metadata build {build_id}: {', '.join(sorted(unsupported_required))}; "
                "stop with Missing Inputs; omitting these settings does not satisfy the contract"
            )
        supported_ticket_names = compiler_setting_names & ticket_setting_names
        if not settings_meta:
            if supported_ticket_names:
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, issue_offset)}: "
                    "SMART_FILTER_SETTINGS_VALUE_REQUIRED_001 "
                    f"{component_label} must emit compiler-supported ticket settings for build "
                    f"{runtime_component_map.get('buildID') or 'unknown'}: "
                    f"{', '.join(sorted(supported_ticket_names))}"
                )
            continue

        settings_condition_values = dict(values)
        for property_name, property_meta in emitted_settings.items():
            boolean_value = clean_scalar_value(property_meta.value).lower()
            if boolean_value in {"true", "false"}:
                settings_condition_values[property_name] = "Y" if boolean_value == "true" else "N"

        active_settings = [
            prop
            for prop in compiler_setting_records
            if evaluate_metadata_condition(prop.get("dependsOn"), settings_condition_values) != "false"
        ]
        if not active_settings:
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, issue_offset)}: "
                f"SMART_FILTER_SETTINGS_UNSUPPORTED_001 {component_label} must not emit settings; "
                f"active compiler metadata build {build_id} exposes no settings group for NATIVE_SMART_FILTERS"
            )
            continue

        settings_by_name: dict[str, list[dict[str, Any]]] = {}
        for prop in active_settings:
            property_name = prop.get("propertyName")
            if isinstance(property_name, str):
                settings_by_name.setdefault(property_name, []).append(prop)

        inactive_required = (required_setting_names & compiler_setting_names) - set(settings_by_name)
        if inactive_required:
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, issue_offset)}: "
                f"SMART_FILTER_SETTINGS_UNSUPPORTED_001 {component_label} required settings are inactive "
                f"in compiler metadata build {build_id}: {', '.join(sorted(inactive_required))}; "
                "stop with Missing Inputs"
            )

        for property_name, property_meta in emitted_settings.items():
            if property_name == "totalRowCountLabel" and show_total_value == "false":
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, property_meta.offset)}: "
                    "SMART_FILTER_SETTINGS_VALUE_REQUIRED_001 "
                    f"{component_label} must omit settings.totalRowCountLabel when showTotalRowCount is false"
                )
                continue
            candidates = settings_by_name.get(property_name, [])
            if not candidates:
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, property_meta.offset)}: "
                    f"SMART_FILTER_SETTINGS_UNSUPPORTED_001 {component_label} settings.{property_name} is not "
                    f"supported by active compiler metadata build {build_id}"
                )
                continue
            if not filter_records_by_condition(candidates, settings_condition_values, "dependsOn"):
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, property_meta.offset)}: "
                    f"SMART_FILTER_SETTINGS_UNSUPPORTED_001 {component_label} settings.{property_name} is inactive "
                    f"under the current component properties in compiler metadata build {build_id}"
                )

        active_ticket_names = set(settings_by_name) & ticket_setting_names
        for property_name, expected_value in fixed_ticket_values.items():
            if property_name not in active_ticket_names:
                continue
            property_meta = emitted_settings.get(property_name)
            actual_value = clean_scalar_value(property_meta.value) if property_meta else None
            if actual_value != expected_value:
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, property_meta.offset if property_meta else issue_offset)}: "
                    "SMART_FILTER_SETTINGS_VALUE_REQUIRED_001 "
                    f"{component_label} settings.{property_name} must be {expected_value} for build {build_id}"
                )

        if "showTotalRowCount" in active_ticket_names and show_total_value not in {"true", "false"}:
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, show_total_meta.offset if show_total_meta else issue_offset)}: "
                "SMART_FILTER_SETTINGS_VALUE_REQUIRED_001 "
                f"{component_label} settings.showTotalRowCount must be explicitly true or false for build {build_id}"
            )

        total_label_meta = emitted_settings.get("totalRowCountLabel")
        if show_total_value == "true" and "totalRowCountLabel" in active_ticket_names:
            total_label_value = clean_scalar_value(total_label_meta.value) if total_label_meta else None
            if total_label_value != "Results":
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, total_label_meta.offset if total_label_meta else issue_offset)}: "
                    "SMART_FILTER_SETTINGS_VALUE_REQUIRED_001 "
                    f"{component_label} settings.totalRowCountLabel must be Results when showTotalRowCount is true"
                )
    return issues


def lint_default_guidance_layer(path: Path, text: str) -> list[str]:
    """Require concise guidance on visible search/filter/form input items."""
    issues: list[str] = []
    if re.match(r"p0*9999-", path.name, re.IGNORECASE) or "login" in path.stem.lower():
        return issues
    guidance_item_types = {
        "checkbox",
        "checkboxgroup",
        "datepicker",
        "numberfield",
        "radiogroup",
        "selectlist",
        "switch",
        "textarea",
        "textfield",
    }
    for item_start, item_name, item_block in find_component_blocks(text, "pageItem"):
        item_type = (extract_item_type(item_block) or "").lower()
        if item_type not in guidance_item_types:
            continue
        top_level_blocks = extract_top_level_blocks(item_block)
        if "help" in top_level_blocks or "comments" in top_level_blocks:
            continue
        appearance_meta = top_level_blocks.get("appearance")
        if appearance_meta:
            _appearance_offset, appearance_block = appearance_meta
            appearance_props = {
                prop_name: clean_scalar_value(prop_value).lower()
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(appearance_block)
            }
            if appearance_props.get("template") == "@/hidden":
                continue
        label_meta = top_level_blocks.get("label")
        if not label_meta:
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, item_start + label_meta[0])}: "
            f"DEFAULT_GUIDANCE_LAYER_REQUIRED_001 pageItem '{item_name}' type '{item_type}' must include concise "
            "help or comments guidance for generated user-facing inputs"
        )

    for help_match in re.finditer(r"(?m)^(\s*)helpText\s*:\s*(.+?)\s*$", text):
        help_text = clean_scalar_value(help_match.group(2)).strip().lower()
        if help_text in GENERIC_HELP_TEXT_VALUES:
            issues.append(
                f"{display_path(path)}:{line_no(text, help_match.start(2))}: "
                "GENERIC_HELP_TEXT_FORBIDDEN_001 generated item helpText is boilerplate; write field-specific "
                "guidance that explains the value, validation expectation, or business meaning"
            )
    return issues


def lint_drawer_default_position_contract(path: Path, text: str) -> list[str]:
    """Require default report-to-form drawer pages to use the end/right drawer position."""
    issues: list[str] = []
    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        top_level_blocks = extract_top_level_blocks(page_block)
        appearance_meta = top_level_blocks.get("appearance")
        if not appearance_meta:
            continue
        appearance_offset, appearance_block = appearance_meta
        appearance_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(appearance_block)
        }
        if appearance_props.get("pageMode") != "modalDialog" or appearance_props.get("dialogTemplate") != "@/drawer":
            continue
        if "explicit alternate drawer position" in page_block.lower():
            continue
        option_entries = extract_template_option_entries(appearance_block)
        cleaned_options = {option_value.strip().rstrip(",") for option_value, _option_offset in option_entries}
        if "js-dialog-class-t-Drawer--pullOutEnd" not in cleaned_options:
            issues.append(
                f"{display_path(path)}:{line_no(text, page_start + appearance_offset)}: "
                f"DRAWER_POSITION_DEFAULT_END_REQUIRED_001 page '{page_name}' drawer form must explicitly include "
                "js-dialog-class-t-Drawer--pullOutEnd in appearance.templateOptions unless the requirements "
                "explicitly select another drawer position"
            )
        for option_value, option_offset in option_entries:
            option_value = option_value.strip().rstrip(",")
            if option_value in {
                "js-dialog-class-t-Drawer--pullOutBottom",
                "js-dialog-class-t-Drawer--pullOutStart",
                "js-dialog-class-t-Drawer--pullOutTop",
            }:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + appearance_offset + option_offset)}: "
                    f"DRAWER_POSITION_DEFAULT_END_REQUIRED_001 page '{page_name}' drawer form uses {option_value}; "
                    "report-to-form CRUD drawers must use js-dialog-class-t-Drawer--pullOutEnd unless the requirements "
                    "explicitly select another drawer position"
                )
    return issues


def lint_faceted_search_entity_display_contract(path: Path, text: str) -> list[str]:
    """Reject raw PK/FK ID entity facets when no user-facing display mapping is present."""
    issues: list[str] = []
    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if region_schema_key(extract_item_type(region_block) or "") != "facetedSearch":
                continue
            for facet_offset, facet_name, facet_block in find_immediate_component_blocks(region_block, "facet"):
                source_meta = extract_top_level_blocks(facet_block).get("source")
                if not source_meta:
                    continue
                source_offset, source_block = source_meta
                source_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                }
                database_column_meta = source_props.get("databaseColumn")
                if not database_column_meta:
                    continue
                database_column, database_column_offset = database_column_meta
                normalized_column = normalize_sql_identifier(database_column)
                if not normalized_column.endswith("_id"):
                    continue
                label_text = ""
                label_meta = extract_top_level_blocks(facet_block).get("label")
                if label_meta:
                    _label_offset, label_block = label_meta
                    label_props = {
                        prop_name: clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(label_block)
                    }
                    label_text = label_props.get("label", "")
                if re.search(r"\bid\b", label_text, re.IGNORECASE):
                    continue
                lov_meta = extract_top_level_blocks(facet_block).get("lov")
                if not lov_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + source_offset + database_column_offset)}: "
                        f"FACET_ENTITY_ID_DISPLAY_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                        f"facet '{facet_name}' filters on {database_column}; use a display LOV or projected display "
                        "column for user-facing entity facets"
                    )
                    continue
                _lov_offset, lov_block = lov_meta
                lov_props = {
                    prop_name: clean_scalar_value(prop_value)
                    for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(lov_block)
                }
                if lov_props.get("type") == "distinctValues" and not any(
                    prop_name in lov_props for prop_name in ("listOfValues", "lov", "sharedComponent")
                ):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + source_offset + database_column_offset)}: "
                        f"FACET_ENTITY_ID_DISPLAY_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                        f"facet '{facet_name}' exposes raw ID values from {database_column}; use a LOV/display mapping "
                        "such as PRODUCT_NAME -> PRODUCT_ID or STORE_NAME -> STORE_ID"
                    )
    return issues


FACET_SOURCE_DATA_TYPES = {"date", "number"}
FACET_LIST_ENTRY_TYPES = {"checkboxGroup", "radioGroup"}
FACET_MAX_DISPLAYED_MIN = 5
FACET_MAX_DISPLAYED_MAX = 15
FACET_MAX_DISPLAYED_DEFAULT = 10
HIGH_CARDINALITY_FACET_TERMS = {
    "ASSIGNEE",
    "CONTACT",
    "CUSTOMER",
    "EMAIL",
    "EMPLOYEE",
    "FULL_NAME",
    "ITEM",
    "NAME",
    "OWNER",
    "PERSON",
    "PRODUCT",
    "SKU",
    "STORE",
    "SUPPLIER",
    "USER",
    "VENDOR",
}
LOW_CARDINALITY_FACET_TERMS = {
    "CHANNEL",
    "FLAG",
    "GENDER",
    "PRIORITY",
    "STATE",
    "STATUS",
    "TYPE",
}


def facet_likely_high_cardinality(facet_name: str, database_column: str, label_text: str) -> bool:
    """Return true for facets that should expose value filtering immediately."""
    haystack = " ".join(
        normalize_sql_identifier(value)
        for value in (facet_name, database_column, label_text)
        if value
    )
    tokens = set(re.split(r"[^A-Z0-9]+", haystack))
    if tokens & LOW_CARDINALITY_FACET_TERMS:
        return False
    if tokens & HIGH_CARDINALITY_FACET_TERMS:
        return True
    return any(term in haystack for term in HIGH_CARDINALITY_FACET_TERMS)


def lint_faceted_search_source_data_type_contract(path: Path, text: str) -> list[str]:
    """Require runtime-safe facet source data types for range/date/numeric filters."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if region_schema_key(extract_item_type(region_block) or "") != "facetedSearch":
                continue
            for facet_offset, facet_name, facet_block in find_immediate_component_blocks(region_block, "facet"):
                facet_props = {
                    prop_name: clean_scalar_value(prop_value)
                    for prop_name, prop_value, _prop_offset in extract_immediate_property_values(facet_block)
                }
                facet_type = facet_props.get("type", "")
                source_meta = extract_top_level_blocks(facet_block).get("source")
                if not source_meta:
                    continue
                source_offset, source_block = source_meta
                source_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                }
                database_column_meta = source_props.get("databaseColumn")
                if not database_column_meta:
                    continue
                database_column, database_column_offset = database_column_meta
                data_type_meta = source_props.get("dataType")
                normalized_column = normalize_sql_identifier(database_column)
                date_like_column = bool(
                    re.search(r"(^|_)(DATE|DATETIME|TIMESTAMP|TIME|CREATED_AT|UPDATED_AT)($|_)", normalized_column)
                )
                if not data_type_meta and (facet_type == "range" or date_like_column):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + source_offset + database_column_offset)}: "
                        f"FACET_SOURCE_DATA_TYPE_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                        f"facet '{facet_name}' source.databaseColumn {database_column} must define source.dataType; "
                        "date/time facets must use date, numeric facets must use number, and string facets should omit "
                        "source.dataType instead of emitting varchar2"
                    )
                    continue
                if not data_type_meta:
                    continue
                data_type, data_type_offset = data_type_meta
                if data_type not in FACET_SOURCE_DATA_TYPES:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + source_offset + data_type_offset)}: "
                        f"FACET_SOURCE_DATA_TYPE_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                        f"facet '{facet_name}' source.dataType '{data_type}' is not runtime-safe for the facets widget; "
                        "use one exact lowercase token only when required: "
                        f"{', '.join(sorted(FACET_SOURCE_DATA_TYPES))}"
                    )
                if facet_type == "range" and data_type not in FACET_SOURCE_DATA_TYPES:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + source_offset + data_type_offset)}: "
                        f"FACET_RANGE_DATA_TYPE_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                        f"facet '{facet_name}' is a range facet over {database_column} but uses source.dataType '{data_type}'; "
                        "range facets must use number or date"
                    )
                if date_like_column and data_type != "date":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + source_offset + data_type_offset)}: "
                        f"FACET_DATE_DATA_TYPE_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                        f"facet '{facet_name}' filters date/time column {database_column} but uses source.dataType '{data_type}'; "
                        "date/time facets must use source.dataType: date, not varchar2"
                    )

    return issues


def lint_faceted_search_list_entries_contract(path: Path, text: str) -> list[str]:
    """Require bounded and searchable facet value lists for discrete facets."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if region_schema_key(extract_item_type(region_block) or "") != "facetedSearch":
                continue
            for facet_offset, facet_name, facet_block in find_immediate_component_blocks(region_block, "facet"):
                facet_props = {
                    prop_name: clean_scalar_value(prop_value)
                    for prop_name, prop_value, _prop_offset in extract_immediate_property_values(facet_block)
                }
                facet_type = facet_props.get("type", "")
                if facet_type not in FACET_LIST_ENTRY_TYPES:
                    continue
                facet_blocks = extract_top_level_blocks(facet_block)
                source_meta = facet_blocks.get("source")
                database_column = ""
                source_offset = 0
                if source_meta:
                    source_offset, source_block = source_meta
                    source_props = {
                        prop_name: (clean_scalar_value(prop_value), prop_offset)
                        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                    }
                    if source_props.get("databaseColumn"):
                        database_column = source_props["databaseColumn"][0]
                label_text = ""
                label_meta = facet_blocks.get("label")
                if label_meta:
                    _label_offset, label_block = label_meta
                    label_props = {
                        prop_name: clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(label_block)
                    }
                    label_text = label_props.get("label", "")
                list_entries_meta = facet_blocks.get("listEntries")
                if not list_entries_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + source_offset)}: "
                        f"FACET_LIST_ENTRIES_LIMIT_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                        f"facet '{facet_name}' type '{facet_type}' must define listEntries.maxDisplayedEntries with a "
                        f"sensible value such as {FACET_MAX_DISPLAYED_DEFAULT} so long value lists render with Show More"
                    )
                    if facet_likely_high_cardinality(facet_name, database_column, label_text):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + source_offset)}: "
                            f"FACET_VALUE_FILTER_INITIAL_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                            f"facet '{facet_name}' is likely high-cardinality and must define "
                            "listEntries.displayFilterInitially: true"
                        )
                    continue
                list_entries_offset, list_entries_block = list_entries_meta
                list_entries_props = block_property_map(list_entries_block)
                max_displayed_meta = list_entries_props.get("maxDisplayedEntries")
                if not max_displayed_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + list_entries_offset)}: "
                        f"FACET_LIST_ENTRIES_LIMIT_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                        f"facet '{facet_name}' type '{facet_type}' must define listEntries.maxDisplayedEntries with a "
                        f"sensible value such as {FACET_MAX_DISPLAYED_DEFAULT}"
                    )
                else:
                    max_displayed, max_displayed_offset = max_displayed_meta
                    try:
                        max_displayed_value = int(clean_scalar_value(max_displayed))
                    except ValueError:
                        max_displayed_value = -1
                    if max_displayed_value < FACET_MAX_DISPLAYED_MIN or max_displayed_value > FACET_MAX_DISPLAYED_MAX:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + list_entries_offset + max_displayed_offset)}: "
                            f"FACET_LIST_ENTRIES_LIMIT_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                            f"facet '{facet_name}' listEntries.maxDisplayedEntries must be between "
                            f"{FACET_MAX_DISPLAYED_MIN} and {FACET_MAX_DISPLAYED_MAX}; use "
                            f"{FACET_MAX_DISPLAYED_DEFAULT} when no stronger UX evidence exists"
                        )
                if facet_likely_high_cardinality(facet_name, database_column, label_text):
                    display_filter_meta = list_entries_props.get("displayFilterInitially")
                    display_filter_value = clean_scalar_value(display_filter_meta[0]) if display_filter_meta else ""
                    if display_filter_value != "true":
                        issue_offset = list_entries_offset + (display_filter_meta[1] if display_filter_meta else 0)
                        issues.append(
                            f"{display_path(path)}:{line_no(text, page_start + region_offset + facet_offset + issue_offset)}: "
                            f"FACET_VALUE_FILTER_INITIAL_REQUIRED_001 page '{page_name}' facetedSearch region '{region_name}' "
                            f"facet '{facet_name}' is likely high-cardinality and must define "
                            "listEntries.displayFilterInitially: true"
                        )

    return issues


def lint_report_sql_html_literals(path: Path, text: str) -> list[str]:
    """Reject HTML markup embedded in report SQL projection literals."""
    issues: list[str] = []
    report_region_types = {"badge", "classicReport", "interactiveReport", "interactiveGrid", "contentRow", "mediaList", "metricCard"}
    html_pattern = re.compile(r"(?is)<\s*/?\s*(a|button|div|em|i|img|li|p|span|strong|table|td|tr|ul)\b|class\s*=|style\s*=")
    for region_start, region_name, region_block in find_component_blocks(text, "region"):
        region_type = extract_item_type(region_block) or ""
        region_type_key = region_schema_key(region_type)
        if region_type_key not in report_region_types:
            continue
        top_level_blocks = extract_top_level_blocks(region_block)
        source_meta = top_level_blocks.get("source")
        if not source_meta:
            continue
        source_offset, source_block = source_meta
        sql_query = extract_fenced_property_body(source_block, "sqlQuery") or ""
        if html_pattern.search(sql_query):
            issues.append(
                f"{display_path(path)}:{line_no(text, region_start + source_offset)}: "
                f"REPORT_SQL_HTML_LITERAL_FORBIDDEN_001 region '{region_name}' type '{region_type}' source.sqlQuery "
                "must not project HTML literals; use declarative column/link/rendering attributes"
            )
    return issues


def lint_breadcrumb_parent_scope(path: Path, text: str) -> list[str]:
    """Reject breadcrumb entry parentEntry in execution instead of appearance."""
    issues: list[str] = []
    for breadcrumb_start, breadcrumb_name, breadcrumb_block in find_component_blocks(text, "breadcrumb"):
        for entry_offset, entry_name, entry_block in find_immediate_component_blocks(breadcrumb_block, "entry"):
            execution_meta = extract_top_level_blocks(entry_block).get("execution")
            if not execution_meta:
                continue
            execution_offset, execution_block = execution_meta
            for prop_name, _prop_value, prop_offset in extract_immediate_brace_property_values(execution_block):
                if prop_name != "parentEntry":
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, breadcrumb_start + entry_offset + execution_offset + prop_offset)}: "
                    f"BREADCRUMB_RULE_PARENT_SCOPE_001 breadcrumb '{breadcrumb_name}' entry '{entry_name}' must place "
                    "parentEntry in appearance, not execution"
                )
    return issues


def lint_image_upload_legacy_properties(path: Path, text: str) -> list[str]:
    """Reject stale image-upload properties that the current compiler contract does not expose."""
    issues: list[str] = []
    for item_start, item_name, item_block in find_component_blocks(text, "pageItem"):
        if extract_item_type(item_block) != "imageUpload":
            continue
        component_label = f"pageItem '{item_name}' type 'imageUpload'"
        top_level_blocks = extract_top_level_blocks(item_block)
        settings_meta = top_level_blocks.get("settings")
        if settings_meta:
            settings_offset, settings_block = settings_meta
            for prop_name, _prop_value, prop_offset in extract_property_values(settings_block):
                if prop_name not in IMAGE_UPLOAD_LEGACY_SETTINGS:
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, item_start + settings_offset + prop_offset)}: "
                    f"IMAGE_UPLOAD_LEGACY_PROPERTY_FORBIDDEN_001 {component_label} must not emit stale settings."
                    f"{prop_name}"
                )
        source_meta = top_level_blocks.get("source")
        if source_meta:
            source_offset, source_block = source_meta
            for prop_name, _prop_value, prop_offset in extract_property_values(source_block):
                if prop_name not in IMAGE_UPLOAD_LEGACY_SOURCE_PROPERTIES:
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, item_start + source_offset + prop_offset)}: "
                    f"IMAGE_UPLOAD_LEGACY_PROPERTY_FORBIDDEN_001 {component_label} must not emit stale source."
                    f"{prop_name}"
                )
        for block_name in ("display", "storage"):
            block_meta = top_level_blocks.get(block_name)
            if not block_meta:
                continue
            block_offset, _block = block_meta
            issues.append(
                f"{display_path(path)}:{line_no(text, item_start + block_offset)}: "
                f"IMAGE_UPLOAD_LEGACY_PROPERTY_FORBIDDEN_001 {component_label} must not emit file-upload "
                f"{block_name} block"
            )
    return issues


def lint_file_upload_display_storage_contract(path: Path, text: str) -> list[str]:
    """Validate the compiler/export-proven grouped file-upload attribute shape."""
    issues: list[str] = []

    for item_start, item_name, item_block in find_component_blocks(text, "pageItem"):
        if extract_item_type(item_block) != "fileUpload":
            continue

        component_label = f"pageItem '{item_name}' type 'fileUpload'"
        top_level_blocks = extract_top_level_blocks(item_block)
        settings_meta = top_level_blocks.get("settings")
        if settings_meta:
            settings_offset, settings_block = settings_meta
            settings_props = extract_immediate_brace_property_values(settings_block)
            if not settings_props:
                issues.append(
                    f"{display_path(path)}:{line_no(text, item_start + settings_offset)}: "
                    f"FILE_UPLOAD_LEGACY_SETTINGS_FORBIDDEN_001 {component_label} must use display/storage "
                    "grouped properties instead of settings"
                )
            for prop_name, _prop_value, prop_offset in settings_props:
                rule_id = (
                    "FILE_UPLOAD_LEGACY_SETTINGS_FORBIDDEN_001"
                    if prop_name in FILE_UPLOAD_LEGACY_SETTINGS
                    else "FILE_UPLOAD_SETTINGS_BLOCK_FORBIDDEN_001"
                )
                issues.append(
                    f"{display_path(path)}:{line_no(text, item_start + settings_offset + prop_offset)}: "
                    f"{rule_id} {component_label} must use display/storage "
                    f"grouped properties instead of settings.{prop_name}"
                )

        display_meta = top_level_blocks.get("display")
        if not display_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, item_start)}: "
                f"FILE_UPLOAD_DISPLAY_MODE_REQUIRED_001 {component_label} must explicitly define "
                "display.displayAs; use blockDropzone when the user does not request another supported mode"
            )
        else:
            display_offset, display_block = display_meta
            display_properties = extract_immediate_brace_property_values(display_block)
            display_property_names = {prop_name for prop_name, _value, _offset in display_properties}
            if "displayAs" not in display_property_names:
                issues.append(
                    f"{display_path(path)}:{line_no(text, item_start + display_offset)}: "
                    f"FILE_UPLOAD_DISPLAY_MODE_REQUIRED_001 {component_label} must explicitly define "
                    "display.displayAs; use blockDropzone when the user does not request another supported mode"
                )
            display_mode = next(
                (clean_scalar_value(prop_value) for prop_name, prop_value, _offset in display_properties
                 if prop_name == "displayAs"),
                "",
            )
            for prop_name, prop_value, prop_offset in display_properties:
                cleaned_value = clean_scalar_value(prop_value)
                if prop_name not in FILE_UPLOAD_DISPLAY_PROPERTIES:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, item_start + display_offset + prop_offset)}: "
                        f"FILE_UPLOAD_DISPLAY_PROPERTY_FORBIDDEN_001 {component_label} display.{prop_name} "
                        "is not in the proven file-upload display contract"
                    )
                    continue
                if "{{" in cleaned_value and "}}" in cleaned_value:
                    continue
                if prop_name == "displayAs" and cleaned_value not in FILE_UPLOAD_DISPLAY_AS_VALUES:
                    allowed = ", ".join(sorted(FILE_UPLOAD_DISPLAY_AS_VALUES))
                    issues.append(
                        f"{display_path(path)}:{line_no(text, item_start + display_offset + prop_offset)}: "
                        f"FILE_UPLOAD_DISPLAY_AS_VALUE_001 {component_label} display.displayAs must be one of "
                        f"{allowed}; omit displayAs for the default blockDropzone UI"
                    )
                if prop_name == "captureUsing" and cleaned_value not in FILE_UPLOAD_CAPTURE_USING_VALUES:
                    allowed = ", ".join(sorted(FILE_UPLOAD_CAPTURE_USING_VALUES))
                    issues.append(
                        f"{display_path(path)}:{line_no(text, item_start + display_offset + prop_offset)}: "
                        f"FILE_UPLOAD_CAPTURE_USING_VALUE_001 {component_label} display.captureUsing must be "
                        f"one of {allowed}; omit captureUsing when no capture source is required"
                    )
            if display_mode in {"blockDropzone", "inlineDropzone"}:
                for required_property in ("dropzoneTitle", "dropzoneDesc"):
                    if required_property not in display_property_names:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, item_start + display_offset)}: "
                            f"FILE_UPLOAD_DROPZONE_COPY_REQUIRED_001 {component_label} display.{required_property} "
                            f"is required for {display_mode}; use a user-specific value or the default fallback copy"
                        )

        storage_meta = top_level_blocks.get("storage")
        if storage_meta:
            storage_offset, storage_block = storage_meta
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(storage_block):
                cleaned_value = clean_scalar_value(prop_value)
                if prop_name not in FILE_UPLOAD_STORAGE_PROPERTIES:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, item_start + storage_offset + prop_offset)}: "
                        f"FILE_UPLOAD_STORAGE_PROPERTY_FORBIDDEN_001 {component_label} storage.{prop_name} "
                        "is not in the proven file-upload storage contract"
                    )
                    continue
                if "{{" in cleaned_value and "}}" in cleaned_value:
                    continue
                if prop_name == "type" and cleaned_value not in FILE_UPLOAD_STORAGE_TYPE_VALUES:
                    allowed = ", ".join(sorted(FILE_UPLOAD_STORAGE_TYPE_VALUES))
                    issues.append(
                        f"{display_path(path)}:{line_no(text, item_start + storage_offset + prop_offset)}: "
                        f"FILE_UPLOAD_STORAGE_TYPE_VALUE_001 {component_label} storage.type must be one of {allowed}"
                    )
                if prop_name == "fileTypes" and ("[" in cleaned_value or "]" in cleaned_value):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, item_start + storage_offset + prop_offset)}: "
                        f"FILE_UPLOAD_FILE_TYPES_TEXT_REQUIRED_001 {component_label} storage.fileTypes must be a "
                        "free-form comma-delimited text scalar such as image/png,video/*"
                    )
                if prop_name == "maxFileSize":
                    if not re.fullmatch(r"[1-9][0-9]*", cleaned_value):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, item_start + storage_offset + prop_offset)}: "
                            f"FILE_UPLOAD_MAX_FILE_SIZE_KB_REQUIRED_001 {component_label} storage.maxFileSize must "
                            "be a positive integer number of KB"
                        )

    return issues


def lint_static_id_where_lower(path: Path, text: str) -> list[str]:
    """Validate lower-kebab static IDs in locations that require them."""
    issues: list[str] = []
    bare_cmp_pattern = re.compile(
        r"(?i)\b(?P<col>(?:[A-Za-z][A-Za-z0-9_$]*\.)?[A-Za-z][A-Za-z0-9_$]*_static_id)\b\s*(?P<op>=(?!>)|!=|<>|in\s*\()"
    )
    wrapped_non_lower_pattern = re.compile(
        r"(?i)\b(?P<fn>upper|trim|nvl|coalesce)\s*\(\s*(?P<col>(?:[A-Za-z][A-Za-z0-9_$]*\.)?[A-Za-z][A-Za-z0-9_$]*_static_id)\s*\)\s*(?P<op>=(?!>)|!=|<>|in\s*\()"
    )
    lower_rhs_pattern = re.compile(
        r"(?is)\blower\s*\(\s*(?P<col>(?:[A-Za-z][A-Za-z0-9_$]*\.)?[A-Za-z][A-Za-z0-9_$]*_static_id)\s*\)\s*(?P<op>=(?!>)|!=|<>)\s*(?P<rhs>[^;\n]+)"
    )

    def add_issue(abs_idx: int, detail: str) -> None:
        """Append one normalized static-id comparison issue."""
        issues.append(
            f"{display_path(path)}:{line_no(text, abs_idx)}: "
            f"STATIC_ID_WHERE_LOWER_REQUIRED_001 {detail}"
        )

    def inspect_sql_snippet(snippet: str, base_idx: int, context: str) -> None:
        """Inspect one SQL snippet for unnormalized static-id comparisons."""
        for match in bare_cmp_pattern.finditer(snippet):
            add_issue(
                base_idx + match.start("col"),
                f"{context} must normalize `_static_id` comparisons with LOWER() "
                f"(found `{match.group('col')} {match.group('op').strip()}`)",
            )

        for match in wrapped_non_lower_pattern.finditer(snippet):
            add_issue(
                base_idx + match.start("fn"),
                f"{context} must use LOWER() for `_static_id` comparisons, not {match.group('fn').upper()}()",
            )

        for match in lower_rhs_pattern.finditer(snippet):
            rhs = match.group("rhs").strip()
            if not rhs.lower().startswith("lower("):
                add_issue(
                    base_idx + match.start("rhs"),
                    f"{context} equality/inequality against `_static_id` must use lower(<value_or_bind>) on RHS",
                )

    for fence_match in re.finditer(r"(?ms)```(?:sql|plsql)\s*(.*?)\s*```", text):
        inspect_sql_snippet(
            fence_match.group(1),
            fence_match.start(1),
            "fenced SQL/PLSQL block",
        )

    for prop_match in re.finditer(r"(?m)^\s*(plsqlFunctionBody|plsqlExpression)\s*:\s*(.+)$", text):
        inspect_sql_snippet(
            prop_match.group(2),
            prop_match.start(2),
            f"{prop_match.group(1)}",
        )

    return issues


def lint_inline_code_block_char_limits(path: Path, text: str) -> list[str]:
    """Ensure inline code blocks stay below the configured character limit."""
    issues: list[str] = []

    if "applications" in path.parts:
        return issues

    def sql_block_context(body_start: int, lang: str) -> tuple[str, str]:
        """Return a concise context label and remediation for an inline code block."""
        if lang != "sql":
            return (f"inline {lang.upper()} body", "extract to `app_process_api` (or justified package) and reference it declaratively")

        path_text = display_path(path)
        if "shared-components/ai-agents/" not in path_text:
            return ("inline SQL body", "extract to a secure view and reference it from the page")

        prefix = text[:body_start]
        tool_match = None
        for candidate in re.finditer(r"(?m)^\s*tool\s+(?P<name>[A-Za-z0-9_-]+)\s*\(", prefix):
            tool_match = candidate

        if tool_match is None:
            return ("inline SQL body", "extract to a secure view and reference it from the page")

        sql_query_idx = prefix.rfind("sqlQuery:")
        if sql_query_idx < tool_match.start():
            return ("inline SQL body", "extract to a secure view and reference it from the page")

        tool_name = tool_match.group("name")
        return (
            f"aiAgent tool `{tool_name}` settings.sqlQuery",
            "extract prompt-independent logic to secure view(s) and keep settings.sqlQuery as a short wrapper query",
        )

    for match in re.finditer(r"(?ms)```(?P<lang>sql|plsql)\s*(?P<body>.*?)\s*```", text):
        lang = match.group("lang").lower()
        body = match.group("body")
        if len(body) <= INLINE_BLOCK_CHAR_LIMIT:
            continue

        issue_id = "SQL_INLINE_BLOCK_001" if lang == "sql" else "PLSQL_INLINE_BLOCK_001"
        context_label, remedy = sql_block_context(match.start("body"), lang)
        issues.append(
            f"{display_path(path)}:{line_no(text, match.start('body'))}: "
            f"{issue_id} {context_label} exceeds {INLINE_BLOCK_CHAR_LIMIT} characters ({len(body)}) "
            f"- {remedy}"
        )

    for prop_match in re.finditer(r"(?m)^\s*(plsqlFunctionBody|plsqlExpression)\s*:\s*(.+)$", text):
        body = prop_match.group(2)
        if len(body) <= INLINE_BLOCK_CHAR_LIMIT:
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, prop_match.start(2))}: "
            f"PLSQL_INLINE_BLOCK_001 inline PL/SQL body exceeds {INLINE_BLOCK_CHAR_LIMIT} characters ({len(body)}) "
            "- extract to `app_process_api` (or justified package) and reference it declaratively"
        )

    return issues


def is_lower_kebab(value: str) -> bool:
    """Return whether a value follows lower-kebab naming."""
    return bool(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value))


def extract_acl_referenced_roles(text: str) -> dict[str, int]:
    """Collect ACL role references and their source line numbers."""
    refs: dict[str, int] = {}

    def add_ref(role: str, idx: int) -> None:
        """Record the first source position for one ACL role reference."""
        cleaned = role.strip().strip("\"'")
        if cleaned:
            refs.setdefault(cleaned, idx)

    for match in re.finditer(r"(?is)role_static_id[^;\n]*", text):
        segment = match.group(0)
        for literal in re.finditer(r"'([^']+)'", segment):
            add_ref(literal.group(1), match.start() + literal.start(1))

    block_pattern = re.compile(r"(?is)authorization\s+[A-Za-z0-9_$-]+\s*\((.*?)\n\)")
    for block in block_pattern.finditer(text):
        body = block.group(1)
        if not re.search(r"(?i)\btype\s*:\s*(isInRoleOrGroup|isNotInRoleOrGroup)\b", body):
            continue
        for names_match in re.finditer(r"(?im)^\s*names\s*:\s*(.+)$", body):
            raw = names_match.group(1).strip()
            if raw.startswith("[") and raw.endswith("]"):
                raw = raw[1:-1]
            for token in [part.strip() for part in raw.split(",") if part.strip()]:
                token = token.strip("\"'")
                if token.startswith("@"):
                    token = token[1:]
                add_ref(token, block.start(1) + names_match.start(1))

    return refs


def extract_acl_declared_roles(text: str) -> dict[str, int]:
    """Collect ACL role declarations and their source line numbers."""
    declared: dict[str, int] = {}

    for match in re.finditer(r"(?im)^\s*role\s+([A-Za-z0-9_-]+)\s*\(", text):
        declared.setdefault(match.group(1), match.start(1))

    return declared


def lint_acl_role_declarations(path: Path, text: str) -> list[str]:
    """Validate that referenced ACL roles are declared exactly once."""
    issues: list[str] = []
    if path.name != "authorizations.apx" or path.parent.name != "shared-components":
        return issues

    referenced = extract_acl_referenced_roles(text)
    if not referenced:
        return issues

    roles_path = path.parent / "acl-roles.apx"
    if not roles_path.exists():
        issues.append(
            f"{display_path(path)}:1: ACL_ROLE_DECLARATION_REQUIRED_001 "
            "role-based authorization checks require shared-components/acl-roles.apx"
        )
        return issues

    roles_text = roles_path.read_text(encoding="utf-8", errors="ignore")
    declared = extract_acl_declared_roles(roles_text)

    if not declared:
        issues.append(
            f"{display_path(roles_path)}:1: ACL_ROLE_DECLARATION_REQUIRED_001 "
            "acl-roles.apx must declare at least one role when role-based checks exist"
        )

    for role, idx in sorted(referenced.items()):
        if not is_lower_kebab(role):
            issues.append(
                f"{display_path(path)}:{line_no(text, idx)}: ACL_ROLE_DECLARATION_REQUIRED_001 "
                f"referenced ACL role '{role}' must be lowercase kebab-case"
            )
        if role not in declared:
            issues.append(
                f"{display_path(path)}:{line_no(text, idx)}: ACL_ROLE_DECLARATION_REQUIRED_001 "
                f"referenced ACL role '{role}' is not declared in {display_path(roles_path)}"
            )

    for role, idx in sorted(declared.items()):
        if not is_lower_kebab(role):
            issues.append(
                f"{display_path(roles_path)}:{line_no(roles_text, idx)}: ACL_ROLE_DECLARATION_REQUIRED_001 "
                f"declared ACL role '{role}' must be lowercase kebab-case"
            )

    return issues


def is_block_meta(block_meta: object) -> bool:
    """Return whether extracted block metadata has the expected tuple shape."""
    if not isinstance(block_meta, dict):
        return False
    return any(
        key in block_meta
        for key in ("allowedProperties", "requiredProperties", "enforcedValues", "propertyEnums", "forbiddenProperties")
    )


def lint_block_properties(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    block_name: str,
    block_offset: int,
    block_text: str,
    block_meta: dict,
) -> None:
    """Validate required, allowed, and enumerated properties for a schema block."""
    allowed_properties = set(block_meta.get("allowedProperties", []))
    required_properties = set(block_meta.get("requiredProperties", []))
    enforced_values = block_meta.get("enforcedValues", {})
    property_enums = block_meta.get("propertyEnums", {})
    forbidden_properties = set(block_meta.get("forbiddenProperties", []))
    property_values = extract_immediate_brace_property_values(block_text)
    present_props = {prop_name for prop_name, _prop_value, _prop_offset in property_values}

    if allowed_properties:
        for prop_name, _prop_value, prop_offset in property_values:
            if prop_name in forbidden_properties:
                continue
            if prop_name not in allowed_properties:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + block_offset + prop_offset)}: "
                    f"DSL_RULE_PROP {component_label} {block_name}.{prop_name} is not allowed"
                )

    missing_props = sorted(required_properties - present_props)
    for prop_name in missing_props:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} must define {block_name}.{prop_name}"
        )

    for prop_name, _prop_value, prop_offset in property_values:
        if prop_name in forbidden_properties:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_offset + prop_offset)}: "
                f"DSL_RULE_PROP {component_label} {block_name}.{prop_name} is not allowed"
            )

    if isinstance(enforced_values, dict):
        for prop_name, expected in enforced_values.items():
            for actual_name, actual_value, prop_offset in property_values:
                if actual_name != prop_name:
                    continue
                if normalize_value(actual_value) != normalize_value(expected_value_text(expected)):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + block_offset + prop_offset)}: "
                        f"DSL_RULE_VALUE {component_label} requires {block_name}.{prop_name}: {expected_value_text(expected)}"
                    )

    if isinstance(property_enums, dict):
        for prop_name, allowed_values in property_enums.items():
            if not isinstance(allowed_values, list) or not allowed_values:
                continue
            allowed_normalized = {normalize_value(str(value)) for value in allowed_values}
            for actual_name, actual_value, prop_offset in property_values:
                if actual_name != prop_name:
                    continue
                normalized_actual = normalize_value(actual_value)
                if normalized_actual not in allowed_normalized:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + block_offset + prop_offset)}: "
                        f"DSL_RULE_ENUM {component_label} {block_name}.{prop_name} must be one of: "
                        + ", ".join(str(value) for value in allowed_values)
                    )


def lint_map_layer_children(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    map_schema: dict[str, Any],
) -> None:
    """Validate child layer blocks inside a map region."""
    layer_schema = map_schema.get("layer")
    if not isinstance(layer_schema, dict):
        return

    seen_layer_identifiers: set[str] = set()
    for layer_offset, layer_identifier, layer_block in find_immediate_component_blocks(region_block, "layer"):
        layer_label = f"{component_label} layer '{layer_identifier}'"
        absolute_start = component_start + layer_offset

        if layer_identifier in seen_layer_identifiers:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_start)}: "
                f"DSL_RULE_IDENTIFIER {component_label} layer identifier '{layer_identifier}' must be unique within the region"
            )
        seen_layer_identifiers.add(layer_identifier)

        layer_props = extract_immediate_property_values(layer_block)
        present_props = {prop_name for prop_name, _prop_value, _prop_offset in layer_props}
        allowed_props = set(layer_schema.get("allowedProperties", []))
        required_props = set(layer_schema.get("requiredProperties", []))

        for prop_name, _prop_value, prop_offset in layer_props:
            if allowed_props and prop_name not in allowed_props:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_start + prop_offset)}: "
                    f"DSL_RULE_PROP {layer_label} {prop_name} is not allowed"
                )

        for prop_name in sorted(required_props - present_props):
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_start)}: "
                f"DSL_RULE_REQUIRED {layer_label} must define property '{prop_name}'"
            )

        layer_top_level_blocks = extract_top_level_blocks(layer_block)
        allowed_layer_blocks = set(layer_schema.get("allowedBlocks", []))
        required_layer_blocks = set(layer_schema.get("requiredBlocks", []))

        for block_name in sorted(required_layer_blocks - set(layer_top_level_blocks.keys())):
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_start)}: "
                f"DSL_RULE_REQUIRED {layer_label} must define block '{block_name}'"
            )

        for block_name, (block_offset, block_text) in layer_top_level_blocks.items():
            if allowed_layer_blocks and block_name not in allowed_layer_blocks:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_start + block_offset)}: "
                    f"DSL_RULE_BLOCK {layer_label} does not allow block '{block_name}'"
                )
            block_meta = layer_schema.get(block_name)
            if is_block_meta(block_meta):
                lint_block_properties(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=absolute_start,
                    component_label=layer_label,
                    block_name=block_name,
                    block_offset=block_offset,
                    block_text=block_text,
                    block_meta=block_meta,
                )
            if block_name == "link":
                link_props = {
                    prop_name: (prop_value, prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(block_text)
                }
                link_type_meta = link_props.get("type")
                has_target = "target" in link_props or bool(extract_property_object_block(block_text, "target"))
                has_target_url = "targetUrl" in link_props
                if has_target and not link_type_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + block_offset)}: "
                        f"MAP_LAYER_LINK_TYPE_REQUIRED_001 {layer_label} link.target requires link.type: redirectThisApp; "
                        "live compiler rejects target while link.type is omitted"
                    )
                if has_target_url and not link_type_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + block_offset)}: "
                        f"MAP_LAYER_LINK_TYPE_REQUIRED_001 {layer_label} link.targetUrl requires link.type: redirectUrl; "
                        "live compiler rejects targetUrl while link.type is omitted"
                    )

        source_meta = layer_top_level_blocks.get("source")
        if source_meta:
            source_offset, source_block = source_meta
            source_name_offsets = {
                prop_name: prop_offset for prop_name, prop_offset in extract_immediate_brace_property_names(source_block)
            }
            source_scalar_props = {
                prop_name: (prop_value, prop_offset)
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
            }

            has_table_name = "tableName" in source_name_offsets
            has_source_type = "type" in source_name_offsets
            has_sql_query = "sqlQuery" in source_name_offsets
            has_plsql_function_body = "plsqlFunctionBody" in source_name_offsets
            source_type_meta = source_scalar_props.get("type")
            source_type = clean_scalar_value(source_type_meta[0]).lower() if source_type_meta else ""

            if has_table_name and has_source_type:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_start + source_offset + source_name_offsets['type'])}: "
                    f"DSL_RULE_VALUE {layer_label} source.tableName must not be combined with source.type"
                )

            if has_table_name and has_sql_query:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_start + source_offset + source_name_offsets['sqlQuery'])}: "
                    f"DSL_RULE_VALUE {layer_label} source.tableName must not be combined with source.sqlQuery"
                )

            if has_table_name and has_plsql_function_body:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_start + source_offset + source_name_offsets['plsqlFunctionBody'])}: "
                    f"DSL_RULE_VALUE {layer_label} source.tableName must not be combined with source.plsqlFunctionBody"
                )

            if has_sql_query and has_plsql_function_body and not has_source_type:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_start + source_offset + source_name_offsets['plsqlFunctionBody'])}: "
                    f"DSL_RULE_VALUE {layer_label} source.sqlQuery and source.plsqlFunctionBody must not be emitted together without source.type"
                )

            if source_type == "sqlquery":
                if not has_sql_query:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + source_offset)}: "
                        f"DSL_RULE_REQUIRED {layer_label} source.type: sqlQuery requires source.sqlQuery"
                    )
                if has_plsql_function_body:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + source_offset + source_name_offsets['plsqlFunctionBody'])}: "
                        f"DSL_RULE_VALUE {layer_label} source.type: sqlQuery must not define source.plsqlFunctionBody"
                    )
            elif source_type == "functionbody":
                if not has_plsql_function_body:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + source_offset)}: "
                        f"DSL_RULE_REQUIRED {layer_label} source.type: functionBody requires source.plsqlFunctionBody"
                    )
                if has_sql_query:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + source_offset + source_name_offsets['sqlQuery'])}: "
                        f"DSL_RULE_VALUE {layer_label} source.type: functionBody must not define source.sqlQuery"
                    )
                if has_plsql_function_body and not re.search(r"(?i)\breturn\b", source_block):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + source_offset + source_name_offsets['plsqlFunctionBody'])}: "
                        f"DSL_RULE_REQUIRED {layer_label} source.plsqlFunctionBody must return SQL text"
                    )
            elif not has_source_type:
                if has_plsql_function_body:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + source_offset + source_name_offsets['plsqlFunctionBody'])}: "
                        f"DSL_RULE_REQUIRED {layer_label} source.plsqlFunctionBody requires source.type: functionBody"
                    )
                if not has_table_name and not has_sql_query:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + source_offset)}: "
                        f"DSL_RULE_REQUIRED {layer_label} must define source.tableName, legacy source.sqlQuery, or typed source.type"
                    )


def lint_region_display_selector_page_contracts(path: Path, text: str) -> list[str]:
    """Enforce deterministic controller and sibling-region membership for native RDS pages."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        immediate_regions = find_immediate_component_blocks(page_block, "region")
        immediate_offsets = {offset for offset, _name, _block in immediate_regions}
        all_regions = find_component_blocks(page_block, "region")

        for nested_offset, nested_name, nested_block in all_regions:
            if nested_offset in immediate_offsets:
                continue
            nested_type_match = re.search(
                r"(?m)^\s*type\s*:\s*([A-Za-z][A-Za-z0-9_/-]*)\s*$",
                nested_block,
            )
            nested_type = nested_type_match.group(1) if nested_type_match else ""
            nested_advanced = extract_top_level_blocks(nested_block).get("advanced")
            nested_selected = False
            nested_flag_offset = 0
            if nested_advanced:
                nested_advanced_offset, nested_advanced_block = nested_advanced
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(nested_advanced_block):
                    if prop_name != "regionDisplaySelector":
                        continue
                    normalized_flag = normalize_value(prop_value)
                    nested_flag_offset = nested_advanced_offset + prop_offset
                    if normalized_flag not in {"true", "false"}:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, page_start + nested_offset + nested_flag_offset)}: "
                            f"RDS_TARGET_FLAG_VALUE_REQUIRED_001 region '{nested_name}' "
                            "advanced.regionDisplaySelector must be true or false"
                        )
                    if normalized_flag == "true":
                        nested_selected = True
                    break
            if nested_type == "regionDisplaySelector" or nested_selected:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + nested_offset + nested_flag_offset)}: "
                    f"RDS_SIBLING_TARGET_REQUIRED_001 page '{page_name}' region '{nested_name}' must be a "
                    "page-level sibling; nested RDS controllers and targets are not supported"
                )

        controllers: list[dict[str, Any]] = []
        selected_regions: list[dict[str, Any]] = []
        for region_offset, region_name, region_block in immediate_regions:
            absolute_start = page_start + region_offset
            type_match = re.search(
                r"(?m)^\s*type\s*:\s*([A-Za-z][A-Za-z0-9_/-]*)\s*$",
                region_block,
            )
            region_type = type_match.group(1) if type_match else ""
            top_level_blocks = extract_top_level_blocks(region_block)

            layout_slot = ""
            layout_parent_region = ""
            layout_meta = top_level_blocks.get("layout")
            if layout_meta:
                _layout_offset, layout_block = layout_meta
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(layout_block):
                    if prop_name == "slot":
                        layout_slot = clean_scalar_value(prop_value)
                    elif prop_name == "parentRegion":
                        layout_parent_region = clean_scalar_value(prop_value)

            advanced_props: dict[str, tuple[str, int]] = {}
            advanced_meta = top_level_blocks.get("advanced")
            if advanced_meta:
                advanced_offset, advanced_block = advanced_meta
                advanced_props = {
                    prop_name: (clean_scalar_value(prop_value), advanced_offset + prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(advanced_block)
                }

            appearance_props: dict[str, tuple[str, int]] = {}
            appearance_meta = top_level_blocks.get("appearance")
            if appearance_meta:
                appearance_offset, appearance_block = appearance_meta
                appearance_props = {
                    prop_name: (clean_scalar_value(prop_value), appearance_offset + prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(appearance_block)
                }

            region_meta = {
                "name": region_name,
                "type": region_type,
                "slot": layout_slot,
                "parentRegion": layout_parent_region,
                "start": absolute_start,
                "block": region_block,
                "topLevelBlocks": top_level_blocks,
                "advanced": advanced_props,
                "appearance": appearance_props,
            }
            is_rds_controller = region_type == "regionDisplaySelector"
            if is_rds_controller:
                controllers.append(region_meta)
            selected_meta = advanced_props.get("regionDisplaySelector")
            if selected_meta and normalize_value(selected_meta[0]) not in {"true", "false"}:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_start + selected_meta[1])}: "
                    f"RDS_TARGET_FLAG_VALUE_REQUIRED_001 region '{region_name}' "
                    "advanced.regionDisplaySelector must be true or false"
                )
            is_rds_target = bool(selected_meta and normalize_value(selected_meta[0]) == "true")
            if is_rds_target:
                selected_regions.append(region_meta)
            legacy_static_id_meta = advanced_props.get("staticId")
            if (is_rds_controller or is_rds_target) and legacy_static_id_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_start + legacy_static_id_meta[1])}: "
                    f"RDS_REGION_STATIC_ID_FORBIDDEN_001 region '{region_name}' must use "
                    "advanced.htmlDomId; advanced.staticId is rejected by the target APEXlang validator"
                )

        if not controllers and selected_regions:
            first = selected_regions[0]
            issues.append(
                f"{display_path(path)}:{line_no(text, first['start'])}: "
                f"RDS_CONTROLLER_REQUIRED_001 page '{page_name}' has RDS-selected regions but no "
                "type: regionDisplaySelector controller"
            )
            continue
        if not controllers:
            continue

        if len(controllers) > 1:
            issues.append(
                f"{display_path(path)}:{line_no(text, controllers[1]['start'])}: "
                f"RDS_SINGLE_CONTROLLER_REQUIRED_001 page '{page_name}' must define exactly one "
                "Region Display Selector controller"
            )

        valid_targets: list[dict[str, Any]] = []
        controller_starts = {controller["start"] for controller in controllers}
        for selected in selected_regions:
            flag_value, flag_offset = selected["advanced"]["regionDisplaySelector"]
            _ = flag_value
            normalized_slot = normalize_value(selected["slot"])
            if selected["start"] in controller_starts:
                issues.append(
                    f"{display_path(path)}:{line_no(text, selected['start'] + flag_offset)}: "
                    f"RDS_CONTROLLER_SELF_TARGET_FORBIDDEN_001 region '{selected['name']}' must not opt "
                    "the RDS controller into its own target set"
                )
                continue
            if (
                normalize_value(selected["type"]) == "breadcrumb"
                or "breadcrumb" in normalized_slot
                or "header" in normalized_slot
                or bool(selected["parentRegion"])
            ):
                issues.append(
                    f"{display_path(path)}:{line_no(text, selected['start'] + flag_offset)}: "
                    f"RDS_TARGET_LOCATION_FORBIDDEN_001 region '{selected['name']}' in slot "
                    f"'{selected['slot']}' must not be selected by an RDS; nested, header, and breadcrumb regions are excluded"
                )
                continue
            valid_targets.append(selected)

        controller = controllers[0]
        if len(valid_targets) < 2:
            issues.append(
                f"{display_path(path)}:{line_no(text, controller['start'])}: "
                f"RDS_MINIMUM_TARGETS_REQUIRED_001 region '{controller['name']}' must control at least "
                "two eligible sibling regions"
            )

        settings_meta = controller["topLevelBlocks"].get("settings")
        if not settings_meta:
            continue
        settings_offset, settings_block = settings_meta
        settings_props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
        }
        mode_meta = settings_props.get("mode")
        mode = normalize_value(mode_meta[0]) if mode_meta else ""
        show_all_meta = settings_props.get("includeShowAll")
        if mode == "viewsingleregion" and not show_all_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, controller['start'] + settings_offset)}: "
                f"RDS_SHOW_ALL_MODE_REQUIRED_001 region '{controller['name']}' mode: viewSingleRegion "
                "must explicitly define settings.includeShowAll"
            )
        if mode == "scrollwindow" and show_all_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, controller['start'] + settings_offset + show_all_meta[1])}: "
                f"RDS_SHOW_ALL_MODE_REQUIRED_001 region '{controller['name']}' must omit "
                "settings.includeShowAll when mode: scrollWindow"
            )

        icons_meta = settings_props.get("displayRegionIcons")
        if icons_meta and normalize_value(icons_meta[0]) == "true":
            for target in valid_targets:
                if not target["appearance"].get("icon"):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, target['start'])}: "
                        f"RDS_TARGET_ICON_REQUIRED_001 region '{target['name']}' must define "
                        "appearance.icon when the RDS sets displayRegionIcons: true"
                    )

        remember_meta = settings_props.get("rememberSelection")
        remember = normalize_value(remember_meta[0]) if remember_meta else ""
        if remember in {"byuser", "bysession"}:
            target_dom_ids: dict[str, str] = {}
            for target in valid_targets:
                dom_id_meta = target["advanced"].get("htmlDomId")
                if not dom_id_meta or not dom_id_meta[0].strip():
                    issues.append(
                        f"{display_path(path)}:{line_no(text, target['start'])}: "
                        f"RDS_TARGET_DOM_ID_REQUIRED_001 region '{target['name']}' must define a stable "
                        f"advanced.htmlDomId when rememberSelection is {remember_meta[0]}"
                    )
                    continue
                dom_id, dom_id_offset = dom_id_meta
                first_target = target_dom_ids.get(dom_id)
                if first_target:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, target['start'] + dom_id_offset)}: "
                        f"RDS_TARGET_DOM_ID_UNIQUE_REQUIRED_001 region '{target['name']}' duplicates "
                        f"advanced.htmlDomId '{dom_id}' used by region '{first_target}'"
                    )
                else:
                    target_dom_ids[dom_id] = target["name"]

    return issues


def lint_region_contracts(path: Path, text: str, schema: dict, validation_context: dict[str, Any] | None = None) -> list[str]:
    """Validate all region blocks against component schema contracts."""
    issues: list[str] = lint_region_display_selector_page_contracts(path, text)
    region_schema_root = schema["components"].get("region", {})
    known_region_ids = {
        normalize_component_reference(region_name)
        for _start, region_name, _block in find_component_blocks(text, "region")
    }

    for start, region_name, block in find_component_blocks(text, "region"):
        region_type_match = re.search(r"(?m)^\s*type\s*:\s*([A-Za-z][A-Za-z0-9_/-]*)\s*$", block)
        if not region_type_match:
            continue

        region_type = region_type_match.group(1)
        region_type_key = region_schema_key(region_type)
        top_level_blocks = extract_top_level_blocks(block)

        if region_type_key == "staticContent":
            content_meta = top_level_blocks.get("content")
            if content_meta:
                content_offset, content_block = content_meta
                content_props = {
                    prop_name: prop_offset for prop_name, prop_offset in extract_immediate_brace_property_names(content_block)
                }
                html_prop_offset = content_props.get("html")
                if html_prop_offset is not None:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + content_offset + html_prop_offset)}: "
                        f"DSL_RULE_PROP staticContent region '{region_name}' must use source.htmlCode instead of content.html"
                    )
            source_meta = top_level_blocks.get("source")
            if source_meta:
                source_offset, source_block = source_meta
                source_props = {
                    prop_name: (prop_value, prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                }
                html_code_meta = source_props.get("htmlCode")
                if html_code_meta:
                    html_code_value, html_code_offset = html_code_meta
                    if re.match(r"(?i)^q'", html_code_value.strip()):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + source_offset + html_code_offset)}: "
                            f"DSL_RULE_VALUE staticContent region '{region_name}' source.htmlCode must use inline HTML "
                            f"or a fenced ```html block; SQL-style q quoting is not allowed"
                        )

        if region_type == "themeTemplateComponent/metricCard":
            settings_meta = top_level_blocks.get("settings")
            if settings_meta:
                settings_offset, settings_block = settings_meta
                for prop_name, _prop_value, prop_offset in extract_immediate_brace_property_values(settings_block):
                    if prop_name == "displayAvatar":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + settings_offset + prop_offset)}: "
                            f"DSL_RULE_PROP region '{region_name}' type '{region_type}' must not emit settings.displayAvatar; "
                            f"use plugin-avatar.displayAvatar instead"
                        )
                    if prop_name == "displayBadge":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + settings_offset + prop_offset)}: "
                            f"DSL_RULE_PROP region '{region_name}' type '{region_type}' must not emit settings.displayBadge; "
                            f"use plugin-badge.displayBadge instead"
                        )

        if region_type_key == "badge":
            lint_badge_source_setting_mappings(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=f"region '{region_name}' type '{region_type}'",
                region_block=block,
                top_level_blocks=top_level_blocks,
                validation_context=validation_context,
            )

        region_schema = region_schema_root.get(region_type_key)
        if not isinstance(region_schema, dict):
            continue

        component_label = f"region '{region_name}' type '{region_type}'"
        allowed_blocks = set(region_schema.get("allowedBlocks", []))
        required_blocks = set(region_schema.get("requiredBlocks", []))

        if region_type_key == "metricCard":
            lint_metric_card_nested_placement_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
                known_region_ids=known_region_ids,
            )
            lint_metric_card_mapping_contracts(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                top_level_blocks=top_level_blocks,
                validation_context=validation_context,
            )

        for block_name, (offset, _sub_block) in top_level_blocks.items():
            if allowed_blocks and block_name not in allowed_blocks:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + offset)}: "
                    f"DSL_RULE_BLOCK {component_label} does not allow block '{block_name}'"
                )

        for block_name in sorted(required_blocks - set(top_level_blocks.keys())):
            issues.append(
                f"{display_path(path)}:{line_no(text, start)}: "
                f"DSL_RULE_REQUIRED {component_label} must define block '{block_name}'"
            )

        if region_type_key == "classicReport":
            for block_name in ("componentAppearance", "pagination"):
                block_data = top_level_blocks.get(block_name)
                block_meta = region_schema.get(block_name)
                if block_data and is_block_meta(block_meta):
                    block_offset, block_text = block_data
                    lint_block_properties(
                        issues=issues,
                        path=path,
                        text=text,
                        component_start=start,
                        component_label=component_label,
                        block_name=block_name,
                        block_offset=block_offset,
                        block_text=block_text,
                        block_meta=block_meta,
                    )

        if region_type_key == "calendar":
            settings_meta = top_level_blocks.get("settings")
            if settings_meta and is_block_meta(region_schema.get("settings")):
                block_offset, block_text = settings_meta
                lint_block_properties(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=start,
                    component_label=component_label,
                    block_name="settings",
                    block_offset=block_offset,
                    block_text=block_text,
                    block_meta=region_schema["settings"],
                )
                lint_calendar_settings_values(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=start,
                    component_label=component_label,
                    block_offset=block_offset,
                    block_text=block_text,
                    template_mode=False,
                )

        if region_type_key == "avatar":
            for block_name in ("componentAppearance", "orderBy", "settings", "security"):
                block_data = top_level_blocks.get(block_name)
                block_meta = region_schema.get(block_name)
                if block_data and is_block_meta(block_meta):
                    block_offset, block_text = block_data
                    lint_block_properties(
                        issues=issues,
                        path=path,
                        text=text,
                        component_start=start,
                        component_label=component_label,
                        block_name=block_name,
                        block_offset=block_offset,
                        block_text=block_text,
                        block_meta=block_meta,
                    )
            settings_meta = top_level_blocks.get("settings")
            if settings_meta:
                lint_avatar_settings_contract(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=start,
                    component_label=component_label,
                    region_block=block,
                    settings_offset=settings_meta[0],
                    settings_block=settings_meta[1],
                    validation_context=validation_context,
                )
            lint_template_component_order_by(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                top_level_blocks=top_level_blocks,
            )

        if region_type_key == "metricCard":
            for block_name in (
                "componentAppearance",
                "orderBy",
                "settings",
                "plugin-avatar",
                "plugin-badge",
                "plugin-grouping",
                "rowSelection",
                "messages",
                "pagination",
                "advanced",
            ):
                block_data = top_level_blocks.get(block_name)
                block_meta = region_schema.get(block_name)
                if block_data and is_block_meta(block_meta):
                    block_offset, block_text = block_data
                    lint_block_properties(
                        issues=issues,
                        path=path,
                        text=text,
                        component_start=start,
                        component_label=component_label,
                        block_name=block_name,
                        block_offset=block_offset,
                        block_text=block_text,
                        block_meta=block_meta,
                    )

        if region_type_key == "comments":
            for block_name in (
                "componentAppearance",
                "settings",
                "plugin-avatar",
                "rowSelection",
                "performance",
                "pagination",
                "entityTitle",
                "messages",
                "advanced",
            ):
                block_data = top_level_blocks.get(block_name)
                block_meta = region_schema.get(block_name)
                if block_data and is_block_meta(block_meta):
                    block_offset, block_text = block_data
                    lint_block_properties(
                        issues=issues,
                        path=path,
                        text=text,
                        component_start=start,
                        component_label=component_label,
                        block_name=block_name,
                        block_offset=block_offset,
                        block_text=block_text,
                        block_meta=block_meta,
                    )
            lint_comments_nested_avatar_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                top_level_blocks=top_level_blocks,
            )
            lint_comments_mapping_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                top_level_blocks=top_level_blocks,
            )
            lint_comments_report_options(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
            )
            lint_comments_partial_report_blocks(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
            )
            lint_comments_display_style_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
            )
            lint_comments_partial_source_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
            )
            lint_comments_rendering_values(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                top_level_blocks=top_level_blocks,
            )
            lint_comments_action_semantics(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                component_block=block,
            )
            lint_comments_unsupported_blocks(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                component_block=block,
            )

        if region_type_key == "interactiveReport":
            lint_comments_column_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                action_schema=(region_schema.get("column", {}).get("commentsColumn", {}).get("action", {})),
            )

        if region_type_key == "timeline":
            for block_name in (
                "componentAppearance",
                "settings",
                "plugin-avatar",
                "plugin-badge",
                "pagination",
                "advanced",
            ):
                block_data = top_level_blocks.get(block_name)
                block_meta = region_schema.get(block_name)
                if block_data and is_block_meta(block_meta):
                    block_offset, block_text = block_data
                    lint_block_properties(
                        issues=issues,
                        path=path,
                        text=text,
                        component_start=start,
                        component_label=component_label,
                        block_name=block_name,
                        block_offset=block_offset,
                        block_text=block_text,
                        block_meta=block_meta,
                    )
            lint_timeline_nested_component_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                top_level_blocks=top_level_blocks,
            )

        if region_type_key == "regionDisplaySelector":
            for block_name in ("settings", "advanced"):
                block_data = top_level_blocks.get(block_name)
                block_meta = region_schema.get(block_name)
                if block_data and is_block_meta(block_meta):
                    block_offset, block_text = block_data
                    lint_block_properties(
                        issues=issues,
                        path=path,
                        text=text,
                        component_start=start,
                        component_label=component_label,
                        block_name=block_name,
                        block_offset=block_offset,
                        block_text=block_text,
                        block_meta=block_meta,
                    )

        minimum_children = region_schema.get("minimumChildren", {})
        if isinstance(minimum_children, dict):
            for child_keyword, minimum_count in sorted(minimum_children.items()):
                if not isinstance(minimum_count, int):
                    continue
                child_blocks = (
                    find_region_column_blocks(region_type_key, block)
                    if child_keyword == "column"
                    else find_immediate_component_blocks(block, child_keyword)
                )
                actual_children = len(child_blocks)
                if actual_children < minimum_count:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start)}: "
                        f"DSL_RULE_REQUIRED {component_label} must define at least {minimum_count} {child_keyword} child block(s)"
                    )

        if region_type_key == "cards":
            media_source = ""
            media_props: dict[str, tuple[str, int]] = {}
            for block_name in (
                "source",
                "card",
                "title",
                "subtitle",
                "body",
                "secondaryBody",
                "media",
                "blobAttributes",
                "iconAndBadge",
                "componentAppearance",
                "security",
            ):
                block_meta = region_schema.get(block_name)
                block_data = top_level_blocks.get(block_name)
                if block_data and is_block_meta(block_meta):
                    block_offset, block_text = block_data
                    lint_block_properties(
                        issues=issues,
                        path=path,
                        text=text,
                        component_start=start,
                        component_label=component_label,
                        block_name=block_name,
                        block_offset=block_offset,
                        block_text=block_text,
                        block_meta=block_meta,
                    )
                    if block_name in {"title", "subtitle", "body", "secondaryBody"}:
                        lint_cards_display_block_contract(
                            issues=issues,
                            path=path,
                            text=text,
                            component_start=start,
                            component_label=component_label,
                            block_name=block_name,
                            block_offset=block_offset,
                            block_text=block_text,
                        )
                    if block_name == "media":
                        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(block_text):
                            media_props[prop_name] = (clean_scalar_value(prop_value), _prop_offset)
                            if prop_name == "source":
                                media_source = clean_scalar_value(prop_value)

            lint_cards_source_shape_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
            )
            lint_cards_rest_security_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
                validation_context=validation_context,
            )

            media_meta = top_level_blocks.get("media")
            if media_meta:
                media_offset, _media_block = media_meta
                media_advanced = normalize_value(media_props.get("advancedFormatting", ("", 0))[0])
                if media_advanced == "true":
                    if "htmlExpression" not in media_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + media_offset)}: "
                            f"DSL_RULE_REQUIRED {component_label} media.advancedFormatting: true requires media.htmlExpression"
                        )
                    for prop_name in ("source", "blobColumn", "urlColumn", "url", "appearance", "sizing", "imageDescription"):
                        if prop_name in media_props:
                            issues.append(
                                f"{display_path(path)}:{line_no(text, start + media_offset + media_props[prop_name][1])}: "
                                f"DSL_RULE_PROP {component_label} media.{prop_name} is valid only when media.advancedFormatting: false"
                            )
                elif media_advanced == "false":
                    if "source" not in media_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + media_offset)}: "
                            f"DSL_RULE_REQUIRED {component_label} media.advancedFormatting: false requires media.source"
                        )
                    if "sizing" not in media_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + media_offset)}: "
                            f"DSL_RULE_REQUIRED {component_label} media.source requires media.sizing"
                        )
                    if "htmlExpression" in media_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + media_offset + media_props['htmlExpression'][1])}: "
                            f"DSL_RULE_PROP {component_label} media.htmlExpression is valid only when media.advancedFormatting: true"
                        )

            normalized_media_source = normalize_value(media_source)
            if media_meta and normalized_media_source:
                media_offset, _media_block = media_meta
                card_block_meta = top_level_blocks.get("card")
                card_has_primary_key = False
                if card_block_meta:
                    card_has_primary_key = any(
                        prop_name == "primaryKeyColumn1"
                        for prop_name, _prop_value, _prop_offset in extract_immediate_brace_property_values(card_block_meta[1])
                    )
                if normalized_media_source == "blobcolumn" and not card_has_primary_key:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + media_offset)}: "
                        f"DSL_RULE_REQUIRED {component_label} card.primaryKeyColumn1 is required when media.source: blobColumn"
                    )
                source_required_props = {
                    "blobcolumn": ("blobColumn", "blobColumn"),
                    "urlcolumn": ("urlColumn", "urlColumn"),
                    "imageurl": ("url", "imageUrl"),
                }
                required_meta = source_required_props.get(normalized_media_source)
                if required_meta:
                    required_prop, source_label = required_meta
                    if required_prop not in media_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + media_offset)}: "
                            f"DSL_RULE_REQUIRED {component_label} must define media.{required_prop} "
                            f"when media.source: {source_label}"
                        )
                    source_bound_props = {
                        "blobColumn": "blobColumn",
                        "urlColumn": "urlColumn",
                        "url": "imageUrl",
                    }
                    for prop_name, source_value in source_bound_props.items():
                        if prop_name == required_prop or prop_name not in media_props:
                            continue
                        _prop_value, prop_offset = media_props[prop_name]
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + media_offset + prop_offset)}: "
                            f"DSL_RULE_VALUE {component_label} media.{prop_name} is allowed only when "
                            f"media.source: {source_value}"
                        )

            blob_attributes_meta = top_level_blocks.get("blobAttributes")
            if blob_attributes_meta and normalized_media_source != "blobcolumn":
                blob_attributes_offset, _blob_attributes_block = blob_attributes_meta
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + blob_attributes_offset)}: "
                    f"DSL_RULE_VALUE {component_label} blobAttributes is allowed only when media.source: blobColumn"
                )

            card_meta = top_level_blocks.get("card")
            if card_meta:
                card_offset, card_block = card_meta
                card_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(card_block)
                }
                if "primaryKeyColumn2" in card_props and "primaryKeyColumn1" not in card_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + card_offset + card_props['primaryKeyColumn2'][1])}: "
                        f"DSL_RULE_REQUIRED {component_label} card.primaryKeyColumn2 requires card.primaryKeyColumn1"
                    )
                css_meta = card_props.get("cssClasses")
                if css_meta:
                    css_value, css_offset = css_meta
                    references = list(AMP_SUBSTITUTION_TOKEN_PATTERN.finditer(css_value))
                    compact_value = re.sub(r"[\s\[\]\"']", "", css_value)
                    exact_reference = len(references) == 1 and compact_value.upper() == f"&{references[0].group(1).upper()}."
                    if not exact_reference:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + card_offset + css_offset)}: "
                            f"CARDS_CONDITIONAL_STYLE_ALLOWLIST_REQUIRED_001 {component_label} card.cssClasses "
                            "must contain exactly one projected alias substitution"
                        )
                    else:
                        source_kind = source_projection_columns(top_level_blocks, validation_context)[2]
                        source_meta = top_level_blocks.get("source")
                        if source_kind == "sql" and source_meta:
                            _source_offset, source_block = source_meta
                            sql_query_text = extract_fenced_property_body(source_block, "sqlQuery")
                            expressions = sql_projection_expressions(sql_query_text or "", references[0].group(1))
                            values: list[str | None] | None = []
                            if not expressions:
                                values = None
                            else:
                                for expression in expressions:
                                    branch_values = cards_semantic_class_expression_values(expression)
                                    if branch_values is None:
                                        values = None
                                        break
                                    values.extend(branch_values)
                            invalid_values = {
                                value for value in (values or [])
                                if value is not None and value not in CARDS_SEMANTIC_CLASS_VALUES
                            }
                            if values is None or invalid_values:
                                found = ", ".join(sorted(invalid_values)) if invalid_values else "unproven dynamic values"
                                issues.append(
                                    f"{display_path(path)}:{line_no(text, start + card_offset + css_offset)}: "
                                    f"CARDS_CONDITIONAL_STYLE_ALLOWLIST_REQUIRED_001 {component_label} card.cssClasses "
                                    "SQL projection must return only u-normal, u-hot, u-info, u-success, u-warning, "
                                    f"u-danger, or NULL; found {found}"
                                )
                        elif source_kind == "rest" and source_meta:
                            _source_offset, source_block = source_meta
                            source_props = {
                                prop_name: clean_scalar_value(prop_value)
                                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
                            }
                            rest_reference = normalize_component_reference(source_props.get("restSource", ""))
                            rest_profile_enums = (validation_context or {}).get("rest_profile_enums", {})
                            profile_enums = (
                                rest_profile_enums.get(rest_reference, {})
                                if isinstance(rest_profile_enums, dict)
                                else {}
                            )
                            mapped_alias = normalize_sql_identifier(references[0].group(1))
                            values = profile_enums.get(mapped_alias) if isinstance(profile_enums, dict) else None
                            invalid_values = {
                                value
                                for value in (values or set())
                                if value is not None and value not in CARDS_SEMANTIC_CLASS_VALUES
                            }
                            if values is None or invalid_values:
                                found = ", ".join(sorted(invalid_values)) if invalid_values else "no authoritative profile enum"
                                issues.append(
                                    f"{display_path(path)}:{line_no(text, start + card_offset + css_offset)}: "
                                    f"CARDS_CONDITIONAL_STYLE_ALLOWLIST_REQUIRED_001 {component_label} card.cssClasses "
                                    "REST profile column must declare authoritative-profile-enum with only u-normal, "
                                    "u-hot, u-info, u-success, u-warning, u-danger, or NULL; "
                                    f"found {found}"
                                )

            source_meta = top_level_blocks.get("source")
            if source_meta:
                source_offset, source_block = source_meta
                source_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                }
                rest_source = source_props.get("restSource")
                if rest_source and ("://" in rest_source[0] or not rest_source[0].startswith("@")):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + source_offset + rest_source[1])}: "
                        f"CARDS_REST_SECURITY_REQUIRED_001 {component_label} source.restSource must reference an "
                        "existing shared REST Data Source alias, not an endpoint or literal"
                    )

            lint_cards_media_url_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
                media_props=media_props,
                validation_context=validation_context,
            )

            component_appearance_meta = top_level_blocks.get("componentAppearance")
            if component_appearance_meta:
                component_appearance_offset, component_appearance_block = component_appearance_meta
                component_appearance_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(component_appearance_block)
                }
                if "gridColumns" in component_appearance_props and normalize_value(
                    component_appearance_props.get("layout", ("", 0))[0]
                ) != "grid":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + component_appearance_offset + component_appearance_props['gridColumns'][1])}: "
                        f"DSL_RULE_PROP {component_label} componentAppearance.gridColumns requires componentAppearance.layout: grid"
                    )

            icon_meta = top_level_blocks.get("iconAndBadge")
            if icon_meta:
                icon_offset, icon_block = icon_meta
                icon_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(icon_block)
                }
                icon_source = normalize_value(icon_props.get("iconSource", ("", 0))[0])
                if icon_source == "imageblobcolumn":
                    card_block_meta = top_level_blocks.get("card")
                    card_has_primary_key = bool(
                        card_block_meta
                        and any(
                            prop_name == "primaryKeyColumn1"
                            for prop_name, _prop_value, _prop_offset in extract_immediate_brace_property_values(card_block_meta[1])
                        )
                    )
                    if not card_has_primary_key:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + icon_offset)}: "
                            f"DSL_RULE_REQUIRED {component_label} card.primaryKeyColumn1 is required when "
                            "iconAndBadge.iconSource: imageBlobColumn"
                        )
                required_icon_prop = {
                    "iconclass": "iconCssClasses",
                    "iconclasscolumn": "iconColumn",
                    "initials": "iconColumn",
                    "imageurl": "imageUrl",
                    "imageblobcolumn": "imageColumn",
                }.get(icon_source)
                if icon_source and "iconPosition" not in icon_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + icon_offset)}: "
                        f"DSL_RULE_REQUIRED {component_label} iconAndBadge.iconSource requires iconAndBadge.iconPosition"
                    )
                if required_icon_prop and required_icon_prop not in icon_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + icon_offset)}: "
                        f"DSL_RULE_REQUIRED {component_label} iconAndBadge.iconSource: {icon_props['iconSource'][0]} "
                        f"requires iconAndBadge.{required_icon_prop}"
                    )
                if icon_source == "iconclass" and "iconCssClasses" in icon_props:
                    icon_value, icon_value_offset = icon_props["iconCssClasses"]
                    if classify_fa_icon_value(icon_value) != "valid":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + icon_offset + icon_value_offset)}: "
                            f"FA_ICON_REQUIRED_001 {component_label} fixed iconAndBadge.iconCssClasses must use "
                            "exactly one static icon and only optional modifiers from the pinned Font APEX catalog; "
                            f"found '{icon_value}'"
                        )
                badge_dependent_props = {
                    prop_name
                    for prop_name in ("badgeLabel", "badgeCssClasses")
                    if prop_name in icon_props
                }
                if badge_dependent_props and "badgeColumn" not in icon_props:
                    first_badge_prop = sorted(badge_dependent_props)[0]
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + icon_offset + icon_props[first_badge_prop][1])}: "
                        f"CARDS_SOURCE_MAPPING_REQUIRED_001 {component_label} iconAndBadge "
                        f"{', '.join(sorted(badge_dependent_props))} requires iconAndBadge.badgeColumn"
                    )
                icon_source_bound_props = {
                    "iconColumn": {"iconclasscolumn", "initials"},
                    "imageColumn": {"imageblobcolumn"},
                    "imageUrl": {"imageurl"},
                }
                for prop_name, valid_sources in icon_source_bound_props.items():
                    if prop_name in icon_props and icon_source not in valid_sources:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, start + icon_offset + icon_props[prop_name][1])}: "
                            f"DSL_RULE_PROP {component_label} iconAndBadge.{prop_name} does not apply to "
                            f"iconAndBadge.iconSource: {icon_props.get('iconSource', ('unset', 0))[0]}"
                        )

            lint_cards_source_attribute_mappings(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
                validation_context=validation_context,
            )
            lint_cards_action_source_mappings(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                top_level_blocks=top_level_blocks,
                validation_context=validation_context,
            )

        if region_type_key == "chart":
            chart_block_meta = top_level_blocks.get("chart")
            chart_type = ""
            if chart_block_meta:
                _chart_offset, chart_block = chart_block_meta
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(chart_block):
                    if prop_name == "type":
                        chart_type = clean_scalar_value(prop_value)
                        break

            axis_names: list[str] = []
            seen_axis_identifiers: set[str] = set()
            axis_schema = region_schema.get("axis", {})
            for child_offset, axis_identifier, axis_block in find_immediate_component_blocks(block, "axis"):
                axis_label = f"{component_label} axis '{axis_identifier}'"
                absolute_start = start + child_offset
                if axis_identifier in seen_axis_identifiers:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start)}: "
                        f"DSL_RULE_IDENTIFIER {component_label} axis identifier '{axis_identifier}' must be unique within the region"
                    )
                seen_axis_identifiers.add(axis_identifier)

                axis_props = extract_immediate_property_values(axis_block)
                allowed_props = set(axis_schema.get("allowedProperties", []))
                required_props = set(axis_schema.get("requiredProperties", []))
                present_props = {prop_name for prop_name, _prop_value, _prop_offset in axis_props}

                for prop_name, _prop_value, prop_offset in axis_props:
                    if allowed_props and prop_name not in allowed_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_start + prop_offset)}: "
                            f"DSL_RULE_PROP {axis_label} {prop_name} is not allowed"
                        )

                for prop_name in sorted(required_props - present_props):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start)}: "
                        f"DSL_RULE_REQUIRED {axis_label} must define property '{prop_name}'"
                    )

                enums = axis_schema.get("propertyEnums", {})
                if isinstance(enums, dict):
                    allowed_names = enums.get("name")
                    if isinstance(allowed_names, list):
                        axis_name = next(
                            (clean_scalar_value(prop_value) for prop_name, prop_value, _prop_offset in axis_props if prop_name == "name"),
                            "",
                        )
                        if axis_name:
                            axis_names.append(axis_name)
                            if normalize_value(axis_name) not in {normalize_value(value) for value in allowed_names}:
                                issues.append(
                                    f"{display_path(path)}:{line_no(text, absolute_start)}: "
                                    f"DSL_RULE_ENUM {axis_label} name must be one of: "
                                    + ", ".join(str(value) for value in allowed_names)
                                )

                axis_top_level_blocks = extract_top_level_blocks(axis_block)
                allowed_axis_blocks = set(axis_schema.get("allowedBlocks", []))
                for block_name, (offset, _sub_block) in axis_top_level_blocks.items():
                    if allowed_axis_blocks and block_name not in allowed_axis_blocks:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_start + offset)}: "
                            f"DSL_RULE_BLOCK {axis_label} does not allow block '{block_name}'"
                        )
                    block_meta = axis_schema.get(block_name)
                    if is_block_meta(block_meta):
                        lint_block_properties(
                            issues=issues,
                            path=path,
                            text=text,
                            component_start=absolute_start,
                            component_label=axis_label,
                            block_name=block_name,
                            block_offset=offset,
                            block_text=axis_top_level_blocks[block_name][1],
                            block_meta=block_meta,
                        )

            series_schema = region_schema.get("series", {})
            seen_series_identifiers: set[str] = set()
            for child_offset, series_identifier, series_block in find_immediate_component_blocks(block, "series"):
                series_label = f"{component_label} series '{series_identifier}'"
                absolute_start = start + child_offset
                if series_identifier in seen_series_identifiers:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start)}: "
                        f"DSL_RULE_IDENTIFIER {component_label} series identifier '{series_identifier}' must be unique within the region"
                    )
                seen_series_identifiers.add(series_identifier)

                series_props = extract_immediate_property_values(series_block)
                present_props = {prop_name for prop_name, _prop_value, _prop_offset in series_props}
                for prop_name in sorted(set(series_schema.get("requiredProperties", [])) - present_props):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start)}: "
                        f"DSL_RULE_REQUIRED {series_label} must define property '{prop_name}'"
                    )

                series_top_level_blocks = extract_top_level_blocks(series_block)
                allowed_series_blocks = set(series_schema.get("allowedBlocks", []))
                for block_name, (offset, _sub_block) in series_top_level_blocks.items():
                    if allowed_series_blocks and block_name not in allowed_series_blocks:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_start + offset)}: "
                            f"DSL_RULE_BLOCK {series_label} does not allow block '{block_name}'"
                        )
                    block_meta = series_schema.get(block_name)
                    if is_block_meta(block_meta):
                        lint_block_properties(
                            issues=issues,
                            path=path,
                            text=text,
                            component_start=absolute_start,
                            component_label=series_label,
                            block_name=block_name,
                            block_offset=offset,
                            block_text=series_top_level_blocks[block_name][1],
                            block_meta=block_meta,
                        )

            chart_requirements = region_schema.get("chartTypeAxisRequirements", {})
            if chart_type and isinstance(chart_requirements, dict):
                chart_type_rules = chart_requirements.get(chart_type, {})
                if isinstance(chart_type_rules, dict):
                    minimum_children = chart_type_rules.get("minimumChildren", {})
                    if isinstance(minimum_children, dict):
                        minimum_axes = minimum_children.get("axis")
                        actual_axes = len(find_immediate_component_blocks(block, "axis"))
                        if isinstance(minimum_axes, int) and actual_axes < minimum_axes:
                            issues.append(
                                f"{display_path(path)}:{line_no(text, start)}: "
                                f"DSL_RULE_REQUIRED {component_label} chart type '{chart_type}' must define at least {minimum_axes} axis child blocks"
                            )
                    required_axis_names = chart_type_rules.get("requiredAxisNames", [])
                    if isinstance(required_axis_names, list):
                        normalized_axis_names = {normalize_value(name) for name in axis_names}
                        for axis_name in required_axis_names:
                            if normalize_value(str(axis_name)) not in normalized_axis_names:
                                issues.append(
                                    f"{display_path(path)}:{line_no(text, start)}: "
                                    f"DSL_RULE_REQUIRED {component_label} chart type '{chart_type}' must include axis name '{axis_name}'"
                                )
            continue

        if region_type_key == "map":
            initial_position_meta = top_level_blocks.get("initialPositionAndZoom")
            if initial_position_meta:
                lint_map_initial_position_sql_aliases(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=start,
                    component_label=component_label,
                    block_offset=initial_position_meta[0],
                    block_text=initial_position_meta[1],
                )
            lint_map_layer_children(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                map_schema=region_schema,
            )
            continue

        lint_required_region_column_children(
            issues=issues,
            path=path,
            text=text,
            component_start=start,
            component_label=component_label,
            region_type_key=region_type_key,
            region_block=block,
            top_level_blocks=top_level_blocks,
            validation_context=validation_context,
        )

        column_schema = region_schema.get("column")
        if isinstance(column_schema, dict):
            for child_offset, column_identifier, column_block in find_region_column_blocks(region_type_key, block):
                absolute_start = start + child_offset
                column_props = extract_immediate_property_values(column_block)
                column_type = next(
                    (
                        clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in column_props
                        if prop_name == "type"
                    ),
                    "",
                )
                effective_column_schema = column_schema
                if (
                    region_type_key == "interactiveReport"
                    and column_type == "themeTemplateComponent/comments"
                    and isinstance(column_schema.get("commentsColumn"), dict)
                ):
                    effective_column_schema = column_schema["commentsColumn"]
                column_name = next(
                    (
                        clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in column_props
                        if prop_name == "columnName"
                    ),
                    "",
                )
                column_label = f"{component_label} column '{column_identifier or column_name or '<unnamed>'}'"
                allowed_props = set(effective_column_schema.get("allowedProperties", []))
                required_props = set(effective_column_schema.get("requiredProperties", []))
                present_props = {prop_name for prop_name, _prop_value, _prop_offset in column_props}

                for prop_name, _prop_value, prop_offset in column_props:
                    forbidden_avatar_prop = region_type_key == "avatar" and prop_name in {"columnName", "show"}
                    if forbidden_avatar_prop or (allowed_props and prop_name not in allowed_props):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_start + prop_offset)}: "
                            f"DSL_RULE_PROP {column_label} {prop_name} is not allowed"
                        )

                for prop_name in sorted(required_props - present_props):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start)}: "
                        f"DSL_RULE_REQUIRED {column_label} must define property '{prop_name}'"
                    )

                column_top_level_blocks = extract_top_level_blocks(column_block)
                lint_column_block_shape(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=absolute_start,
                    column_label=column_label,
                    column_block=column_block,
                    column_top_level_blocks=column_top_level_blocks,
                    require_layout_sequence=region_type_key in {
                        "avatar",
                        "classicReport",
                        "comments",
                        "interactiveReport",
                        "contentRow",
                        "mediaList",
                        "metricCard",
                        "timeline",
                    },
                )
                allowed_column_blocks = set(effective_column_schema.get("allowedBlocks", []))
                required_column_blocks = set(effective_column_schema.get("requiredBlocks", []))
                for block_name in sorted(required_column_blocks - set(column_top_level_blocks)):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start)}: "
                        f"DSL_RULE_REQUIRED {column_label} must define block '{block_name}'"
                    )
                for block_name, (offset, sub_block) in column_top_level_blocks.items():
                    block_meta = effective_column_schema.get(block_name)
                    if block_name == "config" and not is_block_meta(block_meta):
                        block_meta = CONFIG_BUILD_OPTION_BLOCK_META
                    if allowed_column_blocks and block_name not in allowed_column_blocks and block_name != "config":
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_start + offset)}: "
                            f"DSL_RULE_BLOCK {column_label} does not allow block '{block_name}'"
                        )
                    if is_block_meta(block_meta):
                        lint_block_properties(
                            issues=issues,
                            path=path,
                            text=text,
                            component_start=absolute_start,
                            component_label=column_label,
                            block_name=block_name,
                            block_offset=offset,
                            block_text=sub_block,
                            block_meta=block_meta,
                        )

    return issues


def source_block_has_location(top_level_blocks: dict[str, tuple[int, str]]) -> bool:
    """Return whether a region source block declares source.location."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return False
    _source_offset, source_block = source_meta
    return any(prop_name == "location" for prop_name, _prop_value, _prop_offset in extract_immediate_brace_property_values(source_block))


def source_block_is_sql_or_table_backed(top_level_blocks: dict[str, tuple[int, str]]) -> bool:
    """Return whether a report source block has SQL/table-backed shape that needs child columns."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return False
    _source_offset, source_block = source_meta
    prop_names = {prop_name for prop_name, _prop_offset in extract_immediate_brace_property_names(source_block)}
    scalar_props = {
        prop_name: clean_scalar_value(prop_value).lower()
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
    }
    source_type = scalar_props.get("type", "")
    return bool(
        "sqlQuery" in prop_names
        or "tableName" in prop_names
        or source_type in {"sqlquery", "table"}
    )


def source_block_is_rest_backed(top_level_blocks: dict[str, tuple[int, str]]) -> bool:
    """Return whether a report source block has REST-backed shape that needs child columns."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return False
    _source_offset, source_block = source_meta
    prop_names = {prop_name for prop_name, _prop_offset in extract_immediate_brace_property_names(source_block)}
    scalar_props = {
        prop_name: clean_scalar_value(prop_value).lower()
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
    }
    return "restSource" in prop_names or scalar_props.get("location") == "restsource"


def source_block_has_data_projection(top_level_blocks: dict[str, tuple[int, str]]) -> bool:
    """Return whether a source block exposes SQL/table/REST data projection semantics."""
    return source_block_is_sql_or_table_backed(top_level_blocks) or source_block_is_rest_backed(top_level_blocks)


def template_component_display_mode(top_level_blocks: dict[str, tuple[int, str]]) -> str:
    """Return a template-component region's componentAppearance.display value."""
    component_meta = top_level_blocks.get("componentAppearance")
    if not component_meta:
        return ""
    _component_offset, component_block = component_meta
    for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(component_block):
        if prop_name == "display":
            return clean_scalar_value(prop_value).lower()
    return ""


def lint_required_region_column_children(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_type_key: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
    validation_context: dict[str, Any] | None = None,
) -> None:
    """Require compiler-visible child columns that fully cover source projections."""
    actual_columns = len(find_region_column_blocks(region_type_key, region_block))
    if region_type_key == "cards" and actual_columns > 0:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start)}: "
            f"DSL_RULE_BLOCK {component_label} must not define report-style column child block(s); "
            "use native cards column-mapping blocks instead"
        )
        return

    if region_type_key not in PROJECTION_COVERAGE_REGION_TYPES or not projection_source_requires_columns(region_type_key, top_level_blocks):
        return

    expected_columns, projection_error, source_kind = source_projection_columns(top_level_blocks, validation_context)
    if projection_error:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start)}: "
            f"DSL_PROJECTION_METADATA_REQUIRED {component_label} {projection_error}"
        )
        return

    if actual_columns == 0:
        if region_type_key in {"avatar", "badge", "comments", "contentRow", "mediaList", "metricCard", "timeline"}:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start)}: "
                f"DSL_RULE_REQUIRED {component_label} report display with data source must define immediate "
                "column child block(s) using the component family's compiler-backed column contract"
            )
        else:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start)}: "
                f"DSL_RULE_REQUIRED {component_label} with SQL/table/REST source must define immediate column child block(s)"
        )
        return

    if not expected_columns or source_kind == "none":
        return

    emitted_columns = collect_emitted_projection_columns(region_type_key, region_block)
    normalized_expected = {normalize_sql_identifier(column): column for column in expected_columns}

    for normalized, display_name in normalized_expected.items():
        if normalized not in emitted_columns:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start)}: "
                f"DSL_PROJECTION_COLUMN_MISSING {component_label} source projects '{display_name}' but no matching child column is emitted"
            )

    for normalized, (source_name, column_identifier, allowed_extra) in emitted_columns.items():
        if allowed_extra or normalized in normalized_expected:
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start)}: "
            f"DSL_PROJECTION_COLUMN_UNKNOWN {component_label} child column '{column_identifier}' maps to '{source_name}', "
            "which is not returned by the region source projection"
        )


def lint_column_block_shape(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    column_label: str,
    column_block: str,
    column_top_level_blocks: dict[str, tuple[int, str]],
    require_layout_sequence: bool,
) -> None:
    """Validate compiler-safe multiline column block shape."""
    if not require_layout_sequence:
        return

    one_line_layout = re.search(r"(?m)^[ \t]*layout[ \t]*\{[ \t]*sequence[ \t]*:", column_block)
    if one_line_layout:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + one_line_layout.start())}: "
            f"DSL_RULE_BLOCK {column_label} must emit layout as a multiline block with sequence on its own line"
        )
        return

    layout_meta = column_top_level_blocks.get("layout")
    if not layout_meta:
        return

    _layout_offset, layout_block = layout_meta
    layout_props = {
        prop_name
        for prop_name, _prop_value, _prop_offset in extract_immediate_brace_property_values(layout_block)
    }
    if "sequence" not in layout_props:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + layout_meta[0])}: "
            f"DSL_RULE_REQUIRED {column_label} layout must define sequence on its own line"
        )


def collect_template_component_sort_identifiers(region_block: str, sql_query_text: str | None) -> set[str]:
    """Collect declared/projected template-component identifiers that are valid static sort keys."""
    identifiers: set[str] = set()

    for _child_offset, column_identifier, column_block in find_immediate_unnamed_component_blocks(region_block, "column"):
        if column_identifier:
            identifiers.add(normalize_sql_identifier(column_identifier))
        direct_props = {
            prop_name: (prop_value, prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_property_values(column_block)
        }
        column_name_meta = direct_props.get("columnName")
        if column_name_meta:
            identifiers.add(normalize_sql_identifier(column_name_meta[0]))
        column_top_level_blocks = extract_top_level_blocks(column_block)
        source_meta = column_top_level_blocks.get("source")
        if not source_meta:
            continue
        _source_offset, source_block = source_meta
        source_props = {
            prop_name: (prop_value, prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
        }
        database_column_meta = source_props.get("databaseColumn")
        if database_column_meta:
            identifiers.add(normalize_sql_identifier(database_column_meta[0]))

    if sql_query_text:
        select_list = extract_top_level_select_list(sql_query_text)
        if select_list:
            for expression in select_list:
                identifier = extract_select_expression_identifier(expression)
                if identifier:
                    identifiers.add(normalize_sql_identifier(identifier))

    return identifiers


def normalized_order_by_term_identifier(term: str) -> str | None:
    """Return the identifier part of a simple ORDER BY term, or None for expressions."""
    cleaned = term.strip().rstrip(",")
    cleaned = re.sub(r"(?i)\s+nulls\s+(first|last)\s*$", "", cleaned).strip()
    cleaned = re.sub(r"(?i)\s+(asc|desc)\s*$", "", cleaned).strip()
    if not re.fullmatch(r'"?[A-Za-z][A-Za-z0-9_$#]*"?', cleaned):
        return None
    return normalize_sql_identifier(cleaned)


def lint_template_component_order_by(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Validate report template-component SQL ordering uses the region-level orderBy block."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return

    source_offset, source_block = source_meta
    source_prop_names = {
        prop_name: prop_offset for prop_name, prop_offset in extract_immediate_brace_property_names(source_block)
    }
    source_props = {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
    }
    source_type_meta = source_props.get("type")
    source_type = clean_scalar_value(source_type_meta[0]).lower() if source_type_meta else ""
    sql_query_text = extract_fenced_property_body(source_block, "sqlQuery")
    has_sql_source = source_type == "sqlquery" or "sqlQuery" in source_prop_names
    if not has_sql_source:
        return

    if sql_query_text and contains_sql_order_by_clause(sql_query_text):
        sql_offset = source_prop_names.get("sqlQuery", 0)
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + source_offset + sql_offset)}: "
            f"DSL_RULE_VALUE {component_label} source.sqlQuery must not contain ORDER BY; "
            "use the top-level orderBy block instead"
        )

    order_by_meta = top_level_blocks.get("orderBy")
    if not order_by_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + source_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} with SQL source must define top-level orderBy"
        )
        return

    order_by_offset, order_by_block = order_by_meta
    order_by_props = {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(order_by_block)
    }
    type_meta = order_by_props.get("type")
    if not type_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + order_by_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} orderBy must define type: staticValue or type: item"
        )
        return

    order_by_type_value, order_by_type_offset = type_meta
    order_by_type = clean_scalar_value(order_by_type_value)
    normalized_order_by_type = order_by_type.lower()
    if normalized_order_by_type not in {"staticvalue", "item"}:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + order_by_offset + order_by_type_offset)}: "
            f"DSL_RULE_ENUM {component_label} orderBy.type must be one of: staticValue, item"
        )
        return

    item_object_meta = extract_property_object_block(order_by_block, "item")
    order_by_clause_meta = order_by_props.get("orderByClause")

    if normalized_order_by_type == "staticvalue":
        if item_object_meta:
            item_offset, _item_block = item_object_meta
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + order_by_offset + item_offset)}: "
                f"DSL_RULE_PROP {component_label} orderBy.item is only valid when orderBy.type: item"
            )
        if not order_by_clause_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + order_by_offset)}: "
                f"DSL_RULE_REQUIRED {component_label} orderBy.type: staticValue requires orderBy.orderByClause"
            )
            return

        order_by_clause, order_by_clause_offset = order_by_clause_meta
        if re.match(r"(?i)^\s*order\s+by\b", order_by_clause):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + order_by_offset + order_by_clause_offset)}: "
                f"DSL_RULE_VALUE {component_label} orderBy.orderByClause must omit the leading ORDER BY keyword"
            )
            return

        sort_identifiers = collect_template_component_sort_identifiers(region_block, sql_query_text)
        if not sort_identifiers:
            return
        for term in split_sql_top_level(order_by_clause, ","):
            identifier = normalized_order_by_term_identifier(term)
            if identifier is None:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + order_by_offset + order_by_clause_offset)}: "
                    f"DSL_RULE_VALUE {component_label} orderBy.orderByClause must use declared column aliases; "
                    f"raw sort expression '{term}' is not allowed"
                )
                continue
            if identifier not in sort_identifiers:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + order_by_offset + order_by_clause_offset)}: "
                    f"DSL_RULE_VALUE {component_label} orderBy.orderByClause references undeclared sort column '{term.strip()}'"
                )
        return

    if order_by_clause_meta:
        _order_by_clause, order_by_clause_offset = order_by_clause_meta
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + order_by_offset + order_by_clause_offset)}: "
            f"DSL_RULE_PROP {component_label} orderBy.orderByClause is only valid when orderBy.type: staticValue"
        )
    if not item_object_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + order_by_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} orderBy.type: item requires item object"
        )
        return

    item_offset, item_block = item_object_meta
    item_props = {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_property_values(item_block)
    }
    item_name_meta = item_props.get("itemName")
    if not item_name_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + order_by_offset + item_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} orderBy.item requires itemName"
        )
    else:
        item_name, item_name_offset = item_name_meta
        cleaned_item_name = clean_scalar_value(item_name)
        page_items = {name for _item_start, name, _item_block in find_component_blocks(text, "pageItem")}
        if "{{" not in cleaned_item_name and cleaned_item_name not in page_items:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + order_by_offset + item_offset + item_name_offset)}: "
                f"DSL_RULE_VALUE {component_label} orderBy.item.itemName must reference an available page item"
            )

    order_bys_meta = extract_property_object_block(item_block, "orderBys")
    if not order_bys_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + order_by_offset + item_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} orderBy.item requires orderBys"
        )
        return
    order_bys_offset, order_bys_block = order_bys_meta
    order_bys_entries = [
        (prop_name, prop_value)
        for prop_name, prop_value, _prop_offset in extract_property_values(order_bys_block)
        if prop_name != "orderBys"
    ]
    if not order_bys_entries:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + order_by_offset + item_offset + order_bys_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} orderBy.item.orderBys must define at least one item value to ORDER BY mapping"
        )


def split_top_level_sql_set_queries(sql_text: str) -> list[str]:
    """Split UNION/INTERSECT/MINUS branches without splitting strings or nested queries."""
    sql = strip_sql_comments(sql_text).strip().rstrip(";")
    if not sql:
        return []
    parts: list[str] = []
    part_start = 0
    depth = 0
    in_single_quote = False
    in_double_quote = False
    idx = 0
    while idx < len(sql):
        char = sql[idx]
        next_char = sql[idx + 1] if idx + 1 < len(sql) else ""
        if in_single_quote:
            if char == "'" and next_char == "'":
                idx += 2
                continue
            if char == "'":
                in_single_quote = False
            idx += 1
            continue
        if in_double_quote:
            if char == '"':
                in_double_quote = False
            idx += 1
            continue
        if char == "'":
            in_single_quote = True
            idx += 1
            continue
        if char == '"':
            in_double_quote = True
            idx += 1
            continue
        if char == "(":
            depth += 1
            idx += 1
            continue
        if char == ")":
            depth = max(depth - 1, 0)
            idx += 1
            continue
        if depth == 0:
            match = re.match(r"(?i)(union(?:\s+all)?|intersect|minus)\b", sql[idx:])
            if match:
                before = sql[idx - 1] if idx > 0 else " "
                if not (before.isalnum() or before in "_$#"):
                    part = sql[part_start:idx].strip()
                    if part:
                        parts.append(part)
                    idx += match.end()
                    part_start = idx
                    continue
        idx += 1
    tail = sql[part_start:].strip()
    if tail:
        parts.append(tail)
    return parts


def strip_select_expression_alias(expression: str, expected_alias: str) -> str:
    """Remove a simple trailing select-list alias from an expression."""
    expr = expression.strip().rstrip(",")
    as_alias = re.search(r'(?is)\s+as\s+("(?:[^"]+)"|[A-Za-z][A-Za-z0-9_$#]*)\s*$', expr)
    if as_alias and normalize_sql_identifier(as_alias.group(1)) == normalize_sql_identifier(expected_alias):
        return expr[: as_alias.start()].strip()
    trailing_alias = re.search(r'(?is)\s+("?[A-Za-z][A-Za-z0-9_$#]*"?)\s*$', expr)
    if trailing_alias and normalize_sql_identifier(trailing_alias.group(1)) == normalize_sql_identifier(expected_alias):
        prefix = expr[: trailing_alias.start()].strip()
        if prefix and not prefix.endswith("."):
            return prefix
    return expr


def sql_projection_expressions(sql_text: str, alias: str) -> list[str] | None:
    """Return the expression supplying one projection across every top-level set branch."""
    branches = split_top_level_sql_set_queries(sql_text)
    if not branches:
        return None
    select_lists: list[list[str]] = []
    for branch in branches:
        select_list = extract_top_level_select_list(branch)
        if not select_list:
            return None
        select_lists.append(select_list)

    target = normalize_sql_identifier(alias)
    target_index = -1
    for index, expression in enumerate(select_lists[0]):
        identifier = extract_select_expression_identifier(expression)
        if identifier and normalize_sql_identifier(identifier) == target:
            target_index = index
            break
    if target_index < 0:
        return None
    if any(target_index >= len(select_list) for select_list in select_lists):
        return None
    return [strip_select_expression_alias(select_list[target_index], alias) for select_list in select_lists]


def sql_string_literal_value(expression: str) -> str | None:
    """Return an Oracle SQL string literal value when the whole expression is one literal."""
    match = re.fullmatch(r"\s*'((?:''|[^'])*)'\s*", expression, re.DOTALL)
    if not match:
        return None
    return match.group(1).replace("''", "'")


def avatar_url_expression_is_safe(expression: str) -> bool:
    """Prove an Avatar URL expression uses a canonical application-file SQL bind."""
    cleaned = expression.strip()
    if not cleaned:
        return False
    lowered = cleaned.lower()
    if re.search(r"(?i)(?:javascript|data)\s*:", cleaned):
        return False
    if re.search(r"(?i)(?:^|['\"\s])//", cleaned):
        return False
    if re.search(r"(?i)\bhttps?\s*:", cleaned):
        return False
    case_match = re.fullmatch(r"(?is)case\b.*\bend", cleaned)
    if case_match:
        outputs = re.findall(r"(?is)\bthen\s+(.*?)(?=\s+when\b|\s+else\b|\s+end\b)", cleaned)
        else_match = re.search(r"(?is)\belse\s+(.*?)(?=\s+end\b)", cleaned)
        if else_match:
            outputs.append(else_match.group(1))
        return bool(outputs) and all(
            output.strip().lower() == "null" or avatar_url_expression_is_safe(output)
            for output in outputs
        )

    bind_match = AVATAR_URL_BIND_PATTERN.fullmatch(cleaned)
    if not bind_match:
        return False
    relative_path = bind_match.group(2).replace("''", "'").strip()
    if not relative_path or relative_path.startswith("/"):
        return False
    if "//" in relative_path or ":" in relative_path:
        return False
    if any(segment == ".." for segment in relative_path.split("/")):
        return False
    return not bool(re.search(r"[\x00-\x1f\x7f]", relative_path))


def avatar_icon_expression_values(expression: str) -> list[str] | None:
    """Return statically provable Avatar icon output values for a literal or CASE mapping."""
    cleaned = expression.strip()
    literal = sql_string_literal_value(cleaned)
    if literal is not None:
        return [literal]
    if not re.fullmatch(r"(?is)case\b.*\bend", cleaned):
        return None
    outputs = re.findall(r"(?is)\bthen\s+(.*?)(?=\s+when\b|\s+else\b|\s+end\b)", cleaned)
    else_match = re.search(r"(?is)\belse\s+(.*?)(?=\s+end\b)", cleaned)
    if not else_match:
        return None
    outputs.append(else_match.group(1))
    values: list[str] = []
    for output in outputs:
        value = sql_string_literal_value(output.strip())
        if value is None:
            return None
        values.append(value)
    return values or None


CARDS_SEMANTIC_CLASS_VALUES = {
    "u-normal",
    "u-hot",
    "u-info",
    "u-success",
    "u-warning",
    "u-danger",
}


def cards_semantic_class_expression_values(expression: str) -> list[str | None] | None:
    """Return statically provable Cards semantic-class outputs from a literal or CASE."""
    cleaned = expression.strip()
    if cleaned.lower() == "null":
        return [None]
    literal = sql_string_literal_value(cleaned)
    if literal is not None:
        return [literal]
    if not re.fullmatch(r"(?is)case\b.*\bend", cleaned):
        return None
    outputs = re.findall(r"(?is)\bthen\s+(.*?)(?=\s+when\b|\s+else\b|\s+end\b)", cleaned)
    else_match = re.search(r"(?is)\belse\s+(.*?)(?=\s+end\b)", cleaned)
    if not else_match:
        return None
    outputs.append(else_match.group(1))
    values: list[str | None] = []
    for output in outputs:
        candidate = output.strip()
        if candidate.lower() == "null":
            values.append(None)
            continue
        value = sql_string_literal_value(candidate)
        if value is None:
            return None
        values.append(value)
    return values or None


def cards_url_has_forbidden_shape(value: str) -> bool:
    """Reject Cards URLs that are not static relative paths or literal HTTPS destinations."""
    cleaned = clean_scalar_value(value).strip()
    if not cleaned or re.search(r"[\x00-\x20\\]", cleaned):
        return True
    if cleaned.startswith(("&APP_FILES.", "&WORKSPACE_FILES.", "#APP_FILES#", "#WORKSPACE_FILES#")):
        return False
    if re.search(r"&[A-Za-z][A-Za-z0-9_$#-]*(?:![A-Za-z]+)?\.|#[A-Za-z][A-Za-z0-9_$#-]*#", cleaned):
        return True
    if cleaned.startswith("//"):
        return True
    parsed = urlsplit(cleaned)
    if parsed.scheme:
        return parsed.scheme.lower() != "https" or not parsed.hostname or parsed.username is not None or parsed.password is not None
    return any(segment == ".." for segment in parsed.path.split("/"))


def normalized_https_url_prefix(value: str) -> str:
    """Return a canonical safe HTTPS URL prefix or an empty string."""
    cleaned = clean_scalar_value(value).strip()
    if not cleaned or re.search(r"[\x00-\x20\\*]", cleaned):
        return ""
    parsed = urlsplit(cleaned)
    if (
        parsed.scheme.lower() != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
    ):
        return ""
    return cleaned.rstrip("/")


def rest_operation_url_prefix(endpoint_url: str, url_path_prefix: str) -> str:
    """Resolve the exact REST source URL prefix guarded by a Web Credential."""
    endpoint = normalized_https_url_prefix(endpoint_url)
    path_prefix = clean_scalar_value(url_path_prefix).strip()
    if not endpoint or not path_prefix or "://" in path_prefix or "\\" in path_prefix:
        return ""
    if any(segment == ".." for segment in path_prefix.split("/")):
        return ""
    if path_prefix == ".":
        return endpoint
    return urljoin(f"{endpoint}/", path_prefix).rstrip("/")


def cards_url_expression_values(expression: str) -> list[str | None] | None:
    """Return statically provable URL outputs from a literal or CASE expression."""
    cleaned = expression.strip()
    if cleaned.lower() == "null":
        return [None]
    literal = sql_string_literal_value(cleaned)
    if literal is not None:
        return [literal]
    if not re.fullmatch(r"(?is)case\b.*\bend", cleaned):
        return None
    outputs = re.findall(r"(?is)\bthen\s+(.*?)(?=\s+when\b|\s+else\b|\s+end\b)", cleaned)
    else_match = re.search(r"(?is)\belse\s+(.*?)(?=\s+end\b)", cleaned)
    if not else_match:
        return None
    outputs.append(else_match.group(1))
    values: list[str | None] = []
    for output in outputs:
        candidate = output.strip()
        if candidate.lower() == "null":
            values.append(None)
            continue
        value = sql_string_literal_value(candidate)
        if value is None:
            return None
        values.append(value)
    return values or None


def cards_projected_url_is_safe(
    *,
    column_name: str,
    source_kind: str,
    top_level_blocks: dict[str, tuple[int, str]],
    validation_context: dict[str, Any] | None,
) -> bool:
    """Prove a SQL or REST Cards URL column is constrained to safe URL values."""
    if source_kind == "sql":
        source_meta = top_level_blocks.get("source")
        if not source_meta:
            return False
        sql_query_text = extract_fenced_property_body(source_meta[1], "sqlQuery") or ""
        expressions = sql_projection_expressions(sql_query_text, column_name)
        if not expressions:
            return False
        values: list[str | None] = []
        for expression in expressions:
            expression_values = cards_url_expression_values(expression)
            if expression_values is None:
                return False
            values.extend(expression_values)
        return bool(values) and all(value is None or not cards_url_has_forbidden_shape(value) for value in values)

    if source_kind == "rest":
        source_meta = top_level_blocks.get("source")
        if not source_meta:
            return False
        source_props = {
            name: clean_scalar_value(value)
            for name, value, _prop_offset in extract_immediate_brace_property_values(source_meta[1])
        }
        rest_reference = normalize_component_reference(source_props.get("restSource", ""))
        profile_constraints = (validation_context or {}).get("rest_profile_url_prefixes", {})
        column_constraints = (
            profile_constraints.get(rest_reference, {}).get(normalize_sql_identifier(column_name))
            if isinstance(profile_constraints, dict)
            else None
        )
        if not column_constraints:
            return False
        return all(
            constraint == "application-static-relative" or bool(normalized_https_url_prefix(constraint))
            for constraint in column_constraints
        )
    return False


def avatar_description_literal_is_human_readable(expression: str) -> bool:
    """Return whether a static description projection is nonempty human-readable text."""
    value = sql_string_literal_value(expression.strip())
    if value is None:
        return False
    normalized = value.strip()
    if not normalized or re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", normalized):
        return False
    if re.match(r"(?i)^(?:javascript|data|https?):", normalized):
        return False
    if re.fullmatch(r"fa-[A-Za-z0-9_-]+", normalized):
        return False
    return True


def avatar_comment_text(region_block: str) -> str:
    """Return the standalone Avatar region's compiler-backed comments text."""
    comments_meta = extract_top_level_blocks(region_block).get("comments")
    if not comments_meta:
        return ""
    _comments_offset, comments_block = comments_meta
    for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(comments_block):
        if prop_name == "comments":
            return clean_scalar_value(prop_value)
    return ""


def avatar_comment_has_marker(comment_text: str, marker: str) -> bool:
    """Return whether a semicolon/newline-delimited Avatar governance marker is present."""
    return bool(re.search(rf"(?i)(?:^|[;\n])\s*{re.escape(marker)}\s*(?:;|$)", comment_text))


def avatar_description_evidence_source(comment_text: str) -> str:
    """Return the declared provenance for a dynamic Avatar description check."""
    match = re.search(
        r"(?i)(?:^|[;\n])\s*AVATAR_DESCRIPTION_EVIDENCE_SOURCE\s*=\s*([^;\n]+)",
        comment_text,
    )
    return match.group(1).strip().lower() if match else ""


def avatar_css_rationale(comment_text: str) -> str:
    """Extract a nonempty Avatar CSS rationale from component comments."""
    match = re.search(r"(?i)(?:^|[;\n])\s*AVATAR_CSS_RATIONALE\s*=\s*([^;\n]+)", comment_text)
    return match.group(1).strip() if match else ""


def lint_avatar_url_column_image_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_type_key: str,
    region_block: str,
    container_offset: int,
    container_block: str,
    property_path: str,
    declared_columns: dict[str, str] | None = None,
    sql_query_text: str | None = None,
    column_description: str = "Avatar child column",
) -> None:
    """Enforce the shared application-managed URL-column contract for Avatar image payloads."""
    image_object_meta = extract_property_object_block(container_block, "image")
    if not image_object_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + container_offset)}: "
            f"AVATAR_IMAGE_URL_COLUMN_REQUIRED_001 {component_label} {property_path} must be an object "
            "using type: urlColumn and urlColumn"
        )
        return

    image_offset, image_block = image_object_meta
    image_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_property_values(image_block)
        if prop_name != "image"
    }
    for prop_name in sorted(set(image_props) - {"type", "urlColumn"}):
        _prop_value, prop_offset = image_props[prop_name]
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + container_offset + image_offset + prop_offset)}: "
            f"AVATAR_IMAGE_URL_COLUMN_REQUIRED_001 {component_label} {property_path}.{prop_name} is not allowed "
            "by the proven URL-column image contract"
        )

    image_type_meta = image_props.get("type")
    if not image_type_meta or image_type_meta[0] != "urlColumn":
        error_offset = image_type_meta[1] if image_type_meta else 0
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + container_offset + image_offset + error_offset)}: "
            f"AVATAR_IMAGE_URL_COLUMN_REQUIRED_001 {component_label} {property_path}.type must be urlColumn"
        )
    url_column_meta = image_props.get("urlColumn")
    if not url_column_meta:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + container_offset + image_offset)}: "
            f"AVATAR_IMAGE_URL_COLUMN_REQUIRED_001 {component_label} {property_path} must define urlColumn"
        )
        return

    url_column, url_column_offset = url_column_meta
    if "{{" in url_column:
        return

    avatar_columns = dict(declared_columns) if declared_columns is not None else {}
    if declared_columns is None:
        for _column_offset, _column_identifier, column_block in find_region_column_blocks(region_type_key, region_block):
            source_meta = extract_top_level_blocks(column_block).get("source")
            if not source_meta:
                continue
            _source_offset, source_block = source_meta
            source_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
            }
            database_column = source_props.get("databaseColumn", "")
            if database_column:
                avatar_columns[normalize_sql_identifier(database_column)] = source_props.get("dataType", "")

    if sql_query_text is None:
        region_top_level_blocks = extract_top_level_blocks(region_block)
        source_meta = region_top_level_blocks.get("source")
        sql_query_text = ""
        if source_meta:
            _source_offset, source_block = source_meta
            sql_query_text = extract_fenced_property_body(source_block, "sqlQuery") or ""

    normalized_url_column = normalize_sql_identifier(url_column)
    if normalized_url_column not in avatar_columns:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + container_offset + image_offset + url_column_offset)}: "
            f"AVATAR_IMAGE_URL_COLUMN_REQUIRED_001 {component_label} {property_path}.urlColumn '{url_column}' "
            f"must reference a declared {column_description}"
        )
    elif avatar_columns[normalized_url_column].lower() != "varchar2":
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + container_offset + image_offset + url_column_offset)}: "
            f"AVATAR_IMAGE_URL_COLUMN_REQUIRED_001 {component_label} {property_path}.urlColumn '{url_column}' "
            f"must reference a varchar2 {column_description}"
        )
    else:
        expressions = sql_projection_expressions(sql_query_text, url_column) if sql_query_text else None
        if not expressions:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + container_offset + image_offset + url_column_offset)}: "
                f"AVATAR_IMAGE_URL_SAFETY_REQUIRED_001 {component_label} cannot prove the rendered URL source for "
                f"{property_path}.urlColumn '{url_column}'; use an explicit source.sqlQuery projection"
            )
        elif any(not avatar_url_expression_is_safe(expression) for expression in expressions):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + container_offset + image_offset + url_column_offset)}: "
                f"AVATAR_IMAGE_URL_SAFETY_REQUIRED_001 {component_label} {property_path}.urlColumn '{url_column}' "
                "must use a canonical :APP_FILES or :APEX_FILES bind concatenated with one static relative path; "
                "template/substitution tokens, BLOB endpoints, raw columns, traversal, javascript:, data:, "
                "protocol-relative, and absolute external URLs are rejected"
            )


def lint_nested_avatar_payload_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    avatar_offset: int,
    avatar_block: str,
    rule_id: str,
) -> tuple[str, dict[str, tuple[str, int]]] | None:
    """Enforce the shared nested Avatar type/payload relationship."""
    avatar_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(avatar_block)
    }
    type_meta = avatar_props.get("type")
    if not type_meta:
        return None

    avatar_type, type_offset = type_meta
    if "{{" in avatar_type or avatar_type not in {"initials", "icon", "image"}:
        return None

    payload_names = {"initials", "icon", "image"}
    present_payloads = payload_names.intersection(avatar_props)
    if avatar_type not in present_payloads:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + avatar_offset + type_offset)}: "
            f"{rule_id} {component_label} plugin-avatar.type: {avatar_type} requires plugin-avatar.{avatar_type}"
        )

    for payload_name in sorted(present_payloads - {avatar_type}):
        _payload_value, payload_offset = avatar_props[payload_name]
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + avatar_offset + payload_offset)}: "
            f"{rule_id} {component_label} plugin-avatar.{payload_name} must be omitted when type: {avatar_type}"
        )

    return avatar_type, avatar_props


def lint_timeline_nested_component_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Enforce Timeline's nested Avatar and Badge display contracts."""
    settings_meta = top_level_blocks.get("settings")
    if not settings_meta:
        return

    settings_offset, settings_block = settings_meta
    settings_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
    }

    nested_contracts = (
        ("displayAvatar", "plugin-avatar", "TIMELINE_AVATAR_BLOCK_REQUIRED_001"),
        ("displayBadge", "plugin-badge", "TIMELINE_BADGE_BLOCK_REQUIRED_001"),
    )
    for setting_name, block_name, rule_id in nested_contracts:
        setting_meta = settings_props.get(setting_name)
        enabled = bool(setting_meta and normalize_value(setting_meta[0]) == "true")
        block_meta = top_level_blocks.get(block_name)
        if enabled and not block_meta:
            setting_line_offset = settings_offset + (setting_meta[1] if setting_meta else 0)
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + setting_line_offset)}: "
                f"{rule_id} {component_label} settings.{setting_name}: true requires {block_name}"
            )
        elif not enabled and block_meta:
            block_offset, _block_text = block_meta
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_offset)}: "
                f"{rule_id} {component_label} {block_name} requires settings.{setting_name}: true"
            )

    avatar_meta = top_level_blocks.get("plugin-avatar")
    if not avatar_meta:
        return

    avatar_offset, avatar_block = avatar_meta
    payload_contract = lint_nested_avatar_payload_contract(
        issues=issues,
        path=path,
        text=text,
        component_start=component_start,
        component_label=component_label,
        avatar_offset=avatar_offset,
        avatar_block=avatar_block,
        rule_id="TIMELINE_AVATAR_PAYLOAD_REQUIRED_001",
    )
    if not payload_contract:
        return
    avatar_type, _avatar_props = payload_contract

    if avatar_type == "image":
        lint_avatar_url_column_image_contract(
            issues=issues,
            path=path,
            text=text,
            component_start=component_start,
            component_label=component_label,
            region_type_key="timeline",
            region_block=region_block,
            container_offset=avatar_offset,
            container_block=avatar_block,
            property_path="plugin-avatar.image",
        )


def lint_comments_nested_avatar_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
    declared_columns: dict[str, str] | None = None,
    source_props_override: dict[str, str] | None = None,
    sql_query_text: str | None = None,
    column_description: str = "Comments child column",
) -> None:
    """Enforce Comments' nested Avatar display, payload, and image-source contracts."""
    settings_meta = top_level_blocks.get("settings")
    if not settings_meta:
        return

    settings_offset, settings_block = settings_meta
    settings_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
    }
    display_meta = settings_props.get("displayAvatar")
    display_enabled = bool(display_meta and normalize_value(display_meta[0]) == "true")
    avatar_meta = top_level_blocks.get("plugin-avatar")
    if display_enabled and not avatar_meta:
        display_offset = settings_offset + (display_meta[1] if display_meta else 0)
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + display_offset)}: "
            f"COMMENTS_AVATAR_BLOCK_REQUIRED_001 {component_label} settings.displayAvatar: true requires plugin-avatar"
        )
        return
    if not display_enabled and avatar_meta:
        avatar_offset, _avatar_block = avatar_meta
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + avatar_offset)}: "
            f"COMMENTS_AVATAR_BLOCK_REQUIRED_001 {component_label} plugin-avatar requires settings.displayAvatar: true"
        )
    if not avatar_meta:
        return

    avatar_offset, avatar_block = avatar_meta
    payload_contract = lint_nested_avatar_payload_contract(
        issues=issues,
        path=path,
        text=text,
        component_start=component_start,
        component_label=component_label,
        avatar_offset=avatar_offset,
        avatar_block=avatar_block,
        rule_id="COMMENTS_AVATAR_PAYLOAD_REQUIRED_001",
    )
    if not payload_contract:
        return
    avatar_type, avatar_props = payload_contract

    if avatar_type == "image":
        lint_avatar_url_column_image_contract(
            issues=issues,
            path=path,
            text=text,
            component_start=component_start,
            component_label=component_label,
            region_type_key="comments",
            region_block=region_block,
            container_offset=avatar_offset,
            container_block=avatar_block,
            property_path="plugin-avatar.image",
            declared_columns=declared_columns,
            sql_query_text=sql_query_text,
            column_description=column_description,
        )

    if avatar_type == "initials" and "initials" in avatar_props:
        initials_value, initials_offset = avatar_props["initials"]
        if "{{" not in initials_value:
            comments_columns = dict(declared_columns) if declared_columns is not None else {}
            if declared_columns is None:
                for _column_offset, _column_identifier, column_block in find_region_column_blocks("comments", region_block):
                    source_meta = extract_top_level_blocks(column_block).get("source")
                    if not source_meta:
                        continue
                    _source_offset, source_block = source_meta
                    source_props = {
                        prop_name: clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
                    }
                    database_column = source_props.get("databaseColumn", "")
                    if database_column:
                        comments_columns[normalize_sql_identifier(database_column)] = source_props.get("dataType", "")
            normalized_initials = normalize_sql_identifier(initials_value)
            source_props = dict(source_props_override) if source_props_override is not None else {}
            if source_props_override is None:
                source_meta = top_level_blocks.get("source")
                if source_meta:
                    _source_offset, source_block = source_meta
                    source_props = {
                        prop_name: clean_scalar_value(prop_value)
                        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
                    }
            if (
                normalize_value(source_props.get("location", "")) == "sampledata"
                and normalize_value(source_props.get("sampleData", "")) == "tasks"
                and normalized_initials == "initials"
            ):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + avatar_offset + initials_offset)}: "
                    f"COMMENTS_TASKS_INITIALS_UNAVAILABLE_001 {component_label} sampleData: tasks does not expose "
                    "the INITIALS column at runtime; use a verified SQL-projected initials column such as AVATAR_INITIALS"
                )
            if not component_identifier_is_live_external(initials_value):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + avatar_offset + initials_offset)}: "
                    f"COMMENTS_AVATAR_INITIALS_COLUMN_REQUIRED_001 {component_label} plugin-avatar.initials must use "
                    "a direct uppercase source-column identifier"
                )
            elif normalized_initials not in comments_columns:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + avatar_offset + initials_offset)}: "
                    f"COMMENTS_AVATAR_INITIALS_COLUMN_REQUIRED_001 {component_label} plugin-avatar.initials "
                    f"'{initials_value}' must reference a declared {column_description}"
                )
            elif comments_columns[normalized_initials].lower() != "varchar2":
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + avatar_offset + initials_offset)}: "
                    f"COMMENTS_AVATAR_INITIALS_COLUMN_REQUIRED_001 {component_label} plugin-avatar.initials "
                    f"'{initials_value}' must reference a varchar2 {column_description}"
                )


def lint_comments_unsupported_blocks(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    component_block: str,
) -> None:
    """Reject Comments grouping and nested Badge shapes with deterministic guidance."""
    unsupported = {
        "plugin-grouping": (
            "COMMENTS_GROUPING_UNSUPPORTED_001",
            "grouping is unsupported for generated APEXlang because the pinned compiler rejects plugin-grouping application properties",
        ),
        "plugin-badge": (
            "COMMENTS_NESTED_BADGE_UNSUPPORTED_001",
            "nested plugin-badge is unsupported; use a separate Badge region instead",
        ),
    }
    for block_name, (rule_id, guidance) in unsupported.items():
        block_meta = extract_top_level_blocks(component_block).get(block_name)
        if not block_meta:
            continue
        block_offset, _block_text = block_meta
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset)}: "
            f"{rule_id} {component_label} must not define {block_name}; {guidance}"
        )


def comments_column_declared_types(region_block: str) -> dict[str, str]:
    """Return Interactive Report column identifiers and their declared data types."""
    column_types: dict[str, str] = {}
    for _column_offset, column_identifier, column_block in find_immediate_component_blocks(region_block, "column"):
        if extract_item_type(column_block) == "themeTemplateComponent/comments":
            continue
        source_meta = extract_top_level_blocks(column_block).get("source")
        if not source_meta or not column_identifier:
            continue
        _source_offset, source_block = source_meta
        source_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
        }
        column_types[normalize_sql_identifier(column_identifier)] = source_props.get("dataType", "")
    return column_types


def lint_comments_column_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    action_schema: dict[str, Any],
) -> None:
    """Validate a Comments template component used as an Interactive Report column."""
    columns = find_immediate_component_blocks(region_block, "column")
    comments_columns = [
        (offset, identifier, block)
        for offset, identifier, block in columns
        if extract_item_type(block) == "themeTemplateComponent/comments"
    ]
    if not comments_columns:
        return

    declared_types = comments_column_declared_types(region_block)
    report_source_props: dict[str, str] = {}
    report_sql_query = ""
    report_source_meta = extract_top_level_blocks(region_block).get("source")
    if report_source_meta:
        _report_source_offset, report_source_block = report_source_meta
        report_source_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(report_source_block)
        }
        report_sql_query = extract_fenced_property_body(report_source_block, "sqlQuery") or ""
    report_only_blocks = {"componentAppearance", "rowSelection", "performance", "pagination", "entityTitle", "messages", "advanced"}
    for column_offset, column_identifier, column_block in comments_columns:
        column_label = f"{component_label} Comments column '{column_identifier}'"
        absolute_column_start = component_start + column_offset
        top_level_blocks = extract_top_level_blocks(column_block)

        if isinstance(action_schema, dict) and action_schema:
            lint_region_actions(
                issues=issues,
                path=path,
                text=text,
                component_start=absolute_column_start,
                component_label=column_label,
                region_block=column_block,
                action_schema=action_schema,
            )
        lint_comments_action_semantics(
            issues=issues,
            path=path,
            text=text,
            component_start=absolute_column_start,
            component_label=column_label,
            component_block=column_block,
        )
        lint_comments_unsupported_blocks(
            issues=issues,
            path=path,
            text=text,
            component_start=absolute_column_start,
            component_label=column_label,
            component_block=column_block,
        )
        lint_comments_nested_avatar_contract(
            issues=issues,
            path=path,
            text=text,
            component_start=absolute_column_start,
            component_label=column_label,
            region_block=column_block,
            top_level_blocks=top_level_blocks,
            declared_columns=declared_types,
            source_props_override=report_source_props,
            sql_query_text=report_sql_query,
            column_description="sibling Interactive Report column",
        )
        lint_comments_rendering_values(
            issues=issues,
            path=path,
            text=text,
            component_start=absolute_column_start,
            component_label=column_label,
            region_block=column_block,
            top_level_blocks=top_level_blocks,
            column_types=declared_types,
        )

        for block_name in sorted(report_only_blocks.intersection(top_level_blocks)):
            block_offset, _block_text = top_level_blocks[block_name]
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_column_start + block_offset)}: "
                f"COMMENTS_COLUMN_REPORT_BLOCK_FORBIDDEN_001 {column_label} must not define report-only block '{block_name}'"
            )

        source_meta = top_level_blocks.get("source")
        if source_meta:
            source_offset, source_block = source_meta
            source_props = {
                prop_name: (clean_scalar_value(prop_value), prop_offset)
                for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
            }
            for prop_name in ("type", "databaseColumn", "sqlExpression", "primaryKey"):
                if prop_name not in source_props:
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_column_start + source_offset + source_props[prop_name][1])}: "
                    f"COMMENTS_COLUMN_SOURCE_INVALID_001 {column_label} source.{prop_name} is not valid for a partial Comments column; "
                    "declare only source.dataType and project the mapped values through sibling Interactive Report columns"
                )

        settings_meta = top_level_blocks.get("settings")
        if not settings_meta:
            continue
        settings_offset, settings_block = settings_meta
        settings_props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
        }
        for property_name in ("style", "alignment", "applyThemeColors"):
            property_meta = settings_props.get(property_name)
            if not property_meta:
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_column_start + settings_offset + property_meta[1])}: "
                f"COMMENTS_COLUMN_REPORT_PROPERTY_FORBIDDEN_001 {column_label} settings.{property_name} is report-only and cannot be used by a partial Comments column"
            )

        for property_name in ("userName", "commentText", "date"):
            property_meta = settings_props.get(property_name)
            if not property_meta:
                continue
            property_value, property_offset = property_meta
            normalized_value = normalize_sql_identifier(property_value)
            issue_prefix = (
                f"{display_path(path)}:{line_no(text, absolute_column_start + settings_offset + property_offset)}: "
                f"COMMENTS_COLUMN_MAPPING_REQUIRED_001 {column_label} settings.{property_name}"
            )
            if not component_identifier_is_live_external(property_value):
                issues.append(f"{issue_prefix} must use a direct uppercase Interactive Report column identifier")
                continue
            if normalized_value not in declared_types:
                issues.append(f"{issue_prefix} '{property_value}' must reference a declared sibling Interactive Report column")
                continue
            data_type = normalize_value(declared_types[normalized_value])
            if property_name in {"userName", "commentText"} and data_type not in {"varchar2", "string", "clob"}:
                issues.append(
                    f"{issue_prefix} '{property_value}' must reference a text-compatible source column, not {declared_types[normalized_value]}"
                )
            if property_name == "date" and data_type not in {"date", "timestamp", "timestampwithtimezone", "timestampwithlocaltimezone"}:
                issues.append(
                    f"{issue_prefix} '{property_value}' must reference a date or timestamp source column, not {declared_types[normalized_value]}"
                )


def comments_declared_column_types(region_block: str) -> dict[str, str]:
    """Return declared Comments child columns keyed by normalized database column name."""
    column_types: dict[str, str] = {}
    for _column_offset, _column_identifier, column_block in find_region_column_blocks("comments", region_block):
        source_meta = extract_top_level_blocks(column_block).get("source")
        if not source_meta:
            continue
        _source_offset, source_block = source_meta
        source_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
        }
        database_column = source_props.get("databaseColumn", "")
        if database_column:
            column_types[normalize_sql_identifier(database_column)] = source_props.get("dataType", "")
    return column_types


def lint_comments_mapping_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Require Comments field mappings to reference declared child columns directly."""
    settings_meta = top_level_blocks.get("settings")
    if not settings_meta:
        return
    settings_offset, settings_block = settings_meta
    settings_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
    }
    column_types = comments_declared_column_types(region_block)
    for property_name in ("userName", "commentText", "date"):
        property_meta = settings_props.get(property_name)
        if not property_meta:
            continue
        property_value, property_offset = property_meta
        normalized_value = normalize_sql_identifier(property_value)
        issue_prefix = (
            f"{display_path(path)}:{line_no(text, component_start + settings_offset + property_offset)}: "
            f"COMMENTS_MAPPING_REQUIRED_001 {component_label} settings.{property_name}"
        )
        if not component_identifier_is_live_external(property_value):
            issues.append(f"{issue_prefix} must use a direct uppercase source-column identifier")
        elif normalized_value not in column_types:
            issues.append(
                f"{issue_prefix} '{property_value}' must reference a declared Comments child column"
            )


def lint_comments_report_options(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Require a positive integer page size when Comments pagination specifies one."""
    pagination_meta = top_level_blocks.get("pagination")
    if not pagination_meta:
        return
    pagination_offset, pagination_block = pagination_meta
    pagination_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(pagination_block)
    }
    page_size_meta = pagination_props.get("entitiesPerPage")
    if not page_size_meta:
        return
    page_size, page_size_offset = page_size_meta
    if not re.fullmatch(r"[1-9][0-9]*", page_size):
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + pagination_offset + page_size_offset)}: "
            f"COMMENTS_REPORT_OPTION_REQUIRED_001 {component_label} pagination.entitiesPerPage must be "
            "a positive integer"
        )


def lint_comments_partial_source_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Require a locally provable one-row source for partial Comments."""
    if template_component_display_mode(top_level_blocks) != "partial":
        return
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return
    source_offset, source_block = source_meta
    sql_query = extract_fenced_property_body(source_block, "sqlQuery") or ""
    if not sql_outer_query_has_single_row_bound(sql_query):
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + source_offset)}: "
            f"COMMENTS_PARTIAL_SINGLE_ROW_REQUIRED_001 {component_label} partial display requires a source "
            "proven to return at most one row; use an explicit fetch first 1 row only or rownum bound"
        )


def lint_comments_partial_report_blocks(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Reject report-only Comments blocks when the component renders one partial entity."""
    if template_component_display_mode(top_level_blocks) != "partial":
        return
    for block_name in ("rowSelection", "performance", "pagination", "entityTitle", "messages", "advanced"):
        block_meta = top_level_blocks.get(block_name)
        if not block_meta:
            continue
        block_offset, _block_text = block_meta
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset)}: "
            f"COMMENTS_PARTIAL_REPORT_BLOCK_FORBIDDEN_001 {component_label} partial display must not define "
            f"report-only block '{block_name}'"
        )


def lint_comments_display_style_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Keep the Comments style setting aligned with the compiler-backed display mode."""
    settings_meta = top_level_blocks.get("settings")
    if not settings_meta:
        return
    settings_offset, settings_block = settings_meta
    settings_props = {
        prop_name: prop_offset
        for prop_name, _prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
    }
    display_mode = template_component_display_mode(top_level_blocks)
    style_offset = settings_props.get("style")
    if display_mode == "partial" and style_offset is not None:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + settings_offset + style_offset)}: "
            f"COMMENTS_DISPLAY_STYLE_CONTRACT_001 {component_label} partial display must not define settings.style"
        )
    elif display_mode == "report" and style_offset is None:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + settings_offset)}: "
            f"COMMENTS_DISPLAY_STYLE_CONTRACT_001 {component_label} report display requires settings.style"
        )


def lint_comments_rendering_values(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
    column_types: dict[str, str] | None = None,
) -> None:
    """Reject scriptable Comments attributes and unproven dynamic row classes."""
    settings_meta = top_level_blocks.get("settings")
    if not settings_meta:
        return
    settings_offset, settings_block = settings_meta
    settings_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
    }
    effective_column_types = dict(column_types) if column_types is not None else {}
    if column_types is None:
        for _column_offset, _column_identifier, column_block in find_region_column_blocks("comments", region_block):
            source_meta = extract_top_level_blocks(column_block).get("source")
            if not source_meta:
                continue
            _source_offset, source_block = source_meta
            source_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
            }
            database_column = source_props.get("databaseColumn", "")
            if database_column:
                effective_column_types[normalize_sql_identifier(database_column)] = source_props.get("dataType", "")

    attributes_meta = settings_props.get("attributes")
    if attributes_meta:
        attributes_value, attributes_offset = attributes_meta
        unsafe_attributes = re.search(
            r"(?is)<\s*(?:script|iframe|object|embed|style)\b|\bon[a-z]+\s*=|javascript\s*:|data\s*:|https?\s*://|//|&[A-Za-z0-9_]+\.|#[A-Za-z0-9_$]+#|\{\{|\}\}",
            attributes_value,
        )
        if unsafe_attributes:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + settings_offset + attributes_offset)}: "
                f"COMMENTS_RENDERING_VALUE_SAFE_REQUIRED_001 {component_label} settings.attributes must not "
                "contain scripts, handlers, URL schemes, or substitution-driven content"
            )

    class_meta = settings_props.get("commentClass")
    if class_meta:
        class_value, class_offset = class_meta
        normalized_class = normalize_sql_identifier(class_value)
        mapped_column = component_identifier_is_live_external(class_value) and normalized_class in effective_column_types
        mapped_column_valid = mapped_column and effective_column_types[normalized_class].lower() == "varchar2"
        static_tokens_valid = bool(re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*(?:\s+[A-Za-z][A-Za-z0-9_-]*)*", class_value))
        contains_substitution = bool(re.search(r"(?:&[A-Za-z0-9_]+\.|#[A-Za-z0-9_$]+#|\{\{|\}\})", class_value))
        if contains_substitution or (mapped_column and not mapped_column_valid) or not (mapped_column_valid or static_tokens_valid):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + settings_offset + class_offset)}: "
                f"COMMENTS_RENDERING_VALUE_SAFE_REQUIRED_001 {component_label} settings.commentClass must use "
                "static CSS tokens or a declared varchar2 Comments child column"
            )


def lint_avatar_settings_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    settings_offset: int,
    settings_block: str,
    validation_context: dict[str, Any] | None = None,
) -> None:
    """Enforce the proven standalone Avatar type/payload and URL-column image shapes."""
    settings_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(settings_block)
    }
    type_meta = settings_props.get("type")
    if not type_meta:
        return

    avatar_type, type_offset = type_meta
    if "{{" in avatar_type or avatar_type not in {"initials", "icon", "image"}:
        return

    payload_names = {"initials", "icon", "image"}
    present_payloads = payload_names.intersection(settings_props)
    if avatar_type not in present_payloads:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + settings_offset + type_offset)}: "
            f"AVATAR_TYPE_PAYLOAD_REQUIRED_001 {component_label} settings.type: {avatar_type} "
            f"requires settings.{avatar_type}"
        )

    for payload_name in sorted(present_payloads - {avatar_type}):
        _payload_value, payload_offset = settings_props[payload_name]
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + settings_offset + payload_offset)}: "
            f"AVATAR_TYPE_PAYLOAD_REQUIRED_001 {component_label} settings.{payload_name} must be omitted "
            f"when settings.type: {avatar_type}"
        )

    avatar_columns: dict[str, str] = {}
    for _column_offset, _column_identifier, column_block in find_region_column_blocks("avatar", region_block):
        source_meta = extract_top_level_blocks(column_block).get("source")
        if not source_meta:
            continue
        _source_offset, source_block = source_meta
        source_props = {
            prop_name: clean_scalar_value(prop_value)
            for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
        }
        database_column = source_props.get("databaseColumn", "")
        if database_column:
            avatar_columns[normalize_sql_identifier(database_column)] = source_props.get("dataType", "")

    region_top_level_blocks = extract_top_level_blocks(region_block)
    source_meta = region_top_level_blocks.get("source")
    sql_query_text = ""
    if source_meta:
        _source_offset, source_block = source_meta
        sql_query_text = extract_fenced_property_body(source_block, "sqlQuery") or ""

    comment_text = avatar_comment_text(region_block)
    security_meta = region_top_level_blocks.get("security")
    if security_meta:
        security_offset, security_block = security_meta
        security_props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(security_block)
        }
        authorization_meta = security_props.get("authorizationScheme")
        if authorization_meta:
            authorization_value, authorization_offset = authorization_meta
            known_schemes = (validation_context or {}).get("authorization_schemes", set())
            normalized_authorization = normalize_component_reference(authorization_value)
            if authorization_value == "mustNotBePublicUser":
                pass
            elif not authorization_value.startswith("@") or normalized_authorization not in known_schemes:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + security_offset + authorization_offset)}: "
                    f"AVATAR_AUTHORIZATION_SCHEME_EVIDENCE_REQUIRED_001 {component_label} security.authorizationScheme "
                    "must be mustNotBePublicUser or an @alias resolving to a declared shared authorization scheme"
                )
    decorative = avatar_comment_has_marker(comment_text, "AVATAR_PURPOSE_DECORATIVE")
    description_meta = settings_props.get("description")
    if not description_meta:
        if not decorative:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + settings_offset)}: "
                f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} meaningful initials, icon, and image "
                "Avatars require settings.description; omit it only with the exact region comment marker "
                "'AVATAR_PURPOSE_DECORATIVE'"
            )
    else:
        description_value, description_offset = description_meta
        if decorative:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + settings_offset + description_offset)}: "
                f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} cannot combine settings.description "
                "with the 'AVATAR_PURPOSE_DECORATIVE' marker"
            )
        elif "{{" not in description_value:
            substitution = re.fullmatch(r"&([A-Z][A-Z0-9_]*)\.", description_value)
            if substitution:
                description_column = normalize_sql_identifier(substitution.group(1))
                if description_column not in avatar_columns:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + settings_offset + description_offset)}: "
                        f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} settings.description "
                        f"'{description_value}' must reference a declared Avatar child column"
                    )
                elif avatar_columns[description_column].lower() != "varchar2":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + settings_offset + description_offset)}: "
                        f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} settings.description "
                        f"'{description_value}' must reference a varchar2 Avatar child column"
                    )
                else:
                    expressions = (
                        sql_projection_expressions(sql_query_text, substitution.group(1))
                        if sql_query_text
                        else None
                    )
                    evidence_source = avatar_description_evidence_source(comment_text)
                    evidence_verified = evidence_source in {"schema_doc", "live_db", "user_asserted"}
                    if not expressions:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + settings_offset + description_offset)}: "
                            f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} cannot prove the "
                            f"settings.description source projection '{substitution.group(1)}'"
                        )
                    elif not all(avatar_description_literal_is_human_readable(expression) for expression in expressions) and not evidence_verified:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + settings_offset + description_offset)}: "
                            f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} dynamic description "
                            "sources require provenance persisted as "
                            "'AVATAR_DESCRIPTION_EVIDENCE_SOURCE=schema_doc', '=live_db', or '=user_asserted'"
                        )
            elif not description_value.strip() or re.search(r"(?:&[A-Za-z0-9_]+\.|#[A-Za-z0-9_$]+#)", description_value):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + settings_offset + description_offset)}: "
                    f"AVATAR_ACCESSIBLE_DESCRIPTION_REQUIRED_001 {component_label} settings.description must be "
                    "nonempty human-readable text or one declared uppercase varchar2 column substitution"
                )

    css_meta = settings_props.get("cssClasses")
    if css_meta and "{{" not in css_meta[0]:
        css_value, css_offset = css_meta
        rationale = avatar_css_rationale(comment_text)
        if not rationale:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + settings_offset + css_offset)}: "
                f"AVATAR_CSS_CLASSES_SAFE_REQUIRED_001 {component_label} settings.cssClasses requires a nonempty "
                "'AVATAR_CSS_RATIONALE=<reason>' entry in the region comments"
            )
        if re.search(r"(?:&[A-Za-z0-9_]+\.|#[A-Za-z0-9_$]+#|\{\{|\}\})", css_value):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + settings_offset + css_offset)}: "
                f"AVATAR_CSS_CLASSES_SAFE_REQUIRED_001 {component_label} settings.cssClasses must be static and "
                "must not contain substitutions"
            )
        else:
            framework_approved = avatar_comment_has_marker(
                comment_text,
                "AVATAR_FRAMEWORK_UTILITIES_EXPLICIT_REQUEST",
            )
            for css_class in css_value.split():
                if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*", css_class):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + settings_offset + css_offset)}: "
                        f"AVATAR_CSS_CLASSES_SAFE_REQUIRED_001 {component_label} settings.cssClasses contains "
                        f"invalid static class '{css_class}'"
                    )
                    continue
                if any(pattern.search(css_class.lower()) for pattern in AVATAR_CSS_ALWAYS_FORBIDDEN_PATTERNS):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + settings_offset + css_offset)}: "
                        f"AVATAR_CSS_CLASSES_SAFE_REQUIRED_001 {component_label} settings.cssClasses must not use "
                        f"visibility-changing class '{css_class}'"
                    )
                    continue
                if css_class.startswith(AVATAR_CSS_FRAMEWORK_PREFIXES):
                    if not framework_approved:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, component_start + settings_offset + css_offset)}: "
                            f"AVATAR_CSS_CLASSES_SAFE_REQUIRED_001 {component_label} framework class '{css_class}' "
                            "requires the exact comment marker 'AVATAR_FRAMEWORK_UTILITIES_EXPLICIT_REQUEST'"
                        )
                elif not css_class.startswith("avatar-"):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, component_start + settings_offset + css_offset)}: "
                        f"AVATAR_CSS_CLASSES_SAFE_REQUIRED_001 {component_label} custom class '{css_class}' must use "
                        "the component-scoped 'avatar-' prefix"
                    )

    if avatar_type == "initials" and "initials" in settings_props:
        initials_value, initials_offset = settings_props["initials"]
        if "{{" not in initials_value:
            substitution_match = re.fullmatch(r"&([A-Z][A-Z0-9_]*)\.", initials_value)
            suggested_column = substitution_match.group(1) if substitution_match else initials_value
            normalized_initials = normalize_sql_identifier(initials_value)
            if not component_identifier_is_live_external(initials_value):
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + settings_offset + initials_offset)}: "
                    f"AVATAR_INITIALS_COLUMN_REFERENCE_REQUIRED_001 {component_label} settings.initials "
                    f"must use the direct source-column identifier {suggested_column}, not substitution syntax"
                )
            elif normalized_initials not in avatar_columns:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + settings_offset + initials_offset)}: "
                    f"AVATAR_INITIALS_COLUMN_REFERENCE_REQUIRED_001 {component_label} settings.initials "
                    f"'{initials_value}' must reference a declared Avatar child column"
                )
            elif avatar_columns[normalized_initials].lower() != "varchar2":
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + settings_offset + initials_offset)}: "
                    f"AVATAR_INITIALS_COLUMN_REFERENCE_REQUIRED_001 {component_label} settings.initials "
                    f"'{initials_value}' must reference a varchar2 Avatar child column"
                )

    if avatar_type == "icon" and "icon" in settings_props:
        icon_value, icon_offset = settings_props["icon"]
        lint_template_component_avatar_icon(
            issues=issues,
            path=path,
            text=text,
            absolute_offset=component_start + settings_offset + icon_offset,
            component_label=component_label,
            property_path="settings.icon",
            value=icon_value,
            column_data_types=avatar_columns,
            sql_query_text=sql_query_text,
        )

    if avatar_type != "image":
        return

    lint_avatar_url_column_image_contract(
        issues=issues,
        path=path,
        text=text,
        component_start=component_start,
        component_label=component_label,
        region_type_key="avatar",
        region_block=region_block,
        container_offset=settings_offset,
        container_block=settings_block,
        property_path="settings.image",
    )


def find_property_object_blocks(block: str, prop_name: str) -> list[tuple[int, str]]:
    """Return object-valued property blocks such as target: { ... } with offsets."""
    blocks: list[tuple[int, str]] = []
    pattern = re.compile(rf"(?m)^\s*{re.escape(prop_name)}\s*:\s*\{{")
    for match in pattern.finditer(block):
        brace_start = block.find("{", match.start(), match.end())
        if brace_start == -1:
            continue
        depth = 0
        in_string = False
        for idx in range(brace_start, len(block)):
            ch = block[idx]
            if ch == '"' and (idx == 0 or block[idx - 1] != "\\"):
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    blocks.append((match.start(), block[match.start() : idx + 1]))
                    break
    return blocks


def lint_cards_display_block_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    block_name: str,
    block_offset: int,
    block_text: str,
) -> None:
    """Validate the Cards direct-column versus advanced-HTML display modes."""
    props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(block_text)
    }
    advanced = normalize_value(props.get("advancedFormatting", ("", 0))[0])
    required_prop = "htmlExpression" if advanced == "true" else "column" if advanced == "false" else ""
    forbidden_prop = "column" if advanced == "true" else "htmlExpression" if advanced == "false" else ""
    if required_prop and required_prop not in props:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} {block_name}.advancedFormatting: {advanced} "
            f"requires {block_name}.{required_prop}"
        )
    if forbidden_prop and forbidden_prop in props:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset + props[forbidden_prop][1])}: "
            f"DSL_RULE_PROP {component_label} {block_name}.{forbidden_prop} is not valid when "
            f"{block_name}.advancedFormatting: {advanced}"
        )
    if advanced == "true" and "cssClasses" in props:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset + props['cssClasses'][1])}: "
            f"DSL_RULE_PROP {component_label} {block_name}.cssClasses is valid only when "
            f"{block_name}.advancedFormatting: false"
        )
    if advanced == "true" and "htmlExpression" in props:
        expression, expression_offset = props["htmlExpression"]
        for substitution in re.finditer(r"&[A-Za-z][A-Za-z0-9_$#]*(?:![A-Za-z]+)?\.", expression):
            if substitution.group(0).upper().endswith("!HTML."):
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_offset + expression_offset)}: "
                f"CARDS_SECURITY_REQUIRED_001 {component_label} {block_name}.htmlExpression must use "
                "&COLUMN!HTML. for every database or REST text substitution"
            )
            break


CARDS_DIRECT_COLUMN_MAPPINGS = {
    "card": ("primaryKeyColumn1", "primaryKeyColumn2"),
    "title": ("column",),
    "subtitle": ("column",),
    "body": ("column",),
    "secondaryBody": ("column",),
    "media": ("blobColumn", "urlColumn"),
    "blobAttributes": ("mimeTypeColumn", "lastUpdatedColumn"),
    "iconAndBadge": ("iconColumn", "imageColumn", "badgeColumn"),
}
CARDS_SUBSTITUTION_MAPPINGS = {
    "card": ("cssClasses",),
    "title": ("htmlExpression",),
    "subtitle": ("htmlExpression",),
    "body": ("htmlExpression",),
    "secondaryBody": ("htmlExpression",),
    "media": ("url", "htmlExpression", "imageDescription"),
    "iconAndBadge": ("imageUrl", "iconDescription"),
}
CARDS_COLUMN_SUBSTITUTION_PATTERN = re.compile(
    r"&([A-Za-z][A-Za-z0-9_$#-]*)(?:![A-Za-z]+)?\."
)


def cards_substitution_is_application_scoped(token: str) -> bool:
    """Return whether a Cards substitution is application/page context rather than row data."""
    normalized = token.upper()
    return (
        is_allowed_page_or_app_substitution(token)
        or normalized.startswith("APP_TEXT$")
        or normalized in {"APP_FILES", "WORKSPACE_FILES", "IMAGE_PREFIX"}
    )


def lint_cards_source_shape_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Require exactly one complete SQL-query or REST Data Source shape for Cards."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return
    source_offset, source_block = source_meta
    property_names = {
        prop_name for prop_name, _prop_offset in extract_immediate_brace_property_names(source_block)
    }
    source_props = {
        prop_name: clean_scalar_value(prop_value)
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
    }
    location = normalize_value(source_props.get("location", ""))
    source_type = normalize_value(source_props.get("type", ""))
    has_sql_query = "sqlQuery" in property_names
    has_rest_source = "restSource" in property_names
    valid_sql = (
        location == "localdatabase"
        and source_type == "sqlquery"
        and has_sql_query
        and not has_rest_source
    )
    valid_rest = (
        location == "restsource"
        and has_rest_source
        and not source_type
        and not has_sql_query
    )
    if valid_sql or valid_rest:
        return
    issues.append(
        f"{display_path(path)}:{line_no(text, component_start + source_offset)}: "
        f"CARDS_SOURCE_MAPPING_REQUIRED_001 {component_label} source must use exactly one complete shape: "
        "SQL requires location: localDatabase, type: sqlQuery, and source.sqlQuery with no restSource; "
        "REST requires location: restSource and source.restSource with no type or sqlQuery"
    )


def lint_cards_rest_security_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
    validation_context: dict[str, Any] | None,
) -> None:
    """Require REST-backed Cards to resolve HTTPS server and exact Web Credential restrictions."""
    source_meta = top_level_blocks.get("source")
    if not source_meta:
        return
    source_offset, source_block = source_meta
    source_props = {
        prop_name: clean_scalar_value(prop_value)
        for prop_name, prop_value, _prop_offset in extract_immediate_brace_property_values(source_block)
    }
    if normalize_value(source_props.get("location", "")) != "restsource":
        return

    rest_reference = normalize_component_reference(source_props.get("restSource", ""))
    rest_sources = (validation_context or {}).get("rest_sources", {})
    rest_servers = (validation_context or {}).get("rest_servers", {})
    web_credentials = (validation_context or {}).get("web_credentials", {})
    rest_contract = rest_sources.get(rest_reference) if isinstance(rest_sources, dict) else None
    if not isinstance(rest_contract, dict):
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + source_offset)}: "
            f"CARDS_REST_SECURITY_REQUIRED_001 {component_label} source.restSource must resolve to a declared "
            "REST Data Source security contract"
        )
        return

    remote_server = rest_contract.get("remote_server", "")
    endpoint_url = rest_servers.get(remote_server, "") if isinstance(rest_servers, dict) else ""
    required_prefix = rest_operation_url_prefix(endpoint_url, rest_contract.get("url_path_prefix", ""))
    if not remote_server or not required_prefix:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + source_offset)}: "
            f"CARDS_REST_SECURITY_REQUIRED_001 {component_label} REST Data Source must resolve a declared "
            "restDataSourceServer with a literal HTTPS endpoint and a safe urlPathPrefix"
        )

    credential = rest_contract.get("credential", "")
    valid_for_urls = web_credentials.get(credential) if isinstance(web_credentials, dict) else None
    normalized_restrictions = {
        normalized
        for value in (valid_for_urls or [])
        if (normalized := normalized_https_url_prefix(value))
    }
    if not credential or not valid_for_urls or len(normalized_restrictions) != len(valid_for_urls):
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + source_offset)}: "
            f"CARDS_REST_SECURITY_REQUIRED_001 {component_label} REST Data Source must reference a declared "
            "Web Credential whose advanced.validForUrls contains only literal HTTPS prefixes"
        )
    elif required_prefix and required_prefix not in normalized_restrictions:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + source_offset)}: "
            f"CARDS_REST_SECURITY_REQUIRED_001 {component_label} Web Credential advanced.validForUrls must "
            f"include the exact REST operation prefix '{required_prefix}'"
        )


def lint_cards_media_url_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
    media_props: dict[str, tuple[str, int]],
    validation_context: dict[str, Any] | None,
) -> None:
    """Require Cards media URL values to be static-safe or source-proven."""
    media_meta = top_level_blocks.get("media")
    if not media_meta:
        return
    source_kind = source_projection_columns(top_level_blocks, validation_context)[2]
    property_name = ""
    property_offset = 0
    mapped_column = ""
    if "urlColumn" in media_props:
        property_name = "urlColumn"
        mapped_column, property_offset = media_props[property_name]
    elif "url" in media_props:
        property_name = "url"
        value, property_offset = media_props[property_name]
        if value.startswith(("&APP_FILES.", "&WORKSPACE_FILES.", "#APP_FILES#", "#WORKSPACE_FILES#")):
            return
        references = list(CARDS_COLUMN_SUBSTITUTION_PATTERN.finditer(value))
        compact_value = re.sub(r"[\s\[\]\"']", "", value)
        exact_reference = (
            len(references) == 1
            and compact_value.upper() == f"&{references[0].group(1).upper()}."
        )
        if not references:
            if not cards_url_has_forbidden_shape(value):
                return
        elif exact_reference and not cards_substitution_is_application_scoped(references[0].group(1)):
            mapped_column = references[0].group(1)
        else:
            mapped_column = ""
    else:
        return

    safe = False
    if mapped_column and source_kind == "sql":
        safe = cards_projected_url_is_safe(
            column_name=mapped_column,
            source_kind=source_kind,
            top_level_blocks=top_level_blocks,
            validation_context=validation_context,
        )
    elif mapped_column and source_kind == "rest":
        source_block = top_level_blocks["source"][1]
        source_props = {
            name: clean_scalar_value(value)
            for name, value, _offset in extract_immediate_brace_property_values(source_block)
        }
        rest_reference = normalize_component_reference(source_props.get("restSource", ""))
        all_prefixes = (validation_context or {}).get("rest_profile_url_prefixes", {})
        profile_prefixes = all_prefixes.get(rest_reference, {}) if isinstance(all_prefixes, dict) else {}
        prefixes = profile_prefixes.get(normalize_sql_identifier(mapped_column)) if isinstance(profile_prefixes, dict) else None
        safe = bool(prefixes) and all(
            prefix == "application-static-relative" or bool(normalized_https_url_prefix(prefix))
            for prefix in prefixes or set()
        )
    if safe:
        return
    issues.append(
        f"{display_path(path)}:{line_no(text, component_start + media_meta[0] + property_offset)}: "
        f"CARDS_SECURITY_REQUIRED_001 {component_label} media.{property_name} must be a static relative URL, "
        "a literal HTTPS URL, a SQL literal/CASE projection, or a REST profile column with "
        "authoritative-profile-url-prefixes evidence"
    )


def lint_cards_source_attribute_mappings(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
    validation_context: dict[str, Any] | None = None,
) -> None:
    """Require every Cards source-backed attribute to reference an evidenced source column."""
    if "source" not in top_level_blocks:
        return

    expected_columns, projection_error, source_kind = source_projection_columns(top_level_blocks, validation_context)
    if projection_error:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start)}: "
            f"CARDS_SOURCE_MAPPING_REQUIRED_001 {component_label} {projection_error}"
        )
        return
    if not expected_columns:
        source_requirement = (
            "must define a fenced source.sqlQuery with explicit projection aliases"
            if source_kind == "sql"
            else "must resolve to an SQL query projection or REST data profile"
        )
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start)}: "
            f"CARDS_SOURCE_MAPPING_REQUIRED_001 {component_label} {source_requirement}"
        )
        return

    normalized_columns = {
        normalize_sql_identifier(column)
        for column in expected_columns
    }

    for block_name, prop_names in CARDS_DIRECT_COLUMN_MAPPINGS.items():
        block_meta = top_level_blocks.get(block_name)
        if not block_meta:
            continue
        block_offset, block_text = block_meta
        props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(block_text)
        }
        for prop_name in prop_names:
            prop_meta = props.get(prop_name)
            if not prop_meta:
                continue
            mapped_column, prop_offset = prop_meta
            if normalize_sql_identifier(mapped_column) in normalized_columns:
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_offset + prop_offset)}: "
                f"CARDS_SOURCE_MAPPING_REQUIRED_001 {component_label} {block_name}.{prop_name} "
                f"references '{mapped_column}', which is not projected by the Cards {source_kind} source"
            )

    for block_name, prop_names in CARDS_SUBSTITUTION_MAPPINGS.items():
        block_meta = top_level_blocks.get(block_name)
        if not block_meta:
            continue
        block_offset, block_text = block_meta
        props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(block_text)
        }
        for prop_name in prop_names:
            prop_meta = props.get(prop_name)
            if not prop_meta:
                continue
            prop_value, prop_offset = prop_meta
            for match in CARDS_COLUMN_SUBSTITUTION_PATTERN.finditer(prop_value):
                token = match.group(1)
                if cards_substitution_is_application_scoped(token):
                    continue
                if normalize_sql_identifier(token) in normalized_columns:
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + block_offset + prop_offset)}: "
                    f"CARDS_SOURCE_MAPPING_REQUIRED_001 {component_label} {block_name}.{prop_name} "
                    f"references '&{token}.', which is not projected by the Cards {source_kind} source"
                )


def lint_comments_action_semantics(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    component_block: str,
) -> None:
    """Validate compiler-proven Comments action positions and target shape."""
    allowed_positions = {"actions", "avatarLink", "userNameLink"}
    unsafe_target_pattern = re.compile(
        r"(?i)(?:javascript\s*:|data\s*:|https?\s*:|//|\{\{|<%|\b(?:eval|function|plsql)\s*\()"
    )

    for action_offset, action_identifier, action_block in find_immediate_component_blocks(component_block, "action"):
        action_label = f"{component_label} action '{action_identifier}'"
        absolute_action_start = component_start + action_offset
        action_props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_property_values(action_block)
        }
        position_meta = action_props.get("position")
        position = position_meta[0] if position_meta else ""

        if position and position not in allowed_positions:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start + position_meta[1])}: "
                f"COMMENTS_ACTION_POSITION_INVALID_001 {action_label} position must be one of: "
                "actions, avatarLink, userNameLink"
            )
        if "label" in action_props and position != "actions":
            label_offset = action_props["label"][1]
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start + label_offset)}: "
                f"COMMENTS_ACTION_LABEL_POSITION_001 {action_label} label is supported only when position: actions"
            )

        action_top_level_blocks = extract_top_level_blocks(action_block)
        for legacy_block in ("identification", "template"):
            legacy_meta = action_top_level_blocks.get(legacy_block)
            if legacy_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_action_start + legacy_meta[0])}: "
                    f"COMMENTS_ACTION_LEGACY_SYNTAX_001 {action_label} must not use legacy '{legacy_block}' syntax; "
                    "use root position, optional root label for actions, layout.sequence, and behavior.target"
                )

        behavior_meta = action_top_level_blocks.get("behavior")
        if not behavior_meta:
            continue
        behavior_offset, behavior_block = behavior_meta
        behavior_props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(behavior_block)
        }
        for legacy_property in ("type", "targetUrl"):
            legacy_meta = behavior_props.get(legacy_property)
            if not legacy_meta:
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_offset + legacy_meta[1])}: "
                f"COMMENTS_ACTION_LEGACY_SYNTAX_001 {action_label} behavior.{legacy_property} is not valid; "
                "use structured behavior.target"
            )

        target_blocks = find_property_object_blocks(behavior_block, "target")
        target_meta = behavior_props.get("target")
        if not target_blocks:
            target_offset = target_meta[1] if target_meta else behavior_offset
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_offset + target_offset)}: "
                f"COMMENTS_ACTION_TARGET_REQUIRED_001 {action_label} behavior.target must be a structured object "
                "such as target: { page: 1 }; scalar URLs and targetUrl are not supported"
            )
            continue

        target_offset, target_block = target_blocks[0]
        target_props = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(target_block)
        }
        page_meta = target_props.get("page")
        if not page_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_offset + target_offset)}: "
                f"COMMENTS_ACTION_TARGET_REQUIRED_001 {action_label} behavior.target must define page; "
                "use the compiler-proven structured target form"
            )
        elif parse_int(page_meta[0]) is None:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_offset + target_offset + page_meta[1])}: "
                f"COMMENTS_ACTION_TARGET_REQUIRED_001 {action_label} behavior.target.page must be a literal page number"
            )

        unsafe_match = unsafe_target_pattern.search(target_block)
        if unsafe_match:
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_offset + target_offset + unsafe_match.start())}: "
                f"COMMENTS_ACTION_URL_SAFETY_001 {action_label} behavior.target contains an unsafe URL or executable substitution; "
                "use a reviewed structured page target"
            )


def action_target_item_substitutions(action_block: str) -> list[tuple[str, int]]:
    """Return &COLUMN. substitutions used inside action behavior.target.items."""
    references: list[tuple[str, int]] = []
    behavior_meta = extract_top_level_blocks(action_block).get("behavior")
    if not behavior_meta:
        return references
    behavior_offset, behavior_block = behavior_meta
    for target_offset, target_block in find_property_object_blocks(behavior_block, "target"):
        for items_offset, items_block in find_property_object_blocks(target_block, "items"):
            for match in AMP_SUBSTITUTION_TOKEN_PATTERN.finditer(items_block):
                references.append((match.group(1), behavior_offset + target_offset + items_offset + match.start()))
    return references


def lint_cards_action_source_mappings(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    top_level_blocks: dict[str, tuple[int, str]],
    validation_context: dict[str, Any] | None = None,
) -> None:
    """Validate Cards action item mappings reference projected source columns."""
    expected_columns, projection_error, source_kind = source_projection_columns(top_level_blocks, validation_context)
    if projection_error or source_kind == "none" or not expected_columns:
        return
    projected_columns = {normalize_sql_identifier(column) for column in expected_columns}

    for action_offset, action_identifier, action_block in find_immediate_component_blocks(region_block, "action"):
        action_label = f"{component_label} action '{action_identifier}'"
        for token, token_offset in action_target_item_substitutions(action_block):
            if normalize_sql_identifier(token) in projected_columns:
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + action_offset + token_offset)}: "
                f"DSL_RULE_VALUE {action_label} behavior.target.items references source column '&{token}.' "
                "that is not projected by the Cards source"
            )


def lint_cards_action_condition_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    action_start: int,
    action_label: str,
    condition_meta: tuple[int, str] | None,
) -> None:
    """Validate the compiler-backed conditional fields of a Cards action."""
    if not condition_meta:
        return

    condition_offset, condition_block = condition_meta
    condition_props = {
        prop_name: (clean_scalar_value(prop_value), prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(condition_block)
    }
    condition_type = normalize_value(condition_props.get("type", ("", 0))[0])

    def require_property(prop_name: str) -> None:
        if prop_name in condition_props:
            return
        issues.append(
            f"{display_path(path)}:{line_no(text, action_start + condition_offset)}: "
            f"DSL_RULE_REQUIRED {action_label} serverSideCondition.type: "
            f"{condition_props.get('type', ('', 0))[0]} requires serverSideCondition.{prop_name}"
        )

    condition_requirements = {
        "rowsreturned": ("sqlQuery",),
        "norowsreturned": ("sqlQuery",),
        "request=value": ("value",),
        "request!=value": ("value",),
        "requestiscontainedinvalue": ("value",),
        "requestisnotcontainedinvalue": ("value",),
        "item=value": ("item", "value"),
        "item!=value": ("item", "value"),
        "itemisincolondelimitedlist": ("item", "list"),
        "itemisnotincolondelimitedlist": ("item", "list"),
        "text=value": ("text", "value"),
        "text!=value": ("text", "value"),
        "textiscontainedinvalue": ("text", "value"),
        "textisnotcontainedinvalue": ("text", "value"),
        "userpreference=value": ("preference", "value"),
        "userpreference!=value": ("preference", "value"),
        "currentpage=page": ("page",),
        "currentpage!=page": ("page",),
        "currentpageinlist": ("pages",),
        "currentpagenotinlist": ("pages",),
    }
    for prop_name in condition_requirements.get(condition_type, ()):
        require_property(prop_name)

    if condition_type in {"expression", "functionbody"}:
        require_property("language")
        language = normalize_value(condition_props.get("language", ("", 0))[0])
        if condition_type == "expression":
            expression_properties = {
                "sql": "sqlExpression",
                "plsql": "plsqlExpression",
                "javascript-mle": "javaScriptExpression",
            }
        else:
            expression_properties = {
                "plsql": "plsqlFunctionBody",
                "javascript-mle": "javaScriptFunctionBody",
            }
        expected_property = expression_properties.get(language)
        if expected_property:
            require_property(expected_property)

    if condition_type != "never":
        require_property("executeCondition")
    elif "executeCondition" in condition_props:
        prop_offset = condition_props["executeCondition"][1]
        issues.append(
            f"{display_path(path)}:{line_no(text, action_start + condition_offset + prop_offset)}: "
            f"DSL_RULE_PROP {action_label} serverSideCondition.executeCondition is not valid when "
            "serverSideCondition.type: never"
        )


def lint_cards_trigger_action_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    action_start: int,
    action_label: str,
    action_block: str,
    behavior_type: str,
    trigger_action_schema: dict[str, Any],
) -> None:
    """Validate native Cards triggerAction children and their behavior coupling."""
    trigger_actions = find_immediate_unnamed_component_blocks(action_block, "triggerAction")
    if behavior_type == "triggeraction" and not trigger_actions:
        issues.append(
            f"{display_path(path)}:{line_no(text, action_start)}: "
            f"DSL_RULE_REQUIRED {action_label} behavior.type: triggerAction requires a nested triggerAction child"
        )
    if behavior_type != "triggeraction" and trigger_actions:
        issues.append(
            f"{display_path(path)}:{line_no(text, action_start)}: "
            f"DSL_RULE_PROP {action_label} nested triggerAction is valid only when behavior.type: triggerAction"
        )

    allowed_props = set(trigger_action_schema.get("allowedProperties", []))
    required_props = set(trigger_action_schema.get("requiredProperties", []))
    for trigger_offset, trigger_identifier, trigger_block in trigger_actions:
        trigger_name = trigger_identifier or "<unnamed>"
        trigger_label = f"{action_label} triggerAction '{trigger_name}'"
        trigger_start = action_start + trigger_offset
        trigger_props = extract_immediate_property_values(trigger_block)
        present_props = {prop_name for prop_name, _value, _offset in trigger_props}
        for prop_name, _value, prop_offset in trigger_props:
            if allowed_props and prop_name not in allowed_props:
                issues.append(
                    f"{display_path(path)}:{line_no(text, trigger_start + prop_offset)}: "
                    f"DSL_RULE_PROP {trigger_label} {prop_name} is not allowed"
                )
        for prop_name in sorted(required_props - present_props):
            issues.append(
                f"{display_path(path)}:{line_no(text, trigger_start)}: "
                f"DSL_RULE_REQUIRED {trigger_label} must define {prop_name}"
            )


def lint_region_actions(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    region_block: str,
    action_schema: dict[str, Any],
) -> None:
    """Validate region action placement and required action metadata."""
    allowed_action_props = set(action_schema.get("allowedProperties", []))
    required_action_props = set(action_schema.get("requiredProperties", []))
    allowed_action_blocks = set(action_schema.get("allowedBlocks", []))
    required_action_blocks = set(action_schema.get("requiredBlocks", []))
    action_property_enums = action_schema.get("propertyEnums", {})
    menu_schema = action_schema.get("menu", {})

    for action_offset, action_identifier, action_block in find_immediate_component_blocks(region_block, "action"):
        action_label = f"{component_label} action '{action_identifier}'"
        absolute_action_start = component_start + action_offset
        action_props = extract_immediate_property_values(action_block)
        action_prop_values = {
            prop_name: (clean_scalar_value(prop_value), prop_offset)
            for prop_name, prop_value, prop_offset in action_props
        }
        present_action_props = {prop_name for prop_name, _prop_value, _prop_offset in action_props}

        for prop_name, _prop_value, prop_offset in action_props:
            if allowed_action_props and prop_name not in allowed_action_props:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_action_start + prop_offset)}: "
                    f"DSL_RULE_PROP {action_label} {prop_name} is not allowed"
                )

        for prop_name in sorted(required_action_props - present_action_props):
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start)}: "
                f"DSL_RULE_REQUIRED {action_label} must define {prop_name}"
            )

        if isinstance(action_property_enums, dict):
            for prop_name, allowed_values in action_property_enums.items():
                if not isinstance(allowed_values, list) or not allowed_values:
                    continue
                allowed_normalized = {normalize_value(str(value)) for value in allowed_values}
                for actual_name, actual_value, prop_offset in action_props:
                    if actual_name != prop_name or normalize_value(actual_value) in allowed_normalized:
                        continue
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + prop_offset)}: "
                        f"DSL_RULE_ENUM {action_label} action.{prop_name} must be one of: "
                        + ", ".join(str(value) for value in allowed_values)
                    )

        action_top_level_blocks = extract_top_level_blocks(action_block)
        for block_name in sorted(required_action_blocks - set(action_top_level_blocks.keys())):
            issues.append(
                f"{display_path(path)}:{line_no(text, absolute_action_start)}: "
                f"DSL_RULE_REQUIRED {action_label} must define block '{block_name}'"
            )

        for block_name, (block_offset, block_text) in action_top_level_blocks.items():
            if allowed_action_blocks and block_name not in allowed_action_blocks:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_action_start + block_offset)}: "
                    f"DSL_RULE_BLOCK {action_label} does not allow block '{block_name}'"
                )

            block_meta = action_schema.get(block_name)
            if is_block_meta(block_meta):
                lint_block_properties(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=absolute_action_start,
                    component_label=action_label,
                    block_name=block_name,
                    block_offset=block_offset,
                    block_text=block_text,
                    block_meta=block_meta,
                )

        cards_action_types = {"button", "fullcard", "title", "subtitle", "media"}
        action_type = normalize_value(action_prop_values.get("type", ("", 0))[0])
        if action_type in cards_action_types:
            layout_meta = action_top_level_blocks.get("layout")
            layout_props = {}
            if layout_meta:
                layout_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(layout_meta[1])
                }
            sequence_meta = layout_props.get("sequence")
            if sequence_meta and not re.fullmatch(r"-?(?:\d+(?:\.\d*)?|\.\d+)", sequence_meta[0]):
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_action_start + layout_meta[0] + sequence_meta[1])}: "
                    f"DSL_RULE_VALUE {action_label} layout.sequence must be a number"
                )
            if action_type == "button":
                if "label" not in action_prop_values:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start)}: "
                        f"DSL_RULE_REQUIRED {action_label} type: button must define label"
                    )
                if layout_meta and "position" not in layout_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + layout_meta[0])}: "
                        f"DSL_RULE_REQUIRED {action_label} type: button must define layout.position"
                    )
            else:
                if "label" in action_prop_values:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + action_prop_values['label'][1])}: "
                        f"DSL_RULE_PROP {action_label} label is allowed only when action.type: button"
                    )
                if layout_meta and "position" in layout_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + layout_meta[0] + layout_props['position'][1])}: "
                        f"DSL_RULE_PROP {action_label} layout.position is allowed only when action.type: button"
                    )

            appearance_meta = action_top_level_blocks.get("appearance")
            if appearance_meta:
                appearance_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(appearance_meta[1])
                }
                if action_type != "button":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + appearance_meta[0])}: "
                        f"DSL_RULE_PROP {action_label} appearance is valid only when action.type: button"
                    )
                else:
                    if "displayType" not in appearance_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_action_start + appearance_meta[0])}: "
                            f"DSL_RULE_REQUIRED {action_label} action.appearance must define displayType"
                        )
                    display_type = normalize_value(appearance_props.get("displayType", ("", 0))[0])
                    if display_type in {"icon", "textwithicon"} and "icon" not in appearance_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_action_start + appearance_meta[0])}: "
                            f"DSL_RULE_REQUIRED {action_label} action.appearance.displayType: "
                            f"{appearance_props['displayType'][0]} requires action.appearance.icon"
                        )
                    if display_type == "text" and "icon" in appearance_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_action_start + appearance_meta[0] + appearance_props['icon'][1])}: "
                            f"DSL_RULE_PROP {action_label} action.appearance.icon is valid only when "
                            "action.appearance.displayType is icon or textWithIcon"
                        )

            behavior_meta = action_top_level_blocks.get("behavior")
            behavior_type = ""
            if behavior_meta:
                behavior_props = {
                    prop_name: (clean_scalar_value(prop_value), prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(behavior_meta[1])
                }
                behavior_type = normalize_value(behavior_props.get("type", ("", 0))[0])
                if behavior_type in {"redirectthisapp", "redirectotherapp"} and "target" not in behavior_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_meta[0])}: "
                        f"DSL_RULE_REQUIRED {action_label} behavior.type: {behavior_props['type'][0]} requires behavior.target"
                    )
                if behavior_type in {"redirectthisapp", "redirectotherapp"} and "targetUrl" in behavior_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_meta[0] + behavior_props['targetUrl'][1])}: "
                        f"DSL_RULE_PROP {action_label} behavior.targetUrl is valid only when behavior.type: redirectUrl"
                    )
                if behavior_type == "redirecturl" and "targetUrl" not in behavior_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_meta[0])}: "
                        f"DSL_RULE_REQUIRED {action_label} behavior.type: redirectUrl requires behavior.targetUrl"
                    )
                if "targetUrl" in behavior_props and cards_url_has_forbidden_shape(behavior_props["targetUrl"][0]):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_meta[0] + behavior_props['targetUrl'][1])}: "
                        f"CARDS_SECURITY_REQUIRED_001 {action_label} behavior.targetUrl uses a forbidden URL shape"
                    )
                if behavior_type in {"redirecturl", "triggeraction"} and "target" in behavior_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_meta[0] + behavior_props['target'][1])}: "
                        f"DSL_RULE_PROP {action_label} behavior.target is valid only for same-app or other-app redirects"
                    )
                if behavior_type == "triggeraction" and "targetUrl" in behavior_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_action_start + behavior_meta[0] + behavior_props['targetUrl'][1])}: "
                        f"DSL_RULE_PROP {action_label} behavior.targetUrl is valid only when behavior.type: redirectUrl"
                    )

            trigger_action_schema = action_schema.get("triggerAction", {})
            if isinstance(trigger_action_schema, dict):
                lint_cards_trigger_action_contract(
                    issues=issues,
                    path=path,
                    text=text,
                    action_start=absolute_action_start,
                    action_label=action_label,
                    action_block=action_block,
                    behavior_type=behavior_type,
                    trigger_action_schema=trigger_action_schema,
                )
            lint_cards_action_condition_contract(
                issues=issues,
                path=path,
                text=text,
                action_start=absolute_action_start,
                action_label=action_label,
                condition_meta=action_top_level_blocks.get("serverSideCondition"),
            )

        if isinstance(menu_schema, dict):
            allowed_menu_props = set(menu_schema.get("allowedProperties", []))
            allowed_menu_blocks = set(menu_schema.get("allowedBlocks", []))
            for menu_offset, menu_identifier, menu_block in find_immediate_component_blocks(action_block, "menu"):
                menu_label = f"{action_label} menu '{menu_identifier}'"
                absolute_menu_start = absolute_action_start + menu_offset

                for prop_name, _prop_value, prop_offset in extract_immediate_property_values(menu_block):
                    if allowed_menu_props and prop_name not in allowed_menu_props:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_menu_start + prop_offset)}: "
                            f"DSL_RULE_PROP {menu_label} {prop_name} is not allowed"
                        )

                menu_top_level_blocks = extract_top_level_blocks(menu_block)
                for block_name, (block_offset, block_text) in menu_top_level_blocks.items():
                    if allowed_menu_blocks and block_name not in allowed_menu_blocks:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_menu_start + block_offset)}: "
                            f"DSL_RULE_BLOCK {menu_label} does not allow block '{block_name}'"
                        )

                    block_meta = menu_schema.get(block_name)
                    if is_block_meta(block_meta):
                        lint_block_properties(
                            issues=issues,
                            path=path,
                            text=text,
                            component_start=absolute_menu_start,
                            component_label=menu_label,
                            block_name=block_name,
                            block_offset=block_offset,
                            block_text=block_text,
                            block_meta=block_meta,
                        )


def lint_calendar_template_options(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    block_offset: int,
    block_text: str,
) -> None:
    """Validate calendar template option declarations."""
    options_match = re.search(r"(?ms)templateOptions\s*:\s*\[(.*?)\]", block_text)
    if not options_match:
        return

    options_body = options_match.group(1)
    for token_match in re.finditer(r"(?m)^\s*#DEFAULT#\S+\s*$", options_body):
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset + options_match.start(1) + token_match.start())}: "
            f"DSL_RULE_VALUE {component_label} appearance.templateOptions must keep "
            "'#DEFAULT#' as a standalone value"
        )
    has_split_hide = re.search(r"(?m)^\s*t-Region--hideHeader\s*$", options_body)
    has_split_desc = re.search(r"(?m)^\s*js-addHiddenHeadingRoleDesc\s*$", options_body)
    if has_split_hide and has_split_desc:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset + options_match.start(1))}: "
            f"DSL_RULE_VALUE {component_label} appearance.templateOptions must keep "
            "'t-Region--hideHeader js-addHiddenHeadingRoleDesc' as one combined value"
        )


def lint_calendar_settings_values(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    block_offset: int,
    block_text: str,
    template_mode: bool,
) -> None:
    """Validate calendar settings aliases and additionalCalendarViews values."""
    issue_prefix = "DSL_TEMPLATE_VALUE" if template_mode else "DSL_RULE_VALUE"

    for prop_name, _prop_value, prop_offset in extract_immediate_brace_property_values(block_text):
        canonical_name = CALENDAR_LEGACY_SETTING_ALIASES.get(prop_name)
        if canonical_name is None:
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + block_offset + prop_offset)}: "
            f"{issue_prefix} {component_label} settings must use canonical property "
            f"'{canonical_name}' instead of legacy alias '{prop_name}'"
        )

    for array_match in re.finditer(r"(?ms)^\s*additionalCalendarViews\s*:\s*\[(.*?)\]", block_text):
        array_body = array_match.group(1)
        for token_match in re.finditer(r"[A-Za-z][A-Za-z0-9]*", array_body):
            token = token_match.group(0)
            if normalize_value(token) not in CALENDAR_ADDITIONAL_VIEW_VALUES:
                issues.append(
                    f"{display_path(path)}:{line_no(text, component_start + block_offset + array_match.start(1) + token_match.start())}: "
                    f"{issue_prefix} {component_label} settings.additionalCalendarViews must use only: list, navigation"
                )


def lint_exact_template_option_values(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    block_name: str,
    block_offset: int,
    block_text: str,
) -> None:
    """Validate generic templateOptions value formatting."""
    for options_match in re.finditer(r"(?ms)templateOptions\s*:\s*\[(.*?)\]", block_text):
        options_body = options_match.group(1)
        if "," in options_body:
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_offset + options_match.start(1))}: "
                f"DSL_RULE_VALUE {component_label} {block_name}.templateOptions must emit multi-value arrays with one accepted value per line and must not use comma-separated inline arrays"
            )
        for token_match in re.finditer(r"(?m)^\s*#DEFAULT#\S+\s*$", options_body):
            issues.append(
                f"{display_path(path)}:{line_no(text, component_start + block_offset + options_match.start(1) + token_match.start())}: "
                f"DSL_RULE_VALUE {component_label} {block_name}.templateOptions must keep "
                "'#DEFAULT#' as one standalone value"
            )


def lint_region_contract(path: Path, text: str, schema: dict) -> list[str]:
    """Validate a single region contract file against the schema."""
    issues: list[str] = []
    region_schema = schema["components"].get("region", {})

    for start, region_name, block in find_component_blocks(text, "region"):
        region_type = extract_item_type(block)
        if not region_type:
            continue
        region_type_key = region_schema_key(region_type)
        if region_type_key not in region_schema:
            continue

        component_schema = region_schema[region_type_key]
        allowed_blocks = set(component_schema.get("allowedBlocks", []))
        required_blocks = set(component_schema.get("requiredBlocks", []))
        top_level_blocks = extract_top_level_blocks(block)
        component_label = f"region '{region_name}' type '{region_type}'"

        for block_name, (offset, _sub_block) in top_level_blocks.items():
            if allowed_blocks and block_name not in allowed_blocks:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + offset)}: "
                    f"DSL_RULE_BLOCK {component_label} does not allow block '{block_name}'"
                )

        missing_blocks = sorted(required_blocks - set(top_level_blocks.keys()))
        for block_name in missing_blocks:
            issues.append(
                f"{display_path(path)}:{line_no(text, start)}: "
                f"DSL_RULE_REQUIRED {component_label} must define block '{block_name}'"
            )

        for block_name, (block_offset, block_text) in top_level_blocks.items():
            block_meta = component_schema.get(block_name)
            if not is_block_meta(block_meta):
                continue
            lint_block_properties(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                block_name=block_name,
                block_offset=block_offset,
                block_text=block_text,
                block_meta=block_meta,
            )
            lint_exact_template_option_values(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                block_name=block_name,
                block_offset=block_offset,
                block_text=block_text,
            )

            if region_type_key == "calendar" and block_name == "appearance":
                lint_calendar_template_options(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=start,
                    component_label=component_label,
                    block_offset=block_offset,
                    block_text=block_text,
                )
            if region_type_key == "calendar" and block_name == "settings":
                lint_calendar_settings_values(
                    issues=issues,
                    path=path,
                    text=text,
                    component_start=start,
                    component_label=component_label,
                    block_offset=block_offset,
                    block_text=block_text,
                    template_mode=True,
                )
            if region_type_key == "dynamicContent" and block_name == "source":
                source_props = {name: (value, offset) for name, value, offset in extract_property_values(block_text)}
                plsql_meta = source_props.get("plsqlFunctionBody")
                if plsql_meta and not re.search(r"(?i)\breturn\b", block_text):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + block_offset + plsql_meta[1])}: "
                        f"DSL_RULE_REQUIRED {component_label} source.plsqlFunctionBody must return renderable content"
                    )

        if region_type_key == "map":
            lint_map_layer_children(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                map_schema=component_schema,
            )

        if region_type_key in {"contentRow", "mediaList"}:
            lint_template_component_order_by(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                top_level_blocks=top_level_blocks,
            )

        if is_block_meta(component_schema.get("action")):
            lint_region_actions(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                region_block=block,
                action_schema=component_schema["action"],
            )

    return issues


def lint_component_settings_contract(path: Path, text: str, schema: dict) -> list[str]:
    """Validate component settings snippets against the schema."""
    issues: list[str] = []
    if path.name != "component-settings.apx" or "shared-components" not in path.parts:
        return issues

    shared_schema = schema["components"].get("sharedComponent", {})
    setting_schema = shared_schema.get("componentSetting", {})
    allowed_blocks = set(setting_schema.get("allowedBlocks", []))
    required_blocks = set(setting_schema.get("requiredBlocks", []))

    for start, setting_name, block in find_component_blocks(text, "componentSetting"):
        top_level_blocks = extract_top_level_blocks(block)
        component_label = f"componentSetting '{setting_name}'"

        for block_name, (offset, _sub_block) in top_level_blocks.items():
            if allowed_blocks and block_name not in allowed_blocks:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + offset)}: "
                    f"DSL_RULE_BLOCK {component_label} does not allow block '{block_name}'"
                )

        missing_blocks = sorted(required_blocks - set(top_level_blocks.keys()))
        for block_name in missing_blocks:
            issues.append(
                f"{display_path(path)}:{line_no(text, start)}: "
                f"DSL_RULE_REQUIRED {component_label} must define block '{block_name}'"
            )

        settings_meta = top_level_blocks.get("settings")
        if settings_meta and is_block_meta(setting_schema.get("settings")):
            block_offset, block_text = settings_meta
            lint_block_properties(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                block_name="settings",
                block_offset=block_offset,
                block_text=block_text,
                block_meta=setting_schema["settings"],
            )

            if normalize_value(setting_name) == "native_display_selector":
                application_settings = (
                    schema.get("components", {})
                    .get("region", {})
                    .get("regionDisplaySelector", {})
                    .get("applicationSettings", {})
                    .get("settings")
                )
                attributes_meta = extract_property_object_block(block_text, "attributes")
                if attributes_meta and is_block_meta(application_settings):
                    attributes_offset, attributes_block = attributes_meta
                    lint_block_properties(
                        issues=issues,
                        path=path,
                        text=text,
                        component_start=start,
                        component_label=component_label,
                        block_name="settings.attributes",
                        block_offset=block_offset + attributes_offset,
                        block_text=attributes_block,
                        block_meta=application_settings,
                    )

    return issues


def extract_property_value_at_brace_depth(
    block: str,
    prop_name: str,
    *,
    brace_depth: int,
) -> tuple[str, int] | None:
    """Return the first property value found at the requested brace depth."""
    for actual_name, actual_value, prop_offset in extract_property_values(block):
        if actual_name != prop_name:
            continue
        _paren_depth, actual_brace_depth = nesting_depth(block, prop_offset)
        if actual_brace_depth == brace_depth:
            return actual_value, prop_offset
    return None


def lint_list_entry_current_state_contract(
    *,
    issues: list[str],
    path: Path,
    text: str,
    component_start: int,
    component_label: str,
    top_level_blocks: dict[str, tuple[int, str]],
) -> None:
    """Validate one-to-one current-state page mappings for list entries."""
    is_current_meta = top_level_blocks.get("isCurrent")
    if not is_current_meta:
        return

    is_current_offset, is_current_block = is_current_meta
    is_current_props = {
        prop_name: (prop_value, prop_offset)
        for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(is_current_block)
    }
    type_meta = is_current_props.get("type")
    pages_meta = is_current_props.get("pages")
    if not type_meta or not pages_meta:
        return

    if normalize_value(type_meta[0]) != "pages":
        return

    pages_value = clean_scalar_value(pages_meta[0])
    pages_absolute_offset = component_start + is_current_offset + pages_meta[1]
    page_number = parse_int(pages_value)
    if page_number is None:
        issues.append(
            f"{display_path(path)}:{line_no(text, pages_absolute_offset)}: "
            f"DSL_RULE_VALUE {component_label} isCurrent.pages must contain exactly one integer page id "
            f"matching link.target.page; got '{pages_value}'"
        )
        return

    link_meta = top_level_blocks.get("link")
    if not link_meta:
        return

    link_offset, link_block = link_meta
    target_page_meta = extract_property_value_at_brace_depth(link_block, "page", brace_depth=2)
    if target_page_meta is None:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + link_offset)}: "
            f"DSL_RULE_REQUIRED {component_label} must define link.target.page when isCurrent.type: pages is used"
        )
        return

    target_page_value = clean_scalar_value(target_page_meta[0])
    target_page_number = parse_int(target_page_value)
    if target_page_number is None:
        issues.append(
            f"{display_path(path)}:{line_no(text, component_start + link_offset + target_page_meta[1])}: "
            f"DSL_RULE_VALUE {component_label} link.target.page must be exactly one integer page id when "
            f"isCurrent.type: pages is used; got '{target_page_value}'"
        )
        return

    if page_number != target_page_number:
        issues.append(
            f"{display_path(path)}:{line_no(text, pages_absolute_offset)}: "
            f"DSL_RULE_VALUE {component_label} isCurrent.pages must match link.target.page "
            f"{target_page_number}; got {page_number}"
        )


def lint_shared_entry_contract(path: Path, text: str, schema: dict) -> list[str]:
    """Validate shared component snippets against the schema."""
    issues: list[str] = []
    if "shared-components" not in path.parts:
        return issues

    entry_schema_key: str | None = None
    if path.name == "lists.apx":
        entry_schema_key = "listEntry"
    elif path.name == "breadcrumbs.apx":
        entry_schema_key = "breadcrumbEntry"
    else:
        return issues

    shared_schema = schema["components"].get("sharedComponent", {})
    entry_schema = shared_schema.get(entry_schema_key, {})
    allowed_blocks = set(entry_schema.get("allowedBlocks", []))
    required_blocks = set(entry_schema.get("requiredBlocks", []))

    for start, entry_name, block in find_component_blocks(text, "entry"):
        top_level_blocks = extract_top_level_blocks(block)
        component_label = f"entry '{entry_name}'"

        for block_name, (offset, _sub_block) in top_level_blocks.items():
            if allowed_blocks and block_name not in allowed_blocks:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + offset)}: "
                    f"DSL_RULE_BLOCK {component_label} does not allow block '{block_name}'"
                )

        missing_blocks = sorted(required_blocks - set(top_level_blocks.keys()))
        for block_name in missing_blocks:
            issues.append(
                f"{display_path(path)}:{line_no(text, start)}: "
                f"DSL_RULE_REQUIRED {component_label} must define block '{block_name}'"
            )

        behavior_meta = top_level_blocks.get("behavior")
        if behavior_meta:
            behavior_offset, behavior_block = behavior_meta
            for prop_name, _prop_value, prop_offset in extract_property_values(behavior_block):
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + behavior_offset + prop_offset)}: "
                    f"DSL_RULE_PROP {component_label} behavior.{prop_name} is not allowed; use link.target"
                )

        link_meta = top_level_blocks.get("link")
        if link_meta and is_block_meta(entry_schema.get("link")):
            block_offset, block_text = link_meta
            lint_block_properties(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                block_name="link",
                block_offset=block_offset,
                block_text=block_text,
                block_meta=entry_schema["link"],
            )
            link_props = {name: (value, offset) for name, value, offset in extract_property_values(block_text)}
            target_meta = link_props.get("target")
            if target_meta and clean_scalar_value(target_meta[0]) == "#":
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + block_offset + target_meta[1])}: "
                    f"DSL_RULE_VALUE {component_label} link.target must use a structured target object, not '#'"
                )

        is_current_meta = top_level_blocks.get("isCurrent")
        if is_current_meta and is_block_meta(entry_schema.get("isCurrent")):
            block_offset, block_text = is_current_meta
            lint_block_properties(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                block_name="isCurrent",
                block_offset=block_offset,
                block_text=block_text,
                block_meta=entry_schema["isCurrent"],
            )
            lint_list_entry_current_state_contract(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                top_level_blocks=top_level_blocks,
            )

        appearance_meta = top_level_blocks.get("appearance")
        if appearance_meta and is_block_meta(entry_schema.get("appearance")):
            block_offset, block_text = appearance_meta
            lint_block_properties(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                block_name="appearance",
                block_offset=block_offset,
                block_text=block_text,
                block_meta=entry_schema["appearance"],
            )

        execution_meta = top_level_blocks.get("execution")
        if execution_meta and is_block_meta(entry_schema.get("execution")):
            block_offset, block_text = execution_meta
            lint_block_properties(
                issues=issues,
                path=path,
                text=text,
                component_start=start,
                component_label=component_label,
                block_name="execution",
                block_offset=block_offset,
                block_text=block_text,
                block_meta=entry_schema["execution"],
            )

    return issues



def is_reference_app_path(path: Path) -> bool:
    """Return true for intentional reference/demo apps excluded from business security hard-fail rules."""
    parts = path.parts
    if "applications" not in parts:
        return False
    app_index = parts.index("applications") + 1
    if app_index >= len(parts):
        return False
    return parts[app_index] in {"ut"}


def is_business_app_path(path: Path) -> bool:
    """Return true when security baseline validators should hard-fail the path."""
    return "applications" in path.parts and not is_reference_app_path(path)


def block_property_map(block: str) -> dict[str, tuple[str, int]]:
    """Return immediate property values keyed by property name."""
    return {name: (value, offset) for name, value, offset in extract_property_values(block)}


def clean_component_ref(value: str) -> str:
    """Normalize a component reference by removing scalar quoting and @ prefix."""
    cleaned = clean_scalar_value(value)
    return cleaned[1:] if cleaned.startswith("@") else cleaned


def has_security_review_rationale(block: str) -> bool:
    """Return true when a block contains an explicit public-page security rationale."""
    return bool(re.search(r"(?is)security[- ]review|public[- ]page[- ]review|reviewed\s+public", block))


def is_login_page(page_name: str, page_block: str) -> bool:
    """Return true when a page is clearly an APEX login page."""
    if clean_scalar_value(page_name) in {"9999", "101"}:
        return True
    props = {name: clean_scalar_value(value).upper() for name, value, _offset in extract_immediate_property_values(page_block)}
    alias = props.get("alias", "")
    title = props.get("title", "")
    name = props.get("name", "")
    return alias == "LOGIN" or "LOGIN" in title or "LOGIN" in name


def is_global_page(page_name: str) -> bool:
    """Return true for the APEX Global Page artifact."""
    return clean_scalar_value(page_name) == "0"


def lint_global_page_contract(path: Path, text: str, page_start: int, page_name: str, page_block: str) -> list[str]:
    """Validate the special Page 0 contract.

    Page 0 is not a normal non-login page. It must not receive page-level
    security/access properties that belong to concrete pages.
    """
    issues: list[str] = []
    page_blocks = extract_top_level_blocks(page_block)
    if "security" in page_blocks:
        security_offset, security_block = page_blocks["security"]
        issues.append(
            f"{display_path(path)}:{line_no(text, page_start + security_offset)}: "
            f"PAGE0_GLOBAL_PAGE_MINIMAL_001 page '{page_name}' must not define a security block"
        )
        props = block_property_map(security_block)
        for prop_name in ("authorizationScheme", "authentication", "pageAccessProtection", "formAutoComplete"):
            prop_meta = props.get(prop_name)
            if prop_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + security_offset + prop_meta[1])}: "
                    f"PAGE0_GLOBAL_PAGE_MINIMAL_001 page '{page_name}' must not define security.{prop_name}"
                )

    top_level_props = {name: offset for name, _value, offset in extract_immediate_property_values(page_block)}
    for prop_name in ("authorizationScheme", "authentication", "pageAccessProtection", "formAutoComplete"):
        prop_offset = top_level_props.get(prop_name)
        if prop_offset is not None:
            issues.append(
                f"{display_path(path)}:{line_no(text, page_start + prop_offset)}: "
                f"PAGE0_GLOBAL_PAGE_MINIMAL_001 page '{page_name}' must not define {prop_name}"
            )
    return issues


def lint_form_primary_key_contract(path: Path, text: str) -> list[str]:
    """Validate that every form region has at least one mapped primary-key item."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        form_regions: dict[str, int] = {}
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block)
            if region_type == "form":
                form_regions[region_name] = page_start + region_offset

        if not form_regions:
            continue

        pk_items_by_region: dict[str, list[str]] = {region_name: [] for region_name in form_regions}

        for item_offset, item_name, item_block in find_immediate_component_blocks(page_block, "pageItem"):
            top_level_blocks = extract_top_level_blocks(item_block)
            source_meta = top_level_blocks.get("source")
            if not source_meta:
                continue

            source_offset, source_block = source_meta
            source_props = block_property_map(source_block)
            form_region_meta = source_props.get("formRegion")
            if not form_region_meta:
                continue

            form_region_name = clean_component_ref(form_region_meta[0])
            if form_region_name not in form_regions:
                continue

            primary_key_meta = source_props.get("primaryKey")
            if not primary_key_meta:
                continue

            primary_key_value = clean_scalar_value(primary_key_meta[0]).lower()
            absolute_prop_offset = page_start + item_offset + source_offset + primary_key_meta[1]
            if primary_key_value == "true":
                pk_items_by_region[form_region_name].append(item_name)
            else:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_prop_offset)}: "
                    f"FORM_PRIMARY_KEY_REQUIRED_001 pageItem '{item_name}' maps to form region "
                    f"'{form_region_name}' and must not emit primaryKey: {clean_scalar_value(primary_key_meta[0])}; "
                    f"use primaryKey: true only for PK items and omit it for non-PK items"
                )

        for region_name, region_start in form_regions.items():
            if pk_items_by_region[region_name]:
                continue
            issues.append(
                f"{display_path(path)}:{line_no(text, region_start)}: "
                f"FORM_PRIMARY_KEY_REQUIRED_001 page '{page_name}' region '{region_name}' type 'form' "
                f"must have at least one pageItem with source.formRegion: @{region_name} and source.primaryKey: true"
            )

    return issues


def lint_form_edit_contract(path: Path, text: str) -> list[str]:
    """Reject interactive-grid edit operations leaking into form regions."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if extract_item_type(region_block) != "form":
                continue
            top_level_blocks = extract_top_level_blocks(region_block)
            edit_meta = top_level_blocks.get("edit")
            if not edit_meta:
                continue
            edit_offset, edit_block = edit_meta
            edit_props = block_property_map(edit_block)
            allowed_ops_meta = edit_props.get("allowedOperations")
            if allowed_ops_meta:
                _allowed_ops_value, allowed_ops_offset = allowed_ops_meta
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset + edit_offset + allowed_ops_offset)}: "
                    f"FORM_EDIT_ALLOWED_OPERATIONS_LEGACY_001 page '{page_name}' form region '{region_name}' "
                    "must not define edit.allowedOperations; form regions may emit only edit.enabled: true"
                )
            for invalid_prop in ("add", "update", "delete"):
                invalid_prop_meta = edit_props.get(invalid_prop)
                if not invalid_prop_meta:
                    continue
                _invalid_prop_value, invalid_prop_offset = invalid_prop_meta
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset + edit_offset + invalid_prop_offset)}: "
                    f"FORM_EDIT_OPERATION_FLAG_INVALID_001 page '{page_name}' form region '{region_name}' "
                    f"must not define edit.{invalid_prop}; form regions may emit only edit.enabled: true"
                )

    return issues


def saved_report_runtime_lov_values(record: dict[str, Any], property_name: str) -> tuple[str, ...]:
    """Return DSL-facing LOV names for a savedReport compiler metadata property."""
    groups = record.get("groups")
    if not isinstance(groups, dict):
        return ()
    for group_props in groups.values():
        if not isinstance(group_props, list):
            continue
        for prop in group_props:
            if not isinstance(prop, dict) or prop.get("propertyName") != property_name:
                continue
            lov = prop.get("lov")
            if not isinstance(lov, dict):
                return ()
            values = lov.get("values")
            if not isinstance(values, list):
                return ()
            names = tuple(
                str(value.get("name"))
                for value in values
                if isinstance(value, dict) and value.get("name")
            )
            return names
    return ()


def saved_report_visibility_contract(ctx: LintContext, region_type: str) -> tuple[tuple[str, ...], str]:
    """Resolve savedReport.visibility values from compiler metadata or local fallback guidance."""
    cache_key = f"savedReport.visibility.{region_type}"
    cached = ctx.cache.get(cache_key)
    if isinstance(cached, tuple) and len(cached) == 2:
        return cached  # type: ignore[return-value]

    runtime_component_map = ctx.runtime_component_map
    if isinstance(runtime_component_map, dict):
        component_types = runtime_component_map.get("componentTypes")
        if isinstance(component_types, list):
            for record in component_types:
                if not isinstance(record, dict) or record.get("singular") != "savedReport":
                    continue
                default_values = set(saved_report_runtime_lov_values(record, "default"))
                matches_region = (
                    (region_type == "interactiveGrid" and "grid" in default_values)
                    or (region_type == "interactiveReport" and "report" in default_values)
                )
                if not matches_region:
                    continue
                visibility_values = saved_report_runtime_lov_values(record, "visibility")
                if visibility_values:
                    source = "runtime metadata"
                    result = (visibility_values, source)
                    ctx.cache[cache_key] = result
                    return result

    fallback = SAVED_REPORT_VISIBILITY_FALLBACKS.get(region_type, ())
    result = (fallback, "local fallback docs")
    ctx.cache[cache_key] = result
    return result


def lint_saved_report_visibility_contract(ctx: LintContext) -> list[str]:
    """Validate savedReport visibility tokens against the parent report region variant."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(ctx.text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block)
            if region_type not in SAVED_REPORT_VISIBILITY_FALLBACKS:
                continue
            allowed_values, source = saved_report_visibility_contract(ctx, region_type)
            if not allowed_values:
                continue
            allowed_normalized = {normalize_value(value) for value in allowed_values}
            for saved_offset, saved_name, saved_block in find_immediate_component_blocks(region_block, "savedReport"):
                for prop_name, prop_value, prop_offset in extract_immediate_property_values(saved_block):
                    if prop_name != "visibility":
                        continue
                    visibility = clean_scalar_value(prop_value)
                    if normalize_value(visibility) in allowed_normalized:
                        continue
                    issues.append(
                        f"{display_path(ctx.path)}:{line_no(ctx.text, page_start + region_offset + saved_offset + prop_offset)}: "
                        f"SAVED_REPORT_VISIBILITY_LEGACY_001 page '{page_name}' {region_type} region '{region_name}' "
                        f"savedReport '{saved_name}' defines unsupported visibility: {visibility}; "
                        f"allowed values from {source} are: {', '.join(allowed_values)}"
                    )

    return issues


def lint_faceted_search_settings_contract(path: Path, text: str) -> list[str]:
    """Validate faceted-search default settings and opt-in selector/chart settings."""
    issues: list[str] = []
    required_default_values = {
        "compactNosThreshold": "10000",
        "showTotalRowCount": "true",
    }

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if extract_item_type(region_block) != "facetedSearch":
                continue
            component_label = f"page '{page_name}' facetedSearch region '{region_name}'"
            top_level_blocks = extract_top_level_blocks(region_block)
            settings_meta = top_level_blocks.get("settings")
            if not settings_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset)}: "
                    f"FACETED_SEARCH_DEFAULT_SETTINGS_REQUIRED_001 {component_label} must define settings with "
                    "compactNosThreshold: 10000, showCurrentFacets: true, and showTotalRowCount: true"
                )
                continue

            settings_offset, settings_block = settings_meta
            settings_props = block_property_map(settings_block)

            for prop_name, expected_value in required_default_values.items():
                prop_meta = settings_props.get(prop_name)
                if not prop_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + settings_offset)}: "
                        f"FACETED_SEARCH_DEFAULT_SETTINGS_REQUIRED_001 {component_label} settings must define "
                        f"{prop_name}: {expected_value}"
                    )
                    continue
                prop_value, prop_offset = prop_meta
                actual_value = clean_scalar_value(prop_value).lower()
                if actual_value != expected_value:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + settings_offset + prop_offset)}: "
                        f"FACETED_SEARCH_DEFAULT_SETTINGS_REQUIRED_001 {component_label} settings.{prop_name} "
                        f"must be {expected_value}"
                    )

            show_current_meta = settings_props.get("showCurrentFacets")
            show_current_value = ""
            if not show_current_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset + settings_offset)}: "
                    f"FACETED_SEARCH_DEFAULT_SETTINGS_REQUIRED_001 {component_label} settings must define "
                    "showCurrentFacets: true"
                )
            else:
                show_current_raw, show_current_offset = show_current_meta
                show_current_value = clean_scalar_value(show_current_raw).lower()
                if show_current_value not in {"true", "selector"}:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + settings_offset + show_current_offset)}: "
                        f"FACETED_SEARCH_DEFAULT_SETTINGS_REQUIRED_001 {component_label} settings.showCurrentFacets "
                        "must be true by default or selector for explicit selector mode"
                    )

            selector_meta = settings_props.get("currentFacetsSelector")
            if selector_meta and show_current_value != "selector":
                _selector_value, selector_offset = selector_meta
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset + settings_offset + selector_offset)}: "
                    f"FACETED_SEARCH_SELECTOR_MODE_REQUIRED_001 {component_label} must define "
                    "settings.showCurrentFacets: selector when settings.currentFacetsSelector is present"
                )
            if show_current_value == "selector":
                if not selector_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + settings_offset)}: "
                        f"FACETED_SEARCH_CURRENT_FACETS_SELECTOR_REQUIRED_001 {component_label} must define "
                        "settings.currentFacetsSelector when settings.showCurrentFacets: selector is used"
                    )
                else:
                    selector_value, selector_offset = selector_meta
                    cleaned_selector = clean_scalar_value(selector_value)
                    if not cleaned_selector or cleaned_selector == "<selector>" or "{{" in cleaned_selector or "}}" in cleaned_selector:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, page_start + region_offset + settings_offset + selector_offset)}: "
                            f"FACETED_SEARCH_CURRENT_FACETS_SELECTOR_REQUIRED_001 {component_label} "
                            "settings.currentFacetsSelector must be a concrete selector value"
                        )

            chart_top_n_meta = settings_props.get("displayChartForTopNValues")
            if chart_top_n_meta:
                chart_top_n_value, chart_top_n_offset = chart_top_n_meta
                cleaned_chart_top_n = clean_scalar_value(chart_top_n_value)
                if not re.fullmatch(r"[1-9][0-9]*", cleaned_chart_top_n):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + settings_offset + chart_top_n_offset)}: "
                        f"FACETED_SEARCH_DISPLAY_CHART_TOP_N_INVALID_001 {component_label} "
                        "settings.displayChartForTopNValues must be a positive integer"
                    )

    return issues


def lint_interactive_report_link_column_contract(path: Path, text: str) -> list[str]:
    """Reject stale Interactive Report linkColumn values that use report aliases."""
    issues: list[str] = []
    allowed_values = {"customTarget", "exclude", "singleRowView"}

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if extract_item_type(region_block) != "interactiveReport":
                continue
            for link_offset, link_block in find_immediate_named_brace_blocks(region_block, "link"):
                link_props = block_property_map(link_block)
                link_column_meta = link_props.get("linkColumn")
                if not link_column_meta:
                    continue
                value, prop_offset = link_column_meta
                value = clean_scalar_value(value)
                if value in allowed_values:
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset + link_offset + prop_offset)}: "
                    f"INTERACTIVE_REPORT_LINK_COLUMN_INVALID_001 page '{page_name}' interactiveReport region '{region_name}' "
                    f"must not define link.linkColumn: {value}; use compiler-backed values such as customTarget, exclude, or singleRowView"
                )

    return issues


def lint_report_region_link_block_live_contract(path: Path, text: str) -> list[str]:
    """Reject report-level link blocks that the live 26.1 compiler does not accept."""
    issues: list[str] = []
    report_types = {"classicReport", "interactiveReport"}

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block) or ""
            if region_type not in report_types:
                continue
            for link_offset, _link_block in find_immediate_named_brace_blocks(region_block, "link"):
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset + link_offset)}: "
                    f"REPORT_REGION_LINK_BLOCK_UNSUPPORTED_001 page '{page_name}' {region_type} region "
                    f"'{region_name}' must not define a report-level link block; live compiler 26.1 rejects "
                    "linkColumn/target/linkIcon at region scope"
                )

    return issues


def lint_interactive_report_column_live_metadata(path: Path, text: str) -> list[str]:
    """Require live-compiler column metadata for Interactive Report child columns."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if extract_item_type(region_block) != "interactiveReport":
                continue
            for column_offset, column_name, column_block in find_immediate_component_blocks(region_block, "column"):
                absolute_start = page_start + region_offset + column_offset
                column_props = {
                    prop_name: (prop_value, prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_property_values(column_block)
                }
                if "type" not in column_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start)}: "
                        f"INTERACTIVE_REPORT_COLUMN_METADATA_REQUIRED_001 page '{page_name}' interactiveReport "
                        f"region '{region_name}' column '{column_name}' must define top-level type: plainText "
                        "or another compiler-backed column type"
                    )

                column_blocks = extract_top_level_blocks(column_block)
                source_meta = column_blocks.get("source")
                if not source_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start)}: "
                        f"INTERACTIVE_REPORT_COLUMN_METADATA_REQUIRED_001 page '{page_name}' interactiveReport "
                        f"region '{region_name}' column '{column_name}' must define source.dataType for live compiler property 268"
                    )
                    continue

                source_offset, source_block = source_meta
                source_props = {
                    prop_name: (prop_value, prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(source_block)
                }
                if "dataType" not in source_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, absolute_start + source_offset)}: "
                        f"INTERACTIVE_REPORT_COLUMN_METADATA_REQUIRED_001 page '{page_name}' interactiveReport "
                        f"region '{region_name}' column '{column_name}' source block must define dataType"
                    )

    return issues


def lint_filter_and_facet_identifier_contract(path: Path, text: str) -> list[str]:
    """Require smart-filter and faceted-search child identifiers that live compiler accepts."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block) or ""
            if region_type == "smartFilters":
                child_keyword = "filter"
            elif region_type == "facetedSearch":
                child_keyword = "facet"
            else:
                continue

            for child_offset, child_identifier, _child_block in find_immediate_component_blocks(region_block, child_keyword):
                if component_identifier_is_live_external(child_identifier):
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset + child_offset)}: "
                    f"FILTER_FACET_IDENTIFIER_INVALID_001 page '{page_name}' {region_type} region '{region_name}' "
                    f"{child_keyword} identifier '{child_identifier}' must be uppercase snake_case such as "
                    "P7_SEARCH or FS_STATUS; live compiler rejects lower-case and hyphenated external identifiers"
                )

    return issues


def lint_avatar_column_identifier_contract(path: Path, text: str) -> list[str]:
    """Require standalone Avatar column identifiers accepted by the live compiler."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if extract_item_type(region_block) != "themeTemplateComponent/avatar":
                continue

            for column_offset, column_identifier, _column_block in find_region_column_blocks("avatar", region_block):
                if component_identifier_is_live_external(column_identifier):
                    continue
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + region_offset + column_offset)}: "
                    f"AVATAR_COLUMN_IDENTIFIER_INVALID_001 page '{page_name}' Avatar region '{region_name}' "
                    f"column identifier '{column_identifier}' must be uppercase snake_case such as "
                    "AVATAR_INITIALS; live compiler rejects lower-case and hyphenated external identifiers"
                )

    return issues


def lint_template_component_action_layout_sequence_contract(path: Path, text: str) -> list[str]:
    """Require live-compiler action layout sequencing for supported template components."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            region_type = extract_item_type(region_block)
            if region_type == "themeTemplateComponent/contentRow":
                rule_id = "CONTENT_ROW_ACTION_LAYOUT_SEQUENCE_REQUIRED_001"
                component_label = "contentRow"
            elif region_type == "themeTemplateComponent/badge":
                rule_id = "BADGE_ACTION_LAYOUT_SEQUENCE_REQUIRED_001"
                component_label = "Badge"
            elif region_type == "themeTemplateComponent/mediaList":
                rule_id = "MEDIA_LIST_ACTION_LAYOUT_SEQUENCE_REQUIRED_001"
                component_label = "Media List"
            else:
                continue
            for action_offset, action_name, action_block in find_immediate_component_blocks(region_block, "action"):
                action_start = page_start + region_offset + action_offset
                top_level_blocks = extract_top_level_blocks(action_block)
                layout_meta = top_level_blocks.get("layout")
                if not layout_meta:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, action_start)}: "
                        f"{rule_id} page '{page_name}' {component_label} region "
                        f"'{region_name}' action '{action_name}' must define layout.sequence; live compiler "
                        "requires component layout sequence for region actions"
                    )
                    continue
                layout_offset, layout_block = layout_meta
                layout_props = {
                    prop_name: (prop_value, prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(layout_block)
                }
                if "sequence" not in layout_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, action_start + layout_offset)}: "
                        f"{rule_id} page '{page_name}' {component_label} region "
                        f"'{region_name}' action '{action_name}' layout block must define sequence"
                    )

    return issues


def lint_list_region_live_template_contract(path: Path, text: str) -> list[str]:
    """Require list regions to use componentAppearance.listTemplate instead of appearance.template."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if extract_item_type(region_block) != "list":
                continue
            region_start = page_start + region_offset
            top_level_blocks = extract_top_level_blocks(region_block)

            component_appearance_meta = top_level_blocks.get("componentAppearance")
            if not component_appearance_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, region_start)}: "
                    f"LIST_REGION_TEMPLATE_REQUIRED_001 page '{page_name}' list region '{region_name}' "
                    "must define componentAppearance.listTemplate; live compiler requires listTemplate"
                )
            else:
                component_appearance_offset, component_appearance_block = component_appearance_meta
                component_appearance_props = {
                    prop_name: (prop_value, prop_offset)
                    for prop_name, prop_value, prop_offset in extract_immediate_brace_property_values(component_appearance_block)
                }
                if "listTemplate" not in component_appearance_props:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, region_start + component_appearance_offset)}: "
                        f"LIST_REGION_TEMPLATE_REQUIRED_001 page '{page_name}' list region '{region_name}' "
                        "componentAppearance block must define listTemplate"
                    )

            appearance_meta = top_level_blocks.get("appearance")
            if appearance_meta:
                appearance_offset, appearance_block = appearance_meta
                for prop_name, _prop_value, prop_offset in extract_immediate_brace_property_values(appearance_block):
                    if prop_name not in {"template", "templateOptions"}:
                        continue
                    issues.append(
                        f"{display_path(path)}:{line_no(text, region_start + appearance_offset + prop_offset)}: "
                        f"LIST_REGION_TEMPLATE_PLACEMENT_001 page '{page_name}' list region '{region_name}' "
                        f"must not define appearance.{prop_name}; put the list template in "
                        "componentAppearance.listTemplate"
                    )

    return issues


def lint_interactive_report_saved_report_live_contract(path: Path, text: str) -> list[str]:
    """Reject Interactive Report savedReport properties that live compiler 26.1 rejects."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
            if extract_item_type(region_block) != "interactiveReport":
                continue
            for saved_offset, saved_name, saved_block in find_immediate_component_blocks(region_block, "savedReport"):
                saved_start = page_start + region_offset + saved_offset
                for prop_name, _prop_value, prop_offset in extract_immediate_property_values(saved_block):
                    if prop_name != "name":
                        continue
                    issues.append(
                        f"{display_path(path)}:{line_no(text, saved_start + prop_offset)}: "
                        f"INTERACTIVE_REPORT_SAVED_REPORT_NAME_UNSUPPORTED_001 page '{page_name}' "
                        f"interactiveReport region '{region_name}' savedReport '{saved_name}' must not define "
                        "name; live compiler 26.1 rejects savedReport.name for interactive reports"
                    )

    return issues


def lint_invoke_api_parameter_expression_contract(path: Path, text: str) -> list[str]:
    """Reject multiline scalar plsqlExpression values in invokeApi process parameters."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        for process_offset, process_name, process_block in find_immediate_component_blocks(page_block, "process"):
            process_type = extract_item_type(process_block)
            if process_type != "invokeApi":
                continue
            for parameter_offset, parameter_name, parameter_block in find_immediate_component_blocks(process_block, "parameter"):
                parameter_start = page_start + process_offset + parameter_offset
                top_level_blocks = extract_top_level_blocks(parameter_block)
                value_meta = top_level_blocks.get("value")
                if not value_meta:
                    continue
                value_offset, value_block = value_meta
                value_block_offset, value_body = block_body(value_block)
                lines = value_body.splitlines(keepends=True)
                running_offset = 0
                for index, line in enumerate(lines):
                    match = re.match(r"^[ \t]*plsqlExpression\s*:\s*(?P<value>.*?)\s*$", line)
                    if not match:
                        running_offset += len(line)
                        continue
                    expression_value = match.group("value").strip()
                    if not expression_value or expression_value.startswith("```"):
                        running_offset += len(line)
                        continue

                    next_nonblank = ""
                    for following_line in lines[index + 1 :]:
                        candidate = following_line.strip()
                        if candidate:
                            next_nonblank = candidate
                            break
                    if next_nonblank and not next_nonblank.startswith(("}", "```")):
                        issues.append(
                            f"{display_path(path)}:{line_no(text, parameter_start + value_offset + value_block_offset + running_offset + match.start('value'))}: "
                            f"INVOKE_API_PARAMETER_EXPRESSION_MULTILINE_001 page '{page_name}' invokeApi process "
                            f"'{process_name}' parameter '{parameter_name}' value.plsqlExpression must be a single-line "
                            "scalar expression or a fenced PL/SQL property body; live compiler rejects line-broken scalar expressions"
                        )
                    running_offset += len(line)

    return issues


def lint_page_item_layout_legacy_properties(path: Path, text: str) -> list[str]:
    """Validate legacy aliases inside page-item layout blocks."""
    issues: list[str] = []

    for item_start, item_name, item_block in find_component_blocks(text, "pageItem"):
        top_level_blocks = extract_top_level_blocks(item_block)
        layout_meta = top_level_blocks.get("layout")
        if not layout_meta:
            continue

        layout_offset, layout_block = layout_meta
        layout_props = block_property_map(layout_block)
        label_col_span_meta = layout_props.get("labelColSpan")
        if not label_col_span_meta:
            continue

        item_type = extract_item_type(item_block) or "unknown"
        issues.append(
            f"{display_path(path)}:{line_no(text, item_start + layout_offset + label_col_span_meta[1])}: "
            f"PAGE_ITEM_LAYOUT_LABEL_COL_SPAN_LEGACY_001 pageItem '{item_name}' type '{item_type}' "
            "must not define legacy alias layout.labelColSpan; use layout.labelColumnSpan"
        )

    return issues


def lint_page_item_region_slots(path: Path, text: str) -> list[str]:
    """Validate that region-bound page items use region slots instead of page body slots."""
    issues: list[str] = []

    for item_start, item_name, item_block in find_component_blocks(text, "pageItem"):
        top_level_blocks = extract_top_level_blocks(item_block)
        layout_meta = top_level_blocks.get("layout")
        if not layout_meta:
            continue

        layout_offset, layout_block = layout_meta
        layout_props = block_property_map(layout_block)
        if "region" not in layout_props or "slot" not in layout_props:
            continue

        slot_value, slot_offset = layout_props["slot"]
        if clean_scalar_value(slot_value) not in {"body", "BODY"}:
            continue

        issues.append(
            f"{display_path(path)}:{line_no(text, item_start + layout_offset + slot_offset)}: "
            f"PAGE_ITEM_REGION_SLOT_REQUIRED_001 pageItem '{item_name}' with layout.region must use "
            "layout.slot: regionBody instead of body"
        )

    return issues


def lint_display_only_source_types(path: Path, text: str) -> list[str]:
    """Validate compiler-backed displayOnly source.type constraints."""
    issues: list[str] = []

    for item_start, item_name, item_block in find_component_blocks(text, "pageItem"):
        item_type = (extract_item_type(item_block) or "").lower()
        if item_type != "displayonly":
            continue

        top_level_blocks = extract_top_level_blocks(item_block)
        source_meta = top_level_blocks.get("source")
        if not source_meta:
            continue

        source_offset, source_block = source_meta
        source_props = block_property_map(source_block)
        source_type_meta = source_props.get("type")
        if not source_type_meta:
            continue

        source_type_value = clean_scalar_value(source_type_meta[0])
        if source_type_value != "substitutionString":
            continue

        issues.append(
            f"{display_path(path)}:{line_no(text, item_start + source_offset + source_type_meta[1])}: "
            f"DISPLAY_ONLY_SOURCE_TYPE_INVALID_001 pageItem '{item_name}' type 'displayOnly' must not use "
            "source.type: substitutionString; use source.type: item with source.item, or another compiler-valid "
            "displayOnly source type"
        )

    return issues


def lint_generated_security_contract(path: Path, text: str) -> list[str]:
    """Validate generated business-app security defaults."""
    issues: list[str] = []
    if not is_business_app_path(path):
        return issues

    if path.name == "application.apx":
        for app_start, app_name, app_block in find_component_blocks(text, "app"):
            app_blocks = extract_top_level_blocks(app_block)
            if "sessionStateProtection" not in app_blocks:
                issues.append(
                    f"{display_path(path)}:{line_no(text, app_start)}: "
                    f"SECURITY_BASELINE_REQUIRED_001 app '{app_name}' must define sessionStateProtection"
                )
            session_meta = app_blocks.get("sessionManagement")
            if not session_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, app_start)}: "
                    f"SECURITY_BASELINE_REQUIRED_001 app '{app_name}' must define sessionManagement with maxSessionIdleTime 3600 and maxSessionLength 28800"
                )
            else:
                session_offset, session_block = session_meta
                props = block_property_map(session_block)
                expected = {"maxSessionIdleTime": "3600", "maxSessionLength": "28800"}
                for prop_name, prop_value in expected.items():
                    actual_meta = props.get(prop_name)
                    if not actual_meta or clean_scalar_value(actual_meta[0]) != prop_value:
                        issues.append(
                            f"{display_path(path)}:{line_no(text, app_start + session_offset)}: "
                            f"SECURITY_BASELINE_REQUIRED_001 app '{app_name}' sessionManagement.{prop_name} must be {prop_value}"
                        )
        return issues

    if "pages" in path.parts and path.suffix == ".apx":
        for page_start, page_name, page_block in find_component_blocks(text, "page"):
            if is_global_page(page_name):
                issues.extend(lint_global_page_contract(path, text, page_start, page_name, page_block))
                continue
            page_blocks = extract_top_level_blocks(page_block)
            security_meta = page_blocks.get("security")
            if not security_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start)}: "
                    f"SECURITY_BASELINE_REQUIRED_001 page '{page_name}' must define security block"
                )
                continue
            security_offset, security_block = security_meta
            props = block_property_map(security_block)
            protection_meta = props.get("pageAccessProtection")
            if not protection_meta or clean_scalar_value(protection_meta[0]) != "argumentsMustHaveChecksum":
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + security_offset)}: "
                    f"SECURITY_BASELINE_REQUIRED_001 page '{page_name}' must use pageAccessProtection: argumentsMustHaveChecksum"
                )

            authentication = clean_scalar_value(props.get("authentication", ("", 0))[0]).lower()
            is_public = authentication == "public"
            if is_login_page(page_name, page_block):
                continue
            if is_public:
                if not has_security_review_rationale(page_block):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + security_offset + props.get('authentication', ('', 0))[1])}: "
                        f"PUBLIC_PAGE_REVIEW_REQUIRED_001 page '{page_name}' is public and must include security-review rationale"
                    )
                continue
            auth_meta = props.get("authorizationScheme")
            if not auth_meta:
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + security_offset)}: "
                    f"SECURITY_BASELINE_REQUIRED_001 non-login page '{page_name}' must define authorizationScheme mustNotBePublicUser or a stricter @static-id scheme"
                )
            else:
                auth_value = clean_scalar_value(auth_meta[0])
                if auth_value == "@mustNotBePublicUser" or "must-not-be-public-user" in auth_value:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + security_offset + auth_meta[1])}: "
                        f"SECURITY_BASELINE_REQUIRED_001 built-in Must Not Be Public User must be referenced as mustNotBePublicUser, not an @static-id alias"
                    )
                elif auth_value != "mustNotBePublicUser" and not auth_value.startswith("@"):
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + security_offset + auth_meta[1])}: "
                        f"SECURITY_BASELINE_REQUIRED_001 custom authorization schemes must be referenced as @<static-id>"
                    )

    for item_start, item_name, item_block in find_component_blocks(text, "pageItem"):
        item_type = (extract_item_type(item_block) or "").lower()
        id_style = bool(re.search(r"(?i)(?:^P\d+_.*(?:_ID|_PK|_KEY|_ROWID)$|^P\d+_ID$)", item_name))
        if item_type != "hidden" and not id_style:
            continue
        item_blocks = extract_top_level_blocks(item_block)
        security_meta = item_blocks.get("security")
        if not security_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, item_start)}: "
                f"HIDDEN_ITEM_SSP_REQUIRED_001 pageItem '{item_name}' must define security.sessionStateProtection"
            )
            continue
        security_offset, security_block = security_meta
        props = block_property_map(security_block)
        ssp_meta = props.get("sessionStateProtection")
        if not ssp_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, item_start + security_offset)}: "
                f"HIDDEN_ITEM_SSP_REQUIRED_001 pageItem '{item_name}' must define sessionStateProtection: checksumRequiredSessionLevel"
            )
            continue
        ssp_value = clean_scalar_value(ssp_meta[0])
        if ssp_value == "unrestricted":
            if not re.search(r"(?is)same-page dynamic action|same page dynamic action|dynamic-action", item_block):
                issues.append(
                    f"{display_path(path)}:{line_no(text, item_start + security_offset + ssp_meta[1])}: "
                    f"HIDDEN_ITEM_SSP_REQUIRED_001 pageItem '{item_name}' unrestricted session state requires same-page dynamic-action comments rationale"
                )
        elif ssp_value != "checksumRequiredSessionLevel":
            issues.append(
                f"{display_path(path)}:{line_no(text, item_start + security_offset + ssp_meta[1])}: "
                f"HIDDEN_ITEM_SSP_REQUIRED_001 pageItem '{item_name}' must use checksumRequiredSessionLevel"
            )

    return issues

def lint_application_contract(path: Path, text: str) -> list[str]:
    """Validate application-level DSL contract rules."""
    issues: list[str] = []
    if path.name != "application.apx":
        return issues

    app_blocks = find_component_blocks(text, "app")
    if not app_blocks:
        issues.append(f"{display_path(path)}:1: DSL_RULE_REQUIRED application.apx must define an app block")
        return issues

    start, app_name, app_block = app_blocks[0]
    top_level_blocks = extract_top_level_blocks(app_block)
    top_level_names = set(top_level_blocks.keys())
    required_blocks = ("navigation", "navigationMenu", "navigationBar")
    legacy_blocks = ("nav", "navMenu", "navBar")

    for block_name in required_blocks:
        if block_name not in top_level_names:
            issues.append(
                f"{display_path(path)}:{line_no(text, start)}: "
                f"DSL_RULE_REQUIRED app '{app_name}' must define block '{block_name}'"
            )

    for block_name in legacy_blocks:
        if block_name in top_level_names:
            block_offset, _ = top_level_blocks[block_name]
            issues.append(
                f"{display_path(path)}:{line_no(text, start + block_offset)}: "
                f"DSL_RULE_LEGACY app '{app_name}' must not use legacy block '{block_name}'"
            )

    navigation_meta = top_level_blocks.get("navigation")
    if navigation_meta:
        block_offset, block_text = navigation_meta
        props = {name for name, _value, _offset in extract_property_values(block_text)}
        for prop_name in ("homeUrl", "loginUrl"):
            if prop_name not in props:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + block_offset)}: "
                    f"DSL_RULE_REQUIRED app '{app_name}' navigation must define property '{prop_name}'"
                )

    for owning_block, required_props in (
        ("navigationMenu", ("list", "listTemplate", "templateOptions")),
        ("navigationBar", ("list", "listTemplate")),
    ):
        block_meta = top_level_blocks.get(owning_block)
        if not block_meta:
            continue
        block_offset, block_text = block_meta
        props = {name for name, _value, _offset in extract_property_values(block_text)}
        for prop_name in required_props:
            if prop_name not in props:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + block_offset)}: "
                    f"DSL_RULE_REQUIRED app '{app_name}' {owning_block} must define property '{prop_name}'"
                )

    root_props = {name for name, _value, _offset in extract_immediate_property_values(app_block)}
    for prop_name in ("homeUrl", "loginUrl", "list", "listTemplate", "templateOptions"):
        if prop_name in root_props:
            issues.append(
                f"{display_path(path)}:{line_no(text, start)}: "
                f"DSL_RULE_PROP_SCOPE app '{app_name}' must not define top-level property '{prop_name}'"
            )

    for block_name, disallowed_props in (
        ("navigationMenu", ("homeUrl", "loginUrl")),
        ("navigationBar", ("homeUrl", "loginUrl")),
        ("navigation", ("list", "listTemplate", "templateOptions")),
    ):
        block_meta = top_level_blocks.get(block_name)
        if not block_meta:
            continue
        block_offset, block_text = block_meta
        for prop_name, _prop_value, prop_offset in extract_property_values(block_text):
            if prop_name in disallowed_props:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + block_offset + prop_offset)}: "
                    f"DSL_RULE_PROP_SCOPE app '{app_name}' {block_name}.{prop_name} is not allowed in that block"
                )

    return issues


def lint_theme_contract(path: Path, text: str) -> list[str]:
    """Validate theme-level DSL contract rules."""
    issues: list[str] = []
    if path.name != "theme.apx" or "shared-components" not in path.parts:
        return issues

    theme_blocks = find_component_blocks(text, "theme")
    if not theme_blocks:
        issues.append(f"{display_path(path)}:1: DSL_RULE_REQUIRED theme.apx must define a theme block")
        return issues

    start, theme_name, theme_block = theme_blocks[0]
    top_level_blocks = extract_top_level_blocks(theme_block)
    immediate_props = {name: (value, offset) for name, value, offset in extract_immediate_property_values(theme_block)}
    subscription_meta = top_level_blocks.get("subscription")
    if subscription_meta:
        subscription_offset, subscription_text = subscription_meta
        subscription_props = {
            name: prop_offset for name, _value, prop_offset in extract_property_values(subscription_text)
        }
        if "master" in subscription_props:
            issues.append(
                f"{display_path(path)}:{line_no(text, start + subscription_offset + subscription_props['master'])}: "
                f"THEME_MASTER_SUBSCRIPTION_FORBIDDEN_001 theme '{theme_name}' must not define subscription.master; "
                "generated theme.apx files must not assume a master theme subscription"
            )

    if "themeNumber" not in immediate_props:
        issues.append(
            f"{display_path(path)}:{line_no(text, start)}: "
            f"DSL_RULE_REQUIRED theme '{theme_name}' must define property 'themeNumber'"
        )
    if "themeNo" in immediate_props:
        issues.append(
            f"{display_path(path)}:{line_no(text, start + immediate_props['themeNo'][1])}: "
            f"DSL_RULE_LEGACY theme '{theme_name}' must not use legacy property 'themeNo'"
        )
    if "javaScript" not in top_level_blocks:
        issues.append(
            f"{display_path(path)}:{line_no(text, start)}: "
            f"DSL_RULE_REQUIRED theme '{theme_name}' must define block 'javaScript'"
        )
    if "js" in top_level_blocks:
        block_offset, _ = top_level_blocks["js"]
        issues.append(
            f"{display_path(path)}:{line_no(text, start + block_offset)}: "
            f"DSL_RULE_LEGACY theme '{theme_name}' must not use legacy block 'js'"
        )

    theme_number_meta = immediate_props.get("themeNumber")
    base_theme_meta = immediate_props.get("baseTheme")
    version_meta = immediate_props.get("version")
    theme_number = clean_scalar_value(theme_number_meta[0]) if theme_number_meta else ""
    current_theme_style_uses_theme_relative_reference = False
    style_meta = top_level_blocks.get("style")
    if style_meta:
        block_offset, block_text = style_meta
        style_props = {name: (value, prop_offset) for name, value, prop_offset in extract_property_values(block_text)}
        current_theme_style_meta = style_props.get("currentThemeStyle")
        if current_theme_style_meta and clean_scalar_value(current_theme_style_meta[0]).startswith("@/"):
            current_theme_style_uses_theme_relative_reference = True

    if theme_number == "42" and current_theme_style_uses_theme_relative_reference and not base_theme_meta:
        if version_meta:
            issues.append(
                f"{display_path(path)}:{line_no(text, start + version_meta[1])}: "
                f"THEME_BASE_THEME_REQUIRED_001 theme '{theme_name}' must define baseTheme for Universal Theme; "
                "using legacy version without baseTheme causes downstream REFERENCE_NOT_FOUND failures for @/... references"
            )
        else:
            issues.append(
                f"{display_path(path)}:{line_no(text, start)}: "
                f"THEME_BASE_THEME_REQUIRED_001 theme '{theme_name}' must define baseTheme for Universal Theme; "
                "missing baseTheme causes downstream REFERENCE_NOT_FOUND failures for @/... references"
            )

    component_defaults = top_level_blocks.get("componentDefaults")
    if component_defaults:
        block_offset, block_text = component_defaults
        prop_map = {name: prop_offset for name, _value, prop_offset in extract_property_values(block_text)}
        legacy_props = (
            "navBarList",
            "navMenuListPosition",
            "navMenuListTop",
            "navMenuListSide",
        )
        for prop_name in legacy_props:
            if prop_name in prop_map:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + block_offset + prop_map[prop_name])}: "
                    f"DSL_RULE_LEGACY theme '{theme_name}' componentDefaults must not use legacy property '{prop_name}'"
                )

    for block_name, (block_offset, block_text) in top_level_blocks.items():
        for prop_name, _prop_value, prop_offset in extract_property_values(block_text):
            if prop_name == "fileUrls" and block_name not in {"javaScript", "css"}:
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + block_offset + prop_offset)}: "
                    f"DSL_RULE_PROP_SCOPE theme '{theme_name}' {block_name}.fileUrls is not allowed; use javaScript.fileUrls or css.fileUrls"
                )

    return issues


def lint_breadcrumb_page_number_contract(path: Path, text: str) -> list[str]:
    """Validate breadcrumb page-number references."""
    issues: list[str] = []
    if path.name != "breadcrumbs.apx" or "shared-components" not in path.parts:
        return issues

    for start, entry_name, block in find_component_blocks(text, "entry"):
        props = {name: (value, offset) for name, value, offset in extract_immediate_property_values(block)}
        if "pageNo" in props:
            issues.append(
                f"{display_path(path)}:{line_no(text, start + props['pageNo'][1])}: "
                f"DSL_RULE_LEGACY entry '{entry_name}' must not use legacy property 'pageNo'"
            )
        if "pageNumber" not in props:
            issues.append(
                f"{display_path(path)}:{line_no(text, start)}: "
                f"DSL_RULE_REQUIRED entry '{entry_name}' must define property 'pageNumber'"
            )

    return issues


def lint_dynamic_action_contract(path: Path, text: str) -> list[str]:
    """Validate dynamic action property and event contracts."""
    issues: list[str] = []

    for start, dynamic_action_name, block in find_component_blocks(text, "dynamicAction"):
        top_level_blocks = extract_top_level_blocks(block)
        when_meta = top_level_blocks.get("when")
        if when_meta:
            block_offset, block_text = when_meta
            props = {name: (value, offset) for name, value, offset in extract_property_values(block_text)}
            event_meta = props.get("event")
            if event_meta:
                event_value = clean_scalar_value(event_meta[0])
                normalized_event = event_value.strip()
                if normalized_event == "dialogClosed":
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + block_offset + event_meta[1])}: "
                        f"DSL_RULE_ENUM dynamicAction '{dynamic_action_name}' when.event must not use alias 'dialogClosed'; use 'apexafterclosedialog'"
                    )
                elif normalized_event and normalized_event not in DYNAMIC_ACTION_ALLOWED_EVENTS:
                    issues.append(
                        f"{display_path(path)}:{line_no(text, start + block_offset + event_meta[1])}: "
                        f"DSL_RULE_ENUM dynamicAction '{dynamic_action_name}' when.event must be one of the approved dynamic action events"
                    )

        for action_offset, action_name, action_block in find_immediate_component_blocks(block, "action"):
            for brace_offset in unmatched_closing_brace_offsets(action_block):
                issues.append(
                    f"{display_path(path)}:{line_no(text, start + action_offset + brace_offset)}: "
                    f"DYNAMIC_ACTION_ACTION_BRACE_INVALID_001 dynamicAction '{dynamic_action_name}' "
                    f"action '{action_name}' has an unmatched closing brace; action components must close with ')' "
                    "after their child blocks"
                )

            top_level_blocks = extract_top_level_blocks(action_block)
            execution_meta = top_level_blocks.get("execution")
            if not execution_meta:
                continue

            block_offset, block_text = execution_meta
            props = {name: (value, offset) for name, value, offset in extract_property_values(block_text)}
            event_meta = props.get("event")
            if not event_meta:
                continue

            issues.append(
                f"{display_path(path)}:{line_no(text, start + action_offset + block_offset + event_meta[1])}: "
                f"DSL_RULE_PROP dynamicAction '{dynamic_action_name}' action '{action_name}' execution.event must not be emitted; current APEXlang compilers ignore it"
            )

    return issues


def lint_template_option_arrays(path: Path, text: str) -> list[str]:
    """Validate generic templateOptions arrays in .apx files."""
    issues: list[str] = []
    for options_match in re.finditer(r"(?ms)templateOptions\s*:\s*\[(.*?)\]", text):
        options_body = options_match.group(1)
        if "," in options_body:
            issues.append(
                f"{display_path(path)}:{line_no(text, options_match.start(1))}: "
                "TEMPLATE_OPTIONS_MULTILINE_REQUIRED_001 templateOptions must emit multi-value arrays "
                "with one accepted value per line and must not use comma-separated inline arrays"
            )
        for token_match in re.finditer(r"(?m)^\s*#DEFAULT#\S+\s*$", options_body):
            issues.append(
                f"{display_path(path)}:{line_no(text, options_match.start(1) + token_match.start())}: "
                "TEMPLATE_OPTIONS_DEFAULT_ATOMIC_001 templateOptions must keep '#DEFAULT#' as one standalone value"
            )
    return issues


def template_option_entries_in_text(text: str) -> list[tuple[str, int]]:
    """Return templateOptions scalar or array entries with offsets in the full text."""
    entries: list[tuple[str, int]] = []
    for array_match in re.finditer(r"(?ms)templateOptions\s*:\s*\[(.*?)\]", text):
        body = array_match.group(1)
        body_offset = array_match.start(1)
        running_offset = 0
        for line in body.splitlines(keepends=True):
            raw_value = line.strip().rstrip(",")
            if raw_value and not raw_value.startswith(("//", "/*", "*")):
                token_offset = line.find(line.strip())
                entries.append((raw_value, body_offset + running_offset + max(token_offset, 0)))
            running_offset += len(line)

    for scalar_match in re.finditer(r"(?m)templateOptions\s*:\s*(?!\[)(.+?)\s*$", text):
        raw_value = scalar_match.group(1).strip().rstrip(",")
        if raw_value:
            entries.append((raw_value, scalar_match.start(1)))
    return entries


def lint_stale_template_option_values(path: Path, text: str) -> list[str]:
    """Reject stale template-option aliases where live compiler metadata requires emitted values."""
    issues: list[str] = []
    for raw_value, offset in template_option_entries_in_text(text):
        if "{{" in raw_value:
            continue
        replacement = STALE_TEMPLATE_OPTION_VALUES.get(raw_value)
        if not replacement:
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, offset)}: "
            f"TEMPLATE_OPTIONS_STALE_VALUE_001 templateOptions value '{raw_value}' is stale for the target compiler; "
            f"use '{replacement}'"
        )
    return issues


def _lint_multiline_structure_segment(path: Path, full_text: str, segment_text: str, segment_offset: int) -> list[str]:
    """Reject compressed inline structural object syntax within one DSL segment."""
    issues: list[str] = []
    offset = 0

    for raw_line in segment_text.splitlines(keepends=True):
        line = raw_line.rstrip("\r\n")
        if not re.match(r"^\s*[A-Za-z][A-Za-z0-9]*\s*:", line):
            offset += len(raw_line)
            continue

        inline_object_match = re.match(r"^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*\{(.*)$", line)
        if inline_object_match:
            if re.match(r"^\s*[A-Za-z][A-Za-z0-9]*\s*:\s*\{\{", line):
                offset += len(raw_line)
                continue
            trailing = inline_object_match.group(2).strip()
            if trailing:
                issues.append(
                    f"{display_path(path)}:{line_no(full_text, segment_offset + offset)}: "
                    "DSL_MULTILINE_STRUCTURE_REQUIRED_001 object-valued properties must emit "
                    "`name: {` on its own line and place nested properties on following lines"
                )

        offset += len(raw_line)

    return issues


def load_font_apex_icon_index() -> tuple[set[str], set[str]]:
    """Load the pinned Font APEX 26.1 icon and modifier inventories once."""
    global _FONT_APEX_ICON_INDEX
    if _FONT_APEX_ICON_INDEX is not None:
        return _FONT_APEX_ICON_INDEX
    try:
        payload = json.loads(FONT_APEX_ICON_INDEX_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Unable to load Font APEX icon index {FONT_APEX_ICON_INDEX_PATH}: {error}") from error
    if (
        not isinstance(payload, dict)
        or payload.get("apex_version") != "26.1"
        or not isinstance(payload.get("icons"), list)
        or not isinstance(payload.get("modifiers"), list)
        or not all(isinstance(item, str) for item in [*payload["icons"], *payload["modifiers"]])
    ):
        raise RuntimeError(f"Invalid Font APEX icon index: {FONT_APEX_ICON_INDEX_PATH}")
    _FONT_APEX_ICON_INDEX = (set(payload["icons"]), set(payload["modifiers"]))
    return _FONT_APEX_ICON_INDEX


def classify_fa_icon_value(value: str) -> str:
    """Classify an icon property as valid, unresolved, or invalid against the pinned catalog."""
    cleaned = clean_scalar_value(value)
    if "{{" in cleaned or "}}" in cleaned or cleaned.startswith("&") or SUBSTITUTION_TOKEN_PATTERN.search(cleaned):
        return "unresolved"
    if not cleaned:
        return "invalid"
    icons, modifiers = load_font_apex_icon_index()
    tokens = cleaned.split()
    selected_icons = [token for token in tokens if token in icons]
    selected_modifiers = [token for token in tokens if token in modifiers]
    is_valid = (
        len(selected_icons) == 1
        and tokens.count("fa") <= 1
        and len(selected_modifiers) == len(set(selected_modifiers))
        and all(token == "fa" or token in icons or token in modifiers for token in tokens)
    )
    return "valid" if is_valid else "invalid"


def value_is_fa_icon(value: str) -> bool:
    """Return whether an icon is valid or intentionally unresolved for a dynamic-capable property."""
    return classify_fa_icon_value(value) != "invalid"


def lint_fa_icon_literals(path: Path, text: str) -> list[str]:
    """Require emitted icon literals to use Font APEX fa-* classes."""
    issues: list[str] = []
    for prop_name, prop_value, prop_offset in extract_property_values(text):
        if prop_name not in ICON_LITERAL_PROPERTIES:
            continue
        cleaned = clean_scalar_value(prop_value)
        if value_is_fa_icon(cleaned):
            continue
        issues.append(
            f"{display_path(path)}:{line_no(text, prop_offset)}: "
            f"FA_ICON_REQUIRED_001 icon property '{prop_name}' must use exactly one catalog-listed Font APEX icon "
            "with optional catalog-listed modifiers; "
            f"found '{cleaned}'"
        )
    return issues


def lint_multiline_structure_rules(path: Path, text: str, *, template_mode: bool = False) -> list[str]:
    """Reject compressed inline structural object syntax."""
    return _lint_multiline_structure_segment(path=path, full_text=text, segment_text=text, segment_offset=0)


def lint_live_compiler_slot_contract(path: Path, text: str) -> list[str]:
    """Validate slot values known to drift from the live compiler contract."""
    issues: list[str] = []

    for page_start, page_name, page_block in find_component_blocks(text, "page"):
        page_top_level_blocks = extract_top_level_blocks(page_block)
        appearance_meta = page_top_level_blocks.get("appearance")
        is_modal_dialog = False
        if appearance_meta:
            _appearance_offset, appearance_block = appearance_meta
            appearance_props = block_property_map(appearance_block)
            page_mode = clean_scalar_value(appearance_props.get("pageMode", ("", 0))[0])
            is_modal_dialog = page_mode == "modalDialog"

        if is_modal_dialog:
            for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
                region_top_level_blocks = extract_top_level_blocks(region_block)
                layout_meta = region_top_level_blocks.get("layout")
                if not layout_meta:
                    continue
                layout_offset, layout_block = layout_meta
                layout_props = block_property_map(layout_block)
                slot_meta = layout_props.get("slot")
                if not slot_meta:
                    continue
                slot_value, slot_offset = slot_meta
                if clean_scalar_value(slot_value).lower() == "body":
                    region_type = extract_item_type(region_block) or "region"
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + region_offset + layout_offset + slot_offset)}: "
                        f"DSL_RULE_SLOT page '{page_name}' modal {region_type} region '{region_name}' must use "
                        "layout.slot: contentBody instead of body"
                    )
        else:
            if not is_login_page(page_name, page_block):
                for region_offset, region_name, region_block in find_immediate_component_blocks(page_block, "region"):
                    region_top_level_blocks = extract_top_level_blocks(region_block)
                    layout_meta = region_top_level_blocks.get("layout")
                    if not layout_meta:
                        continue
                    layout_offset, layout_block = layout_meta
                    layout_props = block_property_map(layout_block)
                    slot_meta = layout_props.get("slot")
                    if not slot_meta:
                        continue
                    slot_value, slot_offset = slot_meta
                    if clean_scalar_value(slot_value) == "contentBody":
                        region_type = extract_item_type(region_block) or "region"
                        issues.append(
                            f"{display_path(path)}:{line_no(text, page_start + region_offset + layout_offset + slot_offset)}: "
                            f"DSL_RULE_SLOT page '{page_name}' standard {region_type} region '{region_name}' must use "
                            "layout.slot: body instead of contentBody"
                        )

        if is_login_page(page_name, page_block):
            continue

        has_breadcrumb_region = page_has_breadcrumb_region(page_block)
        for button_offset, button_name, button_block in find_immediate_component_blocks(page_block, "button"):
            button_props = {
                prop_name: clean_scalar_value(prop_value)
                for prop_name, prop_value, _prop_offset in extract_immediate_property_values(button_block)
            }
            is_create_button = (
                clean_scalar_value(button_name).lower() == "create"
                or button_props.get("buttonName", "").upper() == "CREATE"
            )
            if not is_create_button:
                continue
            button_top_level_blocks = extract_top_level_blocks(button_block)
            layout_meta = button_top_level_blocks.get("layout")
            if not layout_meta:
                continue
            layout_offset, layout_block = layout_meta
            layout_props = block_property_map(layout_block)
            slot_meta = layout_props.get("slot")
            if not slot_meta:
                continue
            slot_value, slot_offset = slot_meta
            if clean_scalar_value(slot_value).lower() == "next":
                issues.append(
                    f"{display_path(path)}:{line_no(text, page_start + button_offset + layout_offset + slot_offset)}: "
                    f"DSL_RULE_SLOT page '{page_name}' create button '{button_name}' must use a valid region "
                    "button slot such as CREATE instead of next"
                )
            button_label = button_props.get("label", "")
            button_token = f"{button_name} {button_props.get('buttonName', '')} {button_label}".lower()
            is_named_create = (
                button_props.get("buttonName", "").upper().startswith("CREATE_")
                or button_name.lower().startswith("create-")
                or button_label.lower().startswith("create ")
                or button_label.lower().startswith("add ")
            )
            is_child_context_create = any(token in button_token for token in ("item", "line", "detail"))
            if has_breadcrumb_region and is_named_create and not is_child_context_create:
                region_meta = layout_props.get("region")
                region_value = clean_scalar_value(region_meta[0]) if region_meta else ""
                if region_value.lower() != "@breadcrumb":
                    issue_offset = region_meta[1] if region_meta else slot_offset
                    issues.append(
                        f"{display_path(path)}:{line_no(text, page_start + button_offset + layout_offset + issue_offset)}: "
                        f"PAGE_ACTION_BREADCRUMB_REQUIRED_001 page '{page_name}' primary create button '{button_name}' "
                        "must be associated to the breadcrumb/title-bar region, usually layout.region: @breadcrumb"
                    )

    return issues


def build_lint_context(path: Path, schema: dict[str, Any], validation_context: dict[str, Any] | None = None) -> LintContext:
    """Build a normalized context object for one lint target."""
    runtime_component_map = schema.get("_runtimeComponentMap")
    if not isinstance(runtime_component_map, dict):
        runtime_component_map = None
    return LintContext(
        path=path,
        text=path.read_text(encoding="utf-8", errors="ignore"),
        schema=schema,
        validation_context=validation_context or {},
        runtime_component_map=runtime_component_map,
    )


def lint_apx_line_endings(path: Path, _text: str) -> list[str]:
    """Require generated APEXlang files to use LF line endings."""
    try:
        raw = path.read_bytes()
    except OSError:
        return []
    first_carriage_return = raw.find(b"\r")
    if first_carriage_return == -1:
        return []
    line = raw.count(b"\n", 0, first_carriage_return) + 1
    return [
        f"{display_path(path)}:{line}: "
        "APEXLANG_LF_LINE_ENDINGS_REQUIRED_001 .apx files must use LF line endings; "
        "convert CRLF or CR to LF before validation or publish"
    ]


def _ctx_path_text_lint(fn: Callable[[Path, str], list[str]]) -> LintRunner:
    """Lift a path/text lint into a context-aware runner."""

    @wraps(fn)
    def runner(ctx: LintContext) -> list[str]:
        """Run a path/text lint against the current lint context."""
        return fn(ctx.path, ctx.text)

    return runner


def _ctx_path_text_schema_lint(fn: Callable[[Path, str, dict], list[str]]) -> LintRunner:
    """Lift a path/text/schema lint into a context-aware runner."""

    @wraps(fn)
    def runner(ctx: LintContext) -> list[str]:
        """Run a path/text/schema lint against the current lint context."""
        return fn(ctx.path, ctx.text, ctx.schema)

    return runner


def _ctx_path_text_validation_lint(fn: Callable[[Path, str, dict[str, Any] | None], list[str]]) -> LintRunner:
    """Lift a path/text/cross-file-context lint into a context-aware runner."""

    @wraps(fn)
    def runner(ctx: LintContext) -> list[str]:
        """Run a path/text/validation-context lint against the current lint context."""
        return fn(ctx.path, ctx.text, ctx.validation_context)

    return runner


def _ctx_path_text_schema_validation_lint(fn: Callable[[Path, str, dict, dict[str, Any] | None], list[str]]) -> LintRunner:
    """Lift a path/text/schema/cross-file-context lint into a context-aware runner."""

    @wraps(fn)
    def runner(ctx: LintContext) -> list[str]:
        """Run a path/text/schema/validation-context lint against the current lint context."""
        return fn(ctx.path, ctx.text, ctx.schema, ctx.validation_context)

    return runner


def _ctx_button_template_option_lint(*, template_mode: bool) -> LintRunner:
    """Bind the template-mode flag for button template-option validation."""

    def runner(ctx: LintContext) -> list[str]:
        """Run button template-option linting for the selected file mode."""
        return lint_button_template_option_contract(ctx.path, ctx.text, template_mode=template_mode)

    runner.__name__ = f"lint_button_template_option_contract_{'template' if template_mode else 'apx'}"
    return runner


def run_lints(ctx: LintContext, lints: list[LintRunner]) -> list[str]:
    """Run a sequence of lint runners against one target."""
    issues: list[str] = []
    for lint in lints:
        issues.extend(lint(ctx))
    return issues


def lint_page_item_schema_contracts(ctx: LintContext) -> list[str]:
    """Validate page-item blocks against the loaded schema."""
    issues: list[str] = []
    page_item_schema = ctx.schema["components"].get("pageItem", {})

    for start, item_name, block in find_component_blocks(ctx.text, "pageItem"):
        item_type = extract_item_type(block)
        if not item_type or item_type not in page_item_schema:
            continue

        item_schema = page_item_schema[item_type]
        allowed_blocks = set(item_schema.get("allowedBlocks", []))
        required_blocks = set(item_schema.get("requiredBlocks", []))
        top_level_blocks = extract_top_level_blocks(block)

        for block_name, (offset, _sub_block) in top_level_blocks.items():
            if block_name not in allowed_blocks:
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, start + offset)}: "
                    f"DSL_RULE_BLOCK pageItem '{item_name}' type '{item_type}' does not allow block '{block_name}'"
                )

        missing_blocks = sorted(required_blocks - set(top_level_blocks.keys()))
        for block_name in missing_blocks:
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, start)}: "
                f"DSL_RULE_REQUIRED pageItem '{item_name}' type '{item_type}' must define block '{block_name}'"
            )

        component_label = f"pageItem '{item_name}' type '{item_type}'"
        for block_name, (block_offset, block_text) in top_level_blocks.items():
            block_meta = item_schema.get(block_name)
            if not is_block_meta(block_meta):
                continue
            lint_block_properties(
                issues=issues,
                path=ctx.path,
                text=ctx.text,
                component_start=start,
                component_label=component_label,
                block_name=block_name,
                block_offset=block_offset,
                block_text=block_text,
                block_meta=block_meta,
            )

    return issues


def lint_template_item_schema_examples(ctx: LintContext) -> list[str]:
    """Validate template examples and docs against page-item schema contracts."""
    issues: list[str] = []
    page_item_schema = ctx.schema["components"].get("pageItem", {})

    for item_type, item_schema in page_item_schema.items():
        if f"type: {item_type}" not in ctx.text:
            continue

        for block_name, block_meta in item_schema.items():
            if not is_block_meta(block_meta):
                continue
            allowed_properties = set(block_meta.get("allowedProperties", []))
            if not allowed_properties:
                continue
            for bad_match in re.finditer(rf"{re.escape(block_name)}\.([A-Za-z][A-Za-z0-9]*)", ctx.text):
                prop_name = bad_match.group(1)
                line_text = ctx.text[
                    ctx.text.rfind("\n", 0, bad_match.start()) + 1 : ctx.text.find("\n", bad_match.start())
                    if ctx.text.find("\n", bad_match.start()) != -1
                    else len(ctx.text)
                ]
                if "Do not document or emit" in line_text or "unless the schema explicitly permits" in line_text:
                    continue
                if prop_name not in allowed_properties:
                    issues.append(
                        f"{display_path(ctx.path)}:{line_no(ctx.text, bad_match.start())}: "
                        f"DSL_TEMPLATE_PROP template documents unsupported property {block_name}.{prop_name} for item type '{item_type}'"
                    )

        for _, _name, block in find_component_blocks(ctx.text, "pageItem"):
            if f"type: {item_type}" not in block:
                continue
            top_level_blocks = extract_top_level_blocks(block)
            for block_name, (block_offset, block_text) in top_level_blocks.items():
                block_meta = item_schema.get(block_name)
                if not is_block_meta(block_meta):
                    continue
                allowed_properties = set(block_meta.get("allowedProperties", []))
                if not allowed_properties:
                    continue
                for prop_name, _prop_value, prop_offset in extract_property_values(block_text):
                    if prop_name not in allowed_properties:
                        issues.append(
                            f"{display_path(ctx.path)}:{line_no(ctx.text, block_offset + prop_offset)}: "
                            f"DSL_TEMPLATE_PROP template example emits unsupported property {block_name}.{prop_name} for item type '{item_type}'"
                        )

    return issues


def lint_apexlang_template_grammar_contract(ctx: LintContext) -> list[str]:
    """Validate fenced apexlang examples against the EBNF component surface."""
    issues: list[str] = []
    snippets = extract_apexlang_fenced_examples(ctx.text)
    if not snippets:
        return issues

    contracts_by_keyword = load_apexlang_grammar_contracts()

    for snippet in snippets:
        for component in find_apexlang_snippet_components(snippet.text):
            contracts = [
                *contracts_by_keyword.get(component.keyword, []),
                *apexlang_schema_contracts_for_component(ctx.schema, component),
            ]
            component_offset = snippet.offset + component.offset
            if not contracts:
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, component_offset)}: "
                    "APEXLANG_GRAMMAR_UNKNOWN_COMPONENT_001 "
                    f"fenced apexlang example emits unknown component keyword '{component.keyword}'"
                )
                continue

            for prop_name, prop_offset in extract_apexlang_immediate_direct_properties(component.text):
                if any(prop_name in contract.direct_properties for contract in contracts):
                    continue
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, component_offset + prop_offset)}: "
                    "APEXLANG_GRAMMAR_UNKNOWN_DIRECT_PROPERTY_001 "
                    f"component '{component.keyword}' does not allow direct property '{prop_name}' "
                    "in any grammar candidate"
                )

            for group_name, group_offset, group_block in extract_apexlang_immediate_group_blocks(component.text):
                group_contracts = [
                    contract for contract in contracts if group_name in contract.group_properties
                ]
                if not group_contracts:
                    if apexlang_is_page_item_plugin_attribute_group(component, group_name):
                        continue
                    issues.append(
                        f"{display_path(ctx.path)}:{line_no(ctx.text, component_offset + group_offset)}: "
                        "APEXLANG_GRAMMAR_UNKNOWN_GROUP_BLOCK_001 "
                        f"component '{component.keyword}' does not allow group block '{group_name}' "
                        "in any grammar candidate"
                    )
                    continue

                for prop_name, prop_offset in extract_apexlang_immediate_group_properties(group_block):
                    if any(prop_name in contract.group_properties.get(group_name, set()) for contract in group_contracts):
                        continue
                    issues.append(
                        f"{display_path(ctx.path)}:{line_no(ctx.text, component_offset + group_offset + prop_offset)}: "
                        "APEXLANG_GRAMMAR_UNKNOWN_GROUP_PROPERTY_001 "
                        f"component '{component.keyword}' group '{group_name}' does not allow property '{prop_name}' "
                        "in any grammar candidate"
                    )

    return issues


def lint_calendar_template_contract(ctx: LintContext) -> list[str]:
    """Validate calendar template docs and examples against canonical calendar rules."""
    issues: list[str] = []
    region_schema = ctx.schema["components"].get("region", {})
    calendar_schema = region_schema.get("calendar")
    if isinstance(calendar_schema, dict) and ("type: calendar" in ctx.text or "/calendar/" in display_path(ctx.path)):
        for legacy_name, canonical_name in CALENDAR_LEGACY_SETTING_ALIASES.items():
            for match in re.finditer(rf"(?m)^\s*{re.escape(legacy_name)}\s*:\s*.+$", ctx.text):
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, match.start())}: "
                    f"DSL_TEMPLATE_VALUE template example must use canonical calendar property "
                    f"'{canonical_name}' instead of legacy alias '{legacy_name}'"
                )

        for match in re.finditer(r"(?m)^\s*showTime\s*:\s*.+$", ctx.text):
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, match.start())}: "
                "DSL_TEMPLATE_PROP template example emits unsupported property settings.showTime for region type 'calendar'"
            )

        for match in re.finditer(r"(?m)^\s*additionalCalendarViews\s*:\s*([A-Za-z][A-Za-z0-9]*)\s*$", ctx.text):
            token = match.group(1)
            if normalize_value(token) in CALENDAR_ADDITIONAL_VIEW_VALUES:
                continue
            issues.append(
                f"{display_path(ctx.path)}:{line_no(ctx.text, match.start(1))}: "
                "DSL_TEMPLATE_VALUE settings.additionalCalendarViews must use only: list, navigation"
            )

        for match in re.finditer(r"(?ms)^\s*additionalCalendarViews\s*:\s*\[(.*?)\]", ctx.text):
            body = match.group(1)
            for token_match in re.finditer(r"[A-Za-z][A-Za-z0-9]*", body):
                token = token_match.group(0)
                if normalize_value(token) in CALENDAR_ADDITIONAL_VIEW_VALUES:
                    continue
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, match.start(1) + token_match.start())}: "
                    "DSL_TEMPLATE_VALUE settings.additionalCalendarViews must use only: list, navigation"
                )

        for match in re.finditer(r"(?ms)templateOptions\s*:\s*\[(.*?)\]", ctx.text):
            body = match.group(1)
            for token_match in re.finditer(r"(?m)^\s*#DEFAULT#\S+\s*$", body):
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, match.start(1) + token_match.start())}: "
                    "DSL_TEMPLATE_VALUE templateOptions must keep '#DEFAULT#' as one standalone templateOptions value"
                )
            if re.search(r"(?m)^\s*t-Region--hideHeader\s*$", body) and re.search(r"(?m)^\s*js-addHiddenHeadingRoleDesc\s*$", body):
                issues.append(
                    f"{display_path(ctx.path)}:{line_no(ctx.text, match.start(1))}: "
                    "DSL_TEMPLATE_VALUE calendar template must keep 't-Region--hideHeader js-addHiddenHeadingRoleDesc' as one combined templateOptions value"
                )

    return issues


# Lint registry
#
# Keep this as grouped lists inside the single shipped validator file. That gives
# future rules clearer homes without growing the distributed Python file surface.

APX_STRUCTURE_AND_FORMAT_LINTERS: list[LintRunner] = [
    _ctx_path_text_lint(lint_apx_line_endings),
    _ctx_path_text_lint(lint_page_filename_identity_contract),
    _ctx_path_text_lint(lint_page_direct_property_contract),
    _ctx_path_text_lint(lint_layout_scopes),
    _ctx_path_text_lint(lint_stale_template_option_values),
    _ctx_path_text_lint(lint_dashboard_layout_contracts),
    _ctx_path_text_lint(lint_template_option_arrays),
    _ctx_path_text_lint(lint_fa_icon_literals),
    _ctx_path_text_lint(lint_multiline_structure_rules),
    _ctx_path_text_lint(lint_live_compiler_slot_contract),
    _ctx_button_template_option_lint(template_mode=False),
]

APX_APP_AND_SHARED_METADATA_LINTERS: list[LintRunner] = [
    _ctx_path_text_schema_validation_lint(lint_region_contracts),
    _ctx_path_text_lint(lint_dynamic_action_contract),
    _ctx_path_text_lint(lint_application_contract),
    _ctx_path_text_lint(lint_theme_contract),
    _ctx_path_text_lint(lint_translation_text_messages),
]

APX_NAVIGATION_REPORT_AND_REGION_LINTERS: list[LintRunner] = [
    _ctx_path_text_lint(lint_declarative_navigation_targets),
    _ctx_path_text_lint(lint_report_column_rendering),
    _ctx_path_text_lint(lint_classic_report_default_templates),
    _ctx_path_text_lint(lint_classic_report_hidden_column_headings),
    _ctx_path_text_validation_lint(lint_smart_filter_results_regions),
    _ctx_path_text_validation_lint(lint_content_row_settings_and_selection_contracts),
    _ctx_path_text_schema_validation_lint(lint_media_list_contract),
    _ctx_path_text_validation_lint(lint_metric_card_selection_contracts),
    _ctx_path_text_lint(lint_master_detail_contracts),
    _ctx_path_text_validation_lint(lint_interactive_report_contracts),
    _ctx_path_text_lint(lint_cards_refresh_contract),
    _ctx_path_text_lint(lint_map_layer_bind_submit_contract),
    _ctx_path_text_validation_lint(lint_smart_filter_base_source_contract),
    _ctx_path_text_validation_lint(lint_smart_filter_search_source_contract),
    _ctx_path_text_validation_lint(lint_smart_filter_security_scope_contract),
    lint_smart_filter_search_behavior_contract,
    lint_smart_filter_performance_readiness_contract,
    lint_smart_filter_accessibility_contract,
    lint_smart_filter_settings_contract,
    _ctx_path_text_lint(lint_default_guidance_layer),
    _ctx_path_text_lint(lint_drawer_default_position_contract),
    _ctx_path_text_lint(lint_faceted_search_entity_display_contract),
    _ctx_path_text_lint(lint_faceted_search_source_data_type_contract),
    _ctx_path_text_lint(lint_faceted_search_list_entries_contract),
    _ctx_path_text_lint(lint_report_sql_html_literals),
    _ctx_path_text_lint(lint_breadcrumb_parent_scope),
]

APX_SECURITY_SQL_AND_FORM_LINTERS: list[LintRunner] = [
    _ctx_path_text_lint(lint_image_upload_legacy_properties),
    _ctx_path_text_lint(lint_file_upload_display_storage_contract),
    _ctx_path_text_lint(lint_generated_security_contract),
    _ctx_path_text_lint(lint_inline_code_block_char_limits),
    _ctx_path_text_lint(lint_static_id_where_lower),
    _ctx_path_text_lint(lint_sql_lob_comparison_keys),
    _ctx_path_text_lint(lint_acl_role_declarations),
    _ctx_path_text_lint(lint_form_primary_key_contract),
    _ctx_path_text_lint(lint_form_edit_contract),
    lint_saved_report_visibility_contract,
    _ctx_path_text_lint(lint_faceted_search_settings_contract),
    _ctx_path_text_lint(lint_interactive_report_link_column_contract),
    _ctx_path_text_lint(lint_report_region_link_block_live_contract),
    _ctx_path_text_lint(lint_interactive_report_column_live_metadata),
    _ctx_path_text_lint(lint_filter_and_facet_identifier_contract),
    _ctx_path_text_lint(lint_avatar_column_identifier_contract),
    _ctx_path_text_lint(lint_template_component_action_layout_sequence_contract),
    _ctx_path_text_lint(lint_list_region_live_template_contract),
    _ctx_path_text_lint(lint_interactive_report_saved_report_live_contract),
    _ctx_path_text_lint(lint_invoke_api_parameter_expression_contract),
    _ctx_path_text_lint(lint_page_item_layout_legacy_properties),
    _ctx_path_text_lint(lint_page_item_region_slots),
    _ctx_path_text_lint(lint_display_only_source_types),
]

APX_SCHEMA_BACKED_LINTERS: list[LintRunner] = [
    _ctx_path_text_schema_lint(lint_component_settings_contract),
    _ctx_path_text_schema_lint(lint_shared_entry_contract),
    _ctx_path_text_lint(lint_breadcrumb_page_number_contract),
    _ctx_path_text_schema_lint(lint_region_contract),
    lint_page_item_schema_contracts,
]

APX_LINTERS: list[LintRunner] = [
    lint_semantic_component_tree,
    *APX_STRUCTURE_AND_FORMAT_LINTERS,
    *APX_APP_AND_SHARED_METADATA_LINTERS,
    *APX_NAVIGATION_REPORT_AND_REGION_LINTERS,
    *APX_SECURITY_SQL_AND_FORM_LINTERS,
    *APX_SCHEMA_BACKED_LINTERS,
]

TEMPLATE_STRUCTURE_AND_FORMAT_LINTERS: list[LintRunner] = [
    _ctx_button_template_option_lint(template_mode=True),
    _ctx_path_text_lint(lint_button_template_option_inventory),
    _ctx_path_text_lint(lint_stale_template_option_values),
    _ctx_path_text_lint(lint_multiline_structure_rules),
]

TEMPLATE_NAVIGATION_ITEM_AND_REGION_LINTERS: list[LintRunner] = [
    _ctx_path_text_lint(lint_declarative_navigation_targets),
    _ctx_path_text_lint(lint_page_item_layout_legacy_properties),
    _ctx_path_text_lint(lint_page_item_region_slots),
    _ctx_path_text_lint(lint_display_only_source_types),
    _ctx_path_text_lint(lint_classic_report_hidden_column_headings),
    lambda ctx: lint_smart_filter_results_regions(ctx.path, ctx.text, ctx.validation_context, apex_242=False),
    lint_smart_filter_settings_contract,
    _ctx_path_text_lint(lint_image_upload_legacy_properties),
    _ctx_path_text_lint(lint_file_upload_display_storage_contract),
    _ctx_path_text_lint(lint_sql_lob_comparison_keys),
]

TEMPLATE_SCHEMA_EXAMPLE_LINTERS: list[LintRunner] = [
    lint_apexlang_template_grammar_contract,
    lint_template_item_schema_examples,
    lint_calendar_template_contract,
]

TEMPLATE_LINTERS: list[LintRunner] = [
    *TEMPLATE_STRUCTURE_AND_FORMAT_LINTERS,
    *TEMPLATE_NAVIGATION_ITEM_AND_REGION_LINTERS,
    *TEMPLATE_SCHEMA_EXAMPLE_LINTERS,
]


def lint_apx_file(path: Path, schema: dict, validation_context: dict[str, Any] | None = None) -> list[str]:
    """Run all relevant validators for an application DSL file."""
    return run_lints(build_lint_context(path, schema, validation_context), APX_LINTERS)


def lint_template_file(path: Path, schema: dict) -> list[str]:
    """Run template-specific validators for Markdown template files."""
    return run_lints(build_lint_context(path, schema), TEMPLATE_LINTERS)


def main(argv: list[str]) -> int:
    """Parse CLI arguments, run validators, write reports, and return the exit code."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--templates", action="store_true", help="Validate Markdown item templates instead of .apx files")
    parser.add_argument("--component-attributes", default="", help="Override the compiler-backed component attribute schema.")
    parser.add_argument("--generation-plan", default="", help="Structured Smart Filter Generation Plan JSON used for evidence gates.")
    parser.add_argument(
        "--require-smart-filter-generation-plan",
        action="store_true",
        help="Block Smart Filter validation when no structured Generation Plan is available.",
    )
    parser.add_argument("--report-path", default="", help="Optional JSON report output path.")
    parser.add_argument("paths", nargs="*", help="Files or directories to lint")
    args = parser.parse_args(argv)

    schema_path = Path(args.component_attributes).expanduser().resolve() if args.component_attributes else SCHEMA_PATH
    schema = load_schema(schema_path)
    runtime_component_map = schema.get("_runtimeComponentMap")

    def report_runtime_meta() -> dict[str, Any]:
        """Return compiler metadata details for the JSON report."""
        if not isinstance(runtime_component_map, dict):
            return {
                "source": schema.get("_runtimeComponentMapSource", "component-attributes-only"),
                "buildID": None,
                "normalizerVersion": None,
            }
        return {
            "source": schema.get("_runtimeComponentMapSource", "query-valid-props"),
            "buildID": runtime_component_map.get("buildID"),
            "normalizerVersion": runtime_component_map.get("normalizerVersion"),
        }

    if args.templates:
        targets = collect_targets(args.paths, (".md",))
        if not targets:
            targets = sorted((ROOT / "references/policies/apexlang/templates").rglob("*.md"))
        issues: list[str] = []
        for target in targets:
            issues.extend(lint_template_file(target, schema))
        if args.report_path:
            report_path = Path(args.report_path).expanduser()
            if not report_path.is_absolute():
                report_path = (Path.cwd() / report_path).resolve()
            write_report(
                report_path,
                {
                    "mode": "templates",
                    "status": "fail" if issues else "pass",
                    "runtimeComponentMap": report_runtime_meta(),
                    "targets": [display_path(target) for target in targets],
                    "issues": [issue_to_record(issue) for issue in issues],
                },
            )
        if issues:
            print("APEXLANG_TEMPLATE_LINT_FAILED")
            for issue in issues:
                print(" -", issue)
            return 1
        print("APEXLANG_TEMPLATE_LINT_OK")
        return 0

    app_roots = collect_app_roots(args.paths)
    targets = [target for target in collect_targets(args.paths, (".apx",)) if not is_export_backup_path(target)]
    if not targets:
        targets = [
            target
            for target in sorted((ROOT / "applications").rglob("*.apx"))
            if not is_export_backup_path(target)
        ]
    validation_context = build_validation_context(
        targets,
        generation_plan_path=args.generation_plan or None,
        require_smart_filter_generation_plan=args.require_smart_filter_generation_plan,
    )

    issues: list[str] = []
    for app_root in app_roots:
        issues.extend(lint_app_root_contract(app_root))
        issues.extend(lint_app_ux_contract(app_root))
        issues.extend(lint_breadcrumb_coverage_contract(app_root))
        issues.extend(lint_modal_report_refresh_contract(app_root))
        issues.extend(lint_modal_cards_refresh_contract(app_root))
    for target in targets:
        issues.extend(lint_apx_file(target, schema, validation_context))

    if args.report_path:
        report_path = Path(args.report_path).expanduser()
        if not report_path.is_absolute():
            report_path = (Path.cwd() / report_path).resolve()
        write_report(
            report_path,
            {
                "mode": "dsl",
                "status": "fail" if issues else "pass",
                "runtimeComponentMap": report_runtime_meta(),
                "targets": sorted({display_path(target) for target in targets} | {display_path(app_root) for app_root in app_roots}),
                "issues": [issue_to_record(issue) for issue in issues],
            },
        )

    if issues:
        print("APEXLANG_DSL_LINT_FAILED")
        for issue in issues:
            print(" -", issue)
        return 1

    print("APEXLANG_DSL_LINT_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
