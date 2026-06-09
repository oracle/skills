---
name: oci-functions-deploy
description: Build, configure, scaffold, and deploy OCI Functions from a local machine using a dependency-first, Fn-context-guided flow with argv-safe mutation execution, nonce-scoped confirmations, and a canonical lowercase machine-readable contract. Use when asked to validate/install Fn, OCI CLI, and Docker, configure or create Fn contexts, validate OCI session and Docker registry auth from Fn context values, choose or create a Functions application, scaffold Java, Python, or Node functions, and deploy them. Network creation is supported only as an explicit advanced branch.
---

# OCI Functions Deploy

## Overview

Use this skill for **local macOS/Linux OCI Functions workstations**. Windows automation is out of scope for this skill and should be handled manually. OCI Cloud Shell is also out of scope for the current workflow; if the user is in Cloud Shell, do not reuse this local automation flow blindly.

This skill supports **Java, Python, and Node** scaffolding and deploy automation. OCI Functions supports additional runtimes, but they are not scaffolded or deployed automatically by this skill.

Resolve deployment values with this precedence everywhere in the flow:
- explicit user-provided values collected in chat or passed as script flags
- active Fn context values
- derived values from already-resolved inputs
- OCI/CLI defaults

Execution modes:
- `interactive`: confirmations are gathered via terminal prompts for mutating actions.
- `agent-mediated`: confirmations are per-command and single-use. Approval must include `CONFIRM_RESPONSE=yes`, a matching `CONFIRM_ACTION_ID`, and the nonce emitted for that exact mutation in `CONFIRM_NONCE`.

## Read vs Mutate Policy

- `read`: dependency checks, context inspection, OCI session validation, Docker auth inspection, application listing, dry-run validation. Run without confirmation.
- `mutate`: install/start, create/update contexts, Docker login, app creation, advanced network creation, `fn init`, and `fn deploy`. Require confirmation.
- If a command is ambiguous, treat it as mutating and confirm it.

### Gating Table

| Step | Classification | Confirmation |
|---|---|---|
| dependency availability checks | `read` | not required |
| Fn context inspection | `read` | not required |
| OCI session validation and security-token retry check | `read` | not required |
| Docker registry auth inspection | `read` | not required |
| install missing `fn` / `oci` / `docker` | `mutate` | required |
| start Docker daemon | `mutate` | required |
| create or update Fn context | `mutate` | required |
| Docker login to Fn registry | `mutate` | required |
| create Functions app | `mutate` | required |
| advanced network creation (`ensure_network.sh`) | `mutate` | required |
| scaffold function with `fn init` | `mutate` | required |
| deploy with `fn deploy` | `mutate` | required |

## Confirm Interface

Mutating scripts must use the structured confirmation interface:

`confirm_gate.sh --description <text> [--display <text>] [--cwd <path>] [--stdin-env <env>] [--nonce <nonce>] [--machine-readable] -- <argv...>`

Rules:
- Execute argv directly, not through `bash -c`.
- Use `--cwd` instead of embedding `cd ... && ...`.
- Use `--stdin-env` for commands like `docker login --password-stdin`.
- Agent-mediated approvals are single-use. Replaying the same action id and nonce after a successful mutation is invalid.
- Interactive prompts mint a fresh nonce for each mutation prompt so the same command can be approved again later through a new prompt.
- `scripts/install_fn_linux.sh` is the only intentional high-risk exception to the normal install flow. It still runs as direct argv, but it downloads and executes the upstream Fn installer script.

## Function Name Rules

- Treat a function name as `provided` only when the user explicitly names it.
- Explicit naming includes phrases like `name it ...`, `call it ...`, `function name is ...`, or a structured flag such as `--function-name`.
- Descriptive phrases such as `hello world function`, `sample function`, `test function`, or `python function` describe intent only and must not be converted into a function name automatically.
- Never slugify a descriptive phrase into a function name without asking the user.
- It is acceptable to suggest a name derived from intent, but the user must explicitly confirm it before it is used.

