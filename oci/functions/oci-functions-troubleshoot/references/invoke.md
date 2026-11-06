# Invocation

Use this reference for runtime and HTTP failures after a function has been deployed.

## High-Value Patterns

- `413` usually means the request payload is too large for the invocation path.
- response body or response headers too large usually means the function returned more data than the invocation path allows.
- `429 TooManyRequests` usually means throttling or concurrency pressure.
- `444` usually means the client disconnected before the response completed.
- `FunctionInvokeExecutionFailed` usually points to user code or a downstream dependency after execution started.
- `FunctionInvokeSyslogUnavailable` points to external logging reachability or syslog configuration rather than core function logic.
- image-not-available, image-pull, or combined image-size failures happen before normal execution and usually indicate registry/image accessibility, VCN gateway/routing, or image-size problems.
- subnet, DHCP, custom resolver, and DNS issues commonly surface as outbound access or name resolution failures during init or execution.
- security-attribute or too-many-dynamic-groups failures point to IAM or org configuration rather than code.
- `503 Service Unavailable` can be transient capacity ramp-up; for detached or event-driven invocations, automatic retries may already be in play.
- container init failures and some `504` cases often correlate with startup, dependency, DNS, or memory pressure.
- timeout failures usually require comparing function timeout settings, cold-start cost, and downstream latency.

## Read-Only Checks

- Capture the exact HTTP status and OCI Functions error text.
- Capture the invoke type: synchronous, detached, or event-driven.
- Decide whether the failure occurred:
  - before code ran
  - during container init
  - during function execution
  - after execution but before response or delivery completed
- Read function logs first when available.
- Use traces next when enabled and downstream timing or call path is unclear.
- Review Functions metrics next, especially:
  - `FunctionInvocationCount`
  - `FunctionExecutionDuration`
  - `FunctionResponseCount`
  - `FunctionDetachedDeliveries`
  - `AllocatedTotalConcurrency`
  - `AllocatedProvisionedConcurrency`
- Check limits if the symptom suggests throttling or capacity exhaustion.
- Inspect app subnet, DHCP, resolver, or routing assumptions when network clues appear.

## Likely Cause Mapping

- `413`: request payload-size problem
- response body or header size text: function returned too much data or too many/too-large headers
- `429`: concurrency or throttling pressure
- `444`: client-side disconnect or caller timeout
- image unavailable or pull timeout with no user logs: registry, image availability, or VCN gateway/routing problem before code ran
- combined image size or persistent image-pull delays: oversized image or slow registry access
- container init fail plus little or no app logging: startup, dependency, DNS, or memory problem
- timeout with normal starts: downstream dependency latency or timeout configuration
- execution failed plus stack trace: function code or dependency issue first
- syslog unavailable: external logging endpoint reachability or config
- security attributes or too many dynamic groups text: IAM or org configuration issue
- `503` that recovers with retries, especially for detached or event-driven invokes: transient platform capacity or cold ramp
- `503` isolated to one dependency path: unreachable downstream service or network issue

## Safe Remediation Ideas

- Reduce request or response size, or move large payloads through Object Storage or another indirection path.
- Use logs, traces, and concurrency metrics before changing timeout or memory.
- Retry with backoff before blaming code for transient `503`, especially on event-driven workloads.
- Trim image size and confirm registry accessibility, service-gateway or internet-gateway routing, and image availability before retrying image-pull failures.
- Check DNS, DHCP options, custom resolver config, subnet routes, and service access when runtime code cannot reach external dependencies.
- Correct IAM, dynamic-group, or security-attribute configuration with the smallest scope change before rebuilding.

## Sources

- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
- [Issues invoking functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting_topic-Issues-invoking-functions.htm)
- [Function Metrics](https://docs.oracle.com/en-us/iaas/Content/Functions/Reference/functionsmetrics.htm)
