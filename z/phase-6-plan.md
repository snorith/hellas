# Phase 6 — CSS

Goal: reproduce the legacy HELLAS look (marble paper, greek-meander dividers,
gold/aluminum foil resource tiles, Caesar Dressing display font, red-marble
fate dots) in a single plain-CSS file with native nesting. The Tailwind utility
soup and PostCSS pipeline are gone; every class the new templates reference is
defined here.

## Decisions

- **Single committed look in both core themes**: the sheets paint their own
  light marble background, so ink color, field backgrounds, selects/options and
  links are set explicitly inside `.application.hellas` — dark mode cannot
  produce light-on-light text. (This is the "deliberately commits to a single
  look" path; core theme variables are still used where they're additive, e.g.
  `--color-shadow-primary` for link hover.)
- Fonts kept as the legacy Google Fonts imports (Roboto + Caesar Dressing).
  Bundling the fonts locally is a possible follow-up, noted for review.
- Tab visibility relies on core AppV2 `.tab`/`.active` handling; per the
  conversion guide, no `display` is set on tab containers (the two-column grids
  live INSIDE tab sections).
- Item tooltips render inside core `#tooltip`/`.locked-tooltip` — scoped rules
  keep the legacy 640px table layout there.
- Legacy decorative classes preserved by name (greek-meander-bkgd, gold/
  aluminum-foil-bkgd, marble-bkgd, fatepoints-line-bkgd incl. its original
  base64 line png).
- CSS asset URLs are relative (`../assets/...`) so the system works regardless
  of route prefix.

Exit criteria: every class referenced by templates/*.hbs exists in
styles/hellas.css (checked in Phase 7's audit); sheet renders legibly in light
and dark core themes.

Status: ✅ complete
