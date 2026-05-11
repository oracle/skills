#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APEX_DIR="$SCRIPT_DIR"
ROOT_SKILL="$APEX_DIR/SKILL.md"
DB_SKILLS_ROOT="${DB_SKILLS_ROOT:-"$(cd "$APEX_DIR/../.." && pwd)/oracle-db-skills"}"

failures=0

begin_check() {
  printf '  - %s\n' "$1"
}

pass() {
  printf '    ok: %s\n' "$1"
}

fail() {
  printf '    not ok: %s\n' "$1"
  failures=$((failures + 1))
}

print_section() {
  printf '\n%s\n' "$1"
}

require_file() {
  local file="$1"
  local label="$2"

  begin_check "$label exists"
  if [[ -f "$file" ]]; then
    pass "$label exists"
  else
    fail "$label missing: $file"
  fi
}

require_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  begin_check "$label"
  if grep -Eq "$pattern" "$file"; then
    pass "$label"
  else
    fail "$label"
  fi
}

reject_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  begin_check "$label"
  if grep -Eq "$pattern" "$file"; then
    fail "$label"
  else
    pass "$label"
  fi
}

require_tree_contains() {
  local dir="$1"
  local pattern="$2"
  local label="$3"

  begin_check "$label"
  if grep -REq --include='*.md' "$pattern" "$dir"; then
    pass "$label"
  else
    fail "$label"
  fi
}

reject_tree_contains() {
  local dir="$1"
  local pattern="$2"
  local label="$3"

  begin_check "$label"
  if grep -REq --include='*.md' "$pattern" "$dir"; then
    fail "$label"
  else
    pass "$label"
  fi
}

print_section "APEX root skill"
require_file "$ROOT_SKILL" "apex/SKILL.md"
require_contains "$ROOT_SKILL" '^---$' "apex/SKILL.md has YAML frontmatter"
require_contains "$ROOT_SKILL" '^name: apex$' "apex/SKILL.md has domain name"
require_contains "$ROOT_SKILL" '^description: ' "apex/SKILL.md has description"
require_contains "$ROOT_SKILL" 'Only the root `apex/SKILL.md` is a skill entry point' "apex/SKILL.md documents root-only skill entry"
require_contains "$ROOT_SKILL" '^## Routing$' "apex/SKILL.md documents category routing"
require_contains "$ROOT_SKILL" '^## Scope$' "apex/SKILL.md documents APEX scope"
require_contains "$ROOT_SKILL" '^## Safety$' "apex/SKILL.md documents safety rules"
require_contains "$ROOT_SKILL" '^## Safety Messages$' "apex/SKILL.md points to user-facing safety messages"
require_contains "$ROOT_SKILL" '^## Documentation$' "apex/SKILL.md documents documentation version policy"
require_contains "$ROOT_SKILL" 'read only the specific topic needed for the request' "apex/SKILL.md uses progressive topic loading"
require_contains "$ROOT_SKILL" '^## Token Use$' "apex/SKILL.md documents token-use rules"
require_contains "$ROOT_SKILL" 'Load one routed topic first' "apex/SKILL.md avoids loading multiple topics by default"
require_contains "$ROOT_SKILL" 'https://apex.oracle.com/en/learn/documentation/' "apex/SKILL.md points to official APEX documentation landing page"
require_contains "$ROOT_SKILL" 'newest available documentation unless the user names a specific installed APEX version' "apex/SKILL.md requires newest docs by default"
require_contains "$ROOT_SKILL" 'DB skill in use: db/' "apex/SKILL.md includes exact DB skill usage message pattern"
require_contains "$ROOT_SKILL" 'Keep APEX skills APEX-specific' "apex/SKILL.md requires APEX-specific scope"
require_contains "$ROOT_SKILL" 'Before adding or expanding an APEX skill, check whether the generic database topic is already covered under `db/`' "apex/SKILL.md requires pre-extension DB overlap check"
require_contains "$ROOT_SKILL" 'Privilege management, auditing, encryption, network security, data masking, VPD/RLS, AWR, ASH, wait events, SQL tuning, SQLcl basics' "apex/SKILL.md lists generic DB topics not to duplicate"
require_contains "$ROOT_SKILL" 'APEX_UTIL' "apex/SKILL.md lists APEX-specific APIs"
require_contains "$ROOT_SKILL" 'APEX_INSTANCE_ADMIN' "apex/SKILL.md lists APEX instance admin API"
require_contains "$ROOT_SKILL" 'APEX_APPLICATION_INSTALL' "apex/SKILL.md lists APEX application install API"
require_contains "$ROOT_SKILL" 'SELECT ANY TABLE' "apex/SKILL.md blocks broad SELECT ANY TABLE grants"
require_contains "$ROOT_SKILL" 'EXECUTE ANY PROCEDURE' "apex/SKILL.md blocks broad EXECUTE ANY PROCEDURE grants"
require_contains "$ROOT_SKILL" 'GRANT ANY PRIVILEGE' "apex/SKILL.md blocks broad GRANT ANY PRIVILEGE grants"
require_contains "$ROOT_SKILL" 'workspace administrator, developer, end user, parsing schema, database-login user, ORDS/APEX runtime account, and DBA/admin account' "apex/SKILL.md separates APEX security roles"
require_contains "$ROOT_SKILL" 'Do not treat APEX parsing schemas as personal interactive logins' "apex/SKILL.md protects parsing schemas"
require_contains "$ROOT_SKILL" 'Do not write directly to internal APEX repository tables' "apex/SKILL.md blocks direct APEX repository writes"
require_contains "$ROOT_SKILL" 'ALL_TAB_COLUMNS' "apex/SKILL.md requires view/column checks"
require_contains "$ROOT_SKILL" 'APEX session state, hidden items, read-only items, or client-side checks' "apex/SKILL.md rejects session-state security boundary"
require_contains "$ROOT_SKILL" 'db/security/row-level-security.md' "apex/SKILL.md hands off VPD/RLS"
require_contains "$ROOT_SKILL" 'APEX exports may contain' "apex/SKILL.md warns about sensitive exports"
require_contains "$ROOT_SKILL" 'created_at' "apex/SKILL.md includes audit-column pattern"
require_contains "$ROOT_SKILL" 'db/security/auditing.md' "apex/SKILL.md hands off DB auditing"
require_contains "$ROOT_SKILL" 'AWR/ASH/Diagnostics Pack' "apex/SKILL.md marks licensed diagnostics features"
require_contains "$ROOT_SKILL" 'security review covering privileges, secrets, auditability, data exposure, version/cloud restrictions, and destructive actions' "apex/SKILL.md requires security review for substantial additions"

