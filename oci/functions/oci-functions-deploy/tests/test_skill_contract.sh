#!/usr/bin/env bash
set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$TEST_DIR/.." && pwd)"

PASS_COUNT=0
FAIL_COUNT=0

run_capture() {
  local __stdout_var="$1"
  local __stderr_var="$2"
  local __status_var="$3"
  shift 3

  local stdout_file
  local stderr_file
  local capture_status

  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"
  if "$@" >"$stdout_file" 2>"$stderr_file"; then
    capture_status=0
  else
    capture_status=$?
  fi

  printf -v "$__stdout_var" "%s" "$(cat "$stdout_file")"
  printf -v "$__stderr_var" "%s" "$(cat "$stderr_file")"
  printf -v "$__status_var" "%s" "$capture_status"
  rm -f "$stdout_file" "$stderr_file"
}

fail_test() {
  local name="$1"
  local message="$2"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf 'not ok - %s: %s\n' "$name" "$message"
}

pass_test() {
  local name="$1"
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'ok - %s\n' "$name"
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  grep -Fq -- "$needle" <<<"$haystack"
}

assert_kv_only() {
  local text="$1"
  local line=""
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[a-z0-9_]+=.*$ ]] || return 1
  done <<<"$text"
}

make_stub_env() {
  local root="$1"
  mkdir -p "$root/bin" "$root/home/.docker"

  cat >"$root/bin/fn" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  inspect)
    if [[ "${2:-}" == "context" ]]; then
      cat <<'CTX'
Current context: ctx
provider: oracle
oracle.profile: ctxprofile
oracle.compartment-id: ocid1.compartment.oc1..ctx
api-url: https://functions.us-phoenix-1.oci.oraclecloud.com
registry: phx.ocir.io/namespace/repo
oracle.image-compartment-id: ocid1.compartment.oc1..images
CTX
      exit 0
    fi
    ;;
  list)
    if [[ "${2:-}" == "context" ]]; then
      cat <<'CTX'
Current context: ctx
provider: oracle
oracle.profile: ctxprofile
oracle.compartment-id: ocid1.compartment.oc1..ctx
api-url: https://functions.us-phoenix-1.oci.oraclecloud.com
registry: phx.ocir.io/namespace/repo
oracle.image-compartment-id: ocid1.compartment.oc1..images
CTX
      exit 0
    fi
    ;;
  create)
    exit 0
    ;;
  use)
    exit 0
    ;;
  update)
    exit 0
    ;;
  init)
    : > func.yaml
    printf 'initialized\n'
    exit 0
    ;;
  -v)
    if [[ "${2:-}" == "deploy" ]]; then
      printf 'deployed\n'
      exit 0
    fi
    ;;
esac

if [[ "${1:-}" == "--version" ]]; then
  printf 'fn version 0.6.32\n'
  exit 0
fi

printf 'unsupported fn invocation: %s\n' "$*" >&2
exit 1
EOF

  cat >"$root/bin/oci" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "iam" && "${2:-}" == "region" && "${3:-}" == "list" ]]; then
  printf '[]\n'
  exit 0
fi

if [[ "${1:-}" == "fn" && "${2:-}" == "application" && "${3:-}" == "list" ]]; then
  printf '{"data":[{"display-name":"existing-app","id":"ocid1.fnapp.oc1..existing"}]}\n'
  exit 0
fi

printf 'unsupported oci invocation: %s\n' "$*" >&2
exit 1
EOF

  cat >"$root/bin/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  --version)
    printf 'Docker version 25.0.0\n'
    ;;
  info)
    printf 'docker-info\n'
    ;;
  login)
    printf 'login-ok\n'
    ;;
  *)
    printf 'unsupported docker invocation: %s\n' "$*" >&2
    exit 1
    ;;
esac
EOF

  chmod +x "$root/bin/fn" "$root/bin/oci" "$root/bin/docker"

  cat >"$root/home/.docker/config.json" <<'EOF'
{
  "auths": {
    "phx.ocir.io": {
      "auth": "dXNlcjp0b2tlbg=="
    }
  }
}
EOF
}

