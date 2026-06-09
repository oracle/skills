# Example Prompts

- Use $oci-functions-troubleshoot to troubleshoot this `fn deploy` error: `<paste exact error>`. Stay diagnosis-only and answer with `stage`, `evidence`, `most_likely_cause`, `confidence`, `next_confirming_check`, `smallest_safe_remediation`, and `validation`.

- Use $oci-functions-troubleshoot to classify this OCI Functions invocation failure: HTTP `429` with error `<paste error>`. Stay diagnosis-only, answer with `stage`, `evidence`, `most_likely_cause`, `confidence`, `next_confirming_check`, `smallest_safe_remediation`, and `validation`, and make `next_confirming_check` the first signal to inspect.

- Use $oci-functions-troubleshoot to analyze this deploy transcript and identify whether the problem is local build, OCIR auth, Fn context, app config, or client version: `<paste transcript>`. Stay diagnosis-only and answer with `stage`, `evidence`, `most_likely_cause`, `confidence`, `next_confirming_check`, `smallest_safe_remediation`, and `validation`.

- Use $oci-functions-troubleshoot to distinguish code failure from platform, IAM, or network failure using logs, traces, metrics, and limits for this function: `<paste telemetry summary>`. Stay diagnosis-only and answer with `stage`, `evidence`, `most_likely_cause`, `confidence`, `next_confirming_check`, `smallest_safe_remediation`, and `validation`.

- Use $oci-functions-troubleshoot to inspect this Fn context and OCI region configuration and identify whether the likely problem is endpoint mismatch, compartment targeting, or IAM/policy setup: `<paste fn inspect context output>`. Stay diagnosis-only and answer with `stage`, `evidence`, `most_likely_cause`, `confidence`, `next_confirming_check`, `smallest_safe_remediation`, and `validation`.

- Use $oci-functions-troubleshoot to debug this OCI Functions error string: `<paste exact error>`. Stay diagnosis-only, answer with `stage`, `evidence`, `most_likely_cause`, `confidence`, `next_confirming_check`, `smallest_safe_remediation`, and `validation`, and if evidence is partial put the top 2 likely causes in rank order inside `most_likely_cause`.

## Sources

- [OCI Functions documentation](https://docs.oracle.com/en-us/iaas/Content/Functions/home.htm)
- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