print_section "APEX tree layout"
begin_check "APEX subdirectories do not contain SKILL.md files"
nested_skill_count="$(find "$APEX_DIR" -mindepth 2 -maxdepth 2 -type f -name 'SKILL.md' | wc -l | tr -d '[:space:]')"
if [[ "$nested_skill_count" -eq 0 ]]; then
  pass "APEX subdirectories do not contain SKILL.md files"
else
  fail "APEX subdirectories contain SKILL.md files"
fi

begin_check "APEX tree follows db-style two-level file layout"
deep_files_count="$(find "$APEX_DIR" -mindepth 4 -type f | wc -l | tr -d '[:space:]')"
if [[ "$deep_files_count" -eq 0 ]]; then
  pass "APEX tree follows db-style two-level file layout"
else
  fail "APEX tree has files below category subdirectories"
fi

print_section "Topic files"
workspace_topics=(
  "$APEX_DIR/workspace/lifecycle.md"
  "$APEX_DIR/workspace/resource-governance.md"
  "$APEX_DIR/workspace/users-and-auth.md"
  "$APEX_DIR/workspace/schema-mapping.md"
  "$APEX_DIR/workspace/removal.md"
  "$APEX_DIR/workspace/version-notes.md"
  "$APEX_DIR/workspace/security-review.md"
)

security_topics=(
  "$APEX_DIR/security/safety-messages.md"
  "$APEX_DIR/security/guardrails.md"
  "$APEX_DIR/security/audit-columns.md"
  "$APEX_DIR/security/security-review.md"
)

monitoring_topics=(
  "$APEX_DIR/monitoring/activity-log.md"
  "$APEX_DIR/monitoring/error-handling.md"
  "$APEX_DIR/monitoring/user-journey-replay.md"
  "$APEX_DIR/monitoring/background-jobs.md"
  "$APEX_DIR/monitoring/rest-data-sources.md"
  "$APEX_DIR/monitoring/page-performance.md"
  "$APEX_DIR/monitoring/ir-ig-tuning.md"
  "$APEX_DIR/monitoring/awr-wait-correlation.md"
  "$APEX_DIR/monitoring/mcp-availability.md"
  "$APEX_DIR/monitoring/security-review.md"
)

deployment_topics=(
  "$APEX_DIR/deployment/pre-check.md"
  "$APEX_DIR/deployment/export-review.md"
  "$APEX_DIR/deployment/import-promotion.md"
  "$APEX_DIR/deployment/post-deploy-validation.md"
  "$APEX_DIR/deployment/security-review.md"
  "$APEX_DIR/deployment/patching.md"
)