test_confirm_gate_contract() {
  local name="confirm gate uppercase env + replay"
  local temp_dir
  local stdout=""
  local stderr=""
  local status=""
  local action_id=""

  temp_dir="$(mktemp -d)"
  run_capture stdout stderr status \
    env TMPDIR="$temp_dir" PATH="$PATH" \
    "$SKILL_DIR/scripts/confirm_gate.sh" \
    --description "test approval" \
    --nonce "nonce-1" \
    -- /usr/bin/true

  [[ "$status" -eq 3 ]] || {
    fail_test "$name" "expected initial unapproved status 3, got $status"
    rm -rf "$temp_dir"
    return
  }

  action_id="$(awk -F= '/^confirm_action_id=/{print $2}' <<<"$stdout")"
  [[ -n "$action_id" ]] || {
    fail_test "$name" "missing action id from initial probe"
    rm -rf "$temp_dir"
    return
  }

  run_capture stdout stderr status \
    env TMPDIR="$temp_dir" PATH="$PATH" \
    confirm_response=yes \
    confirm_action_id="$action_id" \
    confirm_nonce="nonce-1" \
    "$SKILL_DIR/scripts/confirm_gate.sh" \
    --description "test approval" \
    --nonce "nonce-1" \
    -- /usr/bin/true

  if [[ "$status" -ne 3 ]] || ! assert_contains "$stdout" "confirm_state=skipped"; then
    fail_test "$name" "lowercase env vars should be ignored"
    rm -rf "$temp_dir"
    return
  fi

  run_capture stdout stderr status \
    env TMPDIR="$temp_dir" PATH="$PATH" \
    CONFIRM_RESPONSE=yes \
    CONFIRM_ACTION_ID="$action_id" \
    CONFIRM_NONCE="nonce-1" \
    "$SKILL_DIR/scripts/confirm_gate.sh" \
    --description "test approval" \
    --nonce "nonce-1" \
    -- /usr/bin/true

  if [[ "$status" -ne 0 ]] || ! assert_contains "$stdout" "confirm_state=approved"; then
    fail_test "$name" "uppercase env vars should approve the command"
    rm -rf "$temp_dir"
    return
  fi

  run_capture stdout stderr status \
    env TMPDIR="$temp_dir" PATH="$PATH" \
    CONFIRM_RESPONSE=yes \
    CONFIRM_ACTION_ID="$action_id" \
    CONFIRM_NONCE="nonce-1" \
    "$SKILL_DIR/scripts/confirm_gate.sh" \
    --description "test approval" \
    --nonce "nonce-1" \
    -- /usr/bin/true

  if [[ "$status" -ne 4 ]] || ! assert_contains "$stdout" "confirm_error_reason=already_consumed"; then
    fail_test "$name" "replay should be rejected after a successful mutation"
    rm -rf "$temp_dir"
    return
  fi

  run_capture stdout stderr status \
    env TMPDIR="$temp_dir" PATH="$PATH" \
    "$SKILL_DIR/scripts/confirm_gate.sh" \
    --description "test approval" \
    --nonce "../unsafe" \
    -- /usr/bin/true

  if [[ "$status" -ne 2 ]] || ! assert_contains "$stdout" "confirm_error_reason=invalid_nonce"; then
    fail_test "$name" "unsafe nonce path was not rejected"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_confirm_gate_interactive_fresh_nonce() {
  local name="confirm gate interactive fresh nonce"

  if python3 - <<'PY' "$SKILL_DIR/scripts/confirm_gate.sh"; then
import os
import pty
import select
import subprocess
import sys
import time

script = sys.argv[1]
cmd = [script, "--description", "interactive replay test", "--", "/usr/bin/true"]

def run_once():
    master, slave = pty.openpty()
    proc = subprocess.Popen(
        cmd,
        stdin=slave,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        close_fds=True,
    )
    os.close(slave)
    err_chunks = []
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        ready, _, _ = select.select([proc.stderr], [], [], 0.1)
        if not ready:
            if proc.poll() is not None:
                break
            continue
        chunk = os.read(proc.stderr.fileno(), 1024)
        if not chunk:
            break
        err_chunks.append(chunk)
        if b"Proceed? [y/N]: " in b"".join(err_chunks):
            break
    else:
        proc.kill()
        raise RuntimeError("confirmation prompt timed out")

    if b"Proceed? [y/N]: " not in b"".join(err_chunks):
        proc.kill()
        raise RuntimeError("confirmation prompt was not emitted")

    os.write(master, b"y\n")
    os.close(master)
    out, remaining_err = proc.communicate(timeout=15)
    err = b"".join(err_chunks) + remaining_err
    return proc.returncode, out.decode(), err.decode()

results = [run_once() for _ in range(10)]
for index, result in enumerate(results):
    if result[0] != 0 or "confirm_state=approved" not in result[1]:
        raise SystemExit(index + 1)
PY
    pass_test "$name"
  else
    fail_test "$name" "interactive re-approval should succeed on a second identical command"
  fi
}

test_common_security_contracts() {
  local name="common helpers reject injected output and mint unique nonces"
  local stdout=""
  local stderr=""
  local status=""

  # shellcheck disable=SC2016
  run_capture stdout stderr status bash -c '
    set -euo pipefail
    source "$1"
    declare -A seen=()
    for _ in $(seq 1 128); do
      nonce="$(next_confirm_nonce)"
      [[ "$nonce" =~ ^[0-9a-f]{32}$ ]]
      [[ -z "${seen[$nonce]:-}" ]]
      seen[$nonce]=1
    done
    emit_kv safe_key safe-value
    if emit_kv unsafe_key $'"'"'first\nforged_key=value'"'"'; then
      exit 11
    fi
    read_confirm_nonce_bytes() { return 1; }
    if next_confirm_nonce >/dev/null; then
      exit 12
    fi
  ' _ "$SKILL_DIR/scripts/common.sh"

  if [[ "$status" -ne 0 ]]; then
    fail_test "$name" "security helper contract failed with $status: $stderr"
    return
  fi
  if [[ "$stdout" != "safe_key=safe-value" ]] || assert_contains "$stdout" "forged_key=value"; then
    fail_test "$name" "unsafe machine-readable value was emitted"
    return
  fi

  pass_test "$name"
}

test_json_display_name_lookup_contract() {
  local name="JSON display-name lookup is exact and rejects ambiguity"
  local stdout=""
  local stderr=""
  local status=""
  local payload='{"data":[{"display-name":"safe-app","id":"ocid.safe"},{"display-name":"x'"'"'] | [0]","id":"ocid.inject"}]}'

  # shellcheck disable=SC2016
  run_capture stdout stderr status bash -c '
    set -euo pipefail
    source "$1"
    find_unique_resource_id_by_display_name "$2" "$3"
  ' _ "$SKILL_DIR/scripts/common.sh" "$payload" "x'] | [0]"

  if [[ "$status" -ne 0 || "$stdout" != "ocid.inject" ]]; then
    fail_test "$name" "exact lookup failed: status=$status stdout=$stdout stderr=$stderr"
    return
  fi

  payload='{"data":[{"display-name":"duplicate","id":"ocid.one"},{"display-name":"duplicate","id":"ocid.two"}]}'
  # shellcheck disable=SC2016
  run_capture stdout stderr status bash -c '
    set -euo pipefail
    source "$1"
    find_unique_resource_id_by_display_name "$2" duplicate
  ' _ "$SKILL_DIR/scripts/common.sh" "$payload"

  if [[ "$status" -eq 0 ]] || ! assert_contains "$stderr" "ambiguous"; then
    fail_test "$name" "duplicate lookup was not rejected"
    return
  fi

  pass_test "$name"
}

