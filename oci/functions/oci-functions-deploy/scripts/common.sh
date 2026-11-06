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
  local key="${1:-}"
  local value="${2:-}"
  local LC_ALL=C

  if [[ ! "$key" =~ ^[a-z][a-z0-9_]*$ ]]; then
    printf '[ERROR] Refusing invalid machine-readable key.\n' >&2
    return 1
  fi
  if [[ "$value" =~ [[:cntrl:]] ]]; then
    printf '[ERROR] Refusing control characters in machine-readable value for key %s.\n' "$key" >&2
    return 1
  fi

  printf '%s=%s\n' "$key" "$value"
}

normalize_reply() {
  printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'
}

read_confirm_nonce_bytes() {
  od -An -N16 -tx1 /dev/urandom 2>/dev/null
}

next_confirm_nonce() {
  local raw=""
  local nonce=""

  raw="$(read_confirm_nonce_bytes)" || {
    printf '[ERROR] Secure confirmation nonce generation failed.\n' >&2
    return 1
  }
  nonce="$(printf '%s' "$raw" | tr -d '[:space:]')"
  if [[ ! "$nonce" =~ ^[0-9a-f]{32}$ ]]; then
    printf '[ERROR] Secure confirmation nonce generation returned invalid data.\n' >&2
    return 1
  fi

  printf '%s' "$nonce"
}

find_unique_resource_id_by_display_name() {
  local payload="$1"
  local display_name="$2"

  printf '%s' "$payload" | python3 -c '
import json
import sys

name = sys.argv[1]
try:
    payload = json.load(sys.stdin)
except (TypeError, ValueError) as exc:
    print(f"invalid OCI JSON: {exc}", file=sys.stderr)
    raise SystemExit(2)

items = payload.get("data", []) if isinstance(payload, dict) else []
matches = [item for item in items if isinstance(item, dict) and item.get("display-name") == name]
if len(matches) > 1:
    print(f"ambiguous display name: {name!r} matched {len(matches)} resources", file=sys.stderr)
    raise SystemExit(3)
if not matches:
    raise SystemExit(0)

resource_id = matches[0].get("id")
if not isinstance(resource_id, str) or not resource_id:
    print("matched resource has no valid id", file=sys.stderr)
    raise SystemExit(2)
print(resource_id)
' "$display_name"
}

extract_safe_display_names() {
  local payload="$1"

  printf '%s' "$payload" | python3 -c '
import json
import sys

try:
    payload = json.load(sys.stdin)
except (TypeError, ValueError) as exc:
    print(f"invalid OCI JSON: {exc}", file=sys.stderr)
    raise SystemExit(2)

items = payload.get("data", []) if isinstance(payload, dict) else []
for item in items:
    if not isinstance(item, dict):
        continue
    name = item.get("display-name")
    if not isinstance(name, str):
        continue
    if any(ord(char) < 32 or ord(char) == 127 for char in name):
        print("resource display name contains control characters", file=sys.stderr)
        raise SystemExit(3)
    print(name)
'
}

run_oci_display_name_lookup() {
  local __out_var="$1"
  local __err_var="$2"
  local display_name="$3"
  shift 3

  local payload=""
  local command_error=""
  local matched_id=""
  local lookup_status=0

  if ! run_oci_capture payload command_error "$@" --output json; then
    printf -v "$__out_var" '%s' ""
    printf -v "$__err_var" '%s' "$command_error"
    return 1
  fi

  matched_id="$(find_unique_resource_id_by_display_name "$payload" "$display_name")" || lookup_status=$?
  if [[ "$lookup_status" -ne 0 ]]; then
    printf -v "$__out_var" '%s' ""
    printf -v "$__err_var" '%s' "display-name lookup failed with status $lookup_status"
    return "$lookup_status"
  fi

  printf -v "$__out_var" '%s' "$matched_id"
  printf -v "$__err_var" '%s' ""
}

