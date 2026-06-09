---
name: oci-functions-troubleshoot
description: Diagnose OCI Functions setup, control-plane, deployment, invocation, and observability issues using a deterministic triage workflow. Use when asked to classify Fn CLI errors, deploy or invoke failures, OCIR auth and registry issues, app-limit symptoms, logs, tracing, metrics, or limits. Diagnose first, prefer read-only checks, and do not execute fixes unless the user explicitly asks.
---

# OCI Function Troubleshoot

Use this skill to isolate the most likely cause of an OCI Functions problem from error text, command output, or observability signals.

This skill is diagnosis-first and non-mutating by default:
- prefer read-only checks
- do not edit Fn context, log into Docker, create or update apps, redeploy, or change infrastructure unless the user explicitly asks to execute a fix
- if the user wants the fix executed, finish the diagnosis first and hand off mutating remediation to `$oci-functions-deploy`

## Output Contract

Always answer in this exact shape:
- `stage`: one of `setup_or_control_plane`, `create`, `deploy`, `invoke`, `observability_first`
- `evidence`: 1-3 concrete facts from the user's error text, command, config, logs, metrics, or limits
- `most_likely_cause`: one primary cause, or a ranked top-2 shortlist when confidence is low
- `confidence`: `low`, `medium`, or `high`
- `next_confirming_check`: the single best read-only check to narrow or confirm the cause
- `smallest_safe_remediation`: the least invasive next action; if evidence is weak, this can be "collect more evidence with ..."
- `validation`: the follow-up step that proves the remediation worked

## Triage

1. If the user provides an exact error string, start with `references/error-patterns.md`.
2. Classify the issue from the failed action:
- `setup_or_control_plane`: local Fn/OCI/OCIR/tooling/auth/context/policy problems before normal app or function operations succeed
- `create`: application creation failures
- `deploy`: `fn deploy`, image build or push, `func.yaml`, app config, subnet annotation, or registry-target failures
- `invoke`: runtime invocation, HTTP, image pull, timeout, memory, networking, detached delivery, or response-limit failures after a function has been deployed
- `observability_first`: the user starts from logs, traces, metrics, limits, or "why is this function unhealthy?"
3. If the stage is ambiguous:
- ask exactly one disambiguating question when a single missing fact would change the stage
- otherwise present the top 2 plausible stages in ranked order and continue with the best read-only confirming check

## Minimum Facts

Capture the minimum facts before diagnosing:
- exact error text and HTTP status if present
- command or action that failed
- region, compartment/profile, app name, and function name if known
- whether the problem is local, deploy-time, invoke-time, or telemetry-first
- whether Fn CLI, OCI CLI, Docker, Logging, Monitoring, and Tracing access are available

## Preferred Read-Only Checks

Prefer non-mutating checks when tooling is available:
- `fn inspect context`
- `fn list apps`
- `fn inspect app <app-name>`
- `fn inspect function <app-name> <function-name>`
- read local `func.yaml`
- inspect environment values that can override expected behavior, especially `FN_REGISTRY`
- read logs, traces, metrics, and limits before recommending edits
- use `DEBUG=1` or `OCI_GO_SDK_DEBUG=v` only for additional diagnostic signal, not as a first fix

If tools or access are missing, stay docs-first:
- classify the failure from the error text
- use the phase reference file for likely causes
- use `references/error-patterns.md` when the text is the strongest clue

## Workflow

### Setup Or Control Plane

Use `references/setup-and-runtime.md` for:
- Fn CLI `401` and `404`
- OCI key, passphrase, and private key format problems
- wrong region, compartment, endpoint, or app/function target
- IAM, policy, dynamic-group, or network-resource authorization failures
- Docker registry unauthorized failures
- stale or outdated CLI behavior

Start with read-only checks:
- inspect active Fn context values
- verify the intended OCI profile, compartment, and region match the failing target
- confirm the registry host derived from the context
- for `404`, separate endpoint or name mismatches from IAM/policy or compartment-targeting issues before suggesting reconfiguration