test_confirm_gate_escapes_display_controls() {
  local name="confirm gate escapes control characters in review text"
  local stdout=""
  local stderr=""
  local status=""
  local description=$'Deploy app\n[COMMAND] forged'
  local display=$'oci fn deploy\033[2Jforged'

  run_capture stdout stderr status \
    env TMPDIR="$(mktemp -d)" PATH="$PATH" \
    "$SKILL_DIR/scripts/confirm_gate.sh" \
    --description "$description" \
    --display "$display" \
    --nonce "control-test" \
    -- /usr/bin/true

  if [[ "$status" -ne 3 ]]; then
    fail_test "$name" "expected unapproved status 3, got $status"
    return
  fi
  if [[ "$(grep -c '^\[COMMAND\]' <<<"$stdout")" -ne 1 ]] || grep -Fq $'\033' <<<"$stdout"; then
    fail_test "$name" "raw control characters altered the confirmation output"
    return
  fi

  pass_test "$name"
}

test_latest_fn_release_metadata_contract() {
  local name="latest Fn release metadata is strictly validated"
  local temp_dir
  local stdout=""
  local stderr=""
  local status=""

  temp_dir="$(mktemp -d)"
  mkdir -p "$temp_dir/bin"
  cat >"$temp_dir/bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${FN_TEST_CURL_FAIL:-no}" == "yes" ]]; then
  exit 22
