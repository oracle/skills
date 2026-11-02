# Static Content Template Options

Use the listed `static_id` as the exact value to pass in the region's `templateOptions`.
Example: `templateOptions: [remove-body-padding, accent-1]`
`#DEFAULT#` remains a standalone entry when used. Composite preset strings stay atomic only when the full combined value is the accepted emitted value.

`Preset` shows the checked-in baseline already emitted by the template itself.

## Alert (`alert`)
Preset: `t-Alert--horizontal:t-Alert--defaultIcons:t-Alert--warning`

- Highlight Background | `static_id=highlight-background` | `css=t-Alert--colorBG` | `group=--`
- Horizontal | `static_id=horizontal` | `css=t-Alert--horizontal` | `group=Alert Display`
- Wizard | `static_id=wizard` | `css=t-Alert--wizard` | `group=Alert Display`
- Hide Icons | `static_id=hide-icons` | `css=t-Alert--noIcon` | `group=Alert Icons`
- Show Custom Icons | `static_id=show-custom-icons` | `css=t-Alert--customIcons` | `group=Alert Icons`
- Show Default Icons | `static_id=show-default-icons` | `css=t-Alert--defaultIcons` | `group=Alert Icons`
- Hidden | `static_id=hidden` | `css=t-Alert--removeHeading js-removeLandmark` | `group=Alert Title`
- Hidden but Accessible | `static_id=hidden-but-accessible` | `css=t-Alert--accessibleHeading` | `group=Alert Title`
- Danger | `static_id=danger` | `css=t-Alert--danger` | `group=Alert Type`
- Information | `static_id=information` | `css=t-Alert--info` | `group=Alert Type`
- Success | `static_id=success` | `css=t-Alert--success` | `group=Alert Type`
- Warning | `static_id=warning` | `css=t-Alert--warning` | `group=Alert Type`

## Blank with Attributes (`blank-with-attributes`)
Preset: none

- none

## Blank with Attributes (No Grid) (`blank-with-attributes-no-grid`)
Preset: none

- none

## Carousel Container (`carousel-container`)
Preset: `t-Region--hideHeader js-addHiddenHeadingRoleDesc:t-Region--hiddenOverflow`

- Remember Carousel Slide | `static_id=remember-carousel-slide` | `css=js-useLocalStorage` | `group=--`
- Remove Body Padding | `static_id=remove-body-padding` | `css=t-Region--noPadding` | `group=--`
- Show Maximize Button | `static_id=show-maximize-button` | `css=js-showMaximizeButton` | `group=--`
- Show Next and Previous Buttons | `static_id=show-next-and-previous-buttons` | `css=t-Region--showCarouselControls` | `group=--`
- Show Region Icon | `static_id=show-region-icon` | `css=t-Region--showIcon` | `group=--`
- Accent 1 | `static_id=accent-1` | `css=t-Region--accent1` | `group=Accent`
- Accent 2 | `static_id=accent-2` | `css=t-Region--accent2` | `group=Accent`
- Accent 3 | `static_id=accent-3` | `css=t-Region--accent3` | `group=Accent`
- Accent 4 | `static_id=accent-4` | `css=t-Region--accent4` | `group=Accent`
- Accent 5 | `static_id=accent-5` | `css=t-Region--accent5` | `group=Accent`
- Slide | `static_id=slide` | `css=t-Region--carouselSlide` | `group=Animation`
- Spin | `static_id=spin` | `css=t-Region--carouselSpin` | `group=Animation`
- 240px | `static_id=240px` | `css=i-h240` | `group=Body Height`
- 320px | `static_id=320px` | `css=i-h320` | `group=Body Height`
- 480px | `static_id=480px` | `css=i-h480` | `group=Body Height`
- 640px | `static_id=640px` | `css=i-h640` | `group=Body Height`
- Hide | `static_id=hide` | `css=t-Region--hiddenOverflow` | `group=Body Overflow`
- Scroll | `static_id=scroll` | `css=t-Region--scrollBody` | `group=Body Overflow`
- Hidden | `static_id=hidden` | `css=t-Region--removeHeader js-removeLandmark` | `group=Header`
- Hidden but accessible | `static_id=hidden-but-accessible` | `css=t-Region--hideHeader js-addHiddenHeadingRoleDesc` | `group=Header`
- Remove Borders | `static_id=remove-borders` | `css=t-Region--noBorder` | `group=Style`
- Stack Region | `static_id=stack-region` | `css=t-Region--stacked` | `group=Style`
- 10 Seconds | `static_id=10-seconds` | `css=js-cycle10s` | `group=Timer`
- 15 Seconds | `static_id=15-seconds` | `css=js-cycle15s` | `group=Timer`
- 20 Seconds | `static_id=20-seconds` | `css=js-cycle20s` | `group=Timer`
- 5 Seconds | `static_id=5-seconds` | `css=js-cycle5s` | `group=Timer`

