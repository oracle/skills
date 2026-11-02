---
templateId: region.calendar.schedule-builder
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Dual calendar schedule builder with client-side coordination.
---

# Purpose

Document dual-calendar layouts where users copy events between calendars and
augment schedules with client-side logic.

---

# Applicability

- Two calendar regions (“Sessions” vs. “My Sessions”) sharing similar SQL.
- Time-grid views with restricted visible hours and custom FullCalendar setup.
- Requires supporting dynamic actions to copy/delete events via client-side API
  and persist to the database.

---

# Output Template – Calendar Blocks

```apexlang
region {{sessionsRegionId}} (
  name: Sessions
  type: calendar
  source { /* session catalog SQL */ }
  layout {
    sequence: {{sessionsSequence}}
    slot: BODY
    startNewRow: false
  }
  appearance {
    template: @/standard
    templateOptions: [
      #DEFAULT#
      t-Region--noPadding
      js-showMaximizeButton
      t-Region--hideHeader js-addHiddenHeadingRoleDesc
      t-Region--noBorder
      t-Region--scrollBody
    ]
  }
  advanced {
    htmlDomId: session_calendar
    regionDisplaySelector: true
  }
  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    timeFormat: 24Hour
    firstHour: 7
    additionalCalendarViews: navigation
    showWeekend: false
    cssClass: CSS_CLASS
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.titleFormat     = function () { return "Conference Sessions"; };
        pOptions.slotMinTime     = "08:00:00";
        pOptions.slotMaxTime     = "18:00:00";
        pOptions.dayHeaderFormat = { weekday: 'short', month: 'numeric', day: 'numeric' };
        pOptions.slotDuration    = "00:15:00";
        return pOptions;
      }
      ```
  }
)

region {{mySessionsRegionId}} (
  name: My Sessions
  type: calendar
  source { /* user-specific schedule SQL */ }
  layout {
    sequence: {{mySessionsSequence}}
    slot: BODY
  }
  appearance {
    template: @/standard
    templateOptions: [
      #DEFAULT#
      t-Region--noPadding
      js-showMaximizeButton
      t-Region--hideHeader js-addHiddenHeadingRoleDesc
      t-Region--noBorder
      t-Region--scrollBody
    ]
  }
  advanced {
    htmlDomId: my_session_calendar
    regionDisplaySelector: true
  }
  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    timeFormat: 24Hour
    firstHour: 7
    supplementalInfo: &ABSTRACT.
    additionalCalendarViews: list
    showWeekend: false
    cssClass: CSS_CLASS
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.titleFormat     = function () { return "My Schedule"; };
        pOptions.slotMinTime     = "08:00:00";
        pOptions.slotMaxTime     = "18:00:00";
        pOptions.dayHeaderFormat = { weekday: 'short', month: 'numeric', day: 'numeric' };
        pOptions.slotDuration    = "00:15:00";
        return pOptions;
      }
      ```
  }
)
```

---

# Supporting Patterns

- JavaScript helpers (page-level) format timestamps (`formatYYYYMMDDhhmmss`).
- Dynamic actions handle button clicks to copy/delete events via FullCalendar
  API (`calendar.addEvent`, `event.remove`).
- Server-side processes persist changes (insert/delete) using selected event
  metadata.

---

# Guardrails

- Keep UT template options consistent (`js-showMaximizeButton` only when UX
  requires). Remove custom classes unless documented.
- Ensure both calendars share consistent slot duration and visible hours to
  avoid misaligned drag/drop behavior.
- Persist copied events immediately or provide explicit “Save” actions;
  document the chosen approach.
