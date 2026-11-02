#!/usr/bin/env python3
"""Validate APEXlang snippets for deterministic governance checks."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from validator_common import COMPONENT_POLICIES_PATH, LOG_ROOT, VALIDATIONS_TEMPLATE_ROOT, ROOT, collect_targets, display_path, issue_to_record, line_no, write_report

COMPONENT_POLICY_PATH = COMPONENT_POLICIES_PATH
DEFAULT_REPORT = LOG_ROOT / "apexlang-validations-report.json"
GOSPEL_REGEX = re.compile(
    r"validation\s+(?P<static_id>[A-Za-z0-9_-]+)\s*\(\s*"
    r"name:\s*[^\n]+?\n"
    r"\s*execution\s*\{\s*sequence:\s*(?P<sequence>\d+)\s*\}\s*"
    r"validation\s*\{(?P<validation_body>.*?)\}\s*"
    r"error\s*\{\s*errorMessage:\s*[^\n]+?\n\s*associatedItem:\s*@(?P<item>[A-Za-z0-9_]+)\s*\}\s*"
    r"(?:serverSideCondition\s*\{\s*whenButtonPressed:\s*@[A-Za-z0-9_-]+?\s*\}\s*)?"
    r"(?:security\s*\{\s*authorizationScheme:\s*[^\n]+?\}\s*)?"
    r"\)",
    re.DOTALL,
)


def find_blocks(text: str, keyword: str) -> list[tuple[int, str]]:
    """Return (start_idx, block_text) pairs for top-level keyword blocks."""
    results: list[tuple[int, str]] = []
    pattern = re.compile(rf"^\s*{re.escape(keyword)}\s+[A-Za-z0-9_$-]+\s*\(", re.MULTILINE)
    for match in pattern.finditer(text):
        start = match.start()
        depth = 0
        for idx in range(start, len(text)):
            ch = text[idx]
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    results.append((start, text[start : idx + 1]))
                    break
    return results


def find_validation_blocks(text: str) -> list[tuple[int, str, str]]:
    """Return (start_idx, static_id, block_text) triples for every validation."""
    results: list[tuple[int, str, str]] = []
    for start_idx, block in find_blocks(text, "validation"):
        match = re.search(r"^\s*validation\s+([A-Za-z0-9_-]+)", block, re.MULTILINE)
        if match:
            results.append((start_idx, match.group(1), block))
    return results


def lint_validation_file(path: Path) -> list[str]:
    """Validate validation snippets against the required deterministic skeleton."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    issues: list[str] = []
    for start_idx, static_id, block in find_validation_blocks(text):
        if not GOSPEL_REGEX.search(block):
            issues.append(
                f"{display_path(path)}:{line_no(text, start_idx)}: "
                f"VALIDATION_RULE_SKELETON validation '{static_id}' deviates from gospel skeleton"
            )
        if not static_id.upper().startswith("VAL_"):
            issues.append(
                f"{display_path(path)}:{line_no(text, start_idx)}: "
                f"VALIDATION_RULE_STATIC_ID validation '{static_id}' static ID must start with VAL_"
            )
    return issues



