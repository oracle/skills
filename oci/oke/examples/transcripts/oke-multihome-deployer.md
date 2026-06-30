# OKE Multihome Deployer Transcript

This is a shortened successful run for validating Multus pods on a GVA node pool.

## Prompt

```text
Use the OKE multihome deployer
```

## Transcript

**User:** Deploy Multus multi-home test pods on my GVA node pool and validate `net1`.

**Agent:** I will discover the OKE cluster, node pool, placement subnets, secondary
VNIC subnets, and ready node names before generating YAML.

**Agent:** Discovery found a GVA-enabled node pool with secondary VNIC interfaces
`enp1s0` and `enp2s0`. I will generate two pinned netshoot pods.

**Agent:** Generated manifest:

- Namespace `gva-multihome-test`
- Default NAD `kube-system/gva-default-network`
- Secondary NAD `gva-multihome-test/gva-secondary-network`
- Test pods `gva-multihome-a` and `gva-multihome-b`

**Agent:** Validation passed:

| Check | Result |
| --- | --- |
| Multus daemonset | Running |
| Pod network-status | `eth0` and `net1` present |
| Pod interfaces | `eth0`, `net1` |
| `net1` ping both directions | Passed |

## What This Produces

See [sample Multus manifest](../outputs/oke-multihome-deployer/gva-multihome-pods.yaml).

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking_topic-OCI_CNI_plugin.htm
- https://github.com/k8snetworkplumbingwg/multus-cni
- https://github.com/k8snetworkplumbingwg/network-attachment-definition-client
