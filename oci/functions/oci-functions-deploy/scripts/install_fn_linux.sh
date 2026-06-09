#!/usr/bin/env bash
set -euo pipefail

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

curl -LSs "https://raw.githubusercontent.com/fnproject/cli/master/install" -o "$tmp_file"
sh "$tmp_file"
