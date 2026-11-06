---
name: apexlang-example-applications
description: Provides a list of APEXlang example applications with appropriate descriptions and access to the assets. Each example folder contains the complete APEXlang source tree of one real application for use as authoring evidence and composition reference.
---

Each `example-N/` folder in `assets/` is a complete, unedited APEXlang source of one real application. The following list provides a short description of the application available in the corresponding subfolder:
- `example-0` Basic APEXLang template. Not the most minimal version but a good starting point.
- `example-1` Demonstration HR (order management variant): An OEHR-schema order and HR management application. Broad component coverage: 14 interactive reports, 9 form pages with formInitialization/formAutoRowProcessing pairs, 8 JET charts, 8 classic reports, 3 faceted searches paired with cards and classic reports, 2 editable interactive grids (including a master-detail orders/order-items page with its interactiveGridAutoRowProcessing save process), a calendar, and an access-control section with roles, authorization schemes, and PL/SQL validations. Good first reference for the standard report-plus-modal-form pattern and for shared components (LOVs, lists, breadcrumbs).
- `example-2` Demonstration HR (data-loading variant):  A sibling OEHR application with a nearly identical page inventory plus data-load definitions in shared components and a few additional custom pages. Useful as a comparison case: the same business pages composed by a different team, which makes the stable component patterns (form pairs, report-to-form links, faceted search wiring) stand out from app-specific choices.
