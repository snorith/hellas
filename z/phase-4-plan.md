# Phase 4 — Documents & rolls

Goal: HellasActor/HellasItem document classes, the async roll engine (omega
table, DialogV2 modifier prompt, multiple-action penalty), chat cards, and
skill-name syncing via _preCreate/_preUpdate (replacing legacy prepare-time DB
writes). Verified against live dnd5e + official DialogV2 docs (2026-08):
`foundry.applications.api.DialogV2.wait` (button callback receives
`(event, button, dialog)`, `button.form.elements`, `rejectClose: false` → null),
`foundry.applications.handlebars.renderTemplate/loadTemplates`,
`await roll.evaluate()`, `CONST.DICE_ROLL_MODES.PUBLIC`.

## Files

- `module/dice.mjs` — `determineDieRollOutcome(total)` (omega table SPEC §6.1)
  and `multipleActionPenalty(count, spd)` (SPEC §6.3).
- `module/dialogs/roll-modifiers.mjs` — `getRollModifiers(baseModifier, dod)` →
  `{dod, nonproficiency, multipleactionscount, modifier}` or `null` on
  cancel/dismiss. DialogV2.wait, no jQuery, no inline scripts (F16); dod field
  autofocus+select via the wait `render` callback; dod tooltip via core
  `data-tooltip-html` (F16).
- `templates/dialog/modifiers.hbs` — ported form, `{{selectOptions}}`-free
  simple each-loop over 0–10 passed from context.
- `templates/chat/{attributeroll,skillroll,weaponroll,dynamismroll,initiativeroll}.hbs`
  — ported verbatim (keys unchanged), `system.` paths where applicable.
- `module/documents/actor.mjs` — HellasActor: `initiativeRoll('first'|'following')`
  (no dialog, no omega outcome), `attrRoll(attribute)` (armor-modifier baseline;
  F7: no unused rating param), `getSkillsBySkillIDPrefix(prefix)` (localeCompare
  sort, F18).
- `module/documents/item.mjs` — HellasItem:
  - default icons per type applied in `_preCreate` (updateSource), matching
    legacy DEFAULT_*_IMG values;
  - skill display-name sync in `_preCreate`/`_preUpdate` (F5): recompute
    Document#name from (merged) selector fields via the pure helpers exported
    from `module/data/skill.mjs` (`normalizeSkillSelectors`, `skillFullName`);
  - `roll()` dispatching to skill/weapon/dynamism rolls per SPEC §6.4 with the
    exact legacy formulas, sentinel handling, and error notifications.
- `hellas.mjs` — documentClass registration + template preload (chat + dialog).

## Deliberate behavior notes

- All rolls stay force-public (`rollMode: CONST.DICE_ROLL_MODES.PUBLIC`), as legacy.
- Weapon STR-shortfall penalty `(str − STR) × (ismissile ? −4 : −2)` plus `acc`
  prefills the dialog's Modifier field (editable by the player), as legacy.
- Dynamism with sentinel skillid refuses to roll with the legacy error text
  (now localized — new i18n keys HELLAS.notification.*, logged for F10 batch).

Exit criteria: `node --check` green on all new modules; templates reference only
existing i18n keys (+ the two new notification keys added to en.json); system
boots with document classes registered; rolls testable in Foundry once sheets
land (Phase 5) or via console (`game.actors.….attrRoll("strength")`).

Status: ✅ complete