run_oci_display_name_list() {
  local __out_var="$1"
  local __err_var="$2"
  shift 2

  local payload=""
  local command_error=""
  local names=""
  local parse_status=0

  if ! run_oci_capture payload command_error "$@" --output json; then
    printf -v "$__out_var" '%s' ""
    printf -v "$__err_var" '%s' "$command_error"
    return 1
  fi

  names="$(extract_safe_display_names "$payload")" || parse_status=$?
  if [[ "$parse_status" -ne 0 ]]; then
    printf -v "$__out_var" '%s' ""
    printf -v "$__err_var" '%s' "display-name list parsing failed with status $parse_status"
    return "$parse_status"
  fi

  printf -v "$__out_var" '%s' "$names"
  printf -v "$__err_var" '%s' ""
}

resolve_latest_fn_linux_release() {
  local __version_var="$1"
  local __url_var="$2"
  local __digest_var="$3"
  local metadata=""
  local parsed=""
  local resolved_version=""
  local resolved_asset_url=""
  local resolved_digest=""

  if ! command -v python3 >/dev/null 2>&1; then
    printf '[ERROR] python3 is required to validate Fn CLI release metadata.\n' >&2
    return 1
  fi

  metadata="$(curl \
    --proto '=https' \
    --proto-redir '=https' \
    --tlsv1.2 \
    --fail \
    --silent \
    --show-error \
    --location \
    --connect-timeout 10 \
    --max-time 30 \
    --retry 2 \
    --header 'Accept: application/vnd.github+json' \
    --header 'X-GitHub-Api-Version: 2022-11-28' \
    'https://api.github.com/repos/fnproject/cli/releases/latest')" || {
      printf '[ERROR] Unable to resolve the latest Fn CLI release from GitHub.\n' >&2
      return 1
    }

  parsed="$(printf '%s' "$metadata" | python3 -c '
import json
import re
import sys

try:
    release = json.load(sys.stdin)
except (TypeError, ValueError) as exc:
    print(f"invalid GitHub release metadata: {exc}", file=sys.stderr)
    raise SystemExit(2)

tag = release.get("tag_name")
if release.get("draft") is not False or release.get("prerelease") is not False:
    print("latest Fn release is draft or prerelease", file=sys.stderr)
    raise SystemExit(3)
if not isinstance(tag, str) or not re.fullmatch(r"v?[0-9]+\.[0-9]+\.[0-9]+", tag):
    print("latest Fn release has an invalid semantic version tag", file=sys.stderr)
    raise SystemExit(3)

assets = [asset for asset in release.get("assets", []) if isinstance(asset, dict) and asset.get("name") == "fn_linux"]
if len(assets) != 1:
    print("latest Fn release must contain exactly one fn_linux asset", file=sys.stderr)
    raise SystemExit(3)

asset = assets[0]
url = asset.get("browser_download_url")
digest = asset.get("digest")
expected_url = f"https://github.com/fnproject/cli/releases/download/{tag}/fn_linux"
if asset.get("state") != "uploaded" or not isinstance(asset.get("size"), int) or asset.get("size", 0) <= 0:
    print("latest Fn Linux asset is not fully uploaded", file=sys.stderr)
    raise SystemExit(3)
if url != expected_url:
    print("latest Fn Linux asset URL is not canonical", file=sys.stderr)
    raise SystemExit(3)
if not isinstance(digest, str) or not re.fullmatch(r"sha256:[0-9a-f]{64}", digest):
    print("latest Fn Linux asset has no valid SHA-256 digest", file=sys.stderr)
    raise SystemExit(3)

print(tag, url, digest, sep="\t")
')" || {
    printf '[ERROR] Latest Fn CLI release metadata failed validation.\n' >&2
    return 1
  }

  IFS=$'\t' read -r resolved_version resolved_asset_url resolved_digest <<<"$parsed"
  if [[ -z "$resolved_version" || -z "$resolved_asset_url" || -z "$resolved_digest" ]]; then
    printf '[ERROR] Latest Fn CLI release metadata was incomplete.\n' >&2
    return 1
  fi

  printf -v "$__version_var" '%s' "$resolved_version"
  printf -v "$__url_var" '%s' "$resolved_asset_url"
  printf -v "$__digest_var" '%s' "$resolved_digest"
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
