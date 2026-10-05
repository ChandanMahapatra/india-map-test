# Working on this template

This is a React + Vite application using MapLibre GL JS and Base UI. The reference app shows Indian state/UT road accident counts for 2018–2022; the reusable geometry and selection primitives support other datasets and administrative levels. Read `README.md` and `docs/boundary-provenance.md` before changing geography or statistics.

## Skills

Repository skills live in `.agents/skills/`. Use the relevant skill, not every skill on every task. If your agent cannot discover that directory, read the indicated `SKILL.md` directly. See `.agents/skills/README.md` for provenance, versions and additional MapLibre topics.

| Task                                                 | Read first                                       |
| ---------------------------------------------------- | ------------------------------------------------ |
| Sources, blank maps, stable feature IDs, layer order | `.agents/skills/maplibre-source-wiring/SKILL.md` |
| Labels, halos, choropleths and visual hierarchy      | `.agents/skills/maplibre-cartography/SKILL.md`   |
| Font stacks, glyph URLs or multilingual labels       | `.agents/skills/maplibre-fonts-glyphs/SKILL.md`  |
| Choosing GeoJSON versus vector tiles                 | `.agents/skills/maplibre-tile-sources/SKILL.md`  |
| UI components, states, icons and motion              | `.agents/skills/better-ui/SKILL.md`              |
| Semantic colors, palettes and measured contrast      | `.agents/skills/better-colors/SKILL.md`          |

Skill examples may target newer SDK versions or other frameworks. Check `package-lock.json` and this app's architecture before applying them. Project requirements and the user's request take precedence over generic skill advice. Do not upgrade MapLibre, replace Base UI, add a basemap or introduce a new framework merely because a skill describes it.

## Code map

- `src/lib/aoi.js`: normalization, stable IDs, full geometry bounds, selection and GeoJSON export. Keep this independent of React and the accident domain.
- `src/lib/MapView.jsx`: map lifecycle, sources/layers, labels, selection rendering and imperative `fit`, `home`, `zoom`, `extent` methods.
- `src/App.jsx`: selection state, boundary/data loading, Base UI controls and domain composition.
- `src/lib/accidents.js` and `AccidentOverview.jsx`: accident-specific aggregation, styling and charts; replace these for another domain.
- `static/boundary-manifest.json`: source IDs, parent relationships and provenance. District geometry loads by parent state.
- `scripts/`: reproducible boundary, data and label preparation. Python tools require the dependencies described in the provenance guide; they are not required to run the frontend.

## Geography and map rendering

- Preserve India's representation from the supplied Indian government source geometry. Country geometry is derived from the states. Keep islands, holes and all MultiPolygon components; never infer the selected extent from currently rendered tiles.
- Do not introduce UN/world boundary lines through a basemap. If a new basemap is explicitly requested, inspect its political layers and ensure the final displayed boundaries meet the project's representation requirement. Nearby country/sea labels are context points, not boundary datasets.
- Keep normalized `aoi_id` stable and use `promoteId: 'aoi_id'`. Avoid array-index IDs. Map clicks and list controls must update the same selection IDs.
- Create sources/layers after the map loads. Update data without rebuilding the map; clean up listeners, ResizeObserver and map instances. Verify React StrictMode does not leave duplicate maps or report errors from disposed instances.
- Render fills and boundary/selection lines below symbol labels. Use state label anchors from `static/map-labels.geojson` and MapLibre symbol layers rather than floating hover cards. Maintain collision handling and legibility over every choropleth class.
- All fetches, labels and glyphs must respect `import.meta.env.BASE_URL`; test the repository subpath used by Pages. The bundled Latin glyph range is 0–255; add appropriate fonts/ranges when adding scripts or languages.

## Selection and data behavior

- Fit the combined full geometry after every single/multiple selection change. Clearing returns the camera home. Switching administrative levels clears stale selection/search and returns home; switching district parents also clears child selection and cancels stale loads.
- This app enables only state/UT selection. Hide the level control when only one level is enabled. Other apps can enable state/district controls through `enabledLevels`; see README for Country tabs and custom AOIs.
- Home and the India breadcrumb restore the national overview. Map guidance appears only before the first interaction and does not return on Clear/Home within the same page session.
- Join observations to geography by stable IDs, not labels. Missing is not zero. Do not allocate state statistics to districts without a documented aggregation method and appropriate observations.
- Keep year, legend, map colors, selection totals and chart synchronized. Disclose historical boundary changes, data vintage, unavailable values and metric units. Never describe counts as population-adjusted risk.
- Export original selected geometry with representation, source provenance and extent metadata. Multiple selection exports individual features unless a dissolve is explicitly requested.

## UI and accessibility

Use Base UI for custom controls. Preserve keyboard operation, visible focus, accessible names, loading/retry/empty states and usable non-map selection if WebGL fails. Keep domain copy in the app and developer instructions in README. Use semantic CSS tokens; keep accident magnitude distinct from selection emphasis. Measure contrast against the actual rendered background. Respect reduced motion and verify desktop/mobile layouts without overflow or overlapping map controls.

## Verification and delivery

Use Node.js 22 or newer. Run `npm ci` when dependencies need installing. For implementation changes, run `npm test`, `npm run lint` and `npm run build`; for deployment/base-path changes also run `BASE_PATH=india-map-test npm run build` (or the new repository name). Documentation-only changes need formatting and link checks rather than unrelated browser tests.

For interaction changes, use the available browser tooling to check list/map selection, combined fitting, Clear/Home, year synchronization, keyboard controls and mobile layout. If district selection changes, check parent changes during a pending request, caching and retry. For boundary changes run `scripts/verify-boundaries.py`; regenerate label anchors with `scripts/prepare-labels.py`. Preserve source terms and transformation records.

Refresh `docs/screenshot.png` after visible changes and keep README accurate about actual capabilities. Do not commit build output, node_modules, temporary browser artifacts or credentials. Publish only when requested or already authorized; the workflow builds `master` and deploys `build/` to `gh-pages`. Report what changed, checks performed and any material limitation.
