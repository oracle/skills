# Hosted Agentic Applications in OCI Generative AI

## Overview

Use hosted applications when the user needs to package and run an agent runtime on OCI-managed infrastructure instead of only calling the Responses API from an external application.

## When to Use Hosted Applications

Use this path when the workload needs:

- A packaged containerized agent runtime.
- OCI-managed hosting and autoscaling.
- Public or private application endpoints.
- Managed storage injected into the runtime.
- Customer networking mode for private resource access.
- OAuth integration through an OCI IAM identity-domain application.

Keep `agent-workflows/responses-api-agents.md` as the default for API-first agents. Move to hosted applications when the user needs to operate an application runtime, not just call model and tool APIs.

## Deployment Journey

1. Build the agent runtime as a container image.
2. Push the image to OCI Container Registry.
3. Create a Generative AI application with scaling, storage, networking, endpoint, and authentication settings.
4. Create a deployment that references the container image.
5. Activate the deployment and verify endpoint access.
6. Add cost, logging, service-limit, and rollback checks before production.

## Application Decisions

| Decision | Why It Matters |
|----------|----------------|
| Min and max replicas | Controls baseline cost and scaling ceiling |
| Autoscaling metric | Determines whether scaling follows RPS, concurrent requests, CPU, or memory |
| Managed storage | Adds stateful backing services and lifecycle implications |
| Customer networking mode | Routes outbound traffic through a customer subnet for private resources |
| Public vs private endpoint | Controls how users and systems invoke the application |
| Identity-domain application | Supports OAuth, SSO, identity propagation, and authorization |

## Invocation and Networking

Hosted application endpoints support common agent interaction patterns:

- HTTP for request/response invocations.
- Server-Sent Events for unidirectional streaming responses.
- WebSocket for bidirectional, long-lived sessions.

Choose the transport based on the agent server implementation and client interaction model. For private access, use a Generative AI private endpoint so clients invoke the application through the private endpoint FQDN from a connected VCN, peered VCN, VPN, or FastConnect path.

For outbound access, decide whether the runtime can use service-managed networking or needs customer networking mode to reach private resources in the user's VCN.

## Storage and Authentication

Managed storage can simplify agent state for memory, checkpoints, caching, and context storage. OCI documents managed storage options including PostgreSQL, OCI Cache, and Oracle Autonomous Database. Treat managed storage as application-scoped and lifecycle-coupled to the hosted application; if the user needs independent lifecycle, direct administration, custom tuning, or cross-application sharing, use customer-managed storage through customer networking mode.

Hosted applications use OAuth through an OCI IAM identity-domain application for inbound authentication. For outbound access to OCI services, use resource-principal based authorization and IAM policies instead of long-lived credentials in the container.

## Cost and Limits

Before recommending this path, check:

- Replica count and expected runtime hours.
- Managed storage type and lifecycle.
- Public or private endpoint design.
- HTTP, SSE, or WebSocket invocation shape and expected connection duration.
- Customer networking mode, private endpoint DNS proxy, and outbound traffic assumptions.
- Application, artifact, replica, managed-storage, and private-endpoint DNS proxy service limits.
- Whether the simpler Responses API path can satisfy the use case with lower operational overhead.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agents.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/applications.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-application.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/app-authentication.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/aurthentication.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/limits.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/private-endpoint.htm
