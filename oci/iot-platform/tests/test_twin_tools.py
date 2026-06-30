#!/usr/bin/env python3
"""Behavior tests for the bundled OCI IoT JSON helpers."""

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT_DIR / "scripts" / "twin_tools.py"
SPEC = importlib.util.spec_from_file_location("twin_tools", SCRIPT_PATH)
assert SPEC and SPEC.loader
twin_tools = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(twin_tools)


class IterRecordsTests(unittest.TestCase):
    def test_unwrapped_record_is_returned_once(self) -> None:
        record = {"deviceId": "sensor-1", "lastSeen": "2026-06-27T12:00:00Z"}

        self.assertEqual(list(twin_tools.iter_records(record)), [record])

    def test_data_object_is_unwrapped(self) -> None:
        record = {
            "_metadata": {"timeLastHeard": "2026-06-27T12:00:00Z"},
            "temperature": 23.5,
        }

        self.assertEqual(list(twin_tools.iter_records({"data": record})), [record])

    def test_top_level_items_are_unwrapped(self) -> None:
        records = [{"deviceId": "sensor-1"}, {"deviceId": "sensor-2"}]

        self.assertEqual(list(twin_tools.iter_records({"items": records})), records)

    def test_nested_data_items_are_unwrapped(self) -> None:
        records = [{"deviceId": "sensor-1"}, {"deviceId": "sensor-2"}]

        self.assertEqual(
            list(twin_tools.iter_records({"data": {"items": records}})),
            records,
        )


class CommandTests(unittest.TestCase):
    def test_last_known_reads_wrapped_get_content_output(self) -> None:
        payload = {
            "data": {
                "_metadata": {"timeLastHeard": "2026-06-27T12:00:00Z"},
                "temperature": 23.5,
            }
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            input_path = Path(temp_dir) / "content.json"
            input_path.write_text(json.dumps(payload), encoding="utf-8")
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_PATH),
                    "last-known",
                    "--input",
                    str(input_path),
                    "--timestamp-key",
                    "_metadata.timeLastHeard",
                ],
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        rendered = json.loads(result.stdout)
        self.assertEqual(rendered["latest_timestamp"], "2026-06-27T12:00:00+00:00")
        self.assertEqual(rendered["record"]["temperature"], 23.5)


if __name__ == "__main__":
    unittest.main()
