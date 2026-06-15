#!/usr/bin/env node

function usage() {
  return `Usage:
  node apex/admin/tools/workspace-admin-plan.mjs --action <inventory|create|verify|recover|remove> [--workspace <name>] [--schema <name>] [--user <name>] [--format markdown|json]

Purpose:
  Generate APEX-only workspace administration checklists and supported APEX view/API snippets.
  This tool does not create database users, grant privileges, run SQLcl, or perform database administration.
`;
}

function readOption(args, name, fallback = "") {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) {
    return fallback;
  }
  return args[index + 1];
}

function hasFlag(args, name) {
  return args.includes(name);
}

function bindValue(value, placeholder) {
  return value ? value.toUpperCase() : placeholder;
}

const APEX_VERSION_GATE_SNIPPET = {
  label: "Supported APEX version gate",
  sql: `SELECT version_no,
       CASE
           WHEN REGEXP_LIKE(version_no, '^(26\\.1|24\\.2|24\\.1)(\\.|$)')
           THEN 'SUPPORTED'
           ELSE 'UNSUPPORTED'
       END AS apex_admin_skill_support
FROM apex_release;`
};

function inventoryPlan(input) {
  return {
    title: "APEX Workspace Inventory",
    cautions: [
      "Run the supported APEX version gate first; stop if the installed APEX release is unsupported by this skill.",
      "Use supported APEX views only.",
      "Inspect view columns in the target APEX version before relying on version-specific columns.",
      "Do not query or update internal APEX repository tables."
    ],
    checklist: [
      "Identify the target workspace and workspace ID.",
      "List mapped parsing schemas.",
      "List workspace administrators and developers.",
      "List applications in the workspace.",
      "Record any missing or unknown evidence explicitly."
    ],
    snippets: [
      APEX_VERSION_GATE_SNIPPET,
      {
        label: "View column check",
        sql: `SELECT table_name,
       column_id,
       column_name,
       data_type
FROM all_tab_columns
WHERE table_name IN (
          'APEX_WORKSPACES',
          'APEX_WORKSPACE_SCHEMAS',
          'APEX_WORKSPACE_APEX_USERS',
          'APEX_APPLICATIONS')
ORDER BY table_name,
         column_id;`
      },
      {
        label: "Workspace inventory",
        sql: `SELECT workspace_id,
       workspace,
       workspace_display_name,
       path_prefix,
       schemas,
       applications,
       apex_developers,
       apex_workspace_administrators,
       created_on
FROM apex_workspaces
WHERE (:workspace_name IS NULL OR workspace = UPPER(TRIM(:workspace_name)))
ORDER BY workspace;`
      },
      {
        label: "Workspace schema mappings",
        sql: `SELECT workspace_name,
       schema
FROM apex_workspace_schemas
WHERE (:workspace_name IS NULL OR workspace_name = UPPER(TRIM(:workspace_name)))
ORDER BY workspace_name,
         schema;`
      },
      {
        label: "Workspace users",
        sql: `SELECT workspace_name,
       user_name,
       email,
       is_admin,
       is_application_developer,
       account_locked
FROM apex_workspace_apex_users
WHERE (:workspace_name IS NULL OR workspace_name = UPPER(TRIM(:workspace_name)))
ORDER BY workspace_name,
         user_name;`
      },
      {
        label: "Workspace applications",
        sql: `SELECT workspace,
       application_id,
       application_name,
       alias
FROM apex_applications
WHERE (:workspace_name IS NULL OR workspace = UPPER(TRIM(:workspace_name)))
ORDER BY workspace,
         application_id;`
      }
    ],
    binds: {
      workspace_name: bindValue(input.workspace, ":workspace_name")
    }
  };
}

