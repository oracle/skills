---
templateId: region.calendar.custom-drag-drop-handlers
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Calendar with custom drag/drop events and messaging hooks.
---

# Purpose

Capture advanced drag-and-drop handling where custom client events drive user
feedback while staying within the shared calendar contract in this folder.

---

# Applicability

- Calendar enables drag/drop with server-side persistence and reacts to
  FullCalendar’s custom events (`apexcalendardragdropstart`, `finish`, `error`).
- Dynamic actions provide success/error messages during drag operations.

---

# Output Template – Calendar Block

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: calendar

  source {
    location: localDatabase
    type: sqlQuery
    sqlQuery:
      ```sql
      select
         id,
         case when speaker is not null then
           title || ' (' || speaker || ')'
           else title
         end as title,
         speaker,
         start_date,
         end_date,
         case
            when status = 'INACTIVE'    then 'apex-cal-gray'
            when session_type = 'BREAK' then 'apex-cal-silver'
            when session_type = 'BUSINESS' then 'apex-cal-orange'
            when session_type = 'GENERAL'  then 'apex-cal-blue'
            when session_type = 'TECHNICAL' then 'apex-cal-green'
            when session_type = 'HANDS_ON'  then 'apex-cal-lime'
         end as css_class
      from eba_demo_cal_sessions
      where status = 'ACTIVE'
      ```
  }

  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }

  appearance {
    template: @/standard
    templateOptions: [
      #DEFAULT#
      t-Region--noPadding
      t-Region--hideHeader js-addHiddenHeadingRoleDesc
      t-Region--hiddenOverflow
    ]
  }

  settings {
    displayColumn: TITLE
    startDateColumn: START_DATE
    endDateColumn: END_DATE
    pkColumn: ID
    additionalCalendarViews: [
      list
      navigation
    ]
    dragAndDrop: true
    dragAndDropPlsqlCode:
      ```plsql
      declare
        l_title eba_demo_cal_sessions.title%type;
        l_start varchar2(30);
      begin
        update eba_demo_cal_sessions
           set start_date = to_date(:APEX$NEW_START_DATE, 'YYYYMMDDHH24MISS'),
               end_date   = to_date(:APEX$NEW_END_DATE,   'YYYYMMDDHH24MISS')
         where id = :APEX$PK_VALUE
         returning title,
                  ltrim(to_char(start_date, 'Dy, HH24:MI'))
           into l_title, l_start;
        :P112_DRAGDROP_MSG := '"' || l_title || '": now at ' || l_start || '.';
      end;
      ```
    cssClass: CSS_CLASS
  }

  performance {
    lazyLoading: true
  }

  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      function (pOptions) {
        pOptions.titleFormat            = function () { return "Conference Schedule"; };
        pOptions.slotMinTime            = "07:00:00";
        pOptions.slotMaxTime            = "18:00:00";
        pOptions.dayHeaderFormat        = { weekday: 'short', month: 'numeric', day: 'numeric' };
        pOptions.slotDuration           = "00:15:00";
        pOptions.weekNumbers            = true;
        pOptions.weekText               = "CW";
        pOptions.weekNumberCalculation  = "ISO";
        pOptions.eventStartEditable     = true;
        pOptions.disableKeyboardSupport = true;
        return pOptions;
      }
      ```
  }
)
```

---

# Dynamic Action Pattern

1. **Begin Drag** — Custom event `apexcalendardragdropstart`:
   - `executeJsCode` → show “moving…” message using `this.data` (event metadata).

2. **Finish Drag** — Custom event `apexcalendardragdropfinish`:
   - `setValue` → supply `P112_DRAGDROP_MSG` from PL/SQL global variable.
   - `executeJsCode` → show success message via `apex.message.showPageSuccess`.

3. **Error Handling** (optional) — Custom event `apexcalendardragdroperror`:
   - Show error message using `this.data.errorMessage`.

Ensure hidden items used for messaging (`P112_DRAGDROP_MSG`) have
`valueProtected: false` when updated client-side.

---

# Guardrails

- Prefer packaged APIs for drag/drop persistence when available; replicate the
  `returning ... into` pattern to supply dynamic action messaging without extra
  queries.
- Document all custom events and ensure dynamic actions specify `Selection Type:
  region` pointing to the calendar.
- Review accessibility when disabling keyboard support; provide alternative
  workflows if drag/drop is the only manipulation method.
