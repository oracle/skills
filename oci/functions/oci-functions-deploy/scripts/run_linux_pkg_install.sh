#!/usr/bin/env bash
set -euo pipefail

PKG_MGR=""
PACKAGES=""
RUN_UPDATE="auto"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pkg-manager)
      PKG_MGR="${2:-}"
      shift 2
      ;;
    --packages)
      PACKAGES="${2:-}"
      shift 2
      ;;
    --run-update)
      RUN_UPDATE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$PKG_MGR" || -z "$PACKAGES" ]]; then
  echo "Usage: $0 --pkg-manager <apt|dnf|yum|zypper> --packages \"pkg1 pkg2\" [--run-update <auto|yes|no>]" >&2
  exit 1
fi

read -r -a package_argv <<<"$PACKAGES"

case "$PKG_MGR" in
  apt)
    if [[ "$RUN_UPDATE" != "no" ]]; then
      sudo apt-get update
    fi
    sudo apt-get install -y "${package_argv[@]}"
    ;;
  dnf)
    sudo dnf install -y "${package_argv[@]}"
    ;;
  yum)
    sudo yum install -y "${package_argv[@]}"
    ;;
  zypper)
    sudo zypper --non-interactive install "${package_argv[@]}"
    ;;
  *)
    echo "Unsupported package manager: $PKG_MGR" >&2
    exit 1
    ;;
esac
