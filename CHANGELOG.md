# Changelog

## 0.4.0

Ground-up rewrite for Foundry VTT v13/v14 (requires Foundry v13.347+).

- Rebuilt on the modern Foundry architecture: data models with validation
  and automatic migration of legacy data, ApplicationV2 character and item
  sheets, native tooltips, and async dice rolling.
- A one-time world migration runs on first GM launch, upgrading data saved
  by the 0.3.x line (including field renames and blank-value cleanup).
- Compendia (skills, talents, dynamisms) rebuilt in the modern pack format
  with all content preserved.
- The system now installs and updates through GitHub Releases; existing
  installs are pointed at the new channel automatically.
- Twenty long-standing bugs from the 0.3.x line fixed, including fate
  points not saving when clicked, incorrect tooltip content on talents,
  and several mislabeled or missing translations.
- Zero build steps for developers: the repository root is the system.
  Fonts are bundled locally so the sheets render fully offline.

## 0.3.6 and earlier

The legacy 0.7.x-era line (2021). See the git history.
