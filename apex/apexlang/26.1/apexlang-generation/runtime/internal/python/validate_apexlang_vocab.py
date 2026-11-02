#!/usr/bin/env python3
"""Validate and optionally normalize APEXlang scaffold vocabulary."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from validator_common import LOG_ROOT, display_path, line_no, write_report

DEFAULT_REPORT = LOG_ROOT / "apexlang-vocab-report.json"
SUPPORTED_MMD_VERSION = "26.1.0+3102"


@dataclass(frozen=True)
class AliasRule:
    """Mapping rule for replacing legacy vocabulary with canonical APEXlang terms."""
    old: str
    new: str
    kind: str  # "block" or "property"


ALIAS_RULES: tuple[AliasRule, ...] = (
    AliasRule(old="nav", new="navigation", kind="block"),
    AliasRule(old="navMenu", new="navigationMenu", kind="block"),
    AliasRule(old="navBar", new="navigationBar", kind="block"),
    AliasRule(old="themeNo", new="themeNumber", kind="property"),
    AliasRule(old="js", new="javaScript", kind="block"),
    AliasRule(old="navBarList", new="navigationBarList", kind="property"),
    AliasRule(old="navMenuListPosition", new="navigationMenuListPosition", kind="property"),
    AliasRule(old="navMenuListTop", new="navigationMenuListTop", kind="property"),
    AliasRule(old="navMenuListSide", new="navigationMenuListSide", kind="property"),
    AliasRule(old="pageNo", new="pageNumber", kind="property"),
)

MIXED_PAIRS: tuple[tuple[str, str], ...] = tuple((rule.old, rule.new) for rule in ALIAS_RULES)


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse command-line options for vocabulary validation and rewrite mode."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--app-path", required=True, help="Path to the target application folder.")
    parser.add_argument("--rewrite", action="store_true", help="Rewrite deterministic aliases in place.")
    parser.add_argument("--check-only", action="store_true", help="Check vocabulary only and do not rewrite.")
    parser.add_argument(
        "--report-path",
        default=str(DEFAULT_REPORT),
        help="JSON report output path.",
    )
    return parser.parse_args(argv)


def resolve_mmd_version(app_path: Path) -> str:
    """Read the APEXlang MMD version from application metadata when available."""
    apexlang_path = app_path / ".apex/apexlang.json"
    if not apexlang_path.exists():
        return ""
    try:
        payload = json.loads(apexlang_path.read_text(encoding="utf-8"))
    except Exception:
        return ""
    if not isinstance(payload, dict):
        return ""
    value = payload.get("mmdVersion")
    return str(value).strip() if value is not None else ""


def is_supported_mmd_version(mmd_version: str) -> bool:
    """Return whether an MMD version matches the active APEXlang baseline."""
    return mmd_version.strip() == SUPPORTED_MMD_VERSION


def collect_target_files(app_path: Path) -> list[Path]:
    """Collect application DSL files that can contain legacy vocabulary."""
    files: list[Path] = []
    patterns = (
        "application.apx",
        "shared-components/themes/**/theme.apx",
        "shared-components/component-settings.example.md",
        "shared-components/breadcrumbs.apx",
        "pages/p00001-*.apx",
        "pages/p09999-*.apx",
    )
    for pattern in patterns:
        files.extend(app_path.glob(pattern))
    unique = sorted({path.resolve() for path in files if path.exists() and path.is_file()})
    return [Path(p) for p in unique]


def find_pattern(rule: AliasRule) -> re.Pattern[str]:
    """Build the regex used to find a legacy alias rule."""
    token = re.escape(rule.old)
    if rule.kind == "block":
        return re.compile(rf"(?m)^(\s*)({token})(\s*)\{{")
    return re.compile(rf"(?m)^(\s*)({token})(\s*:)")


def find_canonical_pattern(rule: AliasRule) -> re.Pattern[str]:
    """Build the regex used to find the canonical target for an alias rule."""
    token = re.escape(rule.new)
    if rule.kind == "block":
        return re.compile(rf"(?m)^\s*{token}\s*\{{")
    return re.compile(rf"(?m)^\s*{token}\s*:")



def run(argv: list[str]) -> int:
    """Validate or rewrite vocabulary aliases and write the JSON report."""
    args = parse_args(argv)
    rewrite_enabled = bool(args.rewrite and not args.check_only)

    app_path = Path(args.app_path).expanduser()
    if not app_path.is_absolute():
        app_path = (Path.cwd() / app_path).resolve()

    report_path = Path(args.report_path).expanduser()
    if not report_path.is_absolute():
        report_path = (Path.cwd() / report_path).resolve()

    report: dict[str, Any] = {
        "app_path": str(app_path),
        "mmd_version": "",
        "supported_version": False,
        "rewrite_requested": bool(args.rewrite),
        "check_only": bool(args.check_only),
        "files_scanned": [],
        "files_touched": [],
        "rewrites": [],
        "legacy_aliases_found": [],
        "mixed_vocabulary_detected": False,
        "mixed_vocabulary_files": [],
        "blocking_reason": "",
        "unresolved": [],
    }

    if not app_path.exists():
        report["blocking_reason"] = "APP_PATH_REQUIRED"
        report["unresolved"].append(
            {
                "file": str(app_path),
                "rule": "app_path",
                "message": "Application path does not exist",
            }
        )
        write_report(report_path, report)
        print("Vocabulary compatibility check failed: application path does not exist.")
        return 1

    mmd_version = resolve_mmd_version(app_path)
    report["mmd_version"] = mmd_version
    report["supported_version"] = is_supported_mmd_version(mmd_version)
    target_files = collect_target_files(app_path)
    report["files_scanned"] = [display_path(path) for path in target_files]

    if not mmd_version:
        report["blocking_reason"] = "MMD_VERSION_REQUIRED"
        report["unresolved"].append(
            {
                "file": display_path(app_path / ".apex/apexlang.json"),
                "rule": "mmdVersion",
                "message": "Unable to resolve mmdVersion from .apex/apexlang.json",
            }
        )
        write_report(report_path, report)
        print("Vocabulary compatibility check failed: missing mmdVersion.")
        return 1

    if not report["supported_version"]:
        report["blocking_reason"] = "UNSUPPORTED_MMD_VERSION"
        report["unresolved"].append(
            {
                "file": display_path(app_path / ".apex/apexlang.json"),
                "rule": "mmdVersion",
                "message": f"Unsupported mmdVersion '{mmd_version}'. Supported version is {SUPPORTED_MMD_VERSION}.",
            }
        )
        write_report(report_path, report)
        print(f"Vocabulary compatibility check failed: unsupported mmdVersion (supported version {SUPPORTED_MMD_VERSION}).")
        return 1

    touched_files: set[str] = set()

    for path in target_files:
        original_text = path.read_text(encoding="utf-8")
        updated_text = original_text

        for rule in ALIAS_RULES:
            pattern = find_pattern(rule)
            matches = list(pattern.finditer(updated_text))
            if not matches:
                continue

            for match in matches:
                record = {
                    "file": display_path(path),
                    "line": line_no(updated_text, match.start(2)),
                    "legacy_key": rule.old,
                    "expected_key": rule.new,
                    "kind": rule.kind,
                }
                report["legacy_aliases_found"].append(record)
                report["rewrites"].append(
                    {
                        "file": display_path(path),
                        "line": record["line"],
                        "from": rule.old,
                        "to": rule.new,
                        "kind": rule.kind,
                    }
                )

            if rewrite_enabled:
                if rule.kind == "block":
                    updated_text = pattern.sub(rf"\1{rule.new}\3{{", updated_text)
                else:
                    updated_text = pattern.sub(rf"\1{rule.new}\3", updated_text)

        if rewrite_enabled and updated_text != original_text:
            path.write_text(updated_text, encoding="utf-8")
            touched_files.add(display_path(path))

    report["files_touched"] = sorted(touched_files)

    mixed_files: set[str] = set()
    canonical_present_any = False
    legacy_present_any = False
    for path in target_files:
        text = path.read_text(encoding="utf-8")
        rel_path = display_path(path)
        for rule in ALIAS_RULES:
            legacy_pattern = find_pattern(rule)
            canonical_pattern = find_canonical_pattern(rule)
            if legacy_pattern.search(text):
                legacy_present_any = True
            if canonical_pattern.search(text):
                canonical_present_any = True
            for match in legacy_pattern.finditer(text):
                report["unresolved"].append(
                    {
                        "file": rel_path,
                        "line": line_no(text, match.start(2)),
                        "legacy_key": rule.old,
                        "expected_key": rule.new,
                        "kind": rule.kind,
                    }
                )
            if legacy_pattern.search(text) and canonical_pattern.search(text):
                mixed_files.add(rel_path)

    if legacy_present_any and canonical_present_any:
        mixed_files.add("<app>")

    report["mixed_vocabulary_files"] = sorted(mixed_files)
    report["mixed_vocabulary_detected"] = bool(mixed_files)

    if report["mixed_vocabulary_detected"]:
        report["blocking_reason"] = "MIXED_VOCABULARY_DETECTED"
    elif report["unresolved"]:
        report["blocking_reason"] = "LEGACY_VOCABULARY_DETECTED"

    write_report(report_path, report)

    if report["mixed_vocabulary_detected"]:
        print("Vocabulary compatibility check failed: mixed legacy and canonical vocabulary detected.")
        return 1

    if report["unresolved"]:
        print("Vocabulary compatibility check failed: unresolved legacy aliases remain.")
        return 1

    print("Vocabulary compatibility check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(run(sys.argv[1:]))