function createPlan(input) {
  return {
    title: "APEX Workspace Create Plan",
    cautions: [
      "This plan covers only the APEX workspace step.",
      "Run the supported APEX version gate first; stop if the installed APEX release is unsupported by this skill.",
      "Prefer a dedicated non-SYS/SYSTEM database account granted APEX_ADMINISTRATOR_ROLE for routine APEX workspace automation.",
      "Do not connect MCP or routine automation as SYS or SYSDBA for this workflow.",
      "SYSTEM without SYSDBA may run APEX-admin-scoped work only after the verified identity, exact scope, risk summary, and an exact uppercase YES confirmation; do not put passwords in logged MCP SQL.",
      "Create or update a local operation protocol file outside the skill tree before workspace changes begin.",
      "Non-APEX database user creation, password handling, manual grants, tablespaces, and quotas belong outside this APEX admin tool.",
      "For new database users/schemas that will become APEX workspace or parsing schemas, use APEX-managed schema grants through APEX_INSTANCE_ADMIN.ADD_SCHEMA p_grant_apex_privileges => TRUE as the standard when the installed APEX version supports that parameter.",
      "WORKSPACE_PROVISION_DEMO_OBJECTS is an instance-level side-effect setting; do not change it or create workspaces under the wrong value without explicit user confirmation.",
      "Check APEX_INSTANCE_ADMIN.ADD_WORKSPACE and ADD_SCHEMA arguments in the installed APEX version before use."
    ],
    checklist: [
      "Confirm the installed APEX version is supported by this skill.",
      "Check WORKSPACE_PROVISION_DEMO_OBJECTS and confirm whether demonstration applications/database objects should be created in new workspaces.",
      "Confirm exact workspace name.",
      "Confirm workspace description or administrative notes.",
      "Confirm the local protocol output directory or exact Markdown file path.",
      "Confirm the active workspace automation account is a dedicated APEX admin identity or SYSTEM approved by the exact uppercase YES gate, and not SYS or SYSDBA.",
      "If SYSTEM is used, show the verified identity, exact workspace/API scope, password-handling path when relevant, and risk summary; continue only after the user replies exactly YES.",
      "Confirm whether the workspace reuses an existing schema or needs a new database user/schema.",
      "For an existing schema, review suggested additional privileges through the schema-mapping reference before mapping it.",
      "For supported ADD_SCHEMA signatures, use p_grant_apex_privileges => TRUE as the standard APEX-managed grant behavior unless the user or environment policy opts out; do not rely on the package default.",
      "For a new schema, route database user creation, password handling, tablespace, quota, and manual grants to the relevant DB skill before the APEX workspace API step.",
      "Confirm primary parsing schema and any additional schema mappings.",
      "Verify the schema mapping candidate is not an APEX platform, ORDS, DBA, or shared runtime account.",
      "Confirm whether a deterministic workspace ID is required.",
      "Confirm the initial workspace administrator details and secret-handling path through the workspace users reference.",
      "For bulk provisioning, preview the exact naming method, count or email-address input, quota, Resource Manager consumer group, automatic-purge setting, demo-object policy, and description before any create loop.",
      "Create the workspace with supported APEX_INSTANCE_ADMIN API.",
      "Verify the workspace through supported APEX views."
    ],
    snippets: [
      {
        label: "Connection identity guard",
        sql: `SELECT SYS_CONTEXT('USERENV', 'SESSION_USER') AS session_user,
       SYS_CONTEXT('USERENV', 'CURRENT_USER') AS current_user,
       SYS_CONTEXT('USERENV', 'ISDBA') AS is_dba
FROM dual;`
      },
      APEX_VERSION_GATE_SNIPPET,
      {
        label: "Demo object provisioning check",
        sql: `SELECT APEX_INSTANCE_ADMIN.GET_PARAMETER('WORKSPACE_PROVISION_DEMO_OBJECTS') AS workspace_provision_demo_objects
FROM dual;`
      },
      {
        label: "ADD_WORKSPACE API argument check",
        sql: `WITH apex_instance_admin_target AS (
    SELECT owner,
           object_name AS package_name
    FROM all_objects
    WHERE object_name = 'APEX_INSTANCE_ADMIN'
      AND object_type = 'PACKAGE'
    UNION ALL
    SELECT table_owner AS owner,
           table_name  AS package_name
    FROM all_synonyms
    WHERE synonym_name = 'APEX_INSTANCE_ADMIN'
)
SELECT DISTINCT
       a.owner,
       a.package_name,
       a.argument_name,
       position,
       a.data_type,
       a.defaulted
FROM apex_instance_admin_target t
JOIN all_arguments a
  ON a.owner = t.owner
 AND a.package_name = t.package_name
WHERE a.object_name = 'ADD_WORKSPACE'
ORDER BY a.owner,
         a.package_name,
         a.position;`
      },
      {
        label: "ADD_SCHEMA API argument check",
        sql: `WITH apex_instance_admin_target AS (
    SELECT owner,
           object_name AS package_name
    FROM all_objects
    WHERE object_name = 'APEX_INSTANCE_ADMIN'
      AND object_type = 'PACKAGE'
    UNION ALL
    SELECT table_owner AS owner,
           table_name  AS package_name
    FROM all_synonyms
    WHERE synonym_name = 'APEX_INSTANCE_ADMIN'
)
SELECT DISTINCT
       a.owner,
       a.package_name,
       a.argument_name,
       position,
       a.data_type,
       a.defaulted
FROM apex_instance_admin_target t
JOIN all_arguments a
  ON a.owner = t.owner
 AND a.package_name = t.package_name
WHERE a.object_name = 'ADD_SCHEMA'
ORDER BY a.owner,
         a.package_name,
         a.position;`
      },
      {
        label: "Create workspace",
        sql: `BEGIN
    APEX_INSTANCE_ADMIN.ADD_WORKSPACE(
        p_workspace_id   => :workspace_id,
        p_workspace      => :workspace_name,
        p_primary_schema => :primary_schema);
END;
/`
      },
      {
        label: "Add additional schema mapping with APEX-managed grants",
        sql: `-- Use only for a schema that is not already mapped by ADD_WORKSPACE.
BEGIN
    APEX_INSTANCE_ADMIN.ADD_SCHEMA(
        p_workspace             => :workspace_name,
        p_schema                => :schema_name,
        p_grant_apex_privileges => TRUE);
END;
/`
      },
      ...inventoryPlan(input).snippets.slice(1, 3)
    ],
    binds: {
      workspace_name: bindValue(input.workspace, ":workspace_name"),
      primary_schema: bindValue(input.schema, ":primary_schema"),
      schema_name: bindValue(input.schema, ":schema_name"),
      workspace_id: ":workspace_id"
    }
  };
}

