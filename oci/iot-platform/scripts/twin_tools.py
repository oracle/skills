#!/usr/bin/env python3
"""Utility helpers for OCI IoT digital twin JSON workflows."""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="OCI IoT twin JSON utilities")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_last = subparsers.add_parser("last-known", help="Find latest observation")
    p_last.add_argument("--input", required=True, help="Input JSON file path")
    p_last.add_argument("--device-key", default=None, help="Key with device ID")
    p_last.add_argument("--device-id", default=None, help="Filter by device ID")
    p_last.add_argument(
        "--timestamp-key",
        default="timestamp",
        help="Timestamp key path (supports dot notation)",
    )
    p_last.add_argument(
        "--value-key",
        default=None,
        help="Value key path to highlight (supports dot notation)",
    )

    p_offline = subparsers.add_parser("offline", help="List offline devices")
    p_offline.add_argument("--input", required=True, help="Input JSON file path")
    p_offline.add_argument(
        "--device-key",
        default="deviceId",
        help="Key containing device identifier",
    )
    p_offline.add_argument(
        "--timestamp-key",
        default="lastSeen",
        help="Timestamp key path (supports dot notation)",
    )
    p_offline.add_argument(
        "--threshold-minutes",
        type=float,
        required=True,
        help="Offline threshold in minutes",
    )
    p_offline.add_argument(
        "--now",
        default=None,
        help="Reference UTC time (ISO8601). Defaults to current UTC.",
    )

    p_template = subparsers.add_parser(
        "telemetry-template", help="Generate telemetry payload JSON"
    )
    p_template.add_argument("--device-id", required=True, help="Device identifier")
    p_template.add_argument("--twin-id", required=True, help="Twin identifier")
    p_template.add_argument(
        "--metric",
        action="append",
        default=[],
        help="Metric key=value pair; can be repeated",
    )
    p_template.add_argument(
        "--output", default=None, help="Optional output file path for JSON"
    )

    return parser.parse_args()


def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def iter_records(payload: Any) -> Iterable[Dict[str, Any]]:
    if isinstance(payload, list):
        for item in payload:
            if isinstance(item, dict):
                yield item
        return
    if isinstance(payload, dict):
        yield payload
        for key in ("data", "items", "records"):
            value = payload.get(key)
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        yield item


def get_key_path(data: Dict[str, Any], path: Optional[str]) -> Any:
    if not path:
        return None
    current: Any = data
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        if part not in current:
            return None
        current = current[part]
    return current


def parse_time(value: Any) -> Optional[datetime]:
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = value.strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def cmd_last_known(args: argparse.Namespace) -> int:
    payload = load_json(args.input)
    latest: Optional[Dict[str, Any]] = None
    latest_dt: Optional[datetime] = None
    for record in iter_records(payload):
        if args.device_key and args.device_id:
            if str(get_key_path(record, args.device_key)) != args.device_id:
                continue
        dt = parse_time(get_key_path(record, args.timestamp_key))
        if dt is None:
            continue
        if latest_dt is None or dt > latest_dt:
            latest_dt = dt
            latest = record

    if latest is None:
        print(
            json.dumps(
                {"error": "No record matched filter or timestamp was unparsable"},
                indent=2,
            )
        )
        return 1

    result: Dict[str, Any] = {
        "latest_timestamp": latest_dt.isoformat() if latest_dt else None,
        "record": latest,
    }
    if args.value_key:
        result["selected_value"] = get_key_path(latest, args.value_key)

    print(json.dumps(result, indent=2))
    return 0


def cmd_offline(args: argparse.Namespace) -> int:
    payload = load_json(args.input)
    now = parse_time(args.now) if args.now else datetime.now(timezone.utc)
    if now is None:
        raise SystemExit("--now must be ISO8601")
    threshold_seconds = args.threshold_minutes * 60.0
    latest_by_device: Dict[str, datetime] = {}

    for record in iter_records(payload):
        device_id = get_key_path(record, args.device_key)
        last_seen_raw = get_key_path(record, args.timestamp_key)
        last_seen = parse_time(last_seen_raw)
        if device_id is None or last_seen is None:
            continue
        device_key = str(device_id)
        existing = latest_by_device.get(device_key)
        if existing is None or last_seen > existing:
            latest_by_device[device_key] = last_seen

    offline_devices: List[Dict[str, Any]] = []
    for device_key, last_seen in latest_by_device.items():
        age_seconds = (now - last_seen).total_seconds()
        if age_seconds >= threshold_seconds:
            offline_devices.append(
                {
                    "device_id": device_key,
                    "last_seen": last_seen.isoformat(),
                    "minutes_since_seen": round(age_seconds / 60.0, 2),
                }
            )

    result = {
        "evaluated_at": now.isoformat(),
        "threshold_minutes": args.threshold_minutes,
        "offline_count": len(offline_devices),
        "offline_devices": offline_devices,
    }
    print(json.dumps(result, indent=2))
    return 0


def parse_metric(items: List[str]) -> Dict[str, Any]:
    metrics: Dict[str, Any] = {}
    for item in items:
        if "=" not in item:
            raise SystemExit(f"Invalid metric '{item}'. Expected key=value.")
        key, raw = item.split("=", 1)
        key = key.strip()
        raw = raw.strip()
        if not key:
            raise SystemExit("Metric key cannot be empty.")
        try:
            if "." in raw:
                value: Any = float(raw)
            else:
                value = int(raw)
        except ValueError:
            value = raw
        metrics[key] = value
    return metrics


def cmd_telemetry_template(args: argparse.Namespace) -> int:
    payload = {
        "deviceId": args.device_id,
        "digitalTwinId": args.twin_id,
        "observedAt": datetime.now(timezone.utc).isoformat(),
        "metrics": parse_metric(args.metric),
    }
    rendered = json.dumps(payload, indent=2)
    if args.output:
        out_path = Path(args.output)
        out_path.write_text(rendered + "\n", encoding="utf-8")
        print(f"Wrote {out_path}")
    else:
        print(rendered)
    return 0


def main() -> int:
    args = parse_args()
    if args.command == "last-known":
        return cmd_last_known(args)
    if args.command == "offline":
        return cmd_offline(args)
    if args.command == "telemetry-template":
        return cmd_telemetry_template(args)
    raise SystemExit(f"Unknown command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
