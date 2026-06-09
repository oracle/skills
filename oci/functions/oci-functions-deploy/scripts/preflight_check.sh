#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

RUNTIME=""
PROFILE_FALLBACK=""
STRICT="false"
MACHINE_READABLE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runtime)
      RUNTIME="${2:-}"
      shift 2
      ;;
    --profile)
      PROFILE_FALLBACK="${2:-}"
      shift 2
      ;;
    --strict)
      STRICT="true"
      shift
      ;;
    --machine-readable)
      # Used by common.sh:is_machine_readable after argument parsing.
      # shellcheck disable=SC2034
      MACHINE_READABLE="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

missing=()
warns=()

check_cmd() {
  local name="$1"
  local state_key
  state_key="$(printf '%s' "$name" | tr '[:upper:]-' '[:lower:]_')"
  if command -v "$name" >/dev/null 2>&1; then
    local ver
    ver="$($name --version 2>/dev/null | head -n 1 || true)"
    log_ok "$name found${ver:+: $ver}"
    echo "dependency_${state_key}_state=found"
  else
    log_missing "$name"
    echo "dependency_${state_key}_state=missing"
    missing+=("$name")
  fi
}

parse_fn_context() {
  FN_CONTEXT_NAME=""
  FN_CONTEXT_PROVIDER=""
  FN_CONTEXT_PROFILE=""
  FN_CONTEXT_COMPARTMENT_ID=""
  FN_CONTEXT_API_URL=""
  FN_CONTEXT_REGISTRY=""
  FN_CONTEXT_IMAGE_COMPARTMENT_ID=""

  local context_out
  context_out="$(fn inspect context 2>/dev/null || fn list context 2>/dev/null || true)"
  [[ -n "$context_out" ]] || return 1

  FN_CONTEXT_NAME="$(awk -F': ' '/^Current context:/ {print $2; exit}' <<<"$context_out" || true)"
  FN_CONTEXT_PROVIDER="$(awk -F': ' '/^provider:/ {print $2; exit}' <<<"$context_out" || true)"
  FN_CONTEXT_PROFILE="$(awk -F': ' '/^oracle.profile:/ {print $2; exit}' <<<"$context_out" || true)"
  FN_CONTEXT_COMPARTMENT_ID="$(awk -F': ' '/^oracle.compartment-id:/ {print $2; exit}' <<<"$context_out" || true)"
  FN_CONTEXT_API_URL="$(awk -F': ' '/^api-url:/ {print $2; exit}' <<<"$context_out" || true)"
  FN_CONTEXT_REGISTRY="$(awk -F': ' '/^registry:/ {print $2; exit}' <<<"$context_out" || true)"
  FN_CONTEXT_IMAGE_COMPARTMENT_ID="$(awk -F': ' '/^oracle.image-compartment-id:/ {print $2; exit}' <<<"$context_out" || true)"
  return 0
}


log_section "Phase 1: Dependency availability"
check_cmd fn
check_cmd oci
check_cmd docker

human_out ""
log_section "Runtime-specific tools"
case "$RUNTIME" in
  java)
    check_cmd java
    check_cmd mvn
    ;;
  python)
    check_cmd python3
    ;;
  node)
    check_cmd node
    check_cmd npm
    ;;
  "")
    log_info "No runtime supplied; skipping runtime-specific checks."
    ;;
  *)
    log_warn "Unsupported runtime '$RUNTIME' (expected java|python|node)."
    warns+=("runtime:$RUNTIME")
    ;;
esac

human_out ""
log_section "Docker daemon"
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    log_ok "Docker daemon is running"
    echo "docker_daemon_state=running"
  else
    log_warn "Docker installed but daemon is not running"
    echo "docker_daemon_state=stopped"
    warns+=("docker-daemon")
  fi
else
  echo "docker_daemon_state=missing"
fi

