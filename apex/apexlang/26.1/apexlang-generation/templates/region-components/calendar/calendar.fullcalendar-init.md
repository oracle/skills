---
templateId: region.calendar.fullcalendar-init
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar customizing FullCalendar initialization options.
---

# Purpose

Capture patterns where the calendar’s `initJavaScriptFunction` overrides FullCalendar
options.

---

# Applicability

- Calendar requires non-default FullCalendar configuration (custom title
  format, slot duration, week numbers, keyboard behavior, etc.).
- No additional server-side logic beyond standard SQL; modifications are in
  JavaScript.

---

# Output Template – Snippet

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: calendar
  source { /* standard SQL selecting TITLE, START_DATE, END_DATE, CSS_CLASS */ }
  appearance {
    template: @/standard
    templateOptions: [#DEFAULT# t-Region--noPadding t-Region--hideHeader js-addHiddenHeadingRoleDesc t-Region--hiddenOverflow]
  }
  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    additionalCalendarViews: list
    cssClass: CSS_CLASS
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.titleFormat            = function (pDate) { return "Conference Schedule"; };
        pOptions.slotMinTime            = "07:00:00";
        pOptions.slotMaxTime            = "21:00:00";
        pOptions.dayHeaderFormat        = { weekday: 'short', month: 'numeric', day: 'numeric' };
        pOptions.slotDuration           = "00:15:00";
        pOptions.weekNumbers            = true;
        pOptions.weekText               = "CW";
        pOptions.weekNumberCalculation  = "ISO";
        pOptions.displayEventTime       = true;
        pOptions.displayEventEnd        = false;
        pOptions.disableKeyboardSupport = true;
        pOptions.windowResize           = null;
        return pOptions;
      }
      ```
  }
)
```

---

# Guardrails

- Document all overridden properties; oppose ad-hoc adjustments without
  referencing FullCalendar docs.
- Keep initialization idempotent—avoid mutating global state or relying on
  DOM elements outside the region.
- Ensure any altered accessibility features (e.g., disabling keyboard support)
  have compensating UX justifications.