### Application Creation

Use `references/create.md` for create-time failures.

Focus on:
- documented service-limit style failures such as maximum application count
- whether the request is going to the intended compartment and region
- whether IAM or compartment targeting is wrong when the error is not clearly limit-shaped
- whether the smallest safe path is reuse, cleanup, or a limit increase request

### Deployment

Use `references/deploy.md` for:
- `fn deploy` failures
- image build, push, or registry auth problems
- `func.yaml` schema issues
- wrong application context or missing subnet annotations
- architecture mismatch symptoms
- identity-domain or federated OCIR username issues

Check in this order:
- active Fn context and target app
- local `func.yaml`
- effective registry target, including `FN_REGISTRY`
- app annotations and subnet/network assumptions
- whether the failure is local build, image push, or service-side deploy
- `fn version` when architecture or stale-client symptoms are plausible

### Invocation

Use `references/invoke.md` for:
- request or response size limits
- throttling, detached delivery, or event-triggered retries
- client disconnect, image pull, DNS, timeout, memory, syslog, security-attribute, or dynamic-group failures
- subnet, DHCP, resolver, or service-availability failures

Check in this order:
- exact HTTP code and service error text
- whether the error happens before code starts, during init, during execution, or after execution but before delivery completes
- logs first for code/runtime clues when available
- traces next when enabled and downstream timing or dependency timing is unclear
- metrics next for error rate, latency, concurrency, and invoke-type trends
- limits last when the symptom suggests capacity pressure or service ceilings

### Observability First

Use `references/observability.md` when the user starts from symptoms instead of a single failing command.

Default observability sequence:
1. Logs: determine whether the function ran and whether application logging is enabled
2. Tracing: use traces when enabled and the missing clue is dependency timing, latency, or call path
3. Metrics: distinguish execution failure, throttling, detached delivery, latency, and capacity pressure
4. Limits: confirm whether create or invoke failures align with service limits
5. Debug flags: use `DEBUG=1` or `OCI_GO_SDK_DEBUG=v` only when reproducing locally or when request/SDK details are still missing

## Reference Map

- setup/control-plane issues: `references/setup-and-runtime.md`
- app creation issues: `references/create.md`
- deployment issues: `references/deploy.md`
- invocation issues: `references/invoke.md`
- logs, traces, metrics, limits, debug flags: `references/observability.md`
- exact strings to likely causes: `references/error-patterns.md`
- reusable prompt patterns: `references/example-prompts.md`

## Guardrails

- Diagnose and isolate first. Do not mutate local context, Docker auth, app config, deployed state, or infrastructure unless the user explicitly asks to execute a fix.
- If the user asks to execute the fix, complete the diagnosis summary first and hand off mutating repair work to `$oci-functions-deploy`.
- Do not start with mutating fixes when a read-only check can narrow the cause.
- Do not assume a `404` is only an endpoint or name problem; treat IAM, policy, compartment targeting, dynamic groups, and network-resource authorization as first-class alternatives.
- Do not assume a deploy issue is code-related until registry, app, client version, and network context are checked.
- Do not assume an invoke issue is platform-related until logs, traces, and metrics are checked.
- Treat `FN_REGISTRY`, active Fn context, app annotations, tracing availability, and service limits as common hidden causes.
- If the user gives only a partial symptom, ask for the exact error text or failing command before escalating to broad remediation.
- When evidence is partial, prefer a ranked shortlist of plausible causes over a single overconfident root cause.

## Sources

- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
- [Issues deploying applications and functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting_topic-Issues-deploying-applications-and-functions.htm)
- [Issues invoking functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting_topic-Issues-invoking-functions.htm)
- [Storing and Viewing Function Logs](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsexportingfunctionlogfiles.htm)
- [Function Metrics](https://docs.oracle.com/en-us/iaas/Content/Functions/Reference/functionsmetrics.htm)
- [Functions QuickStart on Local Host](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsquickstartlocalhost.htm)
