# OKE Multihome Validation Report Template

Use this structure after generating or applying Multus/GVA validation manifests.

## Summary

State whether multihome validation passed, failed, or is incomplete.

## Environment

| Field | Value |
| --- | --- |
| Cluster | `<cluster>` |
| Region | `<region>` |
| Namespace | `<namespace>` |
| Node pool | `<node_pool>` |
| Default interface | `<interface>` |
| Secondary interface | `<interface>` |

## Generated Artifacts

| Artifact | Purpose |
| --- | --- |
| Namespace | Test namespace for validation pods |
| Default NAD | Multus default network backed by OCI CNI/IPAM |
| Secondary NAD | Secondary `net1` network backed by OCI IPAM |
| Test pods | Pinned netshoot pods for interface and ping checks |

## Validation Checks

| Check | Command | Result |
| --- | --- | --- |
| Multus daemonset | `kubectl -n kube-system get pods -l name=multus -o wide` | `<pass/fail>` |
| Pod placement | `kubectl -n <namespace> get pods -o wide` | `<pass/fail>` |
| Network status | `kubectl -n <namespace> get pod <pod> -o jsonpath=...` | `<pass/fail>` |
| Interfaces | `kubectl -n <namespace> exec <pod> -- ip -br addr` | `<pass/fail>` |
| Peer ping | `kubectl -n <namespace> exec <pod-a> -- ping -c 3 <pod-b-net1-ip>` | `<pass/fail>` |

## Remediation

List the first failed check and the most likely fix. Keep Multus/NAD failures,
OCI CNI/IPAM allocation failures, node-interface issues, and DPDK/SR-IOV driver
issues as separate facts.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://github.com/k8snetworkplumbingwg/multus-cni
- https://github.com/k8snetworkplumbingwg/network-attachment-definition-client
- https://kubernetes.io/docs/reference/kubectl/
