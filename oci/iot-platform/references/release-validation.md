# Public Skill Release Validation

Use this checklist before calling the `oci-iot-platform` skill ready to share.

## Automated Checks

From the `oci/iot-platform` skill directory, run:

```bash
bash tests/smoke.sh
```

```bash
bash tests/redaction_scan.sh
```

## Content Review

Check for:

- no internal tenancy names
- no private network-access or MCP bootstrap instructions
- no team-specific account setup
- no secrets or real OCIDs in examples
- no environment-specific behavior stated as a platform rule

## Manual Validation Scenarios

Validate at least one clean or minimally configured operator environment with public OCI CLI authentication. A separate tenancy is useful but not required when one is not available; the validation must prove the workflow can run without internal profiles, private setup, or MCP dependencies. Prefer a `security_token` auth profile or another documented public OCI CLI auth mode for this pass.

1. `IOT_DOMAIN_ID` bootstrap, including `--auth security_token` when using a security-token profile and explicit `--region` when the profile does not already select the domain's region
2. read-only discovery of domains and twins
3. model creation and readback
4. adapter creation and readback
5. twin instance creation and readback
6. test publish flow and content verification using a test-owned auth resource; do not reuse an existing certificate or secret
7. confirm the HTTPS publish URL includes the adapter `inboundEnvelope.referenceEndpoint`; posting to the bare device host is not a valid publish test
8. confirm normal publishing-device twins are `DIRECT` unless the validation intentionally covers a gateway/downstream topology

If Data API or direct DB guidance ships in the release, validate at least one example there too.

Also verify operator-resilience guidance remains public-safe and covers:

- bounded list pagination and lifecycle-state filtering, with no unbounded fleet scans
- SDK and CLI capability drift checks, including documented fallbacks when one surface lacks a feature
- gateway-aware twin validation, including child or downstream device context where relevant
- direct-vs-indirect instance creation guidance that does not use `INDIRECT` to avoid auth setup
- relationship direction and source/target filtering, not only broad relationship listing
- work-request status, log, and error inspection for asynchronous operations
- publish rejection triage for topic, auth, schema, domain, and lifecycle-state failures
- publish endpoint triage for missing or mismatched adapter reference endpoint paths
- raw-command final-state validation after command submission, not only accepted requests
- cleanup ordering that removes relationships, twins, adapters, and models safely
- optional MCP guidance that recognizes tool families and fallback rules without requiring MCP install or private bootstrap
- Data API collection guidance for snapshot, raw, historized, rejected, and raw-command records

## Release Blockers

Do not release if any of these are true:

- the skill requires internal-only tooling
- MCP is treated as required instead of optional
- MCP guidance omits direct CLI or SDK fallback behavior
- the smoke checks fail
- redaction scanning finds likely secrets
- the examples depend on undocumented tenant assumptions
- the default workflow cannot be followed with public docs plus OCI CLI
- default list guidance uses unbounded fleet scans before filters or `--limit`
- newer CLI flags are documented without a `oci ... --help` drift check or SDK fallback
- raw-command acceptance is treated as final completion evidence
- publish examples skip final twin-content or rejected-data verification
- publish examples omit the adapter reference endpoint path or imply that the bare device host is enough
- instance creation examples use `INDIRECT` to avoid supplying a direct-auth resource
- cleanup guidance omits dependency ordering or destructive-operation approval
