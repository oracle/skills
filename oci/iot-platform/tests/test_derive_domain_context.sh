#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/oci-iot-domain-context.XXXXXX")"
trap 'rm -rf "$TEST_DIR"' EXIT

mkdir -p "$TEST_DIR/bin"
cat >"$TEST_DIR/bin/oci" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >>"$OCI_MOCK_LOG"
case " $* " in
  *" domain get "*)
    printf '%s\n' '{"data":{"device-host":"domain123.device.iot.us-phoenix-1.oci.oraclecloud.com","iot-domain-group-id":"ocid1.iotdomaingroup.oc1..example"}}'
    ;;
  *" domain-group get "*)
    printf '%s\n' '{"data":{"data-host":"group123.data.iot.us-phoenix-1.oci.oraclecloud.com"}}'
    ;;
  *)
    printf 'Unexpected mock OCI arguments: %s\n' "$*" >&2
    exit 2
    ;;
esac
MOCK
chmod +x "$TEST_DIR/bin/oci"

export OCI_MOCK_LOG="$TEST_DIR/oci.log"
OUTPUT="$(PATH="$TEST_DIR/bin:$PATH" bash "$ROOT_DIR/scripts/derive_domain_context.sh" \
  --profile test-profile \
  --auth api_key \
  --region us-phoenix-1 \
  --iot-domain-id ocid1.iotdomain.oc1..example)"

[[ "$(rg -c -- '--region us-phoenix-1' "$OCI_MOCK_LOG")" == "2" ]]
rg -n '^REGION=us-phoenix-1$' <<<"$OUTPUT" >/dev/null
rg -n '^DEVICE_HOST=domain123\.device\.iot\.us-phoenix-1\.oci\.oraclecloud\.com$' <<<"$OUTPUT" >/dev/null
rg -n '^DATA_HOST=group123\.data\.iot\.us-phoenix-1\.oci\.oraclecloud\.com$' <<<"$OUTPUT" >/dev/null
rg -n '^DOMAIN_SHORT_ID=domain123$' <<<"$OUTPUT" >/dev/null
rg -n '^DOMAIN_GROUP_SHORT_ID=group123$' <<<"$OUTPUT" >/dev/null

echo "derive domain context behavior passed"
