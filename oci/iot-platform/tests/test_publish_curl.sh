#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/oci-iot-publish-curl.XXXXXX")"
trap 'rm -rf "$TEST_DIR"' EXIT

mkdir -p "$TEST_DIR/bin"
cat >"$TEST_DIR/bin/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >"$CURL_MOCK_ARGS"
cat >"$CURL_MOCK_STDIN"
printf '%s\n' '{"accepted":true}'
exit "${CURL_MOCK_EXIT:-0}"
MOCK
chmod +x "$TEST_DIR/bin/curl"

export CURL_MOCK_ARGS="$TEST_DIR/curl.args"
export CURL_MOCK_STDIN="$TEST_DIR/curl.stdin"
DEVICE_USER="device-user"
DEVICE_SECRET="device-secret-value"
ENCODED_CREDENTIAL="$(printf '%s:%s' "$DEVICE_USER" "$DEVICE_SECRET" | base64 | tr -d '\r\n')"

run_publish() {
  PATH="$TEST_DIR/bin:$PATH" \
    DEVICE_USER="$DEVICE_USER" \
    DEVICE_SECRET="$DEVICE_SECRET" \
    DOMAIN_SHORT_ID="domain123" \
    OCI_REGION="us-phoenix-1" \
    REFERENCE_ENDPOINT="${1:-/sampletopic}" \
    CURL_MOCK_EXIT="${2:-0}" \
    bash "$ROOT_DIR/templates/publish-curl.template.sh"
}

run_publish sampletopic >/dev/null

rg -n -F -- '--fail-with-body' "$CURL_MOCK_ARGS" >/dev/null
rg -n -F -- '--header @-' "$CURL_MOCK_ARGS" >/dev/null
rg -n -F -- 'https://domain123.device.iot.us-phoenix-1.oci.oraclecloud.com/sampletopic' "$CURL_MOCK_ARGS" >/dev/null
if rg -n -F -- "$DEVICE_SECRET" "$CURL_MOCK_ARGS" >/dev/null; then
  echo "Plain device secret was exposed in curl arguments." >&2
  exit 1
fi
if rg -n -F -- "$ENCODED_CREDENTIAL" "$CURL_MOCK_ARGS" >/dev/null; then
  echo "Encoded device credentials were exposed in curl arguments." >&2
  exit 1
fi
rg -n -F -- "Authorization: Basic $ENCODED_CREDENTIAL" "$CURL_MOCK_STDIN" >/dev/null

set +e
run_publish /custom-endpoint 22 >/dev/null
STATUS=$?
set -e
[[ "$STATUS" == "22" ]]
rg -n -F -- 'https://domain123.device.iot.us-phoenix-1.oci.oraclecloud.com/custom-endpoint' "$CURL_MOCK_ARGS" >/dev/null

echo "publish curl behavior passed"
