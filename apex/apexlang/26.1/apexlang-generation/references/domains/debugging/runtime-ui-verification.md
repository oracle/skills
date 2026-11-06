# Runtime UI Verification

Use this path when validate/import succeeded but the reported defect is still visible in the running app.

## Use When
- The page loads but the surrounding navigation state is wrong.
- A deep link opens the target page but not the expected level-2 or level-3 current state.
- Runtime content is missing, hidden, out of order, or rendered in the wrong region.
- Keyboard focus, selected state, or expand/collapse behavior is incorrect.
- The issue is responsive or layout-related and must be verified in the running app.

## Do Not Use When
- The failure is still a direct `apex validate` or `apex import` error.
- The issue is Builder transport, auth, ORDS, or JWT behavior.
- The task is non-structural skinning verification rather than runtime behavior debugging.

## Evidence Order
1. Use Chrome DevTools MCP text snapshots first.
2. If Chrome DevTools MCP is unavailable, use the inferred runtime page URL plus HTTP/HTML capture from the runtime verifier.
3. Use DOM or JavaScript inspection second to confirm current-state classes, `aria-expanded`, `aria-current`, focus target, or region presence.
4. Use screenshots only when the text snapshot is insufficient for the visible symptom.

## Verification Loop
1. Open the runtime page that reproduces the issue.
2. Capture a text snapshot, or use the recorded HTTP/HTML artifact when MCP is unavailable.
3. Record the visible symptom in user-facing terms.
4. Inspect the nearest runtime state:
   - navigation tree expansion and current item
   - `aria-current`, `aria-expanded`, and selected classes
   - visible headings, cards, lists, tabs, or regions
   - focus target after load or interaction
5. Interact only as needed:
   - click the relevant nav parent or control
   - navigate to the deep link
   - trigger the tab, menu, drawer, or disclosure state
6. Capture a second text snapshot after the interaction.
7. Map the observed runtime behavior to the owning layer before proposing a fix.
8. Re-run the same runtime check after the fix.

## Standard Symptoms To Catch
- Level-2 or level-3 navigation entries do not expand for the active page.
- The current page is not marked selected or current.
- A restored shared-component structure imports successfully but runtime behavior stays flat.
- Content exists in metadata but is not visible in the intended region, order, or pattern block.
- Keyboard focus lands on the wrong element after page load or interaction.
- Responsive layout behavior hides, collapses, or reorders the wrong content.

## Owning-Layer Hints
- Shared navigation/list issue: shared components and runtime navigation state.
- Wrong page composition or region placement: page composition and template usage.
- Current-state or expand/collapse mismatch after otherwise correct metadata: runtime rendering or list current-state configuration.
- Focus or keyboard issue with correct structure: runtime rendering, accessibility behavior, or Builder/runtime widget layer.

## Response Shape
- Runtime page tested
- User-visible symptom
- Snapshot evidence
- DOM or runtime state observed
- Likely owning layer
- Smallest re-check after the fix
