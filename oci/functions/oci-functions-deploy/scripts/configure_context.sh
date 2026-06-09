#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIRM="$SCRIPT_DIR/confirm_gate.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

CONTEXT_NAME=""
REGION=""
API_URL=""
COMPARTMENT_ID=""
PROFILE=""
REGISTRY=""
IMAGE_COMPARTMENT_ID=""
OCIR_USERNAME=""
OCIR_AUTH_TOKEN=""
MACHINE_READABLE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --context-name)
      CONTEXT_NAME="${2:-}"
      shift 2
      ;;
    --region)
      REGION="${2:-}"
      shift 2
      ;;
    --api-url)
      API_URL="${2:-}"
      shift 2
      ;;
    --compartment)
      COMPARTMENT_ID="${2:-}"
      shift 2
      ;;
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --registry)
      REGISTRY="${2:-}"
      shift 2
      ;;
    --image-compartment-id)
      IMAGE_COMPARTMENT_ID="${2:-}"
      shift 2
      ;;
    --ocir-username)
      OCIR_USERNAME="${2:-}"
      shift 2
      ;;
    --ocir-auth-token)
      OCIR_AUTH_TOKEN="${2:-}"
      shift 2
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

run_confirmed() {
  local description="$1"
  local display="$2"
  local stdin_env="$3"
  shift 3

  local nonce
  local confirm_args=()
  nonce="$(next_confirm_nonce)"
  if is_machine_readable; then
    confirm_args+=(--machine-readable)
  fi
  if [[ -n "$stdin_env" ]]; then
    "$CONFIRM" --description "$description" --display "$display" "${confirm_args[@]}" --stdin-env "$stdin_env" --nonce "$nonce" -- "$@"
  else
    "$CONFIRM" --description "$description" --display "$display" "${confirm_args[@]}" --nonce "$nonce" -- "$@"
  fi
}

prompt_if_missing() {
  local current_value="$1"
  local prompt="$2"
  local out_var="$3"
  local value="$current_value"

  if [[ -z "$value" ]]; then
    if ! is_interactive; then
      echo "[ERROR] Missing required input: $prompt" >&2
      echo "[HINT] Supply the corresponding flag when running non-interactively." >&2
      exit 2
    fi
    read -r -p "$prompt" value
  fi

  printf -v "$out_var" "%s" "$value"
}

parse_fn_context() {
  CURRENT_CONTEXT_NAME=""
  CURRENT_PROVIDER=""
  CURRENT_PROFILE=""
  CURRENT_COMPARTMENT_ID=""
  CURRENT_API_URL=""
  CURRENT_REGISTRY=""
  CURRENT_IMAGE_COMPARTMENT_ID=""

  local context_out
  context_out="$(fn inspect context 2>/dev/null || true)"
  [[ -n "$context_out" ]] || return 1

  CURRENT_CONTEXT_NAME="$(awk -F': ' '/^Current context:/ {print $2; exit}' <<<"$context_out" || true)"
  CURRENT_PROVIDER="$(awk -F': ' '/^provider:/ {print $2; exit}' <<<"$context_out" || true)"
  CURRENT_PROFILE="$(awk -F': ' '/^oracle.profile:/ {print $2; exit}' <<<"$context_out" || true)"
  CURRENT_COMPARTMENT_ID="$(awk -F': ' '/^oracle.compartment-id:/ {print $2; exit}' <<<"$context_out" || true)"
  CURRENT_API_URL="$(awk -F': ' '/^api-url:/ {print $2; exit}' <<<"$context_out" || true)"
  CURRENT_REGISTRY="$(awk -F': ' '/^registry:/ {print $2; exit}' <<<"$context_out" || true)"
  CURRENT_IMAGE_COMPARTMENT_ID="$(awk -F': ' '/^oracle.image-compartment-id:/ {print $2; exit}' <<<"$context_out" || true)"
  return 0
}

build_api_url() {
  local region="$1"
  printf 'https://functions.%s.oci.oraclecloud.com' "$region"
}

