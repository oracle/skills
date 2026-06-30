#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
failures=0

require_text() {
  local path="$1"
  local needle="$2"
  local description="$3"

  if ! rg -Fqi -- "$needle" "$path"; then
    printf 'Missing %s in %s (expected fixed text: %s)\n' \
      "$description" "${path#"$ROOT_DIR"/}" "$needle" >&2
    failures=1
  fi
}

require_ordered_text() {
  local path="$1"
  local description="$2"
  shift 2

  local needle
  local match
  local line
  local previous_line=0
  for needle in "$@"; do
    match="$(rg -Fni -m 1 -- "$needle" "$path" || true)"
    if [[ -z "$match" ]]; then
      printf 'Cannot verify %s in %s; missing fixed text: %s\n' \
        "$description" "${path#"$ROOT_DIR"/}" "$needle" >&2
      failures=1
      continue
    fi

    line="${match%%:*}"
    if (( line <= previous_line )); then
      printf 'Incorrect %s in %s near fixed text: %s\n' \
        "$description" "${path#"$ROOT_DIR"/}" "$needle" >&2
      failures=1
    fi
    previous_line="$line"
  done
}

skill="$ROOT_DIR/SKILL.md"
cli="$ROOT_DIR/references/cli-workflows.md"
modeling="$ROOT_DIR/references/modeling-guidance.md"
resilience="$ROOT_DIR/references/resilience-guidance.md"
data_access="$ROOT_DIR/references/data-access.md"
platform="$ROOT_DIR/references/platform-surface.md"
mcp="$ROOT_DIR/references/mcp-optional-use.md"
release="$ROOT_DIR/references/release-validation.md"

require_text "$skill" '## Prerequisites' 'prerequisite section'
require_text "$skill" 'OCI CLI' 'OCI CLI operator prerequisite'
require_text "$skill" 'Bash' 'Bash operator prerequisite'
require_text "$skill" 'curl' 'curl operator prerequisite'
require_text "$skill" 'jq' 'jq operator prerequisite'
require_text "$skill" 'Python 3' 'Python 3 operator prerequisite'
require_text "$skill" 'Contributors running repository validation' 'contributor-only validation prerequisite scope'
require_text "$skill" 'contributor-only' 'contributor-only ripgrep scope'
require_text "$skill" 'ripgrep' 'ripgrep contributor prerequisite'
require_text "$skill" 'https://github.com/oracle/mcp/tree/main/src/oci-iot-mcp-server' 'official OCI IoT MCP source'

require_text "$cli" 'DEVELOPMENT' 'development domain-group type'
require_text "$cli" 'PRODUCTION' 'production domain-group type'
require_text "$cli" 'LIGHTWEIGHT' 'deprecated lightweight domain-group alias'
require_text "$cli" 'STANDARD' 'deprecated standard domain-group alias'
require_text "$cli" '2027-04-14' 'domain-group alias removal date'
require_text "$cli" 'creation-time topology decision' 'domain-group type immutability'
require_text "$cli" 'rejects domain deletion while active digital twin resources remain' 'active-resource domain deletion rule'
require_ordered_text "$cli" 'cleanup ordering' \
  'Delete relationships' \
  'Delete instances' \
  'Delete adapters' \
  'Delete models' \
  'fresh active-resource inventory' \
  'delete the IoT domain' \
  'delete the empty domain group'

require_text "$modeling" 'strictly additive next minor' 'compatible model-version rule'
require_text "$modeling" 'major-version changes' 'incompatible major-version rule'
require_text "$modeling" 'require a new twin instance' 'incompatible-version instance behavior'
require_text "$modeling" 'Create a new adapter' 'upgraded adapter step'
require_text "$modeling" 'Retain the old adapter for rollback' 'old-adapter rollback posture'
require_text "$modeling" 'get-content --should-include-metadata true' 'post-update content verification'
require_text "$modeling" 'altitude' 'altitude point schema awareness'
require_text "$modeling" '`has`' 'JQ has capability awareness'

require_text "$resilience" 'oci_iot' 'OCI Monitoring namespace'
require_text "$resilience" 'connection signals' 'connection signal routing'
require_text "$resilience" 'authentication signals' 'authentication signal routing'
require_text "$resilience" 'normalization signals' 'normalization signal routing'
require_text "$resilience" 'Monitoring read IAM' 'Monitoring IAM prerequisite'

require_text "$data_access" 'Oracle Database Tools' 'Database Tools access path'
require_text "$data_access" 'Select AI' 'Select AI access path'
require_text "$data_access" 'Data Pump import/export' 'Data Pump migration path'
require_text "$data_access" 'archive-domain' 'archive-domain workflow'
require_text "$data_access" 'Object Storage' 'archive destination'
require_text "$data_access" 'raw database queue' 'raw database queue streaming'
require_text "$data_access" 'normalized database queue' 'normalized database queue streaming'
require_text "$data_access" 'advanced and optional' 'advanced-data warning'
require_text "$data_access" 'explicit opt-in' 'explicit advanced-data opt-in warning'
require_text "$data_access" 'auth, network, IAM, database, retention, and data-handling review' 'advanced-data prerequisite review'

require_text "$platform" 'secure MQTT-over-WebSocket' 'secure MQTT-over-WebSocket awareness'
require_text "$platform" 'WSS' 'WSS awareness'
require_text "$platform" 'general-purpose MQTT broker' 'broker-scope warning'

require_text "$mcp" 'https://github.com/oracle/mcp/tree/main/src/oci-iot-mcp-server' 'official OCI IoT MCP implementation'

require_text "$release" 'oci --version' 'OCI CLI version capture'
require_text "$release" 'oci iot --help >/dev/null' 'OCI IoT CLI capability capture'
require_text "$release" 'bash tests/platform_currentness.sh' 'focused currentness test command'
require_text "$release" 'documented-command drift' 'documented command drift reporting'

if (( failures != 0 )); then
  exit 1
fi

echo 'platform currentness checks passed'
