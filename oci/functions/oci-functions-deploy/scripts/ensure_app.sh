#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIRM="$SCRIPT_DIR/confirm_gate.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

REGION=""
COMPARTMENT_ID=""
APP_NAME=""
APP_CHOICE=""
SUBNET_IDS=""
PROFILE=""
APP_SHAPE=""
NSG_IDS=""
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
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --app-name)
      APP_NAME="${2:-}"
      shift 2
      ;;
    --app-choice)
      APP_CHOICE="${2:-}"
      shift 2
      ;;
    --subnet-ids)
      SUBNET_IDS="${2:-}"
      shift 2
      ;;
    --shape)
      APP_SHAPE="${2:-}"
      shift 2
      ;;
    --nsg-ids)
      NSG_IDS="${2:-}"
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
  shift 2

  local nonce
  local confirm_args=()
  nonce="$(next_confirm_nonce)"
  if is_machine_readable; then
    confirm_args+=(--machine-readable)
  fi
  "$CONFIRM" --description "$description" --display "$display" "${confirm_args[@]}" --nonce "$nonce" -- "$@"
}

normalize_csv_lines() {
  python3 - <<'PY' "$1"
import sys
items = [item.strip() for item in sys.argv[1].split(",") if item.strip()]
for item in items:
    print(item)
PY
}

json_array_from_csv() {
  python3 - <<'PY' "$1"
import json
import sys
items = [item.strip() for item in sys.argv[1].split(",") if item.strip()]
print(json.dumps(items))
PY
}

read_with_default_or_error() {
  local prompt="$1"
  local default_value="$2"
  local out_var="$3"
  local value=""

  if is_interactive; then
    read -r -p "$prompt" value
    if [[ -z "$value" ]]; then
      value="$default_value"
    fi
  else
    if [[ -z "$default_value" ]]; then
      echo "[ERROR] Missing required input in non-interactive mode: $prompt" >&2
      echo "[HINT] Provide the required flag explicitly." >&2
      exit 2
    fi
    value="$default_value"
    log_info "Non-interactive mode: using default for '$prompt' -> $default_value"
  fi

  printf -v "$out_var" "%s" "$value"
}

parse_fn_context() {
  FN_CONTEXT_PROFILE=""
  FN_CONTEXT_COMPARTMENT_ID=""
  FN_CONTEXT_API_URL=""

  local context_out
  context_out="$(fn inspect context 2>/dev/null || true)"
  [[ -n "$context_out" ]] || return 1

  FN_CONTEXT_PROFILE="$(awk -F': ' '/^oracle.profile:/ {print $2; exit}' <<<"$context_out" || true)"
  FN_CONTEXT_COMPARTMENT_ID="$(awk -F': ' '/^oracle.compartment-id:/ {print $2; exit}' <<<"$context_out" || true)"
  FN_CONTEXT_API_URL="$(awk -F': ' '/^api-url:/ {print $2; exit}' <<<"$context_out" || true)"
  return 0
}

FN_CONTEXT_PROFILE=""
FN_CONTEXT_COMPARTMENT_ID=""
FN_CONTEXT_API_URL=""
parse_fn_context || true

if [[ -z "$PROFILE" ]]; then
  PROFILE="$FN_CONTEXT_PROFILE"
fi
if [[ -z "$COMPARTMENT_ID" ]]; then
  COMPARTMENT_ID="$FN_CONTEXT_COMPARTMENT_ID"
fi
if [[ -z "$REGION" ]]; then
  REGION="$(extract_region_from_api_url "$FN_CONTEXT_API_URL")"
fi

if [[ -z "$REGION" || -z "$COMPARTMENT_ID" ]]; then
  echo "Usage: $0 --region <region> --compartment-id <ocid> [--profile <profile>] [--app-name <name>] [--app-choice <reuse|create>] [--subnet-ids <comma-separated-ocids>] [--shape <GENERIC_X86|GENERIC_ARM|GENERIC_X86_ARM>] [--nsg-ids <comma-separated-ocids>] [--machine-readable]" >&2
  echo "[HINT] When omitted, region/profile/compartment are resolved from the active Fn context." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "app_state=error"
  echo "app_error_reason=runtime_or_cli"
  echo "[ERROR] python3 is required for JSON argument generation." >&2
  exit 1
fi

export OCI_CLI_REGION="$REGION"
if [[ -n "$PROFILE" ]]; then
  export OCI_CLI_PROFILE="$PROFILE"
fi

