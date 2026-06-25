#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_MAX_EXAMPLES = 12;

const SIGNALS = [
  {
    id: "apex_collection",
    label: "APEX Collections",
    pattern: /\bAPEX_COLLECTIONS?\b/i,
    risk: "Session-scoped Collection work can lengthen APEX requests when large data sets are materialized or repeatedly refreshed."
  },
  {
    id: "wait_for_result",
    label: "Synchronous Dynamic Actions",
    pattern: /p_wait_for_result\s*=>\s*'Y'/i,
    risk: "Synchronous PL/SQL Dynamic Actions hold the browser flow and the APEX request until server work completes."
  },
  {
    id: "ajax_submit",
    label: "AJAX Items To Submit",
    pattern: /p_ajax_items_to_submit/i,
    risk: "Many AJAX submits can multiply APEX requests for one user action or page load."
  },
  {
    id: "execute_plsql_da",
    label: "Execute PL/SQL Dynamic Actions",
    pattern: /NATIVE_EXECUTE_PLSQL_CODE/i,
    risk: "PL/SQL Dynamic Actions can become request hot spots when fired frequently or chained."
  },
  {
    id: "explicit_commit",
    label: "Explicit COMMIT",
    pattern: /^\s*COMMIT\s*;/i,
    risk: "Explicit commits inside APEX page processing split transaction control and can complicate error handling."
  },
  {
    id: "dynamic_sql",
    label: "Dynamic SQL",
    pattern: /\bEXECUTE\s+IMMEDIATE\b/i,
    risk: "Dynamic SQL in APEX components needs review for parse cost, bind usage, and predictable request timing."
  },
  {
    id: "temporary_lob",
    label: "Temporary CLOB/BLOB",
    pattern: /\bDBMS_LOB\.CREATETEMPORARY\b/i,
    risk: "Temporary LOB creation in an APEX request can indicate large generated responses or payload processing."
  },
  {
    id: "htp_output",
    label: "Direct HTP Output",
    pattern: /\bHTP\.P\b/i,
    risk: "Direct generated output can indicate custom AJAX or JSON endpoints that should be measured for size and timing."
  },
  {
    id: "apex_web_service",
    label: "APEX Web Service Calls",
    pattern: /\bAPEX_WEB_SERVICE\./i,
    risk: "External calls from APEX requests can make user requests dependent on remote latency."
  },
  {
    id: "g_x_globals",
    label: "APEX_APPLICATION.G_X Globals",
    pattern: /\bAPEX_APPLICATION\.G_X\d+\b/i,
    risk: "Custom AJAX parameter handling should be checked for validation, data volume, and repeated calls."
  },
  {
    id: "select_star",
    label: "SELECT *",
    pattern: /\bSELECT\s+\*/i,
    risk: "SELECT * in APEX reports, charts, or callbacks can fetch unnecessary columns and make component cost less predictable."
  }
];

