---

/*
  Chart Feature: Declarative Font Formatting
  Highlights
  - Uses declarative label formatting to adjust font family, size, and color.
  - Keeps axis metadata on the canonical contract while formatting data labels without custom JS.
*/

label FEATURE_FONT_LABEL (
  show: true
  position: insideBarEdge
  fontSize: 18
  fontFamily: "Times New Roman"
  fontColor: #0B3D91
)

axis FEATURE_FONT_AXIS_Y (
  name: y
  title: Sales
  value {
    format: decimal
    decimalPlaces: 0
    formatScaling: none
  }
  majorTicks {
    show: true
  }
)