all_apps_out=""
all_apps_err=""
if ! run_oci_capture all_apps_out all_apps_err fn application list --compartment-id "$COMPARTMENT_ID" --all --query 'data[]."display-name"' --raw-output; then
  echo "apps_state=error"
  echo "apps_error_reason=$(classify_oci_error_reason "$all_apps_err")"
  echo "app_state=error"
  echo "app_error_reason=$(classify_oci_error_reason "$all_apps_err")"
  echo "[ERROR] Cannot inspect Functions applications." >&2
  exit 4
fi

existing_apps=()
while IFS= read -r app_name; do
  [[ -z "$app_name" ]] && continue
  existing_apps+=("$app_name")
done <<<"$(sed '/^$/d' <<<"$all_apps_out")"
if [[ ${#existing_apps[@]} -gt 0 ]]; then
  echo "apps_state=found"
  echo "apps_count=${#existing_apps[@]}"
  idx=0
  for item in "${existing_apps[@]}"; do
    idx=$((idx + 1))
    echo "app_item_${idx}=$item"
  done
else
  echo "apps_state=empty"
  echo "apps_count=0"
fi

if [[ ${#existing_apps[@]} -gt 0 && -z "$APP_CHOICE" ]]; then
  if is_interactive; then
    human_out "Existing Functions applications found:"
    idx=0
    for item in "${existing_apps[@]}"; do
      idx=$((idx + 1))
      human_out "  $idx) $item"
    done
    read -r -p "Reuse an existing app or create new? [reuse/create]: " APP_CHOICE
  else
    echo "app_state=error"
    echo "app_error_reason=runtime_or_cli"
    echo "[ERROR] Existing applications are available, but --app-choice was not supplied." >&2
    echo "[HINT] Pass --app-choice reuse or --app-choice create explicitly." >&2
    exit 2
  fi
fi

if [[ ${#existing_apps[@]} -gt 0 && -n "$APP_CHOICE" ]]; then
  human_out "Existing Functions applications found:"
  idx=0
  for item in "${existing_apps[@]}"; do
    idx=$((idx + 1))
    human_out "  $idx) $item"
  done

  case "$APP_CHOICE" in
    reuse)
      if [[ -n "$APP_NAME" ]]; then
        :
      elif is_interactive; then
        read -r -p "Choose application number to reuse: " pick
        if [[ ! "$pick" =~ ^[0-9]+$ ]]; then
          echo "app_state=error"
          echo "app_error_reason=runtime_or_cli"
          echo "[ERROR] Invalid application selection: expected a number." >&2
          exit 1
        fi
        if [[ "$pick" -lt 1 || "$pick" -gt "${#existing_apps[@]}" ]]; then
          echo "app_state=error"
          echo "app_error_reason=runtime_or_cli"
          echo "[ERROR] Invalid application selection." >&2
          exit 1
        fi
        APP_NAME="${existing_apps[$((pick - 1))]}"
      else
        echo "[ERROR] Non-interactive reuse requires --app-name." >&2
        exit 2
      fi
      ;;
    create)
      if [[ -z "$APP_NAME" ]]; then
        read_with_default_or_error "New Functions application display name: " "" APP_NAME
      fi
      ;;
    *)
      echo "app_state=error"
      echo "app_error_reason=runtime_or_cli"
      echo "[ERROR] app choice must be 'reuse' or 'create'." >&2
      exit 1
      ;;
  esac
fi

case "$APP_SHAPE" in
  ""|GENERIC_X86|GENERIC_ARM|GENERIC_X86_ARM) ;;
  *)
    echo "app_state=error"
    echo "app_error_reason=runtime_or_cli"
    echo "[ERROR] Unsupported application shape '$APP_SHAPE'." >&2
    echo "[HINT] Use GENERIC_X86, GENERIC_ARM, or GENERIC_X86_ARM." >&2
    exit 2
    ;;
esac

if [[ -z "$APP_NAME" ]]; then
  read_with_default_or_error "Functions application display name: " "" APP_NAME
fi

app_id=""
app_lookup_out=""
app_lookup_err=""
if run_oci_capture app_lookup_out app_lookup_err fn application list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$APP_NAME'].id | [0]" --raw-output; then
  app_id="$app_lookup_out"
else
  echo "app_state=error"
  echo "app_error_reason=$(classify_oci_error_reason "$app_lookup_err")"
  echo "[ERROR] Cannot inspect the requested Functions application." >&2
  exit 4
fi

if [[ -n "$app_id" && "$app_id" != "null" && "$app_id" != "None" ]]; then
  if [[ -z "$APP_CHOICE" ]]; then
    if is_interactive; then
      read -r -p "Application '$APP_NAME' exists. Reuse it or create a new one? [reuse/create]: " APP_CHOICE
    else
      echo "app_state=error"
      echo "app_error_reason=runtime_or_cli"
      echo "[ERROR] --app-name matched an existing application but --app-choice was not supplied." >&2
      exit 2
    fi
  fi
  if [[ "$APP_CHOICE" != "reuse" ]]; then
    if ! is_interactive; then
      echo "app_state=error"
      echo "app_error_reason=runtime_or_cli"
      echo "[ERROR] Application '$APP_NAME' already exists, but create was requested." >&2
      echo "[HINT] Choose a new application name or switch to --app-choice reuse." >&2
      exit 2
    fi
    while [[ -n "$app_id" && "$app_id" != "null" && "$app_id" != "None" ]]; do
      read_with_default_or_error "Application '$APP_NAME' exists. New Functions application display name: " "" APP_NAME
      if run_oci_capture app_lookup_out app_lookup_err fn application list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$APP_NAME'].id | [0]" --raw-output; then
        app_id="$app_lookup_out"
      else
        echo "app_state=error"
        echo "app_error_reason=$(classify_oci_error_reason "$app_lookup_err")"
        echo "[ERROR] Cannot inspect the requested Functions application." >&2
        exit 4
      fi
    done
  else
    if [[ -n "$APP_SHAPE" || -n "$NSG_IDS" ]]; then
      echo "app_state=error"
      echo "app_error_reason=runtime_or_cli"
      echo "[ERROR] --shape and --nsg-ids apply only when creating a new application." >&2
      exit 2
    fi
    echo "app_state=found"
    echo "app_name=$APP_NAME"
    echo "app_id=$app_id"
    echo "app_action=reuse"
    exit 0
  fi
fi

if [[ "$APP_CHOICE" == "reuse" ]]; then
  echo "app_state=missing"
  echo "[ERROR] Requested app reuse but application '$APP_NAME' was not found." >&2
  echo "[HINT] Choose an existing app name or switch to --app-choice create." >&2
  exit 4
fi
echo "app_state=missing"

if [[ -z "$SUBNET_IDS" ]]; then
  read_with_default_or_error "Subnet OCID(s) for the application (comma-separated, 1-3): " "" SUBNET_IDS
fi

if [[ -z "$SUBNET_IDS" ]]; then
  echo "app_state=error"
  echo "app_error_reason=runtime_or_cli"
  echo "[ERROR] subnet IDs are required to create the application" >&2
  exit 1
fi

subnet_lines="$(normalize_csv_lines "$SUBNET_IDS")"
subnet_count="$(sed '/^$/d' <<<"$subnet_lines" | wc -l | tr -d ' ')"
if [[ "$subnet_count" -lt 1 || "$subnet_count" -gt 3 ]]; then
  echo "app_state=error"
  echo "app_error_reason=runtime_or_cli"
  echo "[ERROR] OCI Functions applications require between 1 and 3 subnet OCIDs." >&2
  exit 2
fi
subnet_json="$(json_array_from_csv "$SUBNET_IDS")"

create_args=(oci fn application create --compartment-id "$COMPARTMENT_ID" --display-name "$APP_NAME" --subnet-ids "$subnet_json")
create_display="oci fn application create --compartment-id '$COMPARTMENT_ID' --display-name '$APP_NAME' --subnet-ids '$subnet_json'"

if [[ -n "$APP_SHAPE" ]]; then
  create_args+=(--shape "$APP_SHAPE")
  create_display="$create_display --shape '$APP_SHAPE'"
fi

if [[ -n "$NSG_IDS" ]]; then
  nsg_json="$(json_array_from_csv "$NSG_IDS")"
  create_args+=(--network-security-group-ids "$nsg_json")
  create_display="$create_display --network-security-group-ids '$nsg_json'"
fi

run_confirmed "Create Functions application '$APP_NAME'" "$create_display" "${create_args[@]}"

app_id=""
app_lookup_out=""
app_lookup_err=""
if run_oci_capture app_lookup_out app_lookup_err fn application list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$APP_NAME'].id | [0]" --raw-output; then
  app_id="$app_lookup_out"
else
  echo "app_state=error"
  echo "app_error_reason=$(classify_oci_error_reason "$app_lookup_err")"
  echo "[ERROR] Application was not resolvable after create." >&2
  exit 4
fi

if [[ -z "$app_id" || "$app_id" == "null" || "$app_id" == "None" ]]; then
  echo "app_state=error"
  echo "app_error_reason=runtime_or_cli"
  echo "[ERROR] Application was not resolvable after create." >&2
  exit 4
fi
echo "app_state=found"
echo "app_name=$APP_NAME"
echo "app_id=$app_id"
echo "app_action=create"
exit 0
