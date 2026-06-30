# OKE Troubleshooting Report

## Summary

Pods in namespace `prod` are Pending because the current node pool cannot fit the
requested CPU and the cluster autoscaler cannot grow the node pool further.

## Top Hypotheses

| Rank | Hypothesis | Confidence | Score | Evidence |
| ---: | --- | --- | ---: | --- |
| 1 | Node pool max size reached | High | 9 | `FailedScheduling` reports insufficient CPU; autoscaler reports max node group size reached |
| 2 | OCI quota or capacity limit | Medium | 5 | Scale-out did not proceed; no direct quota error was collected |

## Recommended Actions

```bash
kubectl -n prod describe pod <pending-pod>
oci ce node-pool update --node-pool-id <node_pool_ocid> --size <larger_size>
```

## Evidence Gaps

- OCI quota and capacity checks were not available in this sample.
- Re-run after increasing node-pool size to confirm pods schedule.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/ce/node-pool/update.html
- https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/
