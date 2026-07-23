#!/usr/bin/env python3
"""Regression tests for the paginated OCI Logging Search exporter."""

from __future__ import annotations

import argparse
import importlib.util
import json
import subprocess
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType
from typing import Dict, List, Optional, Tuple
from unittest import mock


SKILL_DIR = Path(__file__).resolve().parents[1]
SCRIPT_PATH = SKILL_DIR / "scripts" / "export_oci_logs.py"


def load_exporter() -> ModuleType:
    spec = importlib.util.spec_from_file_location("export_oci_logs", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load exporter module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


EXPORTER = load_exporter()


def make_args(output: Path) -> argparse.Namespace:
    return argparse.Namespace(
        profile="TEST",
        region="eu-frankfurt-1",
        search_query='search "scope" | sort by datetime asc',
        time_start=datetime(2026, 7, 1, tzinfo=timezone.utc),
        time_end=datetime(2026, 7, 2, tzinfo=timezone.utc),
        output=output,
        limit=1000,
        auth=None,
        config_file=None,
        oci_cli="oci",
    )


def flow_result(index: int, identifier: str) -> Dict:
    return {
        "data": {
            "datetime": 1782864000000 + index,
            "logContent": {
                "data": {
                    "action": "ACCEPT",
                    "destinationAddress": "192.0.2.20",
                    "sourceAddress": "192.0.2.10",
                },
                "id": identifier,
                "time": "2026-07-01T00:00:00Z",
                "type": "com.oraclecloud.vcn.flowlogs.DataEvent",
            },
        }
    }


class ExportTests(unittest.TestCase):
    def test_preserves_1000_results_with_only_490_unique_ids(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "flow-logs.json"
            records = [flow_result(i, f"{i % 490:08x}") for i in range(1000)]

            summary = EXPORTER.export_results(
                make_args(output),
                fetch_page=lambda page: (records, None),
                progress=lambda message: None,
            )

            payload = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(summary["resultCount"], 1000)
            self.assertEqual(len(payload["results"]), 1000)
            self.assertEqual(
                len({item["data"]["logContent"]["id"] for item in payload["results"]}),
                490,
            )

    def test_follows_every_page_token(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "pages.json"
            requested_pages: List[Optional[str]] = []
            pages = {
                None: ([flow_result(1, "same")], "page-2"),
                "page-2": ([flow_result(2, "same")], "page-3"),
                "page-3": ([flow_result(3, "same")], None),
            }

            def fetch(
                page: Optional[str],
            ) -> Tuple[List[Dict], Optional[str]]:
                requested_pages.append(page)
                return pages[page]

            summary = EXPORTER.export_results(
                make_args(output),
                fetch_page=fetch,
                progress=lambda message: None,
            )

            payload = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(requested_pages, [None, "page-2", "page-3"])
            self.assertEqual(summary["pagesFetched"], 3)
            self.assertEqual(summary["resultCount"], 3)
            self.assertEqual(len(payload["results"]), 3)

    def test_empty_export_is_complete(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "empty.json"
            summary = EXPORTER.export_results(
                make_args(output),
                fetch_page=lambda page: ([], None),
                progress=lambda message: None,
            )

            payload = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(payload["results"], [])
            self.assertTrue(summary["complete"])
            self.assertTrue(summary["empty"])
            self.assertEqual(summary["pagesFetched"], 1)

    def test_repeated_page_token_fails_without_replacing_output(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "existing.json"
            output.write_text("existing\n", encoding="utf-8")

            with self.assertRaisesRegex(RuntimeError, "repeated opc-next-page"):
                EXPORTER.export_results(
                    make_args(output),
                    fetch_page=lambda page: ([flow_result(1, "id")], "repeat"),
                    progress=lambda message: None,
                )

            self.assertEqual(output.read_text(encoding="utf-8"), "existing\n")
            self.assertEqual(
                list(Path(temp_dir).glob(".existing.json.*.tmp")),
                [],
            )

    def test_decode_page_rejects_malformed_results(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "data.results list"):
            EXPORTER.decode_page({"data": {"results": None}})

    def test_cli_failure_surfaces_stderr(self) -> None:
        args = make_args(Path("unused.json"))
        failed = subprocess.CalledProcessError(
            returncode=1,
            cmd=["oci"],
            stderr="NotAuthorizedOrNotFound",
        )
        with mock.patch.object(EXPORTER.subprocess, "run", side_effect=failed):
            with self.assertRaisesRegex(RuntimeError, "NotAuthorizedOrNotFound"):
                EXPORTER.make_oci_fetcher(args)(None)

    def test_page_token_is_forwarded_to_oci_cli(self) -> None:
        args = make_args(Path("unused.json"))
        response = subprocess.CompletedProcess(
            args=["oci"],
            returncode=0,
            stdout='{"data":{"results":[]},"opc-next-page":"next"}',
            stderr="",
        )
        with mock.patch.object(EXPORTER.subprocess, "run", return_value=response) as run:
            results, token = EXPORTER.make_oci_fetcher(args)("current")

        command = run.call_args.args[0]
        self.assertEqual(results, [])
        self.assertEqual(token, "next")
        self.assertIn("--page", command)
        self.assertEqual(command[command.index("--page") + 1], "current")

    def test_timestamp_requires_timezone(self) -> None:
        with self.assertRaises(argparse.ArgumentTypeError):
            EXPORTER.parse_utc("2026-07-01T00:00:00")


if __name__ == "__main__":
    unittest.main()