for topic_file in "${workspace_topics[@]}" "${security_topics[@]}" "${monitoring_topics[@]}" "${deployment_topics[@]}"; do
  rel="${topic_file#$APEX_DIR/}"
  require_file "$topic_file" "$rel topic"
  require_contains "$ROOT_SKILL" "$rel" "apex/SKILL.md routes $rel"
done

print_section "Workspace checks"
workspace_scope="$APEX_DIR/workspace"
require_tree_contains "$workspace_scope" 'APEX_WORKSPACES' "workspace scope covers workspace inventory"
require_tree_contains "$workspace_scope" 'APEX_WORKSPACE_SCHEMAS' "workspace scope covers schema mappings"
require_tree_contains "$workspace_scope" 'APEX_WORKSPACE_APEX_USERS' "workspace scope covers APEX users"
require_tree_contains "$workspace_scope" 'APEX_WORKSPACE_QUOTAS' "workspace scope checks workspace quota view"
require_tree_contains "$workspace_scope" 'FILE_STORAGE_MAX|file-storage|file storage' "workspace scope covers file storage quota"
require_tree_contains "$workspace_scope" 'RM_CONSUMER_GROUP|Resource Manager' "workspace scope covers resource manager mapping"
require_tree_contains "$workspace_scope" 'db/security/privilege-management.md' "workspace scope marks privilege DB skill usage"
require_tree_contains "$workspace_scope" 'db/monitoring/space-management.md' "workspace scope marks space analysis DB skill usage"
require_tree_contains "$workspace_scope" 'db/performance/ash-analysis.md' "workspace scope marks ASH analysis DB skill usage"
require_tree_contains "$workspace_scope" 'DB skill in use:' "workspace scope has visible DB skill usage message pattern"
require_tree_contains "$workspace_scope" 'SELECT ANY TABLE' "workspace scope blocks broad grants"
require_tree_contains "$workspace_scope" 'direct writes to internal APEX repository tables|Do not query or update internal APEX repository tables|not direct writes to internal APEX repository tables' "workspace scope blocks direct repository writes"
require_tree_contains "$workspace_scope" 'Parsing Schema Guardrails' "workspace scope has parsing schema guardrails"
require_contains "$APEX_DIR/workspace/lifecycle.md" 'Always ask whether the workspace should use a new database user/schema or an existing database user/schema' "workspace lifecycle asks for new or existing database user"
require_contains "$APEX_DIR/workspace/lifecycle.md" 'Do not infer this from the requested workspace name' "workspace lifecycle does not infer schema choice from workspace name"
require_tree_contains "$workspace_scope" 'PDB_ADMIN' "workspace scope excludes PDB_ADMIN from parsing schemas"
require_tree_contains "$workspace_scope" 'ORDS_METADATA' "workspace scope excludes ORDS_METADATA from parsing schemas"
require_tree_contains "$workspace_scope" 'ORDS_PUBLIC_USER' "workspace scope excludes ORDS_PUBLIC_USER from parsing schemas"
require_tree_contains "$workspace_scope" 'ORDS\_%' "workspace scope excludes ORDS service schemas from parsing schemas"
require_tree_contains "$workspace_scope" 'Welcome!123' "workspace scope documents temporary fallback password"
require_tree_contains "$workspace_scope" 'must change it on first login' "workspace scope requires first-login password change message"
require_contains "$APEX_DIR/workspace/removal.md" 'fresh exact English confirmation' "workspace removal requires fresh English confirmation"
require_contains "$APEX_DIR/workspace/removal.md" 'this is my own will' "workspace removal asks user to confirm own will"
require_contains "$APEX_DIR/workspace/removal.md" "p_drop_users[[:space:]]*=>[[:space:]]*'N'" "workspace removal keeps drop users disabled by default"
require_contains "$APEX_DIR/workspace/removal.md" "p_drop_users[[:space:]]*=>[[:space:]]*'Y'" "workspace removal allows dropping related users only in explicit component cleanup"
require_contains "$APEX_DIR/workspace/removal.md" "p_drop_tablespaces[[:space:]]*=>[[:space:]]*'N'" "workspace removal keeps drop tablespaces disabled by default"
reject_tree_contains "$workspace_scope" "APEX_UTIL.REMOVE_USER|DROP[[:space:]]+USER|p_drop_tablespaces[[:space:]]*=>[[:space:]]*'Y'" "workspace scope does not teach direct APEX user/database user/tablespace deletion"
require_tree_contains "$workspace_scope" 'db/security/privilege-management.md.*generic grants|generic grants.*db/security/privilege-management.md' "workspace scope hands generic grants to DB skill"
require_tree_contains "$workspace_scope" 'Existing Schema Privilege Check' "workspace scope checks privileges for reused parsing schemas"
require_tree_contains "$workspace_scope" 'dba_sys_privs' "workspace scope queries existing schema system privileges"
require_tree_contains "$workspace_scope" 'dba_ts_quotas' "workspace scope checks existing schema tablespace quotas"
require_tree_contains "$workspace_scope" 'If privileges are correct, continue' "workspace scope continues when existing schema privileges are correct"
require_tree_contains "$workspace_scope" 'Do you want me to route the privilege adjustment through db/security/privilege-management.md before continuing' "workspace scope asks before privilege adjustment"
require_contains "$APEX_DIR/workspace/lifecycle.md" 'Provisioning Recovery After Interruption' "workspace lifecycle has interrupted provisioning recovery"
require_contains "$APEX_DIR/workspace/lifecycle.md" 'inventory each planned artifact individually' "workspace recovery inventories artifacts individually"
require_contains "$APEX_DIR/workspace/lifecycle.md" 'apex_applications' "workspace recovery checks APEX applications"
require_contains "$APEX_DIR/workspace/lifecycle.md" 'all_objects' "workspace recovery checks application table artifacts"
require_contains "$APEX_DIR/workspace/lifecycle.md" 'created, missing, or unknown' "workspace recovery reports per-artifact status"
require_contains "$APEX_DIR/workspace/lifecycle.md" 'Do you want me to roll back the listed artifacts by removing only these objects' "workspace recovery asks before rollback cleanup"
require_contains "$APEX_DIR/workspace/version-notes.md" 'https://apex.oracle.com/en/learn/documentation/' "workspace version notes use official APEX documentation landing page"
require_contains "$APEX_DIR/workspace/version-notes.md" 'newest official Oracle APEX documentation' "workspace version notes prefer newest docs when target version is unknown"
require_contains "$APEX_DIR/workspace/security-review.md" '^# APEX Workspace Security Review$' "workspace has security review checklist"
reject_tree_contains "$workspace_scope" '^## APEX Session Analytics$' "workspace scope does not own monitoring content"
reject_tree_contains "$workspace_scope" '^## Application Table Audit Columns$' "workspace scope does not own security audit-column content"

