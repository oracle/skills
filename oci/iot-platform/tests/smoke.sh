#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPYCACHEPREFIX="${PYTHONPYCACHEPREFIX:-${TMPDIR:-/tmp}/oci-iot-platform-pycache}"

required_files=(
  "$ROOT_DIR/SKILL.md"
  "$ROOT_DIR/agents/openai.yaml"
  "$ROOT_DIR/scripts/derive_domain_context.sh"
  "$ROOT_DIR/scripts/twin_tools.py"
  "$ROOT_DIR/templates/adapter.default.template.json"
  "$ROOT_DIR/templates/instance.template.json"
  "$ROOT_DIR/templates/model.temperature-sensor.template.json"
  "$ROOT_DIR/templates/publish-curl.template.sh"
  "$ROOT_DIR/tests/test_derive_domain_context.sh"
  "$ROOT_DIR/tests/test_publish_curl.sh"
  "$ROOT_DIR/tests/test_twin_tools.py"
  "$ROOT_DIR/references/cli-workflows.md"
  "$ROOT_DIR/references/data-access.md"
  "$ROOT_DIR/references/mcp-optional-use.md"
  "$ROOT_DIR/references/modeling-guidance.md"
  "$ROOT_DIR/references/platform-surface.md"
  "$ROOT_DIR/references/resilience-guidance.md"
  "$ROOT_DIR/references/release-validation.md"
)

echo "[1/7] required file check"
for path in "${required_files[@]}"; do
  if [[ ! -f "$path" ]]; then
    echo "Missing required file: $path" >&2
    exit 1
  fi
done

echo "[2/7] skill metadata check"
rg -n '^name: oci-iot-platform$' "$ROOT_DIR/SKILL.md" >/dev/null
rg -n '^description:' "$ROOT_DIR/SKILL.md" >/dev/null
[[ "$(rg '^## ' "$ROOT_DIR/SKILL.md" | tail -n 1)" == "## Sources" ]]

echo "[3/7] resilience guidance coverage check"
rg -n 'references/resilience-guidance\.md' "$ROOT_DIR/SKILL.md" >/dev/null
rg -n -i 'bounded|pagination|--limit' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n -i 'lifecycle' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n -i 'gateway' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n -i 'relationship' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n -i 'work.request|work-request' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n -i 'publish|rejected' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n 'inboundEnvelope\.referenceEndpoint' "$ROOT_DIR/references/cli-workflows.md" "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n '404 Not Found' "$ROOT_DIR/references/cli-workflows.md" "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n 'REFERENCE_ENDPOINT' "$ROOT_DIR/templates/publish-curl.template.sh" >/dev/null
if rg -n 'TOPIC' "$ROOT_DIR/templates/publish-curl.template.sh" >/dev/null; then
  echo "Publish template should use REFERENCE_ENDPOINT, not TOPIC." >&2
  exit 1
