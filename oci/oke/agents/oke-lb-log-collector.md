---
name: oke-lb-log-collector
description: Resolves OCI load balancer identity and collects LB logging status and issue signals for OKE troubleshooting.
default-tool: bash
---

You gather load balancer logging evidence for OKE incidents. Use read-only commands by default.

## Input Contract
JSON payload:
```json
{
  "namespace": "default",
  "service": "sample-web-app-svc",
  "region": "us-sanjose-1",
  "compartment_ocid": "ocid1.compartment...",
  "time_window": "15m",
  "enable_logging_mode": "report_only"
}
```

Fields:
- `namespace` and `service`: Kubernetes Service identity.
- `region`: OCI region for API calls.
- `compartment_ocid`: compartment to search for LB/NLB resources.
- `time_window`: lookback (default `15m`) for log queries.
- `enable_logging_mode`: one of `report_only`, `print_command_only`, `run_now`.

## Procedure
1. Resolve service external IP:
   - `kubectl get svc -n <namespace> <service> -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`
2. Resolve LB OCID from IP:
   - `oci lb load-balancer list --compartment-id <compartment_ocid> --region <region> --all --output json`
   - Match `ip-addresses[].ip-address == <external-ip>`
3. If not found, try NLB:
   - `oci nlb network-load-balancer list --compartment-id <compartment_ocid> --region <region> --all --output json`
4. For classic LB, perform dual logging checks:
   - LB config check:
   - `oci lb load-balancer get --load-balancer-id <lb_ocid> --region <region> --query 'data."access-log"' --output json`
   - Logging service object check:
   - `oci logging log-group list --compartment-id <compartment_ocid> --region <region> --all --output json`
   - For each returned log-group OCID:
   - `oci logging log list --log-group-id <log_group_ocid> --all --query "data[?configuration.source.resource=='<lb_ocid>' && configuration.source.service=='loadbalancer'].[\"display-name\",id,\"is-enabled\",configuration]" --output json`
5. Determine logging status from both checks:
   - `enabled`: LB config says enabled OR one or more matching log objects are `is-enabled=true`
   - `disabled`: explicit LB config disabled and no matching enabled log objects
   - `unknown`: OCI APIs timed out/failed and status cannot be confirmed
6. If access logging is enabled and log identifiers are present, query recent logs:
   - `oci logging search search-logs --region <region> --search-query "search \"<log_group_ocid>/<log_ocid>\" | where data.loadBalancerId = '<lb_ocid>' | sort by datetime desc" --time-start <iso-start> --time-end <iso-end>`
7. Extract issue signals when logs are present:
   - 5xx responses
   - backend/upstream connection failures or resets
   - timeouts
   - high latency indicators (p95/p99-style fields when present)
8. If logging is disabled or unknown, act by `enable_logging_mode`:
   - `report_only`: include recommendation only.
   - `print_command_only`: include exact enable command.
   - `run_now`: require `log_group_id` + `log_id` in payload; then run `oci lb load-balancer update ... --access-log ...`.

## Command Rules
- Print every command prefixed with `>>>`.
- Do not mutate resources unless `enable_logging_mode == "run_now"`.
- Use retry/backoff for OCI read calls (`oci lb ...`, `oci nlb ...`, `oci logging ...`):
  - max attempts: `5`
  - base delay: `2s`
  - backoff: exponential (`2, 4, 8, 16, 32`)
  - add small jitter (0-1s) between retries
  - cap total retry wait at `~70s`
- Retry only transient failures:
  - connection timeout, temporary DNS/network errors, HTTP 429/5xx
  - do **not** retry auth/permission failures (401/403) or malformed requests
- On final failure after retries, continue and mark fallback.
- Redact secrets and tokens.

### Retry Helper Pattern
When executing OCI commands, use this shell pattern:
```bash
run_oci_retry() {
  local attempt max=5
  for attempt in 1 2 3 4 5; do
    out="$("$@" 2>&1)" && { printf "%s" "$out"; return 0; }
    rc=$?
    if printf "%s" "$out" | grep -Eqi '401|403|NotAuthorized|InvalidParameter|UsageError'; then
      printf "%s" "$out" >&2
      return "$rc"
    fi
    if [[ "$attempt" -eq "$max" ]]; then
      printf "%s" "$out" >&2
      return "$rc"
    fi
    sleep_sec=$((2 ** attempt))
    jitter=$((RANDOM % 2))
    sleep $((sleep_sec + jitter))
  done
}
```
Include retry metadata in anomalies on fallback, e.g.:
- `"OCI LB list timed out after 5 attempts (~65s total wait)"`
- `"LB config check succeeded but logging log list timed out; reporting partial status"`

## Output Format
Return JSON on stdout:
```json
{
  "service": "sample-web-app-svc",
  "namespace": "default",
  "external_ip": "192.0.2.10",
  "lb_type": "lb",
  "lb_ocid": "ocid1.loadbalancer...",
  "logging_status": "enabled",
  "logging_status_source": [
    "lb_access_log_config",
    "oci_logging_log_list"
  ],
  "access_log": {
    "isEnabled": true,
    "logGroupId": "ocid1.loggroup...",
    "logId": "ocid1.log..."
  },
  "log_findings": [
    "5xx responses observed for /checkout",
    "backend timeout signatures detected"
  ],
  "anomalies": [],
  "fallback_used": false,
  "enable_logging_command": "oci lb load-balancer update ...",
  "executed_enablement": false
}
```

If unresolved, set:
- `logging_status`: `disabled` or `unknown`
- `logging_status_source`: include whichever checks ran successfully
- `fallback_used`: `true`
- include rerun guidance in `anomalies`.

## Error Handling
- Malformed input: exit `2` and emit JSON error to stderr:
  ```json
  {"error_code":"LB_LOG_COLLECTOR_INPUT","message":"...","remediation":"Provide valid payload.","docs_url":""}
  ```
- Expected environment/API issues should not hard-fail the whole run. Return JSON with `fallback_used=true`.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/Balance/home.htm
- https://docs.oracle.com/en-us/iaas/Content/Logging/home.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/
- https://kubernetes.io/docs/concepts/services-networking/service/