fi
printf '%s' "${FN_TEST_RELEASE_JSON:?}"
EOF
  cat >"$temp_dir/bin/od" <<'EOF'
#!/usr/bin/env bash
printf ' 00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff\n'
EOF
  chmod +x "$temp_dir/bin/curl" "$temp_dir/bin/od"

  good_json='{"draft":false,"prerelease":false,"tag_name":"0.6.61","assets":[{"name":"fn_linux","state":"uploaded","size":20490071,"browser_download_url":"https://github.com/fnproject/cli/releases/download/0.6.61/fn_linux","digest":"sha256:dba87f9e3406d3bb3f6a796693e6bd83a0af189a4a8ef875a3f5f55cb4711683"}]}'
  # shellcheck disable=SC2016
  run_capture stdout stderr status env PATH="$temp_dir/bin:$PATH" FN_TEST_RELEASE_JSON="$good_json" bash -c '
    set -euo pipefail
    source "$1"
    resolve_latest_fn_linux_release version url digest
    printf "%s\n%s\n%s\n" "$version" "$url" "$digest"
  ' _ "$SKILL_DIR/scripts/common.sh"

  if [[ "$status" -ne 0 ]] || ! assert_contains "$stdout" "0.6.61" || ! assert_contains "$stdout" "sha256:dba87f9e"; then
    fail_test "$name" "valid release metadata was rejected: $stderr"
    rm -rf "$temp_dir"
    return
  fi

  bad_json='{"draft":false,"prerelease":false,"tag_name":"0.6.61","assets":[{"name":"fn_linux","state":"uploaded","size":10,"browser_download_url":"https://attacker.invalid/fn_linux","digest":null}]}'
  # shellcheck disable=SC2016
  run_capture stdout stderr status env PATH="$temp_dir/bin:$PATH" FN_TEST_RELEASE_JSON="$bad_json" bash -c '
    set -euo pipefail
    source "$1"
    resolve_latest_fn_linux_release version url digest
  ' _ "$SKILL_DIR/scripts/common.sh"

  if [[ "$status" -eq 0 ]]; then
    fail_test "$name" "unsafe release metadata was accepted"
    rm -rf "$temp_dir"
    return
  fi

  missing_digest_json='{"draft":false,"prerelease":false,"tag_name":"0.6.61","assets":[{"name":"fn_linux","state":"uploaded","size":10,"browser_download_url":"https://github.com/fnproject/cli/releases/download/0.6.61/fn_linux","digest":null}]}'
  # shellcheck disable=SC2016
  run_capture stdout stderr status env PATH="$temp_dir/bin:$PATH" FN_TEST_RELEASE_JSON="$missing_digest_json" bash -c '
    set -euo pipefail
    source "$1"
    resolve_latest_fn_linux_release version url digest
  ' _ "$SKILL_DIR/scripts/common.sh"
  if [[ "$status" -eq 0 ]]; then
    fail_test "$name" "release metadata without a digest was accepted"
    rm -rf "$temp_dir"
    return
  fi

  malformed_json='{not-json'
  # shellcheck disable=SC2016
  run_capture stdout stderr status env PATH="$temp_dir/bin:$PATH" FN_TEST_RELEASE_JSON="$malformed_json" bash -c '
    set -euo pipefail
    source "$1"
    resolve_latest_fn_linux_release version url digest
  ' _ "$SKILL_DIR/scripts/common.sh"
  if [[ "$status" -eq 0 ]]; then
    fail_test "$name" "malformed release metadata was accepted"
    rm -rf "$temp_dir"
    return
  fi

  # shellcheck disable=SC2016
  run_capture stdout stderr status env PATH="$temp_dir/bin:$PATH" FN_TEST_RELEASE_JSON="$good_json" FN_TEST_CURL_FAIL=yes bash -c '
    set -euo pipefail
    source "$1"
    resolve_latest_fn_linux_release version url digest
  ' _ "$SKILL_DIR/scripts/common.sh"
  if [[ "$status" -eq 0 ]]; then
    fail_test "$name" "release metadata transport failure was accepted"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_fn_installer_verification_contract() {
  local name="Fn installer verifies digest and version before privileged install"
  local temp_dir
  local stdout=""
  local stderr=""
  local status=""
  local digest=""
  local wrong_version_digest=""

  temp_dir="$(mktemp -d)"
  mkdir -p "$temp_dir/bin"
  cat >"$temp_dir/fn_linux" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == "--version" ]]; then
  printf 'fn version 0.6.61\n'
  exit 0
