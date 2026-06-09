#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIRM="$SCRIPT_DIR/confirm_gate.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

TOOL=""
OS_NAME=""
PKG_MGR=""
MACHINE_READABLE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      TOOL="${2:-}"
      shift 2
      ;;
    --os)
      OS_NAME="${2:-}"
      shift 2
      ;;
    --machine-readable)
      # Used by common.sh:is_machine_readable after argument parsing.
      # shellcheck disable=SC2034
      MACHINE_READABLE="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$TOOL" ]]; then
  echo "Usage: $0 --tool <fn|oci|docker|java|mvn|python3|node|npm|docker-daemon> [--os <darwin|linux>]" >&2
  exit 1
fi

if [[ -z "$OS_NAME" ]]; then
  case "$(uname -s)" in
    Darwin) OS_NAME="darwin" ;;
    Linux) OS_NAME="linux" ;;
    CYGWIN*|MINGW*|MSYS*) OS_NAME="windows" ;;
    *)
      echo "install_state=error"
      echo "install_error_reason=unsupported_os"
      echo "Unsupported OS. Provide --os explicitly (darwin|linux)." >&2
      exit 1
      ;;
  esac
fi

if [[ "$OS_NAME" == "windows" ]]; then
  echo "install_state=error"
  echo "install_error_reason=unsupported_os"
  echo "[ERROR] Windows installation automation is not supported by this skill." >&2
  echo "[HINT] Install fn, oci-cli, docker, and runtime tools manually before continuing." >&2
  exit 1
fi

detect_linux_pkg_mgr() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "apt"
    return
  fi
  if command -v dnf >/dev/null 2>&1; then
    echo "dnf"
    return
  fi
  if command -v yum >/dev/null 2>&1; then
    echo "yum"
    return
  fi
  if command -v zypper >/dev/null 2>&1; then
    echo "zypper"
    return
  fi
  echo ""
}

linux_pkg_install_cmd() {
  local packages="$1"
  case "$PKG_MGR" in
    apt) echo "sudo apt-get update && sudo apt-get install -y $packages" ;;
    dnf) echo "sudo dnf install -y $packages" ;;
    yum) echo "sudo yum install -y $packages" ;;
    zypper) echo "sudo zypper --non-interactive install $packages" ;;
    *)
      echo ""
      ;;
  esac
}

run_confirmed() {
  local description="$1"
  local display="$2"
  shift 2

  local nonce
  local confirm_args=()
  nonce="$(next_confirm_nonce)"
  if is_machine_readable; then
    confirm_args+=(--machine-readable)
  fi
  "$CONFIRM" --description "$description" --display "$display" "${confirm_args[@]}" --nonce "$nonce" -- "$@"
}

if [[ "$OS_NAME" == "linux" ]]; then
  PKG_MGR="$(detect_linux_pkg_mgr)"
fi

has_brew="no"
if [[ "$OS_NAME" == "darwin" ]] && command -v brew >/dev/null 2>&1; then
  has_brew="yes"
fi

install_method=""
display_command=""
case "$OS_NAME:$TOOL" in
  darwin:fn) install_method="brew" ;;
  darwin:oci) install_method="brew" ;;
  darwin:docker) install_method="brew_cask" ;;
  darwin:java) install_method="brew" ;;
  darwin:mvn) install_method="brew" ;;
  darwin:python3) install_method="brew" ;;
  darwin:node) install_method="brew" ;;
  darwin:npm) install_method="brew" ;;
  darwin:docker-daemon) install_method="app_start" ;;

  linux:fn) install_method="remote_script" ;;
  linux:oci)
    if [[ -n "$PKG_MGR" ]]; then
      install_method="pkg_plus_pip"
    else
      install_method="pip"
    fi
    ;;
  linux:docker)
    case "$PKG_MGR" in
      apt|dnf|yum|zypper) install_method="pkg" ;;
      *) install_method="" ;;
    esac
    ;;
  linux:java)
    case "$PKG_MGR" in
      apt|dnf|yum|zypper) install_method="pkg" ;;
      *) install_method="" ;;
    esac
    ;;
  linux:mvn) install_method="pkg" ;;
  linux:python3) install_method="pkg" ;;
  linux:node) install_method="pkg" ;;
  linux:npm) install_method="pkg" ;;
  linux:docker-daemon) install_method="service_start" ;;

  *)
    echo "install_state=error"
    echo "install_error_reason=unsupported_os"
    echo "No installer mapping for $OS_NAME:$TOOL" >&2
    exit 1
    ;;
esac

if [[ "$OS_NAME" == "darwin" && "$install_method" != "app_start" && "$has_brew" != "yes" ]]; then
  echo "install_state=error"
  echo "install_error_reason=missing_package_manager"
  echo "[ERROR] Homebrew is required for automated installation on macOS, but it was not found." >&2
  echo "[HINT] Install Homebrew or install '$TOOL' manually, then rerun preflight checks." >&2
  exit 1
fi

if [[ -z "$install_method" ]]; then
  echo "install_state=error"
  echo "install_error_reason=unsupported_package_manager"
  echo "[ERROR] No installer command for $OS_NAME:$TOOL with package manager '${PKG_MGR:-none}'." >&2
  echo "[HINT] Install '$TOOL' manually, then rerun preflight checks." >&2
  exit 1
fi

