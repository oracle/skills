---
templateId: region.calendar.weekly-drag-drop
componentType: region
version: 1.0
imports:
  - calendar._common.md
description: Weekly calendar with drag & drop rescheduling.
---

# Purpose

Capture drag-and-drop rescheduling patterns for time-based calendars using the
shared calendar contract in this folder.

---

# Applicability

- Week/day/list navigation with time slots.
- Drag & drop enabled to adjust start/end timestamps.
- Optional show-inactive toggle submitted as bind variable.

---

# Output Template – Full

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
      where status = 'ACTIVE' or :{{showInactiveItem}} = 'Y'
      ```
    pageItemsToSubmit: {{pageItemsToSubmit}}
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
      begin
        update eba_demo_cal_sessions
           set start_date = to_date(:APEX$NEW_START_DATE, 'YYYYMMDDHH24MISS'),
               end_date   = to_date(:APEX$NEW_END_DATE,   'YYYYMMDDHH24MISS')
         where id = :APEX$PK_VALUE;
      end;
      ```
    createLink: {
      page: 301
      items: {
        P301_START_DATE: &APEX$NEW_START_DATE.
      }
    }
    cssClass: CSS_CLASS
  }

  performance {
    lazyLoading: true
  }
)
```

---

# Required Variables

- `showInactiveItem`: Toggle item (e.g., `P34_SHOW_INACTIVE`).
- `pageItemsToSubmit`: Include all bind items used in the SQL.
- `layout.sequence` / `layout.slot` per page layout.

---

# Guardrails

- Replace the inline `update` with an `invokeApi` process package when one
  exists; this template demonstrates the SQL structure but workflows should
  prefer packaged APIs.
- Calendar create flows may prefill the target start item with
  `&APEX$NEW_START_DATE.` in `createLink.items`. Keep that substitution
  separate from the drag/drop persistence bind variables used above.
- Document supporting dynamic actions (refresh on toggle, dialog close) in the
  page definition.
- Ensure drag-and-drop permissions align with authorization schemes or read-only
  mode.