function usage() {
  return `Usage:
  node apex/admin/tools/apex-export-risk-scan.mjs --export <file> [--format markdown|json] [--out <file>] [--max-examples <n>]

Purpose:
  Static APEX-only export review. This tool does not tune ORDS, SQLcl, database indexes, wait events, or execution plans.
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

function countHeaderValue(header, regex) {
  const match = header.match(regex);
  return match ? match[1].trim() : "";
}

function parseNumber(value) {
  const normalized = String(value || "").replace(/,/g, "").trim();
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseHeader(lines) {
  const header = lines.slice(0, 260).join("\n");
  return {
    apex_release: countHeaderValue(header, /p_release\s*=>\s*'([^']+)'/i) || countHeaderValue(header, /--\s+Version:\s+(.+)/i),
    import_version_date: countHeaderValue(header, /p_version_yyyy_mm_dd\s*=>\s*'([^']+)'/i),
    application_id: countHeaderValue(header, /--\s+Application:\s+([0-9]+)/i) || countHeaderValue(header, /p_default_application_id\s*=>\s*([0-9]+)/i),
    application_name: countHeaderValue(header, /--\s+Name:\s+(.+)/i) || countHeaderValue(header, /p_name\s*=>\s*(?:nvl\([^,]+,)?'([^']+)'/i),
    export_time: countHeaderValue(header, /--\s+Date and Time:\s+(.+)/i),
    exported_by: countHeaderValue(header, /--\s+Exported By:\s+(.+)/i),
    app_version: countHeaderValue(header, /p_flow_version\s*=>\s*'([^']+)'/i),
    compatibility_mode: countHeaderValue(header, /p_compatibility_mode\s*=>\s*'([^']+)'/i),
    counts: {
      pages: parseNumber(countHeaderValue(header, /--\s+Pages:\s+([0-9,]+)/i)),
      items: parseNumber(countHeaderValue(header, /--\s+Items:\s+([0-9,]+)/i)),
      validations: parseNumber(countHeaderValue(header, /--\s+Validations:\s+([0-9,]+)/i)),
      processes: parseNumber(countHeaderValue(header, /--\s+Processes:\s+([0-9,]+)/i)),
      regions: parseNumber(countHeaderValue(header, /--\s+Regions:\s+([0-9,]+)/i)),
      buttons: parseNumber(countHeaderValue(header, /--\s+Buttons:\s+([0-9,]+)/i)),
      dynamic_actions: parseNumber(countHeaderValue(header, /--\s+Dynamic Actions:\s+([0-9,]+)/i)),
      plugins: parseNumber(countHeaderValue(header, /--\s+Plug-ins:\s+([0-9,]+)/i)),
      messages: parseNumber(countHeaderValue(header, /--\s+Messages:\s+([0-9,]+)/i))
    }
  };
}

function cleanSnippet(line) {
  return line
    .replace(/(authorization\s*[:=]\s*)\S+/ig, "$1<redacted>")
    .replace(/(bearer\s+)[A-Za-z0-9._~+/-]+=*/ig, "$1<redacted>")
    .replace(/\b([A-Za-z0-9_]*(?:password|passwd|pwd|secret|token|api_key|apikey|client_secret)[A-Za-z0-9_]*)\s*=>\s*'[^']*'/ig, "$1 => '<redacted>'")
    .replace(/\b([A-Za-z0-9_]*(?:password|passwd|pwd|secret|token|api_key|apikey|client_secret)[A-Za-z0-9_]*)\s*=>\s*[^,\s)]+/ig, "$1 => <redacted>")
    .replace(/\b([A-Za-z0-9_]*(?:password|passwd|pwd|secret|token|api_key|apikey|client_secret)[A-Za-z0-9_]*)\s*[:=](?!>)\s*'[^']*'/ig, "$1=<redacted>")
    .replace(/\b([A-Za-z0-9_]*(?:password|passwd|pwd|secret|token|api_key|apikey|client_secret)[A-Za-z0-9_]*)\s*[:=](?!>)\s*\S+/ig, "$1=<redacted>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function contextLabel(context) {
  const parts = [];
  if (context.page_id) {
    parts.push(`page ${context.page_id}`);
  }
  if (context.page_name) {
    parts.push(context.page_name);
  }
  if (context.component_name) {
    parts.push(context.component_name);
  }
  return parts.join(" / ");
}

function scan(lines, maxExamples) {
  const signalMap = new Map(SIGNALS.map((signal) => [
    signal.id,
    {
      ...signal,
      count: 0,
      examples: []
    }
  ]));

  const context = {
    page_id: "",
    page_name: "",
    component_name: ""
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;

    const pagePrompt = line.match(/^prompt\s+PAGE\s+([0-9]+)\s*(?:-\s*(.*))?$/i);
    if (pagePrompt) {
      context.page_id = pagePrompt[1];
      context.page_name = (pagePrompt[2] || "").trim();
      context.component_name = "";
    }

    const pagePath = line.match(/^prompt\s+--application\/pages\/page_0*([0-9]+)/i);
    if (pagePath) {
      context.page_id = pagePath[1];
      context.component_name = "";
    }

    const componentName = line.match(/,p_name\s*=>\s*'([^']+)'/i);
    if (componentName) {
      context.component_name = componentName[1];
    }

    for (const signal of SIGNALS) {
      if (!signal.pattern.test(line)) {
        continue;
      }
      const entry = signalMap.get(signal.id);
      entry.count += 1;
      if (entry.examples.length < maxExamples) {
        entry.examples.push({
          line: lineNumber,
          context: contextLabel(context),
          snippet: cleanSnippet(line)
        });
      }
    }
  }

  return Array.from(signalMap.values()).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# APEX Export Runtime Risk Scan");
  lines.push("");
  lines.push("Static APEX-only review. Findings are candidates for APEX follow-up, not proof of runtime root cause.");
  lines.push("");
  lines.push("## Export Metadata");
  lines.push("");
  for (const [key, value] of Object.entries(report.metadata)) {
    if (key === "counts") {
      continue;
    }
    lines.push(`- ${key}: ${value || "unknown"}`);
  }
  lines.push("");
  lines.push("## Component Counts");
  lines.push("");
  for (const [key, value] of Object.entries(report.metadata.counts)) {
    lines.push(`- ${key}: ${value ?? "unknown"}`);
  }
  lines.push("");
  lines.push("## Static APEX Signals");
  lines.push("");
  lines.push("| Signal | Count | APEX Review Reason |");
  lines.push("|---|---:|---|");
  for (const signal of report.signals) {
    lines.push(`| ${signal.label} | ${signal.count} | ${signal.risk} |`);
  }
  lines.push("");
  lines.push("## Examples");
  for (const signal of report.signals.filter((item) => item.count > 0)) {
    lines.push("");
    lines.push(`### ${signal.label}`);
    lines.push("");
    for (const example of signal.examples) {
      const suffix = example.context ? ` (${example.context})` : "";
      lines.push(`- line ${example.line}${suffix}: \`${example.snippet.replace(/`/g, "'")}\``);
    }
  }
  lines.push("");
  lines.push("## External Boundary");
  lines.push("");
  lines.push("This tool does not recommend ORDS pool changes, SQLcl workflows, database indexes, wait-event interpretation, or execution-plan tuning. Use these findings to choose APEX Activity Log, Page Performance, Debug, and browser Network verification targets.");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  if (hasFlag(args, "--help") || args.length === 0) {
    console.log(usage());
    return;
  }

  const exportPath = readOption(args, "--export");
  if (!exportPath) {
    throw new Error("Missing required --export <file>.");
  }
  const format = readOption(args, "--format", "markdown").toLowerCase();
  const outPath = readOption(args, "--out");
  const maxExamples = Number.parseInt(readOption(args, "--max-examples", String(DEFAULT_MAX_EXAMPLES)), 10);

  if (!["markdown", "json"].includes(format)) {
    throw new Error("--format must be markdown or json.");
  }

  const content = await fs.readFile(exportPath, "utf8");
  const lines = content.split(/\r?\n/);
  const report = {
    source: path.basename(exportPath),
    generated_at: new Date().toISOString(),
    metadata: parseHeader(lines),
    signals: scan(lines, Number.isFinite(maxExamples) ? maxExamples : DEFAULT_MAX_EXAMPLES)
  };

  const rendered = format === "json" ? JSON.stringify(report, null, 2) + "\n" : renderMarkdown(report);
  if (outPath) {
    await fs.writeFile(outPath, rendered, "utf8");
  } else {
    process.stdout.write(rendered);
  }
}

main().catch((error) => {
  console.error(`apex-export-risk-scan: ${error.message}`);
  process.exit(1);
});