### Function Name Contract

- `function_name_state=missing`: no explicit or prompted function name exists yet.
- `function_name_state=explicit`: the user explicitly named the function in chat or via `--function-name` with `--function-name-source explicit`.
- `function_name_state=prompted`: the name was gathered or confirmed via an explicit prompt.
- Only pass `--function-name` into `build_and_deploy.sh` when the state is `explicit` or `prompted`.
- If a likely name was inferred from prose, keep the state as `missing` and ask for the function name instead of forwarding it.

## Workflow

1. **Dependency availability**
- Run `scripts/preflight_check.sh --runtime <java|python|node>` to detect whether `fn`, `oci`, and `docker` are installed.
- If `fn` or `oci` is missing, prompt and run `scripts/install_missing.sh --tool <fn|oci>`.
- If Docker is missing, prompt and run `scripts/install_missing.sh --tool docker`.
- If Docker exists but the daemon is stopped, prompt and run `scripts/install_missing.sh --tool docker-daemon`.

2. **Fn context validation**
- Use `fn inspect context` as the primary source of `oracle.profile`, `oracle.compartment-id`, `api-url`, and `registry`.
- Precedence is always: explicit user-provided values and script flags, then the active Fn context, then derived values, then OCI/CLI defaults.
- If the active Fn context is missing or incomplete, collect only missing values and run `scripts/configure_context.sh`.
- `scripts/configure_context.sh` is the deliberate mutation path for applying explicit user-provided overrides to the active context.
- Support optional `oracle.image-compartment-id` only when the user explicitly provides it or when an existing context already carries it.

3. **OCI CLI validation**
- Validate OCI session using the profile from Fn context.
- If validation fails with a retryable security-token style error, prompt the user and retry validation with `security_token` auth before surfacing failure.
- Stop the flow if OCI auth remains invalid.
- Any OCI CLI nonzero exit is `error` unless the command succeeded and positively proved absence through an empty result.

4. **Docker registry validation**
- Derive registry host from Fn context `registry`.
- Use a live, non-mutating registry probe before claiming auth is valid.
- Treat cached Docker credentials as `cached`, not `valid`, when the registry probe cannot safely confirm them.
- If Docker auth is `missing` or still insufficient after the probe, prompt for OCIR credentials and run `scripts/configure_context.sh --ocir-username ... --ocir-auth-token ...` or an equivalent Docker login step.

5. **Application selection**
- Run `scripts/discover_state.sh` after prerequisites are valid.
- Use the Fn context compartment to list available Functions applications.
- If apps exist, explicitly ask whether to reuse an existing app or create a new one.
- If reusing, keep the selected app name/id for later deploy.
- If creating, gather required details and run `scripts/ensure_app.sh`.
- If `app_name` matches an existing application but `app_choice` was never stated, prompt in interactive mode and fail in non-interactive mode; never silently reuse.
- Application creation supports `1-3` subnet OCIDs, optional application shape (`GENERIC_X86`, `GENERIC_ARM`, or `GENERIC_X86_ARM`), and optional NSG attachment.
- Shape and NSG inputs are create-only. Do not silently ignore them on a reuse path.
- Do not infer VCN/subnet creation from ordinary app selection.
- Only enter the advanced network branch when the user explicitly asks for network setup, or when app/network prerequisites are missing and the user explicitly opts into infrastructure creation.
- Non-interactive network creation requires an explicit branch flag and explicit topology, names, and CIDRs.
- Do not claim to auto-validate registry/subnet regional alignment. If the user is mixing explicit network inputs and an existing registry, surface region alignment as a manual check instead of guessing.

