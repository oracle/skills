#!/usr/bin/env python3
"""Canonical whitespace formatter for the line-oriented APEXlang DSL."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


PROPERTY_START = re.compile(r"(?<=\s)(?=[A-Za-z][A-Za-z0-9]*\s*:)")
DECLARATION_START = re.compile(r"^[A-Za-z][A-Za-z0-9]*\b")


def collect_apx_files(root: Path) -> list[Path]:
    if root.is_file():
        return [root] if root.suffix == ".apx" else []
    return sorted(path for path in root.rglob("*.apx") if "apex-exports" not in path.parts)


def structural_tokens(text: str) -> list[str]:
    """Split structural delimiters while leaving quoted/fenced values untouched."""
    tokens: list[str] = []
    current: list[str] = []
    quoted = False
    escaped = False
    for char in text:
        if char == '"' and not escaped:
            quoted = not quoted
        if not quoted and char in "(){}":
            if "".join(current).strip():
                tokens.append("".join(current).strip())
            tokens.append(char)
            current = []
        else:
            current.append(char)
        escaped = char == "\\" and not escaped
        if char != "\\":
            escaped = False
    if "".join(current).strip():
        tokens.append("".join(current).strip())
    return tokens


def split_properties(token: str) -> list[str]:
    if not token or token.startswith("```") or "sqlQuery:" in token or "plsql" in token:
        return [token]
    parts = [part.strip() for part in PROPERTY_START.split(token) if part.strip()]
    return parts or [token]


def shape_fingerprint(text: str) -> tuple[str, ...]:
    """Capture line-level structure while ignoring indentation and whitespace."""
    fingerprint: list[str] = []
    in_fence = False
    for line in text.replace("\r\n", "\n").replace("\r", "\n").splitlines():
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
        if not stripped or in_fence:
            fingerprint.append("fence-or-blank" if in_fence else "blank")
            continue
        fingerprint.append(re.sub(r"\s+", " ", stripped))
    return tuple(fingerprint)


def structural_violations(text: str) -> list[str]:
    """Reject structures that the canonical renderer must never emit."""
    violations: list[str] = []
    in_fence = False
    for line_number, line in enumerate(text.replace("\r\n", "\n").replace("\r", "\n").splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if not stripped or in_fence:
            continue
        if "{" in stripped or "(" in stripped:
            for opener in ("{", "("):
                if opener in stripped:
                    # Parentheses and braces in a property value (for example a
                    # PL/SQL expression) are not APEXlang structural blocks.
                    # Only validate declaration/block openers here.
                    if ":" in stripped[:stripped.index(opener)]:
                        continue
                    tail = stripped[stripped.index(opener) + 1:].strip()
                    if tail or ("}" in stripped or ")" in stripped):
                        violations.append(f"line {line_number}: structural block must be multiline and opening delimiter must end its line")
                        break
        assignments = re.findall(r"\b[A-Za-z][A-Za-z0-9]*\s*:", stripped)
        if len(assignments) > 1 and "sqlQuery:" not in stripped and "plsql" not in stripped:
            violations.append(f"line {line_number}: properties must occupy separate lines")
    return violations


def format_text(text: str) -> tuple[str, bool, list[str]]:
    original_text = text
    if "\r" in text:
        text = text.replace("\r\n", "\n").replace("\r", "\n")
    findings: list[str] = []
    output: list[str] = []
    indent = 0
    bracket_indent = 0
    in_fence = False
    trailing_newlines = max(1, len(text) - len(text.rstrip("\n")))

    for original in text.splitlines():
        stripped = original.strip()
        if not stripped:
            if output and output[-1] != "":
                output.append("")
            continue
        if stripped.startswith("```"):
            in_fence = not in_fence
            output.append(original.rstrip())
            continue
        if in_fence:
            output.append(original.rstrip())
            continue
        prefix = re.split(r"[({]", stripped, maxsplit=1)[0]
        if ":" in prefix and not re.match(r"^[A-Za-z][A-Za-z0-9]*\s*:\s*\{", stripped):
            output.append(original.rstrip())
            bracket_indent += stripped.count("[") - stripped.count("]")
            continue

        tokens = structural_tokens(stripped)
        expanded: list[str] = []
        for token in tokens:
            expanded.extend(split_properties(token))
        for index, token in enumerate(expanded):
            if token.startswith("]"):
                bracket_indent = max(0, bracket_indent - 1)
            if token == "}":
                indent = max(0, indent - 1)
            elif token == ")":
                indent = max(0, indent - 1)
            if token == "(":
                if output and DECLARATION_START.match(output[-1].strip()):
                    output[-1] = output[-1].rstrip() + " ("
                else:
                    output.append("    " * (indent + bracket_indent) + token)
                indent += 1
            elif token == "{":
                if output and ":" in output[-1]:
                    match = re.match(r"^(?P<value>.*:\s+.+)\s+(?P<block>[A-Za-z][A-Za-z0-9]*)$", output[-1])
                    if match:
                        output[-1] = match.group("value")
                        output.append("    " * (indent + bracket_indent) + match.group("block"))
                if output:
                    output[-1] = output[-1].rstrip() + " {"
                else:
                    output.append("    " * (indent + bracket_indent) + token)
                indent += 1
            elif token in {"}", ")"}:
                output.append("    " * (indent + bracket_indent) + token)
            else:
                output.append("    " * (indent + bracket_indent) + token)
            bracket_delta = token.count("[") - token.count("]")
            if bracket_delta > 0:
                bracket_indent += bracket_delta

    while output and output[-1] == "":
        output.pop()
    formatted = "\n".join(output) + "\n" * trailing_newlines
    changed = formatted != original_text
    return formatted, changed, findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--strict-structure", action="store_true")
    parser.add_argument("--report-path", type=Path)
    args = parser.parse_args()

    files = collect_apx_files(args.root)
    report = {"status": "ok", "files": [], "changed_files": 0, "findings": []}
    for path in files:
        with path.open("r", encoding="utf-8", newline="") as stream:
            original = stream.read()
        original_shape = shape_fingerprint(original)
        formatted, changed, findings = format_text(original)
        formatted_shape = shape_fingerprint(formatted)
        violations = structural_violations(formatted)
        structural_changed = original_shape != formatted_shape
        if args.strict_structure and structural_changed:
            report["status"] = "structural_change_rejected"
            report["findings"].append({"path": str(path), "finding": "formatter would change structural shape"})
        if violations:
            report["status"] = "invalid_structure"
            report["findings"].extend({"path": str(path), "finding": violation} for violation in violations)
        if changed and not args.check and not (args.strict_structure and structural_changed):
            with path.open("w", encoding="utf-8", newline="\n") as stream:
                stream.write(formatted)
        if changed:
            report["changed_files"] += 1
            report["files"].append(str(path))
        report["findings"].extend({"path": str(path), "finding": finding} for finding in findings)

    if args.check and report["changed_files"] and report["status"] == "ok":
        report["status"] = "needs_formatting"
    if args.report_path:
        args.report_path.parent.mkdir(parents=True, exist_ok=True)
        args.report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 1 if report["status"] != "ok" else 0


if __name__ == "__main__":
    sys.exit(main())
