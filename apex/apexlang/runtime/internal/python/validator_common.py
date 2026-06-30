"""Shared helpers for APEXlang validator scripts.

The validators are intentionally small command-line programs with stable JSON
report shapes. This module centralizes the repeated filesystem and issue parsing
helpers so each validator can focus on its domain-specific linting rules.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

def _has_source_repo_markers(target: Path) -> bool:
    """Return true when a directory looks like the source repository root."""
    return (target / "package.json").exists() and (target / "skills" / "apexlang" / "assets" / "public-package.manifest.json").exists()


def _has_packaged_skill_markers(target: Path) -> bool:
    """Return true when a directory looks like an installed public skill package."""
    return (target / "SKILL.md").exists() and (target / "manifest.json").exists() and (target / "tools").exists()


def _resolve_root(start: Path) -> Path:
    """Resolve the active source or packaged root from a starting directory."""
    override = os.environ.get("APEXLANG_PACKAGE_ROOT", "").strip()
    if override:
        return Path(override).resolve()
    current = start.resolve()
    while True:
        if _has_source_repo_markers(current) or _has_packaged_skill_markers(current):
            return current
        parent = current.parent
        if parent == current:
            break
        current = parent
    return Path(__file__).resolve().parents[5]


def _resolve_output_root(root: Path, packaged_skill: bool) -> Path:
    """Resolve where validator reports and logs should be written."""
    if packaged_skill:
        override = os.environ.get("APEXLANG_OUTPUT_ROOT", "").strip()
        if not override:
            raise RuntimeError("APEXLANG_OUTPUT_ROOT is required in packaged apexlang runtime")
        return Path(override).resolve()
    return root / "artifacts" / "apexlang"


ROOT = _resolve_root(Path(__file__).resolve().parent)
PACKAGED_SKILL = _has_packaged_skill_markers(ROOT)
OUTPUT_ROOT = _resolve_output_root(ROOT, PACKAGED_SKILL)
LOG_ROOT = OUTPUT_ROOT / "logs"
COMPONENT_ATTRIBUTES_PATH = ROOT / "assets/component-attributes.json" if PACKAGED_SKILL else ROOT / "assets/component-attributes.json"
COMPONENT_POLICIES_PATH = ROOT / "assets/component-policies.json" if PACKAGED_SKILL else ROOT / "assets/component-policies.json"
VALIDATIONS_TEMPLATE_ROOT = ROOT / "templates/business-logic/validations" if PACKAGED_SKILL else ROOT / "templates/business-logic/validations"
QUERY_VALID_PROPS_TOOL = ROOT / "tools/query-valid-props.mjs" if PACKAGED_SKILL else ROOT / "references/policies/apexlang/compiler-prop-map/query-valid-props.mjs"
ISSUE_PATTERN = re.compile(r"^(?P<file>.+?):(?P<line>\d+): (?P<rule>[A-Z0-9_]+) (?P<message>.+)$")
_RUNTIME_COMPONENT_MAP_CACHE: dict[str, Any] | None = None


def write_report(path: Path, payload: dict[str, Any]) -> None:
    """Write a formatted JSON report, creating its parent directory first."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def issue_to_record(issue: str) -> dict[str, Any]:
    """Convert a validator issue string into the canonical report record."""
    match = ISSUE_PATTERN.match(issue)
    if not match:
        return {
            "file": "",
            "line": 0,
            "rule": "UNKNOWN",
            "message": issue,
            "raw": issue,
        }
    return {
        "file": match.group("file"),
        "line": int(match.group("line")),
        "rule": match.group("rule"),
        "message": match.group("message"),
        "raw": issue,
    }


def collect_targets(paths: list[str], suffixes: tuple[str, ...], warn_missing: bool = False) -> list[Path]:
    """Return matching files from explicit files or recursive directories."""
    targets: list[Path] = []
    if paths:
        for raw in paths:
            path = Path(raw)
            if path.is_dir():
                for suffix in suffixes:
                    targets.extend(sorted(path.rglob(f"*{suffix}")))
            elif path.exists() and path.suffix.lower() in suffixes:
                targets.append(path)
            elif warn_missing and not path.exists():
                print(f"warning: {raw} not found", file=sys.stderr)
    return sorted(set(targets))


def display_path(path: Path) -> str:
    """Render paths relative to the repository when possible."""
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def line_no(text: str, idx: int) -> int:
    """Return the 1-based line number for a character offset."""
    return text.count("\n", 0, idx) + 1


def load_runtime_component_map() -> dict[str, Any] | None:
    """Load normalized compiler metadata from the runtime-backed query tool."""
    global _RUNTIME_COMPONENT_MAP_CACHE
    if _RUNTIME_COMPONENT_MAP_CACHE is not None:
        return _RUNTIME_COMPONENT_MAP_CACHE
    if not QUERY_VALID_PROPS_TOOL.exists():
        _RUNTIME_COMPONENT_MAP_CACHE = None
        return None

    command = ["node", str(QUERY_VALID_PROPS_TOOL), "--dump-json"]
    env = os.environ.copy()
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True, env=env)
    except Exception:
        _RUNTIME_COMPONENT_MAP_CACHE = None
        return None

    try:
        payload = json.loads(result.stdout)
    except Exception:
        _RUNTIME_COMPONENT_MAP_CACHE = None
        return None

    if not isinstance(payload, dict) or not isinstance(payload.get("componentTypes"), list):
        _RUNTIME_COMPONENT_MAP_CACHE = None
        return None

    _RUNTIME_COMPONENT_MAP_CACHE = payload
    return payload
