#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

REGION=""
COMPARTMENT_ID=""
APP_NAME=""
PROFILE=""
DISCOVERY_ERROR=0
MACHINE_READABLE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="${2:-}"
      shift 2
      ;;
    --compartment-id)
      COMPARTMENT_ID="${2:-}"
      shift 2
      ;;
    --app-name)
      APP_NAME="${2:-}"
      shift 2
      ;;
    --profile)
      PROFILE="${2:-}"
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

log_section "Fn context discovery"
FN_CONTEXT_NAME=""
FN_CONTEXT_PROVIDER=""
FN_CONTEXT_PROFILE=""
FN_CONTEXT_COMPARTMENT_ID=""
FN_CONTEXT_API_URL=""
FN_CONTEXT_REGISTRY=""
FN_CONTEXT_IMAGE_COMPARTMENT_ID=""
if command -v fn >/dev/null 2>&1 && parse_fn_context; then
  missing_fn_keys=()
  [[ -n "$FN_CONTEXT_COMPARTMENT_ID" ]] || missing_fn_keys+=("oracle.compartment-id")
  [[ -n "$FN_CONTEXT_PROFILE" ]] || missing_fn_keys+=("oracle.profile")
  [[ -n "$FN_CONTEXT_API_URL" ]] || missing_fn_keys+=("api-url")
  [[ -n "$FN_CONTEXT_REGISTRY" ]] || missing_fn_keys+=("registry")

  if [[ -n "$FN_CONTEXT_NAME" && "$FN_CONTEXT_PROVIDER" == "oracle" && ${#missing_fn_keys[@]} -eq 0 ]]; then
    emit_kv fn_context_state found
  elif [[ -n "$FN_CONTEXT_NAME" || -n "$FN_CONTEXT_PROVIDER" || -n "$FN_CONTEXT_PROFILE" || -n "$FN_CONTEXT_COMPARTMENT_ID" || -n "$FN_CONTEXT_API_URL" || -n "$FN_CONTEXT_REGISTRY" ]]; then
    emit_kv fn_context_state incomplete
    emit_kv fn_context_missing_keys "${missing_fn_keys[*]:-provider}"
  else
    emit_kv fn_context_state missing
  fi
  emit_kv fn_context_name "${FN_CONTEXT_NAME:-}"
  emit_kv fn_context_provider "${FN_CONTEXT_PROVIDER:-}"
  emit_kv fn_context_profile "${FN_CONTEXT_PROFILE:-}"
  emit_kv fn_context_compartment_id "${FN_CONTEXT_COMPARTMENT_ID:-}"
  emit_kv fn_context_api_url "${FN_CONTEXT_API_URL:-}"
  emit_kv fn_context_registry "${FN_CONTEXT_REGISTRY:-}"
  emit_kv fn_context_image_compartment_id "${FN_CONTEXT_IMAGE_COMPARTMENT_ID:-}"
else
  emit_kv fn_context_state missing
fi

resolved_profile=""
resolved_compartment_id=""
resolved_region=""

if [[ -n "$PROFILE" ]]; then
  resolved_profile="$PROFILE"
elif [[ -n "$FN_CONTEXT_PROFILE" ]]; then
  resolved_profile="$FN_CONTEXT_PROFILE"
fi

if [[ -n "$COMPARTMENT_ID" ]]; then
  resolved_compartment_id="$COMPARTMENT_ID"
elif [[ -n "$FN_CONTEXT_COMPARTMENT_ID" ]]; then
  resolved_compartment_id="$FN_CONTEXT_COMPARTMENT_ID"
fi

if [[ -n "$REGION" ]]; then
  resolved_region="$REGION"
elif [[ -n "$FN_CONTEXT_API_URL" ]]; then
  resolved_region="$(extract_region_from_api_url "${FN_CONTEXT_API_URL:-}")"
fi

PROFILE="$resolved_profile"
COMPARTMENT_ID="$resolved_compartment_id"
REGION="$resolved_region"

emit_kv region "${REGION:-}"
emit_kv compartment_id "${COMPARTMENT_ID:-}"
emit_kv profile "${PROFILE:-}"

human_out ""
log_section "OCI discovery"
if ! command -v oci >/dev/null 2>&1; then
  emit_kv oci_cli_state missing
  emit_kv discovery_state missing
  exit 0
fi
emit_kv oci_cli_state found

if [[ -n "$REGION" ]]; then
  export OCI_CLI_REGION="$REGION"
fi
if [[ -n "$PROFILE" ]]; then
  export OCI_CLI_PROFILE="$PROFILE"
fi

if [[ -z "$COMPARTMENT_ID" ]]; then
  emit_kv compartment_state missing
  emit_kv apps_state empty
  emit_kv apps_count 0
  emit_kv discovery_state missing
  exit 0
fi
emit_kv compartment_state found

app_raw=""
app_err=""
if run_oci_display_name_list app_raw app_err fn application list --compartment-id "$COMPARTMENT_ID" --all; then
  app_names="$(sed '/^$/d' <<<"$app_raw")"
  if [[ -n "$app_names" ]]; then
    emit_kv apps_state found
    app_count="$(wc -l <<<"$app_names" | tr -d ' ')"
    emit_kv apps_count "$app_count"
    idx=0
    while IFS= read -r name; do
      [[ -z "$name" ]] && continue
      idx=$((idx + 1))
      emit_kv "app_item_${idx}" "$name"
    done <<<"$app_names"
  else
    emit_kv apps_state empty
    emit_kv apps_count 0
  fi
else
  emit_kv apps_state error
  emit_kv apps_error_reason "$(classify_oci_error_reason "$app_err")"
  DISCOVERY_ERROR=1
fi

if [[ -n "$APP_NAME" ]]; then
  app_match_raw=""
  app_match_err=""
  if run_oci_display_name_lookup app_match_raw app_match_err "$APP_NAME" fn application list --compartment-id "$COMPARTMENT_ID" --all; then
    if [[ -n "$app_match_raw" && "$app_match_raw" != "null" && "$app_match_raw" != "None" ]]; then
      emit_kv app_state found
      emit_kv app_id "$app_match_raw"
    else
      emit_kv app_state missing
    fi
  else
    emit_kv app_state error
    emit_kv app_error_reason "$(classify_oci_error_reason "$app_match_err")"
    DISCOVERY_ERROR=1
  fi
fi

if [[ "$DISCOVERY_ERROR" -eq 1 ]]; then
  emit_kv discovery_state error
  exit 4
fi

emit_kv discovery_state found
