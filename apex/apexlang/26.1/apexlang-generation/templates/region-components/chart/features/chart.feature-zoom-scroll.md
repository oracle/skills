---

/*
  Chart Feature: Zoom and Scroll Behavior
  Highlights
  - Enables zoom and scroll with delayed redraw for smoother UX.
  - Shows overview pane to provide context while zoomed.
*/

chart FEATURE_ZOOM_SCROLL (
  type: line
)

chartLayout {
  height: 400
}

settings {
  zoomAndScroll: delayed
  initialZooming: first
}

overview {
  show: true
}

dataCursor {
  cursor: true
  behavior: smooth
}