print_section "Security checks"
security_scope="$APEX_DIR/security"
require_tree_contains "$security_scope" 'Safety Messages|Safety stop|Sensitive data warning' "security scope has user-facing safety messages"
require_tree_contains "$security_scope" 'Security Guardrails|Least Privilege|Role Boundaries' "security scope has guardrails"
require_tree_contains "$security_scope" 'Application Table Audit Columns|APEX Application Table Audit Columns' "security scope has APEX audit-column trigger pattern"
require_tree_contains "$security_scope" 'SYS_CONTEXT\('\''APEX\$SESSION'\'', '\''APP_USER'\''\)' "security scope audit trigger uses APEX user context"
require_tree_contains "$security_scope" 'SYS_CONTEXT\('\''USERENV'\'', '\''SESSION_USER'\''\)' "security scope audit trigger has database-user fallback"
require_tree_contains "$security_scope" 'not a replacement for tamper-resistant database auditing' "security scope distinguishes app audit metadata from DB auditing"
require_tree_contains "$security_scope" 'passwords, tokens, large payloads, BLOBs, CLOBs, or sensitive free text' "security scope blocks unsafe audit payloads"
require_tree_contains "$security_scope" 'hot tables, bulk-load paths, or ETL-heavy workloads' "security scope calls out trigger cost"
require_tree_contains "$security_scope" 'db/security/auditing.md' "security scope marks DB auditing skill usage"
require_contains "$APEX_DIR/security/security-review.md" '^# APEX Security Review$' "security has security review checklist"

