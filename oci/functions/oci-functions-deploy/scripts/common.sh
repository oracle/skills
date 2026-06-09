#!/usr/bin/env bash

is_interactive() {
  [[ -t 0 ]]
}

is_machine_readable() {
  [[ "${MACHINE_READABLE:-false}" == "true" ]]
}

human_out() {
  if is_machine_readable; then
    printf '%s\n' "$*" >&2
  else
    printf '%s\n' "$*"
  fi
}

log_section() {
  human_out "== $* =="
}

log_info() {
  human_out "[INFO] $*"
}

log_warn() {
  human_out "[WARN] $*"
}

log_ok() {
  human_out "[OK] $*"
}

log_missing() {
  human_out "[MISSING] $*"
}

log_skip() {
  human_out "[SKIP] $*"
}

log_hint() {
  human_out "[HINT] $*"
}

emit_kv() {
  printf '%s=%s\n' "$1" "$2"
}

normalize_reply() {
  printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'
}

next_confirm_nonce() {
  CODEX_CONFIRM_NONCE_SEQ="${CODEX_CONFIRM_NONCE_SEQ:-0}"
  CODEX_CONFIRM_NONCE_SEQ=$((CODEX_CONFIRM_NONCE_SEQ + 1))
  printf '%s-%s-%s' "$$" "$(date +%s)" "$CODEX_CONFIRM_NONCE_SEQ"
}

resolve_preferred_value() {
  local candidate=""
  for candidate in "$@"; do
    if [[ -n "$candidate" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

extract_region_from_api_url() {
  local url="$1"
  sed -n 's#https://functions\.\([^.]*-[^.]*-[0-9]*\)\.oci\.oraclecloud\.com#\1#p' <<<"$url"
}

classify_oci_error_reason() {
  local text="${1:-}"
  if grep -Eiq 'NotAuthenticated|NotAuthorized|NotAuthorizedOrNotFound|401|403|auth|permission|insufficient|profile.*not found|user.*missing' <<<"$text"; then
    printf 'auth_or_permission'
    return 0
  fi
  if grep -Eiq 'timeout|timed out|temporary failure|connection reset|connection refused|name or service not known|unable to resolve|network|transport|TLS|SSL|certificate|proxy|host unreachable' <<<"$text"; then
    printf 'network_or_transport'
    return 0
  fi
  printf 'runtime_or_cli'
}

run_oci_capture() {
  local __out_var="$1"
  local __err_var="$2"
  shift 2

  local out_file
  local err_file
  out_file="$(mktemp)"
  err_file="$(mktemp)"

  if oci "$@" >"$out_file" 2>"$err_file"; then
    printf -v "$__out_var" "%s" "$(cat "$out_file")"
    printf -v "$__err_var" "%s" "$(cat "$err_file")"
    rm -f "$out_file" "$err_file"
    return 0
  fi

  printf -v "$__out_var" "%s" "$(cat "$out_file")"
  printf -v "$__err_var" "%s" "$(cat "$err_file")"
  rm -f "$out_file" "$err_file"
  return 1
}

docker_registry_auth_probe() {
  local host="$1"
  local cfg="$HOME/.docker/config.json"

  if [[ ! -f "$cfg" ]]; then
    printf 'missing'
    return 0
  fi
  if ! command -v python3 >/dev/null 2>&1; then
    printf 'error'
    return 0
  fi

  python3 - <<'PY' "$cfg" "$host"
import base64
import json
import shutil
import socket
import ssl
import subprocess
import sys
import urllib.error
import urllib.request

cfg_path, host = sys.argv[1], sys.argv[2]

def emit(value: str) -> None:
    print(value)
    raise SystemExit(0)

try:
    with open(cfg_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
except Exception:
    emit("error")

auths = data.get("auths") or {}
cred_helpers = data.get("credHelpers") or {}
creds_store = data.get("credsStore")
candidates = [host, f"https://{host}", f"http://{host}"]

entry = None
for candidate in candidates:
    if candidate in auths:
        entry = auths[candidate]
        break

helper_name = None
for candidate in candidates:
    if candidate in cred_helpers:
        helper_name = cred_helpers[candidate]
        break
if helper_name is None and creds_store:
    helper_name = creds_store

resolved_username = None
resolved_secret = None

if entry and entry.get("auth"):
    try:
        decoded = base64.b64decode(entry["auth"]).decode("utf-8")
        if ":" in decoded:
            resolved_username, resolved_secret = decoded.split(":", 1)
    except Exception:
        emit("error")

if helper_name:
    helper_bin = shutil.which(f"docker-credential-{helper_name}")
    if helper_bin is None:
        emit("error")
    try:
        proc = subprocess.run(
            [helper_bin, "get"],
            input=host.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
    except Exception:
        emit("error")

    if proc.returncode == 0:
        try:
            payload = json.loads(proc.stdout.decode("utf-8"))
            username = payload.get("Username")
            secret = payload.get("Secret")
            if username and secret:
                resolved_username = username
                resolved_secret = secret
        except Exception:
            emit("error")
    elif not entry:
        emit("cached")

if not resolved_secret:
    if entry or helper_name:
      emit("cached")
    emit("missing")

auth_value = base64.b64encode(f"{resolved_username}:{resolved_secret}".encode("utf-8")).decode("ascii")
request = urllib.request.Request(f"https://{host}/v2/")
request.add_header("Authorization", f"Basic {auth_value}")

try:
    with urllib.request.urlopen(request, timeout=5) as response:
        code = getattr(response, "status", response.getcode())
        if 200 <= int(code) < 300:
            emit("valid")
        emit("cached")
except urllib.error.HTTPError as exc:
    if exc.code in (401, 403):
        emit("cached")
    emit("cached")
except (urllib.error.URLError, socket.timeout, ssl.SSLError, OSError):
    emit("cached")
PY
}
