#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

DESCRIPTION=""
DISPLAY=""
WORKDIR=""
STDIN_ENV=""
NONCE=""
MACHINE_READABLE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --description)
      DESCRIPTION="${2:-}"
      shift 2
      ;;
    --display)
      DISPLAY="${2:-}"
      shift 2
      ;;
    --cwd)
      WORKDIR="${2:-}"
      shift 2
      ;;
    --stdin-env)
      STDIN_ENV="${2:-}"
      shift 2
      ;;
    --nonce)
      NONCE="${2:-}"
      shift 2
      ;;
    --machine-readable)
      # Used by common.sh:is_machine_readable after argument parsing.
      # shellcheck disable=SC2034
      MACHINE_READABLE="true"
      shift
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "Usage: $0 --description <text> [--display <text>] [--cwd <path>] [--stdin-env <env>] [--nonce <nonce>] [--machine-readable] -- <argv...>" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$DESCRIPTION" || $# -eq 0 ]]; then
  echo "Usage: $0 --description <text> [--display <text>] [--cwd <path>] [--stdin-env <env>] [--nonce <nonce>] [--machine-readable] -- <argv...>" >&2
  exit 1
fi

ARGV=("$@")
if [[ -z "$DISPLAY" ]]; then
  DISPLAY="$(printf '%q ' "${ARGV[@]}")"
  DISPLAY="${DISPLAY% }"
fi

if is_interactive && [[ -z "$NONCE" ]]; then
  NONCE="$(next_confirm_nonce)"
fi

if ! is_interactive && [[ -z "$NONCE" ]]; then
  echo "confirm_state=error"
  echo "confirm_error_reason=missing_nonce"
  echo "[ERROR] Non-interactive confirmation requires --nonce." >&2
  exit 2
fi

argv_payload="$(printf '%q\n' "${ARGV[@]}")"
payload="$DESCRIPTION"$'\n'"$DISPLAY"$'\n'"$WORKDIR"$'\n'"$STDIN_ENV"$'\n'"$NONCE"$'\n'"$argv_payload"
if command -v shasum >/dev/null 2>&1; then
  ACTION_ID="$(printf '%s' "$payload" | shasum -a 256 | awk '{print $1}')"
elif command -v sha256sum >/dev/null 2>&1; then
  ACTION_ID="$(printf '%s' "$payload" | sha256sum | awk '{print $1}')"
else
  ACTION_ID="$(cksum <<<"$payload" | awk '{print $1}')"
fi

ledger_root="${TMPDIR:-/tmp}/codex-confirm-used"
ledger_dir="$ledger_root/${NONCE:-interactive}"
ledger_file="$ledger_dir/$ACTION_ID"

if [[ -f "$ledger_file" ]]; then
  echo "confirm_state=error"
  echo "confirm_action_id=$ACTION_ID"
  echo "confirm_nonce=${NONCE:-interactive}"
  echo "confirm_error_reason=already_consumed"
  echo "[ERROR] This approval has already been used." >&2
  exit 4
fi

approved="no"
if is_interactive; then
  human_out ""
  human_out "[ACTION_ID] $ACTION_ID"
  human_out "[CONFIRM] $DESCRIPTION"
  human_out "[COMMAND] $DISPLAY"
  read -r -p "Proceed? [y/N]: " reply
  case "$(normalize_reply "$reply")" in
    y|yes|true|approved|approve)
      approved="yes"
      ;;
  esac
else
  human_out ""
  human_out "[ACTION_ID] $ACTION_ID"
  human_out "[CONFIRM-NONINTERACTIVE] $DESCRIPTION"
  human_out "[COMMAND] $DISPLAY"
  if [[ "$(normalize_reply "${CONFIRM_RESPONSE:-}")" == "yes" && "${CONFIRM_ACTION_ID:-}" == "$ACTION_ID" && "${CONFIRM_NONCE:-}" == "$NONCE" ]]; then
    approved="yes"
  elif [[ "$(normalize_reply "${CONFIRM_RESPONSE:-}")" =~ ^(y|yes|true|approved|approve)$ && "${CONFIRM_ACTION_ID:-}" == "$ACTION_ID" && "${CONFIRM_NONCE:-}" == "$NONCE" ]]; then
    approved="yes"
  fi
fi

if [[ "$approved" != "yes" ]]; then
  echo "confirm_state=skipped"
  echo "confirm_action_id=$ACTION_ID"
  echo "confirm_nonce=${NONCE:-interactive}"
  log_skip "Command not approved by user."
  log_hint "Set CONFIRM_RESPONSE=yes, CONFIRM_ACTION_ID=$ACTION_ID, and CONFIRM_NONCE=${NONCE:-interactive} after explicit user approval."
  exit 3
fi

mkdir -p "$ledger_dir"

run_command() {
  if [[ -n "$WORKDIR" ]]; then
    cd "$WORKDIR"
  fi

  if [[ -n "$STDIN_ENV" ]]; then
    local stdin_value="${!STDIN_ENV:-}"
    if is_machine_readable; then
      printf '%s' "$stdin_value" | "${ARGV[@]}" >&2
    else
      printf '%s' "$stdin_value" | "${ARGV[@]}"
    fi
  else
    if is_machine_readable; then
      "${ARGV[@]}" >&2
    else
      "${ARGV[@]}"
    fi
  fi
}

if run_command; then
  : >"$ledger_file"
  echo "confirm_state=approved"
  echo "confirm_action_id=$ACTION_ID"
  echo "confirm_nonce=${NONCE:-interactive}"
  exit 0
fi

echo "confirm_state=error"
echo "confirm_action_id=$ACTION_ID"
echo "confirm_nonce=${NONCE:-interactive}"
echo "confirm_error_reason=command_failed"
exit 5