## Content Block (`content-block`)
Preset: `t-ContentBlock--h1`

- Add Body Padding | `static_id=add-body-padding` | `css=t-ContentBlock--padded` | `group=--`
- Show Region Icon | `static_id=show-region-icon` | `css=t-ContentBlock--showIcon` | `group=--`
- Light Background | `static_id=light-background` | `css=t-ContentBlock--lightBG` | `group=Body Style`
- Shadow Background | `static_id=shadow-background` | `css=t-ContentBlock--shadowBG` | `group=Body Style`
- Hidden | `static_id=hidden` | `css=t-Region--removeHeader js-removeLandmark` | `group=Header`
- Hidden but accessible | `static_id=hidden-but-accessible` | `css=t-ContentBlock--hideHeader js-addHiddenHeadingRoleDesc` | `group=Header`
- Alternative | `static_id=alternative` | `css=t-ContentBlock--headingFontAlt` | `group=Heading Font`
- Large | `static_id=large` | `css=t-ContentBlock--h1` | `group=Region Title`
- Medium | `static_id=medium` | `css=t-ContentBlock--h2` | `group=Region Title`
- Small | `static_id=small` | `css=t-ContentBlock--h3` | `group=Region Title`

## Hero (`hero`)
Preset: none

- Remove Body Padding | `static_id=remove-body-padding` | `css=t-HeroRegion--noPadding` | `group=--`
- No | `static_id=no` | `css=t-HeroRegion--hideIcon` | `group=Display Icon`
- Alternative | `static_id=alternative` | `css=t-HeroRegion--headingFontAlt` | `group=Heading Font`
- Circle | `static_id=circle` | `css=t-HeroRegion--iconsCircle` | `group=Icon Shape`
- Square | `static_id=square` | `css=t-HeroRegion--iconsSquare` | `group=Icon Shape`
- Featured | `static_id=featured` | `css=t-HeroRegion--featured` | `group=Style`
- Stacked Featured | `static_id=stacked-featured` | `css=t-HeroRegion--featured t-HeroRegion--centered` | `group=Style`

## Image (`image`)
Preset: `t-ImageRegion--auto:t-ImageRegion--cover:t-ImageRegion--square:t-ImageRegion--noFilter`

- Image Stretch | `static_id=image-stretch` | `css=t-ImageRegion--stretch` | `group=--`
- Blur | `static_id=blur` | `css=t-ImageRegion--blur` | `group=Filter`
- Grayscale | `static_id=grayscale` | `css=t-ImageRegion--grayscale` | `group=Filter`
- Invert | `static_id=invert` | `css=t-ImageRegion--invert` | `group=Filter`
- None | `static_id=none` | `css=t-ImageRegion--noFilter` | `group=Filter`
- Saturate | `static_id=saturate` | `css=t-ImageRegion--saturate` | `group=Filter`
- Sepia | `static_id=sepia` | `css=t-ImageRegion--sepia` | `group=Filter`
- 1:1 (Square) | `static_id=1-1-square` | `css=t-ImageRegion--1x1` | `group=Ratio`
- 16:9 (Widescreen) | `static_id=16-9-widescreen` | `css=t-ImageRegion--16x9` | `group=Ratio`
- 2:1 (Univisium) | `static_id=2-1-univisium` | `css=t-ImageRegion--2x1` | `group=Ratio`
- 4:3 (Standard) | `static_id=4-3-standard` | `css=t-ImageRegion--4x3` | `group=Ratio`
- Auto | `static_id=auto` | `css=t-ImageRegion--auto` | `group=Ratio`
- Contain | `static_id=contain` | `css=t-ImageRegion--contain` | `group=Scale`
- Cover | `static_id=cover` | `css=t-ImageRegion--cover` | `group=Scale`
- Fill | `static_id=fill` | `css=t-ImageRegion--fill` | `group=Scale`
- Scale Down | `static_id=scale-down` | `css=t-ImageRegion--scale-down` | `group=Scale`
- Circle | `static_id=circle` | `css=t-ImageRegion--circle` | `group=Shape`
- Rounded | `static_id=rounded` | `css=t-ImageRegion--rounded` | `group=Shape`
- Square | `static_id=square` | `css=t-ImageRegion--square` | `group=Shape`

## Inline Dialog (`inline-dialog`)
Preset: `js-dialog-size600x400`

