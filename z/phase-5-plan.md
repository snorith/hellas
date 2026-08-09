# Phase 5 — AppV2 sheets

Goal: all sheets on ApplicationV2 + HandlebarsApplicationMixin. No jQuery, no
tooltipster, no custom Handlebars helpers (everything precomputed in
_prepareContext — the legacy setVar/repeat/ifIn/breaklines helpers die here).

Verified idioms (2026-08, live sdm system + wiki conversion guide + dnd5e):
- `foundry.applications.sheets.ItemSheetV2/ActorSheetV2` + `api.HandlebarsApplicationMixin`
- static DEFAULT_OPTIONS {classes, position, window, form: {submitOnChange}, actions}
- static PARTS incl. core `templates/generic/tab-navigation.hbs`; per-type parts
  chosen in `_configureRenderOptions`
- `_getTabs(parts)` → `{id, group, cssClass, label}` records; `this.tabGroups`
  holds active tab; each tab template root: `<section class="tab {{tab.cssClass}}"
  data-group data-tab>`; `context.tab` assigned in `_preparePartContext`
- Rich text: `<prose-mirror name="system.X" data-document-uuid value toggled>`
  wrapping `TextEditor.implementation.enrichHTML` output; read-only shows
  enriched HTML only
- ActorSheetV2 auto drag/drop: `.draggable` class + `data-item-id`
- Image editing via an `onEditImage` action + `FilePicker.implementation`

## 5a — Item sheets (this sub-phase)

- `module/sheets/item-sheet.mjs` — ONE class for all five types (legacy had five
  near-identical classes). Parts: header, tabs, `<type>`, description.
  Type-specific context: skill choice lists re-derived live from HELLAS +
  current (normalized) values; weapon/dynamism skill pickers from
  `actor.getSkillsBySkillIDPrefix("weapon"|"mode")` with sentinel first option;
  armor type optgroups precomputed; guidance-note booleans replace the legacy
  setVar template logic. Skills show the derived name as a heading (no name
  input — F5 name sync happens in _preUpdate); other types keep the name input.
- Templates: `templates/item/{header,skill,weapon,armor,dynamism,talent,description}.hbs`.
- F12 fixed (armor parry title now HELLAS.armor.parry.title).
- Registration: `Items.registerSheet("hellas", …, {makeDefault: true})` for all
  five types; core v1 ItemSheet unregistered.

## 5b — Actor sheet + settings (next sub-phase)

- `module/sheets/actor-sheet.mjs` — parts: header, tabs, attributes,
  disadvantages, personal, biography. Actions (ALL isEditable-gated, incl.
  rolls): attrRoll, skillRoll, weaponRoll, dynamismRoll, initiativeRoll,
  armorToggle, itemCreate (F17: name+type only), itemEdit, itemDelete
  (DialogV2.confirm), fateSet (F8: persists via actor.update), onEditImage.
- Item-row tooltips: data-tooltip-html with per-item HTML precomputed in
  _prepareContext from small tooltip partials (replaces hidden-div+tooltipster);
  fixes F9 (talent tooltip showed dynamism notes).
- Static XP / Hero-Point rules tooltips preserved verbatim as partials.
- F10: localize the hardcoded disadvantages/personal-tab strings (new
  HELLAS.sheet.* keys in en.json); F11 (third-path id/for) and F13 (tab class)
  fixed by the rewrite.
- Fate dots precomputed as an array; skull on last dot; label click → 0.
- Trademark notice: `game.settings.registerMenu` + minimal AppV2 showing the
  legacy notice text verbatim.

Exit criteria: node --check green; every data-action has a handler and vice
versa; every {{localize}} key exists; system boots with all sheets registered.

Status: ✅ complete (5a item sheets · 5b actor sheet + settings menu)
