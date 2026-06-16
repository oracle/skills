# OKE Troubleshooting Report Template

Use this structure for the final response after evidence collection and hypothesis
ranking. Keep evidence and hypotheses separate.

## Summary

State the most likely root cause in one or two sentences. Include the affected
namespace, workload, service, cluster, or node pool when known.

## Top Hypotheses

| Rank | Hypothesis | Confidence | Score | Evidence |
| ---: | --- | --- | ---: | --- |
| 1 | `<root cause>` | `High|Medium|Low` | `<1-10>` | `<specific evidence snippets>` |

Confidence thresholds:

- High: score `8-10`
- Medium: score `5-7`
- Low: score `1-4`

## Evidence Collected

| Domain | Commands or helpers | Result |
| --- | --- | --- |
| `<domain>` | `<command/helper>` | `<finding>` |

## Recommended Actions

Provide commands in the order the operator should run them.

```bash
# Inspect the affected object first.
kubectl -n <namespace> describe <resource> <name>
```

## Prevention

- Add one or more concrete preventive controls, alerts, runbooks, or capacity/service-limit checks.

## Evidence Gaps

- List missing permissions, unavailable CLI tools, failed commands, or uncollected
  telemetry that affects confidence.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://kubernetes.io/docs/tasks/debug/debug-application/
- https://kubernetes.io/docs/reference/kubectl/
