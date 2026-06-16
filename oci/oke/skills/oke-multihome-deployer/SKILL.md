---
name: oke-multihome-deployer
description: Deploy and troubleshoot multihome networking on OCI Kubernetes Engine using existing GVA secondary VNIC node pools, Multus thick plugin, OCI CNI/IPAM, NetworkAttachmentDefinitions, and test pods. Use when the user asks to auto-discover OKE cluster subnets or node pools for multihome, create OKE multihome pod manifests, configure Multus NADs for secondary VNIC interfaces, validate multihomed pod connectivity, inspect OCI CNI IPAM allocation on OKE nodes, or package repeatable OKE GVA multihome deployment steps. Do not use it to create or update GVA node pools. For broad incident RCA, DPDK/SR-IOV failures, or non-Multus pod symptoms, use `oke-troubleshooter` first.
---

# OKE Multihome Deployer

## Scope

Use this skill after an OKE node pool already has GVA secondary VNIC profiles attached. This skill deploys and verifies Multus-based pod multihoming; it does not create or update GVA node pools.

If the user needs to create or update the node pool secondary VNIC profiles, use `oke-gva-deployer` first, then return here.

Supporting references:
- `validation-report-template.md` — standard final validation report structure.

## Core Workflow

1. Confirm target cluster/context and auth.
   - Prefer explicit `OCI_CLI_PROFILE` and `OCI_CLI_AUTH`; when using OCI security-token auth, pass `--auth security_token` or set `OCI_CLI_AUTH=security_token`.
   - If `kubectl` fails with `exec: executable oci failed`, ask the user to refresh the OCI session before applying anything.
2. Auto-discover cluster, node pool, and subnet data before generating YAML.
   - Use `scripts/discover-oke-multihome.py`.
   - Prefer `--cluster-id` when the user provides it; otherwise try `--context`, then `--cluster-name` with `--compartment-id`.
   - The discovery script queries OKE node pools and fetches all referenced placement and secondary VNIC subnets.
   - Use the discovered node names for `--pod NAME=NODE_NAME` entries.
3. Verify prerequisites from Kubernetes and node-side checks.
   - OKE CNI must be `OCI_VCN_IP_NATIVE`.
   - Worker nodes must expose secondary VNIC interfaces. Treat `enp1s0` and `enp2s0` as common defaults, then confirm the actual interface names from discovery or node-side evidence before applying manifests.
   - OCI CNI binaries should exist on nodes: `oci-ipam`, `oci-ipvlan`, `oci-ptp`.
   - The standard `ipvlan` CNI binary is needed when using a plain `ipvlan` secondary NAD.
4. Install Multus thick plugin if absent.
   - Upstream manifest used in this workflow:
     `https://raw.githubusercontent.com/k8snetworkplumbingwg/multus-cni/master/deployments/multus-daemonset-thick.yml`
   - TODO(live validation): pin this manifest to a tested Multus release tag after validating it against the target OKE Kubernetes version. Keep using the repo's current manifest reference until that live validation is complete.
5. Generate or edit the deployment manifest.
   - Use `scripts/generate-multihome-manifest.py` for repeatable YAML.
   - Default network NAD: `kube-system/gva-default-network`, using `oci-ipvlan` on the first secondary VNIC path.
   - Secondary NAD: workload namespace scoped, using `ipvlan` on the second secondary VNIC path with `oci-ipam`.
6. Apply and verify.
   - Use fully qualified images such as `docker.io/nicolaka/netshoot:v0.13`; CRI-O may reject short image names.
   - Check pod annotation `k8s.v1.cni.cncf.io/network-status`.
   - Exec `ip -br addr` in each pod and ping the peer `net1` IP both directions.
   - Use `validation-report-template.md` for the final validation report, whether
     validation passed, failed, or remains incomplete.

## Discovery

Run discovery before manifest generation:

