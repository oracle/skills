# Button Prompts

## Purpose
Standard prompts to gather inputs for button generation and batch updates.

## Prompts
- "Create a primary submit button with confirmation and DML action".
- "Add a disabled primary button that triggers downloadable SQL".
- "Generate a button menu with redirect and PL/SQL execution entries".
- "Replicate this redirect button across pages 5, 10, 12".

## Checklist
- Identify action type (submitPage, redirect*, triggerAction, menu).
- Capture layout (region, slot, sequence) per target.
- Capture appearance intent (primary, disabled, icon) and map primary styling to `hot: true` in DSL output.
- Capture behavior specifics (target, databaseAction, confirmation message/style).
- Note server-side conditions, security schemes, itemsToSubmit/Return.
