---
templateId: region.calendar.custom-styling
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendars using custom CSS and HTML for event rendering.
---

# Purpose

Document scenarios where calendars rely on custom CSS classes or inline HTML to
modify event visuals. Based on `p00092-week-calendar-with-icons.apx` and
`p00091-week-calendar-conference2.apx`.

---

# Applicability

- Calendar titles contain HTML fragments (icons, markup) and require
  `escapeSpecialChars: false`.
- Page-level CSS defines event classes (`my-cal-*`) for custom visual variants.
- Supplemental info uses substitution strings for tooltips.

---

# Output Template – HTML Icons Variant

```apexlang
region {{regionStaticIdIcons}} (
  name: {{name}} with Icons
  type: calendar
  source {
    location: localDatabase
    type: sqlQuery
    sqlQuery:
      ```sql
      select
         id,
         '<span class="fa fa-' ||
           case
             when status = 'INACTIVE'    then 'times-circle-o'
             when session_type = 'BREAK' then 'coffee'
             when session_type = 'BUSINESS' then 'money'
             when session_type = 'GENERAL'  then 'users'
             when session_type = 'TECHNICAL' then 'wrench'
             when session_type = 'HANDS_ON' then 'laptop'
             else 'apex'
           end || ' fc fc-title" style="float: left;"></span>&nbsp;' ||
           apex_escape.html(title) as title,
         apex_escape.html(speaker) as speaker,
         start_date,
         end_date,
         case
            when status = 'INACTIVE'    then 'apex-cal-gray'
            when session_type = 'BREAK' then 'apex-cal-silver'
            when session_type = 'BUSINESS' then 'apex-cal-orange'
            when session_type = 'GENERAL'  then 'apex-cal-blue'
            when session_type = 'TECHNICAL' then 'apex-cal-green'
            when session_type = 'HANDS_ON' then 'apex-cal-lime'
         end as css_class
      from eba_demo_cal_sessions
      ```
  }
  appearance {
    template: @/standard
    templateOptions: [#DEFAULT# t-Region--noPadding t-Region--hideHeader js-addHiddenHeadingRoleDesc t-Region--scrollBody]
  }
  security {
    escapeSpecialChars: false
  }
  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    supplementalInfo: &SPEAKER.
    additionalCalendarViews: [list navigation]
    cssClass: CSS_CLASS
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.slotMinTime  = "07:00:00";
        pOptions.slotMaxTime  = "18:00:00";
        pOptions.slotDuration = "00:15:00";
        return pOptions;
      }
      ```
  }
)
```

---

# Output Template – Custom CSS Variant

Note: This custom CSS snippet is illustrative; the current grammar-backed emitted calendar contract does not expose a region-level `css {}` block.

```text
region {{regionStaticIdCss}} (
  name: {{name}} Custom Styling
  type: calendar
  source { /* SQL projecting CSS_CLASS with custom names (my-cal-*) */ }
  appearance {
    template: @/standard
    templateOptions: [#DEFAULT# t-Region--noPadding t-Region--hideHeader js-addHiddenHeadingRoleDesc t-Region--hiddenOverflow]
  }
  css {
    inline:
      ```css
      .fc-event.my-cal-blue {
        background-color: lightblue;
        border: 0.5pt solid black;
        opacity: 0.7;
      }
      .fc-event.my-cal-blue .fc-event-title {
        color: darkblue;
        font-weight: bold;
      }
      ```
  }
  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    additionalCalendarViews: [list navigation]
    cssClass: CSS_CLASS
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.slotMinTime  = "07:00:00";
        pOptions.slotMaxTime  = "18:00:00";
        pOptions.slotDuration = "00:15:00";
        return pOptions;
      }
      ```
  }
)
```

---

# Guardrails

- Always sanitize dynamic text with `APEX_ESCAPE` before concatenating HTML.
- Document inline CSS placement; follow page policy (CSS block after nav).
- Limit custom classes to approved prefixes and ensure accessibility (contrast,
  icon descriptions).