- Auto Height | `static_id=auto-height` | `css=js-dialog-autoheight` | `group=--`
- Draggable | `static_id=draggable` | `css=js-draggable` | `group=--`
- Modal | `static_id=modal` | `css=js-modal` | `group=--`
- Remove Body Padding | `static_id=remove-body-padding` | `css=t-DialogRegion--noPadding` | `group=--`
- Resizable | `static_id=resizable` | `css=js-resizable` | `group=--`
- Large (720x480) | `static_id=large-720x480` | `css=js-dialog-size720x480` | `group=Size`
- Medium (600x400) | `static_id=medium-600x400` | `css=js-dialog-size600x400` | `group=Size`
- None | `static_id=none` | `css=js-dialog-nosize` | `group=Size`
- Small (480x320) | `static_id=small-480x320` | `css=js-dialog-size480x320` | `group=Size`

## Inline Drawer (`inline-drawer`)
Preset: `js-dialog-class-t-Drawer--pullOutEnd`

- Modal | `static_id=modal` | `css=js-modal` | `group=--`
- Remove Body Padding | `static_id=remove-body-padding` | `css=t-DialogRegion--noPadding` | `group=--`
- Extra Large | `static_id=extra-large` | `css=js-dialog-class-t-Drawer--xl` | `group=Size`
- Large | `static_id=large` | `css=js-dialog-class-t-Drawer--lg` | `group=Size`
- Medium | `static_id=medium` | `css=js-dialog-class-t-Drawer--md` | `group=Size`
- None (Auto) | `static_id=none-auto` | `css=js-dialog-nosize` | `group=Size`
- Small | `static_id=small` | `css=js-dialog-class-t-Drawer--sm` | `group=Size`
- Bottom | `static_id=bottom` | `css=js-dialog-class-t-Drawer--pullOutBottom` | `group=Position`
- End | `static_id=end` | `css=js-dialog-class-t-Drawer--pullOutEnd` | `group=Position`
- Start | `static_id=start` | `css=js-dialog-class-t-Drawer--pullOutStart` | `group=Position`
- Top | `static_id=top` | `css=js-dialog-class-t-Drawer--pullOutTop` | `group=Position`

## Inline Popup (`inline-popup`)
Preset: `js-dialog-size600x400`

- Auto Height | `static_id=auto-height` | `css=js-dialog-autoheight` | `group=--`
- Display Popup Callout | `static_id=display-popup-callout` | `css=js-popup-callout` | `group=--`
- Remove Body Padding | `static_id=remove-body-padding` | `css=t-DialogRegion--noPadding` | `group=--`
- Remove Page Overlay | `static_id=remove-page-overlay` | `css=js-popup-noOverlay` | `group=--`
- Above | `static_id=above` | `css=js-popup-pos-above` | `group=Callout Position`
- After | `static_id=after` | `css=js-popup-pos-after` | `group=Callout Position`
- Before | `static_id=before` | `css=js-popup-pos-before` | `group=Callout Position`
- Below | `static_id=below` | `css=js-popup-pos-below` | `group=Callout Position`
- Inside | `static_id=inside` | `css=js-popup-pos-inside` | `group=Callout Position`
- Large (720x480) | `static_id=large-720x480` | `css=js-dialog-size720x480` | `group=Size`
- Medium (600x400) | `static_id=medium-600x400` | `css=js-dialog-size600x400` | `group=Size`
- None | `static_id=none` | `css=js-dialog-nosize` | `group=Size`
- Small (480x320) | `static_id=small-480x320` | `css=js-dialog-size480x320` | `group=Size`

## Login (`login`)
Preset: none

- Hidden | `static_id=hidden` | `css=t-Login-region--headerHidden js-removeLandmark` | `group=Login Header`
- Icon | `static_id=icon` | `css=t-Login-region--headerIcon` | `group=Login Header`
- Title | `static_id=title` | `css=t-Login-region--headerTitle js-removeLandmark` | `group=Login Header`

## Search Results Container (`search-results-container`)
Preset: none

- Apply Theme Colors | `static_id=apply-theme-colors` | `css=u-colors` | `group=--`
- Large | `static_id=large` | `css=t-ResultsRegion--iconLg` | `group=Icon Size`
- Medium | `static_id=medium` | `css=t-ResultsRegion--iconMd` | `group=Icon Size`
- Small | `static_id=small` | `css=t-ResultsRegion--iconSm` | `group=Icon Size`
- Boxed | `static_id=boxed` | `css=t-ResultsRegion--boxed` | `group=Result Appearance`
- Flat | `static_id=flat` | `css=t-ResultsRegion--flat` | `group=Result Appearance`

## Standard (`standard`)
Preset: `t-Region--scrollBody`

