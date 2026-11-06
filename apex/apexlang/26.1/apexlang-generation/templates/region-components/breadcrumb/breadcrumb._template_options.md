# Breadcrumb Template Options

Use only values proven by live compiler/theme metadata for the active build.
Example: `templateOptions: #DEFAULT#`
`#DEFAULT#` remains a standalone entry when used. Do not concatenate it with another token, and do not substitute the emitted CSS class string for the documented accepted value.

## Title Bar (`title-bar`)
Default emitted value: `#DEFAULT#`

- Show Breadcrumbs | `static_id=show-breadcrumbs` | `css=t-BreadcrumbRegion--showBreadcrumb` | `group=--`
- Use Compact Style | `static_id=use-compact-style` | `css=t-BreadcrumbRegion--compactTitle` | `group=--`
- Alternative | `static_id=alternative` | `css=t-BreadcrumbRegion--headingFontAlt` | `group=Heading Font`
- Use Region Title | `static_id=use-region-title` | `css=t-BreadcrumbRegion--useRegionTitle` | `group=Region Title`