fi
exit 1
EOF
  chmod +x "$temp_dir/fn_linux"
  digest="sha256:$(shasum -a 256 "$temp_dir/fn_linux" | awk '{print $1}')"

  cat >"$temp_dir/bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
output=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) output="$2"; shift 2 ;;
    *) shift ;;
  esac
done
if [[ "${FN_TEST_CURL_FAIL:-no}" == "yes" ]]; then
  exit 22
fi
cp "${FN_TEST_ASSET:?}" "$output"
EOF
  cat >"$temp_dir/bin/uname" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -s) printf 'Linux\n' ;;
  -m) printf '%s\n' "${FN_TEST_ARCH:-x86_64}" ;;
  *) exit 1 ;;
esac
EOF
  cat >"$temp_dir/bin/id" <<'EOF'
#!/usr/bin/env bash
printf '1000\n'
EOF
  cat >"$temp_dir/bin/sudo" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >"${FN_TEST_INSTALL_LOG:?}"
EOF
  chmod +x "$temp_dir/bin/curl" "$temp_dir/bin/uname" "$temp_dir/bin/id" "$temp_dir/bin/sudo"

  run_capture stdout stderr status env \
    PATH="$temp_dir/bin:$PATH" \
    FN_TEST_ASSET="$temp_dir/fn_linux" \
    FN_TEST_INSTALL_LOG="$temp_dir/install.log" \
    "$SKILL_DIR/scripts/install_fn_linux.sh" \
    --version 0.6.61 \
    --asset-url https://github.com/fnproject/cli/releases/download/0.6.61/fn_linux \
    --sha256 "$digest"

  if [[ "$status" -ne 0 ]] || [[ ! -f "$temp_dir/install.log" ]] || ! assert_contains "$(cat "$temp_dir/install.log")" "/usr/local/bin/fn"; then
    fail_test "$name" "verified installer did not reach the install step: $stderr"
    rm -rf "$temp_dir"
    return
  fi

  rm -f "$temp_dir/install.log"
  run_capture stdout stderr status env \
    PATH="$temp_dir/bin:$PATH" \
    FN_TEST_ASSET="$temp_dir/fn_linux" \
    FN_TEST_INSTALL_LOG="$temp_dir/install.log" \
    "$SKILL_DIR/scripts/install_fn_linux.sh" \
    --version 0.6.61 \
    --asset-url https://github.com/fnproject/cli/releases/download/0.6.61/fn_linux \
    --sha256 sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

  if [[ "$status" -eq 0 ]] || [[ -f "$temp_dir/install.log" ]]; then
    fail_test "$name" "checksum mismatch reached the install step"
    rm -rf "$temp_dir"
    return
  fi

  cat >"$temp_dir/fn_wrong_version" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == "--version" ]]; then
  printf 'fn version 0.6.60\n'
  exit 0
