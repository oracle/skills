---
templateId: buttons.index
component: button
dependsOn:
  - buttons.common
version: 1.0
description: Entry point and intent router for button templates.
---

## Purpose
Use this index as the canonical dispatcher for button templates. Load `buttons._common.md` first, then load exactly one primary action variant template.

## Intent Router (Minimal Load)
- Submit button (`submitPage`, save/create/update/delete): `@/buttons/buttons.submit.md`
- Redirect in same app (`redirectThisApp`): `@/buttons/buttons.redirect-this-app.md`
- Redirect to another app (`redirectOtherApp`): `@/buttons/buttons.redirect-other-app.md`
- Button controlled by dynamic action (`definedByDynamicAction`): `@/buttons/buttons.defined-by-da.md`
- Trigger action button (`triggerAction`): `@/buttons/buttons.trigger-action.md`
- Menu button with entries (`menu`): `@/buttons/buttons.menu.md`

## Overlay Templates (Load only when asked)
- Confirmation emphasis/custom wording: `@/buttons/buttons.confirmation.md`
- Server-side condition specifics: `@/buttons/buttons.server-side-condition.md`
- Icon and appearance refinement: `@/buttons/buttons.appearance-icon.md`

## Rules
- Do not load all button variants for a single request.
- Choose one primary action variant first; overlays are optional and additive.
- Keep all generated button attributes consistent with `references/policies/memory-bank/40-components/apex.buttons.md` and `assets/component-policies.json`.