human_out ""
log_section "Phase 2: Fn context validation"
FN_CONTEXT_NAME=""
FN_CONTEXT_PROVIDER=""
FN_CONTEXT_PROFILE=""
FN_CONTEXT_COMPARTMENT_ID=""
FN_CONTEXT_API_URL=""
FN_CONTEXT_REGISTRY=""
FN_CONTEXT_IMAGE_COMPARTMENT_ID=""
if command -v fn >/dev/null 2>&1 && parse_fn_context; then
  echo "fn_context_name=${FN_CONTEXT_NAME:-}"
  echo "fn_context_provider=${FN_CONTEXT_PROVIDER:-}"
  echo "fn_context_profile=${FN_CONTEXT_PROFILE:-}"
  echo "fn_context_compartment_id=${FN_CONTEXT_COMPARTMENT_ID:-}"
  echo "fn_context_api_url=${FN_CONTEXT_API_URL:-}"
  echo "fn_context_registry=${FN_CONTEXT_REGISTRY:-}"
  echo "fn_context_image_compartment_id=${FN_CONTEXT_IMAGE_COMPARTMENT_ID:-}"

  missing_fn_keys=()
  [[ -n "$FN_CONTEXT_COMPARTMENT_ID" ]] || missing_fn_keys+=("oracle.compartment-id")
  [[ -n "$FN_CONTEXT_PROFILE" ]] || missing_fn_keys+=("oracle.profile")
  [[ -n "$FN_CONTEXT_API_URL" ]] || missing_fn_keys+=("api-url")
  [[ -n "$FN_CONTEXT_REGISTRY" ]] || missing_fn_keys+=("registry")

  if [[ -z "$FN_CONTEXT_PROVIDER" || "$FN_CONTEXT_PROVIDER" != "oracle" ]]; then
    log_warn "Active Fn context is missing or not using provider 'oracle'"
    warns+=("fn-context:provider")
  fi

  if [[ ${#missing_fn_keys[@]} -eq 0 && -n "$FN_CONTEXT_NAME" ]]; then
    log_ok "Fn context is defined and contains the required values"
    echo "fn_context_state=found"
  elif [[ -n "$FN_CONTEXT_NAME" || -n "$FN_CONTEXT_PROVIDER" || -n "$FN_CONTEXT_API_URL" || -n "$FN_CONTEXT_REGISTRY" || -n "$FN_CONTEXT_PROFILE" || -n "$FN_CONTEXT_COMPARTMENT_ID" ]]; then
    log_warn "Fn context exists but is incomplete"
    echo "fn_context_state=incomplete"
    echo "fn_context_missing_keys=${missing_fn_keys[*]:-provider}"
    warns+=("fn-context:incomplete")
  else
    log_warn "No active Fn context was discovered"
    echo "fn_context_state=missing"
    warns+=("fn-context:missing")
  fi
else
  log_warn "No active Fn context was discovered"
  echo "fn_context_state=missing"
  warns+=("fn-context:missing")
fi

human_out ""
log_section "OCI CLI session validation"
resolved_profile=""
if [[ -n "$PROFILE_FALLBACK" ]]; then
  resolved_profile="$PROFILE_FALLBACK"
  echo "oci_profile_source=explicit_flag"
elif [[ -n "$FN_CONTEXT_PROFILE" ]]; then
  resolved_profile="$FN_CONTEXT_PROFILE"
  echo "oci_profile_source=fn_context"
else
  echo "oci_profile_source=missing"
fi
echo "oci_profile=${resolved_profile:-}"

if command -v oci >/dev/null 2>&1; then
  if [[ -f "$HOME/.oci/config" ]]; then
    log_ok "OCI config exists at $HOME/.oci/config"
  else
    log_warn "OCI config not found at $HOME/.oci/config"
    warns+=("oci-config")
  fi

  if [[ -n "$resolved_profile" ]]; then
    oci_err=""
    if run_oci_capture _oci_out oci_err iam region list --profile "$resolved_profile" --all; then
      log_ok "OCI profile '$resolved_profile' validated successfully"
      echo "oci_auth_state=valid"
      echo "oci_auth_mode=default"
    else
      retry_succeeded="no"
      if grep -Eiq 'security[_ -]?token|session token|token-based profile|must use.*security_token|use.*security_token|OCI_CLI_AUTH=security_token' <<<"$oci_err"; then
        echo "oci_auth_retry_state=available"
        if is_interactive; then
          read -r -p "OCI profile '$resolved_profile' may require security_token auth. Retry validation with security_token? [y/N]: " retry_reply
          case "$(normalize_reply "$retry_reply")" in
            y|yes)
              if OCI_CLI_AUTH=security_token run_oci_capture _retry_out _retry_err iam region list --profile "$resolved_profile" --all; then
                log_ok "OCI profile '$resolved_profile' validated with security_token auth"
                echo "oci_auth_state=valid"
                echo "oci_auth_mode=security_token"
                retry_succeeded="yes"
              else
                log_warn "OCI profile '$resolved_profile' still failed with security_token auth"
                echo "oci_auth_retry_state=failed"
                warns+=("oci-profile:$resolved_profile")
              fi
              ;;
            *)
              echo "oci_auth_retry_state=declined"
              warns+=("oci-profile:$resolved_profile")
              ;;
          esac
        else
          echo "oci_auth_retry_state=approval_required"
          warns+=("oci-profile:$resolved_profile")
        fi
      fi

      if [[ "$retry_succeeded" != "yes" ]]; then
        log_warn "OCI profile '$resolved_profile' could not be validated"
        echo "oci_auth_state=error"
        echo "oci_auth_error_reason=$(classify_oci_error_reason "$oci_err")"
        echo "oci_auth_error=$(tr '\n' ' ' <<<"$oci_err" | sed 's/[[:space:]]\+/ /g')"
        warns+=("oci-profile:$resolved_profile")
      fi
    fi
  else
    log_warn "No OCI profile could be resolved from Fn context"
    echo "oci_auth_state=missing"
    warns+=("oci-profile:missing")
  fi
fi

human_out ""
log_section "Docker registry validation"
registry_host=""
if [[ -n "$FN_CONTEXT_REGISTRY" ]]; then
  registry_host="${FN_CONTEXT_REGISTRY%%/*}"
  echo "docker_registry_host=$registry_host"
  registry_auth_state="$(docker_registry_auth_probe "$registry_host")"
  case "$registry_auth_state" in
    valid)
      log_ok "Docker registry auth for '$registry_host' was validated live"
      echo "docker_registry_auth_state=valid"
      echo "docker_registry_auth_probe_state=valid"
      ;;
    cached)
      log_warn "Docker has cached auth for '$registry_host', but live validation did not confirm it"
      echo "docker_registry_auth_state=cached"
      echo "docker_registry_auth_probe_state=cached"
      warns+=("docker-auth:$registry_host")
      ;;
    error)
      echo "docker_registry_auth_state=error"
      echo "docker_registry_auth_probe_state=error"
      echo "docker_registry_auth_error_reason=runtime_or_cli"
      warns+=("docker-auth:$registry_host")
      ;;
    *)
      log_warn "Docker is not logged in to '$registry_host'"
      echo "docker_registry_auth_state=missing"
      echo "docker_registry_auth_probe_state=missing"
      warns+=("docker-auth:$registry_host")
      ;;
  esac
else
  log_warn "Fn context does not define a registry yet"
  echo "docker_registry_auth_state=missing"
  echo "docker_registry_auth_probe_state=missing"
  warns+=("docker-auth:registry-missing")
fi

human_out ""
log_section "Summary"
if [[ ${#missing[@]} -eq 0 ]]; then
  human_out "Missing tools: none"
else
  human_out "Missing tools: ${missing[*]}"
fi
if [[ ${#warns[@]} -eq 0 ]]; then
  human_out "Warnings: none"
else
  human_out "Warnings: ${warns[*]}"
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  exit 2
fi

if [[ "$STRICT" == "true" && ${#warns[@]} -gt 0 ]]; then
  exit 3
fi
