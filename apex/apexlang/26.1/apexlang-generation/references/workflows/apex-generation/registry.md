# Component Registry Excerpts — APEX Developer

| Keyword | Component | Notes |
|---------|-----------|-------|
| `interactive report` | interactive-report | Loads IR template & SQL rules |
| `form` | form | Modal CRUD or page form |
| `dashboard` | dashboard | Cards/KPI layout |
| `chart` | chart-* | Chart variants via templates |
| `calendar` | calendar | Date column and primary key column required |
| `map` | map | Lat/Long or geocode |
| `lov` | lov-shared / lov-sql | Shared or SQL LOV definitions |
| `dynamic action` | dynamic-action-* | Refresh/report invocation |

Refer to `assets/apex-generation/components.registry.json` for full list and synonyms.

## Ownership routing

Component `routing` metadata resolves ownership before profile and template selection:

1. `selectorGroups`: explicit component or host-region selectors.
2. `competingSignals`: named competing components, ordered by `competingOrder`.
3. `aliases`: direct component names.
4. `fallbackSelectorGroups`: generic template wording that must yield to explicit names.
5. `semanticFallback`, then generic component scoring.

Both selector fields map owner names to phrase arrays; `direct` means the declaring component's owner. Both use phrase scores plus `selectorWeights`, then `precedence` and owner name for ties. Missing groups are empty. Put generic wording that can overlap a component alias in `fallbackSelectorGroups`; retain explicit component and host-region requests in `selectorGroups`. Document component-specific examples in the owning component guidance.

Keep source adapters, placement requirements, feature signals, and candidate suppression on the same routing descriptor. The selected owner drives the existing profile, rule, and template projections. Package assembly copies this registry and the shared resolver; do not maintain separate packaged routing rules.