- Remove Body Padding | `static_id=remove-body-padding` | `css=t-Region--noPadding` | `group=--`
- Show Maximize Button | `static_id=show-maximize-button` | `css=js-showMaximizeButton` | `group=--`
- Show Region Icon | `static_id=show-region-icon` | `css=t-Region--showIcon` | `group=--`
- Accent 1 | `static_id=accent-1` | `css=t-Region--accent1` | `group=Accent`
- Accent 10 | `static_id=accent-10` | `css=t-Region--accent10` | `group=Accent`
- Accent 11 | `static_id=accent-11` | `css=t-Region--accent11` | `group=Accent`
- Accent 12 | `static_id=accent-12` | `css=t-Region--accent12` | `group=Accent`
- Accent 13 | `static_id=accent-13` | `css=t-Region--accent13` | `group=Accent`
- Accent 14 | `static_id=accent-14` | `css=t-Region--accent14` | `group=Accent`
- Accent 15 | `static_id=accent-15` | `css=t-Region--accent15` | `group=Accent`
- Accent 2 | `static_id=accent-2` | `css=t-Region--accent2` | `group=Accent`
- Accent 3 | `static_id=accent-3` | `css=t-Region--accent3` | `group=Accent`
- Accent 4 | `static_id=accent-4` | `css=t-Region--accent4` | `group=Accent`
- Accent 5 | `static_id=accent-5` | `css=t-Region--accent5` | `group=Accent`
- Accent 6 | `static_id=accent-6` | `css=t-Region--accent6` | `group=Accent`
- Accent 7 | `static_id=accent-7` | `css=t-Region--accent7` | `group=Accent`
- Accent 8 | `static_id=accent-8` | `css=t-Region--accent8` | `group=Accent`
- Accent 9 | `static_id=accent-9` | `css=t-Region--accent9` | `group=Accent`
- 240px | `static_id=240px` | `css=i-h240` | `group=Body Height`
- 320px | `static_id=320px` | `css=i-h320` | `group=Body Height`
- 480px | `static_id=480px` | `css=i-h480` | `group=Body Height`
- 640px | `static_id=640px` | `css=i-h640` | `group=Body Height`
- Hide | `static_id=hide` | `css=t-Region--hiddenOverflow` | `group=Body Overflow`
- Scroll - Default | `static_id=scroll-default` | `css=t-Region--scrollBody` | `group=Body Overflow`
- Visible | `static_id=visible` | `css=t-Region--visibleOverflow` | `group=Body Overflow`
- Hidden | `static_id=hidden` | `css=t-Region--removeHeader js-removeLandmark` | `group=Header`
- Hidden but accessible | `static_id=hidden-but-accessible` | `css=t-Region--hideHeader js-addHiddenHeadingRoleDesc` | `group=Header`
- Remove Borders | `static_id=remove-borders` | `css=t-Region--noBorder` | `group=Style`
- Remove UI Decoration | `static_id=remove-ui-decoration` | `css=t-Region--noUI` | `group=Style`
- Stack Region | `static_id=stack-region` | `css=t-Region--stacked` | `group=Style`
- Text Content | `static_id=text-content` | `css=t-Region--textContent` | `group=Style`

## Tabs Container (`tabs-container`)
Preset: `t-TabsRegion-mod--simple`

- Remember Active Tab | `static_id=remember-active-tab` | `css=js-useLocalStorage` | `group=--`
- Fill Tab Labels | `static_id=fill-tab-labels` | `css=t-TabsRegion-mod--fillLabels` | `group=Layout`
- Pill | `static_id=pill` | `css=t-TabsRegion-mod--pill` | `group=Tabs Style`
- Simple | `static_id=simple` | `css=t-TabsRegion-mod--simple` | `group=Tabs Style`
- Above Label | `static_id=above-label` | `css=t-Tabs--iconsAbove` | `group=Tabs Icon`
- Inline with Label | `static_id=inline-with-label` | `css=t-Tabs--inlineIcons` | `group=Tabs Icon`
- Large | `static_id=large` | `css=t-TabsRegion-mod--large` | `group=Tabs Size`
- Small | `static_id=small` | `css=t-TabsRegion-mod--small` | `group=Tabs Size`

## Wizard Container (`wizard-container`)
Preset: `t-Wizard--hideStepsXSmall`

- Show Title | `static_id=show-title` | `css=t-Wizard--showTitle` | `group=--`
- Small Screens (Tablet) | `static_id=small-screens-tablet` | `css=t-Wizard--hideStepsSmall` | `group=Hide Steps For`
- X Small Screens (Mobile) | `static_id=x-small-screens-mobile` | `css=t-Wizard--hideStepsXSmall` | `group=Hide Steps For`