CURRENT_CONTEXT_NAME=""
CURRENT_PROVIDER=""
CURRENT_PROFILE=""
CURRENT_COMPARTMENT_ID=""
CURRENT_API_URL=""
CURRENT_REGISTRY=""
CURRENT_IMAGE_COMPARTMENT_ID=""
parse_fn_context || true

if [[ -z "$CONTEXT_NAME" ]]; then
  CONTEXT_NAME="$CURRENT_CONTEXT_NAME"
fi
if [[ -z "$PROFILE" ]]; then
  PROFILE="$CURRENT_PROFILE"
fi
if [[ -z "$COMPARTMENT_ID" ]]; then
  COMPARTMENT_ID="$CURRENT_COMPARTMENT_ID"
fi
if [[ -z "$API_URL" ]]; then
  API_URL="$CURRENT_API_URL"
fi
if [[ -z "$REGISTRY" ]]; then
  REGISTRY="$CURRENT_REGISTRY"
fi
if [[ -z "$IMAGE_COMPARTMENT_ID" ]]; then
  IMAGE_COMPARTMENT_ID="$CURRENT_IMAGE_COMPARTMENT_ID"
fi
if [[ -z "$REGION" && -n "$API_URL" ]]; then
  REGION="$(extract_region_from_api_url "$API_URL")"
fi
if [[ -z "$API_URL" && -n "$REGION" ]]; then
  API_URL="$(build_api_url "$REGION")"
fi

needs_oracle_context="no"
if [[ -z "$CURRENT_CONTEXT_NAME" || -z "$CURRENT_PROVIDER" || "$CURRENT_PROVIDER" != "oracle" ]]; then
  needs_oracle_context="yes"
fi

if [[ "$needs_oracle_context" == "yes" ]]; then
  if [[ -n "$CURRENT_CONTEXT_NAME" && "$CURRENT_PROVIDER" != "oracle" && "$CONTEXT_NAME" == "$CURRENT_CONTEXT_NAME" ]]; then
    CONTEXT_NAME="${CURRENT_CONTEXT_NAME}-oracle"
  fi
  prompt_if_missing "$CONTEXT_NAME" "Fn context name to create/use: " CONTEXT_NAME
  prompt_if_missing "$REGION" "OCI region (for example eu-frankfurt-1): " REGION
  if [[ -z "$API_URL" ]]; then
    API_URL="$(build_api_url "$REGION")"
  fi
  prompt_if_missing "$REGISTRY" "OCI registry (for example fra.ocir.io/namespace/repo): " REGISTRY

  run_confirmed "Create Oracle Fn context '$CONTEXT_NAME'" "fn create context --provider oracle --api-url '$API_URL' --registry '$REGISTRY' '$CONTEXT_NAME'" "" fn create context --provider oracle --api-url "$API_URL" --registry "$REGISTRY" "$CONTEXT_NAME"
  run_confirmed "Use Fn context '$CONTEXT_NAME'" "fn use context '$CONTEXT_NAME'" "" fn use context "$CONTEXT_NAME"

  CURRENT_CONTEXT_NAME="$CONTEXT_NAME"
  CURRENT_PROVIDER="oracle"
  CURRENT_API_URL="$API_URL"
  CURRENT_REGISTRY="$REGISTRY"
fi

prompt_if_missing "$PROFILE" "OCI CLI profile name for Fn context: " PROFILE
prompt_if_missing "$COMPARTMENT_ID" "Compartment OCID for Functions app lookup/deploy: " COMPARTMENT_ID
if [[ -z "$REGION" && -n "$CURRENT_API_URL" ]]; then
  REGION="$(extract_region_from_api_url "$CURRENT_API_URL")"
fi
if [[ -z "$REGION" ]]; then
  prompt_if_missing "$REGION" "OCI region (for example eu-frankfurt-1): " REGION
fi
if [[ -z "$API_URL" ]]; then
  API_URL="$(build_api_url "$REGION")"
fi
prompt_if_missing "$REGISTRY" "OCI registry (for example fra.ocir.io/namespace/repo): " REGISTRY

