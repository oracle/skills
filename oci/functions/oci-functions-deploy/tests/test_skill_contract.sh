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
  joined="$*"
  if [[ "$joined" == *'data[]."display-name"'* ]]; then
    printf 'existing-app\n'
    exit 0
  fi
  if [[ "$joined" == *"display-name\"=='existing-app'"* ]]; then
    printf 'ocid1.fnapp.oc1..existing\n'
    exit 0
  fi
  printf '\n'
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

  pass_test "$name"
  rm -rf "$temp_dir"
}

test_confirm_gate_interactive_fresh_nonce() {
  local name="confirm gate interactive fresh nonce"

  if python3 - <<'PY' "$SKILL_DIR/scripts/confirm_gate.sh"; then
import os
import pty
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
        text=True,
        close_fds=True,
    )
    os.close(slave)
    time.sleep(0.1)
    os.write(master, b"y\n")
    os.close(master)
    out, err = proc.communicate(timeout=5)
    return proc.returncode, out, err

first = run_once()
second = run_once()

if first[0] != 0 or "confirm_state=approved" not in first[1]:
    raise SystemExit(1)
if second[0] != 0 or "confirm_state=approved" not in second[1]:
    raise SystemExit(2)
PY
    pass_test "$name"
  else
    fail_test "$name" "interactive re-approval should succeed on a second identical command"
  fi
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
  test_preflight_precedence_and_machine_readable
  test_discover_state_precedence_and_contract
  test_ensure_app_reuse_rejects_create_only_flags
  test_build_and_deploy_directory_guard

  printf '\nPassed: %s\nFailed: %s\n' "$PASS_COUNT" "$FAIL_COUNT"
  [[ "$FAIL_COUNT" -eq 0 ]]
}

main "$@"