6. **Function prompts and scaffolding**
- Ask for the function name unless the user has explicitly named it.
- Do not treat descriptive intent phrases as the function name.
- Ask for runtime if it is not already explicit.
- This skill's runtime scope is `java`, `python`, or `node`.
- Run `scripts/build_and_deploy.sh --runtime <runtime> --app <app-name> --function-dir <path> --function-name <name> --function-name-source <explicit|prompted>`.
- The script scaffolds `func.yaml` and starter code with `fn init` only after prerequisites and app choice are complete.
- If the function directory is not provided, derive the default suggestion only after the function name has been explicitly confirmed.
- If the requested function directory already exists, is not empty, and does not contain `func.yaml`, stop and ask for a different directory instead of running `fn init` in place.

7. **Deploy**
- Run `fn deploy` only after successful scaffolding.
- If scaffold or deploy fails, surface the failure and stop; do not rewrite image references automatically.
- If deploy fails while pushing to OCIR, surface repository-compartment and repository-auto-create edge cases explicitly. Recommend pre-creating the repository or setting `oracle.image-compartment-id` before retrying when the failure output points that way.

## Confirmation Rules

- Use `scripts/confirm_gate.sh` for all mutating commands only.
- Read-only validation and listing steps run automatically.
- In non-interactive runs, mutating actions proceed only with explicit per-command approval (`CONFIRM_RESPONSE=yes`, matching `CONFIRM_ACTION_ID`, and matching `CONFIRM_NONCE`).
- `CONFIRM_RESPONSE=yes` without a matching action id and nonce is invalid.

## Input Collection Order

Only prompt for missing values after discovery:

1. Missing dependency install/start approvals
2. Missing Fn context values
3. OCI security-token retry approval, if applicable
4. OCIR login inputs, only if Docker is not logged into the Fn registry
5. Application decision (`reuse` vs `create`) when existing apps are found
6. Application inputs, only if app creation is needed
7. Advanced network branch approval and inputs, only if the user explicitly opts into infrastructure creation
8. Function name and runtime, only if not already provided
9. Preserve function-name provenance (`explicit` vs `prompted`) when calling the scaffold script

## Machine-Readable Contract

Use lowercase snake_case only.

All user-facing helper scripts in this skill accept `--machine-readable`. In that mode:
- stdout must contain only lowercase `key=value` lines
- human logs move to stderr
- downstream parsers must rely on documented keys only

Canonical state families:
- `dependency_fn_state`, `dependency_oci_state`, `dependency_docker_state`, `dependency_java_state`, `dependency_mvn_state`, `dependency_python3_state`, `dependency_node_state`, `dependency_npm_state`: `found|missing`
- `docker_daemon_state`: `running|stopped|missing|error`
- `fn_context_state`: `found|missing|incomplete|error`
- `apps_state`, `vcns_state`: `found|empty|error`
- `app_state`: `found|missing|incomplete|error`
- `oci_cli_state`, `compartment_state`, `discovery_state`, `network_state`: `found|missing|error`
- `oci_auth_state`, `docker_registry_auth_state`, `ocir_auth_state`: `valid|cached|missing|error`
- `docker_registry_auth_probe_state`: `valid|cached|missing|error`
- `confirm_state`: `approved|skipped|error`
- `app_action`, `deploy_action`: `reuse|create|deploy|skip|error`
- `deploy_preflight_state`: `passed|skipped`
- `install_state`: `success|error`
- `function_name_state`: `explicit|prompted|missing`

Companion fields:
- `*_error_reason`: one of `auth_or_permission`, `runtime_or_cli`, `network_or_transport`, or a more specific documented reason
- `oci_auth_error`
- `fn_context_missing_keys`
- `confirm_action_id`
- `confirm_nonce`
- `oci_auth_mode`
- `oci_auth_retry_state`
- `oci_profile`
- `oci_profile_source`
- `docker_registry_host`
- `fn_context_name`
- `fn_context_provider`
- `fn_context_profile`
- `fn_context_compartment_id`
- `fn_context_api_url`
- `fn_context_registry`
- `fn_context_image_compartment_id`
- `region`
- `compartment_id`
- `profile`
- `app_id`
- `app_name`
- `apps_count`
- `app_item_<n>`
- `vcn_id`
- `subnet_id`
- `install_method`
- `function_name`