```bash
OCI_CLI_PROFILE=<oci-profile> OCI_CLI_AUTH=<oci-auth-mode> \
python3 <skill>/scripts/discover-oke-multihome.py \
  --cluster-id <cluster_ocid> \
  --region <region> \
  --pretty > oke-multihome-discovery.json
```

If the current kubeconfig contains the cluster OCID in its exec user args, use:

```bash
OCI_CLI_PROFILE=<oci-profile> OCI_CLI_AUTH=<oci-auth-mode> \
python3 <skill>/scripts/discover-oke-multihome.py \
  --context <kubectl_context> \
  --region <region> \
  --pretty
```

Use the JSON output to pick:

- Node pool with GVA `secondaryVnics`.
- Primary placement subnet(s), for node placement context.
- Secondary VNIC subnet IDs/CIDRs, for deciding which interface path maps to each pod network.
- Up to two ready node names for pinned smoke-test pods.

Do not guess subnet CIDRs or node names when discovery can retrieve them.

## Manifest Generation

Generate a two-pod test manifest:

```bash
python3 <skill>/scripts/generate-multihome-manifest.py \
  --namespace gva-multihome-test \
  --default-interface <confirmed-first-secondary-vnic-interface> \
  --secondary-interface <confirmed-second-secondary-vnic-interface> \
  --pod gva-multihome-a=<node-name-a> \
  --pod gva-multihome-b=<node-name-b> \
  > gva-multihome-pods.yaml
```

Use Kubernetes node names exactly as returned by `kubectl get nodes`. In OKE clusters configured like the handoff, node names may be node private IPs.

## Verification Commands

Use these checks after applying manifests:

```bash
kubectl -n kube-system get pods -l name=multus -o wide
kubectl -n gva-multihome-test get pods -o wide
kubectl -n gva-multihome-test get pod gva-multihome-a gva-multihome-b \
  -o jsonpath='{range .items[*]}{.metadata.name}{" on "}{.spec.nodeName}{"\n"}{.metadata.annotations.k8s\.v1\.cni\.cncf\.io/network-status}{"\n\n"}{end}'
kubectl -n gva-multihome-test exec gva-multihome-a -- ip -br addr
kubectl -n gva-multihome-test exec gva-multihome-b -- ip -br addr
```

Then ping `net1` IPs across pods:

```bash
kubectl -n gva-multihome-test exec gva-multihome-a -- ping -c 3 -W 2 <pod-b-net1-ip>
kubectl -n gva-multihome-test exec gva-multihome-b -- ping -c 3 -W 2 <pod-a-net1-ip>
```

## Troubleshooting

Read `references/oke-multihome-notes.md` when:

- Multus pods are missing or failing.
- Pods are stuck creating sandbox/network.
- `ipvlan` is missing on the host.
- OCI IPAM capacity or allocation behavior is unclear.
- Floating IP/VIP behavior is being explored.

Read `references/oke-dpdk-mlx5-notes.md` when:

- The workload uses DPDK, SR-IOV device-plugin resources, Mellanox/NVIDIA VFs, `mlx5`, `vfio-pci`, hugepages, or `/dev/infiniband`.
- A pod requests Multus networks and device-plugin resources but `network-status` only shows `eth0`.
- You need to decide whether the issue is Multus/NAD attachment, resource allocation, driver binding, RDMA/verbs exposure, hugepages, or app PCI/interface mapping.

For node-side inspection, prefer a privileged diagnostic DaemonSet that mounts `/` at `/host` and runs commands with `chroot /host`, rather than SSHing to each worker.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking_topic-OCI_CNI_plugin.htm
- https://github.com/k8snetworkplumbingwg/multus-cni
- https://github.com/k8snetworkplumbingwg/network-attachment-definition-client
- https://www.cni.dev/plugins/current/main/ipvlan/
- https://kubernetes.io/docs/tasks/debug/debug-cluster/kubectl-node-debug/
