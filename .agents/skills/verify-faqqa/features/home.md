# Home page shell

`/` renders the Arabic RTL site shell: header, skip link, main region, and footer. The page body is still the create-next-app placeholder.

## Sub-features

- `home-render` returns 200 HTML for `/`.
- `home-rtl` sets `<html lang="ar" dir="rtl">`.
- `home-title` puts `فقّاع | رادار الفقع الذكي` in the title.
- `home-skip` offers a skip link to `#main`.

## How to get to it (user POV)

- Open the site root in a browser.

## Driving it with verify-faqqa

Preconditions:

- Baseline preconditions from README.md.

- **Render.** Request the root. Run `$V drive home`. `status200`, `htmlLangAr`, `rtl`, `titleHasBrand`, and `skipLink` are all true, and `home.html` is saved.

## Gotchas

- The first request compiles `/` (about 2 s). Later ones are fast.
- Google Fonts cannot be fetched offline. Next falls back silently, so do not judge typography from this drive.
- There is no browser screenshot. The Playwright MCP was unavailable when this skill was built, so judge visual changes in a real browser.
