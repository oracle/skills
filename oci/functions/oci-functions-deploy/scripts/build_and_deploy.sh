#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIRM="$SCRIPT_DIR/confirm_gate.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

RUNTIME=""
APP=""
FUNCTION_DIR=""
FUNCTION_NAME=""
FUNCTION_NAME_SOURCE=""
SKIP_PREFLIGHT="false"
MACHINE_READABLE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runtime)
      RUNTIME="${2:-}"
      shift 2
      ;;
    --app)
      APP="${2:-}"
      shift 2
      ;;
    --function-dir)
      FUNCTION_DIR="${2:-}"
      shift 2
      ;;
    --function-name)
      FUNCTION_NAME="${2:-}"
      shift 2
      ;;
    --function-name-source)
      FUNCTION_NAME_SOURCE="${2:-}"
      shift 2
      ;;
    --skip-preflight)
      SKIP_PREFLIGHT="true"
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

prompt_if_missing() {
  local current_value="$1"
  local prompt="$2"
  local out_var="$3"
  local value="$current_value"

  if [[ -z "$value" ]]; then
    if ! is_interactive; then
      echo "[ERROR] Missing required input: $prompt" >&2
      echo "[HINT] Supply the missing flag when running non-interactively." >&2
      exit 2
    fi
    read -r -p "$prompt" value
  fi

  printf -v "$out_var" "%s" "$value"
}

prompt_with_default() {
  local current_value="$1"
  local prompt="$2"
  local default_value="$3"
  local out_var="$4"
  local value="$current_value"

  if [[ -z "$value" ]]; then
    if ! is_interactive; then
      echo "[ERROR] Missing required input: $prompt" >&2
      echo "[HINT] Supply the missing flag when running non-interactively." >&2
      exit 2
    fi
    read -r -p "$prompt" value
    if [[ -z "$value" ]]; then
      value="$default_value"
    fi
  fi

  printf -v "$out_var" "%s" "$value"
}

sanitize_dir_component() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g'
}

resolve_function_name() {
  if [[ -n "$FUNCTION_NAME" ]]; then
    case "$FUNCTION_NAME_SOURCE" in
      explicit|prompted)
        FUNCTION_NAME_STATE="$FUNCTION_NAME_SOURCE"
        ;;
      "")
        if ! is_interactive; then
          echo "function_name_state=missing"
          echo "[ERROR] Function name was provided without provenance." >&2
          echo "[HINT] Pass --function-name-source explicit or --function-name-source prompted when supplying --function-name non-interactively." >&2
          exit 2
        fi
        log_warn "Function name '$FUNCTION_NAME' was provided without explicit provenance."
        read -r -p "Use this function name? [y/N]: " reply
        case "$(normalize_reply "$reply")" in
          y|yes)
            FUNCTION_NAME_STATE="prompted"
            ;;
          *)
            FUNCTION_NAME=""
            prompt_if_missing "$FUNCTION_NAME" "Function name: " FUNCTION_NAME
            FUNCTION_NAME_STATE="prompted"
            ;;
        esac
        ;;
      *)
        echo "function_name_state=missing"
        echo "[ERROR] Invalid --function-name-source '$FUNCTION_NAME_SOURCE'." >&2
        echo "[HINT] Use --function-name-source explicit or --function-name-source prompted." >&2
        exit 2
        ;;
    esac
  else
    prompt_if_missing "$FUNCTION_NAME" "Function name: " FUNCTION_NAME
    FUNCTION_NAME_STATE="prompted"
  fi
}

contains_fnproject_pull_error() {
  local text="${1:-}"
  grep -Eiq 'fnproject/.+|oraclefunctionsdevelopm/fnproject|pull access denied|manifest unknown|failed to resolve|error pulling image|not found' <<<"$text"
}

contains_ocir_repository_error() {
  local text="${1:-}"
  grep -Eiq 'repository .* not found|auto[- ]create.*disabled|create.*repository|not authorized.*repository|denied: requested access to the resource is denied|name unknown' <<<"$text"
}

