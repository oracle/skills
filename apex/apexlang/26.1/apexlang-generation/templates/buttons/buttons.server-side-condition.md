---
templateId: buttons.server-side-condition
componentType: button
version: 1.0
description: Optional server-side condition overlay for button variants.
---

## Use When
- User requests conditional rendering/execution.

## Block
```apexlang
serverSideCondition {
  type: {{serverSideCondition.type}}
  item: {{serverSideCondition.item}}
  {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
}
```

## Notes
- Include only attributes required by the selected condition type.
- Map `comparisonAttribute` to `value` for equality/request checks and to `list` for `itemIsInColonDelimitedList` / `itemIsNotInColonDelimitedList`.