Hard rules:
- Do not emit uppercase env-style keys.
- Do not use `unknown` in the canonical contract.
- Successful empty collections must be `empty`.
- Failed CLI/runtime operations must be `error`.

## Decision Table

Use the following deterministic behavior after discovery:

| Target | `found` | `missing` or `empty` | `error` |
|---|---|---|---|
| VCN / Subnet | Reuse existing app/network resources only when the user explicitly enters the advanced network branch | Stay out of the default deploy flow; collect inputs only after explicit advanced-branch approval | Stop and escalate (credentials/IAM/permissions) |
| Functions App | If apps exist, require explicit reuse-vs-create decision before proceeding | Create after collecting app/subnet inputs with confirmation; support 1-3 subnet IDs plus optional shape and NSGs only on create | Stop and escalate |
| Fn Context | Reuse active Oracle Fn context values unless explicit user-provided values intentionally override them through `configure_context.sh` | Create or fill missing values with confirmation | Stop and escalate |
| OCI Session | Validate using `oracle.profile` from Fn context | Retry with `security_token` only after user approval, then stop if still invalid | Stop and escalate |
| OCIR Login | Reuse only after a successful live probe, or report `cached` if credentials exist but were not confirmed | Prompt for username/token only if needed, then confirm login | Stop and escalate |
| OCIR Repository / Compartment | Reuse existing settings when deploy succeeds | If push fails, surface repository auto-create and `oracle.image-compartment-id` possibilities explicitly | Stop and escalate |
| Function Name | Reuse only when explicitly named by the user | Ask and confirm before scaffolding; do not infer from descriptive prose | Stop and ask again |

## Advanced Network Guidance (OCI Functions)

Only use this branch after explicit user approval to create or repair OCI networking for Functions.

When creating network resources for OCI Functions:

- Prefer a private-first topology by default as a security baseline, not as an OCI requirement.
- Ensure subnets are regional and private for function execution.
- Use service gateway routing to Oracle Services Network for OCIR access in private topology.
- For public topology, use an internet gateway route (`0.0.0.0/0`).
- Accept any egress rule shape that genuinely permits required OCI registry/service access; do not rewrite a broader valid rule into a narrower one unnecessarily.
- Consider CIDR sizing using OCI Functions guidance before creating new subnets. Treat it as sizing guidance, not as an exact pass/fail requirement.

See:
- `references/functions-vcn-requirements.md`
- `references/cidr-sizing.md`
- `references/oci-functions-quickstart.md`

## Runtime Matrix

OCI Functions supports more runtimes than this skill handles automatically. This skill only automates:
- `java`: requires `java`, `mvn`
- `python`: requires `python3`
- `node`: requires `node`, `npm`

Use `scripts/preflight_check.sh` to validate dependency availability, Fn context completeness, OCI session state, and Docker registry auth state before scaffolding.

## Deploy Guardrail

- Before scaffold/deploy, run strict preflight checks.
- `--skip-preflight` must still pass a confirmation gate with high-risk warning text.
- In `--machine-readable` mode, emit lowercase machine-readable state lines only on stdout.
- Emit `function_name_state` and `function_name` before scaffolding so inferred-name bugs are visible in logs.

## Sources

- [Functions QuickStart on Local Host](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsquickstartlocalhost.htm)
- [Creating Applications](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscreatingapps.htm)
- [OCI CLI Command Reference: oci fn application create](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/fn/application/create.html)
- [Creating the VCN and Subnets to Use with OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscreatingvcn.htm)
- [CIDR Blocks and OCI Functions](https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionscidrblocks.htm)
- [OCI CLI Command Reference: oci network vcn create](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/network/vcn/create.html)
- [Pushing Images Using the Docker CLI](https://docs.oracle.com/en-us/iaas/Content/Registry/Tasks/registrypushingimagesusingthedockercli.htm)
