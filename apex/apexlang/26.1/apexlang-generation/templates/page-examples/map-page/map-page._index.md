---
archetypeId: page-examples.map-page
componentType: page
version: 1.0
fallbackExample: ./map-page.example.md
---

# Purpose
Primary routing entrypoint for the map-page page-example family.

# Load Groups
- Page pattern contract: `./map-page._common.md`
- Concrete Markdown example: `./map-page.example.md`
- Region and layer family guidance: [`../../region-components/map/map._index.md`](../../region-components/map/map._index.md)

# Routing Rule
Load this file first. Then:
1. Load `./map-page._common.md` for standard-map-page and faceted-search-map-page routing.
2. Load `./map-page.example.md` for the Markdown-preserved page scaffold that shows the canonical `body` + `initialPositionAndZoom` map structure.
3. Load [`../../region-components/map/map._index.md`](../../region-components/map/map._index.md) when the request needs concrete region, layer, shared-background, or runtime API detail.

Use the standard map-page path when the first child layer owns its own declarative `source { ... }` metadata. Use the faceted-search map-page path when the result region owns the result set but the page still needs the same map-family attribute vocabulary.
