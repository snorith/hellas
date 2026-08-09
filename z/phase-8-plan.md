# Phase 8 — Release workflow + docs

## Release pipeline (.github/workflows/release.yml)

Tag push `v*` →
1. checkout + node 22
2. `npm install` in tools/, `node tools/build-packs.mjs` (LevelDB packs)
3. jq-stamp `system.json` `.version` (tag minus `v`) and `.download`
   (tag-specific asset URL)
4. gate: `node tools/audit.mjs && node tools/test-migrations.mjs`
5. zip system payload (system.json, hellas.mjs, module, templates, styles,
   lang, assets, packs — excluding packs/_source) as `hellas-<tag>.zip`
6. GitHub release with `system.json` + zip attached, generated notes

Install channel: `https://github.com/snorith/hellas/releases/latest/download/system.json`.
No zips in the repo (the old committed `package/*.zip` were removed in Phase 1;
old tag URLs still serve their own trees).

## Tombstone manifest (hard-won rule 3)

- Legacy installs poll `https://raw.githubusercontent.com/snorith/hellas/master/src/system.json`.
- **There is no `master` branch** — it was renamed; GitHub serves `/master/`
  raw URLs from `main` via the rename redirect. Therefore the tombstone at
  `src/system.json` must be present on **main** when this ships (merging
  develop → main does that; verify the raw URL serves the tombstone after
  merge).
- Tombstone carries BOTH legacy keys (`name`, `minimumCoreVersion`,
  `compatibleCoreVersion`) and modern `id`/`compatibility`, pointing manifest +
  download at the GitHub-Releases channel.
- Deliberate choice: legacy `minimumCoreVersion` is set to `"13"` so ancient
  0.7-era cores REFUSE the update (they keep their working 0.3.6) while
  modern cores polling the old URL migrate to the new channel.

## Docs & cleanup

- README: install URL → releases channel, v13+ requirement note, new
  Development section (symlink + tools commands). All Khepera/licensing/credit
  text untouched.
- .gitignore: stale `dist` entry removed (foundryconfig.json entry kept — a
  local file some dev machines may still have).
- `src/` retirement: everything under src/ EXCEPT the tombstone
  `src/system.json` is deleted **after Stephen's manual checklist
  (z/CHECKLIST.md) passes** — until then it stays as the reference the
  standing decisions require. `z/` itself is removed before tagging.

## Ship sequence (for Stephen, after review loop + manual checklist)

1. Fold external review findings (ledger in z/PLAN.md).
2. Run z/CHECKLIST.md in Foundry v13 (and v14 if available).
3. `git rm -r` the legacy src/ (keep src/system.json tombstone), remove z/.
4. Commit on develop, merge → main, push.
5. Verify `https://raw.githubusercontent.com/snorith/hellas/master/src/system.json`
   serves the tombstone.
6. `git tag v0.4.0 && git push --tags` → workflow publishes the release.
7. Check the Foundry package listing points at the new manifest (foundryvtt.com
   admin) if listed.

Status: ✅ complete (ship sequence pending human steps)
