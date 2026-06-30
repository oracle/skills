---
templateId: buttons.appearance-icon
componentType: button
version: 1.0
description: Optional icon and appearance overlay for icon-capable button templates.
---

## Use When
- User requests icon-based appearance or primary/disabled styling.

## Block
```apexlang
appearance {
  buttonTemplate: {{appearance.buttonTemplate}}
  hot: {{appearance.hot}}
  showAsDisabled: {{appearance.showAsDisabled}}
  templateOptions: [
    {{appearance.templateOptions}}
  ]
  icon: {{appearance.icon}}
}
```

## Notes
- Primary button wording in prompts maps to `hot: true` in emitted DSL.
- Use icon only with `@/text-with-icon` or `@/icon`.
- For `@/text-with-icon` with `icon`, include exactly one icon-position option: default to `t-Button--iconLeft`, or use `t-Button--iconRight` only when explicitly requested.
- For `@/icon`, do not include `t-Button--iconLeft` or `t-Button--iconRight`.
- Use canonical emitted button templateOptions values such as `t-Button--iconLeft` and `t-Button--hoverIconPush`, not aliases/static_ids such as `left` or `push`.