emit_deploy_failure_hints() {
  local text="${1:-}"
  if contains_fnproject_pull_error "$text"; then
    echo "[HINT] Function initialization or deploy failed while resolving base images. This skill does not rewrite fnproject image references automatically; inspect generated Dockerfile/func.yaml or choose a compatible template manually." >&2
  fi
  if contains_ocir_repository_error "$text"; then
    echo "[HINT] Deploy failed while pushing to OCIR. If repository auto-create is disabled or the repository lives in another compartment, pre-create the repository or set oracle.image-compartment-id in the Fn context before retrying." >&2
  fi
}

guard_function_dir() {
  while true; do
    if [[ ! -d "$FUNCTION_DIR" || -f "$FUNCTION_DIR/func.yaml" ]]; then
      return 0
    fi

    if [[ -z "$(find "$FUNCTION_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
      return 0
    fi

    if ! is_interactive; then
      echo "[ERROR] Function directory '$FUNCTION_DIR' already exists, is not empty, and does not contain func.yaml." >&2
      echo "[HINT] Choose an empty directory or an existing function directory before retrying." >&2
      exit 2
    fi

    echo "[WARN] Function directory '$FUNCTION_DIR' exists, is not empty, and does not contain func.yaml." >&2
    read -r -p "Enter a different function directory path, or leave blank to stop: " replacement_dir
    if [[ -z "$replacement_dir" ]]; then
      echo "[ERROR] Stopped before initializing inside a non-empty directory." >&2
      exit 2
    fi
    FUNCTION_DIR="$replacement_dir"
  done
}

run_confirmed_command_with_capture() {
  local description="$1"
  local display_text="$2"
  local workdir="$3"
  local stdin_env="$4"
  local stdout_var="$5"
  local stderr_var="$6"
  local status_var="$7"
  shift 7

  local nonce
  local stdout_file
  local stderr_file
  local status
  local confirm_args=()
  nonce="$(next_confirm_nonce)"
  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"
  if is_machine_readable; then
    confirm_args+=(--machine-readable)
  fi

  if [[ -n "$workdir" && -n "$stdin_env" ]]; then
    if "$CONFIRM" --description "$description" --display "$display_text" --cwd "$workdir" --stdin-env "$stdin_env" "${confirm_args[@]}" --nonce "$nonce" -- "$@" >"$stdout_file" 2>"$stderr_file"; then
      status=0
    else
      status=$?
    fi
  elif [[ -n "$workdir" ]]; then
    if "$CONFIRM" --description "$description" --display "$display_text" --cwd "$workdir" "${confirm_args[@]}" --nonce "$nonce" -- "$@" >"$stdout_file" 2>"$stderr_file"; then
      status=0
    else
      status=$?
    fi
  elif [[ -n "$stdin_env" ]]; then
    if "$CONFIRM" --description "$description" --display "$display_text" --stdin-env "$stdin_env" "${confirm_args[@]}" --nonce "$nonce" -- "$@" >"$stdout_file" 2>"$stderr_file"; then
      status=0
    else
      status=$?
    fi
  else
    if "$CONFIRM" --description "$description" --display "$display_text" "${confirm_args[@]}" --nonce "$nonce" -- "$@" >"$stdout_file" 2>"$stderr_file"; then
      status=0
    else
      status=$?
    fi
  fi

  printf -v "$stdout_var" "%s" "$(cat "$stdout_file")"
  printf -v "$stderr_var" "%s" "$(cat "$stderr_file")"
  printf -v "$status_var" "%s" "$status"
  rm -f "$stdout_file" "$stderr_file"
}

prompt_if_missing "$APP" "Functions application name: " APP
resolve_function_name
echo "function_name_state=$FUNCTION_NAME_STATE"
echo "function_name=$FUNCTION_NAME"
prompt_if_missing "$RUNTIME" "Function runtime (java/python/node): " RUNTIME

suggested_function_dir="./$(sanitize_dir_component "$FUNCTION_NAME")"
prompt_with_default "$FUNCTION_DIR" "Function directory path [$suggested_function_dir]: " "$suggested_function_dir" FUNCTION_DIR
guard_function_dir

case "$RUNTIME" in
  java|python|node) ;;
  *)
    echo "Unsupported runtime: $RUNTIME" >&2
    exit 1
    ;;