fi
rg -n -i 'raw.command|raw-command' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n -i 'sdk.*cli|cli.*sdk' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n -i 'mcp.*optional|optional.*mcp' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n 'references/mcp-optional-use\.md' "$ROOT_DIR/SKILL.md" >/dev/null
rg -n -i 'fallback|cli|sdk' "$ROOT_DIR/references/mcp-optional-use.md" >/dev/null
rg -n -i 'connectivity_type|gateways|INDIRECT|GATEWAY' "$ROOT_DIR/references/mcp-optional-use.md" >/dev/null
rg -n 'never use `INDIRECT` as a shortcut' "$ROOT_DIR/SKILL.md" >/dev/null
rg -n 'do not assume `INDIRECT` connectivity' "$ROOT_DIR/references/resilience-guidance.md" >/dev/null
rg -n 'Do not default to `INDIRECT` connectivity' "$ROOT_DIR/references/cli-workflows.md" >/dev/null
rg -n 'OCI_IOT_AUTH_TYPE=api_key' "$ROOT_DIR/references/mcp-optional-use.md" >/dev/null
rg -n -i 'snapshot|historized|raw-command|rejected' "$ROOT_DIR/references/mcp-optional-use.md" >/dev/null
rg -n 'references/platform-surface\.md' "$ROOT_DIR/SKILL.md" >/dev/null
rg -n -i 'domain group|digital twin model|digital twin adapter|digital twin instance|relationship|work request|raw commands|Data API' "$ROOT_DIR/references/platform-surface.md" >/dev/null
rg -n -i 'configure-apex-data-access|configure-direct-data-access|configure-ords-data-access|change-data-retention-period|MQTTs' "$ROOT_DIR/references/platform-surface.md" "$ROOT_DIR/references/cli-workflows.md" "$ROOT_DIR/references/data-access.md" >/dev/null
rg -n -i 'snapshotData|rawData|historizedData|rejectedData|rawCommandData' "$ROOT_DIR/references/data-access.md" >/dev/null
rg -n -F 'https://<domain_group_short_id>.data.iot.<region>.oci.oraclecloud.com/ords/<domain_short_id>/20250531' "$ROOT_DIR/references/data-access.md" >/dev/null
rg -n -- '--auth' "$ROOT_DIR/scripts/derive_domain_context.sh" >/dev/null
rg -n -- '--auth <oci_cli_auth>' "$ROOT_DIR/references/cli-workflows.md" >/dev/null
rg -n -- '--region' "$ROOT_DIR/scripts/derive_domain_context.sh" >/dev/null
rg -n -- '--region <oci_region>' "$ROOT_DIR/references/cli-workflows.md" >/dev/null
rg -n '^bash tests/smoke\.sh$' "$ROOT_DIR/references/release-validation.md" >/dev/null
rg -n '^bash tests/redaction_scan\.sh$' "$ROOT_DIR/references/release-validation.md" >/dev/null
if rg -n 'oci-iot-platform/tests/' "$ROOT_DIR/references/release-validation.md" >/dev/null; then
  echo "Stale standalone-repo validation path found." >&2
  exit 1
fi
if rg -n -- '--file ' "$ROOT_DIR/references/cli-workflows.md" >/dev/null; then
  echo "Unsupported OCI CLI --file option found in CLI workflows; use --from-json or parameter-specific file:// inputs." >&2
  exit 1
fi
if rg -n 'lastValue' "$ROOT_DIR/templates/adapter.default.template.json" "$ROOT_DIR/templates/publish-curl.template.sh" >/dev/null; then
  echo "Adapter and publish templates should use the same scalar temperature payload shape." >&2
  exit 1
fi

echo "[4/7] bootstrap helper syntax check"
bash -n "$ROOT_DIR/scripts/derive_domain_context.sh"

echo "[5/7] helper behavior checks"
PYTHONPYCACHEPREFIX="$PYTHONPYCACHEPREFIX" python3 "$ROOT_DIR/tests/test_twin_tools.py"
bash "$ROOT_DIR/tests/test_derive_domain_context.sh"
bash "$ROOT_DIR/tests/test_publish_curl.sh"

echo "[6/7] twin tool syntax and help checks"
python3 -m py_compile "$ROOT_DIR/scripts/twin_tools.py"
python3 "$ROOT_DIR/scripts/twin_tools.py" --help >/dev/null
python3 "$ROOT_DIR/scripts/twin_tools.py" telemetry-template \
  --device-id test-device \
  --twin-id test-twin \
  --metric temperature=21.5 >/dev/null

echo "[7/7] template sanity check"
python3 -m json.tool "$ROOT_DIR/templates/adapter.default.template.json" >/dev/null
python3 -m json.tool "$ROOT_DIR/templates/instance.template.json" >/dev/null
python3 -m json.tool "$ROOT_DIR/templates/model.temperature-sensor.template.json" >/dev/null
bash -n "$ROOT_DIR/templates/publish-curl.template.sh"

echo "smoke checks passed"
