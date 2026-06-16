#!/usr/bin/env python3
"""Discover OKE cluster, node pool, and subnet data for Multus multihome setup."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from typing import Any


CLUSTER_OCID_RE = re.compile(r"ocid1\.cluster\.[^\s\"']+")
SUBNET_OCID_RE = re.compile(r"ocid1\.subnet\.[^\s\"']+")


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


def run_json(cmd: list[str], env: dict[str, str]) -> dict[str, Any]:
    result = subprocess.run(cmd, env=env, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(
            "command failed: {}\nstdout:\n{}\nstderr:\n{}".format(
                " ".join(cmd), result.stdout.strip(), result.stderr.strip()
            )
        )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"command did not return JSON: {' '.join(cmd)}") from exc


def run_text(cmd: list[str], env: dict[str, str]) -> str:
    result = subprocess.run(cmd, env=env, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(
            "command failed: {}\nstdout:\n{}\nstderr:\n{}".format(
                " ".join(cmd), result.stdout.strip(), result.stderr.strip()
            )
        )
    return result.stdout


def oci_base(args: argparse.Namespace) -> list[str]:
    cmd = ["oci"]
    if args.profile:
        cmd.extend(["--profile", args.profile])
    if args.auth:
        cmd.extend(["--auth", args.auth])
    return cmd


def with_region(cmd: list[str], region: str | None) -> list[str]:
    if region:
        return [*cmd, "--region", region]
    return cmd


def first_ocid(value: Any, regex: re.Pattern[str]) -> str | None:
    text = json.dumps(value)
    match = regex.search(text)
    return match.group(0) if match else None


def cluster_id_from_kubeconfig(context: str | None, env: dict[str, str]) -> str | None:
    try:
        config = run_json(["kubectl", "config", "view", "--raw", "-o", "json"], env)
    except Exception:
        return None

    selected = context or config.get("current-context")
    if not selected:
        return first_ocid(config, CLUSTER_OCID_RE)

    contexts = {
        item.get("name"): item.get("context", {})
        for item in config.get("contexts", [])
        if isinstance(item, dict)
    }
    ctx = contexts.get(selected, {})
    related_names = {selected, ctx.get("cluster"), ctx.get("user")}
    related = []
    for section in ("contexts", "clusters", "users"):
        for item in config.get(section, []):
            if item.get("name") in related_names:
                related.append(item)
    return first_ocid(related or config, CLUSTER_OCID_RE)


def cluster_id_from_name(args: argparse.Namespace, env: dict[str, str]) -> str | None:
    if not args.cluster_name or not args.compartment_id:
        return None
    cmd = with_region(
        [
            *oci_base(args),
            "ce",
            "cluster",
            "list",
            "--compartment-id",
            args.compartment_id,
            "--name",
            args.cluster_name,
        ],
        args.region,
    )
    data = run_json(cmd, env).get("data", [])
    if not data:
        return None
    if len(data) > 1:
        raise RuntimeError(f"multiple clusters named {args.cluster_name!r}; pass --cluster-id")
    return data[0].get("id")


def get_cluster(args: argparse.Namespace, cluster_id: str, env: dict[str, str]) -> dict[str, Any]:
    cmd = with_region([*oci_base(args), "ce", "cluster", "get", "--cluster-id", cluster_id], args.region)
    return run_json(cmd, env)["data"]


def list_node_pools(args: argparse.Namespace, cluster: dict[str, Any], env: dict[str, str]) -> list[dict[str, Any]]:
    compartment_id = args.compartment_id or cluster.get("compartment-id")
    if not compartment_id:
        raise RuntimeError("missing compartment id; pass --compartment-id")
    cmd = with_region(
        [
            *oci_base(args),
            "ce",
            "node-pool",
            "list",
            "--compartment-id",
            compartment_id,
            "--cluster-id",
            cluster["id"],
            "--all",
        ],
        args.region,
    )
    pools = run_json(cmd, env).get("data", [])
    full = []
    for pool in pools:
        pool_id = pool.get("id")
        if not pool_id:
            continue
        get_cmd = with_region([*oci_base(args), "ce", "node-pool", "get", "--node-pool-id", pool_id], args.region)
        full.append(run_json(get_cmd, env)["data"])
    return full


def collect_subnet_ids(cluster: dict[str, Any], pools: list[dict[str, Any]]) -> list[str]:
    ids: set[str] = set()
    for ocid in re.findall(SUBNET_OCID_RE, json.dumps(cluster)):
        ids.add(ocid)
    for pool in pools:
        for ocid in re.findall(SUBNET_OCID_RE, json.dumps(pool)):
            ids.add(ocid)
    return sorted(ids)


def get_subnets(args: argparse.Namespace, subnet_ids: list[str], env: dict[str, str]) -> dict[str, dict[str, Any]]:
    subnets = {}
    for subnet_id in subnet_ids:
        cmd = with_region([*oci_base(args), "network", "subnet", "get", "--subnet-id", subnet_id], args.region)
        subnets[subnet_id] = run_json(cmd, env)["data"]
    return subnets


def subnet_summary(subnet: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": subnet.get("id"),
        "displayName": subnet.get("display-name"),
        "cidrBlock": subnet.get("cidr-block"),
        "dnsLabel": subnet.get("dns-label"),
        "vcnId": subnet.get("vcn-id"),
        "availabilityDomain": subnet.get("availability-domain"),
        "prohibitPublicIpOnVnic": subnet.get("prohibit-public-ip-on-vnic"),
    }


def node_pool_summary(pool: dict[str, Any], subnets: dict[str, dict[str, Any]]) -> dict[str, Any]:
    placement_configs = pool.get("placement-configs") or []
    secondary_vnics = pool.get("secondary-vnics") or []
    return {
        "id": pool.get("id"),
        "name": pool.get("name"),
        "kubernetesVersion": pool.get("kubernetes-version"),
        "nodeShape": pool.get("node-shape"),
        "size": pool.get("size"),
        "placementSubnets": [
            {
                "availabilityDomain": pc.get("availability-domain"),
                "subnetId": pc.get("subnet-id"),
                "subnet": subnet_summary(subnets[pc["subnet-id"]]) if pc.get("subnet-id") in subnets else None,
            }
            for pc in placement_configs
        ],
        "secondaryVnics": [
            {
                "displayName": item.get("display-name"),
                "attachmentDisplayName": item.get("attachment-display-name"),
                "subnetId": item.get("subnet-id"),
                "subnet": subnet_summary(subnets[item["subnet-id"]]) if item.get("subnet-id") in subnets else None,
                "ipCount": item.get("ip-count"),
                "nicIndex": item.get("nic-index"),
                "applicationResource": item.get("application-resource"),
                "nsgIds": item.get("nsg-ids") or [],
            }
            for item in secondary_vnics
        ],
    }


def suggested_generator_args(pools: list[dict[str, Any]]) -> list[str]:
    args = [
        "python3",
        "<skill>/scripts/generate-multihome-manifest.py",
        "--default-interface",
        "enp1s0",
        "--secondary-interface",
        "enp2s0",
    ]
    node_names: list[str] = []
    for pool in pools:
        for node in pool.get("nodes") or []:
            name = node.get("name") or node.get("private-ip")
            if name and name not in node_names:
                node_names.append(name)
    for index, node_name in enumerate(node_names[:2], start=1):
        args.extend(["--pod", f"gva-multihome-{index}={node_name}"])
    return args


def main() -> int:
    parser = JsonArgumentParser(
        description="Discover OKE cluster node pools, placement subnets, and GVA secondary VNIC subnets."
    )
    parser.add_argument("--cluster-id")
    parser.add_argument("--cluster-name")
    parser.add_argument("--context", help="Kubernetes context to inspect for cluster OCID")
    parser.add_argument("--compartment-id")
    parser.add_argument("--region")
    parser.add_argument("--profile", default=os.environ.get("OCI_CLI_PROFILE"))
    parser.add_argument("--auth", default=os.environ.get("OCI_CLI_AUTH"))
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")
    args = parser.parse_args()

    env = os.environ.copy()
    if args.profile:
        env["OCI_CLI_PROFILE"] = args.profile
    if args.auth:
        env["OCI_CLI_AUTH"] = args.auth

    if shutil.which("oci") is None:
        return emit_error(
            1,
            "OCI_CLI_NOT_FOUND",
            "OCI CLI is not installed or not on PATH.",
            "Install OCI CLI, authenticate to the target tenancy, and rerun discovery.",
        )

    needs_kubeconfig_lookup = not args.cluster_id and not (args.cluster_name and args.compartment_id)
    if needs_kubeconfig_lookup and shutil.which("kubectl") is None:
        return emit_error(
            1,
            "KUBECTL_NOT_FOUND",
            "kubectl is not installed or not on PATH, and discovery needs kubeconfig to resolve the cluster OCID.",
            "Install kubectl, pass --cluster-id, or pass --cluster-name with --compartment-id.",
        )

    cluster_id = (
        args.cluster_id
        or cluster_id_from_kubeconfig(args.context, env)
        or cluster_id_from_name(args, env)
    )
    if not cluster_id:
        return emit_error(
            1,
            "CLUSTER_OCID_NOT_RESOLVED",
            "Could not resolve cluster OCID.",
            "Pass --cluster-id, or pass --cluster-name with --compartment-id, or use a kubeconfig context that contains --cluster-id.",
        )

    cluster = get_cluster(args, cluster_id, env)
    if not args.region:
        args.region = cluster.get("region")

    pools = list_node_pools(args, cluster, env)
    subnet_ids = collect_subnet_ids(cluster, pools)
    subnets = get_subnets(args, subnet_ids, env)
    output = {
        "cluster": {
            "id": cluster.get("id"),
            "name": cluster.get("name"),
            "compartmentId": cluster.get("compartment-id"),
            "kubernetesVersion": cluster.get("kubernetes-version"),
            "vcnId": cluster.get("vcn-id"),
            "type": cluster.get("type"),
            "endpointConfig": cluster.get("endpoint-config"),
            "options": cluster.get("options"),
        },
        "subnets": [subnet_summary(subnets[subnet_id]) for subnet_id in sorted(subnets)],
        "nodePools": [node_pool_summary(pool, subnets) for pool in pools],
        "suggestedGeneratorArgs": suggested_generator_args(pools),
    }
    indent = 2 if args.pretty else None
    print(json.dumps(output, indent=indent, sort_keys=bool(indent)))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        raise SystemExit(1)
    except RuntimeError as exc:
        raise SystemExit(
            emit_error(
                1,
                "DISCOVERY_COMMAND_FAILED",
                str(exc),
                "Verify OCI CLI authentication, region, compartment, and kubeconfig context, then rerun discovery.",
            )
        )
    except Exception as exc:
        raise SystemExit(
            emit_error(
                2,
                "UNEXPECTED_ERROR",
                str(exc),
                "Inspect the input arguments and environment, then rerun discovery.",
            )
        )
