#!/usr/bin/env python3
"""Generate OKE GVA Multus multihome test manifests."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Iterable


def emit_error(exit_code: int, error_code: str, message: str, remediation: str, docs_url: str = "") -> int:
    print(
        json.dumps(
            {
                "error_code": error_code,
                "message": message,
                "remediation": remediation,
                "docs_url": docs_url,
            }
        ),
        file=sys.stderr,
    )
    return exit_code


class JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise SystemExit(
            emit_error(
                2,
                "INVALID_ARGUMENT",
                message,
                "Run with --help to view usage.",
            )
        )


def q(value: str) -> str:
    return json.dumps(value)


def block_json(value: dict) -> str:
    text = json.dumps(value, indent=2)
    return "\n".join(f"    {line}" for line in text.splitlines())


def parse_pod(value: str) -> tuple[str, str]:
    if "=" not in value:
        raise argparse.ArgumentTypeError("pod must use NAME=NODE_NAME")
    name, node = value.split("=", 1)
    if not name or not node:
        raise argparse.ArgumentTypeError("pod must use NAME=NODE_NAME")
    return name, node


def emit(lines: Iterable[str]) -> None:
    sys.stdout.write("\n".join(lines))
    sys.stdout.write("\n")


def main() -> int:
    parser = JsonArgumentParser(
        description="Generate Multus NetworkAttachmentDefinitions and pinned test pods for OKE GVA multihome."
    )
    parser.add_argument("--namespace", default="gva-multihome-test")
    parser.add_argument("--default-nad-namespace", default="kube-system")
    parser.add_argument("--default-nad-name", default="gva-default-network")
    parser.add_argument("--secondary-nad-name", default="gva-secondary-network")
    parser.add_argument("--default-interface", default="enp1s0")
    parser.add_argument("--secondary-interface", default="enp2s0")
    parser.add_argument("--image", default="docker.io/nicolaka/netshoot:v0.13")
    parser.add_argument("--sleep", default="3600")
    parser.add_argument(
        "--pod",
        action="append",
        type=parse_pod,
        required=True,
        metavar="NAME=NODE_NAME",
        help="Add a pinned test pod. Repeat for multiple pods.",
    )
    args = parser.parse_args()

    default_config = {
        "name": args.default_nad_name,
        "cniVersion": "0.3.1",
        "plugins": [
            {
                "cniVersion": "0.3.1",
                "type": "oci-ipvlan",
                "mode": "l2",
                "ipam": {
                    "type": "oci-ipam",
                    "deviceSelector": {"interfaceName": args.default_interface},
                },
            },
            {
                "cniVersion": "0.3.1",
                "type": "oci-ptp",
                "containerInterface": "ptp-veth0",
                "mtu": 9000,
            },
        ],
    }

    secondary_config = {
        "cniVersion": "0.3.1",
        "plugins": [
            {
                "type": "ipvlan",
                "mode": "l2",
                "master": args.secondary_interface,
                "ipam": {
                    "type": "oci-ipam",
                    "deviceSelector": {"interfaceName": args.secondary_interface},
                },
            }
        ],
    }

    lines: list[str] = [
        "apiVersion: v1",
        "kind: Namespace",
        "metadata:",
        f"  name: {args.namespace}",
        "---",
        "apiVersion: k8s.cni.cncf.io/v1",
        "kind: NetworkAttachmentDefinition",
        "metadata:",
        f"  name: {args.default_nad_name}",
        f"  namespace: {args.default_nad_namespace}",
        "spec:",
        "  config: |",
        block_json(default_config),
        "---",
        "apiVersion: k8s.cni.cncf.io/v1",
        "kind: NetworkAttachmentDefinition",
        "metadata:",
        f"  name: {args.secondary_nad_name}",
        f"  namespace: {args.namespace}",
        "spec:",
        "  config: |",
        block_json(secondary_config),
    ]

    for pod_name, node_name in args.pod:
        lines.extend(
            [
                "---",
                "apiVersion: v1",
                "kind: Pod",
                "metadata:",
                f"  name: {pod_name}",
                f"  namespace: {args.namespace}",
                "  labels:",
                "    app: gva-multihome",
                "  annotations:",
                f"    v1.multus-cni.io/default-network: {args.default_nad_namespace}/{args.default_nad_name}",
                f"    k8s.v1.cni.cncf.io/networks: {args.namespace}/{args.secondary_nad_name}",
                "spec:",
                f"  nodeName: {q(node_name)}",
                "  containers:",
                "    - name: netshoot",
                f"      image: {q(args.image)}",
                "      command:",
                "        - sleep",
                f"        - {q(args.sleep)}",
            ]
        )

    emit(lines)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        raise SystemExit(1)
    except Exception as exc:
        raise SystemExit(
            emit_error(
                2,
                "UNEXPECTED_ERROR",
                str(exc),
                "Inspect the input arguments and rerun the manifest generator.",
            )
        )