print_section "Monitoring checks"
monitoring_scope="$APEX_DIR/monitoring"
require_tree_contains "$monitoring_scope" 'APEX_WORKSPACE_ACTIVITY_LOG' "monitoring scope covers APEX workspace activity log"
require_tree_contains "$monitoring_scope" '^## Usage And Load Trends$' "monitoring scope has usage and load trends"
require_tree_contains "$monitoring_scope" 'Error Handling And Logging' "monitoring scope has error handling and logging"
require_tree_contains "$monitoring_scope" 'APEX_DEBUG_MESSAGES' "monitoring scope covers APEX debug messages"
require_tree_contains "$monitoring_scope" 'APEX_ERROR_LOG' "monitoring scope covers APEX error log"
require_tree_contains "$monitoring_scope" 'DEBUG_PAGE_VIEW_ID' "monitoring scope covers debug page-view correlation"
require_tree_contains "$monitoring_scope" 'Session Replay output' "monitoring scope treats session replay as sensitive"
require_tree_contains "$monitoring_scope" 'Diagnostics Pack' "monitoring scope marks Diagnostics Pack constraints"
require_tree_contains "$monitoring_scope" 'Session Drilldown' "monitoring scope has session drilldown"
require_tree_contains "$monitoring_scope" 'End-To-End User Journey Replay' "monitoring scope has end-to-end user journey replay"
require_tree_contains "$monitoring_scope" 'Session Replay' "monitoring scope covers APEX Session Replay"
require_tree_contains "$monitoring_scope" 'APEX_ACTIVITY_LOG' "monitoring scope covers APEX activity log"
require_tree_contains "$monitoring_scope" 'Background Job Monitoring' "monitoring scope has background job monitoring"
require_tree_contains "$monitoring_scope" 'APEX_APPL_JOB_LOG' "monitoring scope covers APEX application job log"
require_tree_contains "$monitoring_scope" 'DBA_SCHEDULER_JOB_RUN_DETAILS|dba_scheduler_job_run_details' "monitoring scope maps to scheduler run details"
require_tree_contains "$monitoring_scope" 'Page Performance Profiler' "monitoring scope has page performance profiler"
require_tree_contains "$monitoring_scope" 'DBA_HIST_SQLSTAT' "monitoring scope covers DBA_HIST_SQLSTAT correlation"
require_tree_contains "$monitoring_scope" 'APEX_WORKSPACE_PAGE_VIEW_DETAIL' "monitoring scope checks page-view detail availability"
require_tree_contains "$monitoring_scope" 'Interactive Report And Grid Tuning' "monitoring scope has IR/IG tuning"
require_tree_contains "$monitoring_scope" 'APEX_APPLICATION_PAGE_IR' "monitoring scope checks IR metadata availability"
require_tree_contains "$monitoring_scope" 'APEX_APPL_PAGE_IGS' "monitoring scope checks IG metadata availability"
require_tree_contains "$monitoring_scope" 'REST Data Source Health Check' "monitoring scope has REST Data Source health check"
require_tree_contains "$monitoring_scope" 'APEX_APPL_WEB_SRC_MODULES' "monitoring scope checks REST/Web Source metadata"
require_tree_contains "$monitoring_scope" 'APEX_WEBSERVICE_LOG' "monitoring scope checks APEX webservice log"
require_tree_contains "$monitoring_scope" 'DBA_HIST_ACTIVE_SESS_HISTORY|dba_hist_active_sess_history' "monitoring scope covers historical ASH correlation"
require_tree_contains "$monitoring_scope" 'V\$SESSION|V\$SQL|V\$ACTIVE_SESSION_HISTORY|V\$SESSTAT|v\$session|v\$sql|v\$active_session_history|v\$sesstat' "monitoring scope covers live DB fallback views"
require_tree_contains "$monitoring_scope" 'AWR Wait Events' "monitoring scope has AWR wait-event cross-check"
require_tree_contains "$monitoring_scope" 'db/security/auditing.md' "monitoring scope marks DB auditing skill usage"
require_tree_contains "$monitoring_scope" 'db/monitoring/alert-log-analysis.md' "monitoring scope marks alert log and trace DB skill usage"
require_tree_contains "$monitoring_scope" 'db/features/dbms-scheduler.md' "monitoring scope marks DBMS_SCHEDULER DB skill usage"
require_tree_contains "$monitoring_scope" 'db/monitoring/top-sql-queries.md' "monitoring scope marks top SQL DB skill usage"
require_tree_contains "$monitoring_scope" 'db/sql-dev/sql-tuning.md' "monitoring scope marks SQL tuning DB skill usage"
require_tree_contains "$monitoring_scope" 'db/performance/index-strategy.md' "monitoring scope marks index strategy DB skill usage"
require_tree_contains "$monitoring_scope" 'db/ords/ords-monitoring.md' "monitoring scope marks ORDS monitoring DB skill usage"
require_tree_contains "$monitoring_scope" 'db/performance/wait-events.md' "monitoring scope marks wait-event DB skill usage"
require_contains "$APEX_DIR/monitoring/security-review.md" '^# APEX Monitoring Security Review$' "monitoring has security review checklist"

require_contains "$APEX_DIR/monitoring/mcp-availability.md" '^# APEX MCP Availability Guard$' "monitoring has MCP availability guard"
require_contains "$APEX_DIR/monitoring/mcp-availability.md" 'APEX MCP availability check failed' "monitoring has MCP failure message"
require_contains "$APEX_DIR/monitoring/mcp-availability.md" 'Do not infer database state from stale context' "monitoring blocks stale-state continuation after MCP failure"
require_contains "$APEX_DIR/monitoring/mcp-availability.md" 'inventory each planned artifact individually' "MCP recovery inventories provisioning artifacts"
require_contains "$APEX_DIR/monitoring/mcp-availability.md" 'Do you want me to roll back the listed artifacts' "MCP recovery asks before rollback cleanup"