function verifyPlan(input) {
  return {
    title: "APEX Workspace Verification",
    cautions: [
      "Verification should use supported APEX views and APIs.",
      "Do not treat session state or client-side checks as a security boundary."
    ],
    checklist: [
      "Verify workspace row exists.",
      "Verify schema mappings match the intended parsing schemas.",
      "Verify the expected APEX workspace users and roles.",
      "Verify expected applications are in the workspace.",
      "Record unexpected extra mappings, missing users, or locked accounts."
    ],
    snippets: inventoryPlan(input).snippets,
    binds: {
      workspace_name: bindValue(input.workspace, ":workspace_name"),
      primary_schema: bindValue(input.schema, ":primary_schema"),
      user_name: bindValue(input.user, ":user_name")
    }
  };
}

function recoverPlan(input) {
  return {
    title: "Interrupted APEX Provisioning Recovery",
    cautions: [
      "Do not retry blindly after an interrupted APEX provisioning workflow.",
      "Inventory planned artifacts first and classify each as created, missing, or unknown.",
      "Use the destructive removal workflow only after explicit confirmation."
    ],
    checklist: [
      "Reconnect or re-establish a fresh APEX evidence source.",
      "Inventory the planned workspace.",
      "Inventory mapped parsing schemas.",
      "Inventory planned APEX workspace users.",
      "Inventory planned APEX applications.",
      "Ask whether to continue from verified state or remove only the listed artifacts."
    ],
    snippets: inventoryPlan(input).snippets,
    binds: {
      workspace_name: bindValue(input.workspace, ":workspace_name"),
      primary_schema: bindValue(input.schema, ":primary_schema"),
      user_name: bindValue(input.user, ":user_name")
    }
  };
}

function removePlan(input) {
  return {
    title: "APEX Workspace Removal Pre-Check",
    cautions: [
      "Removal is destructive and requires a fresh exact confirmation for the current scope.",
      "Default to keeping related database users and tablespaces.",
      "Database user and tablespace deletion is outside this APEX admin tool."
    ],
    checklist: [
      "List the exact workspace to remove.",
      "List mapped schemas and applications for user review.",
      "Confirm whether only the APEX workspace should be removed.",
      "Require the configured confirmation phrase from the removal reference before generating removal steps.",
      "Verify removal through supported APEX views."
    ],
    snippets: [
      ...inventoryPlan(input).snippets.slice(1),
      {
        label: "APEX workspace removal shape",
        sql: `BEGIN
    APEX_INSTANCE_ADMIN.REMOVE_WORKSPACE(
        p_workspace         => :workspace_name,
        p_drop_users        => 'N',
        p_drop_tablespaces  => 'N');
END;
/`
      }
    ],
    binds: {
      workspace_name: bindValue(input.workspace, ":workspace_name")
    }
  };
}

function buildPlan(input) {
  switch (input.action) {
    case "inventory":
      return inventoryPlan(input);
    case "create":
      return createPlan(input);
    case "verify":
      return verifyPlan(input);
    case "recover":
      return recoverPlan(input);
    case "remove":
      return removePlan(input);
    default:
      throw new Error("--action must be one of inventory, create, verify, recover, remove.");
  }
}

function renderMarkdown(plan) {
  const lines = [];
  lines.push(`# ${plan.title}`);
  lines.push("");
  lines.push("APEX-only workspace administration aid. Review snippets before use in the target APEX version.");
  lines.push("");
  lines.push("## Cautions");
  lines.push("");
  for (const caution of plan.cautions) {
    lines.push(`- ${caution}`);
  }
  lines.push("");
  lines.push("## Checklist");
  lines.push("");
  for (const item of plan.checklist) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Binds");
  lines.push("");
  for (const [name, value] of Object.entries(plan.binds)) {
    lines.push(`- ${name}: ${value}`);
  }
  lines.push("");
  lines.push("## Snippets");
  for (const snippet of plan.snippets) {
    lines.push("");
    lines.push(`### ${snippet.label}`);
    lines.push("");
    lines.push("```sql");
    lines.push(snippet.sql);
    lines.push("```");
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  if (hasFlag(args, "--help") || args.length === 0) {
    console.log(usage());
    return;
  }

  const input = {
    action: readOption(args, "--action"),
    workspace: readOption(args, "--workspace"),
    schema: readOption(args, "--schema"),
    user: readOption(args, "--user")
  };
  const format = readOption(args, "--format", "markdown").toLowerCase();

  if (!["markdown", "json"].includes(format)) {
    throw new Error("--format must be markdown or json.");
  }

  const plan = buildPlan(input);
  if (format === "json") {
    process.stdout.write(JSON.stringify(plan, null, 2) + "\n");
  } else {
    process.stdout.write(renderMarkdown(plan));
  }
}

try {
  main();
} catch (error) {
  console.error(`workspace-admin-plan: ${error.message}`);
  process.exit(1);
}
