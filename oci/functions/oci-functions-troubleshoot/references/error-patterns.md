# Error Patterns

Use this file when the user leads with a raw error string.

## Fast Mapping

- `401 Unauthorized`
  - likely area: Fn context auth, OCI profile, security token, or OCIR auth
  - first checks: `fn inspect context`, OCI profile, registry auth state

- `404 Not Found` or `Resource is not authorized or not found`
  - likely area: wrong Functions endpoint, region, compartment, app/function name, or IAM/policy/dynamic-group/network-resource authorization
  - first checks: context `api-url`, active region, target resource names, compartment, recent policy changes

- `x509`, `passphrase`, `private key`
  - likely area: OCI CLI key material or config shape
  - first checks: profile paths, key format, passphrase alignment

- `unauthorized: authentication required`
  - likely area: OCIR login or wrong registry target
  - first checks: registry host, OCIR username format, `FN_REGISTRY`

- `Maximum applications exceeded` or similar
  - likely area: Functions service limits
  - first checks: application count and remaining regional limit

- `TooManyRequests` or `429`
  - likely area: throttling, concurrency pressure, or service-side rate control
  - first checks: response metrics, concurrency metrics, recent traffic increase

- `FunctionInvokeExecutionFailed`
  - likely area: user code or downstream dependency after execution started
  - first checks: logs, traces, response metrics

- `FunctionInvokeImageNotAvailable` or `image pull`
  - likely area: image pull, registry access, image availability, or VCN gateway/routing
  - first checks: deployed image reference, OCIR reachability, app networking, recent image push status

- `FunctionInvokeSyslogUnavailable`
  - likely area: external logging endpoint reachability or syslog config
  - first checks: syslog target config, network reachability, recent logging changes

- `FunctionInvokeResponseBodyTooLarge`, `FunctionInvokeResponseHeaderTooLarge`, `response body too large`, or `response headers too large`
  - likely area: function response exceeds platform limits
  - first checks: response size, header count/size, whether large data should be returned indirectly

- `FunctionInvokeContainerInitFail`
  - likely area: startup, dependency, DNS, or memory problem
  - first checks: early logs, image contents, startup path, memory setting

- `FunctionInvokeTimeout`
  - likely area: long startup, slow downstream dependency, or too-short function timeout
  - first checks: execution duration trends, logs, downstream call latency

- `FunctionInvokeTooManyMatchingDGs`, `FunctionInvokeSecurityAttributeNotAvailable`, `dynamic groups`, or `security attributes`
  - likely area: IAM or org configuration
  - first checks: exact OCI error text, recent identity-policy changes, compartment and identity setup

- `FunctionInvokeSubnetConfigError`, `Customer subnet DNS resolver error`, `custom resolver`, or `DNS resolver`
  - likely area: subnet, DHCP, resolver, or DNS configuration
  - first checks: subnet config, DHCP options, resolver assumptions, downstream name-resolution failures

- `ServiceUnavailable` or `503`
  - likely area: transient capacity ramp-up, cold ramp, or unreachable dependency
  - first checks: retry pattern, invoke type, metrics spike timing, dependency health

## Usage Rule

Treat this file as the triage shortcut, then switch to the phase-specific reference once the likely stage is clear.

## Sources

- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
- [Issues deploying applications and functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting_topic-Issues-deploying-applications-and-functions.htm)
- [Issues invoking functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting_topic-Issues-invoking-functions.htm)