print_section "Deployment checks"
deployment_scope="$APEX_DIR/deployment"
require_tree_contains "$deployment_scope" 'Deployment Pre-Check' "deployment scope has deployment pre-check"
require_tree_contains "$deployment_scope" 'APEX_APPLICATION_INSTALL' "deployment scope covers APEX_APPLICATION_INSTALL"
require_tree_contains "$deployment_scope" 'APEX_APPLICATIONS' "deployment scope checks APEX applications metadata"
require_tree_contains "$deployment_scope" 'APEX_APPLICATION_BUILD_OPTIONS' "deployment scope checks build options metadata"
require_tree_contains "$deployment_scope" 'APEX_APPLICATION_SUBSTITUTIONS' "deployment scope checks substitution metadata"
require_tree_contains "$deployment_scope" 'APEX_APPL_WEB_CREDENTIALS' "deployment scope checks web credential references"
require_tree_contains "$deployment_scope" 'APEX exports can contain sensitive metadata' "deployment scope warns about sensitive exports"
require_tree_contains "$deployment_scope" 'DB skill in use: `db/sqlcl/sqlcl-basics.md`' "deployment scope marks SQLcl DB skill usage"
require_tree_contains "$deployment_scope" 'DB skill in use: `db/devops/schema-migrations.md`' "deployment scope marks schema migration DB skill usage"
require_tree_contains "$deployment_scope" 'DB skill in use: `db/security/privilege-management.md`' "deployment scope marks privilege DB skill usage"
require_tree_contains "$deployment_scope" 'destructive or high-risk|Destructive Action Rules|Safety stop' "deployment scope has destructive action rules"
require_tree_contains "$deployment_scope" 'no real passwords, tokens, OAuth secrets, SMTP credentials, wallet passwords' "deployment scope blocks real secrets"
require_contains "$APEX_DIR/deployment/pre-check.md" 'https://apex.oracle.com/en/learn/documentation/' "deployment pre-check uses official APEX documentation landing page"
require_contains "$APEX_DIR/deployment/pre-check.md" 'newest official Oracle APEX documentation' "deployment pre-check prefers newest docs when target version is unknown"
require_contains "$APEX_DIR/deployment/security-review.md" '^# APEX Deployment Security Review$' "deployment has security review checklist"

require_contains "$APEX_DIR/deployment/pre-check.md" 'Oracle Database 19.3 or higher' "deployment pre-check includes APEX 24.2 database support note"
require_contains "$APEX_DIR/deployment/patching.md" '^# APEX Patch Set Bundle Workflow$' "deployment has patch set bundle workflow"
require_contains "$APEX_DIR/deployment/patching.md" 'APEX_PATCHES' "deployment patching checks APEX_PATCHES"
require_contains "$APEX_DIR/deployment/patching.md" '37366599' "deployment patching includes dated APEX 24.2 patch reference"
require_contains "$APEX_DIR/deployment/patching.md" 'PATCH_VERSION' "deployment patching includes patch version"
require_contains "$APEX_DIR/deployment/patching.md" '24.2.16' "deployment patching includes target patched APEX version"

print_section "Global safety checks"
reject_tree_contains "$APEX_DIR" 'DB skill handoff:' "APEX tree does not use ambiguous DB handoff label"
reject_tree_contains "$APEX_DIR" 'UPDATE[[:space:]]+APEX_|INSERT[[:space:]]+INTO[[:space:]]+APEX_|DELETE[[:space:]]+FROM[[:space:]]+APEX_' "APEX tree does not recommend direct APEX repository DML"
reject_tree_contains "$APEX_DIR" 'GRANT[[:space:]]+(DBA|SYSDBA|SELECT ANY TABLE|EXECUTE ANY PROCEDURE|CREATE ANY TABLE|GRANT ANY ROLE|GRANT ANY PRIVILEGE)' "APEX tree does not contain broad-grant SQL examples"
reject_tree_contains "$APEX_DIR" 'docs\.oracle\.com/en/database/oracle/apex/[0-9]' "APEX tree does not hard-code versioned Oracle APEX docs URLs"
reject_tree_contains "$APEX_DIR" 'password123|Password123|Welcome1|changeme|ChangeMe|secret123|Bearer[[:space:]]+[A-Za-z0-9._-]+|client_secret[[:space:]]*[:=][[:space:]]*['\''"]?[A-Za-z0-9]' "APEX tree does not contain hard-coded secret-like example values"

