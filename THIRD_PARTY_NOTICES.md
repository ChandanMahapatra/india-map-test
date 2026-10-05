# Third-party skill credits

Chandan Mahapatra maintains India Accident Analysis and its template integration. Third-party agent instructions remain the work of their original authors and contributors. These notices concern skills and development guidance; they do not assign one license to the entire application or its boundary/accident datasets.

## MapLibre Agent Skills

- Original project: [maplibre/maplibre-agent-skills](https://github.com/maplibre/maplibre-agent-skills).
- Copyright: **2026 MapLibre contributors**. Portions may be adapted from [mapbox-agent-skills](https://github.com/mapbox/mapbox-agent-skills); those portions retain **Copyright (c) Mapbox, Inc.**
- Bundled snapshot: `fa618af49728952f7aeca842ad93f51b9b530018`, retrieved 2026-10-05; ten skill directories copied unchanged.
- Terms: [original MIT license](.agents/skills/MAPLIBRE-LICENSE.md) and [original notice](.agents/skills/MAPLIBRE-NOTICE).
- Use here: the source-wiring skill informed the implementation. Other bundled skills are references for future work, not claims of features implemented or skills applied.

## Jakub Krehel's better-\* skills

- Original author: **[Jakub Krehel](https://jakub.kr/)**.
- Original project: [jakubkrehel/skills](https://github.com/jakubkrehel/skills); [author's skill catalogue](https://jakub.kr/skills).
- Copyright: **2026 Jakub Krehel**.
- Bundled snapshot: `0c1f1e5b2481e86c168301bebb6aa3869691ac78`; better-ui and better-colors, including references and agent metadata, verified against that commit byte-for-byte.
- Terms: [original MIT license](.agents/skills/BETTER-SKILLS-LICENSE.md).
- Use here: UI polish and semantic color/palette/contrast guidance. The files arrived via the project owner's local skill installation; this does not make the owner their original author.

## Additional development guidance, not bundled

The [OpenAI Playwright skill](https://github.com/openai/skills/tree/main/skills/.curated/playwright), using [Microsoft Playwright](https://github.com/microsoft/playwright), supported browser verification and screenshots. [Vercel's React best-practices guidance](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) was used through the installed Vercel plugin for React review. These links identify published sources; exact revisions of the installed development tooling were not recorded. Their skill files are not redistributed in this repository.

## Reusing this template

Retain these credits and the relevant license files when distributing the bundled skills. Record new source commits and local modifications when updating them. Keep the difference between original authors, upstream contributors, template maintainers and implementation work explicit. See the [skill catalogue](.agents/skills/README.md) for task-level usage and update instructions.
