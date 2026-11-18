#!/usr/bin/env bash
# Import an APEX application directory into a database using SQLcl.

# Stop on command failures, undefined variables, and failed pipeline commands.
set -euo pipefail

# Accept exactly one argument so the deployment target is unambiguous.
if [[ $# -ne 1 ]]; then
  echo "Usage: $(basename "$0") <app-directory>" >&2
  exit 2
fi

# Require the caller to explicitly choose the SQLcl binary to run.
if [[ -z "${SQLCL_BIN:-}" ]]; then
  echo "SQLCL_BIN must be set to the absolute path of the SQLcl executable." >&2
  exit 2
fi

# Require the connection string used to start SQLcl and establish the session.
if [[ -z "${SQLCL_CONNECTION_STRING:-}" ]]; then
  echo "SQLCL_CONNECTION_STRING must be set to the SQLcl connection string." >&2
  exit 2
fi

# Fail early with a clear error when the configured binary cannot be executed.
if [[ ! -x "$SQLCL_BIN" ]]; then
  echo "SQLCL_BIN is not an executable file: $SQLCL_BIN" >&2
  exit 2
fi

# Preserve the caller's source and ensure it refers to an existing directory.
app_directory=$1
if [[ ! -d "$app_directory" ]]; then
  echo "Application directory does not exist: $app_directory" >&2
  exit 2
fi

# Resolve the source to a physical absolute path before passing it to SQLcl.
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

# Start SQLcl with the requested connection, prime supporting-object installation
# in the same session, import the application tree, then exit.
"$SQLCL_BIN" "$SQLCL_CONNECTION_STRING" <<SQLCL_COMMANDS
begin
  apex_application_install.set_auto_install_sup_obj(
    p_auto_install_sup_obj => true
  );
end;
/
apex import -input "$app_directory"
exit
SQLCL_COMMANDS