fi
exit 1
EOF
  chmod +x "$temp_dir/fn_wrong_version"
  wrong_version_digest="sha256:$(shasum -a 256 "$temp_dir/fn_wrong_version" | awk '{print $1}')"
  run_capture stdout stderr status env \
    PATH="$temp_dir/bin:$PATH" \
    FN_TEST_ASSET="$temp_dir/fn_wrong_version" \
    FN_TEST_INSTALL_LOG="$temp_dir/install.log" \
    "$SKILL_DIR/scripts/install_fn_linux.sh" \
    --version 0.6.61 \
    --asset-url https://github.com/fnproject/cli/releases/download/0.6.61/fn_linux \
    --sha256 "$wrong_version_digest"
  if [[ "$status" -eq 0 || -f "$temp_dir/install.log" ]]; then
    fail_test "$name" "version mismatch reached the install step"
    rm -rf "$temp_dir"
    return
  fi

  run_capture stdout stderr status env \
    PATH="$temp_dir/bin:$PATH" \
    FN_TEST_ASSET="$temp_dir/fn_linux" \
    FN_TEST_INSTALL_LOG="$temp_dir/install.log" \
    FN_TEST_ARCH=arm64 \
    "$SKILL_DIR/scripts/install_fn_linux.sh" \
    --version 0.6.61 \
    --asset-url https://github.com/fnproject/cli/releases/download/0.6.61/fn_linux \
    --sha256 "$digest"
  if [[ "$status" -eq 0 || -f "$temp_dir/install.log" ]]; then
    fail_test "$name" "unsupported architecture reached the install step"
    rm -rf "$temp_dir"
    return
  fi

  run_capture stdout stderr status env \
    PATH="$temp_dir/bin:$PATH" \
    FN_TEST_ASSET="$temp_dir/fn_linux" \
    FN_TEST_INSTALL_LOG="$temp_dir/install.log" \
    FN_TEST_CURL_FAIL=yes \
    "$SKILL_DIR/scripts/install_fn_linux.sh" \
    --version 0.6.61 \
    --asset-url https://github.com/fnproject/cli/releases/download/0.6.61/fn_linux \
    --sha256 "$digest"
  if [[ "$status" -eq 0 || -f "$temp_dir/install.log" ]]; then
    fail_test "$name" "download failure reached the install step"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_fn_install_confirmation_binds_release() {
  local name="Fn install confirmation binds the resolved release digest"
  local temp_dir
  local stdout_one=""
  local stderr_one=""
  local status_one=""
  local stdout_two=""
  local stderr_two=""
  local status_two=""
  local action_one=""
  local action_two=""

  temp_dir="$(mktemp -d)"
  mkdir -p "$temp_dir/bin"
  cat >"$temp_dir/bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s' "${FN_TEST_RELEASE_JSON:?}"
EOF
  cat >"$temp_dir/bin/od" <<'EOF'
#!/usr/bin/env bash
printf ' 00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff\n'
EOF
  chmod +x "$temp_dir/bin/curl" "$temp_dir/bin/od"

  json_one='{"draft":false,"prerelease":false,"tag_name":"0.6.61","assets":[{"name":"fn_linux","state":"uploaded","size":10,"browser_download_url":"https://github.com/fnproject/cli/releases/download/0.6.61/fn_linux","digest":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]}'
  json_two="${json_one//sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb}"

  run_capture stdout_one stderr_one status_one env PATH="$temp_dir/bin:$PATH" FN_TEST_RELEASE_JSON="$json_one" TMPDIR="$temp_dir/one" \
    "$SKILL_DIR/scripts/install_missing.sh" --tool fn --os linux --machine-readable
  run_capture stdout_two stderr_two status_two env PATH="$temp_dir/bin:$PATH" FN_TEST_RELEASE_JSON="$json_two" TMPDIR="$temp_dir/two" \
    "$SKILL_DIR/scripts/install_missing.sh" --tool fn --os linux --machine-readable

  action_one="$(awk -F= '/^confirm_action_id=/{print $2}' <<<"$stdout_one")"
  action_two="$(awk -F= '/^confirm_action_id=/{print $2}' <<<"$stdout_two")"
  if [[ "$status_one" -ne 3 || "$status_two" -ne 3 || -z "$action_one" || -z "$action_two" || "$action_one" == "$action_two" ]]; then
    fail_test "$name" "confirmation action did not change with the release digest: $stderr_one $stderr_two"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_preflight_precedence_and_machine_readable() {
  local name="preflight explicit precedence + machine-readable stdout"
  local temp_dir
  local stdout=""
  local stderr=""
  local status=""

  temp_dir="$(mktemp -d)"
  make_stub_env "$temp_dir"

  run_capture stdout stderr status \
    env PATH="$temp_dir/bin:$PATH" HOME="$temp_dir/home" \
    "$SKILL_DIR/scripts/preflight_check.sh" \
    --runtime python \
    --profile explicit-profile \
    --machine-readable

  if [[ "$status" -ne 0 ]]; then
    fail_test "$name" "preflight exited with $status"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_kv_only "$stdout"; then
    fail_test "$name" "stdout included non key=value content"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "oci_profile=explicit-profile"; then
    fail_test "$name" "missing explicit oci_profile"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "oci_profile_source=explicit_flag"; then
    fail_test "$name" "expected explicit flag to win over Fn context"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_discover_state_precedence_and_contract() {
  local name="discover_state explicit precedence + machine-readable stdout"
  local temp_dir
  local stdout=""
  local stderr=""
  local status=""

  temp_dir="$(mktemp -d)"
  make_stub_env "$temp_dir"

  run_capture stdout stderr status \
    env PATH="$temp_dir/bin:$PATH" HOME="$temp_dir/home" \
    "$SKILL_DIR/scripts/discover_state.sh" \
    --region us-ashburn-1 \
    --compartment-id ocid1.compartment.oc1..explicit \
    --profile explicit-profile \
    --app-name existing-app \
    --machine-readable

  if [[ "$status" -ne 0 ]]; then
    fail_test "$name" "discover_state exited with $status"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_kv_only "$stdout"; then
    fail_test "$name" "stdout included non key=value content"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "region=us-ashburn-1"; then
    fail_test "$name" "missing explicit region"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "compartment_id=ocid1.compartment.oc1..explicit"; then
    fail_test "$name" "missing explicit compartment id"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "profile=explicit-profile"; then
    fail_test "$name" "missing explicit profile"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "oci_cli_state=found"; then
    fail_test "$name" "missing explicit oci_cli_state"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "compartment_state=found"; then
    fail_test "$name" "missing explicit compartment_state"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_discover_state_rejects_name_injection() {
  local name="discover_state uses JSON matching and rejects injected output"
  local temp_dir
  local stdout=""
  local stderr=""
  local status=""
  local malicious_name="x'] | [0]"

  temp_dir="$(mktemp -d)"
  make_stub_env "$temp_dir"
  cat >"$temp_dir/bin/oci" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$@" >>"${OCI_TEST_ARG_LOG:?}"
if [[ "${1:-}" == "fn" && "${2:-}" == "application" && "${3:-}" == "list" ]]; then
  printf '%s\n' "${OCI_TEST_JSON:?}"
  exit 0
fi
exit 1
EOF
  chmod +x "$temp_dir/bin/oci"

  safe_json='{"data":[{"display-name":"x'"'"'] | [0]","id":"ocid1.fnapp.oc1..exact"}]}'
  run_capture stdout stderr status env \
    PATH="$temp_dir/bin:$PATH" \
    HOME="$temp_dir/home" \
    OCI_TEST_ARG_LOG="$temp_dir/oci.args" \
    OCI_TEST_JSON="$safe_json" \
    "$SKILL_DIR/scripts/discover_state.sh" \
    --region us-ashburn-1 \
    --compartment-id ocid1.compartment.oc1..explicit \
    --profile explicit-profile \
    --app-name "$malicious_name" \
    --machine-readable

  if [[ "$status" -ne 0 ]] || ! assert_contains "$stdout" "app_id=ocid1.fnapp.oc1..exact" || grep -Fq 'data[?' "$temp_dir/oci.args"; then
    fail_test "$name" "malicious display name altered the OCI request: $stderr"
    rm -rf "$temp_dir"
    return
  fi

  : >"$temp_dir/oci.args"
  newline_json='{"data":[{"display-name":"safe\nforged_key=value","id":"ocid1.fnapp.oc1..unsafe"}]}'
  run_capture stdout stderr status env \
    PATH="$temp_dir/bin:$PATH" \
    HOME="$temp_dir/home" \
    OCI_TEST_ARG_LOG="$temp_dir/oci.args" \
    OCI_TEST_JSON="$newline_json" \
    "$SKILL_DIR/scripts/discover_state.sh" \
    --region us-ashburn-1 \
    --compartment-id ocid1.compartment.oc1..explicit \
    --profile explicit-profile \
    --machine-readable

  if [[ "$status" -eq 0 ]] || assert_contains "$stdout" "forged_key=value"; then
    fail_test "$name" "control-character display name entered machine-readable output"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_ensure_app_reuse_rejects_create_only_flags() {
  local name="ensure_app rejects create-only flags on reuse"
  local temp_dir
  local stdout=""
  local stderr=""
  local status=""

  temp_dir="$(mktemp -d)"
  make_stub_env "$temp_dir"

  run_capture stdout stderr status \
    env PATH="$temp_dir/bin:$PATH" HOME="$temp_dir/home" \
    "$SKILL_DIR/scripts/ensure_app.sh" \
    --region us-phoenix-1 \
    --compartment-id ocid1.compartment.oc1..explicit \
    --profile explicit-profile \
    --app-name existing-app \
    --app-choice reuse \
    --shape GENERIC_ARM \
    --machine-readable

  if [[ "$status" -ne 2 ]]; then
    fail_test "$name" "expected exit 2, got $status"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_kv_only "$stdout"; then
    fail_test "$name" "stdout included non key=value content"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "app_state=error"; then
    fail_test "$name" "expected app_state=error"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_build_and_deploy_directory_guard() {
  local name="build_and_deploy stops on non-empty non-function directory"
  local temp_dir
  local stdout=""
  local stderr=""
  local status=""

  temp_dir="$(mktemp -d)"
  mkdir -p "$temp_dir/existing-dir"
  printf 'hello\n' >"$temp_dir/existing-dir/README.txt"

  run_capture stdout stderr status \
    env PATH="$PATH" HOME="$temp_dir/home" \
    "$SKILL_DIR/scripts/build_and_deploy.sh" \
    --runtime python \
    --app demo-app \
    --function-dir "$temp_dir/existing-dir" \
    --function-name demo-fn \
    --function-name-source explicit \
    --machine-readable

  if [[ "$status" -ne 2 ]]; then
    fail_test "$name" "expected exit 2, got $status"
    rm -rf "$temp_dir"
    return
  fi
  if ! assert_contains "$stdout" "function_name_state=explicit"; then
    fail_test "$name" "expected function_name_state=explicit before guard failure"
    rm -rf "$temp_dir"
    return
  fi

  pass_test "$name"
  rm -rf "$temp_dir"
}

main() {
  test_confirm_gate_contract
  test_confirm_gate_interactive_fresh_nonce
  test_common_security_contracts
  test_json_display_name_lookup_contract
  test_confirm_gate_escapes_display_controls
  test_latest_fn_release_metadata_contract
  test_fn_installer_verification_contract
  test_fn_install_confirmation_binds_release
  test_preflight_precedence_and_machine_readable
  test_discover_state_precedence_and_contract
  test_discover_state_rejects_name_injection
  test_ensure_app_reuse_rejects_create_only_flags
  test_build_and_deploy_directory_guard

  printf '\nPassed: %s\nFailed: %s\n' "$PASS_COUNT" "$FAIL_COUNT"
  [[ "$FAIL_COUNT" -eq 0 ]]
}

main "$@"
