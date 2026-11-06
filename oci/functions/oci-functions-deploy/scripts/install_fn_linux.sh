#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

VERSION=""
ASSET_URL=""
EXPECTED_DIGEST=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION="${2:-}"
      shift 2
      ;;
    --asset-url)
      ASSET_URL="${2:-}"
      shift 2
      ;;
    --sha256)
      EXPECTED_DIGEST="${2:-}"
      shift 2
      ;;
    *)
      printf 'Unknown argument: %s\n' "$1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$VERSION" && -z "$ASSET_URL" && -z "$EXPECTED_DIGEST" ]]; then
  resolve_latest_fn_linux_release VERSION ASSET_URL EXPECTED_DIGEST
elif [[ -z "$VERSION" || -z "$ASSET_URL" || -z "$EXPECTED_DIGEST" ]]; then
  printf '[ERROR] --version, --asset-url, and --sha256 must be supplied together.\n' >&2
  exit 1
fi

if [[ ! "$VERSION" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  printf '[ERROR] Invalid Fn CLI release version.\n' >&2
  exit 1
fi
if [[ "$ASSET_URL" != "https://github.com/fnproject/cli/releases/download/$VERSION/fn_linux" ]]; then
  printf '[ERROR] Refusing a non-canonical Fn CLI asset URL.\n' >&2
  exit 1
fi
if [[ ! "$EXPECTED_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  printf '[ERROR] Invalid Fn CLI SHA-256 digest.\n' >&2
  exit 1
fi

if [[ "$(uname -s)" != "Linux" ]]; then
  printf '[ERROR] install_fn_linux.sh only supports Linux.\n' >&2
  exit 1
fi
case "$(uname -m)" in
  x86_64|amd64) ;;
  *)
    printf '[ERROR] The verified fn_linux release asset only supports Linux x86-64.\n' >&2
    exit 1
    ;;
esac

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

curl \
  --proto '=https' \
  --proto-redir '=https' \
  --tlsv1.2 \
  --fail \
  --silent \
  --show-error \
  --location \
  --connect-timeout 10 \
  --max-time 120 \
  --retry 2 \
  --output "$tmp_file" \
  "$ASSET_URL"

actual_hash=""
if command -v sha256sum >/dev/null 2>&1; then
  actual_hash="$(sha256sum "$tmp_file" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  actual_hash="$(shasum -a 256 "$tmp_file" | awk '{print $1}')"
else
  printf '[ERROR] A SHA-256 verification tool (sha256sum or shasum) is required.\n' >&2
  exit 1
fi

if [[ "sha256:$actual_hash" != "$EXPECTED_DIGEST" ]]; then
  printf '[ERROR] Fn CLI asset SHA-256 verification failed.\n' >&2
  exit 1
fi

chmod 0755 "$tmp_file"
version_output="$("$tmp_file" --version 2>&1)" || {
  printf '[ERROR] Downloaded Fn CLI asset failed its version check.\n' >&2
  exit 1
}
expected_version="${VERSION#v}"
escaped_version="${expected_version//./\\.}"
if ! grep -Eq "(^|[^0-9])${escaped_version}([^0-9]|$)" <<<"$version_output"; then
  printf '[ERROR] Downloaded Fn CLI version does not match the approved release.\n' >&2
  exit 1
fi

install_args=(install -m 0755 "$tmp_file" /usr/local/bin/fn)
if [[ "$(id -u)" -eq 0 ]]; then
  "${install_args[@]}"
elif command -v sudo >/dev/null 2>&1; then
  sudo "${install_args[@]}"
else
  printf '[ERROR] Root privileges or sudo are required to install Fn CLI.\n' >&2
  exit 1
fi

printf '[OK] Installed Fn CLI release %s after SHA-256 and version verification.\n' "$VERSION"
