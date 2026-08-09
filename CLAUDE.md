# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A FoundryVTT game system for the HELLAS 2nd ed. RPG (fan-made, content under arrangement with Khepera Publishing). TypeScript + Handlebars + PostCSS/Tailwind, bundled with Rollup, orchestrated by gulp. Targets Foundry core 0.7.x (the old `entityClass`/`Entity` API, pre-`documents`). There are no tests and no linter.

## Commands

```shell
npm run build          # clean is NOT included: gulp build --development && gulp link
npm run build:watch    # rebuild on change (gulp watch --development)
npm run clean          # remove dist and unlink from Foundry data dir

# Production release (see build-readme.md)
NODE_ENV=production npm run build --production
NODE_ENV=production npm run package --production                      # zips dist/ into package/
NODE_ENV=production node_modules/gulp/bin/gulp.js publish -u <version> --production
```

- `gulp link` symlinks `dist/` into a local Foundry install's `Data/systems/hellas`. It requires a `foundryconfig.json` at the repo root (gitignored) with a `dataPath` key; `gulp publish` additionally needs `rawURL` and `repository` keys.
- `gulp publish -u <version|major|minor|patch>` bumps the version in both `package.json` and `src/system.json`, rewrites manifest/download URLs, rebuilds, zips, then git adds/commits/tags `v<version>`. It commits with `-a` — don't run it with unrelated work in the tree.
- Everything builds from `src/` into `dist/` (gitignored). Never edit `dist/`.

## Architecture

Entry point is `src/hellas.ts`, which on Foundry's `init` hook registers the actor/item classes, the actor sheet, and one item sheet per item type, sets the initiative formula, registers settings/Handlebars helpers (`src/module/settings.ts`), and preloads templates (`src/module/preloadTemplates.ts`).

- **Item polymorphism via Proxy**: Foundry 0.7 allows only one Item class, so `src/module/item/HellasItem.ts` is a `Proxy` whose `construct` trap switches on `data.type` and returns the matching concrete class (`HellasSkillItem`, `HellasWeaponItem`, `HellasArmorItem`, `HellasDynamismItem`, `HellasTalentItem`). Each concrete class declares its type via a static `get type()`, which is also used to register its sheet in `hellas.ts`. Adding an item type means touching: `template.json`, the new item class + sheet class, the Proxy switch, the registrations in `hellas.ts`, a `templates/item/*.hbs` sheet, and `preloadTemplates.ts`.
- **Data model** lives in `src/template.json` (Foundry's actor/item data schema), not in the TypeScript classes; the TS types in item files (e.g. `SkillItemDataType`) mirror it manually.
- **Rolling**: rolls resolve against the "omega table" in `src/module/dice.ts` (`determineDieRollOutcome`: total → critfail/fail/partialsuccess/success/critsuccess). `src/module/dialog/modifiers.ts` shows the pre-roll modifier dialog (armor penalties are auto-filled from equipped armor). Roll results render through chat cards in `src/templates/chat/`.
- **Game constants** (attributes, skill lists, dynamism modes, specific-vs-non-specific skill breakdowns) are centralized in `src/module/config.ts` as the `HELLAS` object, exposed at runtime as `game.HELLAS`.
- **Compendia**: `src/packs/*.db` are NeDB packs (skills, talents, dynamisms) declared in `src/system.json`. They're line-delimited JSON edited as data, not built from source.
- **i18n**: user-facing strings go through `game.i18n` with keys in `src/lang/en.json`. Skill/dynamism display names are composed from i18n keys (see `HellasSkillItem`), so config.ts entries and en.json keys must stay in sync.
- `src/system.json` version must match `package.json` (gulp publish keeps them in sync).

## Conventions

- Tabs for indentation; imports without semicolons in much of `src/module/` — match the file you're in.
- `master` is the release branch referenced by the manifest URL; day-to-day work happens on `develop`.
