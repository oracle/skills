# Compiler Prop Map

Bundled compiler-truth lookup helper for APEXlang property debugging.

## Contents

- `tools/query-valid-props.mjs`
- `tools/query-valid-props-template-components.mjs`
- `templates/template-components/template-component-profiles.json`
- `tools/compiler-truth-audit.mjs`

## Authority

1. Compiler metadata from the active SQLcl or Oracle runtime and direct compiler validation
2. Exact-match templates and examples that already match the same component family and variant
3. Repository machine-readable fallback guidance such as `assets/component-attributes.json`

## Use When

- A property is rejected by the compiler or APEX validate/import.
- A component family has multiple compiler variants and you need the exact property surface.
- You need build-pinned conditional property truth rather than curated guidance.

## Packaged Usage

```bash
node tools/query-valid-props.mjs --help
node tools/query-valid-props.mjs --component column --parent region --list
node tools/query-valid-props.mjs --component region --group source --when 94=NATIVE_IR --when 957=LOCAL --when 959=TABLE
node tools/query-valid-props.mjs --compiler-oracle-home /path/to/oracle.sql-developer-26.1.2 --component column --parent region --list
node tools/query-valid-props.mjs --template-component metricCard
node tools/compiler-truth-audit.mjs --app-path applications/my-app --verify-component-attributes
```

## Runtime Contract

- This lookup surface reads Oracle's shipped `apexlang_meta_data.json` directly from a discoverable VS Code extension, dbtools home, SQLcl home, or compiler jar.
- Universal Theme template-component family settings are bundled from the distilled `templates/template-components/template-component-profiles.json` catalog.
- No checked-in compiler prop-map snapshot is shipped in the public package.
- The helper normalizes metadata in memory for each run so results stay tied to the active runtime.
- The audit command writes machine-readable compiler-truth evidence and blocks generation workflows when the active runtime metadata or curated component policy provenance is stale.
- The audit command writes machine-readable compiler-truth evidence and blocks generation workflows when the active runtime metadata or curated component policy provenance is stale.