def load_component_policy_rules(scope: str) -> list[dict]:
    """Load component policy lint rules for the requested component scope."""
    try:
        data = json.loads(COMPONENT_POLICY_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        raise RuntimeError(f"Failed to parse component policy JSON: {COMPONENT_POLICY_PATH} ({exc})") from exc

    if not isinstance(data, dict) or not isinstance(data.get("rules"), list):
        raise RuntimeError("component-policies.json must contain a 'rules' array")

    rules: list[dict] = []
    for rule in data["rules"]:
        if not isinstance(rule, dict):
            raise RuntimeError("component policy rule must be an object")

        if rule.get("scope") != scope:
            continue

        # Scope-first validation: only validate schema required by this lint mode.
        required = ["id", "scope", "when", "forbid", "severity", "message"]
        for key in required:
            if key not in rule:
                raise RuntimeError(f"component policy rule missing required key: {key}")
        if not isinstance(rule["when"], dict) or "action" not in rule["when"]:
            raise RuntimeError(f"component policy rule {rule['id']} must define when.action")
        if not isinstance(rule["forbid"], list):
            raise RuntimeError(f"component policy rule {rule['id']} must define forbid as a list")

        rules.append(rule)
    return rules


def lint_button_rules(path: Path, rules: list[dict]) -> list[str]:
    """Validate button snippets against component policy requirements."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    issues: list[str] = []

    for start_idx, button_block in find_blocks(text, "button"):
        behavior_blocks = re.finditer(r"\bbehavior\s*\{(?P<body>.*?)\}", button_block, re.DOTALL)
        for behavior_match in behavior_blocks:
            body = behavior_match.group("body")
            action_match = re.search(r"\baction\s*:\s*([A-Za-z0-9_]+)", body)
            if not action_match:
                continue

            action_value = action_match.group(1)
            for rule in rules:
                if rule.get("severity") != "error":
                    continue
                if action_value != rule["when"].get("action"):
                    continue

                for forbidden_attr in rule["forbid"]:
                    if re.search(rf"\b{re.escape(forbidden_attr)}\s*:", body):
                        absolute_idx = start_idx + behavior_match.start()
                        issues.append(
                            f"{display_path(path)}:{line_no(text, absolute_idx)}: "
                            f"{rule['id']} {rule['message']}"
                        )
    return issues


def lint_chart_series_rules(path: Path) -> list[str]:
    """Validate chart series snippets for deterministic SQL and labeling rules."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    issues: list[str] = []

    for region_start, region_block in find_blocks(text, "region"):
        if not re.search(r"\btype\s*:\s*chart\b", region_block):
            continue

        region_match = re.search(r"^\s*region\s+([A-Za-z0-9_-]+)", region_block, re.MULTILINE)
        region_name = region_match.group(1) if region_match else "<unknown-region>"
        seen_sequences: dict[int, str] = {}

        for series_offset, series_block in find_blocks(region_block, "series"):
            series_match = re.search(r"^\s*series\s+([A-Za-z0-9_-]+)", series_block, re.MULTILINE)
            series_name = series_match.group(1) if series_match else "<unknown-series>"
            absolute_idx = region_start + series_offset

            execution_match = re.search(
                r"\bexecution\s*\{(?P<body>.*?)\}",
                series_block,
                re.DOTALL,
            )
            if not execution_match:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_idx)}: "
                    f"CHART_RULE_001 chart region '{region_name}' series '{series_name}' must define execution.sequence explicitly"
                )
                continue

            sequence_match = re.search(r"\bsequence\s*:\s*(\d+)\b", execution_match.group("body"))
            if not sequence_match:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_idx)}: "
                    f"CHART_RULE_002 chart region '{region_name}' series '{series_name}' execution block must include sequence: <positive integer>"
                )
                continue

            sequence = int(sequence_match.group(1))
            if sequence <= 0:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_idx)}: "
                    f"CHART_RULE_003 chart region '{region_name}' series '{series_name}' execution.sequence must be a positive integer"
                )
                continue

            if sequence in seen_sequences:
                issues.append(
                    f"{display_path(path)}:{line_no(text, absolute_idx)}: "
                    f"CHART_RULE_004 chart region '{region_name}' reuses execution.sequence {sequence} for series '{series_name}' and '{seen_sequences[sequence]}'"
                )
                continue

            seen_sequences[sequence] = series_name

    return issues


def run_validation_lint(paths: list[str], report_path: str = "") -> int:
    """Run validation skeleton linting and optionally write a JSON report."""
    targets = collect_targets(paths, (".apx", ".md"), warn_missing=True)
    if not targets:
        targets = sorted(VALIDATIONS_TEMPLATE_ROOT.glob("*.md"))

    issues: list[str] = []
    for target in targets:
        issues.extend(lint_validation_file(target))

    if report_path:
        resolved_report_path = Path(report_path).expanduser()
        if not resolved_report_path.is_absolute():
            resolved_report_path = (Path.cwd() / resolved_report_path).resolve()
        write_report(
            resolved_report_path,
            {
                "mode": "validations",
                "status": "fail" if issues else "pass",
                "targets": [display_path(target) for target in targets],
                "issues": [issue_to_record(issue) for issue in issues],
            },
        )

    if issues:
        print("VALIDATION_LINT_FAILED")
        for issue in issues:
            print(" -", issue)
        return 1

    print("VALIDATION_LINT_OK")
    return 0


def run_button_rule_lint(paths: list[str]) -> int:
    """Run button policy linting and print all discovered issues."""
    rules = load_component_policy_rules(scope="button.behavior")
    targets = collect_targets(paths, (".apx",))
    if not targets:
        targets = sorted((ROOT / "applications").rglob("*.apx"))

    issues: list[str] = []
    for target in targets:
        issues.extend(lint_button_rules(target, rules))

    if issues:
        print("APX_BUTTON_RULE_FAILED")
        for issue in issues:
            print(" -", issue)
        return 1

    print("APX_BUTTON_RULE_OK")
    return 0


def run_chart_rule_lint(paths: list[str]) -> int:
    """Run chart-series policy linting and print all discovered issues."""
    targets = collect_targets(paths, (".apx",))
    if not targets:
        targets = sorted((ROOT / "applications").rglob("*.apx"))

    issues: list[str] = []
    for target in targets:
        issues.extend(lint_chart_series_rules(target))

    if issues:
        print("APX_CHART_RULE_FAILED")
        for issue in issues:
            print(" -", issue)
        return 1

    print("APX_CHART_RULE_OK")
    return 0


def main(argv: list[str]) -> int:
    """Dispatch validation, button, or chart-series lint modes from CLI arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apx-button-rules", action="store_true", help="Lint APEX button behavior rules")
    parser.add_argument("--apx-chart-rules", action="store_true", help="Lint APEX chart series execution rules")
    parser.add_argument("--report-path", default=str(DEFAULT_REPORT), help="Optional JSON report output path.")
    parser.add_argument("paths", nargs="*", help="Files or directories to lint")
    args = parser.parse_args(argv)

    if args.apx_button_rules:
        return run_button_rule_lint(args.paths)
    if args.apx_chart_rules:
        return run_chart_rule_lint(args.paths)
    return run_validation_lint(args.paths, report_path=args.report_path)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