if [[ "$CURRENT_COMPARTMENT_ID" != "$COMPARTMENT_ID" ]]; then
  run_confirmed "Set Fn context oracle.compartment-id" "fn update context oracle.compartment-id '$COMPARTMENT_ID'" "" fn update context oracle.compartment-id "$COMPARTMENT_ID"
fi
if [[ "$CURRENT_PROFILE" != "$PROFILE" ]]; then
  run_confirmed "Set Fn context oracle.profile" "fn update context oracle.profile '$PROFILE'" "" fn update context oracle.profile "$PROFILE"
fi
if [[ "$CURRENT_API_URL" != "$API_URL" ]]; then
  run_confirmed "Set Fn context api-url" "fn update context api-url '$API_URL'" "" fn update context api-url "$API_URL"
fi
if [[ "$CURRENT_REGISTRY" != "$REGISTRY" ]]; then
  run_confirmed "Set Fn context registry" "fn update context registry '$REGISTRY'" "" fn update context registry "$REGISTRY"
fi
if [[ -n "$IMAGE_COMPARTMENT_ID" && "$CURRENT_IMAGE_COMPARTMENT_ID" != "$IMAGE_COMPARTMENT_ID" ]]; then
  run_confirmed "Set Fn context oracle.image-compartment-id" "fn update context oracle.image-compartment-id '$IMAGE_COMPARTMENT_ID'" "" fn update context oracle.image-compartment-id "$IMAGE_COMPARTMENT_ID"
fi

echo "fn_context_state=found"
echo "fn_context_name=${CURRENT_CONTEXT_NAME:-$CONTEXT_NAME}"
echo "fn_context_profile=$PROFILE"
echo "fn_context_compartment_id=$COMPARTMENT_ID"
echo "fn_context_api_url=$API_URL"
echo "fn_context_registry=$REGISTRY"
echo "fn_context_image_compartment_id=${IMAGE_COMPARTMENT_ID:-}"

registry_host="${REGISTRY%%/*}"
echo "docker_registry_host=$registry_host"
registry_auth_state="$(docker_registry_auth_probe "$registry_host")"
echo "docker_registry_auth_probe_state=$registry_auth_state"

if [[ "${FORCE_OCIR_LOGIN:-}" != "yes" ]]; then
  case "$registry_auth_state" in
    valid)
      log_info "Existing docker auth for '$registry_host' was validated live."
      echo "docker_registry_auth_state=valid"
      echo "ocir_auth_state=valid"
      exit 0
      ;;
    cached)
      if [[ -z "$OCIR_USERNAME" ]]; then
        log_info "Cached docker auth exists for '$registry_host', but live validation did not confirm it."
        echo "docker_registry_auth_state=cached"
        echo "ocir_auth_state=cached"
        exit 0
      fi
      ;;
    error)
      echo "docker_registry_auth_state=error"
      echo "docker_registry_auth_error_reason=runtime_or_cli"
      echo "ocir_auth_state=error"
      exit 4
      ;;
    *)
      ;;
  esac
fi

if [[ -n "$OCIR_USERNAME" ]]; then
  if [[ -z "$OCIR_AUTH_TOKEN" ]]; then
    if ! is_interactive; then
      echo "[ERROR] OCIR auth token is required in non-interactive mode when login is requested." >&2
      exit 2
    fi
    read -r -s -p "OCIR auth token for $OCIR_USERNAME: " OCIR_AUTH_TOKEN
    printf '\n' >&2
  fi
  export OCIR_AUTH_TOKEN
  run_confirmed "Login to OCIR registry '$registry_host'" "printf '[REDACTED]' | docker login '$registry_host' -u '$OCIR_USERNAME' --password-stdin" "OCIR_AUTH_TOKEN" docker login "$registry_host" -u "$OCIR_USERNAME" --password-stdin
  echo "docker_registry_auth_state=valid"
  echo "ocir_auth_state=valid"
else
  log_info "Docker is not logged into '$registry_host'. Prompt for OCIR credentials before deploy."
  echo "docker_registry_auth_state=missing"
  echo "ocir_auth_state=missing"
fi
