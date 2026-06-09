---
name: oci
description: Oracle Cloud Infrastructure skills for service-specific OCI workflows, including deployment, troubleshooting, networking, IAM, observability, CLI usage, SDKs, automation, and source-backed operational guidance.
---

# Oracle Cloud Infrastructure Skills

This domain contains Oracle Cloud Infrastructure skills organized by OCI service or operational area. Use it as the OCI table of contents: each service area should provide practical, source-backed guidance for setup, deployment, troubleshooting, security, observability, and safe operations.

OCI Functions is the first populated service area in this domain. Add future OCI service skills under their service-specific directories and update this table of contents as new coverage lands.

## How to Use This Domain

1. Start with the service routing table below.
2. Read only the service skill or reference file that matches the task.
3. Prefer read-only discovery and public Oracle sources before recommending changes.
4. Keep mutating OCI, CLI, Docker, infrastructure, IAM, and network actions behind explicit user approval.

## Directory Structure

```text
oci/
├── SKILL.md
└── functions/
    ├── oci-functions-deploy/
    │   ├── SKILL.md
    │   ├── agents/
    │   ├── references/
    │   ├── scripts/
    │   └── tests/
    └── oci-functions-troubleshoot/
        ├── SKILL.md
        ├── agents/
        └── references/
```

## Service Routing

| Service or Area | Starting Point |
|-------|----------------|
| OCI Functions deployment and local setup | `oci/functions/oci-functions-deploy/SKILL.md` |
| OCI Functions troubleshooting and observability | `oci/functions/oci-functions-troubleshoot/SKILL.md` |

## Key Starting Points

- `oci/functions/oci-functions-deploy/SKILL.md`
- `oci/functions/oci-functions-troubleshoot/SKILL.md`
- `oci/functions/oci-functions-deploy/references/oci-functions-quickstart.md`
- `oci/functions/oci-functions-troubleshoot/references/error-patterns.md`

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Deploy a local function | `oci-functions-deploy` preflight -> Fn context validation -> OCIR auth check -> app selection -> scaffold -> deploy |
| Troubleshoot a failed deploy | `oci-functions-troubleshoot` -> `references/error-patterns.md` -> `references/deploy.md` |
| Troubleshoot invocation failures | `oci-functions-troubleshoot` -> `references/invoke.md` -> logs, traces, metrics, and limits |

## Sources

- [Oracle Cloud Infrastructure documentation](https://docs.oracle.com/en-us/iaas/)
- [OCI Functions documentation](https://docs.oracle.com/en-us/iaas/Content/Functions/home.htm)
- [Functions QuickStart on Local Host](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsquickstartlocalhost.htm)
- [Creating Applications](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscreatingapps.htm)
- [Troubleshooting OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionstroubleshooting.htm)
