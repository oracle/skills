# languageMapping

- componentType: `languageMapping`
- identifierRequired: false

## Properties

### translation (direct group)

- `appId` — `<INTEGER>`; —; Yes; —; —; —; —;
- `language` — `<STRING>`; Select the language to be translated.; Yes; —; `<enum:[af, sq, ar-dz, ar-bh, ar-eg, ar-iq, ar-jo, ar-kw, ar-lb, ar-ly, ar-ma, ar-om, ar-qa, ar-sa, ar-sy, ar-tn, ar-ae, ar-ye, ar, hy, as, az, eu, be, bn, ba, bg, km, ca, zh-cn, zh-hk, zh-mo, zh-sg, zh-tw, zh, hr, cs, da, nl-be, nl, en-au, en-bz, en-ca, en-ie, en-jm, en-nz, en-ph, en-za, en-tt, en-gb, en-us, en-zw, en, et, mk, fo, fa, fi, fr-be, fr-ca, fr, fr-lu, fr-mc, fr-ch, gd, gl, de-at, de, de-li, de-lu, de-ch, el, gu, he, hi, hu, is, id, ga, it, it-ch, ja, kn, kk, kok, ko, kz, lv, lt, ms, ml, mt, mr, me, ne, nb-no, no, nn-no, or, pl, pt-br, pt, pa, ro, ru-md, ru, sr-cyrl, sr-latn, sr, sk, sl, es-ar, es-bo, es-cl, es-co, es-cr, es-do, es-ec, es-sv, es-gt, es-hn, es-mx, es-ni, es-pa, es-py, es-pe, es-pr, es, es-us, es-uy, es-ve, sw, sv-fi, sv, ta, te, th, tr, uk, ur, uz, vi, cy]>`; —; —;
- `documentDirection` — `<STRING>`; —; No; —; `<enum:[true:"Yes", false:"No"]>`; —; —;

### advanced

- `imageDirectory` — `<STRING>`; Enter the directory where images will be obtained.  Unless you are using static files from the images directory which are translated, you can leave this field blank.  This is the default and most common option.; No; —; —; maxLength=2000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