esac

if [[ "$SKIP_PREFLIGHT" != "true" ]]; then
  if is_machine_readable; then
    "$SCRIPT_DIR/preflight_check.sh" --runtime "$RUNTIME" --strict --machine-readable
  else
    "$SCRIPT_DIR/preflight_check.sh" --runtime "$RUNTIME" --strict
  fi
  echo "deploy_preflight_state=passed"
else
  skip_stdout=""
  skip_stderr=""
  skip_status=""
  run_confirmed_command_with_capture \
    "Skip strict preflight checks before deploy (high risk)" \
    "printf '[AUDIT] preflight skipped by explicit user-approved override\n'" \
    "" \
    "" \
    skip_stdout \
    skip_stderr \
    skip_status \
    printf '[AUDIT] preflight skipped for runtime %s by explicit user-approved override\n' "$RUNTIME"
  [[ -n "$skip_stdout" ]] && printf '%s\n' "$skip_stdout"
  [[ -n "$skip_stderr" ]] && printf '%s\n' "$skip_stderr" >&2
  if [[ "$skip_status" -ne 0 ]]; then
    exit "$skip_status"
  fi
  echo "deploy_preflight_state=skipped"
fi

if [[ ! -d "$FUNCTION_DIR" ]]; then
  mkdir_stdout=""
  mkdir_stderr=""
  mkdir_status=""
  run_confirmed_command_with_capture \
    "Create function directory '$FUNCTION_DIR'" \
    "mkdir -p '$FUNCTION_DIR'" \
    "" \
    "" \
    mkdir_stdout \
    mkdir_stderr \
    mkdir_status \
    mkdir -p "$FUNCTION_DIR"
  [[ -n "$mkdir_stdout" ]] && printf '%s\n' "$mkdir_stdout"
  [[ -n "$mkdir_stderr" ]] && printf '%s\n' "$mkdir_stderr" >&2
  if [[ "$mkdir_status" -ne 0 ]]; then
    exit "$mkdir_status"
  fi
fi

if [[ ! -f "$FUNCTION_DIR/func.yaml" ]]; then
  init_stdout=""
  init_stderr=""
  init_status=""
  run_confirmed_command_with_capture \
    "Initialize function '$FUNCTION_NAME' in '$FUNCTION_DIR'" \
    "fn init --runtime '$RUNTIME' --name '$FUNCTION_NAME'" \
    "$FUNCTION_DIR" \
    "" \
    init_stdout \
    init_stderr \
    init_status \
    fn init --runtime "$RUNTIME" --name "$FUNCTION_NAME"
  [[ -n "$init_stdout" ]] && printf '%s\n' "$init_stdout"
  [[ -n "$init_stderr" ]] && printf '%s\n' "$init_stderr" >&2
  if [[ "$init_status" -ne 0 ]]; then
    emit_deploy_failure_hints "$init_stdout"$'\n'"$init_stderr"
    exit "$init_status"
  fi
fi

deploy_stdout=""
deploy_stderr=""
deploy_status=""
run_confirmed_command_with_capture \
  "Deploy function from '$FUNCTION_DIR' to app '$APP'" \
  "fn -v deploy --app '$APP'" \
  "$FUNCTION_DIR" \
  "" \
  deploy_stdout \
  deploy_stderr \
  deploy_status \
  fn -v deploy --app "$APP"
[[ -n "$deploy_stdout" ]] && printf '%s\n' "$deploy_stdout"
[[ -n "$deploy_stderr" ]] && printf '%s\n' "$deploy_stderr" >&2

if [[ "$deploy_status" -ne 0 ]]; then
  emit_deploy_failure_hints "$deploy_stdout"$'\n'"$deploy_stderr"
  exit "$deploy_status"
fi

echo "deploy_action=deploy"
