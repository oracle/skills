#!/usr/bin/env bash
# Validate an APEX application directory using SQLcl without a database connection.

# Stop on command failures, undefined variables, and failed pipeline commands.
set -euo pipefail

# Accept exactly one argument so the validation target is unambiguous.
if [[ $# -ne 1 ]]; then
  echo "Usage: $(basename "$0") <app-directory>" >&2
  exit 2
fi

# Require the caller to explicitly choose the SQLcl binary to run.
if [[ -z "${SQLCL_BIN:-}" ]]; then
  echo "SQLCL_BIN must be set to the absolute path of the SQLcl executable." >&2
  exit 2
fi

# Fail early with a clear error when the configured binary cannot be executed.
if [[ ! -x "$SQLCL_BIN" ]]; then
  echo "SQLCL_BIN is not an executable file: $SQLCL_BIN" >&2
  exit 2
fi

# Preserve the caller's target and ensure it refers to an existing directory.
app_directory=$1
if [[ ! -d "$app_directory" ]]; then
  echo "Application directory does not exist: $app_directory" >&2
  exit 2
fi

# Resolve the target to a physical absolute path before passing it to SQLcl.
app_directory=$(cd "$app_directory" && pwd -P)

# SQLcl receives this value as command text through stdin rather than as an
# operating-system argument. Reject characters that could terminate the quoted
# value or create another SQLcl command.
if [[ "$app_directory" == *'"'* ||
      "$app_directory" == *'\'* ||
      "$app_directory" == *$'\n'* ||
      "$app_directory" == *$'\r'* ]]; then
  echo "Application directory contains unsupported SQLcl command characters." >&2
  exit 2
fi

# Start SQLcl with /nolog, validate the application tree, then exit. SQLcl can
# report APEXLang validation errors while still returning status 0, so capture
# its output and require the explicit success marker as well.
if validation_output=$("$SQLCL_BIN" /nolog 2>&1 <<SQLCL_COMMANDS
apex validate -input "$app_directory"
exit
SQLCL_COMMANDS
); then
  validation_status=0
else
  validation_status=$?
fi

printf '%s\n' "$validation_output"

if [[ $validation_status -ne 0 ]] ||
   ! grep -Fq "Validation successful" <<<"$validation_output"; then
  echo "APEXLang validation failed." >&2
  exit 1
fi
