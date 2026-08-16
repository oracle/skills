#!/usr/bin/env python3
"""Export complete OCI Logging Search results by following native page tokens."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Optional, Set, Tuple


Result = Dict[str, Any]
FetchPage = Callable[[Optional[str]], Tuple[List[Result], Optional[str]]]


def parse_utc(value: str) -> datetime:
    """Parse an RFC 3339 timestamp and normalize it to UTC."""
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"Invalid RFC 3339 timestamp: {value}") from exc
    if parsed.tzinfo is None:
        raise argparse.ArgumentTypeError(
            "Timestamp must include Z or an explicit UTC offset"
        )
    return parsed.astimezone(timezone.utc)


def oci_timestamp(value: datetime) -> str:
    """Format a datetime as an RFC 3339 UTC timestamp for OCI CLI."""
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def result_timestamp(result: Result) -> Any:
    """Return a useful timestamp without requiring a log-type-specific schema."""
    data = result.get("data")
    if not isinstance(data, dict):
        return None
    if data.get("datetime") is not None:
        return data["datetime"]

    log_content = data.get("logContent")
    if not isinstance(log_content, dict):
        return None
    if log_content.get("time") is not None:
        return log_content["time"]

    payload = log_content.get("data")
    if isinstance(payload, dict):
        return payload.get("timestamp")
    return None


def decode_page(response: Any) -> Tuple[List[Result], Optional[str]]:
    """Validate one OCI CLI response and return results plus its next-page token."""
    if not isinstance(response, dict):
        raise RuntimeError("OCI response is not a JSON object")

    body = response.get("data", response)
    if not isinstance(body, dict):
        raise RuntimeError("OCI response does not contain a data object")

    results = body.get("results")
    if not isinstance(results, list):
        raise RuntimeError("OCI response does not contain a data.results list")
    if not all(isinstance(result, dict) for result in results):
        raise RuntimeError("OCI response contains a non-object search result")

    next_page = response.get("opc-next-page")
    if next_page is not None and (
        not isinstance(next_page, str) or not next_page.strip()
    ):
        raise RuntimeError("OCI response contains an invalid opc-next-page token")
    return results, next_page


def make_oci_fetcher(args: argparse.Namespace) -> FetchPage:
    """Build a function that submits one page of an OCI Logging Search."""

    def fetch_page(page: Optional[str]) -> Tuple[List[Result], Optional[str]]:
        command = [
            args.oci_cli,
            "logging-search",
            "search-logs",
            "--profile",
            args.profile,
            "--region",
            args.region,
            "--search-query",
            args.search_query,
            "--time-start",
            oci_timestamp(args.time_start),
            "--time-end",
            oci_timestamp(args.time_end),
            "--limit",
            str(args.limit),
            "--output",
            "json",
        ]
        if page is not None:
            command.extend(["--page", page])
        if args.auth:
            command.extend(["--auth", args.auth])
        if args.config_file:
            command.extend(["--config-file", args.config_file])

        try:
            completed = subprocess.run(
                command,
                check=True,
                capture_output=True,
                text=True,
            )
        except FileNotFoundError as exc:
            raise RuntimeError(f"OCI CLI executable not found: {args.oci_cli}") from exc
        except subprocess.CalledProcessError as exc:
            stderr = (exc.stderr or "").strip()
            raise RuntimeError(
                f"OCI CLI failed with exit code {exc.returncode}: "
                f"{stderr or 'no stderr returned'}"
            ) from exc

        try:
            response = json.loads(completed.stdout)
        except json.JSONDecodeError as exc:
            raise RuntimeError("OCI CLI returned invalid JSON") from exc
        return decode_page(response)

    return fetch_page


def write_result(
    stream: Any,
    result: Result,
    *,
    first: bool,
) -> None:
    """Write one result to the open JSON array."""
    if not first:
        stream.write(",")
    stream.write("\n    ")
    json.dump(
        result,
        stream,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )


def export_results(
    args: argparse.Namespace,
    *,
    fetch_page: FetchPage | None = None,
    progress: Callable[[str], None] | None = None,
) -> Dict[str, Any]:
    """Fetch every page and atomically write a complete JSON export."""
    if args.time_start >= args.time_end:
        raise ValueError("--time-start must be earlier than --time-end")
    if args.limit <= 0:
        raise ValueError("--limit must be positive")

    output = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    fetch = fetch_page or make_oci_fetcher(args)
    progress = progress or (lambda message: print(message, file=sys.stderr, flush=True))

    page_count = 0
    result_count = 0
    first_timestamp: Any = None
    last_timestamp: Any = None
    next_page: Optional[str] = None
    seen_tokens: Set[str] = set()
    temporary_path: Optional[Path] = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=output.parent,
            prefix=f".{output.name}.",
            suffix=".tmp",
            delete=False,
        ) as stream:
            temporary_path = Path(stream.name)
            stream.write('{\n  "results": [')
            first_result = True

            while True:
                page_count += 1
                progress(f"Fetching page {page_count}")
                results, returned_token = fetch(next_page)

                for result in results:
                    write_result(stream, result, first=first_result)
                    first_result = False
                    timestamp = result_timestamp(result)
                    if first_timestamp is None and timestamp is not None:
                        first_timestamp = timestamp
                    if timestamp is not None:
                        last_timestamp = timestamp
                    result_count += 1

                if returned_token is None:
                    break
                if returned_token in seen_tokens:
                    raise RuntimeError("OCI returned a repeated opc-next-page token")
                seen_tokens.add(returned_token)
                next_page = returned_token

            if not first_result:
                stream.write("\n  ")
            stream.write("],\n")

            summary = {
                "complete": True,
                "empty": result_count == 0,
                "firstResultTimestamp": first_timestamp,
                "lastResultTimestamp": last_timestamp,
                "pagesFetched": page_count,
                "profile": args.profile,
                "region": args.region,
                "responseLimit": args.limit,
                "resultCount": result_count,
                "searchQuery": args.search_query,
                "timeEnd": oci_timestamp(args.time_end),
                "timeStart": oci_timestamp(args.time_start),
            }
            stream.write('  "summary": ')
            rendered_summary = json.dumps(
                summary,
                ensure_ascii=False,
                indent=2,
                sort_keys=True,
            ).replace("\n", "\n  ")
            stream.write(rendered_summary)
            stream.write("\n}\n")
            stream.flush()
            os.fsync(stream.fileno())

        os.replace(temporary_path, output)
        temporary_path = None
        return summary
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Export every page of an OCI Logging Search to JSON."
    )
    parser.add_argument("--profile", required=True, help="OCI CLI profile name")
    parser.add_argument("--region", required=True, help="OCI region")
    parser.add_argument("--search-query", required=True, help="OCI Logging Search query")
    parser.add_argument(
        "--time-start",
        required=True,
        type=parse_utc,
        help="RFC 3339 start time",
    )
    parser.add_argument(
        "--time-end",
        required=True,
        type=parse_utc,
        help="RFC 3339 end time",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Destination JSON file",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=1000,
        help="Results requested per page (default: 1000)",
    )
    parser.add_argument("--auth", help="Optional OCI CLI authentication mode")
    parser.add_argument("--config-file", help="Optional OCI CLI config file")
    parser.add_argument(
        "--oci-cli",
        default="oci",
        help="OCI CLI executable (default: oci)",
    )
    return parser


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        summary = export_results(args)
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(summary, ensure_ascii=False, sort_keys=True), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