reject_contains "$APEX_DIR/monitoring/mcp-availability.md" 'sql -mcp|conn -save' "APEX MCP availability guard does not include database-client setup commands"

print_section "Cross-file quality gates"
all_markdown_files=()
while IFS= read -r markdown_file; do
  all_markdown_files+=("$markdown_file")
done < <(find "$APEX_DIR" -type f -name '*.md' | sort)

for markdown_file in "${all_markdown_files[@]}"; do
  rel="${markdown_file#$APEX_DIR/}"

  if grep -Eq 'db/[[:alnum:]_-]+/' "$markdown_file"; then
    require_contains "$markdown_file" 'DB skill in use:' "$rel marks DB skill usage when referencing db/"
  fi

  if grep -Eq 'AWR|ASH|DBA_HIST' "$markdown_file"; then
    require_contains "$markdown_file" 'Diagnostics Pack' "$rel marks Diagnostics Pack for AWR/ASH/historical views"
  fi

  if grep -Eq 'APEX_[A-Z0-9_]+' "$markdown_file"; then
    require_contains "$markdown_file" 'ALL_TAB_COLUMNS|ALL_ARGUMENTS|APEX_DICTIONARY|APEX_RELEASE|column availability|view availability|available columns|package signature|version-specific|Version check' "$rel has version/availability guard for APEX objects"
  fi
done

print_section "DB skill reference checks"
begin_check "DB skills root exists or DB_SKILLS_ROOT is configured"
if [[ -d "$DB_SKILLS_ROOT/db" ]]; then
  pass "DB skills root available: $DB_SKILLS_ROOT"
else
  fail "DB skills root missing: $DB_SKILLS_ROOT"
fi

db_skill_refs=()
while IFS= read -r db_skill_ref; do
  db_skill_refs+=("$db_skill_ref")
done < <(grep -RhoE 'db/[A-Za-z0-9_*/.-]+\.md' "$APEX_DIR" --include='*.md' | sort -u)

for db_skill_ref in "${db_skill_refs[@]}"; do
  if [[ "$db_skill_ref" == *'*'* ]]; then
    begin_check "$db_skill_ref is an intentional wildcard DB skill reference"
    pass "$db_skill_ref is an intentional wildcard DB skill reference"
  else
    begin_check "$db_skill_ref exists in DB skills"
    if [[ -f "$DB_SKILLS_ROOT/$db_skill_ref" ]]; then
      pass "$db_skill_ref exists in DB skills"
    else
      fail "$db_skill_ref missing in DB skills"
    fi
  fi
done

print_section "Routing prompt examples"
prompt_count=0

add_prompt_example() {
  local topic="$1"
  local expected_skill="$2"
  local expected_message="$3"
  local prompt="$4"

  prompt_count=$((prompt_count + 1))
  printf '  scenario %02d: %s\n' "$prompt_count" "$topic"
  printf '    given:  %s\n' "$prompt"
  printf '    expect: route to %s\n' "$expected_skill"
  printf '    expect: %s\n' "$expected_message"
  printf '    ok: routing example is documented\n'
}