case "$OS_NAME:$TOOL:$install_method" in
  darwin:fn:brew)
    display_command="brew install fn"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" brew install fn
    ;;
  darwin:oci:brew)
    display_command="brew install oci-cli"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" brew install oci-cli
    ;;
  darwin:docker:brew_cask)
    display_command="brew install --cask docker"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" brew install --cask docker
    ;;
  darwin:java:brew)
    display_command="brew install openjdk@17"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" brew install openjdk@17
    ;;
  darwin:mvn:brew)
    display_command="brew install maven"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" brew install maven
    ;;
  darwin:python3:brew)
    display_command="brew install python"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" brew install python
    ;;
  darwin:node:brew|darwin:npm:brew)
    display_command="brew install node"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" brew install node
    ;;
  darwin:docker-daemon:app_start)
    display_command="open -a Docker"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" open -a Docker
    ;;
  linux:fn:remote_script)
    display_command="scripts/install_fn_linux.sh"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME' using the upstream remote installer script (high-risk remote code path)" "$display_command" "$SCRIPT_DIR/install_fn_linux.sh"
    ;;
  linux:oci:pkg_plus_pip)
    display_command="$(linux_pkg_install_cmd "python3 python3-pip")"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" "$SCRIPT_DIR/run_linux_pkg_install.sh" --pkg-manager "$PKG_MGR" --packages "python3 python3-pip"
    display_command="python3 -m pip install --upgrade oci-cli"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" python3 -m pip install --upgrade oci-cli
    ;;
  linux:oci:pip)
    display_command="python3 -m pip install --upgrade oci-cli"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" python3 -m pip install --upgrade oci-cli
    ;;
  linux:docker:pkg)
    case "$PKG_MGR" in
      apt) display_command="$(linux_pkg_install_cmd "docker.io")" ;;
      dnf|yum|zypper) display_command="$(linux_pkg_install_cmd "docker")" ;;
    esac
    case "$PKG_MGR" in
      apt) run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" "$SCRIPT_DIR/run_linux_pkg_install.sh" --pkg-manager "$PKG_MGR" --packages "docker.io" ;;
      dnf|yum|zypper) run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" "$SCRIPT_DIR/run_linux_pkg_install.sh" --pkg-manager "$PKG_MGR" --packages "docker" ;;
    esac
    ;;
  linux:java:pkg)
    case "$PKG_MGR" in
      apt) display_command="$(linux_pkg_install_cmd "openjdk-17-jdk")" ;;
      dnf|yum|zypper) display_command="$(linux_pkg_install_cmd "java-17-openjdk-devel")" ;;
    esac
    case "$PKG_MGR" in
      apt) run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" "$SCRIPT_DIR/run_linux_pkg_install.sh" --pkg-manager "$PKG_MGR" --packages "openjdk-17-jdk" ;;
      dnf|yum|zypper) run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" "$SCRIPT_DIR/run_linux_pkg_install.sh" --pkg-manager "$PKG_MGR" --packages "java-17-openjdk-devel" ;;
    esac
    ;;
  linux:mvn:pkg)
    display_command="$(linux_pkg_install_cmd "maven")"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" "$SCRIPT_DIR/run_linux_pkg_install.sh" --pkg-manager "$PKG_MGR" --packages "maven"
    ;;
  linux:python3:pkg)
    display_command="$(linux_pkg_install_cmd "python3 python3-pip")"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" "$SCRIPT_DIR/run_linux_pkg_install.sh" --pkg-manager "$PKG_MGR" --packages "python3 python3-pip"
    ;;
  linux:node:pkg|linux:npm:pkg)
    display_command="$(linux_pkg_install_cmd "nodejs npm")"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" "$SCRIPT_DIR/run_linux_pkg_install.sh" --pkg-manager "$PKG_MGR" --packages "nodejs npm"
    ;;
  linux:docker-daemon:service_start)
    display_command="sudo systemctl start docker"
    run_confirmed "Install/fix '$TOOL' on '$OS_NAME'" "$display_command" sudo systemctl start docker
    ;;
  *)
    echo "install_state=error"
    echo "install_error_reason=unsupported_install_method"
    echo "[ERROR] No executable install path for $OS_NAME:$TOOL." >&2
    exit 1
    ;;
esac

if [[ "$TOOL" == "docker-daemon" ]]; then
  if docker info >/dev/null 2>&1; then
    log_ok "Docker daemon is running"
    echo "install_state=success"
    echo "install_method=$install_method"
  else
    echo "install_state=error"
    echo "install_error_reason=verification_failed"
    echo "[ERROR] Docker daemon still not running" >&2
    exit 2
  fi
  exit 0
fi

verify_tool="$TOOL"
if [[ "$TOOL" == "java" ]]; then
  verify_tool="java"
fi
if [[ "$TOOL" == "python3" ]]; then
  verify_tool="python3"
fi
if [[ "$TOOL" == "npm" ]]; then
  verify_tool="npm"
fi

if command -v "$verify_tool" >/dev/null 2>&1; then
  log_ok "Verified '$verify_tool' is installed"
  echo "install_state=success"
  echo "install_method=$install_method"
else
  echo "install_state=error"
  echo "install_error_reason=verification_failed"
  echo "[ERROR] '$verify_tool' is still missing after install" >&2
  exit 2
fi
