# OKE DPDK, Multus, and Mellanox mlx5 Notes

Use this note when an OKE workload combines DPDK, Multus, SR-IOV device-plugin resources, Mellanox/NVIDIA VFs, `mlx5_core`, `vfio-pci`, hugepages, or RDMA/verbs devices.

## Contents
- Decision Model
- mlx5 Driver Rule
- Read-Only Evidence Commands
- Expected Evidence
- Common Failure Pattern

## Decision Model

Do not collapse these mechanisms into one check:

- Kubernetes device-plugin resource request: allocates a named resource to the pod.
- Multus annotation: asks for named network attachments.
- `NetworkAttachmentDefinition`: defines the requested network.
- `network-status`: proves what Multus actually attached.
- Driver binding: decides whether the VF is owned by Linux `mlx5_core`, `vfio-pci`, or another driver.
- DPDK app config: decides which PCI BDFs, ports, hugepage path, and PMD are used.

A pod can be `Running` and still have no usable DPDK network path.

## mlx5 Driver Rule

For Mellanox/NVIDIA `mlx5` DPDK PMD, `vfio-pci` is not always the desired state. The bifurcated mlx5 model can require the VF to stay bound to Linux `mlx5_core` while DPDK uses mlx5 PMD libraries through the kernel/RDMA userspace stack.

Treat `vfio-pci` as proven only when the node exposes numbered VFIO group devices such as `/dev/vfio/<group>` and a controlled bind succeeds. If `/dev/vfio` contains only the control device and `/sys/kernel/iommu_groups` is empty, do not keep retrying disruptive binds on live nodes.

## Read-Only Evidence Commands

Collect the Kubernetes side first:

```bash
kubectl get network-attachment-definitions -A | egrep '<namespace>|<nad-prefix>|noiommu|sriov|mlx'
kubectl -n <namespace> get network-attachment-definition <nad-name> -o yaml
kubectl -n <namespace> describe pod <pod>
kubectl -n <namespace> get pod <pod> \
  -o jsonpath='{.metadata.annotations.k8s\.v1\.cni\.cncf\.io/network-status}'
```

Inside the pod:

```bash
kubectl -n <namespace> exec <pod> -- ip -br addr
kubectl -n <namespace> exec <pod> -- ls -l /dev/infiniband
kubectl -n <namespace> exec <pod> -- ibv_devices
kubectl -n <namespace> exec <pod> -- lspci -nnk
kubectl -n <namespace> exec <pod> -- dpdk-devbind.py -s
kubectl -n <namespace> exec <pod> -- grep -i Huge /proc/meminfo
kubectl -n <namespace> exec <pod> -- mount | grep -i huge
```

On the target node, after explicit approval for node-side inspection:

```bash
ip -br addr
lspci -nnk | egrep -A3 'Mellanox|NVIDIA|Ethernet'
ls -l /dev/vfio
find /sys/kernel/iommu_groups -maxdepth 1 -mindepth 1 -type d | wc -l
dpdk-devbind.py -s
```

Capture DPDK startup logs:

```bash
kubectl -n <namespace> logs <pod> | egrep -i 'EAL|mlx5|ibv|verbs|huge|vfio|pci|rte'
```

## Expected Evidence

Multus attachment is proven only when `network-status` lists the requested networks and interfaces, not just the default network:

```text
eth0 ...
net1 ...
net2 ...
```

The mlx5 PMD path usually needs:

```text
Kernel driver in use: mlx5_core
/dev/infiniband/uverbs*
ibv_devices shows mlx5 devices
HugePages_Total > 0
```

The VFIO path usually needs:

```text
/dev/vfio/vfio
/dev/vfio/<numbered-group>
non-empty /sys/kernel/iommu_groups
target PCI device bound to vfio-pci
```

## Common Failure Pattern

If the pod requests networks such as `noiommu-0,noiommu-1` and device-plugin resources such as `mellanox.com/<resource>`, but `network-status` only shows `cbr0` or `eth0`, the immediate issue is not proven DPDK initialization. First verify:

- The NADs exist in the correct namespace.
- The pod annotations reference the correct NAD names or namespace-qualified names.
- Each NAD maps to the intended device-plugin resource when using SR-IOV CNI.
- Pod events do not show Multus or CNI errors.
- The pod has the expected `net1`, `net2`, etc. interfaces.

Only after this is correct should the investigation move to DPDK PMD, PCI allowlist, hugepage, or NUMA details.

## Sources

- https://github.com/k8snetworkplumbingwg/multus-cni
- https://github.com/k8snetworkplumbingwg/network-attachment-definition-client
- https://github.com/k8snetworkplumbingwg/sriov-network-device-plugin
- https://doc.dpdk.org/guides/nics/mlx5.html
- https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
- https://kubernetes.io/docs/tasks/debug/debug-application/
