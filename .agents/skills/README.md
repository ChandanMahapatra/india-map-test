# Repository skills

These skill files travel with the template. Agents that support project skills can discover `.agents/skills/<name>/SKILL.md`; others can read the files directly using the task table in the root [AGENTS.md](../../AGENTS.md). No globally installed skill or machine-specific path is required. Skills are development guidance, not runtime app dependencies.

## MapLibre bundle

Authors/maintainers: **MapLibre contributors**, with retained **Mapbox, Inc.** credits for adapted material (see the notice). Source: [maplibre/maplibre-agent-skills](https://github.com/maplibre/maplibre-agent-skills). Snapshot: [`fa618af49728952f7aeca842ad93f51b9b530018`](https://github.com/maplibre/maplibre-agent-skills/tree/fa618af49728952f7aeca842ad93f51b9b530018), retrieved 2026-10-05. All ten upstream skill directories are copied unchanged so their sibling skill links resolve. The upstream [MIT license](MAPLIBRE-LICENSE.md) and [notice](MAPLIBRE-NOTICE) are included; these terms apply to the MapLibre material, not automatically to other files in this repository.

The source-wiring skill informed this implementation's source/layer wiring and stable feature IDs. Cartography, fonts/glyphs and tile-source skills are particularly relevant for future map work. The bundle also includes optional PMTiles, terrain, Mapbox migration, v6 migration, skill authoring and evaluation guidance. Their presence does not mean this app uses those capabilities. Evaluation/authoring workflows may require scripts and fixtures from the upstream repository, which are not bundled here.

To refresh: check out the desired upstream commit in a temporary directory, review its changes, replace the `maplibre-*` skill directories and both notices, then record the new commit here. Do not follow a moving branch silently. Validate advice against the installed MapLibre version before changing application code.

## Better skills used here

- [better-ui](better-ui/SKILL.md): surfaces, icons, feedback, motion and component polish, including its supporting references.
- [better-colors](better-colors/SKILL.md): semantic color usage, OKLCH palettes, contrast and gamut, including its supporting references.

Original author: **[Jakub Krehel](https://jakub.kr/)**. Source: **[jakubkrehel/skills](https://github.com/jakubkrehel/skills)**, also documented at [Jakub's skills page](https://jakub.kr/skills).

The bundled files (SKILL.md, supporting references and agent metadata) match upstream commit [`0c1f1e5b2481e86c168301bebb6aa3869691ac78`](https://github.com/jakubkrehel/skills/tree/0c1f1e5b2481e86c168301bebb6aa3869691ac78) byte-for-byte. They were copied through this project's local skill installation on 2026-10-05; that installation is a delivery source, not the original author. These are historical, unmodified snapshots rather than the current upstream release. The original **Copyright (c) 2026 Jakub Krehel** and [MIT license](BETTER-SKILLS-LICENSE.md) are retained. Chandan Mahapatra maintains this template and its integration; the better-\* skill content remains credited to Jakub.

To refresh these skills, select an upstream commit, review changes to both skills and their supporting references, copy them with the original license, and update the recorded revision. Keep attribution when forking or redistributing the template.

## What was used in this project

| Skill / guidance                   | Author or maintainer and source                                                                                                                              | Application here                                                      | Bundled? |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | -------- |
| maplibre-source-wiring             | [MapLibre contributors](https://github.com/maplibre/maplibre-agent-skills/tree/fa618af49728952f7aeca842ad93f51b9b530018/skills/maplibre-source-wiring)       | Source/layer integration, stable feature IDs and `promoteId`          | Yes      |
| better-ui                          | [Jakub Krehel](https://github.com/jakubkrehel/skills/tree/0c1f1e5b2481e86c168301bebb6aa3869691ac78/skills/better-ui)                                         | Interface surfaces, icons, interaction feedback and restrained motion | Yes      |
| better-colors                      | [Jakub Krehel](https://github.com/jakubkrehel/skills/tree/0c1f1e5b2481e86c168301bebb6aa3869691ac78/skills/better-colors)                                     | Semantic color roles, palette and contrast guidance                   | Yes      |
| Playwright skill / browser tooling | [OpenAI skill](https://github.com/openai/skills/tree/main/skills/.curated/playwright), using [Microsoft Playwright](https://github.com/microsoft/playwright) | Browser checks, interactions and screenshots                          | No       |
| React best-practices guidance      | [Vercel](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices), accessed through the installed Vercel plugin                    | React lifecycle, hooks and component review                           | No       |

The remaining nine MapLibre skills are bundled for future template development, not claimed as applied during the original build. Links for unbundled guidance identify its published source; they do not claim that the local tooling exactly matched today's upstream version. These are agent instructions and development tools, not libraries embedded in the application. See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) for consolidated credits and license scope.

## Choosing skills

Read only the skill relevant to the requested change, then its necessary supporting references. Follow the root AGENTS.md for project-specific behavior. Browser verification during development used Playwright tooling; the project does not require that particular agent integration, and another browser tool can verify the same flows.
