---
templateId: map.runtime-api
componentType: template
version: 1.0
description: Runtime JavaScript API for Oracle APEX Maps.
---

# Purpose

Document the runtime JS API exposed by the rendered map region through `apex.region( regionId )`.

This file is a runtime reference only. It is not a declarative APEXlang region template.

---

# Public Region Methods

| Method | Since | Notes |
|--------|-------|-------|
| `refresh()` | 21.2 | Re-fetch layer data. |
| `focus()` | 21.2 | Focus the map canvas. |
| `getLayers()` | 21.2 | Returns the current layer objects without `activePopups`. |
| `getLayerIdByName( name )` | 21.2 | Resolve a layer ID by its current name. |
| `getFeature( layerId, featureId )` | 21.2 | Returns one feature from the target layer. |
| `addFeature( layerId, feature )` | 21.2 | Adds a feature to a non-vector-tile layer. |
| `updateFeature( layerId, feature )` | 21.2 | Updates a feature on a non-vector-tile layer. |
| `removeFeature( layerId, featureId )` | 21.2 | Removes a feature from a non-vector-tile layer. |
| `displayPopup( type, layerId, featureId, focusAfterOpen, lngLat )` | 21.2 | Opens a tooltip or info window. |
| `closeTooltip()` | 21.2 | Closes the current tooltip. |
| `closeInfoWindow( layerId, featureId )` | 21.2 | Closes one info window. |
| `closeAllInfoWindows( layerId? )` | 21.2 | Closes all info windows or all windows on one layer. |
| `getMapBboxAndZoomLevel()` | 21.2 | Returns bbox and zoom. |
| `getMapCenterAndZoomLevel()` | 21.2 | Returns center and zoom. |
| `getMapPitchAndBearing()` | 21.2 | Returns pitch and bearing. |
| `setZoomLevel( zoom )` | 21.2 | Sets the map zoom level. |
| `setCenter( [lng, lat] )` | 21.2 | Re-centers the map and triggers the changed flow. |
| `getMapObject()` | 21.2 | Returns the underlying MapLibre map object. |
| `getCircle()` | 21.2 | Returns the current circle GeoJSON polygon. |
| `clearCircle()` | 21.2 | Clears the current circle. |
| `reset()` | 21.2 | Resets the map instance. |
| `getMapStatus()` | 21.2 | Returns bbox, zoom, pitch, and bearing together. |
| `showLayer( nameOrId )` | 26.1 | Shows a layer by name or ID. |
| `hideLayer( nameOrId )` | 26.1 | Hides a layer by name or ID. |
| `moveLayer( layerId, beforeLayerId? )` | 26.1 | Reorders a layer in the z-stack. |

---

# Events

| jQuery event | Runtime name | Payload |
|-------------|--------------|---------|
| `spatialmapinitialized` | `initialized` | No extra payload. Fires when the map is fully initialized. |
| `spatialmapclick` | `click` | `{ lat, lng }` |
| `spatialmapobjectclick` | `objectclick` | Feature or cluster payload including `id`, `lat`, `lng`, `tooltip`, `infoWindow`, `cluster_id`, `point_count` as applicable. |
| `spatialmapchanged` | `changed` | `{ changeType, layers, bbox, zoom, pitch, bearing, circle }` |

`changed.changeType` can be one of:
- `map-drag`
- `map-zoom`
- `toggle-layer`
- `map-rotate`
- `circle-drawn`
- `circle-removed`
- `feature-added`
- `feature-removed`
- `feature-updated`

---

# Example

```javascript
const mapRegion = apex.region( "R_EMP_MAP" );

mapRegion.refresh();

$( "#R_EMP_MAP" ).on( "spatialmapobjectclick", function( event, data ) {
  if ( data.id ) {
    console.log( "Clicked feature", data.id );
  }
} );

mapRegion.showLayer( "Employees" );
```

---

# Runtime Guardrails

- `getMapObject()` exposes the underlying MapLibre object. Code that depends on MapLibre internals may not be forward compatible.
- `addFeature`, `updateFeature`, and `removeFeature` reject vector-tile layers.
- `displayPopup()` requires explicit `{ lng, lat }` coordinates for non-point geometries because the widget does not calculate popup placement for arbitrary shapes.
- `spatialmapchanged` also fires when the circle tool is used.
- `showLayer`, `hideLayer`, and `moveLayer` are runtime APIs added in 26.1.

---

# Source Anchors

- `images/libraries/apex/widget.spatialMap.js`
- `images/libraries/apex/tests/widget.spatialMap_test.html`
- `images/apex_ui/js/code-editor/types/browser/types.d.ts`