add_prompt_example "workspace-list" "apex/workspace/lifecycle.md" "No DB skill in use message unless generic database diagnosis is requested." "List APEX workspaces and show basic workspace metadata."
add_prompt_example "workspace-provisioning" "apex/workspace/lifecycle.md" "Use least privilege and supported APEX APIs." "Create an APEX workspace with a parsing schema and an initial workspace admin."
add_prompt_example "workspace-resource-governance" "apex/workspace/resource-governance.md plus db/performance/ash-analysis.md and db/monitoring/space-management.md" "DB skill in use messages for CPU/IO/storage analysis; keep APEX focused on workspace quotas and mappings." "Analyze APEX workspace limits, APEX_WORKSPACE_QUOTAS, sessions, storage, CPU/IO pressure, and recommend quota adjustments."
add_prompt_example "destructive-cleanup" "apex/workspace/removal.md" "Safety stop: list affected objects and require a fresh exact English own-will confirmation before delete steps." "Drop this APEX workspace and all users created for it."
add_prompt_example "broad-privileges" "apex/security/guardrails.md plus db/security/privilege-management.md" "DB skill in use message plus broad-privilege safety stop." "Grant DBA to the APEX parsing schema so the app can access everything."
add_prompt_example "internal-apex-repository" "apex/security/safety-messages.md" "Safety stop: direct writes to internal APEX repository tables are not supported." "Update the internal APEX repository table directly to rename a workspace."
add_prompt_example "activity-log-triage" "apex/monitoring/activity-log.md" "Sensitive data warning for logs; DB skill in use message if AWR/ASH/wait events are used." "Find slow APEX pages and correlate the spike with database wait events."
add_prompt_example "page-performance-profiler" "apex/monitoring/page-performance.md plus db/monitoring/top-sql-queries.md" "DB skill in use message for DBA_HIST_SQLSTAT; keep APEX focused on page and region context." "Profile the slowest APEX pages and regions, export page performance details, and correlate with DBA_HIST_SQLSTAT."
add_prompt_example "background-job-monitoring" "apex/monitoring/background-jobs.md plus db/features/dbms-scheduler.md" "DB skill in use message for DBMS_SCHEDULER; review APEX job log before changing scheduler state." "Diagnose failed APEX background jobs and map them to DBA_SCHEDULER_JOB_RUN_DETAILS."
add_prompt_example "interactive-report-grid-tuning" "apex/monitoring/ir-ig-tuning.md plus db/sql-dev/sql-tuning.md and db/performance/index-strategy.md" "DB skill in use messages for generic SQL tuning/index/AWR analysis; keep APEX focused on IR/IG behavior." "Tune slow Interactive Reports and Interactive Grids, including filtering, pagination, downloads, indexes, and SQL IDs in AWR."
add_prompt_example "rest-data-source-health-check" "apex/monitoring/rest-data-sources.md plus db/ords/ords-monitoring.md and db/performance/ash-analysis.md" "DB skill in use messages for ORDS/ASH/network waits; keep APEX focused on REST Data Source metadata and logs." 'Health check APEX REST Data Sources, latency, HTTP error codes, and database-side network waits via ASH and V$SESSTAT.'
add_prompt_example "error-handling-logging" "apex/monitoring/error-handling.md plus db/security/auditing.md, db/performance/awr-reports.md, db/performance/ash-analysis.md, and db/monitoring/alert-log-analysis.md" "DB skill in use messages for audit, AWR/ASH, alert log, and trace analysis; keep APEX focused on APEX debug/error context." "Collect, categorize, and prioritize APEX errors from APEX_DEBUG_MESSAGES and APEX_ERROR_LOG, correlate with AWR trace/audit evidence, and suggest quick fixes."
add_prompt_example "end-to-end-user-journey-replay" "apex/monitoring/user-journey-replay.md plus db/performance/ash-analysis.md, db/performance/awr-reports.md, and db/performance/wait-events.md" "DB skill in use messages for ASH/AWR/wait-event analysis; keep APEX focused on Session Replay, activity log path, and journey reproduction." "Replay an end-to-end APEX user journey with Session Replay and APEX_ACTIVITY_LOG, then correlate the critical path with ASH/AWR for systemic bottlenecks."
add_prompt_example "apex-deployment-promotion" "apex/deployment/import-promotion.md plus db/sqlcl/sqlcl-cicd.md, db/devops/schema-migrations.md, and db/security/privilege-management.md as needed" "DB skill in use messages for generic SQLcl, schema migration, and privilege work; keep APEX focused on export/import, APEX_APPLICATION_INSTALL, and APEX metadata safety." "Review and promote an APEX application export to production using APEX_APPLICATION_INSTALL, build options, substitutions, credential references, and safe import validation."
add_prompt_example "audit-columns" "apex/security/audit-columns.md" "Audit note: trigger records application metadata only; use db/security/auditing.md for database auditing." "Add created_by and updated_by audit columns for an APEX application table."
add_prompt_example "apex-mcp-transport-closed" "apex/monitoring/mcp-availability.md" "APEX MCP availability check failed; pause the APEX workflow and re-read state after recovery." "The MCP transport is closed while creating an APEX workspace user. What should happen next?"
add_prompt_example "interrupted-provisioning-rollback" "apex/monitoring/mcp-availability.md plus apex/workspace/lifecycle.md and apex/workspace/removal.md if cleanup is requested" "Inventory each planned artifact individually, then ask whether to roll back only the listed artifacts before retrying." "I aborted while creating an APEX workspace, parsing schema, EMP table, and demo app. What should happen before we continue?"
add_prompt_example "apex-patch-status" "apex/deployment/patching.md" "Check APEX_RELEASE and APEX_PATCHES, then verify latest patch details from Oracle before recommending a patch." "Check whether my APEX 24.2 environment has the latest Patch Set Bundle installed."

begin_check "routing prompt examples available"
if [[ "$prompt_count" -ge 15 ]]; then
  pass "routing prompt examples available ($prompt_count)"
else
  fail "routing prompt examples should cover core APEX workflows"
fi

print_section "Result"
if [[ "$failures" -eq 0 ]]; then
  printf '  0 failing\n'
  printf '  all APEX skill checks passed\n'
else
  printf '  %d failing\n' "$failures"
  printf '  APEX skill checks failed\n'
  exit 1
fi
