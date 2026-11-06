# Observability

Use this reference when the user wants to diagnose OCI Functions behavior from signals instead of a single failing command.

## Signal Selection

- Logs are best for proving whether the function started and whether it reached user code.
- Traces are best for dependency timing, call path, and downstream latency when tracing is enabled.
- Metrics are best for aggregate failure classification, concurrency pressure, and detached-delivery trends.
- Limits are best when create or invoke symptoms hint at service ceilings.
- Debug flags are best for local reproduction when request details are still missing.

## Logs First When Available

- OCI Logging is the default and recommended place to inspect OCI Functions logs.
- Invocation logs exist only when Logging is enabled for the application.
- Custom application logs require the function code to emit output with normal print or logging calls.

Questions to answer with logs:
- Did the function start?
- Did it reach user code?
- Is the failure during init, execution, or downstream access?
- Is there a stack trace, dependency error, or timeout clue?

Common blockers:
- Logging is disabled for the application.
- The failure happens before user code emits logs.
- The issue is in external log forwarding rather than normal invocation logging.

## Tracing When Timing Or Call Path Is Missing

- Use tracing when the missing clue is dependency timing, latency, or call path rather than raw application output.
- Tracing is useful when logs show a symptom but not which downstream call or hop introduced it.

Common blockers:
- Tracing is not enabled.
- The failing invocation did not emit a trace.
- The problem is local CLI or control-plane behavior, where traces add little.

## Metrics For Aggregate Patterns

Use the `oci_faas` metrics namespace to separate platform symptoms from code symptoms.

Most useful metrics:
- `FunctionInvocationCount`
- `FunctionExecutionDuration`
- `FunctionResponseCount`
- `AllocatedTotalConcurrency`
- `AllocatedProvisionedConcurrency`
- `FunctionDetachedDeliveries` when detached or event-driven delivery is suspected

Most useful dimensions and groupings:
- `responseType`
- `ErrorCode`
- `ErrorMessage`
- `InvokeType` where available
- app and function identity dimensions

What to look for:
- rising invocation count with normal response mix: traffic increase, not necessarily failure
- error-heavy response counts by `responseType` or `ErrorCode`: failure classification
- detached delivery failures with `InvokeType` where available, or with `FunctionDetachedDeliveries`: async delivery problem, not necessarily synchronous execution failure
- growing execution duration before timeouts: slow startup or slow downstream dependency
- concurrency near `AllocatedTotalConcurrency` or provisioned concurrency saturation: likely throttling or capacity issue
- no logs but invocation metrics present: failure before user logging or logging disabled
- traces show a slow downstream call while platform metrics remain healthy: dependency issue first

## Limits When Symptoms Suggest A Ceiling

Check limits when create or invoke symptoms hint at service ceilings.

Focus on:
- `application-count`
- `function-count`
- `total-concurrency-mb`
- `provisioned-concurrency-mb`

Diagnosis rules:
- create-time failures often map to `application-count`
- scale or throttling symptoms often map to concurrency limits
- broad deployment growth problems can involve `function-count`
- provisioned concurrency symptoms need `provisioned-concurrency-mb`, not just total concurrency

## Debug Flags For Local Reproduction

- Use `DEBUG=1` when reproducing Fn CLI behavior and you need more request/response detail.
- Use `OCI_GO_SDK_DEBUG=v` when OCI Go SDK request logging would clarify control-plane or auth behavior.
- Treat these as signal amplifiers, not as fixes.

Common blockers:
- The user cannot safely reproduce the command.
- The command output would be too noisy or sensitive to share verbatim.

## Practical Sequence

1. Logs if they are available.
2. Traces if enabled and the missing clue is timing or call path.
3. Metrics to classify response behavior, invoke type, and resource pressure.
4. Limits to confirm whether service policy explains the pattern.
5. Debug flags when reproducing locally or when CLI/API request details remain unclear.

## Sources

- [Storing and Viewing Function Logs](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsexportingfunctionlogfiles.htm)
- [Function Metrics](https://docs.oracle.com/en-us/iaas/Content/Functions/Reference/functionsmetrics.htm)
- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
