# OKE Multihome Notes

## Known Working Pattern

- OKE CNI: `OCI_VCN_IP_NATIVE`
- Multus: thick DaemonSet
- Default Multus network annotation: `v1.multus-cni.io/default-network`
- Additional network annotation: `k8s.v1.cni.cncf.io/networks`
- Default NAD uses `oci-ipvlan` plus `oci-ptp`.
- Secondary NAD can use standard `ipvlan` with OCI `oci-ipam`.
- Netshoot image should be fully qualified: `docker.io/nicolaka/netshoot:v0.13`.

## Discovery Scope

Use `scripts/discover-oke-multihome.py` to collect:

- OKE cluster metadata.
- All node pools in the target cluster.
- Node pool placement subnets.
- GVA secondary VNIC profile subnets.
- Referenced subnet display names, CIDRs, VCN IDs, and availability domains.

Discovery intentionally reads node pool details because secondary VNIC profile data lives on the node pool. It does not create or update any OCI resources.

Example interface mapping from the observed OKE GVA nodes:

```text
enp0s5 = primary node subnet
enp1s0 = first secondary VNIC path
enp2s0 = second secondary VNIC path
```

## CNI Binary Checks

The OKE nodes should already have:

```text
oci-ipam
oci-ipvlan
oci-ptp
```

The standard `ipvlan` binary may be missing. If the secondary NAD uses `"type": "ipvlan"`, install or copy the `ipvlan` CNI binary into host `/opt/cni/bin` on every target node. Avoid replacing the full CNI plugin bundle unless needed.

## OCI IPAM State

OCI private-IP API output may not show all addresses available to the node-local CNI pool. For allocation details, inspect node-side state:

```text
/dev/shm/oci-cni/free
/dev/shm/oci-cni/used
```

Use a privileged diagnostic DaemonSet and `chroot /host` for repeated multi-node inspection.

## Common Failures

- `getting credentials: exec: executable oci failed`: refresh OCI CLI security token or set `OCI_CLI_PROFILE` and `OCI_CLI_AUTH` correctly.
- CRI-O rejects `nicolaka/netshoot:v0.13`: use `docker.io/nicolaka/netshoot:v0.13`.
- Pod sandbox creation fails with missing CNI plugin `ipvlan`: install the standard `ipvlan` CNI binary on the worker host.
- Pods do not receive the expected interfaces: check the exact NAD names, namespaces, and Multus annotations.
- Cross-pod `net1` ping fails: confirm both pods are on nodes with the secondary VNIC interface, check subnet security rules/NSGs, and verify each pod's `network-status` annotation.

## DPDK / SR-IOV Boundary

For DPDK workloads, keep these mechanisms separate:

- `resources.requests` or `resources.limits` for a device-plugin resource only asks Kubernetes to allocate that resource.
- `k8s.v1.cni.cncf.io/networks` only asks Multus to attach named networks.
- A `NetworkAttachmentDefinition` defines what each named network means.
- `k8s.v1.cni.cncf.io/network-status` is the evidence that Multus actually attached the interfaces.

If a pod requests SR-IOV or Mellanox resources but `network-status` only shows the default `eth0` network, scheduling may have succeeded while Multus attachment is still unproven or broken. First collect NAD YAML and pod `network-status` before debugging the DPDK application.

For Mellanox/NVIDIA `mlx5` DPDK PMD, do not assume `vfio-pci` is the right driver. Some working mlx5 paths use the Linux `mlx5_core` driver plus RDMA/verbs devices. If the workload mentions `mlx5`, `/dev/infiniband`, `ibv_devices`, or DPDK mlx5 PMD libraries, read `oke-dpdk-mlx5-notes.md`.

## Floating IP Note

A VIP can be modeled as an OCI secondary private IP moved between matching secondary VNICs:

```bash
oci network vnic assign-private-ip \
  --vnic-id <destination-secondary-vnic-id> \
  --ip-address <vip> \
  --unassign-if-already-assigned
```

Then add the /32 inside the active pod on the corresponding Multus interface:

```bash
ip addr add <vip>/32 dev net1
```

Reserve VIP ranges carefully. Confirm OCI IPAM allocation behavior first to avoid collisions with dynamically assigned pod addresses.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking_topic-OCI_CNI_plugin.htm
- https://github.com/k8snetworkplumbingwg/multus-cni
- https://github.com/k8snetworkplumbingwg/network-attachment-definition-client
- https://www.cni.dev/plugins/current/main/ipvlan/
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/network/vnic/assign-private-ip.html
