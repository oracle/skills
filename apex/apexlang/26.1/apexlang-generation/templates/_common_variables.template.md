# Component Common Variables
Canonical lookup for shared attributes. Replace bracketed placeholders and catalog entries with component-specific details.

## Gospel Skeleton
```apexlang
[component] [staticId] (
    name: [name]
    -- add component sections here
)
```

### Placeholders
- `[staticId]` — unique identifier guidance.
- `[name]` — primary label guidance.
- Add bullets for each placeholder defined in the skeleton.

## Sections
- Document recurring sections (e.g., `serverCache`, `error`, `comments`).
- Briefly explain when to include or omit each section.

## Attribute Catalog
- `attribute.path` — required/optional notes, accepted values, dependencies.
- Repeat for each attribute relevant to the component type.

## Usage Notes
- Add cross-cutting rules (e.g., formatting, quoting, caching behavior).
- Clarify expectations like triple backticks, button alias references, etc.
