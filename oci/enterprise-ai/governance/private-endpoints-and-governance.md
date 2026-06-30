# Private Endpoints and Governance for Enterprise AI

## Overview

Use this file when the user needs to secure, govern, or operate Oracle Enterprise AI workloads. Treat governance as part of the design journey, not a production add-on.

## Governance Areas

| Area | Purpose |
|------|---------|
| IAM policies | Control who can use, manage, or administer Generative AI resources |
| API keys | Provide service-generated access credentials for supported Generative AI APIs |
| IAM-based OpenAI-compatible auth | Use signed OCI auth helpers for production and OCI-managed environments |
| OAuth | Support agentic tasks that require OCI IAM identity-domain application integration |
| Private endpoints | Keep model or agent access inside private network boundaries |
| Zero Trust Packet Routing | Add identity-based network enforcement where supported |
| Guardrails | Apply runtime safety and compliance controls to inputs and outputs |
| Logging and audit | Trace requests, tool calls, endpoint use, and operational failures |
| Projects and retention | Bound agent artifacts, conversations, memory, files, and containers by lifecycle policy |
| Service limits | Check project, application, private endpoint, and hosted deployment limits before production |

## Private Endpoint Journey

1. Confirm why private access is required: compliance, data residency, no public exposure, or internal-only clients.
2. Identify the calling network: same VCN, peered VCN, on-premises through VPN or FastConnect, or bastion administration.
3. Create or select a private subnet, routing, DNS, NSG, and security list posture.
4. Create the Generative AI private endpoint and capture its FQDN.
5. Attach or use the private endpoint according to model or agent endpoint requirements.
6. Test from a client inside the private network and verify the FQDN resolves to the private IP.

Private endpoints can be used for on-demand models when enabled for on-demand mode, and for pretrained or custom models hosted on dedicated AI clusters when attached to model endpoints. Common private access paths include same-VCN clients, peered VCNs, on-premises networks through VPN or FastConnect, and bastion-administered private hosts.

By default, the documented private endpoint tenancy limit is small, so confirm `private-endpoint-count` before designing one private endpoint per app, environment, or business unit.

## Zero Trust Packet Routing

Use ZPR security attributes when the private endpoint needs identity-based network enforcement in addition to route tables, NSGs, and security lists. If a ZPR security attribute is assigned to a private endpoint, traffic is blocked unless an explicit ZPR policy allows it. Validate policies before applying attributes to avoid outages.

## Guardrails

Use guardrails when the application needs runtime controls for:

- Content moderation.
- Prompt injection defense.
- PII handling.

Do not assume guardrails are automatically enabled for every model or endpoint. Verify the endpoint and model configuration before claiming protection is active.

Guardrails can be applied to on-demand workflows through `ApplyGuardrails` and to supported dedicated AI cluster endpoints. For endpoints, choose the enforcement mode deliberately:

- Inform mode evaluates and returns guardrail results without blocking the request.
- Block mode rejects detected violations, but error responses do not expose detailed category results.

Pin a guardrail version only after checking available versions and lifecycle state. If a specific version is not configured, the service uses its default version behavior. Also check language coverage; PII detection is documented for English, while content moderation and prompt-injection coverage spans a broader language set.

## IAM and Secrets Guidance

- Use least-privilege policies for users, groups, dynamic groups, applications, and service resources.
- Use OCI Generative AI API keys for testing and early development; use IAM-based authentication for production workloads and OCI-managed environments.
- For API keys, record key names, expiration dates, compartment, and required permissions; default key expiration values can be short enough to break unattended prototypes.
- For OpenAI-compatible SDK usage with IAM auth, use the OCI auth helper library rather than embedding long-lived credentials.
- Keep API keys and OAuth secrets out of prompts, code examples, logs, and uploaded files.
- Prefer resource principals, instance principals, or managed identity patterns where service-to-service access supports them.
- Separate model invocation permissions from resource administration permissions.
- For hosted applications, configure OAuth through an OCI identity-domain application for inbound access, and use resource principals plus IAM policy for outbound access to OCI resources.

## Production Checklist

- Region, model, and tool availability verified.
- IAM policies reviewed for least privilege.
- Private endpoint or public endpoint decision recorded.
- Guardrails enabled where required by policy.
- Logging and audit path defined.
- Retention policy defined for conversations, files, vector stores, containers, and memory.
- Service limits checked for projects, applications, artifacts, private endpoint DNS proxies, managed storage, and replica counts where relevant.
- Cost-estimation inputs collected for model calls, tools, storage, retrieval, memory, and hosted deployment runtime.
- Tool authorization and destructive-action approval paths documented.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/governance.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/private-endpoint.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/concepts.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/access.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/iam-policies.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-api-key.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/oci-genai-auth.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/app-authentication.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/aurthentication.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/guardrails.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/manage-security-attributes.htm
- https://docs.oracle.com/en-us/iaas/Content/zero-trust-packet-routing/overview.htm
- https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/overview.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/projects.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/limits.htm
