# Manual verification checklist (Foundry v13 stable, then v14 if available)

Setup: symlink this repo into `<userdata>/Data/systems/hellas`, run
`node tools/build-packs.mjs` once (packs are gitignored), launch Foundry,
create a fresh world on the Hellas system. Keep the console (F12) open —
**any red error at any step is a finding**.

## A. Boot & compendia
- [ ] World loads, no console errors; system shows v0.4.0.
- [ ] Three compendia visible: System Skills (64), System Talents (75), System Dynamisms (30).
- [ ] Open items from each pack: images load (`assets/icons/*.svg`), notes render as rich text.

## B. Character basics
- [ ] Create Actor → only type "Character" offered; sheet opens (marble background, meander strips, Caesar Dressing headings).
- [ ] Header: set name, epithet, race, profession, deity — each persists after close/reopen.
- [ ] Portrait click opens FilePicker; chosen image persists.
- [ ] Set all 10 attribute values (try negatives and blanking a field — blank must not become 0 silently corrupting; it displays 0 via derived data but stores null).
- [ ] HP current/max, Glory, Hero Points, XP (free text like "3/12") persist.
- [ ] Hero Points ⓘ and XP ⓘ tooltips show the rules tables.
- [ ] Fate dots: click dot 3 → dots 1–3 fill; **reload world** → still 3 (this was legacy bug F8). Click the FATE label → 0. Last dot shows the skull.

## C. Skills
- [ ] Add skill (+): "New Skill" appears; open it — derived name heading, no name input.
- [ ] Pick "Athletics" → specifier select fills (Swimming…), attribute select shows CON/DEX/SPD/STR; name becomes "Athletics: Swimming"-style; row shows Level / Attr / Rating.
- [ ] Rating = level.value + attribute value; change the attribute value on the sheet → skill Rating updates on next render.
- [ ] Specifier "Specify" enables the custom text field; typed value appears in the name.
- [ ] Pick skill "Mode" → specifier lists the 8 dynamism modes; third select shows mode types; single-type modes (Influence) disable the select.
- [ ] Drag skills from the System Skills compendium onto the sheet — they land, name re-derives, rating includes the actor's attribute.
- [ ] Skill ⓘ tooltip: image, level/attr/rating table, notes; greyed-out ⓘ when notes empty.

## D. Rolls (dialog + omega outcomes; chat cards always public)
- [ ] Attribute d20: dialog opens focused on DoD; Cancel → no roll. Roll → chat card with outcome (≤0 critfail / 1–5 fail / 6–10 partial / 11–19 success / 20+ crit) and the modifier breakdown.
- [ ] Skill roll uses Rating (level.max); rolling **Parry** with a shield active includes the armor parry modifier in the prefilled Modifier.
- [ ] DEX-based skill with heavy armor active (armor STR > character STR): prefilled Modifier is negative by the shortfall.
- [ ] Multiple actions: count 2 with SPD 3 → penalty −7 in the breakdown (2×−5+3, clamped ≤0).
- [ ] Weapon roll, skillid = Combat Rating sentinel → rolls off CR, chat names "Combat Rating".
- [ ] Weapon linked to a weapon-skill → rolls off that skill's Rating; delete the skill → roll errors with "No associated skill found".
- [ ] Weapon with STR 5 vs character STR 3: prefilled modifier −4 (−2×2) + ACC; tick is-missile → −8 + ACC.
- [ ] Dynamism with sentinel skill → error notification, no dialog. Linked to a Mode skill → dialog prefilled with the dynamism's DoD.
- [ ] Initiative: both buttons roll d20+SPD+modifier with NO dialog and NO outcome line; combat tracker rolls `1d20 + SPD + first-mod + SPD/100` with 2 decimals.

## E. Weapons/Armor/Talents/Dynamisms tables
- [ ] Create/edit/delete each type from its table (+ / pencil / trash with confirm).
- [ ] Weapon sheet: skill dropdown lists only skills whose id starts with `weapon`; dynamism sheet lists only `mode` skills.
- [ ] Armor active checkbox toggles; footer totals update: PR sums, DEX modifier goes negative when armor STR exceeds character STR, PER sums; parry feeds Parry rolls.
- [ ] DR/PR columns show modifier suffix (e.g. "5A" for aether); tooltips show full modifier descriptions for non-regular.
- [ ] Item rows drag-reorder / drag between actors (core sort + ActorSheetV2 drop).

## F. Other tabs
- [ ] Disadvantages: three rating+info blocks, Possessions, Special Abilities, 4 Ambitions — all persist.
- [ ] Personal: family tree (6 children), birth, notes, gift/mark/encounter/destiny/fate/deeds with flavor blurbs, 5 Callings — all persist (check Third Path notes saves — legacy F11).
- [ ] Description tab: rich editor saves biography.

## G. Permissions (legacy parity: observers can't act)
- [ ] Second (player) user with OBSERVER on the actor: sheet opens read-only; d20 buttons, fate dots, +/edit/delete do nothing; no roll dialog.
- [ ] OWNER player: everything works.

## H. Migration from v0.3.6 world
- [ ] Take a copy of a legacy 0.7-era world (or build one in Foundry 0.7.9 from the old system), update the system folder to this build, launch through v11→v12→v13 as needed for the CORE migration, then open with this system.
- [ ] Character loads: attributes/HP/fate values intact; children fields intact (incl. old `sxithborn` → sixthborn); ambitions 1–4 present; blank number fields did NOT become 0s where they were blank.
- [ ] Owned skills keep their levels; names re-derive; weapons still point at their skills (item-id refs).
- [ ] Compendium references in old journals (`Compendium.hellas.systemSkills.<id>`) still resolve.

## I. Settings
- [ ] Settings → Hellas → "View Trademark Notice" opens the Khepera notice verbatim.

## J. Dark mode
- [ ] Switch core theme to dark: sheets stay legible (dark ink on marble), dialogs/chat cards themed by core, tooltips readable.
