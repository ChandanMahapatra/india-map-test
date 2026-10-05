# Repository skills

These skill files travel with the template. Agents that support project skills can discover `.agents/skills/<name>/SKILL.md`; others can read the files directly using the task table in the root [AGENTS.md](../../AGENTS.md). No globally installed skill or machine-specific path is required. Skills are development guidance, not runtime app dependencies.

## MapLibre bundle

Source: [maplibre/maplibre-agent-skills](https://github.com/maplibre/maplibre-agent-skills). Snapshot: [`fa618af49728952f7aeca842ad93f51b9b530018`](https://github.com/maplibre/maplibre-agent-skills/tree/fa618af49728952f7aeca842ad93f51b9b530018), retrieved 2026-10-05. All ten upstream skill directories are copied unchanged so their sibling skill links resolve. The upstream [MIT license](MAPLIBRE-LICENSE.md) and [notice](MAPLIBRE-NOTICE) are included; these terms apply to the MapLibre material, not automatically to other files in this repository.

The source-wiring skill informed this implementation's source/layer wiring and stable feature IDs. Cartography, fonts/glyphs and tile-source skills are particularly relevant for future map work. The bundle also includes optional PMTiles, terrain, Mapbox migration, v6 migration, skill authoring and evaluation guidance. Their presence does not mean this app uses those capabilities. Evaluation/authoring workflows may require scripts and fixtures from the upstream repository, which are not bundled here.

To refresh: check out the desired upstream commit in a temporary directory, review its changes, replace the `maplibre-*` skill directories and both notices, then record the new commit here. Do not follow a moving branch silently. Validate advice against the installed MapLibre version before changing application code.

## Better skills used here

- [better-ui](better-ui/SKILL.md): surfaces, icons, feedback, motion and component polish, including its supporting references.
- [better-colors](better-colors/SKILL.md): semantic color usage, OKLCH palettes, contrast and gamut, including its supporting references.

These are snapshots of the project owner's local skill library used during development, copied on 2026-10-05. Their source did not supply a separate license or upstream version identifier; no MapLibre MIT license is implied for these files. Keep this provenance when sharing the template and confirm redistribution terms before repackaging them as an independently licensed skill product.

## Choosing skills

Read only the skill relevant to the requested change, then its necessary supporting references. Follow the root AGENTS.md for project-specific behavior. Browser verification during development used Playwright tooling; the project does not require that particular agent integration, and another browser tool can verify the same flows.
