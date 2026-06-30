# OKE Troubleshooter Transcript

This is a shortened successful troubleshooting run with redacted identifiers.

## Prompt

```text
Use the OKE troubleshooter for pods stuck Pending in prod namespace
```

## Transcript

**User:** Pods are stuck Pending in the `prod` namespace.

**Agent:** I mapped the symptom to Pod scheduling, Node health, Cluster Autoscaler,
and OCI limits. I will collect read-only evidence with `kubectl` and OCI CLI.

**Agent:** Evidence collected:

- `kubectl -n prod get pods --field-selector=status.phase=Pending -o wide`
- `kubectl -n prod get events --field-selector reason=FailedScheduling`
- `kubectl -n kube-system logs deployment/cluster-autoscaler --tail=200`
- `oci ce node-pool list --compartment-id <compartment_ocid> --cluster-id <cluster_ocid>`

**Agent:** Findings:

| Hypothesis | Score | Evidence |
| --- | ---: | --- |
| Node pool max size reached | 9 | FailedScheduling reports insufficient CPU; autoscaler logs show `max node group size reached` |
| OCI compute capacity or quota limit | 5 | No direct quota error found, but scale-out was blocked |

**Agent:** Next steps:

```bash
kubectl -n prod describe pod <pending-pod>
oci ce node-pool update --node-pool-id <node_pool_ocid> --size <larger_size>
```

## What This Produces

See [sample troubleshooting report](../outputs/oke-troubleshooter/final-report.md).

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/ce/node-pool/list.html
- https://kubernetes.io/docs/tasks/debug/debug-application/
